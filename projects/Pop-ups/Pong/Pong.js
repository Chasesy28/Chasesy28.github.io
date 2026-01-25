const startButton = document.getElementById("startButton");

const startGame = () => {
  const playerWidth = 450;
  const playerHeight = 50;

  let p1x = (screen.width/2) - (playerWidth/2);
  let p2x = p1x;

  const p1Features = `width=${playerWidth},height=${playerHeight},left=${p1x},top=${0},popup=yes`;

  const p1 = window.open('', 'Player1', p1Features);
  p1.moveTo(p1x, 0);
};

startButton.addEventListener('click', startGame);
