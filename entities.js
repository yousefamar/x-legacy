GAME.namespace('entities').EntityManager = function (scene) {
	this.tickQueue = new GAME.utils.Queue();



};

GAME.entities.EntityManager.prototype.tick = function(delta) {
	for (var i = 0, size = this.tickQueue.size; i < size; i++)
		this.tickQueue.poll().tick(delta);
};