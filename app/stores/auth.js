import { defineStore } from 'pinia';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
          this.userProfile = profile;
          this.isInitialized = true; // We have a profile, we are initialized
          this.loading = false;
        } else {
          // Pass true to tell fetchUserProfile to flip the initialized switch
          this.fetchUserProfile(user.uid, true); 
        }
      } else {
        this.userProfile = null;
        this.isInitialized = true; // Logged out is also an initialized state
        this.loading = false;
      }
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

    async fetchUserProfile(uid, setInitialized = false) {
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
        
        // ONLY NOW do we flip the switch
        if (setInitialized) {
          this.isInitialized = true;
        }
        this.loading = false
      }, (err) => {
        console.error("Snapshot error:", err)
        if (setInitialized) this.isInitialized = true; // Don't hang the app on error
        this.loading = false
      })
    },

    async logout() {
      const auth = getAuth(); // This now works because of the import
      
      try {
        // 1. Kill the Firestore listener so it doesn't try to update a null user
        if (this.unsubscribeProfile) {
          this.unsubscribeProfile();
          this.unsubscribeProfile = null;
        }

        // 2. Sign out of Firebase
        await auth.signOut();

        // 3. Clear the local store state
        this.user = null;
        this.userProfile = null;
        this.isInitialized = true; 

      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  }
});