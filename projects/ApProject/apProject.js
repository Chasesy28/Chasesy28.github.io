//apProject.js
const canvas = document.getElementById("gameArea");
const ctx = canvas.getContext("2d");

canvas.style.width = "100dvw";
canvas.style.height = "100dvh";
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function toggleSettings() {
  const settingsMenu = document.getElementById("settingsMenu");
  if (settingsMenu.classList.contains("hidden")) {
    settingsMenu.classList.remove("hidden");
  } else {
    settingsMenu.classList.add("hidden");
  }
}

// Game state
let gamePaused = false;
let gameRunning = false;

function togglePause() {
  gamePaused = !gamePaused;
  const pauseButton = document.getElementById("pauseButton");
  if (gamePaused) {
    pauseButton.textContent = "▶";
    pauseButton.title = "Resume Game";
  } else {
    pauseButton.textContent = "⏸";
    pauseButton.title = "Pause Game";
  }
}

function goBack() {
  // Hide the game UI
  const gameTitle = document.getElementById("gameTitle");
  const playButton = document.getElementById("playButton");
  const pauseButton = document.getElementById("pauseButton");

  if (gameTitle) gameTitle.classList.remove("hidden");
  if (playButton) playButton.classList.remove("hidden");
  if (pauseButton) pauseButton.classList.add("hidden");

  // Reset game state
  gamePaused = false;
  gameRunning = false;

  // Go back to previous page
  window.history.back();
}

function backgroundColor(color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

backgroundColor("dimgray");

function isLetter(char) {
  return /^[a-z]$/i.test(char);
}

const controller = {
  jump: { pressed: false, key: ["W", "w"] },
  left: { pressed: false, key: ["A", "a"] },
  right: { pressed: false, key: ["D", "d"] },
  interact: { pressed: false, key: ["S", "s"] },
  previousLevel: { pressed: false, key: ["ArrowLeft"] },
  nextLevel: { pressed: false, key: ["ArrowRight"] },
  previousLayer: { pressed: false, key: ["ArrowUp"] },
  nextLayer: { pressed: false, key: ["ArrowDown"] },
  respawn: { pressed: false, key: ["K", "k"] },
  grow: { pressed: false, key: ["G", "g"] },
  shrink: { pressed: false, key: ["H", "h"] },
};
initializeSettings();

function updateKeybind(keybind, newKey) {
  for (const controllerKey in controller) {
    if (
      controller[controllerKey].key.includes(newKey) &&
      controllerKey !== keybind
    ) {
      // Clear the conflicting keybind
      controller[controllerKey].key = [];
      const button = document.getElementById(controllerKey);
      button.textContent = "";
    }
  }
  if (isLetter(newKey)) {
    controller[keybind].key = [newKey.toUpperCase(), newKey.toLowerCase()];
  } else {
    controller[keybind].key = [newKey];
  }
}

const player = new Player(45, "images/Mario.png");

let currentLevel = 0;
let currentArea = 0;
let levelSwitchCooldown = false;
let layerSwitchCooldown = false;
let longestHorizontalLength;
let longestVerticalLength;
let activeLevelData = [];

function updateLevelData() {
  currentArea = 0;
  activeLevelData = [];
  for (let i = 0; i < levels[currentLevel].length; i++) {
    activeLevelData.push([]);
    for (let j = 0; j < levels[currentLevel][i].length; j++) {
      activeLevelData[i].push(
        convertToObjects(levels[currentLevel][i][j], j, i),
      );
    }
  }
  longestHorizontalLength = Math.max.apply(
    null,
    activeLevelData[currentArea].map((layer) =>
      Math.max.apply(
        null,
        layer.map((row) => row.length),
      ),
    ),
  );
  longestVerticalLength = Math.max.apply(
    null,
    activeLevelData[currentArea].map((layer) => layer.length),
  );
}

let times = [];

function gameLoop() {
  // FPS calculation
  const currentTime = performance.now();

  while (times.length > 0 && times[0] <= currentTime - 1000) {
    times.shift();
  }
  times.push(currentTime);
  fps = times.length;
  console.log("FPS: " + fps);
  console.log()

  // Skip game logic if paused, but still update the display
  if (gamePaused) {
    requestAnimationFrame(gameLoop);
    return;
  }

  backgroundColor("lightblue");
  for (let i = 0; i < activeLevelData[currentArea].length; i++) {
    buildLevel(activeLevelData[currentArea][i]);
    if (player.layer == i) {
      player.drawPlayer();
    }
  }
  ctx.globalAlpha = 1;
  player.move(controller);
  player.grounded = false;
  player.currentGroundBlock = null;
  player.insideBlock = null;
  let areaChanged = false;
  for (let i = 0; i < activeLevelData[currentArea][player.layer].length; i++) {
    for (let j = 0; j < activeLevelData[currentArea][player.layer][i].length; j++) {
      if (activeLevelData[currentArea][player.layer][i][j].isBlock) {
        const block = activeLevelData[currentArea][player.layer][i][j];
        if (block.solid) {
          if (
            Math.abs(player.x - block.x + player.globalOffsetX) < 100 &&
            Math.abs(player.y - block.y + player.globalOffsetY) < 100
          ) {
            const wasInsideThisBlock = player.isOverlappingObject(block, true);
            const insideThisBlock = player.insideBlockDetection(block);
            const shouldIgnoreCollision = wasInsideThisBlock && insideThisBlock;

            if (!shouldIgnoreCollision) {
              player.sideBlockDetection(block);
              player.groundedDetection(block);
            }
          }
        } else {
          if (player.insideBlockDetection(block)) {
            if (controller.interact.pressed) {
              if (block.type === "areaDoor") {
                currentArea = Number(block.doorArea);
                player.spawn();
                areaChanged = true;
                break;
              }
            }
            if (block.type === "spike") {
              player.die();
              break;
            }
          }
        }
      } else if (activeLevelData[currentArea][player.layer][i][j].isEnemy) {
        const enemy = activeLevelData[currentArea][player.layer][i][j];
        if (player.isOverlappingObject(enemy, true)) {
          player.die();
          break;
        }
      }
      if (areaChanged) {
        break;
      }
    }
  }
  player.gameBoundaryDetection();
  if (controller.previousLevel.pressed) {
    if (!levelSwitchCooldown) {
      levelSwitchCooldown = true;
      setTimeout(() => {
        levelSwitchCooldown = false;
      }, 250);
      if (currentLevel > 0) {
        currentLevel--;
      }
      updateLevelData();
      player.spawn();
    }
  }
  if (controller.nextLevel.pressed) {
    if (!levelSwitchCooldown) {
      levelSwitchCooldown = true;
      setTimeout(() => {
        levelSwitchCooldown = false;
      }, 250);
      if (currentLevel < levels.length - 1) {
        currentLevel++;
      }
      updateLevelData();
      player.spawn();
    }
  }
  if (controller.nextLayer.pressed) {
    if (!layerSwitchCooldown) {
      layerSwitchCooldown = true;
      setTimeout(() => {
        layerSwitchCooldown = false;
      }, 250);
      if (
        player.layer <
        activeLevelData[currentArea][player.layer].length - 1
      ) {
        player.layer++;
      }
      if (player.layer >= activeLevelData[currentArea].length) {
        player.layer = activeLevelData[currentArea].length - 1;
      }
    }
  }
  if (controller.previousLayer?.pressed) {
    if (!layerSwitchCooldown) {
      layerSwitchCooldown = true;
      setTimeout(() => {
        layerSwitchCooldown = false;
      }, 250);
      if (player.layer > 0) {
        player.layer--;
      }
      if (player.layer <= 0) {
        player.layer = 0;
      }
    }
  }

  if (controller.respawn.pressed) {
    player.die();
  }

  requestAnimationFrame(gameLoop);
}

function startGame() {
  const gameTitle = document.getElementById("gameTitle");
  gameTitle.classList.add("hidden");
  const playButton = document.getElementById("playButton");
  playButton.classList.add("hidden");
  const pauseButton = document.getElementById("pauseButton");
  pauseButton.classList.remove("hidden");

  gameRunning = true;
  gamePaused = false;
  pauseButton.textContent = "⏸";
  pauseButton.title = "Pause Game";

  updateLevelData();
  player.spawn();
  gameLoop();
  visualViewport.addEventListener("resize", function () {
    //just in case the user changes orientation or something
    canvas.style.width = "100dvw";
    canvas.style.height = "100dvh";
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  });
}

window.document.addEventListener("keydown", function (e) {
  for (const controllerKey in controller) {
    if (controller[controllerKey].key.includes(e.key)) {
      controller[controllerKey].pressed = true;
    }
  }
});

window.document.addEventListener("keyup", function (e) {
  for (const controllerKey in controller) {
    if (controller[controllerKey].key.includes(e.key)) {
      controller[controllerKey].pressed = false;
    }
  }
});
