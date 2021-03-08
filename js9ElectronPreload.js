/* global */

// context isolation must be explicitly turned on because ...
// ... in 10.0.0, context isolation breaks wasm, so its turned off ...
if( process.env.JS9_CONTEXTISOLATION !== "true" ){

    window.electron = {
	// electron version
	version: process.versions.electron,
	// info about this Electron instance
	currentDir: process.cwd(),
	// flag if we are using a helper
	helper: process.env.JS9_ELECTRONHELPER === "true" ? true : false,
	// flag if we are in an app
	app: process.env.JS9_APP === "true" ? true : false,
	// allow communication back to the renderer
	sendMsg: (opts) => require("electron").ipcRenderer.send("msg", opts),
	// host file system mount
	hostFS: process.env.JS9_HOSTFS || "",
	// cmdline opts
	cmdlineOpts: process.env.JS9_CMDLINEOPTS || "",
	// whether multiple instances of the app are running
	multiElectron: process.env.JS9_MULTIELECTRON === "true" ? true : false,
	// whether js9 should attempt to resize itself
	resize: (process.env.JS9_WIDTH || process.env.JS9_HEIGHT) ?
	    {width: process.env.JS9_WIDTH, height: process.env.JS9_HEIGHT} :
	    false
    };

} else {

// context isolation will soon be the default ... and requires contextBridge
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
	// flag if we are in an app
	app: process.env.JS9_APP === "true" ? true : false,
	// allow communication back to the renderer
	sendMsg: (opts) => require("electron").ipcRenderer.send("msg", opts),
	// host file system mount
	hostFS: process.env.JS9_HOSTFS || "",
	// cmdline opts
	cmdlineOpts: process.env.JS9_CMDLINEOPTS || "",
	// whether multiple instances of the app are running
	multiElectron: process.env.JS9_MULTIELECTRON === "true" ? true : false,
	// whether js9 should attempt to resize itself
	resize: (process.env.JS9_WIDTH || process.env.JS9_HEIGHT) ?
	    {width: process.env.JS9_WIDTH, height: process.env.JS9_HEIGHT} :
	    false
    });

}
