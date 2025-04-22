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
const commandHistory = [];
let path = [];
let historyPos = 0;

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
            case 'defrag':
                return defrag();
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
                return init();
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

// Defrag command implementation: simulates a disk defragmentation process with UI updates and animations
function defrag() {
    // Set up constants for the defrag simulation
    const TOTAL_BLOCKS = 1300;
    const TOTALCLUSTERS = 12600 + ~~(Math.random() * 4250);
    const CLUSTERSPERBLOCK = ~~(TOTALCLUSTERS / TOTAL_BLOCKS);
    // Get references to all relevant DOM elements for the defrag UI
    const modals = document.querySelectorAll(
        '#defrag-testing.dialog, #defrag-reading.dialog, #defrag-analyzing.dialog, #defrag-finished.dialog'
    );
    const screens = document.querySelectorAll('#defrag-surface, #defrag-info');
    const surface = getElement('#defrag-surface');
    const currentCluster = getElement('#defrag-currentcluster');
    const percent = getElement('#defrag-percent');
    const fill = getElement('#defrag-fill');
    const elapsedTime = getElement('#defrag-elapsedtime');
    const screen = getElement('#defrag-container');
    const history = getElement('#history');
    const input = getElement('#input');
    const ps1 = getElement('#ps1');
    const caret = getElement('#caret');
    const body = getElement('body');
    // Initialize state for the defrag simulation
    let currentBlock = 0;
    let timer;
    let blocks;
    let totalBlocks;
    // Hide the command prompt and show the defrag UI
    history.hidden = true;
    caret.classList.add('off');
    input.hidden = true;
    ps1.hidden = true;
    body.setAttribute('class', 'defrag');
    screen.hidden = false;
    // Generate the visual representation of disk blocks
    const genBlock = () => {
        const num = ~~(Math.random() * 500);
        if (num < 1) {
            return 'bad';
        }
        if (num < 2) {
            return 'unmovable';
        }
        if (num < 175) {
            return 'used frag';
        } else {
            return 'unused';
        }
    };
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
        const span = createElement('span', `block ${genBlock()}`);
        surface.appendChild(span);
    }
    // Initialize block references and update cluster info
    blocks = document.querySelectorAll('.block');
    totalBlocks = document.querySelectorAll('.used.frag').length;
    const folders = getElement('#defrag-folders');
    getElement('#defrag-clustersperblock').textContent = CLUSTERSPERBLOCK.toLocaleString('en');
    // Track elapsed time and update the timer display
    let time = 0;
    const updateTime = () => {
        elapsedTime.textContent = new Date(time * 1000).toISOString().substr(11, 8);
        time++;
    };
    // Show the finished modal and stop the timer when defrag is complete
    const endDefrag = () => {
        clearInterval(timer);
    };
    // Simulate reading and updating each block during defrag
    const readBlock = () => {
        currentCluster.textContent = CLUSTERSPERBLOCK * currentBlock;
        if (blocks[currentBlock].classList.contains('frag')) {
            blocks[currentBlock].classList.remove('frag');
        } else if (blocks[currentBlock].classList.contains('unused')) {
            const fragments = document.querySelectorAll('.used.frag');
            const p = ~~((currentBlock * 100) / totalBlocks);
            percent.textContent = p;
            fill.style.setProperty('width', `${p}%`);
            if (fragments.length === 0) {
                endDefrag();
                return;
            }
            const num = ~~(Math.random() * fragments.length);
            fragments[num].classList.remove('used', 'frag');
            fragments[num].classList.add('unused', 'reading');
            setTimeout(
                () => fragments[num].classList.remove('reading'),
                200 + ~~(Math.random() * 800)
            );
            blocks[currentBlock].classList.remove('unused');
            blocks[currentBlock].classList.add('used');
        }
        currentBlock++;
        setTimeout(
            readBlock,
            50 + ~~(Math.random() * 50) + [0, 0, 0, 50, 200][~~(Math.random() * 5)]
        );
    };
    // Start the timer and begin the defrag process
    const startDefrag = () => {
        timer = setInterval(updateTime, 1000);
        setTimeout(readBlock, 500);
    };
    startDefrag();
    // Restore the command prompt UI when exiting defrag
    getElement('#exitDefrag').addEventListener('click', function () {
        screen.hidden = true;
        history.hidden = false;
        caret.classList.remove('off');
        input.hidden = false;
        ps1.hidden = false;
        body.setAttribute('class', 'dos');
    });
}
