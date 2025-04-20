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

  function updateImage() {
    mainImage.src = `/assets/apps/photo-viewer/image${currentIndex}.webp`;
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
