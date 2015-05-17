exports.dotest = function(js9Test){
    js9Test.doImageURL("CAS-A PNG", null, function(){
	js9Test.doMenuItem("scale", "log");
	js9Test.doMenuItem("color", "contrast", {text: "3.8"});
	js9Test.doMenuItem("color", "bias", {text: "0.7"});
	js9Test.doMenuItem("color", "cool");
	js9Test.doMenuItem("region", "circle");
	js9Test.doMenuItem("region", "box");
	js9Test.doMenuItem("region", "ellipse");
	js9Test.doMenuItem("wcs", "pixels");
	js9Test.doMenuItem("region", "listRegions");
    });
}
