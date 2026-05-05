function startGame() {
  document.getElementById('playButton').style.display = 'none';
  gameObjects = convertToObjects(worldData);
  objectLoopFunction((object) => scene.add(object.mesh));
  gameLoop();
}
