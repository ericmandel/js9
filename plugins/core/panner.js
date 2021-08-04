/*
 * Panner plugin
 */

/*global $, JS9 */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Panner = {};
JS9.Panner.CLASS = "JS9";
JS9.Panner.NAME = "Panner";
JS9.Panner.WIDTH =  320;	// width of light window
JS9.Panner.HEIGHT = 320;	// height of light window
JS9.Panner.SWIDTH =  250;	// width of div
JS9.Panner.SHEIGHT = 250;	// height of div
JS9.Panner.VSIZE = 30;
JS9.Panner.NORTH = {
    color: "#00FF00", text: "N", fontSize: 12, fontFamily: "Helvetica",
    strokeWidth: 1, strokeDashArray: [2,1]
};
JS9.Panner.EAST  = {
    color: "#FFFF00",  text: "E", fontSize: 12, fontFamily: "Helvetica",
    strokeWidth: 1, strokeDashArray: [2,1]
};

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
JS9.Panner.bcall = function(...args){
    let dispid, pinst, im;
    let [which, cmd, arg1] = args;
    // the button plugintoolbar div has data containing the id of the display
    dispid = $(which).closest("div[class^=JS9PluginToolbar]").data("displayid");
    if( dispid ){
	im = JS9.getImage(JS9.getDynamicDisplayOr(dispid));
	pinst = im.display.pluginInstances.JS9Panner;
    } else {
	JS9.error(`can't find display for cmd: ${cmd}`);
    }
    if( !im ){
	JS9.error(`can't find image for cmd: ${cmd}`);
    }
    switch(cmd){
    case "zoomPanner":
	if( args.length < 3 ){
	    JS9.error(`missing arg(s) for cmd: ${cmd}`);
	}
	try{
	    JS9.Panner.zoom.call(pinst, im, arg1);
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
    // display current image in panner
    if( this.display.image ){
	JS9.Panner.disp.call(this, this.display.image);
    }
};

// create panner (RGB) image from scaled colorCells
// sort of from: tksao1.0/frame/truecolor.c, but not really
// part of panner plugin
JS9.Panner.create = function(im){
    let panDisp, panner, sect, img;
    let x0, y0, xblock, yblock;
    let i, j, ii, jj, kk;
    let ioff, ooff;
    let width, height;
    let pos, ix, iy;
    let dlayer;
    // sanity checks
    if( !im || !im.raw                              ||
	(!im.useOffScreenCanvas() && !im.colorData) ||
	!im.display.pluginInstances.JS9Panner ){
	return null;
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
    if( im.useOffScreenCanvas() ){
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
    } else {
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
    }
    // add panner shape layer to the display (but only once)
    if( this.display.layers.panner ){
	// if this is a dynamic plugin panner (where js9id is "*"),
	// we might have to fiddle the panner shape layer objs, i.e.
	// in the display (general obj) and the image (instance obj).
	// this is because dynamics use one shape layer for all instances,
	// and (obviously) it starts out in one of the displays.
	if( this.display.image && this.isDynamic ){
	    if( !im.display.layers.panner ){
		im.display.layers.panner = this.display.layers.panner;
	    }
	    if( this.display.image.layers.panner && !im.layers.panner ){
		im.layers.panner = this.display.image.layers.panner;
	    }
	}
	return im;
    }
    dlayer = this.display.newShapeLayer("panner", JS9.Panner.opts, this.divjq);
    // add a callback to pan when the panning rectangle is moved
    dlayer.canvas.on("object:modified", (opts) => {
	let im, disp, panDisp;
	disp = JS9.getDynamicDisplayOr(this.display);
	if( disp && disp.image ){
	    im = disp.image;
	} else {
	    im = this.display.image;
	}
	if( im ){
	    panDisp = im.display.pluginInstances.JS9Panner;
	    pos = opts.target.getCenterPoint();
	    // flips will change the pan position
	    if( im.params.flip === "x" ){
		pos.x = panDisp.width - pos.x;
	    } else if( im.params.flip === "y" ){
		pos.y = panDisp.height - pos.y;
	    } else if( im.params.flip === "xy" ){
		pos.x = panDisp.width - pos.x;
		pos.y = panDisp.height - pos.y;
	    }
	    // rotations will change the pan position
	    if( im.params.rot90 ){
		pos = JS9.rotatePoint(pos,
				      im.params.rot90,
				      {x:panDisp.width/2, y:panDisp.height/2});
	    }
	    // rotations will change the pan position
	    if( im.params.rotate ){
		pos = JS9.rotatePoint(pos,
				      im.params.rotate,
				      {x:panDisp.width/2, y:panDisp.height/2});
	    }
	    ix = ((pos.x - im.panner.ix) *
		  im.panner.xblock / im.panner.zoom) + im.panner.x0;
	    iy = ((dlayer.canvas.height - (pos.y + im.panner.iy)) *
		  im.panner.yblock / im.panner.zoom) + im.panner.y0;
	    // pan the image
	    try{
		// avoid triggering a re-pan
		panDisp.status = "inactive";
		// pan image
		im.setPan(ix, iy);
	    }
	    catch(e){JS9.log("couldn't pan image", e);}
	    finally{panDisp.status = "active";}
	}
    });
    return im;
};

// display the image on the panner canvas
JS9.Panner.disp = function(im){
    let panDisp, panner, sect, tblkx, tblky;
    let obj, nx, ny, nwidth, nheight, cenx, ceny, pos;
    let npos1, npos2, nobj, nobjt;
    let epos1, epos2, eobj, eobjt;
    let angle, xflip, yflip, wcsinfo, w2, h2, m, ctx;
    const img2canvas = (im, img) => {
	let context, canvas;
	let panner = im.display.pluginInstances.JS9Panner;
	if( !panner.offscreenRGB ){
	    canvas = document.createElement("canvas");
	    context = canvas.getContext("2d");
	    // turn off anti-aliasing
	    if( !JS9.ANTIALIAS ){
		context.imageSmoothingEnabled = false;
	    }
	    panner.offscreenRGB = {canvas, context};
	}
	panner.offscreenRGB.canvas.width  = img.width;
	panner.offscreenRGB.canvas.height = img.height;
	panner.offscreenRGB.context.putImageData(img, 0, 0);
	return panner.offscreenRGB.canvas;
    };
    // sanity check
    // only display if we have an image and panner present
    if( !im                                                       ||
	!im.display.pluginInstances.JS9Panner                     ||
	im.display.pluginInstances.JS9Panner.status !== "active"  ){
	return;
    }
    // always remake make panner image (might be zooming, for example)
    if( !JS9.Panner.create.call(this, im) ){
	return;
    }
    // convenience variables
    wcsinfo  = im.raw.wcsinfo || {cdelt1: 1, cdelt2: 1, crot: 0};
    panner = im.panner;
    panDisp = im.display.pluginInstances.JS9Panner;
    sect = im.rgb.sect;
    cenx = panDisp.width/2;
    ceny = panDisp.height/2;
    ctx = panDisp.context;
    // we're done if there is no panner image
    if( !panner.img ){
	return;
    }
    // offsets into display
    if( panner.img.width < panDisp.width ){
	panner.ix = Math.floor((panDisp.width - panner.img.width)/2);
    }
    if( panner.img.height < panDisp.height ){
        panner.iy = Math.floor((panDisp.height - panner.img.height)/2);
    }
    // clear first
    JS9.Panner.clear.call(this, im);
    // save context
    ctx.save();
    // do we need to apply the canvas transform?
    if( im.params.transform ){
	// this is the transform matrix
	m = im.params.transform;
	// translate origin to center of display
	w2 = panDisp.width / 2;
	h2 = panDisp.height / 2;
	ctx.translate(w2, h2);
	// set new transform
	ctx.transform(m[0][0], m[0][1], m[1][0], m[1][1], m[2][0], m[2][1]);
	// translate back to 0, 0
	ctx.translate(-w2, -h2);
    }
    // draw the image into the context
    // ctx.putImageData(panner.img, panner.ix, panner.iy);
    ctx.drawImage(img2canvas(im, panner.img), panner.ix, panner.iy);
    // restore original context
    ctx.restore();
    // display panner rectangle
    // convenience variables
    tblkx = panner.zoom / panner.xblock;
    tblky = panner.zoom / panner.yblock;
    // size of rectangle
    nwidth = im.display.width * tblkx / sect.zoom;
    nheight = im.display.height * tblky / sect.zoom;
    // position of the rectangle
    nx = (sect.x0 - panner.x0) * tblkx + panner.ix;
    ny = panDisp.height - ((sect.y1 - panner.y0) * tblky + panner.iy);
    // adjust for section offset
    if( im.display.width !== sect.width ){
	nx -= (im.display.width - sect.width) * tblkx / sect.zoom / 2;
    }
    if( im.display.height !== sect.height ){
	ny -= (im.display.height - sect.height) * tblky / sect.zoom / 2;
    }
    // convert to center pos
    nx += nwidth / 2;
    ny += nheight / 2;
    // flips will change the pan position
    if( im.params.flip === "x" ){
	nx = panDisp.width - nx;
    } else if( im.params.flip === "y" ){
	ny = panDisp.height - ny;
    } else if( im.params.flip === "xy" ){
	nx = panDisp.width - nx;
	ny = panDisp.height - ny;
    }
    // rotations will change the pan position
    if( im.params.rot90 ){
	pos = JS9.rotatePoint({x: nx, y: ny},
			      - im.params.rot90,
			      {x:panDisp.width/2, y:panDisp.height/2});
	nx = pos.x;
	ny = pos.y;
    }
    // rotations will change the pan position
    if( im.params.rotate ){
	pos = JS9.rotatePoint({x: nx, y: ny},
			      - im.params.rotate,
			      {x:panDisp.width/2, y:panDisp.height/2});
	nx = pos.x;
	ny = pos.y;
    }
    // hide rectangle if it covers the full panner
    if( nwidth >= panDisp.width ){
	nx = panDisp.width / 2;
	nwidth = panDisp.width + 10;
    }
    if( nheight >= panDisp.height ){
	ny = panDisp.height / 2;
	nheight = panDisp.height + 10;
    }
    // object containing position and size parameters:
    obj = {left: nx, top: ny, width: nwidth, height: nheight};
    // create the box
    if( !im.panner.boxid ){
	im.panner.boxid = im.addShapes("panner", "box", obj);
    } else {
	im.changeShapes("panner", im.panner.boxid, obj);
    }
    // clear direction vectors
    if( im.panner.northid ){
	im.removeShapes("panner", im.panner.northid);
	im.removeShapes("panner", im.panner.northidt);
    }
    if( im.panner.eastid ){
	im.removeShapes("panner", im.panner.eastid);
	im.removeShapes("panner", im.panner.eastidt);
    }
    // done if we are not displaying the directions vectors or no wcs
    if( !JS9.globalOpts.pannerDirections || !im.raw.wcs || im.raw.wcs <= 0 ){
	return im;
    }
    // get north is up info
    nobj = im.getNorthIsUp();
    // angle
    angle = nobj.angle;
    // take existing rotation into account
    if( JS9.notNull(im.params.rot90) ){
	angle -= im.params.rot90;
    }
    // take existing rotation into account
    if( JS9.notNull(im.params.rotate) ){
	angle -= im.params.rotate;
    }
    // flip
    xflip = nobj.xflip ? -1 : 1;
    yflip = nobj.yflip ? -1 : 1;
    switch(im.params.flip){
    case "x":
	xflip *= -1;
	break;
    case "y":
	yflip *= -1;
	break;
    case "xy":
	xflip *= -1;
	yflip *= -1;
	break;
    default:
	break;
    }
    // this is the line pointing north
    npos1 = {x: cenx, y: ceny};
    if( wcsinfo.cdelt2 >= 0 ){
	npos2 = {x: cenx, y: ceny - JS9.Panner.VSIZE * yflip};
    } else {
	npos2 = {x: cenx, y: ceny + JS9.Panner.VSIZE * yflip};
    }
    npos2 = JS9.rotatePoint(npos2, angle, npos1);
    nobj = {color: JS9.Panner.NORTH.color,
	    strokeWidth: JS9.Panner.NORTH.strokeWidth,
	    strokeDashArray: JS9.Panner.NORTH.strokeDashArray,
	    points: [npos1, npos2],
	    changeable: false,
	    // hack around fabric.js problems
	    originX: "left", originY: "top", noLeftTop: true};
    im.panner.northid = im.addShapes("panner", "line", nobj);
    // this is the text 'N'
    nobjt = {color: JS9.Panner.NORTH.color,
	     text: JS9.Panner.NORTH.text,
	     fontSize: JS9.Panner.NORTH.fontSize,
	     fontFamily: JS9.Panner.NORTH.fontFamily,
	     changeable: false,
	     left: npos2.x, top: npos2.y};
    im.panner.northidt = im.addShapes("panner", "text", nobjt);
    // this is the line pointing east
    epos1 = {x: cenx, y: ceny};
    if( wcsinfo.cdelt1 < 0 ){
	epos2 = {x: cenx - JS9.Panner.VSIZE * xflip, y: ceny};
    } else {
	epos2 = {x: cenx + JS9.Panner.VSIZE * xflip, y: ceny};
    }
    epos2 = JS9.rotatePoint(epos2, angle, epos1);
    eobj = {color: JS9.Panner.EAST.color,
	    strokeWidth: JS9.Panner.EAST.strokeWidth,
	    strokeDashArray: JS9.Panner.EAST.strokeDashArray,
	    changeable: false,
	    points: [epos1, epos2],
	    // hack around fabric.js problems
	    originX: "left", originY: "top", noLeftTop: true};
    im.panner.eastid = im.addShapes("panner", "line", eobj);
    // this is the text 'E'
    eobjt = {color: JS9.Panner.EAST.color,
	     text: JS9.Panner.EAST.text,
	     fontSize: JS9.Panner.EAST.fontSize,
	     fontFamily: JS9.Panner.EAST.fontFamily,
	     changeable: false,
	     left: epos2.x, top: epos2.y};
    im.panner.eastidt = im.addShapes("panner", "text", eobjt);
    return im;
};

// zoom the rectangle inside the panner (RGB) image
JS9.Panner.zoom = function(im, zval){
    let panner, ozoom, nzoom;
    // sanity check
    if( !im || !im.panner || !im.display.pluginInstances.JS9Panner ){
	return;
    }
    panner = im.panner;
    // get old zoom
    ozoom = panner.zoom;
    // determine new zoom
    switch(zval.charAt(0)){
    case "*":
    case "x":
    case "X":
	nzoom = Math.min(Math.min(this.width, this.height),
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
    JS9.Panner.disp.call(this, im);
    return im;
};

// dynamic selection change
JS9.Panner.dysel = function(im){
    let panner;
    if( im ){
	panner = im.display.pluginInstances.JS9Panner;
	if( panner && panner.isDynamic ){
	    JS9.Panner.disp.call(this, im);
	}
    }
};

// clear the panner
JS9.Panner.clear = function(im){
    let panner, display;
    if( im ){
	display = JS9.getDynamicDisplayOr(this.display);
	panner = im.display.pluginInstances.JS9Panner;
	if( panner && (im.display === display) ){
	    panner.context.clear();
	    im.removeShapes("panner", "all");
	    im.panner.boxid = null;
	}
	return im;
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Panner.CLASS, JS9.Panner.NAME, JS9.Panner.init,
		   {menuItem: "Panner",
		    help: "help/panner.html",
		    dynamicSelect: true,
		    toolbarSeparate: false,
		    toolbarHTML: JS9.Panner.HTML,
		    ondynamicselect: JS9.Panner.dysel,
		    onplugindisplay: JS9.Panner.disp,
		    onimagedisplay: JS9.Panner.disp,
		    onimageclose: JS9.Panner.clear,
		    onimageclear: JS9.Panner.clear,
		    onupdateprefs: JS9.Panner.disp,
		    onsetwcssys: JS9.Panner.disp,
		    winTitle: "Panner",
		    winDims: [JS9.Panner.WIDTH,  JS9.Panner.HEIGHT],
		    divArgs: [JS9.Panner.SWIDTH, JS9.Panner.SHEIGHT]});
