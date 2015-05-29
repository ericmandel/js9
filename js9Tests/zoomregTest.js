exports.dotest = function(js9Test, opts){
    var image = js9Test.image || "CAS-A FITS";
    js9Test.clickImageURL(image, opts, function(){
	var d = "regions are the same after zoom";
	var r;
	js9Test.clickMenuItem("wcs", "pixels");
	js9Test.clickMenuItem("region", "circle");
	js9Test.clickMenuItem("region", "box");
	js9Test.clickMenuItem("region", "ellipse");
	js9Test.clickMenuItem("region", "polygon");
	js9Test.delay(500, function(){
	    r = js9Test.sendMsg("regions");
	});
	js9Test.clickMenuItem("zoom", "zoom 2");
	js9Test.delay(500, function(){
	    a = js9Test.sendMsg("regions");
	    if( r === a ){
		js9Test.results("success", opts.script, d);
	    } else {
		js9Test.results("FAILURE", opts.script, d, r, a);
	    }
	});
    });
}
