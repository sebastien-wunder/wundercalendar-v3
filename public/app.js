/* WunderCalendar V3 — Christmas Advent Calendar — vanilla JS, no dependencies. */
(function () {
"use strict";


/* ============================================================
   CONFIGURATION
   TEST_MODE = true  → every door opens, whatever today's date.
   TEST_MODE = false → door N can be opened from N December (viewer's local
                       date, December SEASON_YEAR). Doors for days gone by are open
                       (golden star) automatically: on 5 December, doors 1–4
                       are open, door 5 waits to be clicked, 6–24 are locked.
   ============================================================ */
const TEST_MODE = true;

/* Optional clock override for checking production mode, e.g. '2026-12-12T09:00:00'
   (read as local time). Leave null to use the real date. */
const MOCK_DATE = null;

/* The December this calendar belongs to. Doors unlock on their day of this
   December and stay open afterwards, into the following year as well. */
const SEASON_YEAR = 2026;

/* Runtime copies: the test bar (shown only while TEST_MODE is true) can switch
   real-mode mechanics on and pick a pretend date without editing this file. */
let testMode = TEST_MODE;
let mockDate = MOCK_DATE;

const PROMO_TEXT = 'Epic Week is on. Every day from 17:00 there are 50,000 free Cash Spins in Big Bass Christmas Bash.';
const CTA_LABEL = 'Spiele jetzt';
const CTA_URL = 'https://www.wunderino.de/';

const DOOR_COUNT = 24;
const OPEN_MS = 820;      /* door swing + fade (matches the CSS transitions) */
const REVEAL_MS = 420;    /* time to admire the revealed symbol before the offer appears */
const BURST_AT_MS = 380;  /* sparkles start this long after the click (as the door clears the niche) */
const STORE_KEY = 'advent-opened-v1'; /* remembers opened doors in production mode */
const TOAST_MS = 2800;
const ELF_DAY = 24;       /* this door's pop-up is held by the elf character */

/* ============================================================
   WINDOW MAP
   The chalet has 24 windows in a regular grid of 4 columns × 6 rows. Two
   artworks share the same geometry: the "closed" picture (numbered doors) is
   the page background and the source of each door face; the "open" picture
   (every niche showing its casino symbol) is the source of what each door
   reveals. Grid: left edge of each column, frame width, top edge of each row,
   frame height, pad = thickness of the gold frame on each side (the window
   compartment is the frame rectangle minus the pad) and hinge = width of the
   hinge strip at the compartment's left edge — in artwork pixels, measured
   from the images. The compartment is the clickable area, the swinging door
   (hinges included) and the revealed niche, so nothing of the closed door
   remains once it is open; the gold frame stays part of the picture. The hover
   ring is inset past the hinges.
   ============================================================ */
/* Landscape artwork 1672 × 941 */
const IMG_W = 1672;
const IMG_H = 941;
const GRID = { colsL: [554, 701, 848, 995], w: 142, rowsT: [261, 362, 462, 563, 665, 769], h: 87, pad: { l: 8, t: 9, r: 26, b: 6 }, hinge: 8 };
/* Portrait artwork 941 × 1672 */
const IMG_M_W = 941;
const IMG_M_H = 1672;
const GRID_M = { colsL: [110, 296, 489, 680], w: 156, rowsT: [482, 643, 802, 965, 1130, 1294], h: 136, pad: { l: 14, t: 13, r: 10, b: 9 }, hinge: 8 };
/* Chimney mouth, as percentages of the artwork: where the smoke rises from, and
   the width of the plume's base (one puff) relative to the artwork width. */
const SMOKE = { x: 64.1, y: 6.0, w: 5.2 };
const SMOKE_M = { x: 84.6, y: 10.8, w: 11 };
const SMOKE_PUFFS = 14;
const SMOKE_CYCLE = 11; /* seconds — keep in sync with .puff animation-duration in styles.css */
/* Twinkling lights: the string lights around the chalet, the tree lights and
   baubles and the street lamps — [x, y, diameter, colour] in artwork pixels,
   measured from the images (the window grid, holly berries, gifts and the
   neighbouring houses' windows are deliberately left out). */
const BULBS_PX = [[833,58,14,'#ea1d15'],[898,95,14,'#feed64'],[767,95,14,'#feee58'],[933,115,19,'#ea1811'],[730,116,17,'#ec1912'],[654,163,14,'#eb1610'],[1014,163,15,'#eb1611'],[938,171,11,'#ea261b'],[729,171,9,'#eb2213'],[1055,190,14,'#fdeb52'],[610,192,13,'#feeb56'],[573,216,14,'#e91913'],[497,265,12,'#feea61'],[1173,265,13,'#feea5c'],[510,344,15,'#ea1a0e'],[1158,344,15,'#ea2113'],[510,379,13,'#fde85a'],[1158,379,14,'#feee53'],[510,445,15,'#e8180d'],[1157,446,14,'#ed2116'],[1219,444,7,'#feeca3'],[1228,452,12,'#feeca1'],[1187,458,13,'#feefa7'],[398,477,8,'#e57404'],[510,482,13,'#feea5c'],[1157,482,14,'#feed54'],[354,510,18,'#fef29f'],[369,514,8,'#fee29a'],[510,551,15,'#ea1d13'],[1158,552,15,'#ec1f15'],[1197,554,18,'#fee883'],[453,557,16,'#fde58e'],[475,557,9,'#feeba3'],[392,560,12,'#e61d23'],[440,570,8,'#ef5112'],[1255,574,9,'#ffeba3'],[510,586,13,'#fee956'],[1158,586,13,'#feec57'],[1255,584,8,'#ffeaa3'],[345,603,7,'#fef092'],[351,607,8,'#f1690f'],[422,610,11,'#fbe964'],[367,615,12,'#e72418'],[392,613,7,'#feef8f'],[510,657,15,'#e8180f'],[1158,657,14,'#ea1e14'],[349,679,14,'#eb1410'],[414,676,7,'#feea6c'],[1158,695,14,'#feed59'],[510,695,13,'#fdea65'],[509,767,16,'#eb1611'],[1158,768,14,'#eb1b14'],[510,804,14,'#feec59'],[1158,805,13,'#feef56']];
const BULBS_M_PX = [[563,236,20,'#feec3d'],[388,238,20,'#fdee41'],[384,253,8,'#de7303'],[613,267,21,'#f0100b'],[338,268,21,'#ef130c'],[288,302,17,'#0acb88'],[713,337,24,'#eb140b'],[237,336,20,'#ef130e'],[894,345,19,'#feeea1'],[769,377,20,'#fdeb43'],[133,414,20,'#ee100c'],[818,414,20,'#ee0f0c'],[34,489,19,'#fdef47'],[910,488,19,'#fdee42'],[14,593,29,'#fdeb8c'],[55,605,23,'#ee1309'],[886,604,23,'#ee1208'],[55,653,20,'#fdee41'],[886,652,19,'#fded40'],[927,661,13,'#fee28d'],[55,751,24,'#ed160a'],[886,751,23,'#ef140a'],[55,807,21,'#fdee43'],[886,807,20,'#fded41'],[886,856,19,'#0bd58a'],[13,897,30,'#fdee80'],[886,906,23,'#f0150a'],[55,907,22,'#ef150a'],[926,913,31,'#fdef7a'],[55,958,20,'#fded40'],[886,957,19,'#feed3e'],[886,1062,24,'#ef1409'],[55,1064,23,'#f0160a'],[55,1119,20,'#fdee3f'],[886,1118,19,'#fded3d'],[18,1143,9,'#e84921'],[885,1170,17,'#0acf8b'],[55,1223,22,'#ee1108'],[886,1222,22,'#ee1509'],[27,1237,16,'#ef2f2a'],[919,1246,8,'#e94036'],[28,1266,9,'#ef2538'],[922,1271,13,'#fce89a'],[55,1283,21,'#fdee40'],[886,1282,20,'#fdec3f'],[938,1286,10,'#ee5220'],[885,1390,34,'#ea4902'],[56,1392,34,'#e93f02'],[886,1394,18,'#fded45'],[55,1395,18,'#fdec41'],[933,1423,12,'#ee2715']];

/* ---------- Date logic ---------- */
function getToday() {
  return mockDate ? new Date(mockDate) : new Date();
}
function releaseDate(day, now) {
  return new Date(SEASON_YEAR, 11, day, 0, 0, 0, 0); /* local midnight, season year */
}
function isDoorAvailable(day, now) {
  if (testMode) return true;
  return now.getTime() >= releaseDate(day, now).getTime();
}
/* A door whose day is over (the next day has started) stays open for good. */
function isDoorPast(day, now) {
  if (testMode) return false;
  return now.getTime() >= releaseDate(day + 1, now).getTime();
}
function headingFor(day) {
  return day + ' December';
}
function loadOpened() {
  if (testMode) return {};
  const now = getToday(); const out = {};
  /* Every past day is open, whether or not this visitor clicked it. */
  for (let d = 1; d <= DOOR_COUNT; d++) { if (isDoorPast(d, now)) out[d] = 'open'; }
  /* Today's door is remembered once the visitor has opened it. */
  try {
    const list = JSON.parse(window.localStorage.getItem(STORE_KEY) || '[]');
    list.forEach((d) => { if (isDoorAvailable(d, now)) out[d] = 'open'; });
  } catch (e) { /* storage unavailable: today's door simply resets on reload */ }
  return out;
}
function saveOpened(doors) {
  if (testMode) return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(Object.keys(doors).filter((k) => doors[k] === 'open').map(Number)));
  } catch (e) { /* storage unavailable: doors simply reset on reload */ }
}
function prefersReducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  catch (e) { return false; }
}

/* ---------- Static scene data (built once) ---------- */
function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pct(v, total) { return +(v / total * 100).toFixed(4); }
/* The 24 compartments from the grid (frame rectangle minus the pad), row by row, left to right */
function gridRects(grid) {
  const out = {}, p = grid.pad;
  let n = 1;
  grid.rowsT.forEach((t) => grid.colsL.forEach((l) => {
    out[n++] = { x: l + p.l, y: Math.round(t) + p.t, w: grid.w - p.l - p.r, h: grid.h - p.t - p.b, hinge: grid.hinge };
  }));
  return out;
}
/* Percent geometry plus the background-size/position that shows exactly this
   rectangle of a full artwork inside an element of the same shape (used to cut
   the door face out of the closed picture and the niche out of the open one). */
function buildGeometry(rects, IMG_W, IMG_H) {
  const out = [];
  for (let i = 0; i < DOOR_COUNT; i++) {
    const day = i + 1;
    const r = rects[day];
    out.push({
      day: day,
      l: pct(r.x, IMG_W), t: pct(r.y, IMG_H), w: pct(r.w, IMG_W), h: pct(r.h, IMG_H),
      hinge: pct(r.hinge, r.w),
      bgs: (IMG_W / r.w * 100).toFixed(3) + '% ' + (IMG_H / r.h * 100).toFixed(3) + '%',
      bgp: (r.x / (IMG_W - r.w) * 100).toFixed(4) + '% ' + (r.y / (IMG_H - r.h) * 100).toFixed(4) + '%'
    });
  }
  return out;
}
function buildFlakes(n) {
  const rnd = seeded(2512);
  const out = [];
  for (let i = 0; i < n; i++) {
    const depth = rnd();
    out.push({
      x: +(rnd() * 100).toFixed(2),
      s: +(1.6 + depth * 4.2).toFixed(1),
      o: +(0.35 + depth * 0.55).toFixed(2),
      dur: +(16 - depth * 8 + rnd() * 3).toFixed(1),
      del: +(rnd() * 18).toFixed(1),
      v: 1 + Math.floor(rnd() * 3)
    });
  }
  return out;
}
/* Bulbs: [x, y, diameter, colour] in artwork pixels. The glow is drawn about
   2.4× the bulb so it haloes softly; each bulb gets its own period and phase
   from a seeded generator, so the twinkling never lines up. */
function buildBulbs(list, IMG_W, IMG_H, seed) {
  const rnd = seeded(seed);
  return list.map(function (p) {
    return {
      x: pct(p[0], IMG_W), y: pct(p[1], IMG_H),
      s: pct(p[2] * 2.4, IMG_W),
      c: p[3] || '#ffd27a',
      t: +(2.2 + rnd() * 2.6).toFixed(2),
      d: +(rnd() * 5).toFixed(2)
    };
  });
}
const GEOMETRY = buildGeometry(gridRects(GRID), IMG_W, IMG_H);
const GEOMETRY_M = buildGeometry(gridRects(GRID_M), IMG_M_W, IMG_M_H);
const FLAKES = buildFlakes(70);
const BULBS = buildBulbs(BULBS_PX, IMG_W, IMG_H, 1224);
const BULBS_M = buildBulbs(BULBS_M_PX, IMG_M_W, IMG_M_H, 2412);

/* Portrait screens get the tall artwork */
function detectLayout() {
  try { return window.matchMedia && window.matchMedia('(max-aspect-ratio: 4/5)').matches ? 'm' : 'd'; }
  catch (e) { return 'd'; }
}


/* Asset paths (relative to index.html). Scenes: AVIF first, WebP fallback.
   The "open" pictures are referenced from styles.css (door niches). */
const ASSETS = {
  sceneDesktop: 'assets/backgrounds/calendar-desktop.avif',
  sceneDesktopFallback: 'assets/backgrounds/calendar-desktop.webp',
  sceneMobile: 'assets/backgrounds/calendar-mobile.avif',
  sceneMobileFallback: 'assets/backgrounds/calendar-mobile.webp',
  elfTop: 'assets/elf-top.avif',
  doorSound: 'assets/sounds/gift-open.mp3'
};


/* ============================================================
   DOM rendering (vanilla JS, no dependencies)
   ============================================================ */
const SVG_NS = 'http://www.w3.org/2000/svg';
const STAR_PATH = 'M12 1.8l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9l7.1-.6z';
const FLAKE_PATH = 'M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 2l-2 2.5M12 2l2 2.5M12 22l-2-2.5M12 22l2-2.5';

function h(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach((k) => {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'style') node.setAttribute('style', v);
      else if (k === 'text') node.textContent = v;
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
  }
  (children || []).forEach((c) => { if (c) node.appendChild(c); });
  return node;
}
function svg(attrs, inner) {
  const node = document.createElementNS(SVG_NS, 'svg');
  Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
  node.innerHTML = inner; /* static, trusted markup only */
  return node;
}
function starSvg(cls) {
  return svg({ class: cls, viewBox: '0 0 24 24', 'aria-hidden': 'true' },
    '<path d="' + STAR_PATH + '" fill="#f6c453" stroke="#fff3c4" stroke-width="0.6" stroke-linejoin="round"></path>');
}

const root = document.getElementById('advent');
const state = {
  layout: detectLayout(),
  doors: loadOpened(),
  modalDay: null,
  toastDay: null,
  shakeDay: null
};
let busy = false;
let toastTimer = null;
let els = {};

function doorStatus(day) { return state.doors[day] || null; }

function doorClass(day, available) {
  const st = doorStatus(day);
  let cls = 'slot';
  if (st) cls += ' is-open';
  if (st === 'opening') cls += ' is-opening';
  if (st === 'open') cls += ' is-done';
  if (!available) cls += ' is-locked';
  if (state.shakeDay === day) cls += ' is-shake';
  return cls;
}
function doorLabel(day, available) {
  return available
    ? 'Door ' + day + ', ' + headingFor(day) + (doorStatus(day) === 'open' ? ', opened' : '')
    : 'Door ' + day + ', locked until ' + headingFor(day);
}
function updateDoor(day) {
  const d = els.doors && els.doors[day];
  if (!d) return;
  const available = isDoorAvailable(day, getToday());
  d.slot.className = doorClass(day, available);
  d.btn.setAttribute('aria-label', doorLabel(day, available));
}
function updateAllDoors() { for (let d = 1; d <= DOOR_COUNT; d++) updateDoor(d); }

function render() {
  const mobile = state.layout === 'm';
  const geometry = mobile ? GEOMETRY_M : GEOMETRY;
  const bulbs = mobile ? BULBS_M : BULBS;
  root.className = 'adv-root is-loading ' + (mobile ? 'lay-m' : 'lay-d');
  root.innerHTML = '';
  els = { doors: {} };

  const stage = h('div', { class: 'adv-stage' });
  /* <picture>: the browser downloads only one file, AVIF where supported, else WebP */
  const picture = h('picture', { class: 'adv-scene' }, [
    h('source', { type: 'image/avif', srcset: mobile ? ASSETS.sceneMobile : ASSETS.sceneDesktop }),
    h('img', {
      src: mobile ? ASSETS.sceneMobileFallback : ASSETS.sceneDesktopFallback,
      alt: 'A snow-covered wooden Advent Calendar chalet with 24 numbered windows, in a Christmas village at dusk',
      draggable: 'false',
      decoding: 'async',
      fetchpriority: 'high'
    })
  ]);
  const scene = picture.lastChild;
  stage.appendChild(picture);
  waitForScene(scene);

  /* Chimney smoke: SMOKE_PUFFS overlapping puffs share one SMOKE_CYCLE-second
     loop, each offset by an equal share of it, so the plume never visibly
     restarts. Anchored on the chimney mouth in artwork percentages. */
  const sm = mobile ? SMOKE_M : SMOKE;
  const smoke = h('div', { class: 'smoke', 'aria-hidden': 'true', style: 'left:' + sm.x + '%;top:' + sm.y + '%;width:' + sm.w + '%' });
  for (let i = 0; i < SMOKE_PUFFS; i++) {
    smoke.appendChild(h('span', {
      class: 'puff ' + (i % 2 ? 'pb' : 'pa'),
      style: 'animation-delay:-' + (i * SMOKE_CYCLE / SMOKE_PUFFS).toFixed(3) + 's'
    }));
  }
  stage.appendChild(smoke);

  const lights = h('div', { 'aria-hidden': 'true' });
  bulbs.forEach((b) => lights.appendChild(h('span', {
    class: 'bulb',
    style: 'left:' + b.x + '%;top:' + b.y + '%;width:' + b.s + '%;--c:' + b.c + ';animation-duration:' + b.t + 's;animation-delay:-' + b.d + 's'
  })));
  stage.appendChild(lights);

  const now = getToday();
  geometry.forEach((g) => {
    const available = isDoorAvailable(g.day, now);
    /* Behind the door: this window's niche with its casino symbol, cut from the
       "open" artwork (same grid, so it lands exactly where the door was). */
    const interior = h('div', { class: 'interior crop-open', 'aria-hidden': 'true', style: 'background-size:' + g.bgs + ';background-position:' + g.bgp }, [
      h('span', { class: 'glow' }),
      h('span', { class: 'spark s1' }), h('span', { class: 'spark s2' }), h('span', { class: 'spark s3' }),
      h('span', { class: 'spark s4' }), h('span', { class: 'spark s5' }), h('span', { class: 'spark s6' })
    ]);
    /* The door itself: the same rectangle of the "closed" artwork, hinged on its left */
    const leaf = h('div', { class: 'leaf', 'aria-hidden': 'true' }, [
      h('div', { class: 'face front crop', style: 'background-size:' + g.bgs + ';background-position:' + g.bgp }),
      h('div', { class: 'face back' })
    ]);
    const btn = h('button', {
      type: 'button', class: 'hit', id: 'door-' + g.day, 'data-day': g.day,
      'aria-label': doorLabel(g.day, available),
      onClick: () => handleDoor(g.day)
    });
    const slot = h('div', {
      class: doorClass(g.day, available),
      style: 'left:' + g.l + '%;top:' + g.t + '%;width:' + g.w + '%;height:' + g.h + '%;--hinge:' + g.hinge + '%'
    }, [interior, leaf, btn]);
    els.doors[g.day] = { slot: slot, btn: btn };
    stage.appendChild(slot);
  });

  const snow = h('div', { class: 'snow', 'aria-hidden': 'true' });
  FLAKES.forEach((f) => {
    const flake = h('span', { class: 'fl', style: 'left:' + f.x + '%;animation-duration:' + f.dur + 's;animation-delay:-' + f.del + 's' }, [
      h('i', { class: 'sw' + f.v, style: 'width:' + f.s + 'px;height:' + f.s + 'px;opacity:' + f.o })
    ]);
    snow.appendChild(flake);
  });
  stage.appendChild(snow);

  const wrap = h('div', { class: 'adv-wrap' }, [h('div', { class: 'adv-backdrop', 'aria-hidden': 'true' }), stage]);

  if (TEST_MODE) {
    wrap.appendChild(h('div', { class: 'test-bar' }, [
      /* Switch between test mode (all doors unlocked) and the real mechanics */
      (function () {
        const b = h('button', {
          type: 'button', class: 'toggle', role: 'switch',
          'aria-checked': String(testMode), 'aria-label': 'Test mode',
          onClick: () => setTestMode(!testMode)
        }, [h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { class: 'txt' })]);
        els.toggle = b;
        return b;
      })(),
      /* Pretend date for the real mechanics (local noon), hidden in test mode */
      (function () {
        const i = h('input', {
          type: 'date', class: 'date', 'aria-label': 'Pretend today is',
          onChange: (e) => { mockDate = e.target.value ? e.target.value + 'T12:00:00' : null; refreshDoors(); }
        });
        els.date = i;
        return i;
      })(),
      (function () {
        const b = h('button', { type: 'button', class: 'reset', 'aria-label': 'Close all opened doors', onClick: resetDoors });
        b.appendChild(svg({ width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' },
          '<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 3v6h6"></path>'));
        b.appendChild(document.createTextNode('Reset doors'));
        return b;
      })()
    ]));
  }

  const toastRegion = h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
  wrap.appendChild(toastRegion);
  root.appendChild(wrap);
  els.stage = stage;
  els.toastRegion = toastRegion;
  updateTestBar();

  if (state.modalDay) mountModal(state.modalDay, false);
}

/* ---------- Loading ----------
   Keep the scene hidden until the artwork is fully downloaded AND decoded, so
   visitors never see the bare door recesses or a half-drawn picture. */
let sceneToken = 0;
function waitForScene(img) {
  const token = ++sceneToken;
  let done = false;
  const reveal = () => {
    if (done || token !== sceneToken) return;
    done = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (token !== sceneToken) return;
      root.classList.remove('is-loading');
      preloadExtras();
    }));
  };
  const decodeThenReveal = () => {
    if (img.decode) img.decode().then(reveal, reveal); else reveal();
  };
  if (img.complete && img.naturalWidth) decodeThenReveal();
  else {
    img.addEventListener('load', decodeThenReveal, { once: true });
    img.addEventListener('error', reveal, { once: true });
  }
  setTimeout(reveal, 8000); /* safety net on very slow connections */
}

/* Warm the cache for the elf pop-up and the other artwork once the page is visible */
let extrasLoaded = false;
function preloadExtras() {
  if (extrasLoaded) return;
  extrasLoaded = true;
  [ASSETS.elfTop].forEach((src) => { const i = new Image(); i.src = src; });
  getDoorSound();
}

/* ---------- Sound ----------
   One shared <audio> element, created lazily; played when a door starts to open.
   play() is rejected if the browser blocks it (it never is for a click), so the
   promise is caught and the door simply opens silently. */
let doorSound = null;
function getDoorSound() {
  if (!doorSound) {
    doorSound = new Audio(ASSETS.doorSound);
    doorSound.preload = 'auto';
  }
  return doorSound;
}
function playDoorSound() {
  try {
    const a = getDoorSound();
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* no audio support: ignore */ }
}

/* ---------- Doors ---------- */
function handleDoor(day) {
  if (busy || state.modalDay) return;
  const now = getToday();
  if (!isDoorAvailable(day, now)) { showLocked(day); return; }
  const st = doorStatus(day);
  if (st === 'open') { openModal(day); return; }   /* already opened: show the offer again */
  if (st === 'opening') return;
  busy = true;
  state.doors[day] = 'opening';
  updateDoor(day);
  playDoorSound();
  const reduced = prefersReducedMotion();
  const wait = reduced ? 0 : OPEN_MS + REVEAL_MS;
  if (!reduced) setTimeout(() => fireworks(day), BURST_AT_MS);
  setTimeout(() => {
    state.doors[day] = 'open';   /* the door is gone: empty recess with a glowing star */
    saveOpened(state.doors);
    updateDoor(day);
    busy = false;
    openModal(day);
  }, wait);
}

/* ---------- Fireworks ----------
   A short burst of sparks from the top of the box: 18 coloured dots fly out on
   random headings (mostly upwards), fade and shrink, plus a soft flash. Pure CSS
   animation on transform/opacity; the elements are removed when it ends. */
const BURST_COLOURS = ['#ffe9a6', '#ffd24a', '#ffffff', '#ff5b5b', '#6ee07a', '#8fd4ff'];
function fireworks(day) {
  const d = els.doors && els.doors[day];
  if (!d || !els.stage) return;
  const rect = d.slot.getBoundingClientRect();
  const rnd = seeded(day * 7919 + Date.now() % 1000);
  const burst = h('div', { class: 'burst', 'aria-hidden': 'true', style: 'left:' + d.slot.style.left + ';top:' + d.slot.style.top + ';width:' + d.slot.style.width + ';height:' + d.slot.style.height });
  const reach = Math.max(40, rect.width * 1.1);
  for (let i = 0; i < 18; i++) {
    const ang = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.5;   /* fan over the top */
    const dist = reach * (0.5 + rnd() * 0.7);
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - reach * 0.15;
    burst.appendChild(h('i', {
      style: '--dx:' + dx.toFixed(1) + 'px;--dy:' + dy.toFixed(1) + 'px;--c:' + BURST_COLOURS[Math.floor(rnd() * BURST_COLOURS.length)] +
        ';--t:' + (rnd() * 0.12).toFixed(2) + 's;--s:' + (0.6 + rnd() * 0.8).toFixed(2)
    }));
  }
  burst.appendChild(h('b', { class: 'flash' }));
  els.stage.appendChild(burst);
  setTimeout(() => burst.remove(), 1400);
}

function resetDoors() {
  if (busy) return;
  state.doors = {};
  saveOpened(state.doors);
  refreshDoors();
}

/* Re-evaluate every door against the current mode and date */
function refreshDoors() {
  if (state.modalDay) closeModal(true);
  state.doors = loadOpened();
  updateAllDoors();
  updateTestBar();
}

function setTestMode(on) {
  if (busy) return;
  testMode = !!on;
  refreshDoors();
}

function updateTestBar() {
  if (!els.toggle) return;
  els.toggle.setAttribute('aria-checked', String(testMode));
  els.toggle.classList.toggle('is-on', testMode);
  els.toggle.querySelector('.txt').textContent = testMode ? 'Test mode: ON · all doors unlocked' : 'Test mode: OFF · real dates';
  const d = els.date;
  d.hidden = testMode;
  if (!testMode) {
    const t = getToday();
    d.value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }
}

function showLocked(day) {
  state.shakeDay = day;
  updateDoor(day);
  setTimeout(() => { if (state.shakeDay === day) { state.shakeDay = null; updateDoor(day); } }, 460);
  if (toastTimer) clearTimeout(toastTimer);
  els.toastRegion.innerHTML = '';
  els.toastRegion.appendChild(h('div', { class: 'toast', text: 'Door ' + day + ' opens on ' + headingFor(day) + '. See you then!' }));
  toastTimer = setTimeout(() => { els.toastRegion.innerHTML = ''; toastTimer = null; }, TOAST_MS);
}

/* ---------- Modal (one reusable template for every door) ---------- */
function openModal(day) {
  if (state.modalDay) return;
  state.modalDay = day;
  mountModal(day, true);
}

function mountModal(day, moveFocus) {
  const isElf = day === ELF_DAY;
  const closeBtn = h('button', { type: 'button', id: 'advent-close', class: 'close', 'aria-label': 'Close', onClick: () => closeModal() });
  closeBtn.appendChild(svg({ width: '22', height: '22', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, '<path d="M6 6l12 12M18 6L6 18"></path>'));

  const flakeA = svg({ class: 'flake-deco', style: 'left:16px;top:16px', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, '<path d="' + FLAKE_PATH + '"></path>');
  const flakeB = svg({ class: 'flake-deco', style: 'right:22px;bottom:18px', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, '<path d="' + FLAKE_PATH + '"></path>');
  const divider = h('div', { class: 'divider', 'aria-hidden': 'true' }, [h('span'),
    svg({ width: '14', height: '14', viewBox: '0 0 24 24' }, '<path d="' + STAR_PATH + '" fill="currentColor"></path>'), h('span')]);

  const dialog = h('div', {
    class: 'dialog', id: 'advent-dialog', role: 'dialog', 'aria-modal': 'true',
    'aria-labelledby': 'advent-title', 'aria-describedby': 'advent-desc', tabindex: '-1'
  }, [
    flakeA, flakeB, closeBtn,
    h('h2', { class: 'dlg-title', id: 'advent-title', text: headingFor(day) }),
    divider,
    h('p', { class: 'dlg-text', id: 'advent-desc', text: PROMO_TEXT }),
    h('a', { id: 'advent-cta', class: 'cta', href: CTA_URL, target: '_blank', rel: 'noopener noreferrer', text: CTA_LABEL })
  ]);

  const box = h('div', { class: 'dlg-wrap fit-pending' + (isElf ? ' is-elf' : '') }, [
    isElf ? h('img', { class: 'elf-top', src: ASSETS.elfTop, alt: '', 'aria-hidden': 'true', draggable: 'false' }) : null,
    dialog
  ]);
  const overlay = h('div', {
    class: 'overlay',
    onClick: (e) => { if (e.target === e.currentTarget) closeModal(); },
    onKeydown: onDialogKey
  }, [box]);

  root.appendChild(overlay);
  els.overlay = overlay;
  els.box = box;
  els.stage.setAttribute('aria-hidden', 'true');
  fitModal();
  if (moveFocus) requestAnimationFrame(() => requestAnimationFrame(() => { if (state.modalDay === day) closeBtn.focus(); }));
}

/* Shrink the pop-up (never enlarge) so it fits inside the calendar area */
function fitModal() {
  const box = els.box, overlay = els.overlay;
  if (!box || !overlay) return;
  box.style.zoom = '1';
  box.classList.add('fit-pending');
  requestAnimationFrame(() => {
    let z = 1;
    if (box.offsetHeight > 0) {
      z = Math.min(1, (overlay.clientHeight - 16) / box.offsetHeight);
      z = Math.max(0.4, Math.floor(z * 100) / 100);
    }
    box.style.zoom = String(z);
    box.classList.remove('fit-pending');
  });
}

function closeModal(skipFocus) {
  const day = state.modalDay;
  if (!day) return;
  state.modalDay = null;
  if (els.overlay) els.overlay.remove();
  els.overlay = els.box = null;
  els.stage.setAttribute('aria-hidden', 'false');
  if (!skipFocus) {
    const btn = document.getElementById('door-' + day);
    if (btn) btn.focus();
  }
}

function onDialogKey(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
    return;
  }
  if (e.key === 'Tab') {
    const first = document.getElementById('advent-close');
    const last = document.getElementById('advent-cta');
    if (!first || !last) return;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === document.getElementById('advent-dialog'))) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault(); first.focus();
    }
  }
}

/* ---------- Resize / rotate ---------- */
let resizeRaf = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    const layout = detectLayout();
    if (layout !== state.layout) { state.layout = layout; render(); return; }
    if (state.modalDay) fitModal();
  });
});

render();

/* Small hook for automated tests */
window.__advent = { state: state, isDoorAvailable: isDoorAvailable, isDoorPast: isDoorPast, headingFor: headingFor, TEST_MODE: TEST_MODE, isTestMode: () => testMode, setTestMode: setTestMode, getDoorSound: getDoorSound };
})();
