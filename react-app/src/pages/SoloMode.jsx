import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Zap, BarChart2, Settings, UserCircle, RotateCcw } from 'lucide-react';
import { getRandomQuote } from '../utils/quotes';

const DEFAULT_TIME = 30;

export default function SoloMode() {
    const [text, setText] = useState(() => getRandomQuote('medium'));
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState('idle');
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
    const [errorMap, setErrorMap] = useState({});
    const [difficulty, setDifficulty] = useState('medium');

    const inputRef = useRef(null);

    // Focus input on mount and keep it focused
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Timer logic
    useEffect(() => {
        let timer;
        if (status === 'typing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && status === 'typing') {
            setStatus('finished');
        }
        return () => clearInterval(timer);
    }, [status, timeLeft]);

    const handleInputChange = (e) => {
        if (status === 'finished') return;

        const val = e.target.value;

        if (status === 'idle' && val.length > 0) {
            setStatus('typing');
        }

        if (val.length <= text.length) {
            setUserInput(val);

            // Detect a new character typed that is wrong
            if (val.length > userInput.length) {
                const typedChar = val[val.length - 1];
                const expectedChar = text[val.length - 1];
                if (typedChar !== expectedChar && expectedChar !== ' ') {
                    const missedChar = expectedChar.toLowerCase();
                    setErrorMap(prev => ({ ...prev, [missedChar]: (prev[missedChar] || 0) + 1 }));
                }
            }
        }

        // Auto-finish if type all text
        if (val.length === text.length) {
            setStatus('finished');
        }
    };

    const calculateAccuracy = () => {
        if (userInput.length === 0) return 100;
        const correctChars = userInput.split('').filter((char, i) => char === text[i]).length;
        return ((correctChars / userInput.length) * 100).toFixed(1);
    };

    const calculateWPM = () => {
        const timeElapsed = DEFAULT_TIME - timeLeft;
        if (timeElapsed === 0) return 0;
        const correctChars = userInput.split('').filter((char, i) => char === text[i]).length;
        const words = correctChars / 5;
        const minutes = timeElapsed / 60;
        return Math.round(words / minutes);
    };

    const resetTest = () => {
        setUserInput('');
        setStatus('idle');
        setTimeLeft(DEFAULT_TIME);
        setErrorMap({});
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Save errorMap to localStorage when the test finishes
    useEffect(() => {
        if (status === 'finished' && Object.keys(errorMap).length > 0) {
            const existing = JSON.parse(localStorage.getItem('weakKeys') || '{}');
            const merged = { ...existing };
            for (const [key, count] of Object.entries(errorMap)) {
                merged[key] = (merged[key] || 0) + count;
            }
            localStorage.setItem('weakKeys', JSON.stringify(merged));
        }
    }, [status]);

    // Fetch a new quote whenever difficulty changes
    useEffect(() => {
        setText(getRandomQuote(difficulty));
        setUserInput('');
        setStatus('idle');
        setTimeLeft(DEFAULT_TIME);
        setErrorMap({});
        if (inputRef.current) inputRef.current.focus();
    }, [difficulty]);

    // Allow resetting with Tab + Enter
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                resetTest();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="layout-container flex flex-col min-h-screen">
            <header className="flex items-center justify-between px-8 py-6 border-b border-primary/10 faded-ui">
                <div className="flex items-center gap-2 text-primary">
                    <Zap className="w-8 h-8" />
                    <h2 className="text-xl font-bold tracking-tight">TypingBolt</h2>
                </div>
                <nav className="flex items-center gap-6">
                    <Link to="/" className="flex items-center justify-center p-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
                        <BarChart2 className="w-6 h-6" />
                    </Link>
                    <button className="flex items-center justify-center p-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
                        <Settings className="w-6 h-6" />
                    </button>
                    <div className="w-px h-6 bg-slate-700 mx-2"></div>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary/50 text-sm font-medium transition-all">
                        <UserCircle className="w-5 h-5" />
                        <span>Pro Gamer</span>
                    </button>
                </nav>
            </header>

            <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-8 py-12">
                <div className="faded-ui flex flex-col gap-6 mb-20">
                    <div className="flex items-center justify-center gap-12">
                        <div className="flex gap-1 bg-slate-800/30 p-1 rounded-xl">
                            <button className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary text-background-dark">Time</button>
                            <button className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200">Words</button>
                            <button className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200">Custom</button>
                        </div>
                        <div className="flex gap-1 bg-slate-800/30 p-1 rounded-xl">
                            <button className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200">15s</button>
                            <button className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary">30s</button>
                            <button className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200">60s</button>
                        </div>
                        <div className="flex gap-1 bg-slate-800/30 p-1 rounded-xl">
                            <button 
                                onClick={() => setDifficulty('easy')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${difficulty === 'easy' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Easy
                            </button>
                            <button 
                                onClick={() => setDifficulty('medium')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${difficulty === 'medium' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Medium
                            </button>
                            <button 
                                onClick={() => setDifficulty('hard')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${difficulty === 'hard' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Hard
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col flex-1 items-center justify-center relative">
                    <div className="absolute -top-16 left-0 right-0 flex justify-between items-end px-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40">
                                {status === 'finished' ? 'Final WPM' : 'Time Left'}
                            </span>
                            <div className="text-6xl font-black text-primary drop-shadow-[0_0_15px_rgba(0,245,212,0.3)] font-mono">
                                {status === 'finished' ? calculateWPM() : timeLeft} <span className="text-lg font-medium opacity-50">{status === 'finished' ? 'WPM' : 's'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Accuracy</span>
                            <div className="text-4xl font-bold text-slate-300 font-mono">
                                {calculateAccuracy()}<span className="text-base opacity-50">%</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className="w-full text-3xl leading-relaxed font-mono tracking-tight text-left relative cursor-text"
                        onClick={() => inputRef.current && inputRef.current.focus()}
                    >
                        {/* Hidden Input */}
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
                        />
                        {/* Text Renderer */}
                        <div className="select-none">
                            {text.split('').map((char, index) => {
                                let colorClass = "text-slate-500"; // dim gray initially

                                if (index < userInput.length) {
                                    const isCorrect = userInput[index] === char;
                                    colorClass = isCorrect ? "text-primary" : "text-red-500 bg-red-500/20";
                                }

                                const isCursor = index === userInput.length && status !== 'finished';

                                return (
                                    <span key={index} className="relative">
                                        {/* The caret acts as the blinking cursor right before the character */}
                                        {isCursor && (
                                            <span className="absolute left-0 top-0 h-full w-[2px] bg-primary animate-pulse shadow-[0_0_8px_#00f5d4] z-10 -ml-1" />
                                        )}
                                        <span className={`${colorClass} ${char === ' ' && userInput[index] !== char && index < userInput.length ? 'px-1' : ''}`}>
                                            {char}
                                        </span>
                                    </span>
                                );
                            })}
                            {userInput.length === text.length && status !== 'finished' && (
                                <span className="absolute h-full w-[2px] bg-primary animate-pulse shadow-[0_0_8px_#00f5d4] z-10" />
                            )}
                        </div>
                    </div>

                    <div className="mt-20 faded-ui">
                        <button
                            onClick={resetTest}
                            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors px-6 py-2 rounded-lg bg-slate-800/20"
                        >
                            <RotateCcw className="w-5 h-5" />
                            <span className="text-sm font-medium">Restart Test (Tab)</span>
                        </button>
                    </div>
                </div>
            </main>

            <footer className="p-8 flex justify-between items-center faded-ui">
                <div className="flex gap-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
                    <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                    <a className="hover:text-primary transition-colors" href="#">Support</a>
                    <a className="hover:text-primary transition-colors" href="#">GitHub</a>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/40 rounded-full border border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-[10px] font-bold text-slate-400">1,248 TYPISTS ONLINE</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
