import {
  isSupabaseConfigured,
  getSupabaseConfigError,
  loginWithGoogle,
  logout,
  supabase,
} from '../../../Admin/panel-supabase.js';

alert("Test");

const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;


const playButton = document.getElementById("playButton");
playButton.addEventListener("click", function() {
  playGame();
});

function playGame() {
  if (!isSupabaseConfigured()) {
    alert("Supabase is not configured. Please check the configuration and try again.");
    return;
  }
}
