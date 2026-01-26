const startButton = document.getElementById("startButton");

let p1;
let p2;
const playerWidth = 50;
const playerHeight = 450;
let pSpeed = 5;
let p1y = (screen.width/2) - (playerWidth/2);
let p2y = p1y;
const p1Features = `width=${playerWidth},height=${playerHeight},left=${0},top=${p1y},popup=yes`;
const p2Features = `width=${playerWidth},height=${playerHeight},left=${screen.availWidth},top=${p2y},popup=yes`;

const playerMovement = (e) => {

}

const startGame = () => {
  p1 = window.open('','',p1Features);
  p1.resizeTo(playerWidth,playerHeight);
  p1.moveTo(0,p1y);
};

startButton.addEventListener('click', startGame);
