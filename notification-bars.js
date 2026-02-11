/**
 * Notification Bars Manager
 * Dynamically creates and manages offline and update notification bars
 */

// Constants
const UPDATE_CHECK_INTERVAL_MS = 1 * 60 * 1000; // Check for updates every 1 minute

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
  // Using CSS classes for all styling:
  // - 'offline-banner' provides base positioning and layout
  // - 'update-banner' overrides colors for blue theme
  // - 'show' makes the banner visible
  updateBanner.className = "offline-banner update-banner show";

  // Create the update message text
  const messageText = document.createTextNode("🔄 New version available! ");
  updateBanner.appendChild(messageText);

  // Create the update button
  const updateButton = document.createElement("button");
  updateButton.textContent = "Update Now";
  updateButton.className = "update-banner-button";

  // Attach event listener programmatically
  updateButton.addEventListener("click", () => {
    window.location.reload();
  });

  updateBanner.appendChild(updateButton);

  // Insert at the beginning of the body
  document.body.insertBefore(updateBanner, document.body.firstChild);

  return updateBanner;
}

/**
 * Initializes the offline status monitoring
 * Creates the offline banner when needed and manages its visibility
 */
function initializeOfflineMonitoring() {
  let offlineBanner = null;
  const header = document.getElementById("header");

  // Log if header is missing but continue initialization
  if (!header) {
    console.warn(
      "[NotificationBars] Header element not found - notification bars will work without header adjustments",
    );
  }

  function updateOnlineStatus() {
    // Calculate total height for scroll-padding, starting with header height if it exists
    let totalHeight = 0;
    if (header) {
      const headerHeight = parseFloat(window.getComputedStyle(header).height);
      totalHeight = headerHeight;
    }

    if (!navigator.onLine) {
      console.log("[NotificationBars] Network status: OFFLINE");

      // Create the banner if it doesn't exist
      if (!offlineBanner) {
        offlineBanner = createOfflineBanner();
      }

      offlineBanner.classList.add("show");
      document.body.classList.add("offline-mode");

      const offlineBannerHeight = parseFloat(
        window.getComputedStyle(offlineBanner).height,
      );
      totalHeight += offlineBannerHeight;

      // Only adjust header position if header exists
      if (header) {
        header.style.setProperty("top", `${offlineBannerHeight}px`);
      }
      document.documentElement.style.setProperty(
        "scroll-padding-top",
        `${totalHeight}px`,
      );
    } else {
      console.log("[NotificationBars] Network status: ONLINE");

      if (offlineBanner) {
        offlineBanner.classList.remove("show");
      }
      document.body.classList.remove("offline-mode");

      // Only reset header position if header exists
      if (header) {
        header.style.setProperty("top", "0px");
      }
      document.documentElement.style.setProperty(
        "scroll-padding-top",
        `${totalHeight}px`,
      );
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

/**
 * AUTO-INITIALIZATION
 * Automatically initializes notification bars when the DOM is ready
 */
(function autoInitialize() {
  // Wait for DOM to be fully loaded before initializing offline monitoring
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOffline);
  } else {
    // DOM is already loaded
    initOffline();
  }

  function initOffline() {
    // Initialize offline monitoring immediately
    initializeOfflineMonitoring();
  }

  // Initialize service worker - wait for window load event if not already loaded
  if ("serviceWorker" in navigator) {
    function initServiceWorker() {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "[NotificationBars] Service Worker registered with scope:",
            registration.scope,
          );

          // Initialize update monitoring
          initializeUpdateMonitoring(registration);
        })
        .catch((error) =>
          console.error(
            "[NotificationBars] Service Worker registration failed:",
            error,
          ),
        );

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SW_UPDATED") {
          console.log("[NotificationBars] Service Worker updated:", event.data);
        }
      });
    }

    // Register service worker after window load event
    if (document.readyState === "complete") {
      // Window already loaded
      initServiceWorker();
    } else {
      window.addEventListener("load", initServiceWorker);
    }
  }
})();
