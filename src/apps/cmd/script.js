// --- Minimal CMD Prompt Logic ---

// Get references to HTML elements
const outputElement = document.getElementById('output');
const promptElement = document.getElementById('prompt');
const inputElement = document.getElementById('input');
const bodyContainer = document.body;

// Define the static path for the prompt
const staticPath = 'C:\\Users\\Portfolio>';

// Function to add a line of text (or a blank line) to the output div
function addOutputLine(text) {
    const lineDiv = document.createElement('div');
    if (text === '') {
        // For blank lines, add a non-breaking space to ensure height
        // and add a specific class if needed for styling
        lineDiv.innerHTML = '&nbsp;';
        lineDiv.className = 'blank-line';
    } else {
        // For text lines, set textContent for safety
        lineDiv.textContent = text;
    }
    outputElement.appendChild(lineDiv);
}

// Function to scroll the container to the bottom
function scrollToBottom() {
    bodyContainer.scrollTop = bodyContainer.scrollHeight;
}

// Function to initialize the prompt
function initializePrompt() {
    // Clear any previous output children
    outputElement.innerHTML = '';

    // Add initial lines (each becomes a div)
    addOutputLine('OS Simulation [Version 1.0]');
    addOutputLine('Developed by Mitchell Ivin');
    addOutputLine(''); // Add the blank line for initial spacing

    // Set the prompt text
    promptElement.textContent = staticPath;

    // Focus the input area
    inputElement.focus();

    // Scroll to bottom
    scrollToBottom();
}

// Event listener for Enter key on the input element
inputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Stop default newline behavior

        const commandText = inputElement.textContent.trim();
        const fullPromptLine = `${promptElement.textContent} ${commandText}`;

        // Add the entered command line to the output (as a div)
        addOutputLine(fullPromptLine);

        // Add the standard response if the command was not empty (as a div)
        if (commandText !== '') {
            // Remove blank line from before the error message
            addOutputLine(`'${commandText}' is not recognized as an internal or external command, operable program or batch file.`);
            addOutputLine(''); // Add blank line AFTER the error message
        }

        // Clear the input element
        inputElement.textContent = '';

        // Scroll to the bottom
        scrollToBottom();
    }
});

// Event listener to keep input focused when clicking elsewhere in the body
document.addEventListener('click', (event) => {
    // If the click is within the body but not on the input field itself
    if (bodyContainer.contains(event.target) && event.target !== inputElement) {
        inputElement.focus();
        // Note: Programmatically moving the cursor to the end of contenteditable
        // after focusing requires more complex Selection API usage, omitted for simplicity.
    }
});

// Initialize the command prompt when the script loads
initializePrompt();
