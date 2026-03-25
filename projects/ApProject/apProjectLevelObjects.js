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
    this.spawnLayer = null;

    this.velX = 0;
    this.velY = 0;
    this.prevY = y;
    this.prevX = x;
    this.speed = 0.5;
    this.gravity = 0.5;
    this.jumpStrength = -12; // perfect 3 block jump (do not touch)
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

    this.layer = 0;
  }

  spawn() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.layer = this.spawnLayer;
    this.globalOffsetX = this.spawnOffsetX;
    this.globalOffsetY = this.spawnOffsetY;
    this.velX = 0;
    this.velY = 0;
    this.prevY = this.y;
    this.prevX = this.x;
  }

  drawPlayer() {
    if (this.image.complete && this.image.width > 0) {
      this.height = Math.floor(
        this.size * (this.image.height / this.image.width),
      );
      if (this.direction === "right") {
        ctx.drawImage(
          this.image,
          Math.round(this.x),
          Math.round(this.y),
          this.size,
          this.height,
        );
      } else {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
          this.image,
          Math.round(-this.x - this.size),
          Math.round(this.y),
          this.size,
          this.height,
        );
        ctx.restore();
      }
    }
  }

  move(controller) {
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

    if (!this.grounded) {
      this.velY += this.gravity;
      if (this.velY > this.maxFallSpeed) {
        this.velY = this.maxFallSpeed;
      }
    }

    if (this.velX <= 0.1 && this.velX > 0) {
      this.velX = 0;
    }
    if (this.velX >= -0.1 && this.velX < 0) {
      this.velX = 0;
    }
    if (this.velY <= 0.1 && this.velY > 0) {
      this.velY = 0;
    }
    if (this.velY >= -0.1 && this.velY < 0) {
      this.velY = 0;
    }

    // Store previous offsets before scrolling
    this.prevGlobalOffsetX = this.globalOffsetX;
    this.prevGlobalOffsetY = this.globalOffsetY;

    this.scrolling();
  }

  scrolling() {
    //Scrolling horizontally
    let longestHorizontalLayerLength = Math.max.apply(null, activeLevelData[player.layer].map(layer => layer.length))
    if (
      (this.x >= gameArea.width / 2 || this.globalOffsetX > 0) &&
      this.globalOffsetX < longestHorizontalLayerLength * 50 - gameArea.width &&
      longestHorizontalLayerLength * 50 > gameArea.width
    ) {
      this.globalOffsetX += this.velX;
      if (this.globalOffsetX <= 0) {
        this.globalOffsetX = 0;
        this.x += this.velX;
      }
    } else {
      this.x += this.velX;
    }
    if (
      this.globalOffsetX >= longestHorizontalLayerLength * 50 - gameArea.width &&
      longestHorizontalLayerLength * 50 > gameArea.width
    ) {
      if (this.x >= gameArea.width / 2) {
        this.globalOffsetX = longestHorizontalLayerLength * 50 - gameArea.width;
      } else if (this.x < gameArea.width / 2) {
        this.globalOffsetX += this.velX;
      }
    }

    //scrolling vertically
    if (
      (this.y >= gameArea.height / 2 || this.globalOffsetY > 0) &&
      this.globalOffsetY < activeLevelData[player.layer].length * 50 - gameArea.height &&
      activeLevelData[player.layer].length * 50 > gameArea.height
    ) {
      this.globalOffsetY += this.velY;
      if (this.globalOffsetY <= 0) {
        this.globalOffsetY = 0;
        this.y += this.velY;
      }
    } else {
      this.y += this.velY;
    }
    if (
      this.globalOffsetY >= activeLevelData[player.layer].length * 50 - gameArea.height &&
      activeLevelData[player.layer].length * 50 > gameArea.height
    ) {
      if (this.y >= gameArea.height / 2) {
        this.globalOffsetY = activeLevelData[player.layer].length * 50 - gameArea.height;
      } else if (this.y < gameArea.height / 2) {
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
      if (
        this.currentGroundBlock.temporary &&
        this.currentGroundBlock.timeToDisappear === undefined
      ) {
        object.startTempDisappear();
      }
      this.velY = 0;
      this.y = object.y - this.height - this.globalOffsetY;
    }
  }

  sideBlockDetection(object) {
    // Use previous and current world space positions
    const previousPlayerLeftWorld = this.prevX + this.prevGlobalOffsetX;
    const previousPlayerRightWorld = previousPlayerLeftWorld + this.size;

    const playerLeftWorld = this.x + this.globalOffsetX;
    const playerRightWorld = playerLeftWorld + this.size;
    const playerTopWorld = this.y + this.globalOffsetY;
    const playerBottomWorld = playerTopWorld + this.height;

    const blockLeftWorld = object.x;
    const blockRightWorld = object.x + object.width;
    const blockTopWorld = object.y;
    const blockBottomWorld = object.y + object.height;

    // Check for horizontal collision
    if (
      playerBottomWorld > blockTopWorld &&
      playerTopWorld < blockBottomWorld
    ) {
      const pushingIntoLeftFace =
        this.velX > 0 &&
        playerLeftWorld < blockLeftWorld &&
        playerRightWorld > blockLeftWorld;
      const pushingIntoRightFace =
        this.velX < 0 &&
        playerLeftWorld < blockRightWorld &&
        playerRightWorld > blockRightWorld;

      if (
        (previousPlayerRightWorld <= blockLeftWorld &&
          playerRightWorld > blockLeftWorld &&
          this.velX > 0) ||
        pushingIntoLeftFace
      ) {
        // Entered the block from the left this frame.
        this.globalOffsetX = this.prevGlobalOffsetX;
        this.x = blockLeftWorld - this.size - this.globalOffsetX;
        this.velX = 0;
      } else if (
        (previousPlayerLeftWorld >= blockRightWorld &&
          playerLeftWorld < blockRightWorld &&
          this.velX < 0) ||
        pushingIntoRightFace
      ) {
        // Entered the block from the right this frame.
        this.globalOffsetX = this.prevGlobalOffsetX;
        this.x = blockRightWorld - this.globalOffsetX;
        this.velX = 0;
      }
    }
  }

  gameBoundaryDetection() {
    if (this.x <= 0) {
      this.x = 0;
      this.velX = 0;
    }
    if (this.x + this.size > gameArea.width) {
      this.x = gameArea.width - this.size;
      this.velX = 0;
    }
    if (this.y <= 0) {
      this.y = 0;
      this.velY = 0;
    }
    if (this.y + this.size >= gameArea.height) {
      this.spawn();
    }
  }

  isOverlappingBlock(block, usePreviousFrame = false) {
    const offsetX = usePreviousFrame ? this.prevGlobalOffsetX : this.globalOffsetX;
    const offsetY = usePreviousFrame ? this.prevGlobalOffsetY : this.globalOffsetY;
    const playerX = usePreviousFrame ? this.prevX : this.x;
    const playerY = usePreviousFrame ? this.prevY : this.y;

    const playerLeft = playerX + offsetX;
    const playerRight = playerLeft + this.size;
    const playerTop = playerY + offsetY;
    const playerBottom = playerTop + this.height;

    const blockLeft = block.x;
    const blockRight = block.x + block.width;
    const blockTop = block.y;
    const blockBottom = block.y + block.height;

    return (
      playerRight > blockLeft &&
      playerLeft < blockRight &&
      playerBottom > blockTop &&
      playerTop < blockBottom
    );
  }

  insideBlockDetection(block) {
    const isInside = this.isOverlappingBlock(block);

    if (isInside) {
      this.insideBlock = block;
    }

    return isInside;
  }
}

const blockTypes = {
  basic: {
    colorR: 165,
    colorG: 42,
    colorB: 42,
    solid: true,
    temporary: false,
    friction: 0.92,
  },
  temporary: {
    colorR: 128,
    colorG: 128,
    colorB: 128,
    solid: true,
    temporary: true,
    disappearTime: 30,
    reappearTime: 120,
    friction: 0.92,
  },
  permanentTemporary: {
    colorR: 105,
    colorG: 105,
    colorB: 105,
    solid: true,
    temporary: true,
    disappearTime: 45,
    reappearTime: undefined,
    friction: 0.92,
  },
  ice: {
    colorR: 0,
    colorG: 255,
    colorB: 255,
    solid: true,
    temporary: false,
    friction: 0.99,
  },
  slow: {
    colorR: 0,
    colorG: 100,
    colorB: 0,
    solid: true,
    temporary: false,
    friction: 0.75,
  },
};
class Block {
  constructor(x, y, width, height, layer, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.layer = layer;
    this.type = type;
    this.colorR = blockTypes[type].colorR;
    this.colorG = blockTypes[type].colorG;
    this.colorB = blockTypes[type].colorB;
    this.color = `rgb(${this.colorR}, ${this.colorG}, ${this.colorB})`;
    this.solid = blockTypes[type].solid;
    this.temporary = blockTypes[type].temporary;
    this.timeToDisappear;
    this.timeToReappear;
    this.friction = blockTypes[this.type].friction;
    this.visible = true;
    this.previousPlayerOffsetX = player.globalOffsetX;
    this.previousPlayerOffsetY = player.globalOffsetY;
  }
  draw() {
    ctx.globalAlpha = Math.max(0.1, 1 - Math.abs(player.layer - this.layer) * 0.85);
    const blockTypeData = blockTypes[this.type];

    if (this.temporary && this.timeToDisappear !== undefined) {
      this.timeToDisappear -= 1;
      ctx.globalAlpha = this.timeToDisappear / blockTypeData.disappearTime;
      if (this.timeToDisappear <= 0) {
        this.tempDisappear();
      }
    }
    if (this.temporary && this.timeToReappear !== undefined) {
      this.timeToReappear -= 1;
      if (this.timeToReappear <= 0) {
        this.tempReappear();
      }
    }

    if (
      Math.round(this.x - player.globalOffsetX + this.width) < 0 ||
      Math.round(this.x - player.globalOffsetX) > gameArea.width ||
      Math.round(this.y - player.globalOffsetY + this.height) < 0 ||
      Math.round(this.y - player.globalOffsetY) > gameArea.height ||
      ctx.globalAlpha <= 0
    ) {
      this.visible = false;
    } else {
      this.visible = true;
    }

    // Skip rendering if not visible or fully transparent
    if (this.visible && ctx.globalAlpha > 0) {
      ctx.fillStyle = this.color;
      ctx.fillRect(
        Math.round(this.x - player.globalOffsetX),
        Math.round(this.y - player.globalOffsetY),
        this.width,
        this.height,
      );
    }
    ctx.globalAlpha = Math.max(0.1, 1 - Math.abs(player.layer - this.layer) * 0.85);
  }
  startTempDisappear() {
    this.timeToDisappear = blockTypes[this.type].disappearTime;
  }
  tempDisappear() {
    this.solid = false;
    this.color = "rgba(0,0,0,0)";
    this.timeToDisappear = undefined;
    this.timeToReappear = blockTypes[this.type].reappearTime;
    this.visible = false;
  }
  tempReappear() {
    this.solid = true;
    this.color = `rgb(${this.colorR}, ${this.colorG}, ${this.colorB})`;
    this.timeToReappear = undefined;
    this.visible = true;
  }
}
