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
			$("#loading").stop().css("opacity", 0.7).html("正在读取" +  renjian.util.getTimelineName[curType]).show();
			renjian.trace("读取url:" + renjian.api[curType]);
			renjian.curType = curType;
			if(renjian.xhr) try{renjian.xhr.abort();}catch(err){}
			var cacheData = Persistence.localStorage.getObject(curType);
			if(!force && cacheData && cacheData.length){
				renjian.util.createHtml(cacheData);
				renjian.util.checkUpdate();
				return false;
			}
			renjian.xhr = this.getStatus({count: renjian.pageSize}, function(arr){
				var curType = renjian.curType;
				arr = arr || [];
				Persistence.localStorage.setObject(curType, arr);
				renjian.trace("解析" + curType + ", 共" + arr.length + "条");
				renjian.util.createHtml(arr);
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
			$("#loading").html("读取完成").fadeOut(1500);
			$("#scrollArea").empty().html(ret.join(""));
			$("#scrollArea").find(".avatar img").each(function(){
				this.onerror = chrome.extension.getBackgroundPage().imgOnerror;
			});
		}else{
			//$("#scrollArea").html("还没有任何数据");
		}			
	},
	getStatus: function(dataObj, callback){
		return $.ajax({
				url: renjian.api[renjian.curType], 
				dataType: "json",
				data: dataObj,
				username: renjian.userName,
				password: renjian.password,
				success: function(arr){
						callback(arr);
				}
		});		
	},
	checkUpdate: function(){
		var curType = renjian.curType, arr = Persistence.localStorage.getObject(curType);
		if(!arr || !arr.length) return;
		var sinceId = arr[0].id;
		renjian.xhr = this.getStatus({since_id: sinceId}, function(data){
			data = data || [];
			if(data.length > 1){
				Array.prototype.unshift.apply(arr, data);
				//arr.length = renjian.pageSize;
				Persistence.localStorage.setObject(curType, arr);
				var serverTime  = new Date(xhr.getResponseHeader("Date")).valueOf();
				$("#" + curType + "List .time").each(function(){
					$(this).html(renjian.util.calRelTime($(this).attr("rel"), serverTime));
				});
				if(data.length < 5)
					$.each(data, function(idx, status){
						$(renjian.util.parseData(status)).hide().prependTo(ct).slideDown();
					});	
				else
					renjian.util.createHtml(arr);
			}
		});
	},
	parseData: function(status){
			var tplObj = {
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