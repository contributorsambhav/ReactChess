const { getUser } = require("../services/auth");

async function restrictToLoginUserOnly(req, res, next) {
    console.log(req.cookies);
    const userToken = req.cookies?.token; // Assuming token is stored in cookies
    if (!userToken) {
  return res.status(401).json({ error: 'Not authenticated' });
}


    const user = getUser(userToken); // Directly use getUser synchronously

 if (!user) {
  return res.status(401).json({ error: 'Invalid token' });
}
    req.user = user; // Set user information in req object
    next(); // Proceed to next middleware or route handler
}

module.exports = {
    restrictToLoginUserOnly,
};
