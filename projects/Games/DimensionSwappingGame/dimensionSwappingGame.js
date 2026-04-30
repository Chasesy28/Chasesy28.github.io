const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(150, 150, 0);
scene.add(light);

function backgroundColor(r, g, b) {
  scene.background = new THREE.Color(r/255, g/255, b/255);
}

function createBox(x, y, z, width, height = width, depth = width) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(1, 1, 1) });
  const box = new THREE.Mesh(geometry, material);
  box.position.set(x, y, z);
  return box;
}

function setColor(object, r, g, b) {
  if (object.material) {
    object.material.color.set(new THREE.Color(r/255, g/255, b/255));
  }
}

const box = createBox(0, 0, -5, 100);
setColor(box, 255, 0, 0);
scene.add(box);

const box2 = createBox(0, 150, -150, 100);
setColor(box2, 255, 0, 0);
scene.add(box2);

function gameLoop() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  backgroundColor(173, 216, 230);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.lookAt(0, 0, -5);
  camera.position.set(150, 0, 0);

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
