/* ════════════════════════════════════════════════════════
   editor.js — Code editor functionality
   ════════════════════════════════════════════════════════ */

/* ---------- Example Programs ---------- */
const EXAMPLES = {
  javascript: `function calculateValue(x) {
  var temp = 0;
  if (x > 10) {
    console.log("Debug: x is large");
    temp = x * 2
  }
  return temp
}

const result = calculateValue(15);
console.log("Result:", result);`,

  python: `def calculate_value(x):
    temp = 0
    if x > 10:
        print("Debug: x is large")
        temp = x * 2
    return temp

result = calculate_value(15)
print("Result:", result)`,

  typescript: `function calculateValue(x: number): number {
  var temp: number = 0;
  if (x > 10) {
    console.log("Debug: x is large");
    temp = x * 2;
  }
  return temp;
}

const result: number = calculateValue(15);
console.log(result);`,

  java: `public class Calculator {
    public static int calculateValue(int x) {
        int temp = 0;
        if (x > 10) {
            System.out.println("Debug: x is large");
            temp = x * 2;
        }
        return temp;
    }

    public static void main(String[] args) {
        int result = calculateValue(15);
        System.out.println("Result: " + result);
    }
}`,

  cpp: `#include <iostream>
using namespace std;

int calculateValue(int x) {
    int temp = 0;
    if (x > 10) {
        cout << "Debug: x is large" << endl;
        temp = x * 2;
    }
    return temp;
}

int main() {
    int result = calculateValue(15);
    cout << "Result: " << result << endl;
    return 0;
}`
};

/* ---------- Editor State ---------- */
let editorReady = false;

function initEditor() {
  const editor = document.getElementById('codeEditor');
  if (!editor) return;

  // Tab key support
  editor.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;

      if (e.shiftKey) {
        // Unindent: remove leading two spaces
        const beforeCursor = this.value.substring(0, start);
        const lineStart = beforeCursor.lastIndexOf('\n') + 1;
        const linePrefix = this.value.substring(lineStart, start);
        if (linePrefix.startsWith('  ')) {
          this.value = this.value.substring(0, lineStart) + this.value.substring(lineStart + 2);
          this.selectionStart = this.selectionEnd = start - 2;
        }
      } else {
        // Indent: insert two spaces
        this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;
      }
      updateMeta();
    }

    // Auto-close brackets
    const pairs = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };
    if (pairs[e.key]) {
      const start = this.selectionStart;
      const end = this.selectionEnd;
      if (start !== end) {
        // Wrap selection
        e.preventDefault();
        const selected = this.value.substring(start, end);
        this.value = this.value.substring(0, start) + e.key + selected + pairs[e.key] + this.value.substring(end);
        this.selectionStart = start + 1;
        this.selectionEnd = end + 1;
        updateMeta();
      }
    }

    // Enter: auto-indent
    if (e.key === 'Enter') {
      const start = this.selectionStart;
      const beforeCursor = this.value.substring(0, start);
      const currentLine = beforeCursor.split('\n').pop();
      const indent = currentLine.match(/^\s*/)[0];
      const lastChar = beforeCursor.trim().slice(-1);

      // Extra indent after { or :
      let extra = '';
      if (lastChar === '{' || lastChar === ':') {
        extra = '  ';
      }

      if (indent || extra) {
        e.preventDefault();
        const insertion = '\n' + indent + extra;
        this.value = this.value.substring(0, start) + insertion + this.value.substring(this.selectionEnd);
        this.selectionStart = this.selectionEnd = start + insertion.length;
        updateMeta();
      }
    }
  });

  editor.addEventListener('input', updateMeta);
  editor.addEventListener('scroll', syncScroll);

  editorReady = true;
  loadExample();
}

/* ---------- Utilities ---------- */
function updateMeta() {
  const editor = document.getElementById('codeEditor');
  if (!editor) return;

  const code = editor.value;
  const lines = code.split('\n').length;

  const lineCountEl = document.getElementById('lineCount');
  const charCountEl = document.getElementById('charCount');
  if (lineCountEl) lineCountEl.textContent = 'Ln ' + lines;
  if (charCountEl) charCountEl.textContent = 'Ch ' + code.length;

  // Update line numbers
  const ln = document.getElementById('lineNumbers');
  if (ln) {
    ln.innerHTML = Array.from({length: lines}, (_, i) => `<span>${i + 1}</span>`).join('');
  }
}

function syncScroll() {
  const editor = document.getElementById('codeEditor');
  const ln = document.getElementById('lineNumbers');
  if (editor && ln) {
    ln.scrollTop = editor.scrollTop;
  }
}

function clearEditor() {
  const editor = document.getElementById('codeEditor');
  if (editor) {
    editor.value = '';
    updateMeta();
  }
}

function loadExample() {
  const lang = document.getElementById('langSelect');
  const editor = document.getElementById('codeEditor');
  if (!lang || !editor) return;

  editor.value = EXAMPLES[lang.value] || EXAMPLES.javascript;
  updateMeta();
}

function getEditorCode() {
  const editor = document.getElementById('codeEditor');
  return editor ? editor.value : '';
}

function getLanguage() {
  const lang = document.getElementById('langSelect');
  return lang ? lang.value : 'javascript';
}

function setEditorCode(code) {
  const editor = document.getElementById('codeEditor');
  if (editor) {
    editor.value = code;
    updateMeta();
  }
}
