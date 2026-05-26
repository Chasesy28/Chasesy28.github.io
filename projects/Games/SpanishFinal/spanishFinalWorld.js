const worldData = [
  [1, 1, 1, 1, 1],
  [1, 2, 2, 2, 1],
  [1, 2, "p", 2, 1],
  [1, 2, 2, 2, 1],
  [1, 1, 1, 3, 1]
];

const objectIdentifiers = {
  1: {
    type: "basic",
  },
  2: {
    type: "semiSolidPlatform",
  },
  3: {
    type: "grounder",
  }
};

function convertToObjects(array) {
  const objects = [];
  for (let j = 0; j < array.length; j++) {
    for (let k = 0; k < array[j].length; k++) {
      const id = array[j][k];
      if (id !== 0 && id !== undefined) {
        if (id === "p") {
          scene.add(player.render(k * baseBlockSize, j * baseBlockSize, 0));
        } else {
          const objectInfo = objectIdentifiers[id];
          if (objectInfo) {
            let object;
            object = new Block(k * baseBlockSize, j * baseBlockSize, 0, objectInfo.type);
            objects.push(object);
          }
        }
      }
    }
  }
  return objects;
}
