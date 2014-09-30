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
