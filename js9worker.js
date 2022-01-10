/*
 *
 * js9Worker.js: web worker support (March 23, 2017)
 *
 * Principals: Eric Mandel
 * Organization: Harvard Smithsonian Center for Astrophysics, Cambridge MA
 * Contact: saord@cfa.harvard.edu
 *
 * Copyright (c) 2017 - 2022 Smithsonian Astrophysical Observatory
 *
 */

/*global importScripts, io */

// socket.io support
let socket = null;
let socketActive = false;
let socketImported = false;
let connected = false;
let socksuffix = "/socket.io/socket.io.js";
const timeout = 10000;
// this uploads large data sets on my slow (70kb/sec) DSL line without a hang
const emitMax = 409600;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/slice
// https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.slice
if (!Uint8Array.prototype.slice) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Uint8Array.prototype, 'slice', {
	value: Array.prototype.slice
    });
}

function initSocketIO(sockurl, pageid, id){
    let sockscript;
    const sockopts = {
	reconnection: false,
	timeout: timeout
    };
    // if already connected, just say so and return;
    if( connected ){
	self.postMessage({id: id, cmd: "initsocketio", result: "OK"});
	return;
    }
    // import socketio scripts
    if( !socketImported ){
	sockscript = sockurl + socksuffix;
	importScripts(sockscript);
	socketImported = true;
    }
    // close off previous socket connection, if necessary
    if( socket ){
	try{socket.disconnect();}
	catch(e){ /* empty */ }
	socket = null;
    }
    // connect to the helper
    socket = io.connect(sockurl, sockopts);
    // on-event processing
    socket.on("connect", () => {
	socket.emit("worker", {pageid: pageid}, (s) => {
	    if( s === "OK" ){
		connected = true;
	    }
	    self.postMessage({id: id, cmd: "initsocketio", result: s});
	});
    });
    socket.on("connect_error", () => {
	connected = false;
	socketActive = false;
	self.postMessage({id: id, cmd: "connect_error", result: ""});
    });
    socket.on("connect_timeout", () => {
	connected = false;
	socketActive = false;
	self.postMessage({id: id, cmd: "connect_timeout", result: ""});
    });
    socket.on("disconnect", () => {
	const obj = {id: id, cmd: "disconnect"};
	if( socketActive ){
	    obj.alert = true;
	    obj.result = "The JS9 helper connection was unexpectedly severed (probably on the server side). Please try again.";
	} else if( connected ){
	    obj.result = "JS9 worker socket was disconnected";
	}
	connected = false;
	socketActive = false;
	self.postMessage(obj);
    });
}

// message handler
self.onmessage = function(e){
    let fname, data, slice, len, res;
    const obj = e.data || {};
    const args = obj.args;
    const uploadFITS = (fname, data, total, cur, left) => {
	let len;
	let stdin = {};
	if( left > 0 ){
	    // how much to grab in this slice
	    len = Math.min(left, emitMax);
	    // grab the slice
	    slice = new Uint8Array(data).slice(cur, cur + len).buffer;
	    // make up the object containing slice and slice info
	    stdin = {data: slice, total: total, cur: cur, len: len};
	    // send data
	    socket.emit('uploadfits',
	    {'cmd': `js9Xeq uploadfits ${fname}`, 'stdin': stdin},
	    (r) => {
		if( r.stdout === "OK" ){
		    // update progress bar
		    r = {value: Math.floor(((cur+len)/total)*100), max: 100};
		    self.postMessage({id: obj.id, cmd: "progress", result: r});
		    // recurse to send next slice
		    uploadFITS(fname, data, total, cur + len, left - len);
		} else {
		    // oops, we got an error
		    r = "uploading FITS data to server";
		    self.postMessage({id: obj.id, cmd: "error", result: r});
		    socketActive = false;
		}
	    });
	} else {
	    // give a hint to the GC
	    data = null;
	}
    };
    switch(obj.cmd){
    case "initsocketio":
	initSocketIO(args[0], args[1], obj.id);
	break;
    case "uploadFITS":
	if( connected ){
	    fname = args[0];
	    socketActive = true;
	    socket.emit('uploadfits',
            {'cmd': `js9Xeq uploadfits ${fname}`, 'stdin': true},
            (r) => {
		self.postMessage({id: obj.id, cmd: obj.cmd, result: r});
		socketActive = false;
	    });
	    // initial data is raw buffer from a typed array
	    // (hopefully with ownership transferred!)
	    data = args[1];
	    len = data.byteLength;
	    uploadFITS(fname, data, len, 0, len);
	} else {
	    res = "worker not connected to remote server: try reloading page";
	    self.postMessage({id: obj.id, cmd: "error", result: res});
	}
	break;
    default:
	socketActive = false;
	res = `unknown web worker command: ${obj.cmd}`;
	self.postMessage({id: obj.id, cmd: "error", result: res});
	break;
    }
};

// error handler
self.onerror = function(e){
    let s = "in worker";
    if( typeof e === "string" ){
	s = e;
    } else if( typeof e === "object" ){
	s = e.message || "in worker";
    }
    self.postMessage({id: "NONE", cmd: "error", result: s});
};

