<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
      
      <header class="mb-10 text-center">
        <h1 class="text-4xl font-black tracking-tighter text-emerald-600 uppercase">Golf Nanks</h1>
        <p class="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">League Tracker</p>
      </header>

      <div class="space-y-6">
        <div v-if="!otpSent">
          <h2 class="text-xl font-black text-slate-800 dark:text-slate-100 mb-1 uppercase tracking-tight">Welcome</h2>
          <p class="text-xs font-bold text-slate-400 uppercase mb-6">Enter your mobile number to begin</p>
          
          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Phone Number</label>
              <input 
                v-model="phoneNumber" 
                type="tel" 
                @input="formatDisplay"
                placeholder="555 555 5555" 
                class="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-bold"
                :disabled="isLoading"
              />
            </div>
            
            <button 
              @click="handleSendOtp" 
              id="login-button"
              :disabled="isLoading || !phoneNumber"
              class="w-full bg-emerald-600 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              <span v-if="isLoading">Sending...</span>
              <span v-else>Send Access Code</span>
            </button>
          </div>
        </div>
        
        <div v-else>
          <h2 class="text-xl font-black text-slate-800 dark:text-slate-100 mb-1 uppercase tracking-tight">Verify Identity</h2>
          <p class="text-xs font-bold text-slate-400 uppercase mb-6">Sent to {{ phoneNumber }}</p>

          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">6-Digit Code</label>
              <input 
                v-model="otpCode" 
                type="number" 
                placeholder="000000" 
                class="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-black text-center text-2xl tracking-[0.5em]"
                :disabled="isLoading"
              />
            </div>

            <button 
              @click="handleVerifyOtp" 
              :disabled="isLoading || otpCode.length < 6"
              class="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-xl hover:opacity-90 transition active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              <span v-if="isLoading">Verifying...</span>
              <span v-else>Verify & Sign In</span>
            </button>
            
            <button 
              @click="otpSent = false" 
              class="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition"
            >
              Change Phone Number
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { collection, query, where, getDocs, limit, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { usePlayerStore } from "~/stores/player";

const { $db } = useNuxtApp();
const { initRecaptcha, sendOtp, verifyOtp } = useAuth();
const playerStore = usePlayerStore();
const toast = useToast();

const phoneNumber = ref('');
const otpCode = ref('');
const otpSent = ref(false);
const isLoading = ref(false);

onMounted(() => {
  initRecaptcha('login-button');
});

// Optional helper to format the input as user types
const formatDisplay = () => {
  let x = phoneNumber.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
  phoneNumber.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
};

const handleSendOtp = async () => {
  if (!phoneNumber.value) return;
  
  isLoading.value = true;
  try {
    // 1. FORMATTING LOGIC: Strip everything and force E.164 (+1XXXXXXXXXX)
    let digits = phoneNumber.value.replace(/\D/g, '');
    if (digits.length === 10) {
      digits = `1${digits}`; // Add US country code if missing
    }
    const formattedE164 = `+${digits}`;

    // 2. CHECK: Does this player exist in Firestore?
    const q = query(
      collection($db, "players"), 
      where("phone", "==", formattedE164),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      toast.show("No account found for this number.");
      isLoading.value = false;
      return;
    }

    // 3. PERSIST: Save the player ID to the store before proceeding
    playerStore.setPlayerId(querySnapshot.docs[0].id);

    // 4. PROCEED: Send the SMS via Auth service
    await sendOtp(formattedE164);
    otpSent.value = true;
  } catch (err) {
    console.error(err);
    toast.show("System error. Please try again.");
  } finally {
    isLoading.value = false;
  }
};

const handleVerifyOtp = async () => {
  isLoading.value = true;
  try {
    // FIX: Ensure you pass the string value, not the Ref object
    const result = await verifyOtp(otpCode.value); 
    const user = result.user;

    if (playerStore.playerId) {
      const playerRef = doc($db, "players", playerStore.playerId);
      await updateDoc(playerRef, {
        uids: arrayUnion(user.uid)
      });
    }
    navigateTo('/');
  } catch (err) {
    console.error("Verification failed:", err);
    toast.show("Invalid code. Please try again.");
  } finally {
    isLoading.value = false;
  }
};
</script>
