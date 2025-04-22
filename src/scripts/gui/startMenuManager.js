/**
 * Start Menu module for Windows XP simulation
 * Handles the start menu display, interaction, and submenus
 */
import { EVENTS } from '../utils/eventBus.js';

export default class StartMenu {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.startButton = document.getElementById('start-button');
        this.startMenu = null;
        this.allProgramsMenu = null;
        this.mostUsedToolsMenu = null;
        this.aiToolsMenu = null;
        this.activeWindowOverlay = null; // Keep track of which overlay is active
        
        this.createStartMenuElement();
        this.setupEventListeners();
        
        // Subscribe to event bus for start menu toggle and close requests
        this.eventBus.subscribe(EVENTS.STARTMENU_TOGGLE, () => this.toggleStartMenu());
        this.eventBus.subscribe(EVENTS.STARTMENU_CLOSE_REQUEST, () => {
            if (this.startMenu?.classList.contains('active')) {
                this.closeStartMenu();
            }
        });
        // Listen for window focus changes
        this.eventBus.subscribe(EVENTS.WINDOW_FOCUSED, (data) => {
            this.updateContentOverlay(data?.windowId);
        });
    }
    
    /**
     * Create the start menu DOM element
     */
    createStartMenuElement() {
        const existingMenu = document.querySelector('.startmenu');
        if (existingMenu) {
            existingMenu.parentNode.removeChild(existingMenu);
        }
        
        const startMenu = document.createElement('div');
        startMenu.className = 'startmenu';
        startMenu.innerHTML = this.getMenuTemplate();
        startMenu.style.visibility = 'hidden';
        startMenu.style.opacity = '0';
        
        document.body.appendChild(startMenu);
        this.startMenu = startMenu;
        
        this.createAllProgramsMenu();
        this.createMostUsedToolsMenu();
        this.createAiToolsMenu();
        this.setupMenuItems();
        this._setupDelegatedEventHandlers();
    }

    /**
     * Helper function to create a submenu element.
     * @param {string} className - The CSS class for the submenu container.
     * @param {string} innerHTML - The HTML content for the submenu.
     * @param {string} propertyName - The name of the class property to assign the element to.
     * @returns {HTMLElement} The created submenu element.
     */
    _createSubMenu(className, menuHTML, propertyName) {
        if (!this[propertyName]) {
            const menuElement = document.createElement('div');
            menuElement.className = className;
            menuElement.innerHTML = menuHTML;
            menuElement.style.display = 'none';
            document.body.appendChild(menuElement);
            this[propertyName] = menuElement;
        }
        return this[propertyName];
    }

    /**
     * Create the All Programs submenu
     */
    createAllProgramsMenu() {
        const menuHTML = `
            <ul class="all-programs-items">
                <li class="all-programs-item" data-program-name="media-player">
                    <img src="./assets/gui/start-menu/media-player.webp" alt="Media Player">
                    Media Player
                </li>
                <li class="all-programs-item" data-program-name="my-pictures">
                    <img src="./assets/gui/start-menu/photo-viewer.webp" alt="My Photos">
                    My Photos
                </li>
                <li class="all-programs-item" data-program-name="notepad">
                    <img src="./assets/gui/start-menu/notepad.webp" alt="Notepad">
                    Notepad
                </li>
                <li class="all-programs-item" data-program-name="cmd-prompt">
                    <img src="./assets/gui/start-menu/command-prompt.webp" alt="Command Prompt">
                    Command Prompt
                </li>
                <li class="all-programs-separator"></li>
                <li class="all-programs-item" data-program-name="about-me">
                    <img src="./assets/gui/desktop/about-me.webp" alt="About Me">
                    About Me
                </li>
                <li class="all-programs-item" data-program-name="my-projects">
                    <img src="./assets/gui/desktop/my-projects.webp" alt="My Projects">
                    My Projects
                </li>
                <li class="all-programs-item" data-program-name="contact-me">
                    <img src="./assets/gui/desktop/email.webp" alt="Contact Me">
                    Contact Me
                </li>
                <li class="all-programs-item" data-action="open-url" data-url="https://www.linkedin.com">
                    <img src="./assets/gui/start-menu/linkedin.webp" alt="LinkedIn">
                    LinkedIn
                </li>
                <li class="all-programs-item" data-action="open-url" data-url="https://github.com">
                    <img src="./assets/gui/start-menu/github.webp" alt="GitHub">
                    GitHub
                </li>
                <li class="all-programs-item" data-action="open-url" data-url="https://www.instagram.com">
                    <img src="./assets/gui/start-menu/instagram.webp" alt="Instagram">
                    Instagram
                </li>
            </ul>
        `;
        const menuElement = this._createSubMenu('all-programs-menu', menuHTML, 'allProgramsMenu');
        
        // Add mousedown/mouseup event listeners for the clicked effect
        const items = menuElement.querySelectorAll('.all-programs-item');
        items.forEach(item => {
            item.addEventListener('mousedown', e => {
                e.preventDefault(); // Prevent text selection
                e.target.closest('.all-programs-item').classList.add('menu-item-clicked');
            });
            
            // Remove the effect on mouseup, mouseleave, and mouseout to ensure it's removed
            ['mouseup', 'mouseleave', 'mouseout'].forEach(eventType => {
                item.addEventListener(eventType, e => {
                    e.target.closest('.all-programs-item')?.classList.remove('menu-item-clicked');
                });
            });
        });
    }
    
    /**
     * Create the Most Used Tools submenu (previously Creative Suite)
     */
    createMostUsedToolsMenu() {
        const menuHTML = `
            <ul class="most-used-tools-items">
                <li class="most-used-tools-item" data-program-name="program1">
                    <img src="./assets/gui/start-menu/vanity-apps/photoshop.webp" alt="Adobe Photoshop">
                    Adobe Photoshop
                </li>
                <li class="most-used-tools-item" data-program-name="program2">
                    <img src="./assets/gui/start-menu/vanity-apps/premiere.webp" alt="Adobe Premiere Pro">
                    Adobe Premiere Pro
                </li>
                <li class="most-used-tools-item" data-program-name="program3">
                    <img src="./assets/gui/start-menu/vanity-apps/illustrator.webp" alt="Adobe Illustrator">
                    Adobe Illustrator
                </li>
                <li class="most-used-tools-item" data-program-name="after-effects">
                    <img src="./assets/gui/start-menu/vanity-apps/after-effects.webp" alt="Adobe After Effects">
                    Adobe After Effects
                </li>
                <li class="most-used-tools-item" data-program-name="indesign">
                    <img src="./assets/gui/start-menu/vanity-apps/indesign.webp" alt="Adobe InDesign">
                    Adobe InDesign
                </li>
                <li class="most-used-tools-item" data-program-name="lightroom">
                    <img src="./assets/gui/start-menu/vanity-apps/lightroom.webp" alt="Adobe Lightroom">
                    Adobe Lightroom
                </li>
                <li class="most-used-tools-item" data-program-name="program6">
                    <img src="./assets/gui/start-menu/vanity-apps/blender.webp" alt="Blender">
                    Blender
                </li>
                <li class="most-used-tools-item" data-program-name="program5">
                    <img src="./assets/gui/start-menu/vanity-apps/vscode.webp" alt="VS Code">
                    VS Code
                </li>
                <li class="most-used-tools-item" data-program-name="figma">
                    <img src="./assets/gui/start-menu/vanity-apps/figma.webp" alt="Figma">
                    Figma
                </li>
            </ul>
        `;
        const menuElement = this._createSubMenu('most-used-tools-menu', menuHTML, 'mostUsedToolsMenu');
        // Disable all items
        menuElement.querySelectorAll('.most-used-tools-item').forEach(item => item.classList.add('disabled'));
        
        // Add mousedown/mouseup event listeners for the clicked effect
        const items = menuElement.querySelectorAll('.most-used-tools-item');
        items.forEach(item => {
            item.addEventListener('mousedown', e => {
                e.preventDefault(); // Prevent text selection
                e.target.closest('.most-used-tools-item').classList.add('menu-item-clicked');
            });
            
            // Remove the effect on mouseup, mouseleave, and mouseout to ensure it's removed
            ['mouseup', 'mouseleave', 'mouseout'].forEach(eventType => {
                item.addEventListener(eventType, e => {
                    e.target.closest('.most-used-tools-item')?.classList.remove('menu-item-clicked');
                });
            });
        });
        
        // Add click event listener for handling clicks
        menuElement.addEventListener('click', this._handleMenuClick.bind(this));
    }

    /**
     * Create the AI Tools submenu
     */
    createAiToolsMenu() {
        const menuHTML = `
            <ul class="ai-tools-items">
                <li class="ai-tools-item" data-program-name="chatgpt">
                    <img src="./assets/gui/start-menu/vanity-apps/chatgpt.webp" alt="ChatGPT">
                    ChatGPT
                </li>
                <li class="ai-tools-item" data-program-name="sora">
                    <img src="./assets/gui/start-menu/vanity-apps/sora.webp" alt="Sora">
                    Sora
                </li>
                <li class="ai-tools-item" data-program-name="git-copilot">
                    <img src="./assets/gui/start-menu/vanity-apps/git-copilot.webp" alt="Git Copilot">
                    Git Copilot
                </li>
                <li class="ai-tools-item" data-program-name="cursor">
                    <img src="./assets/gui/start-menu/vanity-apps/cursor.webp" alt="Cursor">
                    Cursor
                </li>
            </ul>
        `;
        const menuElement = this._createSubMenu('ai-tools-menu', menuHTML, 'aiToolsMenu');
        // Disable all items
        menuElement.querySelectorAll('.ai-tools-item').forEach(item => item.classList.add('disabled'));
        
        // Add mousedown/mouseup event listeners for the clicked effect
        const items = menuElement.querySelectorAll('.ai-tools-item');
        items.forEach(item => {
            item.addEventListener('mousedown', e => {
                e.preventDefault(); // Prevent text selection
                e.target.closest('.ai-tools-item').classList.add('menu-item-clicked');
            });
            
            // Remove the effect on mouseup, mouseleave, and mouseout to ensure it's removed
            ['mouseup', 'mouseleave', 'mouseout'].forEach(eventType => {
                item.addEventListener(eventType, e => {
                    e.target.closest('.ai-tools-item')?.classList.remove('menu-item-clicked');
                });
            });
        });
        
        // Add specific click event listener after creation
        menuElement.addEventListener('click', this._handleMenuClick.bind(this));
    }

    /**
     * Get HTML template for the start menu
     */
    getMenuTemplate() {
        return `
            <div class="menutopbar">
                <img src="./assets/gui/start-menu/user.webp" alt="User" class="userpicture">
                <span class="username">Mitchell Ivin</span>
            </div>
            <div class="start-menu-middle">
                <div class="middle-section middle-left">
                    <ul class="menu-items">
                        <li class="menu-item" id="menu-my-projects" data-action="open-program" data-program-name="my-projects">
                            <img src="./assets/gui/desktop/my-projects.webp" alt="My Projects">
                            <div class="item-details" style="display: flex; flex-direction: column;">
                                <span class="item-title">My Projects</span>
                                <span class="item-description">View my work</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-contact-me" data-action="open-program" data-program-name="contact-me">
                            <img src="./assets/gui/desktop/email.webp" alt="Contact Me">
                            <div class="item-details" style="display: flex; flex-direction: column;">
                                <span class="item-title" style="font-weight: bold;">Contact Me</span>
                                <span class="item-description">Send me a message</span>
                            </div>
                        </li>
                        <li class="menu-divider"><hr class="divider"></li>
                        <li class="menu-item" id="menu-about-me" data-action="open-program" data-program-name="about-me">
                            <img src="./assets/gui/desktop/about-me.webp" alt="About Me">
                            <div class="item-content">
                                <span class="item-title">About Me</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-media-player" data-action="open-program" data-program-name="media-player">
                            <img src="./assets/gui/start-menu/media-player.webp" alt="Media Player">
                            <div class="item-content">
                                <span class="item-title">Media Player</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-photo-viewer" data-action="open-program" data-program-name="my-pictures">
                            <img src="./assets/gui/start-menu/photo-viewer.webp" alt="My Photos">
                            <div class="item-details">
                                <span class="item-title">My Photos</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-cmd-prompt" data-action="open-program" data-program-name="cmd-prompt">
                            <img src="./assets/gui/start-menu/command-prompt.webp" alt="Command Prompt">
                            <div class="item-content">
                                <span class="item-title" style="font-weight: normal; padding: 5px 0;">Command Prompt</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-notepad" data-action="open-program" data-program-name="notepad">
                            <img src="./assets/gui/start-menu/notepad.webp" alt="Notepad">
                            <div class="item-content">
                                <span class="item-title">Notepad</span>
                            </div>
                        </li>
                    </ul>
                    <div class="all-programs-container">
                        <li class="menu-divider"><hr class="divider"></li>
                        <div class="all-programs-button" id="menu-all-programs" data-action="toggle-all-programs">
                            <span>All Programs</span>
                            <img src="./assets/gui/start-menu/arrow.webp" alt="All Programs">
                        </div>
                    </div>
                </div>
                <div class="middle-section middle-right">
                    <ul class="menu-items">
                        <li class="menu-item" id="menu-instagram" data-action="open-url" data-url="https://www.instagram.com">
                            <img src="./assets/gui/start-menu/instagram.webp" alt="Instagram">
                            <div class="item-content">
                                <span class="item-title">Instagram</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-linkedin" data-action="open-url" data-url="https://www.linkedin.com">
                            <img src="./assets/gui/start-menu/linkedin.webp" alt="LinkedIn">
                            <div class="item-content">
                                <span class="item-title">LinkedIn</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-github" data-action="open-url" data-url="https://github.com">
                            <img src="./assets/gui/start-menu/github.webp" alt="GitHub">
                            <div class="item-content">
                                <span class="item-title">GitHub</span>
                            </div>
                        </li>
                        <li class="menu-divider right-section-divider"><hr class="divider"></li>
                        <li class="menu-item" id="menu-program4" data-action="toggle-most-used-tools">
                            <img src="./assets/gui/start-menu/favorite-apps.webp" alt="Most Used Tools">
                            <div class="item-content">
                                <span class="item-title">Most Used Tools</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-ai-tools" data-action="toggle-ai-tools">
                            <img src="./assets/gui/start-menu/ai-utilities.webp" alt="A.I. Utilities">
                            <div class="item-content">
                                <span class="item-title">A.I. Utilities</span>
                            </div>
                        </li>
                        <li class="menu-divider right-section-divider"><hr class="divider"></li>
                        <li class="menu-item" id="menu-help-support" data-action="open-program" data-program-name="sys-info">
                            <img src="./assets/gui/start-menu/help.webp" alt="System Information">
                            <div class="item-details">
                                <span class="item-title">System Information</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="start-menu-footer">
                <div class="footer-buttons">
                    <div class="footer-button" id="btn-log-off" data-action="log-off">
                        <img src="./assets/gui/start-menu/logoff.webp" alt="Log Off">
                        <span>Log Off</span>
                    </div>
                    <div class="footer-button" id="btn-shut-down" data-action="shut-down">
                        <img src="./assets/gui/start-menu/shutdown.webp" alt="Shut Down">
                        <span>Shut Down</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up all necessary event listeners
     */
    setupEventListeners() {
        window.addEventListener('mousedown', (e) => {
            // Only act if the menu is actually active
            if (!this.startMenu?.classList.contains('active')) {
                return;
            }
            const target = e.target;
            
            // IMPORTANT: If the target is the overlay we added, 
            // let its own listener handle it (via eventBus).
            // Also ignore clicks on iframes directly (should be covered by overlay).
            if (target.classList.contains('start-menu-content-click-overlay') || target.tagName === 'IFRAME') {
                 return; 
            }

            const clickedOnMenu = this.startMenu.contains(target);
            const clickedOnButton = this.startButton.contains(target);
            const clickedOnAllPrograms = this.allProgramsMenu?.contains(target);
            
            // NEW: Check if click was in the Most Used Tools or AI Tools menus
            const clickedOnMostUsedTools = this.mostUsedToolsMenu?.contains(target);
            const clickedOnAiTools = this.aiToolsMenu?.contains(target);

            // If the click was NOT on menu/button/submenu AND not the overlay/iframe, close.
            if (!clickedOnMenu && !clickedOnButton && !clickedOnAllPrograms && 
                !clickedOnMostUsedTools && !clickedOnAiTools) {
                e.stopPropagation();
                e.preventDefault(); 
                // Explicitly hide All Programs submenu first
                this.hideAllProgramsMenu(); 
                // Then close the main menu
                this.closeStartMenu();
            }
        }, true); // Use capture phase

        // Keep ONLY Escape key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.startMenu?.classList.contains('active')) {
                this.closeStartMenu();
            }
        });
    }
    
    /**
     * Handle clicks on menu items using event delegation.
     */
    _handleMenuClick(event) {
        const target = event.target.closest('[data-action], [data-program-name], [data-url]');
        if (!target) return;

        // Prevent closing the menu if a disabled item in Most Used Tools or AI Tools is clicked
        if ((target.classList.contains('most-used-tools-item') || target.classList.contains('ai-tools-item')) && target.classList.contains('disabled')) {
            event.stopPropagation();
            event.preventDefault();
            return;
        }

        const action = target.dataset.action;
        const programName = target.dataset.programName;
        const url = target.dataset.url;

        // Check if the click is on an item in the Most Used Tools submenu
        const isInMostUsedToolsMenu = target.classList.contains('most-used-tools-item');
        // Check if the click is on an item in the AI Tools submenu
        const isInAiToolsMenu = target.classList.contains('ai-tools-item');

        // --- Custom popup for Most Used Tools and AI Tools ---
        if (isInMostUsedToolsMenu || isInAiToolsMenu) {
            this.closeStartMenu();
            return;
        }
        // --- End custom popup ---

        if (action === 'open-program' && programName) {
            this.openProgram(programName);
            this.closeStartMenu();
        } else if (action === 'open-url' && url) {
            window.open(url, '_blank');
            this.closeStartMenu();
        } else if (action === 'log-off') {
            sessionStorage.removeItem('logged_in');
            this.eventBus.publish(EVENTS.LOG_OFF_REQUESTED);
            this.closeStartMenu();
        } else if (action === 'shut-down') {
            sessionStorage.removeItem('logged_in');
            window.location.reload();
        }

        // Handle All Programs menu items: open or restore program window for non-social links
        if (target.classList.contains('all-programs-item') && target.hasAttribute('data-program-name')) {
            const programName = target.getAttribute('data-program-name');
            if (programName) {
                this.openProgram(programName); // Will open or restore the window
                this.closeStartMenu();
                return;
            }
        }
    }

    /**
     * Sets up delegated event listeners for the start menu.
     */
    _setupDelegatedEventHandlers() {
        if (this.startMenu) {
            this.startMenu.addEventListener('click', this._handleMenuClick.bind(this));
        }
        if (this.allProgramsMenu) {
             this.allProgramsMenu.addEventListener('click', this._handleMenuClick.bind(this));
        }
        if (this.mostUsedToolsMenu) {
            this.mostUsedToolsMenu.addEventListener('click', this._handleMenuClick.bind(this));
        }
        if (this.aiToolsMenu) {
            this.aiToolsMenu.addEventListener('click', this._handleMenuClick.bind(this));
        }
    }
    
    /**
     * Set up menu items and their click handlers
     */
    setupMenuItems() {
        this.setupAllProgramsMenu(); // Setup submenu immediately

        // Setup Most Used Tools submenu (previously Creative Suite)
        const mostUsedToolsButton = this.startMenu.querySelector('#menu-program4'); // Keep ID for now
        if (mostUsedToolsButton) {
            mostUsedToolsButton.setAttribute('data-action', 'toggle-most-used-tools'); // Renamed action
            mostUsedToolsButton.style.position = 'relative';
            mostUsedToolsButton.style.width = '100%';
            const mutArrowSpan = document.createElement('span'); // Renamed variable
            mutArrowSpan.className = 'mut-menu-arrow'; // Renamed class
            mutArrowSpan.innerHTML = '►';
            mutArrowSpan.style.position = 'absolute';
            mutArrowSpan.style.right = '8px';
            mutArrowSpan.style.top = '50%';
            mutArrowSpan.style.transform = 'translateY(-50%) scaleX(0.5)';
            mutArrowSpan.style.fontSize = '10px';
            mostUsedToolsButton.appendChild(mutArrowSpan);
            mostUsedToolsButton.addEventListener('mouseenter', () => this.showMostUsedToolsMenu()); // Renamed show method
            mostUsedToolsButton.addEventListener('mouseleave', (e) => {
                // Check related target against the correct menu class
                if (e.relatedTarget && (e.relatedTarget.closest('.most-used-tools-menu') || e.relatedTarget === this.mostUsedToolsMenu)) return;
                this.hideMostUsedToolsMenu(); // Renamed hide method
            });
        }

        // Setup A.I. Tools submenu
        const aiToolsButton = this.startMenu.querySelector('#menu-ai-tools');
        if (aiToolsButton) {
            aiToolsButton.setAttribute('data-action', 'toggle-ai-tools');
            aiToolsButton.style.position = 'relative';
            aiToolsButton.style.width = '100%';
            const aiArrowSpan = document.createElement('span');
            aiArrowSpan.className = 'ai-tools-arrow'; // New class
            aiArrowSpan.innerHTML = '►';
            aiArrowSpan.style.position = 'absolute';
            aiArrowSpan.style.right = '8px';
            aiArrowSpan.style.top = '50%';
            aiArrowSpan.style.transform = 'translateY(-50%) scaleX(0.5)';
            aiArrowSpan.style.fontSize = '10px';
            aiToolsButton.appendChild(aiArrowSpan);
            aiToolsButton.addEventListener('mouseenter', () => this.showAiToolsMenu()); // New show method
            aiToolsButton.addEventListener('mouseleave', (e) => {
                if (e.relatedTarget && (e.relatedTarget.closest('.ai-tools-menu') || e.relatedTarget === this.aiToolsMenu)) return;
                this.hideAiToolsMenu(); // New hide method
            });
        }
    }

    /**
     * Set up All Programs menu behavior
     */
    setupAllProgramsMenu() {
        const allProgramsButton = document.getElementById('menu-all-programs');
        
        if (!allProgramsButton || !this.allProgramsMenu || !this.startMenu) {
            return;
        }
        
        allProgramsButton.addEventListener('mouseenter', () => this.showAllProgramsMenu());
        this.allProgramsMenu.addEventListener('mouseleave', () => this.hideAllProgramsMenu());
        
        const otherElements = this.startMenu.querySelectorAll(
            '.menu-item:not(#menu-all-programs), .menutopbar, .start-menu-footer, .middle-right'
        );
        
        otherElements.forEach(element => {
            element.addEventListener('mouseenter', () => this.hideAllProgramsMenu());
        });
    }

    /**
     * Show the All Programs menu
     */
    showAllProgramsMenu() {
        if (!this.allProgramsMenu || !this.startMenu) {
            return;
        }
        
        const allProgramsButton = this.startMenu.querySelector('#menu-all-programs');
        const footerElement = this.startMenu.querySelector('.start-menu-footer');
        
        if (!allProgramsButton || !footerElement) {
            return;
        }
        
        const buttonRect = allProgramsButton.getBoundingClientRect();
        const footerRect = footerElement.getBoundingClientRect();
        
        const calculatedLeft = buttonRect.right + 'px';
        const calculatedBottom = (window.innerHeight - footerRect.top) + 'px';

        Object.assign(this.allProgramsMenu.style, {
            left: calculatedLeft,
            bottom: calculatedBottom,
            top: 'auto',
            display: 'block'
        });
        
        this.allProgramsMenu.classList.add('active');
    }

    /**
     * Hide the All Programs menu
     */
    hideAllProgramsMenu() {
        if (this.allProgramsMenu) {
            this.allProgramsMenu.classList.remove('active');
            this.allProgramsMenu.style.display = 'none';
        }
    }
    
    /**
     * Open a program using the event bus
     */
    openProgram(programName) {
        this.eventBus.publish(EVENTS.PROGRAM_OPEN, { programName });
    }
    
    /**
     * Toggle the start menu visibility
     */
    toggleStartMenu() {
        if (!this.startMenu) {
            return;
        }
        
        const isCurrentlyActive = this.startMenu.classList.contains('active');
        
        if (!isCurrentlyActive) {
            this.startMenu.style.visibility = 'visible';
            this.startMenu.style.opacity = '1';
            this.startMenu.classList.add('active');
            this.eventBus.publish(EVENTS.STARTMENU_OPENED);

            // Activate overlay on the window that is active *at this moment*
            const currentActiveWindow = document.querySelector('.window.active');
            this.updateContentOverlay(currentActiveWindow?.id);
        } else { 
            this.closeStartMenu(); // This will hide the overlay
        }
    }
    
    /**
     * Close the start menu
     */
    closeStartMenu(force = false) {
        const isActive = this.startMenu?.classList.contains('active');
        
        if (!this.startMenu || (!isActive && !force)) {
            return;
        }
        
        this.startMenu.classList.remove('active');
        
        this.hideAllProgramsMenu();
        
        // Deactivate overlay state immediately after removing .active class
        this.updateContentOverlay(null); 

        // Apply style changes in the next frame
        requestAnimationFrame(() => {
            this.startMenu.style.visibility = 'hidden';
            this.startMenu.style.opacity = '0';
        });
        
        this.eventBus.publish(EVENTS.STARTMENU_CLOSED);

        // Also hide submenus
        this.hideMostUsedToolsMenu();
        this.hideAiToolsMenu();
    }

    // New helper method to manage overlay activation
    updateContentOverlay(activeWindowId) {
        // Deactivate previously active overlay (if any)
        if (this.activeWindowOverlay) {
            this.activeWindowOverlay.style.display = 'none';
            this.activeWindowOverlay.style.pointerEvents = 'none';
            this.activeWindowOverlay = null;
        }

        // Find the potential new overlay target
        let targetOverlay = null;
        if (activeWindowId) {
            const activeWindow = document.getElementById(activeWindowId);
            if (activeWindow) {
                targetOverlay = activeWindow.querySelector('.start-menu-content-click-overlay');
            }
        }

        // ONLY Activate the target overlay IF the menu is currently active
        if (targetOverlay && this.startMenu?.classList.contains('active')) {
            targetOverlay.style.display = 'block';
            targetOverlay.style.pointerEvents = 'auto';
            this.activeWindowOverlay = targetOverlay; // Track the currently active overlay
        } else if (targetOverlay) {
            targetOverlay.style.display = 'none';
            targetOverlay.style.pointerEvents = 'none';
        }
    }

    /**
     * Show the Most Used Tools menu
     */
    showMostUsedToolsMenu() {
        if (!this.mostUsedToolsMenu || !this.startMenu) {
            return;
        }

        const button = this.startMenu.querySelector('#menu-program4');
        if (!button) {
            return;
        }

        // Ensure menu is visible to get dimensions, but positioned off-screen initially
        this.mostUsedToolsMenu.style.visibility = 'hidden';
        this.mostUsedToolsMenu.style.display = 'block';
        
        const buttonRect = button.getBoundingClientRect();
        const menuRect = this.mostUsedToolsMenu.getBoundingClientRect();

        // Try positioning to the right first
        let left = buttonRect.right;
        
        // If it goes off-screen to the right, position to the left
        if (left + menuRect.width > window.innerWidth) {
            left = buttonRect.left - menuRect.width;
        }

        // Calculate top position to align bottom of menu with bottom of button
        let top = buttonRect.bottom - menuRect.height;

        // Ensure it doesn't go off-screen vertically (upwards)
        if (top < 0) {
            top = 0; // Align to top of viewport if not enough space
        }
        // Ensure it doesn't go below the taskbar (less likely with bottom alignment but safe)
        if (top + menuRect.height > window.innerHeight - 30) { 
            top = window.innerHeight - 30 - menuRect.height;
        }

        Object.assign(this.mostUsedToolsMenu.style, {
            left: `${left}px`,
            top: `${top}px`,
            display: 'block', // Keep display block
            visibility: 'visible' // Make visible now
        });
        
        // Add mouseleave event to the menu itself
        this.mostUsedToolsMenu.addEventListener('mouseleave', (e) => {
            if (e.relatedTarget && (e.relatedTarget === button || e.relatedTarget.closest('#menu-program4'))) return;
            this.hideMostUsedToolsMenu();
        });
        
        this.mostUsedToolsMenu.classList.add('mut-menu-active');
        button.classList.add('active-submenu-trigger');
    }

    /**
     * Hide the Most Used Tools menu
     */
    hideMostUsedToolsMenu() {
        if (this.mostUsedToolsMenu) {
            this.mostUsedToolsMenu.classList.remove('mut-menu-active');
            this.mostUsedToolsMenu.style.display = 'none';
        }
        const button = this.startMenu?.querySelector('#menu-program4');
        button?.classList.remove('active-submenu-trigger');
    }

    /**
     * Show the AI Tools submenu
     */
    showAiToolsMenu() {
        if (!this.aiToolsMenu || !this.startMenu) return;
        const aiToolsButton = this.startMenu.querySelector('#menu-ai-tools');
        if (aiToolsButton) {
            const rect = aiToolsButton.getBoundingClientRect();
            
            // First display the menu so we can get its height
            this.aiToolsMenu.style.display = 'block';
            this.aiToolsMenu.style.left = rect.right + 'px';
            
            // Get the menu height and position at bottom of parent item
            const menuHeight = this.aiToolsMenu.offsetHeight;
            this.aiToolsMenu.style.top = (rect.bottom - menuHeight) + 'px';
            
            this.aiToolsMenu.addEventListener('mouseleave', (e) => {
                if (e.relatedTarget && (e.relatedTarget === aiToolsButton || e.relatedTarget.closest('#menu-ai-tools'))) return;
                this.hideAiToolsMenu();
            });
            this.aiToolsMenu.classList.add('active');
            aiToolsButton.classList.add('active-submenu-trigger'); // Use the same class as Most Used Tools
        }
    }
    
    /**
     * Hide the AI Tools submenu
     */
    hideAiToolsMenu() {
        if (this.aiToolsMenu) {
            this.aiToolsMenu.style.display = 'none';
            this.aiToolsMenu.classList.remove('active');
            const aiToolsButton = this.startMenu.querySelector('#menu-ai-tools');
            if (aiToolsButton) {
                aiToolsButton.classList.remove('active-submenu-trigger'); // Use the same class as Most Used Tools
            }
        }
    }
}
