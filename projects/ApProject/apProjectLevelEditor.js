let levelDataInput = null;

function importLevel() {
  levelDataInput = prompt("Paste the level data (4D array in JSON format):");
}

function loadLevel() {
  if (levelDataInput) {
    try {
      const jsonData = JSON.parse(levelDataInput);
      if (Array.isArray(jsonData) && jsonData.every((area) => Array.isArray(area))) {
        levels.push(jsonData);
        currentLevel = levels.length - 1;
        updateLevelData();
      } else {
        alert("Invalid level data format. Please provide a 4D array.");
      }
    } catch (error) {
      alert("Error parsing level data. Please provide valid JSON." + error.message);

    }
  }
}
