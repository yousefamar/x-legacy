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

GAME.net.emit = function (event, data) {
	if (GAME.net.socket) {
		GAME.net.socket.emit(event, data);
	} else {
		//console.log('Emit: '+event);
		//console.log(data);
	}
};

GAME.net.submitFormInput = function (form) {
	var text = form.input.value.trim();
	if (!text.length) return;
	GAME.net.emit('chat', text);
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


GAME.net.ConnectionP2P = {
	createPeerConnection: function () {
		this.servers = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };
		this.pc1 = new webkitRTCPeerConnection(this.servers, {optional: [{RtpDataChannels: true}]});

		console.log('Connected to peer.');

		try {
			this.sendChannel = this.pc1.createDataChannel('sendDataChannel', {reliable: false});
			console.log('Created send data channel');
		} catch (e) {
			console.log('Create Data channel failed with exception: ' + e.message);
		}
		this.pc1.onicecandidate = this.iceCallback1;
		this.sendChannel.onopen = this.onSendChannelStateChange;
		this.sendChannel.onclose = this.onSendChannelStateChange;

		this.pc2 = new webkitRTCPeerConnection(this.servers, {optional: [{RtpDataChannels: true}]});
		console.log('Created remote peer connection object pc2');

		this.pc2.onicecandidate = this.iceCallback2;
		this.pc2.ondatachannel = this.receiveChannelCallback;

		this.pc1.createOffer(this.gotDescription1);
	},

	send: function (data) {
		if (this.sendChannel)
			this.sendChannel.send(data);
		console.log(data);
	},

	closeDataChannels: function () {
		console.log('Closing data Channels');
		this.sendChannel.close();
		console.log('Closed data channel with label: ' + this.sendChannel.label);
		this.receiveChannel.close();
		console.log('Closed data channel with label: ' + this.receiveChannel.label);
		this.pc1.close();
		this.pc2.close();
		this.pc1 = null;
		this.pc2 = null;
		console.log('Closed peer connections');
	},

	gotDescription1: function (desc) {
		var context = GAME.net.ConnectionP2P;
		context.pc1.setLocalDescription(desc);
		console.log('Offer from pc1 \n' + desc.sdp);
		context.pc2.setRemoteDescription(desc);
		context.pc2.createAnswer(context.gotDescription2);
	},

	gotDescription2: function (desc) {
		var context = GAME.net.ConnectionP2P;
		context.pc2.setLocalDescription(desc);
		console.log('Answer from pc2 \n' + desc.sdp);
		context.pc1.setRemoteDescription(desc);
	},

	iceCallback1: function (event) {
		console.log('local ice callback');
		if (event.candidate) {
			GAME.net.ConnectionP2P.pc2.addIceCandidate(event.candidate);
			console.log('Local ICE candidate: \n' + event.candidate.candidate);
		}
	},

	iceCallback2: function (event) {
		console.log('local ice callback');
		if (event.candidate) {
			GAME.net.ConnectionP2P.pc1.addIceCandidate(event.candidate);
			console.log('Local ICE candidate: \n' + event.candidate.candidate);
		}
	},

	receiveChannelCallback: function (event) {
		var context = GAME.net.ConnectionP2P;
		console.log('Receive Channel Callback');
		context.receiveChannel = event.channel;
		context.receiveChannel.onmessage = context.onReceiveMessageCallback;
		context.receiveChannel.onopen = context.onReceiveChannelStateChange;
		context.receiveChannel.onclose = context.onReceiveChannelStateChange;
	},

	onReceiveMessageCallback: function (event) {
		console.log('Received Message');
		console.log(event.data);
	},

	onSendChannelStateChange: function () {
		var readyState = GAME.net.ConnectionP2P.sendChannel.readyState;
		console.log('Send channel state is: ' + readyState);
		if (readyState == 'open') {
		} else {
		}
	},

	onReceiveChannelStateChange: function () {
		console.log('Receive channel state is: ' + GAME.net.ConnectionP2P.receiveChannel.readyState);
	}
};