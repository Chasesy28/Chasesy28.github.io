const worldData = [
  [
    [],
    new Array(32).fill(2).fill(1, 4, 28).concat(new Array(4).fill(2)),
    [],
    [0, "p"].concat(new Array(31).fill(1, 2, 5).concat(new Array(5).fill(0)).concat(new Array(24).fill(1))),
    new Array(8).fill(1).concat(new Array(24).fill(0)).concat(new Array(8).fill(1)),
  ],
  /*[
    new Array(32).fill(2),
    new Array(32).fill(1),
    new Array(32).fill(1),
    new Array(32).fill(1),
    new Array(32).fill(1)
  ],
  [
    new Array(32).fill(1),
  ]*/
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
              const block = new Block(k * baseBlockSize, j * baseBlockSize, -i * baseBlockSize, type);
            objects.push(block);
          }
        } else if (id === "p") {
          scene.add(player.render(k * baseBlockSize, j * baseBlockSize, -i * baseBlockSize));
        }
      }
    }
  }
  return objects;
}
