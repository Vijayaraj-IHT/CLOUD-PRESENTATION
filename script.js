/**
 * CLOUD STORAGE SERVICES PRESENTATION — SCRIPT.JS
 *
 * Plain browser JavaScript. No build step, no modules, no dependencies to
 * install. Loaded with a classic <script defer> tag so it runs straight from a
 * file:// URL — ES modules would be blocked by CORS when opened by double-click.
 *
 * anime.js v3.2.2 is loaded from ./vendor/anime.js before this file and
 * registers itself as the global `window.anime` (no CDN, no network).
 *
 * Organized into clear, independent functions per section.
 * Pre-checks prefers-reduced-motion independently inside every single animation function.
 */

(function () {
  'use strict';

/* ============================================
   LIFECYCLE
   ============================================ */
const SECTION_INITS = [
  initNavigation,
  initDataTrail,
  initHero,
  initQuickCheck,
  initStorageTypes,
  initEngineRoom,
  initProviderTable,
  initBusinessCase,
  initChallenges,
  initBuildSteps,
  initLiveDemo,
  initBenefits,
  initTwentyFourHour,
  initRoadmap,
  initFutureTrends,
  initConclusion,
  initKeyboardNav,
  initProgressBar,
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

/* ============================================
   GLOBAL UTILITIES & REDUCED MOTION CHECK
   ============================================ */
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

/* ============================================
   GLOBAL NAVIGATION & DATA TRAIL
   ============================================ */
function initNavigation() {
  const links = document.querySelectorAll('.dot-nav__link');
  const sections = document.querySelectorAll('section');
  
  if (!links.length || !sections.length) return;

  // Track active section on scroll
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(sec => navObserver.observe(sec));

  // Smooth scroll click handler
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: checkReducedMotion() ? 'auto' : 'smooth' });
      }
    });
  });
}

function initDataTrail() {
  if (checkReducedMotion()) return;

  const pulse = document.querySelector('.data-trail__pulse');
  if (!pulse) return;

  // Single subtle looping pulse along the left data trail
  window.anime({
    targets: pulse,
    top: ['0%', '100%'],
    opacity: [0, 0.8, 0],
    duration: 6000,
    easing: 'easeInOutQuad',
    loop: true
  });
}

/* ============================================
   SECTION 1: HERO / GREETING
   ============================================ */
function initHero() {
  const prefersReduced = checkReducedMotion();
  const heroSection = document.getElementById('hero');
  const graphic = document.getElementById('hero-graphic');
  const eyebrow = document.getElementById('hero-eyebrow');

  if (prefersReduced) {
    // Static fallback
    document.querySelectorAll('.draw-line').forEach(el => el.style.strokeDashoffset = '0');
    return;
  }

  // 1. Text Scramble Effect on Eyebrow label
  if (eyebrow) {
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
  }

  // 2. Node-Network Draw-in (Signature)
  if (window.anime) {
    window.anime.timeline({ easing: 'easeOutCubic' })
      .add({
        targets: '#hero .draw-line',
        strokeDashoffset: [window.anime.setDashoffset, 0],
        duration: 800,
        delay: window.anime.stagger(100)
      })
      .add({
        targets: '#hero .node-dot',
        scale: [0, 1],
        opacity: [0, 1],
        duration: 500,
        delay: window.anime.stagger(50)
      }, '-=500');

    // Ambient single pulsing ring on the hero cloud node
    window.anime({
      targets: '.node-pulse-ring',
      r: [20, 34],
      opacity: [0.7, 0],
      duration: 2500,
      easing: 'easeOutQuad',
      loop: true
    });
  }

  // 3. 3D Tilt on Mouse Move
  if (heroSection && graphic) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      graphic.style.transform = `rotateY(${x / 45}deg) rotateX(${-y / 45}deg)`;
    });

    heroSection.addEventListener('mouseleave', () => {
      graphic.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  }
}

/* ============================================
   SECTION 2: QUICK-CHECK / POLL BLOCK
   ============================================ */
function initQuickCheck() {
  const btn = document.getElementById('poll-trigger');
  const result = document.getElementById('poll-result');
  const counter = document.getElementById('poll-counter');
  const bar = document.getElementById('poll-bar-fill');

  if (!btn || !result) return;

  btn.addEventListener('click', () => {
    const prefersReduced = checkReducedMotion();

    btn.setAttribute('aria-expanded', 'true');
    btn.hidden = true;
    result.hidden = false;

    if (prefersReduced) {
      if (counter) counter.innerText = '87';
      if (bar) bar.style.width = '87%';
      return;
    }

    // Button morph & count-up bar fill with slight easing overshoot
    if (bar) bar.style.width = '87%';

    if (window.anime && counter) {
      window.anime({
        targets: counter,
        innerHTML: [0, 87],
        round: 1,
        duration: 800,
        easing: 'easeOutExpo'
      });
    }

    if (window.anime && result) {
      window.anime({
        targets: result,
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 400,
        easing: 'easeOutQuad'
      });
    }
  });
}

/* ============================================
   SECTION 3: FUNDAMENTALS — STORAGE TYPES
   ============================================ */
function initStorageTypes() {
  const prefersReduced = checkReducedMotion();
  const cards = document.querySelectorAll('#fundamentals .stagger-item');

  // Keyboard accessibility for 3D flip cards.
  // aria-expanded is kept in sync so screen readers announce the state change.
  cards.forEach(card => {
    const toggleFlip = () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-expanded', String(flipped));
    };

    card.addEventListener('click', toggleFlip);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFlip();
      }
      if (e.key === 'Escape' && card.classList.contains('is-flipped')) {
        toggleFlip();
      }
    });
  });

  if (prefersReduced || !cards.length) {
    cards.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  const observer = createOnceObserver((target) => {
    if (window.anime) {
      window.anime({
        targets: target,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        easing: 'easeOutCubic'
      });
    }
  }, 0.2);

  cards.forEach((card, idx) => {
    // Apply staggered CSS transitions or anime
    card.style.transitionDelay = `${idx * 150}ms`;
    observer.observe(card);
  });
}

/* ============================================
   SECTION 4: THE ENGINE ROOM (Highest Animation Budget)
   ============================================ */
function initEngineRoom() {
  const prefersReduced = checkReducedMotion();
  const engineSection = document.getElementById('engine-room');
  const simBtn = document.getElementById('simulate-failure-btn');

  const FAILED_MSG = '<strong>⚠ SERVER 1 FAILED!</strong> Automated routing switch bypassed the node in 4ms. Zero client errors occurred.';
  const HEALTHY_MSG = "If one server fails? You'd never know. The other copies keep your data available without interruption.";

  // Prepare static fallback if reduced motion.
  // Feature parity with the animated branch: the simulation still toggles both
  // ways, only the motion is removed.
  if (prefersReduced) {
    const intEl = document.getElementById('durability-integer');
    const ninesEl = document.getElementById('durability-nines');
    if (intEl) intEl.textContent = '99';
    if (ninesEl) ninesEl.textContent = '999999999';

    if (simBtn) {
      let failed = false;
      simBtn.addEventListener('click', () => {
        const badge = document.getElementById('badge-availability');
        const srv1 = document.getElementById('node-server1');
        const reroute = document.getElementById('path-reroute1');
        const text = document.getElementById('failure-status-text');
        const rect = srv1 && srv1.querySelector('rect');
        const led = srv1 && srv1.querySelector('.status-led');

        failed = !failed;
        simBtn.textContent = failed ? 'Reset Server 1 Status' : 'Simulate Server Failure';
        simBtn.setAttribute('aria-pressed', String(failed));

        if (badge) badge.setAttribute('opacity', failed ? '1' : '0');
        if (reroute) reroute.setAttribute('opacity', failed ? '1' : '0');
        if (srv1) srv1.style.opacity = failed ? '0.3' : '1';
        if (rect) rect.setAttribute('stroke', failed ? '#FF5F56' : '#4FD1C5');
        if (led) led.setAttribute('fill', failed ? '#FF5F56' : '#4FD1C5');
        if (text) text.innerHTML = failed ? FAILED_MSG : HEALTHY_MSG;
      });
    }
    return;
  }

  // 1. Scroll-triggered Digit-by-digit "11 Nines" Count-up + Replication Trace
  if (engineSection) {
    const observer = createOnceObserver(() => {
      if (!window.anime) return;

      // Animate the integer 99
      window.anime({
        targets: '#durability-integer',
        innerHTML: [0, 99],
        round: 1,
        duration: 600,
        easing: 'easeOutQuad'
      });

      // Animate digits of the decimal portion one by one
      const ninesEl = document.getElementById('durability-nines');
      if (ninesEl) {
        ninesEl.textContent = '';
        let count = 0;
        const addNine = trackInterval(() => {
          if (count < 9) {
            ninesEl.textContent += '9';
            count++;
          } else {
            clearTracked(addNine);
          }
        }, 60);
      }

      // Animated file-replication trace along SVG paths
      const paths = ['#path-server1', '#path-server2', '#path-server3'];
      paths.forEach((selector, index) => {
        const path = document.querySelector(selector);
        const packet = document.querySelector(`#packet-${index + 1}`);
        if (!path || !packet) return;

        const pathLength = path.getTotalLength();
        path.style.strokeDasharray = pathLength;
        path.style.strokeDashoffset = pathLength;

        window.anime.timeline({ easing: 'easeInOutQuad', duration: 800, delay: index * 200 })
          .add({
            targets: path,
            strokeDashoffset: [pathLength, 0]
          })
          .add({
            targets: packet,
            translateX: [70, 320],
            translateY: [180, 80 + (index * 100)],
            opacity: [0, 1, 0],
            duration: 600
          }, '-=600');
      });
    }, 0.3);

    observer.observe(engineSection);
  }

  // 2. Interactive Node-Failure & Data Rerouting Simulation
  if (simBtn && window.anime) {
    let isFailed = false;

    simBtn.addEventListener('click', () => {
      const server1 = document.getElementById('node-server1');
      const badge = document.getElementById('badge-availability');
      const reroutePath = document.getElementById('path-reroute1');
      const statusText = document.getElementById('failure-status-text');

      if (!server1 || !badge) return;

      // Guard the SVG internals the same way as every other lookup in this file.
      const rect = server1.querySelector('rect');
      const led = server1.querySelector('.status-led');

      if (!isFailed) {
        isFailed = true;
        simBtn.textContent = "Reset Server 1 Status";
        simBtn.setAttribute('aria-pressed', 'true');

        // Flash Server 1 red and drop opacity
        if (rect) rect.setAttribute('stroke', '#FF5F56');
        if (led) led.setAttribute('fill', '#FF5F56');
        window.anime({
          targets: server1,
          opacity: 0.4,
          translateX: [320, 315, 325, 320],
          duration: 400
        });

        // Show reroute arrow and availability badge
        window.anime({
          targets: [reroutePath, badge],
          opacity: [0, 1],
          duration: 500,
          easing: 'easeOutQuad',
          delay: 200
        });

        if (statusText) {
          statusText.innerHTML = FAILED_MSG;
        }
      } else {
        // Reset simulation
        isFailed = false;
        simBtn.textContent = "Simulate Server Failure";
        simBtn.setAttribute('aria-pressed', 'false');
        if (rect) rect.setAttribute('stroke', '#4FD1C5');
        if (led) led.setAttribute('fill', '#4FD1C5');

        window.anime({
          targets: server1,
          opacity: 1,
          duration: 400
        });

        window.anime({
          targets: [reroutePath, badge],
          opacity: 0,
          duration: 300
        });

        if (statusText) {
          statusText.innerHTML = HEALTHY_MSG;
        }
      }
    });
  }
}

/* ============================================
   SECTION 5: PROVIDER COMPARISON TABLE
   ============================================ */
function initProviderTable() {
  const prefersReduced = checkReducedMotion();
  const table = document.getElementById('provider-table');
  const rows = document.querySelectorAll('#comparison .stagger-row');

  if (table) {
    // Column highlight on hover (comprehension feature)
    const cells = table.querySelectorAll('td[data-col], th[class*="col-"]');
    
    cells.forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        const colName = cell.getAttribute('data-col') || cell.className.replace('col-', '').trim();
        table.querySelectorAll(`[data-col="${colName}"], .col-${colName}`).forEach(colCell => {
          colCell.classList.add('col-highlight');
        });
      });

      cell.addEventListener('mouseleave', () => {
        table.querySelectorAll('.col-highlight').forEach(el => el.classList.remove('col-highlight'));
      });
    });
  }

  // Stagger reveal on scroll
  if (prefersReduced || !rows.length) {
    rows.forEach(r => { r.style.opacity = '1'; r.style.transform = 'none'; });
    return;
  }

  const observer = createOnceObserver((target) => {
    if (window.anime) {
      window.anime({
        targets: target,
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 500,
        easing: 'easeOutQuad'
      });
    }
  }, 0.2);

  rows.forEach(row => observer.observe(row));
}

/* ============================================
   SECTION 6: BUSINESS CASE
   ============================================ */
function initBusinessCase() {
  const prefersReduced = checkReducedMotion();
  const cards = document.querySelectorAll('#business-case .stagger-item');
  const caseStudy = document.getElementById('case-study-panel');

  if (prefersReduced) {
    cards.forEach(c => { c.style.opacity = '1'; c.style.transform = 'none'; });
    document.querySelectorAll('#business-case .icon-draw').forEach(el => el.style.strokeDashoffset = '0');
    return;
  }

  // Icon draw-in + card fade on scroll
  if (cards.length && window.anime) {
    const cardObserver = createOnceObserver((target) => {
      window.anime({
        targets: target,
        opacity: [0, 1],
        translateY: [25, 0],
        duration: 600,
        easing: 'easeOutCubic'
      });

      const iconPaths = target.querySelectorAll('.icon-draw');
      if (iconPaths.length) {
        window.anime({
          targets: iconPaths,
          strokeDashoffset: [window.anime.setDashoffset, 0],
          duration: 750,
          easing: 'easeOutCubic',
          delay: 150
        });
      }
    }, 0.2);

    cards.forEach(c => cardObserver.observe(c));
  }

  // Case study mask-wipe entrance
  if (caseStudy && window.anime) {
    caseStudy.style.opacity = '0';
    caseStudy.style.transform = 'translateX(-30px)';
    
    const csObserver = createOnceObserver(() => {
      window.anime({
        targets: caseStudy,
        opacity: [0, 1],
        translateX: [-30, 0],
        duration: 700,
        easing: 'easeOutExpo'
      });
    }, 0.25);

    csObserver.observe(caseStudy);
  }
}

/* ============================================
   SECTION 7: CHALLENGES & INCIDENT (Restrained Motion)
   ============================================ */
function initChallenges() {
  const prefersReduced = checkReducedMotion();
  const panel = document.getElementById('amber-panel');
  const warningIcon = document.getElementById('warning-icon');

  if (prefersReduced || !panel || !window.anime) return;

  // Single non-looping pulse on warning triangle + gentle fade in
  const observer = createOnceObserver(() => {
    window.anime({
      targets: panel,
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutQuad'
    });

    if (warningIcon) {
      window.anime({
        targets: warningIcon,
        scale: [1, 1.4, 1],
        duration: 600,
        easing: 'easeOutBack'
      });
    }
  }, 0.3);

  observer.observe(panel);
}

/* ============================================
   SECTION 8: HOW TO BUILD (Scroll-Scrubbed Tracker)
   ============================================ */
function initBuildSteps() {
  const prefersReduced = checkReducedMotion();
  const tracker = document.getElementById('step-tracker');
  const fillBar = document.getElementById('step-tracker-fill');
  const steps = document.querySelectorAll('.step-item');

  if (!tracker || !steps.length) return;

  if (prefersReduced) {
    if (fillBar) {
      fillBar.style.width = '80%';
      fillBar.style.height = 'calc(100% - 48px)';
    }
    steps.forEach(s => s.classList.add('is-active'));
    return;
  }

  // Bind step tracker progress line to window scroll position.
  // rAF-throttled: getBoundingClientRect() forces layout, so we read at most
  // once per frame rather than once per scroll event.
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
  update(); // Initial computation
}

/* ============================================
   SECTION 9: LIVE DEMO MOMENT (Deliberate Play)
   ============================================ */
function initLiveDemo() {
  const playBtn = document.getElementById('demo-play-btn');
  const replayBtn = document.getElementById('demo-replay-btn');
  const overlay = document.getElementById('demo-overlay');
  const terminal = document.getElementById('demo-terminal');
  const output = document.getElementById('terminal-lines');

  if (!playBtn || !terminal || !output) return;

  const simulationLines = [
    { text: "$ gcloud storage buckets create gs://edu-project-storage-2026 --location=us-central1", type: "cmd", delay: 200 },
    { text: "Creating gs://edu-project-storage-2026/...", type: "comment", delay: 600 },
    { text: "✔ Bucket created successfully with Standard Storage Tier.", type: "success", delay: 1000 },
    { text: "$ gsutil cp ./dataset.zip gs://edu-project-storage-2026/data/", type: "cmd", delay: 1600 },
    { text: "Copying file://./dataset.zip [Content-Type=application/zip]...", type: "comment", delay: 2200 },
    { text: "Operation completed over 3 parallel cloud replicas (24.8 MB/s).", type: "success", delay: 2800 },
    { text: "✔ Live cloud bucket operational in 4.2 seconds.", type: "success", delay: 3400 }
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

  const setReplayState = (enabled) => {
    if (!replayBtn) return;
    replayBtn.hidden = false;
    replayBtn.disabled = !enabled;
  };

  const run = () => {
    if (isPlaying) return; // ignore repeat clicks mid-run
    cancelPending();

    if (overlay) overlay.hidden = true;
    terminal.hidden = false;
    output.replaceChildren();

    if (checkReducedMotion()) {
      // Show full simulation instantly
      simulationLines.forEach(item => {
        const div = document.createElement('div');
        div.className = lineClass(item.type);
        div.textContent = item.text;
        output.appendChild(div);
      });
      setReplayState(true);
      return;
    }

    isPlaying = true;
    setReplayState(false);

    // Type out simulation sequence dynamically
    simulationLines.forEach((item, index) => {
      const id = setTimeout(() => {
        const div = document.createElement('div');
        div.className = lineClass(item.type);
        div.textContent = item.text;
        output.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;

        if (window.anime) {
          window.anime({
            targets: div,
            opacity: [0, 1],
            translateX: [-10, 0],
            duration: 250,
            easing: 'easeOutQuad'
          });
        }

        if (index === simulationLines.length - 1) {
          isPlaying = false;
          setReplayState(true);
        }
      }, item.delay);
      pending.push(id);
    });
  };

  playBtn.addEventListener('click', run);
  if (replayBtn) replayBtn.addEventListener('click', run);

  window.addEventListener('pagehide', cancelPending);
}

/* ============================================
   SECTION 10: BENEFITS TO ENGINEERS (Restrained)
   ============================================ */
function initBenefits() {
  const prefersReduced = checkReducedMotion();
  const lines = document.querySelectorAll('#benefits .benefit-line');

  if (prefersReduced || !lines.length || !window.anime) {
    lines.forEach(l => { l.style.opacity = '1'; l.style.transform = 'none'; });
    return;
  }

  const observer = createOnceObserver((target) => {
    window.anime({
      targets: target,
      opacity: [0, 1],
      translateX: [-15, 0],
      duration: 500,
      easing: 'easeOutQuad'
    });
  }, 0.2);

  lines.forEach(line => observer.observe(line));
}

/* ============================================
   SECTION 11: 24-HOUR BUILD (Sequential Fill-bars)
   ============================================ */
function initTwentyFourHour() {
  const prefersReduced = checkReducedMotion();
  const container = document.querySelector('.tier-bars-container');
  const tiers = document.querySelectorAll('.tier-item');

  if (!container || !tiers.length) return;

  if (prefersReduced) {
    tiers.forEach(item => {
      const target = item.getAttribute('data-target');
      const fill = item.querySelector('.tier-fill');
      if (fill && target) fill.style.width = `${target}%`;
    });
    return;
  }

  const observer = createOnceObserver(() => {
    tiers.forEach((item, index) => {
      const target = item.getAttribute('data-target');
      const fill = item.querySelector('.tier-fill');

      if (fill && target && window.anime) {
        window.anime({
          targets: fill,
          width: [`0%`, `${target}%`],
          duration: 800,
          delay: index * 250,
          easing: 'easeOutCubic'
        });
      }
    });
  }, 0.25);

  observer.observe(container);
}

/* ============================================
   SECTION 12: SKILLS ROADMAP
   ============================================ */
function initRoadmap() {
  const prefersReduced = checkReducedMotion();
  const container = document.getElementById('roadmap-container');
  const pathLine = document.getElementById('roadmap-path-line');
  const marker = document.getElementById('you-are-here');

  if (!container) return;

  if (prefersReduced) {
    if (pathLine) pathLine.style.strokeDashoffset = '0';
    if (marker) marker.style.left = '12.5%';
    return;
  }

  const observer = createOnceObserver(() => {
    if (!window.anime) return;

    // Draw roadmap connecting line left to right
    if (pathLine) {
      window.anime({
        targets: pathLine,
        strokeDashoffset: [window.anime.setDashoffset, 0],
        duration: 800,
        easing: 'easeOutQuad'
      });
    }

    // Slide marker to Node 1 ("Today")
    if (marker) {
      marker.style.left = '12.5%';
    }

    // Node pop in with bounce
    window.anime({
      targets: '.roadmap-node .node-circle',
      scale: [0, 1],
      duration: 600,
      delay: window.anime.stagger(120),
      easing: 'easeOutBack'
    });
  }, 0.3);

  observer.observe(container);
}

/* ============================================
   SECTION 13: FUTURE TRENDS (Minimal Static/Quiet)
   ============================================ */
function initFutureTrends() {
  const prefersReduced = checkReducedMotion();
  const cards = document.querySelectorAll('#trends .quiet-fade');

  if (prefersReduced || !cards.length || !window.anime) {
    cards.forEach(c => { c.style.opacity = '1'; c.style.transform = 'none'; });
    return;
  }

  // Plain fade-in only without distraction
  const observer = createOnceObserver((target) => {
    window.anime({
      targets: target,
      opacity: [0, 1],
      duration: 600,
      easing: 'linear'
    });
  }, 0.25);

  cards.forEach(card => observer.observe(card));
}

/* ============================================
   SECTION 14: CONCLUSION & ACCORDION Q&A
   ============================================ */
function initConclusion() {
  const prefersReduced = checkReducedMotion();
  const conclusionSec = document.getElementById('conclusion');

  // 1. Recap checkmarks sequential draw
  if (conclusionSec && !prefersReduced && window.anime) {
    const observer = createOnceObserver(() => {
      window.anime({
        targets: '#conclusion .draw-check',
        strokeDashoffset: [window.anime.setDashoffset, 0],
        duration: 500,
        delay: window.anime.stagger(180),
        easing: 'easeOutQuad'
      });
    }, 0.25);
    observer.observe(conclusionSec);
  } else {
    document.querySelectorAll('#conclusion .draw-check').forEach(el => el.style.strokeDashoffset = '0');
  }

  // 2. Real Keyboard-Accessible Accordion
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');
  
  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const controlsId = trigger.getAttribute('aria-controls');
      const panel = document.getElementById(controlsId);
      
      if (!panel) return;

      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        
        if (!prefersReduced && window.anime) {
          window.anime({
            targets: panel,
            opacity: [0, 1],
            translateY: [-10, 0],
            duration: 300,
            easing: 'easeOutQuad'
          });
        }
      }
    });

    // Support keyboard arrows between accordion headers for extra polish
    trigger.addEventListener('keydown', (e) => {
      const allTriggers = Array.from(accordionTriggers);
      const idx = allTriggers.indexOf(trigger);
      if (e.key === 'ArrowDown' && idx < allTriggers.length - 1) {
        allTriggers[idx + 1].focus();
      } else if (e.key === 'ArrowUp' && idx > 0) {
        allTriggers[idx - 1].focus();
      }
    });
  });
}

/* ============================================
   PRESENTER: KEYBOARD SECTION NAVIGATION
   Arrow/Page keys, Home/End, and "?" for help.
   ============================================ */
function initKeyboardNav() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!sections.length) return;

  const behavior = () => (checkReducedMotion() ? 'auto' : 'smooth');

  /** Index of the section currently filling most of the viewport. */
  const currentIndex = () => {
    const mid = window.innerHeight / 2;
    let best = 0;
    let bestDist = Infinity;
    sections.forEach((sec, i) => {
      const rect = sec.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height / 2 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const goTo = (index) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    sections[clamped].scrollIntoView({ behavior: behavior(), block: 'start' });
    // Move focus for screen-reader users without stealing it visually.
    const target = sections[clamped];
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };

  const isTypingTarget = (el) =>
    el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingTarget(document.activeElement)) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case 'j':
        e.preventDefault();
        goTo(currentIndex() + 1);
        break;
      case 'ArrowLeft':
      case 'PageUp':
      case 'k':
        e.preventDefault();
        goTo(currentIndex() - 1);
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(sections.length - 1);
        break;
      case '?':
        e.preventDefault();
        toggleShortcutHelp();
        break;
      case 'Escape':
        closeShortcutHelp();
        break;
      default:
        break;
    }
  });
}

function toggleShortcutHelp() {
  const panel = document.getElementById('shortcut-help');
  if (!panel) return;
  const open = panel.hasAttribute('hidden');
  if (open) {
    panel.removeAttribute('hidden');
  } else {
    panel.setAttribute('hidden', '');
  }
}

function closeShortcutHelp() {
  const panel = document.getElementById('shortcut-help');
  if (panel) panel.setAttribute('hidden', '');
}

/* ============================================
   GLOBAL SCROLL PROGRESS BAR
   ============================================ */
function initProgressBar() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  const update = rafThrottle(() => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    bar.style.width = `${pct}%`;
    bar.parentElement?.setAttribute('aria-valuenow', String(Math.round(pct)));
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

})();
