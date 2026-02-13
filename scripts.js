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
  offer.answer = answer;
  const offerIceCandidates = await socket.emitWithAck(
    "push-answerer-offer",
    offer,
  );
  offerIceCandidates.forEach((ice) => {
    peerConnection.addIceCandidate(ice);
  });
  console.log("----- added ice candidate ------");
  console.log(answer);
};

const addAnswer = async (offerObj) => {
  await peerConnection.setRemoteDescription(offerObj.answer);
};

const addNewIceCandidate = async (iceCandidate) => {
  console.log(iceCandidate);
  peerConnection.addIceCandidate(iceCandidate);
  console.log("----- added ice candidate ------");
};

const createPeerConnection = async (offerObj) => {
  return new Promise(async (resolve, reject) => {
    peerConnection = new RTCPeerConnection(peerConfiguration);

    remoteStream = new MediaStream();
    remoteVideoEl.srcObject = remoteStream;

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
        socket.emit("new-ice-candidates", {
          iceCandidate: e.candidate,
          iceUsername: username,
          didIOffer: true,
        });
      }
    });

    peerConnection.addEventListener("track", (ev) => {
      console.log("--------- Got a track -------- ");
      console.log(ev);
      ev.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track, remoteStream);
      });
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
