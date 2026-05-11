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
  left: { pressed: false, key: ['a', 'A', 'ArrowLeft'], timeHeld: 0 },
  right: { pressed: false, key: ['d', 'D', 'ArrowRight'], timeHeld: 0 },
  up: { pressed: false, key: ['w', 'W', 'ArrowUp'], timeHeld: 0 },
  jump: { pressed: false, key: [' '], timeHeld: 0 },
  down: { pressed: false, key: ['s', 'S', 'ArrowDown'], timeHeld: 0 },
  xySwap: { pressed: false, key: ['e', 'E'], timeHeld: 0 },
  xzSwap: { pressed: false, key: ['q', 'Q'], timeHeld: 0 },
  zySwap: { pressed: false, key: ['r', 'R'], timeHeld: 0 },
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
    controller.left.timeHeld++;
    if (direction === 'xz') {
      player.moveTopDown('left', controller.left.timeHeld);
    } else {
      player.move('left', controller.left.timeHeld);
    }
  } else {
    controller.left.timeHeld--;
    if (controller.left.timeHeld < 0) {
      controller.left.timeHeld = 0;
    }
  }
  if (controller.right.pressed) {
    controller.right.timeHeld++;
    if (direction === 'xz') {
      player.moveTopDown('right', controller.right.timeHeld);
    } else {
      player.move('right', controller.right.timeHeld);
    }
  } else {
    controller.right.timeHeld--;
    if (controller.right.timeHeld < 0) {
      controller.right.timeHeld = 0;
    }
  }
  if (controller.jump.pressed) {
    controller.jump.timeHeld++;
    if (direction !== 'xz') {
      player.jump();
    }
  } else {
    controller.jump.timeHeld = 0;
  }
  if (controller.up.pressed) {
    controller.up.timeHeld++;
    if (direction === 'xz') {
      player.moveTopDown('up', controller.up.timeHeld);
    } else {
      player.jump();
    }
  } else {
    controller.up.timeHeld--;
    if (controller.up.timeHeld < 0) {
      controller.up.timeHeld = 0;
    }
  }
  if (controller.down.pressed) {
    controller.down.timeHeld++;
    if (direction === 'xz') {
      player.moveTopDown('down', controller.down.timeHeld);
    } else {
      player.passDown = true;
      setTimeout(() => {
        player.passDown = false;
      }, 200);
    }
  } else {
    controller.down.timeHeld--;
    if (controller.down.timeHeld < 0) {
      controller.down.timeHeld = 0;
    }
  }
  if (controller.xySwap.pressed) {
    if (controller.xySwap.timeHeld === 0) {
      swapDimensions('xy');
    }
    controller.xySwap.timeHeld++;
  } else {
    controller.xySwap.timeHeld = 0;
  }
  if (controller.xzSwap.pressed) {
    if (controller.xzSwap.timeHeld === 0) {
      swapDimensions('xz');
    }
    controller.xzSwap.timeHeld++;
  } else {
    controller.xzSwap.timeHeld = 0;
  }
  if (controller.zySwap.pressed) {
    if (controller.zySwap.timeHeld === 0) {
      swapDimensions('zy');
    }
    controller.zySwap.timeHeld++;
  } else {
    controller.zySwap.timeHeld = 0;
  }

  player.update();
  objectLoopFunction((object) => object.update());
  cameraFollowPlayer();
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}
