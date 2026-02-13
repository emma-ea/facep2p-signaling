const fs = require("fs");
const https = require("https");
const express = require("express");
const socketio = require("socket.io");

const key = fs.readFileSync("cert.key");
const cert = fs.readFileSync("cert.crt");

const app = express();
app.use(express.static(__dirname));

const expressServer = https.createServer({ key, cert }, app);
const io = socketio(expressServer);

expressServer.listen(3001);

const offers = [
  // offererUsername,
  // offer,
  // offererIceCandidates,
  // answerer
  // answererOffer,
  // answererIceCandidates
];

const connectedSockets = [
  // username, socketid
];

io.on("connection", (socket) => {
  console.log("client connected");

  const username = socket.handshake.auth.username;
  const password = socket.handshake.auth.password;

  if (password !== "x") {
    socket.disconnect(true);
    return;
  }

  connectedSockets.push({
    socketId: socket.id,
    username: username,
  });

  if (offers.length) {
    socket.emit("available-offers", offers);
  }

  socket.on("new-offer", (newOffer, callback) => {
    console.log("receiving new offer");
    // console.log(newOffer);
    offers.push({
      offererUsername: username,
      offer: newOffer,
      offererIceCandidates: [],
      answererUsername: null,
      answer: null,
      answererIceCandidates: [],
    });

    console.log(`offers: ${offers.length}`);

    // broadcast
    socket.broadcast.emit("new-offer-awaiting", offers.slice(-1));
  });

  socket.on("new-ice-candidates", (ice, callback) => {
    const { iceCandidate, iceUsername, didIOffer } = ice;
    if (didIOffer) {
      const foundOffer = offers.find(
        (of) => of.offererUsername === iceUsername,
      );
      foundOffer.offererIceCandidates.push(iceCandidate);
    }
  });

  socket.on("push-answerer-offer", (offer, callback) => {
    // const { answerOffer, answererUsername, username } = offer;
    // const foundOffer = offers.find((of) => of.offererUsername === username);
    // foundOffer.answererUsername = answererUsername;
    // foundOffer.answer = answerOffer;
    console.log("found offer", JSON.stringify(offer));
  });
});
