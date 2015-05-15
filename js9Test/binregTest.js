exports.dotest = function(js9Test){
    var image = js9Test.image || "CTB 109 FITS";
    js9Test.doImageURL(image, null, function(){
	js9Test.doMenuItem("wcs", "pixels");
	js9Test.doMenuItem("region", "circle");
	js9Test.doMenuItem("view", "Binning");
	js9Test.doMenuItem(null, "bin", 
			   {xpath: "//input[@name=$item]", text: "2"});
	js9Test.doMenuItem(null, "rebin", 
			   {xpath: "//input[@name=$item]"});
	js9Test.waitImage();
	js9Test.doMenuItem(null, "close", 
			   {xpath: "//input[@name=$item]"});
	js9Test.doMenuItem("zoom", "zoom 2");
	js9Test.doMenuItem("region", "circle");
	js9Test.doMsg("regions", null, function(msg, opts, s){
	    var arr;
	    var r1="unknown result #1";
	    var r2="unknown result #2";
	    arr = s.split(";");
	    if( arr[1] && arr[2] ){
		r1 = arr[1].trim();
		r2 = arr[2].trim();
	    }
	    if( r1 === r2 ){
		js9Test.results("success");
	    } else {
		js9Test.results("FAILURE", r1, r2);
	    }
	});
    });
}
