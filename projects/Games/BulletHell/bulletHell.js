const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

const backgroundColor = (ctx, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
}

function gameLoop() {
  backgroundColor(ctx, "dimgray");
  ctx.fillStyle = "green";
  ctx.fillRect(50, 50, 100, 100);
  requestAnimationFrame(gameLoop);
}
