# Code Analysis — `CLOUD-PRESENTATION` (branch point: `main` @ `816cf79`)

A review of every code artefact currently on `main`. The repo holds **two complete,
independent implementations of the same "Cloud Storage Services" slide deck**, plus a
Vite/React/Tailwind toolchain that only builds one of them.

---

## 1. What's actually in the repo

| File | Lines | Role | Reachable from a build? |
|---|---|---|---|
| `index.html` | 864 | Full 15-section presentation, hand-written semantic HTML | ✅ Vite entry point |
| `style.css` | 1454 | Complete hand-written CSS for `index.html` | ✅ linked from `index.html` |
| `script.js` | 883 | Vanilla-JS animation/interaction layer (anime.js v3 from CDN) | ✅ `<script type="module">` |
| `src/App.tsx` | 1032 | The *same* deck reimplemented as one React component | ❌ **dead code** |
| `src/index.css` | 939 | Tailwind v4 + the same design tokens/components for the React version | ❌ dead code |
| `src/main.tsx` | 10 | React root, mounts into `#root` | ❌ dead code |
| `src/utils/cn.ts` | 6 | `clsx` + `tailwind-merge` helper | ❌ never imported |
| `vite.config.ts` / `tsconfig.json` | — | React + Tailwind + singlefile plugin | partially unused |
| `README.md` | 2 | Title + the word "ASSOCIATION" | — |

**Verified:** `npm run build` succeeds (85 kB single-file bundle) but the output is
the *vanilla* deck. `index.html` contains **no `<div id="root">`** and never imports
`src/main.tsx`, so React, `src/index.css`, Tailwind, `clsx`, `tailwind-merge` and
`animejs` (the npm package) are all shipped in `package.json` but never executed.
`tsc --noEmit` passes cleanly — the TypeScript is valid, just orphaned.

### The single biggest issue
> Two ~2,400-line parallel codebases describing the same 15 slides. Every content
> edit has to be made twice or the versions silently diverge. **They already have.**

Observed divergences:
- Vanilla has **15 sections** (includes a `#references` section with 7 sourced links);
  React has **14** (`sectionIds` array, no references section at all).
- Section id mismatch: vanilla uses `#live-demo`, React uses `#demo`.
- Vanilla's demo is an animated fake terminal (`gcloud`/`gsutil` transcript);
  React's is a static, non-functional play button.
- Vanilla's engine-room durability counter animates digit-by-digit; React hard-codes
  `99.999999999%`.
- Byline differs: React says *"Spring 2025"*, the vanilla references note says
  *"current as of July 2026"*.

**Recommendation: pick one.** The vanilla stack is the one that builds and is the more
complete/polished of the two. Either delete `src/` + the React deps (smallest, fastest,
zero-dep deck), or port the vanilla deck into React and delete `index.html`/`script.js`.
Keeping both is the only genuinely serious defect here.

---

## 2. `script.js` — vanilla animation layer

**Strengths (this is good code):**
- Clean architecture: one `init*()` per section, dispatched from a single
  `DOMContentLoaded` block. Easy to reason about and to disable a section.
- `checkReducedMotion()` is re-checked *inside every* animation function, and each one
  has an explicit static fallback — genuinely rare discipline.
- `createOnceObserver()` correctly `unobserve`s after first reveal, so no repeat work.
- Defensive null-guards on virtually every element lookup (`if (!btn || !result) return;`).
- Real keyboard support: Enter/Space on flip cards, ArrowUp/Down between accordion
  headers, `aria-expanded`/`aria-controls` kept in sync, `aria-live` on the poll result
  and the failure-status text.
- **Cross-checked every `getElementById` / `querySelector` in `script.js` against
  `index.html`: all targets exist.** The only selector with no static markup is
  `.col-highlight`, which is correct — it's applied at runtime and *is* styled in
  `style.css:695`.

**Concrete bugs / smells:**

1. **`initHero()` scramble uses a fractional counter** (`iterations += 1/3`) compared
   with `index < iterations`. It works, but it's opaque, and the `clearInterval` check
   runs *before* the increment, so it ticks one extra frame. Prefer an integer step
   counter with an explicit `totalSteps`.
2. **The scramble interval is never cleared on early exit.** If the element is removed
   or the user navigates, the `setInterval` keeps firing. Minor for a static deck,
   but the returned handle is discarded.
3. **`initEngineRoom()` reduced-motion branch registers a *different, one-way* click
   handler** than the full branch — the reduced-motion simulation can't be reset.
   Behaviour should be feature-parity, only motion should differ.
4. **`server1.querySelector('rect')` / `.status-led` are unguarded** inside the failure
   sim, unlike the rest of the file. If the SVG structure changes these throw.
5. **`initBuildSteps()` reads layout in a raw `scroll` handler.** `getBoundingClientRect()`
   on every scroll event forces layout; it's `{passive:true}` (good) but should be
   `requestAnimationFrame`-throttled. The `resize` listener isn't passive.
6. **Breakpoint duplicated in JS and CSS.** `window.innerWidth >= 992` in `script.js`
   mirrors `@media(min-width:992px)` in `style.css`. Use `matchMedia('(min-width:992px)')`
   so there's one source of truth.
7. **Off-by-one in the step tracker:** `Math.floor((percent/100) * (steps.length + 1))`
   — the `+1` makes step 1 activate at 0% and the last step activate before 100%.
   Probably intentional, but undocumented and fragile.
8. **`initLiveDemo()` schedules 7 un-tracked `setTimeout`s.** Double-clicking play
   (the button is hidden with `overlay.hidden = true`, so it's hard, but the overlay
   is the thing hidden, not the button) can interleave two transcripts. Store the ids
   and clear them, or set a `isPlaying` flag.
9. **Global anime.js dependency is unversioned in code.** `window.anime` is guarded
   everywhere (good), but the deck loads **anime.js 3.2.2 from a CDN** while
   `package.json` declares **`animejs ^4.5.0`** — a different major version with a
   completely different API (`animate()` vs `anime()`). Nothing breaks today because
   the npm copy is unused, but it's a trap for the next person.
10. **No SRI hash / `crossorigin` on the CDN script tag**, and no offline fallback —
    if the venue Wi-Fi drops mid-presentation, every animation silently no-ops
    (it degrades gracefully, which is the saving grace).

---

## 3. `index.html`

- Genuinely good semantics: `<section aria-labelledby>` on all 15 sections, `<th scope>`
  on the comparison table, `<ol>` for ordered steps, `aria-hidden` on all 39 decorative
  SVG/glyph elements, descriptive `aria-label`s on the dot-nav links.
- No duplicate `id` attributes (checked).
- **Accessibility gap:** the flip cards are `<article tabindex="0">` with a click +
  keydown handler but **no `role="button"`** and no `aria-pressed`/`aria-expanded`.
  Screen readers announce them as static articles that mysteriously respond to Enter.
  Either add `role="button" aria-expanded="false"` (and toggle it in JS) or wrap the
  face in a real `<button>`.
- **`.flip-card:hover .flip-card__inner` also flips the card** (`style.css:465`). Hover
  flip + click flip together means a mouse user who clicks then moves away sees the card
  flip twice. Drop the hover rule, or drop the click toggle.
- No `<meta name="description">`, no Open Graph tags, no `<noscript>` fallback.
- `#hero` has `min-height: 90vh` — consider `svh` for mobile browser chrome.

---

## 4. `style.css`

- Well organised: design tokens in `:root`, then base → layout → per-section blocks.
- The `@media (prefers-reduced-motion: reduce)` block is thorough — it force-resets
  `.stagger-item`, `.stagger-row`, `.quiet-fade`, `.benefit-line` opacity/transform and
  zeroes all `stroke-dashoffset`, so the deck is fully readable with JS *and* motion off.
- 1454 lines in one file. At this size, split by section (or use CSS layers) — or, better,
  this problem disappears if you consolidate onto one implementation.
- Duplicate token block: `:root` in `style.css` and `:root` + `@theme` in `src/index.css`
  define the same six colours three times. Third divergence risk.

---

## 5. `src/App.tsx` (the React version)

Even though it's dead code, it's worth noting *why* it's the weaker of the two before
anyone considers promoting it:

1. **One 1,032-line component.** No decomposition — every section, all data arrays, and
   all handlers live in one function with 11 `useState` hooks.
2. **`document.querySelectorAll` + direct DOM mutation inside React**
   (`(line as SVGLineElement).style.strokeDashoffset = '0'`) — imperative escapes that
   React will happily clobber on re-render.
3. **The reveal `IntersectionObserver` effect depends on `[heroScrambled, networkAnimated,
   scrambleEffect]`**, so it tears down and re-observes every element each time those flip.
   Elements can be missed during the gap.
4. **`scrambleEffect` returns a cleanup function that is never called**, and it fires
   inside a `setTimeout` inside an observer callback — the interval leaks.
5. **`setVisibleElements(prev => new Set([...prev, id]))` allocates a new Set per
   intersection**, re-rendering the entire 1,000-line tree each time. Fine at this scale,
   wasteful in principle.
6. **The scroll handler is not passive** (`window.addEventListener('scroll', handleScroll)`),
   unlike the vanilla version which correctly passes `{passive: true}`.
7. **Card-flip reveal bug:** cards 1 and 2 gate their `visible` class on
   `visibleElements.has('card-0')`, not their own id — they animate off a sibling.
8. **`triggerNodeFailure` auto-resets after 4s** but the button label says
   "Reset simulation", implying manual control. Also the timeout isn't cleared on unmount.
9. **Accessibility regression vs. the vanilla deck:** dot-nav buttons say
   `aria-label="Go to section 1"` (no section name); flip cards are plain `<div onClick>`
   with no keyboard handler, no `tabIndex`, no role; the accordion has no `aria-controls`
   and no arrow-key navigation; the reduced-motion check exists but several `<animate>`
   SVG elements loop unconditionally.
10. **Massive inline `style={{color: '#8CA0B8'}}` usage** in a Tailwind project — the
    design tokens exist in `@theme` but are bypassed everywhere.
11. `src/utils/cn.ts` exists precisely to solve #10 and is never imported.

---

## 6. Tooling & repo hygiene

- **`.gitignore` was missing** — `node_modules/` and `dist/` were untracked-but-visible.
  I've added one (`node_modules/`, `dist/`, `.DS_Store`).
- `package.json` name is the scaffold default `"react-vite-tailwind"`, version `0.0.0`.
- No linter, no formatter, no CI, no tests. For a presentation that's defensible, but
  a `.editorconfig` + Prettier would cost nothing.
- `tsconfig.json` has `strict`, `noUnusedLocals`, `noUnusedParameters` on and passes —
  good, keep it.
- `README.md` is two lines. For a deck that will be handed to classmates/graders it
  should say: what this is, `npm install && npm run dev`, and which file to edit.

---

## 7. Prioritised recommendations

**P0 — decide the architecture**
1. Choose one implementation. Recommended: **keep vanilla** (`index.html` + `style.css`
   + `script.js`), delete `src/`, and drop `react`, `react-dom`, `@types/react*`,
   `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`,
   `animejs` from `package.json`. Vite + `vite-plugin-singlefile` alone still gives you
   the dev server and the one-file build.
2. If you'd rather keep React, port the missing References section, the terminal demo,
   and the accessibility features from the vanilla version first, then delete the
   vanilla files.

**P1 — correctness / robustness (vanilla)**
3. Pin anime.js: either self-host v3.2.2 or switch to the npm `animejs` v4 API. Add SRI
   to the CDN tag and a graceful "animations unavailable" path.
4. Track and clear the `setInterval`/`setTimeout` handles in `initHero` and `initLiveDemo`;
   guard against double-play.
5. rAF-throttle `initBuildSteps`' scroll handler; replace the `992` literal with `matchMedia`.
6. Give the reduced-motion engine-room simulation the same toggle behaviour as the full one.

**P2 — accessibility**
7. `role="button"` + managed `aria-expanded` on the flip cards; remove the hover-flip rule.
8. Add a "skip to content" link and a visible focus style audit pass.

**P3 — polish**
9. Split `style.css` by section or introduce `@layer`.
10. Write a real `README.md`; fix the "Spring 2025" / "July 2026" date inconsistency.
