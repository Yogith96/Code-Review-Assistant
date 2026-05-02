/* =========================================================
   export.js
   Export analysis results as TXT or JSON
========================================================= */

document.getElementById("export-txt")?.addEventListener("click", () => {
    const data = gatherExportData();
    downloadTextFile(formatAsText(data), "code-review-report.txt");
});

document.getElementById("export-json")?.addEventListener("click", () => {
    const data = gatherExportData();
    downloadJSONFile(data, "code-review-report.json");
});

document.getElementById("export-md")?.addEventListener("click", () => {
    const data = gatherExportData();
    downloadTextFile(formatAsMarkdown(data), "code-review-report.md");
});

document.getElementById("copy-code-btn")?.addEventListener("click", async () => {
    const code = document.getElementById("after-code")?.textContent || "";
    if (!code) return;
    try {
        await navigator.clipboard.writeText(code);
        const btn = document.getElementById("copy-code-btn");
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="icon">✅</span> Copied!`;
        setTimeout(() => btn.innerHTML = originalText, 2000);
    } catch (err) {
        console.error("Failed to copy code: ", err);
    }
});

document.getElementById("apply-fix-btn")?.addEventListener("click", () => {
    const code = document.getElementById("after-code")?.textContent || "";
    if (!code || !window.codeEditor) return;
    
    // Replace current editor content
    window.codeEditor.setValue(code);
    
    // visual feedback
    const btn = document.getElementById("apply-fix-btn");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="icon">✅</span> Applied`;
    
    // Optional: Hide results and return to editor focus
    setTimeout(() => {
        btn.innerHTML = originalText;
        // Scroll back up to the editor
        document.querySelector(".editor-panel").scrollIntoView({ behavior: 'smooth' });
    }, 1500);
});

/* ---------- Collect All Data ---------- */
function gatherExportData() {
    return {
        score: document.getElementById("quality-score")?.textContent || "N/A",
        readability: document.getElementById("readability-score")?.textContent,
        structure: document.getElementById("structure-score")?.textContent,
        naming: document.getElementById("naming-score")?.textContent,
        before: document.getElementById("before-code")?.textContent || "",
        after: document.getElementById("after-code")?.textContent || "",
        issues: gatherIssues(),
        exportedAt: new Date().toISOString()
    };
}

/* ---------- Extract Issue Lists ---------- */
function gatherIssues() {
    const types = ["errors", "warnings", "suggestions"];
    const collected = {};

    types.forEach(type => {
        const container = document.getElementById(`${type}-list`);
        if (!container) return;

        const items = [];
        container.querySelectorAll(".issue-item").forEach(div => {
            const lines = div.innerText.split("\n");
            items.push(lines.join(" "));
        });

        collected[type] = items;
    });

    return collected;
}

/* ---------- Format TXT Output ---------- */
function formatAsText(data) {
    return `
CODE REVIEW REPORT
==============================

Score: ${data.score}
Readability: ${data.readability}
Structure: ${data.structure}
Naming: ${data.naming}

------------------------------
Detected Issues
------------------------------
Errors:
${data.issues.errors.join("\n")}

Warnings:
${data.issues.warnings.join("\n")}

Suggestions:
${data.issues.suggestions.join("\n")}

------------------------------
Original Code
------------------------------
${data.before}

------------------------------
Improved Code
------------------------------
${data.after}

Generated At: ${data.exportedAt}
`;
}

/* ---------- Format Markdown Output ---------- */
function formatAsMarkdown(data) {
    return `# Code Review Report

**Score:** ${data.score}
- **Readability:** ${data.readability}
- **Structure:** ${data.structure}
- **Naming:** ${data.naming}

## Detected Issues

### Errors ❌
${data.issues.errors.map(err => `- ${err}`).join("\n") || "No errors."}

### Warnings ⚠️
${data.issues.warnings.map(warn => `- ${warn}`).join("\n") || "No warnings."}

### Suggestions 💡
${data.issues.suggestions.map(sugg => `- ${sugg}`).join("\n") || "No suggestions."}

---

## Original Code
\`\`\`javascript
${data.before}
\`\`\`

## Improved Code (Suggested)
\`\`\`javascript
${data.after}
\`\`\`

*Generated at: ${data.exportedAt}*
`;
}

/* ---------- Download Helpers ---------- */
function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

function downloadJSONFile(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}
