/*
 * imarith module (March 8, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf, Uint8Array */

// create our namespace, and specify some meta-information and params
JS9.Imarith = {};
JS9.Imarith.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Imarith.NAME = "Imarith";  // name of this plugin (2nd part of div class)
JS9.Imarith.WIDTH =  512;	 // width of light window
JS9.Imarith.HEIGHT = 170;	 // height of light window
JS9.Imarith.BASE = JS9.Imarith.CLASS + JS9.Imarith.NAME;

JS9.Imarith.imageHTML="<div class='JS9ImarithLinegroup'>Choose an op (add, subtract, multiply, divide, min, max) and an operand (number or image) and click Run. Reset will revert to the original data.</div><div class='JS9ImarithLinegroup'><span class='JS9ImarithSpan' style='float: left'><b>$imid</b> &nbsp;&nbsp; $op &nbsp;&nbsp; $arg1 &nbsp;&nbsp; $num</span></div><p><div class='JS9ImarithLinegroup'><span class='JS9ImarithSpan' style='float: left'>$run</span><span style='float: right'>$reset</span></div>";

JS9.Imarith.opHTML='<select class=JS9ImarithOp" onchange="JS9.Imarith.xop(\'%s\',this)"><option value="" selected disabled>op</option><option value="add">add</option><option value="sub">sub</option><option value="mul">mul</option><option value="div">div</option><option value="min">min</option><option value="max">max</option></select>';

JS9.Imarith.arg1HTML='<select class=JS9ImarithArg1" onchange="JS9.Imarith.xarg1(\'%s\',this)"><option val="" selected disabled>operand</option><option value="num">number &#8594;</option>%s</select>';

JS9.Imarith.numHTML='<input type="text" class="JS9ImarithNum" value="" onchange="JS9.Imarith.xnum(\'%s\',this)" size="10" placeholder="number">';

JS9.Imarith.runHTML='<input type="button" class=JS9ImarithBtn" value="Run" onclick="JS9.Imarith.xrun(\'%s\',this)">';

JS9.Imarith.resetHTML='<input type="button" class=JS9ImarithBtn" value="Reset" onclick="JS9.Imarith.xreset(\'%s\',this)">';

// change op
JS9.Imarith.xop = function(id, target){
    var op = target.options[target.selectedIndex].value;
    var im = JS9.lookupImage(id);
    // save new op in instance record
    if( im && op ){
	im.display.pluginInstances.JS9Imarith.op = op;
    }
};

// change arg1
JS9.Imarith.xarg1 = function(id, target){
    var im = JS9.lookupImage(id);
    var arg1 = target.options[target.selectedIndex].value;
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
JS9.Imarith.xnum = function(id, target){
    var im = JS9.lookupImage(id);
    var num = target.value;
    // save new num in instance record
    if( JS9.isNumber(num) ){
	im.display.pluginInstances.JS9Imarith.num = parseFloat(num);
    } else {
	if( num ){
	    JS9.error("please enter a real number: " + num);
	}
    }
};

// run image arithmetic
JS9.Imarith.xrun = function(id, target){
    var arg1, plugin;
    var im = JS9.lookupImage(id);
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

// reset to original data
JS9.Imarith.xreset = function(id, target){
    var im = JS9.lookupImage(id);
    if( im ){
	im.imarithData("reset");
    }
};

// constructor: add HTML elements to the plugin
JS9.Imarith.init = function(){
    var i, s, im, tim;
    var images = "";
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
    if( im ){
	// make the last one
	this.lastim = im.id;
	// get list of images that can be operands (other than this one)
	for(i=0; i<JS9.images.length; i++){
	    tim = JS9.images[i];
	    if( tim !== im ){
		images += sprintf('<option value="%s">%s</option>', 
				  tim.id, tim.id);
	    }
	}
	// create the html for this image
	opts.push({name: "images", value: images});
	opts.push({name: "imid", value: im.id});
	opts.push({name: "op", value: sprintf(JS9.Imarith.opHTML, im.id)});
	opts.push({name: "arg1", value: sprintf(JS9.Imarith.arg1HTML, im.id, images)});
	opts.push({name: "num", value: sprintf(JS9.Imarith.numHTML, im.id)});
	opts.push({name: "run", value: sprintf(JS9.Imarith.runHTML, im.id)});
	opts.push({name: "reset", value: sprintf(JS9.Imarith.resetHTML,im.id)});
 	s = JS9.Image.prototype.expandMacro.call(im, JS9.Imarith.imageHTML,
						 opts);
    } else {
	s = "<p><center>image arithmetic will appear here</center>";
    }
    // clear out old html
    this.divjq.html("");
    // set up new html
    this.imarithContainer = $("<div>")
	.addClass(JS9.Imarith.BASE + "Container")
	.attr("id", this.id + "Container")
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    this.imarithContainer.html(s);
    this.imarithContainer.find(".JS9ImarithNum").css("visibility", "hidden");
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Imarith.CLASS, JS9.Imarith.NAME, JS9.Imarith.init,
		   {menuItem: "Imarith",
		    plugindisplay: JS9.Imarith.init,
		    onimageload: JS9.Imarith.init,
		    onimagedisplay: JS9.Imarith.init,
		    help: "help/imarith.html",
		    winTitle: "Image Arithmetic",
		    winDims: [JS9.Imarith.WIDTH, JS9.Imarith.HEIGHT]});
