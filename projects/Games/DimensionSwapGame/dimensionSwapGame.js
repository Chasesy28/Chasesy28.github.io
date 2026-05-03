const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  0,
  window.innerWidth,
  0,
  window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 10);

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
  // Treat x/y/z as the block's corner instead of the geometry center.
  box.position.set(x + width / 2, y + height / 2, z + depth / 2);

  box.frustumCulled = false;
  return box;
}

function setColor(object, r, g, b) {
  if (object.material) {
    object.material.color.set(new THREE.Color(r/255, g/255, b/255));
  }
}

const gameObjects = convertToObjects(worldData);
for (const object of gameObjects) {
  scene.add(object);
}

function swapDimensions(dimensions) {

}

let dt = 0;
let lastTime = performance.now();

function gameLoop() {
  const currentTime = performance.now();
  dt = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  renderer.setSize(window.innerWidth, window.innerHeight);
  backgroundColor(173, 216, 230);

  camera.left = 0;
  camera.right = window.innerWidth;
  camera.top = 0;
  camera.bottom = window.innerHeight;
  camera.updateProjectionMatrix();

  if (controller.left.pressed) {
    player.move('left', dt);
  }
  if (controller.right.pressed) {
    player.move('right', dt);
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
  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
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

gameLoop();
