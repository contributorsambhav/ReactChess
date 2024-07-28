const { getUser } = require("../services/auth");

async function restrictToLoginUserOnly(req, res, next) {
    const userToken = req.cookies?.token; // Assuming token is stored in cookies
    if (!userToken) {
        console.error("No token found in cookies");
        return res.redirect("/login");
    }

    const user = getUser(userToken); // Directly use getUser synchronously

    if (!user) {
        console.error("Invalid token or user not found");
        return res.redirect("/login");
    }

    req.user = user; // Set user information in req object
    next(); // Proceed to next middleware or route handler
}

module.exports = {
    restrictToLoginUserOnly,
};
