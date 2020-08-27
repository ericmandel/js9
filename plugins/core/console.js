/*
 * JS9 console: a window into which commands can be entered
 * basic idea borrowed from goosh.org, to whom grateful acknowledgement is made
 */

/*global $, JS9 */

"use strict";

// create our namespace, and specify some meta-information and params
JS9.Console = {};
JS9.Console.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.Console.NAME = "Console";	// name of this plugin (2nd part of div class)
JS9.Console.WIDTH =  512;	// width of light window
JS9.Console.HEIGHT = 300;	// height of light window

// html used by the console plugin
JS9.Console.HTML =
"<table class='JS9CmdTable'>" +
"<tr class='JS9Tr'>"+
"<td><div id='JS9CmdPrompt' class='JS9CmdPrompt'>@@PR@@</div></td>" +
"<td class='JS9CmdTd'><input type='text' class='JS9CmdIn' autocapitalize='off' autocorrect='off' autocomplete='off' value='' /></td>" +
"</tr>" +
"</table>";

JS9.Console.init = function(width, height){
    // mark as valid
    this.display.conMode = 2;
    // set up history
    this.hist = [];
    this.histpos = 0;
    this.histtemp = 0;
    // add ability to handle events to this div
    // this.divjq.attr("tabindex", "0");
    // add container into the div
    this.consoleConjq = $("<div>")
	.addClass("JS9ConsoleContainer")
	.appendTo(this.divjq);
    // light wins: size is set by containing window
    // for others, we need to set the size
    if( this.winType !== "light" ){
	// set width and height on div
	this.width = this.divjq.attr("data-width");
	if( !this.width  ){
	    this.width  = width || JS9.CONWIDTH;
	}
	this.divjq.css("width", this.width);
	this.width = parseInt(this.divjq.css("width"), 10);
	this.height = this.divjq.attr("data-height");
	if( !this.height ){
	    this.height = height || JS9.CONHEIGHT;
	}
	this.divjq.css("height", this.height);
	this.height = parseInt(this.divjq.css("height"), 10);
	this.consoleConjq
	    .css("width", this.width)
	    .css("height", this.height);
    }
    // add ability to handle events to this div
    this.consoleConjq.attr("tabindex", "0");
    // event handlers:
    // history processing
    this.consoleConjq.on("keydown", this, (evt) => {
	return JS9.Console.keyDownCB(evt);
    });
    // welcome message
    JS9.Console.out.call(this, "Type 'help' for a list of commands", "info");
    // ready next input
    JS9.Console.inp.call(this);
};

// prepare for new input
// called with plugin as this
JS9.Console.inp = function(){
    let el;
    const prompt = "js9>";
    // make previous command input read-only
    this.consoleConjq.find(".JS9CmdIn:last").attr("readonly", "readonly");
    // add new input element
    this.consoleConjq.append(JS9.Console.HTML.replace(/@@PR@@/g,prompt));
    // focus on it
    // and prevent Apple ipads from autocapitalizing, etc.
    el = this.consoleConjq.find(".JS9CmdIn:last");
    el.focus()
	.attr("autocapitalize", "off")
	.attr("autocorrect", "off")
	.attr("autocomplete", "off");
    JS9.jupyterFocus(el.parent());
    // allow chaining
    return this;
};

// output results
// called with plugin object as this
JS9.Console.out = function(s, c){
    // message type
    switch(c.toLowerCase()){
    case "error":
	s = `ERROR: ${s}`;
	c = "Error";
	break;
    case "info":
	c = "Info";
	break;
    case "out":
	c = "Out";
	break;
    default:
	c = "Out";
	break;
    }
    // create a new output element
    $("<div>").addClass(`JS9Cmd${c}`).html(s).appendTo(this.consoleConjq);
    // allow chaining
    return this;
};

// execute a command
// called with plugin object as this
JS9.Console.xeq = function(){
    let i, cmd, obj, msg;
    const cmdstring = this.consoleConjq.find(".JS9CmdIn:last").val();
    const tokens = cmdstring.trim().split(/\s+/);
    const args = [];
    // skip blank lines
    if( !tokens[0] ){
	return this;
    }
    cmd = tokens[0];
    // create args array
    for(i=1; i<tokens.length; i++){
	// handle pseudo-null strings specially
	if( tokens[i].match(/^"\s*"$/) || tokens[i].match(/^'\s*'$/) ){
	    args.push("");
	} else {
	    args.push(tokens[i]);
	}
    }
    // save history, if necessary
    if( !this.hist.length || cmdstring !== this.hist[this.hist.length-1] ){
	this.hist.push(cmdstring);
    }
    this.histpos = this.hist.length;
    // lookup and xeq, if possible
    try{
	obj = JS9.lookupCommand(cmd);
	if( obj ){
	    obj.getDisplayInfo(this.display);
	    switch(obj.getWhich(args)){
	    case "get":
		msg = obj.get(args) || "";
		JS9.Console.out.call(this, msg, "ok");
		break;
	    case "set":
		msg = obj.set(args);
		if( msg ){
		    JS9.Console.out.call(this, msg, "ok");
		}
		break;
	    default:
		msg = `unknown cmd type for '${cmd}'`;
		JS9.error(msg);
		break;
	    }
	} else if( JS9.publics[cmd] ){
	    args.push({display: this.display});
	    msg = JS9.publics[cmd](...args) || "";
	    if( typeof msg === "object" ){
		if( msg instanceof JS9.Display || msg instanceof JS9.Image ){
		    msg = "";
		} else {
		    try{ msg = JSON.stringify(msg); }
		    catch(e) { msg = ""; }
		}
	    }
	    if( typeof msg === "string" && msg !== "OK" ){
		if( msg.match(/^ERROR:/) ){
		    JS9.error(msg);
		} else {
		    JS9.Console.out.call(this, msg, "ok");
		}
	    }
	} else {
	    msg = `unknown command '${cmd}'`;
	    if( args.length > 0 ){
		msg = `${msg} ${args}`;
	    }
	    JS9.error(msg);
	}
    } catch(e){
	// output error
	JS9.Console.out.call(this, e.message, "error");
    }
    // allow chaining
    return this;
};

// console keydown: assumes console obj is passed in evt.data
JS9.Console.keyDownCB = function(evt){
    let v;
    const obj = evt.data;
    const keycode = evt.which || evt.keyCode;
    // history idea and basic algorithm from goosh.org,
    // to whom grateful acknowledgement is made
    // this prevents keypress on FF (and others)
    // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/keydown
    // evt.preventDefault();
    if( JS9.specialKey(evt) ){
	return;
    }
    v = obj.consoleConjq.find(".JS9CmdIn:last");
    v.focus();
    if(obj.hist.length && ((keycode===38) || (keycode===40))){
	if( obj.hist[obj.histpos] ){
	    obj.hist[obj.histpos] = v.val();
	} else {
	    obj.histtemp = v.val();
	}
	switch(keycode){
	case  38:
	    obj.histpos--;
	    if( obj.histpos < 0 ){
		obj.histpos = 0;
	    }
	    break;
	case 40:
	    obj.histpos++;
	    if( obj.histpos > obj.hist.length ){
		obj.histpos = obj.hist.length;
	    }
	    break;
	default:
	    JS9.error("internal keycode switch mixup");
	}
	if( obj.hist[obj.histpos] ){
	    v.val(obj.hist[obj.histpos]);
	} else {
	    v.val(obj.histtemp);
	}
    }
    // xeq command when new-line is pressed and re-init
    if( keycode === 13 ){
	// turn off alerts to user
	JS9.globalOpts.alerts = false;
	JS9.Console.xeq.call(obj);
	// turn on alerts to user
	JS9.globalOpts.alerts = true;
	JS9.Console.inp.call(obj);
    }
};

JS9.RegisterPlugin("JS9", "Console", JS9.Console.init,
		   {menuItem: "Console",
		    help: "help/console.html",
		    winTitle: "Console",
		    winResize: true,
		    winDims: [JS9.Console.WIDTH, JS9.Console.HEIGHT]});
