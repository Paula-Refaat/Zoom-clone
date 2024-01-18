const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const leaveMeetingButton = document.getElementById("leave-meeting");
const myVideo = document.createElement("video");
myVideo.muted = true;

// Initialize a new Peer object for WebRTC communication
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

let myVideoStream;
const peers = {};

var getUserMedia =
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
    addVideoStream(myVideo, stream);

    // Listen for incoming calls and answer with the user's stream
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      // Display the remote user's video stream
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // Listen for a "user-connected" event and connect to the new user
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });

    // Listen for keyboard events and send a message when the Enter key is pressed
    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    // Listen for incoming chat messages and display them on the page
    socket.on("createMessage", (msg) => {
      console.log(msg);
      let li = document.createElement("li");
      li.innerHTML = msg;
      all_messages.append(li);
      main__chat__window.scrollTop = main__chat__window.scrollHeight;
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
        addVideoStream(video, remoteStream);
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
  var call = peer.call(userId, streams);
  console.log(call);
  var video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream);
  });
};

// // Function to add a video stream to the page
const addVideoStream = (videoEl, stream) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoEl);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

// Listen for the "user-disconnected" event from the server
socket.on("user-disconnected", (userId) => {
  // Remove the video element associated with the disconnected user
  removeVideoStream(userId);
});

// Listen for the "disconnect" event from the server
socket.on("disconnect", () => {
  // Handle disconnection, for example, redirect to a home page or display a message
  console.log("You have left the meeting.");
  // You might want to implement further actions here, depending on your application's needs.
});

leaveMeetingButton.addEventListener("click", leaveMeeting);

function leaveMeeting() {
  // Close the Peer connection
  disconnectPeer();

  // Remove the local video element
  removeLocalVideo();

  // Stop the user's video stream
  stopUserVideoStream();

  // Remove the user's video element from the grid
  removeVideoStream(socket.id);

  // Redirect to the home page
  redirectToHomePage();
}

function disconnectPeer() {
  peer.destroy();
}

function removeLocalVideo() {
  myVideo.remove();
}

function stopUserVideoStream() {
  myVideoStream.getTracks().forEach((track) => track.stop());
}

function redirectToHomePage() {
  window.location.href = "/h";
}

// Toggle the user's video on and off
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

// Function to remove a video stream from the page
const removeVideoStream = (userId) => {
  const video = document.getElementById(userId);
  if (video) {
    video.remove();
  }
};

// Listen for the "removeVideo" event and remove the video element
socket.on("removeVideo", (userId) => {
  removeVideoStream(userId);
});

// Toggle the user's microphone on and off
const muteUnmute = () => {
  let enabled = myVideoStream.getAudioTracks()[0].enabled;
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
