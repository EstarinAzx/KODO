# Changelog

All notable changes to KODO will be documented in this file.

## [0.3.5] — 2026-03-10

### Features
- **Tag Deletion** — Delete tags via the X button on tag pills; when a tag is removed from all snippets it auto-disappears from the filter bar
- **Snippet Duplicate** — Duplicate any snippet with one click (creates a copy in the same folder)
- **Move to Folder** — Move snippets between folders via the folder-arrow dropdown on each snippet card

### Improvements
- **Code Editor: 4-Space Indentation** — Tab key, auto-indent, and tab-size now use 4 spaces to match VS Code defaults
- **Code Editor: Line Number Scroll Sync** — Line numbers now scroll in perfect sync with code using CSS transform
- **Auth Button Redesign** — Larger 24px avatar in a pill-shaped container with fallback initials
- **Modal Panel Sizing** — Template Packs and Edit Snippet modals fill more vertical space
- **UI Consistency** — Fixed layout shift when switching between Built-in and Community tabs
- **Font Scaling** — Increased language filter and dropdown font sizes for readability
- **Emoji Removal** — Removed all non-essential emojis for a cleaner, professional look

---

## [0.3.0] — 2026-03-08

### Features
- **Community Pack Registry** — Browse, install, and rate community-created template packs from a Firebase-powered online registry
- **GitHub Authentication** — Sign in with GitHub via VS Code's built-in auth to publish and rate packs
- **Pack Publishing** — Publish your template packs to the community registry for others to install
- **Star Ratings** — Rate community packs with 1-5 stars
- **Uninstall Packs** — Uninstall both built-in and community packs with status tracking
- **Session Persistence** — Stay signed in across panel reopens

### Technical
- Firebase Firestore backend with security rules and Cloud Functions
- VS Code native GitHub OAuth integration

---

## [0.2.0] — 2026-03-07

### Features
- **Template Packs** — Curated collections of ready-to-use code snippets, installable in one click
- **5 Built-in Packs** — Ships with JavaScript Essentials, React Patterns, CSS Utilities, Node.js Backend, and TypeScript Snippets
- **Pack Browser** — Browse, install, and uninstall template packs from a dedicated panel
- **Community Pack Import** — Import third-party packs from `.json` files

---

## [0.1.0] — 2026-03-06

### Initial Release

#### Features
- **Code Snippet Management** — Save, edit, and delete code snippets
- **Folder Organization** — Nested folders with drag-to-reorder support
- **Color-Coded Tags** — Tag snippets for cross-cutting categorization
- **Tag Filtering** — Filter snippets by tag with one click
- **Instant Search** — Search across names, code, descriptions, and languages
- **Syntax Highlighting** — Language-aware code previews powered by Shiki
- **Built-in Code Editor** — Edit snippets with auto-indentation, line numbers, bracket auto-close, and scroll sync
- **Template Variables** — Use `${1:placeholder}` syntax for dynamic tab-stop insertion
- **Drag & Drop** — Drag snippets from sidebar into editor, or reorder within Kodo
- **Right-Click Save** — Select code → Right-click → "Save to KODO"
- **Insert at Cursor** — One-click insertion with snippet engine support
- **Import / Export** — Back up and share your entire collection as JSON
- **Theme Aware** — Adapts to dark, light, and high contrast themes
- **Cross-Editor Support** — Works in VS Code, Cursor, and Antigravity
