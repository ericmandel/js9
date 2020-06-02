/*globals $, JS9, Fitsy */

"use strict";

(function() {

    function reBinImage(div, display) {
	let hdu, opts, npos;
	let im   = JS9.GetImage({display: display});
	let form = $(div).find(".js9BinningForm")[0];
	let rebin = function(im, hdu, display){
	    let ss;
	    let rexp = /(\[.*[a-zA-Z0-9_].*\])\[.*\]/;
	    let topts = {display: display};
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
	if ( !im || !im.raw ) { return; }

	hdu = im.raw.hdu;

	switch(JS9.fitsLibrary()){
	case "fitsy":
	    if ( hdu.imtab === "image" ) {
		JS9.error("image binning not implemented");
	    } else {
		opts = $.extend(true, {}, JS9.fits.opts,
	        { table: { xcen: form.xcen.value , ycen: form.ycen.value,
			   xdim: form.xdim.value , ydim: form.ydim.value,
			   bin: form.bin.value , filter: form.filter.value }
	        });
		Fitsy.readTableHDUData(hdu.fits, hdu, opts, function(hdu){
		    rebin(im, hdu, display);
		});
	    }
	    break;
	case "cfitsio":
	    opts = {xcen: 0, ycen: 0, xdim: 0, ydim: 0, bin: 1, filter: ""};
	    if( JS9.isNumber(form.xcen.value) ){
		opts.xcen = parseFloat(form.xcen.value);
	    }
	    if( JS9.isNumber(form.ycen.value) ){
		opts.ycen = parseFloat(form.ycen.value);
	    }
	    npos = im.maybePhysicalToImage({x: opts.xcen, y: opts.ycen});
	    if( npos ){
		opts.xcen = npos.x;
		opts.ycen = npos.y;
	    }
	    if( JS9.isNumber(form.xdim.value) ){
		opts.xdim = Math.floor(parseFloat(form.xdim.value));
	    }
	    if( JS9.isNumber(form.ydim.value) ){
		opts.ydim = Math.floor(parseFloat(form.ydim.value));
	    }
	    if( JS9.isNumber(form.bin.value) ){
		opts.bin = parseFloat(form.bin.value);
	    } else {
		opts.bin = form.bin.value;
	    }
	    opts.filter = form.filter.value;
	    opts.separate = $(form.separate).prop("checked");
	    opts.binMode = $('input[name="binmode"]:checked').val();
	    im.displaySection(opts);
	    break;
	}
    }

    function centerBinImage(xdim, ydim, div, display) {
	let im   = JS9.GetImage({display: display});
	let form = $(div).find(".js9BinningForm")[0];
	let fdims = im.fileDimensions();
	form.xcen.value = 0;
	form.ycen.value = 0;
	if( xdim > 0 ){
	    form.xdim.value = xdim;
	} else {
	    form.xdim.value = fdims.xdim;
	}
	if( ydim > 0 ){
	    form.ydim.value = ydim;
	} else {
	    form.ydim.value = fdims.ydim;
	}
	reBinImage(div, display);
    }

    function getBinParams(div, display) {
	let im, ipos, lpos, form, hdu, bin;
	if ( display === undefined ) {
	    div     = this.div;
	    display = this.display;
	}
	im   = JS9.GetImage({display: display});

	if ( im ) {
	    form = $(div).find(".js9BinningForm")[0];

	    if ( im.raw.hdu !== undefined ) {
		hdu = im.raw.hdu;
		hdu.bin = hdu.bin || 1;
		hdu.binMode = hdu.binMode || JS9.globalOpts.binMode || "s";
		form.rebin.disabled = false;
	        if ( hdu.table !== undefined ) {
		    // get current center
		    ipos = im.getPan();
		    // convert to physial (file) coords
		    lpos = im.imageToLogicalPos({x: ipos.ox, y: ipos.oy});
		    form.xcen.value = String(Math.floor(lpos.x + 0.5));
		    form.ycen.value = String(Math.floor(lpos.y + 0.5));
		    form.bin.value = String(hdu.table.bin);
		    form.xdim.value = String(Math.floor(hdu.table.xdim));
		    form.ydim.value = String(Math.floor(hdu.table.ydim));
		    form.filter.value = hdu.table.filter || "";
		    form.bin.disabled = false;
		    form.xcen.disabled = false;
		    form.ycen.disabled = false;
		    form.xdim.disabled = false;
		    form.ydim.disabled = false;
		    // form.binmode.disabled = false;
		    form.filter.disabled = false;
		} else {
		    hdu.bin = hdu.bin || 1;
		    bin = hdu.bin > 0 ? hdu.bin : 1 / Math.abs(hdu.bin);
		    // hack: if a parent file was used to make this image,
		    // calculate binning from its LTM/TLV parameters
		    if( im.parentFile && im.raw.header     && 
			im.raw.header.LTM1_1 !== undefined ){
			bin = 1.0 / Math.abs(im.raw.header.LTM1_1);
		    }
		    // get image center from raw data
		    // ipos = {x: im.raw.width / 2, y: im.raw.height / 2};
		    // get current center
		    ipos = im.getPan();
		    // convert to physial (file) coords
		    lpos = im.imageToLogicalPos({x: ipos.ox, y: ipos.oy});
		    // form.xcen.value = String(Math.floor(lpos.x + 0.5));
		    // form.ycen.value = String(Math.floor(lpos.y + 0.5));
		    form.xcen.value = String(Math.floor(lpos.x + 0.5*(bin-1)));
		    form.ycen.value = String(Math.floor(lpos.y + 0.5*(bin-1)));
		    form.bin.value = String(hdu.bin);
		    form.xdim.value = String(Math.floor(hdu.naxis1 * bin));
		    form.ydim.value = String(Math.floor(hdu.naxis2 * bin));
		    if( JS9.globalOpts.enableImageFilter ){
			form.filter.value = im.raw.filter || "";
		    } else {
			form.filter.value = "";
		    }
		    form.bin.disabled = false;
		    form.xcen.disabled = false;
		    form.ycen.disabled = false;
		    form.xdim.disabled = false;
		    form.ydim.disabled = false;
		    form.binmode.disabled = false;
		    if( JS9.globalOpts.enableImageFilter ){
			form.filter.disabled = false;
		    } else {
			form.filter.disabled = true;
			form.filter.style.backgroundColor="#E0E0E0";
		    }
		}
		if( hdu.binMode === "a" ){
		    $('input:radio[class="avg-pixels"]').prop('checked',true);
		} else {
		    $('input:radio[class="sum-pixels"]').prop('checked',true);
		}
	    } else {
		form.rebin.disabled = true;
	    }
	}
    }

    function binningInit() {
	let binblock, binblocked;
	let that = this;
	let html = "";
	let div = this.div;
	let display = this.display;
	let win = this.winHandle;
	let disclose = win ? "" : 'style="display:none;"';
	let im  = JS9.GetImage({display: this.display});

	if( !im || (im && !im.raw.hdu) ){
	    div.innerHTML = '<p style="padding: 5px"><center>FITS image sections, with binning and filtering</center>';
	    return;
	}

	if( im.imtab === "image" ){
	    binblock = "Block";
	    binblocked = "blocked";
	} else {
	    binblock = "Bin";
	    binblocked = "binned";
	}

	html = `<form class="js9BinningForm js9Form">
	        <table style="margin:0px; cellspacing:0; border-collapse:separate; border-spacing:4px 10px;">
	           <tr>	<td><input type=button class="js9-binning-full JS9Button2" value="Load full image" style="text-align:right;"></td>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
		   </tr>
	           <tr>	<td>Center:</td>
			<td><input type=text name=xcen size=10 style="text-align:right;"></td>
			<td><input type=text name=ycen size=10 style="text-align:right;"></td>
			<td>&nbsp(center position of section)</td>
		   </tr>
	           <tr>	<td>Size:</td>
			<td><input type=text name=xdim size=10 style="text-align:right;"></td>
			<td><input type=text name=ydim size=10 style="text-align:right;"></td>
			<td>&nbsp(width, height of section)</td>
		   </tr>
                   <tr>	<td>${binblock}:</td>
			<td><input type=text name=bin value=1 size=10 style="text-align:right;"></td>
			<td></td>
			<td>&nbsp(apply ${binblock.toLowerCase()} factor to ${im.imtab})</td>
		   </tr>`;

	if( im.imtab === "image" ){
	    html += `
	           <tr>	<td>Mode:</td>
                        <td><input type=radio name=binmode value="s" class="sum-pixels" style="text-align:left;">sum</td>
                        <td><input type=radio name=binmode value="a" class="avg-pixels" style="text-align:left;">average</td>
			<td>&nbsp(sum or avg ${binblocked} pixels?)</td>
		   </tr>`;
	} else {
	    html += `
	           <tr>	<td>Mode:</td>
                        <td><input type=checkbox name=xbinmode value="s" class="sum-pixels" style="text-align:left;" checked disabled>sum</td>
			<td></td>
			<td>&nbsp(binned tables are summed)</td>
		   </tr>`;
	}
	html += `  <tr>	<td>Filter:</td>
			<td colspan="2"><textarea name=filter rows="1" cols="22" style="text-align:left;" autocapitalize="off" autocorrect="off"></textarea></td>
			<td>&nbsp(event/row filter for table)</td>
		   </tr>
	           <tr>	<td>Separate:</td>
                        <td><input type=checkbox name=separate class="js9-binning-sep" style="text-align:left;"></td>
			<td></td>
			<td>&nbsp(display as separate image?)</td>
		   </tr>
		   <tr>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
                        <td>
                            <input type=button name=close value="Cancel" class="js9-binning-close JS9Button2" ${disclose}'>
                            &nbsp;
			    <input type=button name=rebin value="Get Data" class="js9-binning-rebin JS9RunButton">
                        </td>
		   </tr>
	    </table>
	    </form>`;
        $(div).html(html);

	// button and checkbox actions
	$(div).find(".js9-binning-full").on("click", function ()  { centerBinImage(0, 0, div, display); });
	$(div).find(".js9-binning-rebin").on("click", function () { reBinImage(div, display); });
	$(div).find(".js9-binning-close").on("click", function () { if( win ){ win.close(); } });
	$(div).find(".js9-binning-sep").change(function() { that.sep = $(this).prop("checked"); });
	$(div).find(".js9-binning-sep").prop("checked", !!that.sep);

	// set up to rebin when <cr> is pressed, if necessary
	if( JS9.globalOpts.runOnCR ){
	    $(div).find(".js9BinningForm").data("enterfunc", "rebin");
	}

	// get current params
	if ( im ) {
	    getBinParams(div, display);
	}
    }

    JS9.RegisterPlugin("FITS", "Binning", binningInit, {
	    menu: "view",

            winTitle: "Image Sections, with Binning and Filtering",
	    winResize: true,

            menuItem: "Bin/Filter/Section",

	    onplugindisplay:  binningInit,
	    onimageload:      binningInit,
	    onimagedisplay:   binningInit,
	    onsetpan:         binningInit,
	    onsetzoom:        binningInit,

	    help:     "fitsy/binning.html",

            winDims: [520, 280]
    });
}());
