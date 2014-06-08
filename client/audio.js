GAME.namespace('audio').context = new webkitAudioContext();

GAME.audio.load = function (sources, callback, stream) {
	if (stream) {
		// TODO: Investigate new Audio();
		var audio = new Audio();//document.createElement('audio');
		/*for (var i = 0; i < sources.length; i ++) {
			var source = document.createElement('source');
			source.src = sources[i];
			audio.appendChild(source);
		}*/
		audio.src = sources[0];
		callback(new GAME.audio.AudioSourceStreaming(audio));
	} else {
		var request = new XMLHttpRequest();
		request.open('GET', sources[0], true);
		request.responseType = 'arraybuffer';
		request.onload = function() {
			GAME.audio.context.decodeAudioData(request.response, function(buffer){
				callback(new GAME.audio.AudioSourceBuffered(buffer));
				// TODO: Handle error case.
			});
		}
		request.send();
	}
};

GAME.audio.tick = function (delta, game) {
	var camWorldPos = game.camera.localToWorld(new THREE.Vector3());
	var camLookVec = game.camera.localToWorld(new THREE.Vector3(0, 0, -1)).sub(camWorldPos).normalize();

	GAME.audio.context.listener.setPosition(camWorldPos.x, camWorldPos.y, camWorldPos.z);
	// TODO: If rolling, calculate up vector too.
	GAME.audio.context.listener.setOrientation(camLookVec.x, camLookVec.y, camLookVec.z, 0, 1, 0);
};

GAME.audio.AudioSourceBuffered = function (buffer) {
	THREE.Object3D.call(this);

	this.buffer = buffer;

	this.panner = GAME.audio.context.createPanner();
	this.analyser = GAME.audio.context.createAnalyser();
	this.panner.connect(this.analyser);
	this.analyser.connect(GAME.audio.context.destination);
};

GAME.audio.AudioSourceBuffered.prototype = Object.create(THREE.Object3D.prototype);

GAME.audio.AudioSourceBuffered.prototype.setPosition = function(position) {
	this.panner.setPosition(position.x, position.y, position.z);
};

GAME.audio.AudioSourceBuffered.prototype.play = function(loop) {
	var source = GAME.audio.context.createBufferSource();
	source.buffer = this.buffer;
	source.loop = loop;
	source.connect(this.panner);
	source.noteOn(0);
};

GAME.audio.AudioSourceStreaming = function (audioElement) {
	THREE.Object3D.call(this);

	this.audioElement = audioElement;

	this.panner = GAME.audio.context.createPanner();
	this.analyser = GAME.audio.context.createAnalyser();
	this.panner.connect(this.analyser);
	this.analyser.connect(GAME.audio.context.destination);
};

GAME.audio.AudioSourceStreaming.prototype = Object.create(THREE.Object3D.prototype);

GAME.audio.AudioSourceStreaming.prototype.setPosition = function(position) {
	this.panner.setPosition(position.x, position.y, position.z);
};

GAME.audio.AudioSourceStreaming.prototype.play = function(loop) {
	var scope = this;
	setTimeout(function(){
		var source = GAME.audio.context.createMediaElementSource(scope.audioElement);
		source.connect(scope.panner);
		scope.audioElement.loop = loop;
		scope.audioElement.play();
	}, 0);
};

/*
GAME.audio.StreamingSource = function (game, sources, position, radius, volume) {
	radius = radius || 20;
	volume = volume || 1;

	this.position = position || new THREE.Vector3();

	var audio = document.createElement('audio');

	for (var i = 0; i < sources.length; i ++) {
		var source = document.createElement('source');
		source.src = sources[i];
		audio.appendChild(source);
	}

	this.play = function (loop) {
		audio.loop = loop;
		audio.play();
	}

	this.tick = function() {
		var distance = this.position.distanceTo(game.player.position);
		audio.volume = distance<=radius?(volume * (1 - distance/radius)):0;
		game.scene.entityManager.tickQueue.add(this);
	};
	game.scene.entityManager.tickQueue.add(this);
};
*/