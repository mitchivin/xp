import { setupMenuBar } from '../../../src/scripts/utils/menuBar.js';
import { handleExit } from '../../../src/scripts/utils/common.js';

document.addEventListener('DOMContentLoaded', function () {
    const notepadEditor = document.getElementById('notepad-editor');

    setupMenuBar({
        menuBarSelector: '.menu-bar',
        actions: {
            new: () => {
                // Clear the notepad editor textarea
                notepadEditor.value = '';
                updateStatusBar();
            },
            exit: handleExit
            // Add more menu actions as needed
        }
    });

    // Initialize the status bar
    updateStatusBar();

    // Set focus to the editor
    notepadEditor.focus();

    // Update status bar when cursor position changes
    notepadEditor.addEventListener('keyup', updateStatusBar);
    notepadEditor.addEventListener('click', updateStatusBar);
    notepadEditor.addEventListener('select', updateStatusBar);

    function updateStatusBar() {
        const content = notepadEditor.value;
        const cursorPos = notepadEditor.selectionStart;

        // Calculate line and column based on cursor position
        const lines = content.substring(0, cursorPos).split('\n');
        const currentLine = lines.length;
        const currentCol = lines[lines.length - 1].length + 1;

        // Update status bar via postMessage to the parent window
        const statusText = `Ln ${currentLine}, Col ${currentCol}`;
        // Send message only if running inside an iframe (parent exists)
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'updateStatusBar', text: statusText }, window.location.origin || '*');
        }
    }
});
