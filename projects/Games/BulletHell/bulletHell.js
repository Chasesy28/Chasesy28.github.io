const startButton = document.getElementById("startButton");
const gameArea = document.getElementById("gameArea");

let player;

const startGame = () => {
  player = document.createElement("div");
  gameArea.appendChild(player);
  player.style.width = '100px';
  player.style.height = '100px';
  player.style.left = 0;
  player.style.top = 0;
}

startButton.addEventListener("click", startGame);
