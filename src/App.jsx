/**
 * src/App.jsx
 * Root component combining `<Canvas shadows dpr={[1, 2]}>` inside `<Suspense>`
 * with DOM UI overlays (Menu, TrackSelect, Garage, Credits, HUD, TouchControls,
 * FinishScreen, and Loading).
 */
import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './game/Scene';
import { Menu } from './ui/Menu';
import { TrackSelect } from './ui/TrackSelect';
import { Garage } from './ui/Garage';
import { Credits } from './ui/Credits';
import { HUD } from './ui/HUD';
import { TouchControls } from './ui/TouchControls';
import { FinishScreen } from './ui/FinishScreen';
import { Loading } from './ui/Loading';
import { loadManifest, loadCredits } from './assets/manifest';
import { preloadCarModels } from './assets/useCarModel';
import { useGameStore } from './store/gameStore';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const setManifestAndCredits = useGameStore((s) => s.setManifestAndCredits);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadManifest(), loadCredits()]).then(([manifest, credits]) => {
      if (!mounted) return;
      setManifestAndCredits(manifest, credits);
      preloadCarModels(manifest.cars || []);
    });
    return () => {
      mounted = false;
    };
  }, [setManifestAndCredits]);

  return (
    <div className="app-root">
      <div className="canvas-layer">
        <Suspense fallback={null}>
          <Canvas
            dpr={1}
            camera={{ position: [0, 6, -12], fov: 60, near: 0.5, far: 350 }}
            gl={{ powerPreference: 'high-performance', antialias: true, stencil: false }}
          >
            <Scene />
          </Canvas>
        </Suspense>
      </div>

      <Loading />

      {screen === 'menu' && <Menu />}
      {screen === 'tracks' && <TrackSelect />}
      {screen === 'garage' && <Garage />}
      {screen === 'credits' && <Credits />}
      {screen === 'racing' && (
        <>
          <HUD />
          <TouchControls />
        </>
      )}
      {screen === 'finished' && <FinishScreen />}
    </div>
  );
}
