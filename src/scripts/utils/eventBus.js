/**
 * @fileoverview EventBus - Communication system for the Windows XP simulation
 *
 * Implements a publish-subscribe pattern to enable decoupled communication
 * between components of the application. This centralized event system
 * prevents tight coupling between UI components, window management, and
 * application logic.
 *
 * @module eventBus
 */

/**
 * Centralized event name constants for the application
 *
 * @readonly
 * @enum {string}
 */
export const EVENTS = {
    // Window Management Events
    PROGRAM_OPEN: 'program:open', // Request to open a program
    PROGRAM_CLOSE: 'program:close', // Request to close a program
    PROGRAM_MINIMIZE: 'programMinimize', // Request to minimize a program
    PROGRAM_MAXIMIZE: 'programMaximize', // Request to maximize a program
    PROGRAM_UNMAXIMIZE: 'programUnmaximize', // Request to restore window from maximized
    WINDOW_CREATED: 'window:created', // Window has been created in DOM
    WINDOW_CLOSED: 'window:closed', // Window has been removed from DOM
    WINDOW_FOCUSED: 'window:focused', // Window has received focus
    WINDOW_MINIMIZED: 'window:minimized', // Window has been minimized
    WINDOW_MAXIMIZED: 'window:maximized', // Window has been maximized
    WINDOW_UNMAXIMIZED: 'window:unmaximized', // Window has been un-maximized
    WINDOW_RESTORED: 'window:restored', // Window has been restored from minimized
    WINDOW_DRAG_START: 'window:drag:start', // User started dragging a window
    WINDOW_RESIZE_START: 'window:resize:start', // User started resizing a window

    // UI Control Events
    TASKBAR_ITEM_CLICKED: 'taskbar:item:clicked', // Taskbar button clicked
    TASKBAR_UPDATE: 'taskbar:update', // Taskbar needs to update
    STARTMENU_TOGGLE: 'startmenu:toggle', // Toggle start menu visibility
    STARTMENU_OPENED: 'startmenu:opened', // Start menu has been opened
    STARTMENU_CLOSED: 'startmenu:closed', // Start menu has been closed
    STARTMENU_CLOSE_REQUEST: 'startmenu:close-request', // Request to close start menu
    LOG_OFF_REQUESTED: 'logoff:requested', // User requested log off
    SHUTDOWN_REQUESTED: 'shutdown:requested', // User requested shutdown

    // Cross-frame Communication
    IFRAME_CLICKED: 'iframe-clicked' // Click detected inside iframe
};

/**
 * EventBus class implementing the publish-subscribe pattern
 *
 * @class
 */
/**
 * EventBus implements the publish-subscribe pattern for decoupled communication.
 *
 * Usage:
 *   import { eventBus, EVENTS } from './eventBus.js';
 *   eventBus.subscribe(EVENTS.PROGRAM_OPEN, handler);
 *
 * Edge Cases:
 *   - If there are no subscribers for an event, publish does nothing.
 *   - Unsubscribing a callback that was never subscribed is a no-op.
 */
class EventBus {
    /**
     * Create a new EventBus instance
     *
     * @constructor
     */
    constructor() {
        /**
         * Storage for event callbacks
         * @private
         * @type {Object.<string, Array.<function>>}
         */
        this.events = {};
    }

    /**
     * Subscribe to an event
     *
     * @param {string} event - Event name to subscribe to
     * @param {function} callback - Function to call when event is triggered
     * @returns {function} Unsubscribe function for easy cleanup
     *
     * @example
     * // Subscribe to program open events
     * const unsubscribe = eventBus.subscribe(EVENTS.PROGRAM_OPEN, (data) => {
     *   console.log(`Opening program: ${data.programName}`);
     * });
     *
     * // Later, to unsubscribe:
     * unsubscribe();
     */
    /**
     * Subscribe to an event.
     *
     * @param {string} event - Event name to subscribe to.
     * @param {function} callback - Function to call when event is triggered.
     * @returns {function} Unsubscribe function for easy cleanup.
     * @example
     * const unsubscribe = eventBus.subscribe(EVENTS.PROGRAM_OPEN, handler);
     * // Later: unsubscribe();
     */
    subscribe(event, callback) {
        // Initialize array if needed with nullish coalescing, then push callback
        (this.events[event] ??= []).push(callback);

        // Return unsubscribe function for easy cleanup
        return () => this.unsubscribe(event, callback);
    }

    /**
     * Subscribe to an event and automatically unsubscribe after first trigger
     *
     * @param {string} event - Event name to subscribe to
     * @param {function} callback - Function to call when event is triggered
     *
     * @example
     * // Execute once when window is created
     * eventBus.once(EVENTS.WINDOW_CREATED, (data) => {
     *   console.log(`Window created with ID: ${data.windowId}`);
     * });
     */
    /**
     * Subscribe to an event and automatically unsubscribe after first trigger.
     *
     * @param {string} event - Event name to subscribe to.
     * @param {function} callback - Function to call when event is triggered.
     * @returns {void}
     * @example
     * eventBus.once(EVENTS.WINDOW_CREATED, handler);
     */
    once(event, callback) {
        const onceCallback = (...args) => {
            this.unsubscribe(event, onceCallback);
            callback(...args);
        };
        this.subscribe(event, onceCallback);
    }

    /**
     * Unsubscribe from an event
     *
     * @param {string} event - Event name to unsubscribe from
     * @param {function} callback - Function to unsubscribe
     */
    /**
     * Unsubscribe from an event.
     *
     * @param {string} event - Event name to unsubscribe from.
     * @param {function} callback - Function to unsubscribe.
     * @returns {void}
     * @example
     * eventBus.unsubscribe(EVENTS.PROGRAM_OPEN, handler);
     */
    unsubscribe(event, callback) {
        // Check if event exists and has subscribers before filtering
        this.events[event]?.length &&
            (this.events[event] = this.events[event].filter((cb) => cb !== callback));
    }

    /**
     * Publish an event to all subscribers
     *
     * @param {string} event - Event name to publish
     * @param {any} data - Data to pass to subscribers
     *
     * @example
     * // Publish an event to open notepad
     * eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: 'notepad' });
     */
    /**
     * Publish an event to all subscribers.
     *
     * @param {string} event - Event name to publish.
     * @param {any} data - Data to pass to subscribers.
     * @returns {void}
     * @example
     * eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: 'notepad' });
     */
    publish(event, data) {
        // Execute each callback with the provided data
        this.events[event]?.forEach((callback) => callback(data));
    }
}

// Create and export a singleton instance
/**
 * Singleton instance of EventBus for global use.
 * @type {EventBus}
 */
export const eventBus = new EventBus(); 