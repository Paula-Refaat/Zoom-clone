const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});
let myVideoStream;
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

let roomId; // Add this variable to store the room ID

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
    // input value
    let text = $("input");
    // when press enter send message
    $("html").keydown(function (e) {
      if (e.which == 13 && text.val().length !== 0) {
        socket.emit("message", text.val());
        text.val("");
      }
    });
    socket.on("createMessage", (message) => {
      $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
      scrollToBottom();
    });
  });

socket.on("user-disconnected", (userId) => {
  //   if (peers[userId]) peers[userId].close();
  if (peers[userId]) {
    peers[userId].close();
    removeVideoStream(userId);
  }
});

const joinMeeting = () => {
  // Function to attempt joining the meeting
  const tryJoining = () => {
    const roomId = ROOM_ID;

    myPeer.on("open", (id) => {
      socket.emit("join-room", roomId, id);
    });
  };

  // Try joining immediately
  tryJoining();

  // If joining fails, try again after a short delay
  setTimeout(() => {
    tryJoining();
  }, 100); // Adjust the delay as needed
};

// Call the joinMeeting function when the script runs
joinMeeting();

const leaveMeeting = () => {
  // Close the Peer connection
  if (myPeer) {
    myPeer.disconnect();
    myPeer.destroy();
  }

  // Close all Peer connections to other participants
  for (const peerId in peers) {
    if (peers.hasOwnProperty(peerId)) {
      const peer = peers[peerId];
      peer.close();
      removeVideoStream(peerId);
    }
  }

  // Remove the local video element
  if (myVideo) {
    myVideo.srcObject.getTracks().forEach((track) => track.stop());
    myVideo.srcObject = null;
    myVideo.remove();
  }

  // Notify others that the user is leaving
  socket.emit("leave-meeting", roomId, myPeer.id);

  // Redirect the user to the home page or any desired destination
  window.location.href = "/leavingMetting";
};

document
  .querySelector(".leave_meeting")
  .addEventListener("click", leaveMeeting);

// Function to remove video element
const removeVideoStream = (userId) => {
  const videoElement = document.getElementById(userId);
  if (videoElement) {
    videoElement.remove();
  }
};

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

const scrollToBottom = () => {
  var d = $(".main__chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const playStop = () => {
  console.log("object");
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

















