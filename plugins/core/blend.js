/*
 * image blend plugin (February 25, 2016)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Blend = {};
JS9.Blend.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Blend.NAME = "Blend";     // name of this plugin (2nd part of div class)
JS9.Blend.WIDTH =  550;	  // width of light window
JS9.Blend.HEIGHT = 270;	  // height of light window
JS9.Blend.BASE = JS9.Blend.CLASS + JS9.Blend.NAME;  // CSS base class name

JS9.Blend.blendModeHTML='When <b>Image Blending</b> is turned on, the images you select below will be combined using your chosen blend mode and optional opacity. See <a href="https://www.w3.org/TR/compositing-1/" target="blank">W3C Compositing and Blending</a> for info about compositing and blending.<p> <input type="checkbox" class="blendModeCheck" id="active" name="imageBlending" value="active" onclick="javascript:JS9.Blend.xblendmode(\'%s\', this)"><b>Image Blending</b>';

JS9.Blend.imageHTML="<span style='float: left'>$active &nbsp;&nbsp; $blend &nbsp;&nbsp; $opacity</span>&nbsp;&nbsp; <span id='blendFile'>$imfile</span>";

JS9.Blend.activeHTML='<input class="blendActiveCheck" type="checkbox" id="active" name="active" value="active" onclick="javascript:JS9.Blend.xactive(\'%s\', \'%s\', this)">blend using:';

JS9.Blend.blendHTML='<select class="blendModeSelect JS9Select" onchange="JS9.Blend.xblend(\'%s\', \'%s\', this)"><option selected disabled>blend mode</option><option value="normal">normal</option><option value="screen">screen</option><option value="multiply">multiply</option><option value="overlay">overlay</option><option value="darken">darken</option><option value="lighten">lighten</option><option value="color-dodge">color-dodge</option><option value="color-burn">color-burn</option><option value="hard-light">hard-light</option><option value="soft-light">soft-light</option><option value="difference">difference</option><option value="exclusion">exclusion</option><option value="hue">hue</option><option value="saturation">saturation</option><option value="color">color</option> <option value="luminosity">luminosity</option><option selected disabled>composite mode</option><option value="source-atop">source-atop</option><option value="source-in">source-in</option><option value="source-out">source-out</option><option value="source-over">source-over</option><option value="destination-atop">destination-atop</option><option value="destination-in">destination-in</option><option value="destination-out">destination-out</option><option value="destination-over">destination-over</option></select>';

JS9.Blend.opacityHTML='<select class="blendOpacitySelect JS9Select" onchange="JS9.Blend.xopacity(\'%s\', \'%s\', this)"><option selected disabled>opacity</option><option value="1.00">opaque</option><option value="0.95">0.95</option><option value="0.90">0.90</option><option value="0.85">0.85</option><option value="0.80">0.80</option><option value="0.75">0.75</option><option value="0.70">0.70</option><option value="0.65">0.65</option><option value="0.60">0.60</option><option value="0.55">0.55</option><option value="0.50">0.50</option><option value="0.45">0.45</option><option value="0.40">0.40</option><option value="0.35">0.35</option><option value="0.30">0.30</option><option value="0.25">0.25</option><option value="0.20">0.20</option><option value="0.10">0.10</option><option value="0.00">transparent</option></select>';

JS9.Blend.imfileHTML='<b>%s</b>';

JS9.Blend.nofileHTML='<p><span id="blendNoFile">[Images will appear here as they are loaded]</span>';

// change active state
JS9.Blend.xactive = function(did, id, target){
    let bl;
    const im = JS9.lookupImage(id, did);
    const active = target.checked;
    if( im ){
	// change active mode
	bl = im.blendImage();
	if( bl.active !== active ){
	    im.blendImage(active);
	}
    }
};

// change blend mode
JS9.Blend.xblend = function(did, id, target){
    let bl, mode;
    const im = JS9.lookupImage(id, did);
    if( target.selectedIndex >= 0 ){
	mode = target.options[target.selectedIndex].value;
    }
    if( im ){
	// change the blend mode
	if( JS9.notNull(mode) ){
	    bl = im.blendImage();
	    if( bl.mode !== mode ){
		im.blendImage(mode);
	    }
	}
    }
};

// change opacity
JS9.Blend.xopacity = function(did, id, target){
    let bl, opacity;
    const im = JS9.lookupImage(id, did);
    if( target.selectedIndex >= 0 ){
	opacity = target.options[target.selectedIndex].value;
    }
    if( im ){
	// change opacity
	if( JS9.notNull(opacity) ){
	    bl = im.blendImage();
	    opacity = parseFloat(opacity);
	    if( bl.opacity !== opacity ){
		im.blendImage(null, opacity);
	    }
	}
    }
};

// change global blend mode for this display
JS9.Blend.xblendmode = function(id, target){
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(id));
    const blendMode = target.checked;
    // change global blend mode
    if( display ){
        JS9.BlendDisplay(blendMode, {display: display});
    }
};

// get a BlendImage id based on the file image id
JS9.Blend.imid = function(im){
    const id = `${im.display.id}_${im.id}`;
    return `${id.replace(/[^A-Za-z0-9_]/g, "_")}BlendImage`;
};

// get a class unique between displays
JS9.Blend.dispclass = function(im){
    const id = `${JS9.Blend.BASE}_${im.display.id}`;
    return id.replace(/[^A-Za-z0-9_]/g, "_");
};

// set global blend option in the GUI
JS9.Blend.displayBlend = function(im){
    let disp;
    if( im ){
	disp = im.display;
	this.divjq.find(".blendModeCheck").prop("checked", disp.blendMode);
    }
};

// set image blend options in the GUI
JS9.Blend.imageBlend = function(im, dochange){
    let s, bl, id, el, el2;
    // get the current options
    bl = im.blendImage();
    // get id associated with this image
    id = JS9.Blend.imid(im);
    if( bl ){
	el = this.divjq.find(`#${id}`);
	el.find(".blendActiveCheck").prop("checked", bl.active);
	if( bl.mode !== undefined ){
	    el2 = el.find(".blendModeSelect").val(bl.mode);
	    if( dochange ){
		el2.change();
	    }
	}
	if( bl.opacity !== undefined ){
	    if( typeof bl.opacity === "number" ){
		s = bl.opacity.toFixed(2);
	    } else {
		s = bl.opacity;
	    }
	    el2 = el.find(".blendOpacitySelect").val(s);
	    if( dochange ){
		el2.change();
	    }
	}
    }
};

// change the active image
JS9.Blend.activeImage = function(im){
    let id, dcls;
    if( im ){
	id = JS9.Blend.imid(im);
	dcls = `${JS9.Blend.dispclass(im)}_Image`;
	$(`.${dcls}`)
	    .removeClass(`${JS9.Blend.BASE}ImageActive`)
	    .addClass(`${JS9.Blend.BASE}ImageInactive`);
	$(`#${id}`)
	    .removeClass(`${JS9.Blend.BASE}ImageInactive`)
	    .addClass(`${JS9.Blend.BASE}ImageActive`);
    }
};

// add an image to the list of available images
JS9.Blend.addImage = function(im){
    let s, id, divjq, dcls, dispid, imid;
    const opts = [];
    const cls = `${JS9.Blend.BASE}Image`;
    if( !im ){
	return;
    }
    // convenience variables
    imid = im.id;
    dispid = im.display.id;
    // unique id
    id = JS9.Blend.imid(im);
    // get class for this layer
    dcls = `${JS9.Blend.dispclass(im)}_Image`;
    // value to pass to the macro expander
    opts.push({name: "imid", value: imid});
    opts.push({name: "active", value: sprintf(JS9.Blend.activeHTML,
					      dispid, imid)});
    opts.push({name: "opacity", value: sprintf(JS9.Blend.opacityHTML,
					       dispid,  imid)});
    opts.push({name: "blend", value: sprintf(JS9.Blend.blendHTML,
					     dispid,  imid)});
    opts.push({name: "imfile", value: sprintf(JS9.Blend.imfileHTML,
					      imid)});
    // remove initial message
    if( !this.blendDivs ){
	this.blendImageContainer.html("");
    }
    // create the html for this image
    s = JS9.Image.prototype.expandMacro.call(im, JS9.Blend.imageHTML, opts);
    // add image html to the image container
    divjq = $("<div>")
	.addClass(cls)
	.addClass(dcls)
	.attr("id", id)
	.prop("imid", imid)
	.html(s)
	.appendTo(this.blendImageContainer);
    divjq.on("mousedown touchstart", () => {
	    im.displayImage();
	    JS9.Blend.activeImage.call(this, im);
    });
    // set the current options
    JS9.Blend.imageBlend.call(this, im, false);
    // set the current options
    JS9.Blend.displayBlend.call(this, im);
    // one more div in the stack
    this.blendDivs++;
    //make it the current one
    JS9.Blend.activeImage(im);
};

// remove an image to the list of available images
JS9.Blend.removeImage = function(im){
    let id;
    if( im ){
	id = JS9.Blend.imid(im);
	$(`#${id}`).remove();
	this.blendDivs--;
	if( this.blendDivs === 0 ){
	    this.blendImageContainer.html(JS9.Blend.nofileHTML);
	}
	return true;
    }
    return false;
};

// constructor: add HTML elements to the plugin
JS9.Blend.init = function(width, height){
    let i, im, omode, display;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold image container and header
    // allow size specification for divs
    if( this.winType === "div" ){
	// set width and height on div
	this.width = this.divjq.attr("data-width");
	if( !this.width  ){
	    this.width = width || JS9.Blend.WIDTH;
	}
	this.divjq.css("width", this.width);
	this.width = parseInt(this.divjq.css("width"), 10);
	this.height = this.divjq.attr("data-height");
	if( !this.height ){
	    this.height = height || JS9.Blend.HEIGHT;
	}
	this.divjq.css("height", this.height);
	this.height = parseInt(this.divjq.css("height"), 10);
    }
    // clean main container
    this.divjq.html("");
    // no images/divs loaded yet
    this.blendDivs = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.blendContainer = $("<div>")
	.addClass(`${JS9.Blend.BASE}Container`)
	.attr("id", `${this.id}BlendContainer`)
	.appendTo(this.divjq);
    // header
    this.blendHeader = $("<div>")
	.addClass(`${JS9.Blend.BASE}Header`)
	.attr("id", `${this.display.id}Header`)
	.html(sprintf(JS9.Blend.blendModeHTML, this.display.id))
	.appendTo(this.blendContainer);
    // container to hold images
    this.blendImageContainer = $("<div>")
	.addClass(`${JS9.Blend.BASE}ImageContainer`)
	.attr("id", `${this.id}BlendImageContainer`)
        .html(JS9.Blend.nofileHTML)
	.appendTo(this.blendContainer);
    // add currently loaded images (but avoid multiple redisplays)
    display = JS9.getDynamicDisplayOr(this.display);
    omode = display.blendMode;
    display.blendMode = false;
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( im.display === display ){
	    JS9.Blend.addImage.call(this, im);
	}
    }
    // final redisplay
    display.blendMode = omode;
    if( display.image ){
	display.image.displayImage();
    }
    // set global blend mode
    this.divjq.find(".blendModeCheck")
	.prop("checked", !!display.blendMode);
    // the images within the image container will be sortable
    this.blendImageContainer.sortable({
	start: (event, ui) => {
	    this.oidx = ui.item.index();
	},
	stop: (event, ui) => {
	    const nidx = ui.item.index();
	    // change JS9 image array to reflect the change
	    this.display.moveImageInStack(this.oidx, nidx);
	    // redisplay in case something changed
	    if( this.display.image ){
		this.display.image.displayImage();
	    }
	    delete this.oidx;
	}
    });
};

// callback when dynamic selection is made
JS9.Blend.dysel = function(){
    let omode;
    const odisplay = JS9.getDynamicDisplayOr("previous");
    // turn off blend for previously selected display
    if( odisplay ){
	omode = odisplay.blendMode;
	odisplay.blendMode = false;
	if( odisplay.image ){
	    odisplay.image.displayImage();
	}
    }
    // re-init the plugin
    JS9.Blend.init.call(this);
    // restore blend mode for previous display
    if( odisplay ){
	odisplay.blendMode = omode;
    }
};

// callback when global blend option is set externally
JS9.Blend.displayblend = function(im){
    // disp gives access to display object
    if( im ){
	JS9.Blend.displayBlend.call(this, im);
    }
};

// callback when blend options are set externally
JS9.Blend.imageblend = function(im){
    // im gives access to image object
    if( im ){
	JS9.Blend.imageBlend.call(this, im, false);
    }
};

// callback when an image is loaded
JS9.Blend.imageload = function(im){
    const display = JS9.getDynamicDisplayOr(this.display);
    if( im && im.display === display ){
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

// callback when a session is loaded
JS9.Blend.sessionload = function(im){
    if( im ){
	JS9.Blend.init.call(this);
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Blend.CLASS, JS9.Blend.NAME, JS9.Blend.init,
		   {menuItem: "Blending",
		    dynamicSelect: true,
		    onplugindisplay: JS9.Blend.init,
		    ondynamicselect: JS9.Blend.dysel,
		    ondisplayblend: JS9.Blend.displayblend,
		    onimageblend: JS9.Blend.imageblend,
		    onimageload: JS9.Blend.imageload,
		    onimagedisplay: JS9.Blend.imagedisplay,
		    onimageclose: JS9.Blend.imageclose,
		    onsessionload: JS9.Blend.sessionload,
		    help: "help/blend.html",
		    winTitle: "Image Blending",
		    winResize: true,
		    winDims: [JS9.Blend.WIDTH, JS9.Blend.HEIGHT]});

