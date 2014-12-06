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
    Sockio = require('socket.io'),
    url = require('url'),
    qs = require('querystring'),
    cproc  = require("child_process"),
    fs     = require("fs"),
    uuid   = require('node-uuid');

// internal variables
var app, io;
var prefsfile = "js9Prefs.json";
var fits2png = {};
var analysis = {str:[], pkgs:[]};
var envs = JSON.stringify(process.env);

// default options ... change as necessary in prefsfile
var globalOpts = {
    helperPort:       2718,
    cmd:              "js9helper",
    analysisPlugins:  "./analysis-plugins",
    analysisWrappers: "./analysis-wrappers",
    remoteMsgs:       1 // 0 => none, 1 => samehost, 2 => all
};

//
// functions that might depend on specific implementations of socket.io
//

// get ip address and port of the current socket or http connection
function getHost(io, req){
    // socket.io
    if( req.handshake ){
	return req.client.conn.remoteAddress;
    }
    // http server
    return req.headers['x-forwarded-for'] ||
	   req.connection.remoteAddress   ||
	   req.socket.remoteAddress       ||
	   req.connection.socket.remoteAddress;
}

// http://stackoverflow.com/questions/6563885/socket-io-how-do-i-get-a-list-of-connected-sockets-clients
function findClientsSocket(io, namespace, roomId){
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
}

// get list of all clients currently connected
function getClients(io, socket){
    return findClientsSocket(io);
}

// utility functions

// getTargets: identify target(s) for an external msg for a given ip
function getTargets(io, socket, msg){
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
	if( myip === "127.0.0.1" ){
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
}

// envClean: clean incoming environment variables
// this should match cleaning in js9Helper.cgi
function envClean(s) {
    if( typeof s === "string" ){
	return s.replace(/[`&]/g, "").replace(/\(\)[ 	]*\{.*/g, "");
    }
    return s;
}

// load preference file, if possible
function loadPreferences(prefsfile){
    var s, obj, opt, otype, jtype;
    if( fs.existsSync(prefsfile) ){
	s = fs.readFileSync(prefsfile, "utf-8");
	if( s ){
	    try{ obj = JSON.parse(s.toString()); }
	    catch(e){ console.log("can't parse: "+prefsfile, e); }
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
}

// load analysis plugin files, if available
function loadAnalysisTasks(pluginsfile){
    if( fs.existsSync(pluginsfile) ){
	fs.readdir(pluginsfile, function(err, files){
	    var i, jstr, pathname;
	    for(i=0; i<files.length; i++){
		pathname = globalOpts.analysisPlugins + "/" + files[i];
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
			    catch(e1){console.log("can't parse: "+pathname,e1);}
			    break;
			default:
			    try{
				analysis.pkgs.push(JSON.parse(jstr));
				analysis.str.push(jstr);
			    }
			    catch(e2){console.log("can't parse: "+pathname,e2);}
			    break;
			}
		    }
		}
	    }
	});
    }
}

// addAnalysisTask: add to the list of analysis tasks sent to browser
function addAnalysisTask(obj) {
    analysis.pkgs.push(obj);
    analysis.str.push("[" + JSON.stringify(obj) + "]");
}

//
// message callbacks
//

// execCmd: exec a analysis wrapper function to run a command
// this is the default callback for server-side analysis tasks
function execCmd(io, socket, obj, cbfunc) {
    var i, cmd, argstr, args;
    var myip = getHost(io, socket);
    var myid = obj.id;
    var myenv = JSON.parse(envs);
    // sanity check
    if( !obj.cmd ){
	return;
    }
    // id of js9 display
    myenv.JS9_ID = envClean(myid);
    // host ip
    myenv.JS9_HOST = envClean(myip);
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
    // the command string
    argstr = obj.cmd || "";
    // split arguments on spaces
    args = argstr.split(" ");
    // remove dangerous characters
    for(i=0; i<args.length; i++){
	args[i] = args[i].replace(/[`$]/g, "");
    }
    // get commmand to execute
    if( args[0] === globalOpts.cmd ){
	// handle fitshelper specially
	cmd = args[0];
    } else {
	// use a wrapper
	cmd = globalOpts.analysisWrappers + "/" + args[0];
    }
    // log what we are about to do
    console.log("exec: %s [%s]", cmd, args.slice(1));
    // execute the analysis script with cmd arguments
    cproc.execFile(cmd, args.slice(1),
		   { encoding: "ascii",
		     timeout: 0,
		     maxBuffer: 2000*1024,
		     killSignal: "SIGTERM",
		     cwd: null,
		     env: myenv
		   },
		   // return from exec
		   function(errcode, stdout, stderr) {
		       var res={};
		       res.errcode = errcode;
		       if( stdout ){
			   res.stdout = stdout.toString();
		       }
		       if( stderr ){
			   res.stderr = stderr.toString();
			   console.log("run: %s", res.stderr);
		       }
		       // send results back to browser
		       if( cbfunc ){ cbfunc(res); }
		   });
}

// sendAnalysis: send list of analysis routines to browser
function sendAnalysisTasks(io, socket, obj, cbfunc) {
    var s;
    if( analysis && analysis.str.length ){
	s = "[" + analysis.str.join(",") + "]";
	if( cbfunc ){ cbfunc(s); }
    }
}

// sendMsg: send a message to the browser
// this is the default callback for external communication with JS9
function sendMsg(io, socket, obj, cbfunc) {
    var i, targets;
    // callback function
    var myfunc = function(s){
	if( cbfunc ){ cbfunc(s); }
    };
    // get list of targets to send to
    targets = getTargets(io, socket, obj);
    // look for one target (or else that multi is allowed)
    if( (targets.length === 1) || obj.multi ){
	for(i=0; i<targets.length; i++){
	    targets[i].emit("msg", obj, myfunc);
	}
    } else {
	if( cbfunc ){
            cbfunc("ERROR: "+targets.length+" JS9 instance(s) found with" +
		   " id " + obj.id + " (" + obj.cmd+")");
	}
    }
}

// socketio handler: field socket.io requests
function socketioHandler(socket) {
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
            console.log("disconnect: %s (%s) [%s]",
			myhost, socket.js9.displays,
			new Date().toLocaleString());
	}
    });
    // on displays: get the list of displays for this connection
    // returns: unique page id (not currently used)
    // for other implementations, this is needed if you want to:
    //   support sending external messages to JS9 (i.e., via js9 script)
    socket.on("displays", function(obj, cbfunc) {
	var myhost = getHost(io, socket);
	if( !obj ){return;}
	socket.js9 = {};
	socket.js9.displays = obj.displays;
	socket.js9.pageid = uuid.v4();
        console.log("connect: %s (%s) [%s]",
		    myhost,
		    socket.js9.displays,
		    new Date().toLocaleString());
	if( cbfunc ){ cbfunc(socket.js9.pageid); }
    });
    // on alive: return "OK" to signal a valid connection
    socket.on("alive", function(obj, cbfunc) {
	    if( cbfunc ){ cbfunc("OK"); }
    });
    // on image: signal from JS9 that a new or redisplayed image is active
    // returns: [input file path, fits file path, "wcs"|"pix", wcs system]
    // for other implementations, this is needed if you want to:
    //   tell JS9 about default wcs system for this data file
    //   get FITS filename associated with PNG representation files
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
	// JS9.Send("FOO:foo",{keys:{"x":1,"y":2}},function(r){console.log(r)});
	socket.on("FOO:foo", function(obj, cbfunc) {
	    var s = "foo: " + JSON.stringify(obj.keys);
	    // analysis tasks should return an object containing one or more:
	    // error (error code), stdout (string result), stderr (error msg)
	    if( cbfunc ){ cbfunc({stdout: s}); }
	});
    }
}

// httpd handler: field pseudo-socket.io http requests
// public api:
// wget $MYHOST'/msg?{"id": "'$ID'", "cmd": "SetColormap", "args": ["red"]}'
// wget $MYHOST'/msg?{"id": "'$ID'", "cmd": "GetColormap"}'
// js9 command line:
// wget $MYHOST'/msg?{"id": "'$ID'", "cmd": "zoom", "args": [2]}'
// wget $MYHOST'/msg?{"id": "'$ID'", "cmd": "zoom"}'
// analysis commands:
// wget $MYHOST'/counts?{"id": "'$ID'", "cmd": "counts", "args": ["counts"]}'
function httpHandler(req, res){
    var cmd, gobj, s, jstr;
    var body = "";
    // return error into to browser
    var err = function(s){
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
	var a, i, j, m, obj;
	// the constructed string is stringified json, so
	// just parse it into an object
	try{ obj = JSON.parse(jstr); }
	catch(e){
	    err("can't parse JSON object in http request: " + jstr); 
	    return;
	}
	// check for id and set default
	obj.id = obj.id || "JS9";
	// process the command
	switch(cmd){
	case "alive":
	    if( cbfunc ){ cbfunc("OK"); }
	    break;
	case "runAnalysis":
	    // exec the conversion task (via a wrapper function)
	    execCmd(io, req, obj, cbfunc);
	    break;
	case "msg":
	    // send a command from an external source to a JS9 browser
	    sendMsg(io, req, obj, cbfunc);
	    break;
	default:
	    for(j=0; j<analysis.pkgs.length; j++){
		for(i=0; i<analysis.pkgs[j].length; i++){
		    a = analysis.pkgs[j][i];
		    m = a.xclass ? (a.xclass + ":" + a.name) : a.name;
		    if( m === cmd ){
			execCmd(io, req, obj, cbfunc);
			return;
		    }
		}
	    }
	    err("unknown command in " + req.method + " request: " + cmd);
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
	    err("can't parse JSON object in http GET request: " + s); 
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
	err("unsupported method: " + req.method);
	return;
    }
}

//
// initialization
//

// load preference file
loadPreferences(prefsfile);

// load analysis plugins
loadAnalysisTasks(globalOpts.analysisPlugins);

// start up http server
app = http.createServer(httpHandler);

// and connect with the socket.io server
io = new Sockio(app);

// for each socket.io connection, receive and process custom events
io.on("connection", socketioHandler);

// start listening on the helper port
app.listen(globalOpts.helperPort);

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
    console.log("uncaughtException: %s [%s]", e, e.stack || e.stacktrace || "");
});
