let levelDataInput = null;

function createNewLevel() {
  const editLevelMenu = document.getElementById("editLevelMenu");
  if (editLevelMenu.classList.contains("hidden")) {
    editLevelMenu.classList.remove("hidden");
    clearEditLevelMenu();
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
  document.getElementById("areasContainer").innerHTML = "";
  newArea();
  newLayer(0);
  newRow(0, 0);
  newTile(0, 0, 0);
}

function newArea() {
  const newArea = document.createElement("div");
  const areas = document.querySelectorAll(`#areasContainer > .area`).length;
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
  if (areas !== 0) {
    newLayer(areas);
    newRow(areas, 0);
    newTile(areas, 0, 0);
  }
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
  if (layerCount !== 0) {
    newRow(areaIndex, layerCount);
    newTile(areaIndex, layerCount, 0);
  }
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
  if (rowCount !== 0) {
    newTile(areaIndex, layerIndex, rowCount);
  }
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
    <select onclick="tileOptions(this)" class="tileInput" id="tileTypeInput${areaIndex}-${layerIndex}-${rowIndex}-${tileCount}">
      <option value="0">Empty</option>
    </select>
  </div>
  `;
  document.getElementById(`area${areaIndex}-layer${layerIndex}-row${rowIndex}-controls`).appendChild(newTile);
}

function tileOptions(selectElement) {
  const value = selectElement.value;
  selectElement.innerHTML = `
    <option value="0">Empty</option>
    <option value="1">Basic</option>
    <option value="2">Temporary</option>
    <option value="3">Permanent Temporary</option>
    <option value="4">Ice</option>
    <option value="5">Slow</option>
    <option value="6">Cobweb</option>
    <option value="7">Spike</option>
    <option value="p">Player Spawn</option>`
  ;
  for (let e = 0; e < Object.keys(enemyTypes).length; e++) {
    const enemyOption = document.createElement("option");
    enemyOption.value = `e${e}`;
    enemyOption.textContent = enemyTypes[e].name;
    selectElement.appendChild(enemyOption);
  }
  for (let a = 0; a < document.querySelectorAll(`#areasContainer > .area`).length; a++) {
    const areaOption = document.createElement("option");
    areaOption.value = `d${a}`;
    areaOption.textContent = `Door to Area ${a + 1}`;
    selectElement.appendChild(areaOption);
  }
  selectElement.value = value;
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
  for (let a = 0; a < document.querySelectorAll(`#areasContainer > .area`).length; a++) {
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
