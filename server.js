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

// Joining Meeting.
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

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
