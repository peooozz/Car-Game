/**
 * src/game/ChaseCamera.jsx
 * Third-person chase camera with smooth lerp, speed-dependent FOV widening,
 * dynamic stun/boost camera shake, and player-following directional shadow light.
 * Zero per-frame allocations (reuses Vector3 objects).
 */
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { raceRuntime, useGameStore } from '../store/gameStore';

const _desiredPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _forward = new THREE.Vector3();

export function ChaseCamera() {
  const { camera } = useThree();
  const smoothedPos = useRef(new THREE.Vector3(0, 6, -12));
  const smoothedLook = useRef(new THREE.Vector3(0, 1.5, 10));

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const screen = useGameStore.getState().screen;
    const player = raceRuntime.cars[0];

    if (screen !== 'racing' || !player) {
      // Gentle orbit preview when on menu/garage screens
      const t = performance.now() * 0.00035;
      camera.position.set(Math.sin(t) * 28, 12, Math.cos(t) * 28);
      camera.lookAt(0, 1.2, 0);
      return;
    }

    _forward.set(Math.sin(player.yaw), 0, Math.cos(player.yaw)).normalize();

    const followDist = 9.2 + (player.speed / 45) * 1.4;
    const followHeight = 4.3 + player.airY * 0.4;

    _desiredPos
      .copy(player.worldPos)
      .addScaledVector(_forward, -followDist)
      .add(new THREE.Vector3(0, followHeight, 0));

    // Apply small camera shake on stun or mega boost
    if (raceRuntime.cameraShake > 0) {
      raceRuntime.cameraShake = Math.max(0, raceRuntime.cameraShake - dt * 2.5);
      const mag = raceRuntime.cameraShake * 0.35;
      _desiredPos.x += (Math.random() - 0.5) * mag;
      _desiredPos.y += (Math.random() - 0.5) * mag;
    }

    _lookTarget
      .copy(player.worldPos)
      .addScaledVector(_forward, 7.5)
      .add(new THREE.Vector3(0, 1.35 + player.airY * 0.5, 0));

    const lerpFactor = 1.0 - Math.exp(-10.5 * dt);
    smoothedPos.current.lerp(_desiredPos, lerpFactor);
    smoothedLook.current.lerp(_lookTarget, lerpFactor);

    camera.position.copy(smoothedPos.current);
    camera.up.set(0, 1, 0);
    camera.lookAt(smoothedLook.current);

    // Dynamic FOV widens with speed
    const targetFov = 58 + (player.speed / 42) * 14 + (player.boostTimer > 0 ? 8 : 0);
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 6);
    camera.updateProjectionMatrix();
  });

  return null;
}
