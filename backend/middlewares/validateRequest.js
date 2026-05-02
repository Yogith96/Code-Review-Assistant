/* =========================================================
   validateRequest.js
   Ensures incoming request contains valid code input
========================================================= */

module.exports = function validateRequest(req, res, next) {
    const { code } = req.body;

    // Ensure code exists
    if (!code || typeof code !== "string") {
        return res.status(400).json({
            success: false,
            error: "Invalid request. 'code' field is required and must be string."
        });
    }

    // Prevent extremely large payloads (safety)
    if (code.length > 50000) {
        return res.status(413).json({
            success: false,
            error: "Code input too large. Limit is 50,000 characters."
        });
    }

    // Basic sanitization (prevent accidental escapes)
    req.body.code = code.replace(/\0/g, "").trim();

    next();
};
