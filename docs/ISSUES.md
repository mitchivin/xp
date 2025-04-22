# ISSUES.md

## 1. DUPLICATE SCROLLBAR ARROWS

**Problem:**
Duplicate up/down arrows appear on scrollbars in program windows.

**Root Cause:**
This occurs when a scroll container (e.g., `.scroll-content`) or its parent containers are set to `display: flex` (especially with `flex-direction: column`) and/or have explicit `height` or `min-height` properties. This combination can cause XP.css (or native browser) scrollbars to render duplicate arrows.

**Solution:**
- Do NOT set `display: flex`, `height`, or `min-height` on scroll containers unless absolutely necessary.
- Keep scroll containers as simple block elements (no flex, no height/min-height).
- Only set width and padding on the inner content container for layout spacing.
- After reverting flex/height on the scroll container, the duplicate arrows will disappear and the scrollbar will return to its correct, single-arrow state.

**How to Fix:**
```css
.scroll-content {
  /* No display: flex, no height/min-height. */
}
```

This issue was resolved in the About Me window—refer to that implementation if needed. Always check this note before making any future changes to scroll container layouts.

## 2. MENU BAR HEIGHT MISMATCH IN NEW PROGRAMS

**Problem:**
When adding a new program, the menu bar is often visually taller (by 1-3px) than in About Me, My Projects, Contact Me, and Resume.pdf, even if the CSS appears identical.

**Root Cause:**
This happens when the menu bar is not a direct flex child of a `<body>` that is set to `display: flex; flex-direction: column; height: 100vh; width: 100vw;`. If the menu bar is inside another container (e.g., `.notepad-container`) and the parent containers are not set up with the correct flex and sizing context, the menu bar's height will not be strictly constrained to 24px, causing a mismatch.

**Solution (INSTANT FIX):**
1. In the new app's style.css, add the following at the top:
   ```css
   html, body {
     height: 100%;
     width: 100%;
     margin: 0;
     padding: 0;
     overflow: hidden;
   }
   body {
     display: flex;
     flex-direction: column;
     height: 100vh;
     width: 100vw;
     margin: 0;
     padding: 0;
     overflow: hidden;
   }
   .YOUR-APP-MAIN-CONTAINER {
     flex: 1 1 auto;
     display: flex;
     flex-direction: column;
     min-height: 0;
   }
   ```
   Replace `.YOUR-APP-MAIN-CONTAINER` with the main wrapper class (e.g., `.notepad-container`).
2. Ensure the `.menu-bar` is the first child of this main container and uses the same CSS as the working apps:
   ```css
   .menu-bar {
     display: flex;
     align-items: center;
     background: #ece9d8;
     height: 24px;
     padding: 0 8px 0 0;
     font-family: Tahoma, Arial, sans-serif;
     user-select: none;
     position: relative;
     z-index: 30;
     border-bottom: 2px solid #d7d4ca;
     cursor: default !important;
     box-sizing: border-box;
   }
   .menu-item {
     position: relative;
     padding: 0 10px;
     font-size: 11px;
     color: #222;
     height: 100%;
     display: flex;
     align-items: center;
     cursor: default !important;
     border: none;
     background: none;
     outline: none;
     transition: background 0.15s;
     box-sizing: border-box;
   }
   ```
3. Do NOT rely on only copying CSS—**the container structure and flex context must match the working apps**.

**How to Fix Instantly:**
- Copy the above structure and CSS into your new app.
- The menu bar will be pixel-perfect and match all other working programs.

**Reference:**
If you ever see a menu bar height mismatch, refer to this issue and apply the above structure and CSS. This is the proven, root-cause fix.

## 3. FILE MENU DOES NOT OPEN IN STANDALONE PREVIEW

**Problem:**
The file menu (or other dropdown menus) in some apps (e.g., My Projects) fails to appear when the app is viewed in standalone preview mode (opened directly, not within the main OS window), while it works correctly in other apps (e.g., Notepad).

**Root Cause:**
The issue stems from the JavaScript logic used to position the dropdown menu when a menu item is clicked. There are two common approaches:
1. **`position: absolute` relative to a container:** The script calculates the menu's `top` and `left` based on the menu item's position relative to a parent container (like `.menu-bar-container`). This works well when the app is embedded within the main OS window structure.
2. **`position: fixed` relative to the viewport:** The script calculates the menu's `top` and `left` based directly on the menu item's `getBoundingClientRect()`, which provides coordinates relative to the browser viewport. This is simpler and works reliably when the app is viewed standalone, as the app itself *is* the viewport.

The problem occurs when an app using the `position: absolute` logic is viewed standalone. The relative calculations might fail or conflict with the standalone preview environment.

**Solution (INSTANT FIX):**
Modify the app's JavaScript (`script.js`) to use the `position: fixed` approach for dropdown menus, mirroring the logic used in apps like Notepad where the menu works correctly in standalone mode.

**How to Fix:**
1. Open the `script.js` file for the affected app (e.g., `src/apps/my-projects/script.js`).
2. Locate the event listener for clicks on `.menu-item` elements.
3. Inside the click handler, find the code block that positions the dropdown menu (`menu.style...`).
4. Change the positioning logic to use `fixed` positioning based on `getBoundingClientRect()`:
   ```javascript
   // Inside the menu item click listener...
   if (menu) {
       // Position the dropdown below the menu item
       const rect = item.getBoundingClientRect();

       // Use fixed positioning relative to viewport (like Notepad)
       menu.style.position = 'fixed'; // <-- Change from 'absolute' if needed
       menu.style.left = rect.left + 'px'; // <-- Use direct viewport left
       menu.style.top = (rect.bottom) + 'px'; // <-- Use direct viewport bottom edge
       menu.style.minWidth = rect.width + 'px'; // Optional: Match width

       menu.classList.add('show');
   }
   ```
5. Remove or comment out any code that calculates position relative to a container (e.g., using `closest('.menu-bar-container')` and `containerRect`).

**Reference:**
Compare the `script.js` of the broken app with `src/apps/notepad/script.js` to see the difference in the menu positioning logic within the `.menu-item` click event handler.

## 4. MENU BAR: CORRECT IMPLEMENTATION & FUTURE USAGE

**Summary:**
To ensure the Windows XP-style menu bar works perfectly in all apps, you must:
- Place dropdown menu(s) (e.g., `<div id="file-menu" class="dropdown-menu">`) as siblings (not children) of the `.menu-bar`.
- Use `<script type="module" src="script.js"></script>` in your HTML to enable ES module imports.
- Use the shared `setupMenuBar` utility from `src/scripts/utils/menuBar.js` in your app's `script.js`.

### Why This Structure Is Required
- The shared menu bar utility relies on ES module imports, which only work with `type="module"` scripts.
- The dropdown menu must be outside `.menu-bar` for correct positioning, z-index, and to avoid CSS/JS conflicts.
- This approach ensures pixel-perfect, consistent behavior across all apps.

### How to Implement the Menu Bar in a New App

1. **HTML Structure:**
   ```html
   <div class="menu-bar-container">
     <div class="menu-bar">
       <div class="menu-item" data-menu="file">File</div>
       <div class="menu-item disabled" data-menu="edit">Edit</div>
       <div class="menu-item disabled" data-menu="format">Format</div>
       <div class="menu-item disabled" data-menu="view">View</div>
       <div class="menu-item disabled" data-menu="help">Help</div>
     </div>
   </div>
   <div id="file-menu" class="dropdown-menu">
     <div class="menu-option disabled" data-action="new">New</div>
     <div class="menu-option disabled">Open...</div>
     <div class="menu-option disabled">Save</div>
     <div class="menu-option disabled">Save As...</div>
     <div class="menu-separator"></div>
     <div class="menu-option disabled">Page Setup...</div>
     <div class="menu-option disabled">Print...</div>
     <div class="menu-separator"></div>
     <div class="menu-option" data-action="exit">Exit</div>
   </div>
   ```
   - The dropdown menu (`#file-menu`) must be a sibling of `.menu-bar`, not a child.

2. **Script Tag:**
   ```html
   <script type="module" src="script.js"></script>
   ```
   - Always use `type="module"` for scripts that import ES modules.

3. **JavaScript (script.js):**
   ```js
   import { setupMenuBar } from '../../../src/scripts/utils/menuBar.js';

   document.addEventListener('DOMContentLoaded', () => {
     setupMenuBar({
       menuBarSelector: '.menu-bar',
       // Optionally, you can pass dropdownMenus if IDs differ from convention
       // dropdownMenus: { file: document.getElementById('file-menu') }
     });
     // Add any additional app logic here
   });
   ```
   - This will enable the shared, robust menu bar logic in your app.

4. **CSS:**
   - Use the same menu bar and dropdown styles as in the working apps for pixel-perfect results.

### Troubleshooting
- If the menu does not open, check:
  - The dropdown menu is outside `.menu-bar`.
  - The script tag uses `type="module"`.
  - The import path to `menuBar.js` is correct.
- If you see no errors but the menu still doesn't work, clear your browser cache and refresh.

**Following these steps will ensure your menu bar works identically to the working apps and avoids common pitfalls.**

## 5. ABOUT ME BACKGROUND IMAGE NOT SHOWING

**Problem:**
The background image (`bg.webp`) for the About Me section does not display, resulting in a missing or broken background.

**Root Cause:**
The CSS background-image path was set as a relative path from the CSS file to `./assets/apps/about-me/bg.webp`. However, since the CSS file is located at `src/apps/about-me/style.css` and the assets folder is at the project root, the path was incorrect for both local and GitHub Pages deployment.

**Solution:**
Update the background-image path in `src/apps/about-me/style.css` to use the correct relative path to the root-level assets directory:
```css
body, .scroll-content {
  background-image: url("../../../assets/apps/about-me/bg.webp");
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: cover;
  background-attachment: fixed;
}
```

**How to Fix:**
- Always ensure that asset paths in CSS are relative to the CSS file's location, not the HTML file.
- For apps in `src/apps/[app]/`, the correct path to the root-level `assets` directory is typically `../../../assets/...`.
- After updating the path, the background image will display correctly both locally and on GitHub Pages.

**Reference:**
If you encounter missing backgrounds in other apps, check the relative path from the CSS file to the asset, and adjust as needed to point to the root-level `assets` directory.

## 6. ASSETS SHOW LOCALLY BUT NOT ON GITHUB PAGES

**Problem:**
Images and other assets (icons, backgrounds, etc.) display correctly in local/live preview but appear broken or missing when deployed to GitHub Pages (or other static hosts).

**Root Causes:**
1. **Incorrect Asset Paths:**
   - Local/live preview servers often serve your site from the project root, so paths like `/assets/...` or `./assets/...` may work even if they're not correct for deployment.
   - GitHub Pages serves your site from a subdirectory (e.g., `https://username.github.io/repo-name/`), so absolute paths (`/assets/...`) look for assets at the domain root, not your project folder.
   - **Solution:** Always use relative paths from the file referencing the asset to the asset itself. For example, from `src/apps/about-me/index.html` to `assets/gui/components/back.webp`, use `../../../assets/gui/components/back.webp`.

2. **Case Sensitivity:**
   - Windows and Mac file systems are case-insensitive, but GitHub Pages (Linux servers) are case-sensitive. `assets/Gui/Back.webp` is different from `assets/gui/back.webp`.
   - **Solution:** Double-check that all file and folder names match exactly (including case) in your code and in the repository.

3. **Directory Structure Differences:**
   - If your build process or deployment changes the directory structure, asset paths may break.
   - **Solution:** Ensure your deployed directory structure matches your local structure, or update asset paths accordingly.

4. **Files Not Pushed to Git:**
   - Sometimes assets are not added to git or are ignored by `.gitignore`.
   - **Solution:** Make sure all assets are tracked and pushed to your repository.

**How to Fix:**
- Use only relative paths for all asset references in HTML, CSS, and JS, based on the location of the referencing file.
- Avoid leading slashes (`/assets/...`) in asset paths; use `./` or `../` as needed.
- Double-check case and spelling of all asset references and filenames.
- After pushing, verify the deployed site and check the browser console for 404 errors to identify broken asset links.

**Reference:**
If assets work locally but not on GitHub Pages, check the path, case, and directory structure first. This is the most common cause of asset issues in static web projects. 