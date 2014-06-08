GAME.namespace('net').connectToServer = function (game, address) {
	GAME.net.socket = io.connect(address);

	GAME.net.socket.on('connect', function () {
		GAME.net.socket.emit('join', { name: "Player"+Math.floor(Math.random()*999) }, { pos: new THREE.Vector3(), rot: new THREE.Vector3() });//{ pos: game.player.position, rot: game.player.rotation });
	});

	GAME.net.socket.on('spawn', function (user, state) {
		//game.scene.entityManager.spawnPlayer(user, state);
	});

	GAME.net.socket.on('despawn', function (user) {
		//game.scene.entityManager.despawnPlayer(user);
	});

	GAME.net.socket.on('state', function (user, state, latOffset) {
		//var player = game.scene.entityManager.players[user.name];
		//if (player)
		//	player.onStateReceived(state, latOffset);
	});

	GAME.net.socket.on('log', function (packet) {
		GAME.gui.log(packet.msg);
		if (!GAME.audio.enableTTS || packet.mute) return;
		GAME.audio.loadSpeech(packet.msg, function (audioElement) {
			var source = new GAME.audio.AudioSourceStreaming(audioElement);
			// TODO: Follow position while still playing.
			source.setPosition(game.camera.localToWorld(new THREE.Vector3()));
			source.play();
		}, { pitch: 100 });
	});

	GAME.net.socket.on('chat', function (packet) {
		GAME.gui.log(packet.username+": "+packet.msg);
		if (!GAME.audio.enableTTS) return;
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


	GAME.net.channel = new DataChannel(undefined, { transmitRoomOnce: true });

	GAME.net.channel.openSignalingChannel = function(config) {
		var socket = io.connect(address+'/sigserv');
		socket.channel = config.channel || this.channel || '';
		socket.on('message', config.onmessage);

		socket.send = function (data) {
			socket.emit('message', data);
		};

		if (config.onopen) setTimeout(config.onopen, 1);
		return socket;
	};
	GAME.net.channel.onopen = function (userID) {
		console.log(userID + ' has joined.');
	};
	GAME.net.channel.onmessage = function (message, userID) {
		console.log(userID + ': ' + message);
	};
	GAME.net.channel.onleave = function(userID) {
		console.log(userID + ' has left.');
	};
	GAME.net.channel.onerror = function(event) {
		console.error(event);
	};
	GAME.net.channel.onclose = function(event) {
		console.log('Somebody left.');
		console.log(event);
	};
};

GAME.net.emit = function (event, data, callback) {
	if (GAME.net.socket) {
		GAME.net.socket.emit(event, data, callback);
	} else {
		//console.log('Emit: '+event);
		//console.log(data);
	}
};

GAME.net.submitFormInput = function (form) {
	var text = form.input.value.trim();
	if (!text.length) return;
	GAME.net.emit('chat', text);
	GAME.gui.log('You: '+text);
	form.input.value = '';
	GAME.audio.loadSpeech(text, function (audioElement) {
		var source = new GAME.audio.AudioSourceStreaming(audioElement);
		// TODO: Avoid static calls.
		// TODO: Follow position while still playing.
		source.setPosition(GAME.game.camera.localToWorld(new THREE.Vector3()));
		source.play();
	});
};