import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

import { validatePackManifest } from './validatePack';

// ─── onPackPublished: Validate new pack submissions ───
export const onPackPublished = functions.firestore
    .document('packs/{packId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();

        // Only validate pending packs
        if (data.status !== 'pending') return;

        // Validate the manifest if it's stored inline
        if (data.manifest) {
            try {
                const manifest = JSON.parse(data.manifest);
                const error = validatePackManifest(manifest);
                if (error) {
                    await snap.ref.update({
                        status: 'rejected',
                        rejectionReason: error,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    return;
                }
            } catch {
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
export const onRatingWritten = functions.firestore
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
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
    const profile: Record<string, unknown> = {
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
export const approvePack = functions.https.onCall(async (data, context) => {
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
