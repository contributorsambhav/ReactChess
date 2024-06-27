const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dbConnector = require('./connect');
const axios = require("axios")

dotenv.config();
dbConnector();

const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS to allow requests from port 5173
const corsOptions = {
    origin: 'http://localhost:5173', // URL of the client application
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Import and use user routes
const userRoutes = require("./routes/userRoutes");

app.get("/", (req, res) => {
    res.end("HI");
});


app.get("/stockfish", async (req, res) => {
    try {
        const apiUrl = "https://www.chessdb.cn/cdb.php"; 
        const payload = {
            action: "querybest",
            board: "rnbqkbnr/ppp1pppp/3p4/8/8/4PQ2/PPPP1PPP/RNB1KBNR b KQkq - 1 2"
        };

        const response = await axios.get(apiUrl, {
            params: payload
        });

        if (response.data.includes("move:")) {
            // Extract the move and sanitize it by removing the null character
            const bestMove = response.data.split("move:")[1].trim().replace('\u0000', '');
            res.json({
                bestMove: bestMove
            });
        } else {
            res.status(400).json({
                error: "Request failed",
                details: response.data
            });
        }
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});


app.use('/api/users', userRoutes);

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
