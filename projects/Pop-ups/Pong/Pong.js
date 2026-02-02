const startButton = document.getElementById("startButton");

let gameEnd = false;

let p1;
let p2;
let pWidth = 150;
let pHeight = 400;
let p1Speed = 5;
let p2Speed = 5;
let p1y = screen.availHeight / 2 - pHeight / 2;
let p2y = p1y;
const p1Features = `width=${pWidth},height=${pHeight},left=${0},top=${p1y},popup=yes`;
const p2Features = `width=${pWidth},height=${pHeight},left=${screen.availWidth - pWidth},top=${p2y},popup=yes`;

let ball;
let ballWidth = 100;
let ballHeight = 50;
let ballSpeedX = 10;
let ballSpeedY = 10;
let ballX = screen.availWidth / 2 - ballWidth / 2;
let ballY = screen.availHeight / 2 - ballHeight / 2;
const ballFeatures = `width=${ballWidth},height=${ballHeight},left=${ballX},top=${ballY},popup=yes`;

const controller = {
  W: { pressed: false, dir: "up", char: 1 },
  w: { pressed: false, dir: "up", char: 1 },
  S: { pressed: false, dir: "down", char: 1 },
  s: { pressed: false, dir: "down", char: 1 },
  ArrowUp: { pressed: false, dir: "up", char: 2 },
  ArrowDown: { pressed: false, dir: "down", char: 2 },
};

function updateValues() {
  function pMovementCalc() {
    Object.keys(controller).forEach((key) => {
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
    });
  }

  function pMove() {
    Object.keys(controller).forEach((key) => {
      if (controller[key].pressed) {
        pMovementCalc();
      }
    });
    p1.moveTo(0, p1y);
    p2.moveTo(screen.availWidth - pWidth, p2y);
    p1.resizeTo(pWidth, pHeight);
    p2.resizeTo(pWidth, pHeight);
    p1.focus();
    p2.focus();

    if (!gameEnd) {
      requestAnimationFrame(pMove);
    }
  }

  pMove();

  function ballMove() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballX + ballWidth >= screen.availWidth || ballX <= 0) {
      ballSpeedX = -ballSpeedX;
    }
    if (ballY + ballHeight >= screen.availHeight || ballY <= 0) {
      ballSpeedY = -ballSpeedY;
    }

    ballX = Math.max(0, Math.min(ballX, screen.availWidth - ballWidth));
    ballY = Math.max(0, Math.min(ballY, screen.availHeight - ballHeight));

    try {
      ball.MoveTo(ballX, ballY);
      ball.resizeTo(ballWidth, ballHeight);
      ball.focus();
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
  gameEnd = false;
  p1y = screen.availHeight / 2 - pHeight / 2;
  p2y = p1y;
  if (p1) {
    p1.close();
  }
  p1 = window.open("", "Player 1", p1Features);
  if (p2) {
    p2.close();
  }
  p2 = window.open("", "Player 2", p2Features);
  if (ball) {
    ball.close();
  }
  ball = window.open("", "Ball", ballFeatures);
  if (p1 && p2 && ball) {
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
  }

  document.addEventListener("keydown", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = true;
    }
  });
  document.addEventListener("keyup", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = false;
    }
  });
  p1.addEventListener("keydown", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = true;
    }
  });
  p1.addEventListener("keyup", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = false;
    }
  });
  p2.addEventListener("keydown", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = true;
    }
  });
  p2.addEventListener("keyup", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = false;
    }
  });
  ball.addEventListener("keydown", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = true;
    }
  });
  ball.addEventListener("keyup", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = false;
    }
  });
};

startButton.addEventListener("click", startGame);
