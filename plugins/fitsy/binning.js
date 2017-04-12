/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9, Fitsy */

"use strict";

(function() {

    function reBinImage(div, display) {
	var hdu, options;
	var im   = JS9.GetImage({display: display});
	var form = $(div).find(".binning-form")[0];
	var rebin = function(im, hdu, display){
	    var ss;
	    var rexp = /(\[.*[a-zA-Z0-9_].*\])\[.*\]/;
	    var topts = {display: display};
	    if( form.separate.checked ){
		// replace old extensions with new
		// would be better to combine them, but ...
		if( form.filter.value ){
		    ss = '[' + form.filter.value.replace(/\s+/g,"") + ']';
		    topts.id = im.id.replace(rexp, "$1") + ss;
		    if( im.fitsFile ){
			topts.file = im.fitsFile.replace(rexp, "$1") + ss;
		    } else {
			topts.file = topts.id;
		    }
		}
		JS9.checkNew(new JS9.Image(hdu, topts));
	    } else {
		JS9.RefreshImage(hdu, topts);
	    }
	};
	if ( !im ) { return; }

	options = $.extend(true, {}, JS9.fits.options,
	      { table: { cx: form.cx.value , cy: form.cy.value,
			 nx: form.nx.value , ny: form.ny.value,
			 bin: form.bin.value , filter: form.filter.value }
	      });

	hdu = im.raw.hdu;

	if ( hdu.type === "image" ) {
	      JS9.error("image binning not implemented");
	} else {
	    switch(JS9.fitsLibrary()){
	    case "fitsy":
		Fitsy.readTableHDUData(hdu.fits, hdu, options, function(hdu){
		    rebin(im, hdu, display);
		});
		break;
	    case "cfitsio":
		if( !hdu.fits || !hdu.fits.fptr ){
		    JS9.error("virtual FITS file is missing for binning");
		}
		JS9.getFITSImage(hdu.fits, hdu, options, function(hdu){
		    rebin(im, hdu, display);
		});
		break;
	    }
	}
    }

    function getBinParams(div, display) {
	var im, form;
	if ( display === undefined ) {
	    div     = this.div;
	    display = this.display;
	}
	im   = JS9.GetImage({display: display});

	if ( im ) {
	    form = $(div).find(".binning-form")[0];

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
		    if ( im.raw.hdu.bin !== undefined ) {
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
	var that = this;
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

	/*eslint-disable no-multi-str */
	$(div).html('<form class="binning-form" style="margin: 10px">					\
	    <table><tr>	<td>Bin&nbsp;factor:</td>							\
			<td><input type=text name=bin value=1 size=10 style="text-align:right;"></td>	\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td>Image&nbsp;center:</td>									\
			<td><input type=text name=cx size=10 style="text-align:right;"></td>		\
			<td><input type=text name=cy size=10 style="text-align:right;"></td>    	\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td>Image&nbsp;size:</td>							\
			<td><input type=text name=nx size=10 style="text-align:right;"></td>		\
			<td><input type=text name=ny size=10 style="text-align:right;"></td>		\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td>Event filter:</td>									\
			<td colspan="2"><input type=text name=filter size="32" style="text-align:left;"></td>	\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td colspan="2">Display as a separate image?</td>				\
			<td><input type=checkbox name=separate class="sep-image" style="text-align:left;"></td>	\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		   </tr>										\
	           <tr>	<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		   </tr>										\
		   <tr>											\
			<td><input type=button name=rebin value="Run" class="rebin-image"></td>	\
			<td>&nbsp;</td>									\
			<td>&nbsp;</td>									\
		       	<td><input type=button name=close value="Close" class="close-image" ' + disclose + '></td>	\
		   </tr>										\
	    </table>											\
	    </form>');
	/*eslint-enable no-multi-str */

	// click doesn't work on localhost on a Mac using Chrome/Safari, but mouseup does ...
	$(div).find(".rebin-image").on("mouseup", function () { reBinImage(div, display); });
	$(div).find(".close-image").on("mouseup", function () { if( win ){ win.close(); } });
	$(div).find(".sep-image").change(function() { that.sep = $(this).prop("checked"); });

	// set separate button
	$(div).find(".sep-image").prop("checked", !!that.sep);

	// get current params
	if ( im ) {
	    getBinParams(div, display);
	}
    }

    JS9.RegisterPlugin("Fits", "Binning", binningInit, {
	    menu: "view",

            winTitle: "FITS Binary Table Binning/Filtering",
	    winResize: true,

            menuItem: "Binning/Filtering",

	    onplugindisplay:  binningInit,
	    onimageload:      binningInit,
	    onimagedisplay:   binningInit,

	    help:     "fitsy/binning.html",

            winDims: [480, 240]
    });
}());
