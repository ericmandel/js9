// Image Processing Filters adapted from:
//   https://code.msdn.microsoft.com/Image-Filters-in-Javascript-0853f6c1
// and:
//   https://github.com/kig/canvasfilters
// which look to be adapted from:
//   http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
// some improved algorithms taken from good, dead projects:
//   https://github.com/bennyschudel/JSManipulate
//   https://github.com/meltingice/CamanJS/

/*jslint plusplus: true, vars: true, white: true  */

/*global Float32Array */

var ImageFilters;
ImageFilters = (function(){
"use strict";

    function normalize(array){
	var i, sum;
	sum = array.reduce( function (a, b){ return a+b; } );
	for(i=0; i<array.length; ++i){
	    array[i] /= sum;
	}
    }
    
    function convolve(ctx, pixels, weights, opaque, norm){
	var i, x, y, sx, sy, scx, scy, dstOff, cx, cy, srcOff, wt, r, g, b, a;
	var side = Math.round(Math.sqrt(weights.length));
	var halfSide = Math.floor(side/2);
	var sw = pixels.width;
	var sh = pixels.height;
	var swh = sw * sh * 4;
	// pad output by the convolution matrix
	var w = sw;
	var h = sh;
	var dst = pixels.data;
	// src data is a copy of the input (which we then return in place)
	var src = ctx.createImageData(pixels.width, pixels.height);
	for(i=0; i<swh; i++){
	    src[i] = dst[i];
	}
	// weights array is required
	if( Object.prototype.toString.call(weights) !== '[object Array]' ) {
	    return pixels;
	}
	// default is opaque
	if( opaque === undefined ){
	    opaque = true;
	}
	var alphaFac = opaque ? 1 : 0;
	// default is not to normalize
	if( norm ){
	    normalize(weights);
	}
	// go through the destination image pixels
	for (y = 0; y < h; y++){
	    for (x = 0; x < w; x++){
		sy = y;
		sx = x;
		dstOff = (y*w+x)*4;
		// calculate the weighed sum of the source image pixels that
		// fall under the convolution matrix
		r = 0; g = 0; b = 0; a = 0;
		for (cy = 0; cy < side; cy++){
		    for (cx = 0; cx < side; cx++){
			// scy = sy + cy - halfSide;
			// scx = sx + cx - halfSide;
			// if (scy >= 0 && scy < sh && scx >= 0 && scx < sw){
			scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
			scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
			srcOff = (scy * sw + scx)*4;
			wt = weights[cy * side + cx];
			r += src[srcOff] * wt;
			g += src[srcOff+1] * wt;
			b += src[srcOff+2] * wt;
			a += src[srcOff+3] * wt;
			// }
		    }
		}
		dst[dstOff] = r;
		dst[dstOff+1] = g;
		dst[dstOff+2] = b;
		dst[dstOff+3] = a + alphaFac*(255-a);
	    }	
	}
	return pixels;
    }
    
    function convolveFloat32(ctx, pixels, weights, opaque){
	var x, y, sx, sy, scx, scy, dstOff, cx, cy, srcOff, wt, r, g, b, a;
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side/2);
	
        var src = pixels.data;
        var sw = pixels.width;
        var sh = pixels.height;
	
        var w = sw;
        var h = sh;
        var output = {
            width: w, height: h, data: new Float32Array(w*h*4)
        };
        var dst = output.data;
        var alphaFac = opaque ? 1 : 0;
        for (y = 0; y < h; y++){
            for (x = 0; x < w; x++){
		sy = y;
		sx = x;
		dstOff = (y * w + x) * 4;
		r = 0; g = 0; b = 0; a = 0;
		for (cy = 0; cy < side; cy++){
		    for (cx = 0; cx < side; cx++){
			scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
			scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
			srcOff = (scy*sw + scx)*4;
			wt = weights[cy*side + cx];
			r += src[srcOff] * wt;
			g += src[srcOff+1] * wt;
			b += src[srcOff+2] * wt;
			a += src[srcOff+3] * wt;
		    }
		}
		dst[dstOff] = r;
		dst[dstOff+1] = g;
		dst[dstOff+2] = b;
		dst[dstOff+3] = a + alphaFac*(255-a);
            }
        }
        return output.data;
    }
    
    function luminance(ctx, imageData){
	var i, v;
	var data = imageData.data;
	for(i = 0; i < data.length; i += 4){
	    // CIE luminance for the RGB
	    // Human eye is bad at seeing red and blue, so de-emphasize them.
	    v = 0.2126*data[i] + 0.7152*data[i+1] + 0.0722*data[i+2];
	    data[i] = data[i+1] = data[i+2] = v;
	}
	return imageData;
    }
    
    function greyscale(ctx, imageData){
	var i, v;
	var data = imageData.data;
	for(i = 0; i < data.length; i += 4){
	    v = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
	    data[i] = data[i+1] = data[i+2] = v;
	}
	return imageData;
    }
    
    function greyscaleAvg(ctx, imageData){
	var i, v;
	var data = imageData.data;
	for(i = 0; i < data.length; i += 4){
	    v = (data[i] + data[i+1] + data[i+2])/3;
	    data[i] = data[i+1] = data[i+2] = v;
	}
	return imageData;
    }
    
    function duotone(ctx, imageData, which) {
	var i, r;
	var data = imageData.data;
	switch(which){
	case "r":
	    which = 0;
	    break;
	case "g":
	    which = 1;
	    break;
	case "b":
	    which = 2;
	    break;
	default:
	    which = 0;
	    break;
	}
	for(i = 0; i < data.length; i += 4) {
	    // average the other two colors for this pixel
	    r = (data[i] + data[i+1] + data[i+2] - data[i+which])/2;
	    data[i+which] = r;
	}
	return imageData;
    }

    function noise(ctx, imageData, lower, upper){
	var i, radius, mod;
	var data = imageData.data;
	if(arguments.length < 3){
	    lower = -30;
	    upper = 30;
	} else if( arguments.length === 3 ){
	    upper = lower;
	    lower = -lower;
	}
	radius = upper - lower;
	for(i = 0; i < data.length; i += 4){
	    mod = Math.floor((Math.random() * radius) - upper);
	    data[i] += mod;
	    data[i+1] += mod;
	    data[i+2] += mod;
	}
	return imageData;
    }
    
    function invert(ctx, imageData){
	var i;
	var data = imageData.data;
	for(i = 0; i < data.length; i += 4){
	    data[i] = 255 - data[i];
	    data[i+1] = 255 - data[i+1];
	    data[i+2] = 255 - data[i+2];
	}
	return imageData;
    }
    
    function pixelate(ctx, imageData, radius){
	var r, g, b, idx, odx, ody;
	var x, y, nx, ny, delta, ioff;
	var width = imageData.width;
	var height = imageData.height;
	var data = imageData.data;
	if(arguments.length < 3){
	    radius = 2;
	}
	if( radius <= 0 ){
	    return imageData;
	}
	delta = (2 * radius);
	for(y = radius; y < height - radius; y += delta){
	    for(x = radius; x < width - radius; x += delta){
		idx = ((width * y) + x) * 4;
		r = data[idx];
		g = data[idx + 1];
		b = data[idx + 2];
		for(ny = -radius; ny < radius; ++ny){
		    ody = (width*(y + ny));
		    for(nx = -radius; nx < radius; ++nx){
			odx = (ody + (x + nx)) * 4;
			data[odx] = r; 
			data[odx+1] = g;
			data[odx+2] = b; 
		    }
		}
	    }
	}
	ioff = height % delta ? height % delta : delta;
	for(y = height - ioff; y < height; y++){
	    ody = width * y;
	    for(x = 0; x < width; x++){
		odx = (x + ody) * 4;
		data[odx] = 0; 
		data[odx+1] = 0;
		data[odx+2] = 0; 
	    }
	}
	ioff = width % delta ? width % delta : delta;
	for(y = 0; y < height; y++){
	    ody = width * y;
	    for(x = width - ioff; x < width; x++){
		odx = (x + ody) * 4;
		data[odx] = 0; 
		data[odx+1] = 0;
		data[odx+2] = 0; 
	    }
	}
	return imageData;
    }
    
    function gamma(ctx, imageData, amount){
	var i;
	var data = imageData.data;
	if(arguments.length < 3){
	    amount = 0.2;
	}
	for(i = 0; i < data.length; i += 4){
	    data[i] = 255 * Math.pow(data[i] / 255, amount); 
	    data[i+1] = 255 * Math.pow(data[i+1] / 255, amount);
	    data[i+2] = 255 * Math.pow(data[i+2] / 255, amount);
	}
	return imageData;
    }
    
    function brighten(ctx, imageData, a){
	var i;
	var data = imageData.data;
	if(arguments.length < 3){
	    a = 10;
	}
	for(i = 0; i < data.length; i += 4){
	    data[i] += a;
	    data[i+1] += a;
	    data[i+2] += a;
	}
	return imageData;
    }
    
    function sepia(ctx, imageData, adjust){
	var i, r, g, b;
	var data = imageData.data;
	if( adjust === undefined ){
	    adjust = 100;
	}
	adjust /= 100;
	for(i = 0; i < data.length; i += 4){
	    r = data[i];
	    g = data[i+1];
	    b = data[i+2];
//	    data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
//	    data[i+1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
//	    data[i+2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
	    // Caman.js
	    // All three color channels have special conversion factors that
	    // define what sepia is. Here we adjust each channel individually,
	    // with the twist that you can partially apply the sepia filter.
	    data[i] = Math.min(255, (r * (1 - (0.607 * adjust))) + (g * (0.769 * adjust)) + (b * (0.189 * adjust)));
	    data[i+1] = Math.min(255, (r * (0.349 * adjust)) + (g * (1 - (0.314 * adjust))) + (b * (0.168 * adjust)));
	    data[i+2] = Math.min(255, (r * (0.272 * adjust)) + (g * (0.534 * adjust)) + (b * (1- (0.869 * adjust))));
	}
	return imageData;
    }
    
    function contrast(ctx, imageData, amount){
	var i;
	var data = imageData.data;
	if(arguments.length < 3){
	    amount = 2;
	}
	if(amount < -100){
	    amount = -100;
	} else if(amount > 100){
	    amount = 100;
	}
	for(i = 0; i < data.length; i += 4){
	    data[i] = ((((data[i] / 255) - 0.5) * amount) + 0.5) * 255;
	    data[i+1] = ((((data[i+1] / 255) - 0.5) * amount) + 0.5) * 255;
	    data[i+2] = ((((data[i+2] / 255) - 0.5) * amount) + 0.5) * 255;
	}
	return imageData;
    }
    
    function threshold(ctx, imageData, thresh, low, high){
	var i, r, g, b, val;
	var data = imageData.data;
	if(arguments.length < 3){
	    thresh = 10;
	    low = 0;
	    high = 255;
	} else if(arguments.length < 5){
	    low = 0;
	    high = 255;
	}
	for(i = 0; i < data.length-1; i += 4){
	    r = data[i];
	    g = data[i+1];
	    b = data[i+2];
	    val = (0.2126*r + 0.7152*g + 0.0722*b >= thresh) ? high : low;
	    data[i] = data[i+1] = data[i+2] = val;
	}
	return imageData;
    }

    function medianFilter(ctx, imageData){
	return convolve(ctx, imageData,
			[1,0,0,0,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,0,0,0,1],
			true, true);
    }
    
    function sobel(ctx, imageData, colorize){
	var i, v, h;
	var vertical, horizontal;
	var data = imageData.data;
	imageData = greyscaleAvg(ctx, imageData);
	horizontal = convolveFloat32(ctx, imageData, 
				     [ -1, 0, 1, -2, 0, 2, -1, 0, 1 ]);
	vertical   = convolveFloat32(ctx, imageData,
				     [ -1, -2, -1, 0, 0, 0, 1, 2, 1 ]);
	if(colorize){
	    for (i=0; i<data.length; i+=4){
		v = Math.abs(vertical[i]);
		h = Math.abs(horizontal[i]);
		data[i] = v;
		data[i+1] = h;
		data[i+2] = (v+h)/4;
	    }
	} else {
	    for (i=0; i<data.length; i+=4){
		v = Math.abs(vertical[i]);
		h = Math.abs(horizontal[i]);
		data[i] = v;
		data[i+1] = h;
		data[i+2] = (v+h)/2;
	    }
	    greyscale(ctx, imageData);
	}
	return imageData;
    }
    
    function gaussBlur5(ctx, imageData){
	return convolve(ctx, imageData, [ 
	    0.0030, 0.0133, 0.0219, 0.0133, 0.0030,
	    0.0133, 0.0596, 0.0983, 0.0596, 0.0133,
	    0.0219, 0.0983, 0.1621, 0.0983, 0.0219,
	    0.0133, 0.0596, 0.0983, 0.0596, 0.0133,
	    0.0030, 0.0133, 0.0219, 0.0133, 0.0030 ]);
    }
    
    function posterize(ctx, imageData, colors){
	var i, r, g, b;
	var levels = [];
	var level = 1;
	var data = imageData.data;
	if(arguments.length < 3){
	    colors = 40;
	}
	for(i = 0; i < 256; ++i){
	    if( i < (colors * level) ){
		levels[i] = colors * (level - 1);
	    } else {
		levels[i] = (colors * level);
		++level;
	    }
	}
	for(i = 0; i < data.length; i += 4){
	    r = data[i];
	    g = data[i+1];
	    b = data[i+2];
	    data[i] = levels[r];
	    data[i+1] = levels[g];
	    data[i+2] = levels[b];
	}
	return imageData;
    }

    function scatter(ctx, imageData, radius){
	var x, y, swap, nswaps, delta, total;
	var px1, py1, px2, py2;
	var width = imageData.width;
	var height = imageData.height;
	var data = imageData.data;
	var swapPixel = function (x1, y1, x2, y2){
	    var temp = [];
	    var w1 = ((width * y1) + x1) * 4;
	    var w2 = ((width * y2) + x2) * 4;
	    temp[0] = data[w1];
	    temp[1] = data[w1+1];
	    temp[2] = data[w1+2];
	    temp[3] = data[w1+3];
	    data[w1]   = data[w2];
	    data[w1+1] = data[w2+1];
	    data[w1+2] = data[w2+2];
	    data[w1+3] = data[w2+3];
	    data[w2]   = temp[0];
	    data[w2+1] = temp[1];
	    data[w2+2] = temp[2];
	    data[w2+3] = temp[3];
	};
	if(arguments.length < 3){
	    radius = 5;
	}
	if( radius <= 0 ){
	    return imageData;
	}
	delta = 2 * radius;
	total = (radius - 1) * radius;
	for(y = radius; y < height - radius; y += delta){
	    for(x = radius; x < width - radius; x += delta){
		swap = false;
		nswaps = 0;
		while(!swap){
		    px1 = Math.floor((Math.random() * delta) - radius);
		    py1 = Math.floor((Math.random() * delta) - radius);
		    px2 = Math.floor((Math.random() * delta) - radius);
		    py2 = Math.floor((Math.random() * delta) - radius);
		    swapPixel(px1 + x, py1 + y, px2 + x, py2 + y);
		    ++nswaps;
		    if(nswaps > total){
			swap = true;
		    }
		}
	    }
	}
	return imageData;
    }
    
    function solarize(ctx, imageData, threshold){
	var i, r, g, b, intensity;
	var data = imageData.data;
	if(arguments.length < 3){
	    threshold = 50;
	}
	for(i = 0; i < data.length; ++i){
	    r = data[i];
	    g = data[i+1];
	    b = data[i+2];
	    intensity = (r + g + b)/3.0;
	    if(intensity < threshold){
		data[i] = 255 - r;
		data[i+1] = 255 - g;
		data[i+2] = 255 - b;
	    }
	}
	return imageData;
    }
	
//    function blur(ctx, imageData){
//	return convolve(ctx, imageData,
//			[ 1, 2, 1, 2, 1, 2, 1, 2, 1 ],
//			true, true);
//    }
    // JSManipulate.js
    function blur(ctx, imageData, amount){
	var width = imageData.width;
	var width4 = width << 2;
	var height = imageData.height;
	var data = imageData.data;
	var q, qq, qqq, b0, b1, b2, b3, bigB, index, indexLast;
	var pixel, ppixel, pppixel, ppppixel;
	var c = 0;
	if( amount === undefined ){
	    amount = 30;
	}
	amount /= 10;
	if (amount < 0.0) {
	    amount = 0.0;
	}
	if (amount >= 2.5) {
	    q = 0.98711 * amount - 0.96330;
	} else if (amount >= 0.5) {
	    q = 3.97156 - 4.14554 * Math.sqrt(1.0 - 0.26891 * amount);
	} else {
	    q = 2 * amount * (3.97156 - 4.14554 * Math.sqrt(1.0 - 0.26891 * 0.5));
	}
	qq = q * q;
	qqq = qq * q;
	b0 = 1.57825 + (2.44413 * q) + (1.4281 * qq ) + (0.422205 * qqq);
	b1 = ((2.44413 * q) + (2.85619 * qq) + (1.26661 * qqq)) / b0;
	b2 = (-((1.4281 * qq) + (1.26661 * qqq))) / b0;
	b3 = (0.422205 * qqq) / b0;
	bigB = 1.0 - (b1 + b2 + b3);
	for (c = 0; c < 3; c++) {
	    for (var y = 0; y < height; y++) {
		index = y * width4 + c;
		indexLast = y * width4 + ((width - 1) << 2) + c;
		pixel = data[index];
		ppixel = pixel;
		pppixel = ppixel;
		ppppixel = pppixel;
		for (; index <= indexLast; index += 4) {
		    pixel = bigB * data[index] + b1 * ppixel + b2 * pppixel + b3 * ppppixel;
		    data[index] = pixel;
		    ppppixel = pppixel;
		    pppixel = ppixel;
		    ppixel = pixel;
		}
		index = y * width4 + ((width - 1) << 2) + c;
		indexLast = y * width4 + c;
		pixel = data[index];
		ppixel = pixel;
		pppixel = ppixel;
		ppppixel = pppixel;
		for (; index >= indexLast; index -= 4) {
		    pixel = bigB * data[index] + b1 * ppixel + b2 * pppixel + b3 * ppppixel;
		    data[index] = pixel;
		    ppppixel = pppixel;
		    pppixel = ppixel;
		    ppixel = pixel;
		}
	    }
	}
	for (c = 0; c < 3; c++) {
	    for (var x = 0; x < width; x++) {
		index = (x << 2) + c;
		indexLast = (height - 1) * width4 + (x << 2) + c;
		pixel = data[index];
		ppixel = pixel;
		pppixel = ppixel;
		ppppixel = pppixel;
		for (; index <= indexLast; index += width4) {
		    pixel = bigB * data[index] + b1 * ppixel + b2 * pppixel + b3 * ppppixel;
		    data[index] = pixel;
		    ppppixel = pppixel;
		    pppixel = ppixel;
		    ppixel = pixel;
		}
		index = (height - 1) * width4 + (x << 2) + c;
		indexLast = (x << 2) + c;
		pixel = data[index];
		ppixel = pixel;
		pppixel = ppixel;
		ppppixel = pppixel;
		for (; index >= indexLast; index -= width4) {
		    pixel = bigB * data[index] + b1 * ppixel + b2 * pppixel + b3 * ppppixel;
		    data[index] = pixel;
		    ppppixel = pppixel;
		    pppixel = ppixel;
		    ppixel = pixel;
		}
	    }
	}
    }


    function edgeDetect(ctx, imageData){
	return convolve(ctx, imageData, 
			 [ -1, -1, -1, -1, 8, -1, -1, -1, -1 ]);
    }
	
    function sharpen(ctx, imageData, amount){
	if(arguments.length < 3){
	    amount = 20;
	}
	return convolve(ctx, imageData,
			[ 0, -1,  0, -1, amount, -1, 0, -1, 0 ], 
			true, true);
    }
	
    function emboss(ctx, imageData, amount){
	if(arguments.length < 3){
	    amount = 95;
	}
	return convolve(ctx, imageData,
			[ -18, -9, 9, -9, 100 - amount, 9, 0, 9, 18 ],
			true, true);
    }
	
    function lighten(ctx, imageData, amount){
	if(arguments.length < 3 || amount < 0){
	    amount = 12/9;
	}
	return convolve(ctx, imageData, [ 0, 0, 0, 0, amount, 0, 0, 0, 0 ]);
    }
	
    function darken(ctx, imageData, amount){
	if(arguments.length < 3 || amount > 1){
	    amount = 6/9;
	}
	return convolve(ctx, imageData, [ 0, 0, 0, 0, amount, 0, 0, 0, 0 ]);
    }
	
    return {
	convolve : convolve,
	luminance : luminance,
	greyscale : greyscale,
	greyscaleAvg : greyscaleAvg,
	brighten : brighten,
	noise : noise,
	duotone : duotone,
	invert : invert,
	pixelate : pixelate,
	sobel : sobel,
	medianFilter : medianFilter,
	sepia : sepia,
	contrast : contrast,
	threshold : threshold,
	gamma : gamma,
	gaussBlur5 : gaussBlur5,
	posterize : posterize,
	scatter : scatter,
	solarize : solarize,
	sharpen : sharpen,
	edgeDetect : edgeDetect,
	blur : blur,
	emboss : emboss,
	lighten : lighten,
	darken : darken
    };
}());
