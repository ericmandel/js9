/*
 * PLUGIN test module (January 26 2014)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf */

// To specify the JS9 display instance to link to a given PLUGIN div,
// use the HTML5 dataset syntax: 
//    <div class="PLUGINtest" data-js9id="JS9"></div>

// make a module so as not to pollute the global namespace
var PLUGIN;
if( PLUGIN && (typeof PLUGIN !== "object" || PLUGIN.CLASS) ){
    throw new Error("Namespace 'PLUGIN' already exists");
}

// create our namespace, and specify some meta-information and params
PLUGIN = {};
PLUGIN.CLASS = "PLUGIN";// class of plugins (1st part of div class)
PLUGIN.NAME = "test";   // name of this plugin (2nd part of div class)
PLUGIN.NDIV = 4;	// number of div message areas
PLUGIN.WIDTH =  400;	// width of light window
PLUGIN.HEIGHT = 200;	// height of light window (4 * (30 + 20 from css))

// constructor: it's here that you add HTML elements to the container div
// But you don't have to do so: you can put the HTML elements right into
// the Web page, in which case this routine can be empty.
// Obviously, you must use the contructor to add your HTML elements if you
// want to support your plugin from the View menu.
//
// The examaple below splits the difference: it allows the container div to
// be empty or filled with the inner canvas, and thus support the view menu.
PLUGIN.init = function(){
    var i;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    // set width and height on div
    //
    // create message divs
    for(i=0; i<PLUGIN.NDIV; i++){
	$("<div>")
	    .addClass(PLUGIN.CLASS + "message")
	    .attr("id", "message" + i)
	    .html("&nbsp;")
	    .appendTo(this.divjq);
    }
};

// write a row of text in message area associated with a given plugin
PLUGIN.init.prototype.message = function(message, row) {
    this.divjq.children("#message" + row).html(message);
};

// callback when mouse is pressed
// im:   image handle
// ipos: image position; origin at 1,1 (FITS convention)
// evt:  the event passed to the callback
PLUGIN.mousedown = function(im, ipos, evt){
    var t = sprintf("mouseDown: ipos=%s,%s", ipos.x, ipos.y);
    this.message(t, 0);
};

// callback when mouse is released
PLUGIN.mouseup = function(im, ipos, evt){
    var t = sprintf("mouseUp: ipos=%s,%s", ipos.x, ipos.y);
    this.message(t, 0);
};

// callback when mouse (or one-finger touch) moves (without a mouse press)
// image value: we need 0-indexed positions, so subtract 1
// but add 0.5 before rounding since x.0 is in the middle of the pixel
PLUGIN.mousemove = function(im, ipos, evt){
    var v, t;
    v = im.raw.data[Math.floor(ipos.y-0.5) * im.raw.width + 
		    Math.floor(ipos.x-0.5)];
    t = sprintf("mouseMove: ipos=%s,%s val=%s", ipos.x, ipos.y, v);
    this.message(t, 0);
};

// callback when mouse moves over the image
PLUGIN.mouseover = function(im, ipos, evt){
    var t = sprintf("mouseOver: ipos=%s,%s", ipos.x, ipos.y);
    this.message(t, 0);
};

// callback when mouse moves out of the image
PLUGIN.mouseout = function(im, ipos, evt){
    var t = sprintf("mouseOut: ipos=%s,%s", ipos.x, ipos.y);
    this.message(t, 0);
};

// callback when key is pressed
PLUGIN.keypress = function(im, ipos, evt){
    var charCode = evt.which || evt.keyCode;
    var charStr = String.fromCharCode(charCode);
    var t = sprintf("keyPress: %s -> %s", charCode, charStr);
    this.message(t, 2);
};

// callback when regions change
PLUGIN.regionschange = function(im, xreg){
    var i;
    var mode = xreg.mode.substring(0,1).toUpperCase()+xreg.mode.substring(1);
    var t = sprintf("%s%s: ", xreg.shape, mode);
    switch(xreg.shape){
    case "annulus":
        t += sprintf("ipos=%.2f,%.2f radii=", xreg.x, xreg.y);
        for(i=0; i<xreg.radii.length; i++){
	    if( i !== 0 ){ t += ","; }
	    t += sprintf("%.2f", xreg.radii[i]);
        }
        break;
    case "box":
        t += sprintf("ipos=%.2f,%.2f size=%.2f,%.2f angle=%.2f",
		     xreg.x, xreg.y, xreg.width, xreg.height, xreg.angle);
        break;
    case "circle":
        t += sprintf("ipos=%.2f,%.2f radius=%.2f", 
                     xreg.x, xreg.y, xreg.radius);
        break;
    case "ellipse":
        t += sprintf("ipos=%.2f,%.2f eradii=%.2f,%.2f angle=%.2f", 
		     xreg.x, xreg.y, xreg.r1, xreg.r2, xreg.angle);
        break;
   case "point":
        t += sprintf("ipos=%.2f,%.2f", xreg.x, xreg.y);
	break;
   case "polygon":
        t += "points=";
        for(i=0; i<xreg.pts.length; i++){
	    t += sprintf("%.2f,%.2f ", xreg.pts[i].x, xreg.pts[i].y);
        }
        break;
    }
    // context is the calling instance
    this.message(t, 1);
};

// callback when region changes
PLUGIN.imageload = function(im){
    var t;
    // im gives access to image object
    t = sprintf("image loaded: %s (%s,%s)", im.id, im.raw.width, im.raw.height);
    // context is the calling instance
    this.message(t, 3);
};

// callback when image is displayed
PLUGIN.imagedisplay = function(im){
    var t;
    // im gives access to image object
    t = sprintf("image displayed: %s", im.id);
    // context is the calling instance
    this.message(t, 3);
};

// add this plugin into JS9
JS9.RegisterPlugin(PLUGIN.CLASS, PLUGIN.NAME, PLUGIN.init,
		   {menuItem: "pluginTest",
		    onmousedown: PLUGIN.mousedown,
		    onmouseup: PLUGIN.mouseup,
		    onmousemove: PLUGIN.mousemove,
		    onmouseover: PLUGIN.mouseover,
		    onmouseout: PLUGIN.mouseout,
		    onkeypress: PLUGIN.keypress,
		    onregionschange: PLUGIN.regionschange,
		    onimageload: PLUGIN.imageload,
		    onimagedisplay: PLUGIN.imagedisplay,
		    help: "help/plugintest.html",
		    winTitle: "Plugin Test",
		    winResize: true,
		    winDims: [PLUGIN.WIDTH, PLUGIN.HEIGHT]});
