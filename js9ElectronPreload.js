// signal that we are in Electron, rather than the web
window.isElectron = true;
window.currentDir = process.cwd();
// allow communication back to the renderer
window.electronIPC = require('electron').ipcRenderer;

