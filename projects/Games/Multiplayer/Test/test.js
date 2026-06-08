import {
  isSupabaseConfigured,
  getSupabaseConfigError,
  loginWithGoogle,
  getSession,
  logout,
  supabase,
} from '../../../Admin/panel-supabase.js';

const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;


const playButton = document.getElementById("playButton");
playButton.addEventListener("click", function() {
  if (isSupabaseConfigured()) {
    playGame();
  } else {
    alert("Supabase is not configured: " + getSupabaseConfigError());
  }
});

async function playGame() {
  alert("Starting game...");
}
