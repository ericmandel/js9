/*
 * Info plugin
 */

/*global $, JS9, jQuery, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Info = {};
JS9.Info.CLASS = "JS9";
JS9.Info.NAME = "Info";
JS9.Info.WIDTH = 325;	// width of js9Info box
JS9.Info.HEIGHT = 250;	// height of js9Info box
JS9.Info.REGHEIGHT = 75;// extra height for region display

JS9.Info.opts = {
    // info url
    infoURL: "./params/info.html",
    infoObj: {
	file: '<tr><td><input type="text" class="column0" value="file" readonly="readonly"></td><td colspan="2"><input type="text" name="id" class="input2" value="" readonly="readonly" onclick="this.scrollLeft=this.scrollWidth;"></td></tr>',
	object: '<tr><td><input type="text" class="column0" value="object" readonly="readonly"></td><td colspan="2"><input type="text" name="object" class="input2" value="" readonly="readonly"></td></tr>',
	wcscen: '<tr><td><input type="text" class="column0" value="center" readonly="readonly"></td><td colspan="2"><input type="text" name="wcscen" class="input2" value="" readonly="readonly"></td></tr>',
	wcsfov: '<tr><td><input type="text" class="column0" value="fov" readonly="readonly"></td><td colspan="2"><input type="text" name="wcsfovpix" class="input2" value="" readonly="readonly"></td></tr>',
	value: '<tr><td><input type="text" class="column0" value="value" readonly="readonly"></td><td colspan="2"><input type="text" name="val" class="input2" value="" readonly="readonly"></td></tr>',
	impos: '<tr><td><input type="text" class="column0" value="image" readonly="readonly"></td><td colspan="2"><input type="text" name="ipos" class="input2" value="" readonly="readonly"></td></tr>',
	disppos: '<tr><td><input type="text" class="column0" value="display" readonly="readonly"></td><td colspan="2"><input type="text" name="dpos" class="input2" value="" readonly="readonly"></td></tr>',
	physpos: '<tr><td><input type="text" class="column0" value="physical" readonly="readonly"></td><td colspan="2"><input type="text" name="ppos" class="input2" value="" readonly="readonly"></td></tr>',
	wcspos: '<tr><td><input type="text" class="column0" value="wcs" name="wcssys" readonly="readonly"></td><td colspan="2"><input type="text" name="wcspos" class="input2" value="" readonly="readonly"></td></tr>',
	 regions: '<tr><td><input type="text" class="column0" value="regions" readonly="readonly"></td><td colspan="2"><textarea class="text2" name="regions" rows="4" value="" readonly="readonly"></textarea></td></tr>',
	 progress: '<tr><td colspan="2"><div class="JS9Progress"><progress name="progress" class="JS9ProgressBar" value="0" max="100"></progress></div></td></tr>'
    }
};

// init plugin
JS9.Info.init = function(){
    let i, key, opts, obj, infoHTML;
    // only init if we are displaying a new image
    // i.e., avoid re-init when changing contrast/bias
    if( this.display.image && this.display.image === this.lastimage ){
	switch(this.display.image.callingPlugin){
	case "onplugindisplay":
	case "onimagerefresh":
	case "onupdateprefs":
	    break;
	default:
	    return;
	}
    }
    // generate the web page
    opts = JS9.globalOpts.infoBox;
    obj = JS9.Info.opts.infoObj;
    infoHTML = '<table name="info" class="js9InfoTable">';
    for(i=0; i<opts.length; i++){
	key = opts[i];
	// aesthetic condideration: skip wcs display if we have no wcs
	if( key.match(/^wcs/)            &&
	    JS9.globalOpts.infoBoxResize &&
	    this.display.image && !(this.display.image.raw.wcs>0) ){
	    continue;
	}
	if( key.match(/^regions/)                       &&
	    JS9.globalOpts.regDisplay === "lightwin" ){
	    continue;
	}
	// add html for this line of the display
	if( key in obj ){
	    infoHTML += obj[key];
	}
    }
    infoHTML += '</table>';
    // reset previous
    if( this.infoConjq ){
	this.infoConjq.html("");
    }
    // set width and height on div
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = JS9.Info.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height = JS9.Info.HEIGHT;
	if( JS9.globalOpts.regDisplay !== "lightwin" ){
	    this.height += JS9.Info.REGHEIGHT;
	}
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // add container to the high-level div
    this.infoConjq = $("<div>")
	.addClass("JS9Container")
	.append(infoHTML)
	.appendTo(this.divjq);
    // save the jquery element for later processing
    this.jq = this.infoConjq.find("[name='info']");
};

// display a message on the image canvas or info plugin
// call with display as context
JS9.Info.display = function(type, message, target, force){
    let s, t, v;
    let tobj, split, area, tokens, rexp, color, info, key, el, jel, rid, im;
    let disp = this;
    // backward compatibility -- allow context to be Image
    if( this.display ){
	disp = this.display;
    }
    im = disp.image;
    // if image is context
    if( disp.pluginInstances ){
	info = disp.pluginInstances.JS9Info;
    }
    // where are we displaying?
    if( info && info.status === "active" && (!target || !force) ){
	// if info plugin is active, use it
	tobj = info;
    } else if( target ){
	// if specific info target was specified, use it
	if( target === disp ){
	    // passed disp in as a target
	    tobj = disp;
	    target = null;
	} else if( target instanceof jQuery ){
	    tobj = target;
	} else if( typeof target === "object" ){
	    tobj = $(target);
	} else {
	    tobj = $(`#${target}`);
	}
	if( !tobj.length ){
	    // fallback if the target element does not exist
	    tobj = disp;
	    target = null;
	}
	this.lasttarget = target;
    } else {
	// use image context
	tobj = disp;
	this.lasttarget = disp;
    }
    // handle progress specially
    if( type === "progress" ){
	if( tobj === info ){
	    el = info.jq;
	} else {
	    el = tobj.divjq;
	}
	if( el.length > 0 ){
	    el = el.find("[name='progress']");
	    switch(typeof message){
	    case "string":
	    case "boolean":
		if( message ){
		    if( message === "indeterminate" ){
			el.removeAttr("value");
		    }
		    el.parent().css("display", "inline-block");
		} else {
		    el.parent().css("display", "none");
		    el.attr("value", 0);
		}
		break;
	    case "object":
		if( message[1] ){
		    el.attr("max", message[1]);
		}
		el.attr("value", message[0]);
		break;
	    }
	}
	return;
    }
    // plugin-based display: fill in html form
    // (except if this is regions info and we are displaying in a lightwin)
    if( tobj === info &&
	(type !== "regions" || JS9.globalOpts.regDisplay !== "lightwin") ){
	switch( typeof message ){
	case "string":
	    jel = info.jq.find(`[name='${type}']`);
	    if( jel.length > 0 ){
		jel.val(message);
	    } else {
		// fallback to image display, if necessary
		if( JS9.globalOpts.fallbackDisplay ){
		    tobj = disp;
		}
	    }
	    break;
	case "object":
	    // process all key in the object
	    for( key in message ){
		if( Object.prototype.hasOwnProperty.call(message, key) ){
		    // set value, if possible
		    jel = info.jq.find(`[name='${key}']`);
		    if( jel.length > 0 ){
			// key-specific processing
			switch(key){
			case "val":
			    v = message.val3;
			    break;
			default:
			    v = message[key];
			    break;
			}
			// set the value
			jel.val(v);
		    }
		}
	    }
	    break;
	}
	// return if we did not change the target object
	if( tobj !== disp ){
	    return disp;
	}
    }
    // display-based message
    switch(type){
    case "regions":
	// display regions in a light window?
	if( JS9.globalOpts.regDisplay === "lightwin" ){
	    rid = `${disp.id}_regions`;
	    el = $(`#${rid}`);
	    // does window exist (and is not closed)?
	    if( el.length && !el[0].isClosed ){
		// found the window: fill the message area
		area = el.find(".JS9Message");
	    } else if( message ) {
		// start a light window and recurse to display the message
		$(JS9.lightOpts[JS9.LIGHTWIN].topid).arrive(`#${rid}`,
	        { fireOnAttributesModification: true },
	        () => {
		    JS9.Info.display.call(this, type, message, target, force);
		});
		t = "Regions";
		if( im ){
		    t += `: ${im.id}`;
		}
		t += " ";
		t += sprintf(JS9.IDFMT, this.id);
		JS9.lightWin(rid, "inline", "<div class='JS9Message'></div>",
			     t, JS9.lightOpts[JS9.LIGHTWIN].regWin0);
		return;
	    } else {
		// don't bring up a light window just to clear it!
		return;
	    }
	} else if( target ){
	    area = tobj;
	} else {
	    area = tobj.regionsArea;
	    tobj.infoheight = tobj.infoArea.height() + 4;
	    tobj.regheight = Math.max(tobj.infoheight * 2 + 10,
			 tobj.infoheight + tobj.regionsArea.height() + 10);
	    if( !disp.image || (disp.image.iy > tobj.regheight) ){
		color = JS9.textColorOpts.inimage;
	    } else {
		color = JS9.textColorOpts.regions;
	    }
	}
	split = ";";
	break;
    case "info":
    default:
	if( target ){
	    area = tobj;
	} else {
	    area = tobj.infoArea;
	    tobj.infoheight = tobj.infoArea.height() + 4;
	    if( !disp.image || (disp.image.iy > tobj.infoheight) ){
		color = JS9.textColorOpts.inimage;
	    } else {
		color = JS9.textColorOpts.info;
	    }
	    split = "";
	}
	break;
    }
    // massage the message before display, if necessary
    switch( typeof message ){
    case "string":
	s = message;
	break;
    case "object":
	key = `vstr${JS9.globalOpts.valposWidth}`;
	s = message[key] || message.vstrmedium || message.vstr || "";
	break;
    }
    if( split !== "" ){
	tokens = s.split(split);
	if( tokens.length > 2 ){
	    rexp = new RegExp(split, "g");
	    s = s.replace(rexp, "<br>");
	}
    }
    // set the color
    if( color ){
	area.css("color", color);
    }
    // display the message
    area.html(s);
    // allow chaining
    return disp;
};
JS9.Display.prototype.displayMessage = JS9.Info.display;
// backwards compatibility
JS9.Image.prototype.displayMessage = JS9.Info.display;

// clear an info message
JS9.Info.clear = function(which){
    let disp = this;
    // backward compatibility -- allow context to be Image
    if( this.display ){
	disp = this.display;
    }
    if( which ){
	disp.displayMessage(which, "");
    } else {
	disp.displayMessage("info", "");
	disp.displayMessage("regions", "");
	disp.displayMessage("progress", false);
    }
    // allow chaining
    return disp;
};
JS9.Display.prototype.clearMessage = JS9.Info.clear;
// backwards compatibility
JS9.Image.prototype.clearMessage = JS9.Info.clear;

// when a plugin window is brought up:
// save valpos and set to true
JS9.Info.pluginDisplay = function(im){
    let disp;
    if( im && im.display ){
	if( im.tmp ){
	    im.tmp.info_ovalpos = im.params.valpos;
	}
	im.params.valpos = true;
	// clear previous, if necessary
	if( this.display.lasttarget ){
	    disp = this.display;
	    disp.displayMessage("info", "", disp.lasttarget, true);
	    disp.displayMessage("regions", "", disp.lasttarget, true);
	    disp.displayMessage("progress", false, disp.lasttarget, true);
	    delete disp.lasttarget;
	}
    }
};

// when a plugin window is closed, reset valpos to previous
JS9.Info.pluginClose = function(im){
    if( im && im.display ){
	if( im.tmp && (im.tmp.info_ovalpos !== undefined) ){
	    im.params.valpos = im.tmp.info_ovalpos;
	}
    }
};

// having added the prototype displayMessage, we can define a public routine
JS9.mkPublic("DisplayMessage", function(...args){
    let got, type, message, target;
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.display);
    if( !display ){
	JS9.error("invalid display for display message");
    }
    type = obj.argv[0];
    message = obj.argv[1];
    target = obj.argv[2];
    got = display.displayMessage(type, message, target);
    if( got === display ){
	got = "OK";
    }
    return got;
});

// add this plugin into JS9
JS9.RegisterPlugin("JS9", "Info", JS9.Info.init,
		   {menuItem: "InfoBox",
		    help: "help/info.html",
		    dynamicSelect: true,
		    onplugindisplay: JS9.Info.pluginDisplay,
		    onpluginclose: JS9.Info.pluginClose,
		    onimagedisplay: JS9.Info.init,
		    onimagerefresh: JS9.Info.init,
		    onupdateprefs: JS9.Info.init,
		    winTitle: "Info",
		    winResize: true,
		    winDims: [JS9.Info.WIDTH, JS9.Info.HEIGHT]});
