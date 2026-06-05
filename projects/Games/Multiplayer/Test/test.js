import {
  isSupabaseConfigured,
  getSupabaseConfigError,
  loginWithGoogle,
  logout,
  supabase,
} from '../../../Admin/panel-supabase.js';

try {
  const gameArea = document.getElementById("gameArea");
  const ctx = gameArea.getContext("2d");

  gameArea.style.width = "100dvw";
  gameArea.style.height = "100dvh";
  gameArea.width = gameArea.offsetWidth;
  gameArea.height = gameArea.offsetHeight;
} catch (error) {
  document.write("Error initializing game area: " + error);
}

const playButton = document.getElementById("playButton");
playButton.addEventListener("click", function() {
  try {
    playGame();
  } catch (error) {
    document.write(error);
  }
});

function playGame() {
  alert("Hello");
  requestAnimationFrame(playGame);
}
