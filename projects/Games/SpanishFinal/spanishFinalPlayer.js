class Player {
  constructor() {
    this.size = new THREE.Vector3(
      baseBlockSize - 0.001,
      baseBlockSize - 0.001,
      baseBlockSize - 0.001,
    );
    this.speed = 4;
    this.maxSpeed = 10;
    this.maxHorizontalVelocity = 10;
    this.friction = 0.9;
    this.onGround = false;
    this.canJump = true;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.gravity = 0.9;
    this.jumpStrength = 15;
    this.maxFallSpeed = 15;
    this.mesh = null; // This will hold the player's mesh for rendering
    this.coyoteTimeMax = 6; // Frames of coyote time allowed
    this.coyoteTime = 0; // Current coyote time remaining
    this.previousPosition = null; // Track previous position for collision direction
    this.passDown = false;
    this.objectsOn = [];
    this.jumpBuffer = 0; // Buffer to allow jump input slightly before landing
    this.maxJumpBuffer = 6; // Maximum frames to buffer jump input

    this.respawnPoint = new THREE.Vector3(0, 0, 0); // Default respawn point, can be set to player's start position
  }

  render(x, y, z) {
    if (!this.mesh) {
      this.mesh = createBox(x, y, z, this.size.x, this.size.y, this.size.z);
      this.previousPosition = this.mesh.position.clone();
      setColor(this.mesh, 0, 0, 255);
    }
    return this.mesh;
  }

  move(direction, timeHeld = 1) {
    const moveVector = new THREE.Vector3();
    let speed = this.speed * (1 + timeHeld / 100);
    if (speed > this.maxSpeed) {
      speed = this.maxSpeed;
    }
    if (direction === "left") {
      camera.getWorldDirection(moveVector);
      moveVector.y = 0; // Keep movement horizontal
      moveVector.cross(camera.up).normalize();
      moveVector.multiplyScalar(-speed);
    } else if (direction === "right") {
      camera.getWorldDirection(moveVector);
      moveVector.y = 0; // Keep movement horizontal
      moveVector.cross(camera.up).normalize();
      moveVector.multiplyScalar(speed);
    }
    this.mesh.position.add(moveVector);
  }

  jump() {
    if (this.canJump) {
      if (this.onGround || this.coyoteTime > 0) {
        this.velocity.y += -this.jumpStrength; // Set an initial jump velocity
        this.onGround = false;
        this.coyoteTime = 0; // Consume coyote time
      } else {
        this.jumpBuffer = this.maxJumpBuffer;
      }
    }
  }

  interact() {
    const playerBox = new THREE.Box3().setFromObject(this.mesh);

    for (let obj of gameObjects) {
      if (obj instanceof Sign || obj instanceof Goal) {
        const objectBox = new THREE.Box3().setFromObject(obj.mesh);
        if (playerBox.intersectsBox(objectBox)) {
          obj.interact();
          return;
        }
      }
    }
  }

  objectCollisionDetection() {
    this.objectsOn = [];
    let groundDetected = false;
    const landingCollisions = []; // Collect all landing collisions first

    for (let object of gameObjects) {
      if (object.solid) {
        const playerBox = new THREE.Box3().setFromObject(this.mesh);
        const objectBox = new THREE.Box3().setFromObject(object.mesh);
        if (playerBox.intersectsBox(objectBox)) {
          // Calculate overlap amounts in X and Y only (2D collision)
          const overlapX =
            Math.min(playerBox.max.x, objectBox.max.x) -
            Math.max(playerBox.min.x, objectBox.min.x);
          const overlapY =
            Math.min(playerBox.max.y, objectBox.max.y) -
            Math.max(playerBox.min.y, objectBox.min.y);

          // Determine the axis with smallest overlap (the collision direction)
          const minOverlap = Math.min(overlapX, overlapY);

          // Vertical collision - player is landing on top of object
          // Only allow top snap if the player's bottom is close to (or crossed) the block's top this frame.
          const playerBottom = playerBox.max.y;
          const previousPlayerBottom = playerBottom - this.velocity.y;
          const playerTop = playerBox.min.y;
          const previousPlayerTop = playerTop - this.velocity.y;
          const blockTop = objectBox.min.y;
          const blockBottom = objectBox.max.y;
          const topSnapTolerance = Math.max(0.2, this.size.y * 0.35);
          const bottomSnapTolerance = Math.max(0.2, this.size.y * 0.08);
          const landingHorizontalContactTolerance = 0.001;
          // Horizontal contact tolerance uses X size in 2D
          const headHitHorizontalContactTolerance =
            Math.min(this.size.x) * 0.2;
          const nearTop = Math.abs(playerBottom - blockTop) <= topSnapTolerance;
          const crossedTopThisFrame =
            previousPlayerBottom <= blockTop && playerBottom >= blockTop;
          const nearBottom =
            Math.abs(playerTop - blockBottom) <= bottomSnapTolerance;
          const crossedBottomThisFrame =
            previousPlayerTop >= blockBottom && playerTop <= blockBottom;
          const verticalIsPrimary = overlapY <= overlapX;
          // In 2D horizontal contact is X overlap only
          const hasLandingContact = overlapX > landingHorizontalContactTolerance;
          const hasHeadHitContact = overlapX > headHitHorizontalContactTolerance;
          const isLanding =
            this.velocity.y > 0 &&
            verticalIsPrimary &&
            hasLandingContact &&
            (nearTop || crossedTopThisFrame);
          if (isLanding) {
            if (!object.bottomCollision) {
              if (this.passDown) {
                continue; // Allow passing down through platforms without snapping to top
              }
            }
            // Store landing collision for processing after all checks
            landingCollisions.push({ object, objectBox });
            this.objectsOn.push(object);
            groundDetected = true;
            continue;
          }

          const isHittingBottom =
            this.velocity.y < 0 &&
            verticalIsPrimary &&
            hasHeadHitContact &&
            (nearBottom || crossedBottomThisFrame);
          if (isHittingBottom && object.bottomCollision) {
            this.mesh.position.y = objectBox.max.y + this.size.y / 2;
            this.velocity.y = 0;
            continue;
          }

          // Skip horizontal/depth collisions if player is standing on top (small Y overlap)
          if (overlapY < 1.5) {
            continue;
          }

          // Only handle horizontal collisions (X axis) if it's the primary collision direction
          if (minOverlap === overlapX && object.bottomCollision) {
            const movementX = this.mesh.position.x - this.previousPosition.x;
            if (movementX > 0) {
              this.mesh.position.x = objectBox.min.x - this.size.x / 2;
              this.velocity.x = 0;
            } else if (movementX < 0) {
              this.mesh.position.x = objectBox.max.x + this.size.x / 2;
              this.velocity.x = 0;
            }
          }
        }
      }
    }

    // Process all landing collisions after checking all objects
    if (landingCollisions.length > 0) {
      // Snap to the topmost block (smallest Y value = highest block)
      let topmost = landingCollisions[0];
      for (let i = 1; i < landingCollisions.length; i++) {
        if (landingCollisions[i].objectBox.min.y < topmost.objectBox.min.y) {
          topmost = landingCollisions[i];
        }
      }
      this.mesh.position.y = topmost.objectBox.min.y - this.size.y / 2;
      this.velocity.y = 0;
      this.onGround = true;
      this.coyoteTime = this.coyoteTimeMax; // Reset coyote time when landing
    }

    if (!groundDetected) {
      this.onGround = false;
    }
  }

  update() {
    this.canJump = true; // Reset canJump each frame, will be set to false if player is on a grounder block
    for (let obj of this.objectsOn) {
      if (obj.type === "grounder") {
        this.canJump = false;
      }
    }
    // Update coyote time and jump buffer
    if (this.onGround) {
      this.coyoteTime = this.coyoteTimeMax; // Reset coyote time while on ground
      if (this.jumpBuffer > 0) {
        this.jump(); // Perform jump if jump was buffered
        this.jumpBuffer = 0; // Clear jump buffer after jumping
      }
    } else {
      this.coyoteTime--; // Decrement coyote time while in air
      this.jumpBuffer--; // Decrement jump buffer while in air
    }

    // Apply gravity (vertical only)
    this.velocity.y += this.gravity; // Gravity acceleration
    if (this.velocity.y > this.maxFallSpeed) {
      this.velocity.y = this.maxFallSpeed; // Cap fall speed
    }

    if (this.velocity.x > this.maxHorizontalVelocity) {
      this.velocity.x = this.maxHorizontalVelocity;
    } else if (this.velocity.x < -this.maxHorizontalVelocity) {
      this.velocity.x = -this.maxHorizontalVelocity;
    }
    if (this.velocity.z > this.maxHorizontalVelocity) {
      this.velocity.z = this.maxHorizontalVelocity;
    } else if (this.velocity.z < -this.maxHorizontalVelocity) {
      this.velocity.z = -this.maxHorizontalVelocity;
    }

    // Apply friction to horizontal movement
    this.velocity.x *= this.friction;
    this.velocity.z *= this.friction;

    // Apply velocity to position
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.y += this.velocity.y;

    this.objectCollisionDetection();

    this.worldBorderCollision();

    // Store position after all movement and collision resolution for next frame's collision detection
    this.previousPosition.copy(this.mesh.position);
  }

  respawn() {
    this.mesh.position.copy(this.respawnPoint);
    this.velocity.set(0, 0, 0);
  }

  worldBorderCollision() {
    if (this.mesh.position.x < baseBlockSize / 2) {
      this.mesh.position.x = baseBlockSize / 2;
      this.velocity.x = 0;
    }
  }
}
