var _Ubbs = {
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
function emoteHandler(){
	if($("div.emotCt").is(":visible")){
		$("div.emotCt").hide();
		return false;
	}
	var oFrag = document.createDocumentFragment(), oA = null, oEmote;
	for(var i = 0; i < _UbbArr.length; i++){
		oEmote = _Ubbs[_UbbArr[i]];
		oA = document.createElement("a");
		oA.title = oEmote[1];
		oA.href = "#";
		oA.onclick = emoteClick;
		oA.className = "emot";
		oA.innerHTML = _UbbArr[i];
		oA.hideFocus = true;
		oA.style.backgroundPosition = oEmote[0];
		oFrag.appendChild(oA);			     
	}
	$("#emots").empty().append(oFrag);
	$('#say').focus();
	var offset = $(this).offset();
	var iLeft = offset.left, iTop = offset.top + $(this).height();
	$("div.emotCt").css({zIndex: 10000, left: iLeft, top: iTop}).show();	
	return false;
}
function emoteClick(){
	var oTextarea = $('#say').focus()[0],
	nLen = oTextarea.value.length, str = this.innerHTML;
    var selSt = oTextarea.selectionStart;
    oTextarea.value = oTextarea.value.substr(0, selSt) + str + oTextarea.value.substring(selSt, nLen);
    oTextarea.selectionStart = selSt + str.length;
    oTextarea.setSelectionRange(selSt + str.length, selSt + str.length);
	$("div.emotCt").hide();
	return false;
}