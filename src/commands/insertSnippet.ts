import * as vscode from 'vscode';
import { StorageService } from '../services/StorageService';
import { SnippetService } from '../services/SnippetService';

export function registerInsertSnippetCommand(
    context: vscode.ExtensionContext,
    storage: StorageService
): vscode.Disposable {
    return vscode.commands.registerCommand('kodo.insertSnippet', async (snippetId?: string, asPlainText?: boolean) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor to insert into.');
            return;
        }

        // If no snippet ID provided, show a quick pick
        if (!snippetId) {
            const snippets = storage.getSnippets();
            if (snippets.length === 0) {
                vscode.window.showInformationMessage('No snippets saved yet. Right-click selected code to save to KODO.');
                return;
            }
            const picked = await vscode.window.showQuickPick(
                snippets.map(s => ({
                    label: s.name,
                    description: s.language,
                    detail: s.code.substring(0, 80) + (s.code.length > 80 ? '…' : ''),
                    id: s.id,
                })),
                { placeHolder: 'Pick a snippet to insert' }
            );
            if (!picked) { return; }
            snippetId = picked.id;
        }

        const snippet = storage.getSnippetById(snippetId);
        if (!snippet) {
            vscode.window.showErrorMessage('Snippet not found.');
            return;
        }

        const useSnippetString = !asPlainText && SnippetService.hasTemplateVariables(snippet.code);

        if (useSnippetString) {
            await editor.insertSnippet(new vscode.SnippetString(snippet.code));
        } else {
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, snippet.code);
            });
        }
    });
}
