$.fn.extend({
	  center: function(top, left, zIndex){
		      left = left ? left + $(window).scrollLeft() : $.center().left - this.outerWidth()/2;
			  top = top ? top + $(window).scrollTop() : $.center().top - this.outerHeight()/2;
			  zIndex = zIndex ? zIndex : (++$.zIndex);
		      $(this).css({position: "absolute", zIndex: zIndex, left: left, top: top});
			  return this;
	  }
  });