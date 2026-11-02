/* ==========================================================================
   GACHON WIND — interactions
   Vanilla JS. No build step, no dependencies.

   EDIT ME: the fixtures below are sample data for the proposal demo.
   Replace opponents, venues and dates with the real season.
   ========================================================================== */

(function () {
  "use strict";

  var CLUB_EMAIL = "gachonwind@gmail.com";
  var TIME_ZONE = "Asia/Seoul";
  ];

  var state = {
    lang: "en",
    theme: "light",
    next: null,
    app: null,
    countdownTimer: null,
    lastLightboxIndex: 0
  };

  /* ---------- Helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function pad(number) { return String(number).padStart(2, "0"); }

  function store(key, value) {
    try { window.localStorage.setItem(key, value); } catch (error) { /* private mode */ }
  }

  function readStore(key) {
    try { return window.localStorage.getItem(key); } catch (error) { return null; }
  }
  /* ---------- Theme (dark · light) ----------
     The saved choice wins; otherwise the page follows prefers-color-scheme
     and keeps following it until the visitor toggles. The <html data-theme>
     attribute is set before first paint by a small inline script in <head>,
     so there is no flash of the wrong theme; applyTheme() re-syncs it here.
     The colours cross-fade in CSS alone: the palette tokens are registered
     with @property and <html> transitions them on the non-linear curve in
     css/style.css ("Theme crossfade"), so this function stays attribute-only. */
  var THEME_KEY = "gw-theme";
  var THEME_COLORS = { light: "#1E509A", dark: "#12161d" };
  var themeToggles = $$("[data-theme-toggle]");
  var themeMedia = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function storedTheme() {
    var saved = readStore(THEME_KEY);
    return saved === "dark" || saved === "light" ? saved : null;
  }

  function systemTheme() {
    return themeMedia && themeMedia.matches ? "dark" : "light";
  }

  function updateThemeControls() {
    var dark = state.theme === "dark";
    var label = t(dark ? "nav.themeLight" : "nav.themeDark");
    themeToggles.forEach(function (button) {
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    });
  }

  function applyTheme(theme, persist) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", state.theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLORS[state.theme]);
    updateThemeControls();
    if (persist) store(THEME_KEY, state.theme);
  }

  function initTheme() {
    applyTheme(storedTheme() || systemTheme(), false);

    themeToggles.forEach(function (button) {
      button.addEventListener("click", function () {
        applyTheme(state.theme === "dark" ? "light" : "dark", true);
      });
    });

    if (!themeMedia) return;
    var followSystem = function (event) {
      if (!storedTheme()) applyTheme(event.matches ? "dark" : "light", false);
    };
    if (themeMedia.addEventListener) themeMedia.addEventListener("change", followSystem);
    else if (themeMedia.addListener) themeMedia.addListener(followSystem);
  }

  /* ---------- Navigation ---------- */
  var header = $("[data-header]");
  var menuButton = $(".menu-btn");
  var mobileMenu = $("#mobile-menu");

  function updateMenuLabel() {
    if (!menuButton) return;
    var open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-label", open ? t("nav.closeMenu") : t("nav.menu"));
  }

  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute("aria-expanded", String(open));
    mobileMenu.hidden = !open;
    document.body.classList.toggle("is-locked", open);
    var main = document.getElementById("main");
    var footer = document.querySelector(".footer");
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    updateMenuLabel();
    if (open) {
      var first = mobileMenu.querySelector("a, button");
      if (first) first.focus({ preventScroll: true });
    }
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });
  }

  if (mobileMenu) {
    $$("a", mobileMenu).forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });
  }

  window.addEventListener("resize", function () {
    if (window.innerWidth > 1060 && menuButton && menuButton.getAttribute("aria-expanded") === "true") {
      setMenu(false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menuButton && menuButton.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuButton.focus();
    }
  });

  var navLinks = $$("[data-nav]");
  var watchedSections = ["club", "schedule", "gallery", "join", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function updateActiveNav() {
    if (!navLinks || !navLinks.length) return;
    var offset = (header ? header.offsetHeight : 76) + 120;
    var activeId = "";
    watchedSections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= offset) activeId = section.id;
    });
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      activeId = "contact";
    }
    navLinks.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + activeId;
      if (match) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      updateActiveNav();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll reveal ---------- */
  var revealNodes = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealNodes.forEach(function (node) { revealObserver.observe(node); });
  } else {
    revealNodes.forEach(function (node) { node.classList.add("is-in"); });
  }

  /* ---------- Boot ---------- */
  $$("[data-lang-select]").forEach(function (select) {
    select.addEventListener("change", function () {
      setLanguage(select.value, true);
    });
  });

  initTheme();
  setLanguage(detectLanguage(), false);
  if (state.countdownTimer) window.clearInterval(state.countdownTimer);
  state.countdownTimer = window.setInterval(updateCountdown, 1000);
})();
