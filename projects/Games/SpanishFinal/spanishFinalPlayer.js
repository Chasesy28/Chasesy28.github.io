class Player {
  constructor() {
    this.size = new THREE.Vector2(49.9, 49.9);
    this.mesh = null;
  }

  render (x, y) {
    if (!this.mesh) {
      this.mesh = createBox(x, y, this.size.x, this.size.y);
      scene.add(this.mesh);
    }
    return this.mesh;
  }
}
