exports.dotest = function(js9Test, opts){
    var image = js9Test.image || "CTB 109 FITS";
    js9Test.clickImageURL(image, opts, function(){
	var d = "bin2/zoom2 region is the same as original region";
	js9Test.clickMenuItem("wcs", "pixels");
	js9Test.clickMenuItem("region", "circle");
	js9Test.clickMenuItem("view", "Binning");
	js9Test.clickXPath("//input[@name='bin']", {text: "2"});
	js9Test.clickXPath("//input[@name='rebin']");
	js9Test.waitImage(opts, function(){
	    js9Test.clickXPath("//input[@name='close']");
	    js9Test.clickMenuItem("zoom", "zoom 2");
	    js9Test.clickMenuItem("region", "circle");
	    js9Test.delay(500, function(){
		a = js9Test.sendMsg("regions");
		arr = a.split(";");
		if( arr[1] && arr[2] ){
		    r1 = arr[1].trim();
		    r2 = arr[2].trim();
		    if( r1 === r2 ){
			js9Test.results("success", opts.script, d);
		    } else {
			js9Test.results("FAILURE", opts.script, d, r1, r2);
		    }
		} else {
		    js9Test.results("FAILURE", opts.script, d, a);
		}
	    });
	});
    });
}
