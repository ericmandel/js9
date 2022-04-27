/*
 * FITS 3D cube plugin (April 29, 2016)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Cube = {};
JS9.Cube.CLASS = "JS9";  // class of plugins (1st part of div class)
JS9.Cube.NAME = "Cube";  // name of this plugin (2nd part of div class)
JS9.Cube.WIDTH = 512;	 // width of light window
JS9.Cube.HEIGHT = 240;	 // height of light window
JS9.Cube.BASE = JS9.Cube.CLASS + JS9.Cube.NAME;

JS9.Cube.cubeHTML="<div class='JS9CubeLinegroup'>$header</div><p><div class='JS9CubeLinegroup'><span class='JS9CubeSpan' style='float: left'>$range&nbsp;&nbsp;$value&nbsp;&nbsp;$value2&nbsp;&nbsp;$extname</span><span class='JS9CubeSpan' style='float: right'>$order</span></div><div class='JS9CubeLinegroup'><span class='JS9CubeSpan' style='float: left'>$first&nbsp;$next&nbsp;$prev&nbsp;$last</span><span class='JS9CubeSpan' style='float: right'>$blink&nbsp;$stop&nbsp;$rate</span></div><p><div class='JS9CubeLinegroup'>$header2</div><p><div class='JS9CubeLinegroup'><span class='JS9CubeSpan' style='float: left'>$load</span></div>";

JS9.Cube.headerHTML='Use the slider, text box, navigation or blink buttons to display a slice of a <b>FITS data cube</b>. Use the menu at the right to specify the slice axis.';

JS9.Cube.rangeHTML='<span class="JS9CubeRangeLine">1<input type="range" min="%s" max="%s" value="%s" class="JS9CubeRange" onchange="JS9.Cube.xrange(\'%s\', \'%s\', this)">%s</span>';

JS9.Cube.valueHTML='<input type="text" class="JS9CubeValue" min="%s" max="%s" value="%s" onchange="JS9.Cube.xvalue(\'%s\', \'%s\', this)" size="4">';

JS9.Cube.value2HTML='<input type="text" class="JS9CubeValue2" min="%s" max="%s" value="%s" onchange="JS9.Cube.xvalue2(\'%s\', \'%s\', this)" size="8">';

JS9.Cube.firstHTML='<input type="button" class="JS9CubeBtn JS9Button2" value="First" onclick="JS9.Cube.xfirst(\'%s\', \'%s\', this)">';

JS9.Cube.nextHTML='<input type="button" class="JS9CubeBtn JS9Button2" value="Next" onclick="JS9.Cube.xnext(\'%s\', \'%s\', this)">';

JS9.Cube.prevHTML='<input type="button" class="JS9CubeBtn JS9Button2" value="Prev" onclick="JS9.Cube.xprev(\'%s\',\'%s\', this)">';

JS9.Cube.lastHTML='<input type="button" class="JS9CubeBtn JS9Button2" value="Last" onclick="JS9.Cube.xlast(\'%s\', \'%s\', this)">';

JS9.Cube.blinkHTML='<input type="button" class="JS9CubeBtn JS9Button2" value="Blink" onclick="JS9.Cube.xstart(\'%s\', \'%s\', this)">';

JS9.Cube.stopHTML='<input type="button" class="JS9CubeBtn JS9Button2" value="Stop" onclick="JS9.Cube.xstop(\'%s\', \'%s\', this)">';

JS9.Cube.extnameHTML='<span class="JS9CubeRangeLine">%s</span>';

JS9.Cube.orderHTML='<select class="JS9CubeOrder JS9Select" onchange="JS9.Cube.xorder(\'%s\', \'%s\', this)"><option value="$slice:*:*">$slice : * : *</option><option value="*:$slice:*">* : $slice : *</option><option value="*:*:$slice">* : * : $slice</option></select>';

JS9.Cube.rateHTML='<select class="JS9CubeRate JS9Select" onchange="JS9.Cube.xrate(\'%s\', \'%s\', this)"><option selected disabled>Rate</option><option value=".1">0.1 sec</option><option value=".25">0.25 sec</option><option value=".5">0.5 sec</option><option value="1" default>1 sec</option><option value="2">2 sec</option><option value="5">5 sec</option></select>';

JS9.Cube.header2HTML='Or load each slice separately into JS9:';

JS9.Cube.loadHTML='<input type="button" class="JS9CubeBtn JS9Button2" value="Load All" onclick="JS9.Cube.loadall(\'%s\',\'%s\', this)">';

JS9.Cube.pix2wcs = function(n){
    return (n - this.smin) * this.cdelt + this.crval;
};

JS9.Cube.wcs2pix = function(n){
    return Math.floor((n - this.crval) / this.cdelt + this.smin);
};

JS9.Cube.doSlice = function(im, slice, elarr){
    let i, s, wcsslice;
    const opts={};
    const plugin = im.display.pluginInstances[JS9.Cube.BASE];
    // are we still working on the previous slice?
    if( im.parentFile && plugin.inProcess ){
	// if so, return
	return;
    }
    wcsslice = JS9.Cube.pix2wcs.call(plugin, slice);
    for(i=0; i<elarr.length; i++){
	s = elarr[i];
	switch(s.charAt(s.length-1)){
	case "2":
	    plugin.divjq.find(elarr[i]).val(wcsslice);
	    break;
	default:
	    plugin.divjq.find(elarr[i]).val(slice);
	    break;
	}
    }
    s = im.expandMacro(plugin.slice, [{name: "slice", value: slice}]);
    plugin.sval = slice;
    plugin.inProcess = true;
    // display slice and signal process complete
    im.displaySlice(s, opts, () => {plugin.inProcess = false;});
};

// change range
JS9.Cube.xrange = function(did, id, target){
    let slice;
    const im = JS9.lookupImage(id, did);
    if( im ){
	slice = parseInt(target.value, 10);
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeValue2"]);
    }
};

// change slice value
JS9.Cube.xvalue = function(did, id, target){
    let slice;
    const im = JS9.lookupImage(id, did);
    if( im ){
	slice = parseInt(target.value, 10);
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue2", ".JS9CubeRange"]);
    }
};

// change slice value2
JS9.Cube.xvalue2 = function(did, id, target){
    let slice, plugin;
    const im = JS9.lookupImage(id, did);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	slice = JS9.Cube.wcs2pix.call(plugin, parseInt(target.value, 10));
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// first cube
// eslint-disable-next-line no-unused-vars
JS9.Cube.xfirst = function(did, id, target){
    let slice;
    const im = JS9.lookupImage(id, did);
    if( im ){
	slice = 1;
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeValue2", ".JS9CubeRange"]);
    }
};

// next cube
// eslint-disable-next-line no-unused-vars
JS9.Cube.xnext = function(did, id, target){
    let s, slice, plugin, header;
    const im = JS9.lookupImage(id, did);
    if( im ){
	header = im.raw.header;
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	slice = plugin.sval + 1;
	s = `NAXIS${plugin.sidx}`;
	if( slice > header[s] ){
	    slice = 1;
	}
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeValue2", ".JS9CubeRange"]);
    }
};

// prev cube
// eslint-disable-next-line no-unused-vars
JS9.Cube.xprev = function(did, id, target){
    let s, slice, plugin, header;
    const im = JS9.lookupImage(id, did);
    if( im ){
	header = im.raw.header;
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	slice = plugin.sval - 1;
	if( slice < 1 ){
	    s = `NAXIS${plugin.sidx}`;
	    slice = header[s];
	}
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeValue2", ".JS9CubeRange"]);
    }
};

// last cube
// eslint-disable-next-line no-unused-vars
JS9.Cube.xlast = function(did, id, target){
    let s, slice, plugin, header;
    const im = JS9.lookupImage(id, did);
    if( im ){
	header = im.raw.header;
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	s = `NAXIS${plugin.sidx}`;
	slice = header[s];
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeValue2", ".JS9CubeRange"]);
    }
};

// cube arrangement
JS9.Cube.xorder = function(did, id, target){
    let i, arr, plugin, header;
    const im = JS9.lookupImage(id, did);
    if( im ){
	header = im.raw.header;
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	plugin.slice = target.value;
	arr = plugin.slice.split(/[ ,:]/);
	for(i=0; i<arr.length; i++){
	    if( arr[i] !== "*" ){
		plugin.sidx = i+1;
		plugin.sval = 1;
		plugin.smin = 1;
		plugin.smax = header[`NAXIS${plugin.sidx}`];
	    }
	}
	$(".JS9CubeRange").prop("max", plugin.smax);
	JS9.Cube.doSlice(im, plugin.sval, [".JS9CubeValue", ".JS9CubeValue2", ".JS9CubeRange"]);
    }
};

// blink
JS9.Cube.blink = function(did, id, target, niter){
    let plugin;
    const im = JS9.lookupImage(id, did);
    if( im ){
	niter = niter || 0;
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	if( plugin.blinkMode === false ){
	    delete plugin.blinkMode;
	    return;
	}
	JS9.Cube.xnext(did, id, target);
	if( JS9.isNull(plugin.blinkMode) ){
	    plugin.blinkMode = true;
	}
	JS9.Cube.tid = window.setTimeout(() => {
	    if( !niter || im.status.displaySection !== "error" ){
		JS9.Cube.blink(did, id, target, ++niter);
	    } else {
		delete plugin.blinkMode;
	    }
	}, plugin.rate);
    }
};

// start blink
JS9.Cube.xstart = function(did, id, target){
    let plugin;
    const im = JS9.lookupImage(id, did);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	if( !plugin.blinkMode ){
	    JS9.Cube.blink(did, id, target);
	}
    }
};

// stop blink
// eslint-disable-next-line no-unused-vars
JS9.Cube.xstop = function(did, id, target){
    let plugin;
    const im = JS9.lookupImage(id, did);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	plugin.inProcess = false;
	if( plugin.blinkMode ){
	    if( plugin.tid ){
		window.clearTimeout(plugin.tid);
		delete plugin.tid;
	    }
	    plugin.blinkMode = false;
	}
    }
};

// blink rate
JS9.Cube.xrate = function(did, id, target){
    let plugin;
    const im = JS9.lookupImage(id, did);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	plugin.rate = Math.floor(parseFloat(target.value) * 1000);
    }
};

// load all slices separately
// eslint-disable-next-line no-unused-vars
JS9.Cube.loadall = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    if( im ){
	im.displaySlice("all");
    }
};


// re-init when a different image is displayed
JS9.Cube.display = function(){
    if( this.lastimage !== this.display.image ){
	JS9.Cube.init.call(this);
    }
};

// clear when an image closes
JS9.Cube.close = function(){
    // ensure plugin display is reset
    JS9.Cube.init.call(this, {mode: "clear"});
};

// constructor: add HTML elements to the plugin
JS9.Cube.init = function(opts){
    let i, s, im, arr, mopts, imid, dispid, header, slice;
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
	this.width  = JS9.Cube.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.Cube.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // height of cube inside plugin
    this.cubeWidth = this.width;
    this.cubeHeight = parseInt(this.divjq.attr("data-cubeHeight"), 10);
    if( !this.cubeHeight ){
	this.cubeHeight  = JS9.Cube.CUBEHEIGHT;
    }
    // do we have an image?
    im = this.display.image;
    if( im && (opts.mode !== "clear") ){
	header = im.raw.header;
	imid = im.id;
	dispid = im.display.id;
	slice = im.raw.hdu.slice;
	if( slice ){
	    this.slice = slice.replace(/[0-9][0-9]*/,"$slice");
	    arr = slice.split(/[ ,:]/);
	    for(i=0; i<arr.length; i++){
		if( arr[i] !== "*" ){
		    this.sidx = i+1;
		    this.smin = 1;
		    this.smax = header[`NAXIS${this.sidx}`];
		    this.sval = parseInt(arr[i], 10);
		}
	    }
	} else {
	    this.slice = "*:*:$slice";
	    this.smin = 1;
	    this.smax = header.NAXIS3;
	    this.sidx = 3;
	    this.sval = 1;
	}
	if( JS9.notNull(header[`CRPIX${this.sidx}`]) &&
	    JS9.notNull(header[`CRVAL${this.sidx}`]) &&
	    JS9.notNull(header[`CDELT${this.sidx}`]) ){
	    this.crpix = parseFloat(header[`CRPIX${this.sidx}`]);
	    this.crval = parseFloat(header[`CRVAL${this.sidx}`]);
	    this.cdelt = parseFloat(header[`CDELT${this.sidx}`]);
	} else {
	    delete this.crpix;
	    delete this.crval;
	    delete this.cdelt;
	}
	if( !this.rate ){
	    this.rate = 1000;
	}
	if( JS9.notNull(this.tid) ){
	    window.clearTimeout(this.tid);
	    delete this.tid;
	}
	if( JS9.notNull(this.blinkMode) ){
	    delete this.blinkMode;
	}
	if( header.NAXIS > 2 ){
	    mopts = [];
	    mopts.push({name: "header",  value: JS9.Cube.headerHTML});
	    mopts.push({name: "range",
		       value: sprintf(JS9.Cube.rangeHTML,
				      this.smin, this.smax, this.sval,
				      dispid, imid, this.smax)});
	    mopts.push({name: "value",
		       value: sprintf(JS9.Cube.valueHTML,
				      this.smin, this.smax, this.sval,
				      dispid, imid)});
	    mopts.push({name: "value2",
		       value: sprintf(JS9.Cube.value2HTML,
				      JS9.Cube.pix2wcs.call(this, this.smin),
				      JS9.Cube.pix2wcs.call(this, this.smax),
				      JS9.Cube.pix2wcs.call(this, this.sval),
				      dispid, imid)});
	    mopts.push({name: "first",
		       value: sprintf(JS9.Cube.firstHTML, dispid, imid)});
	    mopts.push({name: "next",
		       value: sprintf(JS9.Cube.nextHTML, dispid, imid)});
	    mopts.push({name: "prev",
		       value: sprintf(JS9.Cube.prevHTML, dispid, imid)});
	    mopts.push({name: "last",
		       value: sprintf(JS9.Cube.lastHTML, dispid, imid)});
	    mopts.push({name: "blink",
		       value: sprintf(JS9.Cube.blinkHTML, dispid, imid)});
	    mopts.push({name: "stop",
		       value: sprintf(JS9.Cube.stopHTML, dispid, imid)});
	    mopts.push({name: "order",
		       value: sprintf(JS9.Cube.orderHTML, dispid, imid)});
	    mopts.push({name: "rate",
		       value: sprintf(JS9.Cube.rateHTML, dispid, imid)});
	    mopts.push({name: "extname",
		       value: sprintf(JS9.Cube.extnameHTML,
				      header.EXTNAME || "")});
	    mopts.push({name: "header2",  value: JS9.Cube.header2HTML});
	    mopts.push({name: "load",
		       value: sprintf(JS9.Cube.loadHTML, dispid, imid)});
	    s = im.expandMacro(JS9.Cube.cubeHTML, mopts);
	} else {
	    s = "<p><center>This image is not a FITS data cube.</center>";
	}
	this.lastimage = im;
    } else {
	    s = "<p><center>FITS cube processing will appear here.</center>";
    }
    // clear out old html
    this.divjq.html("");
    // set up new html
    this.cubeContainer = $("<div>")
	.addClass(`${JS9.Cube.BASE}Container`)
	.attr("id", `${this.id}Container`)
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    this.cubeContainer.html(s);
    // set current values
    this.divjq.find(".JS9CubeRange").prop("max", this.smax);
    this.divjq.find(".JS9CubeValue").prop("max", this.smax);
    this.divjq.find(".JS9CubeOrder").val(this.slice);
    // hide or display wcs display
    if( this.crpix ){
	$(".JS9CubeValue2").show();
    } else {
	$(".JS9CubeValue2").hide();
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Cube.CLASS, JS9.Cube.NAME, JS9.Cube.init,
		   {menuItem: "Data Cube",
		    onplugindisplay: JS9.Cube.init,
		    onimageload: JS9.Cube.init,
		    onimagedisplay: JS9.Cube.display,
		    onimageclose: JS9.Cube.close,
		    help: "help/cube.html",
		    winTitle: "FITS Data Cubes",
		    winDims: [JS9.Cube.WIDTH, JS9.Cube.HEIGHT]});
