const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  0,
  window.innerWidth,
  0,
  window.innerHeight,
  -10000,
  10000
);
camera.position.set(0, 0, 100);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

function backgroundColor(r, g, b) {
  scene.background = new THREE.Color(r/255, g/255, b/255);
}

function createBox(x, y, z, width, height = width, depth = width) {
  const geometry = new THREE.BoxGeometry(width, height, depth);

  const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(1, 1, 1), side: THREE.DoubleSide });
  const box = new THREE.Mesh(geometry, material);
  // Treat x/y/z as the block's corner.
  box.position.set(x + width / 2, y + height / 2, z + depth / 2);

  box.frustumCulled = false;
  return box;
}

function setColor(object, r, g, b) {
  if (object.material) {
    object.material.color.set(new THREE.Color(r/255, g/255, b/255));
  }
}

let gameObjects;

let player = new Player();
let direction = 'xy'; // Default dimension swap direction

function cameraFollowPlayer() {
  if (player.mesh) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (direction === 'xy') {
      camera.left = player.mesh.position.x - w / 2;
      camera.right = player.mesh.position.x + w / 2;
      camera.bottom = player.mesh.position.y + h / 2;
      camera.top = player.mesh.position.y - h / 2;
      camera.z = player.mesh.position.z + 100; // Keep camera above player in Z-axis
    } else if (direction === 'xz') {
      camera.left = player.mesh.position.x - w / 2;
      camera.right = player.mesh.position.x + w / 2;
      camera.bottom = player.mesh.position.z - h / 2;
      camera.top = player.mesh.position.z + h / 2;
      camera.y = player.mesh.position.y - 100; // Keep camera on the correct side in XZ mode
    } else if (direction === 'yz') {
      camera.left = player.mesh.position.z - w / 2;
      camera.right = player.mesh.position.z + w / 2;
      camera.bottom = player.mesh.position.y + h / 2;
      camera.top = player.mesh.position.y - h / 2;
      camera.x = player.mesh.position.x + 100; // Keep camera above player in X-axis
    }
    camera.updateProjectionMatrix();
  }
}

function swapDimensions(dimensions) {
  direction = dimensions;
  if (direction === 'xy') {
    camera.rotation.set(0, 0, 0);
  } else if (direction === 'xz') {
    camera.rotation.set(Math.PI / 2, 0, 0);
  } else if (direction === 'yz') {
    camera.rotation.set(0, -Math.PI / 2, 0);
  }
}

const controller = {
  left: { pressed: false, key: ['a', 'A', 'ArrowLeft'] },
  right: { pressed: false, key: ['d', 'D', 'ArrowRight'] },
  jump: { pressed: false, key: ['w', 'W', 'ArrowUp'] },
  xySwap: { pressed: false, key: ['e', 'E'] },
  xzSwap: { pressed: false, key: ['q', 'Q'] },
  yzSwap: { pressed: false, key: ['r', 'R'] },
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

function objectLoopFunction(func) {
  for (const object of gameObjects) {
    func(object);
  }
}

function gameLoop() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  backgroundColor(173, 216, 230);

  camera.left = 0;
  camera.right = window.innerWidth;
  camera.top = 0;
  camera.bottom = window.innerHeight;
  camera.updateProjectionMatrix();

  if (controller.left.pressed) {
    player.move('left');
  }
  if (controller.right.pressed) {
    player.move('right');
  }
  if (controller.jump.pressed) {
    player.jump();
  }
  if (controller.xySwap.pressed) {
    swapDimensions('xy');
  }
  if (controller.xzSwap.pressed) {
    swapDimensions('xz');
  }
  if (controller.yzSwap.pressed) {
    swapDimensions('yz');
  }

  player.update();
  objectLoopFunction((object) => object.update());
  cameraFollowPlayer();

  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}
