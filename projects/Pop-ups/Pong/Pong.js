const startButton = document.getElementById("startButton");

let p1;
let p2;
const playerWidth = 150;
const playerHeight = 400;
let pSpeed = 5;
let p1y = (screen.height/2) - (playerHeight/2);
let p2y = p1y;
const p1Features = `width=${playerWidth},height=${playerHeight},left=${0},top=${p1y},popup=yes`;
const p2Features = `width=${playerWidth},height=${playerHeight},left=${screen.availWidth},top=${p2y},popup=yes`;

const resetPlayerValues = () => {
  p1.resizeTo(playerWidth,playerHeight);
  p1.moveTo(0,p1y);
  p2.resizeTo(playerWidth,playerHeight);
  p2.moveTo(0,p2y);
};

const playerMovement = (e) => {

};

const startGame = () => {
  if(p1){p1.close();}
  p1 = window.open('','Player 1',p1Features);
  if(p2){p2.close();}
  p2 = window.open('','Player 2',p2Features);
  resetPlayerValues();
};

startButton.addEventListener('click', startGame);
