# Cloud Storage Services — Behind Every Upload

A standalone, **fully offline** interactive presentation on how cloud storage actually
works: replication, durability, provider trade-offs, real incidents, and how to build
your own cloud project.

15 scroll-driven sections with animated diagrams, an interactive server-failure
simulation, a simulated deployment terminal, and a keyboard-navigable Q&A accordion.

**Pure HTML, CSS and JavaScript.** No framework, no build step, no `npm install`,
no dependencies to download. Nothing to compile and nothing to configure.

---

## Running it

**Double-click `index.html`.** That's it.

It works straight from your file system with no server and no internet connection.
Fonts and the animation library are bundled in `vendor/`.

<details>
<summary>Optional: serve it over http:// instead</summary>

Not required, but useful if you want a real origin (some browser DevTools features
are restricted on `file://`, and it lets you open the deck from a phone on the same
Wi-Fi). Needs Node.js, but installs nothing:

```bash
node tools/serve.js          # → http://localhost:4173
```
</details>

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

**Printing / PDF export:** <kbd>Ctrl</kbd>+<kbd>P</kbd>. A dedicated print stylesheet
hides the navigation chrome, forces a page break per section, and reveals all
scroll-triggered content.

---

## Files

```
index.html              The whole deck — 15 semantic <section> elements
style.css               All styling; design tokens in :root
script.js               All behaviour; one init function per section

vendor/
  anime.js              anime.js v3.2.2 animation library (MIT)
  fonts.css             @font-face declarations
  fonts/                9 woff2 files + licences (OFL)

tools/                  Optional helpers — the deck does not need them
  self-test.html        Open in a browser to test every interactive feature
  check.js              node tools/check.js — static integrity checks
  serve.js              node tools/serve.js — local http server

CODE_ANALYSIS.md        Architectural review that motivated this build
```

Only three files matter for the presentation itself: **`index.html`**,
**`style.css`**, **`script.js`**.

### Editing content

All copy lives directly in `index.html` — find the section by its `id` and edit the
text. The terminal transcript is the `simulationLines` array in `script.js`.

If you add a section, add a matching `<li>` to the `.dot-nav__list` at the top of
`index.html`. `tools/check.js` will tell you if you forget.

---

## Verifying changes

Both checkers are optional and install nothing.

**In the browser** — open `tools/self-test.html`. It loads the real deck in a hidden
frame and drives every interactive feature (poll, flip cards, failure simulation,
accordion, terminal, keyboard shortcuts), then reports pass/fail.

> Firefox and Safari can do this straight from `file://`. Chrome sandboxes `file://`
> frames, so there run `node tools/serve.js` and open
> `http://localhost:4173/tools/self-test.html`.

**In a terminal** (needs Node.js, no packages):

```bash
node tools/check.js
```

35 static assertions in ~100 ms. It catches the failure mode this project is most
prone to — a JS selector pointing at markup that no longer exists — plus duplicate
ids, broken nav links, missing ARIA, and any reintroduced CDN or build tooling.

---

## Accessibility

- Semantic landmarks: every section is `<section aria-labelledby>`.
- Skip-to-content link; visible focus rings on all interactive elements.
- Flip cards are `role="button"` with synced `aria-expanded`, operable via
  Enter/Space and dismissible with Escape.
- The accordion uses real `aria-expanded`/`aria-controls` with arrow-key navigation.
- Live regions (`aria-live="polite"`) announce the poll result, the failure
  simulation status, and terminal output.
- All decorative SVG/glyph elements are `aria-hidden`.
- Full `prefers-reduced-motion` support — animations are replaced with static end
  states, and **interactive features keep working**; only the motion is removed.
- Fully readable with JavaScript disabled (a `<noscript>` banner explains what's off).

---

## Licences

Presentation code: MIT (see `LICENSE`).
Bundled third-party assets retain their own licences:

- **anime.js** v3.2.2 — MIT — `vendor/anime.LICENSE.md`
- **Inter**, **Space Grotesk**, **JetBrains Mono** — SIL Open Font License 1.1 —
  `vendor/fonts/*.LICENSE`

Content figures are cited in the References section (section 15) and were current as
of July 2026 — cloud pricing changes often, so re-verify before quoting exact numbers.
