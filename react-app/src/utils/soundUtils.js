export const playErrorSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);

        // Cleanup: Close context after sound finished
        setTimeout(() => {
            if (audioCtx.state !== 'closed') audioCtx.close();
        }, 200);
    } catch {
        // Fail silently
    }
};

export const playSuccessSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const playTone = (freq, start, duration) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + start);

            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + start);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start(audioCtx.currentTime + start);
            oscillator.stop(audioCtx.currentTime + start + duration);
        };

        // Chime: C5 then G5
        playTone(523, 0, 0.15);
        playTone(784, 0.15, 0.2);

        // Cleanup
        setTimeout(() => {
            if (audioCtx.state !== 'closed') audioCtx.close();
        }, 500);
    } catch {
        // Fail silently
    }
};
