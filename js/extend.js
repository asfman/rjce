$.zIndex = 998;
$.hasMask = false;
$.fn.extend({
  center: function(top, left, zIndex){
		      left = left ? left + $(window).scrollLeft() : $.center().left - this.outerWidth()/2;
			  top = top ? top + $(window).scrollTop() : $.center().top - this.outerHeight()/2;
			  zIndex = zIndex ? zIndex : (++$.zIndex);
		      $(this).css({position: "absolute", zIndex: zIndex, left: left, top: top});
			  return this;
  },
  vibrate: function(n, swing, speed, start, end){
	var a=['top','left'], b=0;
	n = n || 17, swing = swing || 2, speed = speed || 22;
	var offset = this.offset(), obj = this[0];
	var u=setInterval(function(){
		if(!b) start && start.call(obj);
		obj.style[a[b%2]]=((b)%4<2?offset[a[b++%2]]-swing:offset[a[b++%2]]+swing)+"px";
		if(b>n){clearInterval(u); obj.style['left']=offset.left+"px";obj.style['top']=offset.top+"px";end&&end.call(obj);}
	}, speed);
  },  
 drag: function(dragObj, limit, sFunc, mFunc, eFunc){
		return this.each(function(){
			var _this = this;
			if(dragObj === true)
				_this = this.parentNode;
			if(dragObj && dragObj.nodeType && dragObj.nodeType == 1)
				_this = dragObj;
			if($.browser.msie) {
				this.onselectstart = function(){return false};
				//if(_this.currentStyle.backgroundColor == "transparent") _this.style.background = "#fff";
			}
			if($.browser.mozilla) this.style.MozUserSelect = 'none';
			this.style.cursor = "move";
			$(this).mousedown(function(e){
				sFunc && sFunc.call(_this);
				var offset = $(_this).offset();
				var screenX = e.screenX, screenY = e.screenY, w = _this.offsetWidth, h = _this.offsetHeight;
				$(document).mousemove(function(e2){
					if($.browser.msie && e.which != 1 || e2.target.tagName == "INPUT"){
						if($.browser.mozilla) _this.style.MozUserSelect = '';
						if($.browser.msie) _this.onselectstart = function(){return true};
						$(document).unbind("mousemove mouseup mousedown"); 
						eFunc && eFunc.call(_this);
						return;
				    } 
					var curLeft = offset.left + e2.screenX - screenX, curTop = offset.top + e2.screenY - screenY;
					if(!limit) limit = {minX: -20000, maxX: 20000, minY: -20000, maxY : 20000};
					curLeft = curLeft < limit.minX ? limit.minX : ((curLeft + w) > limit.maxX ? (limit.maxX - w) : curLeft);
					curTop = curTop < limit.minY ? limit.minY : ((curTop + h) > limit.maxY ? (limit.maxY - h) : curTop);
					$(_this).css({position: "absolute", left: curLeft, top: curTop});
					if($.browser.msie && _this.tagName == "IMG") e2.preventDefault();
					mFunc && mFunc.call(_this);
				});
				$(document).mouseup(function(){
					$(document).unbind("mousemove mouseup mousedown");
					eFunc && eFunc.call(_this);
				});
				if(this.tagName == "IMG") e.preventDefault();
			});
		});
	 },
	 showPic: function(){
		 this.each(function(){
			 $(this).click(function(){
				 var oLoading = $("#loadingImg"), url = $(this).attr("href");
				 if(!oLoading.length)
					 oLoading = $("<img id='loadingImg' width='32' height='32' src='images/loading.gif' />").css({
						 position: "absolute",
						 left: "50%",
						 top: "50%",
						 marginLeft: -16,
						 marginTop: -16,
						 zIndex: ++$.zIndex
					 }).appendTo(document.body);
				 oLoading.attr("rel", url).show();
				 var oImg = new Image(), done = false;
				 oImg.onload = function(){
					 if(oLoading.attr("rel") != this.src) return;
					 oLoading.hide();
					 var oShow = $("#showImg"), w, h;
					 if(!done){
						 done = true;
						 w = this.width;
						 h = this.height;
						 if(!oShow.length){
							 oShow = $("<div/>", {
								 id: "showImg",
								 css: {
								 	 position: "absolute",
									 left: "50%",
									 top: "50%",
									 borderRadius: "8px",
									 background: "#fff",
									 padding: "2px 8px 8px",
									 border: "1px solid #fff",
								 	 display: "none",
								 	 minWidth: 200,
								 	 minHeight: 200
							 	}
							 }).appendTo(document.body);
						}
						oShow.empty();
						var limit = {w: $(window).width() - 36, h: $(window).height() - 48};
						var oldW = w, oldH = h, seeOrg = "";
						if(w > limit.w){
							h = parseInt(limit.w*h/w,10)||0;
							w = limit.w;
						}
						if(h > limit.h){
							w = parseInt(w*limit.h/h,10)||0;
							h = limit.h;
						}
						if(oldW != w || oldH != h) seeOrg = "<a target='_blank' href='" + url + "'>查看原图</a>";
						$("<div/>", {
							 height: 22,
							 lineHeight: 22,
							 textAlign: "center",
						}).html("<img alt='close' title='close' onclick='renjian.util.closeImg()' class='fr pointer' src='images/close.gif' />" + seeOrg).prependTo(oShow);						
						oImg.style.width = w + "px";
						oImg.style.height = h + "px";
						$.mask();
						$("#mask").click(renjian.util.closeImg);
						oShow.append(oImg).css({
							marginLeft: -oShow.outerWidth()/2,
							zIndex: ++$.zIndex,
							marginTop: -oShow.outerHeight()/2
						}).fadeIn();
					 }
				 }
				 oImg.src = url;
				 return false;
			 });
		 });
	 }
});
$.extend({
  center:  function(){ return {left: $(window).width()/2 + $(window).scrollLeft(), top: $(window).height()/2 + $(window).scrollTop()}},
  mask: function(color, opacity){
	$.hasMask = true;
	color = color ? color : "#000";
	opacity = opacity ? opacity : "0.3";
    width = $(document).width();
	height = $(document).height();
	$("<div/>").css({position: "absolute", left: 0, top: 0, zIndex: ++$.zIndex, filter: "alpha(opacity=" + opacity + ")", opacity: opacity, background: color, width: width, height:  height}).appendTo(document.body).attr("id", "mask").css("opacity", opacity);
	return this;
  },
  removeMask: function(){
	 $.hasMask = false;	  
	 $("#mask").remove();
	 return this;
  },
  queryString: function(name, target){
		if(!/^\w+$/.test(name)) return null;
		var url = target||location.href;
		var re = new RegExp("(?:\\?|\\&)" + name + "=([^&]*)","i");
		if(!re.test(url)) return null;
		return decodeURIComponent(re.exec(url)[1]);
   },// var str ="<b>@{name}</b>";	 $("#test").template(str, {name: 'test'});
  template: function(str, data){
		for(var _prop in data){
            str = str.replace(new RegExp("@{" + _prop + "}", "g"), data[_prop]);
		}
		return str.replace(/@{\w+?}/g, "");
  }
});