<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 font-sans">
    <div class="max-w-md mx-auto">
      
      <header class="mb-8 text-center">
        <h1 class="text-4xl font-black tracking-tight text-emerald-600">GOLF NANKS</h1>
        <p class="text-slate-500 font-medium">Simple Round Tracker</p>
      </header>

      <div v-if="!user" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold mb-4">Welcome back</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-400 mb-1">Phone Number</label>
            <input 
              v-model="phoneNumber" 
              type="tel" 
              placeholder="+1 555 555 5555" 
              class="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>
          
          <div v-if="otpSent">
            <label class="block text-xs font-semibold uppercase text-slate-400 mb-1">SMS Code</label>
            <input 
              v-model="otpCode" 
              type="number" 
              placeholder="123456" 
              class="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          <button 
            v-if="!otpSent"
            @click="handleSendOtp" 
            id="login-button"
            class="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
          >
            Send Code
          </button>
          
          <button 
            v-else
            @click="handleVerifyOtp" 
            class="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition"
          >
            Verify & Login
          </button>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 class="text-xl font-bold mb-4">Add New Round</h2>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="col-span-2">
              <input v-model="courseName" placeholder="Course Name" class="w-full p-3 bg-slate-100 rounded-lg outline-none" />
            </div>
            <input v-model.number="score" type="number" placeholder="Score" class="p-3 bg-slate-100 rounded-lg outline-none" />
            <button @click="handleSave" class="bg-emerald-600 text-white font-bold rounded-lg px-4 hover:bg-emerald-700 transition">
              Save
            </button>
          </div>
        </div>

        <div>
          <div class="flex justify-between items-end mb-4 px-2">
            <h2 class="text-xl font-bold">Recent Rounds</h2>
            <button @click="loadRounds" class="text-xs font-bold text-emerald-600 uppercase tracking-widest">Refresh</button>
          </div>
          
          <div v-if="rounds.length === 0" class="text-center p-8 bg-slate-100 rounded-2xl text-slate-400 italic">
            No rounds recorded yet.
          </div>
          
          <div v-else class="space-y-3">
            <div v-for="round in rounds" :key="round.id" class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div>
                <p class="font-bold text-slate-800">{{ round.course }}</p>
                <p class="text-xs text-slate-400">{{ formatDate(round.createdAt) }}</p>
              </div>
              <div class="text-2xl font-black text-emerald-600">{{ round.score }}</div>
            </div>
          </div>
        </div>
        
        <button @click="$auth.signOut()" class="w-full text-slate-400 text-xs font-bold uppercase py-4">Sign Out</button>
      </div>

    </div>
  </div>
</template>

<script setup>
const { $auth } = useNuxtApp()
const { initRecaptcha, sendOtp, verifyOtp, saveRound, fetchRounds } = useGolf()

const phoneNumber = ref('')
const otpCode = ref('')
const otpSent = ref(false)
const user = ref(null)

const courseName = ref('')
const score = ref(72)
const rounds = ref([])

// 1. Setup on Mount
onMounted(() => {
  initRecaptcha('login-button')
  
  $auth.onAuthStateChanged((u) => {
    user.value = u
    if (u) loadRounds()
  })
})

// 2. Auth Actions
const handleSendOtp = async () => {
  try {
    await sendOtp(phoneNumber.value)
    otpSent.value = true
  } catch (err) {
    alert(err.message)
  }
}

const handleVerifyOtp = async () => {
  try {
    await verifyOtp(otpCode.value)
  } catch (err) {
    alert("Invalid code")
  }
}

// 3. Data Actions
const handleSave = async () => {
  if (!courseName.value) return
  await saveRound(courseName.value, score.value)
  courseName.value = ''
  loadRounds()
}

const loadRounds = async () => {
  rounds.value = await fetchRounds()
}

const formatDate = (ts) => {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString()
}
</script>