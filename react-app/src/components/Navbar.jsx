import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronsRight, Save, Gauge, Crown, Cloud, CloudOff, RefreshCw, AlertTriangle, Menu, X, Download, Sun, Moon } from 'lucide-react';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { sanitizeName } from '../utils/sanitizeUtils';
import AuthModal from './AuthModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const NAV_LINKS = [
    { to: '/dashboard',    label: 'Dashboard'   },
    { to: '/solo',         label: 'Solo Mode'   },
    { to: '/academy',      label: 'Academy'     },
    { to: '/daily',        label: 'Daily'       },
    { to: '/practice',     label: 'Practice'    },
    { to: '/multiplayer',  label: 'Multiplayer' },
    { to: '/vault',        label: 'Vault'       },
    { to: '/achievements', label: 'Achievements'},
];

export default function Navbar({ isFaded = false }) {
    const location  = useLocation();
    const navigate  = useNavigate();
    const currentPath = location.pathname;

    const [isProfileOpen,  setIsProfileOpen]  = useState(false);
    const [playerName,     setPlayerName]     = useState('');
    const [user,           setUser]           = useState(null);
    const [showAuthModal,  setShowAuthModal]  = useState(false);
    const [stats,          setStats]          = useState(null);
    const [isSyncing,      setIsSyncing]      = useState(false);
    const [confirmWipe,    setConfirmWipe]    = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const confirmTimerRef = useRef(null);
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.querySelector('.dark') !== null);
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        const wrapper = document.querySelector('.dark') || document.querySelector('.light');
        if (wrapper) {
            observer.observe(wrapper, { attributes: true, attributeFilter: ['class'] });
        }
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem('playerName');
        if (stored) setPlayerName(stored);
        const rankData = JSON.parse(localStorage.getItem('rankData') || 'null');
        setStats(rankData);
    }, [isProfileOpen, user]);

    const handleSaveName = async (e) => {
        e.preventDefault();
        const cleanName = sanitizeName(playerName.trim());
        if (!cleanName) {
            alert("Name can only contain letters, numbers and underscores");
            return;
        }
        localStorage.setItem('playerName', cleanName);
        localStorage.setItem('lastLocalUpdate', Date.now().toString());
        if (user) {
            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { operatorName: cleanName, lastUpdate: serverTimestamp() });
                if (stats) {
                    const lbRef = doc(db, 'leaderboard', user.uid);
                    await setDoc(lbRef, { name: cleanName }, { merge: true });
                }
                localStorage.setItem('lastCloudSync', Date.now().toString());
            } catch (err) {
                console.error('Identity sync failed:', err);
            }
        }
        setIsProfileOpen(false);
        window.location.reload();
    };

    const handleWipeData = () => {
        if (confirmWipe) {
            clearTimeout(confirmTimerRef.current);
            localStorage.clear();
            window.location.reload();
        } else {
            setConfirmWipe(true);
            confirmTimerRef.current = setTimeout(() => setConfirmWipe(false), 3000);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            window.dispatchEvent(new Event('data-hydrated'));
            setIsProfileOpen(false);
            navigate('/');
            window.location.reload();
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const handleManualSync = async () => {
        if (!user || isSyncing) return;
        setIsSyncing(true);
        try {
            const userRef      = doc(db, 'users', user.uid);
            const localRank    = JSON.parse(localStorage.getItem('rankData') || 'null');
            const operatorName = localStorage.getItem('playerName') || user.email.split('@')[0];
            await setDoc(userRef, {
                operatorName,
                rank: localRank,
                lastSync: serverTimestamp(),
                totalRaces: JSON.parse(localStorage.getItem('raceHistory') || '[]').filter(r => !r.isDrill).length,
            }, { merge: true });
            if (localRank) {
                const lbRef = doc(db, 'leaderboard', user.uid);
                await setDoc(lbRef, {
                    name: operatorName,
                    wpm:  localRank.highestWPM,
                    acc:  localRank.avgAcc,
                    score: localRank.score,
                    tier: localRank.tier,
                    updatedAt: serverTimestamp(),
                });
            }
            localStorage.setItem('lastCloudSync', Date.now().toString());
            await new Promise(r => setTimeout(r, 800));
        } catch (err) {
            console.error('Manual sync failed:', err);
        } finally {
            setIsSyncing(false);
        }
    };

    const getSyncStatus = () => {
        if (!user) return null;
        const lastLocal = parseInt(localStorage.getItem('lastLocalUpdate') || '0');
        const lastCloud = parseInt(localStorage.getItem('lastCloudSync')   || '0');
        return lastCloud >= lastLocal ? 'synced' : 'unsynced';
    };

    return (
        <>
            <header className={`flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-6 py-4 lg:px-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-opacity duration-500 ease-in-out ${isFaded ? 'opacity-10' : 'opacity-100'}`}>
                {/* Logo */}
                <div className="flex flex-1 items-center gap-4">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="text-primary"><ChevronsRight className="w-7 h-7" /></div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Type<span className="text-primary font-black">Master</span>
                        </h2>
                    </Link>
                </div>

                {/* Nav Links */}
                <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
                    {NAV_LINKS.map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`${currentPath === to ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Right Side */}
                <div className="flex flex-1 justify-end items-center gap-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    {user && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 group relative">
                            {getSyncStatus() === 'synced'
                                ? <Cloud    className="w-3.5 h-3.5 text-cyan-400" />
                                : <CloudOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            }
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                                {playerName || user.email.split('@')[0]}
                            </span>
                            <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[130px]">
                                <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Account Sync</p>
                                <p className={`text-xs font-medium ${getSyncStatus() === 'synced' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {getSyncStatus() === 'synced' ? 'Cloud Synced' : 'Unsynced Data'}
                                </p>
                            </div>
                        </div>
                    )}
                    {!window.navigator.userAgent.includes('Electron') && (
                        <a 
                            href="https://github.com/mohamed-abdullah-801564/type-race-webapp/releases/latest"
                            target="_blank"
                            rel="noreferrer"
                            className="faded-ui flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/5 transition-all duration-300"
                            title="Download Desktop App"
                        >
                            <Download className="w-5 h-5" />
                        </a>
                    )}
                    <button
                        onClick={() => window.toggleNeuralTheme && window.toggleNeuralTheme()}
                        className="flex items-center justify-center p-2 rounded-lg transition-all duration-300"
                        title="Toggle Theme"
                    >
                        {isDark ? (
                            <Sun className="text-slate-500 hover:text-primary transition-colors cursor-pointer w-5 h-5" />
                        ) : (
                            <Moon className="text-slate-600 hover:text-primary transition-colors cursor-pointer w-5 h-5" />
                        )}
                    </button>
                    <div onClick={() => setIsProfileOpen(true)} className="h-10 w-10 rounded-full border-2 border-primary/30 p-0.5 overflow-hidden cursor-pointer hover:border-primary transition-colors">
                        <img
                            alt="User Avatar"
                            className="h-full w-full rounded-full object-cover"
                            src={user?.photoURL || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230f172a'/><circle cx='50' cy='35' r='20' fill='%2300f5d4'/><path d='M20 80c0-20 12-30 30-30s30 10 30 30' fill='%2300f5d4'/></svg>"}
                        />
                    </div>
                </div>
            </header>

            {user && user.emailVerified === false && (
                <div className="bg-slate-100 dark:bg-slate-900/40 border-b border-slate-200 dark:border-white/10 px-6 py-2.5 flex items-center justify-center gap-3 backdrop-blur-md sticky top-[73px] z-30">
                    <AlertTriangle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-400 hover:underline transition-all duration-300">
                        Please verify your email to secure your account and cloud rankings.
                    </span>
                </div>
            )}

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-60 md:hidden">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-primary/20 flex flex-col p-8 shadow-[4px_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-left duration-300">
                        <Link to="/" className="flex items-center gap-4" onClick={() => setIsMobileMenuOpen(false)}>
                            <div className="text-primary"><ChevronsRight className="w-8 h-8" /></div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-100">
                                Type<span className="text-primary text-2xl">.</span>Master
                            </h2>
                        </Link>

                        <nav className="flex flex-col gap-2 mt-12">
                            {NAV_LINKS.map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-4 py-3 rounded-xl font-bold transition-all ${currentPath === to ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>

                        <div className="mt-auto flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full border-2 border-primary/30 p-0.5 overflow-hidden">
                                <img
                                    alt="User Avatar"
                                    className="h-full w-full rounded-full object-cover"
                                    src={user?.photoURL || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230f172a'/><circle cx='50' cy='35' r='20' fill='%2300f5d4'/><path d='M20 80c0-20 12-30 30-30s30 10 30 30' fill='%2300f5d4'/></svg>"}
                                />
                            </div>
                            <span className="text-sm font-bold text-slate-300">
                                {playerName || user?.email?.split('@')[0] || 'Player'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile + Settings Modal */}
            {isProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,245,212,0.15)] relative overflow-hidden overflow-y-auto max-h-[90vh] [&::-webkit-scrollbar]:hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%]" />

                        <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-800/50 rounded-lg transition-colors z-10">
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 relative z-10">
                            <ChevronsRight className="text-primary w-6 h-6 animate-pulse" />
                            <span className="relative">
                                Operator Profile
                                <span className="absolute -inset-x-2 -inset-y-1 bg-primary/10 blur-lg -z-10 rounded-full" />
                            </span>
                        </h2>

                        <div className="relative z-10">
                            {/* Neural Link Status */}
                            <div className="mb-6 p-6 bg-slate-50 dark:bg-white/3 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl">
                                <h3 className="text-sm font-bold text-primary mb-4 flex items-center justify-between">
                                    Neural Link Status
                                    {user ? (
                                        <span className="flex items-center gap-2 text-primary">
                                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#00f5d4] animate-pulse" />
                                            Linked
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-slate-500">
                                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                                            Offline
                                        </span>
                                    )}
                                </h3>

                                {user ? (
                                    <div className="space-y-6">
                                        <div className="bg-slate-100 dark:bg-black/40 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 font-black">Linked Node</span>
                                                    <span className="text-sm text-slate-800 dark:text-slate-200 font-mono truncate max-w-[200px]">{user.email}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-slate-500 font-black block">Last Sync</span>
                                                    <span className={`text-sm font-mono ${getSyncStatus() === 'synced' ? 'text-cyan-400' : 'text-amber-500'}`}>
                                                        {getSyncStatus() === 'synced' ? 'Connection Stable' : 'Update Required'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {stats && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-100 dark:bg-white/3 p-5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col gap-2 relative overflow-hidden group/card hover:border-primary/30 transition-all">
                                                    <div className="absolute -right-2 -top-2 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                                        <Gauge className="w-12 h-12 text-primary" />
                                                    </div>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-black">Peak Speed</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-slate-900 dark:text-primary font-mono">{stats.highestWPM}</span>
                                                        <span className="text-sm text-slate-750 dark:text-primary/50 font-bold">Wpm</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-100 dark:bg-white/3 p-5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col gap-2 relative overflow-hidden group/card hover:border-primary/30 transition-all">
                                                    <div className="absolute -right-2 -top-2 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                                        <Crown className="w-12 h-12 text-primary" />
                                                    </div>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-black">Operator Tier</span>
                                                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{stats.tier}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4">
                                            <button
                                                onClick={handleManualSync}
                                                disabled={isSyncing || getSyncStatus() === 'synced'}
                                                className="flex-1 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white text-sm font-black rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                                                {isSyncing ? 'Syncing...' : 'Sync Now'}
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="px-6 py-3 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-sm font-black rounded-xl transition-all"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6 mx-auto border border-slate-200 dark:border-white/5">
                                            <AlertTriangle className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <p className="text-sm text-slate-650 dark:text-slate-400 mb-8 leading-relaxed px-4 font-medium">
                                            Neural history is currently restricted to local nodes. Establish a secure link to sync performance profiles across the grid.
                                        </p>
                                        <button
                                            onClick={() => { setIsProfileOpen(false); setShowAuthModal(true); }}
                                            className="w-full py-4 bg-primary text-background-dark font-black rounded-xl hover:shadow-[0_0_30px_rgba(0,245,212,0.5)] hover:scale-[1.02] transition-all active:scale-95"
                                        >
                                            Initiate Neural Sync
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-slate-200 dark:bg-white/5 my-6" />

                            {/* Local Preferences */}
                            <p className="text-sm font-black text-slate-500 dark:text-slate-400 mb-4">Local Preferences</p>

                            <form onSubmit={handleSaveName} className="mb-6 p-6 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-250 dark:border-white/5">
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">Operator Identity</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="Enter name..."
                                        maxLength={15}
                                        className="flex-1 bg-slate-100 dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-primary font-bold"
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

                            <div className="p-6 bg-transparent rounded-xl border border-red-500/20">
                                <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Danger Zone
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    Irreversibly erase all stored heatmaps and local stats from this device.
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleWipeData}
                                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-bold transition-colors text-sm"
                                    >
                                        {confirmWipe ? 'Confirm Erase' : 'Erase All Local Data'}
                                    </button>
                                    {confirmWipe && (
                                        <span className="text-xs text-red-400 font-bold animate-pulse whitespace-nowrap">Click again to confirm</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={() => setShowAuthModal(false)} />}
        </>
    );
}
