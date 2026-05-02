/* ════════════════════════════════════════════════════════
   reviewer.js — Code review / analysis functionality
   ════════════════════════════════════════════════════════ */

let lastAnalysis = null;
let currentTab = 'all';

/* ---------- Run Analysis ---------- */
async function runAnalysis() {
  const code = getEditorCode().trim();
  if (!code) return;

  const btn = document.getElementById('analyzeBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-inline"></span> Analyzing…';
  }

  // Show loading in review panel
  showReviewLoading();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Backend returned ' + response.status);

    const data = await response.json();

    if (data.success && data.analysis) {
      lastAnalysis = data.analysis;
      renderResults(data.analysis);
    } else {
      throw new Error('Invalid API response');
    }
  } catch (err) {
    console.warn('Analysis failed:', err);
    lastAnalysis = null;
    showReviewError(err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🔍 Review';
    }
  }
}

/* ---------- Show Loading ---------- */
function showReviewLoading() {
  const body = document.getElementById('reviewBody');
  if (!body) return;
  body.innerHTML = `
    <div style="padding:32px;text-align:center;">
      <div class="spinner" style="margin:0 auto 12px;"></div>
      <div style="font-size:13px;color:var(--text-muted);">Analyzing your code…</div>
    </div>`;
}

/* ---------- Show Error ---------- */
function showReviewError(msg) {
  const body = document.getElementById('reviewBody');
  if (!body) return;
  body.innerHTML = `
    <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">
      Could not reach the analysis server.<br>
      <small style="margin-top:4px;display:inline-block;">${escapeHtml(msg)}</small>
    </div>`;
}

/* ---------- Render Results ---------- */
function renderResults(analysis) {
  const body = document.getElementById('reviewBody');
  if (!body) return;

  // Build the results HTML
  const score = analysis.totalScore;
  const bd = analysis.breakdown || {};
  const r = bd.readability ?? 100, s = bd.structure ?? 100, n = bd.naming ?? 100;

  const issues = analysis.issues || [];
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const suggestions = issues.filter(i => i.severity === 'suggestion');

  // Tip pool
  const tipPool = [
    "Code is read more often than it's written — write for the next person.",
    "Simplify first, optimize later.",
    "If a function is hard to name, it's doing too much.",
    "Deep nesting is the enemy of readability — prefer early returns.",
    "Write comments explaining WHY, not WHAT.",
    "A good variable name eliminates the need for a comment.",
    "Small functions are easier to test, debug, and reuse."
  ];
  const tips = [tipPool[Math.floor(Math.random() * tipPool.length)]];

  // Build HTML
  body.innerHTML = `
    <!-- Score -->
    <div class="score-row" id="scoreSection">
      <div class="score-ring-wrap">
        <svg class="score-ring-svg" viewBox="0 0 56 56">
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#6b5cf6"/>
              <stop offset="100%" style="stop-color:#9b8af8"/>
            </linearGradient>
          </defs>
          <circle class="score-ring-bg" cx="28" cy="28" r="25"/>
          <circle class="score-ring-fill" id="scoreRing" cx="28" cy="28" r="25"/>
        </svg>
        <div class="score-number">
          <span class="score-val" id="scoreVal">0</span>
          <span class="score-label">/ 100</span>
        </div>
      </div>
      <div class="score-metrics">
        <div class="metric-mini">
          <div class="metric-mini-name">Read</div>
          <div class="metric-mini-val" id="readabilityVal">${r}</div>
          <div class="metric-mini-bar"><div class="metric-mini-bar-fill" id="readabilityBar" style="width:0%"></div></div>
        </div>
        <div class="metric-mini">
          <div class="metric-mini-name">Struct</div>
          <div class="metric-mini-val" id="structureVal">${s}</div>
          <div class="metric-mini-bar"><div class="metric-mini-bar-fill" id="structureBar" style="width:0%"></div></div>
        </div>
        <div class="metric-mini">
          <div class="metric-mini-name">Name</div>
          <div class="metric-mini-val" id="namingVal">${n}</div>
          <div class="metric-mini-bar"><div class="metric-mini-bar-fill" id="namingBar" style="width:0%"></div></div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="review-tabs">
      <button class="tab-btn active" data-tab="all" onclick="filterTab('all')">All</button>
      <button class="tab-btn" data-tab="errors" onclick="filterTab('errors')">
        <span class="tab-icon">✕</span> Errors <span class="tab-count" id="errCount">${errors.length}</span>
      </button>
      <button class="tab-btn" data-tab="warnings" onclick="filterTab('warnings')">
        <span class="tab-icon">⚠</span> Warns <span class="tab-count" id="warnCount">${warnings.length}</span>
      </button>
      <button class="tab-btn" data-tab="suggestions" onclick="filterTab('suggestions')">
        <span class="tab-icon">💡</span> Suggest <span class="tab-count" id="sugCount">${suggestions.length}</span>
      </button>
      <button class="tab-btn" data-tab="tips" onclick="filterTab('tips')">
        <span class="tab-icon">📘</span> Tips <span class="tab-count" id="tipCount">${tips.length}</span>
      </button>
    </div>

    <!-- Feed -->
    <div class="review-feed" id="reviewFeed"></div>

    <!-- Comparison -->
    <div style="padding: 8px 16px;">
      <div class="comparison-header">
        <div class="comparison-title">Code Improvement</div>
        <div style="display:flex;gap:6px;">
          <button class="apply-fix-btn" id="applyFixBtn" onclick="applyFix()">✨ Apply Fix</button>
          <button class="comparison-toggle" onclick="toggleComparison()">
            <span id="toggleIcon">▶</span>
            <span id="toggleText">Show Diff</span>
          </button>
        </div>
      </div>
      <div class="comparison-section" id="comparisonSection">
        <div class="comparison-grid">
          <div class="comparison-pane before">
            <div class="comparison-pane-header">✕ Before</div>
            <pre class="comparison-code" id="beforeCode"></pre>
          </div>
          <div class="comparison-pane after">
            <div class="comparison-pane-header">✓ After</div>
            <pre class="comparison-code" id="afterCode"></pre>
          </div>
        </div>
      </div>
    </div>
  `;

  // Enable export
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.disabled = false;

  // Animate score
  const scoreEl = document.getElementById('scoreVal');
  const ring = document.getElementById('scoreRing');
  if (scoreEl && ring) {
    scoreEl.textContent = score;
    const circumference = 2 * Math.PI * 25;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;
    setTimeout(() => {
      ring.style.strokeDashoffset = circumference - (score / 100) * circumference;
    }, 50);
  }

  // Animate bars
  setTimeout(() => {
    const rb = document.getElementById('readabilityBar');
    const sb = document.getElementById('structureBar');
    const nb = document.getElementById('namingBar');
    if (rb) rb.style.width = r + '%';
    if (sb) sb.style.width = s + '%';
    if (nb) nb.style.width = n + '%';
  }, 100);

  // Build review items
  const feed = document.getElementById('reviewFeed');
  if (!feed) return;

  const iconMap = { error: '✕', warning: '⚠', suggestion: '💡', tip: '📘' };
  const labelMap = { error: 'Error', warning: 'Warning', suggestion: 'Suggestion', tip: 'Learning Tip' };

  function addItem(type, title, line, desc) {
    const div = document.createElement('div');
    div.className = 'review-item';
    div.dataset.type = type;
    div.innerHTML = `
      <div class="review-icon-wrap">${iconMap[type]}</div>
      <div class="review-content">
        <div class="review-type-chip">${labelMap[type]}</div>
        <div class="review-header">
          <span class="review-title">${escapeHtml(title)}</span>
          <span class="review-line-badge">${line ? 'Line ' + line : 'General'}</span>
        </div>
        <p class="review-desc">${escapeHtml(desc)}</p>
      </div>`;
    feed.appendChild(div);
  }

  errors.forEach(i => addItem('error', i.message, i.line, i.explanation || ''));
  warnings.forEach(i => addItem('warning', i.message, i.line, i.explanation || ''));
  suggestions.forEach(i => addItem('suggestion', i.message, i.line, i.explanation || ''));
  tips.forEach(t => addItem('tip', t, null, 'Keep this principle in mind as you write and review code.'));

  // Before / After
  const beforeEl = document.getElementById('beforeCode');
  const afterEl = document.getElementById('afterCode');
  if (beforeEl) beforeEl.textContent = analysis.before || '';
  if (afterEl) afterEl.textContent = analysis.after || '';

  // Auto-select tab with most items
  if (errors.length) filterTab('errors');
  else if (warnings.length) filterTab('warnings');
  else if (suggestions.length) filterTab('suggestions');
  else filterTab('all');
}

/* ---------- Tab Filtering ---------- */
function filterTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.review-item').forEach(item => {
    const type = item.dataset.type;
    const show = tab === 'all'
      || (tab === 'errors'     && type === 'error')
      || (tab === 'warnings'   && type === 'warning')
      || (tab === 'suggestions'&& type === 'suggestion')
      || (tab === 'tips'       && type === 'tip');
    item.classList.toggle('hidden', !show);
    if (show) {
      item.style.animationName = 'none';
      item.offsetHeight;
      item.style.animationName = 'slideIn';
    }
  });
}

/* ---------- Comparison ---------- */
let compOpen = false;

function toggleComparison() {
  compOpen = !compOpen;
  const section = document.getElementById('comparisonSection');
  const icon = document.getElementById('toggleIcon');
  const text = document.getElementById('toggleText');
  if (section) section.style.display = compOpen ? 'block' : 'none';
  if (icon) icon.textContent = compOpen ? '▼' : '▶';
  if (text) text.textContent = compOpen ? 'Hide Diff' : 'Show Diff';
}

function applyFix() {
  const afterCode = document.getElementById('afterCode');
  if (!afterCode || !afterCode.textContent) return;
  setEditorCode(afterCode.textContent);

  const btn = document.getElementById('applyFixBtn');
  if (btn) {
    btn.innerHTML = '✅ Applied!';
    setTimeout(() => { btn.innerHTML = '✨ Apply Fix'; }, 1200);
  }
}

/* ---------- Export ---------- */
function handleExport() {
  if (!lastAnalysis) return;

  const lines = [];
  lines.push('CODE REVIEW REPORT');
  lines.push('='.repeat(40));
  lines.push('');
  lines.push('Score: ' + lastAnalysis.totalScore + ' / 100');
  if (lastAnalysis.breakdown) {
    lines.push('Readability: ' + (lastAnalysis.breakdown.readability ?? '—'));
    lines.push('Structure: '   + (lastAnalysis.breakdown.structure ?? '—'));
    lines.push('Naming: '      + (lastAnalysis.breakdown.naming ?? '—'));
  }
  lines.push('');
  lines.push('-'.repeat(40));
  lines.push('ISSUES');
  lines.push('-'.repeat(40));
  (lastAnalysis.issues || []).forEach(issue => {
    lines.push(`[${issue.severity.toUpperCase()}] Line ${issue.line}: ${issue.message}`);
    if (issue.explanation) lines.push('  → ' + issue.explanation);
    lines.push('');
  });
  lines.push('-'.repeat(40));
  lines.push('Generated at: ' + new Date().toISOString());

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'code-review-report.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
