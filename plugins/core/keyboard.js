/*
 * keyboard module (September 21, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, JS9, sprintf */

// create our namespace, and specify some meta-information and params
JS9.Keyboard = {};
JS9.Keyboard.CLASS = "JS9";         // class of plugin
JS9.Keyboard.NAME = "Keyboard";     // name of this plugin
JS9.Keyboard.WIDTH =  450;	    // width of light window
JS9.Keyboard.HEIGHT = 420;	    // height of light window
JS9.Keyboard.BASE = JS9.Keyboard.CLASS + JS9.Keyboard.NAME;

JS9.Keyboard.actionHTML="<div class='JS9KeyboardText'><button class='JS9Button JS9KeyboardButton' type='button' value='%s'>%s</button></div><div class='JS9KeyboardAction'>%s</div>";

// get an id based on the action
JS9.Keyboard.actionid = function(cname, aname){
    return (cname + "_" + aname).replace(/[^A-Za-z0-9_]/g, "_");
};

// add to the action list
JS9.Keyboard.addAction = function(container, cname, aname){
    var that = this;
    var s, id, divjq;
    id = JS9.Keyboard.actionid(cname, aname);
    // create the html for this action
    s = sprintf(JS9.Keyboard.actionHTML, aname, cname, aname);
    // add action html to the action container
    divjq = $("<div class='JS9KeyboardItem'>")
	.attr("id", id)
	.html(s)
	.appendTo(container);
    divjq.find('.JS9KeyboardButton').on("click", function(evt){
	var action = this.value;
	var im = that.display.image;
	if( im && action && JS9.Keyboard.Actions[action] ){
	    JS9.Keyboard.Actions[action](im, im.ipos, evt);
	}
    });
    return divjq;
};

// common code for arrow key processing
JS9.Keyboard.arrowKey = function(im, evt, inc, active){
    // change display and image position, redisplay magnifier
    im.pos.x += inc.x;
    im.pos.y += inc.y;
    im.ipos = im.displayToImagePos(im.pos);
    if( JS9.hasOwnProperty("MouseTouch") ){
	im.valpos = null;
	JS9.MouseTouch.Actions["display value/position"](im, im.ipos, evt);
    }
    if( JS9.hasOwnProperty("Magnifier") ){
	JS9.Magnifier.display(im, im.ipos);
    }
    if( JS9.hasOwnProperty("Crosshair") && !active ){
	if( !im.clickInRegion ){
	    im.tmp.arrowCrosshair = true;
	    im.tmp.arrowCrosshairVisible = true;
	    JS9.Crosshair.display(im, im.ipos, evt);
	    delete im.tmp.arrowCrosshair;
	}
    }
};

// ---------------------------------------------------------------------
//
// Keyboard.Actions: callbacks when on key press
//
// the keyboardActions array is in JS9.globalOpts determine
// the initial mapping of keyboard configuration to callback, e.g.:
//
//  JS9.globalOpts.keyboardActions = {'?': 'copy valpos to clipboard',
//                                     '/': 'copy wcs coords to clipboard',
//					...
//                                    };
//
// You can add your own to the Keyboard.Actions object and use them in the
// globalOpts.keyboardActions object
//
// ---------------------------------------------------------------------
JS9.Keyboard.Actions = {};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["open local file"] = function(im, ipos, evt){
    JS9.OpenFileMenu({display: evt.data});
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["close image"] = function(im, ipos, evt){
    if( im ){
	im.closeImage();
    }
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["copy wcs position to clipboard"] = function(im, ipos, evt){
    var s, arr, opts;
    // sanity check
    if( !im || !im.raw.wcs || !ipos ){
	return;
    }
    // get wcs coords of current position
    s = JS9.pix2wcs(im.raw.wcs, ipos.x, ipos.y).trim();
    if( JS9.globalOpts.copyWcsPosFormat ){
	arr = s.split(/\s+/);
	opts = [{name: "ra",  value: arr[0]},
		{name: "dec", value: arr[1]},
		{name: "sys", value: arr[2]}];
	s = im.expandMacro(JS9.globalOpts.copyWcsPosFormat, opts);
    }
    // copy to clipboard
    JS9.CopyToClipboard(s, im);
    return s;
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["copy physical position to clipboard"] = function(im, ipos, evt){
    var phys, s;
    // sanity check
    if( !im || !ipos ){
	return;
    }
    // get physical coords from image coords
    phys = im.imageToLogicalPos(ipos);
    s = sprintf("%f %f", phys.x, phys.y);
    // copy to clipboard
    JS9.CopyToClipboard(s, im);
    return s;
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["copy pixel value to clipboard"] = function(im, ipos, evt){
    var s, val, prec;
    // sanity check
    if( !im || !ipos ){
	return;
    }
    // value at current position
    val = im.raw.data[Math.floor(ipos.y-0.5) * im.raw.width +
		      Math.floor(ipos.x-0.5)];
    prec = JS9.floatPrecision(im.params.scalemin, im.params.scalemax);
    s = JS9.floatFormattedString(val, prec, 3);
    // copy to clipboard
    JS9.CopyToClipboard(s, im);
    return s;
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["copy value and position to clipboard"] = function(im, ipos, evt){
    var s, ovalpos;
    // sanity check
    if( !im || !ipos ){
	return;
    }
    // set valpos in case its turned off
    ovalpos = im.setParam("valpos", true);
    // get current valpos
    s = im.updateValpos(ipos, false);
    // restore original valpos
    im.setParam("valpos", ovalpos);
    // process valpos string
    if( s && s.vstr ){
	// reformat from html to text
	s = s.vstr.replace(/&nbsp;/g, " ");
    } else {
	// use blank space (otherwise, nothing is copied)
	s = " ";
    }
    // copy to clipboard
    JS9.CopyToClipboard(s, im);
    return s;
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["edit selected region"] = function(im, ipos, evt){
    var layer, target;
    // sanity check
    if( !im ){
	return;
    }
    layer = im.layers.regions;
    if( layer ){
	target = layer.canvas.getActiveObject();
	JS9.Regions.displayConfigForm.call(im, target);
    }
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["toggle selected region: source/background"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    return im.toggleRegionTags("selected", "source", "background");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["toggle selected region: include/exclude"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    return im.toggleRegionTags("selected", "include", "exclude");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["tag selected region as 'source'"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    return JS9.Keyboard.editregion(im, "source", "background");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["tag selected region as 'background'"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    return JS9.Keyboard.editregion(im, "background", "source");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["tag selected region as 'include'"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    return JS9.Keyboard.editregion(im, "include", "exclude");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["tag selected region as 'exclude'"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    return JS9.Keyboard.editregion(im, "exclude", "include");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["toggle full screen mode"] = function(im, ipos, evt){
    var display = evt.data;
    if( (display.width  === display.width0)  &&
	(display.height === display.height0) ){
	display.resize("full", {center: true});
    } else {
	display.resize("reset");
    }
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["reset zoom"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    im.setZoom("1");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["zoom in"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    im.setZoom("*2");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["zoom out"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    im.setZoom("/2");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["display next image"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    im.display.nextImage(1);
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["display previous image"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    im.display.nextImage(-1);
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["open a local FITS file"] = function(im, ipos, evt){
    // nb: evt.data is always the js9 display (so no image needed here)
    JS9.OpenFileMenu({display: evt.data});
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["save image as a FITS file"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    im.saveFITS();
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["save image as a PNG file"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    im.savePNG();
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["save regions as a text file"] = function(im, ipos, evt){
    // sanity check
    if( !im ){
	return;
    }
    im.saveRegions();
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["move region/position up"] = function(im, ipos, evt){
    var canvas, layerName, active;
    var inc = 1;
    evt.preventDefault();
    // sanity check
    if( !im ){ return; }
    if( JS9.specialKey(evt) ){ inc *= 5; }
    layerName = im.layer || "regions";
    canvas = im.display.layers[layerName].canvas;
    active = canvas.getActiveObject() || canvas.getActiveGroup();
    if( active ){
	im.changeShapes(layerName, "selected", {dy: inc});
    }
    JS9.Keyboard.arrowKey(im, evt, {x: 0, y: inc * -1}, active);
    canvas.fire("mouse:up");
};

JS9.Keyboard.Actions["move region/position down"] = function(im, ipos, evt){
    var canvas, layerName, active;
    var inc = -1;
    evt.preventDefault();
    // sanity check
    if( !im ){ return; }
    if( JS9.specialKey(evt) ){ inc *= 5; }
    layerName = im.layer || "regions";
    canvas = im.display.layers[layerName].canvas;
    active = canvas.getActiveObject() || canvas.getActiveGroup();
    if( active ){
	im.changeShapes(layerName, "selected", {dy: inc});
    }
    JS9.Keyboard.arrowKey(im, evt, {x: 0, y: inc * -1}, active);
    canvas.fire("mouse:up");
};

JS9.Keyboard.Actions["move region/position left"] = function(im, ipos, evt){
    var canvas, layerName, active;
    var inc = -1;
    evt.preventDefault();
    // sanity check
    if( !im ){ return; }
    if( JS9.specialKey(evt) ){ inc *= 5; }
    layerName = im.layer || "regions";
    canvas = im.display.layers[layerName].canvas;
    active = canvas.getActiveObject() || canvas.getActiveGroup();
    if( canvas.getActiveObject() || canvas.getActiveGroup() ){
	im.changeShapes(layerName, "selected", {dx: inc});
    }
    JS9.Keyboard.arrowKey(im, evt, {x: inc, y: 0}, active);
    canvas.fire("mouse:up");
};

JS9.Keyboard.Actions["move region/position right"] = function(im, ipos, evt){
    var canvas, layerName, active;
    var inc = 1;
    evt.preventDefault();
    // sanity check
    if( !im ){ return; }
    if( JS9.specialKey(evt) ){ inc *= 5; }
    layerName = im.layer || "regions";
    canvas = im.display.layers[layerName].canvas;
    active = canvas.getActiveObject() || canvas.getActiveGroup();
    if( canvas.getActiveObject() || canvas.getActiveGroup() ){
	im.changeShapes(layerName, "selected", {dx: inc});
    }
    JS9.Keyboard.arrowKey(im, evt, {x: inc, y: 0}, active);
    canvas.fire("mouse:up");
};
// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["remove selected region"] = function(im, ipos, evt){
    var canvas, layerName;
    evt.preventDefault();
    // sanity check
    if( !im ){ return; }
    layerName = im.layer || "regions";
    canvas = im.display.layers[layerName].canvas;
    im.removeShapes(layerName, "selected");
    im.display.clearMessage(layerName);
    canvas.fire("mouse:up");
};

JS9.Keyboard.Actions["raise region layer to top"] = function(im, ipos, evt){
    evt.preventDefault();
    // sanity check
    if( !im ){ return; }
    im.activeShapeLayer("regions");
};

JS9.Keyboard.Actions["toggle active shape layers"] = function(im, ipos, evt){
    evt.preventDefault();
    // sanity check
    if( !im ){ return; }
    im.toggleShapeLayers();
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["copy selected region to clipboard"] = function(im, ipos, evt){
    var s;
    // sanity check
    if( !im ){ return; }
    // get selected region(s)
    s = im.listRegions("selected", {mode: 1});
    // copy to clipboard
    JS9.CopyToClipboard(s, im);
    return s;
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["copy all regions to clipboard"] = function(im, ipos, evt){
    var s;
    // sanity check
    if( !im ){ return; }
    // get all regions
    s = im.listRegions("all", {mode: 1});
    // copy to clipboard
    JS9.CopyToClipboard(s, im);
    return s;
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["paste regions from local clipboard"] = function(im, ipos, evt){
    return JS9.Regions.pasteFromClipboard.call(im, false);
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["paste regions to current position"] = function(im, ipos, evt){
    return JS9.Regions.pasteFromClipboard.call(im, true);
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["select region"] = function(im, ipos, evt){
    var i, layer, canvas, obj, objs;
    // sanity check
    if( !im ){ return; }
    layer = im.layer || "regions";
    canvas = im.layers[layer].canvas;
    objs = canvas.getObjects();
    for(i=0; i<objs.length; i++){
	obj = objs[i];
	if( canvas.containsPoint(null, obj, im.pos) ){
	    canvas.setActiveObject(obj);
	    break;
	}
    }
};

JS9.Keyboard.Actions["refresh image"] = function(im, ipos, evt){
    // sanity check
    if( !im ){ return; }
    evt.preventDefault();
    im.refreshImage();
};

JS9.Keyboard.Actions["display full image"] = function(im, ipos, evt){
    // sanity check
    if( !im ){ return; }
    evt.preventDefault();
    im.displaySection("full");
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["toggle coordinate grid"] = function(im, ipos, evt){
    JS9.Grid.toggle(im);
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["toggle crosshair"] = function(im, ipos, evt){
    // sanity check
    if( !im ){ return; }
    evt.preventDefault();
    im.params.crosshair = !im.params.crosshair;
    if( !im.params.crosshair ){
	JS9.Crosshair.hide(im);
    }
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["toggle mouse/touch plugin"] = function(im, ipos, evt){
    if( im ){
	im.display.displayPlugin("JS9MouseTouch");
    }
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["toggle keyboard actions plugin"] = function(im, ipos, evt){
    if( im ){
	im.display.displayPlugin("JS9Keyboard");
    }
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["toggle preferences plugin"] = function(im, ipos, evt){
    if( im ){
	im.display.displayPlugin("JS9Preferences");
    }
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["toggle shape layers plugin"] = function(im, ipos, evt){
    if( im ){
	im.display.displayPlugin("JS9Layers");
    }
};

// get action associated with the current keyboard
JS9.Keyboard.getAction = function(im, evt){
    var action;
    var s = JS9.eventToCharStr(evt);
    // look for an action associated with this key
    if( s ){
	action = JS9.globalOpts.keyboardActions[s];
    }
    return action;
};

// execute the keyboard action routine
JS9.Keyboard.action = function(im, ipos, evt, action){
    action = action || JS9.Keyboard.getAction(im, evt);
    // call the keyboard action
    if( action && JS9.Keyboard.Actions[action] ){
	JS9.Keyboard.Actions[action](im, ipos, evt);
	// extended plugins
	if( im && JS9.globalOpts.extendedPlugins ){
	    im.xeqPlugins("keypress", "onkeyboardaction", evt);
	}
    }
};

JS9.Keyboard.editregion= function(im, xnew, xold){
    var i, j, s, tags;
    // get selected region
    s = im.getShapes("regions", "selected");
    if( s.length ){
	for(i=0; i<s.length; i++){
	    tags = s[i].tags;
	    for(j=0; j<tags.length; j++){
		if( tags[j] === xnew ){
		    // already have this tag
		    xnew = "";
		    break;
		}
		if( tags[j] === xold ){
		    // switch with "opposite" tag
		    tags[j] = xnew;
		    xnew = "";
		    break;
		}
	    }
	    // add new tag?
	    if( xnew ){
		tags.push(xnew);
	    }
	}
	im.changeShapes("regions", "selected", {tags: tags});
    }
};

// constructor: add HTML elements to the plugin
JS9.Keyboard.init = function(){
    var s, key;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold action container and header
    // clean main container
    this.divjq.html("");
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.keyboardContainer = $("<div>")
	.addClass(JS9.Keyboard.BASE + "Container")
	.attr("id", this.id + "KeyboardContainer")
	.appendTo(this.divjq);
    s = sprintf("<div class='%s'><b>Keys and their actions (or click the buttons):</b></div><p>", JS9.Keyboard.BASE + "Header");
    this.keyboardHeadContainer = $("<div>")
	.addClass(JS9.Keyboard.BASE + "Container")
	.attr("id", this.id + "KeyboardHeadContainer")
        .html(s)
	.appendTo(this.keyboardContainer);
    // container to hold keyboard actions
    this.keyboardActionContainer = $("<div>")
	.addClass(JS9.Keyboard.BASE + "ActionContainer")
	.attr("id", this.id + "ActionContainer")
        .html("")
	.appendTo(this.keyboardContainer);
    // add actions
    for(key in JS9.globalOpts.keyboardActions ){
	if( JS9.globalOpts.keyboardActions.hasOwnProperty(key) ){
	    s = JS9.globalOpts.keyboardActions[key];
	    JS9.Keyboard.addAction.call(this, this.keyboardActionContainer,
					key, s);
	}
    }
 };

JS9.RegisterPlugin(JS9.Keyboard.CLASS, JS9.Keyboard.NAME,
		   JS9.Keyboard.init,
		   {menuItem: "Keyboard Actions",
		    onplugindisplay: JS9.Keyboard.init,
		    help: "help/keyboard.html",
		    winTitle: "Keyboard Actions",
		    winResize: true,
		    winDims: [JS9.Keyboard.WIDTH,JS9.Keyboard.HEIGHT]});
