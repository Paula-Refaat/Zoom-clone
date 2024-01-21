const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const allMessages = document.getElementById("all_messages");
const mainChatWindow = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const leaveMeetingButton = document.getElementById("leave-meeting");
const myVideo = document.createElement("video");
myVideo.muted = true;

// Initialize a new Peer object for WebRTC communication
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: location.hostname,
  port: location.port || (location.protocol === "https:" ? 443 : 80),
});

let myVideoStream;
let userId; // Ensure userId is defined

const getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

// Get user's media (audio and video) and add their video stream to the page
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    // Set userId before calling addVideoStream
    userId = peer.id;
    addVideoStream(myVideo, stream, userId);

    // Listen for incoming calls and answer with the user's stream
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      // Display the remote user's video stream
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, call.peer); // Use call.peer as userId
      });
    });

    // Listen for a "user-connected" event and connect to the new user
    socket.on("user-connected", (connectedUserId) => {
      connectToNewUser(connectedUserId, stream);
    });

    // Listen for keyboard events and send a message when the Enter key is pressed
    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value !== "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    // Listen for incoming chat messages and display them on the page
    socket.on("createMessage", (msg) => {
      console.log(msg);
      const li = document.createElement("li");
      li.innerHTML = msg;
      allMessages.append(li);
      mainChatWindow.scrollTop = mainChatWindow.scrollHeight;
    });
  });

// Answer incoming calls by providing the user's stream
peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call
      const video = document.createElement("video");

      // Display the remote user's video stream
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream, call.peer);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

// Open a connection to the signaling server and join the specified room
peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

// CHAT
// Function to connect to a new user and share the local stream
const connectToNewUser = (userId, streams) => {
  const call = peer.call(userId, streams);
  console.log(call);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream, userId);
  });
};

// Function to add a video stream to the page
const addVideoStream = (videoEl, stream, userId) => {
  videoEl.srcObject = stream;
  videoEl.setAttribute("data-peer-id", userId); // Set the data-peer-id attribute
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoEl);
  const totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

leaveMeetingButton.addEventListener("click", leaveMeeting);

socket.on("user-disconnected", (userId) => {
  removeVideoStream(userId);
});

function leaveMeeting() {
  disconnectPeer();
  removeLocalVideo();
  redirectToHomePage();
}

function disconnectPeer() {
  peer.destroy();
}

function removeLocalVideo() {
  myVideo.remove();
}

function redirectToHomePage() {
  window.location.href = "/h";
}

function removeVideoStream(userId) {
  console.log(`Removing video stream for user: ${userId}`);
  const video = document.querySelector(`[data-peer-id="${userId}"]`);

  if (video) {
    try {
      const tracks = video.srcObject?.getTracks();

      if (tracks && tracks.length > 0) {
        tracks.forEach((track) => track.stop());
      }

      video.srcObject = null;
      video.pause();
      video.remove();
      console.log(`Video stream removed successfully for user: ${userId}`);
    } catch (error) {
      console.error(`Error removing video stream for user ${userId}:`, error);
    }
  } else {
    console.warn(`No video element found for user: ${userId}`);
  }
}

// Toggle the user's video on and off
const playStop = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

// Toggle the user's microphone on and off
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

// Set the button to resume the video
const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

// Set the button to pause the video
const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

// Set the button to unmute the microphone
const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};

// Set the button to mute the microphone
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
