import { defineStore } from 'pinia'

export interface Announcement {
  id: string
  title: string
  body: string
  type?: 'info' | 'warning' | 'urgent'
  url?: string
  timestamp: number
}

export const useAnnouncementStore = defineStore('announcements', () => {
  const activeAnnouncements = ref<Announcement[]>([])

  const push = (payload: Omit<Announcement, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID()
    activeAnnouncements.value.push({
      ...payload,
      id,
      timestamp: Date.now()
    })

    // Auto-remove after 10 seconds if not urgent
    if (payload.type !== 'urgent') {
      setTimeout(() => dismiss(id), 10000)
    }
  }

  const dismiss = (id: string) => {
    activeAnnouncements.value = activeAnnouncements.value.filter(a => a.id !== id)
  }

  return { activeAnnouncements, push, dismiss }
})