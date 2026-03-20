const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

let globalCameraX = 0;
let globalCameraY = 0;
let relativeCameraX = gameArea.width / 2;
let relativeCameraY = gameArea.height / 2;

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function backgroundColor(color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
}

backgroundColor("black");

const controller = {
  W: { pressed: false },
  w: { pressed: false },
  A: { pressed: false },
  a: { pressed: false },
  D: { pressed: false },
  d: { pressed: false },
  1: { pressed: false },
  2: { pressed: false },
};
class Player {
  constructor(x, y, size, imageSrc) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.image = new Image();
    this.image.src = imageSrc;

    this.velX = 0;
    this.velY = 0;
    this.prevY = y;
    this.speed = 0.5;
    this.friction = 0.92;
    this.gravity = 0.5;
    this.jumpStrength = -11; // perfect 3 block jump (do not touch)
    this.grounded = false;
    this.maxFallSpeed = 15;
    this.maxVelX = 5;
    this.maxVelY = 15;
    this.acceleration = 0;
    this.currentGroundBlock = null;
    this.lastTemporaryBlock = null;

    this.globalOffsetX = 0;
  }

  drawPlayer() {
    if (this.image.complete && this.image.width > 0) {
      let height = this.size * (this.image.height / this.image.width);
      ctx.drawImage(this.image, this.x, this.y, this.size, height);
    }
  }

  move() {
    if (controller.D?.pressed || controller.d?.pressed) {
      if (this.velX < this.maxVelX) this.velX += this.speed;
    }
    if (controller.A?.pressed || controller.a?.pressed) {
      if (this.velX > -this.maxVelX) this.velX -= this.speed;
    }

    this.velX *= this.friction;
    if (this.x >= gameArea.width / 2) {
      this.globalOffsetX += this.velX;
      if (this.globalOffsetX <= 0) {
        this.globalOffsetX = 0;
        this.x += this.velX;
      }
    } else {
      this.x += this.velX;
    }

    if ((controller.W?.pressed || controller.w?.pressed) && this.grounded) {
      this.velY = this.jumpStrength;
      this.grounded = false;
    }

    this.prevY = this.y;

    this.velY += this.gravity;
    if (this.velY > this.maxFallSpeed) {
      this.velY = this.maxFallSpeed;
    }
    this.y += this.velY;
  }

  groundedDetection(object) {
    const previousBottom = this.prevY + this.size;
    const currentBottom = this.y + this.size;

    if (
      previousBottom <= object.y &&
      currentBottom >= object.y &&
      this.x + this.size > object.x &&
      this.x < object.x + object.width
    ) {
      this.grounded = true;
      this.currentGroundBlock = object;
      if (this.currentGroundBlock.temporary && this.currentGroundBlock.timeToDisappear === undefined) {
        object.startTempDisappear();
      }
      this.velY = 0;
      this.y = object.y - this.size;
    }
  }

  gameBoundaryDetection() {
    if (this.x < 0) {
      this.x = 0;
      this.velX = 0;
    } else if (this.y < 0) {
      this.y = 0;
      this.velY = 0;
    } else if (this.y + this.size > gameArea.height) {
      this.y = gameArea.height - this.size;
      this.velY = 0;
      this.grounded = true;
    }
  }
}
const player = new Player(100, 100, 35, "/images/Mario.png");

let activeLevelData = [];

const level1 = [
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [0, 2, 2, 2, 0],
  [0, 0, 0, 0, 3],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
const level2 = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 3],
  [0, 3, 2, 3, 0],
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
];

function gameLoop() {
  ctx.clearRect(0, 0, gameArea.width, gameArea.height);
  backgroundColor("lightblue");
  player.move();
  player.grounded = false;
  player.currentGroundBlock = null;
  for (const row of activeLevelData) {
    for (const block of row) {
      if (block.solid) {
        if (
          Math.abs(player.x - block.x) < 100 &&
          Math.abs(player.y - block.y) < 100
        ) {
          player.groundedDetection(block);
          player.gameBoundaryDetection();
        }
      }
    }
  }
  if (controller["1"]?.pressed) {
    activeLevelData = convertToObjects(level1);
  }
  if (controller["2"]?.pressed) {
    activeLevelData = convertToObjects(level2);
  }
  buildLevel(activeLevelData);
  player.drawPlayer();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  const playButton = document.getElementById("playButton");
  playButton.classList.add("hidden");
  activeLevelData = convertToObjects(level1);
  gameLoop();
  visualViewport.addEventListener("resize", function () {
    //just in case the user changes orientation or something
    gameArea.style.width = "100dvw";
    gameArea.style.height = "100dvh";
    gameArea.width = gameArea.offsetWidth;
    gameArea.height = gameArea.offsetHeight;
  });
}

window.document.addEventListener("keydown", function (e) {
  if (controller[e.key]) {
    controller[e.key].pressed = true;
  }
});

window.document.addEventListener("keyup", function (e) {
  if (controller[e.key]) {
    controller[e.key].pressed = false;
  }
});
