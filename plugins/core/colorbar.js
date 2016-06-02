/*
 * colorbar module (March 8, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf, Uint8Array */

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
JS9.Colorbar.MAXLABELSIZE = 10;

// redraw colorbar on display
JS9.Colorbar.display = function(im){
    var i, j, prec, idx, idx0, colorBuf, tval, ix, iy, done;
    var tlabels = [];
    var canvasWidth = this.colorbarWidth;
    var canvasHeight = this.colorbarHeight;
    var colorImg = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var colorData = colorImg.data;
    var colorWidth = canvasWidth * 4;
    var colorBuf0 = new Uint8Array(colorData.buffer, 0, colorWidth);
    // scaled or unscaled display?
    if( this.scaled ){
	colorBuf = im.psColors;
    } else {
	colorBuf = im.colorCells;
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
    // other lines get a copy of the first line
    for(i=1; i<canvasHeight; i++){
	colorData.set(colorBuf0, i * colorWidth);
    }
    // display colorbar
    this.ctx.putImageData(colorImg, 0, 0);
    // display tick marks
    idx0 = im.psInverse.length / this.ticks;
    // clear tick display
    this.textctx.clear();
    // get precision estimate
    prec = JS9.floatPrecision(im.psInverse[0], 
			      im.psInverse[im.psInverse.length-1]);
    // make labels, with a feeble attempt to avoid duplicates
    for(j=0; j<3; j++){
	done = true;
	// gather array of labels
	for(i=0; i<this.ticks; i++){
	    tval = im.psInverse[Math.floor(i*idx0)];
	    tlabels[i] = JS9.floatFormattedString(tval, prec+j, j);
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
	this.textctx.textAlign = "center";
	this.textctx.beginPath();
	this.textctx.moveTo(ix, iy);
	this.textctx.lineWidth = 1;
	this.textctx.lineTo(ix, iy+5);
	this.textctx.stroke();
	// if the label is going to be wide, skip even ones
	if( (tlabels[i].length >= JS9.Colorbar.MAXLABELSIZE) && (i % 2 === 0) ){
	    continue;
	}
	this.textctx.fillText(tlabels[i], ix, iy+15);
    }
};

// constructor: add HTML elements to the plugin
JS9.Colorbar.init = function(){
    var ratio = JS9.PIXEL_RATIO || 1;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // set width and height of plugin itself
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = JS9.Colorbar.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.Colorbar.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // height of colorbar inside plugin
    this.colorbarWidth = this.width;
    this.colorbarHeight = parseInt(this.divjq.attr("data-colorbarHeight"), 10);
    if( !this.colorbarHeight ){
	this.colorbarHeight  = JS9.Colorbar.COLORBARHEIGHT;
    }
    // display scaled or unscaled colorbar?
    this.scaled = this.divjq.attr("data-scaled");
    if( this.scaled === undefined ){
	this.scaled  = JS9.Colorbar.SCALED;
    } else if( this.scaled === "true" ){
	this.scaled = true;
    } else {
	this.scaled = false;
    }
    this.ticks = this.divjq.attr("data-ticks");
    if( !this.ticks ){
	this.ticks = JS9.Colorbar.TICKS;
    }
    this.colorbarContainer = $("<div>")
	.addClass(JS9.Colorbar.BASE + "Container")
	.attr("id", this.id + "Container")
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    // main canvas
    this.colorbarjq = $("<canvas>")
	.addClass(JS9.Colorbar.BASE + "Canvas")
	.attr("id", this.id + "Canvas")
        .attr("width", this.width-1)
        .attr("height", this.colorbarHeight)
	.appendTo(this.colorbarContainer);
    this.ctx = this.colorbarjq[0].getContext("2d");
    // numeric text and tick marks
    // (height and width changes deal with HiDPI text blur problems!)
    this.textjq = $("<canvas>")
	.addClass(JS9.Colorbar.BASE + "TextCanvas")
	.attr("id", this.id + "TextCanvas")
        .attr("width", this.width * ratio)
        .attr("height", (this.height - this.colorbarHeight) * ratio)
        .css("width", this.width + "px")
        .css("height", (this.height - this.colorbarHeight) + "px")
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

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Colorbar.CLASS, JS9.Colorbar.NAME, JS9.Colorbar.init,
		   {menuItem: "Colorbar",
		    onimagedisplay: JS9.Colorbar.imagedisplay,
		    help: "help/colorbar.html",
		    winTitle: "Colorbar",
		    winDims: [JS9.Colorbar.WIDTH, JS9.Colorbar.HEIGHT]});
