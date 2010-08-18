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
	return htmlEncode(source);
}