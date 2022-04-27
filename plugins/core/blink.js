/*
 * image blink plugin (March 10, 2016)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Blink = {};
JS9.Blink.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Blink.NAME = "Blink";     // name of this plugin (2nd part of div class)
JS9.Blink.WIDTH =  512;	  // width of light window
JS9.Blink.HEIGHT = 270;	  // height of light window
JS9.Blink.BASE = JS9.Blink.CLASS + JS9.Blink.NAME;  // CSS base class name

// blink rate in milliseconds
JS9.Blink.rate = 1000;

JS9.Blink.blinkModeHTML='When <b>Blink Images</b> is turned on, selected images will be displayed at the specified blink rate. You also can blink the selected images manually. The blink sequence can be changed by moving images around in the stack. <p>$mode&nbsp;&nbsp;&nbsp;&nbsp;$rate&nbsp;&nbsp;&nbsp;&nbsp;$manual';

JS9.Blink.modeHTML='<input type="checkbox" id="active" name="blinkImages" value="active" onclick="javascript:JS9.Blink.xblinkmode(\'%s\', this)"><b>Blink Images</b>';

JS9.Blink.rateHTML='<select class="JS9Select" id="blinkRateSelect" onfocus="this.selectedIndex=0;" onchange="JS9.Blink.xrate(\'%s\',this)"><option selected disabled>blink rate</option><option value="0.1">0.1</option><option value="0.25">0.25</option><option value="0.5">0.5</option><option value="1.0">1.0</option><option value="2.0">2.0</option><option value="3.0">3.0</option><option value="4.0">4.0</option><option value="5.0">5.0</option><option value="6.0">6.0</option><option value="7.0">7.0</option><option value="8.0">8.0</option><option value="9.0">9.0</option><option value="10.0">10.0</option><option value="15.0">15.0</option><option value="20.0">20.0</option><option value="30.0">30.0</option></select>';

JS9.Blink.manualHTML='<input type="button" class="JS9Button2" id="manual" name="manualBlink" value="blink manually" onclick="javascript:JS9.Blink.xblink1(\'%s\', this)">';

JS9.Blink.imageHTML="<span style='float: left'>$active&nbsp;&nbsp;</span><span id='blinkFile'>$imfile</span>";

JS9.Blink.activeHTML='<input class="blinkActiveCheck" type="checkbox" id="active" name="active" value="active" onclick="javascript:JS9.Blink.xactive(\'%s\', \'%s\', this)">blink';

JS9.Blink.imfileHTML='<b>%s</b>';

JS9.Blink.nofileHTML='<p><span id="blinkNoFile">[Images will appear here as they are loaded]</span>';

// start blinking
JS9.Blink.start = function(display){
    let im, saveidx;
    let done = false;
    const plugin = display.pluginInstances.JS9Blink;
    // sanity check
    if( !plugin ){
	return;
    }
    saveidx = plugin.idx;
    while( !done ){
	im = JS9.images[plugin.idx];
	if( (im.display === display) && im.tmp.blinkMode ){
	    im.displayImage("display");
	    done = true;
	}
	if( ++plugin.idx >= JS9.images.length ){
	    plugin.idx = 0;
	}
	if( plugin.idx === saveidx ){
	    done = true;
	}
    }
    if( display.blinkMode ){
	display.pluginInstances.JS9Blink.tid = window.setTimeout(() => {
	    JS9.Blink.start(display);
	}, plugin.rate);
    }
};

// stop blinking
JS9.Blink.stop = function(display){
    const plugin = display.pluginInstances.JS9Blink;
    // sanity check
    if( !plugin ){
	return;
    }
    if( plugin.tid ){
	window.clearTimeout(plugin.tid);
	delete plugin.tid;
    }
    display.blinkMode = false;
    plugin.idx = 0;
};

// change active state
JS9.Blink.xactive = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    const active = target.checked;
    if( im ){
	im.tmp.blinkMode = active;
    }
};

// change global blink mode for this display
JS9.Blink.xblinkmode = function(id, target){
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(id));
    const blinkMode = target.checked;
    // change global blink mode
    if( display ){
	$(".blinkActive").prop("disabled", !blinkMode);
	if( blinkMode ){
	    display.blinkMode = true;
	    JS9.Blink.start(display);
	} else {
	    JS9.Blink.stop(display);
	}
    }
};

// change global blink mode for this display
// eslint-disable-next-line no-unused-vars
JS9.Blink.xblink1 = function(id, target){
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(id));
    const plugin = display ? display.pluginInstances.JS9Blink : null;
    // sanity check
    if( !plugin || !display ){
	return;
    }
    // blink once
    if( JS9.images[plugin.idx] === display.image ){
	if( ++plugin.idx >= JS9.images.length ){
	    plugin.idx = 0;
	}
    }
    JS9.Blink.start(display);
};

// change blink rate
JS9.Blink.xrate = function(id, target){
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(id));
    const plugin = display ? display.pluginInstances.JS9Blink : null;
    const rate = Math.floor(target.options[target.selectedIndex].value * 1000);
    // sanity check
    if( !plugin || !display ){
	return;
    }
    if( !Number.isNaN(rate) ){
	plugin.rate = rate;
    }
};

// get a BlinkImage id based on the file image id
JS9.Blink.imid = function(im){
    const id = `${im.display.id}_${im.id}`;
    return `${id.replace(/[^A-Za-z0-9_]/g, "_")}BlinkImage`;
};

// get a class unique between displays
JS9.Blink.dispclass = function(im){
    const id = `${JS9.Blink.BASE}_${im.display.id}`;
    return id.replace(/[^A-Za-z0-9_]/g, "_");
};

// change the active image
JS9.Blink.activeImage = function(im){
    let id, dcls;
    if( im ){
	id = JS9.Blink.imid(im);
	dcls = `${JS9.Blink.dispclass(im)}_Image`;
	$(`.${dcls}`)
	    .removeClass(`${JS9.Blink.BASE}ImageActive`)
	    .addClass(`${JS9.Blink.BASE}ImageInactive`);
	$(`#${id}`)
	    .removeClass(`${JS9.Blink.BASE}ImageInactive`)
	    .addClass(`${JS9.Blink.BASE}ImageActive`);
    }
};

// add an image to the list of available images
JS9.Blink.addImage = function(im){
    let s, id, divjq, dcls, dispid, imid;
    const opts = [];
    const cls = `${JS9.Blink.BASE}Image`;
    if( !im ){
	return;
    }
    // convenience variables
    imid = im.id;
    dispid = im.display.id;
    // unique id
    id = JS9.Blink.imid(im);
    // get class for this layer
    dcls = `${JS9.Blink.dispclass(im)}_Image`;
    // value to pass to the macro expander
    opts.push({name: "imid", value: im.id});
    opts.push({name: "active", value: sprintf(JS9.Blink.activeHTML,
					      dispid, imid)});
    opts.push({name: "imfile", value: sprintf(JS9.Blink.imfileHTML,
					      imid)});
    // remove initial message
    if( !this.blinkDivs ){
	this.blinkImageContainer.html("");
    }
    // create the html for this image
    s = im.expandMacro(JS9.Blink.imageHTML, opts);
    // add image html to the image container
    divjq = $("<div>")
	.addClass(cls)
	.addClass(dcls)
	.attr("id", id)
	.prop("imid", imid)
	.html(s)
	.appendTo(this.blinkImageContainer);
    divjq.on("mousedown touchstart", () => {
	im.displayImage();
	JS9.Blink.activeImage.call(this, im);
    });
    // one more div in the stack
    this.blinkDivs++;
    // no blinking yet
    im.tmp.blinkMode = false;
    //make it the current one
    JS9.Blink.activeImage(im);
};

// remove an image from the list of available images
JS9.Blink.removeImage = function(im){
    let id;
    if( im ){
	id = JS9.Blink.imid(im);
	$(`#${id}`).remove();
	this.blinkDivs--;
	if( this.blinkDivs === 0 ){
	    this.blinkImageContainer.html(JS9.Blink.nofileHTML);
	}
	delete im.tmp.blinkMode;
	return true;
    }
    return false;
};

// constructor: add HTML elements to the plugin
JS9.Blink.init = function(){
    let i, s, im, display, dispid;
    const opts = [];
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold image container and header
    // initialize params
    if( this.idx === undefined ){
	this.idx = 0;
    }
    if( this.rate === undefined ){
	this.rate = JS9.Blink.rate;
    }
    // clean main container
    this.divjq.html("");
    // no images/divs loaded yet
    this.blinkDivs = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.blinkContainer = $("<div>")
	.addClass(`${JS9.Blink.BASE}Container`)
	.attr("id", `${this.id}BlinkContainer`)
        .css("overflow", "auto")
	.appendTo(this.divjq);
    dispid = this.display.id;
    opts.push({name: "mode", value: sprintf(JS9.Blink.modeHTML,
					    dispid)});
    opts.push({name: "manual", value: sprintf(JS9.Blink.manualHTML,
					      dispid)});
    opts.push({name: "rate", value: sprintf(JS9.Blink.rateHTML,
					    dispid)});
    s = JS9.Image.prototype.expandMacro.call(null, JS9.Blink.blinkModeHTML,
					     opts);
    // header
    this.blinkHeader = $("<div>")
	.addClass(`${JS9.Blink.BASE}Header`)
	.attr("id", `${dispid}Header`)
	.html(s)
	.appendTo(this.blinkContainer);
    // container to hold images
    this.blinkImageContainer = $("<div>")
	.addClass(`${JS9.Blink.BASE}ImageContainer`)
	.attr("id", `${this.id}BlinkImageContainer`)
        .html(JS9.Blink.nofileHTML)
	.appendTo(this.blinkContainer);
    display = JS9.getDynamicDisplayOr(this.display);
    // start with blink mode turned off
    display.blinkMode = false;
    // add currently loaded images
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( im.display === display ){
	    JS9.Blink.addImage.call(this, im);
	}
    }
    // the images within the image container will be sortable
    this.blinkImageContainer.sortable({
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
JS9.Blink.dysel = function(){
    const odisplay = JS9.getDynamicDisplayOr("previous");
    // turn off blink for previously selected display
    if( odisplay ){
	JS9.Blink.stop(odisplay);
    }
    // re-init the plugin
    JS9.Blink.init.call(this);
};

// callback when an image is loaded
JS9.Blink.imageload = function(im){
    const display = JS9.getDynamicDisplayOr(this.display);
    if( im && im.display === display ){
	JS9.Blink.addImage.call(this, im);
    }
};

// callback when image is displayed
JS9.Blink.imagedisplay = function(im){
    JS9.Blink.activeImage.call(this, im);
};

// callback when image is closed
JS9.Blink.imageclose = function(im){
    JS9.Blink.removeImage.call(this, im);
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Blink.CLASS, JS9.Blink.NAME, JS9.Blink.init,
		   {menuItem: "Blinking",
		    dynamicSelect: true,
		    onplugindisplay: JS9.Blink.init,
		    ondynamicselect: JS9.Blink.dysel,
		    onimageload: JS9.Blink.imageload,
		    onimagedisplay: JS9.Blink.imagedisplay,
		    onimageclose: JS9.Blink.imageclose,
		    help: "help/blink.html",
		    winTitle: "Image Blinking",
		    winResize: true,
		    winDims: [JS9.Blink.WIDTH, JS9.Blink.HEIGHT]});

