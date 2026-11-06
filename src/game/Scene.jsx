/**
 * src/game/Scene.jsx
 * High-performance 3D scene:
 * - Clean lighting (ambient + directional without expensive shadow map passes)
 * - Environment, Track, MathZone, PlayerCar, RivalCars, Weapons, Particles
 * - Runs useControls + useRaceLoop
 */
import React from 'react';
import { Environment } from './Environment';
import { Track } from './Track';
import { MathZone } from './MathZone';
import { PlayerCar } from './PlayerCar';
import { RivalCar } from './RivalCar';
import { Weapons } from './Weapons';
import { Particles } from './Particles';
import { ChaseCamera } from './ChaseCamera';
import { useControls } from './useControls';
import { useRaceLoop } from './useRaceLoop';
import { GAME_CONFIG } from '../config';

export function Scene() {
  useControls();
  useRaceLoop();

  return (
    <group name="MathBuggyRushScene">
      {/* Rich Cartoon Sky Blue Clear Color */}
      <color attach="background" args={['#2ba8f5']} />

      {/* Vibrant, warm cartoon lighting (sunny sky + grass bounce) */}
      <ambientLight intensity={0.65} color="#fffbeb" />
      <hemisphereLight args={['#38bdf8', '#52b724', 0.6]} />
      <directionalLight position={[50, 70, 40]} intensity={1.3} color="#fffbeb" />

      <ChaseCamera />
      <Environment />
      <Track />
      <MathZone />

      {/* Player + 5 AI Rivals */}
      <PlayerCar />
      {Array.from({ length: GAME_CONFIG.totalCars - 1 }).map((_, idx) => (
        <RivalCar key={`rival_${idx + 1}`} carIndex={idx + 1} />
      ))}

      {/* Pooled Projectiles & Particles */}
      <Weapons />
      <Particles />
    </group>
  );
}
