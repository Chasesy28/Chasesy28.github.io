import { beforeEach, describe, expect, it, vi } from 'vitest'

const authenticateAdminMock = vi.fn()
const signInWithOAuthMock = vi.fn()
const exchangeCodeForSessionMock = vi.fn()
const getSessionMock = vi.fn()
const signOutMock = vi.fn()

vi.mock('./supabase', () => ({
  authenticateAdmin: authenticateAdminMock,
  supabase: {
    auth: {
      signInWithOAuth: signInWithOAuthMock,
      exchangeCodeForSession: exchangeCodeForSessionMock,
      getSession: getSessionMock,
      signOut: signOutMock
    }
  }
}))

import { AdminAuthManager } from './admin-auth'

describe('AdminAuthManager', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
    vi.clearAllMocks()
    signInWithOAuthMock.mockResolvedValue({ error: null })
    exchangeCodeForSessionMock.mockResolvedValue({ data: { session: null }, error: null })
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null })
    signOutMock.mockResolvedValue(undefined)
  })

  it('normalizes email and stores a session on successful login', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    authenticateAdminMock.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com' })
    const manager = new AdminAuthManager()

    const result = await manager.login('  ADMIN@EXAMPLE.COM ')

    expect(authenticateAdminMock).toHaveBeenCalledWith('admin@example.com')
    expect(result).toEqual({ id: 'admin-1', email: 'admin@example.com' })
    const savedSession = JSON.parse(localStorage.getItem('admin_session') ?? '{}')
    expect(savedSession.adminId).toBe('admin-1')
    expect(savedSession.email).toBe('admin@example.com')
    expect(savedSession.loginTime).toBe(Date.now())
  })

  it('configures Google OAuth redirect with defaults and custom path', async () => {
    const manager = new AdminAuthManager()

    await manager.loginWithGoogle()
    await manager.loginWithGoogle('/admin/auth')

    expect(signInWithOAuthMock).toHaveBeenNthCalledWith(1, {
      provider: 'google',
      options: {
        redirectTo: 'https://silly-site.me/projects/Admin/admin.html',
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    })
    expect(signInWithOAuthMock).toHaveBeenNthCalledWith(2, {
      provider: 'google',
      options: {
        redirectTo: 'https://silly-site.me/admin/auth',
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    })
  })

  it('initializes auth from OAuth code and strips query params from URL', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            email: 'newadmin@example.com'
          }
        }
      },
      error: null
    })
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null })
    authenticateAdminMock.mockResolvedValue({ id: 'a1', email: 'newadmin@example.com' })
    window.history.replaceState({}, '', 'https://silly-site.me/admin/auth?code=oauth-code&state=abc#top')
    const manager = new AdminAuthManager()

    const admin = await manager.initializeAuthFromSupabase()

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('oauth-code')
    expect(admin).toEqual({ id: 'a1', email: 'newadmin@example.com' })
    expect(window.location.href).toBe('https://silly-site.me/admin/auth#top')
    expect(manager.getSession()).toMatchObject({
      adminId: 'a1',
      email: 'newadmin@example.com'
    })
  })

  it('rejects authenticated users who are not authorized admins', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            email: 'user@example.com'
          }
        }
      },
      error: null
    })
    authenticateAdminMock.mockResolvedValue(null)
    const manager = new AdminAuthManager()

    await expect(manager.initializeAuthFromSupabase()).rejects.toThrow(
      'Your account is authenticated but is not authorized for admin access.'
    )
    expect(signOutMock).toHaveBeenCalled()
  })

  it('returns null for expired sessions and removes them on logout', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'))
    localStorage.setItem(
      'admin_session',
      JSON.stringify({
        adminId: 'admin-1',
        email: 'admin@example.com',
        loginTime: Date.now() - 1000,
        expiresAt: Date.now() - 1
      })
    )
    const manager = new AdminAuthManager()

    expect(manager.getSession()).toBeNull()
    await Promise.resolve()
    expect(localStorage.getItem('admin_session')).toBeNull()
  })

  it('refreshes session expiration and calculates remaining minutes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'))
    localStorage.setItem(
      'admin_session',
      JSON.stringify({
        adminId: 'admin-1',
        email: 'admin@example.com',
        loginTime: Date.now() - 3000,
        expiresAt: Date.now() + 30 * 60 * 1000
      })
    )
    const manager = new AdminAuthManager()

    const refreshed = manager.refreshSession()

    expect(refreshed?.expiresAt).toBe(Date.now() + 24 * 60 * 60 * 1000)
    expect(manager.getSessionExpirationMinutes()).toBe(1440)
    expect(manager.isAuthenticated()).toBe(true)
  })
})
