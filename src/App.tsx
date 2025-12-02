import React, { useState, useEffect, useRef, type FormEvent } from 'react';
// --- Types ---
interface ReceiptData {
  itemName: string;
  price: string;
  date: string;
  id: string;
  reason: string;
  loading: boolean;
}

// --- Configuration ---
const API_KEY = ""; // Provided by environment at runtime

// Helper to load scripts dynamically
const useScript = (src: string) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [src]);
  return loaded;
};

const App: React.FC = () => {
  // --- Load Animation Libraries ---
  const gsapLoaded = useScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js');
  const scrollTriggerLoaded = useScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js');
  const [animationsReady, setAnimationsReady] = useState(false);

  // --- State ---
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [architectOpen, setArchitectOpen] = useState(false);
  const [mood, setMood] = useState('');
  const [architectResponse, setArchitectResponse] = useState<string | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);
  
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    itemName: '',
    price: '',
    date: '',
    id: '',
    reason: '',
    loading: false,
  });

  const [activeMenuImage, setActiveMenuImage] = useState<string>('default');

  // --- Refs ---
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorOutlineRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loaderBarRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  
  // --- Effects ---

  // 0. Initialize GSAP once scripts are loaded
  useEffect(() => {
    if (gsapLoaded && scrollTriggerLoaded && !animationsReady) {
      const w = window as any;
      if (w.gsap && w.ScrollTrigger) {
        w.gsap.registerPlugin(w.ScrollTrigger);
        setAnimationsReady(true);
      }
    }
  }, [gsapLoaded, scrollTriggerLoaded, animationsReady]);

  // 1. Custom Cursor
  useEffect(() => {
    if (!animationsReady) return;
    const w = window as any;
    
    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${clientX}px`;
        cursorDotRef.current.style.top = `${clientY}px`;
      }
      if (cursorOutlineRef.current) {
        w.gsap.to(cursorOutlineRef.current, {
          x: clientX,
          y: clientY,
          duration: 0.15,
          ease: "power2.out"
        });
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [animationsReady]);

  // 2. Loader Sequence & Hero Animation
  useEffect(() => {
    // Basic CSS transition for loader bar (runs immediately)
    if (loaderBarRef.current) {
      loaderBarRef.current.style.width = '100%';
      loaderBarRef.current.style.transition = 'width 1.5s cubic-bezier(0.83, 0, 0.17, 1)';
    }

    // Wait for GSAP to be ready before removing loader
    if (!animationsReady) return;
    const w = window as any;

    const timer = setTimeout(() => {
      if (loaderRef.current) {
        w.gsap.to(loaderRef.current, {
          yPercent: -100,
          duration: 1.2,
          ease: "power4.inOut",
          onComplete: () => {
            setLoadingScreen(false);
            initHeroAnimations();
          }
        });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [animationsReady]);

  const initHeroAnimations = () => {
    const w = window as any;
    w.gsap.to('.hero-line span', {
      y: '0%',
      duration: 1.5,
      stagger: 0.2,
      ease: "power4.out"
    });
    w.gsap.to('.hero-fade', {
      opacity: 1,
      y: 0,
      duration: 1.5,
      delay: 0.5,
      ease: "power2.out"
    });
  };

  // 3. Scroll Animations (Parallax & Fade Up)
  useEffect(() => {
    if (loadingScreen || !animationsReady) return;
    const w = window as any;

    // Parallax Images
    const images = document.querySelectorAll('.reveal-img');
    images.forEach((img) => {
        w.gsap.to(img, {
            y: '20%',
            ease: "none",
            scrollTrigger: {
                trigger: img.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });

    // Menu Items Fade Up
    const items = document.querySelectorAll('.menu-item-anim');
    items.forEach((item) => {
        w.gsap.fromTo(item, 
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: item,
                    start: "top 90%"
                }
            }
        );
    });

    // Refresh ScrollTrigger after render
    w.ScrollTrigger.refresh();
  }, [loadingScreen, animationsReady]);

  // --- Handlers ---

  const handleConsultArchitect = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!mood.trim()) return;

    setIsConsulting(true);
    setArchitectResponse(null);

    const menuContext = `
      MENU:
      - Double Espresso (Notes of jasmine & apricot)
      - Long Black (Double shot over hot water)
      - Batch Brew (Rotating single origin)
      - Flat White (Oat / Almond / Dairy)
      - Piccolo (Strong & Short)
      - Espresso Tonic (Fever tree tonic, rosemary, grapefruit zest)
      - Nitro Cold Brew (Velvet texture, single origin)
      - Affogato (Vanilla bean gelato, espresso)
      - Pain au Chocolat (Valrhona chocolate)
      - Avocado Tartine (Sourdough, chili oil, microgreens)
      - Yuzu Lemon Tart (Torched meringue)
    `;

    const systemPrompt = `
      You are "The Architect", an AI entity for a high-end, brutalist cafe called "Impossible Bureau".
      Your tone is precise, architectural, slightly cryptic, and sophisticated.
      You do not use emojis. You speak in short, impactful sentences.
      
      Task: Based on the user's "state" (mood/vibe), recommend ONE drink and ONE food item from the provided MENU.
      Explain WHY this pairing suits their state using architectural or abstract metaphors.
      
      Format: 
      "[Drink Name] + [Food Name]. [Philosophical reason why]."
    `;

    const userPrompt = `User State: "${mood}". Menu Context: ${menuContext}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              contents: [{ parts: [{ text: userPrompt }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] }
          })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "The Bureau is silent.";
      setArchitectResponse(text);

    } catch (error) {
      console.error(error);
      setArchitectResponse("Connection to the Bureau severed. Try again.");
    } finally {
      setIsConsulting(false);
    }
  };

  const handleOpenReceipt = async (itemName: string, price: string) => {
    setReceiptOpen(true);
    setReceiptData({
        itemName,
        price,
        date: new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        id: (Math.floor(Math.random() * 90000) + 10000).toString(),
        reason: "Analyzing necessity...",
        loading: true
    });

    try {
        const prompt = `Write a very short (max 15 words), slightly dystopian, bureaucratic, or philosophical justification for why a customer needs to buy a "${itemName}". Tone: "Impossible Bureau". No emojis.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Purchase mandated by state protocol.";
        
        setReceiptData(prev => ({ ...prev, reason: text, loading: false }));

    } catch (e) {
        console.error(e);
        setReceiptData(prev => ({ ...prev, reason: "Purchase authorized by default.", loading: false }));
    }
  };

  const menuImages: Record<string, string> = {
    'default': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop',
    'black': 'https://images.unsplash.com/photo-1610632380989-680fe40816c6?q=80&w=1887&auto=format&fit=crop',
    'white': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=1870&auto=format&fit=crop',
    'signature': 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?q=80&w=1887&auto=format&fit=crop',
    'food': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1944&auto=format&fit=crop',
  };

  return (
    <div className="font-sans antialiased bg-[#f2f2f2] text-[#0a0a0a] overflow-x-hidden min-h-screen cursor-none selection:bg-black/10 selection:text-black">
      
      {/* Noise Overlay */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9000] opacity-[0.04]"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Custom Cursor */}
      <div ref={cursorDotRef} className="fixed w-1.5 h-1.5 bg-black rounded-full z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2 mix-blend-difference bg-white hidden md:block" />
      <div ref={cursorOutlineRef} className="fixed w-10 h-10 border border-black/20 rounded-full z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-[width,height,background-color] duration-300 hidden md:block" />

      {/* Loader */}
      <div ref={loaderRef} className="fixed inset-0 bg-[#f2f2f2] z-[10000] flex justify-center items-center flex-col">
        <div className="font-display text-4xl font-light mb-6 tracking-tight">BUREAU</div>
        <div className="w-64 h-[1px] bg-gray-200 relative overflow-hidden">
          <div ref={loaderBarRef} className="absolute top-0 left-0 h-full bg-black w-0"></div>
        </div>
      </div>

      {/* Architect Modal */}
      <div className={`fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col justify-center items-center p-8 transition-[clip-path] duration-700 ease-[cubic-bezier(0.83,0,0.17,1)] ${architectOpen ? '[clip-path:circle(150%_at_95%_5%)]' : '[clip-path:circle(0%_at_95%_5%)]'}`}>
        <button onClick={() => setArchitectOpen(false)} className="absolute top-8 right-8 font-mono text-xs uppercase tracking-[0.2em] hover:text-[#cc2900] transition-colors">Close [ESC]</button>
        
        <div className="max-w-2xl w-full text-center">
            <h2 className="font-display text-5xl font-light tracking-tight mb-2">The Architect</h2>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-[0.2em] mb-12">AI-Powered Curation Protocol</p>
            
            <form onSubmit={handleConsultArchitect} className="relative group">
                <input 
                    type="text" 
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="Define your current state (e.g. 'Overworked', 'Rainy', 'Existential')..." 
                    className="w-full bg-transparent border-b border-black/20 py-4 text-2xl font-display outline-none text-center placeholder:text-gray-300 focus:border-black transition-colors"
                />
                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-black transition-all duration-500 group-hover:w-full"></div>
            </form>

            <div className="mt-12 min-h-[8rem] flex flex-col justify-center items-center">
                {(isConsulting || architectResponse) && (
                    <div className="mb-8 animate-in fade-in duration-500">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc2900] mb-2">Recommendation</div>
                        <p className="font-display text-xl leading-relaxed max-w-lg mx-auto">
                            {isConsulting ? <span className="animate-pulse">Analyzing neural patterns...</span> : architectResponse}
                        </p>
                    </div>
                )}
                
                <button 
                    onClick={() => handleConsultArchitect()} 
                    disabled={isConsulting || !mood}
                    className="group relative px-8 py-3 overflow-hidden border border-black/10 rounded-full hover:border-black transition-colors duration-300 disabled:opacity-50"
                >
                    <span className="relative z-10 font-mono text-xs uppercase tracking-[0.2em]">Consult ✨</span>
                    <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0 opacity-5"></div>
                </button>
            </div>
        </div>
      </div>

      {/* Receipt Panel */}
      <div className={`fixed inset-y-0 right-0 z-[90] w-full md:w-[400px] bg-black/5 backdrop-blur-sm flex justify-end items-center md:pr-12 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${receiptOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="w-full h-auto max-h-[80vh] bg-white p-8 font-mono text-xs uppercase tracking-widest relative mx-4 md:mx-0 overflow-y-auto shadow-[-10px_0_30px_rgba(0,0,0,0.1)]">
            {/* Tear Top */}
            <div className="absolute top-[-5px] left-0 w-full h-[10px] rotate-180 bg-[length:20px_20px]" 
                 style={{background: 'linear-gradient(135deg, transparent 75%, #fff 75%) 0 50%, linear-gradient(45deg, transparent 75%, #fff 75%) 0 50%'}}>
            </div>
            
            <button onClick={() => setReceiptOpen(false)} className="absolute top-4 right-4 text-gray-300 hover:text-black transition-colors text-lg">✕</button>

            <div className="text-center mb-8">
                <h3 className="font-display text-2xl font-bold mb-2">BUREAU©</h3>
                <p>Transaction Receipt</p>
                <p className="text-[10px] text-gray-500 mt-1">{receiptData.date}</p>
            </div>

            <div className="border-b border-black border-dashed mb-4"></div>

            <div className="flex justify-between mb-2">
                <span>{receiptData.itemName}</span>
                <span>{receiptData.price}</span>
            </div>
            
            <div className="flex justify-between mb-8 text-gray-400">
                <span>Tax (Existential)</span>
                <span>15%</span>
            </div>

            <div className="border-b border-black border-dashed mb-8"></div>

            <div className="mb-8">
                <p className="mb-2 text-gray-400">Bureaucratic Justification:</p>
                <p className={`text-[#cc2900] leading-relaxed lowercase ${receiptData.loading ? 'animate-pulse' : ''}`}>
                    {receiptData.reason}
                </p>
            </div>

            <div className="text-center text-[10px] text-gray-400 mt-12">
                <p>Order ID: #{receiptData.id}</p>
                <p className="mt-2">Consumption is mandatory.</p>
            </div>

            {/* Tear Bottom */}
            <div className="absolute bottom-[-10px] left-0 w-full h-[10px] bg-[length:20px_20px]"
                 style={{background: 'linear-gradient(135deg, transparent 75%, #fff 75%) 0 50%, linear-gradient(45deg, transparent 75%, #fff 75%) 0 50%'}}>
            </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center mix-blend-difference text-white">
        <a href="#" className="font-display font-medium text-lg tracking-tight hover:opacity-70 transition-opacity">BUREAU©</a>
        
        <div className="hidden md:flex space-x-12 font-mono text-[10px] uppercase tracking-[0.2em] font-medium items-center">
            <a href="#menu" className="hover:text-gray-300 transition-colors">Menu</a>
            <a href="#space" className="hover:text-gray-300 transition-colors">Space</a>
            <a href="#atmosphere" className="hover:text-gray-300 transition-colors">Visuals</a>
            <button onClick={() => setArchitectOpen(true)} className="hover:text-[#cc2900] transition-colors">Consult ✨</button>
            <a href="#info" className="hover:text-gray-300 transition-colors">Info</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-screen flex flex-col justify-center px-8 pt-20 overflow-hidden">
        <div className="max-w-screen-2xl mx-auto w-full relative z-10">
            <h1 ref={heroTextRef} className="font-display text-[12vw] leading-[0.85] font-normal tracking-tight uppercase text-black mb-12 mix-blend-multiply">
                <span className="block hero-line overflow-hidden"><span className="block transform translate-y-full">The</span></span>
                <span className="block hero-line overflow-hidden"><span className="block transform translate-y-full pl-24 text-gray-400">Impossible</span></span>
                <span className="block hero-line overflow-hidden"><span className="block transform translate-y-full">Roast.</span></span>
            </h1>
            
            <div className="border-t border-black/5 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="max-w-md opacity-0 hero-fade">
                    <p className="font-sans text-lg font-light text-gray-600 leading-relaxed">
                        Precision coffee for the creative mind.<br/>
                        Brewed for clarity.
                    </p>
                </div>
                
                <div className="hidden md:block opacity-0 hero-fade">
                    <div className="relative w-24 h-24 flex items-center justify-center animate-[spin_12s_linear_infinite]">
                        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                            <defs>
                                <path id="circle" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
                            </defs>
                            <text fontSize="11" fontFamily="Space Grotesk" fontWeight="500" letterSpacing="2">
                                <textPath href="#circle">
                                    EST. 2025 • BUREAU • EST. 2025 •
                                </textPath>
                            </text>
                        </svg>
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Marquee */}
      <div className="bg-black text-white py-5 overflow-hidden border-y border-white/5">
        <div className="whitespace-nowrap overflow-hidden">
            <div className="inline-block animate-[marquee_35s_linear_infinite] font-display font-light text-xl uppercase tracking-widest opacity-80">
                &nbsp;— Filter — Cold Brew — Pastry — Workspace — Espresso — Filter — Cold Brew — Pastry — Workspace — Espresso — Filter — Cold Brew — Pastry — Workspace — Espresso
            </div>
        </div>
      </div>
      <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>

      {/* Menu Section */}
      <section id="menu" className="py-40 px-8 border-b border-black/5 bg-white relative z-20">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-24">
            
            {/* Left: Title & Sticky Preview */}
            <div className="lg:w-5/12 h-fit lg:h-screen lg:sticky lg:top-0 flex flex-col pt-12">
                <div className="mb-12">
                    <h2 className="font-display text-6xl font-normal tracking-tight mb-2">Manifest</h2>
                    <div className="h-[1px] w-12 bg-black mb-4 mt-2"></div>
                    <p className="font-mono text-[10px] text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
                        Vol. 02<br/>
                        2025 Collection
                    </p>
                </div>

                <div className="hidden lg:block relative w-full aspect-[4/5] bg-gray-100 overflow-hidden mt-auto mb-32">
                   {/* We render all images and fade them in/out based on active state */}
                   {Object.keys(menuImages).map((key) => (
                      <img 
                        key={key}
                        src={menuImages[key]} 
                        className={`absolute top-0 left-0 w-full h-full object-cover grayscale transition-opacity duration-500 ${activeMenuImage === key ? 'opacity-100' : 'opacity-0'}`} 
                        alt="Menu Preview" 
                      />
                   ))}
                </div>
            </div>

            {/* Right: Items */}
            <div className="lg:w-7/12 space-y-20 lg:pt-12">
                
                {/* Black Coffee */}
                <div className="space-y-12" onMouseEnter={() => setActiveMenuImage('black')}>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-8 border-b border-black/10 pb-4">
                        01 — Black Coffee
                    </div>
                    {[
                        { name: "Double Espresso", price: "4.50", desc: "Ethiopian Guji — Notes of jasmine & apricot." },
                        { name: "Long Black", price: "5.00", desc: "Double shot over hot water." },
                        { name: "Batch Brew", price: "6.00", desc: "Rotating single origin. Bottomless." }
                    ].map((item, i) => (
                        <div key={i} className="menu-item-anim group cursor-pointer" onClick={() => handleOpenReceipt(item.name, item.price)}>
                            <div className="flex justify-between items-baseline mb-2 relative">
                                <h3 className="font-display text-4xl font-light group-hover:translate-x-4 transition-transform duration-500">{item.name}</h3>
                                <span className="font-mono text-sm relative z-10 bg-white pl-4">{item.price}</span>
                                <div className="absolute bottom-2 left-0 w-full border-b border-dotted border-black/20 -z-0"></div>
                            </div>
                            <p className="font-sans text-sm text-gray-500 font-light pl-1">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* White Coffee */}
                <div className="space-y-12" onMouseEnter={() => setActiveMenuImage('white')}>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-8 border-b border-black/10 pb-4">
                        02 — White Coffee
                    </div>
                    {[
                        { name: "Flat White", price: "5.50", desc: "Oat / Almond / Dairy." },
                        { name: "Piccolo", price: "4.80", desc: "Strong & Short." }
                    ].map((item, i) => (
                        <div key={i} className="menu-item-anim group cursor-pointer" onClick={() => handleOpenReceipt(item.name, item.price)}>
                            <div className="flex justify-between items-baseline mb-2 relative">
                                <h3 className="font-display text-4xl font-light group-hover:translate-x-4 transition-transform duration-500">{item.name}</h3>
                                <span className="font-mono text-sm relative z-10 bg-white pl-4">{item.price}</span>
                                <div className="absolute bottom-2 left-0 w-full border-b border-dotted border-black/20 -z-0"></div>
                            </div>
                            <p className="font-sans text-sm text-gray-500 font-light pl-1">{item.desc}</p>
                        </div>
                    ))}
                </div>

                 {/* Signature */}
                 <div className="space-y-12" onMouseEnter={() => setActiveMenuImage('signature')}>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-8 border-b border-black/10 pb-4">
                        03 — Signature
                    </div>
                    {[
                        { name: "Espresso Tonic", price: "7.50", desc: "Double shot, fever tree tonic, rosemary, grapefruit zest." },
                        { name: "Nitro Cold Brew", price: "6.50", desc: "Velvet texture, single origin, served without ice." },
                        { name: "Affogato", price: "8.00", desc: "Vanilla bean gelato drowned in espresso." }
                    ].map((item, i) => (
                        <div key={i} className="menu-item-anim group cursor-pointer" onClick={() => handleOpenReceipt(item.name, item.price)}>
                            <div className="flex justify-between items-baseline mb-2 relative">
                                <h3 className="font-display text-4xl font-light group-hover:translate-x-4 transition-transform duration-500">{item.name}</h3>
                                <span className="font-mono text-sm relative z-10 bg-white pl-4">{item.price}</span>
                                <div className="absolute bottom-2 left-0 w-full border-b border-dotted border-black/20 -z-0"></div>
                            </div>
                            <p className="font-sans text-sm text-gray-500 font-light pl-1">{item.desc}</p>
                        </div>
                    ))}
                </div>

                 {/* Food */}
                 <div className="space-y-12" onMouseEnter={() => setActiveMenuImage('food')}>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-8 border-b border-black/10 pb-4">
                        04 — Provisions
                    </div>
                    {[
                        { name: "Pain au Chocolat", price: "6.00", desc: "Valrhona chocolate, layered butter pastry." },
                        { name: "Avocado Tartine", price: "14.00", desc: "Sourdough, chili oil, microgreens, poached egg." },
                        { name: "Yuzu Lemon Tart", price: "9.50", desc: "Torched meringue, yuzu curd, shortcrust." }
                    ].map((item, i) => (
                        <div key={i} className="menu-item-anim group cursor-pointer" onClick={() => handleOpenReceipt(item.name, item.price)}>
                            <div className="flex justify-between items-baseline mb-2 relative">
                                <h3 className="font-display text-4xl font-light group-hover:translate-x-4 transition-transform duration-500">{item.name}</h3>
                                <span className="font-mono text-sm relative z-10 bg-white pl-4">{item.price}</span>
                                <div className="absolute bottom-2 left-0 w-full border-b border-dotted border-black/20 -z-0"></div>
                            </div>
                            <p className="font-sans text-sm text-gray-500 font-light pl-1">{item.desc}</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
      </section>

      {/* Focus State */}
      <section id="space" className="w-full relative overflow-hidden">
        <div className="h-[85vh] w-full relative">
            <img 
                src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" 
                className="reveal-img absolute inset-0 w-full h-[120%] object-cover grayscale" 
                data-speed="0.5"
                alt="Workspace"
            />
            <div className="absolute inset-0 bg-black/5"></div>
            
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white mix-blend-difference z-10">
                <h2 className="font-display text-[15vw] font-normal tracking-tight leading-none opacity-90">FOCUS<br/>STATE</h2>
                <div className="mt-12 font-mono border border-white/30 px-6 py-2 text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm">
                    Vibe: Minimal
                </div>
            </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-32 px-8 bg-[#f2f2f2] border-b border-black/5">
        <div className="max-w-screen-2xl mx-auto grid md:grid-cols-2 gap-24">
            
            <div className="space-y-6 md:pt-20">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-200">
                    <img src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1887&auto=format&fit=crop" 
                         className="reveal-img w-full h-[120%] object-cover grayscale hover:grayscale-0 transition-all duration-1000" 
                         data-speed="1.1"
                         alt="Latte Art" />
                </div>
                <div className="flex justify-between items-start pt-2">
                    <h3 className="font-display text-3xl font-light">Morning Ritual</h3>
                    <span className="font-mono text-[10px] tracking-widest pt-2">002</span>
                </div>
                <p className="text-sm font-light text-gray-500 leading-relaxed max-w-xs">
                    Fresh roasted twice daily. The perfect companion to your dopamine hit.
                </p>
            </div>

            <div className="space-y-6">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-200">
                    <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop" 
                         className="reveal-img w-full h-[120%] object-cover grayscale hover:grayscale-0 transition-all duration-1000" 
                         data-speed="1.1"
                         alt="Interior" />
                </div>
                <div className="flex justify-between items-start pt-2">
                    <h3 className="font-display text-3xl font-light">Work Mode</h3>
                    <span className="font-mono text-[10px] tracking-widest pt-2">003</span>
                </div>
                <p className="text-sm font-light text-gray-500 leading-relaxed max-w-xs">
                    A sanctuary for deep work. No distractions, just caffeine and geometry.
                </p>
            </div>

        </div>
      </section>

      {/* Atmosphere Section */}
      <section id="atmosphere" className="py-32 px-8 border-b border-black/5">
        <div className="max-w-screen-2xl mx-auto">
             <div className="mb-16 flex justify-between items-end">
                <h2 className="font-display text-6xl font-normal tracking-tight">Atmosphere</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Elements & Texture</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                {[
                    "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?q=80&w=1888&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1621255755146-29e58e6e5894?q=80&w=1921&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1937&auto=format&fit=crop"
                ].map((src, i) => (
                    <div key={i} className={`relative aspect-[2/3] group overflow-hidden bg-gray-100 ${i === 1 ? 'md:mt-24' : ''}`}>
                         <img src={src} 
                              className="reveal-img w-full h-[120%] object-cover grayscale transition-all duration-700 group-hover:scale-105" 
                              data-speed="1.05"
                              alt={`Detail ${i+1}`} />
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="info" className="bg-[#f2f2f2] px-8 pt-32 pb-12 border-t border-black/5">
        <div className="max-w-screen-2xl mx-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-32 font-sans text-sm font-light leading-relaxed text-gray-600">
                <div className="md:col-span-1">
                    <h4 className="font-display font-medium text-black text-2xl mb-4">BUREAU©</h4>
                    <p className="text-xs opacity-50">© 2025 IMPOSSIBLE GROUP</p>
                </div>

                <div>
                    <h5 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black mb-6">Location</h5>
                    <p>142 Brutalist Ave,<br/>Level 1, Suite 4<br/>Metropolis, NY 10012</p>
                </div>

                <div>
                    <h5 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black mb-6">Hours</h5>
                    <div className="flex justify-between max-w-[200px] mb-2">
                        <span>Mon — Fri</span>
                        <span>07:00 — 19:00</span>
                    </div>
                    <div className="flex justify-between max-w-[200px]">
                        <span>Sat — Sun</span>
                        <span>08:00 — 15:00</span>
                    </div>
                </div>

                <div>
                    <h5 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black mb-6">Connect</h5>
                    <ul className="space-y-3">
                        <li><a href="#" className="hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5">Instagram</a></li>
                        <li><a href="#" className="hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5">Email Us</a></li>
                        <li><a href="#" className="hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5">Jobs</a></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-black/5 pt-12">
                <h1 className="font-display text-[18vw] leading-none tracking-tighter text-black/5 select-none pointer-events-none text-center mix-blend-multiply">
                    BUREAU
                </h1>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;