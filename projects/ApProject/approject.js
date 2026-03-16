const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function backgroundColor(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
}

function gameLoop() {
  backgroundColor(ctx, "green");
  requestAnimationFrame(gameLoop);
}

function startGame() {
  const playButton = document.getElementById("playButton");
  playButton.classList.add("hidden");
  gameLoop();
  // Initialize and start the game here
}
