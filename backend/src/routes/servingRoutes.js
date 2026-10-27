const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { getServing, completeServing } = require("../controllers/servingController");

const router = express.Router();

// Mounted at /api/serving in app.js. Every route needs a logged-in user.
router.use(requireAuth);

router.get("/", allowRoles("receptionist", "doctor", "admin"), asyncHandler(getServing));
router.post("/complete", allowRoles("doctor"), asyncHandler(completeServing));

module.exports = router;