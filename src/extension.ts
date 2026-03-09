import * as vscode from 'vscode';
import { KodoSidebarProvider } from './providers/KodoSidebarProvider';
import { StorageService } from './services/StorageService';
import { FirebaseService } from './services/FirebaseService';
import { SnippetService } from './services/SnippetService';
import { registerSaveSnippetCommand } from './commands/saveSnippet';
import { registerInsertSnippetCommand } from './commands/insertSnippet';

export function activate(context: vscode.ExtensionContext) {
    const storage = new StorageService(context);
    const firebase = new FirebaseService(context);

    // ─── Sidebar Provider ───
    const sidebarProvider = new KodoSidebarProvider(context.extensionUri, storage, firebase);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(KodoSidebarProvider.viewType, sidebarProvider)
    );

    // ─── Commands ───
    context.subscriptions.push(
        registerSaveSnippetCommand(context, storage, () => sidebarProvider.sendDataToWebview())
    );

    context.subscriptions.push(
        registerInsertSnippetCommand(context, storage)
    );

    // ─── Export ───
    context.subscriptions.push(
        vscode.commands.registerCommand('kodo.exportSnippets', async () => {
            const data = storage.exportData();
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('kodo-snippets.json'),
                filters: { 'KODO Snippets': ['json'] },
            });
            if (uri) {
                const content = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
                await vscode.workspace.fs.writeFile(uri, content);
                vscode.window.showInformationMessage(`Exported ${data.snippets.length} snippets.`);
            }
        })
    );

    // ─── Import ───
    context.subscriptions.push(
        vscode.commands.registerCommand('kodo.importSnippets', async () => {
            const uris = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'KODO Snippets': ['json'] },
            });
            if (!uris || uris.length === 0) { return; }

            try {
                const raw = await vscode.workspace.fs.readFile(uris[0]);
                const parsed = JSON.parse(Buffer.from(raw).toString('utf-8'));

                if (!SnippetService.validateImport(parsed)) {
                    vscode.window.showErrorMessage('Invalid KODO export file.');
                    return;
                }

                const strategy = await vscode.window.showQuickPick(
                    [
                        { label: 'Merge', description: 'Add new snippets without overwriting existing', id: 'merge' as const },
                        { label: 'Replace', description: 'Replace all current data with imported data', id: 'replace' as const },
                    ],
                    { placeHolder: 'How should we handle the import?' }
                );
                if (!strategy) { return; }

                await storage.importData(parsed, strategy.id);
                sidebarProvider.sendDataToWebview();
                vscode.window.showInformationMessage(`Imported snippets (${strategy.label}).`);
            } catch (err) {
                vscode.window.showErrorMessage(`Import failed: ${err}`);
            }
        })
    );
}

export function deactivate() { }
