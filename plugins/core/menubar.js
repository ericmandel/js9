/*
 * JS9 menubar to manage menubar and its menus
 */

/*global $, JS9, sprintf */

"use strict";

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
    "open ...": "open local file",
    "open local ...": "open local file",
    "toggle: src/bkgd": "toggle selected region: source/background",
    "crosshair for this image": "toggle crosshair",
    "toggle: incl/excl": "toggle selected region: include/exclude",
    "full image": "display full image",
    "selected cutouts": "display selected cutouts",
    "refreshed image": "refresh image",
    "light window": "new JS9 light window",
    "active shape layers": "toggle active shape layers",
    "Keyboard Actions": "toggle keyboard actions plugin",
    "Mouse/Touch": "toggle mouse/touch plugin",
    "Preferences": "toggle preferences plugin",
    "Shape Layers": "toggle shape layers plugin",
    "copy": "copy region(s) to clipboard",
    "edit": "edit selected region(s)",
    "paste to current pos": "paste regions to current position",
    "paste to original pos": "paste regions from local clipboard",
    "undo remove": "undo remove of region(s)",
    "to back": "send selected region to back",
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

// avoid repeated errors in the console when we try to laod a missing menu image
JS9.Menubar.EMPTYIMG = "data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODYuMTIgMTcxLjkyIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6bm9uZTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPmVtcHR5PC90aXRsZT48cmVjdCBjbGFzcz0iY2xzLTEiIHdpZHRoPSIxODYuMTIiIGhlaWdodD0iMTcxLjkyIi8+PC9zdmc+";       // inline version of images/empty.svg

JS9.Menubar.missing = {};

// return image unless its known to be missing ... then return empty image
JS9.Menubar.menuImage = function(s){
    let t = s.split("/").reverse()[0];
    if( JS9.Menubar.missing[s] || JS9.Menubar.missing[t] ){
	return JS9.Menubar.EMPTYIMG;
    } else {
	if( JS9.inline && JS9.inline[s] ){
	    // inline image is available
	    return JS9.inline[s];
	} else if( JS9.allinone ){
	    // allinone has to return blank
	    return JS9.Menubar.EMPTYIMG;
	} else if( s.charAt(0) !== "/" ){
	    // external image relative to install directory
	    return JS9.InstallDir(s);
	} else {
	    // external image with full pathname
	    return s;
	}
    }
};

// get displays associated with this menubar, taking supermenus into account
JS9.Menubar.getDisplays = function(mode, key){
    let i, d, s, disp;
    const arr = [];
    mode = mode || "any";
    key = key || "";
    // handle super menu specially ... but only if its not a "super_" request
    if( this.id.search(JS9.SUPERMENU) >= 0 && !key.match(/^super_/) ){
	if( mode !== "all" && this.selectedDisplay ){
	    // make sure display still exists
	    if( $.inArray(this.selectedDisplay, JS9.displays) >= 0 ){
		return [this.selectedDisplay];
	    }
	    this.selectedDislay = null;
	}
	d = this.divjq.data("displays") || "*";
	s = d.split(",");
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
    } else if( this.divjq.data("js9id") === "*" ){
	arr.push(JS9.getDynamicDisplayOr(JS9.displays[0]));
    }
    if( !arr.length ){
	arr.push(this.display);
    }
    return arr;
};

// this callback happens when a click is registered on a display
// we then go through the supermenus, and if one of them contains this display,
// we set its selectedDisplay value so use of the supermenu is then aimed
// only at the selected display
// also used to unset previously set selectedDisplay
//
// called by JS9.mouseupCB with no context, passing current image object
JS9.Menubar.onclick = function(disp){
    let i, arr, supermenu;
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
// to display the menu
JS9.Menubar.createMenus = function(){
    // eslint-disable-next-line no-unused-vars
    const mypos = (opt,  x,  y) => {
	let pos;
	if( !{}.hasOwnProperty.call(window, "Jupyter") ){
	    opt.$menu.position({
		my:  'left top',
		at:  JS9.globalOpts.menuPosition || "left bottom",
		of:  opt.$trigger,
		collision: "fit"
	    });
	} else {
	    // Jupyter gets the wrong position when using $trigger ...
	    pos = opt.$trigger.offset();
	    opt.$menu.css({"left": pos.left+20, "top": pos.top+10});
	}
    };
    const onhide = () => {
	const tdisp = this.display;
	if( JS9.bugs.hide_menu && tdisp.image ){
	    tdisp.image.displayImage("rgb");
	}
    };
    const xname = (name, xact) => {
	let key, hstr, tact;
	let obj = {name: name};
	const gkeyActions = JS9.globalOpts.keyboardActions || {};
	const act = JS9.Menubar.keyMap[name];
	if( !JS9.Menubar.rkeyMap ){
	    JS9.Menubar.rkeyMap = {};
	    for( key of Object.keys(gkeyActions) ){
		JS9.Menubar.rkeyMap[gkeyActions[key]] = key;
	    }
	    JS9.Menubar.keyActions = $.extend(true, {}, gkeyActions);
	}
	if( JS9.notNull(act) && JS9.Menubar.rkeyMap ){
	    key = JS9.Menubar.rkeyMap[act];
	    if( key ){
		hstr = `<span>${name}<span class="JS9MenubarKeyAction">&nbsp;&nbsp;&nbsp;&nbsp;${key}</span></span>`;
		obj = {name: hstr, isHtmlName: true};
	    }
	} else if( xact && JS9.Menubar.rkeyMap ){
	    for( tact of Object.keys(JS9.Menubar.rkeyMap) ){
		if( tact === xact ){
		    key = JS9.Menubar.rkeyMap[tact];
		    if( key ){
			hstr = `<span>${name}<span class="JS9MenubarKeyAction">&nbsp;&nbsp;&nbsp;&nbsp;${key}</span></span>`;
			obj = {name: hstr, isHtmlName: true};
		    }
		}
	    }
	}
	return obj;
    };
    const xeqUserMenu = (evt) => {
	const menu = evt.data;
	evt.preventDefault();
	$(`#${menu.name}UserMenu${this.id}`).contextMenu();
    };
    const addUserMenu = (menu) => {
	if( !menu || !menu.name || !menu.title || !menu.options  ){
	    return;
	}
	// define contextMenu actions
	$.contextMenu({
            selector: `#${menu.name }UserMenu${this.id}`,
	    zIndex: JS9.MENUZINDEX,
	    events: { hide: onhide },
	    position: mypos,
            build: () => {
		let i, opt, hstr, obj;
		const items = {};
		for(i=0; i<menu.options.length; i++){
		    opt = menu.options[i];
		    obj = xname(opt.name, opt.shortcut);
		    if( opt.image ){
			hstr = `<div class='JS9MenubarUserImage' name='${opt.name}'><img src='${opt.image}' name='${menu.name}_${opt.name}' alt='${opt.name}' class='JS9MenubarUserImage JS9MenubarUserImageOption' >` + `&nbsp;&nbsp;${obj.name}</div>`;
			items[opt.name] = {name: hstr, isHtmlName: true};
		    } else {
			items[opt.name] = obj;
		    }
		}
		return {
		    callback: (key, kopt) => {
		    JS9.Menubar.getDisplays.call(this).forEach((val) => {
			let i, s, args, hstr;
			const udisp = val;
			for(i=0; i<menu.options.length; i++){
			    opt = menu.options[i];
			    if( key !== opt.name ){
				continue;
			    }
			    // most commands require an image to be displayed
			    if( opt.requireImage !== false && !udisp.image ){
				continue;
			    }
			    if( typeof JS9.publics[opt.cmd] === "function" ){
				if( typeof opt.args === "function" ){
				    // execute function to get array
				    args = opt.args(udisp, udisp.image);
				} else {
				    // clone array and any objects it contains
				    args =
				    JSON.parse(JSON.stringify(opt.args||[]));
				}
				args.push({display: udisp});
				JS9.publics[opt.cmd](...args);
				// update the menu title
				if( opt.updateTitle !== false ){
				if( opt.image && menu.updateTitle &&
				    menu.updateTitle.match(/(both|image)/) ){
				    if( menu.updateTitle === "both" ){
					hstr = `<div style='white-space:nowrap;'><img src='${opt.image}' name='${menu.name}' alt='${opt.name}' class='JS9MenubarUserImage JS9MenubarUserImageTitle' >` + `&nbsp;&nbsp;${opt.name}</div>`;
				    } else if( menu.updateTitle === "image" ){
					hstr = `<div style='white-space:nowrap;'><img src='${opt.image}' name='${menu.name}' alt='${opt.name}' class='JS9MenubarUserImage JS9MenubarUserImageTitle' ></div>`;
				    }
				    $(kopt.selector).html(hstr);
				} else if( typeof menu.updateTitle === "function" ){
				    try{
					s = menu.updateTitle(udisp.image,
							     menu.name,
							     opt.name);
				    }
				    catch(e){ s = (opt.name || menu.name); }
				    $(kopt.selector).text(s);
				} else if( menu.updateTitle && opt.name ){
				    $(kopt.selector).text(opt.name);
				}
				}
			    } else {
				JS9.error(`unknown func for user menubar: ${opt.cmd}`);
			    }
			}
		    });
		    },
		    items: items
		};
	    }
	});
    };
    const addUserMenus = () => {
	let i, menu;
	if( JS9.globalOpts.userMenuBar ){
	    for(i=0; i<JS9.globalOpts.userMenuBar.length; i++){
		menu = JS9.globalOpts.userMenuBar[i];
		if( !menu || !menu.name || !menu.title  ){
		    continue;
		}
		$(`#${menu.name}UserMenu${this.id}`).on("mousedown",
							 menu, xeqUserMenu);
		addUserMenu(menu);
	    }
	}
    };
    // File menu: make button open the contextMenu
    $(`#fileMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#fileMenu${this.id}`).contextMenu();
    });
    $.contextMenu({
        selector: `#fileMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
	// 'click' prevents long menus from executing a random menu option
	// it has to be put into the first context menu that is registered
	itemClickEvent: JS9.globalOpts.menuClickEvent || "click",
        build: () => {
	    let i, m, im, name, s1, arr, cdisp, got, iobj, cel;
	    let plugin, pname, pinst;
	    let lastxclass="";
	    let n = 0;
	    const items = {};
	    const tdisp = JS9.Menubar.getDisplays.call(this)[0];
	    const tim = tdisp.image;
	    const imlen = JS9.images.length;
	    // the number of images in this display ...
	    for(i=0, got=0; i<imlen; i++){
		im = JS9.images[i];
		if( im.display === tdisp ){
		    got++;
		}
	    }
	    // affects the position of menu title ...
	    if( !got || got >= JS9.globalOpts.imagesFileSubmenu ){
		items.filetitle = {
		    name: "Files and Displays:",
		    disabled: true
		};
	    }
	    // .. because images can be in top-level menu or a submenu
	    if( got && got < JS9.globalOpts.imagesFileSubmenu ){
		items.imagestitle = {
		    name: "Images:",
		    disabled: true
		};
		iobj = items;
	    } else if( got ){
		items.images = {
		    name: "images ...",
		    items: {
			imagestitle: {
			    name: "display this image:",
			    disabled: true
			}
		    }
		};
		iobj = items.images.items;
	    }
	    // add images from this display
	    for(i=0; i<imlen; i++){
		im = JS9.images[i];
		if( im.display === tdisp ){
		    name = im.id;
		    if( tdisp.rgb.active ){
			if( im === tdisp.rgb.rim){
			    name += " (red)";
			}
			if( im === tdisp.rgb.gim){
			    name += " (green)";
			}
			if( im === tdisp.rgb.bim){
			    name += " (blue)";
			}
		    }
		    iobj[name] = xname(name);
		    if( tdisp.image && (tdisp.image.id === im.id) ){
			iobj[name].icon = JS9.globalOpts.menuSelected;
		    }
		}
	    }
	    // add the rest of the menu
	    if( got && got < JS9.globalOpts.imagesFileSubmenu ){
		items[`sep${n++}`] = "------";
		items.filetitle = {
		    name: "Files and Displays:",
		    disabled: true
		};
	    }
	    if( window.electron ){
		items.openboth  = xname("open ...");
	    } else {
		items.openlocal = xname("open local ...");
		items.openremote = xname("open remote ...");
		if( !{}.hasOwnProperty.call(window, "Jupyter") ){
		    items.openremote.disabled = false;
		} else {
		    items.openremote.disabled = true;
		}
	    }
	    items.disps = {
		name: "display ...",
		items: {
		    dispstitle: {
			name: "display:",
			disabled: true
		    }
		}
	    };
	    items.disps.items.header = xname("FITS header");
	    items.disps.items.hdus = xname("FITS HDUs");
	    if( !tim ){
		items.disps.items.header.disabled = true;
	    }
	    if( !tim || !tim.hdus ){
		items.disps.items.hdus.disabled = true;
	    }
	    items.disps.items.refresh = xname("refreshed image");
	    items.disps.items.full = xname("full image");
	    items.disps.items.cutout = xname("selected cutouts");
	    items.disps.items.pageid = xname("page id");
	    if( !tim || !tim.raw || !tim.raw.hdu || !tim.raw.hdu.fits ){
		items.disps.items.refresh.disabled = true;
		items.disps.items.full.disabled = true;
		items.disps.items.cutout.disabled = true;
	    }
	    items.moveto = {
		name: "move ...",
		items: {
		    movetotitle: {
			name: "move to this display:",
			disabled: true
		    }
		}
	    };
	    if( tim ){
		items.moveto.disabled = false;
		for(i=0; i<JS9.displays.length; i++){
		    if( $(`#${JS9.displays[i].id}`).length > 0 &&
			tdisp !== JS9.displays[i]    	     ){
			s1 = `moveto_${JS9.displays[i].id}`;
			items.moveto.items[s1] = xname(JS9.displays[i].id);
		    }
		}
		items.moveto.items.moveto_newdisp = xname("a new display");
	    } else {
		items.moveto.disabled = true;
	    }
	    items.separates = {
		name: "separate ...",
		items: {
		}
	    };
	    if( !JS9.images.length ){
		items.separates.disabled = true;
	    }
	    items.separates.items.separate = xname("separate these images");
	    if( !tim ){
		items.separates.items.separate.disabled = true;
	    }
	    items.separates.items.gather = xname("gather all images here");
	    if( tim && JS9.images.length === 1 ){
		items.separates.items.gather.disabled = true;
	    }
	    items.saveas = {
		name: "save ...",
		items: {
		    saveastitle: {
			name: "save all data as:",
			disabled: true
		    },
		    savefitsentire: xname("FITS"),
		    saveastitle2: {
			name: "save displayed data as:",
			disabled: true
		    },
		    savefits: xname("FITS"),
		    savejpeg: xname("JPEG"),
		    savepng: xname("PNG"),
		    saveastitle3: {
			name: "save memory file as:",
			disabled: true
		    },
		    savefitsvirtual: xname("FITS")
		}
	    };
	    if( !tim ){
		items.saveas.disabled = true;
	    } else if( !tim.raw.hdu || !tim.raw.hdu.fits || !tim.raw.hdu.fits.vfile ){
		items.saveas.items.savefitsvirtual.disabled = true;
	    }
	    items.closes = {
		name: "close ...",
		items: {
		    closestitle: {
			name: "close:",
			disabled: true
		    }
		}
	    };
	    if( !tim ){
		items.closes.disabled = true;
	    }
	    items.closes.items.close = xname("this image");
	    items.closes.items.closeall = xname("all images");
	    items.closes.items.free = xname("this image's memory");
	    items.closes.items.removeproxy = xname("proxy file");
	    if( !tim || !tim.raw || !tim.raw.hdu || !tim.raw.hdu.fits ){
		items.closes.items.free.disabled = true;
	    }
	    if( !tim || !tim.proxyFile ){
		items.closes.items.removeproxy.disabled = true;
	    }
	    items.catalogs = {
		name: "catalog ...",
		items: {
		}
	    };
	    if( !tim ){
		items.catalogs.disabled = true;
	    }
	    items.catalogs.items.loadcatalog = xname("load ...");
	    items.catalogs.items.savecatalog = xname("save active");
	    items.createmosaic = {
		name: "mosaic ...",
		items: {
		    createmosaictitle: {
			name: "create a mosaic using:",
			disabled: true
		    },
		    mosaiccurrent: xname("images in the current file"),
		    mosaicdisplay: xname("images in this display")
		}
	    };
	    if( !tim ){
		items.createmosaic.disabled = true;
	    }
	    items.sessions = {
		name: "session ...",
		items: {
		}
	    };
	    items.sessions.items.loadsession = xname("load ...");
	    items.sessions.items.savesession = {
		name: "save ...",
		items: {
		    savesessiontitle: {
			name: "include these images:",
			disabled: true
		    },
		    savecurrent: xname("the current image"),
		    savedisplay: xname("all images in this display")
		}
	    };
	    items.windows = {
		name: "window ...",
		items: {
		    windowstitle: {
			name: "create a new:",
			disabled: true
		    }
		}
	    };
	    items.windows.items.lite = xname("light window");
	    items.windows.items.xnew = xname("separate window");
	    if( window.electron ){
		items.windows.items.xnew.disabled = true;
	    }
	    if( window.electron ){
		items.electronHelper = xname("connect to JS9 helper");
		if(  JS9.helper.connected ){
		    items.electronHelper.disabled = true;
		}
	    }
	    // super menu
	    if( this.issuper ){
		arr = JS9.Menubar.getDisplays.call(this, "all");
		items.supermenu = {
		    name: "supermenu ...",
		    items: {
			supertitle: {
			    name: "target this display:",
			    disabled: true
			}
		    }
		};
		for(i=0, m=0; i<arr.length; i++){
		    cdisp = arr[i];
		    name = cdisp.id;
		    items.supermenu.items[`super_${name}`] = xname(name);
		    if( this.selectedDisplay === cdisp ){
			items.supermenu.items[`super_${name}`].icon = JS9.globalOpts.menuSelected;
			m++;
		    }
		}
		name = "all displays";
		items.supermenu.items.super_all = xname(name);
		if( !m ){
		    items.supermenu.items.super_all.icon = JS9.globalOpts.menuSelected;
		}
	    }
	    cel = tdisp.divjq.closest(".JS9GridContainer");
	    if( !tim                                                      ||
		tdisp.winid                                               ||
		(cel.length > 0  && cel.find(".JS9GridItem").length > 1)  ){
		items.removedisplay = xname("remove this display");
	    }
	    items[`sep${n++}`] = "------";
	    items.print = xname("print ...");
	    if( !tim ){
		items.print.disabled = true;
	    }
	    if( window.electron ){
		items.windowPrint = xname("print window ...");
		items.windowPDF = xname("save window to pdf");
		if( window.electron.app ){
		    items.saveScript = xname("export messaging script");
		}
	    }
	    // plugins
	    for(i=0; i<JS9.plugins.length; i++){
		plugin = JS9.plugins[i];
		pname = plugin.name;
		if( plugin.opts.menuItem && (plugin.opts.menu === "file") ){
		    pinst = tdisp.pluginInstances[pname];
		    if( !pinst || pinst.winHandle ){
			if( plugin.xclass !== lastxclass ){
			    items["sep" + n] = "------";
			    n = n + 1;
			}
			lastxclass = plugin.xclass;
			items[pname] = xname(plugin.opts.menuItem);
			if( pinst && (pinst.status === "active") ){
			    items[pname].icon = JS9.globalOpts.menuSelected;
			}
		    }
		}
	    }
	    return {
		// eslint-disable-next-line no-unused-vars
                callback: (key, opt) => {
		    let uplugin;
		    JS9.Menubar.getDisplays.call(this, "any", key)
			.forEach((val) => {
			let j, s, t, kid, unew, uim;
			const udisp = val;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			if( udisp ){
			    uim = udisp.image;
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
			case "cutout":
			    if( uim && uim.raw.hdu && uim.raw.hdu.fits ){
				uim.displaySection("selected");
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
			case "removedisplay":
			    if( udisp ){
				// remove this display
				JS9.RemoveDisplay(udisp.id);
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
					{title: `FITS Header: ${uim.id}`});
				} else {
				    JS9.error(`no FITS header for ${uim.id}`);
				}
			    }
			    break;
			case "hdus":
			    if( uim ){
				if( uim.hdus ){
				    uim.displayAnalysis("text",
						   JS9.hdus2Str(uim.hdus),
						   {title: `FITS HDUs: ${uim.id}`,
						    winformat: "width=800px,height=200px,resize=1,scrolling=1"});
				} else {
				    JS9.error(`no FITS header for ${uim.id}`);
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
			    if( window.electron ){
				try{
				    window.electron.sendMsg("startHelper");
				}
				catch(e){ /* empty */ }
			    }
			    break;
			case "pageid":
			    s = `<center><p>pageid: ${JS9.helper.pageid||"none"}</center>`;
			    t = "JS9 page id";
			    // add display to title
			    t += sprintf(JS9.IDFMT, udisp.id);
			    JS9.lightWin(`fileid${JS9.uniqueID()}`,
					 "inline", s, t,
					 JS9.lightOpts[JS9.LIGHTWIN].lineWin);
			    break;
			case "openboth":
			    if( udisp ){
				udisp.displayLoadForm();
			    }
			    break;
			case "openlocal":
			    if( udisp ){
				JS9.OpenFileMenu({display: udisp});
			    }
			    break;
			case "openremote":
			    if( udisp ){
				udisp.displayLoadForm({remote: true});
			    }
			    break;
			case "savefits":
			case "savefitsvirtual":
			case "savefitsentire":
			    if( uim ){
				s = uim.id.replace(/\.png/i, ".fits")
				          .replace(/\[.*\]/,"")
				          .replace(/\.gz$/i, "")
				          .replace(/\.bz2$/i, "")
				          .replace(/\s+/g, "_");
				if( key === "savefits" ){
				    uim.saveFITS(s, "display");
				} else if( key === "savefitsvirtual" ){
				    if( uim.raw.hdu &&
					uim.raw.hdu.fits &&
					uim.raw.hdu.fits.vfile ){
					s = uim.raw.hdu.fits.vfile
					    .replace(/^bz::/, "")
					    .replace(/^gz::/, "");
					uim.saveFITS(s, "virtual");
				    } else {
					JS9.error("no memory file available");
				    }
				} else {
				    uim.saveFITS(s);
				}
			    }
			    break;
			case "savepng":
			    if( uim ){
				s = uim.id.replace(/\.fit[s]?/i, ".png")
				          .replace(/\[.*\]/,"")
				          .replace(/\.gz$/i, "")
				          .replace(/\.bz2$/i, "")
				          .replace(/\s+/g, "_");
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
			    if( window.electron ){
				JS9.WindowPrint();
			    }
			    break;
			case "windowPDF":
			    if( window.electron ){
				JS9.WindowToPDF();
			    }
			    break;
			case "saveScript":
			    if( window.electron && window.electron.app ){
				JS9.SaveScript();
			    }
			    break;
			case "separate":
			    if( udisp ){
				udisp.separate();
			    }
			    break;
			case "gather":
			    if( udisp ){
				if( (this.id.search(JS9.SUPERMENU) >= 0) &&
				    !this.selectedDisplay 		 ){
				    JS9.error("gather requires a selected display");
				}
				udisp.gather();
			    }
			    break;
			default:
			    // maybe its a supermenu request
			    if( key.match(/^super_/) ){
				unew = key.replace(/^super_/,"");
				JS9.Menubar.onclick.call(this, unew);
				return;
			    }
			    // maybe it's a moveto request
			    if( key.match(/^moveto_/) ){
				unew = key.replace(/^moveto_/,"");
				if( unew === "newdisp" ){
				    // separate the current image
				    udisp.separate({images:[uim],
						    firstinplace:false});
				} else {
				    // move current image to specified display
				    uim.moveToDisplay(unew);
				}
				return;
			    }
			    // maybe it's a plugin
			    for(j=0; j<JS9.plugins.length; j++){
				uplugin = JS9.plugins[j];
				if( uplugin.name === key ){
				    udisp.displayPlugin(uplugin);
				    return;
				}
			    }
			    // maybe its an image
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
    // Edit menu: make button open the contextMenu
    $(`#editMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#editMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#editMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let n=0;
	    const items = {};
	    // plugins
	    items.edittitle1 = {
		name: "Regions:",
		disabled: true
	    };
	    items.configReg = xname("edit");
	    items.copyReg = xname("copy");
	    items.pastePos = xname("paste to current pos");
	    items.pasteReg = xname("paste to original pos");
	    items.undoRemove = xname("undo remove");
	    // deepscan-disable-next-line UNUSED_VAR_ASSIGN
	    items[`sep${n++}`] = "------";
	    items.edittitle2 = {
		name: "Position/Value:",
		disabled: true
	    };
	    items.copyWCSPos = xname("copy wcs pos");
	    items.copyValPos = xname("copy value/pos");
	    return {
		callback: (key) => {
		    JS9.Menubar.getDisplays.call(this).forEach((val) => {
		        let s, ulayer, uao;
			const udisp = val;
			const uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			switch(key){
			case "configReg":
			    if( uim ){
				ulayer = uim.layers.regions;
				if( ulayer ){
				    uao = ulayer.canvas.getActiveObject();
				    if( uao && uao.type !== "activeSelection" ){
					// no active selection, edit this region
					uim.displayRegionsForm(uao);
				    } else {
					// active selection or no regions: multi
					uim.displayRegionsForm(null,
							       {multi: true});
				    }
				}
			    }
			    break;
			case "copyReg":
			    if( uim ){
				s = uim.listRegions(null, {mode: 1});
				JS9.CopyToClipboard(s);
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
			case "undoRemove":
			    if( uim ){
				uim.unremoveRegions();
			    }
			    break;
			case "copyWCSPos":
			    if( {}.hasOwnProperty.call(JS9, "Keyboard") ){
				JS9.Keyboard.Actions["copy wcs position to clipboard"](uim, uim.ipos);
			    }
			    break;
			case "copyValPos":
			    if( {}.hasOwnProperty.call(JS9, "Keyboard") ){
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
    // ViewMac menu: make button open the contextMenu
    $(`#viewMacMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#viewMacMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#viewMacMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let i, menu;
	    const items = {};
	    items.edittitle1 = {
		name: "View:",
		disabled: true
	    };
	    for(i=0; i<this.macmenus.length; i++){
		menu = this.macmenus[i];
		items[menu.name] = {
		    name: `${menu.title  } ...`
		};
	    }
	    return {
		callback: (key) => {
		    switch(key){
		    default:
			$(`#${key}Menu${this.id}`).contextMenu();
			break;
		    }
		},
		items: items
	    };
	}
    });
    // View menu: make button open the contextMenu
    $(`#viewMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#viewMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#viewMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let i, key;
	    let plugin, pname, pinst;
	    let lastxclass="";
	    let n = 0;
	    const items = {};
	    const tdisp = JS9.Menubar.getDisplays.call(this)[0];
	    const tim = tdisp.image;
	    const editValposColor = (disp, obj) => {
		delete tdisp.tmp.editingMenu;
		if( obj.valposcolor ){
		    JS9.textColorOpts.info = obj.valposcolor;
		    if( disp && disp.image ){
			disp.image.updateValpos(disp.image.ipos, true);
		    }
		}
	    }
	    const keyValposColor = (e) => {
		JS9.Menubar.getDisplays.call(this).forEach((val) => {
		    const obj = $.contextMenu.getInputValues(e.data);
		    const keycode = e.which || e.keyCode;
		    const vdisp = val;
		    // make sure display is still valid
		    if( $.inArray(vdisp, JS9.displays) < 0 ){
			return;
		    }
		    switch( keycode ){
		    case 9:
		    case 13:
			editValposColor(vdisp, obj);
			break;
		    default:
			vdisp.tmp.editingMenu = true;
			break;
		    }
		});
	    };
	    const editResize = (disp, obj) => {
		let v1, v2, arr;
		delete tdisp.tmp.editingMenu;
		if( obj.resize ){
		    arr = obj.resize.split(/[\s,/]+/);
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
	    const keyResize = (e) => {
		JS9.Menubar.getDisplays.call(this).forEach((val) => {
		    const obj = $.contextMenu.getInputValues(e.data);
		    const keycode = e.which || e.keyCode;
		    const vdisp = val;
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
	    items[`sep${n++}`] = {name: "Plugins:"};
	    items[`sep${n-1}`].disabled = true;
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
			    items[pname].icon = JS9.globalOpts.menuSelected;
			}
		    }
		}
	    }
	    items[`sep${n++}`] = "------";
	    items.vdispstitle = {
		name: "Display Options:",
		disabled: true
	    };
	    items.vdisps = {
		name: "show ...",
		items: {
		    vdispstitle: {
			name: "show options:",
			disabled: true
		    }
		}
	    };
	    items.vdisps.items.valpos = {
		name: "value/position ...",
		items: {
		    valpostitle: {
			name: "value/pos options:",
			disabled: true
		    },
		    valpos: xname("update value/pos"),
		    valposcolor: {
			events: {keyup: keyValposColor},
			name: "value/pos color:",
			type: "text"
		    },
		    valposdisp: xname("also show display coords")
		}
	    };
	    // disable if we don't have info plugin
	    if( !{}.hasOwnProperty.call(JS9, "Info") ){
		items.vdisps.items.valpos.disabled = true;
	    } else if( tdisp.image ){
		if( tdisp.image.params.valpos ){
		    items.vdisps.items.valpos.icon = JS9.globalOpts.menuSelected;
		    items.vdisps.items.valpos.items.valpos.icon = JS9.globalOpts.menuSelected;
		}
		if( JS9.globalOpts.valposDCoords ){
		    items.vdisps.items.valpos.items.valposdisp.icon = JS9.globalOpts.menuSelected;
		}
	    }
	    items.vdisps.items.toggleLayers = xname("active shape layers");
	    if( tim && !tim.toggleLayers ){
		items.vdisps.items.toggleLayers.icon = JS9.globalOpts.menuSelected;
	    }
	    items.vdisps.items.xhair = xname("crosshair for this image");
	    // disable if we don't have info plugin
	    if( !{}.hasOwnProperty.call(JS9, "Crosshair") || !tim ){
		items.vdisps.items.xhair.disabled = true;
	    } else if( tim && tim.params.crosshair ){
		items.vdisps.items.xhair.icon = JS9.globalOpts.menuSelected;
	    }
	    items.vdisps.items.xhairwcs = xname("match wcs crosshairs");
	    // disable if we don't have info plugin
	    if( !{}.hasOwnProperty.call(JS9, "Crosshair") ){
		items.vdisps.items.xhairwcs.disabled = true;
	    } else if( JS9.globalOpts.wcsCrosshair ){
		items.vdisps.items.xhairwcs.icon = JS9.globalOpts.menuSelected;
	    }
	    items.vdisps.items.toolbar = xname("toolbar tooltips");
	    // disable if we don't have toolbar plugin
	    if( !{}.hasOwnProperty.call(JS9, "Toolbar") ){
		items.vdisps.items.toolbar.disabled = true;
	    } else if( JS9.GetToolbar("showTooltips") ){
		items.vdisps.items.toolbar.icon = JS9.globalOpts.menuSelected;
	    }
	    if( !JS9.allinone ){
		items.vdisps.items.logo = xname("js9 logo");
		if( JS9.globalOpts.logoDisplay ){
		    items.vdisps.items.logo.icon = JS9.globalOpts.menuSelected;
		}
	    }
	    items.vdisps.items.inherit = xname("new images inherit current params");
	    if( tdisp.image && tdisp.image.params.inherit ){
		items.vdisps.items.inherit.icon = JS9.globalOpts.menuSelected;
	    }
	    items.vdisps.items.rawlayer = {
		name: "raw data sources ...",
		items: {}
	    };
	    if( tim && tim.raws.length > 1 ){
		items.vdisps.items.rawlayer.items.whichrawtitle = {
		    name: "current raw data:"
		};
		for(i=0; i<tim.raws.length; i++){
		    key = `rawlayer_${tim.raws[i].id}`;
		    items.vdisps.items.rawlayer.items[key] = {
			name: tim.raws[i].id
		    };
		    if( tim.raw === tim.raws[i] ){
			items.vdisps.items.rawlayer.items[key].icon = JS9.globalOpts.menuSelected;
		    }
		}
		items.vdisps.items.rawlayer.items[`sep${n++}`] = "------";
		items.vdisps.items.rawlayer.items.rawlayer_remove = xname("remove");
	    } else {
		items.vdisps.items.rawlayer.disabled = true;
	    }
	    items.resizes = {
		name: "resize ...",
		items: {
		    resizestitle: {
			name: "resize the display:",
			disabled: true
		    }
		}
	    };
	    items.resizes.items.resize = {
		events: {keyup: keyResize},
		name: "change width/height:",
		type: "text"
	    };
	    items.resizes.items.imagesize = xname("set to image size");
	    items.resizes.items.fullsize = xname("set size to full window");
	    items.resizes.items.resetsize = xname("reset to original size");
	    if( !JS9.globalOpts.resize ){
		items.resizes.items.resize.disabled = true;
		items.resizes.items.fullsize.disabled = true;
		items.resizes.items.imagesize.disabled = true;
		items.resizes.items.resetsize.disabled = true;
	    } else if( !tim ){
		items.resizes.items.imagesize.disabled = true;
	    }
	    return {
		callback: (key) => {
		    JS9.Menubar.getDisplays.call(this).forEach((val) => {
		        let ii, uplugin, s;
			const udisp = val;
			const uim = udisp.image;
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
			case "valposdisp":
			    JS9.globalOpts.valposDCoords =
				!JS9.globalOpts.valposDCoords;
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
			case "logo":
			    JS9.globalOpts.logoDisplay =
				!JS9.globalOpts.logoDisplay;
			    s = JS9.globalOpts.logoDisplay ? "block" : "none";
			    for(ii=0; ii<JS9.displays.length; ii++){
				JS9.displays[ii].iconjq.css("display", s);
			    }
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
				    if( tim.raw.id !== JS9.RAWID0 ){
					for(i=0; i<tim.raws.length; i++){
					    if( tim.raw === tim.raws[i] ){
						tim.rawDataLayer(tim.raw.id,
								 "remove");
					    }
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
		    show: (opt) => {
			const udisp = this.display;
			const obj = {};
			if( udisp  ){
			    obj.resize = sprintf("%d %d",
						 udisp.width, udisp.height);
			    obj.valposcolor = JS9.textColorOpts.info;
			    $.contextMenu.setInputValues(opt, obj);
			    JS9.jupyterFocus(".context-menu-item");
			}
		    },
		    hide: (opt) => {
			let obj;
			const udisp = this.display;
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
    // Zoom menu: make button open the contextMenu
    $(`#zoomMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#zoomMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#zoomMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let i, zoom, zoomp, name, name2, nim, s1;
	    let plugin, pname, pinst;
	    let lastxclass="";
	    let n = 0;
	    const tdisp = JS9.Menubar.getDisplays.call(this)[0];
	    const tim = tdisp.image;
	    const editZoom = (im, obj) => {
		delete tdisp.tmp.editingMenu;
		// allow numbers or strings
		if( !Number.isNaN(obj.zoom) ){
		    im.setZoom(obj.zoom);
		}
	    };
	    const editRotate = (im, obj) => {
		delete tdisp.tmp.editingMenu2;
		// allow numbers or strings
		if( !Number.isNaN(obj.rotate) ){
		    im.setRotate(obj.rotate);
		}
	    };
	    const keyZoom = (e) => {
		JS9.Menubar.getDisplays.call(this).forEach((val) => {
		    const obj = $.contextMenu.getInputValues(e.data);
		    const keycode = e.which || e.keyCode;
		    const vdisp = val;
		    const vim = vdisp.image;
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
	    const keyRotate = (e) => {
		JS9.Menubar.getDisplays.call(this).forEach((val) => {
		    const obj = $.contextMenu.getInputValues(e.data);
		    const keycode = e.which || e.keyCode;
		    const vdisp = val;
		    const vim = vdisp.image;
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
			vdisp.tmp.editingMenu2 = true;
			break;
		    }
		});
	    };
	    const items = {};
	    items.zoomtitle = {
		name: "Zoom Factors:",
		disabled: true
	    };
	    for(i=JS9.imageOpts.topZooms; i>=1; i--){
		zoom = Math.pow(2,-i);
		zoomp = Math.pow(2,i);
		name = `zoom${zoom}`;
		name2 = `zoom 1/${zoomp}`;
		items[name] = xname(name2);
		if( tim && (tim.rgb.sect.zoom === zoom) ){
		    items[name].icon = JS9.globalOpts.menuSelected;
		}
	    }
	    for(i=0; i<=JS9.imageOpts.topZooms; i++){
		zoom = Math.pow(2,i);
		name = `zoom${zoom}`;
		name2 = `zoom ${zoom}`;
		items[name] = xname(name2);
		if( tim && (tim.rgb.sect.zoom === zoom) ){
		    items[name].icon = JS9.globalOpts.menuSelected;
		}
	    }
	    items.morezooms = {
		name: "more zooms ...",
		items: {
		    morezoomstitle: {
			name: "Zoom Factors:",
			disabled: true
		    }
		}
	    };
	    for(i=JS9.imageOpts.zooms; i>JS9.imageOpts.topZooms; i--){
		zoom = Math.pow(2,-i);
		zoomp = Math.pow(2,i);
		name = `zoom${zoom}`;
		name2 = `zoom 1/${zoomp}`;
		items.morezooms.items[name] = xname(name2);
		if( tim && (tim.rgb.sect.zoom === zoom) ){
		    items.morezooms.items[name].icon = JS9.globalOpts.menuSelected;
		}
	    }
	    for(i=JS9.imageOpts.topZooms+1; i<=JS9.imageOpts.zooms; i++){
		zoom = Math.pow(2,i);
		name = `zoom${zoom}`;
		name2 = `zoom ${zoom}`;
		items.morezooms.items[name] = xname(name2);
		if( tim && (tim.rgb.sect.zoom === zoom) ){
		    items.morezooms.items[name].icon = JS9.globalOpts.menuSelected;
		}
	    }
	    items.zoom = {
		events: {keyup: keyZoom},
		name: "numeric zoom:",
		type: "text"
	    };
	    items[`sep${n++}`] = "------";
	    items.zoomiotitle = {
		name: "Zoom In/Out:",
		disabled: true
	    };
	    items.zoomIn = xname("zoom in");
	    items.zoomOut = xname("zoom out");
	    items.zoomToFit = xname("zoom to fit");
	    items[`sep${n++}`] = "------";
	    items.panzoomtitle = {
		name: "Pand and Zoom:",
		disabled: true
	    };
	    items.center = xname("pan to center");
	    items.alignpanzoom = {
		name: "align pan/zoom ...",
		items: {
		    alignpanzoomtitle: {
			name: "to this image:",
			disabled: true
		    }
		}
	    };
	    for(i=0, nim=0; i<JS9.images.length; i++){
		if( JS9.images[i].raw.wcs ){
		    if( (tim === JS9.images[i]) &&
			(this.id.search(JS9.SUPERMENU) < 0) ){
			continue;
		    }
		    s1 = `alignpanzoom_${JS9.images[i].id}`;
		    items.alignpanzoom.items[s1] = {
			name: JS9.images[i].id
		    };
		    nim++;
		}
	    }
	    if( nim === 0 ){
		items.alignpanzoom.items.notasks = {
		    name: "[none]",
		    disabled: true,
		    events: {keyup() {return;}}
		};
	    } else {
		items.alignpanzoom.disabled = false;
	    }
	    items.reset = xname("reset pan/zoom");
	    items.pantoclick = {
		name: "(pan to mouse: Meta-click)",
		disabled: true,
	    };
	    items[`sep${n++}`] = "------";
	    items.fliptitle = {
		name: "Flip:",
		disabled: true
	    };
	    items.flipX = xname("x axis");
	    if( !tim || !tim.raw || !tim.raw.hdu || !tim.raw.hdu.fits ){
		items.flipX.disabled = true;
	    }
	    items.flipY = xname("y axis");
	    if( !tim || !tim.raw || !tim.raw.hdu || !tim.raw.hdu.fits ){
		items.flipY.disabled = true;
	    }
	    items[`sep${n++}`] = "------";
	    items.rot90title = {
		name: "Rotate:",
		disabled: true
	    };
	    items.rot90_90 = xname("90 left");
	    if( !tim || !tim.raw || !tim.raw.hdu || !tim.raw.hdu.fits ){
		items.rot90_90.disabled = true;
	    }
	    items.rot90_270 = xname("90 right");
	    if( !tim || !tim.raw || !tim.raw.hdu || !tim.raw.hdu.fits ){
		items.rot90_270.disabled = true;
	    }
	    items.rotate = {
		events: {keyup: keyRotate},
		name: "rotation angle:",
		type: "text"
	    };
	    items[`sep${n++}`] = "------";
	    items.northisup = xname("align: north is up");
	    if( !tim || !tim.raw || !tim.raw.hdu || !tim.raw.hdu.fits ||
		!tim.raw.wcs || tim.raw.wcs <= 0){
		items.northisup.disabled = true;
	    }
	    items.resetall = xname("reset flip/rot90/rotate");
	    items[`sep${n++}`] = "------";
	    // plugins
	    for(i=0; i<JS9.plugins.length; i++){
		plugin = JS9.plugins[i];
		pname = plugin.name;
		if( plugin.opts.menuItem && (plugin.opts.menu === "zoom") ){
		    pinst = tdisp.pluginInstances[pname];
		    if( !pinst || pinst.winHandle ){
			if( plugin.xclass !== lastxclass ){
			    // items["sep" + n] = "------";
			    n = n + 1;
			}
			lastxclass = plugin.xclass;
			items[pname] = xname(plugin.opts.menuItem);
			if( pinst && (pinst.status === "active") ){
			    items[pname].icon = JS9.globalOpts.menuSelected;
			}
		    }
		}
	    }
	    return {
		callback: (key) => {
		    let ii, uplugin;
		    JS9.Menubar.getDisplays.call(this).forEach((val) => {
			const udisp = val;
			const uim = udisp.image;
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
			    case "flipX":
				uim.setFlip("x");
				break;
			    case "flipY":
				uim.setFlip("y");
				break;
			    case "rot90_90":
				uim.setRot90(90);
				break;
			    case "rot90_270":
				uim.setRot90(-90);
				break;
			    case "northisup":
				uim.setRot90("reset");
				uim.setRotate("northisup");
				break;
			    case "resetall":
				uim.setFlip("reset");
				uim.setRot90("reset");
				uim.setRotate("reset");
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
				// look for a numeric zoom
				if( key.match(/^zoom/) ){
				    uim.setZoom(key.slice(4));
				} else if( key.match(/^alignpanzoom_/) ){
				    uim.alignPanZoom(key.slice(13));
				}
				break;
			    }
			}
		    });
		},
		events: {
		    show: (opt) => {
			const udisp = this.display;
			const uim = udisp.image;
			const obj = {};
			if( uim  ){
			    obj.zoom =
				JS9.floatToString(uim.rgb.sect.zoom);
			    obj.rotate =
				JS9.floatToString(uim.params.rotate||0);
			}
			$.contextMenu.setInputValues(opt, obj);
			JS9.jupyterFocus(".context-menu-item");
		    },
		    hide: (opt) => {
			let obj;
			const udisp = this.display;
			const uim = udisp.image;
			if( uim ){
			    // if a key was pressed, do the edit
			    if( udisp.tmp.editingMenu ){
				obj = $.contextMenu.getInputValues(opt);
				editZoom(uim, obj);
			    }
			    if( udisp.tmp.editingMenu2 ){
				obj = $.contextMenu.getInputValues(opt);
				editRotate(uim, obj);
			    }
			}
		    }
		},
		items: items
	    };
	}
    });
    // Scale menu: make button open the contextMenu
    $(`#scaleMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#scaleMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#scaleMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let i, s1, s2;
	    let plugin, pname, pinst;
	    let lastxclass="";
	    let n = 0;
	    const items = {};
	    const tdisp = JS9.Menubar.getDisplays.call(this)[0];
	    const editScale = (im, obj) => {
		let dval1 = im.params.scalemin;
		let dval2 = im.params.scalemax;
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
	    const keyScale = (e) => {
		JS9.Menubar.getDisplays.call(this).forEach((val) => {
		    const obj = $.contextMenu.getInputValues(e.data);
		    const keycode = e.which || e.keyCode;
		    const vdisp = val;
		    const vim = vdisp.image;
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
		    items[s1].icon = JS9.globalOpts.menuSelected;
		}
	    }
	    items[`sep${n++}`] = "------";
	    items.dlims = {
		name: "data limits ...",
		items: {
		    title: {
			name: "set data limits to:",
			disabled: true
		    },
		    dataminmax: {
			name: "data min/max"
		    },
		    zscale: {
			name: "zscale z1/z2"
		    },
		    zmax: {
			name: "zscale z1/data max"
		    }
		}
	    };
	    items.scalemin = {
		events: {keyup: keyScale},
		name: "low:",
		type: "text"
	    };
	    items.scalemax = {
		events: {keyup: keyScale},
		name: "high:",
		type: "text"
	    };
	    items[`sep${n++}`] = "------";
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
			    items[pname].icon = JS9.globalOpts.menuSelected;
			}
		    }
		}
	    }
	    return {
                callback: (key) => {
		    let ii, uplugin;
		    JS9.Menubar.getDisplays.call(this).forEach((val) => {
			const udisp = val;
			const uim = udisp.image;
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
		    show: (opt) => {
			const udisp = this.display;
			const uim = udisp.image;
			const obj = {};
			if( uim  ){
			    obj.scalemin =
				JS9.floatToString(uim.params.scalemin);
			    obj.scalemax =
				JS9.floatToString(uim.params.scalemax);
			}
			$.contextMenu.setInputValues(opt, obj);
			JS9.jupyterFocus(".context-menu-item");
		    },
		    hide: (opt) => {
			let obj;
			const udisp = this.display;
			const uim = udisp.image;
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
    // Color menu: make button open the contextMenu
    $(`#colorMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#colorMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#colorMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let i, s1, s2, hstr, img;
	    let plugin, pname, pinst;
	    let lastxclass="";
	    let n = 0;
	    const items = {};
	    const tdisp = JS9.Menubar.getDisplays.call(this)[0];
	    const editColor = (im, obj) => {
		delete tdisp.tmp.editingMenu;
		if( obj.contrast && !Number.isNaN(obj.contrast) ){
		    im.params.contrast = parseFloat(obj.contrast);
		}
		if( obj.bias && !Number.isNaN(obj.bias) ){
		    im.params.bias = parseFloat(obj.bias);
		}
		if( obj.opacity.match(/reset/) || obj.opacity.trim() === "" ){
		    im.setOpacity("reset");
		} else if( !Number.isNaN(obj.opacity) ){
		    im.setOpacity(parseFloat(obj.opacity));
		}
		im.displayImage("colors");
	    };
	    const keyColor = (e) => {
		JS9.Menubar.getDisplays.call(this).forEach((val) => {
		    const obj = $.contextMenu.getInputValues(e.data);
		    const keycode = e.which || e.keyCode;
		    const vdisp = val;
		    const vim = vdisp.image;
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
		if( JS9.globalOpts.menuImages ){
		    img = JS9.Menubar.menuImage(`images/voyager/color_${s2}.png`);
		    hstr = `<div class='JS9MenubarImage' name='${s2}'><img src='${img}' name='color_${s2}' class='JS9MenubarImage JS9MenubarImageOption' onerror='JS9.Menubar.missing["color_${s2}.png"]=true; this.src="${JS9.Menubar.EMPTYIMG}"' >` + `&nbsp;&nbsp;${s2}</div>`;
		    items[s1] = {name: hstr, isHtmlName: true};
		} else {
		    items[s1] = xname(s2);
		}
		if( tdisp.image && (tdisp.image.cmapObj.name === s1) ){
		    items[s1].icon = JS9.globalOpts.menuSelected;
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
		if( !JS9.globalOpts.topColormaps.includes(s1) ){
		    s2 = s1;
		    if( JS9.globalOpts.menuImages ){
			img = JS9.Menubar.menuImage(`images/voyager/color_${s2}.png`);
			hstr = `<div class='JS9MenubarImage' name='${s2}'><img src='${img}' name='color_${s2}' class='JS9MenubarImage JS9MenubarImageOption' onerror='JS9.Menubar.missing["color_${s2}.png"]=true; this.src="${JS9.Menubar.EMPTYIMG}"' >` + `&nbsp;&nbsp;${s2}</div>`;
			items.morecmaps.items[s1] = {name: hstr, isHtmlName: true};
		    } else {
			items.morecmaps.items[s1] = xname(s2);
		    }
		    if( tdisp.image && (tdisp.image.cmapObj.name === s1) ){
			items.morecmaps.items[s1].icon = JS9.globalOpts.menuSelected;
		    }
                }
	    }
	    items[`sep${n++}`] = "------";
	    items.imfilter = xname("image filters ...");
	    items[`sep${n++}`] = "------";
	    items.contrast = {
		events: {keyup: keyColor},
		name: "contrast:",
		type: "text"
	    };
	    items.bias = {
		events: {keyup: keyColor},
		name: "bias:",
		type: "text"
	    };
	    items.reset = xname("reset contrast & bias");
	    items[`sep${n++}`] = "------";
	    items.opacity = {
		events: {keyup: keyColor},
		name: "opacity:",
		type: "text"
	    };
	    items[`sep${n++}`] = "------";
	    items.loadcmap = xname("load ...");
	    items.savecmap = xname("save");
	    items[`sep${n++}`] = "------";
	    items.invert = xname("invert");
	    if( tdisp.image && tdisp.image.params.invert ){
		items.invert.icon = JS9.globalOpts.menuSelected;
	    }
	    items.rgb = xname("rgb mode");
	    if( tdisp.rgb.active ){
		items.rgb.icon = JS9.globalOpts.menuSelected;
	    }
	    if( tdisp.image && tdisp.image.offscreen && !tdisp.image.rgbFile ){
		items.overlay = xname("image overlay");
		if( tdisp.image.params.overlay ){
		    items.overlay.icon = JS9.globalOpts.menuSelected;
		}
	    }
	    items[`sep${n++}`] = "------";
	    // plugins
	    for(i=0; i<JS9.plugins.length; i++){
		plugin = JS9.plugins[i];
		pname = plugin.name;
		if( plugin.opts.menuItem && (plugin.opts.menu === "color") ){
		    pinst = tdisp.pluginInstances[pname];
		    if( !pinst || pinst.winHandle ){
			if( plugin.xclass !== lastxclass ){
			    // items["sep" + n] = "------";
			    n = n + 1;
			}
			lastxclass = plugin.xclass;
			items[pname] = xname(plugin.opts.menuItem);
			if( pinst && (pinst.status === "active") ){
			    items[pname].icon = JS9.globalOpts.menuSelected;
			}
		    }
		}
	    }
	    return {
		callback: (key) => {
		    let ii, uplugin;
		    JS9.Menubar.getDisplays.call(this).forEach((val) => {
			const udisp = val;
			const uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			switch(key){
			case "loadcmap":
			    JS9.OpenColormapMenu({display: udisp});
			    break;
			case "savecmap":
			    JS9.SaveColormap({display: udisp});
			    break;
			case "imfilter":
			    JS9.DisplayPlugin("JS9Filters", {display: udisp});
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
			    // set the colormap
			    if( uim ){
				uim.setColormap(key);
			    }
			}
		    });
		},
		events: {
		    show: (opt) => {
			const udisp = this.display;
			const uim = udisp.image;
			const obj = {};
			if( uim  ){
			    obj.contrast =
				JS9.floatToString(uim.params.contrast);
			    obj.bias =
				JS9.floatToString(uim.params.bias);
			    obj.opacity =
				JS9.floatToString(uim.params.opacity);
			    obj.sigma =
				JS9.floatToString(uim.params.sigma);
			}
			$.contextMenu.setInputValues(opt, obj);
			JS9.jupyterFocus(".context-menu-item");
		    },
		    hide: (opt) => {
			let obj;
			const udisp = this.display;
			const uim = udisp.image;
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
    // Region menu: make button open the contextMenu
    $(`#regionMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#regionMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#regionMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let i, s1, reg, img, key;
	    const tdisp = JS9.Menubar.getDisplays.call(this)[0];
	    const tim = tdisp.image;
	    const items = {};
	    const getregval = (key, val) => {
		switch(key){
		case "color":
		    // lookup color
		    if( val.charAt(0) !== "#" && JS9.colorToHex(val) === val ){
			return null;
		    }
		    break;
		case "strokeWidth":
		    // number
		    if( !JS9.isNumber(val) ){
			return null;
		    }
		    val = parseFloat(val);
		    break;
		case "strokeDashArray":
		    // space or comma-separated list of numbers
		    val = val.split(/[\s,]+/);
		    if( !val || !val.length ){
			return null;
		    }
		    if( val.length < 2 ){
			val[1] = "0";
		    }
		    if( !JS9.isNumber(val[0]) || !JS9.isNumber(val[1])  ){
			return null;
		    }
		    val[0] = parseFloat(val[0]);
		    val[1] = parseFloat(val[1]);
		    break;
		default:
		    // text
		    break;
		}
		return val;
	    };
	    const editRegions = (im, obj, which) => {
		let key, val;
		const opts = {};
		obj = obj || {};
		if( which ){
		    key = which.substring(3);
		    val = obj[which];
		    if( key && val && im.tmp[`editingReg${which}`] ){
			delete im.tmp[`editingReg${which}`];
			val = getregval(key, val);
			if( val ){
			    opts[key] = val;
			    im.changeShapes("regions", "selected", opts);
			}
		    }
		} else {
		    for( which of Object.keys(obj) ){
			key = which.substring(3);
			val = obj[which];
			if( key && val && im.tmp[`editingReg${which}`] ){
			    delete im.tmp[`editingReg${which}`];
			    val = getregval(key, val);
			    if( val ){
				opts[key] = val;
			    }
			}
		    }
		    if( Object.keys(opts).length ){
			im.changeShapes("regions", "selected", opts);
		    }
		}
	    };
	    items.regiontitle = {
		name: "Regions:",
		disabled: true
	    };
	    if( JS9.globalOpts.menuImages ){
		for(i=0; i<JS9.regions.length; i++){
		    reg = JS9.regions[i];
		    img = JS9.Menubar.menuImage(`images/voyager/regions_${reg}.svg`);
		    items[reg] = {name: `<div class='JS9MenubarImage' name='${reg}'><img src='${img}' name='regions_${reg}' class='JS9MenubarImage JS9MenubarImageOption' onerror='JS9.Menubar.missing["regions_${reg}.svg"]=true; this.src="${JS9.Menubar.EMPTYIMG}"' >` + `&nbsp;&nbsp;${reg}</div>`,
				  isHtmlName: true};
		}
	    } else {
		for(i=0; i<JS9.regions.length; i++){
		    reg = JS9.regions[i];
		    items[reg] = xname(reg);
		}
	    }
	    items.sep1 = "------";
	    items.createRegions = xname("menu adds region @ center");
	    if( JS9.globalOpts.regMenuCreate ){
		items.createRegions.icon = JS9.globalOpts.menuSelected;
	    }
	    for( key of Object.keys(JS9.globalOpts.keyboardActions) ){
		if( JS9.globalOpts.keyboardActions[key] ===
		    "add last region selected in regions menu" ){
		    items.notCreateRegions = {
			name: `('${key}' adds region @ mouse)`,
			disabled: true,
		    };
		}
	    }
	    items.sep1a = "------";
	    items.listRegions  = xname("list");
	    items.loadRegions  = xname("load ...");
	    items.saveRegions  = xname("save ...");
	    items.copyto  = {
		name: "copy to ...",
		items: {
		    copytotitle: {
			name: "choose image:",
			disabled: true
		    }
		}
	    };
	    items.removeRegions  = xname("remove");
	    items.sep2 = "------";
	    items.selectRegions = xname("select all");
	    items.unselectRegions = xname("unselect all");
	    items.selectedRegions = xname("selected ...");
	    items.sep3 = "------";
	    items.onchange = {
		name: "onchange ...",
		items: {
		    listonchange: xname("list on change"),
		    xeqonchange: xname("xeq on change")
		}
	    };
	    if( tim && tim.params.listonchange ){
		items.onchange.items.listonchange.icon = JS9.globalOpts.menuSelected;
	    }
	    if( tim && tim.params.xeqonchange ){
		items.onchange.items.xeqonchange.icon = JS9.globalOpts.menuSelected;
	    }
	    if( tim && (JS9.images.length > 1) ){
		for(i=0; i<JS9.images.length; i++){
		    if( tim !== JS9.images[i] ){
			s1 = `copyto_${JS9.images[i].id}`;
			items.copyto.items[s1] = xname(JS9.images[i].id);
		    }
		}
		items.copyto.items.copyto_all = xname("all images");
		items.copyto.disabled = false;
	    } else {
		items.copyto.disabled = true;
	    }
	    // disable if we don't have info plugin
	    if( !{}.hasOwnProperty.call(JS9, "Info") ){
		items.listRegions.disabled = true;
	    }
	    return {
		callback: (key) => {
		    JS9.Menubar.getDisplays.call(this).forEach((val) => {
			let uid, ulayer, uao, uopts;
			const udisp = val;
			const uim = udisp.image;
			// make sure display is still valid
			if( $.inArray(udisp, JS9.displays) < 0 ){
			    return;
			}
			if( uim ){
			    switch(key){
			    case "loadRegions":
				JS9.OpenRegionsMenu({display: udisp});
				break;
			    case "listRegions":
				uim.listRegions(null, {mode: 2});
				break;
			    case "createRegions":
				JS9.globalOpts.regMenuCreate =
				    !JS9.globalOpts.regMenuCreate;
				break;
			    case "removeRegions":
				uim.removeShapes("regions", null);
				udisp.clearMessage("regions");
				break;
			    case "saveRegions":
				ulayer = uim.layers.regions;
				if( ulayer ){
				    uao = ulayer.canvas.getActiveObject();
				    uopts = {type: "save"};
				    if( uao && uao.type !== "activeSelection" ){
					uim.displayRegionsForm(uao, uopts);
				    } else {
					uim.displayRegionsForm(null, uopts);
				    }
				}
				break;
			    case "selectRegions":
				if( {}.hasOwnProperty.call(JS9, "Keyboard") ){
				    JS9.Keyboard.Actions["select all regions"](uim, uim.ipos);
				}
				break;
			    case "unselectRegions":
				if( {}.hasOwnProperty.call(JS9, "Keyboard") ){
				    JS9.Keyboard.Actions["unselect all regions"](uim, uim.ipos);
				}
				break;
			    case "selectedRegions":
				ulayer = uim.layers.regions;
				if( ulayer ){
				    uao = ulayer.canvas.getActiveObject();
				    if( uao && uao.type !== "activeSelection" ){
					// no active selection, edit this region
					uim.displayRegionsForm(uao);
				    } else {
					// active selection or no regions: multi
					uim.displayRegionsForm(null,
							       {multi: true});
				    }
				}
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
				// otherwise it's new region
				JS9.globalOpts.regMenuSelected = key;
				if( JS9.globalOpts.regMenuCreate ){
				    uim.addShapes("regions", key, {ireg: true});
				}
				break;
			    }
			}
		    });
		},
		events: {
		    show: (opt) => {
			const obj = {color: ""};
			$.contextMenu.setInputValues(opt, obj);
			JS9.jupyterFocus(".context-menu-item");
		    },
		    hide: (opt) => {
			let obj;
			const udisp = this.display;
			const uim = udisp.image;
			if( uim ){
			    // if a key was pressed, do the edit
			    obj = $.contextMenu.getInputValues(opt);
			    editRegions(uim, obj);
			}
		    }
		},
		items: items
	    };
	}
    });
    // WCS menu: make button open the contextMenu
    $(`#wcsMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#wcsMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#wcsMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let i, s1, s2, key, altwcs, sys, units;
	    let n=0, nwcs=0, got=0;
	    const items = {};
	    const tdisp = JS9.Menubar.getDisplays.call(this)[0];
	    const tim = tdisp.image;
	    const editRotate = (im, obj) => {
		delete tdisp.tmp.editingMenu;
		if( JS9.isNumber(obj.rot) ){
		    im.rotateData(parseFloat(obj.rot));
		}
	    };
	    const keyRotate = (e) => {
		JS9.Menubar.getDisplays.call(this).forEach((val) => {
		    const obj = $.contextMenu.getInputValues(e.data);
		    const keycode = e.which || e.keyCode;
		    const vdisp = val;
		    const vim = vdisp.image;
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
	    if( !tim || (tim && tim.validWCS()) ){
		sys = JS9.wcssyss;
	    } else {
		sys = ["image", "physical"];
	    }
	    for(i=0; i<sys.length; i++){
		s1 = sys[i];
		s2 = s1;
		items[s1] = xname(s2);
		if( tim && (tim.params.wcssys === s1) ){
		    items[s1].icon = JS9.globalOpts.menuSelected;
		    got++;
		}
	    }
	    // if we don't know which wcssys is current, assume native or image
	    if( !got ){
		if( !tim || (tim && tim.validWCS()) ){
		    s1 = "native";
		} else {
		    s1 = "image";
		}
		items[s1].icon = JS9.globalOpts.menuSelected;
	    }
	    items[`sep${n++}`] = "------";
	    items.wcsutitle = {
		name: "WCS Units:",
		disabled: true
	    };
	    if( !tim || (tim && tim.validWCS()) ){
		units = JS9.wcsunitss;
	    } else {
		units = ["pixels"];
	    }
	    for(i=0; i<units.length; i++){
		s1 = units[i];
		s2 = s1;
		items[s1] = xname(s2);
		if( tim && (tim.params.wcsunits === s1) ){
		    items[s1].icon = JS9.globalOpts.menuSelected;
		}
	    }
	    items[`sep${n++}`] = "------";
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
		for( key of Object.keys(altwcs) ){
		    s1 = `altwcs_${key}`;
		    if( altwcs[key].header.WCSNAME ){
			s2 = `${altwcs[key].header.WCSNAME}    (${key})`;
		    } else {
			s2 = key;
		    }
		    items.altwcs.items[s1] = xname(s2);
		    if( tim.raw.wcs === altwcs[key].wcs ){
			items.altwcs.items[s1].icon = JS9.globalOpts.menuSelected;
		    }
		    nwcs++;
		}
		// disable if we only have the default wcs
		if( nwcs < 2 ){
		    items.altwcs.disabled = true;
		    items.altwcs.items.notasks = {
			name: "[none]",
			disabled: true,
			events: {keyup() {return;}}
		    };
		}
	    }
	    items[`sep${n++}`] = "------";
	    items.reproject = {
		name: "wcs reproject ...",
		items: {
		    reprojtitle: {
			name: "this image, using the wcs from:",
			disabled: true
		    }
		}

	    };
	    for(i=0, nwcs=0; i<JS9.images.length; i++){
		if( JS9.images[i].raw.wcs ){
		    if( (tim === JS9.images[i]) &&
			(this.id.search(JS9.SUPERMENU) < 0) ){
			continue;
		    }
		    s1 = `reproject_${JS9.images[i].id}`;
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
		    events: {keyup() {return;}}
		};
	    } else {
		items.reproject.disabled = false;
		items.reproject.items[`sep${n++}`] = "------";
		items.reproject.items.reproject_all = {
		    name: "all images in this display, using this wcs"
		};
		items.reproject.items[`sep${n++}`] = "------";
		items.reproject.items.reproject_wcsalign = {
		    name: "display wcs-aligned"
		};
		if( tim && (tim.params.wcsalign) ){
		    items.reproject.items.reproject_wcsalign.icon = JS9.globalOpts.menuSelected;
		}
	    }
	    items.reproject.items[`sep${n++}`] = "------";
	    items.reproject.items.rotatetitle = {
		name: "by rotating this image:",
		disabled: true
	    };
	    items.reproject.items.reproject_northup = {
		name: "so north is up"
	    };
	    items.reproject.items.rot = {
		events: {keyup: keyRotate},
		name: "by this angle in deg:",
		type: "text"
	    };
	    if( !tim || !tim.raw || !tim.raw.header || !tim.raw.wcsinfo ){
		items.reproject.disabled = true;
	    }
	    items.reproject.items[`sep${n++}`] = "------";
	    items.reproject.items.reproject_revert = {
		name: "revert"
	    };
	    return {
                callback: (key) => {
		    JS9.Menubar.getDisplays.call(this).forEach((val) => {
			let file, s;
			const rexp = new RegExp(key);
			const udisp = val;
			const uim = udisp.image;
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
				} else if( key === "reproject_revert" ){
				    if( uim.raw.id !== JS9.RAWID0 ){
					for(i=0; i<uim.raws.length; i++){
					    if( uim.raw === uim.raws[i] ){
						uim.rawDataLayer(uim.raw.id,
								 "remove");
					    }
					}
				    }
				} else if( key === "reproject_all" ){
				    uim.reprojectData("all");
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
				JS9.error(`unknown wcs sys/units: ${key}`);
			    }
			}
		    });
		},
		events: {
		    show: (opt) => {
			const udisp = this.display;
			const uim = udisp.image;
			const obj = {};
			if( uim ){
			    obj.rot = "";
			    $.contextMenu.setInputValues(opt, obj);
			    JS9.jupyterFocus(".context-menu-item");
			}
		    },
		    hide: (opt) => {
			let obj;
			const udisp = this.display;
			const uim = udisp.image;
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
    // Analysis menu: make button open the contextMenu
    $(`#analysisMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#analysisMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#analysisMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let i, j, s, apackages, atasks;
	    let plugin, pinst, pname;
	    let lastxclass="";
	    let n = 0;
	    let ntask = 0;
	    const items = {};
	    const tdisp = JS9.Menubar.getDisplays.call(this)[0];
	    const im = tdisp.image;
	    const editAnalysis = (im, obj) => {
		delete tdisp.tmp.editingMenu;
		obj.sigma = obj.sigma || "0";
		if( obj.sigma === "none" ){
		    obj.sigma = "0";
		}
		try{ im.params.sigma = parseFloat(obj.sigma); }
		catch(e){ im.params.sigma = 0; }
		im.gaussBlurData(im.params.sigma);
	    };
	    const keyAnalysis = (e) => {
		JS9.Menubar.getDisplays.call(this).forEach((val) => {
		    const obj = $.contextMenu.getInputValues(e.data);
		    const keycode = e.which || e.keyCode;
		    const vdisp = val;
		    const vim = vdisp.image;
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
				items[`sep${n++}`] = "------";
			    }
			    items[`sep${n++}`] =
				{name: `${plugin.xclass} Plugins:`};
			    items[`sep${n-1}`].disabled = true;
			}
			lastxclass = plugin.xclass;
			items[pname] = {
			    name: plugin.opts.menuItem
			};
			if( pinst && (pinst.status === "active") ){
			    items[pname].icon = JS9.globalOpts.menuSelected;
			}
			n++;
		    }
		}
	    }
	    // no server side analysis for all-in-one configuration
	    if( !JS9.allinone ){
		if( n > 0 ){
		    items[`sep${n++}`] = "------";
		}
	        items.localtitle = {
		    name: "Client-side Analysis:",
		    disabled: true
	        };
		items.grid = xname("Coordinate Grid");
		if( !im || !im.raw.wcs || im.raw.wcs <=0 ){
		    items.grid.disabled = true;
		} else {
		    if( im.displayCoordGrid() ){ items.grid.icon = JS9.globalOpts.menuSelected; }
		}
		items.regcnts = xname("Counts in Regions");
		items.radprof = xname("Radial Profile");
		if( !JS9.globalOpts.internalRegcnts ||
		    !im || !im.raw || !im.raw.hdu || !im.raw.hdu.vfile ){
		    items.regcnts.disabled = true;
		    items.radprof.disabled = true;
		}
		if( im && im.raw && im.raw.header.NAXIS === 3 ){
		    items.cnts3d = xname("3D Counts in Regions");
		    items.plot3d = xname("3D Plot using Regions");
		    if( !JS9.globalOpts.internalRegcnts ||
			!im.raw.hdu || !im.raw.hdu.vfile ){
			items.cnts3d.disabled = true;
			items.plot3d.disabled = true;
		    }
		}
		items.sigma = {
		    events: {keyup: keyAnalysis},
		    name: "Blur, equivalent sigma:",
		    type: "text"
		};
		items[`sep${n++}`] = "------";
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
			    if( !im.validateAnalysis(atasks[i]) ){
				continue;
			    }
			    // separator
			    if( atasks[i].rtype &&
				atasks[i].rtype.match(/^---/) ){
				items[`sep${n++}`] = "------";
				items[atasks[i].name] = {
				    name: `${atasks[i].title}:`,
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
			events: {keyup() {return;}}
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
		items[`sep${n++}`] = "------";
		items.sconfig = {
		    name: "server-side params ...",
		    items: {
		    }
		};
		items.sconfig.items.dpath = xname("set data analysis path ...");
		if( JS9.globalOpts.dataPathModify === false ){
		    items.sconfig.items.dpath.disabled = true;
		}
		items.sconfig.items.fpath = xname("set this image file's path ...");
		if( !im ||
		    (document.domain && document.domain !== "localhost") ){
		    items.sconfig.items.fpath.disabled = true;
		}
	    }
	    return {
                callback: (key) => {
		    JS9.Menubar.getDisplays.call(this).forEach((val) => {
			let a, s, did, ii, tplugin;
			const udisp = val;
			const uim = udisp.image;
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
			    case "cnts3d":
				s = JS9.globalOpts.plot3d.cube;
				JS9.CountsInRegions("$sregions", "$bregions",
						    {lightwin: true,
						    cmdswitches: `-c ${s}`},
						    {display: udisp.id});
				break;
			    case "plot3d":
				JS9.Plot3D("$sregions", "$bregions", null,
					   {display: udisp.id});
				break;
			    case "dpath":
				// call this once window is loaded
			        $(JS9.lightOpts[JS9.LIGHTWIN].topid)
				    .arrive("#dataPathForm",
					    {onceOnly: true}, () => {
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
			        $(JS9.lightOpts[JS9.LIGHTWIN].topid)
				    .arrive("#filePathForm",
					    {onceOnly: true}, () => {
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
								  {title: `${a.title}: ${uim.fitsFile}`,
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
		    show:(opt) => {
			const udisp = this.display;
			const uim = udisp.image;
			const obj = {};
			if( uim  ){
			    obj.sigma = JS9.floatToString(uim.params.sigma);
			}
			$.contextMenu.setInputValues(opt, obj);
			JS9.jupyterFocus(".context-menu-item");
		    },
		    hide: (opt) => {
			let obj;
			const udisp = this.display;
			const uim = udisp.image;
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
    // Help menu: make button open the contextMenu
    $(`#helpMenu${this.id}`).on("mousedown", (evt) => {
        evt.preventDefault();
        $(`#helpMenu${this.id}`).contextMenu();
    });
    // define contextMenu actions
    $.contextMenu({
        selector: `#helpMenu${this.id}`,
	zIndex: JS9.MENUZINDEX,
	events: { hide: onhide },
	position: mypos,
        build: () => {
	    let t, key, val;
	    let n = 1;
	    let last = "";
	    const items = {};
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
	    for( key of Object.keys(JS9.helpOpts) ){
		val = JS9.helpOpts[key];
		if( val.heading === "JS9Help" ){
		    last = val.type;
		    items.js9help.items[key] = {
			name: val.title
		    };
		}
	    }
	    items[`sep${n++}`] = "------";
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
	    for( key of Object.keys(JS9.helpOpts) ){
		val = JS9.helpOpts[key];
		if( val.heading === "JS9" ){
		    last = val.type;
		    items.pluginhelp.items[key] = {
			name: val.title.replace(/ \.\.\./, "")
		    };
		}
	    }
	    // last, the others
	    for( key of Object.keys(JS9.helpOpts) ){
		val = JS9.helpOpts[key];
		if( val.heading === "JS9Help" || val.heading === "JS9" ){
		    continue;
		}
		if( (last !== "") && (val.type !== last) ){
		    items[`sep${n++}`] = "------";
		    if( val.heading ){
			t = `${val.heading  } plugins`;
			items[`sep${n++}`] = {
			    name: `${t} ...`,
			    items: {
				title: {
				    name: `${t}:`,
				    disabled: true
				}
			    }
			};
		    }
		}
		last = val.type;
		items[`sep${n-1}`].items[key] = {name: val.title};
	    }
	    items[`sep${n++}`] = "------";
	    items.about = xname("About");
	    return {
		callback: (key) => {
		    switch(key){
		    case "about":
			alert(JS9.ABOUT);
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
    let i, j, m, ss, tt, menu, html;
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
			    html += `<button type='button' id='${ss}Menu@@ID@@' class='${this.buttonClass}' disabled='disabled'>${tt} </button>`;
			}
		    }
		} else {
		    if( this.style === "classic" ){
			html += `<button type='button' id='${ss}Menu@@ID@@' class='${this.buttonClass}'>${tt}</button>`;
		    } else {
			switch(ss){
			case "file":
			case "edit":
			    html += `<button type='button' id='${ss}Menu@@ID@@' class='${this.buttonClass}'>${tt}</button>`;
			    break;
			case "help":
			    html += `<span style='float:right'><button type='button' id='${ss}Menu@@ID@@' class='${this.buttonClass}'>${tt}</button></span>`;
			    break;
			default:
			    if( !this.macmenus ){
				html += `${"<span style='position:relative;'><button type='button' id='"+"viewMacMenu@@ID@@' class='"}${this.buttonClass}'>`+`View`+`</button>`;
				this.macmenus = [];
			    }
			    if( tt === "View" ){
				tt = "Plugins";
			    }
			    html += `<button type='button' id='${ss}Menu@@ID@@' class='${this.buttonClass}' style='position:absolute;top:0px;left:0px;visibility:hidden;zindex:-1'>`+``+`</button>`;
			    this.macmenus.push({name: ss, title: tt});
			    break;
			}
		    }
		}
		break;
	    }
	}
    }
    // close mac-style span on View menu
    if( this.macmenus ){
	html += "</span>";
    }
    // user-defined menus
    if( this.usermenus && JS9.globalOpts.userMenuBar ){
	html += JS9.globalOpts.userMenuDivider || "";
	for(j=0; j<JS9.globalOpts.userMenuBar.length; j++){
	    menu = JS9.globalOpts.userMenuBar[j];
	    if( !menu || !menu.name || !menu.title || !menu.options  ){
		continue;
	    }
	    if( menu.imageTitle ){
		m = `<div class='JS9MenubarUserImage'><img src='${menu.imageTitle  }' name='${menu.name}' alt='${menu.title}' class='JS9MenubarUserImage JS9MenubarUserImageTitle' >` + `</div>`;
	    } else {
		m = menu.title;
	    }
	    html += `<button type='button' id='${menu.name}UserMenu@@ID@@' class='${this.buttonClass}'>${m}</button>`;
	}
    }
    // hidden menus
    html += "<button type='button' id='hiddenRegionMenu@@ID@@'class='JS9Button' style='display:none'>R</button>";
    html += "<button type='button' id='hiddenAnchorMenu@@ID@@'class='JS9Button' style='display:none'>R</button>";
    html += "</span>";
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
		    dynamicSelect: true,
		    winDims: [JS9.Menubar.WIDTH, JS9.Menubar.HEIGHT]});

