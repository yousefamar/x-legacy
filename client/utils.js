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

// TODO: Organise.

GAME.namespace('utils').include = function(filename) {
	//TODO: Fix asynchronicity.
	var script = document.createElement('script');
	script.async = false;
	script.src = filename;
	document.getElementById('includes').appendChild(script);
	//appendChild(document.createTextNode("<script type=\"text/javascript\" src=\""+filename+"\"></script>"));
};

GAME.utils.getRoot = function() {
	return 'https://dl.dropbox.com/u/704818/Escape%20Pod/Games/';
};

GAME.utils.centerElement = function(element) {
	element.style.marginLeft = (-parseInt(element.clientWidth)/2)+"px";
	element.style.marginTop = (-parseInt(element.clientHeight)/2)+"px";
};

GAME.utils.Queue = function () {
	this.size = 0;
};

// TODO: Consider implementing multiple parameter functionality or an array of elements as a parameter.
GAME.utils.Queue.prototype.add = function (element) {
	if (element) {
		this.tail = this.tail ? this.tail.next = {e: element} : this.head = {e: element};
		this.size++;
	}
	return this;
};

GAME.utils.Queue.prototype.poll = function () {
	var element = this.head ? this.head.e : undefined;
	if (element) {
		this.head = this.head == this.tail ? this.tail = undefined : this.head.next;
		this.size--;
	}
	return element;
};