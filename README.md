# KODO: Code Snippet Manager

> Save, organize, and instantly reuse code snippets right from your editor sidebar.

## Features

### Folder Organization
Create nested folders to keep your snippets organized by project, language, or category.

![Folder organization](media/folder_manager.png)

### Tag System
Add color-coded tags for cross-cutting categorization. Filter your snippet library by tag with one click. Delete tags you no longer need — if a tag is removed from all snippets, it auto-disappears.

![Tag system](media/tag_system.png)

### Instant Search
Search across snippet names, code content, descriptions, and languages — results update as you type.

### Syntax Highlighting
Code previews with language-aware syntax highlighting that adapts to your IDE theme.

### Drag & Drop
Drag snippets directly from the sidebar into your editor. Rearrange snippet order by dragging.

![Drag and drop snippets into your editor](media/drag-and-drop.gif)

### Insert at Cursor
One-click insertion with full **template variable** support — tab through placeholders to fill them in.

### Duplicate & Move Snippets
- **Duplicate** any snippet with one click — creates a copy in the same folder
- **Move to Folder** — move snippets between folders via the folder dropdown on each snippet card

### Right-Click Save
Select code in your editor → Right-click → **"Save to KODO"** — saves your selection instantly.

![Right-click save to KODO](media/right_click_save.png)

### Import / Export
Back up your entire snippet collection or share it with teammates as a `.json` file.

### Template Packs
Install curated collections of ready-to-use code snippets in one click. Ships with 5 built-in packs:
- **JavaScript Essentials** — Common JS patterns and utilities
- **React Patterns** — Components, hooks, and React idioms
- **CSS Utilities** — Layout, animations, and responsive helpers
- **Node.js Backend** — Express routes, middleware, and server patterns
- **TypeScript Snippets** — Type definitions, generics, and TS-specific patterns

### Community Pack Registry
Browse, install, and rate community-created template packs from the online registry. Sign in with GitHub to publish your own packs and rate others.

### Theme Aware
Automatically matches your IDE theme — dark, light, or high contrast. Selection highlights, syntax colors, and UI elements all adapt.

### Code Editor
Built-in code editor with:
- 4-space auto-indentation matching VS Code defaults
- Line numbers with pixel-perfect scroll sync
- Syntax highlighting while editing
- Smart bracket and quote auto-closing

![Code editor](media/code_editor.png)

---

## Quick Start

1. **Install** the `.vsix` file (Extensions panel → `⋯` → "Install from VSIX...")
2. **Open KODO** — click the KODO icon in the activity bar (left sidebar)
3. **Save a snippet** — select code in your editor → right-click → *Save to KODO*
4. **Insert a snippet** — click **Insert** on any snippet card, or drag it into your editor
5. **Organize** — create folders and tags to keep your collection tidy
6. **Browse Packs** — open Template Packs to install built-in or community snippet collections

---

## Template Variables

Use VS Code snippet syntax to create reusable templates with dynamic placeholders:

```javascript
function ${1:functionName}(${2:param}) {
    console.log('${1:functionName} called with:', ${2:param});
    return ${2:param};
}
```

**How it works:**
- `${1:functionName}` — first tab stop with default text "functionName"
- `${2:param}` — second tab stop with default text "param"
- **Same number = linked** — all `${1:...}` spots update together when you type

When you click **Insert**, the snippet engine activates:
1. Cursor highlights `functionName` → type your name → all instances update
2. Press **Tab** → cursor moves to `param` → type your param → all instances update
3. Press **Tab** → done!

### More Examples

**REST API Endpoint:**
```javascript
app.get('/api/${1:resource}/:${2:id}', async (req, res) => {
    const { ${2:id} } = req.params;
    const data = await ${3:Model}.findById(${2:id});
    res.json(data);
});
```

**React Component:**
```jsx
export function ${1:ComponentName}({ ${2:props} }) {
    return (
        <div className="${3:container}">
            <h1>${1:ComponentName}</h1>
            {${2:props}}
        </div>
    );
}
```

---

## Import & Export

### Export
Click the **↑** icon in the header (or Command Palette → *KODO: Export Snippets*) to save your entire collection as a `.json` file.

### Import
Click the **↓** icon in the header (or Command Palette → *KODO: Import Snippets*) to load snippets from a `.json` file. Imported snippets are **merged** with your existing collection — nothing gets overwritten.

---

## Commands

| Command | Description |
|---|---|
| `Save to KODO` | Save selected code as a snippet (right-click menu) |
| `KODO: Insert Snippet at Cursor` | Pick and insert a snippet via quick pick |
| `KODO: Export Snippets` | Export all snippets to JSON |
| `KODO: Import Snippets` | Import snippets from JSON |

---

## Compatibility

Works with **VS Code**, **Cursor**, and **Antigravity**.

---

## Credits

Created by **[EstarinAzx](https://github.com/EstarinAzx)**

---

## License

This project is licensed under the [MIT License](LICENSE).

**Enjoy KODO!**
