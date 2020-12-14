/*
 * js9usermenus.js -- an example of how to define user menus in JS9.
 *
 * An array of four user menus objects (zooms, scales, colormaps, and regions)
 * that gets assigned to the JS9.globalOpts.userMenuBar property.
 *
 * Each user menu must have the following properties:
 * "name", "title" (menu title), "options" (array of option, see below).
 * Optional: "updateTitle" to update the menu title as it is changed:
 * "text" sets name, "image" sets image, "both" sets both.
 *
 * Each option should have a name, a public API command, and an array of
 * arguments to pass to that command.
 * Optional: image path of an image to display as a menu option.
 *
 * Note that, while these examples are subsets of top-level menus, a user menu
 * can contain any set of public API calls, e.g. a menu of most-used commands.
 *
 * Once you have created a file containing a JS9.globalOpts.userMenubar array,
 * you need to load it explicitly into your web page:
 *
 * <script type="text/javascript" src="js9usermenus.js"></script>
 *
 * and then either:
 *
 * set JS9.globalOpts.userMenus to true (to add user menus to all menubars)
 *
 * or:
 *
 * set the data-usermenus attribute to "true" on a specific menubar element:
 *
 * <div class="JS9Menubar" data-style="mac" data-usermenus="true"></div>
 *
 */

/*global JS9, sprintf */

JS9.globalOpts.userMenuBar = [
    {
	"name": "zoom",
	"title": "myZooms",
	"updateTitle": false,
	"options": [
	    {
		"name": "in",
		"shortcut": "zoom in",
		"cmd": "SetZoom",
		"args": ["in"]
	    },
	    {
		"name": "out",
		"shortcut": "zoom out",
		"cmd": "SetZoom",
		"args": ["out"]
	    },
	    {
		"name": "one",
		"shortcut": "reset zoom",
		"cmd": "SetZoom",
		"args": [1]
	    }
	]
    },
    {
	"name": "scale",
	"title": "myScales",
	// eslint-disable-next-line no-unused-vars
	"updateTitle": (im, menuName, optionName) => {
	    let obj;
	    // if no image is loaded, just return main name
	    if( !im ){ return menuName; }
	    // get scale parameters for this image into an object
	    obj = JS9.GetScale({display: im});
	    // shorten the clipping string, if necessary
	    if( obj.scaleclipping === "dataminmax" ){
		obj.scaleclipping = "data";
	    }
	    // return title using backquotes to expand the variables
	    return `${obj.scale}(${obj.scaleclipping})`;
	},
	"options": [
	    {
		"name": "linear",
		"cmd": "SetScale",
		"args": ["linear"]
	    },
	    {
		"name": "log",
		"cmd": "SetScale",
		"args": ["log"]
	    },
	    {
		"name": "histeq",
		"cmd": "SetScale",
		"args": ["histeq"]
	    },
	    {
		"name": "zscale",
		"cmd": "SetScale",
		"args": ["zscale"]
	    },
	    {
		"name": "dataminmax",
		"cmd": "SetScale",
		"args": ["dataminmax"]
	    },
	    {
		"name": "Scales...",
		"cmd": "DisplayPlugin",
		"updateTitle": false,
		"requireImage": false,
		"args": ["JS9Scale"]
	    }
	]
    },
    {
	"name": "colormap",
	"title": "myColormaps",
	"imageTitle": "../images/voyager/color_viridis.png",
	"updateTitle": "image",
	"options": [
	    {
		"name": "grey",
		"image": "../images/voyager/color_grey.png",
		"cmd": "SetColormap",
		"args": ["grey"]
	    },
	    {
		"name": "cool",
		"image": "../images/voyager/color_cool.png",
		"cmd": "SetColormap",
		"args": ["cool"]
	    },
	    {
		"name": "heat",
		"image": "../images/voyager/color_heat.png",
		"cmd": "SetColormap",
		"args": ["heat"]
	    },
	    {
		"name": "viridis",
		"image": "../images/voyager/color_viridis.png",
		"cmd": "SetColormap",
		"args": ["viridis"]
	    },
	    {
		"name": "magma",
		"image": "../images/voyager/color_magma.png",
		"cmd": "SetColormap",
		"args": ["magma"]
	    },
	    {
		"name": "sls",
		"image": "../images/voyager/color_sls.png",
		"cmd": "SetColormap",
		"args": ["sls"]
	    },
	    {
		"name": "red",
		"image": "../images/voyager/color_red.png",
		"cmd": "SetColormap",
		"args": ["red"]
	    },
	    {
		"name": "green",
		"image": "../images/voyager/color_green.png",
		"cmd": "SetColormap",
		"args": ["green"]
	    },
	    {
		"name": "blue",
		"image": "../images/voyager/color_blue.png",
		"cmd": "SetColormap",
		"args": ["blue"]
	    },
	    {
		"name": "Generate colormaps ...",
		"updateTitle": false,
		"requireImage": false,
		"cmd": "DisplayPlugin",
		"args": ["JS9Cmaps"]
	    },
	    {
		"name": "Image filters ...",
		"updateTitle": false,
		"requireImage": false,
		"cmd": "DisplayPlugin",
		"args": ["JS9Filters"]
	    }
	]
    },
    {
	"name": "regions",
	"title": "myRegions",
	"imageTitle": "../images/voyager/regions_circle.svg",
	"updateTitle": "image",
	"options": [
	    {
		"name": "annulus",
		"cmd": "MaybeAddRegions",
		"image": "../images/voyager/regions_annulus.svg",
		"args": ["annulus"]
	    },
	    {
		"name": "box",
		"cmd": "MaybeAddRegions",
		"image": "../images/voyager/regions_box.svg",
		"args": ["box"]
	    },
	    {
		"name": "circle",
		"cmd": "MaybeAddRegions",
		"image": "../images/voyager/regions_circle.svg",
		"args": ["circle"]
	    },
	    {
		"name": "ellipse",
		"cmd": "MaybeAddRegions",
		"image": "../images/voyager/regions_ellipse.svg",
		"args": ["ellipse"]
	    },
	    {
		"name": "line",
		"cmd": "MaybeAddRegions",
		"image": "../images/voyager/regions_line.svg",
		"args": ["line"]
	    },
	    {
		"name": "point",
		"cmd": "MaybeAddRegions",
		"image": "../images/voyager/regions_point.svg",
		"args": ["point"]
	    },
	    {
		"name": "polygon",
		"cmd": "MaybeAddRegions",
		"image": "../images/voyager/regions_polygon.svg",
		"args": ["polygon"]
	    },
	    {
		"name": "text",
		"cmd": "MaybeAddRegions",
		"image": "../images/voyager/regions_text.svg",
		"args": ["text"]
	    },
	    {
		"name": "guides",
		"cmd": "AddRegions",
		"args": (disp, im) => {
		    let x = disp.width / 2;
		    let y = disp.height / 2;
		    let w = im.raw.width / 2;
		    let method = 0;
		    switch(method){
		    case 0:
			// easy for C coders: sprintf, prepend 'd' to pos vals:
			return [sprintf('image; line(d%s,d%s,d%s,d%s) {"preservedcoords":true}; line(d%s,d%s,d%s,d%s) {"color":"red","preservedcoords":true}', 0, y + 114, w, y + 114, 0, y - 121, w, y - 121)];
		    case 1:
			// canonical method: return array of shape objects
			return [[
			    {shape: "line",
			     dx: x, dy: x-121,
			     points: [{x: -w, y: 0},{x: w, y: 0}],
			     color: "red",
			     preservedcoords: true},
			    {shape: "line",
			     dx: x, dy: y+114,
			     points: [{x: -w, y: 0},{x: w, y: 0}],
			     preservedcoords: true}
			]];
		    case 2:
			// alternate method: return string with properties:
			return [`line({"dx":${x},"dy":${y+114},"points":[{"x":${-w},"y":0},{"x":${w},"y":0}],"preservedcoords":true}); line({"dx":${x},"dy":${y-121},"points":[{"x":${-w},"y":0},{"x":${w},"y":0}],"preservedcoords":true, "color":"red"})`];
		    default:
			break;
		    }
		}
	    }
	]
    }
];

JS9.mkPublic("MaybeAddRegions", (...args) => {
    const obj = JS9.parsePublicArgs(args);
    const display = JS9.lookupDisplay(obj.display);
    const reg = obj.argv[0];
    if( reg ){
	JS9.globalOpts.regMenuSelected = reg;
	if( JS9.globalOpts.regMenuCreate ){
	    JS9.AddRegions(reg, {display: display});
	}
    }
});
