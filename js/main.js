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
