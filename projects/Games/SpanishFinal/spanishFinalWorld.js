const worldData = [
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,'p',0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
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
  },
  5: {
    type: "enemy",
  },
};

function createWorldObject(objectInfo, x, y) {
  if (!objectInfo || !objectInfo.type) {
    return null;
  }

  if (objectInfo.type === "sign") {
    return new Sign(x, y, -1, objectInfo.text ?? "");
  }

  if (objectInfo.type === "enemy") {
    return new Enemy(x, y, -1);
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
          player.respawnPoint.set(k * baseBlockSize + (player.size.x / 2), j * baseBlockSize + (player.size.y / 2), 0);
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
