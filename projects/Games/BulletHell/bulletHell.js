const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

function gameLoop() {
  ctx.fillStyle = "dimgray";
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
}
