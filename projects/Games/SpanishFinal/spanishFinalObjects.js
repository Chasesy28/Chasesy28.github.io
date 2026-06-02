const baseBlockSize = 30;

const gameObjectTypes = {
  basic: {
    color: [136, 136, 136],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize),
    texture: null,
    solid: true,
    bottomCollision: true,
  },
  semiSolidPlatform: {
    color: [200, 125, 0],
    dimensions: new THREE.Vector3(
      baseBlockSize,
      baseBlockSize / 4,
      baseBlockSize,
    ),
    texture: null,
    solid: true,
    bottomCollision: false,
  },
  sign: {
    color: [150, 75, 0],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize),
    texture: null,
    solid: false,
    bottomCollision: false,
  },
  goal: {
    color: [255, 255, 0],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize),
    texture: null,
    solid: false,
    bottomCollision: false,
  },
  grounder: {
    color: [0, 255, 0],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize),
    texture: null,
    solid: true,
    bottomCollision: true,
  },
};

const darkenFactor = 0.8;

function createSignMesh(x, y, z, width, height, depth) {
  const topBarHeight = height * 0.5;
  const stemWidth = width * 0.25;
  const stemLeft = (width - stemWidth) / 2;
  const stemRight = stemLeft + stemWidth;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, topBarHeight);
  shape.lineTo(stemRight, topBarHeight);
  shape.lineTo(stemRight, height);
  shape.lineTo(stemLeft, height);
  shape.lineTo(stemLeft, topBarHeight);
  shape.lineTo(0, topBarHeight);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });
  const material = new THREE.MeshPhongMaterial({
    color: new THREE.Color(1, 1, 1),
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  return mesh;
}

class Block {
  constructor(x, y, z, type) {
    this.mesh = createBox(
      x,
      y,
      z,
      gameObjectTypes[type].dimensions.x,
      gameObjectTypes[type].dimensions.y,
      gameObjectTypes[type].dimensions.z,
    );
    this.type = type;
    this.solid = gameObjectTypes[type].solid;
    this.bottomCollision = gameObjectTypes[type].bottomCollision;
    setColor(this.mesh, ...gameObjectTypes[type].color);
  }
  update() {
    this.mesh.visible = true;
    setColor(this.mesh, ...gameObjectTypes[this.type].color);

    if (this.checkForPlayer()) {
      /*setColor(
        this.mesh,
        gameObjectTypes[this.type].color[0] * 2,
        gameObjectTypes[this.type].color[1] * 2,
        gameObjectTypes[this.type].color[2] * 2,
      ); // Highlight blocks the player is standing on*/
    }
  }

  checkForPlayer() {
    for (let obj of player.objectsOn) {
      if (obj === this) {
        return true;
      }
    }
    return false;
  }
}

class Sign extends Block {
  constructor(x, y, z, text) {
    super(x, y, z, "sign");
    this.type = "sign";
    this.solid = gameObjectTypes[this.type].solid;
    this.text = text;
    this.mesh = createSignMesh(
      x,
      y,
      z,
      gameObjectTypes[this.type].dimensions.x,
      gameObjectTypes[this.type].dimensions.y,
      gameObjectTypes[this.type].dimensions.z / 5,
    );
    setColor(this.mesh, ...gameObjectTypes[this.type].color);
  }

  interact() {
    showInteractionText(this.text);
  }
}

class Goal extends Block {
  constructor(x, y, z) {
    super(x, y, z, "goal");
    this.type = "goal";
    this.solid = gameObjectTypes[this.type].solid;
    setColor(this.mesh, ...gameObjectTypes[this.type].color);
  }
  interact() {
    showInteractionText("¡Has llegado a la meta! ¡Felicidades!");
  }
}

class Enemy {
  constructor(x, y, z) {
    this.size = new THREE.Vector3(
      baseBlockSize - 0.01,
      baseBlockSize - 0.01,
      baseBlockSize - 0.01,
    );
    this.mesh = createBox(x, y, z, this.size.x, this.size.y, this.size.z);
    setColor(this.mesh, 255, 0, 0);
    this.type = "enemy";
    this.solid = false; // enemies are not solid for player collision
    this.bottomCollision = true;

    this.velocity = new THREE.Vector3(0, 0, 0);
    this.gravity = 0.9;
    this.maxFallSpeed = 15;
    this.onGround = false;
    this.previousPosition = this.mesh.position.clone();
    this.direction = 1; // 1 = right, -1 = left
    this.speed = 1; // horizontal patrol speed (units per frame)
  }

  update() {
    // Horizontal patrol movement
    const horizontalMove = this.direction * this.speed;
    this.mesh.position.x += horizontalMove;

    // Apply gravity
    this.velocity.y += this.gravity;
    if (this.velocity.y > this.maxFallSpeed) this.velocity.y = this.maxFallSpeed;

    // Apply vertical velocity
    this.mesh.position.y += this.velocity.y;

    this.worldCollision();


    // Check for collision with player
    if (this.checkForPlayer()) {
      player.respawn();
    }

    // Store previous position for next frame
    this.previousPosition.copy(this.mesh.position);
  }

  checkForPlayer() {
    const playerBox = new THREE.Box3().setFromObject(player.mesh);
    const enemyBox = new THREE.Box3().setFromObject(this.mesh);
    return playerBox.intersectsBox(enemyBox);
  }

  worldCollision() {
    for (let object of gameObjects) {
      if (!object.solid) continue;
      const enemyBox = new THREE.Box3().setFromObject(this.mesh);
      const objectBox = new THREE.Box3().setFromObject(object.mesh);
      if (enemyBox.intersectsBox(objectBox)) {
        // Compute overlaps
        const overlapX = Math.min(enemyBox.max.x, objectBox.max.x) - Math.max(enemyBox.min.x, objectBox.min.x);
        const overlapY = Math.min(enemyBox.max.y, objectBox.max.y) - Math.max(enemyBox.min.y, objectBox.min.y);
        const minOverlap = Math.min(overlapX, overlapY);

        // Determine landing (enemy falling onto top of block)
        const enemyBottom = enemyBox.max.y;
        const previousEnemyBottom = enemyBottom - this.velocity.y;
        const blockTop = objectBox.min.y;
        const topSnapTolerance = Math.max(0.2, this.size.y * 0.35);
        const verticalIsPrimary = overlapY <= overlapX;
        const hasLandingContact = overlapX > 0.001;
        const nearTop = Math.abs(enemyBottom - blockTop) <= topSnapTolerance;
        const crossedTopThisFrame = previousEnemyBottom <= blockTop && enemyBottom >= blockTop;

        // Horizontal collision (wall) handling: reverse direction only for true side hits
        // Require horizontal-primary collision and sufficient vertical overlap to treat as a wall.
        const horizontalCollisionThreshold = Math.max(0.2, this.size.y * 0.2);
        if (minOverlap === overlapX && overlapX > 0.5 && overlapY > horizontalCollisionThreshold) {
          const movementX = this.mesh.position.x - this.previousPosition.x;
          if (movementX > 0) {
            this.mesh.position.x = objectBox.min.x - this.size.x / 2;
          } else if (movementX < 0) {
            this.mesh.position.x = objectBox.max.x + this.size.x / 2;
          }
          this.direction *= -1; // turn around
          this.velocity.x = 0;
          // continue to next object after resolving horizontal collision
          continue;
        }

        if (this.velocity.y > 0 && verticalIsPrimary && hasLandingContact && (nearTop || crossedTopThisFrame)) {
          // Snap enemy to top of block (allow semisolid platforms)
          this.mesh.position.y = blockTop - this.size.y / 2;
          this.velocity.y = 0;
          this.onGround = true;
        } else {
          // Head hit: prevent going through from below
          const enemyTop = enemyBox.min.y;
          const previousEnemyTop = enemyTop - this.velocity.y;
          const blockBottom = objectBox.max.y;
          const bottomSnapTolerance = Math.max(0.2, this.size.y * 0.08);
          const nearBottom = Math.abs(enemyTop - blockBottom) <= bottomSnapTolerance;
          const crossedBottomThisFrame = previousEnemyTop >= blockBottom && enemyTop <= blockBottom;
          if (this.velocity.y < 0 && verticalIsPrimary && (nearBottom || crossedBottomThisFrame)) {
            this.mesh.position.y = blockBottom + this.size.y / 2;
            this.velocity.y = 0;
          }
        }
      }
    }

    // If not touching ground this frame, mark as in-air
    if (!this.onGround) {
      // nothing to do — gravity will continue to pull
    } else {
      // reset for next frame
      this.onGround = false;
    }
  }
}
