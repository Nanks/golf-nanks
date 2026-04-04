import { 
  onAuthStateChanged, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signOut,
  type User,
  type ConfirmationResult
} from 'firebase/auth';
import { collection, query, getDocs, where } from 'firebase/firestore';

// 1. Keep these only if they are NOT used as state (ConfirmationResult/Verifier are fine here)
let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const useAuth = () => {
  const { $auth, $db } = useNuxtApp();

  // 2. These are your SHARED GLOBAL STATES across the whole app
  const currentUser = useState<User | null>('auth_user', () => null);
  const playerData = useState<Player | null>('player_data', () => null);
  const isInitialLoading = useState<boolean>('auth_loading', () => true);

  // 3. Computed Helpers
  const isSuperAdmin = computed(() => playerData.value?.admin === 'super');
  const isLoggedIn = computed(() => !!currentUser.value);
  const isAnyAdmin = computed(() => !!playerData.value?.admin);
  
  const isAdminOf = (leagueID: string) => {
    if (isSuperAdmin.value) return true;
    return playerData.value?.admin === leagueID;
  };

  // 4. Initialize Auth Listener
  const initAuth = () => {
    onAuthStateChanged($auth, async (fbUser) => {
      // This now updates the 'useState' correctly
      currentUser.value = fbUser;
      
      if (fbUser) {
        try {
          const playersRef = collection($db, "players");
          const q = query(playersRef, where("uids", "array-contains", fbUser.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            if (docSnap) {
              playerData.value = { 
                id: docSnap.id, 
                ...docSnap.data() 
              } as Player;
            
              console.log("Player profile loaded:", playerData.value.fname);
            }
          } else {
            console.warn("No player document found for UID:", fbUser.uid);
            playerData.value = null;
          }
        } catch (err) {
          console.error("Error fetching player profile:", err);
          playerData.value = null;
        }
      } else {
        playerData.value = null;
      }
      
      isInitialLoading.value = false;
    });
  };

  const initRecaptcha = (elementId: string) => {
    if (recaptchaVerifier) return;
    recaptchaVerifier = new RecaptchaVerifier($auth, elementId, { size: 'invisible' });
  };

  const sendOtp = async (phoneNumber: string) => {
    if (!recaptchaVerifier) throw new Error("Recaptcha not initialized");
    confirmationResult = await signInWithPhoneNumber($auth, phoneNumber, recaptchaVerifier);
  };

  const verifyOtp = async (otp: string) => {
    if (!confirmationResult) throw new Error("No pending verification");
    await confirmationResult.confirm(otp);
  };

  const logout = async () => {
    try {
      await signOut($auth);
      currentUser.value = null;
      playerData.value = null;
      navigateTo('/login');
    } catch (error) {
      console.error("Sign out failed:", error);
    }
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
    isSuperAdmin,
    isAdminOf,
    isAnyAdmin
  };
};
