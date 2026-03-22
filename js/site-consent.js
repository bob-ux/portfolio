document.addEventListener("DOMContentLoaded", function () {
  console.log("cookie banner script loaded");

  const banner = document.getElementById("cookieBanner");
  const acceptBtn = document.getElementById("cookieAcceptBtn");

  console.log("banner =", banner);
  console.log("acceptBtn =", acceptBtn);

  if (!banner || !acceptBtn) {
    console.log("banner elements not found");
    return;
  }

  const accepted = localStorage.getItem("cookie_consent_accepted");
  console.log("accepted =", accepted);

  if (accepted === "true") {
    banner.style.display = "none";
  } else {
    banner.style.display = "flex";
  }

  acceptBtn.addEventListener("click", function () {
    console.log("clicked");
    localStorage.setItem("cookie_consent_accepted", "true");
    banner.style.display = "none";
  });
});