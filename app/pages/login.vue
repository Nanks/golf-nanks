<template>
  <div class="min-h-screen bg-slate-950 flex flex-col items-center pt-4 sm:justify-center sm:pt-0 p-6 select-none">
    <div class="max-w-md w-full">
      
      <header class="mb-8 text-center">
        <h1 class="text-5xl font-black tracking-[0.15em] text-emerald-500 uppercase italic">
          Golf Nanks
        </h1>
        <div class="flex items-center justify-center gap-3 mt-2">
          <span class="h-[1px] w-8 bg-slate-800"></span>
          <p class="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            League Management
          </p>
          <span class="h-[1px] w-8 bg-slate-800"></span>
        </div>
      </header>

      <div class="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl shadow-emerald-950/20">
        
        <div v-if="!otpSent" class="space-y-6">
          <div>
            <h2 class="text-2xl font-black text-white uppercase tracking-tight italic">Welcome</h2>
          </div>
          
          <div class="space-y-5">
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em] ml-1">
                Mobile Number
              </label>
              <input 
                v-model="phoneNumber" 
                type="tel" 
                @input="formatDisplay"
                placeholder="(555) 555-5555" 
                class="w-full p-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all font-mono text-lg text-center"
                :disabled="isLoading"
              />
            </div>
            
            <button 
              @click="handleSendOtp" 
              id="login-button"
              :disabled="isLoading || phoneNumber.length < 14"
              class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs shadow-lg shadow-emerald-900/20"
            >
              <span v-if="isLoading" class="flex items-center justify-center gap-2">
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Verifying...
              </span>
              <span v-else>Request Access Code</span>
            </button>
          </div>
        </div>
        
        <div v-else class="space-y-6">
          <div>
            <h2 class="text-2xl font-black text-white uppercase tracking-tight italic">Security Code</h2>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              Sent to <span class="text-emerald-500">{{ phoneNumber }}</span>
            </p>
          </div>

          <div class="space-y-5">
            <div>
              <input
                ref="otpInputRef"
                v-model="otpCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                placeholder="••••••"
                class="w-full p-4 bg-slate-950 border border-slate-800 text-emerald-500 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all font-mono text-lg text-center placeholder:text-slate-700"
                @input="handleOtpInput"
                :disabled="isLoading"
              />
            </div>

            <button 
              @click="handleVerifyOtp" 
              :disabled="isLoading || otpCode.length < 6"
              class="w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs disabled:opacity-50"
            >
              <span v-if="isLoading">Finalizing...</span>
              <span v-else>Confirm Identity</span>
            </button>
            
            <button 
              @click="resetOtp" 
              class="w-full text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors pt-2"
            >
              Try different number
            </button>
          </div>
        </div>
      </div>
      
      <p class="text-center mt-8 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
        &copy; {{ new Date().getFullYear() }} DB Nanks Industries
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { collection, query, where, getDocs, limit, arrayUnion, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuthStore } from "~/stores/auth";
import { useUIStore } from "~/stores/ui";

const { $db } = useNuxtApp();
const { initRecaptcha, sendOtp, verifyOtp } = useAuth();
const authStore = useAuthStore();
const toast = useToast();
const ui = useUIStore();

const phoneNumber = ref('');
const isLoading = ref(false);

// OTP State
const otpCode = ref('');
const otpInputRef = ref(null);
const otpSent = ref(false);

onMounted(() => {
  initLoginCaptcha();
});

const initLoginCaptcha = () => {
  try {
    if (document.getElementById('login-button')) {
      initRecaptcha('login-button');
    }
  } catch (err) {
    console.error("Captcha Init failed", err);
  }
};

onUnmounted(() => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      console.warn("Recaptcha cleanup failed", e);
    }
  }
});

const formatDisplay = () => {
  let x = phoneNumber.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
  if (!x) return;
  phoneNumber.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
};

const handleSendOtp = async () => {
  if (!phoneNumber.value) return;
  
  isLoading.value = true;
  try {
    // Convert to E.164 format for Firebase Auth
    let digits = phoneNumber.value.replace(/\D/g, '');
    if (digits.length === 10) digits = `1${digits}`;
    const formattedE164 = `+${digits}`;

    // Verify player exists in the database
    const q = query(
      collection($db, "players"), 
      where("phone", "==", formattedE164),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      toast.add({ 
        title: "Access Denied", 
        description: "Mobile number not recognized in the league database.", 
        color: 'red' 
      });
      isLoading.value = false;
      return;
    }

    authStore.setPendingPlayerId(querySnapshot.docs[0].id);
    await sendOtp(formattedE164);
    otpSent.value = true;
    
  } catch (err) {
    console.error("Auth Error:", err);
    toast.add({ title: "Service Error", description: "Failed to send code. Please try again.", color: 'red' });
  } finally {
    isLoading.value = false;
  }
};

watch(otpSent, async (val) => {
  if (val) {
    await nextTick();
    otpInputRef.value?.focus();
  }
});

const handleOtpInput = (event) => {
  // Strip out any non-numeric characters (handles pasting formatting issues)
  otpCode.value = event.target.value.replace(/\D/g, '').slice(0, 6);

  // Auto-submit when exactly 6 digits are reached
  if (otpCode.value.length === 6 && !ui.isGlobalLoading) {
    handleVerifyOtp();
  }
};

const resetOtp = () => {
  otpSent.value = false;
  otpCode.value = '';
};

const handleVerifyOtp = async () => {
  if (ui.isGlobalLoading) return;
  if (otpCode.value.length < 6) return;

  ui.setLoading(true, "Authenticating...");
  
  try {
    // 1. Grab the user safely
    const user = await verifyOtp(otpCode.value); 

    if (!user || !user.uid) {
      throw new Error("Could not extract user UID.");
    }

    if (authStore.pendingPlayerId) {
      const playerRef = doc($db, "players", authStore.pendingPlayerId);
      
      // 2. Let Firebase handle the array natively!
      await updateDoc(playerRef, {
        uids: arrayUnion(user.uid),
        lastLogin: new Date().toISOString()
      });
      
      // 3. Fetch the freshly updated document
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        // 4. Hydrate the store
        authStore.setUser(user, { 
          id: authStore.pendingPlayerId, 
          ...playerSnap.data() 
        });

        // 5. Clean up the pending ID securely
        authStore.setPendingPlayerId(null);
      }
    }
    
    navigateTo('/');
  } catch (err) {
    console.error("Verification Error:", err);
    otpCode.value = '';
    otpInputRef.value?.focus();
    toast.add({ title: "Invalid Code", description: "The code entered is incorrect.", color: 'red' });
  } finally {
    ui.setLoading(false);
  }
};
</script>