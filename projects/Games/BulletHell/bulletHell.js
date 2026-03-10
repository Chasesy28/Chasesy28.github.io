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
    this.mainColor = color;
    this.color = this.mainColor;
    this.invulnerable = false;
    this.iFrames = 0;
    this.knockbackVelocityX = 0;
    this.knockbackVelocityY = 0;
  }
  createPlayer() {
    if (this.health > 0) {
      if (this.iFrames > 0) {
        this.iFrames--;
        for (let i = 0; i < 5; i++) {
          if ((this.iFrames + i) % 10 == 0) {
            this.color = "red";
            break;
          } else {
            this.color = this.mainColor;
          }
        }
      } else {
        this.color = this.mainColor;
        this.invulnerable = false;
      }
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
      );
    }
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

    this.x += this.knockbackVelocityX;
    this.y += this.knockbackVelocityY;
    this.knockbackVelocityX *= 0.88;
    this.knockbackVelocityY *= 0.88;

    if (Math.abs(this.knockbackVelocityX) < 0.05) {
      this.knockbackVelocityX = 0;
    }
    if (Math.abs(this.knockbackVelocityY) < 0.05) {
      this.knockbackVelocityY = 0;
    }

    if (this.x + this.size / 2 - this.size > gameArea.width) {
      this.x = this.size / 2 - this.size;
    } else if (this.x - this.size / 2 + this.size < 0) {
      this.x = gameArea.width - this.size / 2 + this.size;
    }
    if (this.y + this.size / 2 - this.size > gameArea.height) {
      this.y = this.size / 2 - this.size;
    } else if (this.y - this.size / 2 + this.size < 0) {
      this.y = gameArea.height - this.size / 2 + this.size;
    }
    playerX = this.x;
    playerY = this.y;
  }
  hurt(damage) {
    if (!this.invulnerable) {
      this.health -= damage;
      this.invulnerable = true;
      this.iFrames = 30;
    }
  }
  knockback(sourceX, sourceY, strength) {
    let dx = this.x - sourceX;
    let dy = this.y - sourceY;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      dx = 1;
      dy = 0;
      distance = 1;
    }

    const impulse = strength;
    this.knockbackVelocityX += (dx / distance) * impulse;
    this.knockbackVelocityY += (dy / distance) * impulse;
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
    this.range = size / 6;
    this.attackCooldown = 0;
  }
  createEnemy(color) {
    ctx.fillStyle = "black";
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size,
    );
    ctx.fillStyle = color;
    ctx.fillRect(
      this.x - (this.size - 2.5) / 2,
      this.y - (this.size - 2.5) / 2,
      this.size - 2.5,
      this.size - 2.5,
    );
  }
  damagePlayer(player) {
    if (!player.invulnerable) {
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 2;
        player.hurt(this.damage);
        return true;
      } else {
        this.attackCooldown--;
        return false;
      }
    } else {
      return false;
    }
  }
  isPlayerWithinRange(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hitRange = this.range + this.size / 2 + player.size / 2;

    return distance <= hitRange;
  }
  stayOutOfObject(target) {}
  moveTowardsPosition(targetX, targetY, size) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const stopOffset = size / 2 + this.size / 2;

    if (absDy > absDx) {
      targetY += dy > 0 ? -stopOffset : stopOffset;
    } else if (absDx > absDy) {
      targetX += dx > 0 ? -stopOffset : stopOffset;
    } else if (absDx > 0 || absDy > 0) {
      if (Math.random() < 0.5) {
        targetY += dy > 0 ? -stopOffset : stopOffset;
      } else {
        targetX += dx > 0 ? -stopOffset : stopOffset;
      }
    }

    const moveDx = targetX - this.x;
    const moveDy = targetY - this.y;
    const distance = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
    if (distance > 0) {
      if (distance > this.speed * 10) {
        this.x += (moveDx / distance) * this.speed * 1.5;
        this.y += (moveDy / distance) * this.speed * 1.5;
      } else {
        this.x += (moveDx / distance) * this.speed;
        this.y += (moveDy / distance) * this.speed;
      }
      if (distance < this.speed) {
        this.x = targetX;
        this.y = targetY;
      }
    }
    if (distance <= this.range) {
      return true;
    }
  }
}

const backgroundColor = (ctx, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
};

const enemyCap = 15000;

function gameLoop() {
  backgroundColor(ctx, "dimgray");
  player.move();
  player.createPlayer();
  while (enemyList.length < enemyCap) {
    const enemy1 = new Enemy(
      Math.random() * gameArea.width,
      Math.random() * gameArea.height,
      Math.random() * 20 + 30,
      Math.random() * 1.5 + 5,
      100,
      10,
    );
    enemyList.push(enemy1);
  }
  for (let i = 0; i < enemyList.length; i++) {
    enemyList[i].createEnemy("darkred");
    enemyList[i].moveTowardsPosition(player.x, player.y, player.size);
    if (enemyList[i].isPlayerWithinRange(player)) {
      if (enemyList[i].damagePlayer(player)) {
        player.knockback(enemyList[i].x, enemyList[i].y, 10);
      }
    }
  }
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
