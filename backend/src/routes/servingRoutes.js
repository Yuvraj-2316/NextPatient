const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { getServing, completeServing } = require("../controllers/servingController");

const router = express.Router();

// Mounted at /api/serving in app.js
router.get("/", asyncHandler(getServing));
router.post("/complete", asyncHandler(completeServing));

module.exports = router;