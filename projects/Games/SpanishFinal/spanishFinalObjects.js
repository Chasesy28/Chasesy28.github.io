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
    dimensions: new THREE.Vector3(
      baseBlockSize,
      baseBlockSize / 4,
      baseBlockSize,
    ),
    texture: null,
    solid: true,
    bottomCollision: false,
  },
  backgroundObject: {
    color: [173, 216, 230],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize),
    texture: null,
    solid: false,
    bottomCollision: false,
  },
  grounder: {
    color: [0, 255, 0],
    dimensions: new THREE.Vector3(baseBlockSize, baseBlockSize, baseBlockSize),
    texture: null,
    solid: true,
    bottomCollision: true,
  },
};

const darkenFactor = 0.8;

class Block {
  constructor(x, y, z, type) {
    this.mesh = createBox(
      x,
      y,
      z,
      gameObjectTypes[type].dimensions.x,
      gameObjectTypes[type].dimensions.y,
      gameObjectTypes[type].dimensions.z,
    );
    this.type = type;
    this.solid = gameObjectTypes[type].solid;
    this.bottomCollision = gameObjectTypes[type].bottomCollision;
    setColor(this.mesh, ...gameObjectTypes[type].color);
  }
  update() {
    this.mesh.visible = true;
    setColor(this.mesh, ...gameObjectTypes[this.type].color);

    if (this.checkForPlayer()) {
      setColor(
        this.mesh,
        gameObjectTypes[this.type].color[0] * 2,
        gameObjectTypes[this.type].color[1] * 2,
        gameObjectTypes[this.type].color[2] * 2,
      ); // Highlight blocks the player is standing on
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

class Sign extends Block {
  constructor(x, y, z, text) {
    super(x, y, z, "backgroundObject");
    this.type = "sign";
    this.solid = true;
    this.bottomCollision = true;
    this.text = text;
    this.mesh.visible = false;
  }

  interact() {
    showInteractionText(this.text);
  }
}
