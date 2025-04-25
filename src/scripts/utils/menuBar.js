/**
 * @fileoverview Shared Menu Bar Utility for Windows XP-style UI.
 * Handles dropdown show/hide, positioning, and the 'Exit' action.
 * Works in both iframe and standalone contexts.
 *
 * Usage:
 *   import { setupMenuBar } from '../../../src/scripts/utils/menuBar.js';
 *   setupMenuBar({ menuBarSelector: '.menu-bar' });
 *
 * Edge Cases:
 *   - If menuBarSelector does not match any element, no menu is set up.
 *   - If a menu item does not have a corresponding dropdown, clicking does nothing.
 *   - If .dropdown-menu .menu-option has data-action=exit, calls shared exit handler.
 */
import { handleExit } from './common.js'; // Import shared exit handler

/**
 * Shared Menu Bar Utility for Windows XP-style UI
 * Handles dropdown show/hide, positioning, and the 'Exit' action.
 * Works in both iframe and standalone contexts.
 *
 * Usage:
 *   import { setupMenuBar } from '../../../src/scripts/utils/menuBar.js';
 *   setupMenuBar({ menuBarSelector: '.menu-bar' });
 */
/**
 * Sets up a Windows XP-style menu bar with dropdowns and shared actions.
 *
 * @param {Object} options
 * @param {string} options.menuBarSelector - CSS selector for the menu bar element.
 * @param {Object<string, HTMLElement>} [options.dropdownMenus=null] - Optional map of menu names to dropdown menu elements.
 * @param {Object<string, function>} [options.actions={}] - Optional map of action names to handler functions.
 * @returns {void}
 * @example
 * setupMenuBar({ menuBarSelector: '.menu-bar' });
 */
export function setupMenuBar({ menuBarSelector, dropdownMenus = null, actions = {} }) {
  const menuBar = document.querySelector(menuBarSelector);
  if (!menuBar) return;

  // Find all enabled menu items
  const menuItems = menuBar.querySelectorAll('.menu-item:not(.disabled)');
  // If not provided, build dropdownMenus from data-menu attributes
  if (!dropdownMenus) {
    dropdownMenus = {};
    menuItems.forEach(item => {
      const menuName = item.getAttribute('data-menu');
      if (menuName) {
        const menu = document.getElementById(`${menuName}-menu`);
        if (menu) dropdownMenus[menuName] = menu;
      }
    });
  }

  let activeMenu = null;

  function closeActiveMenu() {
    if (activeMenu) {
      const menuName = activeMenu.getAttribute('data-menu');
      const menu = dropdownMenus[menuName];
      if (menu) menu.classList.remove('show');
      activeMenu.classList.remove('active');
      activeMenu = null;
    }
    // Hide overlay if present
    const overlay = document.getElementById('menu-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeMenu === item) {
        closeActiveMenu();
        return;
      }
      closeActiveMenu();
      item.classList.add('active');
      const menuName = item.getAttribute('data-menu');
      const menu = dropdownMenus[menuName];
      if (menu) {
        // Position the dropdown below the menu item
        const rect = item.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.left = rect.left + 'px';
        menu.style.top = (rect.bottom) + 'px';
        menu.style.minWidth = rect.width + 'px';
        menu.classList.add('show');
      }
      activeMenu = item;
      // Show overlay if present
      const overlay = document.getElementById('menu-overlay');
      if (overlay) {
        overlay.style.display = 'block';
        // Only add the click handler once
        if (!overlay._menuClickHandler) {
          overlay._menuClickHandler = () => closeActiveMenu();
          overlay.addEventListener('click', overlay._menuClickHandler);
        }
      }
    });
  });

  // Close menu when clicking anywhere else
  document.addEventListener('click', () => {
    closeActiveMenu();
  });

  // Menu option click logic (including Exit)
  const menuOptions = document.querySelectorAll('.dropdown-menu .menu-option:not(.disabled)');
  menuOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      const action = option.getAttribute('data-action');
      if (action) {
        if (actions && typeof actions[action] === 'function') {
          actions[action](option, e);
        } else {
          // Use shared handler for exit, otherwise log warning for unhandled shared actions
          if (action === 'exit') {
            handleExit(); // Use imported handler
          } else {
             console.warn(`Unhandled shared menu action: ${action}`);
          }
        }
      }
      closeActiveMenu();
      e.stopPropagation();
    });
  });
} 