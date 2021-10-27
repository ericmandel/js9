/*
 *
 * js9Helper: Node-based back-end server for JS9 (September 4, 2012)
 *
 * Principals: Eric Mandel
 * Organization: Center for Astrophysics | Harvard & Smithsonian, Cambridge MA
 * Contact: emandel@cfa.harvard.edu
 *
 * Copyright (c) 2012 - 2021 Smithsonian Astrophysical Observatory
 *
 *
 */

/* global */

"use strict";

// load required modules
const http = require('http'),
      os = require('os'),
      path = require('path'),
      https = require('https'),
      url = require('url'),
      qs = require('querystring'),
      cproc = require("child_process"),
      fs = require("fs"),
      { v4: uuidv4 } = require('uuid'),
      rmdir = require('rimraf');

// internal variables
let i, app, io, secure;
let fits2fits = {};
let quotacheck = {};
let analysis = {str:[], pkgs:[]};
let plugins = [];
const installDir = __dirname;
const currentDir = process.cwd();
const myProg = process.argv[0].split("/").reverse()[0];
const myArgs = process.argv.slice(2);
const prefsfile  = path.join(installDir, "js9Prefs.json");
const securefile = path.join(installDir, "js9Secure.json");
const js9Queue = {};
const rmQueue = {};
const merges = {};
const server = "socket.io";

// secure options ... change as necessary in securefile
const secureOpts = {
    // key: "path_to_private.key",          // openssl genrsa -out file 2014
    // cert: "path_to_certificate_file",    // from the certificate authority
    // ca: "path_to_certificate_authority"  // can be a chain file
};

// default options ... change as necessary in prefsfile
const globalOpts = {
    helperPort:       2718,
    // listen on all interfaces
    helperHost:       "0.0.0.0",
    // we need a large buffer for returning arbitrary analysis results
    // default ping timeout is too short, and Chrome gets disconnect errors
    // v2 requires cors to be set explicitly
    // allowEIO3 support socketio v2
    helperOpts:       {maxHttpBufferSize: 10E9,
		       pingInterval:      20000,
		       pingTimeout:       30000,
		       cors:{origin:      true},
		       allowEIO3:         true},
    cmd:              "js9helper",
    analysisPlugins:  "analysis-plugins",
    analysisWrappers: "analysis-wrappers",
    helperPlugins:    "helper-plugins",
    dataPathModify:   true,
    fileTranslate:    [],          // file translation, e.g. ["/notebooks/",""]
    maxBinaryBuffer:  150*1024000, // exec buffer: good for 4096^2 64-bit image
    maxTextBuffer:    5*1024000,   // exec buffer: good for text
    textEncoding:     "ascii",     // encoding for returned stdout from exec
    rmWorkDir:        true,        // remove workdir on disconnect?
    rmWorkDelay:      15000,       // delay before removing workdir
    remoteMsgs:       1 // 0 => local, 1 => same, 2 => local->all 3 => all->all
};
// globalOpts that might need to have paths relative to __dirname
const globalRelatives = ["analysisPlugins",
		       "analysisWrappers",
		       "helperPlugins"];

//
// routines that might depend on specific implementations of socket.io
//

// get ip address and port of the current socket or http connection
const getHost = function(req){
    // socket.io
    if( req.handshake ){
	if( req.handshake.headers                    &&
	    req.handshake.headers['x-forwarded-for'] ){
	    return req.handshake.headers['x-forwarded-for'].split(',')[0];
	} else {
	    return req.client.conn.remoteAddress;
	}
    }
    // http server
    // http://stackoverflow.com/questions/19266329/node-js-get-clients-ip
    return (req.headers['x-forwarded-for'] || '').split(',')[0] ||
            req.connection.remoteAddress;
};

// http://stackoverflow.com/questions/6563885/socket-io-how-do-i-get-a-list-of-connected-sockets-clients
// v3 update: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/#API-change
// is it v2 or v3? emperically, for v3 the connected property is undefined
const getClients = function(){
    let id;
    const res = [];
    // check for conected targets connected (default: using v2 or v3)
    const v2 = io.of("/").connected;
    const v3 = io.of("/").sockets;
    if( v2 ){
	// v2 protocol
        for( id in v2 ){
	    if( Object.prototype.hasOwnProperty.call(v2, id) ){
		if( !v2[id].js9worker ){
		    res.push(v2[id]);
		}
	    }
        }
    } else if( v3 ){
	// v3 protocol
	v3.forEach((value) => {
	    if( !value.js9worker ){
		res.push(value);
	    }
	})
    }
    return res;
};

// utilities

// create a nice date/time string for logging
const datestr = function(){
    return new Date().toLocaleString(undefined, {hour12: false});
};

// output a log message on the console
const clog = function(){
    const args = Array.prototype.slice.call(arguments, 0);
    args.push(` [${datestr()}]`);
    // eslint-disable-next-line no-console
    console.log.apply(null, args);
};

// output string to log file
// eslint-disable-next-line no-unused-vars
const flog = function(s){
    const buffer = new Buffer(`${s}\n`);
    fs.open('tmp/js9node.log', 'a', (err, fd) => {
	if( fd ){
	    fs.write(fd, buffer, 0, buffer.length, null,
		     // eslint-disable-next-line no-unused-vars
		     (err, written, bytes) => { fs.closeSync(fd); });
	}
    });
};

// output an error message on the console
const cerr = function(){
    const args = Array.prototype.slice.call(arguments, 0);
    args.unshift("ERROR: ");
    args.push(` [${datestr()}]`);
    // eslint-disable-next-line no-console
    console.log.apply(null, args);
};

// getTargets: identify target(s) for an external msg for a given ip
// returns: array of validated targets
const getTargets = function(socket, msg){
    let i, j, c, clip, displays;
    const browserip = msg.browserip || "*";
    const targets = [];
    // ip associated with this socket
    const myip = getHost(socket);
    // list of all clients connected on this socket
    const clients = getClients();
    // authentication func
    const authenticate = (myip, clip) => {
	// localhost to localhost is always allowed
	if( ((myip === "127.0.0.1")         ||
	     (myip === "::ffff:127.0.0.1")  ||
	     (myip === "::1"))              &&
	    ((clip === "127.0.0.1")         ||
	     (clip === "::ffff:127.0.0.1")  ||
	     (clip === "::1"))              &&
	    (globalOpts.remoteMsgs >= 0)    ){
	    return true;
	}
	// I can send to myself, if we configured that way
	if( (myip === clip)                 &&
	    (globalOpts.remoteMsgs >= 1)    ){
	    return true;
	}
	// allow localhost to send to everyone else
	if( ((myip === "127.0.0.1")         ||
	     (myip === "::ffff:127.0.0.1")  ||
	     (myip === "::1"))              &&
	    globalOpts.remoteMsgs >= 2      ){
	    return true;
	}
	// security risk: anyone can send to anyone
	if( globalOpts.remoteMsgs >= 3 ){
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
	clip = getHost(c);
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
		// look for matching display
		if( msg.id === displays[j] ){
		    targets.push(c);
		}
	    }
	}
    }
    return targets;
};

// connectWorker: identify main socket for this worker
const connectWorker = function(socket, pageid){
    let i, c, clip;
    // ip associated with this socket
    const myip = getHost(socket);
    // list of all clients connected on this socket
    const clients = getClients();
    // sanity check
    if( !pageid ){
	return null;
    }
    // look at all clients
    for(i=0; i<clients.length; i++){
	// current client
	c = clients[i];
	// check for client with same pageid
	if( c.js9 && (c.js9.pageid === pageid) ){
	    // get client ip
	    clip = getHost(c);
	    // ip of worker and client must match!
	    if( myip === clip ){
		return c;
	    }
	}
    }
    return null;
};

// envClean: clean incoming environment variables
// this should match cleaning in js9Helper.cgi
const envClean = function(s) {
    if( typeof s === "string" ){
	return s.replace(/[`&]/g, "").replace(/\(\)\s*\{.*/g, "");
    }
    return s;
};

const loadSecurePreferences = function(securefile){
    let s, obj, opt;
    let secure = false;
    if( fs.existsSync(securefile) ){
	s = fs.readFileSync(securefile, "utf-8");
	if( s ){
	    try{ obj = JSON.parse(s.toString()); }
	    catch(e){ cerr("can't parse: ", securefile, e); }
	    // merge opts into secureOpts
	    for( opt in obj ){
		if( Object.prototype.hasOwnProperty.call(obj, opt) ){
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
const loadPreferences = function(prefs){
    let s, obj, opt, otype, jtype;
    if( fs.existsSync(prefs) ){
	s = fs.readFileSync(prefs, "utf-8");
    } else if( typeof prefs === "string" ){
	s = `{"globalOpts": ${prefs}}`;
    }
    if( s ){
	try{ obj = JSON.parse(s.toString()); }
	catch(e){ cerr("can't parse: ", prefsfile, e); }
	// look for globalOpts and merge
	if( obj && obj.globalOpts ){
	    for( opt in obj.globalOpts ){
		if( Object.prototype.hasOwnProperty.call(obj.globalOpts, opt) ){
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
			case "object":
			    globalOpts[opt] = obj.globalOpts[opt];
			    break;
			default:
			    break;
			}
		    }
		}
	    }
	}
	// some directories should be relative to __dirname
	globalRelatives.forEach((s) => {
	    const file = globalOpts[s];
	    if( file && !path.isAbsolute(file) ){
		globalOpts[s] = path.join(installDir, file);
	    }
	});
	// initialize the wrapper path, if necessary
	if( !globalOpts.analysisWrapPath){
	    globalOpts.analysisWrapPath = globalOpts.analysisWrappers;
	}
	// use system tmp directory for workDir, if necessary
	if( globalOpts.workDir === "$tmp" ){
	    globalOpts.workDir = os.tmpdir();
	}
    }
};

// load analysis plugin files, if available
const loadAnalysisTasks = function(dir, todir){
    if( fs.existsSync(dir) ){
	fs.readdir(dir, (err, files) => {
	    let i, j, a, arr, jstr, pathname;
	    for(i=0; i<files.length; i++){
		pathname = `${dir}/${files[i]}`;
		if( fs.existsSync(pathname) ){
		    // only json files ... also avoid Mac OSX xattr files
		    if( !pathname.match(/.json$/) || files[i].match(/\._/) ){
			continue;
		    }
		    analysis.temp = fs.readFileSync(pathname, "utf-8");
		    if( analysis.temp ){
			jstr = analysis.temp.toString().trim();
			switch(files[i]){
			case "fits2fits.json":
			    try{ fits2fits = JSON.parse(jstr); }
			    catch(e1){cerr("can't parse: ", pathname, e1);}
			    break;
			case "quotacheck.json":
			    try{ quotacheck = JSON.parse(jstr); }
			    catch(e1){cerr("can't parse: ", pathname, e1);}
			    break;
			default:
			    try{
				arr = JSON.parse(jstr);
				// todir defined => prepend it to paths
				if( todir && arr ){
				    for(j=0; j<arr.length; j++){
					a = arr[j];
					if( a.purl ){
					    a.purl = `${todir}/${a.purl}`;
					}
				    }
				    analysis.pkgs.push(arr);
				    analysis.str.push(JSON.stringify(arr));
				} else {
				    analysis.pkgs.push(arr);
				    analysis.str.push(jstr);
				}
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
const addAnalysisTask = function(obj) {
    analysis.pkgs.push(obj);
    analysis.str.push(`[${JSON.stringify(obj)}]`);
};

// load user-defined plugins, if possible
const loadHelperPlugins = function(dir){
    if( fs.existsSync(dir) ){
	fs.readdir(dir, (err, files) => {
	    let i, x, pathname, name;
	    for(i=0; i<files.length; i++){
		pathname = `${dir}/${files[i]}`;
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

// merge a directory containing analysis tasks, etc.
const mergeDirectory = function(dir){
    let s, stat, mergeTo;
    // only merge once
    if( merges[dir] ){ return "OK"; }
    // look for directory info
    try{ stat = fs.statSync(dir); } catch(e){ stat = null; }
    if( !stat || !stat.isDirectory() ){
	s = `ERROR: invalid merge directory: ${dir||"<none>"}`;
	clog(s);
	return s;
    }
    // how to get from merge dir to install dir
    mergeTo = path.relative(__dirname, dir);
    // process entries in the merge directory
    try{ fs.readdir(dir, (err, files) => {
	let d, i, file, stat;
	for(i=0; i<files.length; i++){
	    file = files[i];
	    d = `${dir}/${file}`;
	    switch(file){
	    case "analysis-wrappers":
		try{ stat = fs.statSync(d); } catch(e){ stat = null; }
		if( stat && stat.isDirectory() ){
		    globalOpts.analysisWrapPath += `:${d}`;
		}
		break;
	    case "analysis-plugins":
		try{ stat = fs.statSync(d); } catch(e){ stat = null; }
		if( stat && stat.isDirectory() ){
		    loadAnalysisTasks(d, mergeTo);
		}
		break;
	    case "bin":
		try{ stat = fs.statSync(d); } catch(e){ stat = null; }
		if( stat && stat.isDirectory() ){
		    process.env.PATH += `:${d}`;
		}
		break;
	    case "params":
		break;
	    default:
		break;
	    }
	}
    }); }
    catch(e){
	s = `ERROR: can't read files from merge directory: ${dir}`;
	clog(s);
	return s;
    }
    // we have merged this dir
    merges[dir] = true;
    clog("merge: %s", dir);
    return "OK";
};

// parse an argument string into an array of arguments, where
// spaces and quotes are delimiters
const parseArgs = function(argstr){
    let targs, i, j, ci, c1, c2, s;
    const args = [];
    // temporarily replace spaces inside file extension brackets
    // https://stackoverflow.com/questions/16644159/regex-to-remove-spaces-between-and
    const nargstr = argstr.replace(/\s+(?=[^[\]]*\])/g, "__sp__");
    // split arguments on spaces
    targs = nargstr.split(" ");
    // now re-combine quoted args into one arg
    for(i=0, j=0, ci=-1; i<targs.length; i++){
	// remove or rename dangerous characters
	s = targs[i].replace(/`/g, "").replace(/&/g, "__ampersand__");
	// are we re-combining?
	if( ci >= 0 ){
	    // yes, add to current arg
	    args[ci] = `${args[ci]} ${s}`;
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
    // now put back the spaces
    for(i=0; i<args.length; i++){
	args[i] = args[i].replace(/__sp__/g, " ");
    }
    return args;
};

// get data path
const getDataPath = function(s){
    let i, t, narr;
    let arr = [];
    let dataPath="";
    // always use the global dataPath set by the site
    if( globalOpts.dataPath ){
	dataPath = envClean(globalOpts.dataPath);
	arr = dataPath.split(":");
    }
    // add user dataPath, if permitted
    if( s && globalOpts.dataPathModify ){
	t = envClean(s);
	narr = t.split(":");
	for(i=0; i<narr.length; i++){
	    if( !arr.includes(narr[i]) ){
		if( dataPath ){
		    dataPath += ":";
		}
		dataPath += narr[i];
	    }
	}
    }
    if( dataPath ){
	dataPath += ":";
    }
    // always add js9Helper install directory
    dataPath += installDir;
    return dataPath;
};

// see if a file exists in the dataPath
const getFilePath = function(file, dataPath, myenv, dohide){
    let i, s, s1, froot1, fext, parr, from, to;
    // eslint-disable-next-line no-unused-vars
    const repl = (m, t, o) => {
	if( myenv && myenv[t] ){
	    return myenv[t];
	}
	return m;
    };
    const hide = (s) => {
	const rexp = new RegExp(`^${installDir}`);
	return s.replace(rexp, "${JS9_DIR}");
    };
    // sanity check
    if( !file ){
	return;
    }
    // translate filename, if necessary
    if( globalOpts.fileTranslate                &&
	Array.isArray(globalOpts.fileTranslate) &&
	globalOpts.fileTranslate[0]             ){
	from = new RegExp(globalOpts.fileTranslate[0]);
	to = globalOpts.fileTranslate[1] || "";
	file = file.replace(from, to);
    }
    // look for and remove the extension
    froot1 = file.replace(/\[.*]$/,"");
    s = file.match(/\[.*]$/,"");
    if( s ){
	fext = s[0];
    } else {
	fext = "";
    }
    parr = dataPath.split(":");
    // everything gets tested relative to the current directory
    // (we'll use an absolute path to it to help the analysis wrapper)
    parr.unshift(process.cwd());
    // absolute paths get tested on their own (BEFORE testing ./absolute/path)
    if( path.isAbsolute(froot1) ){
	parr.unshift("");
    }
    // check is file is in any of the directories in the path
    for(i=0; i<parr.length; i++){
	// replace environment variables in path, if possible
	s = parr[i].replace(/\${?([a-zA-Z][a-zA-Z0-9_()]+)}?/g, repl);
	// make up pathnames to check
	s1 = path.join(s, froot1);
	if( fs.existsSync(s1) ){
	    if( !s1.match(/\//) ){
		s1 = `${currentDir}/${s1}`;
	    }
	    // found the file add extension to full path
	    s1 += fext;
	    if( dohide === false ){
		return s1;
	    }
	    return hide(s1);
	}
    }
    return;
};

// get size of a file
const getFileSize = function(file){
    let stats;
    let size = 0;
    const froot = file
	  .replace(/\[.*]$/,"")
	  .replace(/\$\{?JS9_DIR\}?/, installDir);
    if( fs.existsSync(froot) ){
	stats = fs.statSync(froot);
	if( stats ){
	    size = stats.size;
	}
    }
    return size;
};

//
// message callbacks
//

// execCmd: exec a analysis wrapper routine to run a command
// this is the default callback for server-side analysis tasks
const execCmd = function(socket, obj, cbfunc) {
    let cmd, argstr, args, maxbuf, child, s, myid, myrtype;
    let myworkdir = null;
    const myip = getHost(socket);
    const myenv = process.env;
    const res = {stdout: null, stderr: null, errcode: 0,
	       encoding: globalOpts.textEncoding};
    // sanity check
    if( !obj || !obj.cmd || !socket.js9 ){
	if( cbfunc ){
	    res.stderr = "JS9 helper is unavailable";
	    cbfunc(res);
	}
	return;
    }
    myid = obj.id;
    myrtype = obj.rtype || "binary";
    // stdin processing
    if( obj.stdin && typeof obj.stdin === "object" ){
	// first chunk gets sent after process is started (see below),
	// otherwise send a new chunk to stdin now and return
	socket.js9.child.stdin.write(obj.stdin.data);
	// if this was the last chunk,  close off stdin and delete child
	if( (obj.stdin.cur + obj.stdin.len) >= obj.stdin.total ){
	    socket.js9.child.stdin.end();
	    delete socket.js9.child;
	}
	if( cbfunc ){
	    res.stdout = "OK";
	    cbfunc(res);
	}
	return;
    }
    // id of js9 display
    myenv.JS9_ID = envClean(myid);
    // host ip
    myenv.JS9_HOST = envClean(myip);
    // JS9 base dir
    myenv.JS9_DIR = installDir;
    // JS9 unique page id
    myenv.JS9_PAGEID = 	socket.js9.pageid;
    // js9 cookie in the sending browser
    if( obj.cookie ){
	myenv.HTTP_COOKIE = envClean(obj.cookie);
    }
    // datapath (for finding data files)
    myenv.JS9_DATAPATH = getDataPath(obj.dataPath);
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
    argstr = obj.cmd;
    // expand directory macros
    argstr = argstr
	.replace(/\$\{?JS9_DIR\}?/, installDir)
	.replace(/\$\{?JS9_WORKDIR\}?/, (socket.js9.rworkDir || ""));
    // split arguments on spaces, respecting quotes
    args = parseArgs(argstr);
    // handle fitshelper specially
    if( args[0] === globalOpts.cmd ){
	// if FITS, handle this request internally instead of exec'ing
	// (makes external analysis possible without building js9 programs)
	if( obj.image && (path.extname(obj.image) !== ".png") ){
	    // check primary file
	    s = getFilePath(obj.image, myenv.JS9_DATAPATH, myenv);
	    if( !s && obj.image2 && obj.image !== obj.image2 ){
		// check alternate (usually with path to installdir removed)
		s = getFilePath(obj.image2, myenv.JS9_DATAPATH, myenv);
	    }
	    if( s ){
		res.stdout = `${obj.image} ${s}`;
	    }
	    if( cbfunc ){
		cbfunc(res);
	    }
	    return;
	}
	// handle fitshelper specially
	cmd = args[0];
    } else {
	// start in the appropriate work directory, if possible
	if( (obj.useWorkDir !== false) && socket.js9.aworkDir ){
	    // abdsolute working directory to cd into
	    myworkdir = socket.js9.aworkDir;
	    // working directory relative to JS9 dir is for the worker
	    myenv.JS9_WORKDIR = socket.js9.rworkDir;
	    myenv.JS9_WORKDIR_QUOTA = globalOpts.workDirQuota;
	}
	// construct wrapper path
	// cmd = globalOpts.analysisWrappers + "/" + args[0];
	// get path of wrapper script
	cmd = getFilePath(args[0], globalOpts.analysisWrapPath, myenv, false);
	if( !cmd ){
	    if( cbfunc ){
		res.stderr = `can't find JS9 wrapper script: ${args[0]}`;
		cbfunc(res);
	    }
	    return;
	}
	// make path absolute in case we change directories
	if( cmd.charAt(0) !== "/" ){
	    cmd = `${installDir}/${cmd}`;
	}
    }
    // log what we are about to do
    clog("exec: %s %s", cmd, JSON.stringify(args.slice(1)));
    // execute the analysis script with cmd arguments
    // NB: can't use exec because the shell breaks, e.g. region command lines
    try{
	child = cproc.execFile(cmd, args.slice(1),
		   { encoding: "utf8",
		     timeout: 0,
		     maxBuffer: maxbuf,
		     killSignal: "SIGTERM",
		     cwd: myworkdir,
		     env: myenv
		   },
		   // return from exec
		   (errcode, stdout, stderr) => {
		       if( errcode ){
			   res.errcode = errcode.errno || errcode.code;
		       }
		       if( stdout ){
			   switch(myrtype){
			   case "text":
			   case "plot":
			   case "png":
			   case "alert":
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
	// first time through: save child for uploading data
	if( obj.stdin === true ){
	    // save child so we can process future chunks of data
	    socket.js9.child = child;
	    // set up to send raw data
	    socket.js9.child.stdin.setEncoding = 'binary';
	}
    } catch(e){
	// send exec error back to browser
	res.stderr = `ERROR: could not exec ${cmd}: ${e.message}`;
	res.stdout = null;
	if( cbfunc ){ cbfunc(res); }
    }
};

// sendAnalysis: send list of analysis routines to browser
const sendAnalysisTasks = function(cbfunc) {
    let s;
    if( analysis && analysis.str.length ){
	s = `[${analysis.str.join(",")}]`;
	if( cbfunc ){ cbfunc(s); }
    }
};

// pageReady: wait for a Web browser to load a JS9 page and connect
// used by js9Msg.js to start up a Web browser before executing commands
const pageReady = function(socket, obj, cbfunc, tries){
    let i, targets;
    const timeout = obj.timeout || 500;
    const maxtries = obj.tries || 10;
    // callback func
    const myfunc = (s) => {
	if( cbfunc ){ cbfunc(s); }
    };
    setTimeout(() => {
	// look for targets
	targets = getTargets(socket, obj);
	// if we have at least one ...
	if( (targets.length === 1) || (targets.length > 1 && obj.multi) ){
	    // send command to JS9 instance(s)
	    for(i=0; i<targets.length; i++){
		targets[i].emit("msg", obj, myfunc);
	    }
	} else {
	    // no targets: have we tried enough?
	    if( !targets.length ){
		if( tries < maxtries ){
		    // no, try again
		    pageReady(socket, obj, cbfunc, tries+1);
		} else {
		    // yes, it's an error
		    if( cbfunc ){
			cbfunc("ERROR: timeout waiting for Web page");
		    }
		}
	    } else {
		// it's an error
		if( cbfunc ){
		    cbfunc(`ERROR: ${targets.length} JS9 instance(s) found with id ${obj.id} (${obj.cmd})`);
		}
	    }
	}
    }, timeout);
};

// sendMsg: send a message to the browser
// this is the default callback for external communication with JS9
const sendMsg = function(socket, obj, cbfunc) {
    let s, i, myip, targets;
    // callback func
    const myfunc = (s) => {
	if( cbfunc ){ cbfunc(s); }
    };
    // get list of targets to send to
    targets = getTargets(socket, obj);
    // commands not going to a browser
    switch(obj.cmd){
    case "alive":
	myfunc("OK");
	return;
    case "merge":
	// local connections only
	myip = getHost(socket);
	if( (myip === "127.0.0.1") || (myip === "::ffff:127.0.0.1") ){
	    myfunc(mergeDirectory(obj.args[0]));
	} else {
            s = `ERROR: rejecting remote merge request from: ${myip}`;
	    clog(s);
	    myfunc(s);
	}
	return;
    case "targets":
	myfunc(targets.length);
	return;
    case "getAnalysis":
	sendAnalysisTasks(cbfunc);
	return;
    case "addDisplay":
    case "renameDisplay":
    case "worker":
    case "image":
    case "runAnalysis":
    case "fits2fits":
    case "quotacheck":
	myfunc(`ERROR: ${obj.cmd} not available via js9 messaging script`);
	return;
    }
    // look for one target (or else that multi is allowed)
    if( (targets.length === 1) || (targets.length > 1 && obj.multi) ){
	// send command to JS9 instance(s)
	for(i=0; i<targets.length; i++){
	    targets[i].emit("msg", obj, myfunc);
	}
    } else {
	// no targets: wait for the page to get ready?
	if( !targets.length && obj.pageReady ){
	    pageReady(socket, obj, cbfunc, 0);
	    return;
	}
	// it's an error
	if( cbfunc ){
            cbfunc(`ERROR: ${targets.length} JS9 instance(s) found with id ${obj.id} (${obj.cmd})`);
	}
    }
};

//
// protocol handlers
//

// socketio handler: field socket.io requests
const socketioHandler = function(socket) {
    let i, j, m, a;
    // func outside loop needed to make jslint happy
    const xfunc = (obj, cbfunc) => {
	if( !obj ){return;}
	// exec the analysis task (via a wrapper func)
	execCmd(socket, obj, cbfunc);
    };
    // on disconnect: display a console message
    // returns: N/A
    // for other implementations, this is needed if you want to:
    //   show disconnects in the log
    socket.on("disconnect", (reason) => {
	const myhost = getHost(socket);
	// only process disconnect for displays (not js9 msgs or workers)
	if( socket.js9 && socket.js9.displays && !socket.js9worker ){
            clog("disconnect: %s (%s) [%s]",
		 myhost, JSON.stringify(socket.js9.displays), reason);
	    // clean up working directory, unless we reconnected
	    // use sync to prevent Electron.js from exiting too soon
	    if( socket.js9.aworkDir && globalOpts.rmWorkDir ){
		// timeout allows page to reconnect before we delete
		rmQueue[socket.js9.pageid] = socket.js9.aworkDir;
		setTimeout(() => {
		    if( rmQueue[socket.js9.pageid] ){
			rmdir.sync(socket.js9.aworkDir);
			delete rmQueue[socket.js9.pageid];
		    }
		}, globalOpts.rmWorkDelay);
	    }
	}
    });
    // on displays: set the list of displays for this connection
    // returns: unique page id (not currently used)
    // for other implementations, this is needed if you want to:
    //   support sending external messages to JS9 (i.e., via js9 script)
    socket.on("initialize", (obj, cbfunc) => {
	let basedir, aworkdir, jpath;
	const myhost = getHost(socket);
	if( !obj ){return;}
	socket.js9 = {};
	socket.js9.displays = obj.displays;
	if( obj.pageid ){
	    // reconnect: use old pageid
	    socket.js9.pageid = obj.pageid;
	    // remove from queue, if necessary
	    delete rmQueue[socket.js9.pageid];
	} else {
	    // new page: use new pageid
	    socket.js9.pageid = uuidv4();
	}
	js9Queue[socket.js9.pageid] = socket.js9;
	socket.js9.aworkDir = null;
	socket.js9.rworkDir = null;
	// create top-level workDir, if necessary
	// Electron.js might not be in the default location
	basedir = globalOpts.workDir;
	if( !path.isAbsolute(basedir) ){
	    basedir = path.join(installDir, basedir);
	}
	// futz with the case of a link pointing nowhere
	try { aworkdir = fs.readlinkSync(basedir); }
	catch(e){ aworkdir = basedir; }
	if( !fs.existsSync(aworkdir) ){
	    try{ fs.mkdirSync(aworkdir, parseInt('0755',8)); }
	    catch(e){ /* empty */ }
	}
	// create workDir for this connection, if possible
	if( fs.existsSync(aworkdir) ){
	    // absolute path of workdir
	    socket.js9.aworkDir = `${aworkdir}/${socket.js9.pageid}`;
	    // relative path of workdir
	    socket.js9.rworkDir = `${globalOpts.workDir}/${socket.js9.pageid}`;
	    if( !fs.existsSync(socket.js9.aworkDir) ){
		try{ fs.mkdirSync(socket.js9.aworkDir, parseInt('0755',8)); }
		catch(e){
		    cerr("can't create page workDir: ", e.message);
		    socket.js9.aworkDir = null;
		    socket.js9.rworkDir = null;
		}
	    }
	}
	// can we find the helper program?
	jpath = !!getFilePath(globalOpts.cmd, process.env.PATH, process.env);
	// log results
        clog("connect: %s (%s)", myhost, JSON.stringify(socket.js9.displays));
	if( cbfunc ){ cbfunc({pageid: socket.js9.pageid, js9helper: jpath, dataPathModify: globalOpts.dataPathModify}); }
    });
    // on display: add a display to the display list
    // returns: unique page id (not currently used)
    // for other implementations, this is needed if you want to:
    //   support sending external messages to JS9 (i.e., via js9 script)
    socket.on("addDisplay", (obj, cbfunc) => {
	if( !obj || !obj.display ){return;}
	socket.js9.displays = socket.js9.displays || [];
	socket.js9.displays.push(obj.display);
	if( cbfunc ){ cbfunc(socket.js9.pageid); }
    });
    // on display: rename a display in the display list
    // returns: unique page id (not currently used)
    // for other implementations, this is needed if you want to:
    //   allow renaming of JS9 display id for external communication
    socket.on("renameDisplay", (obj, cbfunc) => {
	let i;
	if( !obj || !obj.odisplay || !obj.ndisplay ){return;}
	socket.js9.displays = socket.js9.displays || [];
	for(i=0; i<socket.js9.displays.length; i++){
	    if( socket.js9.displays[i] === obj.odisplay ){
		socket.js9.displays[i] = obj.ndisplay;
		break;
	    }
	}
	if( cbfunc ){ cbfunc(socket.js9.pageid); }
    });
    socket.on("worker", (obj, cbfunc) => {
	let main, s;
	obj = obj || {};
	main = connectWorker(socket, obj.pageid);
	if( main ){
	    // connect worker to main
	    socket.js9 = main.js9;
	    // signal this is a worker
	    socket.js9worker = true;
	    s = "OK";
	} else {
	    s = `ERROR: can't find main connection for worker: ${obj.pageid}`;
	}
	if( cbfunc ){ cbfunc(s); }
    });
    // on alive: return "OK" to signal a valid connection
    socket.on("alive", (obj, cbfunc) => {
	    if( cbfunc ){ cbfunc("OK"); }
    });
    // on merge: merge analysis tasks from specified directory
    // for other implementations, this is needed if you want to:
    // add new analysis tasks from sources external to the installed code
    socket.on("merge", (obj, cbfunc) => {
	let s;
	const myip = getHost(socket);
	// local connections only
	if( (myip === "127.0.0.1") || (myip === "::ffff:127.0.0.1") ){
	    if( !obj || !obj.directory ){return;}
	    s = mergeDirectory(obj.directory);
	    if( cbfunc ){ cbfunc(s); }
	} else {
            s = `ERROR: rejecting remote merge request from: ${myip}`;
	    clog(s);
	    if( cbfunc ){ cbfunc(s); }
	}
    });
    // on image: signal from JS9 that a new or redisplayed image is active
    // returns: [input file path, fits file path, fits + extension]
    // for other implementations, this is needed if you want to:
    //   get FITS filename associated with PNG representation files
    //   (args 1 and 2 will be identical when imaging FITS files)
    socket.on("image", (obj, cbfunc) => {
	if( !obj ){return;}
	if( globalOpts.cmd ){
	    // make up js9helper command
	    obj.cmd = `${globalOpts.cmd} -i ${obj.image}`;
	    // exec the command
	    execCmd(socket, obj, cbfunc);
	}
    });
    // on getAnalysis: get analysis task definitions
    // returns: json string containing analysis task definitions
    // for other implementations, this is needed if you want to:
    //   support default server-side analysis (i.e. exec a wrapper script)
    socket.on("getAnalysis", (obj, cbfunc) => {
	if( !obj ){return;}
	sendAnalysisTasks(cbfunc);
    });
    // on runAnalysis: run an analysis task
    // returns: object w/ errcode, stderr (error string), stdout (results)
    // for other implementations, this is needed if you want to:
    //   support default server-side analysis (i.e. exec a wrapper script)
    // NB: retained for backward compatibility with old (cached) versions of JS9
    socket.on("runAnalysis", (obj, cbfunc) => {
	if( !obj ){return;}
	// exec the analysis task (via a wrapper func)
	execCmd(socket, obj, cbfunc);
    });
    // NB: instead of runAnalysis, now we use a handler for each separate task
    // returns: object w/ errcode, stderr (error string), stdout (results)
    // for other implementations, this is needed if you want to:
    //   support default server-side analysis (i.e. exec a wrapper script)
    for(j=0; j<analysis.pkgs.length; j++){
	for(i=0; i<analysis.pkgs[j].length; i++){
	    a = analysis.pkgs[j][i];
	    // check for required workDir
	    if( a.workDir && !globalOpts.workDir ){
		continue;
	    }
	    // loadproxy must be enabled explicitly
	    if( a.name === "loadproxy" && !globalOpts.loadProxy ){
		continue;
	    }
	    m = a.xclass ? (`${a.xclass}:${a.name}`) : a.name;
	    socket.on(m, xfunc);
	}
    }
    // on fits2fits: convert raw fits to fits representation file
    // returns: object w/ errcode, stderr (error string), stdout (results)
    // for other implementations, this is needed if you want to:
    //   support conversion of fits to fits representation
    socket.on("fits2fits", (obj, cbfunc) => {
	let myenv, s, size;
	const res = {stdout: null, stderr: null, errcode: 0,
		   encoding: globalOpts.textEncoding};
	// sanity checks
	if( !fits2fits[0] || !fits2fits[0].action || !obj ){
	    // client decides whether to use default file or throw error
	    res.stdout = "ERROR: no fits2fits action defined";
	    cbfunc(res);
	    return;
	}
	// environment, and datapath (for finding data files)
	myenv = process.env;
	myenv.JS9_DATAPATH = getDataPath(obj.dataPath);
	s = getFilePath(obj.fits, myenv.JS9_DATAPATH, myenv);
	if( !s ){
	    // did not find file, allow js9 to take care of it
	    if( cbfunc ){
		// client decides whether to use default file or throw error
		res.stdout = "ERROR: could not find FITS file in data path";
		cbfunc(res);
	    }
	    return;
	}
	if( obj.maxsize ){
	    size = getFileSize(s);
	    if( size < obj.maxsize ){
		// file size does not warrant using imsection
		if( cbfunc ){
		    res.stdout = obj.fits;
		    cbfunc(res);
		}
		return;
	    }
	}
	obj.fits = s;
	// make up fits2fits command string from defined fits2fits action
	obj.cmd = fits2fits[0].action;
        if( obj.parent ){
 	    obj.cmd = `${obj.cmd} -parent`;
        }
	obj.cmd = `${obj.cmd} ${obj.fits} ${obj.sect}`;
	// exec the conversion task (via a wrapper func)
	execCmd(socket, obj, cbfunc);
    });
    // on quotacheck: check whether temp directory is set up and under quota
    // returns: object w/ errcode, stderr (error string), stdout (results)
    // for other implementations, this is needed if you want to:
    //   allow JS9 to check quota before executing a file-generating task
    //   (e.g. upload a fits file)
    socket.on("quotacheck", (obj, cbfunc) => {
	if( !obj ){return;}
	if( quotacheck[0] && quotacheck[0].action ){
	    // make up quotacheck command string from defined quotacheck action
	    obj.cmd = quotacheck[0].action;
	    obj.rtype = quotacheck[0].rtype;
	    // exec the task (via a wrapper func)
	    execCmd(socket, obj, cbfunc);
	}
    });
    // on msg: send a command from an external source to a JS9 browser
    // nb: this msg comes from an external source, not from js9 itself
    // returns: results from JS9
    // for other implementations, this is needed if you want to:
    //   support sending external messages to JS9 (i.e., via js9 script)
    socket.on("msg", (obj, cbfunc) => {
	if( !obj ){return;}
	sendMsg(socket, obj, cbfunc);
    });
//  // an example of a site-specific in-line messsage:
//  socket.on("FOO:foo", (obj, cbfunc) => {
//    const s = `foo: ${JSON.stringify(obj.keys)}`;
//    // analysis tasks should return an object containing one or more:
//    // error (error code), stdout (string result), stderr (error msg)
//    if( cbfunc ){ cbfunc({stdout: s}); }
//  });
//  // After defining the foo message, you can do this in javascript:
//  // JS9.Send("FOO:foo",{keys:{"x":1,"y":2}}, (r) => {console.log(r)});
    // add plugins
    for(i=0; i<plugins.length; i++){
	if( plugins[i].sockio ){
	    try{ plugins[i].sockio(socket); }
	    catch(e){ cerr("can't add %s", plugins[i].name); }
	}
    }
};

// httpd handler: field pseudo-socket.io http requests
// GET:
// public api:
// wget -q -O- $MYHOST'/msg?{"id": "'$ID'", "cmd": "SetColormap", "args": ["red"]}'
// wget -q -O- $MYHOST'/msg?{"id": "'$ID'", "cmd": "GetColormap"}'
// wget -q -O- $MYHOST'/msg?{"id": "'$ID'", "cmd": "RunAnalysis", "args": ["counts"]}'
// js9 command line:
// wget -q -O- $MYHOST'/msg?{"id": "'$ID'", "cmd": "zoom", "args": [2]}'
// wget -q -O- $MYHOST'/msg?{"id": "'$ID'", "cmd": "zoom"}'
// wget -q -O- $MYHOST'/msg?{"id": "'$ID'", "cmd": "analysis", "args": ["counts"]}'
//
// POST:
// wget -q -O- --post-data='{"id": "'$ID'", "cmd": "GetColormap"}' $MYHOST/msg
// wget -q -O- --post-data='{"id": "'$ID'", "cmd": "SetColormap", "args": ["red"]}' $MYHOST/msg
// wget -q -O- --post-data='{"id": "'$ID'", "cmd": "RunAnalysis", "args": ["counts"]}' $MYHOST/msg
const httpHandler = function(req, res){
    let cmd, gobj, s, jstr;
    let body = "";
    // return error into to browser
    const htmlerr = (s) => {
	// remove non-ascii characters, which throw an error here
	// eslint-disable-next-line no-control-regex
	let msg = String(s).replace(/[^\x00-\x7F]/g, "");
	res.writeHead(400, msg, {"Content-Type": "text/plain"});
	res.end();
    };
    // call-back func returning info to the client
    const cbfunc = (s) => {
	let t;
	if( s === undefined || s === null ){ s = ""; }
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
	res.writeHead(200, {"Content-Type": "text/plain"});
	res.write(t);
	res.end();
    };
    // generate object and run the cmd
    const docmd = (cmd, jstr) => {
	let i, j, s;
	let obj = {};
	// the constructed string is stringified json, if it exists
	// try to parse it into an object
	if( cmd !== "alive" && jstr && jstr !== "null" ){
	    try{ obj = JSON.parse(jstr); }
	    catch(e){
		htmlerr("can't parse JSON object in http request");
		return;
	    }
	    if( typeof obj !== "object" ){
		htmlerr("invalid JSON object in http request");
		return;
	    }
	}
	// check for id and set default
	obj.id = obj.id || "JS9";
	// process the command
	switch(cmd){
	case "alive":
	    // if this is a jsonp request, wrap the return string
	    // (this is done by the desktop app)
	    if( jstr.match(/^callback=/) ){
		s = `${jstr.replace(/^callback=/, "")}("OK")`;
	    } else {
		// ordinary request with ordinary return
		s = "OK";
	    }
	    // return callback
	    cbfunc(s);
	    break;
	case "msg":
	    // send a command from an external source to a JS9 browser
	    sendMsg(req, obj, cbfunc);
	    break;
	default:
	    // plugin messages: NB needs authentication!
	    for(j=0; j<plugins.length; j++){
		// simple plugin: name is the same as the plugin filename
		if( plugins[j].http && (cmd === plugins[j].name) ){
		    plugins[j].http(req, obj, cbfunc);
		    return;
		}
		if( plugins[j].httpList ){
		    // list of plugins, each with their own name
		    for(i=0; i<plugins[j].httpList.length; i++){
			if( cmd === plugins[j].httpList[i].name ){
			    plugins[j].httpList[i].func(req, obj, cbfunc);
			    return;
			}
		    }
		}
	    }
	    htmlerr(`unknown command in ${req.method} request: ${cmd}`);
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
	s = `obj=${gobj.query}`;
	try{ jstr = qs.parse(s).obj; }
	catch(e){
	    htmlerr("can't parse JSON object in http GET request");
	    return;
	}
	docmd(cmd, jstr);
	break;
    case "POST":
	req.on('data', (chunk) => {
	    body += chunk;
	});
	req.on('end', () => {
	    jstr = String(body);
	    docmd(cmd, jstr);
	});
	break;
    default:
	htmlerr(`unsupported method: ${req.method}`);
	return;
    }
};

// polyfill for ES2017 Array.prototype.includes from:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
// From https://github.com/kevlatus/polyfill-array-includes/blob/master/array-includes.js
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function (searchElement, fromIndex) {

      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

//
// initialization
//

// add runtime directory to PATH
if( process.env.PATH ){
    process.env.PATH += (`:${installDir}`);
}

// load secure preferences
secure = loadSecurePreferences(securefile);

// load preference file
loadPreferences(prefsfile);

// override preferences with json on the command line
// but only if we are in a basic node program (i.e not Electron)
if( myProg === "node" || myProg === "nodejs" ){
    if( myArgs && myArgs.length > 0 ){
	for(i=0; i<myArgs.length; i++){
	    loadPreferences(myArgs[i]);
	}
    }
} else {
    if( process.env.JS9_HELPER_PREFS ){
	loadPreferences(process.env.JS9_HELPER_PREFS);
    }
}

// load analysis plugins
loadAnalysisTasks(globalOpts.analysisPlugins);

// load user-defined plugins
loadHelperPlugins(globalOpts.helperPlugins);

// merge, if necessary
if( globalOpts.merge ){
    mergeDirectory(globalOpts.merge);
}

// start up http server
if( secure ){
    app = https.createServer(secureOpts, httpHandler);
} else {
    app = http.createServer(httpHandler);
}

// never timeout, analysis requests can be very long
app.setTimeout(0);

// for each socket.io connection, receive and process custom events
io = require(server)(app, globalOpts.helperOpts);
io.on("connection", socketioHandler);

// start listening on the helper port
app.listen(globalOpts.helperPort, globalOpts.helperHost);

// signal that we are listening for connections
clog("helper: %s %s", globalOpts.helperHost, globalOpts.helperPort);

// an example of adding an in-line messsage to the analysis task list
if( process.env.NODEJS_FOO === "analysis" ){
    // add foo to the list of analysis tasks sent to JS9
    // it will go into the analysis menu and will be treated as analysis, i.e.
    // automatic macro expansion, light-window to display of text/plot, etc.
    // keys is an array macros to expand; they will be returned as an object
    addAnalysisTask({xclass: "FOO", name: "foo", title: "Do Foo",
		     keys: ["filename", "regions", "id"]});
}

// re-init analysis tasks and plugins on USR2
// eslint-disable-next-line no-unused-vars
process.on('SIGUSR2', (signal) => {
    analysis = {str:[], pkgs:[]};
    loadAnalysisTasks(globalOpts.analysisPlugins);
    plugins = [];
    loadHelperPlugins(globalOpts.helperPlugins);
});

// last ditch attempt to keep the server up
process.on("uncaughtException", (e) => {
    cerr("uncaughtException: %s [%s]", e, e.stack || e.stacktrace || "");
});

// clean up on exit
process.on("exit", () => {
    let i, client;
    const clients = getClients();
    // remove client work dirs, if necessary
    if( globalOpts.rmWorkDir ){
	for(i=0; i<clients.length; i++){
	    client = clients[i];
	    if( client && client.js9 && client.js9.aworkDir ){
		rmdir.sync(client.js9.aworkDir);
	    }
	}
    }
});

// in case we are called as a module
module.exports.globalOpts = globalOpts;
module.exports.io = io;
module.exports.app = app;
