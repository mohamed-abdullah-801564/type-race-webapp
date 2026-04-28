import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { playErrorSound, playSuccessSound } from '../utils/soundUtils';
import { recordKeyLatency } from '../utils/heatmapUtils';

const ALL_KEYS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const BALLOON_COLORS = ['#00f5d4', '#a855f7', '#f59e0b', '#f87171', '#34d399'];

const PRESETS = [
    { label: 'Home Row', keys: ['a','s','d','f','g','h','j','k','l'] },
    { label: 'Top Row',  keys: ['q','w','e','r','t','y','u','i','o','p'] },
    { label: 'Bottom Row', keys: ['z','x','c','v','b','n','m'] },
    { label: 'All Keys (a-z)', keys: ALL_KEYS },
];

const KEYBOARD_ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
];

function getTierConfig(score) {
    if (score < 25) return { name: 'ROOKIE', speed: 0.3, spawnCount: 1, interval: 2000 };
    if (score < 50) return { name: 'SKILLED', speed: 0.5, spawnCount: 1, interval: 1600 };
    if (score < 75) return { name: 'EXPERT', speed: 0.7, spawnCount: 2, interval: 1400 };
    return { name: 'LEGENDARY', speed: 1.0, spawnCount: 3, interval: 1000 };
}

function makeBalloon(selectedKeys, score, caseMode) {
    const config = getTierConfig(score);
    const randomKey = selectedKeys[Math.floor(Math.random() * selectedKeys.length)];
    
    let key = randomKey;
    if (caseMode === 'upper') key = key.toUpperCase();
    else if (caseMode === 'mixed') key = Math.random() > 0.5 ? key.toUpperCase() : key.toLowerCase();
    else key = key.toLowerCase();

    return {
        id: Date.now() + Math.random(),
        key,
        x: 5 + Math.random() * 85,
        y: 110,
        speed: config.speed + Math.random() * 0.2,
        color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
        size: 60 + Math.floor(Math.random() * 31),
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
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [caseMode, setCaseMode]         = useState('lower'); // lower | upper | mixed
    const [showWrongKey, setShowWrongKey] = useState(false);
    const [tierUpMsg, setTierUpMsg]       = useState('');

    const scoreRef        = useRef(0);
    const livesRef        = useRef(3);
    const comboRef        = useRef(0);
    const maxComboRef     = useRef(0);
    const selectedKeysRef = useRef(ALL_KEYS);
    const balloonsRef     = useRef([]);
    const spawnIntervalRef = useRef(null);
    const caseModeRef     = useRef('lower');
    const lastTierRef     = useRef('ROOKIE');

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
        const newTier = getTierConfig(newS).name;
        if (newTier !== lastTierRef.current) {
            lastTierRef.current = newTier;
            setTierUpMsg(`TIER UP! — ${newTier}`);
            setTimeout(() => setTierUpMsg(''), 1000);
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

        const config = getTierConfig(scoreRef.current);
        
        const spawnBalloons = () => {
            const newBalloons = [];
            for (let i = 0; i < config.spawnCount; i++) {
                newBalloons.push(makeBalloon(selectedKeysRef.current, scoreRef.current, caseModeRef.current));
            }
            updateBalloons([...balloonsRef.current, ...newBalloons]);
        };

        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = setInterval(spawnBalloons, config.interval);

        return () => {
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        };
    }, [gameState, score]);

    // ── Keyboard handler ───────────────────────────────────────────────────
    const handleKeyDown = useCallback((e) => {
        if (gameState !== 'playing') return;
        if (e.key === 'Escape') { resetToConfig(); return; }

        const pressed = e.key; // Use exact case
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
            // Check if it's a character key or wrong case
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
        lastTierRef.current = 'ROOKIE';
        scoreRef.current   = 0;
        livesRef.current   = 3;
        comboRef.current   = 0;
        maxComboRef.current = 0;
        
        setScore(0); 
        setLives(3); 
        setCombo(0); 
        setMaxCombo(0);
        
        const firstBalloon = makeBalloon(k, 0, caseMode);
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

    // ── Render: Config ─────────────────────────────────────────────────────
    if (gameState === 'config') {
        return (
            <div className="min-h-screen bg-background-dark text-slate-300 font-sans selection:bg-primary/30 selection:text-primary flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50" />
                <Navbar />

                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl overflow-y-auto max-h-[85vh] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="text-center mb-10">
                            <div className="text-6xl mb-4 animate-bounce">🎈</div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Key Practice</h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                Pop the balloons before they escape — train your weakest keys
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Quick Launch</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {PRESETS.map(p => (
                                        <button
                                            key={p.label}
                                            onClick={() => { 
                                                setSelectedKeys(p.keys); 
                                                setSelectedPreset(p.label); 
                                            }}
                                            className={`py-4 px-5 rounded-xl border-2 transition-all text-left ${
                                                selectedPreset === p.label 
                                                ? 'bg-primary/20 border-primary text-primary' 
                                                : 'bg-white/5 border-transparent text-slate-300 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="uppercase tracking-tight font-black text-sm">{p.label}</div>
                                            <div className={`text-[10px] font-mono mt-1 ${selectedPreset === p.label ? 'text-primary/70' : 'text-slate-500'}`}>
                                                {p.keys.join(' ')}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Case Mode</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'lower', label: 'Lowercase Only' },
                                        { id: 'upper', label: 'Uppercase Only' },
                                        { id: 'mixed', label: 'Mixed (Shift Required)' }
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setCaseMode(mode.id)}
                                            className={`py-3 px-4 rounded-xl border-2 transition-all text-center text-[10px] font-black uppercase tracking-widest ${
                                                caseMode === mode.id
                                                ? 'bg-primary/20 border-primary text-primary'
                                                : 'bg-white/5 border-transparent text-slate-500 hover:border-white/10'
                                            }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Custom Key Set</label>
                                <div className="flex flex-col gap-2 items-center">
                                    {KEYBOARD_ROWS.map((row, ri) => (
                                        <div key={ri} className={`flex gap-2 ${ri === 1 ? 'ml-8' : ri === 2 ? 'ml-16' : ''}`}>
                                            {row.map(k => (
                                                <button
                                                    key={k}
                                                    onClick={() => toggleKey(k)}
                                                    className={`w-10 h-10 rounded-lg border-2 font-black text-sm uppercase transition-all ${
                                                        selectedKeys.includes(k)
                                                            ? 'bg-primary text-black border-primary shadow-[0_0_10px_rgba(0,245,212,0.4)]'
                                                            : 'bg-white/5 text-slate-500 border-transparent hover:border-white/20'
                                                    }`}
                                                >
                                                    {k}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-center text-[10px] text-slate-600 mt-3 uppercase tracking-widest font-bold">
                                    {selectedKeys.length} keys selected
                                </p>
                            </div>

                            <button
                                onClick={() => startGame()}
                                disabled={selectedKeys.length === 0}
                                className={`w-full py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_30px_rgba(0,245,212,0.4)] flex items-center justify-center gap-3 text-sm ${
                                    selectedKeys.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
                                }`}
                            >
                                🎈 Launch Practice
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (gameState === 'gameover') {
        const finalHS = Math.max(score, parseInt(localStorage.getItem('keyPracticeHighScore') || '0'));
        return (
            <div className="min-h-screen bg-background-dark text-slate-300 font-sans flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50" />

                <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl animate-in zoom-in fade-in duration-500 text-center">
                    <div className="text-5xl mb-4">💀</div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">Game Over</h2>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-8">All lives lost</p>

                    {isNewHighScore && (
                        <div className="mb-6 py-3 px-6 bg-primary/20 border border-primary/40 rounded-2xl animate-pulse">
                            <span className="text-primary font-black uppercase tracking-widest text-sm">🏆 New High Score!</span>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Score</span>
                            <span className="text-3xl font-black font-mono text-primary">{score}</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Max Combo</span>
                            <span className="text-3xl font-black font-mono text-white">{maxCombo}x</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tier</span>
                            <span className="text-sm font-black text-white uppercase mt-2">{getTierConfig(score).name}</span>
                        </div>
                    </div>

                    <div className="mb-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        High Score: <span className="text-primary">{finalHS}</span>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => startGame()}
                            className="flex-1 py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)]"
                        >
                            Play Again
                        </button>
                        <button
                            onClick={() => navigate('/achievements')}
                            className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                        >
                            Achievements
                        </button>
                    </div>

                    <button
                        onClick={resetToConfig}
                        className="mt-4 w-full py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                    >
                        ← Back to Config
                    </button>
                </div>
            </div>
        );
    }

    const currentTier = getTierConfig(score);

    return (
        <div className="min-h-screen bg-background-dark text-slate-300 font-sans overflow-hidden relative select-none" style={{ userSelect: 'none' }}>
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50" />

            {/* Notifications */}
            {showWrongKey && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 text-red-500 font-black text-4xl animate-bounce tracking-tighter uppercase italic">
                    WRONG KEY!
                </div>
            )}
            {tierUpMsg && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-primary font-black text-5xl animate-pulse tracking-tighter uppercase text-center drop-shadow-[0_0_30px_#00f5d4]">
                    {tierUpMsg}
                </div>
            )}

            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-4 bg-black/40 backdrop-blur-md border-b border-white/5">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Score</span>
                    <span className="text-2xl font-black font-mono text-primary">{score}</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Lives</span>
                    <div className="text-2xl tracking-widest">
                        {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, 3 - lives))}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tier</span>
                            <span className="text-2xl font-black font-mono text-white">{currentTier.name}</span>
                        </div>
                    </div>
                    {combo >= 3 && (
                        <div className="text-sm font-black text-primary animate-pulse tracking-widest">
                            🔥 x{combo} COMBO
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] text-center">
                Match the case: {caseMode.toUpperCase()} mode · ESC to exit
            </div>

            <div className="absolute inset-0 overflow-hidden">
                {balloons.map(b => (
                    <div
                        key={b.id}
                        style={{
                            position: 'absolute',
                            left: `${b.x}%`,
                            top: `${b.y}%`,
                            width: b.size,
                            height: b.size,
                            backgroundColor: b.color + '33',
                            border: `2px solid ${b.color}`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: b.popping ? 'scale(1.5)' : 'scale(1)',
                            opacity: b.popping ? 0 : 1,
                            transition: 'transform 0.3s ease, opacity 0.3s ease',
                            boxShadow: `0 0 20px ${b.color}55`,
                            cursor: 'default',
                        }}
                    >
                        <span
                            style={{
                                fontWeight: 900,
                                fontSize: b.size * 0.38,
                                color: b.color,
                                fontFamily: 'monospace',
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
