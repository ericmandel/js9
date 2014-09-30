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
