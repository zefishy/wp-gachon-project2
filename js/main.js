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

  var FIXTURES = [
    {
      iso: "2026-11-14T14:00:00+09:00",
      home: true,
      opponent: { en: "Hanyang University", ko: "한양대학교", vi: "Đại học Hanyang", ja: "漢陽大学", zh: "汉阳大学" },
      venue: { en: "Global Campus Field", ko: "글로벌캠퍼스 운동장", vi: "Sân Cơ sở Global", ja: "グローバルキャンパス・グラウンド", zh: "全球校区球场" }
    },
    {
      iso: "2026-11-21T13:30:00+09:00",
      home: false,
      opponent: { en: "Kyung Hee University", ko: "경희대학교", vi: "Đại học Kyung Hee", ja: "慶熙大学", zh: "庆熙大学" },
      venue: { en: "Kyung Hee Seoul Campus", ko: "경희대 서울캠퍼스", vi: "Cơ sở Seoul, ĐH Kyung Hee", ja: "慶熙大学ソウルキャンパス", zh: "庆熙大学首尔校区" }
    },
    {
      iso: "2026-11-28T14:00:00+09:00",
      home: true,
      opponent: { en: "Dongguk University", ko: "동국대학교", vi: "Đại học Dongguk", ja: "東国大学", zh: "东国大学" },
      venue: { en: "Global Campus Field", ko: "글로벌캠퍼스 운동장", vi: "Sân Cơ sở Global", ja: "グローバルキャンパス・グラウンド", zh: "全球校区球场" }
    },
    {
      iso: "2026-12-05T14:00:00+09:00",
      home: false,
      opponent: { en: "Seoul National University", ko: "서울대학교", vi: "Đại học Quốc gia Seoul", ja: "ソウル大学", zh: "首尔大学" },
      venue: { en: "SNU Sports Ground", ko: "서울대학교 운동장", vi: "Sân ĐH Quốc gia Seoul", ja: "ソウル大学グラウンド", zh: "首尔大学运动场" }
    },
    {
      iso: "2026-12-12T14:00:00+09:00",
      home: true,
      opponent: { en: "Yonsei University", ko: "연세대학교", vi: "Đại học Yonsei", ja: "延世大学", zh: "延世大学" },
      venue: { en: "Global Campus Field", ko: "글로벌캠퍼스 운동장", vi: "Sân Cơ sở Global", ja: "グローバルキャンパス・グラウンド", zh: "全球校区球场" }
    }
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

  function fmt(date, options) {
    var opts = Object.assign({ timeZone: TIME_ZONE }, options || {});
    return new Intl.DateTimeFormat(locale(), opts).format(date);
  }

  function timeOf(date) {
    return fmt(date, { hour: "2-digit", minute: "2-digit", hour12: false });
  }

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

  /* ---------- Schedule ---------- */
  var fixturesList = $("[data-fixtures]");
  var fixturesEmpty = $("[data-fixtures-empty]");
  var nextMatchNodes = $$("[data-next-opponent]");
  var nextMetaNode = $("[data-next-meta]");
  var nextBadgeNode = $("[data-next-badge]");
  var heroNext = $("[data-hero-next]");
  var heroNextMatch = $("[data-next-match]");
  var heroNextWhen = $("[data-next-when]");
  var heroNextCount = $("[data-next-count]");
  var countdownEl = $("[data-countdown]");
  var countdownDays = $("[data-count-days]");
  var countdownHours = $("[data-count-hours]");
  var countdownMins = $("[data-count-mins]");
  var countdownSecs = $("[data-count-secs]");
  var addCalendarButton = $("[data-add-calendar]");
  var seasonComplete = false;

  function upcomingGames() {
    var now = Date.now();
    return FIXTURES
      .map(function (fixture) {
        return {
          iso: fixture.iso,
          home: fixture.home,
          opponent: fixture.opponent,
          venue: fixture.venue,
          start: new Date(fixture.iso),
          stamp: new Date(fixture.iso).getTime()
        };
      })
      .filter(function (fixture) { return fixture.stamp > now; })
      .sort(function (a, b) { return a.stamp - b.stamp; });
  }

  function makeEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderSchedule() {
    if (!fixturesList) return;
    var games = upcomingGames();
    fixturesList.innerHTML = "";

    games.forEach(function (game) {
      var date = game.start;
      var item = makeEl("li", "fixture");

      var dateWrap = makeEl("span", "fixture-date");
      dateWrap.appendChild(makeEl("span", "fixture-day", fmt(date, { day: "numeric" })));
      var md = makeEl("span", "fixture-md");
      md.appendChild(makeEl("span", "", fmt(date, { month: "short" })));
      md.appendChild(makeEl("span", "", fmt(date, { weekday: "short" })));
      dateWrap.appendChild(md);

      var opponent = makeEl("span", "fixture-opponent", pick(game.opponent));
      var badge = makeEl("span", "badge" + (game.home ? "" : " is-away"), t(game.home ? "schedule.home" : "schedule.away"));
      opponent.appendChild(badge);

      item.appendChild(dateWrap);
      item.appendChild(opponent);
      item.appendChild(makeEl("span", "fixture-venue", pick(game.venue)));
      item.appendChild(makeEl("span", "fixture-time", timeOf(date)));
      fixturesList.appendChild(item);
    });

    if (fixturesEmpty) fixturesEmpty.hidden = games.length !== 0;

    state.next = games[0] || null;
    seasonComplete = !state.next;

    if (state.next) {
      var opponentName = pick(state.next.opponent);
      var venueName = pick(state.next.venue);
      var when = fmt(state.next.start, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) +
        " · " + timeOf(state.next.start) + " " + t("schedule.tz");

      nextMatchNodes.forEach(function (node) { node.textContent = opponentName; });
      if (nextMetaNode) nextMetaNode.textContent = when + " · " + venueName;
      if (nextBadgeNode) {
        nextBadgeNode.hidden = false;
        nextBadgeNode.textContent = t(state.next.home ? "schedule.home" : "schedule.away");
        nextBadgeNode.classList.toggle("is-away", !state.next.home);
      }
      if (heroNextMatch) heroNextMatch.textContent = "VS " + opponentName;
      if (heroNextWhen) heroNextWhen.textContent = when;
      if (heroNext) heroNext.hidden = false;
      if (countdownEl) countdownEl.hidden = false;
      if (addCalendarButton) addCalendarButton.disabled = false;
    } else {
      nextMatchNodes.forEach(function (node) { node.textContent = "—"; });
      if (nextMetaNode) nextMetaNode.textContent = t("schedule.seasonOver");
      if (nextBadgeNode) nextBadgeNode.hidden = true;
      if (heroNext) heroNext.hidden = true;
      if (countdownEl) countdownEl.hidden = true;
      if (addCalendarButton) addCalendarButton.disabled = true;
    }

    updateCountdown();
  }

  function updateCountdown() {
    if (!state.next) {
      if (heroNextCount) heroNextCount.textContent = "";
      return;
    }
    var diff = Math.max(0, state.next.start.getTime() - Date.now());
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    var secs = Math.floor((diff % 60000) / 1000);

    if (countdownDays) countdownDays.textContent = pad(days);
    if (countdownHours) countdownHours.textContent = pad(hours);
    if (countdownMins) countdownMins.textContent = pad(mins);
    if (countdownSecs) countdownSecs.textContent = pad(secs);

    if (heroNextCount) {
      heroNextCount.textContent = days > 0 ? t("schedule.dday", { d: days }) : pad(hours) + "H " + pad(mins) + "M";
    }

    if (diff <= 0 && !seasonComplete) {
      renderSchedule();
    }
  }

  if (state.countdownTimer) window.clearInterval(state.countdownTimer);
  state.countdownTimer = window.setInterval(updateCountdown, 1000);

  function icsDate(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function buildICS() {
    var game = state.next;
    if (!game) return null;
    var end = new Date(game.start.getTime() + 3 * 60 * 60 * 1000);
    var escape = function (text) {
      return String(text).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
    };
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GACHON WIND//Baseball Club//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:gw-" + game.start.getTime() + "@gachonwind.club",
      "DTSTAMP:" + icsDate(new Date()),
      "DTSTART:" + icsDate(game.start),
      "DTEND:" + icsDate(end),
      "SUMMARY:" + escape("GACHON WIND vs " + pick(game.opponent)),
      "LOCATION:" + escape(pick(game.venue)),
      "DESCRIPTION:" + escape(t("schedule.icsDesc")),
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return lines.join("\r\n");
  }

  if (addCalendarButton) {
    addCalendarButton.addEventListener("click", function () {
      var ics = buildICS();
      if (!ics) return;
      var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "gachon-wind-next-game.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    });
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

  /* ---------- Gallery / lightbox ---------- */
  var tiles = $$("[data-lightbox]");
  var lightbox = $("#lightbox");
  var lbImage = $("#lb-img");
  var lbCaption = $("#lb-caption");
  var lbCount = $("#lb-count");
  var lbClose = $("[data-lb-close]");
  var lbPrev = $("[data-lb-prev]");
  var lbNext = $("[data-lb-next]");
  var lbIndex = 0;
  var lbTrigger = null;

  function openLightbox(index) {
    if (!lightbox || !tiles.length) return;
    lbIndex = (index + tiles.length) % tiles.length;
    lbTrigger = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add("is-locked");
    renderLightbox();
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("is-locked");
    if (lbTrigger && typeof lbTrigger.focus === "function") lbTrigger.focus();
  }

  function renderLightbox() {
    var tile = tiles[lbIndex];
    if (!tile || !lbImage) return;
    var image = tile.querySelector("img");
    lbImage.src = tile.getAttribute("data-full");
    lbImage.alt = image ? image.alt : "";
    if (lbCaption) {
      var key = tile.getAttribute("data-caption-key");
      lbCaption.textContent = key ? t(key) : "";
    }
    if (lbCount) lbCount.textContent = pad(lbIndex + 1) + " / " + pad(tiles.length);
  }

  function updateLightbox() {
    if (lightbox && !lightbox.hidden) renderLightbox();
  }

  tiles.forEach(function (tile, index) {
    tile.addEventListener("click", function () { openLightbox(index); });
  });

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbPrev) lbPrev.addEventListener("click", function () { openLightbox(lbIndex - 1); });
  if (lbNext) lbNext.addEventListener("click", function () { openLightbox(lbIndex + 1); });

  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (!lightbox || lightbox.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); closeLightbox(); return; }
    if (event.key === "ArrowLeft") { event.preventDefault(); openLightbox(lbIndex - 1); return; }
    if (event.key === "ArrowRight") { event.preventDefault(); openLightbox(lbIndex + 1); return; }
    if (event.key === "Tab") {
      var focusables = [lbClose, lbPrev, lbNext].filter(function (node) {
        return node && node.offsetParent !== null;
      });
      if (!focusables.length) return;
      var current = focusables.indexOf(document.activeElement);
      var next = event.shiftKey ? current - 1 : current + 1;
      if (next < 0) next = focusables.length - 1;
      if (next >= focusables.length) next = 0;
      event.preventDefault();
      focusables[next].focus();
    }
  });

  /* ---------- Sign-up dialog ---------- */
  var dialog = $("#signup");
  var formView = $("[data-signup-form-view]");
  var successView = $("[data-signup-success-view]");
  var form = $("#signup-form");
  var successBody = $("[data-success-body]");
  var mailtoLink = $("[data-mailto]");
  var copyButton = $("[data-copy]");
  var copyStatus = $("[data-copy-status]");
  var formError = $("[data-form-error]");
  var lastFocus = null;

  function openDialog() {
    if (!dialog) return;
    lastFocus = document.activeElement;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.body.classList.add("is-locked");
    if (formView) formView.hidden = false;
    if (successView) successView.hidden = true;
    var firstField = $("#f-name");
    if (firstField) window.setTimeout(function () { firstField.focus(); }, 60);
  }

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    document.body.classList.remove("is-locked");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  $$("[data-open-signup]").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      openDialog();
    });
  });

  $$("[data-close-signup]").forEach(function (button) {
    button.addEventListener("click", closeDialog);
  });

  if (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("close", function () {
      document.body.classList.remove("is-locked");
      if (form) form.reset();
      if (formView) formView.hidden = false;
      if (successView) successView.hidden = true;
      if (copyStatus) copyStatus.textContent = "";
      state.app = null;
      clearFormErrors();
    });
  }

  var nameField = $("#f-name");
  var studentField = $("#f-student");
  var emailField = $("#f-email");
  var experienceField = $("#f-exp");
  var requiredFields = [nameField, studentField, emailField].filter(Boolean);

  function fieldError(field) {
    return document.querySelector('[data-error-for="' + field.id + '"]');
  }

  function setFieldError(field, message) {
    var node = fieldError(field);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (!node) return;
    node.textContent = message || "";
    node.hidden = !message;
  }

  function clearFormErrors() {
    requiredFields.forEach(function (field) {
      setFieldError(field, "");
      field.removeAttribute("aria-invalid");
    });
    if (formError) {
      formError.textContent = "";
      formError.hidden = true;
    }
  }

  function emailLooksValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateForm() {
    clearFormErrors();
    var firstInvalid = null;
    var problems = 0;

    requiredFields.forEach(function (field) {
      var value = field.value.trim();
      var message = "";
      if (!value) message = t("form.errRequired");
      else if (field.type === "email" && !emailLooksValid(value)) message = t("form.errEmail");
      if (message) {
        setFieldError(field, message);
        problems += 1;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  requiredFields.forEach(function (field) {
    field.addEventListener("input", function () { setFieldError(field, ""); });
  });

  function experienceLabel(value) {
    if (value === "team") return t("form.exp2");
    if (value === "casual") return t("form.exp1");
    return t("form.exp0");
  }

  function buildApplication() {
    var experience = experienceField ? experienceField.value : "none";
    return {
      name: nameField.value.trim(),
      studentId: studentField.value.trim(),
      email: emailField.value.trim(),
      experience: experienceLabel(experience),
      lang: state.lang
    };
  }

  function applicationText(app) {
    return [
      t("form.name") + ": " + app.name,
      t("form.studentId") + ": " + app.studentId,
      t("form.email") + ": " + app.email,
      t("form.experience") + ": " + app.experience,
      "Website language: " + app.lang
    ].join("\r\n");
  }

  function mailtoHref(app) {
    var subject = t("form.mailSubject", { name: app.name });
    return "mailto:" + CLUB_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(applicationText(app));
  }

  function renderApplication() {
    if (!state.app || !successBody) return;
    successBody.textContent = t("form.successBody", { name: state.app.name });
    if (mailtoLink) mailtoLink.setAttribute("href", mailtoHref(state.app));
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validateForm()) {
        if (formError) {
          formError.textContent = t("form.errSummary");
          formError.hidden = false;
        }
        return;
      }
      state.app = buildApplication();
      renderApplication();
      if (formView) formView.hidden = true;
      if (successView) successView.hidden = false;
      if (copyStatus) copyStatus.textContent = "";
      var sendButton = $("[data-mailto]");
      if (sendButton) sendButton.focus();
    });
  }

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      if (!state.app) return;
      var text = applicationText(state.app);
      var done = function (ok) {
        if (!copyStatus) return;
        copyStatus.textContent = ok ? t("form.copied") : t("form.copyFailed");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  }

  function fallbackCopy(text) {
    try {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch (error) {
      return false;
    }
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
