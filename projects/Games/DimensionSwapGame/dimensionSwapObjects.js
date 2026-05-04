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
    solid: true,
    id: 2
  }
}

class Block {
  constructor(x, y, z, w, h, d, type) {
    this.mesh = createBox(x, y, z, w, h, d);
    this.type = type;
    this.solid = gameObjectTypes[type].solid;
    setColor(this.mesh, ...gameObjectTypes[type].color);
  }
}
