import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { Gauge, Target, Trophy, Zap, AlertTriangle, AtSign, Network, Globe, Keyboard, Shield, Crown, Star, Medal } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { loadData, saveData } from '../utils/storageUtils';
import { generateSmartDrill } from '../utils/typingUtils';

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
            const nonDrillHistory = history.filter((h) => !h.isDrill);

            if (nonDrillHistory.length > 0) {
                const maxWPM = Math.max(...nonDrillHistory.map(h => h.wpm));
                const avgAcc = nonDrillHistory.reduce((acc, h) => acc + parseFloat(h.accuracy), 0) / nonDrillHistory.length;
                setStats({
                    maxWPM,
                    avgAccuracy: avgAcc.toFixed(1),
                    totalTests: nonDrillHistory.length
                });
                const last10 = nonDrillHistory.slice(-10);
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
                const userSnap = await getDoc(doc(db, 'users', uid));
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.rank) setRankData(data.rank);
                }
            } catch (err) {
                console.warn("Manual hydration failed:", err);
            }
        };

        let unsubscribeUser = () => {};
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                // User logged in: Reset local before hydrate to prevent leak
                setStats({ maxWPM: 0, avgAccuracy: 0, totalTests: 0 });
                setRecentHistory([]);
                setRecentWPMs([]);
                setRankData(null);
                
                hydrateCloud(user.uid);

                unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        if (data.operatorName) saveData('playerName', data.operatorName);
                        if (data.rank) {
                            saveData('rankData', data.rank);
                            setRankData(data.rank);
                        }
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

    const getKeyColor = (latency) => {
        if (!latency) return 'bg-slate-800/40 text-slate-600 border-slate-700/50';
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
        const drillText = generateSmartDrill(key, 30);
        navigate('/solo', { state: { text: drillText } });
    };

    // Graph Logic Fix — no demo data; show empty state for new users
    const displayHistory = recentHistory.length > 0 ? [...recentHistory].reverse() : [];
    const graphWPMs = displayHistory.map(h => h.wpm);

    const maxRecentWPM = Math.max(...graphWPMs, 100);
    const points = graphWPMs.map((wpm, i) => ({
        x: graphWPMs.length > 1 ? (i / (graphWPMs.length - 1)) * 1000 : 500,
        y: 250 - (wpm / maxRecentWPM) * 200 - 25,
        wpm: wpm,
        acc: displayHistory[i] ? parseFloat(displayHistory[i].accuracy).toFixed(1) : 0
    }));

    const pathD = points.length >= 2 
        ? `M${points[0].x},${points[0].y} ${points.slice(1).map(p => `L${p.x},${p.y}`).join(' ')}`
        : "";

    const fillD = points.length >= 2
        ? `${pathD} V250 H${points[0].x} Z`
        : "";
    return (
        <div className="layout-container flex h-full grow flex-col">
            <Navbar />

            <main className="flex-1 px-6 py-8 lg:px-20 space-y-8">
                {/* Guest Mode Banner */}
                {!auth.currentUser && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(245,158,11,0.05)_100%)] pointer-events-none" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tighter">Guest Mode Active</h2>
                                <p className="text-sm text-amber-500/80 font-medium">Neural Sync Required to Track Global Progress. Local sessions will be terminated on tab close.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => document.querySelector('img[alt="User Avatar"]').click()}
                            className="relative z-10 px-8 py-3 bg-amber-500 text-background-dark font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 transition-all active:scale-95 text-xs"
                        >
                            Establish Sync
                        </button>
                    </div>
                )}
                {/* Rank Banner */}
                {rankData && (
                    <div className="bg-slate-900 border border-primary/20 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-[0_0_15px_rgba(0,245,212,0.1)] hover:shadow-[0_0_25px_rgba(0,245,212,0.2)] transition-shadow duration-300">
                        {/* Glow effect background */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-current pointer-events-none text-primary" />
                        
                        <div className="shrink-0 w-24 h-24 rounded-2xl border-2 flex items-center justify-center bg-primary/20 text-primary border-primary/30 shadow-[0_0_20px_rgba(0,245,212,0.4)] hover:shadow-[0_0_30px_rgba(0,245,212,0.6)] transition-all duration-300 group">
                            {(() => {
                                const IconComponent = TIER_STYLES[rankData.tier]?.Icon || Star;
                                return <IconComponent className="w-12 h-12 text-primary drop-shadow-[0_0_10px_rgba(0,245,212,0.8)] group-hover:scale-110 transition-transform duration-300" />;
                            })()}
                        </div>
                        
                        <div className="flex-1 text-center md:text-left z-10">
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-1 text-primary/70">Current Tier</h2>
                            <div className="text-4xl font-black text-primary uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(0,245,212,0.5)] mb-2">{rankData.tier}</div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-slate-400">
                                <span>Score: <strong className="text-white">{rankData.score}</strong></span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span>PB: <strong className="text-white">{rankData.highestWPM} WPM</strong></span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className="text-primary/80">+{Math.round(rankData.avgAcc * 0.2)} Acc Bonus</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className="text-primary/60">+{Math.round((rankData.drillsCompleted || 0) * 0.5)} Drill Multiplier</span>
                            </div>
                        </div>

                        {rankData.nextTierMax && (
                            <div className="md:ml-auto flex flex-col items-center md:items-end z-10 w-full md:w-auto mt-4 md:mt-0">
                                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-2">Distance to Next</span>
                                <div className="text-2xl font-black text-white font-mono">{rankData.nextTierMax - rankData.score} <span className="text-sm text-slate-500">Points</span></div>
                                <div className="w-full md:w-48 h-2 bg-black/50 rounded-full mt-2 overflow-hidden border border-primary/20 p-px">
                                    <div 
                                        className="h-full bg-gradient-to-r from-primary to-emerald-400 drop-shadow-[0_0_10px_rgba(0,245,212,0.8)] rounded-full w-full max-w-full" 
                                        style={{ width: `${Math.min(100, (rankData.score / rankData.nextTierMax) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        {!rankData.nextTierMax && (
                            <div className="md:ml-auto flex flex-col items-center md:items-end z-10 w-full md:w-auto mt-4 md:mt-0">
                                <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 animate-pulse drop-shadow-[0_0_8px_rgba(0,245,212,0.5)]">Maximum Rank Achieved</span>
                                <div className="text-2xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(0,245,212,0.8)]">SUPREME</div>
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
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Performance Trend</h3>
                                <p className="text-sm text-slate-500">WPM over your last 10 practice tests</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                                    <span className="h-2 w-2 rounded-full bg-primary"></span> Current Trend
                                </span>
                            </div>
                        </div>
                        <div className="w-full pt-12 px-6 pb-6 overflow-visible">
                            <div className="h-[250px] w-full relative overflow-visible">
                                {points.length < 2 ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 rounded-xl border border-dashed border-white/10">
                                        <Zap className="w-8 h-8 text-primary/40 mb-2 animate-pulse" />
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Play more games to see your trend</p>
                                    </div>
                                ) : (
                                    <>
                                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 250">
                                        <defs>
                                            <linearGradient id="glowGradient" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.3"></stop>
                                                <stop offset="100%" stopColor="#00f5d4" stopOpacity="0"></stop>
                                            </linearGradient>
                                        </defs>
                                        <path d={fillD} fill="url(#glowGradient)"></path>
                                        <path className="chart-glow" d={pathD} fill="none" stroke="#00f5d4" strokeLinecap="round" strokeWidth="4"></path>
                                        {/* Points */}
                                        {points.map((p, i) => (
                                            <circle 
                                                key={i} 
                                                cx={p.x} 
                                                cy={p.y} 
                                                fill="#00f5d4" 
                                                r="6" 
                                                className="drop-shadow-[0_0_8px_rgba(0,245,212,0.8)] cursor-pointer transition-all duration-300 transform-gpu hover:scale-150 origin-center"
                                                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                                                onMouseEnter={() => setHoveredDataPoint({ ...p, index: i + 1 })}
                                                onMouseLeave={() => setHoveredDataPoint(null)}
                                            ></circle>
                                        ))}

                                        {/* Dynamic Tooltip */}
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
                                            <div className="bg-slate-900 border border-primary text-white text-xs font-mono font-bold px-4 py-2 rounded-lg shadow-2xl whitespace-nowrap">
                                                Run {hoveredDataPoint.index} | WPM: {hoveredDataPoint.wpm} | Acc: {hoveredDataPoint.acc}%
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute -bottom-6 left-0 w-full flex justify-between text-[10px] text-slate-500 px-1 font-mono">
                                        {points.map((_, i) => (
                                            <span key={i}>Run {i + 1}</span>
                                        ))}
                                    </div>
                                </>
                            )}
                            </div>
                        </div>
                    </div>

                    {/* Weakest Keys Analytics */}
                    {/* Keyboard Heatmap Analytics */}
                    <div className="lg:col-span-3 bg-white dark:bg-primary/5 p-8 rounded-xl border border-slate-200 dark:border-primary/10">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Keyboard className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Neural Heatmap</h2>
                                    <p className="text-sm text-slate-500">Visualizing character latency & motor response</p>
                                </div>
                            </div>
                            <button
                                onClick={handleStartDailyDrill}
                                className="px-6 py-3 rounded-xl bg-primary/15 border border-primary/30 hover:bg-primary/25 hover:border-primary/50 shadow-[0_0_25px_rgba(0,245,212,0.18)] transition-all active:scale-95 flex flex-col items-center"
                            >
                                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                    <Zap className="w-4 h-4" />
                                    Daily Drill
                                </span>
                                {getWorstKeys(performances, safeParseJSON(localStorage.getItem('weakKeys'), {})).length > 0 && (
                                    <span className="text-[8px] text-slate-500 mt-1 uppercase tracking-tighter">
                                        Focus: {getWorstKeys(performances, safeParseJSON(localStorage.getItem('weakKeys'), {})).join(' ')}
                                    </span>
                                )}
                            </button>
                            
                            <div className="flex gap-4 items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary/40"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">&lt;200ms</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/40"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">200-400ms</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/40"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">&gt;400ms</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 items-center pt-20 pb-10 overflow-visible">
                            {KEYBOARD_ROWS.map((row, rowIndex) => (
                                <div 
                                    key={rowIndex} 
                                    className={`flex gap-3 ${rowIndex === 1 ? 'ml-12' : rowIndex === 2 ? 'ml-24' : ''}`}
                                >
                                    {row.map(key => {
                                        const data = performances[key];
                                        return (
                                            <div 
                                                key={key}
                                                onClick={() => handleKeyClick(key)}
                                                className={`group relative w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ${getKeyColor(data?.avg)} font-mono`}
                                            >
                                                <span className="text-xl font-black uppercase">{key}</span>
                                                {data && (
                                                    <span className="text-[8px] font-bold opacity-60">{Math.round(data.avg)}ms</span>
                                                )}
                                                
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-32 bg-slate-900 text-white p-3 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl scale-75 group-hover:scale-100 origin-bottom">
                                                    <div className="text-[10px] font-black text-primary uppercase mb-1 border-b border-primary/20 pb-1">Key Profile: {key}</div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-400">Avg Latency</span>
                                                            <span className="font-bold">{data ? Math.round(data.avg) : '--'}ms</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-400">Hits</span>
                                                            <span className="font-bold">{data ? data.count : '0'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 flex justify-between items-center border-t border-white/5 pt-6">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                                * Neural response data is calculated based on characters typed in prose and code streams.
                            </p>
                            <button
                                onClick={() => { localStorage.removeItem('keyPerformances'); setPerformances({}); }}
                                className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-red-500/60 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
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
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Season 1: Neon Genesis</h2>
                            <p className="text-sm text-slate-500">Top 10 typists this season</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-primary/10 p-1 rounded-lg">
                            <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-white dark:bg-primary text-slate-900 dark:text-background-dark shadow-sm">Global</button>
                            <button className="px-4 py-1.5 text-xs font-bold rounded-md text-slate-500 dark:text-primary/70">Friends</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-primary/5">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-primary/50 uppercase">Rank</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-primary/50 uppercase">Typist</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-primary/50 uppercase">Max WPM</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-primary/50 uppercase">Avg Accuracy</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-primary/50 uppercase">Status</th>
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
                                    
                                    return (
                                        <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors 
                                            ${isUser ? 'bg-primary/10 border-l-4 border-primary shadow-[inset_0_0_20px_rgba(0,245,212,0.05)]' : ''}
                                            ${isPinned ? 'border-t-4 border-primary/40 bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]' : ''}
                                        `}>
                                            <td className={`px-6 py-4 font-bold ${index < 3 || isUser ? 'text-primary' : 'text-slate-400'}`}>
                                                {isPinned ? <span className="text-[10px] uppercase">Your Rank</span> : index < 9 ? `0${index + 1}` : index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center font-bold text-primary">{item.name ? item.name[0]?.toUpperCase() : '?'}</div>
                                                    <span className={`font-semibold ${isUser ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>{item.name} {item.tier && <span className="text-[10px] text-primary/50 ml-2">[{item.tier}]</span>}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{item.wpm}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.acc}%</td>
                                            <td className="px-6 py-4">
                                                <span className="h-2 w-2 rounded-full bg-primary inline-block mr-2 animate-pulse"></span>
                                                <span className="text-xs text-primary">Live</span>
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
                        <button className="text-xs font-bold text-slate-500 dark:text-primary/70 uppercase tracking-widest hover:text-primary transition-colors">Load More Ranking</button>
                    </div>
                </div>
            </main>

            <footer className="border-t border-slate-200 dark:border-primary/10 px-6 py-8 lg:px-20 bg-white dark:bg-background-dark/80 mt-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">© 2024 TypeMaster Studio. Keep typing at the speed of thought.</p>
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
