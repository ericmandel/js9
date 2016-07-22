// ---------------------------------------------------------------------
// Info plugin
// ---------------------------------------------------------------------

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf, Uint8Array */

// create our namespace, and specify some meta-information and params
JS9.Info = {};
JS9.Info.CLASS = "JS9";
JS9.Info.NAME = "Info";
JS9.Info.WIDTH = 345;	// width of js9Info box
JS9.Info.HEIGHT = 265;	// height of js9Info box

JS9.Info.opts = {
    // info url
    infoURL: "./params/info.html",
    infoHTML: '<table id="info" class="js9InfoTable">' +
'<tr>' +
'<td>file:</td>' +
'<td colspan="2"><input type="text" id="id" size="28" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td>object:</td>' +
'<td colspan="2"><input type="text" id="object" size="28" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td>value:</td>' +
'<td colspan="2"><input type="text" id="val3" size="28" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td><input type="text" id="isys" size="10" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="ix" size="13" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="iy" size="13" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td><input type="text" id="psys" size="10" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="px" size="13" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="py" size="13" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td><input type="text" id="wcssys" size="10" value="" readonly="readonly" /></span></td>' +
'<td><input type="text" id="ra" size="13" value="" readonly="readonly" /></td>' +
'<td><input type="text" id="dec" size="13" value="" readonly="readonly" /></td>' +
'</tr> <tr>' +
'<td colspan="3"><textarea style="background: #E9E9E9; border: #CCCCCC solid 1px" id="regions" rows="4" cols="40" value="" readonly="readonly" /></td>' +
'</tr>' +
'</table>'
};

JS9.Info.init = function(width, height){
    // add container to the high-level div
    this.infoConjq = $("<div>")
	.addClass("JS9Container")
	.append(JS9.Info.opts.infoHTML)
	.appendTo(this.divjq);
    // save the jquery element for later processing
    this.jq = this.infoConjq.find("#info");
};

// display a message on the image canvas or info plugin
// call with image or display as context
JS9.Info.display = function(type, message, target){
    var tobj, split, area, tokens, rexp, s, color, info, key, jel;
    // if image is context
    if( this.display && this.display.pluginInstances ){
	info = this.display.pluginInstances.JS9Info;
    }
    // if specific target was specified use that
    if( target ){
	tobj = target;
    } else {
	// if info plugin is active, use that
	if( info && (info.status === "active") ){
	    tobj = info;
	} else {
	    // use display
	    if( this.display ){
		// image context
		tobj = this.display;
	    } else {
		// display context
		tobj = this;
	    }
	}
    }
    // plugin-based display: fill in html form
    if( tobj === info ){
	switch( typeof message ){
	case "string":
	    jel = info.jq.find("#" + type);
	    if( jel.length > 0 ){
		jel.val(message);
	    }
	    break;
	case "object":
	    // process all key in the object
	    for( key in message ){
		if( message.hasOwnProperty(key) ){
		    // key-specific processing
		    switch(key){
		    case "wcssys":
			if( !message[key] ){
			    message[key] = "wcs";
			}
			break;
		    }
		    // set value, if possible
		    jel = info.jq.find("#" + key);
		    if( jel.length > 0 ){
			jel.val(message[key]);
		    }
		}
	    }
	    break;
	}
	// allow chaining
	return this;
    }
    // height params for text color assignment
    tobj.infoheight = tobj.infoArea.height() + 4;
    tobj.regheight = Math.max(tobj.infoheight * 2 + 10,
			      tobj.infoheight + tobj.regionsArea.height() + 10);
    // display-based message
    switch(type){
    case "regions":
	area = tobj.regionsArea;
	if( !this.display.image ||
	    (this.display.image.iy > tobj.regheight) ){
	    color = JS9.textColorOpts.inimage;
	} else {
	    color = JS9.textColorOpts.regions;
	}
	split = ";";
	break;
    case "info":
	area = tobj.infoArea;
	if( !this.display.image ||
	    (this.display.image.iy > tobj.infoheight) ){
	    color = JS9.textColorOpts.inimage;
	} else {
	    color = JS9.textColorOpts.info;
	}
	split = "";
	break;
    default:
	area = tobj.infoArea;
	if( !this.display.image ||
	    (this.display.image.iy > tobj.infoheight) ){
	    color = JS9.textColorOpts.inimage;
	} else {
	    color = JS9.textColorOpts.info;
	}
	break;
    }
    // massage the message before display, if necessary
    switch( typeof message ){
    case "string":
	s = message;
	break;
    case "object":
	s = message.vstr;
	break;
    }
    if( split !== "" ){
	tokens = s.split(split);
	if( tokens.length > 2 ){
	    rexp = new RegExp(split, "g");
	    s = s.replace(rexp, "<br>");
	}
    }
    // display the message
    area.css("color", color).html(s);
    // allow chaining
    return this;
};
JS9.Image.prototype.displayMessage = JS9.Info.display;

// clear an info message
JS9.Info.clear = function(which){
    if( which ){
	this.displayMessage(which, "");
    } else {
	this.displayMessage("info", "");
	this.displayMessage("regions", "");
    }
    // allow chaining
    return this;
};
JS9.Image.prototype.clearMessage = JS9.Info.clear;

// when a plugin window is brought up, clear the display window
JS9.Info.clearMain = function(im){
    if( im ){
	im.displayMessage("info", "", im.display);
	im.displayMessage("regions", "", im.display);
    }
};

// having added the prototype displayMessage, we can define a public routine
JS9.mkPublic("DisplayMessage", "displayMessage");

// add this plugin into JS9
JS9.RegisterPlugin("JS9", "Info", JS9.Info.init,
		   {menuItem: "InfoBox",
		    onplugindisplay: JS9.Info.clearMain,
		    winTitle: "Info",
		    winResize: true,
		    winDims: [JS9.Info.WIDTH, JS9.Info.HEIGHT]});
