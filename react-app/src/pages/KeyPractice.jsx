import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileBanner from '../components/MobileBanner';
import { playErrorSound, playSuccessSound } from '../utils/soundUtils';
import { recordKeyLatency } from '../utils/heatmapUtils';
import { ArrowLeft, RotateCcw, Trophy, Zap, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';

const ALL_KEYS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const BALLOON_COLORS = ['#0284c7', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];

const PRESETS = [
    { label: 'Home Row', desc: 'Core finger anchors', keys: ['a','s','d','f','g','h','j','k','l'] },
    { label: 'Top Row', desc: 'Reach & upper keys', keys: ['q','w','e','r','t','y','u','i','o','p'] },
    { label: 'Bottom Row', desc: 'Lower pinky & index rows', keys: ['z','x','c','v','b','n','m'] },
    { label: 'All Letters', desc: 'Full A–Z alphabet drill', keys: ALL_KEYS },
];

const KEYBOARD_ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
];

function getTierConfig(score, speedStep = 25) {
    if (score < speedStep) return { name: 'Rookie', speed: 0.3, spawnCount: 1, interval: 2000 };
    if (score < speedStep * 2) return { name: 'Skilled', speed: 0.5, spawnCount: 1, interval: 1600 };
    if (score < speedStep * 3) return { name: 'Expert', speed: 0.7, spawnCount: 2, interval: 1400 };
    return { name: 'Master', speed: 1.0, spawnCount: 3, interval: 1000 };
}

function makeBalloon(selectedKeys, score, caseMode, speedStep = 25) {
    const config = getTierConfig(score, speedStep);
    const randomKey = selectedKeys[Math.floor(Math.random() * selectedKeys.length)];
    
    let key = randomKey;
    if (caseMode === 'upper') key = key.toUpperCase();
    else if (caseMode === 'mixed') key = Math.random() > 0.5 ? key.toUpperCase() : key.toLowerCase();
    else key = key.toLowerCase();

    return {
        id: Date.now() + Math.random(),
        key,
        x: 8 + Math.random() * 80,
        y: 110,
        speed: config.speed + Math.random() * 0.2,
        color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
        size: 64 + Math.floor(Math.random() * 28),
        popping: false,
    };
}

export default function KeyPractice() {
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────────────────
    const [balloons, setBalloons]         = useState([]);
    const [score, setScore]               = useState(0);
    const [lives, setLives]               = useState(3);
    const [gameState, setGameState]       = useState('config'); // config | playing | gameover
    const [selectedKeys, setSelectedKeys] = useState(ALL_KEYS);
    const [combo, setCombo]               = useState(0);
    const [maxCombo, setMaxCombo]         = useState(0);
    const [selectedPreset, setSelectedPreset] = useState('All Letters');
    const [caseMode, setCaseMode]         = useState('lower'); // lower | upper | mixed
    const [showWrongKey, setShowWrongKey] = useState(false);
    const [tierUpMsg, setTierUpMsg]       = useState('');
    const [speedStep, setSpeedStep]       = useState(25);

    const scoreRef        = useRef(0);
    const livesRef        = useRef(3);
    const comboRef        = useRef(0);
    const maxComboRef     = useRef(0);
    const selectedKeysRef = useRef(ALL_KEYS);
    const balloonsRef     = useRef([]);
    const spawnIntervalRef = useRef(null);
    const caseModeRef     = useRef('lower');
    const lastTierRef     = useRef('Rookie');

    // ── SEO Page Meta ───────────────────────────────────────────────────────
    useEffect(() => {
        document.title = "Balloon Key Practice — Weak-Key Reflex Training | TypeMaster";
    }, []);

    // ── Synchronize Refs with State ─────────────────────────────────────────
    const updateBalloons = (newBalloons) => {
        balloonsRef.current = newBalloons;
        setBalloons(newBalloons);
    };

    const updateLives = (newL) => {
        livesRef.current = newL;
        setLives(newL);
    };

    const updateScore = (newS) => {
        scoreRef.current = newS;
        setScore(newS);

        // Tier check
        const newTier = getTierConfig(newS, speedStep).name;
        if (newTier !== lastTierRef.current) {
            lastTierRef.current = newTier;
            setTierUpMsg(`Speed Tier: ${newTier}!`);
            setTimeout(() => setTierUpMsg(''), 1200);
        }
    };

    const updateCombo = (newC) => {
        comboRef.current = newC;
        setCombo(newC);
        if (newC > maxComboRef.current) {
            maxComboRef.current = newC;
            setMaxCombo(newC);
        }
    };

    // ── URL param: ?key=x  →  auto-start single key ─────────────────────
    useEffect(() => {
        const param = new URLSearchParams(window.location.search).get('key');
        if (param && param.length === 1) {
            const k = [param.toLowerCase()];
            setSelectedKeys(k);
            selectedKeysRef.current = k;
            setSelectedPreset(null);
            startGame(k);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Movement Loop ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState !== 'playing') return;

        const TICK = 50;
        const id = setInterval(() => {
            const now = Date.now();
            
            let lostLife = false;
            const moved = balloonsRef.current
                .filter(b => !b.popping || b._removeAt > now)
                .map(b => {
                    if (b.popping) return b;
                    const ny = b.y - b.speed;
                    if (ny < -20) {
                        lostLife = true;
                        updateCombo(0);
                        return null;
                    }
                    return { ...b, y: ny };
                })
                .filter(Boolean);

            if (lostLife) {
                const nextLives = livesRef.current - 1;
                updateLives(nextLives);
                if (nextLives <= 0) {
                    setGameState('gameover');
                }
            }

            updateBalloons(moved);
        }, TICK);

        return () => clearInterval(id);
    }, [gameState]);

    // ── Spawning Effect ───────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState !== 'playing') {
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
            return;
        }

        const config = getTierConfig(scoreRef.current, speedStep);
        
        const spawnBalloons = () => {
            const newBalloons = [];
            for (let i = 0; i < config.spawnCount; i++) {
                newBalloons.push(makeBalloon(selectedKeysRef.current, scoreRef.current, caseModeRef.current, speedStep));
            }
            updateBalloons([...balloonsRef.current, ...newBalloons]);
        };

        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = setInterval(spawnBalloons, config.interval);

        return () => {
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        };
    }, [gameState, score, speedStep]);

    // ── Keyboard handler ───────────────────────────────────────────────────
    const handleKeyDown = useCallback((e) => {
        if (gameState !== 'playing') return;
        if (e.key === 'Escape') { resetToConfig(); return; }

        const pressed = e.key;
        let hit = false;

        const currentBalloons = [...balloonsRef.current];
        const idx = currentBalloons.findIndex(b => !b.popping && b.key === pressed);
        
        if (idx !== -1) {
            hit = true;
            currentBalloons[idx] = { 
                ...currentBalloons[idx], 
                popping: true, 
                _removeAt: Date.now() + 300 
            };
            updateBalloons(currentBalloons);
        }

        if (hit) {
            playSuccessSound();
            recordKeyLatency(pressed.toLowerCase(), 300);

            updateScore(scoreRef.current + 1);
            updateCombo(comboRef.current + 1);
        } else {
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                playErrorSound();
                updateCombo(0);
                setShowWrongKey(true);
                setTimeout(() => setShowWrongKey(false), 500);
            }
        }
    }, [gameState]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const startGame = (keys) => {
        const k = keys || selectedKeys;
        selectedKeysRef.current = k;
        caseModeRef.current = caseMode;
        lastTierRef.current = 'Rookie';
        scoreRef.current   = 0;
        livesRef.current   = 3;
        comboRef.current   = 0;
        maxComboRef.current = 0;
        
        setScore(0); 
        setLives(3); 
        setCombo(0); 
        setMaxCombo(0);
        
        const firstBalloon = makeBalloon(k, 0, caseMode, speedStep);
        updateBalloons([firstBalloon]);
        setGameState('playing');
    };

    const resetToConfig = () => {
        updateBalloons([]);
        setGameState('config');
    };

    const handleGameOver = () => {
        const prev = parseInt(localStorage.getItem('keyPracticeHighScore') || '0');
        if (scoreRef.current > prev) {
            localStorage.setItem('keyPracticeHighScore', scoreRef.current.toString());
        }
    };

    useEffect(() => {
        if (gameState === 'gameover') handleGameOver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);

    const highScore = parseInt(localStorage.getItem('keyPracticeHighScore') || '0');
    const isNewHighScore = gameState === 'gameover' && score > highScore;

    const toggleKey = (k) => {
        setSelectedPreset(null);
        setSelectedKeys(prev => {
            if (prev.includes(k)) {
                if (prev.length === 1) return prev;
                return prev.filter(x => x !== k);
            }
            return [...prev, k];
        });
    };

    const selectAllKeys = () => {
        setSelectedPreset('All Letters');
        setSelectedKeys(ALL_KEYS);
    };

    // ── Render: Configuration Screen ──────────────────────────────────────────
    if (gameState === 'config') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-800 dark:text-slate-200 font-sans flex flex-col">
                <Navbar />
                <MobileBanner />

                <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
                    <section aria-label="Key Practice Configuration" className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl overflow-hidden">
                        
                        {/* Header */}
                        <header className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-4xl mb-3 shadow-inner select-none">
                                🎈
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Balloon Key Practice
                            </h1>
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
                                Pop ascending balloons before they escape. Drill individual key reflexes and train your slowest finger transitions.
                            </p>
                        </header>

                        <div className="space-y-6">
                            
                            {/* Preset Row Groups */}
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                                        Row Presets
                                    </label>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        Quickly load keyboard regions
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {PRESETS.map(p => {
                                        const isSelected = selectedPreset === p.label;
                                        return (
                                            <button
                                                key={p.label}
                                                type="button"
                                                onClick={() => { 
                                                    setSelectedKeys(p.keys); 
                                                    setSelectedPreset(p.label); 
                                                }}
                                                className={`p-4 rounded-xl border text-left transition-all ${
                                                    isSelected
                                                        ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-500 text-slate-900 dark:text-white ring-2 ring-sky-500/20 shadow-sm'
                                                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{p.label}</span>
                                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                        {p.keys.length} keys
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {p.desc}
                                                </div>
                                                <div className="mt-2.5 flex flex-wrap gap-1">
                                                    {p.keys.slice(0, 10).map(k => (
                                                        <span key={k} className="inline-block px-1.5 py-0.5 text-xs font-mono font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-2xs">
                                                            {k.toUpperCase()}
                                                        </span>
                                                    ))}
                                                    {p.keys.length > 10 && (
                                                        <span className="text-xs text-slate-400 self-center">+{p.keys.length - 10} more</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Case Mode & Speed Scaling */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200 block mb-2">
                                        Letter Case
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'lower', title: 'Lowercase', hint: 'a–z only' },
                                            { id: 'upper', title: 'Uppercase', hint: 'A–Z (Caps/Shift)' },
                                            { id: 'mixed', title: 'Mixed', hint: 'Dynamic Shift' }
                                        ].map(mode => {
                                            const active = caseMode === mode.id;
                                            return (
                                                <button
                                                    key={mode.id}
                                                    type="button"
                                                    onClick={() => setCaseMode(mode.id)}
                                                    className={`p-3 rounded-xl border text-center transition-all ${
                                                        active
                                                            ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-500 text-slate-900 dark:text-white ring-2 ring-sky-500/20'
                                                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{mode.title}</div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{mode.hint}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200 block mb-2">
                                        Pace Escalation
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { val: 25, title: 'Standard Pace', hint: 'Tier step every 25 pts' },
                                            { val: 15, title: 'Accelerated', hint: 'Tier step every 15 pts' }
                                        ].map(opt => {
                                            const active = speedStep === opt.val;
                                            return (
                                                <button
                                                    key={opt.val}
                                                    type="button"
                                                    onClick={() => setSpeedStep(opt.val)}
                                                    className={`p-3 rounded-xl border text-center transition-all ${
                                                        active
                                                            ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-500 text-slate-900 dark:text-white ring-2 ring-sky-500/20'
                                                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{opt.title}</div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.hint}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Interactive Mechanical Keyboard Grid */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                                        Interactive Key Selector
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            {selectedKeys.length} of {ALL_KEYS.length} keys active
                                        </span>
                                        <button
                                            type="button"
                                            onClick={selectAllKeys}
                                            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                                        >
                                            Select All
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center gap-1.5 overflow-x-auto">
                                    {KEYBOARD_ROWS.map((row, ri) => (
                                        <div key={ri} className={`flex gap-1.5 ${ri === 1 ? 'pl-4' : ri === 2 ? 'pl-8' : ''}`}>
                                            {row.map(k => {
                                                const isKeySelected = selectedKeys.includes(k);
                                                return (
                                                    <button
                                                        key={k}
                                                        type="button"
                                                        onClick={() => toggleKey(k)}
                                                        className={`w-9 h-10 sm:w-10 sm:h-11 rounded-lg font-bold text-sm uppercase transition-all flex items-center justify-center cursor-pointer select-none ${
                                                            isKeySelected
                                                                ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 shadow-md border-b-2 border-sky-800 dark:border-sky-300 active:translate-y-0.5'
                                                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 border-b-2 border-b-slate-300 dark:border-b-black/40 hover:text-slate-900 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        {k}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Launch Practice CTA */}
                            <button
                                type="button"
                                onClick={() => startGame()}
                                disabled={selectedKeys.length === 0}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    selectedKeys.length === 0
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-primary text-black hover:brightness-105 active:translate-y-0.5 shadow-md'
                                }`}
                            >
                                <span>🎈 Launch Balloon Practice</span>
                                <span className="text-xs font-normal opacity-80">({selectedKeys.length} keys active)</span>
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    // ── Render: Game Over Screen ──────────────────────────────────────────────
    if (gameState === 'gameover') {
        const finalHS = Math.max(score, parseInt(localStorage.getItem('keyPracticeHighScore') || '0'));
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-800 dark:text-slate-200 font-sans flex items-center justify-center p-6">
                <main className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl">
                        🎯
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Session Complete
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                        Balloons escaped your reach. Review your reflex stats below.
                    </p>

                    {isNewHighScore && (
                        <div className="mb-6 py-2.5 px-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                            <Trophy className="w-4 h-4" />
                            <span>New Personal High Score!</span>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Score</span>
                            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-primary mt-1">{score}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Max Combo</span>
                            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">{maxCombo}x</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Final Tier</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white mt-2">{getTierConfig(score, speedStep).name}</span>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                        Personal Best: <strong className="text-slate-900 dark:text-slate-200 font-mono text-sm">{finalHS}</strong>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => startGame()}
                            className="flex-1 py-3 px-4 bg-primary text-black rounded-xl font-bold text-sm hover:brightness-105 active:translate-y-0.5 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Play Again</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                        >
                            Telemetry
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={resetToConfig}
                        className="mt-4 w-full py-2.5 text-slate-500 dark:text-slate-400 font-medium text-xs hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Adjust Practice Keys & Pace</span>
                    </button>
                </main>
            </div>
        );
    }

    const currentTier = getTierConfig(score, speedStep);

    // ── Render: Active Game Screen ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-800 dark:text-slate-200 font-sans overflow-hidden relative select-none" style={{ userSelect: 'none' }}>
            
            {/* Wrong Key & Tier Notifications */}
            {showWrongKey && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-rose-500/90 text-white font-bold text-lg rounded-xl shadow-lg animate-bounce pointer-events-none">
                    Wrong Key!
                </div>
            )}
            {tierUpMsg && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-sky-600/95 text-white font-bold text-xl rounded-2xl shadow-2xl animate-pulse pointer-events-none">
                    {tierUpMsg}
                </div>
            )}

            {/* Top HUD */}
            <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={resetToConfig}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        title="Return to Config (Esc)"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Score</span>
                        <span className="text-2xl font-bold font-mono text-slate-900 dark:text-primary leading-tight">{score}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Lives Remaining</span>
                    <div className="text-xl tracking-wider select-none">
                        {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, 3 - lives))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {combo >= 3 && (
                        <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 text-xs font-bold animate-pulse">
                            <Zap className="w-3.5 h-3.5" />
                            <span>{combo}x Combo</span>
                        </div>
                    )}
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pace Tier</span>
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-white">{currentTier.name}</span>
                    </div>
                </div>
            </header>

            {/* Bottom Keyboard Guide */}
            <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-full text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 shadow-sm">
                <span>Case: <strong className="text-slate-900 dark:text-white font-mono uppercase">{caseMode}</strong></span>
                <span className="opacity-40">|</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">Esc</kbd> to return</span>
            </footer>

            {/* Active Floating Balloons Layer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {balloons.map(b => (
                    <div
                        key={b.id}
                        style={{
                            position: 'absolute',
                            left: `${b.x}%`,
                            top: `${b.y}%`,
                            width: b.size,
                            height: b.size,
                            backgroundColor: b.color + '26',
                            border: `2.5px solid ${b.color}`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: b.popping ? 'scale(1.6)' : 'scale(1)',
                            opacity: b.popping ? 0 : 1,
                            transition: 'transform 0.25s ease-out, opacity 0.25s ease-out',
                            boxShadow: `0 8px 24px ${b.color}40`,
                        }}
                    >
                        <span
                            style={{
                                fontWeight: 800,
                                fontSize: b.size * 0.42,
                                color: b.color,
                                fontFamily: 'Geist Mono, monospace',
                                lineHeight: 1,
                            }}
                        >
                            {b.key}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
