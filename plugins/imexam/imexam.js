require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./imexam":[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, bitwise: true */
/*globals Float32Array, Int32Array, JS9, $ */ 

"use strict";

var ndops =                     require("typed-array-function");
    ndops = ndops.extend(ndops, require("typed-array-ops"));
    ndops = ndops.extend(ndops, require("typed-numeric-uncmin"));

    ndops.rotate  = require("typed-array-rotate");

ndops.mask    = require("./mask.js");
var template  = require("./template");

var typed = ndops;

ndops.zeros   = function zeros(shape, Type) {
  var i, sz = 1;
  var ishape = [];
  if ( Type === undefined ) {
	Type = Float32Array;
  }

  for(i=0; i<shape.length; ++i) {
    ishape.push(Math.floor(shape[i]));
    sz *= ishape[i];
  }

  return ndops.ndarray(new Type(sz), ishape);
};

ndops.fill = typed(function (a, func) {
    var index = [];
    // ----
	a = func.apply(undefined, index);
});




      exports.fixupDiv = function (plugin) {

	if ( plugin.winType === "div" ) {
	    plugin.outerdivjq.find(".drag-handle").html(plugin.plugin.opts.winTitle);

	    var toolbar = plugin.outerdivjq.find(".JS9PluginToolbar-div");

	    toolbar.css("cursor", "default");
	    toolbar.css("right", 0);
	}
      };

var imops = {};

ndops.maxvalue = ndops.sup;
ndops.minvalue = ndops.inf;

ndops.size = function(shape) {
        var i;
        var size = 1;
        for ( i = 0; i < shape.length; i++ ) {
            size *= shape[i];
        }

        return size;
};


ndops.reshape = function(a, shape) {

    if ( a.size !== ndops.size(shape) ) {
        throw new Error("sizes not equil " + a.size + " != ", + ndops.size(shape));
    }

    return ndops.ndarray(a.data, shape);
};

ndops.section = function(a, sect) {
        var x1 = sect[0][0];
        var x2 = sect[0][1];
        var y1 = sect[1][0];
        var y2 = sect[1][1];

        return a.lo(y1, x1).hi(y2-y1, x2-x1);
};

ndops.print = function(a, width, prec) {
    var x, y;
    var line;

    if ( width === undefined ) { width = 7; }
    if ( prec === undefined  ) { prec  = 3; }

    if ( a.shape.length === 1 ) {
        line = "";
        for (x=0;x<a.shape[0];++x) {
            line += a.get(x).toFixed(prec) + " ";
            //if ( x > 17 ) { break;}
        }
        console.log(line);
    } else {
        for ( y = a.shape[0]-1; y >= 0; --y ) {
          line = "";
          for ( x = 0; x < a.shape[1]; ++x ) {
            line += a.get(y, x).toFixed(prec) + " ";
          }

          console.log(line);
        }
        console.log("\n");
    }
};

ndops._hist = typed(function (a, width , min, max) {
    var size = Math.floor((max-min) / width);
    var  h   = new Int32Array(size+1);

    // -----
    if( !isNaN(a) ){
        var bin = Math.max(0, Math.min(size, Math.round((a-min)/width))) | 0;	// | is truncate
        h[bin]++;
    }
    // -----

   return h;
});



ndops.hist = function(a, width, min, max) {
    var hist = {};
    var reply;

    if ( min === undefined ) {
        min = ndops.minvalue(a);
    }
    if ( max === undefined ) {
        max = ndops.maxvalue(a);
    }
    if ( width === undefined ) {
        width = Math.max(1, (max-min) / 250);
    }

    hist.raw   = a;

    hist.min   = min;
    hist.max   = max;
    hist.width = width;

    reply = ndops._hist(a, width, min, max);
    hist.data = ndops.ndarray(reply, [reply.length]);

    return hist;
};

ndops.proj = function(a, axis) {
        var sect;
	var i;

        //var proj = ndops.ndarray(ndops._proj(a, axis, new Float32Array(a.shape[axis === 0 ? 1 : 0]), [a.shape[axis === 0 ? 1 : 0]]));
        
	var proj = {};
        proj.n   = a.shape[axis === 1 ? 0 : 1];
	proj.x   = a.shape[axis];

        proj.sum = [];
        proj.avg = [];
        proj.med = [];

        var copy = ndops.assign(ndops.zeros(a.shape), a);

        for ( i = 0; i < proj.n; i++ ) {
            if ( axis === 0 ) {
                sect = ndops.section(copy, [[i, i+1], [0, proj.x]]);
            } else {
                sect = ndops.section(copy, [[0, proj.x], [i, i+1]]);
            }

            proj.sum[i] = ndops.sum(sect);
            proj.avg[i] = ndops.sum(sect)/proj.n;
            proj.med[i] = ndops.median(sect);
        }

        return proj;
};

ndops.qcenter = typed(function (a) {
	var start = [], end = [];
	var max = Number.MIN_VALUE;
	var idx;
	var iX = 0, iY = 0;

	start[0]++;
	start[1]++;
	  end[0]--;
	  end[1]--;

	// ----
	    var sum = 
		    + a[iY-1][iX-1] 
		    + a[iY-1][iX  ] 
		    + a[iY-1][iX+1] 
		    + a[iY  ][iX-1] 
		    + a[iY  ][iX  ]
		    + a[iY  ][iX+1] 
		    + a[iY+1][iX-1] 
		    + a[iY+1][iX  ] 
		    + a[iY+1][iX+1];

	    if ( max < sum ) {
		max = sum;
		idx = [iX, iY];
	    }
	// ----

	return idx;
});

ndops._imcnts = typed({ consider: { c: false } }, function (c, a, b) { c[b] += a; });

ndops.imcnts = function (a, b, n) {
    var reply = {};
    reply.cnts = ndops.ndarray(ndops._imcnts(new Float32Array(n), a, b));
    reply.area = ndops.hist(b, 1, 0, n-1).data;

    return reply;
};


ndops._centroid = typed(function (a, nx, ny) {
    var sum   = 0;
    var sumx  = 0;
    var sumy  = 0;
    var sumxx = 0;
    var sumyy = 0;

    var r = nx*nx+ny*ny;

    var iX = 0, iY = 0;

    // ----
	if ( a > 0 && iX*iX + iY*iY < r ) {
	    sum    += a;
	    sumx   += a * iX;
	    sumxx  += a * iX * iX;
	    sumy   += a * iY;
	    sumyy  += a * iY * iY;
	}

    // ----

    var reply = {};

    reply.sum  = sum;
    reply.cenx = sumx/sum;
    reply.ceny = sumy/sum;

    reply.rmom = ( sumxx - sumx * sumx / sum + sumyy - sumy * sumy / sum ) / sum;

    if ( reply.rmom <= 0 ) {
	reply.fwhm = -1.0;
    } else {
	reply.fwhm = Math.sqrt(reply.rmom)  * 2.354 / Math.sqrt(2.0);
    }

    return reply;
});

ndops.centroid = function(a) {
    var reply = ndops._centroid(a, a.shape[0], a.shape[1]);

    return reply;
};

ndops.flatten = function() {
        var size = 0;
	var i, n, a;

        for ( i = 0; i < arguments.length; i++ ) {
            size += arguments[i].size;
        }

        var reply = ndops.zeros([size]);
        var off   = 0;

        for ( n = 0; n < arguments.length; n++ ) {
            a = arguments[n];

            ndops.assign(ndops.ndarray(reply.data, a.shape, undefined, off), a);

            off += a.size;
        }

        return reply;
};

ndops.median = function(a) {
        var data = ndops.assign(ndops.zeros(a.shape), a);

	Array.prototype.sort.call(data.data, function(a, b) { return a-b; });

        var reply = data.data[Math.round((data.size-1)/2.0)];

        return reply;
};


ndops.rms = typed(function (a) {
    var sum = 0;
    var squ = 0;
    // ----
    if( !isNaN(a) ){
        sum +=   a;
	    squ += a*a;
    }
    // ----

    var mean = sum/a.size;

    return Math.sqrt((squ - 2*mean*sum + a.size*mean*mean)/(a.size-1));
});

ndops.rmsClipped = typed(function (a, min, max) {
    var n = 0;
    var sum = 0;
    var squ = 0;
    // ----
	if ( !isNaN(a) && (min === null || a > min) && (max === null || a < max) ) {
	    n++;
	    sum +=   a;
	    squ += a*a;
	}
    // ----

    var mean = sum/n;

    return Math.sqrt((squ - 2*mean*sum + n*mean*mean)/(n-1));
});

ndops.meanClipped = typed(function (a, min, max) {
    var n = 0;
    var sum = 0;
    // ----
	if ( !isNaN(a) && (min === null || a > min) && (max === null || a < max) ) {
	    n++;
	    sum +=   a;
	}
    // ----

    return sum/n;
});

imops.backgr = function(data, width) {
        var back = {};

        var pixels = ndops.flatten(
                             ndops.section(data, [[0, width], [0, data.shape[1]]])
                           , ndops.section(data, [[data.shape[0]-width, data.shape[0]], [0, data.shape[1]]])
                           , ndops.section(data, [[width, data.shape[0]-width], [0, width]])
                           , ndops.section(data, [[width, data.shape[0]-width], [data.shape[1]-width, data.shape[1]]]));


        back.noise = ndops.rms(pixels);
        back.value = ndops.median(pixels);

        return back;
};

imops.mksection = function(x, y, w, h) {
        return [[x-(w/2), x+(w/2)], [y-(h/2), y+(h/2)]];
};

imops._rproj = typed(function(a, cx, cy, radius, length) {
    var rad = new Float32Array(length);
    var val = new Float32Array(length);
    var r = Math.sqrt(radius*radius);
    var i = 0;

    var iX = 0, iY = 0;

    // ----
	var d = Math.sqrt((iY-cy)*(iY-cy) + (iX-cx)*(iX-cx));

	if ( (d <= r) && !isNaN(a) ) { 
	    rad[i] = d;
	    val[i] = a;

	    i++;
	}
    // ----
    
    return { rad: rad.subarray(0, i), val: val.subarray(0, i), n: i };
});

function sortArrays(a, b) {
    var indexed;

    indexed = Array.prototype.map.call(a, function(itm, i){ return [itm, i, b[i]]; });

    indexed.sort(function(a, b){ return a[0]-b[0]; });

    indexed.map(function(itm, i) {
	a[i] = itm[0];
	b[i] = itm[2];
    });
}

imops.rproj = function(im, center) {
    var radius = (im.shape[0]/2 + im.shape[1]/2) / 2;
    var data   = imops._rproj(im, center[1], center[0], radius, im.size);

    sortArrays(data.rad, data.val);

    return { radi: ndops.ndarray(data.rad, [data.rad.length])
	   , data: ndops.ndarray(data.val, [data.rad.length]), radius: radius };
};


imops._encen = typed(function (a, cx, cy, radius) {
    var reply = new Float32Array(radius);
    var sum = 0;
    var RSq = radius*radius;

    var tot = 0;
    var i;

    var iX = 0, iY = 0;

    // ----
	var x = iX - cx;
	var y = iY - cy;

	var rsq = x*x+y*y;

	if ( a > 0 && rsq < RSq ) { 
	    reply[Math.round(Math.sqrt(rsq))] += a;
	    sum += a;
	}
    // ----


    for ( i = 0; i < radius; i++ ) {
	tot += reply[i];

	reply[i] = tot / sum;
    }

    return reply;
});



imops.encen = function(im, center) {
    var radius = Math.floor((im.shape[0]/2 + im.shape[1]/2) / 2);

    var reply = imops._encen(im, center[1], center[0], radius);

    return ndops.ndarray(reply, [reply.length]);
};

ndops.indexof = function(a, x) {
    var i;

    for ( i = 0; i < a.shape[0]; i++ ) {

	if ( x < a.get(i) ) { break; }
    }

    if ( i === 0          ) { return 0; }
    if ( i === a.shape[0] ) { return a.shape[0]; }

    return i + (x - a.get(i))/(a.get(i) - a.get(i-1));
};

ndops.gauss1d = function(radi, x0) {
    var reply = ndops.zeros(radi.shape);

    var a = x0[0];
    var b = 0; 		// x0[1];
    var c = x0[1];
    var d = x0[2];

    ndops.fill(reply, function(i) {
        var x = radi.data[i]-b;

        return a * Math.pow(2.71828, - x*x / (2*c*c)) + d;
    });

    return reply;    
};

ndops.gsfit1d = function(radi, data, x0) {

    var reply = typed.uncmin(function(x) {
	var modl = ndops.gauss1d(radi, x);

	ndops.sub(modl, modl, data);
	ndops.mul(modl, modl, modl);
	ndops.fill(modl, function(i) {
	    return modl.get(i)/(radi.get(i)*radi.get(i));
	});

	var sum = ndops.sum(modl);

	return Math.sqrt(sum/radi.shape[0]);

    }, x0, 0.000001);

    console.log(reply.message);

    return reply.solution;
};

function reg2section(xreg) {

    switch ( xreg.shape ) {

	case "annulus":
            xreg.width  = xreg.radii[xreg.radii.length-1]*2;
            xreg.height = xreg.radii[xreg.radii.length-1]*2;

            break;

       	case "circle":
            xreg.width  = xreg.radius*2;
            xreg.height = xreg.radius*2;

            break;

       	case "ellipse":
            xreg.width  = xreg.r1*2;
            xreg.height = xreg.r2*2;

            break;

       	case "polygon":
	    var i, xx = 0, yy = 0, minx = 1000000, maxx = 0, miny = 1000000, maxy = 0;

	    for ( i = 0; i < xreg.pts.length; i++ ) {
		xx += xreg.pts[i].x;
		yy += xreg.pts[i].y;

		if ( xreg.pts[i].x > maxx ) { maxx = xreg.pts[i].x; }
		if ( xreg.pts[i].x < minx ) { minx = xreg.pts[i].x; }
		if ( xreg.pts[i].y > maxy ) { maxy = xreg.pts[i].y; }
		if ( xreg.pts[i].y < miny ) { miny = xreg.pts[i].y; }
	    }

	    xreg.x = xx/xreg.pts.length;
	    xreg.y = yy/xreg.pts.length;

	    xreg.width  = maxx - minx;
	    xreg.height = maxy - miny;

	    break;

       	default:
    }

    return imops.mksection(xreg.x, xreg.y, xreg.width, xreg.height);
}

exports.getRegionData = function (im, xreg) {
    var section = reg2section(xreg);
    var im_2d   = ndops.ndarray(im.raw.data, [im.raw.height, im.raw.width]);
    var imag;

    if ( xreg.angle && xreg.angle !== 0 ) {
	imag = ndops.zeros([xreg.width, xreg.height]);

	ndops.rotate(imag, im_2d, xreg.angle/57.29577951, xreg.y, xreg.x);
    } else {
	imag = ndops.section(im_2d, section);
    }

    return imag;
};

exports.convolve1d = typed(function(kernel, data, output) {
    var i, j, x;
    var half = Math.round(kernel.shape[0]/2.0);

    for ( i = 0; i < data.shape[0]; i++ ) {
	for ( j = 0; j < kernel.shape[0]; j++ ) {
	    x = i+j-half;

	    if ( x >= 0 && x < data.shape[0] ) {
		output[i] += kernel[j] * data[x];
	    }
	}
    }
});

exports.convolve2dSep = function(kernel, data, output) {
    var x, y, i, xx, yy; 

    var nx =   data.shape[1];
    var ny =   data.shape[0];
    var nk = kernel.shape[0];

    var half = Math.floor(nk/2.0);

    // Run the kernel 1d over each row
    //
    for ( y = 0; y < ny; y++ ) {
        for ( x = 0; x < nx; x++ ) {
	    output[y][x] = 0;

    	    for ( i = 0; i < nk; i++ ) {
		xx = x+i-half;

		if ( xx > 0 && xx < nx ) {
		    output[y][x] += data[y][xx]*kernel[i];
		}
	    }
	}
    }

    // Run the kernel 1d over each column
    //
    for ( x = 0; x < nx; x++ ) {
	for ( y = 0; y < ny; y++ ) {

    	    for ( i = 0; i < nk; i++ ) {
		yy = y+i-half;

		if ( yy > 0 && yy < ny ) {
		    output[y][x] += data[y+i][x]*kernel[i];
		}
	    }
	}
    }
};


exports.reg2section = reg2section;
exports.template = template;

exports.ndops    = ndops;
exports.typed    = ndops;
exports.imops    = imops;


},{"./mask.js":1,"./template":9,"typed-array-function":2,"typed-array-ops":3,"typed-array-rotate":4,"typed-numeric-uncmin":7}],1:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $ */ 

"use strict";

// source
// background
// exclude

(function() {
    var raster = require("./raster");

    function hasTag(reg, tag) {
	var i;

	for ( i = 0; i < reg.tags.length; i++ ) {
	    if ( reg.tags[i] === tag ) { return true; }
	}

	return false;
    }
    exports.hasTag = hasTag;

    exports.listRegions = function (regs) {
	var i, j;
	var reg, regno = 1;

	var reply = [];

	for ( i = 0; i < regs.length; i++ ) {
	    reg = regs[i];

	    switch ( reg.shape ) {
	     case "annulus":
		for ( j = 0; j < reg.radii.length; j++ ) {
		    if ( reg.radii[j] !== 0.0 ) {
			reply[regno-1] = $.extend($.extend({}, reg), { regno: regno++, shape: "circle", radius: reg.radii[j] });
		    }
		}
	     	break;
	     default:
		reply[regno-1] = $.extend({ regno: regno++ }, reg);
		break;
	    }
	}

	return reply;
    };

    exports.drawRegions = function (regs, buffer, width) {
	var reg, t, i;

	var type = [ "include", "exclude" ];

	for ( t = 0; t < 2; t++ ) {
	    for ( i = regs.length - 1; i >= 0; i-- ) {
		reg = regs[i];

		if ( hasTag(reg, type[t]) ) {
		    switch ( reg.shape ) {
		     case "polygon": raster.drawPolygon(buffer, width, reg.pts,                          reg.regno); 				 break;
		     case "circle":  raster.drawCircle( buffer, width, reg.x, reg.y, reg.radius, reg.regno); 				 break;
		     case "box":     raster.drawBox(    buffer, width, reg.x, reg.y, reg.width,  reg.height, reg.angle, reg.regno); break;
		     case "ellipse": raster.drawEllipse(buffer, width, reg.x, reg.y, reg.r1,     reg.r2,   reg.angle, reg.regno); break;
		    }
		}
	    }
	}
    };
}());


},{"./raster":8}],2:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, evil: true, regexp: true, bitwise: true */
/*jshint node: true, -W099: true, laxbreak:true, laxcomma:true, multistr:true, smarttabs:true */
/*globals typed, Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array */ 

"use strict";

(function() {
    var ndarray = require("ndarray-nobuffer");

    var types = {
	    int8  :   Int8Array
	  , uint8 :  Uint8Array
	  , int16 :  Int16Array
	  , uint16:  Uint16Array
	  , int32:   Int32Array
	  , uint32:  Uint32Array
	  , float32: Float32Array
	  , float64: Float64Array
    };

    function dim(x) {
    	if ( x.shape ) { return x.shape; }

	var ret = [];
	while( typeof x === "object" ) {
	    ret.push(x.length);
	    x = x[0];
	}

	return ret;
    }

    function rep(s,v,k) {
	if ( v === undefined ) { v = 0; }
	if ( k === undefined ) { k = 0; }
	var n = s[k], ret = [], i;
	if(k === s.length-1) {
	    for(i=n-2;i>=0;i-=2) { ret[i+1] = v; ret[i] = v; }
	    if(i===-1) { ret[0] = v; }
	    return ret;
	}
	for(i=n-1;i>=0;i--) { ret[i] = rep(s,v,k+1); }
	return ret;
    }

    function repeat(pattern, count) {
	if (count < 1) { return ''; }

	var result = '';
	while (count > 0) {
	    if ( count & 1 ) { result += pattern; }

	    count >>= 1; pattern += pattern;
	}
	return result;
    }




    function replaceIdentifierRefs(str, func) {
	var reply = "";

	var state = -1, match, index, first, i = 0, x;

	while ( i < str.length ) {
	    match = str.match(/[a-zA-Z_][a-zA-Z0-9_]*/);		// Find an identifier in the string.

	    if ( !match ) { break; }

	    reply += str.substr(i, match.index);

	    index = [];
	    i     = match.index + match[0].length;

	    x = true;
	    while ( x && i < str.length ) {
		while ( str[i] === ' ' ) { i++; }

		switch ( str[i] ) {
		 case "[": 
		    state = 1;
		    first = i+1;
		    i++;

		    while ( state ) {
			if ( str[i] === ']' ) {
			    if ( state === 1 ) { index.push(str.substring(first, i)); }
			    state--;
			}
			if ( str[i] === '[' ) { state++; }
			i++;
		    }
		    break;
		 case "." : 
		    first = i;
		    i++;
		    while ( str[i] === ' ' ) { i++; }
		    while ( str[i].match(/[ a-zA-Z0-9_]/) !== null ) { i++; }

		    index.push(str.substring(first, i));

		    break;
		 default: 
		    x = false;
		    break;
		}
	    }

	    reply += func(match[0], index);
	    str    = str.substr(i);
	    i = 0;
	}

	return reply + str.substr(i);
    }


    function typedArrayFunctionConstructor() {
        var actuals = arguments;
	var i, j;
	var args;
	var text;
	var hash = {};

	var body;

	if ( this.cache === undefined ) {
	    if ( typeof this.func === "string" ) {
		text = this.func;
	    } else {
		text = this.func.toString();
	    }
	    this.text = text;

	    var x = text.match(/function [A-Za-z0-9_]*\(([^()]*)\)[^{]*\{([\S\s]*)\}[\S\s]*/);	// }

	    args = x[1].split(",").map(function(s) { return s.trim(); });
	    this.args = args;

	    this.prep = "";
	    this.post = "";

	    body = x[2].split(/\/\/ ----+/);

	    if ( body.length > 1 ) {
		this.prep = body[0];
		this.post = body[2];
		this.body = body[1];
	    } else {
		this.body = body[0];
	    }
	    if ( this.post === "" || this.post === undefined ) {
		this.post = "\nreturn " + args[0] + ";";
	    }
	} 
	args = this.args;
	text = this.text;

	var opts = this.opts;

	if ( opts === undefined ) { opts = {}; }

	var type = "";
	var dime = 0;
	var func;

	for ( i = 0; i < args.length; i++ ) {
	    if ( actuals[i] !== null && actuals[i] !== undefined && typeof actuals[i] === "object"
	     && (opts.consider === undefined || ( typeof opts.consider === "object" && opts.consider[args[i]] !== false )) ) {

		hash[args[i]] = actuals[i];

		if ( !actuals[i].shape ) {
		    actuals[i].shape = dim(actuals[i]);
		}

		dime = Math.max(actuals[i].shape.length, dime);

		if ( actuals[i].data ) {
		    type += " " + actuals[i].dtype + " " + actuals[i].offset + " " + " " + actuals[i].stride;
		} else {
		    type += " O";
		}

	    } else {
		type += " X";
	    }
       	}
	type = dime + type;

	if ( this.cache ) {
	    func = this.cache[type];

	    if ( func ) { return func; }
	}

	var prep = this.prep;
	    body = this.body;
	var post = this.post;
	var dims = [];

	var indicies = [ "iW", "iV", "iU", "iZ", "iY", "iX" ];
	var hasIndex = false;

	// Match each source code identifier and any associated array indexing.  Extract
	// the indicies and recursivly replace them also.
	//
	function replaceArrayRefs(text) {

	    return replaceIdentifierRefs(text, function (id, indx) {
		var k, offset, reply;

		if ( id === "index" ) { hasIndex = true; }

		for ( k = 0; k < indx.length; k++ ) {
		    indx[k] = replaceArrayRefs(indx[k]);
		}

		var arg = hash[id];
		var dimen;
		var joinStr, bracket, fixindx;


		if ( arg !== undefined && typeof arg === "object" ) {

		    if ( indx.length >= 1 && indx[indx.length-1].trim() === ".length" ) {
		        indx[0] = ".shape";
			indx[1] = indx.length-1;
			indx.length = 2;
		    }

		    if ( indx.length >= 1 && indx[0][0] === "." ) {
		        if ( indx.length >= 2 && indx[0].trim() === ".shape" ) {
			    if ( arg.data ) {
				reply = id + ".shape[" + indx[1] + "]";
			    } else {
				reply = id + repeat("[0]", indx[1]) + ".length";
			    } 
			} else {
			    reply = id + indx[0].trim();
			}
		    } else {
			if ( arg.data ) {
			    dimen = arg.dimension;


			    if ( indx.length !== 0 && indx.length < arg.dimension ) {
				id = id + ".data.subarray";
				bracket = "()";
				fixindx = indx.length;
			    } else {
				id = id + ".data";
				bracket = "[]";
				fixindx = arg.dimension;
			    }

			    joinStr = " + ";
			} else {
			    dimen = arg.shape.length;
			    joinStr = "][";
			    offset  = "";
			    bracket = "[]";
			}

			var indi = indicies.slice(6-dimen);

			if ( ( opts.loops === undefined || opts.loops === true ) && ( indx.length === 0 || dimen === indx.length ) ) {
			    for ( i = 0; i < dimen; i++ ) {
				if ( indx[i] === undefined ) { indx[i] = indi[i]; } 
				if ( dims[i] === undefined ) { dims[i] = 0; }

				dims[i] = Math.max(dims[i], arg.shape[i]);
			    }
			}

			if ( arg.data ) {
			    for ( i = 0; i < fixindx; i++ ) {
				if ( arg.stride[i] !== 1 ) { indx[i] =  "(" + indx[i] + ")*" + arg.stride[i]; }
			    }

			    if ( arg.offset !== 0 ) { 	offset = arg.offset + " + ";
			    } else {			offset = ""; }
			}

			if ( indx.length ) {
			    reply = id + bracket[0] + offset + indx.join(joinStr) + bracket[1] + " ";
			} else {
			    reply = id;
			}
		    }
		} else {
		    reply = id;

		    for ( i = 0; i <  indx.length; i++ ) {
			if ( indx[i][0] === "." ) {
			    reply += indx[i].trim();
			} else {
			    reply += "[" + indx[i].trim() + "]";
			}
		    }
		    reply += " ";
		}
		
		return reply;
	    });
	}

	body = replaceArrayRefs(body);

	var indx = indicies.slice(6-dims.length);
	var indi = indicies.slice(6-dims.length).reverse();
	dims.reverse();

	var init = "\n";
	var setp = "\n";

	var indxZero = "";
	var indxIncr = "";

	if ( opts.loops === undefined || opts.loops === true ) {
	    init += "	var index = [" + rep([dims.length], 0).join(",") + "];\n";
	    init += "	var start = [" + rep([dims.length], 0).join(",") + "];\n";
	    init += "	var   end = [" + rep([dims.length], 0).join(",") + "];\n\n";

	    for ( i = 0; i < dims.length; i++ ) {

		for ( j = 0; j < args.length; j++ ) {
		    if ( hash[args[j]] && actuals[j] !== undefined && typeof actuals[j] === "object" ) {
			init += "	end[" + i + "] = " + args[j] + ".shape[" + i + "];\n";
			break;
		    }
		}
	    }
	    init += "\n";

	    for ( i = 0; i < dims.length; i++ ) {
		setp += "	var "   + indx[i] + "start = start[" + i + "];\n";
		setp += "	var   " + indx[i] + "end =   end[" + i + "];\n";

	    }
	    setp += "\n";
	    for ( i = 0; i < dims.length; i++ ) {
		if ( hasIndex ) {
		    indxZero = "index[" + (dims.length - i - 1) + "] = 0;\n";
		    indxIncr = "	index[" + (dims.length - i - 1) + "]++\n";
		}
		    
		body = indxZero + "for ( var " + indi[i] + " = " + indi[i] + "start; " + indi[i] + " < " + indi[i] + "end; " + indi[i] + "++ ) {\n	" + body + "\n" + indxIncr + "\n    }";
	    }
	}

	func  = "// Array optimized funciton\n";
	func += "// " + type + "\n";
	func += "return function (" + args.join(",") + ") {\n'use strict';\n\n" + init + prep + setp + body + post + "\n}";

	if ( typed.debug ) { console.log(func); }

	if ( this.cache === undefined ) { this.cache = {}; }

	func = new Function(func)();
	this.cache[type] = func;

	return func;
    }


    function typedArrayFunctionExecute() {
	var func  = typedArrayFunctionConstructor.apply(this, arguments);

	var reply = func.apply(typed, arguments);

	return reply;
    }

    function typed(opts, func) {
	if ( func === undefined ) {
	    func = opts;
	    opts = undefined;
	}

	var objst = { func: func, opts: opts };
	var reply = typedArrayFunctionExecute.bind(objst);

	reply.baked = typedArrayFunctionConstructor.bind(objst);

	return reply;
    }

    var size = typed(function (a) {
	var prd = 1;
	// ----
    if( !isNaN(a) ){
	    prd *= a;
    }
	// ----
	return prd;
    });

    function array(shape, DType, value) {
        var reply;
	var i, n;

	if ( typeof value !== "number" ) {
	    value = 0;
	}

	if ( DType && DType.dtype ) 	 { DType = DType.dtype;  }
	if ( typeof DType === "string" ) { DType = types[DType]; }

        if ( typeof DType === "function" ) {
	    n = size(shape);
	    reply = ndarray(new DType(n), shape);

	    for ( i = 0; i < n; i++ ) { reply.data[i] = value; }
	} else {
	    reply = rep(shape, value);
	}

	reply.shape = shape;

	return reply;
    }

    function clone (x) {
	return typed.assign(typed.array(typed.dim(x), x), x);
    }

    function iota(i, n) {
	if ( n === undefined ) {
	    n = i;
	    i = 0;
	}
	var j, result = [];
	for ( j = 0; j<n; j++ ) { result[j] = i; i += 1; }   

	return result;
    }


    function extend(obj) {
	var i, key;

	for( i = 1; i < arguments.length; i++) {
	    for ( key in arguments[i] ) {
		if ( arguments[i].hasOwnProperty(key) ) {
		    obj[key] = arguments[i][key];
		}
	    }
	}
	return obj;
    }

    function print(a, width, prec) {
	var x, y;
	var line;

	if ( width === undefined ) { width = 7; }
	if ( prec === undefined  ) { prec  = 3; }

	if ( a.shape.length === 1 ) {
	    line = "";
	    for (x=0;x<a.shape[0];++x) {
		line += a.get(x).toFixed(prec) + " ";
		//if ( x > 17 ) { break;}
	    }
	    console.log(line);
	} else {
	    for ( y = a.shape[0]-1; y >= 0; --y ) {
	      line = "";
	      for ( x = 0; x < a.shape[1]; ++x ) {
		line += a.get(y, x).toFixed(prec) + " ";
	      }

	      console.log(line);
	    }
	    console.log("\n");
	}
    }

    function section(a, sect) {
	    var x1 = sect[0][0];
	    var x2 = sect[0][1];
	    var y1 = sect[1][0];
	    var y2 = sect[1][1];

	    return a.lo(y1, x1).hi(y2-y1, x2-x1);
    }

    module.exports         = typed;
    module.exports.ndarray = ndarray;
    module.exports.section = section;
    module.exports.extend  = extend;
    module.exports.array   = array;
    module.exports.clone   = clone;
    module.exports.print   = print;
    module.exports.iota    = iota;
    module.exports.rep     = rep;
    module.exports.dim     = dim;

    module.exports.epsilon = 2.220446049250313e-16;
}());


},{"ndarray-nobuffer":11}],3:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, evil: true, regexp: true */
/*globals */ 

"use strict";

(function () {
    var i;
    var typed = require("typed-array-function");

    var ops = {}, opname, op;
    module.exports = ops;

    function twofourthr(ops) {				// Allocate an output array as needed
        var dima, dimb, shape;

	return function (a, b, c) {
	    if ( c === undefined ) {
	 	dima = typed.dim(a);
	 	dimb = typed.dim(b);

		if ( dima.length > dimb.length ) {
		    shape = dima;
		} else {
		    shape = dimb;
		} 
	    	c = b; b = a; a = typed.array(shape, b);
	    }

	    return ops(a, b, c);
	};
    }
    function onefourtwo(ops) {				// Allocate an output array as needed
	return function (a, b) {
	    if ( b === undefined ) { b = a; a = typed.array(typed.dim(b), b); }

	    return ops(a, b);
	};
    }

    function twofourthr_bake(op) {
	return function(a, b, c) {
	    if ( c === undefined )  { return twofourthr(op.baked(a, b, c)); }

	    return op.baked(a, b, c);
	};
    }
    function onefourtwo_bake(op) {
	return function(a, b) {
	    if ( b === undefined )  { return onefourtwo(op.baked(a, b)); }

	    return op.baked(a, b);
	};
    }


    var assign_ops = { add:  "+", sub:  "-", mul:  "*", div:  "/",
		       mod:  "%", band: "&", bor:  "|", bxor: "^",
		       lshift: "<<", rshift: ">>", rrshift: ">>>"
    };

      for(opname in assign_ops) {
	if ( assign_ops.hasOwnProperty(opname) ) {
	    op = assign_ops[opname];

	    ops[opname + "3"]       = typed("function (a, b, c)    {            a = b " + op + " c; }");
	    ops[opname + "_mask"]   = typed("function (a, b, c, m) { if ( m ) { a = b " + op + " c; } }");
	    ops[opname + "eq"]      = typed("function (a, b   )    {            a " + op + "= b;    }  ");
	    ops[opname + "eq_mask"] = typed("function (a, b   , m) { if ( m ) { a " + op + "= b;    } }");

	    ops[opname]       = twofourthr     (ops[opname + "3"]);
	    ops[opname].baked = twofourthr_bake(ops[opname + "3"]);

	    ops[opname + "s"]   = ops[opname];
	    ops[opname + "seq"] = ops[opname + "eq"];
	}
      }

    var binary_ops = { and: "&&", or: "||",
		       eq: "===", neq: "!==", lt: "<",
		       gt: ">", leq: "<=", geq: ">=" };

      for(opname in binary_ops) {
	if ( binary_ops.hasOwnProperty(opname) ) {
	    op = binary_ops[opname];

	    ops[opname + "3"]            = typed("function (a, b, c)    {            a = b " + op + " c; }");
	    ops[opname + "_mask"]        = typed("function (a, b, c, m) { if ( m ) { a = b " + op + " c; } }");
	    ops[opname + "eq"]           = typed("function (a, b   )    {            a = a " + op + " b; }  ");
	    ops[opname + "eq_mask"]      = typed("function (a, b   , m) { if ( m ) { a = a " + op + " b; } }");

	    ops[opname]       = twofourthr     (ops[opname + "3"]);
	    ops[opname].baked = twofourthr_bake(ops[opname + "3"]);

	    ops[opname + "s"]   = ops[opname];
	    ops[opname + "seq"] = ops[opname + "eq"];
	}
      }


    var unary_ops = { not: "!", bnot: "~", neg: "-", recip: "1.0/" };

      for(opname in unary_ops) {
	if ( unary_ops.hasOwnProperty(opname) ) {
	    op = unary_ops[opname];
		
	    ops[opname + "2"]            = typed("function (a, b   )    {            a = " + op + " b; }");
	    ops[opname + "_mask"]        = typed("function (a, b   , m) { if ( m ) { a = " + op + " b; } }");
	    ops[opname + "eq"]           = typed("function (a      )    {            a = " + op + " a; }");
	    ops[opname + "eq" + "_mask"] = typed("function (a      , m) { if ( m ) { a = " + op + " a; } }");

	    ops[opname]       = onefourtwo     (ops[opname + "2"]);
	    ops[opname].baked = onefourtwo_bake(ops[opname + "2"]);
	}
      }

    var math_unary = [ "Math.abs", "Math.exp", "Math.floor", "Math.log", "Math.round", "Math.sqrt"
		    , "Math.acos", "Math.asin", "Math.atan", "Math.ceil", "Math.cos", "Math.sin", "Math.tan"
		    , "isFinite", "isNaN" ]; 

      for( i = 0; i < math_unary.length; i++ ) {
	    op = math_unary[i];

	    opname = op.split(".")

	    if ( opname.length == 2 ) {
		opname = opname[1]
	    } else {
		opname = opname[0]
	    }

	    ops[opname + "2"]            = typed("function (a, b   )    {            a = " + op + "(b); }");
	    ops[opname + "_mask"]        = typed("function (a, b   , m) { if ( m ) { a = " + op + "(b); } }");
	    ops[opname + "eq"]           = typed("function (a      )    {            a = " + op + "(a); }");
	    ops[opname + "eq" + "_mask"] = typed("function (a      , m) { if ( m ) { a = " + op + "(a); } }");

	    ops[opname]       = onefourtwo     (ops[opname + "2"]);
	    ops[opname].baked = onefourtwo_bake(ops[opname + "2"]);
      }

    var math_comm = [ "max", "min" ];

      for( i = 0; i < math_comm.length; i++ ) {
	opname = op = math_comm[i];

	ops[opname + "3"]            = typed("function (a, b, c)    {            a = Math." + op + "(b, c); }");
	ops[opname + "_mask"]        = typed("function (a, b, c, m) { if ( m ) { a = Math." + op + "(b, c); } }");

	ops[opname]       = twofourthr     (ops[opname + "3"]);
	ops[opname].baked = twofourthr_bake(ops[opname + "3"]);

	ops[opname + "s"]        = ops[opname];
	ops[opname + "s" + "eq"] = ops[opname];
      }

    var math_noncomm = [ "atan2", "pow" ];

      for( i = 0; i < math_noncomm.length; i++ ) {
	opname = op = math_noncomm[i];

	ops[opname + "3"]            = typed("function (a, b, c)    {            a = Math." + op + "(b, c); }");
	ops[opname + "_mask"]        = typed("function (a, b, c, m) { if ( m ) { a = Math." + op + "(b, c); } }");

	ops[opname]       = twofourthr     (ops[opname + "3"]);
	ops[opname].baked = twofourthr_bake(ops[opname + "3"]);

	ops[opname + "s"]        = ops[opname];
	ops[opname + "s" + "eq"] = ops[opname];
      }

    ops.assign   = typed(function (a, b) { a = b; });
    ops.equals   = typed(function (a, b) { if ( a !== b )   { return false; } });
    ops.any      = typed(function (a) { if ( a )            { return true;  } });
    ops.all      = typed(function (a) { if (!a )            { return false; } });
    ops.random   = typed(function (a)    { a = Math.random(); });
    ops.sum  = typed(function (a) {
	var sum = 0; 
	// ----
    if( !isNaN(a) ){
	    sum += a;
    }
	// ----
	return sum;
    });
    ops.prod = typed(function (a) {
	var prd = 1;
	// ----
    if( !isNaN(a) ){
	    prd *= a;
    }
	// ----
	return prd;
    });

    ops.inf  = typed(function (a) {
	var inf =  Infinity;
	// ----
	    if ( a < inf ) { inf = a; }
	// ----
	return inf;
    });
    ops.sup  = typed(function (a) {
	var sup = -Infinity;
	// ----
	    if ( a > sup ) { sup = a; }
	// ----
	return sup;
    });


    ops.norm2Squared = typed(function (a) {
	var norm2 = 0;
	// ----    
    if( !isNaN(a) ){
	    norm2 += a*a;
    }
	// ----    
	return norm2;
    });
    ops.norm2 = function (a) { return Math.sqrt(ops.norm2Squared(a)); };

	//norm1
	//norminf

	//argmin
	//argmax

}());
 

},{"typed-array-function":2}],4:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, bitwise: true */

"use strict";

var warp = require("typed-array-warp");


function rotateImage(out, inp, theta, iX, iY, oX, oY) {
  var c = Math.cos(theta);
  var s = Math.sin(-theta);
  iX = iX || inp.shape[0]/2.0;
  iY = iY || inp.shape[1]/2.0;
  oX = oX || out.shape[0]/2.0;
  oY = oY || out.shape[1]/2.0;
  var a = iX - c * oX + s * oY;
  var b = iY - s * oX - c * oY;
  warp(out, inp, function(y,x) {
    y[0] = c * x[0] - s * x[1] + a;
    y[1] = s * x[0] + c * x[1] + b;
  });
  return out;
}

module.exports = rotateImage;

},{"typed-array-warp":5}],5:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, bitwise: true */

"use strict";

var interp = require("ndarray-linear-interpolate");
var typed = require("typed-array-function");

var do_warp = typed(function (dest, func, interp) {
    var warped = dest.shape.slice(0);

    var iX = 0, iY = 0, iZ = 0;

    // ----
	func(warped, [iX, iY, iZ]);
	dest = interp.apply(undefined, warped);
    // ----
});
        
var do_warp_1 = typed(function (dest, func, interp, src) {
    var warped = [0];
    var SRC = src;

    var iX = 0;

    // ----
	func(warped, [iX]);
	dest = interp(SRC, warped[0]);
    // ----
});

var do_warp_2 = typed(function (dest, func, interp, src) {
    var warped = [0, 0];
    var SRC = src;

    var iX = 0, iY = 0;

    // ----
	func(warped, [iY, iX]);
	dest = interp(SRC, warped[0], warped[1]);
    // ----
});

var do_warp_3 = typed(function (dest, func, interp, src) {
    var warped = [0, 0, 0];
    var SRC = src;

    var iX = 0, iY = 0, iZ = 0;

    // ----
	func(warped, [iZ, iY, iX]);
	dest = interp(SRC, warped[0], warped[1], warped[2]);
    // ----
});

module.exports = function warp(dest, src, func) {
  switch(src.shape.length) {
    case 1:
      do_warp_1(dest, func, interp.d1, src);
      break;
    case 2:
      do_warp_2(dest, func, interp.d2, src);
      break;
    case 3:
      do_warp_3(dest, func, interp.d3, src);
      break;
    default:
      do_warp(dest, func, interp.bind(undefined, src));
      break;
  }
  return dest;
};

},{"ndarray-linear-interpolate":10,"typed-array-function":2}],6:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, evil: true, regexp: true, bitwise: true */
/*jshint node: true, -W099: true, laxbreak:true, laxcomma:true, multistr:true, smarttabs:true */
/*globals */ 

"use strict";

var typed   = require("typed-array-function");
var numeric = typed;


typed.dot = function dot(x,y) {
    var d = numeric.dim;

    var dimx = d(x);
    var dimy = d(y);

    switch(d(x).length*1000+d(y).length) {
	case 2002: return numeric.dotMM(numeric.array([dimx[0], dimy[1]], x.dtype), x,y);
	case 2001: return numeric.dotMV(x,y);
	case 1002: return numeric.dotVM(x,y);
	case 1001: return numeric.dotVV(x,y);
	case 1000: return numeric.mulVS(x,y);
	case 1: return numeric.mulSV(x,y);
	case 0: return x*y;
	default: throw new Error('numeric.dot only works on vectors and matrices');
    }
};

numeric.dotVV = function dotVV(x,y) {
    var i,n=x.length,i1,ret = x[n-1]*y[n-1];

    for(i=n-2;i>=1;i-=2) {
	i1 = i-1;
	ret += x[i]*y[i] + x[i1]*y[i1];
    }
    if(i===0) { ret += x[0]*y[0]; }

    return ret;
};

numeric.dotMV = function dotMV(x,y) {
    var i, p = x.length;
    var ret = this.array([p], x.dtype), dotVV = this.dotVV;
    for(i=p-1;i>=0;i--) { ret[i] = dotVV(x[i],y); }
    return ret;
};

numeric.dotVM = function dotVM(x,y) {
    var j,k,p,q,ret,woo,i0;
    p = x.length; q = y[0].length;
    ret = numeric.array([q], x.dtype);
    for(k=q-1;k>=0;k--) {
	woo = x[p-1]*y[p-1][k];
	for(j=p-2;j>=1;j-=2) {
	    i0 = j-1;
	    woo += x[j]*y[j][k] + x[i0]*y[i0][k];
	}
	if(j===0) { woo += x[0]*y[0][k]; }
	ret[k] = woo;
    }
    return ret;
};

numeric.dotMM = function dotMM(reply,x,y) {
    var i,j,k,r=reply.shape[1],foo,bar,woo,i0;

    var p = x.length;
    var q = y.length;

    for(i=p-1;i>=0;i--) {
	foo = reply[i];
	bar = x[i];

	for(k=r-1;k>=0;k--) {
	    woo = bar[q-1]*y[q-1][k];
	    for(j=q-2;j>=1;j-=2) {
		i0 = j-1;
		woo += bar[j]*y[j][k] + bar[i0]*y[i0][k];
	    }
	    if(j===0) { woo += bar[0]*y[0][k]; }
	    foo[k] = woo;
	}
	//ret[i] = foo;
    }
};

numeric.diag = function diag(d) {
    var i,i1,j,n = d.length, A = this.array([n, n], d.dtype), Ai;
    for(i=n-1;i>=0;i--) {
	Ai = A[i];
	i1 = i+2;
	for(j=n-1;j>=i1;j-=2) {
	    Ai[j] = 0;
	    Ai[j-1] = 0;
	}
	if(j>i) { Ai[j] = 0; }
	Ai[i] = d[i];
	for(j=i-1;j>=1;j-=2) {
	    Ai[j] = 0;
	    Ai[j-1] = 0;
	}
	if(j===0) { Ai[0] = 0; }
	//A[i] = Ai;
    }
    return A;
};
numeric.identity = function identity(n, type) { return this.diag(this.array([n],type,1)); };

numeric.tensorXX = function tensor(A,x,y) {
    var m = x.length, n = y.length, Ai, i,j,xi;


    for(i=m-1;i>=0;i--) {
	Ai = A[i];
	xi = x[i];
	for(j=n-1;j>=3;--j) {
	    Ai[j] = xi * y[j];
	    --j;
	    Ai[j] = xi * y[j];
	    --j;
	    Ai[j] = xi * y[j];
	    --j;
	    Ai[j] = xi * y[j];
	}
	while(j>=0) { Ai[j] = xi * y[j]; --j; }
    }

    //console.log(x, y, A[0], A[1]);
};
numeric.tensorXX = typed({ loops: false }, numeric.tensorXX);
numeric.tensor   = function tensor(x,y) {

    if(typeof x === "number" || typeof y === "number") { return numeric.mul(x,y); }
    var s1 = numeric.dim(x);
    var s2 = numeric.dim(y);
    if(s1.length !== 1 || s2.length !== 1) {
	throw new Error('numeric: tensor product is only defined for vectors');
    }
    
    return numeric.tensorXX(numeric.array([s1[0], s2[0]], x.dtype), x, y);
};


numeric.dotVV = typed({ loops: false }, numeric.dotVV);
numeric.dotVM = typed({ loops: false }, numeric.dotVM);
numeric.dotMV = typed({ loops: false }, numeric.dotMV);
numeric.dotMM = typed({ loops: false }, numeric.dotMM);
numeric.diag  = typed({ loops: false }, numeric.diag);


},{"typed-array-function":2}],7:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, evil: true, regexp: true, bitwise: true, continue:true */

"use strict";

var numeric =                         require("typed-array-function");
    numeric = numeric.extend(numeric, require("typed-array-ops"));
    numeric = numeric.extend(numeric, require("typed-matrix-ops"));

//9. Unconstrained optimization
exports.gradient = function gradient(f,x) {
    var n = x.length;
    var f0 = f(x);
    if(isNaN(f0)) { throw new Error('gradient: f(x) is a NaN!'); }
    var i,x0 = numeric.clone(x),f1,f2, J = new [].constructor(n);
    var errest,max = Math.max,eps = 1e-3,abs = Math.abs, min = Math.min;
    var t0,t1,t2,it=0,d1,d2,N,h;
    for(i=0;i<n;i++) {
        h = max(1e-6*f0,1e-8);
        while(true) {
            ++it;
            if(it>20) { throw new Error("Numerical gradient fails"); }
            x0[i] = x[i]+h;
            f1 = f(x0);
            x0[i] = x[i]-h;
            f2 = f(x0);
            x0[i] = x[i];
            if(isNaN(f1) || isNaN(f2)) { h/=16; continue; }
            J[i] = (f1-f2)/(2*h);
            t0 = x[i]-h;
            t1 = x[i];
            t2 = x[i]+h;
            d1 = (f1-f0)/h;
            d2 = (f0-f2)/h;
            N = max(abs(J[i]),abs(f0),abs(f1),abs(f2),abs(t0),abs(t1),abs(t2),1e-8);
            errest = min(max(abs(d1-J[i]),abs(d2-J[i]),abs(d1-d2))/N,h/N);
            if(errest>eps) { h/=16;
	    } else { break; }
            }
    }
    return J;
};
exports.uncmin = function uncmin(f,x0,tol,gradient,maxit,callback,options) {
    var grad = exports.gradient;
    if(options  === undefined) { options = {}; }
    if(tol      === undefined) { tol = 1e-8; }
    if(gradient === undefined) { gradient = function(x) { return grad(f,x); }; }
    if(maxit    === undefined) { maxit = 1000; }
    x0 = numeric.clone(x0);
    var n = x0.length;
    var f0 = f(x0),f1,df0;
    if(isNaN(f0)) { throw new Error('uncmin: f(x0) is a NaN!'); }
    var max = Math.max, norm2 = numeric.norm2;
    tol = max(tol,numeric.epsilon);
    var step,g0,g1,H1 = options.Hinv || numeric.identity(n);
    var dot = numeric.dot, sub = numeric.sub, add = numeric.add, ten = numeric.tensor, div = numeric.div, mul = numeric.mul;

    var all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
    var it=0,s,x1,y,Hy,ys,t,nstep;
    var msg = "";
    g0 = gradient(x0);
    while(it<maxit) {
        if(typeof callback === "function") { if(callback(it,x0,f0,g0,H1)) { msg = "Callback returned true"; break; } }
        if(!all(isfinite(g0))) { msg = "Gradient has Infinity or NaN"; break; }
        step = neg(dot(H1,g0));
        if(!all(isfinite(step))) { msg = "Search direction has Infinity or NaN"; break; }
        nstep = norm2(step);
        if(nstep < tol) { msg="Newton step smaller than tol"; break; }
        t = 1;
        df0 = dot(g0,step);
        // line search
        x1 = x0;
        while(it < maxit) {
            if(t*nstep < tol) { break; }
            s  = mul(step,t);
            x1 = add(x0,s);
            f1 = f(x1);
            if(f1-f0 >= 0.1*t*df0 || isNaN(f1)) {
                t *= 0.5;
                ++it;
                continue;
            }
            break;
        }
        if(t*nstep < tol) { msg = "Line search step size smaller than tol"; break; }
        if(it === maxit) { msg = "maxit reached during line search"; break; }
        g1 = gradient(x1);

        y  = sub(g1,g0);
        ys = dot(y,s);
        Hy = dot(H1,y);

        H1 = sub(add(H1,
                mul(
                        (ys+dot(y,Hy))/(ys*ys),
                        ten(s,s)    )),
                div(add(ten(Hy,s),ten(s,Hy)),ys));
        x0 = x1;
        f0 = f1;
        g0 = g1;
        ++it;

    }
    return {solution: x0, f: f0, gradient: g0, invHessian: H1, iterations:it, message: msg};
};

},{"typed-array-function":2,"typed-array-ops":3,"typed-matrix-ops":6}],8:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals */ 

"use strict";

(function() {

    // http://cogsandlevers.blogspot.com/2013/11/scanline-based-filled-polygons.html
    //
    function drawHLine(buffer, width, x1, x2, y, k, rop) {

	if ( x1 < 0     ) { x1 = 0;     }
	if ( x2 > width ) { x2 = width; }

	var ofs = x1 + y * width; 			// calculate the offset into the buffer
        var x;

	switch ( rop ) { 				// draw all of the pixels
	 case undefined:
	 case "set": for (x = x1; x < x2; x++) { buffer[ofs++]  = k; } break;
	 case "add": for (x = x1; x < x2; x++) { buffer[ofs++] += k; } break;
	}
    }

    function scanline(x1, y1, x2, y2, miny, edges) {
	var x, y, xi;

	if (y1 > y2) { 					// flip the points if need be
	     y = y1; y1 = y2; y2 = y;
	     x = x1; x1 = x2; x2 = x;
	}

	y1 = Math.floor(y1)+1;
	y2 = Math.floor(y2);

	//if ( y2 < y1 ) { y2++ }

	x = x1; 					// start at the start
	var dx = (x2 - x1) / (y2 - y1); 		// change in x over change in y will give us the gradient
	var ofs = Math.round(y1 - miny); 		// the offset the start writing at (into the array)

	for ( y = y1; y <= y2; y++ ) { 		// cover all y co-ordinates in the line

	    xi = Math.floor(x) + 1;

	    // check if we've gone over/under the max/min
	    //
	    if ( edges[ofs].minx > xi ) { edges[ofs].minx = xi; }
	    if ( edges[ofs].maxx < xi ) { edges[ofs].maxx = xi; }

	    x += dx; 					// move along the gradient
	    ofs ++; 					// move along the buffer

	}
    }

    function _drawPolygon(buffer, width, points, color, rop) {
	var i;
	var miny = points[0].y-1; 			// work out the minimum and maximum y values
	var maxy = points[0].y-1;

	for ( i = 1; i < points.length; i++ ) {
	    if ( points[i].y-1 < miny) { miny = points[i].y-1; }
	    if ( points[i].y-1 > maxy) { maxy = points[i].y-1; }
	}

	var h = maxy - miny; 				// the height is the size of our edges array
	var edges = [];

	for ( i = 0; i <= h+1; i++ ) { 			// build the array with unreasonable limits
	    edges.push({ minx:  1000000, maxx: -1000000 });
	}

	for ( i = 0; i < points.length-1; i++ ) { 	// process each line in the polygon
	    scanline(points[i  ].x-1, points[i  ].y-1
		   , points[i+1].x-1, points[i+1].y-1, miny, edges);
	}
	scanline(points[i].x-1, points[i].y-1, points[0].x-1, points[0].y-1, miny, edges);

	// draw each horizontal line
	for ( i = 0; i < edges.length; i++ ) {
	    drawHLine( buffer, width
		     , Math.floor(edges[i].minx)
		     , Math.floor(edges[i].maxx)
		     , Math.floor(i + miny), color, rop);
	}
    }

    function d2r(d) { return d * (Math.PI / 180); }

    function rotPoints(points, angle, about) {
	var x, y, i;
	var reply = [];

	angle = d2r(angle);

	var sin = Math.sin(angle);
	var cos = Math.cos(angle);

	for ( i = 0; i < points.length; i++ ) {
	    x = about.x + (((points[i].x-about.x) * cos) - ((points[i].y-about.y) * sin));
	    y = about.y + (((points[i].x-about.x) * sin) + ((points[i].y-about.y) * cos));

	    reply.push({ x: x, y: y });
	}

	return reply;
    }

    function polyEllipse(x, y, w, h) {
	var ex, ey, i;
	var reply = [];

	for ( i = 0; i < 2 * Math.PI; i += 0.01 ) {
	    ex = x + w*Math.cos(i);
	    ey = y + h*Math.sin(i);

	    reply.push({ x: ex, y: ey });
	}

	return reply;
    }

    function polyBox(x, y, w, h) {
	return [  { x: x-w/2, y: y-h/2 }
		, { x: x-w/2, y: y+h/2 }
		, { x: x+w/2, y: y+h/2 }
		, { x: x+w/2, y: y-h/2 } ];
    }

    exports.drawPolygon = function (buffer, width, points,    color, rop)       { _drawPolygon(buffer, width, points,                      color, rop); };
    exports.drawCircle  = function (buffer, width, x, y, rad, color, rop)       { _drawPolygon(buffer, width, polyEllipse(x, y, rad, rad), color, rop); };
    exports.drawEllipse = function (buffer, width, x, y, h, w, rot, color, rop) { _drawPolygon(buffer, width, rotPoints(polyEllipse(x, y, h, w), rot, { x: x, y: y }), color, rop); };
    exports.drawBox     = function (buffer, width, x, y, h, w, rot, color, rop) { _drawPolygon(buffer, width, rotPoints(polyBox    (x, y, h, w), rot, { x: x, y: y }), color, rop); };
}());

},{}],9:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */

"use strict";


    function strrep(str, n) {
	var i, s = '';

	for ( i = 0; i < n; i++ ) { s += str; }

	return s;
    }

function template(text,data) {
    return text.replace(/\{([a-zA-Z0-9_.%]*)\}/g,
	function(m,key){
	    var type, prec, widt = 0, fmt, i;
	    var val = data;
	
	    key = key.split("%");

	    if ( key.length <= 1 ) {
		fmt = "%s";
	    } else {
		fmt = key[1];
	    }

	    key = key[0];
	    key = key.split(".");

	    for ( i = 0; i < key.length; i++ ) {
		if ( val.hasOwnProperty(key[i]) ) {
		    val = val[key[i]];
		} else {
		    return "";
		}
	    }

	    type = fmt.substring(fmt.length-1);
	    prec = fmt.substring(0, fmt.length-1);

	    prec = prec.split(".");

	    widt = prec[0] | 0;
	    prec = prec[1] | 0;

	    switch ( type ) {
	     case "s":
		val = val.toString();
		break;
	     case "f":
		val = val.toFixed(prec);
		break;
	     case "d":
		val = val.toFixed(0);
		break;
	    }

	    if ( widt !== 0 && widt > val.length ) {
		if ( widt > 0 ) {
		    val = strrep(" ", widt-val.length) + val;
		} else {
		    val = val + strrep(" ", widt-val.length);
		}
	    }

	    return val;
	}
    );
}

module.exports = template;

},{}],10:[function(require,module,exports){
"use strict"

function interp1d(arr, x) {
  var ix = Math.floor(x)
    , fx = x - ix
    , s0 = 0 <= ix   && ix   < arr.shape[0]
    , s1 = 0 <= ix+1 && ix+1 < arr.shape[0]
    , w0 = s0 ? +arr.get(ix)   : 0.0
    , w1 = s1 ? +arr.get(ix+1) : 0.0
  return (1.0-fx)*w0 + fx*w1
}

function interp2d(arr, x, y) {
  var ix = Math.floor(x)
    , fx = x - ix
    , s0 = 0 <= ix   && ix   < arr.shape[0]
    , s1 = 0 <= ix+1 && ix+1 < arr.shape[0]
    , iy = Math.floor(y)
    , fy = y - iy
    , t0 = 0 <= iy   && iy   < arr.shape[1]
    , t1 = 0 <= iy+1 && iy+1 < arr.shape[1]
    , w00 = s0&&t0 ? arr.get(ix  ,iy  ) : 0.0
    , w01 = s0&&t1 ? arr.get(ix  ,iy+1) : 0.0
    , w10 = s1&&t0 ? arr.get(ix+1,iy  ) : 0.0
    , w11 = s1&&t1 ? arr.get(ix+1,iy+1) : 0.0
  return (1.0-fy) * ((1.0-fx)*w00 + fx*w10) + fy * ((1.0-fx)*w01 + fx*w11)
}

function interp3d(arr, x, y, z) {
  var ix = Math.floor(x)
    , fx = x - ix
    , s0 = 0 <= ix   && ix   < arr.shape[0]
    , s1 = 0 <= ix+1 && ix+1 < arr.shape[0]
    , iy = Math.floor(y)
    , fy = y - iy
    , t0 = 0 <= iy   && iy   < arr.shape[1]
    , t1 = 0 <= iy+1 && iy+1 < arr.shape[1]
    , iz = Math.floor(z)
    , fz = z - iz
    , u0 = 0 <= iz   && iz   < arr.shape[2]
    , u1 = 0 <= iz+1 && iz+1 < arr.shape[2]
    , w000 = s0&&t0&&u0 ? arr.get(ix,iy,iz)       : 0.0
    , w010 = s0&&t1&&u0 ? arr.get(ix,iy+1,iz)     : 0.0
    , w100 = s1&&t0&&u0 ? arr.get(ix+1,iy,iz)     : 0.0
    , w110 = s1&&t1&&u0 ? arr.get(ix+1,iy+1,iz)   : 0.0
    , w001 = s0&&t0&&u1 ? arr.get(ix,iy,iz+1)     : 0.0
    , w011 = s0&&t1&&u1 ? arr.get(ix,iy+1,iz+1)   : 0.0
    , w101 = s1&&t0&&u1 ? arr.get(ix+1,iy,iz+1)   : 0.0
    , w111 = s1&&t1&&u1 ? arr.get(ix+1,iy+1,iz+1) : 0.0
  return (1.0-fz) * ((1.0-fy) * ((1.0-fx)*w000 + fx*w100) + fy * ((1.0-fx)*w010 + fx*w110)) + fz * ((1.0-fy) * ((1.0-fx)*w001 + fx*w101) + fy * ((1.0-fx)*w011 + fx*w111))
}

function interpNd(arr) {
  var d = arr.shape.length|0
    , ix = new Array(d)
    , fx = new Array(d)
    , s0 = new Array(d)
    , s1 = new Array(d)
    , i, t
  for(i=0; i<d; ++i) {
    t = +arguments[i+1]
    ix[i] = Math.floor(t)
    fx[i] = t - ix[i]
    s0[i] = (0 <= ix[i]   && ix[i]   < arr.shape[i])
    s1[i] = (0 <= ix[i]+1 && ix[i]+1 < arr.shape[i])
  }
  var r = 0.0, j, w, idx
i_loop:
  for(i=0; i<(1<<d); ++i) {
    w = 1.0
    idx = arr.offset
    for(j=0; j<d; ++j) {
      if(i & (1<<j)) {
        if(!s1[j]) {
          continue i_loop
        }
        w *= fx[j]
        idx += arr.stride[j] * (ix[j] + 1)
      } else {
        if(!s0[j]) {
          continue i_loop
        }
        w *= 1.0 - fx[j]
        idx += arr.stride[j] * ix[j]
      }
    }
    r += w * arr.data[idx]
  }
  return r
}

function interpolate(arr, x, y, z) {
  switch(arr.shape.length) {
    case 0:
      return 0.0
    case 1:
      return interp1d(arr, x)
    case 2:
      return interp2d(arr, x, y)
    case 3:
      return interp3d(arr, x, y, z)
    default:
      return interpNd.apply(undefined, arguments)
  }
}
module.exports = interpolate
module.exports.d1 = interp1d
module.exports.d2 = interp2d
module.exports.d3 = interp3d

},{}],11:[function(require,module,exports){
"use strict"

var iota = require("iota-array")

var arrayMethods = [
  "concat",
  "join",
  "slice",
  "toString",
  "indexOf",
  "lastIndexOf",
  "forEach",
  "every",
  "some",
  "filter",
  "map",
  "reduce",
  "reduceRight"
]

function compare1st(a, b) {
  return a[0] - b[0]
}

function order() {
  var stride = this.stride
  var terms = new Array(stride.length)
  var i
  for(i=0; i<terms.length; ++i) {
    terms[i] = [Math.abs(stride[i]), i]
  }
  terms.sort(compare1st)
  var result = new Array(terms.length)
  for(i=0; i<result.length; ++i) {
    result[i] = terms[i][1]
  }
  return result
}

function compileConstructor(dtype, dimension) {
  var className = ["View", dimension, "d", dtype].join("")
  if(dimension < 0) {
    className = "View_Nil" + dtype
  }
  var useGetters = (dtype === "generic")
  
  if(dimension === -1) {
    //Special case for trivial arrays
    var code = 
      "function "+className+"(a){this.data=a;};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return -1};\
proto.size=0;\
proto.dimension=-1;\
proto.shape=proto.stride=proto.order=[];\
proto.lo=proto.hi=proto.transpose=proto.step=\
function(){return new "+className+"(this.data);};\
proto.get=proto.set=function(){};\
proto.pick=function(){return null};\
return function construct_"+className+"(a){return new "+className+"(a);}"
    var procedure = new Function(code)
    return procedure()
  } else if(dimension === 0) {
    //Special case for 0d arrays
    var code =
      "function "+className+"(a,d) {\
this.data = a;\
this.offset = d\
};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return this.offset};\
proto.dimension=0;\
proto.size=1;\
proto.shape=\
proto.stride=\
proto.order=[];\
proto.lo=\
proto.hi=\
proto.transpose=\
proto.step=function "+className+"_copy() {\
return new "+className+"(this.data,this.offset)\
};\
proto.pick=function "+className+"_pick(){\
return TrivialArray(this.data);\
};\
proto.valueOf=proto.get=function "+className+"_get(){\
return "+(useGetters ? "this.data.get(this.offset)" : "this.data[this.offset]")+
"};\
proto.set=function "+className+"_set(v){\
return "+(useGetters ? "this.data.set(this.offset,v)" : "this.data[this.offset]=v")+"\
};\
return function construct_"+className+"(a,b,c,d){return new "+className+"(a,d)}"
    var procedure = new Function("TrivialArray", code)
    return procedure(CACHED_CONSTRUCTORS[dtype][0])
  }

  var code = ["'use strict'"]
    
  //Create constructor for view
  var indices = iota(dimension)
  var args = indices.map(function(i) { return "i"+i })
  var index_str = "this.offset+" + indices.map(function(i) {
        return ["this._stride", i, "*i",i].join("")
      }).join("+")
  code.push("function "+className+"(a,"+
    indices.map(function(i) {
      return "b"+i
    }).join(",")+","+
    indices.map(function(i) {
      return "c"+i
    }).join(",")+",d){this.data=a")
  for(var i=0; i<dimension; ++i) {
    code.push("this._shape"+i+"=b"+i+"|0")
  }
  for(var i=0; i<dimension; ++i) {
    code.push("this._stride"+i+"=c"+i+"|0")
  }
  code.push("this.offset=d|0}",
    "var proto="+className+".prototype",
    "proto.dtype='"+dtype+"'",
    "proto.dimension="+dimension)
  
  //view.stride and view.shape
  var strideClassName = "VStride" + dimension + "d" + dtype
  var shapeClassName = "VShape" + dimension + "d" + dtype
  var props = {"stride":strideClassName, "shape":shapeClassName}
  for(var prop in props) {
    var arrayName = props[prop]
    code.push(
      "function " + arrayName + "(v) {this._v=v} var aproto=" + arrayName + ".prototype",
      "aproto.length="+dimension)
    
    var array_elements = []
    for(var i=0; i<dimension; ++i) {
      array_elements.push(["this._v._", prop, i].join(""))
    }
    code.push(
      "aproto.toJSON=function " + arrayName + "_toJSON(){return [" + array_elements.join(",") + "]}",
      "aproto.valueOf=aproto.toString=function " + arrayName + "_toString(){return [" + array_elements.join(",") + "].join()}")
    
    for(var i=0; i<dimension; ++i) {
      code.push(["Object.defineProperty(aproto,", i, ",{get:function(){return this._v._", prop, i, "},set:function(v){return this._v._", prop, i, "=v|0},enumerable:true})"].join(""))
    }
    for(var i=0; i<arrayMethods.length; ++i) {
      if(arrayMethods[i] in Array.prototype) {
        code.push(["aproto.", arrayMethods[i], "=Array.prototype.", arrayMethods[i]].join(""))
      }
    }
    code.push(["Object.defineProperty(proto,'",prop,"',{get:function ", arrayName, "_get(){return new ", arrayName, "(this)},set: function ", arrayName, "_set(v){"].join(""))
    for(var i=0; i<dimension; ++i) {
      code.push(["this._", prop, i, "=v[", i, "]|0"].join(""))
    }
    code.push("return v}})")
  }
  
  //view.size:
  code.push(["Object.defineProperty(proto,'size',{get:function ",className,"_size(){\
return ", indices.map(function(i) { return ["this._shape", i].join("") }).join("*"),
"}})"].join(""))

  //view.order:
  if(dimension === 1) {
    code.push("proto.order=[0]")
  } else {
    code.push("Object.defineProperty(proto,'order',{get:")
    if(dimension < 4) {
      code.push(["function ",className,"_order(){"].join(""))
      if(dimension === 2) {
        code.push("return (Math.abs(this._stride0)>Math.abs(this._stride1))?[1,0]:[0,1]}})")
      } else if(dimension === 3) {
        code.push(
"var s0=Math.abs(this._stride0),s1=Math.abs(this._stride1),s2=Math.abs(this._stride2);\
if(s0>s1){\
if(s1>s2){\
return [2,1,0];\
}else if(s0>s2){\
return [1,2,0];\
}else{\
return [1,0,2];\
}\
}else if(s0>s2){\
return [2,0,1];\
}else if(s2>s1){\
return [0,1,2];\
}else{\
return [0,2,1];\
}}})")
      }
    } else {
      code.push("ORDER})")
    }
  }
  
  //view.set(i0, ..., v):
  code.push([
"proto.set=function ",className,"_set(", args.join(","), ",v){"].join(""))
  if(useGetters) {
    code.push(["return this.data.set(", index_str, ",v)}"].join(""))
  } else {
    code.push(["return this.data[", index_str, "]=v}"].join(""))
  }
  
  //view.get(i0, ...):
  code.push(["proto.get=function ",className,"_get(", args.join(","), "){"].join(""))
  if(useGetters) {
    code.push(["return this.data.get(", index_str, ")}"].join(""))
  } else {
    code.push(["return this.data[", index_str, "]}"].join(""))
  }
  
  //view.index:
  code.push([
    "proto.index=function ",
      className,
      "_index(", args.join(), "){return ", 
      index_str, "}"].join(""))

  //view.hi():
  code.push(["proto.hi=function ",className,"_hi(",args.join(","),"){return new ", className, "(this.data,",
    indices.map(function(i) {
      return ["(typeof i",i,"!=='number'||i",i,"<0)?this._shape", i, ":i", i,"|0"].join("")
    }).join(","), ",",
    indices.map(function(i) {
      return "this._stride"+i
    }).join(","), ",this.offset)}"].join(""))
  
  //view.lo():
  var a_vars = indices.map(function(i) { return "a"+i+"=this._shape"+i })
  var c_vars = indices.map(function(i) { return "c"+i+"=this._stride"+i })
  code.push(["proto.lo=function ",className,"_lo(",args.join(","),"){var b=this.offset,d=0,", a_vars.join(","), ",", c_vars.join(",")].join(""))
  for(var i=0; i<dimension; ++i) {
    code.push([
"if(typeof i",i,"==='number'&&i",i,">=0){\
d=i",i,"|0;\
b+=c",i,"*d;\
a",i,"-=d}"].join(""))
  }
  code.push(["return new ", className, "(this.data,",
    indices.map(function(i) {
      return "a"+i
    }).join(","),",",
    indices.map(function(i) {
      return "c"+i
    }).join(","), ",b)}"].join(""))
  
  //view.step():
  code.push(["proto.step=function ",className,"_step(",args.join(","),"){var ",
    indices.map(function(i) {
      return "a"+i+"=this._shape"+i
    }).join(","), ",",
    indices.map(function(i) {
      return "b"+i+"=this._stride"+i
    }).join(","),",c=this.offset,d=0,ceil=Math.ceil"].join(""))
  for(var i=0; i<dimension; ++i) {
    code.push([
"if(typeof i",i,"==='number'){\
d=i",i,"|0;\
if(d<0){\
c+=b",i,"*(a",i,"-1);\
a",i,"=ceil(-a",i,"/d)\
}else{\
a",i,"=ceil(a",i,"/d)\
}\
b",i,"*=d\
}"].join(""))
  }
  code.push(["return new ", className, "(this.data,",
    indices.map(function(i) {
      return "a" + i
    }).join(","), ",",
    indices.map(function(i) {
      return "b" + i
    }).join(","), ",c)}"].join(""))
  
  //view.transpose():
  var tShape = new Array(dimension)
  var tStride = new Array(dimension)
  for(var i=0; i<dimension; ++i) {
    tShape[i] = ["a[i", i, "]"].join("")
    tStride[i] = ["b[i", i, "]"].join("")
  }
  code.push(["proto.transpose=function ",className,"_transpose(",args,"){", 
    args.map(function(n,idx) { return n + "=(" + n + "===undefined?" + idx + ":" + n + "|0)"}).join(";"),
    ";var a=this.shape,b=this.stride;return new ", className, "(this.data,", tShape.join(","), ",", tStride.join(","), ",this.offset)}"].join(""))
  
  //view.pick():
  code.push(["proto.pick=function ",className,"_pick(",args,"){var a=[],b=[],c=this.offset"].join(""))
  for(var i=0; i<dimension; ++i) {
    code.push(["if(typeof i",i,"==='number'&&i",i,">=0){c=(c+this._stride",i,"*i",i,")|0}else{a.push(this._shape",i,");b.push(this._stride",i,")}"].join(""))
  }
  code.push("var ctor=CTOR_LIST[a.length+1];return ctor(this.data,a,b,c)}")
    
  //Add return statement
  code.push(["return function construct_",className,"(data,shape,stride,offset){return new ", className,"(data,",
    indices.map(function(i) {
      return "shape["+i+"]"
    }).join(","), ",",
    indices.map(function(i) {
      return "stride["+i+"]"
    }).join(","), ",offset)}"].join(""))

  //Compile procedure
  var procedure = new Function("CTOR_LIST", "ORDER", code.join("\n"))
  return procedure(CACHED_CONSTRUCTORS[dtype], order)
}

function arrayDType(data) {
  if(data instanceof Float64Array) {
    return "float64";
  } else if(data instanceof Float32Array) {
    return "float32"
  } else if(data instanceof Int32Array) {
    return "int32"
  } else if(data instanceof Uint32Array) {
    return "uint32"
  } else if(data instanceof Uint8Array) {
    return "uint8"
  } else if(data instanceof Uint16Array) {
    return "uint16"
  } else if(data instanceof Int16Array) {
    return "int16"
  } else if(data instanceof Int8Array) {
    return "int8"
  } else if(data instanceof Uint8ClampedArray) {
    return "uint8_clamped"
  } else if(data instanceof Array) {
    return "array"
  }
  return "generic"
}

var CACHED_CONSTRUCTORS = {
  "float32":[],
  "float64":[],
  "int8":[],
  "int16":[],
  "int32":[],
  "uint8":[],
  "uint16":[],
  "uint32":[],
  "array":[],
  "uint8_clamped":[],
  "generic":[]
}

;(function() {
  for(var id in CACHED_CONSTRUCTORS) {
    CACHED_CONSTRUCTORS[id].push(compileConstructor(id, -1))
  }
});

function wrappedNDArrayCtor(data, shape, stride, offset) {
  if(data === undefined) {
    var ctor = CACHED_CONSTRUCTORS.array[0]
    return ctor([])
  } else if(typeof data === "number") {
    data = [data]
  }
  if(shape === undefined) {
    shape = [ data.length ]
  }
  var d = shape.length
  if(stride === undefined) {
    stride = new Array(d)
    for(var i=d-1, sz=1; i>=0; --i) {
      stride[i] = sz
      sz *= shape[i]
    }
  }
  if(offset === undefined) {
    offset = 0
    for(var i=0; i<d; ++i) {
      if(stride[i] < 0) {
        offset -= (shape[i]-1)*stride[i]
      }
    }
  }
  var dtype = arrayDType(data)
  var ctor_list = CACHED_CONSTRUCTORS[dtype]
  while(ctor_list.length <= d+1) {
    ctor_list.push(compileConstructor(dtype, ctor_list.length-1))
  }
  var ctor = ctor_list[d+1]
  return ctor(data, shape, stride, offset)
}

module.exports = wrappedNDArrayCtor

},{"iota-array":12}],12:[function(require,module,exports){
"use strict"

function iota(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = i
  }
  return result
}

module.exports = iota
},{}]},{},[]);

