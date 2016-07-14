(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9, Option */ 

"use strict";

(function() {

    var xhr = require("./xhr");

    var Remote = require("./remote-service");

    require("./image-services");
    require("./catalog-services");


    function serviceGo(div, display) {
	function status(text) {
	    $(div).find(".status").html(text);
	}
		
	
	var form = $(div).find(".JS9Archive-form")[0];

	if ( form.ra.value === "" || form.dec.value === "" ) {
	    return;
	}

	var w = parseFloat(form.width.value);
	var h = parseFloat(form.height.value);

	if ( form.dec.value[0] !== "-" && form.dec.value[0] !== "+" ) {
	    form.dec.value  = "+" + form.dec.value;
	}
	if ( w > 60 ) {
	    form.width.value = "60";
	    w = 60;
	}
	if ( h > 60 ) {
	    form.height.value = "60";
	    h = 60;
	}

	var msrv = $(form).find(".server-menu")[0];
	var msrc = $(form).find(".source-menu")[0];

	var service = msrv.options[msrv.selectedIndex].value;
	var source  = msrc.options[msrc.selectedIndex].value;
	var server  = Remote.Services[service];

	var text    = msrc.options[msrc.selectedIndex].innerHTML;
	

	server.retrieve({ name: form.object.value, e: "J2000", h: h.toString(), w: w.toString()
			, r: form.ra.value, d: form.dec.value
			, c: form.gzip.checked
			, s: source
			, source : text

			, CORS: form.CORS.checked
			, display: display
		      }
		    , status);
    }

    function getRADec(div, display) {
	function status(text) {
	    $(div).find(".status").html(text);
	}

	var form = $(div).find(".JS9Archive-form")[0];

	if ( form.object.value !== "" ) {
	    var simurl = JS9.globalOpts.simbadProxy || "http://js9.si.edu/cgi-bin/simbad-proxy.cgi";
	    var simbad = encodeURI(simurl + '?' + form.object.value);

	    xhr({ url: simbad, title: "Name", status: status }, function(e, xhr) {
		var coords = xhr.responseText.trim().split(" ");

		if ( coords[0][1] !== ":" ) {
		    form.ra.value  = coords[0];
		    form.dec.value = coords[1];
		} else {
		    status("<span style='color: red;'>Object not found?</span>");
		}
	    });
	} else {
	    var im = JS9.GetImage({display: display});

	    var coords = JS9.pix2wcs(im.raw.wcs, im.raw.header.NAXIS1/2, im.raw.header.NAXIS2/2).split(/ +/);

	    var c0     = JS9.PixToWCS(im.raw.header.NAXIS1/2+1, im.raw.header.NAXIS2/2+1, {display: im});
	    //var coords = c0.str.split(" ");

	    form.ra.value  = coords[0] || "";
	    form.dec.value = coords[1] || "";

	    var c1 = JS9.PixToWCS(1,                      im.raw.header.NAXIS2/2+1, {display: im});
	    var c2 = JS9.PixToWCS(im.raw.header.NAXIS1+1, im.raw.header.NAXIS2/2+1, {display: im});

	    form.width.value = Math.floor(Math.abs((c1.ra-c2.ra)*60)*Math.cos(c0.dec/57.2958)*10)/10;

	    c1 = JS9.PixToWCS(im.raw.header.NAXIS1/2+1, 1, {display: im});
	    c2 = JS9.PixToWCS(im.raw.header.NAXIS1/2+1, im.raw.header.NAXIS2+1, {display: im});

	    form.height.value = Math.floor(Math.abs((c1.dec-c2.dec)*60)*10)/10;
	}
    }

    function populateOptions(s) {
	var select = s[0];
	var dataArray = $(s).data("menu");
	var submenu   = $(s).data("submenu");

	select.options.length = 0;
	$.each(dataArray, function(index, data) {
	    select.options[select.options.length] = new Option(data.text, data.value);
	});

	

	if ( submenu !== undefined ) {

	    $(submenu).data("menu", dataArray[select.selectedIndex].subdata);
	    populateOptions(submenu);

	    s.change(function() {
		$(submenu).data("menu", dataArray[select.selectedIndex].subdata);
		populateOptions(submenu);
	    });
	}
    }

    function archInit() {

	var div = this.div;

	div.innerHTML = '<form class="JS9Archive-form">\
	    <select class="service-menu"></select>\
	    <select class="server-menu"></select>\
	    <select class="source-menu"></select>\
	    <span style="float: right;"><input type=button value="Set RA/Dec" class="get-ra-dec"><input type=button value="Retrieve Data" class="service-go"></span>	\
	    <p>											\
												\
	    <table width="98%">									\
	    <tr><td> Object: </td> <td> <input type=text name=object size=10> </td>		\
		<td></td>									\
		<td></td>									\
		<td>&nbsp;&nbsp;</td>								\
		<td> <input type=checkbox name=gzip> Use Compression</td>			\
	    </tr>										\
	    <tr><td> RA:  	</td><td>	<input type=text name=ra	size=10> </td>	\
		<td> Dec: 	</td><td>	<input type=text name=dec	size=10> </td>	\
		<td></td>									\
		<td> <input type=checkbox name=CORS checked> Use CORS Proxy</td>		\
	    <tr><td> Width: </td><td>	<input type=text name=width	size=10 value=15> </td>	\
		<td> Height: </td><td>	<input type=text name=height	size=10 value=15> </td>	\
	    </tr>										\
	    </table>										\
	    <div class=controls></div>								\
	    <p><span class=status></span>							\
	    </form>';

	var mtyp = $(div).find(".service-menu");
	var msrv = $(div).find(".server-menu");
	var msrc = $(div).find(".source-menu");

	$(mtyp).data("submenu", msrv);
	$(msrv).data("submenu", msrc);

	var display = this.display;

	$(div).find(".service-go").on("mouseup", function () { serviceGo(div, display); });
	$(div).find(".get-ra-dec").on("mouseup", function () { getRADec (div, display); });
	
	var imgmenu = [];
	$.each(Remote.Services, function(i, service) {
	    if ( service.type !== "image-service" ) { return; }

	    imgmenu.push({ text: service.params.text, value: service.params.value, subdata: service.params.surveys });
	});

	var catmenu = [];
	$.each(Remote.Services, function(i, service) {
	    if ( service.type !== "catalog-service" ) { return; }

	    catmenu.push({ text: service.params.text, value: service.params.value, subdata: service.params.surveys });
	});

	$(mtyp).data("menu", [ { text: "Image Servers",   value: "imgserv", subdata: imgmenu }
			     , { text: "Catalog Servers", value: "catserv", subdata: catmenu }]);

	populateOptions(mtyp);
    }

    JS9.RegisterPlugin("DataSources", "ArchivesCatalogs", archInit, {

	    menu:     "view",

	    menuItem: "Archives & Catalogs",
	    winTitle: "Archives & Catalogs",
	    winDims: [625, 175],

	    help:	"archive/archive.html"
    });

}());



},{"./catalog-services":3,"./image-services":5,"./remote-service":6,"./xhr":10}],2:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9 */

"use strict";


var RemoteService = require("./remote-service");

var Starbase = require("./starbase");
var strtod   = require("./strtod");
var template = require("./template");
var xhr      = require("./xhr");

function CatalogService(params) {
    RemoteService.Register(params.value, this);

    this.type   = "catalog-service";
    this.params = params;

    this.table2cat = function(im, table) {
	var i, j;
	var shape = this.params.shape;

	var xcol = table[this.params.xcol];
	var ycol = table[this.params.ycol];

	var wcol = 1;
	var hcol = 1;


	var pos_func = function(im, x, y) {
	    var coords = JS9.WCSToPix(x, y, {display: im});

	    if( coords ){
		return { x: coords.x, y: coords.y };
	    } else {
		return null;
	    }
	};
	var sizefunc;

	switch ( shape ) {
	 case "box":
	    sizefunc = function(row) {
		    return { width: 5, height: 5 };
		};
	    break;
	 case "circle":
	    sizefunc = function(row) {
		    return { radius: 2.5 };
		};
	    break;
	 case "ellipse":
	    sizefunc = function(row) {
		    return { width: 5, height: 5 };
		};
	    break;
	}

	var regs = [], pos, siz, reg;
	for ( i = 0, j = 0; i < table.data.length; i++ ) {
	    pos = pos_func(im, table.data[i][xcol]*15, table.data[i][ycol]);
	    if( !pos ){
		continue;
	    }
	    siz = sizefunc(im, table.data[i][wcol], table.data[i][hcol]);

	    reg = {   id: i.toString(), shape: shape
			, x: pos.x, y: pos.y
			, width: siz.width, height: siz.height, radius: siz.radius
			, angle: 0
		};

	    regs[j++] = reg;
	}

	return regs;
    };

    this.retrieve = function (values, messages) {

	this.params.calc(values);
	values.units = this.params.units;

	var url = template(this.params.url, values);
	
	var catalog = this;

	var reply = xhr({ url: url, title: "Catalog", status: messages, CORS: values.CORS }, function(e) {
	    var table = new Starbase(reply.responseText, { type: { default: strtod }, units: values.units });
	    var im    = JS9.GetImage({display: values.display});

	    JS9.NewShapeLayer(values.name, JS9.Catalogs.opts, {display: im});
	    JS9.RemoveShapes(values.name, {display: im});

	    var shapes = catalog.table2cat(im, table);

	    JS9.AddShapes(values.name, shapes, {color: "yellow"}, {display: im});
	});
    };
}

module.exports = CatalogService;



},{"./remote-service":6,"./starbase":7,"./strtod":8,"./template":9,"./xhr":10}],3:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals */

"use strict";

var strtod   = require("./strtod");

var CatalogService = require("./catalog-service");

	var saoCat = new CatalogService({
	      text:  "SAO"
	    , value: "saoCat"		
	    , surveys: [   { value: "tmc",	text: "Two Mass Catalog"	}
			 , { value: "gsc2",	text: "Guide Star Catalog 2"		}
			]
	    , url: "http://www.cfa.harvard.edu/catalog/scat?catalog={s}&ra={r}&dec={d}&width={w}&height={h}&system={e}&compress={c}"
	    , calc: function(values) {
		    if ( values.c ) {
			values.c = "gzip";
		    }
		    values.w    = values.w*60;
		    values.h    = values.h*60;
		    values.name = values.source + "@" + this.text;
		}

	    , shape: "circle"
	    , xcol:  "ra", ycol: "dec"
	
	});

	var vizCat = new CatalogService({
	      text: "Vizier"
	    , value: "vizCat"		
	    , surveys: [   { value: "II/246",		text: "2MASS"				}
			 , { value: "2MASX",		text: "2MASS Extended Source"		}
			 , { value: "B/DENIS",		text: "DENIS 3rd Release 2005"		}
			 , { value: "GLIMPSE",		text: "Spitzer's GLIMPSE"		}
			 , { value: "GSC2.3",		text: "GSC-II Catalog, Version 2.3.2"	}
			 , { value: "HIP2",		text: "Hipparcos (2007)"		}
			 , { value: "IRAS",		text: "IRAS "				}
			 , { value: "NVSS",		text: "NRAO VLA Sky Survey"		}
			 , { value: "SDSS-DR9",		text: "SDSS Photometric Catalog"	}
			 , { value: "Tycho-2",		text: "Tycho-2"				}
			 , { value: "UCAC4",		text: "UCAC 4th Release"		}
			 , { value: "USNO-A2",		text: "USNO-A2"				}
			 , { value: "USNO-B1",		text: "USNO-B1"				}
			 , { value: "WISE",		text: "WISE"				}
			]
	    , url: "http://vizier.u-strasbg.fr/viz-bin/asu-tsv?-source={s}&-out.add=_RAJ,_DEJ&-c={r}{d}&-c.bm={w}x{h}&-oc.form=s&-out.meta=h"
	    , calc: function(values) {
		    if ( values.c ) {
			values.c = "gzip";
		    }
		    //values.r = (strtod(values.r) * 15).toFixed(4);
		    //values.d =  strtod(values.d);
		    //values.d = (values.d < 0 ? "-" : "+" ) + values.d.toFixed(4);

		    values.name = values.source + "@" + this.text;
		}

	    , shape: "circle"
	    , xcol:  "_RAJ2000", ycol: "_DEJ2000"
	
	});

},{"./catalog-service":2,"./strtod":8}],4:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals xhr, Blob, JS9 */

"use strict";


var RemoteService = require("./remote-service");
var template      = require("./template");
var xhr           = require("./xhr");

function ImageService(params) {
    RemoteService.Register(params.value, this);

    this.type   = "image-service";
    this.params = params;

    this.retrieve = function (values, messages) {

	var display = values.display;

	params.calc(values);

	var url = template(params.url, values);

	
	xhr({ url: url, title: "Image", status: messages, type: 'blob', CORS: values.CORS }, function(e, xhr) {

	    if ( params.handler === undefined ) {
		var blob      = new Blob([xhr.response]);
		blob.name = values.name;

		JS9.fits.handleFITSFile(blob, { display: display });
	    } else {
	    	params.handler(e, xhr, params, values);
	    }
	});
    };
}

module.exports = ImageService;

},{"./remote-service":6,"./template":9,"./xhr":10}],5:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals */

"use strict";

var ImageService = require("./image-service");

	var imageName = function (values) {
	    var plus = "";
	    var name;

	    if ( values.name !== "" ) {
		name = values.source + "_" + values.name;
	    } else {
	        name = values.source + "_" + values.r + plus + values.d;
	    }
	    name = name.replace(/\s+/g,"_") + ".fits";

	    return name;
	};

	var saoDSS = new ImageService({
	      text: "DSS1@SAO"
	    , value: "saoDSS"
	    , surveys: [ { value: "DSS1", text: "DSS1" } ]
	    , url: "http://www.cfa.harvard.edu/archive/dss?r={r}&d={d}&w={w}&h={h}&e={e}&c={c}"
	    , calc: function(values) {
		    if ( values.c ) {
			values.c = "gzip";
		    }
		    values.name  = imageName(values);
		}
	});

	var stsDSS = new ImageService({
	      text: "DSS@STScI"
	    , value: "stsDSS"
	    , surveys: [   { value: "poss2ukstu_ir",	text: "STScI DSS2 IR"	}
			 , { value: "poss2ukstu_red",	text: "STScI DSS2 Red"	}
			 , { value: "poss2ukstu_blue",	text: "STScI DSS2 Blue"	}
			 , { value: "poss1_red", 	text: "STScI DSS1 Red"	}
			 , { value: "poss1_blue",	text: "STScI DSS1 Blue"	}
			]
	    , url: "http://stdatu.stsci.edu/cgi-bin/dss_search?r={r}&d={d}&w={w}&h={h}&e={e}&c={c}&v={s}&f=fits"
	    , calc: function(values) {
		    if ( values.c ) {
			values.c = "gz";
		    } else {
			values.c = "none";
		    }
		    values.name  = imageName(values);
		}
	});

	var esoDSS = new ImageService({
	      text: "DSS@ESO"
	    , value: "esoDSS"
	    , surveys: [   { value: "DSS2-infrared",	text: "ESO DSS2 IR"	}
			 , { value: "DSS2-red",    	text: "ESO DSS2 Red"	}
			 , { value: "DSS2-blue",	text: "ESO DSS2 Blue"	}
			 , { value: "DSS1",		text: "ESO DSS1"	}
			]
	    , url: "http://archive.eso.org/dss/dss?ra={r}&dec={d}&equinox=J2000&x={w}&y={h}&mime-type={c}&Sky-Survey={s}"
	    , calc: function(values) {
		    if ( values.c ) {
			values.c = "display/gz-fits";
		    } else {
			values.c = "application/x-fits";
		    }
		    values.name  = imageName(values);
		}
	});

	var ipac2m  = new ImageService({
	      text: "2Mass@IPAC"
	    , value: "ipac2m"
	    , surveys: [   { value: "j", 		text: "IPAC 2Mass J"		}
			 , { value: "h", 		text: "IPAC 2Mass H"		}
			 , { value: "k", 		text: "IPAC 2Mass K"		}
			]
	    , url: "http://irsa.ipac.caltech.edu/cgi-bin/Oasis/2MASSImg/nph-2massimg?objstr={r},{d}&size={radius}&band={s}"
	    , calc: function(values) {
		    values.radius = Math.floor(Math.sqrt(values.w*values.w+values.h*values.h)*60);
		    values.name   = imageName(values);
		}
	});

//	var dasch  = new ImageService({
//	      text: "DASCH"
//	    , value: "dasch"
//	    , surveys: [   { value: "plates", 		text: "Plates"		} ]
//
//	    , url: "http://dasch.rc.fas.harvard.edu/showtext.php?listflag=0&dateflag=dateform=j%20&coordflag=&radius=200&daterange=&seriesflag=&plateNumberflag=&classflag=&typeflag=%20-T%20wcsfit%20&pessimisticflag=&bflag=-j&nstars=5000&locstring=12:00:00%2030:00:00%20J2000"
//
//	    , calc: function(values) {
//		    values.radius = Math.min(Math.floor(Math.sqrt(values.w*values.w+values.h*values.h)*60), 600);
//		    values.name   = imageName(values);
//	    }
//
//	    , picker: "<input type=button value='pick' class='picker'>"
//	    , controls: "<tr>><td>Series</td>   <td><input type=text size=10 name=series></td>		\n\
//	    		      <td>Plate No</td> <td><input type=text size=10 name=plate></td>           \n\
//	    		      <td>Class</td>    <td><input type=text size=10 name=class></td></tr>      \n\
//	    		  <tr><td>Date From</td><td><input type=text size=10 name=datefr></td>          \n\
//	    		      <td>Date To</td>  <td><input type=text size=10 name=dateto></td></tr>      \n\
//			 "
//	    , handler: function (e, xhr, params, values) {
//
//	    }
//	});

//	var cds = new ImageService({
//	      text: "CDS Aladin Server"
//	    , value: "aladin@cds"
//	    , surveys: [   { value: "j", 		text: "IPAC 2Mass J"		}
//			 , { value: "h", 		text: "IPAC 2Mass H"		}
//			 , { value: "k", 		text: "IPAC 2Mass K"		}
//			]
//	    , url: "http://irsa.ipac.caltech.edu/cgi-bin/Oasis/2MASSImg/nph-2massimg?objstr={r},{d}&size={radius}&band={s}"
//	    , calc: function(values) {
//		    values.radius = Math.floor(Math.sqrt(values.w*values.w+values.h*values.h)*60);
//		    values.name   = imageName(values);
//		}
//	});

//	skyvew  = new ImageService({
//	      id: "skyvew"
//	    , "surveys", [ ]
//	    , url: "http://skys.gsfc.nasa.gov/cgi-bin/images?VCOORD={ra},{dec}&SURVEY={s}&SFACTR={size}&RETURN=FITS"
//	    , calc: function(values) {
//		    values.size = Math.floor((values.w+values.h)/2)
//		    values.name = values.name + "_" + values.source;
//		}
//	})


},{"./image-service":4}],6:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */

"use strict";


exports.Services = {};

exports.Register = function(name, obj) {
	exports.Services[name] = obj;
};

},{}],7:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */

"use strict";


function I(x) { return x; }

function starbase_Dashline(dash) {
    var i;

    for ( i = 0; i < dash.length; i++ ) {
	if ( dash[i].match(/^-+$/) === null ) {
	    return 0;
	}
    }

    return i;
}

function Starbase(data, options) {
    var i, j;

    this.head = {};
    this.type = [];
    this.data = [];

    data = data.replace(/\s+$/,"").split("\n");
    var line = 0;

    if ( options && options.skip ) {
	while ( data[line][0] === options.skip ) { line++; }
    }

    this.headline = data[line++].trim().split(/ *\t */);
    if ( options.units ) {
	this.unitline = data[line++].trim().split(/ *\t */);
    }
    this.dashline = data[line++].trim().split(/ *\t */);

    var dashes = starbase_Dashline(this.dashline);

    // Read lines until the dashline is found
    //
    while ( dashes === 0 || dashes !== this.headline.length ) {

	if ( !options.units ) {
	    this.headline = this.dashline;
	} else {
	    this.headline = this.unitline;
	    this.unitline = this.dashline;
	}

	this.dashline = data[line++].trim().split(/ *\t */);


	dashes = starbase_Dashline(this.dashline);
    }

    // Create a vector of type converters
    //
    for ( i = 0; i < this.headline.length; i++ ) {
	if ( options && options.type && options.type[this.headline[i]] ) {
	    this.type[i] = options.type[this.headline[i]];
	} else {
	    if ( options && options.type && options.type.default ) {
		this.type[i] = options.type.default;
	    } else {
		this.type[i] = I;
	    }
	}
    }

    // Read the data in and convert to type[]
    //
    for ( j = 0; line < data.length; line++, j++ ) {
	this.data[j] = data[line].split('\t');

	for ( i = 0; i < this.data[j].length; i++ ) {
	    this.data[j][i] = this.type[i](this.data[j][i]);
	}
    }

    for ( i = 0; i < this.headline.length; i++ ) {
	this[this.headline[i]] = i;
    }
}

module.exports = Starbase;


},{}],8:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals */ 

'use strict';

function Strtod(str) {
    var l = str.trim().split(/[: ]/);
    var x;

    if ( l.length === 3 ) {
	var sign = 1;

	if ( l[0].substr(0, 1) === "-" ) {
	    sign = -1;
	}

	var h = parseFloat(l[0]);
	var m = parseFloat(l[1]);
	var s = parseFloat(l[2]);

	x = sign * (Math.abs(h) + m/60.0 + s/3600.0);
    } else {
	x = parseFloat(str);
    }

    if ( isNaN(x) ) { return str; }

    return x;
}

module.exports = Strtod;

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
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals XMLHttpRequest */ 

'use strict';

    function xhr(params, func) {
	var status = params.status;
	var title = "";

	var corsurl = JS9.globalOpts.corsProxy || "http://js9.si.edu/cgi-bin/CORS-proxy.cgi";

	if ( params.CORS ) {
	    params.url = params.url.replace(/\?/g, "@");
	    params.url = params.url.replace(/&/g, "!");
	    //params.url = params.url.replace(/\+/g, "");

	    params.url = encodeURI(params.url);

	    params.url= corsurl + "?Q=" + params.url;
	}

	if( JS9.DEBUG > 1 ){
	    console.log("archive/catalog url: %s", params.url);
	}

	var _xhr = new XMLHttpRequest();

	_xhr.open('GET', params.url, true);

	if ( params.title ) {
	    title = params.title;
	}
	if ( params.type ) {
	    _xhr.responseType = params.type;
	}

	if ( status !== undefined ) {
	    
	    _xhr.addEventListener("progress"	, function(e) { status(title + " progress " + e.loaded.toString());	});
	    _xhr.addEventListener("error"	, function(e) { status(title + " service error"); 			});
	    _xhr.addEventListener("abort"	, function(e) { status(title + " service aborted"); 			});
	}
	_xhr.onload = function(e) {
	    if ( this.readyState === 4 ) {
		if ( this.status === 200 || this.status === 0 ) {
		    if ( status !== undefined ) { status(""); }
		    func(e, this);
		}
	    }
	};
	_xhr.send();

	return _xhr;
    }

module.exports = xhr;


},{}]},{},[1]);

/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9 */ 

"use strict";


(function() {

    function reBinImage(div, display) {

    JS9.debug = 2;

	var i, j;
	var im   = JS9.GetImage({display: display});
	var form = $(div).find(".binning-form")[0];

	if ( !im ) { return; }

	var options = $.extend(true, {}, JS9.fits.options
	    , { table: { cx: form.cx.value , cy: form.cy.value  
	    	       , nx: form.nx.value , ny: form.ny.value
		       , bin: form.bin.value , filter: form.filter.value }
	      });

	var hdu = im.raw.hdu;

	if ( hdu.type === "image" ) {

	  switch(JS9.fitsLibrary()){
	  case "fitsy":
	    var bin = Math.round(Number(form.bin.value));
	    hdu.bin        = bin;
	    form.bin.value = bin;

	    var nx = hdu.head["NAXIS1"]
	    var ny = hdu.head["NAXIS2"]

	    var xx = Math.round(nx/bin);
	    var yy = Math.round(ny/bin);

	    hdu.image = new Float32Array(nx*ny);

	    for ( j = 0; j < ny; j++ ) {
	    for ( i = 0; i < nx; i++ ) {
		hdu.image[Math.floor(j/bin)*xx+Math.floor(i/bin)] += hdu.filedata[j*nx+i];
	    }
	    }

	    hdu.dmin = Number.MAX_VALUE;
	    hdu.dmax = Number.MIN_VALUE;

	    for ( i = 0; i < xx*yy; i++ ) {
		hdu.dmin    = Math.min(hdu.dmin, hdu.image[i]);
		hdu.dmax    = Math.max(hdu.dmax, hdu.image[i]);
	    }

	    hdu.axis[1] = xx;
	    hdu.axis[2] = yy;
	    hdu.bitpix  = -32;

	    hdu.head  = Fitsy.clone(hdu.filehead);
	    hdu.card  = Fitsy.clone(hdu.filecard);

	    // Simple standard FITS WCS
	    //
	    Fitsy.cardcopy(hdu, "CDELT1",   hdu, "CDELT1", undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "CRPIX1",   hdu, "CRPIX1", undefined, function(x) { return x/bin; });
	    Fitsy.cardcopy(hdu, "CDELT2",   hdu, "CDELT2", undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "CRPIX2",   hdu, "CRPIX2", undefined, function(x) { return x/bin; });

	    // Adjust the CD Matrix
	    //
	    Fitsy.cardcopy(hdu, "CD1_1",    hdu, "CD1_1", undefined, function(x) { return x/bin; });
	    Fitsy.cardcopy(hdu, "CD1_2",    hdu, "CD1_2", undefined, function(x) { return x/bin; });
	    Fitsy.cardcopy(hdu, "CD2_1",    hdu, "CD2_1", undefined, function(x) { return x/bin; });
	    Fitsy.cardcopy(hdu, "CD2_2",    hdu, "CD2_2", undefined, function(x) { return x/bin; });


	    // DSS-II image - this is just a guess
	    //
	    Fitsy.cardcopy(hdu, "PLTSCALE", hdu, "PLTSCALE", undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "XPIXELSZ", hdu, "XPIXELSZ", undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "CNPIX1",   hdu, "CNPIX1",   undefined, function(x) { return x/bin; });
	    Fitsy.cardcopy(hdu, "YPIXELSZ", hdu, "YPIXELSZ", undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "CNPIX2",   hdu, "CNPIX2",   undefined, function(x) { return x/bin; });

	    // Fix up some random commonly used keywords
	    //
	    Fitsy.cardcopy(hdu, "PIXSCALE", hdu, "PIXSCALE", undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "SECPIX",   hdu, "SECPIX",   undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "SECPIX1",  hdu, "SECPIX1",  undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "SECPIX2",  hdu, "SECPIX2",  undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "XPIXSIZE", hdu, "XPIXSIZE", undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "YPIXSIZE", hdu, "YPIXSIZE", undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "PIXSCAL1", hdu, "PIXSCAL1", undefined, function(x) { return x*bin; });
	    Fitsy.cardcopy(hdu, "PIXSCAL2", hdu, "PIXSCAL2", undefined, function(x) { return x*bin; });

	    Fitsy.cardcopy(hdu, "LTM1_1",   hdu, "LTM1_1", 1.0, function(x) { return x/bin; });
	    Fitsy.cardcopy(hdu, "LTM1_2",   hdu, "LTM1_2", 0.0, function(x) { return x/bin; });
	    Fitsy.cardcopy(hdu, "LTM2_1",   hdu, "LTM2_1", 0.0, function(x) { return x/bin; });
	    Fitsy.cardcopy(hdu, "LTM2_2",   hdu, "LTM2_2", 1.0, function(x) { return x/bin; });

	    Fitsy.cardcopy(hdu, "LTV1",     hdu, "LTV1",   0.0, function(x) { return x/bin; });
	    Fitsy.cardcopy(hdu, "LTV2",     hdu, "LTV2",   0.0, function(x) { return x/bin; });

	    JS9.RefreshImage(hdu, {display: display});
	    break;
	    case "cfitsio":
	      JS9.error("image binning not yet implemented using cfitsio");
	      break;
          }
	} else {
	    switch(JS9.fitsLibrary()){
	    case "fitsy":
		Fitsy.readTableHDUData(hdu.fits, hdu, options, function(hdu){
	            JS9.RefreshImage(hdu, {display: display});
		});
		break;
	    case "cfitsio":
		JS9.fits.getFITSImage(hdu.fits, hdu, options, function(hdu){
		    JS9.RefreshImage(hdu, {display: display});
		});
		break;
	    }
	}
    }

    function getBinParams(div, display) {
	if ( display === undefined ) {
	    div     = this.div;
	    display = this.display;
	}
	var im   = JS9.GetImage({display: display});

	if ( im ) {
	    var form = $(div).find(".binning-form")[0];

	    if ( im.raw.hdu !== undefined ) {
		form.rebin.disabled = false;
		form.bin.disabled = false;

	        if ( im.raw.hdu.table !== undefined ) {
		    form.bin.value = im.raw.hdu.table.bin;
		     form.cx.value = im.raw.hdu.table.cx;
		     form.cy.value = im.raw.hdu.table.cy;
		     form.nx.value = im.raw.hdu.table.nx;
		     form.ny.value = im.raw.hdu.table.ny;
		     form.filter.value = im.raw.hdu.table.filter || "";


		     form.cx.disabled = false;
		     form.cy.disabled = false;
		     form.nx.disabled = false;
		     form.ny.disabled = false;
		     form.filter.disabled = false;
		} else {
		    if ( im.raw.hdu.bin != undefined ) {
			form.bin.value = im.raw.hdu.bin;
		    } else {
			form.bin.value = 1;
		    }

		     form.cx.disabled = true;
		     form.cy.disabled = true;
		     form.nx.disabled = true;
		     form.ny.disabled = true;
		     form.filter.disabled = true;
		}
	    } else {
		form.rebin.disabled = true;
		  form.bin.disabled = true;
	    }
	}
    }

    function binningInit() {
	var div = this.div;
	var display = this.display;
	var win = this.winHandle;
	var disclose = "";
	var im  = JS9.GetImage({display: this.display});

	if( !im || (im && (!im.raw.hdu || !im.raw.hdu.table)) ){
	    div.innerHTML = '<p><center>Binning is available for FITS binary tables.</center>';
	    return;
	}

	if( !win ){
	    disclose = 'disabled="disabled"';
	}

	$(div).html('<form class="binning-form" style="margin: 5px">				\
	    <table><tr>	<td>Bin&nbsp;Factor</td>							\
			<td><input type=text name=bin value=1 size=10 style="text-align:right;"></td>	\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td>Center</td>									\
			<td><input type=text name=cx size=10 style="text-align:right;"></td>		\
			<td><input type=text name=cy size=10 style="text-align:right;"></td>    	\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td>Image&nbsp;Size</td>								\
			<td><input type=text name=nx size=10 style="text-align:right;"></td>		\
			<td><input type=text name=ny size=10 style="text-align:right;"></td>		\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td>Filter</td>									\
			<td colspan="2"><input type=text name=filter size="24" style="text-align:left;"></td>	\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		   </tr>										\
		   <tr>											\
		       	<td><input type=button name=rebin value="Rebin" class="rebin-image"></td>	\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		       	<td><input type=button name=close value="Close" class="close-image" ' + disclose + '></td>	\
		   </tr>										\
	    </table>											\
	    </form>');

// 	click doesn't work on localhost on a Mac using Chrome/Safari, but mouseup does!
//	$(div).find(".rebin-image").on("click", function () { reBinImage(div, display); });
//	$(div).find(".close-image").on("click", function () { if( win ){ win.close(); } });
	$(div).find(".rebin-image").on("mouseup", function () { reBinImage(div, display); });
	$(div).find(".close-image").on("mouseup", function () { if( win ){ win.close(); } });

	if ( im ) {
	    getBinParams(div, display);
	}
    }

    JS9.RegisterPlugin("Fits", "Binning", binningInit, {
	    menu: "view",

            winTitle: "FITS Binary Table Binning",
	    winResize: true,

            menuItem: "Binning",

	    onplugindisplay:  binningInit,
	    onimageload:      binningInit,
	    onimagedisplay:   binningInit,

	    help:     "fitsy/binning.html",

            winDims: [400, 180],
    });
}());
/*
 * image blend module (February 25, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf */

// create our namespace, and specify some meta-information and params
JS9.Blend = {};
JS9.Blend.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Blend.NAME = "Blend";     // name of this plugin (2nd part of div class)
JS9.Blend.WIDTH =  512;	  // width of light window
JS9.Blend.HEIGHT = 270;	  // height of light window
JS9.Blend.BASE = JS9.Blend.CLASS + JS9.Blend.NAME;  // CSS base class name

JS9.Blend.blendModeHTML='When <b>Image Blending</b> is turned on, the images you select below will be combined using your chosen blend mode and optional opacity. See <a href="https://www.w3.org/TR/compositing-1/" target="blank">W3C Compositing and Blending</a> for info about compositing and blending.<p> <input type="checkbox" id="active" name="imageBlending" value="active" onclick="javascript:JS9.Blend.xblendmode(\'%s\', this)" checked><b>Image Blending</b>';

JS9.Blend.imageHTML="<span style='float: left'>$active &nbsp;&nbsp; $blend &nbsp;&nbsp; $opacity</span>&nbsp;&nbsp; <span id='blendFile'>$imfile</span>";

JS9.Blend.activeHTML='<input class="blendActiveCheck" type="checkbox" id="active" name="active" value="active" onclick="javascript:JS9.Blend.xactive(\'%s\', this)">blend using:';

JS9.Blend.blendHTML='<select class="blendModeSelect" onfocus="this.selectedIndex=0;" onchange="JS9.Blend.xblend(\'%s\',this)"><option selected disabled>blend mode</option><option value="normal">normal</option><option value="screen">screen</option><option value="multiply">multiply</option><option value="overlay">overlay</option><option value="darken">darken</option><option value="lighten">lighten</option><option value="color-dodge">color-dodge</option><option value="color-burn">color-burn</option><option value="hard-light">hard-light</option><option value="soft-light">soft-light</option><option value="difference">difference</option><option value="exclusion">exclusion</option><option value="hue">hue</option><option value="saturation">saturation</option><option value="color">color</option> <option value="luminosity">luminosity</option></select>';

JS9.Blend.opacityHTML='<select class="blendOpacitySelect" onfocus="this.selectedIndex=0;" onchange="JS9.Blend.xopacity(\'%s\',this)"><option selected disabled>opacity</option><option value="1.00">opaque</option><option value="0.95">0.95</option><option value="0.90">0.90</option><option value="0.85">0.85</option><option value="0.80">0.80</option><option value="0.75">0.75</option><option value="0.70">0.70</option><option value="0.65">0.65</option><option value="0.60">0.60</option><option value="0.55">0.55</option><option value="0.50">0.50</option><option value="0.45">0.45</option><option value="0.40">0.40</option><option value="0.35">0.35</option><option value="0.30">0.30</option><option value="0.25">0.25</option><option value="0.20">0.20</option><option value="0.10">0.10</option><option value="0.0">transparent</option></select>';

// JS9.Blend.imfileHTML='<input type="button" value="%s" onclick="javascript:JS9.Blend.ximfile(\'%s\', this)">';
JS9.Blend.imfileHTML='<b>%s</b>';

JS9.Blend.nofileHTML='<p><span id="blendNoFile">[Images will appear here as they are loaded]</span>';

// change active state
JS9.Blend.xactive = function(id, target){
    var im = JS9.lookupImage(id);
    var active = target.checked;
    if( im ){
	// change active mode
	im.blendImage(active);
    }
};

// change blend mode
JS9.Blend.xblend = function(id, target){
    var im = JS9.lookupImage(id);
    var blend = target.options[target.selectedIndex].value;
    if( im ){
	// change the blend mode
	if( blend !== "" ){
            im.blendImage(blend);
	}
    }
};

// change opacity
JS9.Blend.xopacity = function(id, target){
    var im = JS9.lookupImage(id);
    var opacity = target.options[target.selectedIndex].value;
    if( im ){
	// change opacity
	if( opacity !== "" ){
            im.blendImage(null, parseFloat(opacity));
	}
    }
};

// change current file
JS9.Blend.ximfile = function(id, target){
    var im = JS9.lookupImage(id);
    if( im ){
	// change "current" file to display
	im.displayImage();
    }
};

// change global blend mode for this display
JS9.Blend.xblendmode = function(id, target){
    var display = JS9.lookupDisplay(id);
    var blendMode = target.checked;
    // change global blend mode
    if( display ){
        JS9.BlendDisplay(blendMode, {display: display});
	$(".blendActive").prop("disabled", !blendMode);
    }
};

// get a BlendImage id based on the file image id
JS9.Blend.imid = function(im){
    return im.id
	.replace(/[^A-Za-z0-9_]/g, "_")
	+ "BlendImage";
};

// change the active image
JS9.Blend.activeImage = function(im){
    var id;
    if( im ){
	id = JS9.Blend.imid(im);
	$("." + JS9.Blend.BASE + "Image")
	    .removeClass(JS9.Blend.BASE + "ImageActive")
	    .addClass(JS9.Blend.BASE + "ImageInactive");
	$("#" + id)
	    .removeClass(JS9.Blend.BASE + "ImageInactive")
	    .addClass(JS9.Blend.BASE + "ImageActive");
    }
};

// add an image to the list of available images
JS9.Blend.addImage = function(im){
    var s, bl, id, divjq;
    var opts = [];
    if( !im ){
	return;
    }
    id = JS9.Blend.imid(im);
    // value to pass to the macro expander
    opts.push({name: "imid", value: im.id});
    opts.push({name: "active", value: sprintf(JS9.Blend.activeHTML, im.id)});
    opts.push({name: "opacity", value: sprintf(JS9.Blend.opacityHTML, im.id)});
    opts.push({name: "imfile", value: sprintf(JS9.Blend.imfileHTML, im.id, im.id)});
    opts.push({name: "blend", value: sprintf(JS9.Blend.blendHTML, im.id)});
    // remove initial message
    if( !this.blendDivs ){
	this.blendImageContainer.html("");
    }
    // create the html for this image
    s = JS9.Image.prototype.expandMacro.call(im, JS9.Blend.imageHTML, opts);
    // add image html to the image container
    divjq = $("<div>")
	.addClass(JS9.Blend.BASE + "Image")
	.addClass(JS9.Blend.BASE + "ImageActive")
	.attr("id", id)
	.prop("imid", im.id)
	.html(s)
	.appendTo(this.blendImageContainer);
    divjq.on("mousedown touchstart", function(evt){
	    im.displayImage();
	    JS9.Blend.activeImage.call(this, im);
    });
    // set the current options
    bl = im.blendImage();
    if( bl ){
	divjq.find(".blendActiveCheck").prop("checked", !!bl.active);
	if( bl.mode !== undefined ){
	    divjq.find(".blendModeSelect").val(bl.mode);
	}
	if( bl.opacity !== undefined ){
	    s = bl.opacity.toFixed(2);
	    divjq.find(".blendOpacitySelect").val(s);
	}
    }
    // one more div in the stack
    this.blendDivs++;
    //make it the current one
    JS9.Blend.activeImage(im);
};

// remove an image to the list of available images
JS9.Blend.removeImage = function(im){
    var id;
    if( im ){
	id = JS9.Blend.imid(im);
	$("#" + id).remove();
	this.blendDivs--;
	if( this.blendDivs === 0 ){
	    this.blendImageContainer.html(JS9.Blend.nofileHTML);
	}
	return true;
    }
    return false;
};

// constructor: add HTML elements to the plugin
JS9.Blend.init = function(){
    var i, im;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold image container and header
    var that = this;
    // clean main container
    this.divjq.html("");
    // no images/divs loaded yet
    this.blendDivs = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.blendContainer = $("<div>")
	.addClass(JS9.Blend.BASE + "Container")
	.attr("id", this.id + "BlendContainer")
	.appendTo(this.divjq);
    // header
    this.blendHeader = $("<div>")
	.addClass(JS9.Blend.BASE + "Header")
	.attr("id", this.display.id + "Header")
	.html(sprintf(JS9.Blend.blendModeHTML, this.display.id))
	.appendTo(this.blendContainer);
    // container to hold images
    this.blendImageContainer = $("<div>")
	.addClass(JS9.Blend.BASE + "ImageContainer")
	.attr("id", this.id + "BlendImageContainer")
        .html(JS9.Blend.nofileHTML)
	.appendTo(this.blendContainer);
    // start with blend mode turned on
    this.display.blendMode = true;
    // add currently loaded images
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( im.display === this.display ){
	    JS9.Blend.addImage.call(this, im);
	}
    }
    // the images within the image container will be sortable
    this.blendImageContainer.sortable({
	start: function(event, ui) {
	    this.oidx = ui.item.index();
	},
	stop: function(event, ui) {
	    var nidx = ui.item.index();
	    // JS9 image list reflects the sort
	    JS9.images.splice(nidx, 0, JS9.images.splice(this.oidx, 1)[0]);
	    // redisplay in case something changed
	    if( that.display.image ){
		that.display.image.displayImage();
	    }
	}
    });
};

// callback when an image is loaded
JS9.Blend.imageload = function(im){
    // im gives access to image object
    if( im ){
	JS9.Blend.addImage.call(this, im);
    }
};

// callback when image is displayed
JS9.Blend.imagedisplay = function(im){
    JS9.Blend.activeImage.call(this, im);
};

// callback when image is displayed
JS9.Blend.imageclose = function(im){
    JS9.Blend.removeImage.call(this, im);
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Blend.CLASS, JS9.Blend.NAME, JS9.Blend.init,
		   {menuItem: "Blending",
		    onplugindisplay: JS9.Blend.init,
		    onimageload: JS9.Blend.imageload,
		    onimagedisplay: JS9.Blend.imagedisplay,
		    onimageclose: JS9.Blend.imageclose,
		    help: "help/blend.html",
		    winTitle: "Image Blending",
		    winResize: true,
		    winDims: [JS9.Blend.WIDTH, JS9.Blend.HEIGHT]});

/*
 * image blink module (March 10, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf */

// create our namespace, and specify some meta-information and params
JS9.Blink = {};
JS9.Blink.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Blink.NAME = "Blink";     // name of this plugin (2nd part of div class)
JS9.Blink.WIDTH =  512;	  // width of light window
JS9.Blink.HEIGHT = 270;	  // height of light window
JS9.Blink.BASE = JS9.Blink.CLASS + JS9.Blink.NAME;  // CSS base class name

// blink rate in milliseconds
JS9.Blink.rate = 1000;

JS9.Blink.blinkModeHTML='When <b>Blink Images</b> is turned on, selected images will be displayed at the specified blink rate. You also can blink the selected images manually. The blink sequence can be changed by moving images around in the stack. <p>$mode&nbsp;&nbsp;&nbsp;&nbsp;$rate&nbsp;&nbsp;&nbsp;&nbsp;$manual';

JS9.Blink.modeHTML='<input type="checkbox" id="active" name="blinkImages" value="active" onclick="javascript:JS9.Blink.xblinkmode(\'%s\', this)"><b>Blink Images</b>';

JS9.Blink.rateHTML='<select id="blinkRateSelect" onfocus="this.selectedIndex=0;" onchange="JS9.Blend.xrate(\'%s\',this)"><option selected disabled>blink rate</option><option value="0.1">0.1</option><option value="0.25">0.25</option><option value="0.5">0.5</option><option value="1.0">1.0</option><option value="2.0">2.0</option><option value="3.0">3.0</option><option value="4.0">4.0</option><option value="5.0">5.0</option><option value="6.0">6.0</option><option value="7.0">7.0</option><option value="8.0">8.0</option><option value="9.0">9.0</option><option value="10.0">10.0</option><option value="15.0">15.0</option><option value="20.0">20.0</option><option value="30.0">30.0</option></select>';

JS9.Blink.manualHTML='<input type="button" id="manual" name="manualBlink" value="blink manually" onclick="javascript:JS9.Blink.xblink1(\'%s\', this)">';

JS9.Blink.imageHTML="<span style='float: left'>$active&nbsp;&nbsp;</span><span id='blinkFile'>$imfile</span>";

JS9.Blink.activeHTML='<input class="blinkActiveCheck" type="checkbox" id="active" name="active" value="active" onclick="javascript:JS9.Blink.xactive(\'%s\', this)">blink';

JS9.Blink.imfileHTML='<b>%s</b>';

JS9.Blink.nofileHTML='<p><span id="blinkNoFile">[Images will appear here as they are loaded]</span>';

// start blinking
JS9.Blink.start = function(display){
    var im;
    var done = false;
    var plugin = display.pluginInstances.JS9Blink;
    var saveidx = plugin.idx;
    while( !done ){
	im = JS9.images[plugin.idx];
	if( (im.display === display) && im.tmp.blinkMode ){
	    im.displayImage("display");
	    done = true;
	}
	if( ++plugin.idx >= JS9.images.length ){
	    plugin.idx = 0;
	}
	if( plugin.idx === saveidx ){
	    done = true;
	}
    }
    if( display.blinkMode ){
	JS9.Blink.tid = window.setTimeout(function(){
	    JS9.Blink.start(display);
	}, plugin.rate);
    }
};

// stop blinking
JS9.Blink.stop = function(display){
    if( JS9.Blink.tid ){
	window.clearTimeout(JS9.Blink.tid);
	delete JS9.Blink.tid;
    }
    display.blinkMode = false;
    display.pluginInstances.JS9Blink.idx = 0;
};

// change active state
JS9.Blink.xactive = function(id, target){
    var im = JS9.lookupImage(id);
    var active = target.checked;
    if( im ){
	im.tmp.blinkMode = active;
    }
};

// change current file
JS9.Blink.ximfile = function(id, target){
    var im = JS9.lookupImage(id);
    if( im ){
	// change "current" file to display
	im.displayImage();
    }
};

// change global blink mode for this display
JS9.Blink.xblinkmode = function(id, target){
    var display = JS9.lookupDisplay(id);
    var blinkMode = target.checked;
    // change global blink mode
    if( display ){
	$(".blinkActive").prop("disabled", !blinkMode);
	if( blinkMode ){
	    display.blinkMode = true;
	    JS9.Blink.start(display);
	} else {
	    JS9.Blink.stop(display);
	}
    }
};

// change global blink mode for this display
JS9.Blink.xblink1 = function(id, target){
    var display = JS9.lookupDisplay(id);
    var plugin = display.pluginInstances.JS9Blink;
    // blink once
    if( display ){
	if( JS9.images[plugin.idx] === display.image ){
	    if( ++plugin.idx >= JS9.images.length ){
		plugin.idx = 0;
	    }
	}
	JS9.Blink.start(display);
    }
};

// change blink rate
JS9.Blend.xrate = function(id, target){
    var rate = Math.floor(target.options[target.selectedIndex].value * 1000);
    var display = JS9.lookupDisplay(id);
    if( display ){
	var plugin = display.pluginInstances.JS9Blink;
	if( !isNaN(rate) ){
	    plugin.rate = rate;
	}
    }
};

// get a BlinkImage id based on the file image id
JS9.Blink.imid = function(im){
    return im.id
	.replace(/[^A-Za-z0-9_]/g, "_")
	+ "BlinkImage";
};

// change the active image
JS9.Blink.activeImage = function(im){
    var id;
    if( im ){
	id = JS9.Blink.imid(im);
	$("." + JS9.Blink.BASE + "Image")
	    .removeClass(JS9.Blink.BASE + "ImageActive")
	    .addClass(JS9.Blink.BASE + "ImageInactive");
	$("#" + id)
	    .removeClass(JS9.Blink.BASE + "ImageInactive")
	    .addClass(JS9.Blink.BASE + "ImageActive");
    }
};

// add an image to the list of available images
JS9.Blink.addImage = function(im){
    var s, id, divjq;
    var opts = [];
    if( !im ){
	return;
    }
    id = JS9.Blink.imid(im);
    // value to pass to the macro expander
    opts.push({name: "imid", value: im.id});
    opts.push({name: "active", value: sprintf(JS9.Blink.activeHTML, im.id)});
    opts.push({name: "imfile", value: sprintf(JS9.Blink.imfileHTML, im.id, im.id)});
    // remove initial message
    if( !this.blinkDivs ){
	this.blinkImageContainer.html("");
    }
    // create the html for this image
    s = JS9.Image.prototype.expandMacro.call(im, JS9.Blink.imageHTML, opts);
    // add image html to the image container
    divjq = $("<div>")
	.addClass(JS9.Blink.BASE + "Image")
	.addClass(JS9.Blink.BASE + "ImageActive")
	.attr("id", id)
	.prop("imid", im.id)
	.html(s)
	.appendTo(this.blinkImageContainer);
    divjq.on("mousedown touchstart", function(evt){
	    im.displayImage();
	    JS9.Blink.activeImage.call(this, im);
    });
    // one more div in the stack
    this.blinkDivs++;
    // no blinking yet
    im.tmp.blinkMode = false;
    //make it the current one
    JS9.Blink.activeImage(im);
};

// remove an image from the list of available images
JS9.Blink.removeImage = function(im){
    var id;
    if( im ){
	id = JS9.Blink.imid(im);
	$("#" + id).remove();
	this.blinkDivs--;
	if( this.blinkDivs === 0 ){
	    this.blinkImageContainer.html(JS9.Blink.nofileHTML);
	}
	delete im.tmp.blinkMode;
	return true;
    }
    return false;
};

// constructor: add HTML elements to the plugin
JS9.Blink.init = function(){
    var i, s, im;
    var opts = [];
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold image container and header
    var that = this;
    // initialize params
    if( this.idx === undefined ){
	this.idx = 0;
    }
    if( this.rate === undefined ){
	this.rate = JS9.Blink.rate;
    }
    // clean main container
    this.divjq.html("");
    // no images/divs loaded yet
    this.blinkDivs = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.blinkContainer = $("<div>")
	.addClass(JS9.Blink.BASE + "Container")
	.attr("id", this.id + "BlinkContainer")
        .css("overflow", "auto")
	.appendTo(this.divjq);
    opts.push({name: "mode", value: sprintf(JS9.Blink.modeHTML, 
					    this.display.id)});
    opts.push({name: "manual", value: sprintf(JS9.Blink.manualHTML, 
					    this.display.id)});
    opts.push({name: "rate", value: sprintf(JS9.Blink.rateHTML, 
					    this.display.id)});
    s = JS9.Image.prototype.expandMacro.call(null, JS9.Blink.blinkModeHTML, 
					     opts);
    // header
    this.blinkHeader = $("<div>")
	.addClass(JS9.Blink.BASE + "Header")
	.attr("id", this.display.id + "Header")
	.html(s)
	.appendTo(this.blinkContainer);
    // container to hold images
    this.blinkImageContainer = $("<div>")
	.addClass(JS9.Blink.BASE + "ImageContainer")
	.attr("id", this.id + "BlinkImageContainer")
        .html(JS9.Blink.nofileHTML)
	.appendTo(this.blinkContainer);
    // start with blink mode turned off
    this.display.blinkMode = false;
    // add currently loaded images
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( im.display === this.display ){
	    JS9.Blink.addImage.call(this, im);
	}
    }
    // the images within the image container will be sortable
    this.blinkImageContainer.sortable({
	start: function(event, ui) {
	    this.oidx = ui.item.index();
	},
	stop: function(event, ui) {
	    var nidx = ui.item.index();
	    // JS9 image list reflects the sort
	    JS9.images.splice(nidx, 0, JS9.images.splice(this.oidx, 1)[0]);
	    // redisplay in case something changed
	    if( that.display.image ){
		that.display.image.displayImage();
	    }
	}
    });
};

// callback when an image is loaded
JS9.Blink.imageload = function(im){
    // im gives access to image object
    if( im ){
	JS9.Blink.addImage.call(this, im);
    }
};

// callback when image is displayed
JS9.Blink.imagedisplay = function(im){
    JS9.Blink.activeImage.call(this, im);
};

// callback when image is displayed
JS9.Blink.imageclose = function(im){
    JS9.Blink.removeImage.call(this, im);
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Blink.CLASS, JS9.Blink.NAME, JS9.Blink.init,
		   {menuItem: "Blinking",
		    onplugindisplay: JS9.Blink.init,
		    onimageload: JS9.Blink.imageload,
		    onimagedisplay: JS9.Blink.imagedisplay,
		    onimageclose: JS9.Blink.imageclose,
		    help: "help/blink.html",
		    winTitle: "Image Blinking",
		    winResize: true,
		    winDims: [JS9.Blink.WIDTH, JS9.Blink.HEIGHT]});

/*
 * colorbar module (March 8, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf, Uint8Array */

// create our namespace, and specify some meta-information and params
JS9.Colorbar = {};
JS9.Colorbar.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Colorbar.NAME = "Colorbar";  // name of this plugin (2nd part of div class)
JS9.Colorbar.WIDTH =  512;	 // width of light window
JS9.Colorbar.HEIGHT = 40;	 // height of light window
JS9.Colorbar.BASE = JS9.Colorbar.CLASS + JS9.Colorbar.NAME;
// if TRUE, use psColors, otherwise use unscaled colorCells
JS9.Colorbar.SCALED = false;
// number of ticks in the colorbar
JS9.Colorbar.TICKS = 10;
// height of colorbar inside plugin
JS9.Colorbar.COLORBARHEIGHT = 16;
// JS9.Colorbar.COLORBARFONT = "11pt Arial";
// max label length before we start skipping some labels
JS9.Colorbar.MAXLABELSIZE = 10;

// redraw colorbar on display
JS9.Colorbar.display = function(im){
    var i, j, prec, idx, idx0, colorBuf, tval, ix, iy, done;
    var tlabels = [];
    var canvasWidth = this.colorbarWidth;
    var canvasHeight = this.colorbarHeight;
    var colorImg = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var colorData = colorImg.data;
    var colorWidth = canvasWidth * 4;
    var colorBuf0 = new Uint8Array(colorData.buffer, 0, colorWidth);
    // scaled or unscaled display?
    if( this.scaled ){
	colorBuf = im.psColors;
    } else {
	colorBuf = im.colorCells;
    }
    // first line gets colors from main display's rgb array
    idx0 = colorBuf.length / canvasWidth;
    for(i=0, j=0; i<canvasWidth; i++, j+=4){
	idx = Math.floor(i * idx0);
	colorData[j]   = colorBuf[idx][0];
	colorData[j+1] = colorBuf[idx][1];
	colorData[j+2] = colorBuf[idx][2];
	colorData[j+3] = 255;
    }
    // other lines get a copy of the first line
    for(i=1; i<canvasHeight; i++){
	colorData.set(colorBuf0, i * colorWidth);
    }
    // display colorbar
    this.ctx.putImageData(colorImg, 0, 0);
    // display tick marks
    idx0 = im.psInverse.length / this.ticks;
    // clear tick display
    this.textctx.clear();
    // get precision estimate
    prec = JS9.floatPrecision(im.psInverse[0], 
			      im.psInverse[im.psInverse.length-1]);
    // make labels, with a feeble attempt to avoid duplicates
    for(j=0; j<3; j++){
	done = true;
	// gather array of labels
	for(i=0; i<this.ticks; i++){
	    tval = im.psInverse[Math.floor(i*idx0)];
	    tlabels[i] = JS9.floatFormattedString(tval, prec+j, j);
	}
	// look for dups
	for(i=1; i<this.ticks; i++){
	    if( tlabels[i-1] === tlabels[i] ){
		done = false;
	    }
	}
	// done if no dups
	if( done ){
	    break;
	}
    }
    // draw tick marks and labels
    for(i=1; i<this.ticks; i++){
	// skip repeats
	if( (i > 1) && (tlabels[i] === tlabels[i-1]) ){
	    continue;
	}
	ix = (i/this.ticks)*this.width;
	iy = 0;
	this.textctx.textAlign = "center";
	this.textctx.beginPath();
	this.textctx.moveTo(ix, iy);
	this.textctx.lineWidth = 1;
	this.textctx.lineTo(ix, iy+5);
	this.textctx.stroke();
	// if the label is going to be wide, skip even ones
	if( (tlabels[i].length >= JS9.Colorbar.MAXLABELSIZE) && (i % 2 === 0) ){
	    continue;
	}
	this.textctx.fillText(tlabels[i], ix, iy+15);
    }
};

// constructor: add HTML elements to the plugin
JS9.Colorbar.init = function(){
    var ratio = JS9.PIXEL_RATIO || 1;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // set width and height of plugin itself
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = JS9.Colorbar.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.Colorbar.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // height of colorbar inside plugin
    this.colorbarWidth = this.width;
    this.colorbarHeight = parseInt(this.divjq.attr("data-colorbarHeight"), 10);
    if( !this.colorbarHeight ){
	this.colorbarHeight  = JS9.Colorbar.COLORBARHEIGHT;
    }
    // display scaled or unscaled colorbar?
    this.scaled = this.divjq.attr("data-scaled");
    if( this.scaled === undefined ){
	this.scaled  = JS9.Colorbar.SCALED;
    } else if( this.scaled === "true" ){
	this.scaled = true;
    } else {
	this.scaled = false;
    }
    this.ticks = this.divjq.attr("data-ticks");
    if( !this.ticks ){
	this.ticks = JS9.Colorbar.TICKS;
    }
    this.colorbarContainer = $("<div>")
	.addClass(JS9.Colorbar.BASE + "Container")
	.attr("id", this.id + "Container")
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    // main canvas
    this.colorbarjq = $("<canvas>")
	.addClass(JS9.Colorbar.BASE + "Canvas")
	.attr("id", this.id + "Canvas")
        .attr("width", this.width-1)
        .attr("height", this.colorbarHeight)
	.appendTo(this.colorbarContainer);
    this.ctx = this.colorbarjq[0].getContext("2d");
    // numeric text and tick marks
    // (height and width changes deal with HiDPI text blur problems!)
    this.textjq = $("<canvas>")
	.addClass(JS9.Colorbar.BASE + "TextCanvas")
	.attr("id", this.id + "TextCanvas")
        .attr("width", this.width * ratio)
        .attr("height", (this.height - this.colorbarHeight) * ratio)
        .css("width", this.width + "px")
        .css("height", (this.height - this.colorbarHeight) + "px")
	.appendTo(this.colorbarContainer);
    this.textctx = this.textjq[0].getContext("2d");
    // font specified in data property of div element?
    this.colorbarFont = this.divjq.attr("data-colorbarFont");
    if( this.colorbarFont ){
	this.textctx.font = this.colorbarFont;
    } else if( JS9.Colorbar.COLORBARFONT ){
	this.textctx.font = JS9.Colorbar.COLORBARFONT;
    }
    this.textctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // display current colorbar, if necessary
    if( this.display.image ){
	JS9.Colorbar.display.call(this, this.display.image);
    }
};

// callback when image is (re-)displayed
JS9.Colorbar.imagedisplay = function(im){
    if( im ){
	JS9.Colorbar.display.call(this, im);
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Colorbar.CLASS, JS9.Colorbar.NAME, JS9.Colorbar.init,
		   {menuItem: "Colorbar",
		    onimagedisplay: JS9.Colorbar.imagedisplay,
		    help: "help/colorbar.html",
		    winTitle: "Colorbar",
		    winDims: [JS9.Colorbar.WIDTH, JS9.Colorbar.HEIGHT]});
/*
 * FITS 3D cube plugin (April 29, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf, Uint8Array */

// create our namespace, and specify some meta-information and params
JS9.Cube = {};
JS9.Cube.CLASS = "JS9";  // class of plugins (1st part of div class)
JS9.Cube.NAME = "Cube";  // name of this plugin (2nd part of div class)
JS9.Cube.WIDTH = 512;	 // width of light window
JS9.Cube.HEIGHT = 170;	 // height of light window
JS9.Cube.BASE = JS9.Cube.CLASS + JS9.Cube.NAME;

JS9.Cube.cubeHTML="<div class='JS9CubeLinegroup'>$header</div><p><div class='JS9CubeLinegroup'><span class='JS9CubeSpan' style='float: left'>$range&nbsp;&nbsp;&nbsp;&nbsp;$value&nbsp;&nbsp;&nbsp;&nbsp;$extname</span><span class='JS9CubeSpan' style='float: right'>$order</span></div><div class='JS9CubeLinegroup'><span class='JS9CubeSpan' style='float: left'>$first&nbsp;$next&nbsp;$prev&nbsp;$last</span><span class='JS9CubeSpan' style='float: right'>$blink&nbsp;$stop&nbsp;$rate</span></div>";

JS9.Cube.headerHTML='Use the slider, text box, navigation or blink buttons to display a slice of a <b>FITS data cube</b>. Use the menu at the right to specify the slice axis.';

JS9.Cube.rangeHTML='<span class="JS9CubeRangeLine">1<input type="range" min="1" max="%s" value="%s" class="JS9CubeRange" onchange="JS9.Cube.xrange(\'%s\',this)">%s</span>';

JS9.Cube.valueHTML='<input type="text" class="JS9CubeValue" min="1" max="%s" value="%s" onchange="JS9.Cube.xvalue(\'%s\',this)" size="4">';

JS9.Cube.firstHTML='<input type="button" class=JS9CubeBtn" value="First" onclick="JS9.Cube.xfirst(\'%s\',this)">';

JS9.Cube.nextHTML='<input type="button" class=JS9CubeBtn" value="Next" onclick="JS9.Cube.xnext(\'%s\',this)">';

JS9.Cube.prevHTML='<input type="button" class=JS9CubeBtn" value="Prev" onclick="JS9.Cube.xprev(\'%s\',this)">';

JS9.Cube.lastHTML='<input type="button" class=JS9CubeBtn" value="Last" onclick="JS9.Cube.xlast(\'%s\',this)">';

JS9.Cube.blinkHTML='<input type="button" class=JS9CubeBtn" value="Blink" onclick="JS9.Cube.xstart(\'%s\',this)">';

JS9.Cube.stopHTML='<input type="button" class=JS9CubeBtn" value="Stop" onclick="JS9.Cube.xstop(\'%s\',this)">';

JS9.Cube.extnameHTML='<span class="JS9CubeRangeLine">%s</span>';

JS9.Cube.orderHTML='<select class="JS9CubeOrder" onchange="JS9.Cube.xorder(\'%s\',this)"><option value="$slice,*,*">$slice : * : *</option><option value="*,$slice,*">* : $slice : *</option><option value="*,*,$slice">* : * : $slice</option></select>';

JS9.Cube.rateHTML='<select class="JS9CubeRate" onchange="JS9.Cube.xrate(\'%s\',this)"><option selected disabled>Rate</option><option value=".5">0.5 sec</option><option value="1" default>1 sec</option><option value="2">2 sec</option><option value="5">5 sec</option></select>';

JS9.Cube.doSlice = function(im, slice, elarr){
    var i, s;
    var opts={};
    var plugin = im.display.pluginInstances[JS9.Cube.BASE];
    for(i=0; i<elarr.length; i++){
	$(elarr[i]).val(slice);
    }
    s = im.expandMacro(plugin.slice, [{name: "slice", value: slice}]);
    im.displaySlice(s, opts);
};

// change range
JS9.Cube.xrange = function(id, target){
    var slice;
    var im = JS9.lookupImage(id);
    if( im ){
	slice = parseInt(target.value, 10);
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue"]);
    }
};

// change slice value
JS9.Cube.xvalue = function(id, target){
    var slice;
    var im = JS9.lookupImage(id);
    if( im ){
	slice = parseInt(target.value, 10);
	JS9.Cube.doSlice(im, slice, [".JS9CubeRange"]);
    }
};

// first cube
JS9.Cube.xfirst = function(id, target){
    var slice;
    var im = JS9.lookupImage(id);
    if( im ){
	slice = 1;
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// next cube
JS9.Cube.xnext = function(id, target){
    var s, slice, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	slice = plugin.sval + 1;
	s = "NAXIS" + plugin.sidx;
	if( slice >  im.raw.header[s] ){
	    slice = 1;
	}
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// prev cube
JS9.Cube.xprev = function(id, target){
    var s, slice, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	slice = plugin.sval - 1;
	if( slice < 1 ){
	    s = "NAXIS" + plugin.sidx;
	    slice = im.raw.header[s];
	}
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// last cube
JS9.Cube.xlast = function(id, target){
    var s, slice, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	s = "NAXIS" + plugin.sidx;
	slice = im.raw.header[s];
	JS9.Cube.doSlice(im, slice, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// cube arrangement
JS9.Cube.xorder = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	plugin.slice = target.value;
	arr = plugin.slice.split(/[ ,:]/);
	for(i=0; i<arr.length; i++){
	    if( arr[i] !== "*" ){
		plugin.sidx = i+1;
		plugin.sval = 1;
		plugin.smax = im.raw.header["NAXIS"+plugin.sidx];
	    }
	}
	$(".JS9CubeRange").prop("max", plugin.smax);
	JS9.Cube.doSlice(im, plugin.sval, [".JS9CubeValue", ".JS9CubeRange"]);
    }
};

// blink
JS9.Cube.blink = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	if( plugin.blinkMode === false ){
	    delete plugin.blinkMode;
	    return;
	}
	JS9.Cube.xnext(im, target);
	if( plugin.blinkMode === undefined ){
	    plugin.blinkMode = true;
	} 
	JS9.Cube.tid = window.setTimeout(function(){
		JS9.Cube.blink(im, target);
	    }, plugin.rate);
    }
};

// start blink
JS9.Cube.xstart = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	if( !plugin.blinkMode ){
	    JS9.Cube.blink(id, target);
	}
    }
};

// stop blink
JS9.Cube.xstop = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	if( plugin.blinkMode ){
	    if( plugin.tid ){
		window.clearTimeout(plugin.tid);
		delete plugin.tid;
	    }
	    plugin.blinkMode = false;
	}
    }
};

// blink rate
JS9.Cube.xrate = function(id, target){
    var i, arr, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances[JS9.Cube.BASE];
	plugin.rate = Math.floor(parseFloat(target.value) * 1000);
    }
};

// constructor: add HTML elements to the plugin
JS9.Cube.init = function(){
    var i, s, im, arr;
    var opts = [];
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // set width and height of plugin itself
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = JS9.Cube.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.Cube.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // height of cube inside plugin
    this.cubeWidth = this.width;
    this.cubeHeight = parseInt(this.divjq.attr("data-cubeHeight"), 10);
    if( !this.cubeHeight ){
	this.cubeHeight  = JS9.Cube.CUBEHEIGHT;
    }
    // do we have an image?
    im = this.display.image;
    if( im ){
	if( im.slice ){
	    this.slice = im.slice.replace(/[0-9][0-9]*/,"$slice");
	    arr = im.slice.split(/[ ,:]/);
	    for(i=0; i<arr.length; i++){
		if( arr[i] !== "*" ){
		    this.sidx = i+1;
		    this.smax = im.raw.header["NAXIS"+this.sidx];
		    this.sval = parseInt(arr[i], 10);
		}
	    }
	} else {
	    this.slice = "*,*,$slice";
	    this.smax = im.raw.header.NAXIS3;
	    this.sidx = 3;
	    this.sval = 1;
	}
	if( !this.rate ){
	    this.rate = 1000;
	}
	if( this.tid !== undefined ){
	    window.clearTimeout(this.tid);
	    delete this.tid;
	}
	if( this.blinkMode !== undefined ){
	    delete this.blinkMode;
	}
	if( im.raw.header.NAXIS > 2 ){
	    opts.push({name: "header",  value: JS9.Cube.headerHTML});
	    opts.push({name: "range", 
		       value: sprintf(JS9.Cube.rangeHTML,
				      this.smax, this.sval, im.id, this.smax)});
	    opts.push({name: "value", 
		       value: sprintf(JS9.Cube.valueHTML, 
				      this.smax, this.sval, im.id)});
	    opts.push({name: "first", 
		       value: sprintf(JS9.Cube.firstHTML, im.id)});
	    opts.push({name: "next",
		       value: sprintf(JS9.Cube.nextHTML, im.id)});
	    opts.push({name: "prev",
		       value: sprintf(JS9.Cube.prevHTML, im.id)});
	    opts.push({name: "last",
		       value: sprintf(JS9.Cube.lastHTML, im.id)});
	    opts.push({name: "blink",
		       value: sprintf(JS9.Cube.blinkHTML, im.id)});
	    opts.push({name: "stop",
		       value: sprintf(JS9.Cube.stopHTML, im.id)});
	    opts.push({name: "extname",
		       value: sprintf(JS9.Cube.extnameHTML, 
				      im.raw.header.EXTNAME || "")});
	    opts.push({name: "order",
		       value: sprintf(JS9.Cube.orderHTML, im.id)});
	    opts.push({name: "rate",
		       value: sprintf(JS9.Cube.rateHTML, im.id)});
 	    s = im.expandMacro(JS9.Cube.cubeHTML, opts);
	} else {
	    s = "<p><center>This image is not a FITS data cube.</center>";
	}
    } else {
	    s = "<p><center>FITS cube processing will go here</center>";
    }
    // clear out old html
    this.divjq.html("");
    // set up new html
    this.cubeContainer = $("<div>")
	.addClass(JS9.Cube.BASE + "Container")
	.attr("id", this.id + "Container")
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    this.cubeContainer.html(s);
    // set current values
    $(".JS9CubeRange").prop("max", this.smax);
    $(".JS9CubeValue").prop("max", this.smax);
    $(".JS9CubeOrder").val(this.slice);
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Cube.CLASS, JS9.Cube.NAME, JS9.Cube.init,
		   {menuItem: "Data Cube",
		    onplugindisplay: JS9.Cube.init,
		    onimageload: JS9.Cube.init,
		    onimagedisplay: JS9.Cube.init,
		    help: "help/cube.html",
		    winTitle: "FITS Data Cubes",
		    winDims: [JS9.Cube.WIDTH, JS9.Cube.HEIGHT]});
/*
 * imarith module (March 8, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf, Uint8Array */

// create our namespace, and specify some meta-information and params
JS9.Imarith = {};
JS9.Imarith.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Imarith.NAME = "Imarith";  // name of this plugin (2nd part of div class)
JS9.Imarith.WIDTH =  512;	 // width of light window
JS9.Imarith.HEIGHT = 170;	 // height of light window
JS9.Imarith.BASE = JS9.Imarith.CLASS + JS9.Imarith.NAME;

JS9.Imarith.imageHTML="<div class='JS9ImarithLinegroup'>Choose an op (add, subtract, multiply, divide, min, max) and an operand (number or image) and click Run. Reset will revert to the original data.</div><div class='JS9ImarithLinegroup'><span class='JS9ImarithSpan' style='float: left'><b>$imid</b> &nbsp;&nbsp; $op &nbsp;&nbsp; $arg1 &nbsp;&nbsp; $num</span></div><p><div class='JS9ImarithLinegroup'><span class='JS9ImarithSpan' style='float: left'>$run</span><span style='float: right'>$reset</span></div>";

JS9.Imarith.opHTML='<select class=JS9ImarithOp" onchange="JS9.Imarith.xop(\'%s\',this)"><option value="" selected disabled>op</option><option value="add">add</option><option value="sub">sub</option><option value="mul">mul</option><option value="div">div</option><option value="min">min</option><option value="max">max</option></select>';

JS9.Imarith.arg1HTML='<select class=JS9ImarithArg1" onchange="JS9.Imarith.xarg1(\'%s\',this)"><option val="" selected disabled>operand</option><option value="num">number &#8594;</option>%s</select>';

JS9.Imarith.numHTML='<input type="text" class="JS9ImarithNum" value="" onchange="JS9.Imarith.xnum(\'%s\',this)" size="10" placeholder="number">';

JS9.Imarith.runHTML='<input type="button" class=JS9ImarithBtn" value="Run" onclick="JS9.Imarith.xrun(\'%s\',this)">';

JS9.Imarith.resetHTML='<input type="button" class=JS9ImarithBtn" value="Reset" onclick="JS9.Imarith.xreset(\'%s\',this)">';

// change op
JS9.Imarith.xop = function(id, target){
    var op = target.options[target.selectedIndex].value;
    var im = JS9.lookupImage(id);
    // save new op in instance record
    if( im && op ){
	im.display.pluginInstances.JS9Imarith.op = op;
    }
};

// change arg1
JS9.Imarith.xarg1 = function(id, target){
    var im = JS9.lookupImage(id);
    var arg1 = target.options[target.selectedIndex].value;
    // save new arg1 in instance record
    if( im && arg1 ){
	im.display.pluginInstances.JS9Imarith.arg1 = arg1;
	if( arg1 === "num" ){
	    $(".JS9ImarithNum").css("visibility", "visible");
	} else {
	    $(".JS9ImarithNum").css("visibility", "hidden");
	}
    }
};

// change num
JS9.Imarith.xnum = function(id, target){
    var im = JS9.lookupImage(id);
    var num = target.value;
    // save new num in instance record
    if( JS9.isNumber(num) ){
	im.display.pluginInstances.JS9Imarith.num = parseFloat(num);
    } else {
	if( num ){
	    JS9.error("please enter a real number: " + num);
	}
    }
};

// run image arithmetic
JS9.Imarith.xrun = function(id, target){
    var arg1, plugin;
    var im = JS9.lookupImage(id);
    if( im ){
	plugin = im.display.pluginInstances.JS9Imarith;
	if( !plugin.op || !plugin.arg1 ){
	    JS9.error("please select an operation and an operand");
	}
	if( plugin.arg1 === "num" ){
	    if( plugin.num === undefined ){
		JS9.error("please enter a real number for the operand");
	    }
	    arg1 = plugin.num;
	} else {
	    arg1 = plugin.arg1;
	}
	im.imarithData(plugin.op, arg1);
    }
};

// reset to original data
JS9.Imarith.xreset = function(id, target){
    var im = JS9.lookupImage(id);
    if( im ){
	im.imarithData("reset");
    }
};

// constructor: add HTML elements to the plugin
JS9.Imarith.init = function(){
    var i, s, im, tim;
    var images = "";
    var opts = [];
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // set width and height of plugin itself
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = JS9.Imarith.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.Imarith.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // height of imarith inside plugin
    this.imarithWidth = this.width;
    this.imarithHeight = parseInt(this.divjq.attr("data-imarithHeight"), 10);
    if( !this.imarithHeight ){
	this.imarithHeight  = JS9.Imarith.IMARITHHEIGHT;
    }
    // reset param values
    delete this.arg1;
    delete this.op;
    delete this.num;
    // do we have an image?
    im = this.display.image;
    if( im ){
	// make the last one
	this.lastim = im.id;
	// get list of images that can be operands (other than this one)
	for(i=0; i<JS9.images.length; i++){
	    tim = JS9.images[i];
	    if( tim !== im ){
		images += sprintf('<option value="%s">%s</option>', 
				  tim.id, tim.id);
	    }
	}
	// create the html for this image
	opts.push({name: "images", value: images});
	opts.push({name: "imid", value: im.id});
	opts.push({name: "op", value: sprintf(JS9.Imarith.opHTML, im.id)});
	opts.push({name: "arg1", value: sprintf(JS9.Imarith.arg1HTML, im.id, images)});
	opts.push({name: "num", value: sprintf(JS9.Imarith.numHTML, im.id)});
	opts.push({name: "run", value: sprintf(JS9.Imarith.runHTML, im.id)});
	opts.push({name: "reset", value: sprintf(JS9.Imarith.resetHTML,im.id)});
 	s = JS9.Image.prototype.expandMacro.call(im, JS9.Imarith.imageHTML,
						 opts);
    } else {
	s = "<p><center>image arithmetic will appear here</center>";
    }
    // clear out old html
    this.divjq.html("");
    // set up new html
    this.imarithContainer = $("<div>")
	.addClass(JS9.Imarith.BASE + "Container")
	.attr("id", this.id + "Container")
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    this.imarithContainer.html(s);
    this.imarithContainer.find(".JS9ImarithNum").css("visibility", "hidden");
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Imarith.CLASS, JS9.Imarith.NAME, JS9.Imarith.init,
		   {menuItem: "Imarith",
		    onplugindisplay: JS9.Imarith.init,
		    onimageload: JS9.Imarith.init,
		    onimagedisplay: JS9.Imarith.init,
		    help: "help/imarith.html",
		    winTitle: "Image Arithmetic",
		    winDims: [JS9.Imarith.WIDTH, JS9.Imarith.HEIGHT]});
/*
 * Multi-Extension FITS module (March 31, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf */

// create our namespace, and specify some meta-information and params
JS9.Mef = {};
JS9.Mef.CLASS = "JS9";    // class of plugins (1st part of div class)
JS9.Mef.NAME = "Mef";     // name of this plugin (2nd part of div class)
JS9.Mef.WIDTH =  800;	  // width of light window
JS9.Mef.HEIGHT = 240;	  // height of light window
JS9.Mef.BASE = JS9.Mef.CLASS + JS9.Mef.NAME;  // CSS base class name

// change global separate mode for this display
JS9.Mef.xseparate = function(id, target){
    var display = JS9.lookupDisplay(id);
    var separate = target.checked;
    // change separate mode for this instance
    if( display ){
	display.pluginInstances[JS9.Mef.BASE].separate = separate;
    }
};

// get an MefExtension id based on the file image id
JS9.Mef.imid = function(im, i, noext){
    var id = im.display.id + "_" + im.id;
    if( noext ){
	id = id.replace(/\[[a-zA-Z0-9][a-zA-Z0-9_]*\]/g,"");
    }
    return id
	.replace(/[^A-Za-z0-9_]/g, "_")
	+ "_MefExtension_" + i;
};

// change the active extension
JS9.Mef.activeExtension = function(im, i){
    var clas, classbase;
    if( im ){
	classbase = im.display.id + "_" + JS9.Mef.BASE;
	$("." + classbase + "Extension")
	    .removeClass(JS9.Mef.BASE + "ExtensionActive")
	    .addClass(JS9.Mef.BASE + "ExtensionInactive");
	clas = JS9.Mef.imid(im, i, true);
	$("." + clas )
	    .removeClass(JS9.Mef.BASE + "ExtensionInactive")
	    .addClass(JS9.Mef.BASE + "ExtensionActive");
    }
};

// constructor: add HTML elements to the plugin
JS9.Mef.init = function(){
    var i, im, id, clas, obj, s, sid, div, htmlString, classbase;
    var that = this;
    var addExt = function(o, s, k){
	var c, j;
	var got = "";
	var doit = true;
	switch(o.type){
	case "image":
	    // look for 2D image
	    if( o.naxes.length < 2 ){
		doit = false;
	    }
	    break;
	case "table":
	case "ascii":
	    // look for x and y columns
	    for(j=0; j<o.cols.length; j++){
		c = o.cols[j];
		if( c.name === "X" || c.name === "x" ){
		    got += "x";
		}
		if( c.name === "Y" || c.name === "y" ){
		    got += "y";
		}
	    }
	    if( got !== "xy" && got !== "yx" ){
		doit = false;
	    }
	    break;
	}
	if( doit ){
	    htmlString = "<pre>&nbsp;&nbsp;"+s+"</pre>";
	} else {
	    htmlString = "<pre>&nbsp;&nbsp;<span class='JS9MefStrike'><span>"+s+"</span></span></pre>";
	}
	id = JS9.Mef.imid(im, k);
	clas = JS9.Mef.imid(im, k, true);
	classbase = im.display.id + "_" + JS9.Mef.BASE;
	div = $("<div>")
	    .addClass(clas)
	    .addClass(classbase  + "Extension")
	    .addClass(JS9.Mef.BASE  + "Extension")
	    .addClass(JS9.Mef.BASE + "ExtensionInactive")
	    .attr("id", id)
	    .html(htmlString)
	    .appendTo(that.mefContainer);
	if( doit ){
	    div.on("mousedown touchstart", function(evt){
		im.displayExtension(o.hdu, {separate: that.separate});
		JS9.Mef.activeExtension(im, o.hdu);
	    });
	}
    };
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // clean main container
    this.divjq.html("");
    // add mef container to main
    this.mefContainer = $("<div>")
	.addClass(JS9.Mef.BASE + "Container")
	.attr("id", this.id + "MefContainer")
	.appendTo(this.divjq);
    // separate mode
    if( this.separate === undefined ){
	this.separate = false;
    }
    im  = this.display.image;
    if( !im ){
	this.mefContainer.html("<p><center>FITS HDU extensions will be displayed here.</center>");
	return;
    }
    if( !im.hdus ){
	this.mefContainer.html("<p><center>FITS HDU extensions are not present in this image.</center>");
	return;
    }
    // reset main container
    s = sprintf("<div class='%s'><span><b>Click on a FITS HDU extension to display it:</b></span>", JS9.Mef.BASE + "Header");
    // add the checkbox for displaying each extension separately
    sid = JS9.Mef.imid(im, "Separate");
    s += sprintf('<span style="float: right"><input type="checkbox" id="%s" name="separate" value="separate" onclick="javascript:JS9.Mef.xseparate(\'%s\', this)"><b>Display each extension as a separate image</b></span></div>', sid, this.display.id);
    this.mefContainer.html(s);
    // add a formatted string for each extension
    for(i=0; i<im.hdus.length; i++){
	obj = im.hdus[i];
	s = JS9.hdus2Str([obj]).trim();
	addExt(obj, s, i);
    }
    $("#" + sid).prop("checked", this.separate);
    // make the currently displayed extension active
    if( im.raw.hdu.fits.extnum !== undefined ){
	JS9.Mef.activeExtension(im, im.raw.hdu.fits.extnum);
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Mef.CLASS, JS9.Mef.NAME, JS9.Mef.init,
		   {menuItem: "Extensions",
		    help: "help/mef.html",
		    onplugindisplay: JS9.Mef.init,
		    onimageload: JS9.Mef.init,
		    onimagedisplay: JS9.Mef.init,
		    winTitle: "Multi-Extension FITS",
		    winResize: true,
		    winDims: [JS9.Mef.WIDTH, JS9.Mef.HEIGHT]});

/*
 * action mousetouch module (May 19, 2016)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf */

// use when running jslint
// "use strict";

// create our namespace, and specify some meta-information and params
JS9.MouseTouch = {};
JS9.MouseTouch.CLASS = "JS9";       // class of plugin
JS9.MouseTouch.NAME = "MouseTouch"; // name of this plugin 
JS9.MouseTouch.WIDTH =  512;	    // width of light window
JS9.MouseTouch.HEIGHT = 220;	    // height of light window
JS9.MouseTouch.BASE = JS9.MouseTouch.CLASS + JS9.MouseTouch.NAME;

JS9.MouseTouch.mouseText = [];
JS9.MouseTouch.mouseText[0] = "move mouse, no buttons pressed:";
JS9.MouseTouch.mouseText[1] = "move mouse, primary button pressed:";
JS9.MouseTouch.mouseText[2] = "move mouse, secondary button pressed:";

JS9.MouseTouch.touchText = [];
JS9.MouseTouch.touchText[0] = "touch move, with one finger:";
JS9.MouseTouch.touchText[1] = "touch move, with two fingers:";
JS9.MouseTouch.touchText[2] = "touch move, with three fingers:";

JS9.MouseTouch.textHTML="<div style='float: left'>%s</div>";

JS9.MouseTouch.actionHTML="<div style='float: left'><b>%s</b></div>";

// get an id based on the action
JS9.MouseTouch.actionid = function(cname, aname){
    return (cname + "_" + aname).replace(/[^A-Za-z0-9_]/g, "_");
};

// add to the text descriptions
JS9.MouseTouch.addText = function(container, text){
    var s, divjq;
    // create the html for this action
    s = sprintf(JS9.MouseTouch.textHTML, text);
    // add text html to the text container
    divjq = $("<div>")
	.addClass(JS9.MouseTouch.BASE + "Text")
	.html(s)
	.appendTo(container);
    return divjq;
};

// add to the sortable action list
JS9.MouseTouch.addAction = function(container, cname, aname){
    var s, id, divjq;
    id = JS9.MouseTouch.actionid(cname, aname);
    // create the html for this action
    s = sprintf(JS9.MouseTouch.actionHTML, aname);
    // add action html to the action container
    divjq = $("<div>")
	.addClass(JS9.MouseTouch.BASE + "Action")
	.attr("id", id)
	.html(s)
	.appendTo(container);
    return divjq;
};

// display value/position
JS9.MouseTouch.isPinch = function(im, evt){
    var npinch = JS9.globalOpts.pinchWait;
    var pthresh = JS9.globalOpts.pinchThresh;
    var i, display, dist, pinc, pdec;
    // sanity check
    if( !im ){
	return -1;
    }
    display = im.display;
    if( !display.mousetouchZoom || (im.pos.touches.length !== 2) ){
	return -1;
    }
    switch(display.ispinch ){
    case -1:
    case 1:
	return display.ispinch;
    }
    dist = Math.sqrt(((im.pos.touches[0].x - im.pos.touches[1].x)  *
		      (im.pos.touches[0].x - im.pos.touches[1].x))  +
		     ((im.pos.touches[0].y - im.pos.touches[1].y)  *
		      (im.pos.touches[0].y - im.pos.touches[1].y)));
    if( !display.dist0 ){
	 display.dist0 = dist;
    }
    display.deltas.push(Math.floor(dist - display.dist0));
    if( display.deltas.length >= npinch ){
	for(i=1, pinc=0, pdec=0; i<npinch; i++){
	    if(  display.deltas[i] > display.deltas[i-1] ){
		pinc++;
	    } else if(  display.deltas[i] < display.deltas[i-1] ){
		pdec++;
	    }
	}
	if( (pinc >= pthresh) || (pdec >= pthresh) ){
	    display.ispinch = 1;
	} else {
	    display.ispinch = -1;
	}
	display.lastzoom = 0;
	return display.ispinch;
    }
    // not sure yet
    return 0;
};

// ---------------------------------------------------------------------
//
// MouseTouch.Actions: callbacks when on mouse or touch movement
//
// for mouse: no click, primary click, secondary click
// for touch: 1, 2, or 3 fingers down
//
// the mouseActions and touchActions arrays in JS9.globalOpts determine
// the initial mapping of mouse/touch configuration to callback, e.g.:
//
//  JS9.globalOpts.mouseActions = ["display value/position", "change contrast/bias", "pan the image"];
//
// You can add your own to the Actions object, with titles in mouseText ...
// They are transferred to the display object.
//
// ---------------------------------------------------------------------
JS9.MouseTouch.Actions = {};

// display value/position
JS9.MouseTouch.Actions["display value/position"] = function(im, ipos, evt){
    // display pixel and wcs values
    if( JS9.globalOpts.internalValPos && im && ipos ){
	if( (ipos.x > 0) && (ipos.y > 0) &&
	    (ipos.x < im.raw.width) && (ipos.y < im.raw.height) ){
	    im.valpos = im.updateValpos(ipos, true);
	}
    }
};

// change contrast/bias
JS9.MouseTouch.Actions["change contrast/bias"] = function(im, ipos, evt){
    var x, y, pos;
    var display = im.display;
    // skip contrast/bias change?
    if( !JS9.globalOpts.internalContrastBias || !im || !ipos ){
	return;
    }
    // inside a region or with special key: no contrast/bias
    if( im.clickInRegion || JS9.specialKey(evt) ){
	return;
    }
    // static RGB image: no contrast/bias
    if( im.rgbFile ){
	return;
    }
    // get canvas position
    pos = JS9.eventToDisplayPos(evt);
    // contrast/bias change
    x = Math.floor(pos.x + 0.5);
    y = Math.floor(pos.y + 0.5);
    if( (x < 0) || (y < 0) ||
	(x >= display.canvas.width) || (y >= display.canvas.height) ){
	return;
    }
    im.params.bias = x / display.canvas.width;
    im.params.contrast = y / display.canvas.height * 10.0;
    // work-around for FF bug, not fixed as of 8/8/2012
    // https://bugzilla.mozilla.org/show_bug.cgi?id=732621
    if( JS9.bugs.firefox_linux ){
	window.setTimeout(function(){
	    im.displayImage("scaled", {blendMode: false});
	}, 0);
    } else {
	im.displayImage("scaled", {blendMode: false});
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	im.xeqPlugins("image", "onchangecontrastbias");
    }
};

// stop action for contrast/bias: redisplay image
JS9.MouseTouch.Actions["change contrast/bias"].stop = function(im, ipos, evt){
    // if blendMode is on, we have to redisplay
    if( im.display.blendMode ){
	im.displayImage("rgb");
    }
};

// zoom the image
JS9.MouseTouch.Actions["wheel zoom"] = function(im, evt){
    var nzoom, display;
    var delta = evt.originalEvent.deltaY;
    // sanity checks
    if( !im ){
	return;
    }
    // is scroll to zoom turned on?
    display = im.display;
    if( !display.mousetouchZoom ){
	return;
    }
    // scroll by the delta
    if( delta > 0 ){
	nzoom = Math.min(JS9.MAXZOOM, im.getZoom() + JS9.ADDZOOM);
    } else {
	nzoom = Math.max(JS9.MINZOOM, im.getZoom() - JS9.ADDZOOM);
    }
    // a little rounding makes the zoom nicer
    nzoom = Math.round((nzoom + 0.00001) * 100) / 100;
    // zoom the image
    im.setZoom(nzoom);
};

// pan the image
JS9.MouseTouch.Actions["pan the image"] = function(im, ipos, evt){
    var x, y;
    // sanity check
    if( !im ){
	return;
    }
    x = im.rgb.sect.xcen + ((im.pos0.x - im.pos.x) / im.rgb.sect.zoom);
    y = im.rgb.sect.ycen - ((im.pos0.y - im.pos.y) / im.rgb.sect.zoom);
    im.setPan(x, y);
    im.pos0 = im.pos;
};

// pinch zoom
JS9.MouseTouch.Actions.pinch = function(im, ipos, evt){
    var display, dist, nzoom;
    // sanity checks
    if( !im ){
	return;
    }
    // is scroll to zoom turned on?
    display = im.display;
    // get current distance
    dist = Math.sqrt(((im.pos.touches[0].x - im.pos.touches[1].x)  *
		      (im.pos.touches[0].x - im.pos.touches[1].x)) +
		      ((im.pos.touches[0].y - im.pos.touches[1].y)  *
		       (im.pos.touches[0].y - im.pos.touches[1].y)));
    nzoom = display.zoom0 * dist / display.dist0;
    // a little rounding makes the zoom nicer
    nzoom = Math.max(JS9.MINZOOM, Math.min(JS9.MAXZOOM, Math.round((nzoom + 0.00001) * 100) / 100));
    // zoom the image
    if( nzoom !== display.lastzoom ){
	im.setZoom(nzoom);
    }
    display.lastzoom = nzoom;
};

// start of mouse/touch action processing
JS9.MouseTouch.Actions.start = function(im, ipos, evt){
    var display, action;
    if( im ){
	display = im.display;
	display.ispinch = 0;
	display.dist0 = 0;
	display.zoom0 = im.rgb.sect.zoom;
	display.deltas = [];
    }
    action = JS9.MouseTouch.getAction(im, evt);
    // call the start mouse/touch action, if necessary
    if( JS9.MouseTouch.Actions[action] && 
	JS9.MouseTouch.Actions[action].start ){
	JS9.MouseTouch.Actions[action].start(im, im.ipos, evt);
    }
};

// end of mouse/touch action processing
JS9.MouseTouch.Actions.stop = function(im, ipos, evt){
    var action = JS9.MouseTouch.getAction(im, evt);
    // call the stop mouse/touch action, if necessary
    if( JS9.MouseTouch.Actions[action] &&
	JS9.MouseTouch.Actions[action].stop ){
	JS9.MouseTouch.Actions[action].stop(im, im.ipos, evt);
    }
    return;
};

// get action associated with the current clickState
JS9.MouseTouch.getAction = function(im, evt){
    var action, display;
    // sanity check
    if( !im ){
	return action;
    }
    display = im.display;
    switch(im.clickState){
	// mouse move actions
    case 0:
	action = display.mouseActions[0];
	break;
    case 1:
	action = display.mouseActions[1];
	break;
    case 2:
	action = display.mouseActions[2];
	break;
	// touch event actions
    case -1:
	action = display.touchActions[0];
	break;
    case -2:
	switch( JS9.MouseTouch.isPinch(im, evt) ){
	case -1:
	    action = display.touchActions[1];
	    break;
	case 0:
	    // do nothing, no idea if its a pinch yet
	    break;
	case 1:
	    action = "pinch";
	    break;
	}
	break;
    case -3:
	action = display.touchActions[2];
	break;
    default:
	break;
    }
    return action;
};

// execute the mouse/touch action routine
JS9.MouseTouch.action = function(im, evt, action){
    action = action || JS9.MouseTouch.getAction(im, evt);
    // call the mouse/touch action
    if( action && JS9.MouseTouch.Actions[action] ){
	JS9.MouseTouch.Actions[action](im, im.ipos, evt);
    }
};

// change zoom mode for this display
JS9.MouseTouch.mousetouchzoom = function(id, target){
    var display = JS9.lookupDisplay(id);
    var mode = target.checked;
    // change global blink mode
    if( display ){
	display.mousetouchZoom = mode;
    }
};

// constructor: add HTML elements to the plugin
JS9.MouseTouch.init = function(){
    var i, s;
    var that = this;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold action container and header
    // clean main container
    this.divjq.html("");
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.mousetouchContainer = $("<div>")
	.addClass(JS9.MouseTouch.BASE + "Container")
	.attr("id", this.id + "MouseTouchContainer")
	.appendTo(this.divjq);
    s = sprintf("<div class='%s'><span><b>Drag an action to reconfigure JS9 mouse/touch events:</b></span><p>", JS9.MouseTouch.BASE + "Header");
    this.mousetouchHeadContainer = $("<span style='float: left'>")
	.addClass(JS9.MouseTouch.BASE + "Container")
	.attr("id", this.id + "MouseTouchHeadContainer")
        .html(s)
	.appendTo(this.mousetouchContainer);
    this.mousetouchTextContainer = $("<span style='float: left'>")
	.addClass(JS9.MouseTouch.BASE + "Container")
	.attr("id", this.id + "MouseTouchTextContainer")
	.appendTo(this.mousetouchContainer);
    this.mousetouchActionContainer = $("<span style='float: left'>")
	.addClass(JS9.MouseTouch.BASE + "Container")
	.attr("id", this.id + "MouseTouchActionContainer")
	.appendTo(this.mousetouchContainer);
    if( JS9.TOUCHSUPPORTED ){
	// container to hold text descriptions
	this.mousetouchTouchTextContainer = $("<div>")
	    .addClass(JS9.MouseTouch.BASE + "TextContainer")
	    .attr("id", this.id + "TouchTextContainer")
            .html("")
	    .appendTo(this.mousetouchTextContainer);
	for(i=0; i<JS9.MouseTouch.touchText.length; i++){
            JS9.MouseTouch.addText.call(this, 
					this.mousetouchTouchTextContainer,
					JS9.MouseTouch.touchText[i]);
	}
	for(i=JS9.MouseTouch.touchText.length; 
	    i<this.display.touchActions.length ; i++){
            JS9.MouseTouch.addText.call(this, 
					this.mousetouchMouseTextContainer,
					"&nbsp;");
	}
	// container to hold touch actions
	this.mousetouchTouchContainer = $("<div>")
	    .addClass(JS9.MouseTouch.BASE + "ActionContainer")
	    .attr("id", this.id + "TouchContainer")
            .html("")
	    .appendTo(this.mousetouchActionContainer);
	// add touch actions, if necessary
	for(i=0; i<this.display.touchActions.length; i++){
	    s = this.display.touchActions[i];
            JS9.MouseTouch.addAction.call(this, this.mousetouchTouchContainer, 
					  "touch", s);
	}
	// the actions within the action container will be sortable
	this.mousetouchTouchContainer.sortable({
	    start: function(event, ui) {
		this.oidx = ui.item.index();
	    },
	    stop: function(event, ui) {
		var nidx = ui.item.index();
		var oarr = that.display.touchActions.splice(this.oidx, 1)[0];
		// JS9 action list reflects the sort
		that.display.touchActions.splice(nidx, 0, oarr);
	    }
	});
    }
    if(  !/iPad|iPhone|iPod/.test(navigator.platform) ){
	// container to hold text descriptions
	this.mousetouchMouseTextContainer = $("<div>")
	    .addClass(JS9.MouseTouch.BASE + "TextContainer")
	    .attr("id", this.id + "MouseTextContainer")
	    .appendTo(this.mousetouchTextContainer);
	for(i=0; i< 3; i++){
            JS9.MouseTouch.addText.call(this, 
					this.mousetouchMouseTextContainer,
					JS9.MouseTouch.mouseText[i]);
	}
	for(i=3; i<this.display.mouseActions.length ; i++){
            JS9.MouseTouch.addText.call(this, 
					this.mousetouchMouseTextContainer,
					"&nbsp;");
	}
	// container to hold mouse actions
	this.mousetouchMouseContainer = $("<div>")
	    .addClass(JS9.MouseTouch.BASE + "ActionContainer")
	    .attr("id", this.id + "MouseContainer")
            .html("")
	    .appendTo(this.mousetouchActionContainer);
	// add mouse actions, if necessary
	for(i=0; i<this.display.mouseActions.length; i++){
	    s = this.display.mouseActions[i];
            JS9.MouseTouch.addAction.call(this, this.mousetouchMouseContainer, 
					  "mouse", s);
	}
	// the actions within the action container will be sortable
	this.mousetouchMouseContainer.sortable({
	    start: function(event, ui) {
		this.oidx = ui.item.index();
	    },
	    stop: function(event, ui) {
		var nidx = ui.item.index();
		var oarr = that.display.mouseActions.splice(this.oidx, 1)[0];
		// JS9 action list reflects the sort
		that.display.mouseActions.splice(nidx, 0, oarr);
	    }
	});
    }
    // add the footer, containing buttons
    s = sprintf("<p><div class='%s'>use mouse wheel or pinch to zoom:&nbsp;&nbsp;<input type='checkbox' value='1' onclick='javascript:JS9.MouseTouch.mousetouchzoom(\"%s\", this);'></div>", JS9.MouseTouch.BASE + "Footer", this.display.id);
    this.mousetouchFootContainer = $("<span style='float: left'>")
	.addClass(JS9.MouseTouch.BASE + "Container")
	.attr("id", this.id + "MouseTouchFootContainer")
        .html(s)
	.appendTo(this.mousetouchContainer);
    // set initial value of scroll
    if( this.display.mousetouchZoom ){
	this.mousetouchContainer.find("input").attr("checked", true);
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.MouseTouch.CLASS, JS9.MouseTouch.NAME, 
		   JS9.MouseTouch.init,
		   {menuItem: "Mouse/Touch",
		    onplugindisplay: JS9.MouseTouch.init,
		    help: "help/mousetouch.html",
		    winTitle: "Mouse/Touch Actions",
		    winResize: true,
		    winDims: [JS9.MouseTouch.WIDTH, JS9.MouseTouch.HEIGHT]});
/*
 * JS9 preferences module (14 April 2015)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, jQuery, JS9, sprintf, ddtabcontent */

// To specify the JS9 display instance to link to a given PREFS div,
// use the HTML5 dataset syntax: 
//    <div class="JS9Prefs" data-js9id="JS9"></div>

// create our namespace, and specify some meta-information and params
JS9.Prefs = {};
JS9.Prefs.CLASS = "JS9";        // class of plugins (1st part of div class)
JS9.Prefs.NAME = "Preferences"; // name of this plugin (2nd part of div class)
JS9.Prefs.WIDTH =  750;         // default width of window
JS9.Prefs.HEIGHT = 250;	        // default height of window

JS9.Prefs.imagesSchema = {
    "title": "Image Preferences",
    "description": "preferences for each JS9 image",
    "properties": {
	"colormap": {
	    "type": "string",
	    "helper": "default color map"
	},
	"contrast": {
	    "type": "number",
	    "helper": "default color contrast"
	},
	"bias": {
	    "type": "number",
	    "helper": "default color bias"
	},
	"scale": {
	    "type": "string",
	    "helper": "default scale algorithm"
	},
	"scaleclipping": {
	    "type": "string",
	    "helper": "'dataminmax' or 'zscale'"
	},
	"zscalecontrast": {
	    "type": "number",
	    "helper": "default from ds9"
	},
	"zscalesamples": {
	    "type": "number",
	    "helper": "default from ds9"
	},
	"zscaleline": {
	    "type": "number",
	    "helper": "default from ds9"
	},
	"exp": {
	    "type": "number",
	    "helper": "default exp value for scaling"
	},
	"wcssys": {
	    "type": "string",
	    "helper": "default WCS sys"
	},
	"wcsunits": {
	    "type": "string",
	    "helper": "default WCS units"
	},
	"lcs": {
	    "type": "string",
	    "helper": "default logical coordinate system"
	},
	"alpha": {
	    "type": "number",
	    "helper": "alpha for images"
	},
	"alpha1": {
	    "type": "number",
	    "helper": "alpha for masked pixels"
	},
	"alpha2": {
	    "type": "number",
	    "helper": "alpha for unmasked pixels"
	},
	"zoom": {
	    "type": "number",
	    "helper": "default zoom factor"
	},
	"zooms": {
	    "type": "number",
	    "helper": "how many zooms in each direction?"
	},
	"nancolor": {
	    "type": "string",
	    "helper": "6-digit #hex color for NaN values"
	},
	"listonchange": {
	    "type": "boolean",
	    "helper": "list after a region change?"
	},
	"valpos": {
	    "type": "boolean",
	    "helper": "display value/position?"
	},
	"invert": {
	    "type": "boolean",
	    "helper": "by default, invert colormap?"
	}

    }
};
    
JS9.Prefs.regionsSchema = {
    "title": "Region Preferences",
    "description": "preferences for each JS9 region",
    "type": "object",
    "properties": {
	"iradius": {
	    "type": "number",
	    "helper": "annulus: initial inner radius"
	},
	"oradius": {
	    "type": "number",
	    "helper": "annulus: initial outer radius"
	},
	"nannuli": {
	    "type": "number",
	    "helper": "annulus: initial number of annuli"
	},
	"width": {
	    "type": "number",
	    "helper": "box: initial width"
	},
	"height": {
	    "type": "number",
	    "helper": "box: initial height"
	},
	"radius": {
	    "type": "number",
	    "helper": "circle: initial radius"
	},
	"r1": {
	    "type": "number",
	    "helper": "ellipse: initial radius1"
	},
	"r2": {
	    "type": "number",
	    "helper": "ellipse: initial radius2"
	},
	"ptshape": {
	    "type": "string",
	    "helper": "point shape: box, circle, ellipse"
	},
	"ptsize": {
	    "type": "number",
	    "helper": "point size"
	},
	"points": {
	    "type": "string",
	    "helper": "array of x,y relative positions"
	},
	"angle": {
	    "type": "number",
	    "helper": "box, ellipse: initial angle in degrees"
	},
	"tags": {
	    "type": "string",
	    "helper": "initial tags for a region"
	},
	"strokeWidth": {
	    "type": "number",
	    "helper": "region stroke width"
	},
	"fontFamily": {
	    "type": "string",
	    "helper": "region font"
	},
	"fontSize": {
	    "type": "string",
	    "helper": "region font size"
	},
	"fontStyle": {
	    "type": "string",
	    "helper": "region font style"
	},
	"fontWeight": {
	    "type": "string",
	    "helper": "region font weight"
	},
	"textAlign": {
	    "type": "string",
	    "helper": "text alignment"
	}
    }
};

// schema for each source
JS9.Prefs.fitsSchema = {
    "title": "FITS Preferences",
    "description": "FITS preferences in JS9",
    "properties": {
	"extlist": {
	    "type": "string",
	    "helper": "default binary table extensions"
	},
	"xdim": {
	    "type": "string",
	    "helper": "x dimension of extracted image"
	},
	"ydim": {
	    "type": "string",
	    "helper": "y dimension of extracted image"
	},
    }
};

// display schema for the page
JS9.Prefs.displaysSchema = {
    "title": "Display Preferences",
    "description": "preferences for each JS9 display in this page",
    "properties": {
	"mouseActions": {
	    "type": "object",
	    "helper": "array of mouse actions"
	},
	"touchActions": {
	    "type": "object",
	    "helper": "array of touch actions"
	},
	"mousetouchZoom": {
	    "type": "boolean",
	    "helper": "scroll/pinch to zoom?"
	},
    }
};

// source object for preferences
JS9.Prefs.sources = [
    {name: "images",   schema: JS9.Prefs.imagesSchema},
    {name: "regions",  schema: JS9.Prefs.regionsSchema},
    {name: "fits",     schema: JS9.Prefs.fitsSchema},
    {name: "displays", schema: JS9.Prefs.displaysSchema}
];

// init preference plugin
JS9.Prefs.init = function(width, height){
    var i, s, obj, key, props, sources, source, id, pid, html, prompt;
    // create the div containing one tab for each of the sources
    sources = JS9.Prefs.sources;
    pid = this.id + 'prefsTabs';
    html = "<div style='padding: 8px'>";
    html += sprintf("<div id='%s' class='indentmenu'>\n", pid);
    html += "<ul>";
    // create a tab for each source
    for(i=0; i<sources.length; i++){
	source = sources[i];
	id = this.id + JS9.Prefs.CLASS + JS9.Prefs.NAME + source.name;
	html += sprintf("  <li><a href='#' rel='%s'>%s</a></li>\n", 
			id + "Div", source.name);
    }
    html += "</ul>";
    html += "<br style='clear:left'/></div></div><p>\n";
    // create each param form (displayed by clicking each tab)
    for(i=0; i<sources.length; i++){
	source = sources[i];
	id = this.id + JS9.Prefs.CLASS + JS9.Prefs.NAME + source.name;
	// source-specific pre-processing
	switch( source.name ){
	case "images":
	    source.data = JS9.imageOpts;
	    break;
	case "regions":
	    source.data = JS9.Regions.opts;
	    break;
	case "fits":
	    // make up "nicer" option values from raw object
	    source.data = {extlist: JS9.fits.options.extlist,
			   xdim: JS9.fits.options.table.nx, 
			   ydim: JS9.fits.options.table.ny};
	    break;
	case "displays":
	    source.data = {mouseActions: JS9.globalOpts.mouseActions,
			   touchActions: JS9.globalOpts.touchActions,
			   mousetouchZoom: JS9.globalOpts.mousetouchZoom};
	    break;
	default:
	    break;
	}
	html += sprintf("<div id='%s' class='tabcontent'>", id + "Div");
	html += sprintf("<form id='%s' class='js9AnalysisForm' style='max-height: %spx; overflow: hidden'>", id + "Form", this.height-90);
	props = source.schema.properties;
	for( key in props ){
	    if( props.hasOwnProperty(key) ){
		obj = props[key];
		prompt = obj.prompt || key + ":";
		switch(obj.type){
		case "boolean":
		    if( source.data[key] ){
			s = "checked";
		    } else {
			s = "";
		    }
		    html += sprintf("<div class='linegroup'><span class='column_R1'><b>%s</b></span><span class='column_R2'><input type='checkbox' name='%s' value='true' %s></span><span class='column_R4l'>%s</span></div>", prompt, key, s, obj.helper);
		    break;
		default:
		    if( typeof source.data[key] === "object" ){
			s = JSON.stringify(source.data[key]);
		    } else {
			s = source.data[key];
		    }
		    html += sprintf("<div class='linegroup'><span class='column_R1'><b>%s</b></span><span class='column_R2l'><input type='text' name='%s' class='text_R' value='%s'/></span><span class='column_R4l'>%s</span></div>", prompt, key, s, obj.helper);
		    break;
		}
	    }
	}
	html += "<input id='" + this.id + "_applyPrefs' name='Apply' type='button' class='button' value='Apply' onclick='JS9.Prefs.applyForm.call(this);' style='margin: 8px'>";
	// manage stored preferences
	if( window.hasOwnProperty("localStorage") ){
	    html += "<input id='" + this.id + "_savePrefs' name='Save' type='button' class='button' value='Save' onclick='JS9.Prefs.saveForm.call(this)' style='margin: 8px'>";
	    html += "<input id='" + this.id + "_showPrefs' name='Show' type='button' class='button' value='Show Saved' onclick='JS9.Prefs.showForm.call(this)' style='margin: 8px'>";
	    html += "<input id='delete' name='Delete' type='button' class='button' value='Delete Saved' onclick='JS9.Prefs.deleteForm.call(this)' style='margin: 8px'>";
	}
	// light windows get a close button
	if( this.winType === "light" ){
	    html += "<input id='" + this.id + "_closePrefs' name='Close' type='button' class='button' value='Close' onclick='var form = $(this).closest(\"form\"); var winid = form.data(\"winid\"); winid.close(); return false;' style='float: right; margin: 8px'>";
	}
	html += "</form>";
	html += "</div>";
    }
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // set the html for this div
    this.divjq.html(html);
    // for each source, set data values that we will need in button callbacks
    for(i=0; i<sources.length; i++){
	source = sources[i];
	id = this.id + JS9.Prefs.CLASS + JS9.Prefs.NAME + source.name;
	$( "#" + id + "Form").data("display", this.display);
	$( "#" + id + "Form").data("source", source);
	if( this.winType === "light" ){
	    $( "#" + id + "Form").data("winid", this.winHandle);
	}
    }
    // now init the tab content
    this.tabs = new ddtabcontent(pid); //enter ID of Tab Container
    this.tabs.setpersist(false); //toogle persistence of the tabs' state
    this.tabs.setselectedClassTarget("link"); //"link" or "linkparent"
    this.tabs.init();
};

// action for Apply in Form
JS9.Prefs.applyForm = function(){
    var form = $(this).closest("form");
    var arr = form.serializeArray();
    var display = form.data("display");
    var source = form.data("source");
    var winid = form.data("winid");
    arr = arr.concat($("#" + form.attr("id") + " input[type=checkbox]:not(:checked)").map(function(){
	return {"name": this.name, "value": "false"};
    }).get());
    JS9.Prefs.processForm(source, arr, display, winid);
    return false;
};

// action for Save in Form
JS9.Prefs.saveForm = function(){
    var form = $(this).closest("form");
    var source = form.data("source");
    JS9.Prefs.applyForm.call(this);
    try{ localStorage.setItem(source.name, JSON.stringify(source.data,null,2));
	 JS9.userOpts[source.name] = localStorage.getItem(source.name); }
    catch(e){ JS9.error("could not save prefs: " + source.name); }
    return false;
};

// action for Show in Form
JS9.Prefs.showForm = function(){
    var s, t;
    var form = $(this).closest("form");
    var source = form.data("source");
    try{ s = localStorage.getItem(source.name); }
    catch(ignore){}
    if( s && (s !== "null") ){
	t = "<pre>" + s + "</pre>";
    } else {
	t = sprintf("<p><center>No saved prefs: %s</center>", source.name);
    }
    JS9.lightWin("savedPrefs" + JS9.uniqueID(), "inline", t, 
		 "Saved prefs: "+source.name, 
		 JS9.lightOpts[JS9.LIGHTWIN].textWin);
    return false;
};

// action for Delete in Form
JS9.Prefs.deleteForm = function(){
    var form = $(this).closest("form");
    var source = form.data("source");
    try{ localStorage.removeItem(source.name);
	delete JS9.userOpts[source.name]; }
    catch(ignore){}
    return false;
};

// process new preferences in the preference form
JS9.Prefs.processForm = function(source, arr, display, winid){
    var i, j, key , val, obj, rlayer;
    var len = arr.length;
    // source-specific pre-processing
    switch( source.name ){
    case "images":
	obj = JS9.imageOpts;
	break;
    case "regions":
	obj = JS9.Regions.opts;
	break;
    case "fits":
	obj = JS9.fits.options;
	break;
    case "displays":
	obj = JS9.globalOpts;
	break;
    }
    for(i=0; i<len; i++){
	key = arr[i].name;
	val = arr[i].value;
	switch( typeof obj[key] ){
	case "boolean":
	    if( val === "true" ){
		val = true;
	    }
	    if( val === "false" ){
		val = false;
	    }
	    break;
	case "number":
	    val = parseFloat(val);
	    break;
	case "object":
	    val = JSON.parse(val);
	    break;
	default:
	    break;
	}
	if( obj[key] !== val ){
	    switch( source.name ){
	    case "images":
		// set new option value
	        obj[key] = val;
	        break;
	    case "regions":
		// set new option value
	        obj[key] = val;
		// change option value in each display's region layer as well
		for(j=0; j<JS9.displays.length; j++){
		    rlayer = JS9.displays[j].layers.regions;
		    if( rlayer ){
			rlayer.opts[key] = val;
		    }
		}
		break;
	    case "fits":
	        // put our "nicer" option values back into raw object
	        // note that the values are still strings
	        switch(key){
 	        case "xdim":
		    obj.table.nx = parseFloat(val);
	            break;
	        case "ydim":
		    obj.table.ny = parseFloat(val);
	            break;
	        default:
	            obj[key] = val;
	            break;
	        }
		source.data[key] = val;
	        break;
	    case "displays":
	        // put our "nicer" option values back into raw object
	        JS9.globalOpts[key] = val;
		// change option value in this display as well
		for(j=0; j<JS9.displays.length; j++){
		    JS9.displays[j][key] = val;
		}
		source.data[key] = val;
		break;
	    default:
		// set new option value
	        obj[key] = val;
	        break;
	    }
	}
    }
};

// add preference plugin into JS9
JS9.RegisterPlugin(JS9.Prefs.CLASS, JS9.Prefs.NAME, JS9.Prefs.init,
		   {menuItem: "Preferences",
		    help: "help/prefs.html",
		    winTitle: "User Preferences",
		    winResize: true,
		    winDims: [JS9.Prefs.WIDTH, JS9.Prefs.HEIGHT]});
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


},{"./mask.js":1,"./template":12,"typed-array-function":4,"typed-array-ops":5,"typed-array-rotate":8,"typed-numeric-uncmin":10}],1:[function(require,module,exports){
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


},{"./raster":11}],2:[function(require,module,exports){
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

},{"iota-array":3}],3:[function(require,module,exports){
"use strict"

function iota(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = i
  }
  return result
}

module.exports = iota
},{}],4:[function(require,module,exports){
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
	    prd *= a;
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


},{"ndarray-nobuffer":2}],5:[function(require,module,exports){
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
	    sum += a;
	// ----
	return sum;
    });
    ops.prod = typed(function (a) {
	var prd = 1;
	// ----
	    prd *= a;
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
	    norm2 += a*a;
	// ----    
	return norm2;
    });
    ops.norm2 = function (a) { return Math.sqrt(ops.norm2Squared(a)); };

	//norm1
	//norminf

	//argmin
	//argmax

}());
 

},{"typed-array-function":4}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"ndarray-linear-interpolate":6,"typed-array-function":4}],8:[function(require,module,exports){
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

},{"typed-array-warp":7}],9:[function(require,module,exports){
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


},{"typed-array-function":4}],10:[function(require,module,exports){


var numeric =                         require("typed-array-function");
    numeric = numeric.extend(numeric, require("typed-array-ops"));
    numeric = numeric.extend(numeric, require("typed-matrix-ops"));

//9. Unconstrained optimization
exports.gradient = function gradient(f,x) {
    var n = x.length;
    var f0 = f(x);
    if(isNaN(f0)) throw new Error('gradient: f(x) is a NaN!');
    var i,x0 = numeric.clone(x),f1,f2, J = Array(n);
    var errest,roundoff,max = Math.max,eps = 1e-3,abs = Math.abs, min = Math.min;
    var t0,t1,t2,it=0,d1,d2,N;
    for(i=0;i<n;i++) {
        var h = max(1e-6*f0,1e-8);
        while(1) {
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
            if(errest>eps) { h/=16; }
            else break;
            }
    }
    return J;
}
exports.uncmin = function uncmin(f,x0,tol,gradient,maxit,callback,options) {
    var grad = exports.gradient;
    if(typeof options === "undefined") { options = {}; }
    if(typeof tol === "undefined") { tol = 1e-8; }
    if(typeof gradient === "undefined") { gradient = function(x) { return grad(f,x); }; }
    if(typeof maxit === "undefined") maxit = 1000;
    x0 = numeric.clone(x0);
    var n = x0.length;
    var f0 = f(x0),f1,df0;
    if(isNaN(f0)) throw new Error('uncmin: f(x0) is a NaN!');
    var max = Math.max, norm2 = numeric.norm2;
    tol = max(tol,numeric.epsilon);
    var step,g0,g1,H1 = options.Hinv || numeric.identity(n);
    var dot = numeric.dot, sub = numeric.sub, add = numeric.add, ten = numeric.tensor, div = numeric.div, mul = numeric.mul;

    var all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
    var it=0,i,s,x1,y,Hy,Hs,ys,i0,t,nstep,t1,t2;
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
}

},{"typed-array-function":4,"typed-array-ops":5,"typed-matrix-ops":9}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{}]},{},[]);

/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9 */ 

"use strict";


(function() {
    var imexam = require("./imexam");

    var encen_template = " 						\
    	<div style='position:absolute;right: 10px;bottom:50px'>		\
        <table>								\
	    <tr><td>ee50</td><td align=right>{ee50%.2f}</td><tr>	\
	    <tr><td>ee80</td><td align=right>{ee80%.2f}</td><tr>	\
        </table>							\
	</div>";

    function energUpdate(im, xreg) {
        var div = this.div;

	    var imag = imexam.getRegionData(im, xreg);

            var backgr  = imexam.imops.backgr(imag, 4).value;
            var data    = imexam.ndops.assign(imexam.ndops.zeros(imag.shape), imag);

            imexam.ndops.subs(data, imag, backgr);

            var qcenter  = imexam.ndops.qcenter(data);
            var centroid = imexam.ndops.centroid(data, qcenter);

	    var encen = imexam.imops.encen(data, [centroid.ceny, centroid.cenx]);

	    var stat       = {};
	    stat.ee80  = imexam.ndops.indexof(encen, 0.80);
	    stat.ee50  = imexam.ndops.indexof(encen, 0.50);

	    var edata = [];
	    var i;

	    for ( i = 0;  i < encen.shape[0]; i++ ) {
		edata[i] = [i, encen.get(i)];
	    }

            $(div).empty();
	    var plot = $.plot(div, [edata]
		    , { selection: { mode: "xy" } });

	    $(div).append(imexam.template(encen_template, stat));
    }

    function energInit() {
	imexam.fixupDiv(this);
        $(this.div).append("Create a region to see encircled energy<br>");
    }

    JS9.RegisterPlugin("ImExam", "EncEnergy", energInit, {
	    menu: "analysis",

            menuItem: "Encircled Energy",
            winTitle: "Encircled Energy",
	    help:     "imexam/imexam.html#enener",

	    toolbarSeparate: true,

            onregionschange: energUpdate,
            winDims: [250, 250],
    });

}());
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, continue: true */
/*globals $, JS9, greg */ 

"use strict";


(function () {
    var imexam = require("./imexam");

/*
    $("table").delegate('td','mouseover mouseleave', function(e) {
	if (e.type == 'mouseover') {
	    $(this).parent().addClass("hover");
	    $("colgroup").eq($(this).index()).addClass("hover");
	} else {
	    $(this).parent().removeClass("hover");
	    $("colgroup").eq($(this).index()).removeClass("hover");
	}
    });
 */

    function strrep(str, n, x) {
        var i;
	var rx = new RegExp(x, "g");

	var s = '';
	for ( i = 0; i < n; i++ ) {
	    s += str.replace(rx, i);
	}
	return s;
    }

    function htmlTable(x, y) {
	var t = "<table cellpadding=0 cellspacing=0>";

	t      += strrep( "<tr>"
		+ strrep("<td ><input class='col%x row%y' type=entry size=6 name=cell%y.%x value=0></td>", x, "%x") 
		+ "</tr>\n", y, "%y");
	t    += "</table>";

	return t;
    }


  //   $(this).css({"font-size" : newFontSize, "line-height" : newFontSize/1.2 + "px"});

    function pxtablUpdate(im, point) {
            var im_2d   = imexam.ndops.ndarray(im.raw.data, [im.raw.height, im.raw.width]);
	    var i = 0, j = 0;
	    var x, y;


	    var pxtabl = $(this.div).find(".pxtabl")[0];

	    pxtabl["cell" + j + "." + i].value = "col\\row";

	    j = 0;
	    for ( i = 1; i < 10; i++ ) {
		x = point.x + i - 5;

		if ( x > 0 && x <= im.raw.width ) {
		    pxtabl["cell" + j + "." + i].value = x.toFixed(0);
		} else {
		    pxtabl["cell" + j + "." + i].value = "";
		}
	    }

	    i = 0;
	    for ( j = 1; j < 10; j++ ) {
		y = point.y + j - 5;

		if ( y > 0 && y <= im.raw.height ) {
		    pxtabl["cell" + (10-j) + "." + i].value = y.toFixed(0);
		} else {
		    pxtabl["cell" + (10-j) + "." + i].value = "";
		}
	    }

	    for ( j = 1; j < 10; j++ ) {
	    for ( i = 1; i < 10; i++ ) {
		x = (point.x + i - 5 - 0.5)|0;
		y = (point.y + j - 5 - 0.5)|0;

		if ( x >= 0 && x < im.raw.width && y >= 0 && y < im.raw.height ) {
		    pxtabl["cell" + (10-j) + "." + i].value = im_2d.get(y, x).toPrecision(4);
		} else {
		    pxtabl["cell" + (10-j) + "." + i].value = "";
		}
	    }
	    }
    }

    function pxtablInit() {
	imexam.fixupDiv(this);

	$(this.div).html("<form class=pxtabl>" + htmlTable(10, 10) + "</form>");
	$(this.div).find(".row5").css("background", "lightblue");
	$(this.div).find(".col5").css("background", "lightblue");
	$(this.div).find(":input").css("font-size", "11");
    }

    JS9.RegisterPlugin("ImExam", "PxTabl", pxtablInit, {
	    menu: "view",

            menuItem: "Pixel Table",
            winTitle: "Pixel Table",
	    winResize: true,

	    toolbarSeparate: true,

            onmousemove: pxtablUpdate,
            winDims: [625, 240],
    });
}());

/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9 */ 

"use strict";


(function() {
    var imexam = require("./imexam");

    var rproj_template = "<div style='position:absolute;right: 10px;top:30px'> \
                    <table> \
                                    <tr><td>peak        </td><td align=right>{a%.2f}</td><tr> \
                                    <tr><td>sigma       </td><td align=right>{c%.2f}</td><tr> \
                                    <tr><td>bias        </td><td align=right>{d%.2f}</td><tr> \
                    </table> \
                    </div>";

    function rprojUpdate(im, xreg) {
        var div = this.div;

	    var imag = imexam.getRegionData(im, xreg);

            var max     = imexam.ndops.maxvalue(imag);
            var backgr  = imexam.imops.backgr(imag, 4).value;
            var data    = imexam.ndops.assign(imexam.ndops.zeros(imag.shape), imag);

            imexam.ndops.subs(data, imag, backgr);

            var qcenter  = imexam.ndops.qcenter(data);
            var centroid = imexam.ndops.centroid(data, qcenter);

            var rproj    = imexam.imops.rproj(imag, [centroid.ceny, centroid.cenx]);

            var fit = imexam.ndops.gsfit1d(rproj.radi, rproj.data, [max, centroid.fwhm/2.355, backgr]);
	
            var fitv = { a: fit[0], b: 0, c: fit[1], d: fit[2] };

            var rdata = [];
            var rfdat = [];
            var r;

            for ( r = 0;  r < rproj.radi.shape[0]; r++ ) {
                    rdata[r] = [rproj.radi.get(r), rproj.data.get(r)];
            }

            rproj.samp = imexam.ndops.zeros([div.offsetWidth/2]);

            imexam.ndops.fill(rproj.samp, function(r) { return rproj.radius*r/(div.offsetWidth/2); });


            rproj.modl = imexam.ndops.gauss1d(rproj.samp, fit);

            for ( r = 0;  r < rproj.modl.shape[0]; r++ ) {
		rfdat[r] = [rproj.samp.get(r), rproj.modl.get(r)];
            }

            $(div).empty();
            var plot = $.plot(div, [{ data: rdata, points: { radius: 1, show: true } }, { data: rfdat }]
		    , { zoomStack: true, selection: { mode: "xy" } });

            $(div).append(imexam.template(rproj_template, fitv));
    }

    function rprojInit() {
	imexam.fixupDiv(this);
        $(this.div).append("Create a region to see radial projection<br>");
    }

    JS9.RegisterPlugin("ImExam", "RadialProj", rprojInit, {
	    menu: "analysis",

            menuItem: "Radial Proj",
            winTitle: "Radial Proj",
	    help:     "imexam/imexam.html#r_proj",

	    toolbarSeparate: true,

            onregionschange: rprojUpdate,
            winDims: [250, 250],
    });

}());
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9 */ 

"use strict";


(function() {
    var imexam = require("./imexam");

    var reghistemplate = "<div class='annotation' style='position:absolute;right: 10px;top:30px'> \
                    <table> \
                                    <tr><td>rms        </td><td align=right>{rms%.2f}</td><tr> \
                                    <tr><td>mean       </td><td align=right>{mean%.2f}</td><tr> \
                    </table> \
                    </div>";

    function histStats(div, plot, range) {
        var i, j = 0;
        var axes = plot.getAxes();

    	var xmin = axes.xaxis.options.min;
    	var xmax = axes.xaxis.options.max;
	var hist = $(div).data("hist");
 	var data = hist.raw;

	var rms  = imexam.ndops.rmsClipped( data, xmin, xmax);
	var mean = imexam.ndops.meanClipped(data, xmin, xmax);

	$(div).find(".annotation").empty();

	$(div).append(imexam.template(reghistemplate, { rms: rms, mean: mean }));
    }

    function histUpdate(im, xreg) {
        var div = this.div;

	    var imag = imexam.getRegionData(im, xreg);

            var hist    = imexam.ndops.hist(imag);
            hist.sum    = imexam.ndops.sum(hist.data);

	    $(div).data("hist", hist);

            var n = 0;
            var skip = hist.sum * 0.001;
            var h = 0, i, value;

            $(div).empty();

            var hdata = [];

            for ( i = 0; i < hist.data.shape[0]; i++ ) {
                n += hist.data.get(i);

                if ( n > skip &&  n < hist.sum - skip ) { 
		    value = hist.data.get(i);

		    hdata[h] = [i*hist.width+hist.min, value];
		    h++;
		}
            }

            var plot = $.plot(div, [hdata], { zoomStack: true, zoomFunc: histStats, selection: { mode: "x" } });

	    histStats(div, plot, undefined);

//	    $.plot.zoomStackIn(plot, undefined, { xaxis: { from: xmin 		, to: xmax }
//		    				, yaxis: { from: axes.yaxis.min , to: axes.yaxis.max } }
//					, histStats);
    }

    function histInit() {
	imexam.fixupDiv(this);
        $(this.div).append("Create a region to see histogram<br>");
    }

    JS9.RegisterPlugin("ImExam", "Histogram", histInit, {
	    menu: "analysis",

            menuItem: "Histogram",
            winTitle: "Histogram",
	    help:     "imexam/imexam.html#rghist",

	    toolbarSeparate: true,
	    toolbarHTML: " ",

            onregionschange: histUpdate,
            winDims: [250, 250],
    });

}());
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9 */ 

"use strict";


(function() {
    var imexam = require("./imexam");


    var statTemplate = "                                                                                \
        <table width=100% style='padding-right: 6px; padding-left: 0px'>                                \
            <tr><td align=right>position x</td> <td align=right>{reg.x%.2f}              </td>          \
            <td align=right>y</td>              <td align=right>{reg.y%.2f}             </td></tr>      \
            <tr><td align=right>box width</td>      <td align=right>{reg.width%.2f}         </td>       \
            <td align=right>height</td>         <td align=right>{reg.height%.2f}        </td></tr>      \
            <tr><td align=right>min</td>        <td align=right>{min%.2f}               </td>           \
            <td align=right>max</td>            <td align=right>{max%.2f}               </td></tr>      \
            <tr><td align=right>totcounts</td>     <td align=right colspan=3>{centroid2.sum%.2f}</tr>   \
            <tr><td align=right>bscounts</td>     <td align=right colspan=3>{centroid.sum%.2f}</tr>     \
            <tr><td align=right>bkgd</td>     <td align=right>{backgr.value%.2f}      </td>             \
            <td align=right>noise</td>          <td align=right>{backgr.noise%.2f}      </td></tr>      \
            <tr><td align=right>centroid x</td> <td align=right>{centroid.cenx%.2f}     </td>           \
            <td align=right>y</td>              <td align=right>{centroid.ceny%.2f}     </td></tr>      \
            <tr><td align=right>FWHM</td>       <td align=right>{centroid.fwhm%.2f}     </td>           \
            <td align=right></td>            <td align=right>{centroid.rms%.2f}      </td></tr>         \
        </table>";

    function statUpdate(im, xreg) {
        var div = this.div;

            var section = imexam.reg2section(xreg);
	    var imag    = imexam.getRegionData(im, xreg);

            var data    = imexam.ndops.assign(imexam.ndops.zeros(imag.shape), imag);
            var data2   = imexam.ndops.assign(imexam.ndops.zeros(imag.shape), imag);

            var stat    = {};

            stat.reg = xreg;
            stat.min = imexam.ndops.minvalue(imag);
            stat.max = imexam.ndops.maxvalue(imag);
            stat.backgr  = imexam.imops.backgr(imag, 4);

            imexam.ndops.subs(data, imag, stat.backgr.value);

            stat.qcenter  = imexam.ndops.qcenter(data);
            stat.centroid = imexam.ndops.centroid(data, imexam.ndops.qcenter(data));
            stat.centroid2 = imexam.ndops.centroid(data2, imexam.ndops.qcenter(data2));

            stat.centroid.cenx += section[0][0];
            stat.centroid.ceny += section[1][0];

            $(div).html(imexam.template(statTemplate, stat));
    }

    function statInit() {
	imexam.fixupDiv(this);
        $(this.div).append("Create a region to see stats<br>");
    }

    JS9.RegisterPlugin("ImExam", "RegionStats", statInit, {
	    menu: "analysis",

            winTitle: "Region Stats",
            menuItem: "Region Stats",
	    help:     "imexam/imexam.html#rgstat",

	    toolbarSeparate: true,

            onregionschange: statUpdate,
            winDims: [250, 250],
    });
}());
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9 */ 



(function() {
    "use strict";

    var imexam = require("./imexam");


    var projToolbar = "                                	\
		<div style='float: right;'>		\
                 <select  class='proj_menu'>		\
                        <option>sum</option>            \
                        <option>avg</option>            \
                        <option>med</option>            \
		 </select>				\
		</div>";


		// <input type=checkbox class='proj_chek' name=fit><span style='width: 40px; float:right; text-align: left;'>fit</span>	\

    function projUpdate(im, xreg) {
	var div, proj, menx, chek;

        if ( im === undefined ) {
	    div  = xreg.div;
	    proj = xreg.proj;
	    menx = xreg.menu;
	    chek = xreg.chek;
	} else {
	    div  = this.div; 
	    menx = this.outerdivjq.find(".proj_menu")[0];
	    chek = this.outerdivjq.find(".proj_chek")[0];

            proj = imexam.ndops.proj(imexam.getRegionData(im, xreg), this.plugin.opts.xyproj);

	    $(menx).change(function (event) {
		    projUpdate(undefined, { div: div, proj: proj, menu: menx, chek: chek });
		});
	    $(chek).change(function (event) {
		    projUpdate(undefined, { div: div, proj: proj, menu: menx, chek: chek });
		});
	}


	var xdata = [];
	var  data;
	var x;

	var proj_type = menx.options[menx.selectedIndex].value;
	

	$(div).empty();

	if ( proj_type === "sum" ) {
		data = proj.sum;
	}
	if ( proj_type === "avg" ) {
		data = proj.avg;
	}
	if ( proj_type === "med" ) {
		data = proj.med;
	}


	for ( x = 0;  x < data.length; x++ ) {
		xdata[x] = [x, data[x]];
	}

	$.plot(div, [xdata], { zoomStack: true, selection: { mode: "xy" } });
    }

    function projInit() {
	imexam.fixupDiv(this);
        $(this.div).append("Create a region to see projection<br>");
    }

    JS9.RegisterPlugin("ImExam", "XProj", projInit, {
	    menu: "analysis",

            menuItem: "X Projection",
	    winTitle: "X Projection",
	    help:     "imexam/imexam.html#xyproj",

	    toolbarSeparate: true,
	    toolbarHTML: projToolbar,

            onregionschange: projUpdate,

            winDims: [250, 250],

            xyproj: 0
    });

    JS9.RegisterPlugin("ImExam", "YProj", projInit, {
	    menu: "analysis",

            menuItem: "Y Projection",
	    winTitle: "Y Projection",
	    help:     "imexam/imexam.html#xyproj",

	    toolbarSeparate: true,
	    toolbarHTML: projToolbar,

            onregionschange: projUpdate,

            winDims: [250, 250],

            xyproj: 1
    });
}());
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, continue: true */
/*globals $, JS9, imexam, greg */ 


(function () {
    "use strict";

    var imexam = require("./imexam");

    require("./JSSurfacePlot-V1.7/javascript/SurfacePlot");
    require("./JSSurfacePlot-V1.7/javascript/ColourGradient");

    function surface(div, data) {

        var surf     = imexam.ndops.zeros(data.shape),
            minvalue = imexam.ndops.minvalue(data),
            maxvalue = imexam.ndops.maxvalue(data),
            range    = maxvalue - minvalue;

        var  surfacePlot = $(div).data("surfplot");
        var fillPly = true;
        

        surf.getNumberOfRows = function () {
            return this.shape[1];
        };
        surf.getNumberOfColumns = function () {
            return this.shape[0];
        };
        surf.getFormattedValue = function (i, j) {
            return this.get(j, i).toString();
        };


        if ( surfacePlot === undefined ) {
            div.innerHTML = "";

            surfacePlot = new greg.ross.visualisation.SurfacePlot(div);

            $(div).data("surfplot", surfacePlot);
        }

        // Define a colour gradient.
        var colour1 = {red:   0, green:   0, blue: 255};
        var colour2 = {red:   0, green: 255, blue: 255};
        var colour3 = {red:   0, green: 255, blue:   0};
        var colour4 = {red: 255, green: 255, blue:   0};
        var colour5 = {red: 255, green:   0, blue:   0};
        var colours = [colour1, colour2, colour3, colour4, colour5];
        
        // Axis labels.
        var xAxisHeader = "X";
        var yAxisHeader = "Y";
        var zAxisHeader = "Z";

        var tooltipStrings = [];

        var numRows = surf.getNumberOfRows();
        var numCols = surf.getNumberOfColumns();
        var idx = 0;

        var height = div.offsetHeight;
        var width  = div.offsetWidth;
        var i, j, value;

        for (i = 0; i < numRows; i++) {
            for (j = 0; j < numCols; j++) {
                value = data.get(j, i);

                surf.set(j, i, (value-minvalue)/(range*2.25));

                if ( value !== undefined ) {
		    tooltipStrings[idx] = "x:" + i + ", y:" + j + " = " + value.toFixed(2);
		}
                idx++;
            }
        }
        
        var options = {xPos: 0, yPos: 0, width: width, height: height, colourGradient: colours, fillPolygons: fillPly,
                tooltips: tooltipStrings, xTitle: xAxisHeader, yTitle: yAxisHeader, zTitle: zAxisHeader, restrictXRotation: false};

        surfacePlot.draw(surf, options);
    }

    function pluginUpdate(im, xreg) {
            surface(this.div, imexam.getRegionData(im, xreg));
    }

    function pluginInit() {
	imexam.fixupDiv(this);
        $(this.div).append("Create a region to see 3d plot<br>");
    }

    JS9.RegisterPlugin("ImExam", "3dPlot", pluginInit, {
	    menu: "analysis",

            menuItem: "3dPlot",
            winTitle: "3dPlot",
	    help:     "imexam/imexam.html#3dplot",

	    toolbarSeparate: true,

            onregionschange: pluginUpdate,
            winDims: [250, 250],
    });
}());

},{"./JSSurfacePlot-V1.7/javascript/ColourGradient":2,"./JSSurfacePlot-V1.7/javascript/SurfacePlot":3,"./imexam":undefined}],2:[function(require,module,exports){
/*
 * ColourGradient.js
 *
 *
 * Copyright (c) 2011 Greg Ross
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of the project's author nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

/**
 * Class that is used to define a path through RGB space.
 * @author Greg Ross
 * @constructor
 * @param minValue the value that will return the first colour on the path in RGB space
 * @param maxValue the value that will return the last colour on the path in RGB space
 * @param rgbColourArray the set of colours that defines the dirctional path through RGB space.
 * The length of the array must be greater than two.
 */
greg.ross.visualisation.ColourGradient = function(minValue, maxValue, rgbColourArray)
{
	function RGB2HTML(red, green, blue)
	{
	    var decColor = red + 256 * green + 65536 * blue;
	    return decColor.toString(16);
	}

	/**
	 * Return a colour from a position on the path in RGB space that is proportioal to
	 * the number specified in relation to the minimum and maximum values from which the
	 * bounds of the path are derived.
	 * @member greg.ross.visualisation.ColourGradient
	 * @param value
	 */
	this.getColour = function(value)
	{
		if ( isNaN(value) || value < minValue || value > maxValue || rgbColourArray.length == 1)
		{
			var colr = {
				red: rgbColourArray[0].red,
				green:rgbColourArray[0].green,
				blue:rgbColourArray[0].blue
			};
			
			return colr;
		}
			
		var scaledValue = mapValueToZeroOneInterval(value, minValue, maxValue);
		
		return getPointOnColourRamp(scaledValue);
	}
	
	function getPointOnColourRamp(value)
	{
		var numberOfColours = rgbColourArray.length;
		var scaleWidth = 1 / (numberOfColours - 1);
		var index = (value / scaleWidth);
		var index = parseInt(index + "");

		index = index >=  (numberOfColours - 1) ? (numberOfColours - 2): index;

		var rgb1 = rgbColourArray[index];
		var rgb2 = rgbColourArray[index + 1];
		
		var closestToOrigin, furthestFromOrigin;
		
		if (distanceFromRgbOrigin(rgb1) > distanceFromRgbOrigin(rgb2))
		{
			closestToOrigin = rgb2;
			furthestFromOrigin = rgb1;
		}
		else
		{
			closestToOrigin = rgb1;
			furthestFromOrigin = rgb2;
		}
		
		var t;
		
		if (closestToOrigin == rgb2)
			t = 1 - mapValueToZeroOneInterval(value, index * scaleWidth, (index + 1) * scaleWidth);
		else
			t = mapValueToZeroOneInterval(value, index * scaleWidth, (index + 1) * scaleWidth);
			
		var diff = [
			t * (furthestFromOrigin.red - closestToOrigin.red),
			t * (furthestFromOrigin.green - closestToOrigin.green), 
			t * (furthestFromOrigin.blue - closestToOrigin.blue)];
		
		var r = closestToOrigin.red + diff[0];
		var g = closestToOrigin.green + diff[1];
		var b = closestToOrigin.blue + diff[2];
		
		r = parseInt(r);
		g = parseInt(g);
		b = parseInt(b);
		
		var colr = {
			red:r,
			green:g,
			blue:b
		};
		
		return colr;
	}

	function distanceFromRgbOrigin(rgb)
	{
		return (rgb.red * rgb.red) + (rgb.green * rgb.green) + (rgb.blue * rgb.blue);
	}

	function mapValueToZeroOneInterval(value, minValue, maxValue)
	{
		if (minValue == maxValue) return 0;
		
		var factor = (value - minValue) / (maxValue - minValue);
		return factor;
	}
}


},{}],3:[function(require,module,exports){
/*
 * SurfacePlot.js
 *
 *
 * Copyright (c) 2011 Greg Ross
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of the project's author nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */
/*
 * Register the name space
 * ***********************
 */
function registerNameSpace(ns){
    var nsParts = ns.split(".");
    var root = window;
    var n = nsParts.length;
    
    for (var i = 0; i < n; i++) {
        if (typeof root[nsParts[i]] == "undefined") 
            root[nsParts[i]] = new Object();
        
        root = root[nsParts[i]];
    }
}

registerNameSpace("greg.ross.visualisation");

/*
 * This is the main class and entry point of the tool
 * and represents the Google viz API.
 * ***************************************************
 */
greg.ross.visualisation.SurfacePlot = function(container){
    this.containerElement = container;
}

greg.ross.visualisation.SurfacePlot.prototype.draw = function(data, options) {
    var xPos = options.xPos;
    var yPos = options.yPos;
    var w = options.width;
    var h = options.height;
    var colourGradient = options.colourGradient;
    var fillPolygons = options.fillPolygons;
    var tooltips = options.tooltips;
    var xTitle = options.xTitle;
    var yTitle = options.yTitle;
    var zTitle = options.zTitle;
	var restrictXRotation = options.restrictXRotation;
    
    if (this.surfacePlot == undefined) 
        this.surfacePlot = new greg.ross.visualisation.JSSurfacePlot(xPos, yPos, w, h, colourGradient, this.containerElement, tooltips, fillPolygons, xTitle, yTitle, zTitle, restrictXRotation);
    
    this.surfacePlot.redraw(data);
}

/*
 * This class does most of the work.
 * *********************************
 */
greg.ross.visualisation.JSSurfacePlot = function(x, y, width, height, colourGradient, targetElement, tooltips, fillRegions, xTitle, yTitle, zTitle, restrictXRotation){
    this.targetDiv;
    var id = allocateId();
    var canvas;
    var canvasContext = null;
    
    var scale = greg.ross.visualisation.JSSurfacePlot.DEFAULT_SCALE;
    
    var currentZAngle = greg.ross.visualisation.JSSurfacePlot.DEFAULT_Z_ANGLE;
    var currentXAngle = greg.ross.visualisation.JSSurfacePlot.DEFAULT_X_ANGLE;
    
    this.data = null;
	var canvas_support_checked = false;
	var canvas_supported = true;
    var data3ds = null;
    var displayValues = null;
    var numXPoints;
    var numYPoints;
    var transformation;
    var cameraPosition;
    var colourGradient;
    var colourGradientObject;
    var renderPoints = false;
    
    var mouseDown1 = false;
    var mouseDown3 = false;
    var mousePosX = null;
    var mousePosY = null;
    var lastMousePos = new greg.ross.visualisation.Point(0, 0);
    var mouseButton1Up = null;
    var mouseButton3Up = null;
    var mouseButton1Down = new greg.ross.visualisation.Point(0, 0);
    var mouseButton3Down = new greg.ross.visualisation.Point(0, 0);
    var closestPointToMouse = null;
    var xAxisHeader = "";
    var yAxisHeader = "";
    var zAxisHeader = "";
    var xAxisTitleLabel = new greg.ross.visualisation.Tooltip(true);
    var yAxisTitleLabel = new greg.ross.visualisation.Tooltip(true);
    var zAxisTitleLabel = new greg.ross.visualisation.Tooltip(true);
    var tTip = new greg.ross.visualisation.Tooltip(false);
    
    function init(){
        transformation = new greg.ross.visualisation.Th3dtran();
        
        createTargetDiv();
        
        if (!targetDiv) 
            return;
        
        createCanvas();
    }
    
    function hideTooltip(){
        tTip.hide();
    }
    
    function displayTooltip(e){
        var position = new greg.ross.visualisation.Point(e.x, e.y);
        tTip.show(tooltips[closestPointToMouse], 200);
    }
    
    function render(data){
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.fillStyle = '#000';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        this.data = data;
        
        var canvasWidth = width;
        var canvasHeight = height;
        
        var minMargin = 20;
        var drawingDim = canvasWidth - minMargin * 2;
        var marginX = minMargin;
        var marginY = minMargin;
        
        transformation.init();
        transformation.rotate(currentXAngle, 0.0, currentZAngle);
        transformation.scale(scale);
        transformation.translate(drawingDim / 2.0 + marginX, (drawingDim / 3.0*2) + marginY, 0.0);
        
        cameraPosition = new greg.ross.visualisation.Point3D(drawingDim / 2.0 + marginX, drawingDim / 2.0 + marginY, -1000.0);
        
        if (renderPoints) {
            for (i = 0; i < data3ds.length; i++) {
                var point3d = data3ds[i];
                canvasContext.fillStyle = '#ff2222';
                var transformedPoint = transformation.ChangeObjectPoint(point3d);
                transformedPoint.dist = distance(transformedPoint, cameraPosition);
                
                var x = transformedPoint.ax;
                var y = transformedPoint.ay;
                
                canvasContext.beginPath();
                var dotSize = greg.ross.visualisation.JSSurfacePlot.DATA_DOT_SIZE;
                
                canvasContext.arc((x - (dotSize / 2)), (y - (dotSize / 2)), 1, 0, self.Math.PI * 2, true);
                canvasContext.fill();
            }
        }
        
        var axes = createAxes();
        var polygons = createPolygons(data3ds);
        
        for (i = 0; i < axes.length; i++) {
            polygons[polygons.length] = axes[i];
        }
        
        // Sort the polygons so that the closest ones are rendered last
        // and therefore are not occluded by those behind them.
        // This is really Painter's algorithm.
        polygons.sort(greg.ross.visualisation.PolygonComaparator);
        //polygons = sort(polygons);
        
        canvasContext.lineWidth = 1;
        canvasContext.strokeStyle = '#888';
        canvasContext.lineJoin = "round";
        
        for (i = 0; i < polygons.length; i++) {
            var polygon = polygons[i];
            
            if (polygon.isAnAxis()) {
                var p1 = polygon.getPoint(0);
                var p2 = polygon.getPoint(1);
                
                canvasContext.beginPath();
                canvasContext.moveTo(p1.ax, p1.ay);
                canvasContext.lineTo(p2.ax, p2.ay);
                canvasContext.stroke();
            }
            else {
                var p1 = polygon.getPoint(0);
                var p2 = polygon.getPoint(1);
                var p3 = polygon.getPoint(2);
                var p4 = polygon.getPoint(3);
                
                var colourValue = (p1.lz * 1.0 + p2.lz * 1.0 + p3.lz * 1.0 + p4.lz * 1.0) / 4.0;
                
                // if (colourValue < 0) 
                    // colourValue *= -1;
                
                var rgbColour = colourGradientObject.getColour(colourValue);
                var colr = "rgb(" + rgbColour.red + "," + rgbColour.green + "," + rgbColour.blue + ")";
                canvasContext.fillStyle = colr;
                
                canvasContext.beginPath();
                canvasContext.moveTo(p1.ax, p1.ay);
                canvasContext.lineTo(p2.ax, p2.ay);
                canvasContext.lineTo(p3.ax, p3.ay);
                canvasContext.lineTo(p4.ax, p4.ay);
                canvasContext.lineTo(p1.ax, p1.ay);
                
                if (fillRegions) 
                    canvasContext.fill();
                else 
                    canvasContext.stroke();
            }
        }
        
        canvasContext.stroke();
        
        if (supports_canvas()) 
            renderAxisText(axes);
    }
    
    function renderAxisText(axes){
        var xLabelPoint = new greg.ross.visualisation.Point3D(0.0, 0.5, 0.0);
        var yLabelPoint = new greg.ross.visualisation.Point3D(-0.5, 0.0, 0.0);
        var zLabelPoint = new greg.ross.visualisation.Point3D(-0.5, 0.5, 0.5);
        
        var transformedxLabelPoint = transformation.ChangeObjectPoint(xLabelPoint);
        var transformedyLabelPoint = transformation.ChangeObjectPoint(yLabelPoint);
        var transformedzLabelPoint = transformation.ChangeObjectPoint(zLabelPoint);
        
        var xAxis = axes[0];
        var yAxis = axes[1];
        var zAxis = axes[2];
        
        canvasContext.fillStyle = '#fff';
        
        if (xAxis.distanceFromCamera > yAxis.distanceFromCamera) {
            var xAxisLabelPosX = transformedxLabelPoint.ax;
            var xAxisLabelPosY = transformedxLabelPoint.ay;
            canvasContext.fillText(xTitle, xAxisLabelPosX, xAxisLabelPosY);
        }
        
        if (xAxis.distanceFromCamera < yAxis.distanceFromCamera) {
            var yAxisLabelPosX = transformedyLabelPoint.ax;
            var yAxisLabelPosY = transformedyLabelPoint.ay;
            canvasContext.fillText(yTitle, yAxisLabelPosX, yAxisLabelPosY);
        }
        
        if (xAxis.distanceFromCamera < zAxis.distanceFromCamera) {
            var zAxisLabelPosX = transformedzLabelPoint.ax;
            var zAxisLabelPosY = transformedzLabelPoint.ay;
            canvasContext.fillText(zTitle, zAxisLabelPosX, zAxisLabelPosY);
        }
    }
    
    var sort = function(array){
        var len = array.length;
        
        if (len < 2) {
            return array;
        }
        
        var pivot = Math.ceil(len / 2);
        return merge(sort(array.slice(0, pivot)), sort(array.slice(pivot)));
    }
    
    var merge = function(left, right){
        var result = [];
        while ((left.length > 0) && (right.length > 0)) {
            if (left[0].distanceFromCamera < right[0].distanceFromCamera) {
                result.push(left.shift());
            }
            else {
                result.push(right.shift());
            }
        }
        
        result = result.concat(left, right);
        return result;
    }
    
    
    function createAxes(){
        var axisOrigin = new greg.ross.visualisation.Point3D(-0.5, 0.5, 0);
        var xAxisEndPoint = new greg.ross.visualisation.Point3D(0.5, 0.5, 0);
        var yAxisEndPoint = new greg.ross.visualisation.Point3D(-0.5, -0.5, 0);
        var zAxisEndPoint = new greg.ross.visualisation.Point3D(-0.5, 0.5, 1);
        
        var transformedAxisOrigin = transformation.ChangeObjectPoint(axisOrigin);
        var transformedXAxisEndPoint = transformation.ChangeObjectPoint(xAxisEndPoint);
        var transformedYAxisEndPoint = transformation.ChangeObjectPoint(yAxisEndPoint);
        var transformedZAxisEndPoint = transformation.ChangeObjectPoint(zAxisEndPoint);
        
        var axes = new Array();
        
        var xAxis = new greg.ross.visualisation.Polygon(cameraPosition, true);
        xAxis.addPoint(transformedAxisOrigin);
        xAxis.addPoint(transformedXAxisEndPoint);
        xAxis.calculateCentroid();
        xAxis.calculateDistance();
        axes[axes.length] = xAxis;
        
        var yAxis = new greg.ross.visualisation.Polygon(cameraPosition, true);
        yAxis.addPoint(transformedAxisOrigin);
        yAxis.addPoint(transformedYAxisEndPoint);
        yAxis.calculateCentroid();
        yAxis.calculateDistance();
        axes[axes.length] = yAxis;
        
        var zAxis = new greg.ross.visualisation.Polygon(cameraPosition, true);
        zAxis.addPoint(transformedAxisOrigin);
        zAxis.addPoint(transformedZAxisEndPoint);
        zAxis.calculateCentroid();
        zAxis.calculateDistance();
        axes[axes.length] = zAxis;
        
        return axes;
    }
    
    function createPolygons(data3D){
        var i;
        var j;
        var polygons = new Array();
        var index = 0;
        
        for (i = 0; i < numXPoints - 1; i++) {
            for (j = 0; j < numYPoints - 1; j++) {
                var polygon = new greg.ross.visualisation.Polygon(cameraPosition, false);
                
                var p1 = transformation.ChangeObjectPoint(data3D[j + (i * numYPoints)]);
                var p2 = transformation.ChangeObjectPoint(data3D[j + (i * numYPoints) + numYPoints]);
                var p3 = transformation.ChangeObjectPoint(data3D[j + (i * numYPoints) + numYPoints + 1]);
                var p4 = transformation.ChangeObjectPoint(data3D[j + (i * numYPoints) + 1]);
                
                polygon.addPoint(p1);
                polygon.addPoint(p2);
                polygon.addPoint(p3);
                polygon.addPoint(p4);
                polygon.calculateCentroid();
                polygon.calculateDistance();
                
                polygons[index] = polygon;
                index++;
            }
        }
        
        return polygons;
    }
    
    function getDefaultColourRamp(){
        var colour1 = {
            red: 0,
            green: 0,
            blue: 255
        };
        var colour2 = {
            red: 0,
            green: 255,
            blue: 255
        };
        var colour3 = {
            red: 0,
            green: 255,
            blue: 0
        };
        var colour4 = {
            red: 255,
            green: 255,
            blue: 0
        };
        var colour5 = {
            red: 255,
            green: 0,
            blue: 0
        };
        return [colour1, colour2, colour3, colour4, colour5];
    }
    
    this.redraw = function(data){
        numXPoints = data.getNumberOfRows() * 1.0;
        numYPoints = data.getNumberOfColumns() * 1.0;
        
        var minZValue = Number.MAX_VALUE;
        var maxZValue = Number.MIN_VALUE;
        
        for (var i = 0; i < numXPoints; i++) {
            for (var j = 0; j < numYPoints; j++) {
                var value = data.getFormattedValue(i, j) * 1.0;
                
                if (value < minZValue) 
                    minZValue = value;
                
                if (value > maxZValue) 
                    maxZValue = value;
            }
        }
        
        var cGradient;
        
        if (colourGradient) 
            cGradient = colourGradient;
        else 
            cGradient = getDefaultColourRamp();
            
        // if (minZValue < 0 && (minZValue*-1) > maxZValue)
          // maxZValue = minZValue*-1;
          
        colourGradientObject = new greg.ross.visualisation.ColourGradient(minZValue, maxZValue, cGradient);
        
        var canvasWidth = width;
        var canvasHeight = height;
        
        var minMargin = 20;
        var drawingDim = canvasWidth - minMargin * 2;
        var marginX = minMargin;
        var marginY = minMargin;
        
        if (canvasWidth > canvasHeight) {
            drawingDim = canvasHeight - minMargin * 2;
            marginX = (canvasWidth - drawingDim) / 2;
        }
        else 
            if (canvasWidth < canvasHeight) {
                drawingDim = canvasWidth - minMargin * 2;
                marginY = (canvasHeight - drawingDim) / 2;
            }
        
        var xDivision = 1 / (numXPoints - 1);
        var yDivision = 1 / (numYPoints - 1);
        var xPos, yPos;
        var i, j;
        var numPoints = numXPoints * numYPoints;
        data3ds = new Array();
        var index = 0;
        
        // Calculate 3D points.
        for (i = 0, xPos = -0.5; i < numXPoints; i++, xPos += xDivision) {
            for (j = 0, yPos = 0.5; j < numYPoints; j++, yPos -= yDivision) {
                var x = xPos;
                var y = yPos;
                
                data3ds[index] = new greg.ross.visualisation.Point3D(x, y, data.getFormattedValue(i, j));
                index++;
            }
        }
        
        render(data);
    }
    
    function allocateId(){
        var count = 0;
        var name = "surfacePlot";
        
        do {
            count++;
        }
        while (document.getElementById(name + count))
        
        return name + count;
    }
    
    function createTargetDiv(){
        this.targetDiv = document.createElement("div");
        this.targetDiv.id = id;
        this.targetDiv.className = "surfaceplot";
        this.targetDiv.style.background = '#ffffff'
        this.targetDiv.style.position = 'absolute';
        
        if (!targetElement) 
            document.body.appendChild(this.targetDiv);
        else {
            this.targetDiv.style.position = 'relative';
            targetElement.appendChild(this.targetDiv);
        }
        
        this.targetDiv.style.left = x + "px";
        this.targetDiv.style.top = y + "px";
    }
    
    function getInternetExplorerVersion()    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    {
        var rv = -1; // Return value assumes failure.
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null) 
                rv = parseFloat(RegExp.$1);
        }
        return rv;
    }
    
    function supports_canvas(){
		if (canvas_support_checked) return canvas_supported;
		
		 canvas_support_checked = true;
         canvas_supported = !!document.createElement('canvas').getContext;
		 return canvas_supported;
    }
    
    function createCanvas(){
        canvas = document.createElement("canvas");
        
        if (!supports_canvas()) {
            G_vmlCanvasManager.initElement(canvas);
            canvas.style.width = width;
            canvas.style.height = height;
        }
        
        canvas.className = "surfacePlotCanvas";
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        
        targetDiv.appendChild(canvas);
        
        canvasContext = canvas.getContext("2d");
        canvasContext.font = "bold 18px sans-serif";
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        
        canvasContext.fillStyle = '#000';
        
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        
        canvasContext.beginPath();
        canvasContext.rect(0, 0, canvas.width, canvas.height);
        canvasContext.strokeStyle = '#888';
        canvasContext.stroke();
        
        canvas.onmousemove = mouseIsMoving;
        canvas.onmouseout = hideTooltip;
        canvas.onmousedown = mouseDownd;
        canvas.onmouseup = mouseUpd;

        //added by edupont
        canvas.addEventListener("touchstart", mouseDownd, false);
		canvas.addEventListener("touchmove", mouseIsMoving, false);
		canvas.addEventListener("touchend", mouseUpd, false);
		canvas.addEventListener("touchcancel", hideTooltip, false);
    }
    
    function mouseDownd(e){
        if (isShiftPressed(e)) {
            mouseDown3 = true;
            mouseButton3Down = getMousePositionFromEvent(e);
        }
        else {
            mouseDown1 = true;
            mouseButton1Down = getMousePositionFromEvent(e);
        }
    }
    
    function mouseUpd(e){
        if (mouseDown1) {
            mouseButton1Up = lastMousePos;
        }
        else 
            if (mouseDown3) {
                mouseButton3Up = lastMousePos;
            }
        
        mouseDown1 = false;
        mouseDown3 = false;
    }
    
    function mouseIsMoving(e){
        var currentPos = getMousePositionFromEvent(e);
        
        if (mouseDown1) {
            hideTooltip();
            calculateRotation(currentPos);
        }
        else 
            if (mouseDown3) {
                hideTooltip();
                calculateScale(currentPos);
            }
            else {
                closestPointToMouse = null;
                var closestDist = Number.MAX_VALUE;
                
                for (var i = 0; i < data3ds.length; i++) {
                    var point = data3ds[i];
                    var dist = distance({
                        x: point.ax,
                        y: point.ay
                    }, currentPos);
                    
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPointToMouse = i;
                    }
                }
                
                if (closestDist > 16) {
                    hideTooltip();
                    return;
                }
                
                displayTooltip(currentPos);
            }
			
			return false;
    }
    
    function isShiftPressed(e){
        var shiftPressed = 0;
        
        if (parseInt(navigator.appVersion) > 3) {
            var evt = navigator.appName == "Netscape" ? e : event;
            
            if (navigator.appName == "Netscape" && parseInt(navigator.appVersion) == 4) {
                // NETSCAPE 4 CODE
                var mString = (e.modifiers + 32).toString(2).substring(3, 6);
                shiftPressed = (mString.charAt(0) == "1");
            }
            else {
                // NEWER BROWSERS [CROSS-PLATFORM]
                shiftPressed = evt.shiftKey;
            }
            
            if (shiftPressed) 
                return true;
        }
        
        return false;
    }
    
    function getMousePositionFromEvent(e){
        if (getInternetExplorerVersion() > -1) {
            var e = window.event;
            
            if (e.srcElement.getAttribute('Stroked') == true) {
                if (mousePosX == null || mousePosY == null) 
                    return;
            }
            else {
                mousePosX = e.offsetX;
                mousePosY = e.offsetY;
            }
        }
        else 
            if (e.layerX || e.layerX == 0) // Firefox
            {
                mousePosX = e.layerX;
                mousePosY = e.layerY;
            }
            else if (e.offsetX || e.offsetX == 0) // Opera
            {
                mousePosX = e.offsetX;
                mousePosY = e.offsetY;
            }
			else if (e.touches[0].pageX || e.touches[0].pageX == 0) //touch events
            {
	            mousePosX = e.touches[0].pageX;
	            mousePosY = e.touches[0].pageY;
            }
        
        var currentPos = new greg.ross.visualisation.Point(mousePosX, mousePosY);
        
        return currentPos;
    }
    
    function calculateRotation(e){
        lastMousePos = new greg.ross.visualisation.Point(greg.ross.visualisation.JSSurfacePlot.DEFAULT_Z_ANGLE, greg.ross.visualisation.JSSurfacePlot.DEFAULT_X_ANGLE);
        
        if (mouseButton1Up == null) {
            mouseButton1Up = new greg.ross.visualisation.Point(greg.ross.visualisation.JSSurfacePlot.DEFAULT_Z_ANGLE, greg.ross.visualisation.JSSurfacePlot.DEFAULT_X_ANGLE);
        }
        
        if (mouseButton1Down != null) {
            lastMousePos = new greg.ross.visualisation.Point(mouseButton1Up.x + (mouseButton1Down.x - e.x),//
 mouseButton1Up.y + (mouseButton1Down.y - e.y));
        }
        
        currentZAngle = lastMousePos.x % 360;
        currentXAngle = lastMousePos.y % 360;
		
		if (restrictXRotation) {
			
			if (currentXAngle < 0) 
				currentXAngle = 0;
			else 
				if (currentXAngle > 90) 
					currentXAngle = 90;
					
		}
        
        closestPointToMouse = null;
        render(data);
    }
    
    function calculateScale(e){
        lastMousePos = new greg.ross.visualisation.Point(0, greg.ross.visualisation.JSSurfacePlot.DEFAULT_SCALE / greg.ross.visualisation.JSSurfacePlot.SCALE_FACTOR);
        
        if (mouseButton3Up == null) {
            mouseButton3Up = new greg.ross.visualisation.Point(0, greg.ross.visualisation.JSSurfacePlot.DEFAULT_SCALE / greg.ross.visualisation.JSSurfacePlot.SCALE_FACTOR);
        }
        
        if (mouseButton3Down != null) {
            lastMousePos = new greg.ross.visualisation.Point(mouseButton3Up.x + (mouseButton3Down.x - e.x),//
 mouseButton3Up.y + (mouseButton3Down.y - e.y));
        }
        
        scale = lastMousePos.y * greg.ross.visualisation.JSSurfacePlot.SCALE_FACTOR;
        
        if (scale < greg.ross.visualisation.JSSurfacePlot.MIN_SCALE) 
            scale = greg.ross.visualisation.JSSurfacePlot.MIN_SCALE + 1;
        else 
            if (scale > greg.ross.visualisation.JSSurfacePlot.MAX_SCALE) 
                scale = greg.ross.visualisation.JSSurfacePlot.MAX_SCALE - 1;
        
        lastMousePos.y = scale / greg.ross.visualisation.JSSurfacePlot.SCALE_FACTOR;
        
        closestPointToMouse = null;
        render(data);
    }
    
    init();
}

/**
 * Given two coordinates, return the Euclidean distance
 * between them
 */
function distance(p1, p2){
    return Math.sqrt(((p1.x - p2.x) *
    (p1.x -
    p2.x)) +
    ((p1.y - p2.y) * (p1.y - p2.y)));
}

/*
 * Matrix3d: This class represents a 3D matrix.
 * ********************************************
 */
greg.ross.visualisation.Matrix3d = function(){
    this.matrix = new Array();
    this.numRows = 4;
    this.numCols = 4;
    
    this.init = function(){
        this.matrix = new Array();
        
        for (var i = 0; i < this.numRows; i++) {
            this.matrix[i] = new Array();
        }
    }
    
    this.getMatrix = function(){
        return this.matrix;
    }
    
    this.matrixReset = function(){
        for (var i = 0; i < this.numRows; i++) {
            for (var j = 0; j < this.numCols; j++) {
                this.matrix[i][j] = 0;
            }
        }
    }
    
    this.matrixIdentity = function(){
        this.matrixReset();
        this.matrix[0][0] = this.matrix[1][1] = this.matrix[2][2] = this.matrix[3][3] = 1;
    }
    
    this.matrixCopy = function(newM){
        var temp = new greg.ross.visualisation.Matrix3d();
        var i, j;
        
        for (i = 0; i < this.numRows; i++) {
            for (j = 0; j < this.numCols; j++) {
                temp.getMatrix()[i][j] = (this.matrix[i][0] * newM.getMatrix()[0][j]) + (this.matrix[i][1] * newM.getMatrix()[1][j]) + (this.matrix[i][2] * newM.getMatrix()[2][j]) + (this.matrix[i][3] * newM.getMatrix()[3][j]);
            }
        }
        
        for (i = 0; i < this.numRows; i++) {
            this.matrix[i][0] = temp.getMatrix()[i][0];
            this.matrix[i][1] = temp.getMatrix()[i][1];
            this.matrix[i][2] = temp.getMatrix()[i][2];
            this.matrix[i][3] = temp.getMatrix()[i][3];
        }
    }
    
    this.matrixMult = function(m1, m2){
        var temp = new greg.ross.visualisation.Matrix3d();
        var i, j;
        
        for (i = 0; i < this.numRows; i++) {
            for (j = 0; j < this.numCols; j++) {
                temp.getMatrix()[i][j] = (m2.getMatrix()[i][0] * m1.getMatrix()[0][j]) + (m2.getMatrix()[i][1] * m1.getMatrix()[1][j]) + (m2.getMatrix()[i][2] * m1.getMatrix()[2][j]) + (m2.getMatrix()[i][3] * m1.getMatrix()[3][j]);
            }
        }
        
        for (i = 0; i < this.numRows; i++) {
            m1.getMatrix()[i][0] = temp.getMatrix()[i][0];
            m1.getMatrix()[i][1] = temp.getMatrix()[i][1];
            m1.getMatrix()[i][2] = temp.getMatrix()[i][2];
            m1.getMatrix()[i][3] = temp.getMatrix()[i][3];
        }
    }
    
    this.init();
}

/*
 * Point3D: This class represents a 3D point.
 * ******************************************
 */
greg.ross.visualisation.Point3D = function(x, y, z){
    this.displayValue = "";
    
    this.lx;
    this.ly;
    this.lz;
    this.lt;
    
    this.wx;
    this.wy;
    this.wz;
    this.wt;
    
    this.ax;
    this.ay;
    this.az;
    this.at;
    
    this.dist;
    
    this.initPoint = function(){
        this.lx = this.ly = this.lz = this.ax = this.ay = this.az = this.at = this.wx = this.wy = this.wz = 0;
        this.lt = this.wt = 1;
    }
    
    this.init = function(x, y, z){
        this.initPoint();
        this.lx = x;
        this.ly = y;
        this.lz = z;
        
        this.ax = this.lx;
        this.ay = this.ly;
        this.az = this.lz;
    }
    
    function multiply(p){
        var Temp = new Point3D();
        Temp.lx = this.lx * p.lx;
        Temp.ly = this.ly * p.ly;
        Temp.lz = this.lz * p.lz;
        return Temp;
    }
    
    function getDisplayValue(){
        return displayValue;
    }
    
    function setDisplayValue(displayValue){
        this.displayValue = displayValue;
    }
    
    this.init(x, y, z);
}

/*
 * Polygon: This class represents a polygon on the surface plot.
 * ************************************************************
 */
greg.ross.visualisation.Polygon = function(cameraPosition, isAxis){
    this.points = new Array();
    this.cameraPosition = cameraPosition;
    this.isAxis = isAxis;
    this.centroid = null;
    this.distanceFromCamera = null;
    
    this.isAnAxis = function(){
        return this.isAxis;
    }
    
    this.addPoint = function(point){
        this.points[this.points.length] = point;
    }
    
    this.distance = function(){
        return this.distance2(this.cameraPosition, this.centroid);
    }
    
    this.calculateDistance = function(){
        this.distanceFromCamera = this.distance();
    }
    
    this.calculateCentroid = function(){
        var xCentre = 0;
        var yCentre = 0;
        var zCentre = 0;
        
        var numPoints = this.points.length * 1.0;
        
        for (var i = 0; i < numPoints; i++) {
            xCentre += this.points[i].ax;
            yCentre += this.points[i].ay;
            zCentre += this.points[i].az;
        }
        
        xCentre /= numPoints;
        yCentre /= numPoints;
        zCentre /= numPoints;
        
        this.centroid = new greg.ross.visualisation.Point3D(xCentre, yCentre, zCentre);
    }
    
    this.distance2 = function(p1, p2){
        return ((p1.ax - p2.ax) * (p1.ax - p2.ax)) + ((p1.ay - p2.ay) * (p1.ay - p2.ay)) + ((p1.az - p2.az) * (p1.az - p2.az));
    }
    
    this.getPoint = function(i){
        return this.points[i];
    }
}

/*
 * PolygonComaparator: Class used to sort arrays of polygons.
 * ************************************************************
 */
greg.ross.visualisation.PolygonComaparator = function(p1, p2){
    var diff = p1.distanceFromCamera - p2.distanceFromCamera;
    
    if (diff == 0) 
        return 0;
    else 
        if (diff < 0) 
            return -1;
        else 
            if (diff > 0) 
                return 1;
    
    return 0;
}

/*
 * Th3dtran: Class for matrix manipuation.
 * ************************************************************
 */
greg.ross.visualisation.Th3dtran = function(){
    this.matrix;
    this.rMat;
    this.rMatrix;
    this.objectMatrix;
    this.local = true;
    
    this.init = function(){
        this.matrix = new greg.ross.visualisation.Matrix3d();
        this.rMat = new greg.ross.visualisation.Matrix3d();
        this.rMatrix = new greg.ross.visualisation.Matrix3d();
        this.objectMatrix = new greg.ross.visualisation.Matrix3d();
        
        this.initMatrix();
    }
    
    this.initMatrix = function(){
        this.matrix.matrixIdentity();
        this.objectMatrix.matrixIdentity();
    }
    
    this.translate = function(x, y, z){
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[3][0] = x;
        this.rMat.getMatrix()[3][1] = y;
        this.rMat.getMatrix()[3][2] = z;
        
        if (this.local) {
            this.objectMatrix.matrixCopy(this.rMat);
        }
        else {
            this.matrix.matrixCopy(this.rMat);
        }
    }
    
    this.rotate = function(x, y, z){
        var rx = x * (Math.PI / 180.0);
        var ry = y * (Math.PI / 180.0);
        var rz = z * (Math.PI / 180.0);
        
        this.rMatrix.matrixIdentity();
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[1][1] = Math.cos(rx);
        this.rMat.getMatrix()[1][2] = Math.sin(rx);
        this.rMat.getMatrix()[2][1] = -(Math.sin(rx));
        this.rMat.getMatrix()[2][2] = Math.cos(rx);
        this.rMatrix.matrixMult(this.rMatrix, this.rMat);
        
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[0][0] = Math.cos(ry);
        this.rMat.getMatrix()[0][2] = -(Math.sin(ry));
        this.rMat.getMatrix()[2][0] = Math.sin(ry);
        this.rMat.getMatrix()[2][2] = Math.cos(ry);
        this.rMat.matrixMult(this.rMatrix, this.rMat);
        
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[0][0] = Math.cos(rz);
        this.rMat.getMatrix()[0][1] = Math.sin(rz);
        this.rMat.getMatrix()[1][0] = -(Math.sin(rz));
        this.rMat.getMatrix()[1][1] = Math.cos(rz);
        this.rMat.matrixMult(this.rMatrix, this.rMat);
        
        if (this.local) {
            this.objectMatrix.matrixCopy(this.rMatrix);
        }
        else {
            this.matrix.matrixCopy(this.rMatrix);
        }
    }
    
    this.scale = function(scale){
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[0][0] = scale;
        this.rMat.getMatrix()[1][1] = scale;
        this.rMat.getMatrix()[2][2] = scale;
        
        if (this.local) {
            this.objectMatrix.matrixCopy(this.rMat);
        }
        else {
            this.matrix.matrixCopy(this.rMat);
        }
    }
    
    this.changeLocalObject = function(p){
        p.wx = (p.ax * this.matrix.getMatrix()[0][0] + p.ay * this.matrix.getMatrix()[1][0] + p.az * this.matrix.getMatrix()[2][0] + this.matrix.getMatrix()[3][0]);
        p.wy = (p.ax * this.matrix.getMatrix()[0][1] + p.ay * this.matrix.getMatrix()[1][1] + p.az * this.matrix.getMatrix()[2][1] + this.matrix.getMatrix()[3][1]);
        p.wz = (p.ax * this.matrix.getMatrix()[0][2] + p.ay * this.matrix.getMatrix()[1][2] + p.az * this.matrix.getMatrix()[2][2] + this.matrix.getMatrix()[3][2]);
        
        return p;
    }
    
    this.ChangeObjectPoint = function(p){
        p.ax = (p.lx * this.objectMatrix.getMatrix()[0][0] + p.ly * this.objectMatrix.getMatrix()[1][0] + p.lz * this.objectMatrix.getMatrix()[2][0] + this.objectMatrix.getMatrix()[3][0]);
        p.ay = (p.lx * this.objectMatrix.getMatrix()[0][1] + p.ly * this.objectMatrix.getMatrix()[1][1] + p.lz * this.objectMatrix.getMatrix()[2][1] + this.objectMatrix.getMatrix()[3][1]);
        p.az = (p.lx * this.objectMatrix.getMatrix()[0][2] + p.ly * this.objectMatrix.getMatrix()[1][2] + p.lz * this.objectMatrix.getMatrix()[2][2] + this.objectMatrix.getMatrix()[3][2]);
        
        return p;
    }
    
    this.init();
}

/*
 * Point: A simple 2D point.
 * ************************************************************
 */
greg.ross.visualisation.Point = function(x, y){
    this.x = x;
    this.y = y;
}

/*
 * This function displays tooltips and was adapted from original code by Michael Leigeber.
 * See http://www.leigeber.com/
 */
greg.ross.visualisation.Tooltip = function(useExplicitPositions){
    var top = 3;
    var left = 3;
    var maxw = 300;
    var speed = 10;
    var timer = 20;
    var endalpha = 95;
    var alpha = 0;
    var tt, t, c, b, h;
    var ie = document.all ? true : false;
    
    this.show = function(v, w){
        if (tt == null) {
            tt = document.createElement('div');
            tt.style.color = "#fff";
            
            tt.style.position = 'absolute';
            tt.style.display = 'block';
            
            t = document.createElement('div');
            
            t.style.display = 'block';
            t.style.height = '5px';
            t.style.marginleft = '5px';
            t.style.overflow = 'hidden';
            
            c = document.createElement('div');
            
            b = document.createElement('div');
            
            tt.appendChild(t);
            tt.appendChild(c);
            tt.appendChild(b);
            document.body.appendChild(tt);
            
            if (!ie) {
                tt.style.opacity = 0;
                tt.style.filter = 'alpha(opacity=0)';
            }
            else 
                tt.style.opacity = 1;
            
            
        }
        
        if (!useExplicitPositions) 
            document.onmousemove = this.pos;
        
        tt.style.display = 'block';
        c.innerHTML = '<span style="font-weight:bold; font-family: arial;">' + v + '</span>';
        tt.style.width = w ? w + 'px' : 'auto';
        
        if (!w && ie) {
            t.style.display = 'none';
            b.style.display = 'none';
            tt.style.width = tt.offsetWidth;
            t.style.display = 'block';
            b.style.display = 'block';
        }
        
        if (tt.offsetWidth > maxw) {
            tt.style.width = maxw + 'px';
        }
        
        h = parseInt(tt.offsetHeight) + top;
        
        if (!ie) {
            clearInterval(tt.timer);
            tt.timer = setInterval(function(){
                fade(1)
            }, timer);
        }
    }
    
    this.setPos = function(e){
        tt.style.top = e.y + 'px';
        tt.style.left = e.x + 'px';
    }
    
    this.pos = function(e){
        var u = ie ? event.clientY + document.documentElement.scrollTop : e.pageY;
        var l = ie ? event.clientX + document.documentElement.scrollLeft : e.pageX;
        tt.style.top = (u - h) + 'px';
        tt.style.left = (l + left) + 'px';
    }
    
    function fade(d){
        var a = alpha;
        
        if ((a != endalpha && d == 1) || (a != 0 && d == -1)) {
            var i = speed;
            
            if (endalpha - a < speed && d == 1) {
                i = endalpha - a;
            }
            else 
                if (alpha < speed && d == -1) {
                    i = a;
                }
            
            alpha = a + (i * d);
            tt.style.opacity = alpha * .01;
            tt.style.filter = 'alpha(opacity=' + alpha + ')';
        }
        else {
            clearInterval(tt.timer);
            
            if (d == -1) {
                tt.style.display = 'none';
            }
        }
    }
    
    this.hide = function(){
        if (tt == null) 
            return;
        
        if (!ie) {
            clearInterval(tt.timer);
            tt.timer = setInterval(function(){
                fade(-1)
            }, timer);
        }
        else {
            tt.style.display = 'none';
        }
    }
}

greg.ross.visualisation.JSSurfacePlot.DEFAULT_X_ANGLE = 47;
greg.ross.visualisation.JSSurfacePlot.DEFAULT_Z_ANGLE = 47;
greg.ross.visualisation.JSSurfacePlot.DATA_DOT_SIZE = 3;
greg.ross.visualisation.JSSurfacePlot.DEFAULT_SCALE = 350;
greg.ross.visualisation.JSSurfacePlot.MIN_SCALE = 50;
greg.ross.visualisation.JSSurfacePlot.MAX_SCALE = 1100;
greg.ross.visualisation.JSSurfacePlot.SCALE_FACTOR = 1.4;


},{}]},{},[1]);


(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, bitwise: true */
/*globals $, JS9, imexam, alert */ 


(function() {
    "use strict";

    var imexam = require("./imexam");

    exports.bin1d = imexam.typed(function (data, n) {
	    
		var shape = imexam.typed.clone(data.shape).map(function(x) { return (x/n+0.5)|0; });
		var reply = imexam.typed.array(data.type, shape);
		var iX = 0;

		// ----
		    reply[(iX/n)|0] += data;
		// ----

		return reply;
	    });

    var _bin2d = imexam.typed(function (data, reply, n) {
	    
		var iX = 0;
		var iY = 0;

		// ----
		    reply[(iY/n)|0][(iX/n)|0] += data;
		// ----

		return reply;
	    });

    exports.bin2d = function (data, n) {
		var shape = imexam.typed.clone(data.shape).map(function(x) { return (x/n+0.5)|0; });
		var reply = imexam.typed.array(shape, data);
		
		return _bin2d(data, reply, n);
	    };




    exports.smooth_gaussian2d = function(data, sigma) {
	var xdat = imexam.typed.array(data.shape, "float32");
	var ydat = imexam.typed.array(data.shape, "float32");

	
	var a = 1;
	var b = 0;
	var c = sigma;
	var d = 0;

	var kern = [];

	for ( i = 0; i < 10; i++ ) {
	    kern[i] = a * Math.pow(2.71828, - i*i / (2*c*c)) + d;
	};

	var i, j, k;

	for ( i = 0; i < kern.length; i++ ) {
	    if ( kern[i] < 0.001 ) { 
		break;
	    }
	}
	kern.length = i-1;					// Clip

	var nerk = imexam.typed.clone(kern);
	var kern = kern.reverse();

	for ( i = 1; i < nerk.length; i++ ) {
	    kern[kern.length] = nerk[i];			// Dup
	}
	kern.shape[0] = kern.length;				// Fix shape

	kern = imexam.typed.div(kern, imexam.typed.sum(kern));	// Normalize

	var nx = data.shape[1];
	var ny = data.shape[0];
	var nk = kern.shape[0];

	for ( j = 0; j < ny; j++ ) {
	    for ( i = 0; i < nx; i++ ) {
		for ( k = -nk/2|0; k < nk/2|0; k++ ) {
		    if ( i+k >= 0 && i+k < ny ) {
			xdat.data[j*nx + i] += kern[k+nk/2|0] * data.data[j*nx+i+k];
		    }
		}
	    }
	}
	for ( j = 0; j < ny; j++ ) {
	    for ( i = 0; i < nx; i++ ) {
		for ( k = -nk/2|0; k < nk/2|0; k++ ) {
		    if ( j+k >= 0 && j+k < ny ) {
			ydat.data[j*nx + i] += kern[k+nk/2|0] * xdat.data[(j+k)*nx+i];
		    }
		}
	    }
	}

	return ydat;
    };

}());

},{"./imexam":undefined}],2:[function(require,module,exports){
/**
 * Copyright (c) 2010, Jason Davies.
 *
 * All rights reserved.  This code is based on Bradley White's Java version,
 * which is in turn based on Nicholas Yue's C++ version, which in turn is based
 * on Paul D. Bourke's original Fortran version.  See below for the respective
 * copyright notices.
 *
 * See http://paulbourke.net/papers/conrec for the original
 * paper by Paul D. Bourke.
 *
 * The vector conversion code is based on http://apptree.net/conrec.htm by
 * Graham Cox.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Copyright (c) 1996-1997 Nicholas Yue
 *
 * This software is copyrighted by Nicholas Yue. This code is based on Paul D.
 * Bourke's CONREC.F routine.
 *
 * The authors hereby grant permission to use, copy, and distribute this
 * software and its documentation for any purpose, provided that existing
 * copyright notices are retained in all copies and that this notice is
 * included verbatim in any distributions. Additionally, the authors grant
 * permission to modify this software and its documentation for any purpose,
 * provided that such modifications are not distributed without the explicit
 * consent of the authors and that existing copyright notices are retained in
 * all copies. Some of the algorithms implemented by this software are
 * patented, observe all applicable patent law.
 *
 * IN NO EVENT SHALL THE AUTHORS OR DISTRIBUTORS BE LIABLE TO ANY PARTY FOR
 * DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT
 * OF THE USE OF THIS SOFTWARE, ITS DOCUMENTATION, OR ANY DERIVATIVES THEREOF,
 * EVEN IF THE AUTHORS HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * THE AUTHORS AND DISTRIBUTORS SPECIFICALLY DISCLAIM ANY WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.  THIS SOFTWARE IS
 * PROVIDED ON AN "AS IS" BASIS, AND THE AUTHORS AND DISTRIBUTORS HAVE NO
 * OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR
 * MODIFICATIONS.
 */

var Conrec = (function() {
  var EPSILON = 1e-20;

  var pointsEqual = function(a, b) {
    var x = a.x - b.x, y = a.y - b.y;
    return x * x + y * y < EPSILON;
  }

  var reverseList = function(list) {
    var pp = list.head;

    while (pp) {
      // swap prev/next pointers
      var temp = pp.next;
      pp.next = pp.prev;
      pp.prev = temp;

      // continue through the list
      pp = temp;
    }

    // swap head/tail pointers
    var temp = list.head;
    list.head = list.tail;
    list.tail = temp;
  }

  var ContourBuilder = function(level) {
    this.count = 0;
    this.level = level;
    this.s = null;
    this.count = 0;
  }
  ContourBuilder.prototype.remove_seq = function(list) {
    // if list is the first item, static ptr s is updated
    if (list.prev) {
      list.prev.next = list.next;
    } else {
      this.s = list.next;
    }

    if (list.next) {
      list.next.prev = list.prev;
    }
    --this.count;
  }
  ContourBuilder.prototype.addSegment = function(a, b) {
    var ss = this.s;
    var ma = null;
    var mb = null;
    var prependA = false;
    var prependB = false;

    if ( this.count++ > 100000 ) {
	throw new Error("Too many calls to coutour AddSegment");
    }

    while (ss) {
      if (ma == null) {
        // no match for a yet
        if (pointsEqual(a, ss.head.p)) {
          ma = ss;
          prependA = true;
        } else if (pointsEqual(a, ss.tail.p)) {
          ma = ss;
        }
      }
      if (mb == null) {
        // no match for b yet
        if (pointsEqual(b, ss.head.p)) {
          mb = ss;
          prependB = true;
        } else if (pointsEqual(b, ss.tail.p)) {
          mb = ss;
        }
      }
      // if we matched both no need to continue searching
      if (mb != null && ma != null) {
        break;
      } else {
        ss = ss.next;
      }
    }

    // c is the case selector based on which of ma and/or mb are set
    var c = ((ma != null) ? 1 : 0) | ((mb != null) ? 2 : 0);

    switch(c) {
      case 0:   // both unmatched, add as new sequence
        var aa = {p: a, prev: null};
        var bb = {p: b, next: null};
        aa.next = bb;
        bb.prev = aa;

        // create sequence element and push onto head of main list. The order
        // of items in this list is unimportant
        ma = {head: aa, tail: bb, next: this.s, prev: null, closed: false};
        if (this.s) {
          this.s.prev = ma;
        }
        this.s = ma;

        ++this.count;    // not essential - tracks number of unmerged sequences
      break;

      case 1:   // a matched, b did not - thus b extends sequence ma
        var pp = {p: b};

        if (prependA) {
          pp.next = ma.head;
          pp.prev = null;
          ma.head.prev = pp;
          ma.head = pp;
        } else {
          pp.next = null;
          pp.prev = ma.tail;
          ma.tail.next = pp;
          ma.tail = pp;
        }
      break;

      case 2:   // b matched, a did not - thus a extends sequence mb
        var pp = {p: a};

        if (prependB) {
          pp.next = mb.head;
          pp.prev = null;
          mb.head.prev = pp;
          mb.head = pp;
        } else {
          pp.next = null;
          pp.prev = mb.tail;
          mb.tail.next = pp;
          mb.tail = pp;
        }
      break;

      case 3:   // both matched, can merge sequences
        // if the sequences are the same, do nothing, as we are simply closing this path (could set a flag)

        if (ma === mb) {
          var pp = {p: ma.tail.p, next: ma.head, prev: null};
          ma.head.prev = pp;
          ma.head = pp;
          ma.closed = true;
          break;
        }

        // there are 4 ways the sequence pair can be joined. The current setting of prependA and
        // prependB will tell us which type of join is needed. For head/head and tail/tail joins
        // one sequence needs to be reversed
        switch((prependA ? 1 : 0) | (prependB ? 2 : 0)) {
          case 0:   // tail-tail
            // reverse ma and append to mb
            reverseList(ma);
            // fall through to head/tail case
          case 1:   // head-tail
            // ma is appended to mb and ma discarded
            mb.tail.next = ma.head;
            ma.head.prev = mb.tail;
            mb.tail = ma.tail;

            //discard ma sequence record
            this.remove_seq(ma);
          break;

          case 3:   // head-head
            // reverse ma and append mb to it
            reverseList(ma);
            // fall through to tail/head case
          case 2:   // tail-head
            // mb is appended to ma and mb is discarded
            ma.tail.next = mb.head;
            mb.head.prev = ma.tail;
            ma.tail = mb.tail;

            //discard mb sequence record
            this.remove_seq(mb);
        break;
      }
    }
  }

  /**
   * Implements CONREC.
   *
   * @param {function} drawContour function for drawing contour.  Defaults to a
   *                               custom "contour builder", which populates the
   *                               contours property.
   */
  var Conrec = function(drawContour) {
    if (!drawContour) {
      var c = this;
      c.contours = {};
      /**
       * drawContour - interface for implementing the user supplied method to
       * render the countours.
       *
       * Draws a line between the start and end coordinates.
       *
       * @param startX    - start coordinate for X
       * @param startY    - start coordinate for Y
       * @param endX      - end coordinate for X
       * @param endY      - end coordinate for Y
       * @param contourLevel - Contour level for line.
       */
      this.drawContour = function(startY, startX, endY, endX, contourLevel, k) {
        var cb = c.contours[k];
        if (!cb) {
          cb = c.contours[k] = new ContourBuilder(contourLevel);
        }
        cb.addSegment({x: startX, y: startY}, {x: endX, y: endY});
      }
      this.contourList = function() {
        var l = [];
        var a = c.contours;
        for (var k in a) {
          var s = a[k].s;
          var level = a[k].level;
          while (s) {
            var h = s.head;
            var l2 = [];
            l2.level = level;
            l2.k = k;
            while (h && h.p) {
              l2.push(h.p);
              h = h.next;
            }
            l.push(l2);
            s = s.next;
          }
        }
        l.sort(function(a, b) { return b.k - a.k });
        return l;
      }
    } else {
      this.drawContour = drawContour;
    }
    this.h  = new Array(5);
    this.sh = new Array(5);
    this.xh = new Array(5);
    this.yh = new Array(5);
  }

  /**
   * contour is a contouring subroutine for rectangularily spaced data
   *
   * It emits calls to a line drawing subroutine supplied by the user which
   * draws a contour map corresponding to real*4data on a randomly spaced
   * rectangular grid. The coordinates emitted are in the same units given in
   * the x() and y() arrays.
   *
   * Any number of contour levels may be specified but they must be in order of
   * increasing value.
   *
   *
   * @param {number[][]} d - matrix of data to contour
   * @param {number} ilb,iub,jlb,jub - index bounds of data matrix
   *
   *             The following two, one dimensional arrays (x and y) contain
   *             the horizontal and vertical coordinates of each sample points.
   * @param {number[]} x  - data matrix column coordinates
   * @param {number[]} y  - data matrix row coordinates
   * @param {number} nc   - number of contour levels
   * @param {number[]} z  - contour levels in increasing order.
   */
  Conrec.prototype.contour = function(d, ilb, iub, jlb, jub, x, y, nc, z) {
    var h = this.h, sh = this.sh, xh = this.xh, yh = this.yh;
    var drawContour = this.drawContour;
    this.contours = {};

    /** private */
    var xsect = function(p1, p2){
      return (h[p2]*xh[p1]-h[p1]*xh[p2])/(h[p2]-h[p1]);
    }

    var ysect = function(p1, p2){
      return (h[p2]*yh[p1]-h[p1]*yh[p2])/(h[p2]-h[p1]);
    }
    var m1;
    var m2;
    var m3;
    var case_value;
    var dmin;
    var dmax;
    var x1 = 0.0;
    var x2 = 0.0;
    var y1 = 0.0;
    var y2 = 0.0;

    // The indexing of im and jm should be noted as it has to start from zero
    // unlike the fortran counter part
    var im = [0, 1, 1, 0];
    var jm = [0, 0, 1, 1];

    // Note that castab is arranged differently from the FORTRAN code because
    // Fortran and C/C++ arrays are transposed of each other, in this case
    // it is more tricky as castab is in 3 dimensions
    var castab = [
      [
        [0, 0, 8], [0, 2, 5], [7, 6, 9]
      ],
      [
        [0, 3, 4], [1, 3, 1], [4, 3, 0]
      ],
      [
        [9, 6, 7], [5, 2, 0], [8, 0, 0]
      ]
    ];


    for (var j=(jub-1);j>=jlb;j--) {
      for (var i=ilb;i<=iub-1;i++) {
        var temp1, temp2;
        temp1 = Math.min(d.get(i, j), d.get(i, j+1));
        temp2   = Math.min(d.get(i+1, j), d.get(i+1, j+1));

        dmin  = Math.min(temp1,temp2);
        temp1 = Math.max(d.get(i, j), d.get(i, j+1));

        temp2 = Math.max(d.get(i+1, j),d.get(i+1, j+1));
        dmax  = Math.max(temp1,temp2);

        if (dmax>=z[0]&&dmin<=z[nc-1]) {
          for (var k=0;k<nc;k++) {
            if (z[k]>=dmin&&z[k]<=dmax) {
              for (var m=4;m>=0;m--) {
                if (m>0) {
                  // The indexing of im and jm should be noted as it has to
                  // start from zero
                  h[m] = d.get(i+im[m-1], j+jm[m-1])-z[k];
                  xh[m] = x[i+im[m-1]];
                  yh[m] = y[j+jm[m-1]];
                } else {
                  h[0] = 0.25*(h[1]+h[2]+h[3]+h[4]);
                  xh[0]=0.5*(x[i]+x[i+1]);
                  yh[0]=0.5*(y[j]+y[j+1]);
                }
                if (h[m]>0.0) {
                  sh[m] = 1;
                } else if (h[m]<0.0) {
                  sh[m] = -1;
                } else
                  sh[m] = 0;
              }
              //
              // Note: at this stage the relative heights of the corners and the
              // centre are in the h array, and the corresponding coordinates are
              // in the xh and yh arrays. The centre of the box is indexed by 0
              // and the 4 corners by 1 to 4 as shown below.
              // Each triangle is then indexed by the parameter m, and the 3
              // vertices of each triangle are indexed by parameters m1,m2,and
              // m3.
              // It is assumed that the centre of the box is always vertex 2
              // though this isimportant only when all 3 vertices lie exactly on
              // the same contour level, in which case only the side of the box
              // is drawn.
              //
              //
              //      vertex 4 +-------------------+ vertex 3
              //               | \               / |
              //               |   \    m-3    /   |
              //               |     \       /     |
              //               |       \   /       |
              //               |  m=2    X   m=2   |       the centre is vertex 0
              //               |       /   \       |
              //               |     /       \     |
              //               |   /    m=1    \   |
              //               | /               \ |
              //      vertex 1 +-------------------+ vertex 2
              //
              //
              //
              //               Scan each triangle in the box
              //
              for (m=1;m<=4;m++) {
                m1 = m;
                m2 = 0;
                if (m!=4) {
                    m3 = m+1;
                } else {
                    m3 = 1;
                }
                case_value = castab[sh[m1]+1][sh[m2]+1][sh[m3]+1];
                if (case_value!=0) {
                  switch (case_value) {
                    case 1: // Line between vertices 1 and 2
                      x1=xh[m1];
                      y1=yh[m1];
                      x2=xh[m2];
                      y2=yh[m2];
                      break;
                    case 2: // Line between vertices 2 and 3
                      x1=xh[m2];
                      y1=yh[m2];
                      x2=xh[m3];
                      y2=yh[m3];
                      break;
                    case 3: // Line between vertices 3 and 1
                      x1=xh[m3];
                      y1=yh[m3];
                      x2=xh[m1];
                      y2=yh[m1];
                      break;
                    case 4: // Line between vertex 1 and side 2-3
                      x1=xh[m1];
                      y1=yh[m1];
                      x2=xsect(m2,m3);
                      y2=ysect(m2,m3);
                      break;
                    case 5: // Line between vertex 2 and side 3-1
                      x1=xh[m2];
                      y1=yh[m2];
                      x2=xsect(m3,m1);
                      y2=ysect(m3,m1);
                      break;
                    case 6: //  Line between vertex 3 and side 1-2
                      x1=xh[m3];
                      y1=yh[m3];
                      x2=xsect(m1,m2);
                      y2=ysect(m1,m2);
                      break;
                    case 7: // Line between sides 1-2 and 2-3
                      x1=xsect(m1,m2);
                      y1=ysect(m1,m2);
                      x2=xsect(m2,m3);
                      y2=ysect(m2,m3);
                      break;
                    case 8: // Line between sides 2-3 and 3-1
                      x1=xsect(m2,m3);
                      y1=ysect(m2,m3);
                      x2=xsect(m3,m1);
                      y2=ysect(m3,m1);
                      break;
                    case 9: // Line between sides 3-1 and 1-2
                      x1=xsect(m3,m1);
                      y1=ysect(m3,m1);
                      x2=xsect(m1,m2);
                      y2=ysect(m1,m2);
                      break;
                    default:
                      break;
                  }
                  // Put your processing code here and comment out the printf
                  //printf("%f %f %f %f %f\n",x1,y1,x2,y2,z[k]);

                  //console.log(x1,y1,x2,y2,z[k],k);
                  drawContour(x1,y1,x2,y2,z[k],k);
                }
              }
            }
          }
        }
      }
    }
  }
  return Conrec;
})();
if (typeof exports !== "undefined") {
  exports.Conrec = Conrec;
}

},{}],3:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true, evil: true, regexp: true, bitwise: true */
/*globals typed, Int8Array */

"use strict";

(function() {

    var top    = 0;
    var right  = 1;
    var bottom = 2;
    var left   = 3;
    var none   = 4;

    function contour (levels, xdim, ydim, image, draw)
    {
      var c;
      var level;

      var used = new Uint8Array(xdim*ydim);
      var ii,jj;


      for ( c=0; c < levels.length; c++ ) {
	level = levels[c];

	for ( ii=0; ii < xdim*ydim; ii++) {
	  used[ii] = 0;
	}

	//  Search outer edges
	//
	//  Search top
	for ( jj=0, ii=0; ii < xdim-1; ii++ ) {
	  if ( image[jj*xdim + ii] < level && level <= image[jj*xdim + ii+1]) {
	    trace(xdim, ydim, level, ii  , jj  ,    top, image, used, draw);
	  }
	}

	//  Search right
	for (jj=0; jj < ydim-1; jj++) {
	  if ( image[jj*xdim + ii] < level && level <= image[(jj+1)*xdim + ii]) {
	    trace(xdim, ydim, level, ii-1, jj  ,  right, image, used, draw);
	  }
	}

	//  Search Bottom
	for (ii--; ii >= 0; ii--) {
	  if ( image[jj*xdim + ii+1]<level && level <= image[jj*xdim + ii]) {
	    trace(xdim, ydim, level, ii  , jj-1, bottom, image, used, draw);
	  }
	}

	//  Search Left
	for (ii=0, jj--; jj >= 0; jj--) {
	  if ( image[(jj+1)*xdim + ii] < level && level <= image[jj*xdim + ii] ) {
	    trace(xdim, ydim, level, ii  , jj  ,   left, image, used, draw);
	  }
	}

	//  Search each row of the image
	for (jj=1; jj < ydim-1; jj++) {
	  for (ii=0; ii < xdim-1; ii++) {
	    if ( !used[jj*xdim + ii] && image[jj*xdim + ii] < level && level <= image[jj*xdim + ii+1]) {
	      trace(xdim, ydim, level, ii, jj  ,    top, image, used, draw);
	    }
	  }
	}
      }
    }

    function trace (xdim, ydim, level, xCell, yCell, side, image, used, draw)
    {
      var ii = xCell;
      var jj = yCell;
      var origSide = side;

      var init = 1;
      var done = (ii<0 || ii>=xdim-1 || jj<0 && jj>=ydim-1);

      var flag;
      var a, b, c, d;
      var X, Y;

      while ( !done ) {
	flag = 0;

	a = image[ jj   *xdim + ii];
	b = image[ jj   *xdim + ii+1];
	c = image[(jj+1)*xdim + ii+1];
	d = image[(jj+1)*xdim + ii];

	if (init) {
	  init = 0;
	  switch (side) {
	  case top:
	    X = (level-a) / (b-a) + ii;
	    Y = jj;
	    break;
	  case right:
	    X = ii+1;
	    Y = (level-b) / (c-b) + jj;
	    break;
	  case bottom:
	    X = (level-c) / (d-c) + ii;
	    Y = jj+1;
	    break;
	  case left:
	    X = ii;
	    Y = (level-a) / (d-a) + jj;
	    break;
	  }

	}
	else {
	  if ( side==top ) { used[jj*xdim + ii] = 1; }

	  do {
	    if ( ++side == none ) { side = top; }

	    switch (side) {
	    case top:
	      if (a>=level && level>b) {
		flag = 1;
		X = (level-a) / (b-a) + ii;
		Y = jj;
		jj--;
	      }
	      break;
	    case right:
	      if( b>=level && level>c ) {
		flag = 1;
		X = ii+1;
		Y = (level-b) / (c-b) + jj;
		ii++;
	      }
	      break;
	    case bottom:
	      if( c>=level && level>d ) {
		flag = 1;
		X = (level-d) / (c-d) + ii;
		Y = jj+1;
		jj++;
	      }
	      break;
	    case left:
	      if( d>=level && level>a ) {
		flag = 1;
		X = ii;
		Y = (level-a) / (d-a) + jj;
		ii--;
	      }
	      break;
	    }
	  } while ( !flag );

	  if ( ++side === none ) { side = top; }
	  if ( ++side === none ) { side = top; }

	  if (ii==xCell && jj==yCell && side==origSide) { done = 1; }
	  if (ii<0 || ii>=xdim-1 || jj<0 || jj>=ydim-1) { done = 1; }
	}

	draw(X+.5 ,Y+.5, level);

	if (done) { draw(0, 0, undefined); }
      }
    }

    module.exports = contour;
}());


},{}],4:[function(require,module,exports){
/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9, imexam, alert */ 


(function() {
    "use strict";

      var imexam = require("./imexam");
      var conrec = require("./conrec");
      var contfv = require("./contfv");

      var binner = require("./bin");


    function drawContours(div, display) {
	var im   = JS9.GetImage({display: display});
	var form = $(div).find(".contour-form")[0];

	var data = imexam.ndops.ndarray(im.raw.data, [im.raw.height, im.raw.width]);

	var levelString = form.level.value;
	var binning	= $(form).find("#binning").val();;
	var smooth	= $(form).find("#smooth").val();;
	var quality	= $(form).find("input[type=radio]:checked").val();


	if ( binning === "None" ) {
	    binning = 1;
	} else {
	    data = binner.bin2d(data, parseInt(binning));
	}

	var level = JSON.parse("[" + levelString.trim().split(/\s+/).join(",") + "]").map(function(x) { return x*binning*binning; });
	
	if ( smooth !== "None" ) {
	    data = binner.smooth_gaussian2d(data, parseFloat(smooth));
	}

	var contours;

	JS9.waiting(true);
	setTimeout(function() {
	    try {
		var fudge = 0

		if ( binning > 1 ) {
		    fudge = 1;
		}

		if ( quality === "better" ) {
		    var c      = new conrec.Conrec();

		    try {
			var xcoord = imexam.ndops.iota(0, data.shape[0]-1).map(function(x) { return x*binning+(binning-1)/2 +1.0 })
			var ycoord = imexam.ndops.iota(0, data.shape[1]-1).map(function(x) { return x*binning+(binning-1)/2 +1.0 })

			//var xcoord = imexam.ndops.iota(1, data.shape[0]).map(function(x) { return (x-(binning-1)/2) * binning + fudge })
			//var ycoord = imexam.ndops.iota(1, data.shape[1]).map(function(x) { return (x-(binning-1)/2) * binning + fudge })

			c.contour(data
				, 0, data.shape[0]-1, 0, data.shape[1]-1 , xcoord, ycoord
				, level.length, level);
		    } catch (e) {
			alert("Too many coutour segments: Check your coutour levels.\n\nAre you trying to coutour the background levels of an image?");
			return;
		    }

		    contours = c.contourList().map(function(contour) {
			    return { shape: "polygon", pts: contour };
			    });
		} else {
		    var points   = [];
		        contours = [];

		    contours.push({ shape: "polygon", pts: points });

		    contfv(level, data.shape[0], data.shape[1], data.data
			, function(x, y, level) {
			    if ( level === undefined ) {
				points = [];
				contours.push({ shape: "polygon", pts: points });
			    } else {
				//points.push({ x: (x+0.5-(binning-1)/2) * binning + fudge, y: (y+0.5-(binning-1)/2) * binning + fudge });
				points.push({ x: x*binning + 0.5, y: y*binning + 0.5 });
			    }
			  });
		    contours.length = contours.length-1;
		}


		JS9.NewShapeLayer("contour", JS9.Catalogs.opts, {display: im});
		JS9.RemoveShapes("contour", {display: im});
		JS9.AddShapes("contour", contours, {color: "yellow"}, {display: im});
	    }
	    finally {
		JS9.waiting(false);
	    }
	}, 200);
    }

    function getMinMax(div, display) {
	var im  = JS9.GetImage({display: display});

	if ( im ) {
	    var form = $(div).find(".contour-form")[0];
	    var data = imexam.ndops.ndarray(im.raw.data, [im.raw.width, im.raw.height]);

	    form.min.value = imexam.ndops.minvalue(data).toFixed(2);
	    form.max.value = imexam.ndops.maxvalue(data).toFixed(2);
	}
    }

    function makeLevel(div, display) {
	var i;
	var im  = JS9.GetImage({display: display});

	if ( im ) {
	    var form = $(div).find(".contour-form")[0];

	    var n     = Number(form.nlevel.value);
	    var level = imexam.ndops.ndarray(imexam.ndops.iota(1, n));

	    var min   = Number(form.min.value);
	    var max   = Number(form.max.value);

	    imexam.ndops.divs(level, level, n+1);		// Try n levels from min to max.
	    imexam.ndops.muls(level, level, max-min);
	    imexam.ndops.adds(level, level, min);

	    var levText = [];
	    for ( i = 0; i < level.shape[0]; i++ ) {
		levText.push(level.data[i].toFixed(2));
	    }

	    form.level.value = levText.join("\n");
	}
    }

    function contInit() {
	var im  = JS9.GetImage({display: this.display});
	var div = this.div;

	div.innerHTML = '<form class="contour-form">							\
	    <table><tr>	<td>N</td>									\
			<td><input type=text name=nlevel value=5 size=10></td>				\
		       	<td><input type=button value="Draw Contours" class="drw-contour"></td></tr>	\
	           <tr>	<td>Min</td>									\
			<td><input type=text name=min size=10></td>					\
		       	<td><input type=button value="Set Min/Max" class="get-min-max"></td></tr>	\
	           <tr>	<td>Max</td>									\
			<td><input type=text name=max size=10></td></tr>				\
	           <tr>	<td valign=top>Levels:</td>							\
	    		<td rowspan=5><textarea type=textarea rows=12 cols=10 name=level class="contour-levels">	\
			    </textarea>									\
		       	<td valign=top><input type=button value="Make Levels" class="make-levels"></td>	\
		   </tr>										\
		   <tr><td><br></td></tr>										\
		   <tr>	<td></td><td align=center valign=top>						\
				Binning									\
				<select id=binning name=binpix>						\
				<option>None</option>							\
				<option>2</option>							\
				<option>3</option>							\
				<option>4</option>							\
				<option>5</option>							\
				<option>6</option>							\
				<option>7</option>							\
				<option>8</option>							\
				</select>								\
				pix									\
			</td>										\
		   </tr>										\
		   <tr>	<td></td><td align=center valign=top>						\
				Smooth									\
				<select id=smooth name=smopix>						\
				<option>None</option>							\
				<option value=0.75 selected>3</option>							\
				<option value=1.00>5</option>							\
				<option value=1.25>7</option>							\
				</select>								\
				pix									\
			</td>										\
		   </tr>										\
		   <tr>	<td></td><td align=center valign=top><br>Quality:				\
				<br>&nbsp;<input type=radio name=quality value=faster checked>Faster	\
				<br>&nbsp;<input type=radio name=quality value=better>Better		\
			</td>										\
		   </tr>										\
	    </table>											\
	    <p>												\
	    </form>';

	var display = this.display;

	$(div).find(".drw-contour").on("mouseup", function () { drawContours(div, display); });
	$(div).find(".get-min-max").on("mouseup", function () { getMinMax(div, display); });
	$(div).find(".make-levels").on("mouseup", function () { makeLevel(div, display); });


	if ( im !== undefined ) {
	    getMinMax(div, display);
	    makeLevel(div, display);
	}

	imexam.fixupDiv(this);
    }

    JS9.RegisterPlugin("ImExam", "Contours", contInit, {
	    menu: "view",

            winTitle: "Contours",
            menuItem: "Contours",
	    help:     "imexam/contours.html",

	    toolbarSeparate: true,

            winDims: [325, 300],
    });
}());




},{"./bin":1,"./conrec":2,"./contfv":3,"./imexam":undefined}]},{},[4]);


