import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { sanitizeName } from '../utils/sanitizeUtils';
import { X, CloudLightning, Loader2 } from 'lucide-react';

export default function AuthModal({ onClose, onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [operatorName, setOperatorName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            
            // Sync Logic
            try {
                const uid = userCredential.user.uid;
                const userDocRef = doc(db, 'users', uid);
                const userSnapshot = await getDoc(userDocRef);
                
                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    
                    // CLEAR OLD LOCAL DATA BEFORE HYDRATION
                    // This prevents data leakage when switching users
                    localStorage.clear();
                    sessionStorage.clear();

                    // 1. Recover Operator Identity
                    if (data.operatorName) localStorage.setItem('playerName', data.operatorName);
                    
                    // 2. Overwrite Race History
                    if (data.recentHistory) {
                        localStorage.setItem('raceHistory', JSON.stringify(data.recentHistory));
                    }

                    if (data.rank) {
                        localStorage.setItem('rankData', JSON.stringify(data.rank));
                        localStorage.setItem('prevHighestWPM', (data.rank.highestWPM || 0).toString());
                    }

                    // 4. Instant Name Sync Fix
                    if (!data.operatorName) {
                        const emailPrefix = userCredential.user.email.split('@')[0];
                        await updateDoc(userDocRef, { operatorName: emailPrefix });
                        localStorage.setItem('playerName', emailPrefix);
                    }
                    
                    // 3. Update Sync Timestamps
                    localStorage.setItem('lastCloudSync', Date.now().toString());
                    localStorage.setItem('lastLocalUpdate', (Date.now() - 1000).toString()); // Cloud is current
                } else {
                    // New Cloud User -> Push initial profile summary
                    const emailPrefix = userCredential.user.email.split('@')[0];
                    const localRank = JSON.parse(localStorage.getItem('rankData') || 'null');
                    const localHistory = JSON.parse(localStorage.getItem('raceHistory') || '[]');
                    
                    await setDoc(userDocRef, {
                        operatorName: emailPrefix,
                        rank: localRank,
                        lastSync: serverTimestamp(),
                        email: userCredential.user.email
                    });
                    localStorage.setItem('playerName', emailPrefix);
                    localStorage.setItem('lastCloudSync', Date.now().toString());
                }

                // Force individual state updates on Dashboard
                window.dispatchEvent(new Event('data-hydrated'));
                window.dispatchEvent(new Event('neural-sync-complete'));
                
            } catch (syncErr) {
                console.warn("Initial sync failed:", syncErr);
            }
            
            // Wait a moment for any side effects before closing
            await new Promise(r => setTimeout(r, 500));
            onLoginSuccess();
            onClose(); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let userCredential;
            if (isLogin) {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                // Save operator name to localStorage immediately
                const cleanName = sanitizeName(operatorName) || userCredential.user.email.split('@')[0];
                localStorage.setItem('playerName', cleanName);
            }
            // Sync Logic
            try {
                const uid = userCredential.user.uid;
                const userDocRef = doc(db, 'users', uid);
                const userSnapshot = await getDoc(userDocRef);
                
                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    
                    // CLEAR OLD LOCAL DATA BEFORE HYDRATION
                    // This prevents data leakage when switching users
                    localStorage.clear();
                    sessionStorage.clear();

                    // 1. Recover Operator Identity
                    if (data.operatorName) localStorage.setItem('playerName', data.operatorName);
                    
                    // 2. Overwrite Race History
                    if (data.recentHistory) {
                        localStorage.setItem('raceHistory', JSON.stringify(data.recentHistory));
                    }

                    if (data.rank) {
                        localStorage.setItem('rankData', JSON.stringify(data.rank));
                        localStorage.setItem('prevHighestWPM', (data.rank.highestWPM || 0).toString());
                    }

                    // 4. Instant Name Sync Fix
                    if (!data.operatorName) {
                        const emailPrefix = userCredential.user.email.split('@')[0];
                        await updateDoc(userDocRef, { operatorName: emailPrefix });
                        localStorage.setItem('playerName', emailPrefix);
                    }
                    
                    // 3. Update Sync Timestamps
                    localStorage.setItem('lastCloudSync', Date.now().toString());
                    localStorage.setItem('lastLocalUpdate', (Date.now() - 1000).toString()); // Cloud is current
                } else {
                    // New Cloud User -> Push initial profile summary (if guest data exists)
                    const resolvedOperatorName = sanitizeName(operatorName) || localStorage.getItem('playerName') || userCredential.user.email.split('@')[0];
                    const localRank = JSON.parse(localStorage.getItem('rankData') || 'null');
                    const localHistory = JSON.parse(localStorage.getItem('raceHistory') || '[]');
                    
                    await setDoc(userDocRef, {
                        operatorName: resolvedOperatorName,
                        rank: localRank,
                        lastSync: serverTimestamp(),
                        email: userCredential.user.email
                    });
                    localStorage.setItem('lastCloudSync', Date.now().toString());
                }

                // Force individual state updates on Dashboard
                window.dispatchEvent(new Event('data-hydrated'));
                window.dispatchEvent(new Event('neural-sync-complete'));
                
            } catch (syncErr) {
                console.warn("Initial sync failed:", syncErr);
            }
            
            // Wait a moment for any side effects before closing
            await new Promise(r => setTimeout(r, 500));
            onLoginSuccess();
            onClose(); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background-dark/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl p-8 max-w-sm w-full shadow-[0_0_40px_rgba(0,245,212,0.2)] relative animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-primary transition-colors">
                    <X className="w-5 h-5" />
                </button>
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,212,0.3)]">
                        <CloudLightning className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center uppercase tracking-tighter mb-2">Neural Sync</h2>
                <p className="text-xs text-slate-600 dark:text-primary/70 text-center uppercase tracking-widest mb-8">Establish secure cloud link</p>
                
                {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg text-center font-mono">{error}</div>}
                
                <button 
                    type="button" 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full mb-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold tracking-[0.1em] text-sm uppercase rounded-xl backdrop-blur-md transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
                >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                </button>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
                    <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
                    <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">OR</span>
                    <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input 
                        type="email" 
                        placeholder="OPERATOR EMAIL" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-primary/20 focus:border-primary text-slate-900 dark:text-white text-sm font-mono px-4 py-3 rounded-lg outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600"
                    />
                    {!isLogin && (
                        <input 
                            type="text" 
                            placeholder="OPERATOR NAME" 
                            maxLength={15}
                            value={operatorName}
                            onChange={(e) => setOperatorName(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-primary/20 focus:border-primary text-slate-900 dark:text-white text-sm font-mono px-4 py-3 rounded-lg outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600 uppercase tracking-widest"
                        />
                    )}
                    <input 
                        type="password" 
                        placeholder="ACCESS CODE" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-primary/20 focus:border-primary text-slate-900 dark:text-white text-sm px-4 py-3 rounded-lg outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600 tracking-widest"
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full mt-4 py-4 bg-primary text-background-dark font-black uppercase tracking-[0.2em] rounded-lg hover:shadow-[0_0_20px_rgba(0,245,212,0.6)] transition-all flex items-center justify-center disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Initiate Link' : 'Register Node')}
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <button type="button" onClick={() => { setIsLogin(!isLogin); setOperatorName(''); }} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-primary transition-colors tracking-widest uppercase">
                        {isLogin ? 'Create new connection' : 'Use existing link'}
                    </button>
                </div>
            </div>
        </div>
    );
}
