<div align="center">

<img src="assets/img/banner.jpg" alt="LuminSDK — 1,100+ browser games" width="100%">

# LuminSDK

**1,100+ games you can play right in your browser. No downloads. No sign-up. No installs.**

[![License](https://img.shields.io/badge/license-MIT-8b5cf6?style=flat-square)](LICENSE)
[![Games](https://img.shields.io/badge/games-1%2C100%2B-22d3ee?style=flat-square)](https://suckinguptoessry.github.io/LuminSDK/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-online-34d399?style=flat-square)](https://suckinguptoessry.github.io/LuminSDK/)
[![PRs](https://img.shields.io/badge/PRs-welcome-f472b6?style=flat-square)](CONTRIBUTING.md)
[![Open Source](https://img.shields.io/badge/open--source-yes-6366f1?style=flat-square)](LICENSE)

[🌐 Live site](https://suckinguptoessry.github.io/LuminSDK/) ·
[🐛 Issues](https://github.com/SuckingUpToesSry/LuminSDK/issues) ·
[📚 LuminSDK docs](https://docs.luminsdk.com/) ·
[🇧🇷 Versão em português](README.md)

</div>

---

## About

LuminSDK is an **open-source browser game portal**. It loads a catalog of 1,100+ games through the
[LuminSDK](https://docs.luminsdk.com/) and renders them with a custom interface built from scratch:
instant search, category filters, sorting, a random picker, pagination and a fullscreen game player.

Open the page and play — no account, no download, no installation.

| | |
|---|---|
| **Live site** | https://suckinguptoessry.github.io/LuminSDK/ |
| **Author** | Ryan Smith |
| **License** | MIT |
| **Stack** | Plain HTML, CSS and JavaScript (no build step, no dependencies) |
| **Catalog** | LuminSDK (`cdn.jsdelivr.net/gh/luminsdk/script@latest`) |

> This project does **not** host or redistribute games. It is a client for the public LuminSDK API;
> every game belongs to its respective authors.

---

## Features

- 🎮 **Full catalog** — 1,100+ games served by LuminSDK in a dense grid of up to **9 columns**.
- ❤️ **Favorites** — save games with one click; they stay in your browser.
- 🕘 **Continue playing** — a short history of recently opened games.
- 🎛️ **Custom grid** — **columns** and **rows** sliders plus **card size** (S/M/L); pagination recalculates itself.
- 🖌️ **Per-game colors** — each game can have its own accent color, saved locally.
- 🎛️ **Customization (21 options)** — theme, 16 preset colors, font, corners, density, animation speed and 17 effect switches (particles, parallax, cursor, blurs, hover, Y2K, chrome, gloss, neon, glow, stars, bubbles, grid, noise, scanlines). Includes automatic device detection, **light** / **full** presets and a **personal suggestion** built from your device and your history.
- ✦ **For you** — a recommendation rail built from the categories you play most and your favorites; shuffle it or hide it for today.
- 🎯 **Daily challenges** — three goals drawn per day (sessions, minutes, variety, category and evening play), with progress, a day streak and a notice when completed.
- 🏆 **Achievements** — 17 local medals (first session, marathons, day streaks, late nights, favorites…) with an on-screen notice and progress saved in the browser.
- 📊 **Player statistics** — sessions, total time, unique games, day streak, a last-7-days chart, favorite categories and most-played games.
- ✨ **Y2K look** — chrome titles, glass buttons, rising bubbles, star field, scanlines and bubble corners — every effect can be switched off on its own.
- 📦 **Backup** — export/import favorites, history, colors and grid as JSON.
- 🎁 **Bonus** — a tools hub: gamepad tester (built for the Xbox controller and browser), connection monitor and cache manager.
- 🎨 **Color palette** — 16 presets plus a free color picker and hue slider: the whole site (buttons, glows, particles, cursor) recolors instantly and is saved.
- ✨ **Living atmosphere** — canvas particles in the chosen color (halo, twinkle and a glow that follows the pointer), a parallax background and a custom cursor with a glowing ring. They are on by default — even with "reduce motion" enabled, which stops the autonomous animation but keeps the dots reacting to the pointer.
- 🔗 **One address only** — `…/LuminSDK/` and nothing more: search, category, page, favorites and an open game never touch the URL.
- 🔎 **Debounced search** with smart empty states.
- 🏷️ **Dynamic categories** pulled straight from the SDK.
- 🔀 **Random picker** — button for when you can't decide.
- 🖥️ **Custom player** — fullscreen, restart, open in a new tab and skeleton loading.
- 🌗 **Light & dark themes**, saved in `localStorage`, honoring `prefers-reduced-motion`.
- ⚡ **Zero dependencies** — no framework, no bundler.
- ♿ **Accessible** — keyboard support, visible focus, `aria-live` updates.
- 📲 **Installable (PWA)** — manifest, icons and a service worker for offline app-shell.
- 🛟 **Resilient** — falls back to the SDK's built-in UI if the custom one fails,
  and ships a demo mode (`?demo`) for offline layout work.

---

## One URL, eight tabs and LuminOS as a site

**Everything happens at `https://suckinguptoessry.github.io/LuminSDK/`** — nothing after the last
slash.

The site now **opens straight into the study portal** (the decoy). There is no picker screen any
more: to reach the game catalog, click **Ryan Smith** in the study footer, or press Shift + D / Alt + S.
The decoy is **total**: on every tab — LuminSDK, GN-Math, catalogs, sites, browser, Hub and LuminOS —
the page is titled **“StudyHub | Estudos e Quiz”** and uses the StudyHub logo.
**LuminOS is not a tab** — it is a site in the collection (`dylanmc.site`) and opens in the built-in
browser like any other. The mode pick lives only in this session (`luminsdk:v1:mode`) and the URL
stays exactly the same everywhere.

| Mode | What it is |
|---|---|
| **OS** | **LuminOS**: a dark desktop with wallpapers, a dock, draggable windows with minimize/maximize and real apps (Central, Profile, Games, Lab, Studio, Arcade, Vault, Community, Movies, Browser, Sites, Chat, Notes, Calculator, Settings, About). |
| **Normal** | The site as it always was: game catalog, side tabs and the study portal. | Switching tabs, searching, filtering favorites, opening settings, playing, opening the study
portal: none of it changes the address. No `/gn/`, no `/sites/`, no `#/anything`, no `?cat=`. Copy the
URL in the middle of a game and it is still just `…/LuminSDK/`.

How it works (`assets/js/app.js`):

- every tab is an `.app-view` block inside the **same** `index.html`;
- clicking a tab (or the shortcut) only swaps which block is visible — `history` is never touched;
- the chosen tab lives in `sessionStorage` (`luminsdk:v1:start`), so reloading keeps the tab you were
  in, still on the same URL;
- each tab's CSS and JS are fetched **the first time** it opens, and only the active tab's stylesheet
  stays enabled (Study is light and must not leak into the rest).

The rail holds **eight tabs**, each with one job:

| Group | Tab | What it is |
|---|---|---|
| Catalogs | **Lumin** | The main catalog served by the LuminSDK API — unchanged. |
| | **GN-Math** | Parallel library with the public GN-Math collection (own look, settings, cursor, favorites, history). |
| | **DuckMath** | The DuckMath catalog **inside the site**: its 8 addresses with type filters, search and the minimal mode. |
| | **Astra** | Same thing for the 25 Astra addresses. |
| Tools | **Sites** | The 67 collections that open **inside** LuminSDK, in a built-in viewer. |
| | **Nav** | The site **browser**: address bar, home with the catalog and the clean tab. |
| | **Study** | StudyDesk: a real study portal and the **decoy**. This is the tab that opens by default. |

### Provider catalogs (DuckMath and Astra tabs)

Those two tabs never throw you out of the site: they build their **own catalog** from that
collection's addresses in `assets/data/sites.json` (`assets/js/provider.js`).

- type filters — **Tudo, Jogos, Ports, Servidores, Cloud gaming, Visuais, Estudos** — each chip with
  its count; a filter with no items is simply not shown;
- a search field over name, address and collection;
- a **Tudo / Minimal** button switching between a cover grid and a compact list;
- clicking an item opens it **embedded** (`#pv-frame`) with reload, fullscreen, **clean tab** and
  **Esc** to close. If the site refuses the iframe, the honest note shows up after 9 seconds — no
  pretending it worked.

Each item's type comes from a keyword classifier (name, address, collection), so a few entries will
land in "Jogos" by default — it is approximate, not hand-curated.

### Browser (Nav tab)

It tries three honest routes to open a site inside the page:

1. a plain iframe with `referrerpolicy="no-referrer"`;
2. a reload with a cache-buster, to escape a stubborn `about:blank`;
3. a **clean tab**: an `about:blank` window gets a loading screen and **this page** navigates it
   (`location.replace`), with `opener` cut and no referrer.

If the site stays blank, the notice offers **“Abrir em aba limpa”** and **“Tentar aqui de novo”**.

> **About Lightspeed, BlueCore, GoGuardian and friends:** when the block comes from an extension or the
> school network it happens **outside** the page — no page JavaScript can switch it off. LuminSDK does
> the clean route (loose tab, no referrer, no link back), which sometimes passes origin-only filters,
> and says clearly when it did not work. No fake success.

The `gn/`, `sites/` and `study/` folders are now just **compatibility shortcuts**: anyone with an old
address saved is sent back to `…/LuminSDK/` already on the right tab.

### LuminOS (OS mode)

OS mode is a real desktop inside the same page:

- **windows** you can drag, minimize, maximize, close and snap to a side, with size and position
  remembered per app (full screen on phones);
- a **dock** with sixteen apps (two rows on phones, never hidden behind scrolling) plus **desktop shortcuts**;
- **Central**: global search (apps, games, sites, notes and help), an app launcher with categories,
  pins and most
  used, a window manager (snap left/right, centre, cascade, close all), a browser diagnostic graded
  **supported / limited / unavailable / untested**, a live performance monitor (FPS, long tasks, memory
  when exposed), workspaces and windows (focus, snap, move to area), a storage and cache map with
  confirmations, built-in help and the version page;
- **wallpapers** (aurora, midnight, forest, paper) and an **accent colour**, saved in `luminsdk:v1:os`;
- **gamepad and keyboard**: with a pad connected the D-pad walks the controls of the focused window,
  **A** activates and **B** closes the window (off inside the player, where the pad belongs to the game);
- **four workspaces**: every window belongs to one area (`Alt`+`1`…`4` or the *Área N* button), with
  per-area counts, moving the active window and everything saved in `luminsdk:v1:os:ws`;
- **window switcher**: `Alt`+`` ` `` cycles the windows of the area with a clickable HUD;
- **configurable dock**: order, hidden apps and auto-hide in the *Ajustar* button, saved in
  `luminsdk:v1:os:dock`, with “restore defaults”;
- **remappable shortcuts** in *Settings → Internal shortcuts* (conflicts refused, `Esc` cancels, never
  inside text fields), saved in `luminsdk:v1:os:keys`;
- **Games**: the 848 GN-Math titles with covers (four mirrors, monogram fallback) and a built-in player
  with back, reload and open-in-new-tab;
- **Browser**: address bar, home with the main collections and an honest notice when a site refuses to
  be embedded;
- **Sites**: the 67 collections in a searchable list (they open in the Browser);
- **Profile**: XP, level, achievements, daily challenges, collections, reviews and a year-in-review,
  all in `luminsdk:player:v1` (`assets/js/player.js`);
- **Lab**: gamepad test (sticks, triggers, rumble), keyboard and mouse map, input latency and a browser
  diagnostic (screen, FPS, storage, battery, feature matrix);
- **Studio**: wallpaper, accent colour (including a custom hex), density, typography plus **Lite**,
  **Immersive**, **no-motion** and **high-contrast** modes, the **command palette** (`Ctrl/⌘ + K`) and
  the **notification centre**;
- **Arcade**: aim trainer, game roulette, daily challenge, virtual pet, quiz, WebAudio soundboard (no
  audio files), stopwatch, unit converter and trivia;
- **Vault**: full `.json` backup (export/import), per-app codes (`LUM-PREF-…`, `LUM-PLAY-…`, `LUM-PET-…`),
  a storage map and the developer corner (changelog, asset status, session error log, raw preferences
  and a playground);
- **notification categories** in Studio: achievements/XP and system can be toggled separately, and a
  muted category is never stored;
- **Community**: collection codes (`LUM-COLL-…`), ready-made packs, recommendations computed on your
  machine and a shareable wishlist — with **no** fake login, cloud or public profile;
- **Notes** (saved locally), **Calculator**, **Settings** and **About**.

These tools also exist **outside the OS**: the **Hub** tab (in the rail, next to Sites, Nav and
Study) mounts Central, Profile, Lab, Studio, Arcade, Vault and Community inside a dark frame with no windows
and no dock — same code (`assets/js/hub.js` calls each app's `render()`). The accent colour, density
and typography chosen in Studio show up there too; wallpaper and immersive mode stay desktop-only.

### Live presence and global chat

Two floating pieces follow the site — and hide on Study, on the entry screen and **while a game is
open**, coming back when it closes:

- **People counter** (`1 pessoa online`): every tab checks in every 15 s and the number counts whoever
  showed up in the last 75 s.
- **Global chat**: no sign-up — pick a name and talk. The list keeps **100 messages** in the browser
  (`luminsdk:v1:chat`): when the 101st arrives, the oldest goes, one at a time. Messages try to travel
  between visitors through the public `ntfy.sh` relay; if the relay is unavailable the chat keeps
  working across tabs of the same browser (`BroadcastChannel`) and the panel says **“modo local”** — it
  never pretends a message was sent.

> The site is static (GitHub Pages), so **there is no database**: messages live in the reader's browser
> and, when the public relay is up, reach whoever is online. The 100-message limit applies to that list.

### Sites tab

The Sites tab holds **67 collections / 749 links**, already cleaned, de-duplicated and properly
named: **Games** (Eaglercraft, Frogies Arcade, GTA V Port, Subway Surfers, Super Mario 64),
**Packs** (Flight Academy with 34 subdomains, C00lKid, Bagatz) and **Study** (Revault, Fern, Solara,
Astra, Aether, Opium, Galaxy, Duck Math, GN-Math, LuminalOS, N7x, Petezah's Study, CatClass/cat4z, Bull 33, Bonus,
Aurora, DogeUB, Tung Tung, Velara, Selenite, Cherri, Voya, Xylora, Interstellar, Utopia, Rook, Kite,
plus the mirrors grouped by domain: `tribeoftwo.com`, `streetdirectory.sg`,
`solidaritysafaris.com`, `rusticrivergear.com`, `nextcomm.com.ar`, `amazonaws.com`, `govt.hu`,
`lirr.space` and more). Every collection has its own **image**: local art for LuminSDK, Links, LuminalOS, N7x, Aurora, Solara,
Galaxy V7, Revault and Petezah; official logos for Astra, Duck Math, Opium, Fern, Cherri and the rest —
and when an image fails, the coloured monogram takes over.

Each collection is a single collapsed row — logo (or a coloured monogram), name, link count and
category. Opening it shows the links in a compact grid: clicking one opens the site **right there**,
while `↗` opens it in a new tab. There is instant search (name and address), **All / Games / Packs /
Study** filters. None of it touches the URL — the viewer state lives in memory only.

The viewer has a title bar, reload, fullscreen, “open in a new tab” and close (`Esc`). Rows are only
built when a collection is opened, so the page stays light even with hundreds of links.

Tab artwork: `assets/img/sites-hero.jpg` (1440 px) and `sites-hero-sm.jpg` (760 px, small screens).

### Clean tab: when a site refuses to be embedded

Many of those addresses send `X-Frame-Options`/`Content-Security-Policy` and **refuse** to be
embedded — the iframe goes blank, and no LuminSDK code can get around it (the browser is obeying the
hosted site).

So LuminSDK does this:

1. **Tries inline** as usual.
2. If the page does not load within 10 s (or loads instantly and blank), the address is remembered in
   `localStorage` and the site opens in a **clean tab**: an `about:blank` tab where LuminSDK writes a
   loading screen and only then navigates to the address, with `referrer` off and `window.opener`
   cut. Same page, same study material, just in a tab with no link back to the previous one — which
   makes several school/network filters let it through.
3. The viewer note stays available with **“Open in a new tab”** and **“Try inline again”** (which
   clears the flag).
4. The **“Open in a new tab”** button next to the filters turns that mode on for *every* site, if you
   prefer it that way. Each row's `↗` also goes through the clean tab.

> The list of addresses that failed lives only in your browser (`luminsdk:v1:sites:blocked`), never in
> the repository.

To add, rename or remove links, edit **`assets/data/sites.json`** — it is the tab's single data
source and needs no build:

```json
{ "v": 2, "families": [
  { "id": "solara", "name": "Solara", "cat": "estudo", "logo": "https://…/logo.png",
    "sites": [ { "name": "solara", "url": "https://solara.polimont.com.br/" } ] }
] }
```

`cat` is `jogos`, `pacotes` or `estudo`. `logo` is optional (without it the collection gets a monogram
tinted from its name). Credit for the original links goes to **ByePassHub** (GitHub), named in the
tab's footer.

### Study tab (StudyDesk) and the decoy

The Study tab is a **light, school-looking** page, isolated from the rest of the site: subjects,
resources with search and filters, a task planner with a progress bar, a **focus timer** (25/10/5 min),
a **quick quiz** of five questions with instant feedback and an **FAQ** section with six questions.
Nothing there pulls games — it is study only, and it works as a real tool.

The layout follows a single grid: a sticky header, a hero with search and a numbers card, six equal
subject cards (each with its topics and a button that filters the library), the resource list, a
two-column planner with the timer in a dark card, the quiz, a two-column FAQ and a short footer.

**The site ALWAYS opens on Study.** Anyone typing `…/LuminSDK/` lands on StudyDesk (the URL stays
exactly the same), even with saved history, settings or a “last tab” — the previous tab is **not**
restored. The games catalog shows up when the visitor:

- clicks **Ryan Smith** in the StudyDesk footer, or
- presses **`Shift` + `D`** (or **`Alt` + `S`**) — the *two-key combo* that toggles between Study and
  the site from any tab.

### Full decoy and the window-switch lock

The tab title and icon are never LuminSDK's, not even after opening the catalog: everywhere the page
is called **“StudyHub | Estudos e Quiz”** with `studyhub.svg`, and the title is rewritten immediately
if any module tries to change it.

- **Alt + Tab, Windows + Tab or switching browser tabs** sends the page back to the study portal at
  once — **every time**, no matter how often (besides focus/visibility events, the page checks the
  window focus every 0.8 s, so there is no “it only worked once”);
- in that state the **Ryan Smith** credit is **disabled** (and `Shift`+`D` / `Alt`+`S` stop working),
  so whoever bumps into the screen cannot reach the catalog;
- the lock survives a reload inside the same browser session;
- **`Ctrl` + `AltGr` + `H`** restores everything: real title and icon, credit enabled, catalog open.

Honest limits: the browser does **not** let a page intercept Alt+Tab / Windows+Tab — the site reacts
the moment the window loses focus, which looks the same in practice. Because the lock watches the
window focus, **opening anything in another tab** (external link, the player's “open in a new tab”,
Alt+Tab itself) also takes the page back to Study — that is the requested behaviour, but it is worth
knowing. Clicking inside a game (iframe)
does not trigger the lock, because focus stays in this window. If keyboard focus is **inside** the
game iframe, `Ctrl`+`AltGr`+`H` does not reach the page — click the player frame or go back to Study
first and the shortcut answers again.

| Action | What happens |
|---|---|
| opening `…/LuminSDK/` | lands on StudyDesk |
| **`Shift` + `D`** / **`Alt` + `S`** | toggles Study ⇄ site (works on any tab, even inside a game) |
| **Study** tab in the left rail | opens StudyDesk |
| clicking **Ryan Smith** in the StudyDesk footer | opens LuminSDK |
| **Lumin** tab in the left rail | opens LuminSDK |
| **Alt + Tab** / **Windows + Tab** | back to Study and the lock arms |
| **`Ctrl` + `AltGr` + `H`** | releases everything and opens the catalog |

The URL **never** changes when switching tabs. Old addresses (`/gn/`, `/sites/`, `/study/`) still
work: they redirect to `?view=…`, the app opens the requested tab and cleans the address bar right
away — opening the site again lands on Study once more.

Entry is decided by `assets/js/app.js` (the same file that switches tabs), the shortcut lives there and
the way out in `assets/js/study.js`. The single-file build (`single/index.html`) has **no** Study tab —
it is always the games catalog. Each file
is independent: nothing from StudyDesk leaks into LuminSDK's dark look.

The **GN-Math** tab is a separate page, not a theme, but it is organised like LuminSDK's library: a
header with search, filter chips, sorting, a responsive grid of square covers with readable names (no
tiny text over big artwork), favorites, “continue playing” and a player that opens the game right here
— opening a game does **not** change the URL. The look is its own: graphite background with a grid, a
drawn cursor and its own settings panel (accent colour, background, cursor, density, effects, motion).
Preferences live in `gnmath:v1:*`, apart from `luminsdk:v1:*` — changing one tab never touches the other.

GN-Math games come from that project's public CDN (`freebuisness/html`, covers from
`freebuisness/covers`). To refresh the list:

```bash
python3 tools/gnmath-sync.py          # downloads zones.json and rewrites assets/data/gnmath-games.json
```

Every game runs inside the player: the page fetches the game HTML, injects a `<base>` pointing at the
right folder (the same trick the GN-Math site uses) and writes it into the iframe. YouTube Playables
entries get a notice plus an “open in a new tab” button.

---

## Run it locally

```bash
git clone https://github.com/SuckingUpToesSry/LuminSDK.git
cd LuminSDK

python3 -m http.server 8080
# or: npx serve .
```

Then open `http://localhost:8080`.

### Use it as a starting point

1. **Fork** the repository.
2. Edit the copy, colors and branding in `index.html` and `assets/css/styles.css`.
3. Enable **GitHub Pages** under *Settings → Pages → Deploy from a branch → `main` / root*.
4. Ship it — there is no build step.

### Export to another repository (portable package)

```bash
# 1. fill in your project data
nano tools/package.config.json   # projectName, author, repoUrl, siteUrl, basePath, sdkUrl

# 2. build the folder + zip
./tools/package.sh               # or: python3 tools/package.py
```

Output:

- `export/luminsdk-portable/` — drop-in contents for the new repository
- `export/luminsdk-portable.zip` — the same package, zipped

The packager copies only what the site needs, rewrites every project link, and generates a
`README.md`, a `LICENSE` that preserves the original credit **and** the new maintainer, a manifest
with your `basePath`, `robots.txt`/`sitemap.xml` for your `siteUrl`, `.nojekyll`, `.gitignore` and
`.editorconfig`. Flags: `--out`, `--no-zip`, `--config`.

### Single-file version (one HTML file)

Need the whole site in **one file** — to paste into a Gist, CodePen, an email, or any host
without folders? The generator inlines HTML, CSS, JS and the icon:

```bash
python3 tools/single-file.py             # writes single/index.html (~380 KB)
python3 tools/single-file.py --out /tmp/luminsdk.html
```

It opens straight in a browser: no server, no build. The only external piece is the LuminSDK
script from the CDN (Google Fonts are optional and fall back gracefully).

The single file ships the **Lumin tab only** (the catalog): the entry screen, LuminOS, the tab rail,
the chat and the GN-Math/Sites/Study/Nav views stay out, since they depend on per-tab CSS and JS.
That way nothing breaks and no tab ends up unstyled.

> **About Pastebin:** Pastebin raw is served as `text/plain`, so the browser shows the code
> instead of the page. To get a URL that actually renders, use a Gist plus `raw.githack.com`,
> CodePen, JSFiddle, or GitHub Pages.

The generated copy lives in [`single/`](single/) →
`https://suckinguptoessry.github.io/LuminSDK/single/`.

---

## Project structure

```text
LuminSDK/
├── index.html                  # The whole site: every tab in one page
├── 404.html                    # Custom error page
├── assets/
│   ├── css/
│   │   ├── styles.css          # Design tokens, themes and components
│   │   ├── app.css             # Single-page shell (shows/hides the active view)
│   │   ├── provider.css        # DuckMath/Astra catalogs: chips, grid, minimal list, player
│   │   ├── browser.css         # Browser tab: address bar, collections, clean tab
│   │   ├── gnmath.css · sites.css · study.css · os.css · social.css
│   ├── js/
│   │   ├── app.js              # Routes by sessionStorage, loads each tab on demand
│   │   ├── library.js          # Game UI, favorites, history and per-game colors
│   │   ├── provider.js         # DuckMath/Astra catalogs: filters, search, minimal and player
│   │   ├── gnmath.js · sites.js · study.js · os.js · social.js · browser.js
│   │   ├── settings.js · progress.js · site.js · atmosphere.js · bonus.js
│   ├── data/sites.json         # Sites tab data: 67 collections / 749 links
│   └── img/                    # Logo, PWA icons, social banner and Sites artwork
├── manifest.webmanifest
├── sw.js                       # Service worker (offline app shell)
├── sites/ · study/ · gn/       # Old shortcuts: redirect to the single URL
├── single/                     # Single-file build (generated by tools/single-file.py)
├── tools/                      # Portable packager + single-file generator
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## How the integration works

The site runs the SDK in **headless mode** — LuminSDK provides the data and the game URLs,
this project provides the interface:

```html
<script src="https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js"></script>
<script>
  await Lumin.init({ headless: true });

  const { games, total, pages } = await Lumin.getGames({ page: 1, limit: 24, q: 'puzzle' });

  const cover = await Lumin.getImageUrl(games[0].image_token);

  const { url } = await Lumin.getGameUrl(games[0].id);
  iframe.src = url;
</script>
```

| Method | Used for |
|---|---|
| `Lumin.init({ headless: true })` | Connect without rendering the default UI |
| `Lumin.getGames({ page, limit, q })` | Paginated grid and search |
| `Lumin.getRandomGames(n)` | “Random” button |
| `Lumin.getCategories()` | Category chips and counter |
| `Lumin.getImageUrl(token)` | Lazy-loaded game covers |
| `Lumin.getGameUrl(id)` | Custom fullscreen player |
| `Lumin.loadGame(id)` | Fallback player |

### Games hosted elsewhere

A few titles do not run in the LuminSDK player but on an external site. Those live in
`CONFIG.customSources` at the top of `assets/js/library.js`:

```js
customSources: [
  {
    id: 'selenite/undertale',
    name: 'undertale',
    url: 'https://toby.booksforschool.online/index.html#z4x',
    label: 'Toby Web'
  }
]
```

The match is the catalog `id` first, then the **exact** name, then the name without bracketed
suffixes (`Undertale (PC)` → `undertale`), so `Undertale Yellow` and `Friday Night Funkin vs
Undertale` keep opening in the normal player.

**Undertale** has one extra rule: if the catalog hands out a GN-Math address (`gn-math.github.io`)
for it, `library.js` swaps in the Toby URL before building the iframe — the game never opens on
GN-Math, always inside our player with the Toby site in it. Opening one of these titles shows a badge
in the player header (e.g. “Toby Web”) with the destination domain as a tooltip; if the page refuses
to load in the iframe, the “open in a new tab” button is the way out.

Full API reference: **[docs.luminsdk.com](https://docs.luminsdk.com/)**.

---

## Customization

```css
html[data-theme="dark"] {
  --violet: #8b5cf6;   /* primary accent */
  --cyan:   #22d3ee;   /* gradients and glows */
  --bg:     #07070c;   /* background */
  --text:   #f4f4fa;   /* text */
}
```

| Change | Where |
|---|---|
| Copy, links and branding | `index.html` |
| Colors, fonts, radii | `:root` in `assets/css/styles.css` |
| Games per page and columns | `layoutInfo()` in `assets/js/library.js` (or the on-page sliders) |
| Card sizes (S/M/L) | `CONFIG.cardSizes` in `assets/js/library.js` |
| Device detection | `detectDevice()` in `assets/js/settings.js` |
| Performance presets | `PRESETS` in `assets/js/settings.js` |
| Personal suggestion | `buildSuggestion()` in `assets/js/settings.js` |
| Achievements and goals | `ACHIEVEMENTS` in `assets/js/progress.js` |
| Daily challenges | `dailyChallenges()` in `assets/js/progress.js` |
| Recommendations | `preferredCategories()` in `assets/js/library.js` |
| Default accent color | `--accent` in `:root` (`assets/css/styles.css`) |
| Quick palette presets | `PRESETS` in `assets/js/atmosphere.js` |
| Max categories shown | `CONFIG.maxCategories` in `assets/js/library.js` |
| Default theme | `applyTheme()` in `assets/js/site.js` |

Add `?demo` to the URL to preview the interface with placeholder cards while offline.

There are **no keyboard shortcuts** in the site — no `F` (fullscreen), `R` (random), `/` or
`Ctrl`+`K` (search), `?` (settings). Everything lives in the UI buttons so no key is stolen from
the game. With the player open, every key (WASD, arrows, space, Enter, F, numbers…) goes to the game.

The game runs in a cross-origin `<iframe>`, so the player focuses it as soon as it loads (and retries
a few times), restores focus when the tab/window becomes active again and never uses a modal
`<dialog>` — some browsers never give keyboard focus to an iframe inside a modal dialog. Games that
run inside another iframe and block focus on click can be opened with **Open in a new tab**.

---

### Bonus tools

The **Bonus** button in the header opens a small toolbox that runs entirely in the browser:

- **Gamepad tester** — live view of every button, trigger and stick (Gamepad API via polling),
  with an adjustable dead zone, raw readout and a rumble test when the controller and browser
  support it. Built with the **Xbox Edge browser** in mind: no Web Bluetooth, WebUSB, Keyboard Lock
  or experimental APIs.
- **Connection monitor** — online/offline state, network type, estimated speed and latency when the
  browser exposes them, plus a real latency test against the site itself.
- **Cache manager** — storage used, stored caches, service worker state, an update check and a safe
  clear-and-reload action.
- **Daily challenges** — three goals that rotate at midnight, with progress bars and the streak of
  days you closed all three.
- **Statistics** — sessions, total time, games and categories, day streak, a last-7-days chart,
  most played and a reset button.
- **Achievements** — 17 medals with progress, automatic unlocking and a toast when one drops
  (secret ones only reveal their hint once unlocked).

The panel only lists what already works. The next batch — collections, quick launch, game layout,
immersive mode and full backup — ships in upcoming updates.

---

## Accessibility & performance

- Semantic landmarks, `aria-live` status and result announcements, plus a skip link.
- Fully keyboard navigable with visible `:focus-visible` styles.
- Covers loaded via `IntersectionObserver`, only when near the viewport.
- No framework and no bundler; Google Fonts has a system-font fallback.
- Honors `prefers-reduced-motion` and ships native light/dark themes.

### Lightweight by default (same visuals)

| What | Before | After |
|---|---|---|
| PWA and brand icons | 292 KB | **87 KB** (256-colour PNGs, mean error ~2/255) |
| First visit (HTML + CSS + JS + images) | ~647 KB | **~446 KB** |
| Service worker pre-cache | ~700 KB on `install` | **~330 KB** (essential shell only) |

- **Reused cards:** search, filtering and pagination no longer rebuild the whole grid — unchanged
  cards keep their DOM nodes, so there are no extra cover requests and no flicker.
- **Cursor:** the animation loop runs only while the ring is still catching up with the pointer.
- **Particles:** pause automatically while a game is open.
- **Player:** the fullscreen backdrop blur is disabled during play.
- **Below the fold:** FAQ, open-source and footer use `content-visibility: auto`.

---

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

1. Open an issue describing the bug or idea.
2. Fork the repo and create a branch (`feat/my-improvement`).
3. Open a pull request explaining the change (screenshots help).
4. Keep it dependency-free and keep the UI copy in Portuguese.

---

## License

Released under the **MIT License**. Use it, copy it, change it, ship it — keep the copyright notice.
See [LICENSE](LICENSE).

```text
MIT License · Copyright (c) 2026 Ryan Smith
```

---

## Credits

- **Ryan Smith** — creator and maintainer.
- **[LuminSDK](https://docs.luminsdk.com/)** — game catalog, API and game hosting.
- **Typefaces** — [Inter](https://rsms.me/inter/) and [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk).
- **All games and their artwork belong to their respective authors.**

<div align="center">

Made with 💜 by **Ryan Smith**

</div>
