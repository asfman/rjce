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
  cleanupOldData: function() {
	localStorage.removeItem('user');
	localStorage.removeItem('userName');
    localStorage.removeItem('password');
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