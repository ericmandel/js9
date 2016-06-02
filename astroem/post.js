/*jshint smarttabs:true, sub:true */
/*jslint plusplus: true, vars: true, white: true, continue: true, unparam: true, regexp: true, browser: true, devel: true, nomen: true */
/*global Blob, ArrayBuffer, Uint8Array, Uint16Array, Int16Array, Int32Array, Float32Array, Float64Array, DataView, FileReader, Module, FS, ccall, _malloc, _free, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPF32, HEAPF64, setValue, getValue, Pointer_stringify */

// use when running jslint
// "use strict";

Module['print'] = function(text) { console.log(text); };

Module['rootdir'] = "/";

Module['vfile'] = function(filename, buf) {
  var size;
  try{ FS.unlink(Module['rootdir'] + filename); }
  catch(ignore){ }
  FS.createDataFile(Module['rootdir'], filename, buf, true, true);
  if( buf.length !== undefined ){
      size = buf.length;
  } else if( buf.byteLength !== undefined ){
      size = buf.byteLength;
  } else if( buf.size !== undefined ){
      size = buf.size;
  } else {
      size = -1;
  }
  return {path: filename, size: size};
};

Module['vunlink'] = function(filename) {
  try{ FS.unlink(Module['rootdir'] + filename); }
  catch(ignore){ }
};

// legacy routine used by fitsy
Module['arrfile'] = function(filename, arr) {
  try{ FS.unlink(Module['rootdir'] + filename); }
  catch(ignore){ }
  FS.createDataFile(Module['rootdir'], filename, arr, true, true);
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
  FS.createDataFile(Module['rootdir'], 'input.gz', data, true, true);
  var gzFile = ccall('gzopen', 'number', ['string', 'string'], ['input.gz', 'rb']);
  var buffer = _malloc(BUFSIZE);
  var chunks = [];
  var total = 0;
  var len;
  var i, ret, curr;
  while ( true ){
    len = ccall('gzread', 'number',
		['number', 'number', 'number'], [gzFile, buffer, BUFSIZE]);
    if( len <= 0 ){ break; }
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
    var i, ofptr, hptr, status, datalen, extnum, extname;
    var buf, bufptr, buflen, bufptr2, slice;
    var filter = null;
    var fptr = fits.fptr;
    var cens = [0, 0];
    var dims = [0, 0];
    var bin = 1;
    // clean up previous image section (but not the FITS file itself)
    if( hdu.fits ){
	Module["cleanupFITSFile"](hdu.fits, false);
    }
    // default hdu type is image
    hdu.type = hdu.type || 0;
    // get extension number and name (of original data)
    hptr = _malloc(4);
    ccall("ffghdn", null, ["number", "number"], [fptr, hptr]);
    extnum  = getValue(hptr, 'i32') - 1;
    _free(hptr);
    // try to get extname (ignore errors)
    hptr = _malloc(86);
    setValue(hptr+82, 0, 'i32');
    ccall("ffgky", null, ["number", "number", "string", "number", "number", "number"], [fptr, 16, "EXTNAME", hptr, 0, hptr+82]);
    status  = getValue(hptr+82, 'i32');
    if( status === 0 ){
	extname = Pointer_stringify(hptr)
	          .replace(/^'/,"").replace(/'$/,"").trim();
    } else {
	extname = "";
    }
    _free(hptr);
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
    // might want a slice
    slice = options.slice || "";
    bufptr = ccall("getImageToArray", "number",
	["number", "number", "number", "string", "number", "number", "number", "number"],
	[ofptr, hptr, 0, slice, hptr+8, hptr+12, hptr+16, hptr+20]);
    hdu.naxis1  = getValue(hptr+8, 'i32');
    hdu.naxis2  = getValue(hptr+12, 'i32');
    hdu.bitpix  = getValue(hptr+16, 'i32');
    status  = getValue(hptr+20, 'i32');
    _free(hptr);
    Module["errchk"](status);
    if( !bufptr ){
      Module["error"]("image is too large (max is JS9.globalOpts.maxMemory)");
    }
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
    bufptr2 = getValue(hptr, '*');
    buf = HEAPU8.subarray(bufptr2, bufptr2+(hdu.ncard*80));
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
	ccall("closeFITSFile", null, ["number", "number"], [ofptr, hptr]);
	status  = getValue(hptr, 'i32');
	_free(hptr);
	Module["errchk"](status);
    }
    // set file name, if possible
    if( options.filename ){
	hdu.filename = options.filename;
    }
    // make up the return fits object
    hdu.fits = {fptr: fptr, vfile: hdu.vfile, heap: bufptr,
		cardstr: hdu.cardstr, extnum: extnum, extname: extname };
    // call the handler
    if( handler ){
	handler(hdu, options);
    } else {
	Module["error"]("no handler specified for this FITS file");
    }
};

Module["handleFITSFile"] = function(fits, options, handler) {
    var fptr, hptr, fitsname, status;
    var fileReader, arr;
    var hdu = {};
    // set up options and handler (might want to use defaults)
    options = options || {};
    handler = handler || Module["options"].handler;
    // blob: turn blob into virtual file, the open with cfitsio
    if( fits instanceof Blob ){
	// convert blob into array
	fileReader = new FileReader();
	fileReader.onload = function() {
	    // filename or assume gzip'ed: cfitsio will do the right thing ...
	    if( options.filename ){
		// filename with extension to pass to cfitsio
		fitsname = options.filename
		.replace(/^\.\.*/, "X")
		.replace(/\//g, "__");
		// virtual file name without extension
		hdu.vfile = fitsname.replace(/\[.*\]/g, "");
	    } else {
		fitsname = "myblob.gz";
		hdu.vfile = fitsname;
	    }
	    // delete old version, ignoring errors
	    try{ FS.unlink(Module['rootdir'] + hdu.vfile); }
	    catch(ignore){ }
	    // create a file in the emscripten virtual file system from the blob
	    arr = new Uint8Array(this.result);
	    try { FS.createDataFile(Module['rootdir'], hdu.vfile, arr, true, true); }
	    catch(e){
		Module["error"]("can't create virtual file: "+hdu.vfile);
	    }
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
	    // save current extension number
	    hptr = _malloc(4);
	    ccall("ffghdn", null,
		  ["number", "number"],
		  [fptr, hptr]);
	    hdu.extnum = getValue(hptr,   'i32') - 1;
	    _free(hptr);
	    // extract image section and call handler
	    Module["getFITSImage"]({fptr: fptr}, hdu, options, handler);
	};
	fileReader.onerror = function(e) {
	    Module["error"]("fileReader could not read blob as a FITS file");
	};
	fileReader.onabort = function(e) {
	    Module["error"]("fileReader did not read blob as a FITS file");
	};
	// this starts it all!
	fileReader.readAsArrayBuffer(fits);
    } else if( typeof fits === "string" ){
	// are we changing extensions on an existing virtual file?
	if( options.fptr ){
	    fptr = options.fptr;
	    if( options.vfile ){
		hdu.vfile = options.vfile;
	    }
	    if( options.extname ){
		// look for extension with specified name
		hptr = _malloc(4);
		setValue(hptr, 0, 'i32');
		ccall("ffmnhd", null,
		      ["number", "number", "string", "number", "number"],
		      [fptr, -1, options.extname, 0, hptr]);
		status  = getValue(hptr, 'i32');
		_free(hptr);
		Module["errchk"](status);
		// get type of extension (image or table)
		hptr = _malloc(8);
		setValue(hptr+4, 0, 'i32');
		ccall("ffghdt", null,
		      ["number", "number", "number"],
		      [fptr, hptr, hptr+4]);
		hdu.type = getValue(hptr,   'i32');
		status  = getValue(hptr+4, 'i32');
		_free(hptr);
		Module["errchk"](status);
	    } else if( options.extnum !== undefined ){
		// go to extension number
		hptr = _malloc(8);
		setValue(hptr+4, 0, 'i32');
		ccall("ffmahd", null,
		      ["number", "number", "number", "number"],
		      [fptr, options.extnum + 1, hptr, hptr+4]);
		hdu.type = getValue(hptr,   'i32');
		status  = getValue(hptr+4, 'i32');
		_free(hptr);
		Module["errchk"](status);
	    } else if( options.slice !== undefined ){
		hptr = _malloc(8);
		setValue(hptr+4, 0, 'i32');
		ccall("ffghdt", null,
		      ["number", "number", "number"],
		      [fptr, hptr, hptr+4]);
		hdu.type = getValue(hptr,   'i32');
		_free(hptr);
		Module["errchk"](status);
	    } else {
		Module["error"]("missing extname/extnum/slice for FITS file");
	    }
	} else {
	    // open existing virtual file as a FITS file
	    if( !fits ){
		Module["error"]("FITS file name not specified");
	    }
	    hdu.vfile = fits;
	    hptr = _malloc(8);
	    setValue(hptr+4, 0, 'i32');
	    fptr = ccall("openFITSFile", "number",
			 ["string", "string", "number", "number"],
			 [fits, options.extlist, hptr, hptr+4]);
	    hdu.type = getValue(hptr,   'i32');
	    status  = getValue(hptr+4, 'i32');
	    _free(hptr);
	    Module["errchk"](status);
	}
	// extract image section and call handler
	Module["getFITSImage"]({fptr: fptr}, hdu, options, handler);
    } else {
	Module["error"]("invalid fits input for handleFITSFile");
    }
};

Module["cleanupFITSFile"] = function(fits, all) {
    var hptr, status;
    // sanity check
    if( !fits ){
	return;
    }
    // free up heap space from image section
    if( fits.heap ){
	Module._free(fits.heap);
	fits.heap = null;
    }
    // free up header card string
    if( fits.cardstr ){
	Module._free(fits.cardstr);
	fits.cardstr = null;
    }
    if( all ){
	// close FITS file
	if( fits.fptr ){
	    hptr = _malloc(4);
	    setValue(hptr, 0, 'i32');
	    ccall("closeFITSFile", null,
		  ["number", "number"], [fits.fptr, hptr]);
	    status  = getValue(hptr, 'i32');
	    _free(hptr);
	    // Module["errchk"](status);
	    fits.fptr = null;
	}
	// delete virtual FITS file
	if( fits.vfile ){
	    try{ FS.unlink(Module['rootdir'] + fits.vfile); }
	    catch(ignore){ }
	}
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
    var hlen = 82;  // ffgerr returns 80-byte string + null
    var s="ERROR from cfitsio.js: ";
    if( status ){
	hptr = _malloc(hlen);
	ccall("ffgerr", null, ["number", "number"], [status, hptr]);
	bytes = HEAPU8.subarray(hptr, hptr+hlen);
	for(i=0; i<hlen; i++){
	    if( bytes[i] === 0 ){
		break;
	    }
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
	Module["options"].error(s, e, true);
    } else {
	throw new Error(s);
    }
};

Module["options"] = {"library": "cfitsio"};
