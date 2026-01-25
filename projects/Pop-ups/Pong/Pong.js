const startButton = document.getElementById("startButton");

let p1;
let p2;
const playerWidth = 450;
const playerHeight = 50;
let p1x = (screen.width/2) - (playerWidth/2);
let p2x = p1x;
let pSpeed = 5;
const p1Features = `width=${playerWidth},height=${playerHeight},left=${p1x},top=${0},popup=yes`;

const playerMovement = (e) => {
  switch(e.key){
    case "ArrowRight":
      p1.focus();
      p1.moveBy(pSpeed, 0);
      console.log("Right");
      break;
    case "ArrowLeft":
      p1.focus();
      p1.moveBy(-pSpeed, 0);
      console.log("Left");
      break;
  }
  p1x = p1.screenX;
  p1.resizeTo(playerWidth,playerHeight);
}

const startGame = () => {
  p1 = window.open('', 'Player1', p1Features);
  p1.moveTo(p1x,0);
  p1.resizeTo(playerWidth,playerHeight);
  document.removeEventListener('keydown', playerMovement);
  p1.removeEventListener('keydown', playerMovement);
  document.addEventListener('keydown', playerMovement);
  p1.addEventListener('keydown', playerMovement);
};

startButton.addEventListener('click', startGame);
