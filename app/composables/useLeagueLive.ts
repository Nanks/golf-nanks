// composables/useLeagueLive.ts
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore'

export const useLeagueLive = (leagueId: string, isoDate: string) => {
  const { $db } = useNuxtApp()
  const allRounds = ref([])

  const startLeaderboardListener = () => {
    // This looks across all 'rounds' subcollections
    const q = query(
      collectionGroup($db, 'rounds'),
      where('leagueID', '==', leagueId),
      where('iso', '==', isoDate)
    )

    return onSnapshot(q, (snapshot) => {
      allRounds.value = snapshot.docs.map(doc => ({
        id: doc.id,
        playerPath: doc.ref.parent.parent?.id, // Useful for linking back to player profiles
        ...doc.data()
      }))
    })
  }

  return { allRounds, startLeaderboardListener }
}
