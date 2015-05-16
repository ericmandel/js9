/*
 *
 * js9Test: Node-based testing for JS9
 *
 * Principal: Eric Mandel
 * Organization: Harvard Smithsonian Center for Astrophysics, Cambridge MA
 * Contact: saord@cfa.harvard.edu
 *
 * Copyright (c) 2015 Smithsonian Astrophysical Observatory
 *
 * Utilizes: minimist, selenium
 *
 * call: node ./js9Test/js9Test.js --id "myJS9" ./js9Test/t1.js ...
 */

/*jslint bitwise: true, plusplus: true, vars: true, white: true, continue: true, unparam: true, regexp: true, browser: true, devel: true, node: true, stupid: true, nomen: true */

/*jshint smarttabs:true */

"use strict";

// local variables
var i, s;
var cdir = process.cwd();
var tdir = cdir + "/js9Test";

// js9Test object contains everything, gets passed to each command line script
var js9Test = {};

// defaults passed to the tests
js9Test.defpage = "file://" + cdir + "/js9Test/js9Test.html";
js9Test.files = [];

// command line arguments
js9Test.argv = require('minimist')(process.argv.slice(2));
// command line switch options (--browser=firefox, --id="mytest" etc.)
js9Test.browser = js9Test.argv.browser || "firefox";
js9Test.id = js9Test.argv.id || "test";
js9Test.debug = js9Test.argv.debug || false;
js9Test.webpage = js9Test.argv.webpage || js9Test.defpage;
js9Test.width = js9Test.argv.width || 1200;
js9Test.height = js9Test.argv.height  || 1500;
js9Test.timeout = js9Test.argv.timeout  || 10000;
js9Test.exitwait = (js9Test.argv.exitwait * 1000) || 0;
js9Test.image = js9Test.argv.image;
// the list of scripts (comes after the switches, or use --all for all tests)
js9Test.scripts = js9Test.argv._;

// load node modules
var cproc   = require("child_process"),
    fs      = require("fs"),
    assert  = require("assert");

// load webdriver modules
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

// requires at least one test file or --all switch
if( !js9Test.scripts.length ){
    if( !js9Test.argv.all ){
	console.log("ERROR: no tests specified");
	process.exit();
    } else {
	fs.readdir(tdir, function(err, files){
	    var ii, f;
	    for(ii=0; ii<files.length; ii++){
		f = files[ii];
		// only test files, please
		if( f.match(/Test.js$/) && (f !== "js9Test.js") ){
		    js9Test.files.push(f);
		}
	    }
	});
    }
} else {
    for(i=0; i<js9Test.scripts.length; i++){
	s = js9Test.scripts[i];
	if( fs.existsSync(tdir + "/" + s) ){
	    js9Test.files.push(s);
	} else {
	    console.log("warning: " + s + " not found");
	}
    }
}

// build driver for specified browser
var driver = new webdriver.Builder()
    .forBrowser(js9Test.browser)
    .build();

// wait for an image to be ready (loaded or refreshed)
// NB: requires onload and onrefresh functions defined in the html file
// see js9Test.html for the canonical example
js9Test.waitImage = function(func){
    var rid, s;
    var itemXPath, xpath, timeout;
    // set variable used by the Web page to determine which div to display in
    driver.executeScript("JS9.mydisp = '" + js9Test.id + "';").then(function(){
	// once that is done, click the url
	// wait for "ready" div to appear on the page
	timeout = js9Test.timeout;
	rid = js9Test.id + "Ready";
	itemXPath = "//div[@id='" + rid + "']";
	xpath = By.xpath(itemXPath);
	driver.wait(until.elementLocated(xpath), timeout).then(function(){
	    // delete the "ready" div (for the next image to be loaded)
	    if( js9Test.debug ){
		console.log("found div element: " + rid);
	    }
	    s = "var el = document.getElementById('" +
		rid +
		"'); el.parentNode.removeChild(el);";
	    driver.executeScript(s);
	    // call user function, if necessary
	    if( func ){
		func();
	    }
	});
    });
};

// click on a URL to load an image (wait for completion)
js9Test.doImageURL = function(text, opts, func){
    opts = opts || {};
    driver.findElement(By.partialLinkText(text)).click();
    js9Test.waitImage();
    // call user function, if necessary
    if( func ){
	func(text, opts);
    }
};

// click (or add text to) menu item
js9Test.doMenuItem = function(menu, item, opts, func){
    var menuItem, textItem, menuName;
    var itemXPath, xpath, timeout;
    opts = opts || {};
    if( menu ){
	menuName =  menu + "Menu" + js9Test.id + "Menubar";
	// click the menu
	driver.findElement(By.id(menuName)).click();
    }
    // wait until the right menu item is available
    timeout = js9Test.timeout;
    if( opts.xpath ){
	// make your own!
	itemXPath = opts.xpath.replace(/\$item/, "'" + item + "'");
    } else {
	// default for a JS9menu item
	itemXPath = "//span[contains(text(),'" + item + "')]" ;
    }
    xpath = By.xpath(itemXPath);
    driver.wait(until.elementLocated(xpath), timeout).then(function(el){
	if( opts.xpath && !opts.parent ){
	    menuItem = el;
	} else {
	    menuItem = el.findElement(By.xpath(".."));
	}
	// process the menu item
	menuItem.click();
	// send text, if necessary
	if( opts.text ){
	    textItem = el.findElement(By.xpath("../input"));
	    textItem.clear();
	    textItem.sendKeys(opts.text, webdriver.Key.TAB);
	}
	// call user function, if necessary
	if( func ){
	    func(menu, item, opts);
	}
    });
};

js9Test.doMsg = function(msg, opts, func){
    var buf, s, cmd, encoding;
    var itemXPath, xpath, timeout;
    opts = opts || {};
    encoding = opts.encoding || "ascii";
    cmd = "./js9 -id " + js9Test.id + " " + msg;
    // wait until the right menu item is available
    timeout = js9Test.timeout;
    itemXPath = "//div[@id='" + js9Test.id + "']";
    xpath = By.xpath(itemXPath);
    driver.wait(until.elementLocated(xpath), timeout).then(function(){
	// execute the command synchronously
	if( js9Test.debug ){
	    console.log("cmd: " + cmd);
	}
	buf = cproc.execSync(cmd);
	s = buf.toString(encoding);
	if( encoding === "ascii" ){
	    s = s.trim();
	}
	// call user function, if necessary
	if( func ){
	    func(msg, opts, s);
	}
    });
};

// get html from specified xpath
js9Test.getHTML = function(item, opts, func){
    var itemXPath, xpath, timeout;
    opts = opts || {};
    // wait until the right element is available
    timeout = js9Test.timeout;
    if( opts.xpath ){
	// make your own!
	itemXPath = opts.xpath.replace(/\$item/, "'" + item + "'");
    } else {
	// default for a JS9menu item
	itemXPath = "//pre[@class='" + item + "']" ;
    }
    xpath = By.xpath(itemXPath);
    // wait for the element to be located ...
    driver.wait(until.elementLocated(xpath), timeout).then(function(el){
	// ... then get the innerHTML ...
	el.getAttribute("innerHTML").then(function(html){
	    // ... and call user function
	    if( func ){
		func(item, opts, html);
	    }
	});
    });
};

// display results from a test
js9Test.results = function(s, d){
    var i;
    if( d ){
	d = " [" + d + "]";
    } else {
	d = "";
    }
    console.log(js9Test.test + d + ": " + s);
    for(i=2; i<arguments.length; i++){
	console.log("  #" + i + ": " + arguments[i]);
    }
};

// configure and display web page
driver.manage().window().setSize(js9Test.width, js9Test.height);
if( js9Test.debug ){
    console.log("loading: %s", js9Test.webpage);
}
driver.get(js9Test.webpage);

// wait for JS9 to be ready on the page ...
driver.executeScript("return JS9.helper.connected").then(function(s){
    // ... process each test script in turn
    for(i=0; i<js9Test.files.length; i++){
	if( js9Test.debug ){
	    console.log("processing: %s", js9Test.files[i]);
	}
	js9Test.test = js9Test.files[i];
	require(tdir + "/" + js9Test.files[i]).dotest(js9Test);
    }
});

// wait before exiting, if necessary
if( js9Test.exitwait ){
    driver.sleep(js9Test.exitwait);
}

// that's all, folks!
driver.quit();
