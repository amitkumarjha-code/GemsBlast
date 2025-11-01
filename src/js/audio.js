/* ==========================================================================
   GemsBlast Game - Audio System
   ========================================================================== */

/**
 * Audio types enumeration
 */
const AudioType = {
    SFX: 'sfx',
    MUSIC: 'music'
};

/**
 * Sound effect names
 */
const SoundEffect = {
    MATCH: 'match',
    MATCH_4: 'match4',
    MATCH_5: 'match5',
    SPECIAL_ACTIVATE: 'special_activate',
    ROCKET: 'rocket',
    BOMB: 'bomb',
    RAINBOW: 'rainbow',
    SWAP: 'swap',
    INVALID_MOVE: 'invalid',
    POWER_UP: 'powerup',
    LEVEL_COMPLETE: 'level_complete',
    LEVEL_FAILED: 'level_failed',
    STAR_EARNED: 'star',
    BUTTON_CLICK: 'click',
    PLATE_BREAK: 'plate_break',
    CASCADE: 'cascade',
    COMBO: 'combo',
    TIMER_WARNING: 'timer_warning'
};

/**
 * Music track names
 */
const MusicTrack = {
    MENU: 'menu',
    GAMEPLAY: 'gameplay',
    VICTORY: 'victory',
    DEFEAT: 'defeat'
};

/**
 * Audio Manager class handling all game audio
 */
class AudioManager {
    constructor() {
        // Audio settings
        this.settings = this.loadSettings();
        this.enabled = this.settings.enabled;
        this.sfxVolume = this.settings.sfxVolume;
        this.musicVolume = this.settings.musicVolume;
        this.sfxMuted = this.settings.sfxMuted;
        this.musicMuted = this.settings.musicMuted;

        // Audio context
        this.audioContext = null;
        this.musicTrack = null;
        this.currentMusic = null;
        this.musicTimeout = null;
        this.musicNodes = new Set();

        // Sound pools for better performance
        this.sfxPool = {};
        this.sfxInstances = new Map();

        // Initialize audio system
        this.initialize();
    }

    /**
     * Initialize audio system
     */
    initialize() {
        // Create audio context (will be activated on first user interaction)
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }

        // Generate sound effects using Web Audio API
        this.generateSoundEffects();
    }

    /**
     * Generate procedural sound effects
     * Since we don't have audio files, we'll create simple tones
     */
    generateSoundEffects() {
        // Create simple sound effect generators
        this.sfxGenerators = {
            [SoundEffect.MATCH]: () => this.playTone(440, 0.1, 0.15, 'sine'),
            [SoundEffect.MATCH_4]: () => this.playTone(550, 0.15, 0.2, 'sine'),
            [SoundEffect.MATCH_5]: () => this.playTone(660, 0.2, 0.25, 'sine'),
            [SoundEffect.SPECIAL_ACTIVATE]: () => this.playChord([660, 880, 1100], 0.3, 'sine'),
            [SoundEffect.ROCKET]: () => this.playSweep(200, 800, 0.2, 'sawtooth'),
            [SoundEffect.BOMB]: () => this.playNoise(0.15),
            [SoundEffect.RAINBOW]: () => this.playArpeggio([440, 550, 660, 880, 1100], 0.05, 'sine'),
            [SoundEffect.SWAP]: () => this.playTone(330, 0.05, 0.08, 'triangle'),
            [SoundEffect.INVALID_MOVE]: () => this.playTone(150, 0.1, 0.15, 'square'),
            [SoundEffect.POWER_UP]: () => this.playChord([523, 659, 784], 0.4, 'sine'),
            [SoundEffect.LEVEL_COMPLETE]: () => this.playVictoryJingle(),
            [SoundEffect.LEVEL_FAILED]: () => this.playDefeatSound(),
            [SoundEffect.STAR_EARNED]: () => this.playTone(880, 0.2, 0.3, 'sine'),
            [SoundEffect.BUTTON_CLICK]: () => this.playTone(500, 0.03, 0.05, 'square'),
            [SoundEffect.PLATE_BREAK]: () => this.playNoise(0.1),
            [SoundEffect.CASCADE]: () => this.playTone(660, 0.08, 0.12, 'triangle'),
            [SoundEffect.COMBO]: () => this.playChord([440, 554, 659], 0.2, 'sine'),
            [SoundEffect.TIMER_WARNING]: () => this.playTone(800, 0.1, 0.15, 'square')
        };
    }

    /**
     * Play a simple tone
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {number} volume - Volume (0-1)
     * @param {string} type - Oscillator type
     */
    playTone(frequency, duration, volume = 0.3, type = 'sine') {
        if (!this.enabled || this.sfxMuted || !this.audioContext) return;

        try {
            // Resume audio context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.value = frequency;

            gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing tone:', error);
        }
    }

    /**
     * Play a chord (multiple tones)
     * @param {Array<number>} frequencies - Array of frequencies
     * @param {number} duration - Duration in seconds
     * @param {string} type - Oscillator type
     */
    playChord(frequencies, duration, type = 'sine') {
        frequencies.forEach(freq => {
            this.playTone(freq, duration, 0.2, type);
        });
    }

    /**
     * Play a frequency sweep
     * @param {number} startFreq - Starting frequency
     * @param {number} endFreq - Ending frequency
     * @param {number} duration - Duration in seconds
     * @param {string} type - Oscillator type
     */
    playSweep(startFreq, endFreq, duration, type = 'sine') {
        if (!this.enabled || this.sfxMuted || !this.audioContext) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);

            gainNode.gain.setValueAtTime(0.3 * this.sfxVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing sweep:', error);
        }
    }

    /**
     * Play white noise (for explosion effects)
     * @param {number} duration - Duration in seconds
     */
    playNoise(duration) {
        if (!this.enabled || this.sfxMuted || !this.audioContext) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = buffer;

            gainNode.gain.setValueAtTime(0.2 * this.sfxVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            source.start(this.audioContext.currentTime);
        } catch (error) {
            console.warn('Error playing noise:', error);
        }
    }

    /**
     * Play an arpeggio (sequence of notes)
     * @param {Array<number>} frequencies - Array of frequencies
     * @param {number} noteLength - Length of each note
     * @param {string} type - Oscillator type
     */
    playArpeggio(frequencies, noteLength, type = 'sine') {
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, noteLength, 0.25, type);
            }, index * noteLength * 1000);
        });
    }

    /**
     * Play victory jingle
     */
    playVictoryJingle() {
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        this.playArpeggio(notes, 0.15, 'sine');
    }

    /**
     * Play defeat sound
     */
    playDefeatSound() {
        const notes = [440, 392, 349, 294]; // A, G, F, D (descending)
        this.playArpeggio(notes, 0.2, 'triangle');
    }

    /**
     * Play a sound effect
     * @param {string} effectName - Name of the sound effect
     */
    playSFX(effectName) {
        if (!this.enabled || this.sfxMuted) return;

        const generator = this.sfxGenerators[effectName];
        if (generator) {
            generator();
        } else {
            console.warn(`Sound effect not found: ${effectName}`);
        }
    }

    /**
     * Play background music (placeholder - would load actual audio files)
     * @param {string} trackName - Name of the music track
     */
    playMusic(trackName) {
        if (!this.enabled || this.musicMuted) return;
        if (!this.audioContext) return;

        // Stop any existing music loop before starting a new one
        this.stopMusic();

        this.currentMusic = trackName;
        this.musicTrack = trackName;

        const startPlayback = () => {
            // Do not restart if another track was requested in the meantime
            if (this.currentMusic !== trackName || this.musicMuted) {
                return;
            }

            console.log(`Playing music: ${trackName}`);
            this.playBackgroundMusic(trackName);
        };

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume()
                .then(startPlayback)
                .catch(error => {
                    console.warn('Unable to resume audio context for music playback:', error);
                });
        } else {
            startPlayback();
        }
    }

    /**
     * Play background music using Web Audio API with multiple instruments
     */
    playBackgroundMusic(trackName) {
        if (!this.audioContext) return;

        const tracks = {
            gameplay: {
                melody: [
                    { note: 523.25, duration: 0.3 }, { note: 587.33, duration: 0.15 },
                    { note: 659.25, duration: 0.15 }, { note: 698.46, duration: 0.3 },
                    { note: 659.25, duration: 0.15 }, { note: 587.33, duration: 0.15 },
                    { note: 523.25, duration: 0.3 }, { note: 392.00, duration: 0.3 },
                    { note: 523.25, duration: 0.3 }, { note: 587.33, duration: 0.3 },
                    { note: 659.25, duration: 0.6 }, { note: 587.33, duration: 0.3 },
                    { note: 523.25, duration: 0.3 }, { note: 587.33, duration: 0.3 },
                    { note: 523.25, duration: 0.6 }, { note: 0, duration: 0.15 }
                ],
                bass: [
                    { note: 130.81, duration: 0.6 }, { note: 146.83, duration: 0.6 },
                    { note: 196.00, duration: 0.6 }, { note: 130.81, duration: 0.6 },
                    { note: 130.81, duration: 0.6 }, { note: 146.83, duration: 0.6 },
                    { note: 196.00, duration: 0.6 }, { note: 130.81, duration: 0.75 }
                ],
                chords: [
                    { notes: [261.63, 329.63, 392.00], duration: 1.2 },
                    { notes: [293.66, 369.99, 440.00], duration: 1.2 },
                    { notes: [196.00, 246.94, 293.66], duration: 1.2 },
                    { notes: [261.63, 329.63, 392.00], duration: 1.35 }
                ],
                guitar: [
                    { notes: [261.63, 329.63], duration: 0.3 }, { notes: [0], duration: 0.3 },
                    { notes: [293.66, 369.99], duration: 0.3 }, { notes: [0], duration: 0.3 },
                    { notes: [196.00, 246.94], duration: 0.3 }, { notes: [0], duration: 0.3 },
                    { notes: [261.63, 329.63], duration: 0.3 }, { notes: [0], duration: 0.45 }
                ],
                percussion: 0.6
            },
            menu: {
                melody: [
                    { note: 523.25, duration: 0.4 }, { note: 659.25, duration: 0.4 },
                    { note: 523.25, duration: 0.4 }, { note: 587.33, duration: 0.4 },
                    { note: 523.25, duration: 0.4 }, { note: 698.46, duration: 0.4 },
                    { note: 659.25, duration: 0.8 }, { note: 0, duration: 0.2 },
                    { note: 392.00, duration: 0.4 }, { note: 523.25, duration: 0.4 },
                    { note: 392.00, duration: 0.4 }, { note: 440.00, duration: 0.4 },
                    { note: 523.25, duration: 0.8 }, { note: 0, duration: 0.2 }
                ],
                bass: [
                    { note: 130.81, duration: 0.8 }, { note: 174.61, duration: 0.8 },
                    { note: 196.00, duration: 0.8 }, { note: 130.81, duration: 0.8 },
                    { note: 130.81, duration: 0.8 }, { note: 146.83, duration: 0.8 },
                    { note: 130.81, duration: 1.0 }
                ],
                chords: [
                    { notes: [261.63, 329.63, 392.00], duration: 1.6 },
                    { notes: [174.61, 220.00, 261.63], duration: 1.6 },
                    { notes: [196.00, 246.94, 293.66], duration: 1.6 },
                    { notes: [261.63, 329.63, 392.00], duration: 1.8 }
                ],
                guitar: [
                    { notes: [261.63, 329.63], duration: 0.4 }, { notes: [0], duration: 0.4 },
                    { notes: [174.61, 220.00], duration: 0.4 }, { notes: [0], duration: 0.4 },
                    { notes: [196.00, 246.94], duration: 0.4 }, { notes: [0], duration: 0.4 },
                    { notes: [261.63, 329.63], duration: 0.4 }, { notes: [0], duration: 0.6 }
                ],
                percussion: 0.8
            },
            victory: {
                melody: [
                    { note: 523.25, duration: 0.2 }, { note: 523.25, duration: 0.2 },
                    { note: 659.25, duration: 0.2 }, { note: 784.00, duration: 0.3 },
                    { note: 659.25, duration: 0.15 }, { note: 784.00, duration: 0.3 },
                    { note: 1046.50, duration: 0.6 }, { note: 0, duration: 0.1 },
                    { note: 784.00, duration: 0.3 }, { note: 659.25, duration: 0.3 },
                    { note: 784.00, duration: 0.3 }, { note: 1046.50, duration: 0.8 }
                ],
                bass: [
                    { note: 130.81, duration: 0.4 }, { note: 196.00, duration: 0.4 },
                    { note: 261.63, duration: 0.8 }, { note: 196.00, duration: 0.4 },
                    { note: 130.81, duration: 0.6 }
                ],
                chords: [
                    { notes: [261.63, 329.63, 392.00], duration: 0.8 },
                    { notes: [196.00, 246.94, 293.66], duration: 0.8 },
                    { notes: [261.63, 329.63, 392.00, 523.25], duration: 0.9 }
                ],
                guitar: [
                    { notes: [261.63, 329.63], duration: 0.2 }, { notes: [0], duration: 0.2 },
                    { notes: [196.00, 246.94], duration: 0.2 }, { notes: [0], duration: 0.2 },
                    { notes: [261.63, 329.63, 392.00], duration: 0.3 }, { notes: [0], duration: 0.5 }
                ],
                percussion: 0.4
            }
        };

        const track = tracks[trackName] || tracks.gameplay;
        const loopDuration = Math.max(
            track.melody.reduce((t, n) => t + n.duration, 0),
            track.bass.reduce((t, n) => t + n.duration, 0)
        );

        const scheduleLoop = () => {
            if (!this.currentMusic || this.musicMuted || this.currentMusic !== trackName) {
                return;
            }

            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(error => {
                    console.warn('Unable to resume audio context:', error);
                });
            }

            const startTime = this.audioContext.currentTime + 0.05;

            // Play melody (lead - triangle wave)
            let cursor = startTime;
            track.melody.forEach((note) => {
                if (note.note > 0) {
                    this.playNote(note.note, cursor, note.duration, 'triangle', 0.12);
                }
                cursor += note.duration;
            });

            // Play bass (sine wave - deep)
            cursor = startTime;
            track.bass.forEach((note) => {
                this.playNote(note.note, cursor, note.duration, 'sine', 0.15);
                cursor += note.duration;
            });

            // Play chords (sawtooth - rich)
            cursor = startTime;
            track.chords.forEach((chord) => {
                chord.notes.forEach(note => {
                    this.playNote(note, cursor, chord.duration, 'sawtooth', 0.04);
                });
                cursor += chord.duration;
            });

            // Play guitar (bright, strummed)
            if (track.guitar) {
                cursor = startTime;
                track.guitar.forEach((strum) => {
                    if (strum.notes[0] > 0) {
                        this.playGuitar(strum.notes, cursor, strum.duration);
                    }
                    cursor += strum.duration;
                });
            }

            // Add percussion (hi-hat, kick, snare)
            if (track.percussion) {
                cursor = startTime;
                const beatCount = Math.floor(loopDuration / track.percussion);
                for (let i = 0; i < beatCount; i++) {
                    // Hi-hat on every beat
                    this.playHiHat(cursor, 0.05);

                    // Kick drum on beats 1 and 3 (0, 2, 4...)
                    if (i % 2 === 0) {
                        this.playKick(cursor, 0.15);
                    }

                    // Snare on beats 2 and 4 (1, 3, 5...)
                    if (i % 2 === 1) {
                        this.playSnare(cursor, 0.12);
                    }

                    cursor += track.percussion;
                }
            }

            this.musicTimeout = setTimeout(scheduleLoop, Math.max(loopDuration * 1000 - 40, 100));
        };

        scheduleLoop();
    }

    /**
     * Play a single note
     */
    playNote(frequency, startTime, duration, waveType = 'sine', volume = 0.1) {
        if (!this.audioContext || !this.currentMusic || this.musicMuted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, startTime);
        filter.Q.setValueAtTime(1, startTime);

        const peakGain = Math.max(this.musicVolume * volume, 0.003);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);

        const fadeOutStart = startTime + Math.max(duration - 0.05, 0.01);
        gainNode.gain.setValueAtTime(peakGain, fadeOutStart);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const nodeRef = { oscillator, gainNode, filter };
        this.musicNodes.add(nodeRef);

        oscillator.onended = () => {
            try { oscillator.disconnect(); } catch (e) { }
            try { filter.disconnect(); } catch (e) { }
            try { gainNode.disconnect(); } catch (e) { }
            this.musicNodes.delete(nodeRef);
        };

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    /**
     * Play guitar strum with bright, percussive attack
     */
    playGuitar(frequencies, startTime, duration) {
        if (!this.audioContext || !this.currentMusic || this.musicMuted) return;

        // Strum effect - notes slightly offset
        frequencies.forEach((freq, index) => {
            const strumOffset = index * 0.01; // 10ms strum delay per note
            const noteStart = startTime + strumOffset;

            // Use square wave for bright, guitar-like tone
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(freq, noteStart);

            // Bandpass filter for guitar-like tone
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(freq * 2, noteStart);
            filter.Q.setValueAtTime(2, noteStart);

            // Sharp attack, quick decay (guitar pluck)
            const peakGain = Math.max(this.musicVolume * 0.08, 0.002);
            gainNode.gain.setValueAtTime(0, noteStart);
            gainNode.gain.linearRampToValueAtTime(peakGain, noteStart + 0.005); // Fast attack
            gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.3, noteStart + 0.1); // Initial decay
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + duration);

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            const nodeRef = { oscillator, gainNode, filter };
            this.musicNodes.add(nodeRef);

            oscillator.onended = () => {
                try { oscillator.disconnect(); } catch (e) { }
                try { filter.disconnect(); } catch (e) { }
                try { gainNode.disconnect(); } catch (e) { }
                this.musicNodes.delete(nodeRef);
            };

            oscillator.start(noteStart);
            oscillator.stop(noteStart + duration);
        });
    }

    /**
     * Play hi-hat sound
     */
    playHiHat(startTime, duration) {
        if (!this.audioContext || !this.currentMusic || this.musicMuted) return;

        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();
        const gainNode = this.audioContext.createGain();

        noise.buffer = buffer;

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, startTime);

        const peakGain = Math.max(this.musicVolume * 0.08, 0.002);
        gainNode.gain.setValueAtTime(peakGain, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const nodeRef = { noise, filter, gainNode };
        this.musicNodes.add(nodeRef);

        noise.onended = () => {
            try { noise.disconnect(); } catch (e) { }
            try { filter.disconnect(); } catch (e) { }
            try { gainNode.disconnect(); } catch (e) { }
            this.musicNodes.delete(nodeRef);
        };

        noise.start(startTime);
        noise.stop(startTime + duration);
    }

    /**
     * Play kick drum sound
     */
    playKick(startTime, duration) {
        if (!this.audioContext || !this.currentMusic || this.musicMuted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';

        // Pitch sweep from 150Hz to 40Hz for that classic kick sound
        oscillator.frequency.setValueAtTime(150, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, startTime + 0.05);

        const peakGain = Math.max(this.musicVolume * 0.25, 0.005);
        gainNode.gain.setValueAtTime(peakGain, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const nodeRef = { oscillator, gainNode };
        this.musicNodes.add(nodeRef);

        oscillator.onended = () => {
            try { oscillator.disconnect(); } catch (e) { }
            try { gainNode.disconnect(); } catch (e) { }
            this.musicNodes.delete(nodeRef);
        };

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    /**
     * Play snare drum sound
     */
    playSnare(startTime, duration) {
        if (!this.audioContext || !this.currentMusic || this.musicMuted) return;

        // Snare = tonal component + noise

        // Tonal component (pitched)
        const oscillator = this.audioContext.createOscillator();
        const oscillatorGain = this.audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, startTime + 0.05);

        const tonalPeakGain = Math.max(this.musicVolume * 0.1, 0.003);
        oscillatorGain.gain.setValueAtTime(tonalPeakGain, startTime);
        oscillatorGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(oscillatorGain);
        oscillatorGain.connect(this.audioContext.destination);

        // Noise component
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        const noiseFilter = this.audioContext.createBiquadFilter();
        const noiseGain = this.audioContext.createGain();

        noise.buffer = buffer;

        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, startTime);

        const noisePeakGain = Math.max(this.musicVolume * 0.12, 0.003);
        noiseGain.gain.setValueAtTime(noisePeakGain, startTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        const nodeRef = { oscillator, oscillatorGain, noise, noiseFilter, noiseGain };
        this.musicNodes.add(nodeRef);

        oscillator.onended = () => {
            try { oscillator.disconnect(); } catch (e) { }
            try { oscillatorGain.disconnect(); } catch (e) { }
            this.musicNodes.delete(nodeRef);
        };

        noise.onended = () => {
            try { noise.disconnect(); } catch (e) { }
            try { noiseFilter.disconnect(); } catch (e) { }
            try { noiseGain.disconnect(); } catch (e) { }
        };

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        noise.start(startTime);
        noise.stop(startTime + duration);
    }

    /**
     * Stop current music
     */
    stopMusic() {
        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
            this.musicTimeout = null;
        }

        if (this.musicNodes.size > 0) {
            this.musicNodes.forEach(node => {
                try {
                    node.oscillator.onended = null;
                    node.oscillator.stop();
                } catch (error) {
                    // ignore if already stopped
                }

                try {
                    node.oscillator.disconnect();
                } catch (error) {
                    // ignore
                }

                try {
                    node.gainNode.disconnect();
                } catch (error) {
                    // ignore
                }
            });

            this.musicNodes.clear();
        }

        this.currentMusic = null;
        this.musicTrack = null;
    }

    /**
     * Set SFX volume
     * @param {number} volume - Volume level (0-1)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.settings.sfxVolume = this.sfxVolume;
        this.saveSettings();
    }

    /**
     * Set music volume
     * @param {number} volume - Volume level (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.settings.musicVolume = this.musicVolume;
        this.saveSettings();

        // Update current music volume if playing
        // (would be implemented with actual audio elements)
    }

    /**
     * Toggle SFX mute
     */
    toggleSFXMute() {
        this.sfxMuted = !this.sfxMuted;
        this.settings.sfxMuted = this.sfxMuted;
        this.saveSettings();
        return this.sfxMuted;
    }

    /**
     * Toggle music mute
     */
    toggleMusicMute() {
        this.musicMuted = !this.musicMuted;
        this.settings.musicMuted = this.musicMuted;
        this.saveSettings();

        if (this.musicMuted) {
            this.stopMusic();
        } else if (this.currentMusic) {
            this.playMusic(this.currentMusic);
        }

        return this.musicMuted;
    }

    /**
     * Enable audio system
     */
    enable() {
        this.enabled = true;
        this.settings.enabled = true;
        this.saveSettings();
    }

    /**
     * Disable audio system
     */
    disable() {
        this.enabled = false;
        this.settings.enabled = false;
        this.stopMusic();
        this.saveSettings();
    }

    /**
     * Load audio settings from localStorage
     * @returns {Object}
     */
    loadSettings() {
        const defaults = {
            enabled: true,
            sfxVolume: 0.7,
            musicVolume: 0.5,
            sfxMuted: false,
            musicMuted: false
        };

        return Utils.loadFromStorage('gemsBlast_audioSettings', defaults);
    }

    /**
     * Save audio settings to localStorage
     */
    saveSettings() {
        this.settings = {
            enabled: this.enabled,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume,
            sfxMuted: this.sfxMuted,
            musicMuted: this.musicMuted
        };

        Utils.saveToStorage('gemsBlast_audioSettings', this.settings);
    }

    /**
     * Resume audio context (call this on first user interaction)
     */
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}
