import { ref } from 'vue'

// Define allowed toast variants
export type ToastType = 'error' | 'success' | 'info'

// State is kept outside the function to remain global (singleton)
const toastMessage = ref<string>('')
const isVisible = ref<boolean>(false)
const toastType = ref<ToastType>('error')

export const useToast = () => {
  /**
   * Triggers a global toast notification.
   * @param msg - The text to display
   * @param type - The variant ('error', 'success', or 'info')
   */
  const show = (msg: string, type: ToastType = 'error'): void => {
    toastMessage.value = msg
    toastType.value = type
    isVisible.value = true
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      isVisible.value = false
    }, 4000)
  }

  return {
    show,
    isVisible,
    toastMessage,
    toastType
  }
}
