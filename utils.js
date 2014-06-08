'use strict';
var GAME = (typeof GAME == 'undefined' || !GAME)?{}:GAME;

GAME.namespace = function() {
	var a = arguments,
		o = null,
		i, j, d;
	for (i = 0; i < a.length; i = i + 1) {
		d = ('' + a[i]).split('.');
		o = GAME; /* GAME is implied, so it is ignored if it is included */
		for (j = (d[0] == 'GAME') ? 1 : 0; j < d.length; j = j + 1) {
			o[d[j]] = o[d[j]] || {};
			o = o[d[j]];
		}
	}
	return o;
};

GAME.namespace('utils').getRoot = function() {
	return 'https://dl.dropbox.com/u/704818/Escape%20Pod/Games/';
};

GAME.namespace('utils').include = function(filename) {
	//TODO: Fix asynchronicity.
	var script = document.createElement('script');
	script.async = false;
	script.src = filename;
	document.getElementById('includes').appendChild(script);
	//appendChild(document.createTextNode("<script type=\"text/javascript\" src=\""+filename+"\"></script>"));
};