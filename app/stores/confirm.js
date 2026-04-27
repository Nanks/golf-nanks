import { defineStore } from 'pinia'

export const useConfirmStore = defineStore('confirm', {
  state: () => ({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    // New styling state
    icon: 'mdi:alert-circle',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    confirmBtnClass: 'bg-red-600',
    resolve: null 
  }),

  actions: {
    open(params) {
      this.title = params.title || 'Are you sure?'
      this.message = params.message || ''
      this.confirmText = params.confirmText || 'Confirm'
      
      // Capture the custom styling or fallback to "scary red"
      this.icon = params.icon || 'mdi:alert-circle'
      this.iconBg = params.iconBg || 'bg-red-50'
      this.iconColor = params.iconColor || 'text-red-500'
      this.confirmBtnClass = params.confirmBtnClass || 'bg-red-600'
      
      this.isOpen = true

      return new Promise((res) => {
        this.resolve = res
      })
    },

    confirm() {
      this.isOpen = false
      if (this.resolve) this.resolve(true)
    },

    cancel() {
      this.isOpen = false
      if (this.resolve) this.resolve(false)
    }
  }
})