function getView(sType){
    var views = chrome.extension.getViews();
    for (var i = 0; i < views.length; i++) {
        var view = views[i];
        if (view.viewName && view.viewName == sType) {
            return view;
        }
    }
    return null;
}
function htmlEncode(str){
	str = str || "";
	return str.replace(/&/g, "&gt;")
			  .replace(/</g, "&lt;")
			  .replace(/>/g, "&gt;")
			  .replace(/\'/g, "&#39;")
			  .replace(/\"/g, "&quot;");
}
function fixText(source, length){
	if(charCount(source) > length)
	{
		while(charCount(source) > length - 3)
		{
			source = source.slice(0, -1);
		}
		while(charCount(source) < length) source += ".";
	}
	function charCount(text)
	{
	   return text.replace(/[^\x00-\xff]/g,"11").length;
	}
	return emoteReplace(htmlEncode(source));
}
function emoteReplace(str){
	try{
		if(!str) return "";
		return str.replace(ubbReg, function(al){
			var oEmote = _Ubbs[al];
			return '<span class="emot" title="' + oEmote[1] + '" style="background-position: ' + oEmote[0] + '"></span>';
		});
	}catch(e){
		renjian.trace("表情解析出错：" + e.message);
		return str;
	}	
}
//emote
var  _Ubbs = {
        "[//smile]" : ["0 0", "微笑", 1],
        "[//heart]" : ["-30px 0", "色", 2],
        "[//yum]" : ["-60px 0", "满足", 3],
        "[//laugh]" : ["-90px 0", "憨笑", 4],
        "[//grin]" : ["-120px 0", "可爱", 5],
        "[//tongue]" : ["-150px 0", "调皮", 6],
        "[//hot]" : ["-180px 0", "得意", 7],
        "[//ambivalent]" : ["-210px 0", "不高兴", 8],
        "[//blush]" : ["-240px 0", "害羞", 9],
        "[//frown]" : ["-270px 0", "低落", 10],
        "[//halo]" : ["0 -30px", "炯炯有神" , 11],
        "[//crazy]" : ["-30px -30px", "猥琐", 12],
        "[//crying]" : ["-60px -30px", "哭", 13],
        "[//undecided]" : ["-90px -30px", "傲慢", 14],
        "[//naughty]" : ["-120px -30px", "魔鬼", 15],
        "[//lips]" : ["-150px -30px", "闭嘴", 16],
        "[//nerd]" : ["-180px -30px", "得意", 17],
        "[//kiss]" : ["-210px -30px", "亲亲", 18],
        "[//pirate]" : ["-240px -30px", "海盗", 19],
        "[//gasp]" : ["-270px -30px", "惊讶", 20],
        "[//foot]" : ["0 -60px", "擦汗", 21],
        "[//largegasp]" : ["-30px -60px", "衰", 22],
        "[//veryangry]" : ["-60px -60px", "抓狂", 23],
        "[//angry]" : ["-90px -60px", "无奈", 24],
        "[//confused]" : ["-120px -60px", "晕", 25],
        "[//sick]" : ["-150px -60px", "我吐", 26],
        "[//moneymouth]" : ["-180px -60px", "吐钱", 27],
        "[//ohnoes]" : ["-210px -60px", "糗大了", 28],
        "[//wink]" : ["-240px -60px", "眨眼", 29],
        "[//sarcastic]" : ["-270px -60px", "阴险", 30],
        "[//up]" : ["0 -90px", "顶", 31],
        "[//down]" : ["-30px -90px", "鄙视", 32]
    };
var _UbbArr = [];
for(var _key in _Ubbs) _UbbArr.push(_key);
var ubbReg = new RegExp(_UbbArr.join("&").replace(/\[|\]|\\|\/|\)|\(|\*|\?|\||\^|\$/g, "\\$&").replace(/&/g, "|"), "g");