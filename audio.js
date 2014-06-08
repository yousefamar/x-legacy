GAME.namespace('audio').AudioSource = function (sources, radius, volume) {

	var audio = document.createElement('audio');

	for (var i = 0; i < sources.length; i ++) {
		var source = document.createElement('source');
		source.src = sources[i];
		audio.appendChild(source);
	}

	this.position = new THREE.Vector3();

	this.play = function () {
		audio.play();
	}

	this.update = function (earPos) {
		var distance = this.position.distanceTo(earPos);
		audio.volume = distance<=radius?(volume * (1 - distance/radius)):0;
	}
}