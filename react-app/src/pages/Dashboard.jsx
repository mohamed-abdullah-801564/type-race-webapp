import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { Gauge, Target, Trophy, Zap, AlertTriangle, AtSign, Network, Globe, Keyboard } from 'lucide-react';

const KEYBOARD_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

export default function Dashboard() {
    const [stats, setStats] = useState({ maxWPM: 0, avgAccuracy: 0, totalTests: 0 });
    const [performances, setPerformances] = useState({});
    const [recentWPMs, setRecentWPMs] = useState([]);
    const [recentHistory, setRecentHistory] = useState([]);
    const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

    useEffect(() => {
        // Load Race History
        const history = JSON.parse(localStorage.getItem('raceHistory') || '[]');
        if (history.length > 0) {
            const maxWPM = Math.max(...history.map(h => h.wpm));
            const avgAcc = history.reduce((acc, h) => acc + parseFloat(h.accuracy), 0) / history.length;
            setStats({
                maxWPM,
                avgAccuracy: avgAcc.toFixed(1),
                totalTests: history.length
            });
            const last10 = history.slice(-10);
            setRecentHistory(last10);
            setRecentWPMs(last10.map(h => h.wpm));
        }

        // Load Key Performances
        const perfs = JSON.parse(localStorage.getItem('keyPerformances') || '{}');
        setPerformances(perfs);
    }, []);

    const getKeyColor = (latency) => {
        if (!latency) return 'bg-slate-800/40 text-slate-600 border-slate-700/50';
        if (latency < 200) return 'bg-primary/10 text-primary border-primary/40 shadow-[0_0_10px_rgba(0,245,212,0.1)]';
        if (latency < 400) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/40';
        return 'bg-red-500/10 text-red-500 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
    };

    // Graph Calculation
    const maxRecentWPM = Math.max(...recentWPMs, 100);
    const points = recentWPMs.map((wpm, i) => ({
        x: recentWPMs.length > 1 ? (i / (recentWPMs.length - 1)) * 1000 : 500,
        y: 250 - (wpm / maxRecentWPM) * 200 - 25,
        wpm: wpm,
        acc: recentHistory[i] ? parseFloat(recentHistory[i].accuracy).toFixed(1) : 0
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
                {/* Top Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Highest WPM"
                        icon={<Gauge size={24} />}
                        value={stats.maxWPM || "0"}
                        trend="+4.2%"
                        subtitle="Your all-time peak performance"
                    />
                    <StatCard
                        title="Avg Accuracy"
                        icon={<Target size={24} />}
                        value={stats.avgAccuracy || "0"}
                        valueSuffix="%"
                        trend="+0.2%"
                        subtitle={`Average over ${stats.totalTests} tests`}
                    />
                    <StatCard
                        title="Total Sessions"
                        icon={<Trophy size={24} />}
                        value={stats.totalTests || "0"}
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
                                {recentWPMs.length < 2 ? (
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
                                            className={`absolute z-[100] pointer-events-none transition-all duration-300 
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
                                                className={`group relative w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-help ${getKeyColor(data?.avg)} font-mono`}
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
                                {[
                                    { rank: '01', name: 'SpeedDemon_99', wpm: 186, accuracy: '99.2%', status: 'Live', isUser: false, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn2MgrVu9d4njiPpNorFRqt6VcbIYXaN4wzSY0Z4_pi6TDHgAZdJDzkEhs1n9G2JUgIdPs33hM4DxLqsFNJfSP2ytbq03w5igkj08KuIW8_flONw6zOvuYMoJN_F-JmFvb1HhcvlLDElll67sQPkapGJDB9l0qRgzXu1lZL1e9RTvWPKCyk-25T8w22rY_YZl5_2ligeis4LCBFFAygjbsqIwz-ViTHYDGm8REs3rF4RtX45Ltt1FTeOzKwUBapOFu_qMRvlIAOIM' },
                                    { rank: '02', name: 'LunarTypist', wpm: 179, accuracy: '98.8%', status: 'Offline', isUser: false, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmCZcbkv5AQCX_8lL4lKJ66OxAjOzxDhRkhA2QQmJ-KEDfl5C9D1LwsSDZxOnMMazJoHnUai9w8A2MxSjyRR4cYztYa8yzdqUcKZOEgs4bqXJjrMJE_4YoNP76e5e2n8keKYisD6lWppt0OU4tYT42AULkd-zTj5ePLoBC60QeDcrhDoIDa8gCXEy8TMS-TTn8_IMnadfoz5UI0-gHHt4MQHzFxFV3_Hg53nRcrcvvvzbiQgUcI_2K8_JNVww6yDfANYKUUemDSqw' },
                                    { rank: '03', name: 'JazzKeyz', wpm: 175, accuracy: '99.5%', status: 'Live', isUser: false, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKm57FvjnxGUUBlXlo5d2F-Nc5S6qw-11MjNPoeEu1iztrnNR7WPbM0HzQKk3omQ7NwHpjmxS5Nf1Z_o309gJGsLBwt9Dd3aBBDK2P9Qi7UuYR8WNhlUrsiO52AzfGZJTEMs5ocPTqdVQ5c2HtZ7oQxiRcv_h1OEyKs4CPM60NCg-CeH7b_7R5BF9lva9OH-4pax1NpBtrKM_lVB5cd8fq63jhSABWTcPsC4v4Nu2wZeKTp72wCKAP4j3mEB3btnOYFoBCvvNiErI' },
                                    { rank: '12', name: `${localStorage.getItem('playerName') || 'Guest'} (You)`, wpm: stats.maxWPM || 0, accuracy: `${stats.avgAccuracy || 0}%`, status: 'Live', isUser: true, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIxYuqaYQ076-VKGL3G2WkrOLH14fN1qhOPGOJalA8Dl-TjBhAEdNwuJ46rLRPGLZIQYdQ_1ThQPW6E268gaJI9cuM8UjnSnug-YoHfQTlmPGPzbR-Dh-0cPZWRXN79DrMWpeEbNOjuXbjV7wVN2Sw4A2LT_93jJaSRMLhpEpy9obfv4Pc617bgQGiucpF6at3RYopOagk4Wz42cDu7mMipxdx1pnJn0lU3zo7gkvt21RZouBDkBlnnXBhGo2LwfQGEA_T1oTGoec' },
                                ].map((item, index) => (
                                    <tr key={index} className={`hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors ${item.isUser ? 'bg-primary/10 border-l-4 border-primary shadow-[inset_0_0_20px_rgba(0,245,212,0.05)]' : ''}`}>
                                        <td className={`px-6 py-4 font-bold ${item.rank === '01' || item.isUser ? 'text-primary' : 'text-slate-400'}`}>{item.rank}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img className="h-8 w-8 rounded-full border border-primary/20" alt="Avatar" src={item.avatar} />
                                                <span className={`font-semibold ${item.isUser ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{item.wpm}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.accuracy}</td>
                                        <td className="px-6 py-4">
                                            {item.status === 'Live' ? (
                                                <>
                                                    <span className="h-2 w-2 rounded-full bg-primary inline-block mr-2 animate-pulse"></span>
                                                    <span className="text-xs text-primary">Live</span>
                                                </>
                                            ) : (
                                                <span className="text-400 text-xs">Offline</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
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
