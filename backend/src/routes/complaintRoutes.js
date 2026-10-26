const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { getComplaints, createComplaint, deleteComplaint } = require("../controllers/complaintController");

const router = express.Router();

// Mounted at /api/complaints in app.js
router.get("/", asyncHandler(getComplaints));
router.post("/", asyncHandler(createComplaint));
router.delete("/:id", asyncHandler(deleteComplaint));

module.exports = router;