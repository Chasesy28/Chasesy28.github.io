// apProjectThree.js
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();

const world = new THREE.Group();
world.scale.set(1, -1, 1);
scene.add(world);

// --- GLTF import ---
const gltfLoader = new THREE.GLTFLoader();

// IMPORTANT: set this path to where the file is hosted relative to the HTML page
// Example if your model is at: ./3D-Models/myModel.glb
const toRenderY = (y) => -y;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.id = "webGl3DCanvas";

const geometry = new THREE.BoxGeometry(50, 50, 50);

const loader = new THREE.TextureLoader();

const ambientLight = new THREE.AmbientLight(0x404040, 3);
scene.add(ambientLight);

function createColoredCube(r, g, b) {
  const material = new THREE.MeshPhongMaterial({color: new THREE.Color(r/255, g/255, b/255)});
  const cube = new THREE.Mesh(geometry, material);
  world.add(cube);
  return cube;
}

function createTexturedCube(image) {
  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshPhongMaterial({map: texture});
  const cube = new THREE.Mesh(geometry, material);
  world.add(cube);
  return cube;
}

function createModel(modelPath) {
  const modelObject = new THREE.Group();
  world.add(modelObject);

  gltfLoader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      modelObject.add(model);

      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
    },
    undefined,
    (err) => {
      console.error('GLTF failed to load:', err);
    }
  );
  return modelObject;
}

function setColor(object, r, g, b) {
  let objectColor = new THREE.Color(r/255, g/255, b/255);
  object.material.dispose();
  if (object.material) {
    object.material.color = objectColor;
    object.material.map = null;
  }
}

function setTexture(object, image) {
  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.magFilter = THREE.NearestFilter;
  object.material.dispose();
  if (object.material) {
    object.material.map = texture;
    object.material.color = new THREE.Color(1, 1, 1);
  }
}

function setOpacity(object, opacity) {
  if (object.material) {
    object.material.transparent = opacity < 1;
    object.material.opacity = opacity;
  }
}

function sceneBackgroundColor(r, g, b) {
  scene.background = new THREE.Color(r/255, g/255, b/255);
}

function sceneBackgroundTexture(texture) {
  scene.background = texture;
}

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

  if (!player.dead) {
    sceneBackgroundColor(173, 216, 230);
  }

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.position.set(player.x, toRenderY(player.y), player.z);

  camera.rotation.order = "YXZ";
  camera.rotation.y = cameraYaw;
  camera.rotation.x = cameraPitch;

  renderer.render(scene, camera);
}
