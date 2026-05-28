function startGame() {
  document.getElementById('playButton').style.display = 'none';
  try {
    gameObjects = convertToObjects(worldData);
  } catch (error) {
    document.write(error);
  }
  objectLoopFunction((object) => scene.add(object.mesh));
  try {
    gameLoop()
  } catch (error) {
    document.write(error);
  }
}
