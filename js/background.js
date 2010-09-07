var viewName="background", extensionClicked = true, timerStart = false, timer = 0, oDataControl = {}, updateControl = {};
$(document).ready(function(){
	/*自动更新保护程序*/
	setInterval(function(){
		if(!Persistence.userName.val()) return;
		var oPopup = getView("popup");
		if(!oPopup){
			if(!timerStart){
				renjian.trace("自动更新保护程序强制开启自动更新");
				timerControl(true, "guard");
			}
		}else{
			renjian.trace("popup存在，自动更新保护程序执行");
			if(!oPopup.reading && !timerStart){
				renjian.trace("background保护自动更新开启");
				timerControl(true, "guard");
			}else if(timerStart){
				renjian.trace("保护程序检测到自动更新已在运行");
			}
		}
	}, 25000);	
});
void function init(){
	for(var i = 0, l = renjian.typeList.length; i < l ; i++){
		var key = renjian.typeList[i];
		//only the first initilization needs read cache
		oDataControl[key] = new DataControl(key, localStorage.getObject(key)||[]);
		MessageControl.addEventListner(key, htmlManip);
	}
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
		if(request.layerTips != undefined) Persistence.layerTips.save(request.layerTips);
	});
	if(!Persistence.userName.val()) return;
	renjian.userName = Persistence.userName.val();
	renjian.password = Persistence.password.val();
	Persistence.layerTips.save(0);
	timerControl(true, "init");	
}();
function imgOnerror(){
	this.src = "http://renjian.com/images/buddy_icon/48x48.jpg";
}
function timerControl(b, actionFrom){
	var actionFrom = actionFrom ? actionFrom : "background";
	if(timer) clearInterval(timer);
	if(b){
		renjian.trace("自动更新开启-from " + actionFrom);
		timerStart = true;
		if(actionFrom == "guard" || actionFrom == "init") setTimeout(updateHandler, 888);
		timer = setInterval(updateHandler, renjian.interval);
	}else{
		renjian.trace("自动更新关闭-from" + actionFrom);
		timerStart = false;
		$.each(renjian.timer, function(curType, val){
			if(val) clearTimeout(val);
		});
	}
}
function updateHandler(){
	try{
		if(!Persistence.userName.val()) return;
		var delayTime = 0, delayInterval = 5000;
		$.each(renjian.typeList, function(idx, curType){
			var oData = oDataControl[curType], postData = {count: renjian.pageSize}, activeType = "friendsTimeline",
			len = oData.data.length, sync = !!updateControl[curType], innerDebugTime, oPopup = getView("popup");
			if(len){
				postData.since_id = oData.data[0].id;
			}
			delayTime += delayInterval;
			if(oPopup && oPopup.renjian.curType != activeType) activeType = oPopup.renjian.curType;
			if(activeType == curType){
				innerDebugTime = 16;
				delayTime -= delayInterval;
			}
			innerDebugTime = delayTime;
			renjian.trace("delay time: " + innerDebugTime + ", updateControl['"+ curType + "']: " + sync);
			if(!sync){
				renjian.timer[curType] = setTimeout(function(){
					renjian.trace(innerDebugTime + "----------------------------------------------------");
					renjian.trace("ajaxstart: update api url = " + renjian.api[curType]);
					renjian.trace("ajaxstart: postData = " + JSON.stringify(postData));					
					$.ajax({
						url: renjian.api[curType], 
						dataType: "json",
						data: postData,
						cache: false,
						beforeSend: function(xhr){
							updateControl[curType] = true;
							xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(Persistence.userName.val() + ":" + Persistence.password.val()));
						},
						success: function(data, status, xhr){
							if(!timerStart || len != oData.data.length || !$.isArray(data)) return;
							renjian.trace("ajaxsuccess: url = " + this.url);
							renjian.trace("ajaxsuccess: data.length = " + data.length + ', postData = ' + JSON.stringify(postData));
							console.log("url: %s, data.length = %d", this.url, data.length);
							if(data.length == 40){
								renjian.trace(this.url, "error");
								return;
							}	
							data = data || [];
							var winPopup = getView("popup");
							var oTips = JSON.parse(Persistence.tips.val())||{};
							if(oTips[curType] && data.length && postData.since_id &&
							!(winPopup && winPopup.renjian.curType == curType)){
								var num = localStorage.getItem("badget_" + curType);
								if(num){
									num = (parseInt(num, 10)||0) + data.length;
								}else{
									num = data.length;
								}
								localStorage.setItem("badget_" + curType, num);
							}
							if(winPopup){
								oData.unshift(data);
							}else{
								oData.unshift(data, true);
								if(curType != "publicTimeline" && len){
									showTipsText();
								}	
							}
						},
						complete: function(){
							updateControl[curType] = false;
							renjian.timer[curType] = 0;
							renjian.trace("ajaxComplete: " + curType + "更新完成!");
						}
					});	
				}, innerDebugTime);
			}
		});
	}catch(e){
		renjian.trace("自动更新出错：" + e.message, "error");
		$.each(renjian.typeList, function(idx, curType){
			updateControl[curType] = false;
			renjian.timer[curType] = 0;			
		});
	}
}
function showTipsText(){
	try{
		var total = 0, tips = Persistence.userName.val() + " - 人间大炮\r\n";
		var index = 0, oTips = JSON.parse(Persistence.tips.val())||{};
		$.each(oTips, function(key, val){
			if(index % 2 == 1) tips +=", " + val + ": " + (localStorage.getItem("badget_" + key)|0) + " \r\n";
			else tips += val + ": " + (localStorage.getItem("badget_" + key)|0);
			total += (localStorage.getItem("badget_" + key)|0);			
			index++;
		});		
		if(total == 0){
			chrome.browserAction.setBadgeText({text: ""});
			chrome.browserAction.setTitle({title: ""});
			return;
		}
		if(total > 99) total = "99+";
		chrome.browserAction.setBadgeText({text: total.toString()});
		var colorHash = {red: [255, 0, 0, 255], green: [80, 179, 81, 255], blue: [75, 108, 166, 255]};
		var mmCount = localStorage.getItem("badget_mentionsTimeline") || 0;
		var dmCount = localStorage.getItem("badget_directMessage") || 0;
		var bkColor = colorHash.red;
		if(mmCount > 0) bkColor = colorHash.green;
		if(dmCount > 0) bkColor = colorHash.blue;
		chrome.browserAction.setBadgeBackgroundColor({color: bkColor});
		chrome.browserAction.setTitle({title: tips});
	}catch(e){
		renjian.trace("showTipsText出错：" + e.message, "error");		
	}
}
function parseData(status){
		var winPopup = getView("popup");
		if(!winPopup) return "";
		var $ = winPopup.$;
		renjian.trace = winPopup.renjian.trace;
		var sTpl = "", oUserInfo = {};
		if(winPopup.renjian.curType == "directMessage"){
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
				}else if(status.replyed_status){
					sTpl = $("#statusTplReply").html();
				}else
					sTpl = $("#statusTplText").html();
			}
			$.extend(oUserInfo, status.user);
			status.user.profile_image_url = status.user.profile_image_url.replace(/120x120/, "48x48");
		}
		status.userInfo = encodeURIComponent(JSON.stringify(oUserInfo));
		status.created_at = parseTime(status.created_at);
		var ret = "";
		try{
			ret = TrimPath.parseTemplate(sTpl).process(status, {throwExceptions: true});
		}catch(e){renjian.trace(renjian.curType + "模板解析出错:" + e, "error");}	
		return ret;	
}
function htmlManip(oEvent){
	var winPopup = getView("popup");
	if(!winPopup) return;
	var $ = winPopup.$;
	renjian.trace = winPopup.renjian.trace;
	renjian.trace("html操作开始：oEvent.type-" + oEvent.type + ",oEvent.manipType-" + oEvent.manipType);
	try{
		if(oEvent.manipType != "reload"){
			var ct = $("#" + oEvent.type + "List");
			if(ct.length){
				switch(oEvent.manipType){
					case "unshift": 
						void function(){
							if($("#nothing").length) $("#nothing").remove();
							if(oEvent.data.length < 5)
								$.each(oEvent.data, function(idx, status){
									var o = $(parseData(status)).hide().prependTo(ct);
									winPopup.renjian.util.initEvent(o);
									o.slideDown();
								});
							else{
								var firstItem = ct.find(".item:first");
								var retStr = $.map(oEvent.data, function(status, idx){
									return parseData(status);
								});
								ct.prepend.apply(ct, retStr);
								winPopup.renjian.util.initEvent(firstItem.prevAll());							
							}
							/*
							if(ct.find(".item").length > renjian.pageSize){
								ct.find(".item:nth(" + (renjian.pageSize-1) + ")").nextAll().remove();
							}*/
						}();
					break;	
					case "push":
						void function(){
							var lastItem = ct.find(".item:last");
							var ret = $.map(oEvent.data, function(status, idx){
								return parseData(status);
							});
							ct.append.apply(ct, ret);
							winPopup.renjian.util.initEvent(lastItem.nextAll());
							$("#more").remove();
							if(oEvent.data.length == renjian.pageSize)
								ct.append('<a href="javascript:void(0)" onclick="renjian.util.more()" id="more">更多</a>');	
						}();
					break;
				}
			}
		}else{
			var o = $("#scrollArea"), arr = oEvent.data;
			if(arr && arr.length){
				var ret = ["<ul id='" + oEvent.type + "List'>"];
				ret.push($.map(oEvent.data, function(status, idx){
					return parseData(status);
				}).join(""));
				ret.push("</ul>");
				o.empty().html(ret.join(""));
				winPopup.renjian.util.initEvent(o);
				if(arr.length >= renjian.pageSize)
					o.append('<a href="javascript:void(0)" onclick="renjian.util.more()" id="more">更多</a>');
			}else{
				o.empty().append("<ul id='" + oEvent.type + "List'><li id='nothing' class='gray align_ct mt'>还没有任何数据</li></ul>");
			}
			o.scrollTop(0);	
		}
		renjian.trace("更新相对时间");
		updateRelativeTime($("#" + oEvent.type + "List"), oEvent.type);
		if(oEvent.type != winPopup.renjian.curType){
			var num = parseInt(localStorage.getItem("badget_" + oEvent.type),10)||0;
			if(num > 0){
				$("#" + val + "Tab b").html(num).show();
			}	
		}
	}catch(e){
		renjian.trace("dom操作出错：" + e.message, "error");
	}
	renjian.trace("html操作结束：" + oEvent.type);	
}
function updateRelativeTime(oList, curType){
	var winPopup = getView("popup");
	if(!winPopup) return;
	var $ = winPopup.$;
	try{
		if(!oList || !oList.length) return;
		var serverTime = null, oData = oDataControl[curType];
		var xhr = new XMLHttpRequest();
		xhr.open("HEAD", "http://renjian.com", true);
		curType = curType || renjian.curType;
		xhr.onload = function(){
			serverTime  = new Date(xhr.getResponseHeader("Date")).valueOf();
			oList.find(".time").each(function(){
				$(this).html(calRelTime($(this).attr("rel"), serverTime));
			});
			oData.updateRelativeTime(serverTime);
		}
		xhr.send();
	}catch(e){
		renjian.trace("更新时间发生错误：" + e.message, "error");
	}
}