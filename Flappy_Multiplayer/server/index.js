const express = require('express');
const http = require('http');
const cors = require('cors');
const {Server} = require('socket.io');

const app = express();
app.use(cors());

const port = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://flappy-bird-project-mebk0zl9q-rushis-projects-69f0fb24.vercel.app/",
        methods: ["GET", "POST"]
    },
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

let players = {};



io.on("connection", (socket) => {

    socket.broadcast.emit(`I'm there to beat you. Hahaha`)
  console.log("User connected:", socket.id);

  // Reject if already 2 players
  if (Object.keys(players).length > 2) {
    socket.emit("roomFull");
    socket.disconnect();
    return;
  }

  // Add new player
  players[socket.id] = { score: 0 };
  io.emit("playerJoined", Object.keys(players).length);

  socket.on("scoreUpdate", (score) => {
    players[socket.id].score = score;
    io.emit("scores", Object.entries(players).map(([playerId, data]) => ({
        playerId,
        score: data.score
    })));
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete players[socket.id];
    io.emit("playerLeft", Object.keys(players).length);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
