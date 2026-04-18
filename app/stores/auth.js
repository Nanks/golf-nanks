import { defineStore } from 'pinia';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,          
    userProfile: null,   
    loading: import.meta.client ? true : false,
    isInitialized: false, // NEW: Tracks if the first Auth check is complete
    unsubscribeProfile: null,
    pendingPlayerId: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdminForType: (state) => (type) => {
      return state.userProfile?.adminTypes?.includes(type) || false;
    },
    isAdminForLeague: (state) => (leagueType) => {
      const adminLevel = state.userProfile?.admin;
      if (!adminLevel) return false;
      return adminLevel === 'super' || adminLevel === leagueType;
    }
  },

  actions: {
    setPendingPlayerId(id) {
      console.log('🆔 Store: Setting pending player ID:', id);
      this.pendingPlayerId = id;
    },

    setUser(user, profile = null) {
      this.user = user;
      
      if (this.unsubscribeProfile) {
        this.unsubscribeProfile();
        this.unsubscribeProfile = null;
      }

      if (user) {
        if (profile) {
          // Use the profile passed from login.vue directly
          this.userProfile = profile;
          this.loading = false;
        } else {
          // Standard flow: fetch from Firestore listener
          this.fetchUserProfile(user.uid);
        }
      } else {
        this.userProfile = null;
        this.loading = false;
      }

      this.isInitialized = true;
      this.pendingPlayerId = null; // Clear the pending ID after successful login
    },

    // NEW: Middleware helper to prevent "race conditions" on refresh
    waitForAuth() {
      return new Promise((resolve) => {
        // 1. If already done, let 'em through
        if (this.isInitialized) return resolve();

        // 2. Safety Timeout: Don't let the screen stay blank forever
        const timeout = setTimeout(() => {
          console.warn('🕒 Auth Timeout: Releasing middleware');
          this.isInitialized = true; // Force it
          resolve();
        }, 5000);

        // 3. Watch for the real initialization
        const unwatch = watch(() => this.isInitialized, (val) => {
          if (val) {
            clearTimeout(timeout);
            unwatch();
            resolve();
          }
        });
      });
    },

    async fetchUserProfile(uid) {
      const { $db } = useNuxtApp()
      if (!$db) return

      const q = query(
        collection($db, 'players'), 
        where('uids', 'array-contains', uid)
      )

      this.unsubscribeProfile = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          this.userProfile = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          }
        }
        this.loading = false
      }, (err) => {
        console.error("Snapshot error:", err)
        this.loading = false
      })
    },

    async logout() {
      const auth = getAuth();
      if (this.unsubscribeProfile) {
        this.unsubscribeProfile();
        this.unsubscribeProfile = null;
      }
      await auth.signOut();
    }
  }
});