//apProjectLevelObjects.js
function getBlockTexturePath(index) {
  return `images/Block-assets/texture_16px ${index}.png`;
}

class Player {
  constructor(size, imageSrc) {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.baseSize = size;
    this.size = size;
    this.image = new Image();
    this.image.src = imageSrc;

    this.r = 255;
    this.g = 0;
    this.b = 255;

    this.width = null;

    this.spawnValues = [];

    this.velX = 0;
    this.velY = 0;
    this.velZ = 0;
    this.prevY = 0;
    this.prevX = 0;
    this.speed = 0.3;
    this.gravity = 0.5;
    this.jumpStrength = -11;
    this.jumps = 0;
    this.maxAirJumps = 1;
    this.grounded = false;
    this.maxFallSpeed = 15;
    this.maxVelX = 5;
    this.maxVelY = 15;
    this.currentGroundBlock = null;
    this.insideBlock = null;

    this.globalOffsetX = 0;
    this.globalOffsetY = 0;
    this.prevGlobalOffsetX = 0;
    this.prevGlobalOffsetY = 0;

    this.direction = "right";

    this.layer = 0;

    this.dead = false;
    this.canMove = true;

    this.alpha = 1;

    this.sizeChangeCooldown = false;
    this.state = 0;
  }

  spawn() {
    this.dead = false;
    this.canMove = true;
    this.alpha = 1;

    if (webGl3d) {
      ambientLight.color.set(0x404040);
    }

    this.x = this.spawnValues[currentArea][0];
    this.y = this.spawnValues[currentArea][1];
    if (this.state === 1) {
      this.y -= this.baseSize * 1.5;
    } else if (this.state === -1) {
      this.y += this.baseSize * 0.5;
    }
    this.layer = this.spawnValues[currentArea][2];
    this.z = this.layer * 50;
    this.globalOffsetX = this.spawnValues[currentArea][3];
    this.globalOffsetY = this.spawnValues[currentArea][4];

    this.velX = 0;
    this.velY = 0;
    this.prevY = this.y;
    this.prevX = this.x;
  }

  die() {
    this.dead = true;
    this.canMove = false;
  }

  drawPlayer() {
    this.width = Math.floor(this.size * (this.image.width / this.image.height));
    if (this.dead) {
      this.alpha -= 0.01;
      if (webGl3d) {
        ambientLight.color.set(`rgb(${Math.floor(105 * this.alpha)}, 0, 0)`);
        sceneBackgroundColor(Math.floor(105 * this.alpha), 0, 0);
      }
      if (this.alpha <= 0) {
        this.spawn();
      }
    }
    if (this.image.complete && this.image.width > 0 && !webGl) {
      ctx.globalAlpha = this.alpha;
      if (this.direction === "right") {
        ctx.drawImage(
          this.image,
          Math.round(this.x),
          Math.round(this.y),
          this.width,
          this.size,
        );
      } else {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
          this.image,
          Math.round(-this.x - this.width),
          Math.round(this.y),
          this.width,
          this.size,
        );
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    } else if (webGl && this.direction === "right") {
      renderImage(
        this.image,
        Math.round(this.x),
        Math.round(this.y),
        this.width,
        this.size,
        this.alpha,
      );
    } else if (webGl && this.direction === "left") {
      renderImage(
        this.image,
        Math.round(this.x) + this.width,
        Math.round(this.y),
        this.width * -1,
        this.size,
        this.alpha,
      );
    }
  }

  move(controller) {
    if (!webGl3d) {
      this.z = this.layer * 50;
    }
    if (this.canMove) {
      if (!webGl3d) {
        if (controller.right.pressed) {
          this.direction = "right";
          if (this.velX < this.maxVelX) this.velX += this.speed;
        }
        if (controller.left.pressed) {
          this.direction = "left";
          if (this.velX > -this.maxVelX) this.velX -= this.speed;
        }
      }

      if (
        this.currentGroundBlock != null &&
        !controller.right.pressed &&
        !controller.left.pressed
      ) {
        this.velX *= this.currentGroundBlock.friction;
      }
      if (this.insideBlock !== null) {
        if (this.insideBlock.type === "cobweb") {
          this.velX *= this.insideBlock.friction;
          if (webGl3d) {
            this.velZ *= this.insideBlock.friction;
          }
        }
      }

      if (controller.jump.pressed && this.grounded && !this.jumpCooldown) {
        this.velY = this.jumpStrength;
        this.grounded = false;
        setTimeout(() => {
          this.jumpCooldown = false;
        }, 200);
        this.jumpCooldown = true;
      } else if (
        controller.jump.pressed &&
        this.jumps >= 1 &&
        !this.jumpCooldown
      ) {
        this.velY = this.jumpStrength * 0.75;
        this.jumps -= 1;
        setTimeout(() => {
          this.jumpCooldown = false;
        }, 200);
        this.jumpCooldown = true;
      }

      this.prevY = this.y;
      this.prevX = this.x;

      if (!this.grounded) {
        this.velY += this.gravity;
        if (this.insideBlock !== null) {
          this.velY *= this.insideBlock.verticalFriction;
        }
        if (this.velY > this.maxFallSpeed) {
          this.velY = this.maxFallSpeed;
        }
      }

      this.snapVelocityToZero("velX");
      this.snapVelocityToZero("velY");

      // Store previous offsets before scrolling
      this.prevGlobalOffsetX = this.globalOffsetX;
      this.prevGlobalOffsetY = this.globalOffsetY;

      this.scrolling();

      if (webGl3d) {
        if (controller.forward.pressed) {
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          forward.y = 0;
          forward.normalize();
          forward.multiplyScalar(this.speed);
          this.velX += forward.x;
          this.velZ += forward.z;
        }
        if (controller.backward.pressed) {
          const backward = new THREE.Vector3();
          camera.getWorldDirection(backward);
          backward.y = 0;
          backward.normalize();
          backward.multiplyScalar(this.speed);
          this.velX -= backward.x;
          this.velZ -= backward.z;
        }
        if (controller.left.pressed) {
          const left = new THREE.Vector3();
          camera.getWorldDirection(left);
          left.y = 0;
          left.cross(camera.up);
          left.normalize();
          left.multiplyScalar(this.speed);
          this.velX -= left.x;
          this.velZ -= left.z;
        }
        if (controller.right.pressed) {
          const right = new THREE.Vector3();
          camera.getWorldDirection(right);
          right.y = 0;
          right.cross(camera.up);
          right.normalize();
          right.multiplyScalar(this.speed);
          this.velX += right.x;
          this.velZ += right.z;
        }
        if (Math.abs(this.velX) + Math.abs(this.velZ) > this.maxVelX) {
          const angle = Math.atan2(this.velZ, this.velX);
          this.velX = Math.cos(angle) * this.maxVelX;
          this.velZ = Math.sin(angle) * this.maxVelX;
        }
        if (
          this.currentGroundBlock != null &&
          !controller.right.pressed &&
          !controller.left.pressed &&
          !controller.forward.pressed &&
          !controller.backward.pressed
        ) {
          this.velX *= this.currentGroundBlock.friction;
          this.velZ *= this.currentGroundBlock.friction;
        }
        this.x += this.velX;
        this.z += this.velZ;
        this.layer = Math.round(this.z / 50);
      }
    }
  }

  snapVelocityToZero(axis, threshold = 0.1) {
    if (Math.abs(this[axis]) <= threshold) {
      this[axis] = 0;
    }
  }

  scrolling() {
    let longestHorizontalLayerLength = 0;
    let longestVerticalLayerLength = 0;
    try {
      for (let i = 0; i < activeLevelData[currentArea].length; i++) {
        if (
          activeLevelData[currentArea][i].length > longestHorizontalLayerLength
        ) {
          longestHorizontalLayerLength = activeLevelData[currentArea][i].length;
        }
        if (
          activeLevelData[currentArea][i].length > longestVerticalLayerLength
        ) {
          longestVerticalLayerLength = activeLevelData[currentArea][i].length;
        }
      }
    } catch (error) {
      console.warn("[APProject] Failed to read level bounds for scrolling", {
        currentArea,
        playerLayer: this.layer,
        error,
      });
      this.x += this.velX;
      this.y += this.velY;
      return;
    }
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
      this.globalOffsetX >=
        longestHorizontalLayerLength * 50 - gameArea.width &&
      longestHorizontalLayerLength * 50 > gameArea.width
    ) {
      if (this.x >= gameArea.width / 2) {
        this.globalOffsetX = longestHorizontalLayerLength * 50 - gameArea.width;
      } else if (this.x < gameArea.width / 2) {
        this.globalOffsetX += this.velX;
      }
    }

    if (
      (this.y >= gameArea.height / 2 || this.globalOffsetY > 0) &&
      this.globalOffsetY < longestVerticalLayerLength * 50 - gameArea.height &&
      longestVerticalLayerLength * 50 > gameArea.height
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
      this.globalOffsetY >= longestVerticalLayerLength * 50 - gameArea.height &&
      longestVerticalLayerLength * 50 > gameArea.height
    ) {
      if (this.y >= gameArea.height / 2) {
        this.globalOffsetY = longestVerticalLayerLength * 50 - gameArea.height;
      } else if (this.y < gameArea.height / 2) {
        this.globalOffsetY += this.velY;
      }
    }
  }

  getWorldBounds(usePreviousFrame = false) {
    const offsetX = usePreviousFrame
      ? this.prevGlobalOffsetX
      : this.globalOffsetX;
    const offsetY = usePreviousFrame
      ? this.prevGlobalOffsetY
      : this.globalOffsetY;
    const playerX = usePreviousFrame ? this.prevX : this.x;
    const playerY = usePreviousFrame ? this.prevY : this.y;

    const left = playerX + offsetX;
    const top = playerY + offsetY;

    return {
      left,
      right: left + this.width,
      top,
      bottom: top + this.size,
    };
  }

  resolveSolidCollision(object) {
    if (!object || !object.solid) {
      return;
    }

    const previousBounds = this.getWorldBounds(true);
    let currentBounds = this.getWorldBounds(false);

    const blockLeft = object.x;
    const blockRight = object.x + object.width;
    const blockTop = object.y;
    const blockBottom = object.y + object.height;

    const overlapsY =
      currentBounds.bottom > blockTop && currentBounds.top < blockBottom;

    if (overlapsY) {
      const enteredLeftFace =
        previousBounds.right <= blockLeft &&
        currentBounds.right > blockLeft &&
        this.velX > 0;
      const enteredRightFace =
        previousBounds.left >= blockRight &&
        currentBounds.left < blockRight &&
        this.velX < 0;

      if (enteredLeftFace) {
        this.globalOffsetX = this.prevGlobalOffsetX;
        this.x = blockLeft - this.width - this.globalOffsetX;
        this.velX = 0;
      } else if (enteredRightFace) {
        this.globalOffsetX = this.prevGlobalOffsetX;
        this.x = blockRight - this.globalOffsetX;
        this.velX = 0;
      }
    }

    currentBounds = this.getWorldBounds(false);
    const overlapsX =
      currentBounds.right > blockLeft && currentBounds.left < blockRight;

    if (overlapsX) {
      const landedOnTop =
        previousBounds.bottom <= blockTop &&
        currentBounds.bottom >= blockTop &&
        this.velY >= 0;
      const hitUnderside =
        previousBounds.top >= blockBottom &&
        currentBounds.top <= blockBottom &&
        this.velY < 0;

      if (landedOnTop) {
        this.grounded = true;
        this.jumps = this.maxAirJumps;
        this.currentGroundBlock = object;
        if (
          this.currentGroundBlock.temporary &&
          this.currentGroundBlock.timeToDisappear === undefined
        ) {
          object.startTempDisappear();
        }
        this.velY = 0;
        this.y = object.y - this.size - this.globalOffsetY;
      } else if (hitUnderside) {
        this.velY = 0;
        this.y = blockBottom - this.globalOffsetY;
      }
    }
  }

  groundedDetection(object) {
    this.resolveSolidCollision(object);
  }

  sideBlockDetection(object) {
    this.resolveSolidCollision(object);
  }

  gameBoundaryDetection() {
    if (this.x <= 0 && !webGl3d) {
      this.x = 0;
      this.velX = 0;
    }
    if (this.x + this.width > gameArea.width && !webGl3d) {
      this.x = gameArea.width - this.width;
      this.velX = 0;
    }
    if (this.y <= 0 && !webGl3d) {
      this.y = 0;
      this.velY = 0;
    }
    if (this.y + this.size >= gameArea.height) {
      this.spawn();
    }
  }

  isOverlappingObject(object, usePreviousFrame = false) {
    const offsetX = usePreviousFrame
      ? this.prevGlobalOffsetX
      : this.globalOffsetX;
    const offsetY = usePreviousFrame
      ? this.prevGlobalOffsetY
      : this.globalOffsetY;
    const playerX = usePreviousFrame ? this.prevX : this.x;
    const playerY = usePreviousFrame ? this.prevY : this.y;

    const playerLeft = playerX + offsetX;
    const playerRight = playerLeft + this.width;
    const playerTop = playerY + offsetY;
    const playerBottom = playerTop + this.size;

    const objectLeft = object.x;
    const objectRight = object.x + object.width;
    const objectTop = object.y;
    const objectBottom = object.y + object.height;

    return (
      playerRight > objectLeft &&
      playerLeft < objectRight &&
      playerBottom > objectTop &&
      playerTop < objectBottom
    );
  }

  insideBlockDetection(block) {
    const isInside = this.isOverlappingObject(block);

    if (isInside) {
      this.insideBlock = block;
    }

    return isInside;
  }
}

function newPlayer() {
  return new Player(50, "images/Mario.png");
}

let defaultFriction = 0.8;

const blockTypes = {
  basic: {
    colorR: 165,
    colorG: 42,
    colorB: 42,
    solid: true,
    temporary: false,
    friction: defaultFriction,
    verticalFriction: 1,
    textureIndex: 66,
    texture: "images/Block-assets/texture_16px 66.png",
  },
  temporary: {
    colorR: 128,
    colorG: 128,
    colorB: 128,
    solid: true,
    temporary: true,
    disappearTime: 30,
    reappearTime: 120,
    friction: defaultFriction,
    verticalFriction: 1,
    textureIndex: 113,
    texture: "images/Block-assets/texture_16px 113.png",
  },
  permanentTemporary: {
    colorR: 105,
    colorG: 105,
    colorB: 105,
    solid: true,
    temporary: true,
    disappearTime: 45,
    reappearTime: undefined,
    friction: defaultFriction,
    verticalFriction: 1,
    textureIndex: 144,
    texture: "images/Block-assets/texture_16px 144.png",
  },
  ice: {
    colorR: 0,
    colorG: 255,
    colorB: 255,
    solid: true,
    temporary: false,
    friction: 0.99,
    verticalFriction: 1,
    textureIndex: 201,
    texture: "images/Block-assets/texture_16px 201.png",
  },
  slow: {
    colorR: 0,
    colorG: 100,
    colorB: 0,
    solid: true,
    temporary: false,
    friction: 0.75,
    verticalFriction: 1,
    textureIndex: 206,
    texture: "images/Block-assets/texture_16px 206.png",
  },
  cobweb: {
    colorR: 255,
    colorG: 255,
    colorB: 255,
    solid: false,
    temporary: false,
    friction: 0.5,
    verticalFriction: 0.25,
    textureIndex: 339,
    texture: "images/Block-assets/texture_16px 339.png",
  },
  spike: {
    colorR: 0,
    colorG: 0,
    colorB: 0,
    solid: false,
    temporary: false,
    friction: 1,
    verticalFriction: 1,
    textureIndex: 487,
    texture: "images/Block-assets/texture_16px 487.png",
  },
  areaDoorBottom: {
    colorR: 255,
    colorG: 215,
    colorB: 0,
    solid: false,
    temporary: false,
    friction: 1,
    verticalFriction: 1,
    textureIndex: 590,
    texture: "images/Block-assets/texture_16px 591.png",
  },
  areaDoorTop: {
    colorR: 255,
    colorG: 215,
    colorB: 0,
    solid: false,
    temporary: false,
    friction: 1,
    verticalFriction: 1,
    textureIndex: 591,
    texture: "images/Block-assets/texture_16px 590.png",
  },
};

class Block {
  static texturePool = [];
  static texturesLoaded = false;

  static getTexture(index) {
    if (!Block.texturePool[index - 1]) {
      const image = new Image();
      try {
        image.src = getBlockTexturePath(index);
      } catch (error) {
        console.warn("[APProject] Failed to load block texture", {
          textureIndex: index,
          error,
        });
      }
      Block.texturePool[index - 1] = image;
    }

    return Block.texturePool[index - 1];
  }

  static initializeTextures() {
    if (Block.texturesLoaded) {
      return;
    }

    const textureIndexes = [
      ...new Set(
        Object.values(blockTypes)
          .map((blockType) => blockType.textureIndex)
          .filter((textureIndex) => Number.isInteger(textureIndex)),
      ),
    ];

    textureIndexes.forEach((index) => {
      Block.getTexture(index);
    });

    Block.texturesLoaded = true;
  }

  constructor(x, y, width, height, layer, type, doorArea) {
    Block.initializeTextures();

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.layer = layer;
    this.type = type;
    this.colorR = blockTypes[type].colorR;
    this.colorG = blockTypes[type].colorG;
    this.colorB = blockTypes[type].colorB;
    this.alpha = 1;
    this.color = `rgba(${this.colorR}, ${this.colorG}, ${this.colorB}, ${this.alpha})`;
    this.solid = blockTypes[type].solid;
    this.temporary = blockTypes[type].temporary;
    this.timeToDisappear;
    this.timeToReappear;
    this.friction = blockTypes[this.type].friction;
    this.verticalFriction = blockTypes[this.type].verticalFriction;
    this.textureIndex = blockTypes[this.type].textureIndex || 1;
    this.visible = true;
    this.doorArea = null;
    if (this.type === "areaDoorBottom" || this.type === "areaDoorTop") {
      this.doorArea = doorArea;
    }

    this.cube = null;

    this.isBlock = true;
    this.isEnemy = false;
    this.texture = Block.getTexture(this.textureIndex);

    this.setTexture = false;
  }
  colorReset() {
    this.color = `rgba(${this.colorR}, ${this.colorG}, ${this.colorB}, ${this.alpha})`;
  }
  draw() {
    if (!webGl3d) {
      this.alpha = Math.max(
        0.1,
        1 - Math.abs(player.layer - this.layer) * 0.85,
      );
    } else {
      this.alpha = 1;
    }
    const blockTypeData = blockTypes[this.type];

    if (this.temporary && this.timeToDisappear !== undefined) {
      this.timeToDisappear -= 1;
      this.alpha = this.timeToDisappear / blockTypeData.disappearTime;
      this.colorReset();
      if (this.timeToDisappear <= 0) {
        this.tempDisappear();
      }
    }
    if (this.temporary && this.timeToReappear !== undefined) {
      this.timeToReappear -= 1;
      this.colorReset();
      if (this.timeToReappear <= 0) {
        this.tempReappear();
      }
    }

    if (this.layer !== player.layer) {
      let color = Math.max(this.colorR, this.colorG, this.colorB);
      color = Math.floor(
        color * (1 - Math.abs(player.layer - this.layer) * 0.85),
      );
      this.color = `rgba(${color}, ${color}, ${color}, ${this.alpha})`;
    } else {
      this.colorReset();
    }

    if (this.alpha <= 0 || this.timeToReappear !== undefined) {
      this.visible = false;
    } else {
      this.visible = true;
    }

    if (
      !webGl3d &&
      (Math.round(this.x - player.globalOffsetX + this.width) < 0 ||
        Math.round(this.x - player.globalOffsetX) > gameArea.width ||
        Math.round(this.y - player.globalOffsetY + this.height) < 0 ||
        Math.round(this.y - player.globalOffsetY) > gameArea.height)
    ) {
      this.visible = false;
    }

    const shouldUseTextures =
      window.gameSettings && window.gameSettings.blockImages !== false;

    // Skip rendering if not visible or fully transparent
    if (this.visible && this.alpha > 0) {
      const renderX = Math.round(this.x - player.globalOffsetX);
      const renderY = Math.round(this.y - player.globalOffsetY);
      if (shouldUseTextures && this.texture && !webGl && !webGl3d) {
        const previousSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = this.alpha;
        ctx.drawImage(this.texture, renderX, renderY, this.width, this.height);
        ctx.globalAlpha = 1;
        ctx.imageSmoothingEnabled = previousSmoothing;
      } else if (!webGl && !webGl3d) {
        ctx.fillStyle = this.color;
        ctx.fillRect(renderX, renderY, this.width, this.height);
      } else if (webGl && shouldUseTextures && this.texture && !webGl3d) {
        renderImage(
          this.texture,
          renderX,
          renderY,
          this.width,
          this.height,
          this.alpha,
        );
      } else if (webGl && !webGl3d) {
        let index = Object.keys(blockTypes).indexOf(this.type);
        renderRect(
          renderX,
          renderY,
          this.width,
          this.height,
          index,
          this.alpha,
        );
      } else if (webGl3d) {
        if (!this.cube) {
          this.cube = createColoredCube(this.colorR, this.colorG, this.colorB);
        } else {
          this.cube.visible = true;
        }
        if (shouldUseTextures && this.texture && !this.setTexture) {
          setTexture(this.cube, this.texture);
          this.setTexture = true;
        } else if (!shouldUseTextures) {
          setColor(this.cube, this.colorR, this.colorG, this.colorB);
          this.setTexture = false;
        }
        this.cube.position.x = renderX;
        this.cube.position.y = renderY;
        this.cube.position.z = this.layer * 50;
        setOpacity(this.cube, this.alpha);
      }
    } else if (webGl3d && this.cube) {
      this.visible = true;
    }

    if (!webGl3d) {
      this.alpha = Math.max(
        0.1,
        1 - Math.abs(player.layer - this.layer) * 0.85,
      );
    } else {
      this.alpha = 1;
    }
  }
  startTempDisappear() {
    this.timeToDisappear = blockTypes[this.type].disappearTime;
  }
  tempDisappear() {
    this.solid = false;
    this.timeToDisappear = undefined;
    this.timeToReappear = blockTypes[this.type].reappearTime;
    this.visible = false;
  }
  tempReappear() {
    this.solid = true;
    this.alpha = 1;
    this.colorReset();
    this.timeToReappear = undefined;
    this.visible = true;
  }
}

const enemyTypes = {
  0: {
    name: "Horizontal Patroller",
    width: 50,
    height: 50,
    speed: 1,
    movement: "horizontalPatrol",
    colorR: 255,
    colorG: 0,
    colorB: 0,
  },
  1: {
    name: "Vertical Patroller",
    width: 50,
    height: 50,
    speed: 1,
    movement: "verticalPatrol",
    colorR: 0,
    colorG: 0,
    colorB: 255,
  },
};

class Enemy {
  constructor(x, y, type, layer) {
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.type = type;
    this.width = enemyTypes[type].width;
    this.height = enemyTypes[type].height;
    this.speed = enemyTypes[type].speed;
    this.direction = 1;
    this.movement = enemyTypes[type].movement;
    /*this.image = new Image();
    this.image.src = enemyTypes[type].imageSrc;*/

    this.colorR = enemyTypes[type].colorR;
    this.colorG = enemyTypes[type].colorG;
    this.colorB = enemyTypes[type].colorB;
    this.alpha = 1;
    this.color = `rgba(${this.colorR}, ${this.colorG}, ${this.colorB}, ${this.alpha})`;

    this.isBlock = false;
    this.isEnemy = true;

    this.cube = null;
    this.model = "./3D-Models/snowball_dark.glb";
  }

  colorReset() {
    this.color = `rgba(${this.colorR}, ${this.colorG}, ${this.colorB}, ${this.alpha})`;
  }

  draw() {
    if (!webGl3d) {
      this.alpha = Math.max(
        0.1,
        1 - Math.abs(player.layer - this.layer) * 0.85,
      );
    } else if (webGl3d) {
      this.alpha = 1;
    }

    if (this.layer !== player.layer) {
      let color = Math.max(this.colorR, this.colorG, this.colorB);
      color = Math.floor(
        color * (1 - Math.abs(player.layer - this.layer) * 0.85),
      );
      this.color = `rgba(${color}, ${color}, ${color}, ${this.alpha})`;
    } else {
      this.colorReset();
    }

    if (
      Math.round(this.x - player.globalOffsetX + this.width) < 0 ||
      Math.round(this.x - player.globalOffsetX) > gameArea.width ||
      Math.round(this.y - player.globalOffsetY + this.height) < 0 ||
      Math.round(this.y - player.globalOffsetY) > gameArea.height ||
      this.alpha <= 0
    ) {
      this.visible = false;
    } else {
      this.visible = true;
    }

    // Skip rendering if not visible or fully transparent
    if (this.visible && this.alpha > 0) {
      if (webGl && !webGl3d) {
        let index =
          Object.keys(enemyTypes).indexOf(this.type) +
          Object.keys(blockTypes).length;
        renderRect(
          Math.round(this.x - player.globalOffsetX),
          Math.round(this.y - player.globalOffsetY),
          this.width,
          this.height,
          index,
          this.alpha,
        );
      } else if (!webGl && !webGl3d) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
          Math.round(this.x - player.globalOffsetX),
          Math.round(this.y - player.globalOffsetY),
          this.width,
          this.height,
        );
      } else if (webGl3d) {
        if (!this.cube) {
          //this.cube = createColoredCube(this.colorR, this.colorG, this.colorB);
          this.cube = createModel(this.model);
        } else {
          this.cube.visible = true;
        }
        this.cube.position.x = Math.round(this.x - player.globalOffsetX);
        this.cube.position.y = Math.round(this.y - player.globalOffsetY);
        this.cube.position.z = this.layer * 50;
        this.cube.scale.set(this.width, this.height, this.width);
        setOpacity(this.cube, this.alpha);
      }
    } else if (webGl3d && this.cube) {
      this.cube.visible = false;
    }
    this.alpha = Math.max(0.1, 1 - Math.abs(player.layer - this.layer) * 0.85);
  }

  update() {
    if (this.movement === "horizontalPatrol") {
      this.horizontalPatrol();
    } else if (this.movement === "verticalPatrol") {
      this.verticalPatrol();
    }
  }

  // ↓ I'm Probably going to use this as my part of the ap project ↓
  getSolidBlocksOnLayer() {
    const solids = [];
    const layerData = activeLevelData[currentArea][this.layer];
    // Loop through the rows of the layer
    for (let i = 0; i < layerData.length; i++) {
      // Loop through the columns of the layer
      for (let j = 0; j < layerData[i].length; j++) {
        const object = layerData[i][j];
        if (object.isBlock && object.solid) {
          solids.push(object);
        }
      }
    }
    return solids;
  }

  collidesWithSolid(nextX, nextY, solids) {
    for (let i = 0; i < solids.length; i++) {
      const block = solids[i];
      const overlapX =
        nextX < block.x + block.width && nextX + this.width > block.x;
      const overlapY =
        nextY < block.y + block.height && nextY + this.height > block.y;
      if (overlapX && overlapY) {
        return true;
      }
    }
    return false;
  }

  hasGroundAhead(nextX, solids) {
    const lookAheadX = nextX + (this.direction > 0 ? this.width : 0);
    const feetY = this.y + this.height + 2;

    for (let i = 0; i < solids.length; i++) {
      const block = solids[i];
      const overBlockX =
        lookAheadX >= block.x && lookAheadX <= block.x + block.width;
      const nearTopSurface =
        feetY >= block.y && feetY <= block.y + block.height;
      if (overBlockX && nearTopSurface) {
        return true;
      }
    }

    return false;
  }

  horizontalPatrol() {
    const solids = this.getSolidBlocksOnLayer();
    const nextX = this.x + this.speed * this.direction;

    const willHitWall = this.collidesWithSolid(nextX, this.y, solids);
    const hasFloorAhead = this.hasGroundAhead(nextX, solids);

    if (willHitWall || !hasFloorAhead) {
      this.direction *= -1;
    }

    this.x += this.speed * this.direction;
  }

  verticalPatrol() {
    const solids = this.getSolidBlocksOnLayer();
    const nextY = this.y + this.speed * this.direction;

    const willHitWall = this.collidesWithSolid(this.x, nextY, solids);

    if (willHitWall) {
      this.direction *= -1;
    }

    this.y += this.speed * this.direction;
  }
}
