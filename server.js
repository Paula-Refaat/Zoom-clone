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
  res.send("You Are Left Metting Succsufully");
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Joining Metting.
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    // Send Message In The ChatRoom
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });
    // Handle the "disconnect" event
    socket.on("disconnect", () => {
      // Notify others in the room about the disconnection
      io.to(roomId).emit("user-disconnected", userId);

      // Broadcast the "removeVideo" event to remove the user's video stream from other participants
      io.to(roomId).emit("removeVideo", userId);
    });
  });
});

server.listen(process.env.PORT || 3030);
