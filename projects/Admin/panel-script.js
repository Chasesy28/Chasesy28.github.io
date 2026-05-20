import {
  createAnnouncement as saveAnnouncement,
  deleteAnnouncement as removeAnnouncement,
  getAllAnnouncements,
  getSession,
  getSessionExpirationMinutes,
  getSupabaseConfigError,
  initializeAuthFromSupabase,
  isAuthenticated,
  isSupabaseConfigured,
  loginWithGoogle,
  logout as supabaseLogout,
  refreshSession,
} from "./panel-supabase.js";

let loginModal;
let loginForm;
let loginError;
let loginSubmitButton;
let googleLoginBtn;
let adminContent;
let logoutBtn;
let sessionEmailEl;
let sessionExpirationEl;
let announcementModal;
let announcementForm;
let announcementPreview;
let createAnnouncementBtn;
let cancelAnnouncementBtn;
let announcementsList;
let noAnnouncementsMsg;
let refreshAnalyticsBtn;
let viewFullDashboardBtn;
let analyticsSetupLink;

const ANNOUNCEMENT_CONFIG = {
  info: { icon: "ℹ️", color: "#4a9eff" },
  success: { icon: "✓", color: "#10b981" },
  warning: { icon: "⚠️", color: "#f59e0b" },
  error: { icon: "❌", color: "#ef4444" },
};

function initializeAdminPanel() {
  loginModal = document.getElementById("loginModal");
  loginForm = document.getElementById("loginForm");
  loginError = document.getElementById("loginError");
  googleLoginBtn = document.getElementById("googleLoginBtn");
  loginSubmitButton = googleLoginBtn;
  adminContent = document.getElementById("adminContent");
  logoutBtn = document.getElementById("logoutBtn");
  sessionEmailEl = document.getElementById("sessionEmail");
  sessionExpirationEl = document.getElementById("sessionExpiration");
  announcementModal = document.getElementById("announcementModal");
  announcementForm = document.getElementById("announcementForm");
  announcementPreview = document.getElementById("announcementPreview");
  createAnnouncementBtn = document.getElementById("createAnnouncementBtn");
  cancelAnnouncementBtn = document.getElementById("cancelAnnouncementBtn");
  announcementsList = document.getElementById("announcementsList");
  noAnnouncementsMsg = document.getElementById("noAnnouncementsMsg");
  refreshAnalyticsBtn = document.getElementById("refreshAnalyticsBtn");
  viewFullDashboardBtn = document.getElementById("viewFullDashboardBtn");
  analyticsSetupLink = document.getElementById("analyticsSetupLink");

  setupEventListeners();

  if (!isSupabaseConfigured()) {
    showLoginModal(getSupabaseConfigError());
    return;
  }

  if (isAuthenticated()) {
    showAdminContent();
  } else {
    showLoginModal();
    void tryRestoreSupabaseSession();
  }
}

function setupEventListeners() {
  loginForm.addEventListener("submit", handleLogin);
  googleLoginBtn.addEventListener("click", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);
  createAnnouncementBtn.addEventListener("click", showAnnouncementModal);
  cancelAnnouncementBtn.addEventListener("click", hideAnnouncementModal);
  announcementForm.addEventListener("submit", handleCreateAnnouncement);

  document
    .getElementById("announcementMessage")
    .addEventListener("input", updateAnnouncementPreview);
  document
    .getElementById("announcementType")
    .addEventListener("change", updateAnnouncementPreview);

  refreshAnalyticsBtn.addEventListener("click", refreshAnalytics);
  viewFullDashboardBtn.addEventListener("click", openCloudflareAnalytics);
  analyticsSetupLink.addEventListener("click", showAnalyticsSetup);
}

function showLoginModal(message = "") {
  loginModal.classList.remove("hidden");
  adminContent.classList.add("hidden");
  loginForm.reset();
  loginSubmitButton.disabled = !isSupabaseConfigured();
  loginSubmitButton.textContent = isSupabaseConfigured()
    ? "Continue with Google"
    : "Supabase Not Configured";

  if (message) {
    loginError.textContent = message;
    loginError.style.display = "block";
  } else {
    loginError.textContent = "";
    loginError.style.display = "none";
  }
}

function showAdminContent() {
  loginModal.classList.add("hidden");
  adminContent.classList.remove("hidden");

  refreshSession();

  const session = getSession();
  sessionEmailEl.textContent = session?.email ?? "-";
  sessionExpirationEl.textContent = String(getSessionExpirationMinutes() ?? 0);

  void loadAnnouncements();
  loadAnalytics();
}

async function tryRestoreSupabaseSession() {
  try {
    const admin = await initializeAuthFromSupabase();
    if (admin) {
      showAdminContent();
    }
  } catch (error) {
    showLoginModal(error instanceof Error ? error.message : "Unable to validate your Supabase session.");
  }
}

async function handleLogin(e) {
  e.preventDefault();

  if (!isSupabaseConfigured()) {
    showLoginModal(getSupabaseConfigError());
    return;
  }

  loginSubmitButton.disabled = true;
  loginSubmitButton.textContent = "Redirecting...";
  loginError.style.display = "none";

  try {
    await loginWithGoogle();
  } catch (error) {
    loginSubmitButton.disabled = false;
    loginSubmitButton.textContent = "Continue with Google";
    loginError.textContent =
      error instanceof Error ? error.message : "Google sign-in failed.";
    loginError.style.display = "block";
  }
}

async function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    await supabaseLogout();
    showLoginModal();
  }
}

function showAnnouncementModal() {
  announcementModal.classList.remove("hidden");
  announcementForm.reset();
  updateAnnouncementPreview();
}

function hideAnnouncementModal() {
  announcementModal.classList.add("hidden");
}

function updateAnnouncementPreview() {
  const message =
    document.getElementById("announcementMessage").value ||
    "Your announcement will appear here";
  const type = document.getElementById("announcementType").value;
  const config = ANNOUNCEMENT_CONFIG[type];

  announcementPreview.textContent = `${config.icon} ${message}`;
  announcementPreview.style.backgroundColor = config.color;
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.padding = "16px 24px";
  toast.style.borderRadius = "8px";
  toast.style.color = "white";
  toast.style.fontWeight = "600";
  toast.style.zIndex = "10000";
  toast.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
  toast.style.animation = "slideIn 0.3s ease-out";
  toast.textContent = message;

  if (type === "success") {
    toast.style.backgroundColor = "#10b981";
  } else if (type === "error") {
    toast.style.backgroundColor = "#ef4444";
  } else {
    toast.style.backgroundColor = "#4a9eff";
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function handleCreateAnnouncement(e) {
  e.preventDefault();

  const message = document.getElementById("announcementMessage").value;
  const type = document.getElementById("announcementType").value;
  const dismissible = document.getElementById("announcementDismissible").checked;
  const session = getSession();

  const announcement = await saveAnnouncement(message, type, dismissible, session?.adminId ?? null);


    const VITE_ADMIN_ROUTE = "/vite/admin";
  if (!announcement) {
    showToast("Unable to create announcement. Check your Supabase permissions.", "error");
    return;
  }

  showToast("Announcement created successfully! It will now appear site-wide.", "success");
  await loadAnnouncements();
  hideAnnouncementModal();
}

async function loadAnnouncements() {
  const announcements = await getAllAnnouncements();

  if (announcements.length === 0) {
    announcementsList.innerHTML = "";
    noAnnouncementsMsg.style.display = "block";
    return;
  }

  noAnnouncementsMsg.style.display = "none";
  announcementsList.innerHTML = "";

  announcements.forEach((announcement) => {
    const date = new Date(announcement.created_at).toLocaleString();

    const itemDiv = document.createElement("div");
    itemDiv.className = "announcement-item";

    const contentDiv = document.createElement("div");
    contentDiv.className = "announcement-item-content";

    const headerDiv = document.createElement("div");
    headerDiv.style.marginBottom = "8px";

    const badge = document.createElement("span");
    badge.className = `announcement-type-badge type-${announcement.type}`;
    badge.textContent = announcement.type.toUpperCase();
    headerDiv.appendChild(badge);

    if (announcement.dismissible) {
      const dismissText = document.createElement("span");
          window.location.replace(VITE_ADMIN_ROUTE);
      dismissText.style.color = "#6b7280";
      dismissText.textContent = " • Dismissible";
      headerDiv.appendChild(dismissText);
    }

    const messageP = document.createElement("p");
    messageP.style.fontSize = "14px";
    messageP.style.color = "#111827";
    messageP.style.marginBottom = "4px";
    messageP.textContent = announcement.message;

    const dateP = document.createElement("p");
    dateP.style.fontSize = "12px";
    dateP.style.color = "#6b7280";
    dateP.textContent = `Created: ${date}`;

    contentDiv.appendChild(headerDiv);
    contentDiv.appendChild(messageP);
    contentDiv.appendChild(dateP);
        await loginWithGoogle(VITE_ADMIN_ROUTE);
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.style.padding = "8px 16px";
    deleteBtn.style.fontSize = "12px";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this announcement?")) {
        const deleted = await removeAnnouncement(announcement.id);
        if (deleted) {
          await loadAnnouncements();
      window.location.replace(VITE_ADMIN_ROUTE);
}

function loadAnalytics() {
  document.getElementById("stat-requests").textContent = "-";
  document.getElementById("stat-bandwidth").textContent = "-";
  document.getElementById("stat-visitors").textContent = "-";
  document.getElementById("stat-cache").textContent = "-";

  console.log("[AdminPanel] Analytics API integration pending");
}

function refreshAnalytics() {
  refreshAnalyticsBtn.disabled = true;
  refreshAnalyticsBtn.textContent = "Refreshing...";

  setTimeout(() => {
    loadAnalytics();
    refreshAnalyticsBtn.disabled = false;
    refreshAnalyticsBtn.textContent = "Refresh Analytics";
    showToast("Analytics data refreshed (demo mode)", "info");
  }, 1000);
}

function openCloudflareAnalytics() {
  window.open("https://dash.cloudflare.com/", "_blank");
}

function showAnalyticsSetup(e) {
  e.preventDefault();
  showToast(
    "Check the admin panel docs for Cloudflare Analytics setup instructions",
    "info",
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAdminPanel);
} else {
  initializeAdminPanel();
}
