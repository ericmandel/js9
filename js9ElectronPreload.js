/* global require process */

// context isolation will soon be mandatory ... and requires contextBridge
// https://www.electronjs.org/docs/tutorial/context-isolation
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld(
  'electron',
    {
	// electron version
	version: process.versions.electron,
	// info about this Electron instance
	currentDir: process.cwd(),
	// flag if we are using a helper
	helper: process.env.JS9_ELECTRONHELPER === "true" ? true : false,
	// allow communication back to the renderer
	sendMsg: (opts) => require('electron').ipcRenderer.send("msg", opts),
	// whether multiple instances of the app are running
	multiElectron: process.env.JS9_MULTIELECTRON === "true" ? true : false
    }
);
