import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
    Keyboard, 
    Users, 
    GraduationCap, 
    Activity, 
    Trophy, 
    Download, 
    RotateCcw, 
    ArrowRight, 
    CheckCircle2, 
    Zap, 
    X,
    Sun,
    Moon,
    ShieldCheck
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { playErrorSound, playSuccessSound } from '../utils/soundUtils';

const QUICK_TEST_TEXTS = [
    "The tactile resistance of mechanical switches provides instantaneous tactile feedback that sharpens focus and enhances typing velocity.",
    "Mastering touch typing requires consistent muscle memory, proper finger posture on the home row, and relaxed, rhythmic keystrokes.",
    "True speed comes from fluid accuracy rather than frantic haste; every precise character typed builds steady mechanical rhythm."
];

export default function Landing() {
    const navigate = useNavigate();
    const [showAuth, setShowAuth] = useState(false);
    const [showDownloadCard, setShowDownloadCard] = useState(false);
    const [isDark, setIsDark] = useState(true);

    // Quick Interactive Typing Test State
    const [testDuration, setTestDuration] = useState(15);
    const [currentTextIdx, setCurrentTextIdx] = useState(0);
    const [testText, setTestText] = useState(QUICK_TEST_TEXTS[0]);
    const [userInput, setUserInput] = useState('');
    const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'typing' | 'finished'
    const [timeLeft, setTimeLeft] = useState(15);
    const [testWPM, setTestWPM] = useState(0);
    const [testAccuracy, setTestAccuracy] = useState(100);

    const inputRef = useRef(null);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Redirect authenticated users directly to dashboard
    useEffect(() => {
        document.title = "TypeMaster — Free Typing Speed Test & Touch Typing Academy";
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/dashboard');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Track Theme
    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.querySelector('.dark') !== null);
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        const wrapper = document.querySelector('.dark') || document.querySelector('.light') || document.documentElement;
        if (wrapper) {
            observer.observe(wrapper, { attributes: true, attributeFilter: ['class'] });
        }
        return () => observer.disconnect();
    }, []);

    // Timer logic for quick test
    useEffect(() => {
        if (testStatus === 'typing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        finishQuickTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [testStatus]);

    const handleDurationChange = (d) => {
        setTestDuration(d);
        setTimeLeft(d);
        resetQuickTest(d);
    };

    const resetQuickTest = (overrideDuration) => {
        clearInterval(timerRef.current);
        setUserInput('');
        setTestStatus('idle');
        const dur = overrideDuration || testDuration;
        setTimeLeft(dur);
        setTestWPM(0);
        setTestAccuracy(100);
        const nextIdx = (currentTextIdx + 1) % QUICK_TEST_TEXTS.length;
        setCurrentTextIdx(nextIdx);
        setTestText(QUICK_TEST_TEXTS[nextIdx]);
        if (inputRef.current) inputRef.current.focus();
    };

    const finishQuickTest = () => {
        setTestStatus('finished');
        clearInterval(timerRef.current);

        const elapsedSec = Math.max(1, testDuration - timeLeft);
        const correctChars = userInput.split('').filter((c, i) => c === testText[i]).length;
        const calcWpm = Math.round((correctChars / 5) / (elapsedSec / 60));
        const calcAcc = userInput.length > 0 
            ? Math.round((correctChars / userInput.length) * 100) 
            : 100;

        setTestWPM(calcWpm);
        setTestAccuracy(calcAcc);
        playSuccessSound();
    };

    const handleInputChange = (e) => {
        if (testStatus === 'finished') return;
        const val = e.target.value;

        if (testStatus === 'idle' && val.length > 0) {
            setTestStatus('typing');
            startTimeRef.current = Date.now();
        }

        if (val.length <= testText.length) {
            const prevLen = userInput.length;
            if (val.length > prevLen) {
                const typedChar = val[val.length - 1];
                const expected = testText[val.length - 1];
                if (typedChar !== expected) {
                    playErrorSound();
                }
            }
            setUserInput(val);

            if (val.length === testText.length) {
                finishQuickTest();
            }
        }
    };

    // Calculate live WPM during typing
    const liveWpm = testStatus === 'typing' && startTimeRef.current
        ? Math.max(0, Math.round((userInput.split('').filter((c, i) => c === testText[i]).length / 5) / ((Date.now() - startTimeRef.current) / 60000)))
        : testStatus === 'finished' ? testWPM : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20 flex flex-col transition-colors duration-300">
            {/* Top Navigation */}
            <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-20">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all shadow-sm">
                        <Keyboard className="w-5 h-5" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Type<span className="text-primary font-black">Master</span>
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Link to="/multiplayer" className="hover:text-primary transition-colors">Multiplayer</Link>
                    <Link to="/academy" className="hover:text-primary transition-colors">Academy</Link>
                    <Link to="/daily" className="hover:text-primary transition-colors">Daily Challenge</Link>
                    <Link to="/practice" className="hover:text-primary transition-colors">Key Practice</Link>
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.toggleNeuralTheme && window.toggleNeuralTheme()}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                        title="Toggle theme"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    
                    <button 
                        onClick={() => setShowAuth(true)}
                        className="px-5 py-2.5 rounded-xl bg-primary text-white dark:text-slate-950 font-semibold text-xs tracking-wider uppercase hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                        Sign In
                    </button>
                </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center text-center">
                
                {/* Hero Header */}
                <div className="max-w-3xl space-y-4 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-primary">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Interactive Typing Benchmark · v2.4</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                        Master touch typing with mechanical precision.
                    </h1>

                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed">
                        Test your finger velocity, eliminate key latency, and race against live typists worldwide with physical keyboard feel.
                    </p>
                </div>

                {/* Tactile Live Typing Playground (The Hero Centerpiece) */}
                <div className="w-full max-w-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 dark:shadow-black/40 relative overflow-hidden text-left mb-12">
                    
                    {/* Top Control Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                        {/* Duration Selector */}
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
                            {[15, 30, 60].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => handleDurationChange(d)}
                                    disabled={testStatus === 'typing'}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        testDuration === d
                                            ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {d}s
                                </button>
                            ))}
                        </div>

                        {/* Live Telemetry Display */}
                        <div className="flex items-center gap-6 font-mono text-sm">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[11px] text-slate-400 uppercase font-sans">Speed</span>
                                <span className="font-bold text-slate-900 dark:text-white text-base">{liveWpm}</span>
                                <span className="text-[10px] text-slate-400">WPM</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[11px] text-slate-400 uppercase font-sans">Time</span>
                                <span className={`font-bold text-base ${timeLeft <= 3 && testStatus === 'typing' ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                                    {timeLeft}s
                                </span>
                            </div>
                            <button
                                onClick={() => resetQuickTest()}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                                title="Restart test"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Interactive Text Display & Hidden Input */}
                    <div 
                        className="py-8 min-h-[160px] relative cursor-text select-none"
                        onClick={() => inputRef.current && inputRef.current.focus()}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={handleInputChange}
                            disabled={testStatus === 'finished'}
                            className="absolute opacity-0 pointer-events-none"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            autoFocus
                        />

                        {testStatus !== 'finished' ? (
                            <div className="text-xl md:text-2xl font-mono leading-relaxed tracking-tight">
                                {testText.split('').map((char, index) => {
                                    let colorClass = "text-slate-400 dark:text-slate-600";
                                    if (index < userInput.length) {
                                        colorClass = userInput[index] === char 
                                            ? "text-primary font-medium" 
                                            : "text-red-500 bg-red-500/10 rounded-xs";
                                    }
                                    const isCursor = index === userInput.length;

                                    return (
                                        <span key={index} className="relative transition-colors duration-75">
                                            {isCursor && (
                                                <span className="absolute -left-[1px] top-0 h-full w-[2px] bg-primary animate-pulse" />
                                            )}
                                            {char}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Test Result Screen */
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 animate-in fade-in duration-300">
                                <div>
                                    <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
                                        <CheckCircle2 className="w-4 h-4" /> Test Complete
                                    </div>
                                    <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white font-mono">
                                        {testWPM} <span className="text-sm font-sans font-medium text-slate-500">WPM</span>
                                        <span className="mx-3 text-slate-300 dark:text-slate-700">|</span>
                                        {testAccuracy}% <span className="text-sm font-sans font-medium text-slate-500">Accuracy</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Solid baseline. Ready to challenge live opponents or train your weakest keys?
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => resetQuickTest()}
                                        className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => navigate('/multiplayer')}
                                        className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-primary text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        Race Players <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Prompt Hint */}
                    {testStatus === 'idle' && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Start typing to begin benchmark immediately
                            </span>
                            <span className="font-mono text-[11px] hidden sm:inline">No account required</span>
                        </div>
                    )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-20">
                    <button
                        onClick={() => navigate('/multiplayer')}
                        className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-primary text-white dark:text-slate-950 font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Users className="w-4 h-4" />
                        <span>Enter Multiplayer Arena</span>
                    </button>

                    <button
                        onClick={() => setShowDownloadCard(true)}
                        className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>Get Desktop App</span>
                    </button>
                </div>

                {/* Four Core Features (Tactile Keycap Cards) */}
                <div className="w-full text-left mb-20">
                    <div className="mb-8 text-center max-w-xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Engineered for purposeful typing progression.
                        </h2>
                        <p className="text-sm text-slate-500 mt-2">
                            Every drill, race, and telemetry metric is built to systematically build fluid muscle memory.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Feature 1 */}
                        <div 
                            onClick={() => navigate('/multiplayer')}
                            className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    Live 1v1 & Rooms
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">
                                Real-Time Multiplayer Racing
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                Challenge friends or global typists in server-authoritative rooms. Supports custom room codes, spectator views, and both timed and target-length race modes.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div 
                            onClick={() => navigate('/academy')}
                            className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                    <GraduationCap className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    14 Guided Stages
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">
                                Touch Typing Academy
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                Master touch typing without looking down. Step-by-step interactive stages with virtual hand guides that highlight exact finger-to-key placements.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div 
                            onClick={() => navigate('/practice')}
                            className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    Key Heatmap
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">
                                Weak-Key Latency Heatmap
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                Visual keyboard telemetry records exact keystroke latency down to the millisecond. Pinpoint your slowest transitions and practice them directly.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div 
                            onClick={() => navigate('/daily')}
                            className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    Daily Competition
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-2">
                                Daily Challenge & Ghost Vault
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                One synchronized daily paragraph for all players. Archive your best runs to your personal Vault, or race against champion ghost replays keystroke-by-keystroke.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Minimalist Desktop Native Showcase */}
                <div className="w-full bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 text-left mb-16 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-3 max-w-lg">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                            <ShieldCheck className="w-4 h-4" /> Native Windows Client
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Raw hardware polling. Zero browser throttling.
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                            For competitive racers who demand absolute precision detached from browser thread lag. Experience unthrottled keyboard interrupts and offline practice modes.
                        </p>
                    </div>

                    <a 
                        href="https://github.com/mohamed-abdullah-801564/type-race-webapp/releases/latest"
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0 shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span>Download for Windows</span>
                    </a>
                </div>

                {/* Generative Search & Platform Definition (GEO / AI Citability Section) */}
                <section aria-label="About TypeMaster" className="w-full text-left bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 mb-16 shadow-xs">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                        About TypeMaster Typing Speed Test & Touch Typing Academy
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                        TypeMaster is a modern, real-time typing platform built to measure typing velocity (Words Per Minute) and systematically develop touch typing mastery. Designed for typists, software engineers, and competitive racers, the platform blends live WebSocket multiplayer races with an interactive 16-module curriculum featuring anatomical hand guides and strict finger positioning. Unlike generic typing tutors, TypeMaster records character-level latency and keystroke telemetry to map your individual weak keys on an interactive keyboard heatmap. Typists can isolate problem transitions with custom balloon reflex drills, practice real-world programming syntax in JavaScript and Python, or compete on synchronized daily challenges. With under 50ms room synchronization and local ghost runner playback, TypeMaster provides an uncompromised mechanical typing environment to build muscle memory and break speed plateaus.
                    </p>
                </section>

                {/* Clean Footer */}
                <footer className="w-full pt-8 pb-12 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div>
                        © {new Date().getFullYear()} TypeMaster · High-Precision Touch Typing Benchmark
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/solo" className="hover:text-primary transition-colors">Solo Practice</Link>
                        <Link to="/academy" className="hover:text-primary transition-colors">Academy</Link>
                        <Link to="/multiplayer" className="hover:text-primary transition-colors">Multiplayer</Link>
                        <a 
                            href="https://github.com/mohamed-abdullah-801564/type-race-webapp" 
                            target="_blank" 
                            rel="noreferrer"
                            className="hover:text-primary transition-colors"
                        >
                            GitHub
                        </a>
                    </div>
                </footer>
            </main>

            {/* Auth Modal Trigger */}
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLoginSuccess={() => setShowAuth(false)} />}

            {/* Download Modal Trigger */}
            {showDownloadCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                        <button 
                            onClick={() => setShowDownloadCard(false)} 
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-5 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <Keyboard className="w-6 h-6" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    TypeMaster Desktop
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    High-precision desktop client for Windows 10/11
                                </p>
                            </div>

                            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-600 dark:text-slate-300">
                                <div className="flex items-start gap-2.5">
                                    <span className="text-primary font-bold">✓</span>
                                    <span>Detached lightweight client with zero browser thread delay</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="text-primary font-bold">✓</span>
                                    <span>Raw keyboard input polling for exact millisecond latency</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="text-primary font-bold">✓</span>
                                    <span>Full offline practice with local ghost telemetry playback</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <a 
                                    href="https://github.com/mohamed-abdullah-801564/type-race-webapp/releases/latest"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-3.5 bg-primary text-white dark:text-slate-950 font-semibold rounded-xl text-center text-xs tracking-wider uppercase hover:opacity-90 transition-opacity shadow-sm"
                                >
                                    Download Installer (.exe)
                                </a>
                                <button 
                                    onClick={() => setShowDownloadCard(false)}
                                    className="w-full py-3 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium text-xs transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
