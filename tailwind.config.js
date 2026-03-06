/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/webview/**/*.{html,ts,tsx,js,jsx}'],
    theme: {
        extend: {
            colors: {
                editor: 'var(--vscode-editor-background)',
                sidebar: 'var(--vscode-sideBar-background)',
                foreground: 'var(--vscode-editor-foreground)',
                muted: 'var(--vscode-descriptionForeground)',
                accent: 'var(--vscode-focusBorder)',
                'button-bg': 'var(--vscode-button-background)',
                'button-fg': 'var(--vscode-button-foreground)',
                'button-hover': 'var(--vscode-button-hoverBackground)',
                'input-bg': 'var(--vscode-input-background)',
                'input-fg': 'var(--vscode-input-foreground)',
                'input-border': 'var(--vscode-input-border)',
                'badge-bg': 'var(--vscode-badge-background)',
                'badge-fg': 'var(--vscode-badge-foreground)',
                'list-hover': 'var(--vscode-list-hoverBackground)',
                'list-active': 'var(--vscode-list-activeSelectionBackground)',
                'list-active-fg': 'var(--vscode-list-activeSelectionForeground)',
                'list-inactive': 'var(--vscode-list-inactiveSelectionBackground)',
                'panel-border': 'var(--vscode-panel-border)',
                'error': 'var(--vscode-errorForeground)',
                'link': 'var(--vscode-textLink-foreground)',
                'icon': 'var(--vscode-icon-foreground)',
            },
            fontFamily: {
                mono: 'var(--vscode-editor-font-family)',
            },
            fontSize: {
                'editor': 'var(--vscode-editor-font-size)',
            },
        },
    },
    plugins: [],
};
