function convertToObjects(levelData) {
  let level = [];
  //Runs for each row in the level data
  for (let i = 0; i < levelData.length; i++) {
    //Creates objects for each column in the row
    let row = [];
    for (let j = 0; j < levelData[i].length; j++) {
      if (levelData[i][j] === 1) {
        row.push(new Block(j * 50, i * 50, 50, 50, "basic"));
      }
      if (levelData[i][j] === 2) {
        row.push(new Block(j * 50, i * 50, 50, 50, "temporary"));
      }
      if (levelData[i][j] === 3) {
        row.push(new Block(j * 50, i * 50, 50, 50, "permanentTemporary"));
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
