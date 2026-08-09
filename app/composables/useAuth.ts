import { 
  onAuthStateChanged, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';
import { useAuthStore } from '~/stores/auth'; // 1. Import Pinia

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const useAuth = () => {
  const { $auth } = useNuxtApp();
  const authStore = useAuthStore(); // 2. Initialize Pinia

  const initAuth = () => {
    // Only set up the listener once
    onAuthStateChanged($auth as any, (fbUser) => {
      // 3. Send the Firebase user straight to Pinia.
      // Pinia's `setUser` action handles fetching the profile and flipping `isInitialized` to true!
      authStore.setUser(fbUser);
    });
  };

  const initRecaptcha = (elementId: string) => {
    if (!import.meta.client) return;
    
    if (recaptchaVerifier) {
      try { recaptchaVerifier.clear(); } catch (e) {}
    }

    recaptchaVerifier = new RecaptchaVerifier($auth as any, elementId, { 
      size: 'invisible' 
    });
  };

  const sendOtp = async (phoneNumber: string) => {
    if (!recaptchaVerifier) throw new Error("Recaptcha not initialized");
    confirmationResult = await signInWithPhoneNumber($auth as any, phoneNumber, recaptchaVerifier);
  };

  const verifyOtp = async (otp: string) => {
    if (!confirmationResult) throw new Error("No pending verification");
    const result = await confirmationResult.confirm(otp);
    return result.user;
  };

  // We can just proxy the logout to your excellent Pinia action
  const logout = async () => {
    await authStore.logout();
  };

  return {
    initAuth,
    initRecaptcha,
    sendOtp,
    verifyOtp,
    logout
  };
};