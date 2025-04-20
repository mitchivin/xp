// Login Screen Logic
// Variable to track if login is in cooldown period
let loginCooldown = false; // Start with NO cooldown by default

// Check if this is being loaded after a log off (via URL parameter)
const urlParams = new URLSearchParams(window.location.search);
const isLogOff = urlParams.get('logoff') === 'true';
const isInitial = urlParams.get('initial') === 'true';

// Only activate cooldown if this is loaded after a log off
if (isLogOff) {
    loginCooldown = true;
} else {
    // If it's the initial load (not logoff), log that
}

const userProfiles = document.querySelectorAll('.back-gradient'); // Now selects only one

userProfiles.forEach((profileElement) => {
    // No need to remove 'active' from others if there's only one
    profileElement.addEventListener('click', function () {
        // Check if login is in cooldown period
        if (loginCooldown) {
            return;
        }

        // Add .active to the clicked profile (even if redundant, keeps logic consistent)
        profileElement.classList.add('active');

        // Trigger login immediately by sending message to parent
        window.parent.postMessage({ type: 'loginSuccess' }, '*');
    });
});

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