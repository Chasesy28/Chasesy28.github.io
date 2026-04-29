//apProject.js
const canvas = document.getElementById("gameArea");
const ctx = canvas.getContext("2d");

const webGlCanvas = document.getElementById("webGlGameArea");
const gl = webGlCanvas.getContext("webgl2", { alpha: false}, {premultipliedAlpha: false}, {antialias: false});

const webGl3dCanvas = document.getElementById("webGl3DCanvas");

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

function resizeGameCanvases() {
  canvasDimensions(canvas);
  canvasDimensions(webGlCanvas);
  canvasDimensions(webGl3dCanvas);

  if (gl) {
    gl.viewport(0, 0, webGlCanvas.width, webGlCanvas.height);
  }
}

resizeGameCanvases();

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resizeGameCanvases);
}
window.addEventListener("resize", resizeGameCanvases);
window.addEventListener("orientationchange", resizeGameCanvases);

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

function toggleLevelEditor() {
  const levelEditorMenu = document.getElementById("levelEditorMenu");
  if (levelEditorMenu.classList.contains("hidden")) {
    levelEditorMenu.classList.remove("hidden");
  } else {
    levelEditorMenu.classList.add("hidden");
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
    pauseButton.textContent = "| |";
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
webGlBackgroundColor(105, 105, 105, 1);
sceneBackgroundColor(105, 105, 105);

/* Code found online on detecting if a character is a letter
https://codingbeautydev.com/blog/javascript-check-if-character-is-letter/ */
function isLetter(char) {
  return /^[a-z]$/i.test(char);
}

const controller = {
  jump: { pressed: false, key: [" "] },
  forward: { pressed: false, key: ["W", "w"] },
  backward: { pressed: false, key: ["S", "s"] },
  left: { pressed: false, key: ["A", "a"] },
  right: { pressed: false, key: ["D", "d"] },
  interact: { pressed: false, key: ["E", "e"] },
  previousLevel: { pressed: false, key: ["ArrowLeft"] },
  nextLevel: { pressed: false, key: ["ArrowRight"] },
  previousLayer: { pressed: false, key: ["ArrowUp"] },
  nextLayer: { pressed: false, key: ["ArrowDown"] },
  respawn: { pressed: false, key: ["K", "k"] },
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

// Mario image from https://www.pngegg.com/en/png-yserwd
const player = new Player(45, "images/Mario.png");

let currentLevel = 0;
let currentArea = 0;
let levelSwitchCooldown = false;
let layerSwitchCooldown = false;
let longestHorizontalLength;
let longestVerticalLength;
let activeLevelData = [];

function removeAllObjects() {
  for (let i = activeLevelData[currentArea].length - 1; i >= 0; i--) {
    const layer = activeLevelData[currentArea][i];
    for (let j = layer.length - 1; j >= 0; j--) {
      const row = layer[j];
      for (let k = row.length - 1; k >= 0; k--) {
        const obj = row[k];
        obj.remove();
      }
    }
  }
}

function updateLevelData() {
  currentArea = 0;
  activeLevelData = [];
  for (let i = 0; i < levels[currentLevel].length; i++) {
    activeLevelData.push([]);
    for (let j = 0; j < levels[currentLevel][i].length; j++) {
      activeLevelData[i].push(
        convertToObjects(levels[currentLevel][i][j], j, i, player),
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


  if (!webGl && !webGl3d) {
    backgroundColor("lightblue");
  } else if (webGl) {
    if (!shadersInitialized) {
      initializeWebGL();
      shadersInitialized = true;
    }
    requestAnimationFrame(webGLRender2D);
  } else if (webGl3d) {
    renderScene();
  }
  for (let i = 0; i < activeLevelData[currentArea].length; i++) {
    buildLevel(activeLevelData[currentArea][i]);
    if (player.layer == i) {
      player.drawPlayer();
    }
  }

  // Skip game logic if paused, but still update the display
  if (gamePaused) {
    requestAnimationFrame(gameLoop);
    return;
  } else {
    ctx.globalAlpha = 1;
    player.move(controller);
    player.grounded = false;
    player.currentGroundBlock = null;
    player.insideBlock = null;
    let areaChanged = false;
    try {
      const layerData = activeLevelData[currentArea][player.layer];
      for (let i = 0; i < layerData.length; i++) {
        for (let j = 0; j < layerData[i].length; j++) {
          const levelObject = layerData[i][j];
          if (!levelObject) {
            continue;
          }

          if (levelObject.isBlock) {
            const block = levelObject;
            if (block.solid) {
              if (
                Math.abs(player.x - block.x + player.globalOffsetX) < 100 &&
                Math.abs(player.y - block.y + player.globalOffsetY) < 100
              ) {
                const wasInsideThisBlock = player.isOverlappingObject(block, true);
                const insideThisBlock = player.insideBlockDetection(block);
                const shouldIgnoreCollision = wasInsideThisBlock && insideThisBlock;

                if (!shouldIgnoreCollision) {
                  player.resolveSolidCollision(block);
                }
              }
            } else if (player.insideBlockDetection(block)) {
              if (controller.interact.pressed) {
                if (
                  block.type === "areaDoor" ||
                  block.type === "areaDoorBottom" ||
                  block.type === "areaDoorTop"
                ) {
                  removeAllObjects();
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
          } else if (levelObject.isEnemy) {
            const enemy = levelObject;
            enemy.update();
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
    } catch (error) {
      console.warn("[APProject] Collision iteration failed", {
        currentArea,
        playerLayer: player.layer,
        playerX: player.x,
        playerY: player.y,
        offsetX: player.globalOffsetX,
        offsetY: player.globalOffsetY,
        error,
      });
    }
  }

  player.gameBoundaryDetection();
  if (controller.previousLevel.pressed) {
    if (!levelSwitchCooldown) {
      if (currentLevel > 0) {
        currentLevel--;
        levelSwitchCooldown = true;
        setTimeout(() => {
          levelSwitchCooldown = false;
        }, 250);
        removeAllObjects();
        updateLevelData();
        player.spawn();
      }
    }
  }
  if (controller.nextLevel.pressed) {
    if (!levelSwitchCooldown) {
      if (currentLevel < levels.length - 1) {
        currentLevel++;
        levelSwitchCooldown = true;
        setTimeout(() => {
          levelSwitchCooldown = false;
        }, 250);
        removeAllObjects();
        updateLevelData();
        player.spawn();
      }
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
  pauseButton.textContent = "| |";
  pauseButton.title = "Pause Game";

  if (webGl) {
    initializeWebGL();
    canvas.style.display = "none";
    webGlCanvas.style.display = "block";
    webGl3dCanvas.style.display = "none";
  } else if (webGl3d) {
    canvas.style.display = "none";
    webGlCanvas.style.display = "none";
    webGl3dCanvas.style.display = "block";
  }

  updateLevelData();
  player.spawn();
  gameLoop();
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
