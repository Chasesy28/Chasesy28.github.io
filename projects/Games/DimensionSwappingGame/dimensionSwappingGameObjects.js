class Player {
  constructor() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.speed = 5;
  }
}

const gameObjectTypes = {
  wall: {
    color: 0x888888,
    solid: true,
    id: 1
  }
}

class Block {
  constructor(x, y, z, w, h, d, type) {
    createBox(x, y, z, w, h, d);
    this.type = type;
  }
}
