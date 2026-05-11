const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
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
    
    // Take the last Y differentials
    const recentDiffs = differentials.slice(-lastY);
    
    // Sort lowest to highest to find the best scores
    const sortedDiffs = [...recentDiffs].sort((a, b) => a - b);
    
    // Grab the best X (if less than X, use all available)
    const scoresToUse = Math.min(bestX, sortedDiffs.length);
    const bestScores = sortedDiffs.slice(0, scoresToUse);
    
    // Average them
    const avg = bestScores.reduce((acc, val) => acc + val, 0) / scoresToUse;
    
    // Return formatted to exactly 3 decimal places
    return Number(avg.toFixed(3)); 
};

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

    try {
        // 1. Fetch League configuration
        const leagueSnap = await db.doc(`leagues/${leagueId}`).get();
        const isAppManaged = leagueSnap.data()?.appHandicap === true;

        // 2. Find associated live rounds
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
                    
                    // Check if the round was incomplete (contains zeros or is empty)
                    const hasZeros = playerScores.includes(0) || playerScores.length === 0;

                    // --- 3. MINIMIZED SNAPSHOT CREATION ---
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

                    // --- 4. ARCHIVE INDIVIDUAL PLAYER ROUND ---
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

                    // --- 5. HANDICAP & AUDIT LOGIC ---
                    // Only run if App Managed, Tee Info exists, AND the round is complete (no zeros)
                    if (isAppManaged && snapshot && player.teesId && !hasZeros) {
                        const teeInfo = snapshot.tees?.[player.teesId];
                        if (!teeInfo) continue;

                        // Calculate Course Handicap for Net Double Bogey
                        const courseHndcp = Math.round(
                            (player.index || 0) * (teeInfo.slope / 113) + (teeInfo.rating - teeInfo.par)
                        );

                        let adjustedGross = 0;
                        playerScores.forEach((score, index) => {
                            const holePar = teeInfo.pars[index] || 4;
                            const holeHandicap = teeInfo.hnds[index] || 1;
                            
                            // Calculate strokes received on this hole
                            const strokes = Math.floor(courseHndcp / 18) + (courseHndcp % 18 >= holeHandicap ? 1 : 0);
                            const maxScore = holePar + 2 + strokes; // Net Double Bogey limit
                            
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

                        const playerRef = db.doc(`players/${playerId}`);
                        const playerSnap = await playerRef.get();
                        
                        // Admin SDK uses .exists property, not function
                        if (playerSnap.exists) {
                            const pData = playerSnap.data();
                            let audits = pData.leagueAudits?.[leagueId] || [];
                            
                            // Append new round, sort chronologically, enforce 10-round window
                            audits.push(auditEntry);
                            audits.sort((a, b) => new Date(a.date) - new Date(b.date));
                            if (audits.length > 10) audits = audits.slice(-10);

                            // Extract differentials
                            let diffsForCalc = audits.map(a => a.differential);
                            
                            // Padding logic: (GHIN - 3) if fewer than 4 rounds
                            if (diffsForCalc.length < 4) {
                                const paddingValue = Number(((player.ghin || player.index || 0) - 3).toFixed(3));
                                const needed = 4 - diffsForCalc.length;
                                for (let i = 0; i < needed; i++) {
                                    diffsForCalc.push(paddingValue);
                                }
                            }

                            // Calculate final handicap index
                            const newHcp = calcLeagueHandicap(diffsForCalc, 4, 10);

                            // Update only the specific league entries using dot notation
                            batch.update(playerRef, {
                                [`leagueAudits.${leagueId}`]: audits,
                                [`leagueHandicaps.${leagueId}`]: newHcp
                            });
                        }
                    } else if (hasZeros) {
                        console.log(`Skipping handicap update for Player ${playerId} - incomplete round.`);
                    }
                }
            }
            // 6. Delete the processed live round
            batch.delete(liveRoundDoc.ref);
        }

        // 7. Commit all updates and deletes atomically
        await batch.commit();
        console.log(`Successfully archived event ${eventId}`);
        return { success: true };

    } catch (error) {
        console.error(`Archive failed for event ${eventId}:`, error);
        throw error;
    }
});