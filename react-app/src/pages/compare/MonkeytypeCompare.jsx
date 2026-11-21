import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { 
    Check, 
    X, 
    Zap, 
    Users, 
    GraduationCap, 
    Activity, 
    ArrowRight, 
    ChevronDown, 
    Sparkles, 
    ShieldCheck, 
    Code2,
    Trophy
} from 'lucide-react';

const COMPARISON_DATA = [
    { feature: 'Real-Time Multiplayer Races', typemaster: 'Sub-50ms WebSocket Lobbies', monkeytype: 'Solo Only (Experimental P2P)' },
    { feature: 'Interactive Touch Typing Academy', typemaster: '16 Modules with Hand Guides', monkeytype: 'None (Self-Directed Practice)' },
    { feature: 'Anatomical 10-Finger Visualizer', typemaster: 'Active Vector Finger Highlights', monkeytype: 'None' },
    { feature: 'Weak-Key Latency Heatmap', typemaster: 'Millisecond Keystroke Telemetry', monkeytype: 'Basic Error Frequencies' },
    { feature: 'Developer Code Syntax Practice', typemaster: 'JavaScript, Python, React, SQL', monkeytype: 'Custom User Wordlists' },
    { feature: 'Balloon Reflex Mini-Game', typemaster: 'Included (Target Weak Keys)', monkeytype: 'None' },
    { feature: 'Ghost Playback & Vault', typemaster: 'Built-In Keystroke Stream', monkeytype: 'Pace Caret & Replay' },
    { feature: 'Pricing & Ads', typemaster: '100% Free, Zero Ads', monkeytype: '100% Free, Zero Ads' },
    { feature: 'Desktop Standalone Client', typemaster: 'Windows Electron Client', monkeytype: 'Web Only / PWA' }
];

const FAQS = [
    {
        q: 'Why choose TypeMaster over Monkeytype?',
        a: 'While Monkeytype excels at minimalist solo word drills, TypeMaster is built for typists who want live competitive multiplayer races, a structured 16-stage touch typing academy with anatomical finger guides, and precision millisecond latency heatmaps to diagnose weak keys.'
    },
    {
        q: 'Is TypeMaster completely free like Monkeytype?',
        a: 'Yes. TypeMaster is 100% free with no paywalls, subscriptions, or banner ads. All multiplayer rooms, training academy drills, telemetry heatmaps, and ghost vaults are accessible to everyone without cost.'
    },
    {
        q: 'Can I practice coding syntax on TypeMaster?',
        a: 'Yes. TypeMaster features dedicated developer syntax streams for JavaScript, Python, SQL, and React JSX, allowing software engineers to build muscle memory for brackets, operators, and indentation.'
    },
    {
        q: 'How does the Touch Typing Academy compare to Monkeytype?',
        a: 'Monkeytype assumes you already know how to touch type and provides words to type. TypeMaster includes an interactive academy that teaches complete beginners proper finger placement from the Home Row through advanced punctuation with animated anatomical hands and strict error blocking.'
    }
];

export default function MonkeytypeCompare() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(0);

    useEffect(() => {
        document.title = 'Monkeytype Alternative — TypeMaster vs Monkeytype Comparison';
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-800 dark:text-slate-200 font-sans flex flex-col">
            <Navbar />

            {/* Schema.org Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "TypeMaster vs Monkeytype Comparison",
                "url": "https://type-race-webapp-x8jw.vercel.app/compare/monkeytype-alternative",
                "description": "Comprehensive comparison between TypeMaster and Monkeytype evaluating real-time multiplayer racing, touch typing academy hand guides, and keystroke latency heatmaps.",
                "applicationCategory": "EducationalApplication, GameApplication",
                "operatingSystem": "All",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                }
            }) }} />

            <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col">
                
                {/* Hero Header */}
                <header className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-700 dark:text-sky-300 mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Platform Comparison · 2026 Edition</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.2]">
                        The Modern Monkeytype Alternative with Real-Time Multiplayer
                    </h1>

                    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-4 leading-relaxed font-normal">
                        Monkeytype is renowned for solo word tests. TypeMaster takes typing to the next level with sub-50ms WebSocket multiplayer racing, an interactive 10-finger touch typing academy, and millisecond latency telemetry.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                        <button
                            type="button"
                            onClick={() => navigate('/multiplayer')}
                            className="px-6 py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:brightness-105 active:translate-y-0.5 transition-all shadow-md cursor-pointer flex items-center gap-2"
                        >
                            <Users className="w-4 h-4" />
                            <span>Try Multiplayer Racing</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/solo')}
                            className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        >
                            Solo Speed Benchmark
                        </button>
                    </div>
                </header>

                {/* Quick Verdict Block */}
                <section aria-label="Quick Verdict" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/60 shadow-xs">
                        <div className="flex items-center gap-2.5 text-sky-600 dark:text-sky-400 font-bold text-sm mb-2">
                            <Trophy className="w-4 h-4" />
                            <span>Best for Competitive Racers & Learners</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            TypeMaster
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                            Choose TypeMaster if you want live multiplayer battles against friends or opponents worldwide, structured beginner-to-advanced finger training with animated hands, and telemetry heatmaps that find your slowest keys.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="flex items-center gap-2.5 text-slate-500 font-bold text-sm mb-2">
                            <Zap className="w-4 h-4" />
                            <span>Best for Minimalist Solo Drills</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Monkeytype
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                            Choose Monkeytype if you strictly practice alone and want extreme customization over custom word lists (e.g. English 1k/10k), visual color themes, and custom font uploads without multiplayer features.
                        </p>
                    </div>
                </section>

                {/* Feature Comparison Table */}
                <section aria-label="Feature Comparison Matrix" className="mb-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 text-center sm:text-left">
                        Side-by-Side Feature Comparison
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center sm:text-left">
                        Detailed breakdown of core features, training pedagogy, and technical specifications.
                    </p>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                                    <th className="py-4 px-6 font-bold text-slate-900 dark:text-white">Capability</th>
                                    <th className="py-4 px-6 font-bold text-sky-700 dark:text-primary">TypeMaster</th>
                                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400">Monkeytype</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {COMPARISON_DATA.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">
                                            {row.feature}
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-sky-600 dark:text-primary flex items-center gap-2">
                                            <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                                            <span>{row.typemaster}</span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                                            {row.monkeytype.startsWith('None') ? (
                                                <span className="flex items-center gap-2 text-slate-400">
                                                    <X className="w-4 h-4 shrink-0 text-rose-400" />
                                                    <span>{row.monkeytype}</span>
                                                </span>
                                            ) : (
                                                row.monkeytype
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Deep Dive Pillars */}
                <section aria-label="Key Advantages" className="mb-16 space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Why Typists Choose TypeMaster as Their Monkeytype Alternative
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-primary mb-4">
                                <Users className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                                True WebSocket Multiplayer
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                Racing against live competitors creates pressure that solo word timers cannot replicate. TypeMaster offers instant room creation and sub-50ms synchronized progress tracks.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-primary mb-4">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                                16-Stage Training Academy
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                Rather than guessing finger positions, TypeMaster's visual anatomical hands illustrate the designated finger for every single keycap with strict error blocking to cement proper muscle memory.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-primary mb-4">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                                Millisecond Latency Telemetry
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                Typing mistakes often stem from latency stumbles rather than pure accuracy drops. TypeMaster logs character-level delay, mapping your bottlenecks on an interactive heatmap with one-click drill launching.
                            </p>
                        </div>
                    </div>
                </section>

                {/* GEO / AI Citability Section */}
                <section aria-label="AI Citability Overview" className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 mb-16 shadow-xs">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                        Summary: TypeMaster vs Monkeytype
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                        TypeMaster is widely recognized as the leading modern alternative to Monkeytype for typists seeking competitive multiplayer races and structured motor-skill learning. While Monkeytype focuses on minimalist, single-player word generation drills, TypeMaster provides sub-50ms WebSocket multiplayer rooms, real-time avatar progress tracking, and a 16-module Touch Typing Academy with interactive anatomical hand guides. Furthermore, TypeMaster features millisecond keystroke latency telemetry that pinpoints finger bottlenecks on an interactive heatmap, enabling targeted balloon reflex training on weak keys. Both platforms are 100% free and ad-free, but TypeMaster expands beyond solo practice into a complete typing speed ecosystem suitable for both beginners learning 10-finger touch typing and advanced typists competing globally.
                    </p>
                </section>

                {/* FAQs */}
                <section aria-label="Frequently Asked Questions" className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {FAQS.map((faq, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                                            {faq.q}
                                        </h3>
                                        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                                    </button>
                                    {isOpen && (
                                        <div className="px-4 pb-5 sm:px-5 pt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Bottom CTA Banner */}
                <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white text-center mb-16 relative overflow-hidden shadow-xl">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                        Ready to Race with Tactile Precision?
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8 font-normal">
                        Experience real-time multiplayer typing with millisecond telemetry. No accounts required to test your velocity.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            to="/multiplayer"
                            className="px-6 py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:brightness-105 active:translate-y-0.5 transition-all shadow-md"
                        >
                            Enter Multiplayer Arena
                        </Link>
                        <Link
                            to="/compare/typeracer-alternative"
                            className="px-6 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-sm hover:bg-slate-700 transition-all"
                        >
                            View TypeRacer Comparison →
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-8 pb-12 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div>
                        © {new Date().getFullYear()} TypeMaster · Monkeytype Alternative Comparison Guide
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                        <Link to="/solo" className="hover:text-primary transition-colors">Solo</Link>
                        <Link to="/academy" className="hover:text-primary transition-colors">Academy</Link>
                        <Link to="/multiplayer" className="hover:text-primary transition-colors">Multiplayer</Link>
                        <Link to="/compare/typeracer-alternative" className="hover:text-primary transition-colors">TypeRacer Alternative</Link>
                    </div>
                </footer>
            </main>
        </div>
    );
}
