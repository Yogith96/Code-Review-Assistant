/* =========================================================
   formatterEngine.js
   Produces improved code using examples.json + transformations
========================================================= */

const fs = require("fs");
const path = require("path");

let EXAMPLES = [];

/* ---------- Load Examples JSON ---------- */
(function loadExamples() {
    try {
        const filePath = path.join(__dirname, "../data/examples.json");
        const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
        EXAMPLES = json.examples || [];
    } catch (err) {
        console.error("❌ Failed to load examples.json:", err);
        EXAMPLES = [];
    }
})();

/* ---------- Main Formatter ---------- */
function generateImprovedVersion(code) {
    if (!code.trim()) return code;

    // 1. Try matching examples
    const ex = findMatchingExample(code);
    if (ex) return ex.improvedVersion.trim();

    // 2. Apply transformations
    let cleaned = code;
    cleaned = removeConsoleLogs(cleaned);
    cleaned = replaceVar(cleaned);
    cleaned = addMissingSemicolons(cleaned);
    cleaned = indentBlocks(cleaned);
    cleaned = arrowFunctions(cleaned);
    cleaned = templateStrings(cleaned);

    return cleaned.trim();
}

/* ---------- Example Matcher ---------- */
function findMatchingExample(user) {
    const tokenize = s => new Set(s.replace(/\s+/g, " ").trim().split(/[\s;{}()\[\],]+/).filter(Boolean));
    const userTokens = tokenize(user);
    if (userTokens.size === 0) return null;

    for (let ex of EXAMPLES) {
        const exTokens = tokenize(ex.code);
        if (exTokens.size === 0) continue;

        // Jaccard similarity: intersection / union
        let intersection = 0;
        for (const t of userTokens) {
            if (exTokens.has(t)) intersection++;
        }
        const union = new Set([...userTokens, ...exTokens]).size;
        const similarity = intersection / union;

        if (similarity >= 0.5) return ex;
    }
    return null;
}

/* ---------- Transformations ---------- */

function removeConsoleLogs(str) {
    return str.replace(/console\.log\(.*?\);?/g, "");
}

function replaceVar(str) {
    return str.replace(/\bvar\b/g, "let");
}

function addMissingSemicolons(str) {
    return str.split("\n").map(line => {
        const trimmed = line.trim();

        if (!trimmed) return line;
        if (/[;{}]$/.test(trimmed)) return line;
        if (trimmed.startsWith("//")) return line;

        return line + ";";
    }).join("\n");
}

function indentBlocks(str) {
    const lines = str.split("\n");
    let indent = 0;
    return lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.endsWith("}")) indent--;

        const formatted = "    ".repeat(Math.max(indent, 0)) + trimmed;

        if (trimmed.endsWith("{")) indent++;

        return formatted;
    }).join("\n");
}

function arrowFunctions(str) {
    return str.replace(/function\s*\((.*?)\)\s*\{/g, "($1) => {");
}

function templateStrings(str) {
    return str.replace(/(["'])(.*?)\1\s*\+\s*(\w+)/g, "`$2 \${$3}`");
}

module.exports = { generateImprovedVersion };
