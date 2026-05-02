/* =========================================================
   smell-detector.js
   Code Smell + Best Practices + Naming Checks
========================================================= */

let SMELL_RULES = [];

/* ---------- Load All Relevant Rule Categories ---------- */
(async function loadSmellRules() {
    try {
        const res = await fetch("data/rules.json");
        const json = await res.json();

        SMELL_RULES = [
            ...json.categories.code_smells.rules,
            ...json.categories.best_practices.rules,
            ...json.categories.naming_conventions.rules
        ];
    } catch (err) {
        console.error("❌ Failed to load rules:", err);
        SMELL_RULES = [];
    }
})();

/* ---------- Master Detector ---------- */
function detectCodeSmells(code) {
    if (!SMELL_RULES.length) return [];

    const lines = code.split("\n");
    const issues = [];

    SMELL_RULES.forEach(rule => {
        if (!rule.pattern) return;
        const regex = new RegExp(rule.pattern, "g");

        lines.forEach((line, index) => {
            // Skip false positives for acceptable loop counters
            if (rule.name === "single_letter_vars" && isLoopCounter(line)) return;

            if (regex.test(line)) {
                issues.push({
                    id: rule.id,
                    category: "smell",
                    severity: rule.severity,
                    message: rule.message.replace("{threshold}", rule.threshold || ""),
                    explanation: rule.explanation,
                    line: index + 1,
                    deduction: rule.points_deduction || 0
                });
            }
        });
    });

    return issues;
}

/* ---------- Helper: Detect Loop Counters ---------- */
function isLoopCounter(line) {
    return /for\s*\(\s*(let|var)\s+[ijk]\s*=/.test(line);
}
