import { useCallback } from 'react';

// Simple synth using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const playTone = (freq, type, duration, vol = 0.1) => {
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);

    gain.gain.setValueAtTime(vol, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + duration);
};

export const useSound = () => {
    const playPop = useCallback(() => {
        playTone(400 + Math.random() * 200, 'sine', 0.1, 0.1);
    }, []);

    const playExplosion = useCallback(() => {
        // Noise-like effect via multiple oscillators
        playTone(100, 'square', 0.2, 0.15);
        playTone(80, 'sawtooth', 0.2, 0.15);
        playTone(50, 'triangle', 0.3, 0.2);
    }, []);

    const playJoin = useCallback(() => {
        playTone(600, 'sine', 0.1, 0.05);
        setTimeout(() => playTone(800, 'sine', 0.1, 0.05), 100);
    }, []);

    const playWin = useCallback(() => {
        [0, 200, 400, 600].forEach((delay, i) => {
            setTimeout(() => playTone(500 + (i * 100), 'sine', 0.3, 0.1), delay);
        });
    }, []);

    const playError = useCallback(() => {
        playTone(200, 'sawtooth', 0.2, 0.1);
    }, []);

    return { playPop, playExplosion, playJoin, playWin, playError };
};
