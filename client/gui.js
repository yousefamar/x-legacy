GAME.namespace('gui').init = function() {
	GAME.gui.transitionEnd=	'ontransitionend' in window ? 'transitionend' :
							'onwebkittransitionend' in window ? 'webkitTransitionEnd' :
							//('onotransitionend' in myDiv || navigator.appName == 'Opera') ? 'oTransitionEnd' :
							false;

	var overlay = document.getElementById('overlay');
	GAME.gui.statsTick = new Stats();
	//statsTick.domElement.style.position = 'absolute';
	//statsTick.domElement.style.top = 0;
	//statsRender.domElement.style.zIndex = 100;
	//statsRender.setMode(1);
	overlay.appendChild(GAME.gui.statsTick.domElement);
	GAME.gui.statsRender = new Stats();
	//statsRender.domElement.style.position = 'absolute';
	//statsRender.domElement.style.top = 0;
	//statsRender.domElement.style.zIndex = 100;
	//statsRender.setMode(1);
	overlay.appendChild(GAME.gui.statsRender.domElement);

	// TODO: Modularise GUI.
	/*
	var clientForm = document.getElementById('clientForm');
	var onTransitionEnd = function() {
		clientForm.console.scrollTop = clientForm.console.scrollHeight - clientForm.console.clientHeight;
	};
	clientForm.console.addEventListener(transitionEnd, onTransitionEnd, false);
	*/
};

GAME.gui.setChatFocus = function (flag, scope) {
	scope.form.console.className = flag?'maxSize fadeIn':'minSize fadeOut';
	document.getElementById('passiveChat').className = flag?'fadeOut':'fadeIn';
};

GAME.gui.log = function (text) {
	var clientForm = document.getElementById('clientForm');
	clientForm.console.value += text+"\n";
	clientForm.console.scrollTop = clientForm.console.scrollHeight - clientForm.console.clientHeight;
	
	var chatLine = document.createElement('div');
	chatLine.appendChild(document.createTextNode(text));
	//chatLine.appendChild(document.createElement('br'));
	var passiveChat = document.getElementById('passiveChat');
	passiveChat.appendChild(chatLine);

	setTimeout(function(){chatLine.className='fadeOut';}, 10000);
	chatLine.addEventListener(GAME.gui.transitionEnd, function(){
		passiveChat.removeChild(passiveChat.firstChild);
	}, false);
};

GAME.gui.submitConsoleInput = function (form) {
	var text = form.input.value.trim();
	form.input.value = '';
	if (!text.length) return;

	if (text.charAt(0) == '/') {
		var input = text.split(' ');
		var cmd = input[0].substring(1);
		var args = input.slice(1);

		// TODO: Build event-handler system.
		// TODO: Error detection, case-sesitivity, non-existent host, success notification, etc.
		switch(cmd) {
		case 'join':
			if (args.length > 0)
				GAME.net.p2p.join(args[0]);
			else
				GAME.gui.log('Join syntax: "/join [HostID]".');
			break;
		case 'host':
			GAME.net.p2p.host();
			break;
		case 'time':
			if (args.length > 0)
				GAME.game.time = parseFloat(args[0])%1.0;
			else
				GAME.gui.log('Time syntax: "/time [0.0-1.0)".');
			break;
		default:
			GAME.gui.log('Invalid command.');
			break;
		}
	} else {
		GAME.net.p2p.send('chat', text);
		GAME.gui.log('You: '+text);
		GAME.audio.loadSpeech(text, function (audioElement) {
			var source = new GAME.audio.AudioSourceStreaming(audioElement);
			// TODO: Avoid static calls.
			// TODO: Follow position while still playing.
			source.setPosition(GAME.game.camera.localToWorld(new THREE.Vector3()));
			source.play();
		});
	}
};