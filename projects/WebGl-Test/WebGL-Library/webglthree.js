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
const intensity = 1;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(5, 5, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 2); // soft white light
scene.add(ambientLight);

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

const loader = new THREE.TextureLoader();
const texture = loader.load("/images/SuperMarioTitle.png");

const cubes = [
  makeInstance(0, 0, 0, geometry, texture),
  makeInstance(-2, 0, 0, geometry, 0x8844aa),
  makeInstance(1, 0, 0, geometry, 0xaa8844),
];

let cameraRotation = [0, 0, 0];

const moveSpeed = 0.1;
const rotationSpeed = 0.025;

function animate(time) {
  time *= 0.001;  // convert time to seconds

  renderer.setSize(window.innerWidth, window.innerHeight);

  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();

  cubes.forEach((cube) => {
    cube.material.map = texture;
  });

  if (controller.forward.pressed) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    camera.position.addScaledVector(forward, moveSpeed);
  }
  if (controller.backward.pressed) {
    const backward = new THREE.Vector3();
    camera.getWorldDirection(backward);
    backward.y = 0;
    camera.position.addScaledVector(backward, -moveSpeed);
  }
  if (controller.left.pressed) {
    const left = new THREE.Vector3();
    camera.getWorldDirection(left);
    left.y = 0;
    left.cross(camera.up);
    camera.position.addScaledVector(left, -moveSpeed);
  }
  if (controller.right.pressed) {
    const right = new THREE.Vector3();
    camera.getWorldDirection(right);
    right.y = 0;
    right.cross(camera.up);
    camera.position.addScaledVector(right, moveSpeed);
  }
  if (controller.up.pressed) {
    const up = new THREE.Vector3(0, 1, 0);
    camera.position.addScaledVector(up, moveSpeed);
  }
  if (controller.down.pressed) {
    const down = new THREE.Vector3(0, 1, 0);
    camera.position.addScaledVector(down, -moveSpeed);
  }

  if (controller.lookUp.pressed) {
    camera.rotation.x += rotationSpeed;
  }
  if (controller.lookDown.pressed) {
    camera.rotation.x -= rotationSpeed;
  }
  if (controller.lookLeft.pressed) {
    cameraRotation[1] += rotationSpeed;
  }
  if (controller.lookRight.pressed) {
    cameraRotation[1] -= rotationSpeed;
  }
  if (controller.resetView.pressed) {
    cameraRotation = [0, 0, 0];
  }

  //camera.rotation.x = cameraRotation[0];
  camera.rotation.y = cameraRotation[1];

  light.position.copy(camera.position);

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
