import { setupMenuBar } from '../../../src/scripts/utils/menuBar.js';
import { setupToolbar } from '../../../src/scripts/utils/toolbar.js';
import { setupTooltips } from '../../../src/scripts/utils/tooltip.js';
import { handleExit } from '../../../src/scripts/utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    setupMenuBar({
        menuBarSelector: '.menu-bar',
        actions: {
            exit: handleExit
            // Add more menu actions as needed
        }
    });

    setupToolbar({
        '.back': () => {
            // Navigate to page2
            const projectFrame = document.getElementById('project-frame');
            if (projectFrame) {
                projectFrame.src = 'backPage/index.html';
            }
        },
        '.forward': () => {},
        '.home': () => {
            // Navigate to myprojects (home)
            const projectFrame = document.getElementById('project-frame');
            if (projectFrame) {
                projectFrame.src = '../myprojects/index.html';
            }
        },
        '.search': () => {},
        '.favourites': () => {},
        '.print': () => {}
        // Add more toolbar button actions as needed
    });

    // Enable XP-style tooltips for toolbar buttons
    setupTooltips('.toolbar-row > div[data-tooltip]');

    // --- Initialization ---
    const projectFrame = document.getElementById('project-frame');
    function initializeApp() {
        const initialPath = '../myprojects/index.html';
        projectFrame.src = initialPath;
    }
    initializeApp();
});
