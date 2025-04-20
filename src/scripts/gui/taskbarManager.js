/**
 * Taskbar module for managing the start menu and system tray
 */
import StartMenu from './startMenuManager.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';
import Desktop from './desktopManager.js'; // Update the import path to use the new filename
import programData from '../utils/programRegistry.js';
import { setupTooltips } from '../utils/tooltip.js'; // Import the new utility

/**
 * Clock class for managing the system clock display and time updates
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
            console.error(`Clock element not found with selector: ${selector}`);
            return;
        }

        this.setupClockUpdates();
    }

    setupClockUpdates() {
        // Clear existing timers
        clearTimeout(this.#initialTimeoutId);
        clearInterval(this.#intervalId);

        const now = new Date();
        // Calculate milliseconds until the start of the next minute
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

        // First update happens immediately
        this.updateClock();

        // Set a timeout to fire exactly at the start of the next minute
        this.#initialTimeoutId = setTimeout(() => {
            this.updateClock();
            // Then update every minute
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

export default class Taskbar {
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
    setupStartButtonEffects() {
        this.startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.eventBus.publish(EVENTS.STARTMENU_TOGGLE);
        });
    }

    /**
     * Set up event handlers for tray icons
     */
    setupTrayIconEvents() {
        // Add click event to Media Player icon
        const mediaPlayerIcon = document.querySelector('.tray-media-player-icon');
        if (mediaPlayerIcon) {
            mediaPlayerIcon.addEventListener('click', () => {
                this.eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: 'media-player' });
            });
        }
    }

    /**
     * Setup responsive taskbar that adjusts program item widths based on available space
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
