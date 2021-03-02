/*
 * pan/zoom controls plugin (October 30, 2019)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.PanZoom = {};
JS9.PanZoom.CLASS = "JS9";      // class of plugins
JS9.PanZoom.NAME = "PanZoom";   // name of this plugin
JS9.PanZoom.WIDTH = 530;        // width of light window
JS9.PanZoom.HEIGHT = 110;       // height of light window
JS9.PanZoom.BASE = JS9.PanZoom.CLASS + JS9.PanZoom.NAME;

JS9.PanZoom.panzoomHTML="<p><div class='JS9PanZoomLinegroup'>$pan&nbsp;&nbsp;$zoom&nbsp;&nbsp;$flip&nbsp;&nbsp;$rot90&nbsp;&nbsp;$rotate</div><p><div class='JS9PanZoomLinegroup'>$panto $pos1 $pos2 $wcssys $wcsunits</div>";

JS9.PanZoom.panHTML = '<select class="JS9Select JS9PanZoomSelect JS9PanZoomCol1" name="pan" onchange="JS9.PanZoom.xsetpan(\'%s\', \'%s\', this)">%s</select>';

JS9.PanZoom.zoomHTML = '<select class="JS9Select JS9PanZoomSelect JS9PanZoomCol2" name="zoom" onchange="JS9.PanZoom.xsetzoom(\'%s\', \'%s\', this)">%s</select>';

JS9.PanZoom.flipHTML = '<select class="JS9Select JS9PanZoomSelect JS9PanZoomCol3" name="flip" onchange="JS9.PanZoom.xsetflip(\'%s\', \'%s\', this)">%s</select>';

JS9.PanZoom.rot90HTML = '<select class="JS9Select JS9PanZoomSelect JS9PanZoomCol4" name="rot90" onchange="JS9.PanZoom.xsetrot90(\'%s\', \'%s\', this)">%s</select>';

JS9.PanZoom.rotateHTML = '<input type="text" class="JS9PanZoomInput JS9PanZoomCol5 js9Input" name="rotate" autocapitalize="off" autocorrect="off" onkeydown="JS9.PanZoom.xsetrot(\'%s\', \'%s\', this, event)" value="%s" placeholder="angle or reset">';

JS9.PanZoom.pantoHTML = '<input type="button" class="JS9Button2 JS9PanZoomButton JS9PanZoomCol1" name="panto" value="Pan to &rarr;" onclick="javascript:JS9.PanZoom.xpanto(\'%s\', \'%s\', this)">';

JS9.PanZoom.pos1HTML = '<input type="text" class="JS9PanZoomInput JS9PanZoomCol2 js9Input" name="pos1" value="%s" autocapitalize="off" autocorrect="off" placeholder="x position">';

JS9.PanZoom.pos2HTML = '<input type="text" class="JS9PanZoomInput JS9PanZoomCol3 js9Input" name="pos2" value="%s" autocapitalize="off" autocorrect="off" placeholder="y position">';

JS9.PanZoom.sysHTML = '<select class="JS9Select JS9PanZoomSelect JS9PanZoomCol4" name="wcssys" onchange="JS9.PanZoom.xsetwcssys(\'%s\', \'%s\', this)">%s</select>';

JS9.PanZoom.unitsHTML = '<select class="JS9Select JS9PanZoomSelect JS9PanZoomCol5" name="wcsunits" onchange="JS9.PanZoom.xsetwcsunits(\'%s\', \'%s\', this)">%s</select>';

// change pan via menu
JS9.PanZoom.xsetpan = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    if( im ){
	switch(target.value){
	case "center":
	    im.setPan();
	    break;
	default:
	    break;
	}
    }
};

// change zoom via menu
JS9.PanZoom.xsetzoom = function(did, id, target){
    let arr, arr2, zval, zoom;
    const im = JS9.lookupImage(id, did);
    if( im ){
	switch(target.value){
	case "in":
	case "out":
	case "to fit":
	    zoom = im.parseZoom(target.value);
	    if( JS9.isNumber(zoom) ){
		im.setZoom(zoom);
	    }
	    break;
	default:
	    // format: "zoom" zoom
	    arr = target.value.split(/\s+/);
	    if( arr.length === 2 ){
		// format zoom or 1/zoom
		arr2 = arr[1].split("/");
		if( arr2.length === 1 ){
		    zval = parseFloat(arr2[0]);
		} else {
		    zval = 1 / parseFloat(arr2[1]);
		}
		im.setZoom(zval);
	    }
	    break;
	}
    }
};

// change flip via menu
JS9.PanZoom.xsetflip = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    if( im ){
	switch(target.value){
	case "x axis":
	    im.setFlip("x");
	    break;
	case "y axis":
	    im.setFlip("y");
	    break;
	case "reset":
	    im.setFlip("reset");
	    break;
	default:
	    break;
	}
    }
};

// change rotation by 90 degrees via menu
JS9.PanZoom.xsetrot90 = function(did, id, target){
    const im = JS9.lookupImage(id, did);
    if( im ){
	switch(target.value){
	case "90 left":
	    im.setRot90(90);
	    break;
	case "90 right":
	    im.setRot90(-90);
	    break;
	case "reset rotate":
	    im.setRot90("reset");
	    im.setRotate("reset");
	    break;
	case "align: north is up":
	    im.setRot90("reset");
	    im.setRotate("northisup");
	    break;
	case "reset flip/rot90/rotate":
	    im.setFlip("reset");
	    im.setRot90("reset");
	    im.setRotate("reset");
	    break;
	default:
	    break;
	}
    }
    return false;
};

// change rotation by degrees via text box
JS9.PanZoom.xsetrot = function(did, id, target, evt){
    let rot, pinst;
    const im = JS9.lookupImage(id, did);
    if( im ){
	if( evt.keyCode !== 13 ){ return; }
	rot = $(target).val().trim();
	if( rot ){
	    if( rot === "reset" ){
		im.setRotate("reset");
		im.setRot90("reset");
		return;
	    }
	    pinst = im.display.pluginInstances.JS9PanZoom;
	    // do this before setting rotation
	    if( pinst ){
		pinst.rot = rot;
	    }
	    im.setRotate(rot);
	    // do this after setting rotation
	    if( pinst ){
		pinst.divjq.find(`input[name="rotate"]`).focus().caretToEnd();
	    }
	}
    }
};

// pan to the position specified in the pos1,pos2 input elements
JS9.PanZoom.xpanto = function(did, id, target){
    let owcssys, arr, p1, p2, s1, s2, wcssys, pel, phys;
    const im = JS9.lookupImage(id, did);
    if( im ){
	pel = $(target).parent();
	wcssys = pel.find("[name='wcssys']").val();
	s1 = pel.find("[name='pos1']").val();
	s2 = pel.find("[name='pos2']").val();
	if( s1 && s2 && wcssys ){
	    owcssys = im.getWCSSys();
	    im.setWCSSys(wcssys);
	    p1 = JS9.saostrtod(s1);
	    if( JS9.isHMS(wcssys) ){
		p1 *= 15.0;
	    }
	    p2 = JS9.saostrtod(s2);
	    switch(wcssys){
	    case "image":
		break;
	    case "physical":
		phys =  im.logicalToImagePos({x: p1, y: p2});
		p1 = phys.x;
		p2 = phys.y;
		break;
	    default:
		if( im.validWCS() ){
		    arr = JS9.wcs2pix(im.raw.wcs, p1, p2).trim().split(/\s+/);
		    p1 = parseFloat(arr[0]);
		    p2 = parseFloat(arr[1]);
		}
	    }
	    im.setPan(p1, p2);
	    im.setWCSSys(owcssys);
	}
    }
};

// change the wcs system
JS9.PanZoom.xsetwcssys = function(did, id, target){
    let owcssys, owcsunits, pel, pos1, pos2;
    const nwcssys = target.value;
    const im = JS9.lookupImage(id, did);
    if( im ){
	owcssys = im.getWCSSys();
	owcsunits = im.getWCSUnits();
	im.setWCSSys(nwcssys);
	im.tmp.wcssysPanZoom = nwcssys;
	pos1 = JS9.PanZoom.getPos(im, "x");
	pos2 = JS9.PanZoom.getPos(im, "y");
	pel = $(target).parent();
	pel.find("[name='pos1']").val(pos1);
	pel.find("[name='pos2']").val(pos2);
	if( im.getWCSUnits() !== (im.tmp.wcsunitsPanZoom||owcsunits) ){
	    JS9.PanZoom.xsetwcsunits(did, id, {value: im.getWCSUnits()});
	}
	im.setWCSSys(owcssys);
	im.setWCSUnits(owcsunits);
    }
}

// change the wcs units
JS9.PanZoom.xsetwcsunits = function(did, id, target){
    let owcssys, owcsunits, pel, pos1, pos2;
    const nwcsunits = target.value;
    const im = JS9.lookupImage(id, did);
    if( im ){
	owcsunits = im.getWCSUnits();
	owcssys = im.getWCSSys();
	im.setWCSUnits(nwcsunits);
	im.tmp.wcsunitsPanZoom = nwcsunits;
	pos1 = JS9.PanZoom.getPos(im, "x");
	pos2 = JS9.PanZoom.getPos(im, "y");
	pel = $(target).parent();
	pel.find("[name='pos1']").val(pos1);
	pel.find("[name='pos2']").val(pos2);
	if( im.getWCSSys() !== (im.tmp.wcssysPanZoom||owcssys) ){
	    JS9.PanZoom.xsetwcssys(did, id, {value: im.getWCSSys()});
	}
	im.setWCSSys(owcssys);
	im.setWCSUnits(owcsunits);
    }
}

// get position string based on wcssys
JS9.PanZoom.getPos = function(im, which){
    let s, res, phys, ipos, owcssys, owcsunits, wcssys, wcsunits;
    if( im ){
	ipos = im.getPan();
	owcssys = im.getWCSSys();
	owcsunits = im.getWCSUnits();
	wcssys = im.tmp.wcssysPanZoom || owcssys;
	wcsunits = im.tmp.wcsunitsPanZoom || owcsunits;
	if( owcssys !== wcssys ){
	    im.setWCSSys(wcssys);
	}
	if( owcsunits !== wcsunits ){
	    im.setWCSUnits(wcsunits);
	}
	switch(wcssys){
	case "image":
	    res = String(ipos[which]);
	    break;
	case "physical":
	    phys =  im.imageToLogicalPos(ipos);
	    res = String(phys[which]);
	    break;
	default:
	    if( im.validWCS() ){
		s = JS9.pix2wcs(im.raw.wcs, ipos.x, ipos.y)
		    .trim().split(/\s+/);
		res = which === "x" ? s[0] : s[1];
	    } else {
		res = String(ipos[which]);
	    }
	    break;
	}
	if( owcssys !== wcssys ){
	    im.setWCSSys(owcssys);
	}
	if( owcsunits !== wcsunits ){
	    im.setWCSUnits(owcsunits);
	}
    }
    return res;
};

// re-init (avoiding recursion)
JS9.PanZoom.reinit = function(){
    if( !this.inProcess ){
	this.inProcess = true;
	JS9.PanZoom.init.call(this);
	this.inProcess = false;
    }
};

// re-init when a different image is displayed
JS9.PanZoom.display = function(){
    if( this.lastimage !== this.display.image ){
	this.inProcess = true;
	JS9.PanZoom.init.call(this);
	this.inProcess = false;
    }
};

// clear when an image closes
JS9.PanZoom.close = function(){
    // ensure plugin display is reset
    JS9.PanZoom.init.call(this, {mode: "clear"});
};

// constructor: add HTML elements to the plugin
JS9.PanZoom.init = function(opts){
    let s, t, im, mopts, imid, dispid;
    const getPanOptions = () => {
	let res = "<option selected disabled>Pan</option>";
	res += `<option>center</option>`;
	return res;
    };
    const getZoomOptions = () => {
	let i, zoom, name;
	let res = "<option selected disabled>Zoom</option>";
	res += `<option>in</option>`;
	res += `<option>out</option>`;
	res += `<option>to fit</option>`;
	res += `<option disabled>─────</option>`;
	for(i=JS9.imageOpts.zooms; i>0; i--){
	    zoom = Math.pow(2,i);
	    name = `zoom 1/${zoom}`;
	    res += `<option>${name}</option>`;
	}
	for(i=0; i<=JS9.imageOpts.zooms; i++){
	    zoom = Math.pow(2,i);
	    name = `zoom ${zoom}`;
	    res += `<option>${name}</option>`;
	}
	return res;
    };
    const getFlipOptions = () => {
	let res = "<option selected disabled>Flip</option>";
	res += `<option>x axis</option>`;
	res += `<option>y axis</option>`;
	res += `<option>reset</option>`;
	return res;
    };
    const getRot90Options = () => {
	let res = "<option selected disabled>Rotate</option>";
	res += `<option>90 left</option>`;
	res += `<option>90 right</option>`;
	res += `<option>reset rotate</option>`;
	res += `<option disabled>─────</option>`;
	res += `<option>align: north is up</option>`;
	res += `<option>reset flip/rot90/rotate</option>`;
	return res;
    };
    const getRotOptions = (im) => {
	let res = 0;
	if( im ){
	    if( JS9.globalOpts.rotateRelative &&
		this.rot && this.rot !== "reset" ){
		res = this.rot;
	    } else {
		res = im.getRotate() || "0";
	    }
	}
	return res;
    };
    const getSysOptions = (im) => {
	let i, sys, wcssys;
	let res = "<option selected disabled>WCS Systems</option>";
	if( im ){
	    wcssys = im.tmp.wcssysPanZoom || im.getWCSSys();
	    if( im.validWCS() ){
		sys = JS9.wcssyss;
	    } else {
		sys = ["image", "physical"];
	    }
	    for(i=0; i<sys.length; i++){
		if( wcssys === sys[i] ){
		    res += `<option selected>${sys[i]}</option>`;
		} else {
		    res += `<option>${sys[i]}</option>`;
		}
	    }
	}
	return res;
    };
    const getUnitsOptions = (im) => {
	let i, units, wcsunits;
	let res = "<option selected disabled>WCS Units</option>";
	if( im ){
	    wcsunits = im.tmp.wcsunitsPanZoom || im.getWCSUnits();
	    if( im.validWCS() ){
		units = ["degrees", "sexagesimal", "pixels"];
	    } else {
		units = ["pixels"];
	    }
	    for(i=0; i<units.length; i++){
		if( wcsunits === units[i] ){
		    res += `<option selected>${units[i]}</option>`;
		} else {
		    res += `<option>${units[i]}</option>`;
		}
	    }
	}
	return res;
    };
    const getPos = (im, which) => {
	return JS9.PanZoom.getPos(im, which);
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
	this.width  = JS9.PanZoom.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.PanZoom.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // clear out html
    this.divjq.html("");
    this.lastTextWidth = 0;
    // set up new html
    this.panzoomContainer = $("<div>")
	.addClass(`${JS9.PanZoom.BASE}Container`)
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
	t = sprintf(JS9.PanZoom.panHTML, dispid, imid, getPanOptions());
	mopts.push({name: "pan", value: t});
	t = sprintf(JS9.PanZoom.zoomHTML, dispid, imid, getZoomOptions());
	mopts.push({name: "zoom", value: t});
	t = sprintf(JS9.PanZoom.flipHTML, dispid, imid, getFlipOptions());
	mopts.push({name: "flip", value: t});
	t = sprintf(JS9.PanZoom.rot90HTML, dispid, imid, getRot90Options());
	mopts.push({name: "rot90", value: t});
	t = sprintf(JS9.PanZoom.rotateHTML, dispid, imid, getRotOptions(im));
	mopts.push({name: "rotate", value: t});
	t = sprintf(JS9.PanZoom.pantoHTML, dispid, imid);
	mopts.push({name: "panto", value: t});
	t = sprintf(JS9.PanZoom.pos1HTML, getPos(im, "x"));
	mopts.push({name: "pos1", value: t});
	t = sprintf(JS9.PanZoom.pos2HTML, getPos(im, "y"));
	mopts.push({name: "pos2", value: t});
	t = sprintf(JS9.PanZoom.sysHTML, dispid, imid, getSysOptions(im));
	mopts.push({name: "wcssys", value: t});
	t = sprintf(JS9.PanZoom.unitsHTML, dispid, imid, getUnitsOptions(im));
	mopts.push({name: "wcsunits", value: t});
	s = im.expandMacro(JS9.PanZoom.panzoomHTML, mopts);
	this.lastimage = im;
    } else {
	s = "<p><center>Pan/Zoom parameters will appear here.</center>";
    }
    this.panzoomContainer.html(s);
    if( im ){
	// init run on cr, if necessary
	if( JS9.globalOpts.runOnCR ){
	    this.panzoomContainer.find("[name='pos1']")
		.data("enterfunc", "panto");
	    this.panzoomContainer.find("[name='pos2']")
		.data("enterfunc", "panto");
	}
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.PanZoom.CLASS, JS9.PanZoom.NAME,
		   JS9.PanZoom.init,
		   {menu: "zoom",
		    menuItem: "Pan/Zoom Controls ...",
		    onplugindisplay: JS9.PanZoom.init,
		    onsetpan: JS9.PanZoom.reinit,
		    onsetzoom: JS9.PanZoom.reinit,
		    onsetwcssys: JS9.PanZoom.reinit,
		    onsetwcsunits: JS9.PanZoom.reinit,
		    onimagedisplay: JS9.PanZoom.display,
		    onimageclose: JS9.PanZoom.close,
		    help: "help/zoomcontrols.html",
		    winTitle: "Pan/Zoom Controls",
		    winDims: [JS9.PanZoom.WIDTH, JS9.PanZoom.HEIGHT]});
