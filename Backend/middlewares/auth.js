const { getUser } = require("../services/auth")

async function restrictToLoginUserOnly(req, res, next) {
    const userUID = req.cookies?.token

    if (!userUID) {
        return res.redirect("/login")
    }
    const user = getUser(userUID)

    if (!user) {
        return res.redirect("/login")
    }
    req.user = user
    next()
}


module.exports = {
    restrictToLoginUserOnly,
}