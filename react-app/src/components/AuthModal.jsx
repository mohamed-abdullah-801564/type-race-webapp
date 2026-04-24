import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { X, CloudLightning, Loader2 } from 'lucide-react';

export default function AuthModal({ onClose, onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                    const operatorName = localStorage.getItem('playerName') || userCredential.user.email.split('@')[0];
                    const localRank = JSON.parse(localStorage.getItem('rankData') || 'null');
                    const localHistory = JSON.parse(localStorage.getItem('raceHistory') || '[]');
                    
                    await setDoc(userDocRef, {
                        operatorName,
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
            <div className="bg-slate-900 border-2 border-primary/30 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_40px_rgba(0,245,212,0.2)] relative animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-primary/50 hover:text-primary transition-colors">
                    <X className="w-5 h-5" />
                </button>
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,212,0.3)]">
                        <CloudLightning className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-white text-center uppercase tracking-tighter mb-2">Neural Sync</h2>
                <p className="text-xs text-primary/70 text-center uppercase tracking-widest mb-8">Establish secure cloud link</p>
                
                {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg text-center font-mono">{error}</div>}
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input 
                        type="email" 
                        placeholder="OPERATOR EMAIL" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-primary/20 focus:border-primary text-white text-sm font-mono px-4 py-3 rounded-lg outline-none transition-all placeholder:text-slate-600"
                    />
                    <input 
                        type="password" 
                        placeholder="ACCESS CODE" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-primary/20 focus:border-primary text-white text-sm px-4 py-3 rounded-lg outline-none transition-all placeholder:text-slate-600 tracking-widest"
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
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-xs font-bold text-slate-500 hover:text-primary transition-colors tracking-widest uppercase">
                        {isLogin ? 'Create new connection' : 'Use existing link'}
                    </button>
                </div>
            </div>
        </div>
    );
}
