exports.dotest = function(js9Test, opts){
    var cnts = {
	"CAS-A PNG": 5477,
	"CAS-A FITS": 16389,
	"CTB 109 PNG": 4930,
	"CTB 109 FITS": 4929,
	"m13 PNG": 803979,
	"m13 FITS": 803979,
	"i1000 PNG": 1363404500,
	"i1000 FITS": 1363404500,
    };
    var image = js9Test.image || "CAS-A PNG";
    js9Test.clickImageURL(image, opts, function(){
	var d = "counts in regions";
	js9Test.clickMenuItem("region", "circle");
	js9Test.clickMenuItem("analysis", "Counts in Regions");
	js9Test.getHTML("JS9AnalysisText", null, function(html){
	    var c, arr, arr2;
	    arr = html.split("\n");
	    arr2 = arr[13].trim().replace(/  */g, " ").split(" ");
	    c = parseFloat(arr2[1]);
	    if( cnts[image] ){
		if( cnts[image] === c ){
		    js9Test.results("success", opts.script, d);
		} else {
		    js9Test.results("FAILURE", opts.script, d, cnts[image], c);
		}
	    } else {
		js9Test.results("FAILURE (nothing to compare to)", opts.script, d, c);
	    }
	    js9Test.clickXPath("//div[starts-with(@id, 'Analysis')]//img[@title='Close']");
	});
    });
}
