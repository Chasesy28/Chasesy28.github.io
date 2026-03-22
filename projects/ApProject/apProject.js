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

function backgroundColor(r, g, b, randomize) {
  ctx.fillStyle = `rgba(${r}, ${g}, ${b})`;
  ctx.fillRect
  for (let i = 0; i < Math.max(longestHorizontalLength, gameArea.width / 50); i ++) {
    for (let j = 0; j < Math.max(longestVerticalLength, gameArea.height / 50); j ++) {
      if (randomize) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.1 + 0.85})`;
      } else {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b})`;
      }
      ctx.fillRect((i * 50) - player.globalOffsetX, (j * 50) - player.globalOffsetY, 50.5, 50.5);
    }
  }
}

ctx.fillStyle = "black";
ctx.fillRect(0, 0, gameArea.width, gameArea.height);

const controller = {
  W: { pressed: false },
  w: { pressed: false },
  A: { pressed: false },
  a: { pressed: false },
  D: { pressed: false },
  d: { pressed: false },
  ArrowLeft: { pressed: false },
  ArrowRight: { pressed: false },
  ArrowUp: { pressed: false },
  ArrowDown: { pressed: false },
};

const player = new Player(100, 100, 35, "/images/Mario.png");

let currentLevel = 0;
let levelSwitchCooldown = false;
let layerSwitchCooldown = false;
let longestHorizontalLength;
let longestVerticalLength;
let activeLevelData = [];
const levels = [
  [
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
      [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [0, 2, 2, 2, 0],
      [0, 0, "p", 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [],
      [0, 0, 1],
      [],
      [0, 1],
      [],
      [0, 0, 1],
      [],
      [0, 1],
      [],
      [0, 0, 1],
      [],
      [0, 1],
      [],
      [0, 0, 1],
      [],
      [0, 1],
      [],
      [0, 0, 1],
      [],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [],
      [0, 0, 1],
      [],
      [0, 1],
      [0, 0, 0],
      [0, 0, 1],
      [],
      [0, 1],
      [],
      [0, 0, 1],
      [0],
      [0, 1],
      [0, 0, 0],
      [0, 0, 1],
      [0, 0],
      [0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [4, 4, 4, 4, 4, 5, 4, 4, 4, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  ],
  [
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
      [],
      [],
      [],
      [],
      [],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [],
      [],
      [],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1],
      [],
      [],
      ["p"],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  ],
  [
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 3],
      [0, 3, 2, 3, 0],
      ["p", 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
    ]

  ],
  [
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, "p", 0, 0, 2, 2, 2, 0, 3, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [],
      [0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 0],
    ]
  ],
  [
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
      [],
      [],
      [],
      [],
      [],
      [],
      ["p", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  ],
];

function updateLevelData() {
  for (let i = 0; i < levels[currentLevel].length; i++) {
    activeLevelData[i] = convertToObjects(levels[currentLevel][i]);
  }
  longestHorizontalLength = Math.max.apply(null, activeLevelData.map(layer => Math.max.apply(null, layer.map(row => row.length))));
  longestVerticalLength = Math.max.apply(null, activeLevelData.map(layer => layer.length));
}

function gameLoop() {
  ctx.clearRect(0, 0, gameArea.width, gameArea.height);
  backgroundColor(173, 216, 230, true);
  for (let i = 0; i < activeLevelData.length; i++) {
    buildLevel(activeLevelData[i]);
  }
  player.drawPlayer();
  player.move(controller);
  player.grounded = false;
  player.currentGroundBlock = null;
  for (let i = 0; i < activeLevelData[player.layer].length; i++) {
    for (let j = 0; j < activeLevelData[player.layer][i].length; j++) {
      const block = activeLevelData[player.layer][i][j];
      if (block.solid) {
        if (
          Math.abs(player.x - block.x + player.globalOffsetX) < 100 &&
          Math.abs(player.y - block.y + player.globalOffsetY) < 100
        ) {
          player.groundedDetection(block);
          player.insideBlockDetection(block);
        }
      }
    }
  }
  player.gameBoundaryDetection();
  if (controller["ArrowLeft"]?.pressed) {
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
  if (controller["ArrowRight"]?.pressed) {
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
  if (controller["ArrowUp"]?.pressed) {
    if (!layerSwitchCooldown) {
      layerSwitchCooldown = true;
      setTimeout(() => {
        layerSwitchCooldown = false;
      }, 250);
      player.layer++;
      if (player.layer >= activeLevelData.length) {
        player.layer = activeLevelData.length - 1;
      }
    }
  }
  if (controller["ArrowDown"]?.pressed) {
    if (!layerSwitchCooldown) {
      layerSwitchCooldown = true;
      setTimeout(() => {
        layerSwitchCooldown = false;
      }, 250);
      player.layer--;
      if (player.layer < 0) {
        player.layer = 0;
      }
    }
  }

  requestAnimationFrame(gameLoop);
}

function startGame() {
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
  if (controller[e.key]) {
    controller[e.key].pressed = true;
  }
});

window.document.addEventListener("keyup", function (e) {
  if (controller[e.key]) {
    controller[e.key].pressed = false;
  }
});
