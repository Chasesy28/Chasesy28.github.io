import {
  isSupabaseConfigured,
  getSupabaseConfigError,
  loginWithGoogle,
  logout,
  supabase,
} from '../../../Admin/panel-supabase.js';

const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

function playGame() {
  alert("Hello");
  requestAnimationFrame(playGame);
}

alert("hello");
