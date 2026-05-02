/* =========================================================
   errorHandler.js
   Global error handling middleware
========================================================= */

module.exports = function errorHandler(err, req, res, next) {
    console.error("🔥 Backend Error:", err);

    res.status(500).json({
        success: false,
        error: "Internal server error. Please try again later.",
        details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
};
