if(typeof renjian == "undefined") var renjian = {};
renjian.userName = "pp";
renjian.password = "123456";
renjian.util = {
	getTimelineName: {
		friendsTimeline: "动态",
		mentionsTimeline: "@我",
		publicTimeline: "串门",
		directMessage: "悄悄话"
	},
	getTimeline: function(curType, extraObj){
		try{
			curType = curType || "friendsTimeline";
			extraObj = extraObj || {};
			if(!renjian.api[curType]) return false;
			renjian.trace("读取" + renjian.util.getTimelineName[curType]);
			renjian.trace("读取url:" + renjian.api[curType]);
			renjian.curType = curType;
			var cacheData = Persistence.localStorage.getObject(curType);
			if(!extraObj.force && cacheData && cacheData.length){
				renjian.util.createHtml(cacheData);
				renjian.util.checkUpdate();
				return false;
			}
			this.getStatus({count: renjian.pageSize}, function(arr, xhr ,status){
				arr = arr || [];
				if(arr.length) Persistence.localStorage.setObject(curType, arr);
				renjian.trace("解析" + curType + ", 共" + arr.length + "条");
				if(curType == renjian.curType)
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
		var arr =  cacheData || Persistence.localStorage.getObject(curType);
		var o = $("#scrollArea");
		if(arr && arr.length){
			var ret = ["<ul id='" + curType + "List'>"];
			ret.push($.map(arr, function(status, idx){
				return renjian.util.parseData(status);
			}).join(""));
			ret.push("</ul>");
			o.empty().html(ret.join(""));
			this.initEvent(o);
			if(arr.length >= renjian.pageSize)
				o.append('<a href="javascript:void(0)" onclick="renjian.util.more()" id="more">更多</a>');
			this.updateRelativeTime(o, curType);
		}else{
			o.empty().append("<ul id='" + curType + "List'><li id='nothing'>没有任何数据</li></ul>");
		}
	},
	getStatus: function(dataObj, callback, tipsObj){
		try{
			if(tipsObj && tipsObj.start){
				$("#loading").stop().css("opacity", 0.7).html(tipsObj.start).show();
			}
			if(renjian.xhr) try{renjian.xhr.abort();}catch(err){}
			renjian.trace("getStatus读取链接：" + renjian.api[renjian.curType]);
			renjian.xhr = $.ajax({
				beforeSend: function(){
					renjian.trace("开始读取，关闭background自动更新");
					var oBackground = chrome.extension.getBackgroundPage();
					if(oBackground.timerStart && oBackground.timer){
						oBackground.timerControl(false, "popup");
					}			
				},
				url: renjian.api[renjian.curType], 
				dataType: "json",
				data: dataObj,
				username: renjian.userName,
				password: renjian.password,
				cache: false,
				success: function(arr, status, xhr){
					if(tipsObj && tipsObj.end){
						if($("#loading").html() == tipsObj.start)
							$("#loading").stop().css("opacity", 0.7).html(tipsObj.end).fadeOut(1500);
					}
					try{callback(arr, xhr, status);}catch(e){$("#loading").stop().css("opacity", 0.7).html(e.message);}
				},
				complete: function(){
					renjian.trace("完成读取，开启background自动更新");
					var oBackground = chrome.extension.getBackgroundPage();
					if(!oBackground.timerStart){
						oBackground.timerControl(true, "popup");
					}			
				}
			});
		}catch(e){
			renjian.trace("getStatus出错：" + e.message);
		}
	},
	checkUpdate: function(){
		var curType = renjian.curType, arr = Persistence.localStorage.getObject(curType)||[];
		var sinceId = "";
		if(arr && arr.length) sinceId = arr[0].id;
		renjian.trace("更新检测");
		this.getStatus({since_id: sinceId}, function(data, xhr){
			data = data || [];
			renjian.trace("更新检测完成，数据长度：" + data.length);
			if(data.length > 0){
				Array.prototype.unshift.apply(arr, data);
				Persistence.localStorage.setObject(curType, arr);
				renjian.trace("更新显示新数据");
				renjian.util.updateRecentData(data, curType, xhr);
			}
		}, {
			start: "更新检测",
			end: "检测完成"
		});
	},
	updateHandler: function(data, curType, xhr){
		if(curType == renjian.curType){
			renjian.util.updateRecentData(data, curType, xhr);
		}else{
			switch(curType){
				case "friendsTimeline": 
					$("#fNum").html("(" + data.length + ")").show();
				break;
				case "mentionsTimeline":
					$("#mNum").html("(" + data.length + ")").show();
				break;
			}
		}	
	},
	more: function(){
		var curType = renjian.curType, arr = Persistence.localStorage.getObject(curType)||[];
		var maxId = "";
		if(arr && arr.length) maxId = arr[arr.length - 1].id;		
		this.getStatus({count: renjian.pageSize, max_id: maxId}, function(data){
			data = data || [];
			if(data.length > 0){
				arr = Persistence.localStorage.getObject(curType)||[];
				var len = arr.length;				
				Array.prototype.push.apply(arr, data);
				Persistence.localStorage.setObject(curType, arr);
				var ct = $("#" + curType + "List");
				if(!ct.length) return;
				var ret = $.map(data, function(status, idx){
					return renjian.util.parseData(status);
				});
				ct.append.apply(ct, ret);
				renjian.util.initEvent(ct.find(".item:gt(" + len + ")"));
				$("#more").remove();
				if(data.length == renjian.pageSize)
					ct.append('<a href="javascript:void(0)" onclick="renjian.util.more()" id="more">更多</a>');
				renjian.util.updateRelativeTime(ct, curType);
			}
		}, {
			start: "读取更多",
			end: "读取完成"
		});
	},
	updateRecentData: function(data, curType, xhr){
		try{
			var ct = $("#" + curType + "List");
			if(!ct.length) return;
			if($("#nothing").length) $("#nothing").remove();
			$.each(data, function(idx, status){
				var o = $(renjian.util.parseData(status)).hide().prependTo(ct);
				renjian.util.initEvent(o);
				o.slideDown();
			});
			var serverTime  = new Date(xhr.getResponseHeader("Date")).valueOf();
			ct.find(".time").each(function(){
				$(this).html(renjian.util.calRelTime($(this).attr("rel"), serverTime));
			});	
		}catch(e){
			renjian.trace("更新数据出错：" + e);
		}
		this.updateRelativeTime(ct, curType);
	},
	parseData: function(status){
			var tplObj = {}, sTpl = "";
			if(renjian.curType == "directMessage"){
				tplObj = {
					id: status.id,
					text: renjian.util.fixText(status.text, 200),
					time: status.created_at,
					avatar: status.sender.profile_image_url.replace(/120x120/, "48x48"),
					screenName: status.sender.screen_name,
					createdAt: renjian.util.paseTime(status.created_at),
					source: status.source					
				}
				sTpl = renjian.dmTpl;
			}else{
				tplObj = {
					id: status.id,
					text: renjian.util.fixText(status.text, 200),
					time: status.relative_date,
					screenName: status.user.screen_name,
					avatar: status.user.profile_image_url.replace(/120x120/, "48x48"),
					createdAt: renjian.util.paseTime(status.created_at),
					source: status.source
				};
				sTpl = renjian.statusTplText;
				if(status.status_type == "LINK"){
					tplObj.linkTitle = status.link_title;
					tplObj.linkUrl = status.original_url;
					sTpl = renjian.statusTplLink;
				}else if(status.status_type == "PICTURE"){
					tplObj.picture = status.thumbnail;
					tplObj.bigPicture = status.original_url;
					sTpl = renjian.statusTplPicture;
				}
			}
			return  renjian.util.template(sTpl, tplObj);	
	},
	initEvent: function(o){
		var xhr = null;
		o.find("a.needZoom").showPic();
		o.find(".avatar img").each(function(){
			this.onerror = chrome.extension.getBackgroundPage().imgOnerror;
		}).hover(function(){
			window.hv = true;
			var offset = $(this).offset(), iTop = offset.top + 10, iHeight = $("#userInfoLoading").outerHeight(true);
			if(iTop + iHeight > $(window).height()) iTop = $(window).height() -  iHeight - 10;
			var iLeft = offset.left + 50;
			var userInfo =$("#userInfo"), userLoading = $("#userInfoLoading");
			$("#userInfoLoadingCt").html("用户信息加载中...");
			userLoading.css({
				left: iLeft,
				top: iTop,
				zIndex: $.zIndex++
			}).fadeIn();
			if(userInfo.is(":visible")) userInfo.hide();
			xhr = $.get(renjian.api.user, {id: $(this).attr("rel")}, function(data){
				data = data || {};
				if($.isEmptyObject(data)){
					$("#userInfoLoadingCt").html("用户信息加载失败");
					return;
				}else{
					var tpl = '<div class="userPanel">\
									<div class="userPanelMg">\
										<b class="font14">@{screenName}<#if "@{name}".trim() && "@{name}".trim() != "@{screenName}"> - @{name}</#if></b>\
										<p>@{description}</p>\
										<#if "@{url}" != ""><p><a href="@{url}" target="_blank">@{url}</a></p></#if>\
										<p class="gray">关注人数：@{followingCount},&#160;&#160;被关注数: @{followersCount}</p>\
										<p>性别: @{gender},&#160;&#160;id：@{id},&#160;&#160;金币: <b class="red">@{score}</b></p>\
									</div>\
							   </div>\
							   <div class="userAvatar align_ct">\
							   		<a href="http://renjian.com/@{screenName}" target="_blank">\
							   			<img width="120" height="120" alt="@{screenName}" rel="@{screenName}" src="@{avatar}" />\
							   		</a>\
							   		<#if !@{isFollowing} && Persistence.userName().val() != "@{screenName}"><a class="focus focus_@{id}" onclick="renjian.util.focus.call(this, \'@{senderId}\')" href="javascript:void(0)">关注</a></#if>\
							   </div>';
					$("#userInfoCt").html(renjian.util.template(tpl, {
						screenName: data.screen_name,
						name: data.name,
						avatar: data.profile_image_url,
						description: data.description||"",
						followingCount: data.following_count,
						followersCount: data.followers_count,
						url: data.url||"",
						score: data.score,
						id: data.id,
						gender: data.gender == 0 ? "妖": data.gender == 1 ? "男" : "女",
						isFollowing: data.is_following ? true : false,
						senderId: data.id
					}));
				}
				userLoading.hide();
				var iHeight = userInfo.outerHeight(true);
				var iTop = offset.top + 10;
				if(iTop + iHeight > $(window).height()) iTop = $(window).height() -  iHeight - 10;
				userInfo.css({
					left: iLeft,
					top: iTop,
					width: $(window).width() - 130,
					zIndex: $.zIndex++					
				}).show();
			});
		}, function(e){
			window.hv = false;
			if($("#userInfoLoading").is(":visible"))$("#userInfoLoading").fadeOut();
			if(xhr) xhr.abort();
		});	
	},
	template: function(str, data){
		for(var _prop in data){
			str = str.replace(new RegExp("@{" + _prop + "}", "g"), data[_prop]);
		}
		var ifRe = /<#if\s+(.+?)>([\s\S]+?)<\/#if>/g;
		try{
			str = str.replace(ifRe, function(al, $1, $2){
				if(eval("(" + $1 + ")")){
					return $2;
				}else{
					return "";
				}
			});
		}catch(e){$("#loading").html(e.message);}
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
	replyStatus: function(obj){
		$("#controlPostArea").trigger("click", obj);
	},
	deleteStatus: function(id){
		var oItem = $(this).closest(".item"), curType = renjian.curType;
		$.post(renjian.api.destroy, {id: id}, function(data){});
		oItem.fadeOut(function(){
			oItem.remove();
		});	
		var arr = Persistence.localStorage.getObject(curType);
		for(var i = 0; i < arr.length; i++){
			if(arr[i].id == id){
				arr.splice(i, 1);
				Persistence.localStorage.setObject(curType, arr);
				break;
			}	
		}
	},
	focus: function(userId){
		$.ajax({
			url: renjian.api.follow,
			type: "POST",
			dataType: "json",
			data: {id: userId},
			username: renjian.userName,
			password: renjian.password,
			success: function(data, status, xhr){
				$("a.focus_" + userId).fadeOut();
			}
		});	
	},
	closeImg: function(){
		$("#showImg").fadeOut(function(){
			$.removeMask();
		});
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
	updateRelativeTime: function(oList, curType){
		try{
			if(!oList || !oList.length) return;
			var serverTime = null;
			var xhr = new XMLHttpRequest();
			xhr.open("HEAD", "http://renjian.com", true);
			curType = curType || renjian.curType;
			xhr.onload = function(){
				serverTime  = new Date(xhr.getResponseHeader("Date")).valueOf();
				oList.find(".time").each(function(){
					$(this).html(renjian.util.calRelTime($(this).attr("rel"), serverTime));
				});
				var arr = Persistence.localStorage.getObject(curType) || [];
				$.each(arr, function(idx, status){
					status.relative_date = renjian.util.calRelTime(renjian.util.paseTime(status.created_at), serverTime);
				});
				Persistence.localStorage.setObject(curType, arr);
			}
			xhr.send();
		}catch(e){
			renjian.trace("更新时间发生错误：" + e.message);
		}
	},
	MessageControl: function(){
		var listners = {};
		return {
			addEventListner: function(sType, listner){
				listners[sType] = listner;
			},
			dispatch: function(sType){
				var handler = listners[sType];
				if(handler) handler();
			}
		};
	}()	
}