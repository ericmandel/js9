/*
 * Magnifier plugin
 */

/*global $, JS9, fabric */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Magnifier = {};
JS9.Magnifier.CLASS = "JS9";
JS9.Magnifier.NAME = "Magnifier";
JS9.Magnifier.WIDTH =  JS9.WIDTH/2;	// width of light window
JS9.Magnifier.HEIGHT = JS9.HEIGHT/2;	// height of light window
JS9.Magnifier.SWIDTH =  250;		// width of div
JS9.Magnifier.SHEIGHT = 250;		// height of div

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

// call a JS9 routine from a button in the magnifier plugin toolbar
// the plugin instantiation saves the display id in the toolbar div
JS9.Magnifier.bcall = function(...args){
    let dispid, im;
    let [which, cmd, arg1] = args;
    // the button plugintoolbar div has data containing the id of the display
    dispid = $(which).closest("div[class^=JS9PluginToolbar]").data("displayid");
    if( dispid ){
	im = JS9.getImage(dispid);
    } else {
	JS9.error(`can't find display for cmd: ${cmd}`);
    }
    if( !im ){
	JS9.error(`can't find image for cmd: ${cmd}`);
    }
    switch(cmd){
    case "zoomMagnifier":
	if( args.length < 3 ){
	    JS9.error(`missing arg(s) for cmd: ${cmd}`);
	}
	try{
	    JS9.Magnifier.zoom(im, arg1);
	} catch(e){
	    JS9.error("error calling zoomMagnifier()", e);
	}
	break;
    default:
        break;
    }
};

// html used by the magnifier plugin
JS9.Magnifier.HTML =
`${"<span>" +
"<button type='button' class='JS9Button' onClick='JS9.Magnifier.bcall(this, \"zoomMagnifier\", \"x2\"); return false'>x2</button>" +
"<button type='button' class='JS9Button' onClick='JS9.Magnifier.bcall(this, \"zoomMagnifier\", \"/2\"); return false'>/2</button>" +
"<button type='button' class='JS9Button' onClick='JS9.Magnifier.bcall(this, \"zoomMagnifier\", \""}${JS9.Magnifier.opts.zoom}"); return false'>${JS9.Magnifier.opts.zoom}</button>` +
`</span>`;

// JS9 Magnifier constructor
JS9.Magnifier.init = function(width, height){
    // set width and height on div
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width = width || JS9.Magnifier.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height = height || JS9.Magnifier.HEIGHT;
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
    let pos, tval, magDisp, zoom;
    let canvas, sx, sy, sw, sh, dx, dy, dw, dh;
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
    // overlay regions by drawing the fabric.js canvas into the magnifier
    if( JS9.globalOpts.magnifierRegions &&
	im.display.layers && im.display.layers.regions ){
	// get underlying html canvas
	canvas = im.display.layers.regions.canvas.getElement();
	sx *= fabric.devicePixelRatio;
	sy *= fabric.devicePixelRatio;
	sw *= fabric.devicePixelRatio;
	sh *= fabric.devicePixelRatio;
	// write it into the magnifier display
	magDisp.context.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
    }
    // stuff we only do once
    if( !im.magnifier.boxid ){
	// add the center point to the magnifier, if necessary
	im.magnifier.boxid = im.addShapes("magnifier", "box");
	// make background black, which looks better at the edge
	$(magDisp.canvas).css("background-color", "black");
    }
    // center point size and position, based on zoom
    // (subtract 1 to center the box on the pixel 2/4/2020)
    if( im.magnifier.ozoom !== zoom ){
	im.changeShapes("magnifier", im.magnifier.boxid,
			{left: magDisp.width/2-1, top:  magDisp.height/2-1,
			 width: zoom, height: zoom});
	im.magnifier.ozoom = im.magnifier.zoom;
    }
};

// display the magnified image on the magnifier canvas
// this routine is called when regions change ... it delays the mag display
// until the main display can be redrawn with the changed regions. Initially,
// this routine explicitly called the fabric.js renderAll() routine so that
// the changed regions would be drawn on the canvas. This did not work when
// removing groups (artifacts were left on the screen). For related problems
// and warnings associated with working with groups, see:
//  http://fabricjs.com/v2-breaking-changes-2
JS9.Magnifier.display2 = function(im, ipos){
    window.setTimeout(() => {
	JS9.Magnifier.display(im, ipos);
    }, 0);
};

// zoom the rectangle inside the magnifier (RGB) image
// part of magnifier plugin
JS9.Magnifier.zoom = function(im, zval){
    let magnifier, ozoom, nzoom;
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

// clear the magnifier
JS9.Magnifier.clear = function(im){
    const magnifier = im.display.pluginInstances.JS9Magnifier;
    if( magnifier && (im === im.display.image) ){
	magnifier.context.clear();
	im.removeShapes("magnifier", "all");
	im.magnifier.boxid = null;
	im.magnifier.ozoom = 0;
	// restore original background color
	$(magnifier.canvas).css("background-color", "#E9E9E9");
    }
    return im;
};

// add plugin to JS9
JS9.RegisterPlugin(JS9.Magnifier.CLASS, JS9.Magnifier.NAME, JS9.Magnifier.init,
		   {menuItem: "Magnifier",
		    help: "help/magnifier.html",
		    dynamicSelect: true,
		    toolbarSeparate: false,
		    toolbarHTML: JS9.Magnifier.HTML,
		    onplugindisplay: JS9.Magnifier.display,
		    onregionsmove: JS9.Magnifier.display,
		    onregionschange: JS9.Magnifier.display2,
		    onmousemove: JS9.Magnifier.display,
		    onimagedisplay: JS9.Magnifier.display,
		    onimageclose: JS9.Magnifier.clear,
		    onimageclear: JS9.Magnifier.clear,
		    winTitle: "Magnifier",
		    winDims: [JS9.Magnifier.WIDTH,  JS9.Magnifier.HEIGHT],
		    divArgs: [JS9.Magnifier.SWIDTH,  JS9.Magnifier.SHEIGHT]});
