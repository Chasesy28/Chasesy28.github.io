//apProjectSettings.js
//PS currently the settings menu has features like framerate and rendering type which I haven't figured out how to do yet so they just send console.logs when changed, but the keybind changing works and saves to local storage so you can change your keybinds and they will be there when you refresh the page
const panel = document.getElementById("settingsMenu");

// Game Settings Object
const gameSettings = {
	framerate: 60,
	renderMode: "cpu", // "cpu" or "gpu"
  blockImages: true,
	audioVolume: 70,
	audioOutput: "speakers" // "speakers", "headphones", or "mute"
};

// Make gameSettings globally accessible
window.gameSettings = gameSettings;

// Load settings from localStorage
function loadSettings() {
	const saved = localStorage.getItem("apProjectSettings");
	if (saved) {
		const loaded = JSON.parse(saved);
		Object.assign(gameSettings, loaded);
	}
	applySettings();
}

// Save settings to localStorage
function saveSettings() {
	localStorage.setItem("apProjectSettings", JSON.stringify(gameSettings));
}

let webGl = false;

// Apply settings to the game
function applySettings() {
	// Apply framerate
	const framerateSelect = document.getElementById("framerate");
	if (framerateSelect) {
		framerateSelect.value = gameSettings.framerate;
	}

	// Apply render mode
	const renderModeSelect = document.getElementById("renderMode");
	if (renderModeSelect) {
		renderModeSelect.value = gameSettings.renderMode;
    if (gameSettings.renderMode === "gpu") {
      canvas.style.display = "none";
      webGlCanvas.style.display = "block";
      webGl = true;
    } else {
      canvas.style.display = "block";
      webGlCanvas.style.display = "none";
      webGl = false;
    }
	}

  const blockImagesSelect = document.getElementById("blockImages");
  if (blockImagesSelect) {
    blockImagesSelect.value = gameSettings.blockImages ? "on" : "off";
  }

	// Apply audio volume
	const volumeSlider = document.getElementById("audioVolume");
	if (volumeSlider) {
		volumeSlider.value = gameSettings.audioVolume;
		updateVolumeDisplay();
	}

	// Apply audio output
	const audioOutputSelect = document.getElementById("audioOutput");
	if (audioOutputSelect) {
		audioOutputSelect.value = gameSettings.audioOutput;
	}
}

// I still need to fix this so that it actually changes the framerate instead of just sending console logs
	const framerateSelect = document.getElementById("framerate");
	if (framerateSelect) {
		framerateSelect.addEventListener("change", (e) => {
			gameSettings.framerate = parseInt(e.target.value);
			saveSettings();
			console.log(`Framerate set to ${gameSettings.framerate} FPS`);
		});
	}

	const renderModeSelect = document.getElementById("renderMode");
	if (renderModeSelect) {
		renderModeSelect.addEventListener("change", (e) => {
			gameSettings.renderMode = e.target.value;
			saveSettings();
      if (gameSettings.renderMode === "gpu") {
        canvas.style.display = "none";
        webGlCanvas.style.display = "block";
        webGl = true;
      } else {
        canvas.style.display = "block";
        webGlCanvas.style.display = "none";
        webGl = false;
      }
		});
	}

  const blockImagesSelect = document.getElementById("blockImages");
  if (blockImagesSelect) {
    blockImagesSelect.addEventListener("change", (e) => {
      gameSettings.blockImages = e.target.value === "on";
      saveSettings();
    });
  }


// Setup audio settings listeners
function setupAudioSettings() {
	const volumeSlider = document.getElementById("audioVolume");
	if (volumeSlider) {
		volumeSlider.addEventListener("input", (e) => {
			gameSettings.audioVolume = parseInt(e.target.value);
			updateVolumeDisplay();
			saveSettings();
		});
	}

	const audioOutputSelect = document.getElementById("audioOutput");
	if (audioOutputSelect) {
		audioOutputSelect.addEventListener("change", (e) => {
			gameSettings.audioOutput = e.target.value;
			saveSettings();
			console.log(`Audio output set to ${gameSettings.audioOutput}`);
		});
	}
}

// Update volume display value
function updateVolumeDisplay() {
	const volumeValue = document.getElementById("volumeValue");
	if (volumeValue) {
		volumeValue.textContent = gameSettings.audioVolume + "%";
	}
}

//Dragging functionality taken from online tutorial for another project then ported here
function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    if (e.target.closest(".settings-slider-container") ||
        e.target.closest(".settings-select") ||
        e.target.closest(".keybind") ||
        e.target.closest(".editor-button") ||
        e.target.closest("select") ||
        e.target.closest("button")) {
      return;
    }

    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    elmnt.style.position = "absolute";
    e = e || window.event;
    e.preventDefault();

    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    var parentWidth = window.innerWidth;
    var parentHeight = window.innerHeight;
    var newRight = parentWidth - (elmnt.offsetLeft + elmnt.offsetWidth) + pos1;
    var newBottom =
      parentHeight - (elmnt.offsetTop + elmnt.offsetHeight) + pos2;

    // Apply the styles
    elmnt.style.right = newRight + "px";
    elmnt.style.bottom = newBottom + "px";

    // Clear top/left so they don't fight with right/bottom
    elmnt.style.top = "auto";
    elmnt.style.left = "auto";

    elmnt.style.position = "fixed";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

dragElement(panel);

const levelEditor = document.getElementById("levelEditorMenu");
dragElement(levelEditor);
const editLevelMenu = document.getElementById("editLevelMenu");
dragElement(editLevelMenu);

function settingsKeybind(buttonId) {
  const button = document.getElementById(buttonId);
  button.textContent = "Press a key...";
  function keyListener(e) {
    if (e.key === "Escape") {
      if (isLetter(controller[buttonId].key[0])) {
        button.textContent = controller[buttonId].key[0].toUpperCase();
      } else {
        button.textContent = controller[buttonId].key[0];
      }
      window.removeEventListener("keydown", keyListener);
      return;
    }
    if (isLetter(e.key)) {
      button.textContent = e.key.toUpperCase();
    } else {
      button.textContent = e.key;
    }
    updateKeybind(buttonId, e.key);
    window.removeEventListener("keydown", keyListener);
  }
  window.addEventListener("keydown", keyListener);
}

function attachSettingsListeners(buttonId) {
  const button = document.getElementById(buttonId);
  button.textContent = controller[buttonId].key[0];
  button.addEventListener("click", () => {
    settingsKeybind(buttonId);
  });
}

function setupControllerSettings() {
  for (const controllerKey in controller) {
    attachSettingsListeners(controllerKey);
  }
}

// Initialize all settings when the page loads
function initializeSettings() {
	loadSettings();
	setupAudioSettings();
	setupControllerSettings();
}
