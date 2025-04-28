# Windows XP Portfolio Simulation

A fully interactive, web-based simulation of the classic Windows XP desktop environment, reimagined as a creative digital portfolio. This project showcases design, development, and multimedia work in a nostalgic, highly interactive format.

---

## Features

- **Authentic Windows XP UI:**  
  Desktop, taskbar, start menu, window management, and system tray faithfully recreated with modern web technologies.

- **App-Based Portfolio:**  
  Each "app" (About Me, Projects, Contact, Resume, Notepad, Music Player, Photos, Internet) is a self-contained window, presenting a different aspect of your work and skills.

- **Multimedia Integration:**  
  - Image galleries, video previews, and interactive lightboxes.
  - Embedded music player with custom UI and audio controls.

- **Dynamic Effects:**  
  - CRT overlay, scanlines, and subtle flicker for retro authenticity.
  - Responsive design for various screen sizes, including ultrawide support.

- **Performance Optimizations:**  
  - Preloading and prefetching of assets for instant app/window opening.
  - Modular, event-driven JavaScript for maintainability and scalability.

- **Accessibility & Usability:**  
  - Keyboard and mouse navigation.
  - Tooltips and clear visual feedback for all interactive elements.

---

## Getting Started

### 1. Clone or Download

```bash
git clone https://github.com/yourusername/xp-portfolio.git
cd xp-portfolio
```

### 2. Open in Browser

No build step required!  
Simply open `index.html` in your preferred browser.

> **Tip:** For the best experience, use Chrome or Edge and press `F11` for full screen.

---

## Project Structure

```
XP_v1.07/
│
├── index.html                # Main entry point
├── src/
│   ├── apps/                 # Individual app windows (about, projects, musicPlayer, etc.)
│   ├── scripts/              # Core logic, managers, utilities
│   └── styles/               # Main styles, XP theme, CRT effects, resets
├── assets/                   # Images, icons, audio, fonts
└── ...
```

---

## Customization

- **Add/Edit Portfolio Items:**  
  Update the relevant HTML/CSS/JS in `src/apps/projects/` or other app folders.
- **Change Desktop Icons:**  
  Replace or add images in `assets/gui/desktop/`.
- **Modify Music Player:**  
  Add songs/covers to `assets/apps/musicPlayer/`.

---

## Credits

- **Design & Development:**  
  Mitchell Ivin ([mitchellivin@gmail.com](mailto:mitchellivin@gmail.com))
- **XP.css:**  
  [XP.css](https://botoxparty.github.io/XP.css/) for base Windows XP styling inspiration.

---

## License

This project is for educational and portfolio purposes. Please contact for collaboration or reuse. 