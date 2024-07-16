const createServer = require("http").createServer;
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const userRoutes = require("./routes/userRoutes.js");
const cookieParser = require("cookie-parser");
const { restrictToLoginUserOnly } = require("./middlewares/auth.js");

dotenv.config();
const dbConnector = require('./config/connect.js');
const profileRoutes = require("./routes/profileRoutes.js");
dbConnector();

const port = process.env.PORT || 3000;
const app = express();
const httpServer = createServer(app);

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.end("HI");
});

app.use("/user", userRoutes);
app.use('/profile', restrictToLoginUserOnly, profileRoutes);

app.get("/stockfish", async (req, res) => {
  try {
    const apiUrl = "https://stockfish.online/api/s/v2.php";
    const response = await axios.get(apiUrl, {
      params: req.query
    });
    const bestMove = response.data.bestmove;
    res.json({
      bestMove: bestMove
    });
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
  }
});

let pendingUser = null;

const twoplayer = io.of("/twoplayer")
twoplayer.on('connection', (socket) => {
  const user = JSON.parse(socket.handshake.query.user);
  console.log('User connected');

  if (pendingUser) {
    const player1 = pendingUser;
    const player2 = socket;

    player1.emit('color', 'white');
    player2.emit('color', 'black');

    player1.emit('opponent', user);
    player2.emit('opponent', JSON.parse(player1.handshake.query.user));

    pendingUser = null;

    player1.on('move', ({ from, to }) => {
      player2.emit('move', { from, to });
    });

    player2.on('move', ({ from, to }) => {
      player1.emit('move', { from, to });
    });

    player1.on('disconnect', () => {
      player2.emit('opponentDisconnected');
    });

    player2.on('disconnect', () => {
      player1.emit('opponentDisconnected');
    });
  } else {
    pendingUser = socket;
    socket.emit('waiting', true);

    socket.on('disconnect', () => {
      pendingUser = null;
    });
  }
});

const championship = io.of("/championship");
const players = [];

championship.on("connection", (socket) => {
  players.push({
    "socket": socket,
    "won": false,
    "qualify": false,
    "user" : JSON.parse(socket.handshake.query.user)
  });

  socket.on('disconnect', () => {
    const index = players.findIndex(player => player.socket.id === socket.id);
    if (index !== -1) players.splice(index, 1);
    emitPlayerList();
  });

  emitPlayerList();
});

const emitPlayerList = () => {
  const playerList = players.map(player => {
    const user = JSON.parse(player.socket.handshake.query.user);
    return user
  });

  championship.emit("list", playerList);
};

if (players.length == 8) {

}

httpServer.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
