/*
 * image sync plugin (September 2, 2018)
 * whenever an operation is performed on this image, sync the target images
 */

/*global JS9, $ */

"use strict";

JS9.Sync = {};
JS9.Sync.CLASS = "JS9";     // class of plugins (1st part of div class)
JS9.Sync.NAME = "Sync";     // name of this plugin (2nd part of div class)

// process ops input to [un]sync
// called in image context
JS9.Sync.getOps = function(ops){
    let i, j, op;
    const xops = [];
    //  default from above ...
    ops = ops || JS9.globalOpts.syncOps;
    if( !$.isArray(ops) ){
	try{ ops = JSON.parse(ops); }
	catch(e){ ops = [ops]; }
    }
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
    if( !$.isArray(ims) ){
	try{ ims = JSON.parse(ims); }
	catch(e){ ims = [ims]; }
    }
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
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse sync opts: ${opts}`, e); }
    }
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
	this.tmp.syncwcs = opts.syncwcs;
    } else {
	this.tmp.syncwcs = JS9.globalOpts.syncWCS;
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
    for( op of Object.keys(this.syncs) ){
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
    let i, j, k, obj, pos, wcscen, xim, xarr, xobj, xdata, key, diff;
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
	// do regions first to avoid problems with changes to the current image
	for(i=0; i<arr.length; i++){
	    obj = arr[i];
	    if( obj.xop === "regions" ){
		arr.splice(i, 1);
		arr.unshift(obj);
	    }
	}
	// process all operations
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
		case "alignment":
		    xim.alignPanZoom(this);
		    break;
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
		    if( this.tmp.syncwcs && this.validWCS() ){
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
			    rarr = this.getShapes("regions", "all");
			}
			// get regions in the target
			xarr = xim.getShapes("regions", "all");
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
				xarr = xim.getShapes("regions", "all");
			    }
			    for(k=0; k<xarr.length; k++){
				xobj = xarr[k];
				xdata = xobj.data;
				// skip unsync'ed regions
				if( !xdata || !xdata.syncid ){ continue; }
				// if this region is sync'ed remove it
				if( xdata.syncid === myid ){
				    // remove region from the target
				    xim.removeShapes("regions", myid);
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
				xarr = xim.getShapes("regions", "all");
			    }
			    for(k=0; k<xarr.length; k++){
				xobj = xarr[k];
				xdata = xobj.data;
				if( !xdata || !xdata.syncid ){ continue; }
				if( xdata.syncid === myid ){
				    // apply changes to target region
				    xim.changeShapes("regions", myid, myobj);
				}
			    }
			    break;
			}
		    }
		    break;
		case "rot90":
		    if( this.params.rot90 != xim.params.rot90 ){
			diff = (this.params.rot90 - xim.params.rot90) || 0;
			switch(diff){
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
		case "rotate":
		    if( this.params.rotate != xim.params.rotate ){
			diff = (this.params.rotate - xim.params.rotate) || 0;
			xim.setRotate(diff);
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
	for( key of Object.keys(displays) ){
	    displays[key].displayImage();
	}
    }
    catch(e){ /* empty */ }
    finally{
	this.displayImage();
	delete this.tmp.syncRunning;
    }
};

// sync images, if necessary
// inner routine called by JS9.xeqPlugins callbacks
// called in image context
JS9.Sync.maybeSync = function(ops, arg){
    let i, j, ims, op, arr;
    // sanity check
    if( !JS9.Sync.ready || !this.syncs || this.tmp.syncRunning ){
	return;
    }
    if( !$.isArray(ops) ){
	ops = [ops];
    }
    // do we need to sync images for this operation?
    if( this.syncs.active ){
	for(j=0; j<ops.length; j++){
	    op = ops[j];
	    if( $.isArray(this.syncs[op]) && this.syncs[op].length ){
		// setup sync of all target images
		ims = this.syncs[op];
		arr = [];
		for(i=0; i<ims.length; i++){
		    arr.push({xim: ims[i], xop: op, xarg: arg});
		}
		// sync target images
		JS9.Sync.xeqSync.call(this, arr);
	    }
	}
    }
};

// called when plugin is intialized on a display
JS9.Sync.init = function(){
    return this;
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
    JS9.Sync.maybeSync.call(im, ["flip","alignment"]);
};

// onsetpan
JS9.Sync.setpan = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, ["pan","alignment"]);
};

// onsetrot90
JS9.Sync.setrot90 = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, ["rot90","alignment"]);
};

// onsetrotate
JS9.Sync.setrotate = function(im){
    if( !im ){ return; }
    JS9.Sync.maybeSync.call(im, ["rotate","alignment"]);
};

// onregionschange
JS9.Sync.regionschange = function(im, xreg){
    if( !im ){ return; }
    switch(xreg.mode){
    case "select":
    case "unselect":
	break;
    default:
	JS9.Sync.maybeSync.call(im, "regions", xreg);
	break;
    }
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
    JS9.Sync.maybeSync.call(im, ["zoom","alignment"]);
};

// re-init other syncUI interfaces when an image is loaded here
JS9.Sync.loadimage = function(im){
    let i, pinst;
    if( !im ){ return; }
    for(i=0; i<JS9.displays.length; i++){
	pinst = JS9.displays[i].pluginInstances.JS9SyncUI;
	if( pinst && pinst.isActive() ){
	    JS9.SyncUI.init.call(pinst);
	}
    }
};

// clean up an image when its closed
// re-init other syncUI interfaces when an image is closed here
JS9.Sync.closeimage = function(im){
    let i, pinst;
    if( !im ){ return; }
    // remove this image from all other image sync lists
    for(i=0; i<JS9.images.length; i++){
	JS9.Sync.unsync.call(JS9.images[i], null, [im]);
    }
    for(i=0; i<JS9.displays.length; i++){
	pinst = JS9.displays[i].pluginInstances.JS9SyncUI;
	if( pinst && pinst.isActive() ){
	    JS9.SyncUI.init.call(pinst);
	}
    }
};

// add to image prototype and create public API
JS9.Image.prototype.syncImages = JS9.Sync.sync;
JS9.mkPublic("SyncImages", "syncImages");
JS9.Image.prototype.unsyncImages = JS9.Sync.unsync;
JS9.mkPublic("UnsyncImages", "unsyncImages");

// register the plugin
JS9.RegisterPlugin(JS9.Sync.CLASS, JS9.Sync.NAME, JS9.Sync.init,
		   {onsetcolormap:   JS9.Sync.setcolormap,
		    onsetflip:       JS9.Sync.setflip,
		    onsetpan:        JS9.Sync.setpan,
		    onregionschange: JS9.Sync.regionschange,
		    onsetrot90:      JS9.Sync.setrot90,
		    onsetrotate:     JS9.Sync.setrotate,
		    onsetscale:      JS9.Sync.setscale,
		    onsetwcssys:     JS9.Sync.setwcssys,
		    onsetwcsunits:   JS9.Sync.setwcsunits,
		    onsetzoom:       JS9.Sync.setzoom,
		    onchangecontrastbias: JS9.Sync.changecontrastbias,
		    onimageload:     JS9.Sync.loadimage,
		    onimageclose:    JS9.Sync.closeimage,
		    winDims: [0, 0]});
