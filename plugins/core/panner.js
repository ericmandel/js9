// ---------------------------------------------------------------------
// Panner plugin
// ---------------------------------------------------------------------

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, JS9 */

// create our namespace, and specify some meta-information and params
JS9.Panner = {};
JS9.Panner.CLASS = "JS9";
JS9.Panner.NAME = "Panner";
JS9.Panner.WIDTH =  320;	// width of light window
JS9.Panner.HEIGHT = 320;	// height of light window
JS9.Panner.SWIDTH =  250;	// width of div
JS9.Panner.SHEIGHT = 250;	// height of div

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

// call a JS9 routine from a button in the panner plugin toolbar
// the plugin instantiation saves the display id in the toolbar div
JS9.Panner.bcall = function(which, cmd, arg1){
    var dispid, im;
    // the button plugintoolbar div has data containing the id of the display
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

// html used by the panner plugin
JS9.Panner.HTML =
"<span>" +
"<button type='button' class='JS9Button' onClick='JS9.Panner.bcall(this, \"zoomPanner\", \"x2\"); return false'>x2</button>" +
"<button type='button' class='JS9Button' onClick='JS9.Panner.bcall(this, \"zoomPanner\", \"/2\"); return false'>/2</button>" +
"<button type='button' class='JS9Button' onClick='JS9.Panner.bcall(this, \"zoomPanner\", \"1\"); return false'>z1</button>" +
"<button type='button' class='JS9Button' onClick='JS9.Panner.bcall(this, \"panImage\"); return false'>center</button>" +
"</span>";

// JS9 Panner constructor
JS9.Panner.init = function(width, height){
    var pos, ix, iy;
    var dlayer;
    var that = this;
    // set width and height on div
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = width  || JS9.Panner.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height = height || JS9.Panner.HEIGHT;
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
	    pos = opts.target.getCenterPoint();
	    ix = ((pos.x - im.panner.ix) *
		      im.panner.xblock / im.panner.zoom) + im.panner.x0;
	    iy = ((dlayer.canvas.height - (pos.y + im.panner.iy)) *
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

// display the image on the panner canvas
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

// clear the panner
JS9.Panner.clear = function(im){
    var panner = im.display.pluginInstances.JS9Panner;
    if( panner && (im === im.display.image) ){
	panner.context.clear();
	im.removeShapes("panner", "all");
	im.panner.boxid = null;
    }
    return im;
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Panner.CLASS, JS9.Panner.NAME, JS9.Panner.init,
		   {menuItem: "Panner",
		    toolbarSeparate: false,
		    toolbarHTML: JS9.Panner.HTML,
		    onplugindisplay: JS9.Panner.display,
		    onimagedisplay: JS9.Panner.display,
		    onimageclose: JS9.Panner.clear,
		    onimageclear: JS9.Panner.clear,
		    winTitle: "Panner",
		    winDims: [JS9.Panner.WIDTH,  JS9.Panner.HEIGHT],
		    divArgs: [JS9.Panner.SWIDTH, JS9.Panner.SHEIGHT]});
