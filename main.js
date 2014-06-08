(function() {
	var player, camera, scene, renderer, stats, monolithSound, monolith, collisionCounter=0;
	var time = Date.now();

	//TODO: Structure.
	function buildScene() {
		scene = new GAME.world.Scene();

		//scene.setGravity(new THREE.Vector3( 0, -30, 0 ));

		var sunLight = new THREE.HemisphereLight(0xFFFFFF, 0x00FF00, 0.1);
		scene.add(sunLight);

		var light = new THREE.SpotLight(0xFFFFFF, 1, 1000);
		light.position.set(10, 14, 10);
		light.castShadow = true;
		//light.shadowCameraVisible = true;
		light.shadowCameraNear = 5;
		light.shadowCameraFar = 500;
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

		monolith = new Physijs.BoxMesh(new THREE.CubeGeometry(2, 10, 2), new THREE.MeshPhongMaterial({ color: 0xFF0000 }));
		monolith.position.y = 5;
		monolith.castShadow = true;
		monolith.receiveShadow = true;
		monolith.addEventListener('collision', function(other_object, relative_velocity, relative_rotation) {
			if (other_object instanceof Physijs.SphereMesh) {
				collisionCounter++;
				if (collisionCounter >= 100) {
					monolith.setLinearVelocity(new THREE.Vector3(0,20,0));
					monolith.setAngularVelocity(new THREE.Vector3(1,1,1));
					collisionCounter = 0;
				}
			}
		});
		light.target = monolith;
		scene.add(monolith);

		monolithSound = new GAME.audio.AudioSource(['sounds/376737_Skullbeatz___Bad_Cat_Maste.mp3', 'sounds/376737_Skullbeatz___Bad_Cat_Maste.ogg'], 21, 1);
		monolithSound.position.copy(monolith.position);
		monolithSound.play(true);

		player = new GAME.player.Player(scene);
		player.position.y = 1;
		player.position.z = 20;
		player.controller = new GAME.player.PlayerController(scene, player);
		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight);//, 1, 10000 );
		player.head.add(camera);
		//player.add(new THREE.PointLight(0xFFFF00, 0.15, 20));
		// TODO: Consider restructuring to make PlayerController superior.
		player.tick = function () {
			//player.controller.isOnObject(player.position.y<=10);
			player.controller.update(Date.now() - time);
			time = Date.now();
			scene.entityManager.tickQueue.add(this);
		};
		scene.entityManager.tickQueue.add(player);

		// TODO: Do something about this.
		//player.position.z = 200;
		scene.add(player);
	}

	function init() {
		Physijs.scripts.worker = './physics/physijs_worker.js';
		Physijs.scripts.ammo = './ammo.js';

		buildScene();
		GAME.input.init(scene, player);

		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;

		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = 0;
		//stats.domElement.style.zIndex = 100;
		//stats.setMode(1);
		document.body.appendChild(stats.domElement);

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
		requestAnimationFrame(render);

		var scaleFactor = Math.max(1, 1+(0.02*Math.sin(wave)));
		monolith.scale.set(scaleFactor, scaleFactor, scaleFactor);
		wave += clock.getDelta()*11;

		scene.tick();

		stats.begin();
		renderer.render(scene, camera);
		stats.end();

		monolithSound.update(player.position);
	}

	this.main = function() {
		init();
		requestAnimationFrame(render);
	};
}).apply(GAME.namespace('core.Main'));