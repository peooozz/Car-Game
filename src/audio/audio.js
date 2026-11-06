/**
 * src/audio/audio.js
 * Synthesized Web Audio API sound engine for Math Buggy Rush:
 * - Engine hum (pitch & gain follow car speed and RPM)
 * - Bubble pop sound (bright resonant pop)
 * - Drift tire screech (modulated white noise + bandpass filter)
 * - Turbo boost whoosh (swept pitch burst)
 * - Car collision bumper thud (low-frequency impulse)
 * - Correct answer chime (bright major triad arpeggio)
 * - Wrong answer buzz (low sawtooth dual-tone)
 * - Weapon fire (coconut, rocket, shockwave, megaclaw)
 * - Hit explosion (filtered noise burst + sub drop)
 * - Countdown beeps (3-2-1 & high GO tone)
 * - Upbeat island background marimba loop
 */
import { useGameStore } from '../store/gameStore';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.driftSource = null;
    this.driftGain = null;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  isMuted() {
    return useGameStore.getState().muted;
  }

  unlock() {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.unlocked = true;

      // Setup continuous engine hum oscillator
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'triangle';
      this.engineOsc.frequency.value = 55;
      this.engineGain.gain.value = 0.0;
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();

      this.startMusicLoop();
    } catch (e) {
      // Audio autoplay policy
    }
  }

  updateEngineHum(speed = 0) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    if (this.isMuted() || speed <= 0.5) {
      this.engineGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.08);
      return;
    }
    const norm = Math.min(1.4, speed / 30);
    const freq = 55 + norm * 140;
    const vol = 0.03 + norm * 0.055;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.06);
  }

  playBubblePop() {
    this.unlock();
    if (!this.ctx || this.isMuted()) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t0);
    osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.04);
    osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.12);
    gain.gain.setValueAtTime(0.24, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.15);
  }

  playCarBump() {
    this.unlock();
    if (!this.ctx || this.isMuted()) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t0);
    osc.frequency.exponentialRampToValueAtTime(35, t0 + 0.12);
    gain.gain.setValueAtTime(0.25, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.15);
  }

  playDriftScreech() {
    this.unlock();
    if (!this.ctx || this.isMuted()) return;
    const t0 = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t0);
    filter.Q.setValueAtTime(3.5, t0);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t0);
    noise.stop(t0 + 0.19);
  }

  playTurboBoost() {
    this.unlock();
    if (!this.ctx || this.isMuted()) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t0);
    osc.frequency.exponentialRampToValueAtTime(840, t0 + 0.28);
    gain.gain.setValueAtTime(0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.32);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.34);
  }

  playTone(freq, duration = 0.15, type = 'sine', vol = 0.14, delay = 0) {
    if (!this.ctx || this.isMuted()) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  playCorrectChime() {
    this.unlock();
    this.playTone(523.25, 0.14, 'triangle', 0.16, 0.0);  // C5
    this.playTone(659.25, 0.14, 'triangle', 0.16, 0.07); // E5
    this.playTone(783.99, 0.18, 'triangle', 0.18, 0.14); // G5
    this.playTone(1046.5, 0.28, 'sine', 0.20, 0.21);     // C6
  }

  playWrongBuzz() {
    this.unlock();
    this.playTone(155, 0.22, 'sawtooth', 0.16, 0.0);
    this.playTone(130, 0.28, 'sawtooth', 0.18, 0.14);
  }

  playCountdownBeep(isGo = false) {
    this.unlock();
    if (isGo) {
      this.playTone(880, 0.35, 'square', 0.16, 0);
      this.playTone(1174.66, 0.38, 'triangle', 0.16, 0.04);
    } else {
      this.playTone(440, 0.18, 'sine', 0.15, 0);
    }
  }

  playWeaponFire(weaponType = 'coconut') {
    this.unlock();
    if (!this.ctx || this.isMuted()) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (weaponType === 'rocket' || weaponType === 'megaclaw') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t0);
      osc.frequency.exponentialRampToValueAtTime(680, t0 + 0.28);
      gain.gain.setValueAtTime(0.16, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.32);
    } else if (weaponType === 'shockwave') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, t0);
      osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.42);
      gain.gain.setValueAtTime(0.22, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.46);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t0);
      osc.frequency.exponentialRampToValueAtTime(110, t0 + 0.16);
      gain.gain.setValueAtTime(0.18, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    }
  }

  playHitExplosion() {
    this.unlock();
    if (!this.ctx || this.isMuted()) return;
    const t0 = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.28;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, t0);
    filter.frequency.exponentialRampToValueAtTime(120, t0 + 0.26);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    whiteNoise.start(t0);
    whiteNoise.stop(t0 + 0.29);
  }

  startMusicLoop() {
    if (this.musicTimer) return;
    const notes = [261.63, 329.63, 392.0, 440.0, 523.25, 392.0, 329.63, 293.66];
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.isMuted()) return;
      const st = useGameStore.getState();
      if (st.paused) return;
      const freq = notes[this.musicStep % notes.length];
      this.musicStep++;
      this.playTone(freq, 0.14, 'sine', 0.035, 0);
    }, 280);
  }
}

export const soundEngine = new SoundEngine();
