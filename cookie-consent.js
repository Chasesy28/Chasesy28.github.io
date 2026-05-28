(function () {
  const CONSENT_KEY = "cookie_consent_choice";
  const CONSENT_DATE_KEY = "cookie_consent_date";

  const applyConsent = (choice) => {
    window.siteCookieConsent = choice;
    window.dispatchEvent(
      new CustomEvent("cookie-consent-updated", { detail: { choice } }),
    );
  };

  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("cookie-consent-banner");
    const acceptButton = document.getElementById("cookie-consent-accept");
    const rejectButton = document.getElementById("cookie-consent-reject");
    if (!banner || !acceptButton || !rejectButton) {
      return;
    }

    const existingChoice = localStorage.getItem(CONSENT_KEY);
    if (existingChoice) {
      applyConsent(existingChoice);
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
