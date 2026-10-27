const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { getUsers, adminExists, createStaff, deleteUser } = require("../controllers/userController");

const router = express.Router();

// Mounted at /api/users in app.js.
// Public: the signup page needs this before anyone can log in.
router.get("/admin-exists", asyncHandler(adminExists));

// Everything below: admins only
router.use(requireAuth, allowRoles("admin"));

router.get("/", asyncHandler(getUsers));
router.post("/", asyncHandler(createStaff));
router.delete("/:id", asyncHandler(deleteUser));

module.exports = router;