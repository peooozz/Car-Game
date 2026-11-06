/**
 * src/assets/manifest.js
 * Loads and provides fallback-safe access to /assets/manifest.json and /assets/credits.json.
 */

export const DEFAULT_MANIFEST = {
  generatedAt: new Date().toISOString(),
  cars: [
    {
      id: 'car1',
      name: 'Toon Turbo',
      file: '/assets/cars/car1.glb',
      triangles: 9969,
      bboxSize: [12.63, 12.409, 20.685],
      scale: 0.2127,
      rotationY: Math.PI,
      wheelNodeNames: [],
      color: '#f59e0b',
      accentColor: '#ef4444',
      unlockCost: 0,
      stats: { maxSpeed: 40.0, acceleration: 26.0, handling: 2.80, driftBoost: 1.15 }
    },
    {
      id: 'car2',
      name: 'Cicada Classic',
      file: '/assets/cars/car2.glb',
      triangles: 13254,
      bboxSize: [0.977, 1.002, 1.882],
      scale: 2.3374,
      rotationY: Math.PI / 2,
      wheelNodeNames: ['right_front_wheel', 'left_front_wheel', 'right_rear_wheel', 'left_rear_wheel'],
      color: '#ef4444',
      accentColor: '#ffffff',
      unlockCost: 25,
      stats: { maxSpeed: 41.5, acceleration: 27.5, handling: 2.95, driftBoost: 1.18 }
    },
    {
      id: 'car3',
      name: 'Cosmic Camper',
      file: '/assets/cars/car3.glb',
      triangles: 372180,
      bboxSize: [1.879, 1.969, 2.298],
      scale: 1.9145,
      rotationY: 0,
      wheelNodeNames: [],
      color: '#10b981',
      accentColor: '#fef08a',
      unlockCost: 50,
      stats: { maxSpeed: 42.5, acceleration: 28.5, handling: 3.05, driftBoost: 1.20 }
    },
    {
      id: 'car4',
      name: 'Hot Rod Hauler',
      file: '/assets/cars/car4.glb',
      triangles: 5493,
      bboxSize: [2.231, 1.566, 3.756],
      scale: 1.1713,
      rotationY: 0,
      wheelNodeNames: ['Wheels_forward', 'Wheels_back'],
      color: '#06b6d4',
      accentColor: '#f97316',
      unlockCost: 75,
      stats: { maxSpeed: 43.5, acceleration: 29.5, handling: 3.15, driftBoost: 1.22 }
    },
    {
      id: 'car5',
      name: 'Cyber Delorean',
      file: '/assets/cars/car5.glb',
      triangles: 5459,
      bboxSize: [1.961, 2.747, 4.011],
      scale: 1.097,
      rotationY: 0,
      wheelNodeNames: [],
      color: '#8b5cf6',
      accentColor: '#00f5d4',
      unlockCost: 100,
      stats: { maxSpeed: 44.5, acceleration: 30.5, handling: 3.25, driftBoost: 1.25 }
    },
    {
      id: 'car6',
      name: 'Apex Aero',
      file: '/assets/cars/car6.glb',
      triangles: 171243,
      bboxSize: [4.773, 5.792, 7.573],
      scale: 0.581,
      rotationY: -2.35619449,
      wheelNodeNames: ['Torus001_14', 'Torus002_15', 'Torus003_16', 'Torus004_17'],
      color: '#3b82f6',
      accentColor: '#ffffff',
      unlockCost: 125,
      stats: { maxSpeed: 45.5, acceleration: 31.5, handling: 3.35, driftBoost: 1.28 }
    }
  ],
  environment: []
};

export const DEFAULT_CREDITS = [
  {
    file: '/assets/cars/car1.glb',
    title: 'Toon Turbo (Cartoon Car)',
    author: 'Benjamin Aubert (Sketchfab)',
    license: 'CC-BY-4.0',
    sourceUrl: 'https://sketchfab.com/3d-models/cartoon-car-a5f6a99597d34c06832e7cc07e4a6c69'
  },
  {
    file: '/assets/cars/car2.glb',
    title: 'Cicada Classic (Retro Cartoon Car)',
    author: 'RCC Design (Sketchfab)',
    license: 'CC-BY-4.0',
    sourceUrl: 'https://sketchfab.com/3d-models/cicada-retro-cartoon-car-135b16b4f77249d8ad13185270f94251'
  },
  {
    file: '/assets/cars/car3.glb',
    title: 'Cosmic Camper (Cartoon Toy Car)',
    author: 'Render Bunny (Sketchfab)',
    license: 'CC-BY-4.0',
    sourceUrl: 'https://sketchfab.com/3d-models/cartoon-toy-car-character-illustration-ba4c5c1b78cd4608bf387101f0f2e0e4'
  },
  {
    file: '/assets/cars/car4.glb',
    title: 'Hot Rod Hauler (Cartoon Car)',
    author: 'alutsiv (Sketchfab)',
    license: 'CC-BY-4.0',
    sourceUrl: 'https://sketchfab.com/3d-models/cartoon-car-2036157fd4b649169769440c82e5e3f1'
  },
  {
    file: '/assets/cars/car5.glb',
    title: 'Cyber Delorean (Cartoon Low Poly Futuristic Car)',
    author: 'antonmoek (Sketchfab)',
    license: 'CC-BY-4.0',
    sourceUrl: 'https://sketchfab.com/3d-models/cartoon-low-poly-futuristic-car-994c56e9ecd74fbd9f760640cc7342e5'
  },
  {
    file: '/assets/cars/car6.glb',
    title: 'Apex Aero (Cartoony Car)',
    author: 'teryrocks32 (Sketchfab)',
    license: 'CC-BY-4.0',
    sourceUrl: 'https://sketchfab.com/3d-models/cartoony-car-ae0ea2ac9d0e4d669a8f9c0d36ec8ee5'
  }
];

let cachedManifest = null;
let cachedCredits = null;

export async function loadManifest() {
  if (cachedManifest) return cachedManifest;
  try {
    const res = await fetch('/assets/manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.cars) && data.cars.length > 0) {
      cachedManifest = data;
      return cachedManifest;
    }
  } catch (err) {
    console.warn('[Manifest] Could not fetch /assets/manifest.json, using built-in manifest fallback:', err.message);
  }
  cachedManifest = DEFAULT_MANIFEST;
  return cachedManifest;
}

export async function loadCredits() {
  if (cachedCredits) return cachedCredits;
  try {
    const res = await fetch('/assets/credits.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      cachedCredits = data;
      return cachedCredits;
    }
  } catch (err) {
    console.warn('[Credits] Could not fetch /assets/credits.json, using default credits:', err.message);
  }
  cachedCredits = DEFAULT_CREDITS;
  return cachedCredits;
}
