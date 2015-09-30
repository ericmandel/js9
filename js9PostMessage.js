/*
 *
 * JS9 Post Message module (September 30, 2015)
 *
 * convenience routines to send a postMessage to JS9 inside an iFrame
 *
 * NB: This is an experimental module. Proceed with caution!
 *
 * Principals: Eric Mandel
 * Organization: Harvard Smithsonian Center for Astrophysics, Cambridge MA
 * Contact: saord@cfa.harvard.edu
 *
 * Copyright (c) 2015 Smithsonian Astrophysical Observatory
 *
 */

/*jslint plusplus: true, vars: true, white: true, continue: true, unparam: true, regexp: true, browser: true, devel: true, nomen: true */

var JS9PM = {};

JS9PM = (function(JS9PM){
"use strict";

JS9PM.error = function(s){
    alert("JS9PM ERROR: " + s);
    throw s;
};

// initialize post message processing (for iframes)
JS9PM.init = function (id, target){
    var pm = {cb: []};
    if( !id ){
        JS9PM.error("missing postMessage id for JS9");
    }
    pm.id = window.document.getElementById(id).contentWindow;
    if( !pm.id ){
        JS9PM.error("invalid postMessage id for JS9");
    }
    pm.target = target || "*";
    window.addEventListener("message", function(ev){
	var msg;
	var data = ev.data;
	if( typeof data === "string" ){
	    // json string passed (we hope)
	    try{ msg = JSON.parse(data); }
	    catch(e){ JS9PM.error("can't parse msg: "+data, e); }
	} else if( typeof data === "object" ){
	    // object was passed directly
	    msg = data;
	} else {
	    JS9PM.error("invalid return msg from postMessage");
	}
	if( pm.cb[msg.cmd] && msg.res ){
	    pm.cb[msg.cmd](msg.res);
	    delete pm.cb[msg.cmd];
	}
    });
    return pm;
};

// send a postMessage to a JS9PM iframe
JS9PM.send = function(pm, cmd, args, cb){
    var obj;
    if( !pm || !pm.id || !cmd ){
        JS9PM.error("invalid postMessage send for JS9");
    }
    obj = {cmd: cmd, args: args};
    if( cb ){
	pm.cb[cmd] = cb;
    }
    pm.id.postMessage(obj, pm.target);
};

// return namespace
return JS9PM;
}(JS9PM));
