import { setupMenuBar } from '../../../src/scripts/utils/menuBar.js';
import { setupToolbar } from '../../../src/scripts/utils/toolbar.js';
import { setupTooltips } from '../../../src/scripts/utils/tooltip.js';
import { handleExit } from '../../../src/scripts/utils/common.js';

let resumeZoom = 1;

function setResumeZoom(scale) {
  const img = document.querySelector('.resume-image');
  if (img) {
    img.style.width = `${scale * 100}%`;
    img.style.height = 'auto';
    img.style.transform = '';
    // Center the image horizontally in the container after zoom
    const container = document.querySelector('.main-content');
    if (container) {
      container.scrollLeft = (img.offsetWidth - container.clientWidth) / 2;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupMenuBar({
    menuBarSelector: '.menu-bar',
    actions: {
      save: () => {
        // Instantly download the resume.pdf asset
        const link = document.createElement('a');
        link.href = 'assets/resume.pdf';
        link.download = 'resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      exit: handleExit
    }
  });

  setupToolbar({
    '.actualsize': () => {
      let isMaximized = false;
      try {
        const parentWindow = window.frameElement?.closest('.app-window');
        if (parentWindow && parentWindow.classList.contains('maximized')) {
          isMaximized = true;
        }
      } catch (e) {}
      if (isMaximized) {
        resumeZoom = 0.5;
      } else {
        resumeZoom = 1;
      }
      setResumeZoom(resumeZoom);
      // Scroll the main-content container to the top left
      const container = document.querySelector('.main-content');
      if (container) {
        container.scrollTop = 0;
        container.scrollLeft = 0;
      }
    },
    '.zoomout': () => {
      const img = document.querySelector('.resume-image');
      let isMaximized = false;
      try {
        const parentWindow = window.frameElement?.closest('.app-window');
        if (parentWindow && parentWindow.classList.contains('maximized')) {
          isMaximized = true;
        }
      } catch (e) {}
      // If maximized and at fixed width, switch to percent-based first
      if (isMaximized && img && img.style.width === '1200px') {
        resumeZoom = 0.5;
        setResumeZoom(resumeZoom);
      }
      resumeZoom = Math.max(resumeZoom - 0.1, 0.1);
      setResumeZoom(resumeZoom);
    },
    '.zoomin': () => {
      const img = document.querySelector('.resume-image');
      let isMaximized = false;
      try {
        const parentWindow = window.frameElement?.closest('.app-window');
        if (parentWindow && parentWindow.classList.contains('maximized')) {
          isMaximized = true;
        }
      } catch (e) {}
      // If maximized and at fixed width, switch to percent-based first
      if (isMaximized && img && img.style.width === '1200px') {
        resumeZoom = 0.5;
        setResumeZoom(resumeZoom);
      }
      resumeZoom = Math.min(resumeZoom + 0.1, 3);
      setResumeZoom(resumeZoom);
    },
    '.save': () => {
      // Instantly download the resume.pdf asset
      const link = document.createElement('a');
      link.href = 'assets/resume.pdf';
      link.download = 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    '.print': () => {},
    '.email': () => {
      // Open the 'Contact Me' program in the simulation (must match program registry key)
      if (window.parent) {
        window.parent.postMessage({ type: 'open-app', app: 'contact' }, '*');
      }
    },
    // Add more toolbar button actions as needed
  });

  // Enable XP-style tooltips for toolbar buttons
  setupTooltips('.toolbar-row > div[data-tooltip]');

  // Add any additional Resume PDF app logic here if needed
});

// Listen for maximized/unmaximized events from parent window
window.addEventListener('message', (event) => {
  if (!(window.location.protocol === 'file:' || event.origin === window.origin)) return;

  if (event.data?.type === 'window:maximized') {
    resumeZoom = 0.5;
    setResumeZoom(resumeZoom);
    const img = document.querySelector('.resume-image');
    if (img) {
      img.style.margin = '0 auto';
      img.style.display = 'block';
    }
  } else if (event.data?.type === 'window:unmaximized') {
    resumeZoom = 1;
    setResumeZoom(resumeZoom);
    const img = document.querySelector('.resume-image');
    if (img) {
      img.style.margin = '';
      img.style.display = '';
    }
  }
});

// Enable click-and-drag panning always
(function enableImagePanning() {
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.main-content');
    let isPanning = false;
    let startX, startY, scrollLeft, scrollTop;

    if (!container) return;

    container.addEventListener('mousedown', (e) => {
      isPanning = true;
      container.style.cursor = 'grabbing';
      startX = e.pageX - container.offsetLeft;
      startY = e.pageY - container.offsetTop;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
      e.preventDefault();
    });

    container.addEventListener('mouseleave', () => {
      isPanning = false;
      container.style.cursor = '';
    });

    container.addEventListener('mouseup', () => {
      isPanning = false;
      container.style.cursor = '';
    });

    container.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;
      const dragSpeed = 0.65; // Lower = slower panning
      const walkX = (x - startX) * dragSpeed;
      const walkY = (y - startY) * dragSpeed;
      container.scrollLeft = scrollLeft - walkX;
      container.scrollTop = scrollTop - walkY;
    });
  });
})();