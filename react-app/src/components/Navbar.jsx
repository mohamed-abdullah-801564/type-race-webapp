import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronsRight, Bell, Settings, X, AlertTriangle, Save } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();
    const currentPath = location.pathname;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [playerName, setPlayerName] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('playerName');
        if (stored) setPlayerName(stored);
    }, [isModalOpen]);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleSaveName = (e) => {
        e.preventDefault();
        if (playerName.trim()) {
            localStorage.setItem('playerName', playerName.trim());
            setIsModalOpen(false);
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

    return (
        <>
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-primary/10 px-6 py-4 lg:px-20 bg-background-light dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-40">
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
                <Link to="/multiplayer" className={`${currentPath === '/multiplayer' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}>
                    Multiplayer
                </Link>
            </nav>

            <div className="flex flex-1 justify-end items-center gap-4">
                <button className="p-2 rounded-lg bg-slate-100 dark:bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Bell className="w-6 h-6 text-slate-600 dark:text-primary" />
                </button>
                <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-lg bg-slate-100 dark:bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Settings className="w-6 h-6 text-slate-600 dark:text-primary" />
                </button>
                <div onClick={() => setIsModalOpen(true)} className="h-10 w-10 rounded-full border-2 border-primary/30 p-0.5 overflow-hidden cursor-pointer hover:border-primary transition-colors">
                    <img
                        alt="User Avatar"
                        className="h-full w-full rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyZ8GeGyhabNC6yspB1cJTkrXNLe87u0X4LYSEMZo_zYdp1HBc86chYAHMyMJFLCRUs_vaoTLHsfSSlkqlBlf49XrgC3qw83Rzt1WQqIVEOt7x1bp-rp2IxMz6cMBUfdMYeiHT90RS5icaXocgWAsfhuxNwo7cm04_0cpJNSy2q93Yk4pqsAkQ5EdzokS5Px7Uh4jY_N-YsR0OUGJyzoCgk7iAAUAKFQki70GArm-GDC-UaSo0bIWnffEEMl04i1eoLnqNomwdGFs"
                    />
                </div>
            </div>
        </header>

        {isModalOpen && (
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
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                        <Settings className="text-primary w-6 h-6" /> System Profile
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
                            Irreversibly erase all stored heatmaps, practice history, and neural latency profiles from this device.
                        </p>
                        <button
                            onClick={handleWipeData}
                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-bold uppercase tracking-wider transition-colors text-sm"
                        >
                            Erase All Neural Data
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
