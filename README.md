# WunderCalendar V3 — Christmas Advent Calendar

Version 3 of the Christmas Advent Calendar: a dependency-free static site (vanilla HTML/CSS/JS) built on the V2 code base, receiving a new visual design and updated interaction mechanics. The supplied design references live in `design/`.

## Structure
- `public/` — the site: `index.html`, `styles.css`, `app.js`, `assets/`
  - `backgrounds/calendar-desktop.{avif,webp}` (1672 × 941) and `calendar-mobile.{avif,webp}` (941 × 1672): the chalet with its 24 closed windows (page background and door faces)
  - `backgrounds/calendar-desktop-open.{avif,webp}` and `calendar-mobile-open.{avif,webp}`: the same chalet with every window open, source of the symbol revealed behind each door
  - `sounds/gift-open.mp3`, played when a window opens; `elf-top.avif` (pop-up for day 24); `fonts/`
- `design/` — the supplied design references (not shipped)
- `scripts/build.mjs` — copies `public/` to `dist/` and fails if a file is missing or an external/localhost reference appears
- `scripts/serve.mjs` — tiny local static server

## Window map
The 24 windows form a regular 4 × 6 grid in both artworks. `app.js` holds one grid per orientation (`GRID`, `GRID_M`: column left edges, door width, row top edges, door height, in artwork pixels, measured from the images). Each window's rectangle, as percentages of the artwork, is the clickable area, the door face (cut from the closed picture) and the niche (cut from the open picture). Because the artwork is always drawn at the stage's size in its own aspect ratio, everything stays aligned at any window size.

## Opening sequence
Click an unlocked window: the door swings open on its left hinge and fades as it turns away, a warm glow flares, the sound plays, a few sparkles fly, and the casino symbol in the niche is revealed; then the offer pop-up opens. Opened windows stay open (and re-show their pop-up when clicked). Locked windows flash and show a toast.

## Develop
Requires Node 18+. No `npm install` needed.

```bash
npm run dev       # http://localhost:5173 (serves public/)
npm run build     # outputs dist/
npm run preview   # serves dist/
```

## Configuration (`public/app.js`, top of file)
- `TEST_MODE = true` — every door opens regardless of date (as on the original), and a test bar is shown with a Test mode ON/OFF switch, a pretend-date field (real mechanics, any date) and a Reset doors button. Set to `false` for production: door N can be opened from N December (viewer's local time); doors for days already gone by are shown open automatically (on 5 December, doors 1–4 are open, door 5 waits to be clicked, 6–24 are locked). Today's door is remembered in `localStorage` once opened.
- `SEASON_YEAR` — the December the calendar belongs to (2026). Doors unlock on their day of that December and stay open afterwards, including into the following year.
- `MOCK_DATE` — optional clock override for testing production mode.
- `PROMO_TEXT`, `CTA_LABEL`, `CTA_URL` — pop-up content and button link.

## Deploy (GitHub → Netlify)
Netlify settings (also in `netlify.toml`):
- Production branch: `main`
- Build command: `npm run build`
- Publish directory: `dist`

Push to `main` and Netlify redeploys automatically.

## Notes
- `BovineMVB.otf` is a licensed font; make sure your licence permits web use.
- Source Sans 3 is self-hosted (SIL Open Font License).
- The only external link is the CTA button destination (`CTA_URL`), a normal outbound link.
