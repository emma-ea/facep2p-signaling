let availableAudioIns = [];
let availableAudioOuts = [];
let availableVideoFeeds = [];

const fetchUserDevices = async () => {
  clearUserDevices();

  const devices = await navigator.mediaDevices.enumerateDevices();
  devices.forEach((device) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.text = device.label;

    if (device.kind === "audioinput") {
      availableAudioIns.push(device);
      audioInsSelectorEl.appendChild(option);
    }
    if (device.kind === "audiooutput") {
      availableAudioOuts.push(device);
      audioOutSelectorEl.appendChild(option);
    }
    if (device.kind === "videoinput") {
      availableVideoFeeds.push(device);
      videoFeedsEl.appendChild(option);
    }
  });

  console.log(devices);
};

const changeAudioInput = async (e) => {
  const deviceId = e.target.value;

  const newConstraints = {
    audio: { deviceId: { exact: deviceId } },
    video: true,
  };

  try {
    localStream = await navigator.mediaDevices.getUserMedia(newConstraints);
    updatePeerWithLocalStream("audio");
  } catch (err) {
    console.error(err);
  }
};

const changeAudioOutput = async (e) => {
  await videoEl.setSinkId(e.target.value);
  // updatePeerWithLocalStream();
};

const changeVideoInput = async (e) => {
  const newDeviceId = e.target.value;

  // stopMyFeed(e);

  const newConstraints = {
    audio: true,
    video: {
      deviceId: { exact: newDeviceId },
    },
  };

  localStream = await navigator.mediaDevices.getUserMedia(newConstraints);
  localVideoEl.srcObject = localStream;
  updatePeerWithLocalStream("video");
};

const shareLocalScreen = async (e) => {
  const mediaConstraints = {
    surfaceSwitching: "include",
    audio: false,
    video: true,
  };
  const displayVideoStream =
    await navigator.mediaDevices.getDisplayMedia(mediaConstraints);
  localStream = displayVideoStream;
  localVideoEl.srcObject = localStream;
  await updatePeerWithLocalStream("video");
};

const updatePeerWithLocalStream = async (ttype) => {
  const track =
    ttype === "video"
      ? peerConnection.getVideoTracks()[0]
      : peerConnection.getAudioTracks()[0];
  const sender = peerConnection.getSenders((s) => s.track?.kind === ttype);
  if (sender) {
    await sender.replaceTrack(track);
  } else {
    console.log("Cannot replace track, ", track);
  }
};

const clearUserDevices = () => {
  availableAudioIns = [];
  availableAudioOuts = [];
  availableVideoFeeds = [];

  audioInsSelectorEl.replaceChildren();
  audioOutSelectorEl.replaceChildren();
  videoFeedsEl.replaceChildren();
};
