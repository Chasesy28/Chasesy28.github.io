class Player {
  constructor() {
    this.position = new THREE.Vector3();
    this.size = new THREE.Vector3();
    this.speed = 5;
    this.onGround = false;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.mesh = null; // This will hold the player's mesh for rendering
  }
  render() {
    if (!this.mesh) {
      const geometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      this.mesh = new THREE.Mesh(geometry, material);
    }
    this.mesh.position.copy(this.position);
    return this.mesh;
  }
  move(direction, deltaTime) {
    const moveVector = new THREE.Vector3();
    if (direction === 'left') {
      moveVector.x -= this.speed * deltaTime;
    } else if (direction === 'right') {
      moveVector.x += this.speed * deltaTime;
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
    this.velocity.y -= 9.81 * deltaTime; // Gravity acceleration
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Check for ground collision (simple example, you would need to check against the world)
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.onGround = true;
      this.velocity.y = 0;
    }

    // Update the player's mesh position
    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }
  }
}
