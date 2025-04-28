/**
 * @fileoverview Taskbar module for managing the Windows XP start menu, system tray, and clock.
 * Integrates with StartMenu, EventBus, and tooltip utilities.
 *
 * Usage:
 *   import Taskbar from './taskbarManager.js';
 *   const taskbar = new Taskbar(eventBus);
 *
 * Edge Cases:
 *   - If required DOM elements are missing, some features are disabled.
 *   - Tooltips and clock are initialized on startup.
 */
import StartMenu from './startMenuManager.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';
import { setupTooltips } from '../utils/tooltip.js';

/**
 * Clock class for managing the system clock display and time updates.
 *
 * @class
 * @example
 * const clock = new Clock('.time');
 * clock.destroy(); // Stop updates
 */
class Clock {
    #clockElement;
    #intervalId = null;
    #initialTimeoutId = null;
    #timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    constructor(selector) {
        this.#clockElement = document.querySelector(selector);
        if (!this.#clockElement) {
            return;
        }
        this.setupClockUpdates();
    }

    setupClockUpdates() {
        clearTimeout(this.#initialTimeoutId);
        clearInterval(this.#intervalId);
        const now = new Date();
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        this.updateClock();
        this.#initialTimeoutId = setTimeout(() => {
            this.updateClock();
            this.#intervalId = setInterval(() => this.updateClock(), 60000);
        }, msUntilNextMinute);
    }

    updateClock() {
        if (!this.#clockElement) return;
        this.#clockElement.textContent = this.#timeFormatter.format(new Date());
    }

    destroy() {
        [this.#initialTimeoutId, this.#intervalId].forEach((id) => id && clearTimeout(id));
        this.#initialTimeoutId = this.#intervalId = null;
    }
}

/**
 * Taskbar manages the Windows XP taskbar UI, start menu, tray icons, and clock.
 *
 * @class
 * @example
 * import Taskbar from './taskbarManager.js';
 * const taskbar = new Taskbar(eventBus);
 */
export default class Taskbar {
    /**
     * Create a new Taskbar instance.
     * @param {EventBus} eventBus - The event bus instance for communication.
     */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.startButton = document.getElementById('start-button');
        this.startMenuComponent = new StartMenu(this.eventBus);
        this.programsContainer = document.querySelector('.taskbar-programs');
        this.systemTray = document.querySelector('.system-tray');

        this.setupStartButtonEffects();
        this.setupTrayIconEvents();
        this.setupResponsiveTaskbar();

        // Call the new utility function for system tray icons
        setupTooltips('.tray-status-icon, .tray-network-icon, .tray-volume-icon');

        // Initialize the clock
        new Clock('.time');

        this.subscribeToEvents();
    }

    /**
     * Subscribe to event bus events
     */
    subscribeToEvents() {
        this.eventBus.subscribe(EVENTS.STARTMENU_OPENED, () => {
            this.startButton.classList.add('active');
        });

        this.eventBus.subscribe(EVENTS.STARTMENU_CLOSED, () => {
            this.startButton.classList.remove('active');
        });

        this.eventBus.subscribe(EVENTS.WINDOW_CREATED, () => {
            this.updateTaskbarLayout();
        });

        this.eventBus.subscribe(EVENTS.WINDOW_CLOSED, () => {
            this.updateTaskbarLayout();
        });
    }

    /**
     * Set up hover and click effects for start button
     */
    /**
     * Set up hover and click effects for the Start button.
     * @returns {void}
     */
    setupStartButtonEffects() {
        this.startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.eventBus.publish(EVENTS.STARTMENU_TOGGLE);
        });
    }

    /**
     * Set up event handlers for tray icons
     */
    /**
     * Set up event listeners for system tray icons (e.g., volume, network).
     * @returns {void}
     */
    setupTrayIconEvents() {
        // Add click event to Media Player icon
        const mediaPlayerIcon = document.querySelector('.tray-mediaPlayer-icon');
        if (mediaPlayerIcon) {
            mediaPlayerIcon.addEventListener('click', () => {
                this.eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: 'mediaPlayer' });
            });
        }

        // Add click event to Music Player icon
        const musicPlayerIcon = document.querySelector('.tray-music-icon');
        if (musicPlayerIcon) {
            const updateMusicTooltip = () => {
                const overlay = document.getElementById('music-widget-overlay');
                musicPlayerIcon.setAttribute('data-tooltip', overlay ? 'Close Music Player' : 'Open Music Player');
            };
            // Set initial tooltip
            updateMusicTooltip();
            musicPlayerIcon.addEventListener('click', () => {
                const overlay = document.getElementById('music-widget-overlay');
                if (overlay) {
                    this.eventBus.publish('MUSIC_WIDGET_CLOSE');
                } else {
                    this.eventBus.publish('MUSIC_WIDGET_OPEN');
                }
                // Tooltip will update on event
            });
            // Listen for external open/close events to update tooltip
            this.eventBus.subscribe('MUSIC_WIDGET_OPEN', updateMusicTooltip);
            this.eventBus.subscribe('MUSIC_WIDGET_CLOSE', updateMusicTooltip);
        }
    }

    /**
     * Setup responsive taskbar that adjusts program item widths based on available space
     */
    /**
     * Set up responsive behavior for the taskbar on window resize.
     * @returns {void}
     */
    setupResponsiveTaskbar() {
        this.updateTaskbarLayout();

        window.addEventListener('resize', () => {
            this.updateTaskbarLayout();
        });

        const observer = new MutationObserver(() => {
            this.updateTaskbarLayout();
        });

        observer.observe(this.programsContainer, {
            childList: true,
            subtree: false
        });
    }

    /**
     * Updates the taskbar layout, adjusting program item widths based on available space
     */
    updateTaskbarLayout() {
        const taskbarItems = document.querySelectorAll('.taskbar-item');
        if (taskbarItems.length === 0) return;

        const availableWidth = this._calculateAvailableWidth();
        const layoutMode = this._determineLayoutMode(taskbarItems.length, availableWidth);

        this._applyTaskbarLayout(taskbarItems, layoutMode, availableWidth);
    }

    _calculateAvailableWidth() {
        const taskbarWidth = document.querySelector('.taskbar').offsetWidth;
        const startButtonWidth = this.startButton.offsetWidth;
        const quickLaunchWidth = document.querySelector('.quick-launch')?.offsetWidth || 0;
        const systemTrayWidth = this.systemTray.offsetWidth;
        return taskbarWidth - startButtonWidth - quickLaunchWidth - systemTrayWidth - 30;
    }

    _determineLayoutMode(itemCount, availableWidth) {
        const defaultWidth = 160;
        const minTextWidth = 80;
        const iconOnlyWidth = 36;

        if (itemCount * defaultWidth <= availableWidth) return 'default';
        if (itemCount * minTextWidth <= availableWidth) return 'reduced';
        if (itemCount * iconOnlyWidth <= availableWidth) return 'icon-only';
        return 'overflow';
    }

    _applyTaskbarLayout(taskbarItems, layoutMode, availableWidth) {
        const minWidth = 36; // Minimum width for icon-only
        const maxWidth = 160; // Default max width
        const itemCount = taskbarItems.length;
        let itemWidth = Math.floor(availableWidth / itemCount);
        if (itemWidth > maxWidth) itemWidth = maxWidth;
        if (itemWidth < minWidth) itemWidth = minWidth;

        // If we hit icon-only width, add the icon-only class
        const useIconOnly = itemWidth === minWidth;

        taskbarItems.forEach((item) => {
            item.style.display = 'flex';
            item.style.width = `${itemWidth}px`;
            item.classList.toggle('icon-only', useIconOnly);
        });
    }
}

// --- Balloon Tooltip for Network Icon ---
export function showNetworkBalloon() {
  if (document.getElementById('balloon-root')) return;
  const icon = document.querySelector('.tray-network-icon');
  if (!icon) return;
  const balloonRoot = document.createElement('div');
  balloonRoot.id = 'balloon-root';
  balloonRoot.style.position = 'absolute';
  balloonRoot.style.zIndex = '10010';
  document.body.appendChild(balloonRoot);
  balloonRoot.innerHTML = `
    <div class="balloon">
      <button class="balloon__close" aria-label="Close"></button>
      <div class="balloon__header">
        <img class="balloon__header__img" src="assets/gui/taskbar/welcome.webp" alt="welcome" />
        <span class="balloon__header__text">Hey, I'm Mitch!</span>
      </div>
      <p class="balloon__text__first">Welcome to my design portfolio.<br>Deliberately different. Meant to be explored.</p>
    </div>
  `;
  setTimeout(() => {
    const iconRect = icon.getBoundingClientRect();
    const balloon = balloonRoot.querySelector('.balloon');
    const balloonRect = balloon.getBoundingClientRect();
    balloonRoot.style.left = (iconRect.left + iconRect.width / 2 - balloonRect.width / 2 + window.scrollX - 114) + 'px';
    balloonRoot.style.top = (iconRect.top - balloonRect.height - 8 - 14 + window.scrollY) + 'px';
  }, 0);
  const balloon = balloonRoot.querySelector('.balloon');
  const closeBtn = balloonRoot.querySelector('.balloon__close');
  let balloonTimeouts = [];
  closeBtn.onclick = () => hideBalloon();
  // Remove balloon.onclick handler so clicking the balloon does nothing
  balloon.classList.remove('hide');
  balloonTimeouts.push(setTimeout(() => balloon.classList.add('hide'), 15000)); // Start fade out after 15s
  balloonTimeouts.push(setTimeout(() => hideBalloon(), 16000)); // Remove after 16s
  function hideBalloon() {
    balloon.classList.add('hide');
    balloonTimeouts.push(setTimeout(() => clearBalloon(), 1000));
  }
  function clearBalloon() {
    balloonTimeouts.forEach(t => clearTimeout(t));
    balloonTimeouts = [];
    if (balloonRoot.parentNode) balloonRoot.parentNode.removeChild(balloonRoot);
  }
}

// Remove the DOMContentLoaded event for auto-show
// Instead, show balloon on click of the network icon
const setupBalloonClick = () => {
  const icon = document.querySelector('.tray-network-icon');
  if (!icon) return;
  icon.addEventListener('click', showNetworkBalloon);
};
window.addEventListener('DOMContentLoaded', () => {
  setupBalloonClick();
  // Show balloon automatically on login (page load), after 3s delay
  // setTimeout(() => {
  //   if (!document.getElementById('balloon-root')) {
  //     showNetworkBalloon();
  //   }
  // }, 3000);
});
