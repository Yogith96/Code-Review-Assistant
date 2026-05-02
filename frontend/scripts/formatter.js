/* =========================================================
   formatter.js
   Creates a cleaner "Improved Version" of user code
========================================================= */

let EXAMPLES = [];

/* ---------- Load Improved Example Versions ---------- */
(async function loadExamples() {
    try {
        const res = await fetch("data/examples.json");
        const json = await res.json();
        EXAMPLES = json.examples;
    } catch (err) {
        console.error("❌ Failed to load examples:", err);
        EXAMPLES = [];
    }
})();

/* ---------- Main Formatter ---------- */
function formatImprovedVersion(code) {
    if (!code.trim()) return code;

    // 1. Try example dataset matching
    const match = findMatchingExample(code);
    if (match) return match.improvedVersion.trim();

    // 2. Otherwise apply lightweight transformations
    let cleaned = code;

    cleaned = removeConsoleLogs(cleaned);
    cleaned = replaceVarWithLetConst(cleaned);
    cleaned = autoFixSemicolons(cleaned);
    cleaned = normalizeIndentation(cleaned);
    cleaned = suggestArrowFunctions(cleaned);
    cleaned = preferTemplateLiterals(cleaned);

    return cleaned.trim();
}

/* ---------- Example Based Matching ---------- */
function findMatchingExample(userCode) {
    return EXAMPLES.find(ex => similarity(ex.code, userCode) >= 0.6);
}

/* Simple similarity measure */
function similarity(a, b) {
    const clean = s => s.replace(/\s+/g, "");
    return clean(a).length && clean(b).length
        ? Math.min(clean(a).length, clean(b).length) / Math.max(clean(a).length, clean(b).length)
        : 0;
}

/* ---------- Transformations ---------- */

function removeConsoleLogs(code) {
    return code.replace(/console\.log\(.*?\);?/g, "");
}

function replaceVarWithLetConst(code) {
    return code.replace(/\bvar\b/g, "let");
}

function autoFixSemicolons(code) {
    return code
        .split("\n")
        .map(line => {
            if (line.trim().length === 0) return line;
            if (/[;{}]$/.test(line.trim())) return line; // already OK
            if (line.trim().startsWith("//")) return line;
            return line + ";";
        })
        .join("\n");
}

function normalizeIndentation(code) {
    const lines = code.split("\n");
    let indent = 0;

    return lines
        .map(line => {
            const trimmed = line.trim();
            if (trimmed.endsWith("}")) indent--;

            const formatted = "    ".repeat(Math.max(indent, 0)) + trimmed;

            if (trimmed.endsWith("{")) indent++;

            return formatted;
        })
        .join("\n");
}

function suggestArrowFunctions(code) {
    return code.replace(/function\s*\((.*?)\)\s*\{/g, "($1) => {");
}

function preferTemplateLiterals(code) {
    return code.replace(/(['"])(.*?)\1\s*\+\s*(\w+)/g, "`$2 \${$3}`");
}
