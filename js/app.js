(async function () {
  const root = document.documentElement;

  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Theme persistence is optional; the UI should keep working without storage.
    }
  }

  async function inject(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;

    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return;

    el.innerHTML = await res.text();
  }

  // 1) Inject partials
  await Promise.allSettled([
    inject("#site-header", "/partials/header.html"),
    inject("#site-footer", "/partials/footer.html"),
  ]);

  const pathname = location.pathname.toLowerCase();
  const isHomePage = pathname === "/" || pathname === "/index.html";
  const isCasePage = pathname.startsWith("/case-");
  const isOtherProjectsPage =
    pathname === "/other-projects/" || pathname === "/other-projects.html";

  // 2) Footer year
  const y = document.getElementById("y");
  if (y) y.textContent = new Date().getFullYear();

  // 3) Theme switch
  const themeBtn = document.querySelector(".theme-switch");

  function getPreferredTheme() {
    const saved = safeStorageGet("theme");

    if (saved === "light" || saved === "dark") {
      return saved;
    }

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    return prefersDark ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    safeStorageSet("theme", theme);

    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  applyTheme(getPreferredTheme());

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  // 4) Mobile menu + burger → X
  const menuBtn = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const OPEN_CLASS = "is-open";

  if (menuBtn && mobileMenu) {
    function setHiddenAfterClose() {
      const onEnd = (e) => {
        if (e.propertyName !== "opacity") return;

        mobileMenu.hidden = true;
        mobileMenu.removeEventListener("transitionend", onEnd);
      };

      mobileMenu.addEventListener("transitionend", onEnd);
    }

    function openMenu() {
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.classList.add("is-open");

      mobileMenu.hidden = false;

      requestAnimationFrame(() => {
        mobileMenu.classList.add(OPEN_CLASS);
      });
    }

    function closeMenu() {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.classList.remove("is-open");

      mobileMenu.classList.remove(OPEN_CLASS);
      setHiddenAfterClose();
    }

    function toggleMenu() {
      const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
      isOpen ? closeMenu() : openMenu();
    }

    // init closed
    menuBtn.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
    mobileMenu.classList.remove(OPEN_CLASS);
    menuBtn.classList.remove("is-open");

    menuBtn.addEventListener("click", toggleMenu);

    mobileMenu.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  // 5) TOC active item on case pages
  (function initTocActive() {
    const toc = document.querySelector(".toc");
    if (!toc) return;

    const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    const sections = links
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);

    if (!sections.length) return;

    const header = document.querySelector(".site-header") || document.querySelector("header");
    const getOffset = () => (header ? header.offsetHeight : 0) + 24;

    function onScroll() {
      const y = window.scrollY + getOffset();
      let activeIndex = 0;

      for (let i = 0; i < sections.length; i += 1) {
        if (y >= sections[i].offsetTop) {
          activeIndex = i;
        }
      }

      links.forEach((a, i) => {
        a.classList.toggle("active", i === activeIndex);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    onScroll();
  })();

  // 6) Active nav state
  const desktopNavLinks = document.querySelectorAll(".navlinks-desktop a");
  const mobileNavLinks = document.querySelectorAll(".mobile-links a");

  function clearActive() {
    [...desktopNavLinks, ...mobileNavLinks].forEach((a) => {
      a.classList.remove("active");
    });
  }

  function setActiveByHrefIncludes(parts) {
    const list = Array.isArray(parts) ? parts : [parts];

    [...desktopNavLinks, ...mobileNavLinks].forEach((a) => {
      const href = a.getAttribute("href") || "";

      if (list.some((part) => href.includes(part))) {
        a.classList.add("active");
      }
    });
  }

  // A) If it's a case page: highlight "Кейсы"
  if (isCasePage) {
    clearActive();
    setActiveByHrefIncludes(["/#cases", "index.html#cases"]);
  }

  // B) If it's other projects page: highlight "Другие проекты"
  if (isOtherProjectsPage) {
    clearActive();
    setActiveByHrefIncludes(["/other-projects/", "other-projects.html"]);
  }

  // C) If it's index page: highlight based on scroll position
  if (isHomePage) {
    const anchors = [
      { id: "cases", parts: ["/#cases", "index.html#cases"] },
      { id: "contact", parts: ["/#contact", "index.html#contact"] },
    ].map((x) => ({
      ...x,
      el: document.getElementById(x.id),
    }));

    function onScroll() {
      clearActive();

      const y = window.scrollY + 120;

      for (let i = anchors.length - 1; i >= 0; i -= 1) {
        const s = anchors[i];

        if (!s.el) continue;

        if (y >= s.el.offsetTop) {
          setActiveByHrefIncludes(s.parts);
          break;
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // 7) Back to top
  (function initBackToTop() {
    const existing = document.querySelector(".back-to-top");
    if (existing) return;

    const btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "Наверх");

    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5l-7 7m7-7l7 7M12 5v14"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    document.body.appendChild(btn);

    const BASE_BOTTOM = 16;
    const FOOTER_OFFSET = 16;
    const SHOW_AFTER = 600;

    const footer = document.querySelector("footer");

    function update() {
      btn.classList.toggle("is-visible", window.scrollY > SHOW_AFTER);

      if (!footer) {
        btn.style.bottom = `${BASE_BOTTOM}px`;
        return;
      }

      const footerTop = footer.getBoundingClientRect().top;

      if (footerTop < window.innerHeight) {
        const lift = window.innerHeight - footerTop + FOOTER_OFFSET;
        btn.style.bottom = `${BASE_BOTTOM + lift}px`;
      } else {
        btn.style.bottom = `${BASE_BOTTOM}px`;
      }
    }

    btn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    update();
  })();

  // 8) Component filters
  (function initComponentFilters() {
    const bar = document.querySelector(".filter-bar");
    const buttons = Array.from(document.querySelectorAll(".filter-btn"));
    const items = Array.from(document.querySelectorAll(".component-item"));
    const empty = document.getElementById("component-empty");

    if (!bar || !buttons.length) return;

    function hasToken(el, token) {
      const raw = (el.getAttribute("data-cat") || "").trim();
      if (!raw) return false;

      return raw.split(/\s+/).includes(token);
    }

    function buildCounts() {
      const counts = { all: 0 };

      items.forEach((item) => {
        const raw = (item.getAttribute("data-cat") || "").trim();
        if (!raw) return;

        const tokens = raw.split(/\s+/);

        if (tokens.includes("overview")) {
          counts.all += 1;
        }

        tokens.forEach((t) => {
          if (t === "overview") return;

          counts[t] = (counts[t] || 0) + 1;
        });
      });

      return counts;
    }

    function renderCounts(counts) {
      buttons.forEach((btn) => {
        const key = btn.getAttribute("data-filter");
        const n = counts[key] ?? 0;

        const spot = btn.querySelector(".filter-count");
        if (!spot) return;

        spot.textContent = n ? ` ${n}` : "";
      });
    }

    function setActive(btn) {
      buttons.forEach((b) => {
        const active = b === btn;

        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
    }

    function applyFilter(filter) {
      let visibleCount = 0;

      items.forEach((item) => {
        let show = false;

        if (filter === "all") {
          show = hasToken(item, "overview");
        } else {
          show = hasToken(item, filter);
        }

        item.hidden = !show;

        if (show) {
          visibleCount += 1;
        }
      });

      if (empty) {
        empty.hidden = visibleCount !== 0;
      }
    }

    const counts = buildCounts();

    renderCounts(counts);
    applyFilter("all");

    bar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;

      const filter = btn.getAttribute("data-filter");

      setActive(btn);
      applyFilter(filter);
    });
  })();

  // 9) Lightbox
  (function initLightbox() {
    const images = document.querySelectorAll(".zoomable img");
    if (!images.length) return;

    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";

    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Закрыть">×</button>
      <img src="" alt="">
    `;

    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector("img");
    const closeBtn = lightbox.querySelector(".lightbox-close");

    function open(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || "";

      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function close() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    images.forEach((img) => {
      img.addEventListener("click", () => {
        open(img.src, img.alt);
      });
    });

    closeBtn.addEventListener("click", close);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  })();

  // 10) Single open details
  (function initSingleOpenDetails() {
    const scope = document.getElementById("documentation") || document;
    const detailsList = Array.from(scope.querySelectorAll("details"));

    if (!detailsList.length) return;

    detailsList.forEach((d) => {
      d.addEventListener("toggle", () => {
        if (!d.open) return;

        detailsList.forEach((other) => {
          if (other !== d) {
            other.open = false;
          }
        });
      });
    });
  })();

  // 11) Hero sphere canvas
  (function initHeroSphere() {
    const canvas = document.getElementById("heroSphereCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const holder = canvas.parentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let raf = null;
    let points = [];
    let resizeFrame = null;

    const pointer = {
      x: 0,
      y: 0,
      active: false,
    };

    function getCssVar(name, fallback = "") {
      const value = getComputedStyle(root).getPropertyValue(name).trim();
      return value || fallback;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      createPoints();
    }

    function createPoints() {
      points = [];

      const count = width < 320 ? 140 : 230;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < count; i += 1) {
        const t = i / count;
        const y = 1 - t * 2;
        const radius = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = goldenAngle * i;

        points.push({
          x: Math.cos(theta) * radius,
          y,
          z: Math.sin(theta) * radius,
          size: Math.random() * 2 + 1,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw(time) {
      const accent = getCssVar("--accent", "#2563EB");

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const sphereRadius = Math.min(width, height) * 0.42;

      const rotY = time * 0.00022;
      const rotX = -0.35;

      points.forEach((p) => {
        const x = p.x;
        const y = p.y;
        const z = p.z;

        const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);

        const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

        const perspective = 1 / (1.9 - z2);

        let px = cx + x1 * sphereRadius * perspective;
        let py = cy + y2 * sphereRadius * perspective;

        if (pointer.active) {
          const dx = px - pointer.x;
          const dy = py - pointer.y;
          const distance = Math.max(1, Math.hypot(dx, dy));

          if (distance < 120) {
            const force = (1 - distance / 120) * 16;

            px += (dx / distance) * force;
            py += (dy / distance) * force;
          }
        }

        const pulse = 0.85 + Math.sin(time * 0.0014 + p.phase) * 0.15;
        const radius = p.size * perspective * pulse;
        const alpha = 0.18 + ((z2 + 1) / 2) * 0.55;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = alpha;
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      if (!reduceMotion.matches) {
        raf = requestAnimationFrame(draw);
      }
    }

    function start() {
      cancelAnimationFrame(raf);
      resize();
      draw(0);
    }

    function scheduleStart() {
      if (resizeFrame) {
        cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        start();
      });
    }

    holder.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();

      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });

    holder.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(scheduleStart);
      resizeObserver.observe(holder);
    }

    window.addEventListener("resize", scheduleStart);

    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", scheduleStart);
    }

    start();
  })();

  // 12) Results manifesto reveal
  (function initResultsManifestoReveal() {
    const title = document.querySelector("[data-reveal-title]");
    const subtitle = document.querySelector("[data-reveal-subtitle]");
    const rows = Array.from(document.querySelectorAll("[data-reveal-row]"));

    if (!title || !rows.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const showEverything = () => {
      title.classList.add("is-visible");

      if (subtitle) {
        subtitle.classList.add("is-visible");
      }

      rows.forEach((row) => {
        row.classList.add("is-visible");

        const counter = row.querySelector("[data-count]");

        if (counter) {
          counter.textContent = counter.dataset.count;
          counter.dataset.animated = "true";
        }
      });
    };

    const animateCounter = (el) => {
      if (!el || el.dataset.animated === "true") return;

      el.dataset.animated = "true";

      const target = Number(el.dataset.count);
      const duration = 850;
      const startTime = performance.now();

      const frame = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        el.textContent = Math.round(target * eased);

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          el.textContent = target;
        }
      };

      requestAnimationFrame(frame);
    };

    if (reduceMotion || !("IntersectionObserver" in window)) {
      showEverything();
      return;
    }

    const titleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          title.classList.add("is-visible");

          if (subtitle) {
            setTimeout(() => {
              subtitle.classList.add("is-visible");
            }, 140);
          }

          titleObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.28,
        rootMargin: "0px 0px -12% 0px",
      }
    );

    titleObserver.observe(title);

    const rowObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const row = entry.target;
          const counter = row.querySelector("[data-count]");

          row.classList.add("is-visible");
          animateCounter(counter);

          rowObserver.unobserve(row);
        });
      },
      {
        threshold: 0.34,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    rows.forEach((row) => {
      const counter = row.querySelector("[data-count]");

      if (counter) {
        counter.textContent = "0";
        counter.dataset.animated = "false";
      }

      rowObserver.observe(row);
    });
  })();
})();
