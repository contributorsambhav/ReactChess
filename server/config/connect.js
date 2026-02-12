const mongoose = require('mongoose')
const dotenv = require("dotenv")
dotenv.config()

const MONGO_URI = process.env.MONGO_URI
console.log(MONGO_URI)
const dbConnector = async () => {

    await mongoose.connect(MONGO_URI, {
    }
    ).then(() => console.log('MongoDB connected')).catch((err) => {
        console.log(err);
    })

}
module.exports =  dbConnector