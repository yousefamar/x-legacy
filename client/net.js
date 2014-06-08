GAME.namespace('net').connectToServer = function (address, game) {
	GAME.net.socket = io.connect(address);

	GAME.net.socket.on('connect', function () {
		GAME.net.socket.emit('join', { name: "Player"+Math.floor(Math.random()*999), pos: game.player.position });
	});

	GAME.net.socket.on('spawn', function (user) {
		game.scene.entityManager.spawnPlayer(user);
	});

	GAME.net.socket.on('despawn', function (user) {
		game.scene.entityManager.despawnPlayer(user);
	});

	GAME.net.socket.on('pos', function (user) {
		game.scene.entityManager.players[user.name].position.copy(user.pos);
	});

	GAME.net.socket.on('log', function (packet) {
		document.clientForm.console.value += packet.msg+"\n";
		//console.log("Server: "+packet.msg);
	});

	GAME.net.socket.on('chat', function (packet) {
		document.clientForm.console.value += packet.username+": "+packet.msg+"\n";
		//console.log("Server: "+packet.msg);
	});
};

GAME.net.send = function (text) {
	GAME.net.socket.emit('chat', text);
};

GAME.net.submitFormInput = function (form) {
	GAME.net.send(form.input.value);
	form.console.value += "You: "+form.input.value+"\n";
	form.input.placeholder = "";
	form.input.value = "";
	form.console.scrollTop = form.console.scrollHeight - form.console.clientHeight;
	//console.log("Server: "+packet.msg);
};