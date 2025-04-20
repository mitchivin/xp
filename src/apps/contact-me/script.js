import { setupMenuBar } from '../../../src/scripts/utils/menuBar.js';
import { setupToolbar } from '../../../src/scripts/utils/toolbar.js';
import { handleExit } from '../../../src/scripts/utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
  setupMenuBar({
    menuBarSelector: '.menu-bar',
    actions: {
      new: () => {
        // Clear all input fields and textarea in the contact me window
        document.querySelectorAll('.email-window input:not([readonly]), .email-window textarea').forEach(el => {
          el.value = '';
        });
      },
      exit: handleExit
      // Add more menu actions as needed
    }
  });

  setupToolbar({
    '.send': () => {
      // Use display name and email for the mailto link
      const to = 'Mitch Ivin Design <mitchqqis@gmail.com>';
      const subject = document.querySelectorAll('.field-input')[2]?.value || '';
      const body = document.querySelector('.email-body')?.value || '';

      const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    },
    '.new': () => {
      // Clear all input fields and textarea in the contact me window
      document.querySelectorAll('.email-window input:not([readonly]), .email-window textarea').forEach(el => {
        el.value = '';
      });
    }
    // Add more toolbar button actions as needed
  });

  // Toolbar JS logic for Windows XP-style UI
  // Copied from reusable/Toolbar.js
  // (Currently empty, add logic as needed)
});