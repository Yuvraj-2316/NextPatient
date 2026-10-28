const User = require("../models/User");

const MIN_PASSWORD_LENGTH = 6;

// Throws a 400 error when the password is too short.
// Shared by "create user" and "reset password", so the rule lives in one place.
function validatePassword(password) {
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
        let error = new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        error.status = 400;
        throw error;
    }
}

// Creates a user with a hashed password.
// Used by both admin signup and "add staff".
async function createUser({ username, password, role }) {
    validatePassword(password);

    let passwordHash = await User.hashPassword(password);

    return User.create({
        username: typeof username === "string" ? username.trim() : username,
        passwordHash: passwordHash,
        role: role
    });
}

// Changes a user's role and/or password. Only the fields that are sent change.
async function updateUser(user, { role, password }) {
    if (role !== undefined) {
        user.role = role;
    }

    if (password !== undefined) {
        validatePassword(password);
        user.passwordHash = await User.hashPassword(password);
    }

    return user.save();
}

module.exports = { createUser, updateUser, MIN_PASSWORD_LENGTH };