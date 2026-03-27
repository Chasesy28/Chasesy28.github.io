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

function toggleSettings() {
  const settingsMenu = document.getElementById("settingsMenu");
  if (settingsMenu.classList.contains("hidden")) {
    settingsMenu.classList.remove("hidden");
  } else {
    settingsMenu.classList.add("hidden");
  }
}

function backgroundColor(r, g, b, randomize) {
  for (
    let i = 0;
    i < Math.max(longestHorizontalLength, gameArea.width / 50);
    i++
  ) {
    for (
      let j = 0;
      j < Math.max(longestVerticalLength, gameArea.height / 50);
      j++
    ) {
      if (randomize) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.1 + 0.85})`;
      } else {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b})`;
      }
      ctx.fillRect(
        i * 50 - player.globalOffsetX,
        j * 50 - player.globalOffsetY,
        50.5,
        50.5,
      );
    }
  }
}

ctx.fillStyle = "dimgray";
ctx.fillRect(0, 0, gameArea.width, gameArea.height);

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
};
setupControllerSettings();

function updateKeybind(keybind, newKey) {
  if (isLetter(newKey)) {
    controller[keybind].key = [newKey.toUpperCase(), newKey.toLowerCase()];
  } else {
    controller[keybind].key = [newKey];
  }
}

const player = new Player(100, 100, 35, "/images/Mario.png");

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

function gameLoop() {
  backgroundColor(173, 216, 230, true);
  for (let i = 0; i < activeLevelData[currentArea].length; i++) {
    let alpha;
    if (player.layer == i) {
      alpha = 1;
    } else {
      alpha = Math.max(0.1, 1 - Math.abs(player.layer - i) * 0.85);
    }
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
    if (areaChanged) {
      break;
    }
    for (
      let j = 0;
      j < activeLevelData[currentArea][player.layer][i].length;
      j++
    ) {
      const block = activeLevelData[currentArea][player.layer][i][j];
      if (block.solid) {
        if (
          Math.abs(player.x - block.x + player.globalOffsetX) < 100 &&
          Math.abs(player.y - block.y + player.globalOffsetY) < 100
        ) {
          const wasInsideThisBlock = player.isOverlappingBlock(block, true);
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
        }
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
    player.spawn();
  }

  requestAnimationFrame(gameLoop);
}

function startGame() {
  const gameTitle = document.getElementById("gameTitle");
  gameTitle.classList.add("hidden");
  const playButton = document.getElementById("playButton");
  playButton.classList.add("hidden");
  updateLevelData();
  player.spawn();
  gameLoop();
  visualViewport.addEventListener("resize", function () {
    //just in case the user changes orientation or something
    gameArea.style.width = "100dvw";
    gameArea.style.height = "100dvh";
    gameArea.width = gameArea.offsetWidth;
    gameArea.height = gameArea.offsetHeight;
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

