/*globals $, JS9 */

"use strict";

(function() {

    function reBinImage(div, display) {
	let opts, npos;
	let im   = JS9.GetImage({display: display});
	let form = $(div).find(".js9BinningForm")[0];
	// sanity check
	if( !im || !im.raw ) { return; }
	// initialize opts
	opts = {xcen:0, ycen:0, xdim:0, ydim:0, bin:1, filter:"",
		columns:"", cubecol:""};
	// get opts from form
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
	if( JS9.isNumber(form.bitpix.value) ){
	    opts.bitpix = parseInt(form.bitpix.value, 10);
	}
	opts.filter = form.filter.value;
	opts.columns = form.columns.value;
	opts.cubecol = form.cubecol.value;
	// if columns changed, we have to reset the center to 0
	if( im.raw.hdu.table && im.raw.hdu.table.columns !== opts.columns ){
	    opts. xcen = 0;
	    opts. ycen = 0;
	}
	opts.separate = $(form.separate).prop("checked");
	if( opts.cubecol ) opts.separate = true;
	opts.binMode = $('input[name="binmode"]:checked').val();
	im.displaySection(opts);
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
	if ( !display ) {
	    if( this ){
		display = this.display;
	    } else {
		display = JS9.displays[0];
	    }
	}
	im   = JS9.GetImage({display: display});
	if ( im ) {
	    form = $(div).find(".js9BinningForm")[0];

	    if ( im.raw.hdu !== undefined ) {
		hdu = im.raw.hdu;
		hdu.bin = hdu.bin || 1;
		hdu.binMode = hdu.binMode || JS9.globalOpts.binMode || "s";
		form.rebin.disabled = false;
	        if( hdu.table !== undefined && !JS9.ishealpix(im) ) {
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
		    form.bitpix.value = hdu.table.bitpix || JS9.globalOpts.table.bitpix;
		    form.columns.value = hdu.table.columns || "";
		    form.cubecol.value = "";
		    form.bin.disabled = false;
		    form.xcen.disabled = false;
		    form.ycen.disabled = false;
		    form.xdim.disabled = false;
		    form.ydim.disabled = false;
		    // form.binmode.disabled = false;
		    form.filter.disabled = false;
		    form.bitpix.disabled = false;
		    form.columns.disabled = false;
		    form.cubecol.disabled = false;
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
		    form.filter.value = "";
		    form.bitpix.value = im.raw.header.BITPIX;
		    form.columns.value = "";
		    form.cubecol.value = "";
		    form.bin.disabled = false;
		    form.xcen.disabled = false;
		    form.ycen.disabled = false;
		    form.xdim.disabled = false;
		    form.ydim.disabled = false;
		    form.binmode.disabled = false;
		    form.filter.disabled = true;
		    form.filter.style.backgroundColor="#E0E0E0";
		    form.bitpix.disabled = true;
		    form.bitpix.style.backgroundColor="#E0E0E0";
		    form.columns.disabled = true;
		    form.columns.style.backgroundColor="#E0E0E0";
		    form.cubecol.disabled = true;
		    form.cubecol.style.backgroundColor="#E0E0E0";
		}
		// cube support makes no sense using a parentFile
		if( im.parentFile &&
		    JS9.helper.connected && JS9.helper.js9helper ){
		    form.cubecol.value = "";
		    form.cubecol.disabled = true;
		    form.cubecol.style.backgroundColor="#E0E0E0";
		}
		// average or sum
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
	let i, s, cols, el, smode;
	let that = this;
	let elhdu = "&nbsp;";
	let binblock = "Block";
	let binblocked = "blocked";
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
	if( im.imtab === "table" ){
	    binblock = "Bin";
	    binblocked = "binned";
	    if( !JS9.ishealpix(im) ){
		elhdu = '&nbsp;<select name="selectcube" class="js9-binning-hdulist JS9Select">';
	    }
	}

	html = `<form class="js9BinningForm js9Form">
	        <table style="margin:0px; cellspacing:0; border-collapse:separate; border-spacing:4px 10px;">
	           <tr>	<td><input type=button class="js9-binning-full JS9Button2" value="Load full image" style="text-align:right;"></td>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
                        <td>${elhdu}</td>
		   </tr>
	           <tr>	<td>Center:</td>
			<td><input type=text name=xcen size=10 style="text-align:right;"></td>
			<td><input type=text name=ycen size=10 style="text-align:right;"></td>
			<td>&nbsp;center position of section</td>
		   </tr>
	           <tr>	<td>Size:</td>
			<td><input type=text name=xdim size=10 style="text-align:right;"></td>
			<td><input type=text name=ydim size=10 style="text-align:right;"></td>
			<td>&nbsp;width, height of section</td>
		   </tr>
                   <tr>	<td>${binblock}:</td>
			<td><input type=text name=bin value=1 size=10 style="text-align:right;"></td>
			<td></td>
			<td>&nbsp;apply ${binblock.toLowerCase()} factor to ${im.imtab}</td>
		   </tr>`;

	if( im.imtab === "image" || JS9.ishealpix(im) ){
	    html += `
	           <tr>	<td>Mode:</td>
                        <td><input type=radio name=binmode value="s" class="sum-pixels" style="text-align:left;">sum</td>
                        <td><input type=radio name=binmode value="a" class="avg-pixels" style="text-align:left;">average</td>
			<td>&nbsp;sum or avg ${binblocked} pixels?</td>
		   </tr>`;
	    html += `
		   <tr>	<td>Bitpix:</td>
			<td colspan="2"><textarea name=bitpix rows="1" cols="22" style="padding-left:5px; text-align:left;" autocapitalize="off" autocorrect="off"></textarea></td>
			<td>&nbsp;image bitpix</td>
		   </tr>`;
	} else {
	    html += `
	           <tr>	<td>Mode:</td>
                        <td><input type=checkbox name=xbinmode value="s" class="sum-pixels" style="text-align:left;" checked disabled>sum</td>
			<td></td>
			<td>&nbsp;binned tables are summed</td>
		   </tr>`;
	    html += `
		   <tr>	<td>Bitpix:</td>
			<td colspan="2"><textarea name=bitpix rows="1" cols="22" style="padding-left:5px; text-align:left;" autocapitalize="off" autocorrect="off"></textarea></td>
			<td>&nbsp;bitpix when binning table</td>
		   </tr>`;
	}
	html += `  <tr>	<td>Filter:</td>
			<td colspan="2"><textarea name=filter rows="1" cols="22" style="padding-left:5px; text-align:left;" autocapitalize="off" autocorrect="off"></textarea></td>
			<td>&nbsp;event/row filter when binning table</td>
		   </tr>

		   <tr>	<td>BinCols:</td>
			<td colspan="2"><textarea name=columns rows="1" cols="22" style="padding-left:5px; text-align:left;" autocapitalize="off" autocorrect="off"></textarea></td>
			<td>&nbsp;alternate binning cols for table</td>
		   </tr>

	           <tr>	<td>CubeCol:</td>
			<td colspan="2"><textarea name=cubecol class="js9-binning-cubecol" rows="1" cols="22" style="padding-left:5px; text-align:left;" autocapitalize="off" autocorrect="off"></textarea></td>
			<td>&nbsp;table&rarr;cube: col[:min:max][:binsiz]</td>
		   </tr>

	           <tr>	<td>Separate:</td>
                        <td><input type=checkbox name=separate class="js9-binning-sep" style="text-align:left;"></td>
			<td></td>
			<td>&nbsp;display as separate image?</td>
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
	$(div).find(".js9-binning-cubecol").on("input", function () {
	    // cubes are generated as separate displays
	    // but resetting the cubecol should reset the separate mode
	    smode = $(this).val() ? true : !!that.sep;
	    $(div).find(".js9-binning-sep").prop("checked", smode);
	});

	if( im.imtab === "table" && im.hdus && im.hdus.length ){
	    for(i=0; i<im.hdus.length; i++){
		if( im.hdus[i].name === "EVENTS" ||
		    im.hdus[i].name === "STDEVT" ){
		    cols = im.hdus[i].cols;
		    break;
		}
	    }
	    if( cols && cols.length ){
		el = $(div).find(".js9-binning-hdulist");
		el.append(`<option value="" disabled=disabled>List columns</option>`);
		for(i=0; i<cols.length; i++){
		    s = `${cols[i].name}:${cols[i].type}`;
		    if( JS9.notNull(cols[i].min) &&
			JS9.notNull(cols[i].max) ){
			s += `:${cols[i].min}:${cols[i].max}`;
		    }
		    el.append(`<option>${s}</option>`);
		}
		el.prop('selectedIndex', 0);
		el.on("change", function () {
		    s = $(this).val().replace(/:.*/, "");
		    JS9.CopyToClipboard(s, im);
		    el.prop('selectedIndex', 0);
		});
	    }
	}

	// set up to rebin when <cr> is pressed, if necessary
	if( JS9.globalOpts.runOnCR ){
	    $(div).find(".js9BinningForm").data("enterfunc", "rebin");
	}

	// get current params
	getBinParams.call(null, div, display);
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

            winDims: [570, 375]
    });
}());
