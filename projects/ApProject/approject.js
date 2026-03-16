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

function backgroundColor(color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
}

backgroundColor("black");

class Player {
  constructor(x, y, size, imageSrc) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.image = new Image();
    this.image.src = imageSrc;
  }
  drawPlayer () {
    ctx.drawImage(this.image, this.x, this.y, this.image.width, this.image.height);
  }
}

const player = new Player(100, 100, 50, "/images/Mario.png");

function gameLoop() {
  backgroundColor("lightblue");
  player.drawPlayer();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  const playButton = document.getElementById("playButton");
  playButton.classList.add("hidden");
  gameLoop();
}
