const worldData = [
  [
    [1, 2, 1, 1, 1, 1, 1, 1],
    [1, 1, 2, 1, 1, 1, 1, 1],
    [2, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 2, 1, 1, 1],
    [2, 1, 2, 1, 1, 1, 1, 1],
  ],
  [
    [],
    [],
    [],
    [1]
  ]
];

function convertToObjects(array) {
  const objects = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      for (let k = 0; k < array[i][j].length; k++) {
        const id = array[i][j][k];
        if (id !== 0) {
          const type = Object.keys(gameObjectTypes).find((key) => gameObjectTypes[key].id === id);
          if (type) {
              // Place layers along negative Z so higher layers are in front of the camera
              const block = new Block(k * 100, -j * 100, -i * 100, 100, 100, 100, type);
            objects.push(block.block);
          }
        }
      }
    }
  }
  return objects;
}
