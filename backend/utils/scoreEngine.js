/* =========================================================
   scoreEngine.js
   Computes weighted score using rules.json scoring_weights
========================================================= */

const fs = require("fs");
const path = require("path");

let SCORING = null;

/* ---------- Load Scoring Config ---------- */
(function loadScoring() {
    try {
        const filePath = path.join(__dirname, "../data/rules.json");
        const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
        SCORING = json.scoring_weights;
    } catch (err) {
        console.error("❌ Failed to load scoring config:", err);
        SCORING = {
            base_score: 100,
            errors: -10,
            warnings: -5,
            suggestions: -2,
            readability_factor: 0.3,
            structure_factor: 0.4,
            naming_factor: 0.3
        };
    }
})();

/* ---------- Core Score Computation ---------- */
function computeScore(issues, code) {
    if (!SCORING) return { total: 100, breakdown: {} };

    const severityCounts = {
        error: issues.filter(i => i.severity === "error").length,
        warning: issues.filter(i => i.severity === "warning").length,
        suggestion: issues.filter(i => i.severity === "suggestion").length
    };

    let baseScore = SCORING.base_score;
    baseScore += severityCounts.error * SCORING.errors;
    baseScore += severityCounts.warning * SCORING.warnings;
    baseScore += severityCounts.suggestion * SCORING.suggestions;

    const breakdown = measureQualityDimensions(issues);

    const weighted =
        breakdown.readability * SCORING.readability_factor +
        breakdown.structure * SCORING.structure_factor +
        breakdown.naming * SCORING.naming_factor;

    const finalScore = Math.min(100, Math.max(0, Math.round(baseScore - (100 - weighted))));

    return { total: finalScore, breakdown };
}

/* ---------- Readability / Structure / Naming ---------- */
function measureQualityDimensions(issues) {
    let r = 100, s = 100, n = 100;

    issues.forEach(i => {
        if (i.name === "long_lines" || i.name === "poor_variable_names") r -= 4;
        if (i.name === "deep_nesting" || i.name === "callback_hell") s -= 5;
        if (i.name === "single_letter_vars" || i.name === "CONSTANTS_UPPERCASE") n -= 3;
    });

    return {
        readability: Math.max(0, r),
        structure: Math.max(0, s),
        naming: Math.max(0, n)
    };
}

module.exports = { computeScore };
