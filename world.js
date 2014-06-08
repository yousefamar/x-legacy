GAME.namespace('world').Scene = function () {
	Physijs.Scene.call(this);

	this.entityManager = new GAME.entities.EntityManager(this);
};

GAME.world.Scene.prototype = Object.create(Physijs.Scene.prototype);

GAME.world.Scene.prototype.add = function(entity) {
	//TODO: Make the super class a prototype variable if it's used elsewhere.
	Physijs.Scene.prototype.add.call(this, entity);


};

GAME.world.Scene.prototype.tick = function(delta) {
	this.entityManager.tick(delta);
	this.simulate();
};