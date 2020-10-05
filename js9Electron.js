/*
 *
 * js9Electron: Electron module for JS9 (November 17, 2016)
 *
 * used to create Desktop JS9 application
 *
 * Principal(s): Eric Mandel
 * Organization: Harvard Smithsonian Center for Astrophysics, Cambridge MA
 * Contact: saord@cfa.harvard.edu
 *
 * Copyright (c) 2016 - 2020 Smithsonian Astrophysical Observatory
 *
 */

/* global require process __dirname */

"use strict";

const electron = require('electron');
// module to control application life
const app = electron.app;
// module to create native browser window
const BrowserWindow = electron.BrowserWindow;
// screen size
const screen = electron.screen;
// module to control ipc
const ipcMain = electron.ipcMain;
// dialog support
const dialog = electron.dialog;
// shell support
const shell = electron.shell;

const os = require('os');
const path = require('path');
const fs = require('fs');
const proc = require('child_process');
const ps = require('ps-node');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
// let mainWindow;

// js9Electron object contains everything specific to our server
const js9Electron = {};

function isTrue(s, d){
    if( s === undefined ){
	return d;
    }
    return !!JSON.parse(String(s).toLowerCase());
}

// load preference file, if possible
const loadPreferences = function(prefs){
    let s, obj, tobj, opt, otype, jtype, val;
    if( fs.existsSync(prefs) ){
	s = fs.readFileSync(prefs, "utf-8");
    } else if( typeof prefs === "string" ){
	s = `{"cmdlineOpts": ${prefs}}`;
    }
    if( s ){
	try{ obj = JSON.parse(s.toString()); }
	catch(e){
	    dialog.showErrorBox("JSON Error", `can't parse ${prefs}: ${s}`);
	}
	// save prefs in file before merge
	js9Electron.prefs = obj;
	// look for top-level objects
	for( tobj in obj ){
	    if( obj.hasOwnProperty(tobj)              &&
		typeof obj[tobj] === "object"         &&
		js9Electron.hasOwnProperty(tobj)      &&
		typeof js9Electron[tobj] === "object" ){
		// process each property of this object
		for( opt in obj[tobj] ){
		    if( obj[tobj].hasOwnProperty(opt) ){
			val = obj[tobj][opt];
			otype = typeof val;
			jtype = typeof js9Electron[tobj][opt];
			if( (jtype === otype) || (jtype === "undefined") ){
			    switch(otype){
			    case "number":
				js9Electron[tobj][opt] = val;
				break;
			    case "boolean":
				js9Electron[tobj][opt] = val;
				break;
			    case "string":
				js9Electron[tobj][opt] = val;
				break;
			    case "object":
				js9Electron[tobj][opt] = val;
				break;
			    default:
				break;
			    }
			}
		    }
		}
	    }
	}
    }
};

// start up a JS9 helper, if possible and necessary
function startHelper(mode){
    var domerge = () => {
	try{
	    proc.exec(`js9 merge "${js9Electron.merge}"`);
	}
	catch(e){
	    dialog.showErrorBox("Error merging helper",
				`can't merge: ${js9Electron.merge}`);
	}
    };
    // start up the helper first, if necessary
    if( js9Electron.doHelper ){
	// if mode is true, just try to start the helper and return
	if( mode ){
	    js9Electron.helper = require(js9Electron.helperpage);
	    return;
	}
	// look for a node JS9 helper already running
	ps.lookup({
	    command: 'node',
	    psargs: 'ux',
	    arguments: 'js9Helper.js'
	}, (err, rlist) => {
	    if( rlist.length === 0 ){
		// if node helper not running, look for an Electron helper
		ps.lookup({
		    psargs: 'ux',
		    arguments: 'js9Electron.js'
		}, (err2, rlist2) => {
		    if( (rlist2.length <= 1) ){
			js9Electron.helper = require(js9Electron.helperpage);
		    } else if( js9Electron.merge ){
			domerge();
		    }
		});
	    } else if( js9Electron.merge ){
		domerge();
	    }
	});
    }
}

// setup on-will-download callbacks to save files without a dialog box
function initWillDownload() {
    // eslint-disable-next-line no-unused-vars
    js9Electron.win.webContents.session.on('will-download', (event, item, webContents) => {
	const fname = item.getFilename() || js9Electron.defsave;
	const dirname = (js9Electron.savedir || process.cwd() || ".");
	const pname = path.join(dirname, fname);
	// do we need a dialog box?
	if( js9Electron.savedialog ){
	    // dialog options: seed the default path
	    item.setSaveDialogOptions({defaultPath: pname});
	} else {
	    // set save path: Electron will not to prompt a save dialog
	    item.setSavePath(pname);
	    // reset save path, if necessary
	    if( js9Electron.savedirOnce !== undefined ){
		js9Electron.savedir = js9Electron.savedirOnce;
		js9Electron.savedialog = js9Electron.savedir ? false : true;
		delete js9Electron.savedirOnce;
	    }
	}
	item.on('updated', (event, state) => {
	    if (state === 'interrupted') {
		// eslint-disable-next-line no-console
		console.log(`Save interrupted: ${pname}`);
	    } else if (state === 'progressing') {
		if (item.isPaused()) {
		    // eslint-disable-next-line no-console
		    console.log(`Save paused: ${pname}`);
		}
	    }
	});
	item.once('done', (event, state) => {
	    if( state !== 'completed' && state !== "cancelled" ){
		// eslint-disable-next-line no-console
		dialog.showErrorBox("Error saving file", `${pname} [${state}]`);
	    }
	});
    });
}

// create a new window for a JS9 web page
function createWindow() {
    let f, s, cmd, todir, twebpage;
    let ncmd = 0;
    let xcmds = "";
    let webpage = js9Electron.webpage;
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const getval = (s) => {
	let d;
	if( s === "true" ){
	    return true;
	}
	if( s === "false" ){
	    return false;
	}
	d = Number.parseFloat(s);
	if( Number.isNaN(d) || !Number.isFinite(d) ){
	    return s;
	}
	return d;
    }
    // avoid v8.0 deprecation warning
    if( process.versions.electron.split(".")[0] < 9 ){
	app.allowRendererProcessReuse = false;
    }
    // set dock icon for Mac
    if( process.platform === "darwin" ){
	if( js9Electron.icon && fs.existsSync(js9Electron.icon) ){
	    try{ app.dock.setIcon(js9Electron.icon); }
	    catch(e){ /* empty */ }
	}
    }
    // adjust window width and height to fit screen size, if necessary
    if( js9Electron.width <= 0 ){
	js9Electron.width = width;
	process.env.JS9_WIDTH = js9Electron.width;
    }
    if( js9Electron.height <= 0 ){
	js9Electron.height = height;
	process.env.JS9_HEIGHT = js9Electron.height;
    }
    // create the browser window
    js9Electron.win = new BrowserWindow({
	webPreferences: js9Electron.webOpts,
	width: js9Electron.width,
	height: js9Electron.height,
	icon: js9Electron.icon
    });
    // set up merging, if necessary
    if( js9Electron.merge ){
	try{ js9Electron.mergeStat = fs.statSync(js9Electron.merge); }
	catch(e){
	    dialog.showErrorBox("Error on merge",
				`can't find merge file or dir: ${js9Electron.merge}`);
	    process.exit();
	}
	if( !js9Electron.mergeStat.isDirectory() ){
	    // not a directory => web page
	    js9Electron.mergePage = js9Electron.merge;
	    // get the merge directory
	    js9Electron.merge = path.dirname(js9Electron.merge);
	    try{ js9Electron.mergeStat = fs.statSync(js9Electron.merge); }
	    catch(e){
		dialog.showErrorBox("Error on merge",
		`can't find merge directory: ${js9Electron.merge}`);
		process.exit();
	    }
	}
	// read new html file and convert possibly bogus path from js9 files
	// we will specify a base URL instead
	if( js9Electron.mergePage ){
	    todir = path.relative(js9Electron.merge, __dirname);
            s = fs.readFileSync(js9Electron.mergePage, "utf-8")
		.replace(/<base.*>/, "")
		.replace(/(<head>)/,
			 `$1\n  <base href="file://${js9Electron.merge}/">`)
		.replace(/(href=['"])(.*)\/(js9support\.css['"])/,
                         `$1${todir}/$3`)
		.replace(/(href=['"])(.*)\/(js9\.css['"])/,
                         `$1${todir}/$3`)
		.replace(/(src=['"])(\/.*|\.\.\/.*)\/(js9prefs\.js['"])/,
                         `$1${todir}/$3`)
		.replace(/(src=['"])(.*)\/(js9support(\.min)?\.js['"])/,
                         `$1${todir}/$3`)
		.replace(/(src=['"])(.*)\/(js9(\.min)?\.js['"])/,
                         `$1${todir}/$3`)
		.replace(/(src=['"])(.*)\/(js9plugins(\.min)?\.js['"])/,
                         `$1${todir}/$3`);
	    f = `${js9Electron.tmp}/${path.basename(js9Electron.mergePage)}`;
	    fs.writeFileSync(f, s);
	    // save name of the merged webpage for deletion
	    js9Electron.mergePage = f;
	    // new page containing js9 files from our install
	    webpage = `file://${f}`;
	}
	// pass the merge dir to the helper in a prefs environment variable
	process.env.JS9_HELPER_PREFS = 	`{"merge":"${js9Electron.merge}"}`;
    }
    // final checks on the web page
    if( !webpage.includes("://") ){
	if( !path.isAbsolute(webpage) ){
	    // inside a script, look for web page in current directory first
	    if( process.env.PWD && process.env.JS9_MSGSCRIPT ){
		twebpage = path.join(process.env.PWD, webpage);
		if( fs.existsSync(twebpage) ){
		    webpage = twebpage;
		} else {
		    twebpage = null;
		}
	    }
	    if( webpage !== twebpage ){
		// look for web page in install directory
		webpage = path.join(__dirname, webpage);
	    }
	}
	// at this point, web page should exist
	if( !fs.existsSync(webpage) ){
	    dialog.showErrorBox("JS9 error", `can't find webpage ${webpage}`);
	    process.exit();
	}
	webpage = `file://${webpage}`;
    }
    // load the web page
    js9Electron.win.loadURL(webpage);
    // init download support
    initWillDownload();
    // open the DevTools, if necessary
    if( js9Electron.debug ){
	// hack to avoid console spam:
	// https://github.com/electron/electron/issues/12438
	js9Electron.win.webContents.once('dom-ready', () => {
	    js9Electron.win.webContents.openDevTools({mode: 'detach'});
	});
    }
    cmd = "if( typeof JS9 !== 'object' || typeof JS9.Image !== 'function'  ){alert('JS9 was not loaded properly. Please check the paths to the JS9 css and js files in your web page header and try again.');}";
    // see: https://github.com/electron/electron/issues/23722
    cmd += ";0";
    js9Electron.win.webContents.executeJavaScript(cmd);
    // processing when document is ready
    cmd = "$(document).ready(() => {";
    // rename default id to title
    if( js9Electron.title ){
	cmd += `JS9.RenameDisplay('${js9Electron.title}');`;
    }
    // rename other ids
    if( js9Electron.renameid ){
	const arr1 = js9Electron.renameid.split(",");
	for(let i=0; i<arr1.length; i++){
	    const arr2 = arr1[i].split(":");
	    switch(arr2.length){
	    case 0:
		break;
	    case 1:
		cmd += `JS9.RenameDisplay('${arr2[0]}');`;
		break;
	    default:
		cmd += `JS9.RenameDisplay('${arr2[0]}', '${arr2[1]}');`;
		break;
	    }
	}
    }
    // load data files (and opts)
    for(let i=0; i<js9Electron.files.length; i++){
	let file = js9Electron.files[i].replace(/\\/g,"");
	let obj = {};
	let done = false;
	let s, jobj;
	// relative data paths must be relative to js9Electron.js script
	if( !file.match(/^(https?|ftp):\/\//) && !path.isAbsolute(file) ){
	    if( process.env.PWD ){
		file = path.join(process.env.PWD, file);
	    } else {
		file = path.relative(__dirname, file);
	    }
	}
	// gather up args that go with this file
	while( !done ){
	    if( js9Electron.files[i+1] !== undefined ){
		s = (js9Electron.files[i+1]).replace(/\\/g,"");
		if( s && s.startsWith('{') ){
		    i++;
		    try{ jobj = JSON.parse(s); }
		    catch(e){
			dialog.showErrorBox("ERROR parsing JSON opts",
					    e.message);
		    }
		} else if( s.charAt(0) === "-" ){
		    i++;
		    if( js9Electron.files[i+1] !== undefined ){
			s = s.replace(/--?/, "");
			obj[s] = getval(js9Electron.files[i+1]);
			i++;
		    } else {
			dialog.showErrorBox("ERROR loading file",
					    `missing arg after ${s}`);
		    }
		} else {
		    done = true;
		}
	    } else{
		done = true;
	    }
	}
	// merge json obj into other properties
	if( jobj ){
	    obj = Object.assign(jobj, obj);
	}
	s = JSON.stringify(obj);
	if( s !== "{}" ){
	    cmd += `JS9.Preload('${file}', '${s}');`;
	}  else {
	    cmd += `JS9.Preload('${file}');`;
	}
	ncmd++;
    }
    // 5. add cmds to execute
    if( fs.existsSync(js9Electron.cmdfile) ){
	xcmds = fs.readFileSync(js9Electron.cmdfile, "utf-8");
    }
    if( js9Electron.cmds ){
	if( xcmds ){
	    xcmds += ";";
	}
	xcmds += js9Electron.cmds.replace(/\\/g,"");
    }
    if( xcmds ){
	if( js9Electron.files.length ){
	    // execute after preloads are loaded
	    cmd += "JS9.globalOpts.onpreload = function(){";
	    cmd += xcmds;
	    cmd += "};";
	} else {
	    // execute as soon as JS9 is ready
	    cmd += "$(document).on('JS9:ready', () => {";
	    cmd += xcmds;
	    cmd += "});";
	}
	ncmd++;
    }
    if( ncmd ){
	cmd += '})';
	// see: https://github.com/electron/electron/issues/23722
	cmd += ";0";
	js9Electron.win.webContents.executeJavaScript(cmd);
    }

    // set up main menu
    try{ require('./js9ElectronMainMenu'); }
    catch(e){ /* empty */ }

    // emitted when the window is closed
    js9Electron.win.on('closed', () => {
	// Dereference the window object, usually you would store windows
	// in an array if your app supports multi windows, this is the time
	// when you should delete the corresponding element.
	js9Electron.win = null;
    });
}

// default web page
js9Electron.defpage = "js9.html";

// preload page contains initialization values needed before loading JS9
js9Electron.preload = path.join(__dirname, "js9ElectronPreload.js");

// helper page
js9Electron.helperpage = path.join(__dirname, "js9Helper.js");

// default name for saved file
js9Electron.defsave = "js9.save";

// browser window defaults
js9Electron.webOpts = {
    nodeIntegration: false,  // turn on for emscripten NODEFS support (hostfs)
    contextIsolation: true,  // but see below, v10.0.0 breaks wasm compilation
    enableRemoteModule: false,        // see security recommendations
    allowRendererProcessReuse: true,  // https://github.com/electron/electron/issues/18397
    worldSafeExecuteJavaScript: true, // see security recommendations
    nativeWindowOpen: true,           // can't get BrowserWindow one to work ...
    preload: js9Electron.preload
};

// pdf options
js9Electron.printOpts = {
    silent: false,
    printBackground: true,
    deviceName: ""
};

// print options
js9Electron.pdfOpts = {
    marginsType: 0,
    pageSize: "A3",
    printBackground: true,
    printSelectionOnly: false,
    landscape: false
};

// command line defaults
js9Electron.cmdlineOpts = {
    doHelper: true,
    debug: false,
    icon: "images/js9logo/png/js9logo_64.png",
    hostfs: false,
    webpage: process.env.JS9_WEBPAGE || js9Electron.defpage,
    tmp: process.env.JS9_TMPDIR || "/tmp",
    width: 1024,
    height: 768
};

// skip args passed to electron itself
js9Electron.startArg = 1;
// when started from a script, this file is passed as arg[1]
if( typeof process.argv[js9Electron.startArg] === "string"       &&
    process.argv[js9Electron.startArg].match(/js9Electron\.js$/) ){
    js9Electron.startArg++;
}
// js9 command line arguments: skip --no-sandbox, -a, -v args
js9Electron.args = [];
for(let i=js9Electron.startArg; i<process.argv.length; i++){
    if( process.argv[i] !== "--no-sandbox"  &&
	process.argv[i] !== "-a"            &&
	process.argv[i] !== "-v"            &&
	process.argv[i] !== "-av"           ){
	js9Electron.args = process.argv.slice(i);
	break;
    }
}
js9Electron.argv = require('minimist')(js9Electron.args, {stopEarly:true});

// maybe override defaults using json file
// (this is where the Mac app gets its configuration)
js9Electron.prefsFile = path.join(__dirname, "js9Electron.json");
if( fs.existsSync(js9Electron.prefsFile) ){
    loadPreferences(js9Electron.prefsFile);
}

// command line switch options
js9Electron.cmds = js9Electron.argv.cmds || js9Electron.cmdlineOpts.cmds;
js9Electron.cmdfile = js9Electron.argv.cmdfile || js9Electron.cmdlineOpts.cmdfile;
js9Electron.doHelper = isTrue(js9Electron.argv.helper, js9Electron.cmdlineOpts.doHelper);
js9Electron.debug = isTrue(js9Electron.argv.debug, js9Electron.cmdlineOpts.debug);
js9Electron.icon = js9Electron.argv.icon || js9Electron.cmdlineOpts.icon;
js9Electron.hostfs = isTrue(js9Electron.argv.hostfs, js9Electron.cmdlineOpts.hostfs);
js9Electron.merge = js9Electron.argv.merge|| js9Electron.cmdlineOpts.merge;
js9Electron.webpage = js9Electron.argv.w || js9Electron.argv.webpage || js9Electron.cmdlineOpts.webpage;
js9Electron.title = js9Electron.argv.title|| js9Electron.cmdlineOpts.title;
js9Electron.tmp = js9Electron.argv.tmp || js9Electron.cmdlineOpts.tmp;
js9Electron.renameid = js9Electron.argv.renameid|| js9Electron.cmdlineOpts.renameid;
js9Electron.width = js9Electron.argv.width || js9Electron.cmdlineOpts.width;
js9Electron.height = js9Electron.argv.height  || js9Electron.cmdlineOpts.height;
js9Electron.savedir = js9Electron.argv.savedir || js9Electron.cmdlineOpts.savedir;

// the list of files to load
js9Electron.files = js9Electron.argv._;

//  remove backquotes from files passed via js9 script
if( js9Electron.webpage ){
    js9Electron.webpage = js9Electron.webpage.replace(/\\/g,"");
}
if( js9Electron.icon ){
    js9Electron.icon = js9Electron.icon.replace(/\\/g,"");
    if( !path.isAbsolute(js9Electron.icon) ){
	js9Electron.icon = path.join(__dirname, js9Electron.icon);
    }
}
if( js9Electron.merge ){
    js9Electron.merge = js9Electron.merge.replace(/\\/g,"")
}
if( js9Electron.renameid ){
    js9Electron.renameid = js9Electron.renameid.replace(/\\/g,"");
}
if( js9Electron.title ){
    js9Electron.title = js9Electron.title.replace(/\\/g,"");
}

// no dialog box if savedir was specified
js9Electron.savedialog = js9Electron.savedir ? false : true;

// use of host file system passed to js9 via preload
if( js9Electron.hostfs ){
    js9Electron.webOpts.nodeIntegration = true;
    process.env.JS9_HOSTFS = require("os").hostname() || "hostFS";
} else {
    js9Electron.webOpts.nodeIntegration = false;
    process.env.JS9_HOSTFS = "";
}

// pass to JS9 via preload so we can bypass default 'false' in js9prefs.js
process.env.JS9_ELECTRONHELPER = String(js9Electron.doHelper);

// contextIsolation breaks wasm in v10.0.0
js9Electron.webOpts.contextIsolation = false;
process.env.JS9_CONTEXTISOLATION = "false";

// are we in an app (i.e. Voyager) or run from js9 script?
// if we are in an app, add the host-specific bin directory to the path
if( !process.env.JS9_MSGSCRIPT ){
    js9Electron.appbin = path.join(__dirname,
				   `${os.platform()}-${os.arch()}`,
				   "bin");
    // make sure its really got the right structure for an app
    if( fs.existsSync(js9Electron.appbin) ){
	// truly an app
	js9Electron.isApp = true;
	process.env.JS9_APP = "true";
	// add app bin directory to path
	process.env.PATH += `:${js9Electron.appbin}`;
    } else {
	// shouldn't happen, but its not an app
	delete js9Electron.appbin;
	js9Electron.isApp = false;
	process.env.JS9_APP = "false";
    }
} else {
    // not an app
    js9Electron.isApp = false;
    process.env.JS9_APP = "false";
}

// app initialization
if(  js9Electron.isApp ){
    // pass to JS9 via preload to edit cmdline props in the prefs plugin
    process.env.JS9_CMDLINEOPTS = JSON.stringify(js9Electron.cmdlineOpts);
    // try to change current directory if we're in / (where macOS puts us)
    if( process.cwd() === "/" ){
	if( process.env.JS9_HOME ){
	    try{ process.chdir(process.env.JS9_HOME); }
	    catch(e){ /* empty */ }
	} else if( process.env.HOME ){
	    try{ process.chdir(process.env.HOME); }
	    catch(e){ /* empty */ }
	}
    }
}

// security checks: https://electronjs.org/docs/tutorial/security
// security check: disallow http except locally
if( js9Electron.webpage.match(/^http:\/\//) &&
    !js9Electron.webpage.match(/localhost/) ){
    dialog.showErrorBox("Security Error",
			"http protocol is disabled: use https");
    process.exit();
}
// security check: disallow enabling host access with non-local web pages
if( js9Electron.hostfs                                &&
    js9Electron.webpage.match(/^(https?|ftp):\/\//)   &&
    !js9Electron.webpage.match(/localhost/)           ){
    dialog.showErrorBox("Security Error",
			"can't visit a non-local web page with hostfs enabled");
    process.exit();
}

// start helper, if necessary
if( !js9Electron.webpage.match(/^(https?|ftp):\/\//) ||
    js9Electron.webpage.match(/localhost/)           ){
    startHelper();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    ps.lookup({
	psargs: 'ux',
	arguments: 'js9Electron.js'
    }, (err, rlist) => {
	if( rlist.length >= 2 ){
	    process.env.JS9_MULTIELECTRON = "true";
	}
	createWindow();
    });
});

// quit when all windows are closed
app.on('window-all-closed', () => {
    // remove generated page if we merged
    if( typeof js9Electron.mergePage === "string" ){
	try{ fs.unlinkSync(js9Electron.mergePage); }
	catch(e){ /* empty */ }
    }
    // quit the app
    app.quit();
});

// https://electronjs.org/docs/tutorial/security
// don't allow navigation away from this web page
// new windows inside a web page are opened in the default browser
app.on('web-contents-created', (event, contents) => {
    // eslint-disable-next-line no-unused-vars
    contents.on('will-navigate', (event, navigationUrl) => {
	event.preventDefault();
	dialog.showErrorBox("Security Error",
			    "navigation away from this web site is not permitted");
    });
    contents.on('new-window', (event, navigationUrl) => {
	// inline windows sent to us from js9 are ok, others go to the browser
	if( !navigationUrl.match(/^data:text\/html/) ){
	    event.preventDefault();
	    shell.openExternal(navigationUrl);
	}
    });
});

// On OS X it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on('activate', () => {
    if( js9Electron.win === null ){
	createWindow();
    }
});

// process messages from js9
ipcMain.on("msg", (event, arg) => {
    var s, obj, opts;
    var win = js9Electron.win;
    switch(arg){
    case "startHelper":
	startHelper(true);
	break;
    default:
	obj = arg;
	if( typeof obj === "string" ){
	    try{ obj = JSON.parse(obj); }
	    catch(e){
		dialog.showErrorBox("ERROR parsing JSON opts", e.message);
	    }
	}
	if( typeof obj === "object" ){
	    switch(obj.cmd){
	    case "savedir":
		if( obj.opts && obj.opts.onceOnly ){
		    js9Electron.savedirOnce = js9Electron.savedir || "";
		}
		js9Electron.savedir = obj.dirname;
		js9Electron.savedialog = js9Electron.savedir ? false : true;
		break;
	    case "print":
		opts = Object.assign(js9Electron.printOpts, obj.opts);
		try{
		    win.webContents.print(opts, (success) => {
			if( !success ){
			    dialog.showErrorBox("ERROR in WindowPrint",
						"could not print JS9 window");
			    return;
			}
		    });
		}
		catch(e){
		    dialog.showErrorBox("ERROR in WindowPrint", e.message);
		}
		break;
	    case "pdf":
		opts = Object.assign(js9Electron.pdfOpts, obj.opts);
		win.webContents.printToPDF(opts).then(data => {
		    let file = obj.filename || "js9.pdf";
		    fs.writeFile(file, data, (e) => {
			if( e ){
			    dialog.showErrorBox("ERROR in WindowToPDF",
						e.message);
			    return;
			}
		    });
		}).catch( e => {
		    dialog.showErrorBox("ERROR in WindowToPDF", e.message);
		});
		break;
	    case "script":
		if( js9Electron.appbin ){
		    s = path.join(js9Electron.appbin, "js9");
		    fs.readFile(s, "utf-8", (err, data) => {
			let dir, file;
			if( err ){
			    dialog.showErrorBox("ERROR in SaveScript",
						err.message);
			    return;
			}
			dir = js9Electron.savedir || process.cwd() || ".";
			file = path.join(dir, obj.filename || "js9msg");
			data = data
			    .replace(/JS9_SRCDIR=".*"/, `JS9_SRCDIR="${__dirname}"`)
			    .replace(/JS9_INSTALLDIR=".*"/, `JS9_INSTALLDIR="${__dirname}"`);
			fs.writeFile(file, data, (err) => {
			    if( err ){
				dialog.showErrorBox("ERROR in SaveScript",
						    err.message);
				return;
			    }
			    fs.chmod(file, 0o755, (err) => {
				if( err ){
				    dialog.showErrorBox("ERROR in SaveScript",
							err.message);
				}
			    });
			});
		    });
		}
		break;
	    case "cmdline":
		switch(obj.mode){
		case "save":
		    // merge cmdlineOpts with prefs, if necessary
		    if( js9Electron.prefs ){
			// deep copy of prefs object
			s = JSON.parse(JSON.stringify(js9Electron.prefs));
			// overwrite cmdline object
			s.cmdlineOpts = obj.cmdlineOpts;
		    } else {
			// just cmdline object
			s = {cmdlineOpts: obj.cmdlineOpts};
		    }
		    // nicely formatted object
		    s = JSON.stringify(s, null, 4);
		    // save to file
		    fs.writeFile(js9Electron.prefsFile, s, (err) => {
			if( err ){
			    dialog.showErrorBox(`ERROR saving ${js9Electron.prefsFile}`, err.message);
			    return;
			}
		    });
		    break;
		case "remove":
		    try{ fs.unlinkSync(js9Electron.prefsFile); }
		    catch(e){ /* empty */ }
		    break;
		}
		break;
	    default:
		break;
	    }
	}
	break;
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

