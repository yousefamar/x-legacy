//TODO: Come up with a proper structure for this.
GAME.namespace('input').init = function(scene, player) {
	var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

	if (havePointerLock) {
		var element = document.body;
		var blocker = document.getElementById('blocker');
		var instructions = document.getElementById('instructions');
		var clientForm = document.getElementById('clientForm');

		var pointerlockchange = function ( event ) {
			if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
				//clientForm.style.display = 'none';
				clientForm.input.placeholder = '(Press Enter to Chat)';
				blocker.style.display = 'none';
				player.controller.enabled = true;
			} else {
				player.controller.enabled = false;
				blocker.style.display = '-webkit-box';
				blocker.style.display = '-moz-box';
				blocker.style.display = 'box';
				//clientForm.style.display = '';
				//instructions.style.display = '';
			}

		}

		var pointerlockerror = function ( event ) {
			//instructions.style.display = '';
		}

		// Hook pointer lock state change events
		document.addEventListener('pointerlockchange', pointerlockchange, false);
		document.addEventListener('mozpointerlockchange', pointerlockchange, false);
		document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

		document.addEventListener('pointerlockerror', pointerlockerror, false);
		document.addEventListener('mozpointerlockerror', pointerlockerror, false);
		document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

		var onBlockerClick = function (event) {
			instructions.style.display = 'none';
			blocker.style.backgroundColor = 'rgba(0,0,0,0)';

			// Ask the browser to lock the pointer
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

			if ( /Firefox/i.test( navigator.userAgent ) ) {

				var fullscreenchange = function (event) {

					if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

						document.removeEventListener('fullscreenchange', fullscreenchange);
						document.removeEventListener('mozfullscreenchange', fullscreenchange);

						element.requestPointerLock();
					}

				}

				document.addEventListener('fullscreenchange', fullscreenchange, false);
				document.addEventListener('mozfullscreenchange', fullscreenchange, false);

				element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

				element.requestFullscreen();

			} else {
				element.requestPointerLock();
			}

		};

		blocker.addEventListener('click', onBlockerClick, false);
		//instructions.addEventListener('click', onBlockerClick, false);

		var escDown = false;

		document.addEventListener('keydown', function (event) {
			if (player.controller.enabled) {
				if (event.keyCode == 13) {
					document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
					document.exitPointerLock();
				} else if (event.keyCode == 66) {
					// TODO: Move to Player class in own event listener.
					ball = new Physijs.SphereMesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshPhongMaterial({ color: 0x0000FF }));
					var headWorldPos = player.head.localToWorld(new THREE.Vector3(0, 0, -1));
					ball.position.copy(headWorldPos);
					ball.castShadow = true;
					ball.receiveShadow = true;
					scene.add(ball);
					ball.setLinearVelocity(player.head.localToWorld(new THREE.Vector3(0, 0, -2)).sub(headWorldPos).normalize().multiplyScalar(20));
				}
			} else {
				if (event.keyCode == 27)
					escDown = true;
			}

			if (event.keyCode == 13) {
				clientForm.input.placeholder = '';
				clientForm.input.focus();
				// FIXME: A stray '\n' makes its way into the input box when focusing with Enter.
			}
		}, false);

		document.addEventListener('keyup', function (event) {
			if (escDown && event.keyCode == 27) {
				clientForm.input.blur();
				onBlockerClick();
				escDown = false;
			}
		}, false);

	} else {

		//instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

	}
};