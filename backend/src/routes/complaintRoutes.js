const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { getComplaints, createComplaint, deleteComplaint } = require("../controllers/complaintController");

const router = express.Router();

// Mounted at /api/complaints in app.js. Every route needs a logged-in user.
router.use(requireAuth);

router.get("/", allowRoles("admin"), asyncHandler(getComplaints));
router.post("/", allowRoles("receptionist", "doctor", "admin"), asyncHandler(createComplaint));
router.delete("/:id", allowRoles("admin"), asyncHandler(deleteComplaint));

module.exports = router;