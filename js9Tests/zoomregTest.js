exports.dotest = function(js9Test){
    var image = js9Test.image || "CAS-A FITS";
    js9Test.doImageURL(image, null, function(){
	var d = "regions are the same after zoom";
	var r;
	js9Test.doMenuItem("wcs", "pixels");
	js9Test.doMenuItem("region", "circle");
	js9Test.doMenuItem("region", "box");
	js9Test.doMenuItem("region", "ellipse");
	js9Test.doMenuItem("region", "polygon");
	js9Test.doMsg("regions", null, function(msg, opts, s){
	    r = s;
	});
	js9Test.doMenuItem("zoom", "zoom 2");
	js9Test.doMsg("regions", null, function(msg, opts, s){
	    if( r === s ){
		js9Test.results("success", d);
	    } else {
		js9Test.results("FAILURE", d, r, s);
	    }
	});
	js9Test.doMenuItem("file", "close image");
    });
}
