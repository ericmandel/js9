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
 * call: node js9Test.js --all
 */

/*jslint bitwise: true, plusplus: true, vars: true, white: true, continue: true, unparam: true, regexp: true, browser: true, devel: true, node: true, stupid: true, nomen: true */

/*jshint smarttabs:true */

"use strict";

// local variables
var i, s;
var cdir = process.cwd();
var tdir = cdir + "/js9Tests";

// js9Test object contains everything, gets passed to each command line script
var js9Test = {};

// defaults passed to the tests
js9Test.defpage = "file://" + cdir + "/js9Test.html";
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
js9Test.delay = js9Test.argv.delay  || 10;
js9Test.exitwait = (js9Test.argv.exitwait * 1000) || 0;
js9Test.image = js9Test.argv.image;
js9Test.images = [];
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
		if( f.match(/Test.js$/) ){
		    js9Test.files.push(f);
		}
	    }
	});
    }
} else {
    for(i=0; i<js9Test.scripts.length; i++){
	s = js9Test.scripts[i] + "Test.js";
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
js9Test.waitImage = function(opt, func){
    var that = this;
    var rid, s;
    var itemXPath, xpath, timeout;
    opt = opt || {};
    // set variable used by the Web page to determine which div to display in
    driver.executeScript("JS9.mydisp = '" + this.id + "';").then(function(){
	// wait for "ready" div to appear on the page
	timeout = that.timeout;
	rid = that.id + "Ready";
	itemXPath = "//div[@id='" + rid + "']";
	xpath = By.xpath(itemXPath);
	if( that.debug ){
	    console.log("waiting for div element %s for %s", rid, opt.script);
	}
	driver.wait(until.elementLocated(xpath), timeout).then(function(){
	    // delete the "ready" div (for the next image to be loaded)
	    if( that.debug ){
		console.log("found div element %s for %s", rid, opt.script);
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
js9Test.clickImageURL = function(text, opts, func){
    var that = this;
    var i;
    opts = opts || {};
    driver.findElement(By.partialLinkText(text)).click().then(function(){
	for(i=0; i<js9Test.images.length; i++){
	    if( text === js9Test.images[i] ){
		// image is already loaded
		if( func ){
		    if( that.debug ){
			console.log("don't wait for div element: %s",
				    opts.script);
		    }
		    func();
		    return;
		}
	    }
	}
	// signal that we have loaded the image ...
	js9Test.images.push(text);
	// ... and wait for it to load
	that.waitImage(opts, func);
    });
};

// click (or add text to) menu item
js9Test.clickMenuItem = function(menu, item, opts, func){
    var menuItem, textItem, menuName;
    var itemXPath, xpath, timeout;
    opts = opts || {};
    if( menu ){
	menuName =  menu + "Menu" + this.id + "Menubar";
	// click the menu
	driver.findElement(By.id(menuName)).click().then(function(){
	    driver.sleep(js9Test.delay);
	});
    }
    // wait until the right menu item is available
    timeout = this.timeout;
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
	menuItem.click().then(function(){
	    driver.sleep(js9Test.delay);
	});
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

// click (or add text to) an item known by its XPath
js9Test.clickXPath = function(xpath, opts, func){
    var timeout, textItem;
    opts = opts || {};
    // wait until the right menu item is available
    timeout = this.timeout;
    xpath = By.xpath(xpath);
    driver.wait(until.elementLocated(xpath), timeout).then(function(el){
	// click the item
	el.click().then(function(){
	    driver.sleep(js9Test.delay);
	});
	// send text, if necessary
	if( opts.text ){
	    textItem = el.findElement(By.xpath("../input"));
	    textItem.clear();
	    textItem.sendKeys(opts.text, webdriver.Key.TAB);
	}
	// call user function, if necessary
	if( func ){
	    func(xpath, opts);
	}
    });
};

js9Test.sendMsg = function(msg, opts, func){
    var encoding, cmd, buf, s;
    opts = opts || {};
    encoding = opts.encoding || "ascii";
    if( opts.pipe ){
	cmd = "cat " + opts.pipe + " | ./js9 -pipe -id " + this.id + " " + msg;
    } else {
	cmd = "./js9 -id " + this.id + " " + msg;
    }
    if( this.debug ){
	console.log("cmd: " + cmd);
    }
    // execute the command synchronously
    buf = cproc.execSync(cmd);
    s = buf.toString(encoding);
    if( encoding === "ascii" ){
	s = s.trim();
    }
    if( func ){
	func(s, msg, opts);
    }
    return s;
};

// get html from specified xpath
js9Test.getHTML = function(item, opts, func){
    var itemXPath, xpath, timeout;
    opts = opts || {};
    // wait until the right element is available
    timeout = this.timeout;
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
		func(html, item, opts);
	    }
	});
    });
};

// delay for specified number of milliseconds
js9Test.delay = function(s, func){
    s = s || js9Test.delay;
    driver.sleep(s).then(func);
};

// display results from a test
js9Test.results = function(r, s, d){
    var i;
    if( d ){
	d = " [" + d + "]";
    } else {
	d = "";
    }
    console.log("%s%s: %s", s, d, r);
    for(i=3; i<arguments.length; i++){
	console.log("  #%s: %s", i-2, arguments[i]);
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
	require(tdir + "/" + js9Test.files[i])
	    .dotest(js9Test, {script: js9Test.files[i]});
    }
});

// wait before exiting, if necessary
if( js9Test.exitwait ){
    driver.sleep(js9Test.exitwait);
}

// that's all, folks!
// driver.quit();
