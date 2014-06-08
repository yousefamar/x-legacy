(function() {
	var player, camera, controller, scene, renderer, monolithSound, monolith, collisionCounter=0;
	var time = Date.now();

	//TODO: Structure.
	function buildScene() {
		scene = new Physijs.Scene();

		scene.setGravity(new THREE.Vector3( 0, -30, 0 ));

		var sunLight = new THREE.HemisphereLight(0xFFFFFF, 0x00FF00, 0.1);
		scene.add(sunLight);

		var light = new THREE.SpotLight(0xFFFFFF, 1, 1000);
		light.position.set(100, 140, 100);
		light.castShadow = true;
		//light.shadowCameraVisible = true;
		//light.shadowCameraRight = 50;
		//light.shadowCameraLeft = -50;
		//light.shadowCameraTop = 50;
		//light.shadowCameraBottom = -50;
		light.shadowMapWidth = 1024;
		light.shadowMapHeight = 1024;
		scene.add(light);

		var ground = new Physijs.PlaneMesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), new THREE.MeshPhongMaterial({ color: 0x00FF00 }), 0);
		ground.lookAt(new THREE.Vector3(0,1,0));
		ground.receiveShadow = false;
		ground.receiveShadow = true;
		scene.add(ground);

		monolith = new Physijs.BoxMesh(new THREE.CubeGeometry(20, 100, 20), new THREE.MeshPhongMaterial({ color: 0xFF0000 }));
		monolith.position.y = 50;
		monolith.castShadow = true;
		monolith.receiveShadow = true;
		monolith.addEventListener('collision', function(other_object, relative_velocity, relative_rotation) {
			if (other_object instanceof Physijs.SphereMesh) {
				collisionCounter++;
				if (collisionCounter >= 100) {
					monolith.setLinearVelocity(new THREE.Vector3(0,100,0));monolith.setAngularVelocity(new THREE.Vector3(1,1,1));
					collisionCounter = 0;
				}
			}
		});
		light.target = monolith;
		scene.add(monolith);

		monolithSound = new GAME.audio.AudioSource(['sounds/376737_Skullbeatz___Bad_Cat_Maste.mp3', 'sounds/376737_Skullbeatz___Bad_Cat_Maste.ogg'], 200, 1);
		monolithSound.position.copy(monolith.position);
		monolithSound.play(true);

		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight);//, 1, 10000 );
		player = new THREE.Object3D();
		player.add(camera);
		//player.add(new THREE.PointLight(0xFFFF00, 0.15, 20));

		controller = new GAME.playerController.PlayerController(player);
		controller.getObject().position.z = 200;
		GAME.input.init(scene, camera, controller);
		scene.add(controller.getObject());
	}

	function init() {
		Physijs.scripts.worker = './physics/physijs_worker.js';
		Physijs.scripts.ammo = './ammo.js';

		buildScene();


		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;

		window.addEventListener('resize', function(){
			camera.aspect = window.innerWidth/window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);

		document.getElementById('game').insertBefore(renderer.domElement, document.getElementById('overlay'));
	}

	var clock = new THREE.Clock();
	var wave = 0;

	function render() {
		// note: three.js includes requestAnimationFrame shim
		requestAnimationFrame(render);

		var scaleFactor = Math.max(1, 1+(0.02*Math.sin(wave)));
		monolith.scale.set(scaleFactor, scaleFactor, scaleFactor);
		wave += clock.getDelta()*11;

		//controller.isOnObject(controller.getObject().position.y<=10);
		controller.update(Date.now() - time);

		scene.simulate();

		renderer.render(scene, camera);
		
		monolithSound.update(controller.getObject().position);

		time = Date.now();
	}

	this.main = function() {
		init();
		render();
	};
}).apply(GAME.namespace('core.Main'));