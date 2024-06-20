const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const dbConnector = require('./connect')

dotenv.config();
dbConnector()

const port = process.env.PORT || 3000;
const app = express();
app.use(express.json())
app.use(express.urlencoded())




const userRoutes = require("./routes/userRoutes")
app.get("/",(req,res)=>{
    res.end("HI")
})

app.use('/api/users',userRoutes)


app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
