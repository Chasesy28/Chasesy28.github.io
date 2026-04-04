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
  newArea.classList.add("area");
  newArea.innerHTML = `
    <h3 onClick="hide('area${areas}-controls')">Area ${areas + 1}</h3>
    <div id="area${areas}-controls">
      <label for="newRoomButton${areas}">New Room:</label>
      <button id="newRoomButton${areas}" class="editor-button" onclick="newRoom(${areas})">+</button>
    </div>
  `;
  document.getElementById("areasContainer").appendChild(newArea);
  areas++;
}

function newRoom(areaIndex) {
  const newRoom = document.createElement("div");
  const roomCount = document.querySelectorAll(`#area${areaIndex}-controls > div`).length;
  newRoom.id = `area${areaIndex}-room${roomCount}`;
  newRoom.classList.add("room");
  newRoom.innerHTML = `
    <h4 onClick="hide('area${areaIndex}-room${roomCount}-controls')">Room ${areaIndex + 1}.${roomCount + 1}</h4>
    <div id="area${areaIndex}-room${roomCount}-controls">
      <label for="newRowButton${areaIndex}">New Row:</label>
      <button id="newRowButton${areaIndex}" class="editor-button" onclick="newRow(${areaIndex}, ${roomCount})">+</button>
    </div>
  `;
  document.getElementById(`area${areaIndex}-controls`).appendChild(newRoom);
}

function newRow(areaIndex, roomIndex) {
  const newRow = document.createElement("div");
  const rowCount = document.querySelectorAll(`#area${areaIndex}-room${roomIndex}-controls > div`).length;
  newRow.id = `area${areaIndex}-room${roomIndex}-row${rowCount}`;
  newRow.classList.add("row");
  newRow.innerHTML = `
    <h5 onClick="hide('area${areaIndex}-room${roomIndex}-row${rowCount}-controls')">Row ${areaIndex + 1}.${roomIndex + 1}.${rowCount + 1}</h5>
    <div id="area${areaIndex}-room${roomIndex}-row${rowCount}-controls">
      <label for="newTileButton${areaIndex}">New Tile:</label>
      <button id="newTileButton${areaIndex}" class="editor-button" onclick="newTile(${areaIndex}, ${roomIndex}, ${rowCount})">+</button>
    </div>
  `;
  document.getElementById(`area${areaIndex}-room${roomIndex}-controls`).appendChild(newRow);
}

function newTile(areaIndex, roomIndex, rowIndex) {
  const newTile = document.createElement("div");
  const tileCount = document.querySelectorAll(`#area${areaIndex}-room${roomIndex}-row${rowIndex}-controls > div`).length;
  newTile.id = `area${areaIndex}-room${roomIndex}-row${rowIndex}-tile${tileCount}`;
  newTile.classList.add("tile");
  newTile.innerHTML = `
  <h6 onClick="hide('area${areaIndex}-room${roomIndex}-row${rowIndex}-tile${tileCount}-controls')">Tile ${areaIndex + 1}.${roomIndex + 1}.${rowIndex + 1}.${tileCount + 1}</h6>
  <div id="area${areaIndex}-room${roomIndex}-row${rowIndex}-tile${tileCount}-controls">
    <label for="tileTypeInput${areaIndex}-${roomIndex}-${rowIndex}-${tileCount}">Tile:</label>
    <select class="tileInput" id="tileTypeInput${areaIndex}-${roomIndex}-${rowIndex}-${tileCount}">
      <option value="0">Empty</option>
      <option value="1">Basic</option>
      <option value="2">Temporary</option>
      <option value="3">Permanent Temporary</option>
      <option value="4">Ice</option>
      <option value="5">Slow</option>
      <option value="6">Cobweb</option>
      <option value="7">Spike</option>
      <option value="p">Player Start</option>
      <option value="d0">Door to Area 1</option>
      <option value="e0">Enemy 1</option>
    </select>
  </div>
  `;
  document.getElementById(`area${areaIndex}-room${roomIndex}-row${rowIndex}-controls`).appendChild(newTile);
}

function hide(id) {
  const element = document.getElementById(id);
  if (element.classList.contains("hidden")) {
    element.classList.remove("hidden");
  } else {
    element.classList.add("hidden");
  }
}

function submitLevel() {
  const levelData = [];
  for (let a = 0; a < areas; a++) {
    const areaData = [];
    const rooms = document.querySelectorAll(`#area${a}-controls > .room`);
    rooms.forEach((room, r) => {
      const roomData = [];
      const rows = room.querySelectorAll(`.row`);
      rows.forEach((row, ro) => {
        const rowData = [];
        const tiles = row.querySelectorAll(`.tile`);
        tiles.forEach((tile, t) => {
          const tileType = tile.querySelector("select").value || "0";
          rowData.push(tileType);
        });
        roomData.push(rowData);
      });
      areaData.push(roomData);
    });
    levelData.push(areaData);
  }
  levels.push(levelData);
  currentLevel = levels.length - 1;
  updateLevelData();
  player.spawn();
  closeEditLevelMenu();
}
