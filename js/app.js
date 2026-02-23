(async function () {
  const root = document.documentElement;

  async function inject(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;
    const res = await fetch(url, { cache: "no-cache" });
    el.innerHTML = await res.text();
  }

  // 1) Inject partials
  await inject("#site-header", "partials/header.html");
  await inject("#site-footer", "partials/footer.html");

  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  // 2) Footer year
  const y = document.getElementById("y");
  if (y) y.textContent = new Date().getFullYear();

  // 3) Theme (switch)
  const themeBtn = document.querySelector(".theme-switch");

  function getPreferredTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (themeBtn) themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
  }

  applyTheme(getPreferredTheme());

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(current === "dark" ? "light" : 'dark');
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
      requestAnimationFrame(() => mobileMenu.classList.add(OPEN_CLASS));
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

// TOC active item (case pages)
(function initTocActive(){
  const toc = document.querySelector(".toc");
  if (!toc) return;

  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  if (!links.length) return;

  const sections = links
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const header = document.querySelector(".site-header") || document.querySelector("header");
  const getOffset = () => (header ? header.offsetHeight : 0) + 24;

  function onScroll(){
    const y = window.scrollY + getOffset();
    let activeIndex = 0;

    for (let i = 0; i < sections.length; i++){
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



  // 5) Active nav state (index scroll + page based)
  const desktopNavLinks = document.querySelectorAll(".navlinks-desktop a");
  const mobileNavLinks = document.querySelectorAll(".mobile-links a");

  function clearActive() {
    [...desktopNavLinks, ...mobileNavLinks].forEach(a => a.classList.remove("active"));
  }

  function setActiveByHrefIncludes(part) {
    [...desktopNavLinks, ...mobileNavLinks].forEach(a => {
      const href = a.getAttribute("href") || "";
      if (href.includes(part)) a.classList.add("active");
    });
  }

  // A) If it's a case page: highlight "Кейсы"
  if (path.startsWith("case-")) {
    clearActive();
    setActiveByHrefIncludes("index.html#cases");
  }

  // B) If it's other projects page: highlight "Другие проекты"
  if (path === "other-projects.html") {
    clearActive();
    setActiveByHrefIncludes("other-projects.html");
  }

  // C) If it's index page: highlight based on scroll position (#cases / #contact)
  if (path === "" || path === "index.html") {
    const anchors = [
      { id: "cases", part: "index.html#cases" },
      { id: "contact", part: "index.html#contact" },
    ].map(x => ({ ...x, el: document.getElementById(x.id) }));

    function onScroll() {
      clearActive();
      const y = window.scrollY + 120;

      for (let i = anchors.length - 1; i >= 0; i--) {
        const s = anchors[i];
        if (!s.el) continue;
        if (y >= s.el.offsetTop) {
          setActiveByHrefIncludes(s.part);
          break;
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // 6) Highlight case cards on scroll (index page only)
  if (path === "" || path === "index.html") {
    const caseCards = document.querySelectorAll(".case-card");

    if (caseCards.length && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              caseCards.forEach(c => c.classList.remove("is-active"));
              entry.target.classList.add("is-active");
            }
          });
        },
        { threshold: 0.6 }
      );

      caseCards.forEach(card => observer.observe(card));
    }
  }

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

  const BASE_BOTTOM = 16; // обычное положение
  const FOOTER_OFFSET = 16; // зазор над футером
  const SHOW_AFTER = 600;

  const footer = document.querySelector("footer");

  function update() {
    // показать / скрыть
    btn.classList.toggle("is-visible", window.scrollY > SHOW_AFTER);

    if (!footer) {
      btn.style.bottom = `${BASE_BOTTOM}px`;
      return;
    }

    const footerTop = footer.getBoundingClientRect().top;

    // если футер попал в viewport
    if (footerTop < window.innerHeight) {
      const lift =
        window.innerHeight - footerTop + FOOTER_OFFSET;
      btn.style.bottom = `${BASE_BOTTOM + lift}px`;
    } else {
      btn.style.bottom = `${BASE_BOTTOM}px`;
    }
  }

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

(function initComponentFilters(){
  const bar = document.querySelector('.filter-bar');
  const buttons = Array.from(document.querySelectorAll('.filter-btn'));
  const items = Array.from(document.querySelectorAll('.component-item'));
  const empty = document.getElementById('component-empty');

  if (!bar || !buttons.length) return;

  function hasToken(el, token){
    const raw = (el.getAttribute('data-cat') || '').trim();
    if (!raw) return false;
    return raw.split(/\s+/).includes(token);
  }

  // ---- Count map (by category) ----
  function buildCounts(){
    const counts = { all: 0 };

    items.forEach(item => {
      const raw = (item.getAttribute('data-cat') || '').trim();
      if (!raw) return;

      const tokens = raw.split(/\s+/);

      // overview count for "all"
      if (tokens.includes('overview')) counts.all += 1;

      // per-category counts (exclude 'overview' itself)
      tokens.forEach(t => {
        if (t === 'overview') return;
        counts[t] = (counts[t] || 0) + 1;
      });
    });

    return counts;
  }

  function renderCounts(counts){
    buttons.forEach(btn => {
      const key = btn.getAttribute('data-filter');
      const n = counts[key] ?? 0;

      const spot = btn.querySelector('.filter-count');
      if (!spot) return;

      // без скобок: "Ввод 12"
      spot.textContent = n ? ` ${n}` : '';
    });
  }

  function setActive(btn){
    buttons.forEach(b => {
      const active = b === btn;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function applyFilter(filter){
    let visibleCount = 0;

    items.forEach(item => {
      let show = false;

      if (filter === 'all') {
        // curated overview
        show = hasToken(item, 'overview');
      } else {
        // normal categories
        show = hasToken(item, filter);
      }

      item.hidden = !show;
      if (show) visibleCount++;
    });

    if (empty) empty.hidden = visibleCount !== 0;
  }

  // Init counts
  const counts = buildCounts();
  renderCounts(counts);

  // Default filter = curated overview
  applyFilter('all');

  // Click handler
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    const filter = btn.getAttribute('data-filter');
    setActive(btn);
    applyFilter(filter);
  });
})();

(function initLightbox(){

  const images = document.querySelectorAll('.zoomable img');
  if (!images.length) return;

  // Create lightbox once
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="Закрыть">×</button>
    <img src="" alt="">
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  function open(src, alt){
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close(){
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  images.forEach(img => {
    img.addEventListener('click', () => {
      open(img.src, img.alt);
    });
  });

  closeBtn.addEventListener('click', close);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

})();

(function initSingleOpenDetails(){
  // Ограничиваемся секцией документации (если она есть)
  const scope = document.getElementById('documentation') || document;
  const detailsList = Array.from(scope.querySelectorAll('details'));

  if (!detailsList.length) return;

  detailsList.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return; // реагируем только на открытие

      detailsList.forEach((other) => {
        if (other !== d) other.open = false;
      });
    });
  });
})();

})();
