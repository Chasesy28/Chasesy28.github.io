class Projectile {
  constructor(x, y, velocityX, velocityY, owner) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.id = Date.now();
    this.owner = owner;
    this.color = owner.color;
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
          id: projectile.id,
          x: projectile.x,
          y: projectile.y,
          velocityX: projectile.velocityX,
          velocityY: projectile.velocityY,
          lifetime: projectile.lifetime,
          owner: projectile.owner,
        },
      });
    }
  }

  receiveProjectileUpdate(payload) {
    const existingProjectile = this.externalProjectile.find(
      (p) => p.id === payload.id && p.owner === payload.owner
    );

    if (existingProjectile) {
      existingProjectile.x = payload.x;
      existingProjectile.y = payload.y;
      existingProjectile.velocityX = payload.velocityX;
      existingProjectile.velocityY = payload.velocityY;
      existingProjectile.lifetime = payload.lifetime;
    } else {
      const newProjectile = new Projectile(
        payload.x,
        payload.y,
        payload.velocityX,
        payload.velocityY,
        payload.owner
      );
      newProjectile.id = payload.id;
      newProjectile.lifetime = payload.lifetime;
      this.addExternalProjectile(newProjectile);
    }
  }

  updateProjectiles() {
    for (const projectile of this.internalProjectiles) {
      projectile.x += projectile.velocityX;
      projectile.y += projectile.velocityY;
      projectile.lifetime--;
    }
  }

  filterProjectiles() {
    this.internalProjectiles = this.internalProjectiles.filter(p => p.lifetime > 0);
    this.externalProjectile = this.externalProjectile.filter(p => p.lifetime > 0);
  }

  drawProjectiles(ctx) {
    for (const projectile of this.internalProjectiles) {
      ctx.fillStyle = projectile.color;
      ctx.fillRect(projectile.x - projectile.size / 2, projectile.y - projectile.size / 2, projectile.size, projectile.size);
    }
    for (const projectile of this.externalProjectile) {
      ctx.fillStyle = projectile.color;
      ctx.fillRect(projectile.x - projectile.size / 2, projectile.y - projectile.size / 2, projectile.size, projectile.size);
    }
  }
}

export { Projectile, ProjectileManager };
