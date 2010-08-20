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
	getCurType: function(curType){
		var ret = renjian.api[curType];
		if(!ret) ret = null;
		return ret;
	},
	getTimeline: function(curType, extraObj){
		try{
			curType = curType || "friendsTimeline";
			extraObj = extraObj || {};
			if(!renjian.api[curType]) return false;
			renjian.trace("读取" + renjian.util.getTimelineName[curType]);
			renjian.trace("读取url:" + renjian.api[curType]);
			renjian.curType = curType;
			var oCache = chrome.extension.getBackgroundPage().CacheControl[curType];
			var cacheData = oCache.data;
			if(!extraObj.force && cacheData.length){
				oCache.reload();
				renjian.util.checkUpdate();
				$("#scrollArea").scrollTop(0);
				return false;
			}
			this.getStatus({count: renjian.pageSize}, function(arr, xhr ,status){
				arr = arr || [];
				if(arr.length){
					oCache.reload(arr, curType != renjian.curType);
				}
				renjian.trace("解析" + curType + ", 共" + arr.length + "条");
			}, {
				start: "正在读取" +  renjian.util.getTimelineName[curType],
				end: "读取完成"
			});
		}catch(e){
			renjian.trace("error:" + e.message);
		}
		return false;
	},
	getStatus: function(dataObj, callback, tipsObj){
		try{
			if(tipsObj && tipsObj.start){
				$("#loading").stop().css("opacity", 0.7).html(tipsObj.start).show();
			}
			if(renjian.xhr) try{renjian.xhr.abort();}catch(err){}
			renjian.trace("getStatus读取链接：" + renjian.api[renjian.curType]);
			renjian.xhr = $.ajax({
				beforeSend: function(xhr){
					renjian.beforeSend(xhr);
					window.reading = true;
					renjian.trace("开始读取，关闭background自动更新");
					var oBackground = chrome.extension.getBackgroundPage();
					renjian.trace(oBackground ? "getBackgroundPage()：检测自动更新是否开启-" + oBackground.timerStart + "-timer:" + oBackground.timer : "getBackgroundPage()读取失败");
					if(oBackground.timerStart && oBackground.timer){
						oBackground.timerControl(false, "popup");
					}
				},
				url: renjian.api[renjian.curType], 
				dataType: "json",
				data: dataObj,
				cache: false,
				success: function(arr, status, xhr){
					if(tipsObj && tipsObj.end){
						if($("#loading").html() == tipsObj.start)
							$("#loading").stop().css("opacity", 0.7).html(tipsObj.end).fadeOut(1500);
					}
					try{callback(arr, xhr, status);}catch(e){$("#loading").stop().css("opacity", 0.7).html(e.message);}
				},
				complete: function(xhr){
					window.reading = false;
					renjian.trace("完成读取，开启background自动更新");
					var oBackground = chrome.extension.getBackgroundPage();
					renjian.trace(oBackground ? "getBackgroundPage()：检测自动更新是否开启-" + oBackground.timerStart : "getBackgroundPage()读取失败");
					if(!oBackground.timerStart){
						oBackground.timerControl(true, "popup");
					}			
				}
			});
		}catch(e){
			renjian.trace("getStatus出错：" + e.message);
			window.reading = false;
		}
	},
	checkUpdate: function(){
		var curType = renjian.curType, oCache = chrome.extension.getBackgroundPage().CacheControl[curType], arr = oCache.data, postData = {};
		if(arr.length){
			postData.since_id = arr[0].id;
		}
		renjian.trace("更新检测");
		this.getStatus(postData, function(data, xhr){
			data = data || [];
			renjian.trace("更新检测完成，数据长度：" + data.length);
			if(data.length > 0){
				oCache.unshift(data);
			}
		}, {
			start: "更新检测",
			end: "检测完成"
		});
	},
	more: function(){
		var curType = renjian.curType, oCache = chrome.extension.getBackgroundPage().CacheControl[curType], arr = oCache.data, postData = {count: renjian.pageSize};
		if(arr && arr.length){
			postData.max_id = arr[arr.length - 1].id
		}
		this.getStatus(postData, function(data){
			data = data || [];
			if(data.length > 0){
				oCache.push(data);
			}
		}, {
			start: "读取更多",
			end: "读取完成"
		});
	},
	parseData: function(status){
			var sTpl = "", oUserInfo = {};
			if(renjian.curType == "directMessage"){
				sTpl = $("#dmTpl").html();
				$.extend(oUserInfo, status.sender);
				status.sender.profile_image_url = status.sender.profile_image_url.replace(/120x120/, "48x48");
			}else{
				if(status.attachment){
					switch(status.attachment.type.toUpperCase()){
						case "LINK":
							sTpl = $("#statusTplLink").html();
						break;
						case "PICTURE":
							sTpl = $("#statusTplPicture").html();
						break;
					}
				}else{//text type
					if(status.forwarded_status){
						sTpl = $("#statusTplZt").html();
					}else
						sTpl = $("#statusTplText").html();
				}
				$.extend(oUserInfo, status.user);
				status.user.profile_image_url = status.user.profile_image_url.replace(/120x120/, "48x48");
			}
			status.userInfo = encodeURIComponent(JSON.stringify(oUserInfo));
			status.created_at = this.paseTime(status.created_at);
			var ret = "";
			try{
				ret = TrimPath.parseTemplate(sTpl).process(status, {throwExceptions: true});
			}catch(e){renjian.trace(renjian.curType + "模板解析出错:" + e);}	
			return ret;	
	},
	initEvent: function(o){
		o.find("a.needZoom").showPic();
		o.find(".avatar img").each(function(){
			this.onerror = chrome.extension.getBackgroundPage().imgOnerror;
		}).hover(function(){
			var _this = this;
			window.hv = true;
			if(window.hoverTimer) clearTimeout(window.hoverTimer);
			window.hoverTimer = setTimeout(function(){
				if(!window.hv) return;
				var offset = $(_this).offset(), iTop = offset.top + 10, iLeft = offset.left + 50;
				var userInfo =$("#userInfo");
				if(userInfo.is(":visible")) userInfo.hide();
				var oUserInfo = JSON.parse(decodeURIComponent($(_this).attr("rel"))), ret = "";
				try{
					ret = TrimPath.parseTemplate($("#userInfoTpl").html()).process(oUserInfo, {throwExceptions: true})
				}catch(e){renjian.trace("userInfoTpl模板解析出错:" + e);}
				if(!ret) return;
				$("#userInfoCt").html(ret);
				var iHeight = userInfo.outerHeight(true);
				if(iTop + iHeight > $(window).height()) iTop = $(window).height() -  iHeight - 10;
				userInfo.css({
					left: iLeft,
					top: iTop,
					width: $(window).width() - 130,
					zIndex: $.zIndex++					
				}).fadeIn();
			}, 500);
		}, function(e){
			window.hv = false;
		});	
	},
	replyStatus: function(obj){
		$("#controlPostArea").trigger("click", obj);
	},
	ztStatus: function(obj){
		var sTpl = $("#ztWinTpl").html(), ret = "";
		try{
			ret = TrimPath.parseTemplate(sTpl).process({
				title: "转发" + obj.screenName + "的内容"
			}, {throwExceptions: true});
		}catch(e){renjian.trace("转发模板解析出错:" + e);}
		if(!ret) return;
		var oWin = $(ret).hide();
		oWin.appendTo(document.body);
		$.mask();
		oWin.center().fadeIn(function(){
			oWin.find("textarea").focus();
		});
		$("#ztButton").click(this.ztHandler(obj, oWin));
		$("#ztWinClose").click(this.ztClose);
	},
	ztClose: function(){
		$("#ztWin").fadeOut(function(){
			$(this).remove();
			$.removeMask()
		});
		return false;
	},
	ztHandler: function(obj, oWin){
		return function(e){
			var sText = oWin.find("textarea").val();
			$.ajax({
				url: renjian.api.zt,
				type: "POST",
				data: {id: obj.id, text: sText},
				success: function(){
					$("#loading").html("转发成功！").show().fadeOut(3000);
					renjian.util.checkUpdate();
				},
				error: function(xhr, status, e){
					$("#loading").html("转发错误了: " + xhr.status).show().fadeOut(3000);
				},
				complete: function(){
					$("#ztWinClose").click();
				}
			});
			return false;
		};
	},
	deleteStatus: function(id){
		var oItem = $(this).closest(".item"), curType = renjian.curType;
		$.post(renjian.api.destroy, {id: id}, function(data){});
		oItem.fadeOut(function(){
			oItem.remove();
		});	
		var arr = Persistence.localStorage.getObject(curType) || [];
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
			complete: function(xhr){
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
	htmlManip: function(oEvent){
		if(oEvent.manipType != "reload"){
			var ct = $("#" + oEvent.type + "List");
			if(ct.length){
				switch(oEvent.manipType){
					case "unshift": 
						void function(){
							if($("#nothing").length) $("#nothing").remove();
							$.each(oEvent.data, function(idx, status){
								var o = $(renjian.util.parseData(status)).hide().prependTo(ct);
								renjian.util.initEvent(o);
								o.slideDown();
							});
						}();
					break;	
					case "push":
						void function(){
							var lastItem = ct.find(".item:last");
							var ret = $.map(oEvent.data, function(status, idx){
								return renjian.util.parseData(status);
							});
							ct.append.apply(ct, ret);
							renjian.util.initEvent(lastItem.nextAll());
							$("#more").remove();
							if(data.length == renjian.pageSize)
								ct.append('<a href="javascript:void(0)" onclick="renjian.util.more()" id="more">更多</a>');	
						}();
					break;
					case "delete":
						
					break;
				}
				renjian.util.updateRelativeTime(ct, oEvent.type);
			}
		}else{
			var o = $("#scrollArea"), arr = oEvent.data;
			if(arr && arr.length){
				var ret = ["<ul id='" + oEvent.type + "List'>"];
				ret.push($.map(oEvent.data, function(status, idx){
					return renjian.util.parseData(status);
				}).join(""));
				ret.push("</ul>");
				o.empty().html(ret.join(""));
				renjian.util.initEvent(o);
				if(arr.length >= renjian.pageSize)
					o.append('<a href="javascript:void(0)" onclick="renjian.util.more()" id="more">更多</a>');
			}else{
				o.empty().append("<ul id='" + oEvent.type + "List'><li id='nothing'>没有任何数据</li></ul>");
			}			
		}	
		if(oEvent.type != renjian.curType){
			var num = parseInt(Persistence.localStorage.getItem("badget_" + curType),10)||0;
			if(num > 0){
				switch(curType){
					case "friendsTimeline": 
						$("#fNum").html("(" + num + ")").show();
					break;
					case "mentionsTimeline":
						$("#mNum").html("(" + num + ")").show();
					break;
				}
			}	
		}
	}	
}