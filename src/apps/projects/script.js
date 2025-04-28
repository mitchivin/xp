'use strict';

// Select relevant elements
const filterItems = document.querySelectorAll('.project-item');
const navigationLinks = document.querySelectorAll('[data-nav-link]');
const articleTitle = document.querySelector('.article-title');

// Filter function: Shows/hides internet based on selected category
const filterFunc = function (selectedValue) {
    const allItems = Array.from(filterItems);
    allItems.forEach(item => {
        item.classList.remove('active');
        item.style.order = '';
    });
    let visible = allItems.filter(item => item.dataset.category.toLowerCase() === selectedValue);
    visible.forEach((item, idx) => {
        item.classList.add('active');
        item.style.order = idx;
    });
    adjustPaddingForScrollbar();
};

// Add click event listener to all navigation/filter links
navigationLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const filterValue = this.innerHTML.toLowerCase();
        navigationLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        filterFunc(filterValue);
        articleTitle.textContent = this.innerHTML;
    });
});

// Lightbox Functionality
const lightbox = document.querySelector('[data-lightbox]');
const lightboxCloseBtn = document.querySelector('[data-lightbox-close]');
const lightboxImg = document.querySelector('[data-lightbox-img]');
const lightboxVideo = document.querySelector('[data-lightbox-video]');
const lightboxTitle = document.querySelector('[data-lightbox-title]');
const lightboxCategory = document.querySelector('[data-lightbox-category]');
const lightboxDescription = document.querySelector('[data-lightbox-description]');
const projectLinks = document.querySelectorAll('.project-item > a');

const projectDescriptions = {
  'All Blacks Win': `A dramatic final score graphic capturing the decisive moment from the All Blacks' narrow victory over England. Focused on raw storytelling through minimal design, the composition highlights the physical intensity of the try while integrating the score and team branding directly into the field. Lighting and texture enhancements were used to sharpen the action and draw attention to the clash at the goal line. Every detail was crafted to preserve the emotion of a game won by the smallest of margins.`,
  'Mavericks Win': `A final score graphic celebrating the Dallas Mavericks' narrow win over the Minnesota Timberwolves. The design focuses on emotion and team unity, using a muted color treatment to spotlight the players while keeping the scoreline clear and dominant. Clean typography, strong visual hierarchy, and subtle logo integration ensure the final score stands out without overpowering the moment. Every choice was made to balance the storytelling with crisp, professional layout execution.`,
  'FLASHback': `A career highlight reel for Dwyane Wade, designed to match the chaotic energy of Crazy Train by Ozzy Osbourne. Focused on aggressive pacing, tight audio sync, and momentum-driven editing without overloading the visuals. Built to reflect the explosive style that defined Wade's prime.`,
  "Minnesota's Coldest": `An icy-themed graphic pairing two of Minnesota's brightest sports stars across football and basketball. Heavy snow textures, a cool blue palette, and layered cityscape elements were used to create a unified winter atmosphere. Careful compositing balances the personalities of both athletes while maintaining visual cohesion between the different sports. The design leans into the idea of resilience and swagger, reflecting the cold-weather grit that defines Minnesota's sports culture.`,
  'Snow Day': `A playoff highlight reel focused on capturing the weight and atmosphere of Saquon Barkley's snow game against the Rams. Built around slow pacing and clean timing to match the haunting tone of the Deadpool choir version of Like a Prayer. Edited with minimal effects to preserve the natural intensity of the footage.`,
  'Big Head Barkley': `A playful photo manipulation turning Saquon Barkley into an exaggerated, larger-than-life figure on the field. The design focuses on balancing realism with humor, carefully scaling and blending the oversized head while preserving the intensity of live-action movement. Textures and stadium detail were enhanced to ground the surreal edit in a believable environment. The final result captures both the energy of Barkley's playing style and the lighthearted fun of creative distortion.`,
  'Dynasty Flame': `Capturing the intensity and dominance of Patrick Mahomes, this piece highlights the spirit of the Kansas City Chiefs' championship era. Layered photo compositing and dynamic lighting techniques bring out both action and emotion, while a fiery color palette symbolizes the heat of competition and the relentless drive for greatness. Background typography and textured gradients were integrated to add depth without overpowering the central figures. Every detail was crafted to mirror the explosive impact Mahomes has made on modern football.`,
  'Code Switch': `A high-tempo edit tracking Joseph Sua'ali'i's transition from the NRL to the Wallabies. Synced to Jimmy Recard by Drapht, the project focuses on maintaining energy and rhythm while blending footage across two codes. Cuts and transitions were built to feel seamless without relying on heavy visual tricks.`,
  'Mamba Forever': `This graphic honors the legacy of Kobe Bryant through a surreal, dreamlike composition. Using advanced photo manipulation techniques, the piece blends real-world photography with fantasy elements like floating islands and ethereal clouds. The snake wrapped around his arm symbolizes Kobe's "Black Mamba" persona, while the towering sky creature hints at the mythic status he holds in sports history. Every element was designed to feel weightless yet powerful, reflecting the idea of transcendence beyond the game. The result is a visual story that captures both the ambition and the immortality of Bryant's legacy.`,
  'OS Simulation': `This project is a fully interactive portfolio built as a Windows XP simulation. Every window, app, and animation is custom-coded to recreate the look and feel of the classic OS, but reimagined as a showcase for my design and development work.<br><br>I used a combination of design tools and AI coding assistants to bring the experience to life, from the boot screen to draggable windows, sound effects, and pixel-perfect UI details. The result is a nostalgic, immersive environment that turns a simple portfolio into a playful, memorable journey—one that highlights both my creativity and technical skills.`,
  "Blue's Lineup": `A matchday lineup graphic for the Blues ahead of their clash against the Reds. The design focuses on clarity and structure, using bold typography, vertical layout alignment, and a strong color contrast to separate key information. Every detail was built to balance visual energy with clean readability, reinforcing brand consistency across the matchday suite.`
};

const projectTools = {
  'All Blacks Win': ['ps'],
  'Mavericks Win': ['ps', 'ai'],
  'FLASHback': ['pr', 'ae'],
  "Minnesota's Coldest": ['ps'],
  'Snow Day': ['pr', 'ae'],
  'Big Head Barkley': ['ps'],
  'Dynasty Flame': ['ps'],
  'Code Switch': ['pr', 'ae'],
  'Mamba Forever': ['ps'],
  'OS Simulation': ['html', 'css', 'js'],
  "Blue's Lineup": ['ps']
};

const toolIconData = {
  ps: { src: '../../../assets/apps/projects/icons/ps.webp', alt: 'Photoshop', label: 'Photoshop' },
  ai: { src: '../../../assets/apps/projects/icons/ai.webp', alt: 'Illustrator', label: 'Illustrator' },
  id: { src: '../../../assets/apps/projects/icons/id.webp', alt: 'InDesign', label: 'InDesign' },
  ae: { src: '../../../assets/apps/projects/icons/ae.webp', alt: 'After Effects', label: 'After Effects' },
  blender: { src: '../../../assets/apps/projects/icons/blender.webp', alt: 'Blender', label: 'Blender' },
  pr: { src: '../../../assets/apps/projects/icons/pr.webp', alt: 'Premiere Pro', label: 'Premiere Pro' },
  lr: { src: '../../../assets/apps/projects/icons/lr.webp', alt: 'Lightroom', label: 'Lightroom' },
  chat: { src: '../../../assets/apps/projects/icons/chat.webp', alt: 'ChatGPT', label: 'ChatGPT' },
  cursor: { src: '../../../assets/apps/projects/icons/cursor.webp', alt: 'Cursor', label: 'Cursor' },
  html: { src: '../../../assets/apps/projects/icons/html.webp', alt: 'HTML5', label: 'HTML5' },
  css: { src: '../../../assets/apps/projects/icons/css.webp', alt: 'CSS3', label: 'CSS3' },
  js: { src: '../../../assets/apps/projects/icons/js.webp', alt: 'JavaScript', label: 'JavaScript' }
};

const lightboxTools = document.querySelector('[data-lightbox-tools]');

const lightboxPrevBtn = document.querySelector('[data-lightbox-prev]');
const lightboxNextBtn = document.querySelector('[data-lightbox-next]');

let currentProjectIndex = null;
let currentProjectList = [];

function openLightboxByIndex(index) {
    const visibleProjects = Array.from(document.querySelectorAll('.project-item.active > a'));
    if (visibleProjects.length === 0) return;
    // Clamp index
    if (index < 0) index = visibleProjects.length - 1;
    if (index >= visibleProjects.length) index = 0;
    currentProjectIndex = index;
    currentProjectList = visibleProjects;
    visibleProjects[index].click();
}

// --- Ensure right (details) container matches left (image) container height ---
function syncDetailsHeight() {
  const left = document.querySelector('.lightbox-image-container');
  const right = document.querySelector('.lightbox-details-container');
  if (left && right && lightbox.classList.contains('active')) { // Only sync if lightbox is active
    // Reset height first to allow natural calculation
    right.style.height = 'auto';
    // Use requestAnimationFrame to ensure layout is updated before reading offsetHeight
    requestAnimationFrame(() => {
        const leftHeight = left.offsetHeight;
        right.style.height = leftHeight + 'px';
    });
  }
}

// Sync height when image/video loads
if (lightboxImg) {
  lightboxImg.addEventListener('load', syncDetailsHeight);
}
if (lightboxVideo) {
  lightboxVideo.addEventListener('loadedmetadata', syncDetailsHeight);
}

// Sync height when the iframe window resizes
window.addEventListener('resize', () => {
    // Use rAF to avoid performance issues and ensure calculations are based on final size
    requestAnimationFrame(syncDetailsHeight);
});

// Sync height when the lightbox becomes active (initial open)
const lightboxObserver = new MutationObserver((mutationsList) => {
    for(let mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (lightbox.classList.contains('active')) {
                requestAnimationFrame(syncDetailsHeight); // Sync on open
            } else {
                 // Reset height when closing
                const right = document.querySelector('.lightbox-details-container');
                if (right) right.style.height = 'auto';
            }
        }
    }
});
if (lightbox) {
    lightboxObserver.observe(lightbox, { attributes: true });
}

// Preload the next/prev video as soon as navigation is triggered
function preloadVideoForIndex(index) {
  const visibleProjects = Array.from(document.querySelectorAll('.project-item.active > a'));
  if (!visibleProjects[index]) return;
  const videoSrc = visibleProjects[index].getAttribute('data-video');
  if (videoSrc && !document.querySelector(`video[data-preload-src='${videoSrc}']`)) {
    const preloadVid = document.createElement('video');
    preloadVid.src = videoSrc;
    preloadVid.preload = 'auto';
    preloadVid.muted = true;
    preloadVid.setAttribute('data-preload-src', videoSrc);
    preloadVid.style.display = 'none';
    document.body.appendChild(preloadVid);
  }
}

// Gallery images for internet (add more as needed)
const projectImages = {
  'OS Simulation': [
    '../../../assets/apps/projects/images/cover-10.webp',
    '../../../assets/apps/projects/images/test1.webp',
    '../../../assets/apps/projects/images/test2.webp'
  ]
  // Add more internet as needed
};

let currentGalleryIndex = 0;

function setupGalleryForProject(projectTitle) {
  const gallery = document.querySelector('.lightbox-gallery');
  const img = gallery.querySelector('.lightbox-img');
  const container = document.querySelector('.lightbox-image-container');
  const dotsContainer = container.querySelector('.gallery-dots');
  const images = projectImages[projectTitle];

  function showCurrentImage() {
    img.src = images[currentGalleryIndex];
    // Update dots
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.gallery-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentGalleryIndex);
      });
    }
  }

  function goToImage(idx) {
    currentGalleryIndex = idx;
    showCurrentImage();
  }

  // Remove previous dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
  }

  if (images && images.length > 1) {
    dotsContainer.style.display = '';
    currentGalleryIndex = 0;
    // Create dots
    images.forEach((imgSrc, idx) => {
      const dot = document.createElement('div');
      dot.className = 'gallery-dot' + (idx === 0 ? ' active' : '');
      dot.setAttribute('tabindex', '0');
      dot.setAttribute('role', 'button');
      dot.setAttribute('aria-label', `Go to image ${idx + 1}`);
      dot.addEventListener('click', () => goToImage(idx));
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') goToImage(idx);
      });
      dotsContainer.appendChild(dot);
    });
    showCurrentImage();
  } else {
    if (dotsContainer) dotsContainer.style.display = 'none';
    currentGalleryIndex = 0;
    if (images && images.length === 1) {
      img.src = images[0];
    }
  }
}

projectLinks.forEach((link, idx) => {
    link.addEventListener('click', function (event) {
        event.preventDefault();
        // Find the index in the current visible (filtered) list
        const visibleProjects = Array.from(document.querySelectorAll('.project-item.active > a'));
        currentProjectList = visibleProjects;
        currentProjectIndex = visibleProjects.indexOf(this);
        const imgElement = this.querySelector('img');
        const titleElement = this.querySelector('.project-title');
        const categoryElement = this.querySelector('.project-category');
        const videoSrc = this.getAttribute('data-video');
        const lightboxContent = document.querySelector('.lightbox-content');
        if (titleElement && categoryElement && lightboxTitle && lightboxCategory) {
            lightboxTitle.textContent = titleElement.textContent;
            lightboxCategory.textContent = categoryElement.textContent;
            if (lightboxDescription) {
                const desc = projectDescriptions[titleElement.textContent.trim()];
                lightboxDescription.innerHTML = desc || '';
            }
            setupGalleryForProject(titleElement.textContent.trim());
            // Dynamic tools/tech stack label
            if (lightboxTools) {
                lightboxTools.innerHTML = '';
                const tools = projectTools[titleElement.textContent.trim()] || [];
                // Determine label: 'Tech Stack:' for web development, else 'Tools Used:'
                const category = categoryElement.textContent.trim().toLowerCase();
                const label = category === 'web development' ? 'Tech Stack:' : 'Tools Used:';
                const toolsLabelElem = document.querySelector('.tools-label');
                if (toolsLabelElem) toolsLabelElem.textContent = label;
                tools.forEach(toolKey => {
                    const tool = toolIconData[toolKey];
                    if (tool) {
                        const wrapper = document.createElement('span');
                        wrapper.className = 'tool-icon-wrapper';
                        wrapper.innerHTML = `
                          <img src="${tool.src}" alt="${tool.alt}" class="tool-icon" />
                          <span class="tool-tooltip">${tool.label}</span>
                        `;
                        lightboxTools.appendChild(wrapper);
                    }
                });
            }
            const container = document.querySelector('.lightbox-image-container');
            if (videoSrc) {
                // Remove any existing video element
                const oldVideo = container.querySelector('.lightbox-video');
                if (oldVideo) container.removeChild(oldVideo);
                // Use preloaded video if available
                let preloaded = document.querySelector(`video[data-preload-src='${videoSrc}']`);
                let videoToShow;
                if (preloaded) {
                    videoToShow = preloaded;
                    videoToShow.style.display = '';
                    videoToShow.controls = true;
                    videoToShow.className = 'lightbox-video';
                    videoToShow.muted = false;
                    // Remove from body and append to container
                    document.body.removeChild(videoToShow);
                    container.appendChild(videoToShow);
                } else {
                    // Fallback: create a new video element
                    videoToShow = document.createElement('video');
                    videoToShow.src = videoSrc;
                    videoToShow.controls = true;
                    videoToShow.className = 'lightbox-video';
                    container.appendChild(videoToShow);
                }
                if (lightboxImg) {
                    lightboxImg.style.display = 'none';
                    lightboxImg.src = '';
                }
                if (lightboxContent) {
                    lightboxContent.classList.add('video-lightbox');
                }
            } else if (imgElement && lightboxImg) {
                // Show image, hide video
                // Use gallery logic for image src
                const gallery = document.querySelector('.lightbox-gallery');
                const images = projectImages[titleElement.textContent.trim()];
                if (!(images && images.length > 1)) {
                  lightboxImg.src = imgElement.src;
                }
                lightboxImg.style.display = '';
                // Remove any video element
                const oldVideo = container.querySelector('.lightbox-video');
                if (oldVideo) container.removeChild(oldVideo);
                if (lightboxContent) {
                    lightboxContent.classList.remove('video-lightbox');
                }
            }
            lightbox.classList.add('active');
            // syncDetailsHeight(); // Sync height after opening - Now handled by MutationObserver
        }
    });
});

if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        lightbox.classList.remove('active');
        // Stop and reset ALL video elements inside the lightbox
        const videos = lightbox.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
            // Optionally clear src to release memory
            // video.src = '';
        });
        if (lightboxImg) {
            lightboxImg.src = '';
        }
        const lightboxContent = document.querySelector('.lightbox-content');
        if (lightboxContent) {
            lightboxContent.classList.remove('video-lightbox');
        }
        // Reset right container height when closing - Now handled by MutationObserver
        // const right = document.querySelector('.lightbox-details-container');
        // if (right) right.style.height = '';
    });
}

// Fade animation for lightbox navigation
function animateLightboxTransition(callback) {
  const imgContainer = document.querySelector('.lightbox-image-container');
  const detailsContainer = document.querySelector('.lightbox-details-container');
  imgContainer.classList.add('lightbox-fade-out', 'lightbox-animating');
  detailsContainer.classList.add('lightbox-fade-out', 'lightbox-animating');
  setTimeout(() => {
    callback(); // Update content

    // Find the new image or video
    const newImg = imgContainer.querySelector('.lightbox-img');
    const newVid = imgContainer.querySelector('.lightbox-video');

    function finishFadeIn() {
      imgContainer.classList.remove('lightbox-fade-out');
      detailsContainer.classList.remove('lightbox-fade-out');
      setTimeout(() => {
        imgContainer.classList.remove('lightbox-animating');
        detailsContainer.classList.remove('lightbox-animating');
      }, 100);
    }

    if (newVid && newVid.readyState < 1) {
      newVid.addEventListener('loadedmetadata', finishFadeIn, { once: true });
    } else if (newImg && !newImg.complete) {
      newImg.addEventListener('load', finishFadeIn, { once: true });
    } else {
      finishFadeIn();
    }
  }, 100);
}

if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentProjectList.length > 0 && currentProjectIndex !== null) {
            let prevIndex = currentProjectIndex - 1;
            if (prevIndex < 0) prevIndex = currentProjectList.length - 1;
            preloadVideoForIndex(prevIndex);
            animateLightboxTransition(() => openLightboxByIndex(prevIndex));
        }
    });
}
if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentProjectList.length > 0 && currentProjectIndex !== null) {
            let nextIndex = currentProjectIndex + 1;
            if (nextIndex >= currentProjectList.length) nextIndex = 0;
            preloadVideoForIndex(nextIndex);
            animateLightboxTransition(() => openLightboxByIndex(nextIndex));
        }
    });
}

// Initial filter
filterFunc('social graphics');
articleTitle.textContent = 'Social Graphics';
requestAnimationFrame(() => {
  requestAnimationFrame(adjustPaddingForScrollbar);
});

function adjustPaddingForScrollbar() {
  const container = document.body;
  // Check if vertical scrollbar is present on the window
  const needsScrollbar = document.documentElement.scrollHeight > document.documentElement.clientHeight;
  if (!needsScrollbar) {
    container.style.paddingRight = '16px'; // Adjust to your scrollbar width if needed
  } else {
    container.style.paddingRight = '';
  }
}

document.addEventListener('DOMContentLoaded', adjustPaddingForScrollbar);
window.addEventListener('resize', adjustPaddingForScrollbar);

document.querySelectorAll('.project-img').forEach(figure => {
  const video = figure.querySelector('.project-hover-preview');
  if (!video) return;
  figure.addEventListener('mouseenter', () => {
    video.currentTime = 0;
    video.play();
  });
  figure.addEventListener('mouseleave', () => {
    video.pause();
    video.currentTime = 0;
  });
});

// Preload ALL project videos at startup
(function preloadAllProjectVideos() {
  const videoLinks = document.querySelectorAll('.project-item > a[data-video]');
  videoLinks.forEach(link => {
    const videoSrc = link.getAttribute('data-video');
    if (videoSrc && !document.querySelector(`video[data-preload-src='${videoSrc}']`)) {
      const preloadVid = document.createElement('video');
      preloadVid.src = videoSrc;
      preloadVid.preload = 'auto';
      preloadVid.muted = true;
      preloadVid.setAttribute('data-preload-src', videoSrc);
      preloadVid.style.display = 'none';
      document.body.appendChild(preloadVid);
    }
  });
})();
