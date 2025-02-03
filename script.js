let localStream;
let peerConnection;
let remoteStream;
let roomId = '';

// Access user's media (video & audio)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        document.getElementById('localVideo').srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing media devices:', error);
    });

// Create Room
document.getElementById('createRoom').addEventListener('click', () => {
    roomId = Math.random().toString(36).substring(2, 10);  // Random room ID
    document.getElementById('roomId').value = roomId; // Show room ID in the input
    alert(`Room created! Share this room ID: ${roomId}`);
    joinRoom(roomId);
});

// Join Room
document.getElementById('joinRoom').addEventListener('click', () => {
    roomId = document.getElementById('roomId').value;
    if (roomId) {
        joinRoom(roomId);
    } else {
        alert('Please enter a room ID');
    }
});

// Join Room Logic (both for creating and joining)
function joinRoom(roomId) {
    const serverConfiguration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // STUN server for NAT traversal
    };

    // Create peer connection
    peerConnection = new RTCPeerConnection(serverConfiguration);

    // Add local media stream to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        document.getElementById('remoteVideo').srcObject = remoteStream;
    };

    // ICE Candidate Handling
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            // Add ICE candidate to signaling process (using localStorage)
            localStorage.setItem('candidate-' + roomId, JSON.stringify(event.candidate));
        }
    };

    // Handle creating and answering the call
    if (!localStorage.getItem('offer-' + roomId)) {
        // Create an offer if not present
        peerConnection.createOffer()
            .then(offer => {
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                localStorage.setItem('offer-' + roomId, JSON.stringify(peerConnection.localDescription));
            })
            .catch(error => console.error('Error creating offer:', error));
    } else {
        // Handle answering the call if offer is present
        const offer = JSON.parse(localStorage.getItem('offer-' + roomId));
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => {
                return peerConnection.createAnswer();
            })
            .then(answer => {
                return peerConnection.setLocalDescription(answer);
            })
            .then(() => {
                localStorage.setItem('answer-' + roomId, JSON.stringify(peerConnection.localDescription));
            })
            .catch(error => console.error('Error answering offer:', error));
    }

    // Handle ICE candidates for both users
    const storedCandidate = JSON.parse(localStorage.getItem('candidate-' + roomId));
    if (storedCandidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(storedCandidate))
            .catch(error => console.error('Error adding ICE candidate:', error));
    }

    // Handle remote answer if user is answering
    const answer = JSON.parse(localStorage.getItem('answer-' + roomId));
    if (answer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
}

// Video Toggle
document.getElementById('toggleVideo').addEventListener('click', () => {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    document.getElementById('toggleVideo').textContent = videoTrack.enabled ? "Video On" : "Video Off";
});

// Audio Toggle
document.getElementById('toggleAudio').addEventListener('click', () => {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    document.getElementById('toggleAudio').textContent = audioTrack.enabled ? "Audio On" : "Audio Off";
});

// Start and Stop Recording (same as your current setup)
let mediaRecorder;
let recordedChunks = [];
document.getElementById('startRecording').addEventListener('click', () => {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(localStream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = event => recordedChunks.push(event.data);
    mediaRecorder.onstop = saveRecording;
    mediaRecorder.start();
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
});

document.getElementById('stopRecording').addEventListener('click', () => {
    mediaRecorder.stop();
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
});

function saveRecording() {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
