/*
 * image separate/gather plugin (July 26, 2018)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Separate = {};
JS9.Separate.CLASS = "JS9";       // class of plugins (1st part of div class)
JS9.Separate.NAME = "Separate";   // name of this plugin (2nd part of div class)
JS9.Separate.WIDTH =  512;	  // width of light window
JS9.Separate.HEIGHT = 336;	  // height of light window
JS9.Separate.BASE = JS9.Separate.CLASS + JS9.Separate.NAME;  // CSS base class name

JS9.Separate.topHTML='$separate<p>$gather';

JS9.Separate.separateHTML='<b>separate selected</b> images or <b>separate all</b> images into different displays. The topmost (selected) image remains in place, and the presence or absence of its menubar, toolbar, and colorbar will be replicated in the new displays:<p><div><input type="button" class="separateButton1 JS9Button2" name="separate" value="separate selected" onclick="javascript:JS9.Separate.separate.call(this, \'%s\', \'selected\');">;<input type="button" class="separateButton2 JS9Button2" name="separate" value="separate all" onclick="javascript:JS9.Separate.separate.call(this, \'%s\', \'all\');"><span style=\'float: right\'><select class="separateLayoutSelect JS9Select" onchange="JS9.Separate.xlayout.call(this, \'%s\')"><option selected disabled>layout</option><option value="auto">auto</option><option value="horizontal">horizontal</option><option value="vertical">vertical</option></select></span></div><p>';

JS9.Separate.gatherHTML='<b>gather selected</b> images or  <b>gather all</b> images into this display:<p><div><input type="button" class="separateButton1 JS9Button2" name="gather" value="gather selected" onclick="javascript:JS9.Separate.gather.call(this, \'%s\', \'selected\');"><input type="button" class="separateButton2 JS9Button2" name="gather" value="gather all" onclick="javascript:JS9.Separate.gather.call(this, \'%s\', \'all\');"></div><p>';

JS9.Separate.imageHTML="<span style='float: left'>$active&nbsp;&nbsp;</span><span id='separateFile'>$imfile</span>";

JS9.Separate.activeHTML='<input class="separateActiveCheck" type="checkbox" id="active" name="active" value="active" onclick="javascript:JS9.Separate.xactive.call(this, \'%s\')">select';

JS9.Separate.imfileHTML='<b>%s</b>';

JS9.Separate.nofileHTML='<p><span id="NoFile">[Images will appear here as they are loaded]</span>';

// change active state
JS9.Separate.xactive = function(id){
    const im = JS9.lookupImage(id);
    const active = this.checked;
    if( im ){
	im.tmp.separateMode = active;
    }
};

// change active state
JS9.Separate.xlayout = function(id){
    let plugin;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(id));
    if( !display ){ return; }
    plugin = display.pluginInstances.JS9Separate;
    if( plugin && this.selectedIndex >= 0 ){
	plugin.separateLayout = this.options[this.selectedIndex].value;
    }
};

// separate images
JS9.Separate.separate = function(id, which){
    let i, im, plugin, arr;
    const opts = {};
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(id));
    if( !display ){ return; }
    plugin = display.pluginInstances.JS9Separate;
    if( plugin && plugin.separateLayout ){
	opts.layout = plugin.separateLayout;
    }
    switch(which){
    case "selected":
	arr = [];
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( im.tmp.separateMode ){
		arr.push(im);
	    }
	}
	if( !arr.length ){ return; }
	opts.images = arr;
	break;
    default:
	break;
    }
    display.separate(opts);
};

// gather images
JS9.Separate.gather = function(id, which){
    let i, im, arr;
    const opts = {};
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(id));
    if( !display ){ return; }
    switch(which){
    case "all":
	display.gather();
	break;
    case "selected":
	arr = [];
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( im.tmp.separateMode ){
		arr.push(im);
	    }
	}
	if( !arr.length ){ return; }
	opts.images = arr;
	break;
    }
    display.gather(opts);
};

// get a SeparateImage id based on the file image id
JS9.Separate.imid = function(im){
    const id = `${im.display.id}_${im.id}`;
    return `${id.replace(/[^A-Za-z0-9_]/g, "_")}SeparateImage`;
};

// get a class unique between displays
JS9.Separate.dispclass = function(im){
    const id = `${JS9.Separate.BASE}_${im.display.id}`;
    return id.replace(/[^A-Za-z0-9_]/g, "_");
};

// change the active image
JS9.Separate.activeImage = function(im){
    let id, dcls;
    if( im ){
	id = JS9.Separate.imid(im);
	dcls = `${JS9.Separate.dispclass(im)}_Image`;
	$(`.${dcls}`)
	    .removeClass(`${JS9.Separate.BASE}ImageActive`)
	    .addClass(`${JS9.Separate.BASE}ImageInactive`);
	$(`#${id}`)
	    .removeClass(`${JS9.Separate.BASE}ImageInactive`)
	    .addClass(`${JS9.Separate.BASE}ImageActive`);
    }
};

// add an image to the list of available images
JS9.Separate.addImage = function(im){
    let s, id, divjq, dcls, imid;
    const opts = [];
    const cls = `${JS9.Separate.BASE}Image`;
    if( !im ){
	return;
    }
    // convenience variables
    imid = im.id;
    // unique id
    id = JS9.Separate.imid(im);
    // get class for this layer
    dcls = `${JS9.Separate.dispclass(im)}_Image`;
    // value to pass to the macro expander
    opts.push({name: "imid",   value: im.id});
    opts.push({name: "active", value: sprintf(JS9.Separate.activeHTML,
					      imid)});
    opts.push({name: "imfile", value: sprintf(JS9.Separate.imfileHTML,
					      imid)});
    // remove initial message
    if( !this.separateDivs ){
	this.separateImageContainer.html("");
    }
    // create the html for this image
    s = JS9.Image.prototype.expandMacro.call(im, JS9.Separate.imageHTML, opts);
    // add image html to the image container
    divjq = $("<div>")
	.addClass(cls)
	.addClass(dcls)
	.attr("id", id)
	.prop("imid", imid)
	.html(s)
	.appendTo(this.separateImageContainer);
    divjq.on("mousedown touchstart", () => {
	    im.displayImage();
	    JS9.Separate.activeImage(im);
    });
    // one more div in the stack
    this.separateDivs++;
    // check the selected box, if necessary
    divjq.find('.separateActiveCheck')
	.prop('checked', im.tmp.separateMode === true);
    //make it the current one
    JS9.Separate.activeImage(im);
};

// remove an image from the list of available images
JS9.Separate.removeImage = function(im){
    let id;
    if( im ){
	id = JS9.Separate.imid(im);
	$(`#${id}`).remove();
	this.separateDivs--;
	if( this.separateDivs === 0 ){
	    this.separateImageContainer.html(JS9.Separate.nofileHTML);
	}
	delete im.tmp.separateMode;
	return true;
    }
    return false;
};

// constructor: add HTML elements to the plugin
JS9.Separate.init = function(){
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
    // clean main container
    this.divjq.html("");
    // no images/divs loaded yet
    this.separateDivs = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.separateContainer = $("<div>")
	.addClass(`${JS9.Separate.BASE}Container`)
	.attr("id", `${this.id}SeparateContainer`)
        .css("overflow", "auto")
	.appendTo(this.divjq);
    dispid = this.display.id;
    opts.push({name: "separate", value: sprintf(JS9.Separate.separateHTML,
						dispid, dispid, dispid)});
    opts.push({name: "gather",   value: sprintf(JS9.Separate.gatherHTML,
						dispid, dispid)});
    s = JS9.Image.prototype.expandMacro.call(null, JS9.Separate.topHTML,
					     opts);
    // header
    this.separateHeader = $("<div>")
	.addClass(`${JS9.Separate.BASE}Header`)
	.attr("id", `${dispid}Header`)
	.html(s)
	.appendTo(this.separateContainer);
    // container to hold images
    this.separateImageContainer = $("<div>")
	.addClass(`${JS9.Separate.BASE}ImageContainer`)
	.attr("id", `${this.id}SeparateImageContainer`)
        .html(JS9.Separate.nofileHTML)
	.appendTo(this.separateContainer);
    display = JS9.getDynamicDisplayOr(this.display);
    // add currently loaded images
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( im.display === display ){
	    JS9.Separate.addImage.call(this, im);
	}
    }
    // the images within the image container will be sortable
    this.separateImageContainer.sortable({
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

// callback when an image is loaded
JS9.Separate.imageload = function(im){
    const display = JS9.getDynamicDisplayOr(this.display);
    if( im && im.display === display ){
	JS9.Separate.addImage.call(this, im);
    }
};

// callback when image is displayed
JS9.Separate.imagedisplay = function(im){
    JS9.Separate.activeImage.call(this, im);
};

// callback when image is displayed
JS9.Separate.imageclose = function(im){
    JS9.Separate.removeImage.call(this, im);
};

// callback when image is displayed
JS9.Separate.reinit = function(im){
    if( im ){
	JS9.Separate.init.call(this);
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Separate.CLASS, JS9.Separate.NAME, JS9.Separate.init,
		   {menuItem: "Separate/Gather",
		    dynamicSelect: true,
		    onplugindisplay: JS9.Separate.init,
		    ondynamicselect: JS9.Separate.reinit,
		    ongatherdisplay: JS9.Separate.reinit,
		    onimageload: JS9.Separate.imageload,
		    onimagedisplay: JS9.Separate.imagedisplay,
		    onimageclose: JS9.Separate.imageclose,
		    help: "help/separate.html",
		    winTitle: "Separate/Gather Images",
		    winResize: true,
		    winDims: [JS9.Separate.WIDTH, JS9.Separate.HEIGHT]});

