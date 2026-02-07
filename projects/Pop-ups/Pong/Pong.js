const startButton = document.getElementById("startButton");

let gameEnd = false;

let p1;
let p2;
let pWidth = 150;
let pHeight = 400;
let p1Speed = 5;
let p2Speed = 5;

// Use window.screen with fallbacks for compatibility
const screenWidth = window.screen?.availWidth || window.screen?.width || 1920;
const screenHeight =
  window.screen?.availHeight || window.screen?.height || 1080;

// Cache p2 x position to prevent jittering
let p2x = screenWidth - pWidth;

let p1y = screenHeight / 2 - pHeight / 2;
let p2y = p1y;
const p1Features = `width=${pWidth},height=${pHeight},left=${0},top=${p1y},popup=yes`;
const p2Features = `width=${pWidth},height=${pHeight},left=${screenWidth - pWidth},top=${p2y},popup=yes`;

let ball;
let ballWidth = 100;
let ballHeight = 75;
let ballSpeedX;
let ballSpeedY;
let ballX = screenWidth / 2 - ballWidth / 2;
let ballY = screenHeight / 2 - ballHeight / 2;
const ballFeatures = `width=${ballWidth},height=${ballHeight},left=${ballX},top=${ballY},popup=yes`;

const controller = {
  W: { pressed: false, dir: "up", char: 1 },
  w: { pressed: false, dir: "up", char: 1 },
  S: { pressed: false, dir: "down", char: 1 },
  s: { pressed: false, dir: "down", char: 1 },
  ArrowUp: { pressed: false, dir: "up", char: 2 },
  ArrowDown: { pressed: false, dir: "down", char: 2 },
};

// Global key event handlers to avoid stacking listeners
function handleKeyDown(e) {
  if (controller[e.key]) {
    e.preventDefault(); // Prevent default browser behavior
    controller[e.key].pressed = true;
  } else if (e.key === "Escape") {
    if (p1 && !p1.closed) p1.close();
  }
}

function handleKeyUp(e) {
  if (controller[e.key]) {
    e.preventDefault(); // Prevent default browser behavior
    controller[e.key].pressed = false;
  }
}

// Set up event listeners once at the document level
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

function updateValues() {
  function pMovementCalc(key) {
    p1Speed = 5;
    p2Speed = 5;
    if (controller[key].pressed) {
      if (controller[key].dir == "up") {
        if (controller[key].char == 1) {
          p1Speed = -p1Speed;
        } else {
          p2Speed = -p2Speed;
        }
      }
      if (controller[key].char == 1) {
        if (p1y > 0 || p1y + pHeight <= screenHeight) {
          p1y += p1Speed;
          if (p1 && !p1.closed) {
            p1.focus();
          }
        }
      } else {
        if (p2y > 0 || p2y + pHeight <= screenHeight) {
          p2y += p2Speed;
          if (p2 && !p2.closed) {
            p2.focus();
          }
        }
      }
    }
  }

  function pMove() {
    Object.keys(controller).forEach((key) => {
      if (controller[key].pressed) {
        pMovementCalc(key);
      }
    });
    // Check if windows are still valid before accessing
    if (p1 && !p1.closed) {
      try {
        p1.moveTo(0, p1y);
        p1.resizeTo(pWidth, pHeight);
      } catch (e) {
        console.error("Error moving p1:", e);
      }
    }
    if (p2 && !p2.closed) {
      try {
        // Use cached x position to prevent jittering
        p2.moveTo(p2x, p2y);
        p2.resizeTo(pWidth, pHeight);
      } catch (e) {
        console.error("Error moving p2:", e);
      }
    }

    if (!gameEnd) {
      requestAnimationFrame(pMove);
    }
  }

  pMove();

  function ballMove() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballX + ballWidth >= p2x + pWidth || ballX <= 0) {
      ballSpeedX = -ballSpeedX;
    }
    if (ballY + ballHeight >= screenHeight || ballY <= 0) {
      ballSpeedY = -ballSpeedY;
    }

    if (
      ballX <= pWidth &&
      ballY + ballHeight >= p1y &&
      ballY <= p1y + pHeight
    ) {
      ballSpeedX = -ballSpeedX;
    }
    if (
      ballX + ballWidth >= p2x &&
      ballY + ballHeight >= p2y &&
      ballY <= p2y + pHeight
    ) {
      ballSpeedX = -ballSpeedX;
    }

    ballX = Math.max(0, Math.min(ballX, p2x + pWidth - ballWidth));
    ballY = Math.max(0, Math.min(ballY, screenHeight - ballHeight));

    try {
      if (ball && !ball.closed) {
        ball.moveTo(ballX, ballY);
        ball.resizeTo(ballWidth, ballHeight);
      }
    } catch (error) {
      console.error(error);
    }

    if (!gameEnd) {
      requestAnimationFrame(ballMove);
    }
  }

  ballMove();
}

const startGame = () => {
  gameEnd = true;
  gameEnd = false;

  p1y = screenHeight / 2 - pHeight / 2;
  p2y = p1y;
  ballX = screenWidth / 2 - ballWidth / 2;
  ballY = screenHeight / 2 - ballHeight / 2;
  if (Math.floor(Math.random() * 2) == 0) {
    ballSpeedX = 5;
  } else {
    ballSpeedX = -5;
  }
  if (Math.floor(Math.random() * 2) == 0) {
    ballSpeedY = 5;
  } else {
    ballSpeedY = -5;
  }

  if (p1 && !p1.closed) {
    p1.close();
  }
  p1 = window.open("", "Player 1", p1Features);
  if (p2 && !p2.closed) {
    p2.close();
  }
  p2 = window.open("", "Player 2", p2Features);
  if (ball && !ball.closed) {
    ball.close();
  }
  ball = window.open("", "Ball", ballFeatures);

  if (p1 && p2 && ball) {
    // Recalculate p2x based on actual screen width after popups are opened
    const actualScreenWidth =
      window.screen?.availWidth || window.screen?.width || screenWidth;
    p2x = actualScreenWidth - pWidth;

    // Also verify p2's actual position and use that if available
    if (p2.screenX !== undefined && p2.screenX > 0) {
      p2x = p2.screenX;
    }

    ballWidth = ball.outerWidth;
    ballHeight = ball.outerHeight;
    if (p1 && !p1.closed) p1.focus();
    if (p2 && !p2.closed) p2.focus();
    if (ball && !ball.closed) ball.focus();
    updateValues();
    const closeCheck = setInterval(function () {
      if (!p1 || p1.closed) {
        if (p2 && !p2.closed) p2.close();
        if (ball && !ball.closed) ball.close();
        gameEnd = true;
        clearInterval(closeCheck);
      } else if (!p2 || p2.closed) {
        if (p1 && !p1.closed) p1.close();
        if (ball && !ball.closed) ball.close();
        gameEnd = true;
        clearInterval(closeCheck);
      } else if (!ball || ball.closed) {
        if (p1 && !p1.closed) p1.close();
        if (p2 && !p2.closed) p2.close();
        gameEnd = true;
        clearInterval(closeCheck);
      }
    }, 500);
  } else {
    alert(
      "Popup Windows are Blocked!\n\nPlease allow popups for this site and try again.",
    );
    gameEnd = true;
    return;
  }

  // Focus the main window to ensure key events are captured
  window.focus();

  // Set up event listeners on popup windows to capture events there too
  const setupPopupListeners = (popup) => {
    if (!popup || popup.closed) return;

    popup.addEventListener("keydown", handleKeyDown);
    popup.addEventListener("keyup", handleKeyUp);
    popup.focus();
  };

  setupPopupListeners(p1);
  setupPopupListeners(p2);
  setupPopupListeners(ball);
};

startButton.addEventListener("click", startGame);
