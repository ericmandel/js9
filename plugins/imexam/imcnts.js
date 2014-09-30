/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9, imexam, Int32Array */ 

"use strict";


(function() {
    var imexam   = require("./imexam");
    var template = imexam.template;
    var mask     = imexam.ndops.mask;

    function runImCnts(im, xreg) {
	var i;
	var div  = this.div;
	var text = $(div).find(".imcnts-result")[0];

	var data = imexam.ndops.ndarray(im.raw.data, [im.raw.height, im.raw.width]);

	var regs = JS9.GetRegions({display: im});
	var mimg = imexam.ndops.zeros(data.shape, Int32Array);

	var list = mask.listRegions(regs);
	           mask.drawRegions(list, mimg.data, mimg.shape[0]);

	var cnts = imexam.ndops.imcnts(data, mimg, list.length+1);

	var backgr_cnts = 0, backgr_area = 0;

	var back = [];
	var srce = [];
	var net, regno;

	for ( i = 0; i < list.length; i++ ) {
	    if ( mask.hasTag(list[i], "background") ) {
		regno = list[i].regno;

		backgr_cnts += cnts.cnts.get(regno);
		backgr_area += cnts.area.get(regno);

		back.push({ regno: regno, cnts: cnts.cnts.get(regno), area: cnts.area.get(regno) });
	    }
	}

	for ( i = 0; i < list.length; i++ ) {
	    if ( mask.hasTag(list[i], "source") && !mask.hasTag(list[i], "exclude") ) {
		regno = list[i].regno;

		if ( backgr_area > 0 ) {
		    net = cnts.cnts.get(regno) - (backgr_cnts * (cnts.area.get(regno)/backgr_area));
		} else {
		    net = cnts.cnts.get(regno);
		}

		srce.push({ regno: regno, net: net, cnts: cnts.cnts.get(regno), area: cnts.area.get(regno) });
	    }
	}

	$(text).html("Source\n"
		   + "regno         counts       area            net\n"
		   + "-----         ------       ----            ---\n"
		   + srce.map(function(x, i) { return template("{regno%5d} {cnts%14.3f} {area%10.3f} {net%14.3f}", x); }).join("\n")
		   + "\n\nBackground\n"
		   + "regno         counts       area\n"
		   + "-----         ------       ----\n"
		   + back.map(function(x, i) { return template("{regno%5d} {cnts%14.3f} {area%10.3f}", x); }).join("\n"));
    }

/*
    function getRegions(div, display) {
	var im  = JS9.GetImage({display: display});

	if ( im ) {
	    var data = imexam.ndops.ndarray(im.raw.data);
	    var form = $(div).find(".imcnts-form")[0];

	    form.min.value = imexam.ndops.minvalue(data).toFixed(2);
	    form.max.value = imexam.ndops.maxvalue(data).toFixed(2);
	}
    }
 */

    function imcntsInit() {
	var div = this.div;

/*
	div.innerHTML = '<form class="imcnts-form">							\
	    <table><tr>	<td>Source</td>									\
			<td>Background</td>								\
		       	<td><input type=button value="Run ImCnts" class="run-imcnts"></td></tr>		\
	           <tr>	<td><textarea type=textarea rows=12 cols=20 name=level class="imcnts-src">	\
			    </textarea>									\
	    		<td><textarea type=textarea rows=12 cols=20 name=level class="imcnts-bkg">	\
			    </textarea>									\
		       	<td><input type=button value="Get Regions" class="get-min-max"></td></tr>	\
	           <tr>	<td>Results</td></tr>								\
	           <tr> <td colspan=3><textarea type=textarea rows=12 cols=60 name=level class="imcnts-levels">	\
			              </textarea>							\
		   </tr>										\
	    </table>											\
	    <p>												\
	    </form>';
 */

	div.innerHTML = '<form class="imcnts-form">							\
	    <table>											\
	           <tr>	<td>Counts in Regions</td></tr>							\
	           <tr> <td colspan=3><textarea type=textarea rows=12 cols=60 name=level class="imcnts-result">	\
			              </textarea>							\
		   </tr>										\
	    </table>											\
	    <p>												\
	    </form>';

	//var display = this.display;
	//$(div).find(".run-imcnts").on("mouseup", function ()  { runImCnts (div, display); });
	//$(div).find(".get-regions").on("mouseup", function () { getRegions(div, display); });

	imexam.fixupDiv(this);
    }

    JS9.RegisterPlugin("ImExam", "ImCnts", imcntsInit, {
	    menu: "analysis",

            winTitle: "ImCounts",
            menuItem: "ImCounts",
	    help:     "imexam/imcnts.html",

	    toolbarSeparate: true,

            onregionschange: runImCnts,
            winDims: [600, 250],
    });
}());
