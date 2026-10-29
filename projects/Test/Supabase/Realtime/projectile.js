class Projectile {
  constructor(x, y, velocityX, velocityY, owner, color) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.id = Date.now();
    this.owner = owner;
    this.color = color;
    this.size = 10;
    this.lifetime = 100;
    this.timeSinceCalled = 0;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
  }
}

class ProjectileManager {
  constructor() {
    this.internalProjectiles = [];
    this.externalProjectiles = [];
  }

  addInternalProjectile(projectile) {
    this.internalProjectiles.push(projectile);
  }

  addExternalProjectile(projectile) {
    this.externalProjectiles.push(projectile);
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
          color: projectile.color,
        },
      });
    }
  }

  receiveProjectileUpdate(payload) {
    const existingProjectile = this.externalProjectiles.find(
      (p) => p.id === payload.id && p.owner === payload.owner
    );

    if (existingProjectile) {
      existingProjectile.x = payload.x;
      existingProjectile.y = payload.y;
      existingProjectile.velocityX = payload.velocityX;
      existingProjectile.velocityY = payload.velocityY;
      existingProjectile.lifetime = payload.lifetime;
      existingProjectile.color = payload.color;
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
    this.externalProjectiles = this.externalProjectiles.filter(p => p.lifetime > 0);
    this.externalProjectiles = this.externalProjectiles.filter(p => p.timeSinceCalled < 180);
    for (const projectile of this.externalProjectiles) {
      projectile.timeSinceCalled++;
    }
  }

  drawProjectiles(ctx) {
    for (const projectile of this.internalProjectiles) {
      projectile.draw(ctx);
    }
    for (const projectile of this.externalProjectiles) {
      projectile.draw(ctx);
    }
  }

  collisionDetection(player, channel) {
    for (const projectile of this.internalProjectiles) {
      if (projectile.owner !== player) {
        const dx = projectile.x - player.x;
        const dy = projectile.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < (projectile.size / 2 + player.size / 2)) {
          projectile.lifetime = 0;
          channel.send({
            type: "broadcast",
            event: "damage",
            payload: {
              target: player.name,
              damage: 1,
            },
          });
        }
      }
    }
  }
}

export { Projectile, ProjectileManager };
