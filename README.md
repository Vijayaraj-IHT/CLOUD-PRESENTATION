# Cloud Storage Services — Behind Every Upload

A standalone, **fully offline** interactive presentation on how cloud storage actually
works: replication, durability, provider trade-offs, real incidents, and how to build
your own cloud project.

15 scroll-driven sections with animated diagrams, an interactive server-failure
simulation, a simulated deployment terminal, and a keyboard-navigable Q&A accordion.

- **Zero runtime dependencies.** No CDN, no Google Fonts, no network of any kind.
- **Ships as one file.** `npm run build` emits a single ~347 kB `dist/index.html`
  with fonts, CSS, JS and anime.js all inlined. Email it, USB it, open it offline.
- **Degrades gracefully.** Fully readable with JavaScript disabled, and every
  animation is individually gated behind `prefers-reduced-motion`.

---

## Quick start

You need [Node.js](https://nodejs.org) 18+ **only for development**. The built deck
needs nothing but a browser.

```bash
npm install     # dev tooling only (vite)
npm run dev     # hot-reloading dev server → http://localhost:5173
```

### Presenting

```bash
npm run build            # → dist/index.html (single self-contained file)
```

Then just **double-click `dist/index.html`**. It runs from `file://` with no server
and no internet connection.

No Node available on the presenting machine? A clean clone also works with zero
install:

```bash
node tools/serve.mjs     # → http://localhost:4173
```

---

## Keyboard shortcuts

Press <kbd>?</kbd> in the deck at any time to see this panel.

| Key | Action |
| --- | --- |
| <kbd>→</kbd> / <kbd>PgDn</kbd> / <kbd>J</kbd> | Next section |
| <kbd>←</kbd> / <kbd>PgUp</kbd> / <kbd>K</kbd> | Previous section |
| <kbd>Home</kbd> / <kbd>End</kbd> | First / last section |
| <kbd>?</kbd> | Toggle shortcut help |
| <kbd>Esc</kbd> | Close help / unflip a card |
| <kbd>Tab</kbd> + <kbd>Enter</kbd> | Operate any interactive element |

**Printing / PDF export:** `Ctrl+P`. A dedicated print stylesheet hides the
navigation chrome, forces a page break per section, and reveals all
scroll-triggered content.

---

## Project layout

```
index.html          The whole deck — 15 semantic <section> elements
style.css           All styling, design tokens in :root
script.js           One init function per section, ES module
vendor/
  anime.es.js       anime.js v3.2.2, vendored (MIT)
  fonts.css         @font-face declarations
  fonts/            9 woff2 files: Inter, Space Grotesk, JetBrains Mono (OFL)
tools/
  check.mjs         Static integrity checks (no deps)
  serve.mjs         Zero-dependency static server (no deps)
  smoke.mjs         Runtime tests against the built bundle (needs jsdom)
vite.config.ts      Single-file build config
CODE_ANALYSIS.md    Architectural review that motivated this build
```

### Editing content

All copy lives directly in `index.html` — find the section by its `id` and edit the
text. The terminal transcript is the `simulationLines` array in `script.js`.

If you add a section, add a matching `<li>` to the `.dot-nav__list` at the top of
`index.html`; `npm run check` will fail if you forget.

---

## Verifying changes

```bash
npm run check    # static: dead selectors, dup ids, a11y invariants, no network
npm run verify   # check + build + runtime smoke tests
```

CI config template lives at `tools/ci-template/github-actions.yml` — copy it to
`.github/workflows/ci.yml` to enable GitHub Actions.

`npm run check` runs in ~100 ms with no dependencies and catches the failure mode
this project is most prone to: a JS selector pointing at markup that no longer
exists. It also enforces the offline guarantee — reintroducing a CDN `<script>` or
Google Fonts `<link>` fails the build.

`npm run test` drives the real built bundle in jsdom and exercises every interactive
feature. It needs jsdom, which is deliberately **not** a saved dependency:

```bash
npm install --no-save jsdom && npm test
```

---

## Accessibility

- Semantic landmarks: every section is `<section aria-labelledby>`.
- Skip-to-content link; visible focus rings on all interactive elements.
- Flip cards are `role="button"` with synced `aria-expanded`, operable via
  Enter/Space and dismissible with Escape.
- The accordion uses real `aria-expanded`/`aria-controls` with arrow-key navigation.
- Live regions (`aria-live="polite"`) announce the poll result, the failure
  simulation status, and terminal output.
- All 39 decorative SVG/glyph elements are `aria-hidden`.
- Full `prefers-reduced-motion` support — animations are replaced with static end
  states, and **interactive features keep working**, only the motion is removed.

---

## Licences

Presentation code: MIT.
Bundled third-party assets retain their own licences:

- **anime.js** v3.2.2 — MIT — `vendor/anime.LICENSE.md`
- **Inter**, **Space Grotesk**, **JetBrains Mono** — SIL Open Font License 1.1 —
  `vendor/fonts/*.LICENSE`

Content figures are cited in the References section (section 15) and were current as
of July 2026 — cloud pricing changes often, so re-verify before quoting exact numbers.
