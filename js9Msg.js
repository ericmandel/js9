/*
 *
 * js9Msg.js: send messages to js9 via Node-based server (March 20, 2013)
 *
 * requires: socket.io
 *
 * Principals: Eric Mandel
 * Organization: Center for Astrophysics | Harvard & Smithsonian, Cambridge MA
 * Contact: emandel@cfa.harvard.edu
 *
 * Copyright (c) 2013 - 2022 Smithsonian Astrophysical Observatory
 *
 */

/* global */
/* eslint no-console: "off" */

"use strict";

// load required modules
const os = require('os'),
      fs = require('fs'),
      path = require('path'),
      timers = require('timers'),
      readline = require("readline"),
      open = require('open');

// internal variables
let s, msg;
let client = "socket.io-client";
let browser = "";
let content = "";
let webpage = "";
let debug = false;
let done = false;
let doserver = false;
let dopipe = false;
let nsendexit = false;
let verify = false;
let rl = null;
let socket = null;
let helperScheme = "http://";
let helperHost = "localhost";
let helperPort = 2718;
let helperURL=""; // will be composed after getting user options
let nsend = 0;
let timeout = 5000;
let tries = 20;
let timeout0 = Math.floor(timeout / tries);
const args = process.argv.slice(2);
const istty = process.stdin.isTTY  || false;
const msgdir = path.dirname(process.env.JS9_MSGSCRIPT||"");
const srcdir = process.env.JS9_SRCDIR;
const installdir = process.env.JS9_INSTALLDIR;
const defpage = "js9.html";
const prog = "js9";
const sockopts = {
    reconnection: false,
    timeout: 10000
};

// ever-present
const usage = function() {
  console.log("usage: %s [switches] [cmd] [args]", prog);
  console.log("usage: %s -b [bname] -w [url] [switches] [image]", prog);
  console.log("  switches:");
  console.log("    --help                    # print this message");
  console.log("    -b|--browser [bname]      # chrome|firefox|safari");
  console.log("    -d|--debug                # output debugging info");
  console.log("    -h|--host|--helper [host]  # helper host (def: localhost)");
  console.log("    -i|--id [id]              # client JS9 id (def: JS9)");
  console.log("    -m|--multi                # send to multiple clients");
  console.log("    --pageid [id]             # unique page id from server");
  console.log("    -|-p|--pipe               # read argument list from stdin");
  console.log("    -t|--timeout              # timeout for browser startup");
  console.log("    -v|--verify               # output verification info");
  console.log("    -w|--webpage [url]        # url to open in new browser");
  console.log(" ");
  console.log("  examples:");
  console.log("    %s help                  # list available commands", prog);
  console.log("    %s cmap heat             # change colormap to 'heat'", prog);
  console.log("    %s regions               # return current regions", prog);
  console.log("    %s --id myJS9 regions    # regions for this instance", prog);
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
const error = function(s){
    console.log(`ERROR: ${s}`);
    process.exit(1);
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
    if( this.args.length ){
	// js9 script quoted the strings (to deal with pathnames with spaces),
	// all of which can now be removed
	this.args = this.args.map((x) => {return x.replace(/\\/g,"");});
    }
};

// waitSend: wait a bit, send message, display results (and maybe exit)
JS9Msg.prototype.waitSend = function(tries){
    if( !tries ){
	error(`no targets found for: ${browser}`);
	return;
    }
    // wait a bit for js9 page to load
    timers.setTimeout(() => {
	msg.setArgs(["targets"]);
	socket.emit("msg", msg, (targets) => {
	    let i;
	    if( targets ){
		// all args are files to be loaded
		for(i=0; i<args.length; i++){
		    // use absolute paths
		    args[i] = path.resolve(args[i]);
		}
		// prefix with the load argument
		args.unshift("load");
		// set arguments
		msg.setArgs(args);
		// send message and display results
		msg.send(socket, null, "exit");
	    } else {
		this.waitSend(--tries);
	    }
	});
    }, timeout0);
};

// which web page do we use?
// changes globals: browser, webpage
JS9Msg.prototype.findWebpage = function(){
    if( !browser && !webpage ){
	return;
    }
    if( browser && !webpage ){
	if( process.env.JS9_WEBPAGE ){
	    webpage = process.env.JS9_WEBPAGE;
	}
	if( !webpage && msgdir && msgdir !== "NONE" ){
	    webpage = `${msgdir}/${defpage}`;
	    fs.access(webpage, fs.R_OK, (err) => {
		if( err ){ webpage = null; }
	    });
	}
	if( !webpage && installdir && installdir !== "NONE" ){
	    webpage = `${installdir}/${defpage}`;
	    fs.access(webpage, fs.R_OK, (err) => {
		if( err ){ webpage = null; }
	    });
	}
	if( !webpage && srcdir && srcdir !== "NONE" ){
	    webpage = `${srcdir}/${defpage}`;
	    fs.access(webpage, fs.R_OK, (err) => {
		if( err ){ webpage = null; }
	    });
	}
	if( !webpage && (srcdir || installdir) ){
	    error("can't find web page in src or install directory");
	}
    }
    // final checks
    if( browser && !webpage ){
	error("browser request needs a web page");
    }
    if( browser && webpage ){
	fs.access(webpage, fs.R_OK, (err) => {
	    if( err ){
		error(`can't find web page: ${webpage}`);
	    }
	});
    }
};

// start up browser and load web page
// changes globals: browser
JS9Msg.prototype.startBrowser = function(){
    let args;
    const opts = {wait: false};
    switch(browser){
    case "chrome":
	switch(os.type()){
	case "Darwin":
	    browser = "google chrome";
	    args = ["--allow-file-access-from-files"];
	    break;
	case "Linux":
	    args = ["--allow-file-access-from-files"];
	    break;
	}
	break;
    }
    if( browser ){
	if( args ){
	    opts.app = {name: browser, arguments: args};
	} else {
	    opts.app = {name: browser};
	}
    }
    if( verify ){
	console.log("webpage: %s, browser: %s %s", webpage, browser, args||"");
    }
    return open(webpage, opts);
};

// send: send message, display results (and maybe exit)
JS9Msg.prototype.send = function(socket, rl, postproc) {
    // copy to a temp msg
    const msg = JSON.parse(JSON.stringify(this));
    // now reset cmd parameters for next time
    this.reset();
    // send msg to js9
    if( debug ){
	console.log(`msg: ${JSON.stringify(msg)}`);
    }
    nsend++;
    socket.emit("msg", msg, (s) => {
	let t;
	nsend--;
	// post-processing of results
	switch(msg.cmd){
	case "help":
	    s = s.replace(/<table><tr>/g, "")
		 .replace(/<tr>/g, "\n")
		 .replace(/<\/td><td>/g,"     \t")
		 .replace(/<[a-z/]*>/g,"");
	    break;
	default:
	    break;
	}
	// display results
        if( s !== undefined && s !== null ){
	    switch(typeof s){
	    case "string":
		t = s;
		break;
	    case "object":
		try{ t = JSON.stringify(s); }
		catch(e){ t = ""; }
		break;
	    default:
		t = String(s);
		break;
	    }
	    // add newline to non-null return string, if necessary
	    if( t.length >= 1 && t.charAt(t.length-1) !== "\n" ){
		t += "\n";
	    }
	    process.stdout.write(t);
	}
	// post-processing
	switch(postproc){
	case 'exit':
	    // exit
	    this.exit(socket, rl, 0);
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
	    this.exit(socket, rl, 0);
	}
    });
};

// server mode
JS9Msg.prototype.server = function(socket, rl) {
    let args;
    rl.resume();
    if( istty ){
	rl.setPrompt('JS9> ');
	rl.prompt();
    }
    rl.on('line', (line) => {
	rl.pause();
	line = line.trim();
	if( debug ){
	    console.log(`new line: ${line}`);
	}
	switch(line) {
	case 'exit':
	case 'quit':
	case 'q':
	    // exit
	    this.exit(socket, rl, 0);
	    break;
	default:
	    args = line.split(" ");
	    // package msg (cmd and args)
	    this.setArgs(args);
	    // send message and display results
	    this.send(socket, rl, "prompt");
	    break;
	}	    
    }).on('close', () => {
	this.exit(socket, rl, 0);
    });
};

// clean exit
JS9Msg.prototype.exit = function(socket, rl, errno) {
    const res = errno || 0;
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
    case '--browser':
      args.shift();
      switch(args[0]){
      case "firefox":
      case "chrome":
      case "safari":
	  browser = args.shift();
	  break;
      default:
	  browser = process.env.JS9_BROWSER || "chrome";
      }
      break;
    case '--help':
      usage();
      break;
    case '-h':
    case '--helper':
    case '--host':
      args.shift();
      helperHost = args.shift();
      break;
    case '--helperPort':
      args.shift();
      helperPort = args.shift();
      break;
    case '--helperScheme':
      args.shift();
      helperScheme = args.shift();
      break;
    case '-i':
    case '--id':
      args.shift();
      msg.id = args.shift();
      break;
    case '-m':
    case '--multi':
      args.shift();
      msg.multi = true;
      break;
    case '--pageid':
      args.shift();
      msg.pageid = args.shift();
      break;
    case '-':
    case '-p':
    case '--pipe':
      args.shift();
      dopipe = true;
      break;
    case '-t':
    case '--timeout':
      args.shift();
      timeout = parseInt(args.shift(), 10);
      timeout0 = Math.floor(timeout / tries);
      break;
    case '-w':
    case '--webpage':
      args.shift();
      webpage = args.shift();
      break;
    case '-d':
    case '--debug':
      args.shift();
      debug = true;
      verify = true;
      break;
    case '-v':
    case '--verify':
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
    s = "";
    if( !helperHost.match(/:\/\//) ){
	s += helperScheme;
    }
    s += helperHost;
    if( !helperHost.match(/:[0-9][0-9]*$/) ){
	s += `:${helperPort}`;
    }
    helperURL = s;
}

// if no command, set up server mode
if( !browser && ((args.length === 0) || (args[0] === "")) ){
    if( verify ){ console.log("setting up server mode ..."); }
    // create readline interface
    rl = readline.createInterface({
	terminal: istty,
	input: process.stdin,
	output: process.stdout
    });
    rl.pause();
    doserver = true;
}

// debugging
if( verify ){ console.log("connecting to: %s (%s)", helperURL, client); }
// connect to the helper using the specified version of the socket.io client
socket = require(client).connect(helperURL, sockopts);
// check for connect errors
socket.on("connect_failed", () => {
    error(`connect failed: ${helperURL}`);
});
socket.on("connect_error", () => {
    error(`connect failed: ${helperURL}`);
});
// on connect, process the message
socket.on("connect", () => {
    if( doserver ){
	if( verify ){ console.log("entering server mode ..."); }
  	msg.server(socket, rl);
    } else {
	// find default web page, if necessary
	msg.findWebpage();
	// if we start up a web browser, we'll wait for it to connect
	if( webpage ){
	    // see if we already have a connection we can use
	    msg.setArgs(["targets"]);
	    socket.emit("msg", msg, (targets) => {
		// no connection: start up webpage in browser
		if( !targets ){
		    // eslint-disable-next-line no-unused-vars
		    msg.startBrowser().then((result) => {
			// wait for page to load and then send
			msg.waitSend(tries);
			// eslint-disable-next-line no-unused-vars
		    }, (err) => {
			error(`can't start up browser: ${browser}`);
		    });
		} else {
		    // browser is ready: all args are files to be loaded
		    for(let i=0; i<args.length; i++){
			// use absolute paths
			args[i] = path.resolve(args[i]);
		    }
		    // prefix with the load argument
		    args.unshift("load");
		    // set arguments
		    msg.setArgs(args);
		    // target found: send message and display results
		    msg.send(socket, null, "exit");
		}
	    });
	} else {
	    // package msg (cmd and args)
	    msg.setArgs(args);
	    if( verify ){
		console.log("%s: %s", msg.cmd, JSON.stringify(msg.args));
	    }
	    if( dopipe ){
		process.stdin.resume();
		process.stdin.on("data", (buf) => {
		    content += buf.toString();
		});
		process.stdin.on("end", () => {
		    // push the contents of stdin onto the arg array
		    // msg.args.push(content);
		    if( msg.args.length > 0 ){
			msg.args[msg.args.length-1] += `\n${content}`;
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
    }
});
