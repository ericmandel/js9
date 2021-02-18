/*
 * color controls plugin (March 18, 2020)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Color = {};
JS9.Color.CLASS = "JS9";      // class of plugins
JS9.Color.NAME = "Color";     // name of this plugin
JS9.Color.WIDTH = 512;        // width of light window
JS9.Color.HEIGHT = 140;       // height of light window
JS9.Color.BASE = JS9.Color.CLASS + JS9.Color.NAME;
JS9.Color.RUNMENU = true;     // does changing the menu execute run?

JS9.Color.colorHTML=`<p><div class='JS9ColorLinegroup'>$cmaps1&nbsp;&nbsp;$cmaps2&nbsp;&nbsp;$cmaps&nbsp;&nbsp;$filters</div>
<p>
<div class='JS9ColorLinegroup'>$conbibtn&nbsp;&nbsp;$contrast&nbsp;&nbsp;$bias</div>
<p>
<div class='JS9ColorLinegroup'>$run&nbsp;&nbsp;$opacity&nbsp;&nbsp;$from&nbsp;&nbsp;$opfloor&nbsp;&nbsp;$opopacity&nbsp;&nbsp;$opoverlay&nbsp;&nbsp;$opmask</div>`
;

JS9.Color.cmaps1HTML = '<select class="JS9Select JS9Cmaps1 JS9ColorSelect JS9ColorCol1" name="cmaps1" onchange="JS9.Color.xsetcolor(\'%s\', \'%s\', \'top\', this)">%s</select>';

JS9.Color.cmaps2HTML = '<select class="JS9Select JS9Cmaps2 JS9ColorSelect JS9ColorCol2" name="cmaps2" onchange="JS9.Color.xsetcolor(\'%s\', \'%s\', \'other\', this)">%s</select>';

JS9.Color.cmapsHTML = '<input type="button" class="JS9Button2 JS9ColorCmaps JS9ColorButton JS9ColorCol3" name="cmaps" value="Create cmaps" onclick="javascript:JS9.DisplayPlugin(\'JS9Cmaps\', {\'display\': \'%s\'})">';

JS9.Color.filtersHTML = '<input type="button" class="JS9Button2 JS9ColorFilters JS9ColorButton JS9ColorCol4" name="filters" value="Image filters" onclick="javascript:JS9.DisplayPlugin(\'JS9Filters\', {\'display\': \'%s\'})">';

JS9.Color.conbibtnHTML = '<input type="button" class="JS9Button2 JS9ColorConBiBtn JS9ColorButton JS9ColorCol1" name="conbibtn" value="Contrast/bias &rarr;" onclick="javascript:JS9.Color.xconbi(\'%s\', \'%s\', this)">';

JS9.Color.contrastHTML = '<input type="text" class="JS9ColorContrast JS9ColorInput JS9ColorCol2 js9Input" name="contrast" value="%s" autocapitalize="off" autocorrect="off" placeholder="contrast">';

JS9.Color.biasHTML = '<input type="text" class="JS9ColorBias JS9ColorInput JS9ColorCol3 js9Input" name="bias" value="%s" autocapitalize="off" autocorrect="off" placeholder="bias">';

JS9.Color.runHTML = '<input type="button" class="JS9Button2 JS9ColorRun JS9ColorButton JS9ColorCol1" name="run" value="Opacity &rarr;" onclick="javascript:JS9.Color.xopacity(\'%s\', \'%s\', this)">';

JS9.Color.opacityHTML = '<input type="text" class="JS9ColorOpacity JS9ColorInput JS9ColorCol2 js9Input" name="opacity" value="" autocapitalize="off" autocorrect="off">';

JS9.Color.fromHTML = '<select class="JS9Select JS9ColorFrom JS9ColorSelect JS9ColorCol3" name="from" onchange="JS9.Color.xfrom(\'%s\', \'%s\', this)">%s</select>';

JS9.Color.opfloorHTML = '<input type="text" class="JS9ColorOpFloor JS9ColorInput JS9ColorCol4 js9Input" name="opfloor" value="%s" autocapitalize="off" autocorrect="off">';

JS9.Color.opopacityHTML = '<select class="JS9Select JS9ColorOpOpacity JS9ColorSelect JS9ColorCol4" name="opopacity" onchange="JS9.Color.xsetfile(\'%s\', \'%s\', \'opacity\', this)">%s</select>';

JS9.Color.opoverlayHTML = '<select class="JS9Select JS9ColorOpOverlay JS9ColorSelect JS9ColorCol4" name="opoverlay" onchange="JS9.Color.xsetfile(\'%s\', \'%s\', \'overlay\', this)">%s</select>';

JS9.Color.opmaskHTML = '<select class="JS9Select JS9ColorOpMask JS9ColorSelect JS9ColorCol4" name="opmask" onchange="JS9.Color.xsetfile(\'%s\', \'%s\', \'mask\', this)">%s</select>';

JS9.Color.fmt = function(val, n){
    val = val + 0.5 * Math.pow(10,-(n+1));
    return val.toFixed(n);
};

// change color via menu
JS9.Color.xsetcolor = function(did, id, which, target){
    const im = JS9.lookupImage(id, did);
    if( im ){
	if( typeof target === "object" ){
	    im.setColormap(target.value);
	}
	switch(which){
	case "top":
	    if( typeof target === "string" ){
		$(".JS9Cmaps1 option").filter(function(){
		    return $(this).text().trim() === target;
		}).prop("selected", true);
	    }
	    $(".JS9Cmaps2").prop("selectedIndex", 0);
	    break;
	case "other":
	    if( typeof target === "string" ){
		$(".JS9Cmaps2 option").filter(function(){
		    return $(this).text().trim() === target;
		}).prop("selected", true);
	    }
	    $(".JS9Cmaps1").prop("selectedIndex", 0);
	    break;
	default:
	    break;
	}
    }
};

// set contrast and bias
JS9.Color.xconbi = function(did, id, target){
    let s1, s2, pel;
    const im = JS9.lookupImage(id, did);
    if( im ){
	pel = $(target).parent();
	s1 = pel.find("[name='contrast']").val();
	s2 = pel.find("[name='bias']").val();
	if( JS9.isNumber(s1) && JS9.isNumber(s2) ){
	    im.setColormap(parseFloat(s1), parseFloat(s2));
	}
    }
};

// set global opacity
JS9.Color.xopacity = function(did, id, target){
    let s1, s2, obj, plugin;
    const pel = $(target).parent();
    const from = pel.find("[name='from']").val();
    const im = JS9.lookupImage(id, did);
    if( im ){
	plugin = im.display.pluginInstances.JS9Color;
	switch(from){
	case "floor":
	    if( plugin.lastfrom.match(/mask|global/) ){
		s1 = String(im.params.flooropacity);
	    } else {
		s1 = pel.find("[name='opacity']").val();
		if( s1 === undefined ){
		    s1 = String(im.params.flooropacity);
		}
	    }
	    s2 = pel.find("[name='opfloor']").val();
	    if( s1.match(/resetall/) ){
		im.setOpacity("resetall");
	    } else if( !s1 || s1.match(/reset/) ){
		im.setOpacity("resetfloor");
	    } else if( JS9.isNumber(s1) && JS9.isNumber(s2) ){
		im.setOpacity(parseFloat(s2), parseFloat(s1));
	    }
	    break;
	case "opacity":
	case "overlay":
	case "mask":
	    s1 = pel.find(`[name='op${from}']`).val();
	    if( s1 !== "none" ){
		obj = {mode: from};
		if( from === "mask" ){
		    if( plugin.lastfrom.match(/floor|global/) ){
			s2 = String(im.mask.vopacity || 0);
		    } else {
			s2 = pel.find("[name='opacity']").val();
			if( s2 === undefined ){
			    s2 = String(im.mask.vopacity || 0);
			}
		    }
		    if( s1 && JS9.isNumber(s2) ){
			obj.opacity = parseFloat(s2);
		    }
		}
		im.maskImage(s1, obj);
	    }
	    break;
	case "global":
	default:
	    if( plugin.lastfrom.match(/floor|mask/) ){
		s1 = String(im.getOpacity().opacity);
	    } else {
		s1 = pel.find("[name='opacity']").val();
		if( s1 === undefined ){
		    s1 = String(im.getOpacity().opacity);
		}
	    }
	    if( s1.match(/resetall/) ){
		im.setOpacity("resetall");
	    } else if( !s1 || s1.match(/reset/) ){
		im.setOpacity("reset");
	    } else if( JS9.isNumber(s1) ){
		im.setOpacity(parseFloat(s1));
	    }
	    break;
	}
	JS9.Color.refrom.call(plugin, im);
	JS9.Color.reopacity.call(plugin, im);
    }
};

// set where we are getting opacity from
JS9.Color.xfrom = function(did, id, target){
    let plugin;
    const pel = $(target).parent();
    const from = target.value;
    const im = JS9.lookupImage(id, did);
    if( im ){
	plugin = im.display.pluginInstances.JS9Color;
	JS9.Color.refrom.call(plugin, im);
	JS9.Color.reopacity.call(plugin, im);
	if( plugin.runmenu ){
	    // as if we clicked run
	    pel.find("[name='run']").click();
	}
	plugin.lastfrom = from;
    }
};

JS9.Color.xsetfile = function(did, id, mode, target){
    let obj, s;
    const pel = $(target).parent();
    const im = JS9.lookupImage(id, did);
    if( im ){
	if( target.value === "none" ){
	    im.maskImage(false);
	} else {
	    obj = {mode: mode};
	    switch(mode){
	    case "mask":
		s = pel.find("[name='opacity']").val();
		if( JS9.isNumber(s) ){
		    obj.opacity = parseFloat(s);
		}
		break;
	    default:
		break;
	    }
	    im.maskImage(target.value, obj);
	}
    }
};

// when contrast/bias changes
JS9.Color.reconbi = function(){
    let obj;
    const pel = this.colorContainer;
    if( this.display.image ){
	obj = this.display.image.getColormap();
	pel.find("[name='contrast']").val(JS9.Color.fmt(obj.contrast, 4));
	pel.find("[name='bias']").val(JS9.Color.fmt(obj.bias, 4));
    }
};

// display elemements based on current from value
JS9.Color.refrom = function(im){
    let from;
    const pel = this.colorContainer;
    from = pel.find("[name='from']").val() || "global";
    im = im || this.display.image;
    if( im ){
	switch(from){
	case "global":
	    pel.find(".JS9ColorOpacity").css("display", "block")
		.attr("placeholder", "global opacity");
	    pel.find(".JS9ColorOpFloor").css("display", "none");
	    pel.find(".JS9ColorOpOpacity").css("display", "none");
	    pel.find(".JS9ColorOpOverlay").css("display", "none");
	    pel.find(".JS9ColorOpMask").css("display", "none");
	    break;
	case "floor":
	    pel.find(".JS9ColorOpacity").css("display", "block")
		.attr("placeholder", "floor opacity");
	    pel.find(".JS9ColorOpFloor").css("display", "block")
		.attr("placeholder", "floor value");
	    pel.find(".JS9ColorOpOpacity").css("display", "none");
	    pel.find(".JS9ColorOpOverlay").css("display", "none");
	    pel.find(".JS9ColorOpMask").css("display", "none");
	    break;
	case "opacity":
	    pel.find(".JS9ColorOpacity").css("display", "none");
	    pel.find(".JS9ColorOpFloor").css("display", "none");
	    pel.find(".JS9ColorOpOpacity").css("display", "block");
	    pel.find(".JS9ColorOpOverlay").css("display", "none");
	    pel.find(".JS9ColorOpMask").css("display", "none");
	    break;
	case "overlay":
	    pel.find(".JS9ColorOpacity").css("display", "none");
	    pel.find(".JS9ColorOpFloor").css("display", "none");
	    pel.find(".JS9ColorOpOpacity").css("display", "none");
	    pel.find(".JS9ColorOpOverlay").css("display", "block");
	    pel.find(".JS9ColorOpMask").css("display", "none");
	    break;
	case "mask":
	    pel.find(".JS9ColorOpacity").css("display", "block")
		.attr("placeholder", "non-mask opacity");
	    pel.find(".JS9ColorOpFloor").css("display", "none");
	    pel.find(".JS9ColorOpOpacity").css("display", "none");
	    pel.find(".JS9ColorOpOverlay").css("display", "none");
	    pel.find(".JS9ColorOpMask").css("display", "block");
	    break;
	default:
	    break;
	}
    }
};

// redisplay opacity value
JS9.Color.reopacity = function(im){
    let from, obj, opacity, value;
    const pel = this.colorContainer;
    from = pel.find("[name='from']").val() || "global";
    im = im || this.display.image;
    if( im ){
	switch(from){
	case "floor":
	    obj = im.getOpacity();
	    opacity = obj.flooropacity;
	    value = obj.floorvalue;
	    if( value ){
		value = JS9.Color.fmt(value, 4);
	    }
	    pel.find("[name='opfloor']").val(value);
	    break;
	case "opacity":
	case "overlay":
	    opacity = "";
	    return;
	case "mask":
	    opacity = im.mask.vopacity || 0;
	    break;
	case "global":
	default:
	    opacity = im.getOpacity().opacity;
	    break;
	}
	if( typeof opacity === "number" ){
	    opacity = JS9.Color.fmt(opacity, 4);
	}
	pel.find("[name='opacity']").val(opacity);
    }
};

// re-init when a different image is displayed
JS9.Color.display = function(){
    let plugin;
    let im = this.display.image;
    if( im && (im === this.lastimage) ){
	plugin = im.display.pluginInstances.JS9Color;
	JS9.Color.refrom.call(plugin, im);
	JS9.Color.reopacity.call(plugin, im);
    } else {
	JS9.Color.init.call(this);
    }
};

// clear when an image closes
JS9.Color.close = function(){
    JS9.Color.init.call(this, {mode: "clear"});
};

// constructor: add HTML elements to the plugin
JS9.Color.init = function(opts){
    let s, t, im, mopts, imid, dispid, obj, cmap, which;
    const getCmaps1Options = () => {
	let i, name;
	let res = "<option selected disabled>Top cmaps</option>";
	for(i=0; i<JS9.globalOpts.topColormaps.length; i++){
	    name = JS9.globalOpts.topColormaps[i];
	    res += `<option>${name}</option>`;
	}
	return res;
    };
    const getCmaps2Options = () => {
	let i, name;
	let res = "<option selected disabled>Other cmaps</option>";
	for(i=0; i<JS9.colormaps.length; i++){
	    name = JS9.colormaps[i].name;
	    if( !JS9.globalOpts.topColormaps.includes(name) ){
		res += `<option>${name}</option>`;
	    }
	}
	return res;
    };
    const getFromOptions = (im) => {
	let res;
	let filesel = "";
	let masksel = "";
	let overlaysel = "";
	let floorsel = "";
	let globsel = "";
	if( im && im.mask.active && im.mask.im ){
	    switch(im.mask.mode){
	    case "mask":
		masksel = "selected";
		break;
	    case "opacity":
		filesel = "selected";
		break;
	    case "overlay":
		overlaysel = "selected";
		break;
	    }
	} else if( im && im.params.flooropacity !== undefined  ){
	    floorsel = "selected";
	} else {
	    globsel = "selected";
	}
	res = `<option disabled>mode:</option>
	       <option value="global" ${globsel}>default</option>
	       <option value="floor" ${floorsel}>floor &le;&nbsp;&nbsp;&rarr;</option>
	       <option value="mask" ${masksel}>mask &rarr;</option>
	       <option value="opacity" ${filesel}>opacity &rarr;</option>
	       <option value="overlay" ${overlaysel}>overlay &rarr;</option>`;
	return res;
    };
    const getFloorOptions = (im) => {
	let s = "";
	if( im ){
	    s = im.params.floorvalue || "";
	}
	return s;
    };
    const getFileOptions = (im, mode) => {
	let i, res, tim, sel;
	res = `<option selected disabled>${mode} files</option>
	       <option value="none" selected>none</option>`;
	for(i=0; i<JS9.images.length; i++){
	    tim = JS9.images[i];
	    if( tim === im ){
		continue;
	    }
	    // mask must be the same size as the image
	    if( tim.raw.width  !== im.raw.width  ||
		tim.raw.height !== im.raw.height ){
		continue;
	    }
	    if( im.mask.active && im.mask.im === tim ){
		sel = "selected";
	    } else {
		sel = "";
	    }
	    res += `<option value="${tim.id}" ${sel}>${tim.id}</option>`;
	}
	return res;
    };
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
	this.width  = JS9.Color.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.Color.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // does changing the menu execute run?
    this.runmenu = this.divjq.attr("data-runmenu");
    if( this.runmenu === undefined ){
	this.runmenu = JS9.Color.RUNMENU;
    }
    // haven't used the from menu yet
    this.lastfrom = "";
    // clear out html
    this.divjq.html("");
    // set up new html
    this.colorContainer = $("<div>")
	.addClass(`${JS9.Color.BASE}Container`)
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
	t = sprintf(JS9.Color.cmaps1HTML, dispid, imid, getCmaps1Options());
	mopts.push({name: "cmaps1", value: t});
	t = sprintf(JS9.Color.cmaps2HTML, dispid, imid, getCmaps2Options());
	mopts.push({name: "cmaps2", value: t});
	t = sprintf(JS9.Color.cmapsHTML, dispid);
	mopts.push({name: "cmaps", value: t});
	t = sprintf(JS9.Color.filtersHTML, dispid);
	mopts.push({name: "filters", value: t});

	t = sprintf(JS9.Color.conbibtnHTML, dispid, imid);
	mopts.push({name: "conbibtn", value: t});
	t = sprintf(JS9.Color.contrastHTML, im.getColormap().contrast);
	mopts.push({name: "contrast", value: t});
	t = sprintf(JS9.Color.biasHTML, im.getColormap().bias);
	mopts.push({name: "bias", value: t});

	t = sprintf(JS9.Color.runHTML, dispid, imid);
	mopts.push({name: "run", value: t});
	t = sprintf(JS9.Color.opacityHTML);
	mopts.push({name: "opacity", value: t});
	t = sprintf(JS9.Color.fromHTML, dispid, imid, getFromOptions(im));
	mopts.push({name: "from", value: t});

	t = sprintf(JS9.Color.opfloorHTML, getFloorOptions(im));
	mopts.push({name: "opfloor", value: t});

	t = sprintf(JS9.Color.opopacityHTML, dispid, imid, getFileOptions(im, "opacity"));
	mopts.push({name: "opopacity", value: t});
	t = sprintf(JS9.Color.opoverlayHTML, dispid, imid, getFileOptions(im, "overlay"));
	mopts.push({name: "opoverlay", value: t});
	t = sprintf(JS9.Color.opmaskHTML, dispid, imid, getFileOptions(im, "mask"));
	mopts.push({name: "opmask", value: t});

	s = im.expandMacro(JS9.Color.colorHTML, mopts);
	this.lastimage = im;
    } else {
	s = "<p><center>Color parameters will appear here.</center>";
    }
    this.colorContainer.html(s);
    if( im ){
	// init run on cr, if necessary
	if( JS9.globalOpts.runOnCR ){
	    this.colorContainer.find("[name='contrast']")
		.data("enterfunc", "conbibtn");
	    this.colorContainer.find("[name='bias']")
		.data("enterfunc", "conbibtn");
	    this.colorContainer.find("[name='opacity']")
		.data("enterfunc", "run");
	    this.colorContainer.find("[name='opfloor']")
		.data("enterfunc", "run");
	}
	JS9.Color.reopacity.call(this, im);
	JS9.Color.refrom.call(this, im);
	// init the appropriate menu with the current colormap
	obj = im.getColormap();
	cmap = obj.colormap;
	which = JS9.globalOpts.topColormaps.includes(cmap) ? "top" : "other";
	JS9.Color.xsetcolor(im.display.id, im.id, which, cmap);
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Color.CLASS, JS9.Color.NAME,
		   JS9.Color.init,
		   {menu: "color",
		    menuItem: "Color Controls ...",
		    onplugindisplay: JS9.Color.init,
		    onsetcolormap: JS9.Color.init,
		    onchangecontrastbias: JS9.Color.reconbi,
		    onsetopacity: JS9.Color.reopacity,
		    onimagedisplay: JS9.Color.display,
		    onimageclose: JS9.Color.close,
		    help: "help/colorcontrols.html",
		    winTitle: "Color Controls",
		    winDims: [JS9.Color.WIDTH, JS9.Color.HEIGHT]});
