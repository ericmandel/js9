/*
 * colormap generation plugin (Feb 13, 2019)
 */

/*global JS9, $, sprintf, tinycolor */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Cmaps = {};
JS9.Cmaps.CLASS = "JS9";      	// class of plugins (1st part of div class)
JS9.Cmaps.NAME = "Cmaps";     	// name of this plugin (2nd part of div class)
JS9.Cmaps.WIDTH =  600;	  	// width of light window
JS9.Cmaps.HEIGHT = 270;	  	// height of light window
JS9.Cmaps.BASE = JS9.Cmaps.CLASS + JS9.Cmaps.NAME;  // CSS base class name

// defaults
JS9.Cmaps.DEFMODE = "equidistant";
JS9.Cmaps.DEFNMAP = 3;
JS9.Cmaps.DEFASSIGN = true;
JS9.Cmaps.DEFNAME = "cmap";
JS9.Cmaps.DEFTOL = Math.pow(8,2);
JS9.Cmaps.DEFTIMEOUT = 0;
JS9.Cmaps.COLORCLASS = "cmapsColorPicker";
JS9.Cmaps.CMAPCLASS = "cmapsSelect";
JS9.Cmaps.CHECKCLASS = "cmapsActiveCheck";

JS9.Cmaps.headerHTML = `Select a color&nbsp;&nbsp;<input type="color" value="#FF0000" class="${JS9.Cmaps.COLORCLASS}">&nbsp;&nbsp;or a &nbsp;&nbsp;<select class="${JS9.Cmaps.CMAPCLASS} JS9Select" onchange="JS9.Cmaps.xCmap('%s',this)"></select>&nbsp;&nbsp;colormap to create&nbsp;&nbsp;<input type="number" onchange="JS9.Cmaps.xNslice('%s',this)" value="${JS9.Cmaps.DEFNMAP}" min="1" max="36" size="3" style="width:40px;box-sizing: border-box;">&nbsp;&nbsp;<select class="cmapsMode JS9Select" onchange="JS9.Cmaps.xMode('%s',this)">&nbsp;&nbsp;<option value="equidistant">equidistant</option><option value="analogous">analogous</option></select><p>slices of the <a href="https://en.wikipedia.org/wiki/Color_wheel" target="_blank">colorwheel</a>,&nbsp;&nbsp;the first&nbsp;&nbsp;<input type="number" onchange="JS9.Cmaps.xNmap('%s',this)" value="${JS9.Cmaps.DEFNMAP}" min="1" max="36" size="3" style="width:40px;box-sizing: border-box;">&nbsp;of which will be used to create colormaps.<p><input type="checkbox" onchange="JS9.Cmaps.xAssignCmaps('%s',this)" checked> assign the new colormaps to these images:`;

JS9.Cmaps.imageHTML="<span style='float: left'>$active</span>&nbsp;&nbsp; <span style='float: right'>$imfile</span>";

JS9.Cmaps.activeHTML=`<input class="${JS9.Cmaps.CHECKCLASS}" type="checkbox" id="active" name="active" value="active" onclick="javascript:JS9.Cmaps.xActive('%s', '%s', this)">&nbsp;`;

JS9.Cmaps.imfileHTML='<b>%s</b>';

JS9.Cmaps.nofileHTML='<div class="JS9cmapsNoFile">[Colormap generation options will appear here after an image is loaded]</div>';

// equidistant colormaps
JS9.Cmaps.equidistant = function(color, results, slices) {
    let i;
    const hsl = tinycolor(color).toHsl();
    const hue = hsl.h;
    const slice = 360 / slices;
    const ret = [];
    for(i=0; i<results; i++){
        hsl.h = (hue + (i * slice)) % 360;
        ret.push(tinycolor(hsl));
    }
    return ret;
};

// generate colors using one of the complementary algorithms
JS9.Cmaps.mkColors = function(mode, color, nmap, nslice) {
    // sanity check
    if( !color || !nmap || !nslice ){ return; }
    mode = mode || "equidistant";
    switch(mode){
    case "analogous":
	return tinycolor(color).analogous(nmap, nslice);
    case "equidistant":
	return JS9.Cmaps.equidistant(tinycolor(color), nmap, nslice);
    default:
	return [tinycolor(color)];
    }
};

// assign generated colormaps to the active images
JS9.Cmaps.assignCmaps = function(display){
    let clen, container;
    let cur = 0;
    const cid = `.${JS9.Cmaps.BASE}Image`;
    const elid2 = `.${JS9.Cmaps.CHECKCLASS}`;
    // sanity checks
    if( !display.cmaps.names || !display.cmaps.names.length ){ return; }
    // container element from plugin for this display
    container = display.cmaps.that.cmapsImageContainer;
    if( container.length ){
	// number of colormaps to assign
	clen = display.cmaps.names.length;
	// look for image inside this container
	container.find(cid).each((idx, el) => {
	    const qel = $(el);
	    const imid = qel.prop("imid");
	    const im = JS9.lookupImage(imid);
	    const qel2 = qel.find(elid2);
	    // if the image exists and is active
	    if( im && (cur < clen) && qel2.prop("checked") ){
		im.setColormap(display.cmaps.names[cur++]);
		im.displayImage();
	    }
	});
    }
};

// give a colormap, generate new complementary colormaps
JS9.Cmaps.mkCmapsFromCmap = function(display, cmap, nmap, nslice, opts){
    let i, j, tcolor, tcolors, color, index, rgb, mode, cbase;
    const colors = [];
    const vertices = [];
    const rgbs = [];
    const fmt = "rgb (%s,%s,%s)";
    const xrgb3 = (rgb) => {
	return [rgb.r/255, rgb.g/255, rgb.b/255];
    };
    const mkColorCell = (cmap, index) => {
	return JS9.Colormap.prototype.mkColorCell.call(cmap, index);
    };
    // sanity check
    if( !cmap || !nmap || !nslice ){ return; }
    // opts is optional
    opts = opts || {};
    // mode (equidistant, analogous, etc.)
   mode = opts.mode || JS9.Cmaps.DEFMODE;
    // base for colormap name
    cbase = cmap.name;
    // reset names
    display.cmaps.names = [];
    // process "lut" or "sao" type cmaps
    switch(cmap.type){
    case "lut":
	// create n new colormaps
	for(i=0; i<nmap; i++){
	    display.cmaps.names[i] = `${cbase}_${String(i+1)}`;
	    colors[i] = [];
	}
	for(i=0; i<cmap.colors.length; i++){
	    color = sprintf(fmt,
			    Math.floor(cmap.colors[i][0]*255+0.5),
			    Math.floor(cmap.colors[i][1]*255+0.5),
			    Math.floor(cmap.colors[i][2]*255+0.5));
	    tcolors = JS9.Cmaps.mkColors(mode, color, nmap, nslice);
	    for(j=0; j<nmap; j++){
		colors[j].push(xrgb3(tcolors[j].toRgb()));
	    }
	}
	// add new colormaps or edit existing
	for(i=0; i<nmap; i++){
	    cmap = JS9.lookupColormap(display.cmaps.names[i], false);
	    if( cmap ){
		cmap.colors = colors[i];
	    } else {
		JS9.AddColormap(display.cmaps.names[i], colors[i],
				{toplevel: false});
	    }
	}
	if( opts.assign ){
	    JS9.Cmaps.assignCmaps(display);
	}
        break;
    case "sao":
	// create n new colormaps
	for(i=0; i<nmap; i++){
	    display.cmaps.names[i] = `${cmap.name}_${String(i+1)}`;
	    vertices[i] = [[], [], []];
	}
	// for each color (red, green, blue)
	for(i=0; i<3; i++){
	    // for each vertex of this color
	    for(j=0; j<cmap.vertices[i].length; j++){
		index = cmap.vertices[i][j][0];
		rgb = mkColorCell(cmap, index*JS9.COLORSIZE);
		// get rgb for this index and add to array
		rgbs.push({index: index, rgb: rgb});
	    }
	}
	// sort array in ascending order
	rgbs.sort( (a,b) => {
	    if( a.index > b.index ){
		return 1;
	    } else if( a.index < b.index ){
		return -1;
	    }
	    return 0;
	});
	// remove duplicates
	for(i=rgbs.length-2; i>=0; i--){
	    if( rgbs[i].index === rgbs[i+1].index ){
		rgbs.splice(i+1, 1);
	    }
	}
	// generate new colors for each vertex
	for(i=0; i<rgbs.length; i++){
	    color = sprintf(fmt,
			    rgbs[i].rgb[0],
			    rgbs[i].rgb[1],
			    rgbs[i].rgb[2]);
	    tcolors = JS9.Cmaps.mkColors(mode, color, nmap, nslice);
	    // and add these vertices to each array
	    for(j=0; j<nmap; j++){
		tcolor = xrgb3(tcolors[j].toRgb());
		vertices[j][0].push([rgbs[i].index, tcolor[0]]);
		vertices[j][1].push([rgbs[i].index, tcolor[1]]);
		vertices[j][2].push([rgbs[i].index, tcolor[2]]);
	    }
	}
	// add new colormaps or edit existing
	for(i=0; i<nmap; i++){
	    cmap = JS9.lookupColormap(display.cmaps.names[i], false);
	    if( cmap ){
		cmap.vertices = vertices[i];
	    } else {
		JS9.AddColormap(display.cmaps.names[i],
				vertices[i][0],
				vertices[i][1],
				vertices[i][2],
				{toplevel: false});
	    }
	}
	if( opts.assign ){
	    JS9.Cmaps.assignCmaps(display);
	}
        break;
    default:
	break;
    }
};

// give a color, generate new complementary colormaps
JS9.Cmaps.mkCmapsFromColor = function(display, cname, nmap, nslice, opts){
    let color, rgb, tol, diff, mode, cbase;
    // sanity check
    if( !cname || !nmap || !nslice ){ return; }
    // opts is optional
    opts = opts || {};
    // default mode is "equidistant"
    mode = opts.mode || "equidistant";
    // base for colormap name
    cbase = display.id || JS9.Cmaps.DEFNAME;
    // tol passed?
    if( opts.rgbtol !== undefined ){
	tol = opts.rgbtol;
    } else {
	tol = display.cmaps.tol;
    }
    // it was a color
    color = tinycolor(cname);
    // RGB represention
    rgb = color.toRgb();
    // optimization: make sure the color has changed "enough"
    // before we change the colormap
    diff = Math.pow(Math.abs(rgb.r - display.cmaps.orgb.r), 2) +
           Math.pow(Math.abs(rgb.g - display.cmaps.orgb.g), 2) +
           Math.pow(Math.abs(rgb.b - display.cmaps.orgb.b), 2);
    if( diff < tol ){
	return 0;
    }
    if( display.cmaps.timeOutID ){
	return 0;
    }
    // use timeout to ensure redisplay gets into the event loop
    display.cmaps.timeOutID = window.setTimeout(() => {
	let i, tcolors, cmap;
	// reset names
	display.cmaps.names = [];
	// generate nmap colors
	tcolors = JS9.Cmaps.mkColors(mode, color, nmap, nslice);
	// save for next iteration
	display.cmaps.orgb.r = rgb.r;
	display.cmaps.orgb.g = rgb.g;
	display.cmaps.orgb.b = rgb.b;
	// process each colormap
	for(i=0; i<nmap; i++){
            rgb = tcolors[i].toRgb();
            display.cmaps.names[i] = `${cbase}_${String(i+1)}`;
	    cmap = JS9.lookupColormap(display.cmaps.names[i], false);
	    // add new colormaps or edit existing
	    if( cmap ){
		switch(cmap.type){
		case "lut":
		    // convert to sao type
		    cmap.type = "sao";
                    cmap.vertices = [[[0,0],[1,rgb.r/255]],
 		                     [[0,0],[1,rgb.g/255]],
		                     [[0,0],[1,rgb.b/255]]];
                    break;
		case "sao":
                    cmap.vertices = [[[0,0],[1,rgb.r/255]],
 		                     [[0,0],[1,rgb.g/255]],
		                     [[0,0],[1,rgb.b/255]]];
                    break;
		}
            } else {
		JS9.AddColormap(display.cmaps.names[i],
				[[0,0],[1,rgb.r/255]],
				[[0,0],[1,rgb.g/255]],
				[[0,0],[1,rgb.b/255]],
				{toplevel: false});
            }
	}
	if( opts.assign ){
	    JS9.Cmaps.assignCmaps(display);
	}
	display.cmaps.timeOutID = null;
    }, JS9.Cmaps.DEFTIMEOUT);
};

// give either a color or a colormap, generate new complementary colormaps
JS9.Cmaps.mkCmaps = function(display, cname, nmap, nslice, opts){
    let cmap;
    // sanity check
    if( !cname || !nmap || !nslice ){ return 0; }
    // color or colormap?
    cmap = JS9.lookupColormap(cname, false);
    // were we passed a color map?
    if( cmap ){
	// make colormaps from this colormap
	JS9.Cmaps.mkCmapsFromCmap(display, cmap, nmap, nslice, opts);
    } else {
	// make colormaps from this color
	JS9.Cmaps.mkCmapsFromColor(display, cname, nmap, nslice, opts);
    }
};

// set the active flag for an image
JS9.Cmaps.xActive = function(id){
    const display = JS9.lookupDisplay(id);
    if( !display ){ return; }
    if( display.cmaps.assign ){
	JS9.Cmaps.assignCmaps(display);
    }
};

// set the algorithm for generating colormaps
JS9.Cmaps.xMode = function(id, target){
    const display = JS9.lookupDisplay(id);
    if( !display ){ return; }
    display.cmaps.mode = target.options[target.selectedIndex].value;
    JS9.Cmaps.mkCmaps(display, display.cmaps.lastCname,
		      display.cmaps.nmap, display.cmaps.nslice,
		      {mode: display.cmaps.mode,
		       assign: display.cmaps.assign,
		       rgbtol: 0});
};

// set the number of colormaps to generate
JS9.Cmaps.xNmap = function(id, target){
    const display = JS9.lookupDisplay(id);
    if( !display ){ return; }
    display.cmaps.nmap = parseInt(target.value, 10) || 1;
    JS9.Cmaps.mkCmaps(display, display.cmaps.lastCname,
		      display.cmaps.nmap, display.cmaps.nslice,
		      {mode: display.cmaps.mode,
		       assign: display.cmaps.assign,
		       rgbtol: 0});
};

// set the number of slices to generate
JS9.Cmaps.xNslice = function(id, target){
    const display = JS9.lookupDisplay(id);
    if( !display ){ return; }
    display.cmaps.nslice = parseInt(target.value, 10) || 1;
    JS9.Cmaps.mkCmaps(display, display.cmaps.lastCname,
		      display.cmaps.nmap, display.cmaps.nslice,
		      {mode: display.cmaps.mode,
		       assign: display.cmaps.assign,
		       rgbtol: 0});
};

// select the colormap to use as a basis for colormap generation
JS9.Cmaps.xCmap = function(id, target){
    const display = JS9.lookupDisplay(id);
    const cname = target.options[target.selectedIndex].value;
    if( !display ){ return; }
    JS9.Cmaps.mkCmaps(display, cname,
		      display.cmaps.nmap, display.cmaps.nslice,
		      {mode: display.cmaps.mode,
		       assign: display.cmaps.assign,
		       rgbtol: 0});
    display.cmaps.lastCname = cname;
};

// set the global flag to assign new colormaps to images
JS9.Cmaps.xAssignCmaps = function(id, target){
    const display = JS9.lookupDisplay(id);
    if( !display ){ return; }
    display.cmaps.assign = $(target).prop("checked");
    if( display.cmaps.assign ){
	JS9.Cmaps.assignCmaps(display);
    }
};

// get an id based on the file image id
JS9.Cmaps.imid = function(im){
    const id = `${im.display.id}_${im.id}`;
    return `${id.replace(/[^A-Za-z0-9_]/g, "_")}CmapsImage`;
};

// get a class unique between displays
JS9.Cmaps.dispclass = function(){
    const id = `${JS9.Cmaps.BASE}_${this.display.id}`;
    return id.replace(/[^A-Za-z0-9_]/g, "_");
};

// change the active image
JS9.Cmaps.activeImage = function(im){
    let id, dcls;
    if( im ){
	id = JS9.Cmaps.imid.call(this, im);
	dcls = `${JS9.Cmaps.dispclass.call(this)}_Image`;
	$(`.${dcls}`)
	    .removeClass(`${JS9.Cmaps.BASE}ImageActive`)
	    .addClass(`${JS9.Cmaps.BASE}ImageInactive`);
	$(`#${id}`)
	    .removeClass(`${JS9.Cmaps.BASE}ImageInactive`)
	    .addClass(`${JS9.Cmaps.BASE}ImageActive`);
    }
};

// add an image to the list of available images
JS9.Cmaps.addImage = function(im){
    let s, id, divjq, dcls, dispid, imid;
    const opts = [];
    const cls = `${JS9.Cmaps.BASE}Image`;
    if( !im ){
	return;
    }
    // convenience variables
    imid = im.id;
    dispid = this.display.id;
    // unique id
    id = JS9.Cmaps.imid.call(this, im);
    // get class for this layer
    dcls = `${JS9.Cmaps.dispclass.call(this)}_Image`;
    // value to pass to the macro expander
    opts.push({name: "imid", value: imid});
    opts.push({name: "active", value: sprintf(JS9.Cmaps.activeHTML,
					      dispid, imid)});
    opts.push({name: "imfile", value: sprintf(JS9.Cmaps.imfileHTML,
					      imid)});
    // create the html for this image
    s = JS9.Image.prototype.expandMacro.call(im, JS9.Cmaps.imageHTML, opts);
    // add image html to the image container
    divjq = $("<div>")
	.addClass(cls)
	.addClass(dcls)
	.addClass(`${JS9.Cmaps.BASE}ImageInactive`)
	.prop("id", id)
	.prop("imid", imid)
	.html(s)
	.appendTo(this.cmapsImageContainer);
    divjq.on("mousedown touchstart", () => {
	if( dispid === im.display.id ){
	    im.displayImage();
	    JS9.Cmaps.activeImage.call(this, im);
	}
    });
    // make it the current one (if its display in this display)
    if( this.display.id === im.display.id ){
	JS9.Cmaps.activeImage.call(this, im);
    }
};

// remove an image to the list of available images
JS9.Cmaps.removeImage = function(im){
    let id;
    if( im ){
	id = JS9.Cmaps.imid.call(this, im);
	$(`#${id}`).remove();
	return true;
    }
    return false;
};

// plugin initialization
JS9.Cmaps.init = function(width, height){
    let i, dispid, html, el1, el2;
    const elid1 = `.${JS9.Cmaps.COLORCLASS}`;
    const elid2 = `.${JS9.Cmaps.CMAPCLASS}`;
    const display = this.display;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // allow size specification for divs
    if( this.winType === "div" ){
	// set width and height on div
	this.width = this.divjq.attr("data-width");
	if( !this.width  ){
	    this.width = width || JS9.Cmaps.WIDTH;
	}
	this.divjq.css("width", this.width);
	this.width = parseInt(this.divjq.css("width"), 10);
	this.height = this.divjq.attr("data-height");
	if( !this.height ){
	    this.height = height || JS9.Cmaps.HEIGHT;
	}
	this.divjq.css("height", this.height);
	this.height = parseInt(this.divjq.css("height"), 10);
    }
    // not much to do until colormaps are available
    if( !JS9.colormaps || !JS9.colormaps.length ){
	this.divjq.html(JS9.Cmaps.nofileHTML);
	return;
    }
    // init cmaps object once
    if( !display.cmaps ){
	display.cmaps = {};
	display.cmaps.mode = JS9.Cmaps.DEFMODE;
	display.cmaps.nmap = JS9.Cmaps.DEFNMAP;
	display.cmaps.nslice = JS9.Cmaps.DEFNMAP;
	display.cmaps.assign = JS9.Cmaps.DEFASSIGN;
	display.cmaps.tol = JS9.Cmaps.DEFTOL;
	display.cmaps.lastCname = null;
	display.cmaps.names = [];
	display.cmaps.ims = [];
	display.cmaps.orgb = {r: 0, g: 0, b: 0};
	display.cmaps.that = this;
    }
    // clear main div
    this.divjq.html("");
    // add main container
    this.cmapsContainer = $("<div>")
	.addClass(`${JS9.Cmaps.BASE}Container`)
	.attr("id", `${this.id}CMapsContainer`)
	.appendTo(this.divjq);
    // add header
    dispid = this.display.id;
    html = sprintf(JS9.Cmaps.headerHTML,
		   dispid, dispid, dispid, dispid, dispid);
    this.cmapsHeader = $("<div>")
	.addClass(`${JS9.Cmaps.BASE}Header`)
	.attr("display", this.display.id)
	.attr("id", `${this.display.id}CMapsHeader`)
	.html(html)
	.appendTo(this.cmapsContainer);
    // container to hold images
    this.cmapsImageContainer = $("<div>")
	.addClass(`${JS9.Cmaps.BASE}ImageContainer`)
	.attr("id", `${this.id}CmapsImageContainer`)
	.appendTo(this.cmapsContainer);
    for(i=0; i<JS9.images.length; i++){
	JS9.Cmaps.addImage.call(this, JS9.images[i]);
    }
    // the images within the image container will be sortable
    this.cmapsImageContainer.sortable({
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
    // convenience variables
    el1 = this.cmapsContainer.find(elid1);
    el2 = this.cmapsContainer.find(elid2);
    // set up colormap select menu
    el2.each( () => {
	let i, cmap;
	for(i=0; i<JS9.colormaps.length; i++){
	    cmap = JS9.colormaps[i].name;
	    $(elid2).append($('<option>', {value: cmap, text: cmap}));
	}
    });
    // only do once
    if( !display.cmaps.inited ){
	// set up event callbacks
	if( !JS9.globalOpts.internalColorPicker ||
	    !$.fn.spectrum.inputTypeColorSupport() ){
	    el1.spectrum({showButtons: false,
			  showInput: true,
			  preferredFormat: "hex6"});
	    // when the color is changed via the spectrum
	    el1.on('move.spectrum', (evt, tinycolor) => {
		const cname = tinycolor.toHex();
		JS9.Cmaps.mkCmaps(display, cname,
				  display.cmaps.nmap, display.cmaps.nslice,
				  {mode: display.cmaps.mode,
				   assign: display.cmaps.assign});
		display.cmaps.lastCname = cname;
	    });
	    // when the color is changed via the text box
	    el1.on("change", (evt) => {
		const cname = tinycolor($(evt.currentTarget).val()).toHex();
		JS9.Cmaps.mkCmaps(display, cname,
				  display.cmaps.nmap, display.cmaps.nslice,
				  {mode: display.cmaps.mode,
				   assign: display.cmaps.assign});
		display.cmaps.lastCname = cname;
	    });
	}
	el1.on("input", (evt) => {
	    const cname = evt.target.value;
	    const pdisplay = $(evt.target).parent().attr("display");
	    if( pdisplay !== display.id ){
		return;
	    }
            JS9.Cmaps.mkCmaps(display, cname,
			      display.cmaps.nmap, display.cmaps.nslice,
			      {mode: display.cmaps.mode,
			       assign: display.cmaps.assign});
	    display.cmaps.lastCname = cname;
	});
	display.cmaps.inited = true;
    }
};

// callback when an image is loaded
JS9.Cmaps.imageload = function(im){
    let i, display, pinst;
    if( !this.display.cmaps ){
	JS9.Cmaps.init.call(this);
    } else {
	JS9.Cmaps.addImage.call(this, im);
    }
    // add image to other displays as well
    for(i=0; i<JS9.displays.length; i++){
	display = JS9.displays[i];
	if( display.image && display.id !== im.display.id ){
	    pinst = display.pluginInstances.JS9Cmaps;
	    if( pinst && pinst.isActive("onimageload") ){
		JS9.Cmaps.addImage.call(pinst, im);
	    }
	}
    }
};

// callback when image is displayed
JS9.Cmaps.imagedisplay = function(im){
    JS9.Cmaps.activeImage.call(this, im);
};

// callback when image is displayed
JS9.Cmaps.imageclose = function(im){
    let i, display, pinst;
    JS9.Cmaps.removeImage.call(this, im);
    // remove image from other displays as well
    for(i=0; i<JS9.displays.length; i++){
	display = JS9.displays[i];
	if( display.image && display.id !== im.display.id ){
	    pinst = display.pluginInstances.JS9Cmaps;
	    if( pinst && pinst.isActive("onimageclose") ){
		JS9.Cmaps.removeImage.call(pinst, im);
	    }
	}
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Cmaps.CLASS, JS9.Cmaps.NAME, JS9.Cmaps.init,
		   {menuItem: "Colormaps",
		    help: "help/cmaps.html",
		    onimageload: JS9.Cmaps.imageload,
		    onimagedisplay: JS9.Cmaps.imagedisplay,
		    onimageclose: JS9.Cmaps.imageclose,
		    winTitle: "Create Colormaps",
		    winResize: true,
		    winDims: [JS9.Cmaps.WIDTH, JS9.Cmaps.HEIGHT]});
