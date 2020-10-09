/*
 * status plugin (February 20, 2020)
 */

/*global $, JS9 */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Statusbar = {};
JS9.Statusbar.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Statusbar.NAME = "Statusbar"; // name of this plugin (2nd part of div class)
JS9.Statusbar.WIDTH =  512;       // width of light window
JS9.Statusbar.HEIGHT = 32;        // height of light window
JS9.Statusbar.COLORWIDTH =  120;  // width of colorbar, if present
JS9.Statusbar.COLORHEIGHT = 14;   // height of colorbar, if present
JS9.Statusbar.BASE = JS9.Statusbar.CLASS + JS9.Statusbar.NAME;

// mouse over: highlight a bit
JS9.Statusbar.mover = function(target){
    $(target).removeClass("JS9StatusbarItemNoHighlight JS9StatusbarItemHighlight2");
    $(target).addClass("JS9StatusbarItemHighlight");
};

// mouse out: no highlight
JS9.Statusbar.mout = function(target){
    $(target).removeClass("JS9StatusbarItemHighlight JS9StatusbarItemHighlight2");
    $(target).addClass("JS9StatusbarItemNoHighlight");
};

// mouse down: hightlight fully
JS9.Statusbar.mdown = function(target){
    // unhighlight
    $(target).removeClass("JS9StatusbarItemNoHighlight JS9StatusbarItemHighlight");
    $(target).addClass("JS9StatusbarItemHighlight2");
};

// mouse up: xeq action, hightlight a bit
JS9.Statusbar.mup = function(target, id){
    let s, arr;
    $(target).removeClass("JS9StatusbarItemNoHighlight JS9StatusbarItemHighlight2");
    $(target).addClass("JS9StatusbarItemHighlight");
    // look at the html for this element
    s = $(target).attr("name");
    if( s ){
	// is there a hint about what sort of menu status it contains?
	arr = s.match(/file|image|edit|view|zoom|rot|flip|scale|color|regions|wcs|analysis|mag/i);
    }
    // bring up a control plugin, if possible
    if( arr && arr[0] ){
	switch(arr[0]){
	case "file":
	case "image":
	    JS9.DisplayPlugin("FITSBinning", {display: id});
	    break;
	case "edit":
	    break;
	case "view":
	    break;
	case "flip":
	case "rot":
	case "mag":
	case "zoom":
	    JS9.DisplayPlugin("JS9PanZoom", {display: id});
	    break;
	case "scale":
	    JS9.DisplayPlugin("JS9Scale", {display: id});
	    break;
	case "color":
	    JS9.DisplayPlugin("JS9Color", {display: id});
	    break;
	case "regions":
	    break;
	case "wcs":
	    break;
	case "analysis":
	    break;
	}
    }
}

// redraw status on display
JS9.Statusbar.display = function(im, opts){
    let i, s, t, oarr, arr, elements, index, pinst, statusbar;
    let html = "";
    let delim = /;/;
    // opts is optional
    opts = opts || {};
    if( im && JS9.globalOpts.statusBar ){
	statusbar = JS9.globalOpts.statusBar;
	// remove colorbar if colorbar plugin is instantiated
	pinst = im.display.pluginInstances.JS9Colorbar;
	if( pinst && pinst.isActive() && !this.mycolorbar ){
	    statusbar = statusbar.replace(/\$colorbar;? */, "");
	}
	// escape brackets and parens before macro expansion, then unescape
	s = statusbar
	    .replace(/\(/g, " __OP__ ")
	    .replace(/\)/g, " __CP__ ")
	    .replace(/\[/g, " __OB__ ")
	    .replace(/\]/g, " __CB__ ");
	s = im.expandMacro(s)
	    .replace(/ __OP__ /g, "(")
	    .replace(/ __CP__ /g, ")")
	    .replace(/ __OB__ /g, "[")
	    .replace(/ __CB__ /g, "]");
	if( this.statusBar !== statusbar || opts.reinit ){
	    // original statusbar items
	    oarr = statusbar.split(delim);
	    // current values of items in the status bar
	    arr = s.split(delim);
	    for(i=0; i<arr.length; i++){
		t = `<div name='__dummy__' class='JS9StatusbarItem JS9StatusbarItemNoHighlight' onmousedown='JS9.Statusbar.mdown(this)' onmouseup='JS9.Statusbar.mup(this, "${this.display.id}")' onmouseover='JS9.Statusbar.mover(this)' onmouseout='JS9.Statusbar.mout(this)'>${arr[i]}</div>`
		.replace(/\$img\(([^()]+)\)/g, "<img src='$1' name='$1' class='JS9StatusbarImageItem JS9StatusbarItemNoHighlight'>")
		.replace(/\$colorbar/g, `<div name='JS9Colorbar' id='${this.id.replace(/Statusbar/, "Colorbar")}' class='JS9Colorbar JS9StatusbarPluginItem' data-width="${this.colorwidth}px" data-height="${this.colorheight}px" data-colorbarHeight="${this.colorheight}px" data-showTicks="false" ></div>`)
		.replace(/__dummy__/, oarr[i].replace(/\s+/, "_"));
		html += t;
	    }
	    // set statusbar
	    this.statusContainer.html(html);
	    // colorbar plugin: run AddDivs, remove colorbar from resize list
	    if( statusbar.match(/\$colorbar/) ){
		JS9.AddDivs({display: im});
		this.mycolorbar = this.display.pluginInstances.JS9Colorbar;
		index = JS9.globalOpts.resizeDivs.indexOf("JS9Colorbar");
		if( index >= 0 ){
		    JS9.globalOpts.resizeDivs.splice(index, 1);
		}
	    }
	    // save the format to detect future changes
	    this.statusBar = statusbar;
	} else {
	    // elements associated with items in statusbar
	    elements = this.divjq.find(`.JS9StatusbarItem`);
	    arr = s.split(delim);
	    // for each element ...
	    for(i=0; i<elements.length; i++){
		// that is not a plugin ...
		if( arr[i].match(/\$colorbar/) ){
		    // dynamic colorbars have to be displayed manually, since
		    // the colorbar has no way to know the image changed
		    if( this.mycolorbar && this.isDynamic ){
			JS9.Colorbar.display.call(this.mycolorbar, im);
		    }
		} else if( arr[i].match(/\$img/) ){
		    t = arr[i].match(/\$img\((.*)\)/);
		    if( t && t[1] ){
			if( t[1].charAt(0) !== "/" ){
			    t[1] = JS9.InstallDir(t[1]);
			}
			$(elements[i]).find("img").attr("src", t[1]);
		    }
		} else {
		    // set new value
		    $(elements[i]).html(arr[i]);
		}
	    }
	}
    } else {
	// clear statusbar but leave it intact
	if( this.statusBar ){
	    arr = this.statusBar.split(delim);
	    elements = this.divjq.find(`.JS9StatusbarItem`);
	    for(i=0; i<elements.length; i++){
		if( !arr[i].match(/\$colorbar/) ){
		    $(elements[i]).html("");
		}
	    }
	}
    }
};

// constructor: add HTML elements to the plugin
// eslint-disable-next-line no-unused-vars
JS9.Statusbar.init = function(width, height){
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id of the div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // set width and height of plugin itself
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width = width || JS9.Statusbar.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height  ){
	this.height = height || JS9.Statusbar.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // colorbar width stretches with statusbar
    this.colorwidth = parseInt(this.divjq.attr("data-colorbarWidth"), 10) ||
	JS9.Statusbar.COLORWIDTH + Math.max(this.display.width - 512, 0);
    this.colorheight = parseInt(this.divjq.attr("data-colorbarHeight"), 10) ||
	JS9.Statusbar.COLORHEIGHT;
    // clean plugin container
    this.divjq.html("");
    // status container
    this.statusContainer = $("<div>")
	.addClass(`${JS9.Statusbar.BASE}Container`)
	.attr("id", `${this.id}Container`)
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    // display current status, if necessary
    if( this.display.image ){
	JS9.Statusbar.display.call(this, this.display.image);
    }
};

// callback when image is (re-)displayed
JS9.Statusbar.imagedisplay = function(im){
    if( im ){
	JS9.Statusbar.display.call(this, im);
    }
};

// callback when image is cleared or closed
// eslint-disable-next-line no-unused-vars
JS9.Statusbar.imageclear = function(im){
    JS9.Statusbar.display.call(this, null);
};

// dynamic change
JS9.Statusbar.dynamic = function(im){
    let status;
    if( im ){
	status = im.display.pluginInstances.JS9Statusbar;
	if( status && status.isDynamic ){
	    JS9.Statusbar.imagedisplay.call(this, im);
	}
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Statusbar.CLASS, JS9.Statusbar.NAME, JS9.Statusbar.init,
		   {menuItem: "Statusbar",
		    dynamicSelect: true,
		    ondynamicselect: JS9.Statusbar.dynamic,
		    onimagedisplay: JS9.Statusbar.imagedisplay,
		    onimageclear: JS9.Statusbar.imageclear,
		    onimageclose: JS9.Statusbar.imageclear,
		    onsetwcssys: JS9.Statusbar.imagedisplay,
		    onsetwcsunits: JS9.Statusbar.imagedisplay,
		    help: "help/statusbar.html",
		    winTitle: "Statusbar",
		    winDims: [JS9.Statusbar.WIDTH, JS9.Statusbar.HEIGHT]});
