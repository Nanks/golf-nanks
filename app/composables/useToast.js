const toastData = ref({
  title: '',
  description: '',
  color: 'emerald' 
})
const isVisible = ref(false)

export const useToast = () => {
  
  // Updated to handle both an object OR two strings
  const add = (payload, colorFallback = 'emerald') => {
    
    if (typeof payload === 'string') {
      // Handle the two-string format: toast.add("Message here", "success")
      toastData.value = { 
        title: payload, 
        description: '', 
        color: colorFallback 
      }
    } else {
      // Handle the original object format: toast.add({ title: "...", color: "..." })
      toastData.value = { 
        title: payload.title || '', 
        description: payload.description || '', 
        color: payload.color || 'emerald' 
      }
    }
    
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