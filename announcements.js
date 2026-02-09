/**
 * Site-wide Announcements System
 * Manages creation, storage, and display of admin announcements
 * Extends notification-bars.js pattern for site-wide messages
 */

const ANNOUNCEMENTS_STORAGE_KEY = 'site_announcements';
const DISMISSED_ANNOUNCEMENTS_KEY = 'dismissed_announcements';

/**
 * Announcement types with default styling
 */
const ANNOUNCEMENT_TYPES = {
  info: {
    backgroundColor: '#4a9eff',
    icon: 'ℹ️'
  },
  success: {
    backgroundColor: '#10b981',
    icon: '✓'
  },
  warning: {
    backgroundColor: '#f59e0b',
    icon: '⚠️'
  },
  error: {
    backgroundColor: '#ef4444',
    icon: '❌'
  }
};

/**
 * Creates an announcement object
 * @param {string} message - Announcement message
 * @param {string} type - Announcement type (info, success, warning, error)
 * @param {boolean} dismissible - Whether users can dismiss the announcement
 * @returns {Object} Announcement object
 */
function createAnnouncement(message, type = 'info', dismissible = true) {
  // Generate unique ID with timestamp + random string to prevent collisions
  const randomStr = Math.random().toString(36).substring(2, 9);
  const id = `${Date.now()}-${randomStr}`;
  
  return {
    id: id,
    message: message,
    type: type,
    dismissible: dismissible,
    createdAt: Date.now()
  };
}

/**
 * Saves an announcement to storage
 * TODO: Replace with Supabase database when integrated
 * @param {Object} announcement - Announcement object to save
 */
function saveAnnouncement(announcement) {
  try {
    const announcements = getActiveAnnouncements();
    announcements.push(announcement);
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    console.log('[Announcements] Saved announcement:', announcement.id);
  } catch (e) {
    console.error('[Announcements] Error saving announcement:', e);
  }
}

/**
 * Gets all active announcements from storage
 * @returns {Array} Array of announcement objects
 */
function getActiveAnnouncements() {
  try {
    const stored = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[Announcements] Error loading announcements:', e);
    return [];
  }
}

/**
 * Deletes an announcement by ID
 * @param {string} announcementId - ID of announcement to delete
 */
function deleteAnnouncement(announcementId) {
  try {
    const announcements = getActiveAnnouncements();
    const filtered = announcements.filter(a => a.id !== announcementId);
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(filtered));
    console.log('[Announcements] Deleted announcement:', announcementId);
  } catch (e) {
    console.error('[Announcements] Error deleting announcement:', e);
  }
}

/**
 * Checks if user has dismissed an announcement
 * @param {string} announcementId - ID of announcement
 * @returns {boolean} True if dismissed
 */
function isAnnouncementDismissed(announcementId) {
  try {
    const dismissed = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
    const dismissedIds = dismissed ? JSON.parse(dismissed) : [];
    return dismissedIds.includes(announcementId);
  } catch (e) {
    return false;
  }
}

/**
 * Marks an announcement as dismissed for this user
 * @param {string} announcementId - ID of announcement to dismiss
 */
function dismissAnnouncement(announcementId) {
  try {
    const dismissed = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
    const dismissedIds = dismissed ? JSON.parse(dismissed) : [];
    
    if (!dismissedIds.includes(announcementId)) {
      dismissedIds.push(announcementId);
      localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(dismissedIds));
    }
  } catch (e) {
    console.error('[Announcements] Error dismissing announcement:', e);
  }
}

/**
 * Creates and displays an announcement banner
 * @param {Object} announcement - Announcement object to display
 * @returns {HTMLElement|null} The created banner element or null if dismissed
 */
function displayAnnouncementBanner(announcement) {
  // Don't show if user has dismissed it
  if (announcement.dismissible && isAnnouncementDismissed(announcement.id)) {
    return null;
  }
  
  const typeConfig = ANNOUNCEMENT_TYPES[announcement.type] || ANNOUNCEMENT_TYPES.info;
  
  const banner = document.createElement('div');
  banner.id = `announcement-${announcement.id}`;
  banner.className = 'offline-banner show'; // Reuse existing notification bar styles
  banner.style.backgroundColor = typeConfig.backgroundColor;
  banner.style.color = 'white';
  banner.style.display = 'flex';
  banner.style.alignItems = 'center';
  banner.style.justifyContent = 'space-between';
  banner.style.gap = '10px';
  
  // Message container
  const messageContainer = document.createElement('div');
  messageContainer.style.display = 'flex';
  messageContainer.style.alignItems = 'center';
  messageContainer.style.gap = '8px';
  
  const icon = document.createElement('span');
  icon.textContent = typeConfig.icon;
  icon.style.fontSize = '18px';
  
  const messageText = document.createElement('span');
  messageText.textContent = announcement.message;
  
  messageContainer.appendChild(icon);
  messageContainer.appendChild(messageText);
  banner.appendChild(messageContainer);
  
  // Dismiss button (if dismissible)
  if (announcement.dismissible) {
    const dismissBtn = document.createElement('button');
    dismissBtn.textContent = '×';
    dismissBtn.style.background = 'transparent';
    dismissBtn.style.border = 'none';
    dismissBtn.style.color = 'white';
    dismissBtn.style.fontSize = '24px';
    dismissBtn.style.cursor = 'pointer';
    dismissBtn.style.padding = '0 8px';
    dismissBtn.style.opacity = '0.8';
    dismissBtn.style.transition = 'opacity 0.2s';
    
    dismissBtn.addEventListener('mouseenter', () => {
      dismissBtn.style.opacity = '1';
    });
    
    dismissBtn.addEventListener('mouseleave', () => {
      dismissBtn.style.opacity = '0.8';
    });
    
    dismissBtn.addEventListener('click', () => {
      dismissAnnouncement(announcement.id);
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    });
    
    banner.appendChild(dismissBtn);
  }
  
  // Insert at the beginning of the body
  document.body.insertBefore(banner, document.body.firstChild);
  
  return banner;
}

/**
 * Displays all active announcements that haven't been dismissed
 */
function displayAllAnnouncements() {
  const announcements = getActiveAnnouncements();
  announcements.forEach(announcement => {
    displayAnnouncementBanner(announcement);
  });
}

/**
 * Initializes the announcement system on page load
 * Should be called after DOM is ready
 */
function initializeAnnouncementSystem() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayAllAnnouncements);
  } else {
    displayAllAnnouncements();
  }
}

// Export functions for use across site
window.Announcements = {
  create: createAnnouncement,
  save: saveAnnouncement,
  getAll: getActiveAnnouncements,
  delete: deleteAnnouncement,
  dismiss: dismissAnnouncement,
  isDismissed: isAnnouncementDismissed,
  display: displayAnnouncementBanner,
  displayAll: displayAllAnnouncements,
  initialize: initializeAnnouncementSystem
};
