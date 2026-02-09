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
let ballHeight = 100;
let ballSpeedX;
let ballSpeedY;
let ballX = 0;
let ballY = 0;
let ballSizeLogged = false;

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
const sizeMatches = (value, target, tolerance = 2) =>
  Math.abs(value - target) <= tolerance;

const edgeOffsets = {
  left: 0,
  right: 0,
  top: 0,
};

const POSITION_RIGHT_GUARD = 20;
const COLLISION_RIGHT_INSET = 45;

const ensureSize = (win, width, height) => {
  if (!win) {
    return { width, height };
  }
  const targetWidth = Math.round(width);
  const targetHeight = Math.round(height);
  let nextWidth = targetWidth;
  let nextHeight = targetHeight;
  let actualWidth = win.outerWidth || targetWidth;
  let actualHeight = win.outerHeight || targetHeight;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    win.resizeTo(nextWidth, nextHeight);
    actualWidth = win.outerWidth || actualWidth;
    actualHeight = win.outerHeight || actualHeight;
    if (
      sizeMatches(actualWidth, targetWidth) &&
      sizeMatches(actualHeight, targetHeight)
    ) {
      break;
    }
    nextWidth += targetWidth - actualWidth;
    nextHeight += targetHeight - actualHeight;
  }
  return { width: actualWidth, height: actualHeight };
};

const getScreenBounds = () => {
  const screenRef = window.screen;
  const left = Number.isFinite(screenRef.availLeft)
    ? screenRef.availLeft
    : Number.isFinite(screenRef.left)
      ? screenRef.left
      : 0;
  const top = Number.isFinite(screenRef.availTop)
    ? screenRef.availTop
    : Number.isFinite(screenRef.top)
      ? screenRef.top
      : 0;
  const width = Number.isFinite(screenRef.availWidth)
    ? screenRef.availWidth
    : screenRef.width;
  const height = Number.isFinite(screenRef.availHeight)
    ? screenRef.availHeight
    : screenRef.height;
  return {
    left,
    top,
    width: width || 0,
    height: height || 0,
    right: left + width,
    bottom: top + height,
  };
};

const getPlayBounds = () => {
  const bounds = getScreenBounds();
  const left = bounds.left + edgeOffsets.left;
  const right = bounds.right - edgeOffsets.right - POSITION_RIGHT_GUARD;
  const top = bounds.top + edgeOffsets.top;
  const bottom = bounds.bottom;
  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
  };
};

const calibrateEdgeOffsets = () => {
  const bounds = getScreenBounds();
  if (p1) {
    edgeOffsets.left = p1.screenX - bounds.left;
    edgeOffsets.top = p1.screenY - p1y;
  }
  if (p2) {
    edgeOffsets.right = Math.max(
      0,
      p2.screenX + p2.outerWidth - (bounds.right - POSITION_RIGHT_GUARD),
    );
  }
};

const settleRightEdge = (p2Width, p2y) => {
  if (!p2 || p2.closed) {
    return;
  }
  const screenBounds = getScreenBounds();
  const screenRight = screenBounds.right - POSITION_RIGHT_GUARD;
  let logged = false;
  for (let i = 0; i < 3; i += 1) {
    const bounds = getPlayBounds();
    p2.moveTo(bounds.right - p2Width, p2y);
    const overflow = p2.screenX + p2Width - screenRight;
    if (!logged) {
      /*console.log("P2 debug", {
        screenRight,
        screenAvailWidth: window.screen.availWidth,
        screenLeft: screenBounds.left,
        p2ScreenX: p2.screenX,
        p2OuterWidth: p2Width,
        boundsRight: bounds.right,
        overflow,
      });*/
      logged = true;
    }
    if (overflow <= 1) {
      break;
    }
    edgeOffsets.right += overflow;
  }
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
    const bounds = getPlayBounds();
    const p1Size = ensureSize(p1, pWidth, pHeight);
    const p2Size = ensureSize(p2, pWidth, pHeight);
    const p1Width = p1Size.width;
    const p2Width = p2Size.width;
    const p1Height = p1Size.height;
    const p2Height = p2Size.height;

    Object.keys(controller).forEach((key) => {
      if (controller[key].pressed) {
        pMovementCalc(key);
      }
    });
    p1y = clamp(p1y, bounds.top, bounds.bottom - p1Height);
    p2y = clamp(p2y, bounds.top, bounds.bottom - p2Height);
    p1.moveTo(bounds.left, p1y);
    p2.moveTo(bounds.right - p2Width, p2y);
    settleRightEdge(p2Width, p2y);

    if (!gameEnd) {
      requestAnimationFrame(pMove);
    }
  }

  pMove();

  function ballMove() {
    const bounds = getPlayBounds();
    const p1Size = ensureSize(p1, pWidth, pHeight);
    const p2Size = ensureSize(p2, pWidth, pHeight);
    const ballSize = ensureSize(ball, ballWidth, ballHeight);
    if (ballSize.width !== ballWidth || ballSize.height !== ballHeight) {
      if (!ballSizeLogged) {
        console.log("Ball size", {
          targetWidth: ballWidth,
          targetHeight: ballHeight,
          actualWidth: ballSize.width,
          actualHeight: ballSize.height,
        });
        ballSizeLogged = true;
      }
      ballX -= (ballSize.width - ballWidth) / 2;
      ballY -= (ballSize.height - ballHeight) / 2;
      ballWidth = ballSize.width;
      ballHeight = ballSize.height;
    }
    const p1Width = p1Size.width;
    const p2Width = p2Size.width;
    const p1Height = p1Size.height;
    const p2Height = p2Size.height;
    const p1X = p1?.screenX ?? bounds.left;
    const p2X = p2?.screenX ?? bounds.right - p2Width;
    const leftWall = p1X;
    const p2FrameX = p2?.innerWidth
      ? Math.max(0, (p2Width - p2.innerWidth) / 2)
      : 0;
    const rightInset = Math.max(COLLISION_RIGHT_INSET, p2FrameX);
    const rightWall = p2X + p2Width - rightInset;
    let loggedRightCollision = false;

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballX + ballWidth >= rightWall || ballX <= leftWall) {
      ballSpeedX = -ballSpeedX;
    }
    if (ballY + ballHeight >= bounds.bottom || ballY <= bounds.top) {
      ballSpeedY = -ballSpeedY;
    }

    if (
      ballX <= p1X + p1Width &&
      ballY + ballHeight >= p1y &&
      ballY <= p1y + p1Height
    ) {
      ballSpeedX = -ballSpeedX;
    }
    if (
      ballX + ballWidth >= p2X - rightInset &&
      ballY + ballHeight >= p2y &&
      ballY <= p2y + p2Height
    ) {
      if (!loggedRightCollision) {
        /*console.log("Right collision", {
          p2OuterWidth: p2Width,
          p2InnerWidth: p2?.innerWidth,
          p2FrameX,
          rightInset,
          p2X,
          rightWall,
          ballRight: ballX + ballWidth,
        });*/
        loggedRightCollision = true;
      }
      ballSpeedX = -ballSpeedX;
    }

    ballX = clamp(ballX, leftWall, rightWall - ballWidth);
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

  const bounds = getPlayBounds();

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
    const p1Size = ensureSize(p1, pWidth, pHeight);
    const p2Size = ensureSize(p2, pWidth, pHeight);
    const ballSize = ensureSize(ball, ballWidth, ballHeight);
    pWidth = p1Size.width;
    pHeight = p1Size.height;
    ballWidth = ballSize.width;
    ballHeight = ballSize.height;
    ballX = bounds.left + bounds.width / 2 - ballWidth / 2;
    ballY = bounds.top + bounds.height / 2 - ballHeight / 2;
    try {
      ball.moveTo(ballX, ballY);
    } catch (error) {
      console.error(error);
    }
    setTimeout(() => {
      const p1Size = ensureSize(p1, pWidth, pHeight);
      const p2Size = ensureSize(p2, pWidth, pHeight);
      const ballSize = ensureSize(ball, ballWidth, ballHeight);
      pWidth = p1Size.width;
      pHeight = p1Size.height;
      ballWidth = ballSize.width;
      ballHeight = ballSize.height;
      calibrateEdgeOffsets();
      const adjustedBounds = getPlayBounds();
      const p1Width = p1Size.width;
      const p2Width = p2Size.width;
      p1y = adjustedBounds.top + adjustedBounds.height / 2 - p1Size.height / 2;
      p2y = p1y;
      ballX = adjustedBounds.left + adjustedBounds.width / 2 - ballWidth / 2;
      ballY = adjustedBounds.top + adjustedBounds.height / 2 - ballHeight / 2;
      try {
        p1.moveTo(adjustedBounds.left, p1y);
        p2.moveTo(adjustedBounds.right - p2Width, p2y);
        settleRightEdge(p2Width, p2y);
        ball.moveTo(ballX, ballY);
      } catch (error) {
        console.error(error);
      }
    }, 100);
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
