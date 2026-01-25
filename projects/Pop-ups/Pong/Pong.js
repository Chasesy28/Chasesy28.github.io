const startButton = document.getElementById("startButton");

const startGame = () => {
  const playerWidth = 450;
  const playerHeight = 150;

  let p1x = (screen.width/2) - (playerWidth/2);
  let p2x = p1x;

  const p1Features = `width=${playerWidth},height=${playerHeight},left=${p1x},top=${0},popup=yes`;

  const p1 = window.open('', 'Player1', p1Features);
};

startButton.addEventListener('click', startGame);
