var MessageControl = function(){
	var listners = {};
	return {
		addEventListner: function(sType, listner){
			if(!listners[sType]) listners[sType] = [];
			listners[sType].push(listner);
		},
		dispatch: function(oEvent){
			var handlers = listners[oEvent.type];
			for(var i = 0, l = handlers.length; i < l; i++){
				handler = handlers[i];
				if(handler) handler(oEvent);
			}
		}
	};
}();
function DataControl(type, data){
	this.type = type || "friendsTimeline";
	this.data = data || [];
}
DataControl.prototype = {
	reload: function(arr, noDispatch){
		if(arr){
			this.data = arr;
			this.setCache();
		}
		if(this.data.length > renjian.pageSize) this.data.length = renjian.pageSize;
		if(!noDispatch) MessageControl.dispatch({data: this.getCopyData(this.data), type: this.type,  manipType: "reload"});
	},
	unshift: function(arr, noDispatch){
		if(!this.isArray(arr)) arr = [arr];
		if(!arr.length) return;
		Array.prototype.unshift.apply(this.data, arr);
		if(this.data.length > renjian.pageSize) this.data.length = renjian.pageSize;
		this.setCache();
		if(!noDispatch) MessageControl.dispatch({data: this.getCopyData(arr), type: this.type,  manipType: "unshift"});
	},
	push: function(arr, noDispatch){
		if(!this.isArray(arr)) arr = [arr];
		if(!arr.length) return;
		Array.prototype.push.apply(this.data, arr);
		this.setCache();
		if(!noDispatch) MessageControl.dispatch({data: this.getCopyData(arr), type: this.type,  manipType: "push"});	
	},
	del: function(id){
		for(var i = 0, l = this.data.length; i < l; i++){
			if(this.data[i].id == id){
				this.data.splice(i, 1);
				this.setCache();
				break;
			}
		}
	},
	modify: function(id, obj, noDispatch){
		for(var i = 0, l = this.data.length; i < l; i++){
			if(this.data[i].id == id){
				for(var k in obj){
					this.data[i][k] = obj[k];
				}
				this.setCache();
				if(!noDispatch) MessageControl.dispatch({data: this.getCopyData(this.data), type: this.type,  manipType: "modify"});
				break;
			}
		}		
	},
	setCache: function(){//cache's length is renjian.pageSize
		var cache = [];
		if(this.data.length > renjian.pageSize){
			for(var i = 0, l = renjian.pageSize; i < l; i++){
				cache.push(this.data[i]);
			}
		}else
			cache = this.data;
		localStorage.setObject(this.type, cache);
	},
	updateRelativeTime: function(servertime){
		try{
			this.each(function(idx, status){
				status.relative_date = calRelTime(parseTime(status.created_at), servertime); 
			});
			this.setCache();
		}catch(e){}
	},
	getCopyData: function(data){
		return JSON.parse(JSON.stringify(data));
	},
	each: function(callback){
		for(var i = 0, l = this.data.length; i < l; i++){
			callback.call(this.data[i], i, this.data[i]);
		}
	},
	isArray: function(obj){
		return Object.prototype.toString.call(obj) === "[object Array]";
	}
};