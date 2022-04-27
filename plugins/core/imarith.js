/*
 * imarith plugin (March 8, 2016)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Imarith = {};
JS9.Imarith.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Imarith.NAME = "Imarith";  // name of this plugin (2nd part of div class)
JS9.Imarith.WIDTH =  512;	 // width of light window
JS9.Imarith.HEIGHT = 170;	 // height of light window
JS9.Imarith.BASE = JS9.Imarith.CLASS + JS9.Imarith.NAME;

JS9.Imarith.imageHTML="<div class='JS9ImarithLinegroup'>Choose an op (add, subtract, multiply, divide, min, max) and an operand (number or image) and click Run. Reset will revert to the original data.</div><div class='JS9ImarithLinegroup'><span class='JS9ImarithSpan' style='float: left'><b>$imid</b> &nbsp;&nbsp; $op &nbsp;&nbsp; $arg1 &nbsp;&nbsp; $num</span></div><p><div class='JS9ImarithLinegroup'><span style='float: right'>$cancel $reset $run</span></div>";

JS9.Imarith.opHTML='<select class=JS9ImarithOp" onchange="JS9.Imarith.xop(\'%s\', \'%s\', this)"><option value="" selected disabled>op</option><option value="add">add</option><option value="sub">sub</option><option value="mul">mul</option><option value="div">div</option><option value="min">min</option><option value="max">max</option></select>';

JS9.Imarith.arg1HTML='<select class="JS9Select JS9ImarithArg1" onchange="JS9.Imarith.xarg1(\'%s\', \'%s\', this)"><option val="" selected disabled>operand</option><option value="num">number &#8594;</option>%s</select>';

JS9.Imarith.numHTML='<input type="text" class="JS9ImarithNum" value="" onchange="JS9.Imarith.xnum(\'%s\', \'%s\', this)" size="10" placeholder="number">';

JS9.Imarith.cancelHTML='<input type="button" class="JS9Button2 JS9ImarithBtn" value="Cancel" onclick="JS9.Imarith.xcancel(\'%s\', \'%s\', this)">';

JS9.Imarith.resetHTML='<input type="button" class="JS9Button2 JS9ImarithBtn" value="Reset" onclick="JS9.Imarith.xreset(\'%s\', \'%s\', this)">';

JS9.Imarith.runHTML='<input type="button" class="JS9RunButton JS9ImarithBtn" value="Run" onclick="JS9.Imarith.xrun(\'%s\', \'%s\', this)">';

// change op
JS9.Imarith.xop = function(did, id, target){
    const op = target.options[target.selectedIndex].value;
    const im = JS9.lookupImage(id, did);
    // save new op in instance record
    if( im && op ){
	im.display.pluginInstances.JS9Imarith.op = op;
    }
};

// change arg1
JS9.Imarith.xarg1 = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    const arg1 = target.options[target.selectedIndex].value;
    // save new arg1 in instance record
    if( im && arg1 ){
	im.display.pluginInstances.JS9Imarith.arg1 = arg1;
	if( arg1 === "num" ){
	    $(".JS9ImarithNum").css("visibility", "visible");
	} else {
	    $(".JS9ImarithNum").css("visibility", "hidden");
	}
    }
};

// change num
JS9.Imarith.xnum = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    const num = target.value;
    // save new num in instance record
    if( JS9.isNumber(num) ){
	im.display.pluginInstances.JS9Imarith.num = parseFloat(num);
    } else {
	if( num ){
	    JS9.error(`please enter a real number: ${num}`);
	}
    }
};

// cancel window
// eslint-disable-next-line no-unused-vars
JS9.Imarith.xcancel = function(did, id, target){
    let plugin;
    const display = JS9.lookupDisplay(did);
    if( display ){
	plugin = display.pluginInstances.JS9Imarith;
	if( plugin && plugin.winHandle ){
	    plugin.winHandle.close();
	}
    }
};

// reset to original data
// eslint-disable-next-line no-unused-vars
JS9.Imarith.xreset = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    if( im ){
	im.imarithData("reset");
    }
};

// run image arithmetic
// eslint-disable-next-line no-unused-vars
JS9.Imarith.xrun = function(did, id, target){
    let arg1, plugin;
    const im = JS9.lookupImage(id, did);
    if( im ){
	plugin = im.display.pluginInstances.JS9Imarith;
	if( !plugin.op || !plugin.arg1 ){
	    JS9.error("please select an operation and an operand");
	}
	if( plugin.arg1 === "num" ){
	    if( plugin.num === undefined ){
		JS9.error("please enter a real number for the operand");
	    }
	    arg1 = plugin.num;
	} else {
	    arg1 = plugin.arg1;
	}
	im.imarithData(plugin.op, arg1);
    }
};

// init when a different image is displayed
JS9.Imarith.display = function(){
    if( this.lastimage !== this.display.image ){
	JS9.Imarith.init.call(this);
    }
};

// clear when an image closes
JS9.Imarith.close = function(){
    // ensure plugin display is reset
    JS9.Imarith.init.call(this, {mode: "clear"});
};

// constructor: add HTML elements to the plugin
JS9.Imarith.init = function(opts){
    let i, s, im, tim, mopts, imid, dispid;
    let images = "";
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
	this.width  = JS9.Imarith.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.Imarith.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // height of imarith inside plugin
    this.imarithWidth = this.width;
    this.imarithHeight = parseInt(this.divjq.attr("data-imarithHeight"), 10);
    if( !this.imarithHeight ){
	this.imarithHeight  = JS9.Imarith.IMARITHHEIGHT;
    }
    // reset param values
    delete this.arg1;
    delete this.op;
    delete this.num;
    // do we have an image?
    im = this.display.image;
    if( im && (opts.mode !== "clear") ){
	// convenience variables
	imid = im.id;
	dispid = im.display.id;
	// make the last one
	this.lastim = im.id;
	// get list of images which can be operands (other than this one)
	for(i=0; i<JS9.images.length; i++){
	    tim = JS9.images[i];
	    if( tim !== im ){
		images += `<option value="${tim.id}">${tim.id}</option>`;
	    }
	}
	// create the html for this image
	mopts = [];
	mopts.push({name: "images", value: images});
	mopts.push({name: "imid", value: imid});
	mopts.push({name: "op", value: sprintf(JS9.Imarith.opHTML,
					       dispid, imid)});
	mopts.push({name: "arg1", value: sprintf(JS9.Imarith.arg1HTML,
						 dispid, imid, images)});
	mopts.push({name: "num", value: sprintf(JS9.Imarith.numHTML,
						dispid, imid)});
	mopts.push({name: "cancel", value: sprintf(JS9.Imarith.cancelHTML,
						  dispid, imid)});
	mopts.push({name: "reset", value: sprintf(JS9.Imarith.resetHTML,
						  dispid, imid)});
	mopts.push({name: "run", value: sprintf(JS9.Imarith.runHTML,
						dispid, imid)});
 	s = JS9.Image.prototype.expandMacro.call(im, JS9.Imarith.imageHTML,
						 mopts);
	this.lastimage = im;
    } else {
	s = "<p><center>Image arithmetic will appear here.</center>";
    }
    // clear out old html
    this.divjq.html("");
    // set up new html
    this.imarithContainer = $("<div>")
	.addClass(`${JS9.Imarith.BASE}Container`)
	.attr("id", `${this.id}Container`)
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    this.imarithContainer.html(s);
    this.imarithContainer.find(".JS9ImarithNum").css("visibility", "hidden");
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Imarith.CLASS, JS9.Imarith.NAME, JS9.Imarith.init,
		   {menuItem: "Imarith",
		    onplugindisplay: JS9.Imarith.init,
		    onimageload: JS9.Imarith.init,
		    onimagedisplay: JS9.Imarith.display,
		    onimageclose: JS9.Imarith.close,
		    help: "help/imarith.html",
		    winTitle: "Image Arithmetic",
		    winDims: [JS9.Imarith.WIDTH, JS9.Imarith.HEIGHT]});
