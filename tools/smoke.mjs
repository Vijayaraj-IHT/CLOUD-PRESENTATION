#!/usr/bin/env node
/**
 * Runtime smoke test for the built deck (dist/index.html).
 *
 * Drives the real bundle in a jsdom DOM and asserts that every interactive
 * feature works end to end: poll, flip cards + aria sync, the two-way server
 * failure simulation, the accordion, the terminal transcript, and the
 * keyboard shortcut panel. Also fails on any uncaught runtime error.
 *
 * Requires jsdom (dev-only):  npm i --no-save jsdom
 * Usage:                      npm run test
 */

import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist', 'index.html');
if (!existsSync(DIST)) {
  console.error('dist/index.html not found — run `npm run build` first.');
  process.exit(1);
}

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

let html = readFileSync(DIST, 'utf8');
// jsdom cannot execute <script type="module">; the vite bundle has no
// imports left after bundling, so run it as a classic script instead.
html = html.replace(/<script type="module"[^>]*>/g, '<script>');
// Polyfills must exist before the bundle runs.
const POLY = `<script>
window.IntersectionObserver = class {
  constructor(cb){ this.cb = cb; }
  observe(el){ this.cb([{ isIntersecting: true, target: el }], this); }
  unobserve(){} disconnect(){}
};
SVGElement.prototype.getTotalLength = function(){ return 100; };
window.matchMedia = window.matchMedia || function(q){
  return { matches:false, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} };
};
<\/script>`;
html = html.replace('</head>', POLY + '</head>');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: 'http://localhost/',
});
const { window } = dom;

await new Promise(r => setTimeout(r, 400));
const d = window.document;

const results = [];
const t = (name, cond, extra='') => results.push([cond ? 'PASS':'FAIL', name, extra]);

t('deck-ready class set', d.documentElement.classList.contains('deck-ready'));
t('anime available', typeof window.anime === 'function');
t('15 sections', d.querySelectorAll('section[id]').length === 15, String(d.querySelectorAll('section[id]').length));
t('progress bar exists', !!d.getElementById('scroll-progress'));
t('shortcut help exists', !!d.getElementById('shortcut-help'));
t('skip link exists', !!d.querySelector('.skip-link'));

// Poll interaction
const pollBtn = d.getElementById('poll-trigger');
const pollRes = d.getElementById('poll-result');
t('poll hidden initially', pollRes.hidden);
pollBtn.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
t('poll reveals on click', !pollRes.hidden);

// Flip card aria sync
const card = d.querySelector('.flip-card');
t('card aria-expanded=false initially', card.getAttribute('aria-expanded') === 'false');
card.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
t('card flips', card.classList.contains('is-flipped'));
t('card aria-expanded=true after flip', card.getAttribute('aria-expanded') === 'true');
card.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
t('card unflips', !card.classList.contains('is-flipped'));
t('card aria-expanded back to false', card.getAttribute('aria-expanded') === 'false');

// Server failure sim toggles both ways
const sim = d.getElementById('simulate-failure-btn');
const status = d.getElementById('failure-status-text');
sim.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
t('failure sim engages', /FAILED/.test(status.innerHTML), status.textContent.slice(0,40));
t('failure sim aria-pressed', sim.getAttribute('aria-pressed') === 'true');
sim.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
t('failure sim resets', !/FAILED/.test(status.innerHTML));
t('failure sim aria-pressed false', sim.getAttribute('aria-pressed') === 'false');

// Accordion
const accBtn = d.querySelector('.accordion-trigger');
const panel = d.getElementById(accBtn.getAttribute('aria-controls'));
t('accordion panel hidden', panel.hidden);
accBtn.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
t('accordion opens', !panel.hidden && accBtn.getAttribute('aria-expanded')==='true');
accBtn.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
t('accordion closes', panel.hidden);

// Terminal demo
const play = d.getElementById('demo-play-btn');
play.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
await new Promise(r => setTimeout(r, 3800));
const lines = d.getElementById('terminal-lines').children.length;
t('terminal printed all 7 lines', lines === 7, `got ${lines}`);
t('replay button shown', !d.getElementById('demo-replay-btn').hidden);

// Keyboard help toggle
d.dispatchEvent(new window.KeyboardEvent('keydown', {key:'?', bubbles:true}));
t('? opens shortcut help', !d.getElementById('shortcut-help').hasAttribute('hidden'));
d.dispatchEvent(new window.KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
t('Esc closes shortcut help', d.getElementById('shortcut-help').hasAttribute('hidden'));

let fails=0;
for (const [s,n,e] of results){ if(s==='FAIL') fails++; console.log(`  ${s==='PASS'?'\x1b[32m✔\x1b[0m':'\x1b[31m✘\x1b[0m'} ${n}${e?' ('+e+')':''}`); }
if (errors.length){ console.log('\nRuntime errors:'); errors.forEach(e=>console.log('  '+e)); }
console.log(`\n${results.length-fails}/${results.length} runtime checks passed`);
process.exit(fails||errors.length?1:0);
