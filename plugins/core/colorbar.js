/*
 * colorbar plugin (March 8, 2016)
 */

/*global $, JS9 */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Colorbar = {};
JS9.Colorbar.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Colorbar.NAME = "Colorbar";  // name of this plugin (2nd part of div class)
JS9.Colorbar.WIDTH =  512;	 // width of light window
JS9.Colorbar.HEIGHT = 40;	 // height of light window
JS9.Colorbar.BASE = JS9.Colorbar.CLASS + JS9.Colorbar.NAME;
// if TRUE, use psColors, otherwise use unscaled colorCells
JS9.Colorbar.SCALED = false;
// number of ticks in the colorbar
JS9.Colorbar.TICKS = 10;
// height of colorbar inside plugin
JS9.Colorbar.COLORBARHEIGHT = 16;
// JS9.Colorbar.COLORBARFONT = "11pt Arial";
// max label length before we start skipping some labels
JS9.Colorbar.MAXLABELSIZE  = 10;
JS9.Colorbar.STATICSIZE    =  4;
JS9.Colorbar.STATICPADDING =  3;
// how much to add for Infinity
JS9.Colorbar.INFINITY = 10;

// redraw colorbar on display
JS9.Colorbar.display = function(im){
    let i, j, prec, idx, idx0, colorBuf, tval, ix, iy, lastix, done;
    let dmin, dmax, dval, color, label, dolabel;
    const tlabels = [];
    const canvasWidth = this.colorbarWidth;
    const canvasHeight = this.colorbarHeight;
    const colorImg = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const colorData = colorImg.data;
    const colorWidth = canvasWidth * 4;
    const colorBuf0 = new Uint8Array(colorData.buffer, 0, colorWidth);
    const drawLabel = (ix, iy, label, dolabel) => {
	this.textctx.textAlign = "center";
	this.textctx.beginPath();
	this.textctx.moveTo(ix, iy);
	this.textctx.lineWidth = 1;
	this.textctx.lineTo(ix, iy+5);
	this.textctx.stroke();
	if( dolabel ){
	    this.textctx.fillText(label, ix, iy+15);
	}
    };
    if( im.staticObj ){
	// find min and max in the static range
	dmin = 0
	dmax = 0;
	for(i=0; i<im.staticObj.colors.length; i++){
	    color = im.staticObj.colors[i];
	    if( color.min < dmin ){
		if( color.max === -Infinity ){
		    dmin = dmin - JS9.Colorbar.INFINITY;
		} else {
		    dmin = color.min;
		}
	    }
	    if( color.max > dmax ){
		if( color.max === Infinity ){
		    dmax = dmax + JS9.Colorbar.INFINITY ;
		} else {
		    dmax = color.max;
		}
	    }
	}
	// first line gets colors from static lookup
	idx0 = (dmax - dmin) / canvasWidth;
	for(i=0, j=0; i<canvasWidth; i++, j+=4){
	    dval = Math.floor(i * idx0);
	    color = JS9.lookupStaticColor(im, dval);
	    colorData[j]   = color.red;
	    colorData[j+1] = color.green;
	    colorData[j+2] = color.blue;
	    colorData[j+3] = color.alpha;
	}
    } else {
	// scaled or unscaled display?
	if( this.scaled ){
	    colorBuf = im.psColors;
	} else {
	    colorBuf = im.colorCells;
	}
	// sanity check
	if( !colorBuf || im.useOffScreenCanvas() ){
	    JS9.Colorbar.imageclear.call(this, im);
	    return;
	}
	// first line gets colors from main display's rgb array
	idx0 = colorBuf.length / canvasWidth;
	for(i=0, j=0; i<canvasWidth; i++, j+=4){
	    idx = Math.floor(i * idx0);
	    colorData[j]   = colorBuf[idx][0];
	    colorData[j+1] = colorBuf[idx][1];
	    colorData[j+2] = colorBuf[idx][2];
	    colorData[j+3] = 255;
	}
    }
    // other lines get a copy of the first line
    for(i=1; i<canvasHeight; i++){
	colorData.set(colorBuf0, i * colorWidth);
    }
    // display colorbar
    this.ctx.putImageData(colorImg, 0, 0);
    // if we are not displaying the tick marks, we're done
    if( !this.showTicks ){
	return;
    }
    // clear tick display
    this.textctx.clear();
    if( im.staticObj && im.staticObj.colors.length <  this.ticks ){
	prec = JS9.floatPrecision(dmin, dmax);
	lastix = -99999;
	for(i=0; i<im.staticObj.colors.length; i++){
	    color = im.staticObj.colors[i];
	    label = JS9.floatFormattedString(color.min, prec, 0);
	    ix = Math.ceil(color.min / idx0) + 1;
	    iy = 0;
	    // if the label is going to be wide, skip even ones
	    if( (Math.abs(ix - lastix) <= JS9.Colorbar.STATICPADDING)        ||
		((label.length >= JS9.Colorbar.STATICSIZE) && (i % 2 === 0)) ){
		dolabel = false;
	    } else {
		lastix = ix;
		dolabel = true;
	    }
	    drawLabel(ix, iy, label, dolabel);
	}
    } else {
	// display tick marks
	idx0 = im.psInverse.length / this.ticks;
	// get precision estimate
	prec = JS9.floatPrecision(Math.min(im.params.scalemin,im.psInverse[0]),
	     Math.max(im.params.scalemax, im.psInverse[im.psInverse.length-1]));
	// make labels, with a feeble attempt to avoid duplicates
	for(j=0; j<5; j++){
	    done = true;
	    // gather array of labels
	    for(i=0; i<this.ticks; i++){
		tval = im.psInverse[Math.floor(i*idx0)];
		tlabels[i] = JS9.floatFormattedString(tval, prec, j);
	    }
	    // look for dups
	    for(i=1; i<this.ticks; i++){
		if( tlabels[i-1] === tlabels[i] ){
		    done = false;
		}
	    }
	    // done if no dups
	    if( done ){
		break;
	    }
	}
	// draw tick marks and labels
	for(i=1; i<this.ticks; i++){
	    // skip repeats
	    if( (i > 1) && (tlabels[i] === tlabels[i-1]) ){
		continue;
	    }
	    ix = (i/this.ticks)*this.width;
	    iy = 0;
	    // if the label is going to be wide, skip even ones
	    if( (tlabels[i].length >= JS9.Colorbar.MAXLABELSIZE) &&
		(i % 2 === 0) ){
		dolabel = false;
	    } else {
		dolabel = true;
	    }
	    drawLabel(ix, iy, tlabels[i], dolabel);
	}
    }
};

// constructor: add HTML elements to the plugin
JS9.Colorbar.init = function(width, height){
    const ratio = JS9.PIXEL_RATIO || 1;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id of the div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // set width and height of plugin itself
    // display the tick marks? this will influence some height params ...
    this.showTicks = this.divjq.attr("data-showTicks");
    if( this.showTicks === undefined ){
	this.showTicks = true;
    } else if( this.showTicks === "true" ){
	this.showTicks = true;
    } else {
	this.showTicks = false;
    }
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width = width || JS9.Colorbar.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	// no tick mark display: default height becomes colorbar height
	if( this.showTicks ){
	    this.height = height || JS9.Colorbar.HEIGHT;
	} else {
	    this.height = height || JS9.Colorbar.COLORBARHEIGHT;
	}
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // height of colorbar inside plugin
    this.colorbarWidth = this.width;
    this.colorbarHeight = parseInt(this.divjq.attr("data-colorbarHeight"), 10);
    if( !this.colorbarHeight ){
	this.colorbarHeight  = JS9.Colorbar.COLORBARHEIGHT;
    }
    // but no larger than the overall height
    this.colorbarHeight = Math.min(this.height, this.colorbarHeight);
    // display scaled or unscaled colorbar?
    this.scaled = this.divjq.attr("data-scaled");
    if( this.scaled === undefined ){
	this.scaled  = JS9.Colorbar.SCALED;
    } else if( this.scaled === "true" ){
	this.scaled = true;
    } else {
	this.scaled = false;
    }
    // tick marks
    this.ticks = this.divjq.attr("data-ticks");
    if( !this.ticks ){
	this.ticks = JS9.Colorbar.TICKS;
    }
    // clean plugin container
    this.divjq.html("");
    // colorbar container
    this.colorbarContainer = $("<div>")
	.addClass(`${JS9.Colorbar.BASE}Container`)
	.attr("id", `${this.id}Container`)
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    // main canvas
    this.colorbarjq = $("<canvas>")
	.addClass(`${JS9.Colorbar.BASE}Canvas`)
	.attr("id", `${this.id}Canvas`)
        .attr("width", this.width-1)
        .attr("height", this.colorbarHeight)
	.appendTo(this.colorbarContainer);
    this.ctx = this.colorbarjq[0].getContext("2d");
    // set up for text display?
    if( this.showTicks ){
	// numeric text and tick marks
	// (height and width changes deal with HiDPI text blur problems!)
	this.textjq = $("<canvas>")
	    .addClass(`${JS9.Colorbar.BASE}TextCanvas`)
	    .attr("id", `${this.id}TextCanvas`)
            .attr("width", this.width * ratio)
            .attr("height", (this.height - this.colorbarHeight) * ratio)
            .css("width", `${this.width}px`)
            .css("height", `${this.height - this.colorbarHeight}px`)
	    .appendTo(this.colorbarContainer);
	this.textctx = this.textjq[0].getContext("2d");
	// font specified in data property of div element?
	this.colorbarFont = this.divjq.attr("data-colorbarFont");
	if( this.colorbarFont ){
	    this.textctx.font = this.colorbarFont;
	} else if( JS9.Colorbar.COLORBARFONT ){
	    this.textctx.font = JS9.Colorbar.COLORBARFONT;
	}
	this.textctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    // display current colorbar, if necessary
    if( this.display.image ){
	JS9.Colorbar.display.call(this, this.display.image);
    }
};

// callback when image is (re-)displayed
JS9.Colorbar.imagedisplay = function(im){
    if( im ){
	JS9.Colorbar.display.call(this, im);
    }
};

// callback when image is cleared or closed
JS9.Colorbar.imageclear = function(im){
    if( im && (im === im.display.image) ){
	// clear buffers
	if( this.ctx ){
	    this.ctx.clear();
	}
	if( this.textctx ){
	    this.textctx.clear();
	}
    }
};

// dynamic change
JS9.Colorbar.dynamic = function(im){
    let colorbar;
    if( im ){
	colorbar = im.display.pluginInstances.JS9Colorbar;
	if( colorbar && colorbar.isDynamic ){
	    JS9.Colorbar.imagedisplay.call(this, im);
	}
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Colorbar.CLASS, JS9.Colorbar.NAME, JS9.Colorbar.init,
		   {menuItem: "Colorbar",
		    dynamicSelect: true,
		    ondynamicselect: JS9.Colorbar.dynamic,
		    onimagedisplay: JS9.Colorbar.imagedisplay,
		    onimageclear: JS9.Colorbar.imageclear,
		    onimageclose: JS9.Colorbar.imageclear,
		    help: "help/colorbar.html",
		    winTitle: "Colorbar",
		    winDims: [JS9.Colorbar.WIDTH, JS9.Colorbar.HEIGHT]});
