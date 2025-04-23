'use strict';

// Select relevant elements
const filterItems = document.querySelectorAll('.project-item');
const navigationLinks = document.querySelectorAll('[data-nav-link]');
const articleTitle = document.querySelector('.article-title');

// Filter function: Shows/hides projects based on selected category
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
        visible = allItems.slice(-6);
    } else {
        visible = allItems.filter(item => item.dataset.category.toLowerCase() === selectedValue);
    }
    // Reverse the visible array for most-recent-first
    visible = visible.slice().reverse();
    visible.forEach((item, idx) => {
        item.classList.add('active');
        item.style.order = idx;
    });
};

// Add click event listener to all navigation/filter links
navigationLinks.forEach(link => {
    link.addEventListener('click', function () {
        const filterValue = this.innerHTML.toLowerCase();
        navigationLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        filterFunc(filterValue);
        articleTitle.textContent = filterValue === "all" || filterValue === "latest" ? "Latest" : this.innerHTML;
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
  'Project 10': `This portfolio is built entirely inside a custom-made Windows XP environment — every window, program, and interaction is styled and behaves like the real OS. It started as a personal experiment to see what I could create using AI tools to help bring ideas to life that I couldn't code manually myself.\n\nEvery part of the system — from the boot screen to the Start menu, working apps, pop-ups, tooltips, and sound effects — was designed by me and assembled with AI-assisted code. I focused on matching the look and feel of the original XP as closely as possible, while turning it into a fully interactive portfolio that presents each project like a native program.\n\nThe result is something that feels more like an operating system than a website — a fully navigable, nostalgic experience that also works as a functional showcase of my design work.`
};

projectLinks.forEach(link => {
    link.addEventListener('click', function (event) {
        event.preventDefault();
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
                lightboxDescription.textContent = desc || '';
            }
            if (videoSrc && lightboxVideo) {
                // Show video, hide image
                lightboxVideo.src = videoSrc;
                lightboxVideo.style.display = '';
                if (lightboxImg) {
                    lightboxImg.style.display = 'none';
                    lightboxImg.src = '';
                }
                if (lightboxContent) {
                    lightboxContent.classList.add('video-lightbox');
                }
            } else if (imgElement && lightboxImg) {
                // Show image, hide video
                lightboxImg.src = imgElement.src;
                lightboxImg.style.display = '';
                if (lightboxVideo) {
                    lightboxVideo.style.display = 'none';
                    lightboxVideo.src = '';
                }
                if (lightboxContent) {
                    lightboxContent.classList.remove('video-lightbox');
                }
            }
            lightbox.classList.add('active');
        }
    });
});

if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', () => {
        lightbox.classList.remove('active');
        if (lightboxVideo) {
            lightboxVideo.pause();
            lightboxVideo.currentTime = 0;
            lightboxVideo.src = '';
        }
        if (lightboxImg) {
            lightboxImg.src = '';
        }
        const lightboxContent = document.querySelector('.lightbox-content');
        if (lightboxContent) {
            lightboxContent.classList.remove('video-lightbox');
        }
    });
}

// Initial filter
filterFunc('latest');
