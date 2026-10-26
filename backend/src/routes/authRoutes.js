const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { login, registerAdmin } = require("../controllers/authController");

const router = express.Router();

// Mounted at /api/auth in app.js
router.post("/login", asyncHandler(login));
router.post("/register-admin", asyncHandler(registerAdmin));

module.exports = router;