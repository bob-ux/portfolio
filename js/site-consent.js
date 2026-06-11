document.addEventListener("DOMContentLoaded", function () {
  const CONSENT_KEY = "cookie_consent_accepted";

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function createBanner() {
    const el = document.createElement("div");
    el.className = "cookie-banner";
    el.id = "cookieBanner";
    el.innerHTML = `
      <div class="cookie-banner__text">
        На сайте используются cookies и сервисы аналитики для улучшения работы сайта.
        Продолжая использование сайта, вы соглашаетесь с
        <a href="/privacy/">политикой конфиденциальности</a>.
      </div>
      <button class="btn primary cookie-banner__btn" id="cookieAcceptBtn" type="button">
        Хорошо
      </button>
    `;

    document.body.appendChild(el);
    return el;
  }

  const banner = document.getElementById("cookieBanner") || createBanner();
  const acceptBtn = document.getElementById("cookieAcceptBtn");
  const accepted = safeGet(CONSENT_KEY) === "true";

  function hideBanner() {
    banner.hidden = true;
    banner.style.display = "none";
  }

  function showBanner() {
    banner.hidden = false;
    banner.style.display = "flex";
  }

  if (accepted) {
    hideBanner();
    if (window.loadSiteAnalytics) {
      window.loadSiteAnalytics();
    }
  } else {
    showBanner();
  }

  if (!acceptBtn) return;

  acceptBtn.addEventListener("click", function () {
    safeSet(CONSENT_KEY, "true");
    hideBanner();

    if (window.loadSiteAnalytics) {
      window.loadSiteAnalytics();
    }
  });
});
