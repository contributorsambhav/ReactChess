const mongoose = require('mongoose')

const dbConnector = async () => {

    await mongoose.connect('mongodb+srv://sam:Password@atlascluster.ycaagz6.mongodb.net/Chess?retryWrites=true&w=majority&appName=AtlasCluster', {
    }
    ).then(() => console.log('MongoDB connected')).catch((err) => {
        console.log(err);
    })

}
module.exports = dbConnector