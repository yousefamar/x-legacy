(function() {
	var player, camera, controller, scene, renderer;
	var time = Date.now();

	function createScene() {
		scn = new THREE.Scene();

		var light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(100, 100, 100);
		light.castShadow = true;
		scn.add(light);

		//light = new THREE.DirectionalLight( 0xffffff, 0.75 );
		//light.position.set( -1, - 0.5, -1 );
		//light.castShadow = true;
		//scn.add(light);

		var ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
		ground.lookAt(new THREE.Vector3(0,1,0));
		ground.castShadow = false;
		ground.receiveShadow = true;
		scn.add(ground);

		var cube = new THREE.Mesh(new THREE.CubeGeometry(20, 100, 20), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
		cube.position.y = 50;
		cube.castShadow = true;
		cube.receiveShadow = true;
		scn.add(cube);
		return scn;
	}

	function init() {
		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight);//, 1, 10000 );
		player = new THREE.Object3D();
		player.add(camera);
		//camera.position.y = -1000;
		//camera.position.z = 500;
		//camera.rotation.x = 20;

		controller = new GAME.playerController.PlayerController(player);
		GAME.playerController.initPointerLock(controller);

	//	controller = new THREE.FirstPersonControls(camera);

	//	controller.movementSpeed = 70;
	//	controller.lookSpeed = 0.15;
		//controller.activeLook = false;
		//controller.noFly = true;
		//controller.lookVertical = false;


		scene = createScene();

		scene.add(controller.getObject());

		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;

		window.addEventListener('resize', function(){
			camera.aspect = window.innerWidth/window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);

		document.body.appendChild(renderer.domElement);
	}

	var clock = new THREE.Clock();

	function render() {
		// note: three.js includes requestAnimationFrame shim
		requestAnimationFrame(render);

		//mesh.rotation.x += 0.01;
		//mesh.rotation.y += 0.02;

		//controller.isOnObject(controller.getObject().position.y<=10);
		controller.update(Date.now() - time);

		renderer.render(scene, camera);
		time = Date.now();
	}

	this.main = function() {
		init();
		render();
	};
}).apply(GAME.namespace('core.Main'));