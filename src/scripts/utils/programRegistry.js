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
    "media-player": createProgram(
        "media-player",
        "Media Player",
        "start-menu/media-player.webp",
        "media-player",
        { dimensions: { width: 750, height: 500 } }
    ),
    
    // System and Utility Programs
    "help-support": createProgram(
        "help-support",
        "Help and Support",
        "start-menu/help.webp",
        "help-support", 
        { dimensions: { width: 750, height: 550 }}
    ),
    "cmd-prompt": createProgram(
        "cmd-prompt", 
        "Command Prompt", 
        "start-menu/command-prompt.webp", 
        "cmd-prompt", 
        { initialHeight: 600 }
    ),
    "notepad": createProgram(
        "notepad", 
        "Notepad", 
        "start-menu/notepad.webp", 
        "notepad"
    ),
    
    // Portfolio Content
    "about-me": createProgram(
        "about-me",
        "About Me",
        "desktop/about-me.webp",
        "about-me",
        { dimensions: { width: 800, height: 600 }}
    ),
    "contact-me": createProgram(
        "contact-me",
        "Contact Me",
        "desktop/email.webp",
        "contact-me",
        { dimensions: { width: 600, height: 450 }}
    ),
    "resume-pdf": createProgram(
        "resume-pdf",
        "Resume.pdf",
        "desktop/resume.webp",
        "resume-pdf",
        { dimensions: { width: 700, height: 800 }}
    ),

    // Media Programs
    "music-player": createProgram(
        "music-player",
        "Music Player",
        "start-menu/music-player.webp",
        "music-player",
        { dimensions: { width: 500, height: 350 }}
    ),
    // --- Photo Viewer Window Size ---
    // The default window size for the Photo Viewer is set here. Adjust width/height as needed.
    "my-pictures": createProgram(
        "my-pictures", 
        "Photo Viewer", 
        "start-menu/photo-viewer.webp", 
        "photo-viewer", 
        { dimensions: { width: 440, height: 561 }}
    ),
    
    // Project Showcase Programs
    "my-projects": createProgram(
        "my-projects", 
        "My Projects", 
        "desktop/my-projects.webp", 
        "my-projects", 
        { dimensions: { width: 1150, height: 775 }}
    ),

    // Special format entries with custom properties
    // (Removed: retro-os-details, video-tab, images-tab, code-tab)
};

export default programData; 