const gameArea = document.getElementById("game-area");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

let playerList = [];

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { Player } from "./player.js";

const SUPABASE_URL = "https://yjxxckovsoyosbzdfxyp.supabase.co";
const SUPABASE_KEY = "sb_publishable__WLTJ9oaxErRvSAwjUVfZg_F6j90iJm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const myChannel = supabase.channel("test-channel");

const startScreen = document.getElementById("start-screen");
const usernameInput = document.getElementById("username");
const colorInput = document.getElementById("color");
const startButton = document.getElementById("start-button");

const player = new Player(ctx, usernameInput.value, colorInput.value);

startButton.addEventListener("click", () => {
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

myChannel.subscribe();
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

function addNewPlayer({ payload }) {
  alert(payload.username + " has joined the channel!");
  if (!playerList.find(p => p.username === payload.username)) {
    alert("Adding new player: " + payload.username);
    playerList.push(new Player(ctx, payload.username, payload.color));
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
  const otherPlayer = playerList.find(p => p.username === payload.username);
  otherPlayer.x = payload.x;
  otherPlayer.y = payload.y;
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
  player.sendPositionUpdate(myChannel);
  for (const otherPlayer of playerList) {
    otherPlayer.draw(ctx);
  }
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
