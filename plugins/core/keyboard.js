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
JS9.Keyboard.Actions["copy wcs position to clipboard"] = function(im, ipos, evt){
    var s;
    // sanity check
    if( !im || !im.raw.wcs ){
	return;
    }
    // get wcs coords of current position
    s = JS9.pix2wcs(im.raw.wcs, ipos.x, ipos.y).trim();
    // copy to clipboard
    JS9.CopyToClipboard(s);
    return s;
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["copy physical position to clipboard"] = function(im, ipos, evt){
    var phys, s;
    // sanity check
    if( !im ){
	return;
    }
    // get physical coords from image coords
    phys = im.imageToLogicalPos(ipos);
    s = sprintf("%f %f", phys.x, phys.y);
    // copy to clipboard
    JS9.CopyToClipboard(s);
    return s;
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["copy pixel value to clipboard"] = function(im, ipos, evt){
    var s, val, prec;
    // sanity check
    if( !im ){
	return;
    }
    // value at current position
    val = im.raw.data[Math.floor(ipos.y-0.5) * im.raw.width +
		      Math.floor(ipos.x-0.5)];
    prec = JS9.floatPrecision(im.params.scalemin, im.params.scalemax);
    s = JS9.floatFormattedString(val, prec, 3);
    // copy to clipboard
    JS9.CopyToClipboard(s);
    return s;
};

// eslint-disable-next-line no-unused-vars
JS9.Keyboard.Actions["copy value and position to clipboard"] = function(im, ipos, evt){
    var s;
    // sanity check
    if( !im ){
	return;
    }
    // get current valpos and reformat
    s = im.updateValpos(im.ipos, false).vstr.replace(/&nbsp;/g, " ");
    // copy to clipboard
    JS9.CopyToClipboard(s);
    return s;
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

// get action associated with the current keyboard
JS9.Keyboard.getAction = function(im, evt){
    var action;
    var d = evt.data;
    var s = JS9.eventToCharStr(evt);
    // look for an action associated with this key
    if( s ){
	action = d.keyboardActions[s];
    }
    return action;
};

// execute the keyboard action routine
JS9.Keyboard.action = function(im, ipos, evt, action){
    action = action || JS9.Keyboard.getAction(im, evt);
    // call the keyboard action
    if( action && JS9.Keyboard.Actions[action] ){
	JS9.Keyboard.Actions[action](im, ipos, evt);
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
    for(key in this.display.keyboardActions ){
	if( this.display.keyboardActions.hasOwnProperty(key) ){
	    s = this.display.keyboardActions[key];
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
