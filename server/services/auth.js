require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

function getUser(token) {
    if (!token) {
        console.error("No token provided");
        return null;
    }

    console.log("Received token:", token);

    try {
        return jwt.verify(token, secret);
    } catch (err) {
        console.error('Token verification error:', err.message);
        return null;
    }
}

module.exports = {
    getUser
};
