const baseBlockSize = 30;

const worldData = [
  [
    [2, 2, 1, 1, 1, 1, 1, 1].fill(1),
    [1, "p", 2, 1, 1, 1, 1, 1],
    [2, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 2, 1, 1, 1],
    [2, 1, 2, 1, 1, 1, 1, 1].concat(new Array(24).fill(1)),
    new Array(8).fill(1).fill(2, 4),
  ],
  [
    new Array(32).fill(2),
    new Array(32).fill(1),
    new Array(32).fill(1),
    [1]
  ],
  [
    new Array(32).fill(1),
  ]
];

function convertToObjects(array) {
  const objects = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      for (let k = 0; k < array[i][j].length; k++) {
        const id = array[i][j][k];
        if (id !== 0 && id !== undefined && id !== "p") {
          const type = Object.keys(gameObjectTypes).find((key) => gameObjectTypes[key].id === id);
          if (type) {
              const block = new Block(k * baseBlockSize, j * baseBlockSize, -i * baseBlockSize, baseBlockSize, baseBlockSize, baseBlockSize, type);
            objects.push(block.block);
          }
        } else if (id === "p") {
          player.position = new THREE.Vector3(k * baseBlockSize, j * baseBlockSize, -i * baseBlockSize);
        }
      }
    }
  }
  return objects;
}
