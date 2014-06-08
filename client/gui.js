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