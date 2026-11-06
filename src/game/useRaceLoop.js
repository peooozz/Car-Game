/**
 * src/game/useRaceLoop.js
 * Core arcade simulation loop running inside `useFrame`:
 * - Countdown 3-2-1-GO (cars locked until GO)
 * - Accurate vehicle physics: progressive engine torque, aerodynamic drag, rolling resistance,
 *   lateral tire grip, dynamic drift power-sliding with 2-tier mini-turbo boost,
 *   chassis weight transfer (pitch & roll), and authentic car-to-car collision resolution
 * - Math Zone entry banner trigger (~60 units ahead), crate collision mapped to the
 *   3 lanes, 2-try answering flow, and rival crate smashing
 * - Weapon firing, projectile motion (Coconut, Homing Rocket, Shockwave, Mega Crab Claw)
 * - Lap counting and flicker-free position sorting across all 6 cars
 * - Throttled HUD updates (~10 Hz)
 */
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONFIG, TRACKS } from '../config';
import { raceRuntime, useGameStore } from '../store/gameStore';
import { generateQuestion } from '../logic/questions';
import { updateRivalAI } from '../logic/ai';
import { soundEngine } from '../audio/audio';

const _pt = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _right = new THREE.Vector3();
const _burstPos = new THREE.Vector3();
const _nextTan = new THREE.Vector3();

function spawnProjectile({ type, ownerIndex, x, z, yaw }) {
  const pool = raceRuntime.projectiles;
  const cfg = GAME_CONFIG.weapons[type] || GAME_CONFIG.weapons.coconut;
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (!p.active) {
      p.active = true;
      p.type = type;
      p.ownerIndex = ownerIndex;
      p.x = x;
      p.y = type === 'shockwave' ? 0.35 : 0.85;
      p.z = z;
      p.yaw = yaw;
      const spd = cfg.speed || 0;
      p.vx = Math.sin(yaw) * spd;
      p.vz = Math.cos(yaw) * spd;
      p.radius = type === 'shockwave' ? 1.0 : cfg.hitRadius || 2.2;
      p.age = 0;
      p.maxAge = cfg.lifetime || 3.0;
      p.stunDuration = cfg.stunDuration || 1.5;
      p.hitSet.clear();
      return p;
    }
  }
  return null;
}

function buildLapZones(trackConfig, lapNumber) {
  const zones = [];
  const count = GAME_CONFIG.zonesPerLap;
  const tiers = ['easy', 'medium', 'hard'];

  for (let i = 0; i < count; i++) {
    // 4 Checkpoints spaced 2x further apart (~275m between each bubble)
    const t = 0.12 + (i / count) * 0.76;
    const tier = tiers[(i + lapNumber - 1) % tiers.length];
    const question = generateQuestion(trackConfig.topicId, tier);
    const hasShield = Math.random() < GAME_CONFIG.shieldChance;

    zones.push({
      id: `zone_lap${lapNumber}_${i}`,
      index: i,
      t,
      question,
      bannerShown: false,
      resolved: false,
      brokenLanes: [false, false, false],
      shieldLane: hasShield ? (Math.random() < 0.5 ? -0.92 : 0.92) : -1,
      shieldBroken: false
    });
  }
  raceRuntime.zones = zones;
  raceRuntime.zonesDirty = true;
}

export function useRaceLoop() {
  const countdownTimerRef = useRef(0);
  const lastCountdownIntRef = useRef(4);

  const screen = useGameStore((s) => s.screen);
  const selectedTrackIndex = useGameStore((s) => s.selectedTrackIndex);

  // Initialize Math Zones whenever a race starts
  useEffect(() => {
    if (screen === 'racing') {
      const track = TRACKS[selectedTrackIndex] || TRACKS[0];
      buildLapZones(track, 1);
      countdownTimerRef.current = 3.6;
      lastCountdownIntRef.current = 4;
    }
  }, [screen, selectedTrackIndex]);

  useFrame((_, rawDelta) => {
    const store = useGameStore;
    const state = store.getState();

    if (state.screen !== 'racing' || state.paused || !raceRuntime.active) {
      soundEngine.updateEngineHum(0);
      return;
    }

    const dt = Math.min(rawDelta, 0.05);
    const track = TRACKS[raceRuntime.trackIndex] || TRACKS[0];
    const curve = raceRuntime.curve;
    const trackLength = raceRuntime.trackLength;
    const halfWidth = track.trackWidth * 0.5;

    if (!curve || raceRuntime.cars.length === 0) return;

    // 1. Handle 3-2-1-GO Countdown
    if (countdownTimerRef.current > 0) {
      countdownTimerRef.current -= dt;
      const ceilVal = Math.ceil(countdownTimerRef.current - 0.6);

      if (ceilVal !== lastCountdownIntRef.current) {
        lastCountdownIntRef.current = ceilVal;
        if (ceilVal >= 1 && ceilVal <= 3) {
          store.setState({ countdown: ceilVal });
          soundEngine.playCountdownBeep(false);
        } else if (ceilVal === 0) {
          store.setState({ countdown: 0 });
          soundEngine.playCountdownBeep(true);
        } else if (ceilVal < 0) {
          store.setState({ countdown: -1 });
        }
      }

      // Update world transforms of stationary cars on grid during countdown
      for (let i = 0; i < raceRuntime.cars.length; i++) {
        const c = raceRuntime.cars[i];
        const normT = ((c.t % 1.0) + 1.0) % 1.0;
        curve.getPointAt(normT, _pt);
        curve.getTangentAt(normT, _tan).normalize();
        _right.set(-_tan.z, 0, _tan.x).normalize();
        c.worldPos.copy(_pt).addScaledVector(_right, c.lateralOffset * halfWidth);
        c.yaw = Math.atan2(_tan.x, _tan.z);
      }

      if (countdownTimerRef.current > 0.6) {
        return;
      }
    } else if (state.countdown !== -1) {
      store.setState({ countdown: -1 });
    }

    raceRuntime.raceElapsed += dt;
    const player = raceRuntime.cars[0];
    const ctrl = raceRuntime.controls;

    // 2. Update Player Car Physics & Controls
    if (player) {
      if (player.shieldTimer > 0) {
        player.shieldTimer = Math.max(0, player.shieldTimer - dt);
      }
      if (player.slowTimer > 0) {
        player.slowTimer = Math.max(0, player.slowTimer - dt);
      }
      if (player.boostTimer > 0) {
        player.boostTimer = Math.max(0, player.boostTimer - dt);
      }

      if (player.stunTimer > 0) {
        player.stunTimer = Math.max(0, player.stunTimer - dt);
        player.speed = Math.max(0, player.speed - 35 * dt);
        player.spinAngle += dt * 15.0;
        player.pitchAngle = THREE.MathUtils.lerp(player.pitchAngle, 0, dt * 8);
        player.tiltAngle = THREE.MathUtils.lerp(player.tiltAngle, 0, dt * 8);
      } else {
        player.spinAngle = 0;

        // Effective max speed with power-ups and debuffs
        let effectiveMaxSpeed = player.maxSpeed;
        const isOffTrack = Math.abs(player.lateralOffset) > 1.05;
        const isOnKerb = Math.abs(player.lateralOffset) > 0.85 && !isOffTrack;

        if (isOffTrack) {
          effectiveMaxSpeed *= GAME_CONFIG.driving.offTrackMaxSpeedFactor;
          if (player.speed > 8 && Math.random() < 0.5) {
            raceRuntime.spawnParticleBurst(player.worldPos, track.sandColor, 2, 0.45, 'dust');
          }
        }
        if (player.slowTimer > 0) {
          effectiveMaxSpeed *= GAME_CONFIG.driving.wrongAnswerSlowFactor;
        }
        if (player.boostTimer > 0) {
          const boostMult = player.boostKind === 'super'
            ? GAME_CONFIG.driving.superTurboBoost
            : player.boostKind === 'mini'
              ? GAME_CONFIG.driving.miniTurboBoost
              : GAME_CONFIG.driving.megaBoostMultiplier;
          effectiveMaxSpeed *= boostMult;

          if (Math.random() < 0.6) {
            const flameColor = player.boostKind === 'super' ? '#ff7300' : '#00e1ff';
            raceRuntime.spawnParticleBurst(player.worldPos, flameColor, 2, 0.6, 'burst');
          }
        }

        // Lava hazards on Track 4
        if (track.hasLava && track.lavaPatches?.length) {
          for (let l = 0; l < track.lavaPatches.length; l++) {
            const lp = track.lavaPatches[l];
            let dtSpline = Math.abs(player.t - lp.t);
            if (dtSpline > 0.5) dtSpline = 1.0 - dtSpline;
            const distAlong = dtSpline * trackLength;
            const distLat = Math.abs(player.lateralOffset - lp.offset) * halfWidth;
            if (distAlong < lp.radius && distLat < lp.radius) {
              effectiveMaxSpeed *= GAME_CONFIG.driving.lavaSlowFactor;
              if (Math.random() < 0.35) {
                raceRuntime.spawnParticleBurst(player.worldPos, '#ff4d00', 2, 0.55, 'burst');
              }
              break;
            }
          }
        }

        // Physics: Aerodynamic Drag & Rolling Resistance
        const dragForce = GAME_CONFIG.driving.aerodynamicDragCoeff * player.speed * player.speed;
        const rollingResistance = isOffTrack ? GAME_CONFIG.driving.offTrackDrag : GAME_CONFIG.driving.rollingResistance;

        // Auto-Forward: vehicle cruises forward automatically; player steers with A/D or Left/Right
        const wantsBrake = ctrl.brake;
        const wantsSprint = ctrl.accelerate;
        const targetAutoSpeed = wantsSprint
          ? effectiveMaxSpeed
          : Math.min(GAME_CONFIG.driving.autoCruiseSpeed, effectiveMaxSpeed);

        if (wantsBrake) {
          const brakeForce = GAME_CONFIG.driving.braking + dragForce;
          player.speed = Math.max(0, player.speed - brakeForce * dt);
          player.pitchAngle = THREE.MathUtils.lerp(player.pitchAngle, 0.035, dt * 10);
        } else {
          // Automatic forward acceleration up to cruising speed (or sprint/boost)
          const currentLimit = player.boostTimer > 0 ? effectiveMaxSpeed : targetAutoSpeed;
          if (player.speed < currentLimit) {
            const speedRatio = Math.min(1.0, player.speed / currentLimit);
            const torqueFactor = Math.max(0.3, 1.0 - 0.65 * Math.pow(speedRatio, 1.6));
            const netAccel = player.acceleration * torqueFactor;
            player.speed = Math.min(currentLimit, player.speed + netAccel * dt);
            player.pitchAngle = THREE.MathUtils.lerp(player.pitchAngle, -0.02 * torqueFactor, dt * 7);
          } else if (player.speed > currentLimit && player.boostTimer <= 0) {
            player.speed = Math.max(currentLimit, player.speed - (GAME_CONFIG.driving.naturalDecel + dragForce) * dt);
            player.pitchAngle = THREE.MathUtils.lerp(player.pitchAngle, 0, dt * 6);
          } else {
            player.pitchAngle = THREE.MathUtils.lerp(player.pitchAngle, 0, dt * 6);
          }
        }

        // Steering, Dynamic Lateral Momentum & Authentic Drifting
        const steerInput = (ctrl.left ? -1 : 0) + (ctrl.right ? 1 : 0);
        const canDrift = (ctrl.drift || Math.abs(steerInput) > 0.9) && player.speed > 13 && steerInput !== 0;

        if (ctrl.drift && canDrift) {
          player.isDrifting = true;
          player.driftCharge = (player.driftCharge || 0) + dt * GAME_CONFIG.driving.driftChargeRate;
          soundEngine.playDriftScreech();

          // True Drift Angle (kicks rear out sideways into the turn)
          const targetDriftAngle = -steerInput * 0.42;
          player.driftAngle = THREE.MathUtils.lerp(player.driftAngle || 0, targetDriftAngle, dt * 11);

          // Multi-Tier Drift Sparks
          const isSuperCharged = player.driftCharge >= GAME_CONFIG.driving.superTurboThreshold;
          const isMiniCharged = player.driftCharge >= GAME_CONFIG.driving.miniTurboThreshold;
          const sparkColor = isSuperCharged ? '#ff4500' : isMiniCharged ? '#00e1ff' : '#ffd000';

          if (Math.random() < 0.8) {
            raceRuntime.spawnParticleBurst(player.worldPos, sparkColor, 2, 0.65, 'burst');
          }
        } else {
          // Trigger Turbo Boost upon releasing a charged drift
          if (player.isDrifting && player.driftCharge >= GAME_CONFIG.driving.miniTurboThreshold) {
            const isSuper = player.driftCharge >= GAME_CONFIG.driving.superTurboThreshold;
            player.boostTimer = isSuper ? GAME_CONFIG.driving.superTurboDuration : GAME_CONFIG.driving.miniTurboDuration;
            player.boostKind = isSuper ? 'super' : 'mini';
            player.speed = Math.max(player.speed, isSuper ? 36.5 : 33.0);
            soundEngine.playTurboBoost();
            raceRuntime.spawnParticleBurst(player.worldPos, isSuper ? '#ff6d00' : '#00e1ff', 18, 1.3, 'burst');
            store.getState().showFeedback(
              isSuper ? '🔥 SUPER MINI-TURBO!' : '⚡ MINI-TURBO BOOST!',
              'correct',
              1300
            );
          }
          player.isDrifting = false;
          player.driftCharge = 0;
          player.driftAngle = THREE.MathUtils.lerp(player.driftAngle || 0, 0, dt * 12);
        }

        // Calculate centripetal curve pulling (centrifugal G-force in corners)
        curve.getTangentAt((player.t + 0.003) % 1.0, _nextTan).normalize();
        const curvatureCrossY = _tan.x * _nextTan.z - _tan.z * _nextTan.x;
        const centrifugalBias = curvatureCrossY * (player.speed / 40) * 1.5;

        // Fluid Lateral Velocity & Responsive Inertia across wide multi-lane road
        const agility = 0.65 + 0.35 * Math.min(1.0, player.speed / 28);
        const lateralMoveSpeedMeters =
          player.handling *
          (player.isDrifting ? GAME_CONFIG.driving.driftSteerMultiplier : 1.0) *
          (isOffTrack ? 0.72 : 1.0) *
          2.6;

        const targetLatVel = (steerInput * lateralMoveSpeedMeters * agility) / halfWidth;
        const steerResponse = steerInput !== 0 ? 18.0 : 12.0;
        player.lateralVel = THREE.MathUtils.lerp(player.lateralVel || 0, targetLatVel, dt * steerResponse);

        player.lateralOffset = THREE.MathUtils.clamp(
          player.lateralOffset + (player.lateralVel - centrifugalBias * 0.28) * dt,
          -1.35,
          1.35
        );

        // Smooth visual steer (front tires turn naturally with steering direction) & roll tilt
        player.steerAngle = THREE.MathUtils.lerp(player.steerAngle || 0, steerInput * 0.44, dt * 14);
        const targetRoll = player.isDrifting
          ? steerInput * GAME_CONFIG.driving.driftTiltMax * 1.25
          : steerInput * 0.12;
        player.tiltAngle = THREE.MathUtils.lerp(player.tiltAngle || 0, targetRoll, dt * 11);

        // Dynamic Suspension Spring-Damper System
        const targetHeave = isOnKerb && player.speed > 8 ? Math.sin(raceRuntime.raceElapsed * 50) * 0.035 : 0;
        const heaveForce = (targetHeave - (player.suspensionY || 0)) * 180 - (player.suspensionVelY || 0) * 16;
        player.suspensionVelY = (player.suspensionVelY || 0) + heaveForce * dt;
        player.suspensionY = (player.suspensionY || 0) + player.suspensionVelY * dt;

        // Kerb vibration
        if (isOnKerb && player.speed > 10) {
          player.curbRumble = Math.sin(raceRuntime.raceElapsed * 48) * 0.03;
        } else {
          player.curbRumble = 0;
        }
      }

      // Fire held weapon
      if (ctrl.fire) {
        ctrl.fire = false;
        const currentWeapon = store.getState().weapon;
        if (currentWeapon && player.stunTimer <= 0) {
          spawnProjectile({
            type: currentWeapon,
            ownerIndex: 0,
            x: player.worldPos.x + Math.sin(player.yaw) * 2.3,
            z: player.worldPos.z + Math.cos(player.yaw) * 2.3,
            yaw: player.yaw
          });
          soundEngine.playWeaponFire(currentWeapon);
          store.setState({ weapon: null });
          if (currentWeapon === 'shockwave' || currentWeapon === 'megaclaw') {
            raceRuntime.cameraShake = 0.85;
          }
        }
      }

      soundEngine.updateEngineHum(player.speed);
    }

    // 3. Update AI Rivals & Advance All 6 Cars
    const currentStreak = store.getState().streak;
    for (let i = 0; i < raceRuntime.cars.length; i++) {
      const c = raceRuntime.cars[i];
      if (!c.isPlayer) {
        updateRivalAI({
          car: c,
          playerCar: player,
          playerStreak: currentStreak,
          dt,
          raceRuntime,
          spawnProjectile
        });
      }

      // Advance spline progress
      const prevT = c.t;
      const prevTotal = c.totalProgress;
      const deltaT = (c.speed * dt) / trackLength;
      c.totalProgress += deltaT;
      c.t = ((c.totalProgress % 1.0) + 1.0) % 1.0;

      // Jump ramps airtime
      if (track.hasRamps && track.ramps?.length && c.airY <= 0.01) {
        for (let r = 0; r < track.ramps.length; r++) {
          const rt = track.ramps[r];
          if (prevT < rt && c.t >= rt && Math.abs(c.lateralOffset) < 0.65 && c.speed > 18) {
            c.velY = GAME_CONFIG.driving.rampLaunchVelY;
            break;
          }
        }
      }

      if (c.airY > 0 || c.velY > 0) {
        c.airY += c.velY * dt;
        c.velY -= GAME_CONFIG.driving.gravity * dt;
        if (c.airY <= 0) {
          c.airY = 0;
          // Hydraulic suspension landing compression thud
          if (c.velY < -5) {
            c.suspensionVelY = -0.55;
            if (c.isPlayer) {
              raceRuntime.cameraShake = Math.max(raceRuntime.cameraShake, 0.3);
              raceRuntime.spawnParticleBurst(c.worldPos, '#ffffff', 8, 0.7, 'burst');
            }
          }
          c.velY = 0;
        }
      }

      // Compute world position & forward tangent
      curve.getPointAt(c.t, _pt);
      curve.getTangentAt(c.t, _tan).normalize();
      _right.set(-_tan.z, 0, _tan.x).normalize();

      c.worldPos.copy(_pt).addScaledVector(_right, c.lateralOffset * halfWidth);
      c.forward.copy(_tan);
      c.yaw = Math.atan2(_tan.x, _tan.z);

      // Lap counting (Lap 1 -> 2 -> 3 -> Finish)
      const newLap = Math.min(GAME_CONFIG.totalLaps, Math.floor(Math.max(0, c.totalProgress)) + 1);
      if (c.isPlayer) {
        if (prevTotal >= 0 && Math.floor(c.totalProgress) > Math.floor(prevTotal)) {
          if (c.totalProgress >= GAME_CONFIG.totalLaps) {
            c.finished = true;
            soundEngine.updateEngineHum(0);
            store.getState().finishRace();
            return;
          } else {
            c.lap = newLap;
            buildLapZones(track, newLap);
            store.setState({ lap: newLap, activeQuestion: null });
            raceRuntime.retryGate = null;
          }
        }
      } else if (c.totalProgress >= GAME_CONFIG.totalLaps) {
        c.finished = true;
      }

      // 4. Check Math Bubble Zone Collisions
      const checkGateCollision = (gate) => {
        if (!gate || gate.resolved) return;

        const crossed =
          (prevT <= gate.t && c.t >= gate.t && c.t - prevT < 0.25) ||
          (prevT > 0.9 && c.t < 0.1 && (gate.t >= prevT || gate.t <= c.t));

        if (!crossed) return;

        if (c.isPlayer) {
          gate.resolved = true;
          raceRuntime.zonesDirty = true;

          // Sparkling bubble pop particles!
          raceRuntime.spawnParticleBurst(c.worldPos, '#38f8ff', 24, 1.35, 'burst');
          raceRuntime.spawnParticleBurst(c.worldPos, '#ffffff', 14, 1.45, 'burst');
          soundEngine.playBubblePop();

          // Pause race and present MCQ Challenge Modal
          store.setState({
            paused: true,
            activeMCQ: gate.question
          });
        }
      };

      for (let z = 0; z < raceRuntime.zones.length; z++) {
        checkGateCollision(raceRuntime.zones[z]);
      }
    }

    // 5. Authentic Car-to-Car Bump Collisions & Impulse Response
    for (let i = 0; i < raceRuntime.cars.length; i++) {
      const carA = raceRuntime.cars[i];
      for (let j = i + 1; j < raceRuntime.cars.length; j++) {
        const carB = raceRuntime.cars[j];

        const dx = carB.worldPos.x - carA.worldPos.x;
        const dz = carB.worldPos.z - carA.worldPos.z;
        const distSq = dx * dx + dz * dz;

        // Collision radius ~2.3m (diameter ~4.6m)
        if (distSq < 5.3 && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const overlap = 2.3 - dist;

          // Push apart along lateral offset
          const latDiff = carB.lateralOffset - carA.lateralOffset;
          const pushSign = latDiff >= 0 ? 1 : -1;
          const pushAmount = (overlap / halfWidth) * 0.55;

          carA.lateralOffset = THREE.MathUtils.clamp(carA.lateralOffset - pushSign * pushAmount, -1.35, 1.35);
          carB.lateralOffset = THREE.MathUtils.clamp(carB.lateralOffset + pushSign * pushAmount, -1.35, 1.35);

          // Kinetic Chassis Bump Roll Response
          carA.tiltAngle = (carA.tiltAngle || 0) - pushSign * 0.08;
          carB.tiltAngle = (carB.tiltAngle || 0) + pushSign * 0.08;

          // Mega Ram Shield Ramming Dynamics
          const hasShieldA = (carA.shieldTimer || 0) > 0;
          const hasShieldB = (carB.shieldTimer || 0) > 0;
          if (hasShieldA && !hasShieldB) {
            carB.speed = Math.max(0, carB.speed - 12);
            carB.lateralOffset = THREE.MathUtils.clamp(carB.lateralOffset + pushSign * 0.45, -1.35, 1.35);
            carB.spinAngle = (carB.spinAngle || 0) + 3.5;
            raceRuntime.spawnParticleBurst(carB.worldPos, '#38f8ff', 16, 1.2, 'burst');
          } else if (hasShieldB && !hasShieldA) {
            carA.speed = Math.max(0, carA.speed - 12);
            carA.lateralOffset = THREE.MathUtils.clamp(carA.lateralOffset - pushSign * 0.45, -1.35, 1.35);
            carA.spinAngle = (carA.spinAngle || 0) + 3.5;
            raceRuntime.spawnParticleBurst(carA.worldPos, '#38f8ff', 16, 1.2, 'burst');
          } else {
            // Equal and opposite speed transfer
            const speedDiff = carA.speed - carB.speed;
            carA.speed -= speedDiff * 0.35;
            carB.speed += speedDiff * 0.35;
          }

          // Spark particles at contact point
          const midX = (carA.worldPos.x + carB.worldPos.x) * 0.5;
          const midZ = (carA.worldPos.z + carB.worldPos.z) * 0.5;
          _burstPos.set(midX, 0.6, midZ);
          raceRuntime.spawnParticleBurst(_burstPos, '#ffd000', 6, 0.65, 'burst');

          if (carA.isPlayer || carB.isPlayer) {
            soundEngine.playCarBump();
            raceRuntime.cameraShake = Math.max(raceRuntime.cameraShake, 0.25);
          }
        }
      }
    }

    // 6. Update Projectiles & Check Weapon Hits
    for (let i = 0; i < raceRuntime.projectiles.length; i++) {
      const p = raceRuntime.projectiles[i];
      if (!p.active) continue;

      p.age += dt;
      if (p.age >= p.maxAge) {
        p.active = false;
        continue;
      }

      if (p.type === 'shockwave') {
        const owner = raceRuntime.cars[p.ownerIndex];
        if (owner) {
          p.x = owner.worldPos.x;
          p.z = owner.worldPos.z;
        }
        p.radius += GAME_CONFIG.weapons.shockwave.expandSpeed * dt;

        for (let cIdx = 0; cIdx < raceRuntime.cars.length; cIdx++) {
          if (cIdx === p.ownerIndex || p.hitSet.has(cIdx)) continue;
          const target = raceRuntime.cars[cIdx];
          const dx = target.worldPos.x - p.x;
          const dz = target.worldPos.z - p.z;
          const dist = Math.hypot(dx, dz);
          if (dist <= Math.min(p.radius, GAME_CONFIG.weapons.shockwave.maxRadius)) {
            p.hitSet.add(cIdx);
            applyWeaponHit(target, p, store);
          }
        }
        continue;
      }

      // Homing steering for Rocket & Mega Crab Claw
      if (p.type === 'rocket' || p.type === 'megaclaw') {
        const owner = raceRuntime.cars[p.ownerIndex];
        let bestTarget = null;
        let bestDist = Infinity;

        for (let cIdx = 0; cIdx < raceRuntime.cars.length; cIdx++) {
          if (cIdx === p.ownerIndex) continue;
          const cand = raceRuntime.cars[cIdx];
          if (cand.stunTimer > 0) continue;
          const dx = cand.worldPos.x - p.x;
          const dz = cand.worldPos.z - p.z;
          const d = Math.hypot(dx, dz);
          if (d < 80 && (cand.totalProgress >= (owner?.totalProgress || 0) - 0.02)) {
            if (d < bestDist) {
              bestDist = d;
              bestTarget = cand;
            }
          }
        }

        if (bestTarget) {
          const desiredYaw = Math.atan2(bestTarget.worldPos.x - p.x, bestTarget.worldPos.z - p.z);
          let diff = desiredYaw - p.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const maxTurn = (GAME_CONFIG.weapons[p.type]?.turnRate || 2.2) * dt;
          p.yaw += Math.sign(diff) * Math.min(Math.abs(diff), maxTurn);
          const spd = GAME_CONFIG.weapons[p.type].speed;
          p.vx = Math.sin(p.yaw) * spd;
          p.vz = Math.cos(p.yaw) * spd;
        }
      }

      p.x += p.vx * dt;
      p.z += p.vz * dt;

      // Check hit against cars
      for (let cIdx = 0; cIdx < raceRuntime.cars.length; cIdx++) {
        if (cIdx === p.ownerIndex) continue;
        const target = raceRuntime.cars[cIdx];
        const dx = target.worldPos.x - p.x;
        const dz = target.worldPos.z - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist < (p.radius || 2.2)) {
          p.active = false;
          applyWeaponHit(target, p, store);
          break;
        }
      }
    }

    // 7. Sort Positions Cleanly (Zero Flicker)
    const sortedIndices = raceRuntime.cars
      .map((c, idx) => ({ idx, prog: c.totalProgress }))
      .sort((a, b) => b.prog - a.prog);

    sortedIndices.forEach((item, rankZero) => {
      raceRuntime.cars[item.idx].positionRank = rankZero + 1;
    });

    // 8. Throttled HUD updates (~10 Hz)
    raceRuntime.hudTimer += dt;
    if (raceRuntime.hudTimer >= 1.0 / GAME_CONFIG.hudUpdateHz) {
      raceRuntime.hudTimer = 0;
      store.getState().clearExpiredFeedback();

      const nextPos = player.positionRank;
      const nextSpd = Math.round(player.speed * 2.5); // Format in km/h display
      const nextShield = player.shieldTimer > 0;
      const nextBoost = player.boostTimer > 0;

      if (
        state.position !== nextPos ||
        state.speedDisplay !== nextSpd ||
        state.shieldActive !== nextShield ||
        state.boostActive !== nextBoost
      ) {
        store.setState({
          position: nextPos,
          speedDisplay: nextSpd,
          shieldActive: nextShield,
          boostActive: nextBoost
        });
      }
    }
  });
}

function applyWeaponHit(targetCar, projectile, store) {
  _burstPos.copy(targetCar.worldPos);

  if (targetCar.shieldTimer > 0) {
    targetCar.shieldTimer = 0;
    raceRuntime.spawnParticleBurst(_burstPos, '#38f8ff', 24, 1.3, 'burst');
    soundEngine.playCorrectChime();
    if (targetCar.isPlayer) {
      store.getState().showFeedback('🛡️ SHIELD BLOCKED HIT!', 'shield', 1500, 'Weapon deflected!');
    }
    return;
  }

  targetCar.stunTimer = projectile.stunDuration || 1.5;
  targetCar.speed = Math.max(0, targetCar.speed * 0.2);
  raceRuntime.spawnParticleBurst(_burstPos, '#ff6d00', 28, 1.4, 'burst');
  soundEngine.playHitExplosion();

  if (targetCar.isPlayer) {
    raceRuntime.cameraShake = 0.9;
    store.getState().showFeedback('💥 HIT BY WEAPON!', 'hit', 1500, `Stunned for ${projectile.stunDuration}s!`);
  } else if (projectile.ownerIndex === 0) {
    store.getState().showFeedback(
      `🎯 SPUN OUT ${targetCar.name.toUpperCase()}!`,
      'correct',
      1500,
      `Stunned for ${projectile.stunDuration}s!`
    );
  }
}
