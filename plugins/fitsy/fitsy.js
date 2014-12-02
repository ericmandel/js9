/*jslint evil: true, white: true, vars: true, plusplus: true, nomen: true, unparam: true, regexp: true, bitwise: true */
/*jshint node: true, -W099: true, laxbreak:true, laxcomma:true, multistr:true, smarttabs:true */
/*global $, alert, XMLHttpRequest
       , Uint8Array, Int8Array, Uint16Array, Int16Array, Int32Array, Uint32Array, Float32Array, Float64Array, DataView, ArrayBuffer
       , FileReader, Blob, Image, window, document
       , Zee, Astroem, Module, pako, LZMA, bzip2
 */

"use strict";

var Fitsy;
if( Fitsy && (typeof Fitsy !== "object" || Fitsy.NAME) ){
    throw new Error("Namespace 'Fitsy' already exists");
}

// Create our namespace, and specify some meta-information
Fitsy = {};
Fitsy.NAME = "Fitsy";		// The name of this namespace
Fitsy.VERSION = "1.0";		// The version of this namespace

Fitsy.clone = function (obj) {
    var copy, i, len, attr;

    // Handle the 3 simple types, and null or undefined
    if (null === obj || "object" !== typeof obj) { return obj; }

    // Handle Date
    if (obj instanceof Date) {
	copy = new Date();
	copy.setTime(obj.getTime());
	return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
	copy = [];
	for ( i = 0, len = obj.length; i < len; i++ ) {
	    copy[i] = Fitsy.clone(obj[i]);
	}
	return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
	copy = {};
	for ( attr in obj ) {
	    if ( obj.hasOwnProperty(attr) ) { copy[attr] = Fitsy.clone(obj[attr]); }
	}
	return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
};

Fitsy.strrepeat = function (pattern, count) {
    if ( count < 1 )  { return ''; }
    var result = '';
    while ( count > 1 ) {
	if (count & 1) { result += pattern; }

	count >>= 1;
	pattern += pattern;
    }
    return result + pattern;
};

// ArrayBuffer slice not yet available everywhere ... but it should be
if (!ArrayBuffer.prototype.slice) {
    ArrayBuffer.prototype.slice = function(start, end) {
	var i, result, resultArray;
        var that = new Uint8Array(this);
        if(end === undefined){
	    end = that.length;
	}
        result = new ArrayBuffer(end - start);
        resultArray = new Uint8Array(result);
        for(i = 0; i < resultArray.length; i++){
           resultArray[i] = that[i + start];
	}
        return result;
    };
}

// hostEndian: 'true' means little-endian (for use in typed array calls)
Fitsy.hostEndian = (function(){
    return new Int8Array(new Int32Array([1]).buffer)[0] === 1;
}());

// copy memory from one arraybuffer to another
Fitsy.memcpy = function(dst, dstOffset, src, srcOffset, length) {
  var dstU8 = new Uint8Array(dst, dstOffset, length);
  var srcU8 = new Uint8Array(src, srcOffset, length);
  dstU8.set(srcU8);
};

// getDataSlice -- get a slice of data from a File reader or an Arraybuffer
// memory optimization leads to not slicing arrays, but marking the limits
Fitsy.getDataSlice = function(fits, dtype, lo, hi, func, err){
    var chunk, totalget, totalgot, maxget, get, got, left, ptr, heapptr;
    var args = Array.prototype.slice.call(arguments, 6);
    switch(fits.ftype){
    case "file":
	if( func ){
	    fits.read.onloadend = function(){ 
		// convert to binary string, if necessary
		if( dtype === "asString" ){
		    fits.result = Fitsy.getBinaryString(fits.read.result);
		} else {
		    fits.result = fits.read.result;
		}
		func.apply(null, args);
	    };
	}
	if( err ){
	    fits.read.onerror   = function(){ err.apply(null, args); };
	}
	if( lo || hi ){
	    chunk = Fitsy.getFileSlice(fits.file, lo, hi);
	} else {
	    chunk = fits.file;
	}
	// always readAsArraybuffer because readAsBinaryString is not in IE11
	// binary string will be made, if necessary, after load is done
	fits.read.readAsArrayBuffer(chunk);
	break;
    case "array":
	if( dtype === "asString" ){
	    // for a binary string, a slice is OK (assumed to be small)
	    if( lo || hi ){
		chunk = fits.file.slice(lo, hi);
	    } else {
		// shouldn't happen!
		chunk = fits.file;
	    }
	    // mimick readAsBinaryString conversion
	    fits.result = Fitsy.getBinaryString(chunk);
	} else {
	    // we pass along the whole array
	    fits.result = fits.file;
	    if( lo && hi ){
		// avoid a new array.slice, it uses extra memory needlessly
		// instead just mark the limits and let func use these limits
		fits.rlo = lo;
		fits.rhi = hi;
	    } else {
		delete fits.rlo;
		delete fits.rhi;
	    }
	}
	if( func ){
	    func.apply(null, args);
	}
	break;
    case "gzarray":
	// seek to desired location
	if( lo !== fits.gz.here ){
	    Astroem.gzseek(fits.gz.fd, lo, 0);
	    fits.gz.here = lo;
	}
	// total number of bytes to retrieve
	totalget = hi - lo;
	// allocate space for retrieved data
	try{ chunk = new Uint8Array(totalget); }
	catch(e){ Fitsy.error("can't allocate enough memory to slice this FITS file", e); }
	// max we will retrieve at any one time (minimize precious heap space)
	maxget = Math.min(totalget, Fitsy.options.gzheapsize);
	// allocate space on emscripten heap
	ptr = Module._malloc(maxget);
	// pointer into heap space to pass into routine
	heapptr= new Uint8Array(Module.HEAPU8.buffer, ptr, maxget);
	// this is how much we have left to retrieve
	left = totalget;
	// nothing retrieved yet
	totalgot = 0;
	// processing loop ...
	while( left ){
	    // how much to retrieve on this iteration
	    get = Math.min(left, maxget);
	    // try to uncompress that amount
	    got = Astroem.gzread(fits.gz.fd, heapptr.byteOffset, get);
	    // if we got anything ...
	    if( got > 0 ){
		// copy new data in output buffer
		Fitsy.memcpy(chunk.buffer, totalgot, 
			     Module.HEAPU8.buffer, ptr, got);
		totalgot += got;
		left -= got;
	    } else {
		// we're done
		left = 0;
	    }
	}
	// free up heap space
	Module._free(heapptr.byteOffset);
	// mark where we are in the gzip file
	fits.gz.here = lo + totalgot;
	// see if we got anything
	if( totalgot > 0 ){
	    // convert to string
	    if( dtype === "asString" ){
		fits.result = Fitsy.getBinaryString(chunk);
	    } else {
		// return raw data buffer
		fits.result = chunk.buffer;
	    }
	} else {
	    // handle eof
	    fits.eof = true;
	}
	// call handler
	if( func ){
	    func.apply(null, args);
	}
	break;
    }
};

// convert arraybuffer into binary string
// akin to file.readAsBinaryString for ArrayBuffers
// but also used as a replacement for readAsBinaryString (it's not in IE11)
Fitsy.getBinaryString = function(buf){
    var s = String.fromCharCode.apply(null, new Uint8Array(buf));
    return s;
};

// generate a table column filter from a funtools-style expression
Fitsy.tableFilter = function(hdu, filter){
    var ft1=filter;
    // convert ranges:
    // pi = 100:200 -> (pi >= 100 && pi <= 200)
    ft1 = ft1.replace(/([a-zA-Z][a-zA-Z0-9_]*) *= *([\-]?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?) *: *([\-]?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?)/g, "($1 >= $2 && $1 <= $3)");
    // pi = 100: -> pi >= 100
    ft1 = ft1.replace(/([a-zA-Z][a-zA-Z0-9_]*) *= *([\-]?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?) *:/g, "$1 >= $2");
    // pi = :100 -> pi <= 100
    ft1 = ft1.replace(/([a-zA-Z][a-zA-Z0-9_]*) *= *:([\-]?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?)/g, "$1 <= $2");
    // lookup columns and return generated filter string
    return ft1.replace(/([ (&|+\-\/*%<>=]|^)?([a-zA-Z][a-zA-Z0-9_]*)([ )&|+\-\/*%<>=]|$)/g, function (m, delim1, key, delim2) {
	var s = key;
	var t = key.toUpperCase();
	delim1 = delim1 || "";
	delim2 = delim2 || "";
	if ( hdu.table[s] !== undefined ) { 
	    s = delim1 + "view.get" + hdu.table[s].type + "(vstart + i * {{table.width}} + " + hdu.table[s].offs + ")" + delim2;
	} else if ( hdu.table[t] !== undefined ) { 
	    s = delim1 + "view.get" + hdu.table[t].type + "(vstart + i * {{table.width}} + " + hdu.table[t].offs + ")" + delim2;
	} else {
	    // couldn't find column -- that's bad
	    Fitsy.error("the requested column '" + key + "' is missing from this FITS table");
	}
	return s;
    });
};

// there are different versions of file slicing ... with different syntax
Fitsy.getFileSlice = function(file, start, end){
    var blob;
    if( file.slice ){
        blob = file.slice(start, end);
    } else if( file.mozSlice ){
        blob = file.mozSlice(start, end);
    } else if( file.webkitSlice ){
        blob = file.webkitSlice(start, end);
    }
    return blob;
};

// return true if its a number (int or float)
Fitsy.isNumber = function(s) {
  return !isNaN(parseFloat(s)) && isFinite(s);
};

Fitsy.xtypeof = function(obj) {
        return Object.prototype.toString.call(obj).slice(8, -1);
};

// http://stackoverflow.com/questions/3885817/how-to-check-if-a-number-is-float-or-integer
Fitsy.isFloat = function(n) {
    return n === +n && n !== (n|0);
};

Fitsy.cardpars = function(card){
    var name, value;
    if ( card[8] !== "=" ){ 
	return undefined;
    }
    name = card.slice(0, 8).trim();
    value = card.slice(10).replace(/\'/g, " ").replace(/\/.*/, "").trim();
    if( value === "T" ){ 
	value = true;
    } else if( value === "F" ){
	value = false;
    } else if( Fitsy.isNumber(value) ){
	value = parseFloat(value);
    }

    return [name, value];
};

Fitsy.readImageHDUDataConverter = function(fits, hdu, options, handler){
    var dv, getfunc, setfunc, tval, i, off, scale, zero, memerr;
    var rstart = 0;
    var littleEndian;
    hdu.dmin = Number.MAX_VALUE;
    hdu.dmax = Number.MIN_VALUE;
    hdu.filename = fits.name;

    switch(fits.ftype){
    case "array":
	if( fits.rlo ){
	    // mark offsets into ArrayBuffer where this slice starts
	    rstart = fits.rlo;
	}
	break;
    }

    switch( hdu.bitpix ) {
     case   8:
	getfunc = DataView.prototype.getUint8;
	setfunc = DataView.prototype.setUint8;
	try{ hdu.filedata = new Uint8Array(fits.result, rstart); }
	catch(e){memerr = true;}
	break;
     case -16:
	getfunc = DataView.prototype.getUint16;
	setfunc = DataView.prototype.setUint16;
	try{hdu.filedata = new Uint16Array(fits.result, rstart);}
	catch(e){memerr = true;}
	break;
     case  16:
	if ( hdu.bzero && hdu.bzero === 32768 ) {
	    getfunc = DataView.prototype.getInt16;
	    setfunc = DataView.prototype.setUint16;
	    try{hdu.filedata = new Uint16Array(fits.result, rstart);}
	    catch(e){memerr = true;}
	    hdu.bitpix = -16;
	} else {
	    getfunc = DataView.prototype.getInt16;
	    setfunc = DataView.prototype.setInt16;
	    try{hdu.filedata = new Int16Array(fits.result, rstart);}
	    catch(e){memerr = true;}
	}
	break;
     case  32:
	getfunc = DataView.prototype.getInt32;
	setfunc = DataView.prototype.setInt32;
	try{hdu.filedata = new Int32Array(fits.result, rstart);}
	catch(e){memerr = true;}
	break;
     case -32:
	getfunc = DataView.prototype.getFloat32;
	setfunc = DataView.prototype.setFloat32;
	try{hdu.filedata = new Float32Array(fits.result, rstart);}
	catch(e){memerr = true;}
	break;
     case -64:
	getfunc = DataView.prototype.getFloat64;
	setfunc = DataView.prototype.setFloat64;
	try{hdu.filedata = new Float64Array(fits.result, rstart);}
	catch(e){memerr = true;}
	break;
    default:
	Fitsy.error("unsupported FITS BITPIX value: " + hdu.bitpix);
	break;
    }
    // process memory allocation errors
    if( memerr ){
	Fitsy.error("can't allocate enough memory for this FITS image");
    }
    // this is where the caller (e.g. JS9) sees the data
    hdu.image = hdu.filedata;

    zero = hdu.bzero || 0;
    scale = hdu.bscale || 1;

    // Convert raw bytes to image data using the appropriate data view
    //
    dv = new DataView(fits.result);
    littleEndian = hdu.converted ? Fitsy.hostEndian : false;
    for(i=0, off=rstart; i < hdu.datapixls; i++, off += hdu.pixlbytes) {
	tval = getfunc.call(dv, off, littleEndian) * scale + zero;
	if ( !isNaN(tval) ) {
	    hdu.dmin    = Math.min(hdu.dmin, tval);
	    hdu.dmax    = Math.max(hdu.dmax, tval);
	}
	if( !hdu.converted ){
	    setfunc.call(dv, off, tval, Fitsy.hostEndian);
	}
    }
    hdu.converted = true;

    handler(hdu, options);
};

Fitsy.readImageHDUData = function(fits, hdu, options, handler) {
    //    fits.read.onloadend = function() { Fitsy.readImageHDUDataConverter(fits, hdu, options, handler); };
    //    fits.read.readAsArrayBuffer(Fitsy.getFileSlice(fits.file, hdu.dataseek, hdu.dataseek + hdu.databloks*2880));
    Fitsy.getDataSlice(fits, "asArray", 
		       hdu.dataseek, hdu.dataseek + hdu.databloks*2880, 
		       Fitsy.readImageHDUDataConverter, Fitsy.readError,
		       fits, hdu, options, handler);

};

var TableTFORM = {
      L: { type: "UChar", 	size: 1 }
    , X: { type: "BITS", 	size: 1 }
    , B: { type: "UChar", 	size: 1 }
    , I: { type: "Int16", 	size: 2 }
    , J: { type: "Int32", 	size: 4 }
    , K: { type: "Int64", 	size: 8 }
    , A: { type: "Char", 	size: 1 }
    , E: { type: "Float32", 	size: 4 }
    , D: { type: "Float64", 	size: 8 }
    , C: { type: "Complex64", 	size: 8 }
    , M: { type: "Complex128", 	size:16 }
    , P: { type: "Pointer32", 	size: 8 }
    , Q: { type: "Pointer64", 	size:16 }
};

Fitsy.readError = function(e) {
    Fitsy.error("an error occurred while reading the FITS file. (Often this is due to the browser running out of memory.)", e);
};

// signal waiting or done waiting
Fitsy.waiting = function(mode){
    if( Fitsy.options.waiting ){
	Fitsy.options.waiting(mode);
    }
};

// error handler
Fitsy.error = function(s, e) {
    Fitsy.waiting(false);
    if( Fitsy.options.error ){
	Fitsy.options.error(s, e);
    } else {
	throw new Error(s);
    }
};

Fitsy.readForDeCompress = function(fits) {

    var data = new Uint8Array(fits.result);

    if ( data[0] === 0xfd && data[1] === 0x37 && data[2] === 0x7a && data[3] === 0x58 ) {	// lzip
	if ( window.LZMA !== undefined ) {

	    LZMA.decompress(data, function(result) {
		fits.file = new Blob([result]);

		// fits.read.onloadend = function(){ Fitsy.readHeaderBlock(fits); };
		// fits.read.onerror   = function(){ Fitsy.readError(fits); };
		// fits.read.readAsBinaryString(Fitsy.getFileSlice(fits.file, 0, 2880));
		Fitsy.getDataSlice(fits, "asString", 0, 2880, 
			       Fitsy.readHeaderBlock, Fitsy.readError,
			       fits);


	    });

	    return;
	}

	Fitsy.error("lzip support not available");
    } else if ( data[0] === 0x42 && data[1] === 0x5a ) {						// bzip2
	if ( window.bzip2 !== undefined  ) {
	    data = bzip2.simple(bzip2.array(data));
	    fits.file = new Blob(data);
	} else {
	    Fitsy.error("bzip2 support not available");
	}
    } else if ( data[0] === 0x1f && data[1] === 0x8B ) {						// gzip
	// we are done with these ... so tell garbage collector
	delete fits.file;
	delete fits.hdu;
	fits.hdu = [];
	if ( window.hasOwnProperty("Astroem") ) {
	    if( data.buffer.byteLength > Fitsy.options.gzfilesize ) {
		// new gzip array object
		fits.ftype = "gzarray";
		fits.gz = {};
		// temp file in the emscripten file system mapped to the data
		fits.gz.arrfile = Astroem.arrfile(fits.name, data);
		// open the gzip'ed file
		fits.gz.fd = Astroem.gzopen(fits.gz.arrfile.path, "rb");
		// reset file position
		fits.gz.here = 0;
		// don't know file size, we'll rely on eof
		fits.size = -1;
		fits.eof = false;
	    } else {
		data = Astroem.decompress(data);
		// fits.file = new Blob([data]);
		fits.ftype = "array";
		fits.file = data.buffer;
		fits.size = fits.file.byteLength;
	    }
	} else if ( window.hasOwnProperty("Zee") ) {
	    data = Zee.decompress(data);
	    // fits.file = new Blob([data]);
	    fits.ftype = "array";
	    fits.file = data.buffer;
	    fits.size = fits.file.byteLength;
	} else if ( window.hasOwnProperty("pako") ) {
	    data = pako.inflate(data);
	    // fits.file = new Blob([data]);
	    fits.ftype = "array";
	    fits.file = data.buffer;
	    fits.size = fits.file.byteLength;
	} else {
	    Fitsy.error("gzip support not available");
	}
    } else {

	Fitsy.error("not a recognized FITS file (compressed or otherwise): " + fits.name);

    }

    // fits.read.onloadend = function(){ Fitsy.readHeaderBlock(fits); };
    // fits.read.onerror   = function(){ Fitsy.readError(fits); };
    // fits.read.readAsBinaryString(Fitsy.getFileSlice(fits.file, 0, 2880));
    Fitsy.getDataSlice(fits, "asString", 0, 2880, 
		       Fitsy.readHeaderBlock, Fitsy.readError, 
		       fits);
};

Fitsy.readHeaderBlock = function(fits) {
    var i, off, card, pars;
    var end = 0;

    // if we hit EOF on last read (usually a gzip'ed file), call the handler
    if( fits.eof ){
	// call handler
	Fitsy.waiting(false);
	fits.handler(fits);
    }

    if( !fits.hdu[fits.nhdu] ){ 
	fits.hdu[fits.nhdu]  = {};
    }
    var hdu = fits.hdu[fits.nhdu];
    if ( ! hdu.card ) {
	// Mark offset in file where header starts.
	hdu.headseek = fits.here;
	hdu.card = [];
	hdu.head = {};
	hdu.ncard = 0;

 	hdu.fits = fits;
 	hdu.nth  = fits.nhdu;

	if ( fits.here === 0 && fits.result.slice(0, 6) !== "SIMPLE" ) {
	    // fits.read.onloadend=function(){ Fitsy.readForDeCompress(fits); };
	    // fits.read.readAsArrayBuffer(fits.file);

	    // read entire compressed file and ready it for decompression
	    Fitsy.waiting(true);
	    // OMG: a delay is required to ensure cursor gets set to waiting
	    setTimeout(function() {
		Fitsy.getDataSlice(fits, "asArray", null, null,
			       Fitsy.readForDeCompress, Fitsy.readError,
			       fits);
	    }, Fitsy.options.wtimeout);

	    return;
	}
    }
    if ( fits.here === 0 ) {
	if ( fits.result.slice(0, 6) !== "SIMPLE" ) {
	    return;
	}
    } else {
	if ( hdu.ncard === 0 && fits.result.slice(0, 8) !== "XTENSION" ) {
	    return;
	}
    }
	
    // Read the block advance the file pointer.
    fits.here += 2880;
    for ( off=0; off < 2880; hdu.ncard++, off += 80 ) {
	card = fits.result.slice(off, off+80);
	hdu.card[hdu.ncard] = card;
	if ( card.slice(0, 8) === "END     " ) {
	    end = 1;
	    break;
	}
	pars = Fitsy.cardpars(card);
	if ( pars !== undefined ) {
	    hdu.head[pars[0]] = pars[1];
	}
    }
    if ( end ) {
	hdu.axis  = [];
	hdu.dataseek  = fits.here; 				// Mark offset in file where data starts.
	hdu.naxis     = hdu.head.NAXIS;
	hdu.bitpix    = hdu.head.BITPIX;
	hdu.bscale    = hdu.head.BSCALE;
	hdu.bzero     = hdu.head.BZERO;
	hdu.pixlbytes = Math.abs(hdu.bitpix)/8;

 	if ( hdu.naxis !== 0 ) {
 	    hdu.datapixls = 1;
 	} else {
 	    hdu.datapixls = 0;
 	}

	for(i=1; i <= hdu.naxis; i++){
	    hdu.axis[i] = hdu.head["NAXIS" + i];
	    hdu.datapixls *= hdu.axis[i];
	}
	hdu.databytes = hdu.datapixls * hdu.pixlbytes;
	hdu.databloks = ((hdu.databytes+(2880-1))/2880) | 0;	// |0 is truncate.
	fits.here += hdu.databloks * 2880;
	fits.nhdu++;

	hdu.type = "image";

	hdu.filehead = hdu.head;
	hdu.filecard = hdu.card;

	if ( hdu.head.XTENSION === "BINTABLE"
	  || hdu.head.XTENSION === "A3DTABLE"
	  || hdu.head.XTENSION === "3DTABLE" ) {

	    hdu.type = "table";

	    hdu.table = {};

	    hdu.width  = hdu.axis[1];
	    hdu.length = hdu.axis[2];

	    var form, rept, type, size, width, offs = 0;

	    for ( i = 1; i <= hdu.head.TFIELDS; i++ ) {
		form = hdu.head["TFORM"+i].match(/([0-9]*)([LXBIJKAEDCMPQ])/);

		rept = form[1] === "" ? 1 : +form[1];
		type = TableTFORM[form[2]].type;
		size = TableTFORM[form[2]].size;
		width = rept * size;

		hdu.table[hdu.head["TTYPE"+i]] = {
		      type: type
		    , size: size, width: width , rept: rept, offs: offs
		    , unit: hdu.head["TUNIT"+i], disp:  hdu.head["TDISP"+i]
		    , zero: hdu.head["TZERO"+i], scale: hdu.head["TSCAL"+i]

		    , min: hdu.head["TDMIN"+i] || hdu.head["TLMIN"+i]
		    , max: hdu.head["TDMAX"+i] || hdu.head["TLMAX"+i]
		    , ith: i
		};
		offs += width;
	    }
	}
    }
    if ( (fits.here >= fits.size) && (fits.size !== -1) ) {				// EOF? hand the fits file to the handler function
	Fitsy.waiting(false);
	fits.handler(fits);
    } else { 							// Or, read the next header block
	// fits.read.readAsBinaryString(Fitsy.getFileSlice(fits.file,
	//						    fits.here,
	//				    fits.here+2880));
	Fitsy.getDataSlice(fits, "asString", fits.here, fits.here + 2880,
			       Fitsy.readHeaderBlock, Fitsy.readError,
			       fits);
    }
};

Fitsy.fitsopen = function(file, handler) {
    var fits  = {};
    fits.hdu  = [];
    fits.read = new FileReader();
    fits.handler = handler; 		// User callback to complete delivery of FITS data.
    if( !file ){
	Fitsy.readError(null);
    }
    fits.name = file.name;
    fits.size = file.size;
    fits.file = file;
    fits.ftype = "file";
    fits.nhdu = 0;
    fits.here = 0;

    //  fits.read.onloadend = function(){ Fitsy.readHeaderBlock(fits); };
    // fits.read.readAsBinaryString(Fitsy.getFileSlice(fits.file, 0, 2880));
    Fitsy.getDataSlice(fits, "asString", 0, 2880, 
		       Fitsy.readHeaderBlock, Fitsy.readError, 
		       fits);
};


Fitsy.template = function (str, data) {
    
    return str.replace(/\{\{([a-zA-Z0-9_.]+)(%([sfd])(\.([0-9]+))?)?\}\}/g,
	function (m,key, x, type, y, prec) {
	    var i, val = data;
	
	    key = key.split(".");

	    for ( i = 0; i < key.length; i++ ) {
		if ( val.hasOwnProperty(key[i]) ) { val = val[key[i]];
		} else { 			    return ""; 		}
	    }

	    switch ( type ) {
	     case "s": 				break;
	     case "f": val = val.toFixed(prec); break;
	     case "d": val = val.toFixed(0); 	break;
	    }

	    return val;
	}
    );
};

Fitsy.BinTableTemplate = "									\n\
  return function (view, vstart, image, length) {							\n\
    var i, x, y;										\n\
												\n\
    var xoff = ((-( {{table.x.range}}/2 + ({{table.cx}}-{{table.x.range}}/2 )) {{BinText}}) | 0)\n\
    	     + (( {{image.nx}}/2 ) | 0);							\n\
    var yoff = ((-( {{table.y.range}}/2 + ({{table.cy}}-{{table.x.range}}/2 )) {{BinText}}) | 0)\n\
    	     + (( {{image.ny}}/2 ) | 0);							\n\
												\n\
    for (i = 0; i < length; i++) {								\n\
        if( {{FilterText}} ){									\n\
  	  x = view.get{{table.x.type}}(vstart + i * {{table.width}} + {{table.x.offs}});	\n\
	  y = view.get{{table.y.type}}(vstart + i * {{table.width}} + {{table.y.offs}});	\n\
												\n\
	  x = (((x - {{table.x.min}}) {{BinText}}) | 0) + xoff;					\n\
	  y = (((y - {{table.y.min}}) {{BinText}}) | 0) + yoff;					\n\
												\n\
	  if (x >= 0 && x < {{image.nx}} && y >= 0 && y < {{image.ny}}) {			\n\
	    image.data[y * {{image.width}} + x] += 1;						\n\
	  }											\n\
        }											\n\
    }												\n\
}";

Fitsy.readTableHDUDataBinner = function (fits, hdu, nev, options, handler) {
    var i, binner, BinText, FilterTemplate;
    var FilterText = "true";
    var vstart = 0;
    var opttable = options.table || Fitsy.options.table;

    if( !hdu.nev ){

	hdu.filename = fits.name;

	if( hdu.image && (hdu.image.length >= (opttable.nx * opttable.ny)) ){
	    for(i=0; i<hdu.image.length; i++){
		hdu.image[i] = 0;
	    }
	} else {
	    hdu.image = new Int32Array(opttable.nx*opttable.ny);
	}
	// backward compatibility
	hdu.data  = hdu.image;

	hdu.head  = Fitsy.clone(hdu.filehead);
	hdu.card  = Fitsy.clone(hdu.filecard);

	for ( i = 0; i < opttable.xcol.length; i++ ) { 			// Choose an X axis column
	    if ( hdu.table[opttable.xcol[i]] !== undefined ) { break; }
	}
	hdu.colx = hdu.table[opttable.xcol[i]];

	for ( i = 0; i < opttable.ycol.length; i++ ) {			// Choose a  Y axis column
	    if ( hdu.table[opttable.ycol[i]] !== undefined ) { break; }
	}
	hdu.coly = hdu.table[opttable.ycol[i]];

    }

    hdu.filedata = fits.result;

    var x = hdu.colx;
    var y = hdu.coly;

    var image = { nx: opttable.nx, ny: opttable.ny
		, width: opttable.nx
		, data: hdu.image
    };

    var table = { x: { type: x.type, offs: x.offs, min: Number(x.min), range: x.max - x.min + 1 }
		, y: { type: y.type, offs: y.offs, min: Number(y.min), range: y.max - y.min + 1 } 
    		, cx: opttable.cx, cy: opttable.cy
		, width: hdu.width, length: hdu.length
		, bin: opttable.bin
		, filter: opttable.filter
    };

    if ( table.cx === undefined ) { table.cx = (x.max - x.min + 1) / 2; }
    if ( table.cy === undefined ) { table.cy = (y.max - y.min + 1) / 2; }

    if ( table.bin === 1 ) {
	BinText = "";
    } else {
	BinText = "/" + Number(table.bin);
    }
 
    var values = { table: table, image: image, BinText: BinText };

    // the filter inside the binner
    // default is just true
    // look for a filter spec that contains column comparisons
    if( table.filter ){
	FilterTemplate = Fitsy.tableFilter(hdu, table.filter);
	// generate the filter string
	FilterText = Fitsy.template(FilterTemplate, values) ;
    }
    // add the filter string to the list of values that the binner can access
    values.FilterText = FilterText;

    var text = Fitsy.template(Fitsy.BinTableTemplate, values);

    //console.log(text);

    try { binner = new Function(text)(); }
    catch(e){ Fitsy.error("An error occurred while generating the filter/binning function. Please check the filter syntax: " + table.filter); }

    hdu.view = new DataView(hdu.filedata);
    switch(fits.ftype){
    case "array":
	if( fits.rlo ){
	    // mark offset into ArrayBuffer where this slice starts
	    vstart = fits.rlo;
	}
	break;
    }

    try{ binner(hdu.view, vstart, image, nev); }
    catch(e ){ 
	if( FilterTemplate ){
	    Fitsy.error("An error occurred while binning the table. Please check the filter syntax: " + FilterTemplate);
	} else {
	    Fitsy.error("An unknown error occurred while binning the table");
	}
    }
    hdu.nev += nev;

    if( hdu.nev === hdu.length ) {

	hdu.table.bin = opttable.bin;
	hdu.table.filter = opttable.filter;
	hdu.table.nx  = opttable.nx;
	hdu.table.ny  = opttable.ny;
	hdu.table.cx  = table.cx;
	hdu.table.cy  = table.cy;


	hdu.dmin = Number.MAX_VALUE;
	hdu.dmax = Number.MIN_VALUE;

	for ( i = 0; i < image.nx*image.ny; i++ ) {
	    hdu.dmin    = Math.min(hdu.dmin, hdu.data[i]);
	    hdu.dmax    = Math.max(hdu.dmax, hdu.data[i]);
	}

	hdu.axis[1] = image.nx;
	hdu.axis[2] = image.ny;
	hdu.bitpix  = 32;

	// Update card and head to match image
	//
	hdu.head.NAXIS1 = image.nx;
	hdu.head.NAXIS2 = image.ny;

	hdu.card[0] = Fitsy.cardfmt("SIMPLE", 0, true, "Standard FITS Image");

	hdu.card[Fitsy.cardfind(hdu.card, "BITPIX", 0)] = Fitsy.cardfmt("BITPIX", 0, 32, "FITS Data type.");

	hdu.card[Fitsy.cardfind(hdu.card, "NAXIS" , 0)] = Fitsy.cardfmt("NAXIS" , 0,  2, "Number of Axes");
	hdu.card[Fitsy.cardfind(hdu.card, "NAXIS1", 1)] = Fitsy.cardfmt("NAXIS1", 0, image.nx, "Axis Dimension");
	hdu.card[Fitsy.cardfind(hdu.card, "NAXIS2", 1)] = Fitsy.cardfmt("NAXIS2", 0, image.ny, "Axis Dimension");


	// Add the table column WCS.
	//
	i = x.ith;

	Fitsy.cardcopy(hdu, "TCTYP" + i, hdu, "CTYPE1");
	Fitsy.cardcopy(hdu, "TCRVL" + i, hdu, "CRVAL1");
	Fitsy.cardcopy(hdu, "TCDLT" + i, hdu, "CDELT1", undefined, function(x) { return  x*table.bin; });
	Fitsy.cardcopy(hdu, "TCRPX" + i, hdu, "CRPIX1", undefined, function(x) { 
//	    return (x-table.x.min)/table.bin+1.0;
	    // from funtools/funcopy.c, subtracting the 0.5 term makes them match exactly
	    // not sure why the binning term has to be removed to make it come out right ...
	    // return (x - (hdu.table.cx - (hdu.table.nx/2))) / hdu.table.bin - 0.5;
	    return (x - (hdu.table.cx - (hdu.table.nx/2))) - 0.5;
	});
	Fitsy.cardcopy(hdu, "TCROT" + i, hdu, "CROTA1");

	i = y.ith;
	
	Fitsy.cardcopy(hdu, "TCTYP" + i, hdu, "CTYPE2");
	Fitsy.cardcopy(hdu, "TCRVL" + i, hdu, "CRVAL2");
	Fitsy.cardcopy(hdu, "TCDLT" + i, hdu, "CDELT2", undefined, function(x) { return  x*table.bin; });
	Fitsy.cardcopy(hdu, "TCRPX" + i, hdu, "CRPIX2", undefined, function(x) { 
//	    return (x-table.y.min)/table.bin+1.0; 
	    return (x - (hdu.table.cy - (hdu.table.ny/2))) - 0.5;
	});
	Fitsy.cardcopy(hdu, "TCROT" + i, hdu, "CROTA2");

//    Fitsy.cardcopy(hdu, "LTV1",      hdu, "LTV1",   0.0, function(x) { return (image.nx/2-hdu.table.cx)/table.bin; });
//    Fitsy.cardcopy(hdu, "LTV2",      hdu, "LTV2",   0.0, function(x) { return (image.ny/2-hdu.table.cy)/table.bin; });

	Fitsy.cardcopy(hdu, "LTV1",      hdu, "LTV1",   0.0, function(x) { return (image.nx/2)-(hdu.table.cx/table.bin); });
	Fitsy.cardcopy(hdu, "LTV2",      hdu, "LTV2",   0.0, function(x) { return (image.ny/2)-(hdu.table.cy/table.bin); });

	Fitsy.cardcopy(hdu, "LTM1_1",    hdu, "LTM1_1", 1.0, function(x) { return x/table.bin; });
	Fitsy.cardcopy(hdu, "LTM1_2",    hdu, "LTM1_2", 0.0, function(x) { return x/table.bin; });
	Fitsy.cardcopy(hdu, "LTM2_1",    hdu, "LTM2_1", 0.0, function(x) { return x/table.bin; });
	Fitsy.cardcopy(hdu, "LTM2_2",    hdu, "LTM2_2", 1.0, function(x) { return x/table.bin; });

	handler(hdu, options);

    } else {
	nev = Math.min(hdu.length - hdu.nev, Fitsy.options.maxev);
	var dpos = hdu.dataseek + (hdu.nev * hdu.width);
	Fitsy.getDataSlice(fits, "asArray", 
		       dpos, dpos + (nev * hdu.width),
		       Fitsy.readTableHDUDataBinner, Fitsy.readError,
		       fits, hdu, nev, options, handler);

    }
};

Fitsy.cardfmt = function (name, nth, value, comment) {
    var card;

    switch ( Fitsy.xtypeof(value) ) {
     case 'Boolean':
	 if ( value ) { value = "T" ;
	 } else {	value = "F"; }
	break;

     case 'String':
	value = "'" + value + "'";
	break;
     case 'Number':
	// set precision for float values
	if( Fitsy.isFloat(value) ){
	    value = value.toPrecision(15);
	}
	break;
    }

    if ( nth !== 0 ) {
	name = (name + nth.toFixed(0)).slice(0, 8);
    }

    name += Fitsy.strrepeat(" ", 8-name.length);

    card = name + "= " + value + " /" + comment;

    return card + Fitsy.strrepeat(" ", 80-card.length);
};

Fitsy.cardfind = function (cards, name, append) {
    var i;

    name = name + Fitsy.strrepeat(" ", 8 - name.length);

    for ( i = 0; i < cards.length; i++ ) {
	if ( cards[i].slice(0, 8) === name ) {
	    return i;
	}
    }

    if ( append === true ) {
	cards[i] = cards[i-1];
	return i-1;
    }

    return undefined;
};

Fitsy.cardcopy = function (hdu1, name1, hdu2, name2, value, func) {
    var card;

    card = Fitsy.cardfind(hdu1.card, name1);

    if ( card === undefined && value === undefined ) { return; }

    if ( card !== undefined ) {
	var pars = Fitsy.cardpars(hdu1.card[card]);

	if ( pars !== undefined ) {
	    value = pars[1];
	}
    }

    if ( func !== undefined ) {
	value = func(value);
    }

    hdu2.card[Fitsy.cardfind(hdu2.card, name2, true)] = Fitsy.cardfmt(name2, 0, value, "");
    hdu2.head[name2] = value;
};


Fitsy.readTableHDUData = function (fits, hdu, options, handler) {
    // fits.read.onloadend = function() { Fitsy.readTableHDUDataBinner(fits, hdu, options, handler); };
    // fits.read.readAsArrayBuffer(Fitsy.getFileSlice(fits.file, hdu.dataseek, hdu.dataseek + hdu.databloks*2880));
    hdu.nev = 0;
    var nev = Math.min(hdu.length, Fitsy.options.maxev);
    var dpos = hdu.dataseek;
    Fitsy.getDataSlice(fits, "asArray", 
		       dpos, dpos + (nev * hdu.width),
		       Fitsy.readTableHDUDataBinner, Fitsy.readError,
		       fits, hdu, nev, options, handler);
};


Fitsy.convertPixel = function (data, bitpix, zero) {
    var dv = new DataView(data);

    switch( bitpix ) {
    case   8:
	return dv.getUint8(0, false);
    case -16:
	return dv.getInt16(0, false) 	 + zero;
    case  16:
	if ( zero === 32768 ) {
	    return dv.getInt16(0, false) + zero;
	}
	return dv.getInt16(0, false);
    case  32:
	return dv.getInt32(0, false);
    case -32:
	return dv.getFloat32(0, false);
    case -64:
	return dv.getFloat64(0, false);
    default:
	Fitsy.error("unknown BITPIX value: " + bitpix);
	return undefined;
    }
};

Fitsy.getTableValue = function (hdu, row, col) {
    var column = hdu.table[col];

    if ( hdu.view["get" + column.type] !== undefined ) {
	return hdu.view["get" + column.type](row * hdu.width + column.offs);
    }

    return "";
};

Fitsy.readPixel = function (fits, hdu, index, handler) {
    var ptr;
    var dopix = function() {
	    fits.pixel = Fitsy.convertPixel(fits.result, hdu.bitpix, hdu.bzero || 0);
	    handler();
    };

    // fits.read.onloadend = dopix;

    // Only works for 2d images
    //
    ptr = hdu.dataseek + (index[0] * hdu.axis[1] + index[1]) * Math.abs(hdu.bitpix/8);

    // fits.read.readAsArrayBuffer(Fitsy.getFileSlice(fits.file, ptr, ptr+Math.abs(hdu.bitpix/8)));
    Fitsy.getDataSlice(fits, "asArray", ptr, ptr+Math.abs(hdu.bitpix/8),
		       dopix, Fitsy.readError);
};

Fitsy.defaultDispatchFITS = function (fits, options, handler) { 	// Function to handle FITS when parsed
    var i;
    var hdu;

    var events = options.events || "EVENTS";

    for ( i = 0; i < fits.hdu.length; i++ ) {
	hdu = fits.hdu[i];

	if ( hdu.databytes > 0 ) {
	    if ( hdu.head.SIMPLE || hdu.head.XTENSION === "IMAGE" ) {
		Fitsy.readImageHDUData(fits, hdu, options, handler);
		break;
	    }
	    if ( hdu.table && hdu.head.EXTNAME === events ) {
		Fitsy.readTableHDUData(fits, hdu, options, handler);
		break;
	    }
	}
    }
};

Fitsy.handleFITSFile = function(file, options, handler) {	// Read the headers.

    if ( options === undefined ) { options = Fitsy.options; }
    if ( handler === undefined ) { handler = Fitsy.handler; }

    Fitsy.fitsopen(file, function (fits) { Fitsy.defaultDispatchFITS(fits, options, handler); });
};


// set default handler for data handler
//
Fitsy.datahandler = function(handler) { Fitsy.handler = handler; };
Fitsy.dataoptions = function(options) { Fitsy.options = options; };

Fitsy.dragenter = function(id, e) { e.stopPropagation(); e.preventDefault(); };
Fitsy.dragover  = function(id, e) { e.stopPropagation(); e.preventDefault(); };
Fitsy.dragexit  = function(id, e) { e.stopPropagation(); e.preventDefault(); };
Fitsy.dragdrop  = function(id, e) { e.stopPropagation(); e.preventDefault();

    Fitsy.onFile(e.target.files || e.dataTransfer.files, { display: id });
};


Fitsy.onFile = function(files, options, handler) {
    var i;

    for ( i = 0; i < files.length; i++ ) {
	if ( files[i].type !== "image/fits" && files[i].type.indexOf("image/") !== -1 ) {
	    Fitsy.handleImageFile(files[i], options, handler);
	} else {
	    try{ Fitsy.handleFITSFile(files[i], options, handler); }
	    catch(e){ Fitsy.error("could not load FITS file: " + 
				  files[i].name); }
	}
    }
};


Fitsy.options = {
    maxev: 20480,
    gzfilesize: 100 * 1024 * 1024,
    gzheapsize:   4 * 1024 * 1024,
    xtimeout: 10000,
    wtimeout: 100,
    table: { nx: 1024, ny: 1024, bin: 1
	       , xcol: [ "X", "x" ]
	       , ycol: [ "Y", "y" ] }
};

Fitsy.fetchURL = function(name, url, options, handler) {
    var xhr = new XMLHttpRequest();

    if ( url === undefined ) {
	url  = name;
	name = /([^\\\/]+)$/.exec(url)[1];
    }
    options = options || Fitsy.options;

    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.onload = function(e) {
	var blob;
        if ( this.readyState === 4 ) {
	    if ( this.status === 200 || this.status === 0 ) {
	        blob      = new Blob([this.response]);
		blob.name = name;

		if ( options.messages ) { options.messages(""); }

		Fitsy.onFile([blob], options, handler);
	    } else if( this.status === 404 ) {
		Fitsy.error("could not find " + url);
	    } else {
		Fitsy.error("can't load " + url + " (" + this.status + ")");
	    }
	}
    };

    xhr.onerror = function(e) {
	Fitsy.error("can't load " + url);
    };

    xhr.onreadystatechange=function() {
        // any response from the server will do
	if( xhr.xtimeout ){
	    clearTimeout(xhr.xtimeout);
	    delete xhr.xtimeout;
	}
    };

    if ( options.messages ){
	xhr.addEventListener("progress", function(e) { options.messages("progress " + e.loaded.toString()); });
	xhr.addEventListener("error"   , function(e) { options.messages("error loading FITS file"); });
	xhr.addEventListener("abort"   , function(e) { options.messages("abort while loading FITS file"); });
    }

    try{ xhr.send(); }
    catch(e){ Fitsy.error("request to load " + url + " failed", e); }

    // set a timeout to catch when Mac ignores the connect request entirely
    xhr.xtimeout=setTimeout(function(){
	Fitsy.error("timeout while waiting for response from server; " + 
		    url + " might not exist");
    }, Fitsy.options.xtimeout);
};

Fitsy.handleImageFile = function (file, options, handler) {
    if ( options === undefined ) { options = Fitsy.options; }
    if ( handler === undefined ) { handler = Fitsy.handler; }

    var reader = new FileReader();
    reader.onload = function ( ev ) {
	var img = new Image();
	img.src = ev.target.result;
	img.onload = function() {
	    var x, y, i = 0, brightness;

	    var canvas = document.createElement('canvas');
	    var ctx    = canvas.getContext('2d');
	    var h      = img.height;
	    var w      = img.width;

	    canvas.width  = w;
	    canvas.height = h;

	    ctx.drawImage(img, 0, 0);

	    var data   = ctx.getImageData(0, 0, w, h).data;
	    var gray   = new Float32Array(h*w);

	    for ( y = 0; y < h; y++ ) {
		for ( x = 0; x < w; x++ ) {
		      brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];		// NTSC

		    gray[(h-y)*w+x] = brightness; 
		    i += 4;
		}
	    }

	    var hdu = { head: {}, name: file.name
		      , filedata: gray, image: gray, naxis: 2, axis: [0, w, h], bitpix: -32 };

	    hdu.dmin = Number.MAX_VALUE;
	    hdu.dmax = Number.MIN_VALUE;

	    for ( i = 0; i < h*w; i++ ) {
		hdu.dmin    = Math.min(hdu.dmin, hdu.image[i]);
		hdu.dmax    = Math.max(hdu.dmax, hdu.image[i]);
	    }

	    handler(hdu, options);
	};
    };
    reader.readAsDataURL(file);
};

