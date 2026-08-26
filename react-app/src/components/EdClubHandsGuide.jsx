import React from 'react';

// Exact key center coordinates on a 800x420 SVG plane
const KEY_POS = {
  // Row 1
  '1': { x: 73, y: 35 }, '2': { x: 125, y: 35 }, '3': { x: 177, y: 35 }, '4': { x: 229, y: 35 },
  '5': { x: 281, y: 35 }, '6': { x: 333, y: 35 }, '7': { x: 385, y: 35 }, '8': { x: 437, y: 35 },
  '9': { x: 489, y: 35 }, '0': { x: 541, y: 35 }, '-': { x: 593, y: 35 }, '=': { x: 645, y: 35 },

  // Row 2
  'q': { x: 98, y: 87 }, 'w': { x: 150, y: 87 }, 'e': { x: 202, y: 87 }, 'r': { x: 254, y: 87 },
  't': { x: 306, y: 87 }, 'y': { x: 358, y: 87 }, 'u': { x: 410, y: 87 }, 'i': { x: 462, y: 87 },
  'o': { x: 514, y: 87 }, 'p': { x: 566, y: 87 }, '[': { x: 618, y: 87 }, ']': { x: 670, y: 87 },

  // Row 3 (Home Row)
  'a': { x: 112, y: 139 }, 's': { x: 164, y: 139 }, 'd': { x: 216, y: 139 }, 'f': { x: 268, y: 139 },
  'g': { x: 320, y: 139 }, 'h': { x: 372, y: 139 }, 'j': { x: 424, y: 139 }, 'k': { x: 476, y: 139 },
  'l': { x: 528, y: 139 }, ';': { x: 580, y: 139 }, "'": { x: 632, y: 139 },

  // Row 4
  'z': { x: 137, y: 191 }, 'x': { x: 189, y: 191 }, 'c': { x: 241, y: 191 }, 'v': { x: 293, y: 191 },
  'b': { x: 345, y: 191 }, 'n': { x: 397, y: 191 }, 'm': { x: 449, y: 191 }, ',': { x: 501, y: 191 },
  '.': { x: 553, y: 191 }, '/': { x: 605, y: 191 },
  ' ': { x: 370, y: 243 }
};

const FINGER_MAP = {
  '1': 'LP', 'q': 'LP', 'a': 'LP', 'z': 'LP',
  '2': 'LR', 'w': 'LR', 's': 'LR', 'x': 'LR',
  '3': 'LM', 'e': 'LM', 'd': 'LM', 'c': 'LM',
  '4': 'LI', 'r': 'LI', 'f': 'LI', 'v': 'LI',
  '5': 'LI', 't': 'LI', 'g': 'LI', 'b': 'LI',
  '6': 'RI', 'y': 'RI', 'h': 'RI', 'n': 'RI',
  '7': 'RI', 'u': 'RI', 'j': 'RI', 'm': 'RI',
  '8': 'RM', 'i': 'RM', 'k': 'RM', ',': 'RM',
  '9': 'RR', 'o': 'RR', 'l': 'RR', '.': 'RR',
  '0': 'RP', 'p': 'RP', ';': 'RP', '/': 'RP',
  ' ': 'THUMB'
};

const KEY_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];

export default function EdClubHandsGuide({ targetChar = 'f', isWrong = false }) {
  const char = (targetChar || '').toLowerCase();
  const activeFinger = FINGER_MAP[char] || null;
  const target = KEY_POS[char] || null;

  const getLeftHandPath = () => {
    const wristLeft = "M 120 410 C 130 290, 135 260, 138 245";
    const pinky = activeFinger === 'LP' && target
      ? `C 135 190, ${target.x - 10} ${target.y + 35}, ${target.x} ${target.y} C ${target.x + 12} ${target.y + 5}, ${target.x + 10} ${target.y + 35}, 160 235`
      : "C 130 190, 100 160, 112 139 C 124 118, 148 160, 160 235";
    const connector1 = "L 168 235";
    const ring = activeFinger === 'LR' && target
      ? `C 170 185, ${target.x - 10} ${target.y + 35}, ${target.x} ${target.y} C ${target.x + 12} ${target.y + 5}, ${target.x + 10} ${target.y + 35}, 195 230`
      : "C 160 185, 150 160, 164 139 C 178 118, 190 160, 202 230";
    const connector2 = "L 205 230";
    const middle = activeFinger === 'LM' && target
      ? `C 210 180, ${target.x - 10} ${target.y + 35}, ${target.x} ${target.y} C ${target.x + 14} ${target.y + 5}, ${target.x + 10} ${target.y + 35}, 242 230`
      : "C 200 175, 200 160, 216 139 C 232 118, 240 160, 248 230";
    const connector3 = "L 250 232";
    const index = activeFinger === 'LI' && target
      ? `C 255 180, ${target.x - 10} ${target.y + 35}, ${target.x} ${target.y} C ${target.x + 14} ${target.y + 5}, ${target.x + 10} ${target.y + 35}, 288 238`
      : "C 245 180, 250 160, 268 139 C 286 118, 290 160, 296 238";
    const connector4 = "C 298 245, 300 252, 302 260";
    const thumb = activeFinger === 'THUMB'
      ? "C 318 240, 342 235, 356 248 C 352 264, 326 278, 305 280"
      : "C 314 246, 334 245, 345 256 C 342 268, 322 278, 305 280";
    const wristRight = "C 315 310, 325 350, 330 410";
    return [wristLeft, pinky, connector1, ring, connector2, middle, connector3, index, connector4, thumb, wristRight].join(" ");
  };

  const getRightHandPath = () => {
    const wristLeft = "M 470 410 C 475 350, 485 310, 495 280";
    const thumb = activeFinger === 'THUMB'
      ? "C 474 278, 448 264, 444 248 C 458 235, 482 240, 498 260"
      : "C 478 278, 458 268, 455 256 C 466 245, 486 246, 498 260";
    const connector1 = `L ${activeFinger === 'RI' ? 512 : 504} 238`;
    const index = activeFinger === 'RI' && target
      ? `C ${target.x - 10} ${target.y + 35}, ${target.x - 12} ${target.y + 5}, ${target.x} ${target.y} C ${target.x + 10} ${target.y + 35}, 545 180, 550 232`
      : "C 490 160, 408 118, 424 139 C 440 160, 540 180, 550 232";
    const connector2 = `L ${activeFinger === 'RM' ? 558 : 552} 230`;
    const middle = activeFinger === 'RM' && target
      ? `C ${target.x - 10} ${target.y + 35}, ${target.x - 14} ${target.y + 5}, ${target.x} ${target.y} C ${target.x + 10} ${target.y + 35}, 590 180, 595 230`
      : "C 542 160, 457 118, 476 139 C 495 160, 585 175, 595 230";
    const connector3 = "L 605 230";
    const ring = activeFinger === 'RR' && target
      ? `C ${target.x - 10} ${target.y + 35}, ${target.x - 12} ${target.y + 5}, ${target.x} ${target.y} C ${target.x + 10} ${target.y + 35}, 630 185, 632 235`
      : "C 585 160, 511 118, 528 139 C 545 160, 632 185, 632 235";
    const connector4 = "L 640 235";
    const pinky = activeFinger === 'RP' && target
      ? `C ${target.x - 10} ${target.y + 35}, ${target.x - 12} ${target.y + 5}, ${target.x} ${target.y} C ${target.x + 10} ${target.y + 35}, 665 190, 662 245`
      : "C 625 160, 565 118, 580 139 C 595 160, 655 190, 662 245";
    const wristRight = "C 670 290, 675 350, 680 410";
    return [wristLeft, thumb, connector1, index, connector2, middle, connector3, ring, connector4, pinky, wristRight].join(" ");
  };

  const getActiveFingerPath = () => {
    if (!activeFinger) return null;
    if (activeFinger === 'LP' && target) {
      return `M 138 245 C 135 190, ${target.x - 10} ${target.y + 35}, ${target.x} ${target.y} C ${target.x + 12} ${target.y + 5}, ${target.x + 10} ${target.y + 35}, 160 235`;
    }
    if (activeFinger === 'LR' && target) {
      return `M 168 235 C 170 185, ${target.x - 10} ${target.y + 35}, ${target.x} ${target.y} C ${target.x + 12} ${target.y + 5}, ${target.x + 10} ${target.y + 35}, 195 230`;
    }
    if (activeFinger === 'LM' && target) {
      return `M 205 230 C 210 180, ${target.x - 10} ${target.y + 35}, ${target.x} ${target.y} C ${target.x + 14} ${target.y + 5}, ${target.x + 10} ${target.y + 35}, 242 230`;
    }
    if (activeFinger === 'LI' && target) {
      return `M 250 232 C 255 180, ${target.x - 10} ${target.y + 35}, ${target.x} ${target.y} C ${target.x + 14} ${target.y + 5}, ${target.x + 10} ${target.y + 35}, 288 238`;
    }
    if (activeFinger === 'RI' && target) {
      return `M 512 238 C ${target.x - 10} ${target.y + 35}, ${target.x - 12} ${target.y + 5}, ${target.x} ${target.y} C ${target.x + 10} ${target.y + 35}, 545 180, 550 232`;
    }
    if (activeFinger === 'RM' && target) {
      return `M 558 230 C ${target.x - 10} ${target.y + 35}, ${target.x - 14} ${target.y + 5}, ${target.x} ${target.y} C ${target.x + 10} ${target.y + 35}, 590 180, 595 230`;
    }
    if (activeFinger === 'RR' && target) {
      return `M 605 230 C ${target.x - 10} ${target.y + 35}, ${target.x - 12} ${target.y + 5}, ${target.x} ${target.y} C ${target.x + 10} ${target.y + 35}, 630 185, 632 235`;
    }
    if (activeFinger === 'RP' && target) {
      return `M 640 235 C ${target.x - 10} ${target.y + 35}, ${target.x - 12} ${target.y + 5}, ${target.x} ${target.y} C ${target.x + 10} ${target.y + 35}, 665 190, 662 245`;
    }
    if (activeFinger === 'THUMB') {
      return {
        left: "M 302 260 C 318 240, 342 235, 356 248 C 352 264, 326 278, 305 280",
        right: "M 495 280 C 474 278, 448 264, 444 248 C 458 235, 482 240, 498 260"
      };
    }
    return null;
  };

  const activePath = getActiveFingerPath();
  const leftThumbActive = activeFinger === 'THUMB';
  const rightThumbActive = activeFinger === 'THUMB';

  return (
    <div className="w-full max-w-4xl flex items-center justify-center select-none overflow-visible">
      <div className="relative w-full bg-slate-100/90 dark:bg-slate-900/80 rounded-3xl p-4 md:p-6 border border-slate-300/80 dark:border-white/10 shadow-2xl backdrop-blur-xl overflow-visible">
        <svg viewBox="0 0 800 420" className="w-full h-auto overflow-visible">
          <defs>
            <filter id="handGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00f5d4" floodOpacity="0.7" />
            </filter>
            <filter id="lightHandGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0d9488" floodOpacity="0.5" />
            </filter>
            <filter id="errorHandGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="0.8" />
            </filter>
            <filter id="blueHandGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3b82f6" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* 1. KEYBOARD CASING */}
          <rect x="35" y="12" width="730" height="265" rx="18" className="fill-slate-200/90 dark:fill-black/60 stroke-slate-300 dark:stroke-white/10" strokeWidth="2" />

          {/* 2. KEYS MATRIX */}
          {KEY_LAYOUT.map((row, rIdx) => {
            const startXList = [50, 75, 89, 114];
            const startX = startXList[rIdx];
            const y = 20 + rIdx * 52;

            return row.map((k, kIdx) => {
              const x = startX + kIdx * 52;
              const isTarget = k === char;

              return (
                <g key={k} className="transition-all duration-150">
                  <rect
                    x={x}
                    y={y}
                    width="44"
                    height="44"
                    rx="8"
                    className={`transition-colors duration-150 ${
                      isTarget
                        ? isWrong
                          ? 'fill-red-500 stroke-red-400'
                          : 'fill-blue-500 dark:fill-blue-600 stroke-blue-400 dark:stroke-blue-500'
                        : 'fill-white dark:fill-slate-800/90 stroke-slate-300/80 dark:stroke-white/5'
                    }`}
                    strokeWidth={isTarget ? 2.5 : 1}
                    style={isTarget ? { filter: isWrong ? 'url(#errorHandGlow)' : 'url(#blueHandGlow)' } : undefined}
                  />
                  <text
                    x={x + 22}
                    y={y + 27}
                    textAnchor="middle"
                    className={`font-mono text-sm font-black uppercase ${
                      isTarget
                        ? 'fill-white font-black'
                        : 'fill-slate-700 dark:fill-slate-300'
                    }`}
                  >
                    {k}
                  </text>
                </g>
              );
            });
          })}

          {/* SPACE BAR */}
          <rect
            x="240"
            y="228"
            width="260"
            height="38"
            rx="8"
            className={`transition-colors duration-150 ${
              char === ' '
                ? isWrong
                  ? 'fill-red-500 stroke-red-400'
                  : 'fill-blue-500 dark:fill-blue-600 stroke-blue-400 dark:stroke-blue-500'
                : 'fill-white dark:fill-slate-800/90 stroke-slate-300/80 dark:stroke-white/5'
            }`}
            strokeWidth={char === ' ' ? 2.5 : 1}
            style={char === ' ' ? { filter: isWrong ? 'url(#errorHandGlow)' : 'url(#blueHandGlow)' } : undefined}
          />
          <text x="370" y="252" textAnchor="middle" className={`font-mono text-xs font-bold ${char === ' ' ? 'fill-white' : 'fill-slate-400'}`}>
            SPACE
          </text>

          {/* 3. REALISTIC ILLUSTRATED HANDS OVERLAY */}
          {/* LEFT HAND */}
          <g className="transition-all duration-300 pointer-events-none overflow-visible">
            {/* Left Hand continuous outline */}
            <path
              d={getLeftHandPath()}
              className="fill-none stroke-slate-400/50 dark:stroke-slate-600/60 transition-all duration-200"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Left Active Finger Highlight */}
            {activeFinger && activeFinger !== 'THUMB' && ['LP', 'LR', 'LM', 'LI'].includes(activeFinger) && activePath && (
              <path
                d={activePath}
                className={isWrong ? "fill-none stroke-red-500" : "fill-none stroke-blue-500 dark:stroke-blue-400"}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: isWrong ? 'url(#errorHandGlow)' : 'url(#blueHandGlow)' }}
              />
            )}
            {/* Left Thumb Highlight */}
            {leftThumbActive && activePath && activePath.left && (
              <path
                d={activePath.left}
                className={isWrong ? "fill-none stroke-red-500" : "fill-none stroke-blue-500 dark:stroke-blue-400"}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: isWrong ? 'url(#errorHandGlow)' : 'url(#blueHandGlow)' }}
              />
            )}
          </g>

          {/* RIGHT HAND */}
          <g className="transition-all duration-300 pointer-events-none overflow-visible">
            {/* Right Hand continuous outline */}
            <path
              d={getRightHandPath()}
              className="fill-none stroke-slate-400/50 dark:stroke-slate-600/60 transition-all duration-200"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right Active Finger Highlight */}
            {activeFinger && activeFinger !== 'THUMB' && ['RP', 'RR', 'RM', 'RI'].includes(activeFinger) && activePath && (
              <path
                d={activePath}
                className={isWrong ? "fill-none stroke-red-500" : "fill-none stroke-blue-500 dark:stroke-blue-400"}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: isWrong ? 'url(#errorHandGlow)' : 'url(#blueHandGlow)' }}
              />
            )}
            {/* Right Thumb Highlight */}
            {rightThumbActive && activePath && activePath.right && (
              <path
                d={activePath.right}
                className={isWrong ? "fill-none stroke-red-500" : "fill-none stroke-blue-500 dark:stroke-blue-400"}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: isWrong ? 'url(#errorHandGlow)' : 'url(#blueHandGlow)' }}
              />
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
