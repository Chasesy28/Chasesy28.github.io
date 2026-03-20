import {
  getAnnouncements,
  dismissAnnouncement,
  isAnnouncementDismissed,
  createAnnouncement,
  deleteAnnouncement
} from './supabase.ts'

const USER_IDENTIFIER_KEY = 'announcement_user_id'

/**
 * Generate a cryptographically secure random string of the given length.
 */
function generateSecureRandomString(length: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(length)
  window.crypto.getRandomValues(bytes)

  let result = ''
  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i] % alphabet.length]
  }
  return result
}

/**
 * Get or create a unique user identifier for announcement dismissals
 */
function getUserIdentifier() {
  let userId = localStorage.getItem(USER_IDENTIFIER_KEY)

  if (!userId) {
    // Create a new unique identifier
    const randomSuffix = generateSecureRandomString(9)
    userId = `user_${Date.now()}_${randomSuffix}`
    localStorage.setItem(USER_IDENTIFIER_KEY, userId)
  }

  return userId
}

export class AnnouncementsManager {
  private userIdentifier = getUserIdentifier()

  /**
   * Get all active announcements
   */
  async getAnnouncements() {
    try {
      const announcements = await getAnnouncements()

      // Filter out dismissed announcements for this user
      const visibleAnnouncements = []
      for (const announcement of announcements) {
        if (announcement.dismissible === false) {
          visibleAnnouncements.push(announcement)
          continue
        }

        const isDismissed = await isAnnouncementDismissed(announcement.id, this.userIdentifier)
        if (!isDismissed) {
          visibleAnnouncements.push(announcement)
        }
      }

      return visibleAnnouncements
    } catch (error) {
      console.error('Error getting announcements:', error)
      return []
    }
  }

  /**
   * Get all announcements including dismissed ones
   */
  async getAllAnnouncements() {
    try {
      return await getAnnouncements()
    } catch (error) {
      console.error('Error getting all announcements:', error)
      return []
    }
  }

  /**
   * Dismiss an announcement for this user
   */
  async dismiss(announcementId: string) {
    try {
      const success = await dismissAnnouncement(announcementId, this.userIdentifier)
      if (success) {
        this.dispatchEvent('announcement:dismissed', { announcementId })
      }
      return success
    } catch (error) {
      console.error('Error dismissing announcement:', error)
      return false
    }
  }

  /**
   * Create a new announcement (admin only)
   */
  async create(
    message: string,
    type: string = 'info',
    dismissible: boolean = true,
    adminId: string | null = null
  ) {
    try {
      if (!['info', 'success', 'warning', 'error'].includes(type)) {
        throw new Error('Invalid announcement type')
      }

      const announcement = await createAnnouncement(message, type, dismissible, adminId)
      if (announcement) {
        this.dispatchEvent('announcement:created', announcement)
      }
      return announcement
    } catch (error) {
      console.error('Error creating announcement:', error)
      return null
    }
  }

  /**
   * Delete an announcement (admin only)
   */
  async delete(announcementId: string) {
    try {
      const success = await deleteAnnouncement(announcementId)
      if (success) {
        this.dispatchEvent('announcement:deleted', { announcementId })
      }
      return success
    } catch (error) {
      console.error('Error deleting announcement:', error)
      return false
    }
  }

  /**
   * Dispatch custom event
   */
  private dispatchEvent(eventName: string, detail: any) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }

  /**
   * Listen to announcement events
   */
  on(eventName: string, callback: (detail: any) => void) {
    window.addEventListener(eventName, (event) => {
      const customEvent = event as CustomEvent
      callback(customEvent.detail)
    })
  }

  /**
   * Stop listening to announcement events
   */
  off(eventName: string, callback: (detail: any) => void) {
    window.removeEventListener(eventName, callback)
  }

  /**
   * Check if an announcement is dismissed for this user
   */
  async isDismissed(announcementId: string) {
    try {
      return await isAnnouncementDismissed(announcementId, this.userIdentifier)
    } catch (error) {
      console.error('Error checking dismissal status:', error)
      return false
    }
  }
}

export const announcementsManager = new AnnouncementsManager()
