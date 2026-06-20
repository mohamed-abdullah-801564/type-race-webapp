import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import useToast from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { checkAchievements, saveAchievements, buildStatsForAchievements } from '../utils/achievementUtils';
import { launchConfetti } from '../utils/confettiUtils';
import { 
    Zap, 
    RotateCcw, 
    Code, 
    FileText, 
    Skull, 
    Ghost, 
    Activity, 
    Cpu, 
    Play, 
    Settings,
    ChevronRight,
    Terminal,
    Shield,
    BarChart2,
    UserCircle,
    Trophy
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileBanner from '../components/MobileBanner';
import { auth, db } from '../firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { loadData, saveData } from '../utils/storageUtils';
import { syncToLeaderboard, syncCrucialData, updateWeakKeys } from '../utils/firebaseUtils';
import { generateSmartDrill, ACADEMY_MODULES } from '../utils/typingUtils';
import { recordKeyLatency, isTrackableKey } from '../utils/heatmapUtils';
import { playErrorSound, playSuccessSound } from '../utils/soundUtils';


const PROSE_SAMPLES = [
    "The dawn of artificial intelligence marks a pivotal transformation in human history, mirroring the industrial revolution in its scope and influence. As we integrate neural networks into our daily lives, the boundary between biological and synthetic intelligence begins to blur. This era demands a new understanding of consciousness and the ethical implications of creating thinking machines that may one day surpass their creators in both logic and intuition.",
    "In the deep silence of the digital void, millions of packets traverse the global infrastructure at the speed of light. Each byte represents a fragmented thought, a transaction of value, or a whisper of a secret shared across continents. We are the architects of this invisible architecture, building bridges of silicon and fiber optic cables that sustain the weight of modern civilization's collective knowledge and memory.",
    "The art of programming is often compared to poetry, where every character must serve a purpose and every line must flow with an internal logic. A well-crafted function is a masterpiece of efficiency, solving complex problems with the elegance of a mathematical proof. To master the keyboard is to speak the language of the future, commanding legions of transistors to perform tasks that were once considered the domain of magic."
];

const CODE_SAMPLES = [
    "async function synchronizeNeuralState(endpoint, localBuffer) {\n    const response = await fetch(endpoint, {\n        method: 'POST',\n        body: JSON.stringify({ state: localBuffer }),\n        headers: { 'Content-Type': 'application/json' }\n    });\n\n    if (!response.ok) throw new Error('Neural Sync Interrupted');\n    return await response.json();\n}",
    "export default function useFocusMode(isActive) {\n    const [opacity, setOpacity] = useState(1.0);\n\n    useEffect(() => {\n        if (isActive) {\n            const timer = setTimeout(() => setOpacity(0.1), 100);\n            return () => clearTimeout(timer);\n        }\n        setOpacity(1.0);\n    }, [isActive]);\n\n    return opacity;\n}",
    "const quickSort = (arr) => {\n    if (arr.length <= 1) return arr;\n    const pivot = arr[arr.length - 1];\n    const left = arr.filter(x => x < pivot);\n    const right = arr.filter(x => x > pivot);\n    return [...quickSort(left), pivot, ...quickSort(right)];\n};"
];

export default function SoloMode() {
    const location = useLocation();
    const navigate = useNavigate();
    const { toasts, addToast, removeToast } = useToast();

    // Configuration State
    const [showConfig, setShowConfig] = useState(true);
    const [stream, setStream] = useState('prose'); // 'prose' or 'code'
    const [duration, setDuration] = useState(30); // 30, 60, 120
    const [mode, setMode] = useState('time'); // 'time' or 'length'
    const [targetLines, setTargetLines] = useState(5); // 5, 10, 15, 20
    const [elapsedTime, setElapsedTime] = useState(0);

    // Racing State
    const [text, setText] = useState('');
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState('waiting'); // waiting, typing, finished
    
    // Autofocus input on waiting
    useEffect(() => {
        if (status === 'waiting' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [status]);

    // Auth State Cleanup: Reset state on user switch
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                // Not logged in or logged out
                setFinalWPM(0);
                setUserInput('');
                setStatus('waiting');
                setKeystrokes([]);
                setGhostData([]);
                setGhostName(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Inject Daily Drill Text or Ghost Data if present
    useEffect(() => {
        if (location.state?.text) {
            setText(location.state.text);
            setShowConfig(false);
            setStatus('waiting');
        }
    }, [location.state]);

    const [finalWPM, setFinalWPM] = useState(0);
    const [finalAcc, setFinalAcc] = useState(100);
    const [academyUnlocked, setAcademyUnlocked] = useState(false);
    const [isFailed, setIsFailed] = useState(false);
    const [errorMap, setErrorMap] = useState({});
    const [keystrokes, setKeystrokes] = useState([]);
    const [timeLeft, setTimeLeft] = useState(30);

    // Ghost State
    const [ghostData, setGhostData] = useState([]);
    const [ghostIndex, setGhostIndex] = useState(0);
    const [ghostName, setGhostName] = useState(null);

    const userInputRef = useRef("");
    userInputRef.current = userInput;
    const backspacePressedRef = useRef(false);


    const inputRef = useRef(null);
    const startTimeRef = useRef(null);
    const endTimeRef = useRef(null);
    const lastKeystrokeTimeRef = useRef(null);
    const lastKeystrokeTimestampRef = useRef(null);
    const timerRef = useRef(null);
    const errorMapRef = useRef({});

    // Initial Ghost Check (from Vault)
    useEffect(() => {
        if (location.state?.isGhostChallenge) {
            const gd = location.state.ghostData || [];
            if (gd.length > 0) {
                const firstTime = gd[0]?.time || 0;
                const normalizedGhost = gd.map(k => ({ ...k, time: Math.max(0, k.time - firstTime) }));
                setGhostData(normalizedGhost);
                setText(location.state.text || "");
                setGhostName(location.state.ghostName || "Neural Specter");
                setShowConfig(false);
                const ghostTimeInSec = Math.ceil(normalizedGhost[normalizedGhost.length - 1].time / 1000);
                const bufferedTime = ghostTimeInSec + 30;
                setTimeLeft(bufferedTime);
                setDuration(bufferedTime);
            }
        } else if (location.state?.isAcademy) {
            const text = location.state.text || "";
            const academyDuration = location.state.duration || Math.max(30, Math.ceil(text.length / 3));
            setTimeLeft(academyDuration);
            setDuration(academyDuration);
            setText(text);
            setGhostName(null);
            setShowConfig(false);
        }
    }, [location.state]);

    // Timer Logic
    useEffect(() => {
        if (status === 'typing') {
            if (mode === 'time') {
                timerRef.current = setInterval(() => {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            endTimeRef.current = Date.now();
                            setStatus('finished');
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                // Length mode: count up, no time limit
                timerRef.current = setInterval(() => {
                    setElapsedTime(prev => prev + 1);
                }, 1000);
            }
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [status, mode]);

    // Ghost Pacer Logic
    useEffect(() => {
        let animationFrame;
        if (status === 'typing' && ghostData.length > 0) {
            const animate = () => {
                // Guard: startTimeRef may not be set yet on very first frame
                if (!startTimeRef.current) {
                    animationFrame = requestAnimationFrame(animate);
                    return;
                }
                const elapsed = Date.now() - startTimeRef.current;
                // Find the last keystroke whose timestamp has already passed
                let index = 0;
                for (let i = 0; i < ghostData.length; i++) {
                    if (ghostData[i].time <= elapsed) {
                        index = i + 1;
                    } else {
                        break;
                    }
                }
                setGhostIndex(index);
                animationFrame = requestAnimationFrame(animate);
            };
            animationFrame = requestAnimationFrame(animate);
        } else {
            setGhostIndex(0);
        }
        return () => cancelAnimationFrame(animationFrame);
    }, [status, ghostData]);

    const handleInputChange = (e) => {
        if (status === 'finished' || isFailed) return;

        const val = e.target.value;
        const now = Date.now();

        if (status === 'waiting' && val.length > 0) {
            setStatus('typing');
            startTimeRef.current = now;
        }

        if (val.length <= text.length) {
            const prevLength = userInput.length;
            
            // Record Keystroke for Ghost
            if (val.length > prevLength && startTimeRef.current) {
                const char = val[val.length - 1];
                const time = now - startTimeRef.current;
                setKeystrokes(prev => [...prev, { char, time }]);
            }

            // Error Detection
            if (val.length > prevLength) {
                const typedChar = val[val.length - 1];
                const expectedChar = text[val.length - 1];
                if (typedChar !== expectedChar) {
                    playErrorSound();
                    const key = expectedChar.toLowerCase();
                    setErrorMap(prev => {
                        const next = { ...prev, [key]: (prev[key] || 0) + 1 };
                        errorMapRef.current = next;
                        return next;
                    });
                }

                // Heatmap Tracking Logic
                const isCorrect = typedChar === expectedChar;
                if (isCorrect && isTrackableKey(typedChar)) {
                    if (lastKeystrokeTimeRef.current !== null) {
                        const latencyMs = now - lastKeystrokeTimeRef.current;
                        recordKeyLatency(typedChar, latencyMs);
                    }
                }
                lastKeystrokeTimeRef.current = now;
            }

            setUserInput(val);

            if (val.length === text.length) {
                setStatus('finished');
                endTimeRef.current = now;
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace') {
            backspacePressedRef.current = true;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            resetTest();
        }
        if (status === 'waiting' && e.key === ' ') {
            e.preventDefault();
            setStatus('typing');
            startTimeRef.current = Date.now();
            lastKeystrokeTimeRef.current = Date.now();
        }
    };

    const resetTest = () => {
        setUserInput('');
        setStatus('waiting');
        setIsFailed(false);
        setAcademyUnlocked(false);
        setTimeLeft(duration);
        setElapsedTime(0);
        setKeystrokes([]);
        setFinalAcc(100);
        setErrorMap({});
        errorMapRef.current = {};
        setGhostIndex(0);
        startTimeRef.current = null;
        endTimeRef.current = null;
        lastKeystrokeTimeRef.current = null;
        backspacePressedRef.current = false;
        if (inputRef.current) inputRef.current.focus();
    };

    const handleStartRace = () => {
        const samples = stream === 'prose' ? PROSE_SAMPLES : CODE_SAMPLES;
        if (mode === 'length') {
            const targetWordCount = targetLines * 12;
            let combined = '';
            while (combined.split(' ').filter(w => w.length > 0).length < targetWordCount) {
                combined += (combined ? ' ' : '') + samples[Math.floor(Math.random() * samples.length)];
            }
            const words = combined.split(' ').filter(w => w.length > 0).slice(0, targetWordCount);
            setText(words.join(' '));
        } else {
            setText(samples[Math.floor(Math.random() * samples.length)]);
        }
        setTimeLeft(duration);
        setElapsedTime(0);
        setShowConfig(false);
        resetTest();
    };

    const calculateAccuracy = () => {
        if (userInput.length === 0) return 100;
        const correctChars = userInput.split('').filter((char, i) => char === text[i]).length;
        return ((correctChars / userInput.length) * 100).toFixed(1);
    };

    const calculateWPM = () => {
        if (!startTimeRef.current) return 0;
        if (mode === 'length') {
            const seconds = Math.max(1, elapsedTime);
            const correctChars = userInput.split('').filter((char, i) => char === text[i]).length;
            return Math.round((correctChars / 5) / (seconds / 60));
        }
        const end = endTimeRef.current || Date.now();
        const elapsedMs = Math.max(1, end - startTimeRef.current);
        const elapsedSeconds = elapsedMs / 1000;
        const correctChars = userInput.split('').filter((char, i) => char === text[i]).length;
        return Math.round((correctChars / 5) / (elapsedSeconds / 60));
    };

    const getTopErrors = () => {
        const errors = Object.entries(errorMapRef.current)
            .map(([key, count]) => ({ key, count }))
            .sort((a, b) => b.count - a.count);
        return errors.length >= 3 ? errors.slice(0, 3) : [];
    };

    useEffect(() => {
        if (status === 'finished') {
            const rawWpm = calculateWPM();
            const safeWPM = Math.min(300, Math.max(0, rawWpm));
            const wpm = safeWPM;
            const acc = calculateAccuracy();
            const totalErrors = Object.values(errorMapRef.current).reduce((sum, count) => sum + count, 0);
            setFinalWPM(wpm);
            setFinalAcc(acc);

            // Only sync and save if it's a standard Solo Mode race
            if (!location.state?.isAcademy && !location.state?.isGhostChallenge) {
                // PB Logic
                const lastGhost = loadData('lastRunGhost');
                if (!lastGhost || wpm > (lastGhost.wpm || 0)) {
                    saveData('lastRunGhost', {
                        wpm,
                        accuracy: acc,
                        keystrokes,
                        text,
                        date: Date.now(),
                        stream
                    });
                }

                // History Logic
                const history = loadData('raceHistory') || [];
                const historyEntry = {
                    wpm,
                    accuracy: acc,
                    date: Date.now(),
                    stream,
                    mode: 'solo',
                    noBackspace: !backspacePressedRef.current
                };
                history.push(historyEntry);
                saveData('raceHistory', history.slice(-50));

                // Hybrid Data Strategy: Sync only crucial stats
                if (auth.currentUser) {
                    syncCrucialData(wpm, acc);
                    updateWeakKeys(errorMap);
                } else {
                    syncToLeaderboard(wpm, acc);
                }

                // Update last local update for sync icon
                localStorage.setItem('lastLocalUpdate', Date.now().toString());

                // Achievement Check Logic
                const stats = buildStatsForAchievements();
                const newAchievements = checkAchievements(stats);
                if (newAchievements.length > 0) {
                    saveAchievements(newAchievements);
                    newAchievements.forEach(a => {
                        addToast({ message: `${a.icon} ${a.title} — ${a.description}`, type: 'achievement' });
                    });

                    // Launch highest rarity confetti
                    const hasLegendary = newAchievements.some(a => a.rarity === 'legendary');
                    const hasRare = newAchievements.some(a => a.rarity === 'rare');
                    
                    if (hasLegendary) launchConfetti('legendary');
                    else if (hasRare) launchConfetti('rare');
                }
            }
            // Handle Academy Progression
            let failedAcademy = false;
            if (location.state?.isAcademy) {
                const requiredWPM = location.state?.minWPM || 20;
                const requiredAccuracy = location.state?.minAccuracy || 90;
                const allowedErrors = location.state?.maxErrors || 15;
                
                if (wpm >= requiredWPM && parseFloat(acc) >= requiredAccuracy && totalErrors <= allowedErrors) {
                    setAcademyUnlocked(true);
                    const progress = JSON.parse(localStorage.getItem('academyProgress') || '["mod_1"]');
                    const currentIndex = ACADEMY_MODULES.findIndex(m => m.id === location.state.moduleId);
                    
                    if (currentIndex !== -1) {
                        if (currentIndex < ACADEMY_MODULES.length - 1) {
                            const nextId = ACADEMY_MODULES[currentIndex + 1].id;
                            if (!progress.includes(nextId)) {
                                progress.push(nextId);
                                localStorage.setItem('academyProgress', JSON.stringify(progress));
                            }
                        } else if (currentIndex === ACADEMY_MODULES.length - 1) {
                            if (!progress.includes('academy_completed')) {
                                progress.push('academy_completed');
                                localStorage.setItem('academyProgress', JSON.stringify(progress));
                            }
                        }
                    }
                } else {
                    failedAcademy = true;
                    setIsFailed(true);
                }
            }

            if (!failedAcademy) {
                playSuccessSound();
            }
        }
    }, [status]);

    const isFocusMode = status === 'typing';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-700 dark:text-slate-300 font-sans selection:bg-primary/30 selection:text-primary flex flex-col overflow-hidden relative">
            <MobileBanner />
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] z-50" />
            
            <Navbar isFaded={isFocusMode} />

            <main className="flex-1 flex flex-col relative z-10 transition-all duration-500">
                {showConfig ? (
                    <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
                        <div className="max-w-xl w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 shadow-sm rounded-3xl p-6 md:p-10 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Terminal className="w-32 h-32 text-primary" />
                           </div>
                           
                           <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 flex items-center gap-4">
                                <Cpu className="w-10 h-10 text-primary animate-pulse" />
                                System Configuration
                           </h1>
                           <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-10 border-b border-slate-200 dark:border-white/5 pb-6">
                                Initializing Neural Pathway Protocol // Select Parameters
                           </p>
 
                           <div className="space-y-10">
                                <div>
                                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Data Stream Source</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setStream('prose')}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${stream === 'prose' ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-primary/20 dark:border-primary dark:text-white dark:shadow-[0_0_20px_rgba(0,245,212,0.2)]' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                        >
                                            <div className={`p-3 rounded-xl ${stream === 'prose' ? 'bg-primary text-black' : 'bg-slate-200 dark:bg-white/5'}`}>
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-lg text-slate-900 dark:text-white">Prose Matrix</div>
                                                <div className="text-sm opacity-60 font-semibold">Natural Language</div>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => setStream('code')}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${stream === 'code' ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-primary/20 dark:border-primary dark:text-white dark:shadow-[0_0_20px_rgba(0,245,212,0.2)]' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                        >
                                            <div className={`p-3 rounded-xl ${stream === 'code' ? 'bg-primary text-black' : 'bg-slate-200 dark:bg-white/5'}`}>
                                                <Code className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-lg text-slate-900 dark:text-white">Syntax Stream</div>
                                                <div className="text-sm opacity-60 font-semibold">React / JS Logic</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
 
                                {mode === 'time' && (
                                    <div>
                                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Session Duration (Seconds)</label>
                                        <div className="flex gap-4">
                                            {[30, 60, 120].map((d) => (
                                                <button 
                                                    key={d}
                                                    onClick={() => setDuration(d)}
                                                    className={`flex-1 py-3 md:py-4 rounded-xl border font-semibold text-lg transition-all ${duration === d ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-primary dark:text-black dark:border-primary dark:shadow-[0_0_15px_rgba(0,245,212,0.3)]' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
 
                                <div>
                                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Practice Mode</label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setMode('time')}
                                            className={`flex-1 py-3 md:py-4 rounded-xl border font-semibold text-base transition-all ${mode === 'time' ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-primary dark:text-black dark:border-primary dark:shadow-[0_0_15px_rgba(0,245,212,0.3)]' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                        >
                                            Time Based
                                        </button>
                                        <button
                                            onClick={() => setMode('length')}
                                            className={`flex-1 py-3 md:py-4 rounded-xl border font-semibold text-base transition-all ${mode === 'length' ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-primary dark:text-black dark:border-primary dark:shadow-[0_0_15px_rgba(0,245,212,0.3)]' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                        >
                                            Length Based
                                        </button>
                                    </div>
                                    {mode === 'length' && (
                                        <div className="flex gap-4 mt-4">
                                            {[5, 10, 15, 20].map((l) => (
                                                <button
                                                    key={l}
                                                    onClick={() => setTargetLines(l)}
                                                    className={`flex-1 py-3 md:py-4 rounded-xl border font-semibold text-lg transition-all ${targetLines === l ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-primary dark:text-black dark:border-primary dark:shadow-[0_0_15px_rgba(0,245,212,0.3)]' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                                >
                                                    {l}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
 
                                <button 
                                    onClick={handleStartRace}
                                    className="w-full py-6 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,245,212,0.4)] text-base md:text-lg"
                                >
                                    <Play className="w-6 h-6 fill-current" />
                                    Initialize Session
                                </button>
                           </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col p-8 max-w-6xl mx-auto w-full relative">
                        {/* Stats Banner */}
                        <div className={`flex justify-between items-end mb-12 transition-all duration-700 ease-in-out ${isFocusMode ? 'opacity-10 scale-[0.98]' : 'opacity-100'}`}>
                            <div className="flex flex-col">
                                {ghostName && (
                                    <div className="flex items-center gap-2 mb-2 text-yellow-500 animate-pulse font-mono">
                                        <Ghost className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Ghost Overlay: {ghostName}</span>
                                    </div>
                                )}
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">
                                    {location.state?.isAcademy ? `TRAINING PROTOCOL: ${location.state.academyTitle}` : 'Temporal Node'}
                                </span>
                                <div className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white font-mono leading-none flex items-baseline gap-2">
                                    {status === 'finished' ? finalWPM : (mode === 'length' ? elapsedTime : timeLeft)}
                                    <span className={`text-sm md:text-xl uppercase font-sans tracking-widest ${status === 'finished' ? 'text-primary/40' : mode === 'length' ? 'text-primary' : 'text-primary/40'}`}>
                                        {status === 'finished' ? 'WPM' : mode === 'length' ? 'Sec Elapsed' : 'Sec'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.4em] mb-1">Neural Precision</span>
                                <div className="text-3xl md:text-5xl font-bold text-slate-700 dark:text-slate-200 font-mono leading-none">
                                    {calculateAccuracy()}<span className="text-xl opacity-30">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Centered Typing Interface */}
                        <div className="flex-1 flex flex-col items-center justify-center mb-24 relative">
                            <div 
                                className={`w-full max-w-4xl p-4 md:p-12 bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-2xl relative transition-all duration-500 ${status === 'typing' ? 'scale-[1.05] bg-slate-50 dark:bg-white/5 border-slate-300 dark:border-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : ''}`}
                                onClick={() => inputRef.current?.focus()}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userInput}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className="absolute opacity-0 pointer-events-none"
                                />

                                <div className="text-base md:text-2xl font-mono leading-relaxed select-none relative z-10 tracking-tight">
                                    {text.split('').map((char, index) => {
                                        let colorClass = "text-slate-400 dark:text-slate-600";
                                        if (index < userInput.length) {
                                            colorClass = userInput[index] === char ? "text-slate-900 dark:text-primary" : "text-red-500 bg-red-500/10 rounded-sm";
                                        }
                                        const isCursor = index === userInput.length && status !== 'finished';
                                        const isGhost = ghostData.length > 0 && ghostData[ghostIndex] !== undefined && index === ghostIndex && status === 'typing';

                                        return (
                                            <span key={index} className="relative">
                                                {isCursor && (
                                                    <span className="absolute left-0 h-full w-[2px] bg-primary shadow-[0_0_15px_#00f5d4] animate-pulse" />
                                                )}
                                                {isGhost && (
                                                    <span className="absolute left-0 h-full w-[2px] bg-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all duration-100" />
                                                )}
                                                <span className={`${colorClass} transition-colors duration-150`}>{char}</span>
                                            </span>
                                        );
                                    })}
                                </div>

                                {status === 'waiting' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 backdrop-blur-[2px] rounded-2xl md:rounded-[40px] pointer-events-none">
                                        <div className="flex flex-col items-center gap-4 animate-pulse">
                                            <div className="flex items-center gap-8 text-primary/30">
                                                <div className="h-px w-24 bg-linear-to-r from-transparent to-primary/20" />
                                                <Activity className="w-8 h-8" />
                                                <div className="h-px w-24 bg-linear-to-l from-transparent to-primary/20" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">Initiate Input Sequence</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {status === 'waiting' && (
                                <div className="mt-4 text-center animate-pulse">
                                    <span className="text-xs font-mono tracking-wider text-slate-500 dark:text-slate-400">
                                        neural connection established — tap SPACE key to initialize terminal sync
                                    </span>
                                </div>
                            )}

                            {academyUnlocked && (
                                <div className="mt-8 p-6 bg-primary/10 border border-primary/30 rounded-3xl animate-in fade-in zoom-in duration-500">
                                    <div className="flex items-center gap-4 text-primary">
                                        <div className="bg-primary text-black p-2 rounded-lg shadow-[0_0_15px_rgba(0,245,212,0.5)]">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Module Complete!</h3>
                                            <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Next Protocol Unlocked in Central Hub</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {isFailed && status === 'finished' && (
                                <div className="mt-8 w-full max-w-2xl bg-red-950/30 border-2 border-red-500/30 rounded-3xl p-10 animate-in fade-in zoom-in duration-500">
                                    {/* Header Section */}
                                    <div className="flex items-center gap-4 mb-2">
                                        <Skull className="text-red-400 w-8 h-8" />
                                        <h3 className="text-2xl font-black text-red-400 uppercase italic tracking-tighter">PROTOCOL FAILURE</h3>
                                    </div>
                                    <p className="text-sm text-red-400/60 font-bold uppercase tracking-widest mb-8">
                                        Performance parameters not met. Review your stats below.
                                    </p>

                                    {/* Stats Comparison Grid */}
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        {/* Speed Metric */}
                                        <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center gap-2">
                                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Speed</span>
                                            <div className={`text-3xl font-black font-mono ${finalWPM >= (location.state?.minWPM || 20) ? 'text-primary' : 'text-red-400'}`}>
                                                {finalWPM}
                                            </div>
                                            <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-tight">Required: {location.state?.minWPM || 20}</span>
                                        </div>

                                        {/* Accuracy Metric */}
                                        <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center gap-2">
                                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Accuracy</span>
                                            <div className={`text-3xl font-black font-mono ${parseFloat(finalAcc) >= (location.state?.minAccuracy || 90) ? 'text-primary' : 'text-red-400'}`}>
                                                {finalAcc}%
                                            </div>
                                            <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-tight">Required: {location.state?.minAccuracy || 90}%</span>
                                        </div>

                                        {/* Errors Metric */}
                                        <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center gap-2">
                                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Errors</span>
                                            <div className={`text-3xl font-black font-mono ${Object.values(errorMapRef.current).reduce((sum, count) => sum + count, 0) <= (location.state?.maxErrors || 15) ? 'text-primary' : 'text-red-400'}`}>
                                                {Object.values(errorMapRef.current).reduce((sum, count) => sum + count, 0)}
                                            </div>
                                            <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-tight">Required: {location.state?.maxErrors || 15}</span>
                                        </div>
                                    </div>

                                    <p className="text-center text-sm text-slate-400 font-medium leading-relaxed mt-4 mb-8">
                                        Don't give up. Every expert was once a beginner. Focus on accuracy first, speed will follow.
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex row gap-4">
                                        <button 
                                            onClick={resetTest}
                                            className="flex-1 py-4 bg-red-500 hover:bg-red-400 text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw className="w-5 h-5" />
                                            Try Again
                                        </button>
                                        <button 
                                            onClick={() => navigate('/academy')}
                                            className="flex-1 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                                        >
                                            Return to Academy
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {status === 'finished' && !isFailed && (
                                <div className="mt-12 flex flex-col md:flex-row gap-4 animate-in slide-in-from-bottom-6 duration-500">
                                    <button 
                                        onClick={resetTest}
                                        className="w-full md:w-auto flex items-center gap-3 px-10 py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)]"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Reboot Grid
                                    </button>
                                    {location.state?.isAcademy ? (
                                        <button 
                                            onClick={() => navigate('/academy')}
                                            className="w-full md:w-auto flex items-center gap-3 px-10 py-5 bg-primary/20 border border-primary/20 text-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary/30 transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                            Return to Academy
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setShowConfig(true)}
                                            className="w-full md:w-auto flex items-center gap-3 px-10 py-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                        >
                                            <Settings className="w-5 h-5" />
                                            Adjust Params
                                        </button>
                                    )}
                                </div>
                            )}

                            {!location.state?.isAcademy && status === 'finished' && getTopErrors().length > 0 && (
                                <div className="mt-8 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl p-8 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-3 mb-6">
                                        <BarChart2 className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Neural Weak Point Analysis</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        {getTopErrors().map(({ key, count }) => (
                                            <div key={key} className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-4 flex flex-col items-center">
                                                <div className="w-10 h-10 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-xl text-xl font-mono font-black text-red-500 mb-2">
                                                    {key.toUpperCase()}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">Errors</div>
                                                <div className="text-xl font-mono font-black text-slate-900 dark:text-white">{count}</div>
                                            </div>
                                        ))}
                                    </div>
 
                                    <button 
                                        onClick={() => navigate('/academy', { state: { suggestedKeys: getTopErrors().map(e => e.key) } })}
                                        className="w-full py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all group flex items-center justify-center gap-2"
                                    >
                                        Train These Keys in Academy
                                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className={`mt-auto flex justify-between items-center transition-all duration-700 ${isFocusMode ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
                            <div className="flex gap-12">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Node Protocol</span>
                                    <span className="text-xs font-bold text-slate-400 font-mono uppercase italic">{stream} stream</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Link Key</span>
                                    <span className="text-xs font-bold text-slate-400 font-mono uppercase italic">TAB to Reset</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 shadow-sm px-8 py-3 rounded-full">
                                <Shield className="w-4 h-4 text-primary opacity-50" />
                                <span className="text-[9px] font-black text-primary tracking-[0.3em] font-mono animate-pulse">SECURE ENCRYPTED SESSION // ACTIVE</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
