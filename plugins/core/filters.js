/*
 * image filters plugin (November 2, 2019)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Filters = {};
JS9.Filters.CLASS = "JS9";       // class of plugins
JS9.Filters.NAME = "Filters";    // name of this plugin
JS9.Filters.WIDTH = 325;         // width of light window
JS9.Filters.HEIGHT = 520;        // height of light window
JS9.Filters.BASE = JS9.Filters.CLASS + JS9.Filters.NAME;

// image filters with no args
JS9.Filters.noargfilters = {
    edge: {def: null},
    invert: {def: null},
    luminance: {def: null},
    median: {def: null},
    sobel: {def: null}
};

// image filters accepting args
JS9.Filters.argfilters = {
    blur: {min: 0, max: 100, step: 1, init: 0, def: 30},
    brighten: {min: 1, max: 100, step: 1, init: 0, def: 10},
    darken: {min: 0, max: 1, step: 0.01, init: 0, def: .66},
    duotone: {min: 0, max: 2, step: 1, init: 0, def: 2},
    emboss: {min: 0, max: 100, step: 1, init: 0, def: 100},
    gamma: {min: 0, max: 2, step: 0.01, init: 0, def: 0.2},
    lighten: {min: 1, max: 2, step: 0.01, init: 0, def: 1.33},
    noise: {min: 0, max: 100, step: 1, init: 0, def: 30},
    pixelate: {min: 0, max: 20, step: 1, init: 0, def: 2},
    scatter: {min: 0, max: 10, step: 1, init: 0, def: 5},
    sepia: {min: 0, max: 100, step: 1, init: 0, def: 100},
    sharpen: {min: 0, max: 100, step: 1, init: 0, def: 20},
    solarize: {min: 0, max: 100, step: 1, init: 0, def: 50}
};

JS9.Filters.headerHTML=`
<center>
<div class="JS9FiltersLineheader">
<span class="JS9FiltersHeader">
Image Filters:<br>
click for default settings or use the sliders
</span>
</center>
</div>
`;

JS9.Filters.noargfilterHTML=`
<span class="JS9FiltersName JS9FiltersCol1">
<input type="button" name="%sbutton" value="%s" class="JS9Button2 JS9FiltersButton" onclick="JS9.Filters.xfilter(this, '%s', '%s', '%s', %s)"></span>
`;

JS9.Filters.argfilterHTML=`
<span class="JS9FiltersName JS9FiltersCol1">
<input type="button" name="%sbutton" value="%s" class="JS9Button2 JS9FiltersButton" onclick="JS9.Filters.xfilter(this, '%s', '%s', '%s', %s)"></span>
<span class="JS9FiltersRange JS9FiltersCol2"><input type="range" min="%s" max="%s" step="%s" value="%s" name="%s" class="JS9FiltersRange" onchange="JS9.Filters.xgenfilter('%s', '%s', '%s', this)"></span>
<span class="JS9FiltersRangeVal">
<input type="text" name="%sval" class="JS9FiltersValue JS9FiltersCol3" min="0" max="100" value="0" onchange="JS9.Filters.xgenval('%s', '%s', '%s', this)"></span>
`;

JS9.Filters.undoHTML=`
<span class="JS9FiltersUndo JS9FiltersCol1">
<input type="button" id="undo" name="undo" value="undo" class="JS9FiltersUndoButton JS9Button2" onclick="JS9.Filters.xundo(this, '%s', '%s')"></span>
`;

JS9.Filters.resetHTML=`
<span class="JS9FiltersReset JS9FiltersCol3">
<input type="button" id="reset" name="reset" value="reset" class="JS9FiltersResetButton JS9Button2" onclick="JS9.Filters.xreset(this, '%s', '%s')"></span>
`;

// update gui filter param value
JS9.Filters.updateval = function(target, filter, val){
    if( target && $(target).length > 0 ){
	if( filter ){
	    $(target)
		.closest(`.${JS9.Filters.BASE}Container`)
		.find(`[name='${filter}']`)
		.prop("value", val);
	    $(target)
		.closest(`.${JS9.Filters.BASE}Container`)
		.find(`[name='${filter}val']`)
		.prop("value", val);
	    $(target)
		.closest(`.${JS9.Filters.BASE}Container`)
		.find(`[name='undo']`)
		.prop("value", `undo ${filter}`)
	        .css("width", "100px");
	} else {
	    $(target)
		.closest(`.${JS9.Filters.BASE}Container`)
		.find(`[name='undo']`)
		.prop("value", `undo`)
	        .css("width", "70px");
	}
    }
}


// execute default filter
JS9.Filters.xfilter = function(target, did, id, filter, val){
    let pinst, data;
    let oval = val;
    const im = JS9.lookupImage(id, did);
    if( im ){
	pinst = im.display.pluginInstances[JS9.Filters.BASE];
	pinst.stack = pinst.stack || [];
	if( pinst.stack.length &&
	    pinst.stack[pinst.stack.length - 1].filter === filter ){
	    im.rgb.img.data.set(pinst.stack[pinst.stack.length - 1].data);
	    pinst.stack[pinst.stack.length - 1].val = val;
	} else {
	    data = new Uint8ClampedArray(im.rgb.img.data);
	    pinst.stack.push({filter, val, data});
	}
	if( JS9.notNull(val) ){
	    switch(filter){
	    case "duotone":
		if( val === 0 ){
		    val = "r";
		} else if( val === 1 ){
		    val = "g";
		} else {
		    val = "b";
		}
		break;
	    case "darken":
		val = 1 - val;
		break;
	    }
	    im.filterRGBImage(filter, val);
	} else {
	    im.filterRGBImage(filter);
	}
	// update GUI values
	JS9.Filters.updateval(target, filter, oval);
    }
};

// undo the last filter
JS9.Filters.xundo = function(target, did, id){
    let i, pinst, obj, filter, val;
    const im = JS9.lookupImage(id, did);
    if( im ){
	pinst = im.display.pluginInstances[JS9.Filters.BASE];
	if( pinst.stack && pinst.stack.length ){
	    obj = pinst.stack.pop();
	    im.rgb.img.data.set(obj.data);
	    im.displayImage("display");
	    JS9.Filters.updateval(target, obj.filter, 0);
	}
	if( pinst.stack && pinst.stack.length ){
	    for(i=0; i<pinst.stack.length; i++){
		filter = pinst.stack[i].filter;
		val = pinst.stack[i].val;
		JS9.Filters.updateval(target, filter, val);
	    }
	} else {
	    JS9.Filters.updateval(target, null, null);
	}
    }
};

JS9.Filters.xreset = function(target, did, id){
    const im = JS9.lookupImage(id, did);
    if( im ){
	im.filterRGBImage("reset")
    }
};

// change the filter
JS9.Filters.xgenfilter = function(did, id, filter, target){
    let val;
    const im = JS9.lookupImage(id, did);
    if( im ){
	val = parseFloat(target.value)
	JS9.Filters.xfilter(target, did, id, filter, val);
	$(target)
	    .closest(`.${JS9.Filters.BASE}Container`)
	    .find(`[name='${filter}val']`)
	    .prop("value", val);
    }
};

JS9.Filters.xgenval = function(did, id, filter, target){
    let val;
    const im = JS9.lookupImage(id, did);
    if( im ){
	val = parseFloat(target.value)
	JS9.Filters.xfilter(target, did, id, filter, val);
	$(target)
	    .closest(`.${JS9.Filters.BASE}Container`)
	    .find(`[name='${filter}']`)
	    .prop("value", val);
    }
};

// re-init (avoiding recursion)
JS9.Filters.reinit = function(){
    const pinst = this.display.pluginInstances[JS9.Filters.BASE];
    if( !this.inProcess && pinst.stack && pinst.stack.length ){
	this.inProcess = true;
	delete pinst.stack;
	JS9.Filters.init.call(this);
	this.inProcess = false;
    }
};

// re-init when a different image is displayed
JS9.Filters.display = function(){
    let pinst;
    if( this.lastimage !== this.display.image ){
	pinst = this.display.pluginInstances[JS9.Filters.BASE];
	this.inProcess = true;
	delete pinst.stack;
	JS9.Filters.init.call(this);
	this.inProcess = false;
    }
};

// clear when an image closes
JS9.Filters.close = function(){
    // ensure plugin display is reset
    JS9.Filters.init.call(this, {mode: "clear"});
};

// constructor: add HTML elements to the plugin
JS9.Filters.init = function(opts){
    let s, t, im, mopts, imid, dispid, html, key, obj;
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
	this.width  = JS9.Filters.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.Filters.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // clear out html
    this.divjq.html("");
    html = JS9.Filters.headerHTML;
    // param values for image processing
    delete this.stack;
    // set up new html
    this.filtersContainer = $("<div>")
	.addClass(`${JS9.Filters.BASE}Container`)
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
	// add space before the filters
	html += `<div class='JS9FiltersLinegroup'>&nbsp;</div>`;
	// add the arg filters
	for( key of Object.keys(JS9.Filters.argfilters) ){
	    obj = JS9.Filters.argfilters[key];
	    mopts.push({name: key,
			value: sprintf(JS9.Filters.argfilterHTML,
				       key,
				       key,
				       dispid, imid, key, obj.def,
				       obj.min, obj.max, obj.step, obj.init,
				       key,
				       dispid, imid, key,
				       key,
				       dispid, imid, key)});
	    // add this line to the main html spec
	    html += `<div class='JS9FiltersLinegroup'>$${key}</div>`;
	}
	// add the noarg filterfs
	for( key of Object.keys(JS9.Filters.noargfilters) ){
	    mopts.push({name: key,
			value: sprintf(JS9.Filters.noargfilterHTML,
				       key,
				       key,
				       dispid, imid, key, null,
				       key,
				       dispid, imid, key,
				       key,
				       dispid, imid, key)});
	    // add this line to the main html spec
	    html += `<div class='JS9FiltersLinegroup'>$${key}</div>`;
	}
	// add space before the undo
	html += `<div class='JS9FiltersLinegroup'>&nbsp;</div>`;
	// add undo to the main html spec
	html += `<div class='JS9FiltersLinegroup'>$undo $reset</div>`;
	t = sprintf(JS9.Filters.undoHTML, dispid, imid);
	mopts.push({name: "undo", value: t});
	t = sprintf(JS9.Filters.resetHTML, dispid, imid);
	mopts.push({name: "reset", value: t});
	// expand macros to generate html
	s = im.expandMacro(html, mopts);
	this.lastimage = im;
    } else {
	s = "<p><center>Image filters will appear here.</center>";
    }
    this.filtersContainer.html(s);
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Filters.CLASS, JS9.Filters.NAME,
		   JS9.Filters.init,
		   {menuItem: "Image Filters",
		    onplugindisplay: JS9.Filters.init,
		    onchangecontrastbias: JS9.Filters.reinit,
		    onsetpan: JS9.Filters.reinit,
		    onsetcolormap: JS9.Filters.reinit,
		    onimagedisplay: JS9.Filters.display,
		    onimageclose: JS9.Filters.close,
		    help: "help/filters.html",
		    winTitle: "Image Filters",
		    winDims: [JS9.Filters.WIDTH, JS9.Filters.HEIGHT]});
