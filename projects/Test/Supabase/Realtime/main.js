const gameArea = document.getElementById("game-area");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

let mouseX;
let mouseY;
let mouseDown = false;

let playerList = [];

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { Player } from "./player.js";
import { Projectile, ProjectileManager } from "./projectile.js";

const SUPABASE_URL = "https://yjxxckovsoyosbzdfxyp.supabase.co";
const SUPABASE_KEY = "sb_publishable__WLTJ9oaxErRvSAwjUVfZg_F6j90iJm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const myChannel = supabase.channel("test-channel");

const startScreen = document.getElementById("start-screen");
const usernameInput = document.getElementById("username");
const colorInput = document.getElementById("color");
const startButton = document.getElementById("start-button");
let channelReady = false;

const player = new Player(ctx, usernameInput.value, colorInput.value);
const projectileManager = new ProjectileManager();

startButton.addEventListener("click", () => {
  if (!channelReady) {
    return;
  }
  startScreen.style.display = "none";
  gameArea.style.display = "block";
  myChannel.send({
    type: "broadcast",
    event: "join",
    payload: { username: usernameInput.value, color: colorInput.value, x: player.x, y: player.y, new: true },
  });
  player.setName(usernameInput.value);
  player.setColor(colorInput.value);
  gameLoop();
});

myChannel.on(
  "broadcast",
  { event: "join" },
  (payload) => addNewPlayer(payload),
);
myChannel.on(
  "broadcast",
  { event: "update" },
  (payload) => updateOtherPlayer(payload),
)
myChannel.on(
  "broadcast",
  { event: "projectile" },
  ({ payload }) => projectileManager.receiveProjectileUpdate(payload),
);
myChannel.on(
  "broadcast",
  { event: "damage" },
  ({ payload }) => damage(payload),
);
myChannel.subscribe((status) => {
  channelReady = status === "SUBSCRIBED";
  startButton.disabled = !channelReady;
});

function addNewPlayer({ payload }) {
  if (!playerList.find(p => p.name === payload.username)) {
    playerList.push(new Player(payload.username, payload.color));
  }
  if (payload.new) {
    myChannel.send({
      type: "broadcast",
      event: "join",
      payload: { username: usernameInput.value, color: colorInput.value, x: player.x, y: player.y, new: false },
    });
  }

}

function updateOtherPlayer({ payload }) {
  const otherPlayer = playerList.find(p => p.name === payload.username);
  if (!otherPlayer) {
    return;
  }
  otherPlayer.x = payload.x;
  otherPlayer.y = payload.y;
  otherPlayer.timeSinceCalled = 0;
}

function damage({ payload }) {
  alert("Hit!");
  if (payload.target === player.name) {
    alert("You took damage!");
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
  "`": { pressed: false },
};

function gameLoop() {
  ctx.clearRect(0, 0, gameArea.width, gameArea.height);
  player.draw(ctx);
  player.move(controller);
  player.cooldown--;
  if (mouseDown) {
    player.fireProjectile(projectileManager, mouseX, mouseY);
  }
  player.sendPositionUpdate(myChannel);

  for (const otherPlayer of playerList) {
    if (otherPlayer.timeSinceCalled > 180) {
      playerList = playerList.filter(p => p !== otherPlayer);
    }
    otherPlayer.timeSinceCalled++;
    otherPlayer.draw(ctx);
    projectileManager.collisionDetection(otherPlayer, myChannel);
  }

  projectileManager.updateProjectiles();
  projectileManager.sendProjectileUpdate(myChannel);
  projectileManager.filterProjectiles();
  projectileManager.drawProjectiles(ctx);

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
