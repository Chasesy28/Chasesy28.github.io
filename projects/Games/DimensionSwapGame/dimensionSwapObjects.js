const baseBlockSize = 30;

const gameObjectTypes = {
  wall: {
    color: [136, 136, 136],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize),
    texture: null,
    solid: true,
    bottomCollision: true,
    id: 1
  },
  semiSolidPlatform: {
    color: [150, 75, 0],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize / 4, baseBlockSize),
    texture: null,
    solid: true,
    bottomCollision: false,
    id: 2
  }
};

const darkenFactor = 0.8;

class Block {
  constructor(x, y, z, type) {
    this.mesh = createBox(x, y, z, gameObjectTypes[type].dimensions.x, gameObjectTypes[type].dimensions.y, gameObjectTypes[type].dimensions.z);
    this.type = type;
    this.solid = gameObjectTypes[type].solid;
    this.bottomCollision = gameObjectTypes[type].bottomCollision;
    setColor(this.mesh, ...gameObjectTypes[type].color);
  }
  update() {
    this.mesh.visible = true
    setColor(this.mesh, ...gameObjectTypes[this.type].color);
    if (direction === 'xy') {
      if (this.mesh.position.z > player.mesh.position.z + baseBlockSize) {
        this.mesh.visible = false;
      } else if (this.mesh.position.z < player.mesh.position.z) {
        setColor(this.mesh, this.mesh.material.color.r * 255 * darkenFactor, this.mesh.material.color.g * 255 * darkenFactor, this.mesh.material.color.b * 255 * darkenFactor);
      }
    } else if (direction === 'xz') {
      if (this.mesh.position.y < player.mesh.position.y - baseBlockSize) {
        this.mesh.visible = false;
      } else if (this.mesh.position.y > player.mesh.position.y) {
        setColor(this.mesh, this.mesh.material.color.r * 255 * darkenFactor, this.mesh.material.color.g * 255 * darkenFactor, this.mesh.material.color.b * 255 * darkenFactor);
      }
    } else if (direction === 'zy') {
      if (this.mesh.position.x > player.mesh.position.x + baseBlockSize) {
        this.mesh.visible = false;
      } else if (this.mesh.position.x < player.mesh.position.x) {
        setColor(this.mesh, this.mesh.material.color.r * 255 * darkenFactor, this.mesh.material.color.g * 255 * darkenFactor, this.mesh.material.color.b * 255 * darkenFactor);
      }
    }
  }
}
