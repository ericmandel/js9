/*global $ */
var Module;
if( typeof Module !== "object" ){ Module = {}; }
Module["noExitRuntime"] = true;
Module["onRuntimeInitialized"] = function(){
    if( window.jQuery ){
	if( Module["astroemReady"] ){
	    $(document).trigger("astroem:ready", {status: "OK"});
	} else {
	    Module["astroemReady"] = true;
	}
    }
};
