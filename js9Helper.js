/*
 *
 * js9Helper: Node-based back-end server for JS9 (September 4, 2012)
 *
 * Principals: Eric Mandel
 * Organization: Harvard Smithsonian Center for Astrophysics, Cambridge MA
 * Contact: saord@cfa.harvard.edu
 *
 * Copyright (c) 2012 - 2014 Smithsonian Astrophysical Observatory
 *
 * Utilizes: socket.io, node-uuid
 *
 */

/*jslint bitwise: true, plusplus: true, vars: true, white: true, continue: true, unparam: true, regexp: true, browser: true, devel: true, node: true, stupid: true */

/*jshint smarttabs:true */

"use strict";

// load required modules
var http = require('http'),
    https = require('https'),
    Sockio = require('socket.io'),
    url = require('url'),
    qs = require('querystring'),
    cproc  = require("child_process"),
    fs     = require("fs"),
    uuid   = require('node-uuid'),
    rmdir = require('rimraf');

// internal variables
var app, io, secure;
var prefsfile = "js9Prefs.json";
var securefile = "js9Secure.json";
var fits2png = {};
var analysis = {str:[], pkgs:[]};
var envs = JSON.stringify(process.env);
var plugins = [];
var cdir = process.cwd();

// secure options ... change as necessary in securefile
var secureOpts = {
    // key: "path_to_private.key",          // openssl genrsa -out file 2014
    // cert: "path_to_certificate_file",    // from the certificate authority
    // ca: "path_to_certificate_authority"  // can be a chain file
};

// default options ... change as necessary in prefsfile
var globalOpts = {
    helperPort:       2718,
    helperHost:       "0.0.0.0",
    cmd:              "js9helper",
    analysisPlugins:  "./analysis-plugins",
    analysisWrappers: "./analysis-wrappers",
    helperPlugins:    "./helper-plugins",
    maxBinaryBuffer:  150*1024000, // exec buffer: good for 4096^2 64-bit image
    maxTextBuffer:    5*1024000,   // exec buffer: good for text
    textEncoding:     "ascii",     // encoding for returned stdout from exec
    workDir:          "",          // top-level working directory for exec
    workDirQuota:     50,          // quota on working directory (Mb)
    rmWorkDir:        true,        // remove workdir on disconnect?
    remoteMsgs:       1 // 0 => none, 1 => samehost, 2 => all
};

//
// functions that might depend on specific implementations of socket.io
//

// get ip address and port of the current socket or http connection
var getHost = function(io, req){
    // socket.io
    if( req.handshake ){
	return req.client.conn.remoteAddress;
    }
    // http server
    // http://stackoverflow.com/questions/19266329/node-js-get-clients-ip
    return (req.headers['x-forwarded-for'] || '').split(',')[0] ||
            req.connection.remoteAddress;
};

// http://stackoverflow.com/questions/6563885/socket-io-how-do-i-get-a-list-of-connected-sockets-clients
var findClientsSocket = function(io, namespace, roomId){
    var id, index;
    var res = [];
    var ns = io.of(namespace ||"/");    // the default namespace is "/"
    if(ns){
        for(id in ns.connected){
	    if( ns.connected.hasOwnProperty(id) ){
		if(roomId){
                    index = ns.connected[id].rooms.indexOf(roomId) ;
                    if(index !== -1){
			res.push(ns.connected[id]);
                    }
		} else {
                    res.push(ns.connected[id]);
		}
	    }
        }
    }
    return res;
};

// get list of all clients currently connected
var getClients = function(io, socket){
    return findClientsSocket(io);
};

// utility functions

// create a nice date/time string for logging
var datestr = function(){
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ' UTC');
};

// output a log message on the console
var clog = function(){
    var args = Array.prototype.slice.call(arguments, 0);
    args.push(" [" + datestr() + "]");
    console.log.apply(null, args);
};

// output an error message on the console
var cerr = function(){
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift("ERROR: ");
    args.push(" [" + datestr() + "]");
    console.log.apply(null, args);
};

// getTargets: identify target(s) for an external msg for a given ip
var getTargets = function(io, socket, msg){
    var i, j, c, clip;
    var displays;
    var browserip = msg.browserip || "*";
    var targets = [];
    // ip associated with this socket
    var myip = getHost(io, socket);
    // list of all clients connected on this socket
    var clients = getClients(io, socket);
    // authentication function
    var authenticate = function(myip, clip){
	// if I'm localhost, I can send to anyone
	if( (myip === "127.0.0.1") || (myip === "::ffff:127.0.0.1") ){
	    return true;
	}
	// I can send to myself, if we configured that way
	if( (myip === clip) && (globalOpts.remoteMsgs > 0) ){
	    return true;
	}
	// security risk: anyone can send to anyone
	if( globalOpts.remoteMsgs > 1 ){
	    return true;
	}
	// can't send to anyone
	return false;
    };
    // look at all clients
    for(i=0; i<clients.length; i++){
	// current client
	c = clients[i];
	// sanity check
	if( !c.js9 ){
	    continue;
	}
	// client ip
	clip = getHost(io, c);
	if( !authenticate(myip, clip) ){
	    continue;
	}
	// look for matching clients
	// pageid is a unique id associated with a specific page
	if( msg.pageid ){
	    if( msg.pageid === c.js9.pageid ){
		targets.push(c);
	    }
	} else if( ((browserip === "*") || (browserip === clip)) ){
	    // look for matches in display id
	    displays = c.js9.displays;
	    for(j=0; j<displays.length; j++){
		// look for matching displays
		if( (msg.id === "*") || (msg.id === displays[j]) ){
		    targets.push(c);
		}
	    }
	}
    }
    return targets;
};

// envClean: clean incoming environment variables
// this should match cleaning in js9Helper.cgi
var envClean = function(s) {
    if( typeof s === "string" ){
	return s.replace(/[`&]/g, "").replace(/\(\)[ 	]*\{.*/g, "");
    }
    return s;
};

var loadSecurePreferences = function(securefile){
    var s, obj, opt;
    var secure = false;
    if( fs.existsSync(securefile) ){
	s = fs.readFileSync(securefile, "utf-8");
	if( s ){
	    try{ obj = JSON.parse(s.toString()); }
	    catch(e){ cerr("can't parse: ", securefile, e); }
	    // merge opts into secureOpts
	    for( opt in obj ){
		if( obj.hasOwnProperty(opt) ){
		    switch(opt){
		    case "key":
			secureOpts.key = fs.readFileSync(obj[opt]);
			break;
		    case "cert":
			secureOpts.cert = fs.readFileSync(obj[opt]);
			break;
		    case "ca":
			secureOpts.ca = fs.readFileSync(obj[opt]);
			break;
		    default:
			cerr("unknown secure option: ", opt);
			break;
		    }
		}
	    }
	    // if we have a prefs file, we need to have defined required props
	    if( secureOpts.key && secureOpts.cert ){
		secure = true;
	    } else {
		cerr("missing one or more required secure properties");
	    }
	}
    }
    return secure;
};

// load preference file, if possible
var loadPreferences = function(prefsfile){
    var s, obj, opt, otype, jtype;
    if( fs.existsSync(prefsfile) ){
	s = fs.readFileSync(prefsfile, "utf-8");
	if( s ){
	    try{ obj = JSON.parse(s.toString()); }
	    catch(e){ cerr("can't parse: ", prefsfile, e); }
	    // look for globalOpts and merge
	    if( obj && obj.globalOpts ){
		for( opt in obj.globalOpts ){
		    if( obj.globalOpts.hasOwnProperty(opt) ){
			otype = typeof obj.globalOpts[opt];
			jtype = typeof globalOpts[opt];
			if( (jtype === otype) || (jtype === "undefined") ){
			    switch(otype){
			    case "number":
				globalOpts[opt] = obj.globalOpts[opt];
				break;
			    case "boolean":
				globalOpts[opt] = obj.globalOpts[opt];
				break;
			    case "string":
				globalOpts[opt] = obj.globalOpts[opt];
				break;
			    default:
				break;
			    }
			}
		    }
		}
	    }
	}
    }
};

// load analysis plugin files, if available
var loadAnalysisTasks = function(dir){
    if( fs.existsSync(dir) ){
	fs.readdir(dir, function(err, files){
	    var i, jstr, pathname;
	    for(i=0; i<files.length; i++){
		pathname = dir + "/" + files[i];
		if( fs.existsSync(pathname) ){
		    // only json files, please
		    if( !pathname.match(/.json$/) ){
			continue;
		    }
		    analysis.temp = fs.readFileSync(pathname, "utf-8");
		    if( analysis.temp ){
			jstr = analysis.temp.toString().trim();
			switch(files[i]){
			case "fits2png.json":
			    try{ fits2png = JSON.parse(jstr); }
			    catch(e1){cerr("can't parse: ", pathname, e1);}
			    break;
			default:
			    try{
				analysis.pkgs.push(JSON.parse(jstr));
				analysis.str.push(jstr);
			    }
			    catch(e2){cerr("can't parse: ", pathname, e2);}
			    break;
			}
		    }
		}
	    }
	});
    }
};

// addAnalysisTask: add to the list of analysis tasks sent to browser
var addAnalysisTask = function(obj) {
    analysis.pkgs.push(obj);
    analysis.str.push("[" + JSON.stringify(obj) + "]");
};

// load user-defined plugins, if possible
var loadHelperPlugins = function(dir){
    if( fs.existsSync(dir) ){
	fs.readdir(dir, function(err, files){
	    var i, x, pathname, name;
	    for(i=0; i<files.length; i++){
		pathname = dir + "/" + files[i];
		if( fs.existsSync(pathname) ){
		    // only js files, please
		    if( !pathname.match(/.js$/) ){
			continue;
		    }
		    // name of message
		    name = files[i].replace(/.js$/, "");
		    try{ x = require(pathname); }
		    catch(e){ cerr("warning: can't load: ", pathname); }
		    if( x ){
			plugins.push({name: name,
				      sockio: x.sockio,
				      http: x.http,
				      httpList: x.httpList});
		    }
		}
	    }
	});
    }
};

// parse an argument string into an array of arguments, where
// spaces and quotes are delimiters
var parseArgs = function(argstr){
    var targs, i, j, ci, c1, c2, s;
    var args = [];
    // split arguments on spaces
    targs = argstr.split(" ");
    // now re-combine quoted args into one arg
    for(i=0, j=0, ci=-1; i<targs.length; i++){
	// remove or rename dangerous characters
	s = targs[i].replace(/`/g, "").replace(/&/g, "__ampersand__");
	// are we re-combining?
	if( ci >= 0 ){
	    // yes, add to current arg
	    args[ci] = args[ci] + " " + s;
	} else {
	    // no, add another arg
	    args[j] = s;
	}
	if( ci === -1 ){
	    // new quoted string?
	    c1 = s.charAt(0);
	    c2 = s.charAt(s.length-1);
	    if( c1 === "'" || c1 === '"' ){
		// spread across more than one arg, so we need to recombine?
		if( c2 === c1 ){
		    // no just remove the quotes from this one
		    args[j] = args[j].substr(1,args[j].length-2);
		    j++;
		} else {
		    // yes
		    ci = j;
		}
	    } else {
		// no
		j++;
	    }
	} else {
	    // end of current quoted string?
	    c2 = s.charAt(s.length-1);
	    if( c2 === c1 ){
		// yes, remove enclosing quotes
		args[ci] = args[ci].substr(1,args[ci].length-2);
		ci = -1;
		j++;
	    }
	}
    }
    return args;
};

//
// message callbacks
//

// execCmd: exec a analysis wrapper function to run a command
// this is the default callback for server-side analysis tasks
var execCmd = function(io, socket, obj, cbfunc) {
    var cmd, argstr, args, maxbuf;
    var myworkdir = null;
    var myip = getHost(io, socket);
    var myid = obj.id;
    var myrtype = obj.rtype || "binary";
    var myenv = JSON.parse(envs);
    // sanity check
    if( !obj.cmd ){
	return;
    }
    // id of js9 display
    myenv.JS9_ID = envClean(myid);
    // host ip
    myenv.JS9_HOST = envClean(myip);
    // JS9 base dir
    myenv.JS9_DIR = cdir;
    // JS9 unique page id
    myenv.JS9_PAGEID = 	socket.js9.pageid;
    // js9 cookie in the sending browser
    if( obj.cookie ){
	myenv.HTTP_COOKIE = envClean(obj.cookie);
    }
    // datapath (for finding data files)
    if( obj.dataPath ){
	myenv.JS9_DATAPATH = envClean(obj.dataPath);
    } else if( globalOpts.dataPath ){
	myenv.JS9_DATAPATH = envClean(globalOpts.dataPath);
    }
    // set max buffer size
    switch(myrtype){
    case "text":
    case "plot":
    case "alert":
	maxbuf = globalOpts.maxTextBuffer;
	break;
    default:
	maxbuf = globalOpts.maxBinaryBuffer;
	break;
    }
    // the command string
    argstr = obj.cmd || "";
    // expand directory macros
    argstr = argstr
	.replace(/\$\{?JS9_DIR\}?/, cdir)
	.replace(/\$\{?JS9_WORKDIR\}?/, (socket.js9.workDir || ""));
    // split arguments on spaces, respecting quotes
    args = parseArgs(argstr);
    // get commmand to execute
    if( args[0] === globalOpts.cmd ){
	// handle fitshelper specially
	cmd = args[0];
    } else {
	// start in the appropriate work directory, if possible
	if( (obj.useWorkDir !== false) && socket.js9 && socket.js9.workDir ){
	    myworkdir = socket.js9.workDir;
	    // working directory relative to JS9 dir
	    myenv.JS9_WORKDIR = myworkdir;
	    myenv.JS9_WORKDIR_QUOTA = globalOpts.workDirQuota;
	}
	// construct wrapper
	cmd = globalOpts.analysisWrappers + "/" + args[0];
	// make path absolute in case we change directories
	if( cmd.charAt(0) !== "/" ){
	    cmd = cdir + "/" + cmd;
	}
    }
    // log what we are about to do
    clog("exec: %s [%s]", cmd, args.slice(1));
    // execute the analysis script with cmd arguments
    // NB: can't use exec because it's shell breaks, e.g. region command lines
    cproc.execFile(cmd, args.slice(1),
		   { encoding: "utf8",
		     timeout: 0,
		     maxBuffer: maxbuf,
		     killSignal: "SIGTERM",
		     cwd: myworkdir,
		     env: myenv
		   },
		   // return from exec
		   function(errcode, stdout, stderr) {
		       var res={stdout: null, stderr: null};
		       if( errcode ){
			   res.errcode = errcode.errno || errcode.code;
		       }
		       if( stdout ){
			   switch(myrtype){
			   case "text":
			   case "plot":
			   case "png":
			   case "alert":
			       res.encoding = globalOpts.textEncoding;
			       res.stdout = stdout.toString(res.encoding);
			       break;
			   default:
			       res.encoding = "binary";
			       res.stdout = stdout;
			       break;
			   }
		       }
		       if( stderr ){
			   res.stderr = stderr.toString();
		       }
		       // send results back to browser
		       if( cbfunc ){ cbfunc(res); }
		   });
};

// sendAnalysis: send list of analysis routines to browser
var sendAnalysisTasks = function(io, socket, obj, cbfunc) {
    var s;
    if( analysis && analysis.str.length ){
	s = "[" + analysis.str.join(",") + "]";
	if( cbfunc ){ cbfunc(s); }
    }
};

// pageReady: wait for a Web browser to load a JS9 page and connect
// used by js9Msg.js to start up a Web browser before executing commands
var pageReady = function(io, socket, obj, cbfunc, tries){
    var i, targets;
    var timeout = obj.timeout || 500;
    var maxtries = obj.tries || 10;
    // callback function
    var myfunc = function(s){
	if( cbfunc ){ cbfunc(s); }
    };
    setTimeout(function(){
	// look for targets
	targets = getTargets(io, socket, obj);
	// if we have at least one ...
	if( (targets.length === 1) || obj.multi ){
	    // send command to JS9 instance(s)
	    for(i=0; i<targets.length; i++){
		targets[i].emit("msg", obj, myfunc);
	    }
	} else {
	    // no targets: have we tried enough?
	    if( !targets.length ){
		if( tries < maxtries ){
		    // no, try again
		    pageReady(io, socket, obj, cbfunc, tries+1);
		} else {
		    // yes, it's an error
		    if( cbfunc ){
			cbfunc("ERROR: timeout waiting for Web page");
		    }
		}
	    } else {
		// it's an error
		if( cbfunc ){
		    cbfunc("ERROR: "+ targets.length +
			   " JS9 instance(s) found with" +
			   " id " + obj.id + " (" + obj.cmd+")");
		}
	    }
	}
    }, timeout);
};

// sendMsg: send a message to the browser
// this is the default callback for external communication with JS9
var sendMsg = function(io, socket, obj, cbfunc) {
    var i, targets;
    // callback function
    var myfunc = function(s){
	if( cbfunc ){ cbfunc(s); }
    };
    // get list of targets to send to
    targets = getTargets(io, socket, obj);
    // was that all that's wanted?
    if( obj.cmd === "targets" ){
	myfunc(targets.length);
	return;
    }
    // look for one target (or else that multi is allowed)
    if( (targets.length === 1) || obj.multi ){
	// send command to JS9 instance(s)
	for(i=0; i<targets.length; i++){
	    targets[i].emit("msg", obj, myfunc);
	}
    } else {
	// no targets: wait for the page to get ready?
	if( !targets.length && obj.pageReady ){
	    pageReady(io, socket, obj, cbfunc, 0);
	    return;
	}
	// it's an error
	if( cbfunc ){
            cbfunc("ERROR: "+targets.length+" JS9 instance(s) found with" +
		   " id " + obj.id + " (" + obj.cmd+")");
	}
    }
};

//
// protocol handlers
//

// socketio handler: field socket.io requests
var socketioHandler = function(socket) {
    var i, j, m, a;
    // function outside loop needed to make jslint happy
    var xfunc = function(obj, cbfunc) {
	if( !obj ){return;}
	// exec the analysis task (via a wrapper function)
	execCmd(io, socket, obj, cbfunc);
    };
    // on disconnect: display a console message
    // returns: N/A
    // for other implementations, this is needed if you want to:
    //   show disconnects in the log
    socket.on("disconnect", function() {
	var myhost = getHost(io, socket);
	// only show disconnect for displays (not js9 msgs)
	if( socket.js9 && socket.js9.displays ){
            clog("disconnect: %s (%s)",	myhost, socket.js9.displays);
	    // clean up working directory
	    if( socket.js9.workDir && globalOpts.rmWorkDir ){
		rmdir(socket.js9.workDir, function(error){
		    if( error ){
			cerr("can't delete workDir: ", error);
		    }
		});
	    }
	}
    });
    // on displays: set the list of displays for this connection
    // returns: unique page id (not currently used)
    // for other implementations, this is needed if you want to:
    //   support sending external messages to JS9 (i.e., via js9 script)
    socket.on("displays", function(obj, cbfunc) {
	var myhost = getHost(io, socket);
	if( !obj ){return;}
	socket.js9 = {};
	socket.js9.displays = obj.displays;
	socket.js9.pageid = uuid.v4();
	socket.js9.workDir = null;
	if( fs.existsSync(globalOpts.workDir) ){
	    socket.js9.workDir = globalOpts.workDir + "/" + socket.js9.pageid;
	    try{ fs.mkdirSync(socket.js9.workDir, parseInt('0755',8)); }
	    catch(e){
		cerr("can't create workDir: ", e.message);
		socket.js9.workDir = null;
	    }
	}
        clog("connect: %s (%s)", myhost, socket.js9.displays);
	if( cbfunc ){ cbfunc(socket.js9.pageid); }
    });
    // on display: add a display to the display list
    // returns: unique page id (not currently used)
    // for other implementations, this is needed if you want to:
    //   support sending external messages to JS9 (i.e., via js9 script)
    socket.on("addDisplay", function(obj, cbfunc) {
	if( !obj ){return;}
	socket.js9.displays = socket.js9.displays || [];
	socket.js9.displays.push(obj.display);
	if( cbfunc ){ cbfunc(socket.js9.pageid); }
    });
    // on alive: return "OK" to signal a valid connection
    socket.on("alive", function(obj, cbfunc) {
	    if( cbfunc ){ cbfunc("OK"); }
    });
    // on image: signal from JS9 that a new or redisplayed image is active
    // returns: [input file path, fits file path, fits + extension]
    // for other implementations, this is needed if you want to:
    //   get FITS filename associated with PNG representation files
    //   (args 1 and 2 will be identical when imaging FITS files)
    socket.on("image", function(obj, cbfunc) {
	if( !obj ){return;}
	if( globalOpts.cmd ){
	    // make up js9helper command
	    obj.cmd = globalOpts.cmd + " -i " + obj.image;
	    // exec the command
	    execCmd(io, socket, obj, cbfunc);
	}
    });
    // on getAnalysis: get analysis task definitions
    // returns: json string containing analysis task definitions
    // for other implementations, this is needed if you want to:
    //   support default server-side analysis (i.e. exec a wrapper script)
    socket.on("getAnalysis", function(obj, cbfunc) {
	if( !obj ){return;}
	sendAnalysisTasks(io, socket, obj, cbfunc);
    });
    // on runAnalysis: run an analysis task
    // returns: object w/ errcode, stderr (error string), stdout (results)
    // for other implementations, this is needed if you want to:
    //   support default server-side analysis (i.e. exec a wrapper script)
    // NB: retained for backward compatibility with old (cached) versions of JS9
    socket.on("runAnalysis", function(obj, cbfunc){
	if( !obj ){return;}
	// exec the analysis task (via a wrapper function)
	execCmd(io, socket, obj, cbfunc);
    });
    // NB: instead of runAnalysis, now we use a handler for each separate task
    // returns: object w/ errcode, stderr (error string), stdout (results)
    // for other implementations, this is needed if you want to:
    //   support default server-side analysis (i.e. exec a wrapper script)
    for(j=0; j<analysis.pkgs.length; j++){
	for(i=0; i<analysis.pkgs[j].length; i++){
	    a = analysis.pkgs[j][i];
	    // check for require workDir
	    if( a.workDir && !globalOpts.workDir ){
		continue;
	    }
	    // loadproxy must be enabled explicitly
	    if( a.name === "loadproxy" && !globalOpts.loadProxy ){
		continue;
	    }
	    m = a.xclass ? (a.xclass + ":" + a.name) : a.name;
	    socket.on(m, xfunc);
	}
    }
    // on fits2png: convert raw fits to png
    // returns: object w/ errcode, stderr (error string), stdout (results)
    // for other implementations, this is needed if you want to:
    //   support conversion of fits to png representation
    socket.on("fits2png", function(obj, cbfunc) {
	if( !obj ){return;}
	if( fits2png[0] && fits2png[0].action ){
	    // make up fits2png command string from defined fits2png action
	    obj.cmd = fits2png[0].action + " " + obj.fits;
	    // don't use a workdir
	    obj.useWorkDir = false;
	    // exec the conversion task (via a wrapper function)
	    execCmd(io, socket, obj, cbfunc);
	}
    });
    // on msg: send a command from an external source to a JS9 browser
    // nb: this msg comes from an external source, not from js9 itself
    // returns: results from JS9
    // for other implementations, this is needed if you want to:
    //   support sending external messages to JS9 (i.e., via js9 script)
    socket.on("msg", function(obj, cbfunc) {
	if( !obj ){return;}
	sendMsg(io, socket, obj, cbfunc);
    });
    // an example of site-specific in-line messsages
    if( process.env.NODEJS_FOO ){
	// After defining a foo message, you can do this in javascript:
	// JS9.Send("FOO:foo",{keys:{"x":1,"y":2}},function(r){dofunc(r)});
	socket.on("FOO:foo", function(obj, cbfunc) {
	    var s = "foo: " + JSON.stringify(obj.keys);
	    // analysis tasks should return an object containing one or more:
	    // error (error code), stdout (string result), stderr (error msg)
	    if( cbfunc ){ cbfunc({stdout: s}); }
	});
    }
    // add plugins
    for(i=0; i<plugins.length; i++){
	if( plugins[i].sockio ){
	    try{ plugins[i].sockio(io, socket); }
	    catch(e){ cerr("can't add %s", plugins[i].name); }
	}
    }
};

// httpd handler: field pseudo-socket.io http requests
// public api:
// wget $MYHOST'/msg?{"id": "'$ID'", "cmd": "SetColormap", "args": ["red"]}'
// wget $MYHOST'/msg?{"id": "'$ID'", "cmd": "GetColormap"}'
// js9 command line:
// wget $MYHOST'/msg?{"id": "'$ID'", "cmd": "zoom", "args": [2]}'
// wget $MYHOST'/msg?{"id": "'$ID'", "cmd": "zoom"}'
// analysis commands:
// wget $MYHOST'/counts?{"id": "'$ID'", "cmd": "counts", "args": ["counts"]}'
var httpHandler = function(req, res){
    var cmd, gobj, s, jstr;
    var body = "";
    // return error into to browser
    var htmlerr = function(s){
	res.writeHead(400, s, {"Content-Type": "text/plain"});
	res.end();
    };
    // call-back function returning info to the client
    var cbfunc = function(s){
	switch(typeof s){
	case "string":
	    break;
	case "object":
	    s = JSON.stringify(s);
	    break;
	default:
	    s = s.toString();
	    break;
	}
	res.writeHead(200, {"Content-Type": "text/plain"});
	res.write(s);
	res.end();
    };
    // generate object and run the cmd
    var docmd = function(cmd, jstr){
	var i, j, obj;
	// the constructed string is stringified json, if it exists
	// try to parse it into an object
	if( jstr && jstr !== "null" ){
	    try{ obj = JSON.parse(jstr); }
	    catch(e){
		htmlerr("can't parse JSON object in http request: " + jstr); 
		return;
	    }
	} else {
	    obj = {};
	}
	// check for id and set default
	obj.id = obj.id || "JS9";
	// process the command
	switch(cmd){
	case "alive":
	    if( cbfunc ){ cbfunc("OK"); }
	    break;
	case "msg":
	    // send a command from an external source to a JS9 browser
	    sendMsg(io, req, obj, cbfunc);
	    break;
	default:
	    // plugin messages: NB needs authentication!
	    for(j=0; j<plugins.length; j++){
		// simple plugin: name is the same as the plugin filename
		if( plugins[j].http && (cmd === plugins[j].name) ){
		    plugins[j].http(io, req, obj, cbfunc);
		    return;
		}
		if( plugins[j].httpList ){
		    // list of plugins, each with their own name
		    for(i=0; i<plugins[j].httpList.length; i++){
			if( cmd === plugins[j].httpList[i].name ){
			    plugins[j].httpList[i].func(io, req, obj, cbfunc);
			    return;
			}
		    }
		}
	    }
	    htmlerr("unknown command in " + req.method + " request: " + cmd);
	    break;
	}
    };
    // parse url to get object for easier handling
    gobj = url.parse(req.url);
    // get command from pathname
    if( gobj.pathname ){
	cmd = gobj.pathname.replace(/^\//, "");
    }
    // method-specific processing
    switch(req.method){
    case "GET":
	// fix some awkwardness in qs.parse
	if( gobj.query ){
	    gobj.query = gobj.query.replace(/\+/g, "%2B");
	}
	// we pass the stringified json data directly command type,
	// so prepend an obj so we can parse it
	s = "obj=" + gobj.query;
	try{ jstr = qs.parse(s).obj; }
	catch(e){
	    htmlerr("can't parse JSON object in http GET request: " + s); 
	    return;
	}
	docmd(cmd, jstr);
	break;
    case "POST":
	req.on('data', function(chunk){
	    body += chunk;
	});
	req.on('end', function(){
	    jstr = body.toString();
	    docmd(cmd, jstr);
	});
	break;
    default:
	htmlerr("unsupported method: " + req.method);
	return;
    }
};

//
// initialization
//

// load secure preferences
secure = loadSecurePreferences(securefile);

// load preference file
loadPreferences(prefsfile);

// load analysis plugins
loadAnalysisTasks(globalOpts.analysisPlugins);

// load user-defined plugins
loadHelperPlugins(globalOpts.helperPlugins);

// start up http server
if( secure ){
    app = https.createServer(secureOpts, httpHandler);
} else {
    app = http.createServer(httpHandler);
}

// never timeout, analysis requests can be very long
app.setTimeout(0);

// and connect with the socket.io server
io = new Sockio(app);

// for each socket.io connection, receive and process custom events
io.on("connection", socketioHandler);

// start listening on the helper port
app.listen(globalOpts.helperPort, globalOpts.helperHost);

// an example of adding an in-line messsage to the analysis task list
if( process.env.NODEJS_FOO === "analysis" ){
    // add foo to the list of analysis tasks sent to JS9
    // it will go into the analysis menu and will be treated as analysis, i.e.
    // automatic macro expansion, light-window to display of text/plot, etc.
    // keys is an array macros to expand; they will be returned as an object
    addAnalysisTask({xclass: "FOO", name: "foo", title: "Do Foo",
		     keys: ["filename", "regions", "id"]});
}

// last ditch attempt to keep the server up
process.on("uncaughtException", function(e){
    cerr("uncaughtException: %s [%s]", e, e.stack || e.stacktrace || "");
});
