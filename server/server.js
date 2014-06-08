'use strict';
var SERVER = {};

SERVER.utils = {};

SERVER.utils.Queue = function () {
	this.size = 0;
};

// TODO: Consider implementing multiple parameter functionality or an array of elements as a parameter.
SERVER.utils.Queue.prototype.add = function (element) {
	if (element) {
		this.tail = this.tail ? this.tail.next = {e: element} : this.head = {e: element};
		this.size++;
	}
	return this;
};

SERVER.utils.Queue.prototype.poll = function () {
	var element = this.head ? this.head.e : undefined;
	if (element) {
		this.head = this.head == this.tail ? this.tail = undefined : this.head.next;
		this.size--;
	}
	return element;
};

SERVER.io = require('socket.io').listen(9980);

SERVER.io.sockets.on('connection', function (socket) {
	socket.emit('log', { msg: "You've successfully connected to 4YTech.com on port 9980!", mute: true });

	// TODO: Read all of this off of a database.
	socket.on('join', function (user, state) {
		// TODO: Consolidate or use properties for non-persistent data.
		socket.set('user', user, function () {
			socket.set('state', state, function () {
				// TODO: Move to client.
				SERVER.io.sockets.emit('log', { msg: user.name+" has joined the game." });
				socket.broadcast.emit('spawn', user, state);
				SERVER.io.sockets.clients().forEach(function (otherSocket) {
					if (otherSocket === socket) return;
					otherSocket.get('user', function (err, otherUser) {
						otherSocket.get('state', function (err, otherState) {
							socket.emit('spawn', otherUser, otherState);
						});
					});
				});

				socket.latencyInfo = {
					sendTime:	new Date().getTime(),
					lats:		new SERVER.utils.Queue(),
					meanLat:	0
				};

				//socket.emit('ping');
			});
		});
	});

	socket.on('offer', function (sessionDesc) {
		socket.set('sessionDesc', sessionDesc, function () {
			socket.get('user', function (err, user) {
				SERVER.io.sockets.emit('log', { msg: user.name+" is hosting a game." });
			});
		});
	});

	socket.on('answer', function (username, callback) {
		console.log(username);
		console.log(callback);
		var peerFound = false;
		SERVER.io.sockets.clients().forEach(function (otherSocket) {
			if (otherSocket === socket) return;
			otherSocket.get('user', function (err, otherUser) {
				console.log(otherUser.name + ' == ' + username + '?');
				if (otherUser.name == username) {
					console.log('Yes');
					peerFound = true;
					// TODO: Consider using properties for everything.
					otherSocket.peer = socket;
					socket.peer = otherSocket;
					otherSocket.get('sessionDesc', function (err, sessionDesc) {
						// TODO: Handle errors.
						callback(sessionDesc);
					});
				}
			});
		});
		// TODO: Handle all cases.
		if (!peerFound)
			socket.emit('log', { msg: username+' is not online.' });
	});

	socket.on('peerDesc', function (peerDesc) {
		if (socket.peer)
			socket.peer.emit('peerDesc', peerDesc);
	});

	socket.on('candidate', function (candidate) {
		if (socket.peer)
			socket.peer.emit('candidate', candidate);
	});

	socket.on('chat', function (message) {
		socket.get('user', function (err, user) {
			socket.broadcast.emit('chat', { username: user.name, msg: message });
		});
	});

	socket.on('state', function (state) {
		socket.get('user', function (err, user) {
			socket.set('state', state, function () {
				SERVER.io.sockets.clients().forEach(function (otherSocket) {
					if (otherSocket === socket) return;
					var latOffset = 0;//socket.latencyInfo.meanLat + otherSocket.latencyInfo.meanLat;
					otherSocket.volatile.emit('state', user, state, latOffset);
				});
			});
		});
	});

	socket.on('echo', function (string) {
		socket.emit('log', { msg: 'Echo: '+string });
	});

	socket.on('pong', function () {
		socket.latencyInfo.lats.add((new Date().getTime()-socket.latencyInfo.sendTime)/2);
		// TODO: Make latency queue size limit a constant.
		if (socket.latencyInfo.lats.size > 10)
			socket.latencyInfo.lats.poll();

		// TODO: Only subtract head/10 and add tail/10 instead of recalculating the mean every time.
		var newMeanLat = 0;
		for (var element = socket.latencyInfo.lats.head; element; element = element.next)
			newMeanLat += element.e;
		newMeanLat /= socket.latencyInfo.lats.size;
		socket.latencyInfo.meanLat = newMeanLat;

		setTimeout(function () {
			socket.latencyInfo.sendTime = new Date().getTime();
			socket.emit('ping');
		}, 1000);
	});

	socket.on('disconnect', function() {
		socket.get('user', function (err, user) {
			socket.broadcast.emit('despawn', user);
			// TODO: Move to client.
			socket.broadcast.emit('log', { msg: user.name+" has left the game." });
		});
	});
});

/*
var chat = SERVER.io.of('/chat');

chat.on('connection', function (socket) {
	socket.emit('a message', {
		that: 'only',
		'/chat': 'will get'
	});

	chat.emit('a message', {
		everyone: 'in'
		, '/chat': 'will get'
	});
});

var news = SERVER.io.of('/news');

news.on('connection', function (socket) {
	socket.emit('item', { news: 'item' });
});
*/