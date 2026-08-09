const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

// Initialize Admin SDK once
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = getFirestore();

/**
 * Calculates the league handicap index.
 * Uses Best X of Last Y (e.g., Best 4 of last 10).
 */
const calcLeagueHandicap = (differentials, bestX = 4, lastY = 10) => {
    if (!differentials || differentials.length === 0) return 0;
    
    const recentDiffs = differentials.slice(-lastY);
    const sortedDiffs = [...recentDiffs].sort((a, b) => a - b);
    const scoresToUse = Math.min(bestX, sortedDiffs.length);
    const bestScores = sortedDiffs.slice(0, scoresToUse);
    const avg = bestScores.reduce((acc, val) => acc + val, 0) / scoresToUse;
    
    return Number(avg.toFixed(3)); 
};

// ============================================================================
// 1. ARCHIVE ROUND & UPDATE HANDICAPS
// ============================================================================
exports.archiveLeagueRound = onDocumentUpdated("leagues/{leagueId}/calendar/{eventId}", async (event) => {
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();

    // Guard clause: Only run if status JUST transitioned to 'complete'
    if (previousValue.status === "complete" || newValue.status !== "complete") {
        return null; 
    }

    const leagueId = event.params.leagueId;
    const eventId = event.params.eventId;
    const batch = db.batch();
    
    const tokensToNotify = new Set();
    const invalidTokensToCleanup = [];

    try {
        const leagueSnap = await db.doc(`leagues/${leagueId}`).get();
        const leagueData = leagueSnap.data();
        const isAppManaged = leagueData?.appHandicap === true;
        const leagueName = leagueData?.shortName || leagueData?.name || "League";

        const liveRoundsQuery = await db.collection("live_rounds")
            .where("leagueId", "==", leagueId)
            .where("iso", "==", newValue.iso)
            .get();

        if (liveRoundsQuery.empty) {
            console.log(`No live rounds found for event ${eventId}.`);
            return null;
        }

        for (const liveRoundDoc of liveRoundsQuery.docs) {
            const roundData = liveRoundDoc.data();
            const roundId = liveRoundDoc.id;
            const snapshot = roundData.courseSnapshot;

            if (Array.isArray(roundData.players)) {
                for (const player of roundData.players) {
                    const playerId = player.id;
                    if (!playerId) continue;

                    const playerScores = roundData.scores?.[playerId] || [];
                    const hasZeros = playerScores.includes(0) || playerScores.length === 0;

                    let minimizedSnapshot = null;
                    if (snapshot && player.teesId && snapshot.tees?.[player.teesId]) {
                        minimizedSnapshot = {
                            holes: snapshot.holes || 18,
                            id: snapshot.id || roundData.courseId || null,
                            name: snapshot.name || roundData.course || null,
                            tees: {
                                [player.teesId]: snapshot.tees[player.teesId]
                            }
                        };
                    }

                    const playerRoundRef = db.collection(`players/${playerId}/rounds`).doc(roundId);
                    const historicalData = {
                        course: roundData.course || null,
                        courseId: roundData.courseId || null,
                        courseSnapshot: minimizedSnapshot, 
                        leagueId: leagueId,
                        eventId: eventId,
                        iso: roundData.iso || null,
                        date: roundData.iso || null, 
                        type: roundData.type || null,
                        name: `${player.fname} ${player.lname}`.trim(),
                        playerKey: playerId,
                        index: player.index,
                        ghin: player.ghin,
                        tee_type: player.tee_type,
                        tees: player.tees,
                        teesId: player.teesId,
                        scores: playerScores,
                        status: "end",
                        createdAt: FieldValue.serverTimestamp(),
                        migratedYear: roundData.iso ? roundData.iso.split('-')[0] : "2026"
                    };
                    batch.set(playerRoundRef, historicalData);

                    const playerRef = db.doc(`players/${playerId}`);
                    const playerSnap = await playerRef.get();
                    
                    if (playerSnap.exists) {
                        const pData = playerSnap.data();
                        
                        if (Array.isArray(pData.fcmTokens)) {
                            pData.fcmTokens.forEach(token => {
                                tokensToNotify.add({ token, playerId });
                            });
                        }

                        if (isAppManaged && snapshot && player.teesId && !hasZeros) {
                            const teeInfo = snapshot.tees?.[player.teesId];
                            if (!teeInfo) continue;

                            const courseHndcp = Math.round(
                                (player.index || 0) * (teeInfo.slope / 113) + (teeInfo.rating - teeInfo.par)
                            );

                            let adjustedGross = 0;
                            playerScores.forEach((score, index) => {
                                const holePar = teeInfo.pars[index] || 4;
                                const holeHandicap = teeInfo.hnds[index] || 1;
                                const strokes = Math.floor(courseHndcp / 18) + (courseHndcp % 18 >= holeHandicap ? 1 : 0);
                                const maxScore = holePar + 2 + strokes; 
                                adjustedGross += Math.min(score, maxScore);
                            });

                            const differential = Number(((adjustedGross - teeInfo.rating) * 113 / teeInfo.slope).toFixed(3));

                            const auditEntry = {
                                adjustedGross,
                                courseRating: teeInfo.rating,
                                slopeRating: teeInfo.slope,
                                date: roundData.iso,
                                differential,
                                isPadding: false,
                                rawGross: playerScores.reduce((a, b) => a + b, 0),
                                roundId: roundId
                            };

                            let audits = pData.leagueAudits?.[leagueId] || [];
                            audits.push(auditEntry);
                            audits.sort((a, b) => new Date(a.date) - new Date(b.date));
                            if (audits.length > 10) audits = audits.slice(-10);

                            let diffsForCalc = audits.map(a => a.differential);
                            
                            if (diffsForCalc.length < 4) {
                                const paddingValue = Number(((player.ghin || player.index || 0) - 3).toFixed(3));
                                const needed = 4 - diffsForCalc.length;
                                for (let i = 0; i < needed; i++) {
                                    diffsForCalc.push(paddingValue);
                                }
                            }

                            const newHcp = calcLeagueHandicap(diffsForCalc, 4, 10);

                            batch.update(playerRef, {
                                [`leagueAudits.${leagueId}`]: audits,
                                [`leagueHandicaps.${leagueId}`]: newHcp
                            });
                        }
                    }
                }
            }
            batch.delete(liveRoundDoc.ref);
        }

        await batch.commit();
        console.log(`Successfully archived event ${eventId}`);

        const tokenArray = Array.from(tokensToNotify).map(t => t.token);
        
        if (tokenArray.length > 0) {
            const message = {
                notification: {
                    title: `${leagueName} Round Finalized! ⛳`,
                    body: `The leaderboard for ${newValue.course || 'the latest round'} is locked. Tap to view the final results.`
                },
                data: { url: `/leagues/${leagueId}/calendar` },
                tokens: tokenArray
            };

            try {
                const response = await admin.messaging().sendEachForMulticast(message);
                if (response.failureCount > 0) {
                    const tokenObjects = Array.from(tokensToNotify);
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            const errorCode = resp.error.code;
                            if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
                                const failedTokenObj = tokenObjects[idx];
                                const playerRef = db.doc(`players/${failedTokenObj.playerId}`);
                                invalidTokensToCleanup.push(
                                    playerRef.update({
                                        fcmTokens: FieldValue.arrayRemove(failedTokenObj.token)
                                    })
                                );
                            }
                        }
                    });
                    if (invalidTokensToCleanup.length > 0) await Promise.all(invalidTokensToCleanup);
                }
            } catch (msgError) {
                console.error("Error sending push notifications:", msgError);
            }
        }

        return { success: true };

    } catch (error) {
        console.error(`Archive failed for event ${eventId}:`, error);
        throw error;
    }
});

// ============================================================================
// 2. NOTIFY NEW LEAGUE EVENT
// ============================================================================
exports.notifyNewLeagueEvent = onDocumentCreated("leagues/{leagueId}/calendar/{eventId}", async (event) => {
    const newEvent = event.data.data();
    const leagueId = event.params.leagueId;
    
    if (!newEvent || !leagueId) return null;

    try {
        const leagueSnap = await db.doc(`leagues/${leagueId}`).get();
        const leagueName = leagueSnap.exists 
            ? (leagueSnap.data().shortName || leagueSnap.data().name || "Your League")
            : "Your League";

        const playersQuery = await db.collection("players")
            .where("leagues", "array-contains", leagueId)
            .get();

        if (playersQuery.empty) return null;

        const tokensToNotify = new Set();
        playersQuery.forEach(doc => {
            const pData = doc.data();
            if (Array.isArray(pData.fcmTokens) && pData.fcmTokens.length > 0) {
                pData.fcmTokens.forEach(token => {
                    tokensToNotify.add({ token, playerId: doc.id });
                });
            }
        });

        const tokenArray = Array.from(tokensToNotify).map(t => t.token);
        if (tokenArray.length === 0) return null;

        const eventDate = new Date(newEvent.iso + "T12:00:00").toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric' 
        });

        const message = {
            notification: {
                title: `New ${leagueName} Event Added! 📅`,
                body: `A round at ${newEvent.course} has been scheduled for ${eventDate}.`
            },
            data: { url: `/leagues/${leagueId}/calendar` },
            tokens: tokenArray
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        if (response.failureCount > 0) {
            const invalidTokensToCleanup = [];
            const tokenObjects = Array.from(tokensToNotify);
            
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error.code;
                    if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
                        const failedTokenObj = tokenObjects[idx];
                        const playerRef = db.doc(`players/${failedTokenObj.playerId}`);
                        invalidTokensToCleanup.push(
                            playerRef.update({ fcmTokens: FieldValue.arrayRemove(failedTokenObj.token) })
                        );
                    }
                }
            });
            if (invalidTokensToCleanup.length > 0) await Promise.all(invalidTokensToCleanup);
        }

        return { success: true };
    } catch (error) {
        console.error("Error broadcasting new event notification:", error);
        throw error;
    }
});

// ============================================================================
// 3. NUDGE UNANSWERED PLAYERS (CALLABLE)
// ============================================================================
exports.nudgeUnansweredPlayers = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to send a nudge.');
    }

    const { leagueId, eventId } = request.data;
    if (!leagueId || !eventId) {
        throw new HttpsError('invalid-argument', 'Missing leagueId or eventId.');
    }

    try {
        const eventSnap = await db.doc(`leagues/${leagueId}/calendar/${eventId}`).get();
        if (!eventSnap.exists) {
            throw new HttpsError('not-found', 'Calendar event not found.');
        }
        const eventData = eventSnap.data();

        const leagueSnap = await db.doc(`leagues/${leagueId}`).get();
        const leagueName = leagueSnap.exists 
            ? (leagueSnap.data().shortName || leagueSnap.data().name) 
            : 'Your League';

        const answeredPlayerIds = eventData.rsvps ? Object.keys(eventData.rsvps) : [];

        const playersQuery = await db.collection("players")
            .where("leagues", "array-contains", leagueId)
            .get();

        const tokensToNotify = new Set();
        const invalidTokensToCleanup = [];

        playersQuery.forEach(doc => {
            if (!answeredPlayerIds.includes(doc.id)) {
                const pData = doc.data();
                if (Array.isArray(pData.fcmTokens) && pData.fcmTokens.length > 0) {
                    pData.fcmTokens.forEach(token => {
                        tokensToNotify.add({ token, playerId: doc.id });
                    });
                }
            }
        });

        const tokenArray = Array.from(tokensToNotify).map(t => t.token);

        if (tokenArray.length === 0) {
            return { success: true, count: 0, message: "No nudges needed." };
        }

        const eventDate = new Date(eventData.iso + "T12:00:00").toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric' 
        });

        const message = {
            notification: {
                title: `RSVP Needed: ${leagueName} ⛳`,
                body: `We are finalizing the roster for ${eventData.course || 'upcoming event'} on ${eventDate}. Let us know if you are playing!`
            },
            data: { url: `/leagues/${leagueId}/calendar` },
            tokens: tokenArray
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        if (response.failureCount > 0) {
            const tokenObjects = Array.from(tokensToNotify);
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error.code;
                    if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
                        const failedTokenObj = tokenObjects[idx];
                        const playerRef = db.doc(`players/${failedTokenObj.playerId}`);
                        invalidTokensToCleanup.push(
                            playerRef.update({ fcmTokens: FieldValue.arrayRemove(failedTokenObj.token) })
                        );
                    }
                }
            });
            if (invalidTokensToCleanup.length > 0) await Promise.all(invalidTokensToCleanup);
        }

        return { success: true, count: response.successCount };

    } catch (error) {
        console.error("Error nudging players:", error);
        throw new HttpsError('internal', 'Failed to process nudge request.', error);
    }
});

// ============================================================================
// 4. BROADCAST LEAGUE ANNOUNCEMENTS
// ============================================================================
exports.broadcastAnnouncement = onDocumentCreated("leagues/{leagueId}/announcements/{announcementId}", async (event) => {
    // 1. Grab the newly created announcement data
    const announcement = event.data.data();
    const leagueId = event.params.leagueId;
    
    // Safety check
    if (!announcement || !leagueId) return null;

    try {
        // 2. Query all players belonging to this league
        const playersQuery = await db.collection("players")
            .where("leagues", "array-contains", leagueId)
            .get();

        if (playersQuery.empty) {
            console.log(`No players found for league ${leagueId}. Skipping broadcast.`);
            return null;
        }

        // 3. Collect all valid FCM tokens
        const tokensToNotify = new Set();
        playersQuery.forEach(doc => {
            const pData = doc.data();
            
            // We include the admin who sent it so they get the visual confirmation on their device
            if (Array.isArray(pData.fcmTokens) && pData.fcmTokens.length > 0) {
                pData.fcmTokens.forEach(token => {
                    tokensToNotify.add({ token, playerId: doc.id });
                });
            }
        });

        const tokenArray = Array.from(tokensToNotify).map(t => t.token);

        if (tokenArray.length === 0) {
            console.log("No FCM tokens found among league players.");
            return null;
        }

        // 4. Build the message payload using the admin's exact input
        const message = {
            notification: {
                title: announcement.title,
                body: announcement.body
            },
            data: {
                // Route them back to the menu or wherever you want them to land
                url: `/leagues/${leagueId}/menu`,
                type: 'announcement'
            },
            tokens: tokenArray
        };

        // 5. Send the Multicast Message
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Sent broadcast. Success: ${response.successCount}, Failed: ${response.failureCount}`);

        // 6. Clean up expired/invalid tokens from the players collection
        if (response.failureCount > 0) {
            const invalidTokensToCleanup = [];
            const tokenObjects = Array.from(tokensToNotify);
            
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error.code;
                    // If the user uninstalled the PWA or revoked permissions, remove their dead token
                    if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
                        const failedTokenObj = tokenObjects[idx];
                        const playerRef = db.doc(`players/${failedTokenObj.playerId}`);
                        
                        invalidTokensToCleanup.push(
                            playerRef.update({
                                fcmTokens: FieldValue.arrayRemove(failedTokenObj.token)
                            })
                        );
                    }
                }
            });

            if (invalidTokensToCleanup.length > 0) {
                await Promise.all(invalidTokensToCleanup);
                console.log(`Cleaned up ${invalidTokensToCleanup.length} invalid tokens.`);
            }
        }

        return { success: true };

    } catch (error) {
        console.error("Error broadcasting announcement:", error);
        throw error;
    }
});