# Standalone Code Snippets

Every snippet below is **copied verbatim from the shipped source** on branch
`arena/019fa3dd-cloud-presentation`. Each one is self-contained: no framework, no
build step, no runtime dependency. Drop them into any vanilla HTML/CSS/JS project.

Each entry lists **where it lives**, **what problem it solves**, and **how to reuse it**.

| # | Snippet | Source | Deps |
|---|---|---|---|
| 1 | Fault-tolerant boot sequence | `script.js` | none |
| 2 | Reduced-motion probe | `script.js` | none |
| 3 | Timer registry (leak-free) | `script.js` | none |
| 4 | rAF throttle | `script.js` | none |
| 5 | Fire-once IntersectionObserver | `script.js` | none |
| 6 | Text scramble effect | `script.js` | 3 |
| 7 | Accessible flip card | `script.js` + `style.css` | none |
| 8 | Cancellable typed terminal | `script.js` | none |
| 9 | Scroll-scrubbed step tracker | `script.js` | 2, 4 |
| 10 | Scroll progress bar | `script.js` + `style.css` | 4 |
| 11 | Keyboard deck navigation | `script.js` | 2 |
| 12 | Reduced-motion feature parity | `script.js` | none |
| 13 | Self-hosted fonts | `vendor/fonts.css` | none |
| 14 | Single-file build config | `vite.config.ts` | vite |
| 15 | Static integrity checker | `tools/check.mjs` | none |
| 16 | Zero-dependency static server | `tools/serve.mjs` | none |
| 17 | Print / PDF stylesheet | `style.css` | none |
| 18 | Skip link + noscript | `index.html` + `style.css` | none |

---

## 1. Fault-tolerant boot sequence

**Problem:** in a long single-page document, one section throwing during init kills
every section registered after it.

**Solution:** register inits in an array and isolate each one. A broken section logs
and is skipped; the other 17 still work.

```js
const SECTION_INITS = [
  initNavigation, initDataTrail, initHero, initQuickCheck,
  initStorageTypes, initEngineRoom, initProviderTable, initBusinessCase,
  initChallenges, initBuildSteps, initLiveDemo, initBenefits,
  initTwentyFourHour, initRoadmap, initFutureTrends, initConclusion,
  initKeyboardNav, initProgressBar,
];

function boot() {
  for (const init of SECTION_INITS) {
    // One failing section must never take down the rest of the deck.
    try {
      init();
    } catch (err) {
      console.error(`[deck] "${init.name}" failed to initialise:`, err);
    }
  }
  document.documentElement.classList.add('deck-ready');
}

// Correct regardless of when the script is evaluated (module scripts are
// deferred, so DOMContentLoaded may already have fired).
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
```

> The `deck-ready` class is also the hook the test suite uses to assert the page
> finished booting. This design proved itself during development: when jsdom lacked
> `matchMedia`, 13 sections failed but the page still rendered and reported precisely
> what broke.

**Reuse:** replace the array contents with your own init functions.

---

## 2. Reduced-motion probe that cannot throw

**Problem:** `window.matchMedia` is missing in jsdom, some embedded webviews, and
older browsers. A bare call throws and takes down the caller.

```js
function media(query) {
  // Guard for very old browsers / non-browser environments where
  // matchMedia is unavailable — never let a feature probe throw.
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

function checkReducedMotion() {
  return media('(prefers-reduced-motion: reduce)');
}

/** Single source of truth for the desktop breakpoint (mirrors style.css). */
const DESKTOP_QUERY = '(min-width: 992px)';
function isDesktop() {
  // Fall back to a width comparison if matchMedia is missing.
  if (typeof window.matchMedia !== 'function') return window.innerWidth >= 992;
  return media(DESKTOP_QUERY);
}
```

**Why `isDesktop()` matters:** the original code hard-coded `window.innerWidth >= 992`
in JS while the stylesheet used `@media (min-width: 992px)`. Two sources of truth that
silently disagree at the boundary (scrollbar width). `matchMedia` with the *same query
string* removes the class of bug entirely.

**Reuse:** call `checkReducedMotion()` at the top of every animation function, and
provide a static end-state fallback. See snippet 12.

---

## 3. Timer registry — no leaked intervals

**Problem:** `setInterval` handles that are created inside conditionals and never
stored keep firing after the user navigates away.

```js
/** Registry of every timer we start, so nothing leaks on teardown. */
const timers = new Set();

function trackInterval(fn, ms) {
  const id = setInterval(fn, ms);
  timers.add(id);
  return id;
}

function clearTracked(id) {
  clearInterval(id);
  timers.delete(id);
}

window.addEventListener('pagehide', () => {
  timers.forEach(clearInterval);
  timers.clear();
});
```

**Reuse:** swap `setInterval` → `trackInterval` and `clearInterval` → `clearTracked`
everywhere. `pagehide` is preferred over `unload` — it fires reliably on mobile Safari
and is compatible with the back/forward cache.

---

## 4. rAF throttle for scroll handlers

**Problem:** `getBoundingClientRect()` in a scroll handler forces synchronous layout on
every event — the classic scroll-jank cause. Scroll events can fire far more often than
the display refreshes.

```js
/** rAF-throttles a scroll/resize handler so we never layout-thrash. */
function rafThrottle(fn) {
  let queued = false;
  return function throttled(...args) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn.apply(this, args);
    });
  };
}
```

**Usage — note `{ passive: true }` on both listeners:**

```js
const handleScroll = rafThrottle(update);
window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('resize', handleScroll, { passive: true });
update(); // don't wait for the first scroll to paint correct state
```

---

## 5. Fire-once IntersectionObserver

**Problem:** reveal animations that re-trigger every time an element re-enters the
viewport look broken, and keeping observers alive wastes work.

```js
/**
 * Creates a single-trigger IntersectionObserver for animations.
 * Unobserves elements immediately after their first reveal.
 */
function createOnceObserver(callback, threshold = 0.2) {
  return new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold, rootMargin: '0px 0px -50px 0px' });
}
```

**Usage:**

```js
const observer = createOnceObserver((target) => {
  target.classList.add('is-visible');
}, 0.2);

document.querySelectorAll('.stagger-item').forEach(el => observer.observe(el));
```

The negative bottom `rootMargin` delays the trigger until the element is ~50px inside
the viewport, so the animation isn't already finished by the time it's actually looked at.

---

## 6. Text scramble effect

**Problem:** the original used a fractional accumulator (`iterations += 1/3`) compared
against an integer index — it worked, but the reveal rate was hidden in a magic number
and the loop ran one extra frame past completion.

```js
const originalText = eyebrow.getAttribute('data-scramble') || "CLOUD STORAGE SERVICES";
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/$-#@";

// Integer step counter: 3 frames per resolved character, so the reveal
// speed is explicit rather than hidden in a fractional accumulator.
const FRAMES_PER_CHAR = 3;
const totalFrames = originalText.length * FRAMES_PER_CHAR;
let frame = 0;

const interval = trackInterval(() => {
  const resolved = Math.floor(frame / FRAMES_PER_CHAR);

  eyebrow.textContent = originalText
    .split('')
    .map((char, index) => {
      if (index < resolved) return originalText[index];
      if (char === ' ') return ' ';
      return chars[Math.floor(Math.random() * chars.length)];
    })
    .join('');

  if (frame >= totalFrames) {
    eyebrow.textContent = originalText; // guarantee a clean final state
    clearTracked(interval);
  }
  frame += 1;
}, 35);
```

Three details worth keeping: spaces are preserved so the text keeps its shape while
scrambling; the final assignment guarantees a clean result rather than trusting the
loop; and `textContent` (not `innerHTML`) means arbitrary text can never inject markup.

**Tuning:** raise `FRAMES_PER_CHAR` for a slower reveal, lower the `35`ms for a faster
flicker.

---

## 7. Accessible flip card

**Problem:** a `<div>` with a click handler is invisible to assistive tech. The original
markup was `<article tabindex="0">` with a keydown handler but no role — screen readers
announced a static article that mysteriously responded to Enter.

**Markup:**

```html
<article class="flip-card stagger-item"
         tabindex="0"
         role="button"
         aria-expanded="false"
         aria-label="Object Storage. Press Enter or Space to reveal details.">
  <div class="flip-card__inner">
    <div class="flip-card__front">…</div>
    <div class="flip-card__back">…</div>
  </div>
</article>
```

**Behaviour — `aria-expanded` is kept in sync with the visual state:**

```js
cards.forEach(card => {
  const toggleFlip = () => {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-expanded', String(flipped));
  };

  card.addEventListener('click', toggleFlip);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();   // stop Space from scrolling the page
      toggleFlip();
    }
    if (e.key === 'Escape' && card.classList.contains('is-flipped')) {
      toggleFlip();
    }
  });
});
```

**CSS — flip driven *only* by the explicit toggle:**

```css
.flip-card { perspective: 1000px; min-height: 320px; cursor: pointer; }

.flip-card__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

/* Flip is driven solely by the explicit toggle (click / Enter / Space).
   The old `:hover` rule fought the click state — a mouse user who clicked and
   then moved the pointer away saw the card flip twice. */
.flip-card.is-flipped .flip-card__inner {
  transform: rotateY(180deg);
}

.flip-card__front,
.flip-card__back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}

.flip-card__back { transform: rotateY(180deg); }
```

> **The bug worth remembering:** adding `.flip-card:hover .flip-card__inner` alongside
> the click toggle means hover and click state fight each other. Pick one. On touch
> devices `:hover` is unreliable anyway, so the explicit toggle is the correct choice.

---

## 8. Cancellable typed terminal

**Problem:** scheduling N `setTimeout`s and discarding the ids means a second click
interleaves two transcripts into the same element.

```js
const simulationLines = [
  { text: "$ gcloud storage buckets create gs://my-bucket --location=us-central1", type: "cmd",     delay: 200 },
  { text: "Creating gs://my-bucket/...",                                          type: "comment", delay: 600 },
  { text: "✔ Bucket created successfully.",                                       type: "success", delay: 1000 },
];

const lineClass = (type) =>
  `terminal-line terminal-${type === 'cmd' ? 'prompt' : type === 'success' ? 'success' : 'comment'}`;

// Every pending timeout is tracked so a replay can cancel the previous run
// instead of interleaving two transcripts.
let pending = [];
let isPlaying = false;

const cancelPending = () => {
  pending.forEach(clearTimeout);
  pending = [];
};

const run = () => {
  if (isPlaying) return;   // ignore repeat clicks mid-run
  cancelPending();

  terminal.hidden = false;
  output.replaceChildren();   // clears without innerHTML

  if (checkReducedMotion()) {
    // Show the full transcript instantly — same content, no motion.
    simulationLines.forEach(item => {
      const div = document.createElement('div');
      div.className = lineClass(item.type);
      div.textContent = item.text;
      output.appendChild(div);
    });
    return;
  }

  isPlaying = true;

  simulationLines.forEach((item, index) => {
    const id = setTimeout(() => {
      const div = document.createElement('div');
      div.className = lineClass(item.type);
      div.textContent = item.text;
      output.appendChild(div);
      terminal.scrollTop = terminal.scrollHeight;   // keep the tail in view

      if (index === simulationLines.length - 1) isPlaying = false;
    }, item.delay);
    pending.push(id);        // ← the fix
  });
};

playBtn.addEventListener('click', run);
window.addEventListener('pagehide', cancelPending);
```

Pair it with a live region so screen readers hear the output:

```html
<div id="terminal-lines" role="log" aria-live="polite"
     aria-label="Simulated terminal output"></div>
```

---

## 9. Scroll-scrubbed step tracker

Maps scroll position to a progress line and lights up steps sequentially. Works
horizontally on desktop, vertically on mobile — using the same breakpoint as the CSS.

```js
const update = () => {
  const rect = tracker.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  // Start filling when tracker top enters viewport, complete before exiting
  const totalDistance = rect.height + viewportHeight * 0.4;
  const currentProgress = viewportHeight - rect.top;
  let percent = (currentProgress / totalDistance) * 100;
  percent = Math.max(0, Math.min(100, percent));

  // Orientation follows the same breakpoint the stylesheet uses.
  if (fillBar) {
    if (isDesktop()) {
      fillBar.style.width = `${Math.min(80, percent * 0.8)}%`;
      fillBar.style.height = '3px';
    } else {
      fillBar.style.height = `${Math.min(90, percent)}%`;
      fillBar.style.width = '3px';
    }
  }

  // Highlight active step numbers sequentially.
  // steps.length + 1 buckets means step 1 lights up as soon as the tracker
  // enters the viewport and the last completes just before it leaves.
  const activeStepIdx = Math.floor((percent / 100) * (steps.length + 1));
  steps.forEach((step, idx) => {
    step.classList.toggle('is-active', idx <= activeStepIdx);
  });
};

const handleScroll = rafThrottle(update);
window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('resize', handleScroll, { passive: true });
update();
```

The `steps.length + 1` denominator is deliberate and now documented — it was an
undocumented off-by-one in the original.

---

## 10. Scroll progress bar

```js
function initProgressBar() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  const update = rafThrottle(() => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;   // guard ÷0
    bar.style.width = `${pct}%`;
    bar.parentElement?.setAttribute('aria-valuenow', String(Math.round(pct)));
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}
```

```html
<div class="scroll-progress-track" role="progressbar"
     aria-label="Presentation progress"
     aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
  <div id="scroll-progress" class="scroll-progress-bar"></div>
</div>
```

```css
.scroll-progress-track {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 3px;
  background: rgba(140, 160, 184, 0.15);
  z-index: 120;
}
.scroll-progress-bar {
  height: 100%; width: 0;
  background: linear-gradient(90deg, #4FD1C5, #F4A261);
  box-shadow: 0 0 12px rgba(79, 209, 197, 0.6);
}
```

---

## 11. Keyboard deck navigation

Turns any list of `<section id>` elements into a keyboard-navigable deck.

```js
function initKeyboardNav() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!sections.length) return;

  const behavior = () => (checkReducedMotion() ? 'auto' : 'smooth');

  /** Index of the section currently filling most of the viewport. */
  const currentIndex = () => {
    const mid = window.innerHeight / 2;
    let best = 0, bestDist = Infinity;
    sections.forEach((sec, i) => {
      const rect = sec.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height / 2 - mid);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    return best;
  };

  const goTo = (index) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    const target = sections[clamped];
    target.scrollIntoView({ behavior: behavior(), block: 'start' });
    // Move focus for screen-reader users without stealing it visually.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };

  const isTypingTarget = (el) =>
    el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingTarget(document.activeElement)) return;   // don't hijack typing

    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case 'j':
        e.preventDefault(); goTo(currentIndex() + 1); break;
      case 'ArrowLeft':  case 'PageUp':   case 'k':
        e.preventDefault(); goTo(currentIndex() - 1); break;
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End':  e.preventDefault(); goTo(sections.length - 1); break;
      case '?':    e.preventDefault(); toggleShortcutHelp(); break;
      case 'Escape': closeShortcutHelp(); break;
    }
  });
}
```

Four guards make this safe to add to any page:

- `e.defaultPrevented` — respects handlers that already consumed the key
- `ctrlKey/metaKey/altKey` — never shadows browser shortcuts
- `isTypingTarget` — arrow keys still work inside form fields
- `focus({ preventScroll: true })` — moves the a11y focus ring without fighting the smooth scroll

---

## 12. Reduced-motion **feature** parity

**The mistake to avoid:** the original reduced-motion branch registered a *different,
one-way* click handler. Users who prefer reduced motion could trigger the failure
simulation but never reset it — they lost functionality, not just animation.

**Rule: reduced motion removes _motion_, never _features_.**

```js
if (prefersReduced) {
  // Static end-state for the count-up.
  if (intEl)   intEl.textContent   = '99';
  if (ninesEl) ninesEl.textContent = '999999999';

  if (simBtn) {
    let failed = false;
    simBtn.addEventListener('click', () => {
      const rect = srv1 && srv1.querySelector('rect');
      const led  = srv1 && srv1.querySelector('.status-led');

      failed = !failed;   // ← toggles BOTH ways, same as the animated branch
      simBtn.textContent = failed ? 'Reset Server 1 Status' : 'Simulate Server Failure';
      simBtn.setAttribute('aria-pressed', String(failed));

      if (badge)   badge.setAttribute('opacity', failed ? '1' : '0');
      if (reroute) reroute.setAttribute('opacity', failed ? '1' : '0');
      if (srv1)    srv1.style.opacity = failed ? '0.3' : '1';
      if (rect)    rect.setAttribute('stroke', failed ? '#FF5F56' : '#4FD1C5');
      if (led)     led.setAttribute('fill',   failed ? '#FF5F56' : '#4FD1C5');
      if (text)    text.innerHTML = failed ? FAILED_MSG : HEALTHY_MSG;
    });
  }
  return;
}
```

Note the shared `FAILED_MSG` / `HEALTHY_MSG` constants — both branches render identical
copy, so the two code paths can't drift.

**The CSS half — a blanket safety net:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  /* Reveal anything that JS would have animated in */
  .stagger-item, .stagger-row, .quiet-fade, .benefit-line {
    opacity: 1 !important;
    transform: none !important;
  }
  .draw-line, .draw-roadmap, .icon-draw, .draw-check {
    stroke-dashoffset: 0 !important;
  }
  .node-pulse-ring, .data-trail__pulse { display: none !important; }
}
```

That last block is the important one: elements start at `opacity: 0` waiting for JS, so
without it a reduced-motion user sees a blank page.

---

## 13. Self-hosted fonts (kill the Google Fonts dependency)

**Before** — two DNS lookups, two TLS handshakes, a render-blocking request, and a
privacy leak:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&…" rel="stylesheet">
```

**After** — one local stylesheet, zero network:

```html
<link rel="stylesheet" href="./vendor/fonts.css">
```

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;                       /* text paints immediately */
  src: url('./fonts/inter-latin-400-normal.woff2') format('woff2');
}
/* …repeat per family/weight… */
```

**Getting the files without a browser** (works behind a proxy that only allows npm):

```bash
mkdir -p /tmp/fonts && cd /tmp/fonts
npm pack @fontsource/inter @fontsource/space-grotesk @fontsource/jetbrains-mono \
  --pack-destination /tmp/fonts
for f in *.tgz; do mkdir -p "${f%.tgz}-x" && tar -xzf "$f" -C "${f%.tgz}-x"; done

# woff2 files land in <pkg>-x/package/files/, licence in <pkg>-x/package/LICENSE
cp fontsource-inter-*-x/package/files/inter-latin-{400,500,600}-normal.woff2 vendor/fonts/
cp fontsource-inter-*-x/package/LICENSE vendor/fonts/Inter.LICENSE
```

Ship only the weights you actually use — 9 woff2 files total **244 kB**. Copy the
`LICENSE` files too; Inter, Space Grotesk and JetBrains Mono are all SIL OFL 1.1, which
requires the licence to travel with the fonts.

---

## 14. Single-file build config

Inlines CSS, JS and every font as base64 into one portable `index.html`.

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The deck must run from a file:// URL with no network, so every asset
// (fonts, anime.js, CSS, JS) is inlined into a single index.html.
export default defineConfig({
  root: __dirname,
  base: "./",                                  // relative paths → file:// works
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER, // inline fonts regardless of size
    cssCodeSplit: false,
    target: "es2020",
  },
  plugins: [viteSingleFile({ removeViteModuleLoader: true })],
});
```

The two non-obvious settings: `assetsInlineLimit` at max forces even 24 kB woff2 files
inline (Vite's default 4 kB would emit them as separate files), and `base: "./"` keeps
paths relative so the result opens from `file://`.

**Result:** `dist/index.html`, 347 kB, **1** `<script>` tag, **0** external references.

---

## 15. Static integrity checker (no dependencies)

The highest-value 30 lines in the repo. Catches the failure mode this kind of project
is most prone to: **JS pointing at markup that no longer exists.**

```js
const html = readFileSync('index.html', 'utf8');
const js   = readFileSync('script.js',  'utf8');

const htmlIds = new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map(m => m[1]));

// (a) Duplicate ids — invalid HTML, and getElementById silently picks the first
const allIds = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(m => m[1]);
const dupes  = allIds.filter((v, i) => allIds.indexOf(v) !== i);

// (b) Every getElementById target must exist
const gebi = [...js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
const missingIds = [...new Set(gebi)].filter(id => !htmlIds.has(id));

// (c) Every #id / .class querySelector target must resolve.
//     Classes applied at runtime are whitelisted rather than reported.
const RUNTIME_ONLY = new Set(['col-highlight', 'is-flipped', 'is-active', 'visible']);
const sel = [...js.matchAll(/querySelector(?:All)?\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);

const missingSel = [];
for (const s of new Set(sel)) {
  const first = s.trim().split(/[\s,>]+/)[0];           // leading simple selector
  if (first.startsWith('#')) {
    const id = first.slice(1).replace(/[^\w-].*$/, '');
    if (id && !htmlIds.has(id)) missingSel.push(s);
  } else if (first.startsWith('.')) {
    const cls = first.slice(1).replace(/[^\w-].*$/, '');
    if (cls && !RUNTIME_ONLY.has(cls) && !html.includes(cls)) missingSel.push(s);
  }
}
```

**Enforcing the offline guarantee** — fails the build if anyone reintroduces a CDN:

```js
const scriptSrcs = [...html.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map(m => m[1]);
const remote = scriptSrcs.filter(s => /^https?:/.test(s));
if (remote.length) fail(`remote scripts: ${remote.join(', ')}`);
```

This deliberately inspects `<script src>` / `<link href>` **tags only**, so ordinary
`<a href="https://…">` citation links in the body still pass.

**Navigation integrity** — bidirectional, so neither orphan can appear:

```js
const sectionIds = [...html.matchAll(/<section[^>]*\sid=["']([^"']+)["']/g)].map(m => m[1]);
const danglingNav = navTargets.filter(t => !sectionIds.includes(t));   // link → nowhere
const unreachable = sectionIds.filter(s => !navTargets.includes(s));   // section → no link
```

Runs in ~100 ms with zero dependencies: `node tools/check.mjs`. 33 assertions.

---

## 16. Zero-dependency static server

For presenting from a clean clone with no `npm install`, on a locked-down machine.

```js
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg":  "image/svg+xml",
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/" || rel.endsWith("/")) rel += "index.html";

  // Contain every request inside ROOT — no path traversal.
  const abs = path.join(ROOT, path.normalize(rel));
  if (!abs.startsWith(ROOT)) return res.writeHead(403).end("Forbidden");

  const info = await stat(abs).catch(() => null);
  if (!info?.isFile()) return res.writeHead(404).end(`404 Not Found: ${rel}`);

  const body = await readFile(abs);
  res.writeHead(200, {
    "content-type": MIME[path.extname(abs).toLowerCase()] || "application/octet-stream",
    "content-length": body.length,
  });
  res.end(body);
}).listen(PORT);
```

The `path.normalize` + `startsWith(ROOT)` pair is the security-critical part — verified
against `GET /../../etc/passwd`, which returns 404. Serving `.woff2` with the correct
MIME type also matters: browsers reject fonts sent as `application/octet-stream`.

---

## 17. Print / PDF stylesheet

Makes `Ctrl+P` produce a usable handout — one section per page.

```css
@media print {
  /* Interactive chrome is meaningless on paper */
  .dot-nav, .data-trail, .scroll-progress-track,
  .shortcut-help, .skip-link, .demo-controls {
    display: none !important;
  }

  html, body { background: #fff !important; color: #111 !important; }

  .section {
    page-break-after: always;   /* legacy */
    break-after: page;          /* modern */
    min-height: auto !important;
    padding: 24px !important;
  }

  /* Reveal everything JS would have animated in — otherwise the PDF is blank */
  .stagger-item, .stagger-row, .quiet-fade, .benefit-line {
    opacity: 1 !important; transform: none !important;
  }
  .draw-line, .draw-roadmap, .icon-draw, .draw-check {
    stroke-dashoffset: 0 !important;
  }
}
```

The reveal-everything rules are essential: scroll-triggered content that was never
scrolled to is still `opacity: 0` and would print as empty pages.

---

## 18. Skip link + noscript fallback

```html
<body>
  <a href="#hero" class="skip-link">Skip to content</a>
  <noscript>
    <div class="noscript-banner">
      JavaScript is disabled — the deck is fully readable, but animations and the
      interactive demos (poll, failure simulation, terminal) are unavailable.
    </div>
  </noscript>
```

```css
/* Off-screen until focused — visible only to keyboard users who Tab first */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 200;
  padding: 12px 20px;
  background: #4FD1C5;
  color: #0E1A2B;
  font-weight: 700;
  border-radius: 0 0 8px 0;
  text-decoration: none;
}
.skip-link:focus { left: 0; }

/* Global focus ring — never remove an outline without replacing it */
:focus-visible {
  outline: 2px solid #4FD1C5;
  outline-offset: 3px;
}
section:focus { outline: none; }   /* programmatic focus target, snippet 11 */
```

`left: -9999px` rather than `display: none` matters — a `display: none` element is not
focusable, so the link would never appear.

---

## Reusing these together

The snippets compose into a minimal standalone page:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Deck</title>
    <link rel="stylesheet" href="./vendor/fonts.css">   <!-- 13 -->
    <link rel="stylesheet" href="./style.css">          <!-- 7, 10, 17, 18 -->
  </head>
  <body>
    <a href="#one" class="skip-link">Skip to content</a>          <!-- 18 -->
    <div class="scroll-progress-track" role="progressbar">        <!-- 10 -->
      <div id="scroll-progress" class="scroll-progress-bar"></div>
    </div>

    <section id="one" aria-labelledby="one-title">
      <h2 id="one-title">First</h2>
    </section>

    <script type="module" src="./script.js"></script>  <!-- 1-6, 8, 9, 11, 12 -->
  </body>
</html>
```

Verify with `node tools/check.mjs` (snippet 15), serve with `node tools/serve.mjs`
(snippet 16), and build with the config in snippet 14.

---

## Provenance

All snippets are extracted from working, tested code — not written for this document.
The full source passes:

```
npm run check   →  33/33 static integrity checks
npm run test    →  24/24 runtime checks (real bundle in jsdom, zero console errors)
```

Offline behaviour was verified by loading the built `dist/index.html` from a `file://`
URL with `fetch` and `XMLHttpRequest` hard-blocked: the deck boots, all 15 sections
render, anime.js runs, 9 fonts resolve from inline data URIs, and **zero** network
requests are attempted.
