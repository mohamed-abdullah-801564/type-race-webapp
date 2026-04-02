import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Zap, BarChart2, Settings, UserCircle, RotateCcw, Code, FileText, Skull, Ghost, Share2, Check } from 'lucide-react';
import { io } from 'socket.io-client';
import { auth, database } from '../firebase';
import { ref, set } from 'firebase/database';

const SOCKET_SERVER = 'http://localhost:3001';
const DEFAULT_TIME = 30;
const ADAPTIVE_DRILL_STORAGE_KEY = 'adaptiveDrill';

export default function SoloMode() {
    const [adaptiveDrillConfig] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(ADAPTIVE_DRILL_STORAGE_KEY) || 'null');
        } catch {
            return null;
        }
    });
    const isAdaptiveDrill = !!adaptiveDrillConfig;
    const adaptiveDrillDuration = isAdaptiveDrill && Number.isFinite(adaptiveDrillConfig?.duration)
        ? adaptiveDrillConfig.duration
        : DEFAULT_TIME;
    const adaptiveDrillText = isAdaptiveDrill && typeof adaptiveDrillConfig?.text === 'string'
        ? adaptiveDrillConfig.text
        : 'Loading quote...';
    const adaptiveDrillDifficulty = isAdaptiveDrill && typeof adaptiveDrillConfig?.difficulty === 'string'
        ? adaptiveDrillConfig.difficulty
        : 'medium';
    const adaptiveDrillCategory = isAdaptiveDrill && typeof adaptiveDrillConfig?.category === 'string'
        ? adaptiveDrillConfig.category
        : 'prose';
    const adaptiveDrillMode = isAdaptiveDrill && typeof adaptiveDrillConfig?.mode === 'string'
        ? adaptiveDrillConfig.mode
        : 'standard';

    const [socket, setSocket] = useState(null);
    const [text, setText] = useState(() => adaptiveDrillText);
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'typing', 'finished'
    const [isFailed, setIsFailed] = useState(false);
    const [timeLeft, setTimeLeft] = useState(() => adaptiveDrillDuration);
    const [errorMap, setErrorMap] = useState({});
    const [difficulty, setDifficulty] = useState(() => adaptiveDrillDifficulty);
    const [category, setCategory] = useState(() => adaptiveDrillCategory); // 'prose', 'code'
    const [mode, setMode] = useState(() => adaptiveDrillMode); // 'standard', 'zen', 'sudden-death'
    const [finalWPM, setFinalWPM] = useState(0);
    const [keystrokes, setKeystrokes] = useState([]);
    const [ghostData, setGhostData] = useState([]);
    const [ghostIndex, setGhostIndex] = useState(0);
    const [isCopied, setIsCopied] = useState(false);
    const [progressToast, setProgressToast] = useState(null);
    const [drillWorstKeys, setDrillWorstKeys] = useState(() => (adaptiveDrillConfig?.worstKeys || []).slice(0, 3));
    const [drillPreKeyStats, setDrillPreKeyStats] = useState(() => adaptiveDrillConfig?.preKeyStats || {});

    const inputRef = useRef(null);
    const startTimeRef = useRef(null);
    const endTimeRef = useRef(null);
    const lastKeystrokeTimestampRef = useRef(null);
    const toastTimeoutRef = useRef(null);
    const hasShownDrillStartToastRef = useRef(false);

    // Initialize Socket
    useEffect(() => {
        const newSocket = io(SOCKET_SERVER);
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

    // If we launched via adaptive drill, arm the run and avoid socket-based quote fetching.
    useEffect(() => {
        if (!isAdaptiveDrill || !adaptiveDrillConfig) return;

        localStorage.removeItem(ADAPTIVE_DRILL_STORAGE_KEY);
        setGhostData([]);
        setGhostIndex(0);
        setKeystrokes([]);
        setErrorMap({});
        setUserInput('');
        setStatus('idle');
        setIsFailed(false);

        const keys = (adaptiveDrillConfig.worstKeys || []).slice(0, 3).join(' ');
        setProgressToast({
            title: 'Daily Drill Armed',
            body: `Focus: ${keys || 'key'} • ${adaptiveDrillDuration}s • No ghosts`
        });
        hasShownDrillStartToastRef.current = true;

        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setProgressToast(null), 9000);
    }, [isAdaptiveDrill, adaptiveDrillConfig, adaptiveDrillDuration]);

    // Focus input on mount and keep it focused
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [status, mode]); // Re-focus on status or mode change

    // Timer logic
    useEffect(() => {
        let timer;
        if (status === 'typing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setStatus('finished');
                        endTimeRef.current = Date.now();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status, timeLeft]);

    // Ghost Cursor Logic
    useEffect(() => {
        let animationFrame;
        if (status === 'typing' && ghostData.length > 0) {
            const start = startTimeRef.current;
            const animate = () => {
                const elapsed = Date.now() - start;
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
        if (status === 'finished') return;

        const val = e.target.value;
        const now = Date.now();

        if (status === 'idle' && val.length > 0) {
            setStatus('typing');
            startTimeRef.current = now;
            lastKeystrokeTimestampRef.current = now;
        }

        if (val.length <= text.length) {
            const prevLength = userInput.length;
            const nowTime = Date.now();
            
            // Track Keystrokes for Ghost Pacer
            if (val.length > prevLength && startTimeRef.current) {
                const char = val[val.length - 1];
                const timeOffset = nowTime - startTimeRef.current;
                setKeystrokes(prev => [...prev, { char, time: timeOffset }]);
            }

            // Track Latency (Legacy system)
            if (val.length > prevLength && lastKeystrokeTimestampRef.current) {
                const latency = now - lastKeystrokeTimestampRef.current;
                const expectedChar = text[val.length - 1];
                const key = expectedChar?.toLowerCase();

                // Ignore whitespace-only keys in the latency profile.
                if (key && expectedChar !== ' ' && expectedChar !== '\n' && expectedChar !== '\t') {
                    const performances = JSON.parse(localStorage.getItem('keyPerformances') || '{}');
                    const current = performances[key] || { avg: 0, count: 0, errors: 0 };
                    const newCount = (Number(current.count) || 0) + 1;
                    const currentAvg = Number(current.avg) || 0;
                    const newAvg = Math.round(((currentAvg * (Number(current.count) || 0)) + latency) / newCount);

                    performances[key] = {
                        ...current,
                        avg: newAvg,
                        count: newCount
                    };
                    localStorage.setItem('keyPerformances', JSON.stringify(performances));
                }
                lastKeystrokeTimestampRef.current = now;
            }

            setUserInput(val);

            // Detect Error / Sudden Death
            if (val.length > prevLength) {
                const typedChar = val[val.length - 1];
                const expectedChar = text[val.length - 1];
                
                if (typedChar !== expectedChar) {
                    if (mode === 'sudden-death') {
                        setStatus('finished');
                        setIsFailed(true);
                        endTimeRef.current = now;
                        return;
                    }
                    if (expectedChar !== ' ' && expectedChar !== '\n') {
                        const missedChar = expectedChar.toLowerCase();
                        setErrorMap(prev => ({ ...prev, [missedChar]: (prev[missedChar] || 0) + 1 }));
                    }
                }
            }
        }

        // Auto-finish if type all text
        if (val.length === text.length && text.length > 0) {
            setStatus('finished');
            endTimeRef.current = now;
        }
    };

    const handleKeyDown = (e) => {
        if (status === 'finished') {
            if (e.key.toLowerCase() === 'r' || e.key === 'Tab') {
                e.preventDefault();
                resetTest();
            }
            return;
        }

        if (category === 'code') {
            if (e.key === 'Tab') {
                e.preventDefault();
                // Find how many spaces/indentation are next in the text
                const nextChunk = text.slice(userInput.length);
                const indentMatch = nextChunk.match(/^ +/);
                if (indentMatch) {
                    setUserInput(prev => prev + indentMatch[0]);
                } else {
                    // Just add 4 spaces if no match but Tab was pressed (fallback)
                    setUserInput(prev => prev + "    ");
                }
                if (status === 'idle') {
                    setStatus('typing');
                    startTimeRef.current = Date.now();
                }
            } else if (e.key === 'Enter') {
                const expectedChar = text[userInput.length];
                if (expectedChar === '\n') {
                    e.preventDefault();
                    setUserInput(prev => prev + '\n');
                    if (status === 'idle') {
                        setStatus('typing');
                        startTimeRef.current = Date.now();
                    }
                }
            }
        }
        
        // General Restart shortcut during typing/idle
        if ((e.key.toLowerCase() === 'r' && e.ctrlKey) || (e.key === 'Tab' && status === 'idle')) {
            e.preventDefault();
            resetTest();
        }
    };

    const calculateAccuracy = () => {
        if (userInput.length === 0) return 100;
        const correctChars = userInput.split('').filter((char, i) => char === text[i]).length;
        return ((correctChars / userInput.length) * 100).toFixed(1);
    };

    const handleShareScore = async () => {
        const accuracy = calculateAccuracy();
        const modeEmoji = mode === 'sudden-death' ? 'HELL ☠️' : mode === 'zen' ? 'ZEN 👻' : 'STANDARD ⚡';
        const str = `TypeMaster ⚡ | WPM: ${finalWPM} | Acc: ${accuracy}% | Mode: ${modeEmoji} | ${category === 'code' ? 'Code-Sprint' : 'Prose'}`;
        
        try {
            await navigator.clipboard.writeText(str);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            prompt('Clipboard access denied. Copy your score manually:', str);
        }
    };

    const calculateWPM = () => {
        if (!startTimeRef.current) return 0;
        const end = endTimeRef.current || Date.now();
        const elapsedSeconds = (end - startTimeRef.current) / 1000;
        const elapsedMins = elapsedSeconds / 60;
        
        if (elapsedMins <= 0) return 0;
        
        const correctChars = userInput.split('').filter((char, i) => char === text[i]).length;
        // WPM formula: (Characters / 5) / Minutes
        return Math.round((correctChars / 5) / elapsedMins);
    };

    const resetTest = () => {
        setUserInput('');
        setStatus('idle');
        setIsFailed(false);
        setTimeLeft(isAdaptiveDrill ? adaptiveDrillDuration : DEFAULT_TIME);
        setErrorMap({});
        startTimeRef.current = null;
        endTimeRef.current = null;
        lastKeystrokeTimestampRef.current = null;
        setKeystrokes([]);
        if (isAdaptiveDrill) {
            setGhostData([]);
            setGhostIndex(0);
        }
        if (!isAdaptiveDrill) {
            fetchNewQuote();
        }
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const fetchNewQuote = () => {
        if (isAdaptiveDrill) return;
        if (!socket) return;
        socket.emit('getSoloQuote', { difficulty, category }, (res) => {
            if (res.success) {
                setText(res.text);
                setUserInput('');
                setStatus('idle');
                setIsFailed(false);
                setTimeLeft(DEFAULT_TIME);
                setErrorMap({});
                startTimeRef.current = null;
                endTimeRef.current = null;
                lastKeystrokeTimestampRef.current = null;
                setKeystrokes([]);
                if (inputRef.current) inputRef.current.focus();
            }
        });
    };

    // Save errorMap to localStorage when the test finishes
    useEffect(() => {
        if (status === 'finished' && Object.keys(errorMap).length > 0) {
            const existing = JSON.parse(localStorage.getItem('weakKeys') || '{}');
            const merged = { ...existing };
            for (const [key, count] of Object.entries(errorMap)) {
                merged[key] = (merged[key] || 0) + count;
            }
            localStorage.setItem('weakKeys', JSON.stringify(merged));

            // Persist error counts into keyPerformances so we can rank by ms/error rate.
            const perfExisting = JSON.parse(localStorage.getItem('keyPerformances') || '{}');
            const perfMerged = { ...perfExisting };
            for (const [key, count] of Object.entries(errorMap)) {
                const current = perfMerged[key] || { avg: 0, count: 0, errors: 0 };
                perfMerged[key] = {
                    ...current,
                    errors: (Number(current.errors) || 0) + count
                };
            }
            localStorage.setItem('keyPerformances', JSON.stringify(perfMerged));
        }
        
        if (status === 'finished') {
            const currentWPM = calculateWPM();
            setFinalWPM(currentWPM);

            const currentAccuracyStr = calculateAccuracy();
            const currentAccuracy = Number(currentAccuracyStr) || 0;

            // PB Logic: Overwrite only if higher WPM (or first run). Skip during adaptive drill.
            if (!isAdaptiveDrill) {
                const savedGhost = localStorage.getItem('lastRunGhost');
                let ghostWPM = 0;
                if (savedGhost) {
                    const parsed = JSON.parse(savedGhost);
                    const lastTime = parsed[parsed.length - 1]?.time || 0;
                    if (lastTime > 0) {
                        ghostWPM = Math.round((parsed.length / 5) / (lastTime / 60000));
                    }
                }
                
                if (keystrokes.length > 0 && currentWPM > ghostWPM) {
                    localStorage.setItem('lastRunGhost', JSON.stringify(keystrokes));
                    setGhostData(keystrokes);
                }
            }

            // RaceHistory is used by the main dashboard graph.
            // Adaptive drills are flagged (`isDrill`) so the dashboard can filter them out.
            const raceHistory = JSON.parse(localStorage.getItem('raceHistory') || '[]');
            const drillHistory = isAdaptiveDrill
                ? JSON.parse(localStorage.getItem('drillHistory') || '[]')
                : [];

            const prevAvgWPM = isAdaptiveDrill
                ? (drillHistory.length > 0
                    ? drillHistory.reduce((acc, h) => acc + Number(h.wpm || 0), 0) / drillHistory.length
                    : currentWPM)
                : (raceHistory.length > 0
                    ? raceHistory.reduce((acc, h) => acc + Number(h.wpm || 0), 0) / raceHistory.length
                    : currentWPM);

            const prevAvgAcc = isAdaptiveDrill
                ? (drillHistory.length > 0
                    ? drillHistory.reduce((acc, h) => acc + Number(String(h.accuracy || '0').replace('%', '')), 0) / drillHistory.length
                    : currentAccuracy)
                : (raceHistory.length > 0
                    ? raceHistory.reduce((acc, h) => acc + Number(String(h.accuracy || '0').replace('%', '')), 0) / raceHistory.length
                    : currentAccuracy);

            raceHistory.push({
                wpm: currentWPM,
                accuracy: currentAccuracyStr,
                date: Date.now(),
                mode,
                category,
                ...(isAdaptiveDrill ? { isDrill: true } : {})
            });
            localStorage.setItem('raceHistory', JSON.stringify(raceHistory.slice(-100))); // Keep last 100 runs

            // Drill-only storage for toast baselines (kept isolated from the main dashboard graph).
            if (isAdaptiveDrill) {
                drillHistory.push({
                    wpm: currentWPM,
                    accuracy: currentAccuracyStr,
                    date: Date.now(),
                    worstKeys: drillWorstKeys
                });
                localStorage.setItem('drillHistory', JSON.stringify(drillHistory.slice(-100)));
            }

            // Calculate and Store Rank Data
            const finalRaceHistory = JSON.parse(localStorage.getItem('raceHistory') || '[]');
            const finalDrillHistory = JSON.parse(localStorage.getItem('drillHistory') || '[]');
            const nonDrill = finalRaceHistory.filter(h => !h.isDrill);
            
            if (nonDrill.length > 0) {
                const highestWPM = Math.max(...nonDrill.map(h => Number(h.wpm)));
                const avgAcc = nonDrill.reduce((acc, h) => acc + Number(String(h.accuracy || '0').replace('%', '')), 0) / nonDrill.length;
                const drillsCompleted = finalDrillHistory.length;
                
                const rankScore = Math.round(highestWPM + (avgAcc * 0.2) + (drillsCompleted * 0.5));
                
                let tier = 'Novice';
                let nextTierWPM = 61;
                if (rankScore >= 131) { tier = 'Overlord'; nextTierWPM = null; }
                else if (rankScore >= 101) { tier = 'Elite'; nextTierWPM = 131; }
                else if (rankScore >= 81) { tier = 'Pro'; nextTierWPM = 101; }
                else if (rankScore >= 61) { tier = 'Cadet'; nextTierWPM = 81; }
                
                localStorage.setItem('rankData', JSON.stringify({
                    score: rankScore,
                    tier,
                    nextTierMax: nextTierWPM,
                    highestWPM,
                    avgAcc: avgAcc.toFixed(1),
                    drillsCompleted,
                    totalRaces: nonDrill.length
                }));
            }

            if (auth.currentUser) {
                const uid = auth.currentUser.uid;
                const userRef = ref(database, `users/${uid}`);
                const localRaces = JSON.parse(localStorage.getItem('raceHistory') || '[]').filter(r => !r.isDrill);
                const localKeyPerf = JSON.parse(localStorage.getItem('keyPerformances') || '{}');
                const localRank = JSON.parse(localStorage.getItem('rankData') || 'null');
                
                set(userRef, {
                    races: localRaces,
                    keyPerf: localKeyPerf,
                    rank: localRank
                }).catch(err => console.error("Firebase sync failed:", err));

                if (!isAdaptiveDrill && localRank) {
                    const lbRef = ref(database, `leaderboard/top10/${uid}`);
                    const email = auth.currentUser.email || 'Operator';
                    const operatorName = localStorage.getItem('playerName') || email.split('@')[0];
                    set(lbRef, {
                        name: operatorName,
                        wpm: localRank.highestWPM,
                        acc: localRank.avgAcc,
                        score: localRank.score,
                        tier: localRank.tier,
                        updatedAt: Date.now()
                    }).catch(err => console.error("Leaderboard update failed:", err));
                }
            }

            // Completion toast for adaptive drills
            if (isAdaptiveDrill) {
                const keyPerformancesAfter = JSON.parse(localStorage.getItem('keyPerformances') || '{}');
                const preKeys = drillWorstKeys || [];
                const preStats = drillPreKeyStats || {};

                const deltas = preKeys.map((k) => {
                    const pre = preStats[k] || {};
                    const postPerf = keyPerformancesAfter[k] || {};

                    const preAvg = Number(pre.avg) || 0;
                    const postAvg = Number(postPerf.avg) || 0;
                    const preHits = Number(pre.hits) || 0;
                    const preErrors = Number(pre.errors) || 0;
                    const postHits = Number(postPerf.count) || 0;
                    const postErrors = Number(postPerf.errors ?? 0) || 0;

                    const preAttempts = preHits + preErrors;
                    const postAttempts = postHits + postErrors;
                    const preErrRate = preAttempts > 0 ? preErrors / preAttempts : 0;
                    const postErrRate = postAttempts > 0 ? postErrors / postAttempts : 0;

                    return {
                        key: k,
                        latencyDelta: postAvg - preAvg,
                        errorRateDelta: postErrRate - preErrRate
                    };
                }).filter(Boolean);

                const avgLatencyDelta = deltas.length > 0 ? Math.round(deltas.reduce((acc, d) => acc + d.latencyDelta, 0) / deltas.length) : 0;
                const improvedLatencyCount = deltas.filter((d) => d.latencyDelta < 0).length;

                const avgErrorRateDelta = deltas.length > 0 ? deltas.reduce((acc, d) => acc + d.errorRateDelta, 0) / deltas.length : 0;
                const improvedErrorCount = deltas.filter((d) => d.errorRateDelta < 0).length;

                const wpmDelta = Math.round(currentWPM - prevAvgWPM);
                const accDelta = Number((currentAccuracy - prevAvgAcc).toFixed(1));

                setProgressToast({
                    title: 'Neon Neural Gain',
                    body:
                        `WPM ${wpmDelta >= 0 ? '+' : ''}${wpmDelta} vs avg ${Math.round(prevAvgWPM)} • ` +
                        `Acc ${accDelta >= 0 ? '+' : ''}${accDelta.toFixed(1)}% • ` +
                        `Latency ${avgLatencyDelta >= 0 ? '+' : ''}${avgLatencyDelta}ms (${improvedLatencyCount}/${deltas.length}) • ` +
                        `Error ${(avgErrorRateDelta * 100) >= 0 ? '+' : ''}${(avgErrorRateDelta * 100).toFixed(1)}% (${improvedErrorCount}/${deltas.length})`
                });

                if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = setTimeout(() => setProgressToast(null), 12000);
            }
        }
    }, [status]);

    // Load Ghost Data on Mount
    useEffect(() => {
        if (isAdaptiveDrill) return;
        const savedGhost = localStorage.getItem('lastRunGhost');
        if (savedGhost) {
            setGhostData(JSON.parse(savedGhost));
        }
    }, [isAdaptiveDrill]);

    // Automatic Reboot on Mode/Category Change
    useEffect(() => {
        if (status !== 'idle' || userInput.length > 0) {
            resetTest();
        }
    }, [mode, category, difficulty]);

    // Fetch a new quote whenever difficulty/category changes or socket is ready
    useEffect(() => {
        fetchNewQuote();
    }, [difficulty, category, socket]);

    const isZenHiding = mode === 'zen' && status === 'typing';

    return (
        <div className="layout-container flex flex-col min-h-screen bg-background-dark selecting:bg-primary/20">
            <header className="flex items-center justify-between px-8 py-6 border-b border-primary/10 faded-ui">
                <div className="flex items-center gap-2 text-primary drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]">
                    <Zap className="w-8 h-8 animate-pulse" />
                    <h2 className="text-xl font-bold tracking-tight uppercase">TypeMaster <span className="text-[10px] bg-primary/20 px-1.5 py-0.5 rounded ml-1 border border-primary/30">PRO</span></h2>
                </div>
                <nav className="flex items-center gap-6">
                    <Link to="/" className="flex items-center justify-center p-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
                        <BarChart2 className="w-6 h-6" />
                    </Link>
                    <button className="flex items-center justify-center p-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
                        <Settings className="w-6 h-6" />
                    </button>
                    <div className="w-px h-6 bg-slate-700 mx-2"></div>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary/50 text-sm font-medium transition-all text-primary/80">
                        <UserCircle className="w-5 h-5" />
                        <span>CyberTypist</span>
                    </button>
                </nav>
            </header>

            <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-8 py-8">
                {/* Stats Header Area */}
                <div className={`flex justify-between items-end mb-12 px-4 transition-all duration-700 ease-in-out ${isZenHiding ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100'}`}>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">
                            {status === 'finished' ? 'Final Output' : 'Chronometer'}
                        </span>
                        <div className="text-6xl font-black text-primary drop-shadow-[0_0_15px_rgba(0,245,212,0.3)] font-mono">
                            {status === 'finished' ? finalWPM : timeLeft} <span className="text-lg font-medium opacity-50">{status === 'finished' ? 'WPM' : 's'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Precision</span>
                        <div className="text-4xl font-bold text-slate-300 font-mono tracking-tighter">
                            {calculateAccuracy()}<span className="text-base opacity-50">%</span>
                        </div>
                    </div>
                </div>

                {progressToast && (
                    <div className="fixed top-6 right-6 z-300 w-104 max-w-[calc(100vw-2rem)] bg-black/70 backdrop-blur-md border border-primary/30 rounded-2xl shadow-[0_0_35px_rgba(0,245,212,0.14)] p-4 animate-in fade-in duration-300">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                                    {progressToast.title}
                                </div>
                                <div className="mt-2 text-sm leading-relaxed font-semibold text-slate-100">
                                    {progressToast.body}
                                </div>
                            </div>
                            <button
                                onClick={() => setProgressToast(null)}
                                className="text-slate-300/70 hover:text-slate-200 transition-colors text-xs font-bold border border-white/10 rounded-lg px-3 py-1 bg-white/5"
                            >
                                Close
                            </button>
                        </div>
                        <div className="mt-3 h-[2px] w-full bg-primary/20 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-primary/60 animate-[drillGlow_2s_ease-in-out_infinite] rounded-full" />
                        </div>
                    </div>
                )}

                {/* Control Panel */}
                <div className={`faded-ui grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 bg-slate-900/40 p-6 rounded-2xl border border-white/5 relative z-20 ${isAdaptiveDrill ? 'pointer-events-none opacity-70' : ''}`}>
                    {/* Mode Selector */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">System Mode</span>
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            <button onClick={() => setMode('standard')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase transition-all ${mode === 'standard' ? 'bg-primary text-background-dark' : 'text-slate-400 hover:text-slate-200'}`}>
                                <Zap className="w-3.5 h-3.5" />
                                Std
                            </button>
                            <button onClick={() => setMode('zen')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase transition-all ${mode === 'zen' ? 'bg-primary text-background-dark' : 'text-slate-400 hover:text-slate-200'}`}>
                                <Ghost className="w-3.5 h-3.5" />
                                Zen
                            </button>
                            <button onClick={() => setMode('sudden-death')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase transition-all ${mode === 'sudden-death' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'text-slate-400 hover:text-slate-200'}`}>
                                <Skull className="w-3.5 h-3.5" />
                                Hell
                            </button>
                        </div>
                    </div>

                    {/* Category Selector */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Data Stream</span>
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            <button onClick={() => setCategory('prose')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase transition-all ${category === 'prose' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:text-slate-200'}`}>
                                <FileText className="w-3.5 h-3.5" />
                                Prose
                            </button>
                            <button onClick={() => setCategory('code')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase transition-all ${category === 'code' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:text-slate-200'}`}>
                                <Code className="w-3.5 h-3.5" />
                                Code
                            </button>
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Complexity Level</span>
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            {['easy', 'medium', 'hard'].map(d => (
                                <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${difficulty === d ? 'text-primary' : 'text-slate-400 hover:text-slate-200'}`}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col flex-1 items-center justify-center relative">

                    <div
                        className={`w-full text-2xl leading-relaxed font-mono tracking-tight text-left relative cursor-text bg-black/20 p-12 rounded-3xl border transition-all duration-500 ${mode === 'sudden-death' ? 'shadow-[0_0_30px_rgba(239,68,68,0.15)] border-red-500/20' : 'border-white/5 shadow-2xl'} backdrop-blur-sm`}
                        onClick={() => inputRef.current && inputRef.current.focus()}
                    >
                        {/* Start Overlay */}
                        {status === 'idle' && !isFailed && (
                            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-3xl animate-pulse">
                                <div className="text-primary/60 text-sm font-black uppercase tracking-[0.4em] flex items-center gap-4">
                                    <div className="w-12 h-px bg-primary/20"></div>
                                    Press any key to initialize...
                                    <div className="w-12 h-px bg-primary/20"></div>
                                </div>
                            </div>
                        )}

                        {/* Failed Overlay */}
                        {isFailed && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-950/40 backdrop-blur-md rounded-3xl border-2 border-red-500/50 animate-in fade-in zoom-in duration-300">
                                <div className="text-center p-8 bg-black/60 rounded-2xl border border-red-500/20 shadow-2xl">
                                    <Skull className="w-20 h-20 text-red-500 mx-auto mb-6 animate-bounce" />
                                    <h3 className="text-5xl font-black text-red-500 uppercase tracking-tighter drop-shadow-[0_0_15px_#ef4444] mb-2">System Failure</h3>
                                    <p className="text-red-400 font-bold tracking-[0.2em] uppercase text-xs mb-10 opacity-70">Sudden Death Clause Triggered</p>
                                    
                                    <button 
                                        onClick={resetTest}
                                        className="group flex items-center gap-3 mx-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                    >
                                        <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                        Reboot (Tab)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Hidden Input */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={isFailed}
                            className="absolute opacity-0 -z-10 focus:outline-none"
                            autoFocus
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                        {/* Text Renderer */}
                        <div className="select-none whitespace-pre-wrap relative">
                            {text.split('').map((char, index) => {
                                let colorClass = "text-slate-600"; // dim gray initially

                                if (index < userInput.length) {
                                    const isCorrect = userInput[index] === char;
                                    colorClass = isCorrect ? "text-primary drop-shadow-[0_0_5px_rgba(0,245,212,0.4)]" : "text-white bg-red-500/60 rounded-[2px]";
                                }

                                const isCursor = index === userInput.length && status !== 'finished';
                                const isGhost = ghostData.length > 0 && index === ghostIndex && status === 'typing';

                                return (
                                    <span key={index} className="relative">
                                        {isCursor && (
                                            <span className="absolute left-0 top-0 h-full w-[3px] bg-primary animate-pulse shadow-[0_0_12px_#00f5d4] z-10 transition-all duration-75 ease-out" />
                                        )}
                                        {isGhost && (
                                            <span className="absolute left-0 top-0 h-full w-[2px] bg-primary/20 shadow-[0_0_8px_rgba(0,245,212,0.2)] z-0 transition-all duration-300 ease-linear" />
                                        )}
                                        <span className={`${colorClass} transition-colors duration-150`}>
                                            {char}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-16 faded-ui flex items-center gap-4">
                        <button
                            onClick={resetTest}
                            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-all px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95"
                        >
                            <RotateCcw className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Reboot System (Tab)</span>
                        </button>
                        <Link 
                            to="/" 
                            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-all px-6 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 active:scale-95"
                        >
                            <span className="text-xs font-bold uppercase tracking-widest">Abort to Core</span>
                        </Link>
                        {status === 'finished' && (
                            <button
                                onClick={handleShareScore}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border transition-all active:scale-95 text-xs font-bold uppercase tracking-widest ${
                                    isCopied 
                                        ? 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                        : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50 shadow-[0_0_10px_rgba(0,245,212,0.1)]'
                                }`}
                            >
                                {isCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                                <span>{isCopied ? 'Score Copied!' : 'Share Score'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </main>

            <footer className="p-8 flex justify-between items-center faded-ui">
                <div className="flex gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-[0.25em]">
                    <a className="hover:text-primary transition-colors" href="#">Security_Protocol</a>
                    <a className="hover:text-primary transition-colors" href="#">Neural_Link</a>
                    <a className="hover:text-primary transition-colors" href="#">Source_Code</a>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-black/40 rounded-full border border-white/5 shadow-inner">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-ping"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        </div>
                        <span className="text-[9px] font-black text-primary tracking-tighter italic">LINK ESTABLISHED // 1,248 NODES ACTIVE</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
