/*
 * colormap controls plugin (November 2, 2019)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Filters = {};
JS9.Filters.CLASS = "JS9";       // class of plugins
JS9.Filters.NAME = "Filters";  // name of this plugin
JS9.Filters.WIDTH = 370;         // width of light window
JS9.Filters.HEIGHT = 440;        // height of light window
JS9.Filters.BASE = JS9.Filters.CLASS + JS9.Filters.NAME;

// image filters with no args
JS9.Filters.noargfilters = ["edge", "luminance", "median", "sobel"]

// image filters accepting args
JS9.Filters.argfilters = ["blur", "brighten", "darken", "duotone", "emboss", "gamma", "lighten", "noise", "pixelate", "scatter", "sepia", "sharpen", "solarize"];

JS9.Filters.headerHTML=`
<center>
<div class="JS9FiltersFilterLine">
<span class="JS9FiltersHeader">
JS9 Image Filters:<br>
click for default filters or use the sliders
</span>
</center>
</div>
`;

JS9.Filters.noargfilterHTML=`
<div class="JS9FiltersFilterLine">
<span class="JS9FiltersName JS9FiltersFilterCol1">
<input type="button" name="%sbutton" value="%s" class="JS9FiltersButton" onclick="JS9.Filters.xfilter('%s', '%s', {value: '%s'})"></span>
</div>
`;

JS9.Filters.argfilterHTML=`
<div class="JS9FiltersFilterLine">
<span class="JS9FiltersName JS9FiltersFilterCol1">
<input type="button" name="%sbutton" value="%s" class="JS9FiltersButton" onclick="JS9.Filters.xfilter('%s', '%s', {value: '%s'})"></span>
<span class="JS9FiltersRange JS9FiltersFilterCol2"><input type="range" min="0" max="100" value="0" name="%s" class="JS9FiltersRange" onchange="JS9.Filters.xgenfilter('%s', '%s', '%s', this)"></span>
<span class="JS9FiltersRangeVal">
<input type="text" name="%sval" class="JS9FiltersValue JS9FiltersFilterCol3" min="0" max="100" value="0" onchange="JS9.Filters.xgenval('%s', '%s', '%s', this)" size="4"></span>
</div>
`;

JS9.Filters.undoHTML=`
<div class="JS9FiltersFilterLine">
<span class="JS9FiltersUndo JS9FiltersMenuCol1">
<input type="button" id="undo" name="undo" value="undo" class="JS9FiltersButton" onclick="JS9.Filters.xundo('%s', '%s', this)"></span>
</div>`;

// change the colormap
JS9.Filters.xsetcmap = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    if( im ){
	im.setColormap(target.value);
    }
    $(target).val("Filters");
};

// execute default filter
JS9.Filters.xfilter = function(did, id, target, val){
    let pinst;
    const filter = target.value;
    const im = JS9.lookupImage(id, did);
    if( im ){
	pinst = im.display.pluginInstances[JS9.Filters.BASE];
	pinst.lastimg = pinst.lastimg || [];
	pinst.lastfilter = pinst.lastfilter || [];
	if( pinst.lastimg.length &&
	    pinst.lastfilter[pinst.lastfilter.length - 1] === filter ){
	    im.rgb.img.data.set(pinst.lastimg[pinst.lastimg.length - 1]);
	} else {
	    pinst.lastimg.push(new Uint8ClampedArray(im.rgb.img.data));
	}
	if( JS9.notNull(val) ){
	    switch(filter){
	    case "brighten":
		val = val * 2.55;
		break;
	    case "duotone":
		if( val < 33 ){
		    val = "r";
		} else if( val < 66 ){
		    val = "g";
		} else {
		    val = "b";
		}
		break;
	    case "contrast":
		val = (val - 50) / 10;
		break;
	    case "darken":
		val = (100 - val) / 100.0;
		break;
	    case "emboss":
		val = (val / 2) + 50;
		break;
	    case "gamma":
		val = (100 - val) / 100;
		break;
	    case "lighten":
		val = val / 100.0 + 1;
		break;
	    case "pixelate":
		val = Math.max(1, Math.floor(val / 10.0));
		break;
	    case "posterize":
		val = Math.max(1, Math.floor(val / 4.0));
		break;
	    case "scatter":
		val = Math.max(1, Math.floor(val / 20.0));
		break;
	    case "solarize":
		val = val * 2.55;
		break;
	    }
	    im.filterRGBImage(filter, val);
	} else {
	    im.filterRGBImage(filter);
	}
	pinst.lastfilter.push(filter);
    }
    $(target).val("Filters");
};

// undo the last filter
JS9.Filters.xundo = function(did, id, target){
    let pinst, data, filter;
    const im = JS9.lookupImage(id, did);
    if( im ){
	pinst = im.display.pluginInstances[JS9.Filters.BASE];
	if( pinst.lastimg && pinst.lastimg.length ){
	    data = pinst.lastimg.pop();
	    im.rgb.img.data.set(data);
	    im.displayImage("display");
	}
	if( pinst.lastfilter && pinst.lastfilter.length ){
	    filter = pinst.lastfilter.pop();
	    if( filter ){
		$(target)
		    .closest(`.${JS9.Filters.BASE}Container`)
		    .find(`[name='${filter}']`)
		    .prop("value", 0);
		$(target)
		    .closest(`.${JS9.Filters.BASE}Container`)
		    .find(`[name='${filter}val']`)
		    .prop("value", 0);
	    }
	}
    }
};

// change the filter
JS9.Filters.xgenfilter = function(did, id, filter, target){
    let val;
    const im = JS9.lookupImage(id, did);
    if( im ){
	val = parseFloat(target.value)
	JS9.Filters.xfilter(did, id, {value: filter}, val);
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
	JS9.Filters.xfilter(did, id, {value: filter}, val);
	$(target)
	    .closest(`.${JS9.Filters.BASE}Container`)
	    .find(`[name='${filter}']`)
	    .prop("value", val);
    }
};

// re-init (avoiding recursion)
JS9.Filters.reinit = function(){
    const pinst = this.display.pluginInstances[JS9.Filters.BASE];
    if( !this.inProcess && pinst.lastfilter && pinst.lastfilter.length ){
	this.inProcess = true;
	delete pinst.lastfilter;
	delete pinst.lastimg;
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
	delete pinst.lastfilter;
	delete pinst.lastimg;
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
    let i, s, t, im, mopts, imid, dispid, html, key;
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
    delete this.lastimg;
    // set up new html
    this.colormapsContainer = $("<div>")
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
	// add the arg filters
	for(i=0; i<JS9.Filters.argfilters.length; i++){
	    key = JS9.Filters.argfilters[i];
	    mopts.push({name: key, 
			value: sprintf(JS9.Filters.argfilterHTML,
				       key,
				       key,
				       dispid, imid, key,
				       key,
				       dispid, imid, key,
				       key, 
				       dispid, imid, key)});
	    // add this line to the main html spec
	    html += `<p><div class='JS9FiltersLinegroup'>$${key}</div>`;
	}
	// add the noarg filters
	for(i=0; i<JS9.Filters.noargfilters.length; i++){
	    key = JS9.Filters.noargfilters[i];
	    mopts.push({name: key, 
			value: sprintf(JS9.Filters.noargfilterHTML,
				       key,
				       key,
				       dispid, imid, key,
				       key,
				       dispid, imid, key,
				       key, 
				       dispid, imid, key)});
	    // add this line to the main html spec
	    html += `<p><div class='JS9FiltersLinegroup'>$${key}</div>`;
	}
	// add undo to the main html spec
	html += `<p><div class='JS9FiltersLinegroup'>$undo</div>`;
	t = sprintf(JS9.Filters.undoHTML, dispid, imid);
	mopts.push({name: "undo", value: t});
	// expand macros to generate html
	s = im.expandMacro(html, mopts);
	this.lastimage = im;
    } else {
	s = "<p><center>Colormap parameters will appear here.</center>";
    }
    this.colormapsContainer.html(s);
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Filters.CLASS, JS9.Filters.NAME,
		   JS9.Filters.init,
		   {onplugindisplay: JS9.Filters.init,
		    onchangecontrastbias: JS9.Filters.reinit,
		    onsetpan: JS9.Filters.reinit,
		    onsetcolormap: JS9.Filters.reinit,
		    onimagedisplay: JS9.Filters.display,
		    onimageclose: JS9.Filters.close,
		    help: "help/filters.html",
		    winTitle: "Image Filters",
		    winDims: [JS9.Filters.WIDTH, JS9.Filters.HEIGHT]});
