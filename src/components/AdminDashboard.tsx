import { useState, useEffect } from 'react'
import { LogOut, Plus, Trash2, Loader } from 'lucide-react'
import { authManager } from '@/lib/admin-auth'
import { announcementsManager } from '@/lib/announcements'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { cn } from '@/lib/utils'

interface Announcement {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  dismissible: boolean
  active: boolean
  created_at: string
  created_by: string
}

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loading, setLoading] = useState(false)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [newType, setNewType] = useState<'info' | 'success' | 'warning' | 'error'>('info')
  const [newDismissible, setNewDismissible] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const [sessionEmail, setSessionEmail] = useState('')
  const [sessionExpiration, setSessionExpiration] = useState(0)

  useEffect(() => {
    checkAuth()
    const interval = setInterval(checkAuth, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadAnnouncements()
      const interval = setInterval(loadAnnouncements, 10000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const checkAuth = async () => {
    let authenticated = authManager.isAuthenticated()

    if (!authenticated) {
      try {
        const admin = await authManager.initializeAuthFromSupabase()
        authenticated = !!admin
        if (admin) {
          setLoginError('')
        }
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : 'Unable to validate authenticated session')
      }
    }

    setIsAuthenticated(authenticated)
    if (authenticated) {
      const session = authManager.getSession()
      if (session) {
        setSessionEmail(session.email)
        const expirationMinutes = authManager.getSessionExpirationMinutes()
        setSessionExpiration(expirationMinutes ?? 0)
      }
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true)
    setLoginError('')

    try {
      await authManager.loginWithGoogle('/admin')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Google sign-in failed')
      setIsLoggingIn(false)
    }
  }

  const loadAnnouncements = async () => {
    setLoading(true)
    try {
      const data = await announcementsManager.getAllAnnouncements()
      setAnnouncements(data as Announcement[])
    } catch (err) {
      console.error('Failed to load announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsCreating(true)
    try {
      await announcementsManager.create(newMessage, newType, sessionEmail)
      setNewMessage('')
      setNewType('info')
      setNewDismissible(true)
      await loadAnnouncements()
    } catch (err) {
      console.error('Failed to create announcement:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      await announcementsManager.delete(id)
      await loadAnnouncements()
    } catch (err) {
      console.error('Failed to delete announcement:', err)
    }
  }

  const handleLogout = async () => {
    await authManager.logout()
    setIsAuthenticated(false)
    setSessionEmail('')
    setSessionExpiration(0)
  }

  const typeColors = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Admin Login
            </h1>

            <div className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
                  {loginError}
                </div>
              )}

              <Button
                type="button"
                disabled={isLoggingIn}
                className="w-full"
                onClick={handleGoogleLogin}
              >
                {isLoggingIn ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Continue with Google'
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 text-center">
              Sign in with a Google account that exists in the admin_users table.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage announcements for your site
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Logged in as: <span className="font-medium text-gray-900 dark:text-white">{sessionEmail}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Session expires in {Math.max(0, sessionExpiration)} minutes
            </p>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Announcement Form */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create Announcement
              </h2>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter announcement message..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isCreating}
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dismissible"
                    checked={newDismissible}
                    onChange={(e) => setNewDismissible(e.target.checked)}
                    className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                    disabled={isCreating}
                  />
                  <label htmlFor="dismissible" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Allow users to dismiss
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isCreating || !newMessage.trim()}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Announcements List */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Announcements {announcements.length > 0 && `(${announcements.length})`}
                </h2>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No announcements yet. Create one to get started!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className={cn(
                          'p-4 rounded-lg border',
                          announcement.active
                            ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 opacity-60'
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn(
                                'text-xs font-semibold px-2 py-1 rounded',
                                typeColors[announcement.type]
                              )}>
                                {announcement.type.toUpperCase()}
                              </span>
                              {!announcement.active && (
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                  INACTIVE
                                </span>
                              )}
                              {announcement.dismissible && (
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Dismissible
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 dark:text-white break-words text-sm mb-2">
                              {announcement.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Created {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 flex-shrink-0 transition-colors"
                            title="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
