const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./asyncHandler");

// A token lasts one clinic shift; after that the user logs in again
const TOKEN_LIFETIME = "8h";

// Creates a signed token holding the user's id and role (called at login)
function createToken(user) {
    return jwt.sign(
        { role: user.role },
        process.env.JWT_SECRET,
        { subject: user.id, expiresIn: TOKEN_LIFETIME }
    );
}

// Checks the "Authorization: Bearer <token>" header on every protected request.
// On success the logged-in user is available to controllers as req.user.
async function requireAuth(req, res, next) {
    let [scheme, token] = (req.headers.authorization || "").split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Please log in" });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ message: "Your session has expired, please log in again" });
    }

    // Load the user fresh, so a deleted account or changed role takes effect immediately
    let user = await User.findById(payload.sub);
    if (!user) {
        return res.status(401).json({ message: "This account no longer exists" });
    }

    req.user = user;
    next();
}

// Lets the request through only for the listed roles (use after requireAuth)
function allowRoles(...roles) {
    return function (req, res, next) {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You don't have permission to do this" });
        }
        next();
    };
}

module.exports = {
    createToken,
    requireAuth: asyncHandler(requireAuth),
    allowRoles
};