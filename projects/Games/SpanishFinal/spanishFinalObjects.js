const objectProperties = {
  block: {
    dimensions: [50, 50],
    solid: true,
    bottomCollision: true,
  },
  semiSolidPlatform: {
    dimensions: [50, 12.5],
    solid: true,
    bottomCollision: false,
  }
}

const objectTypes = {
  wall: {
    property: objectProperties.block,
    color: [136, 136, 136],
    id: 1,
  },
  floor: {
    property: objectProperties.block,
    color: [136, 136, 136],
    id: 2,
  },
  platform: {
    property: objectProperties.semiSolidPlatform,
    color: [150, 75, 0],
    id: 3,
  },
}

class Block {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  update() {

  }
}
