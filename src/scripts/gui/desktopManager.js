/**
 * @fileoverview Desktop Component for the Windows XP simulation.
 * Manages desktop icons, selection, drag, and wallpaper logic.
 *
 * Usage:
 *   import Desktop from './desktopManager.js';
 *   const desktop = new Desktop(eventBus);
 *
 * Edge Cases:
 *   - If .desktop element is missing, most functionality is disabled.
 *   - If there are no .desktop-icon elements, icon logic is skipped.
 *   - Wallpaper selection adapts to ultrawide screens.
 */
import { EVENTS } from '../utils/eventBus.js';

// Add these at the top of the file, after imports
const MUSIC_WIDGET_OVERLAY_ID = 'music-widget-overlay';
const MUSIC_WIDGET_IFRAME_ID = 'music-player-widget';

/**
 * Desktop class manages the Windows XP desktop UI, including icon selection, drag, and wallpaper.
 *
 * @class
 * @example
 * import Desktop from './desktopManager.js';
 * const desktop = new Desktop(eventBus);
 */
export default class Desktop {
    /**
     * Create a new Desktop instance.
     * @param {EventBus} eventBus - The event bus instance for communication.
     */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.desktop = document.querySelector('.desktop');
        this.icons = document.querySelectorAll('.desktop-icon');

        this.selectionBox = null;
        this.isDragging = false;
        this.hasDragged = false;
        this.startX = 0;
        this.startY = 0;
        this.lastClickTimes = {};
        this.selectedIcons = new Set();

        this.cleanupArtifacts();
        this.createSelectionOverlay();
        this.setupIconEvents();
        this.setupDesktopEvents();
        this.setupPointerSelectionEvents();
        this.setWallpaperBasedOnAspectRatio();

        this.eventBus.subscribe(EVENTS.WINDOW_CREATED, () => this.clearSelection());
        this.eventBus.subscribe(EVENTS.WINDOW_FOCUSED, () => this.clearSelection());

        // Recheck wallpaper on window resize
        window.addEventListener('resize', () => this.setWallpaperBasedOnAspectRatio());

        this.eventBus.subscribe('MUSIC_WIDGET_OPEN', () => this.showMusicWidgetOverlay());
        this.eventBus.subscribe('MUSIC_WIDGET_CLOSE', () => this.hideMusicWidgetOverlay());
    }

    // Set the appropriate wallpaper based on screen aspect ratio
    /**
     * Set the wallpaper based on the current window aspect ratio.
     * Uses ultrawide wallpaper for aspect ratios >= 2.1.
     * @returns {void}
     */
    setWallpaperBasedOnAspectRatio() {
        const aspectRatio = window.innerWidth / window.innerHeight;

        // Aspect ratio threshold for ultrawide monitors (typically 21:9 or wider)
        const ultrawideThreshold = 2.1; // 21:9 = 2.33, 16:9 = 1.78

        // Default and ultrawide wallpaper paths (Use root-relative paths for deployment)
        const defaultWallpaper = './assets/gui/desktop/bliss.webp';
        const ultrawideWallpaper = './assets/gui/desktop/bliss-ultrawide.webp';

        // Set the appropriate wallpaper
        if (aspectRatio >= ultrawideThreshold) {
            this.desktop.style.backgroundImage = `url('${ultrawideWallpaper}')`;
        } else {
            this.desktop.style.backgroundImage = `url('${defaultWallpaper}')`;
        }
    }

    // Utility: Selection overlay for desktop icons
    /**
     * Remove any existing selection box artifacts from previous interactions.
     * @returns {void}
     */
    cleanupArtifacts() {
        document.querySelectorAll('#selection-box, .selection-box').forEach((box) => box.remove());
    }

    /**
     * Create the selection overlay element if it does not exist.
     * @returns {void}
     */
    createSelectionOverlay() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'selection-overlay';
            this.desktop.prepend(this.overlay);
        }
    }

    /**
     * Attach click and interaction events to desktop icons.
     * @returns {void}
     */
    setupIconEvents() {
        this.icons.forEach((icon) => {
            const iconSpan = icon.querySelector('span');
            const iconText = iconSpan ? iconSpan.textContent.trim() : '';
            const iconId = iconText.toLowerCase().replace(/\s+/g, '-');

            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const now = Date.now();
                const lastTime = this.lastClickTimes[iconId] || 0;
                if (now - lastTime < 300) return;
                this.toggleIconSelection(icon, e.ctrlKey);
                this.lastClickTimes[iconId] = now;
            });

            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (!icon.classList.contains('selected')) {
                    this.selectIcon(icon, true);
                }

                // Use the data-program-name attribute directly
                let programName = icon.getAttribute('data-program-name');

                // Only keep necessary special cases
                if (programName === 'command-prompt') programName = 'cmd';

                this.eventBus.publish(EVENTS.PROGRAM_OPEN, { programName });
            });

            icon.style.position = 'relative';
            icon.style.zIndex = '5';
        });
    }

    /**
     * Attach click handler to desktop background for clearing selection.
     * @returns {void}
     */
    setupDesktopEvents() {
        this.desktop.addEventListener('click', (e) => {
            if (e.target === this.desktop || e.target === this.overlay) {
                if (!this.isDragging && !this.hasDragged) {
                    this.clearSelection();
                }
            }
        });
    }

    /**
     * Set up pointer events for click-and-drag selection of desktop icons.
     * Handles pointerdown, pointermove, pointerup for selection box.
     * @returns {void}
     */
    setupPointerSelectionEvents() {
        window.addEventListener('pointerdown', (e) => {
            if (e.target !== this.overlay && e.target !== this.desktop) return;

            // Unselect all icons if not holding Ctrl (for new drag selection)
            if (!e.ctrlKey) {
                this.clearSelection();
            }

            const rect = this.desktop.getBoundingClientRect();
            this.startX = e.clientX - rect.left;
            this.startY = e.clientY - rect.top;
            this.clearTemporaryHighlights();

            const styles = getComputedStyle(document.documentElement);
            const selectionColor = styles.getPropertyValue('--desktop-selection-color').trim();
            const selectionBorder = styles.getPropertyValue('--selection-border').trim();

            this.selectionBox = document.createElement('div');
            this.selectionBox.className = 'selection-box';

            // Apply only dynamic styles directly
            Object.assign(this.selectionBox.style, {
                left: `${this.startX}px`,
                top: `${this.startY}px`,
                width: '0px',
                height: '0px'
            });

            this.desktop.appendChild(this.selectionBox);
            this.isDragging = true;
            this.hasDragged = false;
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging || !this.selectionBox) return;
            this.hasDragged = true;
            const rect = this.desktop.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            const x = Math.min(currentX, this.startX);
            const y = Math.min(currentY, this.startY);
            const w = Math.abs(currentX - this.startX);
            const h = Math.abs(currentY - this.startY);
            Object.assign(this.selectionBox.style, {
                left: `${x}px`,
                top: `${y}px`,
                width: `${w}px`,
                height: `${h}px`
            });

            this.highlightIconsIntersecting(x, y, w, h);
        });

        window.addEventListener('pointerup', () => {
            if (!this.isDragging || !this.selectionBox) return;
            this.isDragging = false;

            this.icons.forEach((icon) => {
                if (icon.classList.contains('hover-by-selection')) {
                    icon.classList.remove('hover-by-selection');
                    icon.classList.add('selected');
                    this.selectedIcons.add(icon);
                }
            });

            if (this.selectionBox?.parentNode) {
                this.selectionBox.parentNode.removeChild(this.selectionBox);
                this.selectionBox = null;
            }
        });
    }

    /**
     * Highlight desktop icons that intersect with the selection rectangle.
     * @param {number} left - Left X of selection box (relative to desktop)
     * @param {number} top - Top Y of selection box (relative to desktop)
     * @param {number} width - Width of selection box
     * @param {number} height - Height of selection box
     * @returns {void}
     */
    highlightIconsIntersecting(left, top, width, height) {
        const selectionRect = { left, top, right: left + width, bottom: top + height };
        this.icons.forEach((icon) => {
            const rect = icon.getBoundingClientRect();
            const desktopRect = this.desktop.getBoundingClientRect();
            const iconRect = {
                left: rect.left - desktopRect.left,
                top: rect.top - desktopRect.top,
                right: rect.right - desktopRect.left,
                bottom: rect.bottom - desktopRect.top
            };

            const intersects = !(
                iconRect.right < selectionRect.left ||
                iconRect.left > selectionRect.right ||
                iconRect.bottom < selectionRect.top ||
                iconRect.top > selectionRect.bottom
            );

            if (intersects) {
                icon.classList.add('hover-by-selection');
            } else {
                icon.classList.remove('hover-by-selection');
            }
        });
    }

    toggleIconSelection(icon, isCtrlPressed) {
        if (isCtrlPressed) {
            if (icon.classList.contains('selected')) {
                icon.classList.remove('selected');
                this.selectedIcons.delete(icon);
            } else {
                icon.classList.add('selected');
                this.selectedIcons.add(icon);
            }
        } else {
            this.clearSelection();
            icon.classList.add('selected');
            this.selectedIcons.add(icon);
        }
    }

    selectIcon(icon, clearOthers = true) {
        if (clearOthers) this.clearSelection();
        icon.classList.add('selected');
        this.selectedIcons.add(icon);
    }

    clearSelection() {
        this.icons.forEach((icon) => {
            icon.classList.remove('selected', 'hover-by-selection');
        });
        this.selectedIcons.clear();
    }

    clearTemporaryHighlights() {
        this.icons.forEach((icon) => icon.classList.remove('hover-by-selection'));
    }

    showMusicWidgetOverlay() {
        if (document.getElementById(MUSIC_WIDGET_OVERLAY_ID)) return;
        const overlay = document.createElement('div');
        overlay.id = MUSIC_WIDGET_OVERLAY_ID;
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '1';
        overlay.style.pointerEvents = 'none';

        const iframe = document.createElement('iframe');
        iframe.id = MUSIC_WIDGET_IFRAME_ID;
        iframe.src = './src/apps/musicPlayer/index.html';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.right = '0';
        iframe.style.bottom = '';
        iframe.style.left = '';
        iframe.style.width = '454px';
        iframe.style.height = '264px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '16px';
        iframe.style.boxShadow = 'none';
        iframe.style.pointerEvents = 'auto';
        iframe.style.overflow = 'hidden';
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('allow', '');

        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        this.eventBus.publish('MUSIC_WIDGET_TRAY_SHOW');
        this.eventBus.publish('MUSIC_WIDGET_OPEN');

        // Add scaling logic for the music player inside the iframe
        iframe.onload = function() {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const player = doc.querySelector('.music-player');
                if (player) {
                    const originalWidth = 697;
                    const originalHeight = 372;
                    const iframeWidth = iframe.clientWidth;
                    const iframeHeight = iframe.clientHeight;
                    const scale = 0.50; // Fixed scale factor
                    player.style.transform = `scale(${scale})`;
                    player.style.transformOrigin = 'top left';
                    player.style.position = 'absolute';
                    // Position 30px from the right
                    player.style.left = `${iframeWidth - originalWidth * scale - 30}px`;
                    player.style.top = `30px`;
                    player.style.visibility = 'visible';
                }
            } catch (e) {
                // Remove or comment out all console.error lines in this file.
            }
        };
    }

    hideMusicWidgetOverlay() {
        const overlay = document.getElementById(MUSIC_WIDGET_OVERLAY_ID);
        if (overlay) {
            overlay.remove();
            this.eventBus.publish('MUSIC_WIDGET_CLOSE');
        }
    }
}