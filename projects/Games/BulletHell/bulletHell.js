const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

let mouseX;
let mouseY;
let mouseDown = false;

let playerX = gameArea.width / 2;
let playerY = gameArea.height / 2;
let playerSize = 40;
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
  "`": { pressed: false },
  R: { pressed: false },
  r: { pressed: false },
};

const weaponTypes = {
  0: {
    projectileType: "basicPlayer",
    shotAmmo: 1,
    cooldown: 0.5 * 60,
  },
  1: {
    projectileType: "shotgunPlayer",
    shotAmmo: 25,
    cooldown: 1 * 60,
  },
  2: {
    projectileType: "homingPlayer",
    shotAmmo: 1,
    cooldown: 20 * 60,
  },
  3: {
    projectileType: "auraPlayer",
    shotAmmo: 1,
    cooldown: 0,
  },
};

class Player {
  constructor(x, y, size, speed, health, color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.sprintSpeed = speed * 1.5;
    this.health = health;
    this.mainColor = color;
    this.color = this.mainColor;
    this.invulnerable = false;
    this.iFrames = 0;
    this.knockbackVelocityX = 0;
    this.knockbackVelocityY = 0;
    this.knockbackResistance = 88 / 100;
    this.weapon = 0;
    const weaponTypeNames = Object.keys(weaponTypes);
    this.weaponCooldowns = Array(weaponTypeNames.length).fill(0);
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
      ctx.fillStyle = "black";
      ctx.fillRect(
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
      );
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.x - (this.size - 2.5) / 2,
        this.y - (this.size - 2.5) / 2,
        this.size - 2.5,
        this.size - 2.5,
      );
    }
  }

  move() {
    const speed = controller["`"].pressed ? this.sprintSpeed : this.speed;
    let moveX = 0;
    let moveY = 0;

    if (controller.W.pressed || controller.w.pressed) {
      moveY -= 1;
    }
    if (controller.S.pressed || controller.s.pressed) {
      moveY += 1;
    }
    if (controller.A.pressed || controller.a.pressed) {
      moveX -= 1;
    }
    if (controller.D.pressed || controller.d.pressed) {
      moveX += 1;
    }

    if (moveX !== 0 || moveY !== 0) {
      const magnitude = Math.hypot(moveX, moveY);
      this.x += (moveX / magnitude) * speed;
      this.y += (moveY / magnitude) * speed;
    }

    this.x += this.knockbackVelocityX;
    this.y += this.knockbackVelocityY;
    this.knockbackVelocityX *= this.knockbackResistance;
    this.knockbackVelocityY *= this.knockbackResistance;

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
    const aura = strength;
    this.knockbackVelocityX += (dx / distance) * aura;
    this.knockbackVelocityY += (dy / distance) * aura;
  }

  fireProjectile() {
    if (this.weapon == 3) {
      const auraCount = 180;
      const auraRadius = this.size * 0.5;
      for (let i = 0; i < auraCount; i++) {
        const angle = (Math.PI * 2 * i) / auraCount;
        const spawnX = this.x + Math.cos(angle) * auraRadius;
        const spawnY = this.y + Math.sin(angle) * auraRadius;
        const projectile = new Projectile(
          spawnX,
          spawnY,
          "player",
          "auraPlayer",
        );
        projectile.direction = angle;
        projectileList.push(projectile);
      }
    } else if (mouseDown && this.weaponCooldowns[this.weapon] <= 0) {
      for (let i = 0; i < weaponTypes[this.weapon].shotAmmo; i++) {
        const projectile = new Projectile(
          this.x,
          this.y,
          "player",
          weaponTypes[this.weapon].projectileType,
        );
        projectileList.push(projectile);
      }
      this.weaponCooldowns[this.weapon] = weaponTypes[this.weapon].cooldown;
    }
    for (let i = 0; i < this.weaponCooldowns.length; i++) {
      if (this.weaponCooldowns[i] > 0) {
        this.weaponCooldowns[i]--;
      }
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

const enemyTypes = {
  basic: {
    size: 40,
    speed: 2.5,
    health: 100,
    damage: 10,
    range: 5,
    attackCooldown: 5,
    gap: 0,
  },
  small: {
    size: 25,
    speed: 5,
    health: 25,
    damage: 5,
    range: 5,
    attackCooldown: 1,
    gap: 0,
  },
  large: {
    size: 75,
    speed: 1,
    health: 300,
    damage: 20,
    range: 10,
    attackCooldown: 10,
    gap: 0,
  },
  rangeBasic: {
    size: 40,
    speed: 2.5,
    health: 100,
    damage: 10,
    range: 200,
    attackCooldown: 5,
    gap: 200,
  },
  boss: {
    size: 100,
    speed: 1.5,
    health: 1000,
    damage: 15,
    range: 10,
    attackCooldown: 3,
    gap: 0,
  },
};

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = enemyTypes[type].size;
    this.speed = enemyTypes[type].speed;
    this.health = enemyTypes[type].health;
    this.damage = enemyTypes[type].damage;
    this.range = enemyTypes[type].range;
    this.gap = enemyTypes[type].gap;
    this.maxAttackCooldown = enemyTypes[type].attackCooldown;
    this.attackCooldown = 0;
    this.knockbackVelocityX = 0;
    this.knockbackVelocityY = 0;
    this.knockbackResistance = 88 / 100;
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
        this.attackCooldown = this.maxAttackCooldown;
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
  stayOutOfObject(target) {
    const targetHalf = target.size / 2;
    const enemyHalf = this.size / 2;
    const minX = target.x - targetHalf - enemyHalf;
    const maxX = target.x + targetHalf + enemyHalf;
    const minY = target.y - targetHalf - enemyHalf;
    const maxY = target.y + targetHalf + enemyHalf;
    if (this.x > minX && this.x < maxX && this.y > minY && this.y < maxY) {
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

      if (smallestDelta === deltaLeft) this.x = minX;
      else if (smallestDelta === deltaRight) this.x = maxX;
      else if (smallestDelta === deltaTop) this.y = minY;
      else this.y = maxY;
    }
  }
  moveTowardsPosition(targetX, targetY, size) {
    const playerHalf = size / 2;
    const enemyHalf = this.size / 2;
    const desiredGap = Math.max(0, this.gap || 0);
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

    this.x += this.knockbackVelocityX;
    this.y += this.knockbackVelocityY;
    this.knockbackVelocityX *= this.knockbackResistance;
    this.knockbackVelocityY *= this.knockbackResistance;

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

    const remainingDx = desiredX - this.x;
    const remainingDy = desiredY - this.y;
    return (
      Math.sqrt(remainingDx * remainingDx + remainingDy * remainingDy) <=
      this.range
    );
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
    const aura = strength;
    this.knockbackVelocityX += (dx / distance) * aura;
    this.knockbackVelocityY += (dy / distance) * aura;
  }
}

const projectileTypes = {
  basicPlayer: {
    size: 5,
    speed: 10,
    damage: 10,
    color: "cyan",
    lifespan: 60,
    projectileSpread: 1e-4,
  },
  shotgunPlayer: {
    size: 5,
    speed: 10,
    damage: 10,
    color: "blue",
    lifespan: 60,
    projectileSpread: 1e-3,
  },
  homingPlayer: {
    size: 10,
    speed: 5,
    damage: 15,
    color: "orange",
    lifespan: 180,
    projectileSpread: 0,
  },
  auraPlayer: {
    size: 5,
    speed: 10,
    damage: 1,
    color: "chocolate",
    lifespan: 15,
    projectileSpread: 0,
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
    this.projectileSpread = projectileTypes[type].projectileSpread;
    if (this.creator === "player") {
      let PROJECTILE_SPREAD_RADIANS =
        Math.sqrt((this.x - mouseX) ** 2 + (this.y - mouseY) ** 2) *
        this.projectileSpread;
      PROJECTILE_SPREAD_RADIANS = Math.min(PROJECTILE_SPREAD_RADIANS, 0.5);
      if (this.type === "shotgunPlayer") {
        PROJECTILE_SPREAD_RADIANS = Math.max(PROJECTILE_SPREAD_RADIANS, 0.1);
      }
      const baseDirection = Math.atan2(mouseY - this.y, mouseX - this.x);
      const spreadOffset = (Math.random() * 2 - 1) * PROJECTILE_SPREAD_RADIANS;
      this.direction = baseDirection + spreadOffset;
    }
  }
  createProjectile() {
    ctx.fillStyle = projectileTypes[this.type].color;
    ctx.globalAlpha = Math.max(
      0.3,
      this.lifespan / projectileTypes[this.type].lifespan,
    );
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
  collideWithTarget(target) {
    const targetHalf = target.size / 2;
    const enemyHalf = this.size / 2;
    const minX = target.x - targetHalf - enemyHalf;
    const maxX = target.x + targetHalf + enemyHalf;
    const minY = target.y - targetHalf - enemyHalf;
    const maxY = target.y + targetHalf + enemyHalf;
    if (this.x > minX && this.x < maxX && this.y > minY && this.y < maxY) {
      return true;
    }
    return false;
  }
}

const backgroundColor = (ctx, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
};

const enemyCap = 5;
let wasRPressed = false;

function resolveEnemyOverlaps() {
  const totalPasses = Math.max(1, enemyList.length);

  for (let pass = 0; pass < totalPasses; pass++) {
    for (let i = 0; i < enemyList.length; i++) {
      for (let j = 0; j < enemyList.length; j++) {
        if (i !== j) {
          enemyList[i].stayOutOfObject(enemyList[j]);
        }
      }
    }

    for (let i = 0; i < enemyList.length; i++) {
      enemyList[i].stayOutOfObject(player);
    }
  }
}

function gameLoop() {
  ctx.globalAlpha = 1.0;
  backgroundColor(ctx, "dimgray");
  player.move();
  player.createPlayer();
  player.fireProjectile();
  const isRPressed = controller.R.pressed || controller.r.pressed;
  if (isRPressed && !wasRPressed) {
    player.weapon = (player.weapon + 1) % Object.keys(weaponTypes).length;
  }
  wasRPressed = isRPressed;
  while (enemyList.length < enemyCap) {
    let enemyTypeKeys = Object.keys(enemyTypes);
    let randomType =
      enemyTypeKeys[Math.floor(Math.random() * enemyTypeKeys.length)];
    const enemy = new Enemy(
      Math.random() * gameArea.width,
      Math.random() * gameArea.height,
      randomType,
    );
    enemyList.push(enemy);
  }

  resolveEnemyOverlaps();

  for (let i = 0; i < enemyList.length; i++) {
    enemyList[i].createEnemy("darkred");
    enemyList[i].moveTowardsPosition(player.x, player.y, player.size, 0);
    if (enemyList[i].isPlayerWithinRange(player)) {
      if (enemyList[i].damagePlayer(player)) {
        player.knockback(enemyList[i].x, enemyList[i].y, 1.5);
      }
    }
  }
  for (let i = 0; i < projectileList.length; i++) {
    if (projectileList[i].lifespan <= 0) {
      projectileList[i].destroy(i);
      continue;
    }
    projectileList[i].createProjectile();
    if (projectileList[i].creator === "player") {
      if (
        projectileList[i].type === "basicPlayer" ||
        projectileList[i].type === "shotgunPlayer" ||
        projectileList[i].type === "auraPlayer"
      ) {
        projectileList[i].moveForward();
      } else if (projectileList[i].type === "homingPlayer") {
        if (projectileList[i].lifespan > 155) {
          projectileList[i].moveForward();
        } else {
          let closestEnemyDistance = Infinity;
          let closestEnemy = null;
          for (let j = 0; j < enemyList.length; j++) {
            let distance = Math.sqrt(
              (enemyList[j].x - projectileList[i].x) ** 2 +
                (enemyList[j].y - projectileList[i].y) ** 2,
            );
            if (distance < closestEnemyDistance) {
              closestEnemyDistance = distance;
              closestEnemy = enemyList[j];
            }
          }
          projectileList[i].moveTowardsPosition(closestEnemy.x, closestEnemy.y);
        }
      }
      let hitEnemy = false;
      for (let j = 0; j < enemyList.length; j++) {
        if (projectileList[i].collideWithTarget(enemyList[j])) {
          enemyList[j].knockback(
            projectileList[i].x,
            projectileList[i].y,
            Math.min(1.5, projectileList[i].damage / 10),
          );
          projectileList[i].destroy(i);
          hitEnemy = true;
          break;
        }
      }
      if (hitEnemy) {
        continue;
      }
      if (
        projectileList[i].x - projectileList[i].size / 2 >
          gameArea.width + projectileList[i].size * 10 ||
        projectileList[i].x + projectileList[i].size / 2 <
          -projectileList[i].size * 10
      ) {
        projectileList[i].destroy(i);
        continue;
      } else if (
        projectileList[i].y - projectileList[i].size / 2 >
          gameArea.height + projectileList[i].size * 10 ||
        projectileList[i].y + projectileList[i].size / 2 <
          -projectileList[i].size * 10
      ) {
        projectileList[i].destroy(i);
        continue;
      }
    }
    projectileList[i].lifespan--;
  }
  requestAnimationFrame(gameLoop);
}

document.addEventListener("mousemove", function (event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

document.addEventListener("mousedown", function (event) {
  mouseDown = true;
});

document.addEventListener("mouseup", function (event) {
  mouseDown = false;
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
