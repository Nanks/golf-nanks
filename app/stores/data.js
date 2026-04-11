import { defineStore } from 'pinia'
import { collection, collectionGroup, onSnapshot, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore'

export const useData = defineStore('data', () => {
  const { $db } = useNuxtApp()
  const liveRounds = ref([]) // Initialize as empty array
  const liveRoundsUnsub = ref(null)

  const startLiveListener = (type = null) => {
    // If a listener is already running, we stop it first to prevent 
    // multiple listeners or memory leaks when switching types.
    if (liveRoundsUnsub.value) {
        liveRoundsUnsub.value()
        liveRoundsUnsub.value = null
    }

    // 1. Start with the base collection
    let q = collection($db, "live_rounds")

    // 2. If a type is provided, add the 'where' filter
    if (type) {
        q = query(q, where("type", "==", type))
    }

    liveRoundsUnsub.value = onSnapshot(q, (snapshot) => {
      liveRounds.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    })
  }

  const stopLiveListener = () => {
    if (liveRoundsUnsub.value) {
      liveRoundsUnsub.value()
      liveRoundsUnsub.value = null
    }
  }

  const deleteLiveRound = async (roundId) => {
    try {
      const { $db } = useNuxtApp();
      await deleteDoc(doc($db, "live_rounds", roundId));
      return true;
    } catch (err) {
      console.error("Delete Error:", err);
      return false;
    }
  }

  const fetchHistoricByIso = async (type, iso) => {
    const { $db } = useNuxtApp();
    try {
      // Queries every "rounds" subcollection in the database
      const q = query(
        collectionGroup($db, "rounds"), 
        where("type", "==", type),
        where("iso", "==", iso)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching historic rounds:", err);
      return [];
    }
  };

  // CRITICAL: Make sure these are returned!
  return { 
    liveRounds, 
    startLiveListener, 
    stopLiveListener,
    deleteLiveRound,
    fetchHistoricByIso
  }
})