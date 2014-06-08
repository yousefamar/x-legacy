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

		game.loaderJSON = new THREE.JSONLoader();

		//game.scene.setGravity(new THREE.Vector3( 0, -30, 0 ));

		game.player = new GAME.player.Player(game.scene);
		game.player.position.y = 45;
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

		// TODO: Should player and children cast shadows?
		game.scene.add(game.player);

		game.loaderJSON.load('models/tools/axe.js', function (geometry, materials) {
			var axeMesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
			axeMesh.scale.set(0.5,0.5,0.5);
			axeMesh.position.set(0.5,-game.player.head.position.y,-0.25);
			axeMesh.rotation.set(0,-0.25*Math.PI,0.1*Math.PI);
			game.player.head.add(axeMesh);
			game.player.heldItem = axeMesh;
			axeMesh.tick = function (event) {
				if (this.rotation.y > -0.25*Math.PI) {
					this.rotation.y -= 0.1;
					game.scene.entityManager.tickQueue.add(this);
				} else {
					this.isRetracting = false;
				}
			};
			axeMesh.onMousedown = function (event) {
				this.rotation.y = 0;
				if (!this.isRetracting) {
					this.isRetracting = true;
					game.scene.entityManager.tickQueue.add(this);
				}
			};
			//axeMesh.onMouseup = function (event) {};
		});


		var sky = new THREE.Object3D();
		sky.position = game.player.position;

		//starCoords = [new THREE.Vector2(10, 10), new THREE.Vector2(20, 20)];
		//starSizes = [1.0, 1.0];

		game.time = 0.0;

		var skyMat = new THREE.ShaderMaterial(GAME.shaders.sky);
		skyMat.side = THREE.BackSide;
		skyMat.transparent = true;
		var skyMesh = new THREE.Mesh(new THREE.SphereGeometry(9000, 16, 16), skyMat);
		//skyMesh.rotation.y = -0.5 * Math.PI;
		sky.add(skyMesh);
		//sky.add(new THREE.Mesh(new THREE.SphereGeometry(1000, 8, 4, 0, 2 * Math.PI, 0, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: 0x00EE00/*0x220044*/, wireframe: true, transparent: true })));

		var skyPivot = new THREE.Object3D();
		// TODO: Calculate sun's actual diameter (IRL, angular diameter = 0.5°).
		var sun = new THREE.Mesh(new THREE.PlaneGeometry(2500, 2500), new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture('./images/sun.png'), transparent: true, fog: false, color: 0xFFCC33 }));
		GAME.sun = sun;
		sun.position.x = 7800;
		sun.lookAt(new THREE.Vector3());
		skyPivot.add(sun);
		var moon = new THREE.Mesh(new THREE.PlaneGeometry(2500, 2500), new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture('./images/moon.png'), transparent: true, fog: false }));
		GAME.moon = moon;
		moon.position.x = -7800;
		moon.lookAt(new THREE.Vector3());
		skyPivot.add(moon);
		sky.add(skyPivot);

		// TODO: Make stars move independently of sun and moon.
		//var starPivot = new THREE.Object3D();
		var starDist = 9500;
		function addStar(ra, dec, scale) {
			var star = new THREE.Mesh(new THREE.PlaneGeometry(scale*20, scale*20), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, fog: false }));
			star.position.x = Math.cos(dec) * Math.sin(ra) * starDist;
			star.position.y = Math.sin(dec) * starDist;
			star.position.z = -Math.cos(dec) * Math.cos(ra) * starDist;
			star.lookAt(new THREE.Vector3());
			skyPivot.add(star);
			//starPivot.add(star);
		}
		console.log('Generating stars...');
		var counter = 0;
		for (var dec = -90; dec <= 90; dec++) {
			for (var ra = 0; ra < 360; ra++) {
				var n = GAME.utils.noise.noise(1, ra, dec+90, 1);
				if (n < -0.99-((dec*dec)/810000)) {
					counter++;
					addStar((ra/180.0) * Math.PI, (dec/180.0) * Math.PI, 2.0+n);
				}
			}
		}
		console.log('Done: '+counter+' stars generated.');
		//sky.add(starPivot);

		var sunHemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.3);
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
			game.time = (game.time+0.0001)%1.0;
			var time = game.time;
			GAME.shaders.sky.uniforms.time.value = time;
			var rot = time*2.0*Math.PI;
			skyPivot.rotation.z = rot;
			var height = Math.sin(rot);
			sun.material.color.setHSL(0.13, 1.0, 0.8+(height<0.0?0.0:0.2*Math.pow(height,0.5)));
			game.player._sun.position.set(20.0*Math.cos(rot), 20.0*height, 0.0);
			sunDirLight.intensity = 0.25*height+0.25;
			sunDirLight.shadowDarkness = Math.max(0.0, 0.5*height);
			//sunHemiLight.intensity = 0.5*height;
			sunHemiLight.groundColor.setHSL(0.7, 1.0, 0.5+(0.25*(height+1.0)));
			game.scene.entityManager.tickQueue.add(this);
		};
		game.scene.entityManager.tickQueue.add(sky);
		game.scene.add(sky);


		var spotLight = new THREE.SpotLight(0xFFFFFF, 1, 1000);
		spotLight.position.set(10, 69, 10);
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
			this.intensity = 1.0-(0.5*(Math.sin(game.time*2.0*Math.PI)+1.0));
			this.shadowDarkness = 0.5*this.intensity;
			game.scene.entityManager.tickQueue.add(this);
		};
		game.scene.entityManager.tickQueue.add(spotLight);
		game.scene.add(spotLight);


		var water = new THREE.Mesh(new THREE.PlaneGeometry(20480, 20480), new THREE.MeshPhongMaterial({ color: 0x1C6BA0/*, opacity: 0.5*/ }));
		water.lookAt(new THREE.Vector3(0,1,0));
		water.position.y = 1.0;
		game.scene.add(water);


		var terrainGeom = new THREE.PlaneGeometry(1024, 1024, 256, 256);
		var seed = 1;
		console.log('Generating terrain...');
		for (var i = 0; i < terrainGeom.vertices.length; i++) {
			var vertex = terrainGeom.vertices[i];
			var x = vertex.x/4, z = -vertex.y/4;
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


		game.loaderJSON.load('models/tree/tree.js', function (geometry, materials) {
			console.log('Generating forest...');

			var timberGeom, stumpGeom;

			// TODO: Find a way to load both models asynchronously and wait or something.
			game.loaderJSON.load('models/tree/timber.js', function (geometry) {
				timberGeom = geometry;
			});
			game.loaderJSON.load('models/tree/stump.js', function (geometry) {
				stumpGeom = geometry;
			});

			var treeChopSound, treeFellSound;
			GAME.audio.load(['audio/chop.ogg'], function(source){treeChopSound = source;});
			GAME.audio.load(['audio/treefell.ogg'], function(source){treeFellSound = source;});

			var onPickTree = function (intersection) {
				if (treeChopSound) {
					treeChopSound.setPosition(this.collider.position);
					treeChopSound.play(false);
				}
				if (++this.chopCount < 4)
					return;

				game.scene.remove(this.collider);
				var stumpCollider = new Physijs.CylinderMesh(new THREE.CylinderGeometry(0.9, 0.9, 0.72), new THREE.MeshBasicMaterial(/*{ color: 0x00EE00, wireframe: true }*/), 0);
				stumpCollider.visible = false;
				stumpCollider.position.copy(this.collider.position);
				stumpCollider.position.y -= 1.64;
				stumpCollider.rotation.copy(this.collider.rotation);
				var stumpMesh = new THREE.Mesh(stumpGeom, new THREE.MeshFaceMaterial(materials));
				stumpMesh.position.y -= 0.36;
				stumpMesh.castShadow = true;
				stumpMesh.receiveShadow = true;
				stumpCollider.add(stumpMesh);
				game.scene.add(stumpCollider);
				var timberCollider = new Physijs.CapsuleMesh(new THREE.CylinderGeometry(0.75, 0.75, 3.28), new THREE.MeshBasicMaterial(/*{ color: 0x00EE00, wireframe: true }*/));
				timberCollider.visible = false;
				timberCollider.position.copy(this.collider.position);
				timberCollider.position.y += 0.36;
				timberCollider.rotation.copy(this.collider.rotation);
				var timberMesh = new THREE.Mesh(timberGeom, new THREE.MeshFaceMaterial(materials));
				timberMesh.position.y -= 2.36;
				timberMesh.castShadow = true;
				timberMesh.receiveShadow = true;
				timberCollider.add(timberMesh);
				game.scene.add(timberCollider);
				// TODO: Consider making the timber tip to the left instead of forwards.
				timberCollider.applyCentralImpulse(new THREE.Vector3().subVectors(intersection.point, game.player.position).normalize());
				if (treeFellSound) {
					treeFellSound.setPosition(timberCollider.position);
					treeFellSound.play(false);
				}
			};

			var rand;
			for (var i = 0, vertCount = terrainGeom.vertices.length; i < vertCount; i++) {
				rand = GAME.utils.noise.noise(seed, 0, 0, i);
				if (rand > 0.9) {
					var vertex = terrainGeom.vertices[i];
					if (vertex.z < 16.32) continue;
					var treeCollider = new Physijs.CylinderMesh(new THREE.CylinderGeometry(0.75, 0.75, 4.0), new THREE.MeshBasicMaterial(/*{ color: 0x00EE00, wireframe: true }*/), 0);
					treeCollider.visible = false;
					// NOTE: How the hell do terrain vertices map to world vertices like this?
					treeCollider.position.set(-vertex.y, vertex.z+2.0, -vertex.x);
					treeCollider.rotation.set(0, (rand-0.9)*20.0*Math.PI, 0);
					var treeMesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
					treeMesh.position.y -= 2.0;
					treeMesh.castShadow = true;
					treeMesh.receiveShadow = true;
					treeMesh.collider = treeCollider;
					treeMesh.chopCount = 0;
					treeMesh.onPick = onPickTree;
					treeCollider.add(treeMesh);
					game.scene.add(treeCollider);
				}
			}
			console.log('Done.');
		});


		game.scene.fog = new THREE.FogExp2(0xFFFFFF, 0.0025);
		game.scene.fog.tick = function (delta) {
			var height = Math.sin(game.time*2.0*Math.PI);
			this.color.setHSL(0.0, 0.0, 0.5*(height<0.0?-Math.pow(-height,0.5):Math.pow(height,0.5))+0.5);
			game.scene.entityManager.tickQueue.add(this);
		};
		game.scene.entityManager.tickQueue.add(game.scene.fog);


		var monolith = new Physijs.BoxMesh(new THREE.CubeGeometry(2, 10, 2), new THREE.MeshPhongMaterial({ color: 0xFF0000 }));
		monolith.position.y = 45;
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

		game.loaderJSON.load('models/portalradio/portalradio.js', function (geometry, materials) {
				var radioCollider = new Physijs.BoxMesh(new THREE.CubeGeometry(0.5, 0.5, 0.25), new THREE.MeshBasicMaterial({ color: 0x00EE00, wireframe: true, transparent: true }));
				radioCollider.position.x = -10;
				radioCollider.position.y = 42;
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
		game.renderer.sortObjects = false;

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
		// FIXME: Chrome throttles the interval down to 1s on inactive tabs.
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