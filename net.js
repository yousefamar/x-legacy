GAME.namespace('net').socket = io.connect('http://4ytech.com:9980');

GAME.net.socket.on('log', function (packet) {
	document.clientForm.console.value += "> Server: "+packet.msg+"\n";
	//console.log("Server: "+packet.msg);
});


GAME.net.send = function(text) {
	GAME.net.socket.emit('msg', { msg: text });
}

GAME.net.submitFormInput = function(form) {
	GAME.net.send(form.input.value);
	form.console.value += "> You: "+form.input.value+"\n";
	form.input.placeholder = "";
	form.input.value = "";
	form.console.scrollTop = form.console.scrollHeight - form.console.clientHeight;
	//console.log("Server: "+packet.msg);
}