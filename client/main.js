(function() {
	const TICK_INTERVAL_MS = 1000.0/60.0;

	GAME.game = this;
	var game = GAME.game;

	var tickList = [];

	// TODO: Structure.
	function buildScene() {
		game.scene = new GAME.world.Scene();

		//game.scene.setGravity(new THREE.Vector3( 0, -30, 0 ));

		var sky = new THREE.Object3D();

		//starCoords = [new THREE.Vector2(10, 10), new THREE.Vector2(20, 20)];
		//starSizes = [1.0, 1.0];

		var uniforms = {
			skyRadius: { type: 'f', value: 1000.0 },
			time: { type: 'f', value: 0.0 },
			//lookVec: { type: 'v3', value: new THREE.Vector3(0, 0, -1) }
			//starCoords: { type: "v2v", value: starCoords },
			//starSizes: { type: "fv1", value: starSizes }
			//starMap: { type: "t", value: THREE.ImageUtils.loadTexture( "./images/starmap.png" ) }
		};
		var starfieldMat = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: GAME.utils.xhrSyncGet('./shaders/starfield.vert'), fragmentShader: GAME.utils.xhrSyncGet('./shaders/starfield.frag') });
		starfieldMat.side = THREE.BackSide;
		var starfield = new THREE.Mesh(new THREE.SphereGeometry(1000, 128, 64, 0, 2 * Math.PI, 0, Math.PI * 0.5), starfieldMat);
		//starfield.rotation.y = -0.5 * Math.PI;
		sky.add(starfield);
		//sky.add(new THREE.Mesh(new THREE.SphereGeometry(1000, 128, 64, 0, 2 * Math.PI, 0, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: 0x00EE00/*0x220044*/, wireframe: true, transparent: true })));
		sky.tick = function (delta) {
			uniforms.time.value += 0.01;
			game.scene.entityManager.tickQueue.add(this);
		};
		game.scene.entityManager.tickQueue.add(sky);
		game.scene.add(sky);

		//game.scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0025);

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
		//monolithSound.setLoop(true).play();

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
					source.setLoop(true);
					//source.play();
					radioCollider.addEventListener('collision', function(other_object, relative_velocity, relative_rotation) {
						if (other_object instanceof Physijs.SphereMesh)
							source.getAudioFlag('paused')?source.play():source.pause();
					});
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
		sky.position = game.player.position;
		game.player.controller = new GAME.player.PlayerController(game.scene, game.player);
		game.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
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
		GAME.audio.initMeSpeak();

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