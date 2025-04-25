/**
 * @fileoverview Boot sequence and login handling for Windows XP simulation
 * 
 * This module manages the boot animation sequence, login process, and session handling
 * for the Windows XP simulation. It controls transitions between boot screen, login
 * screen, and desktop, and handles session persistence.
 * 
 * @module boot
 */

// Variable to track if log off is in cooldown period
let logOffCooldown = false;

/**
 * Initializes the boot sequence for the Windows XP simulation
 * 
 * @param {Object} eventBus - Event bus instance for pub/sub communication
 * @param {Object} EVENTS - Event name constants
 * @returns {void}
 */
export function initBootSequence(eventBus, EVENTS) {
    // DOM element references
    const bootScreen = document.getElementById('boot-screen');
    const loginScreen = document.getElementById('login-screen');
    const desktop = document.querySelector('.desktop');
    
    // CRT effect elements
    const crtScanline = document.querySelector('.crt-scanline');
    const crtVignette = document.querySelector('.crt-vignette');
    
    // Check URL parameters for boot control
    const urlParams = new URLSearchParams(window.location.search);
    const forceBoot = urlParams.get('forceBoot') === 'true';

    if (forceBoot) {
        // Handle forced boot sequence (triggered by shutdown)
        // Clean URL to remove parameter
        const newUrl = window.location.pathname + window.location.hash;
        history.replaceState({}, document.title, newUrl);
        
        // Reset session state
        sessionStorage.removeItem('logged_in'); 
        startBootSequence();
    } else {
        // Check existing session state
        const hasLoggedIn = sessionStorage.getItem('logged_in') === 'true';
        
        if (hasLoggedIn) {
            // Skip boot/login sequence if already logged in this session
            skipBootSequence();
        } else {
            // Start normal boot sequence for new session
            startBootSequence();
        }
    }
    
    /**
     * Bypasses boot sequence for returning users
     * @private
     */
    function skipBootSequence() {
        // Hide boot and login screens
        bootScreen.style.display = 'none';
        loginScreen.style.display = 'none';
        
        // Show desktop immediately
        desktop.style.opacity = '1';
        desktop.style.pointerEvents = 'auto';
        
        // Hide the desktop blocker overlay
        const blocker = document.getElementById('desktop-blocker');
        if (blocker) blocker.style.display = 'none';
        // CRT effects remain visible by default CSS
    }
    
    /**
     * Executes the full boot animation sequence
     * @private
     */
    function startBootSequence() {
        // Ensure desktop is hidden during boot
        desktop.style.opacity = '0';
        desktop.style.pointerEvents = 'none';
        
        // Ensure login screen is initially hidden
        loginScreen.style.display = 'none';
        loginScreen.style.opacity = '0';
        loginScreen.style.pointerEvents = 'none';
        
        // Set the iframe source WITH the logoff parameter to trigger cooldown
        const loginIframe = document.getElementById('login-iframe');
        if (loginIframe) {
            const currentSrc = loginIframe.src.split('?')[0]; // Remove any existing params
            loginIframe.src = `${currentSrc}?logoff=true`; // Add logoff=true here
        }
        
        // Hide CRT effects during boot animation
        if (crtScanline) crtScanline.style.display = 'none';
        if (crtVignette) crtVignette.style.display = 'none';
        
        // Activate boot screen
        if (!bootScreen) {
            return;
        }
        
        bootScreen.style.display = 'flex';
        bootScreen.style.opacity = '1';
        bootScreen.style.pointerEvents = 'auto';

        // Force reflow to ensure display changes are applied
        void bootScreen.offsetWidth;
        
        // ANIMATION SEQUENCE TIMINGS:
        // 1. Boot screen visible for 6.5 seconds (increased from 5s)
        // 2. Black screen transition for 1 second
        // 3. Login screen fade-in
        
        // Stage 1: Boot screen animation (6.5s)
        setTimeout(() => {
            bootScreen.style.display = 'none';

            // Stage 2: Black screen transition (1s)
            setTimeout(() => {
                // Stage 3: Login screen fade-in
                // Make login screen visible but transparent initially
                loginScreen.style.display = 'flex'; 
                loginScreen.style.opacity = '0';
                loginScreen.style.pointerEvents = 'auto';

                // Small delay ensures display change is processed before opacity transition
                setTimeout(() => {
                    loginScreen.style.opacity = '1';
                }, 50);
            }, 1000);
        }, 6500); // Changed from 5000 to 6500 (added 1.5s)
    }
    
    /**
     * Handle successful login from login iframe
     * @private
     */
    function handleLoginSuccess() {
        // Hide login screen
        loginScreen.style.display = 'none';
        loginScreen.style.pointerEvents = 'none';
        loginScreen.style.opacity = '0';
        
        // Show desktop and enable interaction
        desktop.style.opacity = '1';
        desktop.style.pointerEvents = 'auto';
        
        // Hide the desktop blocker overlay
        const blocker = document.getElementById('desktop-blocker');
        if (blocker) blocker.style.display = 'none';
        
        // Restore CRT effects after login
        if (crtScanline) crtScanline.style.display = 'block'; 
        if (crtVignette) crtVignette.style.display = 'block';
        
        // Trigger a custom event to reinitialize scanline animation
        document.dispatchEvent(new CustomEvent('reinitScanline'));

        // Play login sound
        try {
            const loginSound = new Audio('./assets/sounds/login.wav');
            loginSound.play();
        } catch (error) {
            console.error('Error playing login sound:', error); 
        }
        
        // Persist login state for this session
        sessionStorage.setItem('logged_in', 'true');
        
        // Activate log off cooldown immediately after login
        logOffCooldown = true;
        
        // Set timeout to deactivate log off cooldown after 4.25 seconds
        setTimeout(() => {
            logOffCooldown = false;
        }, 4250); // Changed from 5000ms to 4250ms
    }

    // Event listener for communication with login iframe
    window.addEventListener('message', (event) => {
        // Security note: Consider adding origin validation in production
        // if (event.origin !== window.origin) return;
        
        if (event.data?.type === 'loginSuccess') {
            handleLoginSuccess();
        } else if (event.data?.type === 'shutdownRequest') {
            // Propagate shutdown request to main event system
            if (eventBus && EVENTS) {
                eventBus.publish(EVENTS.SHUTDOWN_REQUESTED);
            }
        }
    });

    // Set up log off event handler
    if (!eventBus || !EVENTS) {
        return;
    }
    
    /**
     * Handle log off request
     * Shows login screen without full reboot
     */
    eventBus.subscribe(EVENTS.LOG_OFF_REQUESTED, () => {
        // If in cooldown period, ignore the log off request
        if (logOffCooldown) {
            return;
        }
        
        // Set cooldown flag to prevent rapid log off/on cycles
        logOffCooldown = true;
        
        // Reset login iframe first to ensure it's ready when displayed
        const loginIframe = document.getElementById('login-iframe');
        if (loginIframe) {
            // Add logoff parameter to signal iframe to activate cooldown
            const currentSrc = loginIframe.src.split('?')[0]; // Remove any existing params
            loginIframe.src = `${currentSrc}?logoff=true`;
            
            // Add an onload event to ensure iframe is loaded before showing
            loginIframe.onload = () => {
                // Play logoff sound
                try {
                    const logoffSound = new Audio('./assets/sounds/logoff.wav');
                    logoffSound.play();
                } catch (error) {
                    console.error('Error playing logoff sound:', error); 
                }
                
                // Hide CRT effects
                if (crtScanline) crtScanline.style.display = 'none';
                if (crtVignette) crtVignette.style.display = 'none';
                
                // Prepare login screen (hidden but ready)
                loginScreen.style.display = 'flex';
                loginScreen.style.opacity = '0';
                loginScreen.style.pointerEvents = 'auto';
                
                // Force browser reflow to ensure display changes are processed
                void loginScreen.offsetWidth;
                
                // Hide desktop and show login screen
                desktop.style.opacity = '0';
                desktop.style.pointerEvents = 'none';
                
                // Short timeout to ensure desktop starts fading before login appears
                setTimeout(() => {
                    loginScreen.style.opacity = '1';
                    
                    // Keep session storage intact but flag Windows as logged out
                    // This lets us distinguish between full boot and log-off state
                    sessionStorage.setItem('logged_in', 'false');
                }, 50);
            };
            
            // Fallback in case onload doesn't fire (e.g., cached iframe)
            setTimeout(() => {
                if (loginScreen.style.opacity !== '1') {
                    console.log('Using fallback for login screen display');
                    loginScreen.style.display = 'flex';
                    loginScreen.style.opacity = '1';
                    desktop.style.opacity = '0';
                    desktop.style.pointerEvents = 'none';
                    sessionStorage.setItem('logged_in', 'false');
                }
            }, 1000);
        } else {
            // Fallback if iframe element not found
            console.error('Login iframe not found');
            
            // Play logoff sound
            try {
                const logoffSound = new Audio('./assets/sounds/logoff.wav');
                logoffSound.play();
            } catch (error) {
                console.error('Error playing logoff sound:', error); 
            }
            
            // Hide desktop during log off
            desktop.style.opacity = '0';
            desktop.style.pointerEvents = 'none';
            
            // Hide CRT effects during login screen
            if (crtScanline) crtScanline.style.display = 'none';
            if (crtVignette) crtVignette.style.display = 'none';
            
            // Show login screen
            loginScreen.style.display = 'flex';
            loginScreen.style.opacity = '1';
            loginScreen.style.pointerEvents = 'auto';
            
            // Update session storage
            sessionStorage.setItem('logged_in', 'false');
        }
    });
} 