<template>
  <svg 
    viewBox="0 0 200 200" 
    xmlns="http://www.w3.org/2000/svg" 
    class="w-full h-full overflow-visible"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" :stop-color="startColor" />
        <stop offset="100%" :stop-color="endColor" />
      </linearGradient>
    </defs>
    
    <g :fill="`url(#${gradientId})`">
      
      <path 
        d="M 50 45 A 30 30 0 0 1 100 25 A 30 30 0 0 1 150 45 Q 150 90 100 120 Q 50 90 50 45 Z" 
      />
      
      <g fill="#ffffff" opacity="0.35">
        <circle cx="75" cy="40" r="4.5" />
        <circle cx="90" cy="35" r="5" />
        <circle cx="110" cy="35" r="5" />
        <circle cx="125" cy="40" r="4.5" />
        
        <circle cx="62" cy="55" r="4" />
        <circle cx="80" cy="52" r="5" />
        <circle cx="100" cy="50" r="5.5" />
        <circle cx="120" cy="52" r="5" />
        <circle cx="138" cy="55" r="4" />
        
        <circle cx="70" cy="70" r="4.5" />
        <circle cx="88" cy="68" r="5" />
        <circle cx="112" cy="68" r="5" />
        <circle cx="130" cy="70" r="4.5" />
        
        <circle cx="80" cy="85" r="4.5" />
        <circle cx="100" cy="82" r="5" />
        <circle cx="120" cy="85" r="4.5" />
        
        <circle cx="92" cy="98" r="4" />
        <circle cx="108" cy="98" r="4" />
        
        <circle cx="100" cy="110" r="3" />
      </g>

      <path d="M 85 122 Q 100 125 115 122 L 104 150 Q 100 156 96 150 Z" />

      <text 
        x="100" 
        y="190" 
        class="t4g-text"
        font-size="44" 
        font-weight="normal" 
        text-anchor="middle" 
        letter-spacing="4"
      >
        T4G
      </text>

    </g>
  </svg>
</template>

<script setup>
import { useId } from 'vue'

const props = defineProps({
  startColor: {
    type: String,
    default: 'var(--color-pink-500)' 
  },
  endColor: {
    type: String,
    default: 'var(--color-purple-500)'
  }
})

// Ensures unique gradient IDs
const gradientId = `t4g-gradient-${useId()}`
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

.t4g-text {
  font-family: 'Pacifico', cursive;
}
</style>