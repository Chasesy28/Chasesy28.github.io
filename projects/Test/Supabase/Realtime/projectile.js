class Projectile {
  constructor(x, y, velocityX, velocityY) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = 10;
    this.lifetime = 100;
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

  updateProjectiles() {
    for (const projectile of this.internalProjectiles) {
      projectile.x += projectile.velocityX;
      projectile.y += projectile.velocityY;
      projectile.lifetime--;
      if (projectile.lifetime <= 0) {
        this.internalProjectiles.splice(this.internalProjectiles.indexOf(projectile), 1);
      }
    }
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
