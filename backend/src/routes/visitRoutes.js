const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { getVisits, getPatientsByPhone, updateVisitNotes, getStats } = require("../controllers/visitController");

const router = express.Router();

// Mounted at /api/visits in app.js. Medical history: doctors and admins only.
router.use(requireAuth, allowRoles("doctor", "admin"));

router.get("/", asyncHandler(getVisits));
router.get("/patients", asyncHandler(getPatientsByPhone));
router.get("/stats", asyncHandler(getStats));

// Editing treatment notes is a medical decision: doctors only
router.patch("/:id", allowRoles("doctor"), asyncHandler(updateVisitNotes));

module.exports = router;