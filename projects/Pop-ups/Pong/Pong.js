const startButton = document.getElementById("startButton");

let gameEnd = false;

let p1;
let p2;
let pWidth = 150;
let pHeight = 400;
let p1Speed = 5;
let p2Speed = 5;
let p1y = 0;
let p2y = 0;

let ball;
let ballWidth = 100;
let ballHeight = 75;
let ballSpeedX;
let ballSpeedY;
let ballX = 0;
let ballY = 0;

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const getScreenBounds = () => {
  const screenRef = window.screen;
  const left = Number.isFinite(screenRef.availLeft) ? screenRef.availLeft : 0;
  const top = Number.isFinite(screenRef.availTop) ? screenRef.availTop : 0;
  const width = screenRef.availWidth || screenRef.width;
  const height = screenRef.availHeight || screenRef.height;
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
};

const buildFeatures = (width, height, left, top) =>
  `width=${Math.round(width)},height=${Math.round(height)},left=${Math.round(left)},top=${Math.round(top)},popup=yes`;

const controller = {
  W: { pressed: false, dir: "up", char: 1 },
  w: { pressed: false, dir: "up", char: 1 },
  S: { pressed: false, dir: "down", char: 1 },
  s: { pressed: false, dir: "down", char: 1 },
  ArrowUp: { pressed: false, dir: "up", char: 2 },
  ArrowDown: { pressed: false, dir: "down", char: 2 },
};

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
        p1y += p1Speed;
      } else {
        p2y += p2Speed;
      }
    }
  }

  function pMove() {
    const bounds = getScreenBounds();
    const p1Width = p1?.outerWidth || pWidth;
    const p2Width = p2?.outerWidth || pWidth;

    Object.keys(controller).forEach((key) => {
      if (controller[key].pressed) {
        pMovementCalc(key);
      }
    });
    p1y = clamp(p1y, bounds.top, bounds.bottom - pHeight);
    p2y = clamp(p2y, bounds.top, bounds.bottom - pHeight);
    p1.moveTo(bounds.left, p1y);
    p2.moveTo(bounds.right - p2Width, p2y);

    if (!gameEnd) {
      requestAnimationFrame(pMove);
    }
  }

  pMove();

  function ballMove() {
    const bounds = getScreenBounds();
    const p1Width = p1?.outerWidth || pWidth;
    const p2Width = p2?.outerWidth || pWidth;

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballX + ballWidth >= bounds.right || ballX <= bounds.left) {
      ballSpeedX = -ballSpeedX;
    }
    if (ballY + ballHeight >= bounds.bottom || ballY <= bounds.top) {
      ballSpeedY = -ballSpeedY;
    }

    if (
      ballX <= bounds.left + p1Width &&
      ballY + ballHeight >= p1y &&
      ballY <= p1y + pHeight
    ) {
      ballSpeedX = -ballSpeedX;
    }
    if (
      ballX + ballWidth >= bounds.right - p2Width &&
      ballY + ballHeight >= p2y &&
      ballY <= p2y + pHeight
    ) {
      ballSpeedX = -ballSpeedX;
    }

    ballX = clamp(ballX, bounds.left, bounds.right - ballWidth);
    ballY = clamp(ballY, bounds.top, bounds.bottom - ballHeight);

    try {
      ball.moveTo(ballX, ballY);
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

  const bounds = getScreenBounds();

  p1y = bounds.top + bounds.height / 2 - pHeight / 2;
  p2y = p1y;
  ballX = bounds.left + bounds.width / 2 - ballWidth / 2;
  ballY = bounds.top + bounds.height / 2 - ballHeight / 2;
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

  if (p1) {
    p1.close();
  }
  p1 = window.open(
    "",
    "Player 1",
    buildFeatures(pWidth, pHeight, bounds.left, p1y),
  );
  if (p2) {
    p2.close();
  }
  p2 = window.open(
    "",
    "Player 2",
    buildFeatures(pWidth, pHeight, bounds.right - pWidth, p2y),
  );
  if (ball) {
    ball.close();
  }
  ball = window.open(
    "",
    "Ball",
    buildFeatures(ballWidth, ballHeight, ballX, ballY),
  );
  if (p1 && p2 && ball) {
    p1.resizeTo(pWidth, pHeight);
    p2.resizeTo(pWidth, pHeight);
    ball.resizeTo(ballWidth, ballHeight);
    ballWidth = ball.outerWidth || ballWidth;
    ballHeight = ball.outerHeight || ballHeight;
    updateValues();
    const closeCheck = setInterval(function () {
      if (p1.closed) {
        p2.close();
        ball.close();
        gameEnd = true;
        clearInterval(closeCheck);
      } else if (p2.closed) {
        p1.close();
        ball.close();
        gameEnd = true;
        clearInterval(closeCheck);
      } else if (ball.closed) {
        p1.close();
        p2.close();
        gameEnd = true;
        clearInterval(closeCheck);
      }
    }, 500);
  } else {
    alert("Popup Windows are Blocked!");
    gameEnd = true;
  }

  attachKeyboardListeners();
  attachPopupListeners(p1);
  attachPopupListeners(p2);
  attachPopupListeners(ball);
};

startButton.addEventListener("click", startGame);

const handleKeyDown = (e) => {
  if (controller[e.key]) {
    controller[e.key].pressed = true;
  } else if (e.key == "Escape") {
    p1?.close();
  }
};

const handleKeyUp = (e) => {
  if (controller[e.key]) {
    controller[e.key].pressed = false;
  }
};

let listenersAttached = false;

const attachKeyboardListeners = () => {
  if (listenersAttached) {
    return;
  }
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  listenersAttached = true;
};

const attachPopupListeners = (win) => {
  if (!win) {
    return;
  }
  win.addEventListener("keydown", handleKeyDown);
  win.addEventListener("keyup", handleKeyUp);
};
