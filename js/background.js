var viewName="background", extensionClicked = true, timerStart = false, timer = 0, oDataControl = {}, updateControl = {};
$(document).ready(function(){
	/*自动更新保护程序*/
	setInterval(function(){
		if(!Persistence.userName().val()) return;
		var oPopup = getView("popup");
		if(!oPopup){
			if(!timerStart){
				renjian.trace("自动更新保护程序强制开启自动更新");
				timerControl(true, "guard");
			}
		}else{
			oPopup.renjian.trace("popup存在，自动更新保护程序执行");
			if(!oPopup.reading && !timerStart){
				oPopup.renjian.trace("background保护自动更新开启");
				timerControl(true, "guard");
			}else if(timerStart){
				oPopup.renjian.trace("保护程序检测到自动更新已在运行");
			}
		}
	}, renjian.interval);	
});
void function init(){
	for(var i = 0, l = renjian.typeList.length; i < l ; i++){
		var key = renjian.typeList[i];
		//only the first initilization needs read cache
		oDataControl[key] = new DataControl(key, localStorage.getObject(key)||[]);
	}
	MessageControl.addEventListner("friendsTimeline", htmlManip);
	MessageControl.addEventListner("mentionsTimeline", htmlManip);
	MessageControl.addEventListner("publicTimeline", htmlManip);
	MessageControl.addEventListner("directMessage", htmlManip);
	if(!Persistence.userName().val()) return;
	timerControl(true);	
}();
function imgOnerror(){
	this.src = "http://renjian.com/images/buddy_icon/48x48.jpg";
}
function timerControl(b, actionFrom){
	var oPopup = getView("popup"), actionFrom = actionFrom ? actionFrom : "background";
	if(timer) clearInterval(timer);
	if(b){
		if(oPopup) oPopup.renjian.trace("自动更新开启-from" + actionFrom);
		timerStart = true;
		if(actionFrom == "guard") updateHandler();
		timer = setInterval(updateHandler, renjian.interval);
	}else{
		if(oPopup) oPopup.renjian.trace("自动更新关闭-from" + actionFrom);
		timerStart = false;
		$.each(renjian.timer, function(curType, val){
			if(val) clearTimeout(val);
		});
	}
}
function updateHandler(){
	try{
		if(!Persistence.userName().val()) return;
		var oPopup = getView("popup");
		if(oPopup){
			oPopup.renjian.trace("background更新检测updateHandler开始执行");	
			if(!window.startTime) window.startTime = new Date().getTime();
			else{
				oPopup.renjian.trace("执行相隔时间：" + (new Date().getTime() - window.startTime));
				window.startTime = new Date().getTime();
			}		
		}
		var delayTime = 0, delayM = 3000;
		$.each(renjian.typeList, function(idx, curType){
			var oData = oDataControl[curType], arr = oData.data, sinceId = "", postData = {count: renjian.pageSize}, len = arr.length;
			if(len){
				postData.since_id = arr[0].id;
				if(!postData.since_id){
					renjian.trace("postData.since_id取不到值", "error");
				}
			}
			delayTime += delayM;
			var innerDebugTime = delayTime;	
			var oPopup = getView("popup");
			if(oPopup){
				if(oPopup.renjian.curType == curType){
					innerDebugTime = 16;
					delayTime -= delayM;
				}
			}
			if(!updateControl[curType]){
				renjian.timer[curType] = setTimeout(function(){
					var oPopup = getView("popup");
					if(oPopup){
						oPopup.renjian.trace("delay time: " + innerDebugTime);
						oPopup.renjian.trace("background更新检测:" + renjian.api[curType]);
						oPopup.renjian.trace("postData.since_id:" + (postData.since_id||"无"));
						if(oPopup.console && oPopup.console.time) oPopup.console.time(curType);
					}
					$.ajax({
						url: renjian.api[curType], 
						dataType: "json",
						data: postData,
						cache: false,
						beforeSend: function(xhr){
							updateControl[curType] = true;
							xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(Persistence.userName().val() + ":" + Persistence.password().val()));
						},
						success: function(data, status, xhr){
							updateControl[curType] = false;
							renjian.timer[curType] = 0;						
							if(!timerStart || len != oData.data.length || !data.length) return;
							data = data || [];
							var winPopup = getView("popup");
							if(curType != "publicTimeline" && len){
								var num = localStorage.getItem("badget_" + curType);
								if(num){
									num = (parseInt(num, 10)||0) + data.length;
								}else{
									num = data.length;
								}
								if(winPopup && winPopup.renjian.curType == curType) num = 0;
								if(data.length != renjian.pageSize)	 
									localStorage.setItem("badget_" + curType, num);
							}
							if(winPopup){
								winPopup.renjian.trace("读取" + curType + "长度：" + data.length);
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
							var oPopup = getView("popup");
							if(oPopup){
								oPopup.renjian.trace("background更新检测:" + curType + "完成！");
								if(oPopup.console && oPopup.console.timeEnd) oPopup.console.timeEnd(curType);
							}
						}
					});	
				}, innerDebugTime);
			}
		});
	}catch(e){
		var winPopup = getView("popup");
		winPopup && winPopup.renjian.trace("自动更新完成处理程序出错：" + e.message, "error");	
	}
}
function showTipsText(){
	try{
		var total = 0, tips = Persistence.userName().val() + " - 人间大炮\r\n";
		$.each(renjian.typeList, function(idx, curType){
			if(curType != "publicTimeline"){
				var num = localStorage.getItem("badget_" + curType) || 0;
				total += (parseInt(num, 10)||0);
			}
		});
		if(total == 0){
			chrome.browserAction.setBadgeText({text: ""});
			chrome.browserAction.setTitle({title: ""});
			return;
		}
		if(total > 99) total = "99+";
		chrome.browserAction.setBadgeText({text: total.toString()});
		var colorHash = {red: [255, 0, 0, 255], green: [80, 179, 81, 255], blue: [75, 108, 166, 255]};
		var fdCount = localStorage.getItem("badget_friendsTimeline") || 0;
		var mmCount = localStorage.getItem("badget_mentionsTimeline") || 0;
		var dmCount = localStorage.getItem("badget_directMessage") || 0;
		var bkColor = colorHash.red;
		if(mmCount > 0) bkColor = colorHash.green;
		if(dmCount > 0) bkColor = colorHash.blue;
		chrome.browserAction.setBadgeBackgroundColor({color: bkColor});
		tips += "朋友动态：" + fdCount;
		tips += "\r\n@我：" + mmCount;
		tips += "\r\n悄悄话：" + dmCount;
		chrome.browserAction.setTitle({title: tips});
		var arr = [];
		if(fdCount) arr.push({type: "friendsTimeline", data: (localStorage.getObject("friendsTimeline")||[]).slice(0, fdCount)});
		if(mmCount) arr.push({type: "mentionsTimeline", data: (localStorage.getObject("mentionsTimeline")||[]).slice(0, mmCount)});
		if(dmCount) arr.push({type: "directMessage", data: (localStorage.getObject("directMessage")||[]).slice(0, dmCount)});
		if(arr.length)
		chrome.tabs.getSelected(null, function(tab){
			chrome.tabs.sendRequest(tab.id, {messages: arr});
		});		
	}catch(e){
		var winPopup = getView("popup");
		winPopup && winPopup.renjian.trace("showTipsText处理程序出错：" + e.message, "error");		
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
							if(ct.find(".item").length > renjian.pageSize){
								ct.find(".item:nth(" + (renjian.pageSize-1) + ")").nextAll().remove();
							}
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
				switch(oEvent.type){
					case "friendsTimeline": 
						$("#fNum").html("(" + num + ")").show();
					break;
					case "mentionsTimeline":
						$("#mNum").html("(" + num + ")").show();
					break;
					case "directMessage":
						$("#dNum").html("(" + num + ")").show();
					break;
				}
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