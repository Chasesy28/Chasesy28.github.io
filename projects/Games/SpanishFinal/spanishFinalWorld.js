const worldData = [
  [1, 1, 1, 1, 1],
  [1, 2, 2, 2, 1],
  [1, 2, "p", 2, 1],
  [1, 2, 4, 2, 1],
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
  },
  4: {
    type: "sign",
    text: "Hola! Presiona E para leer letreros.",
  }
};

function createWorldObject(objectInfo, x, y) {
  if (!objectInfo || !objectInfo.type) {
    return null;
  }

  if (objectInfo.type === "sign") {
    return new Sign(x, y, -1, objectInfo.text ?? "");
  }

  return new Block(x, y, 0, objectInfo.type);
}

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
            const object = createWorldObject(
              objectInfo,
              k * baseBlockSize,
              j * baseBlockSize,
            );
            if (object) {
              objects.push(object);
            }
          }
        }
      }
    }
  }
  return objects;
}
