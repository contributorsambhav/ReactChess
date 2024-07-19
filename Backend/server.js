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

io.on('connection', (socket) => {
  const user = JSON.parse(socket.handshake.query.user);
  console.log('User connected:', user);

  if (pendingUser) {
    const player1 = pendingUser;
    const player2 = socket;

    player1.emit('color', 'white');
    player2.emit('color', 'black');

    player1.emit('opponent', user);
    player2.emit('opponent', JSON.parse(player1.handshake.query.user));

    pendingUser = null;

    player1.on('move', ({ from, to ,obtainedPromotion}) => {
      player2.emit('move', { from, to ,obtainedPromotion});
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

httpServer.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
