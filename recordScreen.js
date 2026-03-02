let mediaRecorder;
let chunks = [];
const mime = "video/webm";

const startRecord = async (e) => {
  const rstream = new MediaStream([
    ...localStream.getTracks(),
    ...remoteStream.getTracks(),
  ]);
  mediaRecorder = new MediaRecorder(rstream);
  mediaRecorder.ondataavailable = (ev) => {
    if (ev.data.size < 0) return;
    chunks.push(ev.data);
  };
  mediaRecorder.start();
};

const stopRecord = async (e) => {
  mediaRecorder.stop();
};

const downloadRecord = async (e) => {
  if (chunks.length < 0) return;
  const blob = new Blob(chunks, { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.style = "display: none;";
  a.href = url;
  a.download = `feed-recording-sample-${new Date().toISOString()}.webm`;
  a.click();
  URL.revokeObjectURL(url);
};
