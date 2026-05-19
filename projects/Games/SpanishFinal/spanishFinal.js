const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  -window.innerWidth / 2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  -window.innerHeight / 2,
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

function createBox(x, y, width, height = width) {
  const geometry = new THREE.BoxGeometry(width, height, width);

  const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(1, 1, 1), side: THREE.DoubleSide });
  const box = new THREE.Mesh(geometry, material);
  // Treat x/y/z as the block's corner.
  box.position.set(x + width / 2, y + height / 2, width / 2);

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

function cameraFollowPlayer() {
  if (player.mesh) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const halfW = w / 2;
    const halfH = h / 2;

    camera.left = -halfW;
    camera.right = halfW;
    camera.top = -halfH;
    camera.bottom = halfH;

    camera.position.set(player.mesh.position.x, player.mesh.position.y, 100);
    camera.updateProjectionMatrix();
  }
}

function gameLoop() {
  renderer.render(scene, camera);
  player.update();
  cameraFollowPlayer();
  requestAnimationFrame(gameLoop);
}
