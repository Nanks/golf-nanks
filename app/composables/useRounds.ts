import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

export const useRounds = () => {
  const { $db } = useNuxtApp();
  const { user } = useAuth(); // Leverage the new auth composable

  const saveRound = async (course: string, score: number) => {
    if (!user.value) throw new Error("Must be logged in to save rounds");

    return await addDoc(collection($db, "rounds"), {
      userId: user.value.uid,
      course,
      score,
      createdAt: serverTimestamp(),
    });
  };

  const fetchRounds = async () => {
    if (!user.value) return [];

    const q = query(
      collection($db, "rounds"), 
      where("userId", "==", user.value.uid)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  return {
    saveRound,
    fetchRounds,
  };
};
