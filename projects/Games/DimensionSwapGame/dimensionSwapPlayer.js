class Player {
  constructor() {
    this.size = new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize);
    this.speed = 3;
    this.maxSpeed = 10;
    this.onGround = false;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.gravity = 0.9;
    this.jumpStrength = 15;
    this.maxFallSpeed = 15;
    this.mesh = null; // This will hold the player's mesh for rendering
    this.currentFriction = 0.9; // Friction applied when on the ground
    this.defaultFriction = 0.9; // Default friction value
    this.airResistance = 0.99; // Air resistance applied when in the air
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
    if (this.onGround) {
      this.velocity.y = -this.jumpStrength; // Set an initial jump velocity
      this.onGround = false;
    }
  }

  objectCollisionDetection() {
    let groundDetected = false;
    for (let object of gameObjects) {
      if (object.solid) {
        const playerBox = new THREE.Box3().setFromObject(this.mesh);
        const objectBox = new THREE.Box3().setFromObject(object.mesh);
        if (playerBox.intersectsBox(objectBox)) {
          // Simple collision response: stop vertical movement and place player on top of the object
          if (this.velocity.y > 0) { // Falling down
            this.mesh.position.y = objectBox.min.y - this.size.y / 2; // Place player on top of the object
            playerBox.setFromObject(this.mesh); // Update player box after position change
            this.velocity.y = 0; // Stop vertical movement
            this.onGround = true; // Player is now on the ground
            groundDetected = true; // Mark that we've detected ground
          }
          if (this.velocity.x !== 0) { // Horizontal collision
            if (this.velocity.x > 0) { // Moving right
              this.mesh.position.x = objectBox.min.x - this.size.x / 2; // Place player to the left of the object
            } else { // Moving left
              this.mesh.position.x = objectBox.max.x + this.size.x / 2; // Place player to the right of the object
            }
            this.velocity.x = 0; // Stop horizontal movement
          }
          if (this.velocity.z !== 0) { // Depth collision
            if (this.velocity.z > 0) { // Moving forward
              this.mesh.position.z = objectBox.min.z - this.size.z / 2; // Place player in front of the object
            } else { // Moving backward
              this.mesh.position.z = objectBox.max.z + this.size.z / 2; // Place player behind the object
            }
            this.velocity.z = 0; // Stop depth movement
          }
        }
      }
    }
    if (!groundDetected) {
      this.onGround = false; // If no ground was detected, player is in the air
    }
  }

  update() {
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
