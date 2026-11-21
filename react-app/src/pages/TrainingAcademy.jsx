import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    GraduationCap, 
    ChevronRight, 
    Lock, 
    Play, 
    Cpu,
    ShieldAlert,
    CheckCircle2,
    RotateCcw,
    X,
    Trophy,
    Target,
    Shield,
    Terminal,
    Award,
    Activity
} from 'lucide-react';
import Navbar from '../components/Navbar';
import EdClubHandsGuide from '../components/EdClubHandsGuide';
import { ACADEMY_MODULES, getModuleText } from '../utils/typingUtils';
import { playErrorSound, playSuccessSound } from '../utils/soundUtils';
import { recordKeyLatency } from '../utils/heatmapUtils';
import { auth } from '../firebase';

export default function TrainingAcademy() {
    const location = useLocation();
    const [selectedId, setSelectedId] = useState('mod_0_home');
    const [unlockedIds, setUnlockedIds] = useState(['mod_0_home']);
    const [showGraduationModal, setShowGraduationModal] = useState(false);
    const [playerName, setPlayerName] = useState('Operator');
    const canvasRef = useRef(null);
    const paragraphInputRef = useRef(null);
    
    // Dedicated Full-Screen Drill State
    const [isDrillActive, setIsDrillActive] = useState(false);
    const [isTokenDrillMode, setIsTokenDrillMode] = useState(true);
    const [activeTokenIdx, setActiveTokenIdx] = useState(0);
    const [tokens, setTokens] = useState([]);
    const [isWrongKey, setIsWrongKey] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [drillCompleted, setDrillCompleted] = useState(false);
    const [tokenDrillPassed, setTokenDrillPassed] = useState(false);
    const [recommendedBanner, setRecommendedBanner] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [stats, setStats] = useState({ wpm: 0, accuracy: 100 });

    // Paragraph / Prose Drill States
    const [paragraphText, setParagraphText] = useState('');
    const [paragraphInput, setParagraphInput] = useState('');
    const [paragraphCompleted, setParagraphCompleted] = useState(false);
    const [paragraphPassed, setParagraphPassed] = useState(false);
    const [, setParagraphBackspaceUsed] = useState(false);

    const selectedModule = ACADEMY_MODULES.find(m => m.id === selectedId) || ACADEMY_MODULES[0];
    const isCompletedAll = unlockedIds.includes('academy_completed') || unlockedIds.includes('mod_13');

    // Handle Weak Key Recommendation from SoloMode
    useEffect(() => {
        if (location.state?.suggestedKeys && Array.isArray(location.state.suggestedKeys) && location.state.suggestedKeys.length > 0) {
            const weakKeysUpper = location.state.suggestedKeys.map(k => String(k).toUpperCase());
            const currentProgress = JSON.parse(localStorage.getItem('academyProgress') || '["mod_0_home"]');
            
            // Prefer an unlocked module that trains these keys, otherwise best matching module
            const matchingModule = ACADEMY_MODULES.find(m => 
                currentProgress.includes(m.id) && m.keys && m.keys.some(k => weakKeysUpper.includes(k.toUpperCase()))
            ) || ACADEMY_MODULES.find(m => 
                m.keys && m.keys.some(k => weakKeysUpper.includes(k.toUpperCase()))
            );

            if (matchingModule) {
                setSelectedId(matchingModule.id);
                setRecommendedBanner({
                    keys: weakKeysUpper,
                    moduleTitle: matchingModule.title
                });
            }
        }
    }, [location.state]);

    // Strict Progression Load
    useEffect(() => {
        let progress = JSON.parse(localStorage.getItem('academyProgress') || '[]');
        if (!Array.isArray(progress) || progress.length === 0 || !progress.includes('mod_0_home')) {
            progress = ['mod_0_home'];
            localStorage.setItem('academyProgress', JSON.stringify(progress));
        }
        setUnlockedIds(progress);

        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            setPlayerName(savedName);
        } else {
            const user = auth?.currentUser;
            if (user && user.displayName) {
                setPlayerName(user.displayName);
            }
        }
    }, []);

    // Graduation Canvas Drawing
    useEffect(() => {
        if (!showGraduationModal || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Retrieve telemetry stats
        const history = JSON.parse(localStorage.getItem('raceHistory') || '[]');
        const academyRaces = history.filter(h => h.isAcademy);
        const avgWpm = academyRaces.length > 0
            ? Math.round(academyRaces.reduce((sum, r) => sum + r.wpm, 0) / academyRaces.length)
            : 58;

        const finalExamRace = history.find(h => h.moduleId === 'mod_13');
        const finalPrecision = finalExamRace
            ? parseFloat(finalExamRace.accuracy).toFixed(1) + '%'
            : '98.5%';

        // Signature hash
        const getSignature = () => {
            const hex = '0123456789abcdef';
            let res = '';
            for (let i = 0; i < 64; i++) {
                res += hex[Math.floor(Math.random() * 16)];
            }
            return res;
        };
        const signature = getSignature();

        // 1. Fill Background
        ctx.fillStyle = '#0f2320';
        ctx.fillRect(0, 0, 1920, 1080);

        // 2. Draw cyber grid pattern
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1920; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 1080);
            ctx.stroke();
        }
        for (let y = 0; y < 1080; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1920, y);
            ctx.stroke();
        }

        // Central radial glow gradient
        const radGlow = ctx.createRadialGradient(960, 540, 100, 960, 540, 800);
        radGlow.addColorStop(0, 'rgba(0, 245, 212, 0.08)');
        radGlow.addColorStop(1, 'rgba(15, 35, 32, 0)');
        ctx.fillStyle = radGlow;
        ctx.fillRect(0, 0, 1920, 1080);

        // 3. Draw premium border with glowing cyan stroke & corner cuts
        const inset = 60;
        const cornerCut = 40;
        
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.moveTo(inset + cornerCut, inset);
        ctx.lineTo(1920 - inset - cornerCut, inset);
        ctx.lineTo(1920 - inset, inset + cornerCut);
        ctx.lineTo(1920 - inset, 1080 - inset - cornerCut);
        ctx.lineTo(1920 - inset - cornerCut, 1080 - inset);
        ctx.lineTo(inset + cornerCut, 1080 - inset);
        ctx.lineTo(inset, 1080 - inset - cornerCut);
        ctx.lineTo(inset, inset + cornerCut);
        ctx.closePath();
        ctx.stroke();

        // Secondary thin border inset
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        const innerInset = inset + 12;
        const innerCornerCut = cornerCut - 4;
        ctx.moveTo(innerInset + innerCornerCut, innerInset);
        ctx.lineTo(1920 - innerInset - innerCornerCut, innerInset);
        ctx.lineTo(1920 - innerInset, innerInset + innerCornerCut);
        ctx.lineTo(1920 - innerInset, 1080 - innerInset - innerCornerCut);
        ctx.lineTo(1920 - innerInset - innerCornerCut, 1080 - innerInset);
        ctx.lineTo(innerInset + innerCornerCut, 1080 - innerInset);
        ctx.lineTo(innerInset, 1080 - innerInset - innerCornerCut);
        ctx.lineTo(innerInset, innerInset + innerCornerCut);
        ctx.closePath();
        ctx.stroke();

        // Corner tick markers
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.4)';
        ctx.lineWidth = 2;
        const drawCornerBracket = (x, y, xDir, yDir) => {
            const size = 30;
            ctx.beginPath();
            ctx.moveTo(x, y + yDir * size);
            ctx.lineTo(x, y);
            ctx.lineTo(x + xDir * size, y);
            ctx.stroke();
        };
        drawCornerBracket(inset - 15, inset - 15, 1, 1);
        drawCornerBracket(1920 - inset + 15, inset - 15, -1, 1);
        drawCornerBracket(inset - 15, 1080 - inset + 15, 1, -1);
        drawCornerBracket(1920 - inset + 15, 1080 - inset + 15, -1, -1);

        // 4. Center-aligned Text Rendering
        ctx.textAlign = 'center';
        
        ctx.font = '900 18px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f5d4';
        ctx.fillText('NEURAL NETWORK INTEGRITY CERTIFICATION', 960, 250);

        ctx.font = '900 68px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 10;
        ctx.fillText('NEURAL SYNCHRONIZATION GRADUATE', 960, 360);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(0, 245, 212, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(760, 410);
        ctx.lineTo(1160, 410);
        ctx.stroke();

        ctx.fillStyle = '#00f5d4';
        ctx.beginPath();
        ctx.arc(960, 410, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('This certifies that Operator', 960, 490);

        ctx.font = '900 60px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = 'rgba(0, 245, 212, 0.4)';
        ctx.shadowBlur = 15;
        ctx.fillText(playerName.toUpperCase(), 960, 580);
        ctx.shadowBlur = 0;

        ctx.font = 'normal 26px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('has successfully synchronized with the core typing grid curriculum,', 960, 670);
        ctx.fillText('demonstrating optimal mechanical throughput and synapse alignment.', 960, 720);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(100, 830);
        ctx.lineTo(1820, 830);
        ctx.stroke();

        // Verification Signature
        ctx.textAlign = 'left';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillText('VERIFICATION SIGNATURE KEY:', 120, 930);
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f5d4';
        ctx.fillText(`SHA-256//${signature}`, 120, 960);

        // Telemetry Stats
        ctx.textAlign = 'right';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillText('SYNAPTIC TELEMETRY RECORD:', 1800, 910);

        ctx.font = '900 24px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`AVG VELOCITY: ${avgWpm} WPM`, 1800, 955);
        ctx.font = '900 24px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#00f5d4';
        ctx.fillText(`FINAL PRECISION: ${finalPrecision}`, 1800, 995);

    }, [showGraduationModal, playerName]);

    const handleDownloadCertificate = () => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `neural_graduate_${playerName.toLowerCase().replace(/\s+/g, '_')}.png`;
        link.href = url;
        link.click();
    };

    const startModule = () => {
        const isUnlocked = unlockedIds.includes(selectedId);
        if (!isUnlocked) return;

        if (selectedModule.isTokenDrill) {
            setIsTokenDrillMode(true);
            let moduleTokens = [];
            if (selectedModule.tokens) {
                moduleTokens = selectedModule.tokens;
            } else if (selectedModule.texts && selectedModule.texts.length > 0) {
                const text = getModuleText(selectedModule);
                moduleTokens = text.split('');
            }
            setTokens(moduleTokens);
            setActiveTokenIdx(0);
            setErrorCount(0);
            setIsWrongKey(false);
            setDrillCompleted(false);
            setTokenDrillPassed(false);
            setStartTime(Date.now());
            setIsDrillActive(true);
        } else {
            setIsTokenDrillMode(false);
            const text = getModuleText(selectedModule);
            setParagraphText(text);
            setParagraphInput('');
            setParagraphCompleted(false);
            setParagraphPassed(false);
            setParagraphBackspaceUsed(false);
            setErrorCount(0);
            setStartTime(Date.now());
            setIsDrillActive(true);
            setTimeout(() => {
                if (paragraphInputRef.current) paragraphInputRef.current.focus();
            }, 100);
        }
    };

    // Strict Key Engine for Token Drills
    useEffect(() => {
        if (!isDrillActive || !isTokenDrillMode || drillCompleted) return;

        const handleKeyDown = (e) => {
            if (activeTokenIdx >= tokens.length) return;

            const expected = tokens[activeTokenIdx];
            if (e.key === expected) {
                playSuccessSound();
                recordKeyLatency(expected.toLowerCase(), 200);
                setIsWrongKey(false);
                
                const nextIdx = activeTokenIdx + 1;
                setActiveTokenIdx(nextIdx);

                if (nextIdx === tokens.length) {
                    const elapsedMin = Math.max(0.1, (Date.now() - startTime) / 60000);
                    const calcWpm = Math.round((tokens.length / 5) / elapsedMin);
                    const totalAttempts = tokens.length + errorCount;
                    const calcAcc = Math.round((tokens.length / totalAttempts) * 100);

                    setStats({ wpm: calcWpm, accuracy: calcAcc });
                    
                    const passed = calcWpm >= (selectedModule.minWPM || 0) &&
                                   calcAcc >= (selectedModule.minAccuracy || 0) &&
                                   errorCount <= (selectedModule.maxErrors ?? 999);
                    setTokenDrillPassed(passed);
                    setDrillCompleted(true);

                    if (passed) {
                        // Sync & Unlock immediate next module strictly
                        const progress = JSON.parse(localStorage.getItem('academyProgress') || '["mod_0_home"]');
                        const cIdx = ACADEMY_MODULES.findIndex(m => m.id === selectedId);
                        if (cIdx !== -1) {
                            // Save current race record to history for average stats computation
                            const history = JSON.parse(localStorage.getItem('raceHistory') || '[]');
                            history.push({
                                wpm: calcWpm,
                                accuracy: calcAcc,
                                date: Date.now(),
                                isAcademy: true,
                                moduleId: selectedId
                            });
                            localStorage.setItem('raceHistory', JSON.stringify(history.slice(-50)));

                            if (cIdx < ACADEMY_MODULES.length - 1) {
                                const nextId = ACADEMY_MODULES[cIdx + 1].id;
                                if (!progress.includes(nextId)) {
                                    progress.push(nextId);
                                    localStorage.setItem('academyProgress', JSON.stringify(progress));
                                    setUnlockedIds(progress);
                                }
                            } else if (cIdx === ACADEMY_MODULES.length - 1) {
                                if (!progress.includes('academy_completed')) {
                                    progress.push('academy_completed');
                                    localStorage.setItem('academyProgress', JSON.stringify(progress));
                                    setUnlockedIds(progress);
                                }
                            }
                        }
                    }
                }
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                playErrorSound();
                setIsWrongKey(true);
                setErrorCount(prev => prev + 1);
                setTimeout(() => setIsWrongKey(false), 300);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrillActive, isTokenDrillMode, activeTokenIdx, tokens, drillCompleted, startTime, errorCount, selectedId, selectedModule.minWPM, selectedModule.minAccuracy, selectedModule.maxErrors]);

    // Paragraph Input Handler
    const handleParagraphInputChange = (e) => {
        if (paragraphCompleted) return;
        const val = e.target.value;

        if (val.length > paragraphText.length) return;

        const prevLength = paragraphInput.length;
        if (val.length > prevLength) {
            const expectedChar = paragraphText[val.length - 1];
            const typedChar = val[val.length - 1];
            if (typedChar !== expectedChar) {
                playErrorSound();
                setErrorCount(prev => prev + 1);
                setIsWrongKey(true);
                setTimeout(() => setIsWrongKey(false), 200);
            } else {
                playSuccessSound();
                recordKeyLatency(expectedChar.toLowerCase(), 200);
            }
        } else {
            setParagraphBackspaceUsed(true);
        }

        setParagraphInput(val);

        if (val.length === paragraphText.length) {
            // Compute paragraph completion stats
            const elapsedMin = Math.max(0.1, (Date.now() - startTime) / 60000);
            const correctChars = val.split('').filter((c, i) => c === paragraphText[i]).length;
            const calcWpm = Math.round((correctChars / 5) / elapsedMin);
            const calcAcc = Math.round((correctChars / val.length) * 100);

            setStats({ wpm: calcWpm, accuracy: calcAcc });
            
            const passed = calcWpm >= selectedModule.minWPM && calcAcc >= selectedModule.minAccuracy && errorCount <= selectedModule.maxErrors;
            setParagraphPassed(passed);
            setParagraphCompleted(true);

            if (passed) {
                // Save current race record to history for average stats computation
                const history = JSON.parse(localStorage.getItem('raceHistory') || '[]');
                history.push({
                    wpm: calcWpm,
                    accuracy: calcAcc,
                    date: Date.now(),
                    isAcademy: true,
                    moduleId: selectedId
                });
                localStorage.setItem('raceHistory', JSON.stringify(history.slice(-50)));

                const progress = JSON.parse(localStorage.getItem('academyProgress') || '["mod_0_home"]');
                const cIdx = ACADEMY_MODULES.findIndex(m => m.id === selectedId);
                
                if (cIdx !== -1) {
                    if (cIdx < ACADEMY_MODULES.length - 1) {
                        const nextId = ACADEMY_MODULES[cIdx + 1].id;
                        if (!progress.includes(nextId)) {
                            progress.push(nextId);
                            localStorage.setItem('academyProgress', JSON.stringify(progress));
                            setUnlockedIds(progress);
                        }
                    } else if (cIdx === ACADEMY_MODULES.length - 1) {
                        if (!progress.includes('academy_completed')) {
                            progress.push('academy_completed');
                            localStorage.setItem('academyProgress', JSON.stringify(progress));
                            setUnlockedIds(progress);
                        }
                    }
                }
            }
        }
    };

    const handleParagraphKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            startModule();
        }
    };

    const targetChar = isTokenDrillMode 
        ? (tokens[activeTokenIdx] || '') 
        : (paragraphText[paragraphInput.length] || '');

    const getDifficultyColor = (module) => {
        if (module.isTest) return 'text-amber-400';
        switch(module.difficulty) {
            case 'easy': return 'text-green-400';
            case 'medium': return 'text-yellow-400';
            case 'hard': return 'text-red-400';
            default: return 'text-primary';
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-50 dark:bg-background-dark text-slate-700 dark:text-slate-300 font-sans flex flex-col overflow-hidden select-none">
            <Navbar isFaded={isDrillActive}/>

            {/* FULL-SCREEN DRILL STAGE (Zero Scrolling, Centered) */}
            {isDrillActive ? (
                <main className="flex-1 w-full h-[calc(100vh-80px)] flex flex-col items-center justify-between p-6 md:p-10 relative overflow-hidden animate-in fade-in zoom-in duration-300">
                    {/* Top Header Controls */}
                    <div className="w-full max-w-5xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">{selectedModule.title}</span>
                            {isTokenDrillMode ? (
                                <span className="text-xs font-mono text-slate-400">({activeTokenIdx} / {tokens.length})</span>
                            ) : (
                                <span className="text-xs font-mono text-slate-400">({paragraphInput.length} / {paragraphText.length})</span>
                            )}
                        </div>
                        <button
                            onClick={() => { setIsDrillActive(false); setDrillCompleted(false); setParagraphCompleted(false); }}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-red-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                            <X className="w-4 h-4"/> Exit Lesson
                        </button>
                    </div>

                    {isTokenDrillMode ? (
                        /* Token Drill Subview */
                        !drillCompleted ? (
                            <div className="w-full flex flex-col items-center justify-center my-auto space-y-8">
                                {/* Token Card Carousel */}
                                <div className="flex items-center justify-center gap-3 md:gap-4 mb-8 py-2 overflow-visible">
                                    {tokens.slice(Math.max(0, activeTokenIdx - 2), activeTokenIdx + 5).map((tok, i) => {
                                        const actualIdx = Math.max(0, activeTokenIdx - 2) + i;
                                        const isCurrent = actualIdx === activeTokenIdx;
                                        const isPassed = actualIdx < activeTokenIdx;

                                        return (
                                            <div 
                                                key={actualIdx}
                                                className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center font-mono text-2xl md:text-3xl font-black relative transition-all duration-150 border-2 ${
                                                    isCurrent
                                                        ? isWrongKey
                                                            ? 'bg-red-500/20 border-red-500 text-red-500 scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                                                            : 'bg-white dark:bg-slate-900 border-primary text-slate-900 dark:text-primary scale-110 shadow-[0_0_25px_rgba(0,245,212,0.4)]'
                                                        : isPassed
                                                            ? 'bg-slate-200/50 dark:bg-white/5 border-transparent text-slate-400 opacity-25'
                                                            : 'bg-white dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-400'
                                                }`}
                                            >
                                                {tok === ' ' ? '␣' : tok}
                                                {isCurrent && (
                                                    <div className="absolute -bottom-2 w-8 h-1 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#00f5d4]" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Animated Hands on Virtual Keyboard */}
                                <div className="w-full flex flex-col items-center justify-center overflow-visible mb-4 pb-4">
                                    <EdClubHandsGuide isWrong={isWrongKey} targetChar={targetChar}/>
                                </div>
                            </div>
                        ) : (
                            /* Token Drill Results */
                            <div className="my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
                                {tokenDrillPassed ? (
                                    <>
                                        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce"/>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">Lesson Complete!</h3>
                                        <p className="text-xs font-bold text-[#0d9488] dark:text-primary uppercase tracking-widest mb-8">Finger Mechanics Synchronized</p>
                                    </>
                                ) : (
                                    <>
                                        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse"/>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">Sync Failed</h3>
                                        <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-8">
                                            Requires {selectedModule.minWPM} WPM & {selectedModule.minAccuracy}% ACC (Errors: {errorCount}/{selectedModule.maxErrors})
                                        </p>
                                    </>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <span className="text-[10px] uppercase font-black text-slate-500 block mb-1">Velocity</span>
                                        <span className="text-3xl font-black font-mono text-[#0d9488] dark:text-primary">{stats.wpm} <span className="text-sm">WPM</span></span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <span className="text-[10px] uppercase font-black text-slate-500 block mb-1">Precision</span>
                                        <span className="text-3xl font-black font-mono text-[#0d9488] dark:text-primary">{stats.accuracy}%</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={startModule}
                                        className="flex-1 py-4 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-800 dark:text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all cursor-pointer"
                                    >
                                        Retry Lesson
                                    </button>
                                    {tokenDrillPassed && (
                                        <button 
                                            onClick={() => {
                                                setIsDrillActive(false);
                                                setDrillCompleted(false);
                                                const cIdx = ACADEMY_MODULES.findIndex(m => m.id === selectedId);
                                                if (cIdx !== -1 && cIdx < ACADEMY_MODULES.length - 1) {
                                                    setSelectedId(ACADEMY_MODULES[cIdx + 1].id);
                                                }
                                            }}
                                            className="flex-1 py-4 bg-primary text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(0,245,212,0.4)] cursor-pointer"
                                        >
                                            Continue
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    ) : (
                        /* Paragraph / Prose Drill Subview */
                        !paragraphCompleted ? (
                            <div className="w-full flex flex-col items-center justify-center my-auto space-y-8">
                                {/* Running Stats Row */}
                                <div className="flex gap-8 mb-4">
                                    <div className="text-center">
                                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Velocity Target</span>
                                        <span className="text-xl font-bold font-mono text-slate-700 dark:text-slate-200 block">{selectedModule.minWPM} WPM</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Errors allowance</span>
                                        <span className="text-xl font-bold font-mono text-slate-700 dark:text-slate-200 block">{errorCount} / {selectedModule.maxErrors} max</span>
                                    </div>
                                </div>

                                <div 
                                    className="w-full max-w-4xl p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] shadow-2xl relative cursor-text"
                                    onClick={() => paragraphInputRef.current?.focus()}
                                >
                                    <input
                                        ref={paragraphInputRef}
                                        type="text"
                                        value={paragraphInput}
                                        onChange={handleParagraphInputChange}
                                        onKeyDown={handleParagraphKeyDown}
                                        className="absolute opacity-0 pointer-events-none"
                                        autoFocus
                                    />

                                    <div className="text-lg md:text-2xl font-mono leading-relaxed select-none relative z-10 tracking-tight text-left">
                                        {paragraphText.split('').map((char, index) => {
                                            let colorClass = "text-slate-400 dark:text-slate-600";
                                            if (index < paragraphInput.length) {
                                                colorClass = paragraphInput[index] === char 
                                                    ? "text-[#0d9488] dark:text-primary font-bold" 
                                                    : "text-red-500 bg-red-500/10 rounded-sm";
                                            }
                                            const isCursor = index === paragraphInput.length;

                                            return (
                                                <span key={index} className="relative">
                                                    {isCursor && (
                                                        <span className="absolute left-0 h-full w-[2px] bg-[#0d9488] dark:bg-primary shadow-[0_0_15px_#00f5d4] animate-pulse" />
                                                    )}
                                                    <span className={`${colorClass} transition-colors duration-150`}>{char}</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Animated Hands on Virtual Keyboard */}
                                <div className="w-full flex flex-col items-center justify-center overflow-visible mb-4 pb-4">
                                    <EdClubHandsGuide isWrong={isWrongKey} targetChar={targetChar}/>
                                </div>
                            </div>
                        ) : (
                            /* Paragraph Drill Results */
                            <div className="my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
                                {paragraphPassed ? (
                                    <>
                                        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce"/>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">Lesson Complete!</h3>
                                        <p className="text-xs font-bold text-[#0d9488] dark:text-primary uppercase tracking-widest mb-8">Verification Successful</p>
                                    </>
                                ) : (
                                    <>
                                        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse"/>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">Sync Failed</h3>
                                        <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-8">Criteria Not Met</p>
                                    </>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <span className="text-[10px] uppercase font-black text-slate-500 block mb-1">Velocity</span>
                                        <span className="text-3xl font-black font-mono text-[#0d9488] dark:text-primary">{stats.wpm} <span className="text-sm">WPM</span></span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <span className="text-[10px] uppercase font-black text-slate-500 block mb-1">Accuracy</span>
                                        <span className="text-3xl font-black font-mono text-[#0d9488] dark:text-primary">{stats.accuracy}%</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={startModule}
                                        className="flex-1 py-4 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-800 dark:text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all cursor-pointer"
                                    >
                                        Retry Lesson
                                    </button>
                                    {paragraphPassed && (
                                        <button 
                                            onClick={() => {
                                                setIsDrillActive(false);
                                                setParagraphCompleted(false);
                                                const cIdx = ACADEMY_MODULES.findIndex(m => m.id === selectedId);
                                                if (cIdx !== -1 && cIdx < ACADEMY_MODULES.length - 1) {
                                                    setSelectedId(ACADEMY_MODULES[cIdx + 1].id);
                                                }
                                            }}
                                            className="flex-1 py-4 bg-primary text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(0,245,212,0.4)] cursor-pointer"
                                        >
                                            Continue
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                    
                    <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase pb-2">
                        {isTokenDrillMode 
                            ? "Press highlighted keys with the designated finger · Strict blocking mode"
                            : "Standard typing mode · Backspace correction enabled"
                        }
                    </div>
                </main>
            ) : (
                /* CURRICULUM OVERVIEW (Normal View - Restored Full Screens) */
                <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
                    {/* Left Sidebar: Curriculum list */}
                    <div className="md:w-[360px] w-full bg-slate-100 dark:bg-black/20 border-r border-slate-200 dark:border-white/5 flex flex-col pt-8">
                        <div className="px-6 mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <GraduationCap className="w-4 h-4 text-primary"/>
                                <span className="text-xs font-semibold text-primary tracking-wider uppercase">Academy Curriculum</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Curriculum Stages</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-12 custom-scrollbar">
                            {ACADEMY_MODULES.map((module, index) => {
                                const isSelected = module.id === selectedId;
                                const isUnlocked = unlockedIds.includes(module.id);

                                return (
                                    <button
                                        key={module.id}
                                        onClick={() => {
                                            if (isUnlocked) {
                                                setSelectedId(module.id);
                                                setIsDrillActive(false);
                                                setDrillCompleted(false);
                                                setParagraphCompleted(false);
                                            }
                                        }}
                                        disabled={!isUnlocked}
                                        className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all border cursor-pointer ${
                                            isSelected 
                                                ? 'bg-primary/10 border-primary/40 shadow-xs' 
                                                : isUnlocked 
                                                    ? 'bg-white dark:bg-slate-900/30 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:bg-white/5' 
                                                    : 'opacity-40 cursor-not-allowed bg-transparent border-transparent'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs border ${
                                            isSelected
                                                ? 'bg-primary text-white dark:text-slate-950 border-primary'
                                                : module.isTest
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                        }`}>
                                            {isUnlocked ? (module.isTest ? <ShieldAlert className="w-4 h-4"/> : index + 1) : <Lock className="w-3.5 h-3.5"/>}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{module.title}</div>
                                            <div className="text-[11px] text-slate-500 capitalize">{module.isTokenDrill ? 'Interactive Drill' : module.difficulty}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Restored Rich Main Content Area */}
                    <div 
                        className="flex-1 bg-white dark:bg-black/20 flex flex-col pt-10 md:pt-14 px-8 md:px-16 pb-20 overflow-y-auto [&::-webkit-scrollbar]:hidden items-center"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div className="max-w-3xl w-full mx-auto">
                            {isCompletedAll && (
                                <div className="mb-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/10 border border-primary/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
                                            <Award className="w-7 h-7" />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mb-0.5">Curriculum Completed</span>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Full Touch Typing Mastery</h3>
                                            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 max-w-md font-normal">All 14 modules completed with passing velocity and precision.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowGraduationModal(true)}
                                        className="relative z-10 px-4 py-2.5 bg-primary text-white dark:text-slate-950 font-semibold uppercase tracking-wider text-xs rounded-xl shadow-sm hover:opacity-90 transition-all cursor-pointer flex items-center gap-2"
                                    >
                                        <GraduationCap className="w-4 h-4" />
                                        <span>View Certificate</span>
                                    </button>
                                </div>
                            )}

                            {/* Recommended Weak Keys Banner */}
                            {recommendedBanner && (
                                <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
                                            <Target className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block mb-0.5">
                                                Recommended Practice for Your Weak Keys
                                            </span>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-normal">
                                                Reinforcing keys: <span className="text-amber-500 font-mono font-bold">{recommendedBanner.keys.join(', ')}</span> — Selected module: <span className="font-semibold">{recommendedBanner.moduleTitle}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setRecommendedBanner(null)}
                                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                        title="Dismiss recommendation"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Badge */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-full ${
                                    selectedModule.isTest 
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                                    : 'bg-primary/5 border-primary/20 text-primary'
                                }`}>
                                    {selectedModule.isTest ? (
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                    ) : (
                                        <Activity className="w-3.5 h-3.5" />
                                    )}
                                    <span className="text-xs font-semibold uppercase tracking-wider">
                                        {selectedModule.isTest ? 'Assessment: Required' : 'Stage Practice'}
                                    </span>
                                </div>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                            </div>

                            {/* Heading */}
                            <div className="relative mb-10 text-left">
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                                    {selectedModule.title}
                                </h1>
                                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                                    {selectedModule.description}
                                </p>
                            </div>

                            {/* Specs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
                                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 group transition-all">
                                    <div className="flex items-center gap-2.5 mb-5">
                                        <Target className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Keycaps</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5 mb-6">
                                        {selectedModule.keys.map(key => (
                                            <div 
                                                key={key} 
                                                className="w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-mono font-bold text-slate-800 dark:text-slate-100 shadow-xs keycap-badge transition-all"
                                            >
                                                {key}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                                            <span>Target Velocity</span>
                                            <span className="font-semibold text-primary">{selectedModule.minWPM} WPM</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                                            <span>Accuracy Requirement</span>
                                            <span className="font-semibold text-primary">{selectedModule.minAccuracy}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                                            <span>Maximum Error Allowance</span>
                                            <span className="font-semibold text-primary">{selectedModule.maxErrors} max</span>
                                        </div>
                                    </div>
                                </div>
      
                                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 group transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-5">
                                            <Shield className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Difficulty Level</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-slate-500">Stage Complexity</span>
                                                <span className={`text-sm font-semibold capitalize ${getDifficultyColor(selectedModule)}`}>
                                                    {selectedModule.isTest ? 'Assessment' : selectedModule.difficulty}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-700 ${
                                                        selectedModule.isTest ? 'bg-amber-500' : 'bg-primary'
                                                    }`} 
                                                    style={{ width: selectedModule.isTest ? '100%' : (selectedModule.difficulty === 'easy' ? '33%' : (selectedModule.difficulty === 'medium' ? '66%' : '100%')) }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview Box */}
                                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Text Preview</span>
                                        <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 line-clamp-2">
                                            {selectedModule.isTokenDrill ? selectedModule.texts[0] : selectedModule.texts[0].slice(0, 100)}...
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Start Action Button */}
                            <button 
                                type="button"
                                onClick={startModule}
                                disabled={!unlockedIds.includes(selectedId)}
                                className="w-full py-4.5 bg-primary text-white dark:text-slate-950 font-semibold text-sm rounded-2xl flex items-center justify-between px-8 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    <Play className="w-4 h-4 fill-current"/>
                                    <span>
                                        {selectedModule.isTokenDrill ? 'Start Interactive Lesson' : (selectedModule.isTest ? 'Begin Assessment' : 'Begin Practice Lesson')}
                                    </span>
                                </div>
                                <ChevronRight className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </main>
            )}

            {/* Graduation Modal Overlay */}
            {showGraduationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-3xl p-10 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar animate-in fade-in zoom-in duration-500">
                        
                        <button 
                            onClick={() => setShowGraduationModal(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-xl font-bold cursor-pointer"
                        >
                            ✕
                        </button>
     
                        <div className="text-center mb-8">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] block mb-2">NEURAL NETWORK TELEMETRY</span>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">GRADUATION PROFILE</h2>
                        </div>
     
                        {/* Custom Profile input box */}
                        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8 max-w-md mx-auto">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-3 text-center">
                                Operator Identity Signature
                            </label>
                            <input 
                                type="text" 
                                value={playerName} 
                                onChange={(e) => {
                                    setPlayerName(e.target.value);
                                    localStorage.setItem('playerName', e.target.value);
                                }}
                                placeholder="Enter Identity..."
                                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-center text-slate-900 dark:text-white text-lg font-bold font-mono focus:outline-none focus:border-primary/50 transition-all uppercase"
                            />
                        </div>
     
                        {/* Scaled visual preview of Canvas */}
                        <div className="bg-slate-100 dark:bg-black/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-center mb-8 overflow-hidden">
                            <canvas 
                                ref={canvasRef} 
                                width="1920" 
                                height="1080" 
                                className="w-full max-w-3xl rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl"
                            />
                        </div>
     
                        <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                            <button 
                                onClick={() => setShowGraduationModal(false)}
                                className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:text-white px-8 py-5 rounded-2xl font-bold uppercase tracking-widest transition-all cursor-pointer"
                            >
                                Dismiss
                            </button>
                            <button 
                                onClick={handleDownloadCertificate}
                                className="flex-1 group relative flex items-center justify-center gap-4 px-8 py-5 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl bg-primary shadow-primary/25 text-background-dark font-black cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-size-[250%_250%] animate-[shimmer_3s_infinite]" />
                                <span className="text-xl font-black uppercase italic tracking-tighter relative z-10 flex items-center gap-2">
                                    📥 EXPORT TELEMETRY PROFILE
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
