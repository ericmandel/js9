
  return {
      initwcs:  Module.cwrap('initwcs', 'number', ['string', 'number']),
      wcssys:  Module.cwrap('wcssys', 'string', ['number', 'string']),
      wcsunits:  Module.cwrap('wcsunits', 'string', ['number', 'string']),
      pix2wcs: Module.cwrap('pix2wcsstr', 'string', ['number', 'number', 'number']),
      wcs2pix: Module.cwrap('wcs2pixstr', 'string', ['number', 'number', 'number']),
      reg2wcs: Module.cwrap('reg2wcsstr', 'string', ['number', 'string']),
      saostrtod: Module.cwrap('saostrtod', 'number', ['string']),
      saodtype:  Module.cwrap('saodtype', 'number'),
      zscale: Module.cwrap('zscale', 'string', ['number', 'number', 'number', 'number', 'number', 'number', 'number']),
      arrfile: Module["arrfile"],
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
      options: Module["options"]
  };
})();

