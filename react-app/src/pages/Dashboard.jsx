import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { Gauge, Target, Trophy, Zap, BookOpen, Medal, AtSign, Network, Globe } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="layout-container flex h-full grow flex-col">
            <Navbar />

            <main className="flex-1 px-6 py-8 lg:px-20 space-y-8">
                {/* Top Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Highest WPM"
                        icon={<Gauge size={24} />}
                        value="142"
                        trend="+4.2%"
                        subtitle="Personal record achieved 2 days ago"
                    />
                    <StatCard
                        title="Avg Accuracy"
                        icon={<Target size={24} />}
                        value="98.5"
                        valueSuffix="%"
                        trend="+0.2%"
                        subtitle="Based on your last 50 tests"
                    />
                    <StatCard
                        title="Total Wins"
                        icon={<Trophy size={24} />}
                        value="842"
                        trendLabel="#12 Rank"
                        subtitle="Top 5% of all active typists"
                    />
                </div>

                {/* Analytics & Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-primary/5 p-8 rounded-xl border border-slate-200 dark:border-primary/10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Performance Trend</h2>
                                <p className="text-sm text-slate-500">WPM over your last 10 practice tests</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                                    <span className="h-2 w-2 rounded-full bg-primary"></span> Current Trend
                                </span>
                            </div>
                        </div>
                        <div className="h-[250px] w-full relative">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 250">
                                <defs>
                                    <linearGradient id="glowGradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.3"></stop>
                                        <stop offset="100%" stopColor="#00f5d4" stopOpacity="0"></stop>
                                    </linearGradient>
                                </defs>
                                <path d="M0,180 Q100,160 200,140 T400,120 T600,80 T800,60 T1000,40 V250 H0 Z" fill="url(#glowGradient)"></path>
                                <path className="chart-glow" d="M0,180 Q100,160 200,140 T400,120 T600,80 T800,60 T1000,40" fill="none" stroke="#00f5d4" strokeLinecap="round" strokeWidth="4"></path>
                                {/* Points */}
                                <circle cx="0" cy="180" fill="#00f5d4" r="5"></circle>
                                <circle cx="200" cy="140" fill="#00f5d4" r="5"></circle>
                                <circle cx="400" cy="120" fill="#00f5d4" r="5"></circle>
                                <circle cx="600" cy="80" fill="#00f5d4" r="5"></circle>
                                <circle cx="800" cy="60" fill="#00f5d4" r="5"></circle>
                                <circle cx="1000" cy="40" fill="#00f5d4" r="5"></circle>
                            </svg>
                            <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] text-slate-500 mt-4 px-1">
                                <span>Test 1</span>
                                <span>Test 3</span>
                                <span>Test 5</span>
                                <span>Test 7</span>
                                <span>Test 9</span>
                                <span>Test 10</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-slate-200 dark:border-primary/10">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Challenges</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors cursor-pointer">
                                <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center text-primary">
                                    <Zap size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">1v1 Sprint</p>
                                    <p className="text-xs text-slate-500">Won vs @QuickKeys</p>
                                </div>
                                <p className="text-sm font-bold text-primary">128 WPM</p>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors cursor-pointer">
                                <div className="h-10 w-10 rounded bg-amber-500/20 flex items-center justify-center text-amber-500">
                                    <BookOpen size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">Classic Mode</p>
                                    <p className="text-xs text-slate-500">Practice Session</p>
                                </div>
                                <p className="text-sm font-bold text-slate-400">115 WPM</p>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors cursor-pointer">
                                <div className="h-10 w-10 rounded bg-red-500/20 flex items-center justify-center text-red-500">
                                    <Medal size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">Tournament</p>
                                    <p className="text-xs text-slate-500">Global Qualifier</p>
                                </div>
                                <p className="text-sm font-bold text-primary">141 WPM</p>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-2 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors">
                            View All Activity
                        </button>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-primary/10 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Global Leaderboard</h2>
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
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-primary">01</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img className="h-8 w-8 rounded-full border border-primary/20" alt="Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAn2MgrVu9d4njiPpNorFRqt6VcbIYXaN4wzSY0Z4_pi6TDHgAZdJDzkEhs1n9G2JUgIdPs33hM4DxLqsFNJfSP2ytbq03w5igkj08KuIW8_flONw6zOvuYMoJN_F-JmFvb1HhcvlLDElll67sQPkapGJDB9l0qRgzXu1lZL1e9RTvWPKCyk-25T8w22rY_YZl5_2ligeis4LCBFFAygjbsqIwz-ViTHYDGm8REs3rF4RtX45Ltt1FTeOzKwUBapOFu_qMRvlIAOIM" />
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">SpeedDemon_99</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">186</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">99.2%</td>
                                    <td className="px-6 py-4"><span className="h-2 w-2 rounded-full bg-primary inline-block mr-2 animate-pulse"></span><span className="text-xs text-primary">Live</span></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-400">02</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img className="h-8 w-8 rounded-full border border-primary/20" alt="Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmCZcbkv5AQCX_8lL4lKJ66OxAjOzxDhRkhA2QQmJ-KEDfl5C9D1LwsSDZxOnMMazJoHnUai9w8A2MxSjyRR4cYztYa8yzdqUcKZOEgs4bqXJjrMJE_4YoNP76e5e2n8keKYisD6lWppt0OU4tYT42AULkd-zTj5ePLoBC60QeDcrhDoIDa8gCXEy8TMS-TTn8_IMnadfoz5UI0-gHHt4MQHzFxFV3_Hg53nRcrcvvvzbiQgUcI_2K8_JNVww6yDfANYKUUemDSqw" />
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">LunarTypist</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">179</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">98.8%</td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">Offline</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-400">03</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img className="h-8 w-8 rounded-full border border-primary/20" alt="Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKm57FvjnxGUUBlXlo5d2F-Nc5S6qw-11MjNPoeEu1iztrnNR7WPbM0HzQKk3omQ7NwHpjmxS5Nf1Z_o309gJGsLBwt9Dd3aBBDK2P9Qi7UuYR8WNhlUrsiO52AzfGZJTEMs5ocPTqdVQ5c2HtZ7oQxiRcv_h1OEyKs4CPM60NCg-CeH7b_7R5BF9lva9OH-4pax1NpBtrKM_lVB5cd8fq63jhSABWTcPsC4v4Nu2wZeKTp72wCKAP4j3mEB3btnOYFoBCvvNiErI" />
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">JazzKeyz</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">175</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">99.5%</td>
                                    <td className="px-6 py-4"><span className="h-2 w-2 rounded-full bg-primary inline-block mr-2 animate-pulse"></span><span className="text-xs text-primary">Live</span></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors bg-primary/5 border-l-2 border-primary">
                                    <td className="px-6 py-4 font-bold text-primary">12</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img className="h-8 w-8 rounded-full border border-primary/20" alt="Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIxYuqaYQ076-VKGL3G2WkrOLH14fN1qhOPGOJalA8Dl-TjBhAEdNwuJ46rLRPGLZIQYdQ_1ThQPW6E268gaJI9cuM8UjnSnug-YoHfQTlmPGPzbR-Dh-0cPZWRXN79DrMWpeEbNOjuXbjV7wVN2Sw4A2LT_93jJaSRMLhpEpy9obfv4Pc617bgQGiucpF6at3RYopOagk4Wz42cDu7mMipxdx1pnJn0lU3zo7gkvt21RZouBDkBlnnXBhGo2LwfQGEA_T1oTGoec" />
                                            <span className="font-bold text-primary">Alex_Type (You)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">142</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">98.5%</td>
                                    <td className="px-6 py-4"><span className="h-2 w-2 rounded-full bg-primary inline-block mr-2 animate-pulse"></span><span className="text-xs text-primary">Live</span></td>
                                </tr>
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
