/**
 * Admin Panel Script
 * Handles UI interactions for the admin panel
 */

// DOM Elements
let loginModal, loginForm, loginError;
let adminContent, logoutBtn;
let announcementModal, announcementForm, announcementPreview;
let createAnnouncementBtn, cancelAnnouncementBtn;
let announcementsList, noAnnouncementsMsg;
let refreshAnalyticsBtn, viewFullDashboardBtn, analyticsSetupLink;

// Announcement type icons and colors
const ANNOUNCEMENT_CONFIG = {
  info: { icon: 'ℹ️', color: '#4a9eff' },
  success: { icon: '✓', color: '#10b981' },
  warning: { icon: '⚠️', color: '#f59e0b' },
  error: { icon: '❌', color: '#ef4444' }
};

/**
 * Initialize the admin panel
 */
function initializeAdminPanel() {
  // Get DOM elements
  loginModal = document.getElementById('loginModal');
  loginForm = document.getElementById('loginForm');
  loginError = document.getElementById('loginError');
  adminContent = document.getElementById('adminContent');
  logoutBtn = document.getElementById('logoutBtn');
  announcementModal = document.getElementById('announcementModal');
  announcementForm = document.getElementById('announcementForm');
  announcementPreview = document.getElementById('announcementPreview');
  createAnnouncementBtn = document.getElementById('createAnnouncementBtn');
  cancelAnnouncementBtn = document.getElementById('cancelAnnouncementBtn');
  announcementsList = document.getElementById('announcementsList');
  noAnnouncementsMsg = document.getElementById('noAnnouncementsMsg');
  refreshAnalyticsBtn = document.getElementById('refreshAnalyticsBtn');
  viewFullDashboardBtn = document.getElementById('viewFullDashboardBtn');
  analyticsSetupLink = document.getElementById('analyticsSetupLink');

  // Check authentication status
  if (window.AdminAuth.isAuthenticated()) {
    showAdminContent();
  } else {
    showLoginModal();
  }

  // Setup event listeners
  setupEventListeners();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Login form
  loginForm.addEventListener('submit', handleLogin);

  // Logout button
  logoutBtn.addEventListener('click', handleLogout);

  // Announcement management
  createAnnouncementBtn.addEventListener('click', showAnnouncementModal);
  cancelAnnouncementBtn.addEventListener('click', hideAnnouncementModal);
  announcementForm.addEventListener('submit', handleCreateAnnouncement);

  // Announcement preview updates
  document.getElementById('announcementMessage').addEventListener('input', updateAnnouncementPreview);
  document.getElementById('announcementType').addEventListener('change', updateAnnouncementPreview);

  // Analytics buttons
  refreshAnalyticsBtn.addEventListener('click', refreshAnalytics);
  viewFullDashboardBtn.addEventListener('click', openCloudflareAnalytics);
  analyticsSetupLink.addEventListener('click', showAnalyticsSetup);
}

/**
 * Shows login modal
 */
function showLoginModal() {
  loginModal.classList.remove('hidden');
  adminContent.classList.add('hidden');
  loginError.style.display = 'none';
  loginForm.reset();
}

/**
 * Shows admin content
 */
function showAdminContent() {
  loginModal.classList.add('hidden');
  adminContent.classList.remove('hidden');
  
  // Refresh session timestamp
  window.AdminAuth.refreshSession();
  
  // Load data
  loadAnnouncements();
  loadAnalytics();
}

/**
 * Handles login form submission
 */
function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (window.AdminAuth.authenticate(username, password)) {
    showAdminContent();
  } else {
    loginError.textContent = 'Invalid credentials. Please try again.';
    loginError.style.display = 'block';
  }
}

/**
 * Handles logout
 */
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    window.AdminAuth.logout();
    showLoginModal();
  }
}

/**
 * Shows announcement creation modal
 */
function showAnnouncementModal() {
  announcementModal.classList.remove('hidden');
  announcementForm.reset();
  updateAnnouncementPreview();
}

/**
 * Hides announcement creation modal
 */
function hideAnnouncementModal() {
  announcementModal.classList.add('hidden');
}

/**
 * Updates the announcement preview
 */
function updateAnnouncementPreview() {
  const message = document.getElementById('announcementMessage').value || 'Your announcement will appear here';
  const type = document.getElementById('announcementType').value;
  const config = ANNOUNCEMENT_CONFIG[type];
  
  announcementPreview.textContent = `${config.icon} ${message}`;
  announcementPreview.style.backgroundColor = config.color;
}

/**
 * Handles announcement creation
 */
function handleCreateAnnouncement(e) {
  e.preventDefault();
  
  const message = document.getElementById('announcementMessage').value;
  const type = document.getElementById('announcementType').value;
  const dismissible = document.getElementById('announcementDismissible').checked;
  
  // Create and save announcement
  const announcement = window.Announcements.create(message, type, dismissible);
  window.Announcements.save(announcement);
  
  // Show success message
  alert('Announcement created successfully! It will now appear site-wide.');
  
  // Refresh the list
  loadAnnouncements();
  
  // Close modal
  hideAnnouncementModal();
}

/**
 * Loads and displays all announcements
 */
function loadAnnouncements() {
  const announcements = window.Announcements.getAll();
  
  if (announcements.length === 0) {
    announcementsList.innerHTML = '';
    noAnnouncementsMsg.style.display = 'block';
    return;
  }
  
  noAnnouncementsMsg.style.display = 'none';
  
  announcementsList.innerHTML = announcements.map(announcement => {
    const config = ANNOUNCEMENT_CONFIG[announcement.type];
    const date = new Date(announcement.createdAt).toLocaleString();
    
    return `
      <div class="announcement-item">
        <div class="announcement-item-content">
          <div style="margin-bottom: 8px;">
            <span class="announcement-type-badge type-${announcement.type}">${announcement.type.toUpperCase()}</span>
            ${announcement.dismissible ? '<span style="font-size: 12px; color: #6b7280;">• Dismissible</span>' : ''}
          </div>
          <p style="font-size: 14px; color: #111827; margin-bottom: 4px;">${escapeHtml(announcement.message)}</p>
          <p style="font-size: 12px; color: #6b7280;">Created: ${date}</p>
        </div>
        <button class="btn btn-danger" style="padding: 8px 16px; font-size: 12px;" onclick="deleteAnnouncementById('${announcement.id}')">
          Delete
        </button>
      </div>
    `;
  }).join('');
}

/**
 * Deletes an announcement
 */
function deleteAnnouncementById(announcementId) {
  if (confirm('Are you sure you want to delete this announcement?')) {
    window.Announcements.delete(announcementId);
    loadAnnouncements();
  }
}

/**
 * Loads analytics data (placeholder)
 */
function loadAnalytics() {
  // TODO: Implement real Cloudflare Analytics API integration
  // For now, show placeholder data
  
  document.getElementById('stat-requests').textContent = '-';
  document.getElementById('stat-bandwidth').textContent = '-';
  document.getElementById('stat-visitors').textContent = '-';
  document.getElementById('stat-cache').textContent = '-';
  
  console.log('[AdminPanel] Analytics API integration pending');
}

/**
 * Refreshes analytics data
 */
function refreshAnalytics() {
  refreshAnalyticsBtn.disabled = true;
  refreshAnalyticsBtn.textContent = 'Refreshing...';
  
  // Simulate API call
  setTimeout(() => {
    loadAnalytics();
    refreshAnalyticsBtn.disabled = false;
    refreshAnalyticsBtn.textContent = 'Refresh Analytics';
    alert('Analytics data refreshed (demo mode)');
  }, 1000);
}

/**
 * Opens Cloudflare Analytics dashboard
 */
function openCloudflareAnalytics() {
  // Open Cloudflare dashboard in new tab
  window.open('https://dash.cloudflare.com/', '_blank');
}

/**
 * Shows analytics setup information
 */
function showAnalyticsSetup(e) {
  e.preventDefault();
  alert(`Cloudflare Analytics Setup:

1. Get your Cloudflare API token from the dashboard
2. Add the token to your environment configuration
3. The admin panel will automatically fetch and display analytics

For development, visit the Cloudflare Dashboard directly to view analytics.`);
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make delete function available globally
window.deleteAnnouncementById = deleteAnnouncementById;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdminPanel);
} else {
  initializeAdminPanel();
}
