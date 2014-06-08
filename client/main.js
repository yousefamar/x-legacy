(function() {
	const TICK_INTERVAL_MS = 1000.0/60.0;

	var game = this;

	var tickList = [];

	// TODO: Structure.
	function buildScene() {
		game.scene = new GAME.world.Scene();

		//game.scene.setGravity(new THREE.Vector3( 0, -30, 0 ));

		var sunLight = new THREE.HemisphereLight(0xFFFFFF, 0x00FF00, 0.1);
		game.scene.add(sunLight);

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
		game.scene.add(light);

		var ground = new Physijs.PlaneMesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), new THREE.MeshPhongMaterial({ color: 0x00FF00 }), 0);
		ground.lookAt(new THREE.Vector3(0,1,0));
		ground.receiveShadow = false;
		ground.receiveShadow = true;
		game.scene.add(ground);

		var monolith = new Physijs.BoxMesh(new THREE.CubeGeometry(2, 10, 2), new THREE.MeshPhongMaterial({ color: 0xFF0000 }));
		monolith.position.y = 5;
		monolith.castShadow = true;
		monolith.receiveShadow = true;
		var collisionCounter = 0;
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

		//var monolithSound = new GAME.audio.StreamingSource(game, ['audio/monolith.mp3', 'audio/monolith.ogg'], monolith.position);
		//monolithSound.play(true);

		/*
		var wave = 0;
		monolith.tick = function (delta) {
			var scaleFactor = Math.max(1, 1+(0.02*Math.sin(wave)));
			this.scale.set(scaleFactor, scaleFactor, scaleFactor);
			wave += delta*11;
			game.scene.entityManager.tickQueue.add(this);
		};
		game.scene.entityManager.tickQueue.add(monolith);
		*/
		light.target = monolith;
		game.scene.add(monolith);

		var loader = new THREE.JSONLoader();
		loader.load('models/portalradio/portalradio.js', function (geometry, materials) {
				var radioCollider = new Physijs.BoxMesh(new THREE.CubeGeometry(0.5, 0.5, 0.25), new THREE.MeshBasicMaterial({ color: 0x00EE00, wireframe: true, transparent: true }));
				radioCollider.position.x = -10;
				radioCollider.position.y = 2;
				radioCollider.visible = false;
				var radioMesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
				radioMesh.scale.set(2,2,2);
				radioMesh.position.y = 0.08;
				radioMesh.castShadow = true;
				radioMesh.receiveShadow = true;
				radioCollider.add(radioMesh);
				game.scene.add(radioCollider);
				GAME.audio.load(['audio/mplith.ogg'], function(source) {
					source.setPosition(radioCollider.position);
					source.play(true);
					radioMesh.tick = function (delta) {
						source.setPosition(radioCollider.position);
						var freqByteData = new Uint8Array(source.analyser.frequencyBinCount);
						source.analyser.getByteTimeDomainData(freqByteData);
						var scaleFactor = (Math.max.apply(Math, freqByteData)/150)+1;
						this.scale.set(scaleFactor, scaleFactor, scaleFactor);
						game.scene.entityManager.tickQueue.add(this);
					};
					game.scene.entityManager.tickQueue.add(radioMesh);
				}, true);
			}
		);

		game.player = new GAME.player.Player(game.scene);
		game.player.position.y = 1;
		game.player.position.z = 20;
		game.player.controller = new GAME.player.PlayerController(game.scene, game.player);
		game.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);//, 1, 10000);
		game.player.head.add(game.camera);
		//game.player.add(new THREE.PointLight(0xFFFF00, 0.15, 20));
		// TODO: Consider restructuring to make PlayerController superior.
		game.player.tick = function (delta) {
			this.controller.update(delta);
			this.scene.entityManager.tickQueue.add(this);
		};
		game.scene.entityManager.tickQueue.add(game.player);

		game.scene.add(game.player);

		tickList.push(game.scene);
	}

	function init() {
		Physijs.scripts.worker = './physics/physijs_worker.js';
		Physijs.scripts.ammo = './ammo.js';

		buildScene();
		GAME.input.init(game.scene, game.player);

		game.renderer = new THREE.WebGLRenderer();
		game.renderer.setSize(window.innerWidth, window.innerHeight);
		game.renderer.shadowMapEnabled = true;
		game.renderer.shadowMapSoft = true;

		GAME.gui.init();

		window.addEventListener('resize', function(){
			game.camera.aspect = window.innerWidth/window.innerHeight;
			game.camera.updateProjectionMatrix();
			game.renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);

		document.getElementById('game').insertBefore(game.renderer.domElement, document.getElementById('overlay'));

		tickList.push(GAME.audio);

		GAME.net.connectToServer(game, 'http://4ytech.com:9980');
	}

	var clock = new THREE.Clock();

	function tick() {
		setTimeout(tick, TICK_INTERVAL_MS);

		GAME.gui.statsTick.begin();
		var delta = clock.getDelta();
		for (var i = 0; i < tickList.length; i++)
			tickList[i].tick(delta, game);
		GAME.gui.statsTick.end();
	}

	function render() {
		requestAnimationFrame(render);

		GAME.gui.statsRender.begin();
		game.renderer.render(game.scene, game.camera);
		GAME.gui.statsRender.end();
	}

	this.main = function() {
		init();
		setTimeout(tick, TICK_INTERVAL_MS);
		requestAnimationFrame(render);
	};
}).apply(GAME.namespace('core.Main'));