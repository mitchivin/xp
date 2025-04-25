import { setupMenuBar } from '../../../src/scripts/utils/menuBar.js';
import { setupToolbar } from '../../../src/scripts/utils/toolbar.js';
import { handleExit } from '../../../src/scripts/utils/common.js';

// Menu bar JS logic for Windows XP-style UI

document.addEventListener('DOMContentLoaded', () => {
  setupMenuBar({
    menuBarSelector: '.menu-bar',
    actions: {
      exit: handleExit
      // Add more menu actions as needed
    }
  });

  setupToolbar({
    '.photos': () => {
      // Example: Open Photo Viewer
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'open-app', app: 'my-pictures' }, '*');
      } else {
        // Standalone fallback: could show an alert or open a new window
        alert('Open Photo Viewer (not implemented in standalone mode)');
      }
    },
    '.videos': () => {
      // Example: Open Media Player
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'open-app', app: 'mediaPlayer' }, '*');
      } else {
        alert('Open Media Player (not implemented in standalone mode)');
      }
    }
    // Add more toolbar button actions as needed
  });

  // Add click handlers for left panel app links
  document.querySelectorAll('.left-panel__card__row[data-app]').forEach(row => {
    row.addEventListener('click', e => {
      e.preventDefault();
      const app = row.getAttribute('data-app');
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'open-app', app }, '*');
      } else {
        alert(`Open ${app} (not implemented in standalone mode)`);
      }
    });
  });
});
