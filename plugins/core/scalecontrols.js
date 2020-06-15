/*
 * scale clipping limits plugin (August 17, 2018)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.ScaleLimits = {};
JS9.ScaleLimits.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.ScaleLimits.NAME = "Scale";     // name of this plugin (2nd part of div class)
JS9.ScaleLimits.WIDTH = 512;	      // width of light window
JS9.ScaleLimits.HEIGHT = 400;	      // height of light window
JS9.ScaleLimits.WIDTHOFFSET = 40;   // width offset where plot canvas starts
JS9.ScaleLimits.HEIGHTOFFSET = 210; // height offset where plot canvas starts
JS9.ScaleLimits.BASE = JS9.ScaleLimits.CLASS + JS9.ScaleLimits.NAME;
// default scaling
JS9.ScaleLimits.XSCALE="linear";
JS9.ScaleLimits.YSCALE="log";
// number of points in the distribution
JS9.ScaleLimits.NDIST=512;
// timeout hack for cleaning up flot
JS9.ScaleLimits.TIMEOUT=250;
// size of limits marker for annotation 
JS9.ScaleLimits.CARET=4;
// size of xval text in pixels
JS9.ScaleLimits.XTEXTHEIGHT=14;
// font for xval text without size
JS9.ScaleLimits.XTEXTFONT="Ariel";
// font for xval text without size
JS9.ScaleLimits.XTEXTCOLOR="black";
// where to place the xval (as a fraction of plot size)
JS9.ScaleLimits.XTEXTFRAC = 0.75;
JS9.ScaleLimits.YTEXTFRAC = 0.15;
// plot colors
// see: https://htmlcolorcodes.com/color-picker/
JS9.ScaleLimits.PLOTCOLOR = "#030AE4";
JS9.ScaleLimits.XLOCOLOR  = "#FF0000";
JS9.ScaleLimits.XHICOLOR  = "#00FF00";
// axis font
JS9.ScaleLimits.AXISFONT = {size: 12, family: "Ariel", color: "black"};
JS9.ScaleLimits.AXISFANCY = true;
// data options
JS9.ScaleLimits.dataOpts = {
    bars: {show: true, align: "center", barWidth: 0.1},
    clickable: true,
    hoverable: true,
    data: []
};
// plot options
JS9.ScaleLimits.plotOpts = {
    selection: {
	mode:      "x"
    },
    grid: {
	hoverable: true
    }
};

JS9.ScaleLimits.scalelimsHTML="<div class='JS9ScaleLinegroup'>$header</div><div class='JS9ScaleLinegroup'>$scales&nbsp;&nbsp;$limits&nbsp;&nbsp;$axes</div><p><div class='JS9ScaleLinegroup'>$plot</div><p><div class='JS9ScaleLinegroup'><span class='JS9ScaleSpan' style='float: left'>&nbsp;&nbsp;$lo&nbsp;&nbsp;&nbsp;&nbsp;$hi</span></div>";

JS9.ScaleLimits.headerHTML='Set clipping limits via the Data Limits menu, or by selecting part of the Pixel Distribution plot, or by changing the Low and/or High limit.';

JS9.ScaleLimits.scalesHTML='<select class="JS9Select JS9ScaleSelect" onchange="JS9.ScaleLimits.xsetscale(\'%s\', \'%s\', this)">%s</select>';

JS9.ScaleLimits.limitsHTML='<select class="JS9Select JS9ScaleSelect" onchange="JS9.ScaleLimits.xsetlims(\'%s\', \'%s\', this)"><option selected disabled>Data Limits</option><option value="dataminmax">data min/max</option><option value="zscale_z1_z2">zscale z1/z2</option><option value="zscale_z1_datamax">zscale z1/max</option></select>';

JS9.ScaleLimits.axesHTML='<select class="JS9Select JS9ScaleSelect" onchange="JS9.ScaleLimits.xaxes(\'%s\', \'%s\', this)"><option selected disabled>Plot Axes</option><option disabled>x axis:</option><option value="xlinear">linear</option><option value="xlog">log</option><option disabled>y axis:</option><option value="ylinear">linear</option><option value="ylog">log</option></select>';

JS9.ScaleLimits.plotHTML='<div><center>Pixel Distribution: %s</center></div><div class="JS9ScalePlot" style="width:%spx;height:%spx"></div>';

JS9.ScaleLimits.loHTML='Low:&nbsp;&nbsp;<input type="text" class="JS9ScaleValue" value=\'%s\' onchange="JS9.ScaleLimits.xsetlo(\'%s\', \'%s\', this)" size="16">';

JS9.ScaleLimits.hiHTML='High:&nbsp;&nbsp;<input type="text" class="JS9ScaleValue" value=\'%s\' onchange="JS9.ScaleLimits.xsethi(\'%s\', \'%s\', this)" size="16">';

// change scale
JS9.ScaleLimits.xsetscale = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    if( im ){
	im.setScale(target.value);
    }
};

// change low clipping limit
JS9.ScaleLimits.xsetlo = function(did, id, target){
    let val;
    const im = JS9.lookupImage(id, did);
    if( im ){
	val = parseFloat(target.value);
	im.setScale(val, im.params.scalemax);
    }
};

// change high clipping limit
JS9.ScaleLimits.xsethi = function(did, id, target){
    let val;
    const im = JS9.lookupImage(id, did);
    if( im ){
	val = parseFloat(target.value);
	im.setScale(im.params.scalemin, val);
    }
};

// other ways to determine limits
JS9.ScaleLimits.xsetlims = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    if( im ){
	switch(target.value){
	case "dataminmax":
	    im.setScale("dataminmax", im.raw.dmin, im.raw.dmax);
	    break;
	case "zscale_z1_z2":
	    im.setScale("zscale", im.params.z1, im.params.z2);
	    break;
	case "zscale_z1_datamax":
	    im.setScale("zmax", im.params.z1, im.raw.dmax);
	    break;
	default:
	    break;
	}
    }
};

// log10 scaling
JS9.ScaleLimits.log10 = function(v){
    return v <= 0 ? null : Math.log(v) / Math.LN10;
};

// other ways to determine limits
JS9.ScaleLimits.xaxes = function(did, id, target){
    let plugin;
    const im = JS9.lookupImage(id, did);
    if( im ){
	// get current plugin instance
	plugin = im.display.pluginInstances[JS9.ScaleLimits.BASE];
	// sanity check
	if( !plugin || !plugin.plot ){
	    return;
	}
	// change the scale for the specified axis
	switch(target.value){
	case "xlinear":
	    plugin.xscale = "linear";
	    JS9.ScaleLimits.doplot.call(plugin, im);
	    break;
	case "xlog":
	    plugin.xscale = "log";
	    JS9.ScaleLimits.doplot.call(plugin, im);
	    break;
	case "ylinear":
	    plugin.yscale = "linear";
	    JS9.ScaleLimits.doplot.call(plugin, im);
	    break;
	case "ylog":
	    plugin.yscale = "log";
	    JS9.ScaleLimits.doplot.call(plugin, im);
	    break;
	default:
	    break;
	}
    }
    // reset top-level
    $(target).val("Plot Axes").prop("selected", true);
};

JS9.ScaleLimits.getPixelDist = function(im, ndist){
    let i, idx;
    const dist = [];
    const dmin = im.raw.dmin;
    const drange = im.raw.dmax - im.raw.dmin;
    const imlen = im.raw.width * im.raw.height;
    for(i=0; i<ndist; i++){
        dist[i] = 0;
    }
    for(i=0; i<imlen; i++){
//        idx = Math.floor((im.raw.data[i] / drange) * ndist + 0.5);
        idx = Math.floor(((im.raw.data[i] - dmin) / drange) * ndist + 0.5);
        if( idx >= 0 && idx < ndist ){
            dist[idx] += 1;
	}
    }
    return dist;
};

JS9.ScaleLimits.to10E = function(i){
    const superscripts = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
    if( JS9.ScaleLimits.AXISFANCY && i >= 0 && i <= 9 ){
	return `10${superscripts[i]}`;
    }
    return `10E${String(i)}`;
};

JS9.ScaleLimits.doplot = function(im){
    let i, j, s, el, xmin, xmax;
    let dist, distmin, distmax, ntick, tickinc;
    const dmin = im.raw.dmin;
    const drange = im.raw.dmax - im.raw.dmin;
    const pobj =  $.extend(true, {}, JS9.ScaleLimits.dataOpts);
    const popts = $.extend(true, {}, JS9.ScaleLimits.plotOpts);
    const gettickinc = (datarange) => {
	let tickinc;
	if( datarange < 10 ){
            tickinc = 1;
	} else if( datarange < 50 ){
            tickinc = 5;
	} else if( datarange < 250 ){
            tickinc = 10;
	} else if( datarange < 500 ){
            tickinc = 50;
	} else if( datarange < 2500 ){
            tickinc = 100;
	} else if( datarange < 5000 ){
            tickinc = 500;
	} else if( datarange < 25000 ){
            tickinc = 1000;
	} else if( datarange < 50000 ){
            tickinc = 5000;
	} else if( datarange < 250000 ){
            tickinc = 10000;
	} else if( datarange < 500000 ){
            tickinc = 50000;
	} else if( datarange < 2500000 ){
            tickinc = 100000;
	} else if( datarange < 5000000 ){
            tickinc = 500000;
	} else if( datarange < 25000000 ){
            tickinc = 1000000;
	} else {
            tickinc = 10000000;
	}
	return tickinc;
    };
    const annotate = (plot, x, color) => {
	const ctx = plot.getCanvas().getContext("2d");
	const size = JS9.ScaleLimits.CARET;
	const o = plot.pointOffset({x: x, y: 0});
	ctx.beginPath();
	ctx.moveTo(o.left, o.top);
	ctx.lineTo(o.left - size, o.top - (size*2));
	ctx.lineTo(o.left + size, o.top - (size*2));
	ctx.lineTo(o.left, o.top);
	ctx.fillStyle = color;
	ctx.fill();
    };
    // flag we have just started
    this.plotComplete = false;
    // plot options
    if( this.plotColor ){
	pobj.color = this.plotColor;
    }
    // pixel distribution
    dist = JS9.ScaleLimits.getPixelDist(im, this.ndist);
    // convert to flot data
    for(i=0; i<this.ndist; i++){
        pobj.data[i] = [i, dist[i]];
    }      
    // xaxis
    popts.xaxis = popts.xaxis || {};
    popts.xaxis.font = JS9.ScaleLimits.AXISFONT;
    if( this.xscale === "linear"  ){
	popts.xaxis.transform = null;
	popts.xaxis.ticks = [];
	tickinc = gettickinc(drange);
	ntick = Math.floor(drange/tickinc + 0.5) + 1;
	for(i=0; i<ntick; i++){
            j = i * tickinc;
	    s = String(j);
            popts.xaxis.ticks[i] = [(j - dmin) * this.ndist / drange, s];
	}
    } else if( this.xscale === "log"  ){
	popts.xaxis.transform = JS9.ScaleLimits.log10;
	popts.xaxis.min = 1;
	popts.xaxis.ticks = [];
	ntick = JS9.ScaleLimits.log10(this.ndist) + 1;
	for(i=0; i<ntick; i++){
	    j = Math.floor( (Math.pow(10, i) - dmin) * this.ndist / drange);
            popts.xaxis.ticks[i] = [j, JS9.ScaleLimits.to10E(i)];
	}
    }
    // plot location of current scaling min and max for annotations
    xmin = ((im.params.scalemin - dmin) / drange) * this.ndist;
    xmax = ((im.params.scalemax - dmin) / drange) * this.ndist;
    // y axis
    popts.yaxis = popts.yaxis || {};
    popts.yaxis.font = JS9.ScaleLimits.AXISFONT;
    if( this.yscale === "linear"  ){
	popts.yaxis.transform = null;
	popts.yaxis.ticks = null;
    } else if( this.yscale === "log"  ){
	popts.yaxis.transform = JS9.ScaleLimits.log10;
	popts.yaxis.min = 1;
	popts.yaxis.ticks = [];
	// distribution limits
	for(i=0; i<this.ndist; i++){
            if( distmin === undefined || dist[i] < distmin ){
		distmin = dist[i];
            }
            if( distmax === undefined || dist[i] > distmax ){
		distmax = dist[i];
            }
	}      
	ntick = JS9.ScaleLimits.log10(distmax - distmin + 1);
	for(i=0; i<ntick; i++){
            popts.yaxis.ticks[i] = [Math.pow(10, i), JS9.ScaleLimits.to10E(i)];
	}
    }
    el = this.divjq.find(".JS9ScalePlot");
    // this timeout stuff avoids generating plots too quickly in succession
    if( this.timeout ){
	// don't do previous plot
	window.clearTimeout(this.timeout);
	this.timeout = null;
    }
    // select limits
    el.off("plotselected");
    el.on("plotselected", (event, ranges) => {
	let start = ranges.xaxis.from;
	let end   = ranges.xaxis.to;
	if( this.xscale === "log" ){
	    start = Math.pow(10, start);
	    end = Math.pow(10, end);
	}
	start = start * drange / this.ndist + dmin;
	end   = end   * drange / this.ndist + dmin;
	im.setScale("user", start, end);
    });
    el.off("plothover");
    el.on("plothover", (event, pos) => {
	let ctx, text, s, x, y, w, h, xval;
	let px = pos.x;
	// sanity checks
	if( !this.plot || !this.plotComplete ){ 
	    return;
	}
	if( this.xscale === "log" ){
	    px = Math.pow(10, px);
	}
	xval = px * drange / this.ndist + dmin;
	if( !Number.isFinite(xval) ){
	    return;
	}
	s = JS9.floatToString(xval);
	// display x value in upper right corner of plot
	ctx = this.plot.getCanvas().getContext("2d");
	ctx.save();
	ctx.textBaseline = 'top';
	ctx.font = `${JS9.ScaleLimits.XTEXTHEIGHT  }px ${JS9.ScaleLimits.XTEXTFONT}`;
	ctx.fillStyle = JS9.ScaleLimits.XTEXTCOLOR || "black";
	text = ctx.measureText(s);
	w = Math.max(this.lastTextWidth, text.width + 2);
	h = JS9.ScaleLimits.XTEXTHEIGHT + 2;
	x = this.plotWidth  * JS9.ScaleLimits.XTEXTFRAC;
	y = this.plotHeight * JS9.ScaleLimits.YTEXTFRAC;
	ctx.clearRect(x, y, w, h);
	ctx.fillText(s, x, y); 
	ctx.restore();
	this.lastTextWidth = w;
    });
    this.timeout = window.setTimeout( () => {
	this.plot = $.plot(el, [pobj], popts);
	this.timeout = null;
	annotate(this.plot, xmin, this.xlocolor);
	annotate(this.plot, xmax, this.xhicolor);
	this.plotComplete = true;
    }, JS9.ScaleLimits.TIMEOUT);
};

// re-init when a different image is displayed
JS9.ScaleLimits.display = function(){
    if( this.lastimage !== this.display.image ){
	JS9.ScaleLimits.init.call(this);
    }
};

// clear when an image closes
JS9.ScaleLimits.close = function(){
    // ensure plugin display is reset
    JS9.ScaleLimits.init.call(this, {mode: "clear"});
};

// constructor: add HTML elements to the plugin
JS9.ScaleLimits.init = function(opts){
    let s, im, mopts, imid, dispid;
    const getScales = () => {
	let i;
	let res = "<option selected disabled>Scales</option>";
	for(i=0; i<JS9.scales.length; i++){
	    res += `<option>${JS9.scales[i]}</option>`;
	}
	return res;
    };
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // opts is optional
    opts = opts || {};
    // set width and height of plugin itself
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = JS9.ScaleLimits.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.ScaleLimits.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // set width and height of plot
    this.plotWidth = this.plotWidth || this.divjq.attr("data-plotWidth");
    if( !this.plotWidth  ){
	this.plotWidth  = this.width - JS9.ScaleLimits.WIDTHOFFSET;
    }
    this.plotHeight = this.plotHeight || this.divjq.attr("data-plotHeight");
    if( !this.plotHeight  ){
	this.plotHeight  = this.height - JS9.ScaleLimits.HEIGHTOFFSET;
    }
    // initial scaling
    this.xscale = this.xscale || this.divjq.attr("data-xscale");
    if( !this.xscale ){
	this.xscale  = JS9.ScaleLimits.XSCALE;
    }
    this.yscale = this.yscale || this.divjq.attr("data-yscale");
    if( !this.yscale ){
	this.yscale  = JS9.ScaleLimits.YSCALE;
    }
    // plot colors
    this.plotColor = this.plotColor || this.divjq.attr("data-plotColor");
    if( !this.plotColor ){
	this.plotColor  = JS9.ScaleLimits.PLOTCOLOR;
    }
    // plot color
    this.xlocolor = this.xlocolor || this.divjq.attr("data-xlocolor");
    if( !this.xlocolor ){
	this.xlocolor  = JS9.ScaleLimits.XLOCOLOR;
    }
    // plot color
    this.xhicolor = this.xhicolor || this.divjq.attr("data-xhicolor");
    if( !this.xhicolor ){
	this.xhicolor  = JS9.ScaleLimits.XHICOLOR;
    }
    // set number of distribution points
    this.ndist = this.divjq.attr("data-ndist");
    if( !this.ndist  ){
	this.ndist  = JS9.ScaleLimits.NDIST;
    }
    // clear out html
    this.divjq.html("");
    this.lastTextWidth = 0;
    // set up new html
    this.scalelimsContainer = $("<div>")
	.addClass(`${JS9.ScaleLimits.BASE}Container`)
	.attr("id", `${this.id}Container`)
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    // do we have an image?
    im = this.display.image;
    if( im && (opts.mode !== "clear") ){
	// convenience variables
	imid = im.id;
	dispid = im.display.id;
	mopts = [];
	mopts.push({name: "header",
		    value: JS9.ScaleLimits.headerHTML});
	mopts.push({name: "scales",
		    value: sprintf(JS9.ScaleLimits.scalesHTML,
				   dispid, imid, getScales())});
	mopts.push({name: "limits",
		    value: sprintf(JS9.ScaleLimits.limitsHTML,
				   dispid, imid)});
	mopts.push({name: "axes",
		    value: sprintf(JS9.ScaleLimits.axesHTML,
				   dispid, imid)});
	mopts.push({name: "plot",
		    value: sprintf(JS9.ScaleLimits.plotHTML,
				   imid, this.plotWidth, this.plotHeight)});
	mopts.push({name: "lo",
		    value: sprintf(JS9.ScaleLimits.loHTML,
				   JS9.floatToString(im.params.scalemin),
				   dispid, imid)});
	mopts.push({name: "hi",
		    value: sprintf(JS9.ScaleLimits.hiHTML,
				   JS9.floatToString(im.params.scalemax),
				   dispid, imid)});
	s = im.expandMacro(JS9.ScaleLimits.scalelimsHTML, mopts);
	this.lastimage = im;
    } else {
	s = "<p><center>Scale parameters will appear here.</center>";
    }
    this.scalelimsContainer.html(s);
    // set up initial plot, if possible
    if( im ){
	JS9.ScaleLimits.doplot.call(this, im);
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.ScaleLimits.CLASS, JS9.ScaleLimits.NAME,
		   JS9.ScaleLimits.init,
		   {menu: "scale",
		    menuItem: "Scale Controls ...",
		    onplugindisplay: JS9.ScaleLimits.init,
		    onsetscale: JS9.ScaleLimits.init,
		    onimagedisplay: JS9.ScaleLimits.display,
		    onimageclose: JS9.ScaleLimits.close,
		    help: "help/scalecontrols.html",
		    winTitle: "Scale Controls",
		    winDims: [JS9.ScaleLimits.WIDTH, JS9.ScaleLimits.HEIGHT]});
