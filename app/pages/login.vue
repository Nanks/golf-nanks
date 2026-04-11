<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6">
    <div class="max-w-md w-full">
      <header class="mb-12 text-center">
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

      <div class="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl">
        <div v-if="!otpSent" class="space-y-8">
          <div>
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">Welcome</h2>
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              Authorized Access Only
            </p>
          </div>
          
          <div class="space-y-5">
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em] ml-1">
                Registered Mobile Number
              </label>
              <input 
                v-model="phoneNumber" 
                type="tel" 
                @input="formatDisplay"
                placeholder="(555) 555-5555" 
                class="w-full p-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all font-mono text-lg"
                :disabled="isLoading"
              />
            </div>
            
            <button 
              @click="handleSendOtp" 
              id="login-button"
              :disabled="isLoading || phoneNumber.length < 10"
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
        
        <div v-else class="space-y-8">
          <div>
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">Security Code</h2>
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              Sent to {{ phoneNumber }}
            </p>
          </div>

          <div class="space-y-6">
            <div class="flex justify-between gap-2" @paste="handlePaste">
              <input
                v-for="(digit, index) in 6"
                :key="index"
                :ref="el => otpInputs[index] = el"
                v-model="otpArray[index]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="w-12 h-16 bg-slate-950 border-2 border-slate-800 text-emerald-500 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-black text-center text-2xl"
                @input="handleInput(index, $event)"
                @keydown.delete="handleDelete(index)"
                :disabled="isLoading"
              />
            </div>

            <button 
              @click="handleVerifyOtp" 
              :disabled="isLoading || otpArray.join('').length < 6"
              class="w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
            >
              <span v-if="isLoading">Finalizing...</span>
              <span v-else>Confirm Identity</span>
            </button>
            
            <button 
              @click="resetOtp" 
              class="w-full text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors"
            >
              Try different number
            </button>
          </div>
        </div>
      </div>
      
      <p class="text-center mt-8 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
        &copy; {{ new Date().getFullYear() }} DB Nanks Industries
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, query, where, getDocs, limit, arrayUnion, doc, updateDoc,getDoc } from "firebase/firestore";
import { useAuthStore } from "~/stores/auth";


const { $db } = useNuxtApp();
const { initRecaptcha, sendOtp, verifyOtp } = useAuth();
const authStore = useAuthStore();
const toast = useToast();
const ui = useUIStore();

const phoneNumber = ref('');
const isLoading = ref(false);
const otpArray = ref(['', '', '', '', '', '']);
const otpInputs = ref([]);
const otpSent = ref(false);

onMounted(() => {
  initLoginCaptcha();
});

const initLoginCaptcha = () => {
  try {
    // If the element exists, initialize it
    if (document.getElementById('login-button')) {
      initRecaptcha('login-button');
    }
  } catch (err) {
    console.error("Captcha Init failed, retrying...", err);
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
  phoneNumber.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
};

const handleSendOtp = async () => {
  if (!phoneNumber.value) return;
  
  isLoading.value = true;
  try {
    // Standardize to E.164
    let digits = phoneNumber.value.replace(/\D/g, '');
    if (digits.length === 10) digits = `1${digits}`;
    const formattedE164 = `+${digits}`;

    // STRICT CHECK: Ensure player exists in pre-registered 'players' collection
    const q = query(
      collection($db, "players"), 
      where("phone", "==", formattedE164),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      toast.add({ 
        title: "Access Denied", 
        description: "Your number is not registered in the league database.", 
        color: 'red' 
      });
      isLoading.value = false;
      return;
    }

    // Persist doc ID to authStore and send OTP
    authStore.setPendingPlayerId(querySnapshot.docs[0].id);
    await sendOtp(formattedE164);
    otpSent.value = true;
    
  } catch (err) {
    console.error("Auth Error:", err);
    toast.add({ title: "Service Error", description: "Could not send code.", color: 'red' });
  } finally {
    isLoading.value = false;
  }
};

watch(otpSent, async (val) => {
  if (val) {
    await nextTick();
    otpInputs.value[0]?.focus();
  }
});

const handleInput = (index, event) => {
  const val = event.target.value;
  
  // Only allow numbers
  if (!/^\d*$/.test(val)) {
    otpArray.value[index] = '';
    return;
  }

  // Move to next box
  if (val && index < 5) {
    otpInputs.value[index + 1].focus();
  }

  // Auto-submit logic
  const currentCode = otpArray.value.join('');
  if (currentCode.length === 6) {
    // Only call verify if we aren't already in the middle of a check
    if (!ui.isGlobalLoading) {
      handleVerifyOtp();
    }
  }
};

const handleDelete = (index) => {
  if (!otpArray.value[index] && index > 0) {
    otpInputs.value[index - 1].focus();
  }
};

const handlePaste = (event) => {
  const paste = event.clipboardData.getData('text').slice(0, 6);
  if (!/^\d+$/.test(paste)) return;
  
  const digits = paste.split('');
  digits.forEach((d, i) => {
    if (i < 6) otpArray.value[i] = d;
  });
  
  // Focus last filled or next empty
  const nextIndex = digits.length >= 6 ? 5 : digits.length;
  otpInputs.value[nextIndex].focus();
};

const resetOtp = () => {
  otpSent.value = false;
  otpArray.value = ['', '', '', '', '', ''];
};

const handleVerifyOtp = async () => {
  if (ui.isGlobalLoading) return;

  const fullCode = otpArray.value.join('');
  if (fullCode.length < 6) {
    toast.add({ title: "Incomplete Code", description: "Please enter all 6 digits.", color: 'orange' });
    return;
  }

  ui.setLoading(true, "Verifying Identity...");
  
  try {
    const result = await verifyOtp(fullCode); 
    const user = result.user;

    if (authStore.pendingPlayerId) {
      const playerRef = doc($db, "players", authStore.pendingPlayerId);
      
      // arrayUnion handles the "if not there already" logic automatically
      await updateDoc(playerRef, {
        uids: arrayUnion(user.uid),
        lastLogin: new Date().toISOString() // Optional: good for tracking
      });
      
      // Fetch the updated document to ensure the local store has the latest uids array
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        authStore.setUser(user, { id: authStore.pendingPlayerId, ...playerSnap.data() });
      }
    }
    
    navigateTo('/');
  } catch (err) {
    console.error("Auth Error:", err);
    otpArray.value = ['', '', '', '', '', ''];
    otpInputs.value[0]?.focus();
    toast.add({ title: "Verification Failed", description: "Invalid code.", color: 'red' });
  } finally {
    ui.setLoading(false);
  }
};
</script>