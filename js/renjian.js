if(typeof renjian == "undefined") var renjian = {};
renjian.userName = "pp";
renjian.password = "123456";
renjian.util = {
	getTimelineName: {
		friendsTimeline: "动态",
		mentionsTimeline: "@我",
		publicTimeline: "串门"
	},
	getTimeline: function(curType, force){
		try{
			curType = curType || "friendsTimeline";
			if(!renjian.api[curType]) return false;
			renjian.trace("读取" + renjian.util.getTimelineName[curType]);
			renjian.trace("读取url:" + renjian.api[curType]);
			renjian.curType = curType;
			var cacheData = Persistence.localStorage.getObject(curType);
			if(!force && cacheData && cacheData.length){
				renjian.util.createHtml(cacheData);
				renjian.util.checkUpdate();
				return false;
			}
			this.getStatus({count: renjian.pageSize}, function(arr){
				var curType = renjian.curType;
				arr = arr || [];
				Persistence.localStorage.setObject(curType, arr);
				renjian.trace("解析" + curType + ", 共" + arr.length + "条");
				renjian.util.createHtml(arr);
			}, {
				start: "正在读取" +  renjian.util.getTimelineName[curType],
				end: "读取完成"
			});
		}catch(e){
			alert(e);
			renjian.trace("error:" + e.message);
		}
		return false;
	},
	createHtml: function(cacheData){
	    var curType = renjian.curType;
		var arr =  cacheData || Persistence.localStorage.getObject(curType), len = arr.length;
		if(arr && len){
			var ret = ["<ul id='" + curType + "List'>"];
			ret.push($.map(arr, function(status, idx){
				return renjian.util.parseData(status);
			}).join(""));
			ret.push("</ul>");
			var o = $("#scrollArea");
			o.empty().html(ret.join(""));
			o.find(".avatar img").each(function(){
				this.onerror = chrome.extension.getBackgroundPage().imgOnerror;
			});
			o.append('<a href="javascript:void(0)" onclick="renjian.util.more()" id="more">更多</a>');
		}		
	},
	getStatus: function(dataObj, callback, tipsObj){
		if(tipsObj && tipsObj.start){
			$("#loading").stop().css("opacity", 0.7).html(tipsObj.start).show();
		}
		if(renjian.xhr) try{renjian.xhr.abort();}catch(err){}
		renjian.xhr = $.ajax({
			url: renjian.api[renjian.curType], 
			dataType: "json",
			data: dataObj,
			username: renjian.userName,
			password: renjian.password,
			success: function(arr, status, xhr){
				if(tipsObj && tipsObj.end){
					$("#loading").stop().css("opacity", 0.7).html(tipsObj.end).fadeOut(1500);
				}
				try{callback(arr, xhr);}catch(e){$("#loading").stop().css("opacity", 0.7).html(e.message);}
			}
		});		
	},
	checkUpdate: function(){
		var curType = renjian.curType, arr = Persistence.localStorage.getObject(curType);
		var sinceId = "";
		if(arr && arr.length) sinceId = arr[0].id;
		this.getStatus({since_id: sinceId}, function(data, xhr){
			data = data || [];
			if(data.length > 1){
				Array.prototype.unshift.apply(arr, data);
				Persistence.localStorage.setObject(curType, arr);
				var ct = $("#" + curType + "List");
				$.each(data, function(idx, status){
					$(renjian.util.parseData(status)).hide().prependTo(ct).slideDown();
				});
				var serverTime  = new Date(xhr.getResponseHeader("Date")).valueOf();
				ct.find(".time").each(function(){
					$(this).html(renjian.util.calRelTime($(this).attr("rel"), serverTime));
				});
			}
		}, {
			start: "更新检测",
			end: "检测完成"
		});
	},
	more: function(){
		var curType = renjian.curType, arr = Persistence.localStorage.getObject(curType);
		var maxId = "";
		if(arr && arr.length) maxId = arr[arr.length - 1].id;		
		this.getStatus({count: renjian.pageSize, max_id: maxId}, function(data){
			data = data || [];
			if(data.length > 0){
				Array.prototype.push.apply(arr, data);
				Persistence.localStorage.setObject(curType, arr);
				var ct = $("#" + curType + "List");
				var ret = $.map(data, function(status, idx){
					return renjian.util.parseData(status);
				});
				ct.append.apply(ct, ret);
				$("#more").remove();
				ct.append('<a href="javascript:void(0)" onclick="renjian.util.more()" id="more">更多</a>');
			}
		}, {
			start: "读取更多",
			end: "读取完成"
		});
	},
	parseData: function(status){
			var tplObj = {
				id: status.id,
				text: renjian.util.fixText(status.text, 140),
				time: status.relative_date,
				screenName: status.user.screen_name,
				avatar: status.user.profile_image_url.replace(/120x120/, "48x48"),
				createdAt: renjian.util.paseTime(status.created_at)
			};
			var sTpl = renjian.statusTplText;
			if(status.status_type == "LINK"){
				tplObj.linkTitle = status.link_title;
				tplObj.linkUrl = status.original_url;
				sTpl = renjian.statusTplLink;
			}else if(status.status_type == "PICTURE"){
				tplObj.picture = status.thumbnail;
				sTpl = renjian.statusTplPicture;
			}
			return  renjian.util.template(sTpl, tplObj);	
	},
	clearTimer: function (){
		$.each(renjian.timer, function(key, val){
			if(val) clearInterval(val);
		});
	},
	template: function(str, data){
		for(var _prop in data){
			str = str.replace(new RegExp("@{" + _prop + "}", "g"), data[_prop]);
		}
		return str.replace(/@{\w+?}/g, "");
	},
	fixText: function(source, length){
		if(charCount(source) > length)
		{
			while(charCount(source) > length - 3)
			{
				source = source.slice(0, -1);
			}
			while(charCount(source) < length) source += ".";
		}
		function charCount(text)
		{
		   return text.replace(/[^\x00-\xff]/g,"11").length;
		}
		return source;
	},
	calRelTime: function(sTime, eTime){
		if(!sTime||!eTime) return false;
		var interval = eTime - sTime;
		var subDate = Math.floor(interval/(60 * 60 * 24 * 1000));
		if (interval < 0) interval = 0;
		var second = Math.floor(interval / 1000);
		if (second < 60) return (second?second:1)  + "秒前";
		else if (second < 60 * 60) return Math.floor(second / 60) + "分钟前";
		else if (second < 60 * 60 * 24) return Math.floor(second / 60 / 60) + "小时前";
		else if (second < 60 * 60 * 24 * 2 && subDate == 1) return "昨天";
		else if (second < 60 * 60 * 24 * 3 && subDate == 2) return "前天";
		else if (second < 60 * 60 * 24 * 30) return subDate + "天前";
		else if (second < 60 * 60 * 24 * 365) return Math.floor(second / (60 * 60 * 24 * 30)) + "月前";
		else if (second < 60 * 60 * 24 * 365 * 2) return "去年";
		else if (second < 60 * 60 * 24 * 365 * 3) return "前年";
		else return Math.floor(second / 60 / 60 / 24 / 365) + "年前";	
	},
	paseTime: function(s){
		//2010-07-09 15:22:42 +0800
		var arr = s.split(/\s+/);
		var ymd = arr[0].split("-"), hms = arr[1].split(":");
		return new Date(ymd[0], parseInt(ymd[1],10) - 1, ymd[2], hms[0], hms[1], hms[2]).valueOf();
	},
	getServerTime: function(){
		var serverTime = null;
		var xhr = new XMLHttpRequest();
		xhr.open("HEAD", "http://renjian.com", false);
		xhr.onload = function(){
			serverTime  = new Date(xhr.getResponseHeader("Date")).valueOf();
		}
		xhr.send();
		return serverTime;
	}
};