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
    this.mesh.visible = true;
    setColor(this.mesh, ...gameObjectTypes[this.type].color);

    if (player.objectsOn.includes(this)) {
      return;
    }

    if (direction === 'xy') {
      // Camera is at player.z + 100, so hide blocks far in front
      if (this.mesh.position.z > player.mesh.position.z + baseBlockSize) {
        this.mesh.visible = false;
      } else if (this.mesh.position.z < player.mesh.position.z) {
        // Darken blocks behind the player
        const [r, g, b] = gameObjectTypes[this.type].color;
        setColor(this.mesh, r * darkenFactor, g * darkenFactor, b * darkenFactor);
      }
    } else if (direction === 'xz') {
      // Camera is at player.y - 100, so hide blocks far below
      if (this.mesh.position.y < player.mesh.position.y - baseBlockSize) {
        this.mesh.visible = false;
      } else if (this.mesh.position.y > player.mesh.position.y + baseBlockSize) {
        // Darken blocks behind the player
        const [r, g, b] = gameObjectTypes[this.type].color;
        setColor(this.mesh, r * darkenFactor, g * darkenFactor, b * darkenFactor);
      }
    } else if (direction === 'zy') {
      // Camera is at player.x + 100, so hide blocks far to the right
      if (this.mesh.position.x > player.mesh.position.x + baseBlockSize) {
        this.mesh.visible = false;
      } else if (this.mesh.position.x < player.mesh.position.x) {
        // Darken blocks behind the player
        const [r, g, b] = gameObjectTypes[this.type].color;
        setColor(this.mesh, r * darkenFactor, g * darkenFactor, b * darkenFactor);
      }
    }
  }
}
