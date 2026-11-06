/**
 * src/game/MathZone.jsx
 * Renders the floating '?' Math Bubbles across the track spline.
 * When the player hits a bubble, it pops and triggers the MCQ popup!
 */
import React, { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACKS } from '../config';
import { raceRuntime, useGameStore } from '../store/gameStore';
import { MathBubble } from './MathBubble';

export function MathZone() {
  const selectedTrackIndex = useGameStore((s) => s.selectedTrackIndex);
  const track = TRACKS[selectedTrackIndex] || TRACKS[0];
  const halfWidth = track.trackWidth * 0.5;

  const [, setTick] = useState(0);

  useFrame(() => {
    if (raceRuntime.zonesDirty) {
      raceRuntime.zonesDirty = false;
      setTick((t) => (t + 1) % 1000);
    }
  });

  const curve = raceRuntime.curve;
  if (!curve || !raceRuntime.zones || raceRuntime.zones.length === 0) return null;

  const renderGate = (gate, isRetry = false) => {
    const pt = curve.getPointAt(gate.t % 1.0);
    const tan = curve.getTangentAt(gate.t % 1.0).normalize();
    const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const yaw = Math.atan2(tan.x, tan.z);

    const leftPt = pt.clone().addScaledVector(right, -halfWidth * 0.52);
    const rightPt = pt.clone().addScaledVector(right, halfWidth * 0.52);

    return (
      <group key={gate.id}>
        {/* Glowing Gate Overhead Arch Pillars & Hologram Beam */}
        <group position={[pt.x, pt.y + 0.05, pt.z]} rotation={[0, yaw, 0]}>
          {/* Left Arch Pillar */}
          <mesh position={[-halfWidth - 0.5, 3.6, 0]}>
            <cylinderGeometry args={[0.35, 0.48, 7.2, 10]} />
            <meshStandardMaterial
              color={isRetry ? '#ff9f1c' : '#00e1ff'}
              emissive={isRetry ? '#ff5400' : '#0077b6'}
              emissiveIntensity={0.65}
            />
          </mesh>
          {/* Right Arch Pillar */}
          <mesh position={[halfWidth + 0.5, 3.6, 0]}>
            <cylinderGeometry args={[0.35, 0.48, 7.2, 10]} />
            <meshStandardMaterial
              color={isRetry ? '#ff9f1c' : '#00e1ff'}
              emissive={isRetry ? '#ff5400' : '#0077b6'}
              emissiveIntensity={0.65}
            />
          </mesh>

          {/* Overhead Glowing Hologram Cross-Beam */}
          <mesh position={[0, 7.1, 0]}>
            <boxGeometry args={[track.trackWidth + 1.5, 0.45, 0.45]} />
            <meshStandardMaterial
              color={isRetry ? '#ff9f1c' : '#38f8ff'}
              emissive={isRetry ? '#ff5400' : '#00b4d8'}
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Glowing Ground Hologram Strip across road */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <planeGeometry args={[track.trackWidth + 1.0, 2.4]} />
            <meshBasicMaterial
              color={isRetry ? '#ff9f1c' : '#38f8ff'}
              transparent
              opacity={0.45}
            />
          </mesh>
        </group>

        {/* Center Floating '?' Math Bubble */}
        <MathBubble
          position={[pt.x, pt.y, pt.z]}
          rotationY={yaw}
          isHit={gate.resolved}
          isRetry={isRetry}
        />

        {/* Flanking Left & Right '?' Math Bubbles across lanes */}
        <MathBubble
          position={[leftPt.x, leftPt.y, leftPt.z]}
          rotationY={yaw}
          isHit={gate.resolved}
          isRetry={isRetry}
        />
        <MathBubble
          position={[rightPt.x, rightPt.y, rightPt.z]}
          rotationY={yaw}
          isHit={gate.resolved}
          isRetry={isRetry}
        />
      </group>
    );
  };

  return (
    <group name="MathZonesGroup">
      {raceRuntime.zones.map((gate) => renderGate(gate, false))}
      {raceRuntime.retryGate && renderGate(raceRuntime.retryGate, true)}
    </group>
  );
}
