function imgOnerror(){
	this.src = "images/32x32.jpg";
}
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