/*
 * preferences plugin (14 April 2015)
 */

/*global $, JS9, ddtabcontent */

"use strict";

// To specify the JS9 display instance to link to a given PREFS div,
// use the HTML5 dataset syntax: 
//    <div class="JS9Prefs" data-js9id="JS9"></div>

// create our namespace, and specify some meta-information and params
JS9.Prefs = {};
JS9.Prefs.CLASS = "JS9";        // class of plugins (1st part of div class)
JS9.Prefs.NAME = "Preferences"; // name of this plugin (2nd part of div class)
JS9.Prefs.WIDTH =  800;         // default width of window
JS9.Prefs.HEIGHT = 400;	        // default height of window

JS9.Prefs.imagesSchema = {
    "title": "Image Preferences",
    "description": "Preferences for each displayed image",
    "properties": {
	"colormap": {
	    "type": "string",
	    "helper": "default color map"
	},
	"contrast": {
	    "type": "number",
	    "helper": "default color contrast"
	},
	"bias": {
	    "type": "number",
	    "helper": "default color bias"
	},
	"scale": {
	    "type": "string",
	    "helper": "default scale algorithm"
	},
	"scaleclipping": {
	    "type": "string",
	    "helper": "'dataminmax' or 'zscale'"
	},
	"zscalecontrast": {
	    "type": "number",
	    "helper": "default from ds9"
	},
	"zscalesamples": {
	    "type": "number",
	    "helper": "default from ds9"
	},
	"zscaleline": {
	    "type": "number",
	    "helper": "default from ds9"
	},
	"exp": {
	    "type": "number",
	    "helper": "default exp value for scaling"
	},
	"wcssys": {
	    "type": "string",
	    "helper": "current WCS system"
	},
	"wcsunits": {
	    "type": "string",
	    "helper": "current WCS units"
	},
	"lcs": {
	    "type": "string",
	    "helper": "default logical coordinate system"
	},
	"opacity": {
	    "type": "number",
	    "helper": "opacity for images (0.0 to 1.0)"
	},
	"zoom": {
	    "type": "number",
	    "helper": "default zoom factor"
	},
	"zooms": {
	    "type": "number",
	    "helper": "how many zooms in each direction?"
	},
	"nancolor": {
	    "type": "string",
	    "helper": "6-digit #hex color for NaN values"
	},
	"overlay": {
	    "type": "boolean",
	    "helper": "display png/jpeg overlay?"
	},
	"listonchange": {
	    "type": "boolean",
	    "helper": "list after a region change?"
	},
	"whichonchange": {
	    "type": "string",
	    "helper": "list 'all' or 'selected'?"
	},
	"valpos": {
	    "type": "boolean",
	    "helper": "display value/position?"
	},
	"inherit": {
	    "type": "boolean",
	    "helper": "new images inherit current params?"
	},
	"invert": {
	    "type": "boolean",
	    "helper": "by default, invert colormap?"
	},
	"disable": {
	    "type": "mobject",
	    "helper": "array of core funcs to disable"
	}
    }
};
    
JS9.Prefs.regionsSchema = {
    "title": "Region Preferences",
    "description": "Preferences for each displayed region",
    "type": "object",
    "properties": {
	"iradius": {
	    "type": "number",
	    "helper": "annulus: initial inner radius"
	},
	"oradius": {
	    "type": "number",
	    "helper": "annulus: initial outer radius"
	},
	"nannuli": {
	    "type": "number",
	    "helper": "annulus: initial number of annuli"
	},
	"width": {
	    "type": "number",
	    "helper": "box: initial width"
	},
	"height": {
	    "type": "number",
	    "helper": "box: initial height"
	},
	"radius": {
	    "type": "number",
	    "helper": "circle: initial radius"
	},
	"r1": {
	    "type": "number",
	    "helper": "ellipse: initial radius1"
	},
	"r2": {
	    "type": "number",
	    "helper": "ellipse: initial radius2"
	},
	"angle": {
	    "type": "number",
	    "helper": "box, ellipse: initial angle in degrees"
	},
	"polypoints": {
	    "type": "mobject",
	    "helper": "polygon: x,y relative positions"
	},
	"linepoints": {
	    "type": "mobject",
	    "helper": "line: x,y relative positions"
	},
	"ptshape": {
	    "type": "string",
	    "helper": "point shape: box, circle, ellipse"
	},
	"ptsize": {
	    "type": "number",
	    "helper": "point: size"
	},
	"tags": {
	    "type": "string",
	    "helper": "initial tags for a region"
	},
	"strokeWidth": {
	    "type": "number",
	    "helper": "region stroke width"
	},
	"fontFamily": {
	    "type": "string",
	    "helper": "region font"
	},
	"fontSize": {
	    "type": "string",
	    "helper": "region font size"
	},
	"fontStyle": {
	    "type": "string",
	    "helper": "region font style"
	},
	"fontWeight": {
	    "type": "string",
	    "helper": "region font weight"
	},
	"textAlign": {
	    "type": "string",
	    "helper": "text alignment"
	}
    }
};

JS9.Prefs.gridSchema = {
    "title": "Grid Preferences",
    "description": "Preferences for wcs coordinate grids",
    "type": "object",
    "properties": {
	"strokeWidth": {
	    "type": "number",
	    "helper": "grid stroke width"
	},
	"lineColor": {
	    "type": "string",
	    "helper": "color of grid lines"
	},
	"raLines": {
	    "type": "number",
	    "helper": "approx. number of RA grid lines"
	},
	"raAngle": {
	    "type": "number",
	    "helper": "rotation for RA label"
	},
	"raSkip": {
	    "type": "number",
	    "helper": "number of RA lines to skip"
	},
	"decLines": {
	    "type": "number",
	    "helper": "approx. number of Dec grid lines"
	},
	"decAngle": {
	    "type": "number",
	    "helper": "rotation for Dec label"
	},
	"decSkip": {
	    "type": "number",
	    "helper": "number of Dec lines to skip"
	},
	"labelColor": {
	    "type": "string",
	    "helper": "color of text labels"
	},
	"labelFontFamily": {
	    "type": "string",
	    "helper": "label font"
	},
	"labelFontSize": {
	    "type": "string",
	    "helper": "label font size"
	},
	"labelFontStyle": {
	    "type": "string",
	    "helper": "label font style"
	},
	"labelFontWeight": {
	    "type": "string",
	    "helper": "label font weight"
	},
	"labelRAOffx": {
	    "type": "number",
	    "helper": "x offset of RA labels"
	},
	"labelRAOffy": {
	    "type": "number",
	    "helper": "y offset of RA labels"
	},
	"labelDecOffx": {
	    "type": "number",
	    "helper": "x offset of Dec labels"
	},
	"labelDecOffy": {
	    "type": "number",
	    "helper": "y offset of Dec labels"
	},
	"degPrec": {
	    "type": "number",
	    "helper": "precision for degree labels"
	},
	"sexaPrec": {
	    "type": "number",
	    "helper": "precision for sexagesimal labels"
	},
	"reduceDims": {
	    "type": "boolean",
	    "helper": "reduce lines of smaller image dim?"
	},
	"stride": {
	    "type": "number",
	    "helper": "fineness of grid lines"
	},
	"margin": {
	    "type": "number",
	    "helper": "edge margin for displaying a grid line"
	},
	"labelMargin": {
	    "type": "number",
	    "helper": "edge margin for displaying a label"
	},
	"cover": {
	    "type": "string",
	    "helper": "grid lines cover: display or image"
	}
    }
};

// schema for each source
JS9.Prefs.fitsSchema = {
    "title": "FITS Preferences",
    "description": "Preferences for processing FITS files",
    "properties": {
	"extlist": {
	    "type": "string",
	    "helper": "default binary table extensions"
	},
	"xdim": {
	    "type": "string",
	    "helper": "x dim of image section from table"
	},
	"ydim": {
	    "type": "string",
	    "helper": "y dim of image section from table"
	},
	"bin": {
	    "type": "string",
	    "helper": "bin factor for tables"
	},
	"ixdim": {
	    "type": "string",
	    "helper": "x dim of image section from image"
	},
	"iydim": {
	    "type": "string",
	    "helper": "y dim of image section from table"
	},
	"ibin": {
	    "type": "string",
	    "helper": "bin factor for images"
	},
	"binMode": {
	    "type": "string",
	    "helper": "'s' for summing, 'a' for averaging"
	},
	"clear": {
	    "type": "string",
	    "helper": "clear image's virtual file memory"
	}
    }
};

// catalogs schema
JS9.Prefs.catalogsSchema = {
    "title": "Catalogs Preferences",
    "description": "Preferences for loading tab-delimited catalogs",
    "properties": {
	"ras": {
	    "type": "mobject",
	    "helper": "RA patterns to look for in table"
	},
	"decs": {
	    "type": "mobject",
	    "helper": "Dec patterns to look for in table"
	},
	"wcssys": {
	    "type": "string",
	    "helper": "wcs system of catalog"
	},
	"shape": {
	    "type": "string",
	    "helper": "shape of objects"
	},
	"color": {
	    "type": "string",
	    "helper": "color of objects"
	},
	"width": {
	    "type": "number",
	    "helper": "width of box objects"
	},
	"height": {
	    "type": "number",
	    "helper": "height of box objects"
	},
	"radius": {
	    "type": "number",
	    "helper": "radius of circle objects"
	},
	"r1": {
	    "type": "number",
	    "helper": "r1 of ellipse objects"
	},
	"r2": {
	    "type": "number",
	    "helper": "r2 of ellipse objects"
	},
	"tooltip": {
	    "type": "string",
	    "helper": "tooltip format for objects"
	},
	"skip": {
	    "type": "string",
	    "helper": "comment character in table"
	}
    }
};

// global schema for the page
JS9.Prefs.globalsSchema = {
    "title": "Global Preferences",
    "description": "Global preferences for all JS9 displays",
    "properties": {
	"topColormaps": {
	    "type": "mobject",
	    "helper": "array of top-level colormaps"
	},
	"infoBox": {
	    "type": "mobject",
	    "helper": "array of infoBox items to display"
	},
	"statusBar": {
	    "type": "string",
	    "helper": "format of statusbar display"
	},
	"toolBar": {
	    "type": "mobject",
	    "helper": "array of toolbar tools to display"
	},
	"separate": {
	    "type": "mobject",
	    "helper": "options when separating images"
	},
	"mouseActions": {
	    "type": "mobject",
	    "helper": "array of mouse actions"
	},
	"touchActions": {
	    "type": "mobject",
	    "helper": "array of touch actions"
	},
	"keyboardActions": {
	    "type": "mobject",
	    "helper": "object containing keyboard actions"
	},
	"centerDivs": {
	    "type": "mobject",
	    "helper": "divs used when centering"
	},
	"resizeDivs": {
	    "type": "mobject",
	    "helper": "divs used when resizing"
	},
	"plot3d": {
	    "type": "mobject",
	    "helper": "options for 3D data cube plot"
	},
	"syncOps": {
	    "type": "mobject",
	    "helper": "ops to sync between images"
	},
	"wcsUnits": {
	    "type": "mobject",
	    "helper": "default units for WCS systems"
	},
	"copyWcsPosFormat": {
	    "type": "string",
	    "helper": "format string using: $ra $dec $sys"
	},
	"fallbackDisplay": {
	    "type": "string",
	    "helper": "can messages fallback to display win?"
	},
	"lightWinClose": {
	    "type": "string",
	    "helper": "ask,close,move when closing lightwin"
	},
	"fits2fits": {
	    "type": "string",
	    "helper": "make rep file?: true,false,size>N"
	},
	"dynamicSelect": {
	    "type": "string",
	    "helper": "select display: click, move, false"
	},
	"panRefreshLimit": {
	    "type": "number",
	    "helper": "# of shapes to minimze refresh during pan"
	},
	"regDisplay": {
	    "type": "string",
	    "helper": "show regions in 'lightwin' or 'display'"
	},
	"regMenuCreate": {
	    "type": "boolean",
	    "helper": "region menu selections create regions?"
	},
	"regSyncTextColor": {
	    "type": "boolean",
	    "helper": "sync region text color with main color?"
	},
	"regToClipboard": {
	    "type": "boolean",
	    "helper": "region mods to pseudo-clipboard?"
	},
	"regListDCoords": {
	    "type": "boolean",
	    "helper": "list regions preserving dcoords? "
	},
	"metaClickPan": {
	    "type": "boolean",
	    "helper": "meta-click pans to mouse position?"
	},
	"mousetouchZoom": {
	    "type": "boolean",
	    "helper": "scroll/pinch to zoom?"
	},
	"mousetouchLimit": {
	    "type": "boolean",
	    "helper": "limit zoom-out to the size of the image?"
	},
	"clickToFocus": {
	    "type": "boolean",
	    "helper": "click display to focus?"
	},
	"valposDCoords": {
	    "type": "boolean",
	    "helper": "valpos shows display coords?"
	},
	"toolbarTooltips": {
	    "type": "boolean",
	    "helper": "show tooltips in Toolbar plugin?"
	},
	"updateTitlebar": {
	    "type": "boolean",
	    "helper": "update titlebar with image id?"
	},
	"logoDisplay": {
	    "type": "boolean",
	    "helper": "show JS9 logo?"
	},
	"reloadRefresh": {
	    "type": "boolean",
	    "helper": "does a reload refresh the data?"
	},
	"reloadRefreshReg": {
	    "type": "boolean",
	    "helper": "reloading regions file removes prev?"
	},
	"syncReciprocate": {
	    "type": "boolean",
	    "helper": "reciprocal image sync'ing?"
	},
	"syncWCS": {
	    "type": "boolean",
	    "helper": "sync using wcs (e.g. pan)?"
	},
	"nextImageMask": {
	    "type": "boolean",
	    "helper": "nextImage() show image masks?"
	},
	"panWithinDisplay": {
	    "type": "boolean",
	    "helper": "keep panned image within the display?"
	},
	"pannerDirections": {
	    "type": "boolean",
	    "helper": "show direction vectors in panner?"
	},
	"magnifierRegions": {
	    "type": "boolean",
	    "helper": "show regions in magnifier?"
	},
	"xeqPlugins": {
	    "type": "boolean",
	    "helper": "execute plugin callbacks?"
	},
	"extendedPlugins": {
	    "type": "boolean",
	    "helper": "execute extended plugins?"
	},
	"intensivePlugins": {
	    "type": "boolean",
	    "helper": "execute intensive plugins?"
	},
	"svgBorder": {
	    "type": "boolean",
	    "helper": "add border when exporting SVG?"
	}
    }
};

// favorites schema for the page
JS9.Prefs.favoritesSchema = {
    "title": "Favorites Preferences",
    "description": "Favorites for all JS9 displays",
    "properties": {
	"scales": {
	    "type": "mobject",
	    "helper": "array of favorite scales"
	},
	"colormaps": {
	    "type": "mobject",
	    "helper": "array of favorite colormaps"
	},
	"regions": {
	    "type": "mobject",
	    "helper": "array of favorite regions"
	},
	"wcs": {
	    "type": "mobject",
	    "helper": "array of favorite wcs systems"
	}
    }
};

// scheme for desktop apps only
JS9.Prefs.desktopSchema = {
    "title": "Desktop App Preferences",
    "description": "Desktop app preferences will take effect on restart",
    "properties": {
	"webpage": {
	    type: "string",
	    "helper": "web page to display"
	},
	"width": {
	    type: "number",
	    "helper": "width of desktop window"
	},
	"height": {
	    type: "number",
	    "helper": "height of desktop window"
	},
	"hostfs": {
	    type: "boolean",
	    "helper": "utilize host file system?"
	},
	"debug": {
	    type: "boolean",
	    "helper": "display Chrome debugger at startup?"
	}
    }
};

// source object for preferences
JS9.Prefs.sources = [
    {name: "globals",  schema: JS9.Prefs.globalsSchema},
    {name: "images",   schema: JS9.Prefs.imagesSchema},
    {name: "fits",     schema: JS9.Prefs.fitsSchema},
    {name: "regions",  schema: JS9.Prefs.regionsSchema},
    {name: "grid",     schema: JS9.Prefs.gridSchema},
    {name: "catalogs", schema: JS9.Prefs.catalogsSchema},
    {name: "favorites", schema: JS9.Prefs.favoritesSchema},
    {name: "desktop",  schema: JS9.Prefs.desktopSchema}
];

// init preference plugin
JS9.Prefs.init = function(){
    let i, s, obj, key, props, sources, source, id, pid, html, prompt;
    // create the div containing one tab for each of the sources
    sources = JS9.Prefs.sources;
    pid = `${this.id}prefsTabs`;
    html = "<div style='padding: 8px'>";
    html += `<div id='${pid}' class='indentmenu'>\n`;
    html += "<ul>";
    // create a tab for each source
    for(i=0; i<sources.length; i++){
	source = sources[i];
	// desktop is only for apps that have command line opts
	if( source.name === "desktop" && !JS9.cmdlineOpts ){
	    continue;
	}
	id = this.id + JS9.Prefs.CLASS + JS9.Prefs.NAME + source.name;
	html += `  <li><a href='#' rel='${id}Div'>${source.name}</a></li>\n`;
    }
    html += "</ul>";
    html += "<br style='clear:left'></div></div><p>\n";
    // create each param form (displayed by clicking each tab)
    for(i=0; i<sources.length; i++){
	source = sources[i];
	// desktop is only for apps that have command line opts
	if( source.name === "desktop" && !JS9.cmdlineOpts ){
	    continue;
	}
	id = this.id + JS9.Prefs.CLASS + JS9.Prefs.NAME + source.name;
	// source-specific pre-processing
	switch( source.name ){
	case "images":
	    source.data = JS9.imageOpts;
	    break;
	case "regions":
	    source.data = JS9.Regions.opts;
	    break;
	case "grid":
	    source.data = JS9.Grid.opts;
	    break;
	case "fits":
	    // make up "nicer" option values from raw object
	    source.data = {extlist: JS9.fits.options.extlist,
			   xdim: JS9.fits.options.table.xdim,
			   ydim: JS9.fits.options.table.ydim,
			   bin: JS9.fits.options.table.bin,
			   ixdim: JS9.fits.options.image.xdim,
			   iydim: JS9.fits.options.image.ydim,
			   ibin: JS9.fits.options.image.bin,
			   binMode: JS9.globalOpts.binMode,
			   clear: JS9.globalOpts.clearImageMemory};
	    break;
	case "catalogs":
	    source.data = JS9.globalOpts.catalogs;
	    break;
	case "globals":
	    source.data = JS9.globalOpts;
	    break;
	case "favorites":
	    source.data = JS9.favorites;
	    break;
	case "desktop":
	    source.data = JS9.cmdlineOpts;
	    break;
	default:
	    JS9.error(`unknown source for preferences: ${source.name}`);
	    break;
	}
	html += `<div id='${id}Div' class='tabcontent'>`;
	html += `<form id='${id}Form' class='js9AnalysisForm' style='overflow: hidden'>`;
	html += `<center><b>${source.schema.description}</b></center><p>`;
	props = source.schema.properties;
	for( key in props ){
	    if( Object.prototype.hasOwnProperty.call(props, key) ){
		obj = props[key];
		prompt = obj.prompt || `${key}:`;
		switch(obj.type){
		case "boolean":
		    if( source.data[key] ){
			s = "checked";
		    } else {
			s = "";
		    }
		    html += `<div class='linegroup'><span class='column_R1'><b>${prompt}</b></span><span class='column_R2'><input type='checkbox' name='${key}' value='true' ${s}></span><span class='column_R4L'>${obj.helper}</span></div>`;
		    break;
		default:
		    if( typeof source.data[key] === "object" ){
			if( obj.type === "mobject" ){
			    s = JSON.stringify(source.data[key], null, 2);
			} else {
			    s = JSON.stringify(source.data[key]);
			}
		    } else if( JS9.isNull(source.data[key]) ){
			s = "";
		    } else {
			s = source.data[key];
		    }
		    if( obj.type === "mobject" ){
			html += `<div class='linegroup' style='height:64px'><span class='column_R1'><b>${prompt}</b></span><span class='column_R2l'><textarea name='${key}' class='text_R' rows='5' style='overflow-x: hidden; resize: none'>${s}</textarea></span><span class='column_R4L'>${obj.helper}</span></div>`;
		    } else {
			html += `<div class='linegroup'><span class='column_R1'><b>${prompt}</b></span><span class='column_R2l'><input type='text' name='${key}' class='text_R' value='${s}'></span><span class='column_R4L'>${obj.helper}</span></div>`;
		    }
		    break;
		}
	    }
	}
	if( !JS9.cmdlineOpts ){
	    html += `<input id='${this.id}_applyPrefs' name='Apply' type='button' class='button' value='Apply' onclick='JS9.Prefs.applyForm.call(this);' style='margin: 8px'>`;
	}
	// manage stored preferences
	if( Object.prototype.hasOwnProperty.call(window, "localStorage") &&
	    JS9.globalOpts.localStorage                                  ){
	    html += `<input id='${this.id}_savePrefs' name='Save' type='button' class='button' value='Save' onclick='JS9.Prefs.saveForm.call(this)' style='margin: 8px'>`;
	    html += `<input id='${this.id}_showPrefs' name='Show' type='button' class='button' value='Show Saved' onclick='JS9.Prefs.showForm.call(this)' style='margin: 8px'>`;
	    html += "<input id='delete' name='Delete' type='button' class='button' value='Delete Saved' onclick='JS9.Prefs.deleteForm.call(this)' style='margin: 8px'>";
	}
	// light windows get a close button
	if( this.winType === "light" ){
	    html += `<input id='${this.id}_closePrefs' name='Close' type='button' class='button' value='Close' onclick='const form = $(this).closest("form"); const winid = form.data("winid"); winid.close(); return false;' style='float: right; margin: 8px'>`;
	}
	html += "</form>";
	html += "</div>";
    }
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // set the html for this div
    this.divjq.html(html);
    // for each source, set data values which we will need in button callbacks
    for(i=0; i<sources.length; i++){
	source = sources[i];
	id = this.id + JS9.Prefs.CLASS + JS9.Prefs.NAME + source.name;
	$( `#${id}Form`).data("display", this.display);
	$( `#${id}Form`).data("source", source);
	if( this.winType === "light" ){
	    $( `#${id}Form`).data("winid", this.winHandle);
	}
    }
    // now init the tab content
    this.tabs = new ddtabcontent(pid); //enter ID of Tab Container
    this.tabs.setpersist(false); //toogle persistence of the tabs' state
    this.tabs.setselectedClassTarget("link"); //"link" or "linkparent"
    this.tabs.init();
};

// action for Apply in Form
JS9.Prefs.applyForm = function(){
    let arr, arr2;
    const form = $(this).closest("form");
    const display = form.data("display");
    const source = form.data("source");
    const winid = form.data("winid");
    arr = form.serializeArray();
    arr2 = arr.concat($(`#${form.attr("id")} input[type=checkbox]:not(:checked)`).map((i, e) => {return {"name": e.name, "value": "false"};}).get());
    JS9.Prefs.processForm(source, arr2, display, winid);
    return false;
};

// action for Save in Form
JS9.Prefs.saveForm = function(){
    let props, key;
    const form = $(this).closest("form");
    const source = form.data("source");
    const opts = {cmd: "desktop", mode: "save"};
    const saveobj = {};
    JS9.Prefs.applyForm.call(this);
    // desktop handled specially
    if( source.name === "desktop" ){
	if( window.electron ){
	    window.setTimeout(() => {
		try{
		    opts.cmdlineOpts = JS9.cmdlineOpts;
		    window.electron.sendMsg(opts);
		}
		catch(e){ JS9.error("could not save desktop form", e); }
	    }, JS9.TIMEOUT);
	} else {
	    JS9.error("desktop save is only available for the JS9 desktop app");
	}
	return false;
    }
    try{
	// only save props in the schema: e.g., don't save all of globalOpts
	props = source.schema.properties;
	for( key in props ){
	    if( Object.prototype.hasOwnProperty.call(props, key) ){
		saveobj[key] = source.data[key];
	    }
	}
	localStorage.setItem(source.name, JSON.stringify(saveobj, null, 2));
	JS9.userOpts[source.name] = localStorage.getItem(source.name);
    }
    catch(e){ JS9.error(`could not save prefs: ${source.name}`); }
    return false;
};

// action for Show in Form
JS9.Prefs.showForm = function(){
    let s, t;
    const form = $(this).closest("form");
    const source = form.data("source");
    // desktop handled specially
    if( source.name === "desktop" ){
	if( JS9.cmdlineOpts ){
	    s = JSON.stringify(JS9.cmdlineOpts, null, 4);
	    t = `<pre>${s}</pre>`;
	} else {
	    t = `<p><center>No saved prefs: ${source.name}</center>`;
	}
    } else {
	try{ s = localStorage.getItem(source.name); }
	catch(e){ /* empty */ }
	if( s && (s !== "null") ){
	    t = `<pre>${s}</pre>`;
	} else {
	    t = `<p><center>No saved prefs: ${source.name}</center>`;
	}
    }
    JS9.lightWin(`savedPrefs${JS9.uniqueID()}`, "inline", t, 
		 `Saved prefs: ${source.name}`, 
		 JS9.lightOpts[JS9.LIGHTWIN].textWin);
    return false;
};

// action for Delete in Form
JS9.Prefs.deleteForm = function(){
    const form = $(this).closest("form");
    const source = form.data("source");
    const opts = {cmd: "desktop", mode: "remove"};
    // desktop handled specially
    if( source.name === "desktop" ){
	if( window.electron ){
	    window.setTimeout(() => {
		try{ window.electron.sendMsg(opts); }
		catch(e){ JS9.error("could not save desktop form", e); }
	    }, JS9.TIMEOUT);
	} else {
	    JS9.error("desktop save is only available for the JS9 desktop app");
	}
	return false;
    }
    try{ localStorage.removeItem(source.name);
	delete JS9.userOpts[source.name]; }
    catch(e){ /* empty */ }
    return false;
};

// process new preferences in the preference form
// eslint-disable-next-line no-unused-vars
JS9.Prefs.processForm = function(source, arr, display, winid){
    let i, j, s, key, val, obj, rlayer;
    const len = arr.length;
    // source-specific pre-processing
    switch( source.name ){
    case "images":
	obj = JS9.imageOpts;
	break;
    case "regions":
	obj = JS9.Regions.opts;
	break;
    case "grid":
	obj = JS9.Grid.opts;
	break;
    case "fits":
	obj = JS9.fits.options;
	break;
    case "catalogs":
	obj = JS9.globalOpts.catalogs;
	break;
    case "globals":
	obj = JS9.globalOpts;
	break;
    case "favorites":
	obj = JS9.favorites;
	break;
    case "desktop":
	obj = JS9.cmdlineOpts;
	break;
    default:
	JS9.error(`unknown source for preferences: ${source.name}`);
	break;
    }
    for(i=0; i<len; i++){
	key = arr[i].name;
	val = arr[i].value;
	if( val === "true" ){
	    val = true;
	}
	if( val === "false" ){
	    val = false;
	}
	switch( typeof obj[key] ){
	case "boolean":
	    break;
	case "number":
	    val = parseFloat(val);
	    break;
	case "object":
	    try{ val = JSON.parse(val); }
	    catch(e){ JS9.error(`invalid JSON (see jsonlint.com): ${val}`, e); }
	    break;
	default:
	    break;
	}
	if( obj[key] !== val                               &&
	    String(obj[key]).trim() !== String(val).trim() ){
	    switch( source.name ){
	    case "images":
		// set new option value
	        obj[key] = val;
		// set the current image's internal params as well
		if( display && display.image ){
	            if( key === "disable" ){
			// overwrite the current disable list
			display.image.params.disable = val;
		    } else {
			display.image.setParam(key, val);
		    }
		}
	        break;
	    case "regions":
		// set new option value
	        obj[key] = val;
		// change option value in each display's region layer as well
		for(j=0; j<JS9.displays.length; j++){
		    rlayer = JS9.displays[j].layers.regions;
		    if( rlayer ){
			rlayer.opts[key] = val;
		    }
		}
		break;
	    case "fits":
	        // put our "nicer" option values back into raw object
	        // note the values are still strings
	        switch(key){
 	        case "xdim":
		    obj.table.xdim = Math.floor(parseFloat(val));
	            break;
	        case "ydim":
		    obj.table.ydim = Math.floor(parseFloat(val));
	            break;
	        case "bin":
		    obj.table.bin = Math.floor(parseFloat(val));
	            break;
	        case "ixdim":
		    obj.image.xdim = Math.floor(parseFloat(val));
	            break;
	        case "iydim":
		    obj.image.ydim = Math.floor(parseFloat(val));
	            break;
	        case "ibin":
		    obj.image.bin = Math.floor(parseFloat(val));
	            break;
		case "binMode":
		    JS9.globalOpts.binMode = val;
		    break;
		case "clear":
		    JS9.globalOpts.clearImageMemory = val;
		    break;
	        default:
	            obj[key] = val;
	            break;
	        }
		source.data[key] = val;
	        break;
	    case "catalogs":
	        switch(key){
 	        case "skip":
		    // add back blank lines
		    obj[key] = `${val}\n`;
		    break;
		default:
	            obj[key] = val;
		    break;
		}
		break;
	    case "globals":
	        switch(key){
 	        case "toolBar":
	            // set new option value
	            obj[key] = val;
		    // re-init toolbar
		    JS9.SetToolbar("init");
		    break;
 	        case "toolbarTooltips":
	            // set new option value
	            obj[key] = val;
		    break;
 	        case "logoDisplay":
	            // set new option value
	            obj[key] = val;
		    // re-init toolbar
		    JS9.SetToolbar("init");
		    s = val ? "block" : "none";
		    for(j=0; j<JS9.displays.length; j++){
			JS9.displays[j].iconjq.css("display", s);
		    }
		    break;
		case "separate":
	            // set new option value
	            obj[key] = val;
		    break;
		default:
	            // set new option value
	            obj[key] = val;
		    break;
		}
		break;
	    case "favorites":
		// set new option value
	        obj[key] = val;
		break;
	    case "desktop":
		// set new option value
	        obj[key] = val;
		break;
	    default:
		// set new option value
	        obj[key] = val;
	        break;
	    }
	}
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	for(j=0; j<JS9.displays.length; j++){
	    if( JS9.displays[j].image ){
		JS9.displays[j].image.xeqPlugins("image", "onupdateprefs");
	    }
	}
    }
};

// add preference plugin into JS9
JS9.RegisterPlugin(JS9.Prefs.CLASS, JS9.Prefs.NAME, JS9.Prefs.init,
		   {menu: "file",
		    menuItem: "Preferences",
		    help: "help/prefs.html",
		    winTitle: "User Preferences",
		    winResize: true,
		    winDims: [JS9.Prefs.WIDTH, JS9.Prefs.HEIGHT]});
