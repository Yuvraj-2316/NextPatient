const User = require("../models/User");
const { createUser } = require("../services/userService");

// POST /api/auth/login
// Checks the password on the server. The password hash never leaves the backend.
async function login(req, res) {
    let { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    let user = await User.findOne({ username: String(username).trim() });

    // Same message for "no such user" and "wrong password",
    // so nobody can find out which usernames exist
    if (!user || !(await user.checkPassword(String(password)))) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json(user);
}

// POST /api/auth/register-admin
// Creates the first admin. Blocked once an admin exists (same rule as phase 1 signup.js).
async function registerAdmin(req, res) {
    let adminExists = await User.exists({ role: "admin" });
    if (adminExists) {
        return res.status(403).json({ message: "An admin account already exists" });
    }

    let { username, password } = req.body;
    let admin = await createUser({ username, password, role: "admin" });

    res.status(201).json(admin);
}

module.exports = { login, registerAdmin };