/**
 * src/store/gameStore.js
 * Zustand store strictly separating low-frequency React UI state from high-frequency
 * per-frame mutable race state (`raceRuntime`).
 */
import { create } from 'zustand';
import * as THREE from 'three';
import { GAME_CONFIG, TRACKS } from '../config';
import { DEFAULT_MANIFEST } from '../assets/manifest';
import { loadSaveData, writeSaveData } from '../utils/save';

const initialSave = loadSaveData();

/**
 * Mutable non-reactive object read/written inside `useFrame` at 60-144Hz.
 */
export const raceRuntime = {
  active: false,
  trackIndex: 0,
  curve: null,
  trackLength: 1100,
  trackWidth: 15,
  hudTimer: 0,
  raceElapsed: 0,
  cameraShake: 0,

  // Control inputs: Left, Right, Brake, Drift, Fire
  controls: {
    accelerate: false,
    brake: false,
    left: false,
    right: false,
    drift: false,
    fire: false,
    isTouch: false
  },

  // 6 cars: index 0 is Player, 1..5 are AI Rivals (all 6 3D models)
  cars: [],

  // Active math bubbles
  zones: [],
  retryGate: null,

  // Pooled projectiles (max 24)
  projectiles: [],

  // Pooled particles (max 180)
  particles: [],

  spawnParticleBurst(pos, colorHex, count = 16, speedScale = 1.0, kind = 'burst') {
    const pool = this.particles;
    let spawned = 0;
    for (let i = 0; i < pool.length && spawned < count; i++) {
      const p = pool[i];
      if (!p.active) {
        p.active = true;
        p.kind = kind;
        p.x = pos.x + (Math.random() - 0.5) * 0.9;
        p.y = Math.max(0.15, pos.y + (Math.random() - 0.2) * 0.7);
        p.z = pos.z + (Math.random() - 0.5) * 0.9;
        const angle = Math.random() * Math.PI * 2;
        const spd = (2.5 + Math.random() * 8.0) * speedScale;
        p.vx = Math.cos(angle) * spd;
        p.vy = (2.2 + Math.random() * 6.5) * speedScale;
        p.vz = Math.sin(angle) * spd;
        p.life = 0;
        p.maxLife = kind === 'dust' ? 0.35 + Math.random() * 0.25 : 0.55 + Math.random() * 0.45;
        p.size = kind === 'dust' ? 0.32 + Math.random() * 0.25 : 0.42 + Math.random() * 0.38;
        p.color = colorHex;
        spawned++;
      }
    }
  }
};

// Pre-populate pools
for (let i = 0; i < 24; i++) {
  raceRuntime.projectiles.push({
    id: i,
    active: false,
    type: 'coconut',
    ownerIndex: 0,
    x: 0,
    y: 0.7,
    z: 0,
    vx: 0,
    vz: 0,
    yaw: 0,
    radius: 0.6,
    age: 0,
    maxAge: 3.0,
    stunDuration: 1.5,
    hitSet: new Set()
  });
}

for (let i = 0; i < 180; i++) {
  raceRuntime.particles.push({
    id: i,
    active: false,
    kind: 'dust',
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 0.5,
    size: 0.35,
    color: '#ffffff'
  });
}

export function buildTrackCurve(trackConfig) {
  const pts = trackConfig.controlPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  return curve;
}

export const useGameStore = create((set, get) => ({
  screen: 'menu',
  paused: false,
  debugMode: false,
  muted: initialSave.muted,

  manifest: DEFAULT_MANIFEST,
  credits: [],

  coins: initialSave.coins,
  unlockedCars: initialSave.unlockedCars,
  selectedCarId: initialSave.selectedCarId,
  unlockedTracks: initialSave.unlockedTracks,
  selectedTrackIndex: initialSave.selectedTrackIndex,
  bestResults: initialSave.bestResults,

  countdown: 3,
  lap: 1,
  position: 1,
  speedDisplay: 0,
  raceCoins: 0,
  streak: 0,
  bestStreakInRace: 0,
  questionsAttempted: 0,
  questionsCorrect: 0,
  weapon: null,
  shieldActive: false,
  boostActive: false,

  // Active MCQ question popup (triggers game pause when non-null)
  activeMCQ: null,

  activeQuestion: null,
  feedback: null,
  finishSummary: null,

  setManifestAndCredits: (manifest, credits) => set({ manifest, credits }),

  setScreen: (screen) => set({ screen, paused: false, activeMCQ: null }),

  togglePause: () =>
    set((state) => {
      if (state.screen !== 'racing') return state;
      // Do not allow manually unpausing if activeMCQ is awaiting an answer
      if (state.activeMCQ) return state;
      return { paused: !state.paused };
    }),

  setPaused: (paused) =>
    set((state) => (state.screen === 'racing' ? { paused } : state)),

  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),

  toggleMute: () =>
    set((state) => {
      const muted = !state.muted;
      writeSaveData({ muted });
      return { muted };
    }),

  selectTrack: (trackIndex) => {
    const { unlockedTracks } = get();
    if (!unlockedTracks.includes(trackIndex)) return;
    writeSaveData({ selectedTrackIndex: trackIndex });
    set({ selectedTrackIndex: trackIndex });
  },

  unlockAllLevels: () => {
    const all = [0, 1, 2, 3, 4, 5];
    writeSaveData({ unlockedTracks: all });
    set({ unlockedTracks: all });
  },

  selectOrUnlockCar: (carId) => {
    const state = get();
    const car = state.manifest.cars.find((c) => c.id === carId);
    if (!car) return false;

    if (state.unlockedCars.includes(carId)) {
      writeSaveData({ selectedCarId: carId });
      set({ selectedCarId: carId });
      return true;
    }

    const cost = car.unlockCost || 0;
    if (state.coins >= cost) {
      const newCoins = state.coins - cost;
      const newUnlocked = [...state.unlockedCars, carId];
      writeSaveData({
        coins: newCoins,
        unlockedCars: newUnlocked,
        selectedCarId: carId
      });
      set({
        coins: newCoins,
        unlockedCars: newUnlocked,
        selectedCarId: carId
      });
      return true;
    }
    return false;
  },

  showFeedback: (text, kind = 'correct', durationMs = 1800, subtext = '') => {
    set({
      feedback: {
        text,
        subtext,
        kind,
        expiresAt: performance.now() + durationMs
      }
    });
  },

  clearExpiredFeedback: () => {
    const fb = get().feedback;
    if (fb && performance.now() >= fb.expiresAt) {
      set({ feedback: null });
    }
  },

  startRace: (trackIndexOverride = null) => {
    const state = get();
    const tIdx = trackIndexOverride !== null ? trackIndexOverride : state.selectedTrackIndex;
    const track = TRACKS[tIdx] || TRACKS[0];
    const curve = buildTrackCurve(track);
    const trackLength = curve.getLength();

    raceRuntime.active = true;
    raceRuntime.trackIndex = tIdx;
    raceRuntime.curve = curve;
    raceRuntime.trackLength = trackLength;
    raceRuntime.trackWidth = track.trackWidth;
    raceRuntime.hudTimer = 0;
    raceRuntime.raceElapsed = 0;
    raceRuntime.cameraShake = 0;
    raceRuntime.retryGate = null;

    raceRuntime.projectiles.forEach((p) => {
      p.active = false;
      p.hitSet.clear();
    });
    raceRuntime.particles.forEach((p) => {
      p.active = false;
    });

    const carsManifest = state.manifest.cars?.length ? state.manifest.cars : DEFAULT_MANIFEST.cars;
    const playerCarEntry =
      carsManifest.find((c) => c.id === state.selectedCarId) || carsManifest[0];
    const otherCars = carsManifest.filter((c) => c.id !== playerCarEntry.id);

    const cars = [];
    for (let i = 0; i < GAME_CONFIG.totalCars; i++) {
      const isPlayer = i === 0;
      const manifestEntry = isPlayer
        ? playerCarEntry
        : otherCars[(i - 1) % otherCars.length] || carsManifest[i % carsManifest.length];

      const startRow = Math.floor(i / 2);
      const startCol = i % 2 === 0 ? -0.34 : 0.34;
      const startT = (1.0 - (startRow + 1) * 0.007) % 1.0;

      const pt = curve.getPointAt(startT);
      const tan = curve.getTangentAt(startT).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

      cars.push({
        index: i,
        isPlayer,
        name: isPlayer ? 'You' : GAME_CONFIG.ai.names[(i - 1) % GAME_CONFIG.ai.names.length],
        manifestEntry,
        color: manifestEntry.color,
        t: startT,
        totalProgress: -(startRow + 1) * 0.007,
        lap: 1,
        lateralOffset: startCol,
        targetOffset: startCol,
        aiOffsetTimer: 1.5 + Math.random() * 2.5,
        speed: 0,
        maxSpeed: isPlayer
          ? (manifestEntry.stats?.maxSpeed || GAME_CONFIG.driving.baseMaxSpeed)
          : GAME_CONFIG.ai.baseSpeeds[(i - 1) % GAME_CONFIG.ai.baseSpeeds.length],
        acceleration: manifestEntry.stats?.acceleration || GAME_CONFIG.driving.acceleration,
        handling: manifestEntry.stats?.handling || GAME_CONFIG.driving.steerSpeed,
        steerAngle: 0,
        tiltAngle: 0,
        pitchAngle: 0,
        isDrifting: false,
        driftCharge: 0,
        curbRumble: 0,
        stunTimer: 0,
        spinAngle: 0,
        shieldTimer: 0,
        slowTimer: 0,
        boostTimer: 0,
        boostKind: 'mini',
        fireCooldown: 4.0 + Math.random() * 4.0,
        airY: 0,
        velY: 0,
        positionRank: GAME_CONFIG.totalCars - i,
        finished: false,
        worldPos: pt.clone().addScaledVector(right, startCol * (track.trackWidth * 0.5)),
        forward: tan.clone(),
        yaw: Math.atan2(tan.x, tan.z)
      });
    }
    raceRuntime.cars = cars;

    set({
      screen: 'racing',
      paused: false,
      selectedTrackIndex: tIdx,
      countdown: 3,
      lap: 1,
      position: 6,
      speedDisplay: 0,
      raceCoins: 0,
      streak: 0,
      bestStreakInRace: 0,
      questionsAttempted: 0,
      questionsCorrect: 0,
      weapon: null,
      shieldActive: false,
      boostActive: false,
      activeMCQ: null,
      activeQuestion: null,
      feedback: null,
      finishSummary: null
    });
  },

  finishRace: () => {
    const state = get();
    const player = raceRuntime.cars[0];
    const finalPosition = player ? player.positionRank : 1;
    const positionsGained = Math.max(0, GAME_CONFIG.totalCars - finalPosition);
    const positionBonusCoins = positionsGained * GAME_CONFIG.finishPositionCoinBonus;
    const totalEarnedCoins = state.raceCoins + positionBonusCoins;
    const accuracy =
      state.questionsAttempted > 0
        ? Math.round((state.questionsCorrect / state.questionsAttempted) * 100)
        : 100;

    const newTotalCoins = state.coins + totalEarnedCoins;
    const nextTrackIdx = Math.min(TRACKS.length - 1, state.selectedTrackIndex + 1);
    const newUnlockedTracks = state.unlockedTracks.includes(nextTrackIdx)
      ? state.unlockedTracks
      : [...state.unlockedTracks, nextTrackIdx];

    const trackId = TRACKS[state.selectedTrackIndex].id;
    const prevBest = state.bestResults[trackId] || {
      bestPosition: 6,
      bestAccuracy: 0,
      bestStreak: 0
    };
    const updatedBestResults = {
      ...state.bestResults,
      [trackId]: {
        bestPosition: Math.min(prevBest.bestPosition, finalPosition),
        bestAccuracy: Math.max(prevBest.bestAccuracy, accuracy),
        bestStreak: Math.max(prevBest.bestStreak, state.bestStreakInRace)
      }
    };

    writeSaveData({
      coins: newTotalCoins,
      unlockedTracks: newUnlockedTracks,
      bestResults: updatedBestResults
    });

    raceRuntime.active = false;

    set({
      screen: 'finished',
      coins: newTotalCoins,
      unlockedTracks: newUnlockedTracks,
      bestResults: updatedBestResults,
      activeMCQ: null,
      activeQuestion: null,
      finishSummary: {
        trackName: TRACKS[state.selectedTrackIndex].name,
        position: finalPosition,
        positionsGained,
        accuracy,
        questionsCorrect: state.questionsCorrect,
        questionsAttempted: state.questionsAttempted,
        bestStreak: state.bestStreakInRace,
        answerCoins: state.raceCoins,
        positionBonusCoins,
        totalEarnedCoins,
        nextTrackIndex: nextTrackIdx
      }
    });
  }
}));
