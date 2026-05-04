class Player {
  constructor() {
    this.size = new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize);
    this.speed = 3;
    this.maxSpeed = 7.5;
    this.onGround = false;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.gravity = 0.9;
    this.jumpStrength = 15;
    this.maxFallSpeed = 15;
    this.mesh = null; // This will hold the player's mesh for rendering
    this.currentFriction = 0.9; // Friction applied when on the ground
    this.defaultFriction = 0.9; // Default friction value
    this.airResistance = 0.99; // Air resistance applied when in the air
    this.coyoteTimeMax = 6; // Frames of coyote time allowed
    this.coyoteTime = 0; // Current coyote time remaining
  }

  render(x, y, z) {
    if (!this.mesh) {
      this.mesh = createBox(x, y, z, this.size.x, this.size.y, this.size.z);
      setColor(this.mesh, 255, 0, 0); // Set player color to red
    }
    return this.mesh;
  }

  move(direction) {
    const moveVector = new THREE.Vector3();
    if (direction === 'left') {
      camera.getWorldDirection(moveVector);
      moveVector.y = 0; // Keep movement horizontal
      moveVector.cross(camera.up).normalize();
      moveVector.multiplyScalar(-this.speed);
    } else if (direction === 'right') {
      camera.getWorldDirection(moveVector);
      moveVector.y = 0; // Keep movement horizontal
      moveVector.cross(camera.up).normalize();
      moveVector.multiplyScalar(this.speed);
    }
    this.velocity.add(moveVector);
  }

  jump() {
    if (this.onGround || this.coyoteTime > 0) {
      this.velocity.y = -this.jumpStrength; // Set an initial jump velocity
      this.onGround = false;
      this.coyoteTime = 0; // Consume coyote time
    }
  }

  objectCollisionDetection() {
    let groundDetected = false;
    for (let object of gameObjects) {
      if (object.solid) {
        const playerBox = new THREE.Box3().setFromObject(this.mesh);
        const objectBox = new THREE.Box3().setFromObject(object.mesh);
        if (playerBox.intersectsBox(objectBox)) {
          // Calculate overlap amounts in each direction
          const overlapX = Math.min(playerBox.max.x, objectBox.max.x) - Math.max(playerBox.min.x, objectBox.min.x);
          const overlapY = Math.min(playerBox.max.y, objectBox.max.y) - Math.max(playerBox.min.y, objectBox.min.y);
          const overlapZ = Math.min(playerBox.max.z, objectBox.max.z) - Math.max(playerBox.min.z, objectBox.min.z);

          // Determine the axis with smallest overlap (the collision direction)
          const minOverlap = Math.min(overlapX, overlapY, overlapZ);

          // Vertical collision - player is landing on top of object
          // Treat as landing if moving downward, positioned above, and Y overlap is minimal relative to other overlaps
          const isLanding = this.velocity.y > 0 && playerBox.min.y <= objectBox.max.y &&
                           overlapY < Math.max(overlapX, overlapZ) * 0.75;
          if (isLanding) {
            this.mesh.position.y = objectBox.min.y - this.size.y / 2;
            this.velocity.y = 0;
            this.onGround = true;
            this.coyoteTime = this.coyoteTimeMax; // Reset coyote time when landing
            groundDetected = true;
            continue;
          }

          // Skip horizontal/depth collisions if player is standing on top (small Y overlap)
          if (overlapY < 1.5) {
            continue;
          }

          // Only handle horizontal/depth collisions if they are the primary collision direction
          if (minOverlap === overlapX) {
            // Horizontal collision
            if (this.velocity.x > 0) {
              this.mesh.position.x = objectBox.min.x - this.size.x / 2;
              this.velocity.x = 0;
            } else if (this.velocity.x < 0) {
              this.mesh.position.x = objectBox.max.x + this.size.x / 2;
              this.velocity.x = 0;
            }
          } else if (minOverlap === overlapZ) {
            // Depth collision
            if (this.velocity.z > 0) {
              this.mesh.position.z = objectBox.min.z - this.size.z / 2;
              this.velocity.z = 0;
            } else if (this.velocity.z < 0) {
              this.mesh.position.z = objectBox.max.z + this.size.z / 2;
              this.velocity.z = 0;
            }
          }
        }
      }
    }
    if (!groundDetected) {
      this.onGround = false;
    }
  }

  update() {
    // Update coyote time
    if (this.onGround) {
      this.coyoteTime = this.coyoteTimeMax; // Reset coyote time while on ground
    } else {
      this.coyoteTime--; // Decrement coyote time while in air
    }

    // Apply gravity
    this.velocity.y += this.gravity; // Gravity acceleration
    if (this.velocity.y > this.maxFallSpeed) {
      this.velocity.y = this.maxFallSpeed; // Cap fall speed
    }
    let horizontalVelocity = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    if (horizontalVelocity.length() > this.maxSpeed) {
      horizontalVelocity.setLength(this.maxSpeed); // Limit horizontal speed
    }
    if (this.onGround) {
      horizontalVelocity.multiplyScalar(this.currentFriction); // Apply friction when on the ground
    } else {
      horizontalVelocity.multiplyScalar(this.airResistance);
    }
    this.velocity.x = horizontalVelocity.x;
    this.velocity.z = horizontalVelocity.z;

    this.mesh.position.add(this.velocity.clone());

    this.objectCollisionDetection();
  }
}
