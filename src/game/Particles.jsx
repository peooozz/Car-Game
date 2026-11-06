/**
 * src/game/Particles.jsx
 * Pooled InstancedMesh particle system (160 particles, 1 draw call) for:
 * - Drift dust from rear wheels
 * - Off-track sand spray & water splashes
 * - Crate-break bursts
 * - Weapon hit explosions
 * Zero per-frame allocations.
 */
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { raceRuntime } from '../store/gameStore';

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export function Particles() {
  const instancedRef = useRef();
  const count = raceRuntime.particles.length;

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(0.45, 0), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.88
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const mesh = instancedRef.current;
    if (!mesh) return;

    const pool = raceRuntime.particles;
    for (let i = 0; i < count; i++) {
      const p = pool[i];
      if (!p.active) {
        _dummy.position.set(0, -100, 0);
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        _dummy.position.set(0, -100, 0);
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      p.vy -= 14.0 * dt;
      p.x += p.vx * dt;
      p.y = Math.max(0.08, p.y + p.vy * dt);
      p.z += p.vz * dt;

      const progress = p.life / p.maxLife;
      const scale = p.size * (1.0 - progress * 0.75);

      _dummy.position.set(p.x, p.y, p.z);
      _dummy.rotation.set(p.life * 5, p.life * 7, 0);
      _dummy.scale.setScalar(Math.max(0.02, scale));
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      _color.set(p.color);
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instancedRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
