const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dbConnector = require('./connect');

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

app.use('/api/users', userRoutes);

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
