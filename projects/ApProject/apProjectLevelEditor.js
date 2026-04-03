let levelDataInput = null;
let areas = 0;

function createNewLevel() {
  const editLevelMenu = document.getElementById("editLevelMenu");
  if (editLevelMenu.classList.contains("hidden")) {
    editLevelMenu.classList.remove("hidden");
  }
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

async function exportLevel() {
  const levelData = JSON.stringify(levels[currentLevel]);
  const clipboardItem = new ClipboardItem({ "text/plain": new Blob([levelData], { type: "text/plain" }) });
  await navigator.clipboard.write([clipboardItem]);
}

function importLevel() {
  levelDataInput = prompt("Paste the level data (4D array in JSON format):");
}

function closeEditLevelMenu() {
  document.getElementById("editLevelMenu").classList.add("hidden");
}

function newArea() {
  const newArea = document.createElement("div");
  newArea.id = `area${areas}`;
  newArea.innerHTML = `
    <h3>Area ${areas + 1}</h3>
    <label for="newRoomButton${areas}">New Room:</label>
    <button id="newRoomButton${areas}" class="editor-button" onclick="newRoom(${areas})">+</button>
  `;
  document.getElementById("editLevelMenu").appendChild(newArea);
  areas++;
}

function newRoom(areaIndex) {
  const newRoom = document.createElement("div");
  newRoom.id = `area${areaIndex}-room${document.querySelectorAll(`#area${areaIndex} > div`).length}`;
  newRoom.innerHTML = `
    <h4>Room ${areaIndex + 1}.${document.querySelectorAll(`#area${areaIndex} > div`).length + 1}</h4>
    <label for="newTileButton${areaIndex}">New Tile:</label>
    <button id="newTileButton${areaIndex}" class="editor-button" onclick="newTile(${areaIndex})">+</button>
  `;
  document.getElementById(`area${areaIndex}`).appendChild(newRoom);
}
