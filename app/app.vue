<template>
  <div class="antialiased font-sans selection:bg-emerald-500/30 bg-slate-950 min-h-screen text-slate-200">
    
    <AppNavbar />
    <AppToast />
    <AppLoading :active="ui.isGlobalLoading" :message="ui.loadingMessage" />

    <NuxtLayout>
      <div class="relative transition-all duration-500">
        <NuxtPage />
      </div>
    </NuxtLayout>

  </div>
</template>

<script setup>
const authStore = useAuthStore();
const { $auth, $db } = useNuxtApp();
import { collection, query, where, getDocs } from "firebase/firestore";
import { useUIStore } from '~/stores/ui'

const ui = useUIStore()
const nuxtApp = useNuxtApp()

// 1. Automatic Route Loading
// Shows the spinner whenever the user navigates between pages
nuxtApp.hook("page:start", () => {
  ui.setLoading(true, 'Loading Page...')
})

nuxtApp.hook("page:finish", () => {
  // Small delay for smoother transitions
  setTimeout(() => {
    ui.setLoading(false)
  }, 300)
})

// 2. Global Error Handling
// If a hard error occurs, make sure the spinner doesn't get stuck forever
onErrorCaptured((err) => {
  console.error("Global Error Boundary:", err)
  ui.setLoading(false)
  return true 
})

onMounted(() => {
  $auth.onAuthStateChanged(async (user) => {
    if (user && !authStore.userProfile) {
      console.log("🔄 Re-hydrating user profile...");
      
      try {
        // Search for the player document where uids array contains user.uid
        const playersRef = collection($db, "players");
        const q = query(playersRef, where("uids", "array-contains", user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const playerDoc = querySnapshot.docs[0];
          const playerData = playerDoc.data();
          
          // Set the store so index.vue and the Navbar see the data
          authStore.setUser(user, { id: playerDoc.id, ...playerData });
          console.log("✅ Profile restored:", playerData.fname);
        } else {
          console.warn("⚠️ No player document found for this UID.");
        }
      } catch (error) {
        console.error("❌ Error re-hydrating profile:", error);
      }
    }
  });
});
</script>

<style>
/* Smooth Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease-out;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Custom Scrollbar for the dark modern look */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #020617; /* slate-950 */
}
::-webkit-scrollbar-thumb {
  background: #1e293b; /* slate-800 */
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #10b981; /* emerald-500 */
}
</style>