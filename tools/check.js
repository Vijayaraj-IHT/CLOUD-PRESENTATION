#!/usr/bin/env node
/**
 * Integrity checks for the standalone deck.
 *
 * Static analysis only — no browser, no dependencies. Catches the class of bug
 * that actually breaks this project: a JS selector pointing at markup that no
 * longer exists, a re-introduced network dependency, or a duplicate id.
 *
 * Usage: node tools/check.js
 */

const { readFileSync, existsSync, statSync } = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");

let failures = 0;
let checks = 0;

function ok(msg) {
  checks++;
  console.log(`  \x1b[32m✔\x1b[0m ${msg}`);
}
function fail(msg) {
  checks++;
  failures++;
  console.log(`  \x1b[31m✘\x1b[0m ${msg}`);
}
function group(name) {
  console.log(`\n\x1b[1m${name}\x1b[0m`);
}

const html = read("index.html");
const js = read("script.js");
const css = read("style.css");

/* ------------------------------------------------------------------ */
group("Required files");
for (const f of [
  "index.html",
  "style.css",
  "script.js",
  "vendor/anime.js",
  "vendor/fonts.css",
  "README.md",
]) {
  existsSync(path.join(ROOT, f))
    ? ok(`${f} present`)
    : fail(`${f} is MISSING`);
}

const FONTS = [
  "inter-latin-400-normal.woff2",
  "inter-latin-500-normal.woff2",
  "inter-latin-600-normal.woff2",
  "space-grotesk-latin-500-normal.woff2",
  "space-grotesk-latin-600-normal.woff2",
  "space-grotesk-latin-700-normal.woff2",
  "jetbrains-mono-latin-400-normal.woff2",
  "jetbrains-mono-latin-500-normal.woff2",
  "jetbrains-mono-latin-700-normal.woff2",
];
const missingFonts = FONTS.filter(
  (f) => !existsSync(path.join(ROOT, "vendor/fonts", f))
);
missingFonts.length === 0
  ? ok(`all ${FONTS.length} font files vendored`)
  : fail(`missing fonts: ${missingFonts.join(", ")}`);

/* ------------------------------------------------------------------ */
group("Offline guarantee (no network at runtime)");

const netPatterns = [
  [/https?:\/\/fonts\.googleapis\.com/g, "Google Fonts stylesheet"],
  [/https?:\/\/fonts\.gstatic\.com/g, "Google Fonts files"],
  [/https?:\/\/cdnjs\.cloudflare\.com/g, "cdnjs CDN"],
  [/https?:\/\/unpkg\.com/g, "unpkg CDN"],
  [/https?:\/\/cdn\.jsdelivr\.net/g, "jsDelivr CDN"],
];

for (const [re, label] of netPatterns) {
  const inHtmlTag =
    new RegExp(`<(?:script|link)[^>]*${re.source}`, "i").test(html);
  inHtmlTag
    ? fail(`index.html still loads ${label}`)
    : ok(`no ${label} dependency`);
}

// Reference links in the <a href> body content are fine and expected.
const scriptSrcs = [...html.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map(
  (m) => m[1]
);
const remoteScripts = scriptSrcs.filter((s) => /^https?:/.test(s));
remoteScripts.length === 0
  ? ok("no remote <script src>")
  : fail(`remote scripts: ${remoteScripts.join(", ")}`);

const linkHrefs = [...html.matchAll(/<link[^>]*href=["']([^"']+)["']/g)].map(
  (m) => m[1]
);
const remoteLinks = linkHrefs.filter((s) => /^https?:/.test(s));
remoteLinks.length === 0
  ? ok("no remote <link href>")
  : fail(`remote links: ${remoteLinks.join(", ")}`);

/* ------------------------------------------------------------------ */
group("DOM contract: script.js ↔ index.html");

const htmlIds = new Set(
  [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1])
);

// Duplicate ids
const allIds = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
const dupes = allIds.filter((v, i) => allIds.indexOf(v) !== i);
dupes.length === 0
  ? ok(`no duplicate ids (${htmlIds.size} unique)`)
  : fail(`duplicate ids: ${[...new Set(dupes)].join(", ")}`);

// Every getElementById target must exist
const gebi = [...js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(
  (m) => m[1]
);
const missingIds = [...new Set(gebi)].filter((id) => !htmlIds.has(id));
missingIds.length === 0
  ? ok(`all ${new Set(gebi).size} getElementById targets exist`)
  : fail(`getElementById targets not in HTML: ${missingIds.join(", ")}`);

// Every #id / .class querySelector target must exist somewhere
const RUNTIME_ONLY = new Set(["col-highlight", "is-flipped", "is-active", "visible"]);
const sel = [
  ...js.matchAll(/querySelector(?:All)?\(\s*['"]([^'"]+)['"]/g),
].map((m) => m[1]);

const missingSel = [];
for (const s of new Set(sel)) {
  // Only validate simple leading #id or .class selectors.
  const first = s.trim().split(/[\s,>]+/)[0];
  if (first.startsWith("#")) {
    const id = first.slice(1).replace(/[^\w-].*$/, "");
    if (id && !htmlIds.has(id)) missingSel.push(s);
  } else if (first.startsWith(".")) {
    const cls = first.slice(1).replace(/[^\w-].*$/, "");
    if (cls && !RUNTIME_ONLY.has(cls) && !html.includes(cls)) missingSel.push(s);
  }
}
missingSel.length === 0
  ? ok(`all ${new Set(sel).size} querySelector targets resolve`)
  : fail(`querySelector targets not in HTML: ${missingSel.join(", ")}`);

/* ------------------------------------------------------------------ */
group("Navigation integrity");

const sectionIds = [...html.matchAll(/<section[^>]*\sid=["']([^"']+)["']/g)].map(
  (m) => m[1]
);
const navTargets = [
  ...html.matchAll(/class=["']dot-nav__link[^"']*["'][^>]*href=["']#([^"']+)["']/g),
].map((m) => m[1]);
const navTargets2 = [
  ...html.matchAll(/href=["']#([^"']+)["'][^>]*class=["']dot-nav__link/g),
].map((m) => m[1]);
const navAll = [...new Set([...navTargets, ...navTargets2])];

const danglingNav = navAll.filter((t) => !sectionIds.includes(t));
danglingNav.length === 0
  ? ok(`all ${navAll.length} dot-nav links point at real sections`)
  : fail(`dot-nav links with no section: ${danglingNav.join(", ")}`);

const unreachable = sectionIds.filter((s) => !navAll.includes(s));
unreachable.length === 0
  ? ok(`all ${sectionIds.length} sections reachable from nav`)
  : fail(`sections missing from nav: ${unreachable.join(", ")}`);

/* ------------------------------------------------------------------ */
group("Accessibility invariants");

const sectionsWithLabel = (
  html.match(/<section[^>]*aria-labelledby=/g) || []
).length;
sectionsWithLabel === sectionIds.length
  ? ok(`all ${sectionIds.length} sections have aria-labelledby`)
  : fail(
      `${sectionIds.length - sectionsWithLabel} section(s) missing aria-labelledby`
    );

html.includes('class="skip-link"')
  ? ok("skip-to-content link present")
  : fail("skip-to-content link missing");

html.includes("<noscript")
  ? ok("noscript fallback present")
  : fail("noscript fallback missing");

// Match the card container only, not its __inner/__front/__back children.
const flipCards = (html.match(/class="flip-card(?![_-])[^"]*"/g) || []).length;
const flipRoles = (
  html.match(/class="flip-card(?![_-])[^"]*"[^>]*role="button"/g) || []
).length;
flipCards === flipRoles
  ? ok(`all ${flipCards} flip cards expose role="button"`)
  : fail(`${flipCards - flipRoles} flip card(s) missing role="button"`);

!/\.flip-card:hover\s+\.flip-card__inner/.test(css)
  ? ok("no hover-flip rule conflicting with click state")
  : fail("hover-flip rule still present (fights the click toggle)");

/prefers-reduced-motion/.test(css)
  ? ok("reduced-motion styles present")
  : fail("no prefers-reduced-motion block in CSS");

const rmChecks = (js.match(/checkReducedMotion\(\)/g) || []).length;
rmChecks >= 10
  ? ok(`reduced-motion checked in ${rmChecks} places`)
  : fail(`only ${rmChecks} reduced-motion checks (expected 10+)`);

/* ------------------------------------------------------------------ */
group("Code hygiene");

/<script[^>]+src=["']\.\/vendor\/anime\.js["']/.test(html)
  ? ok("anime.js loaded locally from vendor/ (not a CDN)")
  : fail("anime.js is not loaded from vendor/");

!/<script[^>]+type=["']module["']/.test(html)
  ? ok("no ES modules — runs from file:// without a server")
  : fail("a <script type=\"module\"> would be CORS-blocked on file://");

!/\bimport\s+.*\bfrom\s+['"]/.test(js)
  ? ok("script.js is plain classic JavaScript (no import statements)")
  : fail("script.js still uses ES module imports");

const animeVersion = read("vendor/anime.js").match(/anime\.js v([\d.]+)/);
animeVersion
  ? ok(`vendored anime.js v${animeVersion[1]}`)
  : fail("cannot determine vendored anime.js version");

!existsSync(path.join(ROOT, "src"))
  ? ok("no duplicate src/ implementation")
  : fail("src/ still exists — two parallel implementations");

!existsSync(path.join(ROOT, "package.json"))
  ? ok("no package.json — nothing to install")
  : fail("package.json reintroduces a toolchain");

const stray = ["vite.config.ts", "tsconfig.json", "node_modules", "dist"].filter((f) =>
  existsSync(path.join(ROOT, f))
);
stray.length === 0
  ? ok("no build artefacts or config (pure HTML/CSS/JS)")
  : fail(`build tooling present: ${stray.join(", ")}`);

/* ------------------------------------------------------------------ */
group("Content");

const refCount = (html.match(/<li><span class="text-muted">/g) || []).length;
refCount >= 5
  ? ok(`${refCount} cited references present`)
  : fail(`only ${refCount} references found`);

const qaCount = (html.match(/class="accordion-trigger/g) || []).length;
qaCount >= 6
  ? ok(`${qaCount} Q&A entries`)
  : fail(`only ${qaCount} Q&A entries`);

/* ------------------------------------------------------------------ */
const size = statSync(path.join(ROOT, "index.html")).size;
console.log(
  `\n\x1b[1mResult:\x1b[0m ${checks - failures}/${checks} checks passed` +
    ` · ${sectionIds.length} sections · source index.html ${(size / 1024).toFixed(0)} kB`
);

if (failures > 0) {
  console.error(`\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`);
  process.exit(1);
}
console.log("\x1b[32mAll checks passed.\x1b[0m\n");
