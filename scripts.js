const localVideoEl = document.querySelector("#local-video");
const remoteVideoEl = document.querySelector("#remote-video");

// media controls
const audioInsSelectorEl = document.querySelector("#audio-input");
const audioOutSelectorEl = document.querySelector("#audio-output");
const videoFeedsEl = document.querySelector("#video-input");

const shareScreenEl = document.querySelector("#screen-share");

let screenSharing = false;

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
  fetchUserDevices();
  try {
    console.log("-- creating offer --"); // send offer to other side
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("new-offer", JSON.stringify(offer));
  } catch (err) {
    console.error(err);
  }
};

const fetchUserMedia = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
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
  fetchUserDevices();
  const answer = await peerConnection.createAnswer({});
  await peerConnection.setLocalDescription(answer);
  offer.answer = answer;
  const offerIceCandidates = await socket.emitWithAck(
    "push-answerer-offer",
    JSON.stringify(offer),
  );
  console.log("----- added ice candidate 0 ------", offerIceCandidates);
  console.log(offerIceCandidates);
  offerIceCandidates.forEach((ice) => {
    peerConnection.addIceCandidate(ice);
  });
  dida;
  console.log("----- added ice cante 1 ------");
  console.log(answer);
};

const addAnswer = async (offerObj) => {
  await peerConnection.setRemoteDescription(offerObj.answerer);
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
        socket.emit(
          "new-ice-candidates",
          JSON.stringify({
            iceCandidate: e.candidate,
            iceUsername: username,
            didIOffer: offerObj ? false : true,
          }),
        );
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
      await peerConnection.setRemoteDescription(JSON.parse(offerObj.offer));
    }

    resolve();
  });
  //
};

const hangup = (e) => {
  localStream.getTracks().forEach((t) => {
    t.stop();
  });
  if (peerConnection.signalingState !== "closed") {
    console.log("closing peer connection");
    peerConnection.close();
    remoteStream = null;
    remoteVideoEl.srcObject = null;
    localVideoEl.srcObject = null;
    localStream = null;
    socket.emit("remove-rtc-client", username);
  }
};

audioInsSelectorEl.addEventListener("change", (e) => changeAudioInput(e));
audioOutSelectorEl.addEventListener("change", (e) => changeAudioOutput(e));
videoFeedsEl.addEventListener("change", (e) => changeVideoInput(e));

shareScreenEl.addEventListener("click", async (e) => {
  if (!screenSharing) {
    shareScreenEl.innerHTML = "Stop screen sharing";
    shareLocalScreen(e);
  } else {
    shareScreenEl.innerHTML = "Share screen";
    await fetchUserMedia();
    await updatePeerWithLocalStream("video");
  }
  screenSharing = !screenSharing;
});

document.querySelector("#call").addEventListener("click", call);
document.querySelector("#hangup").addEventListener("click", hangup);
