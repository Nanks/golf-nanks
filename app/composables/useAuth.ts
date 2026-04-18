import { 
  onAuthStateChanged, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signOut,
  type User,
  type ConfirmationResult
} from 'firebase/auth';
import { collection, query, getDocs, where } from 'firebase/firestore';

// Keep these outside to persist the verification session during the 2-step process
let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const useAuth = () => {
  const { $auth, $db } = useNuxtApp();

  const currentUser = useState<User | null>('auth_user', () => null);
  const playerData = useState<any | null>('player_data', () => null);
  const isInitialLoading = useState<boolean>('auth_loading', () => true);

  const isLoggedIn = computed(() => !!currentUser.value);
  const isSuperAdmin = computed(() => playerData.value?.admin === 'super');

  const initAuth = () => {
    // Only set up the listener once
    onAuthStateChanged($auth as any, async (fbUser) => {
      currentUser.value = fbUser;
      
      if (fbUser) {
        const q = query(collection($db as any, "players"), where("uids", "array-contains", fbUser.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          playerData.value = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      } else {
        playerData.value = null;
      }
      isInitialLoading.value = false;
    });
  };

  const initRecaptcha = (elementId: string) => {
    if (!import.meta.client) return;
    
    // Cleanup existing to prevent "re-initialization" errors on the same element
    if (recaptchaVerifier) {
      try { recaptchaVerifier.clear(); } catch (e) {}
    }

    recaptchaVerifier = new RecaptchaVerifier($auth as any, elementId, { 
      size: 'invisible' 
    });
  };

  const sendOtp = async (phoneNumber: string) => {
    if (!recaptchaVerifier) throw new Error("Recaptcha not initialized");
    // Standardize result storage
    confirmationResult = await signInWithPhoneNumber($auth as any, phoneNumber, recaptchaVerifier);
  };

  const verifyOtp = async (otp: string) => {
    if (!confirmationResult) throw new Error("No pending verification");
    const result = await confirmationResult.confirm(otp);
    return result.user;
  };

  const logout = async () => {
    await signOut($auth as any);
    currentUser.value = null;
    playerData.value = null;
    navigateTo('/login');
  };

  return {
    user: currentUser,
    player: playerData,
    isLoggedIn,
    isInitialLoading,
    initAuth,
    initRecaptcha,
    sendOtp,
    verifyOtp,
    logout,
    isSuperAdmin
  };
};