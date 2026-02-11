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
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'info'
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.padding = '16px 24px';
  toast.style.borderRadius = '8px';
  toast.style.color = 'white';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '10000';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  toast.style.animation = 'slideIn 0.3s ease-out';
  toast.textContent = message;
  
  // Set color based on type
  if (type === 'success') {
    toast.style.backgroundColor = '#10b981';
  } else if (type === 'error') {
    toast.style.backgroundColor = '#ef4444';
  } else {
    toast.style.backgroundColor = '#4a9eff';
  }
  
  document.body.appendChild(toast);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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
  
  // Show success toast
  showToast('Announcement created successfully! It will now appear site-wide.', 'success');
  
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
  
  announcementsList.innerHTML = '';
  
  announcements.forEach(announcement => {
    const config = ANNOUNCEMENT_CONFIG[announcement.type];
    const date = new Date(announcement.createdAt).toLocaleString();
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'announcement-item';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'announcement-item-content';
    
    const headerDiv = document.createElement('div');
    headerDiv.style.marginBottom = '8px';
    
    const badge = document.createElement('span');
    badge.className = `announcement-type-badge type-${announcement.type}`;
    badge.textContent = announcement.type.toUpperCase();
    headerDiv.appendChild(badge);
    
    if (announcement.dismissible) {
      const dismissText = document.createElement('span');
      dismissText.style.fontSize = '12px';
      dismissText.style.color = '#6b7280';
      dismissText.textContent = ' • Dismissible';
      headerDiv.appendChild(dismissText);
    }
    
    const messageP = document.createElement('p');
    messageP.style.fontSize = '14px';
    messageP.style.color = '#111827';
    messageP.style.marginBottom = '4px';
    messageP.textContent = announcement.message;
    
    const dateP = document.createElement('p');
    dateP.style.fontSize = '12px';
    dateP.style.color = '#6b7280';
    dateP.textContent = `Created: ${date}`;
    
    contentDiv.appendChild(headerDiv);
    contentDiv.appendChild(messageP);
    contentDiv.appendChild(dateP);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.style.padding = '8px 16px';
    deleteBtn.style.fontSize = '12px';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteAnnouncementById(announcement.id));
    
    itemDiv.appendChild(contentDiv);
    itemDiv.appendChild(deleteBtn);
    
    announcementsList.appendChild(itemDiv);
  });
}

/**
 * Deletes an announcement
 */
function deleteAnnouncementById(announcementId) {
  if (confirm('Are you sure you want to delete this announcement?')) {
    window.Announcements.delete(announcementId);
    loadAnnouncements();
    showToast('Announcement deleted', 'success');
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
    showToast('Analytics data refreshed (demo mode)', 'info');
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
  showToast('Check the admin panel docs for Cloudflare Analytics setup instructions', 'info');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdminPanel);
} else {
  initializeAdminPanel();
}
