/**
 * Notification Bars Manager
 * Dynamically creates and manages offline and update notification bars
 */

// Constants
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check for updates every 60 minutes

/**
 * Calculates the total height of all visible notification banners
 * @returns {number} Total height of visible banners in pixels
 */
function getVisibleBannerHeight() {
  const banners = Array.from(document.querySelectorAll(".offline-banner.show"));
  return banners.reduce((total, banner) => total + banner.offsetHeight, 0);
}

/**
 * Applies layout offsets so the header/content sit below notification banners
 */
function applyNotificationOffsets() {
  const header = document.getElementById("header");
  if (!header) {
    console.error("[NotificationBars] Header element not found");
    return;
  }

  const bannerHeight = getVisibleBannerHeight();
  const headerHeight = header.offsetHeight;

  header.style.setProperty("top", `${bannerHeight}px`);
  document.body.style.setProperty("padding-top", `${bannerHeight}px`);
  document.documentElement.style.setProperty(
    "scroll-padding-top",
    `${headerHeight + bannerHeight}px`,
  );
}

/**
 * Creates an offline notification bar when the user is offline
 * @returns {HTMLElement} The created offline banner element
 */
function createOfflineBanner() {
  const offlineBanner = document.createElement("div");
  offlineBanner.id = "offlineBanner";
  offlineBanner.className = "offline-banner";
  offlineBanner.textContent =
    "⚠️ You are currently offline. Some features may not be available.";

  // Insert at the beginning of the body
  document.body.insertBefore(offlineBanner, document.body.firstChild);

  return offlineBanner;
}

/**
 * Creates an update notification bar when a new version is available
 * @returns {HTMLElement} The created update banner element
 */
function createUpdateBanner() {
  const updateBanner = document.createElement("div");
  // Note: Reusing 'offline-banner' class which provides the base styling for all notification bars
  updateBanner.className = "offline-banner show";
  updateBanner.style.backgroundColor = "#4a9eff";
  updateBanner.style.color = "white";

  // Create the update message text
  const messageText = document.createTextNode("🔄 New version available! ");
  updateBanner.appendChild(messageText);

  // Create the update button
  const updateButton = document.createElement("button");
  updateButton.textContent = "Update Now";
  updateButton.style.marginLeft = "10px";
  updateButton.style.padding = "5px 15px";
  updateButton.style.background = "white";
  updateButton.style.color = "#4a9eff";
  updateButton.style.border = "none";
  updateButton.style.borderRadius = "4px";
  updateButton.style.cursor = "pointer";
  updateButton.style.fontWeight = "bold";

  // Attach event listener programmatically
  updateButton.addEventListener("click", () => {
    window.location.reload();
  });

  updateBanner.appendChild(updateButton);

  // Insert at the beginning of the body
  document.body.insertBefore(updateBanner, document.body.firstChild);

  applyNotificationOffsets();

  return updateBanner;
}

/**
 * Initializes the offline status monitoring
 * Creates the offline banner when needed and manages its visibility
 */
function initializeOfflineMonitoring() {
  let offlineBanner = null;

  function updateOnlineStatus() {
    if (!navigator.onLine) {
      console.log("[NotificationBars] Network status: OFFLINE");

      // Create the banner if it doesn't exist
      if (!offlineBanner) {
        offlineBanner = createOfflineBanner();
      }

      offlineBanner.classList.add("show");
      document.body.classList.add("offline-mode");

      applyNotificationOffsets();
    } else {
      console.log("[NotificationBars] Network status: ONLINE");

      if (offlineBanner) {
        offlineBanner.classList.remove("show");
      }
      document.body.classList.remove("offline-mode");

      applyNotificationOffsets();
    }
  }

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus(); // Check initial status
}

/**
 * Initializes the service worker update monitoring
 * Creates the update banner when a new version is available
 * @param {ServiceWorkerRegistration} registration - The service worker registration object
 */
function initializeUpdateMonitoring(registration) {
  let updateBannerCreated = false; // Track if update banner already exists

  // Check for updates on page load
  registration.update();

  // Listen for updates to the service worker
  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;
    console.log("[NotificationBars] Service Worker update found");

    newWorker.addEventListener("statechange", () => {
      if (
        newWorker.state === "installed" &&
        navigator.serviceWorker.controller &&
        !updateBannerCreated
      ) {
        console.log("[NotificationBars] New Service Worker installed");

        // Create and show update notification to user
        createUpdateBanner();
        updateBannerCreated = true; // Prevent creating multiple banners
      }
    });
  });

  // Check for updates periodically (every 60 minutes)
  setInterval(() => {
    console.log("[NotificationBars] Checking for Service Worker updates...");
    registration.update();
  }, UPDATE_CHECK_INTERVAL_MS);
}

// Export functions for use in index.html
window.NotificationBars = {
  initializeOfflineMonitoring,
  initializeUpdateMonitoring,
  createOfflineBanner,
  createUpdateBanner,
};
