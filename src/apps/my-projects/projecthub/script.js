'use strict';

// Select relevant elements
const filterItems = document.querySelectorAll('[data-filter-item]');
const navigationLinks = document.querySelectorAll('[data-nav-link]'); // Includes both navbar and filter-list buttons
const articleTitle = document.querySelector('.article-title'); // Select the h2 title

// Filter function: Shows/hides projects based on selected category
const filterFunc = function (selectedValue) {
    for (let i = 0; i < filterItems.length; i++) {
        const itemCategory = filterItems[i].dataset.category.toLowerCase();
        if (selectedValue === "all" || selectedValue === itemCategory) {
            filterItems[i].classList.add('active');
        } else {
            filterItems[i].classList.remove('active');
        }
    }
}

// Add click event listener to all navigation/filter links
for (let i = 0; i < navigationLinks.length; i++) {
    navigationLinks[i].addEventListener('click', function () {

        const clickedLink = this;
        const filterValue = clickedLink.innerHTML.toLowerCase();
        const filterText = clickedLink.innerHTML; // Get the original text for the title

        // Update active state for *all* navigation links (navbar and filter-list)
        for (let j = 0; j < navigationLinks.length; j++) {
            // Match buttons by their text content to sync navbar and filter-list
            if (navigationLinks[j].innerHTML.toLowerCase() === filterValue) {
                navigationLinks[j].classList.add('active');
            } else {
                navigationLinks[j].classList.remove('active');
            }
        }

        // Apply the filter
        filterFunc(filterValue);

        // Update the article title
        if (filterValue === "all") {
            articleTitle.textContent = "All Projects";
        } else {
            articleTitle.textContent = filterText;
        }
    });
}
