/* =========================================================
   routes/runRoute.js
   Defines /api/run endpoint for code execution
========================================================= */

const express = require("express");
const router = express.Router();

const validateRunRequest = require("../middlewares/validateRunRequest");
const runController = require("../controllers/runController");

// POST /api/run
router.post("/", validateRunRequest, runController.executeCode);

module.exports = router;
