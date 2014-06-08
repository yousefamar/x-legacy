var io = require('socket.io').listen(9980);

io.sockets.on('connection', function (socket) {
	socket.emit('log', { msg: "You've successfully connected to 4YTech.com on port 9980!" });

	// TODO: Read all of this off of a database.
	socket.on('join', function (user) {
		socket.set('user', user, function () {
			// TODO: Move to client.
			io.sockets.emit('log', { msg: user.name+" has joined the game." });
			socket.broadcast.emit('spawn', user);
			io.sockets.clients().forEach(function (otherSocket) {
				if (otherSocket === socket) return;
				otherSocket.get('user', function (err, otherUser) {
					socket.emit('spawn', otherUser);
				});
			});
		});
	});

	socket.on('chat', function (message) {
		socket.get('user', function (err, user) {
			socket.broadcast.emit('chat', { username: user.name, msg: message });
		});
	});

	socket.on('pos', function (position) {
		socket.get('user', function (err, user) {
			user.pos = position;
			socket.broadcast.volatile.emit('pos', user);
		});
	});

	socket.on('echo', function (string) {
		socket.emit('log', { msg: "Echo: "+string });
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
var chat = io.of('/chat');

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

var news = io.of('/news');

news.on('connection', function (socket) {
	socket.emit('item', { news: 'item' });
});
*/