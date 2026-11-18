import { Projectile } from "./projectile.js";

class Player {
  constructor(name, color) {
    this.name = name;
    this.id = crypto.randomUUID();
    this.color = color;
    this.size = 50;
    this.x = this.size / 2;
    this.y = this.size / 2;
    this.speed = 5;
    this.sprintSpeed = 10;
    this.cooldown = 0;
    this.health = 10;
    this.dead = false;
    this.alpha = 1.0;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  takeDamage(damage) {
    this.health -= damage;
    this.alpha = 0.5;
    setTimeout(() => {
      this.alpha = 1.0;
    }, 100);
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x-(this.size/2), this.y-(this.size/2), this.size, this.size);
    ctx.globalAlpha = 1.0;
    ctx.font = "50px Arial";
    let textWidth = ctx.measureText(this.name).width;
    while (textWidth > this.size*0.8) {
      ctx.font = `${parseInt(ctx.font) - 1}px Arial`;
      textWidth = ctx.measureText(this.name).width;
    }
    ctx.fillText(this.name, this.x - textWidth / 2, this.y - this.size / 2 - 10);
  }

  move(controller, gameArea) {
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

    if (this.x + this.size / 2 > gameArea.width) {
      this.x = gameArea.width - this.size / 2;
    } else if (this.x - this.size / 2 < 0) {
      this.x = this.size / 2;
    }
    if (this.y + this.size / 2 > gameArea.height) {
      this.y = gameArea.height - this.size / 2;
    } else if (this.y - this.size / 2 < 0) {
      this.y = this.size / 2;
    }
  }

  sendPositionUpdate() {
    const message = {
      id: this.id,
      username: this.name,
      x: this.x,
      y: this.y,
      dead: this.dead,
    };
    return [message];
  }

  fireProjectile(projectileManager, mouseX, mouseY) {
    if (this.cooldown > 0) return;

    const angle = Math.atan2(mouseY - this.y, mouseX - this.x);
    const projectileSpeed = 10;
    const projectileVx = Math.cos(angle) * projectileSpeed;
    const projectileVy = Math.sin(angle) * projectileSpeed;

    projectileManager.addInternalProjectile(new Projectile(this.x, this.y, projectileVx, projectileVy, this.id, this.color));
    this.cooldown = 10;
  }
}

export { Player };
