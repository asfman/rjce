Persistence = {
  load: function (key) {
    return new ValueWrapper(key);
  },
  localStorage: localStorage,
  init: function() {
    var existingKeys = ['user', 'userName', "password"];
    var _this = this;
    for(var i = 0, len = existingKeys.length; i < len; ++i) {
      var currentKey = existingKeys[i];
      var methodName = currentKey.replace(/_(\w)/g, function(m1, m2) { return m2.toUpperCase(); });
      this[methodName] = (function(key) {
        return function() {
          return _this.load(key);
        }
      })(currentKey);
    }
  },
  cleanData: function() {
	   var l = renjian.typeList.length, key, badget;
	   for(var i = 0 ; i < l; i ++){
		   key = renjian.typeList[i];
		   badget = "badget_" + key;
		   if(localStorage.getItem(key)){
				localStorage.removeItem(key);
		   }
		   if(localStorage.getItem(badget)){
				localStorage.removeItem(badget);
		   }
		   var oBackground = chrome.extension.getBackgroundPage();
		   oBackground.oDataControl[key] = new oBackground.DataControl(key);
	   }
  }
};
Persistence.init();

function ValueWrapper(key) {
  this.key = key;
}
ValueWrapper.prototype = {
  save: function(value) {
    localStorage[this.key] = value;
    return value;
  },
  val: function() {
    return localStorage[this.key];
  },
  remove: function() {
    return localStorage.removeItem(this.key);
  }
};
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