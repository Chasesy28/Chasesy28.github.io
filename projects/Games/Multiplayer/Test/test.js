import {
  isSupabaseConfigured,
  getSupabaseConfigError,
  loginWithGoogle,
  getSession,
  logout,
  supabase,
} from "../../../Admin/panel-supabase.js";

const gameArea = document.getElementById("gameArea");
const ctx = gameArea.getContext("2d");

gameArea.style.width = "100dvw";
gameArea.style.height = "100dvh";
gameArea.width = gameArea.offsetWidth;
gameArea.height = gameArea.offsetHeight;

let playerX;
let playerY;
let otherPlayerPositions = [];

const controller = {
  left: { pressed: false, key: ["a", "A", "ArrowLeft"] },
  right: { pressed: false, key: ["d", "D", "ArrowRight"] },
  up: { pressed: false, key: ["w", "W", "ArrowUp"] },
  down: { pressed: false, key: ["s", "S", "ArrowDown"] },
};

window.document.addEventListener("keydown", function (e) {
  for (const controllerKey in controller) {
    if (controller[controllerKey].key.includes(e.key)) {
      controller[controllerKey].pressed = true;
    }
  }
});

window.document.addEventListener("keyup", function (e) {
  for (const controllerKey in controller) {
    if (controller[controllerKey].key.includes(e.key)) {
      controller[controllerKey].pressed = false;
    }
  }
});

async function isUserLoggedIn() {
  if (!supabase) return;

  const { data, error } = await supabase.auth.getSession();
  if (error) return;

  const session = data?.session ?? null;

  const isSignedIn = Boolean(session?.user?.email);
  return isSignedIn;
}

async function getCurrentUserEmail() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session?.user?.email ?? null;
}

let presenceChannel = null;

async function setupPresence() {
  const email = await getCurrentUserEmail();
  if (!email) return;

  const presenceKey = `user:${email}`;

  presenceChannel = supabase.channel("multiplayer_test:room_1", {
    config: {
      presence: { key: presenceKey },
    },
  });

  presenceChannel
    .on("presence", { event: "sync" }, () => {
      // presenceChannel.presenceState() is the source of truth for who is online
      console.log("presence sync", presenceChannel.presenceState());
    })
    .on("presence", { event: "leave" }, ({ leftPresences }) => {
      console.log("presence leave", leftPresences);
    })
    .on("presence", { event: "join" }, ({ newPresences }) => {
      console.log("presence join", newPresences);
    });

  await presenceChannel.subscribe(async (status) => {
    if (status !== "SUBSCRIBED") return;

    await presenceChannel.track({
      online: true,
      online_at: new Date().toISOString(),
    });
  });
}

async function teardownPresence() {
  if (!presenceChannel) return;
  try {
    await presenceChannel.untrack();
  } catch (error) {
    console.error("Error occurred while untracking presence:", error);
  } finally {
    supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
}

window.addEventListener("pagehide", () => teardownPresence());
window.addEventListener("beforeunload", () => teardownPresence());

async function getCurrentUser() {
  const email = await getCurrentUserEmail();
  if (!email) {
    alert("No email in Supabase session (cannot insert).");
    return null;
  }

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

async function getOtherPlayers() {
  const email = await getCurrentUserEmail();

  const { data, error } = await supabase
    .from("multiplayer_test")
    .select("*")
    .neq("player_email", email);
  if (error) {
    alert("Error fetching other players: " + error.message);
    return [];
  }
  return data || [];
}

async function updateOtherPlayers() {
  // 1) Get current online set from Presence
  const state = presenceChannel?.presenceState?.() ?? {};
  const onlineEmails = new Set(
    Object.keys(state)
      .filter((presenceKey) => presenceKey.startsWith("user:"))
      .map((presenceKey) => presenceKey.slice("user:".length))
  );

  // 2) Fetch positions from DB (for all other users)
  const otherPlayers = await getOtherPlayers();

  // 3) Keep only those whose email is currently present
  otherPlayerPositions = otherPlayers
    .filter((player) => onlineEmails.has(player.player_email))
    .map((player) => ({
      email: player.player_email,
      x: Number(player.x_coordinate),
      y: Number(player.y_coordinate),
    }));
}

async function updateOwnPosition(x, y) {
  const email = await getCurrentUserEmail();

  const { data, error } = await supabase
    .from("multiplayer_test")
    .update({ x_coordinate: x, y_coordinate: y })
    .eq("player_email", email)
    .select();

  if (error) alert("Error updating positions: " + error.message);
  else console.log("updated rows:", data?.length ?? 0);
}

const backgroundColor = (ctx, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, gameArea.width, gameArea.height);
};

function gameLoop() {
  backgroundColor(ctx, "lightblue");

  // Draw other players
  otherPlayerPositions.forEach((player) => {
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, 20, 20);
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";       // horizontal centering
    ctx.textBaseline = "alphabetic"; // default-ish baseline; keeps vertical behavior consistent
    ctx.fillText(player.email, player.x + 10, player.y - 5); // y stays as the same point you were using
  });

  // Draw own player
  if (playerX !== undefined && playerY !== undefined) {
    if (controller.left.pressed) playerX -= 5;
    if (controller.right.pressed) playerX += 5;
    if (controller.up.pressed) playerY -= 5;
    if (controller.down.pressed) playerY += 5;
    ctx.fillStyle = "green";
    ctx.fillRect(playerX, playerY, 20, 20);
  }

  requestAnimationFrame(gameLoop);
}

async function playGame() {
  setInterval(() => updateOwnPosition(playerX, playerY), 10);
  setInterval(updateOtherPlayers, 10); // Update other players every second
  document.getElementById("playButton").style.display = "none";
  requestAnimationFrame(gameLoop);
}

const playButton = document.getElementById("playButton");
playButton.addEventListener("click", async function () {
  const userLoggedIn = await isUserLoggedIn();
  if (userLoggedIn) {
    const user = await getCurrentUser();
    playerX = user.x_coordinate;
    playerY = user.y_coordinate;
    await updateOtherPlayers();
    await setupPresence();
    await playGame();
  } else {
    loginWithGoogle(window.location.pathname);
  }
});
