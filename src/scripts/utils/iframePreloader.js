/**
 * iframePreloader.js
 * Utility to preload iframes for faster application window loading.
 */
import programData from './programRegistry.js';

const preloadedIframes = {};

function preloadIframes() {
    Object.keys(programData).forEach(key => {
        const program = programData[key];
        // Only preload iframes for programs that have an appPath
        if (program.appPath) {
            const iframe = document.createElement('iframe');
            iframe.src = program.appPath;
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px'; // Position off-screen
            iframe.style.top = '-9999px';
            iframe.style.width = '1px'; // Minimal size
            iframe.style.height = '1px';
            iframe.style.border = 'none';
            iframe.setAttribute('frameborder', '0'); // For older browser compatibility
            iframe.setAttribute('title', `preloader-${key}`); // Add a title for accessibility/debugging

            document.body.appendChild(iframe); // Add to DOM to trigger loading

            preloadedIframes[key] = iframe;
        }
    });
}

function getPreloadedIframe(programKey) {
    const iframe = preloadedIframes[programKey];
    if (iframe) {
        // Remove from preloaded storage and reset styles before use
        delete preloadedIframes[programKey];
        iframe.style.position = '';
        iframe.style.left = '';
        iframe.style.top = '';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        return iframe;
    }
    // Fallback: If somehow not preloaded, create a new one (or handle error)
    const program = programData[programKey];
    if (program && program.appPath) {
        const newIframe = document.createElement('iframe');
        newIframe.src = program.appPath;
        newIframe.style.width = '100%';
        newIframe.style.height = '100%';
        newIframe.style.border = 'none';
        newIframe.setAttribute('frameborder', '0');
         newIframe.setAttribute('title', program.title || key);
        return newIframe;
    }
    return null; // Or throw error
}

export { preloadIframes, getPreloadedIframe }; 