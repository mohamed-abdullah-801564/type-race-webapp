import { useState } from 'react';
import { auth, database } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
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
            // Sync Logic with Timeout fallback
            try {
                const userRef = ref(database, `users/${uid}`);
                const snapshot = await get(userRef);
                
                if (snapshot.exists() && isLogin) {
                    // Pull from cloud to local
                    const data = snapshot.val();
                    if (data.races) localStorage.setItem('raceHistory', JSON.stringify(data.races));
                    if (data.keyPerf) localStorage.setItem('keyPerformances', JSON.stringify(data.keyPerf));
                    if (data.rank) localStorage.setItem('rankData', JSON.stringify(data.rank));
                } else {
                    // Push local to cloud
                    const localRaces = JSON.parse(localStorage.getItem('raceHistory') || '[]').filter(r => !r.isDrill);
                    const localKeyPerf = JSON.parse(localStorage.getItem('keyPerformances') || '{}');
                    const localRank = JSON.parse(localStorage.getItem('rankData') || 'null');
                    await set(userRef, {
                        races: localRaces,
                        keyPerf: localKeyPerf,
                        rank: localRank
                    });
                }
            } catch (syncErr) {
                console.warn("Initial sync failed, proceeding to session:", syncErr);
            }
            
            onLoginSuccess();
            window.location.reload(); 
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
