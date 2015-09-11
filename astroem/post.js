/*jshint smarttabs:true */
/*jslint plusplus: true, vars: true, white: true, continue: true, unparam: true, regexp: true, browser: true, devel: true, nomen: true */
/*global Blob, ArrayBuffer, Uint8Array, Uint16Array, Int16Array, Int32Array, Float32Array, Float64Array, DataView, FileReader, Module, FS, ccall, _malloc, _free, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPF32, HEAPF64, setValue, getValue */

// use when running jslint
// "use strict";

Module['print'] = function(text) { console.log(text); };

Module['arrfile'] = function(filename, arr) {
  try{ FS.unlink("/" + filename); }
  catch(ignore){ }
  FS.createDataFile("/", filename, arr, true, true);
  return {path: filename, size: arr.byteLength};
};

Module['gzcompress'] = function(data) {
  var gzFile = ccall('gzopen', 'number', ['string', 'string'], ['output.gz', 'wb']);
  var buffer = _malloc(data.length);
  HEAPU8.set(data, buffer);
  ccall('gzwrite', 'number', ['number', 'number', 'number'], [gzFile, buffer, data.length]);
  ccall('gzclose', 'number', ['number'], [gzFile]);
  _free(buffer);
  var ret = new Uint8Array(FS.root.contents['output.gz'].contents);
  FS.unlink('output.gz');
  return ret;
};

Module['gzdecompress'] = function(data) {
  var BUFSIZE = 1024*1024;
  FS.createDataFile('/', 'input.gz', data, true, true);
  var gzFile = ccall('gzopen', 'number', ['string', 'string'], ['input.gz', 'rb']);
  var buffer = _malloc(BUFSIZE);
  var chunks = [];
  var total = 0;
  var len;
  var i, ret, curr;
  while( (len = ccall('gzread', 'number', ['number', 'number', 'number'], [gzFile, buffer, BUFSIZE])) > 0) {
    chunks.push(new Uint8Array(len));
    chunks[chunks.length-1].set(HEAPU8.subarray(buffer, buffer+len));
    total += len;
  }
  ccall('gzclose', 'number', ['number'], [gzFile]);
  FS.unlink('input.gz');
  _free(buffer);
  ret = new Uint8Array(total);
  curr = 0;
  for (i = 0; i < chunks.length; i++) {
    ret.set(chunks[i], curr);
    curr += chunks[i].length;
  }
  return ret;
};

Module["getFITSImage"] = function(fits, hdu, options, handler) {
    var i, ofptr, hptr, status, datalen;
    var buf, bufptr, buflen;
    var filter = null;
    var fptr = fits.fptr;
    var cens = [0, 0];
    var dims = [0, 0];
    var bin = 1;
    // clean up previous image section (but not the FITS file itself)
    if( hdu.fits ){
	Module["cleanupFITSFile"](hdu.fits, false);
    }
    // pre-processing
    switch(hdu.type){
    case 0:
	// image: nothing to do
	hdu.imtab = "image";
	ofptr = fptr;
	break;
    case 1:
    case 2:
	// ascii or binary tables: bin table to image
	hdu.imtab = "table";
	hdu.table = {};
	if( options && options.table ){
	    if( options.table.filter ){ filter = options.table.filter; }
	    if( options.table.cx ){ cens[0] = options.table.cx; }
	    if( options.table.cy ){ cens[1] = options.table.cy; }
	    if( options.table.nx ){ dims[0] = options.table.nx; }
	    if( options.table.ny ){ dims[1] = options.table.ny; }
	    if( options.table.bin ){ bin = options.table.bin; }
	}
	hptr = _malloc(28);
	setValue(hptr,    dims[0], 'i32');
	setValue(hptr+4,  dims[1], 'i32');
	setValue(hptr+8,  cens[0], 'double');
	setValue(hptr+16, cens[1], 'double');
	setValue(hptr+24, 0, 'i32');
	ofptr = ccall("filterTableToImage", "number",
        ["number", "string", "number", "number", "number", "number", "number"], 
        [fptr, filter, 0, hptr, hptr+8, bin, hptr+24]);
	hdu.table.nx = getValue(hptr,     'i32');
	hdu.table.ny = getValue(hptr+4,   'i32');
	hdu.table.cx = getValue(hptr+8,   'double');
	hdu.table.cy = getValue(hptr+16,  'double');
	hdu.table.bin = bin;
	hdu.table.filter = filter;
	status  = getValue(hptr+24, 'i32'); 
	_free(hptr);
	Module["errchk"](status);
	break;
    }
    // get entire image section
    hptr = _malloc(24);
    setValue(hptr,    0, 'i32');
    setValue(hptr+4,  0, 'i32');
    setValue(hptr+20, 0, 'i32');
    bufptr = ccall("getImageToArray", "number",
	["number", "number", "number", "number", "number", "number", "number"], 
	[ofptr, hptr, 0, hptr+8, hptr+12, hptr+16, hptr+20]);
    hdu.naxis1  = getValue(hptr+8, 'i32'); 
    hdu.naxis2  = getValue(hptr+12, 'i32'); 
    hdu.bitpix  = getValue(hptr+16, 'i32'); 
    status  = getValue(hptr+20, 'i32'); 
    _free(hptr);
    if( !bufptr ){
      Module["error"]("image is too large (max is JS9.globalOpts.maxMemory)");
    }
    Module["errchk"](status);
    // save pointer to section data
    datalen = hdu.naxis1 * hdu.naxis2;
    switch(hdu.bitpix){
    case 8:
	hdu.image = HEAPU8.subarray(bufptr, bufptr + datalen);
	break;
    case 16:
	hdu.image = HEAP16.subarray(bufptr/2, bufptr/2 + datalen);
	break;
    case -16:
	hdu.image = HEAPU16.subarray(bufptr/2, bufptr/2 + datalen);
	break;
    case 32:
	hdu.image = HEAP32.subarray(bufptr/4, bufptr/4 + datalen);
	break;
    case -32:
	hdu.image = HEAPF32.subarray(bufptr/4, bufptr/4 + datalen);
	break;
    case -64:
	hdu.image = HEAPF64.subarray(bufptr/8, bufptr/8 + datalen);
	break;
    }
    // get section header cards as a string
    hptr = _malloc(16);
    setValue(hptr+12, 0, 'i32');
    ccall("getHeaderToString", null,
	  ["number", "number", "number", "number"],
	  [ofptr, hptr, hptr+8, hptr+12]);
    hdu.ncard  = getValue(hptr+8, 'i32'); 
    bufptr = getValue(hptr, '*');
    buf = HEAPU8.subarray(bufptr, bufptr+(hdu.ncard*80));
    buflen = buf.byteLength;
    hdu.cardstr = "";
    for(i=0; i<buflen; i++){
	hdu.cardstr += String.fromCharCode(buf[i]);
    }
    status  = getValue(hptr+12, 'i32'); 
    _free(hptr);
    Module["errchk"](status);
    // close the image section "file"
    if( ofptr && (ofptr !== fptr) ){
        hptr = _malloc(4);
	setValue(hptr, 0, 'i32');
	ccall("closeFITSFile", null, 
	      ["number", "number"], 
	      [ofptr, hptr]);
	status  = getValue(hptr, 'i32'); 
	_free(hptr);
	Module["errchk"](status);
    }
    // set file name, if possible
    if( options.filename ){
	hdu.filename = options.filename;
    }
    // make up the fits object (used in cleanup)
    hdu.fits = {fptr: fptr, vname: hdu.vname, heap: hdu.image,
		cardstr: hdu.cardstr };
    // call the handler
    if( handler ){
	handler(hdu, options);
    } else {
	Module["error"]("no handler specified for this FITS file");
    }
};

Module["handleFITSFile"] = function(blob, options, handler) {
    var fptr, hptr, fitsname, status;
    var fileReader, arr;
    var hdu = {};
    // set up options and handler (might want to use defaults)
    options = options || {};
    handler = handler || Module["options"].handler;
    // convert blob into array
    fileReader = new FileReader();
    fileReader.onload = function() {
	// filename or assume gzip'ed file: cfitsio will do the right thing ...
	if( options.filename ){
	    // filename with extension to pass to cfitsio
	    fitsname = options.filename
		.replace(/^\.\.*/, "X")
		.replace(/\//g, "_")
	    // virtual file name without extension
	    hdu.vname = fitsname.replace(/\[.*\]/g, "");
	} else {
	    fitsname = "myblob.gz";
	    hdu.vname = fitsname;
	}
	// delete old version, ignoring errors
	try{ FS.unlink("/" + hdu.vname); }
	catch(ignore){ }
	// create a file in the emscripten virtual file system from the blob
	arr = new Uint8Array(this.result);
	try { FS.createDataFile("/", hdu.vname, arr, true, true); }
	catch(e){ Module["error"]("can't create virtual file: " + hdu.vname); }
	// open the virtual file as a FITS file
	hptr = _malloc(8);
	setValue(hptr+4, 0, 'i32');
	fptr = ccall("openFITSFile", "number",
		     ["string", "string", "number", "number"], 
		     [fitsname, options.extlist, hptr, hptr+4]);
	hdu.type = getValue(hptr,   'i32');
	status  = getValue(hptr+4, 'i32'); 
	_free(hptr);
	Module["errchk"](status);
	// extract image section and call handler
	Module["getFITSImage"]({fptr: fptr}, hdu, options, handler);
    };
    // this starts it all!
    fileReader.readAsArrayBuffer(blob);
};

Module["cleanupFITSFile"] = function(fits, all) {
    var hptr, status;
    // free up heap space from image section
    if( fits.heap ){
	Module._free(fits.heap);
    }
    // free up header card string
    if( fits.cardstr ){
	Module._free(fits.cardstr);
    }
    if( all ){
	// close FITS file
	hptr = _malloc(4);
	setValue(hptr, 0, 'i32');
	ccall("closeFITSFile", null, 
	      ["number", "number"],
	      [fits.fptr, hptr]);
	status  = getValue(hptr, 'i32'); 
	_free(hptr);
	Module["errchk"](status);
	// delete virtual FITS file
	try{ FS.unlink("/" + fits.vname); }
	catch(ignore){ }
    }
};

// set the amount of max memory for a FITS image
Module["maxFITSMemory"] = function(bytes) {
    bytes = bytes || 0;
    return ccall("maxFITSMemory", "number", ["number"], [bytes]);
};

// error handler
Module["errchk"] = function(status) {
    var i, c, hptr, bytes;
    var hlen = 32;  // ffgerr returns 30-byte string + null
    var s="ERROR from cfitsio.js: ";
    if( status ){
	hptr = _malloc(hlen);
	ccall("ffgerr", null, 
	      ["number", "number"],
	      [status, hptr]);
	bytes = HEAPU8.subarray(hptr, hptr+hlen);
	for(i=0; i<hlen; i++){
            c = String.fromCharCode(bytes[i]);
	    s += c;
	}
	_free(hptr);
	Module["error"](s);
    }
};

// error handler
Module["error"] = function(s, e) {
    if( Module["options"].error ){
	Module["options"].error(s, e);
    } else {
	throw new Error(s);
    }
};

Module["options"] = {"library": "cfitsio"};
