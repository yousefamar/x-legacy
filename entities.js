GAME.namespace('entities').EntityManager = function (scene) {
	this.tickQueue = new GAME.utils.Queue();



};

GAME.entities.EntityManager.prototype.tick = function() {
	for (var size = this.tickQueue.size, i = 0; i < size; i++)
		this.tickQueue.poll().tick();
};