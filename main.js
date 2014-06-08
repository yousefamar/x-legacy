(function() {
	const TICK_INTERVAL_MS = 1000.0/60.0;

	var player, camera, scene, renderer, statsTick, statsRender, monolithSound, monolith, collisionCounter=0;

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
		//monolithSound.play(true);

		var otherPlayer = new GAME.player.Player(scene).addModel();
		otherPlayer.position.x = -20;
		scene.add(otherPlayer);

		player = new GAME.player.Player(scene);
		player.position.y = 1;
		player.position.z = 20;
		player.controller = new GAME.player.PlayerController(scene, player);
		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight);//, 1, 10000 );
		player.head.add(camera);
		//player.add(new THREE.PointLight(0xFFFF00, 0.15, 20));
		// TODO: Consider restructuring to make PlayerController superior.
		player.tick = function (delta) {
			//player.controller.isOnObject(player.position.y<=10);
			player.controller.update(delta);
			scene.entityManager.tickQueue.add(this);
		};
		scene.entityManager.tickQueue.add(player);

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

		var overlay = document.getElementById('overlay');
		statsTick = new Stats();
		//statsTick.domElement.style.position = 'absolute';
		//statsTick.domElement.style.top = 0;
		//statsRender.domElement.style.zIndex = 100;
		//statsRender.setMode(1);
		overlay.appendChild(statsTick.domElement);
		statsRender = new Stats();
		//statsRender.domElement.style.position = 'absolute';
		//statsRender.domElement.style.top = 0;
		//statsRender.domElement.style.zIndex = 100;
		//statsRender.setMode(1);
		overlay.appendChild(statsRender.domElement);

		window.addEventListener('resize', function(){
			camera.aspect = window.innerWidth/window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);

		document.getElementById('game').insertBefore(renderer.domElement, document.getElementById('overlay'));
	}

	var clock = new THREE.Clock();
	var wave = 0;

	function tick() {
		setTimeout(tick, TICK_INTERVAL_MS);

		var delta = clock.getDelta();

		var scaleFactor = Math.max(1, 1+(0.02*Math.sin(wave)));
		monolith.scale.set(scaleFactor, scaleFactor, scaleFactor);
		wave += delta*11;

		statsTick.begin();
		scene.tick(delta);
		statsTick.end();

		monolithSound.update(player.position);
	}

	function render() {
		requestAnimationFrame(render);

		statsRender.begin();
		renderer.render(scene, camera);
		statsRender.end();
	}

	this.main = function() {
		init();
		setTimeout(tick, TICK_INTERVAL_MS);
		requestAnimationFrame(render);
	};
}).apply(GAME.namespace('core.Main'));