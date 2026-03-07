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

let enemyList = [];

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

class Player {
  constructor(x, y, size, speed, health, color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.health = health;
    this.color = color;
  }
  createPlayer() {
    if (this.health > 0) {
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
      );
    }
    /*if (this.health <= 0) {
      alert("Game Over!");
      window.location.reload();
    }*/
  }
  move() {
    if (controller.W.pressed || controller.w.pressed) {
      this.y -= this.speed;
    }
    if (controller.S.pressed || controller.s.pressed) {
      this.y += this.speed;
    }
    if (controller.A.pressed || controller.a.pressed) {
      this.x -= this.speed;
    }
    if (controller.D.pressed || controller.d.pressed) {
      this.x += this.speed;
    }
    playerX = this.x;
    playerY = this.y;
  }
  hurt(damage) {
    this.health -= damage;
    this.color = "red";
  }
}

const player = new Player(
  playerX,
  playerY,
  playerSize,
  playerSpeed,
  100,
  "white",
);

class Enemy {
  constructor(x, y, size, speed, health, damage) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.health = health;
    this.damage = damage;
  }
  createEnemy(color) {
    ctx.fillStyle = color;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size,
    );
  }
  damagePlayer(player) {
    player.hurt(this.damage);
  }
  moveTowardsPosition(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
      if (distance < this.speed) {
        this.x = targetX;
        this.y = targetY;
      }
    }
  }
}

const backgroundColor = (ctx, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
};

function gameLoop() {
  backgroundColor(ctx, "dimgray");
  player.move();
  player.createPlayer();
  if (enemyList.length < 1) {
    const enemy1 = new Enemy(100, 100, 30, playerSpeed - 1, 100, 10);
    enemyList.push(enemy1);
  }
  enemyList[0].moveTowardsPosition(playerX, playerY);
  if (
    enemyList[0].x < playerX + player.size / 2 &&
    enemyList[0].x > playerX - player.size / 2 &&
    enemyList[0].y < playerY + player.size / 2 &&
    enemyList[0].y > playerY - player.size / 2
  ) {
    enemyList[0].damagePlayer(player);
  }
  enemyList[0].createEnemy("blue");
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
