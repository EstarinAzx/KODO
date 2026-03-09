// Firebase configuration for KODO Pack Registry
// These values are baked in at build time via webpack DefinePlugin
// Forkers: set your own values in .env and rebuild

declare const KODO_FIREBASE_API_KEY: string | undefined;
declare const KODO_FIREBASE_AUTH_DOMAIN: string | undefined;
declare const KODO_FIREBASE_PROJECT_ID: string | undefined;
declare const KODO_FIREBASE_STORAGE_BUCKET: string | undefined;
declare const KODO_FIREBASE_MESSAGING_SENDER_ID: string | undefined;
declare const KODO_FIREBASE_APP_ID: string | undefined;

export const firebaseConfig = {
    apiKey: (typeof KODO_FIREBASE_API_KEY !== 'undefined' && KODO_FIREBASE_API_KEY) || '',
    authDomain: (typeof KODO_FIREBASE_AUTH_DOMAIN !== 'undefined' && KODO_FIREBASE_AUTH_DOMAIN) || '',
    projectId: (typeof KODO_FIREBASE_PROJECT_ID !== 'undefined' && KODO_FIREBASE_PROJECT_ID) || '',
    storageBucket: (typeof KODO_FIREBASE_STORAGE_BUCKET !== 'undefined' && KODO_FIREBASE_STORAGE_BUCKET) || '',
    messagingSenderId: (typeof KODO_FIREBASE_MESSAGING_SENDER_ID !== 'undefined' && KODO_FIREBASE_MESSAGING_SENDER_ID) || '',
    appId: (typeof KODO_FIREBASE_APP_ID !== 'undefined' && KODO_FIREBASE_APP_ID) || '',
};

export function isFirebaseConfigured(): boolean {
    return firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0;
}
