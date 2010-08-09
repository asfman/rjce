var viewName="background", extensionClicked = true, timerStart = true, timer = 0;
function init(){
	$.each(renjian.typeList, function(idx, curType){
		var arr = localStorage.getObject(curType);
		if(arr.length > renjian.pageSize){
			arr.length = renjian.pageSize;
			localStorage.setObject(curType, arr);
		}	
	});
	timerControl(true);
	/*确保定时器timer正常运行*/
	setInterval(function(){
		if(!getView("popup")){
			if(!timerStart){
				timerControl(true);
			}
		}
	}, renjian.interval);
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
if(Persistence.userName().val()) init();
function timerControl(b){
	if(timer) clearInterval(timer);
	if(b){
		timerStart = true;
		timer = setInterval(updateHandler, renjian.interval);
	}else{
		timerStart = false;
	}
}

function updateHandler(){
	$.each(renjian.typeList, function(idx, curType){
		var arr = Persistence.localStorage.getObject(curType)||[], sinceId = "", noData = false;
		if(arr.length) sinceId = arr[0].id;
		else noData = true;
		$.ajax({
			url: renjian.api[curType], 
			dataType: "json",
			data: {since_id: sinceId},
			username: Persistence.userName().val(),
			password: Persistence.password().val(),
			success: function(data, status, xhr){
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
						winPopup.renjian.util.updateHandler(data, curType, xhr);
					}else{
						if(!noData) showTipsText();
					}
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