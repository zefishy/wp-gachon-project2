# GACHON WIND — Baseball Club Homepage

A responsive, multilingual homepage for **GACHON WIND**, Gachon University's student-run baseball club, built from the visual language of Team 16's proposal deck.

![Desktop homepage](preview/desktop-home.jpg)

*The same page in Simplified Chinese:*

![Homepage in Simplified Chinese](preview/desktop-home-zh.jpg)

---

## What's on the page

| Section | What it does |
| --- | --- |
| Sticky header | Section navigation, language dropdown (English · 한국어 · Tiếng Việt · 日本語 · 简体中文), dark/light theme toggle, sign-up CTA, mobile drawer |
| Hero | Brand lockup, practice details, primary CTAs, live “next game” card with D-day countdown |
| Ticker | Club wordmark marquee, pausable on hover |
| The club | Club profile, stats, three activity cards, home-field photo |
| Fixtures | Next game panel (countdown + **.ics download**), upcoming-game list built from data |
| Why it's better | The proposal's three promises — always current, easy to join, truly accessible |
| Gallery | Four-photo editorial grid with keyboard-accessible lightbox and Instagram strip |
| Sign up | Three joining steps and an in-page application form (EN/KO/VI/JA) |
| Contact | Email, Instagram, KakaoTalk, practice address and a map link |
| Footer | Navigation, credits, oversized outlined wordmark |

The nav links point to sections on this page, so nothing dead-ends — the start of the deck's “no broken links” promise. The separate schedule, gallery and form pages from the proposal can be layered on later without changing this shell.

---

## Theme taken from the deck

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#F8F8F8` | Page background |
| Royal blue | `#1E509A` | Display type, primary actions, panels |
| Signal red | `#FF2C3E` | Accents, chevrons, numbers, highlights |
| Deep red | `#C8102E` | Small red text on light backgrounds (accessible variant) |
| Ink | `#262626` | Body copy |

- **Display type:** [Anton](https://fonts.google.com/specimen/Anton), used the way the deck uses its condensed caps — huge, uppercase, tightly set, with alternating blue/red lines.
- **Body:** [Archivo](https://fonts.google.com/specimen/Archivo); **labels/kickers:** [Archivo Narrow](https://fonts.google.com/specimen/Archivo+Narrow).
- **Motifs:** red triple-chevrons, thin rules with solid red chevron markers, full-bleed baseball photography, oversized numerals, and a red full stop after big headings.
- Fonts are self-hosted in `static/fonts/` (SIL Open Font License), so the page works offline.

---

## Features

- **Five languages** — English, Korean, Vietnamese, Japanese and Simplified Chinese, switchable at any time from a dropdown. The choice is remembered, and the page title, dates, schedule, fixture names and form all follow it. Korean, Japanese and Chinese headings use a heavy CJK fallback because Anton has no Hangul, Kana or Han glyphs.
- **Dark · light switcher** — a moon/sun button in the header (and in the mobile drawer) flips the whole palette: paper becomes night blue, royal blue lifts to a more saturated azure for display type, and the deep panels stay dark. The choice is remembered in `localStorage`; first-time visitors get their OS `prefers-color-scheme`, kept in sync until they toggle. A tiny inline script applies the theme before first paint, so there is no flash of the wrong theme, and the mobile browser chrome colour follows via `<meta name="theme-color">`. The flip itself cross-fades: the colour tokens are registered with `@property` and `<html>` transitions them on a non-linear ease-in-out curve, so the page glides like a dimmer rather than snapping, and the toggle's moon/sun glyphs trade places on the same curve — a quarter-turn carousel spin instead of a hard cut (all instant under `prefers-reduced-motion`).
- **Live next-game countdown** — reads the fixture list, promotes the next future game, and hides itself when the season is over.
- **Calendar download** — generates a valid `.ics` event (KST times converted to UTC) for the next fixture.
- **Sign-up form** — client-side validation, translated errors and ARIA states. It assembles an application and hands it to the club's email (nothing is silently stored or “sent”). Users can copy the details instead.
- **Gallery lightbox** — arrow-key navigation, captions, counter, focus trap, Escape to close.
- **Mobile drawer** — full-screen menu with practice details and the language dropdown; background content is made `inert` while it is open.
- **Motion with respect** — reveal-on-scroll, marquee and hover effects all collapse under `prefers-reduced-motion`.
- **Accessible by default** — skip link, visible focus rings, labelled controls, `aria-expanded`/`aria-pressed` states, contrast-checked palette, and zero axe WCAG A/AA violations.

---

## Editing guide

### 1. Schedule and countdown

All fixtures live at the top of `js/main.js`:

```js
var FIXTURES = [
  {
    iso: "2026-11-14T14:00:00+09:00",   // Korea Standard Time
    home: true,
    opponent: { en: "Hanyang University", ko: "한양대학교", vi: "Đại học Hanyang", ja: "漢陽大学" },
    venue: { en: "Global Campus Field", ko: "글로벌캠퍼스 운동장", vi: "Sân Cơ sở Global", ja: "グローバルキャンパス・グラウンド" }
  },
  // …
];
```

- Keep the `+09:00` offset so dates render correctly everywhere.
- Past fixtures are filtered out automatically. If every fixture is in the past, the page shows a “next season” message instead of a countdown.
- Opponents and venues are per-language objects; add or remove languages to match `js/i18n.js`.

### 2. Contact details

The club email appears in three places in `index.html` (contact list, join section, footer) and as `CLUB_EMAIL` in `js/main.js` (used by the sign-up mailto). The KakaoTalk handle and street address are also plain text in the contact section.

### 3. Copy and translations

Every string is in `js/i18n.js`, keyed by `data-i18n`, `data-i18n-html` or `data-i18n-attr` in the HTML. To add a language:

1. Add a dictionary with the same keys.
2. Register its `locale` in `GW_LOCALES`.
3. Add `<option value="xx" lang="xx">…</option>` to each of the three `<select data-lang-select>` dropdowns in `index.html` (`lang-header`, `lang-menu`, `lang-banner`), using the language's own endonym.
4. If the schedule should be localised too, add the `xx` key to every `opponent` and `venue` object in `FIXTURES` (`js/main.js`). Missing keys fall back to English.
5. If the language uses Han, Hangul or Kana script, add its `html[lang="xx"]` selectors to the CJK typography section of `css/style.css` so display type uses the heavy system fallback instead of Anton's thin 400.

The four translations are a solid first draft, but should be reviewed by native speakers before launch.

### 4. Photos

Replace the WebP files in `static/img/` (keep the filenames) with real club photography:

| File | Crop / use |
| --- | --- |
| `hero-batter.webp` | 4:5 portrait, 1200 × 1500 |
| `gallery-field.webp` | 3:2 landscape |
| `gallery-gear.webp` | square-ish detail |
| `gallery-ball.webp` | square-ish detail |
| `gallery-aerial.webp` | wide landscape |
| `gallery-sunset.webp` | 4:5 portrait, used beside the sign-up copy |

Update the `alt` text in `index.html` and the matching `*.alt` keys in `i18n.js`.

### 5. Sign-up form → real backend

By design, the form does **not** pretend to submit to a server. On submit it opens the visitor's email app with a prefilled application (`mailto:`), and offers a copy-to-clipboard fallback.

To connect a real endpoint, replace the `form.addEventListener("submit", …)` block in `js/main.js` with a `fetch()` to your form service (Formspree, Google Apps Script, Supabase, etc.), then show the success view only on a successful response.

### 6. Colours, type and spacing

All design tokens are at the top of `css/style.css` (`:root`). Changing `--blue`, `--red` and `--display` re-themes the page. Fluid sizes use `clamp()`; the page has three breakpoints (1060 px for the nav, 1024/860 px for layout, 720/520 px for mobile details).

The dark theme is a single `html[data-theme="dark"]` block right below the tokens — it only overrides token values, no component rules. Two families of tokens do different jobs:

- **Accents** (`--blue`, `--red`, `--red-ink`, `--ink`, `--muted`) are text and line colours on the page background, so they must lift lighter in the dark theme to keep WCAG AA contrast.
- **Panels** (`--blue-panel`, `--red-panel`, `--blue-deep`) are solid surfaces that keep light (`--paper`) text on them in both themes — `--paper` itself never changes. `--bg`, `--bg-alt` and `--surface` are the page, alternate-section and card/input backgrounds.

So to add a new component: use accent tokens for text/borders on the background, panel tokens for filled surfaces, and both themes work automatically.

The flip between them is animated, and its timing lives with the tokens too: `--theme-dur` (0.6s) and `--theme-ease` — a deliberately non-linear ease-in-out, `cubic-bezier(0.65, 0, 0.35, 1)` — gentle at both ends, quick through the middle. The changing colour tokens are registered with `@property` (see "Registered tokens" in `css/style.css`), and one `transition` on `<html>` animates them, so every `var()` reader cross-fades together while hover, reveal and marquee transitions keep their own timing. If you add a new theme-dependent colour token, register it and add it to that `transition` list; browsers without `@property` just switch instantly.

---

## Accessibility & QA

Checked in headless Chromium at 1440, 800 and 390 px, plus the open dialog, lightbox and mobile menu:

- **axe-core WCAG A/AA:** 0 violations in every state and viewport (1 “incomplete” item relates to text over the hero photograph).
- **59/59 functional checks:** image decoding, no horizontal overflow at four widths, HTML integrity (duplicate IDs, anchors, alt text, label targets), all five languages (page, title, nav, headings, fixture names, form copy), dropdown sync + persistence, form validation and submission, lightbox keyboard flow, `.ics` contents, mobile menu state, zero console errors.
- **Keyboard:** skip link, focus-visible rings, native `<dialog>` focus handling, manual lightbox focus trap, Escape behaviour, `inert` background while the mobile menu is open.
- **Motion:** all animation is disabled under `prefers-reduced-motion`.
- **Dark theme:** the same checks were replayed with `data-theme="dark"`; every token pair was re-contrast-checked (accents lift lighter, panels stay dark, `--paper` keeps white text on panels in both themes).

> Preview screenshots in `preview/` were generated at 1440 × 1000 and 390 × 844. The Chinese preview shows the same page with `简体中文` selected.

---

## Project structure

```
gachon-wind/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── i18n.js              # 4 language dictionaries + locale metadata
│   └── main.js              # schedule, countdown, lightbox, form, menu, i18n runtime
├── static/
│   ├── fonts/               # self-hosted Anton / Archivo / Archivo Narrow
│   ├── img/                 # WebP photography
│   └── favicon.svg
├── preview/                # screenshots used in this README
└── README.md
```

---

## Placeholder content — replace before launch

This is a proposal homepage, so several details are illustrative. Please confirm or replace:

- **Fixtures:** all five games, venues and times in `main.js` are sample data.
- **Stats:** “40+ members”, “2 practices a week”, “8 games a season” are placeholders.
- **Contact:** `gachonwind@gmail.com` and KakaoTalk `@gcu_wind` are placeholders; the Instagram handle `@gcu_wind` comes from the deck.
- **Membership details:** “free membership”, “club shirt and locker” should be confirmed by the club.
- **Photography:** the six photos were extracted from the proposal deck (Canva stock). Replace them with club-owned photos, or confirm licensing before publishing.
- **Translations:** draft quality — have Korean, Vietnamese, Japanese and Chinese speakers review them.

---

## Credits

**Team 16 · Web Programming**

- Ooi Yong Wee — schedule and events
- Jasper Teo Kheng Cher — sign-up application form
- Wong Deng Foong — multilingual support
- Wong Guan Qi Ryan — homepage and club info

Built as a single static homepage for the proposal. Fonts: Anton, Archivo and Archivo Narrow via Google Fonts (SIL OFL 1.1). Photography from the team's proposal deck.
