import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import PlayerProgressBar from '../components/PlayerProgressBar';
import { Trophy, Users, Timer, Target, Zap, RotateCcw, ArrowRight, Network, Copy, Play, UserPlus, FileText, Code, Shield, ChevronLeft, Ghost, Download } from 'lucide-react';
import { auth, db } from '../firebase';
import { addDoc, collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { loadData, saveData } from '../utils/storageUtils';
import { syncToLeaderboard, pushStatsToCloud } from '../utils/firebaseUtils';
import { useNavigate } from 'react-router-dom';

const SOCKET_SERVER = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function Multiplayer() {
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [joinInput, setJoinInput] = useState('');

    const [players, setPlayers] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [gameState, setGameState] = useState('lobby'); // 'lobby', 'countdown', 'racing', 'finished'

    const [playerName, setPlayerName] = useState('');
    const [tempName, setTempName] = useState('');
    const [winnerData, setWinnerData] = useState(null);

    // Typing Mechanics State
    const [text, setText] = useState('');
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [difficulty, setDifficulty] = useState('medium');
    const [category, setCategory] = useState('prose');
    const [countdown, setCountdown] = useState(3);
    const [isGhostCaptured, setIsGhostCaptured] = useState(false);
    const [isGlitching, setIsGlitching] = useState(false);
    const [errorMap, setErrorMap] = useState({});
    const [progress, setProgress] = useState(0);
    const [currentWpm, setCurrentWpm] = useState(0);
    const [championGhost, setChampionGhost] = useState(null);
    const [ghostIndex, setGhostIndex] = useState(0);
    const [graceEndTime, setGraceEndTime] = useState(null);

    const inputRef = useRef(null);
    const timerRef = useRef(null);
    const keystrokesRef = useRef([]);

    // Check localStorage for player name on mount
    useEffect(() => {
        const storedName = localStorage.getItem('playerName');
        if (storedName) {
            setPlayerName(storedName);
        }
    }, []);

    // Server-authoritative race start time — used for WPM and timer sync
    const startTimeRef = useRef(null);
    // Ref so socket listeners always get the latest playerName without stale closure
    const playerNameRef = useRef('');
    const userInputRef = useRef('');
    const roomIdRef = useRef('');
    const playersRef = useRef([]);

    // Keep playerNameRef in sync with state
    useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
    useEffect(() => { userInputRef.current = userInput; }, [userInput]);
    useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
    useEffect(() => { playersRef.current = players; }, [players]);

    // 1. Initialize Socket
    useEffect(() => {
        const newSocket = io(SOCKET_SERVER);
        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    // 2. Socket Listeners
    useEffect(() => {
        if (!socket) return;

        // playerJoined
        socket.on('playerJoined', ({ player, room }) => {
            setPlayers(room.players);
        });

        // playerLeft
        socket.on('playerLeft', ({ playerId, newHost, room }) => {
            setPlayers(room.players);
            if (socket.id === newHost) setIsHost(true);
        });

        // progressUpdated
        socket.on('progressUpdated', ({ playerId, progressPercentage, wpm }) => {
            setPlayers(prev => prev.map(p => {
                if (p.id === playerId) {
                    return { ...p, progress: progressPercentage, wpm };
                }
                return p;
            }));
        });

        // raceStarted
        socket.on('raceStarted', ({ text, startTime, championGhost }) => {
            setText(text);
            setChampionGhost(championGhost || null);
            setGameState('countdown');
            setUserInput('');
            setIsGhostCaptured(false);
            setIsGlitching(false);
            setTimeLeft(30);
            setProgress(0);
            setCurrentWpm(0);
            setGhostIndex(0);
            keystrokesRef.current = [];
            startTimeRef.current = startTime;

            const timeUntilStart = startTime - Date.now();
            let count = Math.ceil(timeUntilStart / 1000);
            setCountdown(count);

            const countInterval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.ceil((startTimeRef.current - now) / 1000);

                if (remaining > 0) {
                    setCountdown(remaining);
                } else {
                    clearInterval(countInterval);
                    setCountdown(0);
                    setGameState('racing');
                    // Focus input exactly when countdown hits 0
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }
            }, 100);
        });

        // raceOver
        socket.on('raceOver', (data) => {
            console.log('--- FRONTEND RECEIVED RACE OVER ---', data);
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeLeft(0);
            // Handle Race Over immediately to avoid gray screen
            if (data && data.results) {
                setWinnerData(data);
                setGameState('finished');
            }
            setGraceEndTime(null);

            // Trigger Glitch Effect for Data Retrieval feel
            setIsGlitching(true);
            setTimeout(() => setIsGlitching(false), 1500);

            // Update leaderboard if we won/finished
            const ourResult = data.results?.find(p => p.id === socket?.id);
            if (ourResult) {
                syncToLeaderboard(ourResult.wpm, ourResult.accuracy);
            }

            // Update last local update for sync icon
            localStorage.setItem('lastLocalUpdate', Date.now().toString());
        });

        // gracePeriodStarted
        socket.on('gracePeriodStarted', ({ endTime }) => {
            setGraceEndTime(endTime);
            setGameState('grace_period');
        });

        // roomReset
        socket.on('roomReset', ({ room }) => {
            setPlayers(room.players);
            setGameState('lobby');
            setWinnerData(null);
            setUserInput('');
            setTimeLeft(30);
            setProgress(0);
            setCurrentWpm(0);
            setIsGhostCaptured(false);
            setGraceEndTime(null);
        });

        return () => {
            socket.off('playerJoined');
            socket.off('playerLeft');
            socket.off('progressUpdated');
            socket.off('raceStarted');
            socket.off('raceOver');
            socket.off('roomReset');
        };
    }, [socket]);

    // Throttled Progress Update
    useEffect(() => {
        if (gameState !== 'racing' || !socket || !roomIdRef.current) return;

        const emitProgress = () => {
            socket.emit('updateProgress', {
                roomId: roomIdRef.current,
                playerId: socket.id,
                progressPercentage: progress,
                wpm: currentWpm
            });
        };

        const timeout = setTimeout(emitProgress, 500); // 500ms throttle
        return () => clearTimeout(timeout);
    }, [progress, currentWpm, socket, gameState]);

    // Ghost Cursor Animation Loop
    useEffect(() => {
        let animationFrame;
        if (gameState === 'racing' && championGhost?.keystrokes?.length > 0) {
            const start = startTimeRef.current;
            const animate = () => {
                const elapsed = Date.now() - start;
                let index = 0;
                const strokes = championGhost.keystrokes;
                for (let i = 0; i < strokes.length; i++) {
                    if (strokes[i].time <= elapsed) {
                        index = i + 1;
                    } else {
                        break;
                    }
                }
                setGhostIndex(index);
                animationFrame = requestAnimationFrame(animate);
            };
            animationFrame = requestAnimationFrame(animate);
        } else {
            setGhostIndex(0);
        }
        return () => cancelAnimationFrame(animationFrame);
    }, [gameState, championGhost]);

    // Handle Race Timer — synced to server startTime so all clients tick identically
    useEffect(() => {
        if (gameState !== 'racing') return;

        timerRef.current = setInterval(() => {
            if (!startTimeRef.current) return;
            const now = Date.now();
            const elapsed = (now - startTimeRef.current) / 1000;
            const remaining = Math.max(0, Math.round(30 - elapsed));
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timerRef.current);

                const currentVal = userInputRef.current;
                const correct = currentVal.split('').filter((char, i) => char === text[i]).length;
                const elapsedMins = 0.5; // 30 seconds
                const finalWpm = Math.round((correct / 5) / elapsedMins) || 0;
                const finalAcc = currentVal.length > 0 ? Math.round((correct / currentVal.length) * 100) : 0;

                const currentPlayers = playersRef.current;
                if (currentPlayers.length > 0) {
                    const sorted = [...currentPlayers].sort((a, b) => {
                        if (b.progress !== a.progress) return b.progress - a.progress;
                        return b.wpm - a.wpm;
                    });
                    const topPlayer = sorted[0];

                    setWinnerData(prev => prev || {
                        winnerName: topPlayer.name,
                        wpm: topPlayer.wpm,
                        accuracy: topPlayer.id === socket?.id ? finalAcc : 100, // Approximate accuracy if not us
                        winnerId: topPlayer.id
                    });
                } else {
                    setWinnerData(prev => prev || {
                        winnerName: 'Time limit reached!',
                        wpm: finalWpm,
                        accuracy: finalAcc,
                        winnerId: null
                    });
                }

                setGameState('finished');

                // Cloud Data Flow Fix
                if (auth.currentUser) {
                    pushStatsToCloud(finalWpm, finalAcc, 'multiplayer');
                } else {
                    syncToLeaderboard(finalWpm, finalAcc);
                }
            }
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState]);

    // Keep input focused during race
    useEffect(() => {
        if ((gameState === 'racing' || gameState === 'countdown') && inputRef.current) {
            inputRef.current.focus();
        }
    }, [gameState]);

    // 3. Actions
    const handleCreateRoom = () => {
        if (!playerName) return;
        socket.emit('createRoom', { playerName }, (res) => {
            if (res.success) {
                setRoomId(res.roomId);
                setIsHost(true);
                setPlayers(res.room.players);
            }
        });
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (!joinInput.trim() || !playerName) return;
        socket.emit('joinRoom', {
            roomId: joinInput.trim(),
            user: { playerName }
        }, (res) => {
            if (res.success) {
                setRoomId(res.room.id);
                setIsHost(false);
                setPlayers(res.room.players);
            } else {
                alert(res.error);
            }
        });
    };

    const handleStartRace = () => {
        if (isHost && roomIdRef.current) {
            socket.emit('startRace', { roomId: roomIdRef.current, difficulty, category });
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
    };

    const handlePlayAgain = () => {
        if (isHost && roomIdRef.current) {
            socket.emit('resetRoom', { roomId: roomIdRef.current });
        }
    };

    const handleExitLobby = () => {
        if (socket) {
            if (roomId) socket.emit('leaveRoom', { roomId });
            socket.disconnect();
        }
        navigate('/');
    };

    // 4. Typing Mechanics
    // Keep track of errors for weakKeys

    const processKeystroke = (val) => {
        if (gameState !== 'racing' && gameState !== 'grace_period') return;

        if (val.length <= text.length) {
            if (val.length > userInput.length) {
                const typedChar = val[val.length - 1];
                const expectedChar = text[val.length - 1];
                if (typedChar !== expectedChar && expectedChar !== ' ') {
                    const missedChar = expectedChar.toLowerCase();
                    setErrorMap(prev => ({ ...prev, [missedChar]: (prev[missedChar] || 0) + 1 }));
                }

                if (startTimeRef.current) {
                    const timeOffset = Date.now() - startTimeRef.current;
                    keystrokesRef.current.push({ char: typedChar, time: timeOffset });
                }
            }

            setUserInput(val);

            const now = Date.now();
            const elapsedMs = Math.max(1, now - startTimeRef.current);
            const elapsedMins = elapsedMs / 60000;

            const progressPercentage = Math.round((val.length / text.length) * 100);
            const correctChars = val.split('').filter((char, i) => char === text[i]).length;
            const calculatedWpm = Math.max(0, Math.round((correctChars / 5) / (elapsedMs / 60000)));

            setProgress(progressPercentage);
            setCurrentWpm(calculatedWpm);

            setPlayers(prev => prev.map(p => {
                if (p.id === socket?.id) {
                    return { ...p, progress: progressPercentage, wpm: calculatedWpm };
                }
                return p;
            }));

            if (val.length === text.length && text.length > 0) {
                const finalAccuracy = Math.round((correctChars / text.length) * 100) || 0;
                socket.emit('playerFinished', {
                    roomId: roomIdRef.current,
                    wpm: calculatedWpm,
                    accuracy: finalAccuracy,
                    keystrokes: keystrokesRef.current
                });
            }
        }
    };

    const handleInputChange = (e) => processKeystroke(e.target.value);

    const handleKeyDown = (e) => {
        if (gameState === 'racing' && category === 'code') {
            if (e.key === 'Tab') {
                e.preventDefault();
                const nextChunk = text.slice(userInput.length);
                const indentMatch = nextChunk.match(/^ +/);
                const indent = indentMatch ? indentMatch[0] : "    ";
                processKeystroke(userInput + indent);
            } else if (e.key === 'Enter') {
                const expectedChar = text[userInput.length];
                if (expectedChar === '\n') {
                    e.preventDefault();
                    processKeystroke(userInput + '\n');
                }
            }
        }
    };

    // Save weakKeys on finish
    useEffect(() => {
        if (gameState === 'finished' && Object.keys(errorMap).length > 0) {
            const existing = JSON.parse(localStorage.getItem('weakKeys') || '{}');
            const merged = { ...existing };
            for (const [key, count] of Object.entries(errorMap)) {
                merged[key] = (merged[key] || 0) + count;
            }
            localStorage.setItem('weakKeys', JSON.stringify(merged));
        }
    }, [gameState]);


    const handleArchiveGhost = async (playerData) => {
        // Ensure winnerData has the race text before archiving
        const raceText = winnerData?.text || text;
        if (!raceText || !playerData.keystrokes) return;

        const ghostId = `ghost_${Date.now()}`;
        const newGhost = {
            id: ghostId,
            operatorName: playerData.name,
            wpm: playerData.wpm,
            accuracy: playerData.accuracy || 100,
            keystrokes: playerData.keystrokes,
            text: raceText,
            timestamp: new Date().toISOString()
        };

        try {
            const existing = loadData('ghostLibrary', []);
            saveData('ghostLibrary', [...existing, newGhost]);

            // UI Feedback
            alert(`Ghost of ${playerData.name} archived to local vault!`);
        } catch (err) {
            console.error("Failed to archive ghost:", err);
            alert("Archive protocol failed. Check storage allocation.");
        }
    };

    // UI Renderers
    const renderLobby = () => {
        if (!roomId) {
            return (
                <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto space-y-8 faded-ui flex-1 relative">
                    <button
                        onClick={() => { socket.disconnect(); navigate('/'); }}
                        className="absolute -top-12 left-0 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-widest text-xs group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>
                    <div className="text-center w-full">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Multiplayer Arena</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">Race against your friends in real-time</p>

                        <button
                            onClick={handleCreateRoom}
                            className="w-full py-4 bg-primary text-background-dark font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(0,245,212,0.3)] flex items-center justify-center gap-2 text-lg"
                        >
                            <Network className="w-6 h-6" /> Create New Room
                        </button>

                        <div className="flex items-center gap-4 my-8">
                            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
                            <span className="text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest text-xs">OR</span>
                            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
                        </div>

                        <form onSubmit={handleJoinRoom} className="flex gap-2">
                            <input
                                type="text"
                                value={joinInput}
                                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                                placeholder="ENTER ROOM CODE..."
                                className="flex-1 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary uppercase tracking-widest text-center font-bold"
                                maxLength={4}
                            />
                            <button
                                type="submit"
                                className="px-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold rounded-xl transition-colors flex items-center justify-center"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-4xl mx-auto w-full faded-ui flex-1 flex flex-col pt-12">
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 py-6 mb-8 shrink-0 bg-white dark:bg-slate-800/20 px-8 rounded-t-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <Network className="text-primary w-6 h-6" />
                        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">Room Code: <span className="text-primary tracking-widest">{roomId}</span></h2>
                    </div>
                    <button onClick={copyRoomCode} className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors text-sm font-bold">
                        <Copy className="w-4 h-4" />
                        <span>Copy Invite</span>
                    </button>
                </header>

                <div className="flex justify-end mb-4 px-4">
                    <button
                        onClick={handleExitLobby}
                        className="px-6 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    >
                        Exit Lobby
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 px-4">
                    {players.map((p, i) => (
                        <div key={p.id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 flex items-center gap-4 relative overflow-hidden shadow-sm">
                            {p.id === socket?.id && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
                            <div className="w-12 h-12 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center font-bold text-xl text-primary">
                                {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    {p.name} {p.id === socket?.id && <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-0.5 rounded">You</span>}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{players[0]?.id === p.id ? 'Host' : 'Player'}</p>
                            </div>
                        </div>
                    ))}
                    {[...Array(Math.max(0, 4 - players.length))].map((_, i) => (
                        <div key={`empty-${i}`} className="border border-dashed border-slate-300 dark:border-slate-700/50 rounded-xl p-6 flex items-center justify-center gap-2 opacity-50">
                            <UserPlus className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            <span className="text-slate-400 dark:text-slate-500 font-medium tracking-wide">Waiting for player...</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-6 px-4">
                    {isHost && (
                        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Select Difficulty</span>
                            <div className="flex gap-1 bg-slate-800/30 p-1 rounded-xl border border-slate-700/30 w-full">
                                {['easy', 'medium', 'hard'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${difficulty === d
                                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,245,212,0.1)]'
                                                : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>

                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-4">Data Stream</span>
                            <div className="flex gap-1 bg-slate-800/30 p-1 rounded-xl border border-slate-700/30 w-full">
                                <button
                                    onClick={() => setCategory('prose')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${category === 'prose'
                                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,245,212,0.1)]'
                                            : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    <FileText className="w-3.5 h-3.5" /> Prose
                                </button>
                                <button
                                    onClick={() => setCategory('code')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${category === 'code'
                                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,245,212,0.1)]'
                                            : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    <Code className="w-3.5 h-3.5" /> Code
                                </button>
                            </div>
                        </div>
                    )}

                    {isHost ? (
                        <button
                            onClick={handleStartRace}
                            disabled={players.length < 1}
                            className="px-10 py-4 bg-primary text-background-dark font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(0,245,212,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center gap-2 text-lg uppercase tracking-tighter"
                        >
                            <Play className="w-6 h-6 fill-background-dark" /> Start Race Now
                        </button>
                    ) : (
                        <div className="px-10 py-4 border border-primary/30 text-primary font-bold rounded-xl bg-primary/5 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            Waiting for host to start...
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderRace = () => {
        return (
            <div className="flex flex-col lg:flex-row gap-12 w-full max-w-6xl mx-auto h-full px-4 items-center">
                {/* Left Side: Progress Bars */}
                <div className="w-full lg:w-1/4 flex flex-col gap-6 select-none shrink-0">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40">Race Status</span>
                        <div className="text-4xl font-black text-primary drop-shadow-[0_0_15px_rgba(0,245,212,0.3)] font-mono">
                            {gameState === 'finished' ? '0' : timeLeft}<span className="text-sm font-medium opacity-50 ml-1">s</span>
                        </div>
                    </div>

                    <div className="space-y-6 bg-white dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/30 shadow-sm">
                        {players.map(p => (
                            <PlayerProgressBar key={p.id} player={p} isCurrentUser={p.id === socket?.id} />
                        ))}
                    </div>
                </div>

                {/* Right Side: Typing Area */}
                <div className="w-full lg:w-3/4 flex flex-col relative mt-12 lg:mt-0">
                    {gameState === 'countdown' && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm rounded-2xl">
                            <div className="text-9xl font-black text-primary animate-pulse drop-shadow-[0_0_30px_rgba(0,245,212,0.5)]">
                                {countdown > 0 ? countdown : 'GO!'}
                            </div>
                        </div>
                    )}

                    {gameState === 'grace_period' && graceEndTime && (
                        <div className="absolute top-0 right-0 z-[60] bg-red-600 text-white px-6 py-3 rounded-bl-2xl font-black uppercase tracking-[0.2em] shadow-lg animate-in slide-in-from-top-4 duration-300">
                            10s GRACE PERIOD: {Math.max(0, Math.ceil((graceEndTime - Date.now()) / 1000))}s
                        </div>
                    )}

                    <div
                        className="w-full text-2xl lg:text-3xl leading-relaxed font-mono tracking-tight text-left relative cursor-text min-h-[300px]"
                        onClick={() => inputRef.current && inputRef.current.focus()}
                    >
                        {championGhost && championGhost.wpm > 0 && (
                            <div className="absolute -top-10 left-0 bg-yellow-400/10 border border-yellow-400/30 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                                👑 Champion: {championGhost.name} ({championGhost.wpm} WPM)
                            </div>
                        )}
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="absolute opacity-0 -z-10 focus:outline-none"
                            autoFocus
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            disabled={gameState !== 'racing'}
                        />
                        <div className="select-none">
                            {text.split('').map((char, index) => {
                                let colorClass = "text-slate-400 dark:text-slate-500"; // not typed

                                if (index < userInput.length) {
                                    const isCorrect = userInput[index] === char;
                                    colorClass = isCorrect ? "text-primary drop-shadow-[0_0_5px_rgba(0,245,212,0.5)]" : "text-red-500 bg-red-500/20";
                                }

                                const isCursor = index === userInput.length && gameState === 'racing';
                                const isGhost = index === ghostIndex && gameState === 'racing' && championGhost;

                                return (
                                    <span key={index} className="relative transition-colors duration-75">
                                        {isCursor && (
                                            <span className="absolute left-0 top-0 h-full w-[2px] bg-primary animate-pulse shadow-[0_0_8px_#00f5d4] z-10 -ml-1" />
                                        )}
                                        {isGhost && (
                                            <span className="absolute left-0 top-0 h-full w-[2px] bg-yellow-400/50 shadow-[0_0_8px_rgba(250,204,21,0.5)] z-0 -ml-1 transition-all duration-300 ease-linear" />
                                        )}
                                        <span className={`${colorClass} ${char === ' ' && userInput[index] !== char && index < userInput.length ? 'px-1' : ''}`}>
                                            {char}
                                        </span>
                                    </span>
                                );
                            })}
                            {userInput.length > 0 && userInput.length === text.length && gameState === 'racing' && (
                                <span className="absolute h-full w-[2px] bg-primary animate-pulse shadow-[0_0_8px_#00f5d4] z-10" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFinished = () => {
        // SCENARIO FIX: If the race ends but winnerData hasn't propagated across the socket yet
        if (!winnerData) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-20 animate-pulse">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Syncing Final Results...</h2>
                    <p className="text-slate-500 mt-2">Waiting for neural data from other operators</p>
                </div>
            );
        }

        const isWinner = winnerData?.winnerId === socket?.id;

        return (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-10 py-20 px-4 animate-in fade-in zoom-in duration-500">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <div className="relative bg-background-dark/80 backdrop-blur-xl p-12 rounded-full border border-primary/30 flex items-center justify-center shadow-[0_0_50px_rgba(0,245,212,0.2)]">
                        <Trophy className={`w-24 h-24 ${isWinner ? 'text-primary' : 'text-slate-500'} drop-shadow-[0_0_15px_rgba(0,245,212,0.5)]`} />
                    </div>
                </div>

                <div className="text-center space-y-4">
                    <h2 className="text-5xl font-black text-white tracking-tight uppercase italic">
                        {isWinner ? 'Victory is Yours!' : 'Race Finished!'}
                    </h2>
                    <p className="text-slate-400 text-xl font-medium">
                        {isWinner ? "You've outpaced everyone in the arena." : `The winner is ${winnerData?.winnerName || 'Unknown'}`}
                    </p>
                </div>

                <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                    <div className="bg-white/10 px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Neural Race Results</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{winnerData?.results?.length || 0} Operators Detected</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {winnerData?.results?.map((p, idx) => {
                            const isUs = p.id === socket?.id;
                            const isWinner = p.id === winnerData.winnerId;
                            return (
                                <div key={p.id} className={`flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors ${isWinner ? 'bg-primary/5' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isWinner ? 'bg-primary text-background-dark' : 'bg-white/10 text-slate-400'}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className={`font-bold flex items-center gap-2 ${isUs ? 'text-primary' : 'text-white'}`}>
                                                {p.name} {isUs && <span className="text-[10px] opacity-60">(YOU)</span>}
                                            </div>
                                            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                                {p.wpm} WPM | {p.accuracy}% ACC
                                            </div>
                                        </div>
                                    </div>
                                    {!isUs && p.keystrokes?.length > 0 && (
                                        <button
                                            onClick={() => handleArchiveGhost(p)}
                                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all group"
                                            title="Archive Ghost"
                                        >
                                            <Download className="w-4 h-4 group-hover:scale-110" />
                                        </button>
                                    )}
                                    {isWinner && isUs && (
                                        <div className="flex items-center gap-2 text-primary">
                                            <Trophy className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Champion</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-xs transition-all duration-300">
                    {isHost ? (
                        <button
                            onClick={handlePlayAgain}
                            className="group flex items-center justify-center gap-3 px-8 py-4 bg-primary text-background-dark font-black rounded-2xl hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(0,245,212,0.3)] hover:scale-105 active:scale-95 text-lg uppercase tracking-wider"
                        >
                            <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            Play Again
                        </button>
                    ) : (
                        <div className="flex items-center justify-center gap-3 px-8 py-4 border border-primary/20 bg-primary/5 text-primary font-bold rounded-2xl backdrop-blur-sm">
                            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            Wait for host...
                        </div>
                    )}

                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-8 py-4 border border-white/10 text-slate-400 font-bold rounded-2xl hover:bg-white/5 hover:text-white transition-all uppercase tracking-widest text-sm"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    };

    const renderNickname = () => {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto space-y-8 animate-in fade-in zoom-in duration-700 mt-20">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <UserPlus className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-wider">Identity Required</h2>
                    <p className="text-slate-500 font-medium">Enter your nickname to enter the arena</p>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (tempName.trim()) {
                            const name = tempName.trim();
                            localStorage.setItem('playerName', name);
                            playerNameRef.current = name; // update ref immediately, synchronously
                            setPlayerName(name);
                        }
                    }}
                    className="w-full space-y-4"
                >
                    <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="TYPE NICKNAME..."
                        autoFocus
                        maxLength={15}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all text-center font-bold text-xl tracking-widest uppercase"
                    />
                    <button
                        type="submit"
                        disabled={!tempName.trim()}
                        className="w-full py-5 bg-primary text-background-dark font-black rounded-2xl hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(0,245,212,0.2)] disabled:opacity-50 disabled:shadow-none text-xl uppercase tracking-widest"
                    >
                        Continue to Arena
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="layout-container flex flex-col min-h-screen">
            <main className="flex-1 flex flex-col w-full relative">
                {!playerName ? renderNickname() : (
                    <>
                        {gameState === 'lobby' && renderLobby()}
                        {(gameState === 'racing' || gameState === 'countdown') && renderRace()}
                        {gameState === 'finished' && renderFinished()}
                    </>
                )}
            </main>
        </div>
    );
}
