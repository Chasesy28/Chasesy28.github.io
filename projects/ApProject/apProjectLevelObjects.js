const blockTypes = {
  basic: {
    color: "brown",
    solid: true,
    temporary: false,
  },
  temporary: {
    color: "gray",
    solid: true,
    temporary: true,
  },
};
class Block {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = blockTypes[type].color;
    this.solid = blockTypes[type].solid;
    this.temporary = blockTypes[type].temporary;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  tempDisappear() {
    this.solid = false;
    this.color = "rgba(0,0,0,0)";
  }
}
