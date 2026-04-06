import { defineStore } from 'pinia'
// Assuming your interface and function are in a utils file
import { calculateLeagueHandicap } from '~/utils/handicap' 

interface HandicapAudit {
  iso: string;
  diff: number;
  score: number;
  isPlaceholder: boolean;
  isBest?: boolean;
}

interface HandicapResult {
  hcp: string;
  audit: HandicapAudit[];
}

interface PlayerState {
  playerId: string | null;
  handicapData: HandicapResult;
  isLoading: boolean;
}

export const usePlayerStore = defineStore('player', {
  state: (): PlayerState => ({
    playerId: null,
    handicapData: {
      hcp: '0.000',
      audit: []
    },
    isLoading: false
  }),

  actions: {
    setPlayerId(id: string) {
      this.playerId = id
    },

    async updateHandicap(
      $db: any, 
      currentGhin: number, 
      leagueDocId: string, 
      coursesMap: Map<string, any>
    ) {
      if (!this.playerId) return
      
      this.isLoading = true
      try {
        const result = await calculateLeagueHandicap(
          $db, 
          this.playerId, 
          leagueDocId, 
          currentGhin, 
          coursesMap
        )
        // result will now be type-checked as HandicapResult
        this.handicapData = result
      } catch (err) {
        console.error("Failed to update handicap:", err)
      } finally {
        this.isLoading = false
      }
    }
  }
})
