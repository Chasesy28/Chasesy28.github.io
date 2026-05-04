function startGame() {
  document.getElementById('playButton').style.display = 'none';
  gameObjects = convertToObjects(worldData);
  for (const object of gameObjects) {
    scene.add(object.mesh);
  }
  gameLoop();
}
