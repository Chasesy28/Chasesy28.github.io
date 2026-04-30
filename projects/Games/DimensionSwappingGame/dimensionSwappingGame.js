const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  0.1,
  1000
);

camera.position.set(0, 0, 200);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

const light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(150, 150, 0);
scene.add(light);

function backgroundColor(r, g, b) {
  scene.background = new THREE.Color(r/255, g/255, b/255);
}

function createBox(x, y, z, width, height = width, depth = width) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  // use DoubleSide so faces are visible even if the camera is inside or
  // the winding appears reversed during rotations
  const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(1, 1, 1), side: THREE.DoubleSide });
  const box = new THREE.Mesh(geometry, material);
  box.position.set(x, y, z);
  // prevent three.js frustum culling from accidentally removing faces
  // when the camera is rotated — bounding sphere checks can be wrong
  // for aggressively transformed cameras
  box.frustumCulled = false;
  return box;
}

function setColor(object, r, g, b) {
  if (object.material) {
    object.material.color.set(new THREE.Color(r/255, g/255, b/255));
  }
}

let cameraYaw = 0;
let cameraPitch = 0;

const moveSpeed = -0.1;
const mouseSensitivity = 0.002;

window.document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;

  cameraYaw -= e.movementX * mouseSensitivity;
  cameraPitch -= e.movementY * mouseSensitivity;

  const maxPitch = Math.PI / 2 - 0.01;
  if (cameraPitch > maxPitch) cameraPitch = maxPitch;
  if (cameraPitch < -maxPitch) cameraPitch = -maxPitch;
});

const box = createBox(0, 0, -5, 100);
setColor(box, 255, 0, 0);
scene.add(box);

const box2 = createBox(0, 150, -150, 100);
setColor(box2, 255, 0, 0);
scene.add(box2);

function gameLoop() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  backgroundColor(173, 216, 230);

  const hw = window.innerWidth / 2;
  const hh = window.innerHeight / 2;
  camera.left = -hw;
  camera.right = hw;
  camera.top = hh;
  camera.bottom = -hh;
  camera.updateProjectionMatrix();

  camera.rotation.x = cameraPitch;
  camera.rotation.y = cameraYaw;
  // ensure camera matrices are updated after manual rotation so frustum
  // calculations use the latest world transform
  camera.updateMatrixWorld();

  box.rotation.x += 0.01;
  box.rotation.y += 0.01;
  box.rotation.z += 0.01;
  box2.rotation.x += 0.01;
  box2.rotation.y += 0.01;
  box2.rotation.z += 0.01;

  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}

try {
  gameLoop();
} catch (error) {
  console.error("Error occurred in game loop:", error);
}
