const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const dbConnector = require('./connect');
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

// Example route to verify server is running
app.get("/", (req, res) => {
    res.end("HI");
});

// Route to fetch best move from external API (Stockfish)
app.get("/stockfish", async (req, res) => {
    try {
        const apiUrl = "https://stockfish.online/api/s/v2.php";
        
        // Make a GET request to Stockfish API
        const response = await axios.get(apiUrl, {
            params: req.query // Pass query parameters received from the client
        });
        console.log(response);

        // Extract the best move from the response
        const bestMove = response.data.bestmove;

        // Send the best move back to the client
        res.json({
            bestMove: bestMove
        });
    } catch (error) {
        // Handle errors if the request fails
        res.status(500).send(`Error: ${error.message}`);
    }
});




// Start the server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
