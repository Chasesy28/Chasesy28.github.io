const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);

camera.position.z = 5;

function makeInstance(x, y, z, geometry, color) {
  const material = new THREE.MeshPhongMaterial({color});
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;

  return cube;
}

const cubes = [
  makeInstance(0, 0, 0, geometry, 0x44aa88),
  makeInstance(-2, 0, 0, geometry, 0x8844aa),
  makeInstance(1, 0, 0, geometry, 0xaa8844),
];

let cameraPosition = [0, 0, 5];
let cameraRotation = [0, 0, 0];

const speed = 0.1;

function animate(time) {
  time *= 0.001;  // convert time to seconds

  renderer.setSize(window.innerWidth, window.innerHeight);

  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();


  /*cubes.forEach((cube, ndx) => {
    const speed = 1 + ndx * .1;
    const rot = time * speed;
    cube.rotation.x = rot;
    cube.rotation.y = rot;
  });*/

  cubes.forEach((cube) => {
    cube.material = new THREE.MeshPhongMaterial({color: new THREE.Color(1, 0, 0)});
  });

  if (controller.forward.pressed) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    camera.position.addScaledVector(forward, speed);
  }
  if (controller.backward.pressed) {
    const backward = new THREE.Vector3();
    camera.getWorldDirection(backward);
    backward.y = 0;
    camera.position.addScaledVector(backward, -speed);
  }
  if (controller.left.pressed) {
    const left = new THREE.Vector3();
    camera.getWorldDirection(left);
    left.y = 0;
    left.cross(camera.up);
    camera.position.addScaledVector(left, -speed);
  }
  if (controller.right.pressed) {
    const right = new THREE.Vector3();
    camera.getWorldDirection(right);
    right.y = 0;
    right.cross(camera.up);
    camera.position.addScaledVector(right, speed);
  }
  if (controller.up.pressed) {
    const up = new THREE.Vector3(0, 1, 0);
    camera.position.addScaledVector(up, speed);
  }
  if (controller.down.pressed) {
    const down = new THREE.Vector3(0, 1, 0);
    camera.position.addScaledVector(down, -speed);
  }

  if (controller.lookUp.pressed) {
    cameraRotation[0] += 0.01;
  }
  if (controller.lookDown.pressed) {
    cameraRotation[0] -= 0.01;
  }
  if (controller.lookLeft.pressed) {
    cameraRotation[1] += 0.01;
  }
  if (controller.lookRight.pressed) {
    cameraRotation[1] -= 0.01;
  }
  if (controller.resetView.pressed) {
    cameraRotation = [0, 0, 0];
  }

  camera.rotation.x = cameraRotation[0];
  camera.rotation.y = cameraRotation[1];

  light.position.x = camera.position.x;
  light.position.y = camera.position.y;
  light.position.z = camera.position.z;

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

controller = {
  forward: {
    key: ["w", "W"],
    pressed: false,
  },
  backward: {
    key: ["s", "S"],
    pressed: false,
  },
  left: {
    key: ["a", "A"],
    pressed: false,
  },
  right: {
    key: ["d", "D"],
    pressed: false,
  },
  up: {
    key: [" "],
    pressed: false,
  },
  down: {
    key: ["Shift"],
    pressed: false,
  },
  lookUp: {
    key: ["ArrowUp"],
    pressed: false,
  },
  lookDown: {
    key: ["ArrowDown"],
    pressed: false,
  },
  lookLeft: {
    key: ["ArrowLeft"],
    pressed: false,  },
  lookRight: {
    key: ["ArrowRight"],
    pressed: false,
  },
  resetView: {
    key: ["r", "R"],
    pressed: false,
  },
}

window.document.addEventListener("keydown", function (e) {
  for (const controllerKey in controller) {
    if (controller[controllerKey].key.includes(e.key)) {
      controller[controllerKey].pressed = true;
    }
  }
});

window.document.addEventListener("keyup", function (e) {
  for (const controllerKey in controller) {
    if (controller[controllerKey].key.includes(e.key)) {
      controller[controllerKey].pressed = false;
    }
  }
});
