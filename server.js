const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);

// Peer-WebRTC
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/h", (req, res) => {
  res.send("You Left the Meeting Successfully");
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

const screenSharingStreams = new Map();

// Joining Meeting.
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    // let screenStream = null;

    // Handle incoming calls
    peerServer.on("call", (incomingCall) => {
      if (incomingCall.metadata.videoType === "screen") {
        screenStream = incomingCall;
        screenSharingStreams.set(userId, screenStream);
      }
    });

    // Handle screen share event
    socket.on("screen-share", (roomId, userId, screenStreamId) => {
      let screenStream = null;

      // If screenStreamId is provided, use the existing screenStream
      if (screenStreamId) {
        screenStream = screenSharingStreams.get(userId);
      } else {
        // If no screenStreamId, it's a new screen share, capture the stream
        const existingScreenStream = screenSharingStreams.get(userId);
        if (existingScreenStream) {
          screenStream = existingScreenStream;
        }
      }

      // Broadcast the screen share to all participants in the room
      if (screenStream && screenStream.stream) {
        io.to(roomId).emit("screen-share", userId, screenStream.stream);
      }
    });

    // Handle screen share stop event
    socket.on("screen-share-stop", (roomId, userId) => {
      console.log(`Screen share stopped for user: ${userId}`);
      // Remove the screen-sharing stream from the map
      screenSharingStreams.delete(userId);
      // Broadcast the screen share stop event to other participants with the correct user ID
      io.to(roomId).emit("screen-share-stop", userId);
    });

    // Send Message In The ChatRoom
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    // Listen for user disconnection
    socket.on("disconnect", () => {
      io.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(process.env.PORT || 3030);
