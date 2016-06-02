/*
 * FITS 3D cube plugin (April 29, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf, Uint8Array */

// create our namespace, and specify some meta-information and params
JS9.Cube = {};
JS9.Cube.CLASS = "JS9";  // class of plugins (1st part of div class)
JS9.Cube.NAME = "Cube";  // name of this plugin (2nd part of div class)
JS9.Cube.WIDTH = 512;	 // width of light window
JS9.Cube.HEIGHT = 170;	 // height of light window
JS9.Cube.BASE = JS9.Cube.CLASS + JS9.Cube.NAME;

JS9.Cube.cubeHTML="<div class='JS9CubeLinegroup'>$header</div><p><div class='JS9CubeLinegroup'><span class='JS9CubeSpan' style='float: left'>$range&nbsp;&nbsp;&nbsp;&nbsp;$value&nbsp;&nbsp;&nbsp;&nbsp;$extname</span><span class='JS9CubeSpan' style='float: right'>$order</span></div><div class='JS9CubeLinegroup'><span class='JS9CubeSpan' style='float: left'>$first&nbsp;$next&nbsp;$prev&nbsp;$last</span><span class='JS9CubeSpan' style='float: right'>$blink&nbsp;$stop&nbsp;$rate</span></div>";

JS9.Cube.headerHTML='Use the slider, text box, navigation or blink buttons to display a slice of a <b>FITS data cube</b>. Use the menu at the right to specify the slice axis.';

JS9.Cube.rangeHTML='<span class="JS9CubeRangeLine">1<input type="range" min="1" max="%s" value="%s" class="JS9CubeRange" onchange="JS9.Cube.xrange(\'%s\',this)">%s</span>';

JS9.Cube.valueHTML='<input type="text" class="JS9CubeValue" min="1" max="%s" value="%s" onchange="JS9.Cube.xvalue(\'%s\',this)" size="3">';

JS9.Cube.firstHTML='<input type="button" class=JS9CubeBtn" value="First" onclick="JS9.Cube.xfirst(\'%s\',this)">';

JS9.Cube.nextHTML='<input type="button" class=JS9CubeBtn" value="Next" onclick="JS9.Cube.xnext(\'%s\',this)">';

JS9.Cube.prevHTML='<input type="button" class=JS9CubeBtn" value="Prev" onclick="JS9.Cube.xprev(\'%s\',this)">';

JS9.Cube.lastHTML='<input type="button" class=JS9CubeBtn" value="Last" onclick="JS9.Cube.xlast(\'%s\',this)">';

JS9.Cube.blinkHTML='<input type="button" class=JS9CubeBtn" value="Blink" onclick="JS9.Cube.xstart(\'%s\',this)">';

JS9.Cube.stopHTML='<input type="button" class=JS9CubeBtn" value="Stop" onclick="JS9.Cube.xstop(\'%s\',this)">';

JS9.Cube.extnameHTML='<span class="JS9CubeRangeLine">%s</span>';

JS9.Cube.orderHTML='<select class="JS9CubeOrder" onchange="JS9.Cube.xorder(\'%s\',this)"><option value="$slice,*,*">$slice : * : *</option><option value="*,$slice,*">* : $slice : *</option><option value="*,*,$slice">* : * : $slice</option></select>';

JS9.Cube.rateHTML='<select class="JS9CubeRate" onchange="JS9.Cube.xrate(\'%s\',this)"><option selected disabled>Rate</option><option value=".5">0.5 sec</option><option value="1" default>1 sec</option><option value="2">2 sec</option><option value="5">5 sec</option></select>';

JS9.Cube.doSlice = function(im, slice, elarr){
    var i, s;
    var opts={};
    var plugin = im.display.pluginInstances[JS9.Cube.BASE];
    for(i=0; i<elarr.length; i++){
	$(elarr[i]).val(slice);
    }
    s = im.expandMacro(plugin.slice, [{name: "slice", value: slice}]);
    im.displaySlice(s, opts);
};

// change range
JS9.Cube.xrange = function(id, target){
    var slice;
    var im = JS9.lookupImage(id);
    if( im ){
	slice = parseInt(target.value, 10);
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue"]);
    }
};

// change slice value
JS9.Cube.xvalue = function(id, target){
    var slice;
    var im = JS9.lookupImage(id);
    if( im ){
	slice = parseInt(target.value, 10);
	JS9.Cube.doSlice(im, slice, [".JS9CubeRange"]);
    }
};

// first cube
JS9.Cube.xfirst = function(id, target){
    var slice;
    var im = JS9.lookupImage(id);
    if( im ){
	slice = 1;
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// next cube
JS9.Cube.xnext = function(id, target){
    var s, slice, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	slice = plugin.sval + 1;
	s = "NAXIS" + plugin.sidx;
	if( slice >  im.raw.header[s] ){
	    slice = 1;
	}
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// prev cube
JS9.Cube.xprev = function(id, target){
    var s, slice, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	slice = plugin.sval - 1;
	if( slice < 1 ){
	    s = "NAXIS" + plugin.sidx;
	    slice = im.raw.header[s];
	}
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// last cube
JS9.Cube.xlast = function(id, target){
    var s, slice, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	s = "NAXIS" + plugin.sidx;
	slice = im.raw.header[s];
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// cube arrangement
JS9.Cube.xorder = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	plugin.slice = target.value;
	arr = plugin.slice.split(/[ ,:]/);
	for(i=0; i<arr.length; i++){
	    if( arr[i] !== "*" ){
		plugin.sidx = i+1;
		plugin.sval = 1;
		plugin.smax = im.raw.header["NAXIS"+plugin.sidx];
	    }
	}
	$(".JS9CubeRange").prop("max", plugin.smax);
	JS9.Cube.doSlice(im, plugin.sval, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// blink
JS9.Cube.blink = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	if( plugin.blinkMode === false ){
	    delete plugin.blinkMode;
	    return;
	}
	JS9.Cube.xnext(im, target);
	if( plugin.blinkMode === undefined ){
	    plugin.blinkMode = true;
	} 
	JS9.Cube.tid = window.setTimeout(function(){
		JS9.Cube.blink(im, target);
	    }, plugin.rate);
    }
};

// start blink
JS9.Cube.xstart = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	if( !plugin.blinkMode ){
	    JS9.Cube.blink(id, target);
	}
    }
};

// stop blink
JS9.Cube.xstop = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
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
JS9.Cube.xrate = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	plugin.rate = Math.floor(parseFloat(target.value) * 1000);
    }
};

// constructor: add HTML elements to the plugin
JS9.Cube.init = function(){
    var i, s, im, arr;
    var opts = [];
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
    if( im ){
	if( im.slice ){
	    this.slice = im.slice.replace(/[0-9][0-9]*/,"$slice");
	    arr = im.slice.split(/[ ,:]/);
	    for(i=0; i<arr.length; i++){
		if( arr[i] !== "*" ){
		    this.sidx = i+1;
		    this.smax = im.raw.header["NAXIS"+this.sidx];
		    this.sval = parseInt(arr[i], 10);
		}
	    }
	} else {
	    this.slice = "*,*,$slice";
	    this.smax = im.raw.header.NAXIS3;
	    this.sidx = 3;
	    this.sval = 1;
	}
	if( !this.rate ){
	    this.rate = 1000;
	}
	if( this.tid !== undefined ){
	    window.clearTimeout(this.tid);
	    delete this.tid;
	}
	if( this.blinkMode !== undefined ){
	    delete this.blinkMode;
	}
	if( im.raw.header.NAXIS > 2 ){
	    opts.push({name: "header",  value: JS9.Cube.headerHTML});
	    opts.push({name: "range", 
		       value: sprintf(JS9.Cube.rangeHTML,
				      this.smax, this.sval, im.id, this.smax)});
	    opts.push({name: "value", 
		       value: sprintf(JS9.Cube.valueHTML, 
				      this.smax, this.sval, im.id)});
	    opts.push({name: "first", 
		       value: sprintf(JS9.Cube.firstHTML, im.id)});
	    opts.push({name: "next",
		       value: sprintf(JS9.Cube.nextHTML, im.id)});
	    opts.push({name: "prev",
		       value: sprintf(JS9.Cube.prevHTML, im.id)});
	    opts.push({name: "last",
		       value: sprintf(JS9.Cube.lastHTML, im.id)});
	    opts.push({name: "blink",
		       value: sprintf(JS9.Cube.blinkHTML, im.id)});
	    opts.push({name: "stop",
		       value: sprintf(JS9.Cube.stopHTML, im.id)});
	    opts.push({name: "extname",
		       value: sprintf(JS9.Cube.extnameHTML, 
				      im.raw.header.EXTNAME || "")});
	    opts.push({name: "order",
		       value: sprintf(JS9.Cube.orderHTML, im.id)});
	    opts.push({name: "rate",
		       value: sprintf(JS9.Cube.rateHTML, im.id)});
 	    s = im.expandMacro(JS9.Cube.cubeHTML, opts);
	} else {
	    s = "<p><center>This image is not a FITS data cube.</center>";
	}
    } else {
	    s = "<p><center>FITS cube processing will go here</center>";
    }
    // clear out old html
    this.divjq.html("");
    // set up new html
    this.cubeContainer = $("<div>")
	.addClass(JS9.Cube.BASE + "Container")
	.attr("id", this.id + "Container")
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    this.cubeContainer.html(s);
    // set current values
    $(".JS9CubeRange").prop("max", this.smax);
    $(".JS9CubeValue").prop("max", this.smax);
    $(".JS9CubeOrder").val(this.slice);
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Cube.CLASS, JS9.Cube.NAME, JS9.Cube.init,
		   {menuItem: "Data Cube",
		    plugindisplay: JS9.Cube.init,
		    onimageload: JS9.Cube.init,
		    onimagedisplay: JS9.Cube.init,
		    help: "help/cube.html",
		    winTitle: "FITS Data Cubes",
		    winDims: [JS9.Cube.WIDTH, JS9.Cube.HEIGHT]});
