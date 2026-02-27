/**
 * RESTAURANT FINDER APPLICATION (Finder.js)
 *
 * OpenStreetMap-based restaurant search with AI-powered recommendations
 *
 * Features:
 * - Search restaurants by location and cuisine type
 * - View results in list or map format
 * - Save favorites to localStorage
 * - AI chat integration for restaurant recommendations
 * - Opening hours parsing and validation
 * - Offline support through service worker
 *
 * Architecture:
 * - Uses Nominatim API for geocoding
 * - Uses Overpass API for restaurant data
 * - Uses Leaflet.js for interactive maps
 * - OpenAI-compatible API for AI chat features
 */

// ========================================
// GLOBAL STATE MANAGEMENT
// ========================================

let lastResults = []; // Cached search results for sorting/filtering
let detailMap = null; // Leaflet map instance for restaurant modal
let overviewMap = null; // Leaflet map instance for results overview
let currentView = "list"; // Current view mode: 'list', 'map', or 'favorites'
let favorites = []; // Array of saved favorite restaurants
let modalAbortController = null; // AbortController for cleanup of modal event listeners
const FAVORITES_STORAGE_KEY = "restaurant_favorites";
const API_KEY_SESSION_KEY = "copilot_api_key_session"; // Session-only storage for API key (security)
let conversationHistory = []; // Chat history for AI conversation continuity
let currentRestaurantContext = null; // Current restaurant context for AI chat

// ========================================
// AI CONFIGURATION
// ========================================

/**
 * System message that defines AI assistant behavior
 * Instructs AI to provide concise restaurant information
 */
const AI_SYSTEM_MESSAGE = `You are a helpful restaurant information assistant. You provide concise, helpful information about restaurants including reviews, recommendations, menu highlights, and general atmosphere. Keep responses brief but informative (2-3 paragraphs max). If you don't have specific information about a restaurant, provide general guidance based on the cuisine type.`;

/**
 * Generates the initial AI query for a restaurant
 * @param {object} data - Restaurant data {name, cuisine, address}
 * @returns {string} The formatted query string
 */
function buildInitialQuery(data) {
  const cuisineDisplay = data.cuisine.replace(/_/g, " ");
  return `Tell me about the restaurant "${data.name}" which serves ${cuisineDisplay} cuisine. Located at: ${data.address}. What's the vibe, what should I order, and any tips for visiting?`;
}

// ========================================
// FAVORITES MANAGEMENT
// ========================================

/**
 * Loads saved favorites from localStorage
 * Falls back to empty array if loading fails
 */
function loadFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      favorites = JSON.parse(stored);
      console.log(
        "[Finder] Loaded",
        favorites.length,
        "favorites from storage",
      );
    }
  } catch (e) {
    console.error("[Finder] Error loading favorites:", e);
    favorites = [];
  }
}

/**
 * Saves favorites to localStorage and cookie backup
 * Cookie backup provides redundancy with security flags
 */
function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    // Also save to cookie for backup/persistence across localStorage clears
    // SameSite=Strict prevents CSRF attacks
    document.cookie = `${FAVORITES_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(favorites))};path=/;max-age=31536000;SameSite=Strict`;
    console.log("[Finder] Saved", favorites.length, "favorites to storage");
  } catch (e) {
    console.error("[Finder] Error saving favorites:", e);
  }
}

/**
 * Checks if a restaurant is in favorites
 * @param {number} id - Restaurant OSM ID
 * @returns {boolean} True if favorited
 */
function isFavorite(id) {
  return favorites.some((f) => f.id === id);
}

/**
 * Adds restaurant to favorites list
 * @param {object} data - Restaurant data to save
 */
function addToFavorites(data) {
  if (!isFavorite(data.id)) {
    favorites.push({
      id: data.id,
      name: data.name,
      cuisine: data.cuisine,
      address: data.address,
      openingHours: data.openingHours,
      lat: data.lat,
      lon: data.lon,
    });
    saveFavorites();
    console.log("[Finder] Added to favorites:", data.name);
  }
}

/**
 * Removes restaurant from favorites list
 * @param {number} id - Restaurant OSM ID to remove
 */
function removeFromFavorites(id) {
  const before = favorites.length;
  favorites = favorites.filter((f) => f.id !== id);
  saveFavorites();
  console.log(
    "[Finder] Removed from favorites, count:",
    before,
    "->",
    favorites.length,
  );
}

/**
 * Toggles favorite status of a restaurant
 * @param {object} data - Restaurant data
 * @returns {boolean} True if now favorited, false if unfavorited
 */
function toggleFavorite(data) {
  if (isFavorite(data.id)) {
    removeFromFavorites(data.id);
    return false;
  } else {
    addToFavorites(data);
    return true;
  }
}

// ========================================
// DIRECTIONS
// ========================================

/**
 * Opens Google Maps directions in new tab
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} name - Destination name
 */
function openDirections(lat, lon, name) {
  // Universal Google Maps URL that works on mobile and desktop
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=&travelmode=driving`;
  console.log("[Finder] Opening directions to:", name);
  window.open(googleMapsUrl, "_blank");
}

// Load favorites on script initialization
loadFavorites();

// ========================================
// API KEY MANAGEMENT (Session-only for security)
// ========================================

/**
 * Gets the API key from session storage
 * The key is only stored in session storage (cleared when browser closes)
 * and is never persisted to localStorage or cookies for security
 * @returns {string|null} The API key or null if not set
 */
function getApiKey() {
  try {
    return sessionStorage.getItem(API_KEY_SESSION_KEY);
  } catch (e) {
    console.error("[Finder] Error accessing session storage:", e);
    return null;
  }
}

/**
 * Sets the API key in session storage only
 * This ensures the key is cleared when the browser closes
 * @param {string} key - The API key to store
 * @returns {boolean} True if successful
 */
function setApiKey(key) {
  try {
    if (key && key.trim()) {
      sessionStorage.setItem(API_KEY_SESSION_KEY, key.trim());
      console.log(
        "[Finder] API key saved to session storage (will be cleared on browser close)",
      );
      return true;
    }
    return false;
  } catch (e) {
    console.error("[Finder] Error storing API key:", e);
    return false;
  }
}

/**
 * Clears the API key from session storage
 */
function clearApiKey() {
  try {
    sessionStorage.removeItem(API_KEY_SESSION_KEY);
    console.log("[Finder] API key cleared from session storage");
  } catch (e) {
    console.error("[Finder] Error clearing API key:", e);
  }
}

/**
 * Checks if an API key is configured
 * @returns {boolean}
 */
function hasApiKey() {
  const key = getApiKey();
  return key !== null && key.length > 0;
}

/**
 * Clears conversation history for a new restaurant context
 */
function clearConversationHistory() {
  conversationHistory = [];
  currentRestaurantContext = null;
  console.log("[Finder] Conversation history cleared");
}

// DOM Elements (declared here; assigned on DOMContentLoaded)
let sortSelect;
let searchButton;
let cityInput;
let stateInput;
let countryInput;
let cuisineInput;
let isOpenNowCheckbox;
let resultsList;
let messageOutput;
let loadingSpinner;
let getLocationButton;
let inputs;

let messageModal;
let closeMessageModalButton;
let modalMessage;
let modalTitle;

let restaurantModal;
let closeRestaurantModalButton;
let modalName;
let modalCuisine;
let modalAddress;
let modalHours;
let modalMap;
let modalMapMessage;

// New DOM Elements
let listViewBtn;
let mapViewBtn;
let favoritesViewBtn;
let mapView;
let hideUnnamedCheckbox;

/**
 * A unified function to set the loading state of a button.
 * @param {HTMLButtonElement} button - The button element to update.
 * @param {boolean} isLoading - Whether to show the loading state.
 * @param {string} [loadingText="Loading..."] - The text to display while loading.
 * @param {'light' | 'dark'} [spinnerType='light'] - 'light' for dark buttons, 'dark' for light buttons.
 */
function setButtonLoading(
  button,
  isLoading,
  loadingText = "Loading...",
  spinnerType = "light",
) {
  if (!button) return;

  if (isLoading) {
    // Store original text if it's not already stored
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }
    const spinnerClass =
      spinnerType === "light" ? "spinner-light" : "spinner-dark";
    button.disabled = true;
    button.innerHTML = `<span class="flex justify-center items-center"><div class="spinner ${spinnerClass} mr-2"></div>${loadingText}</span>`;
  } else {
    // Restore original text
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
    button.disabled = false;
  }
}

/**
 * Sets the global page loading state for the results section.
 * @param {boolean} isLoading - Whether to show the loading state.
 */
function setPageLoading(isLoading) {
  if (isLoading) {
    resultsList.innerHTML = ""; // Clear previous results
    messageOutput.classList.add("hidden"); // Hide any messages
    loadingSpinner.classList.remove("hidden"); // Show spinner
  } else {
    loadingSpinner.classList.add("hidden"); // Hide spinner
    messageOutput.classList.remove("hidden"); // Show message element (it might be empty)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  function initFinderThemeToggle() {
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (!darkModeToggle) return;

    const html = document.documentElement;
    const sunIcon = darkModeToggle.querySelector(".sun-icon");
    const moonIcon = darkModeToggle.querySelector(".moon-icon");

    function updateIcons(theme) {
      if (!sunIcon || !moonIcon) return;
      if (theme === "dark") {
        sunIcon.style.display = "none";
        moonIcon.style.display = "inline";
      } else {
        sunIcon.style.display = "inline";
        moonIcon.style.display = "none";
      }
    }

    const savedTheme = localStorage.getItem("theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";

    html.classList.remove("light", "dark");
    html.classList.add(initialTheme);
    updateIcons(initialTheme);

    darkModeToggle.addEventListener("click", () => {
      const isDark = html.classList.contains("dark");
      const nextTheme = isDark ? "light" : "dark";
      html.classList.remove("light", "dark");
      html.classList.add(nextTheme);
      localStorage.setItem("theme", nextTheme);
      updateIcons(nextTheme);
    });
  }

  initFinderThemeToggle();

  // Assign DOM elements now that DOM is ready
  sortSelect = document.getElementById("sortSelect");
  searchButton = document.getElementById("searchButton");
  cityInput = document.getElementById("city");
  stateInput = document.getElementById("state");
  countryInput = document.getElementById("country");
  cuisineInput = document.getElementById("cuisine");
  isOpenNowCheckbox = document.getElementById("isOpenNow");
  resultsList = document.getElementById("resultsList");
  messageOutput = document.getElementById("message");
  loadingSpinner = document.getElementById("loading");
  getLocationButton = document.getElementById("getLocationButton");
  inputs = [countryInput, stateInput, cityInput, cuisineInput];

  messageModal = document.getElementById("messageModal");
  closeMessageModalButton = document.getElementById("closeMessageModal");
  modalMessage = document.getElementById("modalMessage");
  modalTitle = document.getElementById("modalTitle");

  restaurantModal = document.getElementById("restaurantModal");
  closeRestaurantModalButton = document.getElementById("closeRestaurantModal");
  modalName = document.getElementById("modalName");
  modalCuisine = document.getElementById("modalCuisine");
  modalAddress = document.getElementById("modalAddress");
  modalHours = document.getElementById("modalHours");
  modalMap = document.getElementById("modalMap");
  modalMapMessage = document.getElementById("modalMapMessage");

  listViewBtn = document.getElementById("listViewBtn");
  mapViewBtn = document.getElementById("mapViewBtn");
  favoritesViewBtn = document.getElementById("favoritesViewBtn");
  mapView = document.getElementById("mapView");
  hideUnnamedCheckbox = document.getElementById("hideUnnamed");

  // --- Geolocation Logic ---
  getLocationButton.addEventListener("click", getCurrentLocation);

  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      showMessageModal(
        "Geolocation Error",
        "Geolocation is not supported by your browser.",
      );
      return;
    }

    setButtonLoading(getLocationButton, true, "Getting Location...", "dark");

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 1000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;

      const response = await fetch(nominatimUrl);
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const country = addr.country || "USA";
        const state = addr.state || "";
        const city =
          addr.city || addr.town || addr.village || addr.hamlet || "";

        if (city) {
          cityInput.value = city;
          stateInput.value = state;
          countryInput.value = country;
          messageOutput.textContent = `Location set to ${city}, ${state}.`;
          messageOutput.classList.remove("hidden"); // Ensure it's visible
          loadingSpinner.classList.add("hidden"); // Hide loading
          resultsList.innerHTML = ""; // Clear results
        } else {
          throw new Error("Could not find city for your location.");
        }
      } else {
        throw new Error("Could not parse address from location data.");
      }
    } catch (error) {
      console.error("Geolocation error:", error);
      let userMessage =
        "Could not get your location. Please check your browser permissions.";
      if (error.code === 1)
        userMessage =
          "You denied location access. Please allow it in your browser settings.";
      else if (error.code === 2)
        userMessage = "Your location is currently unavailable.";
      else if (error.code === 3)
        userMessage = "Getting your location timed out. Please try again.";
      else if (error.message) userMessage = error.message;
      showMessageModal("Geolocation Error", userMessage);
    } finally {
      setButtonLoading(getLocationButton, false);
    }
  }

  // --- Message Modal Logic ---
  function showMessageModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    messageModal.classList.remove("hidden");
    setTimeout(() => {
      messageModal.style.opacity = "1";
      messageModal.querySelector(".transform").style.transform = "scale(1)";
    }, 10);
  }

  function hideMessageModal() {
    messageModal.style.opacity = "0";
    messageModal.querySelector(".transform").style.transform = "scale(0.95)";
    setTimeout(() => {
      messageModal.classList.add("hidden");
    }, 300);
  }

  closeMessageModalButton.addEventListener("click", hideMessageModal);
  messageModal.addEventListener("click", (e) => {
    if (e.target === messageModal) {
      hideMessageModal();
    }
  });

  // --- Restaurant Modal Logic ---
  function showRestaurantModal(data) {
    // Abort any previous modal event listeners
    if (modalAbortController) {
      modalAbortController.abort();
    }
    modalAbortController = new AbortController();
    const signal = modalAbortController.signal;

    modalName.textContent = data.name;
    modalCuisine.textContent = data.cuisine.replace(/_/g, " ");
    modalAddress.textContent = data.address;
    modalHours.textContent = data.openingHours || "Not specified";

    // --- Favorites Button Setup ---
    const favBtn = document.getElementById("modalFavoriteBtn");
    if (isFavorite(data.id)) {
      favBtn.textContent = "★";
      favBtn.classList.add("favorited");
      favBtn.title = "Remove from favorites";
    } else {
      favBtn.textContent = "☆";
      favBtn.classList.remove("favorited");
      favBtn.title = "Add to favorites";
    }

    favBtn.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        const isFav = toggleFavorite(data);
        if (isFav) {
          favBtn.textContent = "★";
          favBtn.classList.add("favorited");
          favBtn.title = "Remove from favorites";
        } else {
          favBtn.textContent = "☆";
          favBtn.classList.remove("favorited");
          favBtn.title = "Add to favorites";
        }
        // Refresh display if on favorites view
        if (currentView === "favorites") {
          displayFavorites();
        }
      },
      { signal },
    );

    // --- Directions Button Setup ---
    const dirBtn = document.getElementById("modalDirectionsBtn");
    if (data.lat && data.lon) {
      dirBtn.classList.remove("hidden");
      dirBtn.addEventListener(
        "click",
        () => {
          openDirections(data.lat, data.lon, data.name);
        },
        { signal },
      );
    } else {
      dirBtn.classList.add("hidden");
    }

    // --- AI Chat Section Setup ---
    const modalVibeButton = document.getElementById("modalVibeButton");
    const configureApiBtn = document.getElementById("configureApiBtn");
    const modalChatMessages = document.getElementById("modalChatMessages");
    const modalChatInputContainer = document.getElementById(
      "modalChatInputContainer",
    );
    const modalChatInput = document.getElementById("modalChatInput");
    const modalChatSendBtn = document.getElementById("modalChatSendBtn");
    const modalClearChatBtn = document.getElementById("modalClearChatBtn");

    // Restaurant context for AI
    const restaurantContext = {
      name: data.name,
      cuisine: data.cuisine,
      address: data.address,
    };

    // Reset chat section
    modalChatMessages.innerHTML = "";
    modalChatMessages.style.display = "none";
    modalChatInputContainer.style.display = "none";
    modalVibeButton.style.display = "block";
    setButtonLoading(modalVibeButton, false);
    modalVibeButton.textContent = "🤖 Ask AI for Info";

    // Configure API button
    configureApiBtn.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        showApiKeyModal();
      },
      { signal },
    );

    // Initial query button
    modalVibeButton.addEventListener(
      "click",
      async () => {
        if (!hasApiKey()) {
          showApiKeyModal();
          return;
        }

        setButtonLoading(modalVibeButton, true, "Asking AI...", "dark");

        const initialQuery = buildInitialQuery(data);

        try {
          const response = await sendChatMessage(
            initialQuery,
            restaurantContext,
            true,
          );

          // Show chat interface
          modalChatMessages.style.display = "block";
          modalChatInputContainer.style.display = "block";
          modalVibeButton.style.display = "none";

          // Render the initial exchange
          renderChatMessage(
            "user",
            `Tell me about ${data.name}`,
            modalChatMessages,
          );
          renderChatMessage("assistant", response, modalChatMessages);
        } catch (error) {
          console.error("AI Chat Error:", error);
          setButtonLoading(modalVibeButton, false);
          modalChatMessages.innerHTML = `<p class="text-red-500 dark:text-red-400 text-xs">Error: ${error.message}</p>`;
          modalChatMessages.style.display = "block";
        }
      },
      { signal },
    );

    // Send follow-up message
    async function sendFollowUp() {
      const message = modalChatInput.value.trim();
      if (!message) return;

      // Clear input
      modalChatInput.value = "";

      // Render user message immediately
      renderChatMessage("user", message, modalChatMessages);

      // Show loading state
      const loadingDiv = document.createElement("div");
      loadingDiv.className =
        "chat-loading text-gray-500 dark:text-gray-400 text-sm";
      loadingDiv.innerHTML =
        '<span class="animate-pulse">🤖 Thinking...</span>';
      modalChatMessages.appendChild(loadingDiv);
      modalChatMessages.scrollTop = modalChatMessages.scrollHeight;

      try {
        const response = await sendChatMessage(
          message,
          restaurantContext,
          false,
        );

        // Remove loading indicator
        loadingDiv.remove();

        // Render AI response
        renderChatMessage("assistant", response, modalChatMessages);
      } catch (error) {
        console.error("AI Chat Error:", error);
        loadingDiv.innerHTML = `<span class="text-red-500 dark:text-red-400">Error: ${error.message}</span>`;
      }
    }

    modalChatSendBtn.addEventListener("click", sendFollowUp, { signal });

    modalChatInput.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          sendFollowUp();
        }
      },
      { signal },
    );

    // Clear conversation
    modalClearChatBtn.addEventListener(
      "click",
      () => {
        clearConversationHistory();
        modalChatMessages.innerHTML = "";
        modalChatMessages.style.display = "none";
        modalChatInputContainer.style.display = "none";
        modalVibeButton.style.display = "block";
        setButtonLoading(modalVibeButton, false);
        modalVibeButton.textContent = "🤖 Ask AI for Info";
      },
      { signal },
    );

    if (detailMap) {
      detailMap.remove();
      detailMap = null;
    }

    if (typeof L === "undefined") {
      console.error("Leaflet.js (L) is not loaded!");
      modalMap.style.display = "none";
      modalMapMessage.classList.remove("hidden");
      modalMapMessage.textContent = "Map library failed to load.";
    } else if (data.lat && data.lon) {
      modalMap.style.display = "block";
      modalMapMessage.classList.add("hidden");

      detailMap = L.map("modalMap").setView([data.lat, data.lon], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(detailMap);
      L.marker([data.lat, data.lon]).addTo(detailMap);
    } else {
      modalMap.style.display = "none";
      modalMapMessage.textContent = "Map data not available for this location.";
      modalMapMessage.classList.remove("hidden");
    }

    restaurantModal.classList.remove("hidden");
    setTimeout(() => {
      restaurantModal.style.opacity = "1";
      restaurantModal.querySelector(".transform").style.transform = "scale(1)";
      if (detailMap) {
        detailMap.invalidateSize();
      }
    }, 10);
  }

  function hideRestaurantModal() {
    restaurantModal.style.opacity = "0";
    restaurantModal.querySelector(".transform").style.transform = "scale(0.95)";
    setTimeout(() => {
      restaurantModal.classList.add("hidden");
      if (detailMap) {
        detailMap.remove();
        detailMap = null;
      }
    }, 300);
  }

  closeRestaurantModalButton.addEventListener("click", hideRestaurantModal);
  restaurantModal.addEventListener("click", (e) => {
    if (e.target === restaurantModal) {
      hideRestaurantModal();
    }
  });

  // --- API Key Modal Logic ---
  const apiKeyModal = document.getElementById("apiKeyModal");
  const closeApiKeyModalBtn = document.getElementById("closeApiKeyModal");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const apiEndpointInput = document.getElementById("apiEndpointInput");
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
  const clearApiKeyBtn = document.getElementById("clearApiKeyBtn");
  const apiKeyStatus = document.getElementById("apiKeyStatus");

  function showApiKeyModal() {
    // Pre-fill with existing values if any
    const existingKey = getApiKey();
    const existingEndpoint = getApiEndpoint();
    apiKeyInput.value = existingKey || "";
    apiEndpointInput.value = existingEndpoint || "";
    updateApiKeyStatus();

    apiKeyModal.classList.remove("hidden");
    setTimeout(() => {
      apiKeyModal.style.opacity = "1";
      apiKeyModal.querySelector(".transform").style.transform = "scale(1)";
    }, 10);
  }

  function hideApiKeyModal() {
    apiKeyModal.style.opacity = "0";
    apiKeyModal.querySelector(".transform").style.transform = "scale(0.95)";
    setTimeout(() => {
      apiKeyModal.classList.add("hidden");
    }, 300);
  }

  function updateApiKeyStatus() {
    if (hasApiKey()) {
      const key = getApiKey();
      // Only show 3 chars from start and 4 from end for security
      const maskedKey =
        key.substring(0, 3) + "..." + key.substring(key.length - 4);
      apiKeyStatus.textContent = `✅ API key configured: ${maskedKey}`;
      apiKeyStatus.classList.remove("text-red-500");
      apiKeyStatus.classList.add("text-green-600", "dark:text-green-400");
    } else {
      apiKeyStatus.textContent = "❌ No API key configured";
      apiKeyStatus.classList.remove("text-green-600", "dark:text-green-400");
      apiKeyStatus.classList.add("text-red-500");
    }
  }

  closeApiKeyModalBtn.addEventListener("click", hideApiKeyModal);
  apiKeyModal.addEventListener("click", (e) => {
    if (e.target === apiKeyModal) {
      hideApiKeyModal();
    }
  });

  saveApiKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    const endpoint = apiEndpointInput.value.trim();

    if (!key) {
      apiKeyStatus.textContent = "⚠️ Please enter an API key";
      apiKeyStatus.classList.add("text-red-500");
      return;
    }

    if (setApiKey(key)) {
      setApiEndpoint(endpoint);
      updateApiKeyStatus();
      setTimeout(() => {
        hideApiKeyModal();
      }, 1000);
    } else {
      apiKeyStatus.textContent = "❌ Failed to save API key";
      apiKeyStatus.classList.add("text-red-500");
    }
  });

  clearApiKeyBtn.addEventListener("click", () => {
    clearApiKey();
    clearApiEndpoint();
    apiKeyInput.value = "";
    apiEndpointInput.value = "";
    updateApiKeyStatus();
  });

  // --- OpenAI-Compatible API Call Logic (works with Copilot, OpenAI, etc.) ---

  const API_ENDPOINT_SESSION_KEY = "copilot_api_endpoint_session";
  const DEFAULT_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

  function getApiEndpoint() {
    try {
      return (
        sessionStorage.getItem(API_ENDPOINT_SESSION_KEY) || DEFAULT_API_ENDPOINT
      );
    } catch (e) {
      return DEFAULT_API_ENDPOINT;
    }
  }

  function setApiEndpoint(endpoint) {
    try {
      if (endpoint && endpoint.trim()) {
        sessionStorage.setItem(API_ENDPOINT_SESSION_KEY, endpoint.trim());
      } else {
        sessionStorage.removeItem(API_ENDPOINT_SESSION_KEY);
      }
    } catch (e) {
      console.error("Error storing API endpoint:", e);
    }
  }

  function clearApiEndpoint() {
    try {
      sessionStorage.removeItem(API_ENDPOINT_SESSION_KEY);
    } catch (e) {
      console.error("Error clearing API endpoint:", e);
    }
  }

  /**
   * Sends a message to the AI and gets a response.
   * Supports conversation history for multi-turn chat.
   * @param {string} userMessage - The user's message
   * @param {object} restaurantContext - The restaurant context {name, cuisine, address}
   * @param {boolean} isInitialQuery - Whether this is the first query for this restaurant
   * @returns {Promise<string>} - The AI's response text
   */
  async function sendChatMessage(
    userMessage,
    restaurantContext,
    isInitialQuery = false,
  ) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error(
        'API key not configured. Click "Configure API" to set up your key.',
      );
    }

    const apiEndpoint = getApiEndpoint();

    // If this is a new restaurant, clear the conversation history
    if (
      isInitialQuery ||
      currentRestaurantContext?.name !== restaurantContext.name
    ) {
      conversationHistory = [];
      currentRestaurantContext = restaurantContext;
    }

    // Build messages array with conversation history
    const messages = [{ role: "system", content: AI_SYSTEM_MESSAGE }];

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push(msg);
    }

    // Add the new user message
    messages.push({ role: "user", content: userMessage });

    const payload = {
      model: "gpt-4o-mini", // Default model, works with most OpenAI-compatible APIs
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    };

    const response = await callOpenAICompatibleAPI(
      apiEndpoint,
      apiKey,
      payload,
    );

    // Store the conversation for follow-up
    conversationHistory.push({ role: "user", content: userMessage });
    conversationHistory.push({ role: "assistant", content: response });

    return response;
  }

  /**
   * Calls an OpenAI-compatible API with exponential backoff.
   * @param {string} endpoint - The API endpoint URL
   * @param {string} apiKey - The API key
   * @param {object} payload - The request payload
   * @param {number} [maxRetries=3] - Maximum number of retries
   * @returns {Promise<string>} - The response text
   */
  async function callOpenAICompatibleAPI(
    endpoint,
    apiKey,
    payload,
    maxRetries = 3,
  ) {
    let delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please check your API key.");
        }

        if (response.ok) {
          const result = await response.json();

          if (
            result.choices &&
            result.choices[0] &&
            result.choices[0].message
          ) {
            return result.choices[0].message.content;
          } else {
            throw new Error("Invalid API response format.");
          }
        } else if (response.status === 429 || response.status >= 500) {
          // Retryable error
          console.warn(
            `API error: ${response.status}. Retrying in ${delay / 1000}s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          // Non-retryable error
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || response.statusText;
          throw new Error(`API error: ${response.status} - ${errorMessage}`);
        }
      } catch (error) {
        if (
          error.message.includes("Authentication") ||
          error.message.includes("API key")
        ) {
          throw error; // Don't retry auth errors
        }
        console.error(`API call attempt ${i + 1} failed:`, error.message);
        if (i === maxRetries - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    throw new Error("API call failed after all retries.");
  }

  /**
   * Renders a chat message to the chat container
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - The message content
   * @param {HTMLElement} container - The container to append to
   */
  function renderChatMessage(role, content, container) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${role === "user" ? "text-right" : ""} mb-3`;

    const bubble = document.createElement("div");
    bubble.className =
      role === "user"
        ? "inline-block bg-indigo-100 dark:bg-indigo-900/50 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg max-w-[85%] text-left"
        : "inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg max-w-[85%]";

    // Simple markdown-like formatting
    let formattedContent = content
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");

    bubble.innerHTML = `<span class="text-xs font-semibold ${role === "user" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}">${role === "user" ? "You" : "🤖 AI"}</span><br>${formattedContent}`;

    messageDiv.appendChild(bubble);
    container.appendChild(messageDiv);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  // --- OSM Search Logic (the acutual code)---

  searchButton.addEventListener("click", searchOSM);
  inputs.forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchOSM();
      }
    });
  });

  sortSelect.addEventListener("change", () => {
    if (currentView === "favorites") {
      displayFavorites();
    } else if (lastResults.length > 0) {
      displayResults(lastResults); // Re-sort and display
    }
  });

  // --- View Toggle Logic ---
  function setActiveView(view) {
    currentView = view;

    // Update button styles
    const buttons = [listViewBtn, mapViewBtn, favoritesViewBtn];
    buttons.forEach((btn) => {
      btn.classList.remove("bg-indigo-600", "dark:bg-indigo-500", "text-white");
      btn.classList.add(
        "bg-gray-300",
        "dark:bg-gray-600",
        "text-gray-700",
        "dark:text-gray-200",
      );
    });

    if (view === "list") {
      listViewBtn.classList.remove(
        "bg-gray-300",
        "dark:bg-gray-600",
        "text-gray-700",
        "dark:text-gray-200",
      );
      listViewBtn.classList.add(
        "bg-indigo-600",
        "dark:bg-indigo-500",
        "text-white",
      );
      mapView.classList.remove("active");
      resultsList.classList.remove("hidden");
      displayResults(lastResults);
    } else if (view === "map") {
      mapViewBtn.classList.remove(
        "bg-gray-300",
        "dark:bg-gray-600",
        "text-gray-700",
        "dark:text-gray-200",
      );
      mapViewBtn.classList.add(
        "bg-indigo-600",
        "dark:bg-indigo-500",
        "text-white",
      );
      resultsList.classList.add("hidden");
      mapView.classList.add("active");
      displayMapView(lastResults);
    } else if (view === "favorites") {
      favoritesViewBtn.classList.remove(
        "bg-gray-300",
        "dark:bg-gray-600",
        "text-gray-700",
        "dark:text-gray-200",
      );
      favoritesViewBtn.classList.add(
        "bg-indigo-600",
        "dark:bg-indigo-500",
        "text-white",
      );
      mapView.classList.remove("active");
      resultsList.classList.remove("hidden");
      displayFavorites();
    }
  }

  listViewBtn.addEventListener("click", () => setActiveView("list"));
  mapViewBtn.addEventListener("click", () => setActiveView("map"));
  favoritesViewBtn.addEventListener("click", () => setActiveView("favorites"));

  // --- Map View Logic ---
  function displayMapView(results) {
    if (overviewMap) {
      overviewMap.remove();
      overviewMap = null;
    }

    if (typeof L === "undefined") {
      messageOutput.textContent =
        "Unable to load map. Please check your internet connection and refresh the page.";
      messageOutput.classList.remove("hidden");
      return;
    }

    const filteredResults = getFilteredResults(results);

    if (filteredResults.length === 0) {
      messageOutput.textContent =
        "No results with location data to display on map.";
      messageOutput.classList.remove("hidden");
      return;
    }

    // Filter results with valid coordinates
    const mappableResults = filteredResults.filter((r) => r.lat && r.lon);

    if (mappableResults.length === 0) {
      messageOutput.textContent =
        "No results with location data to display on map.";
      messageOutput.classList.remove("hidden");
      return;
    }

    messageOutput.textContent = `Showing ${mappableResults.length} location(s) on map.`;
    messageOutput.classList.remove("hidden");

    // Calculate center of all points
    const avgLat =
      mappableResults.reduce((sum, r) => sum + r.lat, 0) /
      mappableResults.length;
    const avgLon =
      mappableResults.reduce((sum, r) => sum + r.lon, 0) /
      mappableResults.length;

    overviewMap = L.map("mapView").setView([avgLat, avgLon], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(overviewMap);

    // Add markers for all results
    const markers = [];
    mappableResults.forEach((data) => {
      const marker = L.marker([data.lat, data.lon]).addTo(overviewMap)
        .bindPopup(`
                     <strong>${data.name}</strong><br>
                     <em>${data.cuisine.replace(/_/g, " ")}</em><br>
                     ${data.address}<br>
                     <button class="map-popup-details-btn" data-restaurant-id="${data.id}" style="color: #4f46e5; cursor: pointer; border: none; background: none; text-decoration: underline;">View Details</button>
                 `);
      markers.push(marker);
    });

    // Event delegation for popup buttons
    mapView.addEventListener("click", handleMapPopupClick);

    // Fit map to show all markers
    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      overviewMap.fitBounds(group.getBounds().pad(0.1));
    }

    // Invalidate size after a brief delay to ensure proper rendering
    setTimeout(() => {
      if (overviewMap) {
        overviewMap.invalidateSize();
      }
    }, 100);
  }

  // Event handler for map popup buttons using event delegation
  function handleMapPopupClick(e) {
    if (e.target && e.target.classList.contains("map-popup-details-btn")) {
      const id = parseInt(e.target.dataset.restaurantId, 10);
      if (isNaN(id)) {
        console.error("Invalid restaurant ID in map popup");
        return;
      }
      const data =
        lastResults.find((r) => r.id === id) ||
        favorites.find((f) => f.id === id);
      if (data) {
        showRestaurantModal(data);
      }
    }
  }

  // --- Favorites View Logic ---
  function displayFavorites() {
    resultsList.innerHTML = "";
    mapView.classList.remove("active");

    if (favorites.length === 0) {
      messageOutput.textContent =
        "No favorites saved yet. Click the star on a restaurant to add it to your favorites.";
      messageOutput.classList.remove("hidden");
      return;
    }

    messageOutput.textContent = `You have ${favorites.length} favorite(s).`;
    messageOutput.classList.remove("hidden");

    const sortedFavorites = sortResults([...favorites], sortSelect.value);

    sortedFavorites.forEach((data) => {
      const card = createResultCard(data, true);
      resultsList.appendChild(card);
    });
  }

  // --- Hide Unnamed Filter ---
  hideUnnamedCheckbox.addEventListener("change", () => {
    if (currentView === "favorites") {
      displayFavorites();
    } else if (currentView === "map") {
      displayMapView(lastResults);
    } else {
      displayResults(lastResults);
    }
  });

  function getFilteredResults(results) {
    if (hideUnnamedCheckbox.checked) {
      return results.filter((r) => r.name && r.name !== "Unnamed Restaurant");
    }
    return results;
  }

  async function searchOSM() {
    setButtonLoading(searchButton, true, "Searching...", "light");
    setPageLoading(true); // Show global spinner, clear results
    lastResults = []; // Clear last results

    try {
      const country = countryInput.value.trim();
      const state = stateInput.value.trim();
      const city = cityInput.value.trim();
      const cuisine = cuisineInput.value.trim().toLowerCase();
      const isOpenNow = isOpenNowCheckbox.checked;

      if (!country || !city) {
        throw new Error("Country and City are required fields.");
      }

      // 1. Get Area ID for the city
      const areaId = await getAreaId(country, state, city);
      if (!areaId) {
        throw new Error(
          `Could not find location data for "${city}, ${state}, ${country}".`,
        );
      }

      // 2. Build Overpass Query
      let query = `[out:json][timeout:25];
                         area(${areaId})->.searchArea;
                         (
                           node["amenity"="restaurant"](area.searchArea);
                           way["amenity"="restaurant"](area.searchArea);
                           relation["amenity"="restaurant"](area.searchArea);
                         );
                         out center;`;

      const overpassUrl = "https://overpass-api.de/api/interpreter";

      // 3. Fetch from Overpass
      const response = await fetch(overpassUrl, {
        method: "POST",
        body: query,
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.statusText}`);
      }

      const data = await response.json();

      // 4. Process Results
      let results = data.elements.map((el) => {
        const tags = el.tags || {};
        const address = [
          tags["addr:housenumber"],
          tags["addr:street"],
          tags["addr:city"],
          tags["addr:postcode"],
        ]
          .filter(Boolean)
          .join(" "); // Filter out undefined/empty parts

        const cuisineType = (tags.cuisine || "unknown").toLowerCase();

        // Get lat/lon (node has it directly, way/relation has 'center')
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;

        return {
          id: el.id,
          name: tags.name || "Unnamed Restaurant",
          cuisine: cuisineType,
          address: address || "Address not available",
          openingHours: tags.opening_hours || "Not specified",
          isOpen: tags.opening_hours
            ? checkOpeningHours(tags.opening_hours)
            : null,
          lat: lat,
          lon: lon,
        };
      });

      // 5. Filter Results
      if (cuisine) {
        results = results.filter((r) => r.cuisine.includes(cuisine));
      }
      if (isOpenNow) {
        results = results.filter((r) => r.isOpen === true);
      }

      lastResults = results; // Save for sorting
      displayResults(results);
    } catch (error) {
      console.error("OSM Search Error:", error);
      messageOutput.textContent = `Error: ${error.message}`;
      resultsList.innerHTML = ""; // Ensure list is clear on error
    } finally {
      setButtonLoading(searchButton, false); // Always reset search button
      setPageLoading(false); // Always hide global spinner
    }
  }

  /**
   * Gets the Overpass Area ID from Nominatim.
   * @param {string} country
   * @param {string} state
   * @param {string} city
   * @returns {Promise<string>} Area ID
   */
  async function getAreaId(country, state, city) {
    const query = `city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`;
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?${query}&format=json&limit=1`;

    const response = await fetch(nominatimUrl);
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.length > 0 && data[0].osm_id) {
      // OSM Area ID = osm_id + 3600000000 (for relations) or + 2400000000 (for ways)
      // It's safer to get it from the overpass-api query
      // But for this use, we need the "area" id, which is 3600000000 + osm_id (if it's a relation)
      // We'll assume it's a relation/boundary, which is most common for cities.
      // This is a simplification.
      const osmId = data[0].osm_id;
      // Relations (most cities) need 360...
      if (data[0].osm_type === "relation") {
        return 3600000000 + osmId;
      }
      // Ways (some smaller towns) need 240...
      if (data[0].osm_type === "way") {
        return 2400000000 + osmId;
      }
      // Fallback, though less likely to work for area query
      return 3600000000 + osmId;
    } else {
      return null;
    }
  }

  /**
   * Creates a result card element
   * @param {object} data - The restaurant data
   * @param {boolean} showFavoriteIndicator - Whether to show a favorite indicator
   * @returns {HTMLElement} The card element
   */
  function createResultCard(data, showFavoriteIndicator = false) {
    const card = document.createElement("div");
    card.className =
      "bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow";

    const openStatus =
      data.isOpen === true
        ? '<span class="text-xs font-medium text-green-600 dark:text-green-400">Open</span>'
        : data.isOpen === false
          ? '<span class="text-xs font-medium text-red-600 dark:text-red-400">Closed</span>'
          : '<span class="text-xs font-medium text-gray-500 dark:text-gray-400">Hours Unknown</span>';

    const favoriteIndicator = showFavoriteIndicator
      ? '<span class="text-yellow-500 mr-2">★</span>'
      : "";
    const isFav = isFavorite(data.id);
    const favButton = `<button class="favorite-btn ${isFav ? "favorited" : ""}" title="${isFav ? "Remove from favorites" : "Add to favorites"}">${isFav ? "★" : "☆"}</button>`;

    card.innerHTML = `
                     <div>
                         <div class="flex justify-between items-center mb-2">
                             <div class="flex items-center">
                                 ${favoriteIndicator}
                                 <h3 class="text-lg font-semibold text-indigo-700 dark:text-indigo-400">${data.name}</h3>
                             </div>
                             <div class="flex items-center gap-2">
                                 ${favButton}
                                 ${openStatus}
                             </div>
                         </div>
                         <p class="text-sm text-gray-700 dark:text-gray-200 font-medium capitalize">
                             <strong>Cuisine:</strong> ${data.cuisine.replace(/_/g, " ")}
                         </p>
                         <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                             <strong>Address:</strong> ${data.address}
                         </p>
                         <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                             <strong>Hours:</strong>
                             <span class="text-xs truncate block whitespace-nowrap overflow-hidden">
                                 ${data.openingHours || "Not specified"}
                             </span>
                         </p>
                         ${
                           data.lat && data.lon
                             ? `
                         <button class="directions-btn mt-2 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium">
                             🧭 Get Directions
                         </button>
                         `
                             : ""
                         }
                     </div>
                 `;

    // Add click listener for favorite button
    const favBtnEl = card.querySelector(".favorite-btn");
    favBtnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const nowFav = toggleFavorite(data);
      favBtnEl.textContent = nowFav ? "★" : "☆";
      favBtnEl.classList.toggle("favorited", nowFav);
      favBtnEl.title = nowFav ? "Remove from favorites" : "Add to favorites";
      // Refresh favorites view if needed
      if (currentView === "favorites") {
        displayFavorites();
      }
    });

    // Add click listener for directions button
    const dirBtn = card.querySelector(".directions-btn");
    if (dirBtn) {
      dirBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDirections(data.lat, data.lon, data.name);
      });
    }

    // Add click listener to show detail modal
    card.addEventListener("click", () => {
      showRestaurantModal(data);
    });

    return card;
  }

  /**
   * Renders the results to the list.
   * @param {Array<object>} results - The array of processed restaurant objects.
   */
  function displayResults(results) {
    setPageLoading(false); // Hide spinner
    resultsList.innerHTML = "";
    mapView.classList.remove("active");

    // Apply filter
    const filteredResults = getFilteredResults(results);

    if (filteredResults.length === 0) {
      messageOutput.textContent = "No results found matching your criteria.";
      messageOutput.classList.remove("hidden");
      return;
    }

    const hiddenCount = results.length - filteredResults.length;
    let message = `Found ${filteredResults.length} result(s).`;
    if (hiddenCount > 0) {
      message += ` (${hiddenCount} unnamed locations hidden)`;
    }
    messageOutput.textContent = message;
    messageOutput.classList.remove("hidden");

    const sortedResults = sortResults([...filteredResults], sortSelect.value);

    sortedResults.forEach((data) => {
      const card = createResultCard(data);
      resultsList.appendChild(card);
    });
  }

  /**
   * Sorts the results based on the selected value.
   * @param {Array<object>} results
   * @param {string} sortBy
   * @returns {Array<object>} Sorted results
   */
  function sortResults(results, sortBy) {
    const [key, direction] = sortBy.split("-");

    return results.sort((a, b) => {
      let valA, valB;

      switch (key) {
        case "name":
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
          break;
        case "cuisine":
          valA = (a.cuisine || "").toLowerCase();
          valB = (b.cuisine || "").toLowerCase();
          break;
        case "address":
          valA = (a.address || "").toLowerCase();
          valB = (b.address || "").toLowerCase();
          break;
        case "hours":
          valA = (a.openingHours || "").toLowerCase();
          valB = (b.openingHours || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (valA < valB) {
        return direction === "asc" ? -1 : 1;
      }
      if (valA > valB) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * COMPLEX OPENING HOURS PARSER
   *
   * Parses OpenStreetMap opening_hours format and determines if a restaurant is currently open
   *
   * OSM opening_hours format is very flexible and complex:
   * Examples:
   * - "24/7" = Always open
   * - "Mo-Fr 09:00-17:00" = Monday to Friday, 9 AM to 5 PM
   * - "Mo-Fr 09:00-17:00; Sa 10:00-14:00" = Different hours on Saturday
   * - "Mo,We,Fr 09:00-17:00" = Specific days only
   * - "20:00-02:00" = Overnight hours (closes after midnight)
   * - "Dec 25 off" = Closed on specific dates
   * - "Dec 20-Dec 28 off" = Closed for date ranges
   *
   * The parser handles:
   * 1. Day ranges (Mo-Fr) and individual days (Mo,We,Fr)
   * 2. Time ranges including overnight (20:00-02:00)
   * 3. Multiple semicolon-separated rules
   * 4. Special date closures (holidays)
   * 5. "off" and "closed" keywords
   *
   * @param {string} hoursString - The opening_hours tag value from OSM
   * @returns {boolean|null} - true (open now), false (closed now), or null (cannot determine)
   */
  function checkOpeningHours(hoursString) {
    // Handle missing or unspecified hours
    if (!hoursString || hoursString === "Not specified") {
      return null; // Cannot determine open/closed status
    }

    // Handle 24/7 - always open
    if (hoursString.toLowerCase() === "24/7") {
      console.log("[Finder] Restaurant is 24/7 - always open");
      return true;
    }

    /**
     * DATE AND TIME SETUP
     * Use the current system date/time to determine open/closed status.
     * For deterministic unit tests, this can be replaced with a fixed Date.
     */
    const now = new Date();

    // Day of week mapping (OSM format to JavaScript day index)
    const dayMap = {
      Su: 0,
      Mo: 1,
      Tu: 2,
      We: 3,
      Th: 4,
      Fr: 5,
      Sa: 6,
    };
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const currentDayIndex = now.getDay(); // 0-6 (0=Sunday)
    const currentMinutes = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

    // Date components for holiday checking
    const currentMonth = now.getMonth() + 1; // 1-12 (JavaScript uses 0-11, so add 1)
    const currentDayOfMonth = now.getDate(); // 1-31 (JavaScript getDate() already returns 1-31, no conversion needed)

    // Month name to number mapping for date-based closures
    const monthMap = {
      Jan: 1,
      Feb: 2,
      Mar: 3,
      Apr: 4,
      May: 5,
      Jun: 6,
      Jul: 7,
      Aug: 8,
      Sep: 9,
      Oct: 10,
      Nov: 11,
      Dec: 12,
    };

    /**
     * Helper function to check if current day matches a day specification
     *
     * Handles various day formats:
     * - Single days: "Mo", "Tu", etc.
     * - Day ranges: "Mo-Fr" (Monday through Friday)
     * - Comma-separated: "Mo,We,Fr" (specific days)
     * - Wraparound ranges: "Sa-Tu" (Saturday through Tuesday, wrapping around week)
     *
     * @param {string} daySet - Day specification string
     * @returns {boolean} True if current day matches the specification
     */
    function isDayInSet(daySet) {
      // Split by comma to handle multiple day specifications
      const dayParts = daySet.split(",");

      for (const part of dayParts) {
        const rangeMatch = part.trim().match(/^([a-z]{2})-([a-z]{2})$/i);

        if (rangeMatch) {
          // This is a day range like "Mo-Fr"
          const startDayIndex = dayMap[rangeMatch[1]];
          const endDayIndex = dayMap[rangeMatch[2]];

          if (startDayIndex === undefined || endDayIndex === undefined) {
            continue; // Skip malformed day range
          }

          if (startDayIndex <= endDayIndex) {
            // Standard range (e.g., Mo-Fr: 1-5)
            if (
              currentDayIndex >= startDayIndex &&
              currentDayIndex <= endDayIndex
            ) {
              return true;
            }
          } else {
            // Wraparound range (e.g., Sa-Tu: 6-2, meaning Sat, Sun, Mon, Tue)
            if (
              currentDayIndex >= startDayIndex ||
              currentDayIndex <= endDayIndex
            ) {
              return true;
            }
          }
        } else {
          // Single day specification (e.g., "Mo")
          if (dayMap[part.trim()] === currentDayIndex) {
            return true;
          }
        }
      }
      return false; // Current day doesn't match any specification
    }

    /**
     * MAIN PARSING LOGIC
     * Process the opening hours string rule by rule
     */
    try {
      // Normalize the hours string: remove extra spaces for consistent parsing
      const rules = hoursString
        .replace(/; /g, ";") // Remove space after semicolons
        .replace(/, /g, ",") // Remove space after commas
        .split(";"); // Split into individual rules

      let isOpen = false; // Assume closed until we find a matching open rule
      let ruleMatchedToday = false; // Track if any rule applied to today

      /**
       * PHASE 1: Check for explicit closure rules
       * Process "off" and "closed" keywords first as they take priority
       * This includes both general closures and date-specific closures
       */
      for (const rule of rules) {
        const cleanRule = rule.trim().toLowerCase();

        // Check for complete closure
        if (cleanRule === "off" || cleanRule === "closed") {
          console.log("[Finder] Restaurant is marked as completely closed");
          return false;
        }

        // Check for day-based closure (e.g., "Mo,Tu off" or "Su closed")
        const dayRuleMatch = cleanRule.match(/^([a-z\s,-]+) (off|closed)$/i);
        if (dayRuleMatch) {
          const daysPart = dayRuleMatch[1].replace(/\s/g, "");
          if (isDayInSet(daysPart)) {
            console.log(
              "[Finder] Restaurant is closed today per day rule:",
              rule.trim(),
            );
            return false;
          }
        }

        /**
         * Check for date range closures (e.g., "Dec 20-Dec 28 off")
         * Used for holiday closures spanning multiple days
         * Handles both standard ranges and year-wraparound ranges
         */
        const dateRangeRuleMatch = cleanRule.match(
          /^([a-z]{3}) (\d{1,2})-([a-z]{3}) (\d{1,2}) (off|closed)$/i,
        );
        if (dateRangeRuleMatch) {
          const startMonth = monthMap[dateRangeRuleMatch[1]];
          const startDay = parseInt(dateRangeRuleMatch[2]);
          const endMonth = monthMap[dateRangeRuleMatch[3]];
          const endDay = parseInt(dateRangeRuleMatch[4]);

          if (startMonth && endMonth) {
            /**
             * Convert dates to comparable numbers (MMDD format)
             * Example: Nov 14 -> 1114, Dec 25 -> 1225
             * This allows simple numeric comparison
             */
            const currentDateNum = currentMonth * 100 + currentDayOfMonth;
            const startDateNum = startMonth * 100 + startDay;
            const endDateNum = endMonth * 100 + endDay;

            if (startDateNum <= endDateNum) {
              // Standard range (e.g., Dec 20 to Dec 28)
              if (
                currentDateNum >= startDateNum &&
                currentDateNum <= endDateNum
              ) {
                console.log(
                  "[Finder] Restaurant closed for date range:",
                  rule.trim(),
                );
                return false;
              }
            } else {
              // Year wraparound range (e.g., Dec 20 to Jan 5)
              if (
                currentDateNum >= startDateNum ||
                currentDateNum <= endDateNum
              ) {
                console.log(
                  "[Finder] Restaurant closed for wraparound date range:",
                  rule.trim(),
                );
                return false;
              }
            }
          }
        }

        /**
         * Check for single date closures (e.g., "Dec 25 off")
         * Used for specific holiday closures
         */
        const singleDateRuleMatch = cleanRule.match(
          /^([a-z]{3}) (\d{1,2}) (off|closed)$/i,
        );
        if (singleDateRuleMatch) {
          const month = monthMap[singleDateRuleMatch[1]];
          const day = parseInt(singleDateRuleMatch[2]);
          if (month === currentMonth && day === currentDayOfMonth) {
            console.log(
              "[Finder] Restaurant closed on specific date:",
              rule.trim(),
            );
            return false;
          }
        }
      }

      /**
       * PHASE 2: Parse opening time rules
       * Now that we've ruled out explicit closures, check if there are
       * any time-based rules that show the restaurant is open now
       */
      for (const rule of rules) {
        const cleanRule = rule.trim();

        // Skip empty rules and closure rules (already processed)
        if (
          cleanRule.length === 0 ||
          cleanRule.toLowerCase() === "off" ||
          cleanRule.toLowerCase() === "closed"
        ) {
          continue;
        }

        // Skip date-based rules (e.g., "Dec 25 off") - already processed
        if (cleanRule.match(/^([a-z]{3}) (\d{1,2})/i)) {
          continue;
        }

        /**
         * Parse day and time components
         * Format: "Mo-Fr 09:00-17:00" or just "09:00-17:00" (implies all days)
         */
        const ruleMatch = cleanRule.match(/^([a-z\s,-]+) ([0-9:-\s,]+)$/i);

        let daysPart, timesPart;

        if (ruleMatch) {
          // Rule has both days and times
          daysPart = ruleMatch[1].replace(/\s/g, ""); // Remove spaces from days
          timesPart = ruleMatch[2].replace(/\s/g, ""); // Remove spaces from times
        } else {
          // No day specification - check if it's just times (implies all days)
          const allDayRuleMatch = cleanRule.match(/^([0-9:-\s,]+)$/);
          if (allDayRuleMatch) {
            daysPart = "Mo-Su"; // No day specified = all days
            timesPart = allDayRuleMatch[1].replace(/\s/g, "");
          } else {
            continue; // Cannot parse this rule format
          }
        }

        // Check if this rule applies to current day of week
        if (!isDayInSet(daysPart)) {
          continue; // This rule doesn't apply today
        }

        ruleMatchedToday = true; // At least one rule applies to today

        /**
         * Parse time ranges
         * Can have multiple comma-separated ranges: "09:00-12:00,14:00-18:00"
         * This handles restaurants with lunch breaks
         */
        const timeRanges = timesPart.split(",");
        for (const range of timeRanges) {
          let timeMatch;
          let startHour, startMin, endHour, endMin;

          /**
           * Parse time format - supports both HH:MM and HHMM formats
           * Examples: "09:00-17:00" or "0900-1700"
           */
          if (range.includes(":")) {
            // Colon format: HH:MM-HH:MM (or H:MM-HH:MM)
            timeMatch = range.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
            if (!timeMatch) continue; // Skip malformed time

            startHour = parseInt(timeMatch[1]);
            startMin = parseInt(timeMatch[2]);
            endHour = parseInt(timeMatch[3]);
            endMin = parseInt(timeMatch[4]);
          } else {
            // No-colon format: HHMM-HHMM
            timeMatch = range.match(/^(\d{2})(\d{2})-(\d{2})(\d{2})$/);
            if (!timeMatch) continue; // Skip malformed time

            startHour = parseInt(timeMatch[1]);
            startMin = parseInt(timeMatch[2]);
            endHour = parseInt(timeMatch[3]);
            endMin = parseInt(timeMatch[4]);
          }

          /**
           * Convert to minutes since midnight for easy comparison
           * Example: 14:30 = 14 * 60 + 30 = 870 minutes
           */
          let startMinutes = startHour * 60 + startMin;
          let endMinutes = endHour * 60 + endMin;

          /**
           * Handle special case: "24:00" means end of day (midnight)
           * Convert to 1440 minutes (24 * 60)
           */
          if (endHour === 24 && endMin === 0) {
            endMinutes = 1440;
          }

          /**
           * Check if current time falls within this time range
           * Two cases to handle:
           * 1. Standard range: start < end (e.g., 09:00-17:00)
           * 2. Overnight range: end < start (e.g., 20:00-02:00)
           */
          if (endMinutes < startMinutes) {
            /**
             * OVERNIGHT HOURS (e.g., 20:00-02:00)
             * Restaurant closes after midnight
             * Open if: current time >= start OR current time < end
             * Example: Open at 21:00 (after 20:00) OR 01:00 (before 02:00)
             */
            if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
              isOpen = true;
              console.log(
                "[Finder] Restaurant is OPEN (overnight hours):",
                range,
              );
              break; // Found an open time slot
            }
          } else {
            /**
             * STANDARD HOURS (e.g., 09:00-17:00)
             * Normal operating hours within the same day.
             *
             * We treat time ranges as half-open intervals: [start, end)
             * - Start time is inclusive  (currentMinutes >= startMinutes)
             * - End time is exclusive    (currentMinutes < endMinutes)
             *
             * This means that for "09:00-17:00":
             * - 14:00 is considered OPEN
             * - 17:00 is already CLOSED
             *
             * Using an exclusive end time is consistent with common interval
             * handling (and standards like OSM opening_hours), avoids ambiguity
             * at exact boundary times, and keeps the logic simple.
             *
             * If product requirements ever change and 17:00 should be treated
             * as still open, this condition must be updated to use "<=" for
             * the end time (and any related boundary logic reviewed).
             */
            if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
              isOpen = true;
              console.log(
                "[Finder] Restaurant is OPEN (standard hours):",
                range,
              );
              break; // Found an open time slot
            }
          }
        } // End of time range iteration

        if (isOpen) {
          break; // Found an open rule, no need to check remaining rules
        }
      } // End of rule iteration

      /**
       * Return result based on whether any rule matched today
       */
      if (ruleMatchedToday) {
        // At least one rule applied to today, return the open/closed status
        console.log(
          "[Finder] Opening hours check result:",
          isOpen ? "OPEN" : "CLOSED",
        );
        return isOpen;
      }

      // No rules matched today - assume closed
      console.log(
        "[Finder] No opening hours rule matched today - assuming CLOSED",
      );
      return false;
    } catch (e) {
      // Parser encountered an error - log and return null (unknown)
      console.error(
        "[Finder] Error parsing opening hours:",
        e,
        "String:",
        hoursString,
      );
      return null; // Failed to parse - cannot determine open/closed
    }
  }
});
