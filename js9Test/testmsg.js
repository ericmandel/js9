exports.dotest = function(js9Test){
    js9Test.doImageURL("CAS-A FITS", null, function(){
	js9Test.doMsg("cmap green");
	js9Test.doMsg("cmap", null, function(msg, opts, s){
	    console.log("cmap: " + s);
	});
	js9Test.doMsg("wcsu pixels");
	js9Test.doMsg("wcsu", null, function(msg, opts, s){
	    console.log("wcsu: " + s);
	});
	js9Test.doMsg("region circle");
	js9Test.doMsg("region", null, function(msg, opts, s){
	    console.log("region: " + s);
	});
    });
}
