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
			directMessage: "http://api.renjian.com/direct_messages/receive.json",
			single_status:	"http://api.renjian.com/statuses/show/@{statusId}.json",
			destroy: "http://api.renjian.com/statuses/destroy.json",
			end_session: "http://api.renjian.com/account/end_session.json",
			update: " http://api.renjian.com/statuses/update.format"
	},
	statusFields: ["id", "created_at", "relative_date", "text", "source", "truncated", "favorited",
	         "original_url", "status_type", "link_title", "link_desc", "stick", "favoriters",
	         "user", "all_zt_num", "level"],
	statusTplPicture: '\
		<li class="item status_@{id}">\
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
			<div class="marginLeft extraInfo clearfix">\
				<div class="fr actionsArea">\
					<a onclick="renjian.util.replyStatus({id: @{id}, screenName: \'@{screenName}\'})" href="javascript:void(0)">回应</a>\
					<#if \'@{screenName}\' == renjian.userName><a onclick="renjian.util.deleteStatus.call(this, @{id})" href="javascript:void(0)">删除</a></#if>\
				</div>\
				<span class="time" rel="@{createdAt}">@{time}</span> by <a class="screenName" target="_blank" href="http://renjian.com/@{screenName}">@{screenName}</a>\
				<span>通过@{source}</span>\
			</div>\
		</li>\
	',
	statusTplText: '\
		<li class="item status_@{id}">\
			<div class="avatar">\
				<img src="@{avatar}" />\
			</div>\
			<div class="fr details">\
				<div class="marginLeft">\
						<div class="text">@{text}</div>\
				</div>\
			</div>\
			<div class="Clear"></div>\
			<div class="marginLeft extraInfo clearfix">\
				<div class="fr actionsArea">\
					<a onclick="renjian.util.replyStatus({id: @{id}, screenName: \'@{screenName}\'})" href="javascript:void(0)">回应</a>\
					<#if \'@{screenName}\' == renjian.userName><a onclick="renjian.util.deleteStatus.call(this, @{id})" href="javascript:void(0)">删除</a></#if>\
				</div>\
				<span class="time" rel="@{createdAt}">@{time}</span> by <a class="screenName" target="_blank" href="http://renjian.com/@{screenName}">@{screenName}</a>\
				<span>通过@{source}</span>\
			</div>\
		</li>\
	',
	dmTpl: '\
		<li class="item status_@{id}">\
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
		<li class="item status_@{id}">\
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
			<div class="marginLeft extraInfo clearfix">\
				<div class="fr actionsArea">\
					<a onclick="renjian.util.replyStatus({id: @{id}, screenName: \'@{screenName}\'})" href="javascript:void(0)">回应</a>\
					<#if \'@{screenName}\' == renjian.userName><a onclick="renjian.util.deleteStatus.call(this, @{id})" href="javascript:void(0)">删除</a></#if>\
				</div>\
				<span class="time" rel="@{createdAt}">@{time}</span> by <a class="screenName" target="_blank" href="http://renjian.com/@{screenName}">@{screenName}</a>\
				<span>通过@{source}</span>\
			</div>\
		</li>\
	',
	typeList: ["friendsTimeline", "mentionsTimeline", "publicTimeline", "directMessage"],
	curType: "",
	timer: {},
	interval: 8000,
	pageSize: 20,
	xhr: null
};
