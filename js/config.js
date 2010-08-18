var renjian = {
	trace:	function(str){
		try{
			console.log(str);
			//alert(str);
		}catch(e){
			alert(str);
		}
	},
	api: {
			verify: "http://api.renjian.com/v2/account/verify_credentials.json",
			publicTimeline: "http://api.renjian.com/v2/statuses/public_timeline.json",
			friendsTimeline: "http://api.renjian.com/v2/statuses/friends_timeline.json",
			userTimeline: "http://api.renjian.com/v2/statuses/user_timeline.json",
			mentionsTimeline: "http://api.renjian.com/v2/statuses/mentions.json",
			directMessage: "http://api.renjian.com/v2/direct_messages/receive.json",
			single_status:	"http://api.renjian.com/v2/statuses/show/@{statusId}.json",
			destroy: "http://api.renjian.com/v2/statuses/destroy.json",
			end_session: "http://api.renjian.com/v2/account/end_session.json",
			update: " http://api.renjian.com/v2/statuses/update.format",
			user: "http://api.renjian.com/v2/users/show.json",
			follow: "http://api.renjian.com/v2/friendships/create.json",
			zt: "http://api.renjian.com/v2/statuses/forward.json"
	},
	statusFields: ["id", "text", "source", "truncated", "created_at", "relative_date", "liked",
	         "likers", "liker_count", "forwarded", "forwarders", "forwarder_count", "conversation_count",
	         "reply_count", "conversation_id", "attachment", "user", "forwarded_status", "replyed_status", "tag"],
	typeList: ["friendsTimeline", "mentionsTimeline", "publicTimeline", "directMessage"],
	curType: "",
	timer: {},
	interval: 15000,
	pageSize: 20,
	textNum: 200,
	xhr: null,
	timeout: 6000,
	error: function(xhr, status, e){
		switch(status){
			case "timeout":
				$("#loading").html("ajax读取超时错误...");
			break;
			default:
				$("#loading").html("ajax读取错误...");
		}
		$("#loading").fadeOut();		
	},
	beforeSend: function(xhr){
		xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(renjian.userName + ":" + renjian.password));
	}
};
