/*
 * js9usermenus.js -- an example of how to define user menus in JS9.
 *
 * An array of four user menus objects (zooms, scales, colormaps, and regions)
 * that gets assigned to the JS9.globalOpts.userMenuBar property.
 *
 * Each user menu should have a name, a title (menu title) and an array of
 * options (menu options).
 *
 * Each option should have a name, an optional image, a public API command,
 * and an array of arguments to pass to that command.
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
JS9.globalOpts.userMenuBar = [
    {
	"name": "zoom",
	"title": "myZooms",
	"options": [
	    {
		"name": "in",
		"cmd": "SetZoom",
		"args": ["in"]
	    },
	    {
		"name": "out",
		"cmd": "SetZoom",
		"args": ["out"]
	    },
	    {
		"name": "one",
		"cmd": "SetZoom",
		"args": [1]
	    }
	]
    },
    {
	"name": "scale",
	"title": "myScales",
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
	    }
	]
    },
    {
	"name": "colormap",
	"title": "myColormaps",
	"options": [
	    {
		"name": "grey",
		"image": "images/toolbar/dax_images/cmap_grey.png",
		"cmd": "SetColormap",
		"args": ["grey"]
	    },
	    {
		"name": "cool",
		"image": "images/toolbar/dax_images/cmap_cool.png",
		"cmd": "SetColormap",
		"args": ["cool"]
	    },
	    {
		"name": "heat",
		"image": "images/toolbar/dax_images/cmap_heat.png",
		"cmd": "SetColormap",
		"args": ["heat"]
	    },
	    {
		"name": "viridis",
		"image": "images/toolbar/dax_images/cmap_viridis.png",
		"cmd": "SetColormap",
		"args": ["viridis"]
	    },
	    {
		"name": "magma",
		"image": "images/toolbar/dax_images/cmap_magma.png",
		"cmd": "SetColormap",
		"args": ["magma"]
	    },
	    {
		"name": "sls",
		"image": "images/toolbar/dax_images/cmap_sls.png",
		"cmd": "SetColormap",
		"args": ["sls"]
	    },
	    {
		"name": "red",
		"image": "images/toolbar/dax_images/cmap_red.png",
		"cmd": "SetColormap",
		"args": ["red"]
	    },
	    {
		"name": "green",
		"image": "images/toolbar/dax_images/cmap_green.png",
		"cmd": "SetColormap",
		"args": ["green"]
	    },
	    {
		"name": "blue",
		"image": "images/toolbar/dax_images/cmap_blue.png",
		"cmd": "SetColormap",
		"args": ["blue"]
	    },
	]
    },
    {
	"name": "regions",
	"title": "myRegions",
	"options": [
	    {
		"name": "annulus",
		"cmd": "AddRegions",
		"args": ["annulus"]
	    },
	    {
		"name": "box",
		"cmd": "AddRegions",
		"args": ["box"]
	    },
	    {
		"name": "circle",
		"cmd": "AddRegions",
		"args": ["circle"]
	    },
	    {
		"name": "ellipse",
		"cmd": "AddRegions",
		"args": ["ellipse"]
	    },
	    {
		"name": "line",
		"cmd": "AddRegions",
		"args": ["line"]
	    },
	    {
		"name": "point",
		"cmd": "AddRegions",
		"args": ["point"]
	    },
	    {
		"name": "polygon",
		"cmd": "AddRegions",
		"args": ["polygon"]
	    },
	    {
		"name": "text",
		"cmd": "AddRegions",
		"args": ["text"]
	    }
	]
    },

];

