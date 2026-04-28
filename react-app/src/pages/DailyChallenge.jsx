import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import ToastContainer from '../components/ToastContainer';
import useToast from '../hooks/useToast';
import { auth, db } from '../firebase';
import { 
    doc, 
    setDoc, 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    getDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { syncCrucialData } from '../utils/firebaseUtils';
import { checkAchievements, saveAchievements, buildStatsForAchievements } from '../utils/achievementUtils';
import { launchConfetti } from '../utils/confettiUtils';
import { recordKeyLatency, isTrackableKey } from '../utils/heatmapUtils';
import { playErrorSound, playSuccessSound } from '../utils/soundUtils';
import { 
    Trophy, 
    Timer, 
    Target, 
    Zap, 
    RotateCcw, 
    Calendar, 
    Lock, 
    Crown,
    Activity,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    CheckCircle
} from 'lucide-react';

const SOCKET_SERVER = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function DailyChallenge() {
    const navigate = useNavigate();
    const { toasts, addToast, removeToast } = useToast();
    
    // Challenge State
    const [challengeText, setChallengeText] = useState('');
    const [challengeDate, setChallengeDate] = useState('');
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState('loading'); // loading, waiting, typing, finished
    const [timeLeft, setTimeLeft] = useState(150);
    const [finalWPM, setFinalWPM] = useState(0);
    const [finalAcc, setFinalAcc] = useState(100);
    const [leaderboard, setLeaderboard] = useState([]);
    const [hasPlayedToday, setHasPlayedToday] = useState(false);
    const [todayScore, setTodayScore] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const [scoreSaved, setScoreSaved] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Refs
    const inputRef = useRef(null);
    const cursorRef = useRef(null);
    const startTimeRef = useRef(null);
    const endTimeRef = useRef(null);
    const timerRef = useRef(null);
    const lastKeystrokeTimeRef = useRef(null);
    const errorMapRef = useRef({});
    const socketRef = useRef(null);

    // Initial Load
    useEffect(() => {
        const socket = io(SOCKET_SERVER);
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('getDailyChallenge', async (response) => {
                if (response.success) {
                    setChallengeText(response.text);
                    setChallengeDate(response.date);
                    
                    // Check if user has played
                    if (auth.currentUser) {
                        const scoreDoc = await getDoc(doc(db, 'daily_scores', response.date, 'scores', auth.currentUser.uid));
                        if (scoreDoc.exists()) {
                            setHasPlayedToday(true);
                            setTodayScore(scoreDoc.data());
                        }
                    }

                    // Fetch Leaderboard
                    fetchLeaderboard(response.date);
                    setStatus('waiting');
                }
            });
        });

        return () => {
            socket.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
        return () => unsubscribe();
    }, []);

    const fetchLeaderboard = async (date) => {
        try {
            const q = query(
                collection(db, 'daily_scores', date, 'scores'),
                orderBy('wpm', 'desc'),
                limit(10)
            );
            const querySnapshot = await getDocs(q);
            const scores = [];
            querySnapshot.forEach((doc) => {
                scores.push({ id: doc.id, ...doc.data() });
            });
            setLeaderboard(scores);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
        }
    };

    // Timer Logic
    useEffect(() => {
        if (status === 'typing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        endTimeRef.current = Date.now();
                        finishChallenge();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [status]);

    useEffect(() => {
        if (cursorRef.current) {
            cursorRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [userInput.length]);

    const handleInputChange = (e) => {
        if (status === 'finished' || status === 'loading') return;
        
        const val = e.target.value;
        const now = Date.now();

        if (status === 'waiting' && val.length > 0) {
            setStatus('typing');
            startTimeRef.current = now;
        }

        if (val.length <= challengeText.length) {
            const prevLength = userInput.length;
            
            // Error & Latency Detection
            if (val.length > prevLength) {
                const typedChar = val[val.length - 1];
                const expectedChar = challengeText[val.length - 1];
                
                if (typedChar !== expectedChar) {
                    playErrorSound();
                    const key = expectedChar.toLowerCase();
                    errorMapRef.current[key] = (errorMapRef.current[key] || 0) + 1;
                } else if (isTrackableKey(typedChar)) {
                    if (lastKeystrokeTimeRef.current !== null) {
                        const latencyMs = now - lastKeystrokeTimeRef.current;
                        recordKeyLatency(typedChar, latencyMs);
                    }
                }
                lastKeystrokeTimeRef.current = now;
            }

            setUserInput(val);

            if (val.length === challengeText.length) {
                finishChallenge();
            }
        }
    };

    const finishChallenge = () => {
        if (status === 'finished') return;
        
        const now = Date.now();
        endTimeRef.current = now;
        setStatus('finished');
        
        // Finalize Stats
        const wpm = calculateWPM(now);
        const acc = calculateAccuracy();
        setFinalWPM(wpm);
        setFinalAcc(acc);
        playSuccessSound();

        // Save to Local Race History
        try {
            const history = JSON.parse(localStorage.getItem('raceHistory') || '[]');
            history.push({ wpm, accuracy: acc, date: now, mode: 'daily' });
            localStorage.setItem('raceHistory', JSON.stringify(history.slice(-50)));
        } catch (e) {
            console.error("Failed to save daily history:", e);
        }

        // Save to Firestore
        if (auth.currentUser && !hasPlayedToday) {
            saveScore(wpm, acc);
        }

        // Achievement Check Logic
        const stats = buildStatsForAchievements();
        const newAchievements = checkAchievements(stats);
        if (newAchievements.length > 0) {
            saveAchievements(newAchievements);
            newAchievements.forEach(a => {
                addToast({ message: `${a.icon} ${a.title} — ${a.description}`, type: 'achievement' });
            });

            // Launch highest rarity confetti
            const hasLegendary = newAchievements.some(a => a.rarity === 'legendary');
            const hasRare = newAchievements.some(a => a.rarity === 'rare');
            
            if (hasLegendary) launchConfetti('legendary');
            else if (hasRare) launchConfetti('rare');
        }
    };

    const calculateWPM = (endTime) => {
        if (!startTimeRef.current) return 0;
        const elapsedMs = Math.max(1, endTime - startTimeRef.current);
        const elapsedSeconds = elapsedMs / 1000;
        const correctChars = userInput.split('').filter((char, i) => char === challengeText[i]).length;
        return Math.round((correctChars / 5) / (elapsedSeconds / 60));
    };

    const calculateAccuracy = () => {
        if (userInput.length === 0) return 100;
        const correctChars = userInput.split('').filter((char, i) => char === challengeText[i]).length;
        return ((correctChars / challengeText.length) * 100).toFixed(1);
    };

    const saveScore = async (wpm, acc) => {
        try {
            const playerName = localStorage.getItem('playerName') || auth.currentUser.displayName || 'Anonymous';
            await setDoc(doc(db, 'daily_scores', challengeDate, 'scores', auth.currentUser.uid), {
                wpm,
                acc: parseFloat(acc),
                name: playerName,
                timestamp: serverTimestamp()
            });
            syncCrucialData(wpm, acc);
            fetchLeaderboard(challengeDate);
            setHasPlayedToday(true);
            setTodayScore({ wpm, acc, name: playerName });
            addToast("Daily score synchronized with neural grid.", 'success');
        } catch (err) {
            console.error("Error saving score:", err);
            addToast("Failed to link score to neural grid.", 'error');
        }
    };

    // Live Stats for UI
    const currentWPM = status === 'typing' ? calculateWPM(Date.now()) : (status === 'finished' ? finalWPM : 0);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-primary/60 font-mono animate-pulse uppercase tracking-widest text-xs">Syncing Daily Protocol...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary/30 relative">
            {/* Background Scanline Effect */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            
            <Navbar />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <main className="max-w-7xl mx-auto px-6 py-12">
                {!auth.currentUser && status !== 'finished' && (
                    <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <Lock className="w-5 h-5 text-amber-500" />
                        <p className="text-amber-500 text-sm font-medium uppercase tracking-wider">
                            Neural Link not established. <button onClick={() => setShowAuth(true)} className="underline cursor-pointer font-black hover:text-amber-300 transition-colors">Sign in</button> to appear on the leaderboard.
                        </p>
                    </div>
                )}

                {hasPlayedToday ? (
                    <div className="flex flex-col gap-12">
                        <div className="bg-slate-900/50 border border-primary/20 rounded-3xl p-12 text-center max-w-2xl mx-auto backdrop-blur-xl animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Calendar className="w-10 h-10 text-primary" />
                            </div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Challenge Complete</h1>
                            <p className="text-slate-400 font-medium mb-8">You have already completed today's challenge. Come back tomorrow for a new one.</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Speed</div>
                                    <div className="text-4xl font-black text-primary font-mono">{todayScore?.wpm} <span className="text-sm">WPM</span></div>
                                </div>
                                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Accuracy</div>
                                    <div className="text-4xl font-black text-primary font-mono">{todayScore?.acc}%</div>
                                </div>
                            </div>
                            
                            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-light font-bold uppercase tracking-widest text-sm transition-colors">
                                Return to Dashboard <RotateCcw className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Leaderboard below in finished state */}
                        <div className="max-w-4xl mx-auto w-full">
                            <Leaderboard date={challengeDate} scores={leaderboard} currentUserId={auth.currentUser?.uid} />
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column: Typing Area */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3 text-primary">
                                    <Calendar className="w-6 h-6" />
                                    <span className="font-mono font-black uppercase tracking-widest text-sm">{formatDate(challengeDate)}</span>
                                </div>
                                <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Daily Challenge</h1>
                            </div>

                            {/* Stats Row */}
                            <div className="flex gap-4">
                                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Timer className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Remaining</span>
                                    </div>
                                    <div className={`text-4xl font-black font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                        {timeLeft}s
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Speed</span>
                                    </div>
                                    <div className="text-4xl font-black font-mono text-white">
                                        {currentWPM} <span className="text-xs text-slate-500">WPM</span>
                                    </div>
                                </div>
                            </div>

                            {/* Typing Area */}
                            <div 
                                className="relative bg-slate-900/40 border-2 border-slate-800 rounded-3xl p-10 min-h-[400px] group transition-all duration-500 hover:border-primary/20 cursor-text"
                                onClick={() => inputRef.current?.focus()}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="absolute opacity-0 pointer-events-none"
                                    value={userInput}
                                    onChange={handleInputChange}
                                    autoFocus
                                    disabled={status === 'finished'}
                                />
                                
                                <div 
                                    className="text-2xl font-mono leading-relaxed tracking-tight select-none overflow-y-auto max-h-[300px] [&::-webkit-scrollbar]:hidden"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {challengeText.split('').map((char, index) => {
                                        let color = "text-slate-600";
                                        let isCursor = index === userInput.length;
                                        
                                        if (index < userInput.length) {
                                            color = userInput[index] === char ? "text-slate-100" : "text-red-500 bg-red-500/10";
                                        }

                                        return (
                                            <span key={index} className={`relative ${color} transition-colors duration-150`}>
                                                {isCursor && status !== 'finished' && (
                                                    <span ref={cursorRef} className="absolute -left-[1px] top-0 w-[2px] h-[1.2em] bg-primary animate-pulse shadow-[0_0_8px_rgba(0,245,212,0.8)]" />
                                                )}
                                                {char}
                                            </span>
                                        );
                                    })}
                                </div>

                                {status === 'waiting' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] rounded-3xl">
                                        <div className="text-center animate-in fade-in zoom-in">
                                            <div className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4">Neural Link Ready</div>
                                            <div className="text-slate-400 font-medium">Start typing to begin the challenge</div>
                                        </div>
                                    </div>
                                )}

                                {status === 'finished' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-3xl animate-in fade-in">
                                        <div className="text-center p-8">
                                            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Protocol Finalized</h2>
                                            <div className="flex gap-8 justify-center mt-6">
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Final WPM</div>
                                                    <div className="text-4xl font-black text-primary font-mono">{finalWPM}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Accuracy</div>
                                                    <div className="text-4xl font-black text-primary font-mono">{finalAcc}%</div>
                                                </div>
                                            </div>
                                            <div className="mt-8">
                                                {!currentUser ? (
                                                    <button 
                                                        onClick={() => setShowAuth(true)}
                                                        className="px-6 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all flex items-center gap-2 mx-auto"
                                                    >
                                                        <Lock className="w-4 h-4" /> Sign In to Save Your Score
                                                    </button>
                                                ) : (!scoreSaved && status === 'finished') ? (
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                await setDoc(doc(db, 'daily_scores', challengeDate, 'scores', currentUser.uid), { 
                                                                    wpm: finalWPM, 
                                                                    acc: finalAcc, 
                                                                    name: localStorage.getItem('playerName') || 'Anonymous', 
                                                                    timestamp: serverTimestamp() 
                                                                });
                                                                setScoreSaved(true);
                                                                fetchLeaderboard(challengeDate);
                                                                addToast("Score saved to leaderboard!", 'success');
                                                            } catch (err) {
                                                                console.error(err);
                                                                addToast("Failed to save score.", 'error');
                                                            }
                                                        }}
                                                        className="px-8 py-4 bg-primary text-background-dark font-black uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(0,245,212,0.4)] transition-all flex items-center gap-2 mx-auto"
                                                    >
                                                        <Trophy className="w-5 h-5" /> Save My Score to Leaderboard
                                                    </button>
                                                ) : scoreSaved ? (
                                                    <div className="text-primary font-black uppercase tracking-widest text-sm flex items-center gap-2 justify-center">
                                                        <CheckCircle className="w-5 h-5" /> Score Saved to Leaderboard!
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Leaderboard */}
                        <div className="space-y-6">
                            <Leaderboard date={challengeDate} scores={leaderboard} currentUserId={auth.currentUser?.uid} />
                        </div>
                    </div>
                )}
            </main>
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLoginSuccess={() => setShowAuth(false)} />}
        </div>
    );
}

function Leaderboard({ date, scores, currentUserId }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm h-fit">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Today's Leaderboard</h2>
                </div>
            </div>
            
            <div className="divide-y divide-slate-800/50">
                {scores.length > 0 ? (
                    scores.map((score, index) => (
                        <div 
                            key={score.id}
                            className={`p-4 flex items-center gap-4 transition-colors ${score.id === currentUserId ? 'bg-primary/5' : 'hover:bg-slate-800/30'}`}
                        >
                            <div className="w-6 text-center">
                                {index === 0 ? <Crown className="w-4 h-4 text-yellow-500 mx-auto" /> : 
                                 index === 1 ? <div className="text-slate-400 font-mono text-xs font-bold">2</div> :
                                 index === 2 ? <div className="text-amber-700 font-mono text-xs font-bold">3</div> :
                                 <div className="text-slate-600 font-mono text-xs">{index + 1}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-bold truncate ${score.id === currentUserId ? 'text-primary' : 'text-slate-200'}`}>
                                    {score.name}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-white font-mono">{score.wpm} <span className="text-[9px] text-slate-500">WPM</span></div>
                                <div className="text-[10px] text-slate-500 font-medium">{score.acc}% ACC</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center">
                        <Activity className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No scores yet today.<br/>Be the first!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
