GAME.namespace('entities').EntityManager = function (scene) {
	this.scene = scene;

	// TODO: Extend to all entities.
	this.players = {};

	this.tickQueue = new GAME.utils.Queue();
};

GAME.entities.EntityManager.prototype.spawnPlayer = function(user, state) {
	this.players[user.name] = new GAME.player.Player(this.scene).addModel();
	this.players[user.name].serverState = state;
	this.players[user.name].position.copy(state.pos);
	this.players[user.name].rotation.copy(state.rot);
	this.tickQueue.add(this.players[user.name]);
	this.scene.add(this.players[user.name]);
};

GAME.entities.EntityManager.prototype.despawnPlayer = function(user) {
	this.scene.remove(this.players[user.name]);
	this.players[user.name].despawned = true;
	delete this.players[user.name];
};

GAME.entities.EntityManager.prototype.tick = function(delta) {
	for (var i = 0, size = this.tickQueue.size; i < size; i++)
		this.tickQueue.poll().tick(delta);
};