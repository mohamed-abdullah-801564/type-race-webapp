import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Terminal, Target, Zap, Ghost, Activity, Cpu, Users, X } from 'lucide-react';
import AuthModal from '../components/AuthModal';

export default function Landing() {
    const navigate = useNavigate();
    const [showAuth, setShowAuth] = useState(false);
    const [showDownloadCard, setShowDownloadCard] = useState(false);
    const [typedText, setTypedText] = useState('');
    const fullText = "INITIALIZING SECURE CONNECTION... // NEURAL LINK ESTABLISHED // WPM: 145 // ACCURACY: 99.8% // WELCOME TO TYPE.MASTER_";

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/dashboard');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Typing effect for the mock terminal
    useEffect(() => {
        let currentText = '';
        let index = 0;
        const interval = setInterval(() => {
            if (index < fullText.length) {
                currentText += fullText[index];
                setTypedText(currentText);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-background-dark text-slate-300 font-sans selection:bg-primary/30 relative overflow-hidden flex flex-col">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] animate-scanlines" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] mix-blend-screen" />
            </div>

            {/* Header */}
            <header className="relative z-10 px-6 py-6 md:px-12 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Terminal className="w-8 h-8 text-primary animate-pulse" />
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        Type<span className="text-primary text-3xl">.</span>Master
                    </h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-4 text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse"/> GRID ONLINE</span>
                        <span className="flex items-center gap-2"><Users className="w-4 h-4"/> 10,492 ACTIVE</span>
                    </div>
                    <button 
                        onClick={() => setShowAuth(true)}
                        className="px-6 py-2 border-2 border-primary/50 text-primary hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(0,245,212,0.4)] rounded-lg font-black uppercase tracking-widest text-xs transition-all"
                    >
                        Access Terminal
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative z-10 container mx-auto px-6 py-12 lg:py-20 flex flex-col items-center justify-center">
                
                {/* Hero Section */}
                <div className="w-full max-w-4xl text-center mb-16 space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-primary mb-4">
                        <Activity className="w-4 h-4" /> v2.4.0 Engine Active
                    </div>
                    
                    <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[1.1]">
                        Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 drop-shadow-[0_0_20px_rgba(0,245,212,0.5)]">Neural Grid</span>
                    </h2>
                    
                    <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        Elevate your typing telemetry. Connect to the global terminal network, race against real-time operators, and unlock your true speed potential.
                    </p>

                    {/* Terminal Mockup */}
                    <div className="mt-12 bg-black/50 border border-white/10 rounded-xl p-4 md:p-6 text-left max-w-3xl mx-auto shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            <span className="ml-2 text-[10px] font-mono text-slate-500">sys.terminal // exec_typing_test</span>
                        </div>
                        <div className="font-mono text-sm md:text-base text-primary/90 min-h-[4rem] md:min-h-[5rem] leading-relaxed break-words">
                            <span className="text-slate-500">&gt; </span>
                            {typedText}
                            <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse align-middle" />
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button 
                            onClick={() => setShowAuth(true)}
                            className="w-full sm:w-auto px-10 py-5 bg-primary text-background-dark font-black text-lg uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_40px_rgba(0,245,212,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-3 cursor-pointer"
                        >
                            <Cpu className="w-6 h-6" />
                            Connect Neural Link
                        </button>
                        <button 
                            onClick={() => setShowDownloadCard(true)}
                            className="w-full sm:w-auto px-10 py-5 border border-white/10 hover:border-primary/40 bg-white/5 font-black text-lg uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-3 text-white cursor-pointer"
                        >
                            📥 DOWNLOAD DESKTOP
                        </button>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-20 fade-in duration-1000 delay-300">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-primary/30 transition-colors group">
                        <Target className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-black text-white uppercase tracking-wider mb-3">Training Academy</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Structured modules designed to eliminate systemic typing errors. Isolate weaknesses and forge perfect muscle memory.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-cyan-400/30 transition-colors group">
                        <Zap className="w-10 h-10 text-cyan-400 mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-black text-white uppercase tracking-wider mb-3">Multiplayer Matrix</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Challenge live operators globally. Server-authoritative engine ensures zero-trust competitive integrity and pure skill matching.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-400/30 transition-colors group">
                        <Ghost className="w-10 h-10 text-purple-400 mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-black text-white uppercase tracking-wider mb-3">Ghost Records</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Race against historical data nodes. Replay top leaderboard runs keystroke by keystroke to analyze high-speed technique.
                        </p>
                    </div>
                </div>
            </main>

            {/* Auth Modal Trigger */}
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLoginSuccess={() => setShowAuth(false)} />}

            {/* Download Modal Trigger */}
            {showDownloadCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-primary/20 rounded-3xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(0,245,212,0.2)] relative overflow-hidden">
                        {/* Scanning effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%]" />
                        
                        <button 
                            onClick={() => setShowDownloadCard(false)} 
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition-colors z-10 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center space-y-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,245,212,0.1)]">
                                <Cpu className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-wider">TypeMaster Desktop</h3>
                                <p className="text-primary/60 font-mono text-[10px] uppercase tracking-[0.2em]">Next-Gen Telemetry Terminal</p>
                            </div>

                            <div className="text-left space-y-4 bg-black/40 p-6 rounded-2xl border border-white/5 font-mono text-xs text-slate-400">
                                <div className="border-b border-white/5 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    System Advancements
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="text-primary mt-0.5">⚡</div>
                                    <div>
                                        <strong className="text-white">Raw Hardware Processing:</strong> Unlocked raw hardware processing rates for zero-delay rendering.
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="text-primary mt-0.5">🖥️</div>
                                    <div>
                                        <strong className="text-white">Independent System Frames:</strong> Runs in dedicated window frames detached from typical browser thread overhead.
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="text-primary mt-0.5">🎯</div>
                                    <div>
                                        <strong className="text-white">Keyboard Latency Precision:</strong> Bypasses web-level browser telemetry event throttling.
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <a 
                                    href="https://github.com/mohamed-abdullah-801564/type-race-webapp/releases/latest"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-4 bg-primary text-background-dark font-black rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(0,245,212,0.3)] hover:scale-[1.02] text-center text-sm uppercase tracking-widest"
                                >
                                    📥 Download installer for Windows
                                </a>
                                <button 
                                    onClick={() => setShowDownloadCard(false)}
                                    className="w-full py-4 border border-white/10 text-slate-400 font-bold rounded-xl hover:bg-white/5 hover:text-white transition-all text-sm uppercase tracking-widest cursor-pointer"
                                >
                                    Dismiss Protocol
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
