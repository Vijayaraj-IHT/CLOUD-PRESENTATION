import { useEffect, useRef, useState, useCallback } from 'react';

// Types
interface AccordionItem {
  question: string;
  answer: string;
}

// Q&A Data
const qaData: AccordionItem[] = [
  {
    question: "Is cloud storage actually cheaper than local storage?",
    answer: "For most use cases, yes — you avoid upfront hardware costs and only pay for what you use, but heavy, constant usage at scale can eventually cost more than owning infrastructure."
  },
  {
    question: "What happens if a cloud provider goes down?",
    answer: "Reputable providers replicate data across multiple physical locations, so a single outage rarely causes data loss — though it can cause temporary access issues."
  },
  {
    question: "Is my data actually private in the cloud?",
    answer: "It can be, if configured correctly — encryption and access controls exist, but misconfiguration (like the 2017 incident) is the real-world risk, not the technology itself."
  },
  {
    question: "Which provider should a student start with?",
    answer: "Whichever has the most generous free tier for your use case — AWS, GCP, and Firebase are all solid starting points with strong documentation."
  },
  {
    question: "Do I need to know how to code to use cloud storage?",
    answer: "Basic usage (uploading files via a console) needs no code — connecting it to an app does need some programming, though AI tools have lowered that bar significantly."
  },
  {
    question: "What's the difference between cloud storage and cloud computing?",
    answer: "Storage holds your data; computing runs your application logic. Most real projects use both together."
  },
  {
    question: "How does cloud storage handle really large files?",
    answer: "Most providers support multipart uploads, breaking large files into chunks uploaded in parallel, then reassembled."
  },
  {
    question: "Is vendor lock-in a real problem?",
    answer: "It can be — moving large amounts of data between providers costs time and money, so it's worth considering portability early in a project."
  }
];

// Provider Comparison Data
const providerData = [
  { provider: "AWS S3", pricing: "Pay-as-you-go, per GB + requests", tiers: "Standard / Infrequent Access / Glacier", scalability: "Virtually unlimited", bestFor: "Startups to enterprise workloads" },
  { provider: "Google Cloud Storage", pricing: "Pay-as-you-go, per GB + operations", tiers: "Standard / Nearline / Coldline / Archive", scalability: "Very high", bestFor: "Data-heavy & AI-driven apps" },
  { provider: "Azure Blob Storage", pricing: "Pay-as-you-go, per GB + transactions", tiers: "Hot / Cool / Archive", scalability: "Very high", bestFor: "Microsoft-stack enterprises" },
  { provider: "Dropbox / Box", pricing: "Flat subscription tiers", tiers: "Single tier, simplified", scalability: "Limited vs. hyperscalers", bestFor: "Individuals & small teams" }
];

// Section IDs for navigation
const sectionIds = [
  'hero', 'quick-check', 'fundamentals', 'engine-room', 
  'comparison', 'business-case', 'challenges', 'build-steps',
  'demo', 'benefits', 'twenty-four-hour', 'roadmap', 
  'trends', 'conclusion'
];

export default function App() {
  const [activeSection, setActiveSection] = useState(0);
  const [pollRevealed, setPollRevealed] = useState(false);
  const [pollProgress, setPollProgress] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [openAccordions, setOpenAccordions] = useState<Set<number>>(new Set());
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [nodeFailed, setNodeFailed] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [scrambledText, setScrambledText] = useState('CLOUD STORAGE SERVICES');
  const [heroScrambled, setHeroScrambled] = useState(false);
  const [networkAnimated, setNetworkAnimated] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Text scramble effect using simple JS
  const scrambleEffect = useCallback((target: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?';
    const totalSteps = 15;
    const stepDuration = 50;
    let step = 0;
    
    const interval = setInterval(() => {
      const progress = step / totalSteps;
      const result = target.split('').map((char, i) => {
        if (char === ' ') return ' ';
        if (i < target.length * progress) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      
      setScrambledText(result);
      step++;
      
      if (step > totalSteps) {
        clearInterval(interval);
        setScrambledText(target);
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer setup for reveal animations
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.id;
            setVisibleElements(prev => new Set([...prev, elementId]));
            
            // Hero animations
            if (elementId === 'hero-content' && !heroScrambled && !prefersReducedMotion) {
              setHeroScrambled(true);
              setTimeout(() => scrambleEffect('CLOUD STORAGE SERVICES'), 300);
            }
            
            if (elementId === 'node-network' && !networkAnimated && !prefersReducedMotion) {
              setNetworkAnimated(true);
              // Animate node network lines
              setTimeout(() => {
                const lines = document.querySelectorAll('.node-line');
                lines.forEach((line, i) => {
                  setTimeout(() => {
                    (line as SVGLineElement).style.strokeDashoffset = '0';
                  }, i * 150);
                });
              }, 500);
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    // Observe all reveal elements
    const revealElements = document.querySelectorAll('[data-reveal]');
    revealElements.forEach(el => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [heroScrambled, networkAnimated, scrambleEffect]);

  // Section observer for navigation
  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionIds.indexOf(entry.target.id);
            if (index !== -1) setActiveSection(index);
          }
        });
      },
      { threshold: 0.3 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    return () => sectionObserver.disconnect();
  }, []);

  // Step tracker animation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const buildSection = document.getElementById('build-steps');
      if (!buildSection) return;
      
      const rect = buildSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = Math.max(0, Math.min(1, 
          (windowHeight - rect.top) / (windowHeight + rect.height)
        ));
        setAnimStep(Math.min(5, Math.floor(progress * 6)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Poll reveal handler
  const handlePollReveal = () => {
    setPollRevealed(true);
    // Animate the bar fill with a slight delay
    setTimeout(() => {
      setPollProgress(87);
    }, 200);
  };

  // Card flip handler
  const toggleCardFlip = (index: number) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Accordion toggle
  const toggleAccordion = (index: number) => {
    setOpenAccordions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Node failure simulation
  const triggerNodeFailure = () => {
    if (nodeFailed) return;
    setNodeFailed(true);
    setTimeout(() => setNodeFailed(false), 4000);
  };

  const scrollToSection = (index: number) => {
    const el = document.getElementById(sectionIds[index]);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper for reveal class
  const getRevealClass = (id: string, delay: number = 0) => {
    const isVisible = visibleElements.has(id);
    const delayClass = delay > 0 ? `reveal-delay-${Math.min(delay, 5)}` : '';
    return `reveal ${delayClass} ${isVisible ? 'visible' : ''}`;
  };

  return (
    <div className="relative">
      {/* Navigation Dots */}
      <nav className="dot-nav" aria-label="Section navigation">
        {sectionIds.map((id, index) => (
          <button
            key={id}
            className={`dot-nav__dot ${activeSection === index ? 'active' : ''}`}
            onClick={() => scrollToSection(index)}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </nav>

      {/* Data Trail Line */}
      <div className="data-trail">
        <div className="data-trail__glow" />
      </div>

      {/* ============================================
          SECTION 1: HERO
          ============================================ */}
      <section id="hero" className="section-bg-base relative overflow-hidden">
        <div className="max-w-6xl mx-auto w-full" id="hero-content" data-reveal>
          {/* Eyebrow with text scramble */}
          <div className={`eyebrow reveal ${visibleElements.has('hero-content') ? 'visible' : ''}`}>
            <span className="text-scramble">{scrambledText}</span>
          </div>

          {/* Headline with stagger reveal */}
          <h1 className={`hero-headline reveal reveal-delay-1 ${visibleElements.has('hero-content') ? 'visible' : ''}`}>
            Behind every file you've ever uploaded.
          </h1>

          {/* Subhead */}
          <p className={`hero-subhead reveal reveal-delay-2 ${visibleElements.has('hero-content') ? 'visible' : ''}`}>
            We're skipping the "what is cloud storage" basics — you already know that. 
            Today, we're showing you what happens behind it.
          </p>

          {/* Node Network Animation */}
          <div 
            className={`mt-16 reveal reveal-delay-3 ${visibleElements.has('node-network') ? 'visible' : ''}`}
            id="node-network"
            data-reveal
          >
            <svg viewBox="0 0 400 250" className="w-full max-w-lg">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Lines with stroke animation */}
              <line x1="50" y1="125" x2="130" y2="60" stroke="#4FD1C5" strokeWidth="2" 
                strokeDasharray="120" strokeDashoffset="120" className="node-line"
                style={{transition: 'stroke-dashoffset 0.8s ease'}} />
              <line x1="50" y1="125" x2="130" y2="190" stroke="#4FD1C5" strokeWidth="2"
                strokeDasharray="120" strokeDashoffset="120" className="node-line"
                style={{transition: 'stroke-dashoffset 0.8s ease', transitionDelay: '0.15s'}} />
              <line x1="130" y1="60" x2="220" y2="60" stroke="#4FD1C5" strokeWidth="2"
                strokeDasharray="100" strokeDashoffset="100" className="node-line"
                style={{transition: 'stroke-dashoffset 0.8s ease', transitionDelay: '0.3s'}} />
              <line x1="130" y1="60" x2="220" y2="125" stroke="#4FD1C5" strokeWidth="2"
                strokeDasharray="120" strokeDashoffset="120" className="node-line"
                style={{transition: 'stroke-dashoffset 0.8s ease', transitionDelay: '0.4s'}} />
              <line x1="130" y1="190" x2="220" y2="125" stroke="#4FD1C5" strokeWidth="2"
                strokeDasharray="120" strokeDashoffset="120" className="node-line"
                style={{transition: 'stroke-dashoffset 0.8s ease', transitionDelay: '0.5s'}} />
              <line x1="220" y1="60" x2="340" y2="125" stroke="#4FD1C5" strokeWidth="2"
                strokeDasharray="150" strokeDashoffset="150" className="node-line"
                style={{transition: 'stroke-dashoffset 0.8s ease', transitionDelay: '0.6s'}} />
              <line x1="220" y1="125" x2="340" y2="125" stroke="#4FD1C5" strokeWidth="2"
                strokeDasharray="120" strokeDashoffset="120" className="node-line"
                style={{transition: 'stroke-dashoffset 0.8s ease', transitionDelay: '0.7s'}} />
              
              {/* Source node */}
              <circle cx="50" cy="125" r="10" fill="#4FD1C5" filter="url(#glow)" className="pulse" />
              
              {/* Middle nodes */}
              <circle cx="130" cy="60" r="8" fill="#4FD1C5" opacity="0.9">
                <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="1s" />
              </circle>
              <circle cx="130" cy="190" r="8" fill="#4FD1C5" opacity="0.9">
                <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="1.3s" />
              </circle>
              <circle cx="220" cy="60" r="8" fill="#4FD1C5" opacity="0.9">
                <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="1.6s" />
              </circle>
              <circle cx="220" cy="125" r="8" fill="#4FD1C5" opacity="0.9">
                <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="1.9s" />
              </circle>
              
              {/* Cloud destination node (highlighted) */}
              <circle cx="340" cy="125" r="12" fill="#F4A261" filter="url(#glow)" className="pulse" />
              
              {/* Labels */}
              <text x="50" y="155" fill="#8CA0B8" fontSize="10" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">YOU</text>
              <text x="340" y="155" fill="#8CA0B8" fontSize="10" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">CLOUD</text>
            </svg>
          </div>

          {/* Byline */}
          <div className={`mt-12 reveal reveal-delay-4 ${visibleElements.has('hero-content') ? 'visible' : ''}`}>
            <span className="font-mono text-sm" style={{color: '#8CA0B8'}}>Engineering Students · Cloud Computing 101 · Spring 2025</span>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: QUICK CHECK / POLL
          ============================================ */}
      <section id="quick-check" className="section-bg-panel">
        <div className="max-w-2xl mx-auto w-full text-center" data-reveal id="poll-section">
          <div className={`eyebrow ${getRevealClass('poll-section')}`}>
            QUICK CHECK
          </div>

          <h2 className={`text-2xl md:text-3xl font-medium mt-4 ${getRevealClass('poll-section', 1)}`}>
            "How many of you have used a free-tier cloud service without realizing it?"
          </h2>

          <div className={`mt-8 ${getRevealClass('poll-section', 2)}`}>
            {!pollRevealed ? (
              <button className="poll-button" onClick={handlePollReveal}>
                See the answer
              </button>
            ) : (
              <div className="text-left max-w-md mx-auto">
                <div className="flex items-end gap-4 mb-2">
                  <span className="font-mono text-5xl font-bold" style={{color: '#4FD1C5'}}>87%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar__fill" style={{ width: `${pollProgress}%` }} />
                </div>
                <p className="mt-4 text-sm" style={{color: '#8CA0B8'}}>
                  Most people already have — Google Photos, iCloud backup, and Discord attachments all run on cloud storage.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: FUNDAMENTALS — STORAGE TYPES
          ============================================ */}
      <section id="fundamentals" className="section-bg-base">
        <div className="max-w-6xl mx-auto w-full">
          <div className="eyebrow">01 · FUNDAMENTALS</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">How your file actually travels</h2>
          <p className="mt-4 max-w-2xl" style={{color: '#8CA0B8'}}>
            From the moment you hit upload, your file makes a journey most people never think about.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {/* Object Storage Card */}
            <div 
              className={`storage-card ${getRevealClass('card-0')} ${flippedCards.has(0) ? 'flipped' : ''}`}
              data-reveal
              id="card-0"
              onClick={() => toggleCardFlip(0)}
            >
              <div className="storage-card__inner">
                <div className="storage-card__face">
                  <div className="font-mono text-sm mb-4" style={{color: '#4FD1C5'}}>TYPE A</div>
                  <h3 className="text-2xl font-semibold mb-4">Object Storage</h3>
                  <p className="text-sm mt-auto" style={{color: '#8CA0B8'}}>Click to reveal →</p>
                </div>
                <div className="storage-card__face storage-card__back">
                  <div className="font-mono text-sm mb-4" style={{color: '#4FD1C5'}}>EXAMPLES</div>
                  <p className="text-sm leading-relaxed">
                    Stores files as whole, self-contained units with metadata. Think: Google Photos, Amazon S3. 
                    Best for unstructured data — images, videos, backups.
                  </p>
                </div>
              </div>
            </div>

            {/* Block Storage Card */}
            <div 
              className={`storage-card reveal reveal-delay-1 ${visibleElements.has('card-0') ? 'visible' : ''} ${flippedCards.has(1) ? 'flipped' : ''}`}
              data-reveal
              id="card-1"
              onClick={() => toggleCardFlip(1)}
            >
              <div className="storage-card__inner">
                <div className="storage-card__face">
                  <div className="font-mono text-sm mb-4" style={{color: '#4FD1C5'}}>TYPE B</div>
                  <h3 className="text-2xl font-semibold mb-4">Block Storage</h3>
                  <p className="text-sm mt-auto" style={{color: '#8CA0B8'}}>Click to reveal →</p>
                </div>
                <div className="storage-card__face storage-card__back">
                  <div className="font-mono text-sm mb-4" style={{color: '#4FD1C5'}}>EXAMPLES</div>
                  <p className="text-sm leading-relaxed">
                    Splits data into fixed-size blocks, each addressed independently. Think: Amazon EBS. 
                    Powers virtual machines and databases that need fast read/write.
                  </p>
                </div>
              </div>
            </div>

            {/* File Storage Card */}
            <div 
              className={`storage-card reveal reveal-delay-2 ${visibleElements.has('card-0') ? 'visible' : ''} ${flippedCards.has(2) ? 'flipped' : ''}`}
              data-reveal
              id="card-2"
              onClick={() => toggleCardFlip(2)}
            >
              <div className="storage-card__inner">
                <div className="storage-card__face">
                  <div className="font-mono text-sm mb-4" style={{color: '#4FD1C5'}}>TYPE C</div>
                  <h3 className="text-2xl font-semibold mb-4">File Storage</h3>
                  <p className="text-sm mt-auto" style={{color: '#8CA0B8'}}>Click to reveal →</p>
                </div>
                <div className="storage-card__face storage-card__back">
                  <div className="font-mono text-sm mb-4" style={{color: '#4FD1C5'}}>EXAMPLES</div>
                  <p className="text-sm leading-relaxed">
                    Organizes data in a familiar folder/file hierarchy shared across users. Think: Google Drive, Amazon EFS. 
                    Best for shared documents and collaboration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Deployment Tags */}
          <div className="flex flex-wrap gap-3 mt-8">
            {['Public', 'Private', 'Hybrid', 'Multi-cloud'].map((tag) => (
              <span key={tag} className="font-mono text-xs px-4 py-2 rounded-full" 
                style={{background: '#16263D', border: '1px solid rgba(79, 209, 197, 0.2)'}}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 4: THE ENGINE ROOM
          ============================================ */}
      <section id="engine-room" className="section-bg-panel">
        <div className="max-w-6xl mx-auto w-full">
          <div className="eyebrow">02 · THE ENGINE ROOM</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">What keeps your file alive</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
            {/* Left Column - Durability + APIs */}
            <div className="space-y-8">
              {/* Durability Stat */}
              <div data-reveal id="durability" className={getRevealClass('durability')}>
                <h3 className="text-lg font-medium mb-2" style={{color: '#8CA0B8'}}>Durability</h3>
                <div className="font-mono text-4xl md:text-5xl font-bold" style={{color: '#4FD1C5'}}>
                  99.999999999<span className="text-2xl">%</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed" style={{color: '#8CA0B8'}}>
                  Eleven nines of durability. At that rate, if you stored 10 million files, 
                  you'd expect to lose one roughly once every 10,000 years.
                </p>
              </div>

              {/* APIs & SDKs */}
              <div className="rounded-xl p-6" style={{background: '#0E1A2B'}} data-reveal id="apis">
                <div className={`${getRevealClass('apis', 1)}`}>
                  <h3 className="font-semibold mb-2">APIs & SDKs</h3>
                  <p className="text-sm leading-relaxed" style={{color: '#8CA0B8'}}>
                    Every time an app like Instagram or Netflix fetches a photo or video, 
                    it's making a request to cloud storage through an API — a structured way 
                    for software to ask, "give me this file."
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Replication Diagram */}
            <div data-reveal id="redundancy" className={getRevealClass('redundancy', 2)}>
              <div className="rounded-2xl p-6 relative" style={{background: '#0E1A2B'}}>
                <h3 className="font-semibold mb-2">Redundancy & Replication</h3>
                
                {/* SVG Replication Diagram */}
                <svg viewBox="0 0 400 300" className="w-full mt-4">
                  <defs>
                    <filter id="nodeGlow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#F4A261" />
                    </marker>
                  </defs>
                  
                  {/* Source File */}
                  <g>
                    <rect x="10" y="130" width="70" height="40" rx="8" fill="#16263D" stroke="#4FD1C5" strokeWidth="2" />
                    <text x="45" y="155" fill="#4FD1C5" fontSize="11" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">FILE</text>
                  </g>
                  
                  {/* Connection Lines */}
                  <line x1="80" y1="150" x2="170" y2="70" stroke="#4FD1C5" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                  <line x1="80" y1="150" x2="170" y2="150" stroke="#4FD1C5" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                  <line x1="80" y1="150" x2="170" y2="230" stroke="#4FD1C5" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                  
                  {/* Data flow animation */}
                  {!nodeFailed && (
                    <>
                      <circle r="4" fill="#4FD1C5">
                        <animateMotion dur="2s" repeatCount="indefinite" path="M80,150 L170,70" />
                      </circle>
                      <circle r="4" fill="#4FD1C5">
                        <animateMotion dur="2s" repeatCount="indefinite" path="M80,150 L170,150" begin="0.3s" />
                      </circle>
                      <circle r="4" fill="#4FD1C5">
                        <animateMotion dur="2s" repeatCount="indefinite" path="M80,150 L170,230" begin="0.6s" />
                      </circle>
                    </>
                  )}
                  
                  {/* Server 1 - Can fail */}
                  <g style={{transition: 'opacity 0.3s, transform 0.3s', transformOrigin: '210px 70px'}}>
                    <rect x="170" y="50" width="80" height="40" rx="8" 
                      fill={nodeFailed ? '#1a1a2e' : '#16263D'} 
                      stroke={nodeFailed ? '#ef4444' : '#4FD1C5'} 
                      strokeWidth="2"
                      filter={nodeFailed ? 'none' : 'url(#nodeGlow)'} />
                    <text x="210" y="75" fill={nodeFailed ? '#ef4444' : '#4FD1C5'} fontSize="9" textAnchor="middle" 
                      fontFamily="'JetBrains Mono', monospace">
                      {nodeFailed ? '✕ FAILED' : 'SERVER 1'}
                    </text>
                  </g>
                  
                  {/* Server 2 - Always healthy */}
                  <g>
                    <rect x="170" y="130" width="80" height="40" rx="8" fill="#16263D" stroke="#10b981" strokeWidth="2" filter="url(#nodeGlow)">
                      <animate attributeName="stroke" values="#10b981;#4FD1C5;#10b981" dur="3s" repeatCount="indefinite" />
                    </rect>
                    <text x="210" y="155" fill="#10b981" fontSize="9" textAnchor="middle" 
                      fontFamily="'JetBrains Mono', monospace">SERVER 2</text>
                  </g>
                  
                  {/* Server 3 - Always healthy */}
                  <g>
                    <rect x="170" y="210" width="80" height="40" rx="8" fill="#16263D" stroke="#10b981" strokeWidth="2" filter="url(#nodeGlow)">
                      <animate attributeName="stroke" values="#10b981;#4FD1C5;#10b981" dur="3s" repeatCount="indefinite" begin="0.5s" />
                    </rect>
                    <text x="210" y="235" fill="#10b981" fontSize="9" textAnchor="middle" 
                      fontFamily="'JetBrains Mono', monospace">SERVER 3</text>
                  </g>
                  
                  {/* Reroute arrows when node fails */}
                  {nodeFailed && (
                    <>
                      <path d="M210 90 L210 130" stroke="#F4A261" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="4,2">
                        <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.5s" repeatCount="indefinite" />
                      </path>
                      <text x="260" y="115" fill="#F4A261" fontSize="9" fontFamily="'JetBrains Mono', monospace">REROUTE</text>
                    </>
                  )}
                  
                  {/* Status indicator */}
                  {nodeFailed && (
                    <g>
                      <rect x="290" y="130" width="100" height="40" rx="6" fill="#F4A261" opacity="0.1" stroke="#F4A261" strokeWidth="1" />
                      <text x="340" y="155" fill="#F4A261" fontSize="9" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
                        STILL AVAILABLE
                      </text>
                    </g>
                  )}
                </svg>
                
                {/* Failure simulation button */}
                <button 
                  className="mt-4 text-xs font-mono px-4 py-2 rounded transition-colors"
                  style={{color: '#F4A261', border: '1px solid rgba(244, 162, 97, 0.3)'}}
                  onClick={triggerNodeFailure}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 162, 97, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {nodeFailed ? 'Reset simulation' : 'Simulate server failure'}
                </button>
                
                {nodeFailed && (
                  <p className="text-xs mt-2 font-mono" style={{color: '#F4A261'}}>
                    Server 1 failed — data rerouted through Servers 2 & 3
                  </p>
                )}
              </div>
              
              <p className="text-sm mt-4" style={{color: '#8CA0B8'}}>
                The moment you upload a file, it's copied — automatically — across multiple physical servers, 
                often in different buildings or even different cities.
              </p>
              <p className="text-sm mt-2" style={{color: '#8CA0B8'}}>
                If one server fails? You'd never know. The other copies keep your data available without interruption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: PROVIDER COMPARISON
          ============================================ */}
      <section id="comparison" className="section-bg-base">
        <div className="max-w-6xl mx-auto w-full">
          <div className="eyebrow">03 · WHO'S BUILDING IT</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">Four ways to store the same file</h2>

          <div className="mt-12 overflow-x-auto" data-reveal id="comparison-table">
            <table className={`comparison-table ${getRevealClass('comparison-table')}`}>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Pricing Model</th>
                  <th>Storage Tiers</th>
                  <th>Scalability</th>
                  <th>Best For</th>
                </tr>
              </thead>
              <tbody>
                {providerData.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <span className="inline-block w-1 h-6 rounded-full mr-3 align-middle" 
                        style={{background: '#4FD1C5'}} />
                      {row.provider}
                    </td>
                    <td>{row.pricing}</td>
                    <td>{row.tiers}</td>
                    <td>{row.scalability}</td>
                    <td>{row.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: BUSINESS CASE
          ============================================ */}
      <section id="business-case" className="section-bg-panel">
        <div className="max-w-6xl mx-auto w-full">
          <div className="eyebrow">WHY BUSINESSES CARE</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">It's not just convenient — it's cheaper and safer</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { label: 'Cost', title: 'OpEx, not CapEx', desc: 'Pay for what you use instead of buying servers upfront.', icon: 'M24 6v36M12 18h24M12 30h24M18 6h12v36H18z' },
              { label: 'Scale', title: 'Elastic by design', desc: 'Handle 10 users or 10 million without re-architecting.', icon: 'M12 36l12-24 12 24M16 28h16' },
              { label: 'Security', title: 'Built-in compliance', desc: 'Encryption, access control, and standards like GDPR/HIPAA baked in.', icon: 'M24 8l14 8v12c0 8-14 14-14 14S10 28 10 16V16z' },
              { label: 'Recovery', title: 'Disaster recovery', desc: 'Data replicated across locations survives outages, fires, even natural disasters.', icon: 'M12 36V20l12-8 12 8v16M8 36h32M24 28v8' }
            ].map((card, i) => (
              <div key={i} className={`biz-card ${getRevealClass('biz-card-' + i)}`} data-reveal id={`biz-card-${i}`}>
                <div className="biz-card__icon">
                  <svg viewBox="0 0 48 48" className="w-12 h-12">
                    <path d={card.icon} stroke="#4FD1C5" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg">{card.title}</h3>
                <p className="text-sm mt-2" style={{color: '#8CA0B8'}}>{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Case Study */}
          <div className="case-study mt-12" data-reveal id="case-study">
            <div className={`${getRevealClass('case-study')}`}>
              <div className="font-mono text-sm mb-4" style={{color: '#4FD1C5'}}>CASE STUDY</div>
              <h3 className="text-2xl font-semibold mb-4">Netflix runs entirely on AWS</h3>
              <p className="leading-relaxed" style={{color: '#8CA0B8'}}>
                Netflix streams to over 300 million subscribers worldwide without owning a single data center — 
                every video, recommendation, and account detail is served through Amazon's cloud infrastructure. 
                It's a working example of why "don't manage your own servers" became the industry default.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 7: CHALLENGES
          ============================================ */}
      <section id="challenges" className="section-bg-base">
        <div className="max-w-4xl mx-auto w-full">
          <div className="eyebrow">THE FLIP SIDE</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">Cloud storage isn't risk-free</h2>

          <div className="flex flex-wrap gap-3 mt-8">
            {['Vendor lock-in', 'Latency & bandwidth cost', 'Data sovereignty'].map((tag) => (
              <span key={tag} className="challenge-tag">{tag}</span>
            ))}
          </div>

          <div className="incident-panel mt-8" data-reveal id="incident">
            <div className={`font-mono text-sm mb-4 flex items-center gap-2 ${getRevealClass('incident')}`} style={{color: '#F4A261'}}>
              <span className="text-xl">⚠</span> REAL INCIDENT
            </div>
            <p className="leading-relaxed">
              In 2017, a misconfigured Amazon S3 bucket exposed sensitive voter data for nearly 200 million Americans — 
              not because of a hack, but because access permissions were left open by mistake. The technology wasn't the 
              failure; the configuration was.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 8: HOW TO BUILD
          ============================================ */}
      <section id="build-steps" className="section-bg-panel">
        <div className="max-w-6xl mx-auto w-full">
          <div className="eyebrow">04 · BUILDING ONE YOURSELF</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">Five steps from idea to deployed</h2>

          {/* Step Tracker */}
          <div className="mt-12">
            <div className="step-tracker">
              <div className="step-tracker__line" />
              <div className="step-tracker__progress" style={{ width: `${(animStep / 5) * 100}%` }} />
              
              {[
                { num: '①', label: 'Pick a provider', detail: 'Start with a free tier — AWS, GCP, Azure, or Firebase all offer one.' },
                { num: '②', label: 'Set up storage', detail: 'Create a bucket or container — your file\'s new home.' },
                { num: '③', label: 'Configure access', detail: 'Decide what\'s public, what\'s private, and who has permission.' },
                { num: '④', label: 'Connect your app', detail: 'Use an SDK or API so your app can upload/retrieve files.' },
                { num: '⑤', label: 'Add the essentials', detail: 'Turn on versioning, encryption, and lifecycle rules.' }
              ].map((step, i) => (
                <div key={i} className={`step ${animStep > i ? 'active' : ''} ${animStep > i + 1 ? 'completed' : ''}`}>
                  <div className="step__number">{step.num}</div>
                  <h4 className="font-medium text-sm">{step.label}</h4>
                  <p className="text-xs mt-2 hidden md:block" style={{color: '#8CA0B8'}}>{step.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tools Table */}
          <div className="rounded-xl p-6 mt-12" style={{background: '#0E1A2B'}} data-reveal id="tools-table">
            <div className={getRevealClass('tools-table')}>
              <h3 className="font-semibold text-lg mb-4">Tools & Environment</h3>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Recommended</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Storage</td><td>AWS S3 / Google Cloud Storage / Firebase Storage</td></tr>
                  <tr><td>Compute</td><td>AWS Lambda / Google Cloud Functions</td></tr>
                  <tr><td>Dev Environment</td><td>VS Code + provider CLI (AWS CLI / gcloud)</td></tr>
                  <tr><td>Version Control</td><td>GitHub</td></tr>
                  <tr><td>Deployment</td><td>Vercel / Netlify (frontend)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 9: LIVE DEMO
          ============================================ */}
      <section id="demo" className="section-bg-base">
        <div className="max-w-5xl mx-auto w-full">
          <div className="eyebrow">SEE IT HAPPEN</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">From zero to a working bucket in under a minute</h2>

          <div className="video-frame mt-12" data-reveal id="video-frame">
            <div className={`${getRevealClass('video-frame')}`}>
              <div className="video-frame__browser">
                <div className="video-frame__dots">
                  <div className="video-frame__dot" style={{background: '#ef4444'}} />
                  <div className="video-frame__dot" style={{background: '#eab308'}} />
                  <div className="video-frame__dot" style={{background: '#22c55e'}} />
                </div>
                <div className="video-frame__content">
                  <div className="text-center">
                    <div className="play-button mx-auto mb-4">
                      <svg viewBox="0 0 24 24">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{color: '#8CA0B8'}}>Click to play demo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm mt-4 text-center" style={{color: '#8CA0B8'}}>
            Screen recording: creating and configuring a storage bucket, start to finish.
          </p>
        </div>
      </section>

      {/* ============================================
          SECTION 10: BENEFITS TO ENGINEERS
          ============================================ */}
      <section id="benefits" className="section-bg-panel">
        <div className="max-w-4xl mx-auto w-full">
          <div className="eyebrow">WHY ENGINEERS LIKE IT</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">What you stop worrying about</h2>

          <ul className="mt-12 space-y-6">
            {[
              'No infrastructure to manage — focus on your app, not server upkeep',
              'Instant scalability — your project handles growth without a rebuild',
              'Free tiers mean real projects cost nothing to start',
              'A deployed cloud project is a stronger portfolio piece than a local-only one',
              "You're learning the same tools companies use in production"
            ].map((item, i) => (
              <li key={i} className={`flex items-start gap-4 ${getRevealClass('benefit-' + i)}`} data-reveal id={`benefit-${i}`}>
                <span className="text-xl mt-0.5" style={{color: '#4FD1C5'}}>→</span>
                <span className="text-lg">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================
          SECTION 11: 24-HOUR BUILD
          ============================================ */}
      <section id="twenty-four-hour" className="section-bg-base">
        <div className="max-w-5xl mx-auto w-full">
          <div className="eyebrow">05 · WHAT'S POSSIBLE IN 24 HOURS</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">With AI assistance, further than you'd think</h2>

          <div className="mt-12 space-y-8">
            {[
              { tier: 'beginner', label: 'Beginner', fill: 30, desc: 'A file upload/gallery app with a working frontend and cloud backend, fully deployed' },
              { tier: 'intermediate', label: 'Intermediate', fill: 65, desc: 'A multi-user app with authentication, cloud storage, and a basic database' },
              { tier: 'advanced', label: 'Advanced', fill: 90, desc: 'A small SaaS-style MVP — auth, storage, an API layer, and a simple AI feature' }
            ].map((item, i) => (
              <div key={i} data-reveal id={`tier-${i}`}>
                <div className={`${getRevealClass('tier-' + i)}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{item.label}</span>
                    <span className="font-mono text-sm" style={{color: '#4FD1C5'}}>{item.fill}%</span>
                  </div>
                  <div className={`tier-bar ${item.tier}`}>
                    <div 
                      className="tier-bar__fill" 
                      style={{ width: `${visibleElements.has(`tier-${i}`) ? item.fill : 0}%` }}
                    />
                  </div>
                  <p className="text-sm mt-2" style={{color: '#8CA0B8'}}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="italic mt-12 text-lg" style={{color: '#F4A261'}}>
            "AI coding assistants have compressed what used to take a week of learning into a single day."
          </p>
        </div>
      </section>

      {/* ============================================
          SECTION 12: SKILLS ROADMAP
          ============================================ */}
      <section id="roadmap" className="section-bg-panel">
        <div className="max-w-5xl mx-auto w-full">
          <div className="eyebrow">NEXT STEPS</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">Where this leads next</h2>

          <div className="roadmap mt-16" data-reveal id="roadmap-path">
            <div className={`${getRevealClass('roadmap-path')}`}>
              <div className="roadmap__path">
                <div 
                  className="roadmap__path-fill" 
                  style={{ width: `${visibleElements.has('roadmap-path') ? 100 : 0}%` }}
                />
              </div>
              
              <div className="roadmap__nodes">
                {[
                  { label: 'Cloud storage', sub: '(today)' },
                  { label: 'IAM & Security', sub: '' },
                  { label: 'Infrastructure-as-Code', sub: 'Terraform' },
                  { label: 'CI/CD pipelines', sub: '' }
                ].map((node, i) => (
                  <div key={i} className={`roadmap__node ${i === 0 ? 'active completed' : ''}`}>
                    {i === 0 && <div className="roadmap__marker">You are here</div>}
                    <div className="roadmap__node-dot" />
                    <span className="font-medium text-sm">{node.label}</span>
                    {node.sub && <span className="text-xs" style={{color: '#8CA0B8'}}>{node.sub}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 13: FUTURE TRENDS
          ============================================ */}
      <section id="trends" className="section-bg-base">
        <div className="max-w-4xl mx-auto w-full">
          <div className="eyebrow">WHAT'S NEXT</div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">Two trends worth watching</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {[
              { title: 'Edge storage', desc: 'Data stored closer to users geographically, cutting latency for real-time apps.' },
              { title: 'AI-driven optimization', desc: 'Storage systems that automatically move, compress, and tier data based on usage patterns.' }
            ].map((card, i) => (
              <div key={i} data-reveal id={`trend-${i}`}>
                <div className={`rounded-xl p-6 ${getRevealClass('trend-' + i)}`} 
                  style={{background: '#16263D', border: '1px solid rgba(79, 209, 197, 0.2)'}}>
                  <h3 className="font-semibold text-lg mb-3">{card.title}</h3>
                  <p className="text-sm" style={{color: '#8CA0B8'}}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 14: CONCLUSION & Q&A
          ============================================ */}
      <section id="conclusion" className="section-bg-panel">
        <div className="max-w-4xl mx-auto w-full">
          {/* Closing Statement */}
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12" 
            style={{background: 'linear-gradient(135deg, #4FD1C5, #F4A261)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            That's what happens behind the upload button.
          </h2>

          {/* Recap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
            {[
              'How cloud storage actually works',
              "Who's building it, and how they compare",
              "How to build your own — and what's possible in 24 hours",
              'Where to go next'
            ].map((item, i) => (
              <div key={i} className={`recap-item ${getRevealClass('recap-' + i)}`} data-reveal id={`recap-${i}`}>
                <div className="recap-check">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Q&A Accordion */}
          <div>
            <h3 className="text-xl font-semibold mb-6">Anticipated Questions</h3>
            <div className="accordion">
              {qaData.map((item, i) => (
                <div key={i} className={`accordion-item ${openAccordions.has(i) ? 'open' : ''}`}>
                  <button 
                    className="accordion-trigger"
                    onClick={() => toggleAccordion(i)}
                    aria-expanded={openAccordions.has(i)}
                  >
                    <span>{item.question}</span>
                    <svg className="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <div className="accordion-content">
                    <div className="accordion-content__inner">
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-16">
            <p className="text-2xl font-semibold">Questions?</p>
          </div>
        </div>
      </section>
    </div>
  );
}
