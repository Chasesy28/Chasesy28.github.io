import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

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
const texture2 = loader.load("/icons/icon-512x512.png");
scene.background = new THREE.Color(173/255, 216/255, 230/255);
scene.background = texture;

const cubes = [
  makeInstance(0, 0, 0, geometry, 0x44aa88),
  makeInstance(0, 0, 0, geometry, texture),
  makeInstance(-2, 0, 0, geometry, 0x8844aa),
  makeInstance(1, 0, 0, geometry, 0xaa8844),
];

let cameraYaw = 0;
let cameraPitch = 0;

const moveSpeed = -0.1;
const mouseSensitivity = 0.002;

// Mouse look handler (only while pointer is locked)
window.document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;

  cameraYaw -= e.movementX * mouseSensitivity;
  cameraPitch -= e.movementY * mouseSensitivity;

  const maxPitch = Math.PI / 2 - 0.01;
  if (cameraPitch > maxPitch) cameraPitch = maxPitch;
  if (cameraPitch < -maxPitch) cameraPitch = -maxPitch;
});

function animate(time) {
  time *= 0.001;  // convert time to seconds

  renderer.setSize(window.innerWidth, window.innerHeight);

  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();

  let offsetVector = new THREE.Vector3();

  if (controller.forward.pressed) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    offsetVector.addScaledVector(forward, moveSpeed);
  }
  if (controller.backward.pressed) {
    const backward = new THREE.Vector3();
    camera.getWorldDirection(backward);
    backward.y = 0;
    backward.normalize();
    offsetVector.addScaledVector(backward, -moveSpeed);
  }
  if (controller.left.pressed) {
    const left = new THREE.Vector3();
    camera.getWorldDirection(left);
    left.y = 0;
    left.cross(camera.up);
    left.normalize();
    offsetVector.addScaledVector(left, -moveSpeed);
  }
  if (controller.right.pressed) {
    const right = new THREE.Vector3();
    camera.getWorldDirection(right);
    right.y = 0;
    right.cross(camera.up);
    right.normalize();
    offsetVector.addScaledVector(right, moveSpeed);
  }
  if (controller.up.pressed) {
    const up = new THREE.Vector3(0, 1, 0);
    offsetVector.addScaledVector(up, moveSpeed);
  }
  if (controller.down.pressed) {
    const down = new THREE.Vector3(0, 1, 0);
    offsetVector.addScaledVector(down, -moveSpeed);
  }

  if (controller.resetView.pressed) {
    cameraYaw = 0;
    cameraPitch = 0;
  }

  cubes.forEach((cube, index) => {
    if (index === 0) {
      cube.material.map = texture2;
      cube.position.copy(camera.getWorldPosition(new THREE.Vector3()));
      cube.position.y -= 1;
      cube.geometry.dispose();
      cube.geometry = new THREE.BoxGeometry(2, 0.5, 2);
    } else {
      cube.material.map = texture;
      cube.position.add(offsetVector);
      let size = cube.geometry.parameters;
      if (size.width > 5) {
        size.width *= -1;
      }
      if (size.height > 5) {
        size.height *= -1;
      }
      if (size.depth > 5) {
        size.depth *= -1;
      }
      cube.geometry.dispose();
      cube.geometry = new THREE.BoxGeometry(size.width + Math.random() * 0.1, size.height + Math.random() * 0.1, size.depth + Math.random() * 0.1);
    }
  });

  camera.rotation.order = "YXZ";
  camera.rotation.y = cameraYaw;
  camera.rotation.x = cameraPitch;

  light.position.copy(camera.position);

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

const controller = {
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
