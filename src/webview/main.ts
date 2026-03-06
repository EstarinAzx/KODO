/**
 * KODO Webview — Client-side logic
 * Renders folder tree, snippet cards, search/filter UI, and handles drag-and-drop.
 * Communicates with the extension host via the VS Code postMessage API.
 */

// ─── Acquire VS Code API ───
declare function acquireVsCodeApi(): {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

// ─── Types (mirrored subset) ───
interface Snippet {
    id: string;
    name: string;
    code: string;
    language: string;
    folderId: string;
    tags: string[];
    description: string;
    createdAt: number;
    updatedAt: number;
}

interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    sortOrder: number;
}

interface Tag {
    id: string;
    name: string;
    color: string;
}

interface KodoData {
    version: number;
    snippets: Snippet[];
    folders: Folder[];
    tags: Tag[];
}

// ─── State ───
let state: KodoData = { version: 1, snippets: [], folders: [], tags: [] };
let activeFolderId: string | null = null;
let activeTagId: string | null = null;
let searchQuery = '';
let editingSnippetId: string | null = null;
let expandedFolders: Set<string> = new Set();

// ─── SVG Icons ───
const ICONS = {
    folder: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 2A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5V5a1.5 1.5 0 00-1.5-1.5H7.707L6.354 2.146A.5.5 0 006 2H1.5z"/></svg>`,
    folderOpen: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 012.5 2H6a.5.5 0 01.354.146L7.707 3.5H14.5A1.5 1.5 0 0116 5v.382l-1.723 7.756A1.5 1.5 0 0112.809 14H1.5A1.5 1.5 0 010 12.5v-9A1.5 1.5 0 011 3.5zM2.5 3a.5.5 0 00-.5.5V6h13V5a.5.5 0 00-.5-.5H7.5a.5.5 0 01-.354-.146L5.793 3H2.5z"/></svg>`,
    chevronRight: `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z"/></svg>`,
    chevronDown: `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z"/></svg>`,
    plus: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z"/></svg>`,
    trash: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H5.5a1 1 0 011-1h3a1 1 0 011 1h2.5a1 1 0 011 1v1zM4 4v9a1 1 0 001 1h6a1 1 0 001-1V4H4zM5 2h6v1H5V2z"/></svg>`,
    edit: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.5-6.5z"/></svg>`,
    search: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z"/></svg>`,
    copy: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5H3a2 2 0 00-2 2V14a2 2 0 002 2h10a2 2 0 002-2V3.5a2 2 0 00-2-2h-1v1h1a1 1 0 011 1V14a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h1v-1z"/><path d="M9.5 1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3zm-3-1A1.5 1.5 0 005 1.5v1A1.5 1.5 0 006.5 4h3A1.5 1.5 0 0011 2.5v-1A1.5 1.5 0 009.5 0h-3z"/></svg>`,
    cursor: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14.082 2.182a.5.5 0 01.103.557L8.528 15.467a.5.5 0 01-.917-.007L5.57 10.694.803 8.652a.5.5 0 01-.006-.916l12.728-5.657a.5.5 0 01.557.103z"/></svg>`,
    tag: `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1a1 1 0 00-1 1v4.586a1 1 0 00.293.707l7 7a1 1 0 001.414 0l4.586-4.586a1 1 0 000-1.414l-7-7A1 1 0 006.586 1H2zm4 3.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg>`,
    snippet: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M10.478 1.647a.5.5 0 10-.956-.294l-4 13a.5.5 0 00.956.294l4-13zM4.854 4.146a.5.5 0 010 .708L1.707 8l3.147 3.146a.5.5 0 01-.708.708l-3.5-3.5a.5.5 0 010-.708l3.5-3.5a.5.5 0 01.708 0zm6.292 0a.5.5 0 000 .708L14.293 8l-3.147 3.146a.5.5 0 00.708.708l3.5-3.5a.5.5 0 000-.708l-3.5-3.5a.5.5 0 00-.708 0z"/></svg>`,
};

// ─── Initialize ───
function init() {
    vscode.postMessage({ type: 'ready' });
}

// ─── Message Handler ───
window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'init' || message.type === 'update') {
        state = message.data;
        // Auto-expand default folder
        if (!expandedFolders.size) {
            expandedFolders.add('default');
        }
        render();
    }
});

// ─── Main Render ───
function render() {
    const app = document.getElementById('app');
    if (!app) { return; }

    app.innerHTML = '';

    // Header
    app.appendChild(createHeader());
    // Search bar
    app.appendChild(createSearchBar());
    // Tag filter bar
    if (state.tags.length > 0) {
        app.appendChild(createTagFilterBar());
    }
    // Divider
    const div = document.createElement('div');
    div.className = 'kodo-divider';
    app.appendChild(div);
    // Folder tree + snippet list
    app.appendChild(createMainContent());
}

// ─── Header ───
function createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-3 py-2';

    const title = document.createElement('div');
    title.className = 'flex items-center gap-2 text-sm font-bold uppercase tracking-widest';
    title.innerHTML = `${ICONS.snippet} KODO`;
    title.style.color = 'var(--vscode-editor-foreground)';

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-1';

    // Add snippet button
    const addBtn = createIconButton(ICONS.plus, 'New snippet', () => openSnippetEditor());
    actions.appendChild(addBtn);

    // Add folder button
    const addFolderBtn = createIconButton(ICONS.folder, 'New folder', () => promptNewFolder());
    actions.appendChild(addFolderBtn);

    header.appendChild(title);
    header.appendChild(actions);
    return header;
}

// ─── Search Bar ───
function createSearchBar(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'px-3 pb-2 relative';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none';
    iconSpan.style.color = 'var(--vscode-descriptionForeground)';
    iconSpan.innerHTML = ICONS.search;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'kodo-input pl-7';
    input.placeholder = 'Search snippets…';
    input.value = searchQuery;
    input.addEventListener('input', (e) => {
        searchQuery = (e.target as HTMLInputElement).value;
        render();
    });

    wrapper.appendChild(iconSpan);
    wrapper.appendChild(input);
    return wrapper;
}

// ─── Tag Filter Bar ───
function createTagFilterBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'px-3 pb-1 flex flex-wrap gap-1';

    // "All" pill
    const allPill = document.createElement('button');
    allPill.className = `kodo-tag-pill ${!activeTagId ? 'active' : ''}`;
    allPill.textContent = 'All';
    allPill.style.background = 'var(--vscode-badge-background)';
    allPill.style.color = 'var(--vscode-badge-foreground)';
    allPill.addEventListener('click', () => {
        activeTagId = null;
        render();
    });
    bar.appendChild(allPill);

    for (const tag of state.tags) {
        const pill = document.createElement('button');
        pill.className = `kodo-tag-pill ${activeTagId === tag.id ? 'active' : ''}`;
        pill.style.background = tag.color;
        pill.style.color = '#fff';
        pill.textContent = tag.name;
        pill.addEventListener('click', () => {
            activeTagId = activeTagId === tag.id ? null : tag.id;
            render();
        });
        bar.appendChild(pill);
    }

    return bar;
}

// ─── Main Content (Folder Tree + Snippets) ───
function createMainContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex flex-col gap-0';

    // Folder tree section
    const folderSection = document.createElement('div');
    folderSection.className = 'mb-1';

    const folderHeader = document.createElement('div');
    folderHeader.className = 'kodo-section-header';
    folderHeader.innerHTML = '<span>Folders</span>';
    folderSection.appendChild(folderHeader);

    // Render root folders
    const rootFolders = state.folders
        .filter(f => f.parentId === null)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    for (const folder of rootFolders) {
        folderSection.appendChild(createFolderItem(folder, 0));
    }

    container.appendChild(folderSection);

    // Snippets section
    const snippetSection = document.createElement('div');
    snippetSection.className = 'px-2';

    const snippetHeader = document.createElement('div');
    snippetHeader.className = 'kodo-section-header mb-1';

    let filtered = getFilteredSnippets();
    snippetHeader.innerHTML = `<span>Snippets (${filtered.length})</span>`;
    snippetSection.appendChild(snippetHeader);

    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'kodo-empty';
        empty.innerHTML = `
      <div class="text-2xl mb-2">${ICONS.snippet}</div>
      <div class="text-sm mb-1">No snippets yet</div>
      <div class="text-xs" style="color:var(--vscode-descriptionForeground)">
        Right-click selected code → "Save to KODO"<br>
        or click ${ICONS.plus} above
      </div>
    `;
        snippetSection.appendChild(empty);
    } else {
        for (const snippet of filtered) {
            snippetSection.appendChild(createSnippetCard(snippet));
        }
    }

    container.appendChild(snippetSection);
    return container;
}

// ─── Folder Tree Item ───
function createFolderItem(folder: Folder, depth: number): HTMLElement {
    const wrapper = document.createElement('div');

    const row = document.createElement('div');
    row.className = `kodo-folder ${activeFolderId === folder.id ? 'active' : ''}`;
    row.style.paddingLeft = `${8 + depth * 16}px`;

    const isExpanded = expandedFolders.has(folder.id);
    const childFolders = state.folders.filter(f => f.parentId === folder.id);
    const hasChildren = childFolders.length > 0;

    // Chevron
    const chevron = document.createElement('span');
    chevron.className = 'flex-shrink-0 transition-transform duration-150';
    chevron.style.width = '12px';
    if (hasChildren) {
        chevron.innerHTML = isExpanded ? ICONS.chevronDown : ICONS.chevronRight;
        chevron.style.cursor = 'pointer';
        chevron.addEventListener('click', (e) => {
            e.stopPropagation();
            if (expandedFolders.has(folder.id)) {
                expandedFolders.delete(folder.id);
            } else {
                expandedFolders.add(folder.id);
            }
            render();
        });
    }

    // Folder icon
    const icon = document.createElement('span');
    icon.className = 'flex-shrink-0';
    icon.innerHTML = isExpanded ? ICONS.folderOpen : ICONS.folder;

    // Name
    const name = document.createElement('span');
    name.className = 'truncate flex-1 text-sm';
    name.textContent = folder.name;

    // Count
    const snippetCount = state.snippets.filter(s => s.folderId === folder.id).length;
    const count = document.createElement('span');
    count.className = 'text-xs flex-shrink-0';
    count.style.color = 'var(--vscode-descriptionForeground)';
    count.textContent = snippetCount.toString();

    // Delete button (not for default folder)
    const actions = document.createElement('span');
    actions.className = 'flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity';
    if (folder.id !== 'default') {
        const delBtn = createIconButton(ICONS.trash, 'Delete folder', (e) => {
            e.stopPropagation();
            vscode.postMessage({ type: 'deleteFolder', folderId: folder.id });
        });
        delBtn.style.display = 'none';
        row.addEventListener('mouseenter', () => { delBtn.style.display = 'inline-flex'; });
        row.addEventListener('mouseleave', () => { delBtn.style.display = 'none'; });
        actions.appendChild(delBtn);
    }

    row.appendChild(chevron);
    row.appendChild(icon);
    row.appendChild(name);
    row.appendChild(count);
    row.appendChild(actions);

    row.addEventListener('click', () => {
        activeFolderId = activeFolderId === folder.id ? null : folder.id;
        if (!expandedFolders.has(folder.id)) {
            expandedFolders.add(folder.id);
        }
        render();
    });

    wrapper.appendChild(row);

    // Children
    if (isExpanded && hasChildren) {
        for (const child of childFolders.sort((a, b) => a.sortOrder - b.sortOrder)) {
            wrapper.appendChild(createFolderItem(child, depth + 1));
        }
    }

    return wrapper;
}

// ─── Snippet Card ───
function createSnippetCard(snippet: Snippet): HTMLElement {
    const card = document.createElement('div');
    card.className = 'kodo-card';
    card.draggable = true;
    card.dataset.snippetId = snippet.id;

    // Drag events
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer?.setData('text/plain', snippet.code);
        e.dataTransfer?.setData('application/kodo-snippet-id', snippet.id);
    });
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    // Header row: name + language badge
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-1';

    const nameEl = document.createElement('div');
    nameEl.className = 'font-medium text-sm truncate flex-1';
    nameEl.textContent = snippet.name;

    const langBadge = document.createElement('span');
    langBadge.className = 'kodo-badge text-xs ml-2';
    langBadge.textContent = snippet.language;

    header.appendChild(nameEl);
    header.appendChild(langBadge);
    card.appendChild(header);

    // Description
    if (snippet.description) {
        const desc = document.createElement('div');
        desc.className = 'text-xs mb-2 truncate';
        desc.style.color = 'var(--vscode-descriptionForeground)';
        desc.textContent = snippet.description;
        card.appendChild(desc);
    }

    // Tags
    if (snippet.tags.length > 0) {
        const tagRow = document.createElement('div');
        tagRow.className = 'flex flex-wrap gap-1 mb-2';
        for (const tagId of snippet.tags) {
            const tag = state.tags.find(t => t.id === tagId);
            if (tag) {
                const pill = document.createElement('span');
                pill.className = 'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-xs';
                pill.style.background = tag.color;
                pill.style.color = '#fff';
                pill.style.fontSize = '10px';
                pill.innerHTML = `${ICONS.tag} ${tag.name}`;
                tagRow.appendChild(pill);
            }
        }
        card.appendChild(tagRow);
    }

    // Code preview
    const codeBlock = document.createElement('div');
    codeBlock.className = 'kodo-code-block';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = snippet.code;
    pre.appendChild(code);
    codeBlock.appendChild(pre);
    card.appendChild(codeBlock);

    // Action buttons
    const actionBar = document.createElement('div');
    actionBar.className = 'flex items-center gap-1 mt-2 pt-2';
    actionBar.style.borderTop = '1px solid var(--vscode-panel-border, rgba(128,128,128,0.15))';

    // Insert at cursor
    const insertBtn = document.createElement('button');
    insertBtn.className = 'kodo-btn text-xs flex-1';
    insertBtn.innerHTML = `${ICONS.cursor} Insert`;
    insertBtn.title = 'Insert at cursor';
    insertBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'insertSnippet', snippetId: snippet.id, asPlainText: false });
    });

    // Insert as plain text
    const plainBtn = document.createElement('button');
    plainBtn.className = 'kodo-btn-secondary text-xs';
    plainBtn.innerHTML = `${ICONS.copy} Plain`;
    plainBtn.title = 'Insert as plain text (no template variables)';
    plainBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'insertSnippet', snippetId: snippet.id, asPlainText: true });
    });

    // Edit
    const editBtn = createIconButton(ICONS.edit, 'Edit snippet', (e) => {
        e.stopPropagation();
        openSnippetEditor(snippet);
    });

    // Delete
    const deleteBtn = createIconButton(ICONS.trash, 'Delete snippet', (e) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'deleteSnippet', snippetId: snippet.id });
    });

    actionBar.appendChild(insertBtn);
    actionBar.appendChild(plainBtn);
    actionBar.appendChild(editBtn);
    actionBar.appendChild(deleteBtn);
    card.appendChild(actionBar);

    return card;
}

// ─── Snippet Editor Modal ───
function openSnippetEditor(existing?: Snippet) {
    const overlay = document.createElement('div');
    overlay.className = 'kodo-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'kodo-modal';

    const titleEl = document.createElement('h3');
    titleEl.className = 'text-sm font-bold mb-3';
    titleEl.textContent = existing ? 'Edit Snippet' : 'New Snippet';
    modal.appendChild(titleEl);

    // Name
    const nameInput = createField('Name', existing?.name ?? '');
    modal.appendChild(nameInput.wrapper);

    // Language
    const langInput = createField('Language', existing?.language ?? 'plaintext');
    modal.appendChild(langInput.wrapper);

    // Description
    const descInput = createField('Description', existing?.description ?? '');
    modal.appendChild(descInput.wrapper);

    // Folder select
    const folderSelect = document.createElement('div');
    folderSelect.className = 'mb-3';
    const folderLabel = document.createElement('label');
    folderLabel.className = 'block text-xs mb-1';
    folderLabel.style.color = 'var(--vscode-descriptionForeground)';
    folderLabel.textContent = 'Folder';
    const select = document.createElement('select');
    select.className = 'kodo-input';
    for (const f of state.folders) {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        if (existing && existing.folderId === f.id) { opt.selected = true; }
        select.appendChild(opt);
    }
    folderSelect.appendChild(folderLabel);
    folderSelect.appendChild(select);
    modal.appendChild(folderSelect);

    // Tags
    const tagsInput = createField('Tags (comma-separated)',
        existing ? existing.tags.map(id => state.tags.find(t => t.id === id)?.name ?? '').filter(Boolean).join(', ') : ''
    );
    modal.appendChild(tagsInput.wrapper);

    // Code
    const codeWrapper = document.createElement('div');
    codeWrapper.className = 'mb-3';
    const codeLabel = document.createElement('label');
    codeLabel.className = 'block text-xs mb-1';
    codeLabel.style.color = 'var(--vscode-descriptionForeground)';
    codeLabel.textContent = 'Code';
    const codeArea = document.createElement('textarea');
    codeArea.className = 'kodo-input';
    codeArea.style.fontFamily = 'var(--vscode-editor-font-family)';
    codeArea.style.minHeight = '100px';
    codeArea.style.resize = 'vertical';
    codeArea.value = existing?.code ?? '';
    codeWrapper.appendChild(codeLabel);
    codeWrapper.appendChild(codeArea);
    modal.appendChild(codeWrapper);

    // Template variable hint
    const hint = document.createElement('div');
    hint.className = 'text-xs mb-3 px-2 py-1 rounded';
    hint.style.background = 'var(--vscode-editorHoverWidget-background, rgba(255,255,255,0.05))';
    hint.style.color = 'var(--vscode-descriptionForeground)';
    hint.innerHTML = `💡 <strong>Template variables:</strong> Use <code>\${1:placeholder}</code> for tab stops. Example: <code>const \${1:name} = \${2:value};</code>`;
    modal.appendChild(hint);

    // Buttons
    const btnRow = document.createElement('div');
    btnRow.className = 'flex gap-2 justify-end';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'kodo-btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => overlay.remove());

    const saveBtn = document.createElement('button');
    saveBtn.className = 'kodo-btn';
    saveBtn.textContent = existing ? 'Update' : 'Save';
    saveBtn.addEventListener('click', () => {
        const nameVal = nameInput.input.value.trim();
        const codeVal = codeArea.value;
        if (!nameVal || !codeVal) { return; }

        const tagNames = tagsInput.input.value.split(',').map(t => t.trim()).filter(Boolean);
        const tagIds: string[] = tagNames.map(name => {
            const existing = state.tags.find(t => t.name.toLowerCase() === name.toLowerCase());
            if (existing) { return existing.id; }
            // Request new tag creation - will be resolved on next render
            const tempId = 'pending_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
            vscode.postMessage({ type: 'createTag', tag: { name, color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)` } });
            return tempId;
        });

        if (existing) {
            vscode.postMessage({
                type: 'updateSnippet',
                snippet: {
                    ...existing,
                    name: nameVal,
                    code: codeVal,
                    language: langInput.input.value.trim() || 'plaintext',
                    description: descInput.input.value.trim(),
                    folderId: select.value,
                    tags: tagIds.filter(id => !id.startsWith('pending_')),
                }
            });
        } else {
            vscode.postMessage({
                type: 'saveSnippet',
                snippet: {
                    name: nameVal,
                    code: codeVal,
                    language: langInput.input.value.trim() || 'plaintext',
                    description: descInput.input.value.trim(),
                    folderId: select.value,
                    tags: tagIds.filter(id => !id.startsWith('pending_')),
                }
            });
        }

        overlay.remove();
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    modal.appendChild(btnRow);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { overlay.remove(); }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Focus name input
    nameInput.input.focus();
}

// ─── Prompt New Folder ───
function promptNewFolder() {
    const overlay = document.createElement('div');
    overlay.className = 'kodo-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'kodo-modal';

    const title = document.createElement('h3');
    title.className = 'text-sm font-bold mb-3';
    title.textContent = 'New Folder';
    modal.appendChild(title);

    const nameField = createField('Folder name', '');
    modal.appendChild(nameField.wrapper);

    // Parent folder select
    const parentWrapper = document.createElement('div');
    parentWrapper.className = 'mb-3';
    const parentLabel = document.createElement('label');
    parentLabel.className = 'block text-xs mb-1';
    parentLabel.style.color = 'var(--vscode-descriptionForeground)';
    parentLabel.textContent = 'Parent folder (optional)';
    const parentSelect = document.createElement('select');
    parentSelect.className = 'kodo-input';
    const noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = '— Root level —';
    parentSelect.appendChild(noneOpt);
    for (const f of state.folders) {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        parentSelect.appendChild(opt);
    }
    parentWrapper.appendChild(parentLabel);
    parentWrapper.appendChild(parentSelect);
    modal.appendChild(parentWrapper);

    const btnRow = document.createElement('div');
    btnRow.className = 'flex gap-2 justify-end';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'kodo-btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => overlay.remove());

    const createBtn = document.createElement('button');
    createBtn.className = 'kodo-btn';
    createBtn.textContent = 'Create';
    createBtn.addEventListener('click', () => {
        const name = nameField.input.value.trim();
        if (!name) { return; }
        vscode.postMessage({
            type: 'createFolder',
            folder: {
                name,
                parentId: parentSelect.value || null,
                sortOrder: state.folders.length,
            }
        });
        overlay.remove();
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(createBtn);
    modal.appendChild(btnRow);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { overlay.remove(); }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    nameField.input.focus();
}

// ─── Helpers ───

function getFilteredSnippets(): Snippet[] {
    let snippets = state.snippets;

    // Filter by folder
    if (activeFolderId) {
        snippets = snippets.filter(s => s.folderId === activeFolderId);
    }

    // Filter by tag
    if (activeTagId) {
        snippets = snippets.filter(s => s.tags.includes(activeTagId!));
    }

    // Search
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        snippets = snippets.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.language.toLowerCase().includes(q)
        );
    }

    // Sort by most recently updated
    return snippets.sort((a, b) => b.updatedAt - a.updatedAt);
}

function createIconButton(icon: string, tooltip: string, onClick: (e: MouseEvent) => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'kodo-btn-ghost';
    btn.innerHTML = icon;
    btn.title = tooltip;
    btn.addEventListener('click', onClick);
    return btn;
}

function createField(label: string, value: string): { wrapper: HTMLElement; input: HTMLInputElement } {
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-3';

    const labelEl = document.createElement('label');
    labelEl.className = 'block text-xs mb-1';
    labelEl.style.color = 'var(--vscode-descriptionForeground)';
    labelEl.textContent = label;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'kodo-input';
    input.value = value;

    wrapper.appendChild(labelEl);
    wrapper.appendChild(input);
    return { wrapper, input };
}

// ─── Boot ───
init();
