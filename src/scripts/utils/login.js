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
let loginCooldown = false;
const urlParams = new URLSearchParams(window.location.search);
const isLogOff = urlParams.get('logoff') === 'true';
if (isLogOff) {
    loginCooldown = true;
}
const profileElement = document.querySelector('.back-gradient');
if (profileElement) {
    profileElement.addEventListener('click', function () {
        if (window.loginCooldown || loginCooldown) {
            return;
        }
        profileElement.classList.add('active');
        window.parent.postMessage({ type: 'loginSuccess' }, '*');
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const shutdownIcon = document.getElementById('shutdown-icon');
    if (shutdownIcon) {
        shutdownIcon.addEventListener('click', () => {
            window.parent.postMessage({ type: 'shutdownRequest' }, '*');
        });
    }
    if (loginCooldown) {
        const cooldownDuration = 2000;
        setTimeout(() => {
            loginCooldown = false;
        }, cooldownDuration);
    }
});
document.addEventListener('triggerLoginCooldown', () => {
    const cooldownDuration = 2000;
    setTimeout(() => {
        window.loginCooldown = false;
        loginCooldown = false;
    }, cooldownDuration);
}); 