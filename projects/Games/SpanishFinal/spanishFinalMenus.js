function startGame() {
  document.getElementById('playButton').classList.add('hidden');
  document.getElementById('instructionsOverlay').classList.remove('hidden');
  gamePaused = true;
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

function instructionsOverlayClick() {
  document.getElementById('instructionsOverlay').classList.add('hidden');
  gamePaused = false;
}
