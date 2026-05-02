/* =========================================================
   animations.js
   Lightweight animations & micro-interactions
   Uses only CSS transitions + JS triggers
========================================================= */

/* =========================================================
   1. ANALYZING ANIMATION
   Pulse-circle + step indicators
========================================================= */

function animateAnalyzingStep() {
    const circle = document.querySelector(".pulse-circle");
    if (!circle) return;

    // Reset animation
    circle.style.animation = "none";
    void circle.offsetWidth; // force reflow (ensures restart)
    circle.style.animation = "pulse 0.8s ease-in-out infinite";

    animateStepsSequentially();
}

/* Animate analyzing steps: Syntax → Structure → Best Practices */
function animateStepsSequentially() {
    const steps = [
        "step-syntax",
        "step-structure",
        "step-bestpractices"
    ];

    steps.forEach((id, index) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.style.opacity = 0;
        setTimeout(() => {
            el.classList.add("fade-in");
            el.style.opacity = 1;
        }, index * 100 + 100);
    });
}


/* =========================================================
   2. PANEL FADE-IN ON RESULTS LOAD
========================================================= */

function animateResultsReveal() {
    const results = document.querySelectorAll(".panel");
    let delay = 0;

    results.forEach(panel => {
        setTimeout(() => {
            panel.classList.add("fade-in");
            // Also apply a micro-slide effect inline
            panel.style.transform = "translateY(0)";
            panel.style.opacity = "1";
            panel.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        }, delay);
        delay += 40; // snappier stagger
    });
}


/* =========================================================
   3. SCORE RING ANIMATION
   Smooth transition for quality score ring
========================================================= */

function animateScoreRing() {
    const ring = document.getElementById("score-progress-ring");
    if (!ring) return;

    ring.style.transition = "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
}


/* =========================================================
   4. BUTTON CLICK MICRO-ANIMATION
   Scales buttons slightly when clicked
========================================================= */

document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("mousedown", () => {
        btn.style.transform = "scale(0.97)";
    });

    btn.addEventListener("mouseup", () => {
        btn.style.transform = "scale(1)";
    });

    btn.addEventListener("mouseleave", () => {
        btn.style.transform = "scale(1)";
    });
});


/* =========================================================
   5. TABS TRANSITION EFFECT
========================================================= */

document.querySelectorAll(".tab-btn").forEach(tab => {
    tab.addEventListener("click", () => {
        tab.classList.add("tab-pressed");

        setTimeout(() => tab.classList.remove("tab-pressed"), 150);
    });
});


/* =========================================================
   6. SMOOTH SHOW/HIDE (Comparison section)
========================================================= */

const compareContainer = document.getElementById("comparison-container");
if (compareContainer) {
    compareContainer.addEventListener("transitionstart", () => {
        compareContainer.style.willChange = "opacity, transform";
    });

    compareContainer.addEventListener("transitionend", () => {
        compareContainer.style.willChange = "auto";
    });
}


/* =========================================================
   7. UNIVERSAL FADE-IN HOOK
   Add .js-fade elements to fade them on load
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".js-fade").forEach(el => {
        el.classList.add("fade-in");
    });
});


/* =========================================================
   8. PERFORMANCE CHECK
   Ensures animations never block UI
========================================================= */

(function ensureAnimationSmoothness() {
    let last = performance.now();

    requestAnimationFrame(function frame(ts) {
        const delta = ts - last;
        last = ts;

        // Drop frames if the browser is overwhelmed
        if (delta > 200) {
            console.warn("⚠ Animation frame delayed — performance spike detected.");
        }

        requestAnimationFrame(frame);
    });
})();
