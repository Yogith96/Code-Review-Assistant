/* ════════════════════════════════════════════════════════
   runner.js — Code execution + output console
   ════════════════════════════════════════════════════════ */

let isRunning = false;

/* ---------- Run Code ---------- */
async function runCode() {
  const code = getEditorCode().trim();
  if (!code || isRunning) return;

  const language = getLanguage();
  isRunning = true;

  // Update UI
  const btn = document.getElementById('runBtn');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('running');
    btn.innerHTML = '<span class="spinner-inline"></span> Running…';
  }
  updateConsoleStatus('running');
  appendConsoleLine(`▶ Running ${language}…`, 'system');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned ${response.status}`);
    }

    const data = await response.json();

    // Display output
    if (data.output) {
      data.output.split('\n').forEach(line => {
        if (line) appendConsoleLine(line, 'info');
      });
    }

    // Display errors
    if (data.error) {
      data.error.split('\n').forEach(line => {
        if (line) appendConsoleLine(line, 'error');
      });
    }

    // Execution time
    if (data.executionTime !== undefined) {
      appendConsoleLine(`\n✓ Finished in ${data.executionTime}ms ${data.phase === 'compilation' ? '(compilation failed)' : ''}`, data.success ? 'success' : 'error');
    }

    // Show parsed error details
    if (data.errors && data.errors.length > 0) {
      appendConsoleLine('', 'system');
      appendConsoleLine(`── ${data.errors.length} error(s) detected ──`, 'system');
      data.errors.forEach(err => {
        const loc = err.line ? `Line ${err.line}${err.column ? ':' + err.column : ''}` : '';
        appendConsoleLine(`  ${loc}: ${err.message}`, 'error');
      });
    }

    updateConsoleStatus(data.success ? 'done' : 'error');

  } catch (err) {
    appendConsoleLine(`✕ Execution failed: ${err.message}`, 'error');

    // If it's a network error, attempt client-side execution for JavaScript
    if (language === 'javascript' && (err.message.includes('Failed to fetch') || err.message.includes('aborted'))) {
      appendConsoleLine('', 'system');
      appendConsoleLine('⟳ Attempting browser-side execution…', 'system');
      runJavaScriptLocally(code);
    }

    updateConsoleStatus('error');
  } finally {
    isRunning = false;
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('running');
      btn.innerHTML = '▶ Run';
    }
  }
}

/* ---------- Client-side JS Execution (Fallback) ---------- */
function runJavaScriptLocally(code) {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const logs = [];

  try {
    // Intercept console methods
    console.log = (...args) => {
      logs.push({ type: 'info', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') });
    };
    console.error = (...args) => {
      logs.push({ type: 'error', msg: args.map(a => String(a)).join(' ') });
    };
    console.warn = (...args) => {
      logs.push({ type: 'warning', msg: args.map(a => String(a)).join(' ') });
    };

    // Execute
    const fn = new Function(code);
    const result = fn();

    // Show captured output
    logs.forEach(l => appendConsoleLine(l.msg, l.type));

    if (result !== undefined) {
      appendConsoleLine(`→ ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`, 'success');
    }

    if (logs.length === 0 && result === undefined) {
      appendConsoleLine('(no output)', 'system');
    }

    appendConsoleLine('✓ Executed in browser', 'success');
    updateConsoleStatus('done');

  } catch (err) {
    logs.forEach(l => appendConsoleLine(l.msg, l.type));

    // Parse error for detailed reporting
    const errorType = err.constructor.name;
    const errorMsg = err.message;
    let lineInfo = '';

    // Try to extract line number from stack
    if (err.stack) {
      const match = err.stack.match(/<anonymous>:(\d+):(\d+)/);
      if (match) {
        lineInfo = ` (Line ${match[1]}, Col ${match[2]})`;
      }
    }

    appendConsoleLine(`${errorType}: ${errorMsg}${lineInfo}`, 'error');

    // Show stack trace
    if (err.stack) {
      const stackLines = err.stack.split('\n').slice(1, 4);
      stackLines.forEach(l => appendConsoleLine('  ' + l.trim(), 'error'));
    }

    updateConsoleStatus('error');
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }
}

/* ---------- Console Helpers ---------- */
function appendConsoleLine(text, type) {
  const body = document.getElementById('consoleBody');
  if (!body) return;

  // Remove welcome message if present
  const welcome = body.querySelector('.console-welcome');
  if (welcome) welcome.remove();

  const line = document.createElement('div');
  line.className = 'console-line ' + (type || '');
  line.textContent = text;
  body.appendChild(line);

  // Auto-scroll to bottom
  body.scrollTop = body.scrollHeight;
}

function clearConsole() {
  const body = document.getElementById('consoleBody');
  if (body) {
    body.innerHTML = `<div class="console-welcome">
      <div class="icon">⌨</div>
      <div class="title">Output Console</div>
      <div>Run your code to see output here</div>
    </div>`;
  }
  updateConsoleStatus('idle');
}

function updateConsoleStatus(status) {
  const dot = document.getElementById('consoleDot');
  const text = document.getElementById('consoleStatusText');
  if (!dot || !text) return;

  dot.className = 'dot ' + status;
  const labels = {
    idle: 'Ready',
    running: 'Running…',
    done: 'Completed',
    error: 'Error'
  };
  text.textContent = labels[status] || 'Ready';
}
