import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, Shield, Zap, Globe, Lock, ChevronRight, Terminal, Search, Activity, Cpu } from 'lucide-react';
import Navbar from '../components/Navbar';
import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { loadData } from '../utils/storageUtils';

export default function GhostVault() {
    const navigate = useNavigate();
    const [privateGhosts, setPrivateGhosts] = useState([]);
    const [globalGhosts, setGlobalGhosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('private'); // 'private' or 'global'

    useEffect(() => {
        const fetchGhosts = async () => {
            setIsLoading(true);
            try {
                // Load Private Ghosts
                const local = loadData('ghostLibrary', []);
                setPrivateGhosts(local);

                // Load Global Ghosts
                const q = query(collection(db, 'global_ghosts'), orderBy('wpm', 'desc'), limit(10));
                const snapshot = await getDocs(q);
                const global = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setGlobalGhosts(global);
            } catch (err) {
                console.error("Failed to fetch ghosts:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGhosts();
    }, []);

    const handleChallenge = (ghost) => {
        navigate('/solo', { 
            state: { 
                ghostData: ghost.keystrokes, 
                text: ghost.text,
                ghostName: ghost.name || ghost.operatorName,
                isGhostChallenge: true
            } 
        });
    };

    const getDifficulty = (wpm) => {
        if (wpm > 120) return { label: 'LEGENDARY', color: 'text-red-500' };
        if (wpm > 90) return { label: 'ELITE', color: 'text-orange-500' };
        if (wpm > 60) return { label: 'EXPERT', color: 'text-yellow-500' };
        return { label: 'ADVANCED', color: 'text-green-500' };
    };

    const GhostCard = ({ ghost, type }) => {
        const difficulty = getDifficulty(ghost.wpm);
        const name = ghost.name || ghost.operatorName || 'Unknown Ghost';
        const date = ghost.date ? new Date(ghost.date).toLocaleDateString() : (ghost.timestamp ? new Date(ghost.timestamp).toLocaleDateString() : 'Unknown Date');

        const diffColors = {
            'LEGENDARY': 'text-red-500 border-red-500',
            'ELITE': 'text-orange-500 border-orange-500',
            'EXPERT': 'text-yellow-500 border-yellow-500',
            'ADVANCED': 'text-green-500 border-green-500'
        };

        return (
            <div className="group bg-black/60 border-2 border-white/5 hover:border-primary/40 rounded-3xl p-6 flex flex-col gap-5 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,245,212,0.1)]">
                {/* Card Header: Name/Badge Left, WPM Hero Right */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-2xl font-black text-white leading-tight">
                            {name}
                        </h3>
                        <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border w-fit ${diffColors[difficulty.label] || 'text-primary border-primary'}`}>
                            {difficulty.label}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-black text-primary font-mono leading-none">
                            {ghost.wpm}
                        </div>
                        <div className="text-[10px] text-primary/50 uppercase tracking-widest mt-1">
                            WPM
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Accuracy</span>
                        <div className="text-sm font-bold text-slate-200">
                            {ghost.accuracy || '98'}%
                        </div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Captured</span>
                        <div className="text-sm font-bold text-slate-200">
                            {date}
                        </div>
                    </div>
                </div>

                {/* Challenge Button */}
                <button 
                    onClick={() => handleChallenge(ghost)}
                    className="w-full py-4 bg-primary/10 hover:bg-primary border border-primary/30 hover:border-primary text-primary hover:text-background-dark font-black uppercase tracking-[0.2em] text-[11px] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    <Activity className="w-4 h-4" />
                    Challenge Ghost
                </button>
            </div>
        );
    };

    return (
        <div className="layout-container flex h-full grow flex-col bg-background-dark selecting:bg-primary/20">
            <Navbar />
            
            {/* Terminal Background Effect */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-0" />

            <main className="flex-1 px-8 py-12 lg:px-24 z-10 relative">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                                <Terminal className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-xs font-black text-primary uppercase tracking-[0.4em]">Subsystem: GHOST_VAULT v4.1</span>
                        </div>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap">Neural Capture <span className="text-primary tracking-normal not-italic underline decoration-primary/30 decoration-8 underline-offset-4">Archive</span></h1>
                        <p className="text-slate-500 font-medium max-w-xl uppercase text-[10px] tracking-[0.2em]">Established link with the distributed ghost network. Browsing encrypted keystroke recordings from the local grid and global nexus.</p>
                    </div>

                    <div className="flex bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                        <button 
                            onClick={() => setActiveTab('private')}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl transition-all duration-500 font-black text-[10px] uppercase tracking-widest ${activeTab === 'private' ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(0,245,212,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Lock className="w-4 h-4" /> Private Archive
                        </button>
                        <button 
                            onClick={() => setActiveTab('global')}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl transition-all duration-500 font-black text-[10px] uppercase tracking-widest ${activeTab === 'global' ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(0,245,212,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Globe className="w-4 h-4" /> Global Nexus
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Active Links</span>
                            <span className="text-lg font-bold text-white font-mono">{privateGhosts.length + globalGhosts.length}</span>
                        </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Neural Sync</span>
                            <span className="text-lg font-bold text-cyan-400 font-mono">READY</span>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                {isLoading ? (
                    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_15px_rgba(0,245,212,0.2)]" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Decrypting Archive...</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {(activeTab === 'private' ? privateGhosts : globalGhosts).map((ghost, index) => (
                                <div key={ghost.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                                    <GhostCard ghost={ghost} type={activeTab} />
                                </div>
                            ))}
                        </div>

                        {(activeTab === 'private' ? privateGhosts : globalGhosts).length === 0 && (
                            <div className="min-h-[400px] flex flex-col items-center justify-center bg-black/20 rounded-3xl border border-dashed border-white/10 p-12">
                                <Search className="w-16 h-16 text-slate-700 mb-6" />
                                <h3 className="text-xl font-bold text-slate-500 uppercase tracking-widest mb-2">No Neural Signatures Detected</h3>
                                <p className="text-sm text-slate-600 uppercase font-black text-center max-w-sm tracking-tight italic">Initiate more races in Solo or Multiplayer mode to capture new ghosts for the archive.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
