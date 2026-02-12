const localVideoEl = document.querySelector("#local-video");
const remoteVideoEl = document.querySelector("#remote-video");

let localStream;
let remoteStream;
let peerConnection;

const call = async (e) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });

  localVideoEl.srcObject = stream;
  localStream = stream;

  await createPeerConnection();

  try {
    console.log("-- creating offer --"); // send offer to other side
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log(JSON.stringify(offer));
  } catch (err) {
    console.error(err);
  }
};

const createPeerConnection = async () => {
  return new Promise(async (resolve, reject) => {
    peerConnection = new RTCPeerConnection(peerConfiguration);

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.addEventListener("icecandidate", (e) => {
      console.log("-- ice candidate found --");
      if (e.candidate) {
        console.log(e);
        console.log(JSON.stringify(e.candidate));
      }
    });
    resolve();
  });
};

const hangup = (e) => {
  stream.getTracks().forEach((t) => {
    t.stop();
  });
};

document.querySelector("#call").addEventListener("click", call);
document.querySelector("#hangup").addEventListener("click", hangup);
