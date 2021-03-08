/*
 * shape layer plugin (October 7, 2016)
 */

/*global $, JS9, sprintf */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Layers = {};
JS9.Layers.CLASS = "JS9";	// class of plugins (1st part of div class)
JS9.Layers.NAME = "Layers";     // name of this plugin (2nd part of div class)
JS9.Layers.WIDTH =  460;	// width of light window
JS9.Layers.HEIGHT = 250;	// height of light window
JS9.Layers.BASE = JS9.Layers.CLASS + JS9.Layers.NAME;  // CSS base class name

JS9.Layers.headerHTML='Shape layers can be hidden or made visible below. The topmost visible layer in the stack is <b>active</b>: it responds to mouse and touch events. Move a layer to the top of the stack to make it active.';

JS9.Layers.layerHTML="<span style='float: left'>$visible&nbsp;&nbsp;$save&nbsp;&nbsp;</span>&nbsp;&nbsp; <span class='JS9LayersSpan'>$layer&nbsp;&nbsp</span>";

JS9.Layers.nolayersHTML='<p><span class="JS9NoLayers">[Layers will appear here as they are created]</span>';

JS9.Layers.visibleHTML='<input class="JS9LayersVisibleCheck" type="checkbox" id="visible" name="visible" value="visible" onclick="javascript:JS9.Layers.xvisible(\'%s\', \'%s\', \'%s\', this)">visible';

JS9.Layers.saveBothHTML='<select class="JS9Select JS9LayersSaveBothSelect" onfocus="this.selectedIndex=0;" onchange="JS9.Layers.xsave(\'%s\', \'%s\', \'%s\', this)"><option selected disabled>save as ...</option><option value="catalog">catalog</option><option value="regions">regions</option><option value="svg">svg</option></select>';

JS9.Layers.saveRegionsHTML='<select class="JS9LayersSaveSelect" onfocus="this.selectedIndex=0;" onchange="JS9.Layers.xsave(\'%s\', \'%s\', \'%s\', this)"><option selected disabled>save as ...</option><option value="regions">regions</option><option value="svg">svg</option></select>';

JS9.Layers.layerNameHTML='<b>%s</b>';

// get an id based on the file image id and layer
JS9.Layers.imid = function(im, layer){
    const id = `${im.display.id}_${im.id}_${layer}_`;
    return `${id.replace(/[^A-Za-z0-9_]/g, "_")}Layer`;
};

// get a class unique between displays
JS9.Layers.dispclass = function(im){
    const id = `${JS9.Layers.BASE}_${im.display.id}`;
    return id.replace(/[^A-Za-z0-9_]/g, "_");
};

// change the active image
JS9.Layers.activeLayer = function(im, pinst){
    let i, s, id, dcls, order;
    if( im ){
	order = pinst.layersLayerContainer.sortable("toArray");
	if( (order.length === 1) && !order[0] ){
	    return;
	}
	for(i=0; i<order.length; i++){
	    order[i] = $(`#${order[i]}`).attr("layer");
	}
	s = im.activeShapeLayer(order);
	id = JS9.Layers.imid(im, s);
	dcls = `${JS9.Layers.dispclass(im)}_Layer`;
	$(`.${dcls}`)
	    .removeClass(`${JS9.Layers.BASE}LayerActive`)
	    .addClass(`${JS9.Layers.BASE}LayerInactive`);
	$(`#${id}`)
	    .removeClass(`${JS9.Layers.BASE}LayerInactive`)
	    .addClass(`${JS9.Layers.BASE}LayerActive`);
    }
};

// make shape layer visible/invisible
JS9.Layers.xvisible = function(did, id, layer, target){
    let pinst, mode;
    const im = JS9.lookupImage(id, did);
    if( im ){
	if( target.checked ){
	    mode = true;
	} else {
	    mode = false;
	}
	// change visibility
	im.showShapeLayer(layer, mode);
	// might have changed the active layer
	pinst = im.display.pluginInstances[JS9.Layers.BASE];
	// set active layer
	JS9.Layers.activeLayer(im, pinst, true);
    }
};

// save layer (catalog or regions)
// eslint-disable-next-line no-unused-vars
JS9.Layers.xsave = function(did, id, layer, target){
    const im = JS9.lookupImage(id, did);
    const save = target.options[target.selectedIndex].value;
    if( im ){
	if( save === "catalog" ){
	    im.saveCatalog(null, layer);
	} else if( save === "regions" ){
	    im.saveRegions(null, null, layer);
	} else if( save === "svg" ){
	    im.saveRegions(null, null, {layer: layer, type: "svg"});
	}
    }
};

// add a layer to the list
JS9.Layers.addLayer = function(im, layer){
    let l, s, id, divjq, zindex, added, dcls, imid, dispid;
    const cls = `${JS9.Layers.BASE}Layer`;
    const opts = [];
    // sanity checks
    if( !im || !layer || !im.layers[layer] ||
	(im.layers[layer].dlayer.dtype !== "main") ){
	return;
    }
    // first time through, clear html
    if( !this. nlayer ){
	this.layersLayerContainer.html("");
    }
    // convenience variables
    imid = im.id;
    dispid = im.display.id;
    // get current z-index
    zindex = parseInt(im.display.layers[layer].divjq.css("z-index"), 10);
    // get unique id for this layer
    id = JS9.Layers.imid(im, layer);
    // get class for this layer 
    dcls = `${JS9.Layers.dispclass(im)}_Layer`;
    // value to pass to the macro expander
    opts.push({name: "imid", value: imid});
    opts.push({name: "visible", value: sprintf(JS9.Layers.visibleHTML, 
					       dispid, imid, layer)});
    if( im.layers[layer].catalog ){
	opts.push({name: "save", value: sprintf(JS9.Layers.saveBothHTML,
						dispid, imid, layer)});
    } else {
	opts.push({name: "save", value: sprintf(JS9.Layers.saveRegionsHTML,
						dispid, imid, layer)});
    }
    if( JS9.DEBUG > 1 ){
	l = `${layer} layer [zindex: ${zindex}]`;
    } else {
	l = `${layer} layer`;
    }
    opts.push({name: "layer", value: sprintf(JS9.Layers.layerNameHTML, l)});
    // create the html for this layer
    s = JS9.Image.prototype.expandMacro.call(im, JS9.Layers.layerHTML, opts);
    // add layer html to the layer container
    divjq = $("<div>")
	.addClass(cls)
	.addClass(dcls)
	.attr("id", id)
	.attr("layer", layer)
	.prop("imid", imid)
        .html(s);
    if( !this.nlayer ){
	divjq.appendTo(this.layersLayerContainer);
    } else {
	this.layersLayerContainer.find(`.${cls}`).each((idx, item) => {
		let tlayer, tzindex;
		const jqitem = $(item);
		if( !added ){
		    tlayer = jqitem.attr("layer");
		    if( tlayer ){
			tzindex = parseInt(im.display.layers[tlayer].divjq
					   .css("z-index"), 10);
			if( Math.abs(zindex) > Math.abs(tzindex) ){
			    divjq.insertBefore(jqitem);
			    added = true;
			}
		    }
		}
	    });
	    if( !added ){
		divjq.appendTo(this.layersLayerContainer);
	    }
    }
    // set of unset visibility buton
    divjq.find(".JS9LayersVisibleCheck").prop("checked", !!im.layers[layer].show);
    // another layer was added
    this.nlayer++;
};

// init when a different image is displayed
JS9.Layers.display = function(){
    if( this.lastimage !== this.display.image ){
	JS9.Layers.init.call(this);
    }
};

// clear when an image closes
JS9.Layers.close = function(){
    // ensure plugin display is reset
    JS9.Layers.init.call(this, {mode: "clear"});
};

// constructor: add HTML elements to the plugin
JS9.Layers.init = function(opts){
    let key, im;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // opts is optional
    opts = opts || {};
    // create container to hold layer container and header
    // clean main container
    this.divjq.html("");
    // no layers yet
    this.nlayer = 0;
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.layersContainer = $("<div>")
	.addClass(`${JS9.Layers.BASE}Container`)
	.attr("id", `${this.id}LayersContainer`)
        .css("overflow", "auto")
	.appendTo(this.divjq);
    // header
    this.layersHeader = $("<div>")
	.addClass(`${JS9.Layers.BASE}Header`)
	.attr("id", `${this.display.id}Header`)
	.html(JS9.Layers.headerHTML)
	.appendTo(this.layersContainer);
    // container to hold layers
    this.layersLayerContainer = $("<div>")
	.addClass(`${JS9.Layers.BASE}LayerContainer`)
	.attr("id", `${this.id}LayersLayerContainer`)
        .html(JS9.Layers.nolayersHTML)
	.appendTo(this.layersContainer);
    // done if we are only clearing
    if( opts.mode === "clear" ){
	return;
    }
    // add current shape layers
    if( this.display.image ){
	im = this.display.image;
	for( key in im.layers ){
	    if( key === "crosshair" ){
		continue;
	    }
	    if( Object.prototype.hasOwnProperty.call(im.layers, key) ){
		JS9.Layers.addLayer.call(this, im, key);
	    }
	}
	this.lastimage = im;
    }
    // the layers within the layer container will be sortable
    // the top one responds to events
    this.layersLayerContainer.sortable({
	// eslint-disable-next-line no-unused-vars
	start: (event, ui) => {
	    return;
	},
	// eslint-disable-next-line no-unused-vars
	stop: (event, ui) => {
	    JS9.Layers.activeLayer(im, this);
	    return;
	}
    });
    // set initial active layer
    JS9.Layers.activeLayer(im, this);
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.Layers.CLASS, JS9.Layers.NAME, JS9.Layers.init,
		   {menuItem: "Shape Layers",
		    onplugindisplay: JS9.Layers.init,
		    onshapelayercreate: JS9.Layers.init,
		    onshapelayershow: JS9.Layers.init,
		    onshapelayeractive: JS9.Layers.init,
		    onshapelayerhide: JS9.Layers.init,
		    onimageload: JS9.Layers.init,
		    onimagedisplay: JS9.Layers.display,
		    onimageclose: JS9.Layers.close,
		    help: "help/layers.html",
		    winTitle: "Shape Layers",
		    winResize: true,
		    winDims: [JS9.Layers.WIDTH, JS9.Layers.HEIGHT]});
