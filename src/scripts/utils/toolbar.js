/**
 * Shared Toolbar Utility for Windows XP-style UI
 *
 * Usage:
 *   import { setupToolbar } from '../../../src/scripts/utils/toolbar.js';
 *   setupToolbar({
 *     '.back': () => { ... },
 *     '.forward': () => { ... },
 *     '.photos': () => { ... },
 *     // ...
 *   });
 */
export function setupToolbar(actionMap = {}) {
  const toolbarRow = document.querySelector('.toolbar-row');
  if (!toolbarRow) return;

  // Find all enabled toolbar buttons (not .disabled)
  const buttons = toolbarRow.querySelectorAll('div:not(.disabled)');

  buttons.forEach(btn => {
    // Determine selector or data-action for this button
    let selector = null;
    // Prefer a class as the selector
    if (btn.classList.length > 0) {
      selector = '.' + Array.from(btn.classList).join('.');
    }
    // If a data-action is present, use that as a fallback
    if (!selector && btn.hasAttribute('data-action')) {
      selector = `[data-action="${btn.getAttribute('data-action')}"]`;
    }
    // Attach click handler if provided in actionMap
    if (selector && actionMap[selector]) {
      btn.addEventListener('click', (e) => {
        actionMap[selector](e);
      });
    }
  });
} 