import {
  isSupabaseConfigured,
  getSupabaseConfigError,
  loginWithGoogle,
  logout,
  supabase,
} from '../../../Admin/panel-supabase.js';

const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

//gameArea.style.width = "100dvw";
//gameArea.style.height = "100dvh";
//gameArea.width = gameArea.offsetWidth;
//gameArea.height = gameArea.offsetHeight;


const playButton = document.getElementById("playButton");
playButton.addEventListener("click", function() {
  playGame();
});

function playGame() {
  ctx.fillStyle = "blue";
  ctx.fillRect(50, 50, 100, 100);
}
