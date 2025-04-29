/**
 * Windows XP Simulation Main Script
 *
 * @description Entry point for the Windows XP simulation that initializes all core components
 * and sets up event handling. This file orchestrates the application's lifecycle.
 *
 * @module main
 */
import Desktop from './gui/desktopManager.js';
import Taskbar from './gui/taskbarManager.js';
import WindowManager from './gui/windowManager.js';
import { eventBus, EVENTS } from './utils/eventBus.js';
import programData from './utils/programRegistry.js';
import { initBootSequence } from './utils/boot.js'; // Import the boot sequence initializer
import { setupTooltips } from './utils/tooltip.js';
import { createIframePool } from './gui/windowManager.js';

// Animation timing constants for CRT scanline effect
const SCANLINE_MIN_DELAY_MS = 1000; // Minimum delay between scanline animations (ms)
const SCANLINE_MAX_DELAY_MS = 3000; // Maximum additional random delay (ms)
const SCANLINE_MIN_DURATION_MS = 4000; // Minimum scanline animation duration (ms)
const SCANLINE_MAX_DURATION_MS = 3000; // Maximum additional random duration (ms)

document.addEventListener('DOMContentLoaded', () => {
    // Initialize core UI components with shared event bus for communication
    new Taskbar(eventBus);
    new Desktop(eventBus);
    const windowManager = new WindowManager(eventBus);

    // Initialize boot/login sequence after component initialization
    // IMPORTANT: Must be called after eventBus initialization
    initBootSequence(eventBus, EVENTS);

    // Handle system shutdown requests
    // Confirmation dialog intentionally omitted for streamlined UX
    eventBus.subscribe(EVENTS.SHUTDOWN_REQUESTED, () => {
        sessionStorage.removeItem('logged_in');
        // Navigate with a parameter to force boot sequence on reload
        const currentPath = window.location.pathname;
        window.location.assign(currentPath + '?forceBoot=true');
    });

    // Handle cross-iframe communication and login success events
    window.addEventListener('message', ({ data }) => {
        if (!data || !data.type) return; // Ignore messages without type

        // Propagate focus events from iframes to parent window manager
        if (data.type === EVENTS.IFRAME_CLICKED) {
            eventBus.publish(EVENTS.WINDOW_FOCUSED, { windowId: null });
        }
        // Handle open-app messages from child iframes (e.g., about app)
        else if (data.type === 'open-app' && typeof data.app === 'string') {
            eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: data.app });
        }
        // Handle project navigation from Project Hub
        else if (data.type === 'openProject' && typeof data.id === 'string') {
            // Map project IDs to their detail view program names
            const programMap = { 'retro-os': 'retro-os-details' }; // Consider moving if grows
            const detailProgramName = programMap[data.id];

            if (!detailProgramName) {
                // console.warn(`Hub requested unknown project ID: ${data.id}`);
            } else {
                eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: detailProgramName });
            }
        }
        // Handle toggle-music-widget from iframes (About Me left panel)
        else if (data.type === 'toggle-music-widget') {
            const overlay = document.getElementById('music-widget-overlay');
            if (overlay) {
                eventBus.publish('MUSIC_WIDGET_CLOSE');
            } else {
                eventBus.publish('MUSIC_WIDGET_OPEN');
            }
        }
        // Handle open-music-widget from iframes (About Me left panel)
        else if (data.type === 'open-music-widget') {
            const overlay = document.getElementById('music-widget-overlay');
            if (!overlay) {
                eventBus.publish('MUSIC_WIDGET_OPEN');
            }
        }
        // Handle open-external-link from iframes (About Me social links)
        else if (data.type === 'open-external-link' && typeof data.url === 'string') {
            window.open(data.url, '_blank', 'noopener,noreferrer');
        }
    });

    // Initialize CRT visual effects
    initRandomScanline();

    // Open About Me and My Projects (Internet) on page load
    eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: 'about' });
    eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: 'internet' });

    // Enable XP-style tooltips globally for all elements with data-tooltip
    setupTooltips('[data-tooltip]');

    // Preload all app iframes (including music player) at startup
    createIframePool(programData);

    // Preload all music player songs and covers
    const songFiles = [
        'track1.mp3',
        'track2.mp3',
        'track3.mp3',
        'track4.mp3'
    ];
    const coverFiles = [
        'cover1.webp',
        'cover2.webp',
        'cover3.webp',
        'cover4.webp'
    ];
    songFiles.forEach(song => {
        const audio = new Audio('assets/apps/musicPlayer/songs/' + song);
        audio.preload = 'auto';
        audio.load();
    });
    coverFiles.forEach(cover => {
        const img = new Image();
        img.src = 'assets/apps/musicPlayer/covers/' + cover;
    });

    // Preload the music player iframe in the background
    const hiddenMusicIframe = document.createElement('iframe');
    hiddenMusicIframe.src = 'src/apps/musicPlayer/index.html';
    hiddenMusicIframe.style.display = 'none';
    hiddenMusicIframe.setAttribute('data-preload-music-player', 'true');
    document.body.appendChild(hiddenMusicIframe);

    // Open and move the music player window off-screen during boot
    eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: 'musicPlayer' });
    setTimeout(() => {
        // Find the music player window and move it off-screen
        const musicWindow = document.getElementById('musicPlayer-window');
        if (musicWindow) {
            musicWindow.style.left = '-9999px';
            musicWindow.style.top = '0';
            musicWindow.style.display = 'block';
            musicWindow.setAttribute('data-preinit', 'true');
        }
    }, 1000); // Give it a moment to fully initialize
});

/**
 * Initializes and manages the moving scanline CRT effect
 *
 * @description Creates a randomly timed animation of a scanline moving vertically
 * across the screen to simulate a CRT monitor effect. Uses CSS transitions with
 * random timing for natural variation.
 *
 * @returns {void}
 */
function initRandomScanline() {
    const scanline = document.querySelector('.crt-scanline');
    if (!scanline) return; // Graceful exit if element doesn't exist

    let isAnimationStarted = false;

    // Handle transition completion and schedule next animation
    scanline.addEventListener('transitionend', () => {
        // Reset scanline position without animation
        scanline.style.transition = 'none';
        scanline.style.transform = 'translateY(-10px)';

        // Random delay between animations (1-3 seconds)
        // PERF: Longer intervals reduce visual processing overhead
        const nextInterval = SCANLINE_MIN_DELAY_MS + Math.random() * SCANLINE_MAX_DELAY_MS;
        setTimeout(startAnimation, nextInterval);
    });

    /**
     * Begins a new scanline animation cycle
     * @private
     */
    function startAnimation() {
        // Force browser reflow to ensure position reset is applied
        // This prevents transition glitches between animation cycles
        void scanline.offsetWidth;

        // Random duration creates natural variation (4-7 seconds)
        const duration = SCANLINE_MIN_DURATION_MS + Math.random() * SCANLINE_MAX_DURATION_MS;

        // Apply the animation with dynamic duration
        scanline.style.transition = `transform ${duration}ms linear`;
        scanline.style.transform = 'translateY(100vh)';

        isAnimationStarted = true;
    }

    // Start animation on first desktop click
    document.querySelector('.desktop').addEventListener(
        'click',
        () => {
            if (!isAnimationStarted) {
                startAnimation();
            }
        },
        { once: true }
    );

    // Listen for login success and reinitialize animation
    document.addEventListener('reinitScanline', () => {
        // Start the animation after a brief delay
        setTimeout(startAnimation, 500);
    });

    // For page refreshes when already on desktop
    if (sessionStorage.getItem('logged_in') === 'true') {
        // Begin the initial animation cycle after short delay
        // This allows initial page render to complete first
        setTimeout(startAnimation, 500);
    }
}

// --- Scanline control via media player events ---
window.addEventListener('message', function(event) {
    if (!event.data || typeof event.data.type !== 'string') return;
    const scanline = document.querySelector('.crt-scanline');
    if (!scanline) return;
    if (event.data.type === 'media-play') {
        scanline.style.display = 'none';
    } else if (event.data.type === 'media-pause' || event.data.type === 'media-stop') {
        scanline.style.display = 'block';
        // Reset scanline position and transition
        scanline.style.transition = 'none';
        scanline.style.transform = 'translateY(-10px)';
        // Force reflow
        void scanline.offsetWidth;
        // Start the animation immediately
        const duration = SCANLINE_MIN_DURATION_MS + Math.random() * SCANLINE_MAX_DURATION_MS;
        scanline.style.transition = `transform ${duration}ms linear`;
        scanline.style.transform = 'translateY(100vh)';
    }
});