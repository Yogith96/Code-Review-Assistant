/* =========================================================
   tips.js
   Generates learning tips based on issues + tips.json data
========================================================= */

let TIPS_DATA = null;

/* ---------- Load Tips Data ---------- */
(async function loadTips() {
    try {
        const res = await fetch("/data/tips.json");
        TIPS_DATA = await res.json();
    } catch (err) {
        console.error("❌ Failed to load tips.json:", err);
        TIPS_DATA = { categories: {}, general_tips: [] };
    }
})();

/* ---------- Select Relevant Tips Based on Issues ---------- */
function generateLearningTips(issueList) {
    if (!issueList?.length || !TIPS_DATA.categories) return [];

    const selected = new Set();

    issueList.forEach(issue => {
        const category = TIPS_DATA.categories[issue.category];
        if (!category) return;

        if (category.tips && Array.isArray(category.tips)) {
            category.tips.forEach(t => selected.add(JSON.stringify(t)));
        }
    });

    const directTips = [...selected].map(t => JSON.parse(t));

    const general = chooseGeneralTips(2);

    const bonus = pickRandomInstructorWisdom();

    return {
        direct: directTips.slice(0, 4),
        general,
        bonus
    };
}

/* ---------- Choose General Tips ---------- */
function chooseGeneralTips(n) {
    if (!TIPS_DATA.general_tips?.length) return [];

    const shuffled = [...TIPS_DATA.general_tips].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}

/* ---------- Random Instructor Wisdom ---------- */
function pickRandomInstructorWisdom() {
    const pool = [
        "Code is read more often than it's written — write for the next person.",
        "Simplify first, optimize later.",
        "If a function is hard to name, it’s doing too much.",
        "Deep nesting is the enemy of readability — prefer early returns.",
        "Write comments explaining WHY, not WHAT."
    ];
    return pool[Math.floor(Math.random() * pool.length)];
}

/* ---------- Render Tips to UI ---------- */
function populateTips(tipData) {
    const container = document.getElementById("tips-container");
    if (!container) return;
    container.innerHTML = "";

    const { direct = [], general = [], bonus = null } = tipData || {};

    const allTips = [
        ...direct.map(t => t.title + ": " + t.content),
        ...general.map(t => t.title + ": " + t.content),
    ];
    if (bonus) allTips.push(bonus);

    const ul = document.createElement("ul");
    allTips.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        ul.appendChild(li);
    });
    container.appendChild(ul);
}
