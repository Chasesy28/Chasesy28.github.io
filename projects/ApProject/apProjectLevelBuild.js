function convertToObjects(levelData) {
  let longestHorizontalLength = Math.max.apply(null, activeLevelData.map(row => row.length));
  let level = [];
  //Runs for each row in the level data
  for (let i = 0; i < levelData.length; i++) {
    //Creates objects for each column in the row
    let row = [];
    for (let j = 0; j < levelData[i].length; j++) {
      if (levelData[i][j] === "p") {
        player.spawnX = j * 50;
        player.spawnY = i * 50;
        /*if (player.spawnX > gameArea.width / 2) {
          if (player.spawnX > longestHorizontalLength * 50 - gameArea.width) {
            player.spawnX = gameArea.width - 50;
            player.globalOffsetX = longestHorizontalLength * 50 - gameArea.width;
          } else {
            player.spawnX = gameArea.width / 2;
            player.globalOffsetX = j * 50 - gameArea.width / 2;
          }
        }*/
       /*if (player.spawnY > gameArea.height / 2) {
          if (player.spawnY > levelData.length * 50 - gameArea.height) {
            player.spawnY = gameArea.height - 50;
            player.globalOffsetY = levelData.length * 50 - gameArea.height;
          } else {
            player.spawnY = gameArea.height / 2;
            player.globalOffsetY = i * 50 - gameArea.height / 2;
          }
       }*/
      } else if (levelData[i][j] === 1) {
        row.push(new Block(j * 50, i * 50, 50, 50, "basic"));
      } else if (levelData[i][j] === 2) {
        row.push(new Block(j * 50, i * 50, 50, 50, "temporary"));
      } else if (levelData[i][j] === 3) {
        row.push(new Block(j * 50, i * 50, 50, 50, "permanentTemporary"));
      } else if (levelData[i][j] === 4) {
        row.push(new Block(j * 50, i * 50, 50, 50, "ice"));
      } else if (levelData[i][j] === 5) {
        row.push(new Block(j * 50, i * 50, 50, 50, "slow"));
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
