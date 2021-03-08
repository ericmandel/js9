/*
 * visibility of JS9 in-page plugin divs (January 13, 2017)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Divs = {};
JS9.Divs.CLASS = "JS9";	// class of plugins (1st part of div class)
JS9.Divs.NAME = "Divs"; // name of this plugin (2nd part of div class)
JS9.Divs.WIDTH =  400;	// width of light window
JS9.Divs.HEIGHT = 146;	// height of light window
JS9.Divs.BASE = JS9.Divs.CLASS + JS9.Divs.NAME;  // CSS base class name

JS9.Divs.headerHTML='JS9 plugin divs can be hidden or made visible below.';

JS9.Divs.divHTML="<span style='float: left'>$visible&nbsp;&nbsp;</span>&nbsp;&nbsp; <span class='JS9DivsSpan'>$div&nbsp;&nbsp</span>";

JS9.Divs.nodivsHTML='<p><span class="JS9NoDivs">[No JS9 divs have been created for this display]</span>';

JS9.Divs.visibleHTML='<input class="JS9DivsVisibleCheck" type="checkbox" id="visible" name="visible" value="visible" onclick="javascript:JS9.Divs.xvisible(\'%s\', \'%s\', this)">visible';

JS9.Divs.divNameHTML='<b>%s</b>';

// make shape div visible/invisible
JS9.Divs.xvisible = function(display, plugin, target){
    let mode, instance;
    const div = JS9.lookupDisplay(display);
    if( div ){
	instance = div.pluginInstances[plugin];
	if( instance ){
	    if( target.checked ){
		mode = "visible";
	    } else {
		mode = "hidden";
	    }
	    // the plugin container contains the plugin and maybe a toolbar
	    instance.divjq
		.closest(".JS9PluginContainer").css("visibility", mode);
	}
    }
};

// add a div to the list
JS9.Divs.addDiv = function(plugin){
    let s, divjq;
    const cls = `${JS9.Divs.BASE}Div`;
    const opts = [];
    // sanity checks
    if( !plugin || !this.display.pluginInstances[plugin] ){
	return;
    }
    // first time through, clear html
    if( !this. ndiv ){
	this.divsDivContainer.html("");
    }
    // value to pass to the macro expander
    opts.push({name: "visible", value: sprintf(JS9.Divs.visibleHTML, 
					       this.display.id, plugin)});
    opts.push({name: "div", value: sprintf(JS9.Divs.divNameHTML, 
					   plugin)});
    // create the html for this div
    s = JS9.Image.prototype.expandMacro.call(null, JS9.Divs.divHTML, opts);
    // add div html to the div container
    divjq = $("<div>")
	.addClass(cls)
        .html(s)
	.appendTo(this.divsDivContainer);
    // set or unset visibility buton
    divjq.find(".JS9DivsVisibleCheck").prop("checked", 
    this.display.pluginInstances[plugin].divjq.css("visibility") === "visible");
    // another div was added
    this.ndiv++;
};

// constructor: add HTML elements to the plugin
JS9.Divs.init = function(opts){
    let key, instances;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id of the div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // opts is optional
    opts = opts || {};
    // create container to hold div container and header
    // clean main container
    this.divjq.html("");
    // no divs yet
    this.ndiv = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.divsContainer = $("<div>")
	.addClass(`${JS9.Divs.BASE}Container`)
	.attr("id", `${this.id}DivsContainer`)
        .css("overflow", "auto")
	.appendTo(this.divjq);
    // header
    this.divsHeader = $("<div>")
	.addClass(`${JS9.Divs.BASE}Header`)
	.attr("id", `${this.display.id}Header`)
	.html(JS9.Divs.headerHTML)
	.appendTo(this.divsContainer);
    // container to hold divs
    this.divsDivContainer = $("<div>")
	.addClass(`${JS9.Divs.BASE}DivContainer`)
	.attr("id", `${this.id}DivsDivContainer`)
        .html(JS9.Divs.nodivsHTML)
	.appendTo(this.divsContainer);
    // done if we are only clearing
    if( opts.mode === "clear" ){
	return;
    }
    // add current in-page plugin divs
    instances = this.display.pluginInstances;
    for( key in instances ){
	if( Object.prototype.hasOwnProperty.call(instances, key) ){
	    if( instances[key].winType === "div" ){
		JS9.Divs.addDiv.call(this, key);
	    }
	}
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Divs.CLASS, JS9.Divs.NAME, JS9.Divs.init,
		   {menuItem: "Show/Hide Plugins",
		    onplugindisplay: JS9.Divs.init,
		    help: "help/divs.html",
		    winTitle: "Show/Hide Plugins",
		    winResize: true,
		    winDims: [JS9.Divs.WIDTH, JS9.Divs.HEIGHT]});
