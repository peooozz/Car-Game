/**
 * src/utils/save.js
 * Persistent storage wrapper using localStorage inside try/catch.
 */
const STORAGE_KEY = 'math_buggy_rush_save_v2';

const DEFAULT_SAVE = {
  coins: 30,
  unlockedCars: ['car1'],
  selectedCarId: 'car1',
  unlockedTracks: [0], // Track indices unlocked in order (0..3)
  selectedTrackIndex: 0,
  bestResults: {}, // { [trackId]: { bestPosition, bestAccuracy, bestStreak } }
  muted: false
};

const VALID_CAR_IDS = ['car1', 'car2', 'car3', 'car4', 'car5', 'car6'];

export function loadSaveData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('math_buggy_rush_save_v1');
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw);

    // Filter valid cars
    let unlocked = Array.isArray(parsed.unlockedCars) ? parsed.unlockedCars.filter((c) => VALID_CAR_IDS.includes(c)) : [];
    if (!unlocked.includes('car1')) unlocked.unshift('car1');

    let selected = parsed.selectedCarId;
    if (!VALID_CAR_IDS.includes(selected)) {
      selected = 'car1';
    }

    return {
      ...DEFAULT_SAVE,
      ...parsed,
      unlockedCars: unlocked,
      selectedCarId: selected,
      unlockedTracks: Array.isArray(parsed.unlockedTracks) && parsed.unlockedTracks.length > 0
        ? parsed.unlockedTracks
        : [0],
      bestResults: parsed.bestResults && typeof parsed.bestResults === 'object'
        ? parsed.bestResults
        : {}
    };
  } catch (err) {
    console.warn('[Save] Failed to read localStorage, using defaults:', err);
    return { ...DEFAULT_SAVE };
  }
}

export function writeSaveData(partial) {
  try {
    const current = loadSaveData();
    const updated = { ...current, ...partial };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[Save] Failed to write localStorage:', err);
    return null;
  }
}
