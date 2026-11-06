/**
 * src/game/Car.jsx
 * Shared R3F Car visual component used by both PlayerCar and RivalCar.
 * Reads mutable car state from `raceRuntime.cars[carIndex]` inside `useFrame`:
 * - World position with air launch and kerb rumble vibration
 * - Authentic 3-axis chassis rotation (yaw, drift roll tilt, acceleration pitch squat & braking dive)
 * - Wheel rotation scaled to speed (angular velocity = v / r) & front wheel steering
 * - Bubble shield visual when shieldTimer > 0
 * - F2 debug bounding box, forward arrow, and wheel pivot markers
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCarModel } from '../assets/useCarModel';
import { raceRuntime, useGameStore } from '../store/gameStore';

export function Car({ carIndex }) {
  const groupRef = useRef();
  const bodyPitchRef = useRef();
  const bodyTiltRef = useRef();
  const shieldMeshRef = useRef();

  const debugMode = useGameStore((s) => s.debugMode);
  const carState = raceRuntime.cars[carIndex];
  const manifestEntry = carState?.manifestEntry;
  const overrideColor = carState?.color;

  const { root, wheelPivots, size } = useCarModel(manifestEntry, overrideColor);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const c = raceRuntime.cars[carIndex];
    if (!c || !groupRef.current) return;

    // World position + airtime + dynamic suspension heave & kerb rumble
    const heaveY = (c.suspensionY || 0) + (c.curbRumble || 0);
    const yPos = c.worldPos.y + c.airY + heaveY;
    groupRef.current.position.set(c.worldPos.x, yPos, c.worldPos.z);
    groupRef.current.rotation.set(0, c.yaw + c.spinAngle + (c.driftAngle || 0), 0);

    // Chassis Weight Transfer: Pitch (squat on accel, dive on brake) & Roll (centrifugal tilt)
    if (bodyPitchRef.current) {
      bodyPitchRef.current.rotation.x = c.pitchAngle || (c.velY * -0.016);
    }

    if (bodyTiltRef.current) {
      bodyTiltRef.current.rotation.z = c.tiltAngle || 0;
      if (wheelPivots.length === 0 && c.speed > 1) {
        // High-frequency subtle tire compliance bounce for models with integrated wheels
        bodyTiltRef.current.position.y = Math.abs(Math.sin(clock.getElapsedTime() * 18)) * 0.025;
      } else {
        bodyTiltRef.current.position.y = 0;
      }
    }

    // Spin wheels according to physical angular velocity (omega = v / r, r ~ 0.36m)
    const wheelSpinDelta = (c.speed / 0.36) * dt;
    // Dynamic Ackermann steering with drift counter-steer
    const driftCounter = c.isDrifting ? -(c.driftAngle || 0) * 0.65 : 0;
    const totalSteer = (c.steerAngle || 0) + driftCounter;

    for (let i = 0; i < wheelPivots.length; i++) {
      const wp = wheelPivots[i];
      if (wp.spinPivot) {
        wp.spinPivot.rotation.x += wheelSpinDelta;
      }
      if (wp.isFront && wp.steerPivot) {
        wp.steerPivot.rotation.y = totalSteer;
      }
    }

    // Shield visibility & rotation
    if (shieldMeshRef.current) {
      const hasShield = c.shieldTimer > 0;
      shieldMeshRef.current.visible = hasShield;
      if (hasShield) {
        shieldMeshRef.current.rotation.y += dt * 2.8;
      }
    }
  });

  return (
    <group ref={groupRef} name={`Car_${carIndex}`}>
      {/* Fast Ground Contact Drop Shadow (Zero shadow-pass overhead, instant 60+ FPS) */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 4.4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      <group ref={bodyPitchRef}>
        <group ref={bodyTiltRef}>
          <primitive object={root} />
        </group>
      </group>

      {/* Bubble Shield Visual */}
      <mesh ref={shieldMeshRef} position={[0, 0.9, 0]} visible={false}>
        <sphereGeometry args={[2.35, 20, 20]} />
        <meshStandardMaterial
          color="#38f8ff"
          emissive="#00b4d8"
          emissiveIntensity={0.5}
          transparent
          opacity={0.35}
          roughness={0.1}
        />
      </mesh>

      {/* F2 Debug Mode: Bounding Box, Forward Arrow (+Z), and Wheel Pivot Spheres */}
      {debugMode && (
        <group name="CarDebugOverlay">
          <mesh position={[0, size.y * 0.5, 0]}>
            <boxGeometry args={[size.x, size.y, size.z]} />
            <meshBasicMaterial color="#00ff66" wireframe />
          </mesh>
          <mesh position={[0, 1.2, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.28, 0.9, 8]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
          {wheelPivots.map((wp, i) => (
            <mesh key={`wp_${i}`} position={wp.steerPivot.position}>
              <sphereGeometry args={[0.22, 8, 8]} />
              <meshBasicMaterial color="#ff0055" wireframe />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
