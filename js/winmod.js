// fix to allow jquery to be loaded into an electron.js app
// http://electron.atom.io/docs/faq/
//
// Due to the Node.js integration of Electron, there are some extra
// symbols inserted into the DOM like module, exports, require. This
// causes problems for some libraries since they want to insert the
// symbols with the same names.
//
// The electron solution does not work for JS9, since some plugins use require.
//
// So we use this solution:
//
// http://stackoverflow.com/questions/32621988/electron-jquery-is-not-defined
// https://github.com/electron/electron/issues/254#issuecomment-183483641

if (typeof module === 'object') {window.module = module; module = undefined;}
