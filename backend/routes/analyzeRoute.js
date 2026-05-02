/* =========================================================
   routes/analyzeRoute.js
   Defines /api/analyze endpoint
========================================================= */

const express = require("express");
const router = express.Router();

const validateRequest = require("../middlewares/validateRequest");
const analyzeController = require("../controllers/analyzeController");

// POST /api/analyze
router.post("/", validateRequest, analyzeController.performAnalysis);

module.exports = router;
