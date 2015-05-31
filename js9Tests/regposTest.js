exports.dotest = function(js9Test, opts){
    var image = js9Test.image || "CAS-A PNG";
    js9Test.clickImageURL(image, opts, function(){
	var i, a, arr, x0, y0, xi, yi;
	var rfile = "./js9Tests/js9-pos.reg";
	var d = "regions have the same physical position as";
	js9Test.sendMsg("wcsu pixels");
	js9Test.sendMsg("regions remove", {pipe: rfile});
	a = js9Test.sendMsg("GetRegions", null);
	try{ arr = JSON.parse(a); }
	catch(e){
	    js9Test.results("FAILURE", "    could not parse json results");
	    return;
	}
	x0 = arr[0].lcs.x.toFixed(2);
	y0 = arr[0].lcs.x.toFixed(2);
	js9Test.results( arr[0].imstr, opts.script, d);
	for(i=1; i<arr.length; i++){
	    xi = arr[i].lcs.x.toFixed(2);
	    yi = arr[i].lcs.x.toFixed(2);
	    if( (x0 === xi) && (y0 === yi) ){
		js9Test.results("success", "    " + arr[i].imstr, null);
	    } else {
		js9Test.results("FAILURE", "    " + arr[i].imstr, null, x0, y0, xi, yi);
	    }
	}
    });
}
