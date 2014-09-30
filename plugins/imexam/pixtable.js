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

