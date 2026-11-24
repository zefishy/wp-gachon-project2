/* ==========================================================================
   GACHON WIND — interactions
   Vanilla JS. No build step, no dependencies.

   EDIT ME: the fixtures below are sample data for the proposal demo.
   Replace opponents, venues and dates with the real season.
   Each fixture's `logo` points at a crest in static/img/teams/ — the ones
   shipped here are each university's official emblem (sourced from Wikipedia /
   Wikimedia Commons; trademarks of their owners). Replace those files to change them.
   ========================================================================== */

(function () {
  "use strict";

  var CLUB_EMAIL = "gachonwind@gmail.com";
  // Paste a free Web3Forms access key (https://web3forms.com) to send applications
  // straight to CLUB_EMAIL. Leave empty to keep the "open my email app" flow.
  var WEB3FORMS_KEY = "20915d4e-bb83-4f11-9f0c-7bcae48b8a12";
  // Paste the club's KakaoTalk open-chat (or Discord) invite link to show a join button.
  var CHAT_URL = "";
  var TIME_ZONE = "Asia/Seoul";

  var FIXTURES = [
    {
      iso: "2026-11-14T14:00:00+09:00",
      home: true,
      short: "HYU",
      logo: "static/img/teams/hanyang.png",
      opponent: { en: "Hanyang University", ko: "한양대학교", vi: "Đại học Hanyang", ja: "漢陽大学", zh: "汉阳大学" },
      venue: { en: "Global Campus Field", ko: "글로벌캠퍼스 운동장", vi: "Sân Cơ sở Global", ja: "グローバルキャンパス・グラウンド", zh: "全球校区球场" }
    },
    {
      iso: "2026-11-21T13:30:00+09:00",
      home: false,
      short: "KHU",
      logo: "static/img/teams/kyunghee.png",
      opponent: { en: "Kyung Hee University", ko: "경희대학교", vi: "Đại học Kyung Hee", ja: "慶熙大学", zh: "庆熙大学" },
      venue: { en: "Kyung Hee Seoul Campus", ko: "경희대 서울캠퍼스", vi: "Cơ sở Seoul, ĐH Kyung Hee", ja: "慶熙大学ソウルキャンパス", zh: "庆熙大学首尔校区" }
    },
    {
      iso: "2026-11-28T14:00:00+09:00",
      home: true,
      short: "DGU",
      logo: "static/img/teams/dongguk.svg",
      opponent: { en: "Dongguk University", ko: "동국대학교", vi: "Đại học Dongguk", ja: "東国大学", zh: "东国大学" },
      venue: { en: "Global Campus Field", ko: "글로벌캠퍼스 운동장", vi: "Sân Cơ sở Global", ja: "グローバルキャンパス・グラウンド", zh: "全球校区球场" }
    },
    {
      iso: "2026-12-05T14:00:00+09:00",
      home: false,
      short: "SNU",
      logo: "static/img/teams/snu.svg",
      opponent: { en: "Seoul National University", ko: "서울대학교", vi: "Đại học Quốc gia Seoul", ja: "ソウル大学", zh: "首尔大学" },
      venue: { en: "SNU Sports Ground", ko: "서울대학교 운동장", vi: "Sân ĐH Quốc gia Seoul", ja: "ソウル大学グラウンド", zh: "首尔大学运动场" }
    },
    {
      iso: "2026-12-12T14:00:00+09:00",
      home: true,
      short: "YSU",
      logo: "static/img/teams/yonsei.png",
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
    lastLightboxIndex: 0,
    calMonth: null,
    selected: null
  };

  /* ---------- Helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function t(key, vars) {
    var dict = window.GW_I18N[state.lang] || window.GW_I18N.en;
    var value = dict[key];
    if (value === undefined) value = window.GW_I18N.en[key];
    if (value === undefined) return key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        value = value.replace(new RegExp("\\{" + name + "\\}", "g"), vars[name]);
      });
    }
    return value;
  }

  function pick(value) {
    if (value && typeof value === "object") return value[state.lang] || value.en;
    return value;
  }

  function locale() {
    return (window.GW_LOCALES[state.lang] || window.GW_LOCALES.en).locale;
  }

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

  /* ---------- Language ----------
     Matches the visitor's browser locale to the first supported language.
     Only the primary subtag is compared, so "zh-CN", "zh-TW" and "zh-Hans"
     all select the Simplified Chinese dictionary. */
  function detectLanguage() {
    var saved = readStore("gw-lang");
    if (saved && window.GW_I18N[saved]) return saved;
    var candidates = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
    for (var i = 0; i < candidates.length; i += 1) {
      var code = String(candidates[i]).slice(0, 2).toLowerCase();
      if (window.GW_I18N[code]) return code;
    }
    return "en";
  }

  function setLanguage(lang, persist) {
    if (!window.GW_I18N[lang]) lang = "en";
    state.lang = lang;
    if (persist !== false) store("gw-lang", lang);
    document.documentElement.lang = lang;
    document.title = t("meta.title");

    $$("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-i18n"));
    });

    $$("[data-i18n-html]").forEach(function (node) {
      node.innerHTML = t(node.getAttribute("data-i18n-html"));
    });

    $$("[data-i18n-attr]").forEach(function (node) {
      node.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var bits = pair.split(":");
        var attr = bits.shift().trim();
        var key = bits.join(":").trim();
        node.setAttribute(attr, t(key));
      });
    });

    $$("[data-lang-select]").forEach(function (select) {
      select.value = lang;
    });

    renderSchedule();
    if (state.app) renderApplication();
    updateMenuLabel();
    updateThemeControls();
    updateLightbox();
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
  var calendarRoot = $("[data-calendar]");
  var calGrid = $("[data-cal-grid]");
  var calWeekdays = $("[data-cal-weekdays]");
  var calMonthLabel = $("[data-cal-month]");
  var calPrev = $("[data-cal-prev]");
  var calNext = $("[data-cal-next]");
  var calDetail = $("[data-cal-detail]");
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

  /* Calendar days are always Seoul days, whatever the visitor's own zone. */
  var KEY_FORMAT = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

  function dayKey(date) {
    var parts = {};
    KEY_FORMAT.formatToParts(date).forEach(function (part) { parts[part.type] = part.value; });
    return parts.year + "-" + parts.month + "-" + parts.day;
  }

  /* Months as a single counter (year * 12 + month) so prev/next is ±1. */
  function monthIndexOf(key) {
    return Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1;
  }

  function allGames() {
    return FIXTURES
      .map(function (fixture) {
        var start = new Date(fixture.iso);
        return {
          iso: fixture.iso,
          home: fixture.home,
          short: fixture.short,
          logo: fixture.logo,
          opponent: fixture.opponent,
          venue: fixture.venue,
          start: start,
          stamp: start.getTime(),
          key: dayKey(start)
        };
      })
      .sort(function (a, b) { return a.stamp - b.stamp; });
  }

  function upcomingGames() {
    var now = Date.now();
    return allGames().filter(function (game) { return game.stamp > now; });
  }

  function makeEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeLogo(src, className) {
    var img = makeEl("img", className);
    img.src = src;
    img.alt = "";
    img.width = 64;
    img.height = 64;
    img.decoding = "async";
    return img;
  }

  function gameStatus(game) {
    if (game.stamp <= Date.now()) return "played";
    if (state.next && state.next.iso === game.iso) return "next";
    return "upcoming";
  }

  function statusLabel(status) {
    if (status === "played") return t("schedule.played");
    if (status === "next") return t("schedule.nextLabel");
    return t("schedule.upcoming");
  }

  function selectGame(game, focusCell) {
    state.selected = game.iso;
    state.calMonth = monthIndexOf(game.key);
    renderCalendar();
    if (focusCell && calGrid) {
      var cell = calGrid.querySelector('[data-game="' + game.iso + '"]');
      if (cell) cell.focus();
    }
  }

  function renderCalendar() {
    if (!calendarRoot) return;
    var games = allGames();
    calendarRoot.hidden = games.length === 0;
    if (fixturesEmpty) fixturesEmpty.hidden = games.length !== 0;
    if (!games.length) return;

    var focusGame = state.next || games[games.length - 1];
    var firstMonth = monthIndexOf(games[0].key);
    var lastMonth = monthIndexOf(games[games.length - 1].key);
    if (state.calMonth === null) state.calMonth = monthIndexOf(focusGame.key);
    state.calMonth = Math.min(lastMonth, Math.max(firstMonth, state.calMonth));
    if (!games.some(function (game) { return game.iso === state.selected; })) state.selected = focusGame.iso;

    var year = Math.floor(state.calMonth / 12);
    var month = state.calMonth % 12;

    /* Noon UTC on the 15th lands inside the same month in any zone. */
    if (calMonthLabel) calMonthLabel.textContent = fmt(new Date(Date.UTC(year, month, 15, 12)), { month: "long", year: "numeric" });
    if (calPrev) calPrev.disabled = state.calMonth <= firstMonth;
    if (calNext) calNext.disabled = state.calMonth >= lastMonth;

    if (calWeekdays) {
      calWeekdays.innerHTML = "";
      for (var w = 0; w < 7; w += 1) {
        var ref = new Date(Date.UTC(1970, 0, 4 + w, 12)); /* 4 Jan 1970 was a Sunday */
        var head = makeEl("span", "cal-weekday" + (w === 0 || w === 6 ? " is-weekend" : ""));
        head.appendChild(makeEl("span", "cal-weekday-short", fmt(ref, { weekday: "short" })));
        head.appendChild(makeEl("span", "cal-weekday-narrow", fmt(ref, { weekday: "narrow" })));
        calWeekdays.appendChild(head);
      }
    }

    var byKey = {};
    games.forEach(function (game) { byKey[game.key] = game; });
    var todayKey = dayKey(new Date());
    var lead = new Date(Date.UTC(year, month, 1)).getUTCDay();
    var daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    var cells = Math.ceil((lead + daysInMonth) / 7) * 7;

    calGrid.innerHTML = "";
    for (var i = 0; i < cells; i += 1) {
      var day = i - lead + 1;
      if (day < 1 || day > daysInMonth) {
        calGrid.appendChild(makeEl("div", "cal-cell is-blank"));
        continue;
      }
      var key = year + "-" + pad(month + 1) + "-" + pad(day);
      var game = byKey[key];
      var classes = ["cal-cell"];
      if (i % 7 === 0 || i % 7 === 6) classes.push("is-weekend");
      if (key === todayKey) classes.push("is-today");

      if (!game) {
        var plain = makeEl("div", classes.join(" "));
        plain.appendChild(makeEl("span", "cal-num", String(day)));
        calGrid.appendChild(plain);
        continue;
      }

      var status = gameStatus(game);
      var selected = game.iso === state.selected;
      classes.push("has-game", game.home ? "is-home" : "is-away", "is-" + status);
      if (selected) classes.push("is-selected");

      var cell = makeEl("button", classes.join(" "));
      cell.type = "button";
      cell.setAttribute("data-game", game.iso);
      cell.setAttribute("aria-pressed", selected ? "true" : "false");
      cell.setAttribute("aria-label", [
        fmt(game.start, { weekday: "long", day: "numeric", month: "long" }),
        "GACHON WIND vs " + pick(game.opponent),
        t(game.home ? "schedule.home" : "schedule.away"),
        timeOf(game.start) + " " + t("schedule.tz"),
        pick(game.venue),
        statusLabel(status)
      ].join(", "));

      var top = makeEl("span", "cal-cell-top");
      top.appendChild(makeEl("span", "cal-num", String(day)));
      if (status !== "upcoming") top.appendChild(makeEl("span", "cal-flag", statusLabel(status)));
      cell.appendChild(top);

      var crest = makeEl("span", "cal-crest");
      crest.appendChild(makeLogo(game.logo, "cal-logo"));
      cell.appendChild(crest);

      cell.appendChild(makeEl("span", "cal-code", game.short));
      var meta = makeEl("span", "cal-meta");
      meta.appendChild(makeEl("span", "cal-time", timeOf(game.start)));
      meta.appendChild(makeEl("span", "cal-ha", t(game.home ? "schedule.homeShort" : "schedule.awayShort")));
      cell.appendChild(meta);

      calGrid.appendChild(cell);
    }

    renderDetail(games);
  }

  function renderDetail(games) {
    if (!calDetail) return;
    var index = 0;
    games.forEach(function (game, i) { if (game.iso === state.selected) index = i; });
    var game = games[index];
    var status = gameStatus(game);

    calDetail.innerHTML = "";
    calDetail.className = "cal-detail is-" + status;

    var head = makeEl("div", "cal-detail-head");
    var tag = makeEl("p", "cal-detail-status");
    tag.appendChild(makeEl("span", "cal-detail-dot"));
    tag.appendChild(document.createTextNode(statusLabel(status)));
    head.appendChild(tag);
    head.appendChild(makeEl("p", "cal-detail-count", t("schedule.gameOf", { n: index + 1, total: games.length })));
    calDetail.appendChild(head);

    var matchup = makeEl("div", "cal-matchup");
    var us = makeEl("div", "cal-side");
    us.appendChild(makeLogo("static/img/teams/gachon.png", "cal-side-logo"));
    us.appendChild(makeEl("span", "cal-side-name", "GACHON WIND"));
    var them = makeEl("div", "cal-side");
    them.appendChild(makeLogo(game.logo, "cal-side-logo"));
    them.appendChild(makeEl("span", "cal-side-name", game.short));
    /* "VS" at home, "@" away — GACHON WIND @ host reads the usual way. */
    matchup.appendChild(us);
    matchup.appendChild(makeEl("span", "cal-vs", game.home ? "VS" : "@"));
    matchup.appendChild(them);
    calDetail.appendChild(matchup);

    calDetail.appendChild(makeEl("h3", "cal-detail-name", pick(game.opponent)));

    var facts = makeEl("dl", "cal-facts");
    [
      ["schedule.date", fmt(game.start, { weekday: "long", day: "numeric", month: "long", year: "numeric" })],
      ["schedule.time", timeOf(game.start) + " " + t("schedule.tz")],
      ["schedule.venue", pick(game.venue)],
      ["schedule.side", t(game.home ? "schedule.homeGame" : "schedule.awayGame")]
    ].forEach(function (row) {
      var wrap = makeEl("div", "cal-fact");
      wrap.appendChild(makeEl("dt", "", t(row[0])));
      wrap.appendChild(makeEl("dd", "", row[1]));
      facts.appendChild(wrap);
    });
    calDetail.appendChild(facts);

    var actions = makeEl("div", "cal-detail-actions");
    if (status !== "played") {
      var ics = makeEl("button", "btn btn-primary btn-sm");
      ics.type = "button";
      ics.setAttribute("data-cal-ics", "");
      ics.appendChild(makeEl("span", "", t("schedule.addCal")));
      var plus = makeEl("span", "", "＋");
      plus.setAttribute("aria-hidden", "true");
      ics.appendChild(plus);
      actions.appendChild(ics);
    }
    var pager = makeEl("div", "cal-pager");
    [[-1, "‹", "schedule.prevGame"], [1, "›", "schedule.nextGame"]].forEach(function (spec) {
      var step = makeEl("button", "cal-step", spec[1]);
      step.type = "button";
      step.setAttribute("data-cal-step", String(spec[0]));
      step.setAttribute("aria-label", t(spec[2]));
      step.title = t(spec[2]);
      step.disabled = !games[index + spec[0]];
      pager.appendChild(step);
    });
    actions.appendChild(pager);
    calDetail.appendChild(actions);
  }

  if (calGrid) {
    calGrid.addEventListener("click", function (event) {
      var cell = event.target.closest("[data-game]");
      if (!cell) return;
      var game = allGames().filter(function (g) { return g.iso === cell.getAttribute("data-game"); })[0];
      if (game) selectGame(game, true);
    });
  }

  [[calPrev, -1], [calNext, 1]].forEach(function (pair) {
    if (!pair[0]) return;
    pair[0].addEventListener("click", function () {
      state.calMonth += pair[1];
      /* Follow along: select the first game of the month we land on. */
      var inMonth = allGames().filter(function (g) { return monthIndexOf(g.key) === state.calMonth; });
      if (inMonth.length) state.selected = inMonth[0].iso;
      renderCalendar();
    });
  });

  if (calDetail) {
    calDetail.addEventListener("click", function (event) {
      var games = allGames();
      var index = -1;
      games.forEach(function (g, i) { if (g.iso === state.selected) index = i; });
      if (index < 0) return;

      if (event.target.closest("[data-cal-ics]")) {
        downloadICS(games[index], "gachon-wind-vs-" + games[index].short.toLowerCase() + ".ics");
        return;
      }
      var step = event.target.closest("[data-cal-step]");
      if (step) {
        var target = games[index + Number(step.getAttribute("data-cal-step"))];
        if (!target) return;
        selectGame(target, false);
        var same = calDetail.querySelector('[data-cal-step="' + step.getAttribute("data-cal-step") + '"]');
        if (same && !same.disabled) same.focus();
        else if (calGrid) {
          var cell = calGrid.querySelector('[data-game="' + target.iso + '"]');
          if (cell) cell.focus();
        }
      }
    });
  }

  function renderSchedule() {
    var games = upcomingGames();
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

    renderCalendar();
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

  function buildICS(game) {
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

  function downloadICS(game, filename) {
    var ics = buildICS(game);
    if (!ics) return;
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  if (addCalendarButton) {
    addCalendarButton.addEventListener("click", function () {
      downloadICS(state.next, "gachon-wind-next-game.ics");
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
  var reasonField = $("#f-reason");
  var experienceField = $("#f-exp");
  var requiredFields = [nameField, studentField, emailField, reasonField].filter(Boolean);

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
      else if (field === studentField && !/^\d{9}$/.test(value)) message = t("form.errStudentId");
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
      reason: reasonField ? reasonField.value.trim() : "",
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
      t("form.reason") + ": " + app.reason,
      t("form.langLabel") + ": " + app.lang
    ].join("\r\n");
  }

  function mailtoHref(app) {
    var subject = t("form.mailSubject", { name: app.name });
    return "mailto:" + CLUB_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(applicationText(app));
  }

  var chatLink = $("[data-chat-link]");
  var formNote = $(".form-note");
  var submitButton = form ? form.querySelector('button[type="submit"]') : null;

  function renderApplication() {
    if (!state.app || !successBody) return;
    var sent = state.app.sent;
    var kicker = $("[data-success-kicker]");
    var title = $("[data-success-title]");
    if (kicker) kicker.textContent = t(sent ? "form.sentKicker" : "form.successKicker");
    if (title) title.textContent = t(sent ? "form.sentTitle" : "form.successTitle");
    successBody.textContent = (state.app.failed ? t("form.sendFailed") + " " : "") +
      t(sent ? "form.sentBody" : "form.successBody", { name: state.app.name });
    if (mailtoLink) {
      mailtoLink.setAttribute("href", mailtoHref(state.app));
      mailtoLink.hidden = sent;
    }
    if (copyButton) copyButton.hidden = sent;
    if (chatLink) {
      chatLink.hidden = !(sent && CHAT_URL);
      if (CHAT_URL) chatLink.setAttribute("href", CHAT_URL);
    }
  }

  if (formNote && WEB3FORMS_KEY) formNote.hidden = true;

  function submitToService(app) {
    return fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: t("form.mailSubject", { name: app.name }),
        from_name: "GACHON WIND sign-up",
        name: app.name,
        email: app.email,
        student_id: app.studentId,
        experience: app.experience,
        reason: app.reason,
        language: app.lang,
        botcheck: ""
      })
    }).then(function (response) { return response.json(); })
      .then(function (data) { return !!(data && data.success); });
  }

  function showSuccess() {
    renderApplication();
    if (formView) formView.hidden = true;
    if (successView) successView.hidden = false;
    if (copyStatus) copyStatus.textContent = "";
    var primary = state.app.sent ? (chatLink && !chatLink.hidden ? chatLink : $(".signup .link-btn")) : mailtoLink;
    if (primary) primary.focus();
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
      state.app.sent = false;
      if (!WEB3FORMS_KEY) {
        showSuccess();
        return;
      }
      var label = submitButton ? submitButton.querySelector("[data-i18n]") : null;
      var originalLabel = label ? label.textContent : "";
      if (submitButton) submitButton.disabled = true;
      if (label) label.textContent = t("form.sending");
      submitToService(state.app).catch(function () { return false; }).then(function (ok) {
        if (submitButton) submitButton.disabled = false;
        if (label) label.textContent = originalLabel;
        // On failure, fall back to the email flow so the application is never lost.
        state.app.sent = ok;
        state.app.failed = !ok;
        showSuccess();
      });
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
