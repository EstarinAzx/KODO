import * as vscode from 'vscode';
import { RegistryPack, RegistryUser, PackManifest } from '../models/types';

// ─── Firebase is loaded dynamically to avoid bundling in extension host ───
// The extension host runs in Node.js, so we use dynamic imports for Firebase.

let firebaseApp: any = null;
let firestoreDb: any = null;
let firebaseAuth: any = null;

// Firebase config — read from extension settings or environment
interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

const CACHE_KEY = 'kodo.registryCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export class FirebaseService {
    private config: FirebaseConfig;
    private context: vscode.ExtensionContext;
    private initialized = false;
    private currentUser: RegistryUser | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = {
            apiKey: process.env.KODO_FIREBASE_API_KEY || '',
            authDomain: process.env.KODO_FIREBASE_AUTH_DOMAIN || '',
            projectId: process.env.KODO_FIREBASE_PROJECT_ID || '',
            storageBucket: process.env.KODO_FIREBASE_STORAGE_BUCKET || '',
            messagingSenderId: process.env.KODO_FIREBASE_MESSAGING_SENDER_ID || '',
            appId: process.env.KODO_FIREBASE_APP_ID || '',
        };
    }

    isConfigured(): boolean {
        return this.config.apiKey.length > 0 && this.config.projectId.length > 0;
    }

    private async init(): Promise<boolean> {
        if (this.initialized) return true;
        if (!this.isConfigured()) return false;

        try {
            const firebase = await import('firebase/app');
            const { getFirestore } = await import('firebase/firestore');
            const { getAuth } = await import('firebase/auth');

            firebaseApp = firebase.initializeApp(this.config);
            firestoreDb = getFirestore(firebaseApp);
            firebaseAuth = getAuth(firebaseApp);
            this.initialized = true;
            return true;
        } catch (err) {
            console.error('[KODO] Firebase init failed:', err);
            return false;
        }
    }

    // ─── Auth ───

    async signInWithGitHub(): Promise<RegistryUser | null> {
        if (!await this.init()) return null;

        try {
            // Use VS Code's built-in GitHub authentication provider
            const session = await vscode.authentication.getSession('github', ['read:user'], {
                createIfNone: true,
            });

            if (!session) return null;

            const githubToken = session.accessToken;

            // Call our Cloud Function to exchange the GitHub token for a Firebase custom token
            const { httpsCallable } = await import('firebase/functions');
            const { getFunctions } = await import('firebase/functions');
            const functions = getFunctions(firebaseApp);
            const githubAuthFn = httpsCallable(functions, 'githubAuth');

            const result: any = await githubAuthFn({ githubToken });
            const { customToken, user: ghUser } = result.data;

            // Sign in with the custom token
            const { signInWithCustomToken } = await import('firebase/auth');
            await signInWithCustomToken(firebaseAuth, customToken);

            this.currentUser = {
                id: ghUser.id,
                githubUsername: ghUser.githubUsername,
                displayName: ghUser.displayName,
                avatarUrl: ghUser.avatarUrl,
                publishedPackCount: 0,
            };

            // Store the GitHub token for session persistence
            await this.context.secrets.store('kodo.githubToken', githubToken);

            return this.currentUser;
        } catch (err) {
            console.error('[KODO] GitHub sign-in failed:', err);
            vscode.window.showErrorMessage(
                `Sign-in failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
            return null;
        }
    }

    async signOut(): Promise<void> {
        if (!this.initialized || !firebaseAuth) return;

        try {
            const { signOut: fbSignOut } = await import('firebase/auth');
            await fbSignOut(firebaseAuth);
            this.currentUser = null;
            await this.context.secrets.delete('kodo.githubToken');
        } catch (err) {
            console.error('[KODO] Sign-out failed:', err);
        }
    }

    getCurrentUser(): RegistryUser | null {
        return this.currentUser;
    }

    async restoreSession(): Promise<RegistryUser | null> {
        if (!await this.init()) return null;

        try {
            const token = await this.context.secrets.get('kodo.githubToken');
            if (!token) return null;

            // Re-exchange the stored GitHub token via Cloud Function
            const { httpsCallable, getFunctions } = await import('firebase/functions');
            const functions = getFunctions(firebaseApp);
            const githubAuthFn = httpsCallable(functions, 'githubAuth');

            const result: any = await githubAuthFn({ githubToken: token });
            const { customToken, user: ghUser } = result.data;

            const { signInWithCustomToken } = await import('firebase/auth');
            await signInWithCustomToken(firebaseAuth, customToken);

            this.currentUser = {
                id: ghUser.id,
                githubUsername: ghUser.githubUsername,
                displayName: ghUser.displayName,
                avatarUrl: ghUser.avatarUrl,
                publishedPackCount: 0,
            };

            return this.currentUser;
        } catch {
            // Token expired or invalid — clear it
            await this.context.secrets.delete('kodo.githubToken');
            return null;
        }
    }

    // ─── Pack Queries ───

    async fetchPacks(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        language?: string;
        search?: string;
    }): Promise<{ packs: RegistryPack[]; hasMore: boolean }> {
        // Try cache first
        const cached = this.getCachedPacks();
        if (cached && !options.page && !options.search && !options.language) {
            return { packs: cached, hasMore: false };
        }

        if (!await this.init()) {
            return { packs: [], hasMore: false };
        }

        try {
            const {
                collection, query, where, orderBy, limit, startAfter, getDocs
            } = await import('firebase/firestore');

            const page = options.page || 0;
            const pageSize = options.limit || 20;
            const sort = options.sortBy || 'downloads';

            // Build query constraints
            const constraints: any[] = [
                where('status', '==', 'approved'),
            ];

            if (options.language) {
                constraints.push(where('language', '==', options.language));
            }

            // Sort
            const sortField = sort === 'rating' ? 'rating'
                : sort === 'newest' ? 'createdAt'
                    : 'downloads';
            constraints.push(orderBy(sortField, 'desc'));
            constraints.push(limit(pageSize + 1)); // +1 to check hasMore

            const q = query(collection(firestoreDb, 'packs'), ...constraints);
            const snapshot = await getDocs(q);

            const packs: RegistryPack[] = [];
            snapshot.forEach((doc: any) => {
                packs.push({ id: doc.id, ...doc.data() } as RegistryPack);
            });

            const hasMore = packs.length > pageSize;
            if (hasMore) packs.pop();

            // Client-side search filter (Firestore doesn't support full-text search)
            let filtered = packs;
            if (options.search) {
                const q = options.search.toLowerCase();
                filtered = packs.filter(p =>
                    p.name.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.author.toLowerCase().includes(q)
                );
            }

            // Cache if first page with no filters
            if (!options.page && !options.search && !options.language) {
                this.setCachedPacks(filtered);
            }

            return { packs: filtered, hasMore };
        } catch (err) {
            console.error('[KODO] Fetch packs failed:', err);
            // Fall back to cache
            const fallback = this.getCachedPacks();
            return { packs: fallback || [], hasMore: false };
        }
    }

    // ─── Pack Install (download from URL) ───

    async downloadPackFile(fileUrl: string): Promise<PackManifest | null> {
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data as PackManifest;
        } catch (err) {
            console.error('[KODO] Download pack failed:', err);
            return null;
        }
    }

    async incrementDownloadCount(packId: string): Promise<void> {
        if (!await this.init()) return;

        try {
            const { doc, updateDoc, increment } = await import('firebase/firestore');
            const packRef = doc(firestoreDb, 'packs', packId);
            await updateDoc(packRef, { downloads: increment(1) });
        } catch (err) {
            console.error('[KODO] Increment downloads failed:', err);
        }
    }

    // ─── Ratings ───

    async ratePack(packId: string, stars: number): Promise<void> {
        if (!await this.init() || !this.currentUser) return;

        try {
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

            const ratingRef = doc(firestoreDb, 'packs', packId, 'ratings', this.currentUser.id);
            await setDoc(ratingRef, {
                packId,
                userId: this.currentUser.id,
                stars: Math.max(1, Math.min(5, stars)),
                createdAt: serverTimestamp(),
            });
        } catch (err) {
            console.error('[KODO] Rate pack failed:', err);
        }
    }

    async getUserRating(packId: string): Promise<number | null> {
        if (!await this.init() || !this.currentUser) return null;

        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const ratingRef = doc(firestoreDb, 'packs', packId, 'ratings', this.currentUser.id);
            const snap = await getDoc(ratingRef);
            return snap.exists() ? snap.data().stars : null;
        } catch {
            return null;
        }
    }

    // ─── Publishing ───

    async publishPack(manifest: PackManifest, metadata: {
        authorId: string;
        author: string;
        icon: string;
        language: string;
    }): Promise<{ success: boolean; message: string }> {
        if (!await this.init() || !this.currentUser) {
            return { success: false, message: 'Not signed in' };
        }

        try {
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

            // Generate a pack ID
            const packId = `community.${manifest.id}`;

            // Store the pack manifest as a JSON blob in a Firestore document
            // In production, you'd upload to Firebase Storage/Hosting instead
            const packDoc = {
                id: packId,
                name: manifest.name,
                description: manifest.description,
                author: metadata.author,
                authorId: metadata.authorId,
                language: metadata.language,
                icon: metadata.icon,
                version: manifest.version,
                snippetCount: manifest.snippets.length,
                downloads: 0,
                rating: 0,
                ratingCount: 0,
                tags: manifest.tags.map((t: any) => t.name || t),
                fileUrl: '', // Will be set by cloud function after approval
                status: 'pending',
                manifest: JSON.stringify(manifest), // Store the full manifest
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(firestoreDb, 'packs'), packDoc);

            return {
                success: true,
                message: 'Pack submitted for review! It will appear in the registry once approved.',
            };
        } catch (err) {
            return {
                success: false,
                message: `Publish failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            };
        }
    }

    // ─── Caching ───

    private getCachedPacks(): RegistryPack[] | null {
        const cache = this.context.globalState.get<{ data: RegistryPack[]; timestamp: number }>(CACHE_KEY);
        if (!cache) return null;
        if (Date.now() - cache.timestamp > CACHE_TTL) return null;
        return cache.data;
    }

    private setCachedPacks(packs: RegistryPack[]): void {
        this.context.globalState.update(CACHE_KEY, {
            data: packs,
            timestamp: Date.now(),
        });
    }
}
