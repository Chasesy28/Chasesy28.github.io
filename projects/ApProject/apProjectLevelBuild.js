function convertToObjects(levelData) {
  let level = [];
  //Runs for each row in the level data
  for (let i = 0; i < levelData.length; i++) {
    //Creates objects for each column in the row
    let row = [];
    for (let j = 0; j < levelData[i].length; j++) {
      if (levelData[i][j] === 1) {
        row.push(new Block(j * 50, i * 50, 50, 50));
      }
    }
    level.push(row);
  }
  return level;
}

function buildLevel(levelData) {
  let level = convertToObjects(levelData);
  for (let i = 0; i < levelData.length; i++) {
    //Builds each column in the row
    for (let j = 0; j < levelData[i].length; j++) {
      level[i][j].draw();
    }
  }
}
