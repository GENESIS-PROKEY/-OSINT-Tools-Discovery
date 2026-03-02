# 🛡️ OSINT Tools Discovery

> The most comprehensive open-source intelligence toolkit directory — **2000+ tools** across **95+ categories**.

<div align="center">

![OSINT Tools Discovery](https://img.shields.io/badge/Tools-2178+-6c5ce7?style=for-the-badge)
![Categories](https://img.shields.io/badge/Categories-146+-00cec9?style=for-the-badge)
![License](https://img.shields.io/badge/License-GPL_3.0-333?style=for-the-badge)

**[🔍 Launch App](https://GENESIS-PROKEY.github.io/-OSINT-Tools-Discovery/)** · **[📋 Report Issue](https://github.com/GENESIS-PROKEY/-OSINT-Tools-Discovery/issues)**

</div>

---

## ✨ Features

- 🔍 **Instant Search** — Fast, debounced search across tool names, descriptions, and categories
- 📂 **Collapsible Sidebar** — 95+ categories with expandable subcategories and tool count badges
- 🌙 **Dark / Light Mode** — Toggle between themes with saved preference
- 🖼️ **Favicons** — Website icons next to every tool for quick visual identification
- ⌨️ **Keyboard Shortcuts** — Press `/` to search, `Esc` to clear
- 📱 **Fully Responsive** — Desktop sidebar, mobile slide-in overlay
- ⚡ **Zero Dependencies** — Pure vanilla HTML, CSS, JavaScript — no frameworks
- 🏎️ **Lag-Free** — Lazy-rendered in batches of 60 for smooth scrolling with 2000+ tools

## 📦 Categories Include

| Category | Tools | Category | Tools |
|----------|-------|----------|-------|
| Reconnaissance | 54 | Domain / IP / DNS | 68 |
| Threat Intelligence | 49 | Search Engines | 65 |
| Images & Audio | 55 | Social Media | 24 |
| Email | 46 | Maps | 43 |
| Phone | 38 | Geolocation | 32 |
| Malware | 24 | Browser Extensions | 23 |
| Forensics & IR | 21 | OSINT Automation | 19 |
| ...and 80+ more | | | |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/your-username/osint-tools-discovery.git
cd osint-tools-discovery

# Serve locally (any static server works)
python -m http.server 8080 -d web

# Open in browser
# http://localhost:8080
```

No `npm install` needed. No build step. Just serve and go.

## 📁 Project Structure

```
web/
├── index.html      # Main page with sidebar + grid layout
├── style.css       # Premium dark theme, responsive styles
├── app.js          # Search, filtering, lazy loading, keyboard shortcuts
├── tools-data.js   # 1981 tools with name, description, link, category
└── build-data.js   # Script to rebuild tools-data.js from markdown
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search bar |
| `Esc` | Clear search & blur |

## 🎨 Themes

Toggle between **Dark Mode** 🌙 and **Light Mode** ☀️ using the button in the search bar. Your preference is saved to localStorage.

## 📊 Data Sources

Tools are curated from:
- [Awesome OSINT For Everything](https://github.com/Astrosp/Awesome-OSINT-For-Everything)
- [cipher387 OSINT Collection](https://github.com/cipher387/osint_stuff_tool_collection)
- [awesome-osint](https://github.com/jivoi/awesome-osint)
- OSINT Framework, TraceLabs, IntelTechniques, and community contributions

## 📄 License

This project is licensed under the [GPL-3.0 License](LICENSE).

---

<div align="center">
  <sub>Made with 🛡️ for the OSINT community</sub>
</div>
