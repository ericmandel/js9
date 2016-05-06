/*
 *
 * js9Msg.js: send messages to js9 via Node-based server (March 20, 2013)
 *
 * requires: socket.io
 *
 */

/*jslint plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, node: true */

// load required modules
var sockio = require("socket.io/node_modules/socket.io-client"),
    os = require('os'),
    fs = require('fs'),
    path = require('path'),
    dns = require('dns'),
    opn = require('opn'),
    readline = require("readline");

// internal variables
var msg;
var args = process.argv.slice(2);
var browser = "";
var content = "";
var defpage = "/js9.html";
var debug = false;
var done = false;
var doserver = false;
var dopipe = false;
var helperScheme = "http://";
var helperHost = "localhost";
var helperPort = 2718;
var helperURL=""; // will be composed after getting user options
var host = "";
var istty = process.stdin.isTTY  || false;
var nsendexit = false;
var nsend = 0;
var pageReady = false;
var rl = null;
var socket = null;
var sockopts = {
    reconnection: false,
    timeout: 10000
};
var tries = 0;
var verify = false;
var webpage = "";
var srcdir = process.env.JS9_SRCDIR;
var installdir = process.env.JS9_INSTALLDIR;

// ever-present
var usage = function() {
  var prog = "js9";
  console.log("usage: %s [switches] [cmd] [args]", prog);
  console.log("usage: %s -b [bname] -w [url] [switches] [image]", prog);
  console.log("  switches:");
  console.log("    -help|--help             # print this message");
  console.log("    -b|-browser [bname]      # chrome|firefox|safari");
  console.log("    -h|-host|-helper [host]  # helper host (def: localhost)");
  console.log("    -i|-id [id]              # client JS9 id (def: JS9)");
  console.log("    -m|-multi                # send to multiple clients");
  console.log("    -|-p|-pipe               # read argument list from stdin");
  console.log("    -pageid [id]             # unique page id from server");
  console.log("    -w|-webpage [url]        # url to open in new browser");
  console.log(" ");
  console.log("  examples:");
  console.log("    %s help                  # list available commands", prog);
  console.log("    %s cmap heat             # change colormap to 'heat'", prog);
  console.log("    %s regions               # return current regions", prog);
  console.log("    %s -id myJS9 regions     # regions for this instance", prog);
  console.log("    %s                       # read commands from stdin", prog);
  console.log(" ");
  console.log("  start a local web page in a browser and load an image:");
  console.log("    # start firefox and load foo.fits into the myjs9.html page");
  console.log("    %s -b firefox -w ~/myjs9.html foo.fits", prog);
  console.log("    # display js9.html web page (or $JS9_WEBPAGE) in $JS9_BROWSER");
  console.log("    # and then load foo.fits");
  console.log("    %s -b foo.fits", prog);
  console.log("    # ... then carry on as usual");
  console.log("    %s cmap heat", prog);
  console.log(" ");
  console.log("  environment variables:");
  console.log("    JS9_BROWSER              # browser to use with -b (chrome|firefox|safari)");
  console.log("    JS9_WEBPAGE              # web page to use with -b (so -w not needed)");
  console.log("    JS9_SRCDIR               # where to look, if you don't build/install");
  console.log(" ");
  console.log("  notes:");
  console.log("  Linux Firefox restricts access to images within the web directory structure.");
  console.log("  See: https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally");
  console.log("  for work-arounds, or use Chrome (which we adjust auto-magically.)");
  process.exit(0);
};

// error message and exit
var error = function(s){
    console.log("ERROR: " + s);
    process.exit(1);
};

// which web page do we use?
// changes globals: browser, webpage
var findWebpage = function(){
    if( !browser && !webpage ){
	return;
    }
    if( browser && !webpage ){
	if( process.env.JS9_WEBPAGE ){
	    webpage = process.env.JS9_WEBPAGE;
	} else if( installdir ){
	    webpage = installdir + defpage;
	    fs.access(webpage, fs.R_OK, function(err) {
		if( err ){
		    if( srcdir ){
			webpage = srcdir + defpage;
			fs.access(webpage, fs.R_OK, function(err) {
			    if( err ){
				error("can't find default web page");
			    }
			});
		    } else {
			error("can't find default web page");
		    }
		}
	    });
	}
    }
    // final checks
    if( browser && !webpage ){
	error("browser request needs a web page");
    }
    if( browser && webpage ){
	fs.access(webpage, fs.R_OK, function(err) {
	    if( err ){
		error("can't find web page: " + webpage);
	    }
	});
    }
};

// start up browser and load web page
// changes globals: browser
var startBrowser = function(){
    var switches;
    var opts = {wait: false};
    switch(browser){
    case "chrome":
	switch(os.type()){
	case "Darwin":
	    browser = "google chrome";
	    switches = "--allow-file-access-from-files";
	    break;
	case "Linux":
	    switches = "--allow-file-access-from-files";
	    break;
	}
	break;
    }
    if( browser ){
	opts.app = [browser];
	if( switches ){
	    opts.app.push(switches);
	}
    }
    if( verify ){
	console.log("starting webpage: %s in browser: %s", webpage, browser);
    }
    opn(webpage, opts);
};

// message constructor
function JS9Msg(){
    this.cmd = "*";
    this.args = [];
    this.id = "JS9";
    this.browserip = "*";
    this.multi = false;
    this.pageid = null;
    this.timeout = 1000;
    this.tries = 5;
}

JS9Msg.prototype.reset = function() {
    // reset cmd parameters for next time
    this.cmd = "*";
    this.args = [];
};

// args: set cmd and args from array
JS9Msg.prototype.setArgs = function(args) {
    this.cmd = args[0];
    this.args = args.slice(1) || [];
};

// send: send message, display results (and maybe exit)
JS9Msg.prototype.send = function(socket, rl, postproc) {
    var that = this;
    // copy to a temp msg
    var msg = JSON.parse(JSON.stringify(this));
    // now reset cmd parameters for next time
    this.reset();
    // send msg to js9
    if( debug ){
	console.log("msg: " + JSON.stringify(msg));
    }
    nsend++;
    socket.emit("msg", msg, function(s){
	var t;
	nsend--;
	// post-processing of results
	switch(msg.cmd){
	case "help":
	    s = s.replace(/<table><tr>/g, "")
		 .replace(/<tr>/g, "\n")
		 .replace(/<\/td><td>/g,"     \t")
		 .replace(/<[a-z\/]*>/g,"");
	    break;
	default:
	    break;
	}
	// display results
        if( s ){
	    // on stab at converting objects to json
	    if( typeof s === "object" ){
		try{ t = JSON.stringify(s); }
		catch(e){ t = s; }
	    } else {
		t = s;
	    }
	    console.log(t);
	}
	// post-processing
	switch(postproc){
	case 'pageReady':
	    pageReady = true;
	    break;
	case 'exit':
	    // exit
	    that.exit(socket, rl, 0);
	    break;
	case 'prompt':
	    if( rl ){
		if( istty ){
		    rl.prompt();
		}
	    }
	    break;
	}
	if( nsendexit && !nsend ){
	    that.exit(socket, rl, 0);
	}
    });
};

// server mode
JS9Msg.prototype.server = function(socket, rl) {
    var that = this;
    var args;
    rl.resume();
    if( istty ){
	rl.setPrompt('JS9> ');
	rl.prompt();
    }
    rl.on('line', function(line) {
	rl.pause();
	line = line.trim();
	if( debug ){
	    console.log("new line: " + line);
	}
	switch(line) {
	case 'exit':
	case 'quit':
	case 'q':
	    // exit
	    that.exit(socket, rl, 0);
	    break;
	default:
	    args = line.split(" ");
	    // package msg (cmd and args)
	    that.setArgs(args);
	    // send message and display results
	    that.send(socket, rl, "prompt");
	    break;
	}	    
    }).on('close', function() {
	that.exit(socket, rl, 0);
    });
};

// clean exit
JS9Msg.prototype.exit = function(socket, rl, errno) {
    var res = errno || 0;
    if( nsend > 0 ){
	nsendexit = true;
	return;
    }
    if( rl ){
	rl.close();
    }
    if( socket ){
	socket.disconnect();
    }
    process.exit(res);
};

// baseline message object with default values
msg = new JS9Msg();

// get environment options
if( process.env.JS9_HELPER_HOST ){
    helperHost = process.env.JS9_HELPER_HOST;
}
if( process.env.JS9_HELPER_PORT ){
    helperPort = process.env.JS9_HELPER_PORT;
}
if( process.env.JS9_HELPER ){
    helperURL = process.env.JS9_HELPER;
}

// process optional switches
while( !done ){
  switch(args[0]){
    case '-b':
    case '-browser':
      args.shift();
      switch(args[0]){
      case "firefox":
      case "chrome":
      case "safari":
	  browser = args.shift();
	  break;
      default:
	  if( process.env.JS9_BROWSER ){
	      browser = process.env.JS9_BROWSER;
	  } else {
	      error("no browser specified");
	  }
      }
      break;
    case '-help':
    case '--help':
      usage();
      break;
    case '-h':
    case '-helper':
    case '-host':
      args.shift();
      helperHost = args.shift();
      break;
    case '-helperPort':
      args.shift();
      helperPort = args.shift();
      break;
    case '-helperScheme':
      args.shift();
      helperScheme = args.shift();
      break;
    case '-i':
    case '-id':
      args.shift();
      msg.id = args.shift();
      break;
    case '-m':
    case '-multi':
      args.shift();
      msg.multi = true;
      break;
    case '-pageid':
      args.shift();
      msg.pageid = args.shift();
      break;
    case '-':
    case '-p':
    case '-pipe':
      args.shift();
      dopipe = true;
      break;
    case '-w':
    case '-webpage':
      args.shift();
      webpage = args.shift();
      break;
    case '-d':
      args.shift();
      debug = true;
      verify = true;
      break;
    case '-v':
      args.shift();
      verify = true;
      break;
    default:
      done = true;
      break;
  }
}

// compose helper URL, if not done explicitly
if( !helperURL ){
    var s = "";
    if( !helperHost.match(/:\/\//) ){
	s += helperScheme;
    }
    s += helperHost;
    if( !helperHost.match(/:[0-9][0-9]*$/) ){
	s += ":" + helperPort;
    }
    helperURL = s;
}

// if no command, set up server mode
if( !browser && ((args.length === 0) || (args[0] === "")) ){
    if( verify ){
	console.log("setting up server mode ...");
    }
    // create readline interface
    rl = readline.createInterface({
	terminal: istty,
	input: process.stdin,
	output: process.stdout
    });
    rl.pause();
    doserver = true;
}

// kind of dumb: we want to convert the host name to an ip address, but the
// dns.lookup call is asynchronous, so we have to wrap all of the important
// code in its return function. wish we had a synchronous call!
dns.lookup(host, 4, function (err, address, family) {
    var i;
    if( err ){
	throw err;
    }
    if( address ){
	msg.browserip = address;
	if( verify ){
	    console.log('host ip: %s [%s]', msg.browserip, family);
	}
    }
    // debugging
    if( verify ){
	console.log("connecting to: %s (%s)", helperURL, msg.browserip);
    }
    // finally! connect to helper
    socket = sockio.connect(helperURL, sockopts);
    // check for connect errors
    socket.on("connect_failed", function(){
	error("connect failed: " + helperURL);
    });
    socket.on("connect_error", function(){
	error("connect failed: " + helperURL);
    });
    // and send the message
    socket.on("connect", function(){
	if( doserver ){
	    if( verify ){
		console.log("entering server mode ...");
	    }
  	    msg.server(socket, rl);
	} else {
	    // find default web page, if necessary
	    findWebpage();
	    // if we start up a web browser, we'll wait for it to connect
	    if( webpage ){
		// see if we already have a connection we can use
		msg.setArgs(["targets"]);
		socket.emit("msg", msg, function(targets){
		    // no connection: start up webpage in browser
		    if( !targets ){
			startBrowser();
		    }
		});
		// wait for page to be ready
		msg.pageReady = true;
		// when a browser is started, all args are files to be loaded
		// use absolute paths
		for(i=0; i<args.length; i++){
		    args[i] = path.resolve(args[i]);
		}
		args.unshift("load");
	    }
	    // package msg (cmd and args)
	    msg.setArgs(args);
	    if( verify ){
		console.log("%s: %s", msg.cmd, JSON.stringify(msg.args));
	    }
	    if( dopipe ){
		process.stdin.resume();
		process.stdin.on("data", function(buf) {
		    content += buf.toString();
		});
		process.stdin.on("end", function() {
		    // push the contents of stdin onto the arg array
		    // msg.args.push(content);
		    if( msg.args.length > 0 ){
			msg.args[msg.args.length-1] += "\n" + content;
		    } else {
			msg.args[0] = content;
		    }
		    // send message and display results
		    msg.send(socket, null, "exit");
		});
	    } else {
		// send message and display results
		msg.send(socket, null, "exit");
	    }
	}
    });
});
