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
    color: [150, 75, 0],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize / 4, baseBlockSize),
    texture: null,
    solid: true,
    bottomCollision: false,
  },
  launcher: {
    color: [0, 128, 255],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize),
    texture: null,
    solid: true,
    bottomCollision: true,
  },
  grounder: {
    color: [0, 255, 0],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize),
    texture: null,
    solid: true,
    bottomCollision: true,
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

    if (this.checkForPlayer()) {
      setColor(this.mesh, gameObjectTypes[this.type].color[0] * 2, gameObjectTypes[this.type].color[1] * 2, gameObjectTypes[this.type].color[2] * 2); // Highlight blocks the player is standing on
    }

    if (direction === 'xy') {
      // Camera is at player.z + 100, looking at XY plane
      // Hide blocks far in front on Z axis
      if (this.mesh.position.z > player.mesh.position.z + baseBlockSize) {
        this.mesh.visible = false;
      } else if (this.mesh.position.z < player.mesh.position.z) {
        // Darken blocks behind the player
        const [r, g, b] = gameObjectTypes[this.type].color;
        setColor(this.mesh, r * darkenFactor, g * darkenFactor, b * darkenFactor);
      }
    } else if (direction === 'xz') {
      // Camera is at player.y - 100, looking at XZ plane
      // Hide blocks far below on Y axis
      if (this.mesh.position.y < player.mesh.position.y - baseBlockSize) {
        this.mesh.visible = false;
      } else if (this.mesh.position.y > player.mesh.position.y + baseBlockSize) {
        // Darken blocks behind the player
        const [r, g, b] = gameObjectTypes[this.type].color;
        setColor(this.mesh, r * darkenFactor, g * darkenFactor, b * darkenFactor);
      }
    } else if (direction === 'zy') {
      // Camera is at player.x + 100, looking at ZY plane
      // Hide blocks far to the right on X axis
      if (this.mesh.position.x > player.mesh.position.x + baseBlockSize) {
        this.mesh.visible = false;
      } else if (this.mesh.position.x < player.mesh.position.x) {
        // Darken blocks behind the player
        const [r, g, b] = gameObjectTypes[this.type].color;
        setColor(this.mesh, r * darkenFactor, g * darkenFactor, b * darkenFactor);
      }
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

class Launcher extends Block {
  constructor(x, y, z, axis, direction) {
    super(x, y, z, 'launcher');
    this.launchAxis = axis;
    this.launchDirection = direction;
  }
  update() {
    super.update();
    if (player.objectsOn.includes(this)) {
      player.velocity[this.launchAxis] = this.launchDirection;
    }
  }
}
