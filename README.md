# Windows XP Portfolio Simulation

A modern, interactive web-based simulation of the Windows XP desktop environment, designed as a creative portfolio. This project faithfully recreates the look, feel, and behavior of classic Windows XP—including boot/login, desktop, taskbar, and a suite of modular apps (About Me, My Projects, Notepad, Media Player, and more).

---

## 🚀 Features
- **Authentic Windows XP UI:** Boot animation, login screen, desktop, taskbar, and windowed apps.
- **Multiple Portfolio Apps:** Each app (About, Projects, Notepad, Media Player, Photos, Resume, Contact, Internet, etc.) is a self-contained XP-style program.
- **Modular Architecture:** Easily add or extend apps using shared utilities for menu bars, toolbars, and window management.
- **Responsive & Cross-Browser:** Works on modern browsers and adapts to various screen sizes.
- **Pixel-Perfect Styling:** Custom XP.css and utility scripts for accurate visuals and interactions.

## 🗂️ Project Structure
- `index.html` — Main entry point
- `src/apps/` — Each app in its own subdirectory (with `index.html`, `script.js`, `style.css`)
- `src/scripts/` — Core logic and shared utilities (menu bar, toolbar, window manager, etc.)
- `src/styles/` — Shared/global styles
- `assets/` — Images, icons, and sounds
- `docs/` — Documentation (including this README)

## 🛠️ Getting Started
1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd portfolioXP
   ```
2. **Open `index.html` in your browser** (no build step required).
3. **Explore the desktop and apps!**

### Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- No server or build tools required (pure front-end)

## 🧩 Adding or Modifying Apps
- Each app lives in its own folder under `src/apps/` (e.g., `src/apps/notepad/`).
- Use shared utilities from `src/scripts/utils/` for consistent menu bars, toolbars, and actions.
- Follow existing app structure for markup, styles, and logic.
- For new apps, copy a minimal working app as a template.

## 🤝 Contributing
- Keep UI/UX pixel-perfect and consistent with Windows XP.
- Use shared utilities and follow code/documentation conventions.
- Document new features or changes in this README.

## 🐞 Known Issues & Troubleshooting
### 1. Duplicate Scrollbar Arrows
- **Problem:** Duplicate up/down arrows may appear in scrollbars if a scroll container uses `display: flex` or has explicit `height`/`min-height`.
- **Solution:**
  - Avoid `display: flex`, `height`, or `min-height` on scroll containers unless necessary.
  - Keep scroll containers as simple block elements.
  - See the About Me app for a working example.

### 2. Menu Bar Height Mismatch in New Apps
- **Problem:** Menu bars in new apps may appear taller than in core apps, despite similar CSS.
- **Solution:**
  - Ensure the menu bar is a direct flex child of a `<body>` set to `display: flex; flex-direction: column; height: 100vh; width: 100vw;`.
  - Use the following CSS at the top of your app's `style.css`:
    ```css
    html, body {
      height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden;
    }
    body {
      display: flex; flex-direction: column; height: 100vh; width: 100vw; margin: 0; padding: 0; overflow: hidden;
    }
    .YOUR-APP-MAIN-CONTAINER {
      flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0;
    }
    ```
  - Replace `.YOUR-APP-MAIN-CONTAINER` with your main wrapper class.

### 3. Dropdown Menus Not Positioned Correctly
- **Problem:** Dropdown menus may not align or function as expected in standalone mode.
- **Solution:**
  - Use `position: fixed` for dropdown menus in your app's JavaScript, mirroring logic from Notepad or other working apps.

### 4. Asset Path Issues
- **Problem:** Background images or icons may not display if asset paths are incorrect, especially on GitHub Pages.
- **Solution:**
  - Use correct relative paths from the CSS/HTML file to the `assets/` directory at the project root.
  - Example:
    ```css
    background-image: url("../../../assets/apps/about-me/bg.webp");
    ```

---

## 📢 Support & Questions
For questions, suggestions, or bug reports, please contact the project maintainer or open an issue in your repository platform.

---

© 2025 Mitch Ivin. All rights reserved. This project is for portfolio and educational use only and is not affiliated with Microsoft.