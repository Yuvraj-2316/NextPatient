const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { getQueue, addPatient, updatePatient, removePatient, callNext } = require("../controllers/queueController");

const router = express.Router();

// Mounted at /api/queue in app.js. Every route needs a logged-in user.
router.use(requireAuth);

router.get("/", allowRoles("receptionist", "doctor", "admin"), asyncHandler(getQueue));
router.post("/", allowRoles("receptionist"), asyncHandler(addPatient));
router.post("/next", allowRoles("receptionist", "doctor"), asyncHandler(callNext));
router.put("/:id", allowRoles("receptionist"), asyncHandler(updatePatient));
router.delete("/:id", allowRoles("receptionist", "admin"), asyncHandler(removePatient));

module.exports = router;