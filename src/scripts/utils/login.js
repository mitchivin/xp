/**
 * @fileoverview Handles the Windows XP simulation login screen logic.
 * - Manages login cooldown after logoff
 * - Handles profile click for login
 * - Handles shutdown icon click
 *
 * Usage:
 *   Included in the login window iframe.
 *
 * Edge Cases:
 *   - If .back-gradient element is missing, login will not be possible and an error is logged.
 *   - If #shutdown-icon is missing, shutdown will not be available.
 */
// Login Screen Logic
// Variable to track if login is in cooldown period
let loginCooldown = false; // Start with NO cooldown by default

// Check if this is being loaded after a log off (via URL parameter)
const urlParams = new URLSearchParams(window.location.search);
const isLogOff = urlParams.get('logoff') === 'true';


// Only activate cooldown if this is loaded after a log off
if (isLogOff) {
    loginCooldown = true;
}


// Assuming only one profile element matches
const profileElement = document.querySelector('.back-gradient');

if (profileElement) {
    profileElement.addEventListener('click', function () {
        // Check if login is in cooldown period
        if (window.loginCooldown || loginCooldown) {
            return;
        }

        // Add .active to the clicked profile (even if redundant, keeps logic consistent)
        profileElement.classList.add('active');

        // Trigger login immediately by sending message to parent
        window.parent.postMessage({ type: 'loginSuccess' }, '*');
    });
} else {
    console.error("Login profile element (.back-gradient) not found.");
}

// Wait for the login screen's DOM to be ready before adding listeners
document.addEventListener('DOMContentLoaded', () => {
    const shutdownIcon = document.getElementById('shutdown-icon');
    if (shutdownIcon) {
        shutdownIcon.addEventListener('click', () => {
            // Send shutdown request to parent window
            window.parent.postMessage({ type: 'shutdownRequest' }, '*');
        });
    }

    // Only set a timeout to remove the login cooldown if it's active (due to logoff or initial)
    if (loginCooldown) {
        const cooldownDuration = 2000; // Changed to 2 seconds
        setTimeout(() => {
            loginCooldown = false;
        }, cooldownDuration);
    }
});

// Listen for custom event to trigger login cooldown after logoff
document.addEventListener('triggerLoginCooldown', () => {
    const cooldownDuration = 2000;
    setTimeout(() => {
        window.loginCooldown = false;
        loginCooldown = false;
    }, cooldownDuration);
}); 