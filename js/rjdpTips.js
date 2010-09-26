function close_rjdp(){
	$("#rjdp_tips").fadeOut(function(){
		$("#rjdp_list").empty();
	});	
}
chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
	try{
		if(request.close){
			if($("#rjdp_tips").length && $("#rjdp_tips").is(":visible")){
				$("#rjdp_close").click();			
			}
			return;
		}
		if(!$("#rjdp_tips").length){
			$('<div id="rjdp_tips"><h1>人间网消息提醒</h1><a id="rjdp_close" href="javascript:void(0)">关闭</a><div id="rjdp_list"></div></div>').appendTo(document.body);
			$("#rjdp_close").click(close_rjdp);
		}
		var oList = $("#rjdp_list").empty();
		if(request.messages){
			if(request.messages.mentions) oList.append("<div class='rjdp_mentions rjdp_item'>有<em>" + request.messages.mentions + "</em>条@我的消息未读</div>")
			if(request.messages.dm) oList.append("<div class='rjdp_dm rjdp_item'>有<em>" + request.messages.dm + "</em>条悄悄话未读</div>");
			$("#rjdp_tips").fadeIn();
		}
	}catch(e){
		console.error(e.message);
	}finally{
		sendResponse({});
	}
});