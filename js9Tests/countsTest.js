exports.dotest = function(js9Test){
    var cnts = {
	"CAS-A PNG": 5562, 
	"CAS-A FITS": 5562, 
	"CTB 109 PNG": 4930, 
	"CTB 109 FITS": 4930, 
	"m13 PNG": 804012,
	"m13 FITS": 804012,
	"i1000 PNG": 1363404500,
	"i1000 FITS": 1363404500,
    };
    var image = js9Test.image || "CAS-A PNG";
    js9Test.doImageURL(image, null, function(){
	var d = "counts in regions";
	js9Test.doMenuItem("region", "circle");
	js9Test.doMenuItem("analysis", "Counts in Regions");
	js9Test.getHTML("JS9AnalysisText", null, function(item, opts, html){
	    var c, arr, arr2;
	    arr = html.split("\n");
	    arr2 = arr[13].trim().replace(/  */g, " ").split(" ");
	    c = parseFloat(arr2[1]);
	    if( cnts[image] ){
		if( cnts[image] === c ){
		    js9Test.results("success", d);
		} else {
		    js9Test.results("FAILURE", d, cnts[image], c);
		}
	    } else {
		js9Test.results("FAILURE (nothing to compare to)", d, c);
	    }
	    js9Test.doXPath("//div[starts-with(@id, 'Analysis')]//img[@title='Close']");
	});
    });
}
