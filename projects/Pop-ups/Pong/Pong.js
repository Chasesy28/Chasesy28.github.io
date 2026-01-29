const startButton = document.getElementById("startButton");

let p1;
let p2;
let playerWidth = 150;
let playerHeight = 400;
let pSpeed = 5;
let p1y = (screen.height / 2) - (playerHeight / 2);
let p2y = p1y;
const p1Features = `width=${playerWidth},height=${playerHeight},left=${0},top=${p1y},popup=yes`;
const p2Features = `width=${playerWidth},height=${playerHeight},left=${screen.availWidth},top=${p2y},popup=yes`;

//Movement Code
const controller = {
  "ArrowUp":{pressed:false, dir:"up", char:1},
  "ArrowDown":{pressed:false, dir:"down", char:1},
  "W":{pressed:false, dir:"up", char:2}, "w":{pressed:false, dir:"up", char:2},
  "S":{pressed:false, dir:"down", char:2}, "s":{pressed:false, dir:"down", char:2}
};

const playerMovement = () => {
  console.log("playerMovement run");
  Object.keys(controller).forEach(key => {
    if(controller[key].pressed){
      if(controller[key].dir == "down"){
        pSpeed = -pSpeed;
        if(controller[key].char == 1){
          p1.moveBy(0,pSpeed);
        }
        else{
          p2.moveBy(0,pSpeed);
        }
      }
    }
  });
  pSpeed = 5;
};

const resetPlayerValues = () => {
  p1.resizeTo(playerWidth, playerHeight);
  p1.moveTo(0, p1y);
  p2.resizeTo(playerWidth, playerHeight);
  p2.moveTo(screen.availWidth, p2y);
  if (p1 && p2) {
    const closeCheck = setInterval(function () {
      if (p1.closed) {
        p2.close();
        clearInterval(closeCheck);
      }
      else if (p2.closed) {
        p1.close();
        clearInterval(closeCheck);
      }
    }, 500)
  }

  document.addEventListener("keydown", (e) => {
    if(controller[e.key]){
      controller[e.key].pressed = true;
      console.log(`${controller[e.key]} pressed down`);
    }
  });
  document.addEventListener("keyup", (e) => {
    if(controller[e.key]){
      controller[e.key].pressed = false;
      console.log(`${controller[e.key]} released`);
    }
  });
  p1.addEventListener("keydown", (e) => {
    if(controller[e.key]){
      controller[e.key].pressed = true;
      console.log(`${controller[e.key]} pressed down`);
    }
  });
  p1.addEventListener("keyup", (e) => {
    if(controller[e.key]){
      controller[e.key].pressed = false;
      console.log(`${controller[e.key]} released`);
    }
  });
  p2.addEventListener("keydown", (e) => {
    if(controller[e.key]){
      controller[e.key].pressed = true;
      console.log(`${controller[e.key]} pressed down`);
    }
  });
  p2.addEventListener("keyup", (e) => {
    if(controller[e.key]){
      controller[e.key].pressed = false;
      console.log(`${controller[e.key]} released`);
    }
  });
  const moveLoop = setInterval(playerMovement, 500);
};

const startGame = () => {
  if (p1) { p1.close(); }
  p1 = window.open('', 'Player 1', p1Features);
  if (p2) { p2.close(); }
  p2 = window.open('', 'Player 2', p2Features);
  resetPlayerValues();
};

startButton.addEventListener('click', startGame);
