class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.size = 50;
    this.x = this.size / 2;
    this.y = this.size / 2;
    this.speed = 5;
    this.sprintSpeed = 10;
    this.timeSinceCalled = 0;
  }

  setName(name) {
    this.name = name;
  }

  setColor(color) {
    this.color = color;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x-(this.size/2), this.y-(this.size/2), this.size, this.size);
  }

  move(controller) {
    const speed = controller["`"].pressed ? this.sprintSpeed : this.speed;
    let moveX = 0;
    let moveY = 0;

    if (controller.W.pressed || controller.w.pressed) {
      moveY -= 1;
    }
    if (controller.S.pressed || controller.s.pressed) {
      moveY += 1;
    }
    if (controller.A.pressed || controller.a.pressed) {
      moveX -= 1;
    }
    if (controller.D.pressed || controller.d.pressed) {
      moveX += 1;
    }

    if (moveX !== 0 || moveY !== 0) {
      const magnitude = Math.hypot(moveX, moveY);
      this.x += (moveX / magnitude) * speed;
      this.y += (moveY / magnitude) * speed;
    }
  }

  sendPositionUpdate(channel) {
    channel.send({
      type: "broadcast",
      event: "update",
      payload: { x: this.x, y: this.y },
    });
  }
}

export { Player };
