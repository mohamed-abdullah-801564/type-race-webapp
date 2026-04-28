import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';

const RouteGuard = ({ children }) => {
    const [authChecked, setAuthChecked] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showAuth, setShowAuth] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
            setAuthChecked(true);
        });
        return () => unsubscribe();
    }, []);

    if (!authChecked) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center relative overflow-hidden">
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50" />
                
                <div className="bg-slate-900 border border-primary/20 rounded-3xl p-12 max-w-md w-full text-center shadow-[0_0_60px_rgba(0,245,212,0.1)] relative z-10 animate-in fade-in zoom-in duration-500">
                    <Lock className="w-16 h-16 text-primary/40 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-3">Neural Link Required</h2>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8">
                        This section requires authentication. Establish a secure neural link to access the full Training Academy and track your progression across the grid.
                    </p>
                    
                    <button 
                        onClick={() => setShowAuth(true)}
                        className="w-full py-4 bg-primary text-background-dark font-black uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(0,245,212,0.4)] transition-all"
                    >
                        Establish Neural Link
                    </button>
                    
                    <Link 
                        to="/"
                        className="mt-4 block w-full py-3 text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                        Return to Dashboard
                    </Link>
                </div>
                {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLoginSuccess={() => { setShowAuth(false); setIsLoggedIn(true); }} />}
            </div>
        );
    }

    return children;
};

export default RouteGuard;
