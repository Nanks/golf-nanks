import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

export const useGolf = () => {
  const { $auth, $db } = useNuxtApp();
  const confirmationResult = ref<ConfirmationResult | null>(null);

  // --- AUTH LOGIC ---
  const initRecaptcha = (elementId: string) => {
    window.recaptchaVerifier = new RecaptchaVerifier($auth, elementId, {
      size: "invisible",
    });
  };

  const sendOtp = async (phoneNumber: string) => {
    confirmationResult.value = await signInWithPhoneNumber(
      $auth, 
      phoneNumber, 
      window.recaptchaVerifier
    );
  };

  const verifyOtp = async (otp: string) => {
    if (!confirmationResult.value) throw new Error("No SMS sent");
    return await confirmationResult.value.confirm(otp);
  };

  // --- DATA LOGIC ---
  const saveRound = async (course: string, score: number) => {
    const user = $auth.currentUser;
    if (!user) throw new Error("Must be logged in");

    return await addDoc(collection($db, "rounds"), {
      userId: user.uid,
      course,
      score,
      createdAt: serverTimestamp(),
    });
  };

  const fetchRounds = async () => {
    const user = $auth.currentUser;
    if (!user) return [];

    const q = query(collection($db, "rounds"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  return {
    initRecaptcha,
    sendOtp,
    verifyOtp,
    saveRound,
    fetchRounds,
    user: computed(() => $auth.currentUser)
  };
};