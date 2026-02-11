import { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { announcementsManager } from '@/lib/announcements'
import { cn } from '@/lib/utils'

interface Announcement {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  dismissible: boolean
}

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle
}

const colorMap = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800'
}

const darkColorMap = {
  info: 'dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  success: 'dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
  warning: 'dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
  error: 'dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
}

const buttonColorMap = {
  info: 'hover:bg-blue-100 dark:hover:bg-blue-800/50',
  success: 'hover:bg-green-100 dark:hover:bg-green-800/50',
  warning: 'hover:bg-yellow-100 dark:hover:bg-yellow-800/50',
  error: 'hover:bg-red-100 dark:hover:bg-red-800/50'
}

export function AnnouncementBar() {
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()

    // Listen for announcement events
    announcementsManager.on('announcement:created', () => {
      loadAnnouncements()
    })
    announcementsManager.on('announcement:deleted', () => {
      loadAnnouncements()
    })
    announcementsManager.on('announcement:dismissed', () => {
      loadAnnouncements()
    })

    return () => {
      // Clean up listeners if needed
    }
  }, [])

  const loadAnnouncements = async () => {
    setLoading(true)
    try {
      const data = await announcementsManager.getAnnouncements()
      setVisibleAnnouncements(data)
    } catch (error) {
      console.error('Error loading announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (announcementId: string) => {
    await announcementsManager.dismiss(announcementId)
    setVisibleAnnouncements(prev => prev.filter(a => a.id !== announcementId))
  }

  if (loading) {
    return null
  }

  if (visibleAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 p-4">
      {visibleAnnouncements.map((announcement) => {
        const Icon = iconMap[announcement.type]
        return (
          <div
            key={announcement.id}
            className={cn(
              'border-l-4 border rounded-md p-4 flex items-start justify-between gap-4',
              colorMap[announcement.type],
              darkColorMap[announcement.type]
            )}
            role="alert"
          >
            <div className="flex items-start gap-3 flex-1">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{announcement.message}</p>
            </div>
            {announcement.dismissible && (
              <button
                onClick={() => handleDismiss(announcement.id)}
                className={cn(
                  'flex-shrink-0 p-1 rounded transition-colors',
                  buttonColorMap[announcement.type]
                )}
                aria-label="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default AnnouncementBar
