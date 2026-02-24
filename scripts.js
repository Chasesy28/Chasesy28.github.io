/**
 * Main script for rain animation and slide interactions
 * Handles rain drop creation, collision detection with slides, and ground splashes
 */

// hide full‑screen loader when the window has fully loaded
window.addEventListener("load", () => {
  const loader = document.getElementById("loading-screen");
  if (loader) {
    loader.classList.add("hidden");
    setTimeout(() => loader.remove(), 500);
  }
});

// theme toggle utilities (shared across pages)
function initThemeToggle() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (!darkModeToggle) return;
  const html = document.documentElement;
  const sunIcon = document.querySelector(".sun-icon");
  const moonIcon = document.querySelector(".moon-icon");

  const updateIcons = (theme) => {
    if (theme === "dark") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "inline";
    } else {
      sunIcon.style.display = "inline";
      moonIcon.style.display = "none";
    }
  };

  const currentTheme = localStorage.getItem("theme") || "light";
  html.classList.remove("light", "dark");
  html.classList.add(currentTheme);
  updateIcons(currentTheme);

  darkModeToggle.addEventListener("click", () => {
    const isDark = html.classList.contains("dark");
    html.classList.replace(
      isDark ? "dark" : "light",
      isDark ? "light" : "dark",
    );
    const newTheme = isDark ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    updateIcons(newTheme);
  });
}

// accessibility helpers: font size, contrast, reduce motion
function initAccessibility() {
  const panel = document.getElementById("accessibility-settings");
  const toggleBtn = document.getElementById("accessibility-toggle");
  const closeBtn = document.getElementById("close-accessibility");
  const inc = document.getElementById("increase-font");
  const dec = document.getElementById("decrease-font");
  const contrastBtn = document.getElementById("toggle-contrast");
  const motionBtn = document.getElementById("toggle-reduced-motion");

  const apply = () => {
    const size = parseFloat(localStorage.getItem("fontSize") || "1");
    document.documentElement.style.fontSize = size + "rem";
    document.body.classList.toggle(
      "high-contrast",
      localStorage.getItem("highContrast") === "true",
    );
    document.body.classList.toggle(
      "reduce-motion",
      localStorage.getItem("reduceMotion") === "true",
    );
  };

  toggleBtn?.addEventListener("click", () => {
    if (panel) {
      const isHidden = panel.classList.toggle("hidden");
      panel.setAttribute("aria-hidden", isHidden);
      if (!isHidden) {
        // focus first control
        const first = panel.querySelector("button:not(#close-accessibility)");
        first?.focus();
      } else {
        toggleBtn.focus();
      }
    }
  });

  // open panel on hover and keep open while hovering or interacting
  toggleBtn?.addEventListener("mouseenter", () => {
    if (panel && panel.classList.contains("hidden")) {
      panel.classList.remove("hidden");
      panel.setAttribute("aria-hidden", "false");
    }
  });
  toggleBtn?.addEventListener("mouseleave", (e) => {
    // close only if mouse leaves both button and panel
    if (panel && !panel.contains(e.relatedTarget)) {
      panel.classList.add("hidden");
      panel.setAttribute("aria-hidden", "true");
    }
  });
  panel?.addEventListener("mouseleave", (e) => {
    if (toggleBtn && !toggleBtn.contains(e.relatedTarget)) {
      panel.classList.add("hidden");
      panel.setAttribute("aria-hidden", "true");
    }
  });

  closeBtn?.addEventListener("click", () => {
    if (panel) {
      panel.classList.add("hidden");
      panel.setAttribute("aria-hidden", "true");
      toggleBtn?.focus();
    }
  });

  // close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel && !panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      panel.setAttribute("aria-hidden", "true");
      toggleBtn?.focus();
    }
  });

  // optionally close when clicking outside panel
  document.addEventListener("click", (e) => {
    if (
      panel &&
      !panel.classList.contains("hidden") &&
      !panel.contains(e.target) &&
      e.target !== toggleBtn
    ) {
      panel.classList.add("hidden");
      panel.setAttribute("aria-hidden", "true");
      toggleBtn?.focus();
    }
  });

  inc?.addEventListener("click", () => {
    const current = parseFloat(localStorage.getItem("fontSize") || "1");
    const next = Math.min(current + 0.1, 2);
    localStorage.setItem("fontSize", next);
    apply();
  });
  dec?.addEventListener("click", () => {
    const current = parseFloat(localStorage.getItem("fontSize") || "1");
    const next = Math.max(current - 0.1, 0.8);
    localStorage.setItem("fontSize", next);
    apply();
  });

  contrastBtn?.addEventListener("click", () => {
    const current = localStorage.getItem("highContrast") === "true";
    localStorage.setItem("highContrast", !current);
    apply();
  });

  motionBtn?.addEventListener("click", () => {
    const current = localStorage.getItem("reduceMotion") === "true";
    localStorage.setItem("reduceMotion", !current);
    apply();
  });

  apply();
  if (panel) {
    panel.setAttribute("aria-hidden", panel.classList.contains("hidden"));
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initThemeToggle();
  initAccessibility();
  const rainContainer = document.querySelector(".rain");
  const dropDensity = 15; // Controls how many drops appear based on screen width

  /**
   * Cached array of slide elements for better performance
   * Updated periodically to account for dynamically added slides
   */
  let cachedSlides = [];
  const updateSlideCache = () => {
    cachedSlides = Array.from(document.querySelectorAll(".swiper-slide"));
  };

  // Initial cache - will update after swiper is ready
  setTimeout(updateSlideCache, 100);

  /**
   * Map to track cleanup callbacks for each drop
   * Used to properly clear intervals when drops are removed from DOM
   */
  const dropCleanupCallbacks = new Map();

  /**
   * Checks if a raindrop collides with any visible slide
   * Uses bounding box collision detection (AABB - Axis-Aligned Bounding Box)
   * @param {HTMLElement} drop - The raindrop element to check for collision
   * @returns {boolean} True if collision detected, false otherwise
   */
  const checkSlideCollision = (drop) => {
    const dropRect = drop.getBoundingClientRect();

    for (let slide of cachedSlides) {
      const slideRect = slide.getBoundingClientRect();

      /**
       * AABB collision detection algorithm
       * A collision occurs when all four conditions are true:
       * 1. Drop's left edge is left of slide's right edge
       * 2. Drop's right edge is right of slide's left edge
       * 3. Drop's top edge is above slide's bottom edge
       * 4. Drop's bottom edge is below slide's top edge
       */
      if (
        dropRect.left < slideRect.right &&
        dropRect.right > slideRect.left &&
        dropRect.top < slideRect.bottom &&
        dropRect.bottom > slideRect.top
      ) {
        // Create splash effect on slide
        const splash = document.createElement("div");
        splash.classList.add("slide-splash");

        // Calculate splash position relative to slide's coordinate system
        const relativeX = dropRect.left - slideRect.left;
        const relativeY = dropRect.top - slideRect.top;

        splash.style.left = `${relativeX}px`;
        splash.style.top = `${relativeY}px`;

        slide.appendChild(splash);

        // Remove splash element after animation completes (400ms)
        setTimeout(() => {
          splash.remove();
        }, 400);

        return true;
      }
    }
    return false;
  };

  /**
   * Creates a single raindrop element with random properties
   * Sets up collision detection and splash effects
   */
  const createDrop = () => {
    const drop = document.createElement("div");
    drop.classList.add("drop");

    // Randomize drop properties for natural rain appearance
    drop.style.left = `${Math.random() * 100}vw`; // Random horizontal position across screen
    drop.style.animationDelay = `${Math.random() * 2}s`; // Stagger start times (0-2 seconds)
    drop.style.animationDuration = `${0.8 + Math.random() * 0.6}s`; // Vary fall speed (0.8-1.4 seconds)

    /**
     * Interval handle for collision checking
     * Must be cleared when drop is removed to prevent memory leaks
     */
    let checkInterval = null;

    /**
     * Starts periodic collision checking for this drop
     * Uses throttling to limit checks to every 50ms for performance
     */
    const startCollisionCheck = () => {
      let lastCheck = 0;
      checkInterval = setInterval(() => {
        // Safety check: Stop if drop was removed from DOM
        if (!drop.parentElement) {
          clearInterval(checkInterval);
          checkInterval = null;
          return;
        }

        // Throttle collision checks to every 50ms for performance
        const currentTime = Date.now();
        if (currentTime - lastCheck > 50) {
          lastCheck = currentTime;
          checkSlideCollision(drop);
        }
      }, 50);
    };

    // Start collision detection for this drop
    startCollisionCheck();

    /**
     * Handles ground splash effect when drop completes one animation cycle
     * Called on each 'animationiteration' event (when drop hits ground and restarts)
     */
    const handleAnimationIteration = () => {
      // Create ground splash element at drop's horizontal position
      const splash = document.createElement("div");
      splash.classList.add("splash");
      splash.style.left = drop.style.left;
      splash.style.bottom = "5px";
      rainContainer.appendChild(splash);

      // Delay adding animation class to trigger CSS transition
      setTimeout(() => {
        splash.classList.add("splash-animation");
      }, 10);

      // Auto-remove splash when animation completes
      splash.addEventListener(
        "animationend",
        () => {
          splash.remove();
        },
        { once: true },
      );
    };

    drop.addEventListener("animationiteration", handleAnimationIteration);

    /**
     * Register cleanup callback for this drop
     * Ensures interval is cleared when drop is removed from DOM
     * Prevents memory leaks from orphaned intervals
     */
    dropCleanupCallbacks.set(drop, () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
    });

    rainContainer.appendChild(drop);
  };

  /**
   * Handles window resize by adjusting number of raindrops
   * Maintains consistent drop density across different screen sizes
   */
  const handleResize = () => {
    const newNumberOfDrops = Math.floor(window.innerWidth / dropDensity);
    const currentDrops = rainContainer.querySelectorAll(".drop");
    const diff = newNumberOfDrops - currentDrops.length;

    if (diff > 0) {
      // Screen got bigger - add more drops to maintain density
      for (let i = 0; i < diff; i++) {
        createDrop();
      }
    } else if (diff < 0) {
      // Screen got smaller - remove excess drops
      for (let i = 0; i < Math.abs(diff); i++) {
        // Remove from end to minimize visual disruption
        if (currentDrops[currentDrops.length - 1 - i]) {
          currentDrops[currentDrops.length - 1 - i].remove();
        }
      }
    }
  };

  /**
   * Initializes the rain animation by creating initial set of drops
   * Number of drops is proportional to screen width
   */
  const initRain = () => {
    const initialNumberOfDrops = Math.floor(window.innerWidth / dropDensity);
    for (let i = 0; i < initialNumberOfDrops; i++) {
      createDrop();
    }
  };

  // Start the rain animation
  initRain();

  // Listen for window resize events to adjust drop count
  window.addEventListener("resize", handleResize);

  /**
   * Shared MutationObserver to cleanup intervals when drops are removed
   * Watches for node removal in rain container and calls cleanup callbacks
   * This prevents memory leaks from orphaned setInterval calls
   */
  const sharedObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (dropCleanupCallbacks.has(node)) {
          // Call the cleanup function for this drop
          dropCleanupCallbacks.get(node)();
          dropCleanupCallbacks.delete(node);
        }
      });
    });
  });

  // Start observing the rain container for child node removals
  sharedObserver.observe(rainContainer, { childList: true });
});
