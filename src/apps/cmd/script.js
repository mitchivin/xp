// Helper function to select a single DOM element by CSS selector
function getElement(selector) {
    return document.querySelector(selector);
}

// Helper function to create a DOM element with an optional class name
function createElement(tag, className = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
}

// Get references to main UI elements for the command prompt
const history = getElement('#history');
const input = getElement('#input');
const ps1 = getElement('#ps1');
const caret = getElement('#caret');
const body = getElement('body');

// Set the initial body class to DOS mode
body.classList.add('dos');

let command = '';
let driveLetter = 'C';

let path = [];


// Process a command entered by the user and return the output string
function processCommand(text) {
    let actualCommand;
    let parameters;
    // Split the command and its parameters
    if (text.indexOf(' ') !== -1) {
        actualCommand = text.substring(0, text.indexOf(' '));
        parameters = text.substring(text.indexOf(' ') + 1, text.length).split(' ');
    } else {
        actualCommand = text;
        parameters = [];
    }
    // Handle command logic and return output
    try {
        if (actualCommand.indexOf(':') === 1 && actualCommand.length === 2) {
            driveLetter = actualCommand.charAt(0).toUpperCase();
            return '';
        }
        switch (actualCommand.toLowerCase()) {
            case '':
                return '';

            case 'scandisk':
                return 'Command not found\n\n';
            case 'ver':
                return 'JSDOS v0.1.442024\n\n';
            case 'win':
                return 'Windows not invented yet\n\n';
            case 'set':
            case 'eval':
                return 'Command disabled for security reasons\n';
            case 'clear':
            case 'cls':
                history.innerHTML = '';
                return '';
            case 'cd':
                return processDirectoryChange(parameters[0]);
            case 'cd\\':
                return processDirectoryChange('\\');
            case 'ls':
            case 'dir':
                return processDir(parameters[0]);
            case 'echo':
                return parameters.join(' ') + '\n';
            case 'date':
                return Date() + '\n';
            case 'help':
                return printHelp();
            case 'exit':
                // Attempt to close the window via parent message
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'close-window' }, '*');
                    return ''; // Return empty string as we are closing
                } else {
                    // Standalone fallback (may not work depending on browser security)
                    window.close();
                    return 'Attempting to close window...\n'; 
                }
            default:
                // Return error for unrecognized command
                return `'${text}' is not recognized as an internal or external command,<br>operable program or batch file.<br>`;
        }
    } catch (err) {
        return 'Command caused an error [' + err + ']<br>';
    }
}

// Change the current directory based on the user's input
function processDirectoryChange(dirs) {
    if (dirs === undefined) {
        return '';
    } else if (dirs.charAt(1) === ':') {
        driveLetter = dirs.charAt(0);
        path = dirs.substring(3, dirs.length).split('\\');
        return '';
    }
    dirs = dirs.replace(/\//g, '\\');
    const dirArray = dirs.split('\\');
    for (const dir in dirArray) {
        changeDirectory(dirArray[dir]);
    }
    return '';
}

// Update the path array to reflect directory changes
function changeDirectory(dir) {
    if (dir === '.' || dir === '') {
        return;
    } else if (dir === '..') {
        path.pop();
    } else if (dir === '\\') {
        path = [];
    } else {
        path.push(dir);
    }
    return '';
}

// Generate a directory listing output string for the current or given directory
function processDir(dir) {
    if (dir === undefined) {
        dir = driveLetter + ':\\' + path.join('\\');
    }
    let output = '';
    output += ' Volume in drive ' + driveLetter + ' has no label.<br />';
    output += ' Volume Serial Number is 98B1-B33F\n';
    output += '\n';
    output += ' Directory of ' + dir + '\n';
    output += '\n';
    output += ' 01/01/2009&#9;01:00 AM&#9;&lt;DIR&gt;&#9;&#9;.\n';
    output += ' 01/01/2009&#9;01:00 AM&#9;&lt;DIR&gt;&#9;&#9;..\n';
    output += '               0 File(s)              0 bytes\n';
    output += '               2 Dir(s)   98,061,203,456 bytes free\n\n';
    return output;
}

// Return a help string listing all supported commands
function printHelp() {
    let output = '';
    output += 'Supported commands are:\n';
    output += ' help\n';
    output += ' ver\n';
    output += ' defrag\n';
    output += ' echo [text]\n';
    output += ' cls\n';
    output += ' dir\n';
    output += ' cd [directory]\n\n';
    return output;
}

// Print a line of output to the command history area
function println(text) {
    const line = createElement('div');
    line.innerHTML = `${text}`;
    history.appendChild(line);
}

// Initialize the command prompt with the Windows XP version banner
function init() {
    println('OS Simulation [Version 1.0]<br>Developed by Mitchell Ivin');
}

// Move the caret to the end of the input field and focus it
function focusAndMoveCursorToTheEnd(e) {
    input.focus();
    const range = document.createRange();
    const selection = window.getSelection();
    const { childNodes } = input;
    const lastChildNode = childNodes && childNodes.length - 1;
    range.selectNodeContents(lastChildNode === -1 ? input : childNodes[lastChildNode]);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

// Listen for selection changes and update the caret display based on cursor position
// If the selection is not at the end, hide the square caret. If at the end, show it.
document.addEventListener('selectionchange', () => {
    if (document.activeElement.id !== 'input') return;
    const range = window.getSelection().getRangeAt(0);
    const start = range.startOffset;
    const end = range.endOffset;
    const length = input.textContent.length;
    if (end < length) {
        input.classList.add('noCaret');
    } else {
        input.classList.remove('noCaret');
    }
});

// Listen for input events to sanitize pasted content and manage caret display
input.addEventListener('input', () => {
    if (input.childElementCount > 0) {
        // If HTML is pasted, keep only the last line as plain text
        const lines = input.innerText.replace(/\n$/, '').split('\n');
        const lastLine = lines[lines.length - 1];
        input.textContent = lastLine;
        focusAndMoveCursorToTheEnd();
    }
    // If input is empty, ensure the square caret is visible
    if (input.innerText.length === 0) {
        input.classList.remove('noCaret');
    }
});

// Listen for keydown events to keep the input focused when typing outside the field
// This ensures the prompt always receives keyboard input
// Move the caret to the end if needed
document.addEventListener('keydown', (e) => {
    if (e.target !== input) focusAndMoveCursorToTheEnd();
});

// Listen for Enter key to process the command and print the result
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const commandText = input.textContent;
        const outputText = processCommand(commandText);
        const currentPrompt = ps1.textContent; // Get prompt from #ps1 span
        println(`${currentPrompt} ${commandText}<br>${outputText}`);
        input.textContent = '';
    }
});

// Focus the input field and print the initial banner when the app loads
input.focus();
init();
