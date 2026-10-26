const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { getQueue, addPatient, callNext } = require("../controllers/queueController");

const router = express.Router();

// Mounted at /api/queue in app.js
router.get("/", asyncHandler(getQueue));
router.post("/", asyncHandler(addPatient));
router.post("/next", asyncHandler(callNext));

module.exports = router;