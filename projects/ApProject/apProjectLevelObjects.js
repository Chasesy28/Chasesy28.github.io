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
    if (
      (this.x >= gameArea.width / 2 || this.globalOffsetX > 0) &&
      this.globalOffsetX < longestHorizontalLength * 50 - gameArea.width &&
      longestHorizontalLength * 50 > gameArea.width
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
      this.globalOffsetX >= longestHorizontalLength * 50 - gameArea.width &&
      longestHorizontalLength * 50 > gameArea.width
    ) {
      if (this.x >= gameArea.width / 2) {
        this.globalOffsetX = longestHorizontalLength * 50 - gameArea.width;
      } else if (this.x < gameArea.width / 2) {
        this.globalOffsetX += this.velX;
      }
    }

    //scrolling vertically
    if (
      (this.y >= gameArea.height / 2 || this.globalOffsetY > 0) &&
      this.globalOffsetY < longestVerticalLength * 50 - gameArea.height &&
      longestVerticalLength * 50 > gameArea.height
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
      this.globalOffsetY >= longestVerticalLength * 50 - gameArea.height &&
      longestVerticalLength * 50 > gameArea.height
    ) {
      if (this.y >= gameArea.height / 2) {
        this.globalOffsetY = longestVerticalLength * 50 - gameArea.height;
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

const blockTypes = {
  basic: {
    color: "brown",
    solid: true,
    temporary: false,
    friction: 0.92,
  },
  temporary: {
    color: "gray",
    solid: true,
    temporary: true,
    disappearTime: 30,
    reappearTime: 120,
    friction: 0.92,
  },
  permanentTemporary: {
    color: "dimgray",
    solid: true,
    temporary: true,
    disappearTime: 45,
    reappearTime: undefined,
    friction: 0.92,
  },
  ice: {
    color: "cyan",
    solid: true,
    temporary: false,
    friction: 0.99,
  },
  slow: {
    color: "darkgreen",
    solid: true,
    temporary: false,
    friction: 0.75,
  },
};
class Block {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.color = blockTypes[type].color;
    this.solid = blockTypes[type].solid;
    this.temporary = blockTypes[type].temporary;
    this.timeToDisappear;
    this.timeToReappear;
    this.friction = blockTypes[this.type].friction;
    this.visible = true;
    this.drawn = false;
  }
  draw(alpha) {
    if (this.drawn == false) {
      this.drawn = true;
      const blockTypeData = blockTypes[this.type];
      ctx.globalAlpha = alpha;

      if (this.temporary && this.timeToDisappear !== undefined) {
        this.timeToDisappear -= 1;
        this.drawn = false; // Redraw every frame while disappearing to update alpha
        ctx.globalAlpha = this.timeToDisappear / blockTypeData.disappearTime;
        if (this.timeToDisappear <= 0) {
          this.tempDisappear();
        }
      }
      if (this.temporary && this.timeToReappear !== undefined) {
        this.timeToReappear -= 1;
        this.drawn = false; // Redraw every frame while reappearing to update alpha
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
      ctx.globalAlpha = alpha;
    }
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
    this.color = blockTypes[this.type].color;
    this.timeToReappear = undefined;
    this.visible = true;
  }
}
