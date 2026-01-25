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
  switch(e.key){
    case "ArrowRight":
      p1.focus();
      p2.focus();
      p1.moveBy(pSpeed, 0);
    case "ArrowLeft":
      p1.focus();
      p2.focus();
      p1.moveBy(-pSpeed, 0);
    case "D":
    case "d":
      p1.focus();
      p2.focus();
      p2.moveBy(pSpeed, 0);
    case "A":
    case "a":
      p1.focus();
      p2.focus();
      p2.moveBy(-pSpeed, 0);
  }
  p1x = p1.screenX;
  p1.moveTo(p1x, 0);
  p1.resizeTo(playerWidth,playerHeight);
  p2x = p2.screenX;
  p2.moveTo(p2x, screen.availHeight);
  p2.resizeTo(playerWidth,playerHeight);
}

const startGame = () => {
  p1 = window.open('', 'Player1', p1Features);
  p1.moveTo(p1x,0);
  p1.resizeTo(playerWidth,playerHeight);
  p2 = window.open('', 'Player2', p2Features);
  p2.moveTo(p2x,screen.availHeight);
  p2.resizeTo(playerWidth,playerHeight);
  document.removeEventListener('keydown', playerMovement);
  document.addEventListener('keydown', playerMovement);
  p1.removeEventListener('keydown', playerMovement);
  p1.addEventListener('keydown', playerMovement);
  p2.removeEventListener('keydown', playerMovement);
  p2.addEventListener('keydown', playerMovement);
};

startButton.addEventListener('click', startGame);
