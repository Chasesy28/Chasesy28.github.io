import {
  isSupabaseConfigured,
  getSupabaseConfigError,
  loginWithGoogle,
  getSession,
  logout,
  supabase,
} from "../../../Admin/panel-supabase.js";

alert("Update3");

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

async function getCurrentUserEmail() {
  const session = getSession();
  const email = session?.email ?? null;
  return email;
}

const playButton = document.getElementById("playButton");
playButton.addEventListener("click", async function () {
  const userLoggedIn = await isUserLoggedIn();
  if (userLoggedIn) {
    playGame();
  } else {
    loginWithGoogle(window.location.pathname);
  }
});

async function getCurrentUser() {
  const email = await getCurrentUserEmail();
  if (!email) return null;

  const { data, error } = await supabase
    .from("multiplayer_test")
    .select("*")
    .eq("player_email", email)
    .maybeSingle();
  if (error) alert("Error fetching user data: " + error.message);
  else if (data == null) {
    const { data: insertData, error: insertError } = await supabase
      .from("multiplayer_test")
      .insert({ player_email: email, x_coordinate: 0, y_coordinate: 0 })
      .select()
      .maybeSingle();
    if (insertError) alert("Error inserting user data: " + insertError.message);
    else return insertData;
  }
  return data;
}

async function playGame() {
  alert("Starting game...");
  getCurrentUser();
}

async function getOtherPlayers() {
  // TODO: Implement this function
}
