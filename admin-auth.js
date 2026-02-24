/**
 * Admin Authentication System
 * Simple session-based authentication using localStorage
 * Prepared for future Supabase integration
 */

const ADMIN_AUTH_KEY = "admin_session";
const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Simple authentication - checks for hardcoded credentials
 *
 * ⚠️ SECURITY WARNING ⚠️
 * These hardcoded credentials are for DEMO/DEVELOPMENT ONLY.
 * NEVER use this in production without replacing with proper authentication.
 * CHANGE THESE CREDENTIALS BEFORE ANY PUBLIC DEPLOYMENT.
 *
 * (stub) Replace with real backend authentication when ready
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {boolean} True if credentials are valid
 */
function authenticateAdmin(username, password) {
  // stub credentials check; for development only
  const validUsername = "admin";
  const validPassword = "admin123"; // h ardcoded placeholder (change before public deployment)

  if (username === validUsername && password === validPassword) {
    const session = {
      authenticated: true,
      timestamp: Date.now(),
      username: username,
    };
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
    console.log("[AdminAuth] Session created");
    return true;
  }
  return false;
}

/**
 * Checks if current session is valid
 * @returns {boolean} True if authenticated and session not expired
 */
function isAdminAuthenticated() {
  try {
    const sessionData = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);
    const elapsed = Date.now() - session.timestamp;

    if (elapsed > ADMIN_SESSION_DURATION) {
      console.log("[AdminAuth] Session expired");
      logoutAdmin();
      return false;
    }

    return session.authenticated === true;
  } catch (e) {
    console.error("[AdminAuth] Error checking session:", e);
    return false;
  }
}

/**
 * Gets current admin session data
 * @returns {Object|null} Session data or null if not authenticated
 */
function getAdminSession() {
  if (!isAdminAuthenticated()) return null;
  try {
    const sessionData = localStorage.getItem(ADMIN_AUTH_KEY);
    return JSON.parse(sessionData);
  } catch (e) {
    return null;
  }
}

/**
 * Logs out the admin by removing session
 */
function logoutAdmin() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
  console.log("[AdminAuth] Session cleared");
}

/**
 * Refreshes the session timestamp to extend the session
 */
function refreshAdminSession() {
  if (!isAdminAuthenticated()) return false;

  try {
    const session = getAdminSession();
    session.timestamp = Date.now();
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
    return true;
  } catch (e) {
    console.error("[AdminAuth] Error refreshing session:", e);
    return false;
  }
}

// Export functions for use in admin panel
window.AdminAuth = {
  authenticate: authenticateAdmin,
  isAuthenticated: isAdminAuthenticated,
  getSession: getAdminSession,
  logout: logoutAdmin,
  refreshSession: refreshAdminSession,
};
