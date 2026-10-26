const User = require("../models/User");

const MIN_PASSWORD_LENGTH = 6;

// Creates a user with a hashed password.
// Used by both admin signup and "add staff", so the rules live in one place.
async function createUser({ username, password, role }) {
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
        let error = new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        error.status = 400;
        throw error;
    }

    let passwordHash = await User.hashPassword(password);

    return User.create({
        username: typeof username === "string" ? username.trim() : username,
        passwordHash: passwordHash,
        role: role
    });
}

module.exports = { createUser, MIN_PASSWORD_LENGTH };