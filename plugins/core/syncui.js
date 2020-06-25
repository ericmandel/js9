/*
 * image sync ui plugin (September 2, 2018)
 * user interface for virtual sync plugin
 */

/*global JS9, $, sprintf */

"use strict";

JS9.SyncUI = {};
JS9.SyncUI.CLASS = "JS9";     // class of plugins (1st part of div class)
JS9.SyncUI.NAME = "SyncUI";   // name of this plugin (2nd part of div class)
JS9.SyncUI.WIDTH =  512;      // width of light window
JS9.SyncUI.HEIGHT = 430;      // height of light window
JS9.SyncUI.BASE = JS9.SyncUI.CLASS + JS9.SyncUI.NAME;  // CSS base class name

JS9.SyncUI.HEADER = "<div class='JS9SyncUIText'><br><b>%s:</b></div>";
JS9.SyncUI.NCOL = 3;	     // number of columns in the ops display
JS9.SyncUI.COLWIDTH = 175;   // width of each ops column

JS9.SyncUI.headerHTML="Synchronize two or more images, so that when an operation is performed on one image, it also is performed on the other(s). Or sync once only.";

JS9.SyncUI.opHTML="$opactive&nbsp;&nbsp;$opname";

JS9.SyncUI.opactiveHTML='<input class="JS9SyncUIOpCheck" type="checkbox" name="%s" value="active"">';

JS9.SyncUI.opnameHTML='<b>%s</b>';

JS9.SyncUI.imageHTML="$imactive&nbsp;&nbsp;$imfile";

JS9.SyncUI.imactiveHTML='<input class="JS9SyncUIImCheck" type="checkbox" name="%s" value="active">';

JS9.SyncUI.imfileHTML='<b>%s</b>';

JS9.SyncUI.nofileHTML='<p><span class="JS9SyncUINoFile">[Images will appear here as they are loaded]</span>';

JS9.SyncUI.optsHTML='<div class="JS9SyncUIOptsRow">$reciprocate&nbsp;&nbsp;$syncwcs</div>';

JS9.SyncUI.reciprocalHTML='<span class="JS9SyncUIOpts" style="position:absolute; left:%spx; top:0px"><input class="JS9SyncUIOptsCheck" type="checkbox" name="%s" value="active" onchange="javascript:JS9.SyncUI.xrecip(\'%s\', this)">&nbsp;&nbsp;<b>%s</b></span>';

JS9.SyncUI.syncwcsHTML='<span class="JS9SyncUIOpts" style="position:absolute; left:%spx; top:0px"><input class="JS9SyncUIOptsCheck" type="checkbox" name="%s" value="active" onchange="javascript:JS9.SyncUI.xsyncwcs(\'%s\', this)">&nbsp;&nbsp;<b>%s</b></span>';

JS9.SyncUI.footerHTML='<div class="JS9SyncUIButtons" <p><span style="float:right;">$cancel&nbsp;&nbsp;$sync&nbsp;&nbsp;&nbsp;&nbsp;$once&nbsp;&nbsp;&nbsp;&nbsp;$unsync</span></div>';

JS9.SyncUI.cancelHTML='<span class="JS9SyncUIButton"><input type="button" class="JS9Button2 JS9SyncUIButton" id="active" name="sync" value="Cancel" onclick="javascript:JS9.SyncUI.xcancel(\'%s\', this)" %s></span>';

JS9.SyncUI.syncHTML='<span class="JS9SyncUIButton"><input type="button" class="JS9RunButton JS9SyncUIButton" id="active" name="sync" value="Sync Repeatedly" onclick="javascript:JS9.SyncUI.xsync(\'%s\', this)"></span>';

JS9.SyncUI.onceHTML='<span class="JS9SyncUIButton"><input type="button" class="JS9RunButton JS9SyncUIButton" id="active" name="once" value="Sync Once" onclick="javascript:JS9.SyncUI.xonce(\'%s\', this)"></span>';

JS9.SyncUI.unsyncHTML='<span class="JS9SyncUIButton"><input type="button" class="JS9RunButton JS9SyncUIButton" id="active" name="unsync" value="Unsync" onclick="javascript:JS9.SyncUI.xunsync(\'%s\', this)"></span>';


JS9.SyncUI.getImsOpsOpts = function(el){
    const container = el.closest(".JS9SyncUIContainer");
    const ops = [];
    const ims = [];
    const opts = {};
    if( container.length ){
	// gather all selected images
	container.find(".JS9SyncUIImCheck").each((index, element) => {
	    let name = $(element).prop("name");
	    let checked = $(element).prop("checked");
	    if( checked ){
		ims.push(name);
	    }
	});
	// gather all selected ops
	container.find(".JS9SyncUIOpCheck").each((index, element) => {
	    let name = $(element).prop("name");
	    let checked = $(element).prop("checked");
	    if( checked ){
		ops.push(name);
	    }
	});
	// get opts
	container.find(".JS9SyncUIOptsCheck").each((index, element) => {
	    let name = $(element).prop("name");
	    let checked = $(element).prop("checked");
	    opts[name] = checked;
	});
    }
    return {ims, ops, opts};
};

// cancel
// eslint-disable-next-line no-unused-vars
JS9.SyncUI.xcancel = function(did, target){
    let plugin;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(did));
    if( display ){
	plugin = display.pluginInstances.JS9SyncUI;
	if( plugin && plugin.winHandle ){
	    plugin.winHandle.close();
	}
    }
};

// sync
JS9.SyncUI.xsync = function(did, target){
    let im;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(did));
    if( display.image ){
	im = display.image;
	// get ims and opts
	const {ims, ops, opts} = JS9.SyncUI.getImsOpsOpts($(target));
	// sync images, if necessary
	if( ims.length && ops.length ){
	    im.syncImages(ops, ims, opts);
	}
	JS9.SyncUI.setCheckboxes(im);
    }
};

// sync once
JS9.SyncUI.xonce = function(did, target){
    let im;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(did));
    if( display.image ){
	im = display.image;
	// get ims and opts
	const {ims, ops} = JS9.SyncUI.getImsOpsOpts($(target));
	// copy params, if necessary
	if( ims.length && ops.length ){
	    im.copyParams(ops, ims);
	    JS9.SyncUI.setCheckboxes(im);
	}
    }
};

// unsync
JS9.SyncUI.xunsync = function(did, target){
    let im;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(did));
    if( display.image ){
	im = display.image;
	// get ims and opts
	const {ims, ops, opts} = JS9.SyncUI.getImsOpsOpts($(target));
	// unsync images, if necessary
	if( ims.length && ops.length ){
	    im.unsyncImages(ops, ims, opts);
	}
	JS9.SyncUI.setCheckboxes(im);
    }
};

JS9.SyncUI.xrecip = function(did, target){
    let pinst;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(did));
    if( display ){
	pinst = display.pluginInstances.JS9SyncUI;
	pinst.syncReciprocate = $(target).is(':checked');
    }
};

JS9.SyncUI.xsyncwcs = function(did, target){
    let pinst;
    const display = JS9.getDynamicDisplayOr(JS9.lookupDisplay(did));
    if( display ){
	pinst = display.pluginInstances.JS9SyncUI;
	pinst.syncWCS = $(target).is(':checked');
    }
};

// get a SyncImage id based on the file image id
JS9.SyncUI.imid = function(im){
    const id = `${im.display.id}_${im.id}`;
    return `${id.replace(/[^A-Za-z0-9_]/g, "_")}SyncImage`;
};

// set checkbox for sync'ed options
JS9.SyncUI.setCheckboxes = function(im){
    let i, j, id, op, syncops, pinst;
    // sanity check
    if( !im ){
	return
    }
    // get current instance of this plugin
    pinst = im.display.pluginInstances.JS9SyncUI;
    // first turn all checkboxes off
    pinst.syncContainer.find(".JS9SyncUIOpCheck").prop("checked", false);
    pinst.syncContainer.find(".JS9SyncUIImCheck").prop("checked", false);
    pinst.syncContainer.find(".JS9SyncUIOptsCheck").prop("checked", false);
    // then turn on currently syn'ed options
    syncops = JS9.globalOpts.syncOps;
    // for each sync'ed op in this image ...
    if( im.syncs ){
	for(i=0; i<syncops.length; i++){
	    // get the op
	    op = syncops[i];
	    if( $.isArray(im.syncs[op]) ){
		// turn on the checkbox associated with this op
		pinst.syncContainer
		    .find(".JS9SyncUIOpCheck")
		    .filter(`[name='${op}']`)
		    .prop("checked", true);
		// for each file associated with the sync'ed op
		for(j=0; j<im.syncs[op].length; j++){
		    if( JS9.isImage(im.syncs[op][j]) ){
			// jquery doesn't like brackets in names
			id = im.syncs[op][j].id.replace(/\[.*\]/, "");
			// turn on the checkbox associated with this file
			pinst.syncContainer
			    .find(".JS9SyncUIImCheck")
			    .filter(`[name^='${id}']`)
			    .prop("checked", true);
		    }
		}
	    }
	}
    }
    // options
    pinst.syncContainer
	.find(".JS9SyncUIOptsCheck")
	.filter(`[name="reciprocate"]`)
	.prop("checked", pinst.syncReciprocate);
    pinst.syncContainer
	.find(".JS9SyncUIOptsCheck")
	.filter(`[name="syncwcs"]`)
	.prop("checked", pinst.syncWCS);
};

// add a sync op to the list of available ops
JS9.SyncUI.addOp = function(op, ncol){
    let s, left, top, opname;
    const opts = [];
    const cls = `${JS9.SyncUI.BASE}Op`;
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
    opts.push({name: "opactive", value: sprintf(JS9.SyncUI.opactiveHTML, op)});
    opts.push({name: "opname", value: sprintf(JS9.SyncUI.opnameHTML, opname)});
    // create the html for this op
    s = JS9.Image.prototype.expandMacro.call(null, JS9.SyncUI.opHTML, opts);
    this.syncOpDivs++;
    // add op to the op container at the specified column
    left = ncol * JS9.SyncUI.COLWIDTH;
    top = 0;
    return `<span class="JS9SyncUIOp" style="position:absolute; left:${left}px; top:${top}px" id="${cls}">${s}</span>`;
};

// add an image to the list of available images
JS9.SyncUI.addImage = function(im){
    let s, id, imid;
    const opts = [];
    const cls = `${JS9.SyncUI.BASE}ImageRow`;
    if( !im ){
	return;
    }
    // convenience variables
    imid = im.id;
    // unique id
    id = JS9.SyncUI.imid(im);
    // value to pass to the macro expander
    opts.push({name: "imid", value: im.id});
    opts.push({name: "imactive", value: sprintf(JS9.SyncUI.imactiveHTML, imid)});
    opts.push({name: "imfile", value: sprintf(JS9.SyncUI.imfileHTML, imid)});
    // create the html for this image
    s = im.expandMacro(JS9.SyncUI.imageHTML, opts);
    // one more div in the stack
    this.syncImageDivs++;
    // return image html to add to the image container
    return `<div class="${cls}" id="${id}">${s}</div>`;
};

// remove an image from the list of available images
JS9.SyncUI.removeImage = function(im){
    let id;
    if( im ){
	id = JS9.SyncUI.imid(im);
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
JS9.SyncUI.init = function(){
    let i, j, s, im, op, dispid, imhead, ophead, opts, nrow, idx, syncops, html;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // sanity check since we are always active
    if( !this.divjq || !this.divjq.is(":visible") ){
	return;
    }
    // clean main container
    this.divjq.html("");
    // no images/divs loaded yet
    this.syncOpDivs = 0;
    this.syncImageDivs = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // init reciprocate
    if( JS9.isNull(this.syncReciprocate) ){
	this.syncReciprocate = JS9.globalOpts.syncReciprocate;
    }
    // init syncwcs
    if( JS9.isNull(this.syncWCS) ){
	this.syncWCS = JS9.globalOpts.syncWCS;
    }
    // convenience variables
    dispid = this.display.id;
    if( this.display.image ){
	this.lastim = this.display.image;
	imhead = sprintf(JS9.SyncUI.HEADER,
			 `Images that can be synced with ${this.lastim.id}`);
    } else {
	this.lastim = null;
	imhead = sprintf(JS9.SyncUI.HEADER,
			 `Images that can be synced`);
    }
    // main container
    this.syncContainer = $("<div>")
	.addClass(`${JS9.SyncUI.BASE}Container`)
	.attr("id", `${this.id}SyncContainer`)
        .css("overflow", "auto")
	.appendTo(this.divjq);
    s = JS9.Image.prototype.expandMacro.call(null, JS9.SyncUI.headerHTML);
    // header
    this.syncHeader = $("<div>")
	.addClass(`${JS9.SyncUI.BASE}Header`)
	.attr("id", `${dispid}Header`)
	.html(s)
	.appendTo(this.syncContainer);
    // container to hold images
    this.syncImageContainer = $("<div>")
	.addClass(`${JS9.SyncUI.BASE}ImageContainer`)
	.attr("id", `${this.id}SyncImageContainer`)
	.html(imhead)
	.appendTo(this.syncContainer);
    // add images
    html = "";
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( im !== this.display.image && im.getStatus("close") !== "closing" ){
	    html += JS9.SyncUI.addImage.call(this, im);
	}
    }
    html = html || JS9.SyncUI.nofileHTML;
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
	.addClass(`${JS9.SyncUI.BASE}OpContainer`)
	.attr("id", `${this.id}SyncOpContainer`)
        .html(sprintf(JS9.SyncUI.HEADER, "Operations that can be synced"))
	.appendTo(this.syncContainer);
    syncops = JS9.globalOpts.syncOps;
    nrow = Math.floor((syncops.length + JS9.SyncUI.NCOL - 1) / JS9.SyncUI.NCOL);
    for(j=0; j<nrow; j++){
	html = `<div class="${JS9.SyncUI.BASE}OpRow" id="${this.id}SyncOpRow">`;
	for(i=0; i<JS9.SyncUI.NCOL; i++){
	    idx = i * nrow + j;
	    if( syncops[idx] ){
		op = syncops[idx];
		html += JS9.SyncUI.addOp.call(this, op, i);
	    }
	}
	html += "</div>";
	this.syncOpContainer.append(html);
    }
    // options
    // container to hold images
    ophead = sprintf(JS9.SyncUI.HEADER, `Sync options`);
    this.syncOptsContainer = $("<div>")
	.addClass(`${JS9.SyncUI.BASE}OptsContainer`)
	.attr("id", `${this.id}SyncOptsContainer`)
	.html(ophead)
	.appendTo(this.syncContainer);
    opts = [];
    opts.push({name: "reciprocate", value: sprintf(JS9.SyncUI.reciprocalHTML, JS9.SyncUI.COLWIDTH * 0, "reciprocate", dispid, "reciprocal sync")});
    opts.push({name: "syncwcs", value: sprintf(JS9.SyncUI.syncwcsHTML, JS9.SyncUI.COLWIDTH * 1, "syncwcs", dispid, "sync using wcs")});
    s = JS9.Image.prototype.expandMacro.call(null, JS9.SyncUI.optsHTML, opts);
    // footer
    this.syncOpts = $("<div>")
	.attr("id", `${dispid}Opts`)
	.html(s)
	.appendTo(this.syncOptsContainer);
    // footer containing run buttons
    opts = [];
    opts.push({name: "cancel", value: sprintf(JS9.SyncUI.cancelHTML, dispid,
	       this.winHandle ? "" : 'style="display:none;"')});
    opts.push({name: "sync", value: sprintf(JS9.SyncUI.syncHTML, dispid)});
    opts.push({name: "once", value: sprintf(JS9.SyncUI.onceHTML, dispid)});
    opts.push({name: "unsync", value: sprintf(JS9.SyncUI.unsyncHTML, dispid)});
    s = JS9.Image.prototype.expandMacro.call(null, JS9.SyncUI.footerHTML, opts);
    // footer
    this.syncFooter = $("<div>")
	.addClass(`${JS9.SyncUI.BASE}Footer`)
	.attr("id", `${dispid}Footer`)
	.html(s)
	.appendTo(this.syncContainer);
    // initialize sync values for this image
    if( this.display.image ){
	JS9.SyncUI.setCheckboxes(this.display.image);
    }
};

// callback when plugin is redisplayed
// eslint-disable-next-line no-unused-vars
JS9.SyncUI.reinit = function(im){
    JS9.SyncUI.init.call(this);
};

// callback when an image is loaded
JS9.SyncUI.imageload = function(im){
    if( !im ){ return; }
    JS9.SyncUI.init.call(this);
};

// callback when an image is displayed
JS9.SyncUI.imagedisplay = function(im){
    if( im && im !== this.lastim ){
	JS9.SyncUI.init.call(this);
    }
};

// clean up an image when its closed
JS9.SyncUI.imageclose = function(im){
    let i;
    if( !im ){ return; }
    // remove this image from all other image sync lists
    for(i=0; i<JS9.images.length; i++){
	JS9.SyncUI.unsync.call(JS9.images[i], null, [im]);
    }
    JS9.SyncUI.init.call(this);
};

// register the plugin
JS9.RegisterPlugin(JS9.SyncUI.CLASS, JS9.SyncUI.NAME, JS9.SyncUI.init,
		   {menuItem:        "Sync Images",
		    onplugindisplay: JS9.SyncUI.reinit,
		    onimagedisplay:  JS9.SyncUI.imagedisplay,
		    onimageload:     JS9.SyncUI.imageload,
		    onimageclose:    JS9.SyncUI.imageclose,
		    help:            "help/syncui.html",
		    winTitle:        "Sync Images",
		    winDims: [JS9.SyncUI.WIDTH, JS9.SyncUI.HEIGHT]});
