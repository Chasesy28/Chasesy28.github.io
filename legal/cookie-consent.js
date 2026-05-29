(function () {
  const CONSENT_KEY = "cookie_consent_choice";
  const CONSENT_DATE_KEY = "cookie_consent_date";

  const applyConsent = (choice) => {
    window.siteCookieConsent = choice;
    window.dispatchEvent(
      new CustomEvent("cookie-consent-updated", { detail: { choice } }),
    );
  };

  const createBanner = () => {
    const banner = document.createElement("aside");
    banner.id = "cookie-consent-banner";
    banner.className = "cookie-consent hidden";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-labelledby", "cookie-consent-title");
    banner.setAttribute("aria-describedby", "cookie-consent-description");
    banner.innerHTML = `
      <h2 id="cookie-consent-title">Cookie preferences</h2>
      <p id="cookie-consent-description">
        We use essential cookies/local storage to run this site and optional analytics-style storage to improve it.
        Read our <a href="/legal/privacy-policy.html">Privacy Policy</a> and <a href="/legal/terms-of-service.html">Terms of Service</a>.
      </p>
      <div class="cookie-consent-actions">
        <button id="cookie-consent-accept" type="button">Accept all</button>
        <button id="cookie-consent-reject" type="button">Reject optional</button>
      </div>
    `;
    document.body.appendChild(banner);
    return banner;
  };

  document.addEventListener("DOMContentLoaded", () => {
    const existingChoice = localStorage.getItem(CONSENT_KEY);
    if (existingChoice) {
      applyConsent(existingChoice);
      return;
    }

    const banner = document.getElementById("cookie-consent-banner") ?? createBanner();
    const acceptButton = banner.querySelector("#cookie-consent-accept");
    const rejectButton = banner.querySelector("#cookie-consent-reject");
    if (!acceptButton || !rejectButton) {
      return;
    }

    banner.classList.remove("hidden");

    const persistChoice = (choice) => {
      localStorage.setItem(CONSENT_KEY, choice);
      localStorage.setItem(CONSENT_DATE_KEY, new Date().toISOString());
      banner.classList.add("hidden");
      applyConsent(choice);
    };

    acceptButton.addEventListener("click", () => persistChoice("accepted"));
    rejectButton.addEventListener("click", () => persistChoice("rejected"));
  });
})();
