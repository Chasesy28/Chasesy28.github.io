const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function backgroundColor(r, g, b, randomize) {
  for (let i = 0; i < Math.max(longestHorizontalLength, gameArea.width / 50); i ++) {
    for (let j = 0; j < Math.max(activeLevelData.length, gameArea.height / 50); j ++) {
      if (randomize) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.1 + 0.85})`;
      } else {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b})`;
      }
      ctx.fillRect((i * 50) - player.globalOffsetX, (j * 50) - player.globalOffsetY, 50.5, 50.5);
    }
  }
}

ctx.fillStyle = "black";
ctx.fillRect(0, 0, gameArea.width, gameArea.height);

const controller = {
  W: { pressed: false },
  w: { pressed: false },
  A: { pressed: false },
  a: { pressed: false },
  D: { pressed: false },
  d: { pressed: false },
  ArrowLeft: { pressed: false },
  ArrowRight: { pressed: false },
};
class Player {
  constructor(x, y, size, imageSrc) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.image = new Image();
    this.image.src = imageSrc;

    this.height = null;

    this.spawnX = x;
    this.spawnY = y;
    this.spawnOffsetX = null;
    this.spawnOffsetY = null;

    this.velX = 0;
    this.velY = 0;
    this.prevY = y;
    this.prevX = x;
    this.speed = 0.5;
    this.gravity = 0.5;
    this.jumpStrength = -11; // perfect 3 block jump (do not touch)
    this.grounded = false;
    this.maxFallSpeed = 15;
    this.maxVelX = 5;
    this.maxVelY = 15;
    this.acceleration = 0;
    this.currentGroundBlock = null;
    this.insideBlock = null;

    this.globalOffsetX = 0;
    this.globalOffsetY = 0;
    this.prevGlobalOffsetX = 0;
    this.prevGlobalOffsetY = 0;

    this.direction = "right";
  }

  spawn() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.globalOffsetX = this.spawnOffsetX;
    this.globalOffsetY = this.spawnOffsetY;
    this.velX = 0;
    this.velY = 0;
  }

  drawPlayer() {
    if (this.image.complete && this.image.width > 0) {
      this.height = this.size * (this.image.height / this.image.width);
      if (this.direction === "right") {
        ctx.drawImage(this.image, Math.round(this.x), Math.round(this.y), this.size, this.height);
      } else {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(this.image, Math.round(-this.x - this.size), Math.round(this.y), this.size, this.height);
        ctx.restore();
      }
    }
  }

  move() {
    if (controller.D?.pressed || controller.d?.pressed) {
      this.direction = "right";
      if (this.velX < this.maxVelX) this.velX += this.speed;
    }
    if (controller.A?.pressed || controller.a?.pressed) {
      this.direction = "left";
      if (this.velX > -this.maxVelX) this.velX -= this.speed;
    }

    if (this.currentGroundBlock != null) {
      this.velX *= this.currentGroundBlock.friction;
    }

    if ((controller.W?.pressed || controller.w?.pressed) && this.grounded) {
      this.velY = this.jumpStrength;
      this.grounded = false;
    }

    this.prevY = this.y;
    this.prevX = this.x;

    if(!this.grounded) {
      this.velY += this.gravity;
      if (this.velY > this.maxFallSpeed) {
        this.velY = this.maxFallSpeed;
      }
    }

    if (this.velX <= 0.1 && this.velX > 0) { this.velX = 0; }
    if (this.velX >= -0.1 && this.velX < 0) { this.velX = 0; }
    if (this.velY <= 0.1 && this.velY > 0) { this.velY = 0; }
    if (this.velY >= -0.1 && this.velY < 0) { this.velY = 0; }

    // Store previous offsets before scrolling
    this.prevGlobalOffsetX = this.globalOffsetX;
    this.prevGlobalOffsetY = this.globalOffsetY;

    this.scrolling();
  }

  scrolling () {
    //Scrolling horizontally
    longestHorizontalLength = Math.max.apply(null, activeLevelData.map(row => row.length));
    if ((this.x >= gameArea.width / 2 || this.globalOffsetX > 0) && this.globalOffsetX < longestHorizontalLength * 50 - gameArea.width) {
      this.globalOffsetX += this.velX;
      if (this.globalOffsetX <= 0) {
        this.globalOffsetX = 0;
        this.x += this.velX;
      }
    } else {
      this.x += this.velX;
    }
    if (this.globalOffsetX >= longestHorizontalLength * 50 - gameArea.width) {
      if (this.x >= gameArea.width / 2) {
        this.globalOffsetX = longestHorizontalLength * 50 - gameArea.width;
      } else if (this.x < gameArea.width / 2) {
        this.globalOffsetX += this.velX;
      }
    }

    //scrolling vertically
    if ((this.y >= gameArea.height / 2 || this.globalOffsetY > 0) && this.globalOffsetY < activeLevelData.length * 50 - gameArea.height) {
      this.globalOffsetY += this.velY;
      if (this.globalOffsetY <= 0) {
        this.globalOffsetY = 0;
        this.y += this.velY;
      }
    } else {
      this.y += this.velY;
    }
    if (this.globalOffsetY >= activeLevelData.length * 50 - gameArea.height) {
      if (this.y >= gameArea.height / 2) {
        this.globalOffsetY = activeLevelData.length * 50 - gameArea.height;
      }
      else if (this.y < gameArea.height / 2) {
        this.globalOffsetY += this.velY;
      }
    }
  }

  groundedDetection(object) {
    // Convert to world space using previous frame offsets
    const previousBottomWorld = this.prevY + this.prevGlobalOffsetY + this.size;
    const currentBottomWorld = this.y + this.globalOffsetY + this.height;
    const blockTopWorld = object.y;

    // Player X in world space
    const playerLeftWorld = this.x + this.prevGlobalOffsetX;
    const playerRightWorld = this.x + this.prevGlobalOffsetX + this.size;
    const blockLeftWorld = object.x;
    const blockRightWorld = object.x + object.width;

    if (
      previousBottomWorld <= blockTopWorld &&
      currentBottomWorld >= blockTopWorld &&
      playerRightWorld > blockLeftWorld &&
      playerLeftWorld < blockRightWorld
    ) {
      this.grounded = true;
      this.currentGroundBlock = object;
      if (this.currentGroundBlock.temporary && this.currentGroundBlock.timeToDisappear === undefined) {
        object.startTempDisappear();
      }
      this.velY = 0;
      this.y = object.y - this.height - this.globalOffsetY;
    }
  }

  gameBoundaryDetection() {
    if (this.x <= 0) {
      this.x = 0;
      this.velX = 0;
    } else if (this.x + this.size > gameArea.width) {
      this.x = gameArea.width - this.size;
      this.velX = 0;
    } else if (this.y <= 0) {
      this.y = 0;
      this.velY = 0;
    } else if (this.y + this.size > gameArea.height) {
      this.spawn();
    }
  }

  insideBlockDetection(block) {
    // Use current offsets for screen-space collision check
    if (
      this.x + this.size > block.x - this.globalOffsetX &&
      this.x < block.x + block.width - this.globalOffsetX &&
      this.y + this.height > block.y - this.globalOffsetY &&
      this.y < block.y + block.height - this.globalOffsetY
    ) {
      this.insideBlock = block;
    } else {
      if (this.insideBlock === block) {
        this.insideBlock = null;
      }
    }
  }
}
const player = new Player(100, 100, 35, "/images/Mario.png");

let currentLevel = 0;
let levelSwitchCooldown = false;
let longestHorizontalLength;
let activeLevelData = [];
const levels = [
  [
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    [0, 2, 2, 2, 0],
    [0, 0, "p", 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [],
    [0, 0, 1],
    [],
    [0, 1],
    [],
    [0, 0, 1],
    [],
    [0, 1],
    [],
    [0, 0, 1],
    [],
    [0, 1],
    [],
    [0, 0, 1],
    [],
    [0, 1],
    [],
    [0, 0, 1],
    [],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [],
    [0, 0, 1],
    [],
    [0, 1],
    [0, 0, 0],
    [0, 0, 1],
    [],
    [0, 1],
    [],
    [0, 0, 1],
    [0],
    [0, 1],
    [0, 0, 0],
    [0, 0, 1],
    [0, 0],
    [0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 4, 4, 4, 4, 5, 4, 4, 4, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  ],
  [
    [],
    [],
    [],
    [],
    [],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [],
    [],
    [],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1],
    [],
    [],
    ["p"],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 3],
    [0, 3, 2, 3, 0],
    ["p", 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, "p", 0, 0, 2, 2, 2, 0, 3, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [],
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0],
  ],
  [
    [],
    [],
    [],
    [],
    [],
    [],
    ["p", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
];

function gameLoop() {
  ctx.clearRect(0, 0, gameArea.width, gameArea.height);
  backgroundColor(173, 216, 230, true);
  player.move();
  player.grounded = false;
  player.currentGroundBlock = null;
  for (const row of activeLevelData) {
    for (const block of row) {
      if (block.solid) {
        if (
          Math.abs(player.x - block.x + player.globalOffsetX) < 100 &&
          Math.abs(player.y - block.y + player.globalOffsetY) < 100
        ) {
          player.groundedDetection(block);
          player.insideBlockDetection(block);
        }
      }
    }
  }
  player.gameBoundaryDetection();
  if (controller["ArrowLeft"]?.pressed) {
    if (!levelSwitchCooldown) {
      levelSwitchCooldown = true;
      setTimeout(() => {
        levelSwitchCooldown = false;
      }, 500);
      if (currentLevel > 0) {
        currentLevel--;
      }
      activeLevelData = convertToObjects(levels[currentLevel]);
    player.spawn();
    }
  }
  if (controller["ArrowRight"]?.pressed) {
    if (!levelSwitchCooldown) {
      levelSwitchCooldown = true;
      setTimeout(() => {
        levelSwitchCooldown = false;
      }, 500);
      if (currentLevel < levels.length - 1) {
        currentLevel++;
      }
      activeLevelData = convertToObjects(levels[currentLevel]);
      player.spawn();
    }
  }
  buildLevel(activeLevelData);
  player.drawPlayer();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  const playButton = document.getElementById("playButton");
  playButton.classList.add("hidden");
  activeLevelData = convertToObjects(levels[currentLevel]);
  player.spawn();
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
