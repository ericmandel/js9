/*
 *
 * JS9 module (December 10, 2012)
 *
 * Principals: Eric Mandel, Alexey Vikhlinin
 * Organization: Harvard Smithsonian Center for Astrophysics, Cambridge MA
 * Contact: saord@cfa.harvard.edu
 *
 * Copyright (c) 2012 - 2015 Smithsonian Astrophysical Observatory
 *
 * Utilizes: jquery.js
 *           jquery.contextMenu.js
 *           jquery.flot.js, jquery.flot.errorbars.js
 *           socket.io.js
 *           fabric.js
 *           dhtmlwindow.js
 *           sprintf.js
 *           astroem.js (includes cfitsio, wcslib)
 *           fitsy.js
 *
 */

/*jslint plusplus: true, vars: true, white: true, continue: true, unparam: true, regexp: true, browser: true, devel: true, nomen: true */

/*global $, jQuery, Event, fabric, io, CanvasRenderingContext2D, sprintf, Blob, ArrayBuffer, Uint8Array, Uint16Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, DataView, FileReader, Fitsy, Astroem, dhtmlwindow, saveAs */

/*jshint smarttabs:true */

// check for already-loaded module
var JS9;
if( JS9 && (typeof JS9 !== "object" || JS9.NAME) ){
    throw new Error("Namespace 'JS9' already exists");
}
// create the module and seed with standard values
var JS9 = {};
JS9.NAME = "JS9";		// The name of this namespace
JS9.VERSION = "1.5";		// The version of this namespace
JS9.COPYRIGHT = "Copyright (c) 2012-2015 Smithsonian Institution";

// use the module augmentation pattern, passing in our already-defined module
JS9 = (function(JS9){
"use strict";

// internal defaults (not usually changed by users)
JS9.DEFID = "JS9";		// default JS9 display id
JS9.ANON = "[anonymous]";	// name to use for images with no name
JS9.PREFSFILE = "js9Prefs.json";// prefs file to load
JS9.ZINDEX = 0;			// z-index of image canvas: on bottom of js9
JS9.SHAPEZINDEX = 7;		// z-index of 2d graphics (regions is +2)
JS9.MESSZINDEX = 8;		// z-index of messages: above graphics
JS9.BTNZINDEX = 10;		// z-index of buttons on top of plugin canvases
JS9.MENUZINDEX = 1000;		// z-index of menus: always on top!
JS9.COLORSIZE = 1024;		// size of contrast/biased color array
JS9.SCALESIZE = 16384;		// size of scaled color array
JS9.INSTALLDIR="";		// prefix to get to js9 install directory
JS9.TOROOT="";			// prefix to get to data file from install
JS9.PLUGINS="";			// regexp list of plugins
JS9.LIGHTWIN = "dhtml";		// light window type: choice of dhtml
JS9.ANTIALIAS = false;		// use anti-aliasing?
JS9.SCALEIREG = true;		// scale interactive regions by zoom factor?
JS9.NOMOVE = 3;			// number of pixels before we recognize movement
JS9.DBLCLICK = 500;		// milliseconds for double-click
JS9.TIMEOUT = 250;		// ms before assuming light window is up
JS9.SUPERMENU = /^_SUPERMENU/;  // base of supermenu id 
// modified from:
// http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
JS9.BROWSER = (function(){
  var P= navigator.platform;
  var N= navigator.appName, ua= navigator.userAgent, tem;
  var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
  tem= ua.match(/version\/([\.\d]+)/i);
  if(M && tem !== null){ M[2]= tem[1]; }
  M= M? [M[1], M[2], P]: [N, navigator.appVersion,'-?', P];
  M.push(/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(ua));
  return M;
}());

// global options
JS9.globalOpts = {
    helperType: "sock.io",	// one of: sock.io, get, post
    helperPort: 2718,		// default port for node.js helper
    winType: "light",		// plugin window: "light" or "new"
    rgb: {mode: false,		// rgb mode
	  rim: null,
	  gim: null,
	  bim: null},
    defcolor: "#00FF00",	// graphics color when all else fails
    pngisfits: true,		// are PNGs really PNG representation files?
    fits2png: false,		// do we convert FITS to  PNG representation?
    alerts: true,		// set to false to turn off alerts
    internalValPos: true,	// a fancy info plugin can turns this off
    xtimeout: 1000,		// connection timeout for xhr requests
    extlist: "EVENTS STDEVT",	// list of binary table extensions
    dims: [1024, 1024],		// dims of extracted images
    helperProtocol: location.protocol,// http: or https:
    maxMemory: 450000000,	// max heap memory to allocate for a fits image
    debug: 0			// debug level
};

// image param defaults
JS9.imageOpts = {
    contrast: 1.0,			// default color contrast
    bias: 0.5,				// default color bias
    invert: false,			// default colormap invert
    exp: 1000,				// default exp value for scaling
    colormap: "grey",			// default color map
    scale: "linear",			// default scale algorithm
    scaleclipping: "dataminmax",	// "dataminmax" or "zscale" to start
    zscalecontrast: 0.25,		// default from ds9
    zscalesamples: 600,			// default from ds9
    zscaleline: 120,			// default from ds9
    wcssys: "native",			// default WCS sys
    wcsunits: "sexagesimal",		// default WCS units
    lcs: "physical",			// default logical coordinate system
    valpos: true,			// whether to display value/position
    alpha:  255,                        // alpha for this image
    alpha1: 100,			// alpha for masked pixels
    alpha2: 255,			// alpha for unmasked pixels
    // xcen: 0,                         // default x center pos to pan to
    // ycen: 0,                         // default y center pos to pan to
    zoom: 1,				// default zoom factor
    zooms: 5,				// how many zooms in each direction?
    nancolor: "#000000",		// 6-digit #hex color for NaN values
    listonchange: false			// whether to list after a reg change
};

// defaults for analysis (macro expansion)
JS9.analOpts = {
    // if this pattern is matched in stderr, throw a real error
    epattern: /^(ERROR:[^\n]*)\n/,
    // location of datapath's param html file
    dpathURL: "params/datapath.html",
    // prepend $JS9_DIR to relative fitsFile paths?
    prependJS9Dir: true,
    // use as path to FITS data or use incoming path if not set
    dataDir: null
};

// light window opts
JS9.lightOpts = {
    dhtml: {
	top:      ".dhtmlwindow",
	drag:     ".drag-contentarea",
	dragBar:  "drag-handle",
	format:   "width=%spx,height=%spx,center=1,resize=%s,scrolling=0",
	textWin:  "width=830px,height=400px,center=1,resize=1,scrolling=1",
	plotWin:  "width=830px,height=420px,center=1,resize=1,scrolling=1",
	dpathWin: "width=830px,height=175px,center=1,resize=1,scrolling=1",
	paramWin: "width=830px,height=230px,center=1,resize=1,scrolling=1",
	imageWin: "width=512px,height=542px,center=1,resize=1,scrolling=1",
	lineWin:  "width=400px,height=10px,center=1,resize=1,scrolling=1"
    }
};

// colors for text messages
JS9.textColorOpts = {
    regions: "#00FF00",
    info:    "#00FF00"
};

// defaults for plot creation
JS9.plotOpts = {
    zoomStack: true,
    selection: {
	mode: "xy"
    },
    series: {
	clickable: true,
	hoverable: true,
        lines: { show: true },
        points: { show: false }
    }
};

// help pages
JS9.helpOpts = {
    user: {
	type: "help", url:"user.html",
	title: "JS9 User Manual"
    },
    install: {
	type: "help", url:"install.html",
	title: "Installing JS9"
    },
    webpage: {
	type: "help", url:"webpage.html",
	title: "Adding JS9 To A Web Page"
    },
    yourdata: {
	type: "help", url:"yourdata.html",
	title: "Adding Data To A Web Page"
    },
    localtasks: {
	type: "help", url:"localtasks.html",
	title: "Local Analysis with JS9"
    },
    publicapi: {
	type: "help", url:"publicapi.html",
	title: "The JS9 Public API"
    },
    helper: {
	type: "help", url:"helper.html",
	title: "Adding Server-side Analysis"
    },
    serverside: {
	type: "help", url:"serverside.html",
	title: "Server-side Analysis with JS9"
    },
    regions: {
	type: "help", url:"regions.html",
	title: "JS9 Regions Format"
    },
    extmsg: {
	type: "help", url:"extmsg.html",
	title: "JS9 External Messaging"
    },
    preferences: {
	type: "help", url:"preferences.html",
	title: "JS9 Site Preferences"
    },
    repfile: {
	type: "help", url:"repfile.html",
	title: "The PNG Represention File"
    },
    changelog: {
	type: "help", url:"changelog.html",
	title: "JS9 ChangeLog"
    },
    issues: {
	type: "help", url:"knownissues.html",
	title: "Known Issues"
    }
};

// menu buttons in the menubar
// NB: names must match actual menus, menu labels are arbitrary
JS9.menuButtonOptsArr = [{name: "file", label: "File"}, 
			 {name: "view", label: "View"},
			 {name: "zoom", label: "Zoom"},
			 {name: "scale", label: "Scale"},
			 {name: "color", label: "Color"},
			 {name: "region", label: "Region"},
			 {name: "wcs", label: "WCS"},
			 {name: "analysis", label: "Analysis"},
			 {name: "help", label: "Help"}];

// misc arrays (mostly) holding instances of various primary objects
JS9.images = [];		// array of current images
JS9.displays = [];		// array of current display canvases
JS9.colormaps = [];		// array of current colormaps
JS9.commands = [];		// array of commands
JS9.plugins = [];		// array of defined plugins
JS9.preloads = [];		// array of images to preload
JS9.auxFiles = [];		// array of auxiliary files
JS9.publics = {};		// object containing defined public API calls
JS9.helper = {};		// only one helper per page, please
JS9.fits = {};			// object holding FITS access routines
JS9.userOpts = {};		// object to hold localStorage opts

// misc params
// list of scales in mkScaledCells
JS9.scales = ["linear", "log", "pow", "sqrt", "squared", "asinh", "sinh"];

// list of known wcs systems
JS9.wcssyss = ["FK4", "FK5", "ICRS", "galactic", "ecliptic", "native", 
	       "image", "physical"];

// list of known wcs units
JS9.wcsunitss = ["degrees", "sexagesimal", "pixels"];

// html used by the menubar plugin
JS9.menubarHTML = "";

// html used by the console plugin
JS9.consoleHTML =
"<form name='form' onsubmit='return false;' class='JS9CmdForm' action=''>" +
"<table class='JS9CmdTable'>" +
"<tr class='JS9Tr'>"+
"<td><div id='JS9CmdPrompt' class='JS9CmdPrompt'>@@PR@@</div></td>" +
"<td class='JS9CmdTd'><input type='text' class='JS9CmdIn' autocomplete='off' value='' /></td>" +
"</tr>" +
"</table>" +
"</form>";

// known bugs and work-arounds
JS9.bugs = {};
// sometimes hiding the menu does not refresh the image properly
JS9.bugs.hide_menu = true;
// firefox does not repaint as needed (last checked FF 24.0 on 10/20/13)
if( (JS9.BROWSER[0] === "Firefox") && JS9.BROWSER[2].search(/Linux/) >=0 ){
    JS9.bugs.firefox_linux = true;
}
// chrome 31 broke disableStrokeScale so that the shape border is not drawn
// fixed in chrome canary 33.0.1729.3 (12/5/2013)
if( (JS9.BROWSER[0] === "Chrome") ){
    JS9.bugs.tval = parseInt(JS9.BROWSER[1].split(".").shift(), 10);
    if(  (JS9.bugs.tval >= 31) && (JS9.bugs.tval <= 33) ){
	JS9.bugs.chrome_31 = true;
    }
}

// ---------------------------------------------------------------------
// JS9 Image object to manage images
// ---------------------------------------------------------------------
JS9.Image = function(file, params, func){
    var sarr;
    var display;
    var pname, pinst, popts;
    var that = this;
    var localOpts=null;
    var mksect = function(that, localOpts){
	var zoom;
	var arr = [];
	// make up section array from default values
	if( localOpts.xcen !== undefined ){
	    arr.push(localOpts.xcen);
	}
	if( localOpts.ycen !== undefined ){
	    arr.push(localOpts.ycen);
	}
	if( localOpts.zoom !== undefined ){
	    zoom = that.parseZoom(localOpts.zoom);
	    if( zoom ){
		arr.push(zoom);
	    }
	}
	return arr;
    };
    // params can be an object containing local params, or the display string
    if( params ){
	if( typeof params === "object" ){
	    localOpts = params;
	    if( localOpts.display ){
		display = localOpts.display;
	    }
	} else {
	    display = params;
	}
    }
    // make sure we have a valid display
    if( !display ){
	if( JS9.displays.length > 0 ){
	    display = JS9.displays[0].id;
	} else {
	    display = JS9.DEFID;
	}
    }
    // it's an image
    this.type = "image";
    // set the display
    this.display = JS9.lookupDisplay(display);
    // copy image parameters
    this.params = $.extend(true, {}, JS9.imageOpts, localOpts);
    // set the colormap object from colormap name (text string)
    this.cmapObj = JS9.lookupColormap(this.params.colormap);
    // do we display?
    this.displayMode = true;
    // mouse event state
    this.evstate = -1;
    // no region clicks yet
    this.rclick = 0;
    // no helper queried yet
    this.queried = false;
    // offsets into canvas to display
    this.ix = 0;
    this.iy = 0;
    // init some new parameters
    this.params.scalemin = Number.Nan;
    this.params.scalemax = Number.Nan;
    // xeq callback for region changes?
    this.params.xeqonchange = true;
    // copy plot parameters
    this.params.plotOpts = $.extend(true, {}, JS9.plotOpts);
    // create the png object
    this.png = {};
    // image element to hold png file, from which array data is generated
    this.png.image = new Image();
    // init menubar, if necessary
    // this.initMenubar();
    // init status object
    this.status = {};
    // primary image
    this.primary = {};
    // section parameters
    this.primary.sect = {zoom: 1, ozoom: 1};
    // graphical layers
    this.layers = {};
    // no logical coordinate systems
    this.lcs = {};
    // array of aux file pointers
    this.aux = {};
    // binning parameters
    this.binning = {bin: 1, obin: 1};
    // temp flag determines if we should update shapes at end of this call
    this.updateshapes = false;
    // file argument can be an object containing raw data or
    // a string containing a URL of a PNG image
    switch( typeof file ){
    case "object":
	// save source
	this.source = "fits";
	// generate the raw data array from the hdu
	this.mkRawDataFromHDU(file, file.filename);
	// do zscale, if necessary
	if( this.params.scaleclipping === "zscale" ){
	    this.zscale(true);
	}
	// set up initial section
	this.mkSection();
	// change center and zoom if necessary
	sarr = mksect(this, localOpts);
	if( sarr.length ){
	    this.mkSection.apply(this, sarr);
	}
	// display image, 2D graphics, etc.
	this.displayImage("all");
	// clear previous messages
	this.clearMessage();
	// add to list of images
	JS9.images.push(this);
	// call function, if necessary
	if( func ){
	    try{ JS9.xeqByName(func, window, this); }
	    catch(e){ JS9.error("in image onload callback", e, false); }
	}
	// plugin callbacks
	for( pname in this.display.pluginInstances ){
	    if( this.display.pluginInstances.hasOwnProperty(pname) ){
		pinst = this.display.pluginInstances[pname];
		popts = pinst.plugin.opts;
		if( pinst.isActive("onimageload") ){
		    try{ popts.onimageload.call(pinst, this); }
		    catch(e){ pinst.errLog("onimageload", e); }
		}
	    }
	}
	// update shapes?
	if( this.updateshapes ){
	    this.updateShapes("regions", "all", "update");
	}
	// load is complete
	this.status.load = "complete";
	// done loading, reset wait cursor
	JS9.waiting(false);
	break;
    case "string":
	// save source
	this.source = "fits2png";
	// image or table
	this.imtab = "image";
	// downloaded image file
	this.file = file;
	// take file but discard path (or scheme) up to slashes
	this.oid = this.file.split("/").reverse()[0];
	// save id in case we have to change it for uniqueness
	this.id = JS9.getImageID(this.oid, this.display.id);
	// load status
	this.status.load = "loading";
	// change the cursor to show the waiting status
	JS9.waiting(true);
	// callback to fire when image is loaded (do this before setting src)
	$(this.png.image).on("load", function(evt){
	    var ppname, ppinst, ppopts;
	    // populate the image data array from RGB values
	    that.mkOffScreenCanvas();
	    // populate the raw image data array from RGB values
	    that.mkRawDataFromPNG();
	    // do zscale, if necessary
	    if( that.params.scaleclipping === "zscale" ){
		that.zscale(true);
	    }
	    // set up initial section
	    that.mkSection();
	    // change center and zoom if necessary
	    sarr = mksect(that, localOpts);
	    if( sarr.length ){
		that.mkSection.apply(that, sarr);
	    }
	    // display image, 2D graphics, etc.
	    that.displayImage("all");
	    // clear previous messages
	    that.clearMessage();
	    // add to list of images
	    JS9.images.push(that);
	    // call function, if necessary
	    if( func ){
		try{ JS9.xeqByName(func, window, that); }
		catch(e){ JS9.error("in image onload callback", e, false); }
	    }
	    // plugin callbacks
	    for( ppname in that.display.pluginInstances ){
		if( that.display.pluginInstances.hasOwnProperty(ppname) ){
		    ppinst = that.display.pluginInstances[ppname];
		    ppopts = ppinst.plugin.opts;
		    if( ppinst.isActive("onimageload") ){
			try{ ppopts.onimageload.call(ppinst, that); }
			catch(e){ pinst.errLog("onimageload", e); }
		    }
		}
	    }
	    // load is complete
	    that.status.load = "complete";
	    // done loading, reset wait cursor
	    JS9.waiting(false);
	    // debugging
	    if( JS9.DEBUG ){
		JS9.log("JS9 image: %s dims(%d,%d) min/max(%d,%d)",
			that.file, that.raw.width, that.raw.height,
			that.raw.dmin, that.raw.dmax);
	    }
	}).on("error", function(evt){
	    // done loading, reset wait cursor
	    JS9.waiting(false);
	    // error on load
	    that.status.load = "error";
	    JS9.error("could not load image: "+that.id);
	});
	// set src to download the png and eventually display the image data
	this.png.image.src = file;
	break;
    default:
	JS9.log("unknown specification type for Load: "+ typeof file);
    }
};

// undisplay the image, release resources
JS9.Image.prototype.closeImage = function(){
    var i, tim, key;
    var pname, pinst, popts;
    var ilen= JS9.images.length;
    var display = this.display;
    // look for an image and remove it
    for(i=0; i<ilen; i++){
	if( this === JS9.images[i] ){
	    tim = JS9.images[i];
	    // nothing on the screen
	    tim.clearMessage();
	    tim.display.context.clear();
	    // plugin callbacks
	    for( pname in tim.display.pluginInstances ){
		if( tim.display.pluginInstances.hasOwnProperty(pname) ){
		    pinst = tim.display.pluginInstances[pname];
		    popts = pinst.plugin.opts;
		    if( pinst.isActive("onimageclose") ){
			try{ popts.onimageclose.call(pinst, tim); }
			catch(e){ pinst.errLog("onimageclose", e); }
		    }
		}
	    }
	    // remove all layers
	    for( key in tim.layers ){
		if( tim.layers.hasOwnProperty(key) ){
		    tim.layers[key].canvas.dispose();
		    tim.layers[key] = null;
		}
	    }
	    // clear image from display
	    tim.display.image = null;
	    // remove from rgb, if necessary
	    switch(tim.cmapObj.name){
	    case "red":
		JS9.globalOpts.rgb.rim = null;
		break;
	    case "green":
		JS9.globalOpts.rgb.gim = null;
		break;
	    case "blue":
		JS9.globalOpts.rgb.bim = null;
		break;
	    }
	    // cleanup FITS file support, if necessary
	    if( JS9.fits.cleanupFITSFile && 
		tim.raw.hdu && tim.raw.hdu.fits ){
		JS9.fits.cleanupFITSFile(tim.raw.hdu.fits, true);
	    }
	    // good hints to the garbage collector
	    tim.primary = null;
	    tim.offscreen = null;
	    tim.raw = null;
	    tim.colorData = null;
	    tim.colorCells = null;
	    tim.psColors = null;
	    tim = null;
	    // remove image from active list
	    JS9.images.splice(i,1);
	    break;
	}
    }
    // display another image, if available
    for(i=0; i<JS9.images.length; i++){
	tim = JS9.images[i];
	if( display === tim.display ){
	    // display image, 2D graphics, etc.
	    tim.displayImage("display");
	    break;
	}
    }
};

// make offscreen canvas to hold RGB data from the png file
JS9.Image.prototype.mkOffScreenCanvas = function(){
    // sanity check
    if( !this.png || !this.png.image ){
	return this;
    }
    // offscreen object holds canvas into which we draw to get RGB values
    // no need for jquery here, we only manipulate this via the canvas API
    this.offscreen = {};
    this.offscreen.canvas = document.createElement("canvas");
    this.offscreen.canvas.setAttribute("width", this.png.image.width);
    this.offscreen.canvas.setAttribute("height", this.png.image.height);
    this.offscreen.context = this.offscreen.canvas.getContext("2d");
    // turn off anti-aliasing
    if( !JS9.ANTIALIAS ){
	this.offscreen.context.imageSmoothingEnabled = false;
	this.offscreen.context.mozImageSmoothingEnabled = false;
	this.offscreen.context.webkitImageSmoothingEnabled = false;
    }
    // draw the png to the offscreen canvas
    this.offscreen.context.drawImage(this.png.image, 
				     0, 0, 
				     this.png.image.width, 
				     this.png.image.height,
				     0, 0, 
				     this.png.image.width, 
				     this.png.image.height);
    // read the RGBA data from offscreen
    try{
    this.offscreen.img = this.offscreen.context.getImageData(0, 0, 
				    this.png.image.width, 
				    this.png.image.height);
    } catch(e){
	if( (JS9.BROWSER[0] === "Chrome") && (document.domain === "") ){
	    alert("When using the file:// URI, Chrome must be run with the --allow-file-access-from-files switch to permit JS9 to access data.");
	} else {
	    alert("could not read JS9 data");
	}
    }
    // allow chaining
    return this;
};


// initialize keywords for various logical coordinate systems
JS9.Image.prototype.initLCS = function(header){
    var arr = [[0,0,0], [0,0,0], [0,0,0]];
    var invertm3 = function(xin){
	var i, j;
	var det_1;
	var prec = 1.0e-15;
	var pos = 0.0;
	var neg = 0.0;
	var xout = [[0,0,0], [0,0,0], [0,0,0]];
	var temp =  xin[0][0] * xin[1][1];
	var accum = function(){
	    if( temp >= 0.0 ){
		pos += temp;
	    } else {
		neg += temp;
	    }
	};
	// sanity check for a header param missing or NaN
	for(i=0; i<3; i++){
	    for(j=0; j<2; j++){
		if( (xin[i][j] === undefined) || isNaN(xin[i][j]) ){
		    return null;
		}
	    }
	}
	accum();
	temp = -xin[0][1] * xin[1][0];
	accum();
	det_1 = pos + neg;
	// Is the submatrix A singular?
	if( (det_1 === 0.0) || (Math.abs(det_1 / (pos - neg)) < prec) ){
	    // Matrix M has no inverse
	    return null;
	}
	// Calculate inverse(A) = adj(A) / det(A)
	det_1 = 1.0 / det_1;
	xout[0][0] =   xin[1][1] * det_1;
	xout[1][0] = - xin[1][0] * det_1;
	xout[0][1] = - xin[0][1] * det_1;
	xout[1][1] =   xin[0][0] * det_1;
	// Calculate -C * inverse(A)
	xout[2][0] = - (xin[2][0] * xout[0][0] + xin[2][1] * xout[1][0]);
	xout[2][1] = - (xin[2][0] * xout[0][1] + xin[2][1] * xout[1][1]);
	return xout;
    };

    // sanity check
    if( !header ){
	return;
    }
    // physical coords
    arr[0][0] = header.LTM1_1 || 1.0;
    arr[1][0] = header.LTM2_1 || 0.0;
    arr[0][1] = header.LTM1_2 || 0.0;
    arr[1][1] = header.LTM2_2 || 1.0;
    arr[2][0] = header.LTV1   || 0.0;
    arr[2][1] = header.LTV2   || 0.0;
    this.lcs.physical = {forward: $.extend(true, [], arr),
			 reverse: invertm3(arr)};
    if( !this.lcs.physical.reverse ){
	delete this.lcs.physical;
    }
    // detector coordinates
    arr[0][0] = header.DTM1_1 || 1.0;
    arr[1][0] = header.DTM2_1 || 0.0;
    arr[0][1] = header.DTM1_2 || 0.0;
    arr[1][1] = header.DTM2_2 || 1.0;
    arr[2][0] = header.DTV1   || 0.0;
    arr[2][1] = header.DTV2   || 0.0;
   this.lcs.detector = {forward: $.extend(true, [], arr), 
			reverse: invertm3(arr)};
    if( !this.lcs.detector.reverse ){
	delete this.lcs.detector;
    }
    // amplifier coordinates
    arr[0][0] = header.ATM1_1 || 1.0;
    arr[1][0] = header.ATM2_1 || 0.0;
    arr[0][1] = header.ATM1_2 || 0.0;
    arr[1][1] = header.ATM2_2 || 1.0;
    arr[2][0] = header.ATV1   || 0.0;
    arr[2][1] = header.ATV2   || 0.0;
    this.lcs.amplifier = {forward: $.extend(true, [], arr),
			  reverse: invertm3(arr)};
    if( !this.lcs.amplifier.reverse ){
	delete this.lcs.amplifier;
    }
    // reset lcs to image, if necessary
    if( !this.lcs[this.params.lcs] ){
	this.params.lcs = "image";
    }
    // set current, if not already done
    if( !this.params.wcssys0 ){
	this.setWCSSys("physical");
	this.params.wcssys0 = this.params.lcs;
    }
};

// unpack IMG data and convert to JS9 image data
JS9.Image.prototype.mkRawDataFromIMG = function(img){
    var i, h, w, ibuf, x, y, v;
    // sanity check
    if( !img ){
	return;
    }
    // convenience variables
    h = img.height;
    w = img.width;
    ibuf = img.data;
    // create a raw array to hold the reconsituted data
    this.raw.data = new Float32Array(h*w);
    // get data value from RGB
    for(i=0, y=0; y<h; y++){
	for(x=0; x<w; x++){
	    // NTSC
	    v =  0.299 * ibuf[i] + 0.587 * ibuf[i+1] + 0.114 * ibuf[i+2];
	    // "Modern"
	    // v = 0.212 * ibuf[i] + 0.715 * ibuf[i+1] + 0.073 * ibuf[i+2];
	    this.raw.data[(h-y)*w+x] = v; 
	    i += 4;
	}
    }
    // fill in the raw info
    this.raw.width = w;
    this.raw.height = h;
    this.raw.bitpix = -32;
    this.raw.dmin = Number.MAX_VALUE;
    this.raw.dmax = Number.MIN_VALUE;
    // find data min and max
    for(i=0; i<h*w; i++) {
	if( !isNaN(this.raw.data[i]) ){
	    this.raw.dmin = Math.min(this.raw.dmin, this.raw.data[i]);
	    this.raw.dmax = Math.max(this.raw.dmax, this.raw.data[i]);
	}
    }
    // set initial scaling values if not done already
    if( isNaN(this.params.scalemin) ){
	this.params.scalemin = this.raw.dmin;
    }
    if( isNaN(this.params.scalemax) ){
	this.params.scalemax = this.raw.dmax;
    }
    // change data source
    this.source = "png";
    // there is no header
    this.raw.header = null;
    // allow chaining
    return this;
};

// unpack PNG data and convert to image data
JS9.Image.prototype.mkRawDataFromPNG = function(){
    var i, s, idx, offscreen, dlen, mode, tval,  getfunc, littleEndian;
    var card, pars, clen;
    var realpng, hstr, hstrs = [];
    // memory array of 8 bytes
    var abuf = new ArrayBuffer(8);
    // we will transfer unsigned bytes from the png file into the mem array
    var u = new Uint8Array(abuf);
    // we will use the DataView api to access these bytes as typed data
    // (including possible endian conversion)
    var dv = new DataView(abuf);
    // sanity check (we will null out the png image when we are done with it)
    if( !this.offscreen.img  ){
	return this;
    }
    // create the object to hold raw data
    this.raw = {};
    // offscreen image data
    offscreen = this.offscreen.img.data;
    // gather up the json header (until we hit a null, skipping bogus values)
    for(idx=0, i=0; idx<offscreen.length; idx++) {
	// null is the end of the string
	if( offscreen[idx] === 0 ){
	    break;
	} 
	if( offscreen[idx] !== 255 ){
	    hstrs[i] = String.fromCharCode(offscreen[idx]);
	    i++;
	}
	// check for a JS9 header on a representation file
	if( (i === 15) && (hstrs.join("") !== '{"js9Protocol":') ){
	    realpng = true;
	    break;
	}
    }
    // see if we have a real PNG file instead of a representation file
    if( (i < 15) || realpng ){
	// holy moly, its a real png file!
	this.mkRawDataFromIMG(this.offscreen.img); 
	// having the real image, we can ask to release the offscreen image
	this.offscreen.img = null;    
	return;
    }
    // its a representation file
    // create and try to parse the json header
    hstr = hstrs.join("");
    if( JS9.DEBUG > 2 ){
	JS9.log("jsonHeader: %s", hstr);
    }
    try{ s = JSON.parse(hstr); }
    catch(e){
	JS9.error("can't read FITS header from PNG file: "+hstr, e);
    }
    if( s.js9Protocol === 1.0 ){
	this.raw.header = s;
	this.raw.endian = this.raw.header.js9Endian;
	this.raw.protocol = this.raw.header.js9Protocol;
    } else {
	this.raw.endian = s.js9Endian;
	this.raw.protocol = s.js9Protocol;
	this.raw.cardstr = s.cardstr;
	this.raw.ncard = s.ncard;
	this.raw.header = {};
	// make up header from string containing 80-char raw cards
	clen = this.raw.ncard;
	for(i=0; i<clen; i++){
	    card = this.raw.cardstr.slice(i*80, (i+1)*80);
	    pars = JS9.cardpars(card);
	    if ( pars !== undefined ) {
		this.raw.header[pars[0]] = pars[1];
	    }
	}
    }
    // set the pointer to start of "real" image data
    idx = idx + 1;
    // make sure we have a valid FITS header
    if( this.raw.header.NAXIS1 ){
	this.raw.width = this.raw.header.NAXIS1;
    } else {
	JS9.error("NAXIS1 missing from PNG-based FITS header");
    }
    if( this.raw.header.NAXIS2 ){
	this.raw.height = this.raw.header.NAXIS2;
    } else {
	JS9.error("NAXIS2 missing from PNG-based FITS header");
    }
    if( this.raw.header.BITPIX ){
	this.raw.bitpix = this.raw.header.BITPIX;
    } else {
	JS9.error("BITPIX missing from PNG-based FITS header");
    }
    if( this.raw.endian === "little" ){
	littleEndian = true;
    } else if( this.raw.endian === "big" ){
	littleEndian = false;
    } else {
	JS9.error("js9Endian missing from PNG-based FITS header");
    }
    // object name
    this.object = this.raw.header.OBJECT;
    // no min or max yet
    this.raw.dmin = Number.MAX_VALUE;
    this.raw.dmax = Number.MIN_VALUE;
    // number of data pixels
    dlen = this.raw.width * this.raw.height;
    // mode: process the next imge pixel based on starting index into RGBA pixel
    mode = idx % 4;
    // image pixels are packed into RGBA array, in little-endian format.
    // The A value is supplied by the browser and has to be skipped.
    switch(this.raw.bitpix){
    case 8:
	// 8-bit unsigned char data
	this.raw.data = new Uint8Array(dlen);
	for(i=0; i<dlen; i++){
	    switch(mode){
	    case 0:
		tval = offscreen[idx];
		idx += 1;
		mode = 1;
		break;
	    case 1:
		tval = offscreen[idx];
		idx += 1;
		mode = 2;
		break;
	    case 2:
		tval = offscreen[idx];
		idx += 2;
		mode = 0;
		break;
	    case 3:
		tval = offscreen[idx+1];
		idx += 2;
		mode = 1;
		break;
	    }
	    // save current pixel value
	    this.raw.data[i] = tval;
	    // save min and max data values as we convert
	    if( !isNaN(tval) ){
		this.raw.dmin = Math.min(this.raw.dmin, tval);
		this.raw.dmax = Math.max(this.raw.dmax, tval);
	    }
	}
	break;
    case 16:
    case -16:
	if( this.raw.bitpix === 16 ){
	    this.raw.data = new Int16Array(dlen);
	    getfunc = DataView.prototype.getInt16;
	} else {
	    this.raw.data = new Uint16Array(dlen);
	    getfunc = DataView.prototype.getUint16;
	}
	// 16-bit signed short int data
	for(i=0; i<dlen; i++){
	    switch(mode){
	    case 0:
		u[0] = offscreen[idx];
		u[1] = offscreen[idx+1];
		tval = getfunc.call(dv, 0, littleEndian);
		idx += 2;
		mode = 2;
		break;
	    case 1:
		u[0] = offscreen[idx];
		u[1] = offscreen[idx+1];
		tval = getfunc.call(dv, 0, littleEndian);
		idx += 3;
		mode = 0;
		break;
	    case 2:
		u[0] = offscreen[idx];
		u[1] = offscreen[idx+2];
		tval = getfunc.call(dv, 0, littleEndian);
		idx += 3;
		mode = 1;
		break;
	    case 3:
		u[0] = offscreen[idx+1];
		u[1] = offscreen[idx+2];
		tval = getfunc.call(dv, 0, littleEndian);
		idx += 3;
		mode = 2;
		break;
	    }
	    // save current pixel value
	    this.raw.data[i] = tval;
	    // save min and max data values as we convert
	    if( !isNaN(tval) ){
		this.raw.dmin = Math.min(this.raw.dmin, tval);
		this.raw.dmax = Math.max(this.raw.dmax, tval);
	    }
	}
	break;
    case 32:
    case -32:
	// 32-bit signed int data
	// 32-bit float data
	if( this.raw.bitpix === 32 ){
	    this.raw.data = new Int32Array(dlen);
	    getfunc = DataView.prototype.getInt32;
	} else {
	    this.raw.data = new Float32Array(dlen);
	    getfunc = DataView.prototype.getFloat32;
	}
	for(i=0; i<dlen; i++){
	    switch(mode){
	    case 0:
		u[0] = offscreen[idx];
		u[1] = offscreen[idx+1];
		u[2] = offscreen[idx+2];
		u[3] = offscreen[idx+4];
		tval = getfunc.call(dv, 0, littleEndian);
		idx += 5;
		mode = 1;
		break;
	    case 1:
		u[0] = offscreen[idx];
		u[1] = offscreen[idx+1];
		u[2] = offscreen[idx+3];
		u[3] = offscreen[idx+4];
		tval = getfunc.call(dv, 0, littleEndian);
		idx += 5;
		mode = 2;
		break;
	    case 2:
		u[0] = offscreen[idx];
		u[1] = offscreen[idx+2];
		u[2] = offscreen[idx+3];
		u[3] = offscreen[idx+4];
		tval = getfunc.call(dv, 0, littleEndian);
		idx += 6;
		mode = 0;
		break;
	    case 3:
		u[0] = offscreen[idx+1];
		u[1] = offscreen[idx+2];
		u[2] = offscreen[idx+3];
		u[3] = offscreen[idx+5];
		tval = getfunc.call(dv, 0, littleEndian);
		idx += 6;
		mode = 1;
		break;
	    }
	    // save current pixel value
	    this.raw.data[i] = tval;
	    // save min and max data values as we convert
	    if( !isNaN(tval) ){
		this.raw.dmin = Math.min(this.raw.dmin, tval);
		this.raw.dmax = Math.max(this.raw.dmax, tval);
	    }
	}
	break;
    case -64:
	// 64-bit float data
	this.raw.data = new Float64Array(dlen);
	for(i=0; i<dlen; i++){
	    switch(mode){
	    case 0:
	    case 4:
		u[0] = offscreen[idx];
		u[1] = offscreen[idx+1];
		u[2] = offscreen[idx+2];
		u[3] = offscreen[idx+4];
		u[4] = offscreen[idx+5];
		u[5] = offscreen[idx+6];
		u[6] = offscreen[idx+8];
		u[7] = offscreen[idx+9];
		tval = dv.getFloat64(0, littleEndian);
		idx += 10;
		mode = 2;
		break;
	    case 1:
	    case 5:
		u[0] = offscreen[idx];
		u[1] = offscreen[idx+1];
		u[2] = offscreen[idx+3];
		u[3] = offscreen[idx+4];
		u[4] = offscreen[idx+5];
		u[5] = offscreen[idx+7];
		u[6] = offscreen[idx+8];
		u[7] = offscreen[idx+9];
		tval = dv.getFloat64(0, littleEndian);
		idx += 11;
		mode = 0;
		break;
	    case 2:
	    case 6:
		u[0] = offscreen[idx];
		u[1] = offscreen[idx+2];
		u[2] = offscreen[idx+3];
		u[3] = offscreen[idx+4];
		u[4] = offscreen[idx+6];
		u[5] = offscreen[idx+7];
		u[6] = offscreen[idx+8];
		u[7] = offscreen[idx+10];
		tval = dv.getFloat64(0, littleEndian);
		idx += 11;
		mode = 1;
		break;
	    case 3:
	    case 7:
		u[0] = offscreen[idx+1];
		u[1] = offscreen[idx+2];
		u[2] = offscreen[idx+3];
		u[3] = offscreen[idx+5];
		u[4] = offscreen[idx+6];
		u[5] = offscreen[idx+7];
		u[6] = offscreen[idx+9];
		u[7] = offscreen[idx+10];
		tval = dv.getFloat64(0, littleEndian);
		idx += 11;
		mode = 2;
		break;
	    }
	    // save current pixel value
	    this.raw.data[i] = tval;
	    // save min and max data values as we convert
	    if( !isNaN(tval) ){
		this.raw.dmin = Math.min(this.raw.dmin, tval);
		this.raw.dmax = Math.max(this.raw.dmax, tval);
	    }
	}
	break;
    default:
	JS9.error("unsupported bitpix in PNG file: "+this.raw.bitpix);
    }
    // set initial scaling values if not done already
    if( isNaN(this.params.scalemin) ){
	this.params.scalemin = this.raw.dmin;
    }
    if( isNaN(this.params.scalemax) ){
	this.params.scalemax = this.raw.dmax;
    }
    // having the real image, we can ask to release the offscreen image
    this.offscreen.img = null;    
    // init WCS, if possible
    this.wcs = JS9.initwcs(JS9.raw2FITS(this.raw));
    if( this.wcs > 0 ){
	// set the wcs system
	this.setWCSSys(this.params.wcssys);
	// this is also the default
	this.params.wcssys0 = this.params.wcssys.trim();
    }
    // init the logical coordinate system, if possible
    this.initLCS(this.raw.header);
    // allow chaining
    return this;
};

// read input object and convert to image data
JS9.Image.prototype.mkRawDataFromHDU = function(obj, file){
    var i, s, ui, dlen, clen, hdu, pars, card;
    var owidth, oheight, obitpix;
    if( $.isArray(obj) || JS9.isTypedArray(obj) || obj instanceof ArrayBuffer ){
	// flatten if necessary
	if( $.isArray(obj[0]) ){
	    obj = obj.reduce(function(a, b){return a.concat(b);});
	}
	// javascript array or typed array
	hdu = {image: obj};
    } else if( typeof obj === "object" ){
	// fits object
	hdu = obj;
    } else {
	JS9.error("unknown or missing input for HDU creation");
    }
    // allow image to be passed in data property
    if( hdu.data && !hdu.image ){
	hdu.image = hdu.data;
    }
    // better have the image ...
    if( !hdu.image ){
	JS9.error("data missing from JS9 FITS object" + JSON.stringify(hdu));
    }
    // quick check for 1D images (in case naxis is defined)
    if( hdu.naxis < 2 ){
	JS9.error("can't image a FITS file with less than 2 dimensions");
    }
    // look for a filename
    if( file ){
	this.file = file;
    } else if( hdu.filename ){
	this.file = hdu.filename;
    }
    this.file = this.file || JS9.ANON;
    // look for an id
    if( !this.id ){
	// save id in case we have to change it for uniqueness
	this.oid = this.file.split("/").reverse()[0];
	// get a unique id for this image
	this.id = JS9.getImageID(this.oid, this.display.id);
    }
    // save old essential values, if possible (for use as defaults)
    if( this.raw ){
	owidth = this.raw.width;
	oheight = this.raw.height;
	obitpix = this.raw.bitpix;
    }
    // fill in raw data info directly from the fits object
    this.raw = {};
    this.raw.hdu = hdu;
    if( hdu.axis ){
	this.raw.width  = hdu.axis[1];
	this.raw.height = hdu.axis[2];
    } else if( hdu.naxis1 && hdu.naxis2 ){
	this.raw.width  = hdu.naxis1;
	this.raw.height = hdu.naxis2;
    } else if( owidth && oheight ){
	this.raw.width  = owidth;
	this.raw.height = oheight;
    }
    if( hdu.bitpix ){
	this.raw.bitpix = hdu.bitpix;
    } else if( obitpix ){
	this.raw.bitpix = obitpix;
    }
    // if the data is base64-encoded, decode it now
    if( hdu.encoding === "base64" ){
	s = window.atob(hdu.image);
	// make an arraybuffer to hold the bytes from the decoded string
	hdu.image = new ArrayBuffer(s.length);
	ui = new Uint8Array(hdu.image);
	// to be turned into the right datatyped typed array, below
	for(i=0; i<s.length; i++){
	   ui[i] = s.charCodeAt(i);
	}
    }
    // make sure we have a typed array
    // flatten if necessary
    if( $.isArray(hdu.image[0]) ){
	hdu.image = hdu.image.reduce(function(a, b){return a.concat(b);});
    }
    switch(this.raw.bitpix){
    case 8:
	this.raw.data = new Uint8Array(hdu.image);
	break;
    case 16:
	this.raw.data = new Int16Array(hdu.image);
	break;
    case -16:
	this.raw.data = new Uint16Array(hdu.image);
	break;
    case 32:
	this.raw.data = new Int32Array(hdu.image);
	break;
    case -32:
	this.raw.data = new Float32Array(hdu.image);
	break;
    case -64:
	this.raw.data = new Float64Array(hdu.image);
	break;
    }
    // array of cards
    this.raw.card = hdu.card;
    // cfitsio returns these:
    this.raw.cardstr = hdu.cardstr;
    this.raw.ncard = hdu.ncard;
    // look for header
    if( hdu.head ){
	this.raw.header = hdu.head;
    } else if( this.raw.card ){
	this.raw.header = {};
	// make up header from array of raw cards
	clen = this.raw.card.length;
	for(i=0; i<clen; i++){
	    pars = JS9.cardpars(this.raw.card[i]);
	    if ( pars !== undefined ) {
		this.raw.header[pars[0]] = pars[1];
	    }
	}
    } else if( this.raw.cardstr ){
	this.raw.header = {};
	// make up header from string containing 80-char raw cards
	clen = this.raw.ncard;
	for(i=0; i<clen; i++){
	    card = this.raw.cardstr.slice(i*80, (i+1)*80);
	    pars = JS9.cardpars(card);
	    if ( pars !== undefined ) {
		this.raw.header[pars[0]] = pars[1];
	    }
	}
    } else {
	// simplest FITS header imaginable
	this.raw.header = {};
	this.raw.header.SIMPLE = true;
	this.raw.header.NAXIS = 2;
	this.raw.header.NAXIS1 = this.raw.width;
	this.raw.header.NAXIS2 = this.raw.height;
	this.raw.header.BITPIX = this.raw.bitpix;
    }
    // min and max data values
    if( hdu.dmin && hdu.dmax ){
	this.raw.dmin = hdu.dmin;
	this.raw.dmax = hdu.dmax;
    } else {
	// find data min and max
	this.raw.dmin = Number.MAX_VALUE;
	this.raw.dmax = Number.MIN_VALUE;
	dlen = this.raw.width * this.raw.height;
	for(i=0; i<dlen; i++) {
	    if( !isNaN(this.raw.data[i]) ){
		this.raw.dmin = Math.min(this.raw.dmin, this.raw.data[i]);
		this.raw.dmax = Math.max(this.raw.dmax, this.raw.data[i]);
	    }
	}
    }
    // image or table
    if( hdu.imtab ){
	this.imtab = hdu.imtab;
    } else {
	this.imtab = hdu.table ? "table" : "image";
    }
    // object name
    this.object = this.raw.header.OBJECT;
    // set or reset binning properties
    if( (this.imtab === "table") && hdu.table ){
	this.binning.bin = Number(hdu.table.bin) || 1;
    } else {
	this.binning.bin = 1;
    }
    // init WCS, if possible
    this.wcs = JS9.initwcs(JS9.raw2FITS(this.raw));
    if( this.wcs > 0 ){
	// set the wcs system
	this.setWCSSys(this.params.wcssys);
	// this is also the default
	this.params.wcssys0 = this.params.wcssys.trim();
	// set the wcs units
	this.setWCSUnits(this.params.wcsunits);
    } 
    // init the logical coordinate system, if possible
    this.initLCS(this.raw.header);
    // set initial scaling values if not done already
    if( isNaN(this.params.scalemin) || 
	(this.params.scaleclipping === "dataminmax") ){
	this.params.scalemin = this.raw.dmin;
    }
    if( isNaN(this.params.scalemax) || 
	(this.params.scaleclipping === "dataminmax") ){
	this.params.scalemax = this.raw.dmax;
    }
    // allow chaining 
    return this;
};

// store section information
JS9.Image.prototype.mkSection = function(xcen, ycen, zoom){
    var sect = this.primary.sect;
    // process arguments
    switch(arguments.length){
    case 0:
	// no args: init to display central part of image
	sect.xcen   = Math.floor(this.raw.width/2);
	sect.ycen   = Math.floor(this.raw.height/2);
	sect.width  = Math.min(this.raw.width, this.display.canvas.width);
	sect.height = Math.min(this.raw.height,this.display.canvas.height);
	break;
    case 1:
	// one arg: zoom
	sect.ozoom = sect.zoom;
	sect.zoom = xcen;
	sect.width  = Math.min(this.raw.width*sect.zoom,
			       this.display.canvas.width);
	sect.height = Math.min(this.raw.height*sect.zoom,
			       this.display.canvas.height);
	break;
    case 2:
	// two args: x, y
	sect.xcen   = parseInt(xcen, 10);
	sect.ycen   = parseInt(ycen, 10);
	break;
    case 3:
	// three args: x, y, zoom
	sect.ozoom = sect.zoom;
	sect.xcen   = parseInt(xcen, 10);
	sect.ycen   = parseInt(ycen, 10);
	sect.zoom = zoom;
	sect.width  = Math.min(this.raw.width*sect.zoom,
			       this.display.canvas.width);
	sect.height = Math.min(this.raw.height*sect.zoom,
			       this.display.canvas.height);
	break;
    default:
	break;
    }
    // need integer dimensions
    sect.width  = Math.floor(sect.width);
    sect.height  = Math.floor(sect.height);
    sect.x0 = Math.floor(sect.xcen - ((sect.width+1)/(2*sect.zoom)) + 1);
    sect.y0 = Math.floor(sect.ycen - ((sect.height+1)/(2*sect.zoom)) + 1);
    // from funtools/funutil.c:
    // this method maintains the center and changes the dimensions
    // Frank, Eric, and John all prefer this method, so that the user
    // gets the center he asked for, even if the image is reduced
    sect.x1 = Math.floor(sect.xcen + (sect.width/(2*sect.zoom)));
    sect.y1 = Math.floor(sect.ycen + (sect.height/(2*sect.zoom)));
    // final check: make sure we're within bounds
    if( sect.x0 < 0 ){
	sect.x1 -= sect.x0;
	sect.x0 = 0;
    }
    if( sect.y0 < 0 ){
	sect.y1 -= sect.y0;
	sect.y0 = 0;
    }
    if( sect.x1 > this.raw.width ){
	sect.x0 -= (sect.x1 - this.raw.width);
	sect.x1 = this.raw.width;
    }
    if( sect.y1 > this.raw.height ){
	sect.y0 -= (sect.y1 - this.raw.height);
	sect.y1 = this.raw.height;
    }
    // last desperate attempt!
    sect.x0 = Math.max(0, sect.x0);
    sect.y0 = Math.max(0, sect.y0);
};

// create colormap index array from data values and specified data min/max
// from: saotk/frame/frametruecolor.C
JS9.Image.prototype.mkColorData = function(){
    var i, dd;
    var ss = JS9.SCALESIZE;
    var length = ss - 1;
    var dmin = this.params.scalemin;
    var dmax = this.params.scalemax;
    var dlen = this.raw.width * this.raw.height;
    var diff = dmax - dmin;
    var dval = length / diff;
    // allocate array
    if( !this.colorData ){
	this.colorData = [];
    }
    // for each raw value, calculate lookup offset into scaled array
    for(i=0; i<dlen; i++){
	dd = this.raw.data[i];
	if( dd <= dmin ){
	    this.colorData[i] = 0;
	} else if( dd >= dmax ){
	    this.colorData[i] = ss - 1;
	} else {
//	    this.colorData[i] = Math.floor(((dd - dmin) / diff * length) + 0.5);
	    this.colorData[i] = Math.floor(((dd - dmin) * dval) + 0.5);
	}
    }
    // allow chaining
    return this;
};

// generate colorcells array from current colormap
// from: saotk/colorbar/colorbar.C
JS9.Image.prototype.calcContrastBias = function(i){
    var r, result;
    var cs = JS9.COLORSIZE;
    var bias = this.params.bias;
    var contrast = this.params.contrast;
    // check for (close to) default
    if( ((bias - 0.5) < 0.0001) && ((contrast - 1.0) < 0.0001) ){
	return i;
    }
    // map i to range of 0 to 1.0
    // shift by bias (if invert, bias = 1 - bias)
    // multiply by contrast
    // shift to center of region
    // expand back to number of dynamic colors
    if( this.params.invert ){
	bias = 1 - bias;
    }
    r = Math.floor((((i / cs) - bias) * contrast + 0.5) * cs);
    if( r < 0 ){
	result = 0;
    } else if( r >= cs ){
	result = cs - 1;
    } else {
	result = r;
    }
    return result;
};

// generate colorcells array from current colormap
// from: saotk/colorbar/colorbartruecolor.C
JS9.Image.prototype.mkColorCells = function(){
    var i, j, idx;
    var cs = JS9.COLORSIZE;
    // allocate array for color cells
    if( !this.colorCells ){
	this.colorCells = [];
    }
    // fill in colorcells
    for(i=0; i<cs; i++){
	j = this.params.invert ? cs - i - 1 : i;
	idx = this.calcContrastBias(j);
	this.colorCells[i] = this.cmapObj.mkColorCell(idx);
    }
    // allow chaining
    return this;
};

// create scaled colorCells from colorCells by applying scale algorithm
// from: saotk/frame/colorscale.C
JS9.Image.prototype.mkScaledCells = function(){
    var aa, bb, ii, ll, exp;
    var cs = JS9.COLORSIZE;
    var ss = JS9.SCALESIZE;
    var hex2num = function(hex){
	var i, k, int1, int2;
	var hex_alphabets = "0123456789ABCDEF";
	var value = [];
	//Remove the '#' char - if there is one.
	if(hex.charAt(0) === "#"){
	    hex = hex.slice(1); 
	}
	hex = hex.toUpperCase();
	for(i=0, k=0; i<6; i+=2, k++) {
	    int1 = hex_alphabets.indexOf(hex.charAt(i));
	    int2 = hex_alphabets.indexOf(hex.charAt(i+1)); 
	    value[k] = (int1 * 16) + int2;
	}
	return value;
    };

    // sanity check
    if( !this.colorCells ){
	return this;
    }
    // allocate array for scaled cells
    if( !this.psColors ){
	this.psColors = [];
	// value for NaN
	this.psColors[NaN] = hex2num(this.params.nancolor);
    }
    // apply the appropriate scale algorithm
    switch(this.params.scale){
    case "linear":
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(aa * cs);
	    this.psColors[ii] = this.colorCells[ll];
	}
	break;
    case "log":
	exp = this.params.exp;
	for(ii=0; ii<ss; ii++){
	    aa = Math.log(((exp*ii)/ss)+1) / Math.log(exp);
	    ll = Math.floor(aa * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	break;
    case "pow":
	exp = this.params.exp;
	for(ii=0; ii<ss; ii++){
	    aa = (Math.pow(exp, ii/ss)-1) / exp;
	    ll = Math.floor(aa * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	break;
    case "sqrt":
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(Math.sqrt(aa * cs));
	    this.psColors[ii] = this.colorCells[ll];
	}
	break;
    case "squared":
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(aa * aa * cs);
	    this.psColors[ii] = this.colorCells[ll];
	}
	break;
    case "asinh":
	// http://phpjs.org/functions/asinh:353:
	// Math.log(arg + Math.sqrt(arg * arg + 1))
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    bb = 10.0 * aa;
	    ll = Math.floor((Math.log(bb+Math.sqrt(bb*bb+1))) / 3.0 * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	break;
    case "sinh":
	// http://phpjs.org/functions/sinh:516:
	// (Math.exp(arg) - Math.exp(-arg)) / 2
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    bb = 3.0 * aa;
	    ll = Math.floor(((Math.exp(bb)-Math.exp(-bb))/2.0) / 10.0 * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	break;
    default:
	JS9.log("unknown scale '" + this.params.scale + "'");
    }
    // allow chaining
    return this;
};

// create primary (RGB) image from scaled colorCells
// sort of from: saotk/frame/truecolor.c, but not really
JS9.Image.prototype.mkPrimaryImage = function(){
    var primary, sect, img;
    var xIn, yIn, xOut, yOut, xOutIdx, yOutIdx;
    var yZoom, xZoom, idx, odx, yLen, zx, zy, zyLen;
    var alpha, alpha1, alpha2;
    var ridx, gidx, bidx;
    var rthis=this, gthis=this, bthis=this;
    var dorgb = false;
    // sanity check
    if( !this.primary || !this.psColors ){
	return this;
    }
    if( JS9.globalOpts.rgb.mode ){
	if( (this === JS9.globalOpts.rgb.rim) ||
	    (this === JS9.globalOpts.rgb.gim) ||
	    (this === JS9.globalOpts.rgb.bim) ){
	    dorgb = true;
	}
    }
    if( dorgb ){
	rthis = JS9.globalOpts.rgb.rim;
	gthis = JS9.globalOpts.rgb.gim;
	bthis = JS9.globalOpts.rgb.bim;
    }
    primary = this.primary;
    sect = primary.sect;
    // create an rgb image if necessary
    if( !primary.img ||
	(primary.img.width  !== sect.width) ||
	(primary.img.height !== sect.height) ){
	// primary.img = this.offscreen.context.createImageData(sect.width, 
	// sect.height);
	primary.img = this.display.context.createImageData(sect.width,
							   sect.height);
    }
    img = primary.img;
    // primary alpha for this image
    // alpha = this.params.alpha || 255;
    alpha = this.params.alpha;
    // reverse maskData alphas, if necessary 
    if( this.maskData ){
	if( this.params.maskInvert ){
	    alpha1 = this.params.alpha2;
	    alpha2 = this.params.alpha1;
	} else {
	    alpha1 = this.params.alpha1;
	    alpha2 = this.params.alpha2;
	}
    }
    // index into scaled data using previously calc'ed data value to get rgb
    // reverse y lines
    odx = 0;
    for(yIn=sect.y1-1, yOut=0; yIn>=sect.y0; yIn--, yOut++){
	yLen = yIn * this.raw.width;
	yOutIdx = yOut * sect.zoom;
	for(xIn=sect.x0, xOut=0; xIn<sect.x1; xIn++, xOut++){
	    if( dorgb ){
		if( rthis ){
		    ridx = rthis.colorData[yLen + xIn];
		}
		if( gthis ){
		    gidx = gthis.colorData[yLen + xIn];
		}
		if( bthis ){
		    bidx = bthis.colorData[yLen + xIn];
		}
	    } else {
		idx = this.colorData[yLen + xIn];
	    }
	    if( this.maskData ){
		alpha = this.maskData[yLen +xIn] > 0 ? alpha1 : alpha2;
	    }
	    xOutIdx = xOut * sect.zoom;
	    for(yZoom=0; yZoom<sect.zoom; yZoom++) {
		zy = Math.floor(yOutIdx + yZoom);
		zyLen = zy * sect.width;
		for(xZoom=0; xZoom<sect.zoom; xZoom++) {
		    zx = Math.floor(xOutIdx + xZoom);
		    odx = (zyLen + zx) * 4;
		    if( dorgb ){
			if( rthis ){
			    img.data[odx]   = rthis.psColors[ridx][0];
			} else {
			    img.data[odx] = 0;
			}
			if( gthis ){
			    img.data[odx+1] = gthis.psColors[gidx][1];
			} else {
			    img.data[odx+1] = 0;
			}
			if( bthis ){
			    img.data[odx+2] = bthis.psColors[bidx][2];
			} else {
			    img.data[odx+2] = 0;
			}
		    } else {
			img.data[odx]   = this.psColors[idx][0];
			img.data[odx+1] = this.psColors[idx][1];
			img.data[odx+2] = this.psColors[idx][2];
		    }
		    img.data[odx+3] = alpha;
		}
	    }
	}
    }
    // allow chaining
    return this;
};

// display image, with pre and post processing based on comma-separated string
// of options:
// colors: generate colorData
// scaled: generate colorCells and scaledCells
// primary: generate primary image (happens automatically for any of the above)
// display: displlay image (always done)
// plugins: execute plugin callbacks
// all: colors,scaled,primary,display,plugins
JS9.Image.prototype.displayImage = function(imode){
    var pname, pinst, popts;
    var primary = this.primary;
    var display = this.display;
    var mode = {};
    var modeFunc = function(element, index, array){
	var el = element.trim();
	mode[el] = true;
	// each step implies the next ones
	switch(el){
	case "colors":
	    mode.scaled = true;
	    mode.primary = true;
	    break;
	case "scaled":
	    mode.primary = true;
	    break;
	}
    };
    // special checks for displayMode setting
    if( imode === false ){
	this.displayMode = false;
	return;
    }
    if( imode === true ){
	this.displayMode = true;
	imode = "all";
    }
    // if displayMode is false, just return
    if( !this.displayMode ){
	return;
    }
    if( !imode ){
	imode = "primary";
    } else if( imode === "all" ){
	imode = "colors,scaled,primary,display,plugins";
	mode.notify = true;
    } else if( imode === "display" ){
	mode.notify = true;
    }
    // get mode as elements in an object
    imode.split(",").forEach(modeFunc);
    // but always display the image again
    mode.display = true;
    // and call the plugins
    mode.plugins = true;
    // generate colordata
    if( mode.colors ){
	// populate the colorData array (offsets into scaled colorcell data)
	this.mkColorData();
    }
    // generated scaled cells
    if( mode.scaled ){
	// generate color cells from colormap
	this.mkColorCells();
	// generated scaled cells from color cells
	this.mkScaledCells();
    }
    // generate primary (RGB) image from scaled cells
    if( mode.primary ){
	this.mkPrimaryImage();
    }
    // display image on screen
    if( mode.display ){
	// offsets into display
	this.ix = Math.floor((display.canvas.width - primary.img.width)/2);
	this.iy = Math.floor((display.canvas.height - primary.img.height)/2);
	// clear first
	display.context.clear();
	// draw the image into the context
	display.context.putImageData(primary.img, this.ix, this.iy);
	// display layers for this image
	this.displayShapeLayers();
	// notify the helper
	if( mode.notify ){
	    this.notifyHelper();
	}
	// mark this image as being in this display
	display.image = this;
    }
    // post-processing 
    if( mode.plugins ){
	// plugin callbacks
	for( pname in this.display.pluginInstances ){
	    if( this.display.pluginInstances.hasOwnProperty(pname) ){
		pinst = this.display.pluginInstances[pname];
		popts = pinst.plugin.opts;
		if( pinst.isActive("onimagedisplay") ){
		    try{ popts.onimagedisplay.call(pinst, this); }
		    catch(e){ pinst.errLog("onimagedisplay", e); }
		}
	    }
	}
    }
    // allow chaining
    return this;
};

// refresh data for an existing image
// input obj is a fits object, array, typed array, etc.
JS9.Image.prototype.refreshImage = function(obj, func){
    var key, oxcen, oycen, owidth, oheight, ozoom, doreg;
    var pname, pinst, popts;
    // check for refresh function
    if( !func && JS9.imageOpts.onrefresh ){
	func = JS9.imageOpts.onrefresh;
    }
    // save section in case it gets reset
    oxcen = this.primary.sect.xcen;
    oycen = this.primary.sect.ycen;
    ozoom = this.primary.sect.zoom;
    owidth = this.raw.width;
    oheight = this.raw.height;
    // save old binning
    this.binning.obin = this.binning.bin;
    // generate new data
    this.mkRawDataFromHDU(obj);
    // doreg = (this.binning.obin !== this.binning.bin);
    doreg = true;
    // restore section unless dimensions changed
    if( (this.raw.width === owidth) && (this.raw.height === oheight) ){
	this.mkSection(oxcen, oycen, ozoom);
    } else {
	this.mkSection();
	this.mkSection(ozoom);
    }
    // display new image data with old section
    this.displayImage("colors");
    // update shape layers if necessary
    if( doreg ){
	for( key in this.layers ){
	    if( this.layers.hasOwnProperty(key) ){
		if( this.layers[key].show ){
		    this.refreshShapes(key);
		}
	    }
	}
	// also update region values
	this.updateShapes("regions", "all", "binning");
    }
    // call function, if necessary
    if( func ){
	try{ JS9.xeqByName(func, window, this); }
	catch(e){ JS9.error("in image refresh callback", e); }
    }
    // plugin callbacks
    for( pname in this.display.pluginInstances ){
	if( this.display.pluginInstances.hasOwnProperty(pname) ){
	    pinst = this.display.pluginInstances[pname];
	    popts = pinst.plugin.opts;
	    if( pinst.isActive("onimagerefresh") ){
		try{ popts.onimagerefresh.call(pinst, this); }
		catch(e){ pinst.errLog("onimagerefresh", e); }
	    }
	}
    }
};
    
// get pan location 
JS9.Image.prototype.getPan = function(panx, pany){
    return {x: (this.primary.sect.x0 + this.primary.sect.x1)/2+1,
	    y: (this.primary.sect.y0 + this.primary.sect.y1)/2+1};
};

// set pan location of primary image (using image coordinates)
JS9.Image.prototype.setPan = function(panx, pany){
    var key;
    if( arguments.length === 0 ){
	panx = this.raw.width / 2;
	pany = this.raw.height / 2;
    }
    this.mkSection(panx, pany);
    this.displayImage("primary");
    // pan/zoom the shape layers
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    if( this.layers[key].show &&
		this.layers[key].opts.panzoom ){
		this.refreshShapes(key);
	    }
	}
    }
    // allow chaining
    return this;
};

// return current zoom
JS9.Image.prototype.getZoom = function(){
    return this.primary.sect.zoom;
};

// return zoom from zoom string
JS9.Image.prototype.parseZoom = function(zval){
    var ozoom, nzoom;
    // get old zoom
    ozoom = this.primary.sect.zoom;
    // determine new zoom
    switch(typeof zval){
    case "string":
	switch(zval.charAt(0)){
	case "*":
	case "x":
	case "X":
	    nzoom = ozoom * parseFloat(zval.slice(1));
	    break;
	case "/":
	    nzoom = ozoom / parseFloat(zval.slice(1));
	    break;
	case "I":
	case "i":
	    nzoom = ozoom * 2;
	    break;
	case "O":
	case "o":
	    nzoom = ozoom / 2;
	    break;
	case "T":
	case "t":
	    nzoom = Math.min(this.display.width, this.display.height) / Math.max(this.raw.width, this.raw.height);
	    break;
	default:
	    nzoom = parseFloat(zval);
	    break;
	}
	break;
    case "number":
	nzoom = zval;
	break;
    default:
	return;
    } 
    return nzoom;
};

// set zoom of primary image
JS9.Image.prototype.setZoom = function(zval){
    var nzoom, key;
    nzoom = this.parseZoom(zval);
    if( !nzoom ){
	return;
    }
    // remake section
    this.mkSection(nzoom);
    // redisplay the image
    this.displayImage("primary");
    // pan/zoom the shape layers
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    if( this.layers[key].show &&
		this.layers[key].opts.panzoom ){
		this.refreshShapes(key);
	    }
	}
    }
    // allow chaining
    return this;
};

// return current file-related position for specified image position
JS9.Image.prototype.imageToLogicalPos = function(ipos, lcs){
    var arr;
    var opos = {x: ipos.x, y: ipos.y};
    var osys = "image";
    lcs = lcs || this.params.lcs || "image";
    switch(lcs){
    case "image":
	break;
    case "physical":
	if( this.lcs.physical ){
	    osys = lcs;
	    arr = this.lcs.physical.reverse;
	}
	break;
    case "detector":
	if( this.lcs.detector ){
	    osys = lcs;
	    arr = this.lcs.detector.reverse;
	}
	break;
    case "amplifier":
	if( this.lcs.amplifier ){
	    osys = lcs;
	    arr = this.lcs.amplifier.reverse;
	}
	break;
    }
    if( arr ){
	opos.x = ipos.x * arr[0][0] + ipos.y * arr[1][0] + arr[2][0];
	opos.y = ipos.x * arr[0][1] + ipos.y * arr[1][1] + arr[2][1];
    }
    return {x: opos.x, y: opos.y, sys: osys};
};

// return current image position from file-related position
JS9.Image.prototype.logicalToImagePos = function(lpos, lcs){
    var arr;
    var opos = {x: lpos.x, y: lpos.y};
    lcs = lcs || this.params.lcs || "image";
    switch(lcs){
    case "image":
	break;
    case "physical":
	if( this.lcs.physical ){
	    arr = this.lcs.physical.forward;
	}
	break;
    case "detector":
	if( this.lcs.detector ){
	    arr = this.lcs.detector.forward;
	}
	break;
    case "amplifier":
	if( this.lcs.amplifier ){
	    arr = this.lcs.amplifier.forward;
	}
	break;
    }
    if( arr ){
	opos.x = lpos.x * arr[0][0] + lpos.y * arr[1][0] + arr[2][0];
	opos.y = lpos.x * arr[0][1] + lpos.y * arr[1][1] + arr[2][1];
    }
    return opos;
};

// return 1-indexed image coords for specified 0-indexed display position
JS9.Image.prototype.displayToImagePos = function(dpos){
    var primary = this.primary;
    var sect = this.primary.sect;
    var ipos = {};
    // for zoomed images, the image coordinate is at the center
    if( sect.zoom <= 1 ){
	ipos.x = (dpos.x - this.ix) / sect.zoom + sect.x0 + 1;
	ipos.y = ((primary.img.height - 1) - (dpos.y - this.iy)) / sect.zoom + sect.y0 + 1;
    } else {
	ipos.x = (dpos.x - this.ix) / sect.zoom + sect.x0 + 1 - 0.5;
	ipos.y = ((primary.img.height - 1) - (dpos.y - this.iy)) / sect.zoom + sect.y0 + 1 - 0.5;
    }
    return ipos;
};

// return 0-indexed display coords for specified 1-indexed image position
JS9.Image.prototype.imageToDisplayPos = function(ipos){
    var primary = this.primary;
    var sect = this.primary.sect;
    var dpos = {};
    // for zoomed images, the image coordinate is at the center
    if( sect.zoom <= 1 ){
	dpos.x = (((ipos.x - 1) - sect.x0) * sect.zoom) + this.ix;
	dpos.y = (sect.y0 - (ipos.y - 1)) * sect.zoom + (primary.img.height - 1) + this.iy;
    } else {
	dpos.x = (((ipos.x - 1 + 0.5) - sect.x0) * sect.zoom) + this.ix;
	dpos.y = (sect.y0 - (ipos.y - 1 + 0.5)) * sect.zoom + (primary.img.height - 1) + this.iy;
    }
    return dpos;
};

// return 0-indexed display pos from 1-indexed logical pos
JS9.Image.prototype.logicalToDisplayPos = function(lpos){
    return this.imageToDisplayPos(this.logicalToImagePos(lpos));
};

// return 1-indexed logical pos from 0-indexed display pos
JS9.Image.prototype.displayToLogicalPos = function(dpos){
    return this.imageToLogicalPos(this.displayToImagePos(dpos));
};

JS9.Image.prototype.getWCSSys = function(){
    if( this.params.wcssys ){
	return this.params.wcssys;
    }
};

// set the WCS sys for this image
JS9.Image.prototype.setWCSSys = function(wcssys){
    var s, wu;
    if( wcssys === "image" ){
	this.params.wcssys = "image";
	this.params.wcsunits = "pixels";
	return;
    }
    if( wcssys === "physical" ){
	this.params.wcssys = "physical";
	this.params.wcsunits = "pixels";
	return;
    }
    if( this.wcs && (this.wcs > 0) ){
	if( wcssys === "native" ){
	    wcssys = this.params.wcssys0;
	}
	s = JS9.wcssys(this.wcs, wcssys);
	if( s ){
	    this.params.wcssys = s.trim();
	    if( this.params.wcsunits === "pixels" ){
		wu = JS9.imageOpts.wcsunits;
	    } else {
		wu = this.params.wcsunits;
	    }
	    this.setWCSUnits(wu);
	    this.updateShapes("regions", "all", "update");
	}
	return this;
    }
};

// get the WCS units for this image
JS9.Image.prototype.getWCSUnits = function(){
    if( this.params.wcsunits ){
	return this.params.wcsunits;
    }
    return "pixels";
};

// set the WCS units for this image
JS9.Image.prototype.setWCSUnits = function(wcsunits){
    var s, ws;
    if( wcsunits === "pixels" ){
	this.params.wcssys = "physical";
	this.params.wcsunits = "pixels";
	return;
    }
    if( this.wcs && (this.wcs > 0) ){
	if( (this.params.wcssys === "image") || 
	    (this.params.wcssys === "physical") ){
	    ws = JS9.imageOpts.wcssys;
	    this.setWCSSys(this.wcs, ws);
	}
	s = JS9.wcsunits(this.wcs, wcsunits);
	if( s ){
	    this.params.wcsunits = s.trim();
	    this.updateShapes("regions", "all", "update");
	}
	return this;
    }
    // allow chaining
    return this;
};

// notify the helper that a new image was displayed
JS9.Image.prototype.notifyHelper = function(){
    var basedir;
    var that = this;
    // notify the helper
    if( JS9.helper.connected && (this.file !== JS9.ANON) ){
	JS9.helper.send("image", {"image": this.file},
        function(res){
	    var rstr, r, s, t, cc, im;
	    if( typeof res === "object" ){
		// from node.js, we get an object with stdout and stderr
		rstr = res.stdout;
		// log stderr but keep going
		if( res.stderr && JS9.DEBUG > 1 ){
		    JS9.log(res.stderr);
		}
	    } else {
		// with cgi, we just get stdout
		rstr = res;
	    }
	    // uness we have no stdout
	    if( !rstr ){
		return;
	    }
	    // returns: [png, fits, wcs]
	    r = rstr.trim().split(/ +/);
	    im = JS9.lookupImage(r[0], that.display.id||JS9.DEFID );
	    if( im && !im.fitsFile ){
		s = r[1];
		if( s !== "?" ){
		    if( !JS9.analOpts.dataDir ){
			im.fitsFile = s;
			// prepend base of png path if fits file has no path
			// is this a bad "feature" in tpos??
			if( im.fitsFile.indexOf("/") < 0 ){
			    basedir = im.file.match( /.*\// );
			    if( basedir ){
				im.fitsFile =  basedir + im.fitsFile;
			    }
			}
			// prepend JS9 macro for dir if fits is not absolute
			if( JS9.analOpts.prependJS9Dir &&
			    im.fitsFile.charAt(0) !== "/" ){
			    im.fitsFile = "$JS9_DIR/" + im.fitsFile;
			}
		    } else {
			cc = s.lastIndexOf("/") + 1;
			im.fitsFile = JS9.analOpts.dataDir + "/" + s.slice(cc);
		    }
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 fitsFile: %s %s", im.file, im.fitsFile);
		    }
		}
		t = r[2];
		if( t !== "?" ){
		    im.fitsExt = t.match(/\[.*\]/);
		}
	    }
	    // first time through, query the helper for info
	    if( !that.queried ){
		that.queryHelper("all");
		that.queried = true;
	    }
	});
    }
    // allow chaining
    return this;
};

// ask helper for various types of information
JS9.Image.prototype.queryHelper = function(which){
    var that = this;
    var what = which || "all";
    // query the helper
    if( JS9.helper.connected ){
	if( (what === "all") || (what === "getAnalysis") ){
	    // only retrieve analysis tasks once per image
	    if( !this.analysisPackages ){
		JS9.helper.send("getAnalysis", {"fits": this.fitsFile},
	        function(s){
		    if( s ){
			try{
			    that.analysisPackages = JSON.parse(s);
			} 
			catch(e){ 
	                    JS9.log("can't get analysis", e);
			}
		    }
		});
	    }
	}
    }
    // allow chaining
    return this;
};

// expand macros for this image
JS9.Image.prototype.expandMacro = function(s, opts){
    var cmd, olen;
    var that = this;
    // sanity check
    if( !s ){
	return;
    }
    // process each $ token
    cmd = s.replace(/\$(\w+)/g, function(m, t, o){
	var i, r;
	switch(t){
	case "id":
	    r = that.display.divjq.attr("id");
	    break;
	case "png":
	    r = that.id;
	    break;
	case "filename":
	    if( !that.fitsFile ){
		JS9.error("no FITS file for " + that.id);
	    }
	    r = that.fitsFile;
	    // for tables, we might need to add the binning filter
	    if( (that.imtab === "table") && (that.raw.hdu.table.filter) ){
		r += '[EVENTS][' + that.raw.hdu.table.filter + ']';
	    }
	    break;
	case "ext":
	    r = that.fitsExt || "[]";
	    break;
	case "sregions":
	    r = that.listRegions("source", 0).replace(/\s+/g,"");
	    break;
	case "bregions":
	    r = that.listRegions("background", 0).replace(/\s+/g,"");
	    break;
	case "regions":
	    r = that.listRegions("all", 0).replace(/\s+/g,"");
	    break;
	default:
	    // look for keyword in the serialized opts array
	    if( opts ){
		olen = opts.length;
		for(i=0; i<olen; i++){
		    if( opts[i].name === t ){
			r = opts[i].value;
			break;
		    }
		}
		// handle checkboxes there were not checked
		if( !r ){
		    r = "false";
		}
	    }
	    // if all else fails, return original macro unexpanded
	    if( !r ){
		r = m;
	    }
	    break;
	}
	return r;
    });
    return cmd;
};

// looku an analysis command by name
JS9.Image.prototype.lookupAnalysis = function(name){
    var i, j, tasks;
    var a = null;
    // look for the named analysis task
    if( this.analysisPackages ){
	// look for xclass:name
	for(j=0; j<this.analysisPackages.length && !a; j++){
	    tasks = this.analysisPackages[j];
	    for(i=0; i<tasks.length; i++){
		// the analysis command we are using
		a = tasks[i];
		if( a.xclass && ((a.xclass + ":" + a.name) === name) ){
		    break;
		}
		a = null;
	    }
	}
	if( a ){
	    return a;
	}
	// look for name
	for(j=0; j<this.analysisPackages.length && !a; j++){
	    tasks = this.analysisPackages[j];
	    for(i=0; i<tasks.length; i++){
		// the analysis command we are using
		a = tasks[i];
		if( a.name === name ){
		    break;
		}
		a = null;
	    }
	}
    }
    return a;
};

// execute analysis task
JS9.Image.prototype.runAnalysis = function(name, opts, func){
    var i, a, m;
    var that = this;
    var obj = {};
    // sanity checks
    if( !JS9.helper.connected ){
	return;
    }
    if( !this.analysisPackages ){
	return;
    }
    // get analysis task
    a = this.lookupAnalysis(name);
    if( !a ){
	JS9.error("could not find analysis task: "+name);
	return;
    }
    // get command line using macro expansion
    if( a.action ){
	obj.cmd = this.expandMacro(a.action, opts);
    }
    // macro expand the strings in the keys array
    if( a.keys ){
	obj.keys = {};
	for(i=0; i<a.keys.length; i++){
	    obj.keys[a.keys[i]] = this.expandMacro("$"+a.keys[i], opts);
	}
    }
    // add some needed parameters
    obj.id = this.expandMacro("$id");
    obj.image = this.file;
    obj.fits = this.fitsFile;
    obj.rtype = a.rtype;
    // For socket.io communication, we have flattened the message space so that
    // each analysis tool utilizes its own message. This allows easier addition
    // of non-exec'ed, in-line analysis. The cgi support utilizes the
    // 'runAnalysis' message to exec a task (there are no in-line additions)
    switch(JS9.helper.type){
    case 'nodejs':
    case 'socket.io':
	m = a.xclass ? (a.xclass + ":" + a.name) : a.name;
	break;
    default:
	m = "runAnalysis";
	break;
    }
    // ask the helper to run the command
    JS9.helper.send(m, obj, function(r){
	var s, robj;
	// return type can be string or object
	if( typeof r === "object" ){
	    // object from node.js
	    robj = r;
	} else {
	    // string from cgi
	    if( r.search(JS9.analOpts.epattern) >=0 ){
		robj = {stderr: r};
	    } else {
		robj = {stdout: r};
	    }
	}
	robj.errcode = robj.errcode || 0;
	// if a processing function was supplied, call it and don't display
	if( func ){
	    func(robj.stdout, robj.stderr, robj.errcode, a);
	} else {
	    // handle errors before we start
	    if( robj.errcode || robj.stderr ){
		if( robj.stderr ){
		    s = robj.stderr;
		} else {
		    s = sprintf("ERROR: while executing %s [%s]",
				a.name, robj.errcode);
		}
		JS9.error(s, JS9.analOpts.epattern);
	    }
	    // display according to type
	    switch(a.rtype){
	    case "text":
	    case undefined:
		that.displayAnalysis("text", robj.stdout);
		break;
	    case "plot":
		that.displayAnalysis("plot", robj.stdout);
		break;
	    case "alert":
		if( robj.stdout ){
		    alert(robj.stdout);
		}
		break;
	    case "fits":
	        JS9.Load(robj.stdout, {display: that.display});
		break;
	    case "png":
	        JS9.Load(robj.stdout, {display: that.display});
		break;
	    case "none":
		break;
	    default:
		JS9.error("unknown analysis result type: " + a.rtype);
	    break;
	    }
	}
    });
};

// display analysis results (text or plot)
JS9.Image.prototype.displayAnalysis = function(type, s, title){
    var id, did, hstr, pobj, divjq;
    var a = JS9.lightOpts[JS9.LIGHTWIN];
    // make up title, if necessary
    title = title || "AnalysisResults: " + (this.fitsFile || this.id);
    // unique id for light window
    id = "Analysis_" + JS9.uniqueID();
    // process the type of analysis results
    switch(type){
    case "text":
	hstr = "<div class='JS9Analysis'></div>";
	if( s ){
	    hstr += "<pre class='JS9AnalysisText'>"+s+"</pre>";
	}
	hstr += "</div>";
	did = JS9.lightWin(id, "inline", hstr, title, a.textWin);
	break;
    case "plot":
	// convert results to js object
	try{ pobj = JSON.parse(s); }
	catch(e){
	    JS9.error("can't plot return data: " + s, e);
	}
	// sanity check
	if( !pobj ){
	    return;
	}
	// create an outer div and an inner plot for the light window open call
	hstr = sprintf("<div id='%s' class='JS9Analysis'><div id='%sPlot' class='JS9Plot' ></div></div>", id, id);
	// create the light window to hold the plot
	did = JS9.lightWin(id, "inline", hstr, title, a.plotWin);
	// find the inner plot div that now is inside the light window
	divjq = $("#" + id + " #" + id + "Plot");
	// flot data
	if( pobj.data ){
	    // set up linear/log transforms and plot the graph
	    try{ $.plot(divjq, [pobj], this.params.plotOpts); }
	    catch(e){ JS9.error("can't plot data", e); }
	}
	break;
    case "params":
	did = JS9.lightWin(id, "ajax", s, title, a.paramWin);
	break;
    case "dpath":
	did = JS9.lightWin(id, "ajax", s, title, a.dpathWin);
	break;
    default:
	break;
    }
    return did;
};

// load an auxiliary file of the specified type
JS9.Image.prototype.loadAuxFile = function(type, func){
    var that = this;
    var i, aux, tokens, aim, url;
    var alen = JS9.auxFiles.length;
    var auxarr = [];
    // sigh ... define load function outside the loop to make JSLint happy
    var loadMaskFunc = function(data, textStatus, jqXHR){
	// got the aux file -- backlink the aux object in image's aux array 
	that.aux[aux.name] = aux;
	// populate the image data array from RGB values
	JS9.Image.prototype.mkOffScreenCanvas.call(aim);
	// populate the raw image data array from RGB values
	JS9.Image.prototype.mkRawDataFromPNG.call(aim);
	// call function, if necessary (im is required)
	if( func ){
	    try{ JS9.xeqByName(func, window, that, aux); }
	    catch(e){ JS9.error("in aux mask onload callback", e); }
	}
	// debugging
	if( JS9.DEBUG ){
	    JS9.log("JS9 %s: %s dims(%d,%d) min/max(%d,%d)",
		    aim.type, aim.file, aim.raw.width, aim.raw.height,
		    aim.raw.dmin, aim.raw.dmax);
	}
    };
    // sigh ... define load function outside the loop to make JSLint happy
    var loadRegionFunc = function(data, textStatus, jqXHR){
	// got the aux file -- backlink the aux object in image's aux array 
	that.aux[aux.name] = aux;
	aux.regions = data;
	if( func ){
	    try{ JS9.xeqByName(func, window, that, aux); }
	    catch(e){ JS9.error("in aux region onload callback", e); }
	}
    };
    // sigh ... define load function outside the loop to make JSLint happy
    var loadTextFunc = function(data, textStatus, jqXHR){
	// got the aux file -- backlink the aux object in image's aux array 
	that.aux[aux.name] = aux;
	aux.text = data;
	if( func ){
	    try{ JS9.xeqByName(func, window, that, aux); }
	    catch(e){ JS9.error("in aux text onload callback", e); }
	}
    };
    // define error function here to make JSLint happy
    var errFunc = function(jqXHR, textStatus, errorThrown){
	JS9.log(sprintf("could not load auxiliary file: %s [%s]",
			aux.url, textStatus));
    };
    // sanity checks
    if( !type || !alen ){
	return;
    }
    // create regex from names (only once)
    for(i=0; i<alen; i++){
	aux = JS9.auxFiles[i];
	if( aux.image && !aux.regex ){
	    aux.regex = new RegExp(aux.image);
	}
    }
    // look for a match
    tokens = type.split(":");
    for(i=0; i<alen; i++){
	aux = JS9.auxFiles[i];
	if( (tokens[0] === aux.name)  && this.id.match(aux.regex) ){
	    if( (tokens.length === 1) || (tokens[1] === aux.type) ){
		switch(aux.type){
		case "mask":
		    // if image already loaded, make backlink and  call function
		    if( aux.im ){
			this.aux[aux.name] = aux;
			if( func ){
			    try{ JS9.xeqByName(func, window, this, aux); }
			    catch(e){ JS9.error("in aux mask callback", e); }
			}
		    } else {
			// save to later loading
			auxarr.push(aux);
		    }
		    break;
		case "regions":
		    // if region already loaded, backlink and  call function
		    if( aux.layer ){
			this.aux[aux.name] = aux;
			if( func ){
			    try{ JS9.xeqByName(func, window, this, aux); }
			    catch(e){ JS9.error("in aux regions callback", e); }
			}
		    } else {
			// save to later loading
			auxarr.push(aux);
		    }
		    break;
		case "text":
		    // if text already loaded, backlink and  call function
		    if( aux.text ){
			this.aux[aux.name] = aux;
			if( func ){
			    try{ JS9.xeqByName(func, window, this, aux); }
			    catch(e){ JS9.error("in aux text callback", e); }
			}
		    } else {
			// save to later loading
			auxarr.push(aux);
		    }
		    break;
		default:
		    break;
		}
	    }
	}
    }
    // load the new auxiliary files
    for(i=0; i<auxarr.length; i++){
	// current aux object
	aux = auxarr[i];
	switch(aux.type){
	case "mask":
	    // create an image-like object
	    aux.im = {};
	    // dereference
	    aim = aux.im;
	    // its an aux file
	    aim.type = "aux";
	    // aux file url
	    aim.file = aux.url;
	    // take file but discard path (or scheme) up to slashes
	    aim.id = aim.file.split("/").reverse()[0];
	    // init some parameters
	    aim.params = {};
	    aim.params.scalemin = Number.Nan;
	    aim.params.scalemax = Number.Nan;
	    // create the png object
	    aim.png = {};
	    // image element holds png file, from which array data is generated
	    aim.png.image = new Image();
	    // callback when image is loaded (do aim before setting src)
	    $(aim.png.image).on("load", loadMaskFunc).on("error", errFunc);
	    // set src to download the png and eventually generate the mask data
	    // (url is relative to js9 install directory)
	    aim.png.image.src = JS9.InstallDir(aux.url);
	    break;
	case "regions":
	    aux.layer = this.display.newShapeLayer(type, JS9.Regions.opts);
	    url = JS9.InstallDir(aux.url);
	    $.ajax({
		url: url,
		cache: false,
		dataType: "json",
		success: loadRegionFunc,
		error:  errFunc
	    }); 
	    break;
	case "text":
	    url = JS9.InstallDir(aux.url);
	    $.ajax({
		url: url,
		cache: false,
		dataType: "text",
		success: loadTextFunc,
		error:  errFunc
	    }); 
	    break;
	default:
	    break;
	}
    }
};

// save image as a fits file
JS9.Image.prototype.saveFITS = function(fname){
    var i, j, k, bpe, idx, le;
    var blob, header, npad, arr, buf, dbuf, _dbuf;
    if( window.hasOwnProperty("saveAs") ){
	dbuf = this.raw.data.buffer;
	fname = fname || "js9.fits";
	// get header
	header = JS9.raw2FITS(this.raw);
	// append padding to header now
	npad = 2880 - (header.length % 2880);
	if( npad === 2880 ){ npad = 0; }
	for(i=0; i<npad; i++){ header += " "; }
	// calculate padding for data for later
	npad = 2880 - (dbuf.byteLength % 2880);
	if( npad === 2880 ){ npad = 0; }
	// make an array buffer to hold the whole FITS file
	arr = new ArrayBuffer(header.length + dbuf.byteLength + npad);
	// and a view of that array to manipulate
	buf = new Uint8Array(arr);
	// copy the header
	for(i=0; i<header.length; i++){ buf[i] = header.charCodeAt(i); }
	// copy data
	// if necessary, swap data bytes to get FITS big-endian
	le = new Int8Array(new Int16Array([1]).buffer)[0] > 0;
	if( le ){
	    idx = header.length;
	    bpe = Math.abs(this.raw.bitpix)/8;
	    _dbuf = new Uint8Array(dbuf);
	    // swap bytes to big-endian
	    for(i=0; i<_dbuf.byteLength; i+= bpe){
		for(j=i+bpe-1, k=0; k<bpe; j--, k++){
		    buf[idx++] = _dbuf[j];
		}
	    }
	} else {
	    // already big-endian, just copy the data
	    buf.set(new Uint8Array(dbuf), header.length);
	}
	// now we can add data padding
	idx = header.length + dbuf.byteLength;
	for(i=0; i<npad; i++){ buf[idx++] = 0; }
	// convert to blob
	blob = new Blob([buf], {type: "application/octet-binary"});
	// and save
	saveAs(blob, fname);
    } else {
	JS9.error("no saveAs function available to save FITS file");
    }
};

// save image as a png file
JS9.Image.prototype.savePNG = function(fname){
    if( window.hasOwnProperty("saveAs") ){
	fname = fname || "js9.png";
	this.display.canvas.toBlob(function(blob) {
	    saveAs(blob, fname);
	});
    } else {
	JS9.error("no saveAs function available to save PNG file");
    }
};

// update (and display) pixel and wcs values (connected to info plugin)
JS9.Image.prototype.updateValpos = function(ipos, disp){
    var val, vstr, val3, i, c, s;
    var obj = null;
    var tr = function(x, length){
	length = length || 3;
	return x.toFixed(length);
    };
    var ti = function(num, length) {
        var r = "";
	var prefix = "";
	if( num < 0 ){
	    num = Math.abs(num);
	    prefix = "-";
	}
	r = r + num;
	while (r.length < length) {
            r = "0" + r;
	}
	return prefix + r;
    };
    // only do processing if valpos is turned on
    if( this.params.valpos ){
	// default is to display
	if( disp === undefined ){
	    disp = true;
	}
	// if a cached valpos object exists, use it
	// this is unset and reset in the mousemove callback
	if( this.valpos ){
	    if( disp ){
		this.displayMessage("info", this.valpos);
	    }
	    return this.valpos;
	}
	// get image coordinates
	i = {x: ipos.x, y: ipos.y, sys: "image"};
	// get pixel coordinates in current logical coordinate system;
	if( this.params.wcssys === "image" ){
	    c = i;
	} else {
	    c = this.imageToLogicalPos(ipos);
	}
	// get image value: here we need 0-indexed positions, so subtract 1
	// but add 0.5 before rounding since x.0 is in the middle of the pixel
	val = this.raw.data[Math.floor(ipos.y-0.5) * this.raw.width + 
			    Math.floor(ipos.x-0.5)];
	// fix the significant digits in the value
	switch(this.raw.bitpix){
	case 8:
	case 16:
	case -16:
	case 32:
	    val3 = ti(val,3);
	    break;
	case -32:
	    val3 = tr(val,3);
	    break;
	case -64:
	    val3 = tr(val,6);
	    break;
	default:
	    val3 = ti(val,3);
	    break;
	}
	// create the valpos string
	// since we can call this in mousemove, optimize by not using sprintf
	vstr = "value(" + val3 + ") " + c.sys + "(" + tr(c.x) + ", " + tr(c.y) + ")";
	// object containing all information
	obj = {ix: i.x, iy: i.y, isys: "image", px: c.x, py: c.y, psys: c.sys,
	       ra: "", dec: "", wcssys: "", val: val, val3: val3, vstr: vstr,
	       id: this.id, file: this.file, object: this.object};
	// add wcs, if necessary
	if( (this.wcs > 0) && 
	    (this.params.wcssys !== "image") &&
	    (this.params.wcssys !== "physical") ){
	    s = JS9.pix2wcs(this.wcs, ipos.x, ipos.y).trim().split(/\s+/);
	    vstr = vstr + " " + s[2] + "(" + s[0] + ", " + s[1] + ")";
	    // update object with wcs
	    obj.ra = s[0];
	    obj.dec = s[1];
	    obj.wcssys = s[2];
	    obj.vstr = vstr;
	}
	if( disp ){
	    this.displayMessage("info", obj);
	}
    }
    return obj;
};

// get color map name
JS9.Image.prototype.getColormap = function(){
    if(  this.cmapObj ){
	return {colormap: this.cmapObj.name,
		contrast: this.params.contrast,
		bias: this.params.bias};
    }
};

// set color map
JS9.Image.prototype.setColormap = function(arg, arg2, arg3){
    switch(arguments.length){
    case 1:
    case 3:
	switch(arg){
	case "rgb":
	    JS9.globalOpts.rgb.mode = !JS9.globalOpts.rgb.mode;
	    break;
	case "invert":
	    this.params.invert = !this.params.invert;
	    break;
	case "reset":
	    this.params.invert = JS9.imageOpts.invert;
	    this.params.contrast = JS9.imageOpts.contrast;
	    this.params.bias = JS9.imageOpts.bias;
	    break;
	default:
	    switch(this.cmapObj.name){
	    case "red":
		JS9.globalOpts.rgb.rim = null;
		break;
	    case "green":
		JS9.globalOpts.rgb.gim = null;
		break;
	    case "blue":
		JS9.globalOpts.rgb.bim = null;
		break;
	    }
	    this.cmapObj = JS9.lookupColormap(arg);
	    this.params.colormap = this.cmapObj.name;
	    switch(arg){
	    case "red":
		JS9.globalOpts.rgb.rim = this;
		break;
	    case "green":
		JS9.globalOpts.rgb.gim = this;
		break;
	    case "blue":
		JS9.globalOpts.rgb.bim = this;
		break;
	    }
	    break;
	}
        if( arguments.length === 3 ){
	    if( !isNaN(arg2) ){
	        this.params.contrast = arg2;
	    }
	    if( !isNaN(arg3) ){
	       this.params.bias = arg3;
	    }
        }
	break;
    case 2:
	if( !isNaN(arg) ){
	    this.params.contrast = arg;
	}
	if( !isNaN(arg2) ){
	    this.params.bias = arg2;
	}
	break;
    default:
	break;
    }
    this.displayImage("colors");
    return this;
};

// get scale factor
JS9.Image.prototype.getScale = function(){
    if( this.params.scale ){
	return {scale: this.params.scale, 
		scalemin: this.params.scalemin,
		scalemax: this.params.scalemax};
    }
};

// set scale factor
JS9.Image.prototype.setScale = function(s0, s1, s2){
    var that = this;
    var newscale = function(s){
	if( JS9.scales.indexOf(s) >= 0 ){
	    that.params.scale = s;
	} else {
	    JS9.error("unknown scale: " + s);
	}
    };
    if( arguments.length ){
	switch(arguments.length){
	case 1:
	    newscale(s0);
	    break;
	case 2:
	    this.params.scalemin = parseInt(s0, 10);
	    this.params.scalemax = parseInt(s1, 10);
	    this.mkColorData();
	    break;
        default:
	    newscale(s0);
	    this.params.scalemin = parseInt(s1, 10);
	    this.params.scalemax = parseInt(s2, 10);
	    this.mkColorData();
	    break;
	}
	this.displayImage("scaled");
    }
    return this;
};

// the zsale calculation
JS9.Image.prototype.zscale = function(setvals){
    var s, rawdata, buf, vals;
    // sanity check
    if( !JS9.zscale || !this.raw || !this.raw.data ){
	return this;
    }
    rawdata = this.raw.data;
    // allocate space for the image in the emscripten heap
    try{ buf = Astroem._malloc(rawdata.length * rawdata.BYTES_PER_ELEMENT); }
    catch(e){ JS9.error("image too large for zscale", e); }
    // copy the raw image data to the heap
    try{ Astroem.HEAPU8.set(new Uint8Array(rawdata.buffer), buf); }
    catch(e){ JS9.error("can't transfer image to heap for zscale", e); }
    // call the zscale routine
    s = JS9.zscale(buf,
		   this.raw.width, 
		   this.raw.height,
		   this.raw.bitpix,
		   this.params.zscalecontrast,
		   this.params.zscalesamples,
		   this.params.zscaleline);
    // free empscripten heap space
    Astroem._free(buf);
    // clean up return values
    vals = s.trim().split(" ");
    // save z1 and z2
    this.params.z1 = parseFloat(vals[0]);
    this.params.z2 = parseFloat(vals[1]);
    // make z1 and z2 the scale clip values, if necessary
    if( setvals ){
	this.params.scalemin = this.params.z1;
	this.params.scalemax = this.params.z2;
    }
    // allow chaining
    return this;
};

// Colormap
JS9.Colormap = function(name, a1, a2, a3){
    this.name = name;
    switch(arguments.length-1){
    case 1:
	this.type = "lut";
	this.colors = a1;
	break;
    case 3:
	this.type = "sao";
	this.vertices = [];
	this.vertices[0] = a1;
	this.vertices[1] = a2;
	this.vertices[2] = a3;
	break;
    default:
	JS9.error("colormap requires name and 1 or 3 array arg");
    }
    // add to list of colormaps
    JS9.colormaps.push(this);
    // debugging
    if( JS9.DEBUG > 1 ){
	JS9.log("JS9 colormap:  %s", this.name);
    }
};

JS9.Colormap.prototype.mkColorCell = function(ii){
    var m;
    var count = JS9.COLORSIZE;
    var umax = 255;
    var rgb = [0, 0, 0];
    switch(this.type){
    // from: saotk/colormap/sao.C
    case "sao":
	var i, j, val, vertex, len;
	var x = ii / count;
	// for each of red, green, blue ...
	for(j=0; j<3; j++){
	    // look for the first vertex with x value larger than our x value
	    vertex = this.vertices[j];
	    len = vertex.length;
	    for(i=0; i<len; i++){
		if( vertex[i][0] > x ){
		    break;
		}
	    }
	    // if first vertex x value is greater than ours, use it
	    if( i === 0 ){
		val = vertex[0][1];
	    // if last vertex xvalue is less than ours, use it
	    } else if( i === len ){
		val = vertex[len-1][1];
	    // interpolate between two vertices
	    } else {
		m = (vertex[i][1] - vertex[i-1][1]) / 
		    (vertex[i][0] - vertex[i-1][0]);
		if( m ){
		    // point slope form
		    val = m * (x - vertex[i-1][0]) + vertex[i-1][1]; 
		} else {
		    val = vertex[i][1];
		}
	    }
	    // assign value to the correct color in the result array
	    rgb[j] = val * umax;
	}
	break;
    // from: saotk/colormap/lut.C
    case "lut":
	var size = this.colors.length;
	// index into the evenly spaced RGB values
	var index = Math.floor((ii*size/count) + 0.5);
	if( (index >= 0) && (index < size) ){
	    rgb[0] = this.colors[index][0] * umax;
	    rgb[1] = this.colors[index][1] * umax;
	    rgb[2] = this.colors[index][2] * umax;
	}
	break;
    default:
	JS9.error("unknown colormap type");
    }
    // return the news
    return rgb;
};

// ---------------------------------------------------------------------
// JS9 display object for the screen display
// ---------------------------------------------------------------------
JS9.Display = function(el){
    var e;
    // pass jQuery element, DOM element, or id
    if( el instanceof jQuery ){
	this.divjq = el;
    } else if( typeof el === "object" ){
	this.divjq = $(el);
    } else {
	this.divjq = $("#"+el);
    }
    // make sure div has some id
    if( !this.divjq.attr("id") ){
	this.divjq.attr("id", JS9.DEFID);
    }
    // save id
    this.id = this.divjq.attr("id");
    // add class
    this.divjq.addClass("JS9");
    // set width and height on div
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = JS9.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height = JS9.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // create DOM canvas element
    this.canvas = document.createElement("canvas");
    // jquery version for event handling and DOM manipulation
    this.canvasjq = $(this.canvas)
	.addClass("JS9Image")
	.css("z-index", JS9.ZINDEX)
	.attr("width", this.width)
	.attr("height", this.height);
    // add container to the high-level div
    this.displayConjq = $("<div>")
	.addClass("JS9Container")
	.css("z-index", JS9.ZINDEX)
	.attr("tabindex", "0")
	.append(this.canvasjq)
	.appendTo(this.divjq);
    // drawing context
    this.context = this.canvas.getContext("2d");
    // turn off anti-aliasing
    if( !JS9.ANTIALIAS ){
	this.context.imageSmoothingEnabled = false;
	this.context.mozImageSmoothingEnabled = false;
	this.context.webkitImageSmoothingEnabled = false;
    }
    // no image loaded into this canvas
    this.image = null;
    // no plugin instances yet
    this.pluginInstances = {};
    // no layers yet
    this.layers = {};
    // get x and y position of upper left corner
    for(this.x = 0, e=this.canvas; e; e=e.offsetParent){
	this.x += e.offsetLeft;
    }
    for(this.y = 0, e=this.canvas; e; e=e.offsetParent){
	this.y += e.offsetTop;
    }
    // init message layer
    this.initMessages();
    // add event handlers
    this.divjq.on("mouseover", this, 
		  function(evt){return JS9.mouseOverCB(evt);});
    this.divjq.on("mousedown touchstart", this, 
		  function(evt){return JS9.mouseDownCB(evt);});
    this.divjq.on("mousemove touchmove", this, 
		  function(evt){return JS9.mouseMoveCB(evt);});
    this.divjq.on("mouseup touchend", this, 
		  function(evt){return JS9.mouseUpCB(evt);});
    this.divjq.on("mouseout", this, 
		  function(evt){return JS9.mouseOutCB(evt);});
    this.divjq.on("keypress", this, 
		  function(evt){return JS9.keyPressCB(evt);});
    this.divjq.on("keydown", this, 
		  function(evt){return JS9.keyDownCB(evt);});
    // set up drag and drop, if available
    this.divjq.on("dragenter", this, function(evt){
	return JS9.dragenter(this.id, evt.originalEvent);
    });
    this.divjq.on("dragover", this, function(evt){
	return JS9.dragover(this.id, evt.originalEvent);
    });
    this.divjq.on("dragexit", this, function(evt){
	return JS9.dragexit(this.id, evt.originalEvent);
    });
    this.divjq.on("drop", this, function(evt){
	return JS9.dragdrop(this.id, evt.originalEvent, JS9.NewFITSImage);
    });
    this.divjq.append('<div style="visibility:hidden; position:relative; top:-50;left:-50"> <input type="file" id="openLocalFile-' + this.id + '" multiple="true" onchange="javascript:for(var i=0; i<this.files.length; i++){JS9.Load(this.files[i], {display:\''+ this.id +'\'}); }"> </div>');
    this.divjq.append('<div style="visibility:hidden; position:relative; top:-50;left:-50"> <input type="file" id="refreshLocalFile-' + this.id + '" multiple="true" onchange="javascript:for(var i=0; i<this.files.length; i++){JS9.RefreshImage(this.files[i], {display:\''+ this.id +'\'}); }"> </div>');
    this.divjq.append('<div style="visibility:hidden; position:relative; top:-50;left:-50"> <input type="file" id="openLocalRegions-' + this.id + '" multiple="true" onchange="javascript:for(var i=0; i<this.files.length; i++){JS9.LoadRegions(this.files[i], {display:\''+ this.id +'\'}); }"> </div>');
    // add to list of displays
    JS9.displays.push(this);
    // debugging
    if( JS9.DEBUG ){
	JS9.log("JS9 display:  %s (%d,%d)", this.id, this.x, this.y);
    }
};

// initialize message layers
JS9.Display.prototype.initMessages = function(){
    this.messageContainer = $("<div>")
	.addClass("JS9Container")
        .css("z-index", JS9.MESSZINDEX)
	.appendTo(this.divjq);
    this.infoArea = $("<div>")
	.addClass("JS9Message")
	.appendTo(this.messageContainer);
    this.regionsArea = $("<div>")
	.addClass("JS9Message")
	.appendTo(this.messageContainer);
    // allow chaining
    return this;
};

//  display a plugin in a light window or a new window
JS9.Display.prototype.displayPlugin = function(plugin){
    var a, name, did, oid, iid, odiv, pdiv, pinst, win, w, h, r, s, title;
    pinst = this.pluginInstances[plugin.name];
    // some day we want to support light windows and new (external) windows
    switch(JS9.globalOpts.winType){
    case "light":
	a = JS9.lightOpts[JS9.LIGHTWIN];
	if( !pinst || !pinst.status ){
	    // no spaces in an id
	    name = plugin.name.replace(/\s/g, "_");
	    // convenience ids
	    did = this.id + "_" + name + "_lightDiv";
	    oid = this.id + "_" + name + "_outerDiv";
	    iid = this.id + "_" + name + "_innerDiv";
	    // set up a new light instance, if necessary
	    if( !pinst ){
		odiv = $("<div>")
		    .attr("id", oid)
		    .css("display", "none")
		    .appendTo($(this.divjq));
		$("<div>")
		    .addClass(plugin.name)
		    .attr("id", iid)
		    .attr("data-js9id", this.divjq.attr("id"))
		    .css("height", "100%")
		    .css("width", "100%")
		    .appendTo(odiv);
	    }
	    // window not created: create and show it
	    // create the window
	    w = plugin.opts.winDims[0] || JS9.WIDTH;
	    h = plugin.opts.winDims[1] || JS9.HEIGHT;
	    if( plugin.opts.winResize ){
		r = "1";
	    } else {
		r = "0";
	    }
	    // light window param string
	    s = sprintf(a.format, w, h, r);
	    // add the title, if explicitly called for and if not already added
	    if( plugin.opts.toolbarHTML &&
		plugin.opts.toolbarHTML.search(/\$title/) >= 0 ){
		title = "";
	    } else {
		title = plugin.opts.winTitle || "";
	    }
	    // create the light window
	    win = JS9.lightWin(did, "div", oid, title, s);
	    // find inner div in the light window
	    pdiv = $("#" + did + " #" + iid);
	    // create the plugin inside the inner div
	    pinst = JS9.instantiatePlugin(pdiv, plugin, win);
	    pinst.winHandle.onclose = function(){
		// just hide the window
		pinst.winHandle.hide();
		pinst.status = "inactive";
		return false;
	    };
	    pinst.status = "active";
	    if( plugin.opts.plugindisplay ){
		try{
		    plugin.opts.plugindisplay.call(pinst, this.image);
		}
		catch(e){
		    JS9.log("plugindisplayCB: %s [%s]\n%s",
			    plugin.name, e.message, JS9.strace(e));
		}
	    }
	} else if( pinst.status === "inactive" ){
	    // window created but hidden: show it
	    if( pinst.winHandle ){
		pinst.winHandle.show();
		pinst.status = "active";
		if( plugin.opts.plugindisplay ){
		    try{
			plugin.opts.plugindisplay.call(pinst, this.image);
		    }
		    catch(e){
			JS9.log("plugindisplayCB: %s [%s]\n%s",
				plugin.name, e.message, JS9.strace(e));
		    }
		}
	    }
	} else if( pinst.status === "active" ){
	    // window created and showing: hide it
	    if( pinst.winHandle ){
		pinst.winHandle.hide();
		pinst.status = "inactive";
	    }
	}
	break;
    case "new":
	JS9.error("external window support for plugins not yet implemented");
	break;
    }
};

// ---------------------------------------------------------------------
// JS9 Command, commands for console window
// ---------------------------------------------------------------------
JS9.Command = function(obj){
    var p;
    // copy properties to new object
    for( p in obj ){
	if( obj.hasOwnProperty(p) ){
	    this[p] = obj[p];
	}
    }
    // sanity checks
    if( !obj.name ){
	JS9.error("command has no name");
    }
    if( !obj.get && !obj.set  ){
	JS9.error("command requires get and/or set routine");
    }
    // save in commands list
    JS9.commands.push(this);
    // debugging
    if( JS9.DEBUG > 1 ){
	JS9.log("JS9 command:  %s", this.name);
    }
};

// get the display tied to this command (as well as the current image).
JS9.Command.prototype.getDisplayInfo = function(display){
    if( display && display.id ){
	this.display = display;
	this.image = display.image;
    }
    // allow chaining
    return this;
};

// return "get" or "set" to specify which command to run
JS9.Command.prototype.getWhich = function(args){
    var which;
    if( this.get && !this.set ){
	which = "get";
    } else if( this.set && !this.get ){
	which = "set";
    } else if( this.which ){
	which = this.which(args);
    } else if( args.length === 0 ){
	which = "get";
    } else {
	which = "set";
    }
    return which;
};

// ---------------------------------------------------------------------
// JS9 console: a window into which commands can be entered
// basic idea borrowed from goosh.org, to whom grateful acknowledgement is made
// ---------------------------------------------------------------------
JS9.Console = function(width, height){
    // mark as valid
    this.display.conMode = 2;
    // set up history
    this.hist = [];
    this.histpos = 0;
    this.histtemp = 0;
    this.histused = false;
    // add ability to handle events to this div
    // this.divjq.attr("tabindex", "0");
    // add container into the div
    this.consoleConjq = $("<div>")
	.addClass("JS9ConsoleContainer")
	.appendTo(this.divjq);
    // light wins: size is set by containing window
    // for others, we need to set the size
    if( this.winType !== "light" ){
	// set width and height on div
	this.width = this.divjq.attr("data-width");
	if( !this.width  ){
	    this.width  = width || JS9.CONWIDTH;
	}
	this.divjq.css("width", this.width);
	this.width = parseInt(this.divjq.css("width"), 10);
	this.height = this.divjq.attr("data-height");
	if( !this.height ){
	    this.height = height || JS9.CONHEIGHT;
	}
	this.divjq.css("height", this.height);
	this.height = parseInt(this.divjq.css("height"), 10);
	this.consoleConjq
	    .css("width", this.width)
	    .css("height", this.height);
    }
    // add ability to handle events to this div
    this.consoleConjq.attr("tabindex", "0");
    // event handlers:
    // history processing
    this.consoleConjq.on("keydown", this, function(evt){
	return JS9.consoleKeyDownCB(evt);
    });
    // welcome message
    this.out("Type 'help' for a list of commands", "info");
    // ready next input
    this.inp();
};

// prepare for new input
JS9.Console.prototype.inp = function(){
    var prompt = "js9>";
    // make previous command input read-only
    this.consoleConjq.find(".JS9CmdIn:last").attr("readonly", "readonly");
    // add new input element
    this.consoleConjq.append(JS9.consoleHTML.replace(/@@PR@@/g,prompt));
    // focus on it
    // and prevent Apple ipads from autocapitalizing, etc.
    this.consoleConjq.find(".JS9CmdIn:last")
	.focus()
	.attr("autocapitalize", "off")
	.attr("autocorrect", "off")
	.attr("autocomplete", "off");
    // allow chaining
    return this;
};

// output results
JS9.Console.prototype.out = function(s,c){
    // message type
    switch(c.toLowerCase()){
    case "error":
	s = "ERROR: " + s;
	c = "Error";
	break;
    case "info":
	c = "Info";
	break;
    case "out":
	c = "Out";
	break;
    default:
	c = "Out";
	break;
    }
    // create a new output element
    $("<div>").addClass("JS9Cmd" + c).html(s).appendTo(this.consoleConjq);
    // allow chaining
    return this;
};

// execute a command
JS9.Console.prototype.xeq = function(){
    var i, cmd, obj, msg;
    var cmdstring = this.consoleConjq.find(".JS9CmdIn:last").val();
    var tokens = cmdstring.replace(/ {2,}/g, " ").split(" ");
    var args = [];
    // skip blank lines
    if( !tokens[0] ){
	return this;
    }
    cmd = tokens[0];
    // create args array
    for(i=1; i<tokens.length; i++){
	args.push(tokens[i]);
    }
    // save history, if necessary
    if( !this.histused ){
	this.hist[this.hist.length] = cmdstring;
    }
    this.histpos = this.hist.length;
    this.histused = false;
    // lookup and xeq, if possible
    try{
	obj = JS9.lookupCommand(cmd);
	if( obj ){
	    obj.getDisplayInfo(this.display);
	    switch(obj.getWhich(args)){
	    case "get":
		msg = obj.get(args) || "";
		this.out(msg, "ok");
		break;
	    case "set":
		msg = obj.set(args);
		if( msg ){
		    this.out(msg, "ok");
		}
		break;
	    default:
		msg = sprintf("unknown cmd type for '%s'", cmd);
		JS9.error(msg);
		break;
	    }
	} else {
	    msg = sprintf("unknown command '%s'", cmd);
	    if( args.length > 0 ){
		msg = msg + " " + args;
	    }
	    JS9.error(msg);
	}
    } catch(e){
	// output error
	this.out(e.message, "error");
    }
    // allow chaining
    return this;
};

// ---------------------------------------------------------------------
// JS9 info, a minimalist info display
// ---------------------------------------------------------------------
JS9.Info = {};
JS9.Info.CLASS = "JS9";
JS9.Info.NAME = "Info";

JS9.Info.opts = {
    // info url
    infoURL: "./params/info.html",
    infoHTML: '<table id="info" class="js9InfoTable">' +
'<tr>' +
'<td>file:</td>' +
'<td colspan="2"><input type="text" id="id" size="28" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td>object:</td>' +
'<td colspan="2"><input type="text" id="object" size="28" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td>value:</td>' +
'<td colspan="2"><input type="text" id="val3" size="28" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td><input type="text" id="isys" size="10" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="ix" size="13" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="iy" size="13" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td><input type="text" id="psys" size="10" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="px" size="13" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="py" size="13" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td><input type="text" id="wcssys" size="10" value="" readonly="readonly" /></span></td>' +
'<td><input type="text" id="ra" size="13" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="dec" size="13" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td colspan="3"><textarea style="background: #E9E9E9; border: #CCCCCC solid 1px" id="regions" rows="4" cols="40" value="" readonly="readonly" /></td>' +
'</tr>' +
'</table>'
};

JS9.Info.init = function(width, height){
    // set width and height on div
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = width || JS9.INFOWIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height = height || JS9.INFOHEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // add container to the high-level div
    this.infoConjq = $("<div>")
	.addClass("JS9Container")
	.append(JS9.Info.opts.infoHTML)
	.appendTo(this.divjq);
    // save the jquery element for later processing
    this.jq = this.infoConjq.find("#info");
};

// display a message on the image canvas or info plugin
// call with image or display as context
JS9.Info.display = function(type, message, target){
    var tobj, split, area, tokens, rexp, s, color, info, key, jel;
    // if image is context
    if( this.display && this.display.pluginInstances ){
	info = this.display.pluginInstances.JS9Info;
    }
    // if specific target was specified use that
    if( target ){
	tobj = target;
    } else {
	// if info plugin is active, use that
	if( info && (info.status === "active") ){
	    tobj = info;
	} else {
	    // use display
	    if( this.display ){
		// image context
		tobj = this.display;
	    } else {
		// display context
		tobj = this;
	    }
	}
    }
    // plugin-based display: fill in html form
    if( tobj === info ){
	switch( typeof message ){
	case "string":
	    jel = info.jq.find("#" + type);
	    if( jel.length > 0 ){
		jel.val(message);
	    }
	    break;
	case "object":
	    // process all key in the object
	    for( key in message ){
		if( message.hasOwnProperty(key) ){
		    // key-specific processing
		    switch(key){
		    case "wcssys":
			if( !message[key] ){
			    message[key] = "wcs";
			}
			break;
		    }
		    // set value, if possible
		    jel = info.jq.find("#" + key);
		    if( jel.length > 0 ){
			jel.val(message[key]);
		    }
		}
	    }
	    break;
	}
	// allow chaining
	return this;
    }
    // display-based message
    switch(type){
    case "regions":
	area = tobj.regionsArea;
	split = ";";
	break;
    case "info":
	area = tobj.infoArea;
	split = "";
	break;
    default:
	area = tobj.infoArea;
	break;
    }
    // special colors if message is likely to overlap image
    if( this.primary && 
	this.primary.img.height / this.display.canvas.height < 0.8 ){
	color = "black";
    } else {
	switch(type){
	case "regions":
	    color = JS9.textColorOpts.regions;
	    break;
	case "info":
	    color = JS9.textColorOpts.info;
	    break;
	default:
	    color = JS9.textColorOpts.info;
	    break;
	}
    }
    // massage the message before display, if necessary
    switch( typeof message ){
    case "string":
	s = message;
	break;
    case "object":
	s = message.vstr;
	break;
    }
    if( split !== "" ){
	tokens = s.split(split);
	if( tokens.length > 2 ){
	    rexp = new RegExp(split, "g");
	    s = s.replace(rexp, "<br>");
	}
    }
    // display the message
    area.css("color", color).html(s);
    // allow chaining
    return this;
};
JS9.Image.prototype.displayMessage = JS9.Info.display;

// clear an info message
JS9.Info.clear = function(which){
    if( which ){
	this.displayMessage(which, "");
    } else {
	this.displayMessage("info", "");
	this.displayMessage("regions", "");
    }
    // allow chaining
    return this;
};
JS9.Image.prototype.clearMessage = JS9.Info.clear;

// when a plugin window is brought up, clear the display window
JS9.Info.clearMain = function(im){
    if( im ){
	im.displayMessage("info", "", im.display);
	im.displayMessage("regions", "", im.display);
    }
};

// ---------------------------------------------------------------------
// JS9 menubar to manage menubar and its menus
// ---------------------------------------------------------------------
JS9.Menubar = function(width, height){
    var ii, ss, tt;
    var menubarHTML;
    var that = this;
    // set width and height on div
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width = width || JS9.MENUWIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height  ){
	this.height = height || JS9.MENUHEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // init menubarHTML, if necessary
    if( JS9.menubarHTML === "" ){
	JS9.menubarHTML = "<span id='JS9Menus_@@ID@@' class='ui-widget-header ui-corner-all'>";
	for(ii=0; ii<JS9.menuButtonOptsArr.length; ii++){
	    ss = JS9.menuButtonOptsArr[ii].name;
	    tt = JS9.menuButtonOptsArr[ii].label;
	    if( ss[0] === "#" ){
		ss = ss.slice(1);
		JS9.menubarHTML += "<button type='button' id='"+ss+"Menu@@ID@@' class='JS9Button' disabled='disabled'>"+tt+" </button>";
	    } else {
		JS9.menubarHTML += "<button type='button' id='"+ss+"Menu@@ID@@' class='JS9Button'>"+tt+"</button>";
	    }
	}
	JS9.menubarHTML += "<button type='button' id='hiddenRegionMenu@@ID@@'class='JS9Button' style='display:none'>R</button>";
	JS9.menubarHTML += "<button type='button' id='hiddenAnchorMenu@@ID@@'class='JS9Button' style='display:none'>R</button>";
	JS9.menubarHTML += "</span>";
    }
    // set the display for this menubar
    this.display = JS9.lookupDisplay(this.id);
    // link back the menubar in the display
    this.display.menubar = this;
    // define menubar
    menubarHTML = JS9.menubarHTML.replace(/@@ID@@/g,this.id);
    // add container to the high-level div
    this.menuConjq = $("<div>")
	.addClass("JS9MenubarContainer")
	.attr("width", this.width)
	.attr("height", this.height)
	.html(menubarHTML)
	.appendTo(this.divjq);
    $(function(){
	function onhide(opt) {
	    var tdisp = that.display;
	    if( JS9.bugs.hide_menu && tdisp.image ){
		tdisp.image.displayImage("primary");
	    }
	}
	function getDisplays() {
	    var i, s, disp;
	    var arr = [];
	    if( that.id.search(JS9.SUPERMENU) >= 0 ){
		s = that.divjq.data("displays").split(",");
		if( s[0] === "*" ){
		    for(i=0; i<JS9.displays.length; i++){
			arr.push(JS9.displays[i]);
		    }
		} else {
		    for(i=0; i<s.length; i++){
			disp = JS9.lookupDisplay(s[i]);
			if( disp ){
			    arr.push(disp);
			}
		    }
		}
	    }
	    if( !arr.length ){
		arr.push(that.display);
	    }
	    return arr;
	}
	// file: make button open the contextMenu
	$("#fileMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#fileMenu" + that.id).contextMenu();
	});
	$.contextMenu({
            selector: "#fileMenu" + that.id, 
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
            build: function($trigger, evt){
		var i, im, name, imlen;
		var n = 0;
		var items = {};
		var tdisp = getDisplays()[0];
		imlen = JS9.images.length;
		for(i=0; i<imlen; i++){
		    im = JS9.images[i];
		    if( im.display === tdisp ){
			name = im.id;
			items[name] = {name: name};
			if( tdisp.image && (tdisp.image.id === im.id) ){
			    items[name].icon = "sun";
			}
			n++;
		    }
		}
		if( !n ){
		    items.noimg = {
			name: "[no images]", 
			events: {keyup: function(evt){return;}}
		    };
		}
		items["sep" + n++] = "------";
		items.open = {name: "open ..."};
		items.print = {name: "print ..."};
		items.header = {name: "display FITS header"};
		items.pageid = {name: "display pageid"};
		items.savefits = {name: "save image as FITS"};
		items.savepng = {name: "save image as PNG"};
		items.close = {name: "close image"};
		items["sep" + n++] = "------";
		items.lite = {name: "new JS9 light window"};
		items.xnew = {name: "new JS9 separate window"};
		if( JS9.DEBUG > 2 ){
		  items["sep" + n++] = "------";
		  items.refresh = {name: "debug: refresh ..."};
		}
		return {
                    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var j, s;
			var udisp = val;
			var uim = udisp.image;
			switch(key){
			case "close":
			    if( uim ){
				uim.closeImage();
			    }
			    break;
			case "header":
			    if( uim ){
				if( uim.raw.header ){
				    uim.displayAnalysis("text", 
						   JS9.raw2FITS(uim.raw, true),
						   "FITSHeader_"+uim.id);
				} else {
				    JS9.error("no FITS header for " + uim.id);
				}
			    }
			    break;
			case "lite":
			    JS9.LoadWindow(null, null, "light");
			    break;
			case "xnew":
			    JS9.LoadWindow(null, null, "new");
			    break;
			case "pageid":
			    s = "<center><p>Usage: js9 -pageid [pageid] ...<p>" + JS9.helper.pageid || "none" + "</center>";
			    JS9.lightWin("fileid" + JS9.uniqueID(), 
					 "inline", s, "page ID", 
					 JS9.lightOpts[JS9.LIGHTWIN].lineWin);
			    break;
			case "open":
			    JS9.OpenFileMenu(udisp);
			    break;
			case "refresh":
			    $('#refreshLocalFile-' + udisp.id).click();
			    break;
			case "savefits":
			    if( uim ){
				s = uim.id.replace(/png/, "fits")
				          .replace(/.gz$/, "")
				          .replace(/\[.*\]/,"");
				uim.saveFITS(s);
			    }
			    break;
			case "savepng":
			    if( uim ){
				s = uim.id.replace(/fits/, "png")
				          .replace(/.gz$/, "")
				          .replace(/\[.*\]/,"");
				uim.savePNG(s);
			    }
			    break;
			case "print":
			    if( uim ){
				uim.print();
			    }
			    break;
			default:
			    for(j=0; j<JS9.images.length; j++){
				uim = JS9.images[j];
				if( (udisp.id === uim.display.id) &&
				    (uim.id === key) ){
				    // display image, 2D graphics, etc.
				    uim.displayImage("display");
				    uim.clearMessage();
				    break;
				}
			    }
			    break;
			}
		    });
                    },
		    items: items
		};
            }
	});
	// View: make button open the contextMenu
	$("#viewMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#viewMenu" + that.id).contextMenu();
	});
	// define contextMenu actions
	$.contextMenu({
            selector: "#viewMenu" + that.id, 
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
            build: function($trigger, evt){
		var i, plugin, pname, pinst, key;
		var lastxclass="";
		var n = 0;
		var nkey = 0;
		var items = {};
		var tdisp = getDisplays()[0];
		var tim = tdisp.image;
		// plugins
		for(i=0; i<JS9.plugins.length; i++){
		    plugin = JS9.plugins[i];
		    pname = plugin.name;
		    if( plugin.opts.menuItem && (plugin.opts.menu === "view") ){
			pinst = tdisp.pluginInstances[pname];
			if( !pinst || pinst.winHandle ){
			    if( plugin.xclass !== lastxclass ){
				// items["sep" + n] = "------";
				n = n + 1;
			    }
			    lastxclass = plugin.xclass;
			    items[pname] = {name: plugin.opts.menuItem};
			    if( pinst && (pinst.status === "active") ){
				items[pname].icon = "sun";
			    }
			}
		    }
		}
		// layers
		items["sep" + n++] = "------";
		if( tim ){
		    for( key in tim.layers ){
			if( tim.layers.hasOwnProperty(key) ){
			    if( tim.layers[key].dlayer.dtype === "main" ){
				nkey++;
				items[key] = {name: key};
				if( tim.layers[key].show ){
				    items[key].icon = "sun";
				}
			    }
			}
		    }
		    if( nkey > 1 ){
			items.hide = {name: "HideAll"};
			items.show = {name: "ShowAll"};
			items["sep" + n++] = "------";
		    }
		}
		items.valpos = {name: "display value/position"};
		if( tdisp.image && tdisp.image.params.valpos ){
		    items.valpos.icon = "sun";
		}
		return {
		    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var jj, ucat, umode, uplugin;
			var udisp = val;
			var uim = udisp.image;
			switch(key){
			case "valpos":
			    if( uim ){
				uim.params.valpos = !uim.params.valpos;
				if( !uim.params.valpos ){
				    uim.clearMessage();
				}
			    }
			    break;
			case "show":
			case "hide":
			    if( uim ){
				for( ucat in uim.layers ){
				    if( uim.layers.hasOwnProperty(ucat) ){
					if( uim.layers[ucat].dlayer.dtype === "main" ){
					    uim.showShapeLayer(ucat, key);
					}
				    }
				}
			    }
			    break;
			default:
			    // maybe it's a plugin
			    for(jj=0; jj<JS9.plugins.length; jj++){
				uplugin = JS9.plugins[jj];
				if( uplugin.name === key ){
				    udisp.displayPlugin(uplugin);
				    return;
				}
			    }
			    // maybe it's a shape layer
			    if( uim ){
				for( ucat in uim.layers ){
				    if( uim.layers.hasOwnProperty(ucat) ){
					if( key === ucat ){
					    umode = uim.layers[ucat].show ? 
						"hide" : "show";
					    uim.showShapeLayer(ucat, umode);
					    return;
					}
				    }
				}
			    }
			    break;
			}
		    });
		    },
		    items: items
		};
	    }
	});
	// Zoom: make button open the contextMenu
	$("#zoomMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#zoomMenu" + that.id).contextMenu();
	});
	// define contextMenu actions
	$.contextMenu({
            selector: "#zoomMenu" + that.id, 
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
            build: function($trigger, evt){
		var i, zoom, zoomp, name, name2;
		var n = 0;
		var tdisp = getDisplays()[0];
		var tim = tdisp.image;
		var editZoom = function(im, obj){
		    if( !isNaN(obj.zoom) ){
			im.setZoom(obj.zoom);
		    }
		};
		var keyZoom = function(e){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = that.display;
		    var vim = vdisp.image;
		    switch( keycode ){
		    case 9:
		    case 13:
			if( vim ){
			    editZoom(vim, obj);
			}
			break;
		    }
		    // key was pressed
		    e.data.edited = true;
		};
		var items = {};
		items.zoomtitle = {name: "Zoom Factors:", disabled: true};
		for(i=JS9.imageOpts.zooms; i>=1; i--){
		    zoom = Math.pow(2,-i);
		    zoomp = Math.pow(2,i);
		    name = sprintf("zoom%s", zoom);
		    name2 = sprintf("zoom 1/%s", zoomp);
		    items[name] = {name: name2};
		    if( tim && (tim.primary.sect.zoom === zoom) ){
			items[name].icon = "sun";
		    }
		}
		for(i=0; i<=JS9.imageOpts.zooms; i++){
		    zoom = Math.pow(2,i);
		    name = sprintf("zoom%s", zoom);
		    name2 = sprintf("zoom %s", zoom);
		    items[name] = {name: name2};
		    if( tim && (tim.primary.sect.zoom === zoom) ){
			items[name].icon = "sun";
		    }
		}
		items["sep" + n++] = "------";
		items.zoomiotitle = {name: "Zoom In/Out:", disabled: true};
		items.zoomIn = {name: "zoom in"};
		items.zoomOut = {name: "zoom out"};
		items.zoomToFit = {name: "zoom to fit"};
		items["sep" + n++] = "------";
		items.zoom = {
		    events: {keyup: keyZoom},
		    name: "numeric zoom value:", 
		    type: "text"
		};
		items["sep" + n++] = "------";
		items.center = {name: "pan to center"};
		items.reset = {name: "reset zoom/pan"};
		return {
		    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var udisp = val;
			var uim = udisp.image;
			if( uim ){
			    switch(key){
			    case "zoomIn":
				uim.setZoom("x2");
				break;
			    case "zoomOut":
				uim.setZoom("/2");
				break;
			    case "zoomToFit":
				uim.setZoom("tofit");
				break;
			    case "center":
				uim.setPan();
				break;
			    case "reset":
				uim.setZoom("1");
				uim.setPan();
				break;
			    default:
				// look for a numeric zoom
				if( key.match(/^zoom/) ){
				    uim.setZoom(key.slice(4));
				}
				break;
			    }
			}
		    });
		    },
		    events: {
			show: function(opt){
			    var udisp = that.display;
			    var uim = udisp.image;
			    var obj = {};
			    if( uim  ){
				obj.zoom = 
				    String(uim.primary.sect.zoom);
			    }
			    $.contextMenu.setInputValues(opt, obj);
			}, 
			hide: function(opt){
			    var obj;
			    var udisp = that.display;
			    var uim = udisp.image;
			    if( uim ){
				// if a key was pressed, do the edit
				if( opt.edited ){
				    delete opt.edited;
				    obj = $.contextMenu.getInputValues(opt);
				    editZoom(uim, obj);
				}
			    }
			}
		    },
		    items: items
		};
	    }
	});
	// Scale: make button open the contextMenu
	$("#scaleMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#scaleMenu" + that.id).contextMenu();
	});
	// define contextMenu actions
	$.contextMenu({
            selector: "#scaleMenu" + that.id, 
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
            build: function($trigger, evt){
		var i, s1, s2;
		var n = 0;
		var items = {};
		var tdisp = getDisplays()[0];
		var editScale = function(im, obj){
		    if( !isNaN(obj.scalemin) ){
			im.params.scalemin = obj.scalemin;
		    }
		    if( !isNaN(obj.scalemax) ){
			im.params.scalemax = obj.scalemax;
		    }
		    im.displayImage("colors");
		};
		var keyScale = function(e){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = that.display;
		    var vim = vdisp.image;
		    switch( keycode ){
		    case 9:
		    case 13:
			editScale(vim, obj);
			break;
		    }
		    // key was pressed
		    e.data.edited = true;
		};
		items.scaletitle = {name: "Scaling Algorithms:", 
				    disabled: true};
		for(i=0; i<JS9.scales.length; i++){
		    s1 = JS9.scales[i];
		    s2 = s1;
		    items[s1] = {name: s2};
		    if( tdisp.image && (tdisp.image.params.scale === s1) ){
			items[s1].icon = "sun";
		    }
		}
		items["sep" + n++] = "------";
		items.scalemin = {
		    events: {keyup: keyScale},
		    name: "low limit for clipping:",
		    type: "text"
		};
		items.scalemax = {
		    events: {keyup: keyScale},
		    name: "high limit for clipping:",
		    type: "text"
		};
		items["sep" + n++] = "------";
		items.dminmax = {
		    name: "set limits to data min/max"
		};
		items.zscale = {
		    name: "set limits to zscale z1/z2"
		};
		return {
                    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var udisp = val;
			var uim = udisp.image;
			if( uim ){
			    switch(key){
			    case "dminmax":
				uim.params.scaleclipping = "dataminmax";
				uim.params.scalemin = uim.raw.dmin;
				uim.params.scalemax = uim.raw.dmax;
				$.contextMenu.setInputValues(opt, 
				     {scalemin: String(uim.params.scalemin),
				      scalemax: String(uim.params.scalemax)});
				uim.displayImage("colors");
				return false;
			    case "zscale":
				if( !uim.params.z1 || uim.params.z2 ){
				    uim.zscale(false);
				}
				uim.params.scaleclipping = "zscale";
				uim.params.scalemin = uim.params.z1;
				uim.params.scalemax = uim.params.z2;
				$.contextMenu.setInputValues(opt, 
				     {scalemin: String(uim.params.scalemin),
				      scalemax: String(uim.params.scalemax)});
				uim.displayImage("colors");
				return false;
			    default:
				uim.setScale(key);
				break;
			    }
			}
		    });
		    },
		    events: {
			show: function(opt){
			    var udisp = that.display;
			    var uim = udisp.image;
			    var obj = {};
			    if( uim  ){
				obj.scalemin = 
				    String(uim.params.scalemin);
				obj.scalemax = 
				    String(uim.params.scalemax);
			    }
			    $.contextMenu.setInputValues(opt, obj);
			}, 
			hide: function(opt){
			    var obj;
			    var udisp = that.display;
			    var uim = udisp.image;
			    if( uim ){
				// if a key was pressed, do the edit
				if( opt.edited ){
				    delete opt.edited;
				    obj = $.contextMenu.getInputValues(opt);
				    editScale(uim, obj);
				}
			    }
			}
		    },
		    items: items
		};
	    }
	});
	// Color: make button open the contextMenu
	$("#colorMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#colorMenu" + that.id).contextMenu();
	});
	// define contextMenu actions
	$.contextMenu({
            selector: "#colorMenu" + that.id, 
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
            build: function($trigger, evt){
		var i, s1, s2;
		var n = 0;
		var items = {};
		var tdisp = getDisplays()[0];
		var editColor = function(im, obj){
		    if( !isNaN(obj.contrast) ){
			im.params.contrast = obj.contrast;
		    }
		    if( !isNaN(obj.bias) ){
			im.params.bias = obj.bias;
		    }
		    if( !isNaN(obj.alpha) ){
			im.params.alpha = obj.alpha;
		    }
		    im.displayImage("colors");
		};
		var keyColor = function(e){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = that.display;
		    var vim = vdisp.image;
		    switch( keycode ){
		    case 9:
		    case 13:
			editColor(vim, obj);
			break;
		    }
		    // key was pressed
		    e.data.edited = true;
		};
		items.cmaptitle = {name: "Colormaps:", disabled: true};
		for(i=0; i<JS9.colormaps.length; i++){
		    s1 = JS9.colormaps[i].name;
		    s2 = s1;
		    items[s1] = {name: s2};
		    if( tdisp.image && (tdisp.image.cmapObj.name === s1) ){
			items[s1].icon = "sun";
		    }
		}
		items["sep" + n++] = "------";
		items.contrast = {
		    events: {keyup: keyColor},
		    name: "contrast value:", 
		    type: "text"
		};
		items.bias = {
		    events: {keyup: keyColor},
		    name: "bias value:", 
		    type: "text"
		};
		items.alpha = {
		    events: {keyup: keyColor},
		    name: "alpha value:", 
		    type: "text"
		};
		items["sep" + n++] = "------";
		items.reset = {name: "reset contrast/bias"};
		items["sep" + n++] = "------";
		items.invert = {name: "invert colormap"};
		if( tdisp.image && tdisp.image.params.invert ){
		    items.invert.icon = "sun";
		}
		items["sep" + n++] = "------";
		items.rgb = {name: "RGB mode"};
		if( JS9.globalOpts.rgb.mode ){
		    items.rgb.icon = "sun";
		}
		return {
		    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var udisp = val;
			var uim = udisp.image;
			if( uim ){
			    uim.setColormap(key);
			}
		    });
		    },
		    events: {
			show: function(opt){
			    var udisp = that.display;
			    var uim = udisp.image;
			    var obj = {};
			    if( uim  ){
				obj.contrast = String(uim.params.contrast);
				obj.bias = String(uim.params.bias);
				obj.alpha = String(uim.params.alpha);
			    }
			    $.contextMenu.setInputValues(opt, obj);
			}, 
			hide: function(opt){
			    var obj;
			    var udisp = that.display;
			    var uim = udisp.image;
			    if( uim ){
				// if a key was pressed, do the edit
				if( opt.edited ){
				    delete opt.edited;
				    obj = $.contextMenu.getInputValues(opt);
				    editColor(uim, obj);
				}
			    }
			}
		    },
		    items: items
		};
	    }
	});
	// Region: make button open the contextMenu
	$("#regionMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#regionMenu" + that.id).contextMenu();
	});
	// define contextMenu actions
	$.contextMenu({
            selector: "#regionMenu" + that.id, 
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
            build: function($trigger, evt){
		var tdisp = getDisplays()[0];
		var tim = tdisp.image;
		var items = {
		    "regiontitle": {name: "Regions:", disabled: true},
		    "annulus": {name: "annulus"},
		    "box": {name: "box"},
		    "circle": {name: "circle"},
		    "ellipse": {name: "ellipse"},
		    "point": {name: "point"},
		    "polygon": {name: "polygon"},
		    "text": {name: "text"},
		    "sep2": "------",
		    "loadRegions" : {name: "load regions"},
		    "saveRegions" : {name: "save regions"},
		    "listRegions" : {name: "list regions"},
		    "deleteRegions" : {name: "delete regions"},
		    "listonchange" : {name: "list on change"},
		    "xeqonchange" : {name: "xeq on change"}
		};
		if( tim && tim.params.listonchange ){
		    items.listonchange.icon = "sun";
		}
		if( tim && tim.params.xeqonchange ){
		    items.xeqonchange.icon = "sun";
		}
		return {
		    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var udisp = val;
			var uim = udisp.image;
			if( uim ){
			    switch(key){
			    case "deleteRegions":
				uim.removeShapes("regions", "all");
				uim.clearMessage("regions");
				break;
			    case "loadRegions":
				JS9.OpenRegionsMenu(udisp);
				break;
			    case "saveRegions":
				uim.saveRegions("all", true);
				break;
			    case "listRegions":
				uim.listRegions("all", 2);
				break;
			    case "xeqonchange":
				uim.params.xeqonchange = !uim.params.xeqonchange;
				break;
			    case "listonchange":
				uim.params.listonchange = !uim.params.listonchange;
				break;
			    default:
				uim.addShapes("regions", key, {ireg: true});
				break;
			    }
			}
		    });
		    },
		    items: items
		};
	    }
	});
	// WCS: make button open the contextMenu
	$("#wcsMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#wcsMenu" + that.id).contextMenu();
	});
	// define contextMenu actions
	$.contextMenu({
            selector: "#wcsMenu" + that.id, 
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
            build: function($trigger, evt){
		var i, s1, s2;
		var n = 0;
		var items = {};
		var tdisp = getDisplays()[0];
		items.wcssystitle = {name: "WCS Systems:", disabled: true};
		for(i=0; i<JS9.wcssyss.length; i++){
		    s1 = JS9.wcssyss[i];
		    s2 = s1;
		    items[s1] = {name: s2};
		    if( tdisp.image && (tdisp.image.params.wcssys === s1) ){
			items[s1].icon = "sun";
		    }
		}
		items["sep" + n++] = "------";
		items.wcsutitle = {name: "WCS Units:", disabled: true};
		for(i=0; i<JS9.wcsunitss.length; i++){
		    s1 = JS9.wcsunitss[i];
		    s2 = s1;
		    items[s1] = {name: s2};
		    if( tdisp.image && (tdisp.image.params.wcsunits === s1) ){
			items[s1].icon = "sun";
		    }
		}
		return {
                    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var rexp = new RegExp(key);
			var udisp = val;
			var uim = udisp.image;
			if( uim ){
			    if( JS9.wcssyss.join("@").search(rexp) >=0 ){
				uim.setWCSSys(key);
			    } else if( JS9.wcsunitss.join("@").search(rexp) >=0 ){
				uim.setWCSUnits(key);
			    } else {
				JS9.error("unknown wcs sys/units: " + key);
			    }
			}
		    });
		    },
		    items: items
		};
	    }
	});
	// ANALYSIS: make button open the contextMenu
	$("#analysisMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#analysisMenu" + that.id).contextMenu();
	});
	// define contextMenu actions
	$.contextMenu({
            selector: "#analysisMenu" + that.id, 
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
            build: function($trigger, evt){
	        var i, j, s, apackages, atasks;
		var plugin, pinst, pname;
		var ntask = 0;
		var n = 0;
		// var m = 0;
		var items = {};
		var tdisp = getDisplays()[0];
		var im = tdisp.image;
		var lastxclass="";
		for(i=0; i<JS9.plugins.length; i++){
		    plugin = JS9.plugins[i];
		    pname = plugin.name;
		    if( plugin.opts.menuItem && 
			(plugin.opts.menu === "analysis") ){
			pinst = tdisp.pluginInstances[pname];
			if( !pinst || pinst.winHandle ){
			    if( plugin.xclass !== lastxclass ){
				items["sep" + n++] = "------";
				items["sep" + n++] = 
				    {name: plugin.xclass + " Plugins:"};
			        items["sep" + (n-1)].disabled = true;
			    }
			    lastxclass = plugin.xclass;
			    items[pname] = {
				name: plugin.opts.menuItem
			    };
			    if( pinst && (pinst.status === "active") ){
				items[pname].icon = "sun";
			    }
			    n++;
			}
		    }
		}
		if( n > 0 ){
		    items["sep" + n++] = "------";
		}
	        items.remotetitle = {
		    name: "Server-side Tasks:", 
		    disabled: true
	        };
		if( im && im.analysisPackages ){
		    apackages = im.analysisPackages;
		    // m = 0;
		    for(j=0; j<apackages.length; j++){
			atasks = apackages[j];
			for(i=0; i<atasks.length; i++){
			    if( atasks[i].hidden ){
				continue;
			    }
			    if( (atasks[i].files === "fits") &&
				!im.fitsFile ){
				continue;
			    }
			    if( (atasks[i].files === "png") &&
				im.source !== "fits2png"){
				continue;
			    }
			    s = atasks[i].title;
			    if( atasks[i].purl ){
				s += " ...";
			    }
			    items[atasks[i].name] = {
				name: s
			    };
			    ntask++;
			    // m++;
			}
			// if( (m > 0 ) && (j < (apackages.length-1)) ){
			    // items["sep" + n++] = "------";
			// }
		    }
		}
		if( !ntask ){
		    items.notasks = {
			name: "[none]", 
			disabled: true,
			events: {keyup: function(evt){return;}}
		    };
		}
		items["sep" + n++] = "------";
		items.dpath = {name: "set data path ..."};
		return {
                    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var a, did, jj, tplugin;
			var udisp = val;
			var uim = udisp.image;
			// first look for a plugin -- no image rquired
			for(jj=0; jj<JS9.plugins.length; jj++){
			    tplugin = JS9.plugins[jj];
			    if( tplugin.name === key ){
				udisp.displayPlugin(tplugin);
				return;
			    }
			}
			// the rest need an image loaded
			if( uim ){
			    switch(key){
			    case "dpath":
				// call this once window is loaded
				JS9.globalOpts.dhtmlonload = function(){
				    $('#dataPath').val(JS9.globalOpts.dataPath);
				};
				JS9.globalOpts.dhtmlloadid  = "dataPathForm";
				did = uim.displayAnalysis("dpath",
					 JS9.InstallDir(JS9.analOpts.dpathURL),
					 "Data Path for Drag and Drop");
				// save display id
				$(did).data("dispid", udisp.id);
				break;
			    default:
				// look for analysis routine
				a = uim.lookupAnalysis(key);
				if( a ){
				    // load param url to run analysis task
				    // param url is relative to js9 install dir
				    if( a.purl ){
					did = uim.displayAnalysis("params",
						  JS9.InstallDir(a.purl), 
						  a.title+": "+uim.fitsFile);
					// save info for running the task
					$(did).data("dispid", udisp.id)
				              .data("aname", a.name);
				    } else {
					// else run task directly
					uim.runAnalysis(a.name);
				    }
				}
			    }
			}
		    });
		    },
		    items: items
		};
	    }
	});
	// HELP: make button open the contextMenu
	$("#helpMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#helpMenu" + that.id).contextMenu();
	});
	// define contextMenu actions
	$.contextMenu({
            selector: "#helpMenu" + that.id, 
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
            build: function($trigger, evt){
		var key, val;
		var n=1;
		var last = "";
		var items = {};
		items.helptitle = {name: "JS9 Help:", disabled: true};
		for( key in JS9.helpOpts ){
		    if( JS9.helpOpts.hasOwnProperty(key) ){
			val = JS9.helpOpts[key];
			if( (last !== "") && (val.type !== last) ){
			    items["sep" + n++] = "------";
			    if( val.heading ){
				items["sep" + n++] = 
				    {name: val.heading + " Help:"};
			        items["sep" + (n-1)].disabled = true;
			    }
			}
			last = val.type;
			items[key] = {name: val.title};
		    }
		}
		items["sep" + n++] = "------";
		items.about = {name: "About JS9"};
		return{
		    callback: function(key, opt){
			switch(key){
			case "about":
			    alert(sprintf("JS9: image display right in your browser\nversion: %s\nprincipals: Eric Mandel (lead), Alexey Vikhlinin (science,management)\ncontact: saord@cfa.harvard.edu\n%s", JS9.VERSION, JS9.COPYRIGHT));
			    break;
			default:
			    JS9.DisplayHelp(key);
			    break;
			}
		    },
		    items: items
		};
	    }
	});
    });
};

// ---------------------------------------------------------------------
// JS9 helper to manage connection to back-end services
// ---------------------------------------------------------------------
JS9.Helper = function(){
    // assume the worst
    this.connected = false;
    this.helper = false;
    // set up initial type of helper connection
    this.type = JS9.globalOpts.helperType || "sock.io";
    // no page id yet
    this.pageid = null;
    // make the connection
    this.connect();
};

// get back-end helper connection info
JS9.Helper.prototype.connectinfo = function(){
    // no connection configured
    if( JS9.helper.connected === null ){
	return "notConfigured";
    }
    // connection configured and established
    if( JS9.helper.connected ){
	var s = sprintf("connected %s %s", JS9.helper.type, JS9.helper.url);
	if( JS9.helper.pageid ){
	    s += "<p>" + JS9.helper.pageid;
	}
	return s;
    }
    // connection configured but not established
    return sprintf("notConnected %s", JS9.helper.type);
};

// connect to back-end helper
JS9.Helper.prototype.connect = function(type){
    var that = this;
    // might be establishing a new type
    if( type ){
	this.type = type;
    }
    // close off previous socket connection, if necessary
    if( this.socket ){
	try{this.socket.disconnect();}
	catch(e){JS9.log("warning: can't disconnect from socket");}
	this.socket = null;
    }
    // base of helper url is either specified, same as current domain, or local
    if( JS9.globalOpts.helperURL ){
	if( JS9.globalOpts.helperURL.search(/:\/\//) >=0 ){
	    this.url = JS9.globalOpts.helperURL;
	} else {
	    this.url = JS9.globalOpts.helperProtocol + JS9.globalOpts.helperURL;
	}
    } else if( document.domain ){
	this.url = JS9.globalOpts.helperProtocol + document.domain;
    } else {
	this.url = JS9.globalOpts.helperProtocol + "localhost";
    }
    // try to establish connection, based on connection type
    switch(this.type){
    case "none":
        this.connected = null;
	JS9.Preload(true);
        break;
    case "get":
    case "post":
	// sanity check
	if( !JS9.globalOpts.helperCGI ){
	    JS9.error("cgi script name missing for helper");
	}
	this.url += "/" + JS9.globalOpts.helperCGI;
	this.connected = true;
	this.helper = true;
        if( JS9.DEBUG ){
	    JS9.log("JS9 helper: connect: " + this.type);
        }
	JS9.Preload(true);
	break;
    case "sock.io":
    case "nodejs":
	if( !JS9.globalOpts.helperPort ){
	    JS9.error("port missing for helper");
	}
	this.url += ":" +  JS9.globalOpts.helperPort;
	this.sockurl = this.url + "/socket.io/socket.io.js";
	// connect to helper
	$.ajax({
	    url: this.sockurl,
	    dataType: "script",
	    success:  function(data, textStatus, jqXHR){
		var ii, d;
		that.socket = io.connect(that.url);
		that.socket.on("connect", function(){
		    that.connected = true;
		    that.helper = true;
		    d = [];
		    for(ii=0; ii<JS9.displays.length; ii++){
			d.push(JS9.displays[ii].id);
		    }
		    that.socket.emit("displays", {displays: d}, function(pid){
			that.pageid = pid;
		    });
		    JS9.Preload(true);
		    if( JS9.DEBUG ){
			JS9.log("JS9 helper: connect: " + that.type);
		    }
		});
		that.socket.on("disconnect", function(){
		    that.connected = false;
		    that.helper = false;
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: disconnect");
		    }
		});
		that.socket.on("reconnect", function(){
		    that.connected = true;
		    that.helper = true;
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: reconnect");
		    }
		});
		that.socket.on("msg", function(msg, mcb){
		    var obj, tdisp, res;
		    var args = [];
		    var cmd = msg.cmd;
		    var id = msg.id;
		    // turn off alerts
		    JS9.globalOpts.alerts = false;
		    // look for a public API call
		    if( JS9.publics[cmd] ){
			// check for non-array first argument
			if( !$.isArray(msg.args) ){
			    msg.args = [msg.args];
			}
			// deep copy of arg array
			args = $.extend(true, [], msg.args);
			// make up display object
			if( id ){
			    args.push({display: id});
			}
			// call public API
			try{ res = JS9.publics[cmd].apply(null, args); }
			catch(e){ res = sprintf("ERROR: %s", e.message); }
			if( mcb ){
			    mcb(res);
			}
			JS9.globalOpts.alerts = true;
			return;
		    }
		    // skip blank lines and comments
		    if( !cmd || (cmd === "#") ){
			if( mcb ){
			    mcb("");
			}
			JS9.globalOpts.alerts = true;
			return;
		    }
		    // get command and display
		    obj = JS9.lookupCommand(cmd);
		    tdisp = JS9.lookupDisplay(id);
		    if( obj && tdisp ){
			obj.getDisplayInfo(tdisp);
			if( msg.args ){
			    // deep copy of arg array
			    args = $.extend(true, [], msg.args);
			} else if( msg.paramlist ){
			    args = msg.paramlist.split(/ +/);
			}
			switch(obj.getWhich(args)){
			case "get":
			    // execute get call
			    try{
				res = obj.get(args) || "";
			    }
			    catch(e){
				res = "ERROR: " + e.message;
			    }
			    break;
			case "set":
			    // execute set call
			    try{
				res = obj.set(args) || "OK";
			    }
			    catch(e){
				res = "ERROR: " + e.message;
			    }
			    break;
			default:
			    res = sprintf("ERROR: unknown cmd type for '%s'", 
					  cmd);
			}
		    } else {
			if( !obj ){
			    res = sprintf("ERROR: unknown cmd '%s'", cmd);
			}
			if( !tdisp ){
			    res = sprintf("ERROR: unknown display (%s)", id);
			}
		    }
		    // turn on alerts
		    JS9.globalOpts.alerts = true;
		    // message callback, if necessary
		    if( mcb ){
			mcb(res);
		    }
		});
	    },
	    error:  function(jqXHR, textStatus, errorThrown){
		if( JS9.DEBUG ){
	            JS9.log("JS9 helper: connect failure: " + 
			    textStatus + " " + errorThrown);
		}
	    }
	});
	break;
    default:
	JS9.error("unknown helper type: "+this.type);
	break;
    }
};

// send request to back-end helper
JS9.Helper.prototype.send = function(key, obj, cb){
    // sanity check
    if( !this.connected ){
	return null;
    }
    // add cookie value
    // add dataPath, if available (but always look in the helper directory)
    if( obj && (typeof obj === "object") ){
	obj.cookie = document.cookie;
	if( JS9.globalOpts.dataPath && !obj.dataPath ){
	    obj.dataPath = JS9.globalOpts.dataPath + ":.";
	}
    } else {
	obj = {dataPath: "."};
    }
    // add path that gets us to the js9 root
    if( JS9.TOROOT ){
	obj.dataPath += (":" + JS9.TOROOT);
    }
    // tell server how to get to root (for datapath)
    // send message, based on connection type
    switch(this.type){
    case "get":
    case "post":
	obj.key = key;
	$.ajax({
	    url: this.url,
	    type: this.type.toUpperCase(),
	    data: obj,
	    dataType: "text",
	    success:  function(data, textStatus, jqXHR){
		if( typeof data === "string" &&
		    data.search(JS9.analOpts.epattern) >=0 ){
		    JS9.log(data);
		}
		if( cb ){
		    cb(data);
		}
	    },
	    error:  function(jqXHR, textStatus, errorThrown){
		if( JS9.DEBUG ){
	            JS9.log("JS9 helper: "+this.type+" failure: " + 
			    textStatus + " " + errorThrown);
		}
	    }
	});
	break;
    case "sock.io":
    case "nodejs":
	JS9.helper.socket.emit(key, obj, cb);
	break;
    }
    // allow chaining
    return this;
};

// ---------------------------------------------------------------------
// Graphics support using fabric.js
//
// Fabric object defines graphical primitives
// ---------------------------------------------------------------------

// fabric sub-object to hold fabric routines
JS9.Fabric = {};

// extra fabric elements to save when switching between images

JS9.Fabric.elements = ["cornerSize", "cornerColor", "borderColor", 
		       "transparentCorners", "selectionLineWidth",
		       "centeredScaling", "hasControls", "hasRotatingPoint",
		       "hasBorders", "params", "pub"];

// global options for all shapes
JS9.Fabric.opts = {
    // default fabric.js options
    originX: "center",
    originY: "center",
    strokeWidth: 2,
    cornerSize: 8 * (fabric.isTouchSupported ? 2 : 1),
    transparentCorners: false,
    selectionLineWidth: 2,
    centeredScaling: true,
    selectable: true,
    // skipOffset to preserve polygon positional accuracy
    skipOffset: true,
    // minimize the jump when first resizing a region
    padding: 0,
    canvas: {
	selection: true,
	zindex: JS9.SHAPEZINDEX
    },
    fill: "transparent"
};

// rescale the width of shapes in the shape layers
JS9.Fabric.rescaleStrokeWidth = function(scale, sw1){
    var tscale = ((this.scaleX + this.scaleY) / 2);
    scale = scale || 1;
    scale *= tscale;
    if( !sw1 && this.params ){
	sw1 = this.params.sw1;
    }
    if( this.type === "group" ){
	this.forEachObject(function(obj){
	    JS9.Fabric.rescaleStrokeWidth.call(obj, scale, sw1);
	});
    } else {
	this.setStrokeWidth(sw1 / scale);
    }
};

// ensure that the circle scales the same in X and Y
JS9.Fabric.rescaleEvenly = function(){
    var lastscale;
    if( !this.params || (this.scaleX === this.scaleY) ){
	return;
    }
    switch(this.params.shape){
    case "annulus":
    case "circle":
	lastscale = this.params.lastscale || 1;
	if( this.scaleX !== lastscale ){
	    this.scaleY = this.scaleX;
	} else if( this.scaleY !== lastscale ){
	    this.scaleX = this.scaleY;
	}
	this.params.lastscale = this.scaleX;
	break;
    }
};

// add to fabric object prototype
fabric.Object.prototype.rescaleBorder = JS9.Fabric.rescaleStrokeWidth;
fabric.Object.prototype.rescaleEvenly = JS9.Fabric.rescaleEvenly;

// ---------------------------------------------------------------------
// Shape prototype additions to JS9 Display class
// ---------------------------------------------------------------------

// create a new shape layer in the display
// call using display context
JS9.Fabric.newShapeLayer = function(layerName, layerOpts, divjq){
    var id, dlayer;
    var display = this;
    // sanity check
    if( !display || !layerName ){
	return;
    }
    // only do this once
    if( display.layers[layerName] ){
	return display.layers[layerName];
    }
    // create the new display layer
    display.layers[layerName] = {};
    // convenience variable(s)
    dlayer = display.layers[layerName];
    // usual place to save parameters
    dlayer.params = [];
    // no last selected yet
    dlayer.params.sel = null;
    // no last selected layer yet
    dlayer.params.sellayer = null;
    // where to attach the graphics canvas
    if( divjq ){
	dlayer.dtype = "other";
    } else {
	dlayer.dtype = "main";
	divjq = display.divjq;
    }
    // id
    id = divjq.attr("id") + "-" + layerName.replace(/\s+/,"_") + "-shapeLayer";
    // backlink
    dlayer.display = display;
    // default options for this layer (deep copy)
    dlayer.opts = $.extend(true, {}, layerOpts);
    // and some needed properties
    dlayer.opts.canvas = dlayer.opts.canvas || {};
    dlayer.opts.canvas.selection = dlayer.opts.canvas.selection || true;
    dlayer.opts.canvas.zindex = dlayer.opts.canvas.zindex || JS9.SHAPEZINDEX;
    // additional fabric elements to save using toJSON
    dlayer.el = JS9.Fabric.elements;
    // create container div and append to target
    // start with low zindex, until we add shapes
    dlayer.divjq = $("<div>")
	.addClass("JS9Container")
	.css("z-index", 0)
	.appendTo(divjq);
    // create canvas element and append to container
    dlayer.canvasjq = $("<canvas>")
        .addClass("JS9Layer")
	.attr("id", id)
	.attr("width", divjq.css("width"))
	.attr("height", divjq.css("height"))
	.appendTo(dlayer.divjq);
    // new fabric canvas associated with this HTML canvas
    dlayer.canvas = new fabric.Canvas(dlayer.canvasjq[0]);
    // don't render on add or remove of objects (do it manually)
    dlayer.canvas.renderOnAddRemove = false;
    // allow selectable objects?
    dlayer.canvas.selection = dlayer.opts.canvas.selection;
    // mouse down processing
    dlayer.canvas.on("mouse:down", function(opts){
	var obj, im, curtime, dblclick;
	if( opts.target && dlayer.display.image ){
	    obj = opts.target;
	    im = dlayer.display.image;
	    // look for double click
	    // fabric dblclick support is broken (loses position during scroll)
	    if( !JS9.specialKey(opts.e) ){
		if( obj.params ){
		    curtime = (new Date()).getTime();
		    if( obj.params.lasttime ){
			if( (curtime - obj.params.lasttime) < JS9.DBLCLICK ){
			    dblclick = true;
			}
		    }
		    obj.params.lasttime = curtime;
		}
	    }
	    if( dblclick ){
		if( !obj.params.winid ){
		    // call this once window is loaded
		    JS9.globalOpts.dhtmlonload = function(){
			if( obj.pub ){
			    JS9.Regions.initConfigForm.call(im, obj);
			}
		    };
		    JS9.globalOpts.dhtmlloadid  = "regionsConfigForm";
		    obj.params.winid = im.displayAnalysis("params",
			  JS9.InstallDir(JS9.Regions.opts.configURL),
			  "Region Configuration");
		}
		return;
	    }
	    // on main window, set region click
	    if( dlayer.dtype === "main" ){
		im.rclick = 1;
	    }
	    // add polygon points
	    if( JS9.specialKey(opts.e) ){
		if( opts.target.type === "polygon" ){
		    JS9.Fabric.addPolygonPoint.call(im, layerName,
						    opts.target, opts.e);
		    JS9.Fabric._updateShape.call(im, layerName, opts.target,
						 null, "update");
		} else if( opts.target.polyparams ){
		    JS9.Fabric.removePolygonPoint.call(im, layerName,
						       opts.target, opts.e);
		    JS9.Fabric._updateShape.call(im, layerName, 
						 opts.target.polyparams.polygon,
						 null, "update");
		}
	    }
	} else {
	    // only allow fabric selection if we have special key down
	    this._selection = this.selection;
	    if( this.selection ){
		this.selection = JS9.specialKey(opts.e);
	    }
	}
    });
    // mouse up processing
    dlayer.canvas.on("mouse:up", function(opts){
	var i;
	var objs = [];
	if( dlayer.display.image ){
	    // one active object
	    if( this.getActiveObject() ){
		objs.push(this.getActiveObject());
	    }
	    // group of active objects
	    if( this.getActiveGroup() ){
		objs = this.getActiveGroup().getObjects();
	    }
	    // process all active objects
	    for(i=0; i<objs.length; i++){
		if( objs[i].polyparams ){
		    dlayer.canvas.setActiveObject(objs[i].polyparams.polygon);
		}
	    }
	}
	// restore original selection state
	this.selection = this._selection || this.selection;
    });
    // object scaled: reset stroke width
    dlayer.canvas.on('object:scaling', function (opts){
	opts.target.rescaleEvenly();
	opts.target.rescaleBorder();
    });
    // object selected: add anchors to polygon
    dlayer.canvas.on('object:selected', function (opts){
	// file the selection cleared event, if necesssary
	if( dlayer.params.sel && opts.target.params &&
	    (dlayer.params.sel !== opts.target) ){
	    dlayer.canvas.fire('before:selection:cleared', 
			       {target: dlayer.params.sel});
	}
	// selection processing
	switch(opts.target.type){
	case "polygon":
	    JS9.Fabric.addPolygonAnchors(dlayer, opts.target);
	    dlayer.canvas.renderAll();
	    break;
	}
	// set currently selected shape
	if( opts.target.polyparams ){
	    dlayer.params.sel = opts.target.polyparams.polygon;
	} else if( opts.target.params ){
	    dlayer.params.sel = opts.target;
	}
	// and currently selected layer
	if( dlayer.display.image ){
	    dlayer.display.image.layer = layerName;
	}
    });
    // object selection cleared: remove anchors from polygon
    dlayer.canvas.on('before:selection:cleared', function (opts){
	// reset currently selected
	dlayer.params.sel = null;
	// also reset current layer in the image
	if( dlayer.display.image ){
	    dlayer.display.image.layer = null;
	}
	// selection cleared processing
	switch(opts.target.type){
	case "polygon":
	    JS9.Fabric.removePolygonAnchors(dlayer, opts.target);
	    dlayer.canvas.renderAll();
	    break;
	}
    });
    // if canvas moves (e.g. light window), calcOffset must be called ...
    // there is no good cross-browser way to track an element changing, 
    // (advice is to set a timer!) so we just check when the mouse enters the
    // div, because that is when the user will interact with some shape
    // only do this if we are in a light window
    if( dlayer.divjq.closest(JS9.lightOpts[JS9.LIGHTWIN].drag).length ){
	if( fabric.isTouchSupported ){
	    dlayer.divjq.on("touchstart", 
			    function(){dlayer.canvas.calcOffset();});
	} else {
	    dlayer.divjq.on("mouseenter",
			    function(){dlayer.canvas.calcOffset();});
	}
    }
    return dlayer;
};

// ---------------------------------------------------------------------------
// Shape prototype additions to JS9 Image class
// ---------------------------------------------------------------------------

// if mode is true, layer is displayed, otherwise hidden
// call using image context
JS9.Fabric.showShapeLayer = function(layerName, mode){
    var that = this;
    var s;
    var layer, dlayer, canvas;
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer ){
	return;
    }
    canvas = layer.canvas;
    dlayer = this.display.layers[layerName];
    if( (mode === "show") || (mode === true) ){
	if( mode === "show" ){
	    layer.show = true;
	}
	// show
	if( layer.json && layer.show ){
	    canvas.loadFromJSON(layer.json, function(){
		var key, zindex, tdlayer, obj;
		canvas.renderAll();
		canvas.selection = layer.opts.canvas.selection;
		zindex = dlayer.opts.canvas.zindex;
		dlayer.divjq.css("z-index", zindex);
		// unselect selected objects in lower-zindex groups
		for( key in that.layers ){
		    if( that.layers.hasOwnProperty(key) ){
			if( (layerName !== key) && that.layers[key].show ){
			    tdlayer = that.display.layers[key];
			    if( tdlayer.divjq.css("z-index") < zindex ){
				obj = tdlayer.canvas.getActiveObject();
				if( obj ){
				    JS9.Fabric.removePolygonAnchors(tdlayer,
								    obj);
				    tdlayer.canvas.discardActiveObject();
				}
			    }
			}
		    }
		}
		layer.json = null;
	    });
	}
    } else if( (mode === "hide") || (mode === false) ){
	// save and hide
	if( layer.show ){
	    canvas.forEachObject(function(obj){
		JS9.Fabric.removePolygonAnchors(dlayer, obj);
		if( obj.params && obj.params.winid ){
		    obj.params.winid.close();
		    obj.params.winid = null;
		}
	    });
	    s = canvas.toJSON(layer.dlayer.el);
	    layer.json = JSON.stringify(s);
	    canvas.selection = false;
	    // push to bottom of the pile
	    dlayer.divjq.css("z-index", 0);
	    canvas.clear();
	}
	if( mode === "hide" ){
	    layer.show = false;
	}
    }
    return this;
};

// display all layers for the current image (save previous)
// call using image context
JS9.Fabric.displayShapeLayers = function(){
    var key;
    // if prev and cur are the same, just exit
    if( this === this.display.image ){
	return;
    }
    // this.display.image still points to the previously loaded image
    // save old layers
    if( this.display.image && this.display.image.layers ){
	for( key in this.display.image.layers ){
	    if( this.display.image.layers.hasOwnProperty(key) ){
		this.display.image.showShapeLayer(key, false);
	    }
	}
    }
    // "this" points to the current image: display new layers
    if( this.layers ){
	for( key in this.layers ){
	    if( this.layers.hasOwnProperty(key) ){
		this.showShapeLayer(key, true);
	    }
	}
    }
};

// retrieve (and initialize, if necessary) a shape layer
// call using image context
JS9.Fabric.getShapeLayer = function(layerName, opts){
    var dlayer, layer;
    // sanity check
    if( !layerName ){
	return null;
    }
    layer = this.layers[layerName];
    // create new layer, if necessary
    if( !layer ){
        // check for display layer, which is required
	dlayer = this.display.layers[layerName];
	if( !dlayer ){
	   return null;
	}
	// make a new image display layer
	this.layers[layerName] = {};
	// create new layer for this image
	layer = this.layers[layerName];
	// assume that we show this layer
	layer.show = true;
	// no shapes yet
	layer.nshape = 0;
	// backlink to display layer
	layer.dlayer = dlayer;
	// convenient link back to opts
	layer.opts = layer.dlayer.opts;
	// convenient link back to canvas
	layer.canvas = layer.dlayer.canvas;
	// recalculate offset -- why is this necessary??
	layer.canvas.calcOffset();
    }
    // return layer
    return layer;
};

// process options, separating into fabric opts and paramsJ
// call using image context
JS9.Fabric._parseShapeOptions = function(layerName, opts, obj){
    var i, j, tags, pos, cpos, len, zoom, bin, zfactor;
    var key, shape, radinc, nrad, radius, tf, arr;
    var nopts = {}, nparams = {};
    var YFUDGE = 1;
    // is image zoom part of scale?
    if( this.display.layers[layerName].dtype === "main" ){
	zoom = this.primary.sect.zoom;
    } else {
	zoom = 1;
    }
    if( this.display.layers[layerName].dtype === "main" ){
	bin = this.binning.bin || 1;
    } else {
	bin = 1;
    }
    // combined zoom/bin factor
    zfactor = zoom / bin;
    // get color for a given shape tag
    var tagColor = function(tags, tagcolors, obj){
	var tkey, ctags, color;
	tagcolors = tagcolors || {};
	// look through the color keys for exact match
	for( tkey in tagcolors ){
	    // but make sure its a real property
	    if( tagcolors.hasOwnProperty(tkey) ){
		ctags = tkey.split("_");
		// see if all elements match
		if( $(tags).not(ctags).length === 0 && 
		    $(ctags).not(tags).length === 0 ){
		    color = tagcolors[tkey];
		    break;
		}
	    }
	}
	// look through color keys for subset match
	if( !color ){
	    for( tkey in tagcolors ){
		// but make sure its a real property
		if( tagcolors.hasOwnProperty(tkey) ){
		    ctags = tkey.split("_");
		    if( $(tags).not(ctags).length === 0 ){
			color = tagcolors[tkey];
			break;
		    }
		}
	    }
	}
	// look through color keys for superset match
	if( !color ){
	    for( tkey in tagcolors ){
		// but make sure its a real property
		if( tagcolors.hasOwnProperty(tkey) ){
		    ctags = tkey.split("_");
		    if( $(ctags).not(tags).length === 0 ){
			color = tagcolors[tkey];
			break;
		    }
		}
	    }
	}
	// final attempt: use existing object's color or a default color
	color = color || (obj && obj.get("stroke")) || 
	        tagcolors.defcolor || JS9.globalOpts.defcolor || "#000000";
	return color;
    };
    // remove means nothing else matters
    if( opts.remove ){
	return {remove: true};
    }
    // initialize
    nparams.tags = [];
    // pre-processing special keys
    if( opts.tags ){
	if( typeof opts.tags === "string" ){
	    tags = opts.tags.toLowerCase().split(",");
	    // modes: source, background, include, exclude, etc
	    for(i=0; i<tags.length; i++){
		nparams.tags[i] = tags[i].trim();
	    }
	} else if( $.isArray(opts.tags) ){
	    for(i=0; i<opts.tags.length; i++){
		nparams.tags[i] = opts.tags[i].trim();
	    }
	}
    }
    // fabric angle is in opposite direction
    if( (opts.angle !== undefined) ){
	nopts.angle = -opts.angle;
    }
    //  x and y are image coords, convert to display coords
    if( (opts.x !== undefined) && (opts.y !== undefined) ){
	pos = this.imageToDisplayPos(opts);
	nopts.left = pos.x;
	nopts.top = pos.y;
    }
    //  look for primitives
    if( (opts.left !== undefined) ){
	nopts.left = opts.left;
    }
    if( (opts.top !== undefined) ){
	nopts.top = opts.top;
    }
    // last gasp
    if( nopts.left === undefined ){
	if( obj && (obj.left !== undefined) ){
	    nopts.left = obj.left;
	} else {
	    nopts.left = this.display.canvasjq.attr("width") / 2 - 1;
	}
    }
    if( nopts.top === undefined ){
	if( obj && (obj.top !== undefined) ){
	    nopts.top = obj.top;
	} else {
	    // why is this fudge needed?
	    nopts.top =  this.display.canvasjq.attr("height") / 2 - 1 + YFUDGE;
	}
    }
    // relative movement requires opts left/top or an existing object
    if( opts.dx ){
	nopts.left += opts.dx;
    }
    if( opts.dy ){
	nopts.top -= opts.dy;
    }
    // shape-specific processing
    switch(opts.shape){
    case "annulus":
	nparams.radii = [];
	if( opts.radii !== undefined ){
	    if( typeof opts.radii === "string" ){
		nparams.radii = opts.radii.replace(/ /g, "").split(",");
		for(i=0, j=0; i<nparams.radii.length; i++){
		    if( nparams.radii[i] !== "" ){
			nparams.radii[j++] = parseInt(nparams.radii[i], 10);
		    }
		}
	    } else {
		nparams.radii = opts.radii;
	    }
	} else {
	    if( opts.ireg && JS9.SCALEIREG ){
		if( opts.iradius ){
		    opts.iradius /= zfactor;
		}
		if( opts.oradius ){
		    opts.oradius /= zfactor;
		}
	    }
	    radinc = (opts.oradius - opts.iradius) / opts.nannuli;
	    nrad = opts.nannuli + 1;
	    for(i=0; i<nrad; i++){
		radius = opts.iradius + (radinc * i);
		nparams.radii.push(radius);
	    }
	}
	break;
    case "box":
	if( opts.ireg && JS9.SCALEIREG ){
	    if( opts.width ){
		opts.width /= zfactor;
	    }
	    if( opts.height ){
		opts.height /= zfactor;
	    }
	}
	break;
    case "circle":
	if( opts.ireg && JS9.SCALEIREG ){
	    if( opts.radius ){
		opts.radius /= zfactor;
	    }
	}
	break;
    case "ellipse":
	if( opts.ireg && JS9.SCALEIREG ){
	    if( opts.r1 ){
		opts.r1 /= zfactor;
	    }
	    if( opts.r2 ){
		opts.r2 /= zfactor;
	    }
	}
	break;
    case "point":
	switch(opts.ptshape){
	case "box":
	    opts.width = opts.ptsize * 2;
	    opts.height = opts.ptsize * 2;
	    break;
	case "circle":
	    opts.radius = opts.ptsize;
	    break;
	case "ellipse":
	    opts.rx = opts.ptsize;
	    opts.ry = opts.ptsize / 2;
	    break;
	}
	opts.lockRotation = true;
	opts.lockScalingX = true;
	opts.lockScalingY = true;
	opts.hasControls = false;
	opts.hasRotatingPoint = false;
	opts.hasBorders = true;
	break;
    case "polygon":
	if( opts.pts && opts.pts.length ){
	    if( typeof opts.pts === "string" ){
		arr = opts.pts.replace(/ /g, "").split(",");
		len = arr.length;
		if( typeof arr[0] === "string" ){
		    for(i=0; i<len; i++){
			arr[i] = parseFloat(arr[i]);
		    }
		}
		opts.pts = [];
		for(i=0, j=0; i<len; i+=2, j++){
		    opts.pts[j] = {x: arr[i], y: arr[i+1]};
		}
	    }
	    // convert all points from image pos to display pos
	    len = opts.pts.length;
	    for(i=0; i<len; i++){
		opts.pts[i] = this.imageToDisplayPos(opts.pts[i]);
	    }
	    // centroid of polygon from display points
	    if( opts.left && opts.top ){
		cpos = {x: opts.left, y: opts.top};
	    } else {
		cpos = JS9.centroidPolygon(opts.pts);
		// this is the center point
		nopts.left = cpos.x;
		nopts.top = cpos.y;
	    }
	    // convert points from display pos to offsets from center pos
	    // overwrite any old points array
	    opts.points = [];
	    for(i=0; i<len; i++){
		pos = {x: (opts.pts[i].x - cpos.x) / zoom, 
		       y: (opts.pts[i].y - cpos.y) / zoom};
		opts.points.push(pos);
	    }
	}
	if( opts.ireg && JS9.SCALEIREG ){
	    len = opts.points.length;
	    for(i=0; i<len; i++){
		opts.points[i].x /= zfactor;
		opts.points[i].y /= zfactor;
	    }
	}
	break;
    case "text":
	break;
    }
    // separate opts and params
    for( key in opts ){
	if( opts.hasOwnProperty(key) ){
	    switch(key){
	    case "tags":
	    case "x":
	    case "y":
	    case "dx":
	    case "dy":
	    case "pts":
	    case "left":
	    case "top":
	    case "angle":
	    case "radii":
	    case "ireg":
		break;
	    case "type":
	    case "originX":
	    case "originY":
	    // case "top":
	    // case "left":
	    case "width":
	    case "height":
	    case "scaleX":
	    case "scaleY":
	    case "flipX":
	    case "flipY":
	    case "opacity":
	    case "cornerSize":
	    case "transparentCorners":
	    case "hoverCursor":
	    case "padding":
	    case "borderColor":
	    case "cornerColor":
	    case "centeredScaling":
	    case "centeredRotation":
	    case "fill":
	    case "fillRule":
	    case "backgroundColor":
	    case "stroke":
	    case "strokeWidth":
	    case "strokeDashArray":
	    case "strokeLineCap":
	    case "strokeLineJoin":
	    case "strokeMiterLimit":
	    case "shadow":
	    case "borderOpacityWhenMoving":
	    case "borderScaleFactor":
	    case "transformMatrix":
	    case "minScaleLimit":
	    case "selectable":
	    case "evented":
	    case "visible":
	    case "hasControls":
	    case "hasBorders":
	    case "hasRotatingPoint":
	    case "rotatingPointOffset":
	    case "perPixelTargetFind":
	    case "includeDefaultValues":
	    case "clipTo":
	    case "lockMovementX":
	    case "lockMovementY":
	    case "lockRotation":
	    case "lockScalingX":
	    case "lockScalingY":
	    case "lockUniScaling":
	    case "radius":
	    case "rx":
	    case "ry":
	    case "points":
	    case "selectionLineWidth":
	    case "fontFamily":
	    case "fontSize":
	    case "fontStyle":
	    case "fontWeight":
	    case "text":
	    case "textDecoration":
	    case "textAlign":
	    case "lineHeight":
	    case "textBackgroundColor":
		nopts[key] = opts[key];
		break;
	    case "shape":
		shape = opts[key];
		break;
	    default:
		nparams[key] = opts[key];
		break;
	    }
	}
    }
    // finalize some properties
    nopts.stroke = nparams.color || 
	           tagColor(nparams.tags, nparams.tagcolors, obj);
    nopts.selectColor = nopts.stroke;
    nopts.cornerColor = nopts.stroke;
    nopts.borderColor = nopts.stroke;
    if( nparams.fixinplace !== undefined ){
	tf = nparams.fixinplace;
	if( nopts.lockMovementX === undefined ){
	    nopts.lockMovementX = tf;
	}
	if( nopts.lockMovementY === undefined ){
	    nopts.lockMovementY = tf;
	}
	if( nopts.lockRotation === undefined ){
	    nopts.lockRotation = tf;
	}
	if( nopts.lockScalingX === undefined ){
	    nopts.lockScalingX = tf;
	}
	if( nopts.lockScalingY === undefined ){
	    nopts.lockScalingY = tf;
	}
	if( nopts.hasControls === undefined ){
	    nopts.hasControls = !tf;
	}
	if( nopts.hasRotatingPoint === undefined ){
	    nopts.hasRotatingPoint = !tf;
	}
	if( nopts.hasBorders === undefined ){
	    nopts.hasBorders = !tf;
	}
    }
    // return shape, opts and params
    return {shape: shape, opts: nopts, params: nparams};
};

// add shapes to a layer
// call using image context
JS9.Fabric.addShapes = function(layerName, shape, opts){
    var i, sobj, sarr, ns, s, bopts, myopts;
    var layer, canvas, dlayer, zoom, bin;
    var ttop, tleft, rarr=[];
    var params = {};
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer || !layer.show ){
	return;
    }
    canvas = layer.canvas;
    // is image zoom part of scale?
    if( this.display.layers[layerName].dtype === "main" ){
	zoom = this.primary.sect.zoom;
	bin = this.binning.bin || 1;
    } else {
	zoom = 1;
	bin = 1;
    }
    // figure out the first argument
    if( typeof shape === "string" ){
	// look for a region string
	s = this.parseRegions(shape);
	if( typeof s === "string" ){
	    // nope, normal shape string
	    sarr = [{shape: s}];
	} else {
	    // parsed array of shape objects from regions string
	    sarr = s;
	}
    } else if( $.isArray(shape) ){
	sarr = shape;
    } else if( typeof shape === "object" ){
	sarr = [shape];
    } else {
	return;
    }
    // opts can be an object or a string
    if( typeof opts === "string" ){
	try{ myopts = JSON.parse(opts); }
	catch(e){
	    JS9.error("can't parse shape opts: " + opts, e);
	    return null;
	}
    } else {
	myopts = opts;
    }
    // once a shape has been added, we can set the zindex to process events
    if( !canvas.size() ){
	dlayer = this.display.layers[layerName];
	if( layerName === "regions" ){
	    dlayer.opts.canvas.zindex++;
	}
	dlayer.divjq.css("z-index", dlayer.opts.canvas.zindex);
    }
    // baseline opts
    bopts = $.extend(true, {}, JS9.Fabric.opts, layer.opts, myopts);
    // process each shape object
    for(ns=0; ns < sarr.length; ns++){
	// combine baseline opts with this shapes's opts
	opts = $.extend(true, {}, bopts, sarr[ns]);
	// parse options and generate opts and params objects
	sobj = JS9.Fabric._parseShapeOptions.call(this, layerName, opts);
	// remove means remove previous shapes
	if( sobj.remove ){
	    this.removeShapes(layerName, "all");
	    continue;
	}
	// sanity check
	if( !sobj.shape ){
	    continue;
	}
	// convenience variables
	opts = sobj.opts;
	params = sobj.params;
	// id for this shape
	params.id = ++layer.nshape;
	switch(sobj.shape){
	case "annulus":
	    // save shape
	    params.shape = "annulus";
	    // save group position
	    ttop = opts.top;
	    tleft = opts.left;
	    // individual radii in the group are at 0,0
	    opts.top = 0;
	    opts.left = 0;
	    if( params.radii ){
		for(i=0; i<params.radii.length; i++){
		    opts.radius = params.radii[i];
		    rarr.push(new fabric.Circle(opts));
		}
	    }
	    opts.top = ttop;
	    opts.left = tleft;
	    opts.width = opts.radius * 2;
	    opts.height = opts.radius * 2;
	    s = new fabric.Group(rarr, opts);
	    break;
	case "box":
	    // save shape
	    params.shape = "box";
	    s = new fabric.Rect(opts);
	    break;
	case "circle":
	    // save shape
	    params.shape = "circle";
	    s = new fabric.Circle(opts);
	    break;
	case "ellipse":
	    // save shape
	    params.shape = "ellipse";
	    opts.rx = params.r1;
	    opts.ry = params.r2;
	    s = new fabric.Ellipse(opts);
	    break;
	case "point":
	    // save shape
	    params.shape = "point";
	    switch(params.ptshape){
	    case "box":
		s = new fabric.Rect(opts);
		break;
	    case "circle":
		s = new fabric.Circle(opts);
		break;
	    case "ellipse":
		s = new fabric.Ellipse(opts);
		break;
	    default:
		s = new fabric.Rect(opts);
		break;
	    }
	    break;
	case "polygon":
	    // save shape
	    params.shape = "polygon";
	    s = new fabric.Polygon(opts.points, opts, params.skipOffset);
	    break;
	case "text":
	    // save shape
	    params.shape = "text";
	    params.text = opts.text || "Double-click to add text here";
	    if( window.hasOwnProperty("fabric") ){
		if( !myopts || !myopts.strokeWidth ){
		    if( fabric.version === "1.4.0" ){
			opts.strokeWidth = 0;
		    } else {
			opts.strokeWidth = 1;
		    }
		}
	    }
	    s = new fabric.Text(params.text, opts);
	    break;
	default:
	    JS9.error("unknown shape: "+sobj.shape);
	    break;
	}
	// add new shape to canvas
	canvas.add(s);
	// backlink to layer name
	params.layerName = layerName;
	// save original strokeWidth for zooming
	params.sw1 = s.strokeWidth;
	// initalize
	params.listonchange = false;
	// breaks panner, magnifier
	// params.fixinplace = false;
	// save custom attributes in the params object
	// s.set("params", params);
	s.params = params;
	// set scaling based on zoom factor
	if( layer.opts.panzoom ){
	    switch(params.shape){
	    case "point":
	    case "text":
		break;
	    default:
		s.scale(zoom/bin);
		break;
	    }
	}
	// and then rescale the stroke width
	s.rescaleBorder();
	// update the shape info
	JS9.Fabric._updateShape.call(this, layerName, s, null, "add", params);
    }
    // redraw (unless explicitly specified otherwise)
    if( (params.redraw === undefined) || params.redraw ){
	canvas.renderAll();
    }
    // return shape id
    return params.id;
};

// select a one of more shapes by id or tag and execute a callback
// call using image context
JS9.Fabric.selectShapes = function(layerName, id, cb){
    var i, group, ginfo, shape, sobj;
    var that = this;
    var canvas;
    // sanity check
    if( !this.layers || !layerName || !this.layers[layerName] ){
	return null;
    }
    // no id means "all"
    id = id || "all";
    // convenience variable(s)
    canvas = this.layers[layerName].canvas;
    // see if we have an active group
    group = canvas.getActiveGroup();
    ginfo = {group: null};
    // select on the id
    switch( typeof id ){
    case "object":
	if( id.params ){
            if( group && group.contains(id) ){
	        ginfo.group = group;
	    } else {
		ginfo.group = null;
	    }
	    // specific shape
	    cb.call(that, id, ginfo);
	}
	break;
    case "number":
	canvas.forEachObject(function(obj){
	    if( obj.params && (id === obj.params.id) ){
		if( group && group.contains(obj) ){
		    ginfo.group = group;
		} else {
		    ginfo.group = null;
		}
		cb.call(that, obj, ginfo);
	    }
	});
	break;
    case "string":
	// string id can be a region tag, color, or tag
	// convert region name to graphics subsystem name
	shape = id.toLowerCase().replace("box", "rect");
	// look for id in various ways
        if( id === "selected" ){
	    if( canvas.getActiveObject() ){
		// make sure its a region
		sobj = canvas.getActiveObject();
		if( sobj.params ){
		    ginfo.group = null;
		    // selected object
		    cb.call(that, sobj, ginfo);
		}
	    } else if( group ){
		ginfo.group = group;
		group.forEachObject(function(obj){
		    // member of a selected group
		    if( obj.params ){
			cb.call(that, obj, ginfo);
		    }
		});
	    }
	} else {
	    canvas.forEachObject(function(obj){
	      if( obj.params ){
		if( group && group.contains(obj) ){
		    ginfo.group = group;
		} else {
		    ginfo.group = null;
		}
		if( id === "all" ){
		    // all
		    cb.call(that, obj, ginfo);
		} else if( id === obj.stroke ){
		    // color
		    cb.call(that, obj, ginfo);
		} else if( shape === obj.type ){
		    // shape
		    cb.call(that, obj, ginfo);
		} else {
		    // tags
		    if( obj.params.tags){
			for(i=0; i<obj.params.tags.length; i++){
			    if( id === obj.params.tags[i] ){
				cb.call(that, obj, ginfo);
			    }
			}
		    }
		}
	      }
	    });
	}
	break;
    }
    return this;
};

// update public object in shapes
// call using image context
JS9.Fabric.updateShapes = function(layerName, shape, mode, opts){
    var that = this;
    // process the specified shapes
    this.selectShapes(layerName, shape, function(obj, ginfo){
	JS9.Fabric._updateShape.call(that, layerName, obj, ginfo, mode, opts);
    });
    return this;
};

// primitive to update one shape
// call using image context
JS9.Fabric._updateShape = function(layerName, obj, ginfo, mode, opts){
    var i, pname, pinst, popts, xname, s, scalex, scaley, px, py, lcs;
    var display, bin, zoom, tstr, dpos, gpos, ipos, npos, objs, olen, radius;
    var pub ={};
    var layer = this.layers[layerName];
    var tr  = function(x){return x.toFixed(1);};
    var tr4 = function(x){return x.toFixed(4);};
    ginfo = ginfo || {};
    opts = opts || {};
    mode = mode || "update";
    display = this.display;
    // is image zoom part of scale?
    if( this.display.layers[layerName].dtype === "main" ){
	zoom = this.primary.sect.zoom;
	// bin = this.binning.bin || 1;
	bin = 1;
    } else {
	zoom = 1;
	bin = 1;
    }
    // fill in the blanks
    pub.mode = mode;
    pub.id = obj.params.id;
    pub.shape = obj.params.shape;
    pub.layer = layerName;
    pub.color = obj.stroke;
    pub.tags = obj.params.tags;
    dpos = obj.getCenterPoint();
    if( ginfo.group ){
	gpos = ginfo.group.getCenterPoint();
	dpos = {x: dpos.x + gpos.x, y: dpos.y + gpos.y};
    }
    // image position
    ipos = this.displayToImagePos(dpos);
    pub.x = ipos.x;
    pub.y = ipos.y;
    pub.imsys = "image";
    // logical position
    pub.lcs = this.imageToLogicalPos(ipos);
    // convenience variables
    if( this.params.wcssys === "image" ){
	px = pub.x;
	py = pub.y;
    } else {
	px = pub.lcs.x;
	py = pub.lcs.y;
	pub.imsys = pub.lcs.sys;
    }
    // display position
    pub.angle = -obj.angle;
    if( ginfo.group ){
	pub.angle -= ginfo.group.angle;
    }
    while( pub.angle < 0 ){
	pub.angle += 360;
    }
    while( pub.angle > 360 ){
	pub.angle -= 360;
    }
    // the parts of the obj.scale[XY] values related to size (not zoom, binning)
    scalex = obj.scaleX / zoom * bin;
    scaley = obj.scaleY / zoom * bin;
    if( ginfo.group ){
	scalex *= ginfo.group.scaleX;
	scaley *= ginfo.group.scaleY;
    }
    // since can can call this in mousemove, optimize by not using sprintf
    switch(pub.shape){
    case "annulus":
	pub.shape = "annulus";
	pub.radii = [];
	pub.imstr = "annulus(" + tr(px) + ", " + tr(py) + ", ";
	tstr = "annulus " + pub.x + " " + pub.y + " ";
	objs = obj.getObjects();
	olen = objs.length;
	for(i=0; i<olen; i++){
	    radius = objs[i].radius * scalex;
	    pub.imstr += tr(radius);
	    tstr += (pub.x + " " +  pub.y + " " + (pub.x + radius) + " " + pub.y + " ");
	    if( i === (olen - 1) ){
		pub.imstr += ")";
	    } else {
		pub.imstr += ", ";
	    }
	    pub.radii.push(radius);
	}
	break;
    case "box":
	pub.shape = "box";
	pub.width =  obj.width * scalex;
	pub.height = obj.height * scaley;
	pub.imstr = "box(" + tr(px) + ", " + tr(py) + ", " + tr(pub.width) + ", " + tr(pub.height) + ", " + tr4(pub.angle) + ")";
	tstr = "box " + pub.x + " " + pub.y + " " + pub.x + " " + pub.y + " " + (pub.x + pub.width) + " " + pub.y + " " + pub.x + " " + pub.y + " " + pub.x + " " + (pub.y + pub.height) + " " + (pub.angle * Math.PI / 180.0);
	break;
    case "circle":
	pub.radius = obj.radius * scalex;
	pub.imstr = "circle(" + tr(px) + ", " + tr(py) + ", " + tr(pub.radius) + ")";
	tstr = "circle " + pub.x + " " + pub.y + " " + pub.x + " " + pub.y + " " + (pub.x + pub.radius) + " " + pub.y;
	break;
    case "ellipse":
	pub.r1 = obj.width * scalex / 2;
	pub.r2 = obj.height * scaley / 2;
	pub.imstr = "ellipse(" + tr(px) + ", " + tr(py) + ", " + tr(pub.r1) + ", " + tr(pub.r2) + ", " + tr4(pub.angle) + ")";
	tstr = "ellipse " + pub.x + " " + pub.y + " " + pub.x + " " + pub.y + " " + (pub.x + pub.r1) + " " + pub.y + " " + pub.x + " " + pub.y + " " + pub.x + " " + (pub.y + pub.r2) + " " + (pub.angle * Math.PI / 180.0);
	break;
    case "point":
	pub.width =  obj.width * scalex;
	pub.height = obj.height * scaley;
	pub.imstr = "point(" + tr(px) + ", " + tr(py) + ")";
	tstr = "point " + pub.x + " " + pub.y;
	break;
    case "polygon":
	pub.imstr = "polygon(";
	tstr = "polygon ";
	pub.pts = [];
	for(i=0; i<obj.points.length; i++){
	    if( i > 0 ){
		pub.imstr += ", ";
		tstr += " ";
	    }
	    // get current point
	    npos = {x: pub.x + obj.points[i].x * scalex, 
		    y: pub.y - obj.points[i].y * scaley};
	    // add rotation
	    npos = JS9.rotatePoint(npos, pub.angle,
				   {x: pub.x, y: pub.y});
	    if( this.params.wcssys === "image" ){
		pub.imstr += (tr(npos.x) + ", " + tr(npos.y));
	    } else {
		lcs = this.imageToLogicalPos(npos);
		pub.imstr += (tr(lcs.x) + ", " + tr(lcs.y));
	    }
	    tstr += (npos.x + " " + npos.y);
	    pub.pts.push(npos);
	}
	pub.imstr += ")";
        break;
    case "text":
	pub.imstr = "text(" + tr(px) + ", " + tr(py) + ', "' + obj.text + '")';
	pub.text = obj.text;
	tstr = "text " + pub.x + " " + pub.y + ' "' + obj.text + '"';
	break;
    default:
	break;
    }
    // generate wcs string, if:
    // it's the region layer and opts.dowcsstr is not explicitly false
    // it's the not region layer and opts.dowcsstr is explicitly true
    if( this.wcs && (this.wcs > 0) ){
	if( ((layerName === "regions") && (opts.dowcsstr !== false)) ||
	    ((layerName !== "regions") && (opts.dowcsstr === true))  ){
	    pub.wcsstr = JS9.reg2wcs(this.wcs, tstr).replace(/;$/, "");
	}
	s = JS9.pix2wcs(this.wcs, ipos.x, ipos.y).trim().split(/\s+/);
	pub.ra = s[0];
	pub.dec = s[1];
	pub.wcssys = s[2];
    }
    // save the pub object
    obj.set("pub", pub);
    // update dialog box, if necessary
    if( obj.params.winid ){
	if( $(obj.params.winid).is(":visible") ){
	    JS9.Regions.initConfigForm.call(this, obj);
	} else {
	    obj.params.winid = null;
	}
    }
    // stop here is no callbacks were requested
    if( opts.nocb ){
	return pub;
    }
    // special onchange callback for regions
    if( (layerName === "regions") && 
	this.params.xeqonchange && layer.show && this.onregionschange ){
	try{ 
	    this.params.xeqonchange = false;
	    JS9.xeqByName(this.onregionschange, window, this, pub);
	}
	catch(e){
	    JS9.log("error in xeqonchange: %s [%s]\n%s", 
		    this.id, e.message, JS9.strace(e));
	}
	finally{this.params.xeqonchange = true;}
    }
    // onchange callback for this layer
    if( this.params.xeqonchange && layer.show && layer.opts.onchange ){
	try{ 
	    this.params.xeqonchange = false;
	    JS9.xeqByName(layer.opts.onchange, window, this, pub);
	}
	catch(e){
	    JS9.log("error in onchange: %s [%s]\n%s", 
		    this.id, e.message, JS9.strace(e));
	}
	finally{this.params.xeqonchange = true;}
    }
    // plugin callbacks: these have the form on[layer]change, 
    // e.g. onregionschange
    xname = "on" + layerName + "change";
    for( pname in display.pluginInstances ){
	if( display.pluginInstances.hasOwnProperty(pname) ){
	    pinst = display.pluginInstances[pname];
	    popts = pinst.plugin.opts;
	    if( pinst.isActive(xname) ){
		try{ popts[xname].call(pinst, this, pub); }
		catch(e){ pinst.errLog(xname, e); }
	    }
	}
    }
    // and return it
    return pub;
};

// remove the active shape
JS9.Fabric.removeShapes = function(layerName, shape, opts){
    var that = this;
    var layer, canvas;
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer ){
	return;
    }
    canvas = layer.canvas;
    // process the specified shapes
    this.selectShapes(layerName, shape, function(obj, ginfo){
	JS9.Fabric._updateShape.call(that, layerName, obj, ginfo, "remove");
	// remove from any group
	if( ginfo && ginfo.group ){
	    ginfo.group.remove(obj);
	}
	// clear any dialog box
	if( obj.params && obj.params.winid ){
	    obj.params.winid.close();
	}
	// remove the shape
	canvas.remove(obj);
    });
    // handle changed selected group specially (fabric.js nuance)
    if( canvas.getActiveGroup() ){
	canvas.discardActiveGroup();
    }
    canvas.renderAll();
    return this;
};

// return one or more regions
// call using image context
JS9.Fabric.getShapes = function(layerName, shape){
    var sarr = [];
    // process the specified shapes
    this.selectShapes(layerName, shape, function(obj, ginfo){
	// add this region to the output array
	sarr.push(obj.pub || {});
    });
    return sarr;
};

// change the specified shape(s)
// call using image context
JS9.Fabric.changeShapes = function(layerName, shape, opts){
    var i, s, sobj, bopts, layer, canvas, ao, rlen, color, maxr, zoom, bin;
    var that = this;
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer ){
	return;
    }
    // sanity check
    if( !opts ){
	return;
    }
    canvas = layer.canvas;
    // is image zoom part of scale?
    if( this.display.layers[layerName].dtype === "main" ){
	zoom = this.primary.sect.zoom;
	bin = this.binning.bin || 1;
    } else {
	zoom = 1;
	bin = 1;
    }
    // binning is part of panner scale (is this really right???)
    // bin = this.binning.bin || 1;
    // active object
    ao = canvas.getActiveObject();
    // process the specified shapes
    this.selectShapes(layerName, shape, function(obj, ginfo){
	// combine the objects parametes with the new options
	bopts = $.extend(true, {}, obj.params, opts);
	// parse options and generate new obj and params
	sobj = JS9.Fabric._parseShapeOptions.call(this, layerName, bopts, obj);
	// remove means remove previous shapes
	if( sobj.remove ){
	    this.removeShapes(layerName, "all");
	    return;
	}
	// change the shape
	obj.set(sobj.opts);
	// reestablish params object
	obj.params = $.extend(false, {}, obj.params, sobj.params);
	// shape-specific post-processing
	// mainly: change of size => remove size-based scaling factor
	switch(obj.params.shape){
	case "annulus":
	    if( opts.radii && opts.radii.length ){
		color = obj.get("stroke");
		// remove existing annuli
		obj.forEachObject(function(tobj){
		    obj.remove(tobj);
		    canvas.remove(tobj);
		});
		// generate new annuli
		rlen = obj.params.radii.length;
		maxr = 0;
		for(i=0; i<rlen; i++){
		    s = new fabric.Circle({radius: obj.params.radii[i],
					   stroke: color});
		    maxr = Math.max(maxr, obj.params.radii[i]);
		    obj.add(s);
		}
		obj.scaleX = zoom / bin;
		obj.scaleY = zoom / bin;
		// reset size of group
		obj.width = maxr * 2;
		obj.height = maxr * 2;
		if( ao === obj ){
		    canvas.setActiveObject(obj);
		}
	    }
	    break;
	case "box":
	    if( opts.width ){
		obj.scaleX = zoom / bin;
	    }
	    if( opts.height ){
		obj.scaleY = zoom / bin;
	    }
	    break;
	case "circle":
	    if( opts.radius ){
		obj.scaleX = zoom / bin;
		obj.scaleY = zoom / bin;
	    }
	    break;
	case "ellipse":
	    if( opts.r1 ){
		obj.rx = opts.r1;
		obj.scaleX = zoom / bin;
		// why is this not done automatically???
		obj.width = obj.rx * 2;
	    }
	    if( opts.r2 ){
		obj.ry = opts.r2;
		obj.scaleY = zoom / bin;
		obj.height = obj.ry * 2;
	    }
	    break;
	case "polygon":
	    if( opts.points && opts.points.length ){
		obj.scaleX = zoom / bin;
		obj.scaleY = zoom / bin;
	    }
	    if( ao === obj ){
		JS9.Fabric.removePolygonAnchors(layer.dlayer, obj);
		JS9.Fabric.addPolygonAnchors(layer.dlayer, obj);
	    }
	    // reset the center point
	    JS9.resetPolygonCenter(obj);
	    break;
	}
	// make sure border width is correct
	obj.rescaleBorder();
	// and reset coords
	obj.setCoords();
	// update the shape info and make callbacks
	JS9.Fabric._updateShape.call(that, layerName, obj, ginfo, "update");
    });
    // redraw (unless explicitly specified otherwise)
    if( (opts.redraw === undefined) || opts.redraw ){
	canvas.renderAll();
    }
    return this;
};

// update shape layer a change in panning, zooming, binning
// This routine is more complicated that one would want because fabric.js mixes
// regions resize, zoom, and binning all in the same scale factor. So when 
// we want to adjust a region for pan, zoom, or bin, we first have to untangle
// the old zoom and bin values from the scale before applying new ones.
// Current approach is to save the old bin and zoom factors when changing them,
// use the old ones here, and then reset the old ones to the new ones. Hmmm ...
// call using image context
JS9.Fabric.refreshShapes = function(layerName){
    var dpos, ao, bin, zoom, scaleX, scaleY, tscaleX, tscaleY;
    var layer, canvas;
    var ismain = false;
    var that = this;
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer ){
	return;
    }
    if( this.display.layers[layerName].dtype === "main" ){
	ismain = true;
    }
    if( ismain ){
	bin = this.binning.bin;
	zoom = this.primary.sect.zoom;
	// scale factor removes the old values and applies the new ones
	scaleX = (this.binning.obin / this.primary.sect.ozoom) * zoom / bin;
	scaleY = (this.binning.obin / this.primary.sect.ozoom) * zoom / bin;
    } else {
	bin = 1;
	zoom = this.primary.sect.zoom;
	scaleX = zoom;
	scaleY = zoom;
    }
    canvas = layer.canvas;
    // have to discard active groups before changing position of shapes
    if( canvas.getActiveGroup() ){
	canvas.discardActiveGroup();
    }
    ao = canvas.getActiveObject();
    // process the specified shapes
    this.selectShapes(layerName, "all", function(obj, ginfo){
	// convert current image pos to new display pos
	// dpos = that.imageToDisplayPos(obj.pub);
	// convert current logical position to new display position
	// this takes binning, etc. into consideration
	dpos = that.logicalToDisplayPos(obj.pub.lcs);
	// change region position
	obj.setLeft(dpos.x);
	obj.setTop(dpos.y);
	// set scaling based on zoom factor
	switch(obj.params.shape){
	case "point":
	case "text":
	    break;
	default:
	    // rescale the region
	    tscaleX = scaleX;
	    tscaleY = scaleY;
	    if( ismain ){
		// tscale is the resize part of old scale * new bin & zoom
		tscaleX *= obj.scaleX;
		tscaleY *= obj.scaleY;
	    }
	    obj.scaleX = tscaleX;
	    obj.scaleY = tscaleY;
	    // rescale the width of the stroke lines
	    obj.rescaleBorder();
	    break;
	}
	// recalculate fabric coords
	obj.setCoords();
	// shape-specific processing
	switch(obj.type){
	    case "polygon":
	    if( ao === obj ){
		JS9.Fabric.removePolygonAnchors(layer.dlayer, obj);
		JS9.Fabric.addPolygonAnchors(layer.dlayer, obj);
	    }
	    break;
	}
    });
    // only use the old bin and zoom once (until they change again)
    if( ismain ){
	this.binning.obin = this.binning.bin;
	this.primary.sect.ozoom = this.primary.sect.zoom;
    }
    // redraw regions
    if( canvas ){
	canvas.renderAll();
    }
    return this;
};

// add (or remove) a point to a polygon, adapted from:
// http://stackoverflow.com/questions/14014861/constrain-image-to-a-path-in-kineticjs
// call using image context
JS9.Fabric.addPolygonPoint = function(layerName, obj, evt){
    var i, points, p1, p2, minX, minY, maxX, maxY, dir, m, dot, d, angle;
    var layer;
    var mpos={}, canv={}, local={}, newpt={}, pos = {}, pVec = {}, p = {};
    var diff = Number.MAX_VALUE;   // a bloated diff, for minimum comparision
    // sanity check
    if( !obj || !obj.points){
        return;
    }
    // get mouse position
    mpos = JS9.eventToDisplayPos(evt);
    // convert the drag position from absolute to local to the group
    canv.x = obj.getCenterPoint().x;
    canv.y = obj.getCenterPoint().y;
    local.x = (mpos.x - canv.x) / obj.get("scaleX");
    local.y = (mpos.y - canv.y) / obj.get("scaleY");
    // rotation angle
    angle = -obj.get("angle") * Math.PI / 180.0;
    while( angle > (Math.PI * 2) ){
	angle -= Math.PI * 2;
    }
    pos.x = Math.cos(angle) * local.x - Math.sin(angle) * local.y;
    pos.y = Math.sin(angle) * local.x + Math.cos(angle) * local.y;
    //Get the list of points from the polygon
    points = obj.points;
    //The algorithm is simple, iterate through the list of points
    //and select a pair which forms a side of the polygon.
    //For this side, pick a main point. Find the direction vector
    //with respect to this main point, and find the position vector
    //from this main point to the drag position.
    //Dot product of position vector and direction vector give us
    //the projection of the point on the current side.
    //A simple bounds checking to ensure that the projection is on
    //the side, then a distance calculation.
    //If the distance found is less than the current minimum difference
    //update diff, newX and newY.   
    for(i=0; i<points.length; i++){
        //Get point pair.
        p1 = points[i];
        p2 = points[(i+1)%points.length];
        //Find the bounds for checking projection bounds later on        
        minX = (p1.x < p2.x ? p1.x : p2.x);
        minY = (p1.y < p2.y ? p1.y : p2.y);
        maxX = (p1.x > p2.x ? p1.x : p2.x);
        maxY = (p1.y > p2.y ? p1.y : p2.y);
        //Select p2 as the main point.
        //Find the direction vector and normalize it.       
        dir = {x: p1.x - p2.x, y: p1.y - p2.y};
        m = Math.sqrt(dir.x*dir.x + dir.y*dir.y);
        if( m !== 0 ){
            dir.x = dir.x/m;
            dir.y = dir.y/m;
        }
        //Find the position vector        
        pVec = {x: pos.x - p2.x, y: pos.y - p2.y};
        //Dot product        
        dot = pVec.x * dir.x + pVec.y * dir.y;
        //Find the projection along the current side        
        p = {x: p2.x + dir.x * dot, y: p2.y + dir.y * dot};       
        //Bounds checking to ensure projection remains
        //between the point pair.       
        if( p.x < minX ){
            p.x = minX;
	} else if( p.x > maxX ){
            p.x = maxX;
	}
        if( p.y < minY ){
            p.y = minY;
	} else if( p.y > maxY ){
            p.y = maxY;
	}
        //Distance calculation.
        d = (p.x-pos.x) * (p.x-pos.x) + (p.y-pos.y) * (p.y-pos.y);
        //Minimum comparision.       
        if( d < diff ){
            diff = d;
	    newpt.x = p.x;
	    newpt.y = p.y;
	    if( i === points.length ){
		newpt.i = 0;
	    } else {
		newpt.i = i;
	    }
        }
    }
    // get canvas
    layer = this.getShapeLayer(layerName);
    // remove anchors
    JS9.Fabric.removePolygonAnchors(layer.dlayer, obj);
    // add the new point into the points array
    points.splice(newpt.i+1, 0, {x: newpt.x, y: newpt.y});
    // making this the active object will recreate the anchors
    layer.canvas.setActiveObject(obj);
};

// remove the specified point
// call using image context
JS9.Fabric.removePolygonPoint = function(layerName, obj, evt){
    var layer, polygon, points, pt;
    // sanity check
    if( !obj || !obj.polyparams ){
	return;
    }
    // get info on this point
    polygon = obj.polyparams.polygon;
    points = polygon.points;
    pt = obj.polyparams.point;
    // get layer
    layer = this.getShapeLayer(layerName);
    // remove anchors
    JS9.Fabric.removePolygonAnchors(layer.dlayer, polygon);
    // add the new point into the points array
    points.splice(pt, 1);
    // reset the center point
    JS9.resetPolygonCenter(polygon);
    // making this the active object will recreate the anchors
    layer.canvas.setActiveObject(polygon);
};

// add anchors to a polygon
// don't need to call using image context
JS9.Fabric.addPolygonAnchors = function(dlayer, obj){
    var i, a, pos={};
    var canvas = dlayer.canvas;
    var movePoint = function(){
	var anchor = this;
	var poly = anchor.polyparams.polygon;
	var pt = anchor.polyparams.point;
	var points = poly.get('points');
	var im = dlayer.display.image;
	// new point for this anchor relative to center
	// NB: anchor was rotated onto the vertex
	if( poly.angle ){
	    pos = JS9.rotatePoint({x: anchor.left, y: anchor.top}, -poly.angle, 
				{x: poly.left, y: poly.top});
	} else {
	    pos.x = anchor.left;
	    pos.y = anchor.top;
	}
	// move the polygon point to the anchor (in unscaled coords)
	points[pt].x = (pos.x - poly.left) / poly.scaleX;
	points[pt].y = (pos.y - poly.top) / poly.scaleY;
	// reset the center point
	JS9.resetPolygonCenter(poly);
	// update the shape info
	JS9.Fabric._updateShape.call(im, poly.params.layerName, poly, 
				     null, "update");
	if( im && (im.params.listonchange || poly.params.listonchange) ){
	    im.listRegions(poly, 2);
	}


	// redraw
	canvas.renderAll();
    };
    var moveAnchors = function(obj){
	var ii, tpos={};
	// change anchor positions
	for(ii=0; ii<obj.params.anchors.length; ii++){
	    tpos.x = obj.left + obj.points[ii].x * obj.scaleX;
	    tpos.y = obj.top  + obj.points[ii].y * obj.scaleY;
	    if( obj.angle ){
		// anchor is rotated onto the vertice
		// (easier than taking rotation out of each vertice)
		tpos = JS9.rotatePoint(tpos, obj.angle, 
				       {x: obj.left, y: obj.top});
	    }
	    obj.params.anchors[ii].set({left: tpos.x, 
					top: tpos.y, 
					angle: obj.angle});
	    obj.params.anchors[ii].setCoords();
	}
	// new bounding box dimensions (don't change points)
	obj._calcDimensions(true);
	// redraw
	canvas.renderAll();
    };
    // sanity check: don't add anchors twice
    if( obj.params.anchors ){
	return;
    }
    obj.params.anchors = [];
    // make a circle at each anchor point
    for(i=0; i<obj.points.length; i++){
	pos.x = obj.left + obj.points[i].x * obj.scaleX;
	pos.y = obj.top + obj.points[i].y * obj.scaleY;
	if( obj.angle ){
	    pos = JS9.rotatePoint(pos, obj.angle, obj.getCenterPoint());
	}
	a = new fabric.Rect({
	    left: pos.x,
	    top: pos.y,
	    hasControls: false,
	    hasRotatingPoint: false,
	    hasBorders: false,
	    selectable: true,
	    fill: obj.get("stroke"),
	    hoverCursor: 'pointer',
	    width: JS9.Fabric.opts.cornerSize,
	    height: JS9.Fabric.opts.cornerSize,
	    padding: 2
	});
	// add resize function on move
	a.on("moving", movePoint);
	// save point in the polygon for move
	a.polyparams = {};
	a.polyparams.polygon = obj;
	a.polyparams.point = i;
	// backlink to polygon for removal
	obj.params.anchors[i] = a;
	// add it to canvas
	canvas.add(a);
    }
    // reposition anchors on move
    obj.on("moving", function(opts){
	moveAnchors(obj);
    });
    obj.on("rotating", function(opts){
	moveAnchors(obj);
    });
    obj.on("scaling", function(opts){
	moveAnchors(obj);
    });
    obj.setCoords();
    // let the caller do this
    // canvas.renderAll();
};

// remove anchors from a polygon
// don't need to call using image context
JS9.Fabric.removePolygonAnchors = function(dlayer, shape){
    var i;
    var canvas = dlayer.canvas;
    if( shape.params && shape.params.anchors ){
	// remove all anchors
	for(i=0; i<shape.params.anchors.length; i++){
	    canvas.remove(shape.params.anchors[i]);
	}
	delete shape.params.anchors;
    }
};

// reset center of a polygon
// don't need to call using image context
JS9.resetPolygonCenter = function(poly){
    var tpos = {};
    var dx, dy;
    // recalculate bounding box
    poly._calcDimensions();
    // get deltas
    dx = (poly.minX + (poly.width  / 2)) * poly.scaleX;
    dy = (poly.minY + (poly.height / 2)) * poly.scaleY;
    // new center
    if( poly.angle ){
	tpos = JS9.rotatePoint(
	    {x: poly.left + dx, y: poly.top  + dy},
	    poly.angle,
	    {x: poly.left, y: poly.top}
	);
    } else {
	tpos.x = poly.left + dx;
	tpos.y = poly.top + dy;
    }
    // set new center
    poly.left = tpos.x;
    poly.top = tpos.y;
    // new coordinates
    poly.setCoords();
};

// Print support
// call using image context
JS9.Fabric.print = function(){
    var key, win, dataURL;
    var opts = sprintf("width=%s,height=%s,menubar=1,toolbar=1,status=0,scrollbars=1,resizable=1", this.display.canvasjq.attr("width"), this.display.canvasjq.attr("height"));
    // make a copy of the image
    dataURL = this.display.canvas.toDataURL("image/png");
    // make a new window
    win = window.open(null, this.id, opts);
    if( !win ){
	JS9.log("warning: could not create print window (check your pop-up blockers)");
	return;
    }
    win.document.open();
    // put everything at 0,0
    win.document.write("<html><body style='padding: 0px; margin: 0px' onload='window.print(); return false'>");
    // here is the image
    win.document.write("<div style='position: absolute'>");
    win.document.write("<img src='");
    win.document.write(dataURL);
    win.document.write("' />");
    win.document.write("</div>");
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    // output (showing) layers attached to the main display
	    if( this.layers[key].dlayer.dtype === "main" && 
		this.layers[key].show ){
		win.document.write("<div style='position: absolute'>");
		win.document.write(this.layers[key].dlayer.canvas.toSVG());
		win.document.write("</div>");
	    }
	}
    }
    win.document.write("</body></html>");
    win.document.close();
};

// incorporate these graphics routines into JS9
JS9.Fabric.initGraphics = function(){
    var key;
    // display methods
    JS9.Display.prototype.newShapeLayer = JS9.Fabric.newShapeLayer;
    // image shape methods
    JS9.Image.prototype.addShapes = JS9.Fabric.addShapes;
    JS9.Image.prototype.selectShapes = JS9.Fabric.selectShapes;
    JS9.Image.prototype.updateShapes = JS9.Fabric.updateShapes;
    JS9.Image.prototype.updateShape = JS9.Fabric._updateShape;
    JS9.Image.prototype.getShapes = JS9.Fabric.getShapes;
    JS9.Image.prototype.changeShapes = JS9.Fabric.changeShapes;
    JS9.Image.prototype.removeShapes = JS9.Fabric.removeShapes;
    JS9.Image.prototype.refreshShapes = JS9.Fabric.refreshShapes;
    // shape layer methods
    JS9.Image.prototype.getShapeLayer = JS9.Fabric.getShapeLayer;
    JS9.Image.prototype.showShapeLayer = JS9.Fabric.showShapeLayer;
    JS9.Image.prototype.displayShapeLayers = JS9.Fabric.displayShapeLayers;
    // print method which know about shapes
    JS9.Image.prototype.print = JS9.Fabric.print;
    // incorporate our defaults into fabric
    for( key in JS9.Fabric.opts ){
	if( JS9.Fabric.opts.hasOwnProperty(key) ){
	    fabric.Object.prototype[key] = JS9.Fabric.opts[key];
	}
    }
};

// initialize graphics to use Fabric
JS9.Fabric.initGraphics();

// ---------------------------------------------------------------------
// Regions object defines high level calls for Regions plugin
// ---------------------------------------------------------------------

JS9.Regions = {};
JS9.Regions.CLASS = "JS9";
JS9.Regions.NAME = "Regions";

// defaults for new regions
JS9.Regions.opts = {
    // default overrides: regions above other shapes
    // canvas options
    canvas: {
	zindex: JS9.SHAPEZINDEX + 2
    },
    // pan and zoom enabled
    panzoom: true,
    tags: "source,include",
    strokeWidth: 2,
    // annuli: inner and outer radius, number of annuli
    iradius: 0,
    oradius: 30,
    nannuli: 10,
    // box
    width: 60,
    height: 60,
    // circle
    radius: 30,
    // ellipse:
    // use r1, r2 to avoid confusion with rad1, rad2 for rounding in boxes!
    r1: 30,
    r2: 20,
    // point
    ptshape: "box",
    ptsize: 2,
    // polygon in display coords
    // points: [{x: -30, y: 30}, {x:30, y:30}, {x:30, y:-30}, {x:-30, y: -30}],
    points: [{x: -30, y: 30}, {x:30, y:30}, {x:0, y:-30}],
    // text
    // fontFamily: "Helvetica, sans-serif",
    fontFamily: "Helvetica",
    fontSize: 14,
    fontStyle: "normal",
    fontWeight: 300,
    textAlign: "left",
    // angles (box, ellipse)
    angle: 0,
    // anchor radii
    aradius1: 4,
    aradius2: 8,
    // region configuration url
    configURL: "./params/regionsconfig.html",
    // colors for tags
    // these should be ordered from more specific to less specific
    tagcolors: {
	include_source:     "#00FF00",
	exclude_source:     "#FF0000",
	include_background: "#FFD700",
	exclude_background: "#FF8C00",
	source:             "#00FF00",
	background:         "#FFD700",
	defcolor:            "#00FF00"
    }
};

// plugin init: load our regions methods
JS9.Regions.init = function(layerName){
    var dlayer;
    // get layer name
    layerName = layerName || "regions";
    // add to image prototypes
    JS9.Image.prototype.parseRegions = JS9.Regions.parseRegions;
    JS9.Image.prototype.saveRegions = JS9.Regions.saveRegions;
    JS9.Image.prototype.listRegions = JS9.Regions.listRegions;
    // init the display shape layer
    dlayer = this.display.newShapeLayer(layerName, JS9.Regions.opts);
    // mouse up: list regions, if necessary
    dlayer.canvas.on("mouse:up", function(opts){
	var i, tim;
	var objs = [];
	if( dlayer.display.image ){
	    tim = dlayer.display.image;
	    // one active object
	    if( this.getActiveObject() ){
		objs.push(this.getActiveObject());
	    }
	    // group of active objects
	    if( this.getActiveGroup() ){
		objs = this.getActiveGroup().getObjects();
	    }
	    // process all active objects
	    for(i=0; i<objs.length; i++){
		if( objs[i].params ){
		    if( tim.params.listonchange ){
			tim.listRegions("all", 2);
		    } else if( objs[i].params.listonchange ){
			tim.listRegions("selected", 2);
		    }
		    break;
		}
	    }
	}
    });
    return this;
};

// initialize the region config form
// call using image context
JS9.Regions.initConfigForm = function(obj){
    var key, val;
    var winid = obj.params.winid;
    var wid = $(winid).attr("id");
    var form = "#" + wid + " #regionsConfigForm ";
    // remove the nodisplay class from this shape's div
    $(form + "." + obj.pub.shape).each(function(){
	$(this).removeClass("nodisplay");
    });
    // fill in the values from the shape object
    $(form + ".val").each(function(){
	val = "";
	key = $(this).attr("name");
	// key-specific pre-processing
	switch(key){
	case "pts":
	    if( obj.pub.pts ){
		obj.pub.pts.forEach(function(p){
		    if( val ){
			val += ", ";
		    }
		    val += sprintf("%s, %s", p.x, p.y);
		});
	    } else {
		// use the flat points list instead of the pts object array
		if( obj.pub.imstr ){
		    val = obj.pub.imstr.replace(/^.*\(/, "").replace(/\)$/, "");
		}
	    }
	    break;
	default:
	    if( obj.pub[key] !== undefined ){
		val = obj.pub[key];
	    }
	    break;
	}
	$(this).val(val);
    });
    // wcs display
    if( obj.pub.wcsstr ){
	$(form + ".wcs").removeClass("nodisplay");
    }
    // checkboxes
    if( obj.params.listonchange === undefined ){
	obj.params.listonchange = false;
    }
    if( obj.params.listonchange ){
	$(form + "[name='listonchange']").attr("checked", "checked");
    } else {
	$(form + "[name='listonchange']").removeAttr("checked");
    }
    if( obj.params.fixinplace === undefined ){
	obj.params.fixinplace = false;
    }
    if( obj.params.fixinplace ){
	$(form + "[name='fixinplace']").attr("checked", "checked");
    } else {
	$(form + "[name='fixinplace']").removeAttr("checked");
    }
    // shape specific processing
    switch(obj.pub.shape){
    case "box":
    case "ellipse":
    case "polygon":
    case "text":
	$(form + ".angle").removeClass("nodisplay");
	break;
    }
    // save the image for later processing
    $(form).data("im", this);
    // save the shape object for later processing
    $(form).data("shape", obj);
    // save the window id for later processing
    $(form).data("winid", winid);
};

// process the config form to change the specified shape
// call using image context
JS9.Regions.processConfigForm = function(obj, winid, arr){
    var i, key, val;
    var alen = arr.length;
    var opts = {};
    var newval = function(obj, key, val){
	// special keys that have no public or param equivalents
	if( key === "remove" ){
	    return true;
	}
	if( (obj.pub[key] !== undefined) && 
	    (String(obj.pub[key]) !== val) ){
	    return true;
	}
	if( (obj.params[key] !== undefined) && 
	    (String(obj.params[key]) !== val) ){
	    return true;
	}
	return false;
    };
    var getval = function(s){ 
	if( s === "true" ){
	    return true;
	}
	if( s === "false" ){
	    return false;
	}
	if((s === "") || isNaN(s) ){
	    return s;
	}
	return parseFloat(s);
    };
    for(i=0; i<alen; i++){
	key = arr[i].name;
	val = arr[i].value;
	switch(key){
	case "x":
	    if( newval(obj, key, val) ){
		opts[key] = getval(val);
		if( opts.y === undefined ){
		    opts.y = obj.pub.y;
		}
	    }
	    break;
	case "y":
	    if( newval(obj, key, val) ){
		opts[key] = getval(val);
		if( opts.x === undefined ){
		    opts.x = obj.pub.x;
		}
	    }
	    break;
	default:
	    if( newval(obj, key, val) ){
		opts[key] = getval(val);
	    }
	    break;
	}
    }
    // change the shape
    this.changeShapes(obj.pub.layer, obj, opts);
    JS9.Regions.initConfigForm.call(this, obj, winid);
};

// ---------------------------------------------------------------------------
// Regions prototype additions to JS9 Image class
// ---------------------------------------------------------------------------

// list one or more regions
JS9.Regions.listRegions = function(which, mode){
    var i, region, rlen;
    var tags, tagstr, iestr;
    var regstr="", sepstr="; ";
    var lasttype="none", dotags = false;
    var pubs = [];
    // default is to display, including non-source tags
    if( mode === undefined ){
	mode = 2;
    }
    // get specified regions into an array
    pubs = this.getShapes("regions", which);
    // loop through shapes
    rlen = pubs.length;
    // display tags if at least one is not standard "source,include"
    if( mode ){
	for(i=0; i<rlen; i++){
	    region = pubs[i];
	    if( region.tags.join(",") !== "source,include" ){
		dotags = true;
		break;
	    }
	}
    }
    // process all regions
    for(i=0; i<rlen; i++){
	region = pubs[i];
	tagstr = region.tags.join(",");
	if( tagstr.indexOf("exclude") >= 0 ){
	    iestr = "-";
	} else {
	    iestr = "";
	}
	if( dotags ){
	    tags = " # " + tagstr;
	}
	// use wcs string, if available
	if( region.wcsstr && 
	    (this.params.wcssys !== "image") &&
	    (this.params.wcssys !== "physical") ){
	    if( lasttype !== "wcs" ){
		if( lasttype !== "none" ){
		    regstr += sepstr;
		}
		regstr += this.params.wcssys;
		lasttype = "wcs";
	    }
	    regstr += (sepstr + iestr + region.wcsstr);
	} else if( region.imstr ){
	    // else use image string, if available
	    if( lasttype !== region.imsys ){
		if( lasttype !== "none" ){
		    regstr += sepstr;
		}
		regstr += region.imsys;
		lasttype = region.imsys;
	    }
	    regstr += (sepstr + iestr + region.imstr);
	}
	if( dotags ){
	    regstr += tags;
	}
    }
    // display the region string, if necessary
    if( mode > 1 ){
	this.displayMessage("regions", regstr);
    }
    // always return the region string
    return regstr;
};

// parse a string containing a subset of DS9/Funtools regions
JS9.Regions.parseRegions = function(s){
    var regions = [];
    var i, j, k, lines, obj, robj;
    var owcssys, wcssys, iswcs, liswcs, pos, wcsinfo, alen;
    var regrexp = /(annulus)|(box)|(circle)|(ellipse)|(polygon)|(point)|(text)/;
    var wcsrexp = /(fk4)|(fk5)|(icrs)|(galactic)|(ecliptic)|(image)|(physical)/;
    var parrexp = /\(\s*([^)]+?)\s*\)/;
    var seprexp = /\n|;/;
    var optsrexp = /(\{[^}]*\})/;
    var argsrexp = /\s*,\s*/;
    var charrexp = /(\(|\{|#|;|\n)/;
    // parse region line into cmd (shape or wcs), arguments, opts, comment
    var regparse1 = function(s){
	var tarr;
	var tobj = {};
	// initalize the return object
	tobj.opts = {};
	tobj.args = [];
	tobj.isregion = 0;
	// look for a command
	if( s.indexOf("(") >=0 ){
	    tobj.cmd = s.split("(")[0].trim().toLowerCase();
	} else if( s.indexOf("{") >=0 ){
	    tobj.cmd = s.split("{")[0].trim().toLowerCase();
	} else if( s.indexOf("#") >=0 ){
	    tobj.cmd = s.split("#")[0].trim().toLowerCase();
	} else {
	    tobj.cmd = s.trim().toLowerCase();
	}
	// got regions?
	if( tobj.cmd ){
	    tobj.isregion = (tobj.cmd.search(regrexp) >=0);
	}
	// look for comments
	tobj.comment = s.split("#")[1];
	if( tobj.comment ){
	    tobj.comment = tobj.comment.trim().toLowerCase();
	}
	// look for json opts after the argument list
	tarr = optsrexp.exec(s);
	if( tarr && tarr[1] ){
	    // convert to object
	    try{ tobj.opts = JSON.parse(tarr[1].trim()); }
	    catch(e){ tobj.opts = {}; }
	}
	// separate the region arguments into an array
	tarr = parrexp.exec(s);
	if( tarr && tarr[1] ){
	    // arguments without json opts
	    tobj.args = tarr[1].split(argsrexp);
	}
	// look for - sign signifying an exclude region
	if( tobj.isregion && tobj.cmd.indexOf("-") === 0 ){
	    tobj.cmd = tobj.cmd.slice(1);
	    if( tobj.comment ){
		tobj.comment += ",exclude";
	    } else {
		tobj.comment = "exclude";
	    }
	}
	return tobj;
    };
    // convert string to double, returning value and (units) delim
    var strtod = function(s){
	var dval = JS9.saostrtod(s);
	var dtype = String.fromCharCode(JS9.saodtype());
	// scale for certain units
	switch(dtype){
	case '"':
	    dval /= 3600.0;
	    break;
	case "'":
	    dval /= 60.0;
	    break;
	case "r":
	    dval *= (180.0 / Math.PI) ;
	    break;
	default:
	    break;
	}
	return {dval: dval, dtype: dtype};
    };
    // get image position using delim type to ascertain input units
    var getipos = function(ix, iy){
	var vt, sarr, ox, oy;
	var v1 = strtod(ix);
	var v2 = strtod(iy);
	// local override of wcs if we used sexagesimal
	if( (v1.dtype === ":") || (v2.dtype === ":") ){
	    liswcs = true;
	}
	if( iswcs || liswcs ){
	    /* arg1 coords are hms, but ecliptic, galactic are deg */
	    if( (v1.dtype === ":") &&
		(wcssys !== "galactic") && (wcssys !== "ecliptic") ){
		v1.dval *= 15.0;
	    }
	    sarr = JS9.wcs2pix(this.wcs, v1.dval, v2.dval).split(/ +/);
	    // returns 1-indexed, I guess ...
	    ox = parseFloat(sarr[0]) - 1;
	    oy = parseFloat(sarr[1]) - 1;
	} else {
	    if( wcssys === "physical" ){
		vt = this.logicalToImagePos({x: v1.dval, y: v2.dval});
		ox = vt.x;
		oy = vt.y;
	    } else {
		ox = v1.dval;
		oy = v2.dval;
	    }
	}
	return [ox, oy];
    };
    // get image length
    var getilen = function(len, which){
	var cstr;
	var v = strtod(len);
	if( iswcs || liswcs ){
	    if( v.dtype && (v.dtype !== ".") ){
		cstr = "cdelt" + which;
		v.dval = Math.abs(v.dval / wcsinfo[cstr]);
	    }
	}
	return v.dval;
    };
    // get image angle
    var getang = function(a){
	var v = strtod(a);
// this is in funtools/filter, but why??
//	if( iswcs || liswcs ){
//	    v.dval += wcsinfo.crot;
//	    if( wcsinfo.imflip ){
//		v.dval = -v.dval;
//	    }
//	}
	return v.dval;
    };
    // get cleaned-up string
    var getstr = function(s){
	var t = s.replace(/^['"]/, "").replace(/['"]$/, "");
	return t;
    };
    // sanity check
    s = s.trim();
    if( !s.match(charrexp) ){
	return s;
    }
    // get wcs info
    try{ wcsinfo = JSON.parse(JS9.wcsinfo(this.wcs)); }
    catch(e){ wcsinfo = {cdelt1: 1, cdelt2: 1, crot: 0, imflip: 0}; }
    // save original wcs
    owcssys = this.getWCSSys();
    // this is the default wcs for regions
    wcssys = "physical";
    // set default for regions
    this.setWCSSys(wcssys);
    // do we have a real wcs?
    iswcs = (wcssys !== "image" && wcssys !== "physical");
    // get individual "lines" (new-line or semi-colon separated)
    lines = s.split(seprexp);
    // for each region or cmd
    for(i=0; i<lines.length; i++){
	// ignore comments
	if( lines[i].trim().substr(0,1) !== "#" ){
	    // reset temp wcs 
	    liswcs = false;
	    // parse the line
	    robj = regparse1(lines[i]);
	    alen = robj.args.length;
	    // if this is a region ...
	    if( robj.isregion ){
		// start afresh or with opts from the region string
		obj = $.extend(true, {}, robj.opts);
		// save the shape
		obj.shape = robj.cmd;
		// arguments are not required!
		if( alen >= 2 ){
		    // get image position
		    pos = getipos.call(this, robj.args[0], robj.args[1]);
		    obj.x = pos[0];
		    obj.y = pos[1];
		}
		// region arguments are optional
		switch(robj.cmd){
		case 'annulus':
		    obj.radii = [];
		    for(j=2; j<alen; j++){
			obj.radii.push(getilen.call(this, robj.args[j], 1));
		    }
		    break;
		case 'box':
		    if( alen >= 3 ){
			obj.width = getilen.call(this, robj.args[2], 1);
		    }
		    if( alen >= 4 ){
			obj.height = getilen.call(this, robj.args[3], 2);
		    }
		    if( alen >= 5 ){
			obj.angle = getang.call(this, robj.args[4]);
		    }
		    break;
		case 'circle':
		    if( alen >= 3 ){
			obj.radius = getilen.call(this, robj.args[2], 1);
		    }
		    break;
		case 'ellipse':
		    if( alen >= 3 ){
			obj.r1 = getilen.call(this, robj.args[2], 1);
		    }
		    if( alen >= 4 ){
			obj.r2 = getilen.call(this, robj.args[3], 2);
		    }
		    if( alen >= 5 ){
			obj.angle = getang.call(this, robj.args[4]);
		    }
		    break;
		case 'polygon':
		    obj.pts = [];
		    for(j=0, k=0; j<alen; j+=2, k++){
			pos = getipos.call(this, robj.args[j], robj.args[j+1]);
			obj.pts[k] = {x: pos[0], y: pos[1]};
		    }
		    delete obj.x;
		    delete obj.y;
		    break;
		case 'point':
		    break;
		case 'text':
		    if( alen >= 3 ){
			obj.text = getstr.call(this, robj.args[2]);
		    }
		    break;
		default:
		    break;
		}
		// comment contains the tags
		if( robj.comment ){
		    obj.tags = robj.comment;
		}
		// save this region
		regions.push(obj);
	    } else {
		// if its a wcs command
		if( robj.cmd.match(wcsrexp) ){
		    // reset the wcs system
		    this.setWCSSys(robj.cmd);
		    // get new wcssys
		    wcssys = this.getWCSSys();
		    // is this a real wcs?
		    iswcs = (wcssys !== "image" && wcssys !== "physical");
		} else if( robj.cmd === "remove" || robj.cmd === "delete" ){
		    regions.push({remove: true});
		}
	    }
	}
    }
    // restore original wcs
    this.setWCSSys(owcssys);
    // return the generated object
    return regions;
};

// save regions to a file
JS9.Regions.saveRegions = function(which, disp){
    var header = sprintf("# Region file format: JS9 version 1.0");
    var regstr = this.listRegions(which, 1);
    var s = sprintf("%s\n%s\n", header, regstr.replace(/; */g, "\n"));
    var blob = new Blob([s], {type: "text/plain;charset=utf-8"});
    if( window.hasOwnProperty("saveAs") ){
	saveAs(blob, "js9.reg");
    } else {
	JS9.error("no saveAs function available to save region file");
    }
    return regstr;
};

// ---------------------------------------------------------------------
// Regions plugin callbacks
// process a keydown event
// ---------------------------------------------------------------------
JS9.Regions.keyDownCB = function(im, ipos, evt, layerName){
    var tact, canvas;
    var tobj = {evt: evt};
    var charCode = evt.which || evt.keyCode;
    // this prevents keypress on FF (and others)
    // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/keydown
    // NB: we still have to preventDefault on specific keys ... see below ...
    // evt.preventDefault();
    layerName = layerName || "regions";
    canvas = im.display.layers[layerName].canvas;
    switch(charCode){
	// backspace and delete
    case 8:
    case 46:
	evt.preventDefault();
	tact = "removeRegion";
	break;
    case 37:
	evt.preventDefault();
	tact = "editRegion";
	tobj.dx = -1;
	break;
    case 38:
	evt.preventDefault();
	tact = "editRegion";
	tobj.dy = 1;
	break;
    case 39:
	evt.preventDefault();
	tact = "editRegion";
	tobj.dx = 1;
	break;
    case 40:
	evt.preventDefault();
	tact = "editRegion";
	tobj.dy = -1;
	break;
    case 68:
	tact = "downRegion";
	break;
    case 85:
	tact = "upRegion";
	break;
    }
    // processing: execute action
    switch(tact){
    case "removeRegion":
	im.removeShapes(layerName, "selected");
	im.clearMessage(layerName);
	// keys need the same callbacks as mouse:up
	canvas.fire("mouse:up");
	break;
    case "editRegion":
	im.changeShapes(layerName, "selected", tobj);
	canvas.fire("mouse:up");
	break;
    case "downRegion":
	im.selectShapes(layerName, "selected", function(obj, group){
	    canvas.sendToBack(obj);
	});
	break;
    case "upRegion":
	im.selectShapes(layerName, "selected", function(obj, group){
	    canvas.bringToFront(obj);
	});
	break;
    }
};

// ---------------------------------------------------------------------
// Magnifier object defines high level calls for magnifier plugin
// ---------------------------------------------------------------------

JS9.Magnifier = {};
JS9.Magnifier.CLASS = "JS9";
JS9.Magnifier.NAME = "Magnifier";

// defaults for magnifier
JS9.Magnifier.opts = {
    // override fabric defaults
    originX: "left",
    originY: "top",
    hasControls: false,
    hasRotatingPoint: false,
    hasBorders: false,
    selectable: false,
    // initial magnifier zoom
    zoom: 4,
    // canvas options
    canvas: {
	selection: false
    },
    // magnifier box colors
    tagcolors: {
	defcolor: "#00FF00"
    }
};

// html used by the magnifier plugin
JS9.Magnifier.HTML =
"<span>" +
"<button type='button' class='JS9Button' onClick='JS9.bcall(this, \"zoomMagnifier\", \"x2\"); return false'>x2</button>" +
"<button type='button' class='JS9Button' onClick='JS9.bcall(this, \"zoomMagnifier\", \"/2\"); return false'>/2</button>" +
"<button type='button' class='JS9Button' onClick='JS9.bcall(this, \"zoomMagnifier\", \""+JS9.Magnifier.opts.zoom+"\"); return false'>"+JS9.Magnifier.opts.zoom+"</button>" +
"</span>";

// JS9 Magnifier constructor
JS9.Magnifier.init = function(width, height){
    // set width and height on div
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width = width || JS9.MAGWIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height = height || JS9.MAGHEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // create DOM canvas element
    this.canvas = document.createElement("canvas");
    // jquery version for event handling and DOM manipulation
    this.canvasjq = $(this.canvas);
    // set class
    this.canvasjq.addClass("JS9Magnifier");
    // required so graphical layers will be on top:
    this.canvasjq.css("z-index", JS9.ZINDEX);
    // how do we allow users to set the size of the canvas??
    // it doesn't go into the CSS and we have no canvas on the Web page ...
    this.canvasjq.attr("width", this.width);
    this.canvasjq.attr("height", this.height);
    // drawing context
    this.context = this.canvas.getContext("2d");
    // turn off anti-aliasing
    if( !JS9.ANTIALIAS ){
	this.context.imageSmoothingEnabled = false;
	this.context.mozImageSmoothingEnabled = false;
	this.context.webkitImageSmoothingEnabled = false;
    }
    // add container with canvas to the high-level div
    this.containerjq = $("<div>")
	.addClass("JS9Container")
	.append(this.canvasjq)
	.appendTo(this.divjq);
    // add magnifier graphics layer to the display
    // the magnifier will be appended to the div of the plugin
    this.display.newShapeLayer("magnifier", JS9.Magnifier.opts, this.divjq);
};

// display the magnified image on the magnifier canvas
JS9.Magnifier.display = function(im, ipos){
    var pos, tval, magDisp, zoom, nx, ny;
    var canvas, sx, sy, sw, sh, dx, dy, dw, dh;
    // sanity check
    // only display if we have a magnifier present
    if(!im || !im.display.pluginInstances.JS9Magnifier ||
       (im.display.pluginInstances.JS9Magnifier.status !== "active")){
	return;
    }
    // image init: add magnifier object to image, if necessary
    if( !im.magnifier ){
	im.magnifier = {zoom: JS9.Magnifier.opts.zoom, posx: 0, posy: 0};
    }
    magDisp = im.display.pluginInstances.JS9Magnifier;
    canvas = im.display.canvas;
    zoom = im.magnifier.zoom;
    sw = Math.floor(magDisp.width / zoom);
    sh = Math.floor(magDisp.height / zoom);
    if( ipos ){
	pos = im.imageToDisplayPos(ipos);
	sx = pos.x - (sw/2);
	sy = pos.y - (sh/2);
	im.magnifier.posx = sx;
	im.magnifier.posy = sy;
    } else {
	sx = im.magnifier.posx;
	sy = im.magnifier.posy;
    }
    // default destination parameters
    dx = 0;
    dy = 0;
    dw = magDisp.canvas.width;
    dh = magDisp.canvas.height;
    // adjust for boundaries
    if( sx < 0 ){
	sw += sx;
	dx -= (sx * zoom);
	dw += (sx * zoom);
	sx = 0;
    }
    tval = (sx + sw) - canvas.width;
    if( tval > 0  ){
	sw -= tval;
	dw = sw * zoom;
    }
    if( sy < 0 ){
	sh += sy;
	dy -= (sy * zoom);
	dh += (sy * zoom);
	sy = 0;
    }
    tval = sy + sh- canvas.height;
    if( tval > 0 ){
	sh -= tval;
	dh = sh * zoom;
    }
    // display magnifier image
    magDisp.context.clear();
    magDisp.context.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
    // stuff we only do once
    if( !im.magnifier.boxid ){
	// add the center point to the magnifier, if necessary
	im.magnifier.boxid = im.addShapes("magnifier", "box");
	// make background black, which looks better at the edge
	$(magDisp.canvas).css("background-color", "black");
    }
    // set size and position based on zoom
    nx = magDisp.width/2;
    ny = magDisp.height/2;
    im.changeShapes("magnifier", im.magnifier.boxid,
	{left: nx, top:  ny, width: zoom, height: zoom});
};

// zoom the rectangle inside the magnifier (RGB) image
// part of magnifier plugin
JS9.Magnifier.zoom = function(im, zval){
    var magnifier, ozoom, nzoom;
    // sanity check
    if( !im || !im.magnifier ){
	return;
    }
    magnifier = im.magnifier;
    // get old zoom
    ozoom = magnifier.zoom;
    // determine new zoom
    switch(zval.charAt(0)){
    case "x":
    case "*":
	nzoom = ozoom * parseFloat(zval.slice(1));
	break;
    case "/":
	nzoom = ozoom / parseFloat(zval.slice(1));
	break;
    default:
	nzoom = parseFloat(zval);
	break;
    }
    // sanity check
    if( !nzoom || (nzoom < 1) ){
	nzoom = 1;
    }
    // set new value
    magnifier.zoom = nzoom;
    // redisplay
    JS9.Magnifier.display(im);
};

// close the magnifier when closing the image 
JS9.Magnifier.close = function(im){
    if( im.display.pluginInstances.JS9Magnifier ){
	im.display.pluginInstances.JS9Magnifier.context.clear();
    }
};

// ---------------------------------------------------------------------
// Panner object defines high level calls for panner plugin
// ---------------------------------------------------------------------

JS9.Panner = {};
JS9.Panner.CLASS = "JS9";
JS9.Panner.NAME = "Panner";

// defaults for panner
JS9.Panner.opts = {
    // override fabric defaults
//    originX: "left",
//    originY: "top",
    hasControls: false,
    hasRotatingPoint: false,
    hasBorders: false,
    // initial panner zoom
    zoom: 4,
    // canvas options
    canvas: {
	selection: true
    },
    // panner box colors
    tagcolors: {
	defcolor: "#00FF00"
    }
};

// html used by the panner plugin
JS9.Panner.HTML =
"<span>" +
"<button type='button' class='JS9Button' onClick='JS9.bcall(this, \"zoomPanner\", \"x2\"); return false'>x2</button>" +
"<button type='button' class='JS9Button' onClick='JS9.bcall(this, \"zoomPanner\", \"/2\"); return false'>/2</button>" +
"<button type='button' class='JS9Button' onClick='JS9.bcall(this, \"zoomPanner\", \"1\"); return false'>Zoom1</button>" +
"<button type='button' class='JS9Button' onClick='JS9.bcall(this, \"panImage\"); return false'>Center</button>" +
"</span>";

// JS9 Panner constructor
JS9.Panner.init = function(width, height){
    var dlayer;
    var that = this;
    // set width and height on div
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = width  || JS9.PANWIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height = height || JS9.PANHEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // create DOM canvas element
    this.canvas = document.createElement("canvas");
    // jquery version for event handling and DOM manipulation
    this.canvasjq = $(this.canvas);
    // set class
    this.canvasjq.addClass("JS9Panner");
    // required so graphical layers will be on top:
    this.canvasjq.css("z-index", JS9.ZINDEX);
    // how do we allow users to set the size of the canvas??
    // it doesn't go into the CSS and we have no canvas on the Web page ...
    this.canvasjq.attr("width", this.width);
    this.canvasjq.attr("height", this.height);
    // drawing context
    this.context = this.canvas.getContext("2d");
    // turn off anti-aliasing
    if( !JS9.ANTIALIAS ){
	this.context.imageSmoothingEnabled = false;
	this.context.mozImageSmoothingEnabled = false;
	this.context.webkitImageSmoothingEnabled = false;
    }
    // add container with canvas to the high-level div
    this.containerjq = $("<div>")
	.addClass("JS9Container")
	.append(this.canvasjq)
	.appendTo(this.divjq);
    // add panner graphics layer to the display
    // the panner will be appended to the div of the plugin
    dlayer = this.display.newShapeLayer("panner", JS9.Panner.opts, this.divjq);
    // add a callback to pan when the panning rectangle is moved
    dlayer.canvas.on("object:modified", function(opts){
	var im = that.display.image;
	if( im ){
	    var pos = opts.target.getCenterPoint();
	    var ix = (pos.x * 
		      im.panner.xblock / im.panner.zoom) + 
		      im.panner.x0 - im.panner.ix;
	    var iy = ((dlayer.canvas.height - pos.y) * 
		      im.panner.yblock / im.panner.zoom) +
		      im.panner.y0 - im.panner.iy;
	    // pan the image
	    try{
		// avoid triggering a re-pan
		im.display.pluginInstances.JS9Panner.status = "inactive";
		// pan image
		im.setPan(ix, iy);
	    }
	    catch(e){JS9.log("couldn't pan image");}
	    finally{im.display.pluginInstances.JS9Panner.status = "active";}
	}
    });
    // display current image in panner
    if( this.display.image ){
	JS9.Panner.display(this.display.image);
    }
};

// create panner (RGB) image from scaled colorCells
// sort of from: saotk/frame/truecolor.c, but not really
// part of panner plugin
JS9.Panner.create = function(im){
    var panDisp, panner, sect, img, val;
    var x0, y0, xblock, yblock;
    var i, j, k, ii, jj, kk;
    var width, height;
    // sanity check
    if( !im || !im.raw || 
	!im.display.pluginInstances.JS9Panner || !im.psColors ){
	return;
    }
    // add panner object to image, if necessary
    if( !im.panner ){
	im.panner = {};
    }
    // init zoom factor, if necessary
    if( !im.panner.zoom ){
	im.panner.zoom = 1;
    }
    // convenience variables
    panDisp = im.display.pluginInstances.JS9Panner;
    panner = im.panner;
    sect = im.primary.sect;
    // size image 
    width = Math.min(im.raw.width, panDisp.width);
    height = Math.min(im.raw.height, panDisp.height);
    // block rgb image to fit into panner window
    panner.xblock = im.raw.width / width;
    panner.yblock = im.raw.height / height;
    if( panner.xblock > panner.yblock ){
	height = height / panner.xblock * panner.yblock;
	panner.yblock = panner.xblock;
    } else if( panner.yblock > panner.xblock ){
	width = width / panner.yblock * panner.xblock;
	panner.xblock = panner.yblock;
    }
    // create an rgb image the same size as the raw data
    // img = im.offscreen.context.createImageData(width, height);
    img = im.display.context.createImageData(width,height);
    // calculate block factors and starting points based on zoom and block
    if( panner.zoom === 1 ){
	xblock = panner.xblock;
	yblock = panner.yblock;
	x0 = 0;
	y0 = 0;
    } else {
	xblock = panner.xblock / panner.zoom;
	yblock = panner.yblock / panner.zoom;
	// x0, y0 is the corner of the section of the image we can display in
	// the panner (we can't display the whole image if we are zoomed).
	x0 = Math.max(0, ((sect.x0 + sect.x1) - (width  * xblock)) / 2);
	y0 = Math.max(0, ((sect.y0 + sect.y1) - (height * yblock)) / 2);
    }
    // save lower limits for display
    panner.x0 = x0;
    panner.y0 = y0;
    // index into scaled data using previously calc'ed data value to get rgb
    for(j=0; j<height; j++){
	jj = Math.floor(y0 + ((height-j-1) * yblock)) * im.raw.width;
	kk = j * width;
	for(i=0; i<width; i++){
	    ii = Math.floor(x0 + (i * xblock));
	    val = im.colorData[ii + jj];
	    if( im.psColors[val] ){
		k = (kk + i) * 4;
		img.data[k]   = im.psColors[val][0];
		img.data[k+1] = im.psColors[val][1];
		img.data[k+2] = im.psColors[val][2];
		img.data[k+3] = 255;
	    }
	}
    }
    // save as panner image
    im.panner.img = img;
    im.panner.ix = 0;
    im.panner.iy = 0;
    return im;
};

// display the magnified image on the magnifier canvas
JS9.Panner.display = function(im){
    var panDisp, panner, sect, tblkx, tblky;
    var obj, nx, ny, nwidth, nheight;
    var FUDGE = 1;
    // sanity check
    // only display if we have a panner present
    if( !im || !im.display.pluginInstances.JS9Panner ||
       (im.display.pluginInstances.JS9Panner.status !== "active") ){
	return;
    }
    // always remake make panner image (might be zooming, for example)
    JS9.Panner.create(im);
    // convenience variables
    panner = im.panner;
    panDisp = im.display.pluginInstances.JS9Panner;
    sect = im.primary.sect;
    // we're done if there is no panner image
    if( !panner.img ){
	return;
    }
    // offsets into display
    if( panner.img.width < panDisp.canvas.width ){
	panner.ix = Math.floor((panDisp.canvas.width - panner.img.width)/2);
    }
    if( panner.img.height < panDisp.canvas.height ){
        panner.iy = Math.floor((panDisp.canvas.height - panner.img.height)/2);
    }
    // clear first
    panDisp.context.clear();
    // draw the image into the context
    panDisp.context.putImageData(panner.img, panner.ix, panner.iy);
    // display panner rectangle
    // convenience variables
    tblkx = panner.zoom / panner.xblock;
    tblky = panner.zoom / panner.yblock;
    // size of rectangle
    // nwidth = sect.width * tblkx / sect.zoom * bin;
    // nheight = sect.height * tblky / sect.zoom * bin;
    nwidth = sect.width * tblkx / sect.zoom;
    nheight = sect.height * tblky / sect.zoom;
    // position of the rectangle
    nx = (sect.x0 - panner.x0) * tblkx + panner.ix;
    ny = (panDisp.height - 1) - ((sect.y1 - panner.y0) * tblky + panner.iy);
    // why is the fudge needed???
    nx  += FUDGE;
    ny  += FUDGE;
    // convert to center pos
    nx += nwidth / 2;
    ny += nheight / 2;
    // nice integer values
    nx = Math.floor(nx);
    ny = Math.floor(ny);
    nwidth = Math.floor(nwidth);
    nheight = Math.floor(nheight);
    obj = {left: nx, top: ny, width: nwidth, height: nheight};
    // create the box
    if( !im.panner.boxid ){
	im.panner.boxid = im.addShapes("panner", "box", obj);
    } else {
	im.changeShapes("panner", im.panner.boxid, obj);
    }
    return im;
};

// zoom the rectangle inside the panner (RGB) image
JS9.Panner.zoom = function(im, zval){
    var panDisp, panner, ozoom, nzoom;
    // sanity check
    if( !im || !im.panner || !im.display.pluginInstances.JS9Panner ){
	return;
    }
    panner = im.panner;
    panDisp = im.display.pluginInstances.JS9Panner;
    // get old zoom
    ozoom = panner.zoom;
    // determine new zoom
    switch(zval.charAt(0)){
    case "*":
    case "x":
    case "X":
	nzoom = Math.min(Math.min(panDisp.width, panDisp.height),
			 ozoom * parseFloat(zval.slice(1)));
	break;
    case "/":
	nzoom = Math.max(1, ozoom / parseFloat(zval.slice(1)));
	break;
    default:
	nzoom = parseFloat(zval);
	break;
    }
    // sanity check
    if( !nzoom || (nzoom < 1) ){
	nzoom = 1;
    }
    panner.zoom = nzoom;
    // redisplay the panner
    JS9.Panner.display(im);
    return im;
};

// close the panner
JS9.Panner.close = function(im){
    if( im.display.pluginInstances.JS9Panner ){
	im.display.pluginInstances.JS9Panner.context.clear();
    }
    return im;
};

// ---------------------------------------------------------------------
// Catalogs object defines high level calls for catalog plugin
// Mostly replaced by a call to newShapeLayer() and addShapes(),
// leaving on the options
// ---------------------------------------------------------------------

JS9.Catalogs = {};
JS9.Catalogs.CLASS = "JS9";
JS9.Catalogs.NAME = "Catalogs";

// defaults for new catalogs
JS9.Catalogs.opts = {
    // override fabric defaults
    hasControls: false,
    hasRotatingPoint: false,
    hasBorders: false,
    selectable: false,
    evented: false,
    // canvas options
    canvas: {
	selection: false
    },
    // pan and zoom enabled
    panzoom: true,
    // default shape
    shape: "circle",
    // general
    strokeWidth: 2,
    // box
    width: 10,
    height: 10,
    // circle
    radius: 5,
    // ellipse:
    eradius: {x: 5, y: 3},
    // angles (box, ellipse)
    angle: 0,
    // these should be ordered from more specific to less specific
    tagcolors: {
	defcolor:            "#00FF00"
    }
};

// ---------------------------------------------------------------------
// Misc. Utilities
// ---------------------------------------------------------------------

// http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible/#1608546
// Invoke new operator with arbitrary arguments
// Holy Grail pattern
JS9.invoke = function(constructor, args){
    var f;
    function F() {
        // constructor returns **this**
        return constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;
    f = new F();
    f.constructor = constructor;
    return f;
};

// javascript: the good parts p. 22
if( typeof Object.create !== "function" ){
    Object.create = function(o){
	var F = function(){return;};
	F.prototype = o;
	return new F();
    };
}

// return a unique value for a given image id by appending <n> to the id
JS9.getImageID = function(imid, dispid){
    var i, im, s;
    var ids = 0;
    var idmax = 1;
    var imlen = JS9.images.length;
    var rexp = /.*<([0-9][0-9]*)>$/;
    for(i=0; i<imlen; i++){
	im = JS9.images[i];
	if( im.display.id === dispid ){
	    if( imid === im.oid ){
		if( im.id.search(rexp) >= 0 ){
		    s = im.id.replace(rexp, "$1");
		    idmax = Math.max(idmax, parseInt(s, 10));
		}
		ids++;
	    }
	}
    }
    if( ids ){
	return imid + "<" + String(idmax+1) + ">";
    }
    return imid;
};

// return a unique value for ids
JS9.uniqueID = (function(){
    var id = 1; // initial value
    return function() {
        return id++;
    };
}());

// list event handlers
JS9.listev = function(s){
    s = s || "body";
    var elem = $(s)[0];
    var data = $.hasData(elem) && $._data(elem);
    JS9.log(data.events);
};

// change cursor to waiting/not waiting
JS9.waiting = function(mode){
    switch(mode){
    case true:
	$("body").addClass("waiting");
	break;
    case false:
	$("body").removeClass("waiting");
	break;
    }
};

// create a light window
// someday we might want other options ...
JS9.lightWin = function(id, type, s, title, opts){
    switch(JS9.LIGHTWIN){
    case "dhtml":
        return dhtmlwindow.open(id, type, s, title, opts);
    default:
	break;
    }
};

// wrapper for new function to avoid jslint errors
JS9.checkNew = function(obj){
    if( !obj ){
	JS9.error("internal failure in a JS9 constructor");
    }
};

// desperate attempt to regularize the control/meta key
JS9.specialKey = function(e){
    return (e.metaKey || e.ctrlKey);
};

// desperate attempt to regularize the stracktrace message
JS9.strace = function(e){
    var s = "";
    if( JS9.DEBUG > 1 ){
	s = e.stack || e.stacktrace || "";
    }
    return s;
};

// call a js9 routine from a button in the panner/magnifier plugin toolbar
// the plugin instantiation saves the display id in the toolbar div
JS9.bcall = function(which, cmd, arg1){
    var dispid, im;
    // The button plugintoolbar div has data containing the id of the display
    dispid = $(which).closest("div[class^=JS9PluginToolbar]").data("displayid");
    if( dispid ){
	im = JS9.getImage(dispid);
    } else {
	JS9.error("can't find display for cmd: "+cmd);
    }
    if( !im ){
	JS9.error("can't find image for cmd: "+cmd);
    }
    switch(cmd){
    case "zoomPanner":
	if( arguments.length < 3 ){
	    JS9.error("missing argument(s) for cmd: "+cmd);
	}
	try{
	    JS9.Panner.zoom(im, arg1);
	} catch(e){
	    JS9.error("error calling zoomPanner()", e);
	}
	break;
    case "zoomMagnifier":
	if( arguments.length < 3 ){
	    JS9.error("missing argument(s) for cmd: "+cmd);
	}
	try{
	    JS9.Magnifier.zoom(im, arg1);
	} catch(e){
	    JS9.error("error calling zoomMagnifier()", e);
	}
	break;
    case "panImage":
	try{
	    im.setPan();
	} catch(e){
	    JS9.error("error calling setPan()", e);
	}
	break;
    default:
        break;
    }
};

// calculate centroid for a polygon
// wont work for self-interecting polygons but that's all I do right now!
// adapted from: http://en.wikipedia.org/wiki/Centroid
JS9.centroidPolygon = function(points){
    var i, plen, factor, area;
    var cx, cy;
    var parta=0, partx=0, party=0;
    var totx=0, toty=0;
    var doaverage=true;
    var pts = [];
    // sanity check
    if( !points || !points.length ){
	return;
    }
    // get points
    plen = points.length;
    // just average the points?
    if( doaverage ){
	for(i=0; i<plen; i++){
	    totx += points[i].x;
	    toty += points[i].y;
	}
	return {x: totx / plen, y: toty / plen};
    }
    // copy point array so we can duplicate first point as last array element
    for(i=0; i<plen; i++){
	pts[i] = {};
	pts[i].x = points[i].x;
	pts[i].y = points[i].y;
    }
    pts[plen] = {};
    pts[plen].x = pts[0].x;
    pts[plen].y = pts[0].y;
    // calculate centroid
    for(i=0; i<plen; i++){
	factor = (pts[i].x * pts[i+1].y) - (pts[i+1].x * pts[i].y);
	parta += factor;
	partx += (pts[i].x + pts[i+1].x) * factor;
	party += (pts[i].y + pts[i+1].y) * factor;
    }
    area = parta / 2.0;
    cx = partx / (area * 6.0);
    cy = party / (area * 6.0);
    // return centroid position 
    return {x: cx, y: cy};
};

// return the image for the specified image name
JS9.lookupImage = function(id, display){
    var i; 
    var im=null, tim=null, ilen= JS9.images.length;
    // look for a file
    for(i=0; i<ilen; i++){
	tim = JS9.images[i];
	if( (id === tim ) || 
	    (id === tim.file) || (id === (JS9.TOROOT + tim.file)) ||
	    (tim.fitsFile && (id === tim.fitsFile)) ){
	    // make sure the display still exists (light windows disappear)
	    if( $("#"+tim.display.id).length > 0 ){
		if( !display || (display === tim.display.id) ){
		    im = tim;
		    break;
		}
	    }
	}
    }
    return im;
};

// return the display for the specified id
// id can be a display object or an id from a display object    
JS9.lookupDisplay = function(id){
    var i;
    var regexp = new RegExp(sprintf("[-_]?(%s)$", JS9.PLUGINS));
    if( id && (id !== "*") && (id.toString().search(JS9.SUPERMENU) < 0) ){
	// look for whole id
	for(i=0; i<JS9.displays.length; i++){
	    if( (id === JS9.displays[i]) || (id === JS9.displays[i].id) ){
		return JS9.displays[i];
	    }
	}
	// try removing id suffix to get base id 
	if( typeof id === "string" ){
	    id = id.replace(regexp,"");
	    for(i=0; i<JS9.displays.length; i++){
		if( (id === JS9.displays[i]) || (id === JS9.displays[i].id) ){
		    return JS9.displays[i];
		}
	    }
	}
	// an id was specified but not found: this is an error
	JS9.error("can't find JS9 display with id: " + id);
    }
    // no id: return whatever we have
    return JS9.displays[0];
};

// return the image object for the specified image id or display id
JS9.getImage = function(id){
    var im=null, display=null;
    // first look for an image file
    im = JS9.lookupImage(id);
    // then look for a display id
    if( !im ){
	display = JS9.lookupDisplay(id);
	// return associated image, if possible
	if( display ){
	    im = display.image;
	}
    }
    return im;
};

// process a list of file objects or blobs
JS9.onFileList = function(files, options, handler){
    var i;
    var dofits = function(file, options, handler){
	if( JS9.fits.handleFITSFile ){
	    if( file.name ){
		options.filename = file.name;
	    }
	    JS9.fits.handleFITSFile(file, options, handler);
	} else {
	    JS9.error("no FITS module available to load FITS file");
	}
    };
    for(i=0; i<files.length; i++){
	if( files[i].type.indexOf("image/") !== -1 ){
	    switch(files[i].type){
	    case "image/fits":
		dofits(files[i], options, handler);
		break;
	    default:
		JS9.handleImageFile(files[i], options, handler);
		break;
	    }
	} else {
	    dofits(files[i], options, handler);
	}
    }

};

// fetch a file URL (as a blob) and process it
// (as of 2/2015: can't use $.ajax to retrieve a blob, so use low-level xhr)
JS9.fetchURL = function(name, url, opts, handler) {
    var xhr = new XMLHttpRequest();
    var topts;
    if( !url ){
	url = name;
	name = /([^\\\/]+)$/.exec(url)[1];
    }
    topts = $.extend(true, {}, opts, JS9.fits.options);
    xhr.open('GET', url, true);
    if( opts.responseType ){
	xhr.responseType = opts.responseType;
    } else {
	xhr.responseType = 'blob';
    }
    xhr.onload = function(e) {
	var blob;
        if( this.readyState === 4 ){
	    if( this.status === 200 || this.status === 0 ){
		if( xhr.responseType === "blob" ){
	            blob = new Blob([this.response]);
		    blob.name = name;
		    JS9.onFileList([blob], topts, handler);
		} else {
		    if( opts.display ){
			handler(this.response, opts, {display: opts.display});
		    } else {
			handler(this.response, opts);
		    }
		}
	    } else if( this.status === 404 ) {
		JS9.error("could not find " + url);
	    } else {
		JS9.error("can't load: " + url + " (" + this.status + ")");
	    }
	}
    };
    xhr.onerror = function(e) {
	JS9.error("can't load: " + url);
    };
    xhr.onreadystatechange=function() {
        // any response from the server will do
	if( xhr.xtimeout ){
	    clearTimeout(xhr.xtimeout);
	    delete xhr.xtimeout;
	}
    };
    try{ xhr.send(); }
    catch(e){ JS9.error("request to load " + url + " failed", e); }
    // set a timeout to catch when Mac ignores the connect request entirely
    xhr.xtimeout=setTimeout(function(){
	JS9.error("timeout while waiting for response from server; " + 
		  url + " might not exist");
    }, JS9.globalOpts.xtimeout);
};

// configure or return the fits library
JS9.fitsLibrary = function(s){
    var t;
    if( !s ){
	return JS9.fits.name;
    }
    t = s.toLowerCase();
    switch(t){
    case "fitsy":
	JS9.fits = Fitsy;
	JS9.fits.datahandler(JS9.NewFitsImage);
	JS9.fits.options = JS9.userOpts.fits || JS9.fits.options || {};
	break;
    case "astroem":
    case "cfitsio":
	JS9.fits = Astroem;
	// set up default options
	JS9.fits.options = JS9.fits.options || {};
	JS9.fits.options.handler = JS9.NewFitsImage;
	if( JS9.userOpts.fits ){
	    JS9.fits.options.extlist =  JS9.userOpts.fits.extlist;
	    JS9.fits.options.table = {
		// size of extracted image
		nx: JS9.userOpts.fits.table.nx,
		ny: JS9.userOpts.fits.table.ny
	    };
	} else {
	    JS9.fits.options.extlist =  JS9.globalOpts.extlist;
	    JS9.fits.options.table = {
		// size of extracted image
		nx: JS9.globalOpts.dims[0],
		ny: JS9.globalOpts.dims[1]
	    };
	}
	if( JS9.fits.maxFITSMemory && JS9.globalOpts.maxMemory ){
	    JS9.fits.maxFITSMemory(JS9.globalOpts.maxMemory);
	}
	break;
    default:
	JS9.error("unknown fits library: " + s);
	break;
    }
    // common code
    JS9.fits.name = t;
    JS9.fits.options.error = JS9.error;
    JS9.fits.options.waiting = JS9.waiting;
    return t;
};

// load an image (jpeg, png, etc)
// taken from fitsy.js
JS9.handleImageFile = function(file, options, handler){
    options = $.extend(true, {}, options, JS9.fits.options);
    if ( handler === undefined ) { handler = JS9.Load; }
    var reader = new FileReader();
    reader.onload = function(ev){
	var img = new Image();
	img.src = ev.target.result;
	img.onload = function(){
	    var x, y, brightness;
	    var i = 0;
	    var canvas = document.createElement('canvas');
	    var ctx    = canvas.getContext('2d');
	    var h      = img.height;
	    var w      = img.width;
	    canvas.width  = w;
	    canvas.height = h;
	    ctx.drawImage(img, 0, 0);
	    var data   = ctx.getImageData(0, 0, w, h).data;
	    var gray   = new Float32Array(h*w);
	    for ( y = 0; y < h; y++ ) {
		for ( x = 0; x < w; x++ ) {
		    // NTSC
		    brightness = 0.299 * data[i] +
			         0.587 * data[i + 1] +
			         0.114 * data[i + 2];
		    gray[(h - y) * w + x] = brightness;
		    i += 4;
		}
	    }
	    var hdu = {head: {}, name: file.name, filedata: gray,
		       naxis: 2, axis: [0, w, h], bitpix: -32,
		       data: gray};
	    hdu.dmin = Number.MAX_VALUE;
	    hdu.dmax = Number.MIN_VALUE;
	    for(i=0; i< h*w; i++){
		hdu.dmin = Math.min(hdu.dmin, hdu.data[i]);
		hdu.dmax = Math.max(hdu.dmax, hdu.data[i]);
	    }
	    handler(hdu, options);
	};
    };
    reader.readAsDataURL(file);
};

// return the specified colormap object (or default)
JS9.lookupColormap = function(name){
    var i;
    if( !name ){
	name = JS9.imageOpts.colormap;
    }
    if( name ){
	for(i=0; i<JS9.colormaps.length; i++){
	    if( JS9.colormaps[i].name === name ){
		return JS9.colormaps[i];
	    }
	}
    }
    JS9.error("unknown colormap '" + name + "'");
};

// lookup command
JS9.lookupCommand = function(name){
    var cmd, i, n;
    if( name ){
	n = name.toLowerCase();
	for(i=0; i<JS9.commands.length; i++){
	    cmd = JS9.commands[i];
	    if( (cmd.name  === n) || (cmd.alias === n) || (cmd.alias2 === n) ){
		return cmd;
	    }
	}
    }
    return null;
};

// error message handler
JS9.error = function(emsg, epattern, dothrow){
    var e, earr, s;
    var emessage="";
    var stack = "";
    var doerr = true;

    // reset wait cursor
    JS9.waiting(false);
    // second args can be error pattern to look for, or else an error object
    if( typeof epattern === "string" ){
	earr = emsg.match(epattern);
	if( earr ){
	    if( earr[1] ){
		emsg = earr[1];
	    } else if( earr[0] ){
		emsg = earr[0];
	    }
	} else {
	    doerr = false;
	}
    } else if( typeof epattern === "object" ){
	e = epattern;
    }
    // default is to throw the error
    if( arguments.length < 3 ){
	dothrow = true;
    }
    // maybe throw error and send message to user
    if( doerr ){
	// add error object message to emsg, if possible
	if( e && e.message ){
	    emsg += sprintf(" (%s)", e.message);
	} else if( emsg ){
	    e = new Error(emsg);
	}
	// try to add stacktrace
	s = JS9.strace(e);
	if( s ){
	    stack = "\n\nStacktrace:\n" + s;
	}
	// this can be set "outside" to prevent the alert message
	// (for example, in the console window)
	if( JS9.globalOpts.alerts ){
	    if( emsg && typeof emsg === "string" && emsg.search(/ERROR/) < 0 ){
		emessage = "JS9 ERROR: ";
	    }
	    emessage += emsg + stack;
	    alert(emessage);
	}
	// throw error, if necessary
	if( dothrow ){
	    throw e;
	}
    }
};

// get position of mouse in a canvas
// http://stackoverflow.com/questions/1114465/getting-mouse-location-in-canvas
JS9.eventToDisplayPos = function(evt){
    //this section is from http://www.quirksmode.org/js/events_properties.html
    var targ;
    var pageX, pageY, x, y;
    var XFUDGE = 1;
    var YFUDGE = 1;
    if( !evt ){
	evt = window.event;
    }
    if( evt.target ){
        targ = evt.target;
    } else if( evt.srcElement ){
        targ = evt.srcElement;
    }
    if( targ.nodeType === 3 ){ // defeat Safari bug
        targ = targ.parentNode;
    }
    // changed touch events: take position from first finger
    if( evt.originalEvent &&
	evt.originalEvent.changedTouches &&
	evt.originalEvent.changedTouches.length ){
	pageX = evt.originalEvent.changedTouches[0].pageX;
	pageY = evt.originalEvent.changedTouches[0].pageY;
    } else {
	// mouse events
	pageX = evt.pageX;
	pageY = evt.pageY;
    }
    // jQuery normalizes the pageX and pageY
    // pageX,Y are the mouse positions relative to the document
    // offset() returns the position of the element relative to the document
    x = pageX - $(targ).offset().left;
    y = pageY - $(targ).offset().top;
    // return {"x": x, "y": y};
    // FUDGE added after visual inspection of line512 at zoom 32
    // I tried to place the mouse, and have the magnifier be in the right place
    // Linux, FF & Chrome: x=1, y=1 (5/28/14)
    return {"x": Math.floor(x - XFUDGE), "y": Math.floor(y - YFUDGE)};
};

// http://stackoverflow.com/questions/13695317/rotate-a-point-around-another-point
// angle is input in degrees
JS9.rotatePoint = function(point, angle, cen)
{
    var cosA, sinA;
    cen = cen || {x: 0.0, y: 0.0};
    angle = Math.PI * angle / 180.0;
    cosA = Math.cos(angle);
    sinA = Math.sin(angle);
    return {
        x: (cosA * (point.x - cen.x) - sinA * (point.y - cen.y) + cen.x),
	y: (sinA * (point.x - cen.x) + cosA * (point.y - cen.y) + cen.y)
    };
};

// logging: IE9 does not expose console.log by default
// from: http://stackoverflow.com/questions/5472938/does-ie9-support-console-log-and-is-it-a-real-function (but modified for JSLint)
JS9.log = function(){
    if( (window.console !== undefined) && (window.console.log !== undefined) ){
        try {
            console.log.apply(console, arguments);
        } catch(e){
            var log = Function.prototype.bind.call(console.log, console);
            log.apply(console, arguments);
        }
    }
};

JS9.isNumber = function(s) {
    return !isNaN(parseFloat(s)) && isFinite(s);
};

JS9.cardpars = function(card){
    var name, value;
    if ( card[8] !== "=" ){ return undefined; }
    name = card.slice(0, 8).trim();
    value = card.slice(10).replace(/\'/g, " ").replace(/\/.*/, "").trim();
    if( value === "T" ){
	value = true;
    } else if( value === "F" ){
	value = false;
    } else if( JS9.isNumber(value) ){
	value = parseFloat(value);
    }
    return [name, value];
};

// convert obj to FITS-style string
JS9.raw2FITS = function(raw, forDisplay){
    var i, obj, key, val, card;
    var hasend=false;
    var t="";
    if( raw.card ){
	// raw.card has comments, so use this if we are displaying header
	for(i=0; i<raw.card.length; i++){
	    card = raw.card[i];
	    t += card;
	    if( card.substring(0,4) === "END " ){
		hasend = true;
	    }
	    if( forDisplay ){
		t += "\n";
	    }
	}
    } else if( raw.cardstr ){
	// raw.cardstr has comments, so use this if we are displaying header
	for(i=0; i<raw.ncard; i++){
	    card = raw.cardstr.slice(i*80, (i+1)*80);
	    t += card;
	    if( card.substring(0,4) === "END " ){
		hasend = true;
	    }
	    if( forDisplay ){
		t += "\n";
	    }
	}
    } else if( raw.header ){
	// minimal header without comments
	obj = raw.header;
	for( key in obj ){
	    if( obj.hasOwnProperty(key) ){
		if( key === "js9Protocol" || key === "js9Endian" ){
		    continue;
		}
		if( key === "END" ){
		    hasend = true;
		}
		val = obj[key];
		if( val === true ){
		    val = "T";
		}
		t += sprintf("%-8s%-2s%-70s", key, "=", val);
		if( forDisplay ){
		    t += "\n";
		}
	    }
	}
    }
    // add end card, if necessary
    if( !hasend ){
	t += sprintf("%-8s%-72s", "END", " ");
	if( forDisplay ){
	    t += "\n";
	}
    }
    return t;
};

// clear canvas
// http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
CanvasRenderingContext2D.prototype.clear = 
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform){
    if (preserveTransform){
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (preserveTransform){
      this.restore();
    }           
};


// http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
// our modification will execute a real function or a functionName
JS9.xeqByName = function(functionName, context /*, args */) {
    var i, args, namespaces, func, type;
    args = Array.prototype.slice.call(arguments, 2);
    type = typeof functionName;
    switch( type ){
    case "function":
	return functionName.apply(context, args);
    case "string":
	namespaces = functionName.split(".");
	func = namespaces.pop();
	for(i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
	}
	return context[func].apply(context, args);
    default:
	JS9.error("unknown function type: "+type);
	break;
    }
};

// load a prefs file and integrate preferences into global JS9 object
JS9.loadPrefs = function(url, doerr) {
    // load site/user preferences synchronously
    $.ajax({
      url: url,
      dataType: "json",
	async: false,
      success: function(obj, textStatus, jqXHR){
	var otype, jtype, name;
	// merge preferences with js9 objects and data
	for( name in obj ){
	    if( obj.hasOwnProperty(name) && JS9.hasOwnProperty(name) ){
		jtype = typeof JS9[name]; 
		otype = typeof obj[name];
		if( (jtype === otype) || (otype === "string") ){
		    switch(jtype){
		    case "object":
			if( $.isArray(obj[name]) ){
			    // arrays get replaced completely
			    JS9[name] = obj[name];
			} else {
			    // objects get recursively extended
			    $.extend(true, JS9[name], obj[name]);
			}
			break;
		    case "number":
		    case "string":
			JS9[name] = obj[name];
			break;
		    default:
			break;
		    }
		} 
	    }
	}
      },
      error:  function(jqXHR, textStatus, errorThrown){
	if( doerr ){	       
	    if( (JS9.BROWSER[0] === "Chrome") && (document.domain === "") ){
		JS9.log("When using the file:// URI, Chrome must be run with the --allow-file-access-from-files switch to permit JS9 to access the preference file.");
	    } else {
		JS9.log("JS9 prefs file not available: %s", url);
	    }
	}
      }
    }); 
};

// is this object a typed array?
JS9.isTypedArray = function(obj) {
    var type;
    var types = {
        "[object Int8Array]": true,
        "[object Uint8Array]": true,
        "[object Uint8ClampedArray]": true,
        "[object Int16Array]": true,
        "[object Uint16Array]": true,
        "[object Int32Array]": true,
        "[object Uint32Array]": true,
        "[object Float32Array]": true,
        "[object Float64Array]": true
    };
    type = Object.prototype.toString.call(obj);
    return types.hasOwnProperty(type);
};

// ---------------------------------------------------------------------
// global event handlers
// ---------------------------------------------------------------------

// mousedown: assumes display obj is passed in evt.data
JS9.mouseDownCB = function(evt){
    var pname, pinst, popts, pos, ipos;
    var display = evt.data;
    var im = display.image;
    evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    if( JS9.DEBUG > 2 ){
	JS9.log("m-down: %d %d %d %s", 
		evt.clientX-display.x, evt.clientY-display.y, 
		im.evstate, im.rclick);
    }
    // get canvas position
    pos = JS9.eventToDisplayPos(evt);
    // get image position
    ipos = im.displayToImagePos(pos);
    // save for mouseup check
    im.dnpos = pos;
    // inside a region, clear region display and return;
    if( im.rclick ){
	// clear the region layer
	im.clearMessage("regions");
	return;
    }
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	for( pname in display.pluginInstances ){
	    if( display.pluginInstances.hasOwnProperty(pname) ){
		pinst = display.pluginInstances[pname];
		popts = pinst.plugin.opts;
		if( pinst.isActive("onmousedown") ){
		    if( !im.rclick || popts.mousedownRegions ){
			try{ popts.onmousedown.call(pinst, im, ipos,
					        evt.originalEvent || evt); }
			catch(e){ pinst.errLog("onmousedown", e); }
		    }
		}
	    }
	}
    }
    im.evstate = evt.button;
    if( evt.originalEvent && 
	evt.originalEvent.touches &&
	evt.originalEvent.touches.length ){
	im.evstate = evt.originalEvent.touches.length - 2;
    }
    $("body").on("mousemove", display, 
		 function(evt){return JS9.mouseMoveCB(evt);});
    $("body").on("mouseup", display,
		 function(evt){return JS9.mouseUpCB(evt);});
};

// mouseup: assumes display obj is passed in evt.data
JS9.mouseUpCB = function(evt){
    var pos, ipos, pname, pinst, popts;
    var display = evt.data;
    var im = display.image;
    evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    // get canvas position
    pos = JS9.eventToDisplayPos(evt);
    // image position
    ipos = im.displayToImagePos(pos);
    // inside a region, update region string
    if( im.rclick ){
	if( im.dnpos &&
	    ((Math.abs(im.dnpos.x-pos.x) < JS9.NOMOVE)  &&
	     (Math.abs(im.dnpos.y-pos.y) < JS9.NOMOVE)) ){
	    im.updateShapes("regions", "selected", "select");
	} else {
	    im.updateShapes("regions", "selected", "update");
	}
    } else {
	// outside a region: special key means pan if the mouse didn't move much
	if( JS9.specialKey(evt) && im.dnpos &&
	    ((Math.abs(im.dnpos.x-pos.x) < JS9.NOMOVE)  &&
	     (Math.abs(im.dnpos.y-pos.y) < JS9.NOMOVE)) ){
	    im.setPan(ipos.x, ipos.y);
	}
    }
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	for( pname in display.pluginInstances ){
	    if( display.pluginInstances.hasOwnProperty(pname) ){
		pinst = display.pluginInstances[pname];
		popts = pinst.plugin.opts;
		if( pinst.isActive("onmouseup") ){
		    if( !im.rclick || popts.mouseupRegions ){
			try{ popts.onmouseup.call(pinst, im, ipos,
						  evt.originalEvent || evt); }
			catch(e){ pinst.errLog("onmouseup", e); }
		    }
		}
	    }
	}
    }
    // safe to unset rclick now
    im.rclick = 0;
    im.evstate = -1;
    $("body").off("mouseup");
    $("body").off("mousemove");
    if( JS9.DEBUG > 2 ){
	JS9.log("m-up: %d %d %s", 
		evt.clientX-display.x, evt.clientY-display.y, im.rclick);
    }
};

// mousemove: assumes display obj is passed in evt.data
JS9.mouseMoveCB = function(evt){
    var pos, ipos, pname, pinst, popts, sel;
    var display = evt.data;
    var im = display.image;
    evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    // get canvas position
    pos = JS9.eventToDisplayPos(evt);
    // get image position
    ipos = im.displayToImagePos(pos);
    // reset the valpos object
    im.valpos = null;
    if( JS9.DEBUG > 3 ){
	JS9.log("m-move: %d %d %s %s", 
		evt.clientX-display.x, evt.clientY-display.y,
		im.rclick, im.evstate);
    }
    if( im.rclick ){
	im.rclick = 2;
	sel = im.display.layers.regions.params.sel;
	if( sel ){
	    if( im.params.listonchange || sel.params.listonchange ){
		im.updateShape("regions", sel, null, "update", true);
		im.listRegions("selected", 2);
	    }
	}
    }
    // process mouse event
    switch(im.evstate){
    case -1:
	// display value/pos, etc.
	if( (ipos.x > 0) && (ipos.y > 0) &&
	    (ipos.x < im.raw.width) && (ipos.y < im.raw.height) ){
	    if( !JS9.specialKey(evt) ){
		// display pixel and wcs values, like a plugin, but not really
		if( JS9.globalOpts.internalValPos ){ 
		    // cache the valpos object, in case a plugin wants it
		    im.valpos = im.updateValpos(ipos);
		}
		// plugin callbacks
		for( pname in display.pluginInstances ){
		    if( display.pluginInstances.hasOwnProperty(pname) ){
			pinst = display.pluginInstances[pname];
			popts = pinst.plugin.opts;
			if( pinst.isActive("onmousemove") ){
			    if( !im.rclick || popts.mousemoveRegions ){
				try{ popts.onmousemove.call(pinst, im, ipos,
						evt.originalEvent || evt); }
				catch(e){ pinst.errLog("onmousemove", e); }
			    }
			}
		    }
		}
	    }
	}
	break;
    case 0:
    case 1:
	// inside a region or with special key: no contrast/bias
	if( im.rclick || JS9.specialKey(evt) ){
	    return;
	}
	// if we haven't moved much from the start, just return
	if( im.dnpos &&
	    ((Math.abs(im.dnpos.x-pos.x) < JS9.NOMOVE)  &&
	     (Math.abs(im.dnpos.y-pos.y) < JS9.NOMOVE)) ){
	    return;
	}
	// contrast/bias change
	ipos.x= Math.floor(pos.x + 0.5);
	ipos.y= Math.floor(pos.y + 0.5);
	if( (ipos.x < 0) || (ipos.y < 0) || 
	    (ipos.x >= display.canvas.width) || 
	    (ipos.y >= display.canvas.height) ){
	    return;
	}
	im.params.bias = ipos.x / display.canvas.width;
	im.params.contrast = ipos.y / display.canvas.height * 10.0;
	// work-around for FF bug, not fixed as of 8/8/2012
        // https://bugzilla.mozilla.org/show_bug.cgi?id=732621
	if( JS9.bugs.firefox_linux ){
	    window.setTimeout(function(){
		im.displayImage("scaled");
	    }, 0);
	} else {
	    im.displayImage("scaled");
	}
	break;
    default:
	break;
    }
};

// mouseover: assumes display obj is passed in evt.data
JS9.mouseOverCB = function(evt){
    var pos, ipos, pname, pinst, popts;
    var display = evt.data;
    var im = display.image;
    evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    // set focus
    im.display.displayConjq.focus();
    // change cursor
    // document.body.style.cursor = "crosshair";
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	// get canvas position
	pos = JS9.eventToDisplayPos(evt);
	// get image position
	ipos = im.displayToImagePos(pos);
	// plugin callbacks
	for( pname in display.pluginInstances ){
	    if( display.pluginInstances.hasOwnProperty(pname) ){
		pinst = display.pluginInstances[pname];
		popts = pinst.plugin.opts;
		if( pinst.isActive("onmouseover") ){
		    if( !im.rclick || popts.mouseoverRegions ){
			try{ popts.onmouseover.call(pinst, im, ipos,
						    evt.originalEvent || evt); }
			catch(e){ pinst.errLog("onmouseover", e); }
		    }
		}
	    }
	}
    }
};

// mouseover: assumes display obj is passed in evt.data
JS9.mouseOutCB = function(evt){
    var pos, ipos, pname, pinst, popts;
    var display = evt.data;
    var im = display.image;
    evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    // unset focus
    im.display.displayConjq.blur();
    // change cursor
    // document.body.style.cursor = "default";
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	// get canvas position
	pos = JS9.eventToDisplayPos(evt);
	// get image position
	ipos = im.displayToImagePos(pos);
	// plugin callbacks
	for( pname in display.pluginInstances ){
	    if( display.pluginInstances.hasOwnProperty(pname) ){
		pinst = display.pluginInstances[pname];
		popts = pinst.plugin.opts;
		if( pinst.isActive("onmouseout") ){
		    if( !im.rclick || popts.mouseoutRegions ){
			try{ popts.onmouseout.call(pinst, im, ipos,
						   evt.originalEvent || evt); }
			catch(e){ pinst.errLog("onmouseout", e); }
		    }
		}
	    }
	}
    }
};

// keypress: assumes display obj is passed in evt.data
// in case you are wondering: you can't move the mouse via javascript!
// http://stackoverflow.com/questions/4752501/move-the-mouse-pointer-to-a-specific-position
JS9.keyPressCB = function(evt){
    var pos, ipos;
    var pname, pinst, popts;
    var display = evt.data;
    var im = display.image;
    var keycode = evt.which || evt.keyCode;
    evt.preventDefault();
    if( JS9.DEBUG > 3 ){
	JS9.log("keypress: %d ",  keycode);
    }
    // get canvas position
    pos = JS9.eventToDisplayPos(evt);
    // get image position
    ipos = im.displayToImagePos(pos);
    // plugin callbacks
    for( pname in display.pluginInstances ){
	if( display.pluginInstances.hasOwnProperty(pname) ){
	    pinst = display.pluginInstances[pname];
	    popts = pinst.plugin.opts;
	    if( pinst.isActive("onkeypress") ){
		try{ popts.onkeypress.call(pinst, im, ipos,
					   evt.originalEvent || evt); }
		catch(e){ pinst.errLog("onkeypress", e); }
	    }
	}
    }
};

// keydown: assumes display obj is passed in evt.data
// in case you are wondering: you can't move the mouse via javascript!
// http://stackoverflow.com/questions/4752501/move-the-mouse-pointer-to-a-specific-position
JS9.keyDownCB = function(evt){
    var pos, ipos;
    var pname, pinst, popts;
    var display = evt.data;
    var im = display.image;
    var keycode = evt.which || evt.keyCode;
    // this prevents keypress on FF (and others)
    // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/keydown
    // evt.preventDefault();
    if( JS9.DEBUG > 3 ){
	JS9.log("keydown: %d ",  keycode);
    }
    // get canvas position
    pos = JS9.eventToDisplayPos(evt);
    // get image position
    ipos = im.displayToImagePos(pos);
    // plugin callbacks
    for( pname in display.pluginInstances ){
	if( display.pluginInstances.hasOwnProperty(pname) ){
	    pinst = display.pluginInstances[pname];
	    popts = pinst.plugin.opts;
	    if( pinst.isActive("onkeydown") ){
		try{ popts.onkeydown.call(pinst, im, ipos,
					  evt.originalEvent || evt); }
		catch(e){ pinst.errLog("onkeydown", e); }
	    }
	}
    }
    // fire keydown for keyboard-enabled layer, if necessary
    if( im.layer && im.layers[im.layer].opts.usekeyboard ){
	JS9.Regions.keyDownCB(im, ipos, evt, im.layer);
    }
};

JS9.dragenter = function(id, e){
    e.stopPropagation();
    e.preventDefault();
};

JS9.dragover = function(id, e){
    e.stopPropagation();
    e.preventDefault();
};

JS9.dragexit = function(id, e){
    e.stopPropagation();
    e.preventDefault();
};

JS9.dragdrop = function(id, e, handler){
    var files = e.target.files || e.dataTransfer.files;
    var opts = $.extend(true, {}, JS9.fits.options);
    e.stopPropagation();
    e.preventDefault();
    if( opts.display === undefined ){ opts.display = id; }
    if( opts.extlist === undefined ){ opts.extlist = JS9.globalOpts.extlist; }
    JS9.onFileList(files, opts, handler);
};

// ---------------------------------------------------------------------
// special event handlers
// ---------------------------------------------------------------------

// console keydown: assumes console obj is passed in evt.data
JS9.consoleKeyDownCB = function(evt){
    var v;
    var obj = evt.data;
    var keycode = evt.which || evt.keyCode;
    // history idea and basic algorithm from goosh.org, 
    // to whom grateful acknowledgement is made
    // this prevents keypress on FF (and others)
    // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/keydown
    // evt.preventDefault();
    if( JS9.specialKey(evt) ){
	return;
    }
    v = obj.consoleConjq.find(".JS9CmdIn:last");
    v.focus();
    if(obj.hist.length && ((keycode===38) || (keycode===40))){
	if( obj.hist[obj.histpos] ){
	    obj.hist[obj.histpos] = v.val();
	} else {
	    obj.histtemp = v.val();
	}
	switch(keycode){
	case  38:
	    obj.histpos--;
	    if( obj.histpos < 0 ){
		obj.histpos = 0;
	    }
	    break;
	case 40:
	    obj.histpos++;
	    if( obj.histpos > obj.hist.length ){
		obj.histpos = obj.hist.length;
	    }
	    break;
	default:
	    JS9.error("internal keycode switch mixup");
	}
	if( obj.hist[obj.histpos] ){
	    v.val(obj.hist[obj.histpos]);
	    // mark history as being used
	    if( obj.histpos !== obj.hist.length){
		obj.histused = true;
	    } else {
		// except for the current input line
		obj.histused = false;
	    }
	} else {
	    v.val(obj.histtemp);
	    obj.histused = false;
	}
    }
    // xeq command when new-line is pressed and re-init
    if( keycode === 13 ){
	// turn off alerts to user
	JS9.globalOpts.alerts = false;
	obj.xeq();
	// turn on alerts to user
	JS9.globalOpts.alerts = true;
	obj.inp();
    }
};

// ---------------------------------------------------------------------
// plugin support
// ---------------------------------------------------------------------

// add a plugin definition. Plugins will initialized after document is loaded
JS9.RegisterPlugin = function(xclass, xname, func, opts){
    var name;
    // sanity check
    if( !xclass || !xname || !func ){
	return;
    }
    // first and last name of plugin
    name = xclass + xname;
    // massage the opts a bit
    if( opts ){
	if( opts.viewMenuItem ){
	    opts.menuItem = opts.viewMenuItem;
	}
	// default is view menu
	if( opts.menuItem && !opts.menu ){
	    opts.menu = "view";
	}
	if( opts.menu ){
	    opts.menu = opts.menu.toLowerCase();
	}
    } else {
	opts = [];
    }
    // save the plugin root name as part of a regexp
    if( JS9.PLUGINS ){
	JS9.PLUGINS += "|";
    }
    JS9.PLUGINS += name.replace(/JS9/, "");
    // save the plug-in
    JS9.plugins.push({xclass: xclass, xname: xname, name: name,
		opts: opts, func: func, instances: []});
    // save help, if necessry
    if( opts.help ){
	var m, type, url, title;
	m = opts.help.match(/^.*[\\\/]/);
	if( m[0] ){
	    type = "plugins/" + m[0].replace(/[\\\/]+$/, "");
	}
	url = opts.help.replace(/^.*[\\\/]/, "");
	if( opts.menuItem ){
	    title = opts.menuItem;
	} else {
	    title = name;
	}
	JS9.helpOpts[xname] = {type: type, url: url, 
			       heading: xclass, title: title};
    }
};

// create a new plugin instance, attached to the specified element
JS9.instantiatePlugin = function(el, plugin, winhandle, args){
    var i, tplugin, instance, divid, divjq, pdivjq, html, ndiv;
    // if plugin is a string, get plugin object by name
    if( typeof plugin === "string" ){
	for(i=0; i<JS9.plugins.length; i++){
	    tplugin = JS9.plugins[i];
	    if( tplugin.name === plugin ){
		plugin = tplugin;
		break;
	    }
	}
	// did we find it?
	if( typeof plugin === "string" ){
	    JS9.error("unknown plugin: " + plugin);
	}
    }
    // create an object inheriting the constructor prototype
    instance = Object.create(plugin.func.prototype);
    // save full name
    instance.name = plugin.name;
    // routine to tell is this instance active
    instance.isActive = function(cbname){
	if( this.status !== "active" ){
	    return false;
	}
	if( !this.plugin.opts.hasOwnProperty(cbname) ){
	    return false;
	}
	switch(this.winType){
	case "virtual":
	    return true;
	default:
	    return this.divjq.is(":visible");
	}
    };
    // routine to log error
    instance.errLog = function(cbname, e){
	JS9.log("error in %s: %s [%s]\n%s", 
		cbname, this.name, e.message, JS9.strace(e));
    };
    // save the div as a jquery object
    if( el ){
	if( el instanceof jQuery ){
	    divjq = el;
	} else if( typeof el === "object" ){
	    divjq = $(el);
	} else {
	    divjq = $("#"+el);
	}
	// if we already have created this instance, we are done
	for(i=0; i<plugin.instances.length; i++){
	    if( divjq.is(plugin.instances[i].odivjq) ){
		return plugin.instances[i];
	    }
	}
    } else {
	divjq = $("div");
    }
    // save returned light id and type ("virtual", "light", "div")
    if( !el ){
	// save id
	instance.id = plugin.name;
	// save type
	instance.winType = "virtual";
    } else if( winhandle ){
	// save id
	instance.id = divjq.attr("id") || plugin.name;
	// save type
	instance.winType = "light";
	instance.winHandle = winhandle;
	// this is the original div
	instance.odivjq = divjq;
	// this is the div that the instance sees
	instance.divjq = divjq;
	// the light window is the the outer div
	instance.outerdivjq = instance.divjq.closest(JS9.lightOpts[JS9.LIGHTWIN].top);
    } else {
	// save id
	instance.id = divjq.attr("id") || plugin.name;
	// save type
	instance.winType = "div";
	divid = divjq.attr("id") || "JS9Plugin";
	// wrap the target div in a container div
	divjq.wrap("<div class='JS9PluginContainer'>");
	// this is the original div
	instance.odivjq = divjq;
	// this is the div that the instance sees
	instance.divjq = divjq;
	// add classes for easier CSS specification
	instance.divjq.addClass(plugin.xclass+"Plugin").addClass("JS9Plugin");
	// the wrapper plugincontainer is the the outer div
	instance.outerdivjq = instance.divjq.closest(".JS9PluginContainer");
	// add the toolbar to the container, if necessary
	if( plugin.opts.toolbarSeparate || divjq.data("toolbarseparate") ){
	    ndiv = "<div class='" + JS9.lightOpts[JS9.LIGHTWIN].dragBar + "'>"; 
	    $(ndiv).insertBefore(instance.divjq);
	}
    }
    // backlink this instance into the plugin
    instance.plugin = plugin;
    // save original el so we know we have done this one
    instance.el = el;
    // mark as valid for display and execution
    // undefined => not created,  or "active" or "inactive"
    instance.status = "active";
    // save this instance globally
    plugin.instances.push(instance);
    // for virtual plugins, instantiate and backlink into all displays
    if( instance.winType === "virtual" ){
	for(i=0; i<JS9.displays.length; i++){
	    // look for displays to which we have not yet added this plugin
	    if( !JS9.displays[i].pluginInstances[plugin.name] ){
		// fake this display
		instance.div = null;
		instance.display = JS9.displays[i];
		// instantiate
		plugin.func.apply(instance, args);
		// backlink
		JS9.displays[i].pluginInstances[plugin.name] = instance;
	    }
	}
    } else {
	// instantiate and backlink into the display
	// div the old-fashioned way
	instance.div = instance.divjq[0];
	instance.outerdiv = instance.outerdivjq[0];
	// set width and height on div that instance sees
	if( plugin.opts.winDims ){
	    // if either of these is not set, set size to defaults
	    // as it turns out, sometimes one of them can be a tiny value (2)
	    // when you still want to set the defaults. not sure why ...
	    if( !instance.divjq.width()  || !instance.divjq.height() ){
		instance.divjq.css("width", plugin.opts.winDims[0]);
		instance.divjq.css("height", plugin.opts.winDims[1]);
	    }
	}
	// find the display for this plugin, using data-tid or instance id
	divid = instance.divjq.data("js9id") || instance.id;
	instance.display = JS9.lookupDisplay(divid);
	// add the toolbar content, if necessary
	html = divjq.data("toolbarhtml") || plugin.opts.toolbarHTML;
	if( html ){
	    // macro expand so we can add title automatically
	    html = JS9.Image.prototype.expandMacro.call(null, html,
		[{"name": "title", "value": plugin.opts.winTitle || ""}]);
	    pdivjq = instance.divjq.closest(JS9.lightOpts[JS9.LIGHTWIN].drag);
	    if( pdivjq.length === 0 ){
		pdivjq = instance.divjq;
	    }
	    // add html to toolbar
	    // add the display id to the toolbar, so buttons can find it
	    $("<div class='JS9PluginToolbar-"+instance.winType+"'>")
		.css("z-index", JS9.BTNZINDEX)
		.html(html)
		.data("displayid", instance.display.id)
		.insertAfter(pdivjq);
	}
	// backlink this instance into the display
	instance.display.pluginInstances[plugin.name] = instance;
	// call the init routine (usually a constructor) 
	// on entry, these elements have already been defined in the context:
	// this.div:      the DOM element representing the div for this plugin
	// this.divjq:    the jquery object representing the div for this plugin
	// this.id:       the id of the div (or the plugin name as a default)
	// this.plugin: plugin class object (user opts in opts subobject)
	// this.winType:  "div" (in-page div) or "light" (from view menu)
	// this.winHandle: handle returned from light window create routine
	// this.display:  the display object associated with this plugin
	// this.status: "active" or "inactive" or undefined
	plugin.func.apply(instance, args);
    }
    // return the instance
    return instance;
};

// instantiate all plugins -- can be called repeatedly if new divs are added
JS9.instantiatePlugins = function(){
    var i;
    var newPlugin = function(plugin){
	// instantiate any divs not yet done
	$('div.' + plugin.name).each(function(){
	    // new instance of this div-based plugin
	    JS9.instantiatePlugin($(this), plugin, null, plugin.opts.divArgs);
	});
	// if we have a non-visible plugin (no menu and no window dims)
	// that is not instantiated, instantiate it now (e.g. regions)
	if( !plugin.opts.menuItem && plugin.opts.winDims &&
	    !plugin.opts.winDims[0] && !plugin.opts.winDims[1] ){
	        JS9.instantiatePlugin(null, plugin, null, plugin.opts.divArgs);
	}
    };
    for(i=0; i<JS9.plugins.length; i++){
	newPlugin(JS9.plugins[i]);
    }
};

// ---------------------------------------------------------------------
// the init routine to start up JS9
// ---------------------------------------------------------------------

JS9.init = function(){
    var uopts;
    // check for HTML5 canvas, which we need
    if( !window.HTMLCanvasElement ){
	JS9.error("sorry: your browser does not support JS9 (no HTML5 canvas support). Try a modern version of Firefox, Chrome, or Safari.");
    }
    // check for JSON, which we need
    if( !JSON ){
	JS9.error("sorry: your browser does not support JS9 (no JSON support). Try a modern version of Firefox, Chrome, or Safari.");
    }
    // get relative location of installed js9.css file
    // which tells us where other files and dirs are located
    if( !JS9.INSTALLDIR ){
	try{ 
	    JS9.INSTALLDIR = $('link[href$="js9.css"]')
		.attr("href")
		.replace(/js9\.css$/, "") || "";
	} catch(e){
	    JS9.INSTALLDIR = "";
	}
	JS9.TOROOT = JS9.INSTALLDIR.replace(/([^\/.])+/g, "..");
    }
    if( window.hasOwnProperty("Kinetic") && !window.hasOwnProperty("fabric") ){
	JS9.error("please load fabric.js instead of Kinetic.js");
    }
    // set up sizes, if not already done (i.e. in Web page or prefs file)
    JS9.WIDTH = JS9.WIDTH || 512;	        // width of js9 canvas
    JS9.HEIGHT = JS9.HEIGHT || 512;		// height of js9 canvas
    JS9.INFOWIDTH = JS9.INFOWIDTH || 345;	// width of js9Info box
    JS9.INFOHEIGHT = JS9.INFOHEIGHT || 265;	// height of js9Info box
    JS9.MENUWIDTH = JS9.MENUWIDTH || JS9.WIDTH;	// width of js9Menubar
    JS9.MENUHEIGHT = JS9.MENUHEIGHT || "auto";	// height of js9Menubar
    JS9.CONWIDTH = JS9.CONWIDTH || JS9.WIDTH;	// width of js9Console
    JS9.CONHEIGHT = JS9.CONHEIGHT || 180;	// height of js9Console
    JS9.MAGWIDTH = JS9.MAGWIDTH || JS9.WIDTH/2;	// width of js9Mag canvas
    JS9.MAGHEIGHT = JS9.MAGHEIGHT || JS9.HEIGHT/2; // height of js9Mag canvas
    JS9.PANWIDTH = JS9.PANWIDTH || 320;		// width of js9Pan canvas
    JS9.PANHEIGHT = JS9.PANHEIGHT || 320;	// height of js9Pan canvas
    JS9.DS9WIDTH = JS9.DS9WIDTH || 250;		// width of small js9Pan canvas
    JS9.DS9HEIGHT = JS9.DS9HEIGHT || 250;	// height of small js9Pan canvas
    // set up the dynamic drive html window
    if( JS9.LIGHTWIN === "dhtml" ){
	// Creation of dhtmlwindowholder was done by a document.write in 
	// dhtmlwindow.js. We removed it from dhtmlwindow.js file because it 
	// intefered with the jquery search for js9.css above. Oh boy ...
	// But it has to be somewhere!
	$("<div>")
	    .attr("id", "dhtmlwindowholder")
	    .appendTo($(document.body))
	    .append("<span style='display:none'>.</span>");
	// support callbacks after the dhtml window has been created
	$("#dhtmlwindowholder").bind('DOMNodeInserted', function(e) {
	    var func = JS9.globalOpts.dhtmlonload;
	    var id = JS9.globalOpts.dhtmlloadid;
	    if( func && (id === $(e.target).attr("id")) ){
		// only once per dhtml window creation
		delete JS9.globalOpts.dhtmlonload;
		delete JS9.globalOpts.dhtmlloadid;
		// slight delay, just in case!
		window.setTimeout(function(){
		    func.call(null);
		}, JS9.TIMEOUT);
	    }
	});
	// reset dynamic drive images location
	dhtmlwindow.imagefiles=[JS9.InstallDir("images/min.gif"), 
				JS9.InstallDir("images/close.gif"), 
				JS9.InstallDir("images/restore.gif"), 
				JS9.InstallDir("images/resize.gif")];
    }
    // set this to false in the page to avoid loading a prefs file
    if( JS9.PREFSFILE ){
	// load site preferences, if possible
	JS9.loadPrefs(JS9.InstallDir(JS9.PREFSFILE), 1);
	// load page preferences, if possible
	JS9.loadPrefs(JS9.PREFSFILE, 0);
    }
    // reset protocol for file:
    if( JS9.globalOpts.helperProtocol === "file:" ){
	JS9.globalOpts.helperProtocol = "http:";
    }
    // add suffix
    JS9.globalOpts.helperProtocol += "//";
    // replace with global opts with user opts, if necessary
    if( window.hasOwnProperty("localStorage") ){
	uopts = localStorage.getItem("images");
	if( uopts ){
	    try{ JS9.userOpts.images = JSON.parse(uopts); }
	    catch(ignore){}
	    if( JS9.userOpts.images ){
		$.extend(true, JS9.imageOpts, JS9.userOpts.images);
	    }
	}
	uopts = localStorage.getItem("regions");
	if( uopts ){
	    try{ JS9.userOpts.regions = JSON.parse(uopts); }
	    catch(ignore){}
	    if( JS9.userOpts.regions ){
		$.extend(true, JS9.Regions.opts, JS9.userOpts.regions);
	    }
	}
	// this gets replaced below
	uopts = localStorage.getItem("fits");
	if( uopts ){
	    try{ JS9.userOpts.fits = JSON.parse(uopts); }
	    catch(ignore){}
	}
   }
    // set debug flag
    JS9.DEBUG = JS9.DEBUG || JS9.globalOpts.debug || 0;
    // initialize astronomy emscripten routines (wcslib, etc), if possible
    if( window.hasOwnProperty("Astroem") ){
	JS9.initwcs = Astroem.initwcs;
	JS9.wcsinfo = Astroem.wcsinfo;
	JS9.wcssys = Astroem.wcssys;
	JS9.wcsunits = Astroem.wcsunits;
	JS9.pix2wcs = Astroem.pix2wcs;
	JS9.wcs2pix = Astroem.wcs2pix;
	JS9.reg2wcs = Astroem.reg2wcs;
	JS9.saostrtod = Astroem.saostrtod;
	JS9.saodtype = Astroem.saodtype;
	JS9.zscale = Astroem.zscale;
    }
    // configure fits library
    if( window.hasOwnProperty("Fitsy") ){
	JS9.fitsLibrary("fitsy");
	JS9.fits = Fitsy;
    } else if( window.hasOwnProperty("Astroem") ){
	JS9.fitsLibrary("cfitsio");
	JS9.fits = Astroem;
    }
    // init primary display(s)
    $("div.JS9").each(function(){
	JS9.checkNew(new JS9.Display($(this)));
    });
    // register core plugins
    JS9.RegisterPlugin("JS9", "Menubar", JS9.Menubar);
    JS9.RegisterPlugin("JS9", "Info", JS9.Info.init,
		       {menuItem: "InfoBox",
			plugindisplay: JS9.Info.clearMain,
			winTitle: "JS9 Info",
			winResize: true,
			winDims: [JS9.INFOWIDTH, JS9.INFOHEIGHT]});
    JS9.RegisterPlugin("JS9", "Console", JS9.Console,
		       {menuItem: "Console",
			winTitle: "JS9 Console",
			winResize: true,
			winDims: [JS9.WIDTH, 180]});
    JS9.RegisterPlugin(JS9.Regions.CLASS, JS9.Regions.NAME, JS9.Regions.init,
		       {onkeydown:  JS9.Regions.keyDownCB, 
			divArgs: ["regions"],
			winDims: [0, 0]});
    JS9.RegisterPlugin(JS9.Magnifier.CLASS, JS9.Magnifier.NAME, 
		       JS9.Magnifier.init,
		       {menuItem: "Magnifier",
			toolbarSeparate: false,
			toolbarHTML: JS9.Magnifier.HTML,
			onmousemove: JS9.Magnifier.display,
			onimageclose: JS9.Magnifier.close,
			winTitle: "JS9 Magnifier",
			winDims: [JS9.MAGWIDTH, JS9.MAGHEIGHT],
			divArgs: [JS9.DS9WIDTH, JS9.DS9HEIGHT]});
    JS9.RegisterPlugin(JS9.Panner.CLASS, JS9.Panner.NAME, JS9.Panner.init,
		       {menuItem: "Panner",
			toolbarSeparate: false,
			toolbarHTML: JS9.Panner.HTML,
			onimagedisplay: JS9.Panner.display,
			onimageclose: JS9.Panner.close,
			winTitle: "JS9 Panner",
			winDims: [JS9.PANWIDTH, JS9.PANHEIGHT],
			divArgs: [JS9.DS9WIDTH, JS9.DS9HEIGHT]});
    // find divs associated with each plugin and run the constructor
    JS9.instantiatePlugins();
    // load colormaps
    JS9.checkNew(new JS9.Colormap("grey",
	[[0,0], [1,1]],
	[[0,0], [1,1]],
	[[0,0], [1,1]]));
    JS9.checkNew(new JS9.Colormap("red",
	[[0,0], [1,1]],
	[[0,0], [0,0]],
	[[0,0], [0,0]]));
    JS9.checkNew(new JS9.Colormap("green",
	[[0,0], [0,0]],
	[[0,0], [1,1]],
	[[0,0], [0,0]]));
    JS9.checkNew(new JS9.Colormap("blue",
	[[0,0], [0,0]],
	[[0,0], [0,0]],
	[[0,0], [1,1]]));
    JS9.checkNew(new JS9.Colormap("a",
	[[0,0], [0.25,0], [0.5,1], [1,1]],
	[[0,0], [0.25,1], [0.5,0], [0.77,0], [1,1]],
	[[0,0], [0.125,0], [0.5, 1], [0.64,0.5], [0.77, 0], [1,0]]));
    JS9.checkNew(new JS9.Colormap("b",
	[[0,0], [0.25,0], [0.5,1], [1,1]],
	[[0,0], [0.5,0], [0.75,1], [1,1]],
	[[0,0], [0.25,1], [0.5,0], [0.75,0], [1,1]]));
    JS9.checkNew(new JS9.Colormap("bb",
	[[0,0], [0.5,1], [1,1]],
	[[0,0], [0.25,0], [0.75,1], [1,1]], 
	[[0,0], [0.5,0], [1,1]]));
    JS9.checkNew(new JS9.Colormap("he",
    [[0,0], [0.015,0.5], [0.25,0.5], [0.5,0.75], [1,1]], 
    [[0,0], [0.065,0], [0.125,0.5], [0.25,0.75], [0.5,0.81], [1,1]], 
    [[0,0], [0.015,0.125], [0.03,0.375], [0.065,0.625], [0.25,0.25], [1,1]]));
    JS9.checkNew(new JS9.Colormap("i8",
	[[0,0,0], [0,1,0], [0,0,1], [0,1,1],
	[1,0,0], [1,1,0], [1,0,1], [1,1,1]]));
    JS9.checkNew(new JS9.Colormap("aips0",
[[0.196,0.196,0.196], [0.475,0,0.608], [0,0,0.785], [0.373,0.655,0.925], [0,0.596,0], [0,0.965,0], [1,1,0], [1,0.694,0], [1,0,0]]));
    JS9.checkNew(new JS9.Colormap("sls",
[[0, 0, 0], [0.043442, 0, 0.052883], [0.086883, 0, 0.105767], [0.130325, 0, 0.158650], [0.173767, 0, 0.211533], [0.217208, 0, 0.264417], [0.260650, 0, 0.317300], [0.304092, 0, 0.370183], [0.347533, 0, 0.423067], [0.390975, 0, 0.475950], [0.434417, 0, 0.528833], [0.477858, 0, 0.581717], [0.521300, 0, 0.634600], [0.506742, 0, 0.640217], [0.492183, 0, 0.645833], [0.477625, 0, 0.651450], [0.463067, 0, 0.657067], [0.448508, 0, 0.662683], [0.433950, 0, 0.668300], [0.419392, 0, 0.673917], [0.404833, 0, 0.679533], [0.390275, 0, 0.685150], [0.375717, 0, 0.690767], [0.361158, 0, 0.696383], [0.346600, 0, 0.7020], [0.317717, 0, 0.712192], [0.288833, 0, 0.722383], [0.259950, 0, 0.732575], [0.231067, 0, 0.742767], [0.202183, 0, 0.752958], [0.173300, 0, 0.763150], [0.144417, 0, 0.773342], [0.115533, 0, 0.783533], [0.086650, 0, 0.793725], [0.057767, 0, 0.803917], [0.028883, 0, 0.814108], [0, 0, 0.824300], [0, 0.019817, 0.838942], [0, 0.039633, 0.853583], [0, 0.059450, 0.868225], [0, 0.079267, 0.882867], [0, 0.099083, 0.897508], [0, 0.118900, 0.912150], [0, 0.138717, 0.926792], [0, 0.158533, 0.941433], [0, 0.178350, 0.956075], [0, 0.198167, 0.970717], [0, 0.217983, 0.985358], [0, 0.237800, 1], [0, 0.268533, 1], [0, 0.299267, 1], [0, 0.330, 1], [0, 0.360733, 1], [0, 0.391467, 1], [0, 0.422200, 1], [0, 0.452933, 1], [0, 0.483667, 1], [0, 0.514400, 1], [0, 0.545133, 1], [0, 0.575867, 1], [0, 0.606600, 1], [0, 0.631733, 0.975300], [0, 0.656867, 0.950600], [0, 0.682000, 0.925900], [0, 0.707133, 0.901200], [0, 0.732267, 0.876500], [0, 0.757400, 0.851800], [0, 0.782533, 0.827100], [0, 0.807667, 0.802400], [0, 0.832800, 0.777700], [0, 0.857933, 0.7530], [0, 0.883067, 0.728300], [0, 0.908200, 0.703600], [0, 0.901908, 0.676675], [0, 0.895617, 0.649750], [0, 0.889325, 0.622825], [0, 0.883033, 0.595900], [0, 0.876742, 0.568975], [0, 0.870450, 0.542050], [0, 0.864158, 0.515125], [0, 0.857867, 0.488200], [0, 0.851575, 0.461275], [0, 0.845283, 0.434350], [0, 0.838992, 0.407425], [0, 0.832700, 0.380500], [0, 0.832308, 0.354858], [0, 0.831917, 0.329217], [0, 0.831525, 0.303575], [0, 0.831133, 0.277933], [0, 0.830742, 0.252292], [0, 0.830350, 0.226650], [0, 0.829958, 0.201008], [0, 0.829567, 0.175367], [0, 0.829175, 0.149725], [0, 0.828783, 0.124083], [0, 0.828392, 0.098442], [0, 0.828000, 0.072800], [0.033167, 0.834167, 0.066733], [0.066333, 0.840333, 0.060667], [0.099500, 0.846500, 0.054600], [0.132667, 0.852667, 0.048533], [0.165833, 0.858833, 0.042467], [0.199000, 0.865000, 0.036400], [0.232167, 0.871167, 0.030333], [0.265333, 0.877333, 0.024267], [0.298500, 0.883500, 0.018200], [0.331667, 0.889667, 0.012133], [0.364833, 0.895833, 0.006067], [0.398000, 0.902000, 0], [0.430950, 0.902000, 0], [0.463900, 0.902000, 0], [0.496850, 0.902000, 0], [0.529800, 0.902000, 0], [0.562750, 0.902000, 0], [0.595700, 0.902000, 0], [0.628650, 0.902000, 0], [0.661600, 0.902000, 0], [0.694550, 0.902000, 0], [0.727500, 0.902000, 0], [0.760450, 0.902000, 0], [0.793400, 0.902000, 0], [0.810617, 0.897133, 0.003983], [0.827833, 0.892267, 0.007967], [0.845050, 0.887400, 0.011950], [0.862267, 0.882533, 0.015933], [0.879483, 0.877667, 0.019917], [0.896700, 0.872800, 0.023900], [0.913917, 0.867933, 0.027883], [0.931133, 0.863067, 0.031867], [0.948350, 0.858200, 0.035850], [0.965567, 0.853333, 0.039833], [0.982783, 0.848467, 0.043817], [1, 0.843600, 0.047800], [0.995725, 0.824892, 0.051600], [0.991450, 0.806183, 0.055400], [0.987175, 0.787475, 0.059200], [0.982900, 0.768767, 0.063000], [0.978625, 0.750058, 0.066800], [0.974350, 0.731350, 0.070600], [0.970075, 0.712642, 0.074400], [0.965800, 0.693933, 0.078200], [0.961525, 0.675225, 0.082000], [0.957250, 0.656517, 0.085800], [0.952975, 0.637808, 0.089600], [0.948700, 0.619100, 0.093400], [0.952975, 0.600408, 0.085617], [0.957250, 0.581717, 0.077833], [0.961525, 0.563025, 0.070050], [0.965800, 0.544333, 0.062267], [0.970075, 0.525642, 0.054483], [0.974350, 0.506950, 0.046700], [0.978625, 0.488258, 0.038917], [0.982900, 0.469567, 0.031133], [0.987175, 0.450875, 0.023350], [0.991450, 0.432183, 0.015567], [0.995725, 0.413492, 0.007783], [1, 0.394800, 0], [0.998342, 0.361900, 0], [0.996683, 0.329000, 0], [0.995025, 0.296100, 0], [0.993367, 0.263200, 0], [0.991708, 0.230300, 0], [0.990050, 0.197400, 0], [0.988392, 0.164500, 0], [0.986733, 0.131600, 0], [0.985075, 0.098700, 0], [0.983417, 0.065800, 0], [0.981758, 0.032900, 0], [0.980100, 0, 0], [0.955925, 0, 0], [0.931750, 0, 0], [0.907575, 0, 0], [0.883400, 0, 0], [0.859225, 0, 0], [0.835050, 0, 0], [0.810875, 0, 0], [0.786700, 0, 0], [0.762525, 0, 0], [0.738350, 0, 0], [0.714175, 0, 0], [0.690, 0, 0], [0.715833, 0.083333, 0.083333], [0.741667, 0.166667, 0.166667], [0.767500, 0.250, 0.250000], [0.793333, 0.333333, 0.333333], [0.819167, 0.416667, 0.416667], [0.845000, 0.500, 0.500000], [0.870833, 0.583333, 0.583333], [0.896667, 0.666667, 0.666667], [0.922500, 0.750, 0.750000], [0.948333, 0.833333, 0.833333], [0.974167, 0.916667, 0.916667], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]]));
    JS9.checkNew(new JS9.Colormap("hsv", (function(){
	var i, frac, h, s, v, f, p, q, t, ii;
	var a = [];
	var cur = 0;
	var size = 200;
	for(i=0; i<size; i++, cur++){
	    // generate in hsv
	    frac = 1.0 - (i / (size - 1.0));
	    h = frac * 360.0 + 270.0;
	    s = Math.abs(Math.sin(frac * 3.1416));
	    v = Math.pow((1.0 - frac), (1.0 / 3.0));
	    // convert to rgb
	    while( h >= 360.0 ){
		h -= 360.0;
	    }
	    h /= 60.0;
	    ii = Math.floor(h);
	    f = h - ii;
	    p = v * (1 - s);
	    q = v * (1 - s*f);
	    t = v * (1 - s * (1.0 - f));
	    a[cur] = [];
	    switch (ii){
	    case 0:
		a[cur].push(v);
		a[cur].push(t);
		a[cur].push(p);
		break;
	    case 1:
		a[cur].push(q);
		a[cur].push(v);
		a[cur].push(p);
		break;
	    case 2:
		a[cur].push(p);
		a[cur].push(v);
		a[cur].push(t);
		break;
	    case 3:
		a[cur].push(p);
		a[cur].push(q);
		a[cur].push(v);
		break;
	    case 4:
		a[cur].push(t);
		a[cur].push(p);
		a[cur].push(v);
		break;
	    case 5:
		a[cur].push(v);
		a[cur].push(p);
		a[cur].push(q);
		break;
	    default:
		break;
	    }
	}
	return a;}())));
    JS9.checkNew(new JS9.Colormap("heat",
	[[0,0], [0.34,1], [1,1]],
	[[0,0], [1,1]],
	[[0,0], [0.65,0], [0.98,1], [1,1]]));
    JS9.checkNew(new JS9.Colormap("cool",
	[[0,0], [0.29,0], [0.76,0.1], [1,1]],
	[[0,0], [0.22,0], [0.96,1], [1,1]], 
	[[0,0], [0.53,1], [1,1]]));
    JS9.checkNew(new JS9.Colormap("rainbow",
	[[0,1], [0.2,0], [0.6,0], [0.8,1], [1,1]], 
	[[0,0], [0.2,0], [0.4,1], [0.8,1], [1,0]], 
	[[0,1], [0.4,1], [0.6,0], [1,0]]));
    JS9.checkNew(new JS9.Colormap("standard",
	[[0,0], [0.333,0.3], [0.333,0], [0.666,0.3], [0.666,0.3], [1,1]], 
	[[0,0], [0.333,0.3], [0.333,0.3], [0.666,1], [0.666,0], [1,0.3]], 
	[[0,0], [0.333,1], [0.333,0], [0.666,0.3], [0.666,0], [1,0.3]]));
    JS9.checkNew(new JS9.Colormap("staircase", (function(){
	var ii, kk;
	var a = [];
	var cur = 0;
	for(ii=1; ii<=5; ii++, cur++){
            kk = ii/5.0;
	    a[cur] = [];
	    a[cur].push(kk * 0.3);
	    a[cur].push(kk * 0.3);
	    a[cur].push(kk);
	}
	for(ii=1; ii<=5; ii++, cur++){
            kk = ii/5.0;
	    a[cur] = [];
	    a[cur].push(kk * 0.3);
	    a[cur].push(kk);
	    a[cur].push(kk * 0.3);
	}
	for(ii=1; ii<=5; ii++, cur++){
            kk = ii/5.0;
	    a[cur] = [];
	    a[cur].push(kk);
	    a[cur].push(kk * 0.3);
	    a[cur].push(kk * 0.3);
	}
	return a;}())));
    JS9.checkNew(new JS9.Colormap("color",
[[0,0,0], [0.18431, 0.18431, 0.18431], [0.37255, 0.37255, 0.37255], [0.56078, 0.56078, 0.56078], [0.74902, 0.74902, 0.74902], [0.93725, 0.93725, 0.93725], [0, 0.18431, 0.93725], [0, 0.37255, 0.74902], [0, 0.49804, 0.49804], [0, 0.74902, 0.30980], [0, 0.93725, 0], [0.30980, 0.62353, 0], [0.49804, 0.49804, 0], [0.62353, 0.30980, 0], [0.93725, 0, 0], [0.74902, 0, 0.30980]]));
    // load commands
    JS9.checkNew(new JS9.Command({
	name: "analysis", 
	alias: "run",
	help: "list/run analysis for current image",
	get: function(){
	    var i, j, n, t, tasks;
	    var result="";
	    var im = this.image;
	    if( im && im.analysisPackages ){
		for(j=0; j<im.analysisPackages.length; j++){
		    tasks = im.analysisPackages[j];
		    for(i=0; i<tasks.length; i++){
			t = tasks[i];
			if( result ){
			    result += ", ";
			}
			n = t.xclass ? (t.xclass + ":" + t.name) : t.name;
			result += sprintf("%s (%s)", t.title, n);
		    }
		    if( j < (im.analysisPackages.length-1) ){
			result += "\n";
		    }
		}
	    }
	    return result;
	},
	set: function(args){
	    var a, did;
	    var im = this.image;
	    if( !im ){
		return;
	    }
	    a = im.lookupAnalysis(args[0]);
	    if( a ){
		if( a.purl ){
		    did = im.displayAnalysis("params",
					     JS9.InstallDir(a.purl), 
					     a.title+": "+im.fitsFile);
		    // save info for running the task
		    $(did).data("dispid", im.display.id)
			.data("aname", a.name);
		} else {
		    // else run task directly
		    im.runAnalysis(a.name);
		}
	    } else {
		JS9.error("unknown analysis command '" + args[0] + "'");
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "colormap", 
	alias: "cmap",
	help: "set/get colormap for current image",
	get: function(){
	    var res;
	    var im = this.image;
	    if( im ){
		res = im.getColormap();
		return sprintf("%s %s %s",
			       res.colormap, res.contrast, res.bias);
	    }
	},
	set: function(args){
	    var im = this.image;
	    if( im ){
		im.setColormap.apply(im, args);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "colormaps", 
	alias: "cmaps",
	help: "get list of available colormaps",
	get: function(){
	    var i;
	    var msg="";
	    for(i=0; i<JS9.colormaps.length; i++){
		if( msg ){
		    msg += ", ";
		}
		msg += JS9.colormaps[i].name;
	    }
	    return msg;
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "help", 
	help: "get list of available commmands",
	get: function(){
	    var i, cmd, msg;
	    msg = "<table>";
	    for(i=0; i<JS9.commands.length; i++){
		cmd = JS9.commands[i];
		msg += "<tr><td>" + cmd.name + "</td><td>" + cmd.help;
		if( cmd.alias ){
		    msg += " (" + cmd.alias;
		    if( cmd.alias2 ){
		      msg += ", " + cmd.alias2;
		    }
		    msg += ")";
		}
		msg += "</td></tr>";
	    }
	    msg += "</table>";
	    return msg;
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "helper", 
	help: "get/set helper connection",
	get: function(){
	    return JS9.helper.connectinfo();
	},
	set: function(args){
	    JS9.helper.connect(args[0].trim());
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "image", 
	help: "get name of currently loaded image or display specified image",
	get: function(){
	    var im = this.image;
	    if( im ){
		return im.file;
	    }
	},
	set: function(args){
	    var i, im;
	    for(i=0; i<JS9.images.length; i++){
		im = JS9.images[i];
		if( im.file.search(args[0]) >=0 ){
		    if( im.display === this.display ){
			im.displayImage("display");
			return;
		    }
		}
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "images", 
	help: "get list of currently loaded images",
	get: function(){
	    var i, im, msg="";
	    for(i=0; i<JS9.images.length; i++){
		im = JS9.images[i];
		if( im.display === this.display ){
		    if( msg ){
			msg += ", ";
		    }
		    msg += im.file;
		}
	    }
	    return msg;
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "load", 
	help: "load image(s)",
	set: function(args){
	    var i;
	    for(i=0; i<args.length; i++){
		JS9.Load(args[i], {display: this.display.id});
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "pan", 
	help: "set/get pan location for current image",
	get: function(){
	    var res;	    
	    var im = this.image;
	    if( im ){
		res = im.getPan();
		return sprintf("%s %s", res.x, res.y);
	    }
	},
	set: function(args){
	    var im = this.image;
	    if( im ){
		im.setPan.apply(im, args);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "pix2wcs", 
        help: "get image pixel value for specified wcs position",
	set: function(args){
	    var res;
	    var im = this.image;
	    if( im ){
		res = JS9.Pix2WCS(im, args[0], args[1]);
		return res.str;
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "print", 
	help: "print image window",
	get: function(){
	    var im = this.image;
	    if( im ){
		im.print();
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name:   "regions",
	alias:  "reg",
	alias2: "region",
	help: "add region to current image or list all regions",
	get: function(){
	    var im = this.image;
	    if( im ){
		return im.listRegions("all", 0) || "";
	    }
	},
	set: function(args){
	    var s;
	    var im = this.image;
	    if( im ){
		if( args[0] === "delete" || args[0] === "remove" ){
		    s = args.slice(1).join(" ");
		    im.removeShapes("regions", s);
		} else {
		    s = args.join(" ");
		    im.addShapes("regions", s);
		}
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "scale", 
	help: "set/get scaling for current image",
	get: function(){
	    var res;
	    var im = this.image;
	    if( im ){
		res = im.getScale();
		return sprintf("%s %s %s", 
			       res.scale, res.scalemin, res.scalemax);
	    }
	},
	set: function(args){
	    var im = this.image;
	    if( im ){
		im.setScale.apply(im, args);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "scales", 
	help: "get list of available scales",
	get: function(){
	    return JS9.scales.join(", ");
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "status", 
	help: "get status for specified (or current) image",
	get: function(args){
	    var i, first, tim, im, cmd;
	    var result="";
	    for(i=0; i<JS9.images.length; i++){
		tim = JS9.images[i];
		if( tim.file.search(args[0]) >=0 ){
		    im = tim;
		    break;
		}
	    }
	    if( im ){
		first = 1;
	    } else {
		first = 0;
		im = this.image;
	    }
	    if( im ){
		// no args -> load
		if( first > args.length ){
		    return im.status.load;
		}
		// process specific status
		for(i=first; i<args.length; i++){
		    cmd = args[i].toLowerCase().trim();
		    switch(cmd){
		    case "load":
			if( result ){
			    result += "\n";
			}
			result += im.status.load;
			break;
		    default:
			break;
		    }
		}
	    }
	    return result;
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "url", 
	help: "display a url",
	set: function(args){
	    JS9.DisplayHelp(args[0]);
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcssys", 
	help: "set/get wcs system for current image",
	get: function(){
	    var im = this.image;
	    if( im ){
		return im.getWCSSys();
	    }
	},
	set: function(args){
	    var im = this.image;
	    if( im ){
		im.setWCSSys(args[0]);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcsu", 
	help: "set/get wcs units used for current image",
	get: function(){
	    var im = this.image;
	    if( im ){
		return im.getWCSUnits();
	    }
	},
	set: function(args){
	    var im = this.image;
	    if( im ){
		im.setWCSUnits(args[0]);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcssystems", 
	help: "get list of available wcs systems",
	get: function(){
	    return JS9.wcssyss.join(", ");
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcsunits", 
	help: "get list of available wcs units",
	get: function(){
	    return JS9.wcsunitss.join(", ");
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcs2pix", 
        help: "get wcs position for specified image pixel",
	set: function(args){
	    var res;
	    var im = this.image;
	    if( im ){
		res = JS9.WCS2Pix(im, args[0], args[1]);
		return res.str;
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "zoom", 
	help: "set/get zoom for current image",
	get: function(){
	    var im = this.image;
	    if( im ){
		return im.getZoom();
	    }
	},
	set: function(args){
	    var im = this.image;
	    if( im ){
		im.setZoom(args[0]);
	    }
	}
    }));
    // load external helper support
    JS9.helper = new JS9.Helper();
    //  for analysis forms, Enter should not Submit
    $(document).on("keyup keypress", ".js9AnalysisForm", function(e){
	var code = e.keyCode || e.which;
	if( code === 13 ){
	    e.preventDefault();
	    return false;
	}
    });
    // scroll to top
    $(document).scrollTop(0);
};

// ---------------------------------------------------------------------
//
// JS9 Public API: public interface for use in Web pages
//
// obviously, you can use any JS9 call in a web page but we will
// keep this interface stable
//
// ---------------------------------------------------------------------

// parse function arguments, checking for object containing display property
// return new argument list and display id
// used in public api routines to retrieve optional {display: id} argument
JS9.parsePublicArgs = function(args){
    var display = null;
    var argv = Array.prototype.slice.call(args);
    var obj = argv[argv.length-1];
    // look for object containing display property as last arg
    if( obj && (typeof obj === "object") && 
	obj.hasOwnProperty("display") && (Object.keys(obj).length === 1) ){
	display = obj.display;
	argv.pop();
    }
    // return results
    return {argv: argv, display: display};
};

// some public routines are just a wrapper around the underlying image call
// others require a new function
JS9.mkPublic = function(name, s){
    if( typeof s === "string" ){
	if( JS9.Image.prototype[s] ){
	    JS9[name] = function(){
		var got;
		var obj = JS9.parsePublicArgs(arguments);
		var im = JS9.getImage(obj.display);
		if( im ){
		    // call the image method
		    got = im[s].apply(im, obj.argv);
		    // don't return image handle, it can't be serialized
		    if( got === im ){
			return "OK";
		    }
		    return got;
		}
	    };
	    JS9.publics[name] = JS9[name];
	} else {
	    JS9.error("unknown image function for mkPublic: " + s);
	}
    } else if( typeof s === "function" ){
	JS9[name] = s;
	JS9.publics[name] = JS9[name];
    } else {
	JS9.error("unsupported type for mkPublic: " + typeof s);
    }
};

JS9.mkPublic("CloseImage", "closeImage");
JS9.mkPublic("DisplayImage", "displayImage");
JS9.mkPublic("GetColormap", "getColormap");
JS9.mkPublic("SetColormap", "setColormap");
JS9.mkPublic("GetZoom", "getZoom");
JS9.mkPublic("SetZoom", "setZoom");
JS9.mkPublic("GetPan", "getPan");
JS9.mkPublic("SetPan", "setPan");
JS9.mkPublic("GetScale", "getScale");
JS9.mkPublic("SetScale", "setScale");
JS9.mkPublic("GetValPos", "updateValpos");
JS9.mkPublic("ImageToDisplayPos", "imageToDisplayPos");
JS9.mkPublic("DisplayToImagePos", "displayToImagePos");
JS9.mkPublic("ImageToLogicalPos", "imageToLogicalPos");
JS9.mkPublic("LogicalToImagePos", "logicalToImagePos");
JS9.mkPublic("GetWCSUnits", "getWCSUnits");
JS9.mkPublic("SetWCSUnits", "setWCSUnits");
JS9.mkPublic("GetWCSSys", "getWCSSys");
JS9.mkPublic("SetWCSSys", "setWCSSys");
JS9.mkPublic("ShowShapeLayer", "showShapeLayer");
JS9.mkPublic("AddShapes", "addShapes");
JS9.mkPublic("RemoveShapes", "removeShapes");
JS9.mkPublic("GetShapes", "getShapes");
JS9.mkPublic("ChangeShapes", "changeShapes");
JS9.mkPublic("Print", "print");
JS9.mkPublic("RunAnalysis", "runAnalysis");
JS9.mkPublic("DisplayMessage", "displayMessage");

// set/clear valpos flag
JS9.mkPublic("SetValPos", function(mode){
    var got = null;
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	got = im.params.valpos;
	im.params.valpos = mode;
    }
    return got;
});

// display in-page FITS images and png files
JS9.mkPublic("Load", function(file, opts){
    var i, im, ext, display, func, blob, bytes, topts, tfile;
    var obj = JS9.parsePublicArgs(arguments);
    // sanity check
    if( !file ){
	JS9.error("JS9.Load: no file specified for image load");
	return;
    }
    // check for display
    if( obj.display ){
	display = obj.display;
    } else {
	if( JS9.displays.length > 0 ){
	    display = JS9.displays[0].id;
	} else {
	    display = JS9.DEFID;
	}
    }
    // make sure we can look for properties in opts
    opts = opts || {};
    // if display was implicit, add it to opts
    opts.display = opts.display || display;
    // check for onload function
    if( opts.onload ){
	func = opts.onload;
    } else if( JS9.imageOpts.onload ){
	func = JS9.imageOpts.onload;
	opts.onload = func;
    }
    // handle blob containing FITS
    if( file instanceof Blob ){
	if( file.name ){
	    // see if file is already loaded
	    im = JS9.lookupImage(file.name, display);
	    if( im ){
		// display image, 2D graphics, etc.
		im.displayImage("display");
		im.clearMessage();
		return;
	    }
	    // new file
	    opts.filename = file.name;
	}
	if( !opts.filename ){
	    opts.filename = JS9.ANON;
	}
	if( JS9.fits.handleFITSFile ){
	    topts = $.extend(true, {}, opts, JS9.fits.options);
	    JS9.fits.handleFITSFile(file, topts, JS9.NewFitsImage);
	} else {
	    JS9.error("no FITS module available to load this FITS blob");
	}
	return;
    }
    // handle raw (fits) data objects
    if( typeof file === "object" ){
	JS9.checkNew(new JS9.Image(file, opts, func));
	return;
    }
    // it's gotta be a string: in-memory FITS, url, or filename
    if( typeof file !== "string" ){
	JS9.error("unknown file type for Load: " + typeof file);
    }
    // convert in-memory base64-encoded FITS to a binary string
    if( file.slice(0,12) === "U0lNUExFICA9" ){
	file = window.atob(file);
    }
    // handle in-memory FITS by converting to a blob
    if( file.slice(0,9) === "SIMPLE  =" ){
	bytes = [];
	for(i=0; i<file.length; i++){
	    bytes[i] = file.charCodeAt(i);
	}
	blob = new Blob([new Uint8Array(bytes)]);
	if( !opts.filename ){
	    opts.filename = JS9.ANON;
	}
	blob.name = opts.filename;
	if( JS9.fits.handleFITSFile ){
	    topts = $.extend(true, {}, opts, JS9.fits.options);
	    JS9.fits.handleFITSFile(blob, topts, JS9.NewFitsImage);
	} else {
	    JS9.error("no FITS module available to process this memory FITS");
	}
	return;
    }
    // if this file is already loaded, just redisplay
    im = JS9.lookupImage(file, display);
    if( im ){
	// display image, 2D graphics, etc.
	im.displayImage("display");
	im.clearMessage();
	return;
    }
    // save to get rid of whitespace
    file = file.trim();
    // check file extension
    ext = file.split(".").pop().toLowerCase();
    if( ext === "png" ){
	if( JS9.globalOpts.pngisfits ){
	    // png file: call the constructor and save the result
	    JS9.checkNew(new JS9.Image(file, opts, func));
	} else {
	    JS9.fetchURL(null, file, opts, JS9.NewFitsImage);
	}
    } else {
	// if opts explcitly specifies fits2png or if it's set globally ...
	if( opts.fits2png || 
	    ((opts.fits2png === undefined) && JS9.globalOpts.fits2png) ){
	    // not png, so try to convert to png
	    if( JS9.helper.connected ){
		JS9.helper.send("fits2png", {"fits": file},
		function(r){
		    var nfile, next, robj;
		    // return type can be string or object
		    if( typeof r === "object" ){
			// object from node.js
			robj = r;
		    } else {
			// string from cgi
			if( r.search(JS9.analOpts.epattern) >=0 ){
			    robj = {stderr: r};
			} else {
			    robj = {stdout: r};
			}
		    }
		    if( robj.stderr ){
			JS9.error(robj.stderr, JS9.analOpts.epattern);
		    }
		    if( robj.stdout ){
			// last line is the file name (ignore what comes before)
			nfile = robj.stdout
			.replace(/\n*$/, "").split("\n").pop();
			next = nfile.split(".").pop().toLowerCase();
			// is it a png file?
			if( next === "png" ){
			    // new png file: call constructor, save the result
			    JS9.checkNew(new JS9.Image(nfile, opts, func));
			} else {
			    // still not a png file ... give up
			    JS9.error("fits2png conversion failed: " + nfile);
			}
		    }
		});
	    } else {
		// no helper to do conversion
		JS9.error("no helper available to convert this image: " + file);
	    }
	} else {
	    JS9.waiting(true);
	    // remove extension so we can find the file itself
	    tfile = file.replace(/\[.*\]/, "");
	    JS9.fetchURL(file, tfile, opts, JS9.NewFitsImage);
	}
    }
});

// load a DS9/funtools regions file
JS9.mkPublic("LoadRegions", function(file, opts){
    var display, reader;
    var obj = JS9.parsePublicArgs(arguments);
    // sanity check
    if( !file ){
	JS9.error("JS9.LoadRegions: no file specified for regions load");
	return;
    }
    // check for display
    if( obj.display ){
	display = obj.display;
    } else {
	if( JS9.displays.length > 0 ){
	    display = JS9.displays[0].id;
	} else {
	    display = JS9.DEFID;
	}
    }
    // make sure we can look for properties in opts
    opts = opts || {};
    // if display was implicit, add it to opts
    opts.display = opts.display || display;
    // convert blob to string
    if( typeof file === "object" ){
	// file reader object
	reader = new FileReader();
	reader.onload = function(ev){
	    JS9.AddRegions(ev.target.result, opts);
	};
	reader.readAsText(file);
    } else if( typeof file === "string" ){
	// url string
	opts.responseType = "text";
	JS9.fetchURL(null, file, opts, JS9.AddRegions);
    } else {
	// oops!
	JS9.error("unknown file type for LoadRegions: " + typeof file);
    }
});

// create a new instance of JS9 in a window (light or new)
// nb: unlike JS9.Load, this required the opts param
JS9.mkPublic("LoadWindow", function(file, opts, type, html, winopts){
    var id, did, head, body, win, doc;
    var idbase = JS9.helper.pageid || type || "win";
    opts = opts || {};
    switch(type){
    case "light":
        // use supplied id or make a reasonably unique id for the JS9 elements
	if( opts.id ){
	    id = opts.id;
	    delete opts.id;
	} else {
            id = idbase + JS9.uniqueID();
	}
        // and a second one for controlling the light window
        did = "d" + id;
        // make up the html with the unique id
        html = html || sprintf("<hr class='hline0'><div class='JS9Menubar' id='%sMenubar'></div><div class='JS9' id='%s'></div>", id, id);
        winopts = winopts || JS9.lightOpts[JS9.LIGHTWIN].imageWin;
        // create the light window
        JS9.lightWin(did, "inline", html, file, winopts);
        // create the new JS9 Display
        JS9.checkNew(new JS9.Display(id));
        // instantiate new plugins (create menubar, etc)
        JS9.instantiatePlugins();
        // load the image into this display
        opts.display = id;
        // just becomes a standard load
	if( file ){
            JS9.Load(file, opts);
	}
	// return the id
	return id;
    case "new":
        // use supplied id or make a reasonably unique id for the JS9 elements
	if( opts.id ){
	    id = opts.id;
	    delete opts.id;
	} else {
            id = idbase + JS9.uniqueID();
	}
        // get our own file's header for css and js files
        // if this page is generated on the server side, hardwire this ...
        // if JS9 is not installed, hardwire this ...
        head = document.getElementsByTagName('head')[0].innerHTML;
        // but why doesn't the returned header contain the js9 js file??
	// umm... it seems to have it, at least FF does as of 8/25/15 ...
	if( !head.match(/src=["'].*js9\.js/)      && 
	    !head.match(/src=["'].*js9\.min\.js/) ){
            head += sprintf('<%s type="text/javascript" src="js9.min.js"></%s>',
                            "script", "script");
	}
        // make a body containing the JS9 elements and the preload call
        body = html || sprintf("<div class='JS9Menubar' id='%sMenubar'></div><div class='JS9' id='%s'></div>", id, id);
        // combine head and body into a full html file
        html = sprintf("<html><head>%s</head><body", head);
	if( file ){
            html += sprintf(" onload='JS9.Preload(\"%s\",%s);'", 
			    file, JSON.stringify(opts));
	}
        html += sprintf(">%s</body></html>\n", body);
        // open the new window
        win = window.open(null, id, "width=540, height=560");
        // this is the document associated with the new window
        doc = win.document;
        // open it (not strictly necessary but ...)
        doc.open();
        // overwrite the doc with our html
        doc.write(html);
        // must close!
        doc.close();
	// return the id
	return id;
    }
});

// save array of files to preload or preload immediately, 
// depending on the state of processing
JS9.mkPublic("Preload", function(arg1){
    var i, j, mode, emsg="", dobj=null;
    var alen=arguments.length;
    var obj = JS9.parsePublicArgs(arguments);
    if( obj.display ){
	dobj = {display: obj.display};
	alen = alen - 1;
    }
    // check the state of processing
    switch(alen){
    case 0:
	// if we are connected and have previously saved images, load now
	// if connected is undefined, we have no back-end and we do our best
	if( ((JS9.helper.connected === null) || JS9.helper.connected) &&
	    (JS9.preloads.length > 0) ){
	    mode = 2;
	} else {
	    // do nothing
	    mode = 3;
	}
	break;
    case 1:
	// boolean => inside the helper constructor, we are ready to load
	if( typeof arg1 === "boolean" ){
	    // if we have previously saved images, load now
	    if( JS9.preloads.length > 0 ){
		mode = 2;
	    } else {
		// do nothing
		mode = 3;
	    }
	} else {
	    // image args => if we are connected,  we can load the images now
	    if( (JS9.helper.connected === null) || JS9.helper.connected ){
		mode = 1;
	    } else {
		// save images and wait
		mode = 0;
	    }
	}
	break;
    default:
	// image args => if we already are connected, we can load the images now
	if( (JS9.helper.connected === null) || JS9.helper.connected ){
	    mode = 1;
	} else {
	    // save images and wait
	    mode = 0;
	}
	break;
    }
    switch(mode){
    case 0:
	// save preload image(s) for later
	for(i=0; i<alen; i++){
	    j = i + 1;
	    if( (j < alen) && (typeof arguments[j] === "object") ){
		JS9.preloads.push([arguments[i], arguments[j], dobj]);
		i++;
	    } else {
		JS9.preloads.push([arguments[i], null, dobj]);
	    }
	}
	break;
    case 1:
	// preload the image(s) now from arguments
	JS9.globalOpts.alerts = false;
	for(i=0; i<alen; i++){
	    j = i + 1;
	    if( (j < alen) && (typeof arguments[j] === "object") ){
		try{ 
		    if( dobj ){
			JS9.Load(arguments[i], arguments[j], dobj);
		    } else {
			JS9.Load(arguments[i], arguments[j]);
		    }
		}
		catch(e){ emsg = emsg + " " + arguments[i]; }
		i++;
	    } else {
		try{
		    if( dobj ){
			JS9.Load(arguments[i], null, dobj);
		    } else {
			JS9.Load(arguments[i], null);
		    }
		}
		catch(e){ emsg = emsg + " " + arguments[i]; }
	    }
	}
	JS9.globalOpts.alerts = true;
	if( emsg ){ JS9.error("could not preload image(s): " + emsg); }
	break;
    case 2:
	// preload the image(s) now from saved arguments
	JS9.globalOpts.alerts = false;
	for(i=0; i<JS9.preloads.length; i++){
	    try{ 
		if( JS9.preloads[i][2] ){
		    JS9.Load(JS9.preloads[i][0], JS9.preloads[i][1],
			     JS9.preloads[i][2]); 
		} else {
		    JS9.Load(JS9.preloads[i][0], JS9.preloads[i][1]);
		}
	    }
	    catch(e){ emsg = emsg + " " + JS9.preloads[i][0]; }
	}
	JS9.globalOpts.alerts = true;
	if( emsg ){ JS9.error("could not preload image(s): " + emsg); }
	// remove saved arguments so we don't reload them on reconnect
	JS9.preloads = [];
	break;
    case 3:
	// do nothing
	break;
    default:
	break;
    }
});

// refresh existing image
JS9.mkPublic("RefreshImage", function(fits, func){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    var retry = function(hdu){
	JS9.Image.prototype.refreshImage.call(im, hdu, obj.argv[1]);
    };
    if( im ){
	if( fits instanceof Blob ){
	    if( JS9.fits.handleFITSFile ){
		// cleanup previous FITS file support, if necessary
		// do this before we handle the new FITS file, or else
		// we end up with a memory leak in the emscripten heap!
		if( JS9.fits.cleanupFITSFile && 
		    im.raw.hdu && im.raw.hdu.fits ){
		    JS9.fits.cleanupFITSFile(im.raw.hdu.fits, true);
		}
		JS9.fits.handleFITSFile(fits, JS9.fits.options, retry);
	    } else {
		JS9.error("no FITS module available to refresh this image");
	    }
	} else {
	    JS9.Image.prototype.refreshImage.apply(im, obj.argv);
	}
    } else if( fits instanceof Blob ){
	JS9.Load.apply(null, arguments);
    }
});

// get status of a Load ("complete" means ... complete)
JS9.mkPublic("GetLoadStatus", function(id){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	if( !obj.argv[0] || (im.oid === obj.argv[0]) ){
	    return im.status.load;
	}
	return "other";
    }
    return "none";
});

// bring up the file menu and open selected file(s)
JS9.mkPublic("OpenFileMenu", function(display){
    $('#openLocalFile-' + display.id).click();
});

// bring up the file menu and open selected file(s)
JS9.mkPublic("OpenRegionsMenu", function(display){
    $('#openLocalRegions-' + display.id).click();
});

// call the image constructor as a function
JS9.mkPublic("NewFitsImage", function(hdu, opts){
    var func;
    if( opts && opts.onload ){
	func = opts.onload;
    }
    JS9.checkNew(new JS9.Image(hdu, opts, func));
});

// return the image object for the specified image name or the display id
JS9.mkPublic("GetImage", function(id){
    var obj;
    if( id && (typeof id !== "string") ){
	obj = JS9.parsePublicArgs(arguments);
	id = obj.display;
    }
    return JS9.getImage(id);
});

// return the image data and auxiliary info
JS9.mkPublic("GetImageData", function(dflag){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    var data = null;
    var atob64 = function(a){
	var i;
	var s = '';
	var bytes = new Uint8Array(a.buffer);
	var len = bytes.byteLength;
	for(i=0; i<len; i++){
            s += String.fromCharCode(bytes[i]);
	}
	return window.btoa(s);
    };
    // return data and auxiliary info
    if( im ){
	if( obj.argv[0] ){
	    // return an array for IPC, since python mangles the typed array
	    if( obj.argv[0] === "array" ){
		data = Array.prototype.slice.call(im.raw.data);
	    } else if( obj.argv[0] === "base64" ){
		// NB: this seems to be the fastest method for IPC!
		data = atob64(im.raw.data);
	    } else if( obj.argv[0] && (obj.argv[0] !== "false") ) {
		// use this for javascript programming on the web page itself
		data = im.raw.data;
	    }
	}
	return {id: im.id,
		file: im.file,
		fits: im.fitsFile || "",
		source: im.source,
		imtab: im.imtab,
		width: im.raw.width, 
		height: im.raw.height,
		bitpix: im.raw.bitpix,
		header: im.raw.header, 
		data: data};
    }
});

// load auxiliary file, if available
// s is the aux file type
JS9.mkPublic("LoadAuxFile", function(file, func){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	im.loadAuxFile(file, func);
    } else {
	JS9.error("could not find image for aux file: " + file);
    }
});
    
// run analysis from a Web page form
JS9.mkPublic("SubmitAnalysis", function(el, aname, func){
    var topjq, formjq, dispid, im, errstr;
    var a = JS9.lightOpts[JS9.LIGHTWIN];
    var obj = JS9.parsePublicArgs(arguments);
    // if analysis name was not passed, it was saved in the light window div
    if( aname ){
	dispid =  JS9.lookupDisplay(obj.display).id;
    } else {
	topjq = $(el).closest(a.top);
	aname = topjq.data("aname");
	dispid = topjq.data("dispid");
    }
    // make sure we have a task name
    if( !aname ){
	errstr = "internal error: could not find analysis task name";
    } else if( dispid ){
	im = JS9.getImage(dispid);
    }
    // make sure we have an image and run the analysis
    if( im ){
	formjq = $(el).closest("form");
	try{ obj = formjq.serializeArray(); }
	catch(e){ obj = null; }
	im.runAnalysis(aname, obj, func);
    } else {
	errstr = "internal error: could not find image";
    }
    // handle errors
    if( errstr ){
	JS9.error(errstr);
    }
    // prevent form from being submitted
    return false;
});

// send a message to the back-end server
JS9.mkPublic("Send", function(msg, obj, cb){
    if( JS9.helper.connected ){
	JS9.helper.send(msg, obj, cb);
    } else {
	JS9.error("no helper available");
    }
});

// get display position from event
JS9.mkPublic("EventToDisplayPos", function(evt){
    return JS9.eventToDisplayPos(evt);
});

// convert image position to wcs (in degrees)
// NB: input image coordinates are 1-indexed
JS9.mkPublic("PixToWCS", function(ix, iy){
    var s, arr;
    var x = 1.0;
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	if( im.wcs > 0 ){
	    // convert to 0-indexed units in wcslib
	    s = JS9.pix2wcs(im.wcs, ix-1, iy-1).trim();
	    arr = s.split(/ +/);
	    if( (im.params.wcsunits === "sexagesimal") &&
		(im.params.wcssys !== "galactic" )     &&
		(im.params.wcssys !== "ecliptic" )     ){
		x = 15.0;
	    }
	    return {ra: JS9.saostrtod(arr[0]) * x, 
		    dec: JS9.saostrtod(arr[1]), 
		    sys: arr[2],
		    str: s};
	}
    }
});
// backwards compatibility
JS9.Pix2WCS = JS9.PixToWCS;

// convert wcs to image position
// NB: returned image coordinates are 1-indexed
JS9.mkPublic("WCSToPix", function(ra, dec){
    var s, x, y, arr;
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	if( im.wcs > 0 ){
	    arr = JS9.wcs2pix(im.wcs, ra, dec).trim().split(/ +/);
	    // convert from 0-indexed units in wcslib
	    x = parseFloat(arr[0]) + 1;
	    y = parseFloat(arr[1]) + 1;
	    s = sprintf("%f %f", x, y);
	    return {x: x, y: y, str: s};
	}
    }
    return null;
});
// backwards compatibility
JS9.WCS2Pix = JS9.WCSToPix;

//  display a help page (or a general url, actually)
JS9.mkPublic("DisplayHelp", function(hname){
    var id, title, url;
    var opts = "width=830px,height=400px,center=1,resize=1,scrolling=1";
    var type = "iframe";
    var help;
    // sanity check
    if( !hname ){
	return;
    }
    // look for known help file
    help = JS9.helpOpts[hname];
    if( help ){
	// help file
	id = help.title + "_" + JS9.uniqueID();
	url = JS9.InstallDir(help.type + "/" + help.url);
	JS9.lightWin(id, type, url, help.title, opts);
    } else {
	// its a random url
	id = hname + "_" + JS9.uniqueID();
	title = hname.split("/").reverse()[0];
	JS9.lightWin(id, type, hname, title, opts);
    }
});

// initialize a new shape layer
// NB: don't be fooled, this is not a standard image routine
// it's a Display routine, so we can't use mkPublic
JS9.mkPublic("NewShapeLayer", function(layer, opts){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	return im.display.newShapeLayer(layer, opts);
    }
    return null;
});

// add a region
JS9.mkPublic("AddRegions", function(region, opts){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	return im.addShapes("regions", region, opts);
    }
    return null;
});

// remove one or more regions
JS9.mkPublic("RemoveRegions", function(region){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	im.removeShapes("regions", region);
	im.clearMessage("regions");
	return "OK";
    }
    return null;
});

// get one or more regions
JS9.mkPublic("GetRegions", function(region){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	obj.argv.unshift("regions");
	return im.getShapes.apply(im, obj.argv);
    }
    return null;
});

// change one or more regions
JS9.mkPublic("ChangeRegions", function(region, opts){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	im.changeShapes("regions", region, opts);
    }
    return null;
});

// construct directory starting with where JS9 is installed
JS9.mkPublic("InstallDir", function(dir){
    return JS9.INSTALLDIR + dir;
});

// add new display divs and/or new plugins
JS9.mkPublic("AddDivs", function(){
    var i;
    var obj = JS9.parsePublicArgs(arguments);
    for(i=0; i< obj.argv.length; i++){
	JS9.checkNew(new JS9.Display(obj.argv[i]));
    }
    JS9.instantiatePlugins();
});

// end of Public Interface

// return namespace
return JS9;
}(JS9));

// INIT: after document is loaded, perform js9 initialization
$(document).ready(function(){
"use strict";
JS9.init();
});
