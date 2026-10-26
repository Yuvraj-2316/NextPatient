const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { getVisits, getPatientsByPhone, getStats } = require("../controllers/visitController");

const router = express.Router();

// Mounted at /api/visits in app.js
router.get("/", asyncHandler(getVisits));
router.get("/patients", asyncHandler(getPatientsByPhone));
router.get("/stats", asyncHandler(getStats));

module.exports = router;