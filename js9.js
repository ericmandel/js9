/*
 *
 * JS9: image display right in your browser (December 10, 2012)
 *
 * Principals: Eric Mandel, Alexey Vikhlinin
 * Organization: Harvard Smithsonian Center for Astrophysics, Cambridge MA
 * Contact: saord@cfa.harvard.edu
 *
 * Copyright (c) 2012 - 2016 Smithsonian Astrophysical Observatory
 *
 */

/*jslint plusplus: true, vars: true, white: true, continue: true, unparam: true, regexp: true, browser: true, devel: true, nomen: true */

/*global $, jQuery, Event, fabric, io, CanvasRenderingContext2D, sprintf, Blob, ArrayBuffer, Uint8Array, Uint16Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, DataView, FileReader, Fitsy, Astroem, dhtmlwindow, saveAs, Spinner, ResizeSensor, Jupyter, gaussBlur, ImageFilters */

/*jshint smarttabs:true */

// check for already-loaded module
var JS9;
if( JS9 && (typeof JS9 !== "object" || JS9.NAME) ){
    throw new Error("Namespace 'JS9' already exists");
}
// create the module and seed with standard values
var JS9 = {};
JS9.NAME = "JS9";		// The name of this namespace
JS9.VERSION = "1.9";		// The version of this namespace
JS9.COPYRIGHT = "Copyright (c) 2012-2016 Smithsonian Institution";

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
JS9.INVSIZE = 1024;		// size of inverse array
JS9.HISTSIZE = 16384;		// size of histogram equalization array
JS9.INSTALLDIR="";		// prefix to get to js9 install directory
JS9.TOROOT="";			// prefix to get to data file from install
JS9.PLUGINS="";			// regexp list of plugins
JS9.LIGHTWIN = "dhtml";		// light window type: choice of dhtml
JS9.ANTIALIAS = false;		// use anti-aliasing?
JS9.SCALEIREG = true;		// scale interactive regions by zoom factor?
JS9.NOMOVE = 3;			// number of pixels before we recognize movement
JS9.DBLCLICK = 500;		// millisec for double-click
JS9.TIMEOUT = 250;              // millisec before assuming light window is up
JS9.SPINOUT = 250;		// millisec before assuming spinner is up
JS9.SUPERMENU = /^SUPERMENU_/;  // base of supermenu id
JS9.RESIZEDIST = 20;		// size of rectangle defining resize handle
JS9.RESIZEFUDGE = 5;            // fudge for webkit resize problems
JS9.RAWID0 = "raw0";		// default raw id
JS9.RAWIDX = "alt";		// default "alternate" raw id
JS9.REPROJDIM = 2200;		// max dimension for reprojection
JS9.IDFMT = "  (%s)";           // format for light window id
JS9.MINZOOM = 0.125;		// min zoom using scrool wheel
JS9.MAXZOOM = 16.0;		// max zoom using scrool wheel
JS9.ADDZOOM = 0.05;		// add/subtract amount per mouse wheel click
JS9.CHROMEFILEWARNING = true;	// whether to alert chrome users about file URI

// https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
JS9.TOUCHSUPPORTED = ( window.hasOwnProperty("ontouchstart") ||
		      (navigator.maxTouchPoints > 0) ||
		      (navigator.msMaxTouchPoints > 0));
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
// convenience to allow plugins to deal with HiDPI ratio blurring
// http://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
JS9.PIXEL_RATIO = (function(){
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
}());

// global options
JS9.globalOpts = {
    helperType: "none",		// one of: sock.io, get, post, none
    helperPort: 2718,		// default port for node.js helper
    winType: "light",		// plugin window: "light" or "new"
    rgb: {active: false,	// RGB mode
	  rim: null,
	  gim: null,
	  bim: null},
    defcolor: "#00FF00",	// graphics color when all else fails
    pngisfits: true,		// are PNGs really PNG representation files?
    fits2png: false,		// do we convert FITS to  PNG representation?
    alerts: true,		// set to false to turn off alerts
    internalValPos: true,	// a fancy info plugin can turns this off
    internalContrastBias: true,	// a fancy colorbar plugin can turns this off
    htimeout: 10000,		// connection timeout for the helper connect
    xtimeout: 180000,		// connection timeout for fetch data requests
    extlist: "EVENTS STDEVT",	// list of binary table extensions
    dims: [1024, 1024],		// dims of extracted images
    helperProtocol: location.protocol, // http: or https:
    maxMemory: 750000000,	// max heap memory to allocate for a fits image
    corsURL: "params/loadcors.html",       // location of param html file
    proxyURL: "params/loadproxy.html",     // location of param html file
    loadProxy: false,           // do we allow proxy load requests to server?
    archivesURL: "help/archives.html",     // location of archives help file
    imsectionURL: "params/imsection.html", // location of param html file
    postMessage: false,         // allow communication through iframes?
    waitType: "spinner",        // "spinner" or "mouse"
    spinColor: "#FF0000",       // color of spinner
    spinOpacity: 0.35,          // opacity of spinner
    resize: true,		// allow resize of display?
    resizeHandle: true,		// add resize handle to display?
    mouseActions: ["display value/position", "change contrast/bias", "pan the image"],// 0,1,2 mousepress
    touchActions: ["display value/position", "change contrast/bias", "pan the image"],// 1,2,3 fingers
    mousetouchZoom: false,	// use mouse wheel, pinch to zoom?
    pinchWait: 8,		// number of events to wait before testing pinch
    pinchThresh: 6,		// threshold for pinch test
    extendedPlugins: true,	// enable extended plugin support?
    corsProxy: "http://js9.si.edu/cgi-bin/CORS-proxy.cgi", // CORS proxy url
    simbadProxy: "http://js9.si.edu/cgi-bin/simbad-proxy.cgi", // simbad proxy url
    debug: 0		        // debug level
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
    opacity: 1.0,			// opacity between 0 and 1
    sigma: "none",			// gauss blur sigma or none
    maskOpacity: 0.4,			// opacity for masked pixels
    alpha:  255,                        // alpha for image (but use opacity!)
    alpha1: 100,                        // alpha for masked pixels
    // xcen: 0,                         // default x center pos to pan to
    // ycen: 0,                         // default y center pos to pan to
    zoom: 1,				// default zoom factor
    zooms: 5,				// how many zooms in each direction?
    nancolor: "#000000",		// 6-digit #hex color for NaN values
    wcsalign: true,			// align image using wcs after reproj?
    listonchange: false			// whether to list after a reg change
};

// allows regions opts to be overridden in preferences
JS9.regionOpts = {
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
    nclick: 0,
    dhtml: {
	top:      ".dhtmlwindow",
	drag:     ".drag-contentarea",
	dragBar:  "drag-handle",
	format:   "width=%spx,height=%spx,center=1,resize=%s,scrolling=0",
	textWin:  "width=830px,height=400px,center=1,resize=1,scrolling=1",
	plotWin:  "width=830px,height=420px,center=1,resize=1,scrolling=1",
	dpathWin: "width=830px,height=175px,center=1,resize=1,scrolling=1",
	paramWin: "width=830px,height=230px,center=1,resize=1,scrolling=1",
	imageWin: "width=512px,height=590px,center=1,resize=1,scrolling=1",
	lineWin:  "width=400px,height=60px,center=1,resize=1,scrolling=1"
    }
};

// colors for text messages
JS9.textColorOpts = {
    regions: "#00FF00",
    info:    "#00FF00",
    inimage: "#000000"
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
	title: "User Manual"
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
	title: "Adding Local Analysis Tasks and Plugins"
    },
    helper: {
	type: "help", url:"helper.html",
	title: "Adding Server-side Analysis Tasks"
    },
    serverside: {
	type: "help", url:"serverside.html",
	title: "Server-side Analysis with JS9"
    },
    publicapi: {
	type: "help", url:"publicapi.html",
	title: "The JS9 Public API"
    },
    repfile: {
	type: "help", url:"repfile.html",
	title: "Dealing with Large Files"
    },
    regions: {
	type: "help", url:"regions.html",
	title: "Regions Format"
    },
    extmsg: {
	type: "help", url:"extmsg.html",
	title: "External Messaging"
    },
    python: {
	type: "help", url:"python.html",
	title: "JS9 with Python and Jupyter"
    },
    preferences: {
	type: "help", url:"preferences.html",
	title: "Setting Site Preferences"
    },
    changelog: {
	type: "help", url:"changelog.html",
	title: "ChangeLog"
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

// containers for groups of JS9 objects
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
JS9.scales = ["linear", "log", "histeq", "power", "sqrt", "squared", "asinh", "sinh"];

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
"<td class='JS9CmdTd'><input type='text' class='JS9CmdIn' autocapitalize='off' autocorrect='off' autocomplete='off' value='' /></td>" +
"</tr>" +
"</table>" +
"</form>";

// known bugs and work-arounds
JS9.bugs = {};
// sometimes hiding the menu does not refresh the image properly
// JS9.bugs.hide_menu = true;
// turned off: 6/30/16
JS9.bugs.hide_menu = false;
// firefox does not repaint as needed (last checked FF 24.0 on 10/20/13)
if( (JS9.BROWSER[0] === "Firefox") && JS9.BROWSER[2].search(/Linux/) >=0 ){
    JS9.bugs.firefox_linux = true;
}
// webkit resize is not quite up to par
if( (JS9.BROWSER[0] === "Chrome") || (JS9.BROWSER[0] === "Safari") ){
    JS9.bugs.webkit_resize = true;
}
// chrome appears to have a 500Mb limit on tabs (10/2015)
if( (JS9.BROWSER[0] === "Chrome") ){
    JS9.globalOpts.maxMemory = Math.min(JS9.globalOpts.maxMemory, 450000000);
}

// ---------------------------------------------------------------------
// JS9 Image object to manage images
// ---------------------------------------------------------------------
JS9.Image = function(file, params, func){
    var sarr;
    var display;
    var that = this;
    var localOpts=null;
    var mksect = function(that, localOpts){
	var zoom;
	var arr = [];
	// make up section array from default values
	if( localOpts && (localOpts.xcen !== undefined) ){
	    arr.push(localOpts.xcen);
	}
	if( localOpts && (localOpts.ycen !== undefined) ){
	    arr.push(localOpts.ycen);
	}
	if( localOpts && (localOpts.zoom !== undefined) ){
	    zoom = that.parseZoom(localOpts.zoom);
	    if( zoom ){
		arr.push(zoom);
	    }
	}
	return arr;
    };
    var finishUp = function(func){
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
	this.xeqPlugins("image", "onimageload");
	// update shapes?
	if( this.updateshapes ){
	    this.updateShapes("regions", "all", "update");
	}
	// load is complete
	this.status.load = "complete";
	// done loading, reset wait cursor
	JS9.waiting(false);
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
    // initialize image params
    this.params = {};
    // image-specific scratch space for plugins
    this.tmp = {};
    // scale min and max to impossible numbers
    this.params.scalemin = Number.Nan;
    this.params.scalemax = Number.Nan;
    // xeq callback for region changes?
    this.params.xeqonchange = true;
    // copy plot parameters
    this.params.plotOpts = $.extend(true, {}, JS9.plotOpts);
    // copy image parameters
    this.params = $.extend(true, this.params, JS9.imageOpts, localOpts);
    // set the colormap object from colormap name (text string)
    // this.cmapObj = JS9.lookupColormap(this.params.colormap);
    this.setColormap(this.params.colormap);
    // do we display?
    this.displayMode = true;
    // initialize click state
    this.clickState = 0;
    // initialize click in region
    this.clickInRegion = false;
    // no helper queried yet
    this.queried = false;
    // is this a proxy image?
    if( localOpts && localOpts.proxyFile ){
	this.proxyFile = localOpts.proxyFile;
    }
    // was a "parent" FITS file specified?
    if( localOpts && localOpts.parentFile ){
	this.parentFile = localOpts.parentFile;
    }
    // was an id specified?
    if( localOpts && localOpts.id ){
	this.id = localOpts.id;
    }
    // offsets into canvas to display
    this.ix = 0;
    this.iy = 0;
    // wcs offsets into canvas to display
    this.wcsix = 0;
    this.wcsiy = 0;
    // create the png object
    this.png = {};
    // image element to hold png file, from which array data is generated
    this.png.image = new Image();
    // init menubar, if necessary
    // this.initMenubar();
    // init status object
    this.status = {};
    // RGB image
    this.rgb = {};
    // section parameters
    this.rgb.sect = {zoom: 1, ozoom: 1};
    // graphical layers
    this.layers = {};
    // no logical coordinate systems
    this.lcs = {};
    // array of aux file pointers
    this.aux = {};
    // binning parameters
    this.binning = {bin: 1, obin: 1};
    // array to hold raw data as we create it (original raw data at index 0)
    this.raws = [];
    // initial blend mode
    this.blend = {active: undefined, mode: "normal", opacity: 1};
    // temp flag determines if we should update shapes at end of this call
    this.updateshapes = false;
    // change the cursor to show the waiting status
    JS9.waiting(true, this.display.divjq[0]);
    // file argument can be an object containing raw data or
    // a string containing a URL of a PNG image
    switch( typeof file ){
    case "object":
	// save source
	this.source = "fits";
	// generate the raw data array from the hdu
	this.mkRawDataFromHDU(file,
			      $.extend({}, {file: file.filename}, localOpts));
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
	// was a static RGB file specified?
	if( localOpts && localOpts.rgbFile ){
	    this.rgbFile = localOpts.rgbFile;
	    // callback to fire when static RGB image is loaded
	    $(this.png.image).on("load", function(evt){
		var ss;
		if( (that.png.image.width !== that.raw.width)   ||
		    (that.png.image.height !== that.raw.height) ){
		    ss = sprintf("rgb dims [%s,%s] don't match image [%s,%s]",
				that.png.image.width,
				that.png.image.height,
				that.raw.width,
				that.raw.height);
		    JS9.error(ss);
		}
		// store png data in an offscreen canvas
		that.mkOffScreenCanvas();
		// display image, 2D graphics, etc.
		that.displayImage("all", localOpts);
		// finish up
		finishUp.call(that, func);
	    }).on("error", function(evt){
		// done loading, reset wait cursor
		JS9.waiting(false);
		// error on load
		that.status.load = "error";
		JS9.error("could not load image: "+that.id);
	    });
	    // set src to download the display file
	    this.png.image.src = this.rgbFile;
	} else {
	    // display image, 2D graphics, etc.
	    this.displayImage("all", localOpts);
	    // finish up
	    finishUp.call(this, func);
	}
	break;
    case "string":
	// save source
	this.source = "fits2png";
	// image or table
	this.imtab = "image";
	// downloaded image file, path relative to displayed Web page
	this.file = file.replace(/\/\.\//, "/");
	// take file but discard path (or scheme) up to slashes
	this.id0 = this.file.split("/").reverse()[0];
	// save id in case we have to change it for uniqueness
	this.id = JS9.getImageID(this.id0, this.display.id);
	// load status
	this.status.load = "loading";
	// callback to fire when image is loaded (do this before setting src)
	$(this.png.image).on("load", function(evt){
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
	    that.displayImage("all", localOpts);
	    // finish up
	    finishUp.call(that, func);
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

// return the image data in a relatively standard format
JS9.Image.prototype.getImageData = function(dflag){
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
    if( dflag ){
	// return an array for IPC, since python mangles the typed array
	if( dflag === "array" ){
	    data = Array.prototype.slice.call(this.raw.data);
	} else if( dflag === "base64" ){
	    // NB: this seems to be the fastest method for IPC!
	    data = atob64(this.raw.data);
	} else if( dflag && (dflag !== "false") ) {
	    // use this for javascript programming on the web page itself
	    data = this.raw.data;
	}
    }
    return {id: this.id,
	    file: this.file,
	    fits: this.fitsFile || "",
	    source: this.source,
	    imtab: this.imtab,
	    width: this.raw.width,
	    height: this.raw.height,
	    bitpix: this.raw.bitpix,
	    header: this.raw.header,
	    hdus: this.hdus,
	    data: data
	   };
};

// undisplay the image, release resources
JS9.Image.prototype.closeImage = function(){
    var i, j, tim, key, raw, carr;
    var iscurrent = false;
    var ilen= JS9.images.length;
    var display = this.display;
    var func = function(r){
	if( r.stderr ){
	    JS9.error(r.stderr);
	} else if( r.stdout ){
	    JS9.log(r.stdout);
	}
    };
    // look for the image in the image list, and remove it
    for(i=0; i<ilen; i++){
	if( this === JS9.images[i] ){
	    tim = JS9.images[i];
	    // is this the currently displayed image?
	    if( tim === tim.display.image ){
		iscurrent = true;
	    }
	    // clear display if this is the currently displayed image
	    if( iscurrent ){
		// nothing on the screen
		tim.clearMessage();
		tim.display.context.clear();
		// clear all layers
		for( key in tim.layers ){
		    if( tim.layers.hasOwnProperty(key) ){
			// tim.layers[key].canvas.dispose();
			// tim.layers[key] = null;
			tim.layers[key].canvas.clear();
		    }
		}
		// clear image from display
		tim.display.image = null;
	    }
	    // plugin callbacks
	    tim.xeqPlugins("image", "onimageclose");
	    // remove from RGB mode, if necessary
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
	    if( JS9.fits.cleanupFITSFile ){
		for(j=0; j<tim.raws.length; j++){
		    raw = tim.raws[j];
		    if( raw.hdu && raw.hdu.fits ){
			carr = JS9.lookupVfile(raw.hdu.fits.vfile);
			if( carr.length <= 1 ){
			    JS9.fits.cleanupFITSFile(raw.hdu.fits, true);
			}
		    }
		}
	    }
	    // remove proxy image from server, if necessary
	    if( tim.proxyFile ){
		JS9.Send('removeproxy',
			 {'cmd': 'js9Xeq removeproxy ' + tim.proxyFile}, func);
	    }
	    // good hints to the garbage collector
	    tim.rgb = null;
	    tim.offscreen = null;
	    tim.raw = null;
	    tim.colorData = null;
	    tim.colorCells = null;
	    tim.psColors = null;
	    tim.psInverse = null;
	    tim = null;
	    // remove image from active list
	    JS9.images.splice(i,1);
	    // found and removed the specified image
	    break;
	}
    }
    // display another image, if necessary and if possible
    if( iscurrent ){
	for(i=0; i<JS9.images.length; i++){
	    tim = JS9.images[i];
	    if( display === tim.display ){
		// display image, 2D graphics, etc.
		tim.displayImage("all");
		tim.refreshLayers();
		break;
	    }
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
	this.offscreen.context.msImageSmoothingEnabled = false;
    }
    // draw the png to the offscreen canvas
    this.offscreen.context.drawImage(this.png.image, 0, 0);
    // read the RGBA data from offscreen
    try{
	this.offscreen.img = this.offscreen.context.getImageData(0, 0,
			     this.png.image.width, this.png.image.height);
    } catch(e){
	if( JS9.CHROMEFILEWARNING &&
	    (JS9.BROWSER[0] === "Chrome") && (document.domain === "") ){
	    alert("When using the file:// URI, Chrome must be run with the --allow-file-access-from-files switch to permit JS9 to access data.");
	} else {
	    alert("could not read off-screen image data [same-origin policy violation?]");
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
    // allow chaining
    return this;
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
    // create the object to hold raw data and add to raws array
    this.raws.push({from: "img"});
    // assign this object to the high-level raw data object
    this.raw = this.raws[this.raws.length-1];
    // this is the default raw data
    this.raw.id = JS9.RAWID0;
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
    // set data min and max
    this.dataminmax();
    // change data source
    this.source = "png";
    // fake header
    this.raw.header = {
	SIMPLE: true,
	NAXIS: 2,
	NAXIS1: this.raw.width,
	NAXIS2: this.raw.height,
	BITPIX: this.raw.bitpix
    };
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
    // create the object to hold raw data and add to raws array
    this.raws.push({from: "png"});
    // assign this object to the high-level raw data object
    this.raw = this.raws[this.raws.length-1];
    // this is the default raw data
    this.raw.id = JS9.RAWID0;
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
	// save the off-screen image and return;
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
    // number of data pixels
    dlen = this.raw.width * this.raw.height;
    // mode: process next image pixel based on starting index into RGBA pixel
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
	}
	break;
    default:
	JS9.error("unsupported bitpix in PNG file: "+this.raw.bitpix);
    }
    // set data min and max
    this.dataminmax();
    // having the real image, we can ask to release the offscreen image
    this.offscreen.img = null;
    // init WCS, if possible
    this.raw.wcs = JS9.initwcs(JS9.raw2FITS(this.raw));
    if( this.raw.wcs > 0 ){
	// set the wcs system
	this.setWCSSys(this.params.wcssys);
	// this is also the default
	this.params.wcssys0 = this.params.wcssys.trim();
	// get info about the wcs
	try{ this.raw.wcsinfo = JSON.parse(JS9.wcsinfo(this.raw.wcs)); }
	catch(ignore){}
    }
    // init the logical coordinate system, if possible
    this.initLCS(this.raw.header);
    // allow chaining
    return this;
};

// read input object and convert to image data
JS9.Image.prototype.mkRawDataFromHDU = function(obj, opts){
    var i, s, ui, clen, hdu, pars, card, got, rlen;
    var owidth, oheight, obitpix;
    opts = opts || {};
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
    // save old essential values, if possible (for use as defaults)
    if( this.raw ){
	owidth = this.raw.width;
	oheight = this.raw.height;
	obitpix = this.raw.bitpix;
    }
    // initialize raws array?
    rlen = this.raws.length;
    if( !rlen ){
	// create object to hold raw data and add to raws array
	this.raws.push({from: "hdu"});
	// assign this object to the high-level raw data object
	this.raw = this.raws[rlen];
	// ignore rawid, this is the default raw data
	this.raw.id = JS9.RAWID0;
    } else {
	opts.rawid = opts.rawid || JS9.RAWIDX;
	// reuse raw object with the same id, after re-initializing it
	got = 0;
	for(i=0; i<rlen; i++){
	    if( opts.rawid === this.raws[i].id  ){
		s = this.raws[i].from;
		this.raws[i] = {from: s, id: opts.rawid};
		this.raw = this.raws[i];
		got++;
		break;
	    }
	}
	// otherwise, create new raw object with this id
	if( !got ){
	    // create the object to hold raw data and add to raws array
	    this.raws.push({from: "hdu", id: opts.rawid});
	    // assign this object to the high-level raw data object
	    this.raw = this.raws[rlen];
	}
    }
    // now save the hdu in the raw object
    this.raw.hdu = hdu;
    // fill in raw data info directly from the fits object
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
    // look for a filename (needs header so we can add extension name/num
    if( opts.file ){
	this.file = opts.file;
    } else if( hdu.filename ){
	this.file = hdu.filename;
    }
    this.file = this.file || JS9.ANON;
    // save original file in case we add an extension
    this.file0 = this.file;
    // look for an id
    if( opts.id ){
	// get a unique id for this image
	this.id0 = opts.id;
	this.id = JS9.getImageID(opts.id, this.display.id, this);
    }
    // add extname or extnum, if possible
    if( !this.id && this.file && !this.file.match(/\[.*[^a-zA-Z0-9_].*\]/) ){
	if( this.raw.hdu.fits ){
	    if( this.raw.hdu.fits.extname ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += sprintf("[%s]", this.raw.hdu.fits.extname);
	    } else if( this.raw.hdu.fits.extnum &&
		       (this.raw.hdu.fits.extnum > 0) ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += sprintf("[%s]", this.raw.hdu.fits.extnum);
	    }
	} else if( this.raw.header ){
	    if( this.raw.header.EXTNAME ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += sprintf("[%s]", this.raw.header.EXTNAME);
	    }
	}
    }
    // last chance: get it from the file
    if( !this.id ){
	// save id in case we have to change it for uniqueness
	this.id0 = this.file.split("/").reverse()[0];
	// get a unique id for this image
	this.id = JS9.getImageID(this.id0, this.display.id);
    }
    // min and max data values
    if( hdu.dmin && hdu.dmax ){
	// from object
	this.raw.dmin = hdu.dmin;
	this.raw.dmax = hdu.dmax;
    } else {
	// calculate data min and max
	this.dataminmax();
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
    this.raw.wcs = JS9.initwcs(JS9.raw2FITS(this.raw));
    if( this.raw.wcs > 0 ){
	// set the wcs system
	this.setWCSSys(this.params.wcssys);
	// this is also the default
	this.params.wcssys0 = this.params.wcssys.trim();
	// set the wcs units
	this.setWCSUnits(this.params.wcsunits);
	// get info about the wcs
	try{ this.raw.wcsinfo = JSON.parse(JS9.wcsinfo(this.raw.wcs)); }
	catch(ignore){}
    }
    // init the logical coordinate system, if possible
    this.initLCS(this.raw.header);
    // get hdu info, if possible
    try{
	s = JS9.listhdu(this.raw.hdu.fits.vfile);
	this.hdus = JSON.parse(s);
    }
    catch(ignore){}
    // allow chaining
    return this;
};

// store section information
JS9.Image.prototype.mkSection = function(xcen, ycen, zoom){
    var sect = this.rgb.sect;
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
	sect.ozoom  = sect.zoom;
	sect.zoom   = xcen;
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
	sect.xcen   = parseInt(xcen, 10);
	sect.ycen   = parseInt(ycen, 10);
	sect.ozoom  = sect.zoom;
	sect.zoom   = zoom;
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
    // we changed section, so the offsreen RGB image is invalid
    this.offscreenRGB = null;
    // allow chaining
    return this;
};

// create colormap index array from data values and specified data min/max
// from: tksao1.0/frame/frametruecolor.C
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
// from: tksao1.0/colorbar/colorbar.C
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
// from: tksao1.0/colorbar/colorbartruecolor.C
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
// from: tksao1.0/frame/colorscale.C
// inverse code from: tksao1.0/frame/inversescale.C
JS9.Image.prototype.mkScaledCells = function(){
    var aa, dd, ii, jj, ll, exp, low;
    var vv, avg, color, data, dlen, diff, bin, total, dval, dmin, dmax, pdf;
    var cs = JS9.COLORSIZE;
    var ss = JS9.SCALESIZE;
    var tt = JS9.INVSIZE;
    var hh = JS9.HISTSIZE;
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
    // and the inverse array for colorbar ticks
    if( !this.psInverse ){
	this.psInverse = [];
	// value for NaN
	this.psInverse[NaN] = 0;
    }
    // delta for scaling
    dd = this.params.scalemax - this.params.scalemin;
    low = this.params.scalemin;
    // apply the appropriate scale algorithm
    switch(this.params.scale){
    case "linear":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(aa * cs);
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = ii / tt;
	    this.psInverse[ii] = aa * dd + low;
	}
	break;
    case "log":
	exp = this.params.exp;
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = Math.log(((exp*ii)/ss)+1) / Math.log(exp);
	    ll = Math.floor(aa * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = (Math.pow(exp,ii/tt)-1) / exp;
	    this.psInverse[ii] =  aa * dd + low;
	}
	break;
    case "power":
	exp = this.params.exp;
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = (Math.pow(exp, ii/ss)-1) / exp;
	    ll = Math.floor(aa * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = Math.log(exp*ii/tt+1) / Math.log(exp);
	    this.psInverse[ii] =  aa * dd + low;
	}
	break;
    case "sqrt":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(Math.sqrt(aa) * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = ii / tt;
	    this.psInverse[ii] =  (aa * aa) * dd + low;
	}
	break;
    case "squared":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(aa * aa * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = Math.sqrt(ii/tt);
	    this.psInverse[ii] =  aa * dd + low;
	}
	break;
    case "asinh":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(Math.asinh(10.0*aa)/3.0 * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = ii / tt;
	    ll = Math.sinh(3.0*aa)/10.0;
	    this.psInverse[ii] =  ll * dd + low;
	}
	break;
    case "sinh":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(Math.sinh(3.0*aa)/10.0 * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = ii / tt;
	    ll = Math.asinh(10.0*aa)/3.0;
	    this.psInverse[ii] =  ll * dd + low;
	}
	break;
    case "histeq":
	// taken from: saods9/tksao1.0/frame/frscale.C
	data = this.raw.data;
	dlen = this.raw.width * this.raw.height;
	diff = (this.raw.dmax - this.raw.dmin);
	dmax = this.raw.dmax;
	dmin = this.raw.dmin;
	bin = 0;
	total = 0;
	pdf = [];
	if( !this.hist || !this.hist.length ){
	    this.hist = [];
	    // start with a cleared pdf buffer
	    for(ii=0; ii<hh; ii++){
		pdf[ii] = 0;
	    }
	    // make histogram from data values
	    for(ii=0; ii<dlen; ii++){
		if( (data[ii] >= dmin) && (data[ii] <= dmax) ){
		    jj = Math.floor((data[ii] - dmin) / diff * hh + 0.5);
		    if( jj < hh ){
			pdf[jj] += 1;
		    }
		}
	    }
	    // get average
	    for(ii=0; ii<hh; ii++){
		total += pdf[ii];
	    }
	    avg = total / hh;
	    // generate histogram
	    for(color=0, ii=0; ii<hh && color<hh; ii++){
		this.hist[ii] = color / hh;
		bin += pdf[ii];
		while( (bin >= avg) && (color < hh) ){
		    bin -= avg;
		    color++;
		}
	    }
	    dval = (hh - 1) /hh;
	    while( ii < hh ){
		this.hist[ii++] = dval;
	    }
	}
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = this.hist[ii * hh / ss];
	    ll = Math.floor(aa * cs);
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    vv = ii / tt;
	    for(jj=0; jj < (hh - 1); jj++){
		if( this.hist[jj] > vv ){
		    break;
		}
	    }
	    aa = jj / hh;
	    this.psInverse[ii] = aa * diff + dmin;
	}
	break;
    default:
	JS9.log("unknown scale '" + this.params.scale + "'");
    }
    // allow chaining
    return this;
};

// create RGB image from scaled colorCells
// sort of from: tksao1.0/frame/truecolor.c, but not really
JS9.Image.prototype.mkRGBImage = function(){
    var rgb, sect, img;
    var xrgb, yrgb, wrgb, hrgb, rgbimg, ctx;
    var xIn, yIn, xOut, yOut, xOutIdx, yOutIdx;
    var yZoom, xZoom, idx, odx, yLen, zx, zy, zyLen;
    var alpha, alpha1, alpha2;
    var ridx, gidx, bidx;
    var rthis=null, gthis=null, bthis=null;
    var dorgb = false;
    // sanity check
    if( !this.rgb ){
	return this;
    }
    if( JS9.globalOpts.rgb.active &&
	((this === JS9.globalOpts.rgb.rim) ||
	 (this === JS9.globalOpts.rgb.gim) ||
	 (this === JS9.globalOpts.rgb.bim)) ){
	dorgb = true;
	if( JS9.globalOpts.rgb.rim ){
	    rthis = JS9.globalOpts.rgb.rim;
	}
	if( JS9.globalOpts.rgb.gim ){
	    gthis = JS9.globalOpts.rgb.gim;
	}
	if( JS9.globalOpts.rgb.bim ){
	    bthis = JS9.globalOpts.rgb.bim;
	}
    }
    ctx = this.display.context;
    rgb = this.rgb;
    sect = rgb.sect;
    // supply your own mkRGBImage call (black-magic, used by smart-x)
    if( this.MakeRGBImage && typeof this.MakeRGBImage === "function" ){
	if( this.MakeRGBImage() ){
	    return this;
	}
    }
    // backward-compatibility with v1.7
    if( this.MakePrimaryImage && typeof this.MakePrimaryImage === "function" ){
	if( this.MakePrimaryImage() ){
	    return this;
	}
    }
    // if we have static RGB file, use the RGB colors from the image
    if( this.rgbFile ){
	wrgb = sect.width / sect.zoom;
	hrgb = sect.height / sect.zoom;
	xrgb = sect.x0;
	yrgb = (this.offscreen.canvas.height - 1) - (sect.y0 + hrgb);
	rgbimg = this.offscreen.context.getImageData(xrgb, yrgb, wrgb, hrgb);
	if( sect.zoom === 1 ){
	    // for unzoomed data, we can grab the RGB pixels directly
	    rgb.img = rgbimg;
	} else {
	    // for zoomed data, we have to replicate each RGB pixel
	    rgb.img = ctx.createImageData(sect.width, sect.height);
	    img = rgb.img;
	    odx = 0;
	    for(yIn=0, yOut=0; yIn<rgbimg.height; yIn++, yOut++){
		yLen = yIn * rgbimg.width;
		yOutIdx = yOut * sect.zoom;
		for(xIn=0, xOut=0; xIn<rgbimg.width; xIn++, xOut++){
		    idx = (yLen + xIn) * 4;
		    xOutIdx = xOut * sect.zoom;
		    for(yZoom=0; yZoom<sect.zoom; yZoom++) {
			zy = Math.floor(yOutIdx + yZoom);
			zyLen = zy * sect.width;
			for(xZoom=0; xZoom<sect.zoom; xZoom++) {
			    zx = Math.floor(xOutIdx + xZoom);
			    odx = (zyLen + zx) * 4;
			    img.data[odx]   = rgbimg.data[idx];
			    img.data[odx+1] = rgbimg.data[idx+1];
			    img.data[odx+2] = rgbimg.data[idx+2];
			    img.data[odx+3] = rgbimg.data[idx+3];
			}
		    }
		}
	    }
	    rgbimg = null;
	}
	return this;
    }
    // create an RGB image if necessary
    if( !rgb.img                         ||
	(rgb.img.width  !== sect.width)  ||
	(rgb.img.height !== sect.height) ){
	rgb.img = ctx.createImageData(sect.width, sect.height);
    }
    img = rgb.img;
    // converting raw data, we need psColors
    if( !this.psColors ){
	return this;
    }
    // opacity is preferred, but alpha is acceptable
    if( this.params.opacity !== undefined ){
	// opacity is 0.0 to 1.0
	alpha = this.params.opacity * 255;
    } else if( this.params.alpha !== undefined ){
	// alpha is 0 to 255
	alpha = this.params.alpha;
    } else {
	alpha = 255;
    }
    // reverse maskData alphas, if necessary
    if( this.maskData ){
	if( this.params.maskInvert ){
	    if( (this.params.opacity !== undefined)     &&
		(this.params.maskOpacity !== undefined) ){
		alpha1 = this.params.opacity * 255;
		alpha2 = this.params.maskOpacity * 255;
	    } else if( (this.params.alpha1 !== undefined) &&
		       (this.params.alpha2 !== undefined) ){
		alpha1 = this.params.alpha2;
		alpha2 = this.params.alpha1;
	    } else {
		alpha1 = 0;
		alpha2 = 255;
	    }
	} else {
	    if( (this.params.opacity !== undefined)     &&
		(this.params.maskOpacity !== undefined) ){
		alpha1 = this.params.maskOpacity * 255;
		alpha2 = this.params.opacity * 255;
	    } else if( (this.params.alpha1 !== undefined) &&
		       (this.params.alpha2 !== undefined) ){
		alpha1 = this.params.alpha1;
		alpha2 = this.params.alpha2;
	    } else {
		alpha1 = 255;
		alpha2 = 0;
	    }
	}
    }
    // index into scaled data using previously calc'ed data value to get RGB
    // reverse y lines
    odx = 0;
    for(yIn=sect.y1-1, yOut=0; yIn>=sect.y0; yIn--, yOut++){
	yLen = yIn * this.raw.width;
	yOutIdx = yOut * sect.zoom;
	for(xIn=sect.x0, xOut=0; xIn<sect.x1; xIn++, xOut++){
	    if( dorgb ){
		ridx = rthis ? rthis.colorData[yLen + xIn] : 0;
		gidx = gthis ? gthis.colorData[yLen + xIn] : 0;
		bidx = bthis ? bthis.colorData[yLen + xIn] : 0;
		if( (ridx === undefined) ||
		    (gidx === undefined) ||
		    (bidx === undefined) ){
		    JS9.globalOpts.rgb.active = false;
		    JS9.error("RGB images are incompatible. Turning off RGB mode.", "", false);
		    JS9.Image.prototype.mkRGBImage.call(this);
		    return this;
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

// calling sequences:
//  blendImage()                   # return current blend params
//  blendImage(true||false)        # turn on/off blending
//  blendImage(mode, opacity)      # set blend mode and opacity
JS9.Image.prototype.blendImage = function(mode, opacity, active){
    // see composite and blend opetations: https://www.w3.org/TR/compositing-1/
    var blendexp = /normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity|clear|copy|source-over|destination-over|source-in|destination-in|source-out|destination-out|source-atop|destination-atop|xor|lighter/i;
    if( arguments.length === 0 ){
	return this.blend;
    }
    // if first argument is true or false, this turns on/off blending
    if( (mode === true) || (mode === false) ){
	this.blend.active = mode;
	if( this.display.blendMode ){
	    this.displayImage();
	}
	return this;
    }
    if( JS9.notNull(mode) || JS9.notNull(opacity) ){
	// set blend mode, if necessary
	if( JS9.notNull(mode) ){
	    if( !blendexp.test(mode) ){
		JS9.error("invalid composite/blend operation: "+mode);
	    }
	    this.blend.mode = mode;
	}
	// set opacity, if necessary
	if( JS9.notNull(opacity) ){
	    this.blend.opacity = opacity;
	}
	// set active state, if necessary
	if( JS9.notNull(active) ){
	    this.blend.active = active;
	}
	// display blended result, if necessary
	if( this.display.blendMode && this.blend.active ){
	    this.displayImage();
	}
    }
    // allow chaining
    return this;
};

// primitive to put image data on screen
JS9.Image.prototype.putImage = function(opts){
    var wcspos, impos;
    var rgb = this.rgb;
    var display = this.display;
    var ctx = display.context;
    var img2canvas = function(that, img) {
	var octx, ocanvas;
	if( !that.offscreenRGB ){
	    ocanvas = document.createElement("canvas");
	    octx = ocanvas.getContext("2d");
	    ocanvas.width= img.width;
	    ocanvas.height = img.height;
	    // turn off anti-aliasing
	    if( !JS9.ANTIALIAS ){
		octx.imageSmoothingEnabled = false;
		octx.mozImageSmoothingEnabled = false;
		octx.webkitImageSmoothingEnabled = false;
		octx.msImageSmoothingEnabled = false;
	    }
	    octx.putImageData(img, 0, 0);
	    that.offscreenRGB = {canvas: ocanvas, context: octx};
	}
	return that.offscreenRGB.canvas;
    };
    // opts is optional
    opts = opts || {};
    // offsets into display
    this.ix = Math.floor((display.canvas.width - rgb.img.width)/2);
    this.iy = Math.floor((display.canvas.height - rgb.img.height)/2);
    // reproject: if reproj wcs header exists, align the display if necessary
    if( this.rawDataLayer() === "reproject" ){
	if( opts.wcsim ){
	    if( this.params.wcsalign ){
		wcspos = opts.wcsim.logicalToDisplayPos({x: opts.wcsim.raw.wcsinfo.crpix1, y: opts.wcsim.raw.wcsinfo.crpix2});
		impos = this.logicalToDisplayPos({x: this.raw.wcsinfo.crpix1, y: this.raw.wcsinfo.crpix2});
		this.wcsix = wcspos.x - impos.x;
		this.wcsiy = wcspos.y - impos.y;
	    }
	}
    }
    // wcs alignment of a reprojected layer, or a (current0) copy of one
    if( this.params.wcsalign ){
	this.ix += this.wcsix * this.rgb.sect.zoom;
	this.iy += this.wcsiy * this.rgb.sect.zoom;
    }
    // draw the image into the context
    if( JS9.notNull(opts.opacity) || JS9.notNull(opts.blend) ){
	ctx.save();
	if( opts.opacity !== undefined ){
	    ctx.globalAlpha = opts.opacity;
	}
	if( opts.blend !== undefined ){
	    ctx.globalCompositeOperation = opts.blend;
	}
	ctx.drawImage(img2canvas(this, rgb.img), this.ix, this.iy);
	ctx.restore();
    } else {
	ctx.putImageData(rgb.img, this.ix, this.iy);
    }
    // allow chaining
    return this;
};

// display image, with pre and post processing based on comma-separated string
// of options:
// colors: generate colorData
// scaled: generate colorCells and scaledCells
// rgb: generate RGB image (happens automatically for any of the above)
// display: displlay image (always done)
// plugins: execute plugin callbacks
// all: colors,scaled,rgb,display,plugins
JS9.Image.prototype.displayImage = function(imode, opts){
    var i, im, bopts;
    var allmode = "colors,scaled,rgb,display,plugins";
    var nblend = 0;
    var blends = [];
    var mode = {};
    var modeFunc = function(element, index, array){
	var el = element.trim();
	mode[el] = true;
	// each step implies the next ones
	switch(el){
	case "colors":
	    mode.scaled = true;
	    mode.rgb = true;
	    break;
	case "scaled":
	    mode.rgb = true;
	    break;
	}
    };
    // special checks for displayMode setting
    if( imode === false ){
	this.displayMode = false;
	return this;
    }
    if( imode === true ){
	this.displayMode = true;
	imode = "all";
    }
    // if displayMode is false, just return
    if( !this.displayMode ){
	return this;
    }
    // did we just pass the opts params?
    if( typeof imode === "object" ){
	opts = imode;
	imode = null;
    }
    if( !imode ){
	imode = "rgb";
    } else if( imode === "all" ){
	imode = allmode;
	mode.notify = true;
    } else if( imode === "rgbonly" ){
	imode = "rgb,nodisplay";
	mode.notify = true;
    } else if( imode === "display" ){
	mode.notify = true;
    }
    // get mode as elements in an object
    imode.split(",").forEach(modeFunc);
    // by default display the image again (unless nodisplay is set)
    mode.display = true;
    // and always call plugins
    mode.plugins = true;
    // if we have a static RGB image, we skip some steps
    if( this.rgbFile ){
	imode.colors = false;
	imode.scaled = false;
    }
    // opts are ... optional
    opts = opts || {};
    // do we need to blend?
    if( this.display.blendMode && (opts.blendMode !== false) ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im.display === this.display) && im.blend.active ){
		blends.push(im);
		nblend++;
	    }
	}
    }
    // generate colordata
    if( mode.colors ){
	// populate the colorData array (offsets into scaled colorcell data)
	this.mkColorData();
	// if we changed colors, the offsreen RGB image is invalid
	this.offscreenRGB = null;
    }
    // generated scaled cells
    if( mode.scaled ){
	// generate color cells from colormap
	this.mkColorCells();
	// generated scaled cells from color cells
	this.mkScaledCells();
	// if we changed scale, the offsreen RGB image is invalid
	this.offscreenRGB = null;
    }
    // generate RGB image from scaled cells
    if( mode.rgb ){
	// make the RGB image
	this.mkRGBImage();
	// if we changed the rgb image, the offscreen RGB image is invalid
	this.offscreenRGB = null;
	if( nblend ){
	    for(i=blends.length-1; i>=0; i--){
		im = blends[i];
		im.mkRGBImage();
		im.offscreenRGB = null;
	    }
	}
    }
    // if we explicitly don't display, reuturn here;
    if( mode.nodisplay ){
	return this;
    }
    // display image on screen
    if( mode.display ){
	// clear image
	this.display.context.clear();
	if( nblend ){
	    for(i=blends.length-1; i>=0; i--){
		im = blends[i];
		// display the image
		bopts = {blend: im.blend.mode, opacity: im.blend.opacity};
		im.putImage(bopts);
		if( im === this ){
		    // display layers for this image
		    im.displayShapeLayers();
		    // notify the helper
		    if( mode.notify ){
			im.notifyHelper();
		    }
		}
	    }
	} else {
	    // display the image
	    this.putImage(opts);
	    // display layers for this image
	    this.displayShapeLayers();
	    // notify the helper
	    if( mode.notify ){
		this.notifyHelper();
	    }
	}
	// mark this image as being in this display
	this.display.image = this;
    }
    // post-processing
    // plugin callbacks
    this.xeqPlugins("image", "onimagedisplay");
    // allow chaining
    return this;
};

// refresh data for an existing image
// input obj is a fits object, array, typed array, etc.
JS9.Image.prototype.refreshImage = function(obj, opts){
    var oxcen, oycen, owidth, oheight, ozoom, doreg;
    var func;
    // check for refresh function
    opts = opts || {};
    opts.rawid = opts.rawid || JS9.RAWID0;
    // allow explicit specification of a function, for backward-compatibility
    if( typeof opts === "function" ){
	func = opts;
	opts = {onrefresh: func};
    }
    if( !opts.onrefresh && JS9.imageOpts.onrefresh ){
	// use global onrefresh, if possible
	opts.onrefresh = JS9.imageOpts.onrefresh;
    }
    // save section in case it gets reset
    oxcen = this.rgb.sect.xcen;
    oycen = this.rgb.sect.ycen;
    ozoom = this.rgb.sect.zoom;
    owidth = this.raw.width;
    oheight = this.raw.height;
    // save old binning
    this.binning.obin = this.binning.bin;
    // generate new data
    this.mkRawDataFromHDU(obj, opts);
    // if binning changed, we have to update the regions and other shape layers
    doreg = (this.binning.obin !== this.binning.bin);
    // restore section unless dims changed (in which case we update regions)
    if( (this.raw.width === owidth) && (this.raw.height === oheight) ){
	this.mkSection(oxcen, oycen, ozoom);
    } else {
	this.mkSection();
	this.mkSection(ozoom);
        doreg = true;
    }
    // display new image data with old section
    this.displayImage("colors", opts);
    // update shape layers if necessary
    if( doreg ){
	this.refreshLayers();
	// also update region values
	this.updateShapes("regions", "all", "binning");
    }
    // call onrefresh function, if necessary
    if( opts.onrefresh ){
	try{ JS9.xeqByName(opts.onrefresh, window, this); }
	catch(e){ JS9.error("in image refresh callback", e); }
    }
    // plugin callbacks
    this.xeqPlugins("image", "onimagerefresh");
    // allow chaining
    return this;
};

// display the specified extension of a multi-extension FITS file
JS9.Image.prototype.displayExtension = function(extid, opts){
    var i, s, got, extOpts, extname, im, id;
    var that = this;
    var newExtHandler = function(hdu){
	var iid;
	var ss = "";
	var topts = {};
	// the id might have changed if we changed extensions
	if( hdu.fits.extname ){
	    ss = sprintf("[%s]", hdu.fits.extname);
	} else if( hdu.fits.extnum ){
	    if( hdu.fits.extnum > 0 ){
		ss = sprintf("[%s]", hdu.fits.extnum);
	    } else {
		ss = "";
	    }
	}
	iid = that.id.replace(/\[.*\]/,"") + ss;
	if( opts.separate ){
	    topts.id = iid;
	    topts.display = that.display;
	    JS9.checkNew(new JS9.Image(hdu, topts));
	} else {
	    topts.file = iid;
	    topts.id = iid;
	    that.refreshImage(hdu, topts);
	}
    };
    // sanity check
    if( extid === undefined ){
	JS9.error("missing extname/extnum for displayExtension()");
    }
    // opts is ... optional
    opts = opts || {};
    // only makes sense if we have hdus
    if( !this.hdus ){
	JS9.error("no FITS HDUs found for displayExtension()");
    }
    // only makes sense if we have a virtual file
    if( this.raw.hdu && this.raw.hdu.fits && this.raw.hdu.fits.fptr ){
	// access virtual file via its fits pointer
	extOpts = {fptr: this.raw.hdu.fits.fptr, vfile: this.raw.hdu.vfile};
	// extname specified?
	if( typeof extid === "string" ){
	    extOpts.extname = extid;
	    extname = extid.toLowerCase();
	    for(i=0, got=0; i<this.hdus.length; i++){
		if( this.hdus[i].name &&
		    this.hdus[i].name.toLowerCase() === extname ){
		    got++;
		    break;
		}
	    }
	    if( !got ){
		JS9.error(sprintf("no FITS HDU %s for displayExtension()",
				  extid));
	    }
	// extnum specified?
	} else if( typeof extid === "number" ){
	    extOpts.extnum = extid;
	    if( this.hdus[extid] ){
		extname = this.hdus[extid].name || extid.toString();
	    } else {
		JS9.error(sprintf("no FITS HDU %s for displayExtension()",
				 extid));
	    }
	}
	// if we are creating a separate file, see if we already have it
	if( opts.separate ){
	    s = sprintf("[%s]", extname);
	    id = this.id.replace(/\[.*\]/,"") + s;
	    for(i=0, got=0; i<JS9.images.length; i++){
		im = JS9.images[i];
		if( id === im.id ){
		    if( $("#"+im.display.id).length > 0 ){
			if( this.display.id === im.display.id ){
			    got++;
			    break;
			}
		    }
		}
	    }
	    if( got ){
		im.displayImage("display", opts);
		im.clearMessage();
		return;
	    }
	}
	// process the FITS file by going to the extname/extnum
	JS9.fits.handleFITSFile("", extOpts, newExtHandler);
    } else {
	JS9.error("virtual FITS file is missing for displayExtension()");
    }
    // allow chaining
    return this;
};

// display the specified slice of a 3D or 4d FITS cube
JS9.Image.prototype.displaySlice = function(slice, opts){
    var sliceOpts;
    var that = this;
    var newSliceHandler = function(hdu){
	var im, s;
	if( opts.separate ){
	    s = sprintf("[%s]", sliceOpts.slice);
	    s = s.replace(/([0-9][0-9]*)/, "$1:$1");
	    opts.id = that.id.replace(/\[.*\]/,"") + s;
	    hdu.filename = that.file.replace(/\[.*\]/,"") + s;
	    im = JS9.lookupImage(opts.id, that.display.id);
	    if( im ){
		im.slice = sliceOpts.slice;
		im.displayImage("display", opts);
		im.clearMessage();
	    } else {
		JS9.Load(hdu, opts, {display: opts.display || that.display});
	    }
	} else {
	    that.slice = sliceOpts.slice;
	    that.refreshImage(hdu, JS9.fits.options);
	}
    };
    // sanity check
    if( slice === undefined ){
	JS9.error("missing slice for displaySlice()");
    }
    // opts is ... optional
    opts = opts || {};
    // only makes sense if we have a virtual file
    if( this.raw.hdu && this.raw.hdu.fits && this.raw.hdu.fits.fptr ){
	// access virtual file via its fits pointer
	sliceOpts = {fptr: this.raw.hdu.fits.fptr, vfile: this.raw.hdu.vfile};
	// slicename or slicenum specified?
	if( JS9.isNumber(slice) ){
	    sliceOpts.slice = sprintf("*,*,%s", slice);
	} else {
	    sliceOpts.slice = slice;
	}
	// process the FITS file by going to the slice
	JS9.fits.handleFITSFile("", sliceOpts, newSliceHandler);
    } else {
	JS9.error("virtual FITS file is missing for displaySlice()");
    }
    // allow chaining
    return this;
};

// convert current image to array
JS9.Image.prototype.toArray = function(){
    var i, j, k, bpe, idx, le;
    var header, npad, arr, buf, dbuf, _dbuf;
    dbuf = this.raw.data.buffer;
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
    return buf;
};

// get pan location
JS9.Image.prototype.getPan = function(panx, pany){
    return {x: (this.rgb.sect.x0 + this.rgb.sect.x1)/2+1,
	    y: (this.rgb.sect.y0 + this.rgb.sect.y1)/2+1};
};

// set pan location of RGB image (using image coordinates)
JS9.Image.prototype.setPan = function(panx, pany){
    var i, key, bpanx, bpany, bw2, bh2, im;
    var w2 = this.raw.width / 2;
    var h2 = this.raw.height / 2;
    if( arguments.length === 0 ){
	panx = w2;
	pany = h2;
    }
    this.mkSection(panx, pany);
    // set pan for blended images, if necessary
    if( this.display.blendMode ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im !== this) &&
		(im.display === this.display) && im.blend.active ){
		bw2 = im.raw.width / 2;
		bh2 = im.raw.height / 2;
		if( arguments.length === 0 ){
		    bpanx = bw2;
		    bpany = bh2;
		} else {
		    bpanx = bw2 - (w2 - panx);
		    bpany = bh2 - (h2 - pany);
		}
		JS9.Image.prototype.mkSection.call(im, bpanx, bpany);
	    }
	}
    }
    this.displayImage("rgb");
    // pan/zoom the shape layers
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    if( this.layers[key].show &&
		this.layers[key].opts.panzoom ){
		this.refreshShapes(key);
	    }
	}
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetpan");
    }
    // allow chaining
    return this;
};

// return current zoom
JS9.Image.prototype.getZoom = function(){
    return this.rgb.sect.zoom;
};

// return zoom from zoom string
JS9.Image.prototype.parseZoom = function(zval){
    var ozoom, nzoom;
    // get old zoom
    ozoom = this.rgb.sect.zoom;
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
	    // a little rounding makes the zoom nicer
	    nzoom = Math.round((nzoom + 0.00001) * 100) / 100;
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

// set zoom of RGB image
JS9.Image.prototype.setZoom = function(zval){
    var i, nzoom, key, im;
    nzoom = this.parseZoom(zval);
    if( !nzoom ){
	return;
    }
    // remake section
    this.mkSection(nzoom);
    // set zoom for blended images, if necessary
    if( this.display.blendMode ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im !== this) &&
		(im.display === this.display) && im.blend.active ){
		JS9.Image.prototype.mkSection.call(im, nzoom);
	    }
	}
    }
    // redisplay the image
    this.displayImage("rgb");
    // pan/zoom the shape layers
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    if( this.layers[key].show &&
		this.layers[key].opts.panzoom ){
		this.refreshShapes(key);
	    }
	}
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetzoom");
    }
    // allow chaining
    return this;
};

// refresh all layers
JS9.Image.prototype.refreshLayers = function(){
    this.setZoom(this.getZoom());
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
    var rgb = this.rgb;
    var sect = this.rgb.sect;
    var ipos = {};
    // for zoomed images, the image coordinate is at the center
    if( sect.zoom <= 1 ){
	ipos.x = (dpos.x - this.ix) / sect.zoom + sect.x0 + 1;
	ipos.y = ((rgb.img.height - 1) - (dpos.y - this.iy)) / sect.zoom + sect.y0 + 1;
    } else {
	ipos.x = (dpos.x - this.ix) / sect.zoom + sect.x0 + 1 - 0.5;
	ipos.y = ((rgb.img.height - 1) - (dpos.y - this.iy)) / sect.zoom + sect.y0 + 1 - 0.5;
    }
    return ipos;
};

// return 0-indexed display coords for specified 1-indexed image position
JS9.Image.prototype.imageToDisplayPos = function(ipos){
    var rgb = this.rgb;
    var sect = this.rgb.sect;
    var dpos = {};
    // for zoomed images, the image coordinate is at the center
    if( sect.zoom <= 1 ){
	dpos.x = (((ipos.x - 1) - sect.x0) * sect.zoom) + this.ix;
	dpos.y = (sect.y0 - (ipos.y - 1)) * sect.zoom + (rgb.img.height - 1) + this.iy;
    } else {
	dpos.x = (((ipos.x - 1 + 0.5) - sect.x0) * sect.zoom) + this.ix;
	dpos.y = (sect.y0 - (ipos.y - 1 + 0.5)) * sect.zoom + (rgb.img.height - 1) + this.iy;
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
    } else if( wcssys === "physical" ){
	this.params.wcssys = "physical";
	this.params.wcsunits = "pixels";
    } else if( this.raw.wcs && (this.raw.wcs > 0) ){
	if( wcssys === "native" ){
	    wcssys = this.params.wcssys0;
	}
	s = JS9.wcssys(this.raw.wcs, wcssys);
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
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetwcssys");
    }
    // allow chaining
    return this;
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
    } else if( this.raw.wcs && (this.raw.wcs > 0) ){
	if( (this.params.wcssys === "image") ||
	    (this.params.wcssys === "physical") ){
	    ws = JS9.imageOpts.wcssys;
	    this.setWCSSys(this.raw.wcs, ws);
	}
	s = JS9.wcsunits(this.raw.wcs, wcsunits);
	if( s ){
	    this.params.wcsunits = s.trim();
	    this.updateShapes("regions", "all", "update");
	}
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetwcsunits");
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
	    var rstr, r, s, cc, im, regexp;
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
	    // unless we have no stdout
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
			// is this a bad "feature" in tpos?? probably ...
			if( im.fitsFile.indexOf("/") < 0 ){
			    basedir = im.file.match( /.*\// );
			    // but don't add installdir as part of prefix
			    // (fitsFile path is relative to the js9 directory)
			    if( basedir && basedir.length ){
				regexp = new RegExp("^"+JS9.INSTALLDIR);
				basedir = basedir[0].replace(regexp, "");
				im.fitsFile =  basedir + im.fitsFile;
			    }
			}
			// prepend JS9_DIR on files if fits is not absolute
			if( JS9.analOpts.prependJS9Dir ){
			    if( im.fitsFile
				&& im.fitsFile.charAt(0) !== "/" ){
				im.fitsFile = "${JS9_DIR}/" + im.fitsFile;
			    }
			    if( im.parentFile
				&& im.parentFile.charAt(0) !== "/" ){
				im.parentFile = "${JS9_DIR}/" + im.parentFile;
			    }
			}
		    } else {
			cc = s.lastIndexOf("/") + 1;
			im.fitsFile = JS9.analOpts.dataDir + "/" + s.slice(cc);
		    }
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 fitsFile: %s %s", im.file, im.fitsFile);
		    }
		}
	    }
	    if( im.fitsFile ){
		im.fitsFile = im.fitsFile.replace(/\/\.\//g, "/");
	    }
	    if( im.parentFile ){
		im.parentFile = im.parentFile.replace(/\/\.\//g, "/");
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
    cmd = s.replace(/\$([a-zA-Z0-9_()]+)/g, function(m, t, o){
	var i, r, owcssys;
	var savewcs = function(im, wcssys){
	    var owcs = im.params.wcssys;
	    if( wcssys ){
		switch(wcssys){
		case "wcs":
		    if( (owcs === "physical") || (owcs === "image") ){
			im.params.wcssys = im.params.wcssys0;
		    }
		    break;
		case "physical":
		case "image":
		    im.params.wcssys = wcssys;
		    break;
		default:
		    break;
		}
	    }
	    return owcs;
	};
	var restorewcs = function(im, wcssys){
	    if( wcssys ){
		im.params.wcssys = wcssys;
	    }
	};
	var withext = function(im, r){
	    var e;
	    // for tables, we might need to add the binning filter
	    if( (im.imtab === "table") && (im.raw.hdu.table.filter) ){
		r += '[' + im.raw.hdu.table.filter + ']';
	    } else if( im.imtab === "image" ){
		// for images, we might need to add/replace extension info
		e = im.file.match(/\[.*\]/);
		if( e ){
		    if( r.match(/\[.*\]/) ){
			r = r.replace(/\[.*\]/, e);
		    } else {
			r += e;
		    }
		}
	    }
	    return r;
	};
	var u = t.split("(");
	if( u[1] ){
	    u[1] = u[1].replace(/\)$/, "");
	}
	switch(u[0]){
	case "id":
	    r = that.display.divjq.attr("id");
	    break;
	case "image":
	case "png":
	    r = that.id;
	    break;
	case "filename":
	    if( u[1] === "parent" && that.parentFile ){
		r = that.parentFile;
	    } else if( that.fitsFile ){
		r = withext(that, that.fitsFile);
	    } else {
		JS9.error("no FITS file for " + that.id);
	    }
	    break;
	case "fits":
	    if( !that.fitsFile ){
		JS9.error("no FITS file for " + that.id);
	    }
	    r = withext(that, that.fitsFile);
	    break;
	case "parent":
	    if( !that.parentFile ){
		JS9.error("no parent FITS file for " + that.id);
	    }
	    r = that.parentFile;
	    break;
	case "ext":
	    if( that.fitsFile ){
		r = that.fitsFile.match(/\[.*\]/);
		if( r === null ){
		    r = "";
		}
	    } else {
		JS9.error("no FITS file for " + that.id);
	    }
	    break;
	case "sregions":
	    owcssys = savewcs(that, u[1]);
	    r = that.listRegions("source", 0).replace(/\s+/g,"");
	    restorewcs(that, owcssys);
	    break;
	case "bregions":
	    owcssys = savewcs(that, u[1]);
	    r = that.listRegions("background", 0).replace(/\s+/g,"");
	    restorewcs(that, owcssys);
	    break;
	case "regions":
	    owcssys = savewcs(that, u[1]);
	    r = that.listRegions("all", 0).replace(/\s+/g,"");
	    restorewcs(that, owcssys);
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
    var i, a, f, m;
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
    // change the cursor to show the waiting status
    JS9.waiting(true, this.display.divjq[0]);
    JS9.helper.send(m, obj, function(r){
	var s, robj;
	JS9.waiting(false);
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
		if( s.search(/WARNING/i) >= 0 ){
		    JS9.log(s);
		} else {
		    JS9.error(s, JS9.analOpts.epattern);
		}
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
	    case "png":
		f = robj.stdout.trim().replace(/\/\.\//, "/");
		// relative path: add install dir prefix
		if( f.charAt(0) !== "/" ){
		    f = JS9.InstallDir(f);
		}
		// load new file
	        JS9.Load(f, {proxyFile: f}, {display: that.display});
		break;
	    case "none":
		break;
	    default:
		JS9.error("unknown analysis result type: " + a.rtype);
	    break;
	    }
	}
    });
    // allow chaining
    return this;
};

// display analysis results (text or plot)
JS9.Image.prototype.displayAnalysis = function(type, s, title, winFormat){
    var id, did, hstr, pobj, divjq, opts, titlefile;
    var a = JS9.lightOpts[JS9.LIGHTWIN];
    // make up title, if necessary
    if( !title && this ){
	titlefile = (this.fitsFile || this.id);
	titlefile = titlefile.split("/").reverse()[0];
	title = "AnalysisResults: " + titlefile;
	// add display to title
	title += sprintf(JS9.IDFMT, this.display.id);
    }
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
	did = JS9.lightWin(id, "inline", hstr, title, winFormat||a.textWin);
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
	did = JS9.lightWin(id, "inline", hstr, title, winFormat||a.plotWin);
	// find the inner plot div that now is inside the light window
	divjq = $("#" + id + " #" + id + "Plot");
	// flot data
	if( pobj.data ){
	    // set up linear/log transforms and plot the graph
	    if( this ){
		opts = this.params.plotOpts;
	    } else {
		opts = JS9.plotOpts;
	    }
	    try{ $.plot(divjq, [pobj], opts); }
	    catch(e){ JS9.error("can't plot data", e); }
	}
	break;
    case "params":
	if( JS9.allinone ){
	    did = JS9.lightWin(id, "inline", s, title, winFormat||a.paramWin);
	} else {
	    did = JS9.lightWin(id, "ajax", s, title, winFormat||a.paramWin);
	}
	break;
    case "textline":
	if( JS9.allinone ){
	    did = JS9.lightWin(id, "inline", s, title, winFormat||a.dpathWin);
	} else {
	    did = JS9.lightWin(id, "ajax", s, title, winFormat||a.dpathWin);
	}
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
		mimeType: "application/json",
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

// save image as a FITS file
JS9.Image.prototype.saveFITS = function(fname){
    var arr, blob;
    if( window.hasOwnProperty("saveAs") ){
	fname = fname || "js9.fits";
	// first convert to array
	arr = this.toArray();
	// then convert array to blob
	blob = new Blob([arr], {type: "application/octet-binary"});
	// save to disk
	saveAs(blob, fname);
    } else {
	JS9.error("no saveAs function available to save FITS file");
    }
    return fname;
};

// save image as an img file of specified type (e.g., image/png, image/jpeg)
JS9.Image.prototype.saveIMG = function(fname, type, encoderOpts){
    var key,img, ctx;
    if( window.hasOwnProperty("saveAs") ){
	fname = fname || "js9.png";
	// create off-screen canvas, into which we write all canvases
	img = document.createElement("canvas");
	img.setAttribute("width", this.display.width);
	img.setAttribute("height", this.display.height);
	ctx = img.getContext("2d");
	// image display canvas
	ctx.drawImage(this.display.canvas, 0, 0);
	for( key in this.layers ){
	    if( this.layers.hasOwnProperty(key) ){
		// each layer canvas
		if( this.layers[key].dlayer.dtype === "main" &&
		    this.layers[key].show ){
		    ctx.drawImage(this.layers[key].dlayer.canvasjq[0], 0, 0);
		}
	    }
	}
	// save as specified type
	type = type || "image/png";
	// sanity check on quality
	if( encoderOpts !== undefined ){
	    if( encoderOpts < 0 || encoderOpts > 1 ){
		encoderOpts = 0.95;
	    }
	}
	img.toBlob(function(blob){
	    saveAs(blob, fname);
	}, type, encoderOpts);
    } else {
	JS9.error("no saveAs function available for saving image");
    }
    return fname;
};

// save image as a PNG file
JS9.Image.prototype.savePNG = function(fname){
    fname = fname || "js9.png";
    return this.saveIMG(fname, "image/png");
};

// save image as a JPEG file
JS9.Image.prototype.saveJPEG = function(fname, quality){
    fname = fname || "js9.jpeg";
    return this.saveIMG(fname, "image/jpeg", quality);
};

// update (and display) pixel and wcs values (connected to info plugin)
JS9.Image.prototype.updateValpos = function(ipos, disp){
    var val, vstr, val3, i, c, s;
    var obj = null;
    var prec = JS9.floatPrecision(this.params.scalemin, this.params.scalemax);
    var tf = function(fval, length){
	return JS9.floatFormattedString(fval, prec, 3);
    };
    var tr = function(fval, length){
	length = length || 3;
	return fval.toFixed(length);
    };
    var ti = function(ival, length) {
        var r = "";
	var prefix = "";
	length = length || 3;
	if( ival < 0 ){
	    ival = Math.abs(ival);
	    prefix = "-";
	}
	r = r + ival;
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
	    val3 = ti(val);
	    break;
	case -32:
	case -64:
	    val3 = tf(val);
	    break;
	default:
	    val3 = ti(val);
	    break;
	}
	// create the valpos string
	// since we can call this in mousemove, optimize by not using sprintf
	vstr = "value(" + val3 + ") " + c.sys + "(" + tr(c.x, 3) + ", " + tr(c.y, 3) + ")";
	// object containing all information
	obj = {ix: i.x, iy: i.y, isys: "image", px: c.x, py: c.y, psys: c.sys,
	       ra: "", dec: "", wcssys: "", val: val, val3: val3, vstr: vstr,
	       id: this.id, file: this.file, object: this.object};
	// add wcs, if necessary
	if( (this.raw.wcs > 0) &&
	    (this.params.wcssys !== "image") &&
	    (this.params.wcssys !== "physical") ){
	    s = JS9.pix2wcs(this.raw.wcs, ipos.x, ipos.y).trim().split(/\s+/);
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
	    JS9.globalOpts.rgb.active = !JS9.globalOpts.rgb.active;
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
	    if( this.cmapObj ){
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
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetcolormap");
    }
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
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetscale");
    }
    return this;
};

// re-calculate data min and max (and set scale params, if necessary)
JS9.Image.prototype.dataminmax = function(){
    var i, blankval;
    var reminscale = isNaN(this.params.scalemin) ||
                     (this.params.scalemin === undefined);
    var remaxscale = isNaN(this.params.scalemax) ||
                     (this.params.scalemax === undefined);
    // might have to redo scaling if it's tied to current data min or max
    if( this.params.scaleclipping === "dataminmax" ){
	if( (this.raw.dmin === this.params.scalemin) ||
	    (this.raw.dmin === undefined)            ){
	    reminscale = true;
	}
	if( (this.raw.dmax === this.params.scalemax) ||
	    (this.raw.dmax === undefined)            ){
	    remaxscale = true;
	}
    }
    // re-calculate data min and max values
    this.raw.dmin = Number.MAX_VALUE;
    this.raw.dmax = Number.MIN_VALUE;
    // get data min and max, ignoring type-dependent blank values
    if( this.raw.bitpix > 0 ){
	// integer data: BLANK header value specifies data value to ignore
	if( this.raw.header.BLANK !== undefined ){
	    blankval = this.raw.header.BLANK;
	    for(i=0; i<this.raw.data.length; i++) {
		if( this.raw.data[i] !== blankval ){
		    this.raw.dmin = Math.min(this.raw.dmin, this.raw.data[i]);
		    this.raw.dmax = Math.max(this.raw.dmax, this.raw.data[i]);
		}
	    }
	} else {
	    for(i=0; i<this.raw.data.length; i++) {
		this.raw.dmin = Math.min(this.raw.dmin, this.raw.data[i]);
		this.raw.dmax = Math.max(this.raw.dmax, this.raw.data[i]);
	    }
	}
    } else {
	// float data: ignore NaN
	for(i=0; i<this.raw.data.length; i++) {
	    if( !isNaN(this.raw.data[i]) ){
		this.raw.dmin = Math.min(this.raw.dmin, this.raw.data[i]);
		this.raw.dmax = Math.max(this.raw.dmax, this.raw.data[i]);
	    }
	}
    }
    // re-set scaling values, if necessary
    if( reminscale ){
	this.params.scalemin = this.raw.dmin;
    }
    if( remaxscale ){
	this.params.scalemax = this.raw.dmax;
    }
    // allow chaining
    return this;
};

// the zscale calculation
JS9.Image.prototype.zscale = function(setvals){
    var s, rawdata, bufsize, buf, vals;
    // sanity check
    if( !JS9.zscale || !this.raw || !this.raw.data ){
	return this;
    }
    rawdata = this.raw.data;
    // allocate space for the image in the emscripten heap
    bufsize = rawdata.length * rawdata.BYTES_PER_ELEMENT;
    try{ buf = JS9.vmalloc(bufsize); }
    catch(e){ JS9.error("image too large for zscale malloc: " + bufsize, e); }
    // copy the raw image data to the heap
    // try{ JS9.vheap.set(new Uint8Array(rawdata.buffer), buf); }
    try{ JS9.vmemcpy(new Uint8Array(rawdata.buffer), buf); }
    catch(e){ JS9.error("can't copy image to zscale heap: " + bufsize, e); }
    // call the zscale routine
    s = JS9.zscale(buf,
		   this.raw.width,
		   this.raw.height,
		   this.raw.bitpix,
		   this.params.zscalecontrast,
		   this.params.zscalesamples,
		   this.params.zscaleline);
    // free empscripten heap space
    JS9.vfree(buf);
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

// make (or select) a raw data layer
// im.rawDataLayer(obj, func) -- editing existing or create new raw data layer
// obj properties:
//    rawid: id of new raw data (default: "alt")
//    oraw: id of raw data to pass to func or "current" (default: "raw0")
//    from: string describing origin of this raw data (def: "func")
// im.rawDataLayer(id) -- switch to existing raw data later with specified id
JS9.Image.prototype.rawDataLayer = function(opts, func){
    var i, j, raw, oraw, nraw, rawid, cur, nlen, carr;
    // no arg => return name of current raw
    if( !arguments.length ){
	return this.raw.id;
    }
    // opts is a string and no function: switch to a different raw data layer
    // opts is a string with function: generate opts object
    if( typeof opts === "string" ){
	if( typeof func === "function" ){
	    opts = {rawid: opts};
	} else {
	    for(i=0; i<this.raws.length; i++){
		raw = this.raws[i];
		if( opts === raw.id ){
		    if( func === "remove" ){
			if( opts === "raw0" ){
			    JS9.error("can't remove primary (raw0) data layer");
			}
			if( raw.hdu && raw.hdu.fits ){
			    // delete vfile associated with this layer?
			    carr = JS9.lookupVfile(raw.hdu.fits.vfile);
			    if( carr.length <= 1 ){
				JS9.fits.cleanupFITSFile(raw.hdu.fits, true);
			    }
			}
			// default is to go back to original raw data
			this.raw = this.raws[0];
			// but go back to origin of this layer if necessary
			if( raw.current0 && raw.current0.id ){
			    // look for origin
			    for(j=0; j<this.raws.length; j++){
				if( raw.current0.id === this.raws[j].id ){
				    // found it!
				    this.raw = this.raws[j];
				    break;
				}
			    }
			}
			// remove layer
			this.raws.splice(i, 1);
			// renew bitpix, if necessary
			if( this.raw.header.bitpix ){
			    this.raw.bitpix = this.raw.header.bitpix;
			}
			// re-calculate min and max
			this.dataminmax();
			this.mkSection();
			this.displayImage("all", opts);
			return true;
		    }
		    this.raw = raw;
		    if( this.raw.header.bitpix ){
			this.raw.bitpix = this.raw.header.bitpix;
		    }
		    this.dataminmax();
		    this.mkSection();
		    // redisplay using these data
		    this.displayImage("all", opts);
		    // extended plugins
		    if( JS9.globalOpts.extendedPlugins ){
			this.xeqPlugins("image", "onrawdatalayer");
		    }
		    return true;
		}
	    }
	    return false;
	}
    }
    // otherwise, sanity check if we are going to change data
    if( typeof func !== "function" ){
	return false;
    }
    // opts is ... optional
    opts = opts || {};
    // but the id is not
    rawid = opts.rawid || JS9.RAWIDX;
    // which of the "old" raws do we pass to func?
    if( opts.oraw === undefined ){
	opts.oraw = "current0";
    }
    if( opts.oraw === "current" ){
	// use currently active raw
	oraw = this.raw;
    } else if( opts.oraw === "current0" ){
	// use the original current data for this layer, if possible;
	for(i=0; i<this.raws.length; i++){
	    raw = this.raws[i];
	    if( rawid === raw.id ){
		oraw = raw.current0;
		break;
	    }
	}
	// else use currently active raw
	if( !oraw ){
	    oraw = this.raw;
	}
    } else {
	// look for oraw matching 'oraw' property
	for(i=0; i<this.raws.length; i++){
	    raw = this.raws[i];
	    if( opts.oraw === raw.id ){
		oraw = raw;
		break;
	    }
	}
    }
    // if all else fails: use initial (raw0)
    if( !oraw ){
	oraw = this.raws[0];
    }
    // look for existing nraw by id
    cur = -1;
    for(i=0; i<this.raws.length; i++){
	if( rawid === this.raws[i].id ){
	    nraw = this.raws[i];
	    cur = i;
	    break;
	}
    }
    // if we don't have an existing nraw, make a copy from oraw
    if( (cur < 0) || opts.alwaysCopy ){
	// make copy
	nraw = $.extend(true, {}, oraw);
	// save "initial" current
	if( !nraw.current0 ){
	    nraw.current0 = oraw;
	}
	// but ensure that data is a copy, not a pointer to the original!
	if( opts.bitpix ){
	    // different bitpix from oraw specified?
	    switch(opts.bitpix){
	    case 8:
		nraw.data = new Uint8Array(oraw.height * oraw.width);
		break;
	    case 16:
		nraw.data = new Int16Array(oraw.height * oraw.width);
		break;
	    case -16:
		nraw.data = new Uint16Array(oraw.height * oraw.width);
		break;
	    case 32:
		nraw.data = new Int32Array(oraw.height * oraw.width);
		break;
	    case -32:
		nraw.data = new Float32Array(oraw.height * oraw.width);
		break;
	    case -64:
		nraw.data = new Float64Array(oraw.height * oraw.width);
		break;
	    }
	    // copy data and convert data type
	    nlen = nraw.width * nraw.height;
	    for(i=0; i<nlen; i++){
		nraw.data[i] = oraw.data[i];
	    }
	    nraw.bitpix = opts.bitpix;
	} else {
	    switch(oraw.bitpix){
	    case 8:
		nraw.data = new Uint8Array(oraw.data);
		break;
	    case 16:
		nraw.data = new Int16Array(oraw.data);
		break;
	    case -16:
		nraw.data = new Uint16Array(oraw.data);
		break;
	    case 32:
		nraw.data = new Int32Array(oraw.data);
		break;
	    case -32:
		nraw.data = new Float32Array(oraw.data);
		break;
	    case -64:
		nraw.data = new Float64Array(oraw.data);
		break;
	    }
	}
	// set id for copy
	nraw.id = rawid;
	// where did this raw data come from?
	nraw.from = opts.from || nraw.from || "func";
    }
    // call the function to fill in the nraw data
    if( func.call(this, oraw, nraw, opts) ){
	// replace existing nraw with new version
	if( cur >= 0 ){
	    this.raws[cur] = nraw;
	} else {
	    this.raws.push(nraw);
	}
	// assign this nraw to the high-level raw data object
	this.raw = nraw;
	// renew bitpix, if necessary
	if( this.raw.header.bitpix ){
	    this.raw.bitpix = this.raw.header.bitpix;
	}
	// re-calculate min and max
	this.dataminmax();
	// redisplay using these data
	this.displayImage("all", opts);
    }
    return true;
};

// perform a gaussian blur on the raw data
// creates a new raw data layer ("gaussBlur")
JS9.Image.prototype.gaussBlurData = function(sigma){
    var opts = {};
    if( sigma === undefined ){
	JS9.error("missing sigma value for gaussBlurData");
    }
    opts = opts || {};
    // the blurred image will be floating point
    if( this.raw.bitpix === -64 ){
	opts.bitpix = -64;
    } else {
	opts.bitpix = -32;
    }
    // use current (and keep using it)
    opts.oraw = "current0";
    // nraw should be a floating point copy of oraw
    opts.alwaysCopy = true;
    // new layer
    opts.rawid = opts.rawid || "gaussBlur";
    // pass the options
    opts.sigma = sigma;
    // call routine to generate (or modify) the new layer
    this.rawDataLayer(opts, function (oraw, nraw, opts){
	var tdata;
	// nraw contains a floating point copy of oraw
	// make a temporary copy of nraw data for calculations
	switch(nraw.bitpix){
	case -32:
	    tdata = new Float32Array(nraw.data);
	    break;
	case -64:
	    tdata = new Float64Array(nraw.data);
	    break;
	default:
	    JS9.error("invalid temp bitpix for gaussBlur: " + nraw.bitpix);
	    break;
	}
	// the heart of the matter!
	gaussBlur(tdata, nraw.data, nraw.width, nraw.height, sigma);
	return true;
    });
    // allow chaining
    return this;
};

// perform arithmetic operations on the raw data
// creates a new raw data layer ("imarith")
JS9.Image.prototype.imarithData = function(op, arg1, opts){
    var im;
    // no args means return the available ops
    if( !arguments.length ){
	return ["add", "sub", "mul", "div", "min", "max", "reset"];
    }
    opts = opts || {};
    opts.rawid = opts.rawid || "imarith";
    // special case: reset by deleting the layer
    if( (op === "reset") || (op === "remove") ){
	this.rawDataLayer(opts.rawid, "remove");
	return;
    }
    // sanity check
    if( op === undefined || arg1 === undefined ){
	JS9.error("missing arg(s) for image arithmetic");
    }
    // operation: add, sub, mul, div ...
    switch(op){
    case "add":
    case "sub":
    case "mul":
    case "div":
    case "min":
    case "max":
	opts.op = op;
	break;
    default:
	JS9.error("invalid operator for image arithmetic: " + op);
	break;
    }
    // arg1: can be an image object or a numeric value
    if( typeof arg1 === "object" ){
	if( !arg1.raw.hdu || !arg1.raw.hdu.fits || !arg1.raw.hdu.fits.vfile ){
	    JS9.error("no virtual FITS file for image arithmetic: " + arg1.id);
	} else {
	    opts.argtype = "image";
	    opts.argval = arg1;
	}
	if( (this.raw.width  !== arg1.raw.width)  ||
	    (this.raw.height !== arg1.raw.height) ){
	    JS9.error("images must be the same size for image arithmetic");
	}
    } else if( JS9.isNumber(arg1) ){
	opts.argtype = "value";
	opts.argval = arg1;
    } else {
	// lookup the image by name
	im = JS9.lookupImage(arg1);
	if( !im ){
	    JS9.error("imarith arg1 must be an image or a constant: "+arg1);
	}
	opts.argval = im;
	opts.argtype = "image";
    }
    // check for invalid args
    if( (opts.op === "div") &&
	(opts.argtype === "value") && (opts.argval === 0) ){
	JS9.error("imarith can't divide by zero (nor can anyone else)");
    }
    // choose a decent bitpix
    if( !opts.bitpix ){
	switch(opts.argtype){
	case "image":
	    if( (this.raw.bitpix > 0) && (opts.argval.raw.bitpix > 0) ){
		opts.bitpix = Math.max(this.raw.bitpix, opts.argval.raw.bitpix);
	    } else if( (this.raw.bitpix < 0) && (opts.argval.raw.bitpix < 0) ){
		opts.bitpix = Math.min(this.raw.bitpix, opts.argval.raw.bitpix);
	    } else if( (this.raw.bitpix < 0) && (opts.argval.raw.bitpix > 0) ){
		opts.bitpix = this.raw.bitpix;
	    } else {
		opts.bitpix = opts.argval.raw.bitpix;
	    }
	    break;
	case "value":
	    if( this.raw.bitpix === -64 ){
		opts.bitpix = -64;
	    } else {
		opts.bitpix = -32;
	    }
	    break;
	}
    }
    // nraw should be a opts.bitpix copy of oraw
    opts.alwaysCopy = true;
    // use current
    opts.oraw = "current";
    // call routine to generate (or modify) the new layer
    this.rawDataLayer(opts, function (oraw, nraw, opts){
	var i, val;
	switch(opts.argtype){
	case "image":
	    val = opts.argval.raw.data;
	    switch(opts.op){
	    case "add":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] += val[i];
		}
		break;
	    case "sub":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] -= val[i];
		}
		break;
	    case "mul":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] *= val[i];
		}
		break;
	    case "div":
		for(i=0; i<nraw.data.length; i++){
		    if( val[i] === 0 ){
			nraw.data[i] = 0;
		    } else {
			nraw.data[i] /= val[i];
		    }
		}
		break;
	    case "min":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = Math.min(nraw.data[i], val[i]);
		}
		break;
	    case "max":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = Math.max(nraw.data[i], val[i]);
		}
		break;
	    default:
		JS9.error("unknown operation for imarith: " + opts.op);
		break;
	    }
	    break;
	case "value":
	    val = opts.argval;
	    switch(opts.op){
	    case "add":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] += val;
		}
		break;
	    case "sub":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] -= val;
		}
		break;
	    case "mul":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] *= val;
		}
		break;
	    case "div":
		for(i=0; i<nraw.data.length; i++){
		    if( val === 0 ){
			nraw.data[i] = 0;
		    } else {
			nraw.data[i] /= val;
		    }
		}
		break;
	    case "min":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = Math.min(nraw.data[i], val);
		}
		break;
	    case "max":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = Math.max(nraw.data[i], val);
		}
		break;
	    default:
		JS9.error("unknown op for imarith: " + opts.op);
		break;
	    }
	    break;
	default:
	    JS9.error("unknown argument type for imarith: " + opts.argtype);
	    break;
	}
	return true;
    });
    // allow chaining
    return this;
};

// linear shift of raw data (cheap alignment for CFA MicroObservatory)
// creates a new raw data layer ("shift")
JS9.Image.prototype.shiftData = function(x, y, opts){
    if( x === undefined || y === undefined ){
	JS9.error("missing translation value(s) for shiftData");
    }
    opts = opts || {};
    opts.rawid = opts.rawid || "shift";
    opts.x = x;
    opts.y = y;
    this.rawDataLayer(opts, function (oraw, nraw, opts){
	var i, oi, oj, ni, nj, nlen, oU8, nU8, ooff, noff, blankval;
	var bpp = oraw.data.BYTES_PER_ELEMENT;
	if( nraw.xoff === undefined ){
	    nraw.xoff = 0;
	}
	if( nraw.yoff === undefined ){
	    nraw.yoff = 0;
	}
	nraw.xoff += opts.x;
	nraw.yoff += opts.y;
	if( !opts.fill || opts.fill === "clear" ){
	    if( nraw.bitpix > 0 ){
		blankval = opts.blank || nraw.header.BLANK || 0;
		nraw.header.BLANK = blankval;
	    } else {
		blankval = NaN;
	    }
	    if( typeof nraw.data.fill === "function" ){
		nraw.data.fill(blankval);
	    } else {
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = blankval;
		}
	    }
	}
	for(oj=0; oj<oraw.height; oj++){
	    nj = oj + nraw.yoff;
	    if( (nj < 0) || (nj >= oraw.height) ){
		continue;
	    }
	    oi = 0;
	    ni = oi + nraw.xoff;
	    nlen = oraw.width;
	    if( ni < 0 ){
		oi -= ni;
		nlen += ni;
		ni = 0;
	    }
	    if( (ni + nlen) > oraw.width ){
		nlen -= (ni + nlen) - oraw.width;
	    }
	    if( nlen <= 0 ){
		return false;
	    }
	    ooff = (oj * oraw.width + oi) * bpp;
	    oU8 = new Uint8Array(oraw.data.buffer, ooff, nlen * bpp);
	    noff = (nj * oraw.width + ni) * bpp;
	    nU8 = new Uint8Array(nraw.data.buffer, noff, nlen * bpp);
	    nU8.set(oU8);
	}
	return true;
    });
    // allow chaining
    return this;
};

// reproject image using WCS info
// creates a new raw data layer ("reproject")
JS9.Image.prototype.reprojectData = function(wcsim, opts){
    var that = this;
    // could take a while ...
    JS9.waiting(true, this.display.divjq[0]);
    // ... start a timeout to allow the wait spinner to get started
    window.setTimeout(function(){
	var twcs = {};
	var rcomplete = false;
	var awvfile, awvfile2, wvfile, owvfile;
	var wcsheader, wcsstr, oheader, nheader;
	var im, arr, ivfile, ovfile, rstr, key, topts;
	var tab, tx1, tx2, ty1, ty2, s;
	var wcsexp = /NAXIS|NAXIS[1-4]|AMDX|AMDY|CD[1-2]_[1-2]|CDELT[1-4]|CNPIX[1-4]|CO1_[1-9][0-9]|CO2_[1-9][0-9]|CROTA[1-4]|CRPIX[1-4]|CRVAL[1-4]|CTYPE[1-4]|CUNIT[1-4]|DATE|DATE_OBS|DC-FLAG|DEC|DETSEC|DETSIZE|EPOCH|EQUINOX|EQUINOX[a-z]|IMAGEH|IMAGEW|LATPOLE|LONGPOLE|MJD-OBS|PC00[1-4]00[1-4]|PC[1-4]_[1-4]|PIXSCALE|PIXSCAL[1-2]|PLTDECH|PLTDECM|PLTDECS|PLTDECSN|PLTRAH|PLTRAM|PLTRAS|PPO|PROJP[1-9]|PROJR0|PV[1-3]_[1-3]|PV[1-4]_[1-4]|RA|RADECSYS|SECPIX|SECPIX|SECPIX[1-2]|UT|UTMID|VELOCITY|VSOURCE|WCSAXES|WCSDEP|WCSDIM|WCSNAME|XPIXSIZE|YPIXSIZE|ZSOURCE|LTM|LTV/;
	var ptypeexp = /TAN|SIN|ZEA|STG|ARC/;
	var reprojHandler = function(hdu){
	    that.refreshImage(hdu, topts);
	    JS9.waiting(false);
	};
	// sanity checks
	if( !that.raw.wcs || !wcsim || 
	    !JS9.reproject || !JS9.fits.handleFITSFile ){
	    return;
	}
	// opts is optional
	opts = opts || {};
	// is this a string containing an image name or WCS values?
	if( typeof wcsim === "string" ){
	    im = JS9.getImage(wcsim);
	    if( im ){
		// it was an image name, so change wcsim to the image handle
		wcsim = im;
	    } else {
		JS9.error("unknown WCS for reproject: " + wcsim);
	    }
	}
	// make copy of input header, removing wcs keywords
	oheader = $.extend(true, {}, that.raw.header);
	for(key in oheader){
	    if( oheader.hasOwnProperty(key) ){
		if( wcsexp.test(key) ){
		    delete oheader[key];
		}
	    }
	}
	// get wcs keywords from new header
	if( wcsim.raw && wcsim.raw.header ){
	    nheader = wcsim.raw.header;
	} else if( wcsim.BITPIX && wcsim.NAXIS1 && wcsim.NAXIS2 ){
	    // assume its a WCS header
	    nheader = wcsim;
	} else {
	    JS9.error("invalid wcs object input to reproject()");
	}
	for(key in nheader){
	    if( nheader.hasOwnProperty(key) ){
		if( wcsexp.test(key) ){
		    twcs[key] = nheader[key];
		}
	    }
	}
	// combine old header keywords + new wcs keywords
	wcsheader = $.extend(true, {}, oheader, twcs);
	// sanity check on result
	if( !wcsheader.NAXIS || !wcsheader.NAXIS1 || !wcsheader.NAXIS2 ){
	    JS9.error("invalid FITS image header");
	}
	// keep within the limits of current memory constraints
	if((wcsheader.NAXIS1*wcsheader.NAXIS2) > (JS9.REPROJDIM*JS9.REPROJDIM)){
	    JS9.error("for now, the max image size for reprojection is approximately " + JS9.REPROJDIM  + " * " + JS9.REPROJDIM);
	}
	// convert reprojection header to a string
	wcsstr = JS9.raw2FITS(wcsheader, true);
	// create vfile text file containing reprojection WCS
	wvfile = "wcs_" + JS9.uniqueID() + ".txt";
	JS9.vfile(wvfile, wcsstr);
	// check input and reproj WCS to make sure we can run fast mProjectPP
	// if not, try to make an alternate WCS header amenable to mProjectPP
	try{
	    // try to change input WCS to a sys usable by mProjectPP
	    if( !ptypeexp.test(that.raw.wcsinfo.ptype) ){
		owvfile = "owcs_" + JS9.uniqueID() + ".txt";
		JS9.vfile(owvfile, JS9.raw2FITS(that.raw.header, true));
		awvfile = "awcs_" + JS9.uniqueID() + ".txt";
		rstr = JS9.tanhdr(owvfile, awvfile, "");
		if( JS9.DEBUG > 1 ){
		    JS9.log("tanhdr (input): %s %s -> %s", 
			    owvfile, awvfile, rstr);
		}
		JS9.vunlink(owvfile);
		if( rstr.search(/\[struct stat="OK"/) >= 0 ){
		    // add command switch to use this alternate wcs
		    opts.cmdswitches = opts.cmdswitches || "";
		    opts.cmdswitches += (" -i " + awvfile);
		}
	    }
	    // try to change reproject WCS to a sys usable by mProjectPP
	    if( !ptypeexp.test(wcsim.raw.wcsinfo.ptype) ){
		owvfile = "owcs_" + JS9.uniqueID() + ".txt";
		JS9.vfile(owvfile, JS9.raw2FITS(nheader, true));
		awvfile2 = "awcs_" + JS9.uniqueID() + ".txt";
		rstr = JS9.tanhdr(owvfile, awvfile2, "");
		if( JS9.DEBUG > 1 ){
		    JS9.log("tanhdr (reproj): %s %s -> %s",
			    owvfile, awvfile2, rstr);
		}
		JS9.vunlink(owvfile);
		if( rstr.search(/\[struct stat="OK"/) >= 0 ){
		    // delete old wcs file and use this alternate wcsfile
		    JS9.vunlink(wvfile);
		    wvfile = awvfile2;
		}
	    }
	}
	catch(ignore){}
	// get reference to existing raw data file (or create one)
	if( that.raw.hdu && that.raw.hdu.vfile ){
	    // input file name
	    ivfile = that.raw.hdu.vfile;
	} else {
	    // input file name
	    arr = that.toArray();
	    ivfile = that.id.replace(/\.png$/, "_png" +  ".fits");
	    JS9.vfile(ivfile, arr);
	}
	// output file name
	s = that.id
	    .replace(/\[.*\]/, "")
	    .replace(/\.png$/, ".fits")
	    .replace(/\.gz$/, "");
	ovfile = "reproj_" + JS9.uniqueID() + "_" + s;
	// if input is a table, we have to bin it by adding a bin specification
	// also need to pass the HDU name. For now, "EVENTS" is all we know ...
	if( that.imtab === "table" ){
	    tab = that.raw.hdu.table;
	    tx1 = Math.floor(tab.cx - ((tab.nx+1)/2) + 1);
	    tx2 = Math.floor(tab.cx + (tab.nx/2));
	    ty1 = Math.floor(tab.cy - ((tab.ny+1)/2) + 1);
	    ty2 = Math.floor(tab.cy + (tab.ny/2));
	    s = sprintf("[EVENTS][bin X=%s:%s,Y=%s:%s]", tx1, tx2, ty1, ty2);
	    ivfile += s;
	}
	// call the reproject routine
	var n, avfile, earr, cmdswitches;
	// call the reproject routine, passing full pathnames
	try{
	    // name of (unneeded) area file
	    n = ovfile.lastIndexOf(".");
	    if( n >= 0 ) {
		avfile = ovfile.substring(0, n) + "_area" + ovfile.substring(n);
	    }
	    // optional command line args
	    cmdswitches = opts.cmdswitches || "";
	    // call reproject
	    rstr = JS9.reproject(ivfile, ovfile, wvfile, cmdswitches);
	    if( JS9.DEBUG > 1 ){
		JS9.log("reproject: %s %s %s [%s] -> %s",
			ivfile, ovfile, wvfile, cmdswitches, rstr);
	    }
	    // delete unneeded files ...
	    JS9.vunlink(avfile);
	    JS9.vunlink(wvfile);
	    if( awvfile ){
		JS9.vunlink(awvfile);
	    }
	    // ... then error check
	    if( rstr.search(/\[struct stat="OK"/) < 0 ){
		// signal that we completed the reproject attempt
		rcomplete = true;
		earr = rstr.match(/msg="([^"]*)"/);
		if( earr && earr[1] ){
		    JS9.error(earr[1] + " (from mProjectPP)");
		} else {
		    JS9.error(rstr);
		}
	    }
	}
	catch(e){
	    // avoid double error reporting
	    if( !rcomplete ){
		// delete unneeded files ...
		JS9.vunlink(avfile);
		JS9.vunlink(wvfile);
		// call error handler
		if( rstr ){
		    JS9.error(rstr);
		} else {
		    JS9.error("WCS reproject failed", e);
		}
	    } else {
		return;
	    }
	}
	// refresh image using the reprojected file ...
	topts = $.extend(true, {}, opts || {}, JS9.fits.options);
	// ... in a new raw data layer
	topts.rawid = topts.rawid || "reproject";
	// save pointer to original wcs image
	topts.wcsim = wcsim;
	// process the FITS file
	try{ JS9.fits.handleFITSFile(ovfile, topts, reprojHandler); }
	catch(e){ JS9.error("can't process reprojected FITS file", e); }
    }, JS9.SPINOUT);
    // allow chaining
    return this;
};

// apply image processing filters to the current RGB image
JS9.Image.prototype.filterRGBImage = function(filter){
    var key, filters = [];
    var argv = Array.prototype.slice.call(arguments);
    // no arg: return list of filters
    if( !filter ){
	for( key in JS9.ImageFilters ){
	    if( JS9.ImageFilters.hasOwnProperty(key) ){
		filters.push(key);
	    }
	}
	return filters;
    }
    // sanity checks
    if( filter !== "reset" && !JS9.ImageFilters[filter] ){
	JS9.error("JS9 image filter '" + filter + "' not available");
    }
    // special case: reset to original RGB data, contrast/bias
    if( filter === "reset" ){
	this.setColormap("reset");
	return this;
    }
    // remove filter name argument
    argv.shift();
    // add display context and RGB img argument
    argv.unshift(this.display.context, this.rgb.img);
    // try to run the filter to generate a new RGB image
    try{ JS9.ImageFilters[filter].apply(null, argv); }
    catch(e){ JS9.error("JS9 image filter '" + filter + "' failed", e); }
    // display new RGB image
    this.displayImage("display");
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onfilterrgbimage");
    }
    // allow chaining
    return this;
};

// move image to a different display
// maybe this should be refactored using more useful routines ...
// ... and should (some of) this code be in the Fabric section??
JS9.Image.prototype.moveToDisplay = function(dname){
    var i, im, key, layer, dlayer;
    var odisplay = this.display;
    var ndisplay = JS9.lookupDisplay(dname);
    // sanity check
    if( !dname || !ndisplay ){
	JS9.error("could not find display: " + dname);
	return null;
    }
    // clear old display first
    this.clearMessage();
    this.display.context.clear();
    // make sure the main layers in the old display are in the new display
    for( key in odisplay.layers ){
	if( odisplay.layers.hasOwnProperty(key) ){
	    if( (odisplay.layers[key].dtype === "main") &&
		!ndisplay.layers[key] ){
		ndisplay.newShapeLayer(key, odisplay.layers[key].opts);
	    }
	}
    }
    // re-assign each "main" layer from old display to new by:
    // saving the graphics, reassigning the canvas, restoring the graphics
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    layer = this.layers[key];
	    dlayer = ndisplay.layers[key];
	    if( dlayer && (dlayer.dtype === "main") ){
		if( ndisplay.image ){
		    ndisplay.image.showShapeLayer(key, false);
		}
		this.showShapeLayer(key, false);
                layer.dlayer = dlayer;
                layer.divjq = dlayer.divjq;
                layer.canvasjq = dlayer.canvasjq;
                layer.canvas = dlayer.canvas;
		this.showShapeLayer(key, true);
	    } else {
		delete this.layers[key];
	    }
	}
    }
    // move "main" display from old to new
    this.display = ndisplay;
    // avoid erroneous save of previous layers
    this.display.image = this;
    // reset section to ensure proper display size
    this.mkSection();
    // and redisplay
    this.displayImage("all");
    // ensure proper positions for graphics
    this.refreshLayers();
    // old display has no image
    odisplay.image = null;
    // so display a different image in old display, if possible
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( odisplay === im.display ){
	    // avoid erroneous save of previous layers
	    im.display.image = null;
	    im.displayImage("all");
	    // ensure proper positions for graphics
	    im.refreshLayers();
	    break;
	}
    }
    // allow chaining
    return this;
};

// save session to a json file
// NB: save is an image method, load is a display method
JS9.Image.prototype.saveSession = function(file){
    var obj, str, blob, layer, dlayer, tobj, key;
    file = file || "js9.ses";
    if( !window.hasOwnProperty("saveAs") ){
	JS9.error("no saveAs function available to save session");
    }
    // change the cursor to show the waiting status
    JS9.waiting(true, this.display.divjq[0]);
    // object holding session keys
    obj = {};
    // filename
    obj.file = this.file;
    // image params
    obj.params = $.extend(true, {}, this.params);
    // section info
    obj.params.xcen = this.rgb.sect.xcen;
    obj.params.ycen = this.rgb.sect.ycen;
    obj.params.zoom = this.rgb.sect.zoom;
    // layers
    obj.layers = [];
    for( key in this.layers ){
	// save each main layer so it can be reconstituted
        if( this.layers.hasOwnProperty(key) ){
	    layer = this.layers[key];
	    dlayer = layer.dlayer;
	    // only save layers on main display
	    if( dlayer.dtype === "main" ){
		tobj = {};
		tobj.name = key;
		tobj.json = dlayer.canvas.toJSON(dlayer.el);
		tobj.dopts = $.extend(true, {}, dlayer.opts);
		obj.layers.push(tobj);
	    }
        }
    }
    // display size info
    obj.dwidth = this.display.width;
    obj.dheight = this.display.height;
    // remove old display info
    if( obj.params.display ){
	delete obj.params.display;
    }
    // make a blob from the stringified session object
    str = JSON.stringify(obj, null, 4);
    blob = new Blob([str], {type: "application/json"});
    // save it
    saveAs(blob, file);
    // done waiting
    JS9.waiting(false);
    // return file name
    return file;
};

// execute plugins of various types (using type-specific values)
JS9.Image.prototype.xeqPlugins = function(xtype, xname, xval){
    var pname, pinst, popts, parr, evt;
    // sanity check
    if( !xtype || !xname ){
	return;
    }
    // array of plugin instances
    parr = this.display.pluginInstances;
    // look for plugin callbacks to execute
    for( pname in parr ){
	if( parr.hasOwnProperty(pname) ){
	    pinst = parr[pname];
	    if( pinst.isActive(xname) ){
		popts = pinst.plugin.opts;
		switch(xtype){
		case "image":
		    // used for: onimage[load,close,refresh,display]
		    try{ popts[xname].call(pinst, this); }
		    catch(e){ pinst.errLog(xname, e); }
		    break;
		case "region":
		case "shape":
		    // used for: on[layer]change
		    // xval: pub
		    try{ popts[xname].call(pinst, this, xval); }
		    catch(e){ pinst.errLog(xname, e); }
		    break;
		case "keypress":
		    // used for: onkeypress, onkeydown
		    // xval: evt
		    evt = xval.originalEvent || xval;
		    try{ popts[xname].call(pinst, this, this.ipos, evt); }
		    catch(e){ pinst.errLog(xname, e); }
		    break;
		case "mouse":
		    // used for: onmouse[down,move,over,out]
		    // xval: evt
		    if( !this.clickInRegion || popts[xname+"_inRegion"] ){
			evt = xval.originalEvent || xval;
			try{ popts[xname].call(pinst, this, this.ipos, evt); }
			catch(e){ pinst.errLog(xname, e); }
	    }
		    break;
		}
	    }
	}
    }
    // allow chaining
    return this;
};

// Colormap
JS9.Colormap = function(name, a1, a2, a3){
    this.name = name;
    switch(arguments.length){
    case 2:
	this.type = "lut";
	this.colors = a1;
	break;
    case 4:
	this.type = "sao";
	this.vertices = [a1, a2, a3];
	break;
    default:
	JS9.error("colormap requires a colormap name and 1 or 3 array args");
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
    // from: tksao1.0/colormap/sao.C
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
    // from: tksao1.0/colormap/lut.C
    case "lut":
	var size = this.colors.length;
	// index into the evenly spaced RGB values
	var index = Math.floor(ii*size/count);
	if( index < 0 ){
	    rgb[0] = this.colors[0][0] * umax;
	    rgb[1] = this.colors[0][1] * umax;
	    rgb[2] = this.colors[0][2] * umax;
	} else if( index < size ){
	    rgb[0] = this.colors[index][0] * umax;
	    rgb[1] = this.colors[index][1] * umax;
	    rgb[2] = this.colors[index][2] * umax;
	} else {
	    rgb[0] = this.colors[size-1][0] * umax;
	    rgb[1] = this.colors[size-1][1] * umax;
	    rgb[2] = this.colors[size-1][2] * umax;
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
    var that = this;
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
	.attr("id", this.id+"Image")
	.attr("width", this.width)
	.attr("height", this.height)
	.css("z-index", JS9.ZINDEX);
    // add container to the high-level div
    this.displayConjq = $("<div>")
	.addClass("JS9Container")
	.css("z-index", JS9.ZINDEX)
	.attr("tabindex", "0")
	.append(this.canvasjq)
	.appendTo(this.divjq);
    // add resize capability, if necessary
    if( JS9.globalOpts.resizeHandle && window.hasOwnProperty("ResizeSensor") ){
	this.divjq
	    .css("resize", "both")
	    .css("overflow", "hidden");
	if( JS9.bugs.webkit_resize ){
	    this.owidth = parseInt(this.divjq.css("width"), 10);
	    this.oheight = parseInt(this.divjq.css("height"), 10);
	    this.divjq
		.css("width",  this.width + JS9.RESIZEFUDGE)
		.css("height", this.height + JS9.RESIZEFUDGE);
	}
	this.resizeSensor = new ResizeSensor(this.divjq, function(el){
	    var nwidth = that.divjq.width();
	    var nheight = that.divjq.height();
	    if( JS9.bugs.webkit_resize ){
		nwidth  -= JS9.RESIZEFUDGE;
		nheight -= JS9.RESIZEFUDGE;
	    }
	    that.resizing = 1;
	    that.resize(nwidth, nheight);
	});
    }
    // drawing context
    this.context = this.canvas.getContext("2d");
    // turn off anti-aliasing
    if( !JS9.ANTIALIAS ){
	this.context.imageSmoothingEnabled = false;
	this.context.mozImageSmoothingEnabled = false;
	this.context.webkitImageSmoothingEnabled = false;
	this.context.msImageSmoothingEnabled = false;
    }
    // add the display tooltip
    this.tooltip = $("<div>")
	.attr("id", "tooltip_" + this.id)
	.addClass("JS9Tooltip")
	.appendTo(this.divjq);
    // no image loaded into this canvas
    this.image = null;
    // no plugin instances yet
    this.pluginInstances = {};
    // no layers yet
    this.layers = {};
    // init message layer
    this.initMessages();
    // blend mode is false to start
    this.blendMode = false;
    // display-based mouse/touch actions initially from global
    this.mouseActions = JS9.globalOpts.mouseActions.slice(0);
    this.touchActions = JS9.globalOpts.touchActions.slice(0);
    // display-based scroll-based zoom initially from global
    this.mousetouchZoom = JS9.globalOpts.mousetouchZoom;
    // add event handlers
    this.divjq.on("mouseover", this, function(evt){
	return JS9.mouseOverCB(evt);
    });
    this.divjq.on("mousedown touchstart", this, function(evt){
	return JS9.mouseDownCB(evt);
    });
    this.divjq.on("mousemove touchmove", this, function(evt){
	return JS9.mouseMoveCB(evt);
    });
    this.divjq.on("mouseup touchend", this, function(evt){
	return JS9.mouseUpCB(evt);
    });
    this.divjq.on("mouseout", this, function(evt){
	return JS9.mouseOutCB(evt);
    });
    this.divjq.on("keypress", this, function(evt){
	return JS9.keyPressCB(evt);
    });
    this.divjq.on("keydown", this, function(evt){
	return JS9.keyDownCB(evt);
    });
    this.divjq.on("wheel", this, function(evt){
	return JS9.wheelCB(evt);
    });
    // set up drag and drop, if available
    this.divjq.on("dragenter", this, function(evt){
	return JS9.dragenterCB(this.id, evt);
    });
    this.divjq.on("dragover", this, function(evt){
	return JS9.dragoverCB(this.id, evt);
    });
    this.divjq.on("dragexit", this, function(evt){
	return JS9.dragexitCB(this.id, evt);
    });
    this.divjq.on("drop", this, function(evt){
	return JS9.dragdropCB(this.id, evt, JS9.NewFITSImage);
    });
    // no context menus on the display
    this.divjq.on("contextmenu", this, function(evt){
	return false;
    });
    this.divjq.append('<div style="visibility:hidden; position:relative; top:-50;left:-50"> <input type="file" id="openLocalFile-' + this.id + '" multiple="true" onchange="javascript:for(var i=0; i<this.files.length; i++){JS9.Load(this.files[i], {display:\''+ this.id +'\'});};this.value=null;return false;"> </div>');
    this.divjq.append('<div style="visibility:hidden; position:relative; top:-50;left:-50"> <input type="file" id="refreshLocalFile-' + this.id + '" multiple="true" onchange="javascript:for(var i=0; i<this.files.length; i++){JS9.RefreshImage(this.files[i], {display:\''+ this.id +'\'});};this.value=null;return false;"> </div>');
    this.divjq.append('<div style="visibility:hidden; position:relative; top:-50;left:-50"> <input type="file" id="openLocalRegions-' + this.id + '" multiple="true" onchange="javascript:for(var i=0; i<this.files.length; i++){JS9.LoadRegions(this.files[i], {display:\''+ this.id +'\'}); };this.value=null;return false;"> </div>');
    this.divjq.append('<div style="visibility:hidden; position:relative; top:-50;left:-50"> <input type="file" id="openLocalSession-' + this.id + '" multiple="true" onchange="javascript:for(var i=0; i<this.files.length; i++){JS9.LoadSession(this.files[i], {display:\''+ this.id +'\'});};this.value=null;return false;"> </div>');
    this.divjq.append('<div style="visibility:hidden; position:relative; top:-50;left:-50"> <input type="file" id="openLocalColormap-' + this.id + '" multiple="true" onchange="javascript:for(var i=0; i<this.files.length; i++){JS9.AddColormap(this.files[i], {display:\''+ this.id +'\'});};this.value=null;return false;"> </div>');
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
	    // add display to title
	    title += sprintf(JS9.IDFMT, this.id);
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
	    if( plugin.opts.onplugindisplay ){
		try{
		    plugin.opts.onplugindisplay.call(pinst, this.image);
		}
		catch(e){
		    JS9.log("onplugindisplayCB: %s [%s]\n%s",
			    plugin.name, e.message, JS9.strace(e));
		}
	    }
	} else if( pinst.status === "inactive" ){
	    // window created but hidden: show it
	    if( pinst.winHandle ){
		pinst.winHandle.show();
		pinst.status = "active";
		if( plugin.opts.onplugindisplay ){
		    try{
			plugin.opts.onplugindisplay.call(pinst, this.image);
		    }
		    catch(e){
			JS9.log("onplugindisplayCB: %s [%s]\n%s",
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

//  resize a display
JS9.Display.prototype.resize = function(width, height, opts){
    var i, im, key, layer, nwidth, nheight, nleft, ntop;
    var repos = function(o){
	o.left += nleft;
	o.top  += ntop;
	o.setCoords();
    };
    // sanity checks
    if( !JS9.globalOpts.resize ){
	JS9.error("display resize not enabled");
    }
    // no args => return current size
    if( !width && !height ){
	return {width: this.width, height: this.height};
    }
    // get width and height params
    width = Math.floor(width);
    if( height ){
	height = Math.floor(height);
    } else {
	height = width;
    }
    // sanity checks
    if( (width < 10) || (height < 10) ){
	JS9.error("invalid dimension(s) passed to display resize");
    }
    // nothing to do if we are not changing size
    if( (width === this.width) && (height === this.height) ){
	return this;
    }
    opts = opts || {};
    // get resize parameters relative to current display
    nwidth = width;
    nheight = height;
    nleft = (nwidth - this.width) / 2;
    ntop = (nheight - this.height) / 2;
    // change display parameters
    this.width = nwidth;
    this.height = nheight;
    this.divjq.css("width", nwidth);
    this.divjq.css("height", nheight);
    this.canvasjq.attr("width", nwidth);
    this.canvasjq.attr("height", nheight);
    if( JS9.bugs.webkit_resize ){
	if( !this.resizing ){
	    this.owidth = Math.min(this.owidth, nwidth);
	    this.oheight = Math.min(this.oheight, nheight);
	}
    }
    // change the menubar width, if specified not to
    if( opts.resizeMenubar === undefined || opts.resizeMenubar ){
	$("#" + this.id + "Menubar").css("width", nwidth);
    }
    // change size of shape canvases
    for(key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    layer = this.layers[key];
	    if( layer.dtype === "main" ){
		layer.divjq.css("width", nwidth);
		layer.divjq.css("height", nheight);
		layer.canvasjq.attr("width", nwidth);
		layer.canvasjq.attr("height", nheight);
		layer.canvas.setWidth(nwidth);
		layer.canvas.setHeight(nheight);
		layer.canvas.calcOffset();
	    }
	}
    }
    // change position of shapes on currently displayed layers
    // save resize parameters for undisplayed layers
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	im.mkSection();
	if( im.display && (this === im.display) ){
	    // save or update resize object
	    if( im.resize ){
		im.resize.left += nleft;
		im.resize.top  += ntop;
	    } else {
		im.resize = {left: nleft, top: ntop};
	    }
	    // current image: change object positions in displayed layers
	    if( im === im.display.image ){
		for( key in im.layers ){
		    if( im.layers.hasOwnProperty(key) ){
			layer = im.layers[key];
			if( !layer.json ){
			    layer.canvas.getObjects().forEach(repos);
			    layer.canvas.renderAll();
			}
		    }
		}
	    }
	}
    }
    if( JS9.bugs.webkit_resize ){
	this.divjq
	    .css("width",  this.width  + JS9.RESIZEFUDGE)
	    .css("height", this.height + JS9.RESIZEFUDGE);
    }
    // for current image being displayed ...
    if( this.image ){
	// redisplay
	this.image.displayImage("all", opts);
	this.image.refreshLayers();
    }
    return this;
};

// are we in the resize handle area of this display?
JS9.Display.prototype.inResize = function(pos){
    if( JS9.globalOpts.resizeHandle ){
	if( (pos.x + JS9.RESIZEDIST >= this.divjq.width())  &&
	    (pos.y + JS9.RESIZEDIST >= this.divjq.height()) ){
	    return true;
	}
    }
    return false;
};

// load session from a json file
// NB: save is an image method, load is a display method
JS9.Display.prototype.loadSession = function(file){
    var that = this;
    var obj;
    var addLayers = function(im){
	var i, dlayer, layer;
	var dorender = function(){
	    // change shape positions if the displays sizes differ
	    im.refreshLayers();
	};
	// reconstitute each layer
	if( obj.layers && obj.layers.length ){
	    for(i=0; i<obj.layers.length; i++){
		layer = obj.layers[i];
		// make sure layer exists in the display
		dlayer = that.newShapeLayer(layer.name, layer.dopts);
		// add a layer instance to this image (no objects yet)
		im.addShapes(layer.name, []);
		// load the session objects into the layer and render
		dlayer.canvas.loadFromJSON(layer.json, dorender);
	    }
	}
    };
    var loadit = function(jobj){
	// sanity check
	if( !jobj.file ){
	    JS9.error("session does not contain a filename");
	}
	// save object so addLayers can find it
	obj = jobj;
	// include an onload callback to load the layers
	obj.params.onload = addLayers;
	// delete old display info
	if( obj.params.display ){
	    delete obj.params.display;
	}
	// load the image
	JS9.Load(obj.file, obj.params, {display: that.id});
    };
    // change the cursor to show the waiting status
    JS9.waiting(true, this.divjq[0]);
    if( typeof file === "object" ){
	loadit(file);
    } else {
	$.ajax({
	    url: file,
	    cache: false,
	    dataType: "json",
	    mimeType: "application/json",
	    async: false,
	    success: function(jobj, textStatus, jqXHR){
		loadit(jobj);
	    },
	    error:  function(jqXHR, textStatus, errorThrown){
		JS9.error("could not load session: " + file, errorThrown);
	    }
	});
    }
    // allow chaining
    return this;
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
    var el;
    var prompt = "js9>";
    // make previous command input read-only
    this.consoleConjq.find(".JS9CmdIn:last").attr("readonly", "readonly");
    // add new input element
    this.consoleConjq.append(JS9.consoleHTML.replace(/@@PR@@/g,prompt));
    // focus on it
    // and prevent Apple ipads from autocapitalizing, etc.
    el = this.consoleConjq.find(".JS9CmdIn:last");
    el.focus()
      .attr("autocapitalize", "off")
      .attr("autocorrect", "off")
      .attr("autocomplete", "off");
    JS9.jupyterFocus(el.parent());
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
    // height params for text color assignment
    tobj.infoheight = tobj.infoArea.height() + 4;
    tobj.regheight = Math.max(tobj.infoheight * 2 + 10,
			      tobj.infoheight + tobj.regionsArea.height() + 10);
    // display-based message
    switch(type){
    case "regions":
	area = tobj.regionsArea;
	if( !this.display.image ||
	    (this.display.image.iy > tobj.regheight) ){
	    color = JS9.textColorOpts.inimage;
	} else {
	    color = JS9.textColorOpts.regions;
	}
	split = ";";
	break;
    case "info":
	area = tobj.infoArea;
	if( !this.display.image ||
	    (this.display.image.iy > tobj.infoheight) ){
	    color = JS9.textColorOpts.inimage;
	} else {
	    color = JS9.textColorOpts.info;
	}
	split = "";
	break;
    default:
	area = tobj.infoArea;
	if( !this.display.image ||
	    (this.display.image.iy > tobj.infoheight) ){
	    color = JS9.textColorOpts.inimage;
	} else {
	    color = JS9.textColorOpts.info;
	}
	break;
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
	JS9.menubarHTML = "<span id='JS9Menus_@@ID@@'>";
	for(ii=0; ii<JS9.menuButtonOptsArr.length; ii++){
	    ss = JS9.menuButtonOptsArr[ii].name;
	    tt = JS9.menuButtonOptsArr[ii].label;
	    // no help available for all-in-one configuration
	    if( JS9.allinone && (ss === "help") ){
		continue;
	    }
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
		tdisp.image.displayImage("rgb");
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
		var i, im, name, imlen, s1;
		var n = 0;
		var items = {};
		var tdisp = getDisplays()[0];
		var tim = tdisp.image;
		imlen = JS9.images.length;
		for(i=0; i<imlen; i++){
		    im = JS9.images[i];
		    if( im.display === tdisp ){
			name = im.id;
			if( JS9.globalOpts.rgb.active ){
			    if( im === JS9.globalOpts.rgb.rim){
				name += " (red)";
			    }
			    if( im === JS9.globalOpts.rgb.gim){
				name += " (green)";
			    }
			    if( im === JS9.globalOpts.rgb.bim){
				name += " (blue)";
			    }
			}
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
		items.open = {name: "open local file ..."};
		items.archives = {name: " accessing data archives ..."};
		if( !JS9.allinone ){
		    items.archives.disabled = false;
		} else {
		    items.archives.disabled = true;
		}
		items.loadproxy = {name: "open link via proxy ..."};
		if( !JS9.allinone			 &&
		    JS9.globalOpts.helperType !== "none" &&
		    JS9.globalOpts.workDir      	 &&
		    JS9.globalOpts.loadProxy    	 ){
		    items.loadproxy.disabled = false;
		} else {
		    items.loadproxy.disabled = true;
		}
		items.loadcors = {name: "open link via CORS ..."};
		if( !window.hasOwnProperty("Jupyter") ){
		    items.loadcors.disabled = false;
		} else {
		    items.loadcors.disabled = true;
		}
		// only show imsection if the fits file differs from the
		// displayed file (i.e. its a representation file)
		items.imsection = {name: "extract image section ..."};
		if( !JS9.allinone 			 &&
		    JS9.globalOpts.helperType !== "none" &&
		    JS9.globalOpts.workDir      	 &&
		    tim && tim.parentFile 		 ){
		    items.imsection.disabled = false;
		} else {
		    items.imsection.disabled = true;
		}
		items["sep" + n++] = "------";
		items.print = {name: "print ..."};
		items.header = {name: "display FITS header"};
		items.hdus = {name: "display FITS HDUs"};
		if( !tim || !tim.hdus ){
		    items.hdus.disabled = true;
		}
		items.savefits = {name: "save image as FITS"};
		items.savepng = {name: "save image as PNG"};
		items.savejpeg = {name: "save image as JPEG"};
		items.moveto = {
		    name: "move image to",
		    items: {movetotitle: {name: "choose display:",
					  disabled: true}}
		};
		if( tim ){
		    items.moveto.disabled = false;
		    for(i=0; i<JS9.displays.length; i++){
			if( $("#"+JS9.displays[i].id).length > 0 &&
			    tdisp !== JS9.displays[i]    	     ){
			    s1 = "moveto_" + JS9.displays[i].id;
			    items.moveto.items[s1] = {name: JS9.displays[i].id};
			}
		    }
		    items.moveto.items.moveto_newdisp = { name: "new display" };
		} else {
		    items.moveto.disabled = true;
		}
		items.close = {name: "close image"};
		items["sep" + n++] = "------";
		items.loadsession = {name: "load session ..."};
		items.savesession = {name: "save session"};
		items["sep" + n++] = "------";
		items.lite = {name: "new JS9 light window"};
		items.xnew = {name: "new JS9 separate window"};
		items["sep" + n++] = "------";
		items.pageid = {name: "display page id"};
		if( JS9.DEBUG > 2 ){
		  items["sep" + n++] = "------";
		  items.refresh = {name: "debug: refresh ..."};
		}
		return {
                    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var j, s, t, did, save_orc, kid, unew, uwin;
			var udisp = val;
			var uim = udisp.image;
			switch(key){
			case "close":
			    if( uim ){
				uim.closeImage();
			    }
			    break;
			case "savesession":
			    if( uim ){
				uim.saveSession(uim.id + ".ses");
			    }
			    break;
			case "loadsession":
			    if( udisp ){
				JS9.OpenSessionMenu({display: udisp});
			    }
			    break;
			case "header":
			    if( uim ){
				if( uim.raw.header ){
				    uim.displayAnalysis("text",
						   JS9.raw2FITS(uim.raw, true),
						   "FITS Header: "+uim.id);
				} else {
				    JS9.error("no FITS header for " + uim.id);
				}
			    }
			    break;
			case "hdus":
			    if( uim ){
				if( uim.hdus ){
				    uim.displayAnalysis("text",
						   JS9.hdus2Str(uim.hdus),
						   "FITS HDUs: "+uim.id,
				    "width=800px,height=200px,center=1,resize=1,scrolling=1");
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
			    s = sprintf("<center><p>pageid: %s</center>", JS9.helper.pageid || "none");
			    t = "JS9 page id";
			    // add display to title
			    t += sprintf(JS9.IDFMT, udisp.id);
			    JS9.lightWin("fileid" + JS9.uniqueID(),
					 "inline", s, t,
					 JS9.lightOpts[JS9.LIGHTWIN].lineWin);
			    break;
			case "open":
			    JS9.OpenFileMenu({display: udisp});
			    break;
			case "loadcors":
			    if( JS9.allinone ){
				did = JS9.Image.prototype.displayAnalysis.call(
				      null,
				      "textline",
				      JS9.allinone.loadCorsHTML,
				      "Open a shared CORS link");
			    } else {
				did = JS9.Image.prototype.displayAnalysis.call(
				      null,
				      "textline",
				      JS9.InstallDir(JS9.globalOpts.corsURL),
				      "Open a shared CORS link");
			    }
			    // save display id
			    $(did).data("dispid", udisp.id);
			    break;
			case "archives":
			    JS9.DisplayHelp(JS9.InstallDir(JS9.globalOpts.archivesURL));
			    break;
			case "loadproxy":
			    // load param url to run analysis task
			    // param url is relative to js9 install dir
			    did = JS9.Image.prototype.displayAnalysis.call(null,
				     "textline",
				     JS9.InstallDir(JS9.globalOpts.proxyURL),
				     "Open a link via server proxy");
			    // save info for running the task
			    $(did).data("dispid", udisp.id)
				  .data("aname", "loadproxy");
			    break;
			case "imsection":
			    // load param url to run analysis task
			    // param url is relative to js9 install dir
			    save_orc = JS9.Regions.opts.onchange;
			    $("#dhtmlwindowholder").arrive("#imageSectionForm",
                            {onceOnly: true}, function(){
				 var f = "#imageSectionForm";
				 JS9.Regions.opts.onchange = function(im, xreg){
				    var w, h, ltm1, ltm2;
				    // call previous
				    if( save_orc ){ save_orc(im, xreg); }
				    // verify this image can be imsection'ed
				    if( !im.parentFile ){ return; }
				    // are we using a region for pos/size?
				    if( $(f+" input:radio[name=imode]:checked")
					  .val() !== "region" ){ return; }
				    // do we have a box region?
				    if( xreg.shape !== "box" ){	return; }
				    // set current size and position
				    ltm1 = im.raw.header.LTM1_1 || 1.0;
				    w = xreg.width / ltm1;
				    ltm2 = im.raw.header.LTM2_2 || 1.0;
				    h = xreg.height / ltm2;
				    $(f+" #xcen").val(Math.floor(xreg.lcs.x));
				    $(f+" #ycen").val(Math.floor(xreg.lcs.y));
				    $(f+" #xdim").val(Math.floor(w));
				    $(f+" #ydim").val(Math.floor(h));
				};
			    });
			    $("#dhtmlwindowholder").leave("#imageSectionForm",
			    {onceOnly: true}, function(){
				JS9.Regions.opts.onchange = save_orc;
			    });
			    did = JS9.Image.prototype.displayAnalysis.call(null,
				"params",
				JS9.InstallDir(JS9.globalOpts.imsectionURL),
				"Extract Image Section From a 'Parent' File",
	                        "width=440px,height=230px,center=1,resize=1,scrolling=1");
			    // save info for running the task
			    $(did).data("dispid", udisp.id)
				  .data("aname", "imsection");
			    break;
			case "refresh":
			    $('#refreshLocalFile-' + udisp.id).click();
			    break;
			case "savefits":
			    if( uim ){
				s = uim.id.replace(/\.png/i, ".fits")
				          .replace(/\.gz$/i, "")
				          .replace(/\[.*\]/,"");
				uim.saveFITS(s);
			    }
			    break;
			case "savepng":
			    if( uim ){
				s = uim.id.replace(/\.fit[s]?/i, ".png")
				          .replace(/\.gz$/i, "")
				          .replace(/\[.*\]/,"");
				uim.savePNG(s);
			    }
			    break;
			case "savejpeg":
			    if( uim ){
				s = uim.id.replace(/\.fit[s]?/i, ".jpeg")
				          .replace(/\.png$/i, ".jpeg")
				          .replace(/\.gz$/i, "")
				          .replace(/\[.*\]/,"");
				uim.saveJPEG(s);
			    }
			    break;
			case "print":
			    if( uim ){
				uim.print();
			    }
			    break;
			default:
			    // maybe it's a moveto request
			    if( key.match(/^moveto_/) ){
				unew = key.replace(/^moveto_/,"");
				if( unew === "newdisp" ){
				    uwin = "lightwin" + JS9.uniqueID();
			            $("#dhtmlwindowholder").arrive("#" + uwin,
                                    {onceOnly: true}, function(){
					uim.moveToDisplay(uwin);
				    });
				    JS9.LoadWindow(null, {id: uwin}, "light");
				} else {
				    uim.moveToDisplay(unew);
				}
				return;
			    }
			    for(j=0; j<JS9.images.length; j++){
				uim = JS9.images[j];
				kid = key.replace(/ *\((red|green|blue)\)/,"");
				if( (udisp.id === uim.display.id) &&
				    (uim.id === kid) ){
				    // display image, 2D graphics, etc.
				    uim.displayImage("all");
				    uim.refreshLayers();
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
		var editResize = function(disp, obj){
		    var v1, v2;
		    if( obj.resize ){
			var arr = obj.resize.split(/[\s,\/]+/);
			switch(arr.length){
			case 0:
			    break;
			case 1:
			    if( JS9.isNumber(arr[0]) ){
				v1 = parseInt(arr[0], 10);
				disp.resize(v1, v1);
			    }
			    break;
			default:
			    if( JS9.isNumber(arr[0]) && JS9.isNumber(arr[1]) ){
				v1 = parseInt(arr[0], 10);
				v2 = parseInt(arr[1], 10);
				disp.resize(v1, v2);
			    }
			    break;
			}
		    }
		};
		var keyResize = function(e){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = that.display;
		    switch( keycode ){
		    case 9:
		    case 13:
			editResize(vdisp, obj);
			e.data.edited = false;
			break;
		    default:
			e.data.edited = true;
			break;
		    }
		};
		// plugins
		items["sep" + n++] = "------";
		items["sep" + n++] = {name: "Plugins:"};
		items["sep" + (n-1)].disabled = true;
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
		if( tim && tim.raws.length > 1 ){
		    items["sep" + n++] = "------";
		    items.rawlayer = {
			name: "raw data layers",
			items: {}
		    };
		    for(i=0; i<tim.raws.length; i++){
			key = "rawlayer_" + tim.raws[i].id;
			items.rawlayer.items[key] = {
			    name: tim.raws[i].id
			};
			if( tim.raw === tim.raws[i] ){
			    items.rawlayer.items[key].icon = "sun";
			}
		    }
		    items.rawlayer.items["sep" + n++] = "------";
		    items.rawlayer.items.rawlayer_remove = {name: "remove"};
		}
		if( JS9.globalOpts.resize ){
		    items["sep" + n++] = "------";
		    items.resize = {
			events: {keyup: keyResize},
			name: "change width/height:",
			type: "text"
		    };
		}
		return {
		    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
		        var jj, ucat, umode, uplugin, s;
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
					    if( key === "show" ){
						uim.refreshLayers();
					    }
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
					    if( umode === "show" ){
						uim.refreshLayers();
					    }
					    return;
					}
				    }
				}
			    }
			    // maybe its a raw data layer
			    if( tim && key.match(/^rawlayer_/) ){
				s = key.replace(/^rawlayer_/, "");
				if( s === "remove" ){
				    for(i=0; i<tim.raws.length; i++){
					if( tim.raw === tim.raws[i] ){
					    tim.rawDataLayer(tim.raw.id,
							     "remove");
					}
				    }
				} else {
				    tim.rawDataLayer(s);
				}
			    }
			    break;
			}
		    });
		    },
		    events: {
			show: function(opt){
			    var udisp = that.display;
			    var obj = {};
			    if( udisp  ){
				obj.resize = sprintf("%d %d",
						     udisp.width, udisp.height);
				$.contextMenu.setInputValues(opt, obj);
				JS9.jupyterFocus(".context-menu-item");
			    }
			},
			hide: function(opt){
			    var obj;
			    var udisp = that.display;
			    if( udisp ){
				// if a key was pressed, do the edit
				if( opt.edited ){
				    delete opt.edited;
				    obj = $.contextMenu.getInputValues(opt);
				    editResize(udisp, obj);
				}
			    }
			}
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
			    e.data.edited = false;
			}
			break;
		    default:
			e.data.edited = true;
			break;
		    }
		};
		var items = {};
		items.zoomtitle = {name: "Zoom Factors:", disabled: true};
		for(i=JS9.imageOpts.zooms; i>=1; i--){
		    zoom = Math.pow(2,-i);
		    zoomp = Math.pow(2,i);
		    name = sprintf("zoom%s", zoom);
		    name2 = sprintf("zoom 1/%s", zoomp);
		    items[name] = {name: name2};
		    if( tim && (tim.rgb.sect.zoom === zoom) ){
			items[name].icon = "sun";
		    }
		}
		for(i=0; i<=JS9.imageOpts.zooms; i++){
		    zoom = Math.pow(2,i);
		    name = sprintf("zoom%s", zoom);
		    name2 = sprintf("zoom %s", zoom);
		    items[name] = {name: name2};
		    if( tim && (tim.rgb.sect.zoom === zoom) ){
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
				    String(uim.rgb.sect.zoom);
			    }
			    $.contextMenu.setInputValues(opt, obj);
			    JS9.jupyterFocus(".context-menu-item");
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
		    if( JS9.isNumber(obj.scalemin) ){
			im.params.scalemin = parseFloat(obj.scalemin);
		    }
		    if( JS9.isNumber(obj.scalemax) ){
			im.params.scalemax = parseFloat(obj.scalemax);
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
			e.data.edited = false;
			break;
		    default:
			e.data.edited = true;
			break;
		    }
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
			    JS9.jupyterFocus(".context-menu-item");
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
		var i, s1, s2, arr;
		var n = 0;
		var items = {};
		var tdisp = getDisplays()[0];
		var editColor = function(im, obj){
		    if( obj.contrast && !isNaN(obj.contrast) ){
			im.params.contrast = parseFloat(obj.contrast);
		    }
		    if( obj.bias && !isNaN(obj.bias) ){
			im.params.bias = parseFloat(obj.bias);
		    }
		    if( !isNaN(obj.opacity) ){
			if( obj.opacity !== "" ){
			    im.params.opacity = parseFloat(obj.opacity);
			} else {
			    im.params.opacity = 1.0;
			}
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
			e.data.edited = false;
			break;
		    default:
			e.data.edited = true;
			break;
		    }
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
		items.imfilter = {
		    name: "image filters",
		    items: {}
		};
		arr = JS9.Image.prototype.filterRGBImage.call(null).sort();
		for(i=0; i<arr.length; i++){
		    if( arr[i] === "convolve" ){
			continue;
		    }
		    s1 = "imfilter_" + arr[i];
		    items.imfilter.items[s1] = {
			name: arr[i]
		    };
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
		items.opacity = {
		    events: {keyup: keyColor},
		    name: "opacity value:",
		    type: "text"
		};
		items["sep" + n++] = "------";
		items.reset = {name: "reset contrast/bias"};
		items["sep" + n++] = "------";
		items.loadcmap = {name: "load colormap"};
		items.savecmap = {name: "save colormap"};
		items.invert = {name: "invert colormap"};
		if( tdisp.image && tdisp.image.params.invert ){
		    items.invert.icon = "sun";
		}
		items["sep" + n++] = "------";
		items.rgb = {name: "RGB mode"};
		if( JS9.globalOpts.rgb.active ){
		    items.rgb.icon = "sun";
		}
		return {
		    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var udisp = val;
			var uim = udisp.image;
			if( uim ){
			    switch(key){
			    case "loadcmap":
				JS9.OpenColormapMenu({display: udisp});
				break;
			    case "savecmap":
				JS9.SaveColormap({display: udisp});
				break;
			    default:
				if( key.match(/^imfilter_/) ){
				    s1 = key.replace(/^imfilter_/,"");
				    uim.filterRGBImage(s1);
				    return;
				}
				uim.setColormap(key);
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
				obj.contrast = String(uim.params.contrast);
				obj.bias = String(uim.params.bias);
				obj.opacity = String(uim.params.opacity);
				obj.sigma = String(uim.params.sigma);
			    }
			    $.contextMenu.setInputValues(opt, obj);
			    JS9.jupyterFocus(".context-menu-item");
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
		    "line": {name: "line"},
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
				JS9.OpenRegionsMenu({display: udisp});
				break;
			    case "saveRegions":
				uim.saveRegions("js9.reg", "all");
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
		var n=0, nwcs=0;
		var items = {};
		var tdisp = getDisplays()[0];
		var tim = tdisp.image;
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
		items["sep" + n++] = "------";
		items.reproject = {
		    name: "reproject",
		    items: {reprojtitle: {name: "wcs from:", disabled: true}}
		};
		for(i=0; i<JS9.images.length; i++){
		    if( tim !== JS9.images[i]  &&
			JS9.images[i].raw.wcs ){
			s1 = "reproject_" + JS9.images[i].id;
			items.reproject.items[s1] = {
			    name: JS9.images[i].id
			};
			nwcs++;
		    }
		}
		if( nwcs === 0 ){
		    items.reproject.disabled = true;
		    items.reproject.items.notasks = {
			name: "[none]",
			disabled: true,
			events: {keyup: function(evt){return;}}
		    };
		} else {
		    items.reproject.disabled = false;
		    items.reproject.items["sep" + n++] = "------";
		    items.reproject.items.reproject_wcsalign = {
			name: "display wcs-aligned"
		    };
		    if( tdisp.image && (tdisp.image.params.wcsalign) ){
			items.reproject.items.reproject_wcsalign.icon = "sun";
		    }
		}
		return {
                    callback: function(key, opt){
		    getDisplays().forEach(function(val, idx, array){
			var file;
			var rexp = new RegExp(key);
			var udisp = val;
			var uim = udisp.image;
			if( uim ){
			    // maybe it's a wcs reprojection request
			    if( key.match(/^reproject_/) ){
				if( key === "reproject_wcsalign" ){
				    uim.params.wcsalign = !uim.params.wcsalign;
				    uim.displayImage("display");
				}  else {
				    file = key.replace(/^reproject_/,"");
				    uim.reprojectData(file);
				}
				return;
			    }
			    // otherwise it's a wcs directive
			    if( JS9.wcssyss.join("@").search(rexp) >=0 ){
				uim.setWCSSys(key);
			    } else if( JS9.wcsunitss.join("@").search(rexp)>=0){
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
		var editAnalysis = function(im, obj){
		    if( !obj.sigma ){
			obj.sigma = "none";
		    }
		    if( obj.sigma === "none" ){
			im.params.sigma = obj.sigma;
			im.rawDataLayer("gaussBlur", "remove");
		    } else {
			im.params.sigma = parseFloat(obj.sigma);
			im.gaussBlurData(im.params.sigma);
		    }
		};
		var keyAnalysis = function(e){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = that.display;
		    var vim = vdisp.image;
		    switch( keycode ){
		    case 9:
		    case 13:
			editAnalysis(vim, obj);
			e.data.edited = false;
			break;
		    default:
			e.data.edited = true;
			break;
		    }
		};
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
		// no server side analysis for CDN all-in-one configuration
		if( !JS9.allinone ){
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
		items.sigma = {
		    events: {keyup: keyAnalysis},
		    name: "Gaussian blur sigma:",
		    type: "text"
		};
		items.dpath = {name: "set data path ..."};
		}
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
			        $("#dhtmlwindowholder").arrive("#dataPathForm",
                                {onceOnly: true}, function(){
				    $('#dataPath').val(JS9.globalOpts.dataPath);
				});
				did = uim.displayAnalysis("textline",
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
				return;
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
				obj.sigma = String(uim.params.sigma);
			    }
			    $.contextMenu.setInputValues(opt, obj);
			    JS9.jupyterFocus(".context-menu-item");
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
				    editAnalysis(uim, obj);
				}
			    }
			}
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
	    timeout: JS9.globalOpts.htimeout,
	    success:  function(data, textStatus, jqXHR){
		var ii, d;
		var sockopts = {
		    reconnection: true,
		    reconnectionDelay: 10000,
		    reconnectionDelayMax : 10000,
		    reconnectionAttempts: 6,
		    timeout: JS9.globalOpts.htimeout
		};
		// connect to the helper
		that.socket = io.connect(that.url, sockopts);
		// on-event processing
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
		that.socket.on("connect_error", function(){
		    that.connected = false;
		    that.helper = false;
		    JS9.Preload(true);
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: connect error");
		    }
		});
		that.socket.on("connect_timeout", function(){
		    that.connected = false;
		    that.helper = false;
		    JS9.Preload(true);
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: connect timeout");
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
		that.socket.on("msg", JS9.msgHandler);
	    },
	    error:  function(jqXHR, textStatus, errorThrown){
		that.connected = false;
		that.helper = false;
		JS9.Preload(true);
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
        if( JS9.DEBUG ){
	    JS9.log("JS9 cgi helper [%s, %s]: %s",
		    this.type, JSON.stringify(obj), this.url);
        }
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
    selectionLineWidth: 2,
    borderColor: "#00FF00",
    cornerColor: "#00FF00",
    cornerSize: fabric.isTouchSupported ? 12 : 8,
    hasControls: true,
    hasRotatingPoint: true,
    hasBorders: true,
    transparentCorners: false,
    centeredScaling: true,
    selectable: true,
    // minimizes the jump when first changing the region size
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
    if( !sw1 ){
	return;
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
    if( dlayer.opts.canvas.selection === undefined ){
	dlayer.opts.canvas.selection = true;
    }
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
    if( JS9.bugs.webkit_resize && dlayer.dtype === "main" ){
	dlayer.canvasjq
	    .attr("width",  display.width)
	    .attr("height", display.height);
    }
    // new fabric canvas associated with this HTML canvas
    dlayer.canvas = new fabric.Canvas(dlayer.canvasjq[0]);
    // don't render on add or remove of objects (do it manually)
    dlayer.canvas.renderOnAddRemove = false;
    // short-hand for allowing objects to move
    if( dlayer.opts.movable ){
	dlayer.opts.hasControls = true;
	dlayer.opts.hasRotatingPoint = true;
	dlayer.opts.hasBorders = true;
	dlayer.opts.lockMovementX = false;
	dlayer.opts.lockMovementY = false;
	dlayer.opts.lockRotation = false;
	dlayer.opts.lockScalingX = false;
	dlayer.opts.lockScalingY = false;
	dlayer.opts.lockUniScaling = false;
	dlayer.opts.selectable = true;
	dlayer.opts.evented = true;
	dlayer.opts.usekeyboard = true;
    }
    // short-hand for allowing group and individual selections
    if( dlayer.opts.selectable ){
	dlayer.opts.canvas.selection = true;
    }
    // are mouse callbacks defined in the opts object?
    if( dlayer.opts.onmousedown || dlayer.opts.onmouseup  ||
	dlayer.opts.onmousemove || dlayer.opts.tooltip    ||
	dlayer.opts.onmouseover || dlayer.opts.onmouseout ){
	dlayer.opts.evented = true;
	if( dlayer.opts.onmousedown ){
	    dlayer.canvas.on("mouse:down", function(opts){
		if( dlayer.display.image && opts.target ){
		    // on main window, set region click
		    if( dlayer.dtype === "main" ){
			dlayer.display.image.clickInRegion = true;
		    }
		    dlayer.opts.onmousedown.call(this,
						 dlayer.display.image,
						 opts.target.pub,
						 opts.e, opts.target);
		} else {
		    // only allow fabric selection if we have special key down
		    this._selection = this.selection;
		    if( this.selection ){
			this.selection = JS9.specialKey(opts.e);
		    }
		}
	    });
	} else {
	    dlayer.canvas.on("mouse:down", function(opts){
		// only allow fabric selection if we have special key down
		this._selection = this.selection;
		if( this.selection ){
		    this.selection = JS9.specialKey(opts.e);
		}
	    });
	}
	if( dlayer.opts.onmouseup ){
	    dlayer.canvas.on("mouse:up", function(opts){
		if( dlayer.display.image && opts.target ){
		    dlayer.opts.onmouseup.call(this,
					       dlayer.display.image,
					       opts.target.pub,
					       opts.e, opts.target);
		}
		// restore original selection state
		this.selection = this._selection || this.selection;
	    });
	} else {
	    dlayer.canvas.on("mouse:up", function(opts){
		// restore original selection state
		this.selection = this._selection || this.selection;
	    });
	}
	if( dlayer.opts.onmousemove ){
	    dlayer.canvas.on("mouse:move", function(opts){
		if( dlayer.display.image && opts.target ){
		    dlayer.opts.onmousemove.call(this,
						 dlayer.display.image,
						 opts.target.pub,
						 opts.e, opts.target);
		}
	    });
	}
	if( dlayer.opts.onmouseover ){
	    dlayer.canvas.on("mouse:over", function(opts){
		if( dlayer.display.image && opts.target ){
		    dlayer.opts.onmouseover.call(this,
						 dlayer.display.image,
						 opts.target.pub,
						 opts.e, opts.target);
		}
	    });
	}
	if( dlayer.opts.onmouseout ){
	    dlayer.canvas.on("mouse:out", function(opts){
		if( dlayer.display.image && opts.target ){
		    dlayer.opts.onmouseout.call(this,
						dlayer.display.image,
						opts.target.pub,
						opts.e, opts.target);
		}
	    });
	}
	if( dlayer.opts.tooltip ){
	    dlayer.canvas.on("mouse:over", function(opts){
		if( dlayer.display.image && opts.target ){
		    JS9.tooltip(opts.target.left, opts.target.top,
				dlayer.opts.tooltip,
				dlayer.display.image,
				opts.target.pub,
				opts.e, opts.target);
		}
	    });
	    dlayer.canvas.on("mouse:out", function(opts){
		if( dlayer.display.image && opts.target ){
		    JS9.tooltip(opts.target.left, opts.target.top,
				null,
				dlayer.display.image,
				opts.target.pub,
				opts.e, opts.target);
		}
	    });
	}
    } else {
	dlayer.canvas.on("mouse:down", function(opts){
	    // only allow fabric selection if we have special key down
	    this._selection = this.selection;
	    if( this.selection ){
		this.selection = JS9.specialKey(opts.e);
	    }
	});
	dlayer.canvas.on("mouse:up", function(opts){
	    // restore original selection state
	    this.selection = this._selection || this.selection;
	});
    }
    // fire events when groups are created
    if( dlayer.opts.ongroupcreate ){
	dlayer.opts.canvas.selection = true;
	dlayer.opts.selectable = true;
	if( dlayer.opts.ongroupcreate ){
	    dlayer.canvas.on("selection:created", function(opts){
		var pubs = [];
		var targets = [];
		if( dlayer.display.image ){
		    if( opts.target.type === "group" ){
			opts.target.forEachObject(function(shape){
			    if( shape.pub ){
				targets.push(shape);
				pubs.push(shape.pub);
			    }
			});
			dlayer.opts.ongroupcreate.call(this,
						    dlayer.display.image,
						    pubs,
						    opts.e, targets);
		    }
		}
	    });
	}
    }
    // object scaled: reset stroke width
    dlayer.canvas.on('object:scaling', function (opts){
	opts.target.rescaleEvenly();
	opts.target.rescaleBorder();
    });
    // object selected: add anchors to polygon
    dlayer.canvas.on('object:selected', function (opts){
	// fire the selection cleared event, if necesssary
	if( dlayer.params.sel && opts.target.params &&
	    (dlayer.params.sel !== opts.target) ){
	    dlayer.canvas.fire('before:selection:cleared',
			       {target: dlayer.params.sel});
	}
	// selection processing
	switch(opts.target.type){
	case "polyline":
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
	case "polyline":
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
    var left = 0;
    var jobj, xkey, layer, dlayer, canvas;
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
		// translate these shapes if we resized while hidden
		if( that.resize ){
		    canvas.getObjects().forEach(function(o) {
			o.left += that.resize.left;
			o.top  += that.resize.top;
			o.setCoords();
		    });
		    canvas.calcOffset();
		}
		// redisplay this layer
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
	    });
	}
	// remove resize object if we have no more hidden layers
	for( xkey in this.layers ){
	    if( this.layers.hasOwnProperty(xkey) && this.layers[xkey].json ){
		left++;
	    }
	}
	if( !left ){
	    this.resize = null;
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
	    jobj = canvas.toJSON(layer.dlayer.el);
	    layer.json = JSON.stringify(jobj);
	    canvas.selection = false;
	    // push to bottom of the pile
	    if( dlayer ){
		dlayer.divjq.css("z-index", 0);
	    }
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
	zoom = this.rgb.sect.zoom;
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
	return {remove: opts.remove};
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
	opts.lockUniScaling = true;
	opts.hasControls = false;
	opts.hasRotatingPoint = false;
	opts.hasBorders = true;
	break;
    case "line":
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
		// get center point of polygon bounding box
		cpos = JS9.centerPolygon(opts.pts);
		// this is the center of the shape
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
	} else if( opts.shape === "polygon" && opts. polypoints ){
	    opts.points = opts.polypoints;
	} else if( opts.shape === "line" && opts. linepoints ){
	    opts.points = opts.linepoints;
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
	zoom = this.rgb.sect.zoom;
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
	// remove means remove specified shapes or all shapes
	if( sobj.remove ){
	    if( sobj.remove === true || sobj.remove === "true" ){
		sobj.remove = "all";
	    }
	    if( sobj.remove !== false && sobj.remove !== "false" ){
		this.removeShapes(layerName, sobj.remove);
		continue;
	    }
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
	case "line":
	    // save shape
	    params.shape = "line";
	    s = new fabric.Polyline(opts.points, opts);
	    break;
	case "polygon":
	    // save shape
	    params.shape = "polygon";
	    // final ("true") arg is for fabric.js v1.4.11 (skipOffset)
	    s = new fabric.Polygon(opts.points, opts, true);
	    break;
	case "text":
	    // save shape
	    params.shape = "text";
	    params.text = opts.text || "Double-click to add text here";
	    // FF svg to pdf is broken, so use fill instead of stroke
	    // https://github.com/kangax/fabric.js/issues/2675
	    opts.fill = opts.stroke;
	    opts.strokeWidth = 0;
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
    var i, xname, s, scalex, scaley, px, py, lcs;
    var bin, zoom, tstr, dpos, gpos, ipos, npos, objs, olen, radius;
    var opos, dist;
    var pub ={};
    var layer = this.layers[layerName];
    var tr  = function(x){return x.toFixed(1);};
    var tr4 = function(x){return x.toFixed(4);};
    ginfo = ginfo || {};
    opts = opts || {};
    mode = mode || "update";
    // is image zoom part of scale?
    if( this.display.layers[layerName].dtype === "main" ){
	zoom = this.rgb.sect.zoom;
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
    case "line":
    case "polygon":
	pub.imstr = pub.shape + "(";
	tstr = pub.shape + " ";
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
	    if( pub.shape === "line" ){
		if( i === 0 ){
		    dist = 0;
		} else {
		    opos = pub.pts[i-1];
		    dist += Math.sqrt(((npos.x - opos.x) * (npos.x - opos.x)) +
				      ((npos.y - opos.y) * (npos.y - opos.y)));
		}
	    }
	}
        if( pub.shape === "line" ){
	    pub.imstr += ') {"size":' + tr(dist) + ',"units":"pixels"}';
	} else {
	    pub.imstr += ")";
	}
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
    if( this.raw.wcs && (this.raw.wcs > 0) ){
	if( ((layerName === "regions") && (opts.dowcsstr !== false)) ||
	    ((layerName !== "regions") && (opts.dowcsstr === true))  ){
	    pub.wcsstr = JS9.reg2wcs(this.raw.wcs, tstr).replace(/;$/, "");
	}
	s = JS9.pix2wcs(this.raw.wcs, ipos.x, ipos.y).trim().split(/\s+/);
	pub.ra = s[0];
	pub.dec = s[1];
	pub.wcssys = s[2];
    }
    // generic "data" property, optionally supplied when the shape is created
    pub.data = obj.params.data;
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
    // plugin callbacks
    this.xeqPlugins("shape", xname, pub);
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
	zoom = this.rgb.sect.zoom;
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
	// remove means remove specified shapes or all shapes
	if( sobj.remove ){
	    if( sobj.remove === true || sobj.remove === "true" ){
		sobj.remove = "all";
	    }
	    if( sobj.remove !== false && sobj.remove !== "false" ){
		this.removeShapes(layerName, sobj.remove || "all");
		return;
	    }
	}
	// shape-specific pre-processing
	switch(obj.params.shape){
	case "text":
	    // can't use stroke, use fill instead
	    if( sobj.opts.stroke ){
		sobj.opts.fill = sobj.opts.stroke;
	    }
	    sobj.opts.strokeWidth = 0;
	    break;
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
	case "line":
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

// update shape layer after a change in panning, zooming, binning
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
	zoom = this.rgb.sect.zoom;
	// scale factor removes the old values and applies the new ones
	scaleX = (this.binning.obin / this.rgb.sect.ozoom) * zoom / bin;
	scaleY = (this.binning.obin / this.rgb.sect.ozoom) * zoom / bin;
    } else {
	bin = 1;
	zoom = this.rgb.sect.zoom;
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
	    case "polyline":
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
	this.rgb.sect.ozoom = this.rgb.sect.zoom;
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
    // make a rectangle at each anchor point
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
    var i, ndx, ndy;
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
    // move points relative to new center
    // required by polygon changes starting in fabric 1.5.x
    if( fabric.version.split(".")[1] >= 5 ){
	ndx = dx / poly.scaleX;
	ndy = dy / poly.scaleY;
	for(i=0; i<poly.points.length; i++){
	    poly.points[i].x -= ndx;
	    poly.points[i].y -= ndy;
	}
    }
    // set new center
    poly.left = tpos.x;
    poly.top = tpos.y;
    // new coordinates
    poly.setCoords();
};

// Print support
// call using image context
JS9.Fabric.print = function(opts){
    var key, win, dataURL, divstr, pinst, xoff, yoff;
    var divtmpl = "<div style='position:absolute; left:%spx; top:%spx'>";
    var winopts = sprintf("width=%s,height=%s,menubar=1,toolbar=1,status=0,scrollbars=1,resizable=1", this.display.canvasjq.attr("width"), this.display.canvasjq.attr("height"));
    // opts is optional
    opts = opts || {};
    // initialize position in new window
    xoff = 0;
    yoff = 0;
    // make a new window
    win = window.open(null, this.id, winopts);
    if( !win ){
	JS9.error("could not create print window (check your pop-up blockers)");
	return;
    }
    // open DOM for writing
    win.document.open();
    win.document.write("<html><body style='padding: 0px; margin: 0px' onload='window.print(); return false'>");
    // output the main image
    dataURL = this.display.canvas.toDataURL("image/png");
    divstr = sprintf(divtmpl, xoff, yoff);
    win.document.write(divstr);
    win.document.write("<img src='");
    win.document.write(dataURL);
    win.document.write("'>");
    win.document.write("</div>");
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    // output (showing) layers attached to the main display
	    if( this.layers[key].dlayer.dtype === "main" &&
		this.layers[key].show ){
		divstr = sprintf(divtmpl, xoff, yoff);
		win.document.write(divstr);
		win.document.write(this.layers[key].dlayer.canvas.toSVG());
		win.document.write("</div>");
	    }
	}
    }
    // output colorbar, if necessary
    if( (opts.colorbar === undefined) || opts.colorbar ){
	pinst = this.display.pluginInstances.JS9Colorbar;
	if( pinst && pinst.isActive() ){
	    // separate from main display
	    yoff += 2;
	    // colorbar canvas
	    dataURL = pinst.colorbarjq[0].toDataURL("image/png");
	    yoff += this.display.height;
	    divstr = sprintf(divtmpl, xoff, yoff);
	    win.document.write(divstr);
	    win.document.write(sprintf("<img "));
	    win.document.write(sprintf(" src='%s'>", dataURL));
	    win.document.write("</div>");
	    // colorbar text/tickmarks canvas
	    dataURL = pinst.textjq[0].toDataURL("image/png");
	    yoff += pinst.colorbarjq.height() + 1;
	    divstr = sprintf(divtmpl, xoff, yoff);
	    win.document.write(divstr);
	    // need to rescale the text ... argh!!!
            win.document.write(sprintf("<img style='width:%spx;'",
				       this.display.width));
	    win.document.write(sprintf("src='%s'>", dataURL));
	    win.document.write("</div>");
	}
    }
    // finish up
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
    // line
    linepoints: [{x: -30, y: 30}, {x:30, y:-30}],
    // polygon in display coords
    // points: [{x: -30, y: 30}, {x:30, y:30}, {x:30, y:-30}, {x:-30, y: -30}],
    polypoints: [{x: -30, y: 30}, {x:30, y:30}, {x:0, y:-30}],
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
    },
    // mouse down processing
    onmousedown: function(im, xreg, evt, target){
	var curtime, dblclick, poly;
	// look for double click
	// fabric dblclick support is broken (loses position during scroll)
	if( !JS9.specialKey(evt) ){
	    if( target.params ){
		curtime = (new Date()).getTime();
		if( target.params.lasttime ){
		    if( (curtime - target.params.lasttime) < JS9.DBLCLICK ){
			dblclick = true;
		    }
		}
		target.params.lasttime = curtime;
	    }
	}
	if( dblclick ){
	    if( !target.params.winid ){
		// call this once window is loaded
		$("#dhtmlwindowholder").arrive("#regionsConfigForm",
                    {onceOnly: true}, function(){
			if( target.pub ){
			    JS9.Regions.initConfigForm.call(im, target);
			}
		    });
		if( JS9.allinone ){
		    target.params.winid = im.displayAnalysis("params",
			  JS9.allinone.regionsConfigHTML,
			  "Region Configuration");
		} else {
		    target.params.winid = im.displayAnalysis("params",
			  JS9.InstallDir(JS9.Regions.opts.configURL),
			  "Region Configuration");
		}
	    }
	    return;
	}
	// add polygon points
	if( JS9.specialKey(evt) ){
	    if( target.type === "polygon" || target.type === "polyline" ){
		JS9.Fabric.addPolygonPoint.call(im, target.params.layerName,
						target, evt);
		JS9.Fabric._updateShape.call(im, target.params.layerName,
					     target, null, "update");
	    } else if( target.polyparams && target.polyparams.polygon  ){
		poly = target.polyparams.polygon;
		JS9.Fabric.removePolygonPoint.call(im, poly.params.layerName,
						   target, evt);
		JS9.Fabric._updateShape.call(im, poly.params.layerName,
					     poly, null, "update");
	    }
	}
    },
    // mouse up processing
    onmouseup: function(im, xreg, evt, target){
	var i;
	var objs = [];
	// one active object
	if( this.getActiveObject() ){
	    objs.push(this.getActiveObject());
	}
	// group of active objects
	if( this.getActiveGroup() ){
	    objs = this.getActiveGroup().getObjects();
	}
	// re-select polyon that was just processed
	for(i=0; i<objs.length; i++){
	    if( objs[i].polyparams ){
		this.setActiveObject(objs[i].polyparams.polygon);
	    }
	}
    },
    // global onchange callback
    onchange: null
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

// allow a global routine to execute each time a region changes
// to use this, set JS9.Regions.opts.onchange to point to your function
JS9.Regions.onchange = function(im, xreg){
    if( JS9.Regions.opts.onchange &&
	typeof JS9.Regions.opts.onchange === "function" ){
	try{ JS9.Regions.opts.onchange(im, xreg); }
	catch(ignore){}
    }
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
	case "radii":
	    if( obj.pub.radii ){
		obj.pub.radii.forEach(function(p){
		    if( val ){
			val += ", ";
		    }
		    val += p.toFixed(1);
		});
	    }
	    break;
	case "pts":
	    if( obj.pub.pts ){
		obj.pub.pts.forEach(function(p){
		    if( val ){
			val += ", ";
		    }
		    val += sprintf("%s, %s", p.x.toFixed(2), p.y.toFixed(2));
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
		// fix floating point values
		if( (typeof val === "number") && (val % 1 !== 0) ){
		    val = val.toFixed(2);
		}
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
	$(form + "[name='listonchange']").prop("checked", true);
    } else {
	$(form + "[name='listonchange']").prop("checked", false);
    }
    if( obj.params.fixinplace === undefined ){
	obj.params.fixinplace = false;
    }
    if( obj.params.fixinplace ){
	$(form + "[name='fixinplace']").prop("checked", true);
    } else {
	$(form + "[name='fixinplace']").prop("checked", false);
    }
    // shape specific processing
    switch(obj.pub.shape){
    case "box":
    case "ellipse":
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
    var owcssys, wcssys, iswcs, liswcs, pos, alen;
    var regrexp = /(annulus)|(box)|(circle)|(ellipse)|(line)|(polygon)|(point)|(text)/;
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
	    sarr = JS9.wcs2pix(this.raw.wcs, v1.dval, v2.dval).split(/ +/);
	    ox = parseFloat(sarr[0]);
	    oy = parseFloat(sarr[1]);
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
	var wcsinfo = this.raw.wcsinfo || {cdelt1: 1, cdelt2: 1};
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
		case 'line':
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
JS9.Regions.saveRegions = function(fname, which){
    var header = sprintf("# Region file format: JS9 version 1.0");
    var regstr = this.listRegions(which, 1);
    var s = sprintf("%s\n%s\n", header, regstr.replace(/; */g, "\n"));
    var blob = new Blob([s], {type: "text/plain;charset=utf-8"});
    fname = fname || "js9.reg";
    if( window.hasOwnProperty("saveAs") ){
	saveAs(blob, fname);
    } else {
	JS9.error("no saveAs function available to save region file");
    }
    return fname;
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
	this.context.msImageSmoothingEnabled = false;
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
    var pos, tval, magDisp, zoom;
    var canvas, sx, sy, sw, sh, dx, dy, dw, dh;
    // sanity check
    // only display if we have a magnifier present
    if(!im || !im.display.pluginInstances.JS9Magnifier ||
       (im.display.pluginInstances.JS9Magnifier.status !== "active")){
	return;
    }
    // don't display if a mouse button is pressed while moving, or
    // if two or more touch buttons are pressed while moving
    if( (im.clickState > 0) || (im.clickState < -1) ){
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
    // center point size and position, based on zoom
    if( im.magnifier.ozoom !== zoom ){
	im.changeShapes("magnifier", im.magnifier.boxid,
			{left: magDisp.width/2, top:  magDisp.height/2, 
			 width: zoom, height: zoom});
	im.magnifier.ozoom = im.magnifier.zoom;
    }
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
    // save old value, set new value
    magnifier.ozoom = magnifier.zoom;
    magnifier.zoom = nzoom;
    // redisplay
    JS9.Magnifier.display(im);
};

// close the magnifier when closing the image
JS9.Magnifier.close = function(im){
    var magnifier = im.display.pluginInstances.JS9Magnifier;
    if( magnifier && (im === im.display.image) ){
	magnifier.context.clear();
	im.removeShapes("magnifier", "all");
    }
    return im;
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
"<button type='button' class='JS9Button' onClick='JS9.bcall(this, \"zoomPanner\", \"1\"); return false'>z1</button>" +
"<button type='button' class='JS9Button' onClick='JS9.bcall(this, \"panImage\"); return false'>center</button>" +
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
	this.context.msImageSmoothingEnabled = false;
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
	    var ix = ((pos.x - im.panner.ix) *
		      im.panner.xblock / im.panner.zoom) + im.panner.x0;
	    var iy = ((dlayer.canvas.height - (pos.y + im.panner.iy)) *
		      im.panner.yblock / im.panner.zoom) + im.panner.y0;
	    // pan the image
	    try{
		// avoid triggering a re-pan
		im.display.pluginInstances.JS9Panner.status = "inactive";
		// pan image
		im.setPan(ix, iy);
	    }
	    catch(e){JS9.log("couldn't pan image", e);}
	    finally{im.display.pluginInstances.JS9Panner.status = "active";}
	}
    });
    // display current image in panner
    if( this.display.image ){
	JS9.Panner.display(this.display.image);
    }
};

// create panner (RGB) image from scaled colorCells
// sort of from: tksao1.0/frame/truecolor.c, but not really
// part of panner plugin
JS9.Panner.create = function(im){
    var panDisp, panner, sect, img;
    var x0, y0, xblock, yblock;
    var i, j, ii, jj, kk;
    var ioff, ooff;
    var width, height;
    // sanity check
    if( !im || !im.raw ||
	!im.display.pluginInstances.JS9Panner ){
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
    sect = im.rgb.sect;
    // size image
    width = Math.min(im.raw.width, panDisp.width);
    height = Math.min(im.raw.height, panDisp.height);
    // block RGB image to fit into panner window
    panner.xblock = im.raw.width / width;
    panner.yblock = im.raw.height / height;
    if( panner.xblock > panner.yblock ){
	height = Math.floor(height / panner.xblock * panner.yblock + 0.5);
	panner.yblock = panner.xblock;
    } else if( panner.yblock > panner.xblock ){
	width = Math.floor(width / panner.yblock * panner.xblock + 0.5);
	panner.xblock = panner.yblock;
    }
    // create an RGB image the same size as the raw data
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
    // save as panner image
    panner.img = img;
    panner.ix = 0;
    panner.iy = 0;
    if( im.rgbFile ){
	// for a static RGB file, access the RGB data directly
	for(j=0; j<height; j++){
	    jj = Math.floor(y0 + (j * yblock)) * im.offscreen.img.width;
	    kk = j * width;
	    for(i=0; i<width; i++){
		ii = Math.floor(x0 + (i * xblock));
		ioff = (ii + jj) * 4;
		ooff = (kk + i) * 4;
		img.data[ooff]   = im.offscreen.img.data[ioff];
		img.data[ooff+1] = im.offscreen.img.data[ioff+1];
		img.data[ooff+2] = im.offscreen.img.data[ioff+2];
		img.data[ooff+3] = 255;
	    }
	}
	return im;
    }
    // index into scaled data using previously calc'ed data value to get RGB
    for(j=0; j<height; j++){
	jj = Math.floor(y0 + ((height-j-1) * yblock)) * im.raw.width;
	kk = j * width;
	for(i=0; i<width; i++){
	    ii = Math.floor(x0 + (i * xblock));
	    ioff = im.colorData[ii + jj];
	    ooff = (kk + i) * 4;
	    if( im.psColors[ioff] ){
		img.data[ooff]   = im.psColors[ioff][0];
		img.data[ooff+1] = im.psColors[ioff][1];
		img.data[ooff+2] = im.psColors[ioff][2];
		img.data[ooff+3] = 255;
	    }
	}
    }
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
    sect = im.rgb.sect;
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
    var panner = im.display.pluginInstances.JS9Panner;
    if( panner && (im === im.display.image) ){
	panner.context.clear();
	im.removeShapes("panner", "all");
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
    evented: false,
    // catalog objects are locked in place by default
    // set "movable" to true to unlock all, or unlock individually
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
    lockUniScaling: true,
    selectable: false,
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

// sigh ... why do we need this polyfill??? (chrome pre-38)
Math.log10 = Math.log10 || function(x) {
  return Math.log(x) / Math.LN10;
};

// javascript: the good parts p. 22
if( typeof Object.create !== "function" ){
    Object.create = function(o){
	var F = function(){return;};
	F.prototype = o;
	return new F();
    };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asinh
Math.asinh = Math.asinh || function(x) {
  if (x === -Infinity) {
    return x;
  }
  return Math.log(x + Math.sqrt(x * x + 1));
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh
Math.sinh = Math.sinh || function(x) {
  return (Math.exp(x) - Math.exp(-x)) / 2;
};

// set explicit focus for IPython/Jupyter support
JS9.jupyterFocus = function(el, el2){
    var eljq;
    if( window.hasOwnProperty("Jupyter") ){
	if( el instanceof jQuery ){
	    eljq = el;
	} else {
	    eljq = $(el);
	}
	el2 = el2 || "input, textarea";
	eljq.find(el2).each(function(){
	    Jupyter.keyboard_manager.register_events($(this));
	});
    }
};

// return a unique value for a given image id by appending <n> to the id
JS9.getImageID = function(imid, dispid, myim){
    var i, im, s;
    var ids = 0;
    var idmax = 1;
    var imlen = JS9.images.length;
    var rexp = /.*<([0-9][0-9]*)>$/;
    var rexp2 = /<[0-9][0-9]*>/;
    imid = imid.replace(rexp2, "");
    for(i=0; i<imlen; i++){
	im = JS9.images[i];
	if( im.display.id === dispid ){
	    if( (im !== myim) && (imid === im.id0) ){
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

// change cursor to waiting/not waiting
JS9.waiting = function(mode, el){
    var opts;
    switch(mode){
    case true:
	if( window.hasOwnProperty("Spinner") &&
	    (JS9.globalOpts.waitType === "spinner") ){
	    el = el || $("body").get(0);
	    if( !JS9.spinner ){
		JS9.spinner = {};
		opts = {color:   JS9.globalOpts.spinColor,
			opacity: JS9.globalOpts.spinOpacity};
		JS9.spinner.spinner = new Spinner(opts);
	    }
	    JS9.spinner.spinner.spin(el);
	} else {
	    $("body").addClass("waiting");
	}
	break;
    case false:
	if( window.hasOwnProperty("Spinner") &&
	    (JS9.globalOpts.waitType === "spinner") ){
	    if( JS9.spinner ){
		JS9.spinner.spinner.stop();
	    }
	} else {
	    $("body").removeClass("waiting");
	}
	break;
    }
};

// msg coming from socket.io or postMessage
JS9.msgHandler =  function(msg, cb){
    var obj, tdisp, res;
    var args = [];
    var cmd = msg.cmd;
    var id = msg.id;
    // turn off alerts
    if( cb ){
	JS9.globalOpts.alerts = false;
    }
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
	if( cb ){
	    JS9.globalOpts.alerts = true;
	    cb(res);
	}
	return res;
    }
    // skip blank lines and comments
    if( !cmd || (cmd === "#") ){
	if( cb ){
	    cb("");
	}
	if( cb ){
	    JS9.globalOpts.alerts = true;
	}
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
	    try{ res = obj.get(args) || ""; }
	    catch(e){ res = "ERROR: " + e.message; }
	    break;
	case "set":
	    // execute set call
	    try{ res = obj.set(args) || "OK"; }
	    catch(e){ res = "ERROR: " + e.message; }
	    break;
	default:
	    res = sprintf("ERROR: unknown cmd type for '%s'", cmd);
	}
    } else {
	if( !obj ){
	    res = sprintf("ERROR: unknown cmd '%s'", cmd);
	}
	if( !tdisp ){
	    res = sprintf("ERROR: unknown display (%s)", id);
	}
    }
    // turn on alerts, do message callback, if necessary
    if( cb ){
	JS9.globalOpts.alerts = true;
	cb(res);
    }
    return res;
};

// create a light window
// someday we might want other options ...
JS9.lightWin = function(id, type, s, title, opts){
    var rval;
    switch(JS9.LIGHTWIN){
    case "dhtml":
	rval = dhtmlwindow.open(id, type, s, title, opts);
	// override dhtml to add ios scroll capability
	if(  /iPad|iPhone|iPod/.test(navigator.platform) ){
	    $("#" + id + " " + JS9.lightOpts.dhtml.drag)
		.css("-webkit-overflow-scrolling", "touch")
		.css("overflow-y", "scroll");
	}
	// allow double-click or double-tap to close ...
	// ... the close button is unresponsive on the ipad/iphone
        $("#" + id + " ." + JS9.lightOpts.dhtml.dragBar)
	    .doubletap(function(){ rval.close(); }, null, 400);
	// if ios user failed to close the window via the close button,
	// give a hint (once per session only!)
        $("#" + id + " ." + JS9.lightOpts.dhtml.dragBar)
	    .on("touchend", this, function(e){
		// skip check if we are dragging
		if( !dhtmlwindow.distancex  && !dhtmlwindow.distancey ){
		    if( JS9.lightOpts.nclick >= 2 ){
			alert("trouble closing this window? double-tap the window handle");
			JS9.lightOpts.nclick = -1;
		    } else {
			if( JS9.lightOpts.nclick >= 0 ){
			    JS9.lightOpts.nclick++;
			}
		    }
		} else {
		    if( JS9.lightOpts.nclick > 0 ){
			JS9.lightOpts.nclick = 0;
		    }
		}
	    });
        break;
    default:
        break;
    }
    return rval;
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

// figure out precision from range of values
// from: /tksao1.0/colorbar/colorbarbase.C
JS9.floatPrecision = function(fval1, fval2){
    var aa, bb, prec;
    aa = Math.floor(Math.log10(Math.abs(fval1)));
    bb = Math.floor(Math.log10(Math.abs(fval2)));
    if( aa !== bb ){
      prec = aa > bb ? aa : bb;
    } else {
      prec = 1;
    }
    return prec;
};

// convert float value to a string with decent precision
// from: /tksao1.0/colorbar/colorbarbase.C
JS9.floatFormattedString = function(fval, prec, fix){
    var fmt;
    var s = "";
    if( fval === undefined ){
	return s;
    }
    if( prec < -2){
	fmt = "%." + Math.min(Math.abs(prec),9) + "e";
	s = sprintf(fmt, fval);
    } else if( prec < 0){
	s = fval.toFixed(Math.abs(prec)+3);
    } else if( prec < 2){
	fmt = "%." + Math.abs(prec) + "f";
	s = sprintf(fmt, fval);
    } else if( prec < 5){
	s = fval.toFixed(fix);
    } else{
	fmt = "%." + Math.min(prec, 9) + "e";
	s = sprintf(fmt, fval);
    }
    return s;
};

// get center of bounding box surrounding a polygon
JS9.centerPolygon = function(points){
    var i, plen;
    var minx, maxx, miny, maxy;
    // sanity check
    if( !points || !points.length ){
	return;
    }
    plen = points.length;
    for(i=0; i<plen; i++){
	if( (minx === undefined) || (points[i].x < minx) ){
	    minx = points[i].x;
	}
	if( (maxx === undefined) || (points[i].x > maxx) ){
	    maxx = points[i].x;
	}
	if( (miny === undefined) || (points[i].y < miny) ){
	    miny = points[i].y;
	}
	if( (maxy === undefined) || (points[i].y > maxy) ){
	    maxy = points[i].y;
	}
    }
    return {x: (minx + maxx) / 2.0, y: (miny + maxy) / 2.0};
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

// return the image object for the specified image object, name, or filename
JS9.lookupImage = function(id, display){
    var i, im;
    var ilen= JS9.images.length;
    // sanity check
    if( !id ){
	return null;
    }
    for(i=0; i<ilen; i++){
	im = JS9.images[i];
	if( (id === im )                          ||
	    (id === im.id) || (id === im.id0)     ||
	    (id === im.file) || (id === im.file0) ||
	    (id === (JS9.TOROOT + im.file))       ||
	    (im.fitsFile && (id === im.fitsFile)) ){
	    // make sure the display still exists (light windows disappear)
	    if( $("#"+im.display.id).length > 0 ){
		if( !display || (display === im.display.id) ){
		    return im;
		}
	    }
	}
    }
    return null;
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

// look for specified vfile among raw0 hdus
// used to determine if its safe to delete a vfile
JS9.lookupVfile = function(vfile){
    var i, j, im, raw;
    var arr = [];
    // sanity check
    if( !vfile ){
	return arr;
    }
    // check raw0 hdu for specified vfile
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	for(j=0; j<im.raws.length; j++){
	    raw = im.raws[j];
	    if( raw.hdu && raw.hdu.fits && (vfile === raw.hdu.fits.vfile) ){
		arr.push({im: im, raw: raw, idx: j});
	    }
	}
    }
    return arr;
};

// process a list of file objects or blobs
JS9.onFileList = function(files, options, handler){
    var i;
    var dofits = function(nfile){
	var disp;
	var file = files[nfile];
	var topts = $.extend({}, options);
	if( JS9.fits.handleFITSFile ){
	    if( file.name ){
		topts.filename = file.name;
	    }
	    if( topts.display ){
		disp = JS9.lookupDisplay(topts.display);
		if( disp ){
		    disp = disp.divjq[0];
		}
	    }
	    JS9.waiting(true, disp);
	    try{ JS9.fits.handleFITSFile(file, topts, handler); }
	    catch(e){ JS9.error("can't process FITS file from file list", e); }
	} else {
	    JS9.error("no FITS module available to load FITS file");
	}
    };
    for(i=0; i<files.length; i++){
	if( files[i].type.indexOf("image/") !== -1 ){
	    switch(files[i].type){
	    case "image/fits":
		dofits(i);
		break;
	    default:
		JS9.handleImageFile(files[i], options, handler);
		break;
	    }
	} else {
	    dofits(i);
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
    if( JS9.globalOpts.xtimeout ){
	xhr.timeout = JS9.globalOpts.xtimeout;
    }
    xhr.onload = function(e) {
	var blob;
        if( this.readyState === 4 ){
	    if( this.status === 200 || this.status === 0 ){
		if( xhr.responseType === "blob" ){
	            blob = new Blob([this.response]);
		    // discard path (or scheme) up to slashes
		    // remove trailing ? params
		    if( name.match("://") ){
			blob.name = name.split("/").reverse()[0]
			    .replace(/\?.*$/, "");
		    } else {
			blob.name = name;
		    }
		    // hack for Google Drive's lack of a filename
		    if( blob.name === "uc" ){
			blob.name = "google_" + JS9.uniqueID() + ".fits";
		    }
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
		JS9.error(sprintf("can't load: %s %s (%s)  ",
				  url, xhr.statusText,  xhr.status));
	    }
	}
    };
    xhr.onerror = function() {
	JS9.error(sprintf("cannot load: %s %s .. please check the url/pathname",
	    url, xhr.statusText));
    };
    xhr.ontimeout = function() {
	JS9.error("timeout awaiting response from server: " + url);
    };
    try{ xhr.send(); }
    catch(e){ JS9.error("request to load " + url + " failed", e); }
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
	JS9.fits.options.error = JS9.error;
	if( JS9.userOpts.fits ){
	    JS9.fits.options.extlist =  JS9.userOpts.fits.extlist;
	    JS9.fits.options.table = {
		nx: JS9.userOpts.fits.xdim,
		ny: JS9.userOpts.fits.ydim
	    };
	} else {
	    JS9.fits.options.extlist =  JS9.globalOpts.extlist;
	    JS9.fits.options.table = {
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
JS9.eventToDisplayPos = function(evt, offset){
    //this section is from http://www.quirksmode.org/js/events_properties.html
    var i, targ, pageX, pageY, leftOff, upOff, touches, pos;
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
    // offset() returns the position of the element relative to the document
    offset = offset || $(targ).offset();
    // pageX, pageY: mouse positions relative to the document
    // changed touch events: take position from first finger
    if( evt.originalEvent ){
	if( evt.originalEvent.touches &&
	    evt.originalEvent.touches.length ){
	    touches = evt.originalEvent.touches;
	    pageX = touches[0].pageX;
	    pageY = touches[0].pageY;
	} else if( evt.originalEvent.changedTouches &&
		   evt.originalEvent.changedTouches.length ){
	    touches = evt.originalEvent.changedTouches;
	    pageX = touches[0].pageX;
	    pageY = touches[0].pageY;
	} else {
	    pageX = evt.pageX;
	    pageY = evt.pageY;
	}
    } else {
	// mouse events
	pageX = evt.pageX;
	pageY = evt.pageY;
    }
    // position is (evt pos relative to page - pos of element relative to page)
    // FUDGE added after visual inspection of line512 at zoom 32
    // I tried to place the mouse, and have the magnifier be in the right place
    // Linux, FF & Chrome: x=1, y=1 (5/28/14)
    leftOff = offset.left + XFUDGE;
    upOff = offset.top  + YFUDGE;
    // display position
    pos = {x: Math.floor(pageX - leftOff), y: Math.floor(pageY - upOff)};
    // touch positions, if necesary
    if( touches && touches.length ){
	pos.touches = [{x: pos.x, y: pos.y}];
	for(i=1; i<touches.length; i++){
	    pos.touches[i] = {x: Math.floor(touches[i].pageX - leftOff),
			      y: Math.floor(touches[i].pageY - upOff)};
	}
    }
    return pos;
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

// is this a string representation of a number?
JS9.isNumber = function(s) {
    return !isNaN(parseFloat(s)) && isFinite(s);
};

// check if a variable is neither undefined nor null
JS9.notNull = function(s) {
    return s !== undefined && s !== null;
};

// parse a FITS card and return name and value
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
    var i, obj, key, val, card, s, obp;
    var hasend=false;
    var t="";
    // sanity check
    if( !raw ){
	return t;
    }
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
	    // hack: if bitpix was changed by a raw data layer, fix it now
	    if( card.match(/^BITPIX/) && raw.bitpix ){
		s = card.replace(/BITPIX *= *(-?[0-9][0-9]*) */, "$1");
		obp = parseInt(s, 10);
		if( obp !== raw.bitpix ){
		    t += sprintf("BITPIX  = %20s / %-47s",
				 raw.bitpix, "bits/pixel");
		} else {
		    t += card;
		}
	    } else {
		t += card;
	    }
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
    } else if( raw.BITPIX ){
	// directly specified object containing header without comments
	obj = raw;
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

// convert an array of hdu objects into a nice string
JS9.hdus2Str = function(hdus){
    var i, j, s, obj;
    var t="";
    // sanity check
    if( !hdus ){
	return t;
    }
    for(i=0; i<hdus.length; i++){
	obj = hdus[i];
	if( obj.name ){
	    s = obj.name;
	} else if( i === 0 ){
	    s = "Primary";
	} else {
	    s = "N/A";
	}
	t += sprintf("<b>#%d</b>:&#09;<b>name</b>: %s&#09;<b>type</b>: %s",
		     obj.hdu, s, obj.type);
	switch(obj.type){
	case "image":
	    t += sprintf("&#09;<b>bitpix</b>: %d&#09;<b>naxis</b>: %d", obj.bitpix, obj.naxis);
	    if( obj.naxes.length ){
		t += "&#09;<b>axes</b>: [";
		for(j=0; j<obj.naxes.length; j++){
		    t += sprintf("%d", obj.naxes[j]);
		    if( j !== obj.naxes.length-1 ){
			t += ", ";
		    }
		}
		t += "]";
	    }
	    break;
	case "table":
	case "ascii":
	    s = "&#09;";
	    if( obj.rows <= 9 ){
		s += "&#09;";
	    }
	    t += sprintf("&#09;<b>rows</b>: %d%s<b>cols</b>: [", obj.rows, s);
	    for(j=0; j<obj.cols.length; j++){
		t += sprintf("%s", obj.cols[j].name);
		if( j !== obj.cols.length-1 ){
		    t += ", ";
		}
	    }
	    t += "]";
	    break;
	}
	t += "\n\n";
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

// create a tooltip, with the tip formatted from a string containing
// variables in the current context, e.g. "$im.id\n$xreg.imstr\n$xreg.data.tag"
JS9.tooltip = function(x, y, fmt, im, xreg, evt){
    var tipstr;
    var fmt2str = function(str){
	var cmd = str.replace(/\$([a-zA-Z0-9_.]+)/g, function(m, t, o){
            var i, val;
	    var arr = t.split(".");
	    switch(arr[0]){
	    case "im":
		val = im;
		break;
	    case "xreg":
		val = xreg;
		break;
	    case "evt":
		val = evt;
		break;
	    default:
		return m;
	    }
	    for(i=1; i<arr.length; i++) {
		val = val[arr[i]];
	    }
	    return val;
	});
	return cmd;
    };
    if( fmt ){
	tipstr = fmt2str(fmt);
	im.display.tooltip
	    .html(tipstr).css({left:x, top:y, display: "inline-block"});
    } else {
	im.display.tooltip
	    .html("").css({left: -9999, display: "none"});
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
      cache: false,
      dataType: "json",
      mimeType: "application/json",
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
	    if( JS9.CHROMEFILEWARNING &&
		(JS9.BROWSER[0] === "Chrome") && (document.domain === "") &&
		(errorThrown && errorThrown.message && errorThrown.message.match(/Failed to execute 'send' on 'XMLHttpRequest'/)) ){
		    alert("When using the file:// URI, Chrome must be run with the --allow-file-access-from-files switch to permit JS9 to access the preference file (and data files).");
		JS9.CHROMEFILEWARNING = false;
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
    var display = evt.data;
    var im = display.image;
    // sanity checks
    if( !im ){
	return;
    }
    // get element offset
    if( evt.target ){
	im.posOffset = $(evt.target).offset();
    }
    // get canvas position
    im.pos0 = JS9.eventToDisplayPos(evt, im.posOffset);
    // this also is the current canvas position
    im.pos = im.pos0;
    // get image position
    im.ipos0 = im.displayToImagePos(im.pos);
    // this also is the current image position
    im.ipos = im.ipos0;
    // prevent default unless we are close to the resize area
    if( !display.inResize(im.pos) ){
	evt.preventDefault();
    }
    // begin actions for mouse and touch events
    if( JS9.hasOwnProperty("MouseTouch") ){
	JS9.MouseTouch.action(im, evt, "start");
    }
    // inside a region, clear region display and return;
    if( im.clickInRegion ){
	// clear the region layer
	im.clearMessage("regions");
	return;
    }
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	im.xeqPlugins("mouse", "onmousedown", evt);
    }
    // set click state to current mouse button
    im.clickState = evt.which;
    switch(evt.which){
    case 1:
	// primary mouse click
	im.clickState = 1;
	break;
    case 2:
	break;
    case 3:
	// secondary mouse click
	im.clickState = 2;
	break;
    }
    // override click state with touch state, if possible
    if( evt.originalEvent &&
	evt.originalEvent.touches && evt.originalEvent.touches.length ){
	im.clickState = -evt.originalEvent.touches.length;
    }
    // add callbacks for moving
    $("body").on("mousemove", display, 
		 function(evt){return JS9.mouseMoveCB(evt);});
    $("body").on("mouseup", display,
		 function(evt){return JS9.mouseUpCB(evt);});
};

// mouseup: assumes display obj is passed in evt.data
JS9.mouseUpCB = function(evt){
    var display = evt.data;
    var im = display.image;
    // sanity checks
    if( !im ){
	return;
    }
    // get canvas position
    im.pos = JS9.eventToDisplayPos(evt, im.posOffset);
    // image position
    im.ipos = im.displayToImagePos(im.pos);
    // prevent default unless we are close to the resize area
    if( !display.inResize(im.pos) ){
	evt.preventDefault();
    }
    // end actions for mouse and touch events
    if( JS9.hasOwnProperty("MouseTouch") ){
	JS9.MouseTouch.action(im, evt, "stop");
    }
    // inside a region, update region string
    if( im.clickInRegion ){
	if( ((Math.abs(im.pos0.x-im.pos.x) < JS9.NOMOVE)  &&
	     (Math.abs(im.pos0.y-im.pos.y) < JS9.NOMOVE)) ){
	    im.updateShapes("regions", "selected", "select");
	} else {
	    im.updateShapes("regions", "selected", "update");
	}
    }
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	im.xeqPlugins("mouse", "onmouseup", evt);
    }
    // safe to unset clickInRegion now
    im.clickInRegion = false;
    im.clickState = 0;
    im.posOffset = null;
    // finish resize, if necessary
    if( display.resizing ){
	display.resizing = 0;
	if( JS9.bugs.webkit_resize ){
	    var dwidth = parseInt(display.divjq.css("width"), 10);
	    var dheight = parseInt(display.divjq.css("height"), 10);
	    if( dwidth  < display.owidth ){
		display.divjq.css("width", display.owidth + JS9.RESIZEFUDGE);
	    }
	    if( dheight < display.oheight ){
		display.divjq.css("height", display.oheight + JS9.RESIZEFUDGE);
	    }
	}
    }
    $("body").off("mouseup");
    $("body").off("mousemove");
};

// mousemove: assumes display obj is passed in evt.data
JS9.mouseMoveCB = function(evt){
    var sel;
    var display = evt.data;
    var im = display.image;
    // evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    // don't do anything if we are resizing
    if( display.resizing ){
	return;
    }
    // get canvas position
    im.pos = JS9.eventToDisplayPos(evt, im.posOffset);
    // get image position
    im.ipos = im.displayToImagePos(im.pos);
    // in case mouse down was not called
    if( !im.pos0 ){
	im.pos0 = im.pos;
    }
    if( !im.ipos0 ){
	im.ipos0 = im.ipos;
    }
    // prevent default unless we are close to the resize area
    if( !display.inResize(im.pos) ){
	evt.preventDefault();
    }
    // reset the valpos object
    im.valpos = null;
    // in a region, update the region info
    if( im.clickInRegion ){
	sel = im.display.layers.regions.params.sel;
	if( sel ){
	    if( im.params.listonchange || sel.params.listonchange ){
		im.updateShape("regions", sel, null, "update", true);
		im.listRegions("selected", 2);
	    }
	}
    }
    // actions for mouse and touch events
    if( JS9.hasOwnProperty("MouseTouch") ){
	JS9.MouseTouch.action(im, evt);
    }
    if( !JS9.specialKey(evt) ){
	// update valpos, in case a plugin wants it, and we did not do it above
	if( !im.valpos ){
	    im.valpos = im.updateValpos(im.ipos, false);
	}
	// plugin callbacks
	if( !JS9.specialKey(evt) ){
	    im.xeqPlugins("mouse", "onmousemove", evt);
	}
    }
};

// mouseover: assumes display obj is passed in evt.data
JS9.mouseOverCB = function(evt){
    var display = evt.data;
    var im = display.image;
    var x = $(document).scrollLeft(), y = $(document).scrollTop();
    evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    // set focus, but undo any scrolling
    im.display.displayConjq.focus();
    window.scrollTo(x, y);
    // change cursor
    // document.body.style.cursor = "crosshair";
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	// get canvas position
	im.pos = JS9.eventToDisplayPos(evt);
	// get image position
	im.ipos = im.displayToImagePos(im.pos);
	// plugin callbacks
	if( !JS9.specialKey(evt) ){
	    im.xeqPlugins("mouse", "onmouseover", evt);
	}
    }
};

// mouseover: assumes display obj is passed in evt.data
JS9.mouseOutCB = function(evt){
    var display = evt.data;
    var im = display.image;
    evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    // unset focus
    im.display.displayConjq.blur();
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	// get canvas position
	im.pos = JS9.eventToDisplayPos(evt);
	// get image position
	im.ipos = im.displayToImagePos(im.pos);
	// plugin callbacks
	if( !JS9.specialKey(evt) ){
	    im.xeqPlugins("mouse", "onmouseout", evt);
	}
    }
};

// scrollwheel: assumes display obj is passed in evt.data
JS9.wheelCB = function(evt){
    var display = evt.data;
    var im = display.image;
    if( display.mousetouchZoom && im         &&
	JS9.hasOwnProperty("MouseTouch")     &&
	JS9.MouseTouch.Actions["wheel zoom"] ){
	JS9.MouseTouch.Actions["wheel zoom"](im, evt);
	// avoid page scroll if we are using the wheel for zooming
	evt.preventDefault();
    }
};

// keypress: assumes display obj is passed in evt.data
// in case you are wondering: you can't move the mouse via javascript!
// http://stackoverflow.com/questions/4752501/move-the-mouse-pointer-to-a-specific-position
JS9.keyPressCB = function(evt){
    var display = evt.data;
    var im = display.image;
    // var keycode = evt.which || evt.keyCode;
    evt.preventDefault();
    // get canvas position
    im.pos = JS9.eventToDisplayPos(evt);
    // get image position
    im.ipos = im.displayToImagePos(im.pos);
    // plugin callbacks
    im.xeqPlugins("keypress", "onkeypress", evt);
};

// keydown: assumes display obj is passed in evt.data
// in case you are wondering: you can't move the mouse via javascript!
// http://stackoverflow.com/questions/4752501/move-the-mouse-pointer-to-a-specific-position
JS9.keyDownCB = function(evt){
    var display = evt.data;
    var im = display.image;
    // var keycode = evt.which || evt.keyCode;
    // get canvas position
    im.pos = JS9.eventToDisplayPos(evt);
    // get image position
    im.ipos = im.displayToImagePos(im.pos);
    // plugin callbacks
    im.xeqPlugins("keypress", "onkeydown", evt);
    // fire keydown for keyboard-enabled layer, if necessary
    if( im.layer && im.layers[im.layer].opts.usekeyboard ){
	JS9.Regions.keyDownCB(im, im.ipos, evt, im.layer);
    }
};

// ---------------------------------------------------------------------
// drag and drop event handlers
// ---------------------------------------------------------------------
JS9.dragenterCB = function(id, evt){
    evt.stopPropagation();
    evt.preventDefault();
};

JS9.dragoverCB = function(id, evt){
    evt.stopPropagation();
    evt.preventDefault();
};

JS9.dragexitCB = function(id, evt){
    evt.stopPropagation();
    evt.preventDefault();
};

JS9.dragdropCB = function(id, evt, handler){
    var files, opts;
    // convert jquery event to original event, if possible
    if( evt.originalEvent ){
	evt = evt.originalEvent;
    }
    evt.stopPropagation();
    evt.preventDefault();
    files = evt.target.files || evt.dataTransfer.files;
    opts = $.extend(true, {}, JS9.fits.options);
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
	if( cbname && !this.plugin.opts.hasOwnProperty(cbname) ){
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
	// add id
	if( !instance.odivjq.attr("id") ){
	    instance.odivjq.attr("id", instance.id);
	}
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
    // which tells us where JS9 installed files (and the helper) are located
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
	// allow in-line specification of images for all-in-one configuration
	if( JS9.allinone ){
	    dhtmlwindow.imagefiles = [JS9.allinone.min,
				      JS9.allinone.close,
				      JS9.allinone.restore,
				      JS9.allinone.resize];
	} else {
	    dhtmlwindow.imagefiles=[JS9.InstallDir("images/min.gif"),
				    JS9.InstallDir("images/close.gif"),
				    JS9.InstallDir("images/restore.gif"),
				    JS9.InstallDir("images/resize.gif")];
	}
	// once a window is loaded, set jupyter focus, if necessary
	if( window.hasOwnProperty("Jupyter") ){
	   $("#dhtmlwindowholder").arrive("input", function(){
	       JS9.jupyterFocus($(this).parent());
	   });
	}
    }
    // set this to false in the page to avoid loading a prefs file
    if( JS9.PREFSFILE ){
	// load site preferences, if possible
	JS9.loadPrefs(JS9.InstallDir(JS9.PREFSFILE), 1);
	// load page preferences, if possible
	JS9.loadPrefs(JS9.PREFSFILE, 0);
	// if we have regionOpts from preferences, add them to Regions.opts
	$.extend(true, JS9.Regions.opts, JS9.regionOpts);
    }
    // reset protocol for file:
    if( JS9.globalOpts.helperProtocol === "file:" ){
	JS9.globalOpts.helperProtocol = "http:";
    }
    // regularize resize params
    if( !JS9.globalOpts.resize ){
	JS9.globalOpts.resizeHandle = false;
    }
    // turn off resize on mobile platforms
    if( JS9.BROWSER[3] ){
	JS9.globalOpts.resizeHandle = false;
    }
    // add suffix
    JS9.globalOpts.helperProtocol += "//";
    // replace with global opts with user opts, if necessary
    if( window.hasOwnProperty("localStorage") ){
	try{ uopts = localStorage.getItem("images"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.images = JSON.parse(uopts); }
	    catch(ignore){}
	    if( JS9.userOpts.images ){
		$.extend(true, JS9.imageOpts, JS9.userOpts.images);
	    }
	}
	try{ uopts = localStorage.getItem("regions"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.regions = JSON.parse(uopts); }
	    catch(ignore){}
	    if( JS9.userOpts.regions ){
		$.extend(true, JS9.Regions.opts, JS9.userOpts.regions);
	    }
	}
	// this gets replaced below
	try{ uopts = localStorage.getItem("fits"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.fits = JSON.parse(uopts); }
	    catch(ignore){}
	}
	try{ uopts = localStorage.getItem("displays"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.displays = JSON.parse(uopts); }
	    catch(ignore){}
	    if( JS9.userOpts.displays ){
		$.extend(true, JS9.globalOpts, JS9.userOpts.displays);
	    }
	}
    }
    // add handler for postMessage events, if necessary
    if( JS9.globalOpts.postMessage ){
	window.addEventListener("message", function(ev){
	    var msg, res;
	    var data = ev.data;
	    // var origin = ev.origin;
	    // var source = ev.source;
	    if( typeof data === "string" ){
		// json string passed (we hope)
		try{ msg = JSON.parse(data); }
		catch(e){ JS9.error("can't parse msg: "+data, e); }
	    } else if( typeof data === "object" ){
		// object was passed directly
		msg = data;
	    } else {
		JS9.error("invalid msg from postMessage");
	    }
	    // call the msg handler
	    res = JS9.msgHandler(msg);
	    // send results back to parent (sender)
	    if( res ){
		parent.postMessage({cmd: msg.cmd, res: res}, "*");
	    }
	}, false);
    }
    // set debug flag
    JS9.DEBUG = JS9.DEBUG || JS9.globalOpts.debug || 0;
    // initialize image filters
    if( window.hasOwnProperty("ImageFilters") ){
	JS9.ImageFilters = ImageFilters;
    }
    // initialize astronomy emscripten routines (wcslib, etc), if possible
    if( window.hasOwnProperty("Astroem") ){
	JS9.vmalloc = Astroem.vmalloc;
	JS9.vfree = Astroem.vfree;
	JS9.vheap = Astroem.vheap;
	JS9.vmemcpy = Astroem.vmemcpy;
	JS9.vfile = Astroem.vfile;
	JS9.vunlink = Astroem.vunlink;
	JS9.arrfile = Astroem.arrfile;
	JS9.listhdu = Astroem.listhdu;
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
	JS9.tanhdr = Astroem.tanhdr;
	JS9.reproject = Astroem.reproject;
    }
    // configure fits library
    if( window.hasOwnProperty("Fitsy") ){
	JS9.fitsLibrary("fitsy");
	JS9.fits = Fitsy;
    } else if( window.hasOwnProperty("Astroem") ){
	JS9.fitsLibrary("cfitsio");
	JS9.fits = Astroem;
    }
    // init main display(s)
    $("div.JS9").each(function(){
	JS9.checkNew(new JS9.Display($(this)));
    });
    // register core plugins
    JS9.RegisterPlugin("JS9", "Menubar", JS9.Menubar);
    JS9.RegisterPlugin("JS9", "Console", JS9.Console,
		       {menuItem: "Console",
			winTitle: "Console",
			winResize: true,
			winDims: [JS9.WIDTH, 180]});
    JS9.RegisterPlugin("JS9", "Info", JS9.Info.init,
		       {menuItem: "InfoBox",
			onplugindisplay: JS9.Info.clearMain,
			winTitle: "Info",
			winResize: true,
			winDims: [JS9.INFOWIDTH, JS9.INFOHEIGHT]});
    JS9.RegisterPlugin(JS9.Regions.CLASS, JS9.Regions.NAME, JS9.Regions.init,
		       {onkeydown:  JS9.Regions.keyDownCB,
			onregionschange: JS9.Regions.onchange,
			divArgs: ["regions"],
			winDims: [0, 0]});
    JS9.RegisterPlugin(JS9.Magnifier.CLASS, JS9.Magnifier.NAME,
		       JS9.Magnifier.init,
		       {menuItem: "Magnifier",
			toolbarSeparate: false,
			toolbarHTML: JS9.Magnifier.HTML,
			onplugindisplay: JS9.Magnifier.display,
			onmousemove: JS9.Magnifier.display,
			onimageclose: JS9.Magnifier.close,
			winTitle: "Magnifier",
			winDims: [JS9.MAGWIDTH, JS9.MAGHEIGHT],
			divArgs: [JS9.DS9WIDTH, JS9.DS9HEIGHT]});
    JS9.RegisterPlugin(JS9.Panner.CLASS, JS9.Panner.NAME, JS9.Panner.init,
		       {menuItem: "Panner",
			toolbarSeparate: false,
			toolbarHTML: JS9.Panner.HTML,
			onplugindisplay: JS9.Panner.display,
			onimagedisplay: JS9.Panner.display,
			onimageclose: JS9.Panner.close,
			winTitle: "Panner",
			winDims: [JS9.PANWIDTH, JS9.PANHEIGHT],
			divArgs: [JS9.DS9WIDTH, JS9.DS9HEIGHT]});
    // find divs associated with each plugin and run the constructor
    JS9.instantiatePlugins();
    // sort plugins
    JS9.plugins.sort(function(a,b){
	var t1 = a.opts.menuItem;
	var t2 = b.opts.menuItem;
	if( !t1 ){
	    return 1;
	}
	if( !t2 ){
	    return -1;
	}
	if( t1 < t2 ){
	    return -1;
	}
	if( t1 > t2 ){
	    return 1;
	}
	return 0;
    });
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
    JS9.checkNew(new JS9.Colormap("heat",
	[[0,0], [0.34,1], [1,1]],
	[[0,0], [1,1]],
	[[0,0], [0.65,0], [0.98,1], [1,1]]));
    JS9.checkNew(new JS9.Colormap("cool",
	[[0,0], [0.29,0], [0.76,0.1], [1,1]],
	[[0,0], [0.22,0], [0.96,1], [1,1]],
	[[0,0], [0.53,1], [1,1]]));
    // https://github.com/BIDS/colormap/blob/master/colormaps.py
    JS9.checkNew(new JS9.Colormap("viridis", [[0.267004, 0.004874, 0.329415], [0.268510, 0.009605, 0.335427], [0.269944, 0.014625, 0.341379], [0.271305, 0.019942, 0.347269], [0.272594, 0.025563, 0.353093], [0.273809, 0.031497, 0.358853], [0.274952, 0.037752, 0.364543], [0.276022, 0.044167, 0.370164], [0.277018, 0.050344, 0.375715], [0.277941, 0.056324, 0.381191], [0.278791, 0.062145, 0.386592], [0.279566, 0.067836, 0.391917], [0.280267, 0.073417, 0.397163], [0.280894, 0.078907, 0.402329], [0.281446, 0.084320, 0.407414], [0.281924, 0.089666, 0.412415], [0.282327, 0.094955, 0.417331], [0.282656, 0.100196, 0.422160], [0.282910, 0.105393, 0.426902], [0.283091, 0.110553, 0.431554], [0.283197, 0.115680, 0.436115], [0.283229, 0.120777, 0.440584], [0.283187, 0.125848, 0.444960], [0.283072, 0.130895, 0.449241], [0.282884, 0.135920, 0.453427], [0.282623, 0.140926, 0.457517], [0.282290, 0.145912, 0.461510], [0.281887, 0.150881, 0.465405], [0.281412, 0.155834, 0.469201], [0.280868, 0.160771, 0.472899], [0.280255, 0.165693, 0.476498], [0.279574, 0.170599, 0.479997], [0.278826, 0.175490, 0.483397], [0.278012, 0.180367, 0.486697], [0.277134, 0.185228, 0.489898], [0.276194, 0.190074, 0.493001], [0.275191, 0.194905, 0.496005], [0.274128, 0.199721, 0.498911], [0.273006, 0.204520, 0.501721], [0.271828, 0.209303, 0.504434], [0.270595, 0.214069, 0.507052], [0.269308, 0.218818, 0.509577], [0.267968, 0.223549, 0.512008], [0.266580, 0.228262, 0.514349], [0.265145, 0.232956, 0.516599], [0.263663, 0.237631, 0.518762], [0.262138, 0.242286, 0.520837], [0.260571, 0.246922, 0.522828], [0.258965, 0.251537, 0.524736], [0.257322, 0.256130, 0.526563], [0.255645, 0.260703, 0.528312], [0.253935, 0.265254, 0.529983], [0.252194, 0.269783, 0.531579], [0.250425, 0.274290, 0.533103], [0.248629, 0.278775, 0.534556], [0.246811, 0.283237, 0.535941], [0.244972, 0.287675, 0.537260], [0.243113, 0.292092, 0.538516], [0.241237, 0.296485, 0.539709], [0.239346, 0.300855, 0.540844], [0.237441, 0.305202, 0.541921], [0.235526, 0.309527, 0.542944], [0.233603, 0.313828, 0.543914], [0.231674, 0.318106, 0.544834], [0.229739, 0.322361, 0.545706], [0.227802, 0.326594, 0.546532], [0.225863, 0.330805, 0.547314], [0.223925, 0.334994, 0.548053], [0.221989, 0.339161, 0.548752], [0.220057, 0.343307, 0.549413], [0.218130, 0.347432, 0.550038], [0.216210, 0.351535, 0.550627], [0.214298, 0.355619, 0.551184], [0.212395, 0.359683, 0.551710], [0.210503, 0.363727, 0.552206], [0.208623, 0.367752, 0.552675], [0.206756, 0.371758, 0.553117], [0.204903, 0.375746, 0.553533], [0.203063, 0.379716, 0.553925], [0.201239, 0.383670, 0.554294], [0.199430, 0.387607, 0.554642], [0.197636, 0.391528, 0.554969], [0.195860, 0.395433, 0.555276], [0.194100, 0.399323, 0.555565], [0.192357, 0.403199, 0.555836], [0.190631, 0.407061, 0.556089], [0.188923, 0.410910, 0.556326], [0.187231, 0.414746, 0.556547], [0.185556, 0.418570, 0.556753], [0.183898, 0.422383, 0.556944], [0.182256, 0.426184, 0.557120], [0.180629, 0.429975, 0.557282], [0.179019, 0.433756, 0.557430], [0.177423, 0.437527, 0.557565], [0.175841, 0.441290, 0.557685], [0.174274, 0.445044, 0.557792], [0.172719, 0.448791, 0.557885], [0.171176, 0.452530, 0.557965], [0.169646, 0.456262, 0.558030], [0.168126, 0.459988, 0.558082], [0.166617, 0.463708, 0.558119], [0.165117, 0.467423, 0.558141], [0.163625, 0.471133, 0.558148], [0.162142, 0.474838, 0.558140], [0.160665, 0.478540, 0.558115], [0.159194, 0.482237, 0.558073], [0.157729, 0.485932, 0.558013], [0.156270, 0.489624, 0.557936], [0.154815, 0.493313, 0.557840], [0.153364, 0.497000, 0.557724], [0.151918, 0.500685, 0.557587], [0.150476, 0.504369, 0.557430], [0.149039, 0.508051, 0.557250], [0.147607, 0.511733, 0.557049], [0.146180, 0.515413, 0.556823], [0.144759, 0.519093, 0.556572], [0.143343, 0.522773, 0.556295], [0.141935, 0.526453, 0.555991], [0.140536, 0.530132, 0.555659], [0.139147, 0.533812, 0.555298], [0.137770, 0.537492, 0.554906], [0.136408, 0.541173, 0.554483], [0.135066, 0.544853, 0.554029], [0.133743, 0.548535, 0.553541], [0.132444, 0.552216, 0.553018], [0.131172, 0.555899, 0.552459], [0.129933, 0.559582, 0.551864], [0.128729, 0.563265, 0.551229], [0.127568, 0.566949, 0.550556], [0.126453, 0.570633, 0.549841], [0.125394, 0.574318, 0.549086], [0.124395, 0.578002, 0.548287], [0.123463, 0.581687, 0.547445], [0.122606, 0.585371, 0.546557], [0.121831, 0.589055, 0.545623], [0.121148, 0.592739, 0.544641], [0.120565, 0.596422, 0.543611], [0.120092, 0.600104, 0.542530], [0.119738, 0.603785, 0.541400], [0.119512, 0.607464, 0.540218], [0.119423, 0.611141, 0.538982], [0.119483, 0.614817, 0.537692], [0.119699, 0.618490, 0.536347], [0.120081, 0.622161, 0.534946], [0.120638, 0.625828, 0.533488], [0.121380, 0.629492, 0.531973], [0.122312, 0.633153, 0.530398], [0.123444, 0.636809, 0.528763], [0.124780, 0.640461, 0.527068], [0.126326, 0.644107, 0.525311], [0.128087, 0.647749, 0.523491], [0.130067, 0.651384, 0.521608], [0.132268, 0.655014, 0.519661], [0.134692, 0.658636, 0.517649], [0.137339, 0.662252, 0.515571], [0.140210, 0.665859, 0.513427], [0.143303, 0.669459, 0.511215], [0.146616, 0.673050, 0.508936], [0.150148, 0.676631, 0.506589], [0.153894, 0.680203, 0.504172], [0.157851, 0.683765, 0.501686], [0.162016, 0.687316, 0.499129], [0.166383, 0.690856, 0.496502], [0.170948, 0.694384, 0.493803], [0.175707, 0.697900, 0.491033], [0.180653, 0.701402, 0.488189], [0.185783, 0.704891, 0.485273], [0.191090, 0.708366, 0.482284], [0.196571, 0.711827, 0.479221], [0.202219, 0.715272, 0.476084], [0.208030, 0.718701, 0.472873], [0.214000, 0.722114, 0.469588], [0.220124, 0.725509, 0.466226], [0.226397, 0.728888, 0.462789], [0.232815, 0.732247, 0.459277], [0.239374, 0.735588, 0.455688], [0.246070, 0.738910, 0.452024], [0.252899, 0.742211, 0.448284], [0.259857, 0.745492, 0.444467], [0.266941, 0.748751, 0.440573], [0.274149, 0.751988, 0.436601], [0.281477, 0.755203, 0.432552], [0.288921, 0.758394, 0.428426], [0.296479, 0.761561, 0.424223], [0.304148, 0.764704, 0.419943], [0.311925, 0.767822, 0.415586], [0.319809, 0.770914, 0.411152], [0.327796, 0.773980, 0.406640], [0.335885, 0.777018, 0.402049], [0.344074, 0.780029, 0.397381], [0.352360, 0.783011, 0.392636], [0.360741, 0.785964, 0.387814], [0.369214, 0.788888, 0.382914], [0.377779, 0.791781, 0.377939], [0.386433, 0.794644, 0.372886], [0.395174, 0.797475, 0.367757], [0.404001, 0.800275, 0.362552], [0.412913, 0.803041, 0.357269], [0.421908, 0.805774, 0.351910], [0.430983, 0.808473, 0.346476], [0.440137, 0.811138, 0.340967], [0.449368, 0.813768, 0.335384], [0.458674, 0.816363, 0.329727], [0.468053, 0.818921, 0.323998], [0.477504, 0.821444, 0.318195], [0.487026, 0.823929, 0.312321], [0.496615, 0.826376, 0.306377], [0.506271, 0.828786, 0.300362], [0.515992, 0.831158, 0.294279], [0.525776, 0.833491, 0.288127], [0.535621, 0.835785, 0.281908], [0.545524, 0.838039, 0.275626], [0.555484, 0.840254, 0.269281], [0.565498, 0.842430, 0.262877], [0.575563, 0.844566, 0.256415], [0.585678, 0.846661, 0.249897], [0.595839, 0.848717, 0.243329], [0.606045, 0.850733, 0.236712], [0.616293, 0.852709, 0.230052], [0.626579, 0.854645, 0.223353], [0.636902, 0.856542, 0.216620], [0.647257, 0.858400, 0.209861], [0.657642, 0.860219, 0.203082], [0.668054, 0.861999, 0.196293], [0.678489, 0.863742, 0.189503], [0.688944, 0.865448, 0.182725], [0.699415, 0.867117, 0.175971], [0.709898, 0.868751, 0.169257], [0.720391, 0.870350, 0.162603], [0.730889, 0.871916, 0.156029], [0.741388, 0.873449, 0.149561], [0.751884, 0.874951, 0.143228], [0.762373, 0.876424, 0.137064], [0.772852, 0.877868, 0.131109], [0.783315, 0.879285, 0.125405], [0.793760, 0.880678, 0.120005], [0.804182, 0.882046, 0.114965], [0.814576, 0.883393, 0.110347], [0.824940, 0.884720, 0.106217], [0.835270, 0.886029, 0.102646], [0.845561, 0.887322, 0.099702], [0.855810, 0.888601, 0.097452], [0.866013, 0.889868, 0.095953], [0.876168, 0.891125, 0.095250], [0.886271, 0.892374, 0.095374], [0.896320, 0.893616, 0.096335], [0.906311, 0.894855, 0.098125], [0.916242, 0.896091, 0.100717], [0.926106, 0.897330, 0.104071], [0.935904, 0.898570, 0.108131], [0.945636, 0.899815, 0.112838], [0.955300, 0.901065, 0.118128], [0.964894, 0.902323, 0.123941], [0.974417, 0.903590, 0.130215], [0.983868, 0.904867, 0.136897], [0.993248, 0.906157, 0.143936]]));
    JS9.checkNew(new JS9.Colormap("magma",
[[0.001462, 0.000466, 0.013866], [0.002258, 0.001295, 0.018331], [0.003279, 0.002305, 0.023708], [0.004512, 0.003490, 0.029965], [0.005950, 0.004843, 0.037130], [0.007588, 0.006356, 0.044973], [0.009426, 0.008022, 0.052844], [0.011465, 0.009828, 0.060750], [0.013708, 0.011771, 0.068667], [0.016156, 0.013840, 0.076603], [0.018815, 0.016026, 0.084584], [0.021692, 0.018320, 0.092610], [0.024792, 0.020715, 0.100676], [0.028123, 0.023201, 0.108787], [0.031696, 0.025765, 0.116965], [0.035520, 0.028397, 0.125209], [0.039608, 0.031090, 0.133515], [0.043830, 0.033830, 0.141886], [0.048062, 0.036607, 0.150327], [0.052320, 0.039407, 0.158841], [0.056615, 0.042160, 0.167446], [0.060949, 0.044794, 0.176129], [0.065330, 0.047318, 0.184892], [0.069764, 0.049726, 0.193735], [0.074257, 0.052017, 0.202660], [0.078815, 0.054184, 0.211667], [0.083446, 0.056225, 0.220755], [0.088155, 0.058133, 0.229922], [0.092949, 0.059904, 0.239164], [0.097833, 0.061531, 0.248477], [0.102815, 0.063010, 0.257854], [0.107899, 0.064335, 0.267289], [0.113094, 0.065492, 0.276784], [0.118405, 0.066479, 0.286321], [0.123833, 0.067295, 0.295879], [0.129380, 0.067935, 0.305443], [0.135053, 0.068391, 0.315000], [0.140858, 0.068654, 0.324538], [0.146785, 0.068738, 0.334011], [0.152839, 0.068637, 0.343404], [0.159018, 0.068354, 0.352688], [0.165308, 0.067911, 0.361816], [0.171713, 0.067305, 0.370771], [0.178212, 0.066576, 0.379497], [0.184801, 0.065732, 0.387973], [0.191460, 0.064818, 0.396152], [0.198177, 0.063862, 0.404009], [0.204935, 0.062907, 0.411514], [0.211718, 0.061992, 0.418647], [0.218512, 0.061158, 0.425392], [0.225302, 0.060445, 0.431742], [0.232077, 0.059889, 0.437695], [0.238826, 0.059517, 0.443256], [0.245543, 0.059352, 0.448436], [0.252220, 0.059415, 0.453248], [0.258857, 0.059706, 0.457710], [0.265447, 0.060237, 0.461840], [0.271994, 0.060994, 0.465660], [0.278493, 0.061978, 0.469190], [0.284951, 0.063168, 0.472451], [0.291366, 0.064553, 0.475462], [0.297740, 0.066117, 0.478243], [0.304081, 0.067835, 0.480812], [0.310382, 0.069702, 0.483186], [0.316654, 0.071690, 0.485380], [0.322899, 0.073782, 0.487408], [0.329114, 0.075972, 0.489287], [0.335308, 0.078236, 0.491024], [0.341482, 0.080564, 0.492631], [0.347636, 0.082946, 0.494121], [0.353773, 0.085373, 0.495501], [0.359898, 0.087831, 0.496778], [0.366012, 0.090314, 0.497960], [0.372116, 0.092816, 0.499053], [0.378211, 0.095332, 0.500067], [0.384299, 0.097855, 0.501002], [0.390384, 0.100379, 0.501864], [0.396467, 0.102902, 0.502658], [0.402548, 0.105420, 0.503386], [0.408629, 0.107930, 0.504052], [0.414709, 0.110431, 0.504662], [0.420791, 0.112920, 0.505215], [0.426877, 0.115395, 0.505714], [0.432967, 0.117855, 0.506160], [0.439062, 0.120298, 0.506555], [0.445163, 0.122724, 0.506901], [0.451271, 0.125132, 0.507198], [0.457386, 0.127522, 0.507448], [0.463508, 0.129893, 0.507652], [0.469640, 0.132245, 0.507809], [0.475780, 0.134577, 0.507921], [0.481929, 0.136891, 0.507989], [0.488088, 0.139186, 0.508011], [0.494258, 0.141462, 0.507988], [0.500438, 0.143719, 0.507920], [0.506629, 0.145958, 0.507806], [0.512831, 0.148179, 0.507648], [0.519045, 0.150383, 0.507443], [0.525270, 0.152569, 0.507192], [0.531507, 0.154739, 0.506895], [0.537755, 0.156894, 0.506551], [0.544015, 0.159033, 0.506159], [0.550287, 0.161158, 0.505719], [0.556571, 0.163269, 0.505230], [0.562866, 0.165368, 0.504692], [0.569172, 0.167454, 0.504105], [0.575490, 0.169530, 0.503466], [0.581819, 0.171596, 0.502777], [0.588158, 0.173652, 0.502035], [0.594508, 0.175701, 0.501241], [0.600868, 0.177743, 0.500394], [0.607238, 0.179779, 0.499492], [0.613617, 0.181811, 0.498536], [0.620005, 0.183840, 0.497524], [0.626401, 0.185867, 0.496456], [0.632805, 0.187893, 0.495332], [0.639216, 0.189921, 0.494150], [0.645633, 0.191952, 0.492910], [0.652056, 0.193986, 0.491611], [0.658483, 0.196027, 0.490253], [0.664915, 0.198075, 0.488836], [0.671349, 0.200133, 0.487358], [0.677786, 0.202203, 0.485819], [0.684224, 0.204286, 0.484219], [0.690661, 0.206384, 0.482558], [0.697098, 0.208501, 0.480835], [0.703532, 0.210638, 0.479049], [0.709962, 0.212797, 0.477201], [0.716387, 0.214982, 0.475290], [0.722805, 0.217194, 0.473316], [0.729216, 0.219437, 0.471279], [0.735616, 0.221713, 0.469180], [0.742004, 0.224025, 0.467018], [0.748378, 0.226377, 0.464794], [0.754737, 0.228772, 0.462509], [0.761077, 0.231214, 0.460162], [0.767398, 0.233705, 0.457755], [0.773695, 0.236249, 0.455289], [0.779968, 0.238851, 0.452765], [0.786212, 0.241514, 0.450184], [0.792427, 0.244242, 0.447543], [0.798608, 0.247040, 0.444848], [0.804752, 0.249911, 0.442102], [0.810855, 0.252861, 0.439305], [0.816914, 0.255895, 0.436461], [0.822926, 0.259016, 0.433573], [0.828886, 0.262229, 0.430644], [0.834791, 0.265540, 0.427671], [0.840636, 0.268953, 0.424666], [0.846416, 0.272473, 0.421631], [0.852126, 0.276106, 0.418573], [0.857763, 0.279857, 0.415496], [0.863320, 0.283729, 0.412403], [0.868793, 0.287728, 0.409303], [0.874176, 0.291859, 0.406205], [0.879464, 0.296125, 0.403118], [0.884651, 0.300530, 0.400047], [0.889731, 0.305079, 0.397002], [0.894700, 0.309773, 0.393995], [0.899552, 0.314616, 0.391037], [0.904281, 0.319610, 0.388137], [0.908884, 0.324755, 0.385308], [0.913354, 0.330052, 0.382563], [0.917689, 0.335500, 0.379915], [0.921884, 0.341098, 0.377376], [0.925937, 0.346844, 0.374959], [0.929845, 0.352734, 0.372677], [0.933606, 0.358764, 0.370541], [0.937221, 0.364929, 0.368567], [0.940687, 0.371224, 0.366762], [0.944006, 0.377643, 0.365136], [0.947180, 0.384178, 0.363701], [0.950210, 0.390820, 0.362468], [0.953099, 0.397563, 0.361438], [0.955849, 0.404400, 0.360619], [0.958464, 0.411324, 0.360014], [0.960949, 0.418323, 0.359630], [0.963310, 0.425390, 0.359469], [0.965549, 0.432519, 0.359529], [0.967671, 0.439703, 0.359810], [0.969680, 0.446936, 0.360311], [0.971582, 0.454210, 0.361030], [0.973381, 0.461520, 0.361965], [0.975082, 0.468861, 0.363111], [0.976690, 0.476226, 0.364466], [0.978210, 0.483612, 0.366025], [0.979645, 0.491014, 0.367783], [0.981000, 0.498428, 0.369734], [0.982279, 0.505851, 0.371874], [0.983485, 0.513280, 0.374198], [0.984622, 0.520713, 0.376698], [0.985693, 0.528148, 0.379371], [0.986700, 0.535582, 0.382210], [0.987646, 0.543015, 0.385210], [0.988533, 0.550446, 0.388365], [0.989363, 0.557873, 0.391671], [0.990138, 0.565296, 0.395122], [0.990871, 0.572706, 0.398714], [0.991558, 0.580107, 0.402441], [0.992196, 0.587502, 0.406299], [0.992785, 0.594891, 0.410283], [0.993326, 0.602275, 0.414390], [0.993834, 0.609644, 0.418613], [0.994309, 0.616999, 0.422950], [0.994738, 0.624350, 0.427397], [0.995122, 0.631696, 0.431951], [0.995480, 0.639027, 0.436607], [0.995810, 0.646344, 0.441361], [0.996096, 0.653659, 0.446213], [0.996341, 0.660969, 0.451160], [0.996580, 0.668256, 0.456192], [0.996775, 0.675541, 0.461314], [0.996925, 0.682828, 0.466526], [0.997077, 0.690088, 0.471811], [0.997186, 0.697349, 0.477182], [0.997254, 0.704611, 0.482635], [0.997325, 0.711848, 0.488154], [0.997351, 0.719089, 0.493755], [0.997351, 0.726324, 0.499428], [0.997341, 0.733545, 0.505167], [0.997285, 0.740772, 0.510983], [0.997228, 0.747981, 0.516859], [0.997138, 0.755190, 0.522806], [0.997019, 0.762398, 0.528821], [0.996898, 0.769591, 0.534892], [0.996727, 0.776795, 0.541039], [0.996571, 0.783977, 0.547233], [0.996369, 0.791167, 0.553499], [0.996162, 0.798348, 0.559820], [0.995932, 0.805527, 0.566202], [0.995680, 0.812706, 0.572645], [0.995424, 0.819875, 0.579140], [0.995131, 0.827052, 0.585701], [0.994851, 0.834213, 0.592307], [0.994524, 0.841387, 0.598983], [0.994222, 0.848540, 0.605696], [0.993866, 0.855711, 0.612482], [0.993545, 0.862859, 0.619299], [0.993170, 0.870024, 0.626189], [0.992831, 0.877168, 0.633109], [0.992440, 0.884330, 0.640099], [0.992089, 0.891470, 0.647116], [0.991688, 0.898627, 0.654202], [0.991332, 0.905763, 0.661309], [0.990930, 0.912915, 0.668481], [0.990570, 0.920049, 0.675675], [0.990175, 0.927196, 0.682926], [0.989815, 0.934329, 0.690198], [0.989434, 0.941470, 0.697519], [0.989077, 0.948604, 0.704863], [0.988717, 0.955742, 0.712242], [0.988367, 0.962878, 0.719649], [0.988033, 0.970012, 0.727077], [0.987691, 0.977154, 0.734536], [0.987387, 0.984288, 0.742002], [0.987053, 0.991438, 0.749504]]));
    JS9.checkNew(new JS9.Colormap("inferno", [[0.001462, 0.000466, 0.013866], [0.002267, 0.001270, 0.018570], [0.003299, 0.002249, 0.024239], [0.004547, 0.003392, 0.030909], [0.006006, 0.004692, 0.038558], [0.007676, 0.006136, 0.046836], [0.009561, 0.007713, 0.055143], [0.011663, 0.009417, 0.063460], [0.013995, 0.011225, 0.071862], [0.016561, 0.013136, 0.080282], [0.019373, 0.015133, 0.088767], [0.022447, 0.017199, 0.097327], [0.025793, 0.019331, 0.105930], [0.029432, 0.021503, 0.114621], [0.033385, 0.023702, 0.123397], [0.037668, 0.025921, 0.132232], [0.042253, 0.028139, 0.141141], [0.046915, 0.030324, 0.150164], [0.051644, 0.032474, 0.159254], [0.056449, 0.034569, 0.168414], [0.061340, 0.036590, 0.177642], [0.066331, 0.038504, 0.186962], [0.071429, 0.040294, 0.196354], [0.076637, 0.041905, 0.205799], [0.081962, 0.043328, 0.215289], [0.087411, 0.044556, 0.224813], [0.092990, 0.045583, 0.234358], [0.098702, 0.046402, 0.243904], [0.104551, 0.047008, 0.253430], [0.110536, 0.047399, 0.262912], [0.116656, 0.047574, 0.272321], [0.122908, 0.047536, 0.281624], [0.129285, 0.047293, 0.290788], [0.135778, 0.046856, 0.299776], [0.142378, 0.046242, 0.308553], [0.149073, 0.045468, 0.317085], [0.155850, 0.044559, 0.325338], [0.162689, 0.043554, 0.333277], [0.169575, 0.042489, 0.340874], [0.176493, 0.041402, 0.348111], [0.183429, 0.040329, 0.354971], [0.190367, 0.039309, 0.361447], [0.197297, 0.038400, 0.367535], [0.204209, 0.037632, 0.373238], [0.211095, 0.037030, 0.378563], [0.217949, 0.036615, 0.383522], [0.224763, 0.036405, 0.388129], [0.231538, 0.036405, 0.392400], [0.238273, 0.036621, 0.396353], [0.244967, 0.037055, 0.400007], [0.251620, 0.037705, 0.403378], [0.258234, 0.038571, 0.406485], [0.264810, 0.039647, 0.409345], [0.271347, 0.040922, 0.411976], [0.277850, 0.042353, 0.414392], [0.284321, 0.043933, 0.416608], [0.290763, 0.045644, 0.418637], [0.297178, 0.047470, 0.420491], [0.303568, 0.049396, 0.422182], [0.309935, 0.051407, 0.423721], [0.316282, 0.053490, 0.425116], [0.322610, 0.055634, 0.426377], [0.328921, 0.057827, 0.427511], [0.335217, 0.060060, 0.428524], [0.341500, 0.062325, 0.429425], [0.347771, 0.064616, 0.430217], [0.354032, 0.066925, 0.430906], [0.360284, 0.069247, 0.431497], [0.366529, 0.071579, 0.431994], [0.372768, 0.073915, 0.432400], [0.379001, 0.076253, 0.432719], [0.385228, 0.078591, 0.432955], [0.391453, 0.080927, 0.433109], [0.397674, 0.083257, 0.433183], [0.403894, 0.085580, 0.433179], [0.410113, 0.087896, 0.433098], [0.416331, 0.090203, 0.432943], [0.422549, 0.092501, 0.432714], [0.428768, 0.094790, 0.432412], [0.434987, 0.097069, 0.432039], [0.441207, 0.099338, 0.431594], [0.447428, 0.101597, 0.431080], [0.453651, 0.103848, 0.430498], [0.459875, 0.106089, 0.429846], [0.466100, 0.108322, 0.429125], [0.472328, 0.110547, 0.428334], [0.478558, 0.112764, 0.427475], [0.484789, 0.114974, 0.426548], [0.491022, 0.117179, 0.425552], [0.497257, 0.119379, 0.424488], [0.503493, 0.121575, 0.423356], [0.509730, 0.123769, 0.422156], [0.515967, 0.125960, 0.420887], [0.522206, 0.128150, 0.419549], [0.528444, 0.130341, 0.418142], [0.534683, 0.132534, 0.416667], [0.540920, 0.134729, 0.415123], [0.547157, 0.136929, 0.413511], [0.553392, 0.139134, 0.411829], [0.559624, 0.141346, 0.410078], [0.565854, 0.143567, 0.408258], [0.572081, 0.145797, 0.406369], [0.578304, 0.148039, 0.404411], [0.584521, 0.150294, 0.402385], [0.590734, 0.152563, 0.400290], [0.596940, 0.154848, 0.398125], [0.603139, 0.157151, 0.395891], [0.609330, 0.159474, 0.393589], [0.615513, 0.161817, 0.391219], [0.621685, 0.164184, 0.388781], [0.627847, 0.166575, 0.386276], [0.633998, 0.168992, 0.383704], [0.640135, 0.171438, 0.381065], [0.646260, 0.173914, 0.378359], [0.652369, 0.176421, 0.375586], [0.658463, 0.178962, 0.372748], [0.664540, 0.181539, 0.369846], [0.670599, 0.184153, 0.366879], [0.676638, 0.186807, 0.363849], [0.682656, 0.189501, 0.360757], [0.688653, 0.192239, 0.357603], [0.694627, 0.195021, 0.354388], [0.700576, 0.197851, 0.351113], [0.706500, 0.200728, 0.347777], [0.712396, 0.203656, 0.344383], [0.718264, 0.206636, 0.340931], [0.724103, 0.209670, 0.337424], [0.729909, 0.212759, 0.333861], [0.735683, 0.215906, 0.330245], [0.741423, 0.219112, 0.326576], [0.747127, 0.222378, 0.322856], [0.752794, 0.225706, 0.319085], [0.758422, 0.229097, 0.315266], [0.764010, 0.232554, 0.311399], [0.769556, 0.236077, 0.307485], [0.775059, 0.239667, 0.303526], [0.780517, 0.243327, 0.299523], [0.785929, 0.247056, 0.295477], [0.791293, 0.250856, 0.291390], [0.796607, 0.254728, 0.287264], [0.801871, 0.258674, 0.283099], [0.807082, 0.262692, 0.278898], [0.812239, 0.266786, 0.274661], [0.817341, 0.270954, 0.270390], [0.822386, 0.275197, 0.266085], [0.827372, 0.279517, 0.261750], [0.832299, 0.283913, 0.257383], [0.837165, 0.288385, 0.252988], [0.841969, 0.292933, 0.248564], [0.846709, 0.297559, 0.244113], [0.851384, 0.302260, 0.239636], [0.855992, 0.307038, 0.235133], [0.860533, 0.311892, 0.230606], [0.865006, 0.316822, 0.226055], [0.869409, 0.321827, 0.221482], [0.873741, 0.326906, 0.216886], [0.878001, 0.332060, 0.212268], [0.882188, 0.337287, 0.207628], [0.886302, 0.342586, 0.202968], [0.890341, 0.347957, 0.198286], [0.894305, 0.353399, 0.193584], [0.898192, 0.358911, 0.188860], [0.902003, 0.364492, 0.184116], [0.905735, 0.370140, 0.179350], [0.909390, 0.375856, 0.174563], [0.912966, 0.381636, 0.169755], [0.916462, 0.387481, 0.164924], [0.919879, 0.393389, 0.160070], [0.923215, 0.399359, 0.155193], [0.926470, 0.405389, 0.150292], [0.929644, 0.411479, 0.145367], [0.932737, 0.417627, 0.140417], [0.935747, 0.423831, 0.135440], [0.938675, 0.430091, 0.130438], [0.941521, 0.436405, 0.125409], [0.944285, 0.442772, 0.120354], [0.946965, 0.449191, 0.115272], [0.949562, 0.455660, 0.110164], [0.952075, 0.462178, 0.105031], [0.954506, 0.468744, 0.099874], [0.956852, 0.475356, 0.094695], [0.959114, 0.482014, 0.089499], [0.961293, 0.488716, 0.084289], [0.963387, 0.495462, 0.079073], [0.965397, 0.502249, 0.073859], [0.967322, 0.509078, 0.068659], [0.969163, 0.515946, 0.063488], [0.970919, 0.522853, 0.058367], [0.972590, 0.529798, 0.053324], [0.974176, 0.536780, 0.048392], [0.975677, 0.543798, 0.043618], [0.977092, 0.550850, 0.039050], [0.978422, 0.557937, 0.034931], [0.979666, 0.565057, 0.031409], [0.980824, 0.572209, 0.028508], [0.981895, 0.579392, 0.026250], [0.982881, 0.586606, 0.024661], [0.983779, 0.593849, 0.023770], [0.984591, 0.601122, 0.023606], [0.985315, 0.608422, 0.024202], [0.985952, 0.615750, 0.025592], [0.986502, 0.623105, 0.027814], [0.986964, 0.630485, 0.030908], [0.987337, 0.637890, 0.034916], [0.987622, 0.645320, 0.039886], [0.987819, 0.652773, 0.045581], [0.987926, 0.660250, 0.051750], [0.987945, 0.667748, 0.058329], [0.987874, 0.675267, 0.065257], [0.987714, 0.682807, 0.072489], [0.987464, 0.690366, 0.079990], [0.987124, 0.697944, 0.087731], [0.986694, 0.705540, 0.095694], [0.986175, 0.713153, 0.103863], [0.985566, 0.720782, 0.112229], [0.984865, 0.728427, 0.120785], [0.984075, 0.736087, 0.129527], [0.983196, 0.743758, 0.138453], [0.982228, 0.751442, 0.147565], [0.981173, 0.759135, 0.156863], [0.980032, 0.766837, 0.166353], [0.978806, 0.774545, 0.176037], [0.977497, 0.782258, 0.185923], [0.976108, 0.789974, 0.196018], [0.974638, 0.797692, 0.206332], [0.973088, 0.805409, 0.216877], [0.971468, 0.813122, 0.227658], [0.969783, 0.820825, 0.238686], [0.968041, 0.828515, 0.249972], [0.966243, 0.836191, 0.261534], [0.964394, 0.843848, 0.273391], [0.962517, 0.851476, 0.285546], [0.960626, 0.859069, 0.298010], [0.958720, 0.866624, 0.310820], [0.956834, 0.874129, 0.323974], [0.954997, 0.881569, 0.337475], [0.953215, 0.888942, 0.351369], [0.951546, 0.896226, 0.365627], [0.950018, 0.903409, 0.380271], [0.948683, 0.910473, 0.395289], [0.947594, 0.917399, 0.410665], [0.946809, 0.924168, 0.426373], [0.946392, 0.930761, 0.442367], [0.946403, 0.937159, 0.458592], [0.946903, 0.943348, 0.474970], [0.947937, 0.949318, 0.491426], [0.949545, 0.955063, 0.507860], [0.951740, 0.960587, 0.524203], [0.954529, 0.965896, 0.540361], [0.957896, 0.971003, 0.556275], [0.961812, 0.975924, 0.571925], [0.966249, 0.980678, 0.587206], [0.971162, 0.985282, 0.602154], [0.976511, 0.989753, 0.616760], [0.982257, 0.994109, 0.631017], [0.988362, 0.998364, 0.644924]]));
    JS9.checkNew(new JS9.Colormap("plasma", [[0.050383, 0.029803, 0.527975], [0.063536, 0.028426, 0.533124], [0.075353, 0.027206, 0.538007], [0.086222, 0.026125, 0.542658], [0.096379, 0.025165, 0.547103], [0.105980, 0.024309, 0.551368], [0.115124, 0.023556, 0.555468], [0.123903, 0.022878, 0.559423], [0.132381, 0.022258, 0.563250], [0.140603, 0.021687, 0.566959], [0.148607, 0.021154, 0.570562], [0.156421, 0.020651, 0.574065], [0.164070, 0.020171, 0.577478], [0.171574, 0.019706, 0.580806], [0.178950, 0.019252, 0.584054], [0.186213, 0.018803, 0.587228], [0.193374, 0.018354, 0.590330], [0.200445, 0.017902, 0.593364], [0.207435, 0.017442, 0.596333], [0.214350, 0.016973, 0.599239], [0.221197, 0.016497, 0.602083], [0.227983, 0.016007, 0.604867], [0.234715, 0.015502, 0.607592], [0.241396, 0.014979, 0.610259], [0.248032, 0.014439, 0.612868], [0.254627, 0.013882, 0.615419], [0.261183, 0.013308, 0.617911], [0.267703, 0.012716, 0.620346], [0.274191, 0.012109, 0.622722], [0.280648, 0.011488, 0.625038], [0.287076, 0.010855, 0.627295], [0.293478, 0.010213, 0.629490], [0.299855, 0.009561, 0.631624], [0.306210, 0.008902, 0.633694], [0.312543, 0.008239, 0.635700], [0.318856, 0.007576, 0.637640], [0.325150, 0.006915, 0.639512], [0.331426, 0.006261, 0.641316], [0.337683, 0.005618, 0.643049], [0.343925, 0.004991, 0.644710], [0.350150, 0.004382, 0.646298], [0.356359, 0.003798, 0.647810], [0.362553, 0.003243, 0.649245], [0.368733, 0.002724, 0.650601], [0.374897, 0.002245, 0.651876], [0.381047, 0.001814, 0.653068], [0.387183, 0.001434, 0.654177], [0.393304, 0.001114, 0.655199], [0.399411, 0.000859, 0.656133], [0.405503, 0.000678, 0.656977], [0.411580, 0.000577, 0.657730], [0.417642, 0.000564, 0.658390], [0.423689, 0.000646, 0.658956], [0.429719, 0.000831, 0.659425], [0.435734, 0.001127, 0.659797], [0.441732, 0.001540, 0.660069], [0.447714, 0.002080, 0.660240], [0.453677, 0.002755, 0.660310], [0.459623, 0.003574, 0.660277], [0.465550, 0.004545, 0.660139], [0.471457, 0.005678, 0.659897], [0.477344, 0.006980, 0.659549], [0.483210, 0.008460, 0.659095], [0.489055, 0.010127, 0.658534], [0.494877, 0.011990, 0.657865], [0.500678, 0.014055, 0.657088], [0.506454, 0.016333, 0.656202], [0.512206, 0.018833, 0.655209], [0.517933, 0.021563, 0.654109], [0.523633, 0.024532, 0.652901], [0.529306, 0.027747, 0.651586], [0.534952, 0.031217, 0.650165], [0.540570, 0.034950, 0.648640], [0.546157, 0.038954, 0.647010], [0.551715, 0.043136, 0.645277], [0.557243, 0.047331, 0.643443], [0.562738, 0.051545, 0.641509], [0.568201, 0.055778, 0.639477], [0.573632, 0.060028, 0.637349], [0.579029, 0.064296, 0.635126], [0.584391, 0.068579, 0.632812], [0.589719, 0.072878, 0.630408], [0.595011, 0.077190, 0.627917], [0.600266, 0.081516, 0.625342], [0.605485, 0.085854, 0.622686], [0.610667, 0.090204, 0.619951], [0.615812, 0.094564, 0.617140], [0.620919, 0.098934, 0.614257], [0.625987, 0.103312, 0.611305], [0.631017, 0.107699, 0.608287], [0.636008, 0.112092, 0.605205], [0.640959, 0.116492, 0.602065], [0.645872, 0.120898, 0.598867], [0.650746, 0.125309, 0.595617], [0.655580, 0.129725, 0.592317], [0.660374, 0.134144, 0.588971], [0.665129, 0.138566, 0.585582], [0.669845, 0.142992, 0.582154], [0.674522, 0.147419, 0.578688], [0.679160, 0.151848, 0.575189], [0.683758, 0.156278, 0.571660], [0.688318, 0.160709, 0.568103], [0.692840, 0.165141, 0.564522], [0.697324, 0.169573, 0.560919], [0.701769, 0.174005, 0.557296], [0.706178, 0.178437, 0.553657], [0.710549, 0.182868, 0.550004], [0.714883, 0.187299, 0.546338], [0.719181, 0.191729, 0.542663], [0.723444, 0.196158, 0.538981], [0.727670, 0.200586, 0.535293], [0.731862, 0.205013, 0.531601], [0.736019, 0.209439, 0.527908], [0.740143, 0.213864, 0.524216], [0.744232, 0.218288, 0.520524], [0.748289, 0.222711, 0.516834], [0.752312, 0.227133, 0.513149], [0.756304, 0.231555, 0.509468], [0.760264, 0.235976, 0.505794], [0.764193, 0.240396, 0.502126], [0.768090, 0.244817, 0.498465], [0.771958, 0.249237, 0.494813], [0.775796, 0.253658, 0.491171], [0.779604, 0.258078, 0.487539], [0.783383, 0.262500, 0.483918], [0.787133, 0.266922, 0.480307], [0.790855, 0.271345, 0.476706], [0.794549, 0.275770, 0.473117], [0.798216, 0.280197, 0.469538], [0.801855, 0.284626, 0.465971], [0.805467, 0.289057, 0.462415], [0.809052, 0.293491, 0.458870], [0.812612, 0.297928, 0.455338], [0.816144, 0.302368, 0.451816], [0.819651, 0.306812, 0.448306], [0.823132, 0.311261, 0.444806], [0.826588, 0.315714, 0.441316], [0.830018, 0.320172, 0.437836], [0.833422, 0.324635, 0.434366], [0.836801, 0.329105, 0.430905], [0.840155, 0.333580, 0.427455], [0.843484, 0.338062, 0.424013], [0.846788, 0.342551, 0.420579], [0.850066, 0.347048, 0.417153], [0.853319, 0.351553, 0.413734], [0.856547, 0.356066, 0.410322], [0.859750, 0.360588, 0.406917], [0.862927, 0.365119, 0.403519], [0.866078, 0.369660, 0.400126], [0.869203, 0.374212, 0.396738], [0.872303, 0.378774, 0.393355], [0.875376, 0.383347, 0.389976], [0.878423, 0.387932, 0.386600], [0.881443, 0.392529, 0.383229], [0.884436, 0.397139, 0.379860], [0.887402, 0.401762, 0.376494], [0.890340, 0.406398, 0.373130], [0.893250, 0.411048, 0.369768], [0.896131, 0.415712, 0.366407], [0.898984, 0.420392, 0.363047], [0.901807, 0.425087, 0.359688], [0.904601, 0.429797, 0.356329], [0.907365, 0.434524, 0.352970], [0.910098, 0.439268, 0.349610], [0.912800, 0.444029, 0.346251], [0.915471, 0.448807, 0.342890], [0.918109, 0.453603, 0.339529], [0.920714, 0.458417, 0.336166], [0.923287, 0.463251, 0.332801], [0.925825, 0.468103, 0.329435], [0.928329, 0.472975, 0.326067], [0.930798, 0.477867, 0.322697], [0.933232, 0.482780, 0.319325], [0.935630, 0.487712, 0.315952], [0.937990, 0.492667, 0.312575], [0.940313, 0.497642, 0.309197], [0.942598, 0.502639, 0.305816], [0.944844, 0.507658, 0.302433], [0.947051, 0.512699, 0.299049], [0.949217, 0.517763, 0.295662], [0.951344, 0.522850, 0.292275], [0.953428, 0.527960, 0.288883], [0.955470, 0.533093, 0.285490], [0.957469, 0.538250, 0.282096], [0.959424, 0.543431, 0.278701], [0.961336, 0.548636, 0.275305], [0.963203, 0.553865, 0.271909], [0.965024, 0.559118, 0.268513], [0.966798, 0.564396, 0.265118], [0.968526, 0.569700, 0.261721], [0.970205, 0.575028, 0.258325], [0.971835, 0.580382, 0.254931], [0.973416, 0.585761, 0.251540], [0.974947, 0.591165, 0.248151], [0.976428, 0.596595, 0.244767], [0.977856, 0.602051, 0.241387], [0.979233, 0.607532, 0.238013], [0.980556, 0.613039, 0.234646], [0.981826, 0.618572, 0.231287], [0.983041, 0.624131, 0.227937], [0.984199, 0.629718, 0.224595], [0.985301, 0.635330, 0.221265], [0.986345, 0.640969, 0.217948], [0.987332, 0.646633, 0.214648], [0.988260, 0.652325, 0.211364], [0.989128, 0.658043, 0.208100], [0.989935, 0.663787, 0.204859], [0.990681, 0.669558, 0.201642], [0.991365, 0.675355, 0.198453], [0.991985, 0.681179, 0.195295], [0.992541, 0.687030, 0.192170], [0.993032, 0.692907, 0.189084], [0.993456, 0.698810, 0.186041], [0.993814, 0.704741, 0.183043], [0.994103, 0.710698, 0.180097], [0.994324, 0.716681, 0.177208], [0.994474, 0.722691, 0.174381], [0.994553, 0.728728, 0.171622], [0.994561, 0.734791, 0.168938], [0.994495, 0.740880, 0.166335], [0.994355, 0.746995, 0.163821], [0.994141, 0.753137, 0.161404], [0.993851, 0.759304, 0.159092], [0.993482, 0.765499, 0.156891], [0.993033, 0.771720, 0.154808], [0.992505, 0.777967, 0.152855], [0.991897, 0.784239, 0.151042], [0.991209, 0.790537, 0.149377], [0.990439, 0.796859, 0.147870], [0.989587, 0.803205, 0.146529], [0.988648, 0.809579, 0.145357], [0.987621, 0.815978, 0.144363], [0.986509, 0.822401, 0.143557], [0.985314, 0.828846, 0.142945], [0.984031, 0.835315, 0.142528], [0.982653, 0.841812, 0.142303], [0.981190, 0.848329, 0.142279], [0.979644, 0.854866, 0.142453], [0.977995, 0.861432, 0.142808], [0.976265, 0.868016, 0.143351], [0.974443, 0.874622, 0.144061], [0.972530, 0.881250, 0.144923], [0.970533, 0.887896, 0.145919], [0.968443, 0.894564, 0.147014], [0.966271, 0.901249, 0.148180], [0.964021, 0.907950, 0.149370], [0.961681, 0.914672, 0.150520], [0.959276, 0.921407, 0.151566], [0.956808, 0.928152, 0.152409], [0.954287, 0.934908, 0.152921], [0.951726, 0.941671, 0.152925], [0.949151, 0.948435, 0.152178], [0.946602, 0.955190, 0.150328], [0.944152, 0.961916, 0.146861], [0.941896, 0.968590, 0.140956], [0.940015, 0.975158, 0.131326]]));
    // end of matlibplot colormaps
    JS9.checkNew(new JS9.Colormap("i8",
	[[0,0,0], [0,1,0], [0,0,1], [0,1,1],
	[1,0,0], [1,1,0], [1,0,1], [1,1,1]]));
    JS9.checkNew(new JS9.Colormap("aips0",
[[0.196,0.196,0.196], [0.475,0,0.608], [0,0,0.785], [0.373,0.655,0.925], [0,0.596,0], [0,0.965,0], [1,1,0], [1,0.694,0], [1,0,0]]));
    JS9.checkNew(new JS9.Colormap("sls",
[[0, 0, 0], [0.043442, 0, 0.052883], [0.086883, 0, 0.105767], [0.130325, 0, 0.158650], [0.173767, 0, 0.211533], [0.217208, 0, 0.264417], [0.260650, 0, 0.317300], [0.304092, 0, 0.370183], [0.347533, 0, 0.423067], [0.390975, 0, 0.475950], [0.434417, 0, 0.528833], [0.477858, 0, 0.581717], [0.521300, 0, 0.634600], [0.506742, 0, 0.640217], [0.492183, 0, 0.645833], [0.477625, 0, 0.651450], [0.463067, 0, 0.657067], [0.448508, 0, 0.662683], [0.433950, 0, 0.668300], [0.419392, 0, 0.673917], [0.404833, 0, 0.679533], [0.390275, 0, 0.685150], [0.375717, 0, 0.690767], [0.361158, 0, 0.696383], [0.346600, 0, 0.7020], [0.317717, 0, 0.712192], [0.288833, 0, 0.722383], [0.259950, 0, 0.732575], [0.231067, 0, 0.742767], [0.202183, 0, 0.752958], [0.173300, 0, 0.763150], [0.144417, 0, 0.773342], [0.115533, 0, 0.783533], [0.086650, 0, 0.793725], [0.057767, 0, 0.803917], [0.028883, 0, 0.814108], [0, 0, 0.824300], [0, 0.019817, 0.838942], [0, 0.039633, 0.853583], [0, 0.059450, 0.868225], [0, 0.079267, 0.882867], [0, 0.099083, 0.897508], [0, 0.118900, 0.912150], [0, 0.138717, 0.926792], [0, 0.158533, 0.941433], [0, 0.178350, 0.956075], [0, 0.198167, 0.970717], [0, 0.217983, 0.985358], [0, 0.237800, 1], [0, 0.268533, 1], [0, 0.299267, 1], [0, 0.330, 1], [0, 0.360733, 1], [0, 0.391467, 1], [0, 0.422200, 1], [0, 0.452933, 1], [0, 0.483667, 1], [0, 0.514400, 1], [0, 0.545133, 1], [0, 0.575867, 1], [0, 0.606600, 1], [0, 0.631733, 0.975300], [0, 0.656867, 0.950600], [0, 0.682000, 0.925900], [0, 0.707133, 0.901200], [0, 0.732267, 0.876500], [0, 0.757400, 0.851800], [0, 0.782533, 0.827100], [0, 0.807667, 0.802400], [0, 0.832800, 0.777700], [0, 0.857933, 0.7530], [0, 0.883067, 0.728300], [0, 0.908200, 0.703600], [0, 0.901908, 0.676675], [0, 0.895617, 0.649750], [0, 0.889325, 0.622825], [0, 0.883033, 0.595900], [0, 0.876742, 0.568975], [0, 0.870450, 0.542050], [0, 0.864158, 0.515125], [0, 0.857867, 0.488200], [0, 0.851575, 0.461275], [0, 0.845283, 0.434350], [0, 0.838992, 0.407425], [0, 0.832700, 0.380500], [0, 0.832308, 0.354858], [0, 0.831917, 0.329217], [0, 0.831525, 0.303575], [0, 0.831133, 0.277933], [0, 0.830742, 0.252292], [0, 0.830350, 0.226650], [0, 0.829958, 0.201008], [0, 0.829567, 0.175367], [0, 0.829175, 0.149725], [0, 0.828783, 0.124083], [0, 0.828392, 0.098442], [0, 0.828000, 0.072800], [0.033167, 0.834167, 0.066733], [0.066333, 0.840333, 0.060667], [0.099500, 0.846500, 0.054600], [0.132667, 0.852667, 0.048533], [0.165833, 0.858833, 0.042467], [0.199000, 0.865000, 0.036400], [0.232167, 0.871167, 0.030333], [0.265333, 0.877333, 0.024267], [0.298500, 0.883500, 0.018200], [0.331667, 0.889667, 0.012133], [0.364833, 0.895833, 0.006067], [0.398000, 0.902000, 0], [0.430950, 0.902000, 0], [0.463900, 0.902000, 0], [0.496850, 0.902000, 0], [0.529800, 0.902000, 0], [0.562750, 0.902000, 0], [0.595700, 0.902000, 0], [0.628650, 0.902000, 0], [0.661600, 0.902000, 0], [0.694550, 0.902000, 0], [0.727500, 0.902000, 0], [0.760450, 0.902000, 0], [0.793400, 0.902000, 0], [0.810617, 0.897133, 0.003983], [0.827833, 0.892267, 0.007967], [0.845050, 0.887400, 0.011950], [0.862267, 0.882533, 0.015933], [0.879483, 0.877667, 0.019917], [0.896700, 0.872800, 0.023900], [0.913917, 0.867933, 0.027883], [0.931133, 0.863067, 0.031867], [0.948350, 0.858200, 0.035850], [0.965567, 0.853333, 0.039833], [0.982783, 0.848467, 0.043817], [1, 0.843600, 0.047800], [0.995725, 0.824892, 0.051600], [0.991450, 0.806183, 0.055400], [0.987175, 0.787475, 0.059200], [0.982900, 0.768767, 0.063000], [0.978625, 0.750058, 0.066800], [0.974350, 0.731350, 0.070600], [0.970075, 0.712642, 0.074400], [0.965800, 0.693933, 0.078200], [0.961525, 0.675225, 0.082000], [0.957250, 0.656517, 0.085800], [0.952975, 0.637808, 0.089600], [0.948700, 0.619100, 0.093400], [0.952975, 0.600408, 0.085617], [0.957250, 0.581717, 0.077833], [0.961525, 0.563025, 0.070050], [0.965800, 0.544333, 0.062267], [0.970075, 0.525642, 0.054483], [0.974350, 0.506950, 0.046700], [0.978625, 0.488258, 0.038917], [0.982900, 0.469567, 0.031133], [0.987175, 0.450875, 0.023350], [0.991450, 0.432183, 0.015567], [0.995725, 0.413492, 0.007783], [1, 0.394800, 0], [0.998342, 0.361900, 0], [0.996683, 0.329000, 0], [0.995025, 0.296100, 0], [0.993367, 0.263200, 0], [0.991708, 0.230300, 0], [0.990050, 0.197400, 0], [0.988392, 0.164500, 0], [0.986733, 0.131600, 0], [0.985075, 0.098700, 0], [0.983417, 0.065800, 0], [0.981758, 0.032900, 0], [0.980100, 0, 0], [0.955925, 0, 0], [0.931750, 0, 0], [0.907575, 0, 0], [0.883400, 0, 0], [0.859225, 0, 0], [0.835050, 0, 0], [0.810875, 0, 0], [0.786700, 0, 0], [0.762525, 0, 0], [0.738350, 0, 0], [0.714175, 0, 0], [0.690, 0, 0], [0.715833, 0.083333, 0.083333], [0.741667, 0.166667, 0.166667], [0.767500, 0.250, 0.250000], [0.793333, 0.333333, 0.333333], [0.819167, 0.416667, 0.416667], [0.845000, 0.500, 0.500000], [0.870833, 0.583333, 0.583333], [0.896667, 0.666667, 0.666667], [0.922500, 0.750, 0.750000], [0.948333, 0.833333, 0.833333], [0.974167, 0.916667, 0.916667], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]]));
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
	    // convert to RGB
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
		res = JS9.Pix2WCS(parseFloat(args[0]), parseFloat(args[1]),
				 {display: im});
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
	name: "resize",
	help: "get/set display size for current image",
	get: function(){
	    var display;
	    var im = this.image;
	    if( im ){
		display = im.display;
		return sprintf("%s %s", display.width, display.height);
	    }
	},
	set: function(args){
	    var display;
	    var im = this.image;
	    var width, height;
	    if( im && args.length ){
		display = im.display;
		width = parseInt(args[0], 10);
		if( args.length > 1 ){
		    height = parseInt(args[1], 10);
		} else {
		    height = width;
		}
		display.resize(width, height);
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
		res = JS9.WCS2Pix(parseFloat(args[0]), parseFloat(args[1]),
				 {display: im});
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
	var code = e.which || e.keyCode;
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
		    if( (got === im) || (got === im.display) ){
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
JS9.mkPublic("DisplayExtension", "displayExtension");
JS9.mkPublic("DisplaySlice", "displaySlice");
JS9.mkPublic("BlendImage", "blendImage");
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
JS9.mkPublic("SavePNG", "savePNG");
JS9.mkPublic("SaveJPEG", "saveJPEG");
JS9.mkPublic("SaveFITS", "saveFITS");
JS9.mkPublic("RunAnalysis", "runAnalysis");
JS9.mkPublic("DisplayMessage", "displayMessage");
JS9.mkPublic("RawDataLayer", "rawDataLayer");
JS9.mkPublic("GaussBlurData", "gaussBlurData");
JS9.mkPublic("ImarithData", "imarithData");
JS9.mkPublic("ReprojectData", "reprojectData");
JS9.mkPublic("ShiftData", "shiftData");
JS9.mkPublic("FilterRGBImage", "filterRGBImage");
JS9.mkPublic("MoveToDisplay", "moveToDisplay");
JS9.mkPublic("SaveSession", "saveSession");

// lookup an image
JS9.mkPublic("LookupImage", function(id){
    var obj = JS9.parsePublicArgs(arguments);
    return JS9.lookupImage(obj.argv[0], obj.display);
});

// add a colormap to JS9
JS9.mkPublic("AddColormap", function(colormap, a1, a2, a3){
    var reader, cobj;
    var obj = JS9.parsePublicArgs(arguments);
    var obj2cmap = function(xobj){
	if( xobj.vertices ){
	    JS9.AddColormap(xobj.name,
			    xobj.vertices[0],
			    xobj.vertices[1],
			    xobj.vertices[2]);
	} else if( xobj.colors ){
	    JS9.AddColormap(xobj.name, xobj.colors);
	} else {
	    JS9.error("invalid colormap object for JS9.AddColormap()");
	}
    };
    // blob passed by OpenColormapMenu()
    if( obj.argv[0] instanceof Blob ){
	// file reader object
	reader = new FileReader();
	reader.onload = function(ev){
	    try{ cobj = JSON.parse(ev.target.result); }
	    catch(e){ JS9.error("can't parse json colormap", e); }
	    obj2cmap(cobj);
	};
	reader.readAsText(obj.argv[0]);
    } else if( typeof obj.argv[0]  === "object" ){
	obj2cmap(obj.argv[0]);
    } else {
	switch(obj.argv.length){
	case 1:
	    // json formatted string
	    try{ cobj = JSON.parse(colormap); }
	    catch(e){ JS9.error("can't parse JSON colormap", e); }
	    obj2cmap(cobj);
	    break;
	case 2:
	    JS9.checkNew(new JS9.Colormap(colormap, a1));
	    break;
	case 4:
	    JS9.checkNew(new JS9.Colormap(colormap, a1, a2, a3));
	    break;
	default:
	    JS9.error("AddColormap() requires a colormap name and 1 or 3 args");
	    break;
	}
    }
});

// set/clear valpos flag
JS9.mkPublic("SetValPos", function(mode){
    var got = null;
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	mode = obj.argv[0];
	got = im.params.valpos;
	im.params.valpos = mode;
    }
    return got;
});

// display in-page FITS images and png files
JS9.mkPublic("Load", function(file, opts){
    var i, im, ext, disp, display, func, blob, bytes, topts, tfile;
    var obj = JS9.parsePublicArgs(arguments);
    file = obj.argv[0];
    opts = obj.argv[1];
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
	    im = JS9.lookupImage(file.name, opts.display);
	    if( im ){
		// display image, 2D graphics, etc.
		im.displayImage("display", opts);
		im.refreshLayers();
		im.clearMessage();
		JS9.waiting(false);
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
	    try{ JS9.fits.handleFITSFile(file, topts, JS9.NewFitsImage); }
	    catch(e){ JS9.error("can't process FITS file", e); }
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
	    try{ JS9.fits.handleFITSFile(blob, topts, JS9.NewFitsImage); }
	    catch(e){ JS9.error("can't process FITS file", e); }
	} else {
	    JS9.error("no FITS module available to process this memory FITS");
	}
	return;
    }
    // if this file is already loaded, just redisplay
    im = JS9.lookupImage(file, opts.display);
    if( im ){
	// display image, 2D graphics, etc.
	im.displayImage("all", opts);
	im.clearMessage();
	JS9.waiting(false);
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
		JS9.error("no JS9 helper available to convert image: " + file);
	    }
	} else {
	    if( opts.display ){
		disp = JS9.lookupDisplay(opts.display);
		if( disp ){
		    disp = disp.divjq[0];
		}
	    }
	    JS9.waiting(true, disp);
	    // remove extension so we can find the file itself
	    tfile = file.replace(/\[.*\]/, "");
	    JS9.fetchURL(file, tfile, opts, JS9.NewFitsImage);
	}
    }
});

// save regions to disk
JS9.mkPublic("SaveRegions", function(fname, which){
    var file, wh, im;
    var obj = JS9.parsePublicArgs(arguments);
    file = obj.argv[0];
    wh = obj.argv[1];
    im = JS9.getImage(obj.display);
    if( im ){
	return im.saveRegions(file, wh);
    }
    return fname;
});

// load a DS9/funtools regions file
JS9.mkPublic("LoadRegions", function(file, opts){
    var display, reader;
    var obj = JS9.parsePublicArgs(arguments);
    file = obj.argv[0];
    opts = obj.argv[1] || {};
    // sanity check
    if( !file ){
	JS9.error("JS9.LoadRegions: no file specified for regions load");
    }
    // check for display
    if( obj.display ){
	display = obj.display;
    } else if( opts.display ){
	display = opts.display;
    } else {
	if( JS9.displays.length > 0 ){
	    display = JS9.displays[0].id;
	} else {
	    display = JS9.DEFID;
	}
    }
    // convert blob to string
    if( typeof file === "object" ){
	// file reader object
	reader = new FileReader();
	reader.onload = function(ev){
	    JS9.AddRegions(ev.target.result, opts, {display: display});
	};
	reader.readAsText(file);
    } else if( typeof file === "string" ){
	opts.responseType = "text";
	opts.display = display;
	JS9.fetchURL(null, file, opts, JS9.AddRegions);
    } else {
	// oops!
	JS9.error("unknown file type for LoadRegions: " + typeof file);
    }
});

// create a new instance of JS9 in a window (light or new)
// nb: unlike JS9.Load, this requires the opts param
JS9.mkPublic("LoadWindow", function(file, opts, type, html, winopts){
    var id, did, head, body, win, doc;
    var idbase = (type || "") + "win";
    var title;
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
        html = html || sprintf("<hr class='hline0'><div class='JS9Menubar' id='%sMenubar'></div><div class='JS9' id='%s'></div><div style='margin-top: 2px;'><div class='JS9Colorbar' id='%sColorbar'></div></div>", id, id, id);
        winopts = winopts || JS9.lightOpts[JS9.LIGHTWIN].imageWin;
	// nice title
	title = sprintf("JS9 Display"+JS9.IDFMT, id);
        // create the light window
        JS9.lightWin(did, "inline", html, title, winopts);
        // create the new JS9 Display
        JS9.checkNew(new JS9.Display(id));
	// add to list of displays
	JS9.helper.send("addDisplay", {"display": id});
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

// load a link using back-end server as a proxy
JS9.mkPublic("LoadProxy", function(url, opts){
    var f, disp;
    var obj = JS9.parsePublicArgs(arguments);
    url = obj.argv[0];
    opts = obj.argv[1];
    if( !JS9.globalOpts.loadProxy ){
	JS9.error("proxy load not available for this server");
    }
    if( !JS9.globalOpts.workDir ){
	JS9.error("proxy load requires a temp workDir this server");
    }
    if( !url ){
	JS9.error("no url specified for proxy load");
    }
    url = url.trim();
    if( url.match(/dropbox\.com/) ){
	// http://stackoverflow.com/questions/20757891/cross-origin-image-load-from-cross-enabled-site-is-denied
	url = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
	// https://blogs.dropbox.com/developers/2013/08/programmatically-download-content-from-share-links/
	url = url.replace('?dl=0', '') + '?raw=1';
    } else if( url.match(/drive\.google\.com/) ){
	url=url.replace(/\/file\/d\/(\w+)\/\w+\?usp=sharing/,
			'/uc?export=download&id=$1');
    }
    if( obj.display ){
	disp = JS9.lookupDisplay(obj.display);
	if( disp ){
	    disp = disp.divjq[0];
	}
    }
    JS9.waiting(true, disp);
    JS9.Send('loadproxy', {'cmd': 'js9Xeq loadproxy ' + url}, function(r){
        var robj;
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
	if( robj.stderr ){
	    JS9.error(robj.stderr);
	} else if( robj.stdout ){
	    opts = opts || {};
	    if( opts.fits2png === undefined ){
		opts.fits2png = false;
	    }
	    f = robj.stdout.trim().replace(/\/\.\//, "/");
	    // proxy file
	    opts.proxyFile = f;
	    // relative path: add install dir prefix
	    if( f.charAt(0) !== "/" ){
		f = JS9.InstallDir(f);
	    }
	    // load new file
	    JS9.Load(f, opts, {display: obj.display});
	} else {
	    JS9.error('internal error: no return from load proxy command');
	}
    });
});

// save array of files to preload or preload immediately,
// depending on the state of processing
JS9.mkPublic("Preload", function(arg1){
    var i, j, mode, emsg="", dobj=null;
    var alen=arguments.length;
    var obj = JS9.parsePublicArgs(arguments);
    arg1 = obj.argv[0];
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
JS9.mkPublic("RefreshImage", function(fits, opts){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    var retry = function(hdu){
	JS9.Image.prototype.refreshImage.call(im, hdu, opts);
    };
    fits = obj.argv[0];
    opts = obj.argv[1] || {};
    if( im ){
	if( fits instanceof Blob ){
	    if( JS9.fits.handleFITSFile ){
		// cleanup previous FITS file support, if necessary
		// do this before we handle the new FITS file, or else
		// we end up with a memory leak in the emscripten heap!
		if( !opts.rawid && JS9.fits.cleanupFITSFile &&
		     im.raw.hdu && im.raw.hdu.fits ){
		    JS9.fits.cleanupFITSFile(im.raw.hdu.fits, true);
		}
		try{ JS9.fits.handleFITSFile(fits, JS9.fits.options, retry); }
		catch(e){ JS9.error("can't refresh FITS file", e); }
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
	id = obj.argv[0];
	if( !id || (im.id0 === id) ){
	    return im.status.load;
	}
	return "other";
    }
    return "none";
});

// bring up the file dialog box and open selected FITS file(s)
JS9.mkPublic("OpenFileMenu", function(){
    var obj = JS9.parsePublicArgs(arguments);
    var display = JS9.lookupDisplay(obj.display);
    if( display ){
	$('#openLocalFile-' + display.id).click();
    }
});

// bring up the file dialog box and open selected region files(s)
JS9.mkPublic("OpenRegionsMenu", function(){
    var obj = JS9.parsePublicArgs(arguments);
    var display = JS9.lookupDisplay(obj.display);
    if( display ){
	$('#openLocalRegions-' + display.id).click();
    }
});

// bring up the file dialog box and load selected session files(s)
JS9.mkPublic("OpenSessionMenu", function(){
    var obj = JS9.parsePublicArgs(arguments);
    var display = JS9.lookupDisplay(obj.display);
    if( display ){
	$('#openLocalSession-' + display.id).click();
    }
});

// bring up the file dialog box and load selected colormap file(s)
JS9.mkPublic("OpenColormapMenu", function(){
    var obj = JS9.parsePublicArgs(arguments);
    var display = JS9.lookupDisplay(obj.display);
    if( display ){
	$('#openLocalColormap-' + display.id).click();
    }
});

// save a colormap to disk
JS9.mkPublic("SaveColormap", function(fname){
    var im, cobj, s, blob;
    var obj = JS9.parsePublicArgs(arguments);
    if( window.hasOwnProperty("saveAs") ){
	im = JS9.getImage(obj.display);
	if( im ){
	    fname = obj.argv[0] || "js9.cmap";
	    // delete type property before saving
	    cobj = $.extend(true, {}, im.cmapObj);
	    delete cobj.type;
	    // convert to json
	    s = JSON.stringify(cobj);
	    // then convert json to blob
	    blob = new Blob([s], {type: 'text/plain'});
	    // save to disk
	    saveAs(blob, fname);
	}
    } else {
	JS9.error("no saveAs function available to save colormap");
    }
    return fname;
});

// display the named plugin
JS9.mkPublic("DisplayPlugin", function(name){
    var i, plugin, pname, lcname;
    var obj = JS9.parsePublicArgs(arguments);
    var display = JS9.lookupDisplay(obj.display);
    if( display && obj.argv[0] ){
	name = obj.argv[0];
	lcname = name.toLowerCase();
	for(i=0; i<JS9.plugins.length; i++){
	    plugin = JS9.plugins[i];
	    pname = plugin.name;
	    if( (pname === name) ||
		(pname.toLowerCase().substr(-lcname.length) === lcname) ){
		display.displayPlugin(plugin);
		return;
	    }
	}
	JS9.error("can't find plugin: " + name);
    }
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

// return the image data and auxiliary info for the current image
JS9.mkPublic("GetImageData", function(dflag){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    // return data and auxiliary info
    if( im ){
	dflag = obj.argv[0];
	return im.getImageData(dflag);
    }
    return null;
});

// return the image data and aux info for all images loaded into this display
JS9.mkPublic("GetDisplayData", function(dflag){
    var i, id, im;
    var imarr = [];
    var obj = JS9.parsePublicArgs(arguments);
    id = obj.display || JS9.displays[0].id;
    dflag = obj.argv[0];
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( im.display.id === id ){
	    imarr.push(im.getImageData(dflag));
	}
    }
    return imarr;
});

// return the FITS header as a string
JS9.mkPublic("GetFITSHeader", function(flag){
    var s = "";
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im && im.raw ){
	flag = obj.argv[0];
	s = JS9.raw2FITS(im.raw, flag);
    }
    return s;
});

// turn on and off blending, redisplaying image
JS9.mkPublic("BlendDisplay", function(mode){
    var i, im;
    var imarr = [];
    var obj = JS9.parsePublicArgs(arguments);
    var id = obj.display || JS9.DEFID;
    var disp = JS9.lookupDisplay(id);
    if( !disp ){
	JS9.error("no JS9 display found: " + id);
    }
    if( (mode === undefined) || (mode === "mode") ){
	return disp.blendMode;
    }
    if( mode === "list" ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im.display.id === id) && im.blend.active ){
		imarr.push(im.id);
	    }
	}
	return imarr;
    }
    // it's true or false
    disp.blendMode = !!mode;
    if( disp.image ){
	disp.image.displayImage();
    }
    return disp.blendMode;
});

// load auxiliary file, if available
// s is the aux file type
JS9.mkPublic("LoadAuxFile", function(file, func){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	file = obj.argv[0];
	func = obj.argv[1];
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
    el = obj.argv[0];
    aname = obj.argv[1];
    func = obj.argv[2];
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
	JS9.error("no JS9 helper available");
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
	ix = obj.argv[0];
	iy = obj.argv[1];
	if( !JS9.isNumber(ix) || !JS9.isNumber(iy) ){
	    JS9.error("invalid input for PixToWCS");
	}
	if( im.raw.wcs > 0 ){
	    s = JS9.pix2wcs(im.raw.wcs, ix, iy).trim();
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
	ra = obj.argv[0];
	dec = obj.argv[1];
	if( !JS9.isNumber(ra) || !JS9.isNumber(dec) ){
	    JS9.error("invalid input for WCSToPix");
	}
	if( im.raw.wcs > 0 ){
	    arr = JS9.wcs2pix(im.raw.wcs, ra, dec).trim().split(/ +/);
	    x = parseFloat(arr[0]);
	    y = parseFloat(arr[1]);
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
    var opts = JS9.lightOpts.dhtml.textWin;
    var type = "iframe";
    var help;
    // sanity check
    if( !hname ){
	return;
    }
    title = hname.split("/").reverse()[0];
    id = "help_" + JS9.uniqueID();
    // look for known help file
    help = JS9.helpOpts[hname];
    if( help ){
	// help file
	url = JS9.InstallDir(help.type + "/" + help.url);
	JS9.lightWin(id, type, url, help.title || title, opts);
    } else {
	// its a random url
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
	layer = obj.argv[0];
	opts = obj.argv[1];
	return im.display.newShapeLayer(layer, opts);
    }
    return null;
});

// add a region
JS9.mkPublic("AddRegions", function(region, opts){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	region = obj.argv[0];
	opts = obj.argv[1];
	if( !region ){
	    JS9.error("no region specified for AddRegions");
	}
	opts = obj.argv[1];
	return im.addShapes("regions", region, opts);
    }
    return null;
});

// remove one or more regions
JS9.mkPublic("RemoveRegions", function(region){
    var obj = JS9.parsePublicArgs(arguments);
    var im = JS9.getImage(obj.display);
    if( im ){
	region = obj.argv[0];
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
	region = obj.argv[0];
	if( !region ){
	    JS9.error("no region specified for GetRegions");
	}
	opts = obj.argv[1];
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

// change the size of a display
JS9.mkPublic("ResizeDisplay", function(){
    var got;
    var obj = JS9.parsePublicArgs(arguments);
    var display = JS9.lookupDisplay(obj.display);
    if( !display ){
	JS9.error("invalid display for resize");
    }
    got = JS9.Display.prototype.resize.apply(display, obj.argv);
    if( got === display ){
	got = "OK";
    }
    return got;
});

// load a session file
JS9.mkPublic("LoadSession", function(file, opts){
    var display, reader, disp;
    var obj = JS9.parsePublicArgs(arguments);
    file = obj.argv[0];
    opts = obj.argv[1] || {};
    // sanity check
    if( !file ){
	JS9.error("JS9.LoadSession: no file specified for load");
    }
    // check for display
    if( obj.display ){
	display = obj.display;
    } else if( opts.display ){
	display = opts.display;
    } else {
	if( JS9.displays.length > 0 ){
	    display = JS9.displays[0].id;
	} else {
	    display = JS9.DEFID;
	}
    }
    disp = JS9.lookupDisplay(display);
    opts.display = disp.id;
    // convert blob to json object
    if( typeof file === "object" ){
	// file reader object
	reader = new FileReader();
	reader.onload = function(ev){
	    var jobj = JSON.parse(ev.target.result);
	    disp.loadSession(jobj, opts);
	};
	reader.readAsText(file);
    } else if( typeof file === "string" ){
	opts.responseType = "text";
	opts.display = disp.id;
	JS9.fetchURL(null, file, opts, function(jstr, opts){
	    var jobj = JSON.parse(jstr);
            disp.loadSession(jobj, opts);
	});
    } else {
	// oops!
	JS9.error("unknown file type for LoadSession: " + typeof file);
    }
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
