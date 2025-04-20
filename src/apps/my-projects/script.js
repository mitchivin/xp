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
                projectFrame.src = 'wow-logs/index.html';
            }
        },
        '.forward': () => {},
        '.home': () => {
            // Navigate to projecthub (home)
            const projectFrame = document.getElementById('project-frame');
            if (projectFrame) {
                projectFrame.src = 'projecthub/index.html';
            }
        },
        '.search': () => {},
        '.favourites': () => {},
        '.print': () => {}
        // Add more toolbar button actions as needed
    });

    // Enable XP-style tooltips for toolbar buttons
    setupTooltips('.toolbar-row > div[data-tooltip]');

    // Listen for iframe click messages to close the menu bar
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'iframe-clicked' && window.closeActiveMenu) {
            window.closeActiveMenu();
        }
    });

    // --- Initialization ---
    const projectFrame = document.getElementById('project-frame');
    function initializeApp() {
        const initialPath = 'projecthub/index.html';
        projectFrame.src = initialPath;
        projectFrame.addEventListener('load', () => {
            try {
                const iframeDoc = projectFrame.contentWindow.document;
                iframeDoc.addEventListener('click', () => {
                    window.parent.postMessage({ type: 'iframe-clicked' }, '*');
                });
            } catch (e) {
                // Cross-origin restriction fallback
            }
        });
    }
    initializeApp();
});
