import { defineStore } from 'pinia'

export const useConfirmStore = defineStore('confirm', {
  state: () => ({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger', // 'danger' | 'warning' | 'info'
    resolve: null // This holds the Promise resolver
  }),

  actions: {
    /**
     * Opens the modal and returns a Promise that resolves to true or false
     */
    open(params) {
      this.title = params.title || 'Are you sure?'
      this.message = params.message || ''
      this.confirmText = params.confirmText || 'Confirm'
      this.variant = params.variant || 'danger'
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