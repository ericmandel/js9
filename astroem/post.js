/*global Blob, Uint8Array, FileReader, Module, FS, ccall, _malloc, _free, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPF32, HEAPF64, setValue, getValue, Pointer_stringify */

/* eslint-disable dot-notation */

// eslint-disable-next-line no-console
Module["print"] = function(text) { console.log(text); };

Module["rootdir"] = "/";

Module["vfile"] = function(filename, buf, canOwn) {
  var size;
  // two args: create a virtual file
  if( buf ){
    try{ FS.unlink(Module["rootdir"] + filename); }
    catch(ignore){ }
    FS.createDataFile(Module["rootdir"], filename, buf, true, true, canOwn);
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
  }
  // one arg: return contents of an existing file
  return FS.readFile(Module["rootdir"] + filename, {encoding: "binary"});
};

Module["vsize"] = function(filename) {
  var buf = {size: -1};
  try{ buf = FS.stat(Module["rootdir"] + filename); }
  catch(ignore){ }
  return buf.size;
};

Module["vunlink"] = function(filename) {
  try{ FS.unlink(Module["rootdir"] + filename); }
  catch(ignore){ }
};

// legacy routine used by fitsy
Module["arrfile"] = function(filename, arr) {
  Module["vunlink"](filename);
  FS.createDataFile(Module["rootdir"], filename, arr, true, true, false);
  return {path: filename, size: arr.byteLength};
};

Module["gzcompress"] = function(data) {
  var ret;
  var gzFile = ccall("gzopen", "number", ["string", "string"], ["output.gz", "wb"]);
  var buffer = _malloc(data.length);
  HEAPU8.set(data, buffer);
  ccall("gzwrite", "number", ["number", "number", "number"], [gzFile, buffer, data.length]);
  ccall("gzclose", "number", ["number"], [gzFile]);
  _free(buffer);
  ret = new Uint8Array(FS.root.contents["output.gz"].contents);
  FS.unlink("output.gz");
  return ret;
};

Module["gzdecompress"] = function(data, filename, canOwn) {
  var i, ret, curr, len, gzFile;
  var BUFSIZE = 1024*1024;
  var buffer = _malloc(BUFSIZE);
  var chunks = [];
  var total = 0;
  FS.createDataFile(Module["rootdir"], "input.gz", data, true, true, false);
  gzFile = ccall("gzopen", "number", ["string", "string"], ["input.gz", "rb"]);
  // eslint-disable-next-line no-constant-condition
  while( true ){
    len = ccall("gzread", "number",
		["number", "number", "number"], [gzFile, buffer, BUFSIZE]);
    if( len <= 0 ){ break; }
    chunks.push(new Uint8Array(len));
    chunks[chunks.length-1].set(HEAPU8.subarray(buffer, buffer+len));
    total += len;
  }
  ccall("gzclose", "number", ["number"], [gzFile]);
  FS.unlink("input.gz");
  _free(buffer);
  ret = new Uint8Array(total);
  curr = 0;
  for (i = 0; i < chunks.length; i++) {
    ret.set(chunks[i], curr);
    curr += chunks[i].length;
  }
  if( filename ){
    Module["vfile"](filename, ret, canOwn);
  }
  return ret;
};

Module["bz2decompress"] = function(data, filename, canOwn) {
  var i, ret, curr, len, bz2File;
  var BUFSIZE = 1024*1024;
  var buffer = _malloc(BUFSIZE);
  var chunks = [];
  var total = 0;
  FS.createDataFile(Module["rootdir"], "input.bz2", data, true, true, false);
  bz2File = ccall("BZ2_bzopen", "number", ["string", "string"], ["input.bz2", "rb"]);
  // eslint-disable-next-line no-constant-condition
  while( true ){
    len = ccall("BZ2_bzread", "number",
		["number", "number", "number"], [bz2File, buffer, BUFSIZE]);
    if( len <= 0 ){ break; }
    chunks.push(new Uint8Array(len));
    chunks[chunks.length-1].set(HEAPU8.subarray(buffer, buffer+len));
    total += len;
  }
  ccall("BZ2_bzclose", "number", ["number"], [bz2File]);
  FS.unlink("input.bz2");
  _free(buffer);
  ret = new Uint8Array(total);
  curr = 0;
  for (i = 0; i < chunks.length; i++) {
    ret.set(chunks[i], curr);
    curr += chunks[i].length;
  }
  if( filename ){
    Module["vfile"](filename, ret, canOwn);
  }
  return ret;
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

// get immage from an already-opened virtual FITS file
// fits object contains fptr
Module["getFITSImage"] = function(fits, hdu, opts, handler) {
    var i, ofptr, hptr, status, datalen, extnum, extname;
    var buf, bufptr, buflen, bufptr2, slice, doerr, ctype1;
    var filter = null;
    var fptr = fits.fptr;
    var cens = [0, 0];
    var dims = [0, 0];
    var bin = 1;
    // opts is optional
    opts = opts || {};
    // make sure we have valid vfile, opened by cfitsio
    if( !fptr ){
      Module["error"]("virtual FITS file is missing for getFITSImage()");
    }
    // are we changing extensions on an existing virtual file?
    if( typeof opts.extension === "string" ){
	// look for extension with specified name
	hptr = _malloc(4);
	setValue(hptr, 0, "i32");
	ccall("ffmnhd", null,
	      ["number", "number", "string", "number", "number"],
	      [fptr, -1, opts.extension, 0, hptr]);
	status  = getValue(hptr, "i32");
	_free(hptr);
	Module["errchk"](status);
	// get type of extension (image or table)
	hptr = _malloc(8);
	setValue(hptr+4, 0, "i32");
	ccall("ffghdt", null,
	      ["number", "number", "number"],
	      [fptr, hptr, hptr+4]);
	hdu.type = getValue(hptr,   "i32");
	status  = getValue(hptr+4, "i32");
	_free(hptr);
	Module["errchk"](status);
    } else if( typeof opts.extension === "number" ){
	// go to extension number
	hptr = _malloc(8);
	setValue(hptr+4, 0, "i32");
	ccall("ffmahd", null,
	      ["number", "number", "number", "number"],
	      [fptr, opts.extension + 1, hptr, hptr+4]);
	hdu.type = getValue(hptr,   "i32");
	status  = getValue(hptr+4, "i32");
	_free(hptr);
	Module["errchk"](status);
    }
    // get hdu type
    hptr = _malloc(8);
    setValue(hptr+4, 0, "i32");
    ccall("ffghdt", null,
	  ["number", "number", "number"],
	  [fptr, hptr, hptr+4]);
    hdu.type = getValue(hptr,   "i32");
    _free(hptr);
    Module["errchk"](status);
    // get extension number and name (of original data)
    hptr = _malloc(4);
    ccall("ffghdn", null, ["number", "number"], [fptr, hptr]);
    extnum  = getValue(hptr, "i32") - 1;
    _free(hptr);
    // try to get extname (ignore errors)
    hptr = _malloc(86);
    setValue(hptr+82, 0, "i32");
    ccall("ffgky", null, ["number", "number", "string", "number", "number", "number"], [fptr, 16, "EXTNAME", hptr, 0, hptr+82]);
    status  = getValue(hptr+82, "i32");
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
	hptr = _malloc(28);
	if( opts.table ){
	    if( opts.table.filter ){ filter = opts.table.filter; }
	    if( opts.table.bin ){ bin = opts.table.bin; }
	    // backward compatibity with pre-v1.12 globals
            if( opts.table.nx ){ dims[0] = opts.table.nx; }
            if( opts.table.ny ){ dims[1] = opts.table.ny; }
            if( opts.table.cx ){ cens[0] = opts.table.cx; }
            if( opts.table.cy ){ cens[1] = opts.table.cy; }
	    // global defaults from fits.options
	    if( opts.table.xdim ){ dims[0] = opts.table.xdim; }
	    if( opts.table.ydim ){ dims[1] = opts.table.ydim; }
	    if( opts.table.xcen ){ cens[0] = opts.table.xcen; }
	    if( opts.table.ycen ){ cens[1] = opts.table.ycen; }
	}
	// overridden by options passed in this call
	if( opts.xdim ){ dims[0] = opts.xdim; }
	if( opts.ydim ){ dims[1] = opts.ydim; }
	if( opts.xcen ){ cens[0] = opts.xcen; }
	if( opts.ycen ){ cens[1] = opts.ycen; }
	if( opts.filter ){ filter = opts.filter; }
	if( opts.bin ){ bin = opts.bin; }
	setValue(hptr,    dims[0], "i32");
	setValue(hptr+4,  dims[1], "i32");
	// use center to generate image
	setValue(hptr+8,  cens[0], "double");
	setValue(hptr+16, cens[1], "double");
	// clear return status
	setValue(hptr+24, 0, "i32");
	// filter an event file and generate an image
	doerr = false;
	try{
	    ofptr = ccall("filterTableToImage", "number",
            ["number", "string", "number", "number", "number", "number",
	     "number"],
	    [fptr, filter, 0, hptr, hptr+8, bin, hptr+24]);
	}
	catch(e){
	    doerr = true;
	}
	// return values
	hdu.table.xdim = getValue(hptr,     "i32");
	hdu.table.ydim = getValue(hptr+4,   "i32");
	hdu.table.xcen = getValue(hptr+8,   "double");
	hdu.table.ycen = getValue(hptr+16,  "double");
	hdu.table.bin = bin;
	hdu.table.filter = filter;
	status  = getValue(hptr+24, "i32");
	_free(hptr);
	Module["errchk"](status);
	if( !ofptr || doerr ){
	    Module["error"]("can't convert table to image (image too large?)");
	}
	// try to get CTYPE1 to check for HEALPix (ignore errors)
	hptr = _malloc(86);
	setValue(hptr+82, 0, "i32");
	ccall("ffgky", null, ["number", "number", "string", "number", "number", "number"], [ofptr, 16, "CTYPE1", hptr, 0, hptr+82]);
	status  = getValue(hptr+82, "i32");
	if( status === 0 ){
	    ctype1 = Pointer_stringify(hptr)
		.replace(/^'/,"").replace(/'$/,"").trim();
	}
	_free(hptr);
	if( !ctype1 || !ctype1.match(/\-\-HPX/i) ){
	    // if we don't have a HEALPix image, we clear cens and dims
	    // to extract at center of resulting image (below)
	    delete opts.xcen;
	    delete opts.ycen;
	    delete opts.xdim;
	    delete opts.ydim;
	    delete opts.bin;
	    // reset dim and cen values
	    dims[0] = 0;
	    dims[1] = 0;
	    cens[0] = 0;
	    cens[1] = 0;
	    bin = 1;
	}
	break;
    }
    if( opts.image ){
	// backward-compatibility with pre-v1.12
	if( opts.image.xmax ){ dims[0] = opts.image.xmax; }
	if( opts.image.ymax ){ dims[1] = opts.image.ymax; }
	// global defaults from fits.options
	if( opts.image.xdim ){ dims[0] = opts.image.xdim; }
	if( opts.image.ydim ){ dims[1] = opts.image.ydim; }
    }
    // overridden by options passed in this call
    if( opts.bin ) { bin = opts.bin; }
    if( opts.xdim ){ dims[0] = opts.xdim; }
    if( opts.ydim ){ dims[1] = opts.ydim; }
    if( opts.xcen ){ cens[0] = opts.xcen; }
    if( opts.ycen ){ cens[1] = opts.ycen; }
    // limits on image section
    hptr = _malloc(48);
    setValue(hptr,    dims[0], "i32");
    setValue(hptr+4,  dims[1], "i32");
    setValue(hptr+8,  cens[0], "double");
    setValue(hptr+16, cens[1], "double");
    // clear return status
    setValue(hptr+44, 0, "i32");
    // might want a slice
    slice = opts.slice || "";
    // get array from image file
    doerr = false;
    try{
	bufptr = ccall("getImageToArray", "number",
	["number", "number", "number", "number", "string", "number",
	 "number", "number", "number"],
	[ofptr, hptr, hptr+8, bin, slice, hptr+24, hptr+32, hptr+40, hptr+44]);
    }
    catch(e){
	doerr = true;
    }
    // return the section values so caller can update LTM/LTV
    // we don't want to update the FITS file itself, since it hasn't changed
    hdu.bin = bin;
    hdu.x1  = getValue(hptr+24, "i32");
    hdu.y1  = getValue(hptr+28, "i32");
    hdu.x2  = getValue(hptr+32, "i32");
    hdu.y2  = getValue(hptr+36, "i32");
    hdu.naxis1  = Math.floor((hdu.x2 - hdu.x1) / bin + 1);
    hdu.naxis2  = Math.floor((hdu.y2 - hdu.y1) / bin + 1);
    hdu.bitpix  = getValue(hptr+40, "i32");
    // pass along filter, even if we did not use it
    if( opts.filter ){ hdu.filter = opts.filter; }
    status  = getValue(hptr+44, "i32");
    _free(hptr);
    Module["errchk"](status);
    if( !bufptr || doerr ){
      Module["error"]("can't convert image to array (image too large?)");
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
    hptr = _malloc(20);
    setValue(hptr+12, 0, "i32");
    ccall("getHeaderToString", null,
	  ["number", "number", "number", "number"],
	  [ofptr, hptr, hptr+8, hptr+12]);
    hdu.ncard  = getValue(hptr+8, "i32");
    bufptr2 = getValue(hptr, "*");
    buf = HEAPU8.subarray(bufptr2, bufptr2+(hdu.ncard*80));
    buflen = buf.byteLength;
    hdu.cardstr = "";
    for(i=0; i<buflen; i++){
	hdu.cardstr += String.fromCharCode(buf[i]);
    }
    // free string allocated in getHeaderToString()
    setValue(hptr+16, 0, "i32");
    ccall("fffree", null, ["number", "number"], [bufptr2, hptr+16]);
    // ignore error on free
    // status  = getValue(hptr+16, "i32");
    // Module["errchk"](status);
    // this is the returned status from getHeaderToString()
    status  = getValue(hptr+12, "i32");
    _free(hptr);
    // error check on getHeaderToString()
    Module["errchk"](status);
    // close the image section "file"
    if( ofptr && (ofptr !== fptr) ){
        hptr = _malloc(4);
	setValue(hptr, 0, "i32");
	ccall("closeFITSFile", null, ["number", "number"], [ofptr, hptr]);
	status  = getValue(hptr, "i32");
	_free(hptr);
	Module["errchk"](status);
    }
    // set file name, if possible
    if( opts.filename ){
	hdu.filename = opts.filename;
    }
    // make up the return fits object
    hdu.fits = {fptr: fptr, vfile: hdu.vfile, heap: bufptr,
		cardstr: hdu.cardstr, extnum: extnum, extname: extname };
    // call the handler
    if( handler ){
	handler(hdu, opts);
    } else {
	Module["error"]("no handler specified for this FITS file");
    }
};

// read a blob as a FITS file
// open an existing virtual FITS file (e.g. created by Montage reprojection)
Module["handleFITSFile"] = function(fits, opts, handler) {
    var fptr, hptr, status, fileReader;
    var hdu = {};
    // opts is optional
    opts = opts || {};
    handler = handler || Module["options"].handler;
    // blob: turn blob into virtual file, the open with cfitsio
    if( fits instanceof Blob ){
	// convert blob into array
	fileReader = new FileReader();
	fileReader.onload = function() {
	    var fitsname, arr;
	    // eslint-disable-next-line no-unused-vars
	    var narr;
	    // file name might be in the blob itself
	    if( !opts.filename && fits.name ){
		opts.filename = fits.name;
	    }
	    // filename or assume gzip'ed: cfitsio will do the right thing ...
	    if( opts.filename ){
		// filename with extension to pass to cfitsio
		fitsname = opts.filename
		    .replace(/^\.\.*/, "X")
		    .replace(/\//g, "__");
		// virtual file name without extension
		hdu.vfile = fitsname.replace(/\[.*\]/g, "");
	    } else {
		fitsname = "myblob.gz";
		hdu.vfile = fitsname;
	    }
	    // delete old version, ignoring errors
	    Module["vunlink"](hdu.vfile);
	    // create a file in the emscripten virtual file system from the blob
	    arr = new Uint8Array(fileReader.result);
	    // make a virtual file
	    if( (arr[0] === 0x1f) && (arr[1] === 0x8B) ){
		// if original is gzip'ed, unzip to virtual file
		hdu.vfile = hdu.vfile.replace(/\.gz$/,"");
		fitsname = fitsname.replace(/\.gz/,"");
		try{
		    narr = Module["gzdecompress"](arr, hdu.vfile, false);
		}
		catch(e){
		    Module["error"]("can't gunzip to virtual file: "+hdu.vfile);
		}
	    } else if((arr[0] === 0x42) && (arr[1] === 0x5A) && (arr[2] === 0x68)){
		// if original is bzip2'ed, bunzip2 to virtual file
		hdu.vfile = hdu.vfile.replace(/\.bz2$/,"");
		fitsname = fitsname.replace(/\.bz2/,"");
		try{
		    narr = Module["bz2decompress"](arr, hdu.vfile, false);
		}
		catch(e){
		   Module["error"]("can't bunzip2 to virtual file: "+hdu.vfile);
		}
	    } else {
		// regular file to virtual file
		try{
		    Module["vfile"](hdu.vfile, arr, false);
		}
		catch(e){
		    Module["error"]("can't create virtual file: "+hdu.vfile);
		}
	    }
	    // open the virtual file as a FITS file
	    hptr = _malloc(8);
	    setValue(hptr+4, 0, "i32");
	    fptr = ccall("openFITSFile", "number",
			 ["string", "number", "string", "number", "number"],
			 [fitsname, 0, opts.extlist, hptr, hptr+4]);
	    hdu.type = getValue(hptr,   "i32");
	    status  = getValue(hptr+4, "i32");
	    _free(hptr);
	    Module["errchk"](status);
	    // save current extension number
	    hptr = _malloc(4);
	    ccall("ffghdn", null,
		  ["number", "number"],
		  [fptr, hptr]);
	    hdu.extnum = getValue(hptr,   "i32") - 1;
	    _free(hptr);
	    // extract image section and call handler
	    Module["getFITSImage"]({fptr: fptr}, hdu, opts, handler);
	    // hints to the GC; for problems with fileReaders and GC, see:
	    //http://stackoverflow.com/questions/32102361/filereader-memory-leak
	    // this seems to make a difference:
	    delete fileReader.result;
	    // but these don't seem to have any effect:
	    arr = null;
	    narr = null;
	};
	// eslint-disable-next-line no-unused-vars
	fileReader.onerror = function(e) {
	    Module["error"]("fileReader could not read blob as a FITS file", e);
	};
	// eslint-disable-next-line no-unused-vars
	fileReader.onabort = function(e) {
	    Module["error"]("fileReader did not read blob as a FITS file", e);
	};
	// this starts it all!
	fileReader.readAsArrayBuffer(fits);
    } else if( typeof fits === "string" ){
	// open existing virtual file as a FITS file
	if( !fits ){
	    Module["error"]("FITS file name not specified");
	}
	hdu.vfile = fits;
	hptr = _malloc(8);
	setValue(hptr+4, 0, "i32");
	fptr = ccall("openFITSFile", "number",
		     ["string", "number", "string", "number", "number"],
		     [fits, 0, opts.extlist, hptr, hptr+4]);
	hdu.type = getValue(hptr,   "i32");
	status  = getValue(hptr+4, "i32");
	_free(hptr);
	Module["errchk"](status);
	// extract image section and call handler
	Module["getFITSImage"]({fptr: fptr}, hdu, opts, handler);
    } else {
	Module["error"]("invalid fits input for handleFITSFile");
    }
};

Module["cleanupFITSFile"] = function(fits, all) {
    var hptr;
    // var status;
    // sanity check
    if( !fits ){
	return;
    }
    // free up heap space from image section
    if( fits.heap ){
	_free(fits.heap);
	fits.heap = null;
    }
    // free up header card string
    if( fits.cardstr ){
	_free(fits.cardstr);
	fits.cardstr = null;
    }
    if( all ){
	// close FITS file
	if( fits.fptr ){
	    hptr = _malloc(4);
	    setValue(hptr, 0, "i32");
	    ccall("closeFITSFile", null,
		  ["number", "number"], [fits.fptr, hptr]);
	    // status  = getValue(hptr, "i32");
	    _free(hptr);
	    // Module["errchk"](status);
	    fits.fptr = null;
	}
	// delete virtual FITS file
	if( fits.vfile ){
	    Module["vunlink"](fits.vfile);
	}
    }
};

// set the amount of max memory for a FITS image
Module["maxFITSMemory"] = function(bytes) {
    bytes = bytes || 0;
    return ccall("maxFITSMemory", "number", ["number"], [bytes]);
};

Module["options"] = {"library": "cfitsio"};
