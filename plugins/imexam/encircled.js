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
