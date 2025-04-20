/**
 * Shared utility for handling the 'Exit' action in all apps.
 * Closes the window or sends a close message to the parent if in an iframe.
 */
export function handleExit() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'close-window' }, '*');
  } else {
    window.close();
  }
} 