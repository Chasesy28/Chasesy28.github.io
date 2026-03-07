const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

let mouseX;
let mouseY;

let playerX = gameArea.width / 2;
let playerY = gameArea.height / 2;
let playerSize = 50;
let playerSpeed = 5;

const controller = {
  W: { pressed: false },
  w: { pressed: false },
  A: { pressed: false },
  a: { pressed: false },
  S: { pressed: false },
  s: { pressed: false },
  D: { pressed: false },
  d: { pressed: false },
};

class enemy {
  constructor(x, y, size, speed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
  }
  create(color) {
    ctx.fillStyle = color;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size,
    );
  }
  moveTowardsPlayer() {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }
}

const enemy1 = new enemy(100, 100, 30, 2);

const backgroundColor = (ctx, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
};

function gameLoop() {
  backgroundColor(ctx, "dimgray");
  if (controller.W.pressed || controller.w.pressed) {
    playerY -= playerSpeed;
  }
  if (controller.S.pressed || controller.s.pressed) {
    playerY += playerSpeed;
  }
  if (controller.A.pressed || controller.a.pressed) {
    playerX -= playerSpeed;
  }
  if (controller.D.pressed || controller.d.pressed) {
    playerX += playerSpeed;
  }
  ctx.fillStyle = "red";
  ctx.fillRect(
    playerX - playerSize / 2,
    playerY - playerSize / 2,
    playerSize,
    playerSize,
  );
  enemy1.moveTowardsPlayer();
  enemy1.create("blue");
  requestAnimationFrame(gameLoop);
}

document.addEventListener("mousemove", function (event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

const handleKeyDown = (e) => {
  if (controller[e.key]) {
    controller[e.key].pressed = true;
  }
};

const handleKeyUp = (e) => {
  if (controller[e.key]) {
    controller[e.key].pressed = false;
  }
};

window.document.addEventListener("keydown", handleKeyDown);
window.document.addEventListener("keyup", handleKeyUp);
