var MessageControl = function(){
	var listners = {};
	return {
		addEventListner: function(sType, listner){
			listners[sType] = listner;
		},
		dispatch: function(oEvent){
			var handler = listners[oEvent.type];
			if(handler) handler(oEvent);
		}
	};
}();
function DataControl(data, type){
	this.data = data || [];
	this.type = type || "friendsTimeline";
	if(this.data.length > renjian.pageSize) this.data.length = renjian.pageSize;
}
DataControl.prototype = {
	reload: function(arr, noDispatch){
		if(arr){
			this.data = arr;
			this.setCache();
		}
		if(!noDispatch) MessageControl.dispatch({data: this.getCopyData(this.data), type: this.type,  manipType: "reload"});
	},
	getCopyData: function(data){
		return JSON.parse(JSON.stringify(data));
	},
	unshift: function(arr, noDispatch){
		if(!this.isArray(arr)) arr = [arr];
		Array.prototype.unshift.apply(this.data, arr);
		this.setCache();
		if(!noDispatch) MessageControl.dispatch({data: this.getCopyData(arr), type: this.type,  manipType: "unshift"});
	},
	push: function(arr, noDispatch){
		if(!this.isArray(arr)) arr = [arr];
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
	setCache: function(){
		localStorage.setObject(this.type, this.data);
	},
	isArray: function(obj){
		return Object.prototype.toString.call(obj) === "[object Array]";
	}
};
//init
var CacheControl = {};
for(var i = 0, l = renjian.typeList.length; i < l ; i++){
	var key = renjian.typeList[i];
	CacheControl[key] = new DataControl(localStorage.getObject(key)||[], key);
}