/**
 * @fileoverview Window manager module for handling all window operations in the Windows XP simulation.
 * Handles window creation, focus, minimize, maximize, close, drag, cascade, and integration with the taskbar and event bus.
 *
 * Usage:
 *   import WindowManager from './windowManager.js';
 *   const windowManager = new WindowManager(eventBus);
 *
 * Edge Cases:
 *   - If required DOM containers are missing, window creation will fail.
 *   - If program registry is missing entries, unknown apps cannot be opened.
 */
import programData from '../utils/programRegistry.js';
import { EVENTS } from '../utils/eventBus.js';


const TASKBAR_HEIGHT = 30; // Define constant taskbar height

// At the top, after imports
let iframePool = null;
let preloadedIframes = {};

function createIframePool(apps) {
    iframePool = document.getElementById('iframe-pool');
    if (!iframePool) {
        iframePool = document.createElement('div');
        iframePool.id = 'iframe-pool';
        iframePool.style.position = 'absolute';
        iframePool.style.left = '-9999px';
        iframePool.style.top = '0';
        iframePool.style.zIndex = '-1';
        document.body.appendChild(iframePool);
    }
    // Preload iframes for each app
    Object.entries(apps).forEach(([programName, program]) => {
        if (!program.appPath || preloadedIframes[programName]) return;
        const iframe = document.createElement('iframe');
        iframe.src = program.appPath;
        iframe.title = `${programName}-content`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('width', '100%');
        iframe.setAttribute('height', '100%');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.background = 'transparent';
        iframePool.appendChild(iframe);
        preloadedIframes[programName] = iframe;
    });
}

/**
 * WindowTemplates provides templates for different window types (iframe, error, empty).
 *
 * @class
 * @example
 * const content = WindowTemplates.getTemplate('iframe-standard', programConfig);
 */
class WindowTemplates {
    /**
     * Gets a template container for windows
     * @param {string} [templateName] - Optional template type identifier
     * @param {object} [programConfig] - Optional program configuration object
     * @returns {HTMLElement} DOM element containing the window content
     */
    static getTemplate(templateName, programConfig) {
        // Use preloaded iframe for all apps, including mediaPlayer
        const programKey = programConfig.id.replace('-window', '');
        if (templateName === 'iframe-standard' && programConfig?.appPath) {
            if (preloadedIframes[programKey]) {
                // Use preloaded iframe
                const content = document.createElement('div');
                content.className = 'window-body iframe-container';
                content.appendChild(preloadedIframes[programKey]);
                return content;
            } else {
                // Fallback: create a new iframe (should be rare)
                return this.createIframeContainer(programConfig.appPath, programConfig.id);
            }
        }
        
        // Create error container for invalid templates or non-iframe types
        const content = this.createEmptyContainer();
        const errorMsg = !templateName 
            ? 'Error: Window template not specified or invalid configuration.'
            : `Error: Template '${templateName}' not found or missing appPath.`;
        
        content.innerHTML = `<p style="padding:10px;">${errorMsg}</p>`;
        return content;
    }
    
    /**
     * Creates a standard window container with no content
     * @returns {HTMLElement} Empty window content container
     */
    static createEmptyContainer() {
        const content = document.createElement('div');
        content.className = 'window-body';
        return content;
    }

    /**
     * Creates an iframe container for apps
     * @param {string} appPath - Path to the application's index.html
     * @param {string} windowId - The unique ID of the window element
     * @returns {HTMLElement} Container with an iframe
     */
    static createIframeContainer(appPath, windowId) {
        const container = document.createElement('div');
        container.className = 'window-body iframe-container'; 
        // Only show loading indicator for mediaPlayer if not using preloaded iframe
        if (windowId === 'mediaPlayer-window') {
            const loading = document.createElement('div');
            loading.className = 'window-loading-indicator';
            loading.innerHTML = `<div class="loader"></div>`;
            if (!document.getElementById('window-loading-indicator-style')) {
                const style = document.createElement('style');
                style.id = 'window-loading-indicator-style';
                style.textContent = `
                .window-loading-indicator {
                  position: absolute;
                  inset: 0;
                  background: #000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 10;
                  opacity: 1;
                  transition: opacity 0.25s;
                }
                .window-loading-indicator.fade-out {
                  opacity: 0;
                  pointer-events: none;
                }
                .window-loading-indicator .loader {
                  border: 4px solid rgba(255, 255, 255, 0.3);
                  border-top: 4px solid #ffffff;
                  border-radius: 50%;
                  width: 36px;
                  height: 36px;
                  animation: spin 1.5s linear infinite;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg);}
                  100% { transform: rotate(360deg);}
                }
                `;
                document.head.appendChild(style);
            }
            const iframe = document.createElement('iframe');
            Object.assign(iframe, { src: appPath, title: `${windowId}-content` });
            const attrs = {
                frameborder: '0',
                width: '100%',
                height: '100%',
                sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals',
                style: 'visibility:hidden; position:absolute; left:-9999px;'
            };
            for (const [attr, value] of Object.entries(attrs))
                iframe.setAttribute(attr, value);
            container.appendChild(loading);
            container.appendChild(iframe);
            let ready = false;
            let minTimePassed = false;
            function tryFadeOut() {
              if (ready && minTimePassed) {
                loading.classList.add('fade-out');
                iframe.style.visibility = 'visible';
                iframe.style.position = '';
                iframe.style.left = '';
                setTimeout(() => loading.remove(), 300);
                window.removeEventListener('message', onPlayerReady);
              }
            }
            setTimeout(() => {
              minTimePassed = true;
              tryFadeOut();
            }, 1000);
            function onPlayerReady(event) {
                if (event.source === iframe.contentWindow && event.data && event.data.type === 'mediaPlayer-ready') {
                    ready = true;
                    tryFadeOut();
                }
            }
            window.addEventListener('message', onPlayerReady);
            return container;
        }
        // Default: create iframe immediately
        const iframe = document.createElement('iframe');
        Object.assign(iframe, { src: appPath, title: `${windowId}-content` });
        const attrs = {
            frameborder: '0',
            width: '100%',
            height: '100%',
            sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
        };
        for (const [attr, value] of Object.entries(attrs))
            iframe.setAttribute(attr, value);
        container.appendChild(iframe);
        return container;
    }
}

export default /**
 * WindowManager handles all window operations, stacking, drag, focus, and taskbar integration.
 *
 * @class
 * @example
 * import WindowManager from './windowManager.js';
 * const windowManager = new WindowManager(eventBus);
 */
class WindowManager {
    /**
     * Create a new WindowManager instance.
     * @param {EventBus} eventBus - The event bus instance for communication.
     */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.windows = {};
        this.activeWindow = null;
        this.taskbarItems = {};
        this.windowCount = 0;
        this.cascadeOffset = 35;
        this.programData = programData;
        this.baseZIndex = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--z-window')) || 100;
        this.windowsContainer = document.getElementById('windows-container');
        this.zIndexStack = []; // Array to track window stacking order (IDs)
        // --- Multi-column cascade state ---
        this.cascadeColumn = 0;
        this.cascadeRow = 0;
        
        this._setupGlobalHandlers();
        this._subscribeToEvents();

        // In WindowManager constructor, after this.programData = programData;
        createIframePool(this.programData);

        // --- RUNTIME CHECK: Ensure .taskbar is a sibling of #windows-container, not a child ---
        const windowsContainer = document.getElementById('windows-container');
        const taskbar = document.querySelector('.taskbar');
        if (windowsContainer && taskbar) {
            if (taskbar.parentElement === windowsContainer) {
                console.warn('[WindowManager] .taskbar is inside #windows-container! This will break z-index stacking. Move .taskbar to be a sibling of #windows-container in the DOM.');
            }
        }
    }
    
    _setupGlobalHandlers() {
        document.addEventListener('mousedown', (e) => {
            const clickedOnDesktopSpace = e.target.classList.contains('desktop') || e.target.classList.contains('selection-overlay');
            if (clickedOnDesktopSpace && !e.target.closest('.window')) {
                    if (this.activeWindow) {
                        this.deactivateAllWindows();
                    }
                }
        }, true);

        window.addEventListener('message', (event) => {
            // Accept messages from same-origin or file protocol (local dev)
            if (!(window.location.protocol === 'file:' || event.origin === window.origin)) return;

            let windowElement = this._getWindowFromIframeSource(event.source);
            // PATCH: Fallback if not found (e.g., iframe moved or not in DOM)
            if (!windowElement) {
                // Try to find any .app-window containing an iframe with this contentWindow
                windowElement = Array.from(document.querySelectorAll('.app-window')).find(win => {
                    const iframe = win.querySelector('iframe');
                    return iframe && iframe.contentWindow === event.source;
                });
            }
            if (!windowElement) return;

            if (event.data?.type === 'minimize-window') {
                this.minimizeWindow(windowElement);
            } else if (event.data?.type === 'close-window') {
                this.closeWindow(windowElement);
            } else if (event.data?.type === 'updateStatusBar' && typeof event.data.text === 'string') {
                // Handle status bar updates from specific apps (like Notepad)
                if (windowElement.statusBarField) {
                    windowElement.statusBarField.textContent = event.data.text;
                }
            }
        }, true);
    }
    
    _subscribeToEvents() {
        this.eventBus.subscribe(EVENTS.PROGRAM_OPEN, data => this.openProgram(data.programName));
        this.eventBus.subscribe(EVENTS.WINDOW_FOCUSED, data => this._handleWindowFocus(data.windowId));
        this.eventBus.subscribe(EVENTS.WINDOW_MINIMIZED, data => this._handleWindowMinimize(data.windowId));
        this.eventBus.subscribe(EVENTS.WINDOW_MAXIMIZED, data => this._setWindowState(data.windowId, 'maximized'));
        this.eventBus.subscribe(EVENTS.WINDOW_UNMAXIMIZED, data => this._setWindowState(data.windowId, 'unmaximized'));
        this.eventBus.subscribe(EVENTS.WINDOW_CLOSED, data => this._handleWindowCloseCleanup(data.windowId));
        this.eventBus.subscribe(EVENTS.WINDOW_RESTORED, data => this._handleWindowRestore(data.windowId));
        this.eventBus.subscribe(EVENTS.TASKBAR_ITEM_CLICKED, data => this._handleTaskbarClick(data.windowId));
    }
    
    /**
     * Open a program window by name. Handles overlays and standard windows.
     * @param {string} programName - The name/key of the program to open.
     * @returns {void}
     */
    openProgram(programName) {
        const program = this.programData[programName];
        if (!program || !program.id) {
            console.error(`Invalid program data for: ${programName}`);
            return;
        }

        const existingWindow = document.getElementById(program.id);
        if (existingWindow) {
            // FIX: If minimized, restore and bring to front
            if (existingWindow.windowState && existingWindow.windowState.isMinimized) {
                this.restoreWindow(existingWindow);
            } else {
                this.bringToFront(existingWindow);
            }
            return;
        }

        if (program.isOpen) {
            program.isOpen = false;
        }

        const windowElement = this._createWindowElement(program);
        if (!windowElement) return;

        // Add opening animation class before appending
        windowElement.classList.add('window-opening');
        // Remove the class after animation ends
        windowElement.addEventListener('animationend', function handler(e) {
            if (e.animationName === 'windowOpenFadeSlide') {
                windowElement.classList.remove('window-opening');
                windowElement.removeEventListener('animationend', handler);
            }
        });

        this.windowsContainer.appendChild(windowElement);
        this._registerWindow(windowElement, program);
        this.positionWindow(windowElement);

        program.isOpen = true;
        this.eventBus.publish(EVENTS.WINDOW_CREATED, {
            windowId: windowElement.id,
            programName,
            title: program.title,
            icon: program.icon
        });

        if (program.startMinimized) {
            this.minimizeWindow(windowElement);
        } else {
            this.bringToFront(windowElement);
        }
    }
    
    _createWindowElement(program) {
        const windowElement = document.createElement('div');
        windowElement.id = program.id;
        windowElement.className = 'app-window';
        windowElement.setAttribute('data-program', program.id.replace('-window', ''));

        windowElement.innerHTML = this._getWindowBaseHTML(program);

        let content;
        if (program.template === 'iframe-standard' && preloadedIframes[program.id.replace('-window', '')]) {
            // Use preloaded iframe
            const iframe = preloadedIframes[program.id.replace('-window', '')];
            iframe.style.display = ''; // PATCH: Make visible when reused
            content = document.createElement('div');
            content.className = 'window-body iframe-container';
            content.appendChild(iframe);
        } else {
            content = WindowTemplates.getTemplate(program.template, program);
        }
        if (!content) {
             console.error(`Failed to get template "${program.template}" for ${program.id}`);
             return null;
        }
        windowElement.appendChild(content);
        this._addStartMenuOverlay(windowElement, content);

        // Create Status Bar
        const programName = program.id.replace('-window', ''); // Get program name
        if (programName !== 'cmd') {
            const statusBar = document.createElement('div');
            statusBar.className = 'status-bar';
            // --- Create main text field (dynamic or static) ---
            const statusBarField = document.createElement('p');
            statusBarField.className = 'status-bar-field'; // Class for the main/dynamic field
            // Determine initial text based on flags and program data
            let initialText = 'Ready';
            if (program.initialDynamicStatus) {
                initialText = program.initialStatusText || ''; // Use specific initial text or empty
            } else if (program.statusBarText) {
                initialText = program.statusBarText; // Use static text from registry
            }
            statusBarField.textContent = initialText;
            // --- Add Notepad-specific static items --- 
            if (programName === 'notepad') {
                statusBar.classList.add('notepad-statusbar'); // Add class for flex layout
                // Append dynamic field (Ln/Col) FIRST for Notepad
                statusBarField.classList.add('status-bar-item-dynamic');
                // Set Notepad's initial text here, overriding the general initialText if needed
                statusBarField.textContent = 'Ln 1, Col 1'; 
                statusBar.appendChild(statusBarField);
                // Then append static items
                ['ANSI', 'Windows (CRLF)', '100%'].forEach(text => {
                    const staticItem = document.createElement('p');
                    staticItem.className = 'status-bar-item-static';
                    staticItem.textContent = text;
                    statusBar.appendChild(staticItem);
                });
            } else {
                // For other apps, just append the default/custom field
                statusBar.appendChild(statusBarField);
            }
            // Append the status bar to the window element itself
            windowElement.appendChild(statusBar);
            // Store reference for dynamic updates (always points to the main field)
            windowElement.statusBarField = statusBarField; 
        }

        const defaultWidth = 600;
        const defaultHeight = 400;
        windowElement.style.width = `${program.dimensions?.width || defaultWidth}px`;
        windowElement.style.height = `${program.dimensions?.height || defaultHeight}px`;
        windowElement.style.position = 'absolute';

        return windowElement;
    }
    
    _getWindowBaseHTML(program) {
        return `
            <div class="window-inactive-mask"></div>
            <div class="title-bar">
                <div class="title-bar-left">
                    <div class="title-bar-icon">
                        <img src="${program.icon}" alt="${program.title}">
                    </div>
                    <div class="title-bar-text">${program.title}</div>
                </div>
                <div class="title-bar-controls">
                    ${program.canMinimize !== false ? '<button aria-label="Minimize" data-action="minimize"></button>' : ''}
                    ${program.canMaximize !== false ? '<button aria-label="Maximize" data-action="maximize"></button>' : ''}
                    <button aria-label="Close" data-action="close"></button>
                </div>
            </div>
        `;
    }
        
    _addStartMenuOverlay(windowElement, contentContainer) {
        const startMenuOverlay = document.createElement('div');
        startMenuOverlay.className = 'start-menu-content-click-overlay';
        const targetContainer = contentContainer.classList.contains('window-body') ? contentContainer : windowElement;
        if (targetContainer !== windowElement) {
            targetContainer.style.position = 'relative';
        }
        targetContainer.appendChild(startMenuOverlay);
    }
    
    _registerWindow(windowElement, program) {
        const windowId = windowElement.id;
        this.windows[windowId] = windowElement;
        this.taskbarItems[windowId] = this._createTaskbarItem(windowElement, program);

        windowElement.windowState = {
            isMaximized: false,
            isMinimized: false,
            originalStyles: {
                width: windowElement.style.width,
                height: windowElement.style.height,
                top: windowElement.style.top,
                left: windowElement.style.left,
                transform: windowElement.style.transform
            }
        };

        this._setupWindowEvents(windowElement);
        this._setupResponsiveHandling(windowElement);

        // Add to stack and update Z-indices
        this._updateStackOrder(windowId, 'add');
        this._updateZIndices();
    }
    
    _createTaskbarItem(windowElement, program) {
        const taskbarPrograms = document.querySelector('.taskbar-programs');
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item';
        taskbarItem.id = `taskbar-${windowElement.id}`;
        taskbarItem.setAttribute('data-window-id', windowElement.id);
        taskbarItem.innerHTML = `
            <img src="${program.icon}" alt="${program.title}" />
            <span>${program.title}</span>
        `;

        this._bindControl(taskbarItem, 'mousedown', () => {
            this.eventBus.publish(EVENTS.TASKBAR_ITEM_CLICKED, { windowId: windowElement.id });
        });

        taskbarPrograms.appendChild(taskbarItem);
        return taskbarItem;
    }
    
    _setupWindowEvents(windowElement) {
        const titleBar = windowElement.querySelector('.title-bar');
        const startMenuOverlay = windowElement.querySelector('.start-menu-content-click-overlay');

        this._bindControl(windowElement.querySelector('[data-action="close"]'), 'click', () => this.closeWindow(windowElement));
        this._bindControl(windowElement.querySelector('[data-action="minimize"]'), 'click', () => this.minimizeWindow(windowElement));
        this._bindControl(windowElement.querySelector('[data-action="maximize"]'), 'click', () => this.toggleMaximize(windowElement));

        if (titleBar) {
            this._bindControl(titleBar, 'dblclick', () => this.toggleMaximize(windowElement));
            this.makeDraggable(windowElement, titleBar);
        }

        this._bindControl(windowElement, 'mousedown', () => {
            if (windowElement !== this.activeWindow) {
                this.bringToFront(windowElement);
            }
        }, true);
        
        if (startMenuOverlay) {
            this._bindControl(startMenuOverlay, 'mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.eventBus.publish(EVENTS.STARTMENU_CLOSE_REQUEST);
            });
        }

        this._setupIframeActivationOverlay(windowElement);
    }
    
    _setupIframeActivationOverlay(windowElement) {
        const iframes = windowElement.querySelectorAll('iframe');
        if (!windowElement.iframeOverlays) windowElement.iframeOverlays = [];
        
        iframes.forEach(iframe => {
            const overlay = document.createElement('div');
            overlay.className = 'iframe-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            // Do not set z-index here; CSS ensures overlay is always below window content
            overlay.style.display = 'none';
            
            const iframeParent = iframe.parentElement;
            if (iframeParent) {
            iframeParent.style.position = 'relative';
            iframeParent.appendChild(overlay);
            
                this._bindControl(overlay, 'mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                    if (windowElement !== this.activeWindow) {
                        this.bringToFront(windowElement);
                    }
                });
                windowElement.iframeOverlays.push(overlay);
            }
        });
    }
    
    _handleTaskbarClick(windowId) {
        const windowElement = this.windows[windowId];
        if (windowElement) {
            if (windowElement.windowState.isMinimized) {
                this.restoreWindow(windowElement);
            } else if (this.activeWindow === windowElement) {
                this.minimizeWindow(windowElement);
            } else {
                this.bringToFront(windowElement);
            }
        } else {
            // Check if the program already exists but with a different ID
            const programName = windowId.replace('-window', '');
            
            // Check if any window for this program is already open
            const existingWindows = Object.values(this.windows);
            const existingWindow = existingWindows.find(window => 
                window.getAttribute('data-program') === programName
            );
            
            if (existingWindow) {
                // Existing window found, bring it to front or restore it
                if (existingWindow.windowState.isMinimized) {
                    this.restoreWindow(existingWindow);
                } else {
                    this.bringToFront(existingWindow);
                }
            } else if (programName && this.programData[programName]) {
                // No existing window - open a new one
                this.openProgram(programName);
            }
        }
    }
    
    _handleWindowFocus(windowId) {
        const windowElement = this.windows[windowId];
        if (windowElement && !windowElement.windowState.isMinimized) {
            this.bringToFront(windowElement);
        }
    }
    
    _handleWindowRestore(windowId) {
         const windowElement = this.windows[windowId];
         if (windowElement) {
             this.restoreWindow(windowElement);
         }
    }
    
    _handleWindowMinimize(windowId) {
        const windowElement = this.windows[windowId];
        if (windowElement) {
            this.minimizeWindow(windowElement);
        }
    }
    
    _handleWindowCloseCleanup(windowId) {
        const windowElement = this.windows[windowId];
        if (!windowElement) return;
        
        // Remove taskbar item from DOM first
        const taskbarItem = this.taskbarItems[windowId];
        if (taskbarItem && taskbarItem.parentNode) {
            taskbarItem.parentNode.removeChild(taskbarItem);
        }
        
        // Clean up references
        delete this.windows[windowId];
        delete this.taskbarItems[windowId];
        
        // If this was the active window, activate next window in stack
        if (this.activeWindow === windowElement) {
            this.activeWindow = null;
            // Find and focus next window
            this._refreshActiveWindow();
        }
        
        this.windowCount = Math.max(0, this.windowCount - 1);

        // Remove from stack and update Z-indices
        this._updateStackOrder(windowId, 'remove');
        this._updateZIndices();

        // If this window used a preloaded iframe, move it back to the pool
        const programName = windowId.replace('-window', '');
        const iframe = preloadedIframes[programName];
        if (iframe && iframe.parentNode && iframe.parentNode !== iframePool) {
            iframePool.appendChild(iframe);
            iframe.style.display = 'none'; // PATCH: Hide iframe in pool
        }
    }
    
    _refreshActiveWindow() {
        // Find the topmost non-minimized window to activate
        const topWindow = this._findTopWindow();
        if (topWindow) {
            this.bringToFront(topWindow);
        } else {
            // No windows active - make sure all taskbar items are inactive
            this._clearAllTaskbarItemStates();
        }
    }
    
    _clearAllTaskbarItemStates() {
        Object.values(this.taskbarItems).forEach(taskbarItem => {
            if (taskbarItem) {
                taskbarItem.classList.remove('active');
            }
        });
    }
    
    _updateTaskbarItemState(windowId, isActive) {
        // Always clear all active states first for consistency
        this._clearAllTaskbarItemStates();
        
        // If we're setting a window active, update just that one
        if (isActive) {
            const taskbarItem = this.taskbarItems[windowId];
            if (taskbarItem) {
                taskbarItem.classList.add('active');
            }
        }

        }
    
    /**
     * Close a window and clean up associated DOM and taskbar items.
     * @param {HTMLElement} windowElement - The window DOM element to close.
     * @returns {void}
     */
    closeWindow(windowElement) {
        if (!windowElement) return;
        const windowId = windowElement.id;
        // Prevent double-close
        if (windowElement.classList.contains('window-closing')) return;
        // Add closing animation class
        windowElement.classList.add('window-closing');
        windowElement.addEventListener('animationend', function handler(e) {
            if (e.animationName === 'windowCloseFade') {
                windowElement.removeEventListener('animationend', handler);
                // Remove from DOM after animation
                if (windowElement.parentNode) {
                    windowElement.parentNode.removeChild(windowElement);
                }
            }
        });
        this._handleWindowCloseCleanup(windowId);
        if (windowElement.responsiveObserver) {
            windowElement.responsiveObserver.disconnect();
            windowElement.responsiveObserver = null;
        }
        if (windowElement.iframeResizeObserver) {
            windowElement.iframeResizeObserver.disconnect();
            windowElement.iframeResizeObserver = null;
        }
        if (typeof programName !== 'undefined' && this.programData[programName]) {
            this.programData[programName].isOpen = false;
        }
        this.eventBus.publish(EVENTS.WINDOW_CLOSED, { windowId });
    }
    
    /**
     * Minimize a window (hide and update taskbar state).
     * @param {HTMLElement} windowElement - The window DOM element to minimize.
     * @returns {void}
     */
    minimizeWindow(windowElement) {
         if (!windowElement || windowElement.windowState.isMinimized) return;
        // Calculate transform to taskbar icon (bottom center to icon center)
        const taskbarItem = this.taskbarItems[windowElement.id];
        let minimizeTransform = 'scale(0.55)'; // fallback
        if (taskbarItem) {
            const winRect = windowElement.getBoundingClientRect();
            const taskbarRect = taskbarItem.getBoundingClientRect();
            // Window bottom center
            const winBottomCenterX = winRect.left + winRect.width / 2;
            const winBottomCenterY = winRect.top + winRect.height;
            // Taskbar icon center
            const taskbarCenterX = taskbarRect.left + taskbarRect.width / 2;
            const taskbarCenterY = taskbarRect.top + taskbarRect.height / 2;
            // Scale factor (XP-like)
            const scale = 0.55;
            // Translate X and Y so window bottom center moves to taskbar icon center
            const translateX = taskbarCenterX - winBottomCenterX;
            const translateY = taskbarCenterY - winBottomCenterY;
            minimizeTransform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        }
        windowElement.style.setProperty('--window-minimize-transform', minimizeTransform);
        windowElement.classList.add('window-minimizing');
        windowElement.addEventListener('animationend', function handler(e) {
            if (e.animationName === 'windowMinimizeZoom') {
                windowElement.classList.remove('window-minimizing');
                windowElement.style.removeProperty('--window-minimize-transform');
                windowElement.style.display = 'none';
        windowElement.classList.add('minimized');
        windowElement.windowState.isMinimized = true;
                this._setWindowZIndex(windowElement, '');
        this._updateTaskbarItemState(windowElement.id, false);
        this._updateStackOrder(windowElement.id, 'remove');
        this._updateZIndices();
        if (this.activeWindow === windowElement) {
            this.activeWindow = null;
            const topWindow = this._findTopWindow();
            if (topWindow) {
                this.bringToFront(topWindow);
            }
        }
        this.eventBus.publish(EVENTS.WINDOW_MINIMIZED, { windowId: windowElement.id });
                windowElement.removeEventListener('animationend', handler);
            }
        }.bind(this));
    }
    
    /**
     * Restore a minimized window to its previous state and focus.
     * @param {HTMLElement} windowElement - The window DOM element to restore.
     * @returns {void}
     */
    restoreWindow(windowElement) {
        if (!windowElement || !windowElement.windowState.isMinimized) return;
        windowElement.classList.remove('minimized');
        windowElement.windowState.isMinimized = false;
        windowElement.style.display = 'flex';
        // Calculate transform from taskbar icon (bottom center to icon center)
        const taskbarItem = this.taskbarItems[windowElement.id];
        let restoreTransform = 'scale(0.55)'; // fallback
        if (taskbarItem) {
            const winRect = windowElement.getBoundingClientRect();
            const taskbarRect = taskbarItem.getBoundingClientRect();
            // Window bottom center
            const winBottomCenterX = winRect.left + winRect.width / 2;
            const winBottomCenterY = winRect.top + winRect.height;
            // Taskbar icon center
            const taskbarCenterX = taskbarRect.left + taskbarRect.width / 2;
            const taskbarCenterY = taskbarRect.top + taskbarRect.height / 2;
            // Scale factor (XP-like)
            const scale = 0.55;
            // Translate X and Y so window bottom center moves from taskbar icon center
            const translateX = taskbarCenterX - winBottomCenterX;
            const translateY = taskbarCenterY - winBottomCenterY;
            restoreTransform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        }
        windowElement.style.setProperty('--window-restore-transform', restoreTransform);
        windowElement.classList.add('window-restoring');
        windowElement.addEventListener('animationend', function handler(e) {
            if (e.animationName === 'windowRestoreZoom') {
                windowElement.classList.remove('window-restoring');
                windowElement.style.removeProperty('--window-restore-transform');
                windowElement.removeEventListener('animationend', handler);
            }
        });
        this._updateStackOrder(windowElement.id, 'add');
        this.bringToFront(windowElement);
    }
    
    /**
     * Toggle maximize/restore for a window.
     * @param {HTMLElement} windowElement - The window DOM element to maximize/restore.
     * @returns {void}
     */
    toggleMaximize(windowElement) {
        if (!windowElement) return;
        const state = windowElement.windowState;
        const maximizeBtn = windowElement.querySelector('[aria-label="Maximize"]');
        
        if (!state.isMaximized) {
            // Maximize
            const rect = windowElement.getBoundingClientRect();
            // Store current styles *before* maximizing
            state.originalStyles = {
                width: windowElement.style.width || rect.width + 'px',
                height: windowElement.style.height || rect.height + 'px',
                top: windowElement.style.top || rect.top + 'px',
                left: windowElement.style.left || rect.left + 'px',
                transform: windowElement.style.transform || ''
            };

            // Dynamically measure the taskbar height
            const vw = document.documentElement.clientWidth;
            const vh = document.documentElement.clientHeight;
            const taskbar = document.querySelector('.taskbar');
            const taskbarHeight = taskbar ? taskbar.offsetHeight : TASKBAR_HEIGHT;
            windowElement.style.top = '0px';
            windowElement.style.left = '0px';
            windowElement.style.width = vw + 'px';
            windowElement.style.height = (vh - taskbarHeight) + 'px';
            windowElement.style.transform = 'none';
            
            state.isMaximized = true;
            windowElement.classList.add('maximized'); // Add class to trigger CSS styles
            if (maximizeBtn) maximizeBtn.classList.add('restore');
            // Send maximized message to iframe if present
            const iframe = windowElement.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({ type: 'window:maximized' }, '*');
            }
            this.eventBus.publish(EVENTS.WINDOW_MAXIMIZED, { windowId: windowElement.id });

        } else {
            // Restore
            // Explicitly set saved styles back
            windowElement.style.width = state.originalStyles.width;
            windowElement.style.height = state.originalStyles.height;
            windowElement.style.top = state.originalStyles.top;
            windowElement.style.left = state.originalStyles.left;
            windowElement.style.transform = state.originalStyles.transform;

            // Clear potentially conflicting maximized styles explicitly
             windowElement.style.margin = '';
             windowElement.style.border = '';
             windowElement.style.borderRadius = ''; 
             windowElement.style.boxSizing = ''; 
            
            state.isMaximized = false;
            windowElement.classList.remove('maximized'); // Remove class
            if (maximizeBtn) maximizeBtn.classList.remove('restore');
            // Send unmaximized message to iframe if present
            const iframe = windowElement.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({ type: 'window:unmaximized' }, '*');
            }
            this.eventBus.publish(EVENTS.WINDOW_UNMAXIMIZED, { windowId: windowElement.id });
        }
    }
    
    /**
     * Bring the specified window to the front/top of the stack.
     * @param {HTMLElement} windowElement - The window DOM element to bring to front.
     * @returns {void}
     */
    bringToFront(windowElement) {
        if (!windowElement || this.activeWindow === windowElement || windowElement.windowState.isMinimized) {
            return;
        }

        if (windowElement.windowState.isMinimized) {
             this.restoreWindow(windowElement);
            return;
        }
        
        const previouslyActive = this.activeWindow;
        this.deactivateAllWindows(windowElement);

        windowElement.classList.add('active');
        this.activeWindow = windowElement;

        // Update stack order and apply new Z-indices
        this._updateStackOrder(windowElement.id, 'add');
        this._updateZIndices();

        this._toggleInactiveMask(windowElement, false); // Hide mask
        this._toggleIframeOverlays(windowElement, false); // Hide overlays
        this._updateTaskbarItemState(windowElement.id, true);

        if (previouslyActive !== this.activeWindow) {
             this.eventBus.publish(EVENTS.WINDOW_FOCUSED, { windowId: windowElement.id });
        }
    }
    
    /**
     * Deactivate all windows except the optionally specified one.
     * @param {HTMLElement|null} excludeWindow - A window to exclude from deactivation.
     * @returns {void}
     */
    deactivateAllWindows(excludeWindow = null) {
        Object.values(this.windows).forEach(win => {
            if (win !== excludeWindow) {
                win.classList.remove('active');
                this._toggleInactiveMask(win, true); // Show mask
                this._toggleIframeOverlays(win, true); // Show overlays
                this._updateTaskbarItemState(win.id, false); // Deactivate taskbar
            }
        });

        if (!excludeWindow) {
            this.activeWindow = null;
        }
    }
    
    _setWindowZIndex(windowElement, zIndex) {
        if (windowElement) {
            windowElement.style.zIndex = zIndex;
        }
    }
    
    _toggleInactiveMask(windowElement, show) {
        const inactiveMask = windowElement.querySelector('.window-inactive-mask');
        if (inactiveMask) {
            inactiveMask.style.display = show ? 'block' : 'none';
        }
    }
    
    _toggleIframeOverlays(windowElement, show) {
        if (windowElement.iframeOverlays) {
            windowElement.iframeOverlays.forEach(overlay => overlay.style.display = show ? 'block' : 'none');
        }
    }
    
    positionWindow(windowElement) {
        const programName = windowElement.getAttribute('data-program');
        const program = this.programData[programName];

        if (program && program.position && program.position.type === "custom") {
            this.positionWindowCustom(windowElement, program.position);
        } else {
            this.positionWindowCascade(windowElement);
        }
        if (windowElement.windowState) {
            windowElement.windowState.originalStyles.left = windowElement.style.left;
            windowElement.windowState.originalStyles.top = windowElement.style.top;
            windowElement.windowState.originalStyles.transform = windowElement.style.transform;
        }
    }
    
    positionWindowCascade(windowElement) {
        const windowHeight = parseInt(windowElement.style.height) || 400;
        const viewportHeight = document.documentElement.clientHeight;
        const maxTop = viewportHeight - windowHeight - TASKBAR_HEIGHT;
        // Calculate position using current column/row
        const position = this._calculateCascadePosition(this.cascadeColumn, this.cascadeRow);
        let adjustedTop = position.y;
        if (adjustedTop > maxTop) {
            adjustedTop = Math.max(0, maxTop);
        }
        adjustedTop = Math.max(0, adjustedTop);
        windowElement.style.position = 'absolute';
        windowElement.style.left = position.x + 'px';
        windowElement.style.top = adjustedTop + 'px';
        windowElement.style.transform = 'none';
        // --- Multi-column cascade logic ---
        // Check if next window would overflow vertically
        const nextRowY = 100 + ((this.cascadeRow + 1) * this.cascadeOffset);
        const wouldOverflow = (nextRowY + windowHeight > viewportHeight - TASKBAR_HEIGHT - 20);
        if (wouldOverflow) {
            this.cascadeColumn++;
            this.cascadeRow = 0;
        } else {
            this.cascadeRow++;
        }
        // Optionally, reset columns if we go too far right (wrap around)
        const maxOffsetX = Math.min(document.documentElement.clientWidth * 0.8, document.documentElement.clientWidth - 200);
        const nextColX = 120 + (this.cascadeColumn * 200); // 200px per col
        if (nextColX > maxOffsetX) {
            this.cascadeColumn = 0;
            this.cascadeRow = 0;
        }
        this.windowCount++;
    }
    
    positionWindowCustom(windowElement, posConfig) {
        const programName = windowElement.getAttribute('data-program');
        const program = this.programData[programName];
        const windowWidth = program?.dimensions?.width || parseInt(windowElement.style.width) || 600;
        const windowHeight = program?.dimensions?.height || parseInt(windowElement.style.height) || 400;
        const position = this._calculateCustomPosition(windowElement, posConfig, windowWidth, windowHeight);
        if (position) {
            windowElement.style.position = 'absolute';
            windowElement.style.left = `${position.x}px`;
            windowElement.style.top = `${position.y}px`;
            windowElement.style.transform = 'none';
        } else {
            this.positionWindowCascade(windowElement);
        }
    }
    
    _calculateCascadePosition(col, row) {
        const initialOffsetX = 120;
        const initialOffsetY = 50;
        const columnSpacing = 500; // Each new column is 200px to the right
        const columnYOffset = 20; // Each new column starts 40px lower
        // Diagonal offset within a column, plus extra Y offset per column
        const offsetX = initialOffsetX + (col * columnSpacing) + (row * this.cascadeOffset);
        const offsetY = initialOffsetY + (col * columnYOffset) + (row * this.cascadeOffset);
        return { x: offsetX, y: offsetY };
    }
    
    _calculateCustomPosition(windowElement, posConfig, windowWidth, windowHeight) {
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const taskbarHeight = document.querySelector('.taskbar')?.offsetHeight || TASKBAR_HEIGHT;
        const adjustedViewportHeight = viewportHeight - taskbarHeight;
        const safeMarginX = 20;
        const safeMarginY = 20;
        const maxLeftPos = viewportWidth - windowWidth - safeMarginX;
        const maxTopPos = adjustedViewportHeight - windowHeight - safeMarginY;
        let leftPos = 0;
        let topPos = 0;
        switch (posConfig.align) {
            case "bottom-right":
                leftPos = viewportWidth - windowWidth - (posConfig.offsetX || 0);
                topPos = adjustedViewportHeight - windowHeight - (posConfig.offsetY || 0);
                break;
            case "center-right":
                leftPos = viewportWidth - windowWidth - (posConfig.offsetX || 0);
                topPos = Math.max(0, (adjustedViewportHeight - windowHeight) / 2 + (posConfig.offsetY || 0));
                break;
            case "center-left":
                leftPos = posConfig.offsetX || 0;
                topPos = Math.max(0, (adjustedViewportHeight - windowHeight) / 2 + (posConfig.offsetY || 0));
                break;
            case "left-of-browser":
                const browserWidth = 1000;
                const browserHeight = 850;
                const browserShiftOffset = 175;
                const browserLeft = (viewportWidth / 2) - browserShiftOffset;
                const browserTop = Math.max(0, (adjustedViewportHeight - browserHeight) / 2);
                const browserBottom = browserTop + browserHeight;
                leftPos = browserLeft - windowWidth - (posConfig.offsetX || 0);
                topPos = browserBottom - windowHeight;
                break;
            case "left-of-browser-top":
                const browserWidthTop = 1000;
                const browserHeightTop = 850;
                const browserShiftOffsetTop = 175;
                const browserLeftTop = (viewportWidth / 2) - browserShiftOffsetTop;
                const browserTopTop = Math.max(0, (adjustedViewportHeight - browserHeightTop) / 2);
                leftPos = browserLeftTop - windowWidth - (posConfig.offsetX || 0);
                topPos = browserTopTop + (posConfig.offsetY || 0);
                break;
            case "bottom-left":
                leftPos = posConfig.offsetX || 0;
                topPos = adjustedViewportHeight - windowHeight - (posConfig.offsetY || 0);
                break;
            case "top-right":
                leftPos = viewportWidth - windowWidth - (posConfig.offsetX || 0);
                topPos = posConfig.offsetY || 0;
                break;
            case "top-left":
                leftPos = posConfig.offsetX || 0;
                topPos = posConfig.offsetY || 0;
                break;
            case "center":
                const centerShiftOffset = 175;
                leftPos = (viewportWidth / 2) - centerShiftOffset;
                topPos = (adjustedViewportHeight - windowHeight) / 2;
                break;
            default:
                return null;
        }
        leftPos = Math.max(safeMarginX, Math.min(leftPos, maxLeftPos));
        topPos = Math.max(safeMarginY, Math.min(topPos, maxTopPos));
        return { x: leftPos, y: topPos };
    }
    
    _constrainWindowToViewport(windowElement) {
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const taskbarHeight = TASKBAR_HEIGHT;
        const windowWidth = parseInt(windowElement.style.width) || 600;
        const windowHeight = parseInt(windowElement.style.height) || 400;
        let windowLeft = parseInt(windowElement.style.left) || 0;
        let windowTop = parseInt(windowElement.style.top) || 0;

        const minVisibleWidth = 50;
        const minVisibleHeight = 20;

        windowLeft = Math.max(-windowWidth + minVisibleWidth, Math.min(windowLeft, viewportWidth - minVisibleWidth));
        windowTop = Math.max(0, Math.min(windowTop, viewportHeight - taskbarHeight - minVisibleHeight));

        windowElement.style.left = `${windowLeft}px`;
        windowElement.style.top = `${windowTop}px`;

        if (windowElement.windowState) {
            windowElement.windowState.originalStyles.left = windowElement.style.left;
            windowElement.windowState.originalStyles.top = windowElement.style.top;
        }
    }
    
    /**
     * Make a window draggable by its handle element.
     * @param {HTMLElement} windowElement - The window DOM element to drag.
     * @param {HTMLElement} handleElement - The handle (e.g., titlebar) to initiate drag.
     * @returns {void}
     */
    makeDraggable(windowElement, handleElement) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let dragOffsetX = 0, dragOffsetY = 0;

        const endDrag = (e) => {
            if (!isDragging) return;

            const finalClientX = e.clientX ?? (e.changedTouches?.[0]?.clientX ?? startX);
            const finalClientY = e.clientY ?? (e.changedTouches?.[0]?.clientY ?? startY);
            const deltaX = finalClientX - startX;
            const deltaY = finalClientY - startY;
            const viewportWidth = document.documentElement.clientWidth;
            const viewportHeight = document.documentElement.clientHeight;
            const taskbarHeight = TASKBAR_HEIGHT;
            const windowWidth = windowElement.offsetWidth;
            const windowHeight = windowElement.offsetHeight;
            const finalLeft = initialX + deltaX;
            const finalTop = initialY + deltaY;
            
            const constrainedLeft = Math.max(-windowWidth + 100, Math.min(finalLeft, viewportWidth - 100));
            const constrainedTop = Math.max(0, Math.min(finalTop, viewportHeight - taskbarHeight - 20));

            windowElement.style.left = `${constrainedLeft}px`;
            windowElement.style.top = `${constrainedTop}px`;

            if (windowElement.windowState) {
                windowElement.windowState.originalStyles.left = windowElement.style.left;
                windowElement.windowState.originalStyles.top = windowElement.style.top;
                windowElement.windowState.originalStyles.transform = 'none';
            }
            
            cleanupAfterDrag();
            isDragging = false;
        };

        function prepareWindowForDrag() {
            windowElement.classList.add('dragging-window');
            const rect = windowElement.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            const parentRect = windowElement.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
            const currentStyle = windowElement.currentStyle || window.getComputedStyle(windowElement);
            const currentLeft = parseFloat(currentStyle.left) || 0;
            const currentTop = parseFloat(currentStyle.top) || 0;
            dragOffsetX = rect.left - parentRect.left - currentLeft;
            dragOffsetY = rect.top - parentRect.top - currentTop;            
            windowElement.style.transform = `translate3d(0px, 0px, 0px)`;
        }
        
        function cleanupAfterDrag() {
            windowElement.classList.remove('dragging-window');
            windowElement.style.transform = 'none';
        }
        
        handleElement.addEventListener('mousedown', (e) => {
             if (e.button !== 0 || e.target.tagName === 'BUTTON' || (windowElement.windowState && windowElement.windowState.isMaximized)) return;
            startX = e.clientX;
            startY = e.clientY;
            isDragging = true;
            prepareWindowForDrag();
            e.preventDefault();
        });
        handleElement.addEventListener('touchstart', (e) => {
             if (e.target.tagName === 'BUTTON' || (windowElement.windowState && windowElement.windowState.isMaximized)) return;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isDragging = true;
            prepareWindowForDrag();
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('mousemove', (e) => {
             if (isDragging) {
                 const deltaX = e.clientX - startX;
                 const deltaY = e.clientY - startY;
                 e.preventDefault(); 
                windowElement.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
             }
         }, { passive: false });
        document.addEventListener('touchmove', (e) => {
             if (isDragging) {
                 const touch = e.touches[0];
                 const deltaX = touch.clientX - startX;
                 const deltaY = touch.clientY - startY;
                 e.preventDefault();
                windowElement.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
             }
         }, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);
    }
    
    _setupResponsiveHandling(windowElement) {
        const resizeObserver = new ResizeObserver(() => {
            if (windowElement && windowElement.windowState && !windowElement.windowState.isMaximized && !windowElement.windowState.isMinimized) {
                this._constrainWindowToViewport(windowElement);
            }
        });
        resizeObserver.observe(document.body);
        windowElement.responsiveObserver = resizeObserver;
    }
    
    _getWindowFromIframeSource(eventSource) {
        // Find the iframe whose contentWindow matches eventSource
        const iframe = Array.from(document.querySelectorAll('iframe')).find(
            iframe => iframe.contentWindow === eventSource
        );
        // Support both .window and .app-window containers
        if (!iframe) return null;
        let win = iframe.closest('.app-window');
        if (!win) win = iframe.closest('.window');
        return win;
    }
    
    _findTopWindow() {
        let topWindow = null;
        let maxZ = this.baseZIndex -1 ;
        Object.values(this.windows).forEach(win => {
            if (!win.windowState.isMinimized) {
                const z = parseInt(win.style.zIndex) || this.baseZIndex;
                if (z > maxZ) {
                    maxZ = z;
                    topWindow = win;
                }
            }
        });
        return topWindow;
    }
    
    _bindControl(element, eventType, handler, useCapture = false) {
        if (element) {
            element.addEventListener(eventType, handler, useCapture);
        }
    }

    // New method to manage the zIndexStack array
    _updateStackOrder(windowId, action = 'add') {
        // Remove existing entry if present
        const index = this.zIndexStack.indexOf(windowId);
        if (index > -1) {
            this.zIndexStack.splice(index, 1);
        }
        // Add to the front (top) if action is 'add'
        if (action === 'add') {
            this.zIndexStack.unshift(windowId);
        }
    }

    // New method to apply z-index based on stack order
    _updateZIndices() {
        const stackLength = this.zIndexStack.length;
        // Get the taskbar z-index from CSS variable
        const taskbarZIndex = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--z-taskbar')) || 500;
        const maxWindowZIndex = taskbarZIndex - 1;
        this.zIndexStack.forEach((id, index) => {
            const windowElement = this.windows[id];
            if (windowElement && !windowElement.windowState.isMinimized) { // Only apply to non-minimized
                // Higher index in array means lower stack position visually
                let zIndexValue = this.baseZIndex + (stackLength - 1 - index);
                // Cap window z-index so it never reaches or exceeds the taskbar
                if (zIndexValue >= taskbarZIndex) {
                    zIndexValue = maxWindowZIndex;
                }
                this._setWindowZIndex(windowElement, zIndexValue);
            } else if (windowElement) {
                 // Clear z-index for minimized windows
                 this._setWindowZIndex(windowElement, '');
            }
        });
    }

    // Helper: Calculate transform from window to taskbar button
    _getTaskbarFlyTransform(windowElement) {
        const taskbarItem = this.taskbarItems[windowElement.id];
        if (!taskbarItem) return null;
        const winRect = windowElement.getBoundingClientRect();
        const taskbarRect = taskbarItem.getBoundingClientRect();
        // Center points
        const winCenterX = winRect.left + winRect.width / 2;
        const winCenterY = winRect.top + winRect.height / 2;
        const taskbarCenterX = taskbarRect.left + taskbarRect.width / 2;
        const taskbarCenterY = taskbarRect.top + taskbarRect.height / 2;
        // Scale factors
        const scaleX = taskbarRect.width / winRect.width;
        const scaleY = taskbarRect.height / winRect.height;
        // Translate so window center moves to taskbar center
        const translateX = taskbarCenterX - winCenterX;
        const translateY = taskbarCenterY - winCenterY;
        return { scaleX, scaleY, translateX, translateY };
    }
}

export { createIframePool };