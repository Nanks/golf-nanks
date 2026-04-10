import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    userProfile: null,
    pendingPlayerId: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    
    // Check for "super" status
    isSuperAdmin: (state) => state.userProfile?.admin === 'super',

    // Check if user is an admin for a specific league type (e.g., 'vegas')
    isAdminForType: (state) => (type) => {
      if (state.userProfile?.admin === 'super') return true
      return state.userProfile?.admin === type
    }
  },

  actions: {
    setUser(user, profile) {
      this.user = user
      this.userProfile = profile
    },
    logout() {
      this.user = null
      this.userProfile = null
      const auth = useNuxtApp().$auth
      auth.signOut()
    }
  }
})