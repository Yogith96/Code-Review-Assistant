/* =========================================================
   beginner-checks.js
   Beginner Mistake Detector using rules.json
========================================================= */

let BEGINNER_RULES = [];

(async function loadRules() {
    try {
        const res = await fetch("data/rules.json");
        const json = await res.json();
        BEGINNER_RULES = json.categories.beginner_mistakes.rules;
    } catch (err) {
        console.error("❌ Failed to load beginner rules:", err);
        BEGINNER_RULES = [];
    }
})();

/* ---------- Main Function ---------- */
function detectBeginnerMistakes(code) {
    if (!BEGINNER_RULES.length) return [];

    const lines = code.split("\n");
    const issues = [];

    BEGINNER_RULES.forEach(rule => {
        if (!rule.pattern) return;
        const regex = new RegExp(rule.pattern, "g");

        lines.forEach((line, index) => {
            if (regex.test(line)) {
                issues.push({
                    id: rule.id,
                    category: "beginner",
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
