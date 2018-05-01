/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9, require */ 

"use strict";


(function() {
    var imexam = require("./imexam");

    // eslint-disable-next-line no-multi-str
    var statTemplate = "                                                                                \
        <table width=100% style='padding-right: 6px; padding-left: 0px'>                                \
            <tr><td align=right>position x</td> <td align=right>{reg.x%.2f}              </td>          \
            <td align=right>y</td>              <td align=right>{reg.y%.2f}             </td></tr>      \
            <tr><td align=right>box width</td>      <td align=right>{reg.width%.2f}         </td>       \
            <td align=right>height</td>         <td align=right>{reg.height%.2f}        </td></tr>      \
            <tr><td align=right>min</td>        <td align=right>{min%.2f}               </td>           \
            <td align=right>max</td>            <td align=right>{max%.2f}               </td></tr>      \
            <tr><td align=right>totcounts</td>     <td align=right colspan=3>{totcnts.sum%.2f}</tr>   \
            <tr><td align=right>bscounts</td>     <td align=right colspan=3>{bscnts.sum%.2f}</tr>     \
            <tr><td align=right>bkgd</td>     <td align=right>{bkgd.value%.2f}      </td>             \
            <td align=right>noise</td>          <td align=right>{bkgd.noise%.2f}      </td></tr>      \
            <tr><td align=right>centroid x</td> <td align=right>{bscnts.cenx%.2f}     </td>           \
            <td align=right>y</td>              <td align=right>{bscnts.ceny%.2f}     </td></tr>      \
            <tr><td align=right>FWHM</td>       <td align=right>{bscnts.fwhm%.2f}     </td>           \
            <td align=right></td>            <td align=right>{bscnts.rms%.2f}      </td></tr>         \
        </table>";

    function regionStats(im, xreg){
        var section = imexam.reg2section(xreg);
	var imag    = imexam.getRegionData(im, xreg);

        var data    = imexam.ndops.assign(imexam.ndops.zeros(imag.shape), imag);
        var data2   = imexam.ndops.assign(imexam.ndops.zeros(imag.shape), imag);

        var stats   = {};

	if( !im || !xreg ){
	    return null;
	}

        stats.reg = xreg;
        stats.min = imexam.ndops.minvalue(imag);
        stats.max = imexam.ndops.maxvalue(imag);
        stats.bkgd  = imexam.imops.backgr(imag, 4);

	// background-subtracted data
        imexam.ndops.subs(data, imag, stats.bkgd.value);
        stats.bscnts = imexam.ndops.centroid(data, imexam.ndops.qcenter(data));
        stats.bscnts.cenx += section[0][0];
        stats.bscnts.ceny += section[1][0];

	// total counts
        stats.totcnts = imexam.ndops.centroid(data2, imexam.ndops.qcenter(data2));
        stats.totcnts.cenx += section[0][0];
        stats.totcnts.ceny += section[1][0];

	return stats;
    }

    function statUpdate(im, xreg) {
        var div = this.div;

        $(div).html(imexam.template(statTemplate, regionStats(im, xreg)));
    }

    function statInit() {
	imexam.fixupDiv(this);
        $(this.div).append("<p style='padding: 20px 0px 0px 20px; margin: 0px'>create, click, move, or resize a region to see stats<br>");
    }

    // add method to JS9 Image object and to public API
    JS9.Image.prototype.getRegionStats = function(xreg){
	return regionStats(this, xreg);
    };
    JS9.mkPublic("GetRegionStats", "getRegionStats");

    JS9.RegisterPlugin("ImExam", "RegionStats", statInit, {
	    menu: "analysis",

            winTitle: "Region Stats",
            menuItem: "Region Stats",
	    help:     "imexam/imexam.html#rgstat",

	    toolbarSeparate: true,

            onregionschange: statUpdate,
            winDims: [250, 250]
    });
}());
