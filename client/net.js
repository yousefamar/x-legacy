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


	GAME.net.socket.on('peerDesc', function (peerDesc) {
		console.log('Answer from connection (local desc) \n' + peerDesc.sdp);
		GAME.net.ConnectionP2P.connection.setRemoteDescription(new RTCSessionDescription(peerDesc));
	});

	GAME.net.socket.on('candidate', function (candidate) {
		GAME.net.ConnectionP2P.connection.addIceCandidate(new RTCIceCandidate({ sdpMLineIndex: candidate.sdpMLineIndex, candidate: candidate.candidate }));
		console.log('Local ICE candidate: \n' + candidate.candidate);
	});
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


GAME.net.ConnectionP2P = {
	join: function (username) {
		var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
		if(RTCPeerConnection == undefined)
		alert('Your browser is not supported or you have to turn on flags. In chrome'+
		' you go to chrome://flags and turn on Enable PeerConnection remember '+
		'to restart chrome');
		// TODO: Remove.
		this.servers = { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] };
		this.connection = new RTCPeerConnection(this.servers, {optional: [{RtpDataChannels: true}]});
		console.log('Created remote peer connection object connection');

		this.connection.onicecandidate = function (event) {
			console.log('local ice callback');
			if (event.candidate)
				GAME.net.emit('candidate', event.candidate);
		};

		var context = GAME.net.ConnectionP2P;
		
		this.connection.ondatachannel = function (event) {
			console.log('Receive Channel Callback');
			context.receiveChannel = event.channel;
			context.receiveChannel.onmessage = function (event) {
				console.log('Received Message');
				console.log(event.data);
			};
			var onReceiveChannelStateChange = function () {
				console.log('Receive channel state is: ' + GAME.net.ConnectionP2P.receiveChannel.readyState);
			};
			context.receiveChannel.onopen = onReceiveChannelStateChange;
			context.receiveChannel.onclose = onReceiveChannelStateChange;
		};

		console.log('Answering '+username+'.');
		GAME.net.emit('answer', username, function (hostDesc) {
			console.log('Remote desc from connection \n' + hostDesc.sdp);
			var context = GAME.net.ConnectionP2P;
			context.connection.setRemoteDescription(new RTCSessionDescription(hostDesc));
			context.connection.createAnswer(function (localDesc) {
				context.connection.setLocalDescription(localDesc);
				GAME.net.emit('peerDesc', localDesc);
			});
		});
	},

	host: function () {
		var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
		if(RTCPeerConnection == undefined)
		alert('Your browser is not supported or you have to turn on flags. In chrome'+
		' you go to chrome://flags and turn on Enable PeerConnection remember '+
		'to restart chrome');
		// TODO: Remove.
		this.servers = { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] };
		this.connection = new RTCPeerConnection(this.servers, {optional: [{RtpDataChannels: true}]});
		this.connection.onicecandidate = function (event) {
			console.log('local ice callback');
			if (event.candidate)
				GAME.net.emit('candidate', event.candidate);
		};

		console.log('Hosting.');

		try {
			this.sendChannel = this.connection.createDataChannel('sendDataChannel', {reliable: false});
			console.log('Created send data channel.');
		} catch (e) {
			console.log('Create Data channel failed with exception: ' + e.message);
		}

		var context = GAME.net.ConnectionP2P;
		var onSendChannelStateChange = function () {
			var readyState = context.sendChannel.readyState;
			console.log('Send channel state is: ' + readyState);
			if (readyState == 'open') {
			} else {
			}
		}
		this.sendChannel.onopen = onSendChannelStateChange;
		this.sendChannel.onclose = onSendChannelStateChange;

		this.connection.createOffer(function (localDesc) {
			context.connection.setLocalDescription(localDesc);
			GAME.net.emit('offer', localDesc);
		});
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
		this.connection.close();
		this.connection.close();
		this.connection = null;
		this.connection = null;
		console.log('Closed peer connections');
	}
};