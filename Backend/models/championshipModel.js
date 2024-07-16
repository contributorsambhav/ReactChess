const mongoose = require('mongoose');

const championshipSchema = {
    socket : {
        type: String,
        required : true
    },
    won : {
        type : Boolean,
        default : false
    },
    qualify : {
        type : Boolean,
        default : false
    }


}

module.exports = mongoose.model('Championship', championshipSchema);
