const baseBlockSize = 25;

const worldData = [
  [
    [2, 2, 1, 1, 1, 1, 1, 1],
    [1, 1, 2, 1, 1, 1, 1, 1],
    [2, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 2, 1, 1, 1],
    [2, 1, 2, 1, 1, 1, 1, 1],
    new Array(8).fill(1).fill(2, 4),
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
              const block = new Block(k * baseBlockSize, j * baseBlockSize, -i * baseBlockSize, baseBlockSize, baseBlockSize, baseBlockSize, type);
            objects.push(block.block);
          }
        }
      }
    }
  }
  return objects;
}
