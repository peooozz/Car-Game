/**
 * src/game/Environment.jsx
 * Vibrant, realistic cartoonish environment inspired by the reference town:
 * - On Track 0 (Toon Town Speedway): Mounts full 3D Cartoon Town (Clock Tower,
 *   Blue Skyscraper, Burger Diner, Pizza Palace, Donut Bakery, Mushroom Cottages,
 *   Gumdrop Trees, Street Lamps, Picket Fences, and Horizon Cloud Ring)
 * - On themed tracks: Mounts stylized cartoon island / ocean / desert environment
 */
import React from 'react';
import { TRACKS } from '../config';
import { useGameStore } from '../store/gameStore';
import { CartoonTownEnvironment } from './CartoonTown';

export function Environment() {
  const selectedTrackIndex = useGameStore((s) => s.selectedTrackIndex);
  const track = TRACKS[selectedTrackIndex] || TRACKS[0];

  if (selectedTrackIndex === 0) {
    return <CartoonTownEnvironment />;
  }

  return (
    <group name="EnvironmentGroup">
      {/* Crisp Atmospheric Fog */}
      <fog attach="fog" args={[track.fogColor || '#bfe7ff', 80, 360]} />

      {/* Smooth Ground Island Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[420, 36]} />
        <meshStandardMaterial
          color={track.sandColor || '#d6c8a5'}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>

      {/* Foam Shore Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <ringGeometry args={[415, 435, 36]} />
        <meshBasicMaterial color={track.foamColor || '#ffffff'} transparent opacity={0.65} />
      </mesh>

      {/* Static Stylized Ocean Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <planeGeometry args={[950, 950]} />
        <meshStandardMaterial
          color={track.waterColor || '#0084c7'}
          roughness={0.25}
          metalness={0.12}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}
