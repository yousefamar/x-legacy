// TODO: Release to the general public.

GAME.namespace('player').Player = function (scene) {
	THREE.Object3D.call(this);

	this.head = new THREE.Object3D();
	this.head.position.y = 0.75;
	this.add(this.head);
};

GAME.player.Player.prototype = Object.create(THREE.Object3D.prototype);

GAME.player.Player.prototype.addModel = function() {
	var player = this;

	var loader = new THREE.JSONLoader();
	loader.load('models/player/head.js', function (geometry, materials) {
			//var material = geometry.materials[0];
			var skinnedMesh = new Physijs.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
			//var materials = skinnedMesh.material.materials; 
			//for (var i = 0, length = materials.length; i < length; i++)
			//	materials[i].skinning = true;
			
			/*
			THREE.AnimationHandler.add(skinnedMesh.geometry.animation);
			var animation = new THREE.Animation(skinnedMesh, "walk", THREE.AnimationHandler.CATMULLROM);
			animation.play();

			skinnedMesh.tick = function (delta) {
				animation.update(delta);
				scene.entityManager.tickQueue.add(this);
			};
			scene.entityManager.tickQueue.add(skinnedMesh);
			*/

			player.head.add(skinnedMesh);
		}
	);

	return this;
};


/**
 * @author mrdoob / http://mrdoob.com/
 * Modified by Paraknight 2013-03-26.
 */

// TODO: Restructure and use only Object3Ds.
GAME.player.PlayerController = function (scene, player) {
	player.collider = new Physijs.CapsuleMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.8), new THREE.MeshPhongMaterial({ color: 0xFFFFFF }));
	player.collider.position = player.position;
	player.collider.addEventListener('collision',
			function(other_object, relative_velocity, relative_rotation) {
				//console.log(relative_velocity);
			});
	scene.add(player.collider);

	//player.collider.setDamping(0.99, 1.0);
	var constraint = new Physijs.DOFConstraint(player.collider, new THREE.Vector3());
	scene.addConstraint(constraint);
	// TODO: Remove hardcoding.
	//constraint.setLinearLowerLimit(new THREE.Vector3(-500, -20, -700));
	//constraint.setLinearUpperLimit(new THREE.Vector3(500, 900, 300));
	constraint.setLinearLowerLimit(new THREE.Vector3(-Infinity, -Infinity, -Infinity));
	constraint.setLinearUpperLimit(new THREE.Vector3(Infinity, Infinity, Infinity));
	constraint.setAngularLowerLimit(new THREE.Vector3(0, 0, 0));
	constraint.setAngularUpperLimit(new THREE.Vector3(0, 0, 0));

	var scope = this;

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	document.addEventListener('mousemove',
			function (event) {
				if ( scope.enabled === false ) return;

				var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
				var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

				player.rotation.y -= movementX * 0.002;
				player.head.rotation.x -= movementY * 0.002;

				player.head.rotation.x = Math.max(-PI_2, Math.min(PI_2, player.head.rotation.x));
			}, false);

	document.addEventListener('keydown',
			function (event) {
				switch (event.keyCode) {
					case 38: // up
					case 87: // w
						moveForward = true;
						break;
					case 37: // left
					case 65: // a
						moveLeft = true; break;
					case 40: // down
					case 83: // s
						moveBackward = true;
						break;
					case 39: // right
					case 68: // d
						moveRight = true;
						break;
					case 32: // space
						// TODO: Make player height an attribute of Player.
						if (distToGround() < 0.9001) velocity.y = 10;
						break;
				}
			}, false);

	document.addEventListener('keyup',
			function (event) {
				switch(event.keyCode) {
					case 38: // up
					case 87: // w
						moveForward = false;
						break;
					case 37: // left
					case 65: // a
						moveLeft = false;
						break;
					case 40: // down
					case 83: // a
						moveBackward = false;
						break;
					case 39: // right
					case 68: // d
						moveRight = false;
						break;
				}
			}, false);

	this.enabled = false;

	var rayCaster = new THREE.Raycaster();
	rayCaster.ray.direction.set( 0, -1, 0 );

	// TODO: Consider adding this function to the Player prototype.
	function distToGround() {
		rayCaster.ray.origin.copy(player.position);
		//rayCaster.ray.origin.y -= 10;

		var intersections = rayCaster.intersectObject(scene, true);
		return intersections.length>0 ? intersections[0].distance : -1;
	}

	this.update = function (delta) {
		// TODO: Make diagonal movement the same speed as vertical and horizontal by clamping small velocities to 0 and normalizing.

		if (!scope.enabled) return;

		delta *= 100;

		if (moveForward) velocity.z = -delta;
		if (moveBackward) velocity.z = delta;

		if (moveLeft) velocity.x = -delta;
		if (moveRight) velocity.x = delta;

		//player.localToWorld(velocity).sub(player.position).length() < 0.01 ? velocity.set(0,0,0) : velocity.normalize().multiplyScalar(10);

		//if (moveForward || moveBackward || moveLeft || moveRight || velocity.y == 10) 
		
		var horiDamping = 1-delta*0.1;
		player.collider.setLinearVelocity(new THREE.Vector3().copy(player.collider.getLinearVelocity()).multiply(new THREE.Vector3(horiDamping, 1, horiDamping)).add(player.localToWorld(velocity).sub(player.position)));

		velocity.set(0,0,0);
	};

};