import React from 'react';

const FINGER_COLORS = {
    leftPinky: '#ff6b6b',
    leftRing: '#ffa94d',
    leftMiddle: '#ffd43b',
    leftIndex: '#69db7c',
    thumbs: '#74c0fc',
    rightIndex: '#69db7c',
    rightMiddle: '#ffd43b',
    rightRing: '#ffa94d',
    rightPinky: '#ff6b6b'
};

const KEY_TO_FINGER = {
    '1': 'leftPinky', 'q': 'leftPinky', 'a': 'leftPinky', 'z': 'leftPinky',
    '2': 'leftRing', 'w': 'leftRing', 's': 'leftRing', 'x': 'leftRing',
    '3': 'leftMiddle', 'e': 'leftMiddle', 'd': 'leftMiddle', 'c': 'leftMiddle',
    '4': 'leftIndex', 'r': 'leftIndex', 'f': 'leftIndex', 'v': 'leftIndex',
    '5': 'leftIndex', 't': 'leftIndex', 'g': 'leftIndex', 'b': 'leftIndex',
    '6': 'rightIndex', 'y': 'rightIndex', 'h': 'rightIndex', 'n': 'rightIndex',
    '7': 'rightIndex', 'u': 'rightIndex', 'j': 'rightIndex', 'm': 'rightIndex',
    '8': 'rightMiddle', 'i': 'rightMiddle', 'k': 'rightMiddle', ',': 'rightMiddle',
    '9': 'rightRing', 'o': 'rightRing', 'l': 'rightRing', '.': 'rightRing',
    '0': 'rightPinky', 'p': 'rightPinky', ';': 'rightPinky', '/': 'rightPinky'
};

const ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];

export default function FingerMap({ activeKeys = [] }) {
    const isActive = (key) => activeKeys.includes(key.toLowerCase());

    return (
        <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-3xl p-8">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">
                Finger Mapping Guide
            </h3>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-8">
                <LegendItem color={FINGER_COLORS.leftPinky} label="Left Pinky" />
                <LegendItem color={FINGER_COLORS.leftRing} label="Left Ring" />
                <LegendItem color={FINGER_COLORS.leftMiddle} label="Left Middle" />
                <LegendItem color={FINGER_COLORS.leftIndex} label="Left Index / Right Index" />
                <LegendItem color={FINGER_COLORS.thumbs} label="Space" />
            </div>

            {/* Keyboard Layout */}
            <div className="flex flex-col gap-1.5">
                {ROWS.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1.5">
                        {row.map((key) => {
                            const finger = KEY_TO_FINGER[key];
                            const color = FINGER_COLORS[finger];
                            const active = isActive(key);

                            return (
                                <div
                                    key={key}
                                    style={{
                                        borderColor: active ? color : undefined,
                                        backgroundColor: active ? `${color}33` : undefined, // 20% opacity
                                        color: active ? color : undefined,
                                        boxShadow: active ? `0 0 10px ${color}` : undefined
                                    }}
                                    className={`
                                        w-10 h-10 rounded-lg border flex items-center justify-center text-xs font-black uppercase transition-all duration-300
                                        ${active 
                                            ? 'opacity-100' 
                                            : 'bg-slate-200/60 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600 opacity-40'
                                        }
                                    `}
                                >
                                    {key}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-2">
            <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: color }}
            />
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-widest">
                {label}
            </span>
        </div>
    );
}
