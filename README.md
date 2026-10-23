# WunderCalendar V3 — Christmas Advent Calendar

Version 3 of the Christmas Advent Calendar: a dependency-free static site (vanilla HTML/CSS/JS) built on the V2 code base, receiving a new visual design and updated interaction mechanics. The supplied design references live in `design/`.

## Structure
- `public/` — the site: `index.html`, `styles.css`, `app.js`, `assets/`
  - `backgrounds/calendar-desktop.{avif,webp}` (2000 × 1126, landscape) and `calendar-mobile.{avif,webp}` (1126 × 2000, portrait); AVIF is served where supported, WebP otherwise
  - `sounds/gift-open.mp3`, played when a box opens
  - `elf-top.avif` (pop-up for box 24), `fonts/`
- `scripts/build.mjs` — copies `public/` to `dist/` and fails if a file is missing or an external/localhost reference appears
- `scripts/serve.mjs` — tiny local static server

## Gift box map
The 24 boxes are part of the artwork. `app.js` holds one list per artwork (`PLATES_PX`, `PLATES_M_PX`) with the pixel rectangle of each box's gold number plate, measured from the image. Each plate is grown by `PLATE_GROW` to cover the box front; that rectangle, converted to percentages of the artwork, is both the clickable area and the opening lid. The artwork is always drawn at the stage's size with its own aspect ratio, so the areas stay aligned at any window size. Add `?debug=boxes` to the URL to outline them.

## Opening sequence
Click an unlocked box: the box front (cut from the artwork) swings up on its top edge and fades, the sound plays, a short burst of sparks flies out of the box, then the offer pop-up opens. Opened boxes show a lit interior with a golden star. Locked boxes flash and show a toast.

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
