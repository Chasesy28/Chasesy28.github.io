const startButton = document.getElementById("startButton");

const controller = {
  W: { pressed: false },
  w: { pressed: false },
  S: { pressed: false },
  s: { pressed: false },
  ArrowUp: { pressed: false },
  ArrowDown: { pressed: false },
};

let gameEnd = true;

let p1;
let p2;
let pWidth = 150;
let pHeight = 400;
let pSpeed = 5;
let p1x = 0;
let p2x = screen.width - pWidth - 8;
let p1y = screen.height / 2 - pHeight / 2;
let p2y = screen.height / 2 - pHeight / 2;

let p1RightEdge = p1x + pWidth;
let p1BottomEdge = p1y + pHeight;

let p2RightEdge = p2x + pWidth;
let p2BottomEdge = p2y + pHeight;

let ball;
let ballWidth = 200;
let ballHeight = 200;
let ballSpeedX;
let ballSpeedY;
let ballX = screen.width / 2 - ballWidth / 2;
let ballY = screen.height / 2 - ballHeight / 2;

let ballRightEdge = ballX + ballWidth;
let ballBottomEdge = ballY + ballHeight;

function update() {
  p1RightEdge = p1x + pWidth;
  p1BottomEdge = p1y + pHeight;
  p2RightEdge = p2x + pWidth;
  p2BottomEdge = p2y + pHeight;
  ballRightEdge = ballX + ballWidth;
  ballBottomEdge = ballY + ballHeight;

  if (!gameEnd) {
    p1.resizeTo(pWidth, pHeight);
    p2.resizeTo(pWidth, pHeight);
    ball.resizeTo(ballWidth, ballHeight);

    if ((controller.W.pressed || controller.w.pressed) && p1y > 0) {
      p1y -= pSpeed;
    }
    if (
      (controller.S.pressed || controller.s.pressed) &&
      p1y < screen.height - pHeight
    ) {
      p1y += pSpeed;
    }
    if (controller.ArrowUp.pressed && p2y > 0) {
      p2y -= pSpeed;
    }
    if (controller.ArrowDown.pressed && p2y < screen.height - pHeight) {
      p2y += pSpeed;
    }

    if (ballRightEdge >= screen.width || ballX <= 0) {
      ballSpeedX = -ballSpeedX;
    }
    if (ballBottomEdge >= screen.height || ballY <= 0) {
      ballSpeedY = -ballSpeedY;
    }

    if (
      ballX <= p1RightEdge&&
      ballX >= p1RightEdge - 10 &&
      ballBottomEdge >= p1y &&
      ballY <= p1BottomEdge
    ) {
      ballSpeedX = -ballSpeedX;
    } else if (
      ballRightEdge >= p2x &&
      ballX <= p2x + 10 &&
      ballBottomEdge >= p2y &&
      ballY <= p2BottomEdge
    ) {
      ballSpeedX = -ballSpeedX;
    }

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    p1.moveTo(p1x, p1y);
    p2.moveTo(p2x, p2y);
    ball.moveTo(ballX, ballY);

    requestAnimationFrame(update);
  } else {
    p1.close();
    p2.close();
    ball.close();
  }
}

const handleKeyDown = (e) => {
  if (controller[e.key]) {
    controller[e.key].pressed = true;
  } else if (e.key == "Escape") {
    gameEnd = true;
  }
};

const handleKeyUp = (e) => {
  if (controller[e.key]) {
    controller[e.key].pressed = false;
  }
};

const attachKeyboardListeners = (win) => {
  win.document.addEventListener("keydown", handleKeyDown);
  win.document.addEventListener("keyup", handleKeyUp);
};

function startGame() {
  gameEnd = true;
  gameEnd = false;

  p1y = screen.height / 2 - pHeight / 2;
  p2y = screen.height / 2 - pHeight / 2;
  ballX = screen.width / 2 - ballWidth / 2;
  ballY = screen.height / 2 - ballHeight / 2;

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
  if (p2) {
    p2.close();
  }
  if (ball) {
    ball.close();
  }

  p1 = window.open(
    "",
    "Player 1",
    `width=${pWidth},height=${pHeight},left=${p1x},top=${p1y}`,
  );
  p2 = window.open(
    "",
    "Player 2",
    `width=${pWidth},height=${pHeight},left=${p2x},top=${p2y}`,
  );
  ball = window.open(
    "",
    "Ball",
    `width=${ballWidth},height=${ballHeight},left=${ballX},top=${ballY}`,
  );

  attachKeyboardListeners(window);
  attachKeyboardListeners(p1);
  attachKeyboardListeners(p2);
  attachKeyboardListeners(ball);

  update();

  if (p1 && p2 && ball) {
    const closeCheck = setInterval(function () {
      if (p1.closed) {
        gameEnd = true;
        clearInterval(closeCheck);
      } else if (p2.closed) {
        gameEnd = true;
        clearInterval(closeCheck);
      } else if (ball.closed) {
        gameEnd = true;
        clearInterval(closeCheck);
      }
    }, 500);
  } else {
    alert("Pop-up blocker is enabled! Please allow pop-ups for this website.");
    gameEnd = true;
  }
}

startButton.addEventListener("click", startGame);
