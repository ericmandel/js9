// ---------------------------------------------------------------------
// JS9 menubar to manage menubar and its menus
// ---------------------------------------------------------------------

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, JS9, sprintf */

// create our namespace, and specify some meta-information and params
JS9.Menubar = {};
JS9.Menubar.CLASS = "JS9";
JS9.Menubar.NAME = "Menubar";
JS9.Menubar.WIDTH = JS9.WIDTH || 512;	// width of Menubar
JS9.Menubar.HEIGHT = "auto";		// height of Menubar

// menu buttons in the menubar
// NB: names must match actual menus, menu labels are arbitrary
JS9.Menubar.buttonOptsArr = [{name: "file", label: "File"},
			     {name: "edit", label: "Edit"},
			     {name: "view", label: "View"},
			     {name: "zoom", label: "Zoom"},
			     {name: "scale", label: "Scale"},
			     {name: "color", label: "Color"},
			     {name: "region", label: "Regions"},
			     {name: "wcs", label: "WCS"},
			     {name: "analysis", label: "Analysis"},
			     {name: "help", label: "Help"}];

// map correspondance between menu items and keyboard actions
JS9.Menubar.keyMap = {
    "open local file ...": "open local file",
    "toggle: src/bkgd": "toggle selected region: source/background",
    "display crosshair for this image": "toggle crosshair",
    "toggle: incl/excl": "toggle selected region: include/exclude",
    "display the full image": "display full image",
    "refresh this image": "refresh image",
    "show active shape layers": "toggle active shape layers",
    "hide active shape layers": "toggle active shape layers",
    "Keyboard Actions": "toggle keyboard actions plugin",
    "Mouse/Touch": "toggle mouse/touch plugin",
    "Preferences": "toggle preferences plugin",
    "Shape Layers": "toggle shape layers plugin",
    "edit selected": "edit selected region",
    "copy selected": "copy selected region to clipboard",
    "copy all": "copy all regions to clipboard",
    "paste to region pos": "paste regions from local clipboard",
    "paste to current pos": "paste regions to current position",
    "copy wcs pos": "copy wcs position to clipboard",
    "copy value/pos": "copy value and position to clipboard",
    "zoom 1": "reset zoom",
    "zoom in": "zoom in",
    "zoom out": "zoom out"
};

// backwards compatibility, pre-1.10
if( JS9.menuButtonOptsArr ){
    JS9.Menubar.buttonOptsArr = JS9.menuButtonOptsArr;
}

// get displays associated with this menubar, taking supermenus into account
JS9.Menubar.getDisplays = function(mode, key){
    var i, s, disp;
    var arr = [];
    mode = mode || "any";
    key = key || "";
    // handle super menu specially ... but only is its not a "super_" request
    if( this.id.search(JS9.SUPERMENU) >= 0 && !key.match(/^super_/) ){
	if( mode !== "all" && this.selectedDisplay ){
	    return [this.selectedDisplay];
	}
	s = this.divjq.data("displays").split(",");
	if( s[0] === "*" ){
	    for(i=0; i<JS9.displays.length; i++){
		arr.push(JS9.displays[i]);
	    }
	} else {
	    for(i=0; i<s.length; i++){
		disp = JS9.lookupDisplay(s[i]);
		if( disp ){
		    arr.push(disp);
		}
	    }
	}
    }
    if( !arr.length ){
	arr.push(this.display);
    }
    return arr;
};

// this callback happens when a click is registered on a display
// we then go through the supermenus, and if one of them contains this display,
// we set its selectedDisplay value so that use of that supermenu is then aimed
// only at the selected display
// also used to unset previously set selectedDisplay
//
// called by JS9.mouseupCB with no context, passing current image object
JS9.Menubar.onclick = function(disp){
    var i, arr, supermenu;
    if( (typeof disp === "string") && (disp !== "all") ){
	disp = JS9.lookupDisplay(disp);
    }
    for(i=0; i<JS9.supermenus.length; i++){
	supermenu = JS9.supermenus[i];
	arr = JS9.Menubar.getDisplays.call(supermenu, "all");
	if( ($.inArray(disp, arr) >= 0) || (disp === "all") ){
	    if( JS9.bugs.webkit_resize ){
		$(".JS9").find(".JS9Image").removeClass("JS9Highlight");
	    } else {
		$(".JS9").removeClass("JS9Highlight");
	    }
	    if( (disp === supermenu.selectedDisplay) || (disp === "all") ){
		// unselect
		supermenu.selectedDisplay = null;
	    } else {
		// select
		supermenu.selectedDisplay = disp;
		if( JS9.bugs.webkit_resize ){
		    $(disp.divjq).find(".JS9Image").addClass("JS9Highlight");
		} else {
		    $(disp.divjq).addClass("JS9Highlight");
		}
	    }
	}
    }
};

// reset: invalidate the reverse key map when preferences change
// eslint-disable-next-line no-unused-vars
JS9.Menubar.reset = function(im){
    JS9.Menubar.rkeyMap = null;
};

// create the standard menus and user-defined menus
// each consists of a contextMenu() call and a "mousedown" callback
// to display that menu
JS9.Menubar.createMenus = function(){
    var that = this;
    // eslint-disable-next-line no-unused-vars
    var mypos = function(opt,  x,  y)  {
	var pos;
	if( !window.hasOwnProperty("Jupyter") ){
	    opt.$menu.position({
		my:  'left top',
		at:  'right-5 bottom-5',
		of:  opt.$trigger,
		collision: "fit"
	    });
	} else {
	    // Jupyter gets the wrong position when using $trigger ...
	    pos = this.offset();
	    opt.$menu.css({"left": pos.left+20, "top": pos.top+10});
	}
    };
    var onhide = function() {
	var tdisp = that.display;
	if( JS9.bugs.hide_menu && tdisp.image ){
	    tdisp.image.displayImage("rgb");
	}
    };
    var xname = function(name){
	var key, hstr;
	var obj = {name: name};
	var gkeyActions = JS9.globalOpts.keyboardActions;
	var act = JS9.Menubar.keyMap[name];
	if( !JS9.Menubar.rkeyMap ){
	    JS9.Menubar.rkeyMap = {};
	    for( key in gkeyActions ){
		if( gkeyActions.hasOwnProperty(key) ){
		    JS9.Menubar.rkeyMap[gkeyActions[key]] = key;
		}
	    }
	    JS9.Menubar.keyActions = $.extend(true, {}, gkeyActions);
	}
	if( !JS9.isNull(act) && JS9.Menubar.rkeyMap ){
	    key = JS9.Menubar.rkeyMap[act];
	    if( key ){
		hstr = "<span>" + name + " <span style='float:right;font:bold 10pt Courier;'>&nbsp;&nbsp;&nbsp;" + key + "</span></span>";
		obj = {name: hstr, isHtmlName: true};
	    }
	}
	return obj;
    };
    var xeqUserMenu = function(evt){
	var menu = evt.data;
	evt.preventDefault();
	$("#"+menu.name+"UserMenu" + that.id).contextMenu();
    };
    var addUserMenu = function(menu){
	if( !menu || !menu.name || !menu.title || !menu.options  ){
	    return;
	}
	// define contextMenu actions
	$.contextMenu({
            selector: "#" + menu.name +"UserMenu" + that.id,
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
	    position: mypos,
            build: function(){
		var i, opt, hstr;
		var items = {};
		items["my" + menu.title] = {
		    name: menu.title + ":",
		    disabled: true
		};
		for(i=0; i<menu.options.length; i++){
		    opt = menu.options[i];
		    if( opt.image ){
			hstr = "<div style='white-space:nowrap;'><img src='" + opt.image + "' alt='" + opt.name + "' class='JS9MenubarUserImage' >" + "&nbsp;&nbsp;" + opt.name + "</div>";
			items[opt.name] = {name: hstr, isHtmlName: true};
		    } else {
			items[opt.name] = {name: opt.name};
		    }
		}
		return{
		    callback: function(key){
		    JS9.Menubar.getDisplays.call(that).forEach(function(val){
			var i, args;
			var udisp = val;
			for(i=0; i<menu.options.length; i++){
			    opt = menu.options[i];
			    if( key !== opt.name ){
				continue;
			    }
			    if( typeof JS9.publics[opt.cmd] === "function" ){
				// clone the array and any objects it contains
				args = JSON.parse(JSON.stringify(opt.args||[]));
				args.push({display: udisp});
				JS9.publics[opt.cmd].apply(null, args);
			    } else {
				JS9.error("unknown function for user menubar: " + menu.cmd);
			    }
			}
		    });
		    },
		    items: items
		};
	    }
	});
    };
    var addUserMenus = function(){
	var i, menu;
	if( JS9.globalOpts.userMenuBar ){
	    for(i=0; i<JS9.globalOpts.userMenuBar.length; i++){
		menu = JS9.globalOpts.userMenuBar[i];
		if( !menu || !menu.name || !menu.title  ){
		    continue;
		}
		$("#"+menu.name+"UserMenu" + that.id).on("mousedown",
							 menu, xeqUserMenu);
		addUserMenu(menu);
	    }
	}
    };
    // file: make button open the contextMenu
    $("#fileMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#fileMenu" + that.id).contextMenu();
    });
    $.contextMenu({
        selector: "#fileMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var i, im, name, imlen, s1, arr, cdisp;
	    var n = 0;
	    var items = {};
	    var tdisp = JS9.Menubar.getDisplays.call(that)[0];
	    var tim = tdisp.image;
	    if( that.issuper ){
		arr = JS9.Menubar.getDisplays.call(that, "all");
		items.supertitle = {
		    name: "Supermenu Controls:",
		    disabled: true
		};
		for(i=0; i<arr.length; i++){
		    cdisp = arr[i];
		    name = cdisp.id;
		    items["super_"+name] = xname(name);
		    if( that.selectedDisplay === cdisp ){
			items["super_"+name].icon = "sun";
			n++;
		    }
		}
		name = "all displays";
		items.super_all = xname(name);
		if( !n ){
		    items.super_all.icon = "sun";
		}
		items["sep" + n++] = "------";
	    }
	    items.filetitle = {
		name: "Images:",
		disabled: true
	    };
	    imlen = JS9.images.length;
	    for(i=0; i<imlen; i++){
		im = JS9.images[i];
		if( im.display === tdisp ){
		    name = im.id;
		    if( JS9.globalOpts.rgb.active ){
			if( im === JS9.globalOpts.rgb.rim){
			    name += " (red)";
			}
			if( im === JS9.globalOpts.rgb.gim){
			    name += " (green)";
			}
			if( im === JS9.globalOpts.rgb.bim){
			    name += " (blue)";
			}
		    }
		    items[name] = xname(name);
		    if( tdisp.image && (tdisp.image.id === im.id) ){
			items[name].icon = "sun";
		    }
		    n++;
		}
	    }
	    if( !n ){
		items.noimg = {
		    name: "[no images]",
		    events: {keyup: function(){return;}}
		};
	    }
	    items["sep" + n++] = "------";
	    items.open = xname("open local file ...");
	    items.archives = xname(" accessing data archives ...");
	    if( !JS9.allinone ){
		    items.archives.disabled = false;
		} else {
		    items.archives.disabled = true;
		}
		items.loadproxy = xname("open link via proxy ...");
		if( !JS9.allinone			 &&
		    JS9.globalOpts.helperType !== "none" &&
		    JS9.globalOpts.workDir      	 &&
		    JS9.globalOpts.loadProxy    	 ){
		    items.loadproxy.disabled = false;
		} else {
		    items.loadproxy.disabled = true;
		}
		items.loadcors = xname("open link via CORS ...");
		if( !window.hasOwnProperty("Jupyter") ){
		    items.loadcors.disabled = false;
		} else {
		    items.loadcors.disabled = true;
		}
		items["sep" + n++] = "------";
		items.print = xname("print ...");
		if( window.isElectron && window.electronIPC ){
		    items.windowPrint = xname("print window ...");
		    items.windowPDF = xname("save window to pdf");
		}
		items.header = xname("display FITS header");
		items.hdus = xname("display FITS HDUs");
		if( !tim || !tim.hdus ){
		    items.hdus.disabled = true;
		}
		items.saveas = {
		    name: "save this image as ...",
		    items: {
			saveastitle: {
			    name: "choose output format:",
			    disabled: true
			},
			savefits: xname("FITS"),
			savejpeg: xname("JPEG"),
			savepng: xname("PNG")
		    }
		};
		items.moveto = {
		    name: "move this image to ...",
		    items: {
			movetotitle: {
			    name: "choose display:",
			    disabled: true
			}
		    }
		};
		items.sync = {
		    name: "sync this image ...",
		    items: {
			synctitle: {
			    name: "image(s) to keep in sync:",
			    disabled: true
			}
		    }
		};
		items.unsync = {
		    name: "unsync this image ...",
		    items: {
			unsynctitle: {
			    name: "image(s) to keep in sync:",
			    disabled: true
			}
		    }
		};
		items.separate = xname("separate these images");
		items.gather = xname("gather all images here");
		if( tim ){
		    // move image to
		    items.moveto.disabled = false;
		    for(i=0; i<JS9.displays.length; i++){
			if( $("#"+JS9.displays[i].id).length > 0 &&
			    tdisp !== JS9.displays[i]    	     ){
			    s1 = "moveto_" + JS9.displays[i].id;
			    items.moveto.items[s1] = xname(JS9.displays[i].id);
			}
		    }
		    items.moveto.items.moveto_newdisp = xname("a new display");
		    // sync target images to this image
		    items.sync.disabled = false;
		    for(i=0; i<JS9.images.length; i++){
			if( tim !== JS9.images[i]    	     ){
			    s1 = "sync_" + JS9.images[i].id;
			    items.sync.items[s1] = xname(JS9.images[i].id);
			}
		    }
		    items.sync.items.sync_allimages = xname("all images");
		    items.sync.items["sep" + n++] = "------";
		    items.sync.items.sync_opstitle = {
			name: "op(s) that trigger syncing:",
			disabled: true
		    };
		    items.sync.items.syncops = {
			value: JS9.globalOpts.syncOps,
			type: "textarea"
		    };
		    items.sync.items.syncreciprocate = {
			name: "reciprocal syncing",
			selected: JS9.globalOpts.syncReciprocate,
			type: "checkbox"
		    };
		    // unsync target images to this image
		    items.unsync.disabled = false;
		    for(i=0; i<JS9.images.length; i++){
			if( tim !== JS9.images[i]    	     ){
			    s1 = "unsync_" + JS9.images[i].id;
			    items.unsync.items[s1] = xname(JS9.images[i].id);
			}
		    }
		    items.unsync.items.unsync_allimages = xname("all images");
		    items.unsync.items["sep" + n++] = "------";
		    items.unsync.items.unsync_opstitle = {
			name: "op(s) that trigger syncing:",
			disabled: true
		    };
		    items.unsync.items.unsyncops = {
			value: JS9.globalOpts.syncOps,
			type: "textarea"
		    };
		    items.unsync.items.unsyncreciprocate = {
			name: "reciprocal syncing",
			selected: JS9.globalOpts.syncReciprocate,
			type: "checkbox"
		    };
		} else {
		    items.moveto.disabled = true;
		    items.sync.disabled = true;
		    items.unsync.disabled = true;
		}
		items.refresh = xname("refresh this image");
		items.full = xname("display the full image");
		items.free = xname("free this image's memory");
		if( !tim || !tim.raw || !tim.raw.hdu || !tim.raw.hdu.fits ){
		    items.refresh.disabled = true;
		    items.full.disabled = true;
		    items.free.disabled = true;
		}
		items.close = xname("close this image");
		items.closeall = xname("close all images");
		items.removeproxy = xname("remove proxy file from server");
		if( !tim || !tim.proxyFile ){
		    items.removeproxy.disabled = true;
		}
		items["sep" + n++] = "------";
		items.loadcatalog = xname("load catalog ...");
		items.savecatalog = xname("save active catalog");
		items["sep" + n++] = "------";
		items.loadsession = xname("load session ...");
		items.savesession = {
		    name: "save session ...",
		    items: {
			savesessiontitle: {
			    name: "include these images:",
			    disabled: true
			},
			savecurrent: xname("the current image"),
			savedisplay: xname("all images in this display")
		    }
		};
		items["sep" + n++] = "------";
		items.createmosaic = {
		    name: "create mosaic ...",
		    items: {
			createmosaictitle: {
			    name: "include these images:",
			    disabled: true
			},
			mosaiccurrent: xname("the current image"),
			mosaicdisplay: xname("all images in this display")
		    }
		};
		items["sep" + n++] = "------";
		items.lite = xname("new JS9 light window");
		items.xnew = xname("new JS9 separate window");
		if( window.isElectron ){
		    items.xnew.disabled = true;
		}
		items["sep" + n++] = "------";
		if( window.isElectron && window.electronIPC ){
		    items.electronHelper = xname("connect to JS9 helper");
		    if(  JS9.helper.connected ){
			items.electronHelper.disabled = true;
		    }
		}
		items.pageid = xname("display page id");
		return {
                    callback: function(key, opt){
		    JS9.Menubar.getDisplays.call(that, "any", key)
			    .forEach(function(val){
			var j, s, t, did, kid, unew, uwin, uobj, uarr, uopts;
			var udisp = val;
			var uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			switch(key){
			case "refresh":
			    if( uim && uim.raw.hdu && uim.raw.hdu.fits ){
				uim.refreshImage();
			    }
			    break;
			case "full":
			    if( uim && uim.raw.hdu && uim.raw.hdu.fits ){
				uim.displaySection("full");
			    }
			    break;
			case "free":
			    if( uim && uim.raw.hdu && uim.raw.hdu.fits ){
				JS9.cleanupFITSFile(uim.raw.hdu.fits, true);
			    }
			    break;
			case "close":
			    if( uim ){
				uim.closeImage();
			    }
			    break;
			case "closeall":
			    if( udisp ){
				// close all images in this display
				JS9.CloseDisplay(udisp.id);
			    }
			    break;
			case "removeproxy":
			    if( uim ){
				uim.removeProxyFile();
			    }
			    break;
			case "savecurrent":
			    if( udisp && uim ){
				JS9.SaveSession({mode: "image"},
						{display: udisp});
			    }
			    break;
			case "savedisplay":
			    if( udisp ){
				JS9.SaveSession({mode: "display"},
						{display: udisp});
			    }
			    break;
			case "loadsession":
			    if( udisp ){
				JS9.OpenSessionMenu({display: udisp});
			    }
			    break;
			case "loadcatalog":
			    if( udisp ){
				JS9.OpenCatalogsMenu({display: udisp});
			    }
			    break;
			case "savecatalog":
			    if( uim ){
				uim.saveCatalog();
			    }
			    break;
			case "mosaiccurrent":
			    if( udisp && uim ){
				JS9.CreateMosaic("current", {display: udisp});
			    }
			    break;
			case "mosaicdisplay":
			    if( udisp ){
				JS9.CreateMosaic("all", {display: udisp});
			    }
			    break;
			case "header":
			    if( uim ){
				if( uim.raw.header ){
				    uim.displayAnalysis("text",
					JS9.raw2FITS(uim.raw, {addcr: true}),
					{title: "FITS Header: "+uim.id});
				} else {
				    JS9.error("no FITS header for " + uim.id);
				}
			    }
			    break;
			case "hdus":
			    if( uim ){
				if( uim.hdus ){
				    uim.displayAnalysis("text",
						   JS9.hdus2Str(uim.hdus),
						   {title: "FITS HDUs: "+uim.id,
						    winformat: "width=800px,height=200px,center=1,resize=1,scrolling=1"});
				} else {
				    JS9.error("no FITS header for " + uim.id);
				}
			    }
			    break;
			case "lite":
			    JS9.LoadWindow(null, {clone: udisp.id}, "light");
			    break;
			case "xnew":
			    JS9.LoadWindow(null, null, "new");
			    break;
			case "electronHelper":
			    // Electron.js: send message to main
			    if( window.isElectron && window.electronIPC ){
				try{ window.electronIPC.send("msg",
							     "startHelper"); }
				catch(ignore){}
			    }
			    break;
			case "pageid":
			    s = sprintf("<center><p>pageid: %s</center>",
					JS9.helper.pageid || "none");
			    t = "JS9 page id";
			    // add display to title
			    t += sprintf(JS9.IDFMT, udisp.id);
			    JS9.lightWin("fileid" + JS9.uniqueID(),
					 "inline", s, t,
					 JS9.lightOpts[JS9.LIGHTWIN].lineWin);
			    break;
			case "open":
			    JS9.OpenFileMenu({display: udisp});
			    break;
			case "loadcors":
			    if( JS9.allinone ){
				did = JS9.Image.prototype.displayAnalysis.call(
				      null,
				      "textline",
				      JS9.allinone.loadCorsHTML,
				      {title: "Open a shared CORS link"});
			    } else {
				did = JS9.Image.prototype.displayAnalysis.call(
				      null,
				      "textline",
				      JS9.InstallDir(JS9.globalOpts.corsURL),
				      {title: "Open a shared CORS link"});
			    }
			    // save display id
			    $(did).data("dispid", udisp.id);
			    break;
			case "archives":
			    JS9.DisplayHelp(JS9.InstallDir(JS9.globalOpts.archivesURL));
			    break;
			case "loadproxy":
			    // load param url to run analysis task
			    // param url is relative to js9 install dir
			    did = JS9.Image.prototype.displayAnalysis.call(null,
				     "textline",
				     JS9.InstallDir(JS9.globalOpts.proxyURL),
				     {title: "Open a link via server proxy"});
			    // save info for running the task
			    $(did).data("dispid", udisp.id)
				  .data("aname", "loadproxy");
			    break;
			case "savefits":
			    if( uim ){
				s = uim.id.replace(/\.png/i, ".fits")
				          .replace(/\.gz$/i, "")
				          .replace(/\[.*\]/,"");
				uim.saveFITS(s);
			    }
			    break;
			case "savepng":
			    if( uim ){
				s = uim.id.replace(/\.fit[s]?/i, ".png")
				          .replace(/\.gz$/i, "")
				          .replace(/\[.*\]/,"");
				uim.savePNG(s);
			    }
			    break;
			case "savejpeg":
			    if( uim ){
				s = uim.id.replace(/\.fit[s]?/i, ".jpeg")
				          .replace(/\.png$/i, ".jpeg")
				          .replace(/\.gz$/i, "")
				          .replace(/\[.*\]/,"");
				uim.saveJPEG(s);
			    }
			    break;
			case "print":
			    if( uim ){
				uim.print();
			    }
			    break;
			case "windowPrint":
			    if( window.isElectron && window.electronIPC ){
				JS9.WindowPrint();
			    }
			    break;
			case "windowPDF":
			    if( window.isElectron && window.electronIPC ){
				JS9.WindowToPDF();
			    }
			    break;
			case "separate":
			    if( udisp ){
				udisp.separate();
			    }
			    break;
			case "gather":
			    if( udisp ){
				if( (that.id.search(JS9.SUPERMENU) >= 0) &&
				    !that.selectedDisplay 		 ){
				    JS9.error("gather requires a selected display");
				}
				udisp.gather();
			    }
			    break;
			default:
			    // maybe its a supermenu request
			    if( key.match(/^super_/) ){
				unew = key.replace(/^super_/,"");
				JS9.Menubar.onclick.call(that, unew);
				return;
			    }
			    // maybe it's a moveto request
			    if( key.match(/^moveto_/) ){
				unew = key.replace(/^moveto_/,"");
				if( unew === "newdisp" ){
				    uwin = "JS9_light" + JS9.uniqueID();
			            $("#dhtmlwindowholder").arrive("#" + uwin,
                                    {onceOnly: true}, function(){
					uim.moveToDisplay(uwin);
				    });
				    JS9.LoadWindow(null,
                                                   {id: uwin, clone: udisp.id},
                                                   "light");
				} else {
				    uim.moveToDisplay(unew);
				}
				return;
			    }
			    if( uim && key.match(/^sync_/) ){
				uobj = $.contextMenu.getInputValues(opt);
				if( uobj.syncops ){
				    uarr = uobj.syncops.trim().split(",");
				} else {
				    uarr = null;
				}
				uopts = {reciprocate: uobj.syncreciprocate};
				unew = key.replace(/^sync_/,"");
				if( unew === "allimages" ){
				    uim.syncImages(uarr, null, uopts);
				} else {
				    uim.syncImages(uarr, [unew], uopts);
				}
				return;
			    }
			    if( uim && key.match(/^unsync_/) ){
				uobj = $.contextMenu.getInputValues(opt);
				if( uobj.unsyncops ){
				    uarr = uobj.unsyncops.trim().split(",");
				} else {
				    uarr = null;
				}
				uopts = {reciprocate: uobj.syncreciprocate};
				unew = key.replace(/^unsync_/,"");
				if( unew === "allimages" ){
				    uim.unsyncImages(uarr, null, uopts);
				} else {
				    uim.unsyncImages(uarr, [unew], uopts);
				}
				return;
			    }
			    for(j=0; j<JS9.images.length; j++){
				uim = JS9.images[j];
				kid = key.replace(/ *\((red|green|blue)\)/,"");
				if( (udisp.id === uim.display.id) &&
				    (uim.id === kid) ){
				    // display image, 2D graphics, etc.
				    uim.displayImage("all");
				    uim.refreshLayers();
				    udisp.clearMessage();
				    break;
				}
			    }
			    break;
			}
		    });
                    },
		    items: items
		};
            }
	});
	// Edit: make button open the contextMenu
	$("#editMenu" + that.id).on("mousedown", function(evt){
            evt.preventDefault();
            $("#editMenu" + that.id).contextMenu();
	});
    // define contextMenu actions
    $.contextMenu({
        selector: "#editMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var n=0;
	    var items = {};
	    // plugins
	    items.edittitle1 = {
		name: "Regions:",
		disabled: true
	    };
	    items.configSelReg = xname("edit selected");
	    items.copySelReg = xname("copy selected");
	    items.copyAllReg = xname("copy all");
	    items.pasteReg = xname("paste to region pos");
	    items.pastePos = xname("paste to current pos");
	    items["sep" + n++] = "------";
	    items.edittitle2 = {
		name: "Position/Value:",
		disabled: true
	    };
	    items.copyWCSPos = xname("copy wcs pos");
	    items.copyValPos = xname("copy value/pos");
	    return {
		callback: function(key){
		    JS9.Menubar.getDisplays.call(that).forEach(function(val){
		        var s, ulayer, utarget;
			var udisp = val;
			var uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			switch(key){
			case "copyAllReg":
			    if( uim ){
				s = uim.listRegions("all", {mode: 1});
				JS9.CopyToClipboard(s);
			    }
			    break;
			case "copySelReg":
			    if( uim ){
				s = uim.listRegions("selected", {mode: 1});
				JS9.CopyToClipboard(s);
			    }
			    break;
			case "configSelReg":
			    if( uim ){
				ulayer = uim.layers.regions;
				if( ulayer ){
				    utarget = ulayer.canvas.getActiveObject();
				    JS9.Regions.displayConfigForm.call(uim,
								       utarget);
				}
			    }
			    break;
			case "pasteReg":
			    if( uim ){
				JS9.Regions.pasteFromClipboard.call(uim);
			    }
			    break;
			case "pastePos":
			    if( uim ){
				JS9.Regions.pasteFromClipboard.call(uim,
								    true);
			    }
			    break;
			case "copyWCSPos":
			    if( JS9.hasOwnProperty("Keyboard") ){
				JS9.Keyboard.Actions["copy wcs position to clipboard"](uim, uim.ipos);
			    }
			    break;
			case "copyValPos":
			    if( JS9.hasOwnProperty("Keyboard") ){
				JS9.Keyboard.Actions["copy value and position to clipboard"](uim, uim.ipos);
			    }
			    break;
			default:
			    break;
			}
		    });
		},
		items: items
	    };
	}
    });
    // viewMac: make button open the contextMenu
    $("#viewMacMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#viewMacMenu" + that.id).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: "#viewMacMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var i, menu;
	    var items = {};
	    items.edittitle1 = {
		name: "View:",
		disabled: true
	    };
	    for(i=0; i<that.macmenus.length; i++){
		menu = that.macmenus[i];
		items[menu.name] = {
		    name: menu.title + " ..."
		};
	    }
	    return{
		callback: function(key){
		    switch(key){
		    default:
			$("#" + key + "Menu" + that.id).contextMenu();
			break;
		    }
		},
		items: items
	    };
	}
    });
    
    // View: make button open the contextMenu
    $("#viewMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#viewMenu" + that.id).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: "#viewMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var i, plugin, pname, pinst, key;
	    var lastxclass="";
	    var n = 0;
	    var items = {};
	    var tdisp = JS9.Menubar.getDisplays.call(that)[0];
	    var tim = tdisp.image;
	    var editResize = function(disp, obj){
		var v1, v2, arr;
		delete tdisp.tmp.editingMenu;
		if( obj.resize ){
		    arr = obj.resize.split(/[\s,\/]+/);
		    switch(arr.length){
		    case 0:
			break;
		    case 1:
			if( tim ){
			    v1 = tim.wcs2imlen(arr[0]);
			    disp.resize(v1, v1);
			} else if( JS9.isNumber(arr[0]) ){
			    v1 = parseInt(arr[0], 10);
			    disp.resize(v1, v1);
			}
			break;
		    default:
			if( tim && tim.wcs ){
			    v1 = tim.wcs2imlen(arr[0]);
			    v2 = tim.wcs2imlen(arr[1]);
			    disp.resize(v1, v2);
			} else if( JS9.isNumber(arr[0]) && 
				   JS9.isNumber(arr[1]) ){
			    v1 = parseInt(arr[0], 10);
			    v2 = parseInt(arr[1], 10);
			    disp.resize(v1, v2);
			}
			break;
		    }
		}
	    };
	    var keyResize = function(e){
		JS9.Menubar.getDisplays.call(that).forEach(function(val){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = val;
		    // make sure display is still valid
		    if( $.inArray(vdisp, JS9.displays) < 0 ){
			return;
		    }
		    switch( keycode ){
		    case 9:
		    case 13:
			editResize(vdisp, obj);
			break;
		    default:
			vdisp.tmp.editingMenu = true;
			break;
		    }
		});
	    };
	    // plugins
	    items["sep" + n++] = {name: "Plugins:"};
	    items["sep" + (n-1)].disabled = true;
	    for(i=0; i<JS9.plugins.length; i++){
		plugin = JS9.plugins[i];
		pname = plugin.name;
		if( plugin.opts.menuItem && (plugin.opts.menu === "view") ){
		    pinst = tdisp.pluginInstances[pname];
		    if( !pinst || pinst.winHandle ){
			if( plugin.xclass !== lastxclass ){
			    // items["sep" + n] = "------";
			    n = n + 1;
			}
			lastxclass = plugin.xclass;
			items[pname] = xname(plugin.opts.menuItem);
			if( pinst && (pinst.status === "active") ){
			    items[pname].icon = "sun";
			}
		    }
		}
	    }
	    items["sep" + n++] = "------";
	    items.valpos = xname("display value/position");
	    // disable if we don't have info plugin
	    if( !JS9.hasOwnProperty("Info") ){
		items.valpos.disabled = true;
	    } else if( tdisp.image && tdisp.image.params.valpos ){
		items.valpos.icon = "sun";
	    }
	    items.xhair = xname("display crosshair for this image");
	    // disable if we don't have info plugin
	    if( !JS9.hasOwnProperty("Crosshair") || !tim ){
		items.xhair.disabled = true;
	    } else if( tim && tim.params.crosshair ){
		items.xhair.icon = "sun";
	    }
	    items.xhairwcs = xname("match wcs with other crosshairs");
	    // disable if we don't have info plugin
	    if( !JS9.hasOwnProperty("Crosshair") ){
		items.xhairwcs.disabled = true;
	    } else if( JS9.globalOpts.wcsCrosshair ){
		items.xhairwcs.icon = "sun";
	    }
	    items.toolbar = xname("display toolbar tooltips");
	    // disable if we don't have toolbar plugin
	    if( !JS9.hasOwnProperty("Toolbar") ){
		items.toolbar.disabled = true;
	    } else if( JS9.GetToolbar("showTooltips") ){
		items.toolbar.icon = "sun";
	    }
	    if( tim && tim.toggleLayers ){
		items.toggleLayers = xname("show active shape layers");
	    } else {
		items.toggleLayers = xname("hide active shape layers");
	    }
	    items.inherit = xname("new image inherits current params");
	    if( tdisp.image && tdisp.image.params.inherit ){
		items.inherit.icon = "sun";
	    }
	    items["sep" + n++] = "------";
	    items.rawlayer = {
		name: "raw data layers",
		items: {}
	    };
	    if( tim && tim.raws.length > 1 ){
		for(i=0; i<tim.raws.length; i++){
		    key = "rawlayer_" + tim.raws[i].id;
		    items.rawlayer.items[key] = {
			name: tim.raws[i].id
		    };
		    if( tim.raw === tim.raws[i] ){
			items.rawlayer.items[key].icon = "sun";
		    }
		}
		items.rawlayer.items["sep" + n++] = "------";
		items.rawlayer.items.rawlayer_remove = xname("remove");
	    } else {
		items.rawlayer.disabled = true;
	    }
	    items["sep" + n++] = "------";
	    items.resize = {
		events: {keyup: keyResize},
		name: "change width/height:",
		type: "text"
	    };
	    items.imagesize = xname("set to image size");
	    items.fullsize = xname("set size to full window");
	    items.resetsize = xname("reset to original size");
	    if( !JS9.globalOpts.resize ){
		items.resize.disabled = true;
		items.fullsize.disabled = true;
		items.imagesize.disabled = true;
		items.resetsize.disabled = true;
	    } else if( !tim ){
		items.imagesize.disabled = true;
	    }
	    return {
		callback: function(key){
		    JS9.Menubar.getDisplays.call(that).forEach(function(val){
		        var ii, uplugin, s;
			var udisp = val;
			var uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			switch(key){
			case "valpos":
			    if( uim ){
				uim.toggleValpos();
			    }
			    break;
			case "xhair":
			    if( uim ){
				uim.toggleCrosshair();
			    }
			    break;
			case "xhairwcs":
			    if( uim ){
				uim.toggleWCSCrosshair();
			    }
			    break;
			case "toolbar":
			    s = !JS9.GetToolbar("showTooltips");
			    JS9.SetToolbar("showTooltips", s);
			    break;
			case "toggleLayers":
			    if( uim ){
				uim.toggleShapeLayers();
			    }
			    break;
			case "inherit":
			    if( uim ){
				uim.params.inherit = !uim.params.inherit;
			    }
			    break;
			case "fullsize":
			    udisp.resize("full", {center: true});
			    break;
			case "imagesize":
			    udisp.resize("image");
			    break;
			case "resetsize":
			    udisp.resize("reset");
			    break;
			default:
			    // maybe it's a plugin
			    for(ii=0; ii<JS9.plugins.length; ii++){
				uplugin = JS9.plugins[ii];
				if( uplugin.name === key ){
				    udisp.displayPlugin(uplugin);
				    return;
				}
			    }
			    // maybe its a raw data layer
			    if( tim && key.match(/^rawlayer_/) ){
				s = key.replace(/^rawlayer_/, "");
				if( s === "remove" ){
				    for(i=0; i<tim.raws.length; i++){
					if( tim.raw === tim.raws[i] ){
					    tim.rawDataLayer(tim.raw.id,
							     "remove");
					}
				    }
				} else {
				    tim.rawDataLayer(s);
				}
			    }
			    break;
			}
		    });
		},
		events: {
		    show: function(opt){
			var udisp = that.display;
			var obj = {};
			if( udisp  ){
			    obj.resize = sprintf("%d %d",
						 udisp.width, udisp.height);
			    $.contextMenu.setInputValues(opt, obj);
			    JS9.jupyterFocus(".context-menu-item");
			}
		    },
		    hide: function(opt){
			var obj;
			var udisp = that.display;
			if( udisp ){
			    // if a key was pressed, do the edit
			    if( udisp.tmp.editingMenu ){
				obj = $.contextMenu.getInputValues(opt);
				editResize(udisp, obj);
			    }
			}
		    }
		},
		items: items
	    };
	}
    });
    // Zoom: make button open the contextMenu
    $("#zoomMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#zoomMenu" + that.id).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: "#zoomMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var i, zoom, zoomp, name, name2;
	    var n = 0;
	    var tdisp = JS9.Menubar.getDisplays.call(that)[0];
	    var tim = tdisp.image;
	    var editZoom = function(im, obj){
		delete tdisp.tmp.editingMenu;
		if( !isNaN(obj.zoom) ){
		    im.setZoom(obj.zoom);
		}
	    };
	    var keyZoom = function(e){
		JS9.Menubar.getDisplays.call(that).forEach(function(val){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = val;
		    var vim = vdisp.image;
		    // make sure display is still valid
		    if( $.inArray(vdisp, JS9.displays) < 0 ){
			return;
		    }
		    switch( keycode ){
		    case 9:
		    case 13:
			if( vim ){
			    editZoom(vim, obj);
			}
			break;
		    default:
			vdisp.tmp.editingMenu = true;
			break;
		    }
		});
	    };
	    var items = {};
	    items.zoomtitle = {
		name: "Zoom Factors:",
		disabled: true
	    };
	    for(i=JS9.imageOpts.zooms; i>=1; i--){
		zoom = Math.pow(2,-i);
		zoomp = Math.pow(2,i);
		name = sprintf("zoom%s", zoom);
		name2 = sprintf("zoom 1/%s", zoomp);
		items[name] = xname(name2);
		if( tim && (tim.rgb.sect.zoom === zoom) ){
		    items[name].icon = "sun";
		}
	    }
	    for(i=0; i<=JS9.imageOpts.zooms; i++){
		zoom = Math.pow(2,i);
		name = sprintf("zoom%s", zoom);
		name2 = sprintf("zoom %s", zoom);
		items[name] = xname(name2);
		if( tim && (tim.rgb.sect.zoom === zoom) ){
		    items[name].icon = "sun";
		}
	    }
	    items["sep" + n++] = "------";
	    items.zoomiotitle = {
		name: "Zoom In/Out:",
		disabled: true
	    };
	    items.zoomIn = xname("zoom in");
	    items.zoomOut = xname("zoom out");
	    items.zoomToFit = xname("zoom to fit");
	    items["sep" + n++] = "------";
	    items.zoom = {
		events: {keyup: keyZoom},
		name: "numeric zoom value:",
		type: "text"
	    };
	    items["sep" + n++] = "------";
	    items.center = xname("pan to center");
	    items.reset = xname("reset zoom/pan");
	    return {
		callback: function(key){
		    JS9.Menubar.getDisplays.call(that).forEach(function(val){
			var udisp = val;
			var uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			if( uim ){
			    switch(key){
			    case "zoomIn":
				uim.setZoom("x2");
				break;
			    case "zoomOut":
				uim.setZoom("/2");
				break;
			    case "zoomToFit":
				uim.setZoom("tofit");
				break;
			    case "center":
				uim.setPan();
				break;
			    case "reset":
				uim.setZoom("1");
				uim.setPan();
				break;
			    default:
				// look for a numeric zoom
				if( key.match(/^zoom/) ){
				    uim.setZoom(key.slice(4));
				}
				break;
			    }
			}
		    });
		},
		events: {
		    show: function(opt){
			var udisp = that.display;
			var uim = udisp.image;
			var obj = {};
			if( uim  ){
			    obj.zoom =
				String(uim.rgb.sect.zoom);
			}
			$.contextMenu.setInputValues(opt, obj);
			JS9.jupyterFocus(".context-menu-item");
		    },
		    hide: function(opt){
			var obj;
			var udisp = that.display;
			var uim = udisp.image;
			if( uim ){
			    // if a key was pressed, do the edit
			    if( udisp.tmp.editingMenu ){
				obj = $.contextMenu.getInputValues(opt);
				editZoom(uim, obj);
			    }
			}
		    }
		},
		items: items
	    };
	}
    });
    // Scale: make button open the contextMenu
    $("#scaleMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#scaleMenu" + that.id).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: "#scaleMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var i, s1, s2;
	    var plugin, pname, pinst;
	    var lastxclass="";
	    var n = 0;
	    var items = {};
	    var tdisp = JS9.Menubar.getDisplays.call(that)[0];
	    var editScale = function(im, obj){
		var dval1 = im.params.scalemin;
		var dval2 = im.params.scalemax;
		delete tdisp.tmp.editingMenu;
		if( JS9.isNumber(obj.scalemin) ){
		    dval1 = parseFloat(obj.scalemin);
		}
		if( JS9.isNumber(obj.scalemax) ){
		    dval2 = parseFloat(obj.scalemax);
		}
		im.setScale(dval1, dval2);
		im.displayImage("colors");
	    };
	    var keyScale = function(e){
		JS9.Menubar.getDisplays.call(that).forEach(function(val){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = val;
		    var vim = vdisp.image;
		    // make sure display is still valid
		    if( $.inArray(vdisp, JS9.displays) < 0 ){
			return;
		    }
		    switch( keycode ){
		    case 9:
		    case 13:
			if( vim ){
			    editScale(vim, obj);
			}
			break;
		    default:
			vdisp.tmp.editingMenu = true;
			break;
		    }
		});
	    };
	    items.scaletitle = {name: "Scaling Algorithms:",
				disabled: true};
	    for(i=0; i<JS9.scales.length; i++){
		s1 = JS9.scales[i];
		s2 = s1;
		items[s1] = xname(s2);
		if( tdisp.image && (tdisp.image.params.scale === s1) ){
		    items[s1].icon = "sun";
		}
	    }
	    items["sep" + n++] = "------";
	    items.scalemin = {
		events: {keyup: keyScale},
		name: "low clipping limit:",
		type: "text"
	    };
	    items.scalemax = {
		events: {keyup: keyScale},
		name: "high clipping limit:",
		type: "text"
	    };
	    items["sep" + n++] = "------";
	    // plugins
	    for(i=0; i<JS9.plugins.length; i++){
		plugin = JS9.plugins[i];
		pname = plugin.name;
		if( plugin.opts.menuItem && (plugin.opts.menu === "scale") ){
		    pinst = tdisp.pluginInstances[pname];
		    if( !pinst || pinst.winHandle ){
			if( plugin.xclass !== lastxclass ){
			    // items["sep" + n] = "------";
			    n = n + 1;
			}
			lastxclass = plugin.xclass;
			items[pname] = xname(plugin.opts.menuItem);
			if( pinst && (pinst.status === "active") ){
			    items[pname].icon = "sun";
			}
		    }
		}
	    }
	    return {
                callback: function(key){
		    var ii, uplugin;
		    JS9.Menubar.getDisplays.call(that).forEach(function(val){
			var udisp = val;
			var uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			if( uim ){
			    switch(key){
			    default:
				// maybe it's a plugin
				for(ii=0; ii<JS9.plugins.length; ii++){
				    uplugin = JS9.plugins[ii];
				    if( uplugin.name === key ){
					udisp.displayPlugin(uplugin);
					return;
				    }
				}
				uim.setScale(key);
				break;
			    }
			}
		    });
		},
		events: {
		    show: function(opt){
			var udisp = that.display;
			var uim = udisp.image;
			var obj = {};
			if( uim  ){
			    obj.scalemin =
				JS9.floatToString(uim.params.scalemin);
			    obj.scalemax =
				JS9.floatToString(uim.params.scalemax);
			}
			$.contextMenu.setInputValues(opt, obj);
			JS9.jupyterFocus(".context-menu-item");
		    },
		    hide: function(opt){
			var obj;
			var udisp = that.display;
			var uim = udisp.image;
			if( uim ){
			    // if a key was pressed, do the edit
			    if( udisp.tmp.editingMenu ){
				obj = $.contextMenu.getInputValues(opt);
				editScale(uim, obj);
			    }
			}
		    }
		},
		items: items
	    };
	}
    });
    // Color: make button open the contextMenu
    $("#colorMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#colorMenu" + that.id).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: "#colorMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var i, s1, s2, arr;
	    var n = 0;
	    var items = {};
	    var tdisp = JS9.Menubar.getDisplays.call(that)[0];
	    var editColor = function(im, obj){
		delete tdisp.tmp.editingMenu;
		if( obj.contrast && !isNaN(obj.contrast) ){
		    im.params.contrast = parseFloat(obj.contrast);
		}
		if( obj.bias && !isNaN(obj.bias) ){
		    im.params.bias = parseFloat(obj.bias);
		}
		if( !isNaN(obj.opacity) ){
		    if( obj.opacity !== "" ){
			im.params.opacity = parseFloat(obj.opacity);
		    } else {
			im.params.opacity = 1.0;
		    }
		}
		im.displayImage("colors");
	    };
	    var keyColor = function(e){
		JS9.Menubar.getDisplays.call(that).forEach(function(val){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = val;
		    var vim = vdisp.image;
		    // make sure display is still valid
		    if( $.inArray(vdisp, JS9.displays) < 0 ){
			return;
		    }
		    switch( keycode ){
		    case 9:
		    case 13:
			editColor(vim, obj);
			break;
		    default:
			vdisp.tmp.editingMenu = true;
			break;
		    }
		});
	    };
	    items.cmaptitle = {
		name: "Colormaps:",
		disabled: true
	    };
	    for(i=0; i<JS9.globalOpts.topColormaps.length; i++){
		s1 = JS9.globalOpts.topColormaps[i];
		s2 = s1;
		items[s1] = xname(s2);
		if( tdisp.image && (tdisp.image.cmapObj.name === s1) ){
		    items[s1].icon = "sun";
		}
	    }
	    items.morecmaps = {
		name: "more colormaps ...",
		items: {
		    morecmapstitle: {
			name: "Colormaps:",
			disabled: true
		    }
		}
	    };
	    for(i=0; i<JS9.colormaps.length; i++){
		s1 = JS9.colormaps[i].name;
		if( JS9.globalOpts.topColormaps.indexOf(s1) === -1 ){
		    s2 = s1;
		    items.morecmaps.items[s1] = xname(s2);
		    if( tdisp.image && (tdisp.image.cmapObj.name === s1) ){
			items.morecmaps.items[s1].icon = "sun";
		    }
                }
	    }
	    items["sep" + n++] = "------";
	    items.imfilter = {
		name: "image filters",
		items: {
		    imfiltertitle: {
			name: "adjust colors using:",
			disabled: true
		    }
		    
		}
	    };
	    arr = JS9.Image.prototype.filterRGBImage.call(null).sort();
	    for(i=0; i<arr.length; i++){
		if( arr[i] === "convolve" ){
		    continue;
		}
		s1 = "imfilter_" + arr[i];
		items.imfilter.items[s1] = {
		    name: arr[i]
		};
	    }
	    items["sep" + n++] = "------";
	    items.contrast = {
		events: {keyup: keyColor},
		name: "contrast value:",
		type: "text"
	    };
	    items.bias = {
		events: {keyup: keyColor},
		name: "bias value:",
		type: "text"
	    };
	    items.opacity = {
		events: {keyup: keyColor},
		name: "opacity value:",
		type: "text"
	    };
	    items["sep" + n++] = "------";
	    items.reset = xname("reset contrast/bias");
	    items["sep" + n++] = "------";
	    items.loadcmap = xname("load colormap");
	    items.savecmap = xname("save colormap");
	    items.invert = xname("invert colormap");
	    if( tdisp.image && tdisp.image.params.invert ){
		items.invert.icon = "sun";
	    }
	    items["sep" + n++] = "------";
	    items.rgb = xname("RGB mode");
	    if( JS9.globalOpts.rgb.active ){
		items.rgb.icon = "sun";
	    }
	    return {
		callback: function(key){
		    JS9.Menubar.getDisplays.call(that).forEach(function(val){
			var udisp = val;
			var uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			if( uim ){
			    switch(key){
			    case "loadcmap":
				JS9.OpenColormapMenu({display: udisp});
				break;
			    case "savecmap":
				JS9.SaveColormap({display: udisp});
				break;
			    default:
				if( key.match(/^imfilter_/) ){
				    s1 = key.replace(/^imfilter_/,"");
				    uim.filterRGBImage(s1);
				    return;
				}
				uim.setColormap(key);
			    }
			}
		    });
		},
		events: {
		    show: function(opt){
			var udisp = that.display;
			var uim = udisp.image;
			var obj = {};
			if( uim  ){
			    obj.contrast = String(uim.params.contrast);
			    obj.bias = String(uim.params.bias);
			    obj.opacity = String(uim.params.opacity);
			    obj.sigma = String(uim.params.sigma);
			}
			$.contextMenu.setInputValues(opt, obj);
			JS9.jupyterFocus(".context-menu-item");
		    },
		    hide: function(opt){
			var obj;
			var udisp = that.display;
			var uim = udisp.image;
			if( uim ){
			    // if a key was pressed, do the edit
			    if( udisp.tmp.editingMenu ){
				obj = $.contextMenu.getInputValues(opt);
				editColor(uim, obj);
			    }
			}
		    }
		},
		items: items
	    };
	}
    });
    // Region: make button open the contextMenu
    $("#regionMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#regionMenu" + that.id).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: "#regionMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var i, s1;
	    var tdisp = JS9.Menubar.getDisplays.call(that)[0];
	    var tim = tdisp.image;
	    var items = {};
	    items.regiontitle = {
		name: "Regions:",
		disabled: true
	    };
	    items.annulus = xname("annulus");
	    items.box = xname("box");
	    items.circle = xname("circle");
	    items.ellipse = xname("ellipse");
	    items.line = xname("line");
	    items.point = xname("point");
	    items.polygon = xname("polygon");
	    items.text = xname("text");
	    items.sep1 = "------";
	    items.loadRegions  = xname("load new regions");
	    items.saveRegions  = xname("save all regions");
	    items.listRegions  = xname("list all regions");
	    items.removeRegions  = xname("remove all regions");
	    items.copyto  = {
		name: "copy all regions to ...",
		items: {
		    copytotitle: {
			name: "choose image:",
			disabled: true
		    }
		}
	    };
	    items.sep2 = "------";
	    items.selectops = {
		name: "selected regions ...",
		items: {
		    selopstitle:{
			name:"actions on selected:",
			disabled: true
		    },
		    srcSelReg: xname("set tag: source"),
		    bkgSelReg: xname("set tag: bkgd"),
		    incSelReg: xname("set tag: include"),
		    exclSelReg: xname("set tag: exclude"),
		    sbSelReg: xname("toggle: src/bkgd"),
		    ieSelReg: xname("toggle: incl/excl"),
		    configSelReg: xname("edit selected"),
		    listSelReg: xname("list selected"),
		    removeSelReg: xname("remove selected"),
		    copySelReg: {
			name: "copy selected to ...",
			items: {
			    copyseltotitle: {
				name: "choose image:",
				disabled: true
			    }
			}
		    }
		} 
	    };
	    items.sep3 = "------";
	    items.listonchange  = xname("list on change");
	    items.xeqonchange  = xname("xeq on change");
	    if( tim && (JS9.images.length > 1) ){
		for(i=0; i<JS9.images.length; i++){
		    if( tim !== JS9.images[i] ){
			s1 = "copyto_" + JS9.images[i].id;
			items.copyto.items[s1] = xname(JS9.images[i].id);
			s1 = "copyselto_" + JS9.images[i].id;
			items.selectops.items.copySelReg.items[s1] =
			    xname(JS9.images[i].id);
		    }
		}
		items.copyto.items.copyto_all = xname("all images");
		items.copyto.disabled = false;
	    } else {
		items.copyto.disabled = true;
	    }
	    // disable if we don't have info plugin
	    if( !JS9.hasOwnProperty("Info") ){
		items.listRegions.disabled = true;
	    }
	    if( tim && tim.params.listonchange ){
		items.listonchange.icon = "sun";
	    }
	    if( tim && tim.params.xeqonchange ){
		items.xeqonchange.icon = "sun";
	    }
	    return {
		callback: function(key){
		    JS9.Menubar.getDisplays.call(that).forEach(function(val){
			var uid, ulayer, utarget;
			var udisp = val;
			var uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			if( uim ){
			    switch(key){
			    case "loadRegions":
				JS9.OpenRegionsMenu({display: udisp});
				break;
			    case "saveRegions":
				uim.saveRegions("js9.reg", "all");
				break;
			    case "listRegions":
				uim.listRegions("all", {mode: 2});
				break;
			    case "removeRegions":
				uim.removeShapes("regions", "all");
				udisp.clearMessage("regions");
				break;
			    case "srcSelReg":
				uim.editRegionTags("selected",
						   "source", "background");
				break;
			    case "bkgSelReg":
				uim.editRegionTags("selected",
						   "background", "source");
				break;
			    case "incSelReg":
				uim.editRegionTags("selected",
						   "include", "exclude");
				break;
			    case "exclSelReg":
				uim.editRegionTags("selected",
						   "exclude", "include");
				break;
			    case "sbSelReg":
				uim.toggleRegionTags("selected",
						     "source", "background");
				break;
			    case "ieSelReg":
				uim.toggleRegionTags("selected",
						     "exclude", "include");
				break;
			    case "configSelReg":
				ulayer = uim.layers.regions;
				if( ulayer ){
				    utarget = ulayer.canvas.getActiveObject();
				    JS9.Regions.displayConfigForm.call(uim,
								       utarget);
				}
				break;
			    case "listSelReg":
				uim.listRegions("selected", {mode: 2});
				break;
			    case "removeSelReg":
				uim.removeShapes("regions", "selected");
				udisp.clearMessage("regions");
				break;
			    case "xeqonchange":
				uim.params.xeqonchange = !uim.params.xeqonchange;
				break;
			    case "listonchange":
				uim.params.listonchange = !uim.params.listonchange;
				break;
			    default:
				// maybe it's a copyto request
				if( key.match(/^copyto_/) ){
				    uid = key.replace(/^copyto_/,"");
				    uim.copyRegions(uid);
				    return;
				}
				if( key.match(/^copyselto_/) ){
				    uid = key.replace(/^copyselto_/,"");
				    uim.copyRegions(uid, "selected");
				    return;
				}
				// otherwise it's new region
				uim.addShapes("regions", key, {ireg: true});
				break;
			    }
			}
		    });
		},
		items: items
	    };
	}
    });
    // WCS: make button open the contextMenu
    $("#wcsMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#wcsMenu" + that.id).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: "#wcsMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var i, s1, s2, key, altwcs;
	    var n=0, nwcs=0, got=0;
	    var items = {};
	    var tdisp = JS9.Menubar.getDisplays.call(that)[0];
	    var tim = tdisp.image;
	    var editRotate = function(im, obj){
		delete tdisp.tmp.editingMenu;
		if( JS9.isNumber(obj.rot) ){
		    im.rotateData(parseFloat(obj.rot));
		}
	    };
	    var keyRotate = function(e){
		JS9.Menubar.getDisplays.call(that).forEach(function(val){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = val;
		    var vim = vdisp.image;
		    // make sure display is still valid
		    if( $.inArray(vdisp, JS9.displays) < 0 ){
			return;
		    }
		    switch( keycode ){
		    case 9:
		    case 13:
			if( vim ){
			    editRotate(vim, obj);
			}
			break;
		    default:
			vdisp.tmp.editingMenu = true;
			break;
		    }
		});
	    };
	    items.wcssystitle = {
		name: "WCS Systems:",
		disabled: true
	    };
	    for(i=0; i<JS9.wcssyss.length; i++){
		s1 = JS9.wcssyss[i];
		s2 = s1;
		items[s1] = xname(s2);
		if( tim && (tim.params.wcssys === s1) ){
		    items[s1].icon = "sun";
		    got++;
		}
	    }
	    // if we don't know which wcssys is current, assume "native"
	    if( !got ){
		s1 = "native";
		items[s1].icon = "sun";
	    }
	    items["sep" + n++] = "------";
	    items.wcsutitle = {
		name: "WCS Units:",
		disabled: true
	    };
	    for(i=0; i<JS9.wcsunitss.length; i++){
		s1 = JS9.wcsunitss[i];
		s2 = s1;
		items[s1] = xname(s2);
		if( tim && (tim.params.wcsunits === s1) ){
		    items[s1].icon = "sun";
		}
	    }
	    items["sep" + n++] = "------";
	    items.altwcs = {
		name: "alternate wcs",
		items: {
		    altwcstitle: {
			name: "choose a wcs:",
			disabled: true
		    }
		}
	    };
	    if( !tim || !tim.raw || !tim.raw.altwcs ){
		items.altwcs.disabled = true;
	    } else {
		altwcs = tim.raw.altwcs;
		for(key in altwcs ){
		    if( altwcs.hasOwnProperty(key) ){
			s1 = "altwcs_" + key;
			if( altwcs[key].header.WCSNAME ){
			    s2 = altwcs[key].header.WCSNAME + 
				"    (" + key + ")";
			} else {
			    s2 = key;
			}
			items.altwcs.items[s1] = xname(s2);
			if( tim.raw.wcs === altwcs[key].wcs ){
			    items.altwcs.items[s1].icon = "sun";
			}
			nwcs++;
		    }
		}
		// disable if we only have the default wcs
		if( nwcs < 2 ){
		    items.altwcs.disabled = true;
		    items.altwcs.items.notasks = {
			name: "[none]",
			disabled: true,
			events: {keyup: function(){return;}}
		    };
		}
	    }
	    items["sep" + n++] = "------";
	    items.reproject = {
		name: "wcs reproject ...",
		items: {
		    reprojtitle: {
			name: "using the wcs from:",
			disabled: true
		    }
		}
	    };
	    for(i=0, nwcs=0; i<JS9.images.length; i++){
		if( JS9.images[i].raw.wcs ){
		    if( (tim === JS9.images[i]) &&
			(that.id.search(JS9.SUPERMENU) < 0) ){
			continue;
		    }
		    s1 = "reproject_" + JS9.images[i].id;
		    items.reproject.items[s1] = {
			name: JS9.images[i].id
		    };
		    nwcs++;
		}
	    }
	    if( nwcs === 0 ){
		items.reproject.items.notasks = {
		    name: "[none]",
		    disabled: true,
		    events: {keyup: function(){return;}}
		};
	    } else {
		items.reproject.disabled = false;
		items.reproject.items["sep" + n++] = "------";
		items.reproject.items.reproject_wcsalign = {
		    name: "display wcs-aligned"
		};
		if( tim && (tim.params.wcsalign) ){
		    items.reproject.items.reproject_wcsalign.icon = "sun";
		}
	    }
	    items.reproject.items["sep" + n++] = "------";
	    items.reproject.items.rotatetitle = {
		name: "by rotating the image:",
		disabled: true
	    };
	    items.reproject.items.reproject_northup = {
		name: "so that north is up"
	    };
	    items.reproject.items.rot = {
		events: {keyup: keyRotate},
		name: "using angle in degrees:",
		type: "text"
	    };
	    if( !tim || !tim.raw || !tim.raw.header || !tim.raw.wcsinfo ){
		items.reproject.disabled = true;
	    }
	    return {
                callback: function(key){
		    JS9.Menubar.getDisplays.call(that).forEach(function(val){
			var file, s;
			var rexp = new RegExp(key);
			var udisp = val;
			var uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			if( uim ){
			    // maybe it's an alt wcs request
			    if( key.match(/^altwcs_/) ){
				s = key.replace(/^altwcs_/,"");
				uim.setWCS(s);
				return;
			    }
			    // maybe it's a wcs reprojection request
			    if( key.match(/^reproject_/) ){
				if( key === "reproject_wcsalign" ){
				    uim.params.wcsalign = !uim.params.wcsalign;
				    uim.displayImage("display");
				} else if( key === "reproject_northup" ){
				    uim.rotateData("northisup");
				}  else {
				    file = key.replace(/^reproject_/,"");
				    uim.reprojectData(file);
				}
				return;
			    }
			    // otherwise it's a wcs directive
			    if( JS9.wcssyss.join("@").search(rexp) >=0 ){
				uim.setWCSSys(key);
				uim.updateShapes("regions", "all", "wcs");
			    } else if( JS9.wcsunitss.join("@").search(rexp)>=0){
				uim.setWCSUnits(key);
				uim.updateShapes("regions", "all", "wcs");
			    } else {
				JS9.error("unknown wcs sys/units: " + key);
			    }
			}
		    });
		},
		events: {
		    show: function(opt){
			var udisp = that.display;
			var uim = udisp.image;
			var obj = {};
			if( uim ){
			    obj.rot = "";
			    $.contextMenu.setInputValues(opt, obj);
			    JS9.jupyterFocus(".context-menu-item");
			}
		    },
		    hide: function(opt){
			var obj;
			var udisp = that.display;
			var uim = udisp.image;
			if( uim ){
			    obj = $.contextMenu.getInputValues(opt);
			    // if a key was pressed, do the edit
			    if( udisp.tmp.editingMenu ){
				editRotate(uim, obj);
			    }
			}
		    }
		},
		items: items
	    };
	}
    });
    // ANALYSIS: make button open the contextMenu
    $("#analysisMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#analysisMenu" + that.id).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: "#analysisMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var i, j, s, apackages, atasks;
	    var plugin, pinst, pname;
	    var parr;
	    var parexp = /fitsHeader\(([A-Za-z0-9_]+),(.*)\)/;
	    var winexp = /winVar\((.*),(.*)\)/;
	    var js9exp = /js9Var\((.*),(.*)\)/;
	    var imexp = /imVar\((.*),(.*)\)/;
	    var ntask = 0;
	    var n = 0;
	    // var m = 0;
	    var items = {};
	    var tdisp = JS9.Menubar.getDisplays.call(that)[0];
	    var im = tdisp.image;
	    var lastxclass="";
	    var seq = function(s1, s2){
		if( !s1 || !s2 ){
		    return false;
		}
		return String(s1).toUpperCase() === 
		    String(s2).toUpperCase();
	    };
	    var editAnalysis = function(im, obj){
		delete tdisp.tmp.editingMenu;
		obj.sigma = obj.sigma || "0";
		if( obj.sigma === "none" ){
		    obj.sigma = "0";
		}
		try{ im.params.sigma = parseFloat(obj.sigma); }
		catch(e){ im.params.sigma = 0; }
		im.gaussBlurData(im.params.sigma);
	    };
	    var keyAnalysis = function(e){
		JS9.Menubar.getDisplays.call(that).forEach(function(val){
		    var obj = $.contextMenu.getInputValues(e.data);
		    var keycode = e.which || e.keyCode;
		    var vdisp = val;
		    var vim = vdisp.image;
		    // make sure display is still valid
		    if( $.inArray(vdisp, JS9.displays) < 0 ){
			return;
		    }
		    switch( keycode ){
		    case 9:
		    case 13:
			editAnalysis(vim, obj);
			break;
		    default:
			vdisp.tmp.editingMenu = true;
			break;
		    }
		});
	    };
	    for(i=0; i<JS9.plugins.length; i++){
		plugin = JS9.plugins[i];
		pname = plugin.name;
		if( plugin.opts.menuItem &&
		    (plugin.opts.menu === "analysis") ){
		    pinst = tdisp.pluginInstances[pname];
		    if( !pinst || pinst.winHandle ){
			if( plugin.xclass !== lastxclass ){
			    if( n > 0 ){
				items["sep" + n++] = "------";
			    }
			    items["sep" + n++] =
				{name: plugin.xclass + " Plugins:"};
			    items["sep" + (n-1)].disabled = true;
			}
			lastxclass = plugin.xclass;
			items[pname] = {
			    name: plugin.opts.menuItem
			};
			if( pinst && (pinst.status === "active") ){
			    items[pname].icon = "sun";
			}
			n++;
		    }
		}
	    }
	    // no server side analysis for CDN all-in-one configuration
	    if( !JS9.allinone ){
		if( n > 0 ){
		    items["sep" + n++] = "------";
		}
	        items.localtitle = {
		    name: "Client-side Analysis:",
		    disabled: true
	        };
		items.grid = xname("Coordinate Grid");
		if( !im || !im.raw.wcs || im.raw.wcs <=0 ){
		    items.grid.disabled = true;
		} else {
		    if( im.displayCoordGrid() ){ items.grid.icon = "sun"; }
		}
		items.regcnts = xname("Counts in Regions");
		items.radprof = xname("Radial Profile");
		if( !im || !im.raw || !im.raw.hdu || !im.raw.hdu.vfile ){
		    items.regcnts.disabled = true;
		    items.radprof.disabled = true;
		}
		items.sigma = {
		    events: {keyup: keyAnalysis},
		    name: "Gaussian Blur, Sigma:",
		    type: "text"
		};
		items["sep" + n++] = "------";
	        items.remotetitle = {
		    name: "Server-side Analysis:",
		    disabled: true
	        };
		if( im && im.analysisPackages ){
		    apackages = im.analysisPackages;
		    // m = 0;
		    for(j=0; j<apackages.length; j++){
			atasks = apackages[j];
			for(i=0; i<atasks.length; i++){
			    // sanity check
			    if( !atasks[i].title || !atasks[i].name ){
				continue;
			    }
			    // is this task hidden?
			    if( atasks[i].hidden ){
				continue;
			    }
			    // file validators
			    if( atasks[i].files ){
			    if( atasks[i].files.match(/^fits$/) &&
				!im.fitsFile ){
				continue;
			    }
			    if( atasks[i].files.match(/^png$/) &&
				(im.source !== "fits2png") ){
				continue;
			    }
			    if( atasks[i].files.match(/^table$/) ){
				if( im.imtab !== "table" ){
				    continue;
				}
			    }
			    if( atasks[i].files.match(/^image$/) ){
				if( im.imtab !== "image" ){
				    continue;
				}
			    }
			    // header params: fitsHeader(pname,pvalue)
			    parr = atasks[i].files.match(parexp);
			    if( parr ){
				s = im.raw.header[parr[1].toUpperCase()];
				if( !seq(s, parr[2]) ){
				    continue;
				}
			    }
			    // win vars: winVar(name,value)
			    parr = atasks[i].files.match(winexp);
			    if( parr ){
				s = JS9.varByName(parr[1], window);
				if( !seq(s, parr[2]) ){
				    continue;
				}
			    }
			    // js9 vars: js9Var(name,value)
			    parr = atasks[i].files.match(js9exp);
			    if( parr ){
				s = JS9.varByName(parr[1], JS9);
				if( !seq(s, parr[2]) ){
				    continue;
				}
			    }
			    // im vars: imVar(name,value)
			    parr = atasks[i].files.match(imexp);
			    if( parr ){
				s = JS9.varByName(parr[1], im);
				if( !seq(s, parr[2]) ){
				    continue;
				}
			    }
			    } // end of file validators
			    // separator
			    if( atasks[i].rtype &&
				atasks[i].rtype.match(/^---/) ){
				items["sep" + n++] = "------";
				items[atasks[i].name] = {
				    name: atasks[i].title + ":",
				    disabled: true
				};
				continue;
			    }
			    s = atasks[i].title;
			    if( atasks[i].purl ){
				s += " ...";
			    }
			    items[atasks[i].name] = {
				name: s
			    };
			    ntask++;
			    // m++;
			}
		    }
		}
		if( !ntask ){
		    items.notasks = {
			name: "[none]",
			disabled: true,
			events: {keyup: function(){return;}}
		    };
		    if( JS9.globalOpts.loadProxy &&
			im && im.raw && im.raw.hdu && im.raw.hdu.vfile ){
			items.upload = {
			    name: "upload FITS to make tasks available"
			};
			if( !JS9.helper.connected ||
			    (JS9.helper.type !== "nodejs" &&
			     JS9.helper.type !== "socket.io") ){
			    items.upload.disabled = true;
			}
		    }
		}
		items["sep" + n++] = "------";
	        items.serverconfig = {
		    name: "Server-side Configuration:",
		    disabled: true
	        };
		items.dpath = xname("set data analysis path ...");
		if( JS9.globalOpts.dataPathModify === false ){
		    items.dpath.disabled = true;
		}
		items.fpath = xname("set this image file's path ...");
		if( !im ||
		    (document.domain && document.domain !== "localhost") ){
		    items.fpath.disabled = true;
		}
	    }
	    return {
                callback: function(key){
		    JS9.Menubar.getDisplays.call(that).forEach(function(val){
			var a, did, ii, tplugin;
			var udisp = val;
			var uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			// first look for a plugin -- no image rquired
			for(ii=0; ii<JS9.plugins.length; ii++){
			    tplugin = JS9.plugins[ii];
			    if( tplugin.name === key ){
				udisp.displayPlugin(tplugin);
				return;
			    }
			}
			// the rest need an image loaded
			if( uim ){
			    switch(key){
			    case "regcnts":
				JS9.CountsInRegions("$sregions", "$bregions",
						    {lightwin: true},
						    {display: udisp.id});
				break;
			    case "radprof":
				JS9.RadialProfile("$sregions", "$bregions",
						  {display: udisp.id});
				break;
			    case "dpath":
				// call this once window is loaded
			        $("#dhtmlwindowholder").arrive("#dataPathForm",
							       {onceOnly: true}, function(){
								   $('#dataPath').val(JS9.globalOpts.dataPath);
							       });
				did = uim.displayAnalysis("textline",
							  JS9.InstallDir(JS9.analOpts.dpathURL),
							  {title: "Data path for analysis"});
				// save display id
				$(did).data("dispid", udisp.id);
				$(did).data("imid", uim.id);
				break;
			    case "fpath":
				// call this once window is loaded
			        $("#dhtmlwindowholder").arrive("#filePathForm",
							       {onceOnly: true}, function(){
								   $('#filePath').val(uim.file);
							       });
				did = uim.displayAnalysis("textline",
							  JS9.InstallDir(JS9.analOpts.fpathURL),
							  {title: "File path for this image"});
				// save display id
				$(did).data("dispid", udisp.id);
				$(did).data("imid", uim.id);
				break;
			    case "grid":
				uim.displayCoordGrid(!uim.displayCoordGrid());
				break;
			    case "upload":
				uim.uploadFITSFile();
				break;
			    default:
				// look for analysis routine
				a = uim.lookupAnalysis(key);
				if( a ){
				    // load param url to run analysis task
				    // param url is relative to js9 install dir
				    if( a.purl ){
					did = uim.displayAnalysis("params",
								  JS9.InstallDir(a.purl),
								  {title: a.title+": "+uim.fitsFile,
								   winformat: a.pwin});
					// save info for running the task
					$(did).data("dispid", udisp.id)
				            .data("aname", a.name);
				    } else {
					// else run task directly
					uim.runAnalysis(a.name);
				    }
				}
				return;
			    }
			}
		    });
		},
		events: {
		    show: function(opt){
			var udisp = that.display;
			var uim = udisp.image;
			var obj = {};
			if( uim  ){
			    obj.sigma = String(uim.params.sigma);
			}
			$.contextMenu.setInputValues(opt, obj);
			JS9.jupyterFocus(".context-menu-item");
		    },
		    hide: function(opt){
			var obj;
			var udisp = that.display;
			var uim = udisp.image;
			if( uim ){
			    // if a key was pressed, do the edit
			    if( udisp.tmp.editingMenu ){
				obj = $.contextMenu.getInputValues(opt);
				editAnalysis(uim, obj);
			    }
			}
		    }
		},
		items: items
	    };
	}
    });
    // HELP: make button open the contextMenu
    $("#helpMenu" + that.id).on("mousedown", function(evt){
        evt.preventDefault();
        $("#helpMenu" + that.id).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: "#helpMenu" + that.id,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: function(){
	    var t, key, val;
	    var n = 1;
	    var last = "";
	    var items = {};
	    items.js9help = {
		name: "General help ...", 
		items: {
		    helptitle: {
			name: "General help:",
			disabled: true
		    }
		}
	    };
	    // first, internal js9 pages
	    for( key in JS9.helpOpts ){
		if( JS9.helpOpts.hasOwnProperty(key) ){
		    val = JS9.helpOpts[key];
		    if( val.heading === "JS9Help" ){
			last = val.type;
			items.js9help.items[key] = {
			    name: val.title
			};
		    }
		}
	    }
	    items["sep" + n++] = "------";
	    items.pluginhelp = {
		name: "JS9 plugins ...", 
		items: {
		    helptitle: {
			name: "JS9 plugins:",
			disabled: true
		    }
		}
	    };
	    // second, the JS9 core plugins
	    for( key in JS9.helpOpts ){
		if( JS9.helpOpts.hasOwnProperty(key) ){
		    val = JS9.helpOpts[key];
		    if( val.heading === "JS9" ){
			last = val.type;
			items.pluginhelp.items[key] = {
			    name: val.title.replace(/ \.\.\./, "")
			};
		    }
		}
	    }
	    // last, the others
	    for( key in JS9.helpOpts ){
		if( JS9.helpOpts.hasOwnProperty(key) ){
		    val = JS9.helpOpts[key];
		    if( val.heading === "JS9Help" || 
			val.heading === "JS9" ){
			continue;
		    }
		    if( (last !== "") && (val.type !== last) ){
			items["sep" + n++] = "------";
			if( val.heading ){
			    t = val.heading + " plugins";
			    items["sep" + n++] = {
				name: t + " ...",
				items: {
				    title: {
					name: t + ":",
					disabled: true
				    }
				}
			    };
			}
		    }
		    last = val.type;
		    items["sep" + (n-1)].items[key] = {name: val.title};
		}
	    }
	    items["sep" + n++] = "------";
	    items.about = xname("About JS9");
	    return{
		callback: function(key){
		    switch(key){
		    case "about":
			alert(sprintf("JS9: astronomical image display everywhere\nversion: %s\nEric Mandel, Alexey Vikhlinin\ncontact: eric@cfa.harvard.edu\n%s", JS9.VERSION, JS9.COPYRIGHT));
			break;
		    default:
			JS9.DisplayHelp(key);
			break;
		    }
		},
		items: items
	    };
	}
    });
    // user-defined menus
    addUserMenus();
};

// initialize the menu
JS9.Menubar.init = function(width, height){
    var i, j, ss, tt, menu, html;
    this.issuper = this.id.search(JS9.SUPERMENU) >= 0;
    // save object in super array, if necessary
    if( this.issuper ){
	JS9.supermenus.push(this);
    }
    this.style = this.divjq.attr("data-style") ||
	         JS9.globalOpts.menubarStyle   ||
                 "classic";
    this.style = this.style.toLowerCase();
    // set width and height on div
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
        this.width = width || JS9.Menubar.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    this.buttonClass = this.divjq.attr("data-buttonClass") || "JS9Button" ;
    this.containerClass = "JS9MenubarContainer";
    // special handling of some known button classes
    if( this.buttonClass.match(/-flat/) ){
	this.containerClass += "-flat";
    } else if( this.buttonClass.match(/-border/) ){
	this.containerClass += "-border";
    }
    this.backgroundColor = this.divjq.attr("data-backgroundColor");
    if( !this.height  ){
	this.height = height || JS9.MENUHEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // look for usermenu directive, either for this element or globally
    this.usermenus = this.divjq.attr("data-usermenus") === "true" ||
	JS9.globalOpts.userMenus;
    // generate html for this menubar
    html = "<span id='JS9Menus_@@ID@@'>";
    for(j=0; j<JS9.globalOpts.menuBar.length; j++){
	menu = JS9.globalOpts.menuBar[j];
	for(i=0; i<JS9.Menubar.buttonOptsArr.length; i++){
	    ss = JS9.Menubar.buttonOptsArr[i].name;
	    if( menu === ss ){
		tt = JS9.Menubar.buttonOptsArr[i].label;
		// no help available for all-in-one configuration
		if( JS9.allinone && (ss === "help") ){
		    break;
		}
		if( ss[0] === "#" ){
		    if( this.syle === "classic" ){
			ss = ss.slice(1);
			if( ss[1] !== "#" ){
			    html += "<button type='button' id='"+ss+"Menu@@ID@@' class='"+ this.buttonClass +"' disabled='disabled'>"+tt+" </button>";
			}
		    }
		} else {
		    if( this.style === "classic" ){
			html += "<button type='button' id='"+ss+"Menu@@ID@@' class='"+ this.buttonClass +"'>"+tt+"</button>";
		    } else {
			switch(ss){
			case "file":
			case "edit":
			    html += "<button type='button' id='"+ss+"Menu@@ID@@' class='"+ this.buttonClass +"'>"+tt+"</button>";
			    break;
			case "help":
			    html += "<span style='float:right'><button type='button' id='"+ss+"Menu@@ID@@' class='"+ this.buttonClass +"'>"+tt+"</button></span>";
			    break;
			default:
			    if( !this.macmenus ){
				html += "<span style='position:relative;'><button type='button' id='"+"viewMacMenu@@ID@@' class='"+ this.buttonClass +"'>"+"View"+"</button>";
				this.macmenus = [];
			    }
			    if( tt === "View" ){
				tt = "Plugins";
			    }
			    html += "<button type='button' id='"+ss+"Menu@@ID@@' class='"+ this.buttonClass +"' style='position:absolute;top:0px;left:0px;visibility:hidden;zindex:-1'>"+""+"</button>";
			    this.macmenus.push({name: ss, title: tt});
			    break;
			}
		    }
		}
		break;
	    }
	}
    }
    // close mac-style span on View menux
    if( this.macmenus ){
	html += "</span>";
    }
    // user-defined menus
    if( this.usermenus && JS9.globalOpts.userMenuBar ){
	for(j=0; j<JS9.globalOpts.userMenuBar.length; j++){
	    menu = JS9.globalOpts.userMenuBar[j];
	    if( !menu || !menu.name || !menu.title || !menu.options  ){
		continue;
	    }
	    html += "<button type='button' id='"+menu.name+"UserMenu@@ID@@' class='"+ this.buttonClass +"'>"+menu.title+"</button>";

	}
    }
    // hidden menus
    html += "<button type='button' id='hiddenRegionMenu@@ID@@'class='JS9Button' style='display:none'>R</button>";
    html += "<button type='button' id='hiddenAnchorMenu@@ID@@'class='JS9Button' style='display:none'>R</button>";
    html += "</span>";
    // set the display for this menubar
    this.display = JS9.lookupDisplay(this.id);
    // link back the menubar in the display
    this.display.menubar = this;
    // define menubar
    this.html = html.replace(/@@ID@@/g,this.id);
    // add container to the high-level div
    this.menuConjq = $("<div>")
	.addClass(this.containerClass)
	.attr("width", this.width)
	.attr("height", this.height)
	.html(this.html)
	.appendTo(this.divjq);
    // menubar background color
    if( this.backgroundColor ){
	this.menuConjq.css("background", this.backgroundColor);
    }
    // create the standard menus
    JS9.Menubar.createMenus.call(this);
};

JS9.RegisterPlugin("JS9", "Menubar", JS9.Menubar.init,
		   {onupdateprefs: JS9.Menubar.reset,
		    winDims: [JS9.Menubar.WIDTH, JS9.Menubar.HEIGHT]});

