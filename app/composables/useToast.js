import { ref } from 'vue'

const toastData = ref({
  title: '',
  description: '',
  color: 'emerald' // Mapping 'color' to your style
})
const isVisible = ref(false)

export const useToast = () => {
  // Destructure the object coming from login.vue
  const add = ({ title, description, color = 'emerald' }) => {
    toastData.value = { title, description, color }
    isVisible.value = true
    
    setTimeout(() => {
      isVisible.value = false
    }, 4000)
  }

  return {
    add,
    isVisible,
    toastData,
  }
}