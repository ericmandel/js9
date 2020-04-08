/*
 * image sync plugin (September 2, 2018)
 * whenever an operation is performed on this image, sync the target images
 */

/*global JS9, $, sprintf */

"use strict";

JS9.Sync = {};
JS9.Sync.CLASS = "JS9";     // class of plugins (1st part of div class)
JS9.Sync.NAME = "Sync";     // name of this plugin (2nd part of div class)
JS9.Sync.WIDTH =  512;	    // width of light window
JS9.Sync.HEIGHT = 335;	    // height of light window
JS9.Sync.BASE = JS9.Sync.CLASS + JS9.Sync.NAME;  // CSS base class name

JS9.Sync.HEADER = "<div class='JS9SyncText'><br><b>%s:</b></div>";
JS9.Sync.NCOL = 3;	    // number of columns in the ops display
JS9.Sync.COLWIDTH = 175;    // width of each ops column

JS9.Sync.headerHTML="Synchronize two or more images, so that when an operation is performed on one image, it also is performed on the other(s). Or sync once only.";

JS9.Sync.opHTML="$opactive&nbsp;&nbsp;$opname";

JS9.Sync.opactiveHTML='<input class="JS9SyncOpCheck" type="checkbox" name="%s" value="active"">';

JS9.Sync.opnameHTML='<b>%s</b>';

JS9.Sync.imageHTML="$imactive&nbsp;&nbsp;$imfile";

JS9.Sync.imactiveHTML='<input class="JS9SyncImCheck" type="checkbox" name="%s" value="active">';

JS9.Sync.imfileHTML='<b>%s</b>';

JS9.Sync.nofileHTML='<p><span class="JS9SyncNoFile">[Images will appear here as they are loaded]</span>';

JS9.Sync.footerHTML='<div class="JS9SyncButtons" <p>$sync&nbsp;&nbsp;&nbsp;&nbsp;$once&nbsp;&nbsp;&nbsp;&nbsp;$unsync</div>';

JS9.Sync.syncHTML='<span class="JS9SyncButton"><input type="button" class="JS9SyncButton" id="active" name="sync" value="Sync Repeatedly" onclick="javascript:JS9.Sync.xsync(\'%s\', this)"></span>';

JS9.Sync.onceHTML='<span class="JS9SyncButton"><input type="button" class="JS9SyncButton" id="active" name="once" value="Sync Once" onclick="javascript:JS9.Sync.xonce(\'%s\', this)"></span>';

JS9.Sync.unsyncHTML='<span class="JS9SyncButton"><input type="button" class="JS9SyncButton" id="active" name="unsync" value="Unsync" onclick="javascript:JS9.Sync.xunsync(\'%s\', this)"></span>';


JS9.Sync.getImsOps = function(el){
    const container = el.closest(".JS9SyncContainer");
    const ops = [];
    const ims = [];
    if( container.length ){
	// gather all selected images
	container.find(".JS9SyncImCheck").each((index, element) => {
	    let name = $(element).prop("name");
	    let checked = $(element).prop("checked");
	    if( checked ){
		ims.push(name);
	    }
	});
	// gather all selected ops
	container.find(".JS9SyncOpCheck").each((index, element) => {
	    let name = $(element).prop("name");
	    let checked = $(element).prop("checked");
	    if( checked ){
		ops.push(name);
	    }
	});
    }
    return {ims, ops};
};

// sync
JS9.Sync.xsync = function(did, target){
    let im;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(did));
    if( display.image ){
	im = display.image;
	// get ims and opts
	const {ims, ops} = JS9.Sync.getImsOps($(target));
	// sync images, if necessary
	if( ims.length && ops.length ){
	    im.syncImages(ops, ims);
	    JS9.Sync.setCheckboxes(im);
	}
    }
};

// sync once
JS9.Sync.xonce = function(did, target){
    let im;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(did));
    if( display.image ){
	im = display.image;
	// get ims and opts
	const {ims, ops} = JS9.Sync.getImsOps($(target));
	// copy params, if necessary
	if( ims.length && ops.length ){
	    im.copyParams(ops, ims);
	    JS9.Sync.setCheckboxes(im);
	}
    }
};

// unsync
JS9.Sync.xunsync = function(did, target){
    let im;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(did));
    if( display.image ){
	im = display.image;
	// get ims and opts
	const {ims, ops} = JS9.Sync.getImsOps($(target));
	// unsync images, if necessary
	if( ims.length && ops.length ){
	    im.unsyncImages(ops, ims);
	    JS9.Sync.setCheckboxes(im);
	}
    }
};

// get a SyncImage id based on the file image id
JS9.Sync.imid = function(im){
    const id = `${im.display.id}_${im.id}`;
    return `${id.replace(/[^A-Za-z0-9_]/g, "_")}SyncImage`;
};

// set checkbox for sync'ed options
JS9.Sync.setCheckboxes = function(im){
    let i, j, id, op, syncops, pinst;
    // sanity check
    if( !im ){
	return
    }
    // get current instance of this plugin
    pinst = im.display.pluginInstances.JS9Sync;
    // first turn all checkboxes off
    pinst.syncContainer.find(".JS9SyncOpCheck").prop("checked", false);
    pinst.syncContainer.find(".JS9SyncImCheck").prop("checked", false);
    // then turn on currently syn'ed options
    syncops = JS9.globalOpts.syncOps;
    // for each sync'ed op in this image ...
    for(i=0; i<syncops.length; i++){
	// get the op
	op = syncops[i];
	if( $.isArray(im.syncs[op]) ){
	    // turn on the checkbox associated with this op
	    pinst.syncContainer
		.find(".JS9SyncOpCheck")
		.filter(`[name=${op}]`)
		.prop("checked", true);
	    // for each file associated with the sync'ed op
	    for(j=0; j<im.syncs[op].length; j++){
		if( JS9.isImage(im.syncs[op][j]) ){
		    // jquery doesn't like brackets in names
		    id = im.syncs[op][j].id.replace(/\[.*\]/, "");
		    // turn on the checkbox associated with this file
		    pinst.syncContainer
			.find(".JS9SyncImCheck")
			.filter(`[name^=${id}]`)
			.prop("checked", true);
		}
	    }
	}
    }
};

// add a sync op to the list of available ops
JS9.Sync.addOp = function(op, ncol){
    let s, left, top, opname;
    const opts = [];
    const cls = `${JS9.Sync.BASE}Op`;
    // pre-processing
    switch(op){
    case "contrastbias":
	opname = "contrast/bias";
	break;
    case "wcs":
	opname = "wcs sys/units";
	break;
    default:
	opname = op;
	break;
    }
    // value to pass to the macro expander
    opts.push({name: "op", value: op});
    opts.push({name: "opactive", value: sprintf(JS9.Sync.opactiveHTML, op)});
    opts.push({name: "opname", value: sprintf(JS9.Sync.opnameHTML, opname)});
    // create the html for this op
    s = JS9.Image.prototype.expandMacro.call(null, JS9.Sync.opHTML, opts);
    this.syncOpDivs++;
    // add op to the op container at the specified column
    left = ncol * JS9.Sync.COLWIDTH;
    top = 0;
    return `<span class="JS9SyncOp" style="position:absolute; left:${left}px; top:${top}px" id="${cls}">${s}</span>`;
};

// add an image to the list of available images
JS9.Sync.addImage = function(im){
    let s, id, imid;
    const opts = [];
    const cls = `${JS9.Sync.BASE}ImageRow`;
    if( !im ){
	return;
    }
    // convenience variables
    imid = im.id;
    // unique id
    id = JS9.Sync.imid(im);
    // value to pass to the macro expander
    opts.push({name: "imid", value: im.id});
    opts.push({name: "imactive", value: sprintf(JS9.Sync.imactiveHTML, imid)});
    opts.push({name: "imfile", value: sprintf(JS9.Sync.imfileHTML, imid)});
    // create the html for this image
    s = im.expandMacro(JS9.Sync.imageHTML, opts);
    // one more div in the stack
    this.syncImageDivs++;
    // return image html to add to the image container
    return `<div class="${cls}" id="${id}">${s}</div>`;
};

// remove an image from the list of available images
JS9.Sync.removeImage = function(im){
    let id;
    if( im ){
	id = JS9.Sync.imid(im);
	$(`#${id}`).remove();
	this.syncImageDivs--;
	if( !this.syncImageDivs ){
	    this.syncImageContainer.html("");
	}
	return true;
    }
    return false;
};

// constructor: add HTML elements to the plugin
JS9.Sync.init = function(){
    let i, j, s, im, op, dispid, imhead, opts, nrow, idx, syncops, html;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold image container and header
    // initialize params
    if( this.idx === undefined ){
	this.idx = 0;
    }
    if( this.rate === undefined ){
	this.rate = JS9.Sync.rate;
    }
    // clean main container
    this.divjq.html("");
    // no images/divs loaded yet
    this.syncOpDivs = 0;
    this.syncImageDivs = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // convenience variables
    dispid = this.display.id;
    if( this.display.image ){
	this.lastim = this.display.image;
	imhead = sprintf(JS9.Sync.HEADER,
			 `Images that can be synced with ${this.lastim.id}`);
    } else {
	this.lastim = null;
	imhead = sprintf(JS9.Sync.HEADER,
			 `Images that can be synced`);
    }
    // main container
    this.syncContainer = $("<div>")
	.addClass(`${JS9.Sync.BASE}Container`)
	.attr("id", `${this.id}SyncContainer`)
        .css("overflow", "auto")
	.appendTo(this.divjq);
    s = JS9.Image.prototype.expandMacro.call(null, JS9.Sync.headerHTML);
    // header
    this.syncHeader = $("<div>")
	.addClass(`${JS9.Sync.BASE}Header`)
	.attr("id", `${dispid}Header`)
	.html(s)
	.appendTo(this.syncContainer);
    // container to hold images
    this.syncImageContainer = $("<div>")
	.addClass(`${JS9.Sync.BASE}ImageContainer`)
	.attr("id", `${this.id}SyncImageContainer`)
	.html(imhead)
	.appendTo(this.syncContainer);
    // add images
    html = "";
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( im !== this.display.image ){
	    html += JS9.Sync.addImage.call(this, im);
	}
    }
    html = html || JS9.Sync.nofileHTML;
    this.syncImageContainer.append(html);
    // add sync operations
    // NB: this double loop originally was written such that each div and span
    // was added to the DOM separately ... but not all of the spans actually
    // were added properly. This stackoverflow page:
    // https://stackoverflow.com/questions/1539841/wait-until-previous-append-is-complete
    // give the hint to generate one long html string and add all the spans
    // at once, which seems to work properly.
    // container to hold ops
    this.syncOpContainer = $("<div>")
	.addClass(`${JS9.Sync.BASE}OpContainer`)
	.attr("id", `${this.id}SyncOpContainer`)
        .html(sprintf(JS9.Sync.HEADER, "Operations that can be synced"))
	.appendTo(this.syncContainer);
    syncops = JS9.globalOpts.syncOps;
    nrow = Math.floor((syncops.length + JS9.Sync.NCOL - 1) / JS9.Sync.NCOL);
    for(j=0; j<nrow; j++){
	html = `<div class="${JS9.Sync.BASE}OpRow" id="${this.id}SyncOpRow">`;
	for(i=0; i<JS9.Sync.NCOL; i++){
	    idx = i * JS9.Sync.NCOL + j;
	    if( syncops[idx] ){
		op = syncops[idx];
		html += JS9.Sync.addOp.call(this, op, i);
	    }
	}
	html += "</div>";
	this.syncOpContainer.append(html);
    }
    opts = [];
    opts.push({name: "sync", value: sprintf(JS9.Sync.syncHTML, dispid)});
    opts.push({name: "once", value: sprintf(JS9.Sync.onceHTML, dispid)});
    opts.push({name: "unsync", value: sprintf(JS9.Sync.unsyncHTML, dispid)});
    s = JS9.Image.prototype.expandMacro.call(null, JS9.Sync.footerHTML, opts);
    // footer
    this.syncFooter = $("<div>")
	.addClass(`${JS9.Sync.BASE}Footer`)
	.attr("id", `${dispid}Footer`)
	.html(s)
	.appendTo(this.syncContainer);
    // initialize sync values for this image
    if( this.display.image && this.display.image.syncs ){
	JS9.Sync.setCheckboxes(this.display.image);
    }
};

// callback when dynamic selection is made
JS9.Sync.dysel = function(){
    const odisplay = JS9.getDynamicDisplayOr("previous");
    // turn off sync for previously selected display
    if( odisplay ){
	JS9.Sync.stop(odisplay);
    }
    // re-init the plugin
    JS9.Sync.init.call(this);
};

// process ops input to [un]sync
// called in image context
JS9.Sync.getOps = function(ops){
    let i, j, op;
    const xops = [];
    //  default from above ...
    ops = ops || JS9.globalOpts.syncOps;
    if( !$.isArray(ops) ){ ops = [ops]; }
    for(i=0, j=0; i<ops.length; i++){
	op = ops[i];
	switch(op){
	case "wcs":
	    // wcs is actually two operations
	    xops[j++] = "wcssys";
	    xops[j++] = "wcunits";
	    break;
	default:
	    xops[j++] = op;
	    break;
	}
    }
    return xops;
};

// process ims input to [un]sync
// called in image context
JS9.Sync.getIms = function(ims){
    let i, j, xim;
    const xims = [];
    ims = ims || JS9.images;
    if( !$.isArray(ims) ){ ims = [ims]; }
    for(i=0, j=0; i<ims.length; i++){
	// if image ids were passed, look up corresponding image objects
	if( typeof ims[i] === "string" ){
	    xim = JS9.lookupImage(ims[i]);
	} else {
	    xim = ims[i];
	}
	// exclude the originating image
	if( xim &&
	    (xim.id !== this.id || (xim.display.id !== this.display.id)) ){
	    xims[j++] = xim;
	}
    }
    return xims;
};

// sync image(s) when operations are performed on an originating image
// called in the image context
JS9.Sync.sync = function(...args){
    let i, j, xop, xim, xops, xims, xlen;
    let [ops, ims, opts] = args;
    const arr = [];
    // make sure sink object exists
    this.syncs = this.syncs || {active: true};
    // opts is optional
    opts = opts || {reciprocate: JS9.globalOpts.syncReciprocate};
    // 1 boolean arg: turn on/off sync'ing
    if( args.length === 1 && typeof ops === "boolean" ){
	this.syncs.active = ops;
	return;
    }
    // get regularized args
    xops = JS9.Sync.getOps.call(this, ops);
    xims = JS9.Sync.getIms.call(this, ims);
    xlen = xims.length;
    // reverse current image and target images?
    if( opts.reverse ){
	delete opts.reverse;
	for(i=0; i<xlen; i++){
	    JS9.Sync.sync.call(xims[i], xops, [this]);
	}
	return;
    }
    // for each op (colormap, pan, etc.)
    for(i=0; i<xops.length; i++){
	// current op
	xop = xops[i];
	this.syncs[xop] = this.syncs[xop] || [];
	ims = this.syncs[xop];
	// add images not already in the list
	for(j=0; j<xlen; j++){
	    xim = xims[j];
	    if( $.inArray(xim, ims) < 0 ){
		// add to list
		ims.push(xim);
		// we'll sync each new target image
		arr.push({im: this, xim: xim, xop: xop, xarg: null});
	    }
	}
    }
    // reciprocal sync'ing between all images?
    if( opts.reciprocate ){
	JS9.Sync.reciprocating = true;
	opts.reciprocate = false;
	for(i=0, xim=this; i<xlen; i++){
	    xims.push(xim);
	    xim = xims.shift();
	    JS9.Sync.sync.call(xim, xops, xims, opts);
	}
	delete JS9.Sync.reciprocating;
    }
    // use wcs for syncing
    if( JS9.notNull(opts.syncwcs) ){
	this.params.syncwcs = opts.syncwcs;
    } else {
	this.params.syncwcs = JS9.globalOpts.syncWCS;
    }
    // sync target image, if necessary
    if( !JS9.Sync.reciprocating ){
	// sync the target images
	JS9.Sync.xeqSync.call(this, arr);
	// flag we are ready to sync on user events
	JS9.Sync.ready = true;
    }
};

// unsync one or more images
// called in the image context
JS9.Sync.unsync = function(ops, ims, opts){
    let i, op, tims, xops, xims, xlen, xim;
    // sanity check
    if( !this.syncs ){
	return;
    }
    // opts is optional
    opts = opts || {reciprocate: JS9.globalOpts.syncReciprocate};
    // get regularized args
    xops = JS9.Sync.getOps.call(this, ops);
    xims = JS9.Sync.getIms.call(this, ims);
    xlen = xims.length;
    // reverse current image and target images?
    if( opts.reverse ){
	delete opts.reverse;
	for(i=0; i<xlen; i++){
	    JS9.Sync.unsync.call(xims[i], xops, [this]);
	}
	return;
    }
    // for each op in this image ...
    for( op in this.syncs ){
	if( this.syncs.hasOwnProperty(op) ){
	    // skip this op if its not in the specified op list
	    if( xops && $.inArray(op, xops) < 0 ){
		continue;
	    }
	    // if no target images specified, delete the whole thing
	    if( !xims ){
		delete this.syncs[op];
	    } else {
		// get target image array for this image
		tims = this.syncs[op];
		// for each target image ...
		for(i=tims.length-1; i>=0; i--){
		    // remove if it was specified for removal
		    if( $.inArray(tims[i], xims) >= 0 ){
			tims.splice(i, 1);
		    }
		}
		// remove empty target image array
		if( !tims.length ){
		    delete this.syncs[op];
		
		}
	    }
	}
    }
    // remove empty sink object from image
    if( !Object.keys(this.syncs).length ){
	delete this.syncs;
    }
    // reciprocal sync'ing between all images?
    if( opts.reciprocate ){
	JS9.Sync.reciprocating = true;
	opts.reciprocate = false;
	for(i=0, xim=this; i<xlen; i++){
	    xims.push(xim);
	    xim = xims.shift();
	    JS9.Sync.unsync.call(xim, xops, xims, opts);
	}
	delete JS9.Sync.reciprocating;
    }
};

// perform a sync action on target images using params from originating image
// called in image context
JS9.Sync.xeqSync = function(arr){
    let i, j, k, obj, pos, wcscen, xim, xarr, xobj, xdata, key;
    let mydata, myobj, myid, rarr, rstr, args, nflip;
    let displays = {};
    const oval = JS9.globalOpts.xeqPlugins;
    const thisid = `${this.id}_${this.display.id}`;
    const regmatch = (r1, r2) => {
	// check for a target region with the same syncid as the current region
	if( !r1.data || !r1.data.syncid ){ return false; }
	if( !r2.data || !r2.data.syncid ){ return false; }
	return r1.data.syncid === r2.data.syncid;
    };
    const calcFlip = (flip) => {
	let i, arr;
	let nx = 0;
	let ny = 0;
	let nflip = "";
	arr = flip.split("");
	for(i=0; i<arr.length; i++){
	    switch(arr[i]){
	    case "x":
		nx++;
		break;
	    case "y":
		ny++;
		break;
	    }
	}
	if( nx % 2 === 1 ){ nflip += "x"; }
	if( ny % 2 === 1 ){ nflip += "y"; }
	return nflip || "";
    }
    // don't recurse!
    if( this.tmp.syncRunning ){ return; }
    this.tmp.syncRunning = true;
    // sync all target images with this operation (but swallow errors)
    try{
	for(i=0; i<arr.length; i++){
	    obj = arr[i];
	    xim = obj.xim;
	    // don't recurse on target image
	    if( xim.syncs ){
		if( xim.tmp.syncRunning ){ continue; }
		xim.tmp.syncRunning = true;
		// if image is not displayed, we'll need to redisplay original
		if( xim !== xim.display.image ){
		    if( !displays[xim.display.id] ){
			displays[xim.display.id] = xim.display.image;
		    }
		}
	    }
	    try{
		switch(obj.xop){
		case "colormap":
		    xim.setColormap(this.params.colormap);
		    break;
		case "contrastbias":
		    xim.setColormap(this.params.contrast, this.params.bias);
		    break;
		case "flip":
		    if( this.params.flip != xim.params.flip ){
			nflip = calcFlip(this.params.flip + xim.params.flip);
			xim.setFlip(nflip);
		    }
		    break;
		case "pan":
		    pos = this.getPan();
		    if( this.params.syncwcs && this.raw.wcs > 0 ){
			wcscen = JS9.pix2wcs(this.raw.wcs, pos.ox, pos.oy);
			xim.setPan({wcs: wcscen});
		    } else {
			xim.setPan(pos.ox, pos.oy);
		    }
		    break;
		case "regions":
		    // reset args
		    args = [];
		    xarr = null;
		    if( obj.xarg ){
			// region object of the current region
			args.push(obj.xarg);
		    } else {
			// Try to sync all regions in the current image to
			// regions in the target. We will add regions which do
			// not exist in the target, and update those which do.
			if( !rarr ){
			    // get current regions, if necessary
			    rarr = this.getShapes("regions");
			}
			// get regions in the target
			xarr = xim.getShapes("regions");
			// sync all current regions to the target,
			// either adding or updating
			for(j=0; j<rarr.length; j++){
			    // assume we will create a new region
			    rarr[j].mode = "add";
			    // look through the target regions
			    for(k=0; k<xarr.length; k++){
				// if target matches the current region ...
				if( regmatch(xarr[k], rarr[j]) ){
				    // update it as an existing region
				    rarr[j].mode = "update";
				    break;
				}
			    }
			    // we'll either add or update this region
			    args.push(rarr[j]);
			}
		    }
		    // process all regions ...
		    for(j=0; j<args.length; j++){
			// get a copy of the regions object so we can change it
			myobj = $.extend(true, {}, args[j]);
			// get a sync id
			if( myobj.data && myobj.data.syncid ){
			    // reuse its syncid, if possible
			    myid = myobj.data.syncid;
			} else {
			    // otherwise, make up our own syncid
			    myid = `${thisid}_${myobj.id}`;
			}
			// process the action for this region ...
			switch(myobj.mode){
			case "add":
			    // data object with syncid
			    mydata = {doexport: false, syncid: myid};
			    // add the syncid to the new region in this display
			    JS9.globalOpts.xeqPlugins = false;
			    this.changeShapes("regions",
					      myobj.id, {data: mydata});
			    JS9.globalOpts.xeqPlugins = oval;
			    // get the region object for this region
			    rstr = this.listRegions(myobj.id, {mode: 1});
			    // use it to add this region to the target
			    xim.addShapes("regions", rstr, {data: mydata});
			    break;
			case "remove":
			    // get all regions in the target
			    if( !xarr ){
				xarr = xim.getShapes("regions");
			    }
			    for(k=0; k<xarr.length; k++){
				xobj = xarr[k];
				xdata = xobj.data;
				// skip unsync'ed regions
				if( !xdata || !xdata.syncid ){ continue; }
				// if this region is sync'ed remove it
				if( xdata.syncid === myid ){
				    // remove region from the target
				    xim.removeShapes("regions", xarr[k].id);
				}
			    }
			    break;
			case "move":
			case "update":
			    // account for difference in image scales, angles
			    // no scale factor
			    delete myobj.sizeScale;
			    if( this.raw.wcsinfo && xim.raw.wcsinfo ){
				// scale factor
				if( xim.raw.wcsinfo.cdelt1 ){
				    myobj.sizeScale =
					this.raw.wcsinfo.cdelt1 / xim.raw.wcsinfo.cdelt1;
				}
				// angle for shapes accepting angles
				if( xim.raw.wcsinfo.crot ){
				    if( myobj.shape === "box"     ||
					myobj.shape === "ellipse" ||
					(myobj.shape === "text"   &&
					 !myobj.parent)           ){
					myobj.angle += xim.raw.wcsinfo.crot;
				    }
				}
			    }
			    // get target regions, if necessary
			    if( !xarr ){
				xarr = xim.getShapes("regions");
			    }
			    for(k=0; k<xarr.length; k++){
				xobj = xarr[k];
				xdata = xobj.data;
				if( !xdata || !xdata.syncid ){ continue; }
				if( xdata.syncid === myid ){
				    // apply changes to target region
				    xim.changeShapes("regions",
						     xarr[k].id, myobj);
				}
			    }
			    break;
			}
		    }
		    break;
		case "rot90":
		    if( this.params.rot90 != xim.params.rot90 ){
			switch( this.params.rot90 - xim.params.rot90 ){
			case   90:
			case -270:
			    xim.setRot90(90);
			    break;
			case  -90:
			case  270:
			    xim.setRot90(-90);
			    break;
			default:
			    break;
			}
		    }
		    break;
		case "scale":
		    xim.setScale(this.params.scale);
		    break;
		case "wcssys":
		    xim.setWCSSys(this.params.wcssys);
		    break;
		case "wcsunits":
		    xim.setWCSUnits(this.params.wcsunits);
		    break;
		case "zoom":
		    xim.setZoom(this.params.zoom);
		    break;
		}
	    }
	    catch(e){ /* empty */ }
	    finally{
		// done sync'ing
		delete xim.tmp.syncRunning;
	    }
	}
	// revert to display of orginal image where necessary
	for( key in displays ){
	    if( displays.hasOwnProperty(key) ){
		displays[key].displayImage();
	    }
	}
    }
    catch(e){ /* empty */ }
    finally{ delete this.tmp.syncRunning; }
};

// sync images, if necessary
// inner routine called by JS9.xeqPlugins callbacks
// called in image context
JS9.Sync.maybeSync = function(op, arg){
    let i, ims;
    const arr = [];
    // sanity check
    if( !JS9.Sync.ready || !this.syncs || this.tmp.syncRunning ){
	return;
    }
    // do we need to sync images for this operation?
    if( this.syncs && this.syncs.active &&
	$.isArray(this.syncs[op]) && this.syncs[op].length ){
	// setup sync of all target images
	ims = this.syncs[op];
	for(i=0; i<ims.length; i++){
	    arr.push({xim: ims[i], xop: op, xarg: arg});
	}
	// sync target images
	JS9.Sync.xeqSync.call(this, arr);
    }
};

// callbacks which can be synchronized:
// onsetcolormap
JS9.Sync.setcolormap = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "colormap");
};

// onchangecontrastbias
JS9.Sync.changecontrastbias = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "contrastbias");
};

// onsetflip
JS9.Sync.setflip = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "flip");
};

// onsetpan
JS9.Sync.setpan = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "pan");
};

// onsetrot90
JS9.Sync.setrot90 = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "rot90");
};

// onregionschange
JS9.Sync.regionschange = function(im, xreg){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "regions", xreg);
};

// onsetscale
JS9.Sync.setscale = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "scale");
};

// onsetwssys
JS9.Sync.setwcssys = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "wcssys");
};

// onsetwcsunits
JS9.Sync.setwcsunits = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "wcsunits");
};

// onsetzoom
JS9.Sync.setzoom = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, "zoom");
};

// callback when an image is loaded
JS9.Sync.imageload = function(im){
    if( !im ){ return; }
    JS9.Sync.init.call(this);
};

// callback when an image is displayed
JS9.Sync.imagedisplay = function(im){
    if( im && im !== this.lastim ){
	JS9.Sync.init.call(this);
    }
};

// clean up an image when its closed
JS9.Sync.imageclose = function(im){
    let i;
    if( !im ){ return; }
    // remove this image from all other image sync lists
    for(i=0; i<JS9.images.length; i++){
	JS9.Sync.unsync.call(JS9.images[i], null, [im]);
    }
    JS9.Sync.init.call(this);
};

// add to image prototype and create public API
JS9.Image.prototype.syncImages = JS9.Sync.sync;
JS9.mkPublic("SyncImages", "syncImages");
JS9.Image.prototype.unsyncImages = JS9.Sync.unsync;
JS9.mkPublic("UnsyncImages", "unsyncImages");

// register the plugin
JS9.RegisterPlugin(JS9.Sync.CLASS, JS9.Sync.NAME, JS9.Sync.init,
		   {menuItem:        "Sync Images",
		    onsetcolormap:   JS9.Sync.setcolormap,
		    onsetflip:       JS9.Sync.setflip,
		    onsetpan:        JS9.Sync.setpan,
		    onregionschange: JS9.Sync.regionschange,
		    onsetrot90:      JS9.Sync.setrot90,
		    onsetscale:      JS9.Sync.setscale,
		    onsetwcssys:     JS9.Sync.setwcssys,
		    onsetwcsunits:   JS9.Sync.setwcsunits,
		    onsetzoom:       JS9.Sync.setzoom,
		    onchangecontrastbias: JS9.Sync.changecontrastbias,
		    onimagedisplay:  JS9.Sync.imagedisplay,
		    onimageload:     JS9.Sync.mageload,
		    onimageclose:    JS9.Sync.imageclose,
		    help:            "help/sync.html",
		    winTitle:        "Sync Images",
		    winDims: [JS9.Sync.WIDTH, JS9.Sync.HEIGHT]});
