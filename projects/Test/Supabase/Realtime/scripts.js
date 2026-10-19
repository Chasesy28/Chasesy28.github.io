import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yjxxckovsoyosbzdfxyp.supabase.co";
const SUPABASE_KEY = "sb_publishable__WLTJ9oaxErRvSAwjUVfZg_F6j90iJm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Join a room/topic. Can be anything except for 'realtime'.
const myChannel = supabase.channel('test-channel')

// Function to log any messages we receive
function messageReceived(payload) {
  alert(payload)
}

// Subscribe to the Channel
myChannel
  .on(
    'broadcast',
    { event: 'shout' }, // Listen for "shout". Can be "*" to listen to all events
    (payload) => messageReceived(payload)
  )
  .subscribe()

/**
* Sending a message after subscribing will use WebSockets
*/
myChannel.subscribe((status) => {
  if (status !== 'SUBSCRIBED') {
    return null
  }

  myChannel.send({
    type: 'broadcast',
    event: 'shout',
    payload: { message: 'Hi' },
  })
})

function sendMessage() {
  alert('Sending message...')
  myChannel.send({
    type: 'broadcast',
    event: 'shout',
    payload: { message: 'Hi' },
  })
}
