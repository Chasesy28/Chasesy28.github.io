//apProjectLevelBuild.js
const levelNumberKey = {
  1: "basic",
  2: "temporary",
  3: "permanentTemporary",
  4: "ice",
  5: "slow",
  6: "cobweb",
  7: "spike",
}
function convertToObjects(levelData, layer, area, player) {
  let longestHorizontalLength = Math.max.apply(null, levelData.map(row => row.length));
  let level = [];
  //Runs for each row in the level data
  for (let i = 0; i < levelData.length; i++) {
    //Creates objects for each column in the row
    let row = [];
    for (let j = 0; j < levelData[i].length; j++) {
      if (levelData[i][j] === "p") {
        player.spawnX = j * 50;
        player.spawnY = i * 50;
        player.spawnLayer = layer;
        player.globalOffsetX = 0;
        player.globalOffsetY = 0;
        player.spawnOffsetX = 0;
        player.spawnOffsetY = 0;
        if (player.spawnX > gameArea.width / 2 && longestHorizontalLength * 50 > gameArea.width) {
          if (player.spawnX <= longestHorizontalLength * 50 - gameArea.width / 2) {
            player.spawnX = gameArea.width / 2;
            player.spawnOffsetX = j * 50 - gameArea.width / 2;
          } else {
            let spawnDifference = Math.abs(longestHorizontalLength * 50 - player.spawnX);
            spawnDifference = Math.floor(spawnDifference / 50) * 50;
            player.spawnX = gameArea.width - spawnDifference;
            player.spawnOffsetX = longestHorizontalLength * 50 - gameArea.width;
          }
        }
        if (player.spawnY > gameArea.height / 2 && levelData.length * 50 > gameArea.height) {
          if (player.spawnY <= levelData.length * 50 - gameArea.height / 2) {
            player.spawnY = gameArea.height / 2;
            player.spawnOffsetY = i * 50 - gameArea.height / 2;
          } else {
            let spawnDifference = Math.abs(levelData.length * 50 - player.spawnY);
            spawnDifference = Math.floor(spawnDifference / 50) * 50;
            player.spawnY = gameArea.height - spawnDifference;
            player.spawnOffsetY = levelData.length * 50 - gameArea.height;
          }
        }
        player.spawnValues[area] = [player.spawnX, player.spawnY, player.spawnLayer, player.spawnOffsetX, player.spawnOffsetY];
      } else if (Object.keys(levelNumberKey).includes(String(levelData[i][j]))) {
        row.push(new Block(j * 50, i * 50, 50, 50, layer, levelNumberKey[levelData[i][j]]));
      } else if (levelData[i][j][0] === "d") {
        row.push(new Block(j * 50, i * 50, 50, 50, layer, "areaDoorBottom", levelData[i][j].slice(1)));
      } else if (levelData[i][j][0] === "t") {
        row.push(new Block(j * 50, i * 50, 50, 50, layer, "areaDoorTop", levelData[i][j].slice(1)));
      } else if (levelData[i][j][0] === "e") {
        row.push(new Enemy(j * 50, i * 50, levelData[i][j].slice(1), layer));
      }
    }
    level.push(row);
  }
  return level;
}

function buildLevel(levelData) {
  for (let i = 0; i < levelData.length; i++) {
    //Builds each column in the row
    for (let j = 0; j < levelData[i].length; j++) {
      levelData[i][j].draw();
    }
  }
}
