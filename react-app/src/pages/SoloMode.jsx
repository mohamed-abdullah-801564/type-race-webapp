import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
    UserCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { auth, db } from '../firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { loadData, saveData } from '../utils/storageUtils';
import { syncToLeaderboard, syncCrucialData, updateWeakKeys } from '../utils/firebaseUtils';
import { generateSmartDrill } from '../utils/typingUtils';

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

    // Configuration State
    const [showConfig, setShowConfig] = useState(true);
    const [stream, setStream] = useState('prose'); // 'prose' or 'code'
    const [duration, setDuration] = useState(30); // 30, 60, 120

    // Racing State
    const [text, setText] = useState('');
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState('waiting'); // waiting, typing, finished
    
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


    const inputRef = useRef(null);
    const startTimeRef = useRef(null);
    const endTimeRef = useRef(null);
    const lastKeystrokeTimestampRef = useRef(null);
    const timerRef = useRef(null);

    // Initial Ghost Check (from Vault)
    useEffect(() => {
        if (location.state?.isGhostChallenge) {
            const gd = location.state.ghostData || [];
            if (gd.length > 0) {
                setGhostData(gd);
                setText(location.state.text || "");
                setGhostName(location.state.ghostName || "Neural Specter");
                setShowConfig(false);
                const ghostTimeInSec = Math.ceil(gd[gd.length - 1].time / 1000);
                const bufferedTime = ghostTimeInSec + 30;
                setTimeLeft(bufferedTime);
                setDuration(bufferedTime);
            }
        }
    }, [location.state]);

    // Timer Logic
    useEffect(() => {
        if (status === 'typing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setStatus('finished');
                        endTimeRef.current = Date.now();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [status]);

    // Ghost Pacer Logic
    useEffect(() => {
        let animationFrame;
        if (status === 'typing' && ghostData.length > 0) {
            const animate = () => {
                const elapsed = Date.now() - startTimeRef.current;
                const nextIndex = ghostData.findIndex(k => k.time > elapsed);
                if (nextIndex !== -1) {
                    setGhostIndex(nextIndex);
                } else {
                    setGhostIndex(ghostData.length);
                }
                animationFrame = requestAnimationFrame(animate);
            };
            animationFrame = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(animationFrame);
    }, [status, ghostData]);

    const handleInputChange = (e) => {
        if (status === 'finished' || isFailed) return;

        const val = e.target.value;
        const now = Date.now();

        if (status === 'idle' && val.length > 0) {
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
                    const key = expectedChar.toLowerCase();
                    setErrorMap(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
                }
            }

            setUserInput(val);

            if (val.length === text.length) {
                setStatus('finished');
                endTimeRef.current = now;
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            resetTest();
        }
    };

    const resetTest = () => {
        setUserInput('');
        setStatus('idle');
        setIsFailed(false);
        setTimeLeft(duration);
        setKeystrokes([]);
        setErrorMap({});
        setGhostIndex(0);
        startTimeRef.current = null;
        endTimeRef.current = null;
        if (inputRef.current) inputRef.current.focus();
    };

    const handleStartRace = () => {
        const samples = stream === 'prose' ? PROSE_SAMPLES : CODE_SAMPLES;
        setText(samples[Math.floor(Math.random() * samples.length)]);
        setTimeLeft(duration);
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
        const end = endTimeRef.current || Date.now();
        const elapsedMs = Math.max(1, end - startTimeRef.current);
        const elapsedSeconds = elapsedMs / 1000;
        const correctChars = userInput.split('').filter((char, i) => char === text[i]).length;
        return Math.round((correctChars / 5) / (elapsedSeconds / 60));
    };

    useEffect(() => {
        if (status === 'finished') {
            const wpm = calculateWPM();
            const acc = calculateAccuracy();
            setFinalWPM(wpm);
            
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
                stream
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
        }
    }, [status]);

    const isFocusMode = status === 'typing';

    return (
        <div className="min-h-screen bg-background-dark text-slate-300 font-sans selection:bg-primary/30 selection:text-primary flex flex-col overflow-hidden relative">
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50" />
            
            <Navbar isFaded={isFocusMode} />

            <main className="flex-1 flex flex-col relative z-10 transition-all duration-500">
                {showConfig ? (
                    <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
                        <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Terminal className="w-32 h-32 text-primary" />
                           </div>
                           
                           <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-4">
                                <Cpu className="w-10 h-10 text-primary animate-pulse" />
                                System Configuration
                           </h1>
                           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10 border-b border-white/5 pb-6">
                                Initializing Neural Pathway Protocol // Select Parameters
                           </p>

                           <div className="space-y-10">
                                <div>
                                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Data Stream Source</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setStream('prose')}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${stream === 'prose' ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(0,245,212,0.2)] text-white' : 'bg-white/5 border-transparent text-slate-500 hover:border-white/20'}`}
                                        >
                                            <div className={`p-3 rounded-xl ${stream === 'prose' ? 'bg-primary text-black' : 'bg-white/5'}`}>
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black uppercase tracking-tight text-sm">Prose Matrix</div>
                                                <div className="text-[10px] opacity-60 font-bold uppercase">Natural Language</div>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => setStream('code')}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${stream === 'code' ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(0,245,212,0.2)] text-white' : 'bg-white/5 border-transparent text-slate-500 hover:border-white/20'}`}
                                        >
                                            <div className={`p-3 rounded-xl ${stream === 'code' ? 'bg-primary text-black' : 'bg-white/5'}`}>
                                                <Code className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black uppercase tracking-tight text-sm">Syntax Stream</div>
                                                <div className="text-[10px] opacity-60 font-bold uppercase">React / JS Logic</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Session Duration (Seconds)</label>
                                    <div className="flex gap-4">
                                        {[30, 60, 120].map((d) => (
                                            <button 
                                                key={d}
                                                onClick={() => setDuration(d)}
                                                className={`flex-1 py-4 rounded-xl border-2 font-black text-lg transition-all ${duration === d ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(0,245,212,0.3)]' : 'bg-white/5 border-transparent text-slate-500 hover:border-white/20'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleStartRace}
                                    className="w-full py-6 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,245,212,0.4)]"
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
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Temporal Node</span>
                                <div className="text-7xl font-black text-white font-mono leading-none flex items-baseline gap-2">
                                    {status === 'finished' ? finalWPM : timeLeft}
                                    <span className="text-xl text-primary/40 uppercase font-sans tracking-widest">{status === 'finished' ? 'WPM' : 'Sec'}</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Neural Precision</span>
                                <div className="text-5xl font-bold text-slate-200 font-mono leading-none">
                                    {calculateAccuracy()}<span className="text-xl opacity-30">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Centered Typing Interface */}
                        <div className="flex-1 flex flex-col items-center justify-center mb-24 relative">
                            <div 
                                className={`w-full max-w-4xl p-12 bg-white/[0.02] border border-white/5 rounded-[40px] shadow-2xl relative transition-all duration-500 ${status === 'typing' ? 'scale-[1.05] bg-white/[0.05] border-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : ''}`}
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

                                <div className="text-2xl font-mono leading-relaxed select-none relative z-10 tracking-tight">
                                    {text.split('').map((char, index) => {
                                        let colorClass = "text-slate-600";
                                        if (index < userInput.length) {
                                            colorClass = userInput[index] === char ? "text-primary drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]" : "text-red-500 bg-red-500/10 rounded-sm";
                                        }
                                        const isCursor = index === userInput.length && status !== 'finished';
                                        const isGhost = ghostData.length > 0 && index === ghostIndex && status === 'typing';

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

                                {status === 'idle' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 backdrop-blur-[2px] rounded-[40px] pointer-events-none">
                                        <div className="flex flex-col items-center gap-4 animate-pulse">
                                            <div className="flex items-center gap-8 text-primary/30">
                                                <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary/20" />
                                                <Activity className="w-8 h-8" />
                                                <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary/20" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">Initiate Input Sequence</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {status === 'finished' && (
                                <div className="mt-12 flex gap-4 animate-in slide-in-from-bottom-6 duration-500">
                                    <button 
                                        onClick={resetTest}
                                        className="flex items-center gap-3 px-10 py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)]"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Reboot Grid
                                    </button>
                                    <button 
                                        onClick={() => setShowConfig(true)}
                                        className="flex items-center gap-3 px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                                    >
                                        <Settings className="w-5 h-5" />
                                        Adjust Params
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
                            
                            <div className="flex items-center gap-4 bg-black/40 px-8 py-3 rounded-full border border-white/5 shadow-2xl">
                                <Shield className="w-4 h-4 text-primary opacity-50" />
                                <span className="text-[9px] font-black text-primary tracking-[0.3em] font-mono animate-pulse">SECURE ENCRYPTED SESSION // ACTIVE</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
