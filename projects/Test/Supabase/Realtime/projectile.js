class Projectile {
  constructor(x, y, velocityX, velocityY) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = 10;
  }
}

class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  addProjectile(projectile) {
    this.projectiles.push(projectile);
  }

  updateProjectiles() {
    for (const projectile of this.projectiles) {
      projectile.x += projectile.velocityX;
      projectile.y += projectile.velocityY;
    }
  }

  drawProjectiles(ctx) {
    for (const projectile of this.projectiles) {
      ctx.fillStyle = "red";
      ctx.fillRect(projectile.x - projectile.size / 2, projectile.y - projectile.size / 2, projectile.size, projectile.size);
    }
  }
}

export { Projectile, ProjectileManager };
