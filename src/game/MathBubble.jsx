/**
 * src/game/MathBubble.jsx
 * Renders a floating, iridescent translucent 3D bubble with a glowing '?' sign.
 * Bobs smoothly in the air with wave motion and rotating question mark.
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function createQuestionMarkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Clear
  ctx.clearRect(0, 0, 256, 256);

  // Outer glow circle
  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
  grad.addColorStop(0, 'rgba(255, 230, 0, 0.95)');
  grad.addColorStop(0.6, 'rgba(255, 140, 0, 0.8)');
  grad.addColorStop(1, 'rgba(255, 60, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();

  // Bold question mark
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 14;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 148px "Baloo 2", "Fredoka", sans-serif';
  ctx.strokeText('?', 128, 134);
  ctx.fillText('?', 128, 134);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let cachedQTex = null;

export function MathBubble({ position, rotationY, isHit, isRetry = false }) {
  const bubbleRef = useRef();
  const innerSignRef = useRef();
  const ringRef = useRef();

  const qTexture = useMemo(() => {
    if (!cachedQTex) cachedQTex = createQuestionMarkTexture();
    return cachedQTex;
  }, []);

  useFrame(({ clock }) => {
    if (!bubbleRef.current || isHit) return;
    const t = clock.getElapsedTime();

    // Floating bob
    const yOffset = 1.35 + Math.sin(t * 3.2 + position[0]) * 0.22;
    bubbleRef.current.position.y = yOffset;

    // Gentle spin on inner question mark sign
    if (innerSignRef.current) {
      innerSignRef.current.rotation.y = rotationY + t * 2.2;
    }

    // Pulsing aura ring
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.5;
      const s = 1.0 + Math.sin(t * 4.0) * 0.08;
      ringRef.current.scale.set(s, s, s);
    }
  });

  if (isHit) return null;

  return (
    <group position={[position[0], 0, position[2]]}>
      <group ref={bubbleRef} position={[0, 1.35, 0]}>
        {/* Outer Iridescent Glass Bubble (Fast forward-pass standard material, 0 transmission overhead) */}
        <mesh>
          <sphereGeometry args={[1.7, 16, 16]} />
          <meshStandardMaterial
            color={isRetry ? '#ff9f1c' : '#38f8ff'}
            emissive={isRetry ? '#ff5400' : '#00b4d8'}
            emissiveIntensity={0.65}
            transparent
            opacity={0.58}
            roughness={0.12}
            metalness={0.15}
          />
        </mesh>

        {/* Glowing Double-Sided Question Mark Disc */}
        <group ref={innerSignRef} rotation={[0, rotationY, 0]}>
          <mesh>
            <planeGeometry args={[1.7, 1.7]} />
            <meshBasicMaterial
              map={qTexture}
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Orbiting Ring Halo */}
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.9, 0.05, 6, 24]} />
          <meshBasicMaterial
            color={isRetry ? '#ffb703' : '#a0f0ff'}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    </group>
  );
}

