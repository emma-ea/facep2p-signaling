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

  // send ice candidate to signaling server
  socket.on("new-ice-candidates", (ice, callback) => {
    const { iceCandidate, iceUsername, didIOffer } = ice;
    // this ice is coming from offerer, send to answerer
    // todo: check
    if (didIOffer) {
      console.log("----------- didIOffer offer ----------");
      const foundOffer = offers.find(
        (of) => of.offererUsername === iceUsername,
      );
      if (foundOffer) {
        console.log("----------- found offer ----------");
        foundOffer.offererIceCandidates.push(iceCandidate);
        // any candidate coming after the offer has been answered
        if (foundOffer.answererUsername) {
          const socketSendTo = connectedSockets.find(
            (s) => s.username === foundOffer.answererUsername,
          );
          if (socketSendTo) {
            console.log("----------- send to answerer offer ----------");
            socket
              .to(socketSendTo.socketId)
              .emit("receive-ice-candidates", iceCandidate);
          }
        }
      }
    } else {
      // this ice is coming from answerer, send to offerer
      console.log("----------- send to answerer from offerer ----------");
      const foundOffer = offers.find(
        (of) => of.answererUsername === iceUsername,
      );
      const socketSendTo = connectedSockets.find(
        (s) => s.username === foundOffer.offererUsername,
      );
      if (socketSendTo) {
        console.log(
          "----------- send to ice candidate from to answerer ----------",
        );
        socket
          .to(socketSendTo.socketId)
          .emit("receive-ice-candidates", iceCandidate);
      } else {
        console.log("ice candidate received but could not find offerer");
      }
    }
  });

  socket.on("push-answerer-offer", (offer, callback) => {
    // const { answerOffer, answererUsername, username } = offer;
    // const foundOffer = offers.find((of) => of.offererUsername === username);
    // foundOffer.answererUsername = answererUsername;
    // foundOffer.answer = answerOffer;

    console.log("found offer", JSON.stringify(offer));

    const socketToAnswer = connectedSockets.find(
      (s) => s.username === offer.offererUsername,
    );

    if (!socketToAnswer) {
      console.log("No matching sockets found");
      return;
    }

    const socketIdToAnswer = socketToAnswer.socketId;

    const offerToUpdate = offers.find(
      (o) => o.offererUsername === offer.offererUsername,
    );
    if (!offerToUpdate) {
      console.log("No offer to update");
      return;
    }

    // send back to answerer all ice candidates collected.
    callback(offerToUpdate.offererIceCandidates);

    offerToUpdate.answer = offer.answer;
    offerToUpdate.answererUsername = username;

    socket.to(socketIdToAnswer).emit("answer-response", offerToUpdate);
  });
});
