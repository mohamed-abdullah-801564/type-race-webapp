import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronsRight, Bell, Settings, X, AlertTriangle, Save, Gauge, Crown, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AuthModal from './AuthModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Navbar({ isFaded = false }) {
    const location = useLocation();
    const currentPath = location.pathname;
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    // Load Stats for Profile View
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('playerName');
        if (stored) setPlayerName(stored);
        
        const rankData = JSON.parse(localStorage.getItem('rankData') || 'null');
        setStats(rankData);
    }, [isSettingsOpen, isProfileOpen, user]); // Include user to refresh when auth state changes


    const handleSaveName = async (e) => {
        e.preventDefault();
        if (playerName.trim()) {
            localStorage.setItem('playerName', playerName.trim());
            localStorage.setItem('lastLocalUpdate', Date.now().toString());
            
            // Identity Sync to Firestore
            if (user) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, {
                        operatorName: playerName.trim(),
                        lastUpdate: serverTimestamp()
                    });
                    
                    // Update leaderboard if rank exists
                    if (stats) {
                        const lbRef = doc(db, 'leaderboard', user.uid);
                        await setDoc(lbRef, { 
                            name: playerName.trim() 
                        }, { merge: true });
                    }
                    localStorage.setItem('lastCloudSync', Date.now().toString());
                } catch (err) {
                    console.error("Identity sync failed:", err);
                }
            }
            
            setIsSettingsOpen(false);
            window.location.reload();
        }
    };

    const handleWipeData = () => {
        setIsConfirmOpen(true);
    };

    const confirmWipeData = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            window.dispatchEvent(new Event('data-hydrated'));
            setIsProfileOpen(false);
            window.location.reload();
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    const [isSyncing, setIsSyncing] = useState(false);
    const handleManualSync = async () => {
        if (!user || isSyncing) return;
        setIsSyncing(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            const localRank = JSON.parse(localStorage.getItem('rankData') || 'null');
            const operatorName = localStorage.getItem('playerName') || user.email.split('@')[0];
            
            const summaryData = {
                operatorName,
                rank: localRank,
                lastSync: serverTimestamp(),
                totalRaces: JSON.parse(localStorage.getItem('raceHistory') || '[]').filter(r => !r.isDrill).length
            };

            await setDoc(userRef, summaryData, { merge: true });
            
            if (localRank) {
                const lbRef = doc(db, 'leaderboard', user.uid);
                await setDoc(lbRef, {
                    name: operatorName,
                    wpm: localRank.highestWPM,
                    acc: localRank.avgAcc,
                    score: localRank.score,
                    tier: localRank.tier,
                    updatedAt: serverTimestamp()
                });
            }

            localStorage.setItem('lastCloudSync', Date.now().toString());
            // Small delay for UI feedback
            await new Promise(r => setTimeout(r, 800));
        } catch (err) {
            console.error("Manual sync failed:", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const getSyncStatus = () => {
        if (!user) return null;
        const lastLocal = parseInt(localStorage.getItem('lastLocalUpdate') || '0');
        const lastCloud = parseInt(localStorage.getItem('lastCloudSync') || '0');
        return lastCloud >= lastLocal ? 'synced' : 'unsynced';
    };

    return (
        <>
        <header className={`flex items-center justify-between border-b border-slate-200 dark:border-primary/10 px-6 py-4 lg:px-20 bg-background-light dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-40 transition-opacity duration-500 ease-in-out ${isFaded ? 'opacity-10' : 'opacity-100'}`}>
            <div className="flex flex-1 items-center gap-4">
                <Link to="/" className="flex items-center gap-4">
                    <div className="text-primary">
                        <ChevronsRight className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Type<span className="text-primary text-2xl">.</span>Master
                    </h2>
                </Link>
            </div>

            <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
                <Link to="/" className={`${currentPath === '/' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}>
                    Dashboard
                </Link>
                <Link to="/solo" className={`${currentPath === '/solo' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}>
                    Solo Mode
                </Link>
                <Link to="/academy" className={`${currentPath === '/academy' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}>
                    Academy
                </Link>
                <Link to="/multiplayer" className={`${currentPath === '/multiplayer' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}>
                    Multiplayer
                </Link>
                <Link to="/vault" className={`${currentPath === '/vault' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}>
                    Vault
                </Link>
            </nav>

            <div className="flex flex-1 justify-end items-center gap-4">
                <button className="p-2 rounded-lg bg-slate-100 dark:bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Bell className="w-6 h-6 text-slate-600 dark:text-primary" />
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-lg bg-slate-100 dark:bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Settings className="w-6 h-6 text-slate-600 dark:text-primary" />
                </button>
                <div className="flex items-center gap-3">
                    {user && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 group relative">
                            {getSyncStatus() === 'synced' ? (
                                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                                <CloudOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            )}
                            <span className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 font-mono">
                                {playerName || user.email.split('@')[0]}
                            </span>
                            
                            {/* Hover Status Detail */}
                            <div className="absolute top-full mt-2 right-0 bg-slate-900 border border-white/10 p-2 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[120px]">
                                <p className="text-[8px] uppercase font-black text-slate-500 mb-1">Neural Connection</p>
                                <p className={`text-[9px] font-bold ${getSyncStatus() === 'synced' ? 'text-cyan-400' : 'text-amber-500'}`}>
                                    {getSyncStatus() === 'synced' ? 'STABLE LINK' : 'UNSYNCED DATA'}
                                </p>
                            </div>
                        </div>
                    )}
                    <div onClick={() => setIsProfileOpen(true)} className="h-10 w-10 rounded-full border-2 border-primary/30 p-0.5 overflow-hidden cursor-pointer hover:border-primary transition-colors">
                        <img
                            alt="User Avatar"
                            className="h-full w-full rounded-full object-cover"
                            src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCyZ8GeGyhabNC6yspB1cJTkrXNLe87u0X4LYSEMZo_zYdp1HBc86chYAHMyMJFLCRUs_vaoTLHsfSSlkqlBlf49XrgC3qw83Rzt1WQqIVEOt7x1bp-rp2IxMz6cMBUfdMYeiHT90RS5icaXocgWAsfhuxNwo7cm04_0cpJNSy2q93Yk4pqsAkQ5EdzokS5Px7Uh4jY_N-YsR0OUGJyzoCgk7iAAUAKFQki70GArm-GDC-UaSo0bIWnffEEMl04i1eoLnqNomwdGFs"}
                        />
                    </div>
                </div>
            </div>
        </header>

        {/* Settings Modal */}
        {isSettingsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/95 backdrop-blur-sm animate-in fade-in duration-300">
                {isConfirmOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] relative animate-in zoom-in-95 duration-300">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-white text-center uppercase tracking-tighter mb-4">
                                Critical Warning
                            </h3>
                            <p className="text-sm text-slate-400 text-center mb-8 leading-relaxed">
                                WARNING: Irreversible Action. Are you sure you want to permanently delete all your Neural Heatmap data, Ghost recordings, and Race History?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsConfirmOpen(false)}
                                    className="flex-1 py-3 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors font-bold tracking-wider text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmWipeData}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold tracking-wider text-sm shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                >
                                    Confirm Erase
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="bg-slate-900 border border-primary/20 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,245,212,0.1)] relative">
                    <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                        <Settings className="text-primary w-6 h-6" /> Local Preferences
                    </h2>

                    <form onSubmit={handleSaveName} className="mb-8 p-6 bg-white/5 rounded-xl border border-white/5">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Operator Identity</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="ENTER NAME..."
                                maxLength={15}
                                className="flex-1 bg-background-dark border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary font-bold uppercase tracking-wider"
                            />
                            <button 
                                type="submit"
                                disabled={!playerName.trim()}
                                className="px-4 py-3 bg-primary text-background-dark rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                        </div>
                    </form>

                    <div className="p-6 bg-red-950/20 rounded-xl border border-red-900/30">
                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Danger Zone
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Irreversibly erase all stored heatmaps and local stats from this device.
                        </p>
                        <button
                            onClick={handleWipeData}
                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-bold uppercase tracking-wider transition-colors text-sm"
                        >
                            Erase All Local Data
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Profile Modal */}
        {isProfileOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/95 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-slate-900 border border-primary/20 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,245,212,0.15)] relative overflow-hidden group">
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                    
                    <button 
                        onClick={() => setIsProfileOpen(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 relative z-10">
                        <ChevronsRight className="text-primary w-6 h-6 animate-pulse" /> 
                        <span className="relative">
                            Operator Profile
                            <span className="absolute -inset-x-2 -inset-y-1 bg-primary/10 blur-lg -z-10 rounded-full" />
                        </span>
                    </h2>

                    <div className="relative z-10">
                        <div className="mb-6 p-6 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 flex items-center justify-between">
                                Neural Link Status
                                {user ? (
                                    <span className="flex items-center gap-2 text-primary">
                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#00f5d4] animate-pulse" /> 
                                        LINKED
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-slate-500">
                                        <div className="w-2 h-2 rounded-full bg-slate-600" /> 
                                        OFFLINE
                                    </span>
                                )}
                            </h3>
                            
                            {user ? (
                                <div className="space-y-6">
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Linked Node</span>
                                                <span className="text-sm text-slate-200 font-mono truncate max-w-[200px]">{user.email}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Last Sync</span>
                                                <span className={`text-[10px] font-mono ${getSyncStatus() === 'synced' ? 'text-cyan-400' : 'text-amber-500'}`}>
                                                    {getSyncStatus() === 'synced' ? 'CONNECTION STABLE' : 'UPDATE REQUIRED'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {stats && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/[0.03] backdrop-blur-lg p-5 rounded-xl border border-white/10 flex flex-col gap-2 relative overflow-hidden group/card hover:border-primary/30 transition-all">
                                                <div className="absolute -right-2 -top-2 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                                    <Gauge className="w-12 h-12 text-primary" />
                                                </div>
                                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Peak Speed</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-primary font-mono">{stats.highestWPM}</span>
                                                    <span className="text-[10px] text-primary/50 font-bold uppercase">Wpm</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/[0.03] backdrop-blur-lg p-5 rounded-xl border border-white/10 flex flex-col gap-2 relative overflow-hidden group/card hover:border-primary/30 transition-all">
                                                <div className="absolute -right-2 -top-2 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                                    <Crown className="w-12 h-12 text-primary" />
                                                </div>
                                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Operator Tier</span>
                                                <span className="text-xl font-black text-white font-mono uppercase tracking-tighter">{stats.tier}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button 
                                            onClick={handleManualSync} 
                                            disabled={isSyncing || getSyncStatus() === 'synced'}
                                            className="flex-1 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                                        </button>
                                        <button 
                                            onClick={handleLogout} 
                                            className="px-6 py-3 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 mx-auto border border-white/5">
                                        <AlertTriangle className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <p className="text-xs text-slate-400 mb-8 leading-relaxed px-4 font-medium uppercase tracking-tight">
                                        Neural history is currently restricted to local nodes. Establish a secure link to sync performance profiles across the grid.
                                    </p>
                                    <button 
                                        onClick={() => { setIsProfileOpen(false); setShowAuthModal(true); }} 
                                        className="w-full py-4 bg-primary text-background-dark font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_30px_rgba(0,245,212,0.5)] hover:scale-[1.02] transition-all active:scale-95"
                                    >
                                        Initiate Neural Sync
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={() => setShowAuthModal(false)} />}
        </>
    );
}
