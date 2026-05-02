/* ════════════════════════════════════════════════════════
   resizer.js — Draggable panel resizers
   ════════════════════════════════════════════════════════ */

function initResizers() {
  initVerticalResizer();
  initHorizontalResizer();
}

/* ---------- Vertical Resizer (Left ↔ Right) ---------- */
function initVerticalResizer() {
  const resizer = document.getElementById('resizerVertical');
  const leftPanel = document.querySelector('.panel-left');
  const container = document.querySelector('.app-container');
  if (!resizer || !leftPanel || !container) return;

  let startX, startWidth;

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startWidth = leftPanel.offsetWidth;
    document.body.classList.add('resizing');
    resizer.classList.add('active');

    function onMouseMove(e) {
      const dx = e.clientX - startX;
      const containerWidth = container.offsetWidth;
      const newWidth = startWidth + dx;

      // Enforce min/max widths
      const minW = 280;
      const maxW = containerWidth - 280 - 5; // 5 for resizer width

      if (newWidth >= minW && newWidth <= maxW) {
        leftPanel.style.width = newWidth + 'px';
        leftPanel.style.flexShrink = '0';
        leftPanel.style.flexGrow = '0';
      }
    }

    function onMouseUp() {
      document.body.classList.remove('resizing');
      resizer.classList.remove('active');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

/* ---------- Horizontal Resizer (Top ↔ Bottom in right panel) ---------- */
function initHorizontalResizer() {
  const resizer = document.getElementById('resizerHorizontal');
  const outputPanel = document.querySelector('.panel-output');
  const rightPanel = document.querySelector('.panel-right');
  if (!resizer || !outputPanel || !rightPanel) return;

  let startY, startHeight;

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startY = e.clientY;
    startHeight = outputPanel.offsetHeight;
    document.body.classList.add('resizing-h');
    resizer.classList.add('active');

    function onMouseMove(e) {
      const dy = e.clientY - startY;
      const rightHeight = rightPanel.offsetHeight;
      const newHeight = startHeight + dy;

      // Enforce min/max heights
      const minH = 80;
      const maxH = rightHeight - 80 - 5; // 5 for resizer height

      if (newHeight >= minH && newHeight <= maxH) {
        outputPanel.style.height = newHeight + 'px';
        outputPanel.style.flexShrink = '0';
        outputPanel.style.flexGrow = '0';
      }
    }

    function onMouseUp() {
      document.body.classList.remove('resizing-h');
      resizer.classList.remove('active');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}
