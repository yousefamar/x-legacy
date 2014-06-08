GAME.namespace('net').connectToServer = function (game, address) {
	GAME.net.socket = io.connect(address);

	GAME.net.socket.on('connect', function () {
		GAME.net.socket.emit('join', { name: "Player"+Math.floor(Math.random()*999) }, { pos: game.player.position, rot: game.player.rotation });
	});

	GAME.net.socket.on('spawn', function (user, state) {
		game.scene.entityManager.spawnPlayer(user, state);
	});

	GAME.net.socket.on('despawn', function (user) {
		game.scene.entityManager.despawnPlayer(user);
	});

	GAME.net.socket.on('state', function (user, state, latOffset) {
		var player = game.scene.entityManager.players[user.name];
		if (player)
			player.onStateReceived(state, latOffset);
	});

	GAME.net.socket.on('log', function (packet) {
		GAME.gui.log(packet.msg);
		if (packet.mute) return;
		GAME.audio.loadSpeech(packet.msg, function (audioElement) {
			var source = new GAME.audio.AudioSourceStreaming(audioElement);
			// TODO: Follow position while still playing.
			source.setPosition(game.camera.localToWorld(new THREE.Vector3()));
			source.play();
		}, { pitch: 100 });
	});

	GAME.net.socket.on('chat', function (packet) {
		GAME.gui.log(packet.username+": "+packet.msg);
		GAME.audio.loadSpeech(packet.msg, function (audioElement) {
			var source = new GAME.audio.AudioSourceStreaming(audioElement);
			// TODO: Follow position while still playing.
			source.setPosition(game.scene.entityManager.players[packet.username].position);
			source.play();
		});
	});

	GAME.net.socket.on('ping', function () {
		GAME.net.socket.emit('pong');
	});
};

GAME.net.submitFormInput = function (form) {
	var text = form.input.value.trim();
	if (!text.length) return;
	GAME.net.socket.emit('chat', text);
	GAME.gui.log("You: "+text);
	form.input.value = "";
	GAME.audio.loadSpeech(text, function (audioElement) {
		var source = new GAME.audio.AudioSourceStreaming(audioElement);
		// TODO: Avoid static calls.
		// TODO: Follow position while still playing.
		source.setPosition(GAME.game.camera.localToWorld(new THREE.Vector3()));
		source.play();
	});
};