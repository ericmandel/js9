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

const path = require('path');
// const proc = require('child_process');
const ps = require('ps-node');

function isTrue(s, d){
    if( s === undefined ){
	return d;
    }
    return !!JSON.parse(String(s).toLowerCase());
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
// let mainWindow;

// js9Electron object contains everything specific to our server
const js9Electron = {};

// defaults passed to the tests
js9Electron.defpage = "file://" + path.join(__dirname, 'js9.html');

// command line arguments
js9Electron.argv = require('minimist')(process.argv.slice(2));
// command line switch options
js9Electron.id = js9Electron.argv.i || js9Electron.argv.id || "JS9";
js9Electron.doHelper = isTrue(js9Electron.argv.helper, true);
js9Electron.debug = isTrue(js9Electron.argv.debug, false);
js9Electron.page = js9Electron.argv.w || js9Electron.argv.webpage || process.env.JS9_WEBPAGE || js9Electron.defpage;
js9Electron.width = js9Electron.argv.width || 1024;
js9Electron.height = js9Electron.argv.height  || 768;
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

// start up the helper first, if necessary
if( js9Electron.doHelper ){
    // look for a node JS9 helper already running
    ps.lookup({
	command: 'node',
	psargs: "guwax",
	arguments: 'js9Helper.js'
    }, function(err, rlist ) {
	// if node JS9 helper is not running, look for an Electron JS9 helper
	if( rlist.length === 0 ){
	    ps.lookup({
		psargs: "guwax",
		arguments: 'js9Electron.js'
	    }, function(err2, rlist2 ) {
		if( rlist2.length <= 1 ){
		    js9Electron.helperPath = "./js9Helper.js";
		    js9Electron.helper = require(js9Electron.helperPath);
		}
	    });
	}
    });
}

function createWindow() {
    let cmd, ncmd, nfile;
    // create the browser window
    js9Electron.win = new BrowserWindow({
	webPreferences: { nodeIntegration: false },
	width: js9Electron.width, 
	height: js9Electron.height
    });
    // and load the web page
    if( !js9Electron.page.includes("://") ){
	js9Electron.page = "file://" + js9Electron.page;
    }
    js9Electron.win.loadURL(js9Electron.page);
    // open the DevTools, if necessary
    if( js9Electron.debug ){
	js9Electron.win.webContents.openDevTools({mode: 'detach'});
    }
    // inject flag to indicate we are in Electron.js
    cmd = "window.isElectron = true;";
    js9Electron.win.webContents.executeJavaScript(cmd);
    // disable eval in renderer window
    // http://electron.atom.io/docs/tutorial/security/
    cmd = "window.eval = function(){throw new Error('For security reasons, Desktop JS9 does not support window.eval()');}";
    // make sure JS9 loaded properly
    js9Electron.win.webContents.executeJavaScript(cmd);
    cmd = "if( typeof JS9 !== 'object' || typeof JS9.Image !== 'function'  ){alert('JS9 was not loaded properly. Please check the paths to the JS9 css and js files in your web page header and try again.');}";
    js9Electron.win.webContents.executeJavaScript(cmd);
    // load data files
    cmd = "$(document).on('JS9:ready', function(){";
    ncmd = 0;
    for(let i=0; i<js9Electron.files.length; i++){
	let file = js9Electron.files[i];
	const jobj = js9Electron.files[i+1];
	// relative data paths must be relative to js9Electron.js script
	if( !file.match(/^https?:\/\//) && !path.isAbsolute(file) ){
	    // cfitsio can have trouble with special characters in pathnnames
	    // (such as parentheses), so this hack allows you to make a link
	    // to a troublesome path and use that link in your filename ...
	    // e.g. link "dropbox" to "Dropbox (Personal)" for those lucky
	    // enough to have Dropbox business accounts ...
	    if( process.env.PWD ){
		nfile = process.env.PWD + "/" + file;
	    } else {
		nfile = path.relative(__dirname, file);
	    }
	    if( nfile ){
		file = nfile;
	    }
	}
	if( jobj && jobj.startsWith('{') ){
	    i++;
	    cmd += `JS9.Load('${file}', '${jobj}');`;
	}  else {
	    cmd += `JS9.Load('${file}');`;
	}
	ncmd++;
    }
    if( ncmd ){
	cmd += '});';
	js9Electron.win.webContents.executeJavaScript(cmd);
    }
    // emitted when the window is closed
    js9Electron.win.on('closed', function () {
	// Dereference the window object, usually you would store windows
	// in an array if your app supports multi windows, this is the time
	// when you should delete the corresponding element.
	js9Electron.win = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// quit when all windows are closed
app.on('window-all-closed', () => {
    // quit the app
    app.quit();
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if( js9Electron.win === null ){
	createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

