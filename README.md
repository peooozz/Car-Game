# Math Buggy Rush — 3D Educational Beach Kart Racer

A complete 3D educational beach kart-racing game built with **React 18**, **Vite**, **Three.js**, **@react-three/fiber (R3F)**, **@react-three/drei**, and **Zustand**.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Audit /public/assets/cars and /public/assets/environment (.glb models)
#    Generates /public/assets/manifest.json and /public/assets/credits.json
npm run assets

# 3. Run development server
npm run dev

# 4. Production build
npm run build
```

## How to Add Your Own `.glb` Cars or Environment Models

1. Drop any `.glb` vehicle models into `public/assets/cars/` and any beach/track/prop `.glb` models into `public/assets/environment/`.
2. Run `npm run assets` (`node scripts/audit-assets.mjs`).
3. The script automatically inspects triangle counts, node names, bounding boxes, wheel nodes (`wheel`, `tire`, `tyre`, `rim`, `fl`, `fr`, `rl`, `rr`), and Draco/Meshopt compression, then writes `public/assets/manifest.json` and `public/assets/credits.json`.
4. To customize a car's speed/handling or override its forward rotation, edit its entry in `public/assets/manifest.json`.

## How to Align the Track Spline to a Custom Scene GLB

1. Press **F2** at any time during a race to toggle the **3D Debug Overlay**.
2. The F2 overlay renders the cyan `CatmullRomCurve3` spline ribbon, magenta control point spheres, green car bounding boxes, yellow `+Z` forward arrows, and red wheel pivot spheres.
3. Adjust the `[x, y, z]` coordinates in `TRACKS[i].controlPoints` inside `src/config.js` until the cyan spline aligns with your custom scenery road.
