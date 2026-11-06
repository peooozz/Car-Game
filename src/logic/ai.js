/**
 * src/logic/ai.js
 * Rival AI behavior for 5 rival buggies:
 * - Follow the spline at base speeds 35-39 u/s with smoothly changing random lateral offsets
 * - Rubber-banding: far behind player +8% speed, far ahead -8%. If player's streak is 0, rivals get +3%.
 * - Fire a coconut at the player when within 30 units behind them (12s cooldown, random chance).
 *   Respect stun and shield.
 * - Rivals also drive through crates randomly so the track feels alive.
 */
import * as THREE from 'three';
import { GAME_CONFIG } from '../config';
import { soundEngine } from '../audio/audio';

const _toPlayer = new THREE.Vector3();

export function updateRivalAI({
  car,
  playerCar,
  playerStreak,
  dt,
  raceRuntime,
  spawnProjectile
}) {
  if (car.finished) {
    car.speed = Math.max(0, car.speed - dt * 15);
    return;
  }

  // Handle active stun
  if (car.stunTimer > 0) {
    car.stunTimer = Math.max(0, car.stunTimer - dt);
    car.speed = 0;
    car.spinAngle += dt * 14.5;
    return;
  } else {
    car.spinAngle = 0;
  }

  // Smoothly vary target lateral offset (-0.75..0.75)
  car.aiOffsetTimer -= dt;
  if (car.aiOffsetTimer <= 0) {
    car.aiOffsetTimer = 1.6 + Math.random() * 2.6;
    // Occasionally pick one of the 3 crate lanes so rivals smash through crates visually
    if (Math.random() < 0.65) {
      const lanes = GAME_CONFIG.laneOffsets;
      car.targetOffset = lanes[Math.floor(Math.random() * lanes.length)];
    } else {
      car.targetOffset = (Math.random() - 0.5) * 1.45;
    }
  }

  const offsetDiff = car.targetOffset - car.lateralOffset;
  const maxLatStep = dt * 1.15;
  if (Math.abs(offsetDiff) > 0.01) {
    car.lateralOffset += Math.sign(offsetDiff) * Math.min(Math.abs(offsetDiff), maxLatStep);
    car.steerAngle = THREE.MathUtils.clamp(-offsetDiff * 0.5, -0.35, 0.35);
    car.tiltAngle = THREE.MathUtils.lerp(car.tiltAngle, offsetDiff * 0.12, dt * 6);
  } else {
    car.steerAngle = THREE.MathUtils.lerp(car.steerAngle, 0, dt * 6);
    car.tiltAngle = THREE.MathUtils.lerp(car.tiltAngle, 0, dt * 6);
  }

  // Calculate rubber-banding multiplier relative to player
  let speedMult = 1.0;
  const progressDeltaDist = (car.totalProgress - playerCar.totalProgress) * raceRuntime.trackLength;

  if (progressDeltaDist < -GAME_CONFIG.ai.rubberBandThresholdDist) {
    // Rival is far behind player -> +8% speed
    speedMult += GAME_CONFIG.ai.rubberBandBehindBoost;
  } else if (progressDeltaDist > GAME_CONFIG.ai.rubberBandThresholdDist) {
    // Rival is far ahead of player -> -8% speed
    speedMult += GAME_CONFIG.ai.rubberBandAheadSlow;
  }

  // If player's streak is 0, rivals get +3% speed
  if (playerStreak === 0) {
    speedMult += GAME_CONFIG.ai.zeroStreakRivalBonus;
  }

  const targetMaxSpeed = car.maxSpeed * speedMult;
  if (car.speed < targetMaxSpeed) {
    car.speed = Math.min(targetMaxSpeed, car.speed + car.acceleration * dt);
  } else {
    car.speed = Math.max(targetMaxSpeed, car.speed - 14 * dt);
  }

  // Fire a coconut at the player when within 30 units behind them (12s cooldown, random chance)
  car.fireCooldown = Math.max(0, car.fireCooldown - dt);
  if (
    car.fireCooldown <= 0 &&
    playerCar.stunTimer <= 0 &&
    progressDeltaDist < -3.5 &&
    progressDeltaDist > -GAME_CONFIG.ai.fireRange
  ) {
    if (Math.random() < GAME_CONFIG.ai.fireChancePerSec * dt) {
      car.fireCooldown = GAME_CONFIG.ai.fireCooldown;
      _toPlayer.subVectors(playerCar.worldPos, car.worldPos).normalize();
      const aimYaw = Math.atan2(_toPlayer.x, _toPlayer.z);
      spawnProjectile({
        type: 'coconut',
        ownerIndex: car.index,
        x: car.worldPos.x + Math.sin(aimYaw) * 2.2,
        z: car.worldPos.z + Math.cos(aimYaw) * 2.2,
        yaw: aimYaw
      });
      soundEngine.playWeaponFire('coconut');
    }
  }
}
