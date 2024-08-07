const createServer = require("http").createServer;
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const userRoutes = require("./routes/userRoutes.js");
const cookieParser = require("cookie-parser");
const { restrictToLoginUserOnly } = require("./middlewares/auth.js");
const path = require("path")
dotenv.config();
const dbConnector = require('./config/connect.js');
const profileRoutes = require("./routes/profileRoutes.js");
dbConnector();

const port = process.env.PORT || 3000;
const app = express();
const httpServer = createServer(app);

const corsOptions = {
  origin: '*:*',
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/client/dist")));

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

// Wildcard route for SPA (Single Page Application)
// This should be the last route to catch all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/client/dist/index.html"));
});

const io = new Server(httpServer, {
  cors: {
    origin: '*:*',
  }
});

let pendingUser = null;

io.on('connection', (socket) => {
  console.log(socket);
  const user = JSON.parse(socket.handshake.query.user);

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

    player2.on('move', ({ from, to , obtainedPromotion}) => {
      player1.emit('move', { from, to, obtainedPromotion });
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
  console.log(`Server started at succesfully`);
});
