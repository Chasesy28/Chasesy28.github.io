const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  -window.innerWidth / 2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  -window.innerHeight / 2,
  -10000,
  10000,
);
camera.position.set(0, 0, 100);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

const interactionTextElement = document.createElement("div");
interactionTextElement.style.position = "fixed";
interactionTextElement.style.left = "50%";
interactionTextElement.style.top = "50%";
interactionTextElement.style.transform = "translate(-50%, -50%)";
interactionTextElement.style.padding = "18px 24px";
interactionTextElement.style.width = "min(420px, 80vw)";
interactionTextElement.style.background = "rgba(15, 15, 15, 0.92)";
interactionTextElement.style.color = "#ffffff";
interactionTextElement.style.border = "2px solid rgba(255, 255, 255, 0.35)";
interactionTextElement.style.borderRadius = "12px";
interactionTextElement.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.35)";
interactionTextElement.style.fontFamily = "sans-serif";
interactionTextElement.style.fontSize = "20px";
interactionTextElement.style.lineHeight = "1.4";
interactionTextElement.style.textAlign = "center";
interactionTextElement.style.zIndex = "1000";
interactionTextElement.style.display = "none";
interactionTextElement.style.pointerEvents = "none";
document.body.appendChild(interactionTextElement);

let interactionTextShowing = false;

function hideInteractionText() {
  interactionTextElement.style.display = "none";
  interactionTextElement.textContent = "";
  interactionTextShowing = false;
}

function showInteractionText(text) {
  interactionTextElement.textContent = text;
  interactionTextElement.style.display = "block";
  interactionTextShowing = true;
}

function backgroundColor(r, g, b) {
  scene.background = new THREE.Color(r / 255, g / 255, b / 255);
}

function createBox(x, y, z, width, height = width, depth = width) {
  const geometry = new THREE.BoxGeometry(width, height, depth);

  const material = new THREE.MeshPhongMaterial({
    color: new THREE.Color(1, 1, 1),
    side: THREE.DoubleSide,
  });
  const box = new THREE.Mesh(geometry, material);
  // Treat x/y/z as the block's corner.
  box.position.set(x + width / 2, y + height / 2, z + depth / 2);

  box.frustumCulled = false;
  return box;
}

function setColor(object, r, g, b) {
  if (object.material) {
    object.material.color.set(new THREE.Color(r / 255, g / 255, b / 255));
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
    let cameraX = player.mesh.position.x;
    let cameraY = player.mesh.position.y;
    if (player.mesh.position.x - halfW <= 0) {
      cameraX = halfW;
    }
    // Fix conditional because it doesn't unlock
    if (-player.mesh.position.y + halfH >= 0) {
      cameraY = halfH;
    }
    camera.position.set(cameraX, cameraY, player.mesh.position.z + 100);
    camera.updateProjectionMatrix();
  }
}

const controller = {
  left: { pressed: false, key: ["a", "A", "ArrowLeft"], timeHeld: 0 },
  right: { pressed: false, key: ["d", "D", "ArrowRight"], timeHeld: 0 },
  jump: { pressed: false, key: ["w", "W", "ArrowUp", " "], timeHeld: 0 },
  down: { pressed: false, key: ["s", "S", "ArrowDown"], timeHeld: 0 },
  interact: { pressed: false, key: ["e", "E"], timeHeld: 0 },
};

window.document.addEventListener("keydown", function (e) {
  if (interactionTextShowing) hideInteractionText();
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
    player.move("left", controller.left.timeHeld);
  } else {
    controller.left.timeHeld--;
    if (controller.left.timeHeld < 0) {
      controller.left.timeHeld = 0;
    }
  }
  if (controller.right.pressed) {
    controller.right.timeHeld++;
    player.move("right", controller.right.timeHeld);
  } else {
    controller.right.timeHeld--;
    if (controller.right.timeHeld < 0) {
      controller.right.timeHeld = 0;
    }
  }
  if (controller.jump.pressed) {
    controller.jump.timeHeld++;
    if (controller.jump.timeHeld === 1) {
      player.jump();
    }
  } else {
    controller.jump.timeHeld = 0;
  }
  if (controller.down.pressed) {
    controller.down.timeHeld++;
    player.passDown = true;
    setTimeout(() => {
      player.passDown = false;
    }, 200);
  } else {
    controller.down.timeHeld--;
    if (controller.down.timeHeld < 0) {
      controller.down.timeHeld = 0;
    }
  }
  if (controller.interact.pressed) {
    controller.interact.timeHeld++;
    if (controller.interact.timeHeld === 1) {
      player.interact();
    }
  } else {
    controller.interact.timeHeld = 0;
  }

  player.update();
  objectLoopFunction((object) => object.update());
  cameraFollowPlayer();
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}
