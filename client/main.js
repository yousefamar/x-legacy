(function() {
	const TICK_INTERVAL_MS = 1000.0/60.0;

	GAME.game = this;
	var game = GAME.game;

	var tickList = [];

	// TODO: Structure.
	function buildScene() {
		game.scene = new GAME.world.Scene();

		game.scene.addEventListener('ready', function(){
			console.log('Physics Engine initialised.');
		});

		//game.scene.setGravity(new THREE.Vector3( 0, -30, 0 ));

		game.player = new GAME.player.Player(game.scene);
		game.player.position.y = 40;
		game.player.position.z = 20;
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



		var sky = new THREE.Object3D();
		sky.position = game.player.position;

		//starCoords = [new THREE.Vector2(10, 10), new THREE.Vector2(20, 20)];
		//starSizes = [1.0, 1.0];

		var time = 0.0;

		var skyMat = new THREE.ShaderMaterial(GAME.shaders.sky);
		skyMat.side = THREE.BackSide;
		var skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 8, 4, 0, 2 * Math.PI, 0, Math.PI * 0.5), skyMat);
		//skyMesh.rotation.y = -0.5 * Math.PI;
		sky.add(skyMesh);
		//sky.add(new THREE.Mesh(new THREE.SphereGeometry(1000, 8, 4, 0, 2 * Math.PI, 0, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: 0x00EE00/*0x220044*/, wireframe: true, transparent: true })));
		
		var sunHemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.05);
		//hemiLight.color.setHSL(0.6, 1, 0.6);
		//hemiLight.groundColor.setHSL(0.095, 1, 0.75);
		sunHemiLight.position.set(0.0, 1000.0, 0.0);
		sky.add(sunHemiLight);
		var sunDirLight = new THREE.DirectionalLight(0xFFFFFF, 0.0);
		game.player._sun = new THREE.Object3D();
		sunDirLight.position = game.player._sun.position;
		sunDirLight.position.set(20.0, 0.0, 0.0);
		sunDirLight.castShadow = true;
		sunDirLight.shadowMapWidth = 2048;
		sunDirLight.shadowMapHeight = 2048;
		sunDirLight.shadowCameraRight = 20;
		sunDirLight.shadowCameraLeft = -20;
		sunDirLight.shadowCameraTop = 20;
		sunDirLight.shadowCameraBottom = -20;
		sunDirLight.shadowCameraNear = 1;
		sunDirLight.shadowCameraFar = 40;
		//sunDirLight.shadowBias = 0.001;
		//sunDirLight.shadowCameraVisible = true;
		sunDirLight.target = game.player;
		sky.add(sunDirLight);

		sky.tick = function (delta) {
			time = 0.25;//(time+0.001)%1.0;
			GAME.shaders.sky.uniforms.time.value = time;
			var height = Math.sin(time*2.0*Math.PI);
			game.player._sun.position.set(20.0*Math.cos(time*2.0*Math.PI), 20.0*height, 0.0);
			sunDirLight.intensity = 0.5*height;
			sunDirLight.shadowDarkness = 0.5*sunDirLight.intensity;
			//sunHemiLight.intensity = 0.5*height;
			sunHemiLight.groundColor.setHSL(0.7, 1.0, 0.25+(0.375*(height+1.0)));
			game.scene.entityManager.tickQueue.add(this);
		};
		game.scene.entityManager.tickQueue.add(sky);
		game.scene.add(sky);


		var spotLight = new THREE.SpotLight(0xFFFFFF, 1, 1000);
		spotLight.position.set(10, 64, 10);
		spotLight.castShadow = true;
		//spotLight.shadowCameraVisible = true;
		spotLight.shadowCameraNear = 5;
		spotLight.shadowCameraFar = 500;
		//spotLight.shadowCameraRight = 50;
		//spotLight.shadowCameraLeft = -50;
		//spotLight.shadowCameraTop = 50;
		//spotLight.shadowCameraBottom = -50;
		spotLight.shadowMapWidth = 1024;
		spotLight.shadowMapHeight = 1024;
		spotLight.tick = function (delta) {
			this.intensity = 1.0-(0.5*(Math.sin(time*2.0*Math.PI)+1.0));
			this.shadowDarkness = 0.5*this.intensity;
			game.scene.entityManager.tickQueue.add(this);
		};
		game.scene.entityManager.tickQueue.add(spotLight);
		game.scene.add(spotLight);


		var water = new THREE.Mesh(new THREE.PlaneGeometry(2048, 2048), new THREE.MeshBasicMaterial({ color: 0x1C6BA0/*, opacity: 0.5*/ }));
		water.lookAt(new THREE.Vector3(0,1,0));
		water.position.y = 1.0;
		game.scene.add(water);


		var terrainGeom = new THREE.PlaneGeometry(1024, 1024, 256, 256);
		var seed = 0;
		console.log('Generating terrain...');
		for (var i = 0; i < terrainGeom.vertices.length; i++) {
			var vertex = terrainGeom.vertices[i];
			var x = vertex.x>>2, z = vertex.y>>2;
			var fade = (Math.abs(x*x)+Math.abs(z*z))/16384.0;
			fade = fade>1.0?0.0:1.0-fade;
			vertex.z = ((GAME.utils.noise.perlin2D(seed, x+128, z+128)+1.0)/2.0) * fade * 64.0;
		}
		terrainGeom.computeFaceNormals();
		terrainGeom.computeVertexNormals();
		
		var terrainMat = new THREE.ShaderMaterial(GAME.shaders.terrain);
		terrainMat.fog = true;
		terrainMat.lights = true;
		terrain = new Physijs.HeightfieldMesh(terrainGeom, terrainMat, 0);
		terrain.lookAt(new THREE.Vector3(0,1,0));
		terrain.receiveShadow = true;
		console.log('Done.');
		game.scene.add(terrain);


		game.scene.add(new THREE.FogExp2(0xEFD1B5, 0.0025));


		var monolith = new Physijs.BoxMesh(new THREE.CubeGeometry(2, 10, 2), new THREE.MeshPhongMaterial({ color: 0xFF0000 }));
		monolith.position.y = 40;
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
		spotLight.target = monolith;
		game.scene.add(monolith);

		var loader = new THREE.JSONLoader();
		loader.load('models/portalradio/portalradio.js', function (geometry, materials) {
				var radioCollider = new Physijs.BoxMesh(new THREE.CubeGeometry(0.5, 0.5, 0.25), new THREE.MeshBasicMaterial({ color: 0x00EE00, wireframe: true, transparent: true }));
				radioCollider.position.x = -10;
				radioCollider.position.y = 37;
				//radioCollider.setCcdMotionThreshold(0.5);
				//radioCollider.setCcdSweptSphereRadius(0.1);
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

		tickList.push(game.scene);
	}

	function init() {
		Physijs.scripts.worker = './physics/physijs_worker.js';
		Physijs.scripts.ammo = './ammo.js';

		buildScene();
		GAME.input.init(game.scene, game.player);

		game.renderer = new THREE.WebGLRenderer({ antialias: true });
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