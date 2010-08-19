var viewName="background", extensionClicked = true, timerStart = false, timer = 0;
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
function init(){
	if(!Persistence.userName().val()) return;
	$.each(renjian.typeList, function(idx, curType){
		var arr = localStorage.getObject(curType) || [];
		if(arr.length > renjian.pageSize){
			arr.length = renjian.pageSize;
			localStorage.setObject(curType, arr);
		}	
	});
	timerControl(true);
}
function imgOnerror(){
	this.src = "images/icon48.png";
}
Storage.prototype.setObject = function(key, value){
    this.setItem(key, JSON.stringify(value));
}
Storage.prototype.getObject = function(key){
    var v = this.getItem(key);
    if(v){
        try{
            v = JSON.parse(v);
        }catch(e){
            v = null;
        }
    }
    return v;
}
//init
init();
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
	}
}

function updateHandler(){
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
	$.each(renjian.typeList, function(idx, curType){
		var arr = Persistence.localStorage.getObject(curType)||[], sinceId = "", noData = false;
		if(arr.length) sinceId = arr[0].id;
		else noData = true;
		var oPopup = getView("popup");
		if(oPopup){
			oPopup.renjian.trace("background更新检测:" + renjian.api[curType]);
			if(oPopup.console && oPopup.console.time) oPopup.console.time(curType);
		}
		$.ajax({
			url: renjian.api[curType], 
			dataType: "json",
			data: {since_id: sinceId},
			username: Persistence.userName().val(),
			password: Persistence.password().val(),
			success: function(data, status, xhr){
				if(!timerStart) return;
				if(data.length > 0){
					Array.prototype.unshift.apply(arr, data);
					Persistence.localStorage.setObject(curType, arr);
					var winPopup = getView("popup");
					var num = localStorage.getItem("badget_" + curType);
					if(num){
						num = (parseInt(num, 10)||0) + data.length;
					}else{
						num = data.length;
					}
					if(curType != "publicTimeline" && !noData)
						localStorage.setItem("badget_" + curType, num);					
					if(winPopup){
						winPopup.renjian.trace("读取" + curType + "长度：" + data.length + ", noData:" + noData);
						winPopup.renjian.util.updateHandler(data, curType, xhr, noData);
					}else{
						if(!noData) showTipsText();
					}
				}
			},
			complete: function(){
				var oPopup = getView("popup");
				if(oPopup){
					oPopup.renjian.trace("background更新检测:" + curType + "完成！");
					if(oPopup.console && oPopup.console.timeEnd) oPopup.console.timeEnd(curType);
				}
			}
		});	
	});
}
function showTipsText(){
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
	tips += "朋友动态：" + (localStorage.getItem("badget_friendsTimeline") || 0);
	tips += "\r\n@我：" + (localStorage.getItem("badget_mentionsTimeline") || 0);
	tips += "\r\n悄悄话：" + (localStorage.getItem("badget_directMessage") || 0);
	chrome.browserAction.setTitle({title: tips});
}