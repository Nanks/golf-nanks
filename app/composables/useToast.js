import { ref } from 'vue'

const toastMessage = ref('')
const isVisible = ref(false)
const toastType = ref('error') // 'error' | 'success' | 'info'

export const useToast = () => {
  const add = (msg, type = 'error') => {
    toastMessage.value = msg
    toastType.value = type
    isVisible.value = true
    
    setTimeout(() => {
      isVisible.value = false
    }, 4000)
  }

  return {
    add,
    isVisible,
    toastMessage,
    toastType
  }
}