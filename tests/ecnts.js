// ecnts.js: test of hostfs ... display 3 sections and get counts in each
let fs;
try{
    fs = require("fs");
}
catch(e){
    JS9.error("Node.js 'fs' module is unavailable. Did you enable hostfs?");
}

JS9.Load("data/kes75/kes75_evt2.fits.gz", {scale: "log", onload: function(im){
    let i;
    let s = "";
    let got = 0;
    // energy filters
    const cmaps = ["red", "green", "blue"];
    const f = ["energy=500:1500", "energy=1500:2500", "energy=2500:8000"];
    // get counts in regions as each image is displayed
    const getcnts = function(i){
  	return function(xim){
	    process.stdout.write(`processing filter: ${f[i]}\n`);;
	    xim.setScale("log")
	    process.stdout.write(`set colormap: ${cmaps[got]}\n`);;
	    xim.setColormap(cmaps[got]);
	    process.stdout.write(`running counts in regions\n\n`);;
  	    s += xim.countsInRegions();
  	    got++;
  	    if( got === 3 ){
		xim.setColormap("rgb")
                // write the results to a log file
  		fs.writeFile("countsInRegions.log", s, function(err) {
		    if( err ) { JS9.error(err); }
		    process.stdout.write(`\ncountsInRegions.log:\n\n${s}\n`);;
  		}); 
  	    }
    	};
    };
    // process each of the event filters to make a separate image
    for(i=0; i<f.length; i++){
    	// display filtered image in a separate displayed
    	JS9.DisplaySection({filter:f[i], separate:true,
    			    ondisplaysection: getcnts(i)}, {display: im});
    }
}});
