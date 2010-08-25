Array.prototype.shuffle = function(times){
    var start, deleteCount;
	times = times || 10;
	for(var i = 0, l =  times; i < l; i++){
		start = Math.floor(this.length * Math.random());
		deleteCount = Math.floor(Math.random() * (this.length - start)) + 1;
		this.push.apply(this, this.splice(start, deleteCount));
	}
}
var HashType = {
	"friendsTimeline": "动态",
	"mentionsTimeline": "提到我",
	"directMessage": "悄悄话"
};
var rjdp_tpl = '{for message in messages}\
					<div class="rjdp_item">\
						<span class="rjdp_type ${message.type}">${HashType[message.type]}</span>\
						<strong class="rjdp_screenName">${message.screenName}:</strong>\
						{if message.zt}<span class="rjdp_zt">转发</span>{/if}\
						<span class="rjdp_text">${message.text} <b class="rjdp_time">${message.time}</b></span>\
						<span class="rjdp_source">通过${message.source}</span>\
					</div>\
				{/for}';
function close_rjdp(){
	$("#rjdp_tips").fadeOut(function(){
		$("#rjdp_list").empty();
	});
	return false;
}
function htmlEncode(str){
	str = str || "";
	return str.replace(/&/g, "&gt;")
			  .replace(/</g, "&lt;")
			  .replace(/>/g, "&gt;")
			  .replace(/\'/g, "&#39;")
			  .replace(/\r\n|\n/g, "<br />")
			  .replace(/^\s+|\s+$/g, "")
			  .replace(/\s+/g, "&nbsp;")
			  .replace(/\"/g, "&quot;");
}
function fixText(source, length){
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
	return htmlEncode(source);
}
function parseTime(s){
	//2010-07-09 15:22:42 +0800
	var arr = s.split(/\s+/);
	var ymd = arr[0].split("-"), hms = arr[1].split(":");
	return new Date(ymd[0], parseInt(ymd[1],10) - 1, ymd[2], hms[0], hms[1], hms[2]).valueOf();
}
var timer = 0;
chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
	try{
		if(request.close){
			if($("#rjdp_tips").is(":visible")) $("#rjdp_close").click();
			return;
		}
		var messages = [];
		for(var i = 0, l = request.messages.length; i < l; i++){
			var obj = request.messages[i];
			for(var j = 0, len = obj.data.length; j < len; j++){
				var status = obj.data[j], sText = status.text;
				if(sText == "" && status.attachment){
					if(status.attachment.type == "LINK"){
						sText = '<a target="_blank" href="' + status.attachment.url + '">' + status.attachment.title + '</a>';
					}else if(status.attachment.type == "PICTURE"){
						sText = "发了一张图片";
					}
				}else if(status.text == "" && status.forwarded_status){
					sText = status.forwarded_status.text;
					if(sText == "" && status.forwarded_status.attachment){
						if(status.forwarded_status.attachment.type == "LINK"){
							sText = '<a target="_blank" href="' + status.forwarded_status.attachment.url + '">' + status.forwarded_status.attachment.title + '</a>';
						}else if(status.forwarded_status.attachment.type == "PICTURE"){
							sText = "发了一张图片";
						}
					}
				}
				messages.push({
					type: obj.type,
					screenName: status.user ? status.user.screen_name : status.sender ? status.sender.screen_name : status.screen_name,
					text: fixText(sText, 150),
					time: status.created_at.replace(/\s+\+.+$/, ""),
					created_at: parseTime(status.created_at),
					source: status.source,
					zt: status.forwarded_status ? true : false
				});			
			}
		}
		if(!messages.length) return;
		messages.sort(function(a, b){
			return b.created_at - a.created_at;
		});
		if(messages.length > 5) messages.length = 5;
		var ret = TrimPath.parseTemplate(rjdp_tpl).process({messages: messages});
		if(!$("#rjdp_tips").length){
			$('<div id="rjdp_tips"><a id="rjdp_close" href="javascript:void(0)">关闭</a><div id="rjdp_list"></div></div>').appendTo(document.body);
		}
		if(timer) clearTimeout(timer);
		$("#rjdp_list").empty().html(ret).fadeIn(function(){
			timer = setTimeout(function(){
				if($("#rjdp_tips").is(":visible")) $("#rjdp_close").click();
			}, 20000);
		});
		$("#rjdp_tips").fadeIn();
		$("#rjdp_close").click(close_rjdp);
	}catch(e){console.error(e.message);}
});