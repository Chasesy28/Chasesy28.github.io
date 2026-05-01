function convertToObjects(array) {
  const objects = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      for (let k = 0; k < array[i][j].length; k++) {
        const type = array[i][j][k];
        if (type !== 0) {
          objects.push(gameObjectTypes[type]);
        }
      }
    }
  }
  return objects;
}
