var camera, controls, scene, renderer;

function createScene() {
	scn = new THREE.Scene();

	scn.add(new THREE.Mesh(new THREE.CubeGeometry(200, 200, 200), new THREE.MeshBasicMaterial({ color: 0xff0000 })));
	scn.add(new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), new THREE.MeshBasicMaterial({ color: 0x00ff00 })));

	return scn;
}

function initPointerLock() {
	var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

	if (havePointerLock) {
		var element = document.body;

		var pointerlockchange = function ( event ) {
			if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
				controls.enabled = true;
				//blocker.style.display = 'none';
			} else {
				controls.enabled = false;
				//blocker.style.display = '-webkit-box';
				//blocker.style.display = '-moz-box';
				//blocker.style.display = 'box';
				//instructions.style.display = '';
			}

		}

		var pointerlockerror = function ( event ) {
			//instructions.style.display = '';
		}

		// Hook pointer lock state change events
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

		document.addEventListener( 'click', function ( event ) {

			//instructions.style.display = 'none';

			// Ask the browser to lock the pointer
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

			if ( /Firefox/i.test( navigator.userAgent ) ) {

				var fullscreenchange = function ( event ) {

					if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

						document.removeEventListener( 'fullscreenchange', fullscreenchange );
						document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

						element.requestPointerLock();
					}

				}

				document.addEventListener( 'fullscreenchange', fullscreenchange, false );
				document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

				element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

				element.requestFullscreen();

			} else {

				element.requestPointerLock();

			}

		}, false );

	} else {

		//instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

	}
}

function init() {
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight);//, 1, 10000 );
	camera.position.y = -1000;
	camera.position.z = 500;
	camera.rotation.x = 20;

	initPointerLock();
	controls = new THREE.PointerLockControls(camera);

//	controls = new THREE.FirstPersonControls(camera);

//	controls.movementSpeed = 70;
//	controls.lookSpeed = 0.15;
	//controls.activeLook = false;
	//controls.noFly = true;
	//controls.lookVertical = false;


	scene = createScene();

	scene.add(controls.getObject());

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );

	window.addEventListener('resize', function(){
		// notify the renderer of the size change
		renderer.setSize( window.innerWidth, window.innerHeight );
		// update the camera
		camera.aspect	= window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	}, false);

	document.body.appendChild(renderer.domElement);
}

var clock = new THREE.Clock();

function render() {
	// note: three.js includes requestAnimationFrame shim
	requestAnimationFrame(render);

	//mesh.rotation.x += 0.01;
	//mesh.rotation.y += 0.02;
	controls.isOnObject(true);
	controls.update(clock.getDelta());

	renderer.render(scene, camera);
}

function main() {
	init();
	render();
}