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

let projectileList = [];

const controller = {
  W: { pressed: false },
  w: { pressed: false },
  A: { pressed: false },
  a: { pressed: false },
  S: { pressed: false },
  s: { pressed: false },
  D: { pressed: false },
  d: { pressed: false },
  R: { pressed: false },
  r: { pressed: false },
  F: { pressed: false },
  f: { pressed: false },
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
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx === 0 && absDy === 0) {
      dx = 1;
      dy = 0;
    } else {
      const maxComponent = Math.max(absDx, absDy);
      const minComponent = Math.min(absDx, absDy);
      const cornerRatioThreshold = 0.75;
      const isNearCorner = minComponent / maxComponent >= cornerRatioThreshold;

      if (!isNearCorner) {
        if (absDx >= absDy) {
          dx = Math.sign(dx);
          dy = 0;
        } else {
          dx = 0;
          dy = Math.sign(dy);
        }
      }
    }

    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const impulse = strength;
    this.knockbackVelocityX += (dx / distance) * impulse;
    this.knockbackVelocityY += (dy / distance) * impulse;
  }
  fireProjectile() {
    if (controller.r.pressed || controller.R.pressed) {
      for (let i = 0; i < 25; i++) {
        const projectile = new Projectile(
          this.x,
          this.y,
          "player",
          "basicPlayer",
        );
        projectileList.push(projectile);
      }
    }
    if (controller.f.pressed || controller.F.pressed) {
      const projectile = new Projectile(
        this.x,
        this.y,
        "player",
        "homingPlayer",
      );
      projectileList.push(projectile);
    }
  }
}

const player = new Player(
  playerX,
  playerY,
  playerSize,
  playerSpeed,
  1000000,
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
    const playerHalf = player.size / 2;
    const enemyAttackHalf = this.size / 2 + this.range;
    const dx = Math.abs(player.x - this.x);
    const dy = Math.abs(player.y - this.y);

    return (
      dx <= playerHalf + enemyAttackHalf && dy <= playerHalf + enemyAttackHalf
    );
  }
  stayOutOfObject(target) {}
  moveTowardsPosition(targetX, targetY, size, gap) {
    const playerHalf = size / 2;
    const enemyHalf = this.size / 2;
    const desiredGap = Math.max(0, gap || 0);
    const minX = targetX - playerHalf - enemyHalf - desiredGap;
    const maxX = targetX + playerHalf + enemyHalf + desiredGap;
    const minY = targetY - playerHalf - enemyHalf - desiredGap;
    const maxY = targetY + playerHalf + enemyHalf + desiredGap;

    // Move toward the closest reachable point around the player's body.
    let desiredX = Math.max(minX, Math.min(this.x, maxX));
    let desiredY = Math.max(minY, Math.min(this.y, maxY));

    if (desiredX === this.x && desiredY === this.y) {
      const deltaLeft = Math.abs(this.x - minX);
      const deltaRight = Math.abs(maxX - this.x);
      const deltaTop = Math.abs(this.y - minY);
      const deltaBottom = Math.abs(maxY - this.y);
      const smallestDelta = Math.min(
        deltaLeft,
        deltaRight,
        deltaTop,
        deltaBottom,
      );

      if (smallestDelta === deltaLeft) desiredX = minX;
      else if (smallestDelta === deltaRight) desiredX = maxX;
      else if (smallestDelta === deltaTop) desiredY = minY;
      else desiredY = maxY;
    }

    const moveDx = desiredX - this.x;
    const moveDy = desiredY - this.y;
    const distance = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
    if (distance > 0) {
      this.x += (moveDx / distance) * this.speed;
      this.y += (moveDy / distance) * this.speed;
      if (distance < this.speed) {
        this.x = desiredX;
        this.y = desiredY;
      }
    }
    if (distance <= this.range) {
      return true;
    }
  }
}

const projectileTypes = {
  basicPlayer: {
    size: 5,
    speed: 10,
    damage: 10,
    color: "yellow",
    lifespan: 60,
  },
  homingPlayer: {
    size: 10,
    speed: 5,
    damage: 15,
    color: "orange",
    lifespan: 180,
  },
};

class Projectile {
  constructor(x, y, creator, type) {
    this.x = x;
    this.y = y;
    this.size = projectileTypes[type].size;
    this.speed = projectileTypes[type].speed;
    this.damage = projectileTypes[type].damage;
    this.lifespan = projectileTypes[type].lifespan;
    this.creator = creator;
    this.type = type;
    if (this.creator === "player") {
      let PROJECTILE_SPREAD_RADIANS =
        Math.sqrt((this.x - mouseX) ** 2 + (this.y - mouseY) ** 2) * 0.0025;
      PROJECTILE_SPREAD_RADIANS = Math.min(PROJECTILE_SPREAD_RADIANS, 0.5);
      const baseDirection = Math.atan2(mouseY - this.y, mouseX - this.x);
      const spreadOffset = (Math.random() * 2 - 1) * PROJECTILE_SPREAD_RADIANS;
      this.direction = baseDirection + spreadOffset;
    }
  }
  createProjectile() {
    ctx.fillStyle = projectileTypes[this.type].color;
    if (this.lifespan <= projectileTypes[this.type].lifespan / 2) {
      ctx.globalAlpha = 0.5;
    } else if (this.lifespan <= projectileTypes[this.type].lifespan / 4) {
      ctx.globalAlpha = 0.25;
    } else if (this.lifespan <= projectileTypes[this.type].lifespan / 8) {
      ctx.globalAlpha = 0.125;
    }
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size,
    );
  }
  moveTowardsPosition(targetX, targetY) {
    const moveDx = targetX - this.x;
    const moveDy = targetY - this.y;
    const distance = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
    if (distance > 0) {
      this.x += (moveDx / distance) * this.speed;
      this.y += (moveDy / distance) * this.speed;
    }
  }
  moveForward() {
    this.x += this.speed * Math.cos(this.direction);
    this.y += this.speed * Math.sin(this.direction);
  }
  destroy(i) {
    projectileList.splice(i, 1);
  }
}

const backgroundColor = (ctx, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
};

const enemyCap = 1500;

function gameLoop() {
  ctx.globalAlpha = 1.0;
  backgroundColor(ctx, "dimgray");
  player.move();
  player.createPlayer();
  player.fireProjectile(10, 10);
  while (enemyList.length < enemyCap) {
    let enemySize = Math.random() * 20 + 30;
    const basicEnemy = new Enemy(
      Math.random() * gameArea.width,
      Math.random() * gameArea.height,
      enemySize,
      enemySize * (Math.random() + 0.5) * 0.15,
      100,
      10,
    );
    enemyList.push(basicEnemy);
  }
  for (let i = 0; i < enemyList.length; i++) {
    enemyList[i].createEnemy("darkred");
    enemyList[i].moveTowardsPosition(player.x, player.y, player.size, 0);
    if (enemyList[i].isPlayerWithinRange(player)) {
      if (enemyList[i].damagePlayer(player)) {
        player.knockback(enemyList[i].x, enemyList[i].y, 1);
      }
    }
  }
  for (let i = 0; i < projectileList.length; i++) {
    projectileList[i].lifespan--;
    if (projectileList[i].lifespan <= 0) {
      projectileList[i].destroy(i);
      continue;
    }
    projectileList[i].createProjectile();
    if (projectileList[i].creator === "player") {
      if (projectileList[i].type === "basicPlayer") {
        projectileList[i].moveForward();
      } else if (projectileList[i].type === "homingPlayer") {
        projectileList[i].moveTowardsPosition(mouseX, mouseY);
      }
      if (
        projectileList[i].x - projectileList[i].size / 2 >
          gameArea.width + projectileList[i].size * 10 ||
        projectileList[i].x + projectileList[i].size / 2 <
          -projectileList[i].size * 10
      ) {
        projectileList[i].destroy(i);
      } else if (
        projectileList[i].y - projectileList[i].size / 2 >
          gameArea.height + projectileList[i].size * 10 ||
        projectileList[i].y + projectileList[i].size / 2 <
          -projectileList[i].size * 10
      ) {
        projectileList[i].destroy(i);
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
  console.log(e.key);
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
