require("dotenv").config({});
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const dbConnection = require("./config/database");
const userRoute = require("./routes/user");

const socketIOServer = require("./socket/socketio-server");

dbConnection();

const app = express();
const CompleteServer = http.createServer(app);

// Integrate Socket.IO with the HTTP server
socketIOServer.attach(CompleteServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.options("*", cors());

//For deploy only
// app.use(express.static(path.join("public")));

app.use("/auth", userRoute);

//for deploy only
// app.use((req, res, next) => {
//   res.sendFile(path.resolve(__dirname, "client/public", "index.html"));
// });

<<<<<<< HEAD
const server = CompleteServer.listen(process.env.PORT || 8000, () => {
  console.log("server is running on port " + process.env.PORT);
=======
app.use((req, res, next) => {
  res.sendFile(path.resolve(__dirname, "client/public", "index.html"));
>>>>>>> 5acec470d43b4d1e0bd618a41891492d288a4cc7
});

process.on("unhandledRejection", (error) => {
  console.log(`unhandledRejection Error : ${error.name} | ${error.message}`);
  server.close(() => {
    console.error("Shutting down.... ");
    process.exit(1);
  });
});
