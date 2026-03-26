//Dragging functionality taken from online tutorial for another project then ported here
const panel = document.getElementById("settingsMenu");

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

    // 1. Define which element(s) should NOT trigger a drag
    // This checks if the clicked element has the class "no-drag"
    if (e.target.closest(".rain-slider-container")) {
      return; // Exit the function early so dragging never starts
    }

    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    elmnt.style.position = "absolute";
    e = e || window.event;
    e.preventDefault();

    // Calculate how much the mouse moved
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    // Get the parent dimensions (usually the window)
    var parentWidth = window.innerWidth;
    var parentHeight = window.innerHeight;

    // Calculate new Right and Bottom positions
    // We use (Parent Dimension - Offset - Element Dimension) to find the distance from the edge
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

function settingsKeybind(buttonId) {
  const button = document.getElementById(buttonId);
  let key;
  button.textContent = "Press a key...";
  function keyListener(e) {
    button.textContent = e.key.toUpperCase();
    e.key = key;
    window.removeEventListener("keydown", keyListener);
  }
  window.addEventListener("keydown", keyListener);
  return key;
}

function attachSettingsListeners(buttonId) {
  const button = document.getElementById(buttonId);
  button.addEventListener("click", () => {
    let key = settingsKeybind(buttonId);
    updateKeybind(buttonId, key);
  });
}

attachSettingsListeners("right");
