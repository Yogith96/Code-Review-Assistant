/* =========================================================
   responseBuilder.js
   Assembles final API JSON response
========================================================= */

function build({ issues, score, before, after }) {
    return {
        success: true,
        analysis: {
            totalScore: score.total,
            breakdown: score.breakdown,
            issueCount: issues.length,
            issues: issues,
            before,
            after
        },
        generatedAt: new Date().toISOString()
    };
}

module.exports = { build };
