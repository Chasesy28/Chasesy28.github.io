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

const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

function backgroundColor(r, g, b) {
  scene.background = new THREE.Color(r/255, g/255, b/255);
}

function createBox(x, y, z, width, height = width, depth = width) {
  const geometry = new THREE.BoxGeometry(width, height, depth);

  const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(1, 1, 1), side: THREE.DoubleSide });
  const box = new THREE.Mesh(geometry, material);
  box.position.set(x, y, z);

  box.frustumCulled = false;
  return box;
}

function setColor(object, r, g, b) {
  if (object.material) {
    object.material.color.set(new THREE.Color(r/255, g/255, b/255));
  }
}

const gameObjects = [];



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

  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}

try {
  gameLoop();
} catch (error) {
  console.error("Error occurred in game loop:", error);
}
