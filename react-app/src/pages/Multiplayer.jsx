import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import PlayerProgressBar from '../components/PlayerProgressBar';
import { Network, Copy, Play, ArrowRight, UserPlus, Trophy, RotateCcw } from 'lucide-react';

const SOCKET_SERVER = 'http://localhost:3001';

export default function Multiplayer() {
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
    const [countdown, setCountdown] = useState(3);
    const inputRef = useRef(null);
    const timerRef = useRef(null);
    // Server-authoritative race start time — used for WPM and timer sync
    const startTimeRef = useRef(null);
    // Ref so socket listeners always get the latest playerName without stale closure
    const playerNameRef = useRef('');
    const userInputRef = useRef('');

    // Keep playerNameRef in sync with state
    useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

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

        // raceStarted
        socket.on('raceStarted', ({ text, startTime }) => {
            setText(text);
            setGameState('countdown');
            setUserInput('');
            setTimeLeft(30);
            startTimeRef.current = startTime;

            const timeUntilStart = startTime - Date.now();
            let count = Math.ceil(timeUntilStart / 1000);
            setCountdown(count);

            const countInterval = setInterval(() => {
                count--;
                if (count > 0) {
                    setCountdown(count);
                } else {
                    clearInterval(countInterval);
                    setGameState('racing');
                }
            }, 1000);
        });

        // raceOver
        socket.on('raceOver', (data) => {
            console.log('--- FRONTEND RECEIVED RACE OVER ---');
            console.log('Winner Data from server:', data);
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeLeft(0);
            setGameState('finished');
            setWinnerData(data);
        });

        // roomReset
        socket.on('roomReset', ({ room }) => {
            setPlayers(room.players);
            setGameState('lobby');
            setWinnerData(null);
            setUserInput('');
            setTimeLeft(30);
        });

        return () => {
            socket.off('playerJoined');
            socket.off('playerLeft');
            socket.off('raceStarted');
            socket.off('progressUpdated');
            socket.off('raceOver');
            socket.off('roomReset');
        };
    }, [socket]);

    // Handle Race Timer — synced to server startTime so all clients tick identically
    useEffect(() => {
        if (gameState !== 'racing') return;

        timerRef.current = setInterval(() => {
            if (!startTimeRef.current) return;
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const remaining = Math.max(0, Math.round(30 - elapsed));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timerRef.current);

                const currentInput = userInputRef.current; // Get the latest typed text!
                const elapsedMins = 30 / 60; // 0.5 minutes
                const correct = currentInput.split('').filter((char, i) => char === text[i]).length;
                const finalWpm = Math.round((correct / 5) / elapsedMins) || 0;
                const finalAcc = currentInput.length > 0 ? Math.round((correct / currentInput.length) * 100) : 0;

                setWinnerData(prev => prev || {
                    winnerName: 'Time limit reached!',
                    wpm: finalWpm,
                    accuracy: finalAcc,
                    winnerId: null
                });

                setGameState('finished');
            }
        }, 500); // poll every 500ms for accurate display

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
        if (isHost && roomId) {
            socket.emit('startRace', { roomId });
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
    };

    const handlePlayAgain = () => {
        if (isHost && roomId) {
            socket.emit('resetRoom', { roomId });
        }
    };

    // 4. Typing Mechanics
    const handleInputChange = (e) => {
        if (gameState !== 'racing') return;

        const val = e.target.value;
        if (val.length <= text.length) {
            setUserInput(val);
            userInputRef.current = val;

            // Use server start time for accurate, drift-free elapsed calculation
            const elapsedSec = startTimeRef.current
                ? (Date.now() - startTimeRef.current) / 1000
                : 0;

            // Calculate progress and real-time WPM
            const progressPercentage = (val.length / text.length) * 100;
            const correctChars = val.split('').filter((char, i) => char === text[i]).length;
            const currentWpm = elapsedSec > 0 ? Math.round((correctChars / 5) / (elapsedSec / 60)) : 0;

            // Update local player state
            setPlayers(prev => prev.map(p => {
                if (p.id === socket?.id) {
                    return { ...p, progress: progressPercentage, wpm: currentWpm };
                }
                return p;
            }));

            socket.emit('updateProgress', {
                roomId,
                playerId: socket?.id,
                progressPercentage,
                wpm: currentWpm
            });

            if (val.length === text.length) {
                // Ensure at least 1 second elapsed to prevent Math/Infinity errors
                const elapsedMs = Math.max(1000, Date.now() - startTimeRef.current);
                const elapsedMins = elapsedMs / 60000;

                const correctChars = val.split('').filter((char, i) => char === text[i]).length;
                const finalWpm = Math.round((text.length / 5) / elapsedMins) || 0;
                const finalAccuracy = Math.round((correctChars / text.length) * 100) || 0;

                console.log('--- FRONTEND EMITTING FINISH ---');
                console.log('Room ID:', roomId);
                console.log('startTimeRef.current:', startTimeRef.current);
                console.log('Elapsed Ms:', elapsedMs);
                console.log('WPM Calculated:', finalWpm);
                console.log('Accuracy Calculated:', finalAccuracy);

                socket.emit('playerFinished', {
                    roomId,
                    wpm: finalWpm,
                    accuracy: finalAccuracy
                });
            }
        }
    };

    // UI Renderers
    const renderLobby = () => {
        if (!roomId) {
            return (
                <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto space-y-8 faded-ui flex-1">
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

                <div className="flex justify-center px-4">
                    {isHost ? (
                        <button
                            onClick={handleStartRace}
                            disabled={players.length < 1}
                            className="px-10 py-4 bg-primary text-background-dark font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(0,245,212,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center gap-2 text-lg"
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

                    <div
                        className="w-full text-2xl lg:text-3xl leading-relaxed font-mono tracking-tight text-left relative cursor-text min-h-[300px]"
                        onClick={() => inputRef.current && inputRef.current.focus()}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={handleInputChange}
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

                                return (
                                    <span key={index} className="relative transition-colors duration-75">
                                        {isCursor && (
                                            <span className="absolute left-0 top-0 h-full w-[2px] bg-primary animate-pulse shadow-[0_0_8px_#00f5d4] z-10 -ml-1" />
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

                <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-sm group hover:border-primary/30 transition-all duration-300">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-3 group-hover:text-primary/70">WPM Speed</p>
                        <p className="text-5xl font-black text-primary font-mono tabular-nums">{winnerData?.wpm || 0}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-sm group hover:border-primary/30 transition-all duration-300">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-3 group-hover:text-primary/70">Accuracy</p>
                        <p className="text-5xl font-black text-white font-mono tabular-nums">{winnerData?.accuracy || 0}<span className="text-2xl font-bold ml-1 opacity-50">%</span></p>
                    </div>
                </div>

                {isHost ? (
                    <button
                        onClick={handlePlayAgain}
                        className="group flex items-center gap-3 px-12 py-5 bg-primary text-background-dark font-black rounded-2xl hover:bg-primary/90 transition-all duration-300 shadow-[0_0_30px_rgba(0,245,212,0.3)] hover:scale-105 active:scale-95 text-xl uppercase tracking-wider"
                    >
                        <RotateCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                        Play Again
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3 px-8 py-4 border border-primary/20 bg-primary/5 text-primary font-bold rounded-2xl backdrop-blur-sm">
                            <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                            Waiting for host to reset...
                        </div>
                    </div>
                )}
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
