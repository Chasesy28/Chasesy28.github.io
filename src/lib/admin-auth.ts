import { authenticateAdmin } from './supabase'

const SESSION_KEY = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export class AdminAuthManager {
  private sessionKey = SESSION_KEY
  private sessionDuration = SESSION_DURATION

  /**
   * Authenticate an admin user
   * @param email Admin email
   * @returns Admin user object if authenticated, null otherwise
   */
  async login(email: string) {
    try {
      // Authenticate against Supabase
      const admin = await authenticateAdmin(email)

      if (admin) {
        // Create session
        this.createSession(admin)
        return admin
      }
      return null
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  }

  /**
   * Create a new session
   */
  private createSession(admin: any) {
    const session = {
      adminId: admin.id,
      email: admin.email,
      loginTime: Date.now(),
      expiresAt: Date.now() + this.sessionDuration
    }
    localStorage.setItem(this.sessionKey, JSON.stringify(session))
    return session
  }

  /**
   * Get current session
   */
  getSession() {
    const sessionData = localStorage.getItem(this.sessionKey)
    if (!sessionData) return null

    try {
      const session = JSON.parse(sessionData)

      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.logout()
        return null
      }

      return session
    } catch (error) {
      console.error('Error parsing session:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.getSession() !== null
  }

  /**
   * Refresh session expiration time
   */
  refreshSession() {
    const session = this.getSession()
    if (session) {
      session.expiresAt = Date.now() + this.sessionDuration
      localStorage.setItem(this.sessionKey, JSON.stringify(session))
      return session
    }
    return null
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem(this.sessionKey)
  }

  /**
   * Get session expiration time in minutes
   */
  getSessionExpirationMinutes() {
    const session = this.getSession()
    if (!session) return null

    const minutesLeft = Math.floor((session.expiresAt - Date.now()) / (60 * 1000))
    return Math.max(0, minutesLeft)
  }
}

export const authManager = new AdminAuthManager()
