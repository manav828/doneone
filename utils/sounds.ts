/**
 * Premium Sound utilities for FlowBoard
 * Based on research of Todoist, Things 3, and other productivity apps
 * Uses Web Audio API with carefully tuned parameters for satisfying feedback
 */

// Audio context singleton
let audioContext: AudioContext | null = null;

// Get or create audio context
const getAudioContext = (): AudioContext => {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

// Resume context if suspended (browser autoplay policy)
const ensureContextResumed = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }
    return ctx;
};

/**
 * Create a reverb impulse response for spatial depth
 */
const createReverb = (ctx: AudioContext, duration: number = 0.5, decay: number = 2): ConvolverNode => {
    const convolver = ctx.createConvolver();
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
    }
    convolver.buffer = impulse;
    return convolver;
};

/**
 * Play subtask completion sound
 * Inspired by Todoist's satisfying "pop" - a clean, warm, musical tone
 * Uses a marimba-like attack with soft release
 */
export const playSubtaskComplete = async (): Promise<void> => {
    try {
        const ctx = await ensureContextResumed();
        const now = ctx.currentTime;

        // Main tone - G5 (784 Hz) for a bright but not harsh sound
        const mainOsc = ctx.createOscillator();
        const mainGain = ctx.createGain();

        mainOsc.type = 'sine';
        mainOsc.frequency.setValueAtTime(784, now); // G5

        // Quick pitch bend for "pop" feel
        mainOsc.frequency.setValueAtTime(740, now);
        mainOsc.frequency.exponentialRampToValueAtTime(784, now + 0.03);

        // Marimba-like envelope: sharp attack, quick decay to sustain, then release
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(0.25, now + 0.008); // Fast attack
        mainGain.gain.exponentialRampToValueAtTime(0.08, now + 0.08); // Decay to sustain
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25); // Release

        // Second harmonic for warmth (octave above, quieter)
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();

        harmOsc.type = 'sine';
        harmOsc.frequency.setValueAtTime(1568, now); // G6

        harmGain.gain.setValueAtTime(0, now);
        harmGain.gain.linearRampToValueAtTime(0.08, now + 0.008);
        harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        // Sub harmonic for body (octave below, subtle)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(392, now); // G4

        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.06, now + 0.01);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        // Master gain with compression-like limiting
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.6, now);

        // Light low-pass for smoothness
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4000, now);
        filter.Q.setValueAtTime(0.5, now);

        // Connect everything
        mainOsc.connect(mainGain);
        harmOsc.connect(harmGain);
        subOsc.connect(subGain);

        mainGain.connect(filter);
        harmGain.connect(filter);
        subGain.connect(filter);

        filter.connect(masterGain);
        masterGain.connect(ctx.destination);

        // Start and stop
        mainOsc.start(now);
        harmOsc.start(now);
        subOsc.start(now);

        mainOsc.stop(now + 0.3);
        harmOsc.stop(now + 0.2);
        subOsc.stop(now + 0.15);
    } catch (error) {
        console.warn('Failed to play subtask complete sound:', error);
    }
};

/**
 * Play column move sound
 * A subtle, smooth "slide" effect - less intrusive than a pop
 */
export const playColumnMove = async (): Promise<void> => {
    try {
        const ctx = await ensureContextResumed();
        const now = ctx.currentTime;

        // Low sweep tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.Q.setValueAtTime(1, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        // Soft noise layer for texture
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseFilter.Q.setValueAtTime(2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.03, now + 0.02);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        // Connect
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        osc.start(now);
        noise.start(now);
        osc.stop(now + 0.25);
        noise.stop(now + 0.2);
    } catch (error) {
        console.warn('Failed to play column move sound:', error);
    }
};

/**
 * Play all complete celebration sound
 * A satisfying ascending chime with sparkle - like completing a level
 */
export const playAllComplete = async (): Promise<void> => {
    try {
        const ctx = await ensureContextResumed();
        const now = ctx.currentTime;

        // Pentatonic scale notes for pleasant, non-dissonant sound
        // C5, D5, E5, G5, A5 (pentatonic major)
        const notes = [523.25, 587.33, 659.25, 783.99, 880];

        notes.forEach((freq, i) => {
            const startTime = now + i * 0.06;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            // Each note has quick attack and moderate decay
            const noteVolume = 0.12 + (i * 0.02); // Slightly louder as it goes up
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(noteVolume, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.02, startTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

            // Add subtle second harmonic
            const harm = ctx.createOscillator();
            const harmGain = ctx.createGain();

            harm.type = 'sine';
            harm.frequency.setValueAtTime(freq * 2, startTime);

            harmGain.gain.setValueAtTime(0, startTime);
            harmGain.gain.linearRampToValueAtTime(noteVolume * 0.15, startTime + 0.01);
            harmGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

            osc.connect(gain);
            harm.connect(harmGain);
            gain.connect(ctx.destination);
            harmGain.connect(ctx.destination);

            osc.start(startTime);
            harm.start(startTime);
            osc.stop(startTime + 0.5);
            harm.stop(startTime + 0.2);
        });

        // Final sparkle - high bell tone
        const bellTime = now + 0.35;
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();

        bell.type = 'sine';
        bell.frequency.setValueAtTime(1760, bellTime); // A6

        bellGain.gain.setValueAtTime(0, bellTime);
        bellGain.gain.linearRampToValueAtTime(0.08, bellTime + 0.005);
        bellGain.gain.exponentialRampToValueAtTime(0.001, bellTime + 0.5);

        bell.connect(bellGain);
        bellGain.connect(ctx.destination);

        bell.start(bellTime);
        bell.stop(bellTime + 0.55);
    } catch (error) {
        console.warn('Failed to play all complete sound:', error);
    }
};

// Preload by initializing audio context on first user interaction
export const preloadSounds = async (): Promise<void> => {
    try {
        getAudioContext();
    } catch (error) {
        console.warn('Failed to preload sounds:', error);
    }
};

// Auto-preload on first user interaction (required by browsers)
if (typeof window !== 'undefined') {
    const unlockAudio = () => {
        preloadSounds();
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
}
