const http = require("http");
const socketIO = require("socket.io");
const express = require("express");
const { ExpressPeerServer } = require("peer");
const { v4: uuidV4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const cors = require("cors");
app.use(cors());

const peerServer = ExpressPeerServer(server, { debug: true });

// Middleware
app.use(express.static("public"));
app.use("/peerjs", peerServer);

// View engine setup
app.set("view engine", "ejs");

// Routes
app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/leavingMetting", (req, res) => {
  res.send("You Are Left Metting Succsufully");
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Socket.io handling
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    // Listen for leave-meeting signal
    socket.on("leave-meeting", (roomId, userId) => {
      // Handle cleanup or additional logic when a user leaves
      // For example, you can broadcast a message indicating the user has left
      io.to(roomId).emit("user-left", userId);
    });

    // Messageschat
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
