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
			verify: "http://api.renjian.com/account/verify_credentials.json",
			publicTimeline: "http://api.renjian.com/statuses/public_timeline.json",
			friendsTimeline: "http://api.renjian.com/statuses/friends_timeline.json",
			userTimeline: "http://api.renjian.com/statuses/user_timeline.json",
			mentionsTimeline: "http://api.renjian.com/statuses/mentions.json",
			single_status:	"http://api.renjian.com/statuses/show/@{statusId}.json",
			destroy_status: "http://api.renjian.com/statuses/destroy/@{statusId}.json",
			end_session: "http://api.renjian.com/account/end_session.json",
			update: " http://api.renjian.com/statuses/update.format"
	},
	statusFields: ["id", "created_at", "relative_date", "text", "source", "truncated", "favorited",
	         "original_url", "status_type", "link_title", "link_desc", "stick", "favoriters",
	         "user", "all_zt_num", "level"],
	statusTplPicture: '\
		<li class="item">\
			<div class="avatar">\
				<img src="@{avatar}" />\
			</div>\
			<div class="fr details">\
				<div class="marginLeft">\
						<div class="text">@{text}</div>\
						<div class="picture">\
							<img src="@{picture}" />\
						</div>\
				</div>\
			</div>\
			<div class="Clear"></div>\
			<div class="marginLeft extraInfo">\
				<span class="time" rel="@{createdAt}">@{time}</span> by <a class="screenName" target="_blank" href="http://renjian.com/@{screenName}">@{screenName}</a>\
			</div>\
		</li>\
	',
	statusTplText: '\
		<li class="item">\
			<div class="avatar">\
				<img src="@{avatar}" />\
			</div>\
			<div class="fr details">\
				<div class="marginLeft">\
						<div class="text">@{text}</div>\
				</div>\
			</div>\
			<div class="Clear"></div>\
			<div class="marginLeft extraInfo">\
				<span class="time" rel="@{createdAt}">@{time}</span> by <a class="screenName" target="_blank" href="http://renjian.com/@{screenName}">@{screenName}</a>\
			</div>\
		</li>\
	',
	statusTplLink: '\
		<li class="item">\
			<div class="avatar">\
				<img src="@{avatar}" />\
			</div>\
			<div class="fr details">\
				<div class="marginLeft">\
						<div class="text">@{text}</div>\
						<div class="link"><a title="@{linkUrl}" target="_blank" href="@{linkUrl}">@{linkTitle}</a></div>\
				</div>\
			</div>\
			<div class="Clear"></div>\
			<div class="marginLeft extraInfo">\
				<span class="time" rel="@{createdAt}">@{time}</span> by <a class="screenName" target="_blank" href="http://renjian.com/@{screenName}">@{screenName}</a>\
			</div>\
		</li>\
	',
	appData: {
		friendsTimeline: {},
		mentionsTimeline: {},
		publicTimeline: {}
	},
	curType: "",
	timer: {},
	interval: 8000,
	pageSize: 20,
	xhr: null
};
