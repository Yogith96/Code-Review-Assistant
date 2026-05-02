/* =========================================================
   validateRunRequest.js
   Validates incoming code execution requests
========================================================= */

const SUPPORTED_LANGUAGES = ["javascript", "python", "typescript", "java", "cpp"];

module.exports = function validateRunRequest(req, res, next) {
    const { code, language } = req.body;

    // Ensure code exists
    if (!code || typeof code !== "string") {
        return res.status(400).json({
            success: false,
            error: "Invalid request. 'code' field is required and must be a string.",
        });
    }

    // Ensure language is provided
    if (!language || typeof language !== "string") {
        return res.status(400).json({
            success: false,
            error: "Invalid request. 'language' field is required.",
        });
    }

    // Validate language
    if (!SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
        return res.status(400).json({
            success: false,
            error: `Unsupported language: '${language}'. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`,
        });
    }

    // Prevent extremely large payloads
    if (code.length > 50000) {
        return res.status(413).json({
            success: false,
            error: "Code input too large. Limit is 50,000 characters.",
        });
    }

    // Basic sanitization
    req.body.code = code.replace(/\0/g, "").trim();
    req.body.language = language.toLowerCase();

    next();
};
