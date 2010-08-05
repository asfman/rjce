	var sub_messageTypes = "['STATUS']";
alert(sub_messageTypes);
	function getHost(){
		return "message.renjian.com";
	}

	function getPort(){
		return 9999;
	}

	function getUser() {
		return 5;
	}

	function getMessageTypes() {
		return sub_messageTypes;
	}

	function setMessageTypes(types) {
		sub_messageTypes = types;
	}

	function isReconnect(){
		return socket_connected == false;
	}


	var socket_connected = false;

	SocketCheckTask = setInterval("socketCheck()",1000*30);

	function socketCheck() {
		if (socket_connected == true) return;
		MessageManager.printlog("Flash消息推送服务不可用!");
	}

	var MessageManager = function(){
		var listeners = {};
		function getDateStr(){
			var now= new Date();
			var month=now.getMonth()+1;
			var day=now.getDate();
			var hour=now.getHours();
			var minute=now.getMinutes();
			var second=now.getSeconds();
			return (month+"/"+day+"/"+hour+":"+minute+":"+second);
		}

		return {
			printlog: function(data){
				 alert(data);
			},
			addListener: function(messageType, listener){
				listeners[messageType] = listener;
			},
			newMessage: function(data){
				if (!data) return;
				var messages = data['messages'];
				if (!messages || messages.length==0) return;
				for(var i = 0; i < messages.length; i++) {
					var message = messages[i];
					if (!message || !message.messageType) continue;
					var listener = listeners[message.messageType];
					if (!listener) {
						MessageManager.printlog("找不到侦听函数，类型为：" + message.messageType);
						continue;
					}
					try{
			        	listener(message);
			        }catch(e) {
						MessageManager.printlog("执行侦听函数出错：" + e.message + "，类型：" + message.messageType);
					}
				}
			}
		}
	}();

	function SocketOnData(data){
		MessageManager.printlog(data);
	 	var jsonMessage = JSON.parse(data);
		MessageManager.newMessage(jsonMessage);
	}

	function SocketSend(data){
		if (socket_connected == true){
			window.document.socket.send(data);
			return;
		}
	}
	function SocketReset() {
		MessageManager.printlog("socket connection reset!");
	}
	function SocketOnConnect() {
		MessageManager.printlog("socket connection connect!");
		socket_connected = true;
	}
	function SocketOnClose(){
		MessageManager.printlog("socket connection close!");
		socket_connected = false;
	}
	function SocketOnError(error){
		MessageManager.printlog("socket connection error:"+error);
		socket_connected = false;
	}