import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    isGlobalLoading: false,
    loadingMessage: 'Syncing Data...'
  }),

  actions: {
    setLoading(status, message = 'Syncing Data...') {
      this.isGlobalLoading = status
      this.loadingMessage = message
    }
  }
})