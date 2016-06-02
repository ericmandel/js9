/*
 * image blend module (February 25, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf */

// create our namespace, and specify some meta-information and params
JS9.Blend = {};
JS9.Blend.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Blend.NAME = "Blend";     // name of this plugin (2nd part of div class)
JS9.Blend.WIDTH =  512;	  // width of light window
JS9.Blend.HEIGHT = 270;	  // height of light window
JS9.Blend.BASE = JS9.Blend.CLASS + JS9.Blend.NAME;  // CSS base class name

JS9.Blend.blendModeHTML='When <b>Image Blending</b> is turned on, the images you select below will be combined using your chosen blend mode and optional opacity. See <a href="https://www.w3.org/TR/compositing-1/" target="blank">W3C Compositing and Blending</a> for info about compositing and blending.<p> <input type="checkbox" id="active" name="imageBlending" value="active" onclick="javascript:JS9.Blend.xblendmode(\'%s\', this)" checked><b>Image Blending</b>';

JS9.Blend.imageHTML="<span style='float: left'>$active &nbsp;&nbsp; $blend &nbsp;&nbsp; $opacity</span>&nbsp;&nbsp; <span id='blendFile'>$imfile</span>";

JS9.Blend.activeHTML='<input class="blendActiveCheck" type="checkbox" id="active" name="active" value="active" onclick="javascript:JS9.Blend.xactive(\'%s\', this)">blend using:';

JS9.Blend.blendHTML='<select id="blendModeSelect" onfocus="this.selectedIndex=0;" onchange="JS9.Blend.xblend(\'%s\',this)"><option selected disabled>blend mode</option><option value="normal">normal</option><option value="screen">screen</option><option value="multiply">multiply</option><option value="overlay">overlay</option><option value="darken">darken</option><option value="lighten">lighten</option><option value="color-dodge">color-dodge</option><option value="color-burn">color-burn</option><option value="hard-light">hard-light</option><option value="soft-light">soft-light</option><option value="difference">difference</option><option value="exclusion">exclusion</option><option value="hue">hue</option><option value="saturation">saturation</option><option value="color">color</option> <option value="luminosity">luminosity</option></select>';

JS9.Blend.opacityHTML='<select id="blendOpacitySelect" onfocus="this.selectedIndex=0;" onchange="JS9.Blend.xopacity(\'%s\',this)"><option selected disabled>opacity</option><option value="1.0">opaque</option><option value="0.95">0.95</option><option value="0.9">0.90</option><option value="0.85">0.85</option><option value="0.8">0.80</option><option value="0.75">0.75</option><option value="0.7">0.70</option><option value="0.65">0.65</option><option value="0.6">0.60</option><option value="0.55">0.55</option><option value="0.5">0.50</option><option value="0.45">0.45</option><option value="0.4">0.40</option><option value="0.35">0.35</option><option value="0.3">0.30</option><option value="0.25">0.25</option><option value="0.2">0.20</option><option value="0.1">0.10</option><option value="0.0">transparent</option></select>';

// JS9.Blend.imfileHTML='<input type="button" value="%s" onclick="javascript:JS9.Blend.ximfile(\'%s\', this)">';
JS9.Blend.imfileHTML='<b>%s</b>';

JS9.Blend.nofileHTML='<p><span id="blendNoFile">[Images will appear here as they are loaded]</span>';

// change active state
JS9.Blend.xactive = function(id, target){
    var im = JS9.lookupImage(id);
    var active = target.checked;
    if( im ){
	// change active mode
	im.blendImage(active);
    }
};

// change blend mode
JS9.Blend.xblend = function(id, target){
    var im = JS9.lookupImage(id);
    var blend = target.options[target.selectedIndex].value;
    if( im ){
	// change the blend mode
	if( blend !== "" ){
            im.blendImage(blend);
	}
    }
};

// change opacity
JS9.Blend.xopacity = function(id, target){
    var im = JS9.lookupImage(id);
    var opacity = target.options[target.selectedIndex].value;
    if( im ){
	// change opacity
	if( opacity !== "" ){
            im.blendImage(null, parseFloat(opacity));
	}
    }
};

// change current file
JS9.Blend.ximfile = function(id, target){
    var im = JS9.lookupImage(id);
    if( im ){
	// change "current" file to display
	im.displayImage();
    }
};

// change global blend mode for this display
JS9.Blend.xblendmode = function(id, target){
    var display = JS9.lookupDisplay(id);
    var blendMode = target.checked;
    // change global blend mode
    if( display ){
        JS9.BlendDisplay(blendMode, {display: display});
	$(".blendActive").prop("disabled", !blendMode);
    }
};

// get a BlendImage id based on the file image id
JS9.Blend.imid = function(im){
    return im.id
	.replace(/[^A-Za-z0-9_]/g, "_")
	+ "BlendImage";
};

// change the active image
JS9.Blend.activeImage = function(im){
    var id;
    if( im ){
	id = JS9.Blend.imid(im);
	$("." + JS9.Blend.BASE + "Image")
	    .removeClass(JS9.Blend.BASE + "ImageActive")
	    .addClass(JS9.Blend.BASE + "ImageInactive");
	$("#" + id)
	    .removeClass(JS9.Blend.BASE + "ImageInactive")
	    .addClass(JS9.Blend.BASE + "ImageActive");
    }
};

// add an image to the list of available images
JS9.Blend.addImage = function(im){
    var s, id, divjq;
    var opts = [];
    if( !im ){
	return;
    }
    id = JS9.Blend.imid(im);
    // value to pass to the macro expander
    opts.push({name: "imid", value: im.id});
    opts.push({name: "active", value: sprintf(JS9.Blend.activeHTML, im.id)});
    opts.push({name: "opacity", value: sprintf(JS9.Blend.opacityHTML, im.id)});
    opts.push({name: "imfile", value: sprintf(JS9.Blend.imfileHTML, im.id, im.id)});
    opts.push({name: "blend", value: sprintf(JS9.Blend.blendHTML, im.id)});
    // remove initial message
    if( !this.blendDivs ){
	this.blendImageContainer.html("");
    }
    // create the html for this image
    s = JS9.Image.prototype.expandMacro.call(im, JS9.Blend.imageHTML, opts);
    // add image html to the image container
    divjq = $("<div>")
	.addClass(JS9.Blend.BASE + "Image")
	.addClass(JS9.Blend.BASE + "ImageActive")
	.attr("id", id)
	.prop("imid", im.id)
	.html(s)
	.appendTo(this.blendImageContainer);
    divjq.on("mousedown touchstart", function(evt){
	    im.displayImage();
	    JS9.Blend.activeImage.call(this, im);
    });
    // one more div in the stack
    this.blendDivs++;
    //make it the current one
    JS9.Blend.activeImage(im);
};

// remove an image to the list of available images
JS9.Blend.removeImage = function(im){
    var id;
    if( im ){
	id = JS9.Blend.imid(im);
	$("#" + id).remove();
	this.blendDivs--;
	if( this.blendDivs === 0 ){
	    this.blendImageContainer.html(JS9.Blend.nofileHTML);
	}
	return true;
    }
    return false;
};

// constructor: add HTML elements to the plugin
JS9.Blend.init = function(){
    var i, im;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold image container and header
    var that = this;
    // clean main container
    this.divjq.html("");
    // no images/divs loaded yet
    this.blendDivs = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.blendContainer = $("<div>")
	.addClass(JS9.Blend.BASE + "Container")
	.attr("id", this.id + "BlendContainer")
	.appendTo(this.divjq);
    // header
    this.blendHeader = $("<div>")
	.addClass(JS9.Blend.BASE + "Header")
	.attr("id", this.display.id + "Header")
	.html(sprintf(JS9.Blend.blendModeHTML, this.display.id))
	.appendTo(this.blendContainer);
    // container to hold images
    this.blendImageContainer = $("<div>")
	.addClass(JS9.Blend.BASE + "ImageContainer")
	.attr("id", this.id + "BlendImageContainer")
        .html(JS9.Blend.nofileHTML)
	.appendTo(this.blendContainer);
    // start with blend mode turned on
    this.display.blendMode = true;
    // add currently loaded images
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( im.display === this.display ){
	    JS9.Blend.addImage.call(this, im);
	}
    }
    // the images within the image container will be sortable
    this.blendImageContainer.sortable({
	start: function(event, ui) {
	    this.oidx = ui.item.index();
	},
	stop: function(event, ui) {
	    var nidx = ui.item.index();
	    // JS9 image list reflects the sort
	    JS9.images.splice(nidx, 0, JS9.images.splice(this.oidx, 1)[0]);
	    // redisplay in case something changed
	    if( that.display.image ){
		that.display.image.displayImage();
	    }
	}
    });
};

// callback when an image is loaded
JS9.Blend.imageload = function(im){
    // im gives access to image object
    if( im ){
	JS9.Blend.addImage.call(this, im);
    }
};

// callback when image is displayed
JS9.Blend.imagedisplay = function(im){
    JS9.Blend.activeImage.call(this, im);
};

// callback when image is displayed
JS9.Blend.imageclose = function(im){
    JS9.Blend.removeImage.call(this, im);
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Blend.CLASS, JS9.Blend.NAME, JS9.Blend.init,
		   {menuItem: "Blending",
		    plugindisplay: JS9.Blend.init,
		    onimageload: JS9.Blend.imageload,
		    onimagedisplay: JS9.Blend.imagedisplay,
		    onimageclose: JS9.Blend.imageclose,
		    help: "help/blend.html",
		    winTitle: "Image Blending",
		    winResize: true,
		    winDims: [JS9.Blend.WIDTH, JS9.Blend.HEIGHT]});

