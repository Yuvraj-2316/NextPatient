const User = require("../models/User");
const { createUser, updateUser } = require("../services/userService");

// Roles an admin can give from the dashboard (admins come from register-admin only)
const STAFF_ROLES = ["doctor", "receptionist"];

// GET /api/users
// Staff list for the admin dashboard. Password hashes are removed by the model.
async function getUsers(req, res) {
    let users = await User.find().sort({ role: 1, username: 1 });
    res.json(users);
}

// GET /api/users/admin-exists
// Lets the signup page know whether admin signup is still open
async function adminExists(req, res) {
    let exists = await User.exists({ role: "admin" });
    res.json({ adminExists: Boolean(exists) });
}

// POST /api/users
// Admin adds a doctor or receptionist
async function createStaff(req, res) {
    let { username, password, role } = req.body;

    if (!STAFF_ROLES.includes(role)) {
        return res.status(400).json({ message: "Role must be doctor or receptionist" });
    }

    let user = await createUser({ username, password, role });
    res.status(201).json(user);
}

// PATCH /api/users/:id
// Admin changes a staff member's role and/or resets their password.
// Only the fields that are sent change. Admin accounts can't be changed here.
async function updateStaff(req, res) {
    let { role, password } = req.body;

    if (role === undefined && password === undefined) {
        return res.status(400).json({ message: "Send a new role and/or a new password" });
    }
    if (role !== undefined && !STAFF_ROLES.includes(role)) {
        return res.status(400).json({ message: "Role must be doctor or receptionist" });
    }

    let user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
        return res.status(403).json({ message: "Admin accounts cannot be changed here" });
    }

    let updatedUser = await updateUser(user, { role, password });
    res.json(updatedUser);
}

// DELETE /api/users/:id
// Admin removes a staff member. Admin accounts cannot be deleted here.
async function deleteUser(req, res) {
    let user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
        return res.status(403).json({ message: "Admin accounts cannot be deleted" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted", id: req.params.id });
}

module.exports = { getUsers, adminExists, createStaff, updateStaff, deleteUser };