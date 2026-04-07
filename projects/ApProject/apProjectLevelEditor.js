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
  clearEditLevelMenu();
}

function clearEditLevelMenu() {
  document.getElementById("editLevelMenu").innerHTML = "";
}

function newArea() {
  const newArea = document.createElement("div");
  newArea.id = `area${areas}`;
  newArea.classList.add("area");
  newArea.innerHTML = `
    <h3 onClick="hide('area${areas}-controls')">Area ${areas + 1}</h3>
    <div id="area${areas}-controls">
      <label for="newLayerButton${areas}">New Layer:</label>
      <button id="newLayerButton${areas}" class="editor-button" onclick="newLayer(${areas})">+</button>
    </div>
  `;
  document.getElementById("areasContainer").appendChild(newArea);
  areas++;
}

function newLayer(areaIndex) {
  const newLayer = document.createElement("div");
  const layerCount = document.querySelectorAll(`#area${areaIndex}-controls > div`).length;
  newLayer.id = `area${areaIndex}-layer${layerCount}`;
  newLayer.classList.add("layer");
  newLayer.innerHTML = `
    <h4 onClick="hide('area${areaIndex}-layer${layerCount}-controls')">Layer ${areaIndex + 1}.${layerCount + 1}</h4>
    <div id="area${areaIndex}-layer${layerCount}-controls">
      <label for="newRowButton${areaIndex}">New Row:</label>
      <button id="newRowButton${areaIndex}" class="editor-button" onclick="newRow(${areaIndex}, ${layerCount})">+</button>
    </div>
  `;
  document.getElementById(`area${areaIndex}-controls`).appendChild(newLayer);
}

function newRow(areaIndex, layerIndex) {
  const newRow = document.createElement("div");
  const rowCount = document.querySelectorAll(`#area${areaIndex}-layer${layerIndex}-controls > div`).length;
  newRow.id = `area${areaIndex}-layer${layerIndex}-row${rowCount}`;
  newRow.classList.add("row");
  newRow.innerHTML = `
    <h5 onClick="hide('area${areaIndex}-layer${layerIndex}-row${rowCount}-controls')">Row ${areaIndex + 1}.${layerIndex + 1}.${rowCount + 1}</h5>
    <div id="area${areaIndex}-layer${layerIndex}-row${rowCount}-controls">
      <label for="newTileButton${areaIndex}">New Tile:</label>
      <button id="newTileButton${areaIndex}" class="editor-button" onclick="newTile(${areaIndex}, ${layerIndex}, ${rowCount})">+</button>
    </div>
  `;
  document.getElementById(`area${areaIndex}-layer${layerIndex}-controls`).appendChild(newRow);
}

function newTile(areaIndex, layerIndex, rowIndex) {
  const newTile = document.createElement("div");
  const tileCount = document.querySelectorAll(`#area${areaIndex}-layer${layerIndex}-row${rowIndex}-controls > div`).length;
  newTile.id = `area${areaIndex}-layer${layerIndex}-row${rowIndex}-tile${tileCount}`;
  newTile.classList.add("tile");
  newTile.innerHTML = `
  <h6 onClick="hide('area${areaIndex}-layer${layerIndex}-row${rowIndex}-tile${tileCount}-controls')">Tile ${areaIndex + 1}.${layerIndex + 1}.${rowIndex + 1}.${tileCount + 1}</h6>
  <div id="area${areaIndex}-layer${layerIndex}-row${rowIndex}-tile${tileCount}-controls">
    <label for="tileTypeInput${areaIndex}-${layerIndex}-${rowIndex}-${tileCount}">Tile:</label>
    <select class="tileInput" id="tileTypeInput${areaIndex}-${layerIndex}-${rowIndex}-${tileCount}">
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
  document.getElementById(`area${areaIndex}-layer${layerIndex}-row${rowIndex}-controls`).appendChild(newTile);
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
    const layers = document.querySelectorAll(`#area${a}-controls > .layer`);
    layers.forEach((layer, l) => {
      const layerData = [];
      const rows = layer.querySelectorAll(`.row`);
      rows.forEach((row, ro) => {
        const rowData = [];
        const tiles = row.querySelectorAll(`.tile`);
        tiles.forEach((tile, t) => {
          const tileType = tile.querySelector("select").value || "0";
          rowData.push(tileType);
        });
        layerData.push(rowData);
      });
      areaData.push(layerData);
    });
    levelData.push(areaData);
  }
  levels.push(levelData);
  currentLevel = levels.length - 1;
  updateLevelData();
  player.spawn();
  closeEditLevelMenu();
}
