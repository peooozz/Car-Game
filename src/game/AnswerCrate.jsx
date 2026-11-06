/**
 * src/game/AnswerCrate.jsx
 * Renders an individual wooden/neon answer crate with a high-contrast CanvasTexture
 * number sign on front and back, plus optional rare Shield crate.
 * Caches CanvasTextures by label string and disposes cleanly.
 */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const labelTextureCache = new Map();

function getCrateTexture(label, isShield = false) {
  const key = `${isShield ? 'SHIELD_' : 'NUM_'}${label}`;
  if (labelTextureCache.has(key)) {
    return labelTextureCache.get(key);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Vibrant crate face background
  ctx.fillStyle = isShield ? '#00b4d8' : '#fef08a';
  ctx.fillRect(0, 0, 256, 256);

  // Outer wood/metallic frame border
  ctx.lineWidth = 22;
  ctx.strokeStyle = isShield ? '#38f8ff' : '#d97706';
  ctx.strokeRect(11, 11, 234, 234);

  // Inner dark contrast border
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(26, 26, 204, 204);

  // Number or Shield Icon text
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textStr = String(label);
  const fontSize = textStr.length > 3 ? 78 : 104;
  ctx.font = `800 ${fontSize}px "Baloo 2", "Fredoka", sans-serif`;
  ctx.fillText(textStr, 128, 134);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  labelTextureCache.set(key, tex);
  return tex;
}

export function AnswerCrate({ position, rotationY, label, isBroken, isShield = false, isRetry = false }) {
  const meshRef = useRef();
  const texture = useMemo(() => getCrateTexture(label, isShield), [label, isShield]);

  useFrame(({ clock }) => {
    if (!meshRef.current || isBroken) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.y = 1.15 + Math.sin(t * 3.5 + position[0]) * 0.12;
    if (isShield) {
      meshRef.current.rotation.y = rotationY + t * 1.8;
    }
  });

  if (isBroken) return null;

  return (
    <group position={[position[0], 0, position[2]]} rotation={[0, rotationY, 0]}>
      <mesh ref={meshRef} position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.95, 1.95, 1.95]} />
        <meshStandardMaterial
          map={texture}
          color={isRetry ? '#ffd6a5' : '#ffffff'}
          roughness={0.35}
          metalness={0.08}
        />
      </mesh>
    </group>
  );
}
