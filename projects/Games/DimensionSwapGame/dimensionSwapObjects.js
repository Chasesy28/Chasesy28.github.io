const gameObjectTypes = {
  wall: {
    color: [136, 136, 136],
    texture: null,
    solid: true,
    id: 1
  },
  floor: {
    color: [200, 200, 200],
    texture: null,
    solid: false,
    id: 2
  }
}

class Block {
  constructor(x, y, z, w, h, d, type) {
    this.block = createBox(x, y, z, w, h, d);
    this.block.type = type;
    this.block.solid = gameObjectTypes[type].solid;
    setColor(this.block, ...gameObjectTypes[type].color);
  }
}
