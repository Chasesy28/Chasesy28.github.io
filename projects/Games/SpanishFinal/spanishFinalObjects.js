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
    color: [200, 125, 0],
    dimensions: new THREE.Vector3(
      baseBlockSize,
      baseBlockSize / 4,
      baseBlockSize,
    ),
    texture: null,
    solid: true,
    bottomCollision: false,
  },
  sign: {
    color: [150, 75, 0],
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

function createSignMesh(x, y, z, width, height, depth) {
  const topBarHeight = height * 0.6;
  const stemWidth = width * 0.28;
  const stemLeft = (width - stemWidth) / 2;
  const stemRight = stemLeft + stemWidth;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, topBarHeight);
  shape.lineTo(stemRight, topBarHeight);
  shape.lineTo(stemRight, height);
  shape.lineTo(stemLeft, height);
  shape.lineTo(stemLeft, topBarHeight);
  shape.lineTo(0, topBarHeight);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });
  const material = new THREE.MeshPhongMaterial({
    color: new THREE.Color(1, 1, 1),
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  return mesh;
}

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
    super(x, y, z, "sign");
    this.type = "sign";
    this.solid = gameObjectTypes[this.type].solid;
    this.text = text;
    this.mesh = createSignMesh(
      x,
      y,
      z,
      gameObjectTypes[this.type].dimensions.x,
      gameObjectTypes[this.type].dimensions.y,
      gameObjectTypes[this.type].dimensions.z / 5,
    );
    setColor(this.mesh, ...gameObjectTypes[this.type].color);
  }

  interact() {
    showInteractionText(this.text);
  }
}
