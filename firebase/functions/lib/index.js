"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubAuth = exports.approvePack = exports.onUserCreated = exports.onRatingWritten = exports.onPackPublished = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const validatePack_1 = require("./validatePack");
// ─── onPackPublished: Validate new pack submissions ───
exports.onPackPublished = functions.firestore
    .document('packs/{packId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    // Only validate pending packs
    if (data.status !== 'pending')
        return;
    // Validate the manifest if it's stored inline
    if (data.manifest) {
        try {
            const manifest = JSON.parse(data.manifest);
            const error = (0, validatePack_1.validatePackManifest)(manifest);
            if (error) {
                await snap.ref.update({
                    status: 'rejected',
                    rejectionReason: error,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return;
            }
        }
        catch {
            await snap.ref.update({
                status: 'rejected',
                rejectionReason: 'Invalid manifest JSON',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return;
        }
    }
    // Pack is valid — stays as pending for manual approval
    console.log(`New pack submitted: ${data.name} by ${data.author} (${context.params.packId})`);
});
// ─── onRatingWritten: Recalculate pack aggregate rating ───
exports.onRatingWritten = functions.firestore
    .document('packs/{packId}/ratings/{userId}')
    .onWrite(async (change, context) => {
    const { packId } = context.params;
    const packRef = db.doc(`packs/${packId}`);
    // Get all ratings for this pack
    const ratingsSnap = await db.collection(`packs/${packId}/ratings`).get();
    let totalStars = 0;
    let count = 0;
    ratingsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.stars) {
            totalStars += data.stars;
            count++;
        }
    });
    const avgRating = count > 0 ? Math.round((totalStars / count) * 10) / 10 : 0;
    await packRef.update({
        rating: avgRating,
        ratingCount: count,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
// ─── onUserCreated: Create user profile on sign-up ───
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const profile = {
        id: user.uid,
        displayName: user.displayName || 'Anonymous',
        avatarUrl: user.photoURL || '',
        githubUsername: '',
        publishedPackCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Extract GitHub username from provider data
    for (const provider of user.providerData) {
        if (provider.providerId === 'github.com') {
            profile.githubUsername = provider.displayName || provider.email || '';
        }
    }
    await db.doc(`users/${user.uid}`).set(profile);
});
// ─── approvePackHTTP: Admin-only pack approval ───
exports.approvePack = functions.https.onCall(async (data, context) => {
    // Check admin status
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    const adminDoc = await db.doc(`admins/${context.auth.uid}`).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    const { packId } = data;
    if (!packId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing packId');
    }
    const packRef = db.doc(`packs/${packId}`);
    const packSnap = await packRef.get();
    if (!packSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Pack not found');
    }
    await packRef.update({
        status: 'approved',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, message: `Pack "${packSnap.data()?.name}" approved` };
});
// ─── githubAuth: Exchange a GitHub OAuth token for a Firebase custom token ───
// VS Code provides GitHub OAuth tokens via its built-in auth API, but those
// tokens are from Microsoft's OAuth app not ours. This function verifies the
// token with GitHub directly and creates a Firebase custom token.
exports.githubAuth = functions.https.onCall(async (data) => {
    const { githubToken } = data;
    if (!githubToken || typeof githubToken !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing githubToken');
    }
    // Verify the token by calling GitHub's /user API
    const response = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });
    if (!response.ok) {
        throw new functions.https.HttpsError('unauthenticated', `GitHub token verification failed: ${response.status}`);
    }
    const ghUser = await response.json();
    const uid = `github_${ghUser.id}`;
    // Create or update the Firebase user
    try {
        await admin.auth().updateUser(uid, {
            displayName: ghUser.name || ghUser.login,
            photoURL: ghUser.avatar_url || '',
        });
    }
    catch (err) {
        if (err.code === 'auth/user-not-found') {
            await admin.auth().createUser({
                uid,
                displayName: ghUser.name || ghUser.login,
                photoURL: ghUser.avatar_url || '',
            });
        }
        else {
            throw err;
        }
    }
    // Update the user profile in Firestore
    await db.doc(`users/${uid}`).set({
        id: uid,
        githubUsername: ghUser.login,
        displayName: ghUser.name || ghUser.login,
        avatarUrl: ghUser.avatar_url || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    // Create a custom token
    const customToken = await admin.auth().createCustomToken(uid, {
        githubUsername: ghUser.login,
    });
    return {
        customToken,
        user: {
            id: uid,
            githubUsername: ghUser.login,
            displayName: ghUser.name || ghUser.login,
            avatarUrl: ghUser.avatar_url || '',
        },
    };
});
//# sourceMappingURL=index.js.map