/* Copyright (c) 2009 Daniel Wachsstock
 * Modified from Brandon Aaron's (http://brandonaaron.net) gradient
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Color functions from Steve's Cross Browser Gradient Backgrounds v1.0 (steve@slayeroffice.com && http://slayeroffice.com/code/gradient/)
 *
 * Version 2.1; updated for jQuery 1.9
 */
(function($) {

/**
 * Adds a gradient to the background of an element.
 * 
 * There are three ways to call the function
 * @example $('div').gradient({from:'#000000', to:'#CCCCCC'} );
 *
 * @param Map options Settings/options to configure the gradient.
 * @option String from The CSS color to start the gradient with. Can be a CSS color ('#0faaee' or '#fff' or 'rgb(1,1,100)' or 'rgb(50%,40%,75%)) 
 *           or color name('aqua' or 'blue') or RGB array ([255,0,255]) or attribute of the element ('backgroundColor' or 'border-top-color')
 * 		By default the value is "backgroundColor".
 * @option String to The CSS color to end the gradient with.
 * 		By default the value is "#FFFFFF".
 * @option String direction This tells the gradient to be horizontal
 *      or vertical. By default the value is "horizontal". This is the direction of each stripe; the axis of the gradient is perpendicular to this.
 * @option Number|String length This is used to constrain the gradient to a
 *      particular width or height (depending on the direction). By default
 *      the length is set to '100%'. Anything that can be used in CSS, or a number of pixels, or a percent, can be used.
 * @option String position This tells the gradient to be positioned
 *      at the top, bottom, left and/or right within the element. The
 *      value is just a string that specifices top or bottom and left or right.
 *      By default the value is 'top left'.
 * @option Number|'fast' |'slow'|'normal' duration If > 0, the time in ms to animate the gradient formation
 * @option String easing The name of the easing function (in $.easing) to use for animation
 * @option Function complete The callback after the gradient is created (this is executed even if there is no animation). Scope ('this') is the element
 * @option Number opacity Opacity of the gradient
 * 
 * @example $('div').gradient('blue', 'white', 'horizontal')
 * @param String from The CSS color to start the gradient with.
 * 		By default the value is "#000000".
 * @param String to The CSS color to end the gradient with.
 * 		By default the value is "#FFFFFF".
 * @param String direction This tells the gradient to be horizontal
 *      or vertical. By default the value is "horizontal".
 *
 * @example $('div').gradient('remove') removes any gradients contained in the matched elements
 *
 * @name gradient
 * @type jQuery
 * @cat Plugins/gradient
 * @author Daniel Wachsstock (youngisrael-stl.org/wordpress/)
 */
$.fn.gradient = function(options) {
	if (options == 'remove') return this.each(ungradient);
	if (arguments.length > 0 && typeof options != 'object') options = {from: arguments[0], to: arguments[1], direction: arguments[2]};
	function createColorPath(startRGB, endRGB, distance) {
		var step = 1/Math.min (100, distance), colorPath = [];
		for (var frac = 1.0; frac > 0; frac -= step) colorPath.push(setColorHue(startRGB, frac, endRGB));
		return colorPath;
	}
	function setColorHue(startRGB, frac, endRGB) { // mix two colors
		return $.map(startRGB, function(n,i){ return n*frac + endRGB[i]*(1.0-frac)});
	}
	
	return this.each(function() {
		var $this = $(this);
		if ( $this.css('position') == 'static' ) $this.css('position', 'relative');
		var width = $this.innerWidth(), height = $this.innerHeight(), x = 0, y = 0, w = 1, h = 1, html = [],
				opts = 	$.extend({}, $.fn.gradient.defaults, $this.data('gradient'), options),
		    length = getPixelValue($this, opts.length, opts.direction == 'vertical' ? width : height),
		    position = (opts.position == 'bottom' ? 'bottom:0;' : 'top:0;') + (opts.position == 'right' ? 'right:0;' : 'left:0;');
		opts.from = getRGB(opts.from, this);
		opts.to = getRGB(opts.to, this);
		var colorArray = createColorPath(opts.from, opts.to, length);
		if (opts.direction == 'horizontal') {
			h = Math.round(length/colorArray.length) || 1;
			w = width;
		} else {
			w = Math.round(length/colorArray.length) || 1;
			h = height;
		}
			
		var wrapper = $('<div class="gradient" style="position: absolute; ' + position + ' width: ' + (opts.direction == 'vertical' ? length+"px" : "100%") +'; height: ' + 
			(opts.direction == 'vertical' ? "100%" : length+"px") + '; overflow: hidden; z-index: 0;">');
		for(var i=0; i<colorArray.length; i++) {
			html.push('<div style="position:absolute;z-index:1;top:' + y + 'px;left:' + x + 'px;height:' + 
				(opts.direction == 'vertical' ? "100%" : h+"px") + ';width:' + (opts.direction == 'vertical' ? w+"px" : "100%") + '"></div>');
			opts.direction == 'vertical' ? x+=w : y+=h;
			if ( y >= height || x >= width) break;
		}
		var gradient = $(html.join('')).appendTo(wrapper);
		
		if ($('.gradient-content', this).length == 0){ // avoid double wrapping things that already have gradients
			$this.wrapInner($('<div>').css({display: $this.css('display'), position: 'relative', zIndex: 2}).addClass('gradient-content'));
		}
		$('.gradient-content', this).before(wrapper);
			
		if (!opts.duration){	
			$.each(gradient, function(i) {$(this).css({'backgroundColor': getCSSColor(colorArray[i]), opacity: opts.opacity})});
			if (opts.complete) opts.complete.call(this);
		}else{
			// animate the gradient
			wrapper.animate({gradient: 1}, {
				step: function(now, fx){
					if (fx.state == 0){
						fx.start = now = colorArray.length*1.1; // 10% buffer for an opacity gradient to keep the edge from being too sharp
						fx.end = 0;
					}
					now = Math.round(now);
					$.each(gradient, function(i) { 
						var index = i+now;
						if (index < 0){
							$(this).css({backgroundColor: getCSSColor(opts.from), opacity: opts.opacity});
						}else if (index < colorArray.length){
							$(this).css({backgroundColor: getCSSColor(colorArray[index]), opacity: opts.opacity});
						}else if (index < fx.start){
							var opacity = Math.round(1000*opts.opacity*(fx.start-index)/fx.start)/100; // round to hundredths; exponentials confuse opacity
							$(this).css({backgroundColor: getCSSColor(opts.to), opacity: opacity}); 
						}else{
							$(this).css({backgroundColor: 'transparent', opacity: 0});
						}
					});
				},
				duration: opts.duration,
				easing: opts.easing,
				complete: opts.complete ? function(){ opts.complete.call($this[0]) } : undefined
			});
		}
	});
};
$.fn.gradient.defaults = {
	from: [0,0,0],
	to: 'backgroundColor',
	direction: 'horizontal',
	position: 'top',
	length: '100%',
	duration: 0,
	easing: 'linear',
	opacity: 1,
	complete: undefined
};

function getCSSColor(RGB){ return 'rgb('+Math.round(RGB[0])+','+Math.round(RGB[1])+','+Math.round(RGB[2])+')'};

// color code taken from jQuery UI effects

// Color Conversion functions from highlightFade
// By Blair Mitchelmore
// http://jquery.offput.ca/highlightFade/

// Parse strings looking for color tuples [255,255,255]
function getRGB(color,elem) {
		var result;

		// Check if we're already dealing with an array of colors
		if ( color && color.constructor == Array && color.length == 3 )
				return color;

		// Look for rgb(num,num,num)
		if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))
				return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];

		// Look for rgb(num%,num%,num%)
		if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color))
				return [parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55];

		// Look for #a0b1c2. The initial # is optional to be compatible with the original gradient
		if (result = /#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))
				return [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)];

		// Look for #fff
		if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color))
				return [parseInt(result[1]+result[1],16), parseInt(result[2]+result[2],16), parseInt(result[3]+result[3],16)];

		// Look for rgba(0, 0, 0, 0) == transparent in Safari 3
		if (result = /rgba\(0, 0, 0, 0\)/.exec(color))
				return $.fn.gradient.colors['transparent']

		// Look for a named color or an attribute
		return $.fn.gradient.colors[$.trim(color).toLowerCase()] || getColor(elem, $.trim(color));
}

function getColor(elem, attr) {
		var color;

		do {
				color = $(elem).css(attr);

				// Keep going until we find an element that has color, or we hit the body
				if ( color != '' && color != 'transparent' || jQuery.nodeName(elem, "body") )
						break;

				attr = "backgroundColor";
		} while ( elem = elem.parentNode );

		return getRGB(color);
};

// Some named colors to work with
// From Interface by Stefan Petre
// http://interface.eyecon.ro/

$.fn.gradient.colors = {
	aqua:[0,255,255],
	azure:[240,255,255],
	beige:[245,245,220],
	black:[0,0,0],
	blue:[0,0,255],
	brown:[165,42,42],
	cyan:[0,255,255],
	darkblue:[0,0,139],
	darkcyan:[0,139,139],
	darkgrey:[169,169,169],
	darkgreen:[0,100,0],
	darkkhaki:[189,183,107],
	darkmagenta:[139,0,139],
	darkolivegreen:[85,107,47],
	darkorange:[255,140,0],
	darkorchid:[153,50,204],
	darkred:[139,0,0],
	darksalmon:[233,150,122],
	darkviolet:[148,0,211],
	fuchsia:[255,0,255],
	gold:[255,215,0],
	green:[0,128,0],
	indigo:[75,0,130],
	khaki:[240,230,140],
	lightblue:[173,216,230],
	lightcyan:[224,255,255],
	lightgreen:[144,238,144],
	lightgrey:[211,211,211],
	lightpink:[255,182,193],
	lightyellow:[255,255,224],
	lime:[0,255,0],
	magenta:[255,0,255],
	maroon:[128,0,0],
	navy:[0,0,128],
	olive:[128,128,0],
	orange:[255,165,0],
	pink:[255,192,203],
	purple:[128,0,128],
	violet:[128,0,128],
	red:[255,0,0],
	silver:[192,192,192],
	white:[255,255,255],
	yellow:[255,255,0],
	transparent: [255,255,255]
};

function ungradient(){
	// gradient turns an <element> into <element><div class="gradient"/><div class="gradient-content"/></element>, so we pop the content back out.
	var $content = $('div.gradient-content', this);
	$content.parent().html($content.html());
}

// hack  to convert units into pixels
function getPixelValue($el, value, size) {
	if (!value || typeof value == 'number') return value;
	if (/^\d+(px)?$/i.test(value)) return parseInt(value);
	if (/^\d+(\.\d*)?%/.test(value)) return size*parseFloat(value)/100;
	var oldValue = $el.width();
	$el.width(value);
	var ret = $el.width();
	$el.width(oldValue);
	return ret;
};

})(jQuery);