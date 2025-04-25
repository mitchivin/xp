/**
 * @fileoverview Shared utility for handling the 'Exit' action in all XP simulation apps.
 * If running in an iframe, sends a message to the parent to close the window.
 * If running standalone, attempts to close the browser window/tab.
 *
 * Usage:
 *   import { handleExit } from './common.js';
 *   handleExit();
 *
 * Edge Cases:
 *   - Most browsers will block window.close() unless the window was opened by script.
 *   - If not in an iframe and window cannot be closed, nothing will happen.
 */
/**
 * Handles the 'Exit' action for an app window.
 *
 * - If in an iframe, sends a postMessage to the parent requesting window close.
 * - If not in an iframe, attempts to close the window (may be blocked by browser).
 *
 * @returns {void}
 * @example
 * handleExit(); // Closes the app window or sends a close message to parent
 */
export function handleExit() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'close-window' }, '*');
  } else {
    window.close();
  }
} 