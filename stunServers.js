let peerConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

// to get ice candidate, we need to go to the stun servers.
// i'm using free stun servers by google. these stun servers will help resolve how to find
// remote peers over the internet.
//
