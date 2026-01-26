const startButton = document.getElementById("startButton");

let p1;
let p2;
const playerWidth = 450;
const playerHeight = 50;
let pSpeed = 5;
let p1x = (screen.width/2) - (playerWidth/2);
let p2x = p1x;
const p1Features = `width=${playerWidth},height=${playerHeight},left=${p1x},top=${0},popup=yes`;
const p2Features = `width=${playerWidth},height=${playerHeight},left=${p2x},top=${screen.availHeight},popup=yes`;

const playerMovement = (e) => {

}

const startGame = () => {
  p1 = window.open('','',p1Features);
};

startButton.addEventListener('click', startGame);
