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