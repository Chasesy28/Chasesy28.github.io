class Player {
  constructor() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.size = new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize);
    this.speed = 5;
    this.onGround = false;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.mesh = null; // This will hold the player's mesh for rendering
  }
  syncMeshPosition() {
    if (this.mesh) {
      this.mesh.position.set(
        this.position.x + this.size.x / 2,
        this.position.y + this.size.y / 2,
        this.position.z + this.size.z / 2
      );
    }
  }
  render() {
    if (!this.mesh) {
      this.mesh = createBox(this.position.x, this.position.y, this.position.z, this.size.x, this.size.y, this.size.z);
      setColor(this.mesh, 255, 0, 0); // Set player color to red
    }
    this.syncMeshPosition();
    return this.mesh;
  }
  move(direction, deltaTime) {
    const moveVector = new THREE.Vector3();
    if (direction === 'left') {
      camera.getWorldDirection(moveVector);
      moveVector.y = 0; // Keep movement horizontal
      moveVector.cross(camera.up).normalize();
      moveVector.multiplyScalar(-this.speed * deltaTime);
    } else if (direction === 'right') {
      camera.getWorldDirection(moveVector);
      moveVector.y = 0; // Keep movement horizontal
      moveVector.cross(camera.up).normalize();
      moveVector.multiplyScalar(this.speed * deltaTime);
    }
    this.position.add(moveVector);
  }
  jump() {
    if (this.onGround) {
      this.velocity.y = 10; // Set an initial jump velocity
      this.onGround = false;
    }
  }
  update(deltaTime) {
    // Apply gravity
    //this.velocity.y += 9.81 * deltaTime; // Gravity acceleration
    //this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Check for ground collision (simple example, you would need to check against the world)
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.onGround = true;
      this.velocity.y = 0;
    }
    this.velocity.y = 0;

    // Update the player's mesh position
    this.syncMeshPosition();
  }
}
