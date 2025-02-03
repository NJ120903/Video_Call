let localStream;
let mediaRecorder;
let recordedChunks = [];

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localStream = stream;
    document.getElementById("localVideo").srcObject = stream;
}).catch(error => {
    console.error("Error accessing media devices.", error);
});

document.getElementById("toggleVideo").addEventListener("click", function() {
    let videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    this.textContent = videoTrack.enabled ? "Video On" : "Video Off";
    this.classList.toggle("on", videoTrack.enabled);
    this.classList.toggle("off", !videoTrack.enabled);
});

document.getElementById("toggleAudio").addEventListener("click", function() {
    let audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    this.textContent = audioTrack.enabled ? "Audio On" : "Audio Off";
    this.classList.toggle("on", audioTrack.enabled);
    this.classList.toggle("off", !audioTrack.enabled);
});

document.getElementById("startRecording").addEventListener("click", () => {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(localStream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = event => recordedChunks.push(event.data);
    mediaRecorder.onstop = saveRecording;
    mediaRecorder.start();
    document.getElementById("startRecording").disabled = true;
    document.getElementById("stopRecording").disabled = false;
});

document.getElementById("stopRecording").addEventListener("click", () => {
    mediaRecorder.stop();
    document.getElementById("startRecording").disabled = false;
    document.getElementById("stopRecording").disabled = true;
});

function saveRecording() {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}