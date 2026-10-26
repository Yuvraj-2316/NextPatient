const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { getUsers, adminExists, createStaff, deleteUser } = require("../controllers/userController");

const router = express.Router();

// Mounted at /api/users in app.js
router.get("/", asyncHandler(getUsers));
router.get("/admin-exists", asyncHandler(adminExists));
router.post("/", asyncHandler(createStaff));
router.delete("/:id", asyncHandler(deleteUser));

module.exports = router;