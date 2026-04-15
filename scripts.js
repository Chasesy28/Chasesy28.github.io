/**
 * Main script for rain animation and slide interactions
 * Handles rain drop creation, collision detection with slides, and ground splashes
 */

// hide full-screen loader with load and DOM-ready fallback
let loaderHidden = false;

function hideLoadingScreen() {
  if (loaderHidden) {
    return;
  }

  const loader = document.getElementById("loading-screen");
  if (!loader) {
    loaderHidden = true;
    return;
  }

  loaderHidden = true;
  loader.classList.add("hidden");
  loader.style.display = "none";
  loader.setAttribute("aria-hidden", "true");
  setTimeout(() => loader.remove(), 500);
}

window.addEventListener("load", hideLoadingScreen, { once: true });

document.addEventListener(
  "DOMContentLoaded",
  () => {
    // Fallback in case some assets delay or block the full window load event.
    setTimeout(hideLoadingScreen, 1500);
  },
  { once: true },
);

if (document.readyState === "complete") {
  hideLoadingScreen();
} else if (document.readyState === "interactive") {
  setTimeout(hideLoadingScreen, 1500);
}

// theme toggle utilities (shared across pages)
function initThemeToggle() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (!darkModeToggle) return;
  const html = document.documentElement;
  const sunIcon = document.querySelector(".sun-icon");
  const moonIcon = document.querySelector(".moon-icon");

  const updateIcons = (theme) => {
    if (!sunIcon || !moonIcon) {
      return;
    }

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
    const newTheme = isDark ? "light" : "dark";
    html.classList.remove("light", "dark");
    html.classList.add(newTheme);
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
  const fontBtn = document.getElementById("toggle-font-style");

  if (!panel || !toggleBtn) {
    return;
  }

  const apply = () => {
    const size = parseFloat(localStorage.getItem("fontSize") || "1");
    document.documentElement.style.fontSize = size + "rem";
    document.documentElement.classList.toggle(
      "high-contrast",
      localStorage.getItem("highContrast") === "true",
    );
    document.documentElement.classList.toggle(
      "reduce-motion",
      localStorage.getItem("reduceMotion") === "true",
    );

    const useDefaultFont = localStorage.getItem("defaultFont") === "true";
    document.documentElement.classList.toggle("default-font-mode", useDefaultFont);
    if (fontBtn) {
      fontBtn.textContent = useDefaultFont
        ? "Use custom font"
        : "Disable custom font";
    }
  };

  const setPanelOpen = (isOpen) => {
    panel.classList.toggle("hidden", !isOpen);
    panel.setAttribute("aria-hidden", String(!isOpen));
    toggleBtn.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      const first = panel.querySelector("button:not(#close-accessibility)");
      first?.focus();
    } else {
      toggleBtn.focus();
    }
  };

  if (toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", "false");
    if (panel) {
      toggleBtn.setAttribute("aria-controls", panel.id);
    }
  }

  toggleBtn?.addEventListener("click", () => {
    const shouldOpen = panel.classList.contains("hidden");
    setPanelOpen(shouldOpen);
  });

  closeBtn?.addEventListener("click", () => setPanelOpen(false));

  // close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel && !panel.classList.contains("hidden")) {
      setPanelOpen(false);
    }
  });

  // optionally close when clicking outside panel
  document.addEventListener("click", (e) => {
    if (
      panel &&
      !panel.classList.contains("hidden") &&
      !panel.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      setPanelOpen(false);
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

  fontBtn?.addEventListener("click", () => {
    const current = localStorage.getItem("defaultFont") === "true";
    localStorage.setItem("defaultFont", String(!current));
    apply();
  });

  apply();
  setPanelOpen(false);

  function dragElement(elmnt) {
    if (!elmnt) {
      return;
    }

    var pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
      // if present, the header is where you move the DIV from:
      document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;

      // 1. Define which element(s) should NOT trigger a drag
      // This checks if the clicked element has the class "no-drag"
      if (e.target.closest("button, input, select, textarea, label, a")) {
        return; // Exit the function early so dragging never starts
      }

      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      elmnt.style.position = "absolute";
      e = e || window.event;
      e.preventDefault();

      // Calculate how much the mouse moved
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      // Get the parent dimensions (usually the window)
      var parentWidth = window.innerWidth;
      var parentHeight = window.innerHeight;

      // Calculate new Right and Bottom positions
      // We use (Parent Dimension - Offset - Element Dimension) to find the distance from the edge
      var newRight =
        parentWidth - (elmnt.offsetLeft + elmnt.offsetWidth) + pos1;
      var newBottom =
        parentHeight - (elmnt.offsetTop + elmnt.offsetHeight) + pos2;

      // Apply the styles
      elmnt.style.right = newRight + "px";
      elmnt.style.bottom = newBottom + "px";

      // Clear top/left so they don't fight with right/bottom
      elmnt.style.top = "auto";
      elmnt.style.left = "auto";

      elmnt.style.position = "fixed";
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  dragElement(panel);
}

const rainContainer = document.querySelector(".rain");
let dropDensity = 15; // Controls how many drops appear based on screen width

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
  if (!rainContainer) {
    return;
  }

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
  if (!rainContainer) {
    return;
  }

  const initialNumberOfDrops = Math.floor(window.innerWidth / dropDensity);
  for (let i = 0; i < initialNumberOfDrops; i++) {
    createDrop();
  }
};

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

document.addEventListener("DOMContentLoaded", function () {
  initThemeToggle();
  initAccessibility();

  // Start the rain animation
  initRain();

  // Listen for window resize events to adjust drop count
  window.addEventListener("resize", handleResize);

  // Start observing the rain container for child node removals
  if (rainContainer) {
    sharedObserver.observe(rainContainer, { childList: true });
  }
});

const rainSlider = document.getElementById("rain-slider");
const rainNumber = document.getElementById("rain-number");

if (rainSlider && rainNumber) {
  rainSlider.addEventListener("input", function () {
    dropDensity = rainSlider.value;
    rainNumber.value = String(dropDensity);
    console.log("[Test Page] Drop density changed to:", dropDensity);
    handleResize(); // Recalculate drop count with new density
  });
  rainNumber.addEventListener("input", function () {
    dropDensity = rainNumber.value;
    rainSlider.value = String(dropDensity);
    console.log("[Test Page] Drop density changed to:", dropDensity);
    handleResize(); // Recalculate drop count with new density
  });
}

const projects = document.getElementById("projects");
let leftProjects = false;
const dropdown = document.getElementById("projects-dropdown");
let leftDropdown = null;

projects?.addEventListener("mouseenter", () => {
  dropdown?.classList.remove("hidden");
  leftProjects = false;
});

projects?.addEventListener("mouseleave", () => {
  if (leftDropdown || leftDropdown === null) {
    dropdown?.classList.add("hidden");
  }
  leftProjects = true;
});

dropdown?.addEventListener("mouseenter", () => {
  dropdown.classList.remove("hidden");
  leftDropdown = false;
});

dropdown?.addEventListener("mouseleave", () => {
  if(leftProjects){
    dropdown.classList.add("hidden");
  }
  leftDropdown = true;
});
