exports.dotest = function(js9Test, opts){
    var rfiles = ["./js9Tests/js9-pix.reg",
		  "./js9Tests/js9-hms.reg",
		  "./js9Tests/js9-deg.reg"];
    var image = js9Test.image || "CAS-A PNG";
    js9Test.clickImageURL(image, opts, function(){
	var a0, ai, i;
	js9Test.sendMsg("wcsu pixels");
	js9Test.sendMsg("regions remove", {pipe: rfiles[0]});
	a0 = js9Test.sendMsg("regions", null);
	var d = "regions in different units are 'the same'";
	js9Test.results( "checking ...", opts.script, d);
	for(i=1; i<rfiles.length; i++){
 	    js9Test.sendMsg("regions remove", {pipe: rfiles[i]});
	    ai = js9Test.sendMsg("regions");
	    if( a0 === ai ){
		js9Test.results("success", "    " + rfiles[i], null);
	    } else {
		js9Test.results("FAILURE", "    " + rfiles[i], null, a0, ai);
	    }
	}
    });
}
