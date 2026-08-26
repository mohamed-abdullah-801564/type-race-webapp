import React from 'react';

const FINGER_MAP = {
    // Left Hand
    '1': 'left-pinky', 'q': 'left-pinky', 'a': 'left-pinky', 'z': 'left-pinky',
    '2': 'left-ring',  'w': 'left-ring',  's': 'left-ring',  'x': 'left-ring',
    '3': 'left-middle','e': 'left-middle','d': 'left-middle','c': 'left-middle',
    '4': 'left-index', 'r': 'left-index', 'f': 'left-index', 'v': 'left-index',
    '5': 'left-index', 't': 'left-index', 'g': 'left-index', 'b': 'left-index',
    
    // Right Hand
    '6': 'right-index', 'y': 'right-index', 'h': 'right-index', 'n': 'right-index',
    '7': 'right-index', 'u': 'right-index', 'j': 'right-index', 'm': 'right-index',
    '8': 'right-middle','i': 'right-middle','k': 'right-middle',',': 'right-middle',
    '9': 'right-ring',  'o': 'right-ring',  'l': 'right-ring',  '.': 'right-ring',
    '0': 'right-pinky', 'p': 'right-pinky', ';': 'right-pinky', '/': 'right-pinky',
    
    // Thumbs
    ' ': 'thumbs'
};

const KEYBOARD_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];

export default function InteractiveHandsGuide({ targetChar = 'f', isWrong = false }) {
    const char = (targetChar || '').toLowerCase();
    const activeFinger = FINGER_MAP[char] || null;

    const getFingerStyle = (fingerId) => {
        const isActive = activeFinger === fingerId;
        if (!isActive) {
            return {
                stroke: 'currentColor',
                strokeWidth: 1.5,
                fill: 'transparent',
                opacity: 0.25,
                transition: 'all 0.2s ease'
            };
        }
        return {
            stroke: isWrong ? '#ef4444' : 'var(--color-primary, #00f5d4)',
            strokeWidth: 3,
            fill: isWrong ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 245, 212, 0.15)',
            filter: isWrong ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))' : 'drop-shadow(0 0 10px rgba(0, 245, 212, 0.8))',
            transform: 'translateY(-6px)',
            transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
        };
    };

    return (
        <div className="w-full flex flex-col items-center justify-center select-none py-4">
            {/* Virtual Key Guide */}
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-200/50 dark:bg-black/40 border border-slate-300/60 dark:border-white/10 shadow-inner mb-6">
                {KEYBOARD_ROWS.map((row, rIdx) => (
                    <div 
                        key={rIdx} 
                        className={`flex gap-1.5 justify-center ${rIdx === 1 ? 'ml-3 md:ml-6' : rIdx === 2 ? 'ml-6 md:ml-12' : ''}`}
                    >
                        {row.map((k) => {
                            const isTarget = k === char;
                            return (
                                <div
                                    key={k}
                                    className={`w-7 h-7 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-mono text-xs md:text-sm font-bold uppercase transition-all duration-150 ${
                                        isTarget
                                            ? isWrong
                                                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.7)] scale-110 -translate-y-1'
                                                : 'bg-primary text-slate-950 shadow-[0_0_15px_rgba(0,245,212,0.6)] scale-110 -translate-y-1'
                                            : 'bg-white/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/5'
                                    }`}
                                >
                                    {k}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* SVG Interactive Hands Wireframe */}
            <div className="w-full max-w-xl text-slate-400 dark:text-slate-600">
                <svg viewBox="0 0 800 350" className="w-full h-auto overflow-visible">
                    {/* LEFT HAND */}
                    <g id="left-hand" transform="translate(40, 20)">
                        {/* Wrist / Palm base */}
                        <path d="M 120 300 C 120 230, 160 210, 200 210 C 240 210, 280 230, 280 300" stroke="currentColor" strokeWidth="1.5" fill="transparent" opacity="0.2" />
                        
                        {/* Left Pinky */}
                        <path id="left-pinky" d="M 130 220 L 130 110 C 130 95, 150 95, 150 110 L 150 210" style={getFingerStyle('left-pinky')} />
                        
                        {/* Left Ring */}
                        <path id="left-ring" d="M 160 210 L 160 80 C 160 65, 180 65, 180 80 L 180 205" style={getFingerStyle('left-ring')} />
                        
                        {/* Left Middle */}
                        <path id="left-middle" d="M 190 205 L 190 60 C 190 45, 210 45, 210 60 L 210 205" style={getFingerStyle('left-middle')} />
                        
                        {/* Left Index */}
                        <path id="left-index" d="M 220 205 L 220 80 C 220 65, 240 65, 240 80 L 240 215" style={getFingerStyle('left-index')} />
                        
                        {/* Left Thumb */}
                        <path id="left-thumb" d="M 250 225 L 285 160 C 295 150, 310 160, 300 175 L 270 240" style={getFingerStyle('thumbs')} />
                    </g>

                    {/* RIGHT HAND */}
                    <g id="right-hand" transform="translate(420, 20)">
                        {/* Wrist / Palm base */}
                        <path d="M 120 300 C 120 230, 160 210, 200 210 C 240 210, 280 230, 280 300" stroke="currentColor" strokeWidth="1.5" fill="transparent" opacity="0.2" />
                        
                        {/* Right Thumb */}
                        <path id="right-thumb" d="M 150 240 L 120 175 C 110 160, 125 150, 135 160 L 170 225" style={getFingerStyle('thumbs')} />

                        {/* Right Index */}
                        <path id="right-index" d="M 180 215 L 180 80 C 180 65, 200 65, 200 80 L 200 205" style={getFingerStyle('right-index')} />
                        
                        {/* Right Middle */}
                        <path id="right-middle" d="M 210 205 L 210 60 C 210 45, 230 45, 230 60 L 230 205" style={getFingerStyle('right-middle')} />
                        
                        {/* Right Ring */}
                        <path id="right-ring" d="M 240 205 L 240 80 C 240 65, 260 65, 260 80 L 260 210" style={getFingerStyle('right-ring')} />
                        
                        {/* Right Pinky */}
                        <path id="right-pinky" d="M 270 210 L 270 110 C 270 95, 290 95, 290 110 L 290 220" style={getFingerStyle('right-pinky')} />
                    </g>
                </svg>
            </div>
        </div>
    );
}
