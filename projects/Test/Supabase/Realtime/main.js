const gameArea = document.getElementById("game-area");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

function canvasDimensions(canvas) {
  canvas.style.width = "100dvw";
  canvas.style.height = "100dvh";

  // display:none canvases report 0 client size; keep a valid render size on resize.
  const fallbackWidth = Math.floor(
    window.visualViewport?.width || window.innerWidth || 1,
  );
  const fallbackHeight = Math.floor(
    window.visualViewport?.height || window.innerHeight || 1,
  );
  const nextWidth = Math.max(1, canvas.clientWidth || fallbackWidth);
  const nextHeight = Math.max(1, canvas.clientHeight || fallbackHeight);

  if (canvas.width !== nextWidth) {
    canvas.width = nextWidth;
  }
  if (canvas.height !== nextHeight) {
    canvas.height = nextHeight;
  }
}

canvasDimensions(gameArea);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => canvasDimensions(gameArea));
}
window.addEventListener("resize", () => canvasDimensions(gameArea));
window.addEventListener("orientationchange", () => canvasDimensions(gameArea));

let mouseX;
let mouseY;
let mouseDown = false;

let playerList = [];

let frame = 0;

let inGame = false;

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { Player } from "./player.js";
import { Projectile, ProjectileManager } from "./projectile.js";

const SUPABASE_URL = "https://yjxxckovsoyosbzdfxyp.supabase.co";
const SUPABASE_KEY = "sb_publishable__WLTJ9oaxErRvSAwjUVfZg_F6j90iJm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const startScreen = document.getElementById("start-screen");
const usernameInput = document.getElementById("username");
const colorInput = document.getElementById("color");
const startButton = document.getElementById("start-button");
let channelReady = false;

const player = new Player(usernameInput.value, colorInput.value);
const projectileManager = new ProjectileManager();

const myChannel = supabase.channel("test-channel", {
  config: {
    presence: {
      key: player.id,
    }
  }
});

startButton.addEventListener("click", async () => {
  if (!channelReady) {
    return;
  }

  inGame = true;
  startScreen.style.display = "none";
  gameArea.style.display = "block";

  player.setName(usernameInput.value);
  player.setColor(colorInput.value);

  await myChannel.track({
    username: player.name,
    color: player.color,
    status: "online",
  })

  gameLoop();
});

myChannel.on(
  "broadcast",
  { event: "update" },
  (payload) => processUpdates(payload),
);
myChannel.on(
  "broadcast",
  { event: "damage" },
  ({ payload }) => damage(payload),
);
myChannel.on(
  "presence",
  { event: "sync" }, () => {
    syncPresencePlayers();
  },
)
myChannel.on(
  "presence",
  { event: "join" }, ({ key, newPresences }) => {
    for (const presence of newPresences) {
      addPresencePlayer(key, presence);
    }
  }
);
myChannel.on(
  "presence",
  { event: "leave" }, ({ key, leftPresences }) => {
    playerList = playerList.filter(remotePlayer => remotePlayer.id !== key);
    projectileManager.externalProjectiles = projectileManager.externalProjectiles.filter(p => p.ownerId !== key);
  }
);
myChannel.subscribe((status) => {
  channelReady = status === "SUBSCRIBED";
  startButton.disabled = !channelReady;
});

function addPresencePlayer(key, presence) {
  if (key === player.id) {
    return;
  }

  const existingPlayer = playerList.find(remotePlayer => remotePlayer.id === key);

  if (existingPlayer) {
    existingPlayer.setName(presence.username);
    existingPlayer.setColor(presence.color);
    return;
  }

  const remotePlayer = new Player(presence.username, presence.color);
  remotePlayer.id = key;
  playerList.push(remotePlayer);
}

function syncPresencePlayers() {
  const state = myChannel.presenceState();
  const presentPlayerIds = new Set();

  for (const [key, presences] of Object.entries(state)) {
    if (key === player.id) {
      continue;
    }

    const presence = presences[0];

    if (!presence) {
      continue;
    }

    presentPlayerIds.add(key);
    addPresencePlayer(key, presence);
  }

  playerList = playerList.filter(remotePlayer => presentPlayerIds.has(remotePlayer.id));

}

function processUpdates({ payload }) {
  // Player updates
  payload[0].forEach(player => updateOtherPlayer({ payload: player }));
  // Projectile updates
  payload[1].forEach(projectile => projectileManager.receiveProjectileUpdate(projectile));
}

function updateOtherPlayer({ payload }) {
  const otherPlayer = playerList.find(p => p.id === payload.id);
  if (!otherPlayer) {
    return;
  }
  otherPlayer.x = payload.x;
  otherPlayer.y = payload.y;
}

function damage(payload) {
  if (payload.target === player.name) {
    player.takeDamage(payload.damage);
  }
}

const controller = {
  W: { pressed: false },
  w: { pressed: false },
  A: { pressed: false },
  a: { pressed: false },
  S: { pressed: false },
  s: { pressed: false },
  D: { pressed: false },
  d: { pressed: false },
  g: { pressed: false },
  "`": { pressed: false },
};

function gameLoop() {
  ctx.clearRect(0, 0, gameArea.width, gameArea.height);
  const message = [];
  player.draw(ctx);
  player.move(controller, gameArea);
  player.cooldown--;
  if (mouseDown) {
    player.fireProjectile(projectileManager, mouseX, mouseY);
  }
  message.push(player.sendPositionUpdate());

  for (const otherPlayer of playerList) {
    otherPlayer.draw(ctx);
    projectileManager.collisionDetection(otherPlayer, myChannel);
  }

  projectileManager.updateProjectiles();
  message.push(projectileManager.sendProjectileUpdate());
  projectileManager.filterProjectiles();
  projectileManager.drawProjectiles(ctx);

  if (controller.g.pressed) {
    alert(JSON.stringify(message));
  }

  if (frame % 4 === 0) {
    myChannel.send({
      type: "broadcast",
      event: "update",
      payload: message,
    });
  }

  frame++;

  requestAnimationFrame(gameLoop);
}

window.document.addEventListener("keydown", function (e) {
  if (controller[e.key]) {
    controller[e.key].pressed = true;
  }
});

window.document.addEventListener("keyup", function (e) {
  if (controller[e.key]) {
    controller[e.key].pressed = false;
  }
});

document.addEventListener("mousemove", function (event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

document.addEventListener("mousedown", function (event) {
  mouseDown = true;
});

document.addEventListener("mouseup", function (event) {
  mouseDown = false;
});
