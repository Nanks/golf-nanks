<template>
  <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10">
    
    <div class="text-white mb-8 text-center">
      <h1 class="text-2xl font-bold">Logo Boundary Test</h1>
      <p class="text-slate-400">The red box represents the 128px (w-32) container.</p>
    </div>

    <div class="border-2 border-red-500/30 relative">
      
      <div class="w-32 h-32 flex items-center justify-center bg-slate-900 overflow-visible">
        
        <TheSmssLogo 
          startColor="#2563eb"
          endColor="#34d399"
          class="w-auto h-28 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]"
        />

      </div>

      <div class="absolute -top-6 left-0 text-[10px] text-red-500 uppercase font-black">
        w-32 boundary
      </div>
    </div>

    <div class="mt-12 max-w-md text-sm text-slate-400 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <p class="font-bold text-slate-200 mb-2">Checklist for TheSSCLogo.vue:</p>
      <ul class="list-disc ml-4 space-y-1">
        <li>Does the <code>&lt;svg&gt;</code> have a <code>viewBox</code>?</li>
        <li>Does the flag path extend beyond the <code>viewBox</code> numbers?</li>
        <li>Is there a <code>width</code> or <code>height</code> attribute on the SVG tag? (Remove them if so).</li>
        <li>Try adding <code>overflow="visible"</code> directly to the <code>&lt;svg&gt;</code> tag.</li>
      </ul>
    </div>

  </div>
</template>

<script setup>
// Assuming your components are auto-imported in Nuxt
</script>