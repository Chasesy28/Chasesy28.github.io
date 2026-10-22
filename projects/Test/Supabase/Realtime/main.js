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

startButton.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameArea.style.display = "block";
  myChannel.send({
    type: "broadcast",
    event: "join",
    payload: { message: usernameInput.value, color: colorInput.value },
  });
});

myChannel.subscribe();
myChannel.on(
  "broadcast",
  { event: "join" },
  (payload) => addNewPlayer(payload),
);

function addNewPlayer({ payload }) {
  alert(payload.message + " has joined the channel!");
  myChannel.send({
    type: "broadcast",
    event: "join",
    payload: { message: usernameInput.value, color: colorInput.value },
  });
}

function updateOtherPlayer({ payload }) {

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
  Control: { pressed: false },
};

function gameLoop() {
  ctx.clearRect(0, 0, gameArea.width, gameArea.height);
  requestAnimationFrame(gameLoop);
}

gameLoop();

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
