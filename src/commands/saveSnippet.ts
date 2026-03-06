import * as vscode from 'vscode';
import { StorageService } from '../services/StorageService';

export function registerSaveSnippetCommand(
    context: vscode.ExtensionContext,
    storage: StorageService,
    onDataChanged: () => void
): vscode.Disposable {
    return vscode.commands.registerCommand('kodo.saveSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor — select some code first.');
            return;
        }

        const selection = editor.selection;
        const code = editor.document.getText(selection);
        if (!code.trim()) {
            vscode.window.showWarningMessage('No text selected — highlight code to save to KODO.');
            return;
        }

        const language = editor.document.languageId;

        // 1. Snippet name
        const name = await vscode.window.showInputBox({
            prompt: 'Snippet name',
            placeHolder: 'e.g. Fetch helper, React useState',
            validateInput: (v) => v.trim() ? null : 'Name cannot be empty',
        });
        if (!name) { return; }

        // 2. Pick folder
        const folders = storage.getFolders();
        const folderItems = folders.map(f => ({
            label: f.name,
            id: f.id,
        }));
        folderItems.push({ label: '$(add) Create new folder…', id: '__new__' });

        const pickedFolder = await vscode.window.showQuickPick(folderItems, {
            placeHolder: 'Select a folder',
        });
        if (!pickedFolder) { return; }

        let folderId = pickedFolder.id;
        if (folderId === '__new__') {
            const folderName = await vscode.window.showInputBox({
                prompt: 'New folder name',
                validateInput: (v) => v.trim() ? null : 'Name cannot be empty',
            });
            if (!folderName) { return; }
            const newFolder = await storage.createFolder({
                name: folderName,
                parentId: null,
                sortOrder: folders.length,
            });
            folderId = newFolder.id;
        }

        // 3. Tags
        const tagsInput = await vscode.window.showInputBox({
            prompt: 'Tags (comma-separated, optional)',
            placeHolder: 'e.g. utility, react, api',
        });
        const tagNames = tagsInput
            ? tagsInput.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        // Resolve or create tags
        const existingTags = storage.getTags();
        const tagIds: string[] = [];
        for (const tagName of tagNames) {
            let existing = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
            if (!existing) {
                existing = await storage.createTag({ name: tagName, color: getRandomTagColor() });
            }
            tagIds.push(existing.id);
        }

        // 4. Optional description
        const description = await vscode.window.showInputBox({
            prompt: 'Description (optional)',
            placeHolder: 'What does this snippet do?',
        }) ?? '';

        // 5. Save
        await storage.saveSnippet({
            name,
            code,
            language,
            folderId,
            tags: tagIds,
            description,
        });

        vscode.window.showInformationMessage(`Saved "${name}" to KODO!`);
        onDataChanged();
    });
}

function getRandomTagColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
}
