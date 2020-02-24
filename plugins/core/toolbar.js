/*
 * toolbar plugin (February 6, 2018)
 */

/*global $, JS9 */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Toolbar = {};
JS9.Toolbar.CLASS = "JS9";        // class of plugins (1st part of div class)
JS9.Toolbar.NAME = "Toolbar";    // name of plugin (2nd part of div class)
JS9.Toolbar.WIDTH =  512;	 // width of light window
JS9.Toolbar.HEIGHT = 36;         // height of light window
JS9.Toolbar.BASE = JS9.Toolbar.CLASS + JS9.Toolbar.NAME;
JS9.Toolbar.IMAGEWIDTH  = 24;
JS9.Toolbar.IMAGEHEIGHT = 24;
JS9.Toolbar.TOOLBARHEIGHT = 36;
// hacky offsets to place tooltips nicely
// why are lighwins different from static elements?
JS9.Toolbar.TOOLTIPX = 30;
JS9.Toolbar.TOOLTIPY = 50;
JS9.Toolbar.TOOLTIPLX = 30;
JS9.Toolbar.TOOLTIPLY = 82;

JS9.Toolbar.tools = [
  {
    "name": "linear",
    "tip": "linear scale",
    "cmd": "SetScale",
    "args": ["linear"]
  },
  {
    "name": "log",
    "tip": "log scale",
    "cmd": "SetScale",
    "args": ["log"]
  },
  {
    "name": "histeq",
    "tip": "histogram equalization",
    "cmd": "SetScale",
    "args": ["histeq"]
  },
  {
    "name": "power",
    "tip": "power scale",
    "cmd": "SetScale",
    "args": ["power"]
  },
  {
    "name": "sqrt",
    "tip": "square root scale",
    "cmd": "SetScale",
    "args": ["sqrt"]
  },
  {
    "name": "asinh",
    "tip": "asinh scale",
    "cmd": "SetScale",
    "args": ["asinh"]
  },
  {
    "name": "sinh",
    "tip": "sinh scale",
    "cmd": "SetScale",
    "args": ["sinh"]
  },
  {
    "name": "squared",
    "tip": "squared scale",
    "cmd": "SetScale",
    "args": ["squared"]
  },
  {
    "name": "annulus",
    "tip": "annulus region",
    "image": "images/voyager/regions_annulus.svg",
    "cmd": "AddRegions",
    "args": ["annulus"]
  },
  {
    "name": "box",
    "tip": "box region",
    "image": "images/voyager/regions_box.svg",
    "cmd": "AddRegions",
    "args": ["box"]
  },
  {
    "name": "circle",
    "tip": "circle region",
    "image": "images/voyager/regions_circle.svg",
    "cmd": "AddRegions",
    "args": ["circle"]
  },
  {
    "name": "ellipse",
    "tip": "ellipse region",
    "image": "images/voyager/regions_ellipse.svg",
    "cmd": "AddRegions",
    "args": ["ellipse"]
  },
  {
    "name": "line",
    "tip": "line region",
    "image": "images/voyager/regions_line.svg",
    "cmd": "AddRegions",
    "args": ["line"]
  },
  {
    "name": "polygon",
    "tip": "polygon region",
    "image": "images/voyager/regions_polygon.svg",
    "cmd": "AddRegions",
    "args": ["polygon"]
  },
  {
    "name": "text",
    "tip": "text region",
    "image": "images/voyager/regions_text.svg",
    "cmd": "AddRegions",
    "args": ["text"]
  },
  {
    "name": "inc/excl",
    "tip": "toggle selected region incl/excl",
    // "image": "images/toolbar/dax_images/incexl.png",
    "cmd": "ToggleRegionTags",
    "args": ["selected", "include", "exclude"]
  },
  {
    "name": "src/bkg",
    "tip": "toggle selected region src/bkg",
    // "image": "images/toolbar/dax_images/srcbkg.png",
    "cmd": "ToggleRegionTags",
    "args": ["selected", "source", "background"]
  },
  {
    "name": "remove",
    "tip": "remove selected region",
    // "image": "images/toolbar/dax_images/erase.png",
    "cmd": "RemoveRegions",
    "args": ["selected"]
  },
  {
    "name": "zoom+",
    "image": "images/voyager/zoom_in.svg",
    "tip": "zoom in",
    "cmd": "SetZoom",
    "args": ["x2"]
  },
  {
    "name": "zoom-",
    "image": "images/voyager/zoom_out.svg",
    "tip": "zoom out",
    "cmd": "SetZoom",
    "args": ["/2"]
  },
  {
    "name": "zoom1",
    "tip": "zoom 1",
    "image": "images/voyager/zoom_1.svg",
    "cmd": "SetZoom",
    "args": [1]
  },
  {
    "name": "zoomtofit",
    "tip": "zoom to fit",
    "image": "images/voyager/zoom_tofit.svg",
    "cmd": "SetZoom",
    "args": ["toFit"]
  },
  {
    "name": "open",
    "tip": "open local file dialog box",
    "cmd": "OpenFileMenu",
    "args": []
  },
  {
    "name": "infobox",
    "tip": "toggle infobox display",
    "cmd": "DisplayPlugin",
    "args": ["JS9Info"]
  },
  {
    "name": "magnifier",
    "tip": "toggle magnifier display",
    // "image": "images/toolbar/dax_images/mag.png",
    "cmd": "DisplayPlugin",
    "args": ["JS9Magnifier"]
  },
  {
    "name": "panner",
    "tip": "toggle panner display",
    // "image": "images/toolbar/dax_images/pan.png",
    "cmd": "DisplayPlugin",
    "args": ["JS9Panner"]
  },
  {
    "name": "prefs",
    "tip": "toggle preferences display",
    "cmd": "DisplayPlugin",
    "args": ["JS9Preferences"]
  }
];

JS9.Toolbar.tooltip = function(tool, tooltip, e){
    let x, y, w, offset;
    if( tooltip ){
	offset = $(e.currentTarget).position();
	this.tooltip.html(tooltip);
	if( this.winType === "light" ){
	    x = offset.left + JS9.Toolbar.TOOLTIPLX;
	    y = offset.top - JS9.Toolbar.TOOLTIPLY;
	} else {
	    x = offset.left + JS9.Toolbar.TOOLTIPX;
	    y = offset.top - JS9.Toolbar.TOOLTIPY;
	}
	w = this.tooltip.width();
	// desperate attempt to place the tooltip properly
	if( (x + w + 20) > this.width ){
	    x = offset.left - w - 20;
	}
	this.tooltip.css({left: x, top: y, display: "inline-block"});
    } else {
	this.tooltip.html("").css({left: -9999, display: "none"});
    }
    return;
};

// add a tool to the toolbar
JS9.Toolbar.addTool = function(tool){
    let div, btn, img;
    // special processing: no args means return current list of tools
    if( !tool ){
	return JS9.Toolbar.tools;
    }
    // special processing: add "break" between section
    if( tool === "$break" ){
	$("<hr>").appendTo(this.activeToolbar);
	return;
    }
    // sanity check on a real tool
    if( !tool.name || !tool.cmd ){
	JS9.error(`invalid input to JS9.toolbar: ${JSON.stringify(tool)}`);
    }
    // enclosing div
    div = $("<div>")
	.addClass(`${JS9.Toolbar.BASE}ButtonDiv`)
	.appendTo(this.activeToolbar);
    // create the button
    if( tool.image ){
	// relative path: add install dir prefix
	img = tool.image;
	if( JS9.inline && JS9.inline[img] ){
	    // inline version is available
	    img = JS9.inline[img];
	} else if( img.charAt(0) !== "/" ){
	    // external version
	    img = JS9.InstallDir(img);
	}
	btn = $("<input>")
	    .addClass(`${JS9.Toolbar.BASE}ImageButton`)
	    .attr("type", "image")
	    .attr("src", img)
	    .attr("width", JS9.Toolbar.IMAGEWIDTH)
	    .attr("height", JS9.Toolbar.IMAGEHEIGHT)
	    .attr("alt", tool.name)
	    .appendTo(div);
    } else {
	btn = $("<input>")
	    .addClass(`${JS9.Toolbar.BASE}ButtonButton`)
	    .attr("type", "button")
	    .attr("value", tool.name)
	    .appendTo(div);
    }
    // set up the callback to the JS9 public access routine
    btn.on("click", () => {
	let args;
	const display = this.display;
	// special processing for commands
	switch(tool.cmd){
        default:
            if( typeof JS9.publics[tool.cmd] === "function" ){
                // clone the array and any objects it contains
                args = JSON.parse(JSON.stringify(tool.args||[]));
                args.push({display: display});
                JS9.publics[tool.cmd](...args);
            } else {
		JS9.error(`unknown JS9 func for toolbar: ${tool.cmd}`);
	    }
            break;
        }
    });
    // tool tip is optional
    if( JS9.globalOpts.toolbarTooltips ){
	btn.on("mouseover", (e) => {
	    JS9.Toolbar.tooltip.call(this, tool, tool.tip||tool.name, e);
	});
	btn.on("mouseout", (e) => {
	    JS9.Toolbar.tooltip.call(this, tool, null, e);
	});
    }
    // return something possible useful
    tool.btn = btn;
    return tool;
};

// constructor: add HTML elements to the plugin
JS9.Toolbar.init = function(width, height){
    let i, j, tool, name;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id of the div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width = width || JS9.Toolbar.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height = height || JS9.Toolbar.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // clean plugin container
    this.divjq.html("");
    // toolbar container
    this.toolbarContainer = $("<div>")
	.addClass(`${JS9.Toolbar.BASE}Container`)
	.attr("id", `${this.id}Container`)
	.appendTo(this.divjq);
    // toolbar
    this.activeToolbar = $("<div>")
	.addClass(`${JS9.Toolbar.BASE}Div`)
	.attr("id", `${this.id}Toolbar`)
        .css("width", this.width)
        .css("height", this.height)
        .css("min-height", JS9.Toolbar.TOOLBARHEIGHT)
	.appendTo(this.toolbarContainer);
    // add a tooltip
    this.tooltip = $("<div>")
	.attr("id", `tooltip_${this.id}`)
	.addClass("JS9ToolbarTooltip")
	.appendTo(this.divjq);
    // add tools from globalOpts to the list
    for(j=0; j<JS9.globalOpts.toolBar.length; j++){
	name = JS9.globalOpts.toolBar[j];
	for(i=0; i<JS9.Toolbar.tools.length; i++){
	    tool = JS9.Toolbar.tools[i];
	    if( name === tool.name ){
		JS9.Toolbar.addTool.call(this, tool);
	    }
	}
    }
    // add a break between important tools and the rest
    JS9.Toolbar.addTool.call(this, "$break");
    // add tools not in the globalOpts to the bottom of the list
    for(i=0; i<JS9.Toolbar.tools.length; i++){
	tool = JS9.Toolbar.tools[i];
	if( $.inArray(tool.name, JS9.globalOpts.toolBar) < 0 ){
	    JS9.Toolbar.addTool.call(this, tool);
	}
    }
    return JS9.Toolbar.tools;
};

// public access routines

// GetToolbar: get current tools
JS9.mkPublic("GetToolbar", function(...args){
    let arg1;
    const obj = JS9.parsePublicArgs(args);
    arg1 = obj.argv[0];
    if( arg1 === "showTooltips" ){
	return JS9.globalOpts.toolbarTooltips;
    }
    return JS9.Toolbar.tools;
});

// SetToolbar: add new tools to the toolbar
JS9.mkPublic("SetToolbar", function(...args){
    let i, arg1, arg2;
    const obj = JS9.parsePublicArgs(args);
    const reinit = () => {
	let i, display, pinst;
	for(i=0; i<JS9.displays.length; i++){
	    display = JS9.displays[i];
	    pinst = display.pluginInstances.JS9Toolbar;
	    if( pinst ){
		JS9.Toolbar.init.call(pinst);
	    }
	}
    };
    arg1 = obj.argv[0];
    arg2 = obj.argv[1];
    // no args: reinit toolbar and return
    if( !arg1 ){
	return;
    }
    // special processing
    if( arg1 === "init" ){
	// reinit toolbar
	reinit();
	return;
    } else if( arg1 === "showTooltips" ){
	// change value
	JS9.globalOpts.toolbarTooltips = !!arg2;
	// reinit toolbar
	reinit();
	return;
    } else if( typeof arg1 === "string" ){
	// arg1 can be an object or json
	try{ arg1 = JSON.parse(arg1); }
	catch(e){ JS9.error(`can't parse json for SetToolBar: ${arg1}`, e); }
	// add one new tool
	JS9.Toolbar.tools.push(arg1);
	// reinit toolbar
	reinit();
    } else if( $.isArray(arg1) ){
	// array of new tools
	for(i=0; i<arg1.length; i++){
	    JS9.Toolbar.tools.push(arg1[i]);
	}
	// reinit toolbar
	reinit();
    } else if( typeof arg1 === "object" ){
	// add one new tool
	JS9.Toolbar.tools.push(arg1);
	// reinit toolbar
	reinit();
    }
    return null;
});

// add plugin into JS9
JS9.RegisterPlugin(JS9.Toolbar.CLASS, JS9.Toolbar.NAME, JS9.Toolbar.init,
		   {menuItem: "Toolbar",
		    help: "help/toolbar.html",
		    winTitle: "Toolbar",
		    winDims: [JS9.Toolbar.WIDTH, JS9.Toolbar.HEIGHT]});
