if(typeof renjian == "undefined") var renjian = {};
renjian.util = {
	getTimelineName: {
		friendsTimeline: "动态",
		mentionsTimeline: "@我",
		publicTimeline: "串门",
		directMessage: "悄悄话",
		recommends: "推荐"
	},
	getTimeline: function(curType, extraObj){
		try{
			curType = curType || "friendsTimeline";
			extraObj = extraObj || {};
			if(!renjian.api[curType]) return false;
			renjian.trace("读取" + renjian.util.getTimelineName[curType]);
			renjian.trace("读取url:" + renjian.api[curType]);
			renjian.curType = curType;
			var oData = chrome.extension.getBackgroundPage().oDataControl[curType];
			var cacheData = oData.data;
			if(!extraObj.force && cacheData.length){
				oData.reload();
				renjian.util.checkUpdate();
				return false;
			}
			this.getStatus({count: renjian.pageSize}, function(arr, xhr ,status){
				arr = arr || [];
				oData.reload(arr, curType != renjian.curType);
				extraObj.callback && extraObj.callback();
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
			dataObj.trim_html = true;
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
		var curType = renjian.curType, oData = chrome.extension.getBackgroundPage().oDataControl[curType], arr = oData.data, postData = {count: renjian.pageSize};
		if(arr.length){
			postData.since_id = arr[0].id;
		}
		renjian.trace("更新检测");
		this.getStatus(postData, function(data, xhr){
			data = data || [];
			renjian.trace("更新检测完成，数据长度：" + data.length);
			if(data.length > 0){
				oData.unshift(data);
			}
		}, {
			//start: "更新检测",
			//end: "检测完成"
		});
	},
	more: function(){
		var curType = renjian.curType, oData = chrome.extension.getBackgroundPage().oDataControl[curType], 
		arr = oData.data, postData = {count: renjian.pageSize};
		if(arr && arr.length){
			postData.max_id = arr[arr.length - 1].id
		}
		this.getStatus(postData, function(data){
			data = data || [];
			if(data.length > 0){
				oData.push(data);
			}
		}, {
			start: "读取更多",
			end: "读取完成"
		});
	},
	likeStatus: function(obj){
		var isLike = $(this).hasClass("like"), sUrl, oData;
		if(isLike){
			sUrl = renjian.api.unlike;
		}else{
			sUrl = renjian.api.like;
		}
		$(this).toggleClass("like unlike");
		$.each(["friendsTimeline", "mentionsTimeline", "publicTimeline"], function(idx, sType){
			oData = chrome.extension.getBackgroundPage().oDataControl[sType];
			oData.modify(obj.id, {liked: !isLike});
		});
		$.post(sUrl, {id: obj.id}, function(){});
		return false;
	},
	replyStatus: function(obj){
		$("#controlPostArea").trigger("click", obj);
	},
	replyDmStatus: function(obj){
		var sTpl = $("#ztWinTpl").html(), ret = "";
		try{
			ret = chrome.extension.getBackgroundPage().TrimPath.parseTemplate(sTpl).process({
				title: "给" + obj.screenName + "发送悄悄话"
			}, {throwExceptions: true});
		}catch(e){renjian.trace("悄悄话模板解析出错:" + e);}
		if(!ret) return;
		var oWin = $(ret).hide();
		oWin.appendTo(document.body);
		$.mask();
		oWin.center().fadeIn(function(){
			oWin.find("textarea").focus();
		});
		oWin.find("textarea").keydown(this.keyHandler);
		$("#ztButton").click(this.dmHandler(obj, oWin));
		$("#ztWinClose").click(this.ztClose);		
	},
	keyHandler: function(e){
		if(e && (e.which == 13 && e.metaKey || e.altKey && e.which == 83)){
			$("#ztButton").click();
		}
	},
	dmHandler: function(obj, oWin){
		return function(e){
			var sText = oWin.find("textarea").val();
			$.ajax({
				url: renjian.api.dm,
				type: "POST",
				data: {user: obj.screenName, text: sText, source: "人间大炮"},
				success: function(){
					$("#loading").html("发送完成！").show().fadeOut(3000);
					renjian.util.checkUpdate();
				},
				error: function(xhr, status, e){
					$("#loading").html("出错了: " + xhr.status).show().fadeOut(3000);
				},
				complete: function(){
					$("#ztWinClose").click();
				}
			});
			return false;
		};	
	},
	ztStatus: function(obj){
		var sTpl = $("#ztWinTpl").html(), ret = "";
		try{
			ret = chrome.extension.getBackgroundPage().TrimPath.parseTemplate(sTpl).process({
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
		oWin.find("textarea").keydown(this.keyHandler);
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
				data: {id: obj.id, text: sText, source: "人间大炮"},
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
		$.post(renjian.api.destroy, {id: id});
		oItem.fadeOut(function(){
			oItem.remove();
		});	
        $.each(["friendsTimeline", "mentionsTimeline", "publicTimeline"], function(idx, sType){
        	chrome.extension.getBackgroundPage().oDataControl[sType].del(id);
        });
	},
	delDmStatus: function(obj){
		$(this).closest(".item").fadeOut(function(){
			$(this).remove();
		});
		$.post(renjian.api.dmDel, {id: obj.id});
		chrome.extension.getBackgroundPage().oDataControl["directMessage"].del(obj.id);
		return false;
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
	initEvent: function(o){
		o.find("a.needZoom").showPic();
		o.find(".avatar img").each(function(){
			this.onerror = chrome.extension.getBackgroundPage().imgOnerror;
		}).hover(carTipsOver, carTipsOut);
	}	
}
function carTipsOut(){
	window.hv = false;
}
function carTipsOver(){
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
			ret = chrome.extension.getBackgroundPage().TrimPath.parseTemplate($("#userInfoTpl").html()).process(oUserInfo, {throwExceptions: true})
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
}