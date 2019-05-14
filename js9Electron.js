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
 * Copyright (c) 2016 Smithsonian Astrophysical Observatory
 *
 */

/* global require process __dirname */

"use strict";

const electron = require('electron');
// module to control application life
const app = electron.app;
// module to create native browser window
const BrowserWindow = electron.BrowserWindow;
// module to control ipc
const ipcMain = electron.ipcMain;
// dialog support
const dialog = electron.dialog;
// shell support
const shell = electron.shell;

const path = require('path');
const fs = require('fs');
// const proc = require('child_process');
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

// start up a JS9 helper, if possible and necessary
function startHelper(mode){
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
	}, function(err, rlist ) {
	    if( rlist.length === 0 ){
		// if node helper not running, look for an Electron helper
		ps.lookup({
		    psargs: 'ux',
		    arguments: 'js9Electron.js'
		}, function(err2, rlist2 ) {
		    if( (rlist2.length <= 1) ){
			js9Electron.helper = require(js9Electron.helperpage);
		    }
		});
	    }
	});
    }
}

// defaults passed to the tests
js9Electron.defpage = "file://" + path.join(__dirname, 'js9.html');

// preload page contains initialization values needed before loading JS9
js9Electron.preload = path.join(__dirname, "js9ElectronPreload.js");

// helper page
js9Electron.helperpage = path.join(__dirname, "js9Helper.js");

// default name for saved file
js9Electron.defsave = "js9.save";

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

// command line arguments
js9Electron.argv = require('minimist')(process.argv.slice(2));
// command line switch options
js9Electron.id = js9Electron.argv.i || js9Electron.argv.id || "JS9";
js9Electron.cmds = js9Electron.argv.cmds;
js9Electron.cmdfile = js9Electron.argv.cmdfile;
js9Electron.doHelper = isTrue(js9Electron.argv.helper, true);
js9Electron.debug = isTrue(js9Electron.argv.debug, false);
js9Electron.eval = isTrue(js9Electron.argv.eval, false);
js9Electron.node = isTrue(js9Electron.argv.node, false);
js9Electron.page = js9Electron.argv.w || js9Electron.argv.webpage || process.env.JS9_WEBPAGE || js9Electron.defpage;
js9Electron.title = js9Electron.argv.title;
js9Electron.renameid = js9Electron.argv.renameid;
js9Electron.width = js9Electron.argv.width || 1024;
js9Electron.height = js9Electron.argv.height  || 768;
js9Electron.savedir = js9Electron.argv.savedir;

// the list of files to load
js9Electron.files = js9Electron.argv._;
// hack: js9 script level switches might contain a file to load
// due to how minimist processes arguments
if( js9Electron.argv.a && typeof js9Electron.argv.a === "string" ){
    js9Electron.files.unshift(js9Electron.argv.a);
}
if( js9Electron.argv.v && typeof js9Electron.argv.v === "string" ){
    js9Electron.files.unshift(js9Electron.argv.v);
}

// security checks: https://electronjs.org/docs/tutorial/security
// security check: disallow http
if( js9Electron.page.match(/^http:\/\//) ){
    dialog.showErrorBox("Security Error",
			"http protocol is disabled: use https");
    process.exit();
}
// security check: disallow node integration with non-local web pages
if( js9Electron.page.match(/^(https?|ftp):\/\//) && js9Electron.node ){
    dialog.showErrorBox("Security Error",
			"don't enable node with a non-local web page");
    process.exit();
}

// setup on-will-download callbacks to save files without a dialog box
function initWillDownload() {
    if( !js9Electron.willDownload && js9Electron.savedir ){
	// eslint-disable-next-line no-unused-vars
	js9Electron.win.webContents.session.on('will-download', (event, item, webContents) => {
	    const fname = item.getFilename();
	    const pname = js9Electron.savedir + "/" +
		          (fname||js9Electron.defsave);
	    // Set the save path, making Electron not to prompt a save dialog.
	    item.setSavePath(pname);
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
		if (state !== 'completed') {
		    // eslint-disable-next-line no-console
		    dialog.showErrorBox("Error saving file",
					`${pname} [${state}]`);
		}
	    });
	});
	// only need to do this once
	js9Electron.willDownload = true;
    }
}

// create a new window for a JS9 web page
function createWindow() {
    let cmd;
    let ncmd=0;
    let xcmds = "";
    // set dock icon for Mac
    if( process.platform === "darwin" ){
	app.dock.setIcon(path.join(__dirname,
				   "/images/js9logo/png/js9logo_64.png"));
    }
    // create the browser window
    js9Electron.win = new BrowserWindow({
	webPreferences: {nodeIntegration: js9Electron.node,
			 contextIsolation: false,
			 enableRemoteModule: false,
			 preload: js9Electron.preload},
	width: js9Electron.width,
	height: js9Electron.height
    });
    // and load the web page
    if( !js9Electron.page.includes("://") ){
	if( !path.isAbsolute(js9Electron.page) ){
	    if( process.env.PWD ){
		js9Electron.page = process.env.PWD + "/" + js9Electron.page;
	    } else {
		js9Electron.page = path.relative(__dirname, js9Electron.page);
	    }
	}
	js9Electron.page = "file://" + js9Electron.page;
    }
    js9Electron.win.loadURL(js9Electron.page);
    // download to a specfied directory (without using a dialog box)?
    if( js9Electron.savedir ){
	initWillDownload();
    }
    // open the DevTools, if necessary
    if( js9Electron.debug ){
	js9Electron.win.webContents.openDevTools({mode: 'detach'});
    }
    cmd = "if( typeof JS9 !== 'object' || typeof JS9.Image !== 'function'  ){alert('JS9 was not loaded properly. Please check the paths to the JS9 css and js files in your web page header and try again.');}";
    js9Electron.win.webContents.executeJavaScript(cmd);
    // processing when document is ready
    cmd = "$(document).ready(function(){";
    if( !js9Electron.eval ){
	// disable eval in renderer window after JS9 is ready
	// http://electron.atom.io/docs/tutorial/security/
	cmd +="$(document).on('JS9:ready', function(){";
	cmd += "window.eval = function(){throw new Error('For security reasons, Desktop JS9 does not support window.eval()');}";
	cmd += "});";
	ncmd++;
    }
    // 2. rename default id to title
    if( js9Electron.title ){
	js9Electron.title = js9Electron.title.replace(/\\/g,"");
	cmd += `JS9.RenameDisplay('${js9Electron.title}');`;
    }
    // 3. rename other ids
    if( js9Electron.renameid ){
	js9Electron.renameid = js9Electron.renameid.replace(/\\/g,"");
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
    // 4. load data files
    for(let i=0; i<js9Electron.files.length; i++){
	let file = js9Electron.files[i].replace(/\\/g,"");
	const jobj = (js9Electron.files[i+1]||"").replace(/\\/g,"");
	// relative data paths must be relative to js9Electron.js script
	if( !file.match(/^(https?|ftp):\/\//) && !path.isAbsolute(file) ){
	    if( process.env.PWD ){
		file = process.env.PWD + "/" + file;
	    } else {
		file = path.relative(__dirname, file);
	    }
	}
	if( jobj && jobj.startsWith('{') ){
	    i++;
	    cmd += `JS9.Preload('${file}', '${jobj}');`;
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
	    cmd += "$(document).on('JS9:ready', function(){";
	    cmd += xcmds;
	    cmd += "});";
	}
	ncmd++;
    }
    if( ncmd ){
	cmd += '});';
	js9Electron.win.webContents.executeJavaScript(cmd);
    }

    // set up main menu
    try{ require('./js9ElectronMainMenu'); }
    catch(e){}

    // emitted when the window is closed
    js9Electron.win.on('closed', function () {
	// Dereference the window object, usually you would store windows
	// in an array if your app supports multi windows, this is the time
	// when you should delete the corresponding element.
	js9Electron.win = null;
    });
}

// start helper, if necessary
startHelper();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// quit when all windows are closed
app.on('window-all-closed', () => {
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
	event.preventDefault();
	shell.openExternal(navigationUrl);
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
ipcMain.on('msg', (event, arg) => {
    var obj, file, opts;
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
		dialog.showErrorBox("ERROR parsing JSON opts: ", e.message);
	    }
	}
	if( typeof obj === "object" ){
	    switch(obj.cmd){
	    case "savedir":
		if( obj.opts ){
		    js9Electron.savedir = obj.opts;
		    initWillDownload();
		}
		break;
	    case "print":
		opts = Object.assign(js9Electron.printOpts, obj.opts);
		try{
		    win.webContents.print(opts, function(e){
			if( e ){
			    dialog.showErrorBox("ERROR in WindowPrint",
						e.message);
			    return;
			}
		    });
		}
		catch(e){
		    dialog.showErrorBox("ERROR in WindowPrint", e.message);
		}
		break;
	    case "pdf":
		file = obj.filename || "js9.pdf";
		opts = Object.assign(js9Electron.pdfOpts, obj.opts);
		try{
		    win.webContents.printToPDF(opts, function(e, data){
			if( e ){
			    dialog.showErrorBox("ERROR in WindowToPDF: ",
						e.message);
			    return;
			}
			fs.writeFile(file, data, function(e) {
			    if( e ){
				dialog.showErrorBox("ERROR in WindowToPDF: ",
						    e.message);
				return;
			    }
			});
		    });
		}
		catch(e){
		    dialog.showErrorBox("ERROR in WindowToPDF", e.message);
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

