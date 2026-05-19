const worldData = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, "p", 3, 3, 3, 3, 3, 3, 3],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

function convertToObjects(worldData) {
  const objects = [];
  for (let i = 0; i < worldData.length; i++) {
    for (let j = 0; j < worldData[i].length; j++) {
      const id = worldData[i][j];
      if (id !== 0 && id !== undefined) {
        if (id === "p") {
          scene.add(player.render(j * 50, -i * 50));
        } else if (objectTypes[id]) {
          const type = objectTypes[id];
          const block = new Block(j * 50, -i * 50, type);
          block.mesh = createBox(j * 50, -i * 50, ...type.property.dimensions);
          setColor(block.mesh, ...type.color);
          scene.add(block.mesh);
          objects.push(block);
        }
      }
    }
  }
  return objects;
}
