import { setupMenuBar } from '../../../src/scripts/utils/menuBar.js';
import { setupToolbar } from '../../../src/scripts/utils/toolbar.js';
import { setupTooltips } from '../../../src/scripts/utils/tooltip.js';
import { handleExit } from '../../../src/scripts/utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
  setupMenuBar({
    menuBarSelector: '.menu-bar',
    actions: {
      exit: handleExit
      // Add more menu actions as needed
    }
  });

  // Image cycling logic
  const imageCount = 4;
  let currentIndex = 1;
  const mainImage = document.querySelector('.main-image');

  // --- Event handler for status bar update ---
  const handleImageLoad = () => {
      if (window.parent && window.parent !== window) {
          const imageName = `image${currentIndex}.webp`;
          const dimensions = `(${mainImage.naturalWidth}x${mainImage.naturalHeight})`;
          const statusText = `${imageName} ${dimensions}`;
          window.parent.postMessage({ type: 'updateStatusBar', text: statusText }, window.location.origin || '*');
      }
  };
  
  const handleImageError = () => {
      if (window.parent && window.parent !== window) {
          const imageName = `image${currentIndex}.webp`;
          window.parent.postMessage({ type: 'updateStatusBar', text: imageName + ' (Error loading)' }, window.location.origin || '*');
      }
  };

  // Add listeners ONCE
  mainImage.addEventListener('load', handleImageLoad);
  mainImage.addEventListener('error', handleImageError);

  function updateImage() {
    const imageName = `image${currentIndex}.webp`;
    // Just update the src; the load/error listeners will handle the status update
    mainImage.src = `../../../assets/apps/photo-viewer/${imageName}`;
  }

  // Slideshow logic
  let slideshowInterval = null;
  let isPlaying = false;
  const slideshowBtn = document.querySelector('.slideshow');

  function playSlideshow() {
    if (slideshowInterval) return;
    isPlaying = true;
    slideshowInterval = setInterval(() => {
      currentIndex = currentIndex % imageCount + 1;
      updateImage();
    }, 1500);
    if (slideshowBtn) slideshowBtn.classList.add('playing');
  }

  function pauseSlideshow() {
    isPlaying = false;
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    if (slideshowBtn) slideshowBtn.classList.remove('playing');
  }

  setupToolbar({
    '.back': () => {
      if (isPlaying) pauseSlideshow();
      currentIndex = (currentIndex - 2 + imageCount) % imageCount + 1;
      updateImage();
    },
    '.forward': () => {
      if (isPlaying) pauseSlideshow();
      currentIndex = currentIndex % imageCount + 1;
      updateImage();
    },
    '.slideshow': () => {
      if (isPlaying) {
        pauseSlideshow();
      } else {
        playSlideshow();
      }
    }
    // Add more toolbar button actions as needed
  });

  // Enable XP-style tooltips for toolbar buttons
  setupTooltips('.toolbar-row > div[data-tooltip]');

  // Add any additional Photo Viewer app logic here if needed
});

// ... existing code ...
