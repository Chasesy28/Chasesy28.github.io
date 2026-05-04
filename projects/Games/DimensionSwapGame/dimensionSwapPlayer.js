class Player {
  constructor() {
    this.size = new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize);
    this.speed = 5;
    this.onGround = false;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.gravity = 1;
    this.jumpStrength = 10;
    this.maxFallSpeed = 15;
    this.mesh = null; // This will hold the player's mesh for rendering
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
    this.mesh.position.add(moveVector);
  }

  jump() {
    if (true) {
      this.velocity.y = -this.jumpStrength; // Set an initial jump velocity
      this.onGround = false;
    }
  }

  groundedDetection() {

  }

  update() {
    // Apply gravity
    this.velocity.y += this.gravity; // Gravity acceleration
    if (this.velocity.y > this.maxFallSpeed) {
      this.velocity.y = this.maxFallSpeed; // Cap fall speed
    }

    this.mesh.position.add(this.velocity.clone());

    // Check for ground collision (simple example, you would need to check against the world)
    if (this.groundedDetection()) {
      this.velocity.y = 0;
      this.onGround = true;
    }
  }
}
