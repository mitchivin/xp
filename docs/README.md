# Windows XP Portfolio Simulation – Documentation

This folder contains documentation, guides, and implementation notes for the Windows XP portfolio simulation project.

## Overview

This project is a web-based simulation of the Windows XP desktop environment, used as a creative portfolio. It features a boot/login sequence, desktop UI, taskbar, and multiple app modules (About Me, My Projects, Notepad, etc.), each styled and behaving like classic Windows XP programs.

## Key Documentation

- [ISSUES.md](./ISSUES.md):
  - Implementation notes, known issues, and UI conventions for building and maintaining app modules.
  - Includes pixel-perfect CSS/HTML structure for menu bars, toolbars, and scroll containers.
  - Reference for troubleshooting and ensuring UI consistency across apps.

## Project Structure

- Main entry point: `index.html` (project root)
- App modules: `src/apps/` (each app in its own subdirectory)
- Shared scripts: `src/scripts/` (core logic and utilities)
- Shared styles: `src/styles/` (main, GUI, and utility CSS)
- Assets: `assets/` (images, icons, sounds)

For a detailed project structure and conventions, see the Cursor Rule in `.cursor/rules/project-structure.mdc`.

## Contributing

- Follow the conventions in `ISSUES.md` for new apps or UI changes.
- Use shared utilities from `src/scripts/utils/` for menu bars, toolbars, and common actions.
- Keep documentation up to date as the project evolves.

---

For any questions or to report issues, see the main project README or contact the project maintainer. 