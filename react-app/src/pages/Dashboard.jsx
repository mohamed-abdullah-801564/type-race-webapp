import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { Gauge, Target, Trophy, Zap, AlertTriangle, AtSign, Network, Globe, Keyboard, Shield, Crown, Star, Medal, Play } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { loadData, saveData } from '../utils/storageUtils';
import { generateSmartDrill } from '../utils/typingUtils';
import { calculateStreak } from '../utils/achievementUtils';
import { io } from 'socket.io-client';

const SOCKET_SERVER = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const KEYBOARD_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ maxWPM: 0, avgAccuracy: 0, totalTests: 0 });
    const [performances, setPerformances] = useState({});
    const [recentWPMs, setRecentWPMs] = useState([]);
    const [recentHistory, setRecentHistory] = useState([]);
    const [hoveredDataPoint, setHoveredDataPoint] = useState(null);
    const [rankData, setRankData] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardError, setLeaderboardError] = useState(null);
    const [streakDays, setStreakDays] = useState(() => {
        const history = loadData('raceHistory', []);
        return calculateStreak(history);
    });

    const [onlineUsers, setOnlineUsers] = useState([]);
    const [incomingChallenge, setIncomingChallenge] = useState(null);
    const [socket, setSocket] = useState(null);

    const handleSendDuel = (targetUser) => {
        if (!socket) return;
        const freshRoomId = 'DUEL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        socket.emit('send_duel_challenge', { targetUid: targetUser.uid || targetUser.id, roomId: freshRoomId });
        navigate('/multiplayer', { state: { roomId: freshRoomId, isHost: true } });
    };

    const handleAcceptChallenge = () => {
        if (!incomingChallenge) return;
        navigate('/multiplayer', {
            state: {
                roomId: incomingChallenge.roomId,
                isHost: false
            }
        });
        setIncomingChallenge(null);
    };

    const TIER_STYLES = {
        Novice: { Icon: Star },
        Cadet: { Icon: Shield },
        Pro: { Icon: Zap },
        Elite: { Icon: Medal },
        Overlord: { Icon: Crown }
    };

    useEffect(() => {
        // 1. Initial Load from LocalStorage (for offline/logged-out experience)
        const loadLocalData = () => {
            // Reset to 0 before loading to prevent leakage during account switching
            setStats({ maxWPM: 0, avgAccuracy: 0, totalTests: 0 });
            setRecentHistory([]);
            setRecentWPMs([]);
            setRankData(null);
            setPerformances({});

            const history = loadData('raceHistory', []);
            const currentStreak = calculateStreak(history);
            setStreakDays(currentStreak);
            const sortedHistory = history
                .filter((h) => !h.isDrill)
                .sort((a, b) => (a.date || a.timestamp || 0) - (b.date || b.timestamp || 0));

            if (sortedHistory.length > 0) {
                const maxWPM = Math.max(...sortedHistory.map(h => h.wpm));
                const avgAcc = sortedHistory.reduce((acc, h) => acc + parseFloat(h.accuracy), 0) / sortedHistory.length;
                setStats({
                    maxWPM,
                    avgAccuracy: avgAcc.toFixed(1),
                    totalTests: sortedHistory.length
                });
                const last10 = sortedHistory.slice(-10);
                setRecentHistory(last10);
                setRecentWPMs(last10.map(h => h.wpm));
            }

            const perfs = loadData('keyPerformances', {});
            setPerformances(perfs);

            const savedRankData = loadData('rankData', null);
            if (savedRankData) setRankData(savedRankData);
        };

        loadLocalData();

        // Listen for internal hydration events (e.g., from AuthModal)
        const handleHydration = () => {
            loadLocalData();
        };
        window.addEventListener('data-hydrated', handleHydration);

        // 2. Comprehensive Sync from Cloud (Definitive Source of Truth)
        const hydrateCloud = async (uid) => {
            try {
                await auth.authStateReady();
                const userSnap = await getDoc(doc(db, 'users', uid));
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.rank) {
                        saveData('rankData', data.rank);
                    }
                    if (data.recentHistory) {
                        saveData('raceHistory', data.recentHistory);
                    }
                    loadLocalData();
                }
            } catch (err) {
                console.warn("Manual hydration failed:", err);
            }
        };

        let unsubscribeUser = () => {};
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User logged in: Reset local before hydrate to prevent leak
                setStats({ maxWPM: 0, avgAccuracy: 0, totalTests: 0 });
                setRecentHistory([]);
                setRecentWPMs([]);
                setRankData(null);
                
                await auth.authStateReady();
                hydrateCloud(user.uid);

                unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        if (data.operatorName) saveData('playerName', data.operatorName);
                        if (data.rank) {
                            saveData('rankData', data.rank);
                        }
                        if (data.recentHistory) {
                            saveData('raceHistory', data.recentHistory);
                        }
                        loadLocalData();
                    }
                });
            } else {
                // User logged out: Wipe all user-specific states
                setStats({ maxWPM: 0, avgAccuracy: 0, totalTests: 0 });
                setRecentHistory([]);
                setRecentWPMs([]);
                setRankData(null);
                loadLocalData(); // Re-load guest data
                unsubscribeUser();
            }
        });

        // 3. Global Leaderboard Query
        const q = query(
            collection(db, 'leaderboard'), 
            orderBy('wpm', 'desc'), 
            orderBy('acc', 'desc'), 
            limit(10)
        );
        const unsubscribeLeaderboard = onSnapshot(q, async (snapshot) => {
            setLeaderboardError(null);
            const lbArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Pinned Row Logic: If current user is not in Top 10, fetch their personal stat
            if (auth.currentUser && !lbArray.find(u => u.id === auth.currentUser.uid)) {
                try {
                    const userLBSnap = await getDoc(doc(db, 'leaderboard', auth.currentUser.uid));
                    if (userLBSnap.exists()) {
                        setLeaderboard([...lbArray, { id: userLBSnap.id, ...userLBSnap.data(), isPinned: true }]);
                    } else {
                        setLeaderboard(lbArray);
                    }
                } catch (err) {
                    setLeaderboard(lbArray);
                }
            } else {
                setLeaderboard(lbArray);
            }
        }, (error) => {
            console.error("Leaderboard Error:", error);
            if (error.code === 'failed-precondition') {
                setLeaderboardError('Leaderboard Initializing...');
            } else {
                setLeaderboardError('Neural Sync Interrupted');
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeUser();
            unsubscribeLeaderboard();
            window.removeEventListener('data-hydrated', handleHydration);
        };
    }, []);

    // Socket Connection and Challenge Listeners
    useEffect(() => {
        let newSocket;
        const connectSocket = async (user) => {
            try {
                const token = await user.getIdToken(true);
                newSocket = io(SOCKET_SERVER, {
                    auth: { token }
                });
                
                newSocket.on('registry_updated', (data) => {
                    setOnlineUsers(data);
                });

                newSocket.on('duel_challenged', ({ challengerName, roomId }) => {
                    setIncomingChallenge({ challengerName, roomId });
                });

                setSocket(newSocket);
            } catch (err) {
                console.error("Socket authentication failed:", err);
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                connectSocket(user);
            } else {
                if (newSocket) newSocket.disconnect();
                setSocket(null);
                setOnlineUsers([]);
            }
        });

        return () => {
            unsubscribe();
            if (newSocket) newSocket.disconnect();
        };
    }, []);

    const getKeyColor = (latency) => {
        if (!latency) return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/50';
        if (latency < 200) return 'bg-primary/10 text-primary border-primary/40 shadow-[0_0_10px_rgba(0,245,212,0.1)]';
        if (latency < 400) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/40';
        return 'bg-red-500/10 text-red-500 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
    };

    const ADAPTIVE_DRILL_STORAGE_KEY = 'adaptiveDrill';
    const COMMON_CODE_CHARS = new Set([
        ...'abcdefghijklmnopqrstuvwxyz'.split(''),
        ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
        ...'0123456789'.split(''),
        ' ', '\n', '\t',
        '{', '}', '[', ']', '(', ')',
        ';', ':', ',', '.', '=', '+', '-', '*', '/', '%',
        '<', '>', '!', '?', '&', '|', '^', '~',
        '"', "'", '`', '\\'
    ]);

    const safeParseJSON = (raw, fallback) => {
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    };

    const getWorstKeys = (perfs, weakKeys) => {
        const keys = Array.from(new Set([
            ...Object.keys(perfs || {}),
            ...Object.keys(weakKeys || {})
        ])).filter(k => typeof k === 'string' && k.length === 1);

        // FALLBACK: If no weak keys found (new user), focus on common coding symbols
        if (keys.length === 0) return ['{', '}', '[', ']', ';', '(', ')', '<', '>', '/'];

        const scored = keys.map((k) => {
            const perf = perfs?.[k] || {};
            const avg = Number(perf.avg) || 0;
            const hits = Number(perf.count) || 0;
            const errors = Number(perf.errors ?? weakKeys?.[k] ?? 0) || 0;
            const attempts = hits + errors;
            const errorRate = attempts > 0 ? errors / attempts : 0;

            // Higher score => worse key (slower + higher mistakes).
            const score = errors > 0 ? avg * errorRate : avg * 0.15;
            return { k, avg, hits, errors, errorRate, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, 3).map(s => s.k);

        // Ensure we always have 3 keys to build a stable drill template.
        while (top.length < 3) top.push(['{', '}', ';'][top.length]);
        return top.slice(0, 3);
    };

    const generateDailyDrillText = (weakKeys) => {
        return generateSmartDrill(weakKeys, 30); // Default to 30s for the quick start
    };

    const handleStartDailyDrill = () => {
        const perfs = safeParseJSON(localStorage.getItem('keyPerformances') || '{}', {});
        const weakKeys = safeParseJSON(localStorage.getItem('weakKeys') || '{}', {});

        const worstKeys = getWorstKeys(perfs, weakKeys);
        const drillText = generateDailyDrillText(worstKeys);

        const preKeyStats = {};
        for (const k of worstKeys) {
            const perf = perfs?.[k] || {};
            const hits = Number(perf.count) || 0;
            const errors = Number(perf.errors ?? weakKeys?.[k] ?? 0) || 0;
            const avg = Number(perf.avg) || 0;
            const attempts = hits + errors;
            const errorRate = attempts > 0 ? errors / attempts : 0;
            preKeyStats[k] = { avg, hits, errors, errorRate };
        }

        localStorage.setItem(
            ADAPTIVE_DRILL_STORAGE_KEY,
            JSON.stringify({
                text: drillText,
                duration: 60,
                worstKeys,
                preKeyStats,
                category: 'code',
                difficulty: 'medium',
                mode: 'standard'
            })
        );

        navigate('/solo', { state: { text: drillText } });
    };

    const handleKeyClick = (key) => {
        navigate(`/practice?key=${key}`);
    };

    const displayHistory = recentHistory;
    const maxRecentWPM = Math.max(...displayHistory.map(h => h.wpm), 100);

    const allPoints = displayHistory.map((h, index) => {
        const x = displayHistory.length > 1 ? (index / (displayHistory.length - 1)) * 1000 : 500;
        const y = 250 - (h.wpm / maxRecentWPM) * 200 - 25;
        const mode = h.mode === 'multiplayer' ? 'multiplayer' : (h.mode === 'daily' ? 'daily' : 'solo');
        return {
            x,
            y,
            wpm: h.wpm,
            acc: h.accuracy ? parseFloat(h.accuracy).toFixed(1) : '0',
            mode,
            originalIndex: index,
            index: index + 1
        };
    });

    const getModePathD = (mode) => {
        const points = allPoints.filter(p => p.mode === mode);
        if (points.length === 0) return '';
        let pathD = '';
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const prev = points[i - 1];
            const isConsecutive = prev && (p.originalIndex === prev.originalIndex + 1);
            if (!isConsecutive) {
                pathD += ` M${p.x},${p.y}`;
            } else {
                pathD += ` L${p.x},${p.y}`;
            }
        }
        return pathD.trim();
    };

    const soloPath = getModePathD('solo');
    const multiPath = getModePathD('multiplayer');
    const dailyPath = getModePathD('daily');

    const soloPoints = allPoints.filter(p => p.mode === 'solo');
    const multiPoints = allPoints.filter(p => p.mode === 'multiplayer');
    const dailyPoints = allPoints.filter(p => p.mode === 'daily');
    return (
        <div className="layout-container flex h-full grow flex-col">
            <Navbar />

            <main className="flex-1 px-4 md:px-6 py-8 lg:px-20 space-y-8">
                {/* Guest Mode Banner */}
                {!auth.currentUser && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(245,158,11,0.05)_100%)] pointer-events-none" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">Guest Mode Active</h2>
                                <p className="text-sm text-amber-500/80 font-medium">Neural Sync Required to Track Global Progress. Local sessions will be terminated on tab close.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => document.querySelector('img[alt="User Avatar"]').click()}
                            className="relative z-10 px-8 py-3 bg-amber-500 text-background-dark font-black rounded-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 transition-all active:scale-95 text-sm"
                        >
                            Establish Sync
                        </button>
                    </div>
                )}
                {/* Rank Banner */}
                {rankData && (
                    <div className="bg-slate-100 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center relative overflow-hidden shadow-[0_0_15px_rgba(0,245,212,0.1)] hover:shadow-[0_0_25px_rgba(0,245,212,0.2)] transition-shadow duration-300">
                        {/* Glow effect background */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-current pointer-events-none text-primary" />
                        
                        <div className="shrink-0 w-24 h-24 rounded-2xl border-2 flex items-center justify-center bg-primary/20 text-primary border-primary/30 shadow-[0_0_20px_rgba(0,245,212,0.4)] hover:shadow-[0_0_30px_rgba(0,245,212,0.6)] transition-all duration-300 group">
                            {(() => {
                                const IconComponent = TIER_STYLES[rankData.tier]?.Icon || Star;
                                return <IconComponent className="w-12 h-12 text-primary drop-shadow-[0_0_10px_rgba(0,245,212,0.8)] group-hover:scale-110 transition-transform duration-300" />;
                            })()}
                        </div>
                        
                        <div className="flex-1 text-center md:text-left z-10">
                            <h2 className="text-base font-bold mb-1 text-primary/70">Current Tier</h2>
                            <div className="text-4xl font-black text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(0,245,212,0.5)] mb-2">{rankData.tier}</div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                                <span>Score: <strong className="text-slate-900 dark:text-white font-bold">{rankData.score}</strong></span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                <span>Personal best: <strong className="text-slate-900 dark:text-white font-bold">{rankData.highestWPM} Wpm</strong></span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                <span className="text-primary/80 font-bold">+{Math.round(rankData.avgAcc * 0.2)} Accuracy bonus</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                <span className="text-primary/60 font-bold">+{Math.round((rankData.drillsCompleted || 0) * 0.5)} Drill multiplier</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1 animate-pulse">
                                    🔥 Streak: <strong className="text-slate-900 dark:text-white font-bold">{streakDays || 0}</strong> days active
                                </span>
                            </div>
                        </div>

                        {rankData.nextTierMax && (
                            <div className="md:ml-auto flex flex-col items-center md:items-end z-10 w-full md:w-auto mt-4 md:mt-0">
                                <span className="text-sm font-bold text-primary/70 mb-2">Distance to next</span>
                                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{rankData.nextTierMax - rankData.score} <span className="text-sm text-slate-500">Points</span></div>
                                <div className="w-full md:w-48 h-2 bg-black/10 dark:bg-black/50 rounded-full mt-2 overflow-hidden border border-slate-200 dark:border-primary/20 p-px">
                                    <div 
                                        className="h-full bg-linear-to-r from-primary to-emerald-400 drop-shadow-[0_0_10px_rgba(0,245,212,0.8)] rounded-full w-full max-w-full" 
                                        style={{ width: `${Math.min(100, (rankData.score / rankData.nextTierMax) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        {!rankData.nextTierMax && (
                            <div className="md:ml-auto flex flex-col items-center md:items-end z-10 w-full md:w-auto mt-4 md:mt-0">
                                <span className="text-sm font-bold text-primary mb-2 animate-pulse drop-shadow-[0_0_8px_rgba(0,245,212,0.5)]">Maximum rank achieved</span>
                                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono drop-shadow-[0_0_10px_rgba(0,245,212,0.8)]">Supreme</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Top Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Highest WPM"
                        icon={<Gauge size={24} />}
                        value={rankData?.highestWPM || stats.maxWPM || "0"}
                        trend="+4.2%"
                        subtitle="Your all-time peak performance"
                    />
                    <StatCard
                        title="Avg Accuracy"
                        icon={<Target size={24} />}
                        value={rankData?.avgAcc || stats.avgAccuracy || "0"}
                        valueSuffix="%"
                        trend="+0.2%"
                        subtitle={`Average over ${rankData?.totalRaces || stats.totalTests} tests`}
                    />
                    <StatCard
                        title="Total Sessions"
                        icon={<Trophy size={24} />}
                        value={rankData?.totalRaces || stats.totalTests || "0"}
                        trendLabel="Live"
                        subtitle="Solo runs completed"
                    />
                </div>

                {/* Analytics & Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-primary/5 p-8 rounded-xl border border-slate-200 dark:border-primary/10">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-primary/10">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Performance Trend</h3>
                                <p className="text-sm text-slate-500">Wpm over your last 10 practice tests</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                                    <span className="h-2 w-2 rounded-full bg-primary"></span> Performance Graph
                                </span>
                            </div>
                        </div>
                        <div className="w-full pt-12 px-6 pb-6 overflow-x-auto md:overflow-hidden">
                            <div className="min-w-[700px] md:min-w-0 md:w-full">
                            <div className="h-[250px] w-full relative overflow-visible">
                                {displayHistory.length < 2 ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/40 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                                        <Zap className="w-8 h-8 text-primary/40 mb-2 animate-pulse" />
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Play more games to see your trend</p>
                                    </div>
                                ) : (
                                    <>
                                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 250">
                                        <path d={soloPath} fill="none" stroke="#00f5d4" strokeWidth="3" strokeLinecap="round" />
                                        <path d={multiPath} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                                        <path d={dailyPath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                                        
                                        {/* Solo Points */}
                                        {soloPoints.map((p) => (
                                            <circle 
                                                key={`solo-${p.index}`} cx={p.x} cy={p.y} fill="#00f5d4" r="5" 
                                                className="drop-shadow-[0_0_8px_rgba(0,245,212,0.8)] cursor-pointer transition-all duration-300 transform-gpu hover:scale-150 origin-center"
                                                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                                                onMouseEnter={() => setHoveredDataPoint(p)}
                                                onMouseLeave={() => setHoveredDataPoint(null)}
                                            />
                                        ))}

                                        {/* Multi Points */}
                                        {multiPoints.map((p) => (
                                            <circle 
                                                key={`multi-${p.index}`} cx={p.x} cy={p.y} fill="#a855f7" r="5" 
                                                className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] cursor-pointer transition-all duration-300 transform-gpu hover:scale-150 origin-center"
                                                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                                                onMouseEnter={() => setHoveredDataPoint(p)}
                                                onMouseLeave={() => setHoveredDataPoint(null)}
                                            />
                                        ))}

                                        {/* Daily Points */}
                                        {dailyPoints.map((p) => (
                                            <circle 
                                                key={`daily-${p.index}`} cx={p.x} cy={p.y} fill="#f59e0b" r="5" 
                                                className="drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] cursor-pointer transition-all duration-300 transform-gpu hover:scale-150 origin-center"
                                                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                                                onMouseEnter={() => setHoveredDataPoint(p)}
                                                onMouseLeave={() => setHoveredDataPoint(null)}
                                            />
                                        ))}
                                    </svg>
                                    {hoveredDataPoint && (
                                        <div
                                            className={`absolute z-100 pointer-events-none transition-all duration-300 
                                                ${hoveredDataPoint.x > 700 ? '-translate-x-[110%]' : 'translate-x-[20%]'}
                                                ${hoveredDataPoint.y < 50 ? 'translate-y-[20%]' : '-translate-y-[120%]'}
                                            `}
                                            style={{
                                                left: `${(hoveredDataPoint.x / 1000) * 100}%`,
                                                top: `${(hoveredDataPoint.y / 250) * 100}%`
                                            }}
                                        >
                                            <div className="bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-white text-sm font-mono font-bold px-4 py-2 rounded-lg shadow-2xl whitespace-nowrap">
                                                <span className="text-primary">{hoveredDataPoint.mode === 'multiplayer' ? 'Multiplayer' : hoveredDataPoint.mode === 'daily' ? 'Daily' : 'Solo'}</span> | Run {hoveredDataPoint.index} | Wpm: {hoveredDataPoint.wpm} | Accuracy: {hoveredDataPoint.acc}%
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute -bottom-10 left-0 w-full flex justify-center gap-6">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                            <div className="w-2 h-2 rounded-full bg-primary"></div> Solo Mode
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                            <div className="w-2 h-2 rounded-full bg-[#a855f7]"></div> Multiplayer
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                            <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Daily Challenge
                                        </div>
                                    </div>
                                </>
                            )}
                            </div>
                            </div>
                        </div>
                    </div>

                    {/* Weakest Keys Analytics */}
                    {/* Keyboard Heatmap Analytics */}
                    <div className="lg:col-span-3 bg-white dark:bg-primary/5 p-8 rounded-xl border border-slate-200 dark:border-primary/10">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Keyboard className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Neural Heatmap</h2>
                                    <p className="text-sm text-slate-500">Visualizing character latency & motor response</p>
                                </div>
                            </div>
                            <button
                                onClick={handleStartDailyDrill}
                                className="w-full md:w-auto px-6 py-3 rounded-xl bg-primary/15 border border-primary/30 hover:bg-primary/25 hover:border-primary/50 shadow-[0_0_25px_rgba(0,245,212,0.18)] transition-all active:scale-95 flex flex-col items-center"
                            >
                                <span className="inline-flex items-center gap-2 text-sm font-black text-primary">
                                    <Zap className="w-4 h-4" />
                                    Daily Drill
                                </span>
                                {getWorstKeys(performances, safeParseJSON(localStorage.getItem('weakKeys'), {})).length > 0 && (
                                    <span className="text-sm text-slate-500 mt-1">
                                        Focus: {getWorstKeys(performances, safeParseJSON(localStorage.getItem('weakKeys'), {})).join(' ')}
                                    </span>
                                )}
                            </button>
                            
                            <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary/40"></div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">&lt;200ms</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/40"></div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">200-400ms</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/40"></div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">&gt;400ms</span>
                                </div>
                            </div>
                        </div>

                        <div className="pb-4">
                            <div className="flex flex-col gap-1 md:gap-3 items-center pt-20 pb-10 overflow-visible min-w-max">
                                {KEYBOARD_ROWS.map((row, rowIndex) => (
                                    <div 
                                        key={rowIndex} 
                                        className={`flex gap-1 md:gap-3 ${rowIndex === 1 ? 'ml-4 md:ml-12' : rowIndex === 2 ? 'ml-8 md:ml-24' : ''}`}
                                    >
                                        {row.map(key => {
                                            const data = performances[key];
                                            return (
                                                <div 
                                                    key={key}
                                                    onClick={() => handleKeyClick(key)}
                                                    className={`group relative w-8 h-8 md:w-16 md:h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ${getKeyColor(data?.avg)} font-mono`}
                                                >
                                                    <span className="text-xs md:text-xl font-black uppercase">{key}</span>
                                                    {data && (
                                                        <span className="text-[10px] md:text-xs font-bold opacity-60">{Math.round(data.avg)}ms</span>
                                                    )}
                                                    
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-32 bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-white/10 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl scale-75 group-hover:scale-100 origin-bottom">
                                                         <div className="text-sm font-black text-primary mb-1 border-b border-slate-200 dark:border-primary/20 pb-1">Key profile: {key}</div>
                                                         <div className="space-y-1">
                                                             <div className="flex justify-between text-xs">
                                                                 <span className="text-slate-500 dark:text-slate-400">Avg latency</span>
                                                                 <span className="font-bold text-slate-800 dark:text-slate-200">{data ? Math.round(data.avg) : '--'}ms</span>
                                                             </div>
                                                             <div className="flex justify-between text-xs">
                                                                 <span className="text-slate-500 dark:text-slate-400">Hits</span>
                                                                 <span className="font-bold text-slate-800 dark:text-slate-200">{data ? data.count : '0'}</span>
                                                             </div>
                                                         </div>
                                                         <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-slate-900"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10 flex justify-between items-center border-t border-white/5 pt-6">
                            <p className="text-sm font-bold text-slate-500 italic">
                                * Neural response data is calculated based on characters typed in prose and code streams.
                            </p>
                            <button
                                onClick={() => { localStorage.removeItem('keyPerformances'); setPerformances({}); }}
                                className="px-6 py-2 text-sm font-black text-red-500/60 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            >
                                Reset Neural Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-primary/10 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Season 1: Neon Genesis</h2>
                            <p className="text-sm text-slate-500">Top 10 typists this season</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-primary/10 p-1 rounded-lg">
                            <button className="px-4 py-1.5 text-sm font-bold rounded-md bg-white dark:bg-primary text-slate-900 dark:text-background-dark shadow-sm">Global</button>
                            <button className="px-4 py-1.5 text-sm font-bold rounded-md text-slate-500 dark:text-primary/70">Friends</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-primary/5">
                                    <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-primary/50">Rank</th>
                                    <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-primary/50">Typist</th>
                                    <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-primary/50">Max Wpm</th>
                                    <th className="hidden md:table-cell px-6 py-4 text-sm font-bold text-slate-500 dark:text-primary/50">Avg Accuracy</th>
                                    <th className="hidden md:table-cell px-6 py-4 text-sm font-bold text-slate-500 dark:text-primary/50">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                                {leaderboardError ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-amber-500 font-mono animate-pulse uppercase tracking-widest text-xs">
                                            {leaderboardError}
                                        </td>
                                    </tr>
                                ) : leaderboard.length > 0 ? leaderboard.map((item, index) => {
                                    const isUser = item.id === auth.currentUser?.uid;
                                    const isPinned = item.isPinned;
                                    const isOnline = onlineUsers.some(u => u.uid === item.id);
                                    
                                    return (
                                        <tr key={item.id} className={`group hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors 
                                            ${isUser ? 'bg-primary/10 border-l-4 border-primary shadow-[inset_0_0_20px_rgba(0,245,212,0.05)]' : ''}
                                            ${isPinned ? 'border-t-4 border-primary/40 bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]' : ''}
                                        `}>
                                            <td className={`px-6 py-4 font-bold ${index < 3 || isUser ? 'text-primary' : 'text-slate-400'}`}>
                                                {isPinned ? <span className="text-sm font-bold">Your rank</span> : index < 9 ? `0${index + 1}` : index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center font-bold text-primary">{item.name ? item.name[0]?.toUpperCase() : '?'}</div>
                                                    <div className="flex items-center gap-2">
                                                        {isOnline && (
                                                            <span className="relative flex h-2 w-2 shrink-0">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                        )}
                                                        {isOnline && !isUser ? (
                                                            <button
                                                                onClick={() => handleSendDuel(item)}
                                                                title="Challenge to a Duel"
                                                                className="font-semibold text-left text-slate-900 dark:text-slate-100 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <span>{item.name}</span>
                                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 text-primary border border-primary/30 text-xs px-1.5 py-0.5 rounded font-black animate-in fade-in slide-in-from-left-1 duration-200">
                                                                    Duel
                                                                </span>
                                                                {item.tier && <span className="text-sm text-primary/50">[{item.tier}]</span>}
                                                            </button>
                                                        ) : (
                                                            <span className={`font-semibold ${isUser ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>
                                                                {item.name}
                                                                {item.tier && <span className="text-sm text-primary/50 ml-2">[{item.tier}]</span>}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{item.wpm}</td>
                                            <td className="hidden md:table-cell px-6 py-4 text-slate-600 dark:text-slate-400">{item.acc}%</td>
                                            <td className="hidden md:table-cell px-6 py-4">
                                                {isOnline ? (
                                                    <>
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block mr-2 animate-pulse"></span>
                                                        <span className="text-xs text-emerald-500 font-bold">Online</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="h-2 w-2 rounded-full bg-slate-500 inline-block mr-2"></span>
                                                        <span className="text-xs text-slate-400">Offline</span>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-mono">
                                            No sync data detected on the Neural Link.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-primary/5 flex justify-center">
                        <button className="text-sm font-bold text-slate-500 dark:text-primary/70 hover:text-primary transition-colors">Load More Rankings</button>
                    </div>
                </div>
            </main>
            {incomingChallenge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/30 p-8 rounded-2xl shadow-2xl text-center space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary flex items-center justify-center text-primary shadow-[0_0_20px_rgba(0,245,212,0.3)] animate-pulse">
                            <Zap className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Neural Duel Requested</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                <strong className="text-primary">{incomingChallenge.challengerName}</strong> has challenged you to a typing duel!
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIncomingChallenge(null)}
                                className="flex-1 py-3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white font-bold rounded-xl transition-all"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAcceptChallenge}
                                className="flex-1 py-3 bg-primary text-background-dark font-black rounded-xl hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,245,212,0.4)] transition-all flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="border-t border-slate-200 dark:border-primary/10 px-6 py-8 lg:px-20 bg-white dark:bg-background-dark/80 mt-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500 text-center md:text-left">© 2024 TypeMaster Studio. Keep typing at the speed of thought.</p>
                    <div className="flex gap-6">
                        <a className="text-slate-400 hover:text-primary transition-colors" href="#"><AtSign className="w-6 h-6" /></a>
                        <a className="text-slate-400 hover:text-primary transition-colors" href="#"><Network className="w-6 h-6" /></a>
                        <a className="text-slate-400 hover:text-primary transition-colors" href="#"><Globe className="w-6 h-6" /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
