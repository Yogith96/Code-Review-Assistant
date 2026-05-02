/* =========================================================
   regexEngine.js
   Performs regex-based issue detection using rules.json
========================================================= */

const fs = require("fs");
const path = require("path");

let RULES = null;

/* ---------- Load Rules from JSON ---------- */
(function loadRules() {
    try {
        const filePath = path.join(__dirname, "../data/rules.json");
        RULES = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
        console.error("❌ Failed to load rules.json:", err);
        RULES = { categories: {} };
    }
})();

/* ---------- Helper: Normalize Issue Object ---------- */
function buildIssue(rule, lineNum, line) {
    return {
        id: rule.id,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        message: rule.message.replace("{threshold}", rule.threshold || ""),
        explanation: rule.explanation || "",
        line: lineNum,
        snippet: line.trim(),
        deduction: rule.points_deduction || 0
    };
}

/* ---------- Prevent false positives for loop counters ---------- */
function isLoopVariable(line, rule) {
    if (rule.name !== "single_letter_vars") return false;
    return /for\s*\(\s*(let|var|const)\s+[ijk]\s*=/.test(line);
}

/* ---------- Main Engine ---------- */
async function runAllChecks(code) {
    if (!RULES.categories) return [];

    const lines = code.split("\n");
    const results = [];

    const categories = [
        "beginner_mistakes",
        "code_smells",
        "naming_conventions",
        "best_practices"
    ];

    categories.forEach(category => {
        const group = RULES.categories[category];
        if (!group?.rules) return;

        group.rules.forEach(rule => {
            if (!rule.pattern) return; // Skip rules without patterns (which require custom logic)

            lines.forEach((line, idx) => {
                if (isLoopVariable(line, rule)) return; // skip acceptable patterns

                // Create regex per-line to avoid lastIndex stale state with 'g' flag
                const regex = new RegExp(rule.pattern);
                if (regex.test(line)) {
                    results.push(buildIssue(rule, idx + 1, line));
                }
            });
        });
    });

    return mergeOverlapping(results);
}

/* ---------- Merge Duplicate or Overlapping Issues ---------- */
function mergeOverlapping(list) {
    const map = {};
    list.forEach(l => {
        const key = `${l.id}-${l.line}`;
        if (!map[key]) map[key] = l;
    });
    return Object.values(map);
}

module.exports = { runAllChecks };
