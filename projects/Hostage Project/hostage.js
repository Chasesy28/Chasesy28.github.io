//Hostage.js - A script to trap users in fullscreen mode and prevent certain actions

let Delivered = false;
let mutationSyncScheduled = false;

function onContextMenu(event) {
  event.preventDefault();
  console.warn("Na Uh");
}

function onClipboardEvent(event) {
  event.preventDefault();
  console.warn("Na Uh");
}

function keyboardEventHandler(event) {
  // List of key combinations to block
  const blockedCombinations = [
    { key: "F11", keyCode: 122, ctrl: false, alt: false, shift: false },
    { key: "Escape", keyCode: 27, ctrl: false, alt: false, shift: false },
    { key: "Tab", keyCode: 9, ctrl: false, alt: false, shift: false },
    { key: "F4", keyCode: 115, ctrl: true, alt: true, shift: false },
  ];

  for (const combination of blockedCombinations) {
    if (
      (event.key === combination.key || event.keyCode === combination.keyCode) &&
      event.ctrlKey === combination.ctrl &&
      event.altKey === combination.alt &&
      event.shiftKey === combination.shift
    ) {
      event.preventDefault();
      console.warn("Na Uh");
      break;
    }
  }
}

function onFullscreenChange() {
  if (!document.fullscreenElement) {
    try {
      document.documentElement.requestFullscreen();
      console.warn("Na Uh");
    } catch (err) {
      console.error("Failed to trap user in fullscreen mode:", err);
    }
  } else {
    console.log("Welcome to the full screen experience!");
  }
}

function Escape() {
  if (Delivered === false) {
    Delivered = true;
    document.body.append(document.createTextNode("You cannot escape!"));
    document.documentElement.requestFullscreen();
  }
}

function bindHostageHandlers() {
  document.removeEventListener("contextmenu", onContextMenu);
  document.removeEventListener("copy", onClipboardEvent);
  document.removeEventListener("paste", onClipboardEvent);
  document.removeEventListener("cut", onClipboardEvent);
  document.removeEventListener("fullscreenchange", onFullscreenChange);

  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("copy", onClipboardEvent);
  document.addEventListener("paste", onClipboardEvent);
  document.addEventListener("cut", onClipboardEvent);
  document.addEventListener("fullscreenchange", onFullscreenChange);
}

function syncEscapeButton() {
  const escapeButton = document.getElementById("escape-button");

  if (!escapeButton) {
    return;
  }

  escapeButton.removeEventListener("click", Escape);
  escapeButton.addEventListener("click", Escape);
}

function syncHostagePage() {
  bindHostageHandlers();
  syncEscapeButton();
}

function logUnexpectedMutations(mutations) {
  const details = mutations.map((mutation) => ({
    type: mutation.type,
    target: mutation.target && mutation.target.nodeName,
    addedNodes: mutation.addedNodes.length,
    removedNodes: mutation.removedNodes.length,
    attributeName: mutation.attributeName,
  }));

  console.warn("Unexpected DOM mutation detected:", details);
}

function scheduleHostageResync() {
  if (mutationSyncScheduled) {
    return;
  }

  mutationSyncScheduled = true;
  requestAnimationFrame(() => {
    mutationSyncScheduled = false;
    syncHostagePage();
  });
}

function hostage() {
  if (document.fullscreenEnabled) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error("Failed to enter fullscreen mode:", err);
    });
  } else {
    console.warn("Fullscreen mode is not supported by this browser.");
  }

  syncHostagePage();

  // Prevent videos from being put into Picture-in-Picture and block programmatic PiP
  function preventPictureInPicture() {
    try {
      // Disable on existing <video> elements
      document.querySelectorAll("video").forEach((v) => {
        try {
          v.disablePictureInPicture = true;
        } catch (e) {
          // ignore
        }
      });

      // Override the instance method to block requests
      if (HTMLVideoElement && HTMLVideoElement.prototype.requestPictureInPicture) {
        HTMLVideoElement.prototype._origRequestPictureInPicture = HTMLVideoElement.prototype.requestPictureInPicture;
        HTMLVideoElement.prototype.requestPictureInPicture = function () {
          return Promise.reject(new DOMException('Picture-in-Picture disabled by application', 'NotAllowedError'));
        };
      }

      // Watch for dynamically added <video> elements
      const vidObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node && node.nodeName === 'VIDEO') {
              try {
                node.disablePictureInPicture = true;
              } catch (e) {}
            }
            if (node && node.querySelectorAll) {
              node.querySelectorAll('video').forEach((v) => {
                try {
                  v.disablePictureInPicture = true;
                } catch (e) {}
              });
            }
          }
        }
      });

      vidObserver.observe(document.documentElement, { childList: true, subtree: true });
    } catch (err) {
      console.warn('PiP prevention not supported in this environment:', err);
    }
  }

  // Best-effort: prevent user window resizing by restoring original size on resize events.
  function lockWindowSize() {
    try {
      const initial = { width: window.innerWidth, height: window.innerHeight };

      // Apply CSS layout lock to the document to keep internal layout stable
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.width = initial.width + 'px';
      document.documentElement.style.height = initial.height + 'px';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      let resizing = false;
      window.addEventListener('resize', () => {
        if (resizing) return;
        resizing = true;
        // Attempt to restore size for windows that allow programmatic resize (usually only for popups)
        try {
          if (typeof window.resizeTo === 'function') {
            window.resizeTo(initial.width, initial.height);
            window.scrollTo(0, 0);
          }
        } catch (e) {
          // ignore if browser forbids programmatic resize
        }
        // Ensure layout styles stay applied
        document.documentElement.style.width = initial.width + 'px';
        document.documentElement.style.height = initial.height + 'px';
        resizing = false;
      }, { passive: true });
    } catch (err) {
      console.warn('Window lock not fully available:', err);
    }
  }

  // Use the Window Placement API to detect multi-screen setups and attempt to span the window
  async function trySpanAcrossScreens() {
    try {
      if (!('getScreenDetails' in window) && !('getScreens' in window)) {
        // Not supported
        return;
      }

      // Request permission for window-placement if available
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const p = await navigator.permissions.query({ name: 'window-placement' });
          if (p && p.state !== 'granted') {
            console.info('window-placement permission is not granted; user prompt may be required');
          }
        }
      } catch (permErr) {
        // ignore permission check failures
      }

      const sd = await (window.getScreenDetails ? window.getScreenDetails() : window.getScreens());
      if (!sd) return;

      if (sd.isExtended) {
        // Compute bounding rectangle across all screens
        const screens = sd.screens || sd;
        let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
        for (const s of screens) {
          const left = s.left || s.availLeft || 0;
          const top = s.top || s.availTop || 0;
          const width = s.width || s.availWidth || 0;
          const height = s.height || s.availHeight || 0;
          minLeft = Math.min(minLeft, left);
          minTop = Math.min(minTop, top);
          maxRight = Math.max(maxRight, left + width);
          maxBottom = Math.max(maxBottom, top + height);
        }

        const totalWidth = Math.max(0, maxRight - minLeft);
        const totalHeight = Math.max(0, maxBottom - minTop);

        // Try to move and resize the window to span both screens (best-effort)
        try {
          if (typeof window.moveTo === 'function') window.moveTo(minLeft, minTop);
          if (typeof window.resizeTo === 'function') window.resizeTo(totalWidth, totalHeight);
        } catch (e) {
          // If moving/resizing is not allowed, fall back to fullscreen on the current screen
          try {
            document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
          } catch (fsErr) {}
        }
      }
    } catch (err) {
      console.warn('Multi-screen placement failed or not supported:', err);
    }
  }

  // Apply the safeguards
  preventPictureInPicture();
  lockWindowSize();
  trySpanAcrossScreens();

  const observer = new MutationObserver((mutations) => {
    logUnexpectedMutations(mutations);
    scheduleHostageResync();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });
}
//run the function when the page loads
window.addEventListener("load", hostage);
