const startButton = document.getElementById("startButton");

let p1;
let p2;
const playerWidth = 450;
const playerHeight = 50;
let p1x = (screen.width/2) - (playerWidth/2);
let p2x = p1x;
let pSpeed = 2;
const p1Features = `width=${playerWidth},height=${playerHeight},left=${p1x},top=${0},popup=yes`;

const startGame = () => {
  p1 = window.open('', 'Player1', p1Features);
  p1.moveTo(p1x,0);
  p1.resizeTo(playerWidth,playerHeight);
};

startButton.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
  switch(e.key){
    case "ArrowRight":
      p1.moveBy(pSpeed, 0);
      console.log("Right");
      break;
    case "ArrowLeft":
      p1.moveBy(-pSpeed, 0);
      console.log("Left");
      break;
  }
});
