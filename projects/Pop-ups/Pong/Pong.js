const startButton = document.getElementById("startButton");

let p1;
let p2;
let pWidth = 150;
let pHeight = 400;
let pSpeed = 5;
let p1y = screen.height / 2 - pHeight / 2;
let p2y = p1y;
const p1Features = `width=${pWidth},height=${pHeight},left=${0},top=${p1y},popup=yes`;
const p2Features = `width=${pWidth},height=${pHeight},left=${screen.width - pWidth - 20},top=${p2y},popup=yes`;

const controller = {
  W: { pressed: false, dir: "up", char: 1 },
  w: { pressed: false, dir: "up", char: 1 },
  S: { pressed: false, dir: "down", char: 1 },
  s: { pressed: false, dir: "down", char: 1 },
  ArrowUp: { pressed: false, dir: "up", char: 2 },
  ArrowDown: { pressed: false, dir: "down", char: 2 },
};

function updatePlayerValues() {
  function pMovementCalc() {
    console.log("Player Movement Calculator");
    Object.keys(controller).forEach((key) => {
      pSpeed = 5;
      if (controller[key].dir == "down") {
        pSpeed = -pSpeed;
      }
      if (controller[key].char == 1) {
        console.log(`p1y before: ${p1y}`);
        p1y += pSpeed;
        console.log(`p1y after: ${p1y}`);
      } else {
        console.log(`p2y before: ${p2y}`);
        p2y += pSpeed;
        console.log(`p2y after: ${p2y}`);
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
    p2.moveTo(screen.width - pWidth - 20, p2y);
    p1.resizeTo(pWidth, pHeight);
    p2.resizeTo(pWidth, pHeight);
    p1.focus();
    p2.focus();

    requestAnimationFrame(pMove);
  }

  pMove();
}

const startGame = () => {
  if (p1) {
    p1.close();
  }
  p1 = window.open("", "Player 1", p1Features);
  if (p2) {
    p2.close();
  }
  p2 = window.open("", "Player 2", p2Features);
  if (p1 && p2) {
    updatePlayerValues();
    const closeCheck = setInterval(function () {
      if (p1.closed) {
        p2.close();
        clearInterval(closeCheck);
      } else if (p2.closed) {
        p1.close();
        clearInterval(closeCheck);
      }
    }, 500);
  } else {
    alert("Popup Windows are Blocked!");
  }

  document.addEventListener("keydown", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = true;
      console.log(`${controller[e.key]} pressed down`);
    }
  });
  document.addEventListener("keyup", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = false;
      console.log(`${controller[e.key]} released`);
    }
  });
  p1.addEventListener("keydown", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = true;
      console.log(`${controller[e.key]} pressed down`);
    }
  });
  p1.addEventListener("keyup", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = false;
      console.log(`${controller[e.key]} released`);
    }
  });
  p2.addEventListener("keydown", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = true;
      console.log(`${controller[e.key]} pressed down`);
    }
  });
  p2.addEventListener("keyup", (e) => {
    if (controller[e.key]) {
      controller[e.key].pressed = false;
      console.log(`${controller[e.key]} released`);
    }
  });
};

startButton.addEventListener("click", startGame);
