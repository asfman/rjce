function DataStack(config){
	config = config || {};
	this.fields = config.fields || [];
	this.data = config.records || [];
	this.pointer = 0;
	this.refresh();
}
DataStack.prototype = {
	refresh: function(){
	   this.count = this.data.length;	
    },
	go: function(idx){
    	if(idx >= 0 && idx <= this.count - 1 && this.pointer != idx){
    		this.pointer = idx;
    		this.onPointerChange && this.onPointerChange();
    	}
    },
    pos: function(fieldName, val){
    	for(var i = 0, ret = -1, l = this.count; i < l; i++){
    		if(this.data[i][fieldName] == val){
    			ret = i;
    			break;
    		}
    	}
    	if(ret != -1) this.go(ret);
    	return ret;
    },
    load: function(data){
    	if(Object.prototype.toString.call(data) !== "[object Array]") return;
    	this.data = data;
    	this.refresh();
    	this.onLoad && this.onLoad();
    },
    read: function(s){
    	if(this.count == 0) return null;
    	if(typeof s == "string") return this.data[this.pointer][s];
    	if(typeof s == "number") return this.data[s];
    	return this.data[this.pointer];
    },
    append: function(rd){
    	this.data.push(rd);
    	this.refresh();
    	this.onAppend && this.onAppend(rd);
    },
    prepend: function(rd){
    	this.data.unshift(rd);
    	this.refresh();
    	this.onPrepend && this.onPrepend(rd);
    },
    insertBefore: function(rd, idx){
    	if(idx !== 0) idx = idx || this.pointer;
    	if(idx < 0 || idx > this.count-1) return;
    	this.data.splice(idx, 0, rd);
    	this.refresh();
    	this.onInsertBefore && this.onInsertBefore(rd);
    },
    insertAfter: function(rd, idx){
    	if(idx !== 0) idx = idx || this.pointer;
    	if(idx < 0 || idx > this.count-1) return;
    	this.data.splice(idx+1, 0, rd);
    	this.refresh();
    	this.onInsertAfter && this.onInsertAfter(rd);
    },
    del: function(idx){
    	if(idx !== 0) idx = idx || this.pointer;
    	if(idx < 0 || idx > this.count-1) return;
    	this.data.splice(idx, 1);
    	this.refresh();
    	if(idx == this.count - 1) this.pointer = 0; 
    	this.onDel && this.onDel();
    },
    edit: function(fieldName, val){
    	this.data[this.pointer][fieldName] = val;
    	this.onEdit && this.onEdit(fieldName, val);
    },
    search: function(fieldName, keyword, isfromHd){
    	var ret = [];
		for(var i = (isfromHd ? 0 : this.pointer), l = this.count; i < l; i++){
		    this.go(i);
			if(this.read(fieldName).toString().toLowerCase().indexOf(keyword.toString()) > -1)
				ret.push(i);
		}
    	return ret;
    },
    sortBy: function(fieldName, way){
    	way = way || "asc";
    	switch(way){
    	   case "asc": 
    		   this.data.sort(function(a, b){
    			   return a[fieldName] - b[fieldName];
    		   });
    	   break;
    	   case "desc": 
    		   this.data.sort(function(a, b){
    			   return b[fieldName] - a[fieldName];
    		   });
    	    break;    	    
    	}
    }
}