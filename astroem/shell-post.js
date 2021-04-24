/*global Module, $*/

// set Astroem object with important properties and wrapped calls
// eslint-disable-next-line no-unused-vars
var Astroem = {
      initwcs:  Module.cwrap('initwcs', 'number', ['number', 'number']),
      freewcs:  Module.cwrap('freewcs', 'number', ['number']),
      listhdu:  Module.cwrap('listhdu', 'string', ['string', 'string']),
      wcsinfo:  Module.cwrap('wcsinfo', 'string', ['number']),
      wcssys:  Module.cwrap('wcssys', 'string', ['number', 'string']),
      wcsunits:  Module.cwrap('wcsunits', 'string', ['number', 'string']),
      pix2wcs: Module.cwrap('pix2wcsstr', 'string', ['number', 'number', 'number']),
      wcs2pix: Module.cwrap('wcs2pixstr', 'string', ['number', 'number', 'number']),
      reg2wcs: Module.cwrap('reg2wcsstr', 'string', ['number', 'string', 'number']),
      saostrtod: Module.cwrap('saostrtod', 'number', ['string']),
      saodtype:  Module.cwrap('saodtype', 'number'),
      saodtostr: Module.cwrap('saodtostr', 'string', ['number', 'string', 'number']),
      arrfile: Module["arrfile"],
      vfile: Module["vfile"],
      vread: Module["vread"],
      vsize: Module["vsize"],
      vmount: Module["vmount"],
      vunlink: Module["vunlink"],
      vheap: Module["HEAPU8"],
      vmalloc: Module["_malloc"],
      vmemcpy: Module["writeArrayToMemory"],
      vstrcpy: Module["writeAsciiToMemory"],
      vfree: Module["_free"],
      gzopen: Module.cwrap('gzopen', 'number', ['string', 'string']),
      gzread: Module.cwrap('gzread', 'number', ['number', 'number', 'number']),
      gzwrite: Module.cwrap('gzwrite', 'number', ['number', 'number', 'number']),
      gzclose: Module.cwrap('gzclose', 'number', ['number']),
      gzseek: Module.cwrap('gzseek', 'number', ['number', 'number', 'number']),
      compress: Module['gzcompress'],
      decompress: Module['gzdecompress'],
      handleFITSFile: Module["handleFITSFile"],
      cleanupFITSFile: Module["cleanupFITSFile"],
      getFITSImage: Module["getFITSImage"],
      maxFITSMemory: Module["maxFITSMemory"],
      zscale: Module.cwrap('zscale', 'string', ['number', 'number', 'number', 'number', 'number', 'number', 'number']),
      tanhdr: Module.cwrap('tanhdr', 'string', ['string', 'string', 'string']),
      reproject: Module.cwrap('reproject', 'string', ['string', 'string', 'string', 'string']),
      madd: Module.cwrap('madd', 'string', ['string', 'string', 'string', 'string']),
      imgtbl: Module.cwrap('imgtbl', 'string', ['string', 'string', 'string', 'string']),
      makehdr: Module.cwrap('makehdr', 'string', ['string', 'string', 'string']),
      shrinkhdr: Module.cwrap('shrinkhdr', 'string', ['number', 'string', 'string', 'string']),
      imsection: Module.cwrap('imsection', 'int', ['string', 'string', 'string', 'string']),
      imannulusi: Module.cwrap('imannulusi', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imboxi: Module.cwrap('imboxi', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imcirclei: Module.cwrap('imcirclei', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imellipsei: Module.cwrap('imellipsei', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imfieldi: Module.cwrap('imfieldi', 'number', ['number', 'number', 'number', 'number', 'number', 'number']),
      imlinei: Module.cwrap('imlinei', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      impiei: Module.cwrap('impiei', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imqtpiei: Module.cwrap('imqtpiei', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      impointi: Module.cwrap('impointi', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      impandai: Module.cwrap('impandai', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imnannulusi: Module.cwrap('imnannulusi', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imnboxi: Module.cwrap('imnboxi', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imnellipsei: Module.cwrap('imnellipsei', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imnpiei: Module.cwrap('imnpiei', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      impolygoni: function(){
	  return Module.ccall_varargs('impolygoni', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvannulusi: function(){
	  return Module.ccall_varargs('imvannulusi', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvboxi: function(){
	  return Module.ccall_varargs('imvboxi', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvellipsei: function(){
	  return Module.ccall_varargs('imvellipsei', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvpiei: function(){
	  return Module.ccall_varargs('imvpiei', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvpointi: function(){
	  return Module.ccall_varargs('imvpointi', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imannulus: Module.cwrap('imannulus', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imbox: Module.cwrap('imbox', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imcircle: Module.cwrap('imcircle', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imellipse: Module.cwrap('imellipse', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imfield: Module.cwrap('imfield', 'number', ['number', 'number', 'number', 'number', 'number', 'number']),
      imline: Module.cwrap('imline', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      impie: Module.cwrap('impie', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imqtpie: Module.cwrap('imqtpie', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      impoint: Module.cwrap('impoint', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      impanda: Module.cwrap('impanda', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imnannulus: Module.cwrap('imnannulus', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imnbox: Module.cwrap('imnbox', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imnellipse: Module.cwrap('imnellipse', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      imnpie: Module.cwrap('imnpie', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
      impolygon: function(){
	  return Module.ccall_varargs('impolygon', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvannulus: function(){
	  return Module.ccall_varargs('imvannulus', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvbox: function(){
	  return Module.ccall_varargs('imvbox', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvellipse: function(){
	  return Module.ccall_varargs('imvellipse', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvpie: function(){
	  return Module.ccall_varargs('imvpie', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      imvpoint: function(){
	  return Module.ccall_varargs('imvpoint', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', ['','d']], Array.prototype.slice.call(arguments));
      },
      regcnts: Module.cwrap('regcnts', 'string', ['string', 'string', 'string', 'string']),
      vls: Module.cwrap('vls', 'int', ['string']),
      vcat: Module.cwrap('vcat', 'string', ['string', 'number']),
      options: Module["options"]
  };

// signal that astroem is ready
if( window.jQuery ){
    if( Module["astroemReady"] ){
	$(document).trigger("astroem:ready", {status: "OK"});
    } else {
	Module["astroemReady"] = true;
    }
}
