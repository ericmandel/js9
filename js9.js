/*
 *
 * JS9: astronomical image display everywhere (December 10, 2012)
 *
 * Principals: Eric Mandel, Alexey Vikhlinin
 * Organization: Harvard Smithsonian Center for Astrophysics, Cambridge MA
 * Contact: saord@cfa.harvard.edu
 *
 * Copyright (c) 2012 - 2019 Smithsonian Astrophysical Observatory
 *
 */

/*global JS9Prefs, JS9Inline, $, jQuery, fabric, io, CanvasRenderingContext2D, sprintf, Blob, ArrayBuffer, Uint8Array, Uint16Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, DataView, FileReader, Fitsy, Astroem, dhtmlwindow, saveAs, Spinner, ResizeSensor, Jupyter, gaussBlur, ImageFilters, Plotly, require */

"use strict";

// ensure Emscripten's Module object is available so we can pass properties
// (e.g. wasmBinary) in js9prefs.js and during JS9.init()
// (use var to add to global scope because it's how Emscripten does it)
var Module;
if( typeof Module !== "object" ){ Module = {}; }

// generate and expose JS9 module
// (use var to add to global scope for backward compatibility with previous ES5)
var JS9 = (function(){

// module header
const JS9 = {};
JS9.NAME = "JS9";		// The name of this namespace
JS9.VERSION = "2.5";		// The version of this namespace
JS9.COPYRIGHT = "Copyright (c) 2012-2019 Smithsonian Institution";

// internal defaults (not usually changed by users)
JS9.DEFID = "JS9";		// default JS9 display id
JS9.WIDTH = 512;	        // width of js9 canvas
JS9.HEIGHT = 512;		// height of js9 canvas
JS9.ANON = "Anonymous";		// name to use for images with no name
JS9.PREFSFILE = "js9Prefs.json";// prefs file to load
JS9.WORKERFILE = "js9worker.js";// js9 web worker file to load
JS9.ZINDEX = 0;			// z-index of image canvas: on bottom of js9
JS9.SHAPEZINDEX = 4;		// base z-index of shape layers layers
JS9.MESSZINDEX = 80;		// z-index of messages: above graphics
JS9.BTNZINDEX =  90;		// z-index of buttons on top of plugin canvases
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
JS9.DBLCLICK = 300;		// millisec for double-click
JS9.TIMEOUT = 250;              // millisec before assuming light window is up
JS9.SPINOUT = 250;		// millisec before assuming spinner is up
JS9.SUPERMENU = /^SUPERMENU_/;  // base of supermenu id
JS9.RESIZEDIST = 20;		// size of rectangle defining resize handle
JS9.RESIZEFUDGE = 5;            // fudge for webkit resize problems
JS9.RAWID0 = "raw0";		// default raw id
JS9.RAWIDX = "alt";		// default "alternate" raw id
JS9.IDFMT = "  (%s)";           // format for light window id
JS9.MINZOOM = 0.125;		// min zoom using scroll wheel
JS9.MAXZOOM = 32.0;		// max zoom using scroll wheel
JS9.ADDZOOM = 0.1;		// add/subtract amount per mouse wheel click
JS9.CHROMEFILEWARNING = true;	// whether to alert chrome users about file URI
JS9.CLIPBOARDERROR = "the local clipboard (which only holds data copied from within JS9) does not contain any content. Were you trying to paste something copied outside JS9?";
JS9.CLIPBOARDERROR2 = "the local clipboard (which only holds data copied from within JS9) does not contain any regions";
JS9.URLEXP = /^(https?|ftp):\/\//; // url to determine a web page

// https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
JS9.TOUCHSUPPORTED = ( window.hasOwnProperty("ontouchstart") ||
		      (navigator.maxTouchPoints > 0) ||
		      (navigator.msMaxTouchPoints > 0));
// modified from:
// http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
JS9.BROWSER = (function(){
  const P= navigator.platform;
  const N= navigator.appName, ua= navigator.userAgent;
  const tem= ua.match(/version\/([.\d]+)/i);
  let M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
  if(M && tem !== null){ M[2]= tem[1]; }
  M= M? [M[1], M[2], P]: [N, navigator.appVersion,'-?', P];
  M.push(/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(ua));
  return M;
}());
// convenience to allow plugins to deal with HiDPI ratio blurring
// http://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
JS9.PIXEL_RATIO = (function(){
    const ctx = document.createElement("canvas").getContext("2d"),
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
    requireHelper: false,       // throw error if helper is not available?
    allinoneHelper: false,      // allow allinone to use helper?
    requireFits2Fits: false,    // throw error if fits2fits can't be run?
    quietReturn: false,         // should API return empty string or "OK"?
    useWasm: true,		// use WebAssembly if available?
    allowFileWasm: false,       // allow file:// to use wasm?
    winType: "light",		// plugin window: "light" or "new"
    rgb: {active: false,	// RGB mode
	  rim: null,
	  gim: null,
	  bim: null},
    defcolor: "#00FF00",	// graphics color when all else fails
    pngisfits: true,		// are PNGs really PNG representation files?
    fits2fits: "never",		// convert to repfile? always|never|size>x Mb
    fits2png: false,		// convert FITS to PNG rep files? true|false
    localAccess: true,		// access files locally, when available?
    prependJS9Dir: true,        // prepend $JS9_DIR to relative fitsFile paths?
    dataDir: null,              // path to FITS data (def: use incoming path)
    alerts: true,		// set to false to turn off alerts
    valposTarget: null,         // target element for valpos updates
    valposWidth: "medium",      // small, medium, large
    internalValPos: true,	// a fancy info plugin can turns this off
    internalContrastBias: true,	// a fancy colorbar plugin can turns this off
    containContrastBias: false, // contrast/bias only when mouse is in display?
    wcsCrosshair: false,	// enable wcs crosshair matching?
    regionsToClipboard: true,	// copy all region changes to pseudo-clipboard?
    magnifierRegions: true,	// display regions in magnifier?
    pannerDirections: true,	// display direction vectors in panner?
    htimeout:  10000,		// connection timeout for the helper connect
    lhtimeout: 10000,		// connection timeout for local helper connect
    ehtimeout: 500,		// connection timeout for Electron connect
    ehretries: 20,		// connection retries Electron connect
    xtimeout: 600000,		// connection timeout for fetch data requests
    extlist: "EVENTS STDEVT",	// list of binary table extensions
    imopts: "IMOPTS",           // basename of FITS param containing json opts
    imcmap: "IMCMAP",           // basename of FITS param containing cmaps
    table: {xdim: 4096, ydim: 4096, bin: 1},// image section size to extract from table
    image: {xdim: 4096, ydim: 4096, bin: 1},// image section size (unlimited=0)
    reproj: {xdim: 4096, ydim: 4096}, // max image size we can reproject
    reprojSwitches: "",         // Montage reproject switches
    binMode: "s",               // "s" (sum) or "a" (avg) pixels when binning
    clearImageMemory: "heap",   // rm vfile: always|never|auto|noExt|noCube|size>x Mb heap=>free heap
    helperProtocol: location.protocol, // http: or https:
    reloadRefresh: false,       // reload an image will refresh (or redisplay)?
    reloadRefreshReg: true,     // reloading regions file removes previous?
    panWithinDisplay: false,	// keep panned image within the display?
    svgBorder: true,		// border around the display when saving to svg?
    unremoveReg: 100,           // how many removed regions to save
    resetEmptyShapeId: false,	// reset nshape counter if all shapes removed?
    maxMemory: 1000000000,	// max heap memory to allocate for a fits image
    corsURL: "params/loadcors.html",       // location of param html file
    proxyURL: "params/loadproxy.html",     // location of param html file
    loadProxy: false,           // do we allow proxy load requests to server?
    imsectionURL: "params/imsection.html", // location of param html file
    postMessage: false,         // allow communication through iframes?
    localStorage: true,         // use localStorage for session params?
    waitType: "spinner",        // "spinner" or "mouse"
    spinColor: "#FF0000",       // color of spinner
    spinOpacity: 0.35,          // opacity of spinner
    resize: true,		// allow resize of display?
    resizeHandle: true,		// add resize handle to display?
    resizeRedisplay: true,	// redisplay image while resizing?
    cloneNewDisplay: true,      // clone size of display, when possible?
    logoDisplay: false,         // show JS9 logo on each display?
    lightWinClose: "ask",	// ask, close, move images when closing lightwin
    regionDisplay: "lightwin",	// "lightwin" or "display"
    regionConfigSize: "medium", // "small", "medium"
    refreshDragDrop: true,	// refresh on drag/drag and open file?
    reduceMosaic: "js9",        // "js9" or "shrink" ("js9" seems to be faster)
    internalRegcnts: true,      // make internal regcnts analysis available?
    reduceRegcnts: true,        // reduce image when doing counts in regions?
    plot3d: {cube:"*:*:all", mode:"avg", areaunits:"pixels", color: "green"}, // plot3d options: avg/sum, pixels/arcsecs
    imexamLineHeight: 1,        // "height" of line region section
    copyWcsPosFormat: "$ra $dec $sys", // format for copy wcs pos to clipboard
    floatPrecision: 6,          // precision for floatToString()
    mouseActions: ["display value/position", "change contrast/bias", "pan the image"],// 0,1,2 mousepress
    touchActions: ["display value/position", "change contrast/bias", "pan the image"],// 1,2,3 fingers
    keyboardActions: {
	b: "toggle selected region: source/background",
	c: "toggle crosshair",
	d: "send selected region to back",
	e: "toggle selected region: include/exclude",
	"M-e": "edit selected region",
	i: "refresh image",
	I: "display full image",
	"M-i": "display selected cutouts",
	"M-k": "toggle keyboard actions plugin",
	l: "toggle active shape layers",
	"M-l": "new JS9 light window",
        m: "pan to mouse position",
	"M-m": "toggle mouse/touch plugin",
	"M-o": "open local file",
        P: "paste regions from local clipboard",
        p: "paste regions to current position",
	u: "undo remove of region(s)",
	"M-,": "toggle preferences plugin",
	"M-p": "toggle preferences plugin",
	r: "copy selected region to clipboard",
	R: "copy all regions to clipboard",
	s: "select region",
	S: "select all regions",
	"M-s": "toggle shape layers plugin",
        "/": "copy wcs position to clipboard",
        "?": "copy value and position to clipboard",
	"0": "reset zoom",
	"=": "zoom in",
	"+": "zoom in",
	"-": "zoom out",
	"^": "raise region layer to top",
	">": "display next image",
	"<": "display previous image",
	"delete": "remove selected region",
	"leftArrow": "move region/position left",
	"upArrow": "move region/position up",
	"rightArrow": "move region/position right",
	"downArrow": "move region/position down"
    }, // keyboard actions
    mousetouchZoom: false,	// use mouse wheel, pinch to zoom?
    metaClickPan: true,         // metaKey + click pans to mouse position?
    toolbarTooltips: false,     // display tooltips on toolbar?
    centerDivs: ["JS9Menubar"], // divs which take part in JS9.Display.center()
    resizeDivs: ["JS9Menubar", "JS9Colorbar", "JS9Toolbar"], // divs which take part in JS9.Display.resize()
    pinchWait: 8,		// number of events to wait before testing pinch
    pinchThresh: 6,		// threshold for pinch test
    xeqPlugins: true,		// execute plugin callbacks?
    extendedPlugins: true,	// enable extended plugin support?
    intensivePlugins: false,	// enable intensive plugin support?
    dynamicSelect: "click",     // dynamic plugins: "click", "move", or false
    dynamicHighlight: true,     // highlight dynamic selection
    corsProxy:   "https://js9.si.edu/cgi-bin/CORS-proxy.cgi",   // CORS proxy
    simbadProxy: "https://js9.si.edu/cgi-bin/simbad-proxy.cgi", // simbad proxy
    catalogs:   {ras: ["RA", "_RAJ2000", "RAJ2000"],  // cols to search for ..
		 decs: ["Dec", "_DEJ2000", "DEJ2000"],// when loading catalogs
		 shape: "circle",                     // object shape
		 color: "yellow",                     // object color
		 width: 7,                            // box object width
		 height: 7,                           // box object height
		 radius: 3.5,                         // circle object radius
		 r1: 5.0,                             // ellipse object r1
		 r2: 3.5,                             // ellipse object r2
		 wcssys: "ICRS",                      // wcs system
		 skip: "#\n",                         // skip # and blank lines
		 save: true,                          // save cat cols in shapes
		 tooltip: "$xreg.data.ra $xreg.data.dec"}, // tooltip format
    topColormaps: ["grey", "heat", "cool", "viridis", "magma", "sls", "red", "green", "blue"], // toplevel colormaps
    infoBox: ["file", "object", "wcsfov", "wcscen", "wcspos", "impos", "physpos", "value", "regions", "progress"],
    infoBoxResize: true,                              // is size based on wcs?
    menuBar: ["file", "edit", "view", "zoom", "scale", "color", "region", "wcs", "analysis", "help"],
    menubarStyle: "classic",                          // mac or classic
    userMenus: false,                                 // add user menus?
    userMenuDivider: "&nbsp;&nbsp;&nbsp;",            // divide before user menu
    imagesFileSubmenu: 5,        // how many images trigger a submenu?
    toolBar: ["annulus", "box", "circle", "ellipse", "line", "polygon", "text", "linear", "log", "zoom+", "zoom-", "zoom1"],
    syncOps: ["colormap","contrastbias","pan","regions","scale","wcs","zoom"],                                   // which ops are sync'ed?
    syncReciprocate: true,       // default value for reciprocal sync'ing
    hiddenPluginDivs: [],        // which static plugin divs start hidden
    separate: {layout: "auto", leftMargin: 10, topMargin: 10}, // separate a display
    imageTemplates: ".fits,.fts,.png,.jpg,.jpeg,.fz,.ftz", // templates for local images
    wcsUnits: {FK4:"sexagesimal", FK5:"sexagesimal", ICRS:"sexagesimal",
	       galactic:"degrees", ecliptic:"degrees", linear:"degrees",
	       physical:"pixels", image:"pixels"}, // def units for wcs sys
    regionTemplates: ".reg",         // templates for local region file input
    sessionTemplates: ".ses,.js9ses",// templates for local session file input
    colormapTemplates: ".cmap",      // templates for local colormap file input
    catalogTemplates: ".cat,.tab",   // templates for local catalog file input
    localTemplates: ".fits,.fts",    // templates for local file access
    controlsMatchRegion: false,      // true, false, "corner" or "border"
    internalColorPicker: true,       // use HTML5 color picker, if available?
    newWindowWidth:  530,	     // width of LoadWindow("new")
    newWindowHeight: 625,	     // height of LoadWindow("new")
    debug: 0		             // debug level
};

// desktop (i.e. Electron.js) defaults
// always wrap access in if( window.isElectron ){}
JS9.desktopOpts = {
    currentPath: true,              // files relative to current dir?
    sessionPath: true               // session files relative to session file?
};

// image param defaults
JS9.imageOpts = {
    inherit: false,			// inherit props from previous image?
    contrast: 1.0,			// default color contrast
    bias: 0.5,				// default color bias
    invert: false,			// default colormap invert
    exp: 1000,				// default exp value for scaling
    colormap: "grey",			// default color map
    scale: "linear",			// default scale algorithm
    scaleclipping: "dataminmax",	// "dataminmax", "zscale", or "user" (when scalemin, scalemax is supplied)
    scalemin: Number.NaN,               // default scale min is undefined
    scalemax: Number.NaN,               // default scale max is undefined
    flip: "none",                       // default flip state
    zscalecontrast: 0.25,		// default from ds9
    zscalesamples: 600,			// default from ds9
    zscaleline: 120,			// default from ds9
    wcssys: "native",			// default WCS sys
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
    zooms: 6,				// how many zooms in each direction?
    topZooms: 2,			// how many zooms are at top level?
    nancolor: "#000000",		// 6-digit #hex color for NaN values
    wcsalign: true,			// align image using wcs after reproj?
    rotationMode: "relative",		// default: relative or absolute?
    crosshair: false,			// enable crosshair?
    disable: [],			// list of disabled core services
    ltvbug:  true,			// add 0.5/ltm to image LTV values?
    listonchange: false,		// whether to list after a reg change
    whichonchange: "selected"		// which to list ("all" or "selected")
};

// allows regions opts (in Regions.opts) to be overridden via js9prefs.js
JS9.regionOpts = {};
// allows catalog opts (in Catalogs.opts) to be overridden via js9prefs.js
JS9.catalogOpts = {};
// allows crosshair opts (in Crosshair.opts) to be overridden via js9prefs.js
JS9.crosshairOpts = {};
// allows grid opts (in Grid.opts) to be overridden via js9prefs.js
JS9.gridOpts = {};
// allows emscripten opts (in Module) to be overridden via js9prefs.js
JS9.emscriptenOpts = {};

// defaults for blending
JS9.blendOpts = {
    active: true,
    mode: "screen",
    opacity: 1
};

// defaults for analysis (macro expansion)
JS9.analOpts = {
    // if this pattern is matched in stderr, throw a real error
    epattern: /^(ERROR:[^\n]*)\n/,
    // location of datapath's param html file
    dpathURL: "params/datapath.html",
    // location of filepath's param html file
    fpathURL: "params/filepath.html"
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
	// NB: dimensions are tied to .JS9Plot CSS params
	plotWin:  "width=830px,height=420px,center=1,resize=1,scrolling=1",
	dpathWin: "width=830px,height=175px,center=1,resize=1,scrolling=1",
	lcloseWin:"width=512px,height=190px,center=1,resize=1,scrolling=1",
	paramWin: "width=830px,height=235px,center=1,resize=1,scrolling=1",
	regWin0:  "width=600px,height=72px,center=1,resize=1,scrolling=1",
	regWin:   "width=600px,height=235px,center=1,resize=1,scrolling=1",
	imageWin: "width=512px,height=598px,center=1,resize=1,scrolling=1",
	lineWin:  "width=400px,height=60px,center=1,resize=1,scrolling=1"
    },
    lcloseURL: "params/lightclose.html"
};

// colors for text messages
JS9.textColorOpts = {
    regions: "#00FF00",
    info:    "#00FF00",
    inimage: "#000000"
};

// defaults for plot creation
JS9.plotOpts = {
    // generic options
    annotate: false,
    annotateColor: "#FF0000",
    color: "blue",
    // flot options
    zoomStack: {
	enabled: true
    },
    selection: {
	mode: "xy"
    },
    series: {
	clickable: true,
	hoverable: true,
        lines: { show: true },
        points: { show: false }
    },
    legend: {
	backgroundColor: null,
	backgroundOpacity: 0
    },
    // plotly options
    xaxis: {
	autorange: true
    },
    yaxis: {
	autorange: true
    }
};

// help pages
JS9.helpOpts = {
    user: {
	heading: "JS9Help",
	type: "help", url:"user.html",
	title: "User Manual"
    },
    install: {
	heading: "JS9Help",
	type: "help", url:"install.html",
	title: "Installing JS9"
    },
    webpage: {
	heading: "JS9Help",
	type: "help", url:"webpage.html",
	title: "Adding JS9 to a Web Page"
    },
    yourdata: {
	heading: "JS9Help",
	type: "help", url:"yourdata.html",
	title: "Adding Data to a Web Page"
    },
    localtasks: {
	heading: "JS9Help",
	type: "help", url:"localtasks.html",
	title: "Adding Local Analysis Tasks and Plugins"
    },
    helper: {
	heading: "JS9Help",
	type: "help", url:"helper.html",
	title: "Adding Server-side Analysis Tasks"
    },
    serverside: {
	heading: "JS9Help",
	type: "help", url:"serverside.html",
	title: "Server-side Analysis with JS9"
    },
    publicapi: {
	heading: "JS9Help",
	type: "help", url:"publicapi.html",
	title: "The JS9 Public API"
    },
    extmsg: {
	heading: "JS9Help",
	type: "help", url:"extmsg.html",
	title: "External Messaging"
    },
    desktop: {
	heading: "JS9Help",
	type: "help", url:"desktop.html",
	title: "JS9 on the Desktop"
    },
    python: {
	heading: "JS9Help",
	type: "help", url:"python.html",
	title: "JS9 with Python and Jupyter"
    },
    archives: {
	heading: "JS9Help",
	type: "help", url:"archives.html",
	title: "Accessing Data Archives"
    },
    preferences: {
	heading: "JS9Help",
	type: "help", url:"preferences.html",
	title: "Setting Site Preferences"
    },
    regions: {
	heading: "JS9Help",
	type: "help", url:"regions.html",
	title: "Regions Format"
    },
    changelog: {
	heading: "JS9Help",
	type: "help", url:"changelog.html",
	title: "ChangeLog"
    },
    repfile: {
	heading: "JS9Help",
	type: "help", url:"repfile.html",
	title: "Dealing with Large Files"
    },
    memory: {
	heading: "JS9Help",
	type: "help", url:"memory.html",
	title: "Dealing with Memory Limitations"
    },
    issues: {
	heading: "JS9Help",
	type: "help", url:"knownissues.html",
	title: "Known Issues"
    }
};

// containers for groups of JS9 objects
JS9.images = [];		// array of current images
JS9.displays = [];		// array of current display canvases
JS9.colormaps = [];		// array of current colormaps
JS9.commands = [];		// array of commands
JS9.plugins = [];		// array of defined plugins
JS9.preloads = [];		// array of images to preload
JS9.auxFiles = [];		// array of auxiliary files
JS9.supermenus = [];		// array containing supermenu instances
JS9.publics = {};		// object containing defined public API calls
JS9.helper = {};		// only one helper per page, please
JS9.fits = {};			// object holding FITS access routines
JS9.userOpts = {};		// object to hold localStorage opts
JS9.preloadwaiting = {};	// object of images currently being preloaded

// misc params
// list of scales in mkScaledCells
JS9.scales = ["linear", "log", "histeq", "power", "sqrt", "squared", "asinh", "sinh"];

// list of known wcs systems
JS9.wcssyss = ["FK4", "FK5", "ICRS", "galactic", "ecliptic", "native",
	       "image", "physical"];

// list of known wcs units
JS9.wcsunitss = ["degrees", "sexagesimal", "pixels"];

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
// chrome does not deal with ".gz" file templates, but other browsers do
if( JS9.BROWSER[0] !== "Chrome" ){
    JS9.globalOpts.imageTemplates += ",.gz";
}
// chrome has a more stringent memory limit than other browsers
// 1/20/2019
// unnecessary with the 32-bit float version of mProjectPP
// if( (JS9.BROWSER[0] === "Chrome") ){
//     JS9.globalOpts.reproj = {xdim: 3800, ydim: 3800};
// }
// wasm broken in ios 11.2.2, 11.2.5 and on, fixed in 11.3beta1 (1/22/2018)
// see: https://github.com/kripken/emscripten/issues/6042
if(  /iPad|iPhone|iPod/.test(navigator.platform) &&
     /11_2_(?:[2-9])/.test(navigator.userAgent)    ){
    JS9.globalOpts.useWasm = false;
}
// iOS has severe memory limits (05/2017)
// also force user to turn on crosshair, since it works with one finger
if( JS9.BROWSER[3] ){
    JS9.globalOpts.maxMemory = Math.min(JS9.globalOpts.maxMemory, 350000000);
    JS9.globalOpts.table.xdim = 2048;
    JS9.globalOpts.table.ydim = 2048;
    JS9.globalOpts.image.xdim = 2048;
    JS9.globalOpts.image.ydim = 2048;
    JS9.imageOpts.crosshair = false;
    JS9.globalOpts.reproj = {xdim: 2048, ydim: 2048};
}
// Jupyter doesn't seem to be able to load wasm (7/4/2018)
if( window.hasOwnProperty("Jupyter") ){
    JS9.globalOpts.useWasm = false;
}
// JS9 desktop app using Electron.js
if( window.isElectron ){
    // turn on wasm if Electron.js supports a recent version of Chromium
    if( JS9.BROWSER[0] === "Chrome" && parseFloat(JS9.BROWSER[1]) >= 66 ){
	JS9.globalOpts.allowFileWasm = true;
    }
    // Electron.js < v5.0.0 SEGVs when clicking colorpicker exit (1/26/2019)
    if( !window.electronVersion || parseInt(window.electronVersion, 10) < 5 ){
	JS9.globalOpts.internalColorPicker = false;
    }
    // do we have Node integrated? (same check as in Emscripten/src/shell.js)
    JS9.hasNode = typeof process === "object" && typeof require === "function";
    // mount point for local file system, based on hostname
    if( JS9.hasNode ){
	JS9.localMount = require("os").hostname() || "localAccess";
    }
    // if multiple instances are running, turn off localStorage
    if( window.multiElectron ){
	JS9.globalOpts.localStorage = false;
    }
}

// ---------------------------------------------------------------------
// JS9 Image object to manage images
// ---------------------------------------------------------------------

JS9.Image = function(file, params, func){
    let i, card, pars, nzoom, display, txeq;
    let localOpts = null;
    let nhist = 0;
    let ncomm = 0;
    // called with current image context
    const mkscale = (opts) => {
	// do zscale, if necessary
	opts = opts || {};
	if( JS9.isNull(opts.scaleclipping) ){
	    if( this.params.scaleclipping === "zscale" ){
		this.zscale(true);
	    } else if( this.params.scaleclipping === "zmax" ){
		this.zscale("zmax");
	    }
	} else {
	    if( opts.scaleclipping === "zscale" ){
		this.zscale(true);
	    } else if( opts.scaleclipping === "zmax" ){
		this.zscale("zmax");
	    }
	}
	if( JS9.notNull(opts.scalemin) ){
	    this.params.scalemin = opts.scalemin;
	}
	if( JS9.notNull(opts.scalemax) ){
	    this.params.scalemax = opts.scalemax;
	}
    };
    // called with current image context
    const finishUp = (func) => {
	let i, s, t, topts, tkey;
	const imopts = JS9.globalOpts.imopts;
	const imcmap = JS9.globalOpts.imcmap;
	const oalerts = JS9.globalOpts.alerts;
	// clear previous messages
	this.display.clearMessage();
	// add to list of images
	JS9.images.push(this);
	// notify the helper
	this.notifyHelper();
	// show regions layer
	this.showShapeLayer("regions", true, {local: true});
	// add regions, if necessary
	if( localOpts && localOpts.regions ){
	    this.addShapes("regions", localOpts.regions);
	}
	// no alerts while processing imopts or cmaps
	JS9.globalOpts.alerts = false;
	// looks for imcmap (json-formatted colormap object) in FITS header
	if( this.raw && this.raw.header && this.raw.header[imcmap] ){
	    // try to convert to object and set as image params
	    try{ topts = JSON.parse(this.raw.header[imcmap]); }
	    catch(e){ topts = null; }
	    if( topts ){
		try{ JS9.AddColormap(topts); }
		catch(e){ /* empty */ }
	    }
	}
	// look for multi-line colormap (imcmap1, imcmap2, ...) in FITS header
	tkey = `${imcmap}1`;
	if( this.raw && this.raw.header && this.raw.header[tkey] ){
	    // gather up the json string
	    for(i=1, s=""; i<100; i++){
		tkey = imcmap + String(i);
		if( this.raw.header[tkey] ){
		    s += this.raw.header[tkey];
		} else {
		    break;
		}
	    }
	    // try to convert to object and set as image params
	    if( s ){
		try{ topts = JSON.parse(s); }
		catch(e){ topts = null; }
		if( topts ){
		    try{ JS9.AddColormap(topts); }
		    catch(e){ /* empty */ }
		}
	    }
	}
	// looks for imopts (json-formatted image param object) in FITS header
	if( this.raw && this.raw.header && this.raw.header[imopts] ){
	    // try to convert to object and set as image params
	    try{ topts = JSON.parse(this.raw.header[imopts]); }
	    catch(e){ topts = null; }
	    if( topts ){
		try{ this.setParam("all", topts); }
		catch(e){ /* empty */ }
	    }
	}
	// look for multi-line imopts (imopts1, imopts2, ...) in FITS header
	tkey = `${imopts}1`;
	if( this.raw && this.raw.header && this.raw.header[tkey] ){
	    // gather up the json string
	    for(i=1, s=""; i<100; i++){
		tkey = imopts + String(i);
		if( this.raw.header[tkey] ){
		    s += this.raw.header[tkey];
		} else {
		    break;
		}
	    }
	    // try to convert to object and set as image params
	    if( s ){
		try{ topts = JSON.parse(s); }
		catch(e){ topts = null; }
		if( topts ){
		    try{ this.setParam("all", topts); }
		    catch(e){ /* empty */ }
		}
	    }
	}
	// restore alerts
	JS9.globalOpts.alerts = oalerts;
	// plugin callbacks
	this.xeqPlugins("image", "onimageload");
	// update shapes?
	if( this.updateshapes ){
	    this.updateShapes("regions", "all", "update");
	}
	// load is complete
	this.setStatus("load","complete");
	// done loading, reset wait cursor
	JS9.waiting(false);
	// everything else is done so call onload func, if necessary
	if( func ){
	    try{ JS9.xeqByName(func, window, this); }
	    catch(e){ JS9.error("in image onload callback", e, false); }
	}
	// might also have to call JS9.globalOpts.onpreload func
	s = this.proxyURL||this.file;
	t = s.replace(/\[.*\]/, "");
	if( JS9.preloadwaiting[s] || JS9.preloadwaiting[t]){
	    delete JS9.preloadwaiting[s];
	    delete JS9.preloadwaiting[t];
	    if( !Object.keys(JS9.preloadwaiting).length ){
		if( JS9.notNull(JS9.globalOpts.onpreload) ){
		    try{
			JS9.xeqByName(JS9.globalOpts.onpreload, window, this);
		    }
		    catch(e){
			JS9.error("in onpreload callback", e, false);
		    }
		}
	    }
	}
	// also load all of the image extensions?
	if( localOpts && localOpts.allext &&
	    this.hdus && this.hdus.length > 0 ){
	    this.displayExtension("all");
	}
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
    // save url, if available
    // it's an image
    this.type = "image";
    // set the display
    this.display = JS9.lookupDisplay(display);
    // initialize image params
    this.params = {};
    // region stack for saving removed regions
    this.regstack = [];
    // image-specific scratch space
    this.tmp = {};
    // xeq callback for region changes?
    this.params.xeqonchange = true;
    // copy image parameters
    this.params = $.extend(true, this.params, JS9.imageOpts, localOpts);
    // inherit properties, if necessary
    if( this.display.image ){
	this.params.inherit = this.display.image.params.inherit;
	if( this.params.inherit ){
	    this.params = $.extend(true,
				   this.params, this.display.image.params);
	}
    }
    // set the colormap object from colormap name (text string)
    // this.cmapObj = JS9.lookupColormap(this.params.colormap);
    // (turn off plugin call, since we are not fully loaded)
    txeq = JS9.globalOpts.xeqPlugins;
    JS9.globalOpts.xeqPlugins = false;
    this.setColormap(this.params.colormap);
    JS9.globalOpts.xeqPlugins = txeq;
    // do we display?
    this.displayMode = true;
    // initialize click state
    this.clickState = 0;
    // initialize click in region
    this.clickInRegion = false;
    this.clickInLayer = null;
    // no helper queried yet
    this.queried = false;
    // is this a proxy image?
    if( localOpts && localOpts.proxyFile ){
	this.proxyFile = localOpts.proxyFile;
    }
    if( localOpts && localOpts.proxyURL ){
	this.proxyURL = localOpts.proxyURL;
    }
    // was a "parent" FITS file specified?
    if( localOpts && localOpts.parentFile ){
	this.parentFile = localOpts.parentFile;
    }
    // was "parent" info specified?
    if( localOpts && localOpts.parent ){
	this.parent = localOpts.parent;
	// convert card string to header
	if( this.parent.cardstr && this.parent.ncard ){
	    this.parent.raw = {header: {}, history:[], comments: []};
	    for(i=0; i<this.parent.ncard; i++){
		card = this.parent.cardstr.slice(i*80, (i+1)*80);
		pars = JS9.cardpars(card);
		if( pars !== undefined ){
		    if( pars[0] === "HISTORY" ){
			this.parent.raw.header[`${pars[0]}__${nhist++}`] = pars[1];
		    } else if( pars[0] === "COMMENT" ){
			this.parent.raw.header[`${pars[0]}__${ncomm++}`] = pars[1];
		    } else {
			this.parent.raw.header[pars[0]] = pars[1];
		    }
		}
	    }
	    // initialize LCS for this parent header
	    this.parent.lcs = {};
	    JS9.Image.prototype.initLCS.call(this.parent,
					     this.parent.raw.header);
	}
    }
    // was an id specified?
    if( localOpts && localOpts.id ){
	this.id = localOpts.id;
    }
    // offsets into canvas to display
    this.ix = 0;
    this.iy = 0;
    // create the png object
    this.png = {};
    // image element to hold png file, from which array data is generated
    this.png.image = new Image();
    // init status object
    this.status = {};
    // RGB image
    this.rgb = {};
    // section parameters
    this.rgb.sect = {zoom: 1, ozoom: 1};
    // graphical layers
    this.layers = {};
    // current zindex for main layers
    this.zlayer = JS9.SHAPEZINDEX;
    // no logical coordinate systems
    this.lcs = {};
    // array of aux file pointers
    this.aux = {};
    // binning parameters
    this.binning = {bin: 1, obin: 1};
    // array to hold raw data as we create it (original raw data at index 0)
    this.raws = [];
    // initial blend mode
    this.blend = $.extend(true, {}, JS9.blendOpts);
    // temp flag determines if we should update shapes at end of this call
    this.updateshapes = false;
    // request for an empty image object ends here
    if( !file ){
	return;
    }
    // change the cursor to show the waiting status
    JS9.waiting(true, this.display);
    // file arg can be an object containing raw data or
    // a string containing a URL of a PNG image
    switch( typeof file ){
    case "object":
	// save source
	this.source = localOpts.source || "fits";
	// generate the raw data array from the hdu
	this.mkRawDataFromHDU(file,
			      $.extend({}, {file: file.filename}, localOpts));
	// set scaling params from opts
	mkscale(localOpts);
	// set up initial zoom
	if( this.params.zoom ){
	    nzoom = this.parseZoom(this.params.zoom);
	    this.rgb.sect.zoom = nzoom;
	    this.rgb.sect.ozoom = nzoom;
	}
	// set up initial section
	this.mkSection();
	// was a static RGB file specified?
	if( localOpts && localOpts.rgbFile ){
	    this.rgbFile = localOpts.rgbFile;
	    // callback to fire when static RGB image is loaded
	    $(this.png.image).on("load", () => {
		let ss;
		if( (this.png.image.width !== this.raw.width)   ||
		    (this.png.image.height !== this.raw.height) ){
		    ss = sprintf("rgb dims [%s,%s] don't match image [%s,%s]",
				this.png.image.width,
				this.png.image.height,
				this.raw.width,
				this.raw.height);
		    JS9.error(ss);
		}
		// store png data in an offscreen canvas
		this.mkOffScreenCanvas();
		// display image, 2D graphics, etc.
		this.displayImage("all", localOpts);
		// finish up
		finishUp(func);
	    }).on("error", () => {
		// done loading, reset wait cursor
		JS9.waiting(false);
		JS9.error(`could not load image: ${this.id}`);
	    });
	    // set src to download the display file
	    this.png.image.src = this.rgbFile;
	} else {
	    // display image, 2D graphics, etc.
	    this.displayImage("all", localOpts);
	    // finish up
	    finishUp(func);
	}
	break;
    case "string":
	// save source
	this.source = localOpts.source || "fits2png";
	// image or table
	this.imtab = "image";
	// downloaded image file, path relative to displayed Web page
	this.file = JS9.cleanPath(file);
	// take file but discard path (or scheme) up to slashes
	this.id0 = this.file.split("/").reverse()[0];
	// save id in case we have to change it for uniqueness
	this.id = JS9.getImageID(this.id0, this.display.id);
	// load status
	this.setStatus("load","loading");
	// callback to fire when image is loaded (do this before setting src)
	$(this.png.image).on("load", () => {
	    // populate the image data array from RGB values
	    this.mkOffScreenCanvas();
	    // populate the raw image data array from RGB values
	    this.mkRawDataFromPNG();
	    // set up initial zoom
	    if( this.params.zoom ){
		nzoom = this.parseZoom(this.params.zoom);
		this.rgb.sect.zoom = nzoom;
		this.rgb.sect.ozoom = nzoom;
	    }
	    // set scaling params from opts
	    mkscale(localOpts);
	    // set up initial section
	    this.mkSection();
	    // display image, 2D graphics, etc.
	    this.displayImage("all", localOpts);
	    // finish up
	    finishUp(func);
	    // debugging
	    if( JS9.DEBUG ){
		JS9.log("JS9 image: %s dims(%d,%d) min/max(%d,%d)",
			this.file, this.raw.width, this.raw.height,
			this.raw.dmin, this.raw.dmax);
	    }
	}).on("error", () => {
	    // done loading, reset wait cursor
	    JS9.waiting(false);
	    JS9.error(`could not load image: ${this.id}`);
	});
	// set src to download the png and eventually display the image data
	this.png.image.src = file;
	break;
    default:
	JS9.error(`unknown specification type for Load: ${typeof file}`);
    }
};

// return the image data in a relatively standard format
JS9.Image.prototype.getImageData = function(dflag){
    let data = null;
    const {xdim, ydim} = this.fileDimensions();
    const atob64 = (a) => {
	let i;
	let s = '';
	const bytes = new Uint8Array(a.buffer);
	const len = bytes.byteLength;
	for(i=0; i<len; i++){
            s += String.fromCharCode(bytes[i]);
	}
	return window.btoa(s);
    };
    // return data and auxiliary info
    if( dflag ){
	// return an array for IPC, since python mangles the typed array
	if( dflag === "array" ){
	    data = Array.from(this.raw.data);
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
	    bin: this.binning.bin,
	    header: this.raw.header,
	    hdus: this.hdus,
	    dwidth: this.display.width,
	    dheight: this.display.height,
	    fwidth: xdim,
	    fheight: ydim,
	    data: data
	   };
};

// undisplay the image, release resources
JS9.Image.prototype.closeImage = function(opts){
    let i, j, tim, key, raw, carr;
    let iscurrent = false;
    const ilen= JS9.images.length;
    // this is either the dynamcially selected display or the current display
    const seldisplay = JS9.Dysel.getDisplayOr(this.display);
    // opts is optional
    opts = opts || {};
    // opts can be json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse closeImage opts: ${opts}`, e); }
    }
    // if this image is the wcs reference image for another image, clear it
    for(i=0; i<ilen; i++){
	if( JS9.images[i].wcsim === this ){
	    JS9.images[i].wcsim = null;
	}
    }
    // look for the image in the image list, and remove it
    for(i=0; i<ilen; i++){
	if( this === JS9.images[i] ){
	    tim = JS9.images[i];
	    // is this the currently displayed image?
	    if( tim === tim.display.image ){
		iscurrent = i+1;
	    }
	    // clear display if this is the currently displayed image
	    if( iscurrent ){
		// clear unless specifically asked not to
		if( opts.clear !== false ){
		    tim.display.clearMessage();
		    tim.display.context.clear();
		}
		// clear all layers
		for( key in tim.layers ){
		    if( tim.layers.hasOwnProperty(key) ){
			// clear the shape layer if its in the main display,
			//  and non-main layers if this image is selected
			if( tim.layers[key].dlayer.dtype === "main" ||
			    tim.display === seldisplay ){
			    tim.showShapeLayer(key, false, {local: true});
			}
		    }
		}
	    }
	    // plugin callbacks
	    tim.xeqPlugins("image", "onimageclose");
	    // after callbacks, we can unset the image from the display
	    if( iscurrent ){
		// clear image from display
		tim.display.image = null;
	    }
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
	    for(j=0; j<tim.raws.length; j++){
		raw = tim.raws[j];
		if( raw.hdu && raw.hdu.fits ){
		    carr = JS9.lookupVfile(raw.hdu.fits.vfile);
		    if( carr.length <= 1 ){
			JS9.cleanupFITSFile(raw, true);
		    }
		}
		// free wcs info
		if( raw.altwcs ){
		    this.freeWCS(raw);
		}
	    }
	    // remove proxy image from server, if necessary
	    tim.removeProxyFile();
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
	iscurrent -= 2;
	for(i=iscurrent; i>=0; i--){
	    tim = JS9.images[i];
	    if( this.display === tim.display ){
		// display image, 2D graphics, etc.
		tim.displayImage("all");
		tim.refreshLayers();
		// signal we're done
		iscurrent = JS9.images.length;
		break;
	    }
	}
	for(i=JS9.images.length-1; i>iscurrent; i--){
	    tim = JS9.images[i];
	    if( this.display === tim.display ){
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
	// this.offscreen.context.mozImageSmoothingEnabled = false;
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
JS9.Image.prototype.initLCS = function(iheader){
    let rrot, frot;
    const arr = [[0,0,0], [0,0,0], [0,0,0]];
    // header usually is raw header
    const header = iheader || this.raw.header;
    const cx = header.CRPIX1 || 1;
    const cy = header.CRPIX2 || 1;
    // screen rotation angle is reversed from FITS convention
    const a = -(header.CROTA2||0) * Math.PI / 180.0;
    const sina = Math.sin(a);
    const cosa = Math.cos(a);
    // seed rotation matrix and its inverse, if necessary
    if( a ){
	frot = [[0,0,0], [0,0,0], [0,0,0]];
	frot[0][0] = cosa;
	frot[0][1] = -sina;
	frot[0][2] = 0;
	frot[1][0] = sina;
	frot[1][1] = cosa;
	frot[1][2] = 0;
	rrot = JS9.invertMatrix3(frot);
	if( !rrot ){
	    frot = null;
	}
    }
    // physical coords
    arr[0][0] = header.LTM1_1 || 1.0;
    arr[1][0] = header.LTM2_1 || 0.0;
    arr[0][1] = header.LTM1_2 || 0.0;
    arr[1][1] = header.LTM2_2 || 1.0;
    arr[2][0] = header.LTV1   || 0.0;
    arr[2][1] = header.LTV2   || 0.0;
    if( this.imtab === "image" && this.params.ltvbug ){
	// There seems to be a tiny misalignment between wcs->image and
	// physical->image when ltv is involved. No idea why, but the fix is:
	if( header.LTV1 !== undefined && arr[0][0] < 1 ){
	    arr[2][0] += arr[0][0] * 0.5;
	}
	if( header.LTV2 !== undefined && arr[1][1] < 1 ){
	    arr[2][1] += arr[1][1] * 0.5;
	}
    }
    this.lcs.physical = {forward: $.extend(true, [], arr),
			 reverse: JS9.invertMatrix3(arr)};
    if( this.lcs.physical.reverse ){
	if( frot ){
	    this.lcs.physical.frot = $.extend(true, [], frot);
	    this.lcs.physical.rrot = $.extend(true, [], rrot);
	    // zero-index center
	    this.lcs.physical.cx = cx - arr[2][0] - 1;
	    this.lcs.physical.cy = cy - arr[2][1] - 1;
	}
    } else {
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
			reverse: JS9.invertMatrix3(arr)};
    if( this.lcs.detector.reverse ){
	if( frot ){
	    this.lcs.detector.frot = $.extend(true, [], frot);
	    this.lcs.detector.rrot = $.extend(true, [], rrot);
	    // zero-index center
	    this.lcs.detector.cx = cx - arr[2][0] - 1;
	    this.lcs.detector.cy = cy - arr[2][1] - 1;
	}
    } else {
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
			  reverse: JS9.invertMatrix3(arr)};
    if( this.lcs.amplifier.reverse ){
	if( frot ){
	    this.lcs.amplifier.frot = $.extend(true, [], frot);
	    this.lcs.amplifier.rrot = $.extend(true, [], rrot);
	    // zero-index center
	    this.lcs.amplifier.cx = cx - arr[2][0] - 1;
	    this.lcs.amplifier.cy = cy - arr[2][1] - 1;
	}
    } else {
	delete this.lcs.amplifier;
    }
    // reset lcs to image, if necessary
    if( this.params && !this.lcs[this.params.lcs] ){
	this.params.lcs = "image";
    }
    // set current, if not already done
    if( this.params && !this.params.wcssys0 ){
	this.setWCSSys("physical");
	this.params.wcssys0 = this.params.lcs;
    }
    // save original physical
    if( this.lcs.physical && !this.lcs.ophysical ){
	this.lcs.ophysical = $.extend(true, {}, this.lcs.physical);
    }
    // allow chaining
    return this;
};

// unpack IMG data and convert to JS9 image data
JS9.Image.prototype.mkRawDataFromIMG = function(img){
    let i, h, w, ibuf, x, y, v;
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
    // create a raw array to hold the reconstituted data
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
    // init WCS, if possible
    this.initWCS();
    // init the logical coordinate system, if possible
    this.initLCS();
    // plugin callbacks
    this.xeqPlugins("image", "onrawdata");
    // allow chaining
    return this;
};

// unpack PNG data and convert to image data
JS9.Image.prototype.mkRawDataFromPNG = function(){
    let i, s, idx, offscreen, dlen, mode, tval, getfunc, littleEndian;
    let card, pars, clen, realpng, hstr;
    let nhist = 0;
    let ncomm = 0;
    const hstrs = [];
    // memory array of 8 bytes
    const abuf = new ArrayBuffer(8);
    // we will transfer unsigned bytes from the png file into the mem array
    const u = new Uint8Array(abuf);
    // we will use the DataView api to access these bytes as typed data
    // (including possible endian conversion)
    const dv = new DataView(abuf);
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
    catch(e){ JS9.error(`can't read FITS header from PNG file: ${hstr}`, e); }
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
	    if( pars !== undefined ){
		if( pars[0] === "HISTORY" ){
		    this.raw.header[`${pars[0]}__${nhist++}`] = pars[1];
		} else if( pars[0] === "COMMENT" ){
		    this.raw.header[`${pars[0]}__${ncomm++}`] = pars[1];
		} else {
		    this.raw.header[pars[0]] = pars[1];
		}
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
    // object, telescope, instrument names
    this.object = this.raw.header.OBJECT;
    this.telescope = this.raw.header.TELESCOP;
    this.instrument = this.raw.header.INSTRUME;
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
	JS9.error(`unsupported bitpix in PNG file: ${this.raw.bitpix}`);
    }
    // set data min and max
    this.dataminmax();
    // having the real image, we can ask to release the offscreen image
    this.offscreen.img = null;
    // init WCS, if possible
    this.initWCS();
    // init the logical coordinate system, if possible
    this.initLCS();
    // plugin callbacks
    this.xeqPlugins("image", "onrawdata");
    // allow chaining
    return this;
};

// read input object and convert to image data
JS9.Image.prototype.mkRawDataFromHDU = function(obj, opts){
    let i, s, ui, clen, hdu, pars, card, got, rlen, rmvfile, done, frheap;
    let oraw, owidth, oheight, obitpix, oltm1_1, owcssys, owcsunits;
    let header, x1, y1, bin;
    let nhist = 0;
    let ncomm = 0;
    opts = opts || {};
    if( $.isArray(obj) || JS9.isTypedArray(obj) || obj instanceof ArrayBuffer ){
	// flatten if necessary
	if( $.isArray(obj[0]) ){
	    obj = obj.reduce( (a, b) => { return a.concat(b); });
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
	JS9.error(`data missing from JS9 FITS object: ${JSON.stringify(hdu)}`);
    }
    // quick check for 1D images (in case naxis is defined)
    if( hdu.naxis < 2 ){
	JS9.error("can't image a FITS file with less than 2 dimensions");
    }
    // save old essential values, if possible (for use as defaults)
    // free previous WCS, if possible
    if( this.raw ){
	oraw = this.raw;
	owidth = this.raw.width;
	oheight = this.raw.height;
	obitpix = this.raw.bitpix;
	oltm1_1 = this.raw.header.LTM1_1 || 1;
	owcssys = this.params.wcssys;
	owcsunits = this.params.wcsunits;
	this.freeWCS();
    }
    // initialize raws array?
    this.raws = this.raws || [];
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
	    // the old raw object is invalid
	    oraw = null;
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
	hdu.image = hdu.image.reduce( (a, b) => { return a.concat(b); });
    }
    // make the raw data: note in the case of a typed array coming from
    // the Emscripten heap, this is a copy, so we can free the heap immediately
    // (done below iff clearImageMemory contains the "heap" directive).
    // I didn't realize new XXXArray(typedArray) makes a copy, but see:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
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
	    if( pars !== undefined ){
		if( pars[0] === "HISTORY" ){
		    this.raw.header[`${pars[0]}__${nhist++}`] = pars[1];
		} else if( pars[0] === "COMMENT" ){
		    this.raw.header[`${pars[0]}__${ncomm++}`] = pars[1];
		} else {
		    this.raw.header[pars[0]] = pars[1];
		}
	    }
	}
    } else if( this.raw.cardstr ){
	this.raw.header = {};
	// make up header from string containing 80-char raw cards
	clen = this.raw.ncard;
	for(i=0; i<clen; i++){
	    card = this.raw.cardstr.slice(i*80, (i+1)*80);
	    pars = JS9.cardpars(card);
	    if( pars !== undefined ){
		if( pars[0] === "HISTORY" ){
		    this.raw.header[`${pars[0]}__${nhist++}`] = pars[1];
		} else if( pars[0] === "COMMENT" ){
		    this.raw.header[`${pars[0]}__${ncomm++}`] = pars[1];
		} else {
		    this.raw.header[pars[0]] = pars[1];
		}
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
    // convenience variable
    header = this.raw.header;
    // hack for binning.js:
    // if an original file header has LTM/LTV keywords, save them now,
    // so we can go back to file coords at any time
    if( !oraw && !this.parentFile && !this.parent ){
	if( header.LTV1 !== undefined   ||
	    header.LTV2 !== undefined   ||
	    header.LTM1_1 !== undefined ||
	    header.LTM2_2 !== undefined ){
	    this.parent = {};
	    this.parent.raw = {header: $.extend(true, {}, header)};
	    // initialize LCS for this parent header
	    this.parent.lcs = {};
	    JS9.Image.prototype.initLCS.call(this.parent,
					     this.parent.raw.header);
	}
    }
    // if section information is available, modify the WCS keywords
    // e.g., image sections from astroem/getFITSImage()
    // this code should match the algorithm in jsfitsio.c/updateWCS()
    if( hdu.imtab === "image"  &&
	(hdu.x1 !== undefined  && hdu.x1 !== 1)  ||
	(hdu.y1 !== undefined  && hdu.y1 !== 1)  ||
	(hdu.bin === undefined || hdu.bin !== 1) ){
	// bin factor is optional
	bin = hdu.bin || 1;
	if( hdu.x1 !== undefined ){
	    x1 = hdu.x1;
	} else {
	    x1 = 0;
	}
	if( hdu.y1 !== undefined ){
	    y1 = hdu.y1;
	} else {
	    y1 = 0;
	}
	if( header.CRPIX1 !== undefined ){
	    // cfitsio-style: see cfitsio/histo.c
	    header.CRPIX1 = (header.CRPIX1 - x1) / bin + 0.5;
	}
	if( header.CRPIX2 !== undefined ){
	    // cfitsio-style: see cfitsio/histo.c
	    header.CRPIX2 = (header.CRPIX2 - y1) / bin + 0.5;
	}
	if( header.CDELT1 !== undefined ){
	    header.CDELT1 = header.CDELT1 * bin;
	}
	if( header.CDELT2 !== undefined ){
	    header.CDELT2 = header.CDELT2 * bin;
	}
	if( header.CD1_1 !== undefined ){
	    header.CD1_1 = header.CD1_1 * bin;
	}
	if( header.CD1_2 !== undefined ){
	    header.CD1_2 = header.CD1_2 * bin;
	}
	if( header.CD2_1 !== undefined ){
	    header.CD2_1 = header.CD2_1 * bin;
	}
	if( header.CD2_2 !== undefined ){
	    header.CD2_2 = header.CD2_2 * bin;
	}
	header.LTM1_1 = header.LTM1_1 || 1.0;
	header.LTM1_1 = header.LTM1_1 / bin;
	header.LTM2_1 = header.LTM2_1 || 0.0;
	header.LTM2_1 = header.LTM2_1 / bin;
	header.LTM1_2 = header.LTM1_2 || 0.0;
	header.LTM1_2 = header.LTM1_2 / bin;
	header.LTM2_2 = header.LTM2_2 || 1.0;
	header.LTM2_2 = header.LTM2_2 / bin;
	header.LTV1 = header.LTV1 || 0;
	header.LTV1 = (header.LTV1 - x1) / bin + 0.5;
	header.LTV2 = header.LTV2 || 0;
	header.LTV2 = (header.LTV2 - y1) / bin + 0.5;
    }
    // look for a file/url (we'll also get a new id, see below)
    if( opts.file && opts.file !== this.file ){
	this.file = opts.file;
	this.id = null;
    } else if( opts.filename && opts.filename !== this.file ){
	this.file = opts.filename;
	this.id = null;
    } else if( hdu.filename && hdu.filename !== this.file ){
	this.file = hdu.filename;
	this.id = null;
    }
    this.file = this.file || (JS9.ANON + JS9.uniqueID());
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
	if( opts.extname || opts.extnum ){
	    if( opts.extname ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${opts.extname}]`;
	    } else if( opts.extnum && (opts.extnum > 0) ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${opts.extnum}]`;
	    }
	    if( hdu && hdu.fits ){
		if( opts.extname ){
		    hdu.fits.extname = opts.extname;
		}
		if( opts.extnum && (opts.extnum > 0) ){
		    hdu.fits.extnum = opts.extnum;
		}
	    }
	} else if( hdu.fits ){
	    if( hdu.fits.extname ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${hdu.fits.extname}]`;
	    } else if( hdu.fits.extnum && (hdu.fits.extnum > 0) ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${hdu.fits.extnum}]`;
	    }
	} else if( this.raw.header ){
	    if( this.raw.header.EXTNAME ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${this.raw.header.EXTNAME}]`;
	    }
	}
    }
    // last chance: get it from the file
    if( !this.id ){
	// save id in case we have to change it for uniqueness
	this.id0 = (this.parentFile||this.file).split("/").reverse()[0];
	// get a unique id for this image
	this.id = JS9.getImageID(this.id0, this.display.id, this);
    }
    // is this a proxy image?
    if( opts.proxyFile ){
	this.proxyFile = opts.proxyFile;
    }
    // save filter, if necessary
    this.raw.filter = opts.filter || "";
    // image or table?
    if( hdu.imtab ){
	this.imtab = hdu.imtab;
    } else {
	this.imtab = hdu.table ? "table" : "image";
    }
    // also associate imtab with this raw layer
    this.raw.imtab = this.imtab;
    // min and max data values
    if( hdu.dmin !== undefined && hdu.dmax !== undefined ){
	// data min and max in object
	this.dataminmax(hdu.dmin, hdu.dmax);
    } else {
	// calculate data min and max
	this.dataminmax();
    }
    // object, telescope, instrument names
    this.object = this.raw.header.OBJECT;
    this.telescope = this.raw.header.TELESCOP;
    this.instrument = this.raw.header.INSTRUME;
    // reset binning properties, as necessary
    if( (this.imtab === "table") && hdu.table ){
	this.binning.bin = hdu.table.bin || 1;
    } else if( hdu.bin ){
	this.binning.bin = hdu.bin;
    } else {
	this.binning.bin = 1;
    }
    // hack: try to figure out obin vs bin for sections
    if( opts.ltm2obin && header.LTM1_1 ){
	this.binning.obin = header.LTM1_1 / oltm1_1;
    } else if( !oraw ){
	// otherwise make sure obin matches bin for first load of data
	this.binning.obin = this.binning.bin;
    }
    // init WCS, if possible
    this.initWCS();
    // reset the wcssys and wcsunits to previous, if necessary
    if( owcssys ){
	this.setWCSSys(owcssys);
    }
    if( owcsunits ){
	this.setWCSUnits(owcsunits);
    }
    // init the logical coordinate system, if possible
    this.initLCS();
    // get hdu info, if possible
    try{
	if( opts.hdus ){
	    this.hdus = opts.hdus;
	} else if( this.parentFile &&
		   JS9.helper.connected && JS9.helper.js9helper ){
	    obj = {
		id: this.expandMacro("$id"),
		cmd: this.expandMacro("js9Xeq listhdus $filename"),
		image: this.file,
		fits: this.parentFile,
		rtype: "text"
	    };
	    JS9.helper.send("listhdus", obj, (obj) => {
		if( obj.stderr ){
		    return;
		}
		if( obj.errcode ){
		    return;
		}
		if( obj.stdout ){
		    try{ this.hdus = JSON.parse(obj.stdout); }
		    catch(e) { this.hdus = null; }
		}
	    });
	} else if( this.raw && this.raw.hdu && this.raw.hdu.fits ){
	    s = JS9.listhdu(this.raw.hdu.fits.vfile);
	    if( s ){
		try{ this.hdus = JSON.parse(s); }
		catch(e) { this.hdus = null; }
	    }
	}
    }
    catch(ignore){ /* empty */ }
    // can we remove the virtual file?
    if( this.raw.hdu.fits && this.raw.hdu.fits.vfile  ){
	s = JS9.globalOpts.clearImageMemory;
	if( s === false ){
	    s = ["never"];
	} else if( s === true ){
	    s = ["always"];
	} else {
	    s = s.toLowerCase().split(/[,>]/);
	}
	rmvfile = false;
	frheap = false;
	// all conditions must be met ...
	for(i=0, done=false; i<s.length && !done; i++){
	    switch(s[i]){
	    case "never":
		rmvfile = false;
		done = true;
		break;
	    case "always":
		rmvfile = true;
		done = true;
		break;
	    case "heap":
		frheap = true;
		break;
	    case "auto":
		if( (this.raw.header.NAXIS <= 2)  &&
		    (!this.hdus || this.hdus.length === 1) ){
		    rmvfile = true;
		} else {
		    rmvfile = false;
		    done = true;
		}
		break;
	    case "nocube":
		if( this.raw.header.NAXIS <= 2 ){
		    rmvfile = true;
		} else {
		    rmvfile = false;
		    done = true;
		}
		break;
	    case "noext":
		if( !this.hdus || this.hdus.length === 1 ){
		    rmvfile = true;
		} else {
		    rmvfile = false;
		    done = true;
		}
		break;
	    case "size":
		if( s[i+1] ){
		    if( JS9.vsize(hdu.fits.vfile) > s[i+1]*1000000 ){
			rmvfile = true;
		    } else {
			rmvfile = false;
			done = true;
		    }
		} else {
		    rmvfile = false;
		    done = true;
		}
		break;
	    default:
		break;
	    }
	}
	// remove virtual file and/or heap space
	if( rmvfile ){
	    if( JS9.DEBUG > 2 ){
		JS9.log("removing underlying FITS vfile for %s: %s",
			this.id, this.raw.hdu.fits.vfile);
	    }
	    JS9.cleanupFITSFile(this.raw, true);
	} else if( frheap ){
	    if( JS9.DEBUG > 2 ){
		JS9.log("freeing heap space for %s: %s",
			this.id, this.raw.hdu.fits.vfile);
	    }
	    JS9.cleanupFITSFile(this.raw, false);
	}
    }
    // plugin callbacks
    this.xeqPlugins("image", "onrawdata");
    // allow chaining
    return this;
};

// store section information
JS9.Image.prototype.mkSection = function(...args){
    let s, xtra;
    const sect = this.rgb.sect;
    // save zoom in case we are about to change it (regions have to be scaled)
    sect.ozoom  = sect.zoom;
    // process args
    switch(args.length){
    case 0:
	// no args: init to display central part of image
	sect.xcen   = Math.floor(this.raw.width/2);
	sect.ycen   = Math.floor(this.raw.height/2);
	sect.width  = Math.min(this.raw.width, this.display.canvas.width);
	sect.height = Math.min(this.raw.height,this.display.canvas.height);
	break;
    case 1:
	if( !JS9.isNumber(args[0]) ){
	    JS9.error(`invalid input for generating section: ${args[0]}`);
	}
	sect.zoom   = parseFloat(args[0]);
	sect.width  = Math.min(this.raw.width*sect.zoom,
			       this.display.canvas.width);
	sect.height = Math.min(this.raw.height*sect.zoom,
			       this.display.canvas.height);
	break;
    case 2:
	// two args: x, y
	if( !JS9.isNumber(args[0]) || !JS9.isNumber(args[1]) ){
	    JS9.error(`invalid input for generating section: ${args[0]} ${args[1]}`);
	}
	sect.xcen   = parseFloat(args[0]);
	sect.ycen   = parseFloat(args[1]);
	// reset width and height if there was a section offset
	if( JS9.notNull(sect.ix) ){
	    sect.width  = Math.min(this.raw.width*sect.zoom,
				   this.display.canvas.width);
	}
	if( JS9.notNull(sect.iy) ){
	    sect.height = Math.min(this.raw.height*sect.zoom,
				   this.display.canvas.height);
	}
	break;
    case 3:
	// three args: x, y, zoom
	if( !JS9.isNumber(args[0]) ||
	    !JS9.isNumber(args[1]) ||
	    !JS9.isNumber(args[2]) ){
	    JS9.error(`invalid input for generating section: ${args[0]} ${args[1]} ${args[2]}`);
	}
	sect.xcen   = parseFloat(args[0]);
	sect.ycen   = parseFloat(args[1]);
	sect.zoom   = parseFloat(args[2]);
	sect.width  = Math.min(this.raw.width*sect.zoom,
			       this.display.canvas.width);
	sect.height = Math.min(this.raw.height*sect.zoom,
			       this.display.canvas.height);
	break;
    default:
	break;
    }
    // assume no offset when displaying section
    delete sect.ix;
    delete sect.iy;
    // need integer dimensions
    sect.width  = Math.floor(sect.width);
    sect.height  = Math.floor(sect.height);
    sect.x0 = Math.floor(sect.xcen - (sect.width/(2*sect.zoom)));
    sect.y0 = Math.floor(sect.ycen - (sect.height/(2*sect.zoom)));
    sect.x1 = Math.floor(sect.xcen + (sect.width/(2*sect.zoom)));
    sect.y1 = Math.floor(sect.ycen + (sect.height/(2*sect.zoom)));
    // make sure we're within bounds while maintaining section dimensions
    if( sect.x0 < 0 ){
	if( JS9.globalOpts.panWithinDisplay ){
            sect.x1 -= sect.x0;
	} else {
	    sect.ix = sect.x0 * sect.zoom;
	}
        sect.x0 = 0;
    }
    if( sect.y0 < 0 ){
	if( JS9.globalOpts.panWithinDisplay ){
            sect.y1 -= sect.y0;
	} else {
	    sect.iy = sect.y0 * sect.zoom;
	}
        sect.y0 = 0;
    }
    if( sect.x1 > this.raw.width ){
	if( JS9.globalOpts.panWithinDisplay ){
            sect.x0 -= (sect.x1 - this.raw.width);
	} else {
	    sect.ix = (sect.x1 - this.raw.width) * sect.zoom;
	}
        sect.x1 = this.raw.width;
    }
    if( sect.y1 > this.raw.height ){
	if( JS9.globalOpts.panWithinDisplay ){
            sect.y0 -= (sect.y1 - this.raw.height);
	} else {
	    sect.iy = (sect.y1 - this.raw.height) * sect.zoom;
	}
        sect.y1 = this.raw.height;
    }
    // for offset image with fractional zoom, maybe display more of the image
    if( sect.ix && sect.zoom < 1 ){
	if( sect.x0 > 0 ){
	    xtra =  sect.x0;
	    sect.x0 -= xtra;
	    sect.ix += xtra * sect.zoom;
	}
	if( sect.x1 < this.raw.width ){
	    xtra =  this.raw.width - sect.x1;
	    sect.x1 += xtra;
	    sect.ix -= xtra * sect.zoom;
	}
    }
    if( sect.iy && sect.zoom < 1 ){
	if( sect.y0 > 0 ){
	    xtra =  sect.y0;
	    sect.y0 -= xtra;
	    sect.iy += xtra * sect.zoom;
	}
	if( sect.y1 < this.raw.height ){
	    xtra =  this.raw.height - sect.y1;
	    sect.y1 += xtra;
	    sect.iy -= xtra * sect.zoom;
	}
    }
    // final check: make sure we're within bounds
    sect.x0 = Math.max(0, sect.x0);
    sect.x1 = Math.min(this.raw.width, sect.x1);
    sect.y0 = Math.max(0, sect.y0);
    sect.y1 = Math.min(this.raw.height, sect.y1);
    // we have final section limits: derive new width and height
    sect.width   = Math.ceil((sect.x1 - sect.x0) * sect.zoom);
    sect.height  = Math.ceil((sect.y1 - sect.y0) * sect.zoom);
    // sanity check
    if( sect.width <= 0 || sect.height <= 0 ){
	s = sprintf("invalid image section: %s,%s [%s,%s, %s,%s, %s]",
		    sect.width, sect.height,
		    sect.x0, sect.y0, sect.x1, sect.y1,
		    sect.zoom);
	JS9.error(s);
    }
    // we changed section, so the offscreen RGB image is invalid
    this.offscreenRGB = null;
    // put zoom back into params
    this.params.zoom = sect.zoom;
    // allow chaining
    return this;
};

// create colormap index array from data values and specified data min/max
// from: tksao1.0/frame/frametruecolor.C
JS9.Image.prototype.mkColorData = function(){
    let i, dd;
    const ss = JS9.SCALESIZE;
    const length = ss - 1;
    const dmin = this.params.scalemin;
    const dmax = this.params.scalemax;
    const dlen = this.raw.width * this.raw.height;
    const diff = dmax - dmin;
    const dval = length / diff;
    // allocate array
    if( !this.colorData || this.colorData.length < dlen ){
	this.colorData = new Int32Array(dlen);
    }
    // for each raw value, calculate lookup offset into scaled array
    for(i=0; i<dlen; i++){
	dd = this.raw.data[i];
	if( dd <= dmin ){
	    this.colorData[i] = 0;
	} else if( dd >= dmax ){
	    this.colorData[i] = ss - 1;
	} else {
	    this.colorData[i] = Math.floor(((dd - dmin) * dval) + 0.5);
	}
    }
    // allow chaining
    return this;
};

// generate colorcells array from current colormap
// from: tksao1.0/colorbar/colorbar.C
JS9.Image.prototype.calcContrastBias = function(i){
    let r, result;
    let bias = this.params.bias;
    const cs = JS9.COLORSIZE;
    const contrast = this.params.contrast;
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
    let i, j, idx;
    const cs = JS9.COLORSIZE;
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
    let aa, dd, ii, jj, ll, exp, low, vv, avg, color;
    let data, dlen, diff, bin, total, dval, dmin, dmax, pdf;
    const cs = JS9.COLORSIZE;
    const ss = JS9.SCALESIZE;
    const tt = JS9.INVSIZE;
    const hh = JS9.HISTSIZE;
    const hex2num = (hex) => {
	let i, k, int1, int2;
	const hex_alphabets = "0123456789ABCDEF";
	const value = [];
	//Remove the "#" char - if there is one.
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
	JS9.error(`unknown scale '${this.params.scale}'`);
    }
    // allow chaining
    return this;
};

// create RGB image from scaled colorCells
// sort of from: tksao1.0/frame/truecolor.c, but not really
JS9.Image.prototype.mkRGBImage = function(){
    let rgb, sect, img, xrgb, yrgb, wrgb, hrgb, rgbimg, ctx;
    let inc, zinc, xIn, yIn, xOut, yOut, xOutIdx, yOutIdx, yZoom, xZoom;
    let idx, odx, yLen, zx, zy, zyLen, alpha, alpha1, alpha2, ridx, gidx, bidx;
    let rthis = null;
    let gthis = null;
    let bthis = null;
    let dorgb = false;
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
    inc = Math.max(1, Math.floor(1/sect.zoom));
    zinc = sect.zoom * inc;
    for(yIn=sect.y1-1, yOut=0; yIn>=sect.y0; yIn -= inc, yOut++){
	yLen = yIn * this.raw.width;
	yOutIdx = yOut * zinc;
	for(xIn=sect.x0, xOut=0; xIn<sect.x1; xIn += inc, xOut++){
	    if( dorgb ){
		// rgb mode: special case
		ridx = rthis ? rthis.colorData[yLen + xIn] : 0;
		gidx = gthis ? gthis.colorData[yLen + xIn] : 0;
		bidx = bthis ? bthis.colorData[yLen + xIn] : 0;
		if( (ridx === undefined) ||
		    (gidx === undefined) ||
		    (bidx === undefined) ){
		    JS9.globalOpts.rgb.active = false;
		    JS9.error("RGB images are incompatible. Turning off RGB mode.", "", false);
		    this.mkRGBImage();
		    return this;
		}
	    } else {
		// ordinary case
		idx = this.colorData[yLen + xIn];
	    }
	    if( this.maskData ){
		alpha = this.maskData[yLen +xIn] > 0 ? alpha1 : alpha2;
	    }
	    xOutIdx = xOut * zinc;
	    for(yZoom=0; yZoom<sect.zoom; yZoom++) {
		// ceil avoids non-integer zoom cross-hair artifacts ...
		zy = Math.ceil(yOutIdx + yZoom);
		zyLen = zy * sect.width;
		for(xZoom=0; xZoom<sect.zoom; xZoom++) {
		    // ceil avoids non-integer zoom cross-hair artifacts ...
		    zx = Math.ceil(xOutIdx + xZoom);
		    // final index into output buffer
		    odx = (zyLen + zx) * 4;
		    // check for odx out-of-bounds
		    if( odx < img.data.length ){
			if( dorgb ){
			    // rgb mode: special case
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
			    // ordinary case
			    img.data[odx]   = this.psColors[idx][0];
			    img.data[odx+1] = this.psColors[idx][1];
			    img.data[odx+2] = this.psColors[idx][2];
			}
			img.data[odx+3] = alpha;
		    }
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
JS9.Image.prototype.blendImage = function(...args){
    let [mode, opacity, active] = args;
    // see composite and blend operations: https://www.w3.org/TR/compositing-1/
    const blendexp = /normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity|clear|copy|source-over|destination-over|source-in|destination-in|source-out|destination-out|source-atop|destination-atop|xor|lighter/i;
    if( args.length === 0 ){
	return this.blend;
    }
    // if first arg is true or false, this turns on/off blending
    if( (mode === true)   || (mode === false)   ||
	(mode === "true") || (mode === "false") ){
	if( mode === "true" ){
	    mode = true;
	} else if( mode === "false" ){
	    mode = false;
	}
	this.blend.active = mode;
	// trigger option redisplay
	this.xeqPlugins("image", "onimageblend");
	if( this.display.blendMode ){
	    this.displayImage();
	}
	return this;
    }
    if( JS9.notNull(mode) || JS9.notNull(opacity) ){
	// set blend mode, if necessary
	if( JS9.notNull(mode) ){
	    if( !blendexp.test(mode) ){
		JS9.error(`invalid composite/blend operation: ${mode}`);
	    }
	    this.blend.mode = mode;
	}
	// set opacity, if necessary
	if( JS9.notNull(opacity) ){
	    if( typeof opacity === "string" ){
		opacity = parseFloat(opacity);
	    } else if( typeof opacity !== "number" ){
		JS9.error(`invalid opacity: ${opacity}`);
	    }
	    this.blend.opacity = Math.min(Math.max(opacity, 0), 1);
	}
	// set active state, if necessary
	if( JS9.notNull(active) ){
	    if( active === "true" ){
		active = true;
	    } else if( active === "false" ){
		active = false;
	    }
	    this.blend.active = active;
	}
	// trigger option redisplay
	this.xeqPlugins("image", "onimageblend");
	// display blended result, if necessary
	if( this.display.blendMode && this.blend.active ){
	    this.displayImage();
	}
    }
    // allow chaining
    return this;
};

// calculate and set offsets into display where image is to be written
JS9.Image.prototype.calcDisplayOffsets = function(dowcs){
    let wcsim, wcssect, npos, oval;
    const sect = this.rgb.sect;
    // calculate offsets
    this.ix = Math.floor((this.display.canvas.width - this.rgb.img.width)/2);
    this.iy = Math.floor((this.display.canvas.height - this.rgb.img.height)/2);
    // adjust when section is not centered on display
    if( JS9.notNull(sect.ix) ){
	this.ix -= sect.ix / 2;
    }
    if( JS9.notNull(sect.iy) ){
	this.iy += sect.iy / 2;
    }
    // do wcs alignment, if necessary
    if( dowcs && this.wcsAlign() ){
	// calc offsets so as to align with the wcs image
	wcsim = this.wcsim;
	wcssect = wcsim.rgb.sect;
	// we will pan this image to the wcsim's display section
	npos = JS9.pix2pix(wcsim, this, wcsim.getPan());
	// and use those image coords for the center of the section
	oval = JS9.globalOpts.panWithinDisplay;
	JS9.globalOpts.panWithinDisplay = true;
	this.tmp.ozoom = this.rgb.sect.ozoom;
	this.mkSection(npos.x, npos.y, wcssect.zoom);
	this.rgb.sect.ozoom = this.tmp.ozoom; delete this.tmp.ozoom;
	JS9.globalOpts.panWithinDisplay = oval;
	// offsets of these images
	this.ix -= (sect.xcen - ((sect.x0 + sect.x1)/2)) * wcssect.zoom;
	this.iy += (sect.ycen - ((sect.y0 + sect.y1)/2)) * wcssect.zoom;
    }
    // allow chaining
    return this;
};

// primitive to put image data on screen
JS9.Image.prototype.putImage = function(opts){
    const rgb = this.rgb;
    const display = this.display;
    const ctx = display.context;
    // called in image context
    const img2canvas = (img) => {
	let octx, ocanvas;
	if( !this.offscreenRGB ){
	    ocanvas = document.createElement("canvas");
	    octx = ocanvas.getContext("2d");
	    ocanvas.width= img.width;
	    ocanvas.height = img.height;
	    // turn off anti-aliasing
	    if( !JS9.ANTIALIAS ){
		octx.imageSmoothingEnabled = false;
		// octx.mozImageSmoothingEnabled = false;
		octx.webkitImageSmoothingEnabled = false;
		octx.msImageSmoothingEnabled = false;
	    }
	    octx.putImageData(img, 0, 0);
	    this.offscreenRGB = {canvas: ocanvas, context: octx};
	}
	return this.offscreenRGB.canvas;
    };
    // opts is optional
    opts = opts || {};
    // reproject: if reproj wcs header exists, save it for alignment
    if( this.rawDataLayer() === "reproject" && opts.wcsim ){
	this.wcsim = opts.wcsim;
	this.wcsim.isawcsim = true;
    }
    // get display offsets
    this.calcDisplayOffsets(true);
    // draw the image into the context
    if( JS9.notNull(opts.opacity) || JS9.notNull(opts.blend) ){
	// one component of a blended image
	ctx.save();
	if( opts.opacity !== undefined ){
	    ctx.globalAlpha = opts.opacity;
	}
	if( opts.blend !== undefined ){
	    ctx.globalCompositeOperation = opts.blend;
	}
	ctx.drawImage(img2canvas(rgb.img), this.ix, this.iy);
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
    let i, im, bopts, obj;
    let nblend = 0;
    const allmode = "colors,scaled,rgb,display,plugins";
    const blends = [];
    const mode = {};
    // eslint-disable-next-line no-unused-vars
    const modeFunc = (element, index, array) => {
	const el = element.trim();
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
	mode.colors = false;
	mode.scaled = false;
    }
    // opts are optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse displayImage opts: ${opts}`, e); }
    }
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
    // if we explicitly don't display, return here;
    if( mode.nodisplay ){
	return this;
    }
    // display image on screen
    if( mode.display ){
	// clear image
	this.display.context.clear();
	if( nblend ){
	    // pre-calculate image offsets in case of zoom changed for an image
	    // which acts as wcsim for another blended image ... in case the
	    // blended image gets loaded before the wcs image ... messy!
	    for(i=blends.length-1; i>=0; i--){
		blends[i].calcDisplayOffsets(false);
	    }
	    for(i=blends.length-1; i>=0; i--){
		im = blends[i];
		// display the image using blend characteristics
		bopts = {wcsim: opts.wcsim,
			 blend: im.blend.mode, opacity: im.blend.opacity};
		im.putImage(bopts);
		if( im === this ){
		    // display layers for this image
		    im.displayShapeLayers();
		}
	    }
	} else {
	    // display the image
	    this.putImage(opts);
	    // display layers for this image
	    this.displayShapeLayers();
	}
	// mark this image as being in this display
	this.display.image = this;
	// now this is the displayed image, we can add delayed shapes
	if( this.delayedShapes && this.delayedShapes.length ){
	    while( this.delayedShapes.length ){
		obj = this.delayedShapes.shift();
		this.addShapes(obj.layer, obj.shape, obj.opts);
	    }
	    delete this.delayedShapes;
	}
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
    let s, arr, ozoom, ora, odec, olpos, ipos, func;
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse refresh opts: ${opts}`, e); }
    }
    // no obj or obj is a string, this is a load with refresh turned on
    if( !obj || typeof obj === "string" ){
	if( opts.onrefresh ){
	    opts.onload = opts.onrefresh;
	    delete opts.onrefresh;
	}
	opts.refresh = this;
	// for file:// uri, we can use the FITS pathname, where possible
	if( !document.domain ){
	    s = obj || this.fitsFile || this.file;
	} else {
	    // else use the url path relative to the web page
	    s = obj || this.file;
	}
	JS9.Load(s, opts, {display: this.display});
	return;
    }
    // check for refresh func
    opts.rawid = opts.rawid || JS9.RAWID0;
    // allow explicit specification of a func, for backward-compatibility
    if( typeof opts === "function" ){
	func = opts;
	opts = {onrefresh: func};
    }
    if( !opts.onrefresh && JS9.imageOpts.onrefresh ){
	// use global onrefresh, if possible
	opts.onrefresh = JS9.imageOpts.onrefresh;
    }
    // save section center if it's not to be reset
    if( !opts.resetSection ){
	// always save logical coords
	olpos = this.imageToLogicalPos({x: this.rgb.sect.xcen,
					y: this.rgb.sect.ycen});
	// save wcs pos, if available
	if( this.raw.wcs && this.raw.wcs > 0 ){
	    s = JS9.pix2wcs(this.raw.wcs,
			    this.rgb.sect.xcen, this.rgb.sect.ycen);
	    arr = s.trim().split(/\s+/);
	    ora = JS9.saostrtod(arr[0]);
	    if( (String.fromCharCode(JS9.saodtype()) === ":") &&
		(this.params.wcssys !== "galactic" )          &&
		(this.params.wcssys !== "ecliptic" )          ){
		ora *= 15.0;
	    }
	    odec = JS9.saostrtod(arr[1]);
	}
    }
    ozoom = this.rgb.sect.zoom;
    // save old binning
    this.binning.obin = this.binning.bin;
    // generate new data
    this.mkRawDataFromHDU(obj, opts);
    // reset or restore section?
    if( opts.resetSection ){
	// reset section
	this.mkSection();
	this.mkSection(ozoom);
    } else {
	// try to restore section using saved coords
	if( this.raw.wcs && this.raw.wcs > 0      &&
	    JS9.notNull(ora) && JS9.notNull(odec) ){
	    arr = JS9.wcs2pix(this.raw.wcs, ora, odec).trim().split(/ +/);
	    ipos = {x: parseFloat(arr[0]), y: parseFloat(arr[1])};
	} else {
	    ipos = this.logicalToImagePos({x: olpos.x, y: olpos.y});
	}
	// but if the image position off the new image ...
	if( ipos.x > 0 && ipos.x < this.raw.width  &&
	    ipos.y > 0 && ipos.y < this.raw.height ){
	    this.mkSection(ipos.x, ipos.y, ozoom);
	} else {
	    // ... just reset the section
	    this.mkSection();
	    this.mkSection(ozoom);
	}
    }
    // display new image data with old section
    this.displayImage("colors", opts);
    // notify the helper
    this.notifyHelper();
    // update shape layers if necessary
    if( opts.refreshRegions                      ||
	opts.resetSection                        ||
	(this.binning.obin !== this.binning.bin) ){
	this.refreshLayers();
	// update region values
	this.updateShapes("regions", "all", "binning");
    }
    // plugin callbacks
    this.xeqPlugins("image", "onimagerefresh");
    // all done
    JS9.waiting(false);
    // everything else is done so call refresh func, if necessary
    if( opts.onrefresh ){
	try{ JS9.xeqByName(opts.onrefresh, window, this); }
	catch(e){ JS9.error("in image refresh callback", e); }
    }
    // allow chaining
    return this;
};

// fileDimensions: get dimensions of "original" file
// this is the hackiest routine in the JS9 module
// why is it so hard???
JS9.Image.prototype.fileDimensions = function() {
    let xdim, ydim;
    if( this.parent && this.parent.raw.header.XTENSION !== "BINTABLE" ){
	if( this.parent.raw.header.TABDIM1 ){
	    xdim = this.parent.raw.header.TABDIM1;
	} else {
	    xdim = this.parent.raw.header.NAXIS1;
	}
	if( this.parent.raw.header.TABDIM2 ){
	    ydim = this.parent.raw.header.TABDIM2;
	} else {
	    ydim = this.parent.raw.header.NAXIS2;
	}
    } else {
	if( this.raw.header.TABDIM1 ){
	    xdim = this.raw.header.TABDIM1;
	} else {
	    xdim = this.raw.header.NAXIS1;
	}
	if( this.raw.header.TABDIM2 ){
	    ydim = this.raw.header.TABDIM2;
	} else {
	    ydim = this.raw.header.NAXIS2;
	}
    }
    return {xdim, ydim};
};

/*
   maybePhysicalToImage: the second hackiest routine in the JS9 module!
   The physical position defined by LTM/LTV is not always the file position,
   For example, if the file foo.fits was created from another file:
       funimage somefile.fits'[*,*,2]' foo.fits
   its LTM/LTV keywords will referring to the parent, instead of itself.
   In such a case, we want to convert physical position to the image position
   of the physical file.
   This situation is signalled by the presence of a parent lcs object.
   This routine is used to display sections and the fitsy binning.js plugin.
*/
JS9.Image.prototype.maybePhysicalToImage = function(pos){
    let lpos, ipos, npos;
    if( this.imtab === "image" &&
	this.parent && this.parent.lcs && pos.x && pos.y ){
	lpos = {x: pos.x, y: pos.y};
	ipos = JS9.Image.prototype.logicalToImagePos.call(this.parent, lpos,
							  "ophysical");
	npos = {x: Math.floor(ipos.x+0.5), y: Math.floor(ipos.y+0.5)};
    }
    return npos;
};

// extract and display a section of an image, with table filtering
JS9.Image.prototype.displaySection = function(opts, func) {
    let oproxy, hdu, from, obj, oreg, nim, topts;
    let ipos, lpos, npos, binval1, binval2, tbin, arr, sect;
    const getval3 = (val1, val2, val3) => {
	let res;
	if( !JS9.isNull(val1) ){
	    res = val1;
	} else if( !JS9.isNull(val2) ){
	    res = val2;
	}
	return res || val3;
    };
    // convert region to section (cen and dim)
    const reg2sect = (xreg) => {
	let i, xdim, ydim;
	let xx = 0;
	let yy = 0;
	let minx = 1000000;
	let maxx = 0;
	let miny = 1000000;
	let maxy = 0;
	const shape = xreg.shape;
	// use physical coords object, if possible
	if( !this.parentFile && xreg.lcs ){ xreg = xreg.lcs; }
	switch( shape ){
	case "annulus":
            xdim  = xreg.radii[xreg.radii.length-1]*2;
            ydim = xreg.radii[xreg.radii.length-1]*2;
	    break;
	case "box":
            xdim  = xreg.width;
            ydim = xreg.height;
	    break;
	case "circle":
            xdim  = xreg.radius*2;
            ydim = xreg.radius*2;
            break;
	case "ellipse":
            xdim  = xreg.r1*2;
            ydim = xreg.r2*2;
            break;
	case "polygon":
        case "line":
	    for ( i=0; i < xreg.pts.length; i++ ) {
		xx += xreg.pts[i].x;
		yy += xreg.pts[i].y;
		if ( xreg.pts[i].x > maxx ) { maxx = xreg.pts[i].x; }
		if ( xreg.pts[i].x < minx ) { minx = xreg.pts[i].x; }
		if ( xreg.pts[i].y > maxy ) { maxy = xreg.pts[i].y; }
		if ( xreg.pts[i].y < miny ) { miny = xreg.pts[i].y; }
	    }
	    xreg.x = xx/xreg.pts.length;
	    xreg.y = yy/xreg.pts.length;
	    if( xreg.shape === "line" && xreg.pts.length === 2 ){
                xdim = Math.sqrt(((xreg.pts[0].x - xreg.pts[1].x)  *
                                  (xreg.pts[0].x - xreg.pts[1].x)) +
                                 ((xreg.pts[0].y - xreg.pts[1].y)  *
                                  (xreg.pts[0].y - xreg.pts[1].y)));
                ydim = 1;
	    } else {
	        xdim  = maxx - minx;
		ydim = maxy - miny;
	    }
	    break;
	case "text":
	    xdim = 10;
	    ydim = 10;
	    break;
	default:
	    break;
	}
	return({xcen:xreg.x, ycen:xreg.y, xdim:xdim, ydim:ydim});
    };
    // main display routine
    const disp = (hdu, opts) => {
	let tim, did, arr;
	let ss = "";
	// make a copy of opts so we can change it
	topts = $.extend(true, {}, opts || {});
	if( JS9.isNull(topts.refreshRegions) ){
	    topts.refreshRegions = true;
	}
	if( JS9.isNull(topts.resetSection) ){
	    topts.resetSection = true;
	}
	// start the waiting!
	if( topts.waiting !== false ){
	    JS9.waiting(true, this.display);
	}
	// the id might have changed if we changed extensions
	if( hdu.fits.extname ){
	    ss = `[${hdu.fits.extname}]`;
	} else if( hdu.fits.extnum && hdu.fits.extnum > 0 ){
	    ss = `[${hdu.fits.extnum}]`;
	} else if( this.parent ){
	    if( this.parent.extname ){
		ss = `[${this.parent.extname}]`;
	    } else if( this.parent.extnum && this.parent.extnum > 0 ){
		ss = `[${this.parent.extnum}]`;
	    }
	}
	// change id and file if extension changed
	if( ss ){
	    topts.id = this.id.replace(/\[.*\]/,"") + ss;
	    // NB: this was removed in v2.3 ... why? ... added back in v2.5
	    topts.file = this.file.replace(/\[.*\]/,"") + ss;
	}
	if( topts.separate ){
	    // display section as a separate image in the specified display
	    delete topts.xcen;
	    delete topts.ycen;
	    if( typeof topts.separate === "string" ){
		arr = topts.separate.split(":");
		switch(arr.length){
		case 1:
		    did = arr[0];
		    break;
		default:
		    did = arr[0];
		    topts.id = arr[1];
		    break;
		}
		// make sure we can find the display
		topts.display = JS9.lookupDisplay(did);
	    } else {
		topts.display = this.display;
	    }
	    // lame attempt to get to original parentFile
	    if( from === "parentFile" && this.fitsFile ){
		tim = JS9.lookupImage(this.fitsFile);
		if( tim && tim.parentFile ){
		    topts.parentFile = tim.parentFile;
		} else {
		    topts.parentFile = this.fitsFile;
		}
	    }
	    // save current regions (before displaying new image)
	    oreg = this.listRegions("all", {mode: 1, saveid: true});
	    // func to perform when image is loaded
	    func = topts.ondisplaysection || topts.onrefresh || func;
	    // set up new and display new image
	    nim = new JS9.Image(hdu, topts, func);
	    // reset obin to be bin, since new images have no previous bin
	    nim.binning.obin = nim.binning.bin;
	    // add regions to new image
	    if( oreg && topts.refreshRegions !== false ){
		nim.addShapes("regions", oreg, {restoreid: true});
	    }
	    // set status of new image
	    nim.setStatus("displaySection", "complete");
	} else if( typeof topts.refresh === "string" ){
	    // refresh the image in the specified display
	    delete topts.xcen;
	    delete topts.ycen;
	    arr = topts.refresh.split(":");
	    switch(arr.length){
	    case 1:
		did = arr[0];
		break;
	    default:
		did = arr[0];
		topts.id = arr[1];
		break;
	    }
	    // make sure we can find the display
	    topts.display = JS9.lookupDisplay(did);
	    if( topts.display.image ){
		topts.rawid = this.raw.id;
		// func to perform when image is refreshed
		topts.onrefresh = topts.ondisplaysection || topts.onrefresh || func;
		// refresh the image with the new hdu
		topts.display.image.refreshImage(hdu, topts);
	    } else {
		// no image in the specified display, so make a new one
		// lame attempt to get to original parentFile
		if( from === "parentFile" && this.fitsFile ){
		    tim = JS9.lookupImage(this.fitsFile);
		    if( tim && tim.parentFile ){
			topts.parentFile = tim.parentFile;
		    } else {
			topts.parentFile = this.fitsFile;
		    }
		}
		// save current regions (before displaying new image)
		oreg = this.listRegions("all", {mode: 1, saveid: true});
		// func to perform when image is loaded
		func = topts.ondisplaysection || topts.onrefresh || func;
		// set up new and display new image
		nim = new JS9.Image(hdu, topts, func);
		// reset obin to be bin, since new images have no previous bin
		nim.binning.obin = nim.binning.bin;
		// add regions to new image
		if( oreg ){
		    nim.addShapes("regions", oreg, {restoreid: true});
		}
		// set status of new image
		nim.setStatus("displaySection", "complete");
	    }
	} else {
	    // this is the default behavior for displaySection:
	    // refresh the image in the current display
	    topts.rawid = this.raw.id;
	    // func to perform when image is refreshed
	    topts.onrefresh = topts.ondisplaysection || topts.onrefresh || func;
	    // refresh the current image with the new hdu
	    this.refreshImage(hdu, topts);
	}
	// set status of old image
	this.setStatus("displaySection", "complete");
	// done waiting
	JS9.waiting(false);
    };
    // sanity check
    if( !this.raw || !this.raw.hdu || !this.raw.hdu.fits ){
	JS9.error("invalid image for displaySection");
    }
    // opts is optional
    opts = opts || {};
    // special case: if opts is "full", display full image
    if( opts === "full" ){
	const {xdim, ydim} = this.fileDimensions();
	opts = {xdim: xdim, ydim: ydim, xcen: 0, ycen: 0};
    } else if( opts === "selected" ){
	this.selectShapes("regions", "selected", (obj) => {
	    topts = reg2sect(obj.pub);
	    topts.from = "virtualFile";
	    topts.separate = true;
	    topts.refreshRegions = false;
	    topts.resetSection = true;
	    this.displaySection(topts, func);
	});
	return;
    } else if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse section opts: ${opts}`, e); }
    }
    if( opts.separate ){
	// if we are generating a separate image, copy the hdu
	hdu = $.extend(true, {}, this.raw.hdu);
    } else {
	// if we are replacing the current image, use the hdu directly
	hdu = this.raw.hdu;
    }
    // from where do we extract the section?
    from = opts.from;
    if( !from ){
	if( this.parentFile && JS9.helper.connected && JS9.helper.js9helper ){
	    // we will be processing a parent file to get the section
	    from = "parentFile";
	} else {
	    // we will be processing a virtual file to get the section
	    from = "virtualFile";
	}
    }
    // get previous values to use as defaults
    if( hdu.table ){
	// tables are easy: all the previous values should be present
	sect = hdu.table;
    } else {
	// images are a bit more difficult
	// when using a parent, look for bin value relative to the parent ...
	if( from === "parentFile" &&
	    this.raw.header && JS9.notNull(this.raw.header.LTM1_1) ){
		binval1 = 1;
		binval2 = this.raw.header.LTM1_1;
	} else {
	    binval1 = hdu.bin || 1;
	    binval2 = 1;
	}
	// get image center from raw data
	ipos = {x: this.raw.width / 2, y: this.raw.height / 2};
	// convert to physical (file) coords
	lpos = this.imageToLogicalPos(ipos);
	sect = {};
	sect.bin  = Math.floor((binval1 / binval2) + 0.5);
	// sect.xcen = Math.floor(lpos.x + 0.5);
	// sect.ycen = Math.floor(lpos.y + 0.5);
	sect.xcen = Math.floor(lpos.x + 0.5*(sect.bin-1));
	sect.ycen = Math.floor(lpos.y + 0.5*(sect.bin-1));
	npos = this.maybePhysicalToImage({x: sect.xcen, y: sect.ycen});
	if( npos ){
	    sect.xcen = npos.x;
	    sect.ycen = npos.y;
	}

	sect.xdim = Math.floor(hdu.naxis1 * sect.bin);
	sect.ydim = Math.floor(hdu.naxis2 * sect.bin);
	sect.filter = this.raw.filter || "";
    }
    // allow binning relative to current, e.g., *2, /4, +1, -3
    if( typeof opts.bin === "string" ){
	// save and remove mode flag
	if( opts.bin.match(/[as]$/) ){
	    opts.binMode = opts.bin.slice(-1);
	    opts.bin = opts.bin.slice(0, -1); 
	}
	// temp binning value
	tbin = sect.bin || this.binning.bin;
	switch( opts.bin.charAt(0) ){
	case "*":
	case "x":
	case "X":
	    opts.bin = tbin * parseInt(opts.bin.slice(1), 10);
	    break;
	case "/":
	    opts.bin = tbin / parseInt(opts.bin.slice(1), 10);
	    break;
	case "+":
	    opts.bin = tbin + parseInt(opts.bin.slice(1), 10);
	    break;
	case "-":
	    opts.bin = tbin - parseInt(opts.bin.slice(1), 10);
	    break;
	case "i":
	case "I":
	    opts.bin = tbin * 2;
	    break;
	case "o":
	case "O":
	    opts.bin = tbin / 2;
	    break;
	default:
	    if( JS9.isNumber(opts.bin) ){
		opts.bin = parseInt(opts.bin, 10);
	    } else {
		JS9.error(`invalid bin for displaySection: ${opts.bin}`);
	    }
	    break;
	}
    }
    // now we can make sure opts has sensible defaults
    opts.xcen = getval3(opts.xcen, sect.xcen, 0);
    opts.ycen = getval3(opts.ycen, sect.ycen, 0);
    switch(this.imtab){
    case "table":
	opts.xdim = getval3(opts.xdim, sect.xdim, JS9.fits.options.table.xdim);
	opts.ydim = getval3(opts.ydim, sect.ydim, JS9.fits.options.table.ydim);
	opts.bin  = getval3(opts.bin,  sect.bin,  JS9.fits.options.table.bin);
	break;
    default:
	opts.xdim = getval3(opts.xdim, sect.xdim, JS9.fits.options.image.xdim);
	opts.ydim = getval3(opts.ydim, sect.ydim, JS9.fits.options.image.ydim);
	opts.bin  = getval3(opts.bin,  sect.bin,  JS9.fits.options.image.bin);
	break;
    }
    opts.binMode  = getval3(opts.binMode, sect.binMode, JS9.globalOpts.binMode);
    // final checks on binning
    // handle string bin, possibly containing explicit binMode
    if( typeof opts.bin === "string" ){
	if( opts.bin.match(/[as]$/) ){
	    opts.binMode = opts.bin.slice(-1);
	}
	opts.bin = parseInt(opts.bin, 10);
    }
    opts.bin  = Math.max(1, opts.bin || 1);
    // filter
    opts.filter = getval3(opts.filter, sect.filter, "");
    // save the filter, if necessary
    this.raw.filter = opts.filter || "";
    // start the waiting!
    if( opts.waiting !== false ){
	JS9.waiting(true, this.display);
    }
    // set status
    this.setStatus("displaySection", "processing");
    // ... start a timeout to allow the wait spinner to get started
    window.setTimeout(() => {
	// get image section
	switch(from){
	case "parentFile":
	    oproxy = this.proxyFile;
	    // parentFile: image sect. from external parent file of cur file
	    // arr is for runAnalysis, remove opts for later processing
	    arr = [];
	    arr.push({name: "xcen", value: opts.xcen});
	    delete opts.xcen;
	    arr.push({name: "ycen", value: opts.ycen});
	    delete opts.ycen;
	    arr.push({name: "xdim", value: opts.xdim});
	    arr.push({name: "ydim", value: opts.ydim});
	    // load entire image section
	    if( opts.xdim !== undefined ){ opts.xdim = 0; }
	    if( opts.ydim !== undefined ){ opts.ydim = 0; }
	    // recombine bin and binMode, if necessary
	    if( opts.binMode ){
		opts.bin = `${opts.bin}${opts.binMode}`;
		delete opts.binMode;
	    }
	    arr.push({name: "bin", value: opts.bin});
	    delete opts.bin;
	    arr.push({name: "filter", value: opts.filter || ""});
	    // hack: pass filter along so it can reach binning plugin
	    // delete opts.filter;
	    // get image section from external file
	    arr.push({name: "slice", value: opts.slice||""});
	    delete opts.slice;
	    obj = {id: this.expandMacro("$id"),
		   image: this.file,
		   fits: this.parentFile,
		   rtype: "text"};
	    obj.cmd = `js9Xeq imsection ${this.parentFile}`;
	    // if we are changing the extension, replace the old extension
	    // with the new one
	    if( opts.extension ){
		obj.cmd = obj.cmd.replace(/\[.*\]/,"");
		obj.cmd += `[${opts.extension}]`;
		delete opts.extension;
	    }
	    obj.cmd += this.expandMacro(" $xdim@$xcen,$ydim@$ycen,$bin $filter $slice", arr);
	    JS9.helper.send("imsection", obj, (r) => {
		let obj, jobj, rarr, f, pf;
		if( typeof r === "object" ){
		    // with socketio, we get an object
		    obj = r;
		} else {
		    // with cgi, we just get a text string
		    if( r.search(JS9.analOpts.epattern) >=0 ){
			obj = {stderr: r};
		    } else {
			obj = {stdout: r};
		    }
		}
		if( obj.stderr ){
		    JS9.error(obj.stderr);
		    return;
		}
		if( obj.errcode ){
		    JS9.error(`in displaySection: ${obj.errcode}`);
		    return;
		}
		// output is file and possibly parentFile
		rarr = obj.stdout.split(/\n/);
		// file
		f = JS9.cleanPath(rarr[0]);
		// relative path: add install dir prefix
		if( f.charAt(0) !== "/" ){
		    f = JS9.InstallDir(f);
		}
		// this is the proxy file (meaning: delete it on close)
		opts.proxyFile = f;
		// remove oproxy file if not the same as the current file
		if( oproxy && (oproxy !== opts.proxyFile) ){
		    this.removeProxyFile(oproxy);
		}
		// json fits info
		if( rarr[1] ){
		    try{
			jobj = JSON.parse(rarr[1]);
		    }
		    catch(ignore){
			JS9.log("couldn't parse imsection as JSON: %s", f);
			jobj = null;
		    }
		    if( jobj ){
			opts.extname = jobj.extname;
			opts.extnum = jobj.extnum;
			opts.hdus = jobj.hdus;
			opts.parent = jobj;
		    }
		}
		// look for parentFile (path relative to helper, not install)
		if( rarr[2] ){
		    pf = JS9.cleanPath(rarr[2]);
		    opts.parentFile = pf;
		}
		// hack: use LTM to determine bin/obin, since both will be 1
		opts.ltm2obin = true;
		// retrieve and display newly created image section file
		JS9.fetchURL(f, f, opts, (result) => {
		    // cleanup previous FITS file support, if necessary
		    // do this before we handle the new FITS file, or else
		    // we end up with a memory leak in the emscripten heap!
		    JS9.cleanupFITSFile(this.raw, true);
		    // start the waiting!
		    if( opts.waiting !== false ){
			JS9.waiting(true, this.display);
		    }
		    // process the newly retrieved data as FITS
		    JS9.fits.handleFITSFile(result, opts, disp);
		});
	    });
	    break;
	case "virtualFile":
	    // cleanup previous FITS file support, if necessary
	    // do this before we handle the new FITS file, or else
	    // we end up with a memory leak in the emscripten heap!
	    JS9.cleanupFITSFile(this.raw, false);
	    // extract image section from current virtual file
	    JS9.getFITSImage(hdu.fits, hdu, opts, (hdu) => {
		disp(hdu, opts);
	    });
	    break;
	default:
	    JS9.error("image section cannot be extracted from this data file");
	    break;
	}
    }, JS9.SPINOUT);
};

// display the specified extension of a multi-extension FITS file
JS9.Image.prototype.displayExtension = function(extid, opts, func){
    let i, s, got, extname, im, id;
    const dispnext = (i) => {
	let hdu;
	const topts = $.extend(true, {}, opts);
	// hdus are loaded as separate images
	topts.separate = true;
	// all done, call the supplied func, if any
	if( i === this.hdus.length ){
	    if( func ){
		try{ JS9.xeqByName(func, window, this); }
		catch(e){ JS9.error("in displayExtension callback", e, false); }
	    }
	    return;
	}
	// next hdu
	hdu = this.hdus[i];
	if( hdu.type === "image" && hdu.naxis >= 2 ){
	    // load next hdu and recurse when done
	    this.displayExtension(hdu.hdu, topts, () => { dispnext(i+1); });
	} else {
	    dispnext(i+1);
	}
    };
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse extension opts: ${opts}`, e); }
    }
    opts.waiting = false;
    // only makes sense if we have hdus
    if( !this.hdus ){
	JS9.error("no FITS HDUs found for displayExtension()");
    }
    // sanity check
    if( JS9.isNull(extid) ){
	JS9.error("missing extname/extnum for displayExtension()");
    }
    // display all extensions?
    if( extid === "all" ){
	// load all image extensions, in order, as separate images
	// we start with the first and let the call recurse
	dispnext(0);
	return;
    }
    // extname specified?
    if( typeof extid === "string" ){
	opts.extension = extid;
	extname = extid.toLowerCase();
	for(i=0, got=0; i<this.hdus.length; i++){
	    if( this.hdus[i].name &&
		this.hdus[i].name.toLowerCase() === extname ){
		got++;
		break;
	    }
	}
	if( !got ){
	    JS9.error(`no FITS HDU ${extid} for displayExtension()`);
	}
	// extnum specified?
    } else if( typeof extid === "number" ){
	opts.extension = extid;
	if( this.hdus[extid] ){
	    extname = this.hdus[extid].name || extid.toString();
	} else {
	    JS9.error(`no FITS HDU ${extid} for displayExtension()`);
	}
    }
    // if we are creating a separate file, see if we already have it
    if( opts.separate ){
	s = `[${extname}]`;
	id = this.id.replace(/\[.*\]/,"") + s;
	for(i=0, got=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( id === im.id ){
		if( $(`#${im.display.id}`).length > 0 ){
		    if( this.display.id === im.display.id ){
			got++;
			break;
		    }
		}
	    }
	}
	if( got ){
	    im.displayImage("display", opts);
	    im.display.clearMessage();
	    if( func ){
		try{ JS9.xeqByName(func, window, this); }
		catch(e){ JS9.error("in displayExtension callback", e, false); }
	    }
	    return;
	}
    }
    // cleanup previous FITS file support, if necessary
    // do this before we handle the new FITS file, or else
    // we end up with a memory leak in the emscripten heap!
    if( !opts.separate ){
	JS9.cleanupFITSFile(this.raw, false);
    }
    // process the FITS file by going to the extname/extnum
    this.displaySection(opts, func);
    // allow chaining
    return this;
};

// display the specified slice of a 3D or 4d FITS cube
JS9.Image.prototype.displaySlice = function(slice, opts, func){
    let i, topts;
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse slice opts: ${opts}`, e); }
    }
    opts.waiting = false;
    // sanity check
    if( slice === undefined ){
	JS9.error("missing slice for displaySlice()");
    }
    if( slice === "all" && this.raw.header.NAXIS === 3 ){
	// start with slice 1, already loaded
	this.displaySlice(1, topts, func);
	// load and display the other slices separately
	for(i=2; i<=this.raw.header.NAXIS3; i++){
	    topts = $.extend(true, {}, opts, {separate: true});
	    this.displaySlice(i, topts, func);
	}
    } else {
	// slicename or slicenum specified?
	if( JS9.isNumber(slice) ){
	    opts.slice = `*:*:${slice}`;
	} else {
	    opts.slice = slice;
	}
	// cleanup previous FITS file heap before handling the new FITS file,
	// or we end up with a memory leak in the emscripten heap
	JS9.cleanupFITSFile(this.raw, false);
	// process the FITS file by going to the slice
	this.displaySection(opts, func);
    }
    // allow chaining
    return this;
};

// convert current image to array
JS9.Image.prototype.toArray = function(opts){
    let i, j, k, bpe, idx, le, header, npad, arr, buf, _dbuf;
    const dbuf = this.raw.data.buffer;
    // opts is optional
    opts = opts || {};
    // always perform the header keyword fix
    opts.simple = true;
    // get header
    header = JS9.raw2FITS(this.raw, opts);
    // append padding to header now
    npad = 2880 - (header.length % 2880);
    if( npad === 2880 ){ npad = 0; }
    for(i=0; i<npad; i++){ header += " "; }
    // calculate padding for data for later
    npad = 2880 - (dbuf.byteLength % 2880);
    if( npad === 2880 ){ npad = 0; }
    // make an array buffer to hold the whole FITS file
    arr = new ArrayBuffer(header.length + dbuf.byteLength + npad);
    // and a view of the array to manipulate
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

// convenience routine: should we align by WCS?
JS9.Image.prototype.wcsAlign = function(){
    return this.wcsim                          &&
	   this.params.wcsalign                &&
	   (this.display === this.wcsim.display);
};

// get pan location
JS9.Image.prototype.getPan = function(){
    const sect = this.rgb.sect;
    let x = (sect.x0 + sect.x1) / 2;
    let y = (sect.y0 + sect.y1) / 2;
    if( JS9.notNull(sect.ix) ){
	x += sect.ix / (2 * sect.zoom);
    }
    if( JS9.notNull(sect.iy) ){
	y += sect.iy / (2 * sect.zoom);
    }
    return {x: x, y: y, ox: sect.xcen, oy: sect.ycen,
	    x0: sect.x0, y0: sect.y0, x1: sect.x1, y1: sect.y1,
	    ix: sect.ix||0, iy: sect.iy||0};
};

// set pan location of RGB image (using image coordinates)
JS9.Image.prototype.setPan = function(...args){
    let i, key, obj, im, pos, owcssys, txeq, arr, oval, npan;
    let [panx, pany] = args;
    // is this core service disabled?
    if( $.inArray("pan", this.params.disable) >= 0 ){
	return;
    }
    // default is to pan to center
    if( args.length === 0 ){
	panx = this.raw.width / 2;
	pany = this.raw.height / 2;
    }
    // one string arg is a json specification
    // (two string args is panx, pany in string format)
    if( args.length === 1 && typeof panx === "string" ){
	if( panx === "mouse" && this.ipos ){
	    panx = this.ipos.x;
	    pany = this.ipos.y;
	} else {
	    try{ panx = JSON.parse(panx); }
	    catch(e){ JS9.error(`can't parse setPan JSON: ${panx}`, e); }
	}
    }
    if( typeof panx === "object" ){
	obj = panx;
	// passing an object supports image, physical, wcs coordinates
	if( JS9.notNull(obj.x) && JS9.notNull(obj.y) ){
	    // image coords
	    panx = obj.x;
	    pany = obj.y;
	}
	if( JS9.notNull(obj.px) && JS9.notNull(obj.py) ){
	    // physical coords
	    pos = this.logicalToImagePos({x: obj.px, y: obj.py});
	    panx = pos.x;
	    pany = pos.y;
	}
	if( typeof obj.wcs === "string" ){
	    // wcs string: ra dec [wcssys]
            arr = obj.wcs.trim().split(/ +/);
            obj.ra  = arr[0];
            obj.dec = arr[1];
            if( arr.length >= 3 ){
		obj.wcssys = arr[2];
            }
	}
	if( JS9.notNull(obj.ra) && JS9.notNull(obj.dec) &&
	    (this.raw.wcs > 0) ){
	    // wcs coords
	    // use supplied wcs, if necessary
	    if( obj.wcssys ){
		owcssys = this.getWCSSys();
		txeq = JS9.globalOpts.xeqPlugins;
		JS9.globalOpts.xeqPlugins = false;
		this.setWCSSys(obj.wcssys);
	    }
	    // convert wcs supplied as strings
	    if( typeof obj.ra === "string" ){
		obj.ra = JS9.saostrtod(obj.ra);
		if( (String.fromCharCode(JS9.saodtype()) === ":") &&
		    (this.params.wcssys !== "galactic" )          &&
		    (this.params.wcssys !== "ecliptic" )          ){
		    obj.ra *= 15.0;
		}
	    }
	    if( typeof obj.dec === "string" ){
		obj.dec = JS9.saostrtod(obj.dec);
	    }
	    // convert to image coords
	    arr = JS9.wcs2pix(this.raw.wcs, obj.ra, obj.dec)
		.trim().split(/ +/);
	    panx = parseFloat(arr[0]);
	    pany = parseFloat(arr[1]);
	    // restore original wcssys
	    if( owcssys ){
		this.setWCSSys(owcssys);
		JS9.globalOpts.xeqPlugins = txeq;
	    }
	}
    }
    // generate section from new image coords
    if( !JS9.isNumber(panx) || !JS9.isNumber(pany) ){
	JS9.error(`invalid input for setPan: ${panx} ${pany}`);
    }
    if( this.wcsAlign() || this.isawcsim ){
	oval = JS9.globalOpts.panWithinDisplay;
	JS9.globalOpts.panWithinDisplay = true;
    }
    this.mkSection(panx, pany);
    // set pan for aligned images, if necessary
    if( this.wcsAlign() || this.isawcsim ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im !== this)                                &&
		(im.display === this.display)                &&
		(im.wcsim  === this ||
                 this.wcsim === im  ||
                 (im.wcsim && (im.wcsim === this.wcsim)))    &&
		(im.params.wcsalign || this.params.wcsalign) ){
		npan = JS9.pix2pix(this, im, {x: panx, y: pany});
		im.mkSection(npan.x, npan.y);
	    }
	}
	JS9.globalOpts.panWithinDisplay = oval;
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
    let ozoom, nzoom;
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
	    nzoom = Math.min(this.display.width/this.raw.width, this.display.height/this.raw.height);
	    // a little rounding makes the zoom nicer
	    nzoom = Math.round((nzoom + 0.0000001) * 1000000) / 1000000;
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
    let i, nzoom, key, im, ipos, oval;
    // is this core service disabled?
    if( $.inArray("zoom", this.params.disable) >= 0 ){
	return;
    }
    nzoom = this.parseZoom(zval);
    if( !nzoom ){
	JS9.error(`invalid input for setZoom: ${zval}`);
    }
    if( this.wcsAlign() || this.isawcsim ){
	oval = JS9.globalOpts.panWithinDisplay;
	JS9.globalOpts.panWithinDisplay = true;
    }
    // remake section
    this.mkSection(nzoom);
    // set zoom for aligned images, if necessary
    if( this.wcsAlign() || this.isawcsim ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im !== this)                                &&
		(im.display === this.display)                &&
		(im.wcsim  === this ||
                 this.wcsim === im  ||
                 (im.wcsim && (im.wcsim === this.wcsim)))    &&
		(im.params.wcsalign || this.params.wcsalign) ){
		ipos = JS9.pix2pix(this, im, this.getPan());
		im.mkSection(ipos.x, ipos.y, nzoom);
	    }
	}
	JS9.globalOpts.panWithinDisplay = oval;
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

// align an image to a target image in terms of pan and zoom values,
// also taking into account relative cdelt1 pixel sizes
// not taken into account: flips and rotations
// eslint-disable-next-line no-unused-vars
JS9.Image.prototype.alignPanZoom = function(im, opts){
    let tim, icen, iwcsinfo, izoom, wcsinfo;
    // sanity check
    if( !im ){ return; }
    // is im a string containing an image name?
    if( typeof im === "string" ){
	tim = JS9.getImage(im);
	if( tim ){
	    // it was an image name, so change im to the image handle
	    im = tim;
	} else {
	    JS9.error(`unknown image for alignPanZoom: ${im}`);
	}
    }
    // opts is optional (not used ... yet)
    opts = opts || {};
    wcsinfo  = this.raw.wcsinfo || {cdelt1: 1};
    iwcsinfo = im.raw.wcsinfo   || {cdelt1: 1};
    // get center of target image
    icen = im.getPan();
    // pan this image to center of target
    this.setPan(JS9.pix2pix(im, this, {x: icen.ox, y: icen.oy}));
    // get zoom of target image
    izoom = im.rgb.sect.zoom || 1;
    // adjust zoom of this image taking, into account pixel size, target zoom
    this.setZoom(izoom * wcsinfo.cdelt1 / iwcsinfo.cdelt1);
    // allow chaining
    return this;
};

// get flip state
JS9.Image.prototype.getFlip = function(){
    return this.params.flip;
};

// flip image along an axis
JS9.Image.prototype.setFlip = function(flip){
    let hdu, table;
    const opts = {};
    // sanity check
    if( !this || !this.raw || !this.raw.hdu || !this.raw.hdu.fits ){
	JS9.error("invalid image for setFlip");
    }
    // null argument resets the flip state
    flip = flip || "none";
    // so conversion to lowercase does not fail
    if( typeof flip !== "string" ){
	JS9.error("invalid flip type for setFlip");
    }
    // set flip state
    switch(flip.toLowerCase()){
    case "x":
    case "y":
    case "xy":
	this.params.flip = flip;
	break;
    case "none":
    case "reset":
	this.params.flip = "none";
	break;
    default:
	JS9.error(`unknown flip type for setFlip: ${flip}`);
	break;
    }
    // set flip state
    opts.flip = this.params.flip;
    // get virual dimensions, since we will use the virtual file only
    opts.from =  "virtualFile";
    // default is to take all we can get
    opts.xcen = this.raw.width/2;
    opts.ycen = this.raw.height/2;
    opts.xdim = this.raw.width;
    opts.ydim = this.raw.height;
    // but we might be able to do better for tables
    if( !this.parentFile && this.raw.hdu ){
	hdu = this.raw.hdu;
	if( this.imtab === "table" && hdu.table ){
	    table = hdu.table;
	    if( table.xcen && table.ycen && table.xdim && table.ydim ){
		opts.bin =  Math.floor(table.bin||1);
		opts.xcen = Math.floor(table.xcen);
		opts.ycen = Math.floor(table.ycen);
		opts.xdim = Math.floor(table.xdim);
		opts.ydim = Math.floor(table.ydim);
		opts.filter = table.filter || "";
	    }
	} else if( this.imtab === "image" ){
	    if( hdu.x1 && hdu.x2 && hdu.y1 && hdu.y2 ){
		opts.xdim = Math.floor(hdu.naxis1);
		opts.ydim = Math.floor(hdu.naxis2);
		opts.xcen = Math.floor((hdu.x1 + hdu.x2) / 2);
		opts.ycen = Math.floor((hdu.y1 + hdu.y2) / 2);
		opts.bin = 1;
	    }
	}
    }
    // flip is actually a call to display a section, using the virtual file
    return this.displaySection(opts);
};

// refresh all layers
JS9.Image.prototype.refreshLayers = function(){
    this.setZoom(this.getZoom());
    // reset these explicitly after refresh
    this.binning.obin = this.binning.bin;
    this.rgb.sect.ozoom = this.rgb.sect.zoom;
};

// return current file-related position for specified image position
JS9.Image.prototype.imageToLogicalPos = function(ipos, lcs){
    let arr, rot, tx, ty, cx, cy, dval;
    let osys = "image";
    const opos = {x: ipos.x, y: ipos.y};
    lcs = lcs || this.params.lcs || "image";
    switch(lcs){
    case "image":
	break;
    case "physical":
	if( this.lcs.physical ){
	    osys = lcs;
	    arr = this.lcs.physical.reverse;
	    rot = this.lcs.physical.rrot;
	    cx = this.lcs.physical.cx;
	    cy = this.lcs.physical.cy;
	}
	break;
    case "detector":
	if( this.lcs.detector ){
	    osys = lcs;
	    arr = this.lcs.detector.reverse;
	    rot = this.lcs.detector.rrot;
	    cx = this.lcs.detector.cx;
	    cy = this.lcs.detector.cy;
	}
	break;
    case "amplifier":
	if( this.lcs.amplifier ){
	    osys = lcs;
	    arr = this.lcs.amplifier.reverse;
	    rot = this.lcs.amplifier.rrot;
	    cx = this.lcs.amplifier.cx;
	    cy = this.lcs.amplifier.cy;
	}
	break;
    }
    if( arr ){
	opos.x = ipos.x * arr[0][0] + ipos.y * arr[1][0] + arr[2][0];
	opos.y = ipos.x * arr[0][1] + ipos.y * arr[1][1] + arr[2][1];
	if( rot ){
	    tx = cx + (opos.x - cx) * rot[0][0] + (opos.y - cy) * rot[1][0] +
		rot[2][0];
	    ty = cy + (opos.x - cx) * rot[0][1] + (opos.y - cy) * rot[1][1] +
		rot[2][1];
	    opos.x = tx;
	    opos.y = ty;
	}
	// for tables, incorporate tlmin into physical coords
	// the tlmin value is saved by jsfitio as tabmin
	if( this.imtab === "table" ){
	    dval = this.raw.bitpix < 0 ? 0.5 : 1;
	    if( this.raw.header.TABMIN1 !== undefined ){
		opos.x = opos.x - dval + this.raw.header.TABMIN1;
	    }
	    if( this.raw.header.TABMIN2 !== undefined ){
		opos.y = opos.y - dval + this.raw.header.TABMIN2;
	    }
	}
    }
    return {x: opos.x, y: opos.y, sys: osys};
};

// return current image position from file-related position
JS9.Image.prototype.logicalToImagePos = function(lpos, lcs){
    let arr, rot, tx, ty, cx, cy, dval;
    const opos = {x: lpos.x, y: lpos.y};
    cx = this.raw.header.CRPIX1 || 1;
    cy = this.raw.header.CRPIX2 || 1;
    lcs = lcs || this.params.lcs || "image";
    switch(lcs){
    case "image":
	break;
    case "ophysical":
	if( this.lcs.ophysical ){
	    arr = this.lcs.ophysical.forward;
	    rot = this.lcs.ophysical.frot;
	} else if( this.lcs.physical ){
	    arr = this.lcs.physical.forward;
	    rot = this.lcs.physical.frot;
	}
	break;
    case "physical":
	if( this.lcs.physical ){
	    arr = this.lcs.physical.forward;
	    rot = this.lcs.physical.frot;
	}
	break;
    case "detector":
	if( this.lcs.detector ){
	    arr = this.lcs.detector.forward;
	    rot = this.lcs.detector.frot;
	}
	break;
    case "amplifier":
	if( this.lcs.amplifier ){
	    arr = this.lcs.amplifier.forward;
	    rot = this.lcs.amplifier.frot;
	}
	break;
    }
    if( arr ){
	// for tables, incorporate tlmin into physical coords
	// the tlmin value is saved by jsfitio as tabmin
	if( this.imtab === "table" ){
	    dval = this.raw.bitpix < 0 ? 0.5 : 1;
	    if( this.raw.header.TABMIN1 !== undefined ){
		lpos.x = lpos.x - this.raw.header.TABMIN1 + dval;
	    }
	    if( this.raw.header.TABMIN2 !== undefined ){
		lpos.y = lpos.y - this.raw.header.TABMIN2 + dval;
	    }
	}
	opos.x = lpos.x * arr[0][0] + lpos.y * arr[1][0] + arr[2][0];
	opos.y = lpos.x * arr[0][1] + lpos.y * arr[1][1] + arr[2][1];
	if( rot ){
	    tx = cx + (opos.x - cx) * rot[0][0] + (opos.y - cy) * rot[1][0] +
		rot[2][0];
	    ty = cy + (opos.x - cx) * rot[0][1] + (opos.y - cy) * rot[1][1] +
		rot[2][1];
	    opos.x = tx;
	    opos.y = ty;
	}
    }
    return opos;
};

// return 1-indexed image coords for specified 0-indexed display position
JS9.Image.prototype.displayToImagePos = function(dpos){
    let x, y;
    const sect = this.rgb.sect;
    const iheight = this.rgb.img.height;
    // see funtools/funcopy.c/_FunCopy2ImageHeader
    x = (dpos.x - this.ix + 0.5) / sect.zoom + sect.x0 + 0.5;
    y = (iheight - (dpos.y - this.iy + 0.5)) / sect.zoom + sect.y0 + 0.5;
    return {x, y};
};

// return 0-indexed display coords for specified 1-indexed image position
JS9.Image.prototype.imageToDisplayPos = function(ipos){
    let x, y;
    const sect = this.rgb.sect;
    const iheight = this.rgb.img.height;
    // see funtools/funcopy.c/_FunCopy2ImageHeader
    x = (((ipos.x - 0.5) - sect.x0) * sect.zoom) + this.ix - 0.5;
    y = (sect.y0 - (ipos.y - 0.5)) * sect.zoom + iheight + this.iy - 0.5;
    return {x, y};
};

// return 0-indexed display pos from 1-indexed logical pos
JS9.Image.prototype.logicalToDisplayPos = function(lpos, lcs, mode){
    return this.imageToDisplayPos(this.logicalToImagePos(lpos, lcs, mode));
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
    let s, u;
    // is this core service disabled?
    if( $.inArray("wcs", this.params.disable) >= 0 ){
	return;
    }
    if( wcssys === "image" ){
	this.params.wcssys = "image";
	this.params.wcsunits = "pixels";
	JS9.wcsunits.image = "pixels";
    } else if( wcssys === "physical" ){
	this.params.wcssys = "physical";
	this.params.wcsunits = "pixels";
	JS9.globalOpts.wcsUnits.physical = "pixels";
    } else if( this.raw.wcs && (this.raw.wcs > 0) ){
	// native: original wcs from file
	if( wcssys === "native" ){
	    wcssys = this.params.wcssys0;
	}
	// set wcs system
	s = JS9.wcssys(this.raw.wcs, wcssys);
	if( s ){
	    // store new wcs system param
	    this.params.wcssys = s.trim();
	    // get units associated with this wcs system
	    u = JS9.globalOpts.wcsUnits[this.params.wcssys] || "sexagesimal";
	    // set the units
	    this.setWCSUnits(u);
	}
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetwcssys");
    }
    // allow chaining
    return this;
};

// init wcs
JS9.Image.prototype.initWCS = function(header){
    let alt, key, varr, s;
    const awcs = /(WCSNAME|WCSAXES|CRVAL[0-9]|CRPIX[0-9]|PC[0-9]_[0-9]|CDELT[0-9]|CD[0-9]_[0-9]|CTYPE[0-9]|CUNIT[0-9]|CRVAL[0-9]|PV[0-9]_[0-9]|PS[0-9]_[0-9]|RADESYS|LONPOLE|LATPOLE)([A-Z])/;
    if( !this.raw.header ){
	return this;
    }
    // usually it's the raw header
    header = header || this.raw.header;
    // clean up old wcs
    this.freeWCS();
    // init object to hold alt wcs objects
    this.raw.altwcs = {};
    // set up the default wcs, using the original header params
    alt = "default";
    this.raw.altwcs[alt] = {};
    this.raw.altwcs[alt].header = header;
    // look for wcs alternates
    // see: http://www.atnf.csiro.au/people/mcalabre/WCS/wcs.pdf
    for( key in header ){
	if( header.hasOwnProperty(key) ){
	    // is it an alt wcs keyword?
	    varr = key.match(awcs);
	    if( varr && varr.length ){
		// this is the A-Z version
		alt = varr[2];
		// init the alt wcs object, if necessary
		if( !this.raw.altwcs[alt] ){
		    this.raw.altwcs[alt] = {};
		    // start with original header
		    this.raw.altwcs[alt].header = $.extend({}, header);
		}
		// wcslib seems to want "RADECSYS", not "RADESYS"
		if( varr[1] === "RADESYS" ){
		    varr[1] = "RADECSYS";
		}
		// overwrite standard keyword in header with the alt value
		this.raw.altwcs[alt].header[varr[1]] = header[varr[0]];
	    }
	}
    }
    // init all of the wcs's we found
    for( key in this.raw.altwcs ){
	// loop through alt wcs objects
	if( this.raw.altwcs.hasOwnProperty(key) ){
	    s = JS9.raw2FITS(this.raw.altwcs[key].header);
	    this.raw.altwcs[key].wcs = JS9.initwcs(s);
	    // get info about the wcs
	    if( this.raw.altwcs[key].wcs > 0 ){
		try{ this.raw.altwcs[key].wcsinfo =
		     JSON.parse(JS9.wcsinfo(this.raw.altwcs[key].wcs)); }
		catch(ignore){ /* empty */ }
	    }
	}
    }
    // set current wcs to the default
    this.setWCS("default");
    // allow chaining
    return this;
};

// close and free wcs resources
JS9.Image.prototype.freeWCS = function(raw){
    let key;
    // raw defaults to ... default raw
    raw = raw || this.raw;
    if( raw.altwcs ){
	// free all wcs structures
	for( key in raw.altwcs ){
	    // loop through alt wcs objects
	    if( raw.altwcs.hasOwnProperty(key) ){
		if( raw.altwcs[key].wcs > 0 ){
		    JS9.freewcs(raw.altwcs[key].wcs);
		    raw.altwcs[key].wcs = null;
		}
	    }
	}
    }
};

// get name of current wcs (from among the alternates)
JS9.Image.prototype.getWCS = function(){
    let key, obj;
    // loop through wcs objects, looking for a match
    for( key in this.raw.altwcs ){
	if( this.raw.altwcs.hasOwnProperty(key) ){
	    if( this.raw.wcs === this.raw.altwcs[key].wcs ){
		obj = $.extend(true, {}, this.raw.altwcs[key].wcsinfo);
		obj.version = key;
		obj.wcsname = this.raw.altwcs[key].header.WCSNAME;
		return obj;
	    }
	}
    }
    return null;
};

// set wcs to default or one of the alternative versions
JS9.Image.prototype.setWCS = function(version){
    let key, wcsname, wcssys;
    version = version || "default";
    // sanity check
    if( !this.raw || !this.raw.altwcs ){
	return this;
    }
    // loop through wcs objects, looking for a match
    for( key in this.raw.altwcs ){
	if( this.raw.altwcs.hasOwnProperty(key) ){
	    wcsname = this.raw.altwcs[key].header.WCSNAME;
	    if( (version === key) || (version === wcsname) ){
		// make sure its a valid wcs
		if( this.raw.altwcs[key].wcs <= 0 ){
		    JS9.error("invalid WCS for version: %s", version);
		}
		// set this wcs up as the current one
		this.raw.wcs = this.raw.altwcs[key].wcs;
		// get info about the wcs
		this.raw.wcsinfo = this.raw.altwcs[key].wcsinfo;
		// look for a good wcssys
		if( this.raw.wcsinfo && this.raw.wcsinfo.radecsys ){
		    wcssys = this.raw.wcsinfo.radecsys;
		} else {
		    if( this.params.wcssys !== "native" ){
			wcssys = this.params.wcssys.trim();
		    } else {
			wcssys = this.params.lcs;
		    }
		}
		// set the wcs system
		this.setWCSSys(wcssys);
		// this is also the default
		if( !this.params.wcssys0 ){
		    this.params.wcssys0 = wcssys;
		}
		// set the wcs units
		this.setWCSUnits(this.params.wcsunits);
		// all done
		return this;
	    }
	}
    }
    // didn't find it
    JS9.error(`could not find WCS version: ${version}`);
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
    let s, ws;
    // is this core service disabled?
    if( $.inArray("wcs", this.params.disable) >= 0 ){
	return;
    }
    if( wcsunits === "pixels" ){
	this.params.wcssys = "physical";
	this.params.wcsunits = "pixels";
	JS9.globalOpts.wcsUnits[this.params.wcssys] = "pixels";
    } else if( this.raw.wcs && (this.raw.wcs > 0) ){
	if( (this.params.wcssys === "image")    ||
	    (this.params.wcssys === "physical") ){
	    ws = JS9.imageOpts.wcssys;
	    this.setWCSSys(this.raw.wcs, ws);
	}
	s = JS9.wcsunits(this.raw.wcs, wcsunits);
	if( s ){
	    this.params.wcsunits = s.trim();
	    JS9.globalOpts.wcsUnits[this.params.wcssys] = this.params.wcsunits;
	}
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetwcsunits");
    }
    // allow chaining
    return this;
};

// notify the helper a new image was displayed
JS9.Image.prototype.notifyHelper = function(){
    let basedir, image1, image2;
    const imexp = new RegExp(`^${JS9.ANON}[0-9]*`);
    const installexp = JS9.INSTALLDIR ? new RegExp(`^${JS9.INSTALLDIR}`) : null;
    // notify the helper
    if( JS9.helper.connected && !this.file.match(imexp) ){
	switch(JS9.helper.type){
	case "get":
	case "post":
	    // get pageid from CGI helper (socket.io does this when connecting)
	    if( !JS9.helper.pageid ){
		JS9.helper.send("pageid", null, (s) => {
		    if( s && s.trim().match(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/) ){
			JS9.helper.pageid = s;
			JS9.helper.js9helper = "js9helper";
		    }
		});
		break;
	    }
	}
	// get helper info about this image
	// but also try removing part of path which gets to install dir
	image1 = this.file;
	if( image1.charAt(0) !== "/" && installexp ){
	    image2 = this.file.replace(installexp, "");
	}
	JS9.helper.send("image", {"image": image1, "image2": image2}, (res) => {
	    let rstr, r, s, cc, regexp;
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
	    // returns: [file, path, wcs]
	    // split args, dealing with spaces inside brackets
	    r = rstr.trim().match(/(?:[^\s[]+|\[[^\]]*\])+/g);
	    s = r[1];
	    if( s !== "?" ){
		if( !JS9.globalOpts.dataDir ){
		    this.fitsFile = s;
		    // prepend base of png path if fits file has no path
		    // is this a bad "feature" in tpos?? probably ...
		    if( !this.fitsFile.includes("/") ){
			basedir = this.file.match( /.*\// );
			// but don't add installdir as part of prefix
			// (fitsFile path is relative to the js9 directory)
			if( basedir && basedir.length ){
			    regexp = new RegExp(`^${JS9.INSTALLDIR}`);
			    basedir = basedir[0].replace(regexp, "");
			    this.fitsFile =  basedir + this.fitsFile;
			}
		    }
		    // prepend JS9_DIR on files if fits is not absolute
		    if( JS9.globalOpts.prependJS9Dir ){
			if( this.fitsFile &&
			    !this.fitsFile.match(/^\${JS9_DIR}/) &&
			    this.fitsFile.charAt(0) !== "/" ){
			    this.fitsFile = `\${JS9_DIR}/${this.fitsFile}`;
			}
			if( this.parentFile &&
			    !this.parentFile.match(/^\${JS9_DIR}/) &&
			    this.parentFile.charAt(0) !== "/" ){
			    this.parentFile = `\${JS9_DIR}/${this.parentFile}`;
			}
		    }
		} else {
		    cc = s.lastIndexOf("/") + 1;
		    this.fitsFile = `${JS9.globalOpts.dataDir}/${s.slice(cc)}`;
		}
		if( JS9.DEBUG > 1 ){
		    JS9.log("JS9 fitsFile: %s %s", this.file, this.fitsFile);
		}
	    }
	    if( this.fitsFile ){
		this.fitsFile = JS9.cleanPath(this.fitsFile);
	    }
	    if( this.parentFile ){
		this.parentFile = JS9.cleanPath(this.parentFile);
	    }
	    // first time through, query the helper for info
	    if( !this.queried ){
		this.queryHelper("all");
		this.queried = true;
	    }
	});
    }
    // allow chaining
    return this;
};

// ask helper for various types of information
JS9.Image.prototype.queryHelper = function(which){
    const what = which || "all";
    // query the helper
    if( JS9.helper.connected ){
	if( (what === "all") || (what === "getAnalysis") ){
	    // only retrieve analysis tasks once per image
	    if( !this.analysisPackages ){
		JS9.helper.send("getAnalysis", {"fits": this.fitsFile}, (s) => {
		    if( s ){
			try{ this.analysisPackages = JSON.parse(s); }
			catch(e){ JS9.log("can't get analysis", e); }
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
    let cmd, olen;
    // sanity check
    if( !s ){
	return;
    }
    // process each $ token
    // eslint-disable-next-line no-unused-vars
    cmd = s.replace(/\${?([a-zA-Z][a-zA-Z0-9_()]+)}?/g, (m, t, o) => {
	let i, r, owcssys, pos;
	// called in image context
	const savewcs = (wcssys) => {
	    const owcs = this.params.wcssys;
	    if( wcssys ){
		switch(wcssys){
		case "wcs":
		    if( (owcs === "physical") || (owcs === "image") ){
			this.params.wcssys = this.params.wcssys0;
		    }
		    break;
		case "physical":
		case "image":
		    this.params.wcssys = wcssys;
		    break;
		default:
		    break;
		}
	    }
	    return owcs;
	};
	const restorewcs = (wcssys) => {
	    if( wcssys ){
		this.params.wcssys = wcssys;
	    }
	};
	const withext = (r) => {
	    let e;
	    // for tables, we might need to add the binning filter
	    if( this.imtab === "table" ){
		if( this.raw.hdu.table.filter &&
		    !r.match(this.raw.hdu.table.filter) ){
		    if( r.match(/\]\[/) ){
			r = `${r.slice(0,-1)}&&${this.raw.hdu.table.filter}]`;
		    } else {
			r += `[${this.raw.hdu.table.filter}]`;
		    }
		}
	    } else if( this.imtab === "image" ){
		// for images, we might need to add/replace extension info
		e = this.file.match(/\[.*\]/);
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
	const u = t.split("(");
	if( u[1] ){
	    u[1] = u[1].replace(/\)$/, "");
	}
	switch(u[0]){
	case "id":
	    r = this.display.divjq.attr("id");
	    break;
	case "image":
	case "png":
	    r = this.id;
	    break;
	case "filename":
	    if( this.parentFile && (u[1] !== "this") ){
		// if a filter is defined, add it
		if( this.raw && this.raw.filter ){
		    r = this.parentFile;
		    // assume parent is a table with EVENTS
		    if( !r.match(/\[.*\]/) ){ r += '[EVENTS]'; }
		    r += `[${this.raw.filter}]`;
		} else {
		    r = withext(this.parentFile);
		}
	    } else if( this.fitsFile ){
		r = withext(this.fitsFile);
	    } else {
		JS9.error(`no FITS file for ${this.id}`);
	    }
	    break;
	case "fits":
	    if( !this.fitsFile ){
		JS9.error(`no FITS file for ${this.id}`);
	    }
	    r = withext(this.fitsFile);
	    break;
	case "parent":
	    if( !this.parentFile ){
		JS9.error(`no parent FITS file for ${this.id}`);
	    }
	    r = this.parentFile;
	    break;
	case "ext":
	    if( this.fitsFile ){
		r = this.fitsFile.match(/\[.*\]/);
		if( r === null ){
		    r = "";
		}
	    } else {
		JS9.error(`no FITS file for ${this.id}`);
	    }
	    break;
	case "imcenter":
	    pos = this.displayToLogicalPos({x: this.display.width/2,
					    y: this.display.height/2});
	    r = `${pos.x},${pos.y}`;
	    break;
	case "wcscenter":
	    pos = this.displayToImagePos({x: this.display.width/2,
					  y: this.display.height/2});
	    r = JS9.pix2wcs(this.raw.wcs, pos.x, pos.y).replace(/\s+/g, ",");
	    break;
	case "sregions":
	    owcssys = savewcs(u[1]);
	    r = this.listRegions("source", {mode: 0}).replace(/\s+/g,"");
	    restorewcs(owcssys);
	    break;
	case "bregions":
	    owcssys = savewcs(u[1]);
	    r = this.listRegions("background", {mode: 0}).replace(/\s+/g,"");
	    restorewcs(owcssys);
	    break;
	case "regions":
	    owcssys = savewcs(u[1]);
	    r = this.listRegions("all", {mode: 0}).replace(/\s+/g,"");
	    restorewcs(owcssys);
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
	    }
	    // if all else fails, return original macro unexpanded
	    if( r === undefined ){
		r = m;
	    }
	    break;
	}
	return r;
    });
    return cmd;
};

// lookup an analysis command by name
JS9.Image.prototype.lookupAnalysis = function(name){
    let i, j, tasks;
    let a = null;
    // look for the named analysis task
    if( this.analysisPackages ){
	// look for xclass:name
	for(j=0; j<this.analysisPackages.length && !a; j++){
	    tasks = this.analysisPackages[j];
	    for(i=0; i<tasks.length; i++){
		// the analysis command we are using
		a = tasks[i];
		if( a.xclass && ((`${a.xclass}:${a.name}`) === name) ){
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

// validate a task against rules contained in the files parameter
JS9.Image.prototype.validateAnalysis = function(atask){
    let s, parr;
    const imexp = /imVar\((.*),(.*)\)/;
    const js9exp = /js9Var\((.*),(.*)\)/;
    const parexp = /fitsHeader\(([A-Za-z0-9_]+),(.*)\)/;
    const winexp = /winVar\((.*),(.*)\)/;
    const seq = (s1, s2) => {
	if( !s1 || !s2 ){
	    return false;
	}
	return String(s1).toUpperCase() === String(s2).toUpperCase();
    };
    // sanity check
    if( !atask.title || !atask.name ){
	return false;
    }
    // is this task hidden?
    if( atask.hidden ){
	return false;
    }
    // file validators
    if( atask.files ){
	if( atask.files.match(/^fits$/) &&
	    !this.fitsFile ){
	    return false;
	}
	if( atask.files.match(/^png$/) &&
	    (this.source !== "fits2png") ){
	    return false;
	}
	if( atask.files.match(/^table$/) ){
	    if( this.imtab !== "table" ){
		return false;
	    }
	}
	if( atask.files.match(/^image$/) ){
	    if( this.imtab !== "image" ){
		return false;
	    }
	}
	// header params: fitsHeader(pname,pvalue)
	parr = atask.files.match(parexp);
	if( parr ){
	    s = this.raw.header[parr[1].toUpperCase()];
	    if( !seq(s, parr[2]) ){
		return false;
	    }
	}
	// win vars: winVar(name,value)
	parr = atask.files.match(winexp);
	if( parr ){
	    s = JS9.varByName(parr[1], window);
	    if( !seq(s, parr[2]) ){
		return false;
	    }
	}
	// js9 vars: js9Var(name,value)
	parr = atask.files.match(js9exp);
	if( parr ){
	    s = JS9.varByName(parr[1], JS9);
	    if( !seq(s, parr[2]) ){
		return false;
	    }
	}
	// im vars: imVar(name,value)
	parr = atask.files.match(imexp);
	if( parr ){
	    s = JS9.varByName(parr[1], this);
	    if( !seq(s, parr[2]) ){
		return false;
	    }
	}
    } // end of file validators
    return true;
};

// return object containing analysis task definitions
JS9.Image.prototype.getAnalysis = function(){
    let i, j, t, tasks;
    const obj = [];
    // sanity check
    if( !this.analysisPackages ){
	return obj;
    }
    // return validated tasks
    for(j=0; j<this.analysisPackages.length; j++){
	tasks = this.analysisPackages[j];
	for(i=0; i<tasks.length; i++){
	    t = tasks[i];
	    if( this.validateAnalysis(t) ){
		obj.push(t);
	    }
	}
    }
    return obj;
};

// execute analysis task
JS9.Image.prototype.runAnalysis = function(name, opts, func){
    let i, a, m, ropts;
    let obj = {};
    const analError = (s, t) => {
	// shouldn't happen
	if( !JS9.helper ){
	    JS9.error(s, t);
	}
	switch(JS9.helper.type){
	case 'nodejs':
	case 'socket.io':
	    // when socket.io is long-polling, throwing an error prevent the
	    // polling from completing, leading to a timeout error and disaster.
	    // to allow the polling to complete, throw the error after a delay
	    if( JS9.helper.socket &&
		JS9.helper.socket.io.engine.transport.name === "polling"){
		window.setTimeout(() => {
		    JS9.error(s, t);
		}, 0);
	    } else {
		JS9.error(s, t);
	    }
	    break;
	default:
	    JS9.error(s, t);
	    break;
	}
    };
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse analysis opts: ${opts}`, e); }
    }
    // func can be passed, or it can be global
    func = func || JS9.globalOpts.analysisFunc;
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
	JS9.error(`could not find analysis task: ${name}`);
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
	    obj.keys[a.keys[i]] = this.expandMacro(`$${a.keys[i]}`, opts);
	}
    }
    // add some needed parameters
    obj.id = this.expandMacro("$id");
    obj.image = this.file;
    obj.fits = this.fitsFile;
    obj.rtype = a.rtype;
    // For socket.io communication, we have flattened the message space so
    // each analysis tool utilizes its own message. This allows easier addition
    // of non-exec'ed, in-line analysis. The cgi support utilizes the
    // 'runAnalysis' message to exec a task (there are no in-line additions)
    switch(JS9.helper.type){
    case 'nodejs':
    case 'socket.io':
	m = a.xclass ? (`${a.xclass}:${a.name}`) : a.name;
	break;
    default:
	m = "runAnalysis";
	break;
    }
    // ask the helper to run the command
    // change the cursor to show the waiting status
    JS9.waiting(true, this.display);
    // set status
    this.setStatus("runAnalysis", "processing");
    JS9.helper.send(m, obj, (r) => {
	let s, robj, f, pf, xobj, files;
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
	// if a processing func was supplied, call it and don't display
	if( func ){
	    func.call(this, robj.stdout, robj.stderr, robj.errcode, a);
	} else {
	    // handle errors before we start
	    if( robj.stderr ){
		s = robj.stderr;
		// if its only a warning, log it
		if( (s.search(/WARNING:/i) >= 0) && (s.search(/ERROR:/i) < 0) ){
		    JS9.log(s);
		} else {
		    // otherwise, throw an error
		    analError(s, JS9.analOpts.epattern);
		    return;
		}
	    } else if( robj.errcode ){
		s = `ERROR: running ${a.name} [${robj.errcode}]`;
		// not sure what this means, so just log it if stdout exists
		if( robj.stdout ){
		    JS9.log(s);
		} else {
		    // otherwise, throw an error
		    analError(s, JS9.analOpts.epattern);
		    return;
		}
	    }
	    // display according to type
	    switch(a.rtype){
	    case "text":
	    case undefined:
		this.displayAnalysis("text", robj.stdout,
				     {divid: JS9.globalOpts.analysisDiv});
		break;
	    case "plot":
		this.displayAnalysis("plot", robj.stdout,
				     {divid: JS9.globalOpts.analysisDiv});
		break;
	    case "alert":
		if( robj.stdout ){
		    alert(robj.stdout);
		}
		break;
	    case "fits":
	    case "png":
		// output is file and possibly parentFile
		files = robj.stdout.split(/\s+/);
		if( files && files[0] ){
		    // file
		    f = JS9.cleanPath(files[0]);
		    // relative path: add install dir prefix
		    if( f.charAt(0) !== "/" ){
			f = JS9.InstallDir(f);
		    }
		    // which is a proxy file (meaning: delete it on close)
		    xobj = {proxyFile: f};
		    // look for parentFile (relative to helper, not install)
		    if( files[1] ){
			pf = JS9.cleanPath(files[1]);
			xobj.parentFile = pf;
		    }
		    // don't convert this FITS file into another FITS file!
		    xobj.fits2fits = false;
		    // don't fix the path for desktop
		    xobj.fixpath = false;
		    // load new file
	            JS9.Load(f, xobj, {display: this.display});
		}
		break;
	    case "regions":
		// output is region file (or region string), optional opts
		files = robj.stdout.split(/\s+/);
		if( files && files[0] ){
		    // see if a json opts was returned
		    if( files.length > 1 ){
			try{ ropts = JSON.parse(files[1]); }
			catch(e){ ropts = null; }
		    }
		    ropts = ropts || {};
		    if( typeof ropts.remove === "boolean" ){
			ropts.remove = "all";
		    }
		    if( ropts.type === "string" ){
			// region string was passed directly
			if( ropts.remove ){
			    this.removeShapes("regions", ropts.remove);
			}
			this.addShapes("regions", files[0], opts);
		    } else {
			// region file was passed, we have to fetch it
			f = JS9.cleanPath(files[0]);
			// relative path: add install dir prefix
			if( f.charAt(0) !== "/" ){
			    f = JS9.InstallDir(f);
			}
			// load new region file
			obj = {responseType: "text"};
			JS9.fetchURL(null, f, obj, (regions, opts) => {
			    if( ropts.remove ){
				this.removeShapes("regions", ropts.remove);
			    }
			    this.addShapes("regions", regions, opts);
			});
		    }
		}
		break;
	    case "catalog":
		// output is catalog file
		files = robj.stdout.split(/\s+/);
		if( files && files[0] ){
		    f = JS9.cleanPath(files[0]);
		    // load new catalog file
		    obj = {responseType: "text"};
		    JS9.fetchURL(null, f, obj, (catalog, opts) => {
			this.loadCatalog(null, catalog, opts);
		    });
		}
		break;
	    case "none":
		break;
	    default:
		JS9.error(`unknown analysis result type: ${a.rtype}`);
	    break;
	    }
	}
	// set status
	this.setStatus("runAnalysis", "complete");
	// done waiting
	JS9.waiting(false);
    });
    // allow chaining
    return this;
};

// display analysis results (text or plot)
JS9.Image.prototype.displayAnalysis = function(type, s, opts){
    let i, r, id, did, hstr, pobj, divjq, title, titlefile, winFormat;
    let divid, plot, pdata, popts, scaleFunc;
    const scaleCur = {x: "linear", y: "linear"};
    const a = JS9.lightOpts[JS9.LIGHTWIN];
    const lfunc = (v) => { return v === 0 ? v : Math.log(v); };
    const efunc = (v) => { return v === 0 ? v : Math.exp(v); };
    const getPos = (ann, data) => {
	let i, x, y;
	if( !ann.text ){
	    return null;
	}
	x = ann.x || 0;
	if( ann.y.toUpperCase() === "%Y" ){
	    for(i=1; i<data.length-1; i++){
		if( data[i][0] > x ){
		    y = Math.max(data[i-1][1], data[i][1], data[i+1][1]);
		    break;
		}
	    }
	} else {
	    y = ann.y;
	}
	return {x, y};
    };
    // eslint-disable-next-line no-unused-vars
    const flotScale = (divjq, plot, axis, scale) => {
	switch(axis){
	case "x":
	    axis = plot.getAxes().xaxis;
	    break;
	case "y":
	    axis = plot.getAxes().yaxis;
	    break;
	}
	switch(scale){
	case "linear":
	    axis.options.transform = null;
	    axis.options.inverseTransform = null;
	    break;
	case "log":
	    axis.options.transform = lfunc;
	    axis.options.inverseTransform = efunc;
	    break;
	}
	scaleCur[axis] = scale;
	plot.setupGrid();
	plot.draw();
    };
    // eslint-disable-next-line no-unused-vars
    const flotAnnotate = (divjq, plot, pobj) => {
	let i, ann, ao, pos, ahtml;
	const yTextOffset = -25;
	const data = pobj.data;
	const ac = pobj.annotations.color || JS9.plotOpts.annotateColor;
	divjq.find(".plotAnnotation").remove();
	for(i=0; i<pobj.annotations.data.length; i++){
	    ann = pobj.annotations.data[i];
	    pos = getPos(ann, data);
	    ao = plot.pointOffset({ x: pos.x, y: pos.y });
	    if( (ao.left < 0) || (ao.left > divjq.width()) ){
		continue;
	    }
	    ahtml = sprintf("<div class='plotAnnotation' style='position: absolute; left: %spx; top:%spx; color: %s; font-size: small'>%s</div>",
			    ao.left, ao.top+yTextOffset,
			    ac, `&darr;${ann.text}`);
	    divjq.append(ahtml);
	}
    };
    // eslint-disable-next-line no-unused-vars
    const plotlyScale = (divjq, plot, axis, scale) => {
	let opts;
	switch(axis){
	case "x":
	    opts = {xaxis: {type: scale, autorange: true}};
	    break;
	case "y":
	    opts = {yaxis: {type: scale, autorange: true}};
	    break;
	}
	Plotly.restyle(divjq.attr("id"), opts);
    };
    const plotlyAnnotate = (pobj) => {
	let i, ann, aobj, pos;
	const yTextOffset = -30;
	const data = pobj.data;
	const ac = pobj.annotations.color || JS9.plotOpts.annotateColor;
	const annotations = [];
	for(i=0; i<pobj.annotations.data.length; i++){
	    ann = pobj.annotations.data[i];
	    pos = getPos(ann, data);
	    if( !pos ){
		continue;
	    }
	    aobj = {x: pos.x, y: pos.y, xref: "x", yref: "y",
		    text: ann.text, arrowcolor: ac, font: {color: ac},
		    showarrow: true, arrowhead: 2, ax: 0, ay: yTextOffset};
	    annotations.push(aobj);
	}
	return annotations;
    };
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse display opts: ${opts}`, e); }
    }
    // window format ...
    winFormat = opts.winformat;
    // ... or target div
    if( opts.divid && $(`#${opts.divid}`).length > 0 ){
	divid = $(`#${opts.divid}`);
    }
    // make up title, if necessary
    title = opts.title || "";
    if( this && !title ){
	titlefile = (this.fitsFile || this.id || "");
	titlefile = titlefile.split("/").reverse()[0];
	title = `AnalysisResults: ${titlefile}`;
	// add display to title
	title += sprintf(JS9.IDFMT, this.display.id);
    }
    // unique id for light window
    id = `Analysis_${JS9.uniqueID()}`;
    // process the type of analysis results
    switch(type){
    case "text":
	s = s || "";
	hstr = "<div class='JS9Analysis'></div>";
	hstr += `<pre class='JS9AnalysisText'>${s}</pre>`;
	hstr += "</div>";
	// populate div or create the light window to hold the text
        if( divid ){
	    divid.html(hstr);
	} else {
	    winFormat = winFormat || a.textWin;
	    did = JS9.lightWin(id, "inline", hstr, title, winFormat);
	}
	break;
    case "plot":
	// convert results to js object
	if( s && typeof s === "string" ){
	    try{ pobj = JSON.parse(s); }
	    catch(e){ JS9.error(`can't plot return data: ${s}`, e);	}
	} else if( typeof s === "object" ){
	    pobj = s;
	}
	// sanity check
	if( !pobj ){
	    return;
	}
	// create an outer div and an inner plot for the light window open call
	hstr = `<div id='${id}' class='JS9Analysis'><div id='${id}Plot' class='JS9Plot' ></div></div>`;
	// populate div or create the light window to hold the plot
        if( divid ){
	    divid.html(hstr);
	} else {
	    winFormat = winFormat || a.plotWin;
	    did = JS9.lightWin(id, "inline", hstr, title, winFormat);
	}
	// find the inner plot div which now is inside the light window
	divjq = $(`#${id} #${id}Plot`);
	// when using a div (instead of a lightwin), set the div size
        if( divid ){
	    divjq.css("width", divid.css("width"));
	    divjq.css("height", divid.css("height"));
	    divjq.css("margin", 0);
	}
	// flot data
	if( pobj.data ){
	    switch( JS9.globalOpts.plotLibrary ){
	    case "plotly":
		scaleFunc = plotlyScale;
		popts = $.extend(true, {}, JS9.plotOpts, pobj.opts);
		if( pobj.label ){
		    popts.title = pobj.label;
		}
		pdata = {x: [], y: [], type: "scatter"};
		// flot data format: [[x1,y1], [x2,y2], ..]
		//               or: [[x1,y1,yerr1], [x2,y2,yerr2], ..]
		if( pobj.data[0].length >= 3 ){
		    // look for flot yerr properties
		    pdata.error_y = {type: 'data', array: [], visible: true};
		    if( pobj.points && pobj.points.yerr ){
			if( pobj.points.yerr.color ){
			    pdata.error_y.color = pobj.points.yerr.color;
			}
		    }
		}
		for(i=0; i<pobj.data.length; i++){
		    pdata.x.push(pobj.data[i][0]);
		    pdata.y.push(pobj.data[i][1]);
		    if( pdata.error_y && pdata.error_y.array ){
			pdata.error_y.array.push(pobj.data[i][2]);
		    }
		}
		if( JS9.plotOpts.annotate && pobj.annotations ){
		    popts.annotations = plotlyAnnotate(pobj);
		}
		if( popts.xscale === "log" ){
		    popts.xaxis = popts.xaxis || {};
		    popts.xaxis.type = "log";
		    popts.xaxis.autorange = true;
		    scaleCur.x = "log";
		}
		if( popts.yscale === "log" ){
		    popts.yaxis = popts.yaxis || {};
		    popts.yaxis.type = "log";
		    popts.yaxis.autorange = true;
		    scaleCur.y = "log";
		}
		try{  Plotly.newPlot(divjq.attr("id"), [pdata], popts); }
		catch(e){ JS9.error("can't plot data (plotly)", e); }
		break;
	    case "flot":
	    default:
		scaleFunc = flotScale;
		popts = $.extend(true, {}, JS9.plotOpts, pobj.opts);
		// add re-annotate callback, if necessary
		if( JS9.plotOpts.annotate && pobj.annotations ){
		    // eslint-disable-next-line no-unused-vars
		    popts.zoomStack.func = (plt, r) => {
			flotAnnotate(divjq, plt, pobj);
		    };
		}
		pobj.color = pobj.color || popts.color;
		// log scale?
		if( pobj.xscale === "log" ){
		    popts.xaxis = popts.xaxis || {};
		    popts.xaxis.transform = lfunc;
		    popts.xaxis.inverseTransform = efunc;
		    scaleCur.x = "log";
		}
		if( pobj.yscale === "log" ){
		    popts.yaxis = popts.yaxis || {};
		    popts.yaxis.transform = lfunc;
		    popts.yaxis.inverseTransform = efunc;
		    scaleCur.y = "log";
		}
		try{ plot = $.plot(divjq, [pobj], popts); }
		catch(e){ JS9.error("can't plot data (flot)", e); }
		// annotate, if necessary
		if( JS9.plotOpts.annotate && pobj.annotations ){
		    flotAnnotate(divjq, plot, pobj);
		}
		break;
	    }
	    // add keypress handlers
	    divjq.css("outline", "none");
	    divjq.attr("tabindex", 0);
	    divjq.on("keypress", (evt) => {
		const charCode = evt.which || evt.keyCode;
		const c = String.fromCharCode(charCode);
		if( scaleCur[c] === "linear" ){
		    scaleCur[c] = "log";
		} else if( scaleCur[c] === "log" ){
		    scaleCur[c] = "linear";
		} else {
		    return;
		}
		scaleFunc(divjq, plot, c, scaleCur[c]);
	    });
	}
	break;
    case "params":
    case "regions":
    case "textline":
        if( divid ){
	    if( JS9.allinone ){
		divid.html(s);
	    } else {
		$.ajax({
		    url: s,
		    cache: false,
		    dataType: "text",
		    success: (data) => { divid.html(data); }
		});
	    }
	} else {
	    if( type === "params" ){
		winFormat = winFormat || a.paramWin;
	    } else if( type === "regions" ){
		if( JS9.globalOpts.regionConfigSize === "small" ){
		    winFormat = winFormat || a.regWin0;
		} else {
		    winFormat = winFormat || a.regWin;
		}
	    } else {
		winFormat = winFormat || a.dpathWin;
	    }
	    r = JS9.allinone?"inline":"ajax";
	    did = JS9.lightWin(id, r, s, title, winFormat);
	}
	break;
    default:
	break;
    }
    return did;
};

// load an auxiliary file of the specified type
JS9.Image.prototype.loadAuxFile = function(type, func){
    let i, aux, tokens, aim, url;
    const alen = JS9.auxFiles.length;
    const auxarr = [];
    // sigh ... define load func outside the loop to make JSLint happy
    const loadMaskFunc = () => {
	// got the aux file -- backlink the aux object in image's aux array
	this.aux[aux.name] = aux;
	// populate the image data array from RGB values
	JS9.Image.prototype.mkOffScreenCanvas.call(aim);
	// populate the raw image data array from RGB values
	JS9.Image.prototype.mkRawDataFromPNG.call(aim);
	// call func, if necessary (im is required)
	if( func ){
	    try{ JS9.xeqByName(func, window, this, aux); }
	    catch(e){ JS9.error("in aux mask onload callback", e); }
	}
	// debugging
	if( JS9.DEBUG ){
	    JS9.log("JS9 %s: %s dims(%d,%d) min/max(%d,%d)",
		    aim.type, aim.file, aim.raw.width, aim.raw.height,
		    aim.raw.dmin, aim.raw.dmax);
	}
    };
    // sigh ... define load func outside the loop to make JSLint happy
    const loadRegionFunc = (data) => {
	// got the aux file -- backlink the aux object in image's aux array
	this.aux[aux.name] = aux;
	aux.regions = data;
	if( func ){
	    try{ JS9.xeqByName(func, window, this, aux); }
	    catch(e){ JS9.error("in aux region onload callback", e); }
	}
    };
    // sigh ... define load func outside the loop to make JSLint happy
    const loadTextFunc = (data) => {
	// got the aux file -- backlink the aux object in image's aux array
	this.aux[aux.name] = aux;
	aux.text = data;
	if( func ){
	    try{ JS9.xeqByName(func, window, this, aux); }
	    catch(e){ JS9.error("in aux text onload callback", e); }
	}
    };
    // eslint-disable-next-line no-unused-vars
    const errFunc = (jqXHR, textStatus, errorThrown) => {
	JS9.log(`could not load auxiliary file: ${aux.url} [${textStatus}]`);
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
		    // if image already loaded, make backlink and call func
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
		    // if region already loaded, backlink and call func
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
		    // if text already loaded, backlink and call func
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
	    aux.im = Object.create(JS9.Image);
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
	    aim.params.scalemin = Number.NaN;
	    aim.params.scalemax = Number.NaN;
	    // array to hold raw data as we create it
	    aim.raws = [];
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
    let arr, blob;
    if( window.hasOwnProperty("saveAs") ){
	if( fname ){
	    fname = fname
		.replace(/\.fz$/i, "")
		.replace(/(png|jpg|jpeg)$/i, "fits");
	} else {
	    fname = "js9.fits";
	}
	// first convert to array (with two axes)
	arr = this.toArray({notab: true, twoaxes: true});
	// then convert array to blob
	blob = new Blob([arr], {type: "application/octet-binary"});
	// save to disk
	saveAs(blob, fname);
    } else {
	JS9.error("no saveAs() available to save FITS file");
    }
    return fname;
};

// save image as an img file of specified type (e.g., image/png, image/jpeg)
JS9.Image.prototype.saveIMG = function(fname, type, opts){
    let key, img, ctx, canvas, width, height, quality;
    if( window.hasOwnProperty("saveAs") ){
	// opts is optional
	opts = opts || {};
	// opts can be opts object or json string or quality value
	if( typeof opts === "number" ){
	    quality = opts;
	    opts = null;
	} else if( typeof opts === "string" ){
	    if( JS9.isNumber(opts) ){
		quality = parseFloat(opts);
		opts = null;
	    } else {
		try{ opts = JSON.parse(opts); }
		catch(e){ opts = null; }
	    }
	    if( opts ){
		quality = opts.quality;
	    }
	}
	// filename is optional
	fname = fname || "js9.png";
	// save as specified type
	type = type || "image/png";
	// convenience params
	width = this.display.width;
	height = this.display.height;
	// create off-screen canvas, into which we write all canvases
	img = document.createElement("canvas");
	img.setAttribute("width", width);
	img.setAttribute("height", height);
	ctx = img.getContext("2d");
	// source can be image or display
	if( opts.source === "image" ){
	    // image: save RGB image for this image, which will be different
	    // from the display, e.g., when blend mode is turned on
	    ctx.putImageData(this.rgb.img, 0, 0);
	} else {
	    // display: save RGB image as seen on the display,
	    // e.g. a composite blended image
	    ctx.drawImage(this.display.canvas, 0, 0);
	}
	// add graphics layers, unless explicitly specified not to
	if( opts.layers !== false ){
	    for( key in this.layers ){
		if( this.layers.hasOwnProperty(key) ){
		    // each layer canvas
		    if( this.layers[key].dlayer.dtype === "main" &&
			this.layers[key].show ){
			canvas = this.layers[key].dlayer.canvasjq[0];
			ctx.drawImage(canvas, 0, 0, width, height);
		    }
		}
	    }
	}
	// sanity check on quality
	if( JS9.notNull(quality) ){
	    if( quality < 0 || quality > 1 ){
		quality = 0.95;
	    }
	}
	img.toBlob( (blob) => {
	    saveAs(blob, fname);
	}, type, quality);
    } else {
	JS9.error("no saveAs() available for saving image");
    }
    return fname;
};

// save image as a PNG file
JS9.Image.prototype.savePNG = function(fname, opts){
    fname = fname || "js9.png";
    if( !fname.match(/\.png$/) ){
	fname += ".png";
    }
    return this.saveIMG(fname, "image/png", opts);
};

// save image as a JPEG file
JS9.Image.prototype.saveJPEG = function(fname, opts){
    fname = fname || "js9.jpg";
    if( !fname.match(/\.jpg$/) && !fname.match(/\.jpeg$/)  ){
	fname += ".jpg";
    }
    return this.saveIMG(fname, "image/jpeg", opts);
};

// update (and display) pixel and wcs values (connected to info plugin)
JS9.Image.prototype.updateValpos = function(ipos, disp){
    let val, vstr, vstr1, vstr2, vstr3, val3, i, c, s;
    let cd1, cd2, v1, v2, units, sect, bin;
    let obj = null;
    const sep1 = "\t ";
    const sep2 = "\t\t ";
    const sp = "&nbsp;&nbsp;&nbsp;&nbsp;";
    const prec = JS9.floatPrecision(this.params.scalemin, this.params.scalemax);
    const tf = (fval) => {
	return JS9.floatFormattedString(fval, prec, 3);
    };
    const tr = (fval, length) => {
	length = length || 3;
	return fval.toFixed(length);
    };
    const ti = (ival, length) => {
        let r = "";
	let prefix = "";
	length = length || 3;
	if( ival < 0 ){
	    ival = Math.abs(ival);
	    prefix = "-";
	}
	r = r + ival;
	while (r.length < length) {
            r = `0${r}`;
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
		this.display.displayMessage("info", this.valpos,
					   JS9.globalOpts.valposTarget);
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
	// get image value: here we need 0-indexed display positions,
	// so subtract the 0.5 of the image pixel
	val = this.raw.data[Math.floor(ipos.y - 0.5) * this.raw.width +
			    Math.floor(ipos.x - 0.5)];
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
	vstr1 = val3;
	vstr2 =  `${tr(c.x, 3)} ${tr(c.y, 3)} (${c.sys})`;
	vstr = vstr1 + sp + vstr2;
	// object containing all information
	obj = {ix: i.x, iy: i.y, ipos: tr(i.x, 2) + sep2 + tr(i.y, 2),
	       isys: "image",
	       px: c.x, py: c.y, ppos: tr(c.x, 2) + sep2 + tr(c.y, 2),
	       psys: c.sys,
	       ra: "", dec: "", wcspos: "", wcssys: "",
	       racen: "", deccen: "",
	       wcsfov: "", wcspix: "",
	       val: val, val3: val3,
	       id: this.id, file: this.file, object: this.object};
	if( this.telescope || this.instrument ){
	    obj.object += "  (";
	    if( this.telescope ){
		obj.object += this.telescope;
		if( this.instrument ){
		    obj.object += ", ";
		}
	    }
	    if( this.instrument ){
		obj.object += this.instrument;
	    }
	    obj.object += ")";
	}
	// add wcs, if necessary
	if( (this.raw.wcs > 0) &&
	    (this.params.wcssys !== "image") &&
	    (this.params.wcssys !== "physical") ){
	    s = JS9.pix2wcs(this.raw.wcs, ipos.x, ipos.y).trim().split(/\s+/);
	    vstr3 =  `${s[0]} ${s[1]} (${s[2]||"wcs"})`;
	    vstr = vstr1 + sp + vstr3 + sp + vstr2;
	    // update object with wcs
	    obj.ra = s[0];
	    obj.dec = s[1];
	    obj.wcspos = s[0] + sep1 + s[1];
	    obj.wcssys = s[2];
	    if( this.raw.wcsinfo ){
		cd1 = Math.abs(this.raw.wcsinfo.cdelt1);
		cd2 = Math.abs(this.raw.wcsinfo.cdelt2);
		v1 = 1/60;
		if( (cd1 >= 1) || (cd2 >= 1) ){
		    units = "deg";
		} else if( (cd1 >= v1) || (cd2 >= v1) ){
		    units = "'";
		    cd1 *= 60;
		    cd2 *= 60;
		} else {
		    units = '"';
		    cd1 *= 3600;
		    cd2 *= 3600;
		}
		sect = this.rgb.sect;
		bin = this.binning.bin;
		v1 = ((sect.x1 - sect.x0) * cd1).toFixed(0);
		v2 = ((sect.y1 - sect.y0) * cd2).toFixed(0);
		obj.wcsfov = `${v1 + units} x ${v2}${units}`;
		v1 = tf(cd1 * bin / sect.zoom);
		obj.wcspix = `${v1 + units} / pixel`;
		obj.wcsfovpix = `${obj.wcsfov}  (${obj.wcspix})`;
		s = JS9.pix2wcs(this.raw.wcs,
				(sect.x1 + sect.x0)/2, (sect.y1 + sect.y0)/2)
		    .trim().split(/\s+/);
		obj.racen = s[0];
		obj.deccen = s[1];
		obj.wcscen = s[0] + sep1 + s[1];
	    }
	}
	obj.vstrsmall = vstr1 + sp + vstr2;
	obj.vstr = vstr;
	obj.vstrmedium = vstr;
	obj.vstrlarge = vstr + sp + this.file;
	if( disp ){
	    this.display.displayMessage("info", obj,
					JS9.globalOpts.valposTarget);
	}
    }
    return obj;
};

// toggle display of value/position
JS9.Image.prototype.toggleValpos = function(){
    this.params.valpos = !this.params.valpos;
    if( !this.params.valpos ){
	this.display.clearMessage();
    }
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
JS9.Image.prototype.setColormap = function(...args){
    let [arg, arg2, arg3] = args;
    // is this core service disabled?
    // (only if the colormap has been set at least once!)
    if( $.inArray("colormap", this.params.disable) >= 0 && this.cmapObj ){
	return;
    }
    switch(args.length){
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
		    if( this === JS9.globalOpts.rgb.rim ){
			JS9.globalOpts.rgb.rim = null;
		    }
		    break;
		case "green":
		    if( this === JS9.globalOpts.rgb.gim ){
			JS9.globalOpts.rgb.gim = null;
		    }
		    break;
		case "blue":
		    if( this === JS9.globalOpts.rgb.bim ){
			JS9.globalOpts.rgb.bim = null;
		    }
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
        if( args.length === 3 ){
	    if( !Number.isNaN(arg2) ){
	        this.params.contrast = arg2;
	    }
	    if( !Number.isNaN(arg3) ){
	       this.params.bias = arg3;
	    }
        }
	break;
    case 2:
	if( !Number.isNaN(arg) ){
	    this.params.contrast = arg;
	}
	if( !Number.isNaN(arg2) ){
	    this.params.bias = arg2;
	}
	break;
    default:
	break;
    }
    this.displayImage("colors");
    // hack: delete filterRGBImage from stash to avoid restore during reproject
    // also added to "change contrast/bias" routine, can't this be generalized?
    if( this.xeqstash && this.xeqstash.filterRGBImage ){
	delete this.xeqstash.filterRGBImage;
    }
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
		scalemax: this.params.scalemax,
	        scaleclipping: this.params.scaleclipping};
    }
};

// set scale factor
JS9.Image.prototype.setScale = function(...args){
    let [s0, s1, s2] = args;
    const newscale = (s) => {
	if( JS9.scales.includes(s) ){
	    this.params.scale = s;
	} else if( s === "dataminmax" ){
	    this.params.scaleclipping = "dataminmax";
	    this.params.scalemin = this.raw.dmin;
	    this.params.scalemax = this.raw.dmax;
	} else if( s === "zscale" ){
	    if( (this.params.z1 === undefined) ||
		(this.params.z2 === undefined) ){
		this.zscale(false);
	    }
	    this.params.scaleclipping = "zscale";
	    this.params.scalemin = this.params.z1;
	    this.params.scalemax = this.params.z2;
	} else if( s === "zmax" ){
	    if( (this.params.z1 === undefined) ){
		this.zscale(false);
	    }
	    this.params.scaleclipping = "zmax";
	    this.params.scalemin = this.params.z1;
	    this.params.scalemax = this.raw.dmax;
	} else if( s === "user" ){
	    this.params.scaleclipping = "user";
	} else {
	    JS9.error(`unknown scale: ${s}`);
	}
    };
    // is this core service disabled?
    if( $.inArray("scale", this.params.disable) >= 0 ){
	return;
    }
    if( args.length ){
	switch(args.length){
	case 1:
	    newscale(s0);
	    break;
	case 2:
	    this.params.scalemin = parseFloat(s0);
	    this.params.scalemax = parseFloat(s1);
	    this.params.scaleclipping = "user";
	    break;
        default:
	    newscale(s0);
	    if( (s0 !== "zscale") && (s0 !== "zmax") ){
		this.params.scalemin = parseFloat(s1);
		this.params.scalemax = parseFloat(s2);
		this.params.scaleclipping = "user";
	    }
	    break;
	}
	this.displayImage("colors");
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetscale");
    }
    return this;
};

// get an image param value
JS9.Image.prototype.getParam = function(param){
    // sanity check
    if( !param ){
	return null;
    }
    // return param object
    if( param === "all" ){
	return this.params;
    }
    // return value
    return this.params[param];
};

// set an image param value
JS9.Image.prototype.setParam = function(param, value){
    let i, idx, ovalue, obj;
    // sanity check
    if( !param ){
	return null;
    }
    // merge in new params
    if( param === "all" && typeof value === "object" ){
	$.extend(true, this.params, value);
	// call core methods as needed
	if( value.colormap || value.contrast || value.bias ){
	    obj = this.getColormap();
	    value.colormap = value.colormap || obj.colormap;
	    value.contrast = value.contrast || obj.contrast;
	    value.bias = value.bias || obj.bias;
	    this.setColormap(value.colormap, value.contrast, value.bias);
	}
	if( value.scale || value.scalemin || value.scalemax ){
	    obj = this.getScale();
	    value.scale = value.scale || obj.scale;
	    value.scalemin = value.scalemin || obj.scalemin;
	    value.scalemax = value.scalemax || obj.scalemax;
	    this.setScale(value.scale, value.scalemin, value.scalemax);
	}
	if( value.flip ){
	    this.setFlip(value.flip);
	}
	if( value.invert ){
	    this.params.invert = value.invert;
	    this.displayImage("colors");
	}
	if( value.zoom ){
	    this.setZoom(value.zoom);
	}
	if( value.wcssys ){
	    this.setWCSSys(value.wcssys);
	}
	if( value.wcsunits ){
	    this.setWCSUnits(value.wcsunits);
	}
	return this.params;
    } else if( param === "disable" ){
	if( !$.isArray(value) ){
	    value = [value];
	}
	for(i=0; i<value.length; i++){
	    idx = $.inArray(value[i], this.params.disable);
	    if( idx < 0 ){
		this.params.disable.push(value[i]);
	    }
	}
	return this.params.disable;
    } else if( param === "enable" ){
	if( !$.isArray(value) ){
	    value = [value];
	}
	for(i=0; i<value.length; i++){
	    idx = $.inArray(value[i], this.params.disable);
	    if( idx >= 0 ){
		this.params.disable.splice(idx, 1);
	    }
	}
	return this.params.disable;
    }
    // save old value
    ovalue = this.params[param];
    // set new value
    this.params[param] = value;
    // call core methods as needed
    switch(param){
    case "colormap":
	this.setColormap(value);
	break;
    case "invert":
	this.displayImage("colors");
	break;
    case "contrast":
	obj = this.getColormap();
	this.setColormap(obj.colormap, value, obj.bias);
	break;
    case "bias":
	obj = this.getColormap();
	this.setColormap(obj.colormap, obj.contrast, value);
	break;
    case "flip":
	this.setFlip(value);
	break;
    case "scale":
	this.setScale(value);
	break;
    case "scalemin":
	obj = this.getScale();
	this.setScale("user", value, obj.scalemax);
	break;
    case "scalemax":
	obj = this.getScale();
	this.setScale("user", obj.scalemin, value);
	break;
    case "scaleclipping":
	obj = this.getScale();
	this.setScale(value, obj.scalemin, obj.scalemax);
	break;
    case "wcssys":
	this.setWCSSys(value);
	break;
    case "wcsunits":
	this.setWCSUnits(value);
	break;
    case "zoom":
	this.setZoom(value);
	break;
    }
    // return old value
    return ovalue;
};

// get status
JS9.Image.prototype.getStatus = function(status){
    if( JS9.isNull(status) || typeof status !== "string" ){
	return undefined;
    }
    switch(status.toLowerCase()){
    case "displaysection":
	return this.status.displaySection;
    case "createmosaic":
	return this.status.createMosaic;
    case "load":
    case "preload":
	// if the fetch is still running or failed, return the status
	if( JS9.fetchURL.status ){
	    return JS9.fetchURL.status;
	}
	return this.status.load;
    case "loadcatalog":
	return this.status.loadCatalog;
    case "loadcolormap":
	return this.status.loadColormap;
    case "loadproxy":
	return this.status.loadProxy;
    case "loadregions":
	return this.status.loadRegions;
    case "loadsession":
	return this.status.loadSession;
    case "reproject":
    case "reprojectdata":
    case "rotate":
    case "rotatedata":
	return this.status.reprojectData;
    case "runanalysis":
	return this.status.runAnalysis;
    case "separate":
	return this.status.separate;
    case "uploadfitsfile":
	return this.status.uploadFITSFile;
    default:
	return undefined;
    }
};

// set status
JS9.Image.prototype.setStatus = function(id, status){
    if( JS9.notNull(id) && JS9.notNull(status) ){
	switch(status){
	case "error":
	case "complete":
	    delete this.status.cur;
	    break;
	default:
	    this.status.cur = id;
	    break;
	}
    }
    this.status[id] = status;
};

// re-calculate data min and max (and set scale params, if necessary)
JS9.Image.prototype.dataminmax = function(dmin, dmax){
    let i, blankval;
    let reminscale = Number.isNaN(this.params.scalemin) ||
                     (this.params.scalemin === undefined);
    let remaxscale = Number.isNaN(this.params.scalemax) ||
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
    // used supplied values, if possible
    if( dmin !== undefined && dmax !== undefined ){
	this.raw.dmin = dmin;
	this.raw.dmax = dmax;
    } else {
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
			this.raw.dmin=Math.min(this.raw.dmin, this.raw.data[i]);
			this.raw.dmax=Math.max(this.raw.dmax, this.raw.data[i]);
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
		if( !Number.isNaN(this.raw.data[i]) ){
		    this.raw.dmin = Math.min(this.raw.dmin, this.raw.data[i]);
		    this.raw.dmax = Math.max(this.raw.dmax, this.raw.data[i]);
		}
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
    let s, rawdata, bufsize, buf, vals;
    // sanity check
    if( !JS9.zscale || !this.raw || !this.raw.data ){
	return this;
    }
    rawdata = this.raw.data;
    // allocate space for the image in the emscripten heap
    bufsize = rawdata.length * rawdata.BYTES_PER_ELEMENT;
    try{ buf = JS9.vmalloc(bufsize); }
    catch(e){ JS9.error(`image too large for zscale malloc: ${bufsize}`, e); }
    // copy the raw image data to the heap
    // try{ JS9.vheap.set(new Uint8Array(rawdata.buffer), buf); }
    try{ JS9.vmemcpy(new Uint8Array(rawdata.buffer), buf); }
    catch(e){ JS9.error(`can't copy image to zscale heap: ${bufsize}`, e); }
    // call the zscale routine
    s = JS9.zscale(buf,
		   this.raw.width,
		   this.raw.height,
		   this.raw.bitpix,
		   this.params.zscalecontrast,
		   this.params.zscalesamples,
		   this.params.zscaleline);
    // free emscripten heap space
    JS9.vfree(buf);
    // clean up return values
    vals = s.trim().split(/\s+/);
    // save z1 and z2
    this.params.z1 = parseFloat(vals[0]);
    this.params.z2 = parseFloat(vals[1]);
    // make z1 and z2 the scale clip values, if necessary
    if( setvals === "zmax" ){
	this.params.scalemin = this.params.z1;
	this.params.scalemax = this.raw.dmax;
    } else if( setvals ){
	this.params.scalemin = this.params.z1;
	this.params.scalemax = this.params.z2;
    }
    // allow chaining
    return this;
};

// background-subtracted counts in regions
// eslint-disable-next-line no-unused-vars
JS9.Image.prototype.countsInRegions = function(...args){
    let i, s, vfile, bvfile, sect, ext, filter, bin, opts, cmdswitches;
    let sregions = "field";
    let bregions = "";
    const getreg = (arg, macro, def) => {
	let ii, rarr, reg, narg;
	const regrexp= /(annulus|box|circle|ellipse|line|polygon|point|text) *\(/;
	// if we have no region, we're done
	if( !arg ){
	    return def;
	}
	if( typeof arg === "string" ){
	    narg = this.expandMacro(arg);
	    // if we have no region, we're done
	    if( !narg ){
		return def;
	    }
	    // if its a known region, we're done
	    if( narg.match(regrexp) ){
		return narg;
	    }
	}
	// look for a region specifier
	rarr = this.getShapes("regions", arg);
	// no region are returned: this is an error
	if( !rarr || !rarr.length ){
	    JS9.error(`no regions found: ${arg}`);
	}
	// compose a region string from the returned regions
	narg = "";
	for(ii=0; ii<rarr.length; ii++){
	    reg = rarr[ii];
	    if( this.params.wcssys ){
		// put wcs sys at the start
		if( !narg ){
		    narg = reg.wcssys || "";
		}
		// add wcs region string
		narg += `; ${reg.wcsstr}`;
	    } else {
		// put image sys at the start
		if( !narg ){
		    narg = reg.imsys || "";
		}
		// add image region string
		narg += `; ${reg.imstr}`;
	    }
	}
	return narg || def;
    };
    // sanity check
    if( !this.raw.hdu || !this.raw.hdu.fits || !this.raw.hdu.fits.vfile ){
	JS9.error(`no virtual file available for regcnts: ${this.id}`);
    }
    // convert json to an object
    for(i=0; i<args.length; i++){
	s = args[i];
	if( typeof s === "string" && s.charAt(0) === '{' ){
	    try{ args[i] = JSON.parse(s); }
	    catch(e){ JS9.error(`can't parse json arg in regcnts: ${s}`, e); }
	}
    }
    // analyze args
    switch(args.length){
    case 0:
	break;
    case 1:
	if( typeof args[0] === "object" ){
	    opts = args[0];
	} else {
	    sregions = getreg(args[0], "$sregions", "field");
	}
	break;
    case 2:
	sregions = getreg(args[0], "$sregions", "field");
	if( typeof args[1] === "object" ){
	    opts = args[1];
	} else {
	    bregions = getreg(args[1], "$bregions", "");
	}
	break;
    default:
	sregions = getreg(args[0], "$sregions", "field");
	bregions = getreg(args[1], "$bregions", "");
	opts = args[2];
	break;
    }
    // opts is optional
    opts = opts || {};
    // reduce can be taken from the global value
    opts.reduce = opts.reduce || JS9.globalOpts.reduceRegcnts;
    // same for reduction dims
    opts.dim = opts.dim ||
	Math.max(JS9.globalOpts.image.xdim, JS9.globalOpts.image.ydim);
    // check for command switches
    cmdswitches = opts.cmdswitches || "";
    // get final file, including filters and extensions
    vfile = this.raw.hdu.fits.vfile;
    ext =  this.file.match(/\[.*\]/);
    if( ext ){
	vfile += ext;
    }
    if( this.imtab === "table" ){
	filter = this.raw.hdu.table.filter;
	if( filter && !vfile.match(filter) ){
	    if( vfile.match(/\]\[/) ){
		vfile = `${vfile.slice(0, -1)}&&${filter}]`;
	    } else {
		vfile += `[${filter}]`;
	    }
	}
    } else if( this.raw.header.NAXIS === 3 &&
	       cmdswitches.search(/(^| )-c/) < 0 ){
	cmdswitches += ` -c ${this.raw.hdu.slice || 1}`;
    }
    // reduce file size, if necessary
    if( opts.reduce && !this.parentFile ){
	const {xdim, ydim} = this.fileDimensions();
	bin = Math.floor((Math.max(xdim, ydim) / opts.dim) + 0.5);
	if( bin > 1 ){
	    if( this.imtab === "table" ){
		// for tables, regcnts has a -b switch
		cmdswitches += ` -b ${bin}`;
	    } else {
		// for images, make a temporary binned file
		bvfile = `bin${bin}_${vfile.split("/").reverse()[0]}`;
		sect = `0@0,0@0,${bin}`;
		JS9.imsection(vfile, bvfile, sect, "");
		vfile = bvfile;
	    }
	}
    }
    // could take a while ...
    JS9.waiting(true, this.display);
    // call low-level regcnts
    s = JS9.regcnts(vfile, sregions, bregions, cmdswitches);
    // all done waiting
    JS9.waiting(false);
    // remove binned file, if necessary
    if( bvfile ){
	JS9.vunlink(bvfile);
    }
    // check for regions or cfitio errors
    if( s.match(/^ERROR/) || s.match(/FITSIO status/) ){
	JS9.error(s);
    }
    // display in a lightwin, if necessary
    if( opts.lightwin ){
	// display counts in a light window
	this.displayAnalysis("text", s, {divid: JS9.globalOpts.analysisDiv});
    }
    // return results, including errors
    return s;
};

// radial profile plot
// eslint-disable-next-line no-unused-vars
JS9.Image.prototype.radialProfile = function(...args){
    let i, s, xlabel, ylabel, obj, cobj, pobj, res, el, opts;
    let color, errorbars, errorcolor;
    const carr = [];
    const swobj = {cmdswitches: "-j -r"};
    // make up arg list, add required radial profile switches to opts
    for(i=0; i<args.length; i++){
	if( typeof args[i] === "object" ){
	    // integrate our switches into passed opts
	    cobj = $.extend(true, {}, args[i], swobj);
	    carr.push(cobj);
	    opts = cobj;
	} else {
	    carr.push(args[i]);
	}
    }
    // if no opts supplied, add the switches manually
    if( !cobj ){
	carr.push(swobj);
    }
    // opts is optional
    opts = opts || {};
    // call regcnts routine
    s = this.countsInRegions(...carr);
    // need a json string in return
    if( s ){
	try{ obj = JSON.parse(s); }
	catch(e){ JS9.error("can't parse regcnts JSON", e); }
    }
    if( !obj || !obj.columnUnits || !obj.columnUnits.radii ){
	JS9.error("no radii available for radial profile");
    }
    // get plot labels
    xlabel = obj.columnUnits.radii;
    ylabel = obj.columnUnits.surfBrightness;
    // get plot colors
    color = opts.color || "green";
    errorcolor = opts.errorcolor || "red";
    if( JS9.isNull(opts.errorbars) || opts.errorbars ){
	errorbars = "y";
    } else {
	errorbars = "n";
    }
    // init plot object
    pobj = {color: sprintf("%s", color), label : sprintf("surface brightness(%s) vs. radius(%s)", ylabel, xlabel), points:{"errorbars" : sprintf("%s", errorbars), "yerr" : {"show" : "true", "color" : sprintf("%s", errorcolor)}}, data: []};
    // add data values
    for(i=0; i<obj.backgroundSubtractedResults.length; i++){
	res = obj.backgroundSubtractedResults[i];
	if( res.radius2 === "undefined" ||
	    res.radius2 === "NA"        ||
	    res.radius1 > res.radius2   ){
	    JS9.error("radial profile source region must be an annulus");
	}
	el = [(res.radius1 + res.radius2)/2, res.surfBrightness, res.surfError];
	pobj.data.push(el);
    }
    // display results
    return this.displayAnalysis("plot", pobj,
				{divid: JS9.globalOpts.analysisDiv});
};

// plot of a 3D cube a region
// eslint-disable-next-line no-unused-vars
JS9.Image.prototype.plot3d = function(src, bkg, opts){
    let i, j, s, arr, jobj, el, pobj, color, mode, divid, xlabel, ylabel;
    let index3, xoff, xdelt;
    const counts=[];
    if( !this.raw.header || this.raw.header.NAXIS !== 3 ){
	JS9.error("plot3d requires a data cube with 3 dimensions");
    }
    // opts is optional
    opts = $.extend(true, {}, opts, JS9.globalOpts.plot3d);
    // slice
    opts.cube = opts.cube || "*:*:all";
    // make sure 'all' is specified
    arr = opts.cube.split(":");
    for(i=0; i<arr.length; i++){
	if( arr[i] === "all" ){
	    index3 = i+1;
	    break;
	}
    }
    if( !index3 ){
	JS9.error("plot3d requires specification of cube's third index");
    }
    // but these regcnts command switches are not
    opts.cmdswitches = `-j -c ${opts.cube}`;
    // average or sum?
    mode =  opts.mode || "avg";
    // for avg: what sort of area (pixels or arcsec)?
    if( !opts.areaunits ){
	opts.areaunits = "pixels";
	opts.cmdswitches += " -p";
    } else if( opts.areaunits.match(/^p/) ){
	opts.areaunits = "pixels";
	opts.cmdswitches += " -p";
    } else if( opts.areaunits.match(/^a/) ){
	opts.areaunits = "arcsec";
    } else {
	opts.areaunits = "pixels";
	opts.cmdswitches += " -p";
    }
    // plot colors
    color = opts.color || "green";
    // get counts in regions for all slices in the cube
    s = this.countsInRegions(src, bkg, opts);
    // convert to json format
    if( s ){
	try{ jobj = JSON.parse(s); }
	catch(e){ JS9.error(`can't parse regcnts results: ${s}`, e); }
    }
    if( !jobj ){
	JS9.error("no regcnts info available for plot3d");
    }
    // init plot object
    s = this.raw.header[`CTYPE${String(index3)}`];
    if( s ){
	xlabel = s.toLowerCase();
    } else {
	xlabel = "slice";
    }
    if( mode === "avg" ){
	if( opts.areaunits === "pixels"){
	    ylabel = "counts/pixel**2";
	} else {
	    ylabel = "counts/arcsec**2";
	}
    } else {
	ylabel = "summed counts";
    }
    pobj = {color: sprintf("%s", color), label : sprintf("%s vs %s ", ylabel, xlabel), data: []};
    // offset for 3rd dimension
    xoff = this.raw.header[`CRVAL${String(index3)}`]  || 0;
    xdelt = this.raw.header[`CDELT${String(index3)}`] || 1;
    // get bkgd-subtracted counts in each slice
    for(i=0; i<jobj.source.cubeSlices; i++){
        s = `backgroundSubtractedResults${String(i+1)}`;
	counts[i] = 0;
	for(j=0; j<jobj[s].length; j++){
	    if( mode === "avg" ){
		counts[i] += jobj[s][j].surfBrightness;
	    } else {
		counts[i] += jobj[s][j].netCounts;
	    }
	}
	el = [(i * xdelt) + xoff, counts[i]];
	pobj.data.push(el);
    }
    // which div?
    divid = opts.divid || JS9.globalOpts.analysisDiv;
    // display results
    return this.displayAnalysis("plot", pobj, {divid});
};

// make (or select) a raw data layer
// calling sequences:
//   im.rawDataLayer(obj, func) -- editing existing or create new raw data layer
// where obj can contain:
//    rawid: id of new raw data (default: "alt")
//    oraw: id of raw data to pass to func or "current" (default: "raw0")
//    from: string describing origin of this raw data (def: "func")
// or:
//   im.rawDataLayer(id, func) -- editing existing or create new raw data layer
// or:
//   im.rawDataLayer(id) -- switch to existing raw data later with specified id
// or:
//   im.rawDataLayer(id, "remove") -- remove raw data later with specified id
// or:
//   im.rawDataLayer() -- return name of th current layer
JS9.Image.prototype.rawDataLayer = function(...args){
    let i, j, id, mode, raw, oraw, nraw, rawid, cur, nlen, carr, im, key;
    let [opts, func] = args;
    // no arg => return name of current raw
    if( !args.length ){
	return this.raw.id;
    }
    // opts is optional
    opts = opts || {};
    // opts is a string with second arg a func: generate opts object
    // opts is a string, no func: switch to a different raw data layer
    // opts is a string + "remove": remove specified layer
    if( typeof opts === "string" ){
	if( typeof func === "function" ){
	    // change: rawDataLayer(id, func) to rawDataLater(obj, func)
	    opts = {rawid: opts};
	} else {
	    id = opts;
	    mode = func;
	    // look for raw layer with the specified id
	    for(i=0; i<this.raws.length; i++){
		raw = this.raws[i];
		// are we deleting this raw layer?
		if( id === raw.id ){
		    if( mode === "remove" ){
			if( id === JS9.RAWID0 ){
			    JS9.error("can't remove primary (raw0) data layer");
			}
			// delete vfile associated with this layer?
			if( raw.hdu && raw.hdu.fits ){
			    carr = JS9.lookupVfile(raw.hdu.fits.vfile);
			    if( carr.length <= 1 ){
				JS9.cleanupFITSFile(raw, true);
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
			// remove stash calls for this id from other images
			for(j=0; j<JS9.images.length; j++){
			    im = JS9.images[j];
			    if( im.xeqstash ){
				for( key in im.xeqstash ){
				    if( im.xeqstash.hasOwnProperty(key) ){
					if( im.xeqstash[key].id === id ){
					    delete im.xeqstash[key];
					}
				    }
				}
			    }
			}
			// remove layer
			this.raws.splice(i, 1);
		    } else {
			// switch to new raw layer
			this.raw = raw;
		    }
		    // configure the current raw layer
		    if( this.raw.header.BITPIX ){
			this.raw.bitpix = this.raw.header.BITPIX;
		    }
		    // reset imtab
		    this.imtab = this.raw.imtab || this.imtab;
		    // set data min and max
		    this.dataminmax();
		    // reset section
		    this.mkSection();
		    // reinit coordinate transforms
		    this.initWCS();
		    this.initLCS();
		    // redisplay using these data
		    this.displayImage("all");
		    // refresh layers
		    this.refreshLayers();
		    // extended plugins
		    if( JS9.globalOpts.extendedPlugins ){
			this.xeqPlugins("image", "onrawdatalayer");
		    }
		    return true;
		}
	    }
	    // did not find the specified layer
	    return false;
	}
    }
    // otherwise, sanity check if we are going to change data
    if( typeof func !== "function" ){
	return false;
    }
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse rawData opts: ${opts}`, e); }
    }
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
	// current0: use original current data for this layer
	// iff this layer is the same as current active layer
	if( this.raw.id === rawid ){
	    oraw = this.raw.current0;
	} else {
	    // otherwise, use currently active raw layer
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
	// save current for next time
	nraw.current0 = oraw;
	// but ensure data is a copy, not a pointer to the original!
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
    // call the func to fill in the nraw data
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
	// re-calculate min and max, if necesary
	if( opts.dataminmax !== false ){
	    this.dataminmax();
	}
	// redisplay using these data
	this.displayImage("all", opts);
    }
    return true;
};

// perform a gaussian blur on the raw data
// creates a new raw data layer ("gaussBlur")
JS9.Image.prototype.gaussBlurData = function(sigma){
    let opts = {};
    if( sigma === undefined ){
	JS9.error("missing sigma value for gaussBlurData");
    }
    // save value
    this.params.sigma = sigma;
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse gaussBlur opts: ${opts}`, e); }
    }
    // the blurred image will be floating point
    if( this.raw.bitpix === -64 ){
	opts.bitpix = -64;
    } else {
	opts.bitpix = -32;
    }
    // use origin of current
    opts.oraw = "current0";
    // nraw should be a floating point copy of oraw
    opts.alwaysCopy = true;
    // new layer
    opts.rawid = opts.rawid || "gaussBlur";
    // pass the options
    opts.sigma = sigma;
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("gaussBlurData", [sigma], opts.rawid);
    // call routine to generate (or modify) the new layer
    this.rawDataLayer(opts, (oraw, nraw) => {
	let tdata;
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
	    JS9.error(`invalid temp bitpix for gaussBlur: ${nraw.bitpix}`);
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
JS9.Image.prototype.imarithData = function(...args){
    let im;
    let [op, arg1, opts] = args;
    // no args means return the available ops
    if( !args.length ){
	return ["add", "sub", "mul", "div", "min", "max", "reset"];
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse imarith opts: ${opts}`, e); }
    }
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
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("imarithData", args, opts.rawid);
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
	JS9.error(`invalid operator for image arithmetic: ${op}`);
	break;
    }
    // arg1: can be an image object or a numeric value
    if( typeof arg1 === "object" ){
	if( (this.raw.width  !== arg1.raw.width)  ||
	    (this.raw.height !== arg1.raw.height) ){
	    JS9.error("images must be the same size for image arithmetic");
	}
	opts.argtype = "image";
	opts.argval = arg1;
    } else if( JS9.isNumber(arg1) ){
	opts.argtype = "value";
	opts.argval = arg1;
    } else {
	// lookup the image by name
	im = JS9.lookupImage(arg1);
	if( !im ){
	    JS9.error(`imarith arg1 must be an image or a constant: ${arg1}`);
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
    this.rawDataLayer(opts, (oraw, nraw, opts) => {
	let i, val;
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
		JS9.error(`unknown operation for imarith: ${opts.op}`);
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
		JS9.error(`unknown op for imarith: ${opts.op}`);
		break;
	    }
	    break;
	default:
	    JS9.error(`unknown arg type for imarith: ${opts.argtype}`);
	    break;
	}
	return true;
    });
    // allow chaining
    return this;
};

// linear shift of raw data (cheap alignment for CFA MicroObservatory)
// creates a new raw data layer ("shift")
JS9.Image.prototype.shiftData = function(...args){
    let [x, y, opts] = args;
    if( x === undefined || y === undefined ){
	JS9.error("missing translation value(s) for shiftData");
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse shift opts: ${opts}`, e); }
    }
    opts.rawid = opts.rawid || "shift";
    opts.x = x;
    opts.y = y;
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("shiftData", args, opts.rawid);
    this.rawDataLayer(opts, (oraw, nraw, opts) => {
	let i, oi, oj, ni, nj, nlen, oU8, nU8, ooff, noff, blankval;
	const bpp = oraw.data.BYTES_PER_ELEMENT;
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

// rotate image by changing WCS info and calling reprojectData
// creates a new raw data layer ("rotate")
// angle is in degrees (since CROTA2 is in degrees)
JS9.Image.prototype.rotateData = function(...args){
    let raw, oheader, nheader, ncrot, nrad, sinrot, cosrot;
    let ocdelt1 = 0.0;
    let ocdelt2 = 0.0;
    let [angle, opts] = args;
    // sanity checks
    if( !this.raws || !this.raws[0] ){
	JS9.error("no raw data for reprojection");
    }
    // go back to original data for reprojection
    raw = this.raws[0];
    if( !raw.header || !raw.wcsinfo ){
	JS9.error("no WCS info available for reprojection");
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse rotate opts: ${opts}`, e); }
    }
    // save stash name
    opts.stash = "rotateData";
    // but make sure we can set the id
    opts.rawid = "rotate";
    // rotate raw data
    opts.oraw = JS9.RAWID0;
    // maintain current section, unless specified otherwise
    if( opts.resetSection !== true ){
	opts.resetSection = false;
    }
    // old and new header
    oheader = raw.header;
    nheader = $.extend(true, {}, oheader);
    // restrict size of reprojection to raw data size
    if( raw.width && raw.height ){
	nheader.NAXIS1 = raw.width;
	nheader.NAXIS2 = raw.height;
    }
    // normalized values from wcslib
    if( raw.wcsinfo ){
	ocdelt1 = raw.wcsinfo.cdelt1 || 0;
	ocdelt2 = raw.wcsinfo.cdelt2 || 0;
    }
    // string directives instead of a numeric angle
    if( typeof angle === "string" ){
	switch(angle.toLowerCase()){
	case "northisup":
	case "northup":
	    angle = 0;
	    if( ocdelt1 > 0 ){ ocdelt1 = -ocdelt1; }
	    if( ocdelt2 < 0 ){ ocdelt2 = -ocdelt2; }
	    break;
	}
    }
    // new header same as old, but with a changed angle
    ncrot = angle;
    // rotation in radians
    nrad = -(ncrot * Math.PI / 180.0);
    sinrot = Math.sin(nrad);
    cosrot = Math.cos(nrad);
    // make up new WCS keywords
    // if not using CD matrix, set CROTA2
    if( JS9.isNull(oheader.CD1_1)  ){
	nheader.CROTA2 = ncrot;
	nheader.CDELT1 = ocdelt1;
	nheader.CDELT2 = ocdelt2;
    } else {
	nheader.CD1_1 =  ocdelt1 * cosrot;
	nheader.CD1_2 = -ocdelt2 * sinrot;
	nheader.CD2_1 =  ocdelt1 * sinrot;
	nheader.CD2_2 =  ocdelt2 * cosrot;
    }
    // save ptype if possible
    if( raw.wcsinfo ){
	nheader.ptype = raw.wcsinfo.ptype;
    }
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("rotateData", args, opts.rawid);
    // rotate by reprojecting the data
    return this.reprojectData(nheader, opts);
};

// low-level reprojection: creates reprojected file, but does not display it
// instead, it returns the name of the reprojected FITS file (emscripten vfile)
// this is the basis for reprojectData, but can be used in other routines which
// require a reprojection
JS9.Image.prototype.reproject = function(wcsim, opts){
    let awvfile, awvfile2, wvfile, owvfile;
    let wcsheader, wcsstr, oheader, nheader, theader;
    let arr, ivfile, ovfile, rstr, key;
    let tab, tx1, tx2, ty1, ty2, s;
    let n, raw, avfile, earr, cmdswitches;
    let i, tid, traw, maxx, maxy, maxpix;
    let rcomplete = false;
    const twcs = {};
    const wcsexp = /SIMPLE|BITPIX|NAXIS|NAXIS[1-4]|AMDX|AMDY|CD[1-2]_[1-2]|CDELT[1-4]|CNPIX[1-4]|CO1_[1-9][0-9]|CO2_[1-9][0-9]|CROTA[1-4]|CRPIX[1-4]|CRVAL[1-4]|CTYPE[1-4]|CUNIT[1-4]|DATE|DATE_OBS|DC-FLAG|DEC|DETSEC|DETSIZE|EPOCH|EQUINOX|EQUINOX[a-z]|IMAGEH|IMAGEW|LATPOLE|LONGPOLE|MJD-OBS|PC00[1-4]00[1-4]|PC[1-4]_[1-4]|PIXSCALE|PIXSCAL[1-2]|PLTDECH|PLTDECM|PLTDECS|PLTDECSN|PLTRAH|PLTRAM|PLTRAS|PPO|PROJP[1-9]|PROJR0|PV[1-3]_[1-3]|PV[1-4]_[1-4]|RA|RADECSYS|SECPIX|SECPIX|SECPIX[1-2]|UT|UTMID|VELOCITY|VSOURCE|WCSAXES|WCSDEP|WCSDIM|WCSNAME|XPIXSIZE|YPIXSIZE|ZSOURCE|LTM|LTV/;
    const ptypeexp = /TAN|SIN|ZEA|STG|ARC/;
    const addwcsinfo = (header, wcsinfo) => {
	let theader;
	if( !wcsinfo ){ return header; }
	theader = $.extend(true, {}, header);
	if( JS9.isNull(theader.CRVAL1) && !JS9.isNull(wcsinfo.crval1) ){
	    theader.CRVAL1 = wcsinfo.crval1;
	}
	if( JS9.isNull(theader.CRVAL2) && !JS9.isNull(wcsinfo.crval2) ){
	    theader.CRVAL2 = wcsinfo.crval2;
	}
	if( JS9.isNull(theader.CRPIX1) && !JS9.isNull(wcsinfo.crpix1) ){
	    theader.CRPIX1 = wcsinfo.crpix1;
	}
	if( JS9.isNull(theader.CRPIX2) && !JS9.isNull(wcsinfo.crpix2) ){
	    theader.CRPIX2 = wcsinfo.crpix2;
	}
	if( JS9.isNull(theader.CDELT1) && !JS9.isNull(wcsinfo.cdelt1) ){
	    theader.CDELT1 = wcsinfo.cdelt1;
	}
	if( JS9.isNull(theader.CDELT2) && !JS9.isNull(wcsinfo.cdelt2) ){
	    theader.CDELT2 = wcsinfo.cdelt2;
	}
	if( JS9.isNull(theader.CROTA2) && !JS9.isNull(wcsinfo.crot) ){
	    theader.CROTA2 = wcsinfo.crot;
	}
	return theader;
    };
    // sanity checks
    if( !JS9.reproject || !wcsim || this === wcsim ){
	return;
    }
    if( !this.raws || !this.raws[0] ){
	JS9.error("no raw data for reprojection");
    }
    // go back to original data for reprojection
    raw = this.raws[0];
    if( !raw.header || !raw.wcsinfo ){
	JS9.error("no WCS info available for reprojection");
    }
    // opts is optional
    opts = opts || {};
    // make copy of input header, removing wcs keywords
    oheader = $.extend(true, {}, raw.header);
    for( key in oheader ){
	if( oheader.hasOwnProperty(key) ){
	    if( wcsexp.test(key) ){
		delete oheader[key];
	    }
	}
    }
    if( typeof wcsim === "object" ){
	// get wcs keywords from new header
	if( wcsim.raw && wcsim.raw.header ){
	    nheader = wcsim.raw.header;
	} else if( wcsim.BITPIX && wcsim.NAXIS1 && wcsim.NAXIS2 ){
	    // assume its a WCS header
	    nheader = wcsim;
	} else {
	    JS9.error("invalid wcs object input to reproject()");
	}
	for( key in nheader ){
	    if( nheader.hasOwnProperty(key) ){
		if( wcsexp.test(key) ){
		    twcs[key] = nheader[key];
		}
	    }
	}
	// combine new wcs keywords + old header keywords
	wcsheader = $.extend(true, {}, twcs, oheader);
	// sanity check on result
	if( !wcsheader.NAXIS || !wcsheader.NAXIS1 || !wcsheader.NAXIS2 ){
	    // JS9.error("invalid FITS image header");
	    return;
	}
	// convert reprojection header to a string
	wcsstr = JS9.raw2FITS(wcsheader, {addcr: true});
	// create vfile text file containing reprojection WCS
	wvfile = `wcs_${JS9.uniqueID()}.txt`;
	JS9.vfile(wvfile, wcsstr);
	// reprojection limits (if reproj lims == 0, use image limits)
	maxx = JS9.globalOpts.reproj.xdim || JS9.globalOpts.image.xdim;
	maxy = JS9.globalOpts.reproj.ydim || JS9.globalOpts.image.ydim;
	// check max image dimension (32-bits/pixels)
	maxpix = maxx * maxy * 32;
	// keep within the limits of current memory constraints, or die
	if((wcsheader.NAXIS1*wcsheader.NAXIS2*Math.abs(wcsheader.BITPIX))    > maxpix ||
	   (raw.header.NAXIS1*raw.header.NAXIS2*Math.abs(raw.header.BITPIX)) > maxpix ){
	    JS9.error(`the max reproject size is ${maxx} * ${maxy} * 4 bytes/pixel. You can use the Bin/Filter/Section plugin to extract a section, then save it as FITS and reproject the smaller image.`);
	}
    } else {
	wvfile = wcsim;
    }
    // check input and reproj WCS to make sure we can run fast mProjectPP
    // if not, try to make an alternate WCS header amenable to mProjectPP
    try{
	// try to change input WCS to a sys usable by mProjectPP
	if( !ptypeexp.test(raw.wcsinfo.ptype) ){
	    theader = addwcsinfo(raw.header, raw.wcsinfo);
	    owvfile = `owcs_${JS9.uniqueID()}.txt`;
	    JS9.vfile(owvfile, JS9.raw2FITS(theader, {addcr: true}));
	    awvfile = `awcs_${JS9.uniqueID()}.txt`;
	    rstr = JS9.tanhdr(owvfile, awvfile, "");
	    if( JS9.DEBUG > 1 ){
		JS9.log("tanhdr (input): %s %s -> %s",
			owvfile, awvfile, rstr);
	    }
	    JS9.vunlink(owvfile);
	    if( rstr.search(/\[struct stat="OK"/) >= 0 ){
		// add command switch to use this alternate wcs
		opts.cmdswitches = opts.cmdswitches || "";
		opts.cmdswitches += ` -i ${awvfile}`;
	    }
	}
	// try to change reproject WCS to a sys usable by mProjectPP
	if( (wcsim.raw && !ptypeexp.test(wcsim.raw.wcsinfo.ptype)) ||
	    (wcsim.ptype && !ptypeexp.test(wcsim.ptype))           ){
	    theader = addwcsinfo(nheader, wcsim.raw.wcsinfo);
	    owvfile = `owcs_${JS9.uniqueID()}.txt`;
	    JS9.vfile(owvfile, JS9.raw2FITS(theader, {addcr: true}));
	    awvfile2 = `awcs_${JS9.uniqueID()}.txt`;
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
    catch(ignore){ /* empty */ }
    // get reference to existing raw data file (or create one)
    if( raw.hdu && raw.hdu.fits.vfile ){
	// input file name
	ivfile = raw.hdu.fits.vfile;
	// add extension name or number
	if( raw.hdu.fits.extname ){
	    ivfile += `[${raw.hdu.fits.extname}]`;
	} else if( raw.hdu.fits.extnum &&
		   (raw.hdu.fits.extnum > 0) ){
	    ivfile += `[${raw.hdu.fits.extnum}]`;
	}
    } else {
	// input file name
	arr = this.toArray();
	ivfile = this.id.replace(/\.png$/, "_png" +  ".fits");
	JS9.vfile(ivfile, arr);
    }
    // output file name
    s = this.id
	.replace(/\[.*\]/, "")
	.replace(/\.png$/i, ".fits")
	.replace(/\.fz$/i, "")
	.replace(/\.gz$/i, "");
    ovfile = `reproj_${JS9.uniqueID()}_${s}`;
    // remove previous vfile for this reprojection layer, if possible
    tid = opts.rawid || "reproject";
    for(i=0; i<this.raws.length; i++){
	traw = this.raws[i];
	if( traw.id === tid ){
	    if( JS9.cleanupFITSFile(traw, true) ){
		break;
	    }
	}
    }
    // for tables, we probably have to bin it by adding a bin specification
    // also need to pass the HDU name. For now, "EVENTS" is all we know ...
    if( raw.hdu && raw.hdu.imtab === "table" && raw.hdu.table ){
	if( !ivfile.match(/\[bin /) ){
	    if( !ivfile.match(/\[EVENTS\]/) ){
		ivfile += "[EVENTS]";
	    }
	    tab = raw.hdu.table;
	    tx1 = Math.floor(tab.xcen - (tab.xdim/2) + 1);
	    tx2 = Math.floor(tab.xcen + (tab.xdim/2));
	    ty1 = Math.floor(tab.ycen - (tab.ydim/2) + 1);
	    ty2 = Math.floor(tab.ycen + (tab.ydim/2));
	    ivfile += `[bin X=${tx1}:${tx2},Y=${ty1}:${ty2}]`;
	}
    }
    // call the reproject routine
    try{
	// name of (unneeded) area file
	n = ovfile.lastIndexOf(".");
	if( n >= 0 ) {
	    avfile = `${ovfile.substring(0, n)}_area${ovfile.substring(n)}`;
	}
	// optional command line args
	cmdswitches = opts.cmdswitches || "";
	// no area file, but add global switches for reproject processing
	cmdswitches += ` -a 0 ${JS9.globalOpts.reprojSwitches}`;
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
	if( arr ){
	    JS9.vunlink(ivfile);
	}
	// ... then error check
	if( rstr.search(/\[struct stat="OK"/) < 0 ){
	    // signal this we completed the reproject attempt
	    rcomplete = true;
	    earr = rstr.match(/msg="(.*)"/);
	    if( earr && earr[1] ){
		JS9.error(`${earr[1]} (from mProjectPP)`);
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
    // return output file name
    return ovfile;
};

// high-level routine to reproject image using WCS info
// creates a new raw data layer ("reproject")
JS9.Image.prototype.reprojectData = function(...args){
    let i, im, ovfile;
    let [wcsim, opts] = args;
    // sanity checks
    if( !wcsim || !JS9.reproject ){
	return;
    }
    // is this a string containing an image name or WCS values?
    if( typeof wcsim === "string" ){
	if( wcsim === "all" ){
	    for(i=0; i<JS9.images.length; i++){
		im = JS9.images[i];
		if( this.display.id === im.display.id ){
		    im.reprojectData(this);
		}
	    }
	    return;
	}
	im = JS9.getImage(wcsim);
	if( im ){
	    // it was an image name, so change wcsim to the image handle
	    wcsim = im;
	} else {
	    JS9.error(`unknown WCS for reproject: ${wcsim}`);
	}
    }
    // don't reproject myself (useful in supermenu support, "all" reprojections)
    if( this === wcsim ){
	return;
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse reproject opts: ${opts}`, e); }
    }
    // save this routine so it can be reconstituted in a restored session
    // (unless another xxxData routine is calling us)
    if( !opts.rawid ){
	this.xeqStashSave("reprojectData", args, "reproject");
    }
    // save stash name
    if( !opts.stash ){
	opts.stash = "reprojectData";
    }
    // could take a while ...
    JS9.waiting(true, this.display);
    // set status
    this.setStatus("reprojectData", "processing");
    // ... start a timeout to allow the wait spinner to get started
    window.setTimeout(() => {
	let topts, reprojHandler;
	const defaultReprojHandler = (hdu) => {
	    // plugin callbacks
	    this.xeqPlugins("image", "onreprojectdata");
	    topts = topts || {};
	    topts.refreshRegions = true;
	    // reset section, unless specified otherwise
	    if( opts.resetSection !== false ){
		topts.resetSection = true;
	    }
	    // refresh the image
	    this.refreshImage(hdu, topts);
	    // set status
	    this.setStatus("reprojectData", "complete");
	    // might have to re-execute calls in the stash
	    this.xeqStashCall(this.xeqstash, [opts.stash, "reprojectData"]);
	};
	// opts is optional
	opts = opts || {};
	// handler
	reprojHandler = opts.reprojHandler || defaultReprojHandler;
	// call the low-level reproject routine, returning reprojected file
	ovfile = this.reproject(wcsim, opts);
	if( ovfile ){
	    // refresh image using the reprojected file ...
	    topts = $.extend(true, {}, JS9.fits.options, opts);
	    // ... in a new raw data layer
	    topts.rawid = topts.rawid || "reproject";
	    // save pointer to original wcs image
	    if( wcsim.raw && wcsim.raw.header ){
		topts.wcsim = wcsim;
	    }
	    // process the FITS file
	    try{ JS9.handleFITSFile(ovfile, topts, reprojHandler); }
	    catch(e){ JS9.error("can't process reprojected FITS file", e); }
	}
    }, JS9.SPINOUT);
    // allow chaining
    return this;
};

// apply image processing filters to the current RGB image
JS9.Image.prototype.filterRGBImage = function(...args){
    let key;
    let [filter] = args;
    const filters = [];
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
	JS9.error(`JS9 image filter '${filter}' not available`);
    }
    // special case: reset to original RGB data, contrast/bias
    if( filter === "reset" ){
	this.setColormap("reset");
	return this;
    }
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("filterRGBImage", args);
    // remove filter name arg
    args.shift();
    // add display context and RGB img arg
    args.unshift(this.display.context, this.rgb.img);
    // try to run the filter to generate a new RGB image
    try{ JS9.ImageFilters[filter](...args); }
    catch(e){ JS9.error(`JS9 image filter '${filter}' failed`, e); }
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
    let i, im, key, layer, dlayer;
    let got = 0;
    const odisplay = this.display;
    const ndisplay = JS9.lookupDisplay(dname);
    // sanity check
    if( !dname || !ndisplay ){
	JS9.error(`could not find display: ${dname}`);
	return null;
    }
    // clear old display first
    this.display.clearMessage();
    this.display.context.clear();
    // plugin callbacks
    this.xeqPlugins("image", "onimageclear");
    // make sure the main layers in the old display are in the new display
    for( key in odisplay.layers ){
	if( odisplay.layers.hasOwnProperty(key) ){
	    if( (odisplay.layers[key].dtype === "main") &&
		!ndisplay.layers[key] ){
		ndisplay.newShapeLayer(key, odisplay.layers[key].opts);
	    }
	}
    }
    // turn of display of layers in new display
    // don't want them showing on the new image ...
    if( ndisplay.image ){
	for( key in ndisplay.layers ){
	    if( ndisplay.layers.hasOwnProperty(key) ){
		if( ndisplay.layers[key].dtype === "main" ){
		    ndisplay.image.showShapeLayer(key, false, {local: true});
		}
	    }
	}
    }
    // re-assign each "main" layer from old display to new by:
    // saving the graphics, reassigning the canvas, restoring the graphics
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    layer = this.layers[key];
	    dlayer = ndisplay.layers[key];
	    if( dlayer ){
		this.showShapeLayer(key, false, {local: true});
                layer.dlayer = dlayer;
                layer.divjq = dlayer.divjq;
                layer.canvasjq = dlayer.canvasjq;
                layer.canvas = dlayer.canvas;
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
    // show shape layers in new display
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    this.showShapeLayer(key, true, {local: true});
	}
    }
    // ensure proper positions for graphics
    this.refreshLayers();
    // old display has no image
    odisplay.image = null;
    // display a different image in old display, if possible
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( odisplay === im.display ){
	    // avoid erroneous save of previous layers
	    im.display.image = null;
	    im.displayImage("all");
	    // ensure proper positions for graphics
	    im.refreshLayers();
	    // flag we found an image
	    got++;
	    break;
	}
    }
    // if display is in a lightwin and there are no other images, close it
    if( !got && odisplay.winid && odisplay.winid.close ){
	i = $.inArray(odisplay, JS9.displays);
	if( i >= 0 ){
	    JS9.displays.splice(i, 1);
	}
	odisplay.winid.close();
    }
    // allow chaining
    return this;
};

// save session to a json file
// NB: save is an image method, load is a display method
JS9.Image.prototype.saveSession = function(file, opts){
    let i, obj, str, blob, layer, dlayer, tobj, key, im, lpos, ipos;
    const saveim = () => {
	// object holding session keys
	const obj = {};
	// filename
	obj.file = this.file;
	// display size info
	obj.dwidth = this.display.width;
	obj.dheight = this.display.height;
	// image params
	obj.params = $.extend(true, {}, this.params);
	// temp values: explicitly save some of them
	obj.tmp = {};
	if( this.tmp.gridStatus === "active" ){
	    obj.tmp.gridStatus = "active";
	}
	// get center of displayed image in physical coords
	lpos = this.imageToLogicalPos({x:this.rgb.sect.xcen,
				       y:this.rgb.sect.ycen});
	ipos = this.maybePhysicalToImage(lpos);
	if( ipos ){
	    lpos = ipos;
	}
	// save section info
	obj.sect = {};
	obj.sect.xcen = lpos.x;
	obj.sect.ycen = lpos.y;
	obj.sect.xdim = this.raw.width;
	obj.sect.ydim = this.raw.height;
	obj.sect.zoom = this.rgb.sect.zoom;
	// layers
	obj.layers = [];
	for( key in this.layers ){
	    // save each main layer so it can be reconstituted
            if( this.layers.hasOwnProperty(key) ){
		layer = this.layers[key];
		dlayer = layer.dlayer;
		// only save layers on main display
		// don't save crosshair or grid
		if( dlayer.dtype === "main" &&
		    key !== "crosshair"     &&
		    key !== "grid"          ){
		    tobj = {};
		    tobj.name = key;
		    tobj.json = dlayer.canvas.toJSON(dlayer.el);
		    tobj.dopts = $.extend(true, {}, dlayer.opts);
		    if( layer.catalog ){
			tobj.catalog = layer.catalog;
		    }
		    if( layer.starbase ){
			tobj.starbase = JSON.stringify(layer.starbase);
		    }
		    obj.layers.push(tobj);
		}
	    }
	}
	// save blend state
	obj.blend = this.blend;
	// save routines which must be executed when restoring session
	obj.xeqstash = this.xeqstash;
	// save wcsim reference, if necessary
	if( this.wcsim && this.wcsim.id ){
	    obj.wcsim = this.wcsim.id;
	}
	// remove old display info
	if( obj.params.display ){
	    delete obj.params.display;
	}
	// we didn't save the crosshair
	obj.params.crosshair = false;
	return obj;
    };
    if( !window.hasOwnProperty("saveAs") ){
	JS9.error("no saveAs() available to save session");
    }
    // filename for saving
    file = file || "js9.ses";
    // make sure we have the right extension
    if( !file.match(/\.ses$/) ){
	file += ".ses";
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse session opts: ${opts}`, e); }
    }
    // change the cursor to show the waiting status
    JS9.waiting(true, this.display);
    // object we will save
    obj = {};
    // list of images to save
    obj.images = [];
    // which images to save?
    if( opts.mode === "display" ){
	// save all images in this display
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( im.display.id === this.display.id ){
		obj.images.push(saveim());
	    }
	}
    } else {
	// save current image
	obj.images.push(saveim());
    }
    // save display parameters
    obj.display = {blendMode: this.display.blendMode};
    // save global params
    obj.globals = $.extend(true, {}, JS9.globalOpts);
    // but delete properties which cause circular errors
    delete obj.globals.rgb;
    // save user-defined colormaps
    obj.cmaps = [];
    for(i=0; i<JS9.colormaps.length; i++){
	if( JS9.colormaps[i].source === "user" ){
	    obj.cmaps.push(JS9.colormaps[i]);
	}
    }
    // make a blob from the stringified session object
    try{ str = JSON.stringify(obj, null, 4); }
    catch(e){ JS9.error("can't create json file for save session", e); }
    blob = new Blob([str], {type: "application/json"});
    // save it
    saveAs(blob, file);
    // done waiting
    JS9.waiting(false);
    // return file name
    return file;
};

// stash a routine name and args
// the routine will be re-executed when the session is loaded
JS9.Image.prototype.xeqStashSave = function(func, args, id, context){
    let i, stash;
    // default context is image
    context = context || "image";
    // stash routine name and args
    this.xeqstash = this.xeqstash || {};
    // change display or image object to id
    for(i=0; i<args.length; i++){
	if( typeof args[i] === "object" ){
	    if( args[i] instanceof JS9.Image ){
		args[i] = args[i].id;
	    } else if( args[i] instanceof JS9.Display ){
		args[i] = args[i].id;
	    }
	}
    }
    // overwrite a previous stash having the same func, if it exists
    for(i=0; i<this.xeqstash.length; i++){
	stash = this.xeqstash[i];
	if( (stash.func === func) && (stash.context === context) ){
	    stash.args = args;
	    return this;
	}
    }
    // add new func to stash
    this.xeqstash[func] = {args, id, context};
    // allow chaining
    return this;
};

// call a stashed routine name and args
JS9.Image.prototype.xeqStashCall = function(xeqstash, exclArr){
    let key, xeq;
    xeqstash = xeqstash || this.xeqstash;
    for( key in xeqstash ){
	if( xeqstash.hasOwnProperty(key) ){
	    if( $.inArray(key, exclArr) >= 0 ){
		continue;
	    }
	    xeq = xeqstash[key];
	    xeq.context = xeq.context || "image";
	    try{
		switch(xeq.context){
		case "image":
		    this[key](...xeq.args);
		    break;
		case "display":
		    this.display[key](...xeq.args);
		    break;
		default:
		    this[key](...xeq.args);
		    break;
		}
	    }
	    catch(e){
		JS9.error(`error executing stash: ${key}`, e, false);
	    }
	}
    }
};

// execute plugins of various types (using type-specific values)
JS9.Image.prototype.xeqPlugins = function(xtype, xname, xval){
    let pname, pinst, popts, parr, evt;
    const xtrig = (name, obj) => {
        const s = `JS9:${name}`;
        $(document).trigger(s, obj);
    };
    // sanity checks
    if( !xtype || !xname || !JS9.globalOpts.xeqPlugins ){
	return;
    }
    // array of plugin instances
    parr = this.display.pluginInstances;
    // look for plugin callbacks to execute
    for( pname in parr ){
	if( parr.hasOwnProperty(pname) ){
	    pinst = parr[pname];
	    popts = pinst.plugin.opts;
	    if( pinst.isActive(xname) && typeof popts[xname] === "function" ){
		this.callingPlugin = xname;
		switch(xtype){
		case "image":
		    // used for: onimage[load,close,refresh,display]
		    try{
			popts[xname].call(pinst, this);
			xtrig(xname, {im: this});
                    }
		    catch(e){ pinst.errLog(xname, e); }
		    break;
		case "region":
		case "shape":
		    // used for: on[layer]change
		    // xval: pub
		    try{
			popts[xname].call(pinst, this, xval);
			xtrig(xname, {im: this, xreg: xval});
                    }
		    catch(e){ pinst.errLog(xname, e); }
		    break;
		case "keypress":
		    // used for: onkeypress, onkeydown
		    // xval: evt
		    evt = xval.originalEvent || xval;
		    try{
			popts[xname].call(pinst, this, this.ipos, evt);
			xtrig(xname, {im: this, ipos: this.ipos, evt: evt});
                    }
		    catch(e){ pinst.errLog(xname, e); }
		    break;
		case "mouse":
		    // used for: onmouse[down,move,over,out]
		    // xval: evt
		    if( !this.clickInRegion || popts[`${xname}_inRegion`] ){
			evt = xval.originalEvent || xval;
			try{
			    popts[xname].call(pinst, this, this.ipos, evt);
			    xtrig(xname, {im: this, ipos: this.ipos, evt: evt});
                        }
			catch(e){ pinst.errLog(xname, e); }
		    }
		    break;
		}
		delete this.callingPlugin;
	    }
	}
    }
    // allow chaining
    return this;
};

// upload virtual file to proxy server
JS9.Image.prototype.uploadFITSFile = function(){
    let vfile, vdata;
    const uploadCB = (r) => {
	delete this.tmp.upload;
	window.setTimeout(() => { JS9.progress(false); }, 1000);
	if( r.stderr ){
	    JS9.error(r.stderr);
	} else if( r.stdout ){
	    // set FITS filename and proxy filename
	    this.fitsFile = r.stdout.trim();
	    this.proxyFile = this.fitsFile;
	    if( JS9.globalOpts.prependJS9Dir         &&
		!this.fitsFile.match(/^\${JS9_DIR}/) &&
		this.fitsFile.charAt(0) !== "/"      ){
		this.fitsFile = `\${JS9_DIR}/${this.fitsFile}`;
	    }
	    // re-query for analysis
	    this.queryHelper("all");
	}
    };
    // sanity check
    if( !JS9.worker ){
	return;
    }
    // only supported when using socket.io ...
    if( JS9.helper.type !== "nodejs" && JS9.helper.type !== "socket.io" ){
	return;
    }
    // ... and only when we have a virtual file to upload
    if( !this.raw.hdu || !this.raw.hdu.fits || !this.raw.hdu.fits.vfile ){
	return;
    }
    // only one upload at a time
    if( this.tmp.upload ){
	JS9.error("only one upload allowed at a time");
    }
    // this is the file to upload
    vfile = this.raw.hdu.fits.vfile;
    // ask the remote server if we can upload
    JS9.helper.send("quotacheck", null, (robj) => {
	// check quota, only errors matter
	if( robj.stderr || robj.errcode ){
	    JS9.error(robj.stderr || `from quotacheck: ${robj.errcode}`);
	}
	vdata = JS9.vread(vfile, "binary");
	JS9.worker.socketio(() => {
	    this.tmp.upload = true;
	    JS9.progress(true, this.display);
	    JS9.worker.postMessage("uploadFITS",
				   [vfile, vdata], uploadCB, [vdata.buffer]);
	});
    });
    return this;
};

// remove proxy file from a remote server
JS9.Image.prototype.removeProxyFile = function(s){
    let t, reset, file, regexp;
    const func = (r) => {
	if( reset ){
	    if( r && r.stdout.trim() === "OK" ){
		this.proxyFile = null;
		this.fitsFile = null;
		this.analysisPackages = null;
		this.queryHelper("all");
	    }
	}
    };
    // arg can be a boolean, which means remove proxyFile and reset
    if( typeof s === "boolean" ){
	reset = s;
    } else if( typeof s === "string" ){
	// specify file to remove in the working directory
	// check for attempt to break out of the working dir using abs path
	if( s.match(/^\//) ){
	    return;
	}
	// remove possible install dir prefix and then ...
	// check attempt to break out of the working dir using ".."
	regexp = new RegExp(`^${JS9.INSTALLDIR}`);
	t = s.replace(regexp, "");
	if( t.match(/\.\./) ){
	    return;
	}
	file = s;
    } else {
	// default is to remove the proxy file
	if( !this.proxyFile ){
	    return;
	}
	file = this.proxyFile;
    }
    // sanity check
    if( !file ){
	return;
    }
    // ask to remove proxy file, and process result
    JS9.Send('removeproxy', {'cmd': `js9Xeq removeproxy ${file}`}, func);
};

// convert table to a shape array for the given image
JS9.Image.prototype.starbaseToShapes = function(starbase, opts){
    let i, j, k, shape, pos, siz, reg, data, header, delims, sizefunc;
    let xcol, ycol, ra, dec, owcssys, wcssys, tcol, tregexp;
    const global = JS9.globalOpts.catalogs;
    const xcols = JS9.globalOpts.catalogs.ras;
    const ycols = JS9.globalOpts.catalogs.decs;
    const regs = [];
    const getpos = (ra, dec) => {
	let arr;
	arr = JS9.wcs2pix(this.raw.wcs, ra, dec).trim().split(/ +/);
	if( arr && arr.length ){
	    return {x: parseFloat(arr[0]), y: parseFloat(arr[1])};
	}
	return null;
    };
    const getcol = (starbase, header, cols, defcol) => {
	let i, j, col;
	if( defcol !== undefined ){
	    col = defcol;
	} else {
	    // look for an exact match
	    col = -1;
	    for(j=0; j<cols.length; j++){
		for(i=0; i<header.length; i++){
		    if( cols[j].toLowerCase() === header[i].toLowerCase() ){
			col = starbase[header[i]];
			break;
		    }
		}
		if( col >= 0 ){
		    break;
		}
	    }
	    // no exact match, look for an approx match
	    if( col < 0 ){
		tcol = cols[0];
		tregexp = new RegExp(`^${tcol}`, "i");
		for(i=0; i<header.length; i++){
		    if( header[i].match(tregexp) ){
			col = starbase[header[i]];
			break;
		    }
		}
	    }
	    // no approx match, look for a less restrictive approx match
	    if( col < 0 ){
		tcol = cols[0];
		tregexp = new RegExp(`.*${tcol}.*`, "i");
		for(i=0; i<header.length; i++){
		    if( header[i].match(tregexp) ){
			col = starbase[header[i]];
			break;
		    }
		}
	    }
	}
	return col;
    };
    // sanity check
    if( !starbase || !starbase.data || !starbase.headline ){
	return;
    }
    data = starbase.data;
    header = starbase.headline;
    delims = starbase.delims;
    // opts is optional
    opts = opts || {};
    xcol = getcol(starbase, header, xcols, opts.xcol);
    if( xcol < 0 ){
	JS9.error("can't find an RA column (see Preferences:catalogs)");
    }
    ycol = getcol(starbase, header, ycols, opts.ycol);
    if( ycol < 0 ){
	JS9.error("can't find a Dec column (see Preferences:catalogs)");
    }
    // process shape
    shape = opts.shape || global.shape || "circle";
    switch(shape){
    case "box":
	// eslint-disable-next-line no-unused-vars
	sizefunc = () => {
	    return { width: opts.width   || global.width  || 7,
		     height: opts.height || global.height || 7 };
	};
	break;
    case "circle":
	// eslint-disable-next-line no-unused-vars
	sizefunc = () => {
	    return { radius: opts.radius || global.radius || 3.5};
	};
	break;
    case "ellipse":
	// eslint-disable-next-line no-unused-vars
	sizefunc = () => {
	    return { r1: opts.r1  || global.r1  || 3.5,
		     r2: opts.r2  || global.r2  || 3.5 };
	};
	break;
    default:
	// eslint-disable-next-line no-unused-vars
	sizefunc = () => {
	    return { width: opts.width || 7, height: opts.height || 7 };
	};
	break;
    }
    // save original wcs system
    owcssys = this.getWCSSys();
    // set wcs system for catalogs
    if( opts.wcssys ){
	wcssys = opts.wcssys;
    } else if( global.wcssys ){
	wcssys = global.wcssys;
    } else {
	// umm ...
	wcssys = "ICRS";
    }
    // set wcssys for this catalog
    this.setWCSSys(wcssys);
    // convert each catalog object in the table into a JS9 shape
    for(i=0, j=0; i<data.length; i++){
	ra = data[i][xcol];
	dec = data[i][ycol];
	// various ways we might specify hms
	if( (delims[xcol] !== "\0")  && (":h ".includes(delims[xcol])) &&
	    (wcssys !== "galactic")  && (wcssys !== "ecliptic")        ){
	    ra *= 15.0;
	}
	pos = getpos(ra, dec);
	if( pos ){
	    siz = sizefunc();
	    reg = {id: i.toString(), shape: shape,
		   x: pos.x, y: pos.y,
		   width: siz.width, height: siz.height,
		   radius: siz.radius,
		   r1: siz.r1, r2: siz.r2,
		   angle: 0,
		   data: {ra, dec}};
	    // save catalog columns for this row
	    if( (opts.save !== false) &&
		(JS9.globalOpts.catalogs.save !== false) ){
		for(k=0; k<=header.length; k++){
		    if( header[k] ){
			reg.data[header[k]] = data[i][k];
		    }
		}
	    }
	    if( opts.color ){
		reg.color = opts.color;
	    }
	    regs[j++] = reg;
	}
    }
    // restore original wcs
    this.setWCSSys(owcssys);
    return regs;
};

// read a tab-delimited, #-commented table (starbase table), create a catalog
JS9.Image.prototype.loadCatalog = function(...args){
    let [layer, catalog, opts] = args;
    let shapes, topts, starbase;
    const lopts = $.extend(true, {}, JS9.Catalogs.opts);
    const global = JS9.globalOpts.catalogs;
    const defconv = (s) => {
	const delims = " \t-.:hdmsr'\"";
	const obj = {};
	obj.val = JS9.saostrtod(s);
	obj.delim = String.fromCharCode(JS9.saodtype());
	if( (obj.delim !== "\0") && (delims.includes(obj.delim)) ){
	    // valid delim means we converted to a float
	    return obj;
	} else if( JS9.isNumber(s) ){
	    // no delim, but its a number, so must be an int
	    return obj;
	}
	// everything else is a string
	obj.val = s;
	return obj;
    };
    // special case: 1 non-string arg is the catalog, not the layer
    if( args.length === 1 && typeof layer !== "string" ){
	catalog = layer;
	layer = null;
    }
    // special case: 2 non-string args: file and obj, not the layer
    if( args.length === 2 && typeof layer !== "string" ){
	opts = catalog;
	catalog = layer;
	layer = null;
    }
    // sanity check
    if( !catalog ){
	return;
    }
    if( global.tooltip ){
	lopts.tooltip = global.tooltip;
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse catalog opts: ${opts}`, e); }
    }
    // default color, if none specified
    opts.color = opts.color || global.color || "#00FF00";
    // wcs system
    opts.wcssys = opts.wcssys || global.wcssys;
    // update the WCS strings when adding a catalog shape
    opts.updateWCS = true;
    // starbase opts
    topts = {convFuncs:  {def: defconv},
	     units: opts.units || global.units,
	     skip:  opts.skip  || global.skip};
    // generate starbase table
    try{ starbase = new JS9.Starbase(catalog, topts); }
    catch(e){ JS9.error("could not parse catalog. Is it in tab-separated column format?"); }
    // sanity checks
    if( !starbase || !starbase.data || !starbase.data.length ){
	JS9.error("no objects found in catalog");
    }
    // generate new catalog shapes
    shapes = this.starbaseToShapes(starbase, opts);
    if( shapes.length ){
	// layer name
	layer = layer || `catalog_${JS9.uniqueID()}` ;
	// create a new layer, if necessary
	this.display.newShapeLayer(layer, lopts);
	// delete any old shapes
	this.removeShapes(layer);
	// save the original catalog before adding shapes
	this.layers[layer].catalog = catalog;
	this.layers[layer].starbase = starbase;
	// add them to the catalog layer
	this.addShapes(layer, shapes, opts);
    } else {
	JS9.error("no catalog objects found");
    }
    // allow chaining
    return this;
};

// save catalog as a file
JS9.Image.prototype.saveCatalog = function(fname, which){
    let layer, cat, blob;
    layer = which || this.activeShapeLayer();
    if( !this.layers[layer] || !this.layers[layer].catalog ){
	if( layer && layer !== "undefined" ){
	    JS9.error(`no catalog available: ${layer}`);
	} else {
	    JS9.error("no active catalog available");
	}
    }
    cat = this.layers[layer].catalog;
    blob = new Blob([cat], {type: "text/plain;charset=utf-8"});
    fname = fname || `${layer}.cat`;
    if( !fname.match(/\.cat$/) ){
	fname += ".cat";
    }
    if( window.hasOwnProperty("saveAs") ){
	saveAs(blob, fname);
    } else {
	JS9.error("no saveAs() available to save catalog");
    }
    return fname;
};

// convert ra, dec from one wcs to another
JS9.Image.prototype.wcs2wcs = function(from, to, ra, dec){
    let owcssys, ounits, nwcs, arr, x, y, s, v0;
    // save current wcs and units
    owcssys = this.getWCSSys();
    ounits = this.getWCSUnits();
    // to, from default to current wcs
    from = from || owcssys;
    to = to || owcssys;
    //  convert ra, dec from string input to float degrees, if necessary
    if( typeof ra === "string" ){
	v0 = JS9.strtoscaled(ra);
	if( (v0.dtype === ":") &&
	    (from !== "galactic") && (from !== "ecliptic") ){
	    v0.dval *= 15.0;
	}
	ra = v0.dval;
    }
    if( typeof dec === "string" ){
	v0 = JS9.strtoscaled(dec);
	dec = v0.dval;
    }
    // temporarily set the wcs to what we are converting from
    nwcs = this.setWCSSys(from).getWCSSys();
    // make sure change was successful
    if( from !== "native" ){
	if( nwcs !== from ){
	    JS9.error(`unknown or invalid wcs: ${from}`);
	}
    }
    // convert input ra, dec into image pixels in this wcs
    arr = JS9.wcs2pix(this.raw.wcs, ra, dec).trim().split(/ +/);
    x = parseFloat(arr[0]);
    y = parseFloat(arr[1]);
    // set wcs back to the target wcs
    this.setWCSSys(to);
    // convert image pixels from input ra, dec into target wcs
    this.setWCSUnits("degrees");
    s = JS9.pix2wcs(this.raw.wcs, x, y).trim();
    // reset wcs to original
    this.setWCSUnits(ounits);
    if( owcssys !== to ){
	this.setWCSSys(owcssys);
    }
    // return result
    return s;
};

// convert wcs, physical or image image length to image length,
// using current wcs and string delimiters to determine what input type
JS9.Image.prototype.wcs2imlen = function(s){
    let v, wcsinfo;
    let dpp = 1;
    // sanity check
    if( !s ){
	return;
    }
    v = JS9.strtoscaled(s);
    wcsinfo = this.raw.wcsinfo || {cdelt1: 1, cdelt2: 1};
    // oh dear, this is cheating ...
    if( wcsinfo.cdelt1 !== undefined ){
	dpp = wcsinfo.cdelt1;
    } else if( wcsinfo.cdelt2 !== undefined ){
	dpp = wcsinfo.cdelt2;
    }
    switch(this.params.wcssys){
    case "image":
	break;
    case "physical":
	// use the LTM1_1 value stored for logical to image transforms
	if( this.lcs && this.lcs.physical ){
	    v.dval = v.dval * this.lcs.physical.forward[0][0];
	}
	break;
    default:
	// cheap conversion of wcs len to image len
	if( v.dtype && (v.dtype !== ".") && (v.dtype !== "\0")  ){
	    v.dval = Math.abs(v.dval / dpp);
	}
	break;
    }
    return v.dval;
};

// ---------------------------------------------------------------------
// JS9 Colormap support
// ---------------------------------------------------------------------

JS9.Colormap = function(...args){
    let [name, a1, a2, a3] = args;
    let i, got;
    // sanity check
    if( !name ){
	return;
    }
    // there are two types of colormap, based on number of args
    this.name = name;
    switch(args.length){
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
    // flag whether this was a core or user-defined colormap
    if( !JS9.inited ){
	this.source = "core";
    } else {
	this.source = "user";
    }
    // replace or append
    for(i=0; i<JS9.colormaps.length; i++){
	if( JS9.colormaps[i].name === this.name ){
	    JS9.colormaps[i] = this;
	    got = true;
	    break;
	}
    }
    if( !got ){
	JS9.colormaps.push(this);
    }
    // debugging
    if( JS9.DEBUG > 1 ){
	JS9.log("JS9 colormap:  %s", this.name);
    }
};

JS9.Colormap.prototype.mkColorCell = function(ii){
    let m, x, i, j, val, vertex, len, size, index;
    const count = JS9.COLORSIZE;
    const umax = 255;
    const rgb = [0, 0, 0];
    switch(this.type){
    // from: tksao1.0/colormap/sao.C
    case "sao":
	x = ii / count;
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
	size = this.colors.length;
	// index into the evenly spaced RGB values
	index = Math.floor(ii*size/count);
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
    // pass jQuery element, DOM element, or id
    if( el instanceof jQuery ){
	this.divjq = el;
    } else if( typeof el === "object" ){
	this.divjq = $(el);
    } else {
	this.divjq = $(`#${el}`);
    }
    // make sure div has some id
    if( !this.divjq.attr("id") ){
	this.divjq.attr("id", JS9.DEFID);
    }
    // save id
    this.id = this.divjq.attr("id");
    // display-specific scratch space
    this.tmp = {};
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
    // save original width and height
    this.width0 = this.width;
    this.height0 = this.height;
    // create DOM canvas element
    this.canvas = document.createElement("canvas");
    // jquery version for event handling and DOM manipulation
    this.canvasjq = $(this.canvas)
	.addClass("JS9Image")
	.attr("id", `${this.id}Image`)
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
    if( !JS9.allinone ){
	this.iconjq = $("<div>")
	    .addClass("JS9Logo")
	    .css("display", "none")
	    .css("z-index", JS9.ZINDEX+1)
	    .appendTo(this.divjq);
	this.iconimgjs = $("<img>")
	    .addClass("JS9Logo")
	    .attr("src", JS9.InstallDir("images/js9logo.png"))
	    .attr("alt", "js9")
	    .attr("title", "js9")
	    .appendTo(this.iconjq);
	if( JS9.globalOpts.logoDisplay ){
	    this.iconjq.css("display", "block");
	}
    }
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
	this.resizeSensor = new ResizeSensor(this.divjq, () => {
	    let nwidth = this.divjq.width();
	    let nheight = this.divjq.height();
	    if( JS9.bugs.webkit_resize ){
		nwidth  -= JS9.RESIZEFUDGE;
		nheight -= JS9.RESIZEFUDGE;
	    }
	    this.resize(nwidth, nheight);
	});
    }
    // drawing context
    this.context = this.canvas.getContext("2d");
    // turn off anti-aliasing
    if( !JS9.ANTIALIAS ){
	this.context.imageSmoothingEnabled = false;
	this.context.webkitImageSmoothingEnabled = false;
	this.context.msImageSmoothingEnabled = false;
    }
    // add the display tooltip
    this.tooltip = $("<div>")
	.attr("id", `tooltip_${this.id}`)
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
    this.divjq.on("mouseenter", this, (evt) => {
	return JS9.mouseEnterCB(evt);
    });
    this.divjq.on("mouseover", this, (evt) => {
	return JS9.mouseOverCB(evt);
    });
    this.divjq.on("mousedown touchstart", this, (evt) => {
	return JS9.mouseDownCB(evt);
    });
    this.divjq.on("mousemove touchmove", this, (evt) => {
	return JS9.mouseMoveCB(evt);
    });
    this.divjq.on("mouseup touchend", this, (evt) => {
	return JS9.mouseUpCB(evt);
    });
    this.divjq.on("mouseout", this, (evt) => {
	return JS9.mouseOutCB(evt);
    });
    this.divjq.on("keypress", this, (evt) => {
	return JS9.keyPressCB(evt);
    });
    this.divjq.on("keydown", this, (evt) => {
	return JS9.keyDownCB(evt);
    });
    this.divjq.on("keyup", this, (evt) => {
	return JS9.keyUpCB(evt);
    });
    this.divjq.on("wheel", this, (evt) => {
	return JS9.wheelCB(evt);
    });
    // set up drag and drop, if available
    this.divjq.on("dragenter", this, (evt) => {
	return JS9.dragenterCB(this.id, evt);
    });
    this.divjq.on("dragover", this, (evt) => {
	return JS9.dragoverCB(this.id, evt);
    });
    this.divjq.on("dragexit", this, (evt) => {
	return JS9.dragexitCB(this.id, evt);
    });
    this.divjq.on("drop", this, (evt) => {
	return JS9.dragdropCB(this.id, evt);
    });
    // no context menus on the display
    this.divjq.on("contextmenu", this, () => {
	return false;
    });
    // add local file open support
    this.addFileDialog("Load", JS9.globalOpts.imageTemplates);
    this.addFileDialog("RefreshImage", JS9.globalOpts.imageTemplates);
    this.addFileDialog("LoadRegions", JS9.globalOpts.regionTemplates);
    this.addFileDialog("LoadSession", JS9.globalOpts.sessionTemplates);
    this.addFileDialog("LoadColormap", JS9.globalOpts.colormapTemplates);
    this.addFileDialog("LoadCatalog", JS9.globalOpts.catalogTemplates);
    // add to list of displays
    JS9.displays.push(this);
    // debugging
    if( JS9.DEBUG ){
	JS9.log("JS9 display:  %s", this.id);
    }
};

// add support for file dialog box which executes JS9 routine on file blobs
JS9.Display.prototype.addFileDialog = function(funcName, template){
    let jdiv, jinput, id;
    // sanity check
    if( !funcName || !JS9.publics[funcName] ){
	    return;
    }
    id = `openLocal${funcName}-${this.id}`;
    // outer div
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
    // recommends opacity over visibility, but it breaks the menubar in ios
    jdiv = $("<div>")
	.css("visibility", "hidden")
	.css("position", "relative")
	.css("top", -50)
	.css("left", -50)
	.appendTo(this.divjq);
    // inner file input element
    jinput = $("<input>")
	.attr("type", "file")
	.attr("id", id)
	.attr("multiple", true)
	.appendTo(jdiv);
    // add accept template, if possible
    if( template ){
	jinput.attr("accept", template);
    }
    // add callback for when input changes
    jinput.on("change", (e) => {
        let i, opts;
        const el = e.currentTarget;
        if (el.files.length  && (funcName === "Load" || funcName === "RefreshImage")) {
            opts = {localAccess: true};
            JS9.waiting(true, this);
        }
        for(i=0; i<el.files.length; i++){
            // execute a JS9 public access routine
            JS9.publics[funcName](el.files[i], opts, {display: this.id});
        }
        el.value = null;
        return false;
    });
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
    this.progressArea = $("<div>")
	.addClass("JS9Progress")
	.addClass("JS9Message")
	.appendTo(this.messageContainer);
    this.progressBar = $("<progress>")
	.addClass("JS9ProgressBar")
	.attr("value", 0)
	.attr("max", 100)
	.attr("name", "progress")
	.appendTo(this.progressArea);
    // make it draggable, if possible
    try{
	this.messageContainer.draggable({
	    // eslint-disable-next-line no-unused-vars
	    start(event, ui) {
		this.oicb = JS9.globalOpts.internalContrastBias;
		JS9.globalOpts.internalContrastBias = false;
	    },
	    // eslint-disable-next-line no-unused-vars
	    stop(event, ui) {
		JS9.globalOpts.internalContrastBias = this.oicb;
	    }
	});
    }
    catch(ignore){ /* empty */ }
    // allow chaining
    return this;
};

//  display a plugin in a light window or a new window
JS9.Display.prototype.displayPlugin = function(plugin){
    let i, a, w, h, p, r, s, title, name, did, oid, iid, odiv, pdiv, pinst, win;
    if( typeof plugin === "string" ){
	for(i=0; i<JS9.plugins.length; i++){
	    p = JS9.plugins[i];
	    if( p.name === plugin ){
		plugin = p;
		break;
	    }
	}
    }
    if( typeof plugin !== "object" || !plugin.name ){
	JS9.error("unknown plugin type for displayPlugin");
    }
    pinst = this.pluginInstances[plugin.name];
    // some day we want to support light windows and new (external) windows
    switch(JS9.globalOpts.winType){
    case "light":
	a = JS9.lightOpts[JS9.LIGHTWIN];
	if( !pinst || !pinst.status ){
	    // no spaces in an id
	    name = plugin.name.replace(/\s/g, "_");
	    // convenience ids
	    did = `${this.id}_${name}_lightDiv`;
	    oid = `${this.id}_${name}_outerDiv`;
	    iid = `${this.id}_${name}_innerDiv`;
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
	    pdiv = $(`#${did} #${iid}`);
	    // create the plugin inside the inner div
	    pinst = JS9.instantiatePlugin(pdiv, plugin, win);
	    pinst.winHandle.onclose = () => {
		// just hide the window
		pinst.winHandle.hide();
		pinst.status = "inactive";
		if( plugin.opts.onpluginclose ){
		    try{
			plugin.opts.onpluginclose.call(pinst, this.image);
		    }
		    catch(e){
			JS9.log("onplugincloseCB: %s [%s]\n%s",
				plugin.name, e.message, JS9.strace(e));
		    }
		}
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
		if( plugin.opts.onpluginclose ){
		    try{
			plugin.opts.onpluginclose.call(pinst, this.image);
		    }
		    catch(e){
			JS9.log("onplugincloseCB: %s [%s]\n%s",
				plugin.name, e.message, JS9.strace(e));
		    }
		}
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
    let i, div, im, key, layer, nwidth, nheight, nleft, ntop, pinst;
    const repos = (o) => {
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
    // 'full' or 'reset' or 'image'
    if( width === "full" ){
	opts = height;
	if( window.innerWidth ){
	    width = window.innerWidth;
	}
	if( window.innerHeight ){
	    // including menubar, if available
	    height = window.innerHeight;
	    // divs we take into account when centering
	    for(i=0; i<JS9.globalOpts.centerDivs.length; i++){
		div = JS9.globalOpts.centerDivs[i];
		if( this.pluginInstances[div] ){
		    height -= this.pluginInstances[div].divjq.height();
		}
	    }
	}
    } else if( width === "image" ){
	if( !this.image ){
	    JS9.error("can't resize display to 'image' without an image");
	}
	opts = height;
	width = this.image.raw.width;
	height = this.image.raw.height;
    } else if( width === "reset" ){
	opts = height;
	width = this.width0 || width;
	height = this.height0 || height;
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
    // change the menubar width, unless explicitly told not to
    if( $.inArray("JS9Menubar", JS9.globalOpts.resizeDivs) >= 0 &&
	(JS9.isNull(opts.resizeMenubar) || opts.resizeMenubar) ){
	pinst = this.pluginInstances.JS9Menubar;
	if( pinst ){
	    $(`#${this.id}Menubar`).css("width", nwidth);
	}
    }
    // change the toolbar width, unless explicitly told not to
    if( $.inArray("JS9Toolbar", JS9.globalOpts.resizeDivs) >= 0 &&
	(JS9.isNull(opts.resizeToolbar) || opts.resizeToolbar) ){
	pinst = this.pluginInstances.JS9Toolbar;
	if( pinst ){
	    // set new value for width
	    pinst.divjq.attr("data-width", `${String(nwidth)}px`);
	    // re-init toolbar for this size
	    JS9.Toolbar.init.call(pinst);
	}
    }
    // change the colorbar width, unless explicitly told not to
    if( $.inArray("JS9Colorbar", JS9.globalOpts.resizeDivs) >= 0 &&
	(JS9.isNull(opts.resizeColorbar) || opts.resizeColorbar) ){
	pinst = this.pluginInstances.JS9Colorbar;
	if( pinst ){
	    // set new value for width
	    pinst.divjq.attr("data-width", `${String(nwidth)}px`);
	    // re-init colorbar for this size
	    JS9.Colorbar.init.call(pinst);
	}
    }
    // change size of shape canvases
    for( key in this.layers ){
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
			if( layer.dlayer.type === "main" && !layer.json ){
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
    // redisplay current image, if necessary
    if( this.image && (JS9.globalOpts.resizeRedisplay || !this.resizing) ){
	this.image.displayImage("all", opts);
	this.image.refreshLayers();
    }
    // center, if necessary
    if( opts.center ){
	this.center();
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

// scroll the display to the center of the viewport
// http://stackoverflow.com/questions/18150090/jquery-scroll-element-to-the-middle-of-the-screen-instead-of-to-the-top-with-a
JS9.Display.prototype.center = function(){
    const el = this.divjq;
    let i, div, tel, voffset, hoffset;
    let elVOffset = el.offset().top;
    let elHeight = el.height();
    const windowHeight = $(window).height();
    const elHOffset = el.offset().left;
    const elWidth = el.width();
    const windowWidth = $(window).width();
    const speed = 250;
    // divs we take into account when getting total height
    for(i=0; i<JS9.globalOpts.centerDivs.length; i++){
	div = JS9.globalOpts.centerDivs[i];
	if( this.pluginInstances[div] ){
	    tel = this.pluginInstances[div].divjq;
	    elHeight += tel.height();
	    elVOffset = Math.min(tel.offset().top, elVOffset);
	}
    }
    if (elHeight < windowHeight) {
	voffset = elVOffset - ((windowHeight / 2) - (elHeight / 2));
    }
    else {
	voffset = elVOffset;
    }
    if (elWidth < windowWidth) {
	hoffset = elHOffset - ((windowWidth / 2) - (elWidth / 2));
    }
    else {
	hoffset = elHOffset;
    }
    $('html, body').animate({scrollTop: voffset, scrollLeft: hoffset}, speed);
    // allow chaining
    return this;
};

// gather images from other displays into this display
JS9.Display.prototype.gather = function(opts){
    let i, arr, uim;
    // opts are optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse gather opts: ${opts}`, e); }
    }
    // array of images to use or all of them
    arr = opts.images || JS9.images;
    for(i=0; i<arr.length; i++){
	if( typeof arr[i] === "number" ){
	    uim = JS9.images[arr[i]];
	} else {
	    uim = arr[i];
	}
	if( uim && uim.display !== this ){
	    uim.moveToDisplay(this);
	}
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	if( this.image ){
	    this.image.xeqPlugins("image", "ongatherdisplay");
	}
    }
};

// separate images in this display into new displays
JS9.Display.prototype.separate = function(opts){
    let arr, d0, d1;
    let nsep = 0;
    let row = 0;
    let col = 0;
    let myid = 1;
    const sep = {};
    const saveims = {};
    const rexp = /_sep[0-9][0-9]*/;
    const sepopts = JS9.globalOpts.separate;
    const menuStr = "<div class='JS9Menubar' id='%sMenubar' data-width=%s></div>";
    const toolStr = "<div class='JS9Toolbar' id='%sToolbar' data-width=%s></div>";
    const js9Str = "<div class='JS9' id='%s' data-width=%s data-height=%s></div>";
    const colorStr = "<div style='margin-top: 2px;'><div class='JS9Colorbar' id='%sColorbar' data-width=%s></div></div>";
    const winoptsStr = "width=%s,height=%s,top=%s,left=%s,resize=1,scolling=1";
    const SIZE_FUDGE = JS9.bugs.webkit_resize ? JS9.RESIZEFUDGE : 0;
    const COLORBAR_FUDGE = 7;
    const DHTML_HEIGHT = 30 + 13; // height of dhtml lightwin extras;
    const initopts = (fromID, opts) => {
	// sanity check
	if( !fromID ){
	    JS9.error("can't init seapration ops: no from id");
	}
	sep.layout = opts.layout || JS9.globalOpts.separate.layout || "auto";
	sep.leftMargin = opts.leftMargin || sepopts.leftMargin || 0;
	sep.topMargin  = opts.topMargin  || sepopts.topMargin  || 0;
	switch(sep.layout){
	case "auto":
	    col = 1;
	    row = 0;
	    break;
	case "horizontal":
	    col = 1;
	    row = 0;
	    break;
	case "vertical":
	    col = 0;
	    row = 1;
	    break;
	default:
	    col = 1;
	    row = 0;
	    break;
	}
	sep.topExtra = DHTML_HEIGHT;
	sep.leftExtra = 0;
	sep.js9 = $(`#${fromID}`);
	sep.menubar = $(`#${fromID}Menubar`);
	if( sep.menubar.length > 0 ){
	    sep.menubar.isactive = sep.menubar.closest(".JS9PluginContainer").css("visibility") === "visible";
	}
	sep.toolbar = $(`#${fromID}Toolbar`);
	if( sep.toolbar.length > 0 ){
	    sep.toolbar.isactive = sep.toolbar.closest(".JS9PluginContainer").css("visibility") === "visible";
	}
	sep.colorbar = $(`#${fromID}Colorbar`);
	if( sep.colorbar.length > 0 ){
	    sep.colorbar.isactive = sep.colorbar.closest(".JS9PluginContainer").css("visibility") === "visible";
	}
	if( sep.js9.length > 0 ){
	    // hack: height of the dhtml drag handle and status area
	    sep.width = sep.js9.width();
	    sep.height = sep.js9.height();
	    sep.top = sep.js9.offset().top - $(window).scrollTop();
	    sep.left = sep.js9.offset().left - $(document).scrollLeft();
	    if( sep.menubar.isactive ){
		sep.height += sep.menubar.height();
		sep.top -= sep.menubar.height();
	    }
	    if( sep.toolbar.isactive ){
		sep.height += sep.toolbar.height();
		sep.top -= sep.toolbar.height();
	    }
	    if( sep.colorbar.isactive ){
		sep.height += sep.colorbar.height();
		sep.top -= sep.colorbar.height();
		sep.top += COLORBAR_FUDGE;
	    }
	}
    };
    const getopts = (fromID, toID) => {
	let html, winopts;
	if( fromID ){
	    if( sep.js9.length > 0 ){
		html = "";
		if( sep.menubar.isactive ){
		    html += sprintf(menuStr, toID, sep.js9.width());
		}
		if( sep.toolbar.isactive ){
		    html += sprintf(toolStr, toID, sep.js9.width());
		}
		html += sprintf(js9Str,
				toID,
				sep.js9.width()-SIZE_FUDGE,
				sep.js9.height()-SIZE_FUDGE);
		if( sep.colorbar.isactive ){
		    html += sprintf(colorStr, toID, sep.js9.width());
		}
	    }
	    if( sep.layout === "auto" ){
		if( (sep.left + (sep.width * (col+0.5))) > window.innerWidth ){
		    row++;
		    col = 0;
		}
	    }
	    winopts = sprintf(winoptsStr,
	      sep.width,
	      sep.height,
	      sep.top  + ((sep.height + sep.topMargin  + sep.topExtra) * row),
              sep.left + ((sep.width  + sep.leftMargin + sep.leftExtra) * col));
	    // move to next column
	    if( sep.layout === "auto" || sep.layout === "horizontal" ){
		col++;
	    } else if( sep.layout === "vertical" ){
		row++;
	    }
	}
	// return info for this  column;
	return {id: toID, html: html, winopts: winopts};
    };
    const separateim = (arr) => {
	let im, xopts, id;
	const n = nsep++;
	if( arr.length > n ){
	    if( typeof arr[n] === "number" ){
		im = JS9.images[arr[n]];
	    } else {
		im = arr[n];
	    }
	    // look for images in this display
	    if( im && im.display === this ){
		// display this image so it's the current one we move
		im.displayImage("all");
		// leave the first one in place
		if( d0 === undefined ){
		    d0 = im.display.id;
		    initopts(d0, opts);
		    separateim(arr);
		} else {
		    // create a new window for this image
		    if( typeof opts.idbase === "string" ){
			id = opts.idbase + myid++;
			d1 = id;
		    } else {
			d1 = `${d0.replace(rexp, "")}_sep${JS9.uniqueID()}`;
		    }
		    saveims[d1] = im;
		    // code to run when new window exists
		    $("#dhtmlwindowholder").arrive(`#${d1}`, {onceOnly: true},
			(el) => {
			    id = $(el).attr("id");
			    // FF (at least) needs this 0ms delay
			    window.setTimeout(() => {
				// move this image
				saveims[id].moveToDisplay(id);
				// process next image
				separateim(arr);
			    }, 0);
			});
		    xopts = getopts(d0, d1);
		    // replace id, if idbase was supplied in opts
		    if( id ){
			xopts.id = id;
		    }
		    // load new window, code above gets run when window exists
		    JS9.LoadWindow(null, {id: xopts.id}, "light",
				   xopts.html, xopts.winopts);
		}
	    } else {
		// this image is in a different display, so process next image
		separateim(arr);
	    }
	} else {
	    // extended plugins
	    if( JS9.globalOpts.extendedPlugins ){
		if( this.image ){
		    this.image.xeqPlugins("image", "onseparatedisplay");
		}
	    }
	}
    };
    // opts are optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse separate opts: ${opts}`, e); }
    }
    // array of images to use
    arr = opts.images || JS9.images;
    //  start separating the images
    separateim(arr);
};

// display the next image from the JS9 images list which is in this display
JS9.Display.prototype.nextImage = function(inc){
    let idx, curidx, im, dpos, npos;
    inc = inc || 1;
    if( !this.image ){
	return;
    }
    dpos = this.image.pos;
    // get index into images array for the displayed image
    for(idx=0; idx<JS9.images.length; idx++){
	if( this.image === JS9.images[idx] ){
	    break;
	}
    }
    // look for next image, wrap if necessary
    for(curidx=idx+inc; curidx!==idx; curidx += inc){
	if( curidx >= JS9.images.length ){
	    curidx = 0;
	}
	if( curidx < 0 ){
	    curidx = JS9.images.length - 1;
	}
	if( JS9.images[curidx].display === this ){
	    break;
	}
    }
    // display if we are not back to where we started
    if( idx !== curidx ){
	// display image, 2D graphics, etc.
	im = JS9.images[curidx];
	im.displayImage("all");
	im.refreshLayers();
	im.display.clearMessage();
	if( dpos ){
	    npos = im.displayToImagePos(dpos);
	    im.valpos = null;
	    im.valpos = im.updateValpos(npos, true);
	}
    }
    // allow chaining
    return this;
};

// load session from a json file
// NB: save is an image method, load is a display method
JS9.Display.prototype.loadSession = function(file, opts){
    let obj, left;
    const objs = {};
    const finish = (im) => {
	let i, dlayer, layer, lname, obj;
	const dorender = () => {
	    // update layer's shape counter
	    const objs = dlayer.canvas.getObjects();
	    if( objs && typeof objs.length !== "undefined" ){
		im.layers[dlayer.layerName].nshape = objs.length + 1;
	    }
	    // update objects for parents and children
	    JS9.Fabric.updateChildren(dlayer, null, "objects");
	    // change shape positions if the displays sizes differ
	    im.refreshLayers();
	};
	obj = objs[im.file] || {};
	// reconstitute blend state
	if( obj.blend ){
	    im.blend = $.extend(true, {}, obj.blend);
	}
	// reconstitute tmp values
	if( obj.tmp ){
	    im.tmp = $.extend(true, {}, obj.tmp);
	}
	// reconstitute wcsim state
	if( obj.wcsim ){
	    im.wcsim = JS9.lookupImage(obj.wcsim);
	}
	// reconstitute layers
	if( obj.layers && obj.layers.length ){
	    for(i=0; i<obj.layers.length; i++){
		layer = obj.layers[i];
		lname = layer.name;
		// are regions disabled?
		if( $.inArray("regions", im.params.disable) >= 0 &&
		    lname === "regions" ){
		    continue;
		}
		// skip crosshair and grid
		if( lname === "crosshair" || lname === "grid" ){
		    continue;
		}
		// make sure layer exists in the display
		dlayer = this.newShapeLayer(lname, layer.dopts);
		// add a layer instance to this image (no objects yet)
		im.addShapes(lname, []);
		// load the session objects into the layer and render
		dlayer.canvas.loadFromJSON(layer.json, dorender);
		// restore catalog and starbase, if necessary
		if( layer.catalog ){
		    im.layers[lname].catalog = layer.catalog;
		}
		if( layer.starbase ){
		    try{im.layers[lname].starbase = JSON.parse(layer.starbase);}
		    catch(ignore){ /* empty */ }
		}
	    }
	}
	// if coordinate grid was active, display it
	if( im.tmp && im.tmp.gridStatus === "active" ){
	    im.displayCoordGrid(true);
	}
	// if all images are loaded, sort them to the original load order
	if( JS9.notNull(left) ){
	    left = left - 1;
	    if( left === 0 ){
		JS9.images.sort( (a, b) => {
		    let ai = 0, bi = 0;
		    if( objs[a.file] ){ ai = objs[a.file].i; }
		    if( objs[b.file] ){ bi = objs[b.file].i; }
		    return ai - bi;
		});
	    }
	}
	// re-execute from the xeq stash
	if( obj.xeqstash ){
	    im.xeqStashCall(obj.xeqstash);
	}
	// plugin callbacks
	if( JS9.globalOpts.extendedPlugins ){
	    im.xeqPlugins("image", "onsessionload");
	}
	// execute onsessionload callback, if necessary
	if( typeof opts.onsessionload === "function" ){
	    try{ JS9.xeqByName(opts.onsessionload, window, im); }
	    catch(e){ JS9.error("in onsessionload callback", e, false); }
	}
    };
    const loadit = (imobj) => {
	let pname;
	// sanity check
	if( !imobj.file ){
	    JS9.error("session does not contain a filename");
	}
	// save copy of object so we can edit it
	obj = $.extend(true, {}, imobj);
	// some param info needs to be deleted
	delete obj.params.display;
	// unset crosshair (we don't save it or load it)
	obj.params.crosshair = false;
	// include an onload callback to load the layers
	obj.params.onload = finish;
	// get pathname of image file
	pname = obj.file;
	// add section info
	if( obj.sect ){
	    obj.params.xcen = obj.sect.xcen;
	    obj.params.ycen = obj.sect.ycen;
	    obj.params.xdim = obj.sect.xdim;
	    obj.params.ydim = obj.sect.ydim;
	    obj.params.zoom = obj.sect.zoom;
	    delete obj.sect;
	}
	// desktop only: are session file paths relative to the session path?
	if( window.isElectron               &&
	    JS9.desktopOpts.sessionPath     &&
	    opts.sessionPath                &&
	    obj.file.charAt(0) !== "/"      &&
	    !obj.file.match(JS9.URLEXP)     ){
	    pname = JS9.fixPath(opts.sessionPath + obj.file);
	}
	// save for finish
	objs[pname] = obj;
	// load the image
	JS9.Load(pname, obj.params, {display: this.id});
    };
    const loadem = (jobj) => {
	let i, key;
	// restore (and remove) globals
	if( jobj.globalOpts ){
	    $.extend(true, JS9.globalOpts, jobj.globalOpts);
	    delete jobj.globalOpts;
	}
	// load colormaps
	if( jobj.cmaps ){
	    for(i=0; i<jobj.cmaps.length; i++){
		JS9.AddColormap(jobj.cmaps[i]);
	    }
	}
	// load images
	if( jobj.images ){
	    left = jobj.images.length;
	    for(i=0; i<jobj.images.length; i++){
		// save the order in which we load images
		jobj.images[i].i = i;
		// load the next image (async load)
		loadit(jobj.images[i]);
	    }
	} else {
	    loadit(jobj);
	}
	// reconstitute display parameters
	if( jobj.display ){
	    for( key in jobj.display ){
		if( jobj.display.hasOwnProperty(key) ){
		    switch(key){
		    case "blendMode":
			JS9.BlendDisplay(jobj.display[key], {display: this});
			break;
		    default:
			this[key] = jobj.display[key];
			break;
		    }
		}
	    }
	}
    };
    // opts is optional
    opts = opts || {};
    // change the cursor to show the waiting status
    JS9.waiting(true, this);
    if( typeof file === "object" ){
	loadem(file);
    } else {
	$.ajax({
	    url: file,
	    cache: false,
	    dataType: "json",
	    mimeType: "application/json",
	    async: false,
	    success: (jobj) => {
		loadem(jobj);
	    },
	    error: (jqXHR, textStatus, errorThrown) => {
		JS9.error(`could not load session: ${file}`, errorThrown);
	    }
	});
    }
    // allow chaining
    return this;
};

// dummy routines to display/clear message, overwritten in info plugin
// eslint-disable-next-line no-unused-vars
JS9.Display.prototype.displayMessage = function(type, message, target){
    return;
};
// eslint-disable-next-line no-unused-vars
JS9.Display.prototype.clearMessage = function(which){
    return;
};

// create a mosaic from a multi-extension FITS file or a number of images
JS9.Display.prototype.createMosaic = function(ims, opts){
    let i, im, bin, carr;
    const im0 = this.image;
    const line1 = '|                                                    fname|';
    const line2 = '|                                                     char|';
    // remove temp files
    const cleanup = () => {
	let i;
	for(i=0; i<carr.length; i++){
	    JS9.vunlink(carr[i]);
	}
    };
    // check for Montage error and cleanup as needed
    const chkerr = (prog, rstr) => {
	let earr;
	// check for Montage error
	if( rstr.search(/\[struct stat="OK"/) < 0 ){
	    // no longer waiting
	    JS9.waiting(false);
	    // first remove temp files
	    cleanup();
	    // signal this we completed the reproject attempt
	    earr = rstr.match(/msg="(.*)"/);
	    if( earr && earr[1] ){
		JS9.error(`${earr[1]} (from ${prog})`);
	    } else {
		JS9.error(rstr || `unknown ${prog} failure`);
	    }
	}
    };
    // display mosaic as a new image
    const disp = (hdu, opts) => {
	let topts, nim;
	opts = opts || {};
	topts = $.extend(true, {}, opts);
	// start the waiting!
	if( opts.waiting !== false ){
	    JS9.waiting(true, this);
	}
	// make sure we use the current display
	topts.display = this.id;
	// set up new and display new image
	nim = new JS9.Image(hdu, topts);
	// set status of both old and new image
	im0.setStatus("createMosaic", "complete");
	nim.setStatus("createMosaic", "complete");
	// done waiting
	JS9.waiting(false);
    };
    // write comforting messages to the console while we wait and wait
    const log = (...args) => {
	let s;
	if( opts.verbose || JS9.DEBUG > 1 ){
	    s = sprintf(...args);
	    // eslint-disable-next-line no-console
	    JS9.log(s);
	}
    };
    // opts is optional
    opts = opts || {};
    // reduce can be taken from the global value
    opts.reduce = opts.reduce || JS9.globalOpts.reduceMosaic;
    // same for reduction dims
    opts.dim = opts.dim ||
	Math.max(JS9.globalOpts.image.xdim, JS9.globalOpts.image.ydim);
    // ims can be: array of ims or a single im or null (use displayed image)
    // each im can itself be an im object or the image string id
    if( !ims ){
	// use currently display image, if possible
	if( this.image ){
	    ims = [this.image];
	} else {
	    ims = [];
	}
    } else if( typeof ims === "string" ){
	if( ims === "current" ){
	    // use the currently loaded image
	    if( this.image ){
		ims = [this.image];
	    } else {
		ims = [];
	    }
	} else if( ims === "all" ){
	    // use all images in this display
	    ims = [];
	    for(i=0; i<JS9.images.length; i++){
		if( JS9.images[i].display.id === this.id ){
		    ims.push(JS9.images[i]);
		}
	    }
	} else {
	    // hopefully, it's the id of an image
	    ims = [ims];
	}
    } else if( !$.isArray(ims) ){
	JS9.error("unknown input type for createMosaic()");
    }
    // sanity check
    if( !ims.length ){
	JS9.error("no images specified for createMosaic()");
    }
    // convert all string id ims to im objects
    for(i=0; i<ims.length; i++){
	if( typeof ims[i] === "string" ){
	    im = JS9.lookupImage(ims[i]);
	    if( im ){
		ims[i] = im;
	    } else {
		JS9.error(`unknown image for mosaic: ${ims[i]}`);
	    }
	}
	im = ims[i];
	// sanity check: they all require a virtual file
	if( !im.raw.hdu || !im.raw.hdu.fits || !im.raw.hdu.fits.vfile ){
	    JS9.error(`no virtual file available for mosaic: ${im.id}`);
	}
    }
    // could take a while ...
    JS9.waiting(true, this);
    // set status
    im0.setStatus("createMosaic", "processing");
    window.setTimeout(() => {
	let s, t, v, sw, naxis, rstr, inbuf, ext;
	let vfile, ivfile, ovfile, bvfile, sect, topts;
	let inlst, intbl, inhdr, inarr, binlst, bintbl;
	let outlst, outtbl, outhdr, areafile, outfile;
	const id = JS9.uniqueID();
	const imsw = "-C"; // skip naxis[3,4]: they write garbage into the table
	const mktmp = (suffix) => {
	    return `mosaic_${id}_${suffix}`;
	};
	// temps files get unique names
	inlst = mktmp("in.lst");
	intbl = mktmp("in.tbl");
	inhdr = mktmp("in.hdr");
	binlst = mktmp("bin.lst");
	bintbl = mktmp("bin.tbl");
	outlst = mktmp("out.lst");
	outtbl = mktmp("out.tbl");
	outhdr = mktmp("out.hdr");
	// output file name comes from the first image name
	outfile = ims[0].id
	    .replace(/\[.*\]/, "")
	    .replace(/\.fz$/i, "")
	    .replace(/\.gz$/i, "")
	    .replace(/\.fits$/i, "_mosaic.fits");
	// Montage temp areafile comes from the output file name
	areafile = outfile.replace(/\.fits$/, "_area.fits");
	// init cleanup array to make sure temp files get deleted
	carr = [inlst, intbl, inhdr, binlst, bintbl,
		outlst, outtbl, outhdr, areafile];
	// generate input list from array of ims
	s = `${line1}\n${line2}\n`;
	for(i=0; i<ims.length; i++){
	    s += `${ims[i].raw.hdu.fits.vfile}\n`;
	}
	// save in list file
	JS9.vfile(inlst, s);
	// call the Mosaic/mImgtbl routine to make meta table
	rstr = JS9.imgtbl(inlst, ".", intbl, imsw);
	// check for errors
	chkerr("mImgtbl", rstr);
	// make sure input table actually has FITS files
	if( !JS9.vsize(intbl) ){
	    JS9.error("no image data found with which to construct a mosaic");
	}
	// make initial input header from input images
	rstr = JS9.makehdr(intbl, inhdr, "");
	// check for errors
	chkerr("mMakeHdr", rstr);
	// if we are using the js9helper, calculate a bin factor
	if( opts.reduce === "js9" ){
	    // calculate bin factor:
	    // get input header as an array of cr-delimited lines
	    s = JS9.vread(inhdr). split("\n");
	    naxis = 0;
	    // looks for dimensions of the image in this header
	    for(i=0; i<s.length; i++){
		t = s[i].split("=");
		switch(t[0].trim()){
		    case "NAXIS1":
		    naxis = Math.max(naxis, parseFloat(t[1].trim()));
		    break;
		    case "NAXIS2":
		    naxis = Math.max(naxis, parseFloat(t[1].trim()));
		    break;
		}
	    }
	    // bin based on image dims and desired mosaic dim
	    bin = Math.max(1, Math.floor((naxis / opts.dim) + 0.5));
	    // generate binned files, which become the input for reprojection
	    s = `${line1}\n${line2}\n`;
	    // get array of input images
	    inbuf = JS9.vread(intbl);
	    // ignore the first 3 header lines
	    inarr = inbuf.trim().split("\n");
	    inarr.splice(0,3);
	    // bin each image
	    for(i=0; i<inarr.length; i++){
		t = inarr[i].trim().split(/\s+/);
		ext  = t[t.length-2];
		vfile = t[t.length-1];
		if( ext && vfile ){
		    // section input file + extension
		    ivfile = `${vfile}[${ext}]`;
		    v = vfile.split("/").reverse()[0].replace(/\.(g|f)z$/, "");
		    // binned file name
		    bvfile = `bin_${ext}_${v}`;
		    // make sure binned file eventually gets deleted
		    carr.push(bvfile);
		    // section specification consists of bin factor
		    sect = `0@0,0@0,${bin}`;
		    log("bin %s [%s]", ivfile, bin);
		    // extract a section at the specified bin factor
		    JS9.imsection(ivfile, bvfile, sect, "");
		    // add file to new input list
		    s += `${bvfile}\n`;
		}
	    }
	    // save in new image list file
	    JS9.vfile(binlst, s);
	    // call the Mosaic/mImgtbl routine
	    rstr = JS9.imgtbl(binlst, ".", bintbl, imsw);
	    // check for errors
	    chkerr("mImgtbl", rstr);
	    // make sure input table actually has FITS files
	    if( !JS9.vsize(bintbl) ){
		JS9.error("no image data found to construct a mosaic");
	    }
	    // make output header from binned images
	    rstr = JS9.makehdr(bintbl, outhdr, "");
	    // check for errors
	    chkerr("mMakeHdr", rstr);
	    // array of input images
	    inbuf = JS9.vread(bintbl);
	} else {
	    // shrink inhdr to make outhdr
	    rstr = JS9.shrinkhdr(opts.dim, inhdr, outhdr);
	    // check for errors
	    chkerr("mShrinkHdr", rstr);
	    // array of input images
	    inbuf = JS9.vread(intbl);
	}
	// ignore the first 3 header lines
	inarr = inbuf.trim().split("\n");
	inarr.splice(0,3);
	// reproject and generate output list from reprojected files
	s = `${line1}\n${line2}\n`;
	for(i=0; i<inarr.length; i++){
	    t = inarr[i].trim().split(/\s+/);
	    ext  = t[t.length-2];
	    vfile = t[t.length-1];
	    if( ext && vfile ){
		// we need the area file
		sw = "-a 1";
		if( opts.reduce === "shrink" ){
		    // pass extension number in switches
		    sw += ` -h ${ext}`;
		}
		// add global switches for reproject processing
		sw += ` ${JS9.globalOpts.reprojSwitches}`;
		// output filename
		v = vfile.split("/").reverse()[0].replace(/\.(g|f)z$/, "");
		ovfile = `reproj_${ext}_${v}`;
		// add to the output file list
		s += `${ovfile}\n`;
		// make sure it eventually gets deleted
		carr.push(ovfile);
		// make sure associated area file eventually gets deleted
		carr.push(ovfile.replace(/\.fits$/i, "_area.fits"));
		// call Montage/reproject
		log("reproject: %s [%s] -> %s", vfile, ext, ovfile);
		rstr = JS9.reproject(vfile, ovfile, outhdr, sw);
		// check for errors
		chkerr("mProjectPP", rstr);
	    }
	}
	// save output list in file
	JS9.vfile(outlst, s);
	// call the Mosaic/mImgtbl routine
	rstr = JS9.imgtbl(outlst, ".", outtbl, "");
	// check for errors
	chkerr("mImgtbl", rstr);
	// make sure input table has FITS files
	if( !JS9.vsize(outtbl) ){
	    JS9.error("no FITS files were added to output table for mosaic");
	}
	// make the mosaic
	log("create mosaic: %s", outfile);
	rstr = JS9.madd(outtbl, outhdr, outfile, "");
	// check for errors
	chkerr("mAdd", rstr);
	// cleanup temp files
	cleanup();
	// construct options
	topts = $.extend(true, {}, JS9.fits.options, opts);
	// we want the full image
	topts.image = {xdim: 0, ydim: 0};
	topts.file = outfile;
	// process the newly retrieved data as FITS
	JS9.fits.handleFITSFile(outfile, topts, disp);
    }, JS9.SPINOUT);
    // allow chaining
    return this;
};

// ---------------------------------------------------------------------
// JS9 Command, commands for console window
// ---------------------------------------------------------------------

JS9.Command = function(obj){
    let p;
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
    let which;
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
// JS9 helper to manage connection to back-end services
// ---------------------------------------------------------------------

JS9.Helper = function(){
    // reset protocol for file:
    if( JS9.globalOpts.helperProtocol === "file:" ){
	JS9.globalOpts.helperProtocol = "http:";
    }
    // reset helper timeout for local access
    if( !document.domain || document.domain === "localhost" ){
	JS9.globalOpts.htimeout = JS9.globalOpts.lhtimeout;
    }
    // add suffix
    JS9.globalOpts.helperProtocol += "//";
    // assume the worst
    this.connected = false;
    this.helper = false;
    // set up initial type of helper connection
    if( JS9.allinone && !JS9.globalOpts.allinoneHelper ){
	this.type = "none";
    } else {
	this.type = JS9.globalOpts.helperType || "sock.io";
    }
    // no page id yet
    this.pageid = null;
    // make the connection
    this.connect();
};

// get back-end helper connection info
JS9.Helper.prototype.connectinfo = function(){
    let s;
    // no connection configured
    if( JS9.helper.connected === null ){
	return "notConfigured";
    }
    // connection configured and established
    if( JS9.helper.connected ){
	s = `connected ${JS9.helper.type} ${JS9.helper.url}`;
	if( JS9.helper.pageid ){
	    s += `<p>${JS9.helper.pageid}`;
	}
	return s;
    }
    // connection configured but not established
    return `notConnected ${JS9.helper.type}`;
};

// connect to back-end helper
JS9.Helper.prototype.connect = function(type){
    const tries = JS9.globalOpts.ehretries;
    const delay = JS9.globalOpts.ehtimeout;
    const failedHelper = (jqXHR, textStatus, errorThrown) => {
	this.connected = false;
	this.helper = false;
	this.ready = true;
	$(document).trigger("JS9:helperReady",
			    {type: "socket.io", status: "error"});
	textStatus = textStatus || "timeout";
	if( !errorThrown || errorThrown === "timeout" ){
	    errorThrown = "or connection refused";
	}
	if( errorThrown === textStatus  ){
	    textStatus = "";
	}
	if( errorThrown === "error" ){
	    errorThrown = "is the helper running?";
	}
	// throw error if needed
	if( JS9.globalOpts.requireHelper ){
	    JS9.error(`helper connect error: ${textStatus} (${errorThrown})`);
	} else if( JS9.DEBUG ){
	    JS9.log(`JS9 helper connect error: ${textStatus} (${errorThrown})`);
	}
    };
    const connectHelper = (url) => {
	// connect to helper
	$.ajax({
	    url: url,
	    dataType: "script",
	    timeout: JS9.globalOpts.htimeout,
	    success: () => {
		const sockopts = {
		    reconnection: true,
		    reconnectionDelay: 1000,
		    reconnectionDelayMax : 10000,
		    reconnectionAttempts: 100,
		    timeout: JS9.globalOpts.htimeout
		};
		// if there is no io object, we didn't really succeed
		// can happen, for example, in the Jupyter environment
		if( typeof io === "undefined" ){
		    failedHelper(null, "socket io object is undefined", null);
		    return;
		}
		// connect to the helper
		this.socket = io.connect(this.url, sockopts);
		// on-event processing
		this.socket.on("connect", () => {
		    let ii, d, p;
		    this.connected = true;
		    this.helper = true;
		    d = [];
		    for(ii=0; ii<JS9.displays.length; ii++){
			d.push(JS9.displays[ii].id);
		    }
		    p = this.pageid;
		    this.socket.emit("initialize", {displays: d, pageid: p},
                    (obj) => {
			this.pageid = obj.pageid;
			this.js9helper = obj.js9helper;
			JS9.globalOpts.dataPathModify = obj.dataPathModify;
			this.ready = true;
			$(document).trigger("JS9:helperReady",
					    {type: "socket.io", status: "OK"});
			if( JS9.DEBUG ){
			    JS9.log(`JS9 helper: connect: ${this.type}`);
			}
		    });
		    $(document).trigger("JS9:connected",
					{type: "socket.io", status: "OK"});
		});
		this.socket.on("connect_error", () => {
		    this.connected = false;
		    this.helper = false;
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: connect error");
		    }
		});
		this.socket.on("connect_timeout", () => {
		    this.connected = false;
		    this.helper = false;
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: connect timeout");
		    }
		});
		this.socket.on("disconnect", (reason) => {
		    this.connected = false;
		    this.helper = false;
		    if( JS9.DEBUG > 1 ){
			JS9.log(`JS9 helper: disconnect: ${reason}`);
		    }
		    // https://github.com/socketio/socket.io-client/blob/master/docs/API.md#event-disconnect
		    if( reason === 'io server disconnect' ){
			// the disconnection was initiated by the server,
			// you need to reconnect manually
			if( JS9.DEBUG > 1 ){
			    JS9.log("JS9 helper: manual reconnect");
			}
			this.socket.connect();
		    }
		    // else the socket will automatically try to reconnect
		});
		this.socket.on("reconnect", () => {
		    this.connected = true;
		    this.helper = true;
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: reconnect");
		    }
		});
		this.socket.on("msg", JS9.msgHandler);
	    },
	    error: (jqXHR, textStatus, errorThrown) => {
		failedHelper(jqXHR, textStatus, errorThrown);
	    }
	});
    };
    // make an "alive" request of the helper (jsonp to avoid CORS rejection)
    const waitForHelper = (eurl, hurl, tries) => {
	$.ajax({
	    url: eurl,
	    dataType: "jsonp",
	    success: () => {
		connectHelper(hurl);
	    },
	    error: () => {
		if( --tries > 0 ){
		    window.setTimeout(() => {
			waitForHelper(eurl, hurl, tries);
		    }, delay);
		} else {
		    failedHelper();
		}
	    }
	});
    };
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
	if( location.origin ){
	    this.url = location.origin;
	} else {
	    this.url = JS9.globalOpts.helperProtocol + document.domain;
	}
    } else {
	this.url = `${JS9.globalOpts.helperProtocol}localhost`;
    }
    // save base of url
    this.baseurl = this.url;
    // try to establish connection, based on connection type
    switch(this.type){
    case "none":
        this.connected = null;
	this.ready = true;
        // signal JS9 helper is ready
        $(document).trigger("JS9:helperReady", {type: "none", status: "OK"});
        break;
    case "get":
    case "post":
	// sanity check
	if( !JS9.globalOpts.helperCGI ){
	    JS9.error("cgi script name missing for helper");
	}
	this.url += `/${JS9.globalOpts.helperCGI}`;
	this.connected = true;
	this.helper = true;
        if( JS9.DEBUG ){
	    JS9.log(`JS9 helper: connect: ${this.type}`);
        }
	this.ready = true;
        $(document).trigger("JS9:helperReady", {type: "get", status: "OK"});
	break;
    case "sock.io":
    case "nodejs":
	if( !JS9.globalOpts.helperPort ){
	    JS9.error("port missing for helper");
	}
	// ignore port on url, add our own
	this.url = `${this.url.replace(/:[0-9][0-9]*$/, "")}:${JS9.globalOpts.helperPort}`;
	// the url of the socket.io.js file
	if( window.multiElectron ){
	    // the slim version avoids the 4-second delay compiling the code
	    // see help/knownissues.html
	    this.sockurl  = `${this.url}/socket.io/socket.io.slim.js`;
	} else {
	    // use the canonical version
	    this.sockurl  = `${this.url}/socket.io/socket.io.js`;
	}
	// make sure helper is running and then connect
	if( window.isElectron ){
	    this.aliveurl = `${this.url}/alive`;
	    waitForHelper(this.aliveurl, this.sockurl, tries);
	} else {
	    connectHelper(this.sockurl);
	}
	break;
    default:
	JS9.error(`unknown helper type: ${this.type}`);
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
	// wrap this in a try to catch CORS errors
        try{ obj.cookie = document.cookie; }
	catch(e){ delete obj.cookie; }
	if( JS9.globalOpts.dataPath && !obj.dataPath ){
	    obj.dataPath = `${JS9.globalOpts.dataPath}:.`;
	}
    } else {
	obj = {dataPath: "."};
    }
    // add path which gets us to the js9 root
    if( JS9.TOROOT ){
	obj.dataPath += `:${JS9.TOROOT}`;
    }
    // tell server how to get to root (for datapath)
    // send message, based on connection type
    switch(this.type){
    case "get":
    case "post":
	obj.key = key;
	if( JS9.helper.pageid ){
	    obj.pageid = JS9.helper.pageid;
	}
        if( JS9.DEBUG ){
	    JS9.log("JS9 cgi helper [%s, %s]: %s",
		    this.type, JSON.stringify(obj), this.url);
        }
	$.ajax({
	    url: this.url,
	    type: this.type.toUpperCase(),
	    data: obj,
	    dataType: "text",
	    success: (data) => {
		if( typeof data === "string" &&
		    data.search(JS9.analOpts.epattern) >=0 ){
		    JS9.log(data);
		}
		if( cb ){
		    cb(data);
		}
	    },
	    error: (jqXHR, textStatus, errorThrown) => {
		if( JS9.DEBUG ){
	            JS9.log(`JS9 helper: ${this.type} failure: ${textStatus} ${errorThrown}`);
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
// JS9 web worker support to off-load CPU intensive tasks
// ---------------------------------------------------------------------

// create new web worker
JS9.WebWorker = function(url){
    this.worker = new Worker(url);
    this.worker.onmessage = JS9.WebWorker.prototype.msgHandler.bind(this);
    this.handlers = [];
};

// handle (known) messages from web worker
JS9.WebWorker.prototype.msgHandler = function(msg){
    let i, handler;
    const obj = msg.data;
    switch(obj.cmd){
    case "progress":
	JS9.progress(obj.result.value, obj.result.max);
	break;
    case "initsocketio":
	this.sockinit = true;
	for(i=0; i<this.handlers.length; i++){
	    handler = this.handlers[i];
	    if( handler.id === obj.id ){
		handler.func(obj.result);
		this.handlers.splice(i, 1);
		break;
	    }
	}
	break;
    case "uploadFITS":
	for(i=0; i<this.handlers.length; i++){
	    handler = this.handlers[i];
	    if( handler.id === obj.id ){
		handler.func(obj.result);
		this.handlers.splice(i, 1);
		break;
	    }
	}
	break;
    case "connect_error":
    case "connect_timeout":
	if( JS9.DEBUG > 1 ){
	    JS9.log(`JS9 worker socketio: ${obj.cmd}`);
	}
	break;
    case "disconnect":
	JS9.waiting(false);
	if( obj.result ){
	    JS9.worker.postMessage("initsocketio",
				   [JS9.helper.url, JS9.helper.pageid],
				   () => { JS9.error(obj.result); });
	} else {
	    if( JS9.DEBUG > 1 ){
		JS9.log("JS9 worker socketio: disconnect");
	    }
	}
	break;
    case "error":
	JS9.error(obj.result||"in web worker");
	break;
    default:
	break;
    }
};

// send a message to a web worker
JS9.WebWorker.prototype.postMessage = function(cmd, args, func, xfer){
    const id = cmd + JS9.uniqueID();
    const obj = {id, cmd, args};
    // push context
    if( func ){
	args = args || [];
	this.handlers.push({id, cmd, args, func});
    }
    // send message, possible with transferred data
    if( xfer ){
	this.worker.postMessage(obj, xfer);
    } else {
	this.worker.postMessage(obj);
    }
};

// initialize worker socketio connection, then call handler
JS9.WebWorker.prototype.socketio = function(handler){
    const h = JS9.helper;
    if( !JS9.worker.sockinit ){
	JS9.worker.postMessage("initsocketio", [h.url, h.pageid], (s) => {
	    if( s === "OK" ){
		if( handler ){
		    handler();
		}
	    } else {
		JS9.error(`can't init  socket.io for JS9 worker: ${s}`);
	    }
	});
    } else {
	if( handler ){
	    handler();
	}
    }
};

// terminate a web worker
JS9.WebWorker.prototype.terminate = function(){
    this.worker.terminate();
};

// ---------------------------------------------------------------------
// Graphics support using fabric.js
//
// Fabric object defines graphical primitives
// ---------------------------------------------------------------------

// quick way to separate fabric versions
fabric.major_version = parseFloat(fabric.version.split(".")[0]);
fabric.minor_version = parseFloat(fabric.version.split(".")[1]);

// fabric sub-object to hold fabric routines
JS9.Fabric = {};

// extra fabric elements to save when switching between images

JS9.Fabric.elements = ["cornerSize", "cornerColor", "cornerStyle",
		       "borderColor",
		       "transparentCorners", "selectionLineWidth",
		       "centeredScaling", "hasControls", "hasRotatingPoint",
		       "lockMovementX", "lockMovementY", "lockRotation",
		       "lockScalingX", "lockScalingY", "lockUniScaling",
		       "selectable", "hasBorders", "params", "pub"];

// global options for all shapes
JS9.Fabric.opts = {
    // default fabric.js options
    originX: "center",
    originY: "center",
    strokeWidth: 2,
    selectionLineWidth: 2,
    borderColor: "#00EEFF",
    cornerColor: "#00EEFF",
    cornerSize: fabric.isTouchSupported ? 10 : 6,
    cornerStyle: "circle",
    hasControls: true,
    hasRotatingPoint: true,
    hasBorders: true,
    transparentCorners: false,
    centeredScaling: true,
    selectable: true,
    // minimizes the jump when first changing the region size
    padding: 0,
    canvas: {
	selection: true
    },
    fill: "transparent",
    objectCaching: false
};

// rescale the width of shapes in the shape layers
JS9.Fabric.rescaleStrokeWidth = function(scale, sw1){
    const tscale = ((this.scaleX + this.scaleY) / 2);
    scale = scale || 1;
    scale *= tscale;
    if( !sw1 && this.params ){
	sw1 = this.params.sw1;
    }
    if( !sw1 ){
	return;
    }
    if( this.type === "group" ){
	this.forEachObject( (obj) => {
	    JS9.Fabric.rescaleStrokeWidth.call(obj, scale, sw1);
	});
    } else {
	this.set("strokeWidth", sw1 / scale);
    }
};

// ensure the circle scales the same in X and Y
JS9.Fabric.rescaleEvenly = function(){
    let lastscale;
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
    let id, dlayer;
    const display = this;
    const seloff = (dlayer, obj) => {
	// reset currently selected
	dlayer.params.sel = null;
	// also reset current layer in the image
	if( dlayer.display.image ){
	    dlayer.display.image.layer = null;
	}
	// selection cleared processing
	// remove anchors from previously selected polygon
	if( obj ){
	    switch(obj.type){
	    case "polyline":
	    case "polygon":
		JS9.Fabric.removePolygonAnchors(dlayer, obj);
		dlayer.canvas.renderAll();
		break;
	    }
	}
	// plugin callbacks
	if( obj && dlayer.display.image ){
	    dlayer.display.image.updateShapes(layerName, obj, "unselect");
	}
    };
    const selmultioff = (dlayer, activeObject, s) => {
	let i, obj;
	const activeObjects = dlayer.canvas.getActiveObjects(s);
	for(i=0; i<activeObjects.length; i++){
	    obj = activeObjects[i];
	    seloff(dlayer, obj);
	}
    };
    const selon = (dlayer, obj) => {
	// turn off previous selection, if necessary
	if( dlayer.params.sel && obj.params && (dlayer.params.sel !== obj) ){
	    seloff(dlayer, dlayer.params.sel);
	}
	// new selection processing
	if( obj ){
	    // add anchors to selected polygon
	    switch(obj.type){
	    case "polyline":
	    case "polygon":
		JS9.Fabric.addPolygonAnchors(dlayer, obj);
		dlayer.canvas.renderAll();
		break;
	    }
	    // set currently selected shape
	    if( obj.polyparams ){
		dlayer.params.sel = obj.polyparams.polygon;
	    } else if( obj.params ){
		dlayer.params.sel = obj;
	    }
	}
	// and currently selected layer
	if( dlayer.display.image ){
	    dlayer.display.image.layer = layerName;
	}
	// plugin callbacks
	if( obj && dlayer.display.image ){
	    dlayer.display.image.updateShapes(layerName, obj, "select");
	}
    };
    const selmultion = (dlayer, activeObject, s) => {
	let i, j, obj, parent, child;
	const activeObjects = dlayer.canvas.getActiveObjects(s);
	for(i=0; i<activeObjects.length; i++){
	    obj = activeObjects[i];
	    if( !obj.params ){ continue; }
	    // add parent, if not already added
	    if( obj.params.parent && obj.params.parent.obj ){
		parent = obj.params.parent.obj;
		if( $.inArray(parent, activeObjects) < 0 ){
		    activeObject.addWithUpdate(parent);
		}
	    }
	    // add children, if not already added
	    if( obj.params.children ){
		for(j=0; j<obj.params.children.length; j++){
		    child = obj.params.children[j].obj;
		    if( $.inArray(child, activeObjects) < 0 ){
			activeObject.addWithUpdate(child);
		    }
		}
	    }
	    switch(obj.type){
	    case "polyline":
	    case "polygon":
		JS9.Fabric.removePolygonAnchors(dlayer, obj);
		break;
	    }
	    // plugin callbacks
	    if( obj && dlayer.display.image ){
		dlayer.display.image.updateShapes(layerName, obj, "select");
	    }
	}
	dlayer.canvas.renderAll();
    };
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
    // backlink to name
    dlayer.layerName = layerName;
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
    id = `${divjq.attr("id")}-${layerName.replace(/\s+/,"_")}-shapeLayer`;
    // backlink
    dlayer.display = display;
    // default options for this layer (deep copy)
    dlayer.opts = $.extend(true, {}, layerOpts);
    // and some needed properties
    dlayer.opts.canvas = dlayer.opts.canvas || {};
    if( dlayer.opts.canvas.selection === undefined ){
	dlayer.opts.canvas.selection = true;
    }
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
    // preserve stacking (required in v1.6.6 to interact with polygon points)
    dlayer.canvas.preserveObjectStacking = true;
    // movable: short-hand for allowing objects to move (not resize)
    if( dlayer.opts.movable ){
	dlayer.opts.lockMovementX = false;
	dlayer.opts.lockMovementY = false;
	dlayer.opts.selectable = true;
	dlayer.opts.evented = true;
    } else if( dlayer.opts.movable === false ){
	dlayer.opts.lockMovementX = true;
	dlayer.opts.lockMovementY = true;
	dlayer.opts.selectable = false;
	dlayer.opts.evented = false;
    }
    // changeable: short-hand for allowing objects to move and resize
    // fixinplace: the opposite, for backward compatibility
    if( (dlayer.opts.changeable === undefined) &&
	(dlayer.opts.fixinplace !== undefined)  ){
	dlayer.opts.changeable = !dlayer.opts.fixinplace;
    }
    if( dlayer.opts.changeable ){
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
    } else if( dlayer.opts.changeable === false ){
	dlayer.opts.hasControls = false;
	dlayer.opts.hasRotatingPoint = false;
	dlayer.opts.hasBorders = false;
	dlayer.opts.lockMovementX = true;
	dlayer.opts.lockMovementY = true;
	dlayer.opts.lockRotation = true;
	dlayer.opts.lockScalingX = true;
	dlayer.opts.lockScalingY = true;
	dlayer.opts.lockUniScaling = true;
	dlayer.opts.selectable = false;
	dlayer.opts.evented = false;
	dlayer.opts.usekeyboard = false;
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
	    dlayer.canvas.on("mouse:down", (opts) => {
		if( dlayer.display.image && opts.target ){
		    // on main window, set region click
		    if( dlayer.dtype === "main" ){
			dlayer.display.image.clickInRegion = true;
			dlayer.display.image.clickInLayer = layerName;
		    }
		    dlayer.opts.onmousedown.call(dlayer.canvas,
						 dlayer.display.image,
						 opts.target.pub,
						 opts.e, opts.target);
		} else {
		    // only allow fabric selection if we have special key down
		    dlayer.canvas._selection = dlayer.canvas.selection;
		    if( dlayer.canvas.selection ){
			dlayer.canvas.selection = JS9.specialKey(opts.e);
		    }
		}
	    });
	} else {
	    dlayer.canvas.on("mouse:down", (opts) => {
		// only allow fabric selection if we have special key down
		dlayer.canvas._selection = dlayer.canvas.selection;
		if( dlayer.canvas.selection ){
		    dlayer.canvas.selection = JS9.specialKey(opts.e);
		}
	    });
	}
	if( dlayer.opts.onmouseup ){
	    dlayer.canvas.on("mouse:up", (opts) => {
		if( dlayer.display.image && opts.target ){
		    dlayer.opts.onmouseup.call(dlayer.canvas,
					       dlayer.display.image,
					       opts.target.pub,
					       opts.e, opts.target);
		}
		// restore original selection state
		dlayer.canvas.selection = dlayer.canvas._selection ||
		                          dlayer.canvas.selection;
	    });
	} else {
	    dlayer.canvas.on("mouse:up", () => {
		// restore original selection state
		dlayer.canvas.selection = dlayer.canvas._selection ||
                                          dlayer.canvas.selection;
	    });
	}
	if( dlayer.opts.onmousemove ){
	    dlayer.canvas.on("mouse:move", (opts) => {
		if( dlayer.display.image && opts.target ){
		    dlayer.opts.onmousemove.call(dlayer.canvas,
						 dlayer.display.image,
						 opts.target.pub,
						 opts.e, opts.target);
		}
	    });
	}
	if( dlayer.opts.onmouseover ){
	    dlayer.canvas.on("mouse:over", (opts) => {
		if( dlayer.display.image && opts.target ){
		    dlayer.opts.onmouseover.call(dlayer.canvas,
						 dlayer.display.image,
						 opts.target.pub,
						 opts.e, opts.target);
		}
	    });
	}
	if( dlayer.opts.onmouseout ){
	    dlayer.canvas.on("mouse:out", (opts) => {
		if( dlayer.display.image && opts.target ){
		    dlayer.opts.onmouseout.call(dlayer.canvas,
						dlayer.display.image,
						opts.target.pub,
						opts.e, opts.target);
		}
	    });
	}
	if( dlayer.opts.tooltip ){
	    dlayer.canvas.on("mouse:over", (opts) => {
		if( dlayer.display.image && opts.target ){
		    JS9.tooltip(opts.target.left+opts.target.width+2,
				opts.target.top+opts.target.height+2,
				dlayer.opts.tooltip,
				dlayer.display.image,
				opts.target.pub,
				opts.e, opts.target);
		}
	    });
	    dlayer.canvas.on("mouse:out", (opts) => {
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
	dlayer.canvas.on("mouse:down", (opts) => {
	    // only allow fabric selection if we have special key down
	    dlayer.canvas._selection = dlayer.canvas.selection;
	    if( dlayer.canvas.selection ){
		dlayer.canvas.selection = JS9.specialKey(opts.e);
	    }
	});
	dlayer.canvas.on("mouse:up", () => {
	    // restore original selection state
	    dlayer.canvas.selection = dlayer.canvas._selection ||
                                      dlayer.canvas.selection;
	});
    }
    // fire events when groups are created
    if( typeof dlayer.opts.ongroupcreate === "function" ){
	dlayer.opts.canvas.selection = true;
	dlayer.opts.selectable = true;
	dlayer.canvas.on("selection:created", (opts) => {
	    const pubs = [];
	    const targets = [];
	    if( dlayer.display.image ){
		if( opts.target && opts.target.type === "group" ){
		    opts.target.forEachObject(function(shape){
			if( shape.pub ){
			    targets.push(shape);
			    pubs.push(shape.pub);
			}
		    });
		    dlayer.opts.ongroupcreate.call(dlayer.canvas,
						   dlayer.display.image,
						   pubs,
						   opts.e, targets);
		}
	    }
	});
    }
    // object modified
    dlayer.canvas.on('object:modified', (opts) => {
	let o, i, olen, myWidth, myHeight;
	const objs = [];
	// sanity check
	if( !opts.target ){ return; }
	o = opts.target;
	// update deltas to connected parents
	JS9.Fabric.updateChildren(dlayer, o, "deltas");
	// might have to sort overlapping shapes by size
	if( dlayer.opts.sortOverlapping ){
	    o.setCoords();
	    // find objects which intersect with this one
	    dlayer.canvas.forEachObject( (obj) => {
		if( obj === o ){
		    return;
		}
		if( o.intersectsWithObject(obj) ){
		    if( fabric.major_version === 1 ){
			myWidth = obj.getWidth();
			myHeight = obj.getHeight();
		    } else {
			myWidth = obj.getScaledWidth();
			myHeight = obj.getScaledHeight();
		    }
		    objs.push({obj: obj, siz: myWidth * myHeight});
		}
	    });
	    // any intersecting shapes?
	    if( !objs.length ){
		return;
	    }
	    if( fabric.major_version === 1 ){
		myWidth = o.getWidth();
		myHeight = o.getHeight();
	    } else {
		myWidth = o.getScaledWidth();
		myHeight = o.getScaledHeight();
	    }
	    // add current shape to array
	    objs.push({obj: o, siz: myWidth * myHeight});
	    // sort in order of increasing size
	    objs.sort( (a, b) => {
		if( a.siz < b.siz ){
		    return -1;
		} else if( a.siz > b.siz ){
		    return 1;
		}
		return 0;
	    });
	    // re-order so smaller objects are in front
	    olen = objs.length;
	    for(i=0; i<olen; i++){
		try{ objs[i].obj.sendToBack(); }
		catch(e){ /* empty */ }
	    }
	}
    });
    // object scaled: reset stroke width
    dlayer.canvas.on('object:scaling', (opts) => {
	let o;
	// sanity check
	if( !opts.target ){ return; }
	o = opts.target;
	o.rescaleEvenly();
	o.rescaleBorder();
	JS9.Fabric.updateChildren(dlayer, o, "scaling");
    });
    dlayer.canvas.on('object:moving', (opts) => {
	let o;
	// sanity check
	if( !opts.target ){ return; }
	o = opts.target;
	JS9.Fabric.updateChildren(dlayer, o, "moving");
    });
    dlayer.canvas.on('object:rotating', (opts) => {
	let o;
	// sanity check
	if( !opts.target ){ return; }
	o = opts.target;
	JS9.Fabric.updateChildren(dlayer, o, "rotating");
    });
    if( fabric.major_version === 1 ){
	// object selected: add anchors to polygon
	dlayer.canvas.on("object:selected", (opts) => {
	    // sanity check
	    if( !opts.target ){ return; }
	    selon(dlayer, opts.target);
	});
	// selection cleared
	dlayer.canvas.on('before:selection:cleared', (opts) => {
	    // sanity check
	    if( !opts.target ){ return; }
	    seloff(dlayer, opts.target);
	});
    } else {
	// selection created: add anchors to polygon
	dlayer.canvas.on("selection:created", (opts) => {
	    // sanity check
	    if( !opts.target ){	return; }
	    selon(dlayer, opts.target);
	});
	// selection updated (adding a region to the current selection):
	// add anchors to polygon
	dlayer.canvas.on("selection:updated", (opts) => {
	    const activeObject = dlayer.canvas.getActiveObject();
	    if( activeObject.type === 'activeSelection' ){
		selmultion(dlayer, activeObject, opts);
	    } else {
		selon(dlayer, activeObject);
	    }
	});
	// selection cleared
	dlayer.canvas.on('before:selection:cleared', (opts) => {
	    const activeObject = dlayer.canvas.getActiveObject();
	    if( activeObject.type === 'activeSelection' ){
		selmultioff(dlayer, activeObject, opts);
	    } else {
		seloff(dlayer, activeObject);
	    }
	});
    }
    // if canvas moves (e.g. light window), calcOffset must be called ...
    // there is no good cross-browser way to track an element changing,
    // (advice is to set a timer!) so we just check when the mouse enters the
    // div, because this is when the user will interact with some shape
    // only do this if we are in a light window
    if( dlayer.divjq.closest(JS9.lightOpts[JS9.LIGHTWIN].drag).length ){
	if( fabric.isTouchSupported ){
	    dlayer.divjq.on("touchstart", () => {dlayer.canvas.calcOffset();});
	} else {
	    dlayer.divjq.on("mouseenter", () => {dlayer.canvas.calcOffset();});
	}
    }
    return dlayer;
};

// ---------------------------------------------------------------------------
// Shape prototype additions to JS9 Image class
// ---------------------------------------------------------------------------

// showShapeLayer: if mode is true, layer is displayed, otherwise hidden
// also an internal call which uses {local: true} to maybe hide/show layers
// call using image context
JS9.Fabric.showShapeLayer = function(layerName, mode, opts){
    let jobj, xkey, layer, dlayer, canvas, objects, olen, obj;
    let left = 0;
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer ){
	return;
    }
    // opts is optional
    opts = opts || {};
    canvas = layer.canvas;
    dlayer = this.display.layers[layerName];
    if( mode ){
	// restore and show layer
	if( !opts.local ){
	    layer.show = true;
	}
	// restore selection property
	if( layer.show ){
	    canvas.selection = layer.opts.canvas.selection;
	}
	if( layer.json && layer.show ){
	    canvas.loadFromJSON(layer.json, () => {
		let key, tdlayer, obj;
		// update objects for parents and children
		JS9.Fabric.updateChildren(layer.dlayer, null, "objects");
		// translate these shapes if we resized while hidden
		if( this.resize ){
		    canvas.getObjects().forEach( (o) => {
			o.left += this.resize.left;
			o.top  += this.resize.top;
			o.setCoords();
		    });
		    canvas.calcOffset();
		}
		// refresh and redisplay this layer
		if( this.layers[layerName].opts.panzoom ){
		    this.binning.obin = this.binning.bin;
		    this.rgb.sect.ozoom = this.rgb.sect.zoom;
		    this.refreshShapes(layerName);
		} else {
		    canvas.renderAll();
		}
		layer.zindex = Math.abs(layer.zindex);
		dlayer.divjq.css("z-index", layer.zindex);
		// unselect selected objects in lower-zindex groups
		for( key in this.layers ){
		    if( this.layers.hasOwnProperty(key) ){
			if( (layerName !== key) && this.layers[key].show ){
			    tdlayer = this.display.layers[key];
			    if( tdlayer.divjq.css("z-index") < layer.zindex ){
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
	// plugin callbacks
	this.xeqPlugins("shape", "onshapelayershow", layerName);
    } else {
	// save and hide layer
	if( layer.show ){
	    // can't use forEachObject, which loops in ascending order,
	    // because removing anchors changes the array destructively!
	    objects = canvas.getObjects();
	    olen = objects.length;
	    while( olen-- ){
		obj = objects[olen];
		if( obj.params ){
		    if( obj.params.winid ){
			obj.params.winid.close();
			obj.params.winid = null;
		    }
		    if( obj.params.anchors ){
			JS9.Fabric.removePolygonAnchors(layer.dlayer, obj);
		    }
		}
	    }
	    jobj = canvas.toJSON(layer.dlayer.el);
	    layer.json = JSON.stringify(jobj);
	    canvas.selection = false;
	    // push towards the bottom of the pile
	    if( dlayer ){
		layer.zindex = -Math.abs(layer.zindex);
		dlayer.divjq.css("z-index", layer.zindex);
	    }
	    canvas.clear();
	}
	if( !opts.local ){
	    layer.show = false;
	}
	// plugin callbacks
	this.xeqPlugins("shape", "onshapelayerhide", layerName);
    }
    return this;
};

// display all layers for the current image (save previous)
// call using image context
JS9.Fabric.displayShapeLayers = function(){
    let key;
    // if prev and cur are the same, just exit
    if( this === this.display.image ){
	return;
    }
    // this.display.image still points to the previously loaded image
    // save old layers
    if( this.display.image && this.display.image.layers ){
	for( key in this.display.image.layers ){
	    if( this.display.image.layers.hasOwnProperty(key) ){
		this.display.image.showShapeLayer(key, false, {local: true});
	    }
	}
    }
    // "this" points to the current image: display new layers
    if( this.layers ){
	for( key in this.layers ){
	    if( this.layers.hasOwnProperty(key) ){
		this.showShapeLayer(key, true, {local: true});
	    }
	}
    }
};

// toggle display of active layers for the current image (save previous)
// call using image context
JS9.Fabric.toggleShapeLayers = function(){
    let key, layer;
    if( this.toggleLayers ){
	// toggleLayers => we are currently hidden, so display them
	for( key in this.layers ){
	    if( this.layers.hasOwnProperty(key) ){
		layer = this.layers[key];
		if( layer && this.toggleLayers[key] ){
		    this.showShapeLayer(key, true);
		}
	    }
	}
	delete this.toggleLayers;
    } else {
	// no toggleLayers => we are currently displayed, so hide them
	this.toggleLayers = {};
	for( key in this.layers ){
	    if( this.layers.hasOwnProperty(key) ){
		if( key === "crosshair" ){
		    continue;
		}
		layer = this.layers[key];
		if( layer && layer.show && layer.dlayer.dtype === "main" ){
		    this.toggleLayers[key] = true;
		    this.showShapeLayer(key, false);
		}
	    }
	}
    }
};

// retrieve (and initialize, if necessary) a shape layer
// call using image context
// eslint-disable-next-line no-unused-vars
JS9.Fabric.getShapeLayer = function(layerName, opts){
    let dlayer, layer;
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
	// assume we show this layer
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

// use zindex to make specified shape layer the active layer
// call using image context
JS9.Fabric.activeShapeLayer = function(s){
    let i, j, a, key, layer, tlayer, ozindex, tzindex, rtn;
    if( !s ){
	// no args: return layer with highest zindex
	for( key in this.layers ){
	    if( this.layers.hasOwnProperty(key) ){
		tlayer = this.layers[key];
		if( tlayer.dlayer.dtype === "main" ){
		    if( (tzindex === undefined) || (tlayer.zindex > tzindex) ){
			tzindex = tlayer.zindex;
			a = key;
		    }
		}
	    }
	}
	// return highest zindex layer
	rtn = a;
    } else if( $.isArray(s) ){
	// non-public internal call: array of layers was specified
	// set zindex for layers in decreasing order
	for(i=0, j=this.zlayer-1; i<s.length; i++){
	    layer = this.layers[s[i]];
	    if( layer.dlayer.dtype === "main" ){
		layer.zindex = j--;
		if( layer.show ){
		    // save the active layer for return value
		    if( !a ){
			a = s[i];
		    }
		} else {
		    layer.zindex = - layer.zindex;
		}
		layer.dlayer.divjq.css("z-index", layer.zindex);
	    }
	}
	// return active layer
	rtn = a;
    } else {
	// public call: highest layer was specified directly
	// set the zindex (and switch any layer with same zindex)
	layer = this.layers[s];
	if( layer && layer.show ){
	    // set highest zindex for specified layer
	    ozindex = layer.zindex;
	    layer.zindex = this.zlayer - 1;
	    layer.dlayer.divjq.css("z-index", layer.zindex);
	    for( key in this.layers ){
		if( this.layers.hasOwnProperty(key) ){
		    // if another layer has top zindex, switch with original
		    // zindex of layer we are bringing to the top
		    // duh ... don't reset the specified layer
		    tlayer = this.layers[key];
		    if( (tlayer !== layer)               &&
			(tlayer.zindex === layer.zindex) &&
			(tlayer.dlayer.dtype === "main") ){
			    tlayer.zindex = ozindex;
			    tlayer.dlayer.divjq.css("z-index", tlayer.zindex);
		    }
		}
	    }
	    // plugin callbacks
	    this.xeqPlugins("shape", "onshapelayeractive", s);
	}
	// public: allow chaining
	rtn = this;
    }
    // return the news
    return rtn;
};

// process options, separating into fabric opts and params
// call using image context
JS9.Fabric._parseShapeOptions = function(layerName, opts, obj){
    let i, j, tags, pos, cpos, len, zoom, owcssys, txeq;
    let key, shape, radinc, nrad, radius, tf, arr, parent;
    const nopts = {}, nparams = {};
    const YFUDGE = 1;
    // get color for a given shape tag
    const tagColor = (tags, tagcolors, obj) => {
	let tkey, ctags, color;
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
    // is image zoom part of scale?
    if( this.display.layers[layerName].dtype === "main" ){
	zoom = this.rgb.sect.zoom;
    } else {
	zoom = 1;
    }
    // remove means nothing else matters
    if( opts.remove ){
	return {remove: opts.remove};
    }
    // initialize
    nparams.tags = [];
    // remove dangerous options (e.g., passed in JS9.GetRegions() object)
    parent = opts.parent || (obj && obj.params && obj.params.parent);
    delete opts.parent;
    if( !opts.restoreid ){
	delete opts.id;
    }
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
    if( JS9.notNull(opts.angle) ){
	// for non-children, add in file rotation as needed
	// (moved from JS9.Regions.parseRegions.getang() 9/11/2019)
	if( !parent ){
	    switch(opts.shape){
	    case "box":
	    case "ellipse":
	    case "text":
		if( this.raw.wcsinfo && this.raw.wcsinfo.crot ){
		    opts.angle += this.raw.wcsinfo.crot;
		}
		break;
	    default:
		break;
	    }
	}
	nopts.angle = -opts.angle;
	// adjust angle due to image flip
	if( opts.shape !== "polygon" && opts.shape !== "text" ){
	    if( this.raw.wcsinfo &&
		((this.raw.wcsinfo.cdelt1 < 0 && this.raw.wcsinfo.cdelt2 < 0) ||
		(this.raw.wcsinfo.cdelt1 > 0 && this.raw.wcsinfo.cdelt2 > 0)) ){
		nopts.angle = opts.angle - 360;
	    } else if( !this.raw.wcsinfo &&
		       (this.getFlip() === "x" || this.getFlip() === "y") ){
		nopts.angle = opts.angle - 360;
	    }
	}
    }
    //  x and y are image coords, convert to display coords
    if( (opts.x !== undefined) && (opts.y !== undefined) ){
	pos = this.imageToDisplayPos(opts);
	nopts.left = pos.x;
	nopts.top = pos.y;
    }
    //  px and py are physical coords, convert to display coords
    if( (opts.px !== undefined) && (opts.py !== undefined) ){
	pos = this.logicalToDisplayPos({x: opts.px, y: opts.py});
	nopts.left = pos.x;
	nopts.top = pos.y;
    }
    // wcs string: ra dec [wcssys]
    if( typeof opts.wcs === "string" ){
        arr = opts.wcs.trim().split(/ +/);
        opts.ra  = arr[0];
        opts.dec = arr[1];
        if( arr.length >= 3 ){
	    opts.wcssys = arr[2];
        }
    }
    //  ra and dec are in degrees, using the current wcs
    if( (opts.ra !== undefined) && (opts.dec !== undefined) &&
	(this.raw.wcs > 0) ){
	// make sure we have the right wcssys
	if( opts.wcssys ){
	    // from passed-in opts
	    owcssys = this.getWCSSys();
	    txeq = JS9.globalOpts.xeqPlugins;
	    JS9.globalOpts.xeqPlugins = false;
	    this.setWCSSys(opts.wcssys);
	} else if( opts._wcssys ){
	    // local override from parseRegions
	    owcssys = this.getWCSSys();
	    txeq = JS9.globalOpts.xeqPlugins;
	    JS9.globalOpts.xeqPlugins = false;
	    this.setWCSSys(opts._wcssys);
	    // no longer needed or wanted
	    delete opts._wcssys;
	}
	// convert wcs supplied as strings
	if( typeof opts.ra === "string" ){
	    opts.ra = JS9.saostrtod(opts.ra);
	    if( (String.fromCharCode(JS9.saodtype()) === ":") &&
		(this.params.wcssys !== "galactic" )     &&
		(this.params.wcssys !== "ecliptic" )     ){
		opts.ra *= 15.0;
	    }
	}
	if( typeof opts.dec === "string" ){
	    opts.dec = JS9.saostrtod(opts.dec);
	}
	// convert to image coords
	arr = JS9.wcs2pix(this.raw.wcs, opts.ra, opts.dec).trim().split(/ +/);
	// restore original wcssys
	if( owcssys ){
	    this.setWCSSys(owcssys);
	    JS9.globalOpts.xeqPlugins = txeq;
	}
	// convert to display coords
	pos = this.imageToDisplayPos({x: parseFloat(arr[0]),
				      y: parseFloat(arr[1])});
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
    // last gasp to get left and top (unless explicitly told not to)
    if( nopts.left === undefined && opts.noLeftTop !== true ){
	if( obj && (obj.left !== undefined) ){
	    nopts.left = obj.left;
	} else {
	    nopts.left = this.display.canvasjq.attr("width") / 2 - 1;
	}
    }
    if( nopts.top === undefined && opts.noLeftTop !== true ){
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
			if( opts.sizeScale ){
			    nparams.radii[i] *= opts.sizeScale;
			}
			nparams.radii[j++] = this.wcs2imlen(nparams.radii[i]);
		    }
		}
	    } else {
		nparams.radii = opts.radii;
		if( opts.sizeScale ){
		    for(i=0; i<nparams.radii.length; i++){
			nparams.radii[i] *= opts.sizeScale;
		    }
		}
	    }
	} else {
	    // we can scale menu-created regions to be reasonably sized
	    if( opts.ireg && JS9.SCALEIREG ){
		if( JS9.notNull(opts.iradius) ){
		    opts.iradius /= zoom;
		}
		if( JS9.notNull(opts.oradius) ){
		    opts.oradius /= zoom;
		}
	    }
	    // useful if you pass one image's region object to another, e.g.,
	    // when sync'ing between two images of different cdelt1
	    if( opts.sizeScale ){
		if( JS9.notNull(opts.iradius) ){
		    opts.iradius *= opts.sizeScale;
		}
		if( JS9.notNull(opts.oradius) ){
		    opts.oradius *= opts.sizeScale;
		}
	    }
	    radinc = (opts.oradius - opts.iradius) / opts.nannuli;
	    nrad = opts.nannuli + 1;
	    for(i=0; i<nrad; i++){
		radius = opts.iradius + (radinc * i);
		if( opts.sizeScale ){
		    radius *= opts.sizeScale;
		}
		nparams.radii.push(radius);
	    }
	}
	break;
    case "box":
	// we can scale menu-created regions to be reasonably sized
	if( opts.ireg && JS9.SCALEIREG ){
	    if( JS9.notNull(opts.width) ){
		opts.width /= zoom;
	    }
	    if( JS9.notNull(opts.height) ){
		opts.height /= zoom;
	    }
	}
	// useful if you pass one image's region object to another, e.g.,
	// when sync'ing between two images of different cdelt1
	if( opts.sizeScale ){
	    if( JS9.notNull(opts.width) ){
		opts.width *= opts.sizeScale;
	    }
	    if( JS9.notNull(opts.height) ){
		opts.height *= opts.sizeScale;
	    }
	}
	break;
    case "circle":
	// we can scale menu-created regions to be reasonably sized
	if( opts.ireg && JS9.SCALEIREG ){
	    if( JS9.notNull(opts.radius) ){
		opts.radius /= zoom;
	    }
	}
	// useful if you pass one image's region object to another, e.g.,
	// when sync'ing between two images of different cdelt1
	if( opts.sizeScale ){
	    if( JS9.notNull(opts.radius) ){
		opts.radius *= opts.sizeScale;
	    }
	}
	break;
    case "ellipse":
	// we can scale menu-created regions to be reasonably sized
	if( opts.ireg && JS9.SCALEIREG ){
	    if( JS9.notNull(opts.r1) ){
		opts.r1 /= zoom;
	    }
	    if( JS9.notNull(opts.r2) ){
		opts.r2 /= zoom;
	    }
	}
	// useful if you pass one image's region object to another, e.g.,
	// when sync'ing between two images of different cdelt1
	if( opts.sizeScale ){
	    if( JS9.notNull(opts.r1) ){
		opts.r1 *= opts.sizeScale;
	    }
	    if( JS9.notNull(opts.r2) ){
		opts.r2 *= opts.sizeScale;
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
	//  wcspts in degrees, using the current wcs
	if( (opts.wcspts !== undefined) && (this.raw.wcs > 0) ){
            // fill pts array with better values from wcs, to be used below
	    opts.pts = [];
	    // make sure we have the right wcssys
	    if( opts.wcssys ){
		// from passed-in opts
		owcssys = this.getWCSSys();
		txeq = JS9.globalOpts.xeqPlugins;
		JS9.globalOpts.xeqPlugins = false;
		this.setWCSSys(opts.wcssys);
	    }
	    for(i=0; i<opts.wcspts.length; i++){
		// convert to image coords
		arr = JS9.wcs2pix(this.raw.wcs,
				opts.wcspts[i].ra, opts.wcspts[i].dec)
		    .trim().split(/ +/);
		opts.pts.push({x:parseFloat(arr[0]), y:parseFloat(arr[1])});
	    }
	    // restore original wcssys
	    if( owcssys ){
		this.setWCSSys(owcssys);
		JS9.globalOpts.xeqPlugins = txeq;
	    }
	}
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
	// NB: checking obj in the next line is not a typo ...
	// ... don't even think of changing it to opts (again)!
	} else if( !obj || !obj.points || !obj.points.length ){
	    if( opts.shape === "polygon" && opts. polypoints ){
		opts.points = opts.polypoints;
	    } else if( opts.shape === "line" && opts. linepoints ){
		opts.points = opts.linepoints;
	    }
	}
	// we can scale menu-created regions to be reasonably sized
	if( opts.ireg && JS9.SCALEIREG ){
	    len = opts.points.length;
	    for(i=0; i<len; i++){
		opts.points[i].x /= zoom;
		opts.points[i].y /= zoom;
	    }
	}
	break;
    case "text":
	break;
    }
    // separate opts and params
    for( key in opts ){
	if( opts.hasOwnProperty(key) ){
	    // eslint-disable no-fallthrough
	    switch(key){
	    case "tags":
	    case "x":
	    case "y":
	    case "px":
	    case "py":
	    case "dx":
	    case "dy":
	    case "ra":
	    case "dec":
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
	    case "borderDashArray":
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
	    case "send":
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
	    case "textOpts":
		nopts[key] = opts[key];
		break;
	    case "shape":
		shape = opts[key];
		break;
	    default:
		nparams[key] = opts[key];
		break;
	    }
	    // eslint-enable no-fallthrough
	}
    }
    // finalize some properties
    nopts.stroke = nparams.color || nopts.stroke ||
	           tagColor(nparams.tags, nparams.tagcolors, obj);
    nopts.selectColor = nopts.stroke;
    if( JS9.globalOpts.controlsMatchRegion === true ||
	JS9.globalOpts.controlsMatchRegion === "corner" ){
	nopts.cornerColor = nopts.stroke;
    }
    if( JS9.globalOpts.controlsMatchRegion === true ||
	JS9.globalOpts.controlsMatchRegion === "border" ){
	nopts.borderColor = nopts.stroke;
    }
    if( (nparams.changeable === undefined)     &&
	(nparams.fixinplace !== undefined)  ){
	nparams.changeable = !nparams.fixinplace;
    }
    if( nparams.changeable !== undefined ){
	tf = !nparams.changeable;
	nopts.lockMovementX = tf;
	nopts.lockMovementY = tf;
	nopts.lockRotation = tf;
	nopts.lockScalingX = tf;
	nopts.lockScalingY = tf;
	nopts.hasControls = !tf;
	nopts.hasRotatingPoint = !tf;
	nopts.hasBorders = !tf;
    }
    // movable means x and y movement
    if( nparams.movable !== undefined ){
	tf = !nparams.movable;
	nopts.lockMovementX = tf;
	nopts.lockMovementY = tf;
    }
    // resizable
    if( nparams.resizable !== undefined ){
	tf = nparams.resizable;
	nopts.hasControls = tf;
	nopts.hasBorders = tf;
    }
    // rotatable
    if( nparams.rotatable !== undefined ){
	tf = !nparams.rotatable;
	if( nopts.lockRotation === undefined ){
	    nopts.lockRotation = tf;
	    nopts.hasRotatingPoint = !tf;
	}
    }
    // return shape, opts and params
    return {shape: shape, opts: nopts, params: nparams};
};

// given an object full of keys, return an array of key names for export
// call using image context
JS9.Fabric._exportShapeOptions = function(opts){
    // sanity check
    if( typeof opts !== "object" ){
	return [];
    }
    // array of export keys, with many stripped out
    return Object.keys(opts).filter( (item) => {
	switch(item){
	case "top":
	case "left":
	case "width":
	case "height":
	case "radius":
	case "rx":
	case "ry":
	case "angle":
	case "panzoom":
	case "iradius":
	case "oradius":
	case "nannuli":
	case "aradius1":
	case "aradius2":
	case "configURL":
	case "sortOverlapping":
	case "tagcolors":
	case "pts":
	case "ptshape":
	case "ptsize":
	case "linepoints":
	case "polypoints":
	case "responseType":
	case "display":
	case "tags":
	case "r1":
	case "r2":
	case "x":
	case "y":
	case "dx":
	case "dy":
	case "px":
	case "py":
	case "shape":
	case "parent":
	case "rtn":
	case "_wcssys":
	case "file":
	    return false;
	case "text":
	    if( opts.shape === "text" ){
		return false;
	    }
	    return true;
	default:
	    return true;
	}
    });
};

// if shape is not text but text is specified in the opts,
// make a text shape as a child of this shape
// call using image context
JS9.Fabric._handleChildText = function(layerName, s, opts){
    let i, t, dpos, npos, topts, yoff, child;
    const textht = 12;
    // region layer only, for now
    if( layerName !== "regions" ){
	return;
    }
    // opts are optional
    opts = opts || {};
    if( (s.params.shape !== "text") && opts.text          &&
	(!s.params.children || !s.params.children.length) ){
	yoff = (s.height * s.scaleX / 2) - textht;
	// default position for text (might be overridden by textOpts)
	if( Math.abs(s.angle) < 0.000001 ){
	    dpos = {x: s.left, y: s.top - yoff};
	} else {
	    dpos = JS9.rotatePoint({x: s.left, y: s.top - yoff},
				   s.angle, {x: s.left, y: s.top});
	}
	npos = this.displayToImagePos(dpos);
	topts = {x: npos.x, y: npos.y, angle: -s.angle,
		 color: s.stroke, text: opts.text,
		 parent: "TBD", rtn: "object"};
	if( opts.textOpts ){
	    topts = $.extend(true, {}, topts, opts.textOpts);
	}
	// create the child shape
	t = JS9.Fabric.addShapes.call(this, layerName, "text", topts);
	// parent object keeps track of relationship between parent and child
	t.params.parent = {id: s.params.id,
			   obj: s,
			   dleft: s.left - t.left,
			   dtop: s.top - t.top,
			   lastscalex: s.scaleX,
			   lastscaley: s.scaleY,
			   lastangle: s.angle,
			   textheight: textht};
	// updateShape was skipped in addShapes because parent was TBD
	// we can now updateShape with parent info ...
	JS9.Fabric._updateShape.call(this,
				     layerName, t, null, "child", t.params);
	// since strokeWidth changes with zoom, we need to save the opts
	// and restore it on export
	if( opts.strokeWidth !== undefined ){
	    t.params.parent.strokeWidth = opts.strokeWidth;
	}
	// text might be moved off default position already
	if( (npos.x !== topts.x) || (npos.y !== topts.y) ){
	    t.params.parent.moved = true;
	}
	// flag if text RA and Dec were passed in textOpts
	if( opts.textOpts                    &&
	    opts.textOpts.ra  !== undefined  &&
	    opts.textOpts.dec !== undefined  ){
	    t.params.hasTextOpts = true;
	}
	// parent has another child
	s.params.children.push({id: t.params.id, obj: t});
	// update the parent
	JS9.Fabric._updateShape.call(this,
				     layerName, s, null, "addchild", s.params);
    } else if( s.params.children && (opts.text || opts.textOpts) ){
	// process parameters passed to existing text children
	for(i=0; i<s.params.children.length; i++){
	    child = s.params.children[i].obj;
	    topts = $.extend(true, {}, opts.textOpts || {});
	    if( opts.text ){
		topts.text = opts.text;
	    }
	    this.changeShapes(layerName, child.params.id, topts);
	}
    }
};

// add shapes to a layer
// call using image context
JS9.Fabric.addShapes = function(layerName, shape, myopts){
    let i, sobj, sarr, ns, s, bopts, opts, layer, canvas, dlayer;
    let zoom, ttop, tleft;
    let params = {};
    let rarr = [];
    const objs = [];
    // is this core service disabled?
    if( $.inArray("regions", this.params.disable) >= 0 &&
	layerName === "regions" ){
	return;
    }
    // optional myopts can be an object or a string
    myopts = myopts || {};
    // opts can be an object or json
    if( typeof myopts === "string" ){
	try{ myopts = JSON.parse(myopts); }
	catch(e){ JS9.error(`can't parse shape opts: ${myopts}`, e); }
    }
    // delay adding the region, if this image is not the one being displayed
    if( this.display.image !== this ){
	this.delayedShapes = this.delayedShapes || [];
	this.delayedShapes.push({layer: layerName, shape: shape, opts: myopts});
	return;
    }
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer || !layer.show ){
	return;
    }
    canvas = layer.canvas;
    // is image zoom part of scale?
    if( this.display.layers[layerName].dtype === "main" ){
	zoom = this.rgb.sect.zoom;
    } else {
	zoom = 1;
    }
    // figure out the first arg
    if( typeof shape === "string" ){
	// look for a region string
	s = this.parseRegions(shape, myopts);
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
    // once a shape has been added, we can set the zindex to process events
    if( JS9.isNull(layer.zindex) || Number.isNaN(layer.zindex)  ){
	if( this.display.layers[layerName].dtype === "main" ){
	    switch(layerName){
	    case JS9.Crosshair.LAYERNAME:
	    case JS9.Grid.LAYERNAME:
		// these should never cover any other interactive layer
		layer.zindex = 1;
		break;
	    default:
		// otherwise this layer goes to the top
		layer.zindex = this.zlayer++;
		break;
	    }
	} else {
	    // layer is not in main display
	    layer.zindex = JS9.SHAPEZINDEX;
	}
	dlayer = this.display.layers[layerName];
        dlayer.divjq.css("z-index", layer.zindex);
	// we can now call the shape layer create plugin callbacks
	this.xeqPlugins("shape", "onshapelayercreate", layerName);
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
	if( params.id === undefined ){
	    params.id = ++layer.nshape;
	}
	// get array of option names to export when saving regions
	params.exports = JS9.Fabric._exportShapeOptions.call(this, myopts)
	         .concat(JS9.Fabric._exportShapeOptions.call(this, sarr[ns]));
	// no parents or children yet
	params.parent = null;
	params.children = [];
	// if stroke (color) is defined, we probably need to convert it to hex
	if( opts.stroke ){
	    opts.color = opts.stroke;
	    opts.stroke = JS9.colorToHex(opts.stroke);
	}
	// create the shape
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
	    rarr = [];
	    if( params.radii ){
		for(i=0; i<params.radii.length; i++){
		    opts.radius = params.radii[i];
		    rarr.push(new fabric.Circle(opts));
		}
	    }
	    // an annulus is a group of circles at the specified position
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
	    // FF svg to pdf is broken: use fill instead of stroke
	    // https://github.com/kangax/fabric.js/issues/2675
	    opts.fill = opts.stroke;
	    opts.strokeWidth = 0;
	    s = new fabric.Text(params.text, opts);
	    break;
	default:
	    JS9.error(`unknown shape: ${sobj.shape}`);
	    break;
	}
	// add new shape to canvas
	canvas.add(s);
	// backlink to layer name
	params.layerName = layerName;
	// save original strokeWidth for zooming
	params.sw1 = Math.max(1, Math.floor(s.strokeWidth + 0.5));
	// initialize
	params.listonchange = false;
	// breaks panner, magnifier
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
		s.scale(zoom);
		break;
	    }
	}
	// and then rescale the stroke width
	s.rescaleBorder();
	// might need to make a text shape as a child of this shape
	JS9.Fabric._handleChildText.call(this, layerName, s, opts);
	// update the shape info, but not TBD children (will get done later)
	if( myopts.parent !== "TBD" ){
	    JS9.Fabric._updateShape.call(this,
					 layerName, s, null, "add", params);
	}
	// callback if necessary
	if( myopts.onaddshapes && s.pub ){
	    try{ JS9.xeqByName(myopts.onaddshapes, this, this, s.pub); }
	    catch(e){ JS9.error("in onaddshapes callback", e, false); }
	}
	// save public object in object array, might be needed in return
	objs.push(s);
    }
    // redraw (unless explicitly specified otherwise)
    if( (params.redraw === undefined) || params.redraw ){
	canvas.renderAll();
    }
    // return last object (internal use for child regions), if necessary
    if( myopts.rtn === "object" ){
	return s;
    }
    // return all objects (internal use for paste regions), if necessary
    if( myopts.rtn === "objs" ){
	return objs;
    }
    // return shape id
    return params.id;
};

// select a one of more shapes by id or tag and execute a callback
// call using image context
JS9.Fabric.selectShapes = function(layerName, id, cb){
    let i, group, ginfo, sobj, canvas, objects, olen, obj, ocolor, tag, ao;
    // sanity check
    if( !this.layers || !layerName || !this.layers[layerName] ){
	return null;
    }
    // no id means "all"
    id = id || "all";
    // if id is a positive int in string format, convert it to it now
    // so we can process it as a region id coming from the command line
    if( (typeof id === "string") && /^[1-9]\d*$/.test(id) ){
	id = parseInt(id, 10);
    }
    // convenience variable(s)
    canvas = this.layers[layerName].canvas;
    // see if we have an active group
    if( fabric.major_version === 1 ){
	group = canvas.getActiveGroup();
    } else {
	ao = canvas.getActiveObject();
	if( ao && ao.type === 'activeSelection' ){
	    group = ao;
	} else {
	    group = null;
	}
    }
    // but an active group does not mean selected regions are inside it
    ginfo = {group: null};
    // select on the id
    switch( typeof id ){
    case "object":
	if( id.params ){
            if( group && group.contains(id) ){
	        ginfo.group = group;
	    }
	    // specific shape
	    cb.call(this, id, ginfo);
	}
	break;
    case "number":
	objects = canvas.getObjects();
        olen = objects.length;
	while( olen-- ){
	    obj = objects[olen];
	    if( obj.params && (id === obj.params.id) ){
		if( group && group.contains(obj) ){
		    ginfo.group = group;
		} else {
		    ginfo.group = null;
		}
		cb.call(this, obj, ginfo);
	    }
	}
	break;
    case "string":
	// string id can be a region tag, color, shape, or tag
	// look for id in various ways
        if( id === "selected" ){
	    if( fabric.major_version === 1 ){
		if( canvas.getActiveObject() ){
		    // make sure its a region
		    sobj = canvas.getActiveObject();
		    if( sobj.params ){
			ginfo.group = null;
			// selected object
			cb.call(this, sobj, ginfo);
		    }
		} else if( group ){
		    ginfo.group = group;
		    objects = group.getObjects();
		    olen = objects.length;
		    while( olen-- ){
			obj = objects[olen];
			// don't process shapes with parents in a group
			if( obj.params && !obj.params.parent ){
			    cb.call(this, obj, ginfo);
			}
		    }
		}
	    } else {
		ginfo.group = group;
		objects = canvas.getActiveObjects();
		olen = objects.length;
		while( olen-- ){
		    obj = objects[olen];
		    // don't process shapes with parents in a group
		    if( obj.params && !obj.params.parent ){
			cb.call(this, obj, ginfo);
		    }
		}
	    }
	} else {
	    // can't use forEachObject, which loops in ascending order,
	    // because a "remove" cb changes the array destructively!
	    objects = canvas.getObjects();
            olen = objects.length;
	    while( olen-- ){
		obj = objects[olen];
		// make sure its a valid region
		if( !obj.params ){ continue; }
		// no text children unless explicity specified
		if( obj.params.parent && id !== "child" && id !== "All" ){
		    continue;
		}
		// children should always have a parent
		if( id === "child" && !obj.params.parent ){
		    continue;
		}
		ocolor = obj.stroke.toLowerCase();
		if( group && group.contains(obj) ){
		    ginfo.group = group;
		} else {
		    ginfo.group = null;
		}
		if( id.toLowerCase() === "all" ){
		    // all
		    cb.call(this, obj, ginfo);
		} else if( (id.toLowerCase() === ocolor) ||
			   (JS9.colorToHex(id).toLowerCase() === ocolor) ){
		    // color
		    cb.call(this, obj, ginfo);
		} else if( id === obj.params.shape ){
		    // shape
		    cb.call(this, obj, ginfo);
		} else if( id === obj.params.file ){
		    // origin filename
		    cb.call(this, obj, ginfo);
		} else if( id === "child" && obj.params.parent ){
		    // all
		    cb.call(this, obj, ginfo);
		} else if( id === "parent"            &&
			   obj.params.children        &&
			   obj.params.children.length ){
		    // all
		    cb.call(this, obj, ginfo);
		} else {
		    // tags
		    if( obj.params.tags){
			for(i=0; i<obj.params.tags.length; i++){
			    tag = obj.params.tags[i];
			    if( id.match(/^\/.*\/$/) &&
				tag.match(new RegExp(id.slice(1,-1)))){
				cb.call(this, obj, ginfo);
			    } else if( id === tag ){
				cb.call(this, obj, ginfo);
			    }
			}
		    }
		}
	    }
	}
	break;
    }
    return this;
};

// update public object in shapes
// call using image context
JS9.Fabric.updateShapes = function(layerName, shape, mode, opts){
    // process the specified shapes
    this.selectShapes(layerName, shape, (obj, ginfo) => {
	JS9.Fabric._updateShape.call(this, layerName, obj, ginfo, mode, opts);
    });
    return this;
};

// primitive to update one shape
// call using image context
JS9.Fabric._updateShape = function(layerName, obj, ginfo, mode, opts){
    let i, xname, s, scalex, scaley, px, py, v0, v1, tval1, tval2;
    let bin, zoom, tstr, dpos, gpos, ipos, npos, objs, olen, radius, oangle;
    let opos, dist;
    const pub ={};
    const layer = this.layers[layerName];
    const tr  = (x) => { return x.toFixed(2); };
    const tr4 = (x) => { return x.toFixed(4); };
    ginfo = ginfo || {};
    opts = opts || {};
    mode = mode || "update";
    // is image zoom part of scale?
    if( this.display.layers[layerName].dtype === "main" ){
	zoom = this.rgb.sect.zoom;
    } else {
	zoom = 1;
    }
    // fill in the blanks
    pub.mode = mode;
    pub.id = obj.params.id;
    pub.shape = obj.params.shape;
    pub.layer = layerName;
    pub.color = obj.color || obj.stroke;
    pub.tags = obj.params.tags;
    if( obj.params.parent ){
	pub.parent = obj.params.parent.obj.params.id;
    } else {
	pub.parent = null;
    }
    if( obj.params.children && obj.params.children.length ){
	// for now, just output the first one (cf. listRegions)
	pub.child = obj.params.children[0].id;
    } else {
	pub.child = null;
    }
    dpos = obj.getCenterPoint();
    if( ginfo.group ){
	// in a group, the display pos is relative to group pos,
	// so we need to add them together
	gpos = ginfo.group.getCenterPoint();
	dpos = {x: dpos.x + gpos.x, y: dpos.y + gpos.y};
	// also need to rotate the position by the group angle
	if( ginfo.group.angle ){
	    dpos = JS9.rotatePoint(dpos, ginfo.group.angle, gpos);
	}
    }
    // image position
    ipos = this.displayToImagePos(dpos);
    pub.x = ipos.x;
    pub.y = ipos.y;
    // logical position
    pub.lcs = this.imageToLogicalPos(ipos);
    // wcs system and some convenience variables
    if( this.params.wcssys === "image" ){
	pub.imsys = "image";
	px = pub.x;
	py = pub.y;
	bin = 1;
    } else {
	pub.imsys = pub.lcs.sys;
	px = pub.lcs.x;
	py = pub.lcs.y;
	bin = this.lcs.physical.reverse[0][0];
    }
    // fabric angle is in opposite direction
    pub.angle = -obj.angle;
    // remove angle due to image flip
    if( pub.shape !== "polygon" && pub.shape !== "text" ){
	if( this.raw.wcsinfo &&
	    ((this.raw.wcsinfo.cdelt1 < 0 && this.raw.wcsinfo.cdelt2 < 0) ||
	    (this.raw.wcsinfo.cdelt1 > 0 && this.raw.wcsinfo.cdelt2 > 0)) ){
	    pub.angle = obj.angle - 360;
	} else if( !this.raw.wcsinfo &&
		   (this.getFlip() === "x" || this.getFlip() === "y") ){
	    pub.angle = obj.angle - 360;
	}
    }
    if( ginfo.group ){
	pub.angle -= ginfo.group.angle;
    }
    // remove file rotation?
    oangle = pub.angle;
    if( !pub.parent && this.raw.wcsinfo && this.raw.wcsinfo.crot ){
	pub.angle -= this.raw.wcsinfo.crot;
    }
    while( pub.angle < 0 ){
	pub.angle += 360;
    }
    while( pub.angle >= 360 ){
	pub.angle -= 360;
    }
    // the parts of the obj.scale[XY] values related to size (not zoom, binning)
    scalex = obj.scaleX / zoom;
    scaley = obj.scaleY / zoom;
    if( ginfo.group ){
	scalex *= ginfo.group.scaleX;
	scaley *= ginfo.group.scaleY;
    }
    switch(pub.shape){
    case "annulus":
	pub.shape = "annulus";
	pub.radii = [];
	if( pub.imsys !== "image" ){
	    pub.lcs.radii = [];
	}
	pub.imstr = `annulus(${tr(px)}, ${tr(py)}, `;
	tstr = `annulus ${pub.x} ${pub.y} `;
	objs = obj.getObjects();
	olen = objs.length;
	for(i=0; i<olen; i++){
	    radius = objs[i].radius * scalex;
	    tval1 = radius * bin;
	    pub.imstr += tr(tval1);
	    tstr += `${pub.x} ${pub.y} ${pub.x + radius} ${pub.y} `;
	    if( i === (olen - 1) ){
		pub.imstr += ")";
	    } else {
		pub.imstr += ", ";
	    }
	    pub.radii.push(radius);
	    if( pub.imsys !== "image" ){
		pub.lcs.radii.push(tval1);
	    }
	}
	break;
    case "box":
	pub.shape = "box";
	pub.width = obj.width * scalex;
	pub.height = obj.height * scaley;
	tval1 = pub.width * bin;
	tval2 = pub.height * bin;
	if( pub.imsys !== "image" ){
	    pub.lcs.width = tval1;
	    pub.lcs.height = tval2;
	}
	pub.imstr = `box(${tr(px)}, ${tr(py)}, ${tr(tval1)}, ${tr(tval2)}, ${tr4(pub.angle)})`;
	tstr = `box ${pub.x} ${pub.y} ${pub.x} ${pub.y} ${pub.x + pub.width} ${pub.y} ${pub.x} ${pub.y} ${pub.x} ${pub.y + pub.height} ${pub.angle * Math.PI / 180.0}`;
	break;
    case "circle":
	pub.radius = obj.radius * scalex;
	tval1 = pub.radius * bin;
	if( pub.imsys !== "image" ){
	    pub.lcs.radius = tval1;
	}
	pub.imstr = `circle(${tr(px)}, ${tr(py)}, ${tr(tval1)})`;
	tstr = `circle ${pub.x} ${pub.y} ${pub.x} ${pub.y} ${pub.x + pub.radius} ${pub.y}`;
	break;
    case "ellipse":
	pub.r1 = obj.width * scalex / 2;
	pub.r2 = obj.height * scaley / 2;
	tval1 = pub.r1 * bin;
	tval2 = pub.r2 * bin;
	if( pub.imsys !== "image" ){
	    pub.lcs.r1 = tval1;
	    pub.lcs.r2 = tval2;
	}
	pub.imstr = `ellipse(${tr(px)}, ${tr(py)}, ${tr(tval1)}, ${tr(tval2)}, ${tr4(pub.angle)})`;
	tstr = `ellipse ${pub.x} ${pub.y} ${pub.x} ${pub.y} ${pub.x + pub.r1} ${pub.y} ${pub.x} ${pub.y} ${pub.x} ${pub.y + pub.r2} ${pub.angle * Math.PI / 180.0}`;
	break;
    case "point":
	pub.width =  obj.width * scalex;
	pub.height = obj.height * scaley;
	tval1 = pub.width * bin;
	tval2 = pub.height * bin;
	if( pub.imsys !== "image" ){
	    pub.lcs.width = tval1;
	    pub.lcs.height = tval2;
	}
	pub.imstr = `point(${tr(px)}, ${tr(py)})`;
	tstr = `point ${pub.x} ${pub.y}`;
	break;
    case "line":
    case "polygon":
	pub.imstr = `${pub.shape}(`;
	tstr = `${pub.shape} `;
	pub.pts = [];
	if( pub.imsys !== "image" ){
	    pub.lcs.pts = [];
	}
	for(i=0; i<obj.points.length; i++){
	    if( i > 0 ){
		pub.imstr += ", ";
		tstr += " ";
	    }
	    // get current point
	    npos = {x: pub.x + obj.points[i].x * scalex,
		    y: pub.y - obj.points[i].y * scaley};
	    // add rotation
	    npos = JS9.rotatePoint(npos, oangle,
				   {x: pub.x, y: pub.y});
	    if( this.params.wcssys === "image" ){
		pub.imstr += `${tr(npos.x)}, ${tr(npos.y)}`;
	    } else {
		const {x, y} = this.imageToLogicalPos(npos);
		pub.imstr += `${tr(x)}, ${tr(y)}`;
		pub.lcs.pts.push({x, y});
	    }
	    tstr += `${npos.x} ${npos.y}`;
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
        if( pub.shape === "line" && JS9.notNull(dist) ){
	    pub.imstr += `) {"size":${tr(dist)},"units":"pixels"}`;
	} else {
	    pub.imstr += ")";
	}
	// points already have the angle incorporated into them
	pub.angle = 0;
        break;
    case "text":
	pub.imstr = `text(${tr(px)}, ${tr(py)}, "${obj.text}", ${tr4(pub.angle)})`;
	tstr = `text ${pub.x} ${pub.y} "${obj.text}"` + ` ${pub.angle * Math.PI / 180.0}`;
	pub.text = obj.text;
	break;
    default:
	break;
    }
    // wcs processing
    if( this.raw.wcs && (this.raw.wcs > 0) ){
	// get ra and dec of central position
	s = JS9.pix2wcs(this.raw.wcs, ipos.x, ipos.y).trim().split(/\s+/);
	pub.rastr = s[0];
	pub.decstr = s[1];
	pub.wcssys = s[2];
	v0 = JS9.strtoscaled(s[0]);
	if( (v0.dtype === ":") &&
	    (s[2] !== "galactic") && (s[2] !== "ecliptic") ){
	    v0.dval *= 15.0;
	}
	v1 = JS9.strtoscaled(s[1]);
	pub.ra = v0.dval;
	pub.dec = v1.dval;
	// generate WCS strings iff updateWCS is true
	if( (opts.updateWCS !== false) &&
	    (opts.updateWCS || layer.opts.updateWCS) ){
	    pub.wcsstr = JS9.reg2wcs(this.raw.wcs, tstr).replace(/;$/, "");
	    // wcs size args
	    s = pub.wcsstr.replace(/.*\(/,"").replace(/\).*/,"").split(",");
	    for(i=0; i<s.length; i++){
		s[i] = s[i].trim();
	    }
	    pub.wcsposstr = [s[0], s[1]];
	    switch(pub.shape){
	    case "annulus":
		pub.wcssizestr = [s[s.length-1]];
		break;
	    case "box":
		pub.wcssizestr = [s[2], s[3]];
		break;
	    case "circle":
		pub.wcssizestr = [s[2]];
		break;
	    case "ellipse":
		pub.wcssizestr = [s[2], s[3]];
		break;
	    case "point":
		break;
	    case "line":
	    case "polygon":
		pub.wcspts = [];
		for(i=0; i<s.length; i+=2){
		    v0 = JS9.strtoscaled(s[i]);
		    if( (v0.dtype === ":") &&
			(pub.wcssys !== "galactic") &&
			(pub.wcssys !== "ecliptic") ){
			v0.dval *= 15.0;
		    }
		    v1 = JS9.strtoscaled(s[i+1]);
		    pub.wcspts.push({ra: v0.dval, dec: v1.dval});
		}
		break;
	    case "text":
		break;
	    default:
		break;
	    }
	}
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
    // stop here if no callbacks were requested
    if( opts.nocb ){
	return pub;
    }
    // callbacks for regions (but not child regions or some modes)
    if( !obj.params.parent && (mode !== "child")    &&
	(mode !== "move")  && (mode !== "mouseout") ){
	// when xeqonchange is set
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
	xname = `on${layerName}change`;
	this.xeqPlugins("shape", xname, pub);
    }
    // copy to clipboard, if necessary
    if( layerName === "regions" && JS9.globalOpts.regionsToClipboard ){
	switch(mode){
	case "add":
	case "select":
	case "update":
	    i = pub.parent || pub.id;
	    break;
	default:
	    i = null;
	    break;
	}
	if( JS9.notNull(i) ){
	    // ignore any problems
	    try{ s = this.listRegions(i, {mode: 1}); }
	    catch(e){ s = null; }
	    if( s ){ JS9.clipboard = s; }
	}
    }
    // and return it
    return pub;
};

// remove the active shape
// eslint-disable-next-line no-unused-vars
JS9.Fabric.removeShapes = function(layerName, shape, opts){
    let i, layer, canvas;
    const arr = [];
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer ){
	return;
    }
    canvas = layer.canvas;
    // save regions for unremove?
    if( layerName === "regions" && JS9.globalOpts.unremoveReg ){
	this.regstack.push(this.listRegions(shape, {mode: 1}, layerName));
	if( this.regstack.length > JS9.globalOpts.unremoveReg ){
	    this.regstack = this.regstack.slice(0,JS9.globalOpts.unremoveReg);
	}
    }
    // process the specified shapes
    this.selectShapes(layerName, shape, (obj, ginfo) => {
	let i, child, parent;
	if( obj.params.removable !== false ){
	    JS9.Fabric._updateShape.call(this, layerName, obj, ginfo, "remove");
	    // clear any dialog box
	    if( obj.params.winid ){
		obj.params.winid.close();
	    }
	    // unlink parent
	    if( obj.params.parent ){
		parent = obj.params.parent.obj;
		for(i=parent.params.children.length-1; i>=0; i--){
		    if( obj === parent.params.children[i].obj ){
			parent.params.children.splice(i,1);
			break;
		    }
		}
	    }
	    // mark children for removal
	    for(i=0; i<obj.params.children.length; i++){
		child = obj.params.children[i].obj;
		// mark for removal
		arr.push(child);
	    }
	    // mark for removal
	    arr.push(obj);
	}
    });
    // remove marked objects
    for(i=0; i<arr.length; i++){
	canvas.remove(arr[i]);
    }
    // handle changed selected group specially (fabric.js nuance)
    if( fabric.major_version === 1 ){
	if( canvas.getActiveGroup() ){
	    canvas.discardActiveGroup();
	}
    } else {
	canvas.discardActiveObject();
    }
    canvas.renderAll();
    // reset the counter if all shapes were removed?
    if( !canvas.getObjects().length && JS9.globalOpts.resetEmptyShapeId ){
	layer.nshape = 0;
    }
    return this;
};

// return one or more regions
// call using image context
JS9.Fabric.getShapes = function(layerName, shape, opts){
    let myshape = {};
    const shapes = [];
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse getShapes opts: ${opts}`, e); }
    }
    // return regions in text format, if necessary
    if( layerName === "regions" && opts.format === "text" ){
	return this.listRegions(shape, {mode: opts.mode || 1});
    }
    // process the specified shapes
    this.selectShapes(layerName, shape, (obj) => {
	// public part of the shape
	myshape = obj.pub || {};
	// might need shape object itself
	if( opts.includeObj ){
	    myshape.obj = obj;
	}
	// add this region to the output array
	shapes.push(myshape);
    });
    return shapes;
};

// change the specified shape(s)
// call using image context
JS9.Fabric.changeShapes = function(layerName, shape, opts){
    let i, s, sobj, bopts, layer, canvas, ao, rlen, color, maxr, zoom, exports;
    const orad = [];
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer ){
	return;
    }
    // sanity check
    if( !opts ){
	return;
    }
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse shape opts: ${opts}`, e); }
    }
    canvas = layer.canvas;
    // is image zoom part of scale?
    if( this.display.layers[layerName].dtype === "main" ){
	zoom = this.rgb.sect.zoom;
    } else {
	zoom = 1;
    }
    // active object
    ao = canvas.getActiveObject();
    // process the specified shapes
    this.selectShapes(layerName, shape, (obj, ginfo) => {
	// combine the objects parameters with the new options
	// clearing some of the old ones first
	if( opts.radii ){
	    obj.params.radii = [];
	}
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
	// send region to front or back of set of overlapping regions
	if( sobj.opts.send ){
	    switch(sobj.opts.send){
	    case "front":
		canvas.sendToFront(ao);
		canvas.discardActiveObject();
		break;
	    case "back":
		canvas.sendToBack(ao);
		canvas.discardActiveObject();
		break;
	    default:
		break;
	    }
	}
	// get new option names to export when saving regions
	exports = JS9.Fabric._exportShapeOptions.call(this, opts)
	    .filter( (item) => {
		return !obj.params.exports.hasOwnProperty(item);
	    });
	sobj.params.exports = obj.params.exports.concat(exports);
	// if stroke (color) is defined, we probably need to convert it to hex
	if( sobj.opts.stroke ){
	    sobj.opts.color = sobj.opts.stroke;
	    sobj.opts.stroke = JS9.colorToHex(sobj.opts.stroke);
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
	// if strokeWidth is specified, we change params.sw1,
	// which will be used by the rescaleBorder routine below
	if( opts.strokeWidth ){
	    obj.params.sw1 = opts.strokeWidth;
	}
	// shape-specific post-processing
	// mainly: change of size => remove size-based scaling factor
	switch(obj.params.shape){
	case "annulus":
	    if( opts.radii && opts.radii.length ){
		color = obj.get("stroke");
		// remove existing annuli
		// can't remove inside the forEachObject loop
		obj.forEachObject( (tobj) => { orad.push(tobj); });
		// so do it outside the loop
		rlen = orad.length;
		for(i=0; i<rlen; i++){
		    obj.remove(orad[i]);
		    canvas.remove(orad[i]);
		}
		// generate new annuli
		rlen = obj.params.radii.length;
		maxr = 0;
		for(i=0; i<rlen; i++){
		    s = new fabric.Circle({radius: obj.params.radii[i],
					   stroke: color});
		    maxr = Math.max(maxr, obj.params.radii[i]);
		    obj.add(s);
		}
		obj.scaleX = zoom;
		obj.scaleY = zoom;
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
		obj.scaleX = zoom;
	    }
	    if( opts.height ){
		obj.scaleY = zoom;
	    }
	    break;
	case "circle":
	    if( opts.radius ){
		obj.scaleX = zoom;
		obj.scaleY = zoom;
	    }
	    break;
	case "ellipse":
	    if( opts.r1 ){
		obj.rx = obj.params.r1;
		obj.scaleX = zoom;
		// this sets the width of the control box
		// why is it not done automatically???
		obj.width = obj.rx * 2;
	    }
	    if( opts.r2 ){
		obj.ry = obj.params.r2;
		obj.scaleY = zoom;
		// this sets the height of the control box
		// why is it not done automatically???
		obj.height = obj.ry * 2;
	    }
	    break;
	case "line":
	case "polygon":
	    if( (opts.points && opts.points.length) ||
		(opts.pts && opts.pts.length)       ){
		obj.scaleX = zoom;
		obj.scaleY = zoom;
	    }
	    if( ao === obj ){
		JS9.Fabric.removePolygonAnchors(layer.dlayer, obj);
		JS9.Fabric.addPolygonAnchors(layer.dlayer, obj);
	    }
	    // reset the center point
	    JS9.resetPolygonCenter(obj);
	    break;
	case "text":
	    if( opts.text ){
		obj.params.text = opts.text;
	    }
	    break;
	}
	// make sure border width is correct
	obj.rescaleBorder();
	// update children
	JS9.Fabric.updateChildren(layer.dlayer, obj, "moving");
	JS9.Fabric.updateChildren(layer.dlayer, obj, "scaling");
	JS9.Fabric.updateChildren(layer.dlayer, obj, "rotating");
	// update child's parent deltas
	JS9.Fabric.updateChildren(layer.dlayer, obj, "deltas");
	// and reset coords
	obj.setCoords();
	// might need to make a text shape as a child of this shape
	JS9.Fabric._handleChildText.call(this, layerName, obj, opts);
	// update the shape info and make callbacks
	JS9.Fabric._updateShape.call(this, layerName, obj, ginfo, "update");
	// callback if necessary
	if( opts.onchangeshapes && obj.pub ){
	    try{ JS9.xeqByName(opts.onchangeshapes, this, this, obj.pub); }
	    catch(e){ JS9.error("in onchangeshapes callback", e, false); }
	}
    });
    // redraw (unless explicitly specified otherwise)
    if( (opts.redraw === undefined) || opts.redraw ){
	canvas.renderAll();
    }
    return this;
};

// update shape layer after a change in panning, zooming, binning
// call using image context
JS9.Fabric.refreshShapes = function(layerName){
    let regstr, owcssys, txeq;
    // sanity check
    if( !layerName ){
	return;
    }
    // temporarily turn off plugin execution
    txeq = JS9.globalOpts.xeqPlugins;
    JS9.globalOpts.xeqPlugins = false;
    // temporarily change wcs system to be independent of image coords
    owcssys = this.getWCSSys();
    if( this.raw.wcs && (this.raw.wcs > 0) ){
	this.setWCSSys("native");
    } else {
	this.setWCSSys("physical");
    }
    // get current regions (i.e., before update to current configuration)
    regstr = this.listRegions("all", {mode: 1, saveid: true}, layerName);
    if( regstr ){
	// remove current regions
	this.removeShapes(layerName, "all");
	// add back regions in current configuration
	this.addShapes(layerName, regstr, {restoreid: true});
    }
    // restore changes
    this.setWCSSys(owcssys);
    JS9.globalOpts.xeqPlugins = txeq;
    return this;
};

// add (or remove) a point to a polygon, adapted from:
// http://stackoverflow.com/questions/14014861/constrain-image-to-a-path-in-kineticjs
// call using image context
JS9.Fabric.addPolygonPoint = function(layerName, obj, evt){
    let i, points, p1, p2, minX, minY, maxX, maxY, dir, m, dot, d, angle, layer;
    let mpos = {};
    let pVec = {};
    let p = {};
    let diff  =  Number.MAX_VALUE;   // a bloated diff, for minimum comparison
    const canv = {}, local = {};
    const newpt = {}, pos = {};
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
    //A simple bounds checking to ensure the projection is on
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
        //Minimum comparison.
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
    if( fabric.major_version === 1 ){
	layer.canvas.setActiveObject(obj);
    } else {
	switch(obj.type){
	case "polyline":
	case "polygon":
	    JS9.Fabric.addPolygonAnchors(layer.dlayer, obj);
	    layer.dlayer.canvas.renderAll();
	    break;
	}
	// set currently selected shape
	if( obj.polyparams ){
	    layer.dlayer.params.sel = obj.polyparams.polygon;
	} else if( obj.params ){
	    layer.dlayer.params.sel = obj;
	}
    }
};

// remove the specified point
// call using image context
JS9.Fabric.removePolygonPoint = function(layerName, obj){
    let layer, polygon, points, pt;
    // sanity check
    if( !obj || !obj.polyparams ){
	return;
    }
    // get info on this point
    polygon = obj.polyparams.polygon;
    points = polygon.points;
    // maintain minimum number of points
    if( (polygon.type === "polygon") && (points.length <= 3) ){
	return;
    } else if( (polygon.type === "polyline") && (points.length <= 2) ){
	return;
    }
    pt = obj.polyparams.point;
    // delete to stop an executing movePoint callback
    delete obj.polyparams.point;
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
    let i, a;
    let pos = {};
    const canvas = dlayer.canvas;
    const movePoint = (obj) => {
	const anchor = obj.target;
	const poly = anchor.polyparams.polygon;
	const pt = anchor.polyparams.point;
	const points = poly.get('points');
	const im = dlayer.display.image;
	// if pt was deleted, stop the callback
	if( pt === undefined ){
	    return;
	}
	// if the region is not changeable, just return
	if( poly.params.changeable === false ){
	    return;
	}
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
	    im.listRegions(poly, {mode: 2});
	}
	// redraw
	canvas.renderAll();
    };
    const moveAnchors = (obj) => {
	let ii;
	let tpos = {};
	// change anchor positions
	for(ii=0; ii<obj.params.anchors.length; ii++){
	    tpos.x = obj.left + obj.points[ii].x * obj.scaleX;
	    tpos.y = obj.top  + obj.points[ii].y * obj.scaleY;
	    if( obj.angle ){
		// anchor is rotated onto the vertex
		// (easier than taking rotation out of each vertex)
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
    // sanity check: don't add if polygon is not changeable
    if( obj.params.changeable === false ){
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
	    width: JS9.Fabric.opts.cornerSize + 2,
	    height: JS9.Fabric.opts.cornerSize + 2,
	    padding: 2
	});
	// add resize func on move
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
    obj.on("moving", () => {
	moveAnchors(obj);
    });
    obj.on("rotating", () => {
	moveAnchors(obj);
    });
    obj.on("scaling", () => {
	moveAnchors(obj);
    });
    obj.setCoords();
};

// remove anchors from a polygon
// don't need to call using image context
JS9.Fabric.removePolygonAnchors = function(dlayer, shape){
    let i;
    const canvas = dlayer.canvas;
    if( shape && shape.params && shape.params.anchors ){
	if( shape.params.changeable === false ){
	    return;
	}
	// remove all anchors
	for(i=0; i<shape.params.anchors.length; i++){
	    canvas.remove(shape.params.anchors[i]);
	}
	delete shape.params.anchors;
    }
};

// update child regions
// don't need to call using image context
JS9.Fabric.updateChildren = function(dlayer, shape, type){
    let i, p, x, child, nangle, npos, pangle;
    // region layer only, for now
    if( dlayer.layerName !== "regions" ){
	return;
    }
    // re-init objects within for parents and children
    if( type === "objects" ){
	x = {};
	// first get a list of parents and children
	dlayer.canvas.getObjects().forEach( (o) => {
	    if( o.params ){
		if( o.params.parent || o.params.children.length ){
		    x[o.params.id] = o;
		}
	    }
	});
	// then re-assign obj pointers to parents and children
	dlayer.canvas.getObjects().forEach( (o) => {
	    if( o.params ){
		if( o.params.parent ){
		    o.params.parent.obj = x[o.params.parent.id];
		}
		for(i=0; i<o.params.children.length; i++){
		    o.params.children[i].obj = x[o.params.children[i].id];
		}
	    }
	});
	return;
    }
    // for the rest, we need top-level shapes (e.g., not polygon anchors)
    if( !shape || !shape.params ){
	return;
    }
    // handle update to parent deltas when a child shape changes
    if( type === "deltas" ){
	if( shape.params.parent ){
	    p = shape.params.parent;
	    p.dleft = p.obj.left - shape.left;
	    p.dtop = p.obj.top - shape.top;
	    p.moved = true;
	}
	return;
    }
    // update children after a parent region is modified
    for(i=0; i<shape.params.children.length; i++){
	child = shape.params.children[i].obj;
	p = child.params.parent;
	switch(type){
	case "moving":
	    child.left  = shape.left - p.dleft;
	    child.top   = shape.top - p.dtop;
	    break;
	case "rotating":
	    pangle = shape.angle;
	    while( pangle < 0 ){
		pangle += 360;
	    }
	    while( pangle >= 360 ){
		pangle -= 360;
	    }
	    nangle = pangle - p.lastangle;
	    npos = JS9.rotatePoint({x: child.left,y: child.top},
				   nangle,
				   {x: shape.left, y: shape.top});
	    child.left = npos.x;
	    child.top = npos.y;
	    p.dleft = shape.left - child.left;
	    p.dtop = shape.top - child.top;
	    child.angle = child.angle + nangle;
	    while( child.angle < 0 ){
		child.angle += 360;
	    }
	    while( child.angle >= 360 ){
		child.angle -= 360;
	    }
	    p.lastangle = pangle;
	    break;
	case "scaling":
	    p.dleft = p.dleft * (shape.scaleX / p.lastscalex);
	    p.dtop = (p.dtop - p.textheight) *
		(shape.scaleY / p.lastscaley) + p.textheight;
	    p.lastscalex = shape.scaleX;
	    p.lastscaley = shape.scaleY;
	    p.moved = true;
	    child.left  = shape.left - p.dleft;
	    child.top   = shape.top - p.dtop;
	    break;
	}
	child.setCoords();
	if( dlayer.display.image ){
	    dlayer.display.image.updateShapes(dlayer.layerName, child,
					      "updatechild");
	}
    }
};

// reset center of a polygon
// don't need to call using image context
JS9.resetPolygonCenter = function(poly){
    let i, ndx, ndy, dobj, calcDim, dx, dy;
    let tpos = {};
    // deltas to center
    if( fabric.major_version === 1 ){
	// fabric v1.x: results are stored in poly itself
	poly._calcDimensions();
	dx = (poly.minX + (poly.width  / 2)) * poly.scaleX;
	dy = (poly.minY + (poly.height / 2)) * poly.scaleY;
    } else {
	// fabric 2.x: results returned in a separate object
	dobj = poly._calcDimensions();
	dx = (dobj.left + (dobj.width  / 2)) * poly.scaleX;
	dy = (dobj.top  + (dobj.height / 2)) * poly.scaleY;
    }
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
    if( fabric.major_version > 1 || fabric.minor_version >= 5 ){
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
    // reset control box
    if( fabric.major_version > 1 ){
	// https://stackoverflow.com/questions/55025481/fabric-js-adjusting-the-size-of-the-controls-of-a-modified-polygon-v1-7-22-vs
	calcDim = poly._calcDimensions();
	poly.width = calcDim.width;
	poly.height = calcDim.height;
	poly.pathOffset = {
            x: calcDim.left + poly.width / 2,
            y: calcDim.top + poly.height / 2
	};
    }
    // new coordinates
    poly.setCoords();
};

// Print support
// call using image context
JS9.Fabric.print = function(opts){
    let html, key, win, dataURL, divstr, pinst, layer, initialURL;
    let yoff = 0;
    let xoff = 0;
    const divtmpl = "<div style='position:absolute; left:%spx; top:%spx'>";
    const winopts = sprintf("width=%s,height=%s,menubar=1,toolbar=1,status=0,scrollbars=1,resizable=1", this.display.canvasjq.attr("width"), this.display.canvasjq.attr("height"));
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse print opts: ${opts}`, e); }
    }
    // get the main image as a dataURL
    dataURL = this.display.canvas.toDataURL("image/png");
    // start the web page string
    html = "<html><body style='padding: 0px; margin: 0px' onload='window.print(); return false'>";
    // initial div to hold image
    divstr = sprintf(divtmpl, xoff, yoff);
    // add the image
    html += `${divstr}<img src='${dataURL}'></div>`;
    // add layers
    for( key in this.layers ){
	if( this.layers.hasOwnProperty(key) ){
	    layer = this.layers[key];
	    // output (showing) layers attached to the main display
	    if( layer.dlayer.dtype === "main" && layer.show ){
		html += `${divstr}${layer.dlayer.canvas.toSVG()}</div>`;
	    }
	}
    }
    // add colorbar, if necessary
    if( (opts.colorbar === undefined) || opts.colorbar ){
	pinst = this.display.pluginInstances.JS9Colorbar;
	if( pinst && pinst.isActive() ){
	    // separate from main display
	    yoff += 2;
	    // colorbar canvas
	    dataURL = pinst.colorbarjq[0].toDataURL("image/png");
	    yoff += this.display.height;
	    divstr = sprintf(divtmpl, xoff, yoff);
	    html += `${divstr}<img src='${dataURL}'></div>`;
	    if( pinst.textjq && pinst.textjq[0] ){
		// colorbar text/tickmarks canvas
		dataURL = pinst.textjq[0].toDataURL("image/png");
		yoff += pinst.colorbarjq.height() + 1;
		divstr = sprintf(divtmpl, xoff, yoff);
		// need to rescale the text ... argh!!!
		html += `${divstr}<img style='width:${this.display.width}px;'src='${dataURL}'></div>`;
	    }
	}
    }
    // finish up
    html += "</body></html>";
    // are we in Electron?
    // https://github.com/electron/electron/issues/2288
    if( window.isElectron ){
	initialURL = "data:text/html,<html><body><script>window.addEventListener('message', (ev) => {document.documentElement.innerHTML=ev.data; window.setTimeout(() => {window.print()}, 250);},false)</script><p>waiting for image ...</body></html>";
    }
    // make a new window containing the initial URL
    win = window.open(initialURL, this.id, winopts);
    if( !win ){
	JS9.error("could not create print window (check your pop-up blockers)");
	return;
    }
    // open DOM for writing
    if( win.document ){
        // open it (not strictly necessary but ...)
	win.document.open();
        // overwrite the doc with our html
	win.document.write(html);
        // must close!
	win.document.close();
    } else if( win.postMessage ){
	// send html to the window with which to reconfigure itself
	window.setTimeout(() => {
	    win.postMessage(html, "*");
	}, JS9.TIMEOUT);
    } else {
	JS9.error("no method available for drawing image into print window");
    }
};

// incorporate these graphics routines into JS9
JS9.Fabric.initGraphics = function(){
    let key;
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
    JS9.Image.prototype.activeShapeLayer = JS9.Fabric.activeShapeLayer;
    JS9.Image.prototype.displayShapeLayers = JS9.Fabric.displayShapeLayers;
    JS9.Image.prototype.toggleShapeLayers = JS9.Fabric.toggleShapeLayers;
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

/*
 * mouse/touch module (May 19, 2016)
 */

// create our namespace, and specify some meta-information and params
JS9.MouseTouch = {};
JS9.MouseTouch.CLASS = "JS9";       // class of plugin
JS9.MouseTouch.NAME = "MouseTouch"; // name of this plugin
JS9.MouseTouch.WIDTH =  512;	    // width of light window
JS9.MouseTouch.HEIGHT = 220;	    // height of light window
JS9.MouseTouch.BASE = JS9.MouseTouch.CLASS + JS9.MouseTouch.NAME;

JS9.MouseTouch.mouseText = [];
JS9.MouseTouch.mouseText[0] = "move mouse, no buttons pressed:";
JS9.MouseTouch.mouseText[1] = "move mouse, primary button pressed:";
JS9.MouseTouch.mouseText[2] = "move mouse, secondary button pressed:";

JS9.MouseTouch.touchText = [];
JS9.MouseTouch.touchText[0] = "touch move, with one finger:";
JS9.MouseTouch.touchText[1] = "touch move, with two fingers:";
JS9.MouseTouch.touchText[2] = "touch move, with three fingers:";

JS9.MouseTouch.textHTML="<div style='float: left'>%s</div>";

JS9.MouseTouch.actionHTML="<div style='float: left'><b>%s</b></div>";

// get an id based on the action
JS9.MouseTouch.actionid = function(cname, aname){
    return (`${cname}_${aname}`).replace(/[^A-Za-z0-9_]/g, "_");
};

// add to the text descriptions
JS9.MouseTouch.addText = function(container, text){
    let s, divjq;
    // create the html for this action
    s = sprintf(JS9.MouseTouch.textHTML, text);
    // add text html to the text container
    divjq = $("<div>")
	.addClass(`${JS9.MouseTouch.BASE}Text`)
	.html(s)
	.appendTo(container);
    return divjq;
};

// add to the sortable action list
JS9.MouseTouch.addAction = function(container, cname, aname){
    let s, id, divjq;
    id = JS9.MouseTouch.actionid(cname, aname);
    // create the html for this action
    s = sprintf(JS9.MouseTouch.actionHTML, aname);
    // add action html to the action container
    divjq = $("<div>")
	.addClass(`${JS9.MouseTouch.BASE}Action`)
	.attr("id", id)
	.html(s)
	.appendTo(container);
    return divjq;
};

// display value/position
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.isPinch = function(im, evt){
    let i, display, dist, pinc, pdec;
    const npinch = JS9.globalOpts.pinchWait;
    const pthresh = JS9.globalOpts.pinchThresh;
    // sanity check
    if( !im ){
	return -1;
    }
    display = im.display;
    if( !display.mousetouchZoom || (im.pos.touches.length !== 2) ){
	return -1;
    }
    switch(display.ispinch ){
    case -1:
    case 1:
	return display.ispinch;
    }
    dist = Math.sqrt(((im.pos.touches[0].x - im.pos.touches[1].x)  *
		      (im.pos.touches[0].x - im.pos.touches[1].x))  +
		     ((im.pos.touches[0].y - im.pos.touches[1].y)  *
		      (im.pos.touches[0].y - im.pos.touches[1].y)));
    if( !display.dist0 ){
	 display.dist0 = dist;
    }
    display.deltas.push(Math.floor(dist - display.dist0));
    if( display.deltas.length >= npinch ){
	for(i=1, pinc=0, pdec=0; i<npinch; i++){
	    if(  display.deltas[i] > display.deltas[i-1] ){
		pinc++;
	    } else if(  display.deltas[i] < display.deltas[i-1] ){
		pdec++;
	    }
	}
	if( (pinc >= pthresh) || (pdec >= pthresh) ){
	    display.ispinch = 1;
	} else {
	    display.ispinch = -1;
	}
	display.lastzoom = 0;
	return display.ispinch;
    }
    // not sure yet
    return 0;
};

// ---------------------------------------------------------------------
//
// MouseTouch.Actions: callbacks when on mouse or touch movement
//
// for mouse: no click, primary click, secondary click
// for touch: 1, 2, or 3 fingers down
//
// the mouseActions and touchActions arrays in JS9.globalOpts determine
// the initial mapping of mouse/touch configuration to callback, e.g.:
//
//  JS9.globalOpts.mouseActions = ["display value/position", "change contrast/bias", "pan the image"];
//
// You can add your own to the Actions object, with titles in mouseText ...
// They are transferred to the display object.
//
// ---------------------------------------------------------------------
JS9.MouseTouch.Actions = {};

// display value/position
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.Actions["display value/position"] = function(im, ipos, evt){
    // special key: do nothing
    if( JS9.specialKey(evt) ){
	return;
    }
    // display pixel and wcs values
    if( JS9.globalOpts.internalValPos && im && ipos ){
	if( (ipos.x > 0) && (ipos.y > 0) &&
	    (ipos.x < im.raw.width) && (ipos.y < im.raw.height) ){
	    im.valpos = im.updateValpos(ipos, true);
	}
    }
};

// change contrast/bias
JS9.MouseTouch.Actions["change contrast/bias"] = function(im, ipos, evt){
    let x, y, pos;
    const display = im.display;
    // skip contrast/bias change?
    if( !JS9.globalOpts.internalContrastBias || !im || !ipos ){
	return;
    }
    // make sure we moved the mouse a bit
    if( im.pos0 && im.pos ){
	if( ((Math.abs(im.pos0.x-im.pos.x) < JS9.NOMOVE)  &&
	     (Math.abs(im.pos0.y-im.pos.y) < JS9.NOMOVE)) ){
	    return;
	}
    }
    // inside a region or with special key: no contrast/bias
    if( im.clickInRegion || JS9.specialKey(evt) ){
	return;
    }
    // static RGB image: no contrast/bias
    if( im.rgbFile ){
	return;
    }
    // get canvas position
    pos = JS9.eventToDisplayPos(evt, im.posOffset);
    // contrast/bias change
    x = Math.floor(pos.x + 0.5);
    y = Math.floor(pos.y + 0.5);
    // values only from within display window?
    if( JS9.globalOpts.containContrastBias ){
	if( (x < 0) || (y < 0) ||
	    (x >= display.canvas.width) || (y >= display.canvas.height) ){
	    return;
	}
    }
    im.params.bias = x / display.canvas.width;
    im.params.contrast = y / display.canvas.height * 10.0;
    // work-around for FF bug, not fixed as of 8/8/2012
    // https://bugzilla.mozilla.org/show_bug.cgi?id=732621
    if( JS9.bugs.firefox_linux ){
	window.setTimeout(() => {
	    im.displayImage("scaled", {blendMode: false});
	}, 0);
    } else {
	im.displayImage("scaled", {blendMode: false});
    }
    // hack: delete filterRGBImage from stash to avoid restore during reproject
    // also added to setColormap routine, can't this be generalized?
    if( im.xeqstash && im.xeqstash.filterRGBImage ){
	delete im.xeqstash.filterRGBImage;
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	im.xeqPlugins("image", "onchangecontrastbias");
    }
};

// stop action for contrast/bias: redisplay image
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.Actions["change contrast/bias"].stop = function(im, ipos, evt){
    // if blendMode is on, we have to redisplay
    if( im.display.blendMode ){
	im.displayImage("rgb");
    }
};

// zoom the image
JS9.MouseTouch.Actions["wheel zoom"] = function(im, evt){
    let nzoom, display;
    const delta = evt.originalEvent.deltaY;
    // sanity checks
    if( !im ){
	return;
    }
    // is scroll to zoom turned on?
    display = im.display;
    if( !display.mousetouchZoom ){
	return;
    }
    // scroll by the delta
    if( delta > 0 ){
	nzoom = Math.min(JS9.MAXZOOM, im.getZoom() + JS9.ADDZOOM);
    } else {
	nzoom = Math.max(JS9.MINZOOM, im.getZoom() - JS9.ADDZOOM);
    }
    // a little rounding makes the zoom nicer
    nzoom = Math.round((nzoom + 0.00001) * 100) / 100;
    // zoom the image
    im.setZoom(nzoom);
};

// pan the image
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.Actions["pan the image"] = function(im, ipos, evt){
    let dx, dy, sect;
    // sanity check
    if( !im ){
	return;
    }
    sect = im.rgb.sect;
    // how much would we pan by?
    dx = ((im.pos0.x - im.pos.x) / sect.zoom);
    dy = ((im.pos0.y - im.pos.y) / sect.zoom);
    // pan the image (but avoid a redisplay, if we haven't moved much)
    if( Math.abs(dx) >= 1 || Math.abs(dy) >= 1 ){
	im.setPan(sect.xcen + dx, sect.ycen - dy);
	// reset initial position
	im.pos0 = im.pos;
    }
};

// pinch zoom
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.Actions.pinch = function(im, ipos, evt){
    let display, dist, nzoom;
    // sanity checks
    if( !im ){
	return;
    }
    // is scroll to zoom turned on?
    display = im.display;
    // get current distance
    dist = Math.sqrt(((im.pos.touches[0].x - im.pos.touches[1].x)  *
		      (im.pos.touches[0].x - im.pos.touches[1].x)) +
		      ((im.pos.touches[0].y - im.pos.touches[1].y)  *
		       (im.pos.touches[0].y - im.pos.touches[1].y)));
    nzoom = display.zoom0 * dist / display.dist0;
    // a little rounding makes the zoom nicer
    nzoom = Math.max(JS9.MINZOOM, Math.min(JS9.MAXZOOM, Math.round((nzoom + 0.00001) * 100) / 100));
    // zoom the image
    if( nzoom !== display.lastzoom ){
	im.setZoom(nzoom);
    }
    display.lastzoom = nzoom;
};

// start of mouse/touch action processing
JS9.MouseTouch.Actions.start = function(im, ipos, evt){
    let display, action;
    if( im ){
	display = im.display;
	display.ispinch = 0;
	display.dist0 = 0;
	display.zoom0 = im.rgb.sect.zoom;
	display.deltas = [];
    }
    action = JS9.MouseTouch.getAction(im, evt);
    // call the start mouse/touch action, if necessary
    if( JS9.MouseTouch.Actions[action] &&
	JS9.MouseTouch.Actions[action].start ){
	JS9.MouseTouch.Actions[action].start(im, im.ipos, evt);
    }
};

// end of mouse/touch action processing
JS9.MouseTouch.Actions.stop = function(im, ipos, evt){
    const action = JS9.MouseTouch.getAction(im, evt);
    // call the stop mouse/touch action, if necessary
    if( JS9.MouseTouch.Actions[action] &&
	JS9.MouseTouch.Actions[action].stop ){
	JS9.MouseTouch.Actions[action].stop(im, im.ipos, evt);
    }
    return;
};

// get action associated with the current clickState
JS9.MouseTouch.getAction = function(im, evt){
    let action, display;
    // sanity check
    if( !im ){
	return action;
    }
    display = im.display;
    switch(im.clickState){
	// mouse move actions
    case 0:
	action = display.mouseActions[0];
	break;
    case 1:
	action = display.mouseActions[1];
	break;
    case 2:
	action = display.mouseActions[2];
	break;
	// touch event actions
    case -1:
	action = display.touchActions[0];
	break;
    case -2:
	switch( JS9.MouseTouch.isPinch(im, evt) ){
	case -1:
	    action = display.touchActions[1];
	    break;
	case 0:
	    // do nothing, no idea if its a pinch yet
	    break;
	case 1:
	    action = "pinch";
	    break;
	}
	break;
    case -3:
	action = display.touchActions[2];
	break;
    default:
	break;
    }
    return action;
};

// execute the mouse/touch action routine
JS9.MouseTouch.action = function(im, evt, action){
    action = action || JS9.MouseTouch.getAction(im, evt);
    // call the mouse/touch action
    if( action && JS9.MouseTouch.Actions[action] ){
	JS9.MouseTouch.Actions[action](im, im.ipos, evt);
    }
};

// change zoom mode for this display
JS9.MouseTouch.mousetouchzoom = function(id, target){
    const display = JS9.lookupDisplay(id);
    const mode = target.checked;
    // change global blink mode
    if( display ){
	display.mousetouchZoom = mode;
    }
};

// constructor: add HTML elements to the plugin
JS9.MouseTouch.init = function(){
    let i, s;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id of the div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold action container and header
    // clean main container
    this.divjq.html("");
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.mousetouchContainer = $("<div>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchContainer`)
	.appendTo(this.divjq);
    s = sprintf("<div class='%s'><span><b>Drag an action to reconfigure JS9 mouse/touch events:</b></span><p>", `${JS9.MouseTouch.BASE}Header`);
    this.mousetouchHeadContainer = $("<span style='float: left'>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchHeadContainer`)
        .html(s)
	.appendTo(this.mousetouchContainer);
    this.mousetouchTextContainer = $("<span style='float: left'>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchTextContainer`)
	.appendTo(this.mousetouchContainer);
    this.mousetouchActionContainer = $("<span style='float: left'>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchActionContainer`)
	.appendTo(this.mousetouchContainer);
    if( JS9.TOUCHSUPPORTED ){
	// container to hold text descriptions
	this.mousetouchTouchTextContainer = $("<div>")
	    .addClass(`${JS9.MouseTouch.BASE}TextContainer`)
	    .attr("id", `${this.id}TouchTextContainer`)
            .html("")
	    .appendTo(this.mousetouchTextContainer);
	for(i=0; i<JS9.MouseTouch.touchText.length; i++){
            JS9.MouseTouch.addText.call(this,
					this.mousetouchTouchTextContainer,
					JS9.MouseTouch.touchText[i]);
	}
	for(i=JS9.MouseTouch.touchText.length;
	    i<this.display.touchActions.length ; i++){
            JS9.MouseTouch.addText.call(this,
					this.mousetouchMouseTextContainer,
					"&nbsp;");
	}
	// container to hold touch actions
	this.mousetouchTouchContainer = $("<div>")
	    .addClass(`${JS9.MouseTouch.BASE}ActionContainer`)
	    .attr("id", `${this.id}TouchContainer`)
            .html("")
	    .appendTo(this.mousetouchActionContainer);
	// add touch actions, if necessary
	for(i=0; i<this.display.touchActions.length; i++){
	    s = this.display.touchActions[i];
            JS9.MouseTouch.addAction.call(this, this.mousetouchTouchContainer,
					  "touch", s);
	}
	// the actions within the action container will be sortable
	this.mousetouchTouchContainer.sortable({
	    start: (event, ui) => {
		this.oidx = ui.item.index();
	    },
	    stop: (event, ui) => {
		const nidx = ui.item.index();
		const oarr = this.display.touchActions.splice(this.oidx, 1)[0];
		// JS9 action list reflects the sort
		this.display.touchActions.splice(nidx, 0, oarr);
		delete this.oidx;
	    }
	});
    }
    if(  !/iPad|iPhone|iPod/.test(navigator.platform) ){
	// container to hold text descriptions
	this.mousetouchMouseTextContainer = $("<div>")
	    .addClass(`${JS9.MouseTouch.BASE}TextContainer`)
	    .attr("id", `${this.id}MouseTextContainer`)
	    .appendTo(this.mousetouchTextContainer);
	for(i=0; i< 3; i++){
            JS9.MouseTouch.addText.call(this,
					this.mousetouchMouseTextContainer,
					JS9.MouseTouch.mouseText[i]);
	}
	for(i=3; i<this.display.mouseActions.length ; i++){
            JS9.MouseTouch.addText.call(this,
					this.mousetouchMouseTextContainer,
					"&nbsp;");
	}
	// container to hold mouse actions
	this.mousetouchMouseContainer = $("<div>")
	    .addClass(`${JS9.MouseTouch.BASE}ActionContainer`)
	    .attr("id", `${this.id}MouseContainer`)
            .html("")
	    .appendTo(this.mousetouchActionContainer);
	// add mouse actions, if necessary
	for(i=0; i<this.display.mouseActions.length; i++){
	    s = this.display.mouseActions[i];
            JS9.MouseTouch.addAction.call(this, this.mousetouchMouseContainer,
					  "mouse", s);
	}
	// the actions within the action container will be sortable
	this.mousetouchMouseContainer.sortable({
	    start: (event, ui) => {
		this.oidx = ui.item.index();
	    },
	    stop: (event, ui) => {
		const nidx = ui.item.index();
		const oarr = this.display.mouseActions.splice(this.oidx, 1)[0];
		// JS9 action list reflects the sort
		this.display.mouseActions.splice(nidx, 0, oarr);
		delete this.oidx;
	    }
	});
    }
    // add the footer, containing buttons
    s = sprintf("<p><div class='%s'>use mouse wheel or pinch to zoom:&nbsp;&nbsp;<input type='checkbox' value='1' onclick='javascript:JS9.MouseTouch.mousetouchzoom(\"%s\", this);'></div>", `${JS9.MouseTouch.BASE}Footer`, this.display.id);
    this.mousetouchFootContainer = $("<span style='float: left'>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchFootContainer`)
        .html(s)
	.appendTo(this.mousetouchContainer);
    // set initial value of scroll
    if( this.display.mousetouchZoom ){
	this.mousetouchContainer.find("input").attr("checked", true);
    }
};


// ---------------------------------------------------------------------
// Regions object defines high level calls for Regions plugin
// ---------------------------------------------------------------------

JS9.Regions = {};
JS9.Regions.CLASS = "JS9";
JS9.Regions.NAME = "Regions";

// defaults for new regions
JS9.Regions.opts = {
    // update WCS strings
    updateWCS: true,
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
    // should overlapping shapes be sorted (smallest on top)?
    sortOverlapping: true,
    // title for region config dialog box
    title: "Region Configuration",
    // colors for tags
    // these should be ordered from more specific to less specific
    tagcolors: {
	include_source:     "#00FF00",
	exclude_source:     "#FF0000",
	include_background: "#FFD700",
	exclude_background: "#FF8C00",
	source:             "#00FF00",
	background:         "#FFD700",
	defcolor:           "#00FF00"
    },
    // mouse down processing
    onmousedown(im, xreg, evt, target) {
	let curtime, dblclick, poly;
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
	    if( !target.params.winid && target.params.changeable !== false ){
		JS9.Regions.displayConfigForm.call(im, target);
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
						   target);
		JS9.Fabric._updateShape.call(im, poly.params.layerName,
					     poly, null, "update");
	    }
	}
    },
    // mouse up processing
    onmouseup() {
	let i;
	let objs = [];
	// one active object
	if( this.getActiveObject() ){
	    objs.push(this.getActiveObject());
	}
	if( fabric.major_version === 1 ){
	    // group of active objects
	    if( this.getActiveGroup() ){
		objs = this.getActiveGroup().getObjects();
	    }
	} else {
	    objs.push(this.getActiveObjects());
	}
	// re-select polygon which was just processed
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
    let dlayer;
    // get layer name
    layerName = layerName || "regions";
    // add to image prototypes
    JS9.Image.prototype.parseRegions = JS9.Regions.parseRegions;
    JS9.Image.prototype.saveRegions = JS9.Regions.saveRegions;
    JS9.Image.prototype.listRegions = JS9.Regions.listRegions;
    JS9.Image.prototype.copyRegions = JS9.Regions.copyRegions;
    JS9.Image.prototype.editRegionTags = JS9.Regions.editRegionTags;
    JS9.Image.prototype.toggleRegionTags = JS9.Regions.toggleRegionTags;
    JS9.Image.prototype.unremoveRegions = JS9.Regions.unremoveRegions;
    // init the display shape layer
    dlayer = this.display.newShapeLayer(layerName, JS9.Regions.opts);
    // mouse up: list regions, if necessary
    dlayer.canvas.on("mouse:up", () => {
	let i, tim;
	let objs = [];
	if( dlayer.display.image ){
	    tim = dlayer.display.image;
	    // one active object
	    // group of active objects
	    if( fabric.major_version === 1 ){
		if( dlayer.canvas.getActiveObject() ){
		    objs.push(dlayer.canvas.getActiveObject());
		}
		if( dlayer.canvas.getActiveGroup() ){
		    objs = dlayer.canvas.getActiveGroup().getObjects();
		}
	    } else {
		objs.push(dlayer.canvas.getActiveObjects());
	    }
	    // process all active objects
	    for(i=0; i<objs.length; i++){
		if( objs[i].params ){
		    if( tim.params.listonchange ){
			if( tim.params.whichonchange === "all" ){
			    tim.listRegions("all", {mode: 2});
			} else {
			    tim.listRegions("selected", {mode: 2});
			}
		    } else if( objs[i].params.listonchange ){
			tim.listRegions("selected", {mode: 2});
		    }
		    break;
		}
	    }
	}
    });
    return this;
};

// display the region config form
JS9.Regions.displayConfigForm = function(shape){
    let s;
    const im = this;
    const title = JS9.Regions.opts.title;
    // sanity check
    if( !shape ){
	return;
    }
    // call this once window is loaded
    $("#dhtmlwindowholder")
	.arrive("#regionsConfigForm", {onceOnly: true}, () => {
	    if( shape.pub ){
		JS9.Regions.initConfigForm.call(im, shape);
	    }
	});
    if( JS9.allinone ){
	s = JS9.allinone.regionsConfigHTML;
	shape.params.winid = im.displayAnalysis("regions", s, {title});
    } else {
	s = JS9.InstallDir(JS9.Regions.opts.configURL);
	shape.params.winid = im.displayAnalysis("regions", s, {title});
    }
};

// initialize the region config form
// call using image context
JS9.Regions.initConfigForm = function(obj){
    let i, s, key, val, el, wcssys, altwcssys, ra, dec, mover, mout;
    const params = obj.params;
    const winid = params.winid;
    const wid = $(winid).attr("id");
    const form = `#${wid} #regionsConfigForm `;
    const fmt= (val) => {
	if( val === undefined ){
	    return undefined;
	}
	if( (typeof val === "number") && (val % 1 !== 0) ){
	    val = Math.round((val + 0.00001) * 10000) / 10000;
	}
	return(String(val));
    };
    const replaceNewline = (s) => {
	let t;
	s = s || "";
	t = s.replace(/\n/g, "\\n");
	return t;
    };
    // get alternate wcssys, if necessary
    altwcssys = $(form).data("wcssys");
    // remove the nodisplay class from shape's div
    $(`${form}.${obj.pub.shape}`).each((index, element) => {
	$(element).removeClass("nodisplay");
    });
    // fill in the values from the shape object
    $(`${form}.val`).each((index, element) => {
	val = "";
	key = $(element).attr("name");
	// key-specific pre-processing
	switch(key){
	case "x":
	case "y":
	    if( obj.pub.lcs      !== undefined &&
		obj.pub.lcs[key] !== undefined ){
		val = fmt(obj.pub.lcs[key]);
	    } else if( obj.pub[key] !== undefined ){
		val = fmt(obj.pub[key]);
	    }
	    break;
	case "radii":
	    if( obj.pub.radii ){
		if( this.params.wcssys === "image"    ||
		    this.params.wcssys === "physical" ||
		    !obj.pub.wcsstr                   ){
		    val = obj.pub.imstr
			.replace(/^annulus\(/,"").replace(/\)$/,"")
			.split(",").slice(2).join(",");
		} else {
		    val = obj.pub.wcsstr
			.replace(/^annulus\(/,"").replace(/\)$/,"")
			.split(",").slice(2).join(",");
		}
	    }
	    break;
	case "pts":
	    if( obj.pub.pts ){
		obj.pub.pts.forEach( (p) => {
		    if( val ){
			val += ", ";
		    }
		    val += `${p.x.toFixed(2)}, ${p.y.toFixed(2)}`;
		});
	    } else {
		// use the flat points list instead of the pts object array
		if( obj.pub.imstr ){
		    val = obj.pub.imstr.replace(/^.*\(/, "").replace(/\)$/, "");
		}
	    }
	    break;
	case "fontFamily":
	    if( obj.getFontFamily ){
		val = obj.getFontFamily();
	    }
	    break;
	case "fontSize":
	    if( obj.getFontSize ){
		val = obj.getFontSize();
	    }
	    break;
	case "fontStyle":
	    if( obj.getFontStyle ){
		val = obj.getFontStyle();
	    }
	    break;
	case "fontWeight":
	    if( obj.getFontWeight ){
		val = obj.getFontWeight();
	    }
	    break;
	case "strokeWidth":
	    val = obj.params.sw1;
	    break;
	case "strokeDashes":
	    if( obj.strokeDashArray ){
		val = obj.strokeDashArray.join(" ");
		if( val.match(/NaN/) ){
		    val = "";
		}
	    } else {
		val = "";
	    }
	    break;
	case "regstr":
	    if( this.params.wcssys === "image"    ||
		this.params.wcssys === "physical" ||
		!obj.pub.wcsstr                    ){
		val = `${obj.pub.imsys}; ${obj.pub.imstr}`;
	    } else {
		val = `${obj.pub.wcssys}; ${obj.pub.wcsstr}`;
	    }
	    break;
	case "xpos":
	    switch(this.params.wcssys){
	    case 'image':
		val = sprintf('%.1f', obj.pub.x);
		break;
	    case 'physical':
		if( obj.pub.lcs ){
		    val = sprintf('%.1f', obj.pub.lcs.x);
		} else {
		    val = sprintf('%.1f', obj.pub.x);
		}
		break;
	    default:
		if( obj.pub.ra !== undefined ){
		    val = sprintf('%.6f', obj.pub.ra);
		} else {
		    val = sprintf('%.1f', obj.pub.x);
		}
		break;
	    }
	    // save for later processing
	    ra = val;
	    break;
	case "ypos":
	    switch(this.params.wcssys){
	    case 'image':
		val = sprintf('%.1f', obj.pub.y);
		break;
	    case 'physical':
		if( obj.pub.lcs ){
		    val = sprintf('%.1f', obj.pub.lcs.y);
		} else {
		    val = sprintf('%.1f', obj.pub.y);
		}
		break;
	    default:
		if( obj.pub.dec !== undefined ){
		    val = sprintf('%.6f', obj.pub.dec);
		} else {
		    val = sprintf('%.1f', obj.pub.y);
		}
		break;
	    }
	    // save for later processing
	    dec = val;
	    break;
	case "radius":
	case "oradius":
	case "length":
	case "width":
	case "r1":
	    switch(this.params.wcssys){
	    case 'image':
		if( obj.pub[key] !== undefined ){
		    val = fmt(obj.pub[key]);
		}
		break;
	    case 'physical':
		if( obj.pub.lcs[key] !== undefined ){
		    val = fmt(obj.pub.lcs[key]);
		}
		break;
	    default:
		if( obj.pub.wcssizestr ){
		    val = fmt(obj.pub.wcssizestr[0]);
		} else {
		    val = fmt(obj.pub[key]);
		}
		break;
	    }
	    break;
	case "height":
	case "r2":
	    switch(this.params.wcssys){
	    case 'image':
		if( obj.pub[key] !== undefined ){
		    val = fmt(obj.pub[key]);
		}
		break;
	    case 'physical':
		if( obj.pub.lcs[key] !== undefined ){
		    val = fmt(obj.pub.lcs[key]);
		}
		break;
	    default:
		if( obj.pub.wcssizestr ){
		    val = fmt(obj.pub.wcssizestr[1]);
		} else {
		    val = fmt(obj.pub[key]);
		}
		break;
	    }
	    break;
	case "wcssys":
	    // add all wcs sys options
	    el = $(form).find(`[name='${key}']`);
	    if( !el.find('option').length ){
		for(i=0; i<JS9.wcssyss.length; i++){
		    wcssys = JS9.wcssyss[i];
		    el.append(`<option>${wcssys}</option>`);
		}
	    }
	    el.find('option').each((index, element) => {
		if( this.params.wcssys === element.value ){
		    val = element.value;
		}
	    });
	    break;
	case "altwcssys":
	    // add all wcs sys options
	    el = $(form).find(`[name='${key}']`);
	    if( !el.find('option').length ){
		for(i=0; i<JS9.wcssyss.length; i++){
		    wcssys = JS9.wcssyss[i];
		    if( (wcssys === "image") || (wcssys === "physical") ){
			continue;
		    }
		    el.append(`<option>${wcssys}</option>`);
		}
	    }
	    val = $(form).data("wcssys");
	    if( !val ){
		el.find('option').each((index, element) => {
		    if( this.params.wcssys === element.value ){
			val = element.value;
		    }
		});
	    }
	    break;
	case "wcsunits":
	    if( obj.pub.wcsunits ){
		val = obj.pub.wcsunits;
	    }
	    break;
	case "childtext":
	    if( obj.params.children.length > 0 ){
		val = replaceNewline(obj.params.children[0].obj.text);
	    }
	    break;
	case "text":
	    if( obj.pub[key] !== undefined ){
		val = replaceNewline(fmt(obj.pub[key]));
	    }
	    break;
	case "id":
	    val = obj.pub.id;
	    break;
	default:
	    if( obj.pub[key] !== undefined ){
		val = fmt(obj.pub[key]);
	    }
	    break;
	}
	$(element).val(val);
    });
    if( !this.raw.wcs || this.raw.wcs < 0 ){
	$(form).find("[name='wcssys']").hide();
    }
    if( (this.params.wcssys === "image")    ||
	(this.params.wcssys === "physical") ||
	(!this.raw.wcs || this.raw.wcs<0)   ){
	$(form).find("[name='altwcssys']").hide();
    } else {
	$(form).find("[name='altwcssys']").show();
	// process altwcs, if necessary
	if( altwcssys && (this.params.wcssys !== altwcssys) ){
	    s = this.wcs2wcs(null, altwcssys, ra, dec).split(/\s+/);
	    $(form).find("[name='xpos']").val(s[0]);
	    $(form).find("[name='ypos']").val(s[1]);
	}
    }
    // edit-able parameters
    // $(form + ".edit").removeClass("nodisplay");
    // child text display for shapes, editable if no existing children yet
    if( obj.type !== "text" ){
	$(`${form}.childtext`).removeClass("nodisplay");
	$(`${form}[name='childtext']`)
	    .prop("readonly", params.children.length > 0);
    }
    // checkboxes
    if( params.listonchange === undefined ){
	params.listonchange = false;
    }
    if( params.listonchange ){
	$(`${form}[name='listonchange']`).prop("checked", true);
    } else {
	$(`${form}[name='listonchange']`).prop("checked", false);
    }
    if( (params.changeable === undefined)  &&
	(params.fixinplace !== undefined)  ){
	params.changeable = !params.fixinplace;
    }
    if( params.changeable === undefined ){
	params.changeable = true;
    }
    if( params.changeable ){
	$(`${form}[name='changeable']`).prop("checked", true);
    } else {
	$(`${form}[name='changeable']`).prop("checked", false);
    }
    // grey-out read-only text
    $(form).find('input:text[readonly]')
	.css("border-color", "A5A5A5")
	.css("background", "#E9E9E9");
    // shape specific processing
    switch(obj.pub.shape){
    case "box":
    case "ellipse":
	$(`${form}.angle`).removeClass("nodisplay");
	break;
    case "text":
	$(`${form}.textangle`).removeClass("nodisplay");
	break;
    }
    // save the image for later processing
    $(form).data("im", this);
    // save the shape object for later processing
    $(form).data("shape", obj);
    // save the window id for later processing
    $(form).data("winid", winid);
    // add tooltip callbacks (not mobile: ios buttons stop working!)
    if( !$(form).data("tooltipInit") ){
	$(form).data("tooltipInit", true);
	if( JS9.BROWSER[3] ){
	    mover = "touchstart";
	    mout = "touchend";
	} else {
	    mover = "mouseover";
	    mout = "mouseout";
	}
	$(".col_R").on(mover, (e) => {
	    let title;
	    const target = e.currentTarget;
	    const tooltip = $(target).find("input").data("tooltip");
	    const el = $(target).closest(".dhtmlwindow").find(".drag-handle");
	    if( tooltip && el.length ){
		// change title: see dhtmlwindow.js load() @line 130
		title = `${JS9.Regions.opts.title}: ${tooltip}`;
		$(el)[0].childNodes[0].nodeValue = title;
	    }
	});
	$(".col_R").on(mout, (e) => {
	    const target = e.currentTarget;
	    const el = $(target).closest(".dhtmlwindow").find(".drag-handle");
	    if( el.length ){
		$(el)[0].childNodes[0].nodeValue = JS9.Regions.opts.title;
	    }
	});
    }
};

// process the config form to change the specified shape
// call using image context
JS9.Regions.processConfigForm = function(form, obj, winid, arr){
    let i, s, key, nkey, val, nval, nopts, altwcssys;
    let bin = 1;
    const alen = arr.length;
    const opts = {};
    const wcsinfo = this.raw.wcsinfo || {cdelt1: 1, cdelt2: 1};
    const fmt= (val) => {
	if( val === undefined ){
	    return undefined;
	}
	if( (typeof val === "number") && (val % 1 !== 0) ){
	    val = Math.round((val + 0.00001) * 10000) / 10000;
	}
	return(String(val));
    };
    const fmtcheck= (val1, val2) => {
	if( val1 === undefined ){
	    return false;
	}
	return fmt(val1) !== fmt(val2);
    };
    const newval = (obj, key, val) => {
	// special keys having no public or param equivalents
	if( key === "remove" ){
	    return val === "selected";
	}
	if( key === "childtext" ){
	    if( obj.params.children.length > 0 ){
		return false;
	    }
	    return val !== "";
	}
	if( key === "strokeDashes" ){
	    return JSON.stringify(obj.strokeDashArray) !== JSON.stringify(val);
	}
	if( (key !== "tags") && (val === "") ){
	    return false;
	}
	if( (key === "misc") && (val !== "") ){
	    return true;
	}
	if( (key === "angle") ){
	    return obj.angle !== -parseFloat(val);
	}
	if( (key === "ix") ){
	    return fmtcheck(obj.pub.x, JS9.saostrtod(val));
	}
	if( (key === "iy") ){
	    return fmtcheck(obj.pub.y, JS9.saostrtod(val));
	}
	if( (key === "px") ){
	    return fmtcheck(obj.pub.lcs.x, JS9.saostrtod(val));
	}
	if( (key === "py") ){
	    return fmtcheck(obj.pub.lcs.y, JS9.saostrtod(val));
	}
	if( (key === "ra") ){
	    return fmtcheck(JS9.saostrtod(obj.pub.wcsposstr[0]),
			    JS9.saostrtod(val));
	}
	if( (key === "dec") ){
	    return fmtcheck(JS9.saostrtod(obj.pub.wcsposstr[1]),
			    JS9.saostrtod(val));
	}
	if( obj.pub.lcs[key] !== undefined ){
	    if( fmtcheck(obj.pub.lcs[key], val) ){
		return true;
	    }
	    // don't look further or we end up checking image x, y
	    return false;
	}
	if( fmtcheck(obj.pub[key], val) ){
	    return true;
	}
	if( fmtcheck(obj.params[key], val) ){
	    return true;
	}
	if( fmtcheck(obj[key], val) ){
	    return true;
	}
	return false;
    };
    const getval = (s) => {
	if( s === "true" ){
	    return true;
	}
	if( s === "false" ){
	    return false;
	}
	if( !JS9.isNumber(s) ){
	    return s;
	}
	return parseFloat(s);
    };
    const replaceNewline = (s) => {
	let t;
	const nl = String.fromCharCode(13, 10);
	s = s || "";
	t = s.replace(/\\n/g, nl);
	return t;
    };
    // set physical to image conversion, if possible
    if( this.lcs && this.lcs.physical ){
	bin = this.lcs.physical.forward[0][0] || 1;
    }
    // process array of keyword/values
    for(i=0; i<alen; i++){
	key = arr[i].name;
	val = arr[i].value;
	// pos keys have to be converted to correct type of position
	if( key === "xpos" || key === "ypos" ){
	    switch(this.params.wcssys){
	    case 'image':
		key = `i${key.charAt(0)}`;
		break;
	    case 'physical':
		key = `p${key.charAt(0)}`;
		break;
	    default:
		if( this.raw.wcs && this.raw.wcs > 0 ){
		    if( key === "xpos" ){
			key = "ra";
		    } else {
			key = "dec";
		    }
		} else {
		    if( key === "xpos" ){
			key = "ix";
		    } else {
			key = "iy";
		    }
		}
		break;
	    }
	}
	switch(key){
	case "text":
	    if( obj.type === "text" ){
		if( newval(obj, key, val) ){
		    opts[key] = replaceNewline(getval(val));
		}
	    }
	    break;
	case "strokeDashes":
	    nval = val.trim().split(/\s+/);
	    if( newval(obj, key, nval) ){
		if( nval.length === 0 ){
		    opts.strokeDashArray = [];
		} else {
		    opts.strokeDashArray = nval.map( s => parseInt(s, 10) );
		}
	    }
	    break;
	case "childtext":
	    if( obj.type !== "text" ){
		if( newval(obj, key, val) ){
		    opts.text = replaceNewline(getval(val));
		}
	    }
	    break;
	case "ix":
	    if( newval(obj, key, val) ){
		opts.x = getval(val);
		if( opts.y === undefined ){
		    opts.y = obj.pub.y;
		}
	    }
	    break;
	case "iy":
	    if( newval(obj, key, val) ){
		opts.y = getval(val);
		if( opts.x === undefined ){
		    opts.x = obj.pub.x;
		}
	    }
	    break;
	case "px":
	    if( newval(obj, key, val) ){
		opts.px = getval(val);
		if( opts.py === undefined ){
		    opts.py = obj.pub.lcs.y;
		}
	    }
	    break;
	case "py":
	    if( newval(obj, key, val) ){
		opts.py = getval(val);
		if( opts.px === undefined ){
		    opts.px = obj.pub.lcs.x;
		}
	    }
	    break;
	case "ra":
	    if( newval(obj, key, val) ){
		opts.ra = val;
		if( opts.dec === undefined ){
		    opts.dec = obj.pub.wcsposstr[1];
		}
	    }
	    break;
	case "dec":
	    if( newval(obj, key, val) ){
		opts.dec = val;
		if( opts.ra === undefined ){
		    opts.ra = obj.pub.wcsposstr[0];
		}
	    }
	    break;
	case "wcssys":
	    break;
	case "radius":
	case "length":
	case "width":
	case "r1":
	    switch(this.params.wcssys){
	    case 'image':
		if( newval(obj, key, val) ){
		    opts[key] = getval(val);
		}
		break;
	    case 'physical':
		if( newval(obj, key, val) ){
		    opts[key] = getval(val) * bin;
		}
		break;
	    default:
		nval = JS9.strtoscaled(val);
		if( nval.dtype === "." ){
		    val = nval.dval;
		} else {
		    val = Math.abs(nval.dval / wcsinfo.cdelt1);
		}
		nkey = key.replace("wcs", "");
		if( newval(obj, nkey, val) ){
		    opts[nkey] = getval(val);
		}
		break;
	    }
	    break;
	case "height":
	case "r2":
	    switch(this.params.wcssys){
	    case 'image':
		if( newval(obj, key, val) ){
		    opts[key] = getval(val);
		}
		break;
	    case 'physical':
		if( newval(obj, key, val) ){
		    opts[key] = getval(val) * bin;
		}
		break;
	    default:
		nval = JS9.strtoscaled(val);
		if( nval.dtype === "." ){
		    val = nval.dval;
		} else {
		    val = Math.abs(nval.dval / wcsinfo.cdelt2);
		}
		nkey = key.replace("wcs", "");
		if( newval(obj, nkey, val) ){
		    opts[nkey] = getval(val);
		}
		break;
	    }
	    break;
	case "remove":
	    if( newval(obj, key, val) ){
		opts[key] = obj.pub.id;
	    }
	    break;
	case "misc":
	    if( val.trim() ){
		try{ nopts = JSON.parse(val); $.extend(opts, nopts); }
		catch(e){ JS9.error(`invalid json: ${val}`);}
	    }
	    break;
	default:
	    if( newval(obj, key, val) ){
		opts[key] = getval(val);
	    }
	    break;
	}
    }
    if( opts.ra && opts.dec ){
	// get alternate wcssys, if necessary
	altwcssys = $(form).data("wcssys");
	// process altwcs, if necessary
	if( altwcssys && (this.params.wcssys !== altwcssys) ){
	    s = this.wcs2wcs(altwcssys, null, opts.ra, opts.dec)
		.split(/\s+/);
	    opts.ra = s[0];
	    opts.dec = s[1];
	}
    }
    // change the shape
    this.changeShapes(obj.pub.layer, obj, opts);
    JS9.Regions.initConfigForm.call(this, obj, winid);
};

// paste a region from clipboard
// call using image context
JS9.Regions.pasteFromClipboard = function(curpos){
    let i, s, nobj, xpos, ypos, oval;
    let objs = [];
    let xcen = 0, ycen = 0;
    const rregexp = /(annulus|box|circle|ellipse|line|polygon|point|text) *\(/;
    // sanity check
    if( !this ){ return; }
    // get string from clipboard
    s = JS9.CopyFromClipboard().trim();
    // see if we have anything at all
    if( !s ){
	JS9.error(JS9.CLIPBOARDERROR);
    }
    // see if we have region(s)
    if( s.match(rregexp) ){
	// we don't update the clipboard for these operations
	oval = JS9.globalOpts.regionsToClipboard;
	JS9.globalOpts.regionsToClipboard = false;
	// add regions (don't update clipboard)
	objs = this.addShapes("regions", s, {rtn: "objs"});
	// place regions in the position specified by the mouse, if necessary
	if( curpos ){
	    // number of regions
	    nobj = objs.length;
	    // get centroid
	    for(i=0; i<nobj; i++){
		xcen += objs[i].pub.x;
		ycen += objs[i].pub.y;
	    }
	    xcen /= nobj;
	    ycen /= nobj;
	    // move to current position specified by mouse
	    for(i=0; i<nobj; i++){
		xpos = objs[i].pub.x - xcen + this.ipos.x;
		ypos = objs[i].pub.y - ycen + this.ipos.y;
		this.changeShapes("regions", objs[i].pub.id, {x: xpos, y:ypos});
	    }
	}
	JS9.globalOpts.regionsToClipboard = oval;
    } else {
	JS9.error(JS9.CLIPBOARDERROR2);
    }
    return s;
};

// ---------------------------------------------------------------------------
// Regions prototype additions to JS9 Image class
// ---------------------------------------------------------------------------

// list one or more regions
JS9.Regions.listRegions = function(which, opts, layer){
    let i, region, rlen, key, obj, tagjoin, tagstr, iestr, mode;
    let regstr="";
    let lasttype="none";
    let dotags = false;
    let pubs = [];
    let exports = {};
    const sepstr="; ";
    const tagcolors = [];
    const getExports = (obj, region) => {
	let i, s, key, child;
	const nexports = {};
	const params = obj.params;
	const children = params.children;
	const exports = params.exports;
	for(i=0; i<exports.length; i++){
	    // property name
	    key = exports[i];
	    // skip text keys (except text regions), get them from the children
	    if( (key === "text" && obj.type !== "text") ||
		(key === "textOpts") ){
		continue;
	    }
	    // ignore empty stroke dash array
	    if( key === "strokeDashArray" ){
		s = obj.strokeDashArray.join("");
		if( (s === "") || s.match(/NaN/) ){
		    continue;
		}
	    }
	    // skip data if export is turned off explicitly
	    if( key === "data" && typeof params.data === "object" &&
		params.data.doexport === false ){
		continue;
	    }
	    // strokeWidth can be changed as part of zooming,
	    // so use the original value if needed
	    if( (key === "strokeWidth") && params.sw1 ){
		nexports[key] = params.sw1;
		continue;
	    }
	    // looks for its value
	    if( obj[key] !== undefined ){
		nexports[key] = obj[key];
	    } else if( params[key] !== undefined ){
		nexports[key] = params[key];
	    } else if( region && region[key] !== undefined ){
		nexports[key] = region[key];
	    }
	}
	// handle text child properties specially
	// for now, just output the first one (cf. updateShape)
	if( (children.length > 0) && (children[0].obj.text) ){
	    child = children[0].obj;
	    // create a text child
	    nexports.text = child.text;
	    // get options for text child but ...
	    nexports.textOpts = getExports(child);
	    // try to minimize exported properties
	    if( obj.angle !== child.angle ){
		// child has an explicit angle different from parent
		nexports.textOpts.angle = -child.angle;
		if( (obj.params.shape === "circle")  ||
		    (obj.params.shape === "annulus") ){
		    child.params.hasTextOpts = true;
		}
	    } else if( child.angle !== 0 ){
		// parent is circle/annulus and child has an angle
		if( (obj.params.shape === "circle")  ||
		    (obj.params.shape === "annulus") ){
		    nexports.textOpts.angle = -child.angle;
		    child.params.hasTextOpts = true;
		}
	    }
	    if( child.params.parent.moved || child.params.hasTextOpts ){
		// wcs, then physical coords are preferred ...
		if( child.pub.ra && child.pub.dec ){
		    nexports.textOpts.ra  = child.pub.ra;
		    nexports.textOpts.dec = child.pub.dec;
		} else if( child.pub.lcs ){
		    nexports.textOpts.px = child.pub.lcs.x;
		    nexports.textOpts.py = child.pub.lcs.y;
		} else {
		    // ... image coords will are only good for this image
		    nexports.textOpts.x = child.pub.x;
		    nexports.textOpts.y = child.pub.y;
		}
	    }
	    if( nexports.textOpts.color === obj.stroke ){
		delete nexports.textOpts.color;
	    }
	    if( nexports.textOpts.text ){
		delete nexports.textOpts.text;
	    }
	    if( !Object.keys(nexports.textOpts).length ){
		delete nexports.textOpts;
	    }
	}
	return nexports;
    };
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse listRegions opts: ${opts}`, e); }
    }
    // default is to display, including non-source tags
    mode = opts.mode;
    if( JS9.isNull(mode) ){
	mode = 3;
    }
    // default is to list the regions layer
    if( JS9.isNull(layer) ){
	layer = "regions";
    }
    // get specified regions into an array
    pubs = this.getShapes(layer, which, {includeObj: true});
    // loop through shapes
    rlen = pubs.length;
    // display tags if at least one is not standard "source,include"
    if( mode ){
	for(i=0; i<rlen; i++){
	    region = pubs[i];
	    tagjoin = region.tags.join(",");
	    if( tagjoin                        &&
		(tagjoin !== "source,include") &&
		(tagjoin !== "include,source") ){
		dotags = true;
		break;
	    }
	}
    }
    // get array of colors associated with tags
    for( key in JS9.Regions.opts.tagcolors ){
	if( JS9.Regions.opts.tagcolors.hasOwnProperty(key) ){
	    tagcolors.push(JS9.Regions.opts.tagcolors[key]);
	}
    }
    // process all regions
    for(i=0; i<rlen; i++){
	region = pubs[i];
	obj = region.obj;
	tagjoin = region.tags.join(",");
	if( tagjoin.includes("exclude") ){
	    iestr = "-";
	} else {
	    iestr = "";
	}
	// add exported properties
	exports = getExports(obj, region);
	// add id, if necessary
	if( opts.saveid ){
	    exports.id = region.id;
	}
	// add color, if necessary
	if( region.color && !tagcolors.includes(region.color) ){
	    exports.color = region.color;
	}
	// display tags?
	if( dotags ){
	    tagstr = ` # ${tagjoin}`;
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
	// odd modes output the exports
	if( ((mode % 2) === 1) && (Object.keys(exports).length > 0) ){
	    // line region: remove size/distance info
	    if( region.shape === "line" ){
		regstr = regstr.replace(/ *{[^{}]*}$/,"");
	    }
	    regstr += ` ${JSON.stringify(exports)}`;
	}
	if( tagstr ){
	    regstr += tagstr;
	}
    }
    // display the region string, if necessary
    if( mode > 1 ){
	this.display.displayMessage("regions", regstr);
    }
    // always return the region string
    return regstr;
};

// copy one or more regions
// call using image context
JS9.Regions.copyRegions = function(to, which){
    let i, im, s;
    const ims = [];
    if( typeof to === "object" ){
	ims.push(to);
    } else if( to === "all" ){
	for(i=0; i<JS9.images.length; i++){
	    if( this !== JS9.images[i] ){
		ims.push(JS9.images[i]);
	    }
	}
    } else {
	im = JS9.lookupImage(to);
	if( im ){
	    ims.push(im);
	}
    }
    if( !ims.length ){
	return;
    }
    // if no 'which' specified, first look for "selected" regions
    if( !which ){
	s = this.listRegions("selected", {mode: 1});
    }
    // if no selected regions found, or 'which' was specified, get regions
    if( !s ){
	s = this.listRegions(which, {mode: 1});
    }
    for(i=0; i<ims.length; i++){
	ims[i].addShapes("regions", s);
    }
    return this;
};

// parse a string containing a subset of DS9/Funtools regions
// call using image context
JS9.Regions.parseRegions = function(s, opts){
    let i, j, k, lines, obj, robj, txeq;
    let owcssys, owcsunits, wcssys, iswcs, liswcs, pos, alen;
    const regions = [];
    const regrexp = /^(annulus|box|circle|ellipse|line|polygon|point|text)$/;
    const wcsrexp = /^(fk4|fk5|icrs|galactic|ecliptic|image|physical|linear)$/;
    const imrexp = /^(image|physical)$/;
    const unrexp = /[dr:]/;
    const parrexp = /\(\s*([^)]+?)\s*\)/;
    const seprexp = /\n|;/;
    const optsrexp = /(\{.*\})/;
    const argsrexp = /\s*,\s*/;
    const charrexp = /(\(|\{|#|;|\n)/;
    const comrexp  = /#(?![a-zA-Z0-9]{6}['"])/;
    // convert "0" to false and "1" to true
    const tf = (s) => {
	if( s === "0" || s.toLowerCase() === "false" ){return false;}
	return true;
    };
    // ds9 compatibility: get properties from comment string
    const ds9properties = (s) => {
	let xarr, key, key2, val, nobj;
	const xobj = {};
	const rexp = /([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*(\d+(\s*\d+)*|[^ '"{]+|['"{][^'"}]*['"}])/g;
	const ds9opts = {
	    color(v) {return {color: v};},
	    dash(v) {if(v){return {strokeDashArray: [3,1]};}},
	    dashlist(v) {
		let i, arr;
		if( v ){
		    arr = v.split(" ");
		    for(i=0; i<arr.length; i++){
			arr[i] = parseFloat(arr[i]);
		    }
		    return {strokeDashArray: arr};
		}
	    },
	    delete(v) {return {removable: tf(v)};},
	    edit(v) {return {selectable: tf(v)};},
	    fixed(v) {return {zoomable: !tf(v)};},
	    font(v) {
		const obj = {};
		const arr = v.split(" ");
		const len = arr.length;
		if( len >= 1 ){ obj.fontFamily = arr[0]; }
		if( len >= 2 ){ obj.fontSize = parseFloat(arr[1]); }
		if( len >= 3 ){ obj.fontStyle  = arr[2]; }
		if( len >= 4 ){ obj.fontWeight = arr[3]; }
		return obj;
	    },
	    highlite(v) {return {hasControls: tf(v), hasBorders: tf(v), hasRotatingPoint: tf(v)};},
	    move(v) {return {movable: tf(v)};},
	    rotate(v) {return {rotatable: tf(v)};},
	    resize(v) {return {resizable: tf(v)};},
	    changeable(v) {return {changeable: tf(v)};},
	    select(v) {return {selectable: tf(v)};},
	    text(v) {return {text: v};},
	    tag(v) {return {tags: v};},
	    width(v) {return {strokeWidth: parseFloat(v)};}
	};
	// opts is optional
	opts = opts || {};
	// loop through DS9 region properties, converting to js9 props
	while( (xarr = rexp.exec(s)) !== null ){
	    key = xarr[1].toLowerCase();
	    val = xarr[2].replace(/^['"{]|['"}]$/g, "");
	    if( ds9opts.hasOwnProperty(key) &&
		typeof ds9opts[key] === "function" ){
		nobj = ds9opts[key](val);
		for( key2 in nobj ){
		    if( nobj.hasOwnProperty(key2) ){
			if( key2 === "tags" && xobj.hasOwnProperty(key2) ){
			    xobj[key2] += `,${nobj[key2]}`;
			} else {
			    xobj[key2] = nobj[key2];
			}
		    }
		}
	    } else {
		xobj[key] = val;
	    }
	}
	// save the remaining comment
	s = s.replace(rexp, "");
	if( s ){
	    xobj._comment = s.trim();
	}
	return xobj;
    };
    // parse region line into cmd (shape or wcs), args, opts, comment
    const regparse1 = (s) => {
	let t, tarr, ds9props;
	const tobj = {};
	// initialize the return object
	tobj.opts = {};
	tobj.args = [];
	tobj.isregion = 0;
	// look for a command
	if( s.includes("(") ){
	    tobj.cmd = s.split("(")[0].trim().toLowerCase();
	} else if( s.includes("{") ){
	    tobj.cmd = s.split("{")[0].trim().toLowerCase();
	} else if( s.includes("#") ){
	    tobj.cmd = s.split("#")[0].trim().toLowerCase();
	} else {
	    tobj.cmd = s.trim().toLowerCase();
	}
	// got regions?
	if( tobj.cmd ){
	    tobj.isregion = (tobj.cmd.search(regrexp) >=0);
	}
	// split on comment (ignore color specifications starting with "#")
	t = s.trim().split(comrexp);
	// look for json opts after the arg list
	tarr = optsrexp.exec(t[0]);
	if( tarr && tarr[0] ){
	    // convert to object
	    try{ tobj.opts = JSON.parse(tarr[0].trim()); }
	    catch(e){ tobj.opts = {}; }
	}
	// look for comments
	tobj.comment = t[1];
	if( tobj.comment ){
	    ds9props = ds9properties(tobj.comment.trim());
	    if( ds9props._comment !== undefined ){
		tobj.comment = ds9props._comment;
		delete ds9props._comment;
	    }
	}
	// merge with ds9 opts
	if( ds9props ){
	    tobj.opts = $.extend({}, ds9props, tobj.opts);
	}
	// separate the region args into an array
	tarr = parrexp.exec(s);
	if( tarr && tarr[1] ){
	    // arg without json opts
	    tobj.args = tarr[1].split(argsrexp);
	}
	// look for - sign signifying an exclude region
	if( tobj.isregion && tobj.cmd.startsWith("-") ){
	    tobj.cmd = tobj.cmd.slice(1);
	    if( tobj.comment ){
		tobj.comment += ",exclude";
	    } else {
		tobj.comment = "exclude";
	    }
	}
	return tobj;
    };
    // get image position using delim type to ascertain input units
    const getipos = (ix, iy) => {
	let vt, sarr, ox, oy;
	const v1 = JS9.strtoscaled(ix);
	const v2 = JS9.strtoscaled(iy);
	// local override of wcs if we used sexagesimal units or appended d,r
	if( ((v1.dtype.match(unrexp)) || (v2.dtype.match(unrexp))) &&
	    !owcssys.match(imrexp) ){
	    liswcs = true;
	    wcssys = owcssys;
	}
	if( iswcs || liswcs ){
	    // arg1 coords are hms, but ecliptic, galactic are deg
	    if( (v1.dtype === ":" ) &&
		(wcssys !== "galactic")  && (wcssys !== "ecliptic") ){
		v1.dval *= 15.0;
	    }
	    // convert to degrees, if necessary
	    if( v1.dtype === "r" ){ v1.dval = v1.dval * 180 / Math.PI; }
	    if( v2.dtype === "r" ){ v2.dval = v2.dval * 180 / Math.PI; }
	    // get image coordinates
	    sarr = JS9.wcs2pix(this.raw.wcs, v1.dval, v2.dval).split(/ +/);
	    ox = parseFloat(sarr[0]);
	    oy = parseFloat(sarr[1]);
	} else if( wcssys === "physical" ){
	    vt = this.logicalToImagePos({x: v1.dval, y: v2.dval});
	    ox = vt.x;
	    oy = vt.y;
	} else {
	    ox = v1.dval;
	    oy = v2.dval;
	}
	return [ox, oy];
    };
    // get image length
    const getilen = (len, which) => {
	let cstr;
	const v = JS9.strtoscaled(len);
	const wcsinfo = this.raw.wcsinfo || {cdelt1: 1, cdelt2: 1};
	// local override of wcs if we used sexagesimal units or appended d,r
	if( v.dtype.match(unrexp) && !owcssys.match(imrexp) ){
	    liswcs = true;
	    wcssys = owcssys;
	}
	if( iswcs || liswcs ){
	    // convert to degrees, if necessary
	    if( v.dtype === "r" ){ v.dval = v.dval * 180 / Math.PI; }
	    // wcs-based size
	    cstr = `cdelt${which}`;
	    v.dval = Math.abs(v.dval / wcsinfo[cstr]);
	} else if( wcssys === "physical" ){
	    // use the LTM1_1 value stored for logical to image transforms
	    if( this.lcs && this.lcs.physical ){
		v.dval = Math.abs(v.dval * this.lcs.physical.forward[0][0]);
	    }
	}
	return v.dval;
    };
    // get image angle
    const getang = (a) => {
	const v = JS9.strtoscaled(a);
	return v.dval;
    };
    // get cleaned-up string
    const getstr = (s) => {
	const t = s.replace(/^['"]/, "").replace(/["']$/, "");
	return t;
    };
    // sanity check
    s = s.trim();
    if( !s.match(charrexp) ){
	return s;
    }
    // save original wcs
    owcssys = this.getWCSSys();
    owcsunits = this.getWCSUnits();
    // this is the default wcs for regions
    wcssys = "physical";
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
		// args are not required!
		if( alen >= 2 ){
		    // get image position
		    pos = getipos(robj.args[0], robj.args[1]);
		    obj.x = pos[0];
		    obj.y = pos[1];
		}
		// if textOpts has ra, dec, save the wcssys, it may be
		// different by the time textOpts gets processed
		if( obj.textOpts                    &&
		    obj.textOpts.ra  !== undefined  &&
		    obj.textOpts.dec !== undefined  ){
		    obj.textOpts._wcssys = wcssys;
		}
		// region args are optional
		switch(robj.cmd){
		case 'annulus':
		    obj.radii = [];
		    for(j=2; j<alen; j++){
			obj.radii.push(getilen(robj.args[j], 1));
		    }
		    break;
		case 'box':
		    if( alen >= 3 ){
			obj.width = getilen(robj.args[2], 1);
		    }
		    if( alen >= 4 ){
			obj.height = getilen(robj.args[3], 2);
		    }
		    if( alen >= 5 ){
			obj.angle = getang(robj.args[4]);
		    }
		    break;
		case 'circle':
		    if( alen >= 3 ){
			obj.radius = getilen(robj.args[2], 1);
		    }
		    break;
		case 'ellipse':
		    if( alen >= 3 ){
			obj.r1 = getilen(robj.args[2], 1);
		    }
		    if( alen >= 4 ){
			obj.r2 = getilen(robj.args[3], 2);
		    }
		    if( alen >= 5 ){
			obj.angle = getang(robj.args[4]);
		    }
		    break;
		case 'line':
		case 'polygon':
		    obj.pts = [];
		    for(j=0, k=0; j<alen; j+=2, k++){
			pos = getipos(robj.args[j], robj.args[j+1]);
			obj.pts[k] = {x: pos[0], y: pos[1]};
		    }
		    delete obj.x;
		    delete obj.y;
		    break;
		case 'point':
		    break;
		case 'text':
		    if( alen >= 3 ){
			obj.text = getstr(robj.args[2]);
		    }
		    if( alen >= 4 ){
			obj.angle = getang(robj.args[3]);
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
		    txeq = JS9.globalOpts.xeqPlugins;
		    JS9.globalOpts.xeqPlugins = false;
		    this.setWCSSys(robj.cmd);
		    JS9.globalOpts.xeqPlugins = txeq;
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
    txeq = JS9.globalOpts.xeqPlugins;
    JS9.globalOpts.xeqPlugins = false;
    this.setWCSSys(owcssys);
    this.setWCSUnits(owcsunits);
    JS9.globalOpts.xeqPlugins = txeq;
    // return the generated object
    return regions;
};

// save regions to a file
JS9.Regions.saveRegions = function(fname, which, layer){
    let header, regstr, s, type, blob, opts, arr, rid;
    // see if default type is implicit in the output file
    if( fname ){
	arr = fname.match(/\.([^.]*)$/);
	if( arr && arr.length >= 2 && (arr[1] === "reg" || arr[1] === "svg") ){
	    type = arr[1];
	}
    }
    // layer can be a layer name or an object describing layer, output type
    if( typeof layer === "object" ){
	opts = layer;
	layer = null;
    } else if( layer && typeof layer === "string" ){
	try{ opts = JSON.parse(layer); }
	catch(e){ opts = null; }
	if( opts ){ layer = null; }
    }
    // see if parameters are in the opts object
    if( opts ){
	if( JS9.notNull(opts.layer) ){
	    layer = opts.layer;
	}
	if( JS9.notNull(opts.type) ){
	    type = opts.type ;
	}
    }
    // last chance ... use defaults
    layer = layer || "regions";
    type =  type  || "reg";
    // and make a sanity check
    if( !this.layers[layer] ){
	JS9.error(`can't find layer for saveRegions: ${layer}`);
    }
    // generate the specified output
    switch(type){
    case "svg":
	// convert layer to svg
	try{
	    // add border box, if necessary
	    if( JS9.globalOpts.svgBorder ){
		rid = this.addShapes(layer, "box",
				     {left:   this.rgb.img.width/2,
				      top:    this.rgb.img.height/2,
				      width:  this.rgb.img.width,
				      height: this.rgb.img.height,
				      color: "black",
				      strokeWidth: 1,
				      tags: "SVGBorder"
				     });
	    }
	    // convert canvas to SVG
	    s = this.layers[layer].dlayer.canvas.toSVG();
	    // remove border box, if necessary
	    if( JS9.globalOpts.svgBorder ){
		this.removeShapes(layer, rid);
	    }
	}
	catch(e){ JS9.error(`can't convert layer to SVG: ${layer}`);}
	break;
    case "reg":
    default:
	// convert layer to region string
	try{
	    header = "# Region file format: JS9 version 1.0";
	    regstr = this.listRegions(which, {mode: 1}, layer);
	    s = `${header}\n${regstr.replace(/; */g, "\n")}\n`;
	}
	catch(e){ JS9.error(`can't convert layer to region: ${layer}`);	}
	break;
    }
    // create the blob
    blob = new Blob([s], {type: "text/plain;charset=utf-8"});
    // construct output file name
    if( !fname ){
	if( layer && layer !== "regions" ){
	    fname = `js9_${layer}.${type}`;
	} else {
	    fname = `js9.${type}`;
	}
    }
    // save blob
    if( window.hasOwnProperty("saveAs") ){
	saveAs(blob, fname);
    } else {
	JS9.error("no saveAs() available to save region file");
    }
    return fname;
};

// change region tags, e.g. set source, delete background
// e.g. im.changeRegionTags("selected", "source", "background");
// call using image context
JS9.Regions.editRegionTags = function(which, add1, rem1){
    let i, j, s, tags;
    const ntags = [];
    s = this.getShapes("regions", which);
    if( s.length ){
	for(i=0; i<s.length; i++){
	    tags = s[i].tags;
	    // add the new tag
	    ntags.push(add1);
	    for(j=0; j<tags.length; j++){
		// copy other tags, except the one we want to remove
		if( tags[j] !== rem1 ){
		    ntags.push(tags[j]);
		}
	    }
	}
	this.changeShapes("regions", which, {tags: ntags});
    }
};

// toggle region tags, e.g. source <-> background, include <-> exclude
// e.g. im.toggleRegionTags("selected", "source", "background");
// call using image context
JS9.Regions.toggleRegionTags = function(which, x1, x2){
    let i, j, s, tags, xnew;
    s = this.getShapes("regions", which);
    if( s.length ){
	for(i=0; i<s.length; i++){
	    tags = s[i].tags;
	    xnew = "";
	    for(j=0; j<tags.length; j++){
		// switch tags
		if( tags[j] === x1 ){
		    tags[j] = x2;
		    xnew = x2;
		    break;
		} else if( tags[j] === x2 ){
		    tags[j] = x1;
		    xnew = x1;
		    break;
		}
	    }
	}
	if( xnew ){
	    this.changeShapes("regions", which, {tags});
	}
    }
};

// unremove previously removed regions
JS9.Regions.unremoveRegions = function(){
    const s = this.regstack.pop();
    if( s ){
	return this.addShapes("regions", s);
    }
    return null;
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
    // evented: false,
    // catalog objects are locked in place by default
    // set "changeable" to true to unlock all, or unlock individually
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
    // don't update WCS strings
    updateWCS: false,
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
    },
    // should overlapping shapes be sorted (smallest on top)?
    sortOverlapping: false
};

// ---------------------------------------------------------------------
// Crosshair object displays a wcs-aligned crosshair on other displays
// ---------------------------------------------------------------------

JS9.Crosshair = {};
JS9.Crosshair.CLASS = "JS9";
JS9.Crosshair.NAME = "Crosshair";
JS9.Crosshair.LAYERNAME = "crosshair";

// defaults for crosshair layer
JS9.Crosshair.opts = {
    // override fabric defaults
    hasControls: false,
    hasRotatingPoint: false,
    hasBorders: false,
    // evented: false,
    // user does not move the crosshair
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
    // don't update WCS strings
    updateWCS: false,
    // pan and zoom enabled
    panzoom: false,
    // width and height when displaying arrow-key crosshair
    arrowSize: 20,
    // general
    strokeWidth: 1,
    // stroke color
    color: "#00FF00",
    // should overlapping shapes be sorted (smallest on top)?
    sortOverlapping: false,
    // where the crosshair is placed in order to hide it
    hiddenPts: {pts: [{x: -9999, y: -9999}, {x: -9999, y: -9900}]}
};

// display: display crosshair as the mouse moves
// eslint-disable-next-line no-unused-vars
JS9.Crosshair.display = function(im, ipos, evt){
    let i, s, arr, cim, ra, dec, w, h, x, y, hopts, vopts, shift, size;
    const layername = JS9.Crosshair.LAYERNAME;
    // for computers, shift key must be down
    // for ipad, assume always true
    if( /iPad|iPhone|iPod/.test(navigator.platform) ){
	shift = true;
    } else {
	shift = evt.shiftKey;
    }
    // always do arrow crosshair, otherwise:
    // exit if crosshair is not enabled for this image
    // exit if we are not actively tracking the crosshair via shift
    if( !im.tmp.arrowCrosshair && (!shift || !im ||
	im.tmp.shiftKey || !im.crosshair || !im.params.crosshair) ){
	return;
    }
    if( im.tmp.arrowCrosshair && !im.params.crosshair ){
	// special crosshair used with arrow keys
	size = JS9.Crosshair.opts.arrowSize / im.rgb.sect.zoom;
	x = ipos.x - size;
	w = ipos.x + size;
	y = ipos.y - size;
	h = ipos.y + size;
    } else {
	// default crosshair
	x = 0;
	w = im.raw.width;
	y = 0;
	h = im.raw.height;
    }
    // draw the crosshair, centered on the image pos
    hopts = {pts: [{x: x, y: ipos.y}, {x: w, y: ipos.y}], redraw: false};
    im.changeShapes(layername, im.crosshair.h, hopts);
    vopts = {pts: [{x: ipos.x, y: y}, {x: ipos.x, y: h}], redraw: true};
    im.changeShapes(layername, im.crosshair.v, vopts);
    im.crosshair.visible = true;
    // if crosshair mode is on and this image has wcs ...
    if( JS9.globalOpts.wcsCrosshair && im && im.raw.wcs && im.raw.wcs > 0 ){
	// get wcs coords of current mouse position
	arr = JS9.pix2wcs(im.raw.wcs, ipos.x, ipos.y).trim().split(/\s+/);
	ra = JS9.saostrtod(arr[0]);
	if( (String.fromCharCode(JS9.saodtype()) === ":") &&
	    (im.params.wcssys !== "galactic" )     &&
	    (im.params.wcssys !== "ecliptic" )     ){
	    ra *= 15.0;
	}
	dec = JS9.saostrtod(arr[1]);
	// for each displayed image ...
	for(i=0; i<JS9.displays.length; i++){
	    cim = JS9.displays[i].image;
	    if( cim && cim !== im                     &&
		cim.crosshair && cim.params.crosshair &&
		cim.raw.wcs > 0                       ){
		// if the ra, dec pos is on this image, display crosshair
		w = cim.raw.width;
		h = cim.raw.height;
		// convert wcs pos to image pos for this image
		// trap uncaught errors => we were way off scale
		try{ s = JS9.wcs2pix(cim.raw.wcs, ra, dec); }
		catch(e){ s = null; }
		if( s ){
		    arr = s.trim().split(/\s+/);
		    x = parseFloat(arr[0]);
		    y = parseFloat(arr[1]);
		    // if image pos is within the image boundaries ...
		    if( x > 0 && x < w && y > 0 && y < h ){
			// draw the crosshair, centered on the image pos
			hopts = {pts: [{x: 0, y: y}, {x: w, y: y}],
				 redraw:false};
			cim.changeShapes(layername, cim.crosshair.h, hopts);
			vopts = {pts: [{x: x, y: 0}, {x: x, y: h}],
				redraw: true};
			cim.changeShapes(layername, cim.crosshair.v, vopts);
			cim.crosshair.visible = true;
		    }
		}
	    }
	}
    }
};

// hide: move the crosshair out of the display
// eslint-disable-next-line no-unused-vars
JS9.Crosshair.hide = function(im, ipos, evt){
    const layername = JS9.Crosshair.LAYERNAME;
    const opts = JS9.Crosshair.opts.hiddenPts;
    // if the crosshair is visible ...
    if( im &&
	(im.crosshair && im.crosshair.visible) ||
	im.tmp.arrowCrosshairVisible           ){
	// move it off the display
	im.changeShapes(layername, im.crosshair.h, opts);
	im.changeShapes(layername, im.crosshair.v, opts);
	im.crosshair.visible = false;
	delete im.tmp.arrowCrosshairVisible;
    }
};

// image load: create the cross hair for this image
JS9.Crosshair.create = function(im){
    const opts = JS9.Crosshair.opts.hiddenPts;
    const layername = JS9.Crosshair.LAYERNAME;
    if( im && !im.crosshair ){
	// create the crosshair object for this image
	im.crosshair = {};
	// create the crosshair, but don't display it yet
	im.crosshair.h = im.addShapes(layername, "line", opts);
	im.crosshair.v = im.addShapes(layername, "line", opts);
	im.crosshair.visible = false;
    }
};

// mark key actions which use the shift key
JS9.Crosshair.keyaction = function(im, ipos, evt){
    if( im && evt && evt.shiftKey ){
	im.tmp.shiftKey = true;
    }
};

// unmark key action-based shift key use
JS9.Crosshair.keyup = function(im, ipos, evt){
    // remove shiftKey marker, if necessary
    if( im && im.tmp.shiftKey && evt && !evt.shiftKey ){
	delete im.tmp.shiftKey;
    }
};

// init: create the shape layer for this display
JS9.Crosshair.init = function(){
    let i;
    const layername = JS9.Crosshair.LAYERNAME;
    // init the crosshair shape layer, but only once per display
    for(i=0; i<JS9.displays.length; i++){
	if( !JS9.displays[i].layers.crosshair ){
	    JS9.displays[i].newShapeLayer(layername, JS9.Crosshair.opts);
	}
    }
    return this;
};

// toggle display of crosshair
JS9.Image.prototype.toggleCrosshair = function(){
    this.params.crosshair = !this.params.crosshair;
    if( !this.params.crosshair ){
        JS9.Crosshair.hide(this);
    }
};

// toggle display of wcs crosshair
JS9.Image.prototype.toggleWCSCrosshair = function(){
    JS9.globalOpts.wcsCrosshair = !JS9.globalOpts.wcsCrosshair;
};

// ---------------------------------------------------------------------
// Grid object displays a wcs coordinate grid
// ---------------------------------------------------------------------

JS9.Grid = {};
JS9.Grid.CLASS = "JS9";
JS9.Grid.NAME = "Grid";
JS9.Grid.LAYERNAME = "grid";

// defaults for grids
JS9.Grid.opts = {
    // evented: false,
    movable: false,
    cover: "display",
    reduceDims: true,
    strokeWidth: 1,
    margin:   0,
    labelMargin: 10,
    stride:  32,
    raLines:  8,
    raSkip:  0,
    raAngle:  0,
    decLines: 8,
    decSkip: 0,
    decAngle:  90,
    sexaPrec: 1,
    degPrec: 3,
    lineColor: "#00FFFF",
    labelColor: "#00FFFF",
    labelFontFamily: "Helvetica, sans-serif",
    labelFontSize: 11,
    labelFontStyle: "normal",
    labelFontWeight: 300,
    labelRAOffx: 3,
    labelRAOffy: -1,
    labelDecOffx: -14,
    labelDecOffy: 6
};

// this is the problem routine: hard to get a heuristic which will:
// 1. pick a "natural" number of lines (depends on size of image)
// 2. put the lines on "natural" wcs boundaries (.1 degree or every 10 arcsec)
JS9.Grid.limits = function(opts, in0, in1, n){
    let trange, tscale, out0, out1, outinc;
    trange = in1 - in0;
    if( trange > 1 ){
	tscale = 10;
    } else if( trange > 0.1 ){
	tscale = 100;
    } else if( trange > 0.01 ){
	tscale = 1000;
    } else if( trange > 0.001 ){
	tscale = 10000;
    } else if( trange > 0.0001 ){
	tscale = 100000;
    } else {
	tscale = 1000000;
    }
    out0 = Math.floor(in0 * tscale) / tscale;
    out1 = Math.ceil(in1 * tscale) / tscale;
    outinc = Math.ceil(((out1 - out0) / n) * tscale) / tscale;
    return {lo: out0, hi: out1, inc: outinc};
};

// generate label value
JS9.Grid.getLabel = function(opts, v, which){
    let i, t, idx, arr;
    let doall = false;
    switch(opts.wcsunits){
    case "sexagesimal":
	if( (which === "ra") &&
	    ((opts.wcssys !== "galactic") && (opts.wcssys !== "ecliptic")) ){
	    v /= 15.0;
	}
	t = JS9.saodtostr(v, ":", opts.sexaPrec);
	arr = t.split(":");
	if( opts.last[which] ){
	    t = "";
	    for(i=0; i<arr.length; i++){
		if( t ){ t += ":"; }
		if( doall || arr[i] !== opts.last[which][i] ){
		    t += arr[i];
		    doall = true;
		}
	    }
	}
	opts.last[which] = $.extend({}, arr);
	break;
    default:
	t = v.toFixed(opts.degPrec);
	break;
    }
    t = t.replace(/0+$/, "");
    idx = t.indexOf(".");
    if( idx < 0 ){
	t += ".0";
    } else if( idx === t.length -1 ){
	t += "0";
    }
    t = t.replace(/:\.0/, ":0.0");
    return t;
};

// generate and display a coordinate grid of Line shapes
// call with image context
JS9.Grid.display = function(mode, myopts){
    let i, n, s, t, x, y, lineloc, arr, inc, got;
    let ra, dec, ra0, ra1, dec0, dec1, rainc, decinc;
    let raoffx, raoffy, decoffx, decoffy, raskip, decskip, lastra, lastdec;
    let xrainc0, xrainc, xralim, xdecinc0, xdecinc, xdeclim, ipos, dpos;
    let ratios, corners, opts;
    let out = {};
    const display = this.display;
    const raw = this.raw;
    const lims = [{ra:0, dec:0}, {ra:0, dec:0}, {ra:0, dec:0}, {ra:0, dec:0}];
    // no arg: return current grid display status
    if( JS9.isNull(mode) ){
	// toggle display
	switch(this.tmp.gridStatus){
	case "inactive":
	case undefined:
	    return false;
	case "active":
	case "processing":
	    return true;
	default:
	    return true;
	}
    }
    // delete previous grid
    this.removeShapes(JS9.Grid.LAYERNAME);
    // if false or no wcs, set inactive status and return
    if( mode === false || !this.raw.wcs || this.raw.wcs <= 0 ){
	this.tmp.gridStatus = "inactive";
	return;
    }
    // local opts are optional
    myopts = myopts || {};
    // myopts can be an object or json
    if( typeof myopts === "string" ){
	try{ myopts = JSON.parse(myopts); }
	catch(e){ JS9.error("can't parse displayCoordGrid JSON", e); }
    }
    // we are actively creating a grid
    this.tmp.gridStatus = "processing";
    // get opts
    opts = $.extend(true, {}, JS9.Grid.opts, myopts);
    // labels will follow current wcs units
    opts.wcsunits = this.getWCSUnits();
    opts.wcssys = this.getWCSSys();
    // keep track of labels as we go along
    opts.last = {};
    // wcslib wants degrees
    JS9.wcsunits(this.raw.wcs, "degrees");
    // if we will cover the whole image, change the ratio and corner values
    if( opts.cover === "image" ){
	ratios = [Math.max(1, Math.floor(raw.width  / display.width)),
		  Math.max(1, Math.floor(raw.height / display.height))];
	corners = [{x: 0, y: 0}, {x: raw.width-1, y: raw.height-1}];
    } else {
	if( opts.reduceDims ){
	    if( raw.width < raw.height ){
		ratios = [raw.width / raw.height, 1];
	    } else if( raw.height < raw.width ){
		ratios = [1, raw.height / raw.width];
	    } else {
		ratios = [1,1];
	    }
	} else {
	    ratios = [1,1];
	}
	corners = [];
	dpos = {x: this.ix + opts.margin,
		y: this.iy - opts.margin};
	ipos = this.displayToImagePos(dpos);
	corners[0] = {x: ipos.x, y: ipos.y};
	dpos = {x: display.width - 1 - this.ix - opts.margin,
		y: display.height - 1 - this.iy - opts.margin};
	ipos = this.displayToImagePos(dpos);
	corners[1] = {x: ipos.x, y: ipos.y};
    }
    // wcs coords at corners of display
    s = JS9.pix2wcs(raw.wcs, corners[0].x, corners[0].y).trim().split(/\s+/);
    lims[0].ra = JS9.saostrtod(s[0]);
    lims[0].dec = JS9.saostrtod(s[1]);
    s = JS9.pix2wcs(raw.wcs, corners[0].x, corners[1].y).trim().split(/\s+/);
    lims[1].ra = JS9.saostrtod(s[0]);
    lims[1].dec = JS9.saostrtod(s[1]);
    s = JS9.pix2wcs(raw.wcs, corners[1].x, corners[0].y).trim().split(/\s+/);
    lims[2].ra = JS9.saostrtod(s[0]);
    lims[2].dec = JS9.saostrtod(s[1]);
    s = JS9.pix2wcs(raw.wcs, corners[1].x, corners[1].y).trim().split(/\s+/);
    lims[3].ra = JS9.saostrtod(s[0]);
    lims[3].dec = JS9.saostrtod(s[1]);
    ra0 = lims[0].ra;
    dec0 = lims[0].dec;
    ra1 = lims[0].ra;
    dec1 = lims[0].dec;
    // initial ra,dec limits in ascending order
    for(i=1; i<4; i++){
	ra0 = Math.min(ra0, lims[i].ra);
	dec0 = Math.min(dec0, lims[i].dec);
	ra1 = Math.max(ra1, lims[i].ra);
	dec1 = Math.max(dec1, lims[i].dec);
    }
    // calculate normalized ra limits
    out = JS9.Grid.limits.call(this, opts, ra0, ra1, opts.raLines*ratios[0]);
    ra0 = out.lo;
    ra1 = out.hi;
    rainc = out.inc;
    // find best line for RA labels
    // calculate normalized dec limits
    out = JS9.Grid.limits.call(this, opts, dec0, dec1, opts.decLines*ratios[1]);
    dec0 = out.lo;
    dec1 = out.hi;
    decinc = out.inc;
    // restore original values
    JS9.wcsunits(this.raw.wcs, opts.wcsunits);
    // loop limits
    xrainc0 = Math.abs(this.raw.wcsinfo.cdelt1);
    xrainc = xrainc0 * JS9.Grid.opts.stride;
    xralim = ra1 - xrainc;
    xdecinc0 = Math.abs(this.raw.wcsinfo.cdelt2);
    xdecinc = xdecinc0 * JS9.Grid.opts.stride;
    xdeclim = dec1 - xdecinc;
    // start grid regions
    s = "image;";
    // lines of constant RA
    for(ra=ra0; ra<=ra1; ra=ra+rainc){
	t = "line(";
	inc = xdecinc0;
	lineloc = 0;
	n = 0;
        for(dec=dec0; dec<=dec1; dec=dec+inc){
	    arr = JS9.wcs2pix(raw.wcs, ra, dec).trim().split(/ +/);
	    if( arr && arr.length ){
		x = parseFloat(arr[0]);
		y = parseFloat(arr[1]);
		if( x >= -opts.margin && x <= raw.width + opts.margin  && 
		    y >= -opts.margin && y <= raw.height + opts.margin ){
		    t += String(`${x + 1},${y}${1}, `);
		    n++;
		    if( lineloc === 0 ){
			lineloc = 1;
			if( dec < xdeclim ){
			    inc = xdecinc;
			}
		    } else if( lineloc === 1 ){
			if( dec > xdeclim ){
			    lineloc = 2;
			    inc = xdecinc0;
			}
		    }
		} else {
		    if( lineloc === 1 ){
			lineloc = 2;
			dec = dec - inc;
			inc = xdecinc0;
		    }
		}
	    }
	}
	if( n > 1 ){
	    s += t.replace(/,\s+$/, ") ");
	    s += ` {"color": "${opts.lineColor}"};`;
	}
    }
    // lines of constant Dec
    for(dec=dec0; dec<=dec1; dec=dec+decinc){
	t = "line(";
	inc = xrainc0;
	lineloc = 0;
	n = 0;
        for(ra=ra0; ra<=ra1; ra=ra+inc){
	    arr = JS9.wcs2pix(raw.wcs, ra, dec).trim().split(/ +/);
	    if( arr && arr.length ){
		x = parseFloat(arr[0]);
		y = parseFloat(arr[1]);
		if( x >= -opts.margin && x <= raw.width + opts.margin  && 
		    y >= -opts.margin && y <= raw.height + opts.margin ){
		    t += String(`${x + 1},${y}${1}, `);
		    n++;
		    if( lineloc === 0 ){
			lineloc = 1;
			if( ra < xralim ){
			    inc = xrainc;
			}
		    } else if( lineloc === 1 ){
			if( ra > xralim ){
			    lineloc = 2;
			    inc = xrainc0;
			}
		    }
		} else {
		    if( lineloc === 1 ){
			lineloc = 2;
			ra = ra - inc;
			inc = xrainc0;
		    }
		}
	    }
	}
	if( n > 1 ){
	    s += t.replace(/,\s+$/, ") ");
	    s += ` {"color": "${opts.lineColor}"};`;
	}
    }
    // dec labels along constant ra line
    decoffx = opts.labelDecOffx / this.rgb.sect.zoom;
    decoffy = opts.labelDecOffy / this.rgb.sect.zoom;
    decskip = 0;
    lastra = ra0;
    for(ra=ra0, got=0; ra<=ra1; ra=ra+rainc){
	for(dec=dec0; dec<=dec1; dec=dec+decinc){
	    arr = JS9.wcs2pix(raw.wcs, ra, dec).trim().split(/ +/);
	    if( arr && arr.length ){
		x = parseFloat(arr[0]);
		y = parseFloat(arr[1]);
		dpos = this.imageToDisplayPos({x, y});
		if( dpos.x > (this.ix+opts.labelMargin) && dpos.x < (this.rgb.img.width+this.ix-opts.labelMargin) &&
		    dpos.y > (this.iy+opts.labelMargin) && dpos.y < (this.rgb.img.height+this.iy-opts.labelMargin)){
		    if( decskip >= opts.decSkip ){
			s += sprintf('text(%s,%s,%s,%s) {"color":"%s", "fontFamily":"%s", "fontSize":%s, "fontStyle":"%s", "fontWeight":"%s", "originX":"left", "originY":"top"};',
				 x + decoffx, y + decoffy,
				 JS9.Grid.getLabel.call(this, opts, dec, "dec"),
				 opts.decAngle,
				 opts.labelColor,
				 opts.labelFontFamily,
				 opts.labelFontSize,
				 opts.labelFontStyle,
				 opts.labelFontWeight);
			got++;
		    } else {
			if( ra !== lastra ){
			    decskip++;
			}
			lastra = ra;
		    }
		}
	    }
	}
	if( got ){
	    break;
	}
    }
    // ra labels along constant dec line
    raoffx = opts.labelRAOffx / this.rgb.sect.zoom;
    raoffy = opts.labelRAOffy / this.rgb.sect.zoom;
    raskip = 0;
    lastdec = dec0;
    for(dec=dec0, got=0; dec<=dec1; dec=dec+decinc){
	for(ra=ra0; ra<=ra1; ra=ra+rainc){
	    arr = JS9.wcs2pix(raw.wcs, ra, dec).trim().split(/ +/);
	    if( arr && arr.length ){
		x = parseFloat(arr[0]);
		y = parseFloat(arr[1]);
		dpos = this.imageToDisplayPos({x, y});
		if( dpos.x > (this.ix+opts.labelMargin) && dpos.x < (this.rgb.img.width+this.ix-opts.labelMargin) &&
		    dpos.y > (this.iy+opts.labelMargin) && dpos.y < (this.rgb.img.height+this.iy-opts.labelMargin)){
		    if( raskip >= opts.raSkip ){
			s += sprintf('text(%s,%s,%s,%s) {"color":"%s", "fontFamily":"%s", "fontSize":%s, "fontStyle":"%s", "fontWeight":"%s", "originX":"left", "originY":"top"};',
				 x + raoffx, y + raoffy,
				 JS9.Grid.getLabel.call(this, opts, ra, "ra"),
				 opts.raAngle,
				 opts.labelColor,
				 opts.labelFontFamily,
				 opts.labelFontSize,
				 opts.labelFontStyle,
				 opts.labelFontWeight);
			got++;
		    } else {
			if( dec !== lastdec ){
			    raskip++;
			}
			lastdec = dec;
		    }
		}
	    }
	}
	if( got ){
	    break;
	}
    }
    // add the grid shapes
    this.addShapes(JS9.Grid.LAYERNAME, s, opts);
    // grid is complete and active
    this.tmp.gridStatus = "active";
};

// toggle grid on/off
JS9.Grid.toggle = function(im){
    // sanity check
    if( !im ){
	return;
    }
    // toggle display
    switch(im.tmp.gridStatus){
    case undefined:
    case null:
    case "inactive":
	// start afresh
	im.displayCoordGrid(true);
	break;
    case "active":
	// clear the grid
	im.displayCoordGrid(false);
	break;
    case "processing":
    default:
	break;
    }
};

// display grid, as needed
JS9.Grid.regrid = function(im){
    if( im ){
	// ignore if grid is not active or the image is not loaded
	if( im.tmp.gridStatus !== "active" || im.status.load !== "complete" ){
	    return;
	}
	// redraw the grid
	im.displayCoordGrid(true);
    }
};

// plugin init: load our grid methods
// eslint-disable-next-line no-unused-vars
JS9.Grid.init = function(opts){
    let dlayer;
    opts = $.extend(true, {}, JS9.Catalogs.opts, JS9.Grid.opts, opts);
    // init the display shape layer
    dlayer = this.display.newShapeLayer(JS9.Grid.LAYERNAME, opts);
    // mouse up: no-op
    dlayer.canvas.on("mouse:up", () => {
	    return false;
    });
};

// add to image prototypes
JS9.Image.prototype.displayCoordGrid = JS9.Grid.display;

// ---------------------------------------------------------------------
// Dynsel: callbacks when a display is selected dynamically
// ---------------------------------------------------------------------

JS9.Dysel = {};
JS9.Dysel.CLASS = "JS9";
JS9.Dysel.NAME = "Dysel";

JS9.Dysel.display = null;
JS9.Dysel.plugins = [];

// plugin init: no op
// eslint-disable-next-line no-unused-vars
JS9.Dysel.init = function(opts){
    return;
};

// unhighlight current selection
JS9.Dysel.unhighlightSelection = function(){
    if( JS9.bugs.webkit_resize ){
	$(".JS9").find(".JS9Image").removeClass("JS9Highlight");
    } else {
	$(".JS9").removeClass("JS9Highlight");
    }
};

// highlight display when dynamic selection is made
JS9.Dysel.highlightSelection = function(im){
    let disp;
    // sanity check
    if( !im || !JS9.Dysel.retrievePlugins().length ){
	return;
    }
    // optimization: no processing if we only have one display
    if( JS9.displays.length === 1 ){
	return;
    }
    // unhighlight all
    JS9.Dysel.unhighlightSelection();
    // the display to highlight
    disp = im.display;
    // highlight selected
    if( JS9.bugs.webkit_resize ){
	$(disp.divjq).find(".JS9Image").addClass("JS9Highlight");
    } else {
	$(disp.divjq).addClass("JS9Highlight");
    }
};

// add to dynamic selection array
JS9.Dysel.addPlugins = function(plugin){
    JS9.Dysel.plugins.push(plugin);
};

// get dynamic selection array
JS9.Dysel.retrievePlugins = function(){
    return JS9.Dysel.plugins;
};

// return current dynamically selected display
JS9.Dysel.getDisplay = function(which){
    if( !JS9.Dysel.retrievePlugins().length ){
	return null;
    }
    if( which === "previous" ){
	return JS9.Dysel.odisplay;
    }
    return JS9.Dysel.display;
};

// return the display object associated with the current dynamic selection
// or else a default value
JS9.Dysel.getDisplayOr = function(def){
    if( def === "previous" ){
	return JS9.Dysel.getDisplay(def);
    }
    return JS9.Dysel.getDisplay() || def;
};

// set current dynamically selected display
JS9.Dysel.select = function(display){
    // sanity check
    if( !display || !JS9.Dysel.retrievePlugins().length ){
	return;
    }
    // save old display
    JS9.Dysel.odisplay = JS9.Dysel.display;
    // set new display
    JS9.Dysel.display = display;
    if( display.image ){
	JS9.Dysel.highlightSelection(display.image);
	// plugin callbacks for selected display
	display.image.xeqPlugins("image", "ondynamicselect", null);
    }
};

// imageload: select the display
JS9.Dysel.imageload = function(im){
    if( im ){
	JS9.Dysel.select(im.display);
    }
};

// imageclose: select another display, if necessary
JS9.Dysel.imageclose = function(im){
    let i, got, disp;
    if( im ){
	disp = JS9.Dysel.getDisplay();
	if( !disp || disp.image !== im ){
	    return;
	}
	// if this the last image in this display?
	for(i=0, got=0; i<JS9.images.length; i++){
	    if( im.display === JS9.images[i].display ){
		got++;
	    }
	}
	// if so, select another image in another display
	if( got <= 1 ){
	    for(i=0; i<JS9.displays.length; i++){
		disp = JS9.displays[i];
		if( im.display !== disp && disp.image ){
		    JS9.Dysel.select(JS9.displays[i]);
		    return;
		}
	    }
	}
    }
};

// public alias for plugin developers
JS9.getDynamicDisplayOr = JS9.Dysel.getDisplayOr;

// ---------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------

// sigh ... why do we need this polyfill??? (chrome pre-38)
Math.log10 = Math.log10 || function(x) {
  return Math.log(x) / Math.LN10;
};

// javascript: the good parts p. 22
if( typeof Object.create !== "function" ){
    Object.create = function(o){
	const F = function(){return;};
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

// set explicit focus for IPython/Jupyter support
JS9.jupyterFocus = function(el, el2){
    let eljq;
    if( window.hasOwnProperty("Jupyter") ){
	if( el instanceof jQuery ){
	    eljq = el;
	} else {
	    eljq = $(el);
	}
	el2 = el2 || "input, textarea";
	eljq.find(el2).each((index, element) => {
	    Jupyter.keyboard_manager.register_events($(element));
	});
    }
};

// return a unique value for a given image id by appending <n> to the id
JS9.getImageID = function(imid, dispid, myim){
    let i, im, s;
    let ids = 0;
    let idmax = 1;
    const imlen = JS9.images.length;
    const rexp = /.*<([0-9][0-9]*)>$/;
    const rexp2 = /<[0-9][0-9]*>/;
    imid = imid.replace(rexp2, "");
    for(i=0; i<imlen; i++){
	im = JS9.images[i];
	if( im.display.id === dispid ){
	    if( (im !== myim) && (imid === im.id0.replace(rexp2, "")) ){
		if( im.id && im.id.search(rexp) >= 0 ){
		    s = im.id.replace(rexp, "$1");
		    idmax = Math.max(idmax, parseInt(s, 10));
		}
		ids++;
	    }
	}
    }
    if( ids ){
	return `${imid}<${String(idmax+1)}>`;
    }
    return imid;
};

// return a unique value for ids
JS9.uniqueID = (function(){
    let id = 1; // initial value
    return function() {
        return id++;
    };
}());

// change cursor to waiting/not waiting
JS9.waiting = function(mode, display){
    let el, opts, tdisp;
    switch(mode){
    case true:
	if( window.hasOwnProperty("Spinner") &&
	    (JS9.globalOpts.waitType === "spinner") ){
	    if( display ){
		if( typeof display === "object" ){
		    el = display.divjq[0];
		} else if( typeof display === "string" ){
		    tdisp = JS9.lookupDisplay(display);
		    if( tdisp ){
			el = tdisp.divjq[0];
		    }
		}
	    }
	    if( !el ){
		el = $("body").get(0);
	    }
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

// display a progress bar
JS9.progress = function(arg1, arg2){
    if( (typeof arg1 === "boolean") || (typeof arg1 === "string") ){
	switch(arg1){
	case true:
	case "indeterminate":
	    if( arg2 ){
		JS9.progress.display = arg2;
		JS9.progress.display.displayMessage("progress", arg1);
	    }
	    break;
	case false:
	case "":
	    if( JS9.progress.display ){
		JS9.progress.display.clearMessage("progress");
		delete JS9.progress.display;
	    }
	    break;
	}
    } else if( typeof arg1 === "number" ){
	if( JS9.progress.display ){
	    JS9.progress.display.displayMessage("progress", [arg1, arg2]);
	}
    }
};

// msg coming from socket.io or postMessage
JS9.msgHandler =  function(msg, cb){
    let s, obj, tdisp, res, dobj;
    let args = [];
    const cmd = msg.cmd;
    const id = msg.id;
    const oalerts = JS9.globalOpts.alerts;
    const rstr = JS9.globalOpts.quietReturn ? "" : "OK";
    const getDisplayObject = (id, args) => {
	if( id ){
	    // bash send a string, not an object
	    if( args.length > 0 ){
		s = args[args.length-1];
		if( typeof s === "string" ){
		    try{ obj = JSON.parse(s); }
		    catch(e){ obj = null; }
		} else if( typeof s === "object" ){
		    obj = s;
		}
		// is this the display object? see JS9.parsePublicArgs
		if( obj                             &&
		    (typeof obj === "object")       &&
		    obj.hasOwnProperty("display")   &&
		    (Object.keys(obj).length === 1) ){
		    // remove the current display object
		    args.pop();
		    // return the new one
		    return obj;
		} else {
		    return {display: id};
		}
	    } else {
		return {display: id};
	    }
	}
	return null;
    };
    // turn off alerts
    if( cb ){
	JS9.globalOpts.alerts = false;
    }
    // look for a public API call
    if( JS9.publics[cmd] ){
	// check for non-array first arg
	if( !$.isArray(msg.args) ){
	    msg.args = [msg.args];
	}
	// deep copy of arg array
	args = $.extend(true, [], msg.args);
	// get display object (temporarily remove it, if necessary)
	dobj = getDisplayObject(id, args);
	// pre-processing
	switch(cmd){
	case "RunAnalysis":
	    // if RunAnalysis has a callback, call it when the helper returns
	    if( cb ){
		// add opts arg if not already present
		if( args.length === 1 ){
		    args.push(null);
		}
		// add callback arg
		args.push(cb);
	    }
	    break;
	default:
	    break;
	}
	// add (back) the display object
	if( dobj ){
	    args.push(dobj);
	}
	// call public API
	try{ res = JS9.publics[cmd](...args); }
	catch(e){ res = `ERROR: ${e.message}`; }
	if( cb ){
	    JS9.globalOpts.alerts = oalerts;
	    // last ditch effort to avoid passing back image or display objects
	    if( res instanceof JS9.Display || res instanceof JS9.Image ){
		res = res.id;
	    }
	    // post-processing
	    switch(cmd){
	    case "NewShapeLayer":
		if( res && res.layerName ){
		    res = res.layerName;
		}
		break;
	    case "RunAnalysis":
		// only callback on error, runAnalysis did non-error case
		if( !res.match(/^ERROR:/) ){
		    cb = null;
		}
		break;
	    default:
		break;
	    }
	    if( cb ){
		cb(res);
	    }
	}
	return res;
    }
    // skip blank lines and comments
    if( !cmd || (cmd === "#") ){
	if( cb ){
	    cb("");
	}
	if( cb ){
	    JS9.globalOpts.alerts = oalerts;
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
	    catch(e){ res = `ERROR: ${e.message}`;}
	    break;
	case "set":
	    // execute set call
	    try{ res = obj.set(args) || rstr; }
	    catch(e){ res = `ERROR: ${e.message}`;}
	    break;
	default:
	    res = `ERROR: unknown cmd type for '${cmd}'`;
	}
    } else {
	if( !obj ){
	    res = `ERROR: unknown cmd '${cmd}'`;
	}
	if( !tdisp ){
	    res = `ERROR: unknown display (${id})`;
	}
    }
    // turn on alerts, do message callback, if necessary
    if( cb ){
	JS9.globalOpts.alerts = oalerts;
	// last ditch effort to avoid passing back image or display objects
	if( res instanceof JS9.Display || res instanceof JS9.Image ){
	    res = res.id;
	}
	cb(res);
    }
    return res;
};

// create a light window
// someday we might want other options ...
JS9.lightWin = function(id, type, s, title, opts){
    let rval;
    switch(JS9.LIGHTWIN){
    case "dhtml":
	rval = dhtmlwindow.open(id, type, s, title, opts);
	// override dhtml to add ios scroll capability
	if(  /iPad|iPhone|iPod/.test(navigator.platform) ){
	    $(`#${id} ${JS9.lightOpts.dhtml.drag}`)
		.css("-webkit-overflow-scrolling", "touch")
		.css("overflow-y", "scroll");
	}
	// allow double-click or double-tap to close ...
	// ... the close button is unresponsive on the ipad/iphone
        $(`#${id} .${JS9.lightOpts.dhtml.dragBar}`)
	    .on("mouseup touchend", (e) => {
		const curtime = (new Date()).getTime();
		const lasttime = $(e.currentTarget).data("lasttime");
		if( lasttime && (curtime - lasttime) < JS9.DBLCLICK ){
		    rval.close();
		}
		$(e.currentTarget).data("lasttime", curtime);
	    });
	// if ios user failed to close the window via the close button,
	// give a hint (once per session only!)
        $(`#${id} .${JS9.lightOpts.dhtml.dragBar}`)
	    .on("touchend", () => {
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

// wrapper for new func to avoid jslint errors
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
    let s = "";
    if( JS9.DEBUG > 1 ){
	s = e.stack || e.stacktrace || "";
    }
    return s;
};

// try to make a nice string from a float
// ints remain ints, floats get truncated at 6 significant digits
JS9.floatToString = function(fval){
    return sprintf("%g",
		   parseFloat(fval.toFixed(JS9.globalOpts.floatPrecision)));
};

// figure out precision from range of values
// from: /tksao1.0/colorbar/colorbarbase.C
JS9.floatPrecision = function(fval1, fval2){
    let prec;
    let aa = Math.floor(Math.log10(Math.abs(fval1)));
    let bb = Math.floor(Math.log10(Math.abs(fval2)));
    if( aa !== bb ){
      prec = aa > bb ? aa : bb;
    } else {
      prec = 1;
    }
    return prec;
};

// convert float value to a string with decent precision
// from: /tksao1.0/colorbar/colorbarbase.C
JS9.floatFormattedString = function(fval, prec, jj){
    let fmt;
    let s = "";
    if( fval === undefined ){
	return s;
    }
    if( prec < -2 ){
	fmt = `%.${String(2+jj)}e`;
	s = sprintf(fmt, fval);
    } else if( prec < 0 ){
	s = fval.toFixed(Math.abs(prec)+3+jj);
    } else if( prec < 2 ){
	fmt = `%.${String(prec+jj)}f`;
	s = sprintf(fmt, fval);
    } else if( prec < 5 ){
	s = fval.toFixed(0+jj);
    } else {
	fmt = `%.${String(2+jj)}e`;
	s = sprintf(fmt, fval);
    }
    return s;
};

// get center of bounding box surrounding a polygon
JS9.centerPolygon = function(points){
    let i, plen, minx, maxx, miny, maxy;
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
// wont work for self-intersecting polygons but it's all I do right now!
// adapted from: http://en.wikipedia.org/wiki/Centroid
JS9.centroidPolygon = function(points){
    let i, plen, factor, area, cx, cy;
    let parta = 0;
    let partx = 0;
    let party = 0;
    let totx = 0;
    let toty = 0;
    const doaverage=true;
    const pts = [];
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
    let i, im, did;
    const ilen= JS9.images.length;
    // sanity check
    if( !id ){
	return null;
    }
    for(i=0; i<ilen; i++){
	im = JS9.images[i];
	if( (id === im )      || (id === im.id)                          ||
            (id === im.id0)   || (id === im.id0.replace(/\[.*\]$/, ""))  ||
	    (id === im.file)  || (id === im.file.replace(/\[.*\]$/, "")) ||
	    (id === im.file0) || (id === (JS9.TOROOT + im.file))         ||
	    (im.fitsFile      && (id === im.fitsFile)) ){
	    // make sure the display still exists (light windows disappear)
	    if( $(`#${im.display.id}`).length > 0 ){
		did = im.display.id;
		if( !display                                            ||
		    (typeof display === "string" && display === did)    ||
		    (typeof display === "object" && display.id === did) ){
		    return im;
		}
	    }
	}
    }
    return null;
};

// return the display for the specified id
// id can be a display object or an id from a display object
JS9.lookupDisplay = function(id, mustExist){
    let i;
    const regexp = new RegExp(`[-_]?(${JS9.PLUGINS})$`);
    // default is the id must exist
    if( mustExist === undefined ){
	mustExist = true;
    }
    // lookup id
    if( id && (id.toString().search(JS9.SUPERMENU) < 0) ){
	// look for whole id
	for(i=0; i<JS9.displays.length; i++){
	    if( (id === JS9.displays[i])     ||
		(id === JS9.displays[i].id)  ||
		(id === JS9.displays[i].oid) ){
		return JS9.displays[i];
	    }
	}
	// try removing id suffix to get base id
	if( typeof id === "string" ){
	    id = id.replace(regexp,"");
	    for(i=0; i<JS9.displays.length; i++){
		if( (id === JS9.displays[i])     ||
		    (id === JS9.displays[i].id)  ||
		    (id === JS9.displays[i].oid) ){
		    return JS9.displays[i];
		}
	    }
	}
        // an id was specified but not found
        if( mustExist ){
	    JS9.error(`can't find JS9 display with id: ${id}`);
        }
        else {
            return null;
        }
    }
    // no id: return whatever we have
    return JS9.displays[0];
};

// return the image object for the specified image id or display id
JS9.getImage = function(id){
    let im = null;
    let display = null;
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
    let i, j, im, raw;
    const arr = [];
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

// load javascript dynamically
// https://stackoverflow.com/questions/21294/dynamically-load-a-javascript-file
JS9.loadScript = function(url, func, error){
    // adding the script tag to the head as suggested before
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.type = 'text/javascript';
    // callback
    if( func ){
	script.onload = func;
    }
    // error
    if( error ){
	script.onerror = error;
    }
    script.src = url;
    // fire the loading
    head.appendChild(script);
};

// fetch a file URL (as a blob) and process it
// (as of 2/2015: can't use $.ajax to retrieve a blob: use low-level xhr)
JS9.fetchURL = function(name, url, opts, handler) {
    let nurl;
    const xhr = new XMLHttpRequest();
    // opts is optional
    opts = opts || {};
    // sanity check
    if( !name && !url ){
	JS9.error("invalid url specification for fetchURL");
    }
    // either url or name can be blank
    if( !url ){
	url = name;
	name = /([^\\/]+)$/.exec(url)[1];
    }
    if( !name ){
	name = /([^\\/]+)$/.exec(url)[1];
    }
    // avoid the cache (Safari is especially aggressive) for FITS files
    if( !opts.allowCache && !url.match(/\?/) ){
	nurl = `${url}?r=${Math.random()}`;
    } else {
	nurl = url;
    }
    // change $JS9_DIR back to install dir
    nurl = nurl.replace(/^\${JS9_DIR}\//,JS9.INSTALLDIR);
    // set up connection
    xhr.open('GET', nurl, true);
    // and parameters
    if( opts.responseType ){
	xhr.responseType = opts.responseType;
    } else {
	xhr.responseType = 'blob';
    }
    if( JS9.globalOpts.xtimeout ){
	xhr.timeout = JS9.globalOpts.xtimeout;
    }
    xhr.onload = () => {
	let blob;
        if( xhr.readyState === 4 ){
	    if( xhr.status === 200 || xhr.status === 0 ){
		// delete fetch status so JS9.error() does not process it
		delete JS9.fetchURL.status;
		if( xhr.responseType === "blob" ){
	            blob = new Blob([xhr.response]);
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
			blob.name = `google_${JS9.uniqueID()}.fits`;
		    }
		    if( handler ){
			handler(blob, opts);
		    } else {
			JS9.Load(blob, opts);
		    }
		} else {
		    if( opts.display ){
			handler(xhr.response, opts, {display: opts.display});
		    } else {
			handler(xhr.response, opts);
		    }
		}
	    } else if( xhr.status === 404 ) {
		JS9.error(`could not find ${url}`);
	    } else {
		JS9.error(`can't load: ${url} ${xhr.statusText} ${xhr.status}`);
	    }
	}
    };
    xhr.onerror = () => {
	JS9.error(`cannot load: ${url} ... please check the url/pathname`);
    };
    xhr.ontimeout = () => {
	JS9.error(`timeout awaiting response from server: ${url}`);
    };
    // hack: set fetch status for JS9.error() to sense and pass on
    // this will be picked up by getStatus("load")
    JS9.fetchURL.status = "processing";
    // fetch the data!
    try{ xhr.send(); }
    catch(e){ JS9.error(`request to load ${url} failed`, e); }
};

// configure or return the fits library
JS9.fitsLibrary = function(s){
    let t;
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
		xdim: JS9.userOpts.fits.xdim,
		ydim: JS9.userOpts.fits.ydim,
		bin: JS9.userOpts.fits.bin || 1
	    };
	    JS9.fits.options.image = {
		xdim: JS9.userOpts.fits.ixdim || JS9.userOpts.fits.xmax,
		ydim: JS9.userOpts.fits.iydim || JS9.userOpts.fits.ymax,
		bin: JS9.userOpts.fits.ibin || 1
	    };
	} else {
	    JS9.fits.options.extlist =  JS9.globalOpts.extlist;
	    JS9.fits.options.table = {bin: (JS9.globalOpts.table.bin || 1)};
	    // NB: dims are deprecated 11/27/16
	    if( JS9.notNull(JS9.globalOpts.table.xdim) ){
		JS9.fits.options.table.xdim = JS9.globalOpts.table.xdim;
	    } else if( JS9.notNull(JS9.globalOpts.dims) ){
		JS9.fits.options.table.xdim = JS9.globalOpts.dims[0];
	    }
	    if( JS9.notNull(JS9.globalOpts.table.ydim) ){
		JS9.fits.options.table.ydim = JS9.globalOpts.table.ydim;
	    } else if( JS9.notNull(JS9.globalOpts.dims) ){
		JS9.fits.options.table.ydim = JS9.globalOpts.dims[1];
	    }
	    JS9.fits.options.image = {bin: (JS9.globalOpts.image.bin || 1)};
	    if( JS9.notNull(JS9.globalOpts.image.xdim) ){
		JS9.fits.options.image.xdim = JS9.globalOpts.image.xdim;
	    } else if( JS9.notNull(JS9.globalOpts.xmax) ){
		JS9.fits.options.image.xdim = JS9.globalOpts.xmax;
	    }
	    if( JS9.notNull(JS9.globalOpts.image.ydim) ){
		JS9.fits.options.image.ydim = JS9.globalOpts.image.ydim;
	    } else if( JS9.notNull(JS9.globalOpts.ymax) ){
		JS9.fits.options.image.ydim = JS9.globalOpts.ymax;
	    }
	}
	if( JS9.fits.maxFITSMemory && JS9.globalOpts.maxMemory ){
	    JS9.fits.maxFITSMemory(JS9.globalOpts.maxMemory);
	}
	break;
    default:
	JS9.error(`unknown fits library: ${s}`);
	break;
    }
    // common code
    JS9.fits.ready = true;
    JS9.fits.name = t;
    JS9.fits.options.error = JS9.error;
    JS9.fits.options.waiting = JS9.waiting;
    return t;
};

// check for 'real' FITS handling routine and call it. This routine can:
// read a blob as a FITS file
// open an existing virtual FITS file (e.g. created by Montage reprojection)
JS9.handleFITSFile = function(file, opts, handler){
    if( JS9.fits.handleFITSFile ){
	JS9.fits.handleFITSFile(file, opts, handler);
    } else {
	JS9.error("no FITS module available to process FITS file");
    }
};

// cleanup FITS file by deleting vfile, etc
JS9.cleanupFITSFile = function(raw, mode){
    let rexp;
    if( JS9.localMount ){
	rexp = new RegExp(`^${JS9.localMount}`);
    }
    if( JS9.fits.cleanupFITSFile && raw && raw.hdu && raw.hdu.fits ){
	// don't delete real local file
	if( rexp && raw.hdu.fits.vfile && raw.hdu.fits.vfile.match(rexp) ){
	    mode = false;
	}
	JS9.fits.cleanupFITSFile(raw.hdu.fits, mode);
	return true;
    }
    // just return if no available cleanup routine or no raw data file
    return false;
};

// load an image (jpeg, png, etc)
// taken from fitsy.js
JS9.handleImageFile = function(file, options, handler){
    const reader = new FileReader();
    options = $.extend(true, {}, JS9.fits.options, options);
    handler = handler || JS9.Load;
    reader.onload = (ev) => {
	let data, grey, hdu;
	const img = new Image();
	img.onload = () => {
	    let x, y, brightness, header;
	    let i = 0;
	    const canvas = document.createElement('canvas');
	    const ctx    = canvas.getContext('2d');
	    const h      = img.height;
	    const w      = img.width;
	    canvas.width  = w;
	    canvas.height = h;
	    ctx.drawImage(img, 0, 0);
	    data   = ctx.getImageData(0, 0, w, h).data;
	    grey   = new Float32Array(h*w);
	    for ( y = 0; y < h; y++ ) {
		for ( x = 0; x < w; x++ ) {
		    // NTSC
		    brightness = 0.299 * data[i] +
			         0.587 * data[i + 1] +
			         0.114 * data[i + 2];
		    grey[(h - y) * w + x] = brightness;
		    i += 4;
		}
	    }
	    header = {SIMPLE: true,
		      BITPIX: -32,
		      NAXIS: 2,
		      NAXIS1: w,
		      NAXIS2: h};
	    hdu = {head: header, filename: file.name, filedata: grey,
		   naxis: 2, axis: [0, w, h], bitpix: -32, bin: 1,
		   data: grey};
	    hdu.dmin = Number.MAX_VALUE;
	    hdu.dmax = Number.MIN_VALUE;
	    for(i=0; i< h*w; i++){
		if( !Number.isNaN(hdu.data[i]) ){
		    hdu.dmin = Math.min(hdu.dmin, hdu.data[i]);
		    hdu.dmax = Math.max(hdu.dmax, hdu.data[i]);
		}
	    }
	    handler(hdu, options);
	};
	img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
};

// check for 'real' FITS handling routine and call it
JS9.getFITSImage = function(fits, hdu, options, handler){
    if( JS9.fits.getFITSImage ){
	JS9.fits.getFITSImage(fits, hdu, options, handler);
    } else {
	JS9.error("no FITS module available to process FITS image");
    }
};

// common code for processing fits2fits and fits2png
// JS9.fits2repFile(display, file, opts, "png", "fits2png", func)
// JS9.fits2repFile(display, file, opts, "fits", "imsection")
JS9.fits2RepFile = function(display, file, opts, xtype, func){
    let i, s, xdim, ydim, bin, binMode, obj, xcond;
    const xopts = {};
    const xmsg = `fits2${xtype}`;
    xcond = opts[xmsg] || ((opts[xmsg] === undefined) && JS9.globalOpts[xmsg]);
    if( xcond === true ){
	xcond = "always";
    } else if(  xcond === false ){
	xcond = "never";
    }
    // check for repfile condition
    if( xcond.match(/never/i) ){
	return false;
    }
    // repfiles require a connected helper, a js9helper program, and a
    // socket.io connection
    if( !JS9.helper.connected ||
	(JS9.helper.type !== "nodejs" && JS9.helper.type !== "socket.io") ){
	if(  xcond === "always" && JS9.globalOpts.requireFits2Fits ){
	    JS9.error("can't run fits2fits without connected JS9 helper");
	}
	return false;
    }
    // if the helper program does not exist, we might want to throw an error
    if( !JS9.helper.js9helper ){
	if( JS9.globalOpts.requireFits2Fits ){
	    JS9.error("js9helper not found for fits2fits processing");
	} else {
	    return false;
	}
    }
    // sanity check and pre-processing
    switch(xmsg){
    case "fits2png":
	break;
    case "fits2fits":
	// requires a tmp workdir
	if( !JS9.globalOpts.workDir ){
	    if( JS9.globalOpts.requireFits2Fits ){
		JS9.error("can't run fits2fits without a workdir");
	    }
	    return false;
	}
	xdim =
	    opts.xdim ||
	    JS9.fits.options.image.xdim ||
	    JS9.fits.options.table.xdim;
	ydim =
	    opts.ydim ||
	    JS9.fits.options.image.ydim ||
	    JS9.fits.options.table.ydim;
	bin =
	    opts.bin ||
	    JS9.fits.options.image.bin ||
	    JS9.fits.options.table.bin;
	binMode = opts.binMode || JS9.globalOpts.binMode;
	binMode = binMode === "a" ? "a" : "";
	// handle string bin, possibly containing explicit binMode
	if( typeof bin === "string" ){
	    if( bin.match(/[as]$/) ){
		binMode = bin.slice(-1);
	    }
	    bin = parseInt(bin, 10);
	}
	bin = Math.max(1, bin || 1);
	if( opts.xcen !== undefined && opts.ycen !== undefined ){
	    xopts.sect = `${xdim}@${opts.xcen},${ydim}@${opts.ycen},${bin}${binMode}`;
	} else {
	    xopts.sect = `${xdim},${ydim},${bin}${binMode}`;
	}
	s = xcond.toLowerCase().split(/[>,]/);
	for(i=0; i<s.length; i++){
	    switch(s[i]){
	    case "size":
		if( s[i+1] ){
		    if( JS9.isNumber(s[i+1]) ){
			xopts.maxsize = parseFloat(s[i+1])*1000000;
		    }
		    i++;
		}
		break;
	    }
	}
	break;
    default:
	JS9.error(`unknown FITS representation type: ${xtype}`);
	break;
    }
    xopts.fits = JS9.cleanPath(file);
    xopts.parent = true;
    // start the waiting!
    JS9.waiting(true, display);
    // send message to helper to do conversion
    JS9.helper.send(xmsg, xopts, (r) => {
	let nfile, next, robj, rarr, f, pf, nopts;
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
	    // is it the correct file type
	    switch(xmsg){
	    case "fits2png":
		// last line is the file name (ignore what comes before)
		nfile = robj.stdout.replace(/\n*$/, "").split("\n").pop();
		next = nfile.split(".").pop().toLowerCase();
		// is it a png file?
		if( next === "png" ){
		    // new png file: call constructor, save the result
		    opts.source = "fits2png";
		    JS9.checkNew(new JS9.Image(nfile, opts, func));
		} else {
		    // not a png file ... give up
		    JS9.error(`fits2png conversion failed: ${nfile}`);
		}
		break;
	    case "fits2fits":
		// look for error condition, which we might throw or swallow
		if( robj.stdout.match(/^ERROR:/) ){
		    if( JS9.globalOpts.requireFits2Fits ){
			JS9.error(robj.stdout);
		    } else {
			robj.stdout = xopts.fits;
		    }
		}
		// output is file and possibly parentFile
		rarr = robj.stdout.split(/\n/);
		// file
		f = JS9.cleanPath(rarr[0]);
		if( f === xopts.fits ){
		    // same file (imsection not run)
		    nopts = $.extend(true, {}, opts);
		} else {
		    // new file using imsection
		    // relative path: add install dir prefix
		    if( f.charAt(0) !== "/" ){
			f = JS9.InstallDir(f);
		    }
		    nopts = $.extend(true, {}, opts);
		    // but remove already-used section properties from opts
		    delete nopts.xcen;
		    delete nopts.ycen;
		    delete nopts.bin;
		    // but load entire image section
		    if( nopts.xdim !== undefined ){ nopts.xdim = 0; }
		    if( nopts.ydim !== undefined ){ nopts.ydim = 0; }
		    // save source
		    nopts.source = "fits2fits";
		    // it's a proxy file (i.e., delete it on close)
		    nopts.proxyFile = f;
		    // json fits info
		    if( rarr[1] ){
			try{ obj = JSON.parse(rarr[1]); }
			catch(ignore){ /* empty */ }
			if( obj ){
			    nopts.extname = obj.extname;
			    nopts.extnum = obj.extnum;
			    nopts.hdus = obj.hdus;
			    nopts.parent = obj;
			}
		    }
		    // look for parentFile (relative to helper, not install)
		    if( rarr[2] ){
			pf = JS9.cleanPath(rarr[2]);
			nopts.parentFile = pf;
			// now add extension info, if possible
			if( nopts.extname ){
			    nopts.parentFile = nopts.parentFile
				.replace(/\[.*\]/, "");
			    nopts.parentFile += `[${nopts.extname}]`;
			} else if( nopts.extnum && (nopts.extnum > 0) ){
			    nopts.parentFile = nopts.parentFile
				.replace(/\[.*\]/, "");
			    nopts.parentFile.file += `[${nopts.extnum}]`;
			}

		    }
		    // add onload, if necessary
		    if( func ){
			nopts.onload = func;
		    }
		}
		// no recursion!
		nopts.fits2fits = false;
		// load new file
		JS9.Load(f, nopts, {display});
		break;
	    default:
		break;
	    }
	}
    });
    return true;
};

// return the specified colormap object (or default)
JS9.lookupColormap = function(name, mustExist){
    let i;
    // default is the id must exist
    if( mustExist === undefined ){
	mustExist = true;
    }
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
    if( mustExist ){
        JS9.error(`unknown colormap '${name}'`);
    } else {
	return null;
    }
};

// lookup command
JS9.lookupCommand = function(name){
    let cmd, i, n;
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
JS9.error = function(...args){
    let [emsg, epattern, dothrow] = args;
    let e, earr, i, s, im, cur;
    let emessage = "";
    let stack = "";
    let doerr = true;
    // reset wait cursor
    JS9.waiting(false);
    // set fetch error status, if coming from a fetch
    if( JS9.fetchURL.status === "processing" ){
	JS9.fetchURL.status = "error";
    }
    // set current error status, if we find it
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	cur = im.status.cur;
	if( cur && im.status[cur] ){
	    im.setStatus(cur, "error");
	}
    }
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
    if( args.length < 3 ){
	dothrow = true;
    }
    // maybe throw error and send message to user
    if( doerr ){
	// add error object message to emsg, if possible
	if( e && e.message ){
	    emsg += ` (${e.message})`;
	} else if( emsg ){
	    e = new Error(emsg);
	}
	// try to add stacktrace
	s = JS9.strace(e);
	if( s ){
	    stack = `\n\nStacktrace:\n${s}`;
	}
	// can be set "outside" to prevent the alert message
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

// log to console
JS9.log = function(...args) {
    if( (window.console !== undefined) && (window.console.log !== undefined) ){
	// eslint-disable-next-line no-console
        console.log(...args);
    }
};

// we use keydown instead of keypress, so we need ...
// http://stackoverflow.com/questions/2220196/how-to-decode-character-pressed-from-jquerys-keydowns-event-handler
// ... for conversion of keydown into char string
JS9.eventToCharStr = function(evt){
    let c, s;
    const _specialKeys = {
	'37': 'leftArrow',
	'38': 'upArrow',
	'39': 'rightArrow',
	'40': 'downArrow',
	 '8': 'delete',
	'46': 'delete'
    };
    const _to_ascii = {
        '188': '44',
        '109': '45',
        '190': '46',
        '191': '47',
        '192': '96',
        '220': '92',
        '222': '39',
        '221': '93',
        '219': '91',
        '173': '45',
        '187': '61', //IE Key codes
        '186': '59', //IE Key codes
        '189': '45'  //IE Key codes
    };
    const _shiftUps = {
        "96": "~",
        "49": "!",
        "50": "@",
        "51": "#",
        "52": "$",
        "53": "%",
        "54": "^",
        "55": "&",
        "56": "*",
        "57": "(",
        "48": ")",
        "45": "_",
        "61": "+",
        "91": "{",
        "93": "}",
        "92": "|",
        "59": ":",
        "39": "\"",
        "44": "<",
        "46": ">",
        "47": "?"
    };
    // allow direct specification of keycode as a number
    if( typeof evt === "number" ){
	c = evt;
    } else {
	// otherwise its the event
	c = evt.which || evt.keyCode;
    }
    s = String(c);
    // normalize keyCode
    if( _to_ascii.hasOwnProperty(s) ){
        c = _to_ascii[s];
    }
    if( !evt.shiftKey && (c >= 65 && c <= 90) ){
        c = String.fromCharCode(c + 32);
    } else if( !evt.shiftKey && _specialKeys.hasOwnProperty(c) ){
        c = _specialKeys[c];
    } else if( evt.shiftKey && _shiftUps.hasOwnProperty(c) ){
        //get shifted keyCode value
        c = _shiftUps[c];
    } else {
        c = String.fromCharCode(c);
    }
    // check for special key
    if( JS9.specialKey(evt) ){
	c = `M-${c}`;
    }
    return c;
};

// get position of mouse in a canvas
// http://stackoverflow.com/questions/1114465/getting-mouse-location-in-canvas
JS9.eventToDisplayPos = function(evt, offset){
    // from http://www.quirksmode.org/js/events_properties.html
    let i, targ, pageX, pageY, leftOff, upOff, touches, pos;
    const XFUDGE = 1;
    const YFUDGE = 1;
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
    // touch positions, if necessary
    if( touches && touches.length ){
	pos.touches = [{x: pos.x, y: pos.y}];
	for(i=1; i<touches.length; i++){
	    pos.touches[i] = {x: Math.floor(touches[i].pageX - leftOff),
			      y: Math.floor(touches[i].pageY - upOff)};
	}
    }
    return pos;
};

// convert image pixels in one image to image pixels in another image
// NB: assumes both images have wcs available
JS9.pix2pix = function(im1, im2, obj){
    let s, ra, dec, x, y, nx, ny;
    const epsilon = 0.5;
    // sanity check
    if( !im1 || !im2 || !im1.raw.wcs || !im2.raw.wcs ){
	return obj;
    }
    // convenience variables
    x = obj.x;
    y = obj.y;
    // convert image pixels to ra, dec in source image
    s = JS9.pix2wcs(im1.raw.wcs, x, y).trim().split(/\s+/);
    ra = JS9.saostrtod(s[0]);
    if( (String.fromCharCode(JS9.saodtype()) === ":") &&
	(im1.params.wcssys !== "galactic" )           &&
	(im1.params.wcssys !== "ecliptic" )           ){
	ra *= 15.0;
    }
    dec = JS9.saostrtod(s[1]);
    // convert ra, dec to image coords in dest image
    s = JS9.wcs2pix(im2.raw.wcs, ra, dec).trim().split(/\s+/);
    nx = parseFloat(s[0]);
    ny = parseFloat(s[1]);
    // lord, save us from wcs transformation jitter
    if( Math.abs(nx - x) < epsilon ){ nx = x; }
    if( Math.abs(ny - y) < epsilon ){ ny = y; }
    // return image pixels
    return {x: nx, y: ny};
};

// http://stackoverflow.com/questions/13695317/rotate-a-point-around-another-point
// angle is input in degrees
JS9.rotatePoint = function(point, angle, cen)
{
    let cosA, sinA;
    cen = cen || {x: 0.0, y: 0.0};
    angle = Math.PI * angle / 180.0;
    cosA = Math.cos(angle);
    sinA = Math.sin(angle);
    return {
        x: (cosA * (point.x - cen.x) - sinA * (point.y - cen.y) + cen.x),
	y: (sinA * (point.x - cen.x) + cosA * (point.y - cen.y) + cen.y)
    };
};

// invert a 3x3 matrix
JS9.invertMatrix3 = function(xin){
    let i, j, det_1;
    let pos = 0.0;
    let neg = 0.0;
    let temp =  xin[0][0] * xin[1][1];
    const prec = 1.0e-15;
    const xout = [[0,0,0], [0,0,0], [0,0,0]];
    const accum = () => {
	if( temp >= 0.0 ){
	    pos += temp;
	} else {
	    neg += temp;
	}
    };
    // sanity check for NaN
    for(i=0; i<3; i++){
	for(j=0; j<2; j++){
	    if( (xin[i][j] === undefined) || Number.isNaN(xin[i][j]) ){
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

// is this a string representation of a number?
JS9.isNumber = function(s) {
    const d = Number.parseFloat(s);
    return !Number.isNaN(d) && Number.isFinite(d);
};

// check if a variable is neither undefined nor null
JS9.notNull = function(s) {
    return s !== undefined && s !== null;
};

// check if a variable is either undefined or null
JS9.isNull = function(s) {
    return s === undefined || s === null;
};

// parse a FITS card and return name and value
JS9.cardpars = function(card){
    let value;
    let name = card.slice(0, 8).trim();
    if( name === "HISTORY" ){ return [name, card.slice(9).trim()]; }
    if( name === "COMMENT" ){ return [name, card.slice(9).trim()]; }
    if( card[8] !== "=" ){ return undefined; }
    value = card.slice(10).replace(/'/g, " ").replace(/ \/.*/, "").trim();
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
JS9.raw2FITS = function(raw, opts){
    let i, s, obj, key, val, card, ncard, header, left;
    let hasend = false;
    let t = "";
    const gots = {};
    const fixparam = (card, name, val, comm) => {
	let s, oval, regexp;
	let ncard = card;
	if( name === "XTENSION" && !val ){
	    ncard = sprintf("%s  = %20s / %-47s",
			    "SIMPLE",
			    "T",
			    "file does conform to FITS standard");

	} else {
	    // eslint-disable-next-line no-useless-escape
	    regexp = new RegExp(`${name} *= *(-?[-+]?[0-9]*\.?[0-9]*([eE][-+]?[0-9]+)?) *`);
	    if( card ){
		s = card.replace(regexp, "$1");
		oval = parseFloat(s);
	    } else {
		oval = undefined;
	    }
	    if( oval !== val ){
		ncard = sprintf("%-8s= %20s / %-47s", name, val, comm||"");
	    }
	}
	gots[name] = true;
	return ncard;
    };
    // sanity check
    if( !raw ){
	return t;
    }
    // opts is optional
    opts = opts || {};
    // backward compatibility: orig. version used boolean to specify addcr
    if( typeof opts === "boolean" ){
	opts = {addcr: opts};
    }
    // raw.card and raw.cardstr contain comments: use them if possible
    if( raw.card || raw.cardstr ){
	header = raw.header || {};
	if( raw.card ){
	    ncard = raw.card.length;
	} else {
	    ncard = raw.ncard;
	}
	for(i=0; i<ncard; i++){
	    if( raw.card ){
		card = raw.card[i].slice(0, 80);
	    } else {
		card = raw.cardstr.slice(i*80, (i+1)*80);
	    }
	    if( opts.notab && card.match(/^TAB(TYP|MIN|MAX|DIM)[1,2]/) ){
		continue;
	    }
	    // change values which get set in mkRawDataFromHDU()
	    if( card.match(/^XTENSION/) && i === 0 && opts.simple ){
		t += fixparam(card, "XTENSION");
	    } else if( card.match(/^BITPIX /) && raw.bitpix ){
		t += fixparam(card, "BITPIX", raw.bitpix, "bits/pixel");
	    } else if( card.match(/^NAXIS1 /) && raw.width ){
		t += fixparam(card, "NAXIS1", raw.width, "x image dim");
	    } else if( card.match(/^NAXIS2 /) && raw.height ){
		t += fixparam(card, "NAXIS2", raw.height, "y image dim");
	    } else if( card.match(/^CRPIX1 /) && JS9.notNull(header.CRPIX1) ){
		t += fixparam(card, "CRPIX1", header.CRPIX1, "ref point");
	    } else if( card.match(/^CRPIX2 /) && JS9.notNull(header.CRPIX2) ){
		t += fixparam(card, "CRPIX2", header.CRPIX2, "ref point");
	    } else if( card.match(/^CDELT1 /) && JS9.notNull(header.CDELT1) ){
		t += fixparam(card, "CDELT1", header.CDELT1, "deg/pixel");
	    } else if( card.match(/^CDELT2 /) && JS9.notNull(header.CDELT2) ){
		t += fixparam(card, "CDELT2", header.CDELT2, "deg/pixel");
	    } else if( card.match(/^CD1_1 /) && JS9.notNull(header.CD1_1) ){
		t += fixparam(card, "CD1_1", header.CD1_1, "WCS matrix value");
	    } else if( card.match(/^CD1_2 /) && JS9.notNull(header.CD1_2) ){
		t += fixparam(card, "CD1_2", header.CD1_2, "WCS matrix value");
	    } else if( card.match(/^CD2_1 /) && JS9.notNull(header.CD2_1) ){
		t += fixparam(card, "CD2_1", header.CD2_1, "WCS matrix value");
	    } else if( card.match(/^CD2_2 /) && JS9.notNull(header.CD2_2) ){
		t += fixparam(card, "CD2_2", header.CD2_2, "WCS matrix value");
	    } else if( card.match(/^LTV1 /) && JS9.notNull(header.LTV1) ){
		t += fixparam(card, "LTV1", header.LTV1, "IRAF ref. point");
	    } else if( card.match(/^LTV2 /) && JS9.notNull(header.LTV2) ){
		t += fixparam(card, "LTV2", header.LTV2, "IRAF ref. point");
	    } else if( card.match(/^LTM1_1 /) && JS9.notNull(header.LTM1_1) ){
		t += fixparam(card, "LTM1_1", header.LTM1_1, "IRAF matrix value");
	    } else if( card.match(/^LTM1_2 /) && JS9.notNull(header.LTM1_2) ){
		t += fixparam(card, "LTM1_2", header.LTM1_2, "IRAF matrix value");
	    } else if( card.match(/^LTM2_1 /) && JS9.notNull(header.LTM2_1) ){
		t += fixparam(card, "LTM2_1", header.LTM2_1, "IRAF matrix value");
	    } else if( card.match(/^LTM2_2 /) && JS9.notNull(header.LTM2_2) ){
		t += fixparam(card, "LTM2_2", header.LTM2_2, "IRAF matrix value");
	    } else if( opts.twoaxes && card.match(/^NAXIS /) ){
		t += fixparam(card, "NAXIS", 2, "number of data axes");
	    } else if( opts.twoaxes && card.match(/^(NAXIS|CRPIX|CRVAL|CTYPE|CUNIT|CDELT)[34567]/) ){
		continue;
	    } else if( opts.twoaxes && card.match(/^(DATASUM|CHECKSUM)/) ){
		continue;
	    } else if( card.substring(0,4) === "END " ){
		// try to add LTM/LTV if they were not present originally
		if( JS9.notNull(header.LTV1) && !gots.LTV1 ){
		    t += fixparam(null, "LTV1", header.LTV1, "IRAF ref. point");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTV2) && !gots.LTV2 ){
		    t += fixparam(null, "LTV2", header.LTV2, "IRAF ref. point");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTM1_1) && !gots.LTM1_1 ){
		    t += fixparam(null, "LTM1_1", header.LTM1_1, "IRAF matrix value");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTM1_2) && !gots.LTM1_2 ){
		    t += fixparam(null, "LTM1_2", header.LTM1_2, "IRAF matrix value");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTM2_1) && !gots.LTM2_1 ){
		    t += fixparam(null, "LTM2_1", header.LTM2_1, "IRAF matrix value");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTM2_2) && !gots.LTM2_2 ){
		    t += fixparam(null, "LTM2_2", header.LTM2_2, "IRAF matrix value");
		    if( opts.addcr ){ t += "\n"; }
		}
		// add the end card
		t += card;
		// mark we did so
		hasend = true;
	    } else {
		t += card;
	    }
	    if( opts.addcr ){
		t += "\n";
	    }
	}
    } else if( raw.header || raw.BITPIX ){
	if( raw.header ){
	    // minimal header without comments
	    obj = raw.header;
	} else {
	    // directly specified object containing header without comments
	    obj = raw;
	}
	// cfitsio requires simple and bitpix to be first and second params
	if( obj.SIMPLE !== undefined || obj.simple !== undefined ){
	    if( obj.SIMPLE !== undefined ){
		val = obj.SIMPLE;
	    } else {
		val = obj.simple;
	    }
	    if( val === true ){
		val = "T";
	    } else if( val === false ){
		val = "F";
	    }
	    t += sprintf("%-8s= %20s / %-47s", "SIMPLE", val, "conforms to FITS standard");
	    if( opts.addcr ){ t += "\n"; }
	}
	if( obj.BITPIX !== undefined || obj.bitpix !== undefined ){
	    if( obj.BITPIX !== undefined ){
		val = obj.BITPIX;
	    } else {
		val = obj.bitpix;
	    }
	    t += sprintf("%-8s= %20s / %-47s", "BITPIX", val, "bits/pixel");
	    if( opts.addcr ){ t += "\n"; }
	}
	for( key in obj ){
	    if( obj.hasOwnProperty(key) ){
		if( key === "js9Protocol" || key === "js9Endian" ){
		    continue;
		}
		if( key === "SIMPLE" || key === "simple" ){
		    continue;
		}
		if( key === "BITPIX" || key === "bitpix" ){
		    continue;
		}
		if( key === "END" ){
		    hasend = true;
		}
		if( key.match(/HISTORY__[0-9]+/) ){
		    t += sprintf("HISTORY %-72s", obj[key]);
		} else if( key.match(/COMMENT__[0-9]+/) ){
		    t += sprintf("COMMENT %-72s", obj[key]);
		} else {
		    val = obj[key];
		    if( val === true ){
			val = "T";
		    } else if( val === false ){
			val = "F";
		    } else if( val === "" ){
			val = "' '";
		    } else if( Number.isNaN(val) ){
			val = "NaN";
		    } else if( !JS9.isNumber(val) && val.charAt(0) !== "'" ){
			val = `'${val}'`;
		    }
		    s = sprintf("%-8s= %20s", key, val);
		    left = 80 - s.length;
		    if( left > 0 ){
			for(i=0; i<left; i++){
			  s += " ";
			}
		    }
		    t += s;
		}
		if( opts.addcr ){
		    t += "\n";
		}
	    }
	}
    }
    // add end card, if necessary
    if( !hasend ){
	t += sprintf("%-8s%-72s", "END", " ");
	if( opts.addcr ){
	    t += "\n";
	}
    }
    return t;
};

// convert an array of hdu objects into a nice string
JS9.hdus2Str = function(hdus){
    let i, j, s, obj;
    let t = "";
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
		t += `${obj.cols[j].name}`;
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
    let tipstr, tx, ty, w, h;
    const fmt2str = (str) => {
	// eslint-disable-next-line no-unused-vars
	const cmd = str.replace(/\$([a-zA-Z0-9_./]+)/g, function(m, t, o){
            let i, v, val;
	    const arr = t.split(".");
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
		v = val[arr[i]];
		if( JS9.isNumber(v) ){
		    val = v.toFixed(6);
		} else {
		    val = v;
		}
	    }
	    if( val === undefined ){
		val = "";
	    }
	    return val;
	});
	return cmd;
    };
    if( fmt ){
	tipstr = fmt2str(fmt);
	im.display.tooltip.html(tipstr);
	// get size of div ...
	w = im.display.tooltip.width();
	h = im.display.tooltip.height();
	// ... so we can place the tooltip properly
	tx = Math.max(2, Math.min(x, im.display.width - (w + 10)));
	ty = Math.max(2, Math.min(y, im.display.height - (h + 10)));
	im.display.tooltip.css({left:tx, top:ty, display: "inline-block"});
    } else {
	im.display.tooltip
	    .html("").css({left: -9999, display: "none"});
    }
};

// http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
// our modification will execute a real func or a funcName
JS9.xeqByName = function(...args) {
    let i, namespaces, func;
    let [funcName, context] = args;
    let xargs = args.slice(2);
    let type = typeof funcName;
    switch( type ){
    case "function":
	return funcName.apply(context, xargs);
    case "string":
	namespaces = funcName.split(".");
	func = namespaces.pop();
	for(i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
	}
	return context[func](...xargs);
    default:
	JS9.error(`unknown func type: ${type}`);
	break;
    }
};

// return value of a variable passed as a string (based on above)
JS9.varByName = function(funcName, context){
    let i, namespaces, vname;
    context = context || JS9;
    namespaces = funcName.split(".");
    vname = namespaces.pop();
    for(i=0; i<namespaces.length; i++) {
	context = context[namespaces[i]];
	if( !context ){
	    return null;
	}
    }
    return context[vname];
};

// merge preferences into global JS9 object
JS9.mergePrefs = function(obj){
    let otype, jtype, name;
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
			$.extend(JS9[name], obj[name]);
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
};

// load a prefs file and merge preferences into global JS9 object
JS9.loadPrefs = function(url, doerr) {
    // load site/user preferences synchronously
    $.ajax({
      url: url,
      cache: false,
      dataType: "json",
      mimeType: "application/json",
      async: false,
      success: (obj) => {
	  JS9.mergePrefs(obj);
      },
      error: (jqXHR, textStatus, errorThrown) => {
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
    let type;
    const types = {
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

// starbase table support
// tab-delimited ascii tables, # in first line is a comment
JS9.Starbase = function(s, opts){
    let i, j, skips, dashes, data, cobj;
    let line = 0;
    const checkDashline = (dash) => {
	let i;
	for(i=0; i<dash.length; i++){
	    if( dash[i].match(/^-+$/) === null ){
		return 0;
	    }
	}
	return i;
    };
    const I = (x) => { return x; };
    // init returned object
    this.head = {};
    this.convFuncs = [];
    this.data = [];
    this.delims = [];
    // sanity check
    if( !s ){
	return;
    }
    // opts is optional
    opts = opts || {};
    // get array of data lines
    data = s.replace(/\s+$/,"").split("\n");
    // skip comments
    if( opts.skip ){
	skips = opts.skip.split("");
	if( skips && skips.length ){
	    for(; line < data.length; line++){
		if( (skips[0] !== data[line][0])             &&
		    (skips[1] !== "\n" || data[line] !== "") ){
		    break;
		}
	    }
	}
    }
    // make sure we have a header to process
    if(  (data[line] === undefined) || (data[line+1] === undefined)  ){
	return;
    }
    // look for header and dashes, in various guises
    this.headline = data[line++].trim().split(/ *\t */);
    if( opts.units ){
	this.unitline = data[line++].trim().split(/ *\t */);
    }
    this.dashline = data[line++].trim().split(/ *\t */);
    dashes = checkDashline(this.dashline);
    // read lines until the dashline is found
    while ( dashes === 0 || dashes !== this.headline.length ){
	if( !opts.units ){
	    this.headline = this.dashline;
	} else {
	    this.headline = this.unitline;
	    this.unitline = this.dashline;
	}
	this.dashline = data[line++].trim().split(/ *\t */);
	dashes = checkDashline(this.dashline);
    }
    // process header:
    // replace "." with "_" in header names
    // create a vector of type converter funcs
    for(i=0; i<this.headline.length; i++ ){
	this.headline[i] = this.headline[i].replace(/\./g, "_");
	if( opts.convFuncs && opts.convFuncs[this.headline[i]] ){
	    this.convFuncs[i] = opts.convFuncs[this.headline[i]];
	} else {
	    if( opts.convFuncs && opts.convFuncs.def ){
		this.convFuncs[i] = opts.convFuncs.def;
	    } else {
		this.convFuncs[i] = I;
	    }
	}
    }
    // read each line of the data in and convert to type
    for(j = 0; line < data.length; line++, j++){
	// skip means end of data
	if( skips && skips.length ){
	    if( (skips[0] === data[line][0])             ||
		(skips[1] === "\n" && data[line] === "") ){
		break;
	    }
	}
	this.data[j] = data[line].split('\t');
	for(i=0; i<this.data[j].length; i++){
	    cobj = this.convFuncs[i](this.data[j][i]);
	    this.data[j][i] = cobj.val;
	    this.delims[i] = cobj.delim || null;
	}
    }
    // convenience indexes
    for(i = 0; i < this.headline.length; i++){
	this[this.headline[i]] = i;
    }
};

// http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
// NB: colors are augmented by /opt/X11//share/X11/rgb.txt
JS9.colorToHex = function(color){
    let arr;
    const colors = {
"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff","beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887","cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff","darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f","darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1","darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff","gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f","honeydew":"#f0fff0","hotpink":"#ff69b4","indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c","lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2","lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de","lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee","mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5","navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6","palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080","rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4","tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5","yellow":"#ffff00","yellowgreen":"#9acd3","antiquewhite1":"#ffefdb","antiquewhite2":"#eedfcc","antiquewhite3":"#cdc0b0","antiquewhite4":"#8b8378","cadetblue1":"#98f5ff","cadetblue2":"#8ee5ee","cadetblue3":"#7ac5cd","cadetblue4":"#53868b","darkgoldenrod1":"#ffb90f","darkgoldenrod2":"#eead0e","darkgoldenrod3":"#cd950c","darkgoldenrod4":"#8b6508","darkgrey":"#a9a9a9","darkolivegreen1":"#caff70","darkolivegreen2":"#bcee68","darkolivegreen3":"#a2cd5a","darkolivegreen4":"#6e8b3d","darkorange1":"#ff7f00","darkorange2":"#ee7600","darkorange3":"#cd6600","darkorange4":"#8b4500","darkorchid1":"#bf3eff","darkorchid2":"#b23aee","darkorchid3":"#9a32cd","darkorchid4":"#68228b","darkseagreen1":"#c1ffc1","darkseagreen2":"#b4eeb4","darkseagreen3":"#9bcd9b","darkseagreen4":"#698b69","darkslategray1":"#97ffff","darkslategray2":"#8deeee","darkslategray3":"#79cdcd","darkslategray4":"#528b8b","darkslategrey":"#2f4f4f","deeppink1":"#ff1493","deeppink2":"#ee1289","deeppink3":"#cd1076","deeppink4":"#8b0a50","deepskyblue1":"#00bfff","deepskyblue2":"#00b2ee","deepskyblue3":"#009acd","deepskyblue4":"#00688b","dimgrey":"#696969","dodgerblue1":"#1e90ff","dodgerblue2":"#1c86ee","dodgerblue3":"#1874cd","dodgerblue4":"#104e8b","hotpink1":"#ff6eb4","hotpink2":"#ee6aa7","hotpink3":"#cd6090","hotpink4":"#8b3a62","indianred":"#cd5c5c","indianred1":"#ff6a6a","indianred2":"#ee6363","indianred3":"#cd5555","indianred4":"#8b3a3a","lavenderblush1":"#fff0f5","lavenderblush2":"#eee0e5","lavenderblush3":"#cdc1c5","lavenderblush4":"#8b8386","lemonchiffon1":"#fffacd","lemonchiffon2":"#eee9bf","lemonchiffon3":"#cdc9a5","lemonchiffon4":"#8b8970","lightblue1":"#bfefff","lightblue2":"#b2dfee","lightblue3":"#9ac0cd","lightblue4":"#68838b","lightcyan1":"#e0ffff","lightcyan2":"#d1eeee","lightcyan3":"#b4cdcd","lightcyan4":"#7a8b8b","lightgoldenrod":"#eedd82","lightgoldenrod1":"#ffec8b","lightgoldenrod2":"#eedc82","lightgoldenrod3":"#cdbe70","lightgoldenrod4":"#8b814c","lightgray":"#d3d3d3","lightpink1":"#ffaeb9","lightpink2":"#eea2ad","lightpink3":"#cd8c95","lightpink4":"#8b5f65","lightsalmon1":"#ffa07a","lightsalmon2":"#ee9572","lightsalmon3":"#cd8162","lightsalmon4":"#8b5742","lightskyblue1":"#b0e2ff","lightskyblue2":"#a4d3ee","lightskyblue3":"#8db6cd","lightskyblue4":"#607b8b","lightslateblue":"#8470ff","lightslategrey":"#778899","lightsteelblue1":"#cae1ff","lightsteelblue2":"#bcd2ee","lightsteelblue3":"#a2b5cd","lightsteelblue4":"#6e7b8b","lightyellow1":"#ffffe0","lightyellow2":"#eeeed1","lightyellow3":"#cdcdb4","lightyellow4":"#8b8b7a","mediumorchid1":"#e066ff","mediumorchid2":"#d15fee","mediumorchid3":"#b452cd","mediumorchid4":"#7a378b","mediumpurple1":"#ab82ff","mediumpurple2":"#9f79ee","mediumpurple3":"#8968cd","mediumpurple4":"#5d478b","mistyrose1":"#ffe4e1","mistyrose2":"#eed5d2","mistyrose3":"#cdb7b5","mistyrose4":"#8b7d7b","navajowhite1":"#ffdead","navajowhite2":"#eecfa1","navajowhite3":"#cdb38b","navajowhite4":"#8b795e","navyblue":"#000080","olivedrab1":"#c0ff3e","olivedrab2":"#b3ee3a","olivedrab3":"#9acd32","olivedrab4":"#698b22","orangered1":"#ff4500","orangered2":"#ee4000","orangered3":"#cd3700","orangered4":"#8b2500","palegreen1":"#9aff9a","palegreen2":"#90ee90","palegreen3":"#7ccd7c","palegreen4":"#548b54","paleturquoise1":"#bbffff","paleturquoise2":"#aeeeee","paleturquoise3":"#96cdcd","paleturquoise4":"#668b8b","palevioletred1":"#ff82ab","palevioletred2":"#ee799f","palevioletred3":"#cd6889","palevioletred4":"#8b475d","peachpuff1":"#ffdab9","peachpuff2":"#eecbad","peachpuff3":"#cdaf95","peachpuff4":"#8b7765","rosybrown1":"#ffc1c1","rosybrown2":"#eeb4b4","rosybrown3":"#cd9b9b","rosybrown4":"#8b6969","royalblue1":"#4876ff","royalblue2":"#436eee","royalblue3":"#3a5fcd","royalblue4":"#27408b","seagreen1":"#54ff9f","seagreen2":"#4eee94","seagreen3":"#43cd80","seagreen4":"#2e8b57","skyblue1":"#87ceff","skyblue2":"#7ec0ee","skyblue3":"#6ca6cd","skyblue4":"#4a708b","slateblue1":"#836fff","slateblue2":"#7a67ee","slateblue3":"#6959cd","slateblue4":"#473c8b","slategray1":"#c6e2ff","slategray2":"#b9d3ee","slategray3":"#9fb6cd","slategray4":"#6c7b8b","slategrey":"#708090","springgreen1":"#00ff7f","springgreen2":"#00ee76","springgreen3":"#00cd66","springgreen4":"#008b45","steelblue1":"#63b8ff","steelblue2":"#5cacee","steelblue3":"#4f94cd","steelblue4":"#36648b","violetred":"#d02090","violetred1":"#ff3e96","violetred2":"#ee3a8c","violetred3":"#cd3278","violetred4":"#8b2252","webgray":"#808080","webgreen":"#008000","webgrey":"#808080","webmaroon":"#800000","webpurple":"#800080","x11gray":"#bebebe","x11green":"#00ff00","x11grey":"#bebebe","x11maroon":"#b03060","x11purple":"#a020f0","aquamarine1":"#7fffd4","aquamarine2":"#76eec6","aquamarine3":"#66cdaa","aquamarine4":"#458b74","azure1":"#f0ffff","azure2":"#e0eeee","azure3":"#c1cdcd","azure4":"#838b8b","bisque1":"#ffe4c4","bisque2":"#eed5b7","bisque3":"#cdb79e","bisque4":"#8b7d6b","blue1":"#0000ff","blue2":"#0000ee","blue3":"#0000cd","blue4":"#00008b","brown1":"#ff4040","brown2":"#ee3b3b","brown3":"#cd3333","brown4":"#8b2323","burlywood1":"#ffd39b","burlywood2":"#eec591","burlywood3":"#cdaa7d","burlywood4":"#8b7355","chartreuse1":"#7fff00","chartreuse2":"#76ee00","chartreuse3":"#66cd00","chartreuse4":"#458b00","chocolate1":"#ff7f24","chocolate2":"#ee7621","chocolate3":"#cd661d","chocolate4":"#8b4513","coral1":"#ff7256","coral2":"#ee6a50","coral3":"#cd5b45","coral4":"#8b3e2f","cornsilk1":"#fff8dc","cornsilk2":"#eee8cd","cornsilk3":"#cdc8b1","cornsilk4":"#8b8878","cyan1":"#00ffff","cyan2":"#00eeee","cyan3":"#00cdcd","cyan4":"#008b8b","firebrick1":"#ff3030","firebrick2":"#ee2c2c","firebrick3":"#cd2626","firebrick4":"#8b1a1a","gold1":"#ffd700","gold2":"#eec900","gold3":"#cdad00","gold4":"#8b7500","goldenrod1":"#ffc125","goldenrod2":"#eeb422","goldenrod3":"#cd9b1d","goldenrod4":"#8b6914","gray0":"#000000","gray1":"#030303","gray10":"#1a1a1a","gray100":"#ffffff","gray11":"#1c1c1c","gray12":"#1f1f1f","gray13":"#212121","gray14":"#242424","gray15":"#262626","gray16":"#292929","gray17":"#2b2b2b","gray18":"#2e2e2e","gray19":"#303030","gray2":"#050505","gray20":"#333333","gray21":"#363636","gray22":"#383838","gray23":"#3b3b3b","gray24":"#3d3d3d","gray25":"#404040","gray26":"#424242","gray27":"#454545","gray28":"#474747","gray29":"#4a4a4a","gray3":"#080808","gray30":"#4d4d4d","gray31":"#4f4f4f","gray32":"#525252","gray33":"#545454","gray34":"#575757","gray35":"#595959","gray36":"#5c5c5c","gray37":"#5e5e5e","gray38":"#616161","gray39":"#636363","gray4":"#0a0a0a","gray40":"#666666","gray41":"#696969","gray42":"#6b6b6b","gray43":"#6e6e6e","gray44":"#707070","gray45":"#737373","gray46":"#757575","gray47":"#787878","gray48":"#7a7a7a","gray49":"#7d7d7d","gray5":"#0d0d0d","gray50":"#7f7f7f","gray51":"#828282","gray52":"#858585","gray53":"#878787","gray54":"#8a8a8a","gray55":"#8c8c8c","gray56":"#8f8f8f","gray57":"#919191","gray58":"#949494","gray59":"#969696","gray6":"#0f0f0f","gray60":"#999999","gray61":"#9c9c9c","gray62":"#9e9e9e","gray63":"#a1a1a1","gray64":"#a3a3a3","gray65":"#a6a6a6","gray66":"#a8a8a8","gray67":"#ababab","gray68":"#adadad","gray69":"#b0b0b0","gray7":"#121212","gray70":"#b3b3b3","gray71":"#b5b5b5","gray72":"#b8b8b8","gray73":"#bababa","gray74":"#bdbdbd","gray75":"#bfbfbf","gray76":"#c2c2c2","gray77":"#c4c4c4","gray78":"#c7c7c7","gray79":"#c9c9c9","gray8":"#141414","gray80":"#cccccc","gray81":"#cfcfcf","gray82":"#d1d1d1","gray83":"#d4d4d4","gray84":"#d6d6d6","gray85":"#d9d9d9","gray86":"#dbdbdb","gray87":"#dedede","gray88":"#e0e0e0","gray89":"#e3e3e3","gray9":"#171717","gray90":"#e5e5e5","gray91":"#e8e8e8","gray92":"#ebebeb","gray93":"#ededed","gray94":"#f0f0f0","gray95":"#f2f2f2","gray96":"#f5f5f5","gray97":"#f7f7f7","gray98":"#fafafa","gray99":"#fcfcfc","green1":"#00ff00","green2":"#00ee00","green3":"#00cd00","green4":"#008b00","grey":"#bebebe","grey0":"#000000","grey1":"#030303","grey10":"#1a1a1a","grey100":"#ffffff","grey11":"#1c1c1c","grey12":"#1f1f1f","grey13":"#212121","grey14":"#242424","grey15":"#262626","grey16":"#292929","grey17":"#2b2b2b","grey18":"#2e2e2e","grey19":"#303030","grey2":"#050505","grey20":"#333333","grey21":"#363636","grey22":"#383838","grey23":"#3b3b3b","grey24":"#3d3d3d","grey25":"#404040","grey26":"#424242","grey27":"#454545","grey28":"#474747","grey29":"#4a4a4a","grey3":"#080808","grey30":"#4d4d4d","grey31":"#4f4f4f","grey32":"#525252","grey33":"#545454","grey34":"#575757","grey35":"#595959","grey36":"#5c5c5c","grey37":"#5e5e5e","grey38":"#616161","grey39":"#636363","grey4":"#0a0a0a","grey40":"#666666","grey41":"#696969","grey42":"#6b6b6b","grey43":"#6e6e6e","grey44":"#707070","grey45":"#737373","grey46":"#757575","grey47":"#787878","grey48":"#7a7a7a","grey49":"#7d7d7d","grey5":"#0d0d0d","grey50":"#7f7f7f","grey51":"#828282","grey52":"#858585","grey53":"#878787","grey54":"#8a8a8a","grey55":"#8c8c8c","grey56":"#8f8f8f","grey57":"#919191","grey58":"#949494","grey59":"#969696","grey6":"#0f0f0f","grey60":"#999999","grey61":"#9c9c9c","grey62":"#9e9e9e","grey63":"#a1a1a1","grey64":"#a3a3a3","grey65":"#a6a6a6","grey66":"#a8a8a8","grey67":"#ababab","grey68":"#adadad","grey69":"#b0b0b0","grey7":"#121212","grey70":"#b3b3b3","grey71":"#b5b5b5","grey72":"#b8b8b8","grey73":"#bababa","grey74":"#bdbdbd","grey75":"#bfbfbf","grey76":"#c2c2c2","grey77":"#c4c4c4","grey78":"#c7c7c7","grey79":"#c9c9c9","grey8":"#141414","grey80":"#cccccc","grey81":"#cfcfcf","grey82":"#d1d1d1","grey83":"#d4d4d4","grey84":"#d6d6d6","grey85":"#d9d9d9","grey86":"#dbdbdb","grey87":"#dedede","grey88":"#e0e0e0","grey89":"#e3e3e3","grey9":"#171717","grey90":"#e5e5e5","grey91":"#e8e8e8","grey92":"#ebebeb","grey93":"#ededed","grey94":"#f0f0f0","grey95":"#f2f2f2","grey96":"#f5f5f5","grey97":"#f7f7f7","grey98":"#fafafa","grey99":"#fcfcfc","honeydew1":"#f0fff0","honeydew2":"#e0eee0","honeydew3":"#c1cdc1","honeydew4":"#838b83","ivory1":"#fffff0","ivory2":"#eeeee0","ivory3":"#cdcdc1","ivory4":"#8b8b83","khaki1":"#fff68f","khaki2":"#eee685","khaki3":"#cdc673","khaki4":"#8b864e","magenta1":"#ff00ff","magenta2":"#ee00ee","magenta3":"#cd00cd","magenta4":"#8b008b","maroon1":"#ff34b3","maroon2":"#ee30a7","maroon3":"#cd2990","maroon4":"#8b1c62","orange1":"#ffa500","orange2":"#ee9a00","orange3":"#cd8500","orange4":"#8b5a00","orchid1":"#ff83fa","orchid2":"#ee7ae9","orchid3":"#cd69c9","orchid4":"#8b4789","pink1":"#ffb5c5","pink2":"#eea9b8","pink3":"#cd919e","pink4":"#8b636c","plum1":"#ffbbff","plum2":"#eeaeee","plum3":"#cd96cd","plum4":"#8b668b","purple1":"#9b30ff","purple2":"#912cee","purple3":"#7d26cd","purple4":"#551a8b","red1":"#ff0000","red2":"#ee0000","red3":"#cd0000","red4":"#8b0000","salmon1":"#ff8c69","salmon2":"#ee8262","salmon3":"#cd7054","salmon4":"#8b4c39","seashell1":"#fff5ee","seashell2":"#eee5de","seashell3":"#cdc5bf","seashell4":"#8b8682","sienna1":"#ff8247","sienna2":"#ee7942","sienna3":"#cd6839","sienna4":"#8b4726","snow1":"#fffafa","snow2":"#eee9e9","snow3":"#cdc9c9","snow4":"#8b8989","tan1":"#ffa54f","tan2":"#ee9a49","tan3":"#cd853f","tan4":"#8b5a2b","thistle1":"#ffe1ff","thistle2":"#eed2ee","thistle3":"#cdb5cd","thistle4":"#8b7b8b","tomato1":"#ff6347","tomato2":"#ee5c42","tomato3":"#cd4f39","tomato4":"#8b3626","turquoise1":"#00f5ff","turquoise2":"#00e5ee","turquoise3":"#00c5cd","turquoise4":"#00868b","wheat1":"#ffe7ba","wheat2":"#eed8ae","wheat3":"#cdba96","wheat4":"#8b7e66","yellow1":"#ffff00","yellow2":"#eeee00","yellow3":"#cdcd00","yellow4":"#8b8b00"
    };
    let c;
    if( !color ){
	return "";
    }
    c = color.toLowerCase();
    if( typeof colors[c] !== 'undefined' ){
        return colors[c];
    }
    arr = color.match(/rgb\((\d+)[,\s]+(\d+)[,\s]+(\d+)\)/i);
    if( arr ){
	return sprintf("#%02x%02x%02x", arr[1], arr[2], arr[3]);
    }
    return color;
};

// convert string to double, returning (possibly scaled) value and delim
JS9.strtoscaled = function(s){
    let dval = JS9.saostrtod(s);
    const dtype = String.fromCharCode(JS9.saodtype());
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
    return {dval, dtype};
};

// clean file path
JS9.cleanPath = function(s){
    if( !s ){
	return "";
    }
    return s.trim().replace(/\/\.\//, "/").replace(/^\.\//, "");
};

// convert relative directory into absolute directory using currentDir
// desktop only, to make pathname relative to where js9 was started
JS9.fixPath = function(f, opts){
    opts = opts || {};
    if( window.isElectron           &&
	window.currentDir           &&
	JS9.desktopOpts.currentPath &&
	opts.fixpath !== false      &&
	!f.match(JS9.URLEXP)        ){
	if( f.match(/^\${JS9_DIR}/) ){
	    f = f.replace(/^\${JS9_DIR}\//,JS9.INSTALLDIR);
	}
	if( f.charAt(0) !== "/" ){
	    f = `${window.currentDir}/${f}`;
	}
    }
    return f;
};

// return virtual path of a local access file, if warranted
JS9.localAccess = function(file){
    let tfile, text;
    // only if local access is turned on and we have a local disk mounted
    if( !file || !JS9.globalOpts.localAccess || !JS9.localMount ){
	return null;
    }
    // get file without bracket extension
    tfile = file.replace(/\[.*\]/, "");
    // and file extension
    text = `.${tfile.split(".").pop().toLowerCase()}`;
    // this is the candidate virtual file
    tfile = `${JS9.localMount}/${tfile}`;
    // check for existence
    // note to myself: cfitsio uncompresses .gz files into memory, so
    // there is no benefit to having ".gz" in the localTemplates list.
    if( JS9.vsize(tfile) >= 0 &&
	$.inArray(text, JS9.globalOpts.localTemplates.split(",")) >= 0){
	if( JS9.DEBUG > 2 ){
	    JS9.log("local access file: %s", tfile);
	}
	return tfile;
    }
    // no local access file
    return null;
};

// get directory name of a file, including trailing "/";
JS9.dirname = function(f){
    if( !f || !f.includes("/") ){
	return "";
    }
    return f.match(/.*\//)[0];
};

// ---------------------------------------------------------------------
// global event handlers
// ---------------------------------------------------------------------

// mousedown: assumes display obj is passed in evt.data
JS9.mouseDownCB = function(evt){
    const display = evt.data;
    const im = display.image;
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
    // in the resize area?
    display.resizing = display.inResize(im.pos);
    // normal (non-resizing) processing
    if( !display.resizing ){
	evt.preventDefault();
	// begin actions for mouse and touch events
	if( JS9.hasOwnProperty("MouseTouch") ){
	    JS9.MouseTouch.action(im, evt, "start");
	}
	// inside a region, clear region display and return;
	if( im.clickInRegion && (im.clickInLayer === "regions") ){
	    // clear the region layer
	    im.display.clearMessage("regions");
	    return;
	}
	// plugin callbacks
	if( !JS9.specialKey(evt) ){
	    im.xeqPlugins("mouse", "onmousedown", evt);
	}
    }
    // set click state to current mouse button
    im.clickState = evt.which;
    switch(evt.which){
    case 1:
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
    // add this display's callbacks on the whole document
    $(document).on(`mousemove.${display.id}`, display,
		 (evt) => { return JS9.mouseMoveCB(evt); });
    $(document).on(`mouseup.${display.id}`, display,
		 (evt) => { return JS9.mouseUpCB(evt); });
};

// mouseup: assumes display obj is passed in evt.data
JS9.mouseUpCB = function(evt){
    let i, dwidth, dheight, tdisp, isclick;
    const display = evt.data;
    const im = display.image;
    // sanity checks
    if( !im ){
	// handle supermenu clicks specially (even if no image is loaded)
	if( JS9.hasOwnProperty("Menubar") ){
	    JS9.Menubar.onclick(evt.data);
	}
	return;
    }
    // get canvas position
    im.pos = JS9.eventToDisplayPos(evt, im.posOffset);
    // image position
    im.ipos = im.displayToImagePos(im.pos);
    isclick = 	((Math.abs(im.pos0.x-im.pos.x) < JS9.NOMOVE)  &&
		 (Math.abs(im.pos0.y-im.pos.y) < JS9.NOMOVE));
    // prevent default unless we are close to the resize area
    if( !display.inResize(im.pos) ){
	evt.preventDefault();
    }
    // end actions for mouse and touch events
    if( JS9.hasOwnProperty("MouseTouch") ){
	JS9.MouseTouch.action(im, evt, "stop");
    }
    // inside a region, update region string
    if( im.clickInRegion && im.clickInLayer ){
	if( isclick ){
	    if( fabric.major_version === 1 ){
		// for fabric v2+, done in selection:created callback
		im.updateShapes(im.clickInLayer, "selected", "select");
	    }
	} else {
	    im.updateShapes(im.clickInLayer, "selected", "update");
	}
    }
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	im.xeqPlugins("mouse", "onmouseup", evt);
	if( isclick ){
	    im.xeqPlugins("mouse", "onclick", evt);
	    // handle supermenu clicks specially
	    if( JS9.hasOwnProperty("Menubar") ){
		JS9.Menubar.onclick(im.display);
	    }
	}
	if( JS9.globalOpts.dynamicSelect === "click" ){
	    if( JS9.Dysel.getDisplayOr(display) !== display ){
		// mark this as the current display
		JS9.Dysel.select(display);
	    }
	}
    } else {
	// shift-click: pan to mouse position, if necessary
	if( isclick && !im.clickInRegion && JS9.globalOpts.metaClickPan ){
	    im.setPan(im.ipos.x,im.ipos.y);
	}
    }
    // safe to unset clickInRegion now
    im.clickInRegion = false;
    im.clickInLayer = null;
    im.clickState = 0;
    im.posOffset = null;
    // finish resize, if necessary
    if( display.resizing ){
	display.resizing = false;
	if( JS9.bugs.webkit_resize ){
	    dwidth = parseInt(display.divjq.css("width"), 10);
	    dheight = parseInt(display.divjq.css("height"), 10);
	    if( dwidth  < display.owidth ){
		display.divjq.css("width", display.owidth + JS9.RESIZEFUDGE);
	    }
	    if( dheight < display.oheight ){
		display.divjq.css("height", display.oheight + JS9.RESIZEFUDGE);
	    }
	}
	// if we were not displaying the image while resizing, do it now
	if( !JS9.globalOpts.resizeRedisplay ){
	    im.displayImage("all");
	    im.refreshLayers();
	}
    }
    // remove this display's callbacks on the whole document
    $(document).off(`mouseup.${display.id}`);
    $(document).off(`mousemove.${display.id}`);
    // look for active mousedown from a different display and fire mouse up
    for(i=0; i<JS9.displays.length; i++){
	tdisp = JS9.displays[i];
	if( (tdisp !== display) && tdisp.image && tdisp.image.clickState ){
	    tdisp.divjq.trigger("mouseup");
	}
    }
};

// mousemove: assumes display obj is passed in evt.data
JS9.mouseMoveCB = function(evt){
    let sel;
    const display = evt.data;
    const im = display.image;
    // evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    // is mouse movement disabled with the meta key?
    if( JS9.specialKey(evt) ){
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
    // don't do anything else if we are resizing
    if( display.resizing ){
	return;
    }
    evt.preventDefault();
    // reset the valpos object
    im.valpos = null;
    // in a region, update the region info
    if( im.clickInRegion && (im.clickInLayer === "regions") ){
	sel = im.display.layers.regions.params.sel;
	if( sel ){
	    if( im.params.listonchange          ||
		sel.params.listonchange         ||
		JS9.globalOpts.intensivePlugins ){
		im.updateShape("regions", sel, null, "move");
	    }
	    // list regions
	    if( im.params.listonchange || sel.params.listonchange ){
		im.listRegions("selected", {mode: 2});
	    }
	    // regions move callback
	    if( JS9.globalOpts.intensivePlugins ){
		im.xeqPlugins("region", "onregionsmove", sel.pub);
	    }
	}
    }
    // actions for mouse and touch events
    if( JS9.hasOwnProperty("MouseTouch") ){
	JS9.MouseTouch.action(im, evt);
    }
    // actions for crosshair
    if( JS9.hasOwnProperty("Crosshair") ){
	if( im.tmp.arrowCrosshairVisible && !im.params.crosshair ){
	    JS9.Crosshair.hide(im, im.ipos, evt);
	}
    }
    // update valpos, in case a plugin wants it, and we did not do it above
    if( !im.valpos ){
	im.valpos = im.updateValpos(im.ipos, false);
    }
    // plugin callbacks
    if( !JS9.specialKey(evt) ){
	im.xeqPlugins("mouse", "onmousemove", evt);
    }
};

// mouseenter: assumes display obj is passed in evt.data
JS9.mouseEnterCB = function(evt){
    const display = evt.data;
    const im = display.image;
    evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    if( !JS9.specialKey(evt) ){
	if( JS9.globalOpts.dynamicSelect === "move" ){
	    if( JS9.Dysel.getDisplayOr(display) !== display ){
		// mark as the current display
		JS9.Dysel.select(display);
	    }
	}
    }
};

// mouseover: assumes display obj is passed in evt.data
JS9.mouseOverCB = function(evt){
    const display = evt.data;
    const im = display.image;
    const x = $(document).scrollLeft(), y = $(document).scrollTop();
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

// mouseout: assumes display obj is passed in evt.data
JS9.mouseOutCB = function(evt){
    const display = evt.data;
    const im = display.image;
    evt.preventDefault();
    // sanity checks
    if( !im ){
	return;
    }
    // unset focus
    im.display.displayConjq.blur();
    // if processing a region, update it now
    // (in case the mouseup happens outside the display)
    if( im.clickInRegion && im.clickInLayer ){
	im.updateShapes(im.clickInLayer, "selected", "mouseout");
    }
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
    const display = evt.data;
    const im = display.image;
    if( display.mousetouchZoom && im         &&
	JS9.hasOwnProperty("MouseTouch")     &&
	JS9.MouseTouch.Actions["wheel zoom"] ){
	JS9.MouseTouch.Actions["wheel zoom"](im, evt);
	// avoid page scroll if we are using the wheel for zooming
	evt.preventDefault();
    }
};

// this does not seem to fire on a canvas ... so we use keydown instead
// keypress: assumes display obj is passed in evt.data
// in case you are wondering: you can't move the mouse via javascript!
// http://stackoverflow.com/questions/4752501/move-the-mouse-pointer-to-a-specific-position
JS9.keyPressCB = function(evt){
    const display = evt.data;
    const im = display.image;
    evt.preventDefault();
    // plugin callbacks
    if( im ){
	im.xeqPlugins("keypress", "onkeypress", evt);
    }
};

// keydown: assumes display obj is passed in evt.data
// in case you are wondering: you can't move the mouse via javascript!
// http://stackoverflow.com/questions/4752501/move-the-mouse-pointer-to-a-specific-position
JS9.keyDownCB = function(evt){
    let ipos;
    const display = evt.data;
    const im = display.image;
    evt.preventDefault();
    // actions for key press
    if( JS9.hasOwnProperty("Keyboard") ){
	ipos = im ? im.ipos : {x: null, y: null};
	JS9.Keyboard.action(im, ipos, evt);
    }
    if( im ){
	// plugin callbacks
	im.xeqPlugins("keypress", "onkeydown", evt);
    }
};

// keyup: assumes display obj is passed in evt.data
JS9.keyUpCB = function(evt){
    const display = evt.data;
    const im = display.image;
    if( im ){
	// plugin callbacks
	im.xeqPlugins("keypress", "onkeyup", evt);
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

JS9.dragdropCB = function(id, evt){
    let i, s, opts, files, display;
    // convert jquery event to original event, if possible
    if( evt.originalEvent ){
	evt = evt.originalEvent;
    }
    evt.stopPropagation();
    evt.preventDefault();
    opts = $.extend(true, {}, JS9.fits.options);
    opts.display = opts.display || id;
    opts.extlist = opts.extlist || JS9.globalOpts.extlist;
    files = evt.target.files || evt.dataTransfer.files;
    display = JS9.lookupDisplay(opts.display);
    // first check if it's not a file
    if( !files.length ){
	// assume text
	s = evt.dataTransfer.getData("text");
	// check whether its a URL and load via proxy, if possible
	if( s.match(JS9.URLEXP) && JS9.globalOpts.loadProxy ){
	    JS9.LoadProxy(s, {display: opts.display});
	}
	return;
    }
    // got files: wait for spinner to start ...
    window.setTimeout(() => {
	let file, fname;
	// ... and load each file in turn
	for(i=0; i<files.length; i++){
	    file = files[i];
	    fname =  file.path || file.name || "";
	    if( fname.match(/\.reg$/) ){
		JS9.LoadRegions(file, {display: opts.display});
	    } else if( fname.match(/\.cat$/) ){
		JS9.LoadCatalog(null, file, {display: opts.display});
	    } else if( fname.match(/\.ses$/) ){
		JS9.LoadSession(file, {display: opts.display});
	    } else if( fname.match(/\.js9ses$/) ){
		JS9.LoadSession(file, {display: opts.display});
	    } else if( fname.match(/\.cmap$/) ){
		JS9.LoadColormap(file);
	    } else {
		JS9.waiting(true, display);
		opts.refresh = JS9.globalOpts.refreshDragDrop;
		opts.localAccess = true;
		JS9.Load(file, opts, {display: opts.display});
	    }
	}
    }, JS9.SPINOUT);
};

// ---------------------------------------------------------------------
// special event handlers
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// plugin support
// ---------------------------------------------------------------------

// add a plugin definition. Plugins will initialized after document is loaded
JS9.RegisterPlugin = function(xclass, xname, func, opts){
    let name, m, type, url, title;
    const heading = xclass;
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
    JS9.PLUGINS += "|";
    JS9.PLUGINS += xname;
    // save the plug-in
    JS9.plugins.push({xclass, xname, name, opts, func, instances: []});
    // save help, if necessary
    if( opts.help ){
	m = opts.help.match(/^.*[\\/]/);
	if( m[0] ){
	    type = `plugins/${m[0].replace(/[\\/]+$/, "")}`;
	}
	url = opts.help.replace(/^.*[\\/]/, "");
	if( opts.menuItem ){
	    title = opts.menuItem;
	} else {
	    title = name;
	}
	JS9.helpOpts[xname] = {type, url, heading, title};
    }
    // if JS9 already is inited, we need to instantiate this plugin
    // this can happen when using Require.js, for example
    if( JS9.inited ){
	JS9.instantiatePlugins();
    }
};

// create a new plugin instance, attached to the specified element
JS9.instantiatePlugin = function(el, plugin, winhandle, args){
    let i, tplugin, instance, divid, divjq, pdivjq, html, ndiv, did;
    let visible = "visible";
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
	    JS9.error(`unknown plugin: ${plugin}`);
	}
    }
    // create an object inheriting the constructor prototype
    instance = Object.create(plugin.func.prototype);
    // save full name
    instance.name = plugin.name;
    // routine to tell if this instance active
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
	    divjq = $(`#${el}`);
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
	// this is the div which the instance sees
	instance.divjq = divjq;
	// the light window is the the outer div
	instance.outerdivjq = instance.divjq.closest(JS9.lightOpts[JS9.LIGHTWIN].top);
    } else {
	// save id
	instance.id = divjq.attr("id") || plugin.name;
	// save type
	instance.winType = "div";
	// should this plugin div be hidden at the start?
	if( $.inArray(instance.name, JS9.globalOpts.hiddenPluginDivs) >=0 ){
	    visible = "hidden";
	}
	// wrap the target div in a container div
	divjq.wrap(`<div class='JS9PluginContainer' style='visibility: ${visible}'>`);
	// this is the original div
	instance.odivjq = divjq;
	// this is the div which the instance sees
	instance.divjq = divjq;
	// add classes for easier CSS specification
	instance.divjq.addClass(`${plugin.xclass}Plugin`).addClass("JS9Plugin");
	// add id
	if( !instance.odivjq.attr("id") ){
	    instance.odivjq.attr("id", instance.id);
	}
	// the wrapper plugincontainer is the the outer div
	instance.outerdivjq = instance.divjq.closest(".JS9PluginContainer");
	// add the toolbar to the container, if necessary
	if( divjq.data("toolbarseparate") !== false ){
	    if( plugin.opts.toolbarSeparate || divjq.data("toolbarseparate") ){
		ndiv = `<div class='${JS9.lightOpts[JS9.LIGHTWIN].dragBar}'>`;
		$(ndiv).insertBefore(instance.divjq);
	    }
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
	    // look for displays to which we have not added this plugin
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
	// set width and height on div which instance sees
	if( plugin.opts.winDims ){
	    // if either of these is not set, set size to defaults
	    // as it turns out, sometimes one of them can be a tiny value (2)
	    // when you still want to set the defaults. not sure why ...
	    if( !instance.divjq.width()  || !instance.divjq.height() ){
		instance.divjq.css("width", plugin.opts.winDims[0]);
		instance.divjq.css("height", plugin.opts.winDims[1]);
	    }
	}
	// find the display for this plugin, using data-js9id or instance id
	divid = instance.divjq.data("js9id") || instance.id;
	if( divid === "*" ){
	    if( plugin.opts.dynamicSelect ){
		// use first display as the primary for a dynamic plugin
		instance.display = JS9.displays[0];
		// this instance is dynamic
		instance.isDynamic = true;
		// we have a dynamically selected plugin
		JS9.Dysel.addPlugins(plugin.name);
		did = "*";
	    } else {
		JS9.error(`${plugin.name} is not dynamically selectable`);
	    }
	} else {
	    instance.display = JS9.lookupDisplay(divid);
	    did = instance.display.id;
	}
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
	    $(`<div class='JS9PluginToolbar-${instance.winType}'>`)
		.css("z-index", JS9.BTNZINDEX)
		.html(html)
		.data("displayid", did)
		.insertAfter(pdivjq);
	}
	instance.display.pluginInstances[plugin.name] = instance;
	// call the init routine (usually a constructor)
	// on entry: elements have already been defined in the context:
	// this.div: the DOM element representing the div for this plugin
	// this.divjq: jquery object representing the div for this plugin
	// this.id: id of the div (or the plugin name as a default)
	// this.plugin: plugin class object (user opts in opts subobject)
	// this.winType:  "div" (in-page div) or "light" (from view menu)
	// this.winHandle: handle returned from light window create routine
	// this.display:  the display object associated with this plugin
	// this.status: "active" or "inactive" or undefined
	plugin.func.apply(instance, args);
	// for a dynamic plugin, backlink this instance into all displays
	if( did === "*" ){
	    for(i=0; i<JS9.displays.length; i++){
		// look for displays to which we have not added this plugin
		if( JS9.displays[i].pluginInstances[plugin.name] ){
		    // primary display
		    instance.display  = JS9.displays[i];
		} else {
		    // backlink to primary
		    JS9.displays[i].pluginInstances[plugin.name] = instance;
		}
	    }
	}
    }
    // return the instance
    return instance;
};

// instantiate all plugins -- can be called repeatedly if new divs are added
JS9.instantiatePlugins = function(){
    let i;
    const newPlugin = (plugin) => {
	let j, k, instance;
	// instantiate any divs not yet done
	$(`div.${plugin.name}`).each((index, element) => {
	    // new instance of this div-based plugin
	    JS9.instantiatePlugin($(element),
				  plugin, null, plugin.opts.divArgs);
	});
	// if we have a non-visible plugin (no menu and no window dims)
	// which is not instantiated, instantiate it now (e.g. regions)
	if( !plugin.opts.menuItem && plugin.opts.winDims &&
	    !plugin.opts.winDims[0] && !plugin.opts.winDims[1] ){
	        JS9.instantiatePlugin(null, plugin, null, plugin.opts.divArgs);
	}
	// backlink new instances of any dynamic plugins
	for(j=0; j<plugin.instances.length; j++){
	    instance = plugin.instances[j];
	    if( instance.isDynamic ){
		for(k=0; k<JS9.displays.length; k++){
		    if( !JS9.displays[k].pluginInstances[plugin.name] ){
			JS9.displays[k].pluginInstances[plugin.name] = instance;
		    }
		}
	    }
	}
    };
    for(i=0; i<JS9.plugins.length; i++){
	newPlugin(JS9.plugins[i]);
    }
};

// ---------------------------------------------------------------------
// the init routine to start up the Emscripten runtime
// ---------------------------------------------------------------------

JS9.initEmscripten = function(){
    let opts;
    // sanity check
    if( window.hasOwnProperty("Astroem") ){
	return;
    }
    // load astroem, based on whether we have native WebAssembly or not
    opts = {responseType: "arraybuffer", allowCache: true};
    if( JS9.globalOpts.useWasm          &&
	typeof WebAssembly === 'object' &&
	(location.protocol !== "file:"  || JS9.globalOpts.allowFileWasm) ){
	// use site-specified file if available, else default file
	JS9.globalOpts.astroemWasm =
	    JS9.InstallDir(Module.wasmBinaryFile || "astroemw.wasm");
	// load astroem wasm file
	JS9.fetchURL(JS9.globalOpts.astroemWasm, null, opts, (data) => {
	    // tell Emscripten we already have wasm binary
	    // eslint-disable-next-line no-unused-vars
	    Module.wasmBinary = data;
	    JS9.globalOpts.astroemURL = JS9.InstallDir("astroemw.js");
	    // load astroem wasm js file
	    try{
		JS9.loadScript(JS9.globalOpts.astroemURL);
	    }
	    catch(e){
		JS9.error(`can't find ${JS9.globalOpts.astroemURL}`);
	    }
	});
    } else {
	JS9.globalOpts.astroemURL = JS9.InstallDir("astroem.js");
	// load astroem ams.js file
	try{
	    JS9.loadScript(JS9.globalOpts.astroemURL);
	}
	catch(e){
	    JS9.error(`can't find ${JS9.globalOpts.astroemURL}`);
	}
    }
};

// initialize FITS support
JS9.initFITS = function(){
    // initialize astronomy emscripten routines (wcslib, etc), if possible
    if( window.hasOwnProperty("Astroem") ){
	JS9.vmalloc = Astroem.vmalloc;
	JS9.vfree = Astroem.vfree;
	JS9.vheap = Astroem.vheap;
	JS9.vmemcpy = Astroem.vmemcpy;
	JS9.vfile = Astroem.vfile;
	JS9.vread = Astroem.vread;
	JS9.vunlink = Astroem.vunlink;
	JS9.vsize = Astroem.vsize;
	JS9.vmount = Astroem.vmount;
	JS9.arrfile = Astroem.arrfile;
	JS9.listhdu = Astroem.listhdu;
	JS9.initwcs = Astroem.initwcs;
	JS9.freewcs = Astroem.freewcs;
	JS9.wcsinfo = Astroem.wcsinfo;
	JS9.wcssys = Astroem.wcssys;
	JS9.wcsunits = Astroem.wcsunits;
	JS9.pix2wcs = Astroem.pix2wcs;
	JS9.wcs2pix = Astroem.wcs2pix;
	JS9.reg2wcs = Astroem.reg2wcs;
	JS9.saostrtod = Astroem.saostrtod;
	JS9.saodtostr = Astroem.saodtostr;
	JS9.saodtype = Astroem.saodtype;
	JS9.zscale = Astroem.zscale;
	JS9.tanhdr = Astroem.tanhdr;
	JS9.reproject = Astroem.reproject;
	JS9.madd = Astroem.madd;
	JS9.imgtbl = Astroem.imgtbl;
	JS9.makehdr = Astroem.makehdr;
	JS9.shrinkhdr = Astroem.shrinkhdr;
	JS9.imsection = Astroem.imsection;
	JS9.regcnts = Astroem.regcnts;
	JS9.fitsLibrary("cfitsio");
    } else if( window.hasOwnProperty("Fitsy") ){
	JS9.fitsLibrary("fitsy");
    }
};

// init colormaps
JS9.initColormaps = function(){
    // sanity check
    if( !JS9.hasOwnProperty("Colormap") ){
	return;
    }
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
    JS9.checkNew(new JS9.Colormap("hsv", (() => {
	let i, frac, h, s, v, f, p, q, t, ii;
	let cur = 0;
	const size = 200;
	const a = [];
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
	return a;})()));
    JS9.checkNew(new JS9.Colormap("rainbow",
	[[0,1], [0.2,0], [0.6,0], [0.8,1], [1,1]],
	[[0,0], [0.2,0], [0.4,1], [0.8,1], [1,0]],
	[[0,1], [0.4,1], [0.6,0], [1,0]]));
    JS9.checkNew(new JS9.Colormap("standard",
	[[0,0], [0.333,0.3], [0.333,0], [0.666,0.3], [0.666,0.3], [1,1]],
	[[0,0], [0.333,0.3], [0.333,0.3], [0.666,1], [0.666,0], [1,0.3]],
	[[0,0], [0.333,1], [0.333,0], [0.666,0.3], [0.666,0], [1,0.3]]));
    JS9.checkNew(new JS9.Colormap("staircase", (() => {
	let ii, kk;
	let cur = 0;
	const a = [];
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
	return a;})()));
    JS9.checkNew(new JS9.Colormap("color",
[[0,0,0], [0.18431, 0.18431, 0.18431], [0.37255, 0.37255, 0.37255], [0.56078, 0.56078, 0.56078], [0.74902, 0.74902, 0.74902], [0.93725, 0.93725, 0.93725], [0, 0.18431, 0.93725], [0, 0.37255, 0.74902], [0, 0.49804, 0.49804], [0, 0.74902, 0.30980], [0, 0.93725, 0], [0.30980, 0.62353, 0], [0.49804, 0.49804, 0], [0.62353, 0.30980, 0], [0.93725, 0, 0], [0.74902, 0, 0.30980]]));
};

// init console commands
JS9.initCommands = function(){
    // sanity check
    if( !JS9.hasOwnProperty("Command") ){
	return;
    }
    // load commands
    JS9.checkNew(new JS9.Command({
	name: "analysis",
	alias: "run",
	help: "list/run analysis for current image",
	get() {
	    let i, j, n, t, tasks;
	    let result = "";
	    const im = this.image;
	    if( im && im.analysisPackages ){
		for(j=0; j<im.analysisPackages.length; j++){
		    tasks = im.analysisPackages[j];
		    for(i=0; i<tasks.length; i++){
			t = tasks[i];
			if( result ){
			    result += ", ";
			}
			n = t.xclass ? (`${t.xclass}:${t.name}`) : t.name;
			result += `${t.title} (${n})`;
		    }
		    if( j < (im.analysisPackages.length-1) ){
			result += "\n";
		    }
		}
	    }
	    return result;
	},
	set(args) {
	    let a, did;
	    const im = this.image;
	    if( !im ){
		return;
	    }
	    a = im.lookupAnalysis(args[0]);
	    if( a ){
		if( a.purl ){
		    did = im.displayAnalysis("params",
					     JS9.InstallDir(a.purl),
					     {title: `${a.title}: ${im.fitsFile}`});
		    // save info for running the task
		    $(did).data("dispid", im.display.id)
			.data("aname", a.name);
		} else {
		    // else run task directly
		    im.runAnalysis(a.name);
		}
	    } else {
		JS9.error(`unknown analysis command '${args[0]}'`);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "colormap",
	alias: "cmap",
	help: "set/get colormap for current image",
	get() {
	    let res;
	    const im = this.image;
	    if( im ){
		res = im.getColormap();
		return `${res.colormap} ${res.contrast} ${res.bias}`;
	    }
	},
	set(args) {
	    const im = this.image;
	    if( im ){
		im.setColormap(...args);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "colormaps",
	alias: "cmaps",
	help: "get list of available colormaps",
	get() {
	    let i;
	    let msg = "";
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
	name: "grid",
	help: "set/get coordinate grid for current image",
	get() {
	    let msg;
	    const im = this.image;
	    if( im ){
		msg = im.displayCoordGrid();
	    }
	    return msg ? "true" : "false";
	},
	set(args) {
	    let mode;
	    const im = this.image;
	    if( im ){
		if( args[0].match(/true/i) ){
		    mode = true;
		} else {
		    mode = false;
		}
		im.displayCoordGrid(mode, args[1]);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "help",
	help: "get list of available commmands",
	get() {
	    let i, cmd;
	    let msg = "<table>";
	    for(i=0; i<JS9.commands.length; i++){
		cmd = JS9.commands[i];
		msg += `<tr><td>${cmd.name}</td><td>${cmd.help}`;
		if( cmd.alias ){
		    msg += ` (${cmd.alias}`;
		    if( cmd.alias2 ){
		      msg += `, ${cmd.alias2}`;
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
	get() {
	    return JS9.helper.connectinfo();
	},
	set(args) {
	    JS9.helper.connect(args[0].trim());
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "image",
	help: "get name of currently loaded image or display specified image",
	get() {
	    const im = this.image;
	    if( im ){
		return im.file;
	    }
	},
	set(args) {
	    let i, im;
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
	get() {
	    let i, im;
	    let msg = "";
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
	set(args) {
	    let i, j, obj;
	    const alen = args.length;
	    for(i=0; i<alen; i++){
		obj = null;
		j = i + 1;
		if( (j < alen) && args[j].startsWith('{') ){
		    try{ obj = JSON.parse(args[j]); }
		    catch(e){ obj = null; }
		}
		if( obj ){
		    JS9.Load(args[i], obj, {display: this.display.id});
		    i++;
		} else {
		    JS9.Load(args[i], {display: this.display.id});
		}
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "pan",
	help: "set/get pan location for current image",
	get() {
	    let res;
	    const im = this.image;
	    if( im ){
		res = im.getPan();
		return `${res.x} ${res.x}`;
	    }
	},
	set(args) {
	    const im = this.image;
	    if( im ){
		im.setPan(...args);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "pix2wcs",
        help: "get image pixel value for specified wcs position",
	set(args) {
	    let res;
	    const im = this.image;
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
	get() {
	    const im = this.image;
	    if( im ){
		im.print();
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "refresh",
	help: "refresh current image using specified file (def: use last file)",
	set(args) {
	    let i, j, obj;
	    const alen = args.length;
	    const im = this.image;
	    // no args: refresh current image
	    if( alen === 0 ){
		obj = {refresh: im};
		JS9.Load(im.file, obj, {display: this.display.id});
		return;
	    }
	    for(i=0; i<alen; i++){
		obj = null;
		j = i + 1;
		if( (j < alen) && args[j].startsWith('{') ){
		    try{ obj = JSON.parse(args[j]); }
		    catch(e){ obj = null; }
		}
		if( obj ){
		    obj.refresh = true;
		    JS9.Load(args[i], obj, {display: this.display.id});
		    i++;
		} else {
		    obj = {refresh: true};
		    JS9.Load(args[i], obj, {display: this.display.id});
		}
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "regcnts",
	help: "counts in regions for current image",
	get() {
	    const im = this.image;
	    if( im ){
		im.countsInRegions("$sregions", "$bregions",
				   {lightwin: true});
	    }
	},
	set(args) {
	    const im = this.image;
	    if( im ){
		return im.countsInRegions(...args);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name:   "regions",
	alias:  "reg",
	alias2: "region",
	help: "add region to current image or list all regions",
	get() {
	    const im = this.image;
	    if( im ){
		return im.listRegions("all", {mode: 0}) || "";
	    }
	},
	set(args) {
	    let s;
	    const im = this.image;
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
	get() {
	    let display;
	    const im = this.image;
	    if( im ){
		display = im.display;
		return `${display.width} ${display.height}`;
	    }
	},
	set(args) {
	    let display, width, height;
	    const im = this.image;
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
	get() {
	    let res;
	    const im = this.image;
	    if( im ){
		res = im.getScale();
		return `${res.scale} ${res.scalemin} ${res.scalemax}`;
	    }
	},
	set(args) {
	    const im = this.image;
	    if( im ){
		im.setScale(...args);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "scales",
	help: "get list of available scales",
	get() {
	    return JS9.scales.join(", ");
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "section",
	help: "display section of current image",
	set(args) {
	    let s, obj;
	    const alen = args.length;
	    const im = this.image;
	    if( alen === 1 && args[0] === "full" ){
		im.displaySection("full");
	    } else {
		s = args.join(" ");
		if( s ){
		    try{ obj = JSON.parse(s); }
		    catch(e){ JS9.error("invalid JSON section"); }
		    im.displaySection(obj);
		}
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "status",
	help: "get status for specified (or current) image",
	get(args) {
	    let i, first, tim, im, cmd;
	    let result = "";
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
	set(args) {
	    JS9.DisplayHelp(args[0]);
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcssys",
	help: "set/get wcs system for current image",
	get() {
	    const im = this.image;
	    if( im ){
		return im.getWCSSys();
	    }
	},
	set(args) {
	    const im = this.image;
	    if( im ){
		im.setWCSSys(args[0]);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcsu",
	help: "set/get wcs units used for current image",
	get() {
	    const im = this.image;
	    if( im ){
		return im.getWCSUnits();
	    }
	},
	set(args) {
	    const im = this.image;
	    if( im ){
		im.setWCSUnits(args[0]);
	    }
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcssystems",
	help: "get list of available wcs systems",
	get() {
	    return JS9.wcssyss.join(", ");
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcsunits",
	help: "get list of available wcs units",
	get() {
	    return JS9.wcsunitss.join(", ");
	}
    }));
    JS9.checkNew(new JS9.Command({
	name: "wcs2pix",
        help: "get wcs position for specified image pixel",
	set(args) {
	    let res;
	    const im = this.image;
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
	get() {
	    const im = this.image;
	    if( im ){
		return im.getZoom();
	    }
	},
	set(args) {
	    const im = this.image;
	    if( im ){
		im.setZoom(args[0]);
	    }
	}
    }));
};

// init analysis
JS9.initAnalysis = function(){
    // for analysis forms, Enter should not Submit, but allow specification
    // of the name of an element to click
    $(document).on("keyup keypress", ".js9AnalysisForm", (e) => {
	const code = e.which || e.keyCode;
	let id;
	if( code === 13 ){
	    e.preventDefault();
	    id = $(e.currentTarget).data("enterfunc");
	    if( id ){
		$(e.currentTarget).find(`[name='${id}']`).click();
	    }
	    return false;
	}
    });
};


// ---------------------------------------------------------------------
// the init routine to start up JS9
// ---------------------------------------------------------------------

JS9.init = function(){
    let uopts;
    // sanity check: need HTML5 canvas and JSON
    if( !window.HTMLCanvasElement || !JSON ){
	JS9.error("your browser does not support JS9 (no HTML5 canvas and/or JSON). Please try a modern version of Firefox, Chrome, Safari, Opera, or Edge.");
    }
    // get relative location of installed js9.css file
    // which tells us where JS9 installed files (and the helper) are located
    //
    // allow specification of installdir in js9prefs.js
    // check this manually: it's happening before processing the prefs
    if( window.hasOwnProperty("JS9Prefs") && typeof JS9Prefs === "object" ){
	if( JS9Prefs.globalOpts && JS9Prefs.globalOpts.installDir ){
	    JS9.INSTALLDIR = JS9Prefs.globalOpts.installDir;
	}
    }
    if( !JS9.INSTALLDIR ){
	try{
	    // process all links which end in 'js9.css'
	    $('link[href$="js9.css"]').each((index, element) => {
		const h = $(element).attr("href");
		if( h ){
		    // must really end in 'js9.css'
		    if( h.split("/").reverse()[0] === "js9.css" ){
			// set install dir to its directory
			JS9.INSTALLDIR = h.replace(/js9\.css$/, "");
		    }
		}
	    });
	} catch(e){
	    JS9.INSTALLDIR = "";
	}
	if( JS9.INSTALLDIR ){
	    JS9.INSTALLDIR = JS9.cleanPath(JS9.INSTALLDIR);
	}
    }
    if( JS9.INSTALLDIR && JS9.INSTALLDIR.slice(-1) !== "/" ){
	// make sure there is a trailing slash
	JS9.INSTALLDIR += "/";
    }
    JS9.TOROOT = JS9.INSTALLDIR.replace(/([^/.])+/g, "..");
    // if the js9 inline object exists, add it the JS9 object
    if( window.hasOwnProperty("JS9Inline") && typeof JS9Inline === "object" ){
	JS9.inline = $.extend(true, {}, JS9Inline);
    }
    // set up the dynamic drive html window
    if( JS9.LIGHTWIN === "dhtml" ){
	// Creation of dhtmlwindowholder was done by a document.write in
	// dhtmlwindow.js. We removed it from dhtmlwindow.js file because it
	// interfered with the jquery search for js9.css above. Oh boy ...
	// But it has to be somewhere!
	$("<div>")
	    .attr("id", "dhtmlwindowholder")
	    .appendTo($(document.body))
	    .append("<span style='display:none'>.</span>");
	// allow in-line specification of images for all-in-one configuration
	if( JS9.inline ){
	    dhtmlwindow.imagefiles = [JS9.inline["images/min.gif"],
				      JS9.inline["images/close.gif"],
				      JS9.inline["images/restore.gif"],
				      JS9.inline["images/resize.gif"]];
	} else if( JS9.allinone ){
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
	   $("#dhtmlwindowholder").arrive("input", (el) => {
	       JS9.jupyterFocus($(el).parent());
	   });
	}
    }
    // use plotly if loaded separately, otherwise use internal flot
    JS9.globalOpts.plotLibrary = JS9.globalOpts.plotLibrary || "flot";
    if( (JS9.globalOpts.plotLibrary === "plotly") &&
	!window.hasOwnProperty("Plotly") ){
	JS9.globalOpts.plotLibrary = "flot";
    }
    // if js9 prefs were defined/loaded explicitly, merge properties
    if( window.hasOwnProperty("JS9Prefs") && typeof JS9Prefs === "object" ){
	JS9.mergePrefs(JS9Prefs);
    } else {
	// look for and load json pref files
	// (set this to false in the page to avoid loading a prefs file)
	if( JS9.PREFSFILE ){
	    // load site preferences, if possible
	    JS9.loadPrefs(JS9.InstallDir(JS9.PREFSFILE), 1);
	    // load page preferences, if possible
	    JS9.loadPrefs(JS9.PREFSFILE, 0);
	}
    }
    // if JS9 prefs have regionOpts, transfer them to Regions.opts
    if( JS9.hasOwnProperty("Regions") ){
	$.extend(true, JS9.Regions.opts, JS9.regionOpts);
    }
    delete JS9.regionOpts;
    // if JS9 prefs have catalogOpts, transfer them to Catalogs.opts
    if( JS9.hasOwnProperty("Catalogs") ){
	$.extend(true, JS9.Catalogs.opts, JS9.catalogOpts);
    }
    delete JS9.catalogOpts;
    // if JS9 prefs have crosshairOpts, transfer them to Crosshair.opts
    if( JS9.hasOwnProperty("Crosshair") ){
	$.extend(true, JS9.Crosshair.opts, JS9.crosshairOpts);
    }
    delete JS9.crosshairOpts;
    // if JS9 prefs have gridOpts, transfer them to Grid.opts
    if( JS9.hasOwnProperty("Grid") ){
	$.extend(true, JS9.Grid.opts, JS9.gridOpts);
    }
    delete JS9.gridOpts;
    // if JS9 prefs have emscriptenOpts, transfer them to Module
    if( JS9.hasOwnProperty("Module") ){
	$.extend(true, Module, JS9.emscriptenOpts);
    }
    delete JS9.emscriptenOpts;
    // regularize resize params
    if( !JS9.globalOpts.resize ){
	JS9.globalOpts.resizeHandle = false;
    }
    // backward compatibility (we moved this property 7/2018)
    if( JS9.analOpts.prependJS9Dir !== undefined ){
	JS9.globalOpts.prependJS9Dir = JS9.analOpts.prependJS9Dir;
	delete JS9.analOpts.prependJS9Dir;
    }
    // backward compatibility (we moved this property 7/2018)
    if( JS9.analOpts.dataDir !== undefined ){
	JS9.globalOpts.dataDir = JS9.analOpts.dataDir;
	delete JS9.analOpts.dataDir;
    }
    // turn off resize on mobile platforms
    if( JS9.BROWSER[3] ){
	JS9.globalOpts.resizeHandle = false;
    }
    // replace with global opts with user opts, if necessary
    if( window.hasOwnProperty("localStorage") && JS9.globalOpts.localStorage ){
	try{ uopts = localStorage.getItem("globals"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.displays = JSON.parse(uopts); }
	    catch(ignore){ /* empty */ }
	    if( JS9.userOpts.displays ){
		$.extend(true, JS9.globalOpts, JS9.userOpts.displays);
	    }
	}
	try{ uopts = localStorage.getItem("images"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.images = JSON.parse(uopts); }
	    catch(ignore){ /* empty */ }
	    if( JS9.userOpts.images ){
		$.extend(true, JS9.imageOpts, JS9.userOpts.images);
	    }
	}
	// this gets replaced below
	try{ uopts = localStorage.getItem("fits"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.fits = JSON.parse(uopts); }
	    catch(ignore){ /* empty */ }
	}
	try{ uopts = localStorage.getItem("regions"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.regions = JSON.parse(uopts); }
	    catch(ignore){ /* empty */ }
	    if( JS9.userOpts.regions ){
		$.extend(true, JS9.Regions.opts, JS9.userOpts.regions);
	    }
	}
	try{ uopts = localStorage.getItem("grid"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.images = JSON.parse(uopts); }
	    catch(ignore){ /* empty */ }
	    if( JS9.userOpts.images ){
		$.extend(true, JS9.Grid.opts, JS9.userOpts.images);
	    }
	}
	try{ uopts = localStorage.getItem("catalog"); }
	catch(e){ uopts = null; }
	if( uopts ){
	    try{ JS9.userOpts.images = JSON.parse(uopts); }
	    catch(ignore){ /* empty */ }
	    if( JS9.userOpts.images ){
		$.extend(true, JS9.Catalogs.Opts, JS9.userOpts.images);
	    }
	}
    }
    // set debug flag
    JS9.DEBUG = JS9.DEBUG || JS9.globalOpts.debug || 0;
    // init main display(s)
    $("div.JS9").each((index, element) => {
	JS9.checkNew(new JS9.Display($(element)));
    });
    // load web worker
    if( window.Worker && !JS9.allinone){
	try{ JS9.worker = new JS9.WebWorker(JS9.InstallDir(JS9.WORKERFILE)); }
	catch(e){ /* empty */ }
    }
    // for allinone files, emscripten is already loaded so init FITS now
    if( JS9.allinone ){
	JS9.initFITS();
    } else {
	// load emscripten, which will trigger init FITS later
	JS9.initEmscripten();
    }
    // initialize helper support
    JS9.helper = new JS9.Helper();
    // add handler for postMessage events
    window.addEventListener("message", (ev) => {
	let s, msg;
	// For Chrome, origin property is in the ev.originalEvent object
	let origin = ev.origin || ev.originalEvent.origin;
	const data = ev.data;
	if( origin === "null" ){
	    origin = "unknown";
	}
	// if postMessage handling is disabled, just (log and) return
	if( !JS9.globalOpts.postMessage ){
	    if( JS9.DEBUG ){
		s = `JS9 ignoring postMessage, origin: ${origin}`;
		if( typeof data === "string" ){
		    s += ` data: ${data}`;
		} else if( typeof data === "object" ){
		    s += ` obj: ${JSON.stringify(Object.keys(data))}`;
		} else {
		    s += ` typeof: ${typeof data}`;
		}
		JS9.log(s);
	    }
	    return;
	}
	if( typeof data === "string" ){
	    // json string passed (we hope)
	    try{ msg = JSON.parse(data); }
	    catch(e){ JS9.error(`can't parse msg: ${data}`, e); }
	} else if( typeof data === "object" ){
	    // object was passed directly
	    msg = data;
	} else {
	    JS9.error("invalid msg from postMessage");
	}
	// call the msg handler for JS9 API calls
	JS9.msgHandler(msg, (stdout, stderr, errcode, a) => {
	    let res;
            a = a || {};
	    res = {name: a.name, rtype: a.rtype, rdata: stdout,
		   stdout: stdout, stderr: stderr, errcode: errcode};
	    parent.postMessage({cmd: msg.cmd, res: res}, "*");
	});
    }, false);
    // initialize image filters
    if( window.hasOwnProperty("ImageFilters") ){
	JS9.ImageFilters = ImageFilters;
    }
    // initialize colormaps
    JS9.initColormaps();
    // initialize console commands
    JS9.initCommands();
    // init analysis
    JS9.initAnalysis();
    // register essential plugins
    JS9.RegisterPlugin(JS9.MouseTouch.CLASS, JS9.MouseTouch.NAME,
		       JS9.MouseTouch.init,
		       {menuItem: "Mouse/Touch",
			onplugindisplay: JS9.MouseTouch.init,
			help: "help/mousetouch.html",
			winTitle: "Mouse/Touch Actions",
			winResize: true,
			winDims: [JS9.MouseTouch.WIDTH,JS9.MouseTouch.HEIGHT]});
    JS9.RegisterPlugin(JS9.Regions.CLASS, JS9.Regions.NAME,
		       JS9.Regions.init,
		       {divArgs: ["regions"],
			winDims: [0, 0]});
    JS9.RegisterPlugin(JS9.Crosshair.CLASS, JS9.Crosshair.NAME,
		       JS9.Crosshair.init,
		       {onmousemove: JS9.Crosshair.display,
			onkeyboardaction: JS9.Crosshair.keyaction,
			onkeyup: JS9.Crosshair.keyup,
			onimageload: JS9.Crosshair.create,
			winDims: [0, 0]});
    JS9.RegisterPlugin(JS9.Grid.CLASS, JS9.Grid.NAME,
		       JS9.Grid.init,
		       {onsetpan:      JS9.Grid.regrid,
			onsetzoom:     JS9.Grid.regrid,
			onsetwcssys:   JS9.Grid.regrid,
			onsetwcsunits: JS9.Grid.regrid,
			onimageload:   JS9.Grid.regrid,
			onupdateprefs: JS9.Grid.regrid,
			winDims:       [0, 0]});
    JS9.RegisterPlugin(JS9.Dysel.CLASS, JS9.Dysel.NAME,
		       JS9.Dysel.init,
		       {onimageload:   JS9.Dysel.imageload,
			onimageclose:  JS9.Dysel.imageclose,
			winDims:       [0, 0]});

    // find divs associated with each plugin and run the constructor
    JS9.instantiatePlugins();
    // sort plugins
    JS9.plugins.sort( (a,b) => {
	const t1 = a.opts.menuItem;
	const t2 = b.opts.menuItem;
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
    // scroll to top
    $(document).scrollTop(0);
    // signal JS9 init is complete
    JS9.inited = true;
    $(document).trigger("JS9:init");
};

// ---------------------------------------------------------------------
//
// JS9 Public API: public interface for use in Web pages
//
// obviously, you can use any JS9 call in a web page but we will
// keep this interface stable
//
// ---------------------------------------------------------------------

// parse func args, checking for object containing display property
// return new arg list and display id
// used in public api routines to retrieve optional {display: id} arg
JS9.parsePublicArgs = function(args){
    let display = null;
    const argv = Array.from(args);
    const obj = argv[argv.length-1];
    // look for object containing display property as last arg
    if( obj && (typeof obj === "object") &&
	obj.hasOwnProperty("display") && (Object.keys(obj).length === 1) ){
	display = obj.display;
	argv.pop();
    }
    // return results
    return {argv, display};
};

// some public routines are just a wrapper around the underlying image call
// others require a new func
JS9.mkPublic = function(name, s){
    if( typeof s === "string" ){
	if( JS9.Image.prototype[s] ){
	    JS9[name] = function(...args) {
		let got;
		const {display, argv} = JS9.parsePublicArgs(args);
		const im = JS9.getImage(display);
		if( im ){
		    // call the image method
		    got = im[s](...argv);
		    // don't return image handle, it can't be serialized
		    if( (got === im) || (got === im.display) ){
			return JS9.globalOpts.quietReturn ? "" : "OK";
		    }
		    return got;
		}
	    };
	    JS9.publics[name] = JS9[name];
	} else {
	    JS9.error(`unknown image func for mkPublic: ${s}`);
	}
    } else if( typeof s === "function" ){
	JS9[name] = s;
	JS9.publics[name] = JS9[name];
    } else {
	JS9.error(`unsupported type for mkPublic: ${typeof s}`);
    }
};

JS9.mkPublic("CloseImage", "closeImage");
JS9.mkPublic("DisplayImage", "displayImage");
JS9.mkPublic("DisplayExtension", "displayExtension");
JS9.mkPublic("DisplaySlice", "displaySlice");
JS9.mkPublic("DisplaySection", "displaySection");
JS9.mkPublic("BlendImage", "blendImage");
JS9.mkPublic("GetColormap", "getColormap");
JS9.mkPublic("SetColormap", "setColormap");
JS9.mkPublic("GetZoom", "getZoom");
JS9.mkPublic("SetZoom", "setZoom");
JS9.mkPublic("GetPan", "getPan");
JS9.mkPublic("SetPan", "setPan");
JS9.mkPublic("AlignPanZoom", "alignPanZoom");
JS9.mkPublic("GetScale", "getScale");
JS9.mkPublic("SetScale", "setScale");
JS9.mkPublic("SetFlip", "setFlip");
JS9.mkPublic("GetFlip", "getFlip");
JS9.mkPublic("GetParam", "getParam");
JS9.mkPublic("SetParam", "setParam");
JS9.mkPublic("GetValPos", "updateValpos");
JS9.mkPublic("ImageToDisplayPos", "imageToDisplayPos");
JS9.mkPublic("DisplayToImagePos", "displayToImagePos");
JS9.mkPublic("ImageToLogicalPos", "imageToLogicalPos");
JS9.mkPublic("LogicalToImagePos", "logicalToImagePos");
JS9.mkPublic("GetWCSUnits", "getWCSUnits");
JS9.mkPublic("SetWCSUnits", "setWCSUnits");
JS9.mkPublic("GetWCS", "getWCS");
JS9.mkPublic("SetWCS", "setWCS");
JS9.mkPublic("GetWCSSys", "getWCSSys");
JS9.mkPublic("SetWCSSys", "setWCSSys");
JS9.mkPublic("ShowShapeLayer", "showShapeLayer");
JS9.mkPublic("ActiveShapeLayer", "activeShapeLayer");
JS9.mkPublic("ToggleShapeLayers", "toggleShapeLayers");
JS9.mkPublic("AddShapes", "addShapes");
JS9.mkPublic("RemoveShapes", "removeShapes");
JS9.mkPublic("GetShapes", "getShapes");
JS9.mkPublic("ChangeShapes", "changeShapes");
JS9.mkPublic("DisplayCoordGrid", "displayCoordGrid");
JS9.mkPublic("Print", "print");
JS9.mkPublic("SavePNG", "savePNG");
JS9.mkPublic("SaveJPEG", "saveJPEG");
JS9.mkPublic("SaveFITS", "saveFITS");
JS9.mkPublic("UploadFITSFile", "uploadFITSFile");
JS9.mkPublic("CountsInRegions", "countsInRegions");
JS9.mkPublic("RadialProfile", "radialProfile");
JS9.mkPublic("Plot3D", "plot3d");
JS9.mkPublic("RunAnalysis", "runAnalysis");
JS9.mkPublic("GetAnalysis", "getAnalysis");
JS9.mkPublic("RawDataLayer", "rawDataLayer");
JS9.mkPublic("GaussBlurData", "gaussBlurData");
JS9.mkPublic("ImarithData", "imarithData");
JS9.mkPublic("RotateData", "rotateData");
JS9.mkPublic("ReprojectData", "reprojectData");
JS9.mkPublic("ShiftData", "shiftData");
JS9.mkPublic("FilterRGBImage", "filterRGBImage");
JS9.mkPublic("MoveToDisplay", "moveToDisplay");

// lookup an image
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("LookupImage", function(...args){
    const obj = JS9.parsePublicArgs(args);
    return JS9.lookupImage(obj.argv[0], obj.display);
});

// lookup a display
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("LookupDisplay", function(...args){
    const obj = JS9.parsePublicArgs(args);
    return JS9.lookupDisplay(obj.argv[0]||obj.display, obj.argv[1]);
});

// rename a display:
// RenameDisplay(nid)                  # change def. id (usually "JS9") to nid
// RenameDisplay(nid, {display: oid})  # change oid to nid
// RenameDisplay(oid, nid)             # change oid to nid
JS9.mkPublic("RenameDisplay", function(...args){
    let nid, oid, disp;
    const obj = JS9.parsePublicArgs(args);
    switch( obj.argv.length ){
    case 0:
	return;
    case 1:
	oid = obj.display;
	nid = obj.argv[0];
	break;
    default:
	oid = obj.argv[0];
	nid = obj.argv[1];
	break;
    }
    disp = JS9.lookupDisplay(oid);
    if( disp && disp.id ){
	oid = disp.id;
	// save the orignal id, since existing plugins use it
	if( !disp.oid ){
	    disp.oid = oid;
	}
	// set the new id
	disp.id = nid;
	// tell the helper to recognize the new instead of the old
	JS9.helper.send("renameDisplay", {odisplay: oid, ndisplay: disp.id});
    }
});

// close all displayed images
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("CloseDisplay", function(...args){
    let i, im, disp;
    const obj = JS9.parsePublicArgs(args);
    disp = JS9.lookupDisplay(obj.argv[0] || obj.display);
    // reverse loop because we slice JS9.images
    for(i=JS9.images.length-1; i>=0; i--){
	im = JS9.images[i];
	if( im.display === disp ){
	    im.closeImage();
	}
    }
});

// add a colormap to JS9
JS9.mkPublic("AddColormap", function(...args){
    let colormap, a1, a2, a3, a4, reader, cobj;
    const obj = JS9.parsePublicArgs(args);
    const obj2cmap = (xobj, opts) => {
	let i, tobj;
	if( typeof xobj !== "object" ){
	    JS9.error("invalid colormap object for JS9.AddColormap()");
	}
	if( !$.isArray(xobj) ){
	    xobj = [xobj];
	}
	for(i=0; i<xobj.length; i++){
	    tobj = xobj[i];
	    if( !tobj.name ){
		JS9.error("missing name for colormap in JS9.AddColormap()");
	    }
	    if( tobj.vertices ){
		JS9.AddColormap(tobj.name,
				tobj.vertices[0],
				tobj.vertices[1],
				tobj.vertices[2],
				opts);
	    } else if( tobj.colors ){
		JS9.AddColormap(tobj.name, tobj.colors, opts);
	    } else {
		JS9.error("unknown colormap type for JS9.AddColormap()");
	    }
	}
    };
    colormap = obj.argv[0];
    a1 = obj.argv[1];
    a2 = obj.argv[2];
    a3 = obj.argv[3];
    a4 = obj.argv[4];
    if( colormap instanceof Blob ){
	// file reader object from openLocalLoadColormap
	reader = new FileReader();
	reader.onload = (ev) => {
	    try{ cobj = JSON.parse(ev.target.result); }
	    catch(e){ JS9.error("can't parse json colormap", e); }
	    obj2cmap(cobj, a1);
	};
	reader.readAsText(colormap);
    } else if( typeof colormap  === "object" ){
	// from LoadColormap
	obj2cmap(colormap, a1);
    } else {
	switch(obj.argv.length){
	case 1:
	    // json formatted string
	    try{ cobj = JSON.parse(colormap); }
	    catch(e){ JS9.error("can't parse JSON colormap", e); }
	    obj2cmap(cobj);
	    break;
	case 2:
	case 3:
	    if( typeof a1 === "string" ){
		try{ a1 = JSON.parse(a1); }
		catch(e){ JS9.error("can't parse JSON colormap", e); }
	    }
	    JS9.checkNew(new JS9.Colormap(colormap, a1));
	    if( obj.argv.length === 2 ){
		JS9.globalOpts.topColormaps.push(colormap);
	    } else if( typeof a2 !== "object" || a2.toplevel !== false ){
		JS9.globalOpts.topColormaps.push(colormap);
	    }
	    break;
	case 4:
	case 5:
	    if( typeof a1 === "string" ){
		try{ a1 = JSON.parse(a1); }
		catch(e){ JS9.error("can't parse JSON colormap", e); }
	    }
	    if( typeof a2 === "string" ){
		try{ a2 = JSON.parse(a2); }
		catch(e){ JS9.error("can't parse JSON colormap", e); }
	    }
	    if( typeof a3 === "string" ){
		try{ a3 = JSON.parse(a3); }
		catch(e){ JS9.error("can't parse JSON colormap", e); }
	    }
	    JS9.checkNew(new JS9.Colormap(colormap, a1, a2, a3));
	    if( obj.argv.length === 4 ){
		JS9.globalOpts.topColormaps.push(colormap);
	    } else if( !a4 || typeof a4 !== "object" || a4.toplevel !== false ){
		JS9.globalOpts.topColormaps.push(colormap);
	    }
	    break;
	default:
	    JS9.error("AddColormap() requires a colormap name and 1 or 3 args");
	    break;
	}
    }
});

// load a colormap file
JS9.mkPublic("LoadColormap", function(...args){
    let file, opts;
    const obj = JS9.parsePublicArgs(args);
    file = obj.argv[0];
    opts = obj.argv[1];
    // sanity check
    if( !file ){
	JS9.error("JS9.LoadColormap: no file specified for colormap load");
    }
    // convert blob to string
    if( typeof file === "object" ){
	JS9.AddColormap(file, opts);
    } else if( typeof file === "string" ){
	file = JS9.fixPath(file);
	JS9.fetchURL(null, file, null, (data) => {
	    JS9.AddColormap(data, opts);
	});
    } else {
	// oops!
	JS9.error(`unknown file type for LoadColormap: ${typeof file}`);
    }
});

// set RGB mode (and maybe the images themselves)
JS9.mkPublic("SetRGBMode", function(...args){
    let i, im, mode, imobj;
    const obj = JS9.parsePublicArgs(args);
    const colors = ["red", "green", "blue"];
    const ids = ["rid", "gid", "bid"];
    mode = obj.argv[0];
    imobj = obj.argv[1];
    if( mode === undefined ){
	mode =  !JS9.globalOpts.rgb.active;
    }
    if( imobj ){
	for(i=0; i<3; i++){
	    im = imobj[ids[i]];
	    if( typeof im === "string" ){
		im = JS9.LookupImage(im);
	    }
	    if( !im ){
		continue;
	    }
	    im.setColormap(colors[i]);
	}
    }
    if( mode === "true" ){
	mode = true;
    } else if( mode === "false" ){
	mode = false;
    }
    JS9.globalOpts.rgb.active = !!mode;
    JS9.DisplayImage({display: obj.display});
    return JS9.globalOpts.rgb.active;
});

// get RGB mode info
JS9.mkPublic("GetRGBMode", function(){
    return {active: JS9.globalOpts.rgb.active,
	    rid: JS9.globalOpts.rgb.rim? JS9.globalOpts.rgb.rim.id: null,
	    gid: JS9.globalOpts.rgb.gim? JS9.globalOpts.rgb.gim.id: null,
	    bid: JS9.globalOpts.rgb.bim? JS9.globalOpts.rgb.bim.id: null};
});

// set/clear valpos flag
JS9.mkPublic("SetValPos", function(...args){
    let mode;
    let got = null;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    mode = obj.argv[0];
    if( im ){
	got = im.params.valpos;
	im.params.valpos = mode;
    }
    return got;
});

// set/clear image inherit flag
JS9.mkPublic("SetImageInherit", function(...args){
    let mode;
    let got = null;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    mode = obj.argv[0];
    if( im ){
	got = im.params.inherit;
	im.params.inherit = mode;
    }
    return got;
});

JS9.mkPublic("GetImageInherit", function(...args) {
    let got = null;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    if( im ){
	got = im.params.inherit;
    }
    return got;
});

// display in-page FITS images and png files
JS9.mkPublic("Load", function(...args){
    let i, s, im, ext, disp, display, func, blob, bytes, topts, tfile, vfile;
    let file, opts;
    let ptype = "fits";
    const obj = JS9.parsePublicArgs(args);
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
    // opts can be an object or json
    if( typeof opts === "object" ){
	// make a copy so we can modify it
	opts = $.extend(true, {}, opts);
    } else if( opts && typeof opts === "string" ){
	// convert json to object
	try{ opts = JSON.parse(opts); }
	catch(e){ opts = { /* empty */ }; }
    } else {
	// init as an empty object
	opts = {};
    }
    // if display was implicit, add it to opts
    opts.display = opts.display || display;
    // check for onload func
    if( opts.onload ){
	func = opts.onload;
    } else if( JS9.imageOpts.onload ){
	func = JS9.imageOpts.onload;
	opts.onload = func;
    }
    // unset previous fetch status before new load
    delete JS9.fetchURL.status;
    // handle blob containing FITS
    if( file instanceof Blob ){
	if( file.path || file.name ){
	    // new file (or, for Electron.js desktop, the path, which is better)
	    opts.filename = file.path || file.name;
	    // does this image already exist?
	    if( typeof opts.refresh === "object" ){
		im = opts.refresh;
	    } else {
		im = JS9.lookupImage(opts.filename, opts.display);
	    }
	    if( im ){
		// do we refresh or redisplay?
		if( JS9.isNull(opts.refresh) ){
		    opts.refresh = JS9.globalOpts.reloadRefresh;
		}
		if( opts.refresh ){
		    // save the handle of the image we will be refreshing
		    opts.refresh = im;
		} else{
		    // if not refreshing, just re-display and exit
		    im.displayImage("display", opts);
		    im.refreshLayers();
		    im.display.clearMessage();
		    if( opts.onload ){
			try{ JS9.xeqByName(opts.onload, window, im); }
			catch(e){ JS9.error("in image onload callback", e,
					    false); }
		    }
		    JS9.waiting(false);
		    return;
		}
	    } else {
		// remove any extraneous refresh flag
		delete opts.refresh;
	    }
	} else {
	    // remove any extraneous refresh flag
	    delete opts.refresh;
	}
	if( !opts.filename ){
	    opts.filename = JS9.ANON + JS9.uniqueID();
	}
	// look for a mime type to tell us how to process this blob
	if( file.type && file.type.includes("image/") ){
	    switch(file.type){
	    case "image/fits":
		break;
	    default:
		ptype = "img";
		break;
	    }
	} else if( opts.filename.split(".").pop().match(/(png|jpg|jpeg)/i) ){
	    ptype = "img";
	}
	// processing type: img or fits
	switch(ptype){
	case "fits":
	    topts = $.extend(true, {}, JS9.fits.options, opts);
	    // for Electron.js desktop, see if we can access the path locally
	    // (for blobs coming from drag/drop and openLocal)
	    if( file.path && opts.localAccess ){
		vfile = JS9.localAccess(file.path);
		// if so, use the local file instead of storing a vfile
		if( vfile ){
		    file = file.path;
		    topts.file = file;
		    topts.vfile = vfile;
		}
	    }
	    try{ JS9.handleFITSFile(file, topts, JS9.NewFitsImage); }
	    catch(e){ JS9.error("can't process FITS file", e); }
	    break;
	case "img":
	    try{ JS9.handleImageFile(file, opts, JS9.Load); }
	    catch(e){ JS9.error("can't process IMG file", e); }
	    break;
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
	JS9.error(`unknown file type for Load: ${typeof file}`);
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
	    opts.filename = JS9.ANON + JS9.uniqueID();
	}
	blob.name = opts.filename;
	topts = $.extend(true, {}, JS9.fits.options, opts);
	try{ JS9.handleFITSFile(blob, topts, JS9.NewFitsImage); }
	catch(e){ JS9.error("can't process FITS file", e); }
	return;
    }
    // do we refresh or redisplay?
    if( JS9.isNull(opts.refresh) ){
	opts.refresh = JS9.globalOpts.reloadRefresh;
    }
    if( opts.refresh ){
	// use passed im handle, if possible
	if( typeof opts.refresh === "object" ){
	    im = opts.refresh;
	} else {
	    // look for already-loaded image
	    s = file.split("/").reverse()[0];
	    im = JS9.lookupImage(s, opts.display);
	    if( im ){
		opts.refresh = im;
	    }
	}
    } else {
	// look for already-loaded image
	s = file.split("/").reverse()[0];
	im = JS9.lookupImage(s, opts.display);
    }
    // if already loaded and not refreshing, just redisplay and exit
    if( im && !opts.refresh ){
	// display image, 2D graphics, etc.
	im.displayImage("all", opts);
	im.display.clearMessage();
	if( opts.onload ){
	    try{ JS9.xeqByName(opts.onload, window, im); }
	    catch(e){ JS9.error("in image onload callback", e, false); }
	}
	JS9.waiting(false);
	return;
    }
    file = JS9.cleanPath(file);
    // check file extension
    ext = file.split(".").pop().toLowerCase();
    if( ext === "png" ){
	if( JS9.globalOpts.pngisfits ){
	    // png file: call the constructor and save the result
	    JS9.checkNew(new JS9.Image(file, opts, func));
	} else {
	    file = JS9.fixPath(file, opts);
	    JS9.fetchURL(null, file, opts, JS9.NewFitsImage);
	}
    } else {
	if( JS9.fits2RepFile(opts.display, file, opts, "fits") ){
	    return;
	} else if( JS9.fits2RepFile(opts.display, file, opts, "png", func) ){
	    return;
	}
	if( opts.display ){
	    disp = JS9.lookupDisplay(opts.display);
	}
	JS9.waiting(true, disp);
	// cleanup previous FITS file support, if necessary
	// do this before we handle the new FITS file, or else
	// we end up with a memory leak in the emscripten heap!
	if( im && opts.refresh ){
	    JS9.cleanupFITSFile(im.raw, true);
	}
	// file with possible Electron path fixes
	file = JS9.fixPath(file, opts);
	// remove extension so we can find the file itself
	tfile = file.replace(/\[.*\]/, "");
	// are we able to access a local file directly, without fetching?
	// note to myself: cfitsio uncompresses .gz files into memory, so
	// there is no benefit to having ".gz" in the localTemplates list.
	vfile = JS9.localAccess(file);
	if( vfile ){
	    // access local file directly
	    topts = $.extend(true, {}, JS9.fits.options, opts);
	    topts.file = file;
	    topts.vfile = vfile;
	    // give spinner a chance to start up
	    window.setTimeout(() => {
		try{ JS9.handleFITSFile(file, topts, JS9.NewFitsImage); }
		catch(e){ JS9.error("can't process FITS file", e); }
	    }, 0);
	} else {
	    // fetch file
	    JS9.fetchURL(file, tfile, opts);
	}
    }
});

// create a new instance of JS9 in a window (light or new)
JS9.mkPublic("LoadWindow", function(...args){
    let s, id, display, did, head, body, win, winid, initialURL, xobj;
    let wid, wtype, wurl, idbase, title, warr, wwidth, wheight;
    let file, opts, type, html, winopts;
    const lopts = JS9.lightOpts[JS9.LIGHTWIN];
    const obj = JS9.parsePublicArgs(args);
    const removeDisplay = (display) => {
	// remove from display list
	const idx = $.inArray(display, JS9.displays);
	if( idx >= 0 ){ JS9.displays.splice(idx, 1); }
    };
    const getHTML = (id, opts, winopts) => {
	let html, display;
	opts = opts || {};
	if( opts.clone ){
	    display = JS9.lookupDisplay(opts.clone, false);
	}
	if( winopts ){
	    warr = winopts.match(/(.*width=)([0-9]+)(px,height=)([0-9]+)(px.*)/, "$1@@H@@$3");
	    wwidth  = parseInt(warr[2], 10);
	    wheight = parseInt(warr[4], 10);
	}
        // make up the html with the unique id
        html = "<hr class='hline0'>";
	// menubar
	if( !display                                        ||
	    ($(`#${opts.clone}Menubar`).length > 0         &&
	     !display.pluginInstances.JS9Menubar.isDynamic) ){
	    html += `<div class='JS9Menubar' id='${id}Menubar'></div>`;
	} else if( winopts ){
	    wheight -= 40;
	}
	// display
	html += `<div class='JS9' id='${id}'></div>`;
	// colorbar
	if( !display                                         ||
	    ($(`#${opts.clone}Colorbar`).length > 0         &&
	     !display.pluginInstances.JS9Colorbar.isDynamic) ){
	    if( display && display.pluginInstances.JS9Colorbar ){
		s = `data-showTicks='${display.pluginInstances.JS9Colorbar.showTicks}'`;
	    } else {
		s = "";
	    }
	    html += `<div style='margin-top: 2px;'><div class='JS9Colorbar' id='${id}Colorbar' ${s}></div></div>`;
	    if( display && display.pluginInstances.JS9Colorbar &&
		!display.pluginInstances.JS9Colorbar.showTicks ){
		wheight -= 15;
	    }
	} else if( winopts ){
	    wheight -= 44;
	}
	if( winopts ){
	    if( JS9.Dysel.retrievePlugins().length ){
		wwidth  += 2;
		wheight += 2;
	    }
	    return {html: html, winopts: warr[1] + String(wwidth) + warr[3] + String(wheight) + warr[5]};
	}
	return html;
    };
    // create display and load image into a light window
    const lightLoad = (file, opts) => {
	let display;
        // create the new JS9 Display
        display = new JS9.Display(id);
	// save the light window id;
	display.winid = winid;
	// add to list of displays
	JS9.helper.send("addDisplay", {"display": id});
        // instantiate new plugins
        JS9.instantiatePlugins();
        // load the image into this display
        opts.display = id;
        // just becomes a standard load
	if( file ){
	    JS9.Load(file, opts);
	}
	return display;
    };
    // close a light window, moving images if necessary
    const lightClose = (display) => {
	let i, im;
	let got = 0;
	const ims = [];
	// make a list of images in his display
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( im.display.id === id ){
		ims.push(im);
	    }
	}
	// done if no images
	if( !ims.length ){
	    // remove display
	    removeDisplay(display);
	    return true;
	}
	// sanity check: the moveto display must exist
	// (and not be the display we are destroying)
	if( JS9.globalOpts.lightWinClose === "move" ){
	    if( JS9.isNull(JS9.globalOpts.lightWinMoveTo) ||
		JS9.globalOpts.lightWinMoveTo === id      ){
		got = 0;
	    } else {
		for(i=0, got=0; i<JS9.displays.length; i++){
		    if( JS9.displays[i].id ===
			JS9.globalOpts.lightWinMoveTo ){
			got++;
			break;
		    }
		}
	    }
	    if( !got ){
		JS9.globalOpts.lightWinClose = "ask";
		delete JS9.globalOpts.lightWinMoveTo;
	    }
	}
	switch(JS9.globalOpts.lightWinClose ){
	case "close":
	    // remove display
	    removeDisplay(display);
	    // close them all
	    for(i=0; i<ims.length; i++){
		try{ ims[i].closeImage(); }
		catch(ignore){ /* empty */ }
	    }
	    return true;
	case "move":
	    // remove display
	    removeDisplay(display);
	    // move them to the first display
	    for(i=0; i<ims.length; i++){
		try{ ims[i].moveToDisplay(JS9.globalOpts.lightWinMoveTo); }
		catch(ignore){ /* empty */ }
	    }
	    return true;
	case "ask":
	default:
	    wid = `lightCloseID${JS9.uniqueID()}`;
	    if( JS9.allinone ){
		wtype = "inline";
		wurl = JS9.allinone.lightCloseHTML;
	    } else {
		wtype = "ajax";
		wurl = JS9.InstallDir(JS9.lightOpts.lcloseURL);
	    }
	    $("#dhtmlwindowholder")
		.arrive("#lightWinCloseForm", {onceOnly: true}, () => {
		    let i, el;
		    // on arrival, add JS9 displays to 'move' part of form
		    el = $("#lightWinCloseForm").find("#lightWinCloseSel");
		    for(i=0; i<JS9.displays.length; i++){
			if( JS9.displays[i].id !== id ){
			    el.append($('<option>', {
				value: JS9.displays[i].id,
				text:  JS9.displays[i].id
			    }));
			}
		    }
		});
	    did = JS9.lightWin(wid, wtype, wurl, "Closing a light window",
			       lopts.lcloseWin);
	    $(did).data("dispid", id);
	    $(did).data("winid", winid);
	    return false;
	}
    };
    // input args
    file = obj.argv[0];
    opts = obj.argv[1];
    type = obj.argv[2];
    html = obj.argv[3];
    winopts = obj.argv[4];
    // opts can be an object or json
    if( typeof opts === "object" ){
	// make a copy so we can modify it
	opts = $.extend(true, {}, opts);
    } else if( opts && typeof opts === "string" ){
	// convert json to object
	try{ opts = JSON.parse(opts); }
	catch(e){ opts = {}; }
    } else {
	// init as an empty object
	opts = {};
    }
    // default window type
    type = type || "light";
    //  default base id
    idbase = `${type || ""}win`;
    // create the specified type of window
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
        did = `d${id}`;
	// inner html housing JS9 display, etc.
	if( html ){
	    // html specified: def window opts is standard light image window
	    winopts = winopts || lopts.imageWin;
	} else {
	    // no html specified: use originating display setup, if possible,
	    // otherwise use defaults, and always use default window opts
	    xobj = getHTML(id, opts, lopts.imageWin);
	    // always use returned html (there being no other option)
	    html = xobj.html;
	    // but only use the new winopts if no winopts was specified
            winopts = winopts || xobj.winopts;
	}
	// nice title
	title = sprintf(`JS9 Display${JS9.IDFMT}`, id);
        // create the light window
        winid = JS9.lightWin(did, "inline", html, title, winopts);
	// set up display and load image
	display = lightLoad(file, opts);
	// on window close, we need to deal with the displayed images
	winid.onclose = () => {
	    return lightClose(display);
	};
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
	// window opts
	winopts = winopts || `width=${JS9.globalOpts.newWindowWidth}, height=${ JS9.globalOpts.newWindowHeight}`;
        // get our own file's header for css and js files
        // if page is generated on the server side, hardwire ...
        // if JS9 is not installed, hardwire ...
        head = document.getElementsByTagName('head')[0].innerHTML;
	// remove load of astroem[w].js, so it will be loaded during init
	head = head.replace(/src=['"].*astroemw?\.js['"]/, "");
        // but why doesn't the returned header contain the js9 js file??
	// umm... it seems to have it, at least FF does as of 8/25/15 ...
	if( !head.match(/src=["'].*js9\.js/)      &&
	    !head.match(/src=["'].*js9\.min\.js/) ){
            head += '<script type="text/javascript" src="js9.min.js"></script>';
	}
        // make a body containing the JS9 elements and the preload call
        body = html || getHTML(id, opts);
        // combine head and body into a full html file
        html = `<html><head>${head}</head><body`;
	if( file ){
            html += sprintf(" onload='JS9.Preload(\"%s\",%s);'",
			    file, JSON.stringify(opts));
	}
        html += `>${body}</body></html>\n`;
        // open the new window
	if( window.isElectron ){
	    initialURL = "data:text/html,<html><body><script>window.addEventListener('message', (ev) => {document.documentElement.innerHTML=ev.data</script><p></body></html>";
	}
        win = window.open(initialURL, id, winopts);
	if( !win ){
	    JS9.error("could not create window (check your pop-up blockers)");
	    return;
	}
	if( win.document ){
            // open it (not strictly necessary but ...)
            win.document.open();
            // overwrite the doc with our html
            win.document.write(html);
            // must close!
            win.document.close();
	} else if( win.postMessage ){
	    JS9.error("LoadWindow('new') is disabled on the Desktop for security reasons");
	} else {
	    JS9.error("no method available for drawing image into window");
	}
	// return the id
	return id;
    }
});

// load a link using back-end server as a proxy
JS9.mkPublic("LoadProxy", function(...args){
    let f, disp, url, opts;
    const obj = JS9.parsePublicArgs(args);
    url = obj.argv[0];
    opts = obj.argv[1];
    if( !JS9.globalOpts.loadProxy ){
	JS9.error("proxy load not available for server");
    }
    if( !JS9.globalOpts.workDir ){
	JS9.error("proxy load requires a temp workDir for server");
    }
    if( !url ){
	JS9.error("no url specified for proxy load");
    }
    url = url.trim();
    if( url.match(/dropbox\.com/) ){
	// http://stackoverflow.com/questions/20757891/cross-origin-image-load-from-cross-enabled-site-is-denied
	url = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
	// https://blogs.dropbox.com/developers/2013/08/programmatically-download-content-from-share-links/
	url = `${url.replace('?dl=0', '')}?raw=1`;
    } else if( url.match(/drive\.google\.com/) ){
	url=url.replace(/\/file\/d\/(\w+)\/\w+\?usp=sharing/,
			'/uc?export=download&id=$1');
    }
    if( obj.display ){
	disp = JS9.lookupDisplay(obj.display);
    }
    // opts can be an object or json
    if( typeof opts === "object" ){
	// make a copy so we can modify it
	opts = $.extend(true, {}, opts);
    } else if( opts && typeof opts === "string" ){
	// convert json to object
	try{ opts = JSON.parse(opts); }
	catch(e){ opts = {}; }
    } else {
	// init as an empty object
	opts = {};
    }
    JS9.waiting(true, disp);
    JS9.Send('loadproxy', {'cmd': `js9Xeq loadproxy ${url}`}, (r) => {
        let robj;
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
	    if( opts.fits2png === undefined ){
		opts.fits2png = false;
	    }
	    f = JS9.cleanPath(robj.stdout);
	    // proxy file
	    opts.proxyFile = f;
	    // relative path: add install dir prefix
	    if( f.charAt(0) !== "/" ){
		f = JS9.InstallDir(f);
	    }
	    // desktop app: don't make path relative to current directory
	    opts.fixpath = false;
	    // save original url
	    opts.proxyURL = url;
	    // load new file
	    JS9.Load(f, opts, {display: obj.display});
	} else {
	    JS9.error('internal error: no return from load proxy command');
	}
    });
});

// save array of files to preload or preload immediately,
// depending on the state of processing
JS9.mkPublic("Preload", function(...args){
    let i, j, mode, urlexp, func, arg1;
    let emsg = "";
    let pobj = null;
    let dobj = null;
    let alen = args.length;
    const oalerts = JS9.globalOpts.alerts;
    const obj = JS9.parsePublicArgs(args);
    const baseexp = JS9.URLEXP;
    const sesexp = /\.ses$/;
    const cmapexp = /\.cmap$/;
    arg1 = obj.argv[0];
    // for socketio and loadProxy, support LoadProxy calls
    if( JS9.globalOpts.loadProxy && JS9.helper.baseurl ){
	urlexp = new RegExp(`^${JS9.helper.baseurl}`);
    }
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
	    JS9.fits.name && (JS9.preloads.length > 0) ){
	    mode = 2;
	} else {
	    // do nothing
	    mode = 3;
	}
	break;
    case 1:
	// boolean => we are ready to load
	if( typeof arg1 === "boolean" ){
	    // if we have previously saved images, load now
	    if( arg1 && (JS9.preloads.length > 0) ){
		mode = 2;
	    } else {
		// do nothing
		mode = 3;
	    }
	} else {
	    // image args => if we are connected,  we can load the images now
	    if( ((JS9.helper.connected === null) || JS9.helper.connected) &&
	        JS9.fits.name ){
		mode = 1;
	    } else {
		// save images and wait
		mode = 0;
	    }
	}
	break;
    default:
	// image args => if we already are connected, we can load the images now
	if( ((JS9.helper.connected === null) || JS9.helper.connected) &&
	    JS9.fits.name ){
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
	    if( (j < alen) && (typeof args[j] === "object") ){
		pobj = $.extend(true, {}, args[j]);
		JS9.preloads.push([args[i], pobj, dobj]);
		i++;
	    } else if( (j < alen) && args[j].startsWith('{') ){
		try{ pobj = JSON.parse(args[j]); }
		catch(e){ pobj = null; }
		JS9.preloads.push([args[i], pobj, dobj]);
		i++;
	    } else {
		JS9.preloads.push([args[i], null, dobj]);
	    }
	}
	break;
    case 1:
	// preload the image(s) now from args
	JS9.globalOpts.alerts = false;
	for(i=0; i<alen; i++){
	    if( urlexp                      &&
		args[i].match(baseexp) &&
		!args[i].match(urlexp) ){
		func = JS9.LoadProxy;
	    } else if( args[i].match(sesexp) ){
		func = JS9.LoadSession;
	    } else if( args[i].match(cmapexp) ){
		func = JS9.LoadColormap;
	    } else {
		func = JS9.Load;
	    }
	    j = i + 1;
	    if( (j < alen) && (typeof args[j] === "object") ){
		if( func === JS9.Load || func === JS9.LoadProxy ){
		    JS9.preloadwaiting[JS9.cleanPath(args[i])] = true;
		}
		try{
		    if( dobj ){
			func(args[i], args[j], dobj);
		    } else {
			func(args[i], args[j]);
		    }
		}
		catch(e){ emsg = `${emsg} ${args[i]}`;}
		i++;
	    } else if( (j < alen) && args[j].startsWith('{') ){
		try{ pobj = JSON.parse(args[j]); }
		catch(e){ pobj = null; }
		if( func === JS9.Load || func === JS9.LoadProxy ){
		    JS9.preloadwaiting[JS9.cleanPath(args[i])] = true;
		}
		try{
		    if( dobj ){
			func(args[i], pobj, dobj);
		    } else {
			func(args[i], pobj);
		    }
		}
		catch(e){ emsg = `${emsg} ${args[i]}`;}
		i++;
	    } else {
		if( func === JS9.Load || func === JS9.LoadProxy ){
		    JS9.preloadwaiting[JS9.cleanPath(args[i])] = true;
		}
		try{
		    if( dobj ){
			func(args[i], null, dobj);
		    } else {
			func(args[i], null);
		    }
		}
		catch(e){ emsg = `${emsg} ${args[i]}`;}
	    }
	}
	JS9.globalOpts.alerts = oalerts;
	if( emsg ){ JS9.error(`could not preload image(s): ${emsg}`);}
	break;
    case 2:
	// preload the image(s) now from saved args
	JS9.globalOpts.alerts = false;
	for(i=0; i<JS9.preloads.length; i++){
	    if( urlexp                            &&
		JS9.preloads[i][0].match(baseexp) &&
		!JS9.preloads[i][0].match(urlexp) ){
		func = JS9.LoadProxy;
	    } else if( JS9.preloads[i][0].match(sesexp) ){
		func = JS9.LoadSession;
	    } else if( JS9.preloads[i][0].match(cmapexp) ){
		func = JS9.LoadColormap;
	    } else {
		func = JS9.Load;
	    }
	    if( func === JS9.Load || func === JS9.LoadProxy ){
		JS9.preloadwaiting[JS9.cleanPath(JS9.preloads[i][0])] = true;
	    }
	    try{
		if( JS9.preloads[i][2] ){
		    func(JS9.preloads[i][0], JS9.preloads[i][1],
			 JS9.preloads[i][2]);
		} else {
		    func(JS9.preloads[i][0], JS9.preloads[i][1]);
		}
	    }
	    catch(e){ emsg = `${emsg} ${JS9.preloads[i][0]}`;}
	}
	JS9.globalOpts.alerts = oalerts;
	if( emsg ){ JS9.error(`could not preload image(s): ${emsg}`);}
	// remove saved args so we don't reload them on reconnect
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
JS9.mkPublic("RefreshImage", function(...args){
    let fits, opts;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    const retry = (hdu) => {
	im.refreshImage(hdu, opts);
    };
    fits = obj.argv[0];
    opts = obj.argv[1] || {};
    if( im ){
	opts.id = im.id;
	if( fits instanceof Blob ){
	    // cleanup previous FITS heap before handling the new FITS file,
	    // or we end up with a memory leak in the emscripten heap
	    if( !opts.rawid || opts.rawid === im.raw.id ){
		JS9.cleanupFITSFile(im.raw, true);
	    }
	    try{ JS9.handleFITSFile(fits, JS9.fits.options, retry); }
	    catch(e){ JS9.error("can't refresh FITS file", e); }
	} else {
	    im.refreshImage(fits, opts);
	}
    } else if( fits instanceof Blob ){
	JS9.Load(...args);
    }
});

// get specified status
JS9.mkPublic("GetStatus", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.argv[1] || obj.display);
    const stat = obj.argv[0] || "load";
    if( !obj.argv.length ){
	return ["Load", "CreateMosaic", "DisplaySection", "LoadCatalog", "LoadRegions", "ReprojectData", "RotateData", "RunAnalysis"];
    }
    // if the fetch is still running or failed, return the status
    if( JS9.fetchURL.status && stat.match(/^(pre)?load$/i) ){
	return JS9.fetchURL.status;
    }
    // return status for specified image
    if( im ){
	return im.getStatus(stat);
    }
    return "none";
});

// get status of a Load ("complete" means ... complete)
JS9.mkPublic("GetLoadStatus", function(...args){
    return JS9.GetStatus("load", ...args);
});

// http://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
JS9.mkPublic("CopyToClipboard", function(text, im){
    let msg, successful, textArea;
    // save text for pseudo-pasting
    JS9.clipboard = text;
    // tmp textarea which from which the selection will be copied
    textArea = document.createElement("textarea");
    //
    // *** styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a flash,
    // so some of these are just precautions. However in IE the element
    // is visible whilst the popup box asking the user for permission for
    // the web page to copy to the clipboard.
    //
    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = "fixed";
    textArea.style.top = 0;
    textArea.style.left = 0;
    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as it gives a negative w/h on some browsers.
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;
    // Clean up any borders.
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = "transparent";
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
	successful = document.execCommand("copy");
	if( successful ){
	    msg = "OK";
	} else {
	    msg = "MANUAL";
	    if( JS9.BROWSER[2].match(/Mac/) ){
		window.prompt("copy to clipboard: Cmd+C", text);
	    } else {
		window.prompt("copy to clipboard: Ctrl+C", text);
	    }
	}
    } catch (err) {
	msg = "ERROR";
    }
    document.body.removeChild(textArea);
    // required to detatch keydown from textArea
    // otherwise, the next keydown has no effect
    if( im && im.display ){
	im.display.divjq.trigger("mouseout");
	im.display.divjq.trigger("mouseenter");
    }
    return msg;
});

JS9.mkPublic("CopyFromClipboard", function(){
    return JS9.clipboard || "";
});

// bring up the file dialog box and open selected FITS file(s)
JS9.mkPublic("OpenFileMenu", function(...args) {
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.display);
    if( display ){
	$(`#openLocalLoad-${display.id}`).click();
    }
});

// bring up the file dialog box and open selected region files(s)
JS9.mkPublic("OpenRegionsMenu", function(...args) {
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.display);
    if( display ){
	$(`#openLocalLoadRegions-${display.id}`).click();
    }
});

// bring up the file dialog box and load selected session files(s)
JS9.mkPublic("OpenSessionMenu", function(...args) {
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.display);
    if( display ){
	$(`#openLocalLoadSession-${display.id}`).click();
    }
});

// bring up the file dialog box and open selected catalog file
JS9.mkPublic("OpenCatalogsMenu", function(...args) {
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.display);
    if( display ){
	$(`#openLocalLoadCatalog-${display.id}`).click();
    }
});

// bring up the file dialog box and load selected colormap file(s)
JS9.mkPublic("OpenColormapMenu", function(...args) {
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.display);
    if( display ){
	$(`#openLocalLoadColormap-${display.id}`).click();
    }
});

// save a colormap to disk
JS9.mkPublic("SaveColormap", function(...args) {
    let fname, im, cobj, s, blob, arg1, arg2;
    const obj = JS9.parsePublicArgs(args);
    const convertjson = (arg1) => {
	let s = arg1;
	if( typeof arg1 === "string" ){
	    try{ s = JSON.parse(arg1); }
	    catch(e){ /* empty */ }
	}
	return s;
    };
    const getarr = (arr) => {
	let i, c;
	const cobj = [];
	for(i=0; i<arr.length; i++){
	    c = JS9.lookupColormap(arr[i]);
	    if( c ){
		c = $.extend(true, {}, c);
		delete c.type;
		cobj.push(c);
	    }
	}
	if( cobj.length === 1 ){
	    return cobj[0];
	}
	return cobj;
    };
    arg1 = obj.argv[0];
    arg2 = obj.argv[1];
    if( window.hasOwnProperty("saveAs") ){
	// check for json strings in arg1 and/or arg2
	im = JS9.getImage(obj.display);
	if( im ){
	    // convert json to object
	    arg1 = convertjson(arg1);
	    arg2 = convertjson(arg2);
	    if( !arg1 ){
		fname = "js9.cmap";
		cobj = $.extend(true, {}, im.cmapObj);
		delete cobj.type;
	    } else if( typeof arg1 === "string" ){
		fname = arg1;
		if( typeof arg2 === "string" ){
		    cobj = getarr([arg2]);
		} else if( $.isArray(arg2) ){
		    cobj = getarr(arg2);
		} else {
		    cobj = $.extend(true, {}, im.cmapObj);
		    delete cobj.type;
		}
	    } else if( $.isArray(arg1) ){
		fname = "js9.cmap";
		cobj = getarr(arg1);
	    }
	    // convert to json
	    s = JSON.stringify(cobj);
	    // then convert json to blob
	    blob = new Blob([s], {type: 'text/plain'});
	    // save to disk
	    saveAs(blob, fname);
	}
    } else {
	JS9.error("no saveAs() available to save colormap");
    }
    return fname;
});

// call the image constructor as a func
JS9.mkPublic("NewFitsImage", function(...args){
    let func, disp, im, hdu, opts;
    const obj = JS9.parsePublicArgs(args);
    hdu = obj.argv[0];
    opts = obj.argv[1] || {};
    disp = JS9.lookupDisplay(obj.display || opts.display || JS9.DEFID);
    if( opts.refresh ){
	if( typeof opts.refresh === "object" ){
	    // use passed image handle
	    im = opts.refresh;
	} else if( disp && disp.image ){
	    // use current image
	    im = disp.image;
	}
	if( im ){
	    // refresh the image
	    if( opts.onload ){
		opts.onrefresh = opts.onload;
		delete opts.onload;
	    }
	    im.refreshImage(hdu, opts);
	} else {
	    // fallback if we have no image: make a new image
	    if( opts.onload ){
		func = opts.onload;
	    }
	    JS9.checkNew(new JS9.Image(hdu, opts, func));
	}
    } else {
	// make a new image
	if( opts.onload ){
	    func = opts.onload;
	}
	JS9.checkNew(new JS9.Image(hdu, opts, func));
    }
});

// return the image object for the specified image name or the display id
JS9.mkPublic("GetImage", function(...args){
    const obj = JS9.parsePublicArgs(args);
    let id = obj.argv[0];
    if( typeof id !== "string" ){
	id = obj.display;
    }
    return JS9.getImage(id);
});

// return the image data and auxiliary info for the current image
JS9.mkPublic("GetImageData", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    let dflag = obj.argv[0];
    // return data and auxiliary info
    if( im ){
	return im.getImageData(dflag);
    }
    return null;
});

// return the image data and aux info for all images loaded into this display
JS9.mkPublic("GetDisplayData", function(...args){
    let i, id, im, dflag;
    const imarr = [];
    const obj = JS9.parsePublicArgs(args);
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
JS9.mkPublic("GetFITSHeader", function(...args){
    let flag;
    let s = "";
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    flag = obj.argv[0];
    if( im && im.raw ){
	s = JS9.raw2FITS(im.raw, {addcr: flag});
    }
    return s;
});

// turn on and off blending, redisplaying image
JS9.mkPublic("BlendDisplay", function(...args){
    let i, im, mode;
    const imarr = [];
    const obj = JS9.parsePublicArgs(args);
    const id = obj.display || JS9.DEFID;
    const disp = JS9.lookupDisplay(id);
    mode = obj.argv[0];
    if( !disp ){
	JS9.error(`no JS9 display found: ${id}`);
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
    if( mode === "reset" ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im.display.id === id) && im.blend.active ){
		im.blendImage(false);
	    }
	}
	mode = false;
    }
    if( mode === "true" ){
	mode = true;
    } else if( mode === "false" ){
	mode = false;
    }
    // it's true or false
    disp.blendMode = !!mode;
    if( disp.image ){
	// trigger option redisplay
	disp.image.xeqPlugins("image", "ondisplayblend");
	// redisplay image
	disp.image.displayImage();
    }
    return disp.blendMode;
});

// load auxiliary file, if available
// s is the aux file type
JS9.mkPublic("LoadAuxFile", function(...args){
    let file, func;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    file = obj.argv[0];
    func = obj.argv[1];
    if( im ){
	im.loadAuxFile(file, func);
    } else {
	JS9.error(`could not find image for aux file: ${file}`);
    }
});

// run analysis from a Web page form
JS9.mkPublic("SubmitAnalysis", function(...args){
    let topjq, formjq, dispid, im, errstr, el, aname, func, tobj;
    const a = JS9.lightOpts[JS9.LIGHTWIN];
    const obj = JS9.parsePublicArgs(args);
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
	// make sure unchecked elements are in the array
	try{
	    // tobj = $(':input:visible', formjq).serializeArray();
	    tobj = formjq.serializeArray();
	    tobj = tobj.concat($(`#${formjq.attr('id')} input[type=checkbox]:not(:checked)`).map(function() {return {'name': this.name, 'value': 'false'};}).get());
	}
	catch(e){ tobj = null; }
	im.runAnalysis(aname, tobj, func);
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
JS9.mkPublic("PixToWCS", function(...args){
    let s, arr, arg0, ix, iy;
    let x = 1.0;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    if( im ){
	arg0 = obj.argv[0];
	if( typeof arg0 === "object" &&
	    JS9.notNull(arg0.x) && JS9.notNull(arg0.y) ){
	    ix = arg0.x;
	    iy = arg0.y;
	} else {
	    ix = obj.argv[0];
	    iy = obj.argv[1];
	}
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
JS9.mkPublic("WCSToPix", function(...args){
    let str, x, y, arr, arg0, ra, dec;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    if( im ){
	arg0 = obj.argv[0];
	if( typeof arg0 === "object" &&
	    JS9.notNull(arg0.ra) && JS9.notNull(arg0.dec) ){
	    ra = arg0.ra;
	    dec = arg0.dec;
	} else {
	    ra = obj.argv[0];
	    dec = obj.argv[1];
	}
	if( !JS9.isNumber(ra) || !JS9.isNumber(dec) ){
	    JS9.error("invalid input for WCSToPix");
	}
	if( im.raw.wcs > 0 ){
	    arr = JS9.wcs2pix(im.raw.wcs, ra, dec).trim().split(/ +/);
	    x = parseFloat(arr[0]);
	    y = parseFloat(arr[1]);
	    str = sprintf("%f %f", x, y);
	    return {x, y, str};
	}
    }
    return null;
});
// backwards compatibility
JS9.WCS2Pix = JS9.WCSToPix;

// initialize a new shape layer
JS9.mkPublic("NewShapeLayer", function(...args){
    let layer, opts;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    layer = obj.argv[0];
    opts = obj.argv[1];
    if( im ){
	return im.display.newShapeLayer(layer, opts);
    }
    return null;
});

// add a region
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("AddRegions", function(...args){
    let region, opts;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    region = obj.argv[0];
    opts = obj.argv[1];
    if( im ){
	if( !region ){
	    JS9.error("no region specified for AddRegions");
	}
	return im.addShapes("regions", region, opts);
    }
    return null;
});

// remove one or more regions
JS9.mkPublic("RemoveRegions", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    let region = obj.argv[0];
    if( im ){
	im.removeShapes("regions", region);
	im.display.clearMessage("regions");
	return JS9.globalOpts.quietReturn ? "" : "OK";
    }
    return null;
});

// copy one or more regions
JS9.mkPublic("CopyRegions", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    let to = obj.argv[0];
    let region = obj.argv[1];
    if( im ){
	im.copyRegions(to, region);
	return JS9.globalOpts.quietReturn ? "" : "OK";
    }
    return null;
});

// get one or more regions
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("GetRegions", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    if( im ){
	obj.argv.unshift("regions");
	return im.getShapes(...obj.argv);
    }
    return null;
});

// change one or more regions
JS9.mkPublic("ChangeRegions", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    let region = obj.argv[0];
    let opts = obj.argv[1];
    if( im ){
	if( !region ){
	    JS9.error("no regions specified for ChangeRegions");
	}
	im.changeShapes("regions", region, opts);
    }
    return null;
});

// save regions to disk
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("SaveRegions", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    let file = obj.argv[0];
    let which = obj.argv[1];
    let layer = obj.argv[2];
    if( im ){
	return im.saveRegions(file, which, layer);
    }
    return null;
});

// edit region tags, e.g. add source, remove background
// e.g. JS9.EditRegionTags("selected", "source", "background");
JS9.mkPublic("EditRegionTags", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    let which = obj.argv[0];
    let add1  = obj.argv[1];
    let rem1  = obj.argv[2];
    if( im ){
	return im.editRegionTags(which, add1, rem1);
    }
    return null;
});

// toggle region tags, e.g. source <-> background, include <-> exclude
// e.g. JS9.ToggleRegionTags("selected", "source", "background");
JS9.mkPublic("ToggleRegionTags", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    let which = obj.argv[0];
    let x1 = obj.argv[1];
    let x2 = obj.argv[2];
    if( im ){
	return im.toggleRegionTags(which, x1, x2);
    }
    return null;
});

// unremove previously removed regions
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("UnremoveRegions", function(...args) {
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    if( im ){
	return im.unremoveRegions();
    }
    return null;
});

// load a DS9/funtools regions file
JS9.mkPublic("LoadRegions", function(...args){
    let s, reader, file, opts;
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    const addregions = (reg, ropts) => {
	if( ropts && ropts.display !== undefined ){ delete ropts.display; }
	// remove old regions, if necessary
	if( JS9.globalOpts.reloadRefreshReg && ropts.file ){
	    try{ im.removeShapes("regions", ropts.file); }
	    catch(e){ /* empty */ }
	}
	// add the regions
	im.addShapes("regions", reg, ropts);
	// set status
	im.setStatus("loadRegions", "complete");
	// onload callback, if necessary
	if( opts && opts.onload ){ opts.onload(im); }
    };
    file = obj.argv[0];
    opts = obj.argv[1];
    // sanity check
    if( !file ){
	JS9.error("JS9.LoadRegions: no file specified for regions load");
    }
    // no action if no current image
    if( !im ){
	return;
    }
    // set status
    im.setStatus("loadRegions", "processing");
    // opts can be an object or json
    if( typeof opts === "object" ){
	// make a copy so we can modify it
	opts = $.extend(true, {}, opts);
    } else if( opts && typeof opts === "string" ){
	// convert json to object
	try{ opts = JSON.parse(opts); }
	catch(e){ opts = {}; }
    } else {
	// init as an empty object
	opts = {};
    }
    // convert blob to string
    if( typeof file === "object" ){
	s = file.path || file.name;
	if( s ){
	    opts.file = s.split("/").reverse()[0];
	}
	// file reader object
	reader = new FileReader();
	reader.onload = (ev) => {
	    addregions(ev.target.result, opts);
	};
	reader.readAsText(file);
    } else if( typeof file === "string" ){
	opts.responseType = "text";
	file = JS9.fixPath(file);
	opts.file = file.split("/").reverse()[0];
	JS9.fetchURL(null, file, opts, addregions);
    } else {
	// oops!
	JS9.error(`unknown file type for LoadRegions: ${typeof file}`);
    }
});

// construct directory starting with where JS9 is installed
JS9.mkPublic("InstallDir", function(dir){
    // sanity check
    if( !dir ){
	return "";
    }
    // add path to install directory, clean path a little bit
    return JS9.cleanPath(JS9.INSTALLDIR + dir);
});

// add new display divs and/or new plugins
JS9.mkPublic("AddDivs", function(...args) {
    let i, j, div, dexist, id;
    const obj = JS9.parsePublicArgs(args);
    // process all divs
    for(i=0; i< obj.argv.length; i++){
	// get next id
	id = obj.argv[i];
	// sanity check
	if( !id ){
	    continue;
	}
	// make sure div exists ...
	if( $(`#${id}`).length === 0 ){
	    if( JS9.DEBUG ){
		JS9.log("warning: can't find div, skipping AddDivs(): %s", id);
	    }
	    continue;
	}
	// ... but has not already been added
	for(j=0; j<JS9.displays.length; j++){
	    div = JS9.displays[j];
	    if( div.id === id ){
		dexist = true;
		break;
	    }
	}
	// add div as a new display
	if( !dexist ){
	    // add this display to array of displays
	    JS9.checkNew(new JS9.Display(id));
	    // tell helper about display
	    JS9.helper.send("addDisplay", {"display": id});
	} else if( JS9.DEBUG ){
	    JS9.log("warning: div already added, skipping AddDivs(): %s", id);
	}
    }
    // re-instantiate plugins
    JS9.instantiatePlugins();
});

// instantiate plugins when $(document).ready fires before scripts are loaded,
// e.g., Require.js
JS9.mkPublic("InstantiatePlugins", function(){
    JS9.instantiatePlugins();
});

// change the size of a display
JS9.mkPublic("ResizeDisplay", function(...args) {
    let got, display;
    const obj = JS9.parsePublicArgs(args);
    // special handling of first string arg:
    // might be display name or might be resize params
    if( typeof obj.argv[0] === "string" &&
	!JS9.isNumber(obj.argv[0])      &&
	obj.argv[0] !== "full"          &&
	obj.argv[0] !== "reset"         &&
	obj.argv[0] !== "image"         ){
	display = JS9.lookupDisplay(obj.argv[0] || obj.display);
	obj.argv.splice(0,1);
    } else {
	display = JS9.lookupDisplay(obj.display);
    }
    if( !display ){
	JS9.error("invalid display for resize");
    }
    got = display.resize(...obj.argv);
    if( got === display ){
	return JS9.globalOpts.quietReturn ? "" : "OK";
    }
    return got;
});

// select (or de-select) a display as the current display
JS9.mkPublic("SelectDisplay", function(...args) {
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.argv[0] || obj.display);
    if( !display ){
	JS9.error("invalid display for select");
    }
    if( !JS9.hasOwnProperty("Menubar") ){
	JS9.error("Menubar is required for display selection");
    }
    JS9.Menubar.onclick(display);
    return;
});

// gather images from other displays into display
JS9.mkPublic("GatherDisplay", function(...args){
    let display, did, opts;
    const obj = JS9.parsePublicArgs(args);
    switch(obj.argv.length){
    case 0:
	did = obj.display;
	opts = null;
	break;
    case 1:
	if( typeof obj.argv[0] === "object" ||
	    (typeof obj.argv[0] === "string" && obj.argv[0].charAt(0) === "{")){
	    did = obj.display;
	    opts = obj.argv[0];
	} else {
	    did = obj.argv[0] || obj.display;
	}
	break;
    default:
	did = obj.argv[0] || obj.display;
	opts = obj.argv[1];
	break;
    }
    display = JS9.lookupDisplay(did);
    if( !display ){
	JS9.error("invalid display for gather");
    }
    display.gather(opts);
    return;
});

// separate images in a display into new displays
JS9.mkPublic("SeparateDisplay", function(...args){
    let display, did, opts;
    const obj = JS9.parsePublicArgs(args);
    switch(obj.argv.length){
    case 0:
	did = obj.display;
	opts = null;
	break;
    case 1:
	if( typeof obj.argv[0] === "object" ||
	    (typeof obj.argv[0] === "string" && obj.argv[0].charAt(0) === "{")){
	    did = obj.display;
	    opts = obj.argv[0];
	} else {
	    did = obj.argv[0] || obj.display;
	}
	break;
    default:
	did = obj.argv[0] || obj.display;
	opts = obj.argv[1];
	break;
    }
    display = JS9.lookupDisplay(did);
    if( !display ){
	JS9.error("invalid display for separate");
    }
    display.separate(display, opts);
    return;
});

// center the image in a display
JS9.mkPublic("CenterDisplay", function(...args) {
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.argv[0] || obj.display);
    if( !display ){
	JS9.error("invalid display for center");
    }
    display.center();
    return;
});

// save a session (current image, images in current display, or all images)
JS9.mkPublic("SaveSession", function(...args){
    let fname, display, disp, arg1, arg2;
    let opts = {};
    const obj = JS9.parsePublicArgs(args);
    arg1 = obj.argv[0];
    arg2 = obj.argv[1];
    // opts can be an object or json or a filename
    if( typeof arg1 === "object" ){
	// make a copy so we can modify it
	opts = $.extend(true, {}, arg1);
    } else if( typeof arg1 === "string" ){
	// try to convert json to object, but default to a file name
	try{ opts = JSON.parse(arg1); }
	catch(e){
	    fname = arg1;
	    // but is there a second opts arg?
	    if( arg2 ){
		if( typeof arg2 === "object" ){
		    opts = $.extend(true, {}, arg2);
		} else {
		    try{ opts = JSON.parse(arg2); }
		    catch(e2){ opts = {}; }
		}
	    }
	}
    }
    // default save mode
    if( !opts.mode ){
	opts.mode = "display";
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
    // display we are saving
    disp = JS9.lookupDisplay(display);
    // better have an image
    if( !disp.image ){
	return null;
    }
    // default filename, if none specified
    if( !fname ){
	if( opts.mode === "display" ){
	    // generic file name for saving multiple images
	    fname = `js9-${new Date().toISOString().slice(0,10)}.ses`;
	} else {
	    // file name tied to image being saved
	    fname = `${disp.image.id}.ses`;
	}
    }
    // save the session
    return disp.image.saveSession(fname, opts);
});

// load a session file
JS9.mkPublic("LoadSession", function(...args){
    let display, reader, disp, file, opts;
    const obj = JS9.parsePublicArgs(args);
    file = obj.argv[0];
    opts = obj.argv[1];
    // sanity check
    if( !file ){
	JS9.error("JS9.LoadSession: no file specified for load");
    }
    // opts can be an object or json
    if( typeof opts === "object" ){
	// make a copy so we can modify it
	opts = $.extend(true, {}, opts);
    } else if( opts && typeof opts === "string" ){
	// convert json to object
	try{ opts = JSON.parse(opts); }
	catch(e){ opts = {}; }
    } else {
	// init as an empty object
	opts = {};
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
	reader.onload = (ev) => {
	    const jobj = JSON.parse(ev.target.result);
	    opts.sessionPath =  JS9.dirname(file.path || file.name || "");
	    disp.loadSession(jobj, opts);
	};
	reader.readAsText(file);
    } else if( typeof file === "string" ){
	opts.responseType = "text";
	opts.display = disp.id;
	file = JS9.fixPath(file);
	JS9.fetchURL(null, file, opts, (jstr, opts) => {
	    const jobj = JSON.parse(jstr);
	    opts.sessionPath =  JS9.dirname(file);
            disp.loadSession(jobj, opts);
	});
    } else {
	// oops!
	JS9.error(`unknown file type for LoadSession: ${typeof file}`);
    }
});

// save regions to disk
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("SaveCatalog", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const im = JS9.getImage(obj.display);
    let fname = obj.argv[0];
    let which = obj.argv[1];
    if( im ){
	return im.saveCatalog(fname, which);
    }
    return;
});

// load a starbase catalog file
JS9.mkPublic("LoadCatalog", function(...args){
    let reader, im, layer, file, opts;
    const obj = JS9.parsePublicArgs(args);
    layer = obj.argv[0];
    file = obj.argv[1];
    opts = obj.argv[2];
    // special case: 1 arg is the catalog, not the layer
    // i.e., file reader object from openLocalLoadCotalog
    if( layer instanceof Blob ){
	opts = file;
	file = layer;
	layer = null;
    }
    // sanity check
    if( !file ){
	JS9.error("JS9.LoadCatalog: no file specified for catalog load");
    }
    // an image must loaded into the display
    im = JS9.getImage(obj.display);
    if( !im ){
	return;
    }
    // set status
    im.setStatus("loadCatalog", "processing");
    // opts can be an object or json
    if( typeof opts === "object" ){
	// make a copy so we can modify it
	opts = $.extend(true, {}, opts);
    } else if( opts && typeof opts === "string" ){
	// convert json to object
	try{ opts = JSON.parse(opts); }
	catch(e){ opts = {}; }
    } else {
	// init as an empty object
	opts = {};
    }
    // convert blob to string
    if( file instanceof Blob ){
	// file reader object
	reader = new FileReader();
	reader.onload = (ev) => {
	    // improve the filename, if possible
	    if( !layer && file.name ){
		layer = file.name.replace(/\.[^.]*$/, "");
	    }
	    // load the catalog
	    im.loadCatalog(layer, ev.target.result, opts);
	    // set status
	    im.setStatus("loadCatalog", "complete");
	    // onload callback
	    if( opts && opts.onload ){ opts.onload(im); }
	};
	reader.readAsText(file);
    } else if( typeof file === "string" ){
	if( file.match(/\t/) ){
	    // it's a table (contains a tab)
	    im.loadCatalog(layer, file, opts);
	    // set status
	    im.setStatus("loadCatalog", "complete");
	    // onload callback
	    if( opts && opts.onload ){ opts.onload(im); }
	} else {
	    // its a file: retrieve and load the catalog
	    opts.responseType = "text";
	    file = JS9.fixPath(file);
	    JS9.fetchURL(null, file, opts, (s) => {
		// load the catalog
		im.loadCatalog(layer, s, opts);
		// set status
		im.setStatus("loadCatalog", "complete");
		// onload callback
		if( opts && opts.onload ){ opts.onload(im); }
	    });
	}
    } else {
	// oops!
	JS9.error(`unknown file type for LoadCatalog: ${typeof file}`);
    }
});

// create an image mosaic
JS9.mkPublic("CreateMosaic", function(...args) {
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.display);
    let ims = obj.argv[0];
    let opts = obj.argv[1];
    if( display ){
	return display.createMosaic(ims, opts);
    }
});

// display the named plugin
JS9.mkPublic("DisplayPlugin", function(...args){
    let i, plugin, pname, lcname, name;
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.display);
    name = obj.argv[0];
    if( display && obj.argv[0] ){
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
	JS9.error(`can't find plugin: ${name}`);
    }
});

//  display a help page (or a general url, actually)
JS9.mkPublic("DisplayHelp", function(hname){
    let id, title, url, help;
    const opts = JS9.lightOpts.dhtml.textWin;
    const type = "iframe";
    // sanity check
    if( !hname ){ return; }
    title = hname.split("/").reverse()[0];
    id = `help_${JS9.uniqueID()}`;
    // look for known help file
    help = JS9.helpOpts[hname];
    if( help ){
	// help file
	url = JS9.InstallDir(`${help.type}/${help.url}`);
	JS9.lightWin(id, type, url, help.title || title, opts);
    } else {
	// its a random url
	JS9.lightWin(id, type, hname, title, opts);
    }
});

// display a light window
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("LightWindow", function(...args){
    const obj = JS9.parsePublicArgs(args);
    let id      = obj.argv[0] || `lightWindow${JS9.uniqueID()}`;
    let type    = obj.argv[1] || "inline";
    let content = obj.argv[2];
    let title   = obj.argv[3] || "JS9 light window";
    let opts    = obj.argv[4] || JS9.lightOpts.dhtml.textWin;
    if( !content ){
	JS9.error("no content specified for LightWindow");
    }
    return JS9.lightWin(id, type, content, title, opts);
});

// print window (Desktop JS9 only)
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("WindowPrint", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const opts = {cmd: "print"};
    if( obj.argv[0] ){
	opts.opts = obj.argv[0];
    }
    if( window.isElectron && window.electronIPC ){
	window.setTimeout(() => {
	    try{ window.electronIPC.send("msg", opts); }
	    catch(e){ JS9.error("could not print window", e); }
	}, JS9.TIMEOUT);
    } else {
	JS9.error("WindowPrint is only available for the JS9 desktop app");
    }
});

// save PDF of window (Desktop JS9 only)
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("WindowToPDF", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const opts = {cmd: "pdf"};
    opts.filename = obj.argv[0] || "js9.pdf";
    if( obj.argv[1] ){
	opts.opts = obj.argv[1];
    }
    if( window.isElectron && window.electronIPC ){
	window.setTimeout(() => {
	    try{ window.electronIPC.send("msg", opts); }
	    catch(e){ JS9.error("could not create window pdf", e); }
	}, JS9.TIMEOUT);
    } else {
	JS9.error("WindowToPDF is only available for the JS9 desktop app");
    }
});

// set save directory (Desktop JS9 only)
// eslint-disable-next-line no-unused-vars
JS9.mkPublic("SaveDir", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const opts = {cmd: "savedir"};
    if( obj.argv[0] ){
	opts.opts = obj.argv[0];
    } else {
	JS9.error("SaveDir requires a directory name");
    }
    if( window.isElectron && window.electronIPC ){
	window.setTimeout(() => {
	    try{ window.electronIPC.send("msg", opts); }
	    catch(e){ JS9.error("could not set save directory", e); }
	}, JS9.TIMEOUT);
    } else {
	JS9.error("SaveDir is only available for the JS9 desktop app");
    }
});
// end of Public Interface

// return namespace
return JS9;
}());

// INIT: after document is loaded, perform JS9 initialization
$(document).ready(() => {
    // when all is ready, we can preload images
    $(document).on("JS9:ready", () => {
	if( !JS9.readied ){
	    JS9.readied = true;
	    JS9.Preload(true);
	}
    });
    $(document).on("JS9:init", () => {
	if( JS9.helper.ready && JS9.fits.ready ){
	    // ... signal we are completely ready
	    $(document).trigger("JS9:ready", {status: "OK"});
	}
    });
    // ... might need to wait for astroem (via emscripten) to finish ...
    $(document).on("astroem:ready", () => {
	// astroem is loaded: we can now initialize FITS support
	JS9.initFITS();
	// if Node.js is available (i.e., if enabled in the Electron app),
	// try to mount the local file system
	if( window.isElectron && JS9.hasNode ){
	    try{
		// mount local file system or clear mount point
		if( !JS9.vmount("/", JS9.localMount) ){
		    delete JS9.localMount;
		}
	    }
	    catch(e){
		// no mount point for local file system
		delete JS9.localMount;
	    }
	}
	if( JS9.helper.ready && JS9.inited ){
	    // ... signal we are completely ready
	    $(document).trigger("JS9:ready", {status: "OK"});
	}
    });
    // wait for helper
    $(document).on("JS9:helperReady", () => {
	if( JS9.fits.ready && JS9.inited && !JS9.readied ){
	    // ... signal we are completely ready (but only once)
	    $(document).trigger("JS9:ready", {status: "OK"});
	}
    });
    // init JS9 (unless explicitly specified not to)
    if( $('div[data-js9init="false"]').length === 0 ){
	JS9.init();
    }
});
