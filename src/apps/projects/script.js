'use strict';

// Select relevant elements
const filterItems = document.querySelectorAll('.project-item');
const navigationLinks = document.querySelectorAll('[data-nav-link]');
const articleTitle = document.querySelector('.article-title');

// Filter function: Shows/hides internet based on selected category
const filterFunc = function (selectedValue) {
    const allItems = Array.from(filterItems);
    // Hide all and reset order
    allItems.forEach(item => {
        item.classList.remove('active');
        item.style.order = '';
    });
    let visible = [];
    if (selectedValue === "all") {
        visible = allItems;
    } else if (selectedValue === "latest") {
        visible = allItems.slice(-8);
    } else {
        visible = allItems.filter(item => item.dataset.category.toLowerCase() === selectedValue);
    }
    // Reverse the visible array for most-recent-first
    visible = visible.slice().reverse();
    visible.forEach((item, idx) => {
        item.classList.add('active');
        item.style.order = idx;
    });
    // Adjust padding for scrollbar after filtering
    adjustPaddingForScrollbar();
    // If a flash still occurs, uncomment the next line and comment out the above:
    // requestAnimationFrame(adjustPaddingForScrollbar);
};

// Add click event listener to all navigation/filter links
navigationLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const filterValue = this.innerHTML.toLowerCase();
        navigationLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        filterFunc(filterValue);
        articleTitle.textContent =
          filterValue === "all"
            ? "Latest"
            : filterValue === "latest"
            ? "Latest Projects"
            : this.innerHTML;
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
  'Final Line :: Victory by Inches': `For this piece, I aimed to capture the intensity of the final play. Utilizing a top-down perspective, I integrated the score into the field's plane to maintain immersion. Selective sharpening and vignetting were applied to focus attention on the pivotal moment.`,
  "Minnesota's Coldest :: Two Codes, One City": `This design blends NBA and NFL athletes into a cohesive winter scene. I employed snow overlays and blue-toned grading to unify the subjects. Attention was given to lighting and texture consistency to ensure realism across all elements.`,
  'Final Shot :: Mavs Over Wolves': `A minimalist approach was taken here, with a desaturated background to highlight key players. The layout was structured vertically to establish a clear hierarchy. Warm and cool tones were utilized to create depth and separation between elements.`,
  'Gridiron Giant :: Barkley Unleashed': `This piece features a stylized head enlargement to draw focus. The background was kept clean with subtle textures to support the main subject. Typography was minimized to avoid distraction from the visual impact.`,
  'Dynasty Flame :: The Mahomes Era': `Layering dual poses conveyed movement and dominance in this design. Warm gradient overlays and textured backgrounds were applied to enhance energy. Background typography was repeated to frame the subject without overpowering the composition.​`,
  'Ascend :: Mamba Forever': `Crafted as a tribute, this piece incorporates surreal elements like floating platforms and cloud rings. Soft lighting and muted colors were used to evoke a reflective mood. All components were directed to focus attention on the central figure.`,
  'FLASHback :: Dwayne Wade': `This project involved the full video production lifecycle, from initial concept development and storyboarding through filming, editing, and final post-production. We focused on creating a compelling narrative using high-quality footage, dynamic motion graphics, and professional sound design. Careful attention was paid to color grading and visual effects to ensure the final product met the client's vision and exceeded expectations for engagement and visual appeal.`,
  'Cold Blooded :: Saquon Barkley': `This project involved the full video production lifecycle, from initial concept development and storyboarding through filming, editing, and final post-production. We focused on creating a compelling narrative using high-quality footage, dynamic motion graphics, and professional sound design. Careful attention was paid to color grading and visual effects to ensure the final product met the client's vision and exceeded expectations for engagement and visual appeal.`,
  'Code Switch :: Joseph Sua\'ali\'i': `This project involved the full video production lifecycle, from initial concept development and storyboarding through filming, editing, and final post-production. We focused on creating a compelling narrative using high-quality footage, dynamic motion graphics, and professional sound design. Careful attention was paid to color grading and visual effects to ensure the final product met the client's vision and exceeded expectations for engagement and visual appeal.`,
  'Project 10': `This portfolio is built entirely inside a custom-made Windows XP environment — every window, program, and interaction is styled and behaves like the real OS. It started as a personal experiment to see what I could create using AI tools to help bring ideas to life that I couldn't code manually myself.\n\nEvery part of the system — from the boot screen to the Start menu, working apps, pop-ups, tooltips, and sound effects — was designed by me and assembled with AI-assisted code. I focused on matching the look and feel of the original XP as closely as possible, while turning it into a fully interactive portfolio that presents each project like a native program.\n\nThe result is something that feels more like an operating system than a website — a fully navigable, nostalgic experience that also works as a functional showcase of my design work.`,
  'OS Simulation :: My Portfolio': `This project is a fully interactive portfolio built as a Windows XP simulation. Every window, app, and animation is custom-coded to recreate the look and feel of the classic OS, but reimagined as a showcase for my design and development work.<br><br>I used a combination of design tools and AI coding assistants to bring the experience to life, from the boot screen to draggable windows, sound effects, and pixel-perfect UI details. The result is a nostalgic, immersive environment that turns a simple portfolio into a playful, memorable journey—one that highlights both my creativity and technical skills.`
};

const projectTools = {
  'Final Line :: Victory by Inches': ['ps'],
  "Minnesota's Coldest :: Two Codes, One City": ['ps'],
  'Final Shot :: Mavs Over Wolves': ['ps', 'ai'],
  'Gridiron Giant :: Barkley Unleashed': ['ps'],
  'Dynasty Flame :: The Mahomes Era': ['ps'],
  'Ascend :: Mamba Forever': ['ps'],
  'FLASHback :: Dwayne Wade': ['pr', 'ae'],
  'Cold Blooded :: Saquon Barkley': ['pr', 'ae'],
  'Code Switch :: Joseph Sua\'ali\'i': ['pr', 'ae'],
  'OS Simulation :: My Portfolio': ['cursor', 'chat', 'ps', 'ai']
  // Add more as needed
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
  cursor: { src: '../../../assets/apps/projects/icons/cursor.webp', alt: 'Cursor', label: 'Cursor' }
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
  'OS Simulation :: My Portfolio': [
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
  const upArrow = container.querySelector('.gallery-arrow-up');
  const downArrow = container.querySelector('.gallery-arrow-down');
  const counter = container.querySelector('.gallery-counter');
  const images = projectImages[projectTitle];

  function showCurrentImage() {
    img.src = images[currentGalleryIndex];
    counter.textContent = `${currentGalleryIndex + 1} / ${images.length}`;
  }

  function prevImage() {
    currentGalleryIndex = (currentGalleryIndex - 1 + images.length) % images.length;
    showCurrentImage();
  }
  function nextImage() {
    currentGalleryIndex = (currentGalleryIndex + 1) % images.length;
    showCurrentImage();
  }

  // Remove previous event listeners by cloning
  upArrow.replaceWith(upArrow.cloneNode(true));
  downArrow.replaceWith(downArrow.cloneNode(true));
  // Re-select after cloning
  const newUpArrow = container.querySelector('.gallery-arrow-up');
  const newDownArrow = container.querySelector('.gallery-arrow-down');

  if (images && images.length > 1) {
    newUpArrow.style.display = newDownArrow.style.display = counter.style.display = '';
    currentGalleryIndex = 0;
    showCurrentImage();
    newUpArrow.addEventListener('click', prevImage);
    newDownArrow.addEventListener('click', nextImage);
    newUpArrow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') prevImage(); });
    newDownArrow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') nextImage(); });
  } else {
    newUpArrow.style.display = newDownArrow.style.display = counter.style.display = 'none';
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
            // Dynamic tools used
            if (lightboxTools) {
                lightboxTools.innerHTML = '';
                const tools = projectTools[titleElement.textContent.trim()] || [];
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
    imgContainer.classList.remove('lightbox-fade-out');
    detailsContainer.classList.remove('lightbox-fade-out');
    setTimeout(() => {
      imgContainer.classList.remove('lightbox-animating');
      detailsContainer.classList.remove('lightbox-animating');
    }, 175); // Match transition duration (was 350)
  }, 175); // Match transition duration (was 350)
}

if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentProjectList.length > 0 && currentProjectIndex !== null) {
            let nextIndex = currentProjectIndex + 1;
            if (nextIndex >= currentProjectList.length) nextIndex = 0;
            preloadVideoForIndex(nextIndex); // Start preloading as soon as clicked
            animateLightboxTransition(() => openLightboxByIndex(nextIndex));
        }
    });
}
if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentProjectList.length > 0 && currentProjectIndex !== null) {
            let prevIndex = currentProjectIndex - 1;
            if (prevIndex < 0) prevIndex = currentProjectList.length - 1;
            preloadVideoForIndex(prevIndex); // Start preloading as soon as clicked
            animateLightboxTransition(() => openLightboxByIndex(prevIndex));
        }
    });
}

// Initial filter
filterFunc('latest');
articleTitle.textContent = 'Latest Projects';
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
