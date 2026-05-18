const worldData = [
  [
    [1, 1, 1, 1, 1],
    [1, 2, 2, 2, 1],
    [1, 2, "p", 2, 1],
    [1, 2, 2, 2, 1],
    [1, 1, 1, 18, 1]
  ]
];

const objectIdentifiers = {
  1: {
    type: "basic",
  },
  2: {
    type: "semiSolidPlatform",
  },
  3: {
    type: "launcher",
    axis: 'y',
    direction: -10,
  },
  4: {
    type: "launcher",
    axis: 'y',
    direction: -15,
  },
  5: {
    type: "launcher",
    axis: 'y',
    direction: -20,
  },
  6: {
    type: "launcher",
    axis: 'x',
    direction: 10,
  },
  7: {
    type: "launcher",
    axis: 'x',
    direction: 15,
  },
  8: {
    type: "launcher",
    axis: 'x',
    direction: 20,
  },
  9: {
    type: "launcher",
    axis: 'x',
    direction: -10,
  },
  10: {
    type: "launcher",
    axis: 'x',
    direction: -15,
  },
  11: {
    type: "launcher",
    axis: 'x',
    direction: -20,
  },
  12: {
    type: "launcher",
    axis: 'z',
    direction: 10,
  },
  13: {
    type: "launcher",
    axis: 'z',
    direction: 15,
  },
  14: {
    type: "launcher",
    axis: 'z',
    direction: 20,
  },
  15: {
    type: "launcher",
    axis: 'z',
    direction: -10,
  },
  16: {
    type: "launcher",
    axis: 'z',
    direction: -15,
  },
  17: {
    type: "launcher",
    axis: 'z',
    direction: -20,
  },
  18: {
    type: "grounder",
  }
};

function convertToObjects(array) {
  const objects = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      for (let k = 0; k < array[i][j].length; k++) {
        const id = array[i][j][k];
        if (id !== 0 && id !== undefined) {
          if (id === "p") {
            scene.add(player.render(k * baseBlockSize, j * baseBlockSize, -i * baseBlockSize));
          } else {
            const objectInfo = objectIdentifiers[id];
            if (objectInfo) {
              let object;
              if (objectInfo.type === "launcher") {
                object = new Launcher(k * baseBlockSize, j * baseBlockSize, -i * baseBlockSize, objectInfo.axis, objectInfo.direction);
              } else {
                object = new Block(k * baseBlockSize, j * baseBlockSize, -i * baseBlockSize, objectInfo.type);
              }
              objects.push(object);
            }
          }
        }
      }
    }
  }
  return objects;
}
