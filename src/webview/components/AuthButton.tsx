import { h } from 'preact';
import { RegistryUser } from '../hooks/useRegistry';

interface AuthButtonProps {
    user: RegistryUser | null;
    onSignIn: () => void;
    onSignOut: () => void;
}

export function AuthButton({ user, onSignIn, onSignOut }: AuthButtonProps) {
    if (user) {
        return (
            <div class="flex items-center gap-2">
                <div
                    class="flex items-center gap-2 rounded-full px-1 pr-2"
                    style={{
                        background: 'color-mix(in srgb, var(--vscode-badge-background) 30%, transparent)',
                    }}
                >
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            class="rounded-full"
                            style={{
                                width: '24px',
                                height: '24px',
                                border: '2px solid color-mix(in srgb, var(--vscode-focusBorder) 40%, transparent)',
                            }}
                        />
                    ) : (
                        <div
                            class="rounded-full flex items-center justify-center"
                            style={{
                                width: '24px',
                                height: '24px',
                                background: 'var(--vscode-badge-background)',
                                color: 'var(--vscode-badge-foreground)',
                                fontSize: '11px',
                                fontWeight: 'bold',
                            }}
                        >
                            {(user.displayName || '?')[0].toUpperCase()}
                        </div>
                    )}
                    <span
                        class="text-xs truncate"
                        style={{ maxWidth: '90px', color: 'var(--vscode-foreground)' }}
                    >
                        {user.githubUsername || user.displayName}
                    </span>
                </div>
                <button
                    class="kodo-btn-ghost text-xs"
                    onClick={onSignOut}
                    style={{ fontSize: '10px', opacity: 0.5, padding: '2px 4px' }}
                >
                    Sign out
                </button>
            </div>
        );
    }

    return (
        <button class="kodo-auth-btn" onClick={onSignIn}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign in with GitHub
        </button>
    );
}
