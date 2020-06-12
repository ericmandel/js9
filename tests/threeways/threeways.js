/*global $, JS9, sprintf */

"use strict";
var stop = false;
var n = 0;
var tot = 0;
var to = 3000;
var images = {};
var demoFuncs = [];
var js9id = "JS9";
var blenddir = "../../data/blend";

function dostop(){
    stop = true;
}

function message(s, t){
   var x;
   if( t ){
      x = "<center>" + sprintf(s,t) + "</center>";
    } else {
      x = "<center>" + s + "</center>";
    }
    $("#message").html(x);
}

// eslint-disable-next-line no-unused-vars
function threeways(){
    n =  0;
    message("image blending: NGC 2207/IC 2163");
    window.setTimeout(function(){
        if( demoFuncs[n] && !stop ){
            demoFuncs[n++]();
        }
    }, to);
}

demoFuncs[tot++] = function() {
    JS9.BlendDisplay(false, {display: js9id});
    JS9.Load(blenddir + "/chandra.fits", {onload: function(im){
        message("display %s", im.id);
        images.chandra = im;
        JS9.SetScale("log", {display: im});
        JS9.SetColormap("red", 5.78, 0.15, {display: im});
        JS9.SetZoom(2, {display: im});
	JS9.BlendImage("screen", 1, true, {display: im});
        window.setTimeout(function(){
            if( demoFuncs[n] && !stop ){
                demoFuncs[n++]();
            }
        }, to);
    }}, {display: js9id});
};

demoFuncs[tot++] = function() {
    JS9.Load(blenddir + "/galex.fits", {onload: function(im){
        message("display %s", im.id);
	JS9.SetScale("log", {display: im});
	JS9.SetColormap("green", 6.25, 0.25, {display: im});
	window.setTimeout(function(){
            message("reproject using chandra wcs");
            JS9.ReprojectData("chandra.fits", {display: im});
            JS9.SetColormap("green", 5.6, 0.74, {display: im});
            JS9.SetZoom(2, {display: im});
	    JS9.BlendImage("screen", 1, true, {display: im});
	    window.setTimeout(function(){
		if( demoFuncs[n] && !stop ){
		    demoFuncs[n++]();
		}
	    }, to);
	}, to);
    }}, {display: js9id});
};

demoFuncs[tot++] = function() {
    JS9.Load(blenddir + "/spitzer.fits", {onload: function(im){
        message("display %s", im.id);
	JS9.SetScale("log", {display: im});
	JS9.SetColormap("blue", 3.5, 0.55, {display: im});
	window.setTimeout(function(){
            message("reproject using chandra wcs");
            JS9.ReprojectData("chandra.fits", {display: im});
	    JS9.SetColormap("blue", 6.3, 0.54, {display: im});
            JS9.SetZoom(2, {display: im});
	    JS9.BlendImage("screen", 1, true, {display: im});
	    window.setTimeout(function(){
		if( demoFuncs[n] && !stop ){
		    demoFuncs[n++]();
		}
	    }, to);
	}, to);
    }}, {display: js9id});
};

demoFuncs[tot++] = function() {
    JS9.Load(blenddir + "/hst.fits", {scale:"log",scaleclipping:"user",scalemin:0,scalemax:5,colormap:"heat",contrast:4.0,bias:0.67, onload: function(im){
        message("display %s", im.id);
	JS9.SetScale("log", {display: im});
	JS9.SetColormap("heat", 4.0, 0.67, {display: im});
	window.setTimeout(function(){
            message("reproject using chandra wcs");
            JS9.ReprojectData("chandra.fits", {display: im});
	    JS9.SetColormap("heat", 3.0, 0.535, {display: im});
            JS9.SetZoom(2, {display: im});
	    JS9.BlendImage("screen", 1, true, {display: im});
	    window.setTimeout(function(){
		if( demoFuncs[n] && !stop ){
		    demoFuncs[n++]();
		}
	    }, to);
	}, to);
    }}, {display: js9id});
};

demoFuncs[tot++] = function() {
    message("blend all images");
    JS9.BlendDisplay(true, {display: js9id});
    window.setTimeout(function(){
	if( demoFuncs[n] && !stop ){
	    demoFuncs[n++]();
	}
    }, to * 2);
};

