const localVideoEl = document.querySelector("#local-video");
const remoteVideoEl = document.querySelector("#remote-video");
// username + password
let username = `DOE-${crypto.randomUUID().split("-")[0]}`;
const password = "x";

let localStream;
let remoteStream;
let peerConnection;

document.querySelector("#user-name").innerHTML = username;

const call = async (e) => {
  await fetchUserMedia();
  await createPeerConnection();

  try {
    console.log("-- creating offer --"); // send offer to other side
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log(JSON.stringify(offer));
    socket.emit("new-offer", offer);
  } catch (err) {
    console.error(err);
  }
};

const fetchUserMedia = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });

      localVideoEl.srcObject = stream;
      localStream = stream;
      resolve();
    } catch (err) {
      console.error(err);
      reject();
    }
  });
};

const answerOffer = async (offer) => {
  console.log("answer offer");
  await fetchUserMedia();
  await createPeerConnection(offer);
  const answer = await peerConnection.createAnswer({});
  await peerConnection.setLocalDescription(answer);
  socket.emit("push-answerer-offer", {
    answerOffer: answer,
    answererUsername: offer.offererUsername,
    username: username,
  });
  console.log(answer);
};

const createPeerConnection = async (offerObj) => {
  return new Promise(async (resolve, reject) => {
    peerConnection = new RTCPeerConnection(peerConfiguration);

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.addEventListener("signalingstatechange", (event) => {
      console.log(event);
      console.log(peerConnection.signalingState);
    });

    peerConnection.addEventListener("icecandidate", (e) => {
      console.log("-- ice candidate found --");
      if (e.candidate) {
        console.log(e);
        console.log(JSON.stringify(e.candidate));
        socket.emit("new-ice-candidates", {
          iceCandidate: e.candidate,
          iceUsername: username,
          didIOffer: true,
        });
      }
    });

    if (offerObj) {
      await peerConnection.setRemoteDescription(offerObj.offer);
    }

    resolve();
  });
  //
};

const hangup = (e) => {
  localStream.getTracks().forEach((t) => {
    t.stop();
  });
};

document.querySelector("#call").addEventListener("click", call);
document.querySelector("#hangup").addEventListener("click", hangup);
