class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.x = 0;
    this.y = 0;
    this.speed = 5;
    this.sprintSpeed = 10;
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
    ctx.fillRect(this.x, this.y, 50, 50);
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

    /*this.x += this.knockbackVelocityX;
    this.y += this.knockbackVelocityY;
    this.knockbackVelocityX *= this.knockbackResistance;
    this.knockbackVelocityY *= this.knockbackResistance;

    if (Math.abs(this.knockbackVelocityX) < 0.05) {
      this.knockbackVelocityX = 0;
    }
    if (Math.abs(this.knockbackVelocityY) < 0.05) {
      this.knockbackVelocityY = 0;
    }*/

    /*if (this.x + this.size / 2 - this.size > gameArea.width) {
      this.x = this.size / 2 - this.size;
    } else if (this.x - this.size / 2 + this.size < 0) {
      this.x = gameArea.width - this.size / 2 + this.size;
    }
    if (this.y + this.size / 2 - this.size > gameArea.height) {
      this.y = this.size / 2 - this.size;
    } else if (this.y - this.size / 2 + this.size < 0) {
      this.y = gameArea.height - this.size / 2 + this.size;
    }*/
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
