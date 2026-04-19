<template>
  <Transition name="slide-up">
    <div v-if="show" class="fixed bottom-6 left-0 right-0 z-[100] px-4 pointer-events-none flex justify-center">
      <div class="card-base max-w-sm w-full p-4 pointer-events-auto flex gap-4 items-center shadow-2xl">
        
        <div class="size-12 bg-slate-950 rounded-xl flex items-center justify-center shrink-0 border border-slate-800">
          <Icon name="mdi:golf" class="size-8 text-emerald-500" />
        </div>

        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Install Golf Nanks</h3>
          
          <p v-if="!isIOS" class="text-[10px] font-bold text-slate-500 leading-tight mt-0.5">
            Add to home screen for a full-screen league experience.
          </p>
          
          <p v-else class="text-[10px] font-bold text-slate-500 leading-tight mt-0.5">
            Tap <Icon name="mdi:export-variant" class="inline pb-0.5 size-3" /> then <br/> <strong>"Add to Home Screen"</strong>.
          </p>
        </div>

        <div class="flex flex-col gap-2 shrink-0">
          <button v-if="!isIOS" @click="installApp" class="bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg active:scale-95">
            Install
          </button>
          <button @click="dismiss" class="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Later
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const show = ref(false)
const deferredPrompt = ref(null)
const isIOS = ref(false)

onMounted(() => {
  if (localStorage.getItem('pwa-dismissed')) return

  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
  if (isStandalone) return

  // Android/Chrome logic
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    show.value = true
  })

  // iOS logic (Safari doesn't support the event above)
  const ua = window.navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) {
    isIOS.value = true
    setTimeout(() => { show.value = true }, 3000)
  }
})

const installApp = async () => {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') show.value = false
}

const dismiss = () => {
  show.value = false
  localStorage.setItem('pwa-dismissed', 'true')
}
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100px); opacity: 0; }
</style>