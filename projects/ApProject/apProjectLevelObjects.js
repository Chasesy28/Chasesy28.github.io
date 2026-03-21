const blockTypes = {
  basic: {
    color: "brown",
    solid: true,
    temporary: false,
    friction: 0.92,
  },
  temporary: {
    color: "gray",
    solid: true,
    temporary: true,
    disappearTime: 30,
    reappearTime: 120,
    friction: 0.92,
  },
  permanentTemporary: {
    color: "dimgray",
    solid: true,
    temporary: true,
    disappearTime: 45,
    reappearTime: undefined,
    friction: 0.92,
  },
  ice: {
    color: "cyan",
    solid: true,
    temporary: false,
    friction: 0.99,
  },
  slow: {
    color: "darkgreen",
    solid: true,
    temporary: false,
    friction: 0.75,
  },
};
class Block {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.color = blockTypes[type].color;
    this.solid = blockTypes[type].solid;
    this.temporary = blockTypes[type].temporary;
    this.timeToDisappear;
    this.timeToReappear;
    this.friction = blockTypes[this.type].friction;
    this.visible = true; // Track visibility for rendering optimization
  }
  draw() {
    const blockTypeData = blockTypes[this.type];

    if (this.temporary && this.timeToDisappear !== undefined) {
      this.timeToDisappear -= 1;
      ctx.globalAlpha = this.timeToDisappear / blockTypeData.disappearTime;
      if (this.timeToDisappear <= 0) {
        this.tempDisappear();
      }
    }
    if (this.temporary && this.timeToReappear !== undefined) {
      this.timeToReappear -= 1;
      if (this.timeToReappear <= 0) {
        this.tempReappear();
      }
    }

    // Skip rendering if not visible or fully transparent
    if (this.visible && ctx.globalAlpha > 0) {
      ctx.fillStyle = this.color;
      ctx.fillRect(
        Math.round(this.x - player.globalOffsetX),
        Math.round(this.y - player.globalOffsetY),
        this.width,
        this.height,
      );
    }
    ctx.globalAlpha = 1;
  }
  startTempDisappear() {
    this.timeToDisappear = blockTypes[this.type].disappearTime;
  }
  tempDisappear() {
    this.solid = false;
    this.color = "rgba(0,0,0,0)";
    this.timeToDisappear = undefined;
    this.timeToReappear = blockTypes[this.type].reappearTime;
    this.visible = false; // Flag to skip rendering
  }
  tempReappear() {
    this.solid = true;
    this.color = blockTypes[this.type].color;
    this.timeToReappear = undefined;
    this.visible = true;
  }
}
