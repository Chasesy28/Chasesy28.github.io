class Projectile {
  constructor(x, y, velocityX, velocityY) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = 10;
    this.lifetime = 100;
    this.timeSinceCalled = 0;
  }
}

class ProjectileManager {
  constructor() {
    this.internalProjectiles = [];
    this.externalProjectile = [];
  }

  addInternalProjectile(projectile) {
    this.internalProjectiles.push(projectile);
  }

  addExternalProjectile(projectile) {
    this.externalProjectile.push(projectile);
  }

  sendProjectileUpdate(channel) {
    for (const projectile of this.internalProjectiles) {
      channel.send({
        type: "broadcast",
        event: "projectile",
        payload: {
          x: projectile.x,
          y: projectile.y,
          velocityX: projectile.velocityX,
          velocityY: projectile.velocityY,
          lifetime: projectile.lifetime,
        },
      });
    }
  }

  receiveProjectileUpdate(payload) {
    const existingProjectile = this.externalProjectile.find(
      (p) =>
        p.x === payload.x &&
        p.y === payload.y &&
        p.velocityX === payload.velocityX &&
        p.velocityY === payload.velocityY
    );

    if (!existingProjectile) {
      const newProjectile = new Projectile(
        payload.x,
        payload.y,
        payload.velocityX,
        payload.velocityY
      );
      newProjectile.lifetime = payload.lifetime;
      this.externalProjectile.push(newProjectile);
    }
  }

  updateProjectiles() {
    for (const projectile of this.internalProjectiles) {
      projectile.x += projectile.velocityX;
      projectile.y += projectile.velocityY;
      projectile.lifetime--;
    }
    this.internalProjectiles = this.internalProjectiles.filter(p => p.lifetime > 0);
    this.externalProjectile = this.externalProjectile.filter(p => p.lifetime > 0);
  }

  drawProjectiles(ctx) {
    for (const projectile of this.internalProjectiles) {
      ctx.fillStyle = "red";
      ctx.fillRect(projectile.x - projectile.size / 2, projectile.y - projectile.size / 2, projectile.size, projectile.size);
    }
    for (const projectile of this.externalProjectile) {
      ctx.fillStyle = "red";
      ctx.fillRect(projectile.x - projectile.size / 2, projectile.y - projectile.size / 2, projectile.size, projectile.size);
    }
  }
}

export { Projectile, ProjectileManager };
