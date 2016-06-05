/*
 * JS9 preferences module (14 April 2015)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf, ddtabcontent */

// To specify the JS9 display instance to link to a given PREFS div,
// use the HTML5 dataset syntax: 
//    <div class="JS9Prefs" data-js9id="JS9"></div>

// create our namespace, and specify some meta-information and params
JS9.Prefs = {};
JS9.Prefs.CLASS = "JS9";        // class of plugins (1st part of div class)
JS9.Prefs.NAME = "Preferences"; // name of this plugin (2nd part of div class)
JS9.Prefs.WIDTH =  750;         // default width of window
JS9.Prefs.HEIGHT = 250;	        // default height of window

JS9.Prefs.imagesSchema = {
    "title": "Image Preferences",
    "description": "preferences for each JS9 image",
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
	"alpha": {
	    "type": "number",
	    "helper": "alpha for images"
	},
	"alpha1": {
	    "type": "number",
	    "helper": "alpha for masked pixels"
	},
	"alpha2": {
	    "type": "number",
	    "helper": "alpha for unmasked pixels"
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
	"valpos": {
	    "type": "boolean",
	    "helper": "display value/position?"
	},
	"invert": {
	    "type": "boolean",
	    "helper": "by default, invert colormap?"
	}

    }
};
    
JS9.Prefs.regionsSchema = {
    "title": "Region Preferences",
    "description": "preferences for each JS9 region",
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

// schema for each source
JS9.Prefs.fitsSchema = {
    "title": "FITS Preferences",
    "description": "FITS preferences in JS9",
    "properties": {
	"extlist": {
	    "type": "string",
	    "helper": "default binary table extensions"
	},
	"xdim": {
	    "type": "string",
	    "helper": "x dimension of extracted image"
	},
	"ydim": {
	    "type": "string",
	    "helper": "y dimension of extracted image"
	},
    }
};

// display schema for the page
JS9.Prefs.displaysSchema = {
    "title": "Display Preferences",
    "description": "preferences for each JS9 display in this page",
    "properties": {
	"mouseActions": {
	    "type": "object",
	    "helper": "array of mouse actions"
	},
	"touchActions": {
	    "type": "object",
	    "helper": "array of touch actions"
	},
	"mousetouchZoom": {
	    "type": "boolean",
	    "helper": "scroll/pinch to zoom?"
	},
    }
};

// source object for preferences
JS9.Prefs.sources = [
    {name: "images",   schema: JS9.Prefs.imagesSchema},
    {name: "regions",  schema: JS9.Prefs.regionsSchema},
    {name: "fits",     schema: JS9.Prefs.fitsSchema},
    {name: "displays", schema: JS9.Prefs.displaysSchema}
];

// init preference plugin
JS9.Prefs.init = function(width, height){
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
    html += "<br style='clear:left'/></div></div><p>\n";
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
	case "fits":
	    // make up "nicer" option values from raw object
	    source.data = {extlist: JS9.fits.options.extlist,
			   xdim: JS9.fits.options.table.nx, 
			   ydim: JS9.fits.options.table.ny};
	    break;
	case "displays":
	    source.data = {mouseActions: JS9.globalOpts.mouseActions,
			   touchActions: JS9.globalOpts.touchActions,
			   mousetouchZoom: JS9.globalOpts.mousetouchZoom};
	    break;
	default:
	    break;
	}
	html += sprintf("<div id='%s' class='tabcontent'>", id + "Div");
	html += sprintf("<form id='%s' class='js9AnalysisForm' style='max-height: %spx; overflow: hidden'>", id + "Form", this.height-90);
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
			s = JSON.stringify(source.data[key]);
		    } else {
			s = source.data[key];
		    }
		    html += sprintf("<div class='linegroup'><span class='column_R1'><b>%s</b></span><span class='column_R2l'><input type='text' name='%s' class='text_R' value='%s'/></span><span class='column_R4l'>%s</span></div>", prompt, key, s, obj.helper);
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
    case "fits":
	obj = JS9.fits.options;
	break;
    case "displays":
	obj = JS9.globalOpts;
	break;
    }
    for(i=0; i<len; i++){
	key = arr[i].name;
	val = arr[i].value;
	switch( typeof obj[key] ){
	case "boolean":
	    if( val === "true" ){
		val = true;
	    }
	    if( val === "false" ){
		val = false;
	    }
	    break;
	case "number":
	    val = parseFloat(val);
	    break;
	case "object":
	    val = JSON.parse(val);
	    break;
	default:
	    break;
	}
	if( obj[key] !== val ){
	    switch( source.name ){
	    case "images":
		// set new option value
	        obj[key] = val;
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
		    obj.table.nx = parseFloat(val);
	            break;
	        case "ydim":
		    obj.table.ny = parseFloat(val);
	            break;
	        default:
	            obj[key] = val;
	            break;
	        }
		source.data[key] = val;
	        break;
	    case "displays":
	        // put our "nicer" option values back into raw object
	        JS9.globalOpts[key] = val;
		// change option value in this display as well
		for(j=0; j<JS9.displays.length; j++){
		    JS9.displays[j][key] = val;
		}
		source.data[key] = val;
		break;
	    default:
		// set new option value
	        obj[key] = val;
	        break;
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
