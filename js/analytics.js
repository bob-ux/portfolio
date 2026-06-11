window.dataLayer = window.dataLayer || [];

function gtag() {
  dataLayer.push(arguments);
}

(function () {
  const GA_ID = "G-5N3BEZRY73";
  let loaded = false;

  window.loadSiteAnalytics = function () {
    if (loaded) return;
    loaded = true;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    gtag("js", new Date());
    gtag("config", GA_ID, {
      anonymize_ip: true,
    });
  };
})();
