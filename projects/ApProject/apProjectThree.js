// apProjectThree.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 100);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.id = "webGl3DCanvas";

const geometry = new THREE.BoxGeometry(50, 50, 50);

const loader = new THREE.TextureLoader();

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

function createColoredCube(color) {
  const material = new THREE.MeshPhongMaterial({color});
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  return cube;
}

function createTexturedCube(texture) {
  const material = new THREE.MeshPhongMaterial({map: texture});
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  return cube;
}

function setColor(object, color) {
  let objectColor = new THREE.Color(color);
  if (object.material) {
    object.material.color = objectColor;
  }
}

function setTexture(object, texture) {
  if (object.material) {
    object.material.map = texture;
  }
}

function sceneBackgroundColor(r, g, b) {
  scene.background = new THREE.Color(r/255, g/255, b/255);
}

function sceneBackgroundTexture(texture) {
  scene.background = texture;
}

let cube = createColoredCube(0x44aa88);
cube.position.set(0, 0, 0);
scene.add(cube);

sceneBackgroundColor(105, 105, 105);

renderer.render(scene, camera);

webGl3DCanvas.addEventListener("click", () => {
  if (gameRunning) {
    webGl3DCanvas.requestPointerLock();
  }
});

let cameraYaw = 0;
let cameraPitch = 0;

const mouseSensitivity = 0.002;

window.document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;

  cameraYaw -= e.movementX * mouseSensitivity;
  cameraPitch -= e.movementY * mouseSensitivity;

  const maxPitch = Math.PI / 2 - 0.01;
  if (cameraPitch > maxPitch) cameraPitch = maxPitch;
  if (cameraPitch < -maxPitch) cameraPitch = -maxPitch;
});

function renderScene() {
  renderer.setSize(window.innerWidth, window.innerHeight);

  sceneBackgroundColor(173, 216, 230);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.position.set(player.x, player.y, player.layer * 50)

  camera.rotation.order = "YXZ";
  camera.rotation.y = cameraYaw;
  camera.rotation.x = cameraPitch;

  renderer.render(scene, camera);
}
