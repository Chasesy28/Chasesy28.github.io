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
};

class Player {
  constructor(x, y, size, imageSrc) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.image = new Image();
    this.image.src = imageSrc;
    this.grounded = false;
    this.jumping = false;
  }
  drawPlayer() {
    let height = this.size * (this.image.height / this.image.width);
    ctx.drawImage(this.image, this.x, this.y, this.size, height);
  }
  move() {
    if (!this.grounded && !this.jumping) {
      this.y += 5;
    }
    if (controller.W.pressed || controller.w.pressed) {
      this.jumping = true;
      this.y -= 5;
    } else {
      this.jumping = false;
    }
    if (controller.A.pressed || controller.a.pressed) {
      this.x -= 5;
    }
    if (controller.D.pressed || controller.d.pressed) {
      this.x += 5;
    }
  }
  groundedDetection(object) {
    if (this.y + this.size >= object.y && this.y < object.y + object.height && this.x + this.size > object.x && this.x < object.x + object.width) {
      this.grounded = true;
      this.y = object.y - this.size;
    } else {
      this.grounded = false;
    }
  }
}

const player = new Player(100, 100, 35, "/images/Mario.png");

let activeLevelData = [];

const level1 = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 1],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 1, 0, 1, 0],
];

function gameLoop() {
  backgroundColor("lightblue");
  activeLevelData = convertToObjects(level1);
  buildLevel(activeLevelData);
  player.drawPlayer();
  player.move();
  for (let i = 0; i < activeLevelData.length; i++) {
    for (let j = 0; j < activeLevelData[i].length; j++) {
      if (activeLevelData[i][j].solid) {
        player.groundedDetection(activeLevelData[i][j]);
      }
    }
  }
  requestAnimationFrame(gameLoop);
}

function startGame() {
  const playButton = document.getElementById("playButton");
  playButton.classList.add("hidden");
  gameLoop();
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
