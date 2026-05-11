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
    const halfW = w / 2;
    const halfH = h / 2;

    camera.left = -halfW;
    camera.right = halfW;
    camera.top = -halfH;
    camera.bottom = halfH;

    if (direction === 'xy') {
      let cameraX = player.mesh.position.x;
      let cameraY = player.mesh.position.y;
      if (player.mesh.position.x - halfW <= 0) {
        cameraX = halfW;
      }
      // Fix conditional because it doesn't unlock
      if (-player.mesh.position.y + halfH >= 0) {
        cameraY = halfH;
      }
      camera.position.set(
        cameraX,
        cameraY,
        player.mesh.position.z + 100
      );
    } else if (direction === 'xz') {
      let cameraX = player.mesh.position.x;
      let cameraZ = player.mesh.position.z;
      if (player.mesh.position.x - halfW <= 0) {
        cameraX = halfW;
      }
      if (player.mesh.position.z - halfH <= 0) {
        cameraZ = -halfH + baseBlockSize;
      }
      camera.position.set(
        cameraX,
        player.mesh.position.y - 100,
        cameraZ
      );
    } else if (direction === 'zy') {
      let cameraZ = player.mesh.position.z;
      let cameraY = player.mesh.position.y;
      // Fix camera position when player is near the edges of the world and check condition
      if (player.mesh.position.z - halfW + baseBlockSize <= 0) {
        cameraZ = -halfW + baseBlockSize;
      }
      if (-player.mesh.position.y + halfH >= 0) {
        cameraY = halfH;
      }
      camera.position.set(
        player.mesh.position.x + 100,
        cameraY,
        cameraZ
      );
    }
  }
}

function swapDimensions(dimensions) {
  direction = dimensions;
  if (direction === 'xy') {
    camera.rotation.set(0, 0, 0);
  } else if (direction === 'xz') {
    camera.rotation.set(Math.PI / 2, 0, 0);
  } else if (direction === 'zy') {
    camera.rotation.set(0, Math.PI / 2, 0);
  }
}

const controller = {
  left: { pressed: false, key: ['a', 'A', 'ArrowLeft'] },
  right: { pressed: false, key: ['d', 'D', 'ArrowRight'] },
  up: { pressed: false, key: ['w', 'W', 'ArrowUp'] },
  jump: { pressed: false, key: [' '] },
  down: { pressed: false, key: ['s', 'S', 'ArrowDown'] },
  xySwap: { pressed: false, key: ['e', 'E'] },
  xzSwap: { pressed: false, key: ['q', 'Q'] },
  zySwap: { pressed: false, key: ['r', 'R'] },
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

  if (controller.left.pressed) {
    if (direction === 'xz') {
      player.moveTopDown('left');
    } else {
      player.move('left');
    }
  }
  if (controller.right.pressed) {
    if (direction === 'xz') {
      player.moveTopDown('right');
    } else {
      player.move('right');
    }
  }
  if (controller.jump.pressed) {
    if (direction !== 'xz') {
      player.jump();
    }
  }
  if (controller.up.pressed) {
    if (direction === 'xz') {
      player.moveTopDown('up');
    } else {
      player.jump();
    }
  }
  if (controller.down.pressed) {
    if (direction === 'xz') {
      player.moveTopDown('down');
    } else {
      player.passDown = true;
      setTimeout(() => {
        player.passDown = false;
      }, 200);
    }
  }
  if (controller.xySwap.pressed) {
    swapDimensions('xy');
  }
  if (controller.xzSwap.pressed) {
    swapDimensions('xz');
  }
  if (controller.zySwap.pressed) {
    swapDimensions('zy');
  }

  player.update();
  objectLoopFunction((object) => object.update());
  cameraFollowPlayer();
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}
