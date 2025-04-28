/**
 * @fileoverview Program Registry for the Windows XP simulation
 * 
 * Defines configuration data for all available applications including window properties,
 * dimensions, icons, and content sources. This centralized registry ensures consistent
 * program initialization throughout the application.
 * 
 * @module programRegistry
 */

// Default properties to use as templates
/**
 * Default configuration templates for program properties
 * 
 * @constant
 * @type {Object}
 */
// --- Default Window Size for All Programs ---
// The default window width and height for all programs are set here. If a program does not override these values, it will use these defaults.
const defaults = {
    iframe: {
        template: "iframe-standard",
        dimensions: { width: 550, height: 400 }
    },
    window: {
        canMaximize: true,
        canMinimize: true,
        canClose: true
    }
};

/**
 * Generates a standardized window ID from program name
 * 
 * @param {string} name - Program name
 * @returns {string} Formatted window ID
 */
const makeId = name => `${name}-window`;

/**
 * Base path for application content
 * 
 * @constant
 * @type {string}
 */
const appPath = "./src/apps/";

/**
 * Creates a program configuration with consistent properties
 * 
 * @param {string} key - Unique program identifier
 * @param {string} title - Window title displayed in titlebar
 * @param {string} icon - Relative path to program icon
 * @param {string} path - Path to application directory (relative to src/apps/)
 * @param {Object} [extraProps={}] - Additional program-specific properties
 * @returns {Object} Complete program configuration object
 */
const createProgram = (key, title, icon, path, extraProps = {}) => ({
    id: makeId(key),
    title,
    icon: `./assets/gui/${icon}`,
    ...defaults.iframe,
    appPath: `${appPath}${path}/index.html`,
    ...extraProps
});

/**
 * Complete registry of all application configurations
 * 
 * Each entry defines the properties needed to create and manage a program window,
 * including dimensions, content source, and UI behavior.
 * 
 * @type {Object.<string, Object>}
 */
const programData = {
    // Communication and Messaging
    "mediaPlayer": createProgram(
        "mediaPlayer",
        "Media Player",
        "start-menu/mediaPlayer.webp",
        "mediaPlayer",
        { 
            dimensions: { width: 750, height: 500 },
            initialDynamicStatus: true,
            initialStatusText: "Stopped"
        }
    ),
    
    // System and Utility Programs
    "info": createProgram(
        "info",
        "System Information",
        "start-menu/help.webp",
        "info", 
        { dimensions: { width: 390, height: 475 }, canMinimize: false, canMaximize: false }
    ),
    "cmd": createProgram(
        "cmd", 
        "Command Prompt", 
        "start-menu/cmd.webp", 
        "cmd", 
        { dimensions: { width: 500, height: 350 } }
    ),
    "notepad": createProgram(
        "notepad", 
        "Notepad", 
        "start-menu/notepad.webp", 
        "notepad",
        { initialDynamicStatus: true }
    ),
    
    // Portfolio Content
    "about": createProgram(
        "about",
        "About Me",
        "desktop/about.webp",
        "about",
        { 
          dimensions: { width: 800, height: 600 }, 
          statusBarText: "Getting to know the designer",
          position: { type: "custom", align: "center-left", offsetX: 120, offsetY: 0 }
        }
    ),
    "contact": createProgram(
        "contact",
        "Contact Me",
        "desktop/contact.webp",
        "contact",
        { dimensions: { width: 600, height: 450 }, statusBarText: "Let's start a conversation" }
    ),
    "resume": createProgram(
        "resume",
        "Resume",
        "desktop/resume.webp",
        "resume",
        { dimensions: { width: 700, height: 800 }, statusBarText: "Skills and experience overview" }
    ),

    // Media Programs
    "my-pictures": createProgram(
        "my-pictures", 
        "My Photos", 
        "start-menu/photos.webp", 
        "photos", 
        { 
            dimensions: { width: 440, height: 561 }, 
            initialDynamicStatus: true, 
            initialStatusText: "image1.webp (1024x1024)"
        }
    ),
    
    // Project Showcase Programs
    "internet": createProgram(
        "internet", 
        "My Projects", 
        "desktop/internet.webp", 
        "internet", 
        { 
          dimensions: { width: 1030, height: 780 }, 
          statusBarText: "Projects ready to explore",
          position: { type: "custom", align: "center-left", offsetX: 475, offsetY: 0 }
        }
    ),

    // Special format entries with custom properties
};

export default programData; 