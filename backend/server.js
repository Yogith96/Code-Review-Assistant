/* =========================================================
   server.js
   Express server entry point for Code Review Assistant
========================================================= */

const express = require("express");
const cors = require("cors");
const path = require("path");
const analyzeRoute = require("./routes/analyzeRoute");
const runRoute = require("./routes/runRoute");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" })); // protect from large payloads

// Routes
app.use("/api/analyze", analyzeRoute);
app.use("/api/run", runRoute);

// Serve Frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// Root fallback to index.html for SPA-like behavior (optional, but good practice)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Global error handler (must be last)
app.use(errorHandler);

// Server start
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
