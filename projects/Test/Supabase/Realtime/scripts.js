import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://yjxxckovsoyosbzdfxyp.supabase.co";
const SUPABASE_KEY = "sb_publishable__WLTJ9oaxErRvSAwjUVfZg_F6j90iJm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Join a room/topic. Can be anything except for 'realtime'.
const myChannel = supabase.channel("test-channel");

myChannel.subscribe();
myChannel
  .send({
    type: "broadcast",
    event: "join",
    payload: { message: prompt("Enter your name:") },
  });
myChannel.on(
  "broadcast",
  { event: "join" }, // Listen for "shout". Can be "*" to listen to all events
  (payload) => newPlayer(payload),
);

function newPlayer({ payload }) {
  alert(payload.message + " has joined the channel!");
}

// Function to log any messages we receive
function messageReceived({ payload }) {
  alert(payload.message);
}

// Subscribe to the Channel
myChannel
  .on(
    "broadcast",
    { event: "shout" }, // Listen for "shout". Can be "*" to listen to all events
    (payload) => messageReceived(payload),
  )
  .subscribe();

/**
 * Sending a message after subscribing will use WebSockets
 */
myChannel.subscribe((status) => {
  if (status !== "SUBSCRIBED") {
    return null;
  }

  myChannel.send({
    type: "broadcast",
    event: "shout",
    payload: { message: "Hi" },
  });
});

function sendMessage() {
  try {
    alert("Sending message...");
    myChannel.send({
      type: "broadcast",
      event: "shout",
      payload: { message: prompt("Enter your message:") },
    });
  } catch (error) {
    alert("Error sending message:", error);
  }
}

document.getElementById("send").addEventListener("click", sendMessage);
