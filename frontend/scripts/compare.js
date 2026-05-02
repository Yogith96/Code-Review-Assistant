/* =========================================================
   compare.js
   Before/After Comparison Management
========================================================= */

const beforeCodeEl = document.getElementById("before-code");
const afterCodeEl = document.getElementById("after-code");

/* ---------- Sync Scrolling ---------- */
beforeCodeEl?.addEventListener("scroll", () => syncScroll(beforeCodeEl, afterCodeEl));
afterCodeEl?.addEventListener("scroll", () => syncScroll(afterCodeEl, beforeCodeEl));

function syncScroll(source, target) {
    if (!source || !target) return;
    target.scrollTop = source.scrollTop;
}

/* ---------- Visual Diff Highlight (simple) ---------- */
function highlightDifferences(before, after) {
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");

    beforeCodeEl.innerHTML = "";
    afterCodeEl.innerHTML = "";

    for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
        const beforeLine = beforeLines[i] || "";
        const afterLine = afterLines[i] || "";

        const beforeDiv = document.createElement("div");
        const afterDiv = document.createElement("div");

        beforeDiv.textContent = beforeLine;
        afterDiv.textContent = afterLine;

        if (beforeLine !== afterLine) {
            beforeDiv.style.background = "rgba(239,68,68,0.15)"; // red tint
            afterDiv.style.background = "rgba(16,185,129,0.15)"; // green tint
        }

        beforeCodeEl.appendChild(beforeDiv);
        afterCodeEl.appendChild(afterDiv);
    }
}

/* ---------- Triggered by “Show Comparison” button ---------- */
document.getElementById("toggle-comparison")?.addEventListener("click", () => {
    const before = beforeCodeEl.textContent;
    const after = afterCodeEl.textContent;
    highlightDifferences(before, after);
});
