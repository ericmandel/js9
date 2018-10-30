/*
 * JS9 preferences module (14 April 2015)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, JS9, sprintf, ddtabcontent */

// To specify the JS9 display instance to link to a given PREFS div,
// use the HTML5 dataset syntax: 
//    <div class="JS9Prefs" data-js9id="JS9"></div>

// create our namespace, and specify some meta-information and params
JS9.Prefs = {};
JS9.Prefs.CLASS = "JS9";        // class of plugins (1st part of div class)
JS9.Prefs.NAME = "Preferences"; // name of this plugin (2nd part of div class)
JS9.Prefs.WIDTH =  750;         // default width of window
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
	    "helper": "default WCS sys"
	},
	"wcsunits": {
	    "type": "string",
	    "helper": "default WCS units"
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
	    "helper": "array of core functions to disable"
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
	"ptshape": {
	    "type": "string",
	    "helper": "point shape: box, circle, ellipse"
	},
	"ptsize": {
	    "type": "number",
	    "helper": "point size"
	},
	"points": {
	    "type": "string",
	    "helper": "array of x,y relative positions"
	},
	"angle": {
	    "type": "number",
	    "helper": "box, ellipse: initial angle in degrees"
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
	"syncOps": {
	    "type": "mobject",
	    "helper": "ops to sync between images"
	},
	"copyWcsPosFormat": {
	    "type": "string",
	    "helper": "format string using: $ra $dec $sys"
	},
	"regionConfigSize": {
	    "type": "string",
	    "helper": "size of region dialog: small, medium"
	},
	"fits2fits": {
	    "type": "string",
	    "helper": "make rep file?: true,false,size>N"
	},
	"fits2png": {
	    "type": "boolean",
	    "helper": "convert FITS to PNG rep files?"
	},
	"mousetouchZoom": {
	    "type": "boolean",
	    "helper": "scroll/pinch to zoom?"
	},
	"toolbarTooltips": {
	    "type": "boolean",
	    "helper": "show tooltips in Toolbar plugin?"
	},
	"syncReciprocate": {
	    "type": "boolean",
	    "helper": "reciprocal image sync'ing?"
	},
	"magnifierRegions": {
	    "type": "boolean",
	    "helper": "show regions in magnifier?"
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
    {name: "catalogs", schema: JS9.Prefs.catalogsSchema}
];

// init preference plugin
JS9.Prefs.init = function(){
    var i, s, obj, key, props, sources, source, id, pid, html, prompt;
    // create the div containing one tab for each of the sources
    sources = JS9.Prefs.sources;
    pid = this.id + 'prefsTabs';
    html = "<div style='padding: 8px'>";
    html += sprintf("<div id='%s' class='indentmenu'>\n", pid);
    html += "<ul>";
    // create a tab for each source
    for(i=0; i<sources.length; i++){
	source = sources[i];
	id = this.id + JS9.Prefs.CLASS + JS9.Prefs.NAME + source.name;
	html += sprintf("  <li><a href='#' rel='%s'>%s</a></li>\n", 
			id + "Div", source.name);
    }
    html += "</ul>";
    html += "<br style='clear:left'></div></div><p>\n";
    // create each param form (displayed by clicking each tab)
    for(i=0; i<sources.length; i++){
	source = sources[i];
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
	    source.data = {ras: JS9.globalOpts.catalogs.ras,
			   decs: JS9.globalOpts.catalogs.decs,
			   wcssys: JS9.globalOpts.catalogs.wcssys,
			   shape: JS9.globalOpts.catalogs.shape,
			   color: JS9.globalOpts.catalogs.color,
			   width: JS9.globalOpts.catalogs.width,
			   height: JS9.globalOpts.catalogs.height,
			   radius: JS9.globalOpts.catalogs.radius,
			   r1: JS9.globalOpts.catalogs.r1,
			   r2: JS9.globalOpts.catalogs.r2,
			   tooltip: JS9.globalOpts.catalogs.tooltip,
			   skip: JS9.globalOpts.catalogs.skip};
	    break;
	case "globals":
	    source.data = {fits2png: JS9.globalOpts.fits2png,
			   fits2fits: JS9.globalOpts.fits2fits,
			   toolbarTooltips: JS9.globalOpts.toolbarTooltips,
			   syncReciprocate: JS9.globalOpts.syncReciprocate,
			   magnifierRegions: JS9.globalOpts.magnifierRegions,
			   topColormaps: JS9.globalOpts.topColormaps,
			   mouseActions: JS9.globalOpts.mouseActions,
			   touchActions: JS9.globalOpts.touchActions,
			   keyboardActions: JS9.globalOpts.keyboardActions,
			   centerDivs: JS9.globalOpts.centerDivs,
			   resizeDivs: JS9.globalOpts.resizeDivs,
			   syncOps: JS9.globalOpts.syncOps,
			   mousetouchZoom: JS9.globalOpts.mousetouchZoom,
			   copyWcsPosFormat: JS9.globalOpts.copyWcsPosFormat,
			   regionConfigSize: JS9.globalOpts.regionConfigSize,
			   infoBox: JS9.globalOpts.infoBox,
			   toolBar: JS9.globalOpts.toolBar,
			   separate: JS9.globalOpts.separate};
	    break;
	default:
	    break;
	}
	html += sprintf("<div id='%s' class='tabcontent'>", id + "Div");
	html += sprintf("<form id='%s' class='js9AnalysisForm' style='max-height: %spx; overflow: hidden'>", id + "Form", this.height-90);
	html += sprintf("<center><b>%s</b></center><p>",
			source.schema.description);
	props = source.schema.properties;
	for( key in props ){
	    if( props.hasOwnProperty(key) ){
		obj = props[key];
		prompt = obj.prompt || key + ":";
		switch(obj.type){
		case "boolean":
		    if( source.data[key] ){
			s = "checked";
		    } else {
			s = "";
		    }
		    html += sprintf("<div class='linegroup'><span class='column_R1'><b>%s</b></span><span class='column_R2'><input type='checkbox' name='%s' value='true' %s></span><span class='column_R4l'>%s</span></div>", prompt, key, s, obj.helper);
		    break;
		default:
		    if( typeof source.data[key] === "object" ){
			if( obj.type === "mobject" ){
			    s = JSON.stringify(source.data[key], null, 2);
			} else {
			    s = JSON.stringify(source.data[key]);
			}
		    } else {
			s = source.data[key];
		    }
		    if( obj.type === "mobject" ){
			html += sprintf("<div class='linegroup' style='height:64px'><span class='column_R1'><b>%s</b></span><span class='column_R2l'><textarea name='%s' class='text_R' rows='5' style='overflow-x: hidden; resize: none'>%s</textarea></span><span class='column_R4l'>%s</span></div>", prompt, key, s, obj.helper);
		    } else {
			html += sprintf("<div class='linegroup'><span class='column_R1'><b>%s</b></span><span class='column_R2l'><input type='text' name='%s' class='text_R' value='%s'></span><span class='column_R4l'>%s</span></div>", prompt, key, s, obj.helper);
		    }
		    break;
		}
	    }
	}
	html += "<input id='" + this.id + "_applyPrefs' name='Apply' type='button' class='button' value='Apply' onclick='JS9.Prefs.applyForm.call(this);' style='margin: 8px'>";
	// manage stored preferences
	if( window.hasOwnProperty("localStorage") ){
	    html += "<input id='" + this.id + "_savePrefs' name='Save' type='button' class='button' value='Save' onclick='JS9.Prefs.saveForm.call(this)' style='margin: 8px'>";
	    html += "<input id='" + this.id + "_showPrefs' name='Show' type='button' class='button' value='Show Saved' onclick='JS9.Prefs.showForm.call(this)' style='margin: 8px'>";
	    html += "<input id='delete' name='Delete' type='button' class='button' value='Delete Saved' onclick='JS9.Prefs.deleteForm.call(this)' style='margin: 8px'>";
	}
	// light windows get a close button
	if( this.winType === "light" ){
	    html += "<input id='" + this.id + "_closePrefs' name='Close' type='button' class='button' value='Close' onclick='var form = $(this).closest(\"form\"); var winid = form.data(\"winid\"); winid.close(); return false;' style='float: right; margin: 8px'>";
	}
	html += "</form>";
	html += "</div>";
    }
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // set the html for this div
    this.divjq.html(html);
    // for each source, set data values that we will need in button callbacks
    for(i=0; i<sources.length; i++){
	source = sources[i];
	id = this.id + JS9.Prefs.CLASS + JS9.Prefs.NAME + source.name;
	$( "#" + id + "Form").data("display", this.display);
	$( "#" + id + "Form").data("source", source);
	if( this.winType === "light" ){
	    $( "#" + id + "Form").data("winid", this.winHandle);
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
    var form = $(this).closest("form");
    var arr = form.serializeArray();
    var display = form.data("display");
    var source = form.data("source");
    var winid = form.data("winid");
    arr = arr.concat($("#" + form.attr("id") + " input[type=checkbox]:not(:checked)").map(function(){
	return {"name": this.name, "value": "false"};
    }).get());
    JS9.Prefs.processForm(source, arr, display, winid);
    return false;
};

// action for Save in Form
JS9.Prefs.saveForm = function(){
    var form = $(this).closest("form");
    var source = form.data("source");
    JS9.Prefs.applyForm.call(this);
    try{ localStorage.setItem(source.name, JSON.stringify(source.data,null,2));
	 JS9.userOpts[source.name] = localStorage.getItem(source.name); }
    catch(e){ JS9.error("could not save prefs: " + source.name); }
    return false;
};

// action for Show in Form
JS9.Prefs.showForm = function(){
    var s, t;
    var form = $(this).closest("form");
    var source = form.data("source");
    try{ s = localStorage.getItem(source.name); }
    catch(ignore){}
    if( s && (s !== "null") ){
	t = "<pre>" + s + "</pre>";
    } else {
	t = sprintf("<p><center>No saved prefs: %s</center>", source.name);
    }
    JS9.lightWin("savedPrefs" + JS9.uniqueID(), "inline", t, 
		 "Saved prefs: "+source.name, 
		 JS9.lightOpts[JS9.LIGHTWIN].textWin);
    return false;
};

// action for Delete in Form
JS9.Prefs.deleteForm = function(){
    var form = $(this).closest("form");
    var source = form.data("source");
    try{ localStorage.removeItem(source.name);
	delete JS9.userOpts[source.name]; }
    catch(ignore){}
    return false;
};

// process new preferences in the preference form
// eslint-disable-next-line no-unused-vars
JS9.Prefs.processForm = function(source, arr, display, winid){
    var i, j, key , val, obj, rlayer;
    var len = arr.length;
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
	    catch(e){ JS9.error("invalid JSON (see jsonlint.com): "+val, e); }
	    break;
	default:
	    break;
	}
	if( obj[key] !== val ){
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
	        // note that the values are still strings
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
		    obj[key] = val + "\n";
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
		    source.data[key] = val;
		    break;
 	        case "toolbarTooltips":
	            // set new option value
	            obj[key] = val;
		    // re-init toolbar
		    JS9.SetToolbar("init");
		    source.data[key] = val;
		    break;
		case "separate":
	            // set new option value
	            obj[key] = val;
		    source.data[key] = val;
		    break;
		default:
	            // set new option value
	            obj[key] = val;
		    source.data[key] = val;
		    break;
		}
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
		   {menuItem: "Preferences",
		    help: "help/prefs.html",
		    winTitle: "User Preferences",
		    winResize: true,
		    winDims: [JS9.Prefs.WIDTH, JS9.Prefs.HEIGHT]});
