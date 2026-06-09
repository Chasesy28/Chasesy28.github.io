import {
  isSupabaseConfigured,
  getSupabaseConfigError,
  loginWithGoogle,
  getSession,
  logout,
  supabase,
} from "../../../Admin/panel-supabase.js";

alert("Update");

const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

async function isUserLoggedIn() {
  if (!supabase) return;

  const { data, error } = await supabase.auth.getSession();
  if (error) return;

  const session = data?.session ?? null;

  const isSignedIn = Boolean(session?.user?.email);
  return isSignedIn;
}

const playButton = document.getElementById("playButton");
playButton.addEventListener("click", async function () {
  const userLoggedIn = await isUserLoggedIn();
  if (userLoggedIn) {
    playGame();
  } else {
    loginWithGoogle();
  }
});

async function playGame() {
  alert("Starting game...");
}
