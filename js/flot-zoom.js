/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9 */ 

"use strict";


(function($) {
    function zoomStackIn(plot, event, ranges, func) {
	var axes = plot.getAxes();
	var div  = plot.getPlaceholder();

	var r = {};
	r.xmin = axes.xaxis.min;
	r.xmax = axes.xaxis.max;
	r.ymin = axes.yaxis.min;
	r.ymax = axes.yaxis.max;

	plot.stack.push(r);

	axes.xaxis.options.min = ranges.xaxis.from;
	axes.xaxis.options.max = ranges.xaxis.to;
	axes.yaxis.options.min = ranges.yaxis.from;
	axes.yaxis.options.max = ranges.yaxis.to;

	plot.clearSelection(true);

	plot.setupGrid();
	plot.draw();

	$(div).find(".zoomout").css("visibility", "visible");

	if ( func !== undefined ) { func(plot, r); }
    }

    function zoomStackOut(plot, func) {
	var r    = plot.stack.pop();
	var div  = plot.getPlaceholder();

	if (  plot.stack.length === 0 ) {
	    $(div).find(".zoomout").css("visibility", "hidden");
	}

	plot.getAxes().xaxis.options.min = r.xmin;
	plot.getAxes().xaxis.options.max = r.xmax;
	plot.getAxes().yaxis.options.min = r.ymin;
	plot.getAxes().yaxis.options.max = r.ymax;

	plot.clearSelection(true);

	plot.setupGrid();
	plot.draw();

	if ( func !== undefined ) { func(plot, r); }
    }

    var enabled = 0;

    var options = {
	  zoomStack: 0
	, zoomFunc: undefined
    };

    function zoomStack(plot, ctx) {
	if ( enabled ) {
	    plot.stack = [];
	    var div = plot.getPlaceholder();
	    $(div).append("<div style='position:relative'><div style='z-index:100;position:absolute;right:12;top:12;z-index:2'>		\
             <img class='zoomout' width='16' height='16' title='' alt='' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABYlBMVEU9m+Y6l+I8meQ+nehAn+o/nuk8muU3luEujdgsi9Yujdcwj9ogf8ojgs0ce8YYd8IaecQZa7YbbrkabbgWZ7IVZrEIVaAMWqUQYKsCFSgAAAA/nehAn+pAn+o9m+ZVru09m+Y8meQ+neg8meRUruxQquo6l+I/nulVr+44l+JMqOg3luEsi9ZqyfYujdcgf8o2mNpgxPQjgs0ce8YaecQbesUZa7YabbgabLcWZ7IcfcQpq+sVZrEQX6oepuoQYKsMWqUPcrwMWqUIVJ8UcbgKbbcJVqEIVaANb7gFUJsPbLQEPXUDKU8JarQBFCYCTJcCN2wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACZ5f+V5P+U5P+I3/9Qm9GY5f+W5P9Pm9F93P+T4/+R4/+N4f+L4f9k1P9f0v9Tzv9OzP8zisgivf8Xuv8xishAx/8zw/8jvv8Wuv8twf8Uuf////9LFEt0AAAAWnRSTlMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzzHDM2XAzM3DZ2YXM2XDZzIXzzDPZ88wzzJkzzJkz2fPMhfPMcNnMcNnZhczZzNlwM9lAzIMyLioiGx0mKy/TF9BpAAAAAWJLR0R1qGqY+wAAAPtJREFUGNMVxedfQVEYAOD3cm8iDm84114l2SuyZ5LcjHaKop3R/P9/nft8ecDucAKnUPK8UsGB02EH18jt4bw+nvd5OY975IKt7Vv/jj8gCAHW3a4T1oKh8eQ+rFKFHybjUFCAdXVkOovGNJpYdDaNqDdAG088Jp9SOl3qOfmSiGuBpPeYDCEZ+TQBQvSMgRCDPCGAuMkYEY3yiIDZfSaHmJPPIpjyhdfiW8lsLr0XPwp5E1CxPF9UqhZLtbKYl0UKtFZfrj4botj4Wi3rNQrNg+/WYatNaZv1c9SEzu9x1ypJNpskWbsnfx3o9QfD07Pzi8ur65vhoN/7B9wsL7lanTVQAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDEzLTA0LTAzVDE3OjE4OjAxKzA4OjAw0kcQ3gAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMS0wNS0xOFQyMzoyNzowMCswODowMPWTeDEAAABNdEVYdHNvZnR3YXJlAEltYWdlTWFnaWNrIDYuOC44LTcgUTE2IHg4Nl82NCAyMDE0LTAyLTI4IGh0dHA6Ly93d3cuaW1hZ2VtYWdpY2sub3JnWaRffwAAABh0RVh0VGh1bWI6OkRvY3VtZW50OjpQYWdlcwAxp/+7LwAAABd0RVh0VGh1bWI6OkltYWdlOjpIZWlnaHQAMTYdr15vAAAAFnRFWHRUaHVtYjo6SW1hZ2U6OldpZHRoADE25QCe4gAAABl0RVh0VGh1bWI6Ok1pbWV0eXBlAGltYWdlL3BuZz+yVk4AAAAXdEVYdFRodW1iOjpNVGltZQAxMzA1NzMyNDIw3zNdNgAAABF0RVh0VGh1bWI6OlNpemUANzcxQkKQmHCaAAAAYHRFWHRUaHVtYjo6VVJJAGZpbGU6Ly8vaG9tZS9mdHAvMTUyMC9lYXN5aWNvbi5jbi9lYXN5aWNvbi5jbi9jZG4taW1nLmVhc3lpY29uLmNuL3BuZy81MTIyLzUxMjIzMy5wbmelXfH0AAAAAElFTkSuQmCC' /></div></div>");

	    $(div).bind("plotselected", function (event, ranges) { zoomStackIn (plot, event, ranges, options.zoomFunc); });
	    $(div).find(".zoomout").click(function ()            { zoomStackOut(plot, options.zoomFunc); });

	    $(div).find(".zoomout").css("visibility", "hidden");

	    enabled = 0;
	}
    }

    function zoomOptions(plot, opts) {
        // zoomStack can be true or it can be an object containing options
        if ( opts && opts.zoomStack ) {
            if( typeof opts.zoomStack === "object" ){
                options.zoomStack = opts.zoomStack.enabled;
                options.zoomFunc = opts.zoomStack.func;
            } else {
                options.zoomStack = opts.zoomStack;
            }
        }
        if( options.zoomStack ){
            enabled = 1;
	    plot.hooks.drawOverlay.push(zoomStack);
        }
    }

    function init(plot) {
	plot.hooks.processOptions.push(zoomOptions);
    }

    $.plot.plugins.push({ init: init, options: options, name: "zoomStack", version: 0.1 });
}($));

