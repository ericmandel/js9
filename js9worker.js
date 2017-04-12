/*
 *
 * js9Worker.js: web worker support (March 23, 2017)
 *
 * Principals: Eric Mandel
 * Organization: Harvard Smithsonian Center for Astrophysics, Cambridge MA
 * Contact: saord@cfa.harvard.edu
 *
 * Copyright (c) 2017 Smithsonian Astrophysical Observatory
 *
 */

/*global importScripts, io, Uint8Array */

// socket.io support
var socket = null;
var socketActive = false;
var socketImported = false;
var connected = false;
var timeout = 10000;
var socksuffix = "/socket.io/socket.io.js";
// this uploads large data sets on my slow (70kb/sec) DSL line without a hang
var emitMax = 409600;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/slice
// https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.slice
if (!Uint8Array.prototype.slice) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Uint8Array.prototype, 'slice', {
	value: Array.prototype.slice
    });
}

function initSocketIO(sockurl, pageid, id){
    var sockscript = sockurl + socksuffix;
    var sockopts = {
	reconnection: false,
	timeout
    };
    // import socketio scripts
    if( !socketImported ){
	importScripts(sockscript);
	socketImported = true;
    } else {
	// close off previous socket connection, if necessary
	if( socket ){
	    try{socket.disconnect();}
	    catch(e){}
	    socket = null;
	}
    }
    // connect to the helper
    socket = io.connect(sockurl, sockopts);
    // on-event processing
    socket.on("connect", function(){
	socket.emit("worker", {pageid: pageid}, function(s){
	    var res;
	    if( s === "OK" ){
		connected = true;
		self.postMessage({id: id, cmd: "initsocketio", result: "OK"});
	    } else {
		res = "couldn't connect worker to server with pageid: "+pageid;
		self.postMessage({id: id, cmd: "error", result: res});
	    }
	});
    });
    socket.on("connect_error", function(){
	self.postMessage({id: id, cmd: "connect_error", result: ""});
	connected = false;
    });
    socket.on("connect_timeout", function(){
	self.postMessage({id: id, cmd: "connect_timeout", result: ""});
	connected = false;
    });
    socket.on("disconnect", function(){
	var res = "";
	if( socketActive ){
	    res = "JS9 was disconnected from the remote server while " + socketActive + ". This likely is due to the server timing out, indicating either that too much data is being sent, or that your connection speed is too slow.";
	    socketActive = false;
	}
	self.postMessage({id: id, cmd: "disconnect", result: res});
	connected = false;
    });
}

// message handler
self.onmessage = function(e){
    var fname, data, slice, len, res;
    var obj = e.data || {};
    var args = obj.args;
    var uploadFITS = function(fname, data, total, cur, left){
	var len;
	var stdin = {};
	if( left > 0 ){
	    // how much to grab in this slice
	    len = Math.min(left, emitMax);
	    // grab the slice
	    slice = new Uint8Array(data).slice(cur, cur + len).buffer;
	    // make up the object containing slice and slice info
	    stdin = {data: slice, total: total, cur: cur, len: len};
	    // send data
	    socket.emit('uploadfits',
	    {'cmd': 'js9Xeq uploadfits ' + fname, 'stdin': stdin},
	    function(r){
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
	    socketActive = "uploading the FITS file";
	    socket.emit('uploadfits',
            {'cmd': 'js9Xeq uploadfits ' + fname, 'stdin': true},
            function(r){
		self.postMessage({id: obj.id, cmd: obj.cmd, result: r});
		socketActive = false;
	    });
	    // initial data is raw buffer from a typed array
	    // (hopefully with ownership transferred!)
	    data = args[1];
	    len = data.byteLength;
	    uploadFITS(fname, data, len, 0, len);
	} else {
	    res = "worker not connected to remote server";
	    self.postMessage({id: obj.id, cmd: "error", result: res});
	}
	break;
    default:
	res = "unknown web worker command: " + obj.cmd;
	self.postMessage({id: obj.id, cmd: "error", result: res});
	break;
    }
};

// error handler
self.onerror = function(e){
    var s = "in worker";
    if( typeof e === "string" ){
	s = e;
    } else if( typeof e === "object" ){
	s = e.message || "in worker";
    }
    self.postMessage({id: "NONE", cmd: "error", result: s});
};

