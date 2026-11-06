/**
 * src/game/Track.jsx
 * Generates the ribbon-mesh road following the CatmullRomCurve3 spline with 3D elevation,
 * alternating curbs, start/finish checker arch, jump ramps, and glowing lava patches.
 */
import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { TRACKS } from '../config';
import { buildTrackCurve, useGameStore } from '../store/gameStore';
import { getYellowBrickRoadTexture, getCartoonCheckerTexture } from './roadTextures';

function createCheckerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const cols = 16;
  const rows = 4;
  const cw = canvas.width / cols;
  const ch = canvas.height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#111827';
      ctx.fillRect(c * cw, r * ch, cw, ch);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createFinishBillboardTexture(trackName = 'TOON TOWN SPEEDWAY') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background carbon with neon frame
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 256);

  // Top & bottom checkered racing stripes
  const cols = 32;
  const cw = 1024 / cols;
  for (let c = 0; c < cols; c++) {
    ctx.fillStyle = c % 2 === 0 ? '#ffffff' : '#1e293b';
    ctx.fillRect(c * cw, 0, cw, 24);
    ctx.fillRect(c * cw, 232, cw, 24);
  }

  // Golden inner border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 28, 1000, 200);

  // Glow text
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 18;
  ctx.font = '900 84px "Baloo 2", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🏁 START / FINISH 🏁', 512, 115);
  ctx.shadowBlur = 0;

  // Track name subtitle
  ctx.font = '700 32px "Baloo 2", sans-serif';
  ctx.fillStyle = '#fde047';
  ctx.fillText(trackName.toUpperCase(), 512, 185);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Track() {
  const selectedTrackIndex = useGameStore((s) => s.selectedTrackIndex);
  const debugMode = useGameStore((s) => s.debugMode);
  const countdown = useGameStore((s) => s.countdown);
  const track = TRACKS[selectedTrackIndex] || TRACKS[0];

  const trackData = useMemo(() => {
    const curve = buildTrackCurve(track);
    const segments = 360;
    const halfWidth = track.trackWidth * 0.5;
    const curbWidth = 1.25;

    const roadPositions = [];
    const roadNormals = [];
    const roadUvs = [];
    const roadIndices = [];

    const curbPositions = [];
    const curbNormals = [];
    const curbColors = [];
    const curbIndices = [];

    const debugPoints = [];

    const up = new THREE.Vector3(0, 1, 0);
    const cRed = new THREE.Color(track.roadEdgeColor || '#ff4738');
    const cWhite = new THREE.Color('#ffffff');

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, up).normalize();

      debugPoints.push(pt.clone().add(new THREE.Vector3(0, 0.45, 0)));

      const leftEdge = pt.clone().addScaledVector(right, -halfWidth);
      const rightEdge = pt.clone().addScaledVector(right, halfWidth);

      // Sits smoothly above the terrain/tarmac
      const yRoad = pt.y + 0.05;
      const yCurb = pt.y + 0.12;

      roadPositions.push(leftEdge.x, yRoad, leftEdge.z);
      roadPositions.push(rightEdge.x, yRoad, rightEdge.z);
      roadNormals.push(0, 1, 0, 0, 1, 0);
      roadUvs.push(0, t * 65, 1, t * 65);

      if (i < segments) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        roadIndices.push(a, b, c, b, d, c);
      }

      // Left & Right raised curbs
      const leftOuter = pt.clone().addScaledVector(right, -(halfWidth + curbWidth));
      const rightOuter = pt.clone().addScaledVector(right, halfWidth + curbWidth);
      const stripeCol = Math.floor(i / 2) % 2 === 0 ? cRed : cWhite;

      curbPositions.push(
        leftOuter.x, yCurb, leftOuter.z,
        leftEdge.x, yCurb, leftEdge.z,
        rightEdge.x, yCurb, rightEdge.z,
        rightOuter.x, yCurb, rightOuter.z
      );
      for (let k = 0; k < 4; k++) {
        curbNormals.push(0, 1, 0);
        curbColors.push(stripeCol.r, stripeCol.g, stripeCol.b);
      }

      if (i < segments) {
        const base = i * 4;
        curbIndices.push(base, base + 1, base + 4, base + 1, base + 5, base + 4);
        curbIndices.push(base + 2, base + 3, base + 6, base + 3, base + 7, base + 6);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);

    const curbGeo = new THREE.BufferGeometry();
    curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    curbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNormals, 3));
    curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
    curbGeo.setIndex(curbIndices);

    const debugLineGeo = new THREE.BufferGeometry().setFromPoints(debugPoints);

    // Start / Finish transform at t = 0
    const startPt = curve.getPointAt(0);
    const startTan = curve.getTangentAt(0).normalize();
    const startYaw = Math.atan2(startTan.x, startTan.z);

    // Ramps transforms
    const rampTransforms = (track.ramps || []).map((rt) => {
      const p = curve.getPointAt(rt);
      const t = curve.getTangentAt(rt).normalize();
      return {
        position: [p.x, p.y + 0.05, p.z],
        rotation: [0, Math.atan2(t.x, t.z), 0]
      };
    });

    // Lava patches transforms
    const lavaTransforms = (track.lavaPatches || []).map((lp) => {
      const p = curve.getPointAt(lp.t);
      const t = curve.getTangentAt(lp.t).normalize();
      const right = new THREE.Vector3(t.z, 0, -t.x).normalize();
      p.addScaledVector(right, lp.offset * halfWidth);
      return {
        position: [p.x, p.y + 0.07, p.z],
        radius: lp.radius || 3.4
      };
    });

    const checkerTex = getCartoonCheckerTexture();
    const roadTex = getYellowBrickRoadTexture();
    const billboardTex = createFinishBillboardTexture(track.name);

    return {
      roadGeo,
      curbGeo,
      debugLineGeo,
      startPos: [startPt.x, startPt.y + 0.06, startPt.z],
      startYaw,
      rampTransforms,
      lavaTransforms,
      checkerTex,
      roadTex,
      billboardTex
    };
  }, [track]);

  useEffect(() => {
    return () => {
      trackData.roadGeo.dispose();
      trackData.curbGeo.dispose();
      trackData.debugLineGeo.dispose();
    };
  }, [trackData]);

  const halfW = track.trackWidth * 0.5;

  return (
    <group name="TrackGroup">
      {/* Main Yellow Brick Road Ribbon */}
      <mesh geometry={trackData.roadGeo}>
        <meshStandardMaterial
          map={trackData.roadTex}
          color={track.roadColor || '#ffffff'}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Road Edge Curbs */}
      <mesh geometry={trackData.curbGeo}>
        <meshStandardMaterial vertexColors roughness={0.55} />
      </mesh>

      {/* Grand Championship Start / Finish Line & Gantry */}
      <group position={trackData.startPos} rotation={[0, trackData.startYaw, 0]}>
        {/* 1. Grand Checkered Ground Finish Line (8m long, spanning full road + curbs) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[track.trackWidth + 2.5, 8.0]} />
          <meshStandardMaterial map={trackData.checkerTex} roughness={0.4} />
        </mesh>

        {/* Golden Metallic Border Beams on Ground */}
        <mesh position={[0, 0.05, -4.0]}>
          <boxGeometry args={[track.trackWidth + 2.7, 0.1, 0.35]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.05, 4.0]}>
          <boxGeometry args={[track.trackWidth + 2.7, 0.1, 0.35]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.2} />
        </mesh>

        {/* 6 Marked Starting Grid Slots on Road Ahead */}
        {[-halfW * 0.5, halfW * 0.5].map((gx, colIdx) =>
          [-8.0, -14.0, -20.0].map((gz, rowIdx) => {
            const gridNum = rowIdx * 2 + colIdx + 1;
            return (
              <group key={`grid_${gridNum}`} position={[gx, 0.03, gz]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[4.8, 4.8]} />
                  <meshBasicMaterial color="#ffffff" wireframe />
                </mesh>
              </group>
            );
          })
        )}

        {/* 2. Twin Grand Lattice Truss Towers (11.5m tall) */}
        {[-halfW - 1.2, halfW + 1.2].map((tx, tidx) => (
          <group key={`tower_${tidx}`} position={[tx, 0, 0]}>
            {/* Concrete & Gold Pedestal Foundation */}
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[1.3, 1.5, 1.2, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.3, 0]}>
              <cylinderGeometry args={[1.1, 1.3, 0.4, 12]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
            </mesh>

            {/* Main Candy-Striped Tower Column */}
            <mesh position={[0, 5.8, 0]}>
              <cylinderGeometry args={[0.55, 0.65, 8.8, 16]} />
              <meshStandardMaterial color="#dc2626" roughness={0.4} />
            </mesh>
            {/* Spiral Golden Ribs on Tower */}
            {[2.5, 4.5, 6.5, 8.5].map((ry, ridx) => (
              <mesh key={`rib_${ridx}`} position={[0, ry, 0]}>
                <torusGeometry args={[0.62, 0.1, 8, 16]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.3} />
              </mesh>
            ))}

            {/* Spotlight Pod pointing down to track */}
            <mesh position={[tidx === 0 ? 0.8 : -0.8, 9.6, 0]} rotation={[0, 0, tidx === 0 ? -0.4 : 0.4]}>
              <cylinderGeometry args={[0.35, 0.5, 0.8, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>

            {/* Golden Championship Trophy on Top */}
            <group position={[0, 10.6, 0]}>
              <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.55, 0.35, 0.6, 10]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.15} />
              </mesh>
              <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.45, 12, 12]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          </group>
        ))}

        {/* 3. Massive Overhead Championship Crossbar Truss */}
        <group position={[0, 8.8, 0]}>
          {/* Main Crossbar Beam */}
          <mesh>
            <boxGeometry args={[track.trackWidth + 3.4, 1.6, 1.2]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
          {/* Upper Golden Truss Bar */}
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[track.trackWidth + 3.8, 0.35, 1.4]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Lower Golden Truss Bar */}
          <mesh position={[0, -0.95, 0]}>
            <boxGeometry args={[track.trackWidth + 3.8, 0.35, 1.4]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.3} />
          </mesh>

          {/* 4. Center Illuminated 3D Billboard (Facing Approaching Cars) */}
          <mesh position={[0, 0.05, 0.65]}>
            <planeGeometry args={[Math.min(26.0, track.trackWidth * 0.72), 2.4]} />
            <meshBasicMaterial map={trackData.billboardTex} />
          </mesh>
          {/* Backside Billboard */}
          <mesh position={[0, 0.05, -0.65]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[Math.min(26.0, track.trackWidth * 0.72), 2.4]} />
            <meshBasicMaterial map={trackData.billboardTex} />
          </mesh>

          {/* 5. Formula 1 Style Start Lights (5 Pods Under Crossbar) */}
          {[-4.0, -2.0, 0, 2.0, 4.0].map((lx, lidx) => {
            const isRed = countdown > 0;
            const isGreen = countdown === 0;
            const lightColor = isRed ? '#ef4444' : isGreen ? '#22c55e' : '#10b981';
            const emissiveColor = isRed ? '#ff0000' : isGreen ? '#00ff44' : '#059669';
            const emissiveIntensity = countdown >= 0 ? 2.5 : 1.2;

            return (
              <group key={`light_${lidx}`} position={[lx, -1.35, 0]}>
                {/* Pod Housing */}
                <mesh>
                  <cylinderGeometry args={[0.38, 0.42, 0.5, 10]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.7} />
                </mesh>
                {/* Glowing LED Lens */}
                <mesh position={[0, -0.26, 0]}>
                  <sphereGeometry args={[0.3, 12, 12]} />
                  <meshStandardMaterial
                    color={lightColor}
                    emissive={emissiveColor}
                    emissiveIntensity={emissiveIntensity}
                    roughness={0.2}
                  />
                </mesh>
              </group>
            );
          })}

          {/* 6. Colorful Cartoon Flutter Flags on Top of Gantry */}
          {[-halfW, -halfW * 0.65, -halfW * 0.35, 0, halfW * 0.35, halfW * 0.65, halfW].map((fx, idx) => (
            <group key={`flag_${idx}`} position={[fx, 1.15, 0]}>
              {/* Flagpole */}
              <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* Waving Fabric */}
              <mesh position={[0.45, 1.25, 0]}>
                <boxGeometry args={[0.85, 0.55, 0.06]} />
                <meshBasicMaterial
                  color={
                    ['#ef4444', '#3b82f6', '#facc15', '#10b981', '#ec4899', '#8b5cf6', '#f97316'][
                      idx % 7
                    ]
                  }
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* Jump Ramps (Track 3 & 4) */}
      {trackData.rampTransforms.map((rmp, idx) => (
        <group key={`ramp_${idx}`} position={rmp.position} rotation={rmp.rotation}>
          <mesh position={[0, 0.45, 0]} rotation={[-0.22, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[track.trackWidth * 0.55, 0.9, 4.5]} />
            <meshStandardMaterial color="#ff9f1c" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Lava Patches (Track 4 Volcano Beach) */}
      {trackData.lavaTransforms.map((lv, idx) => (
        <mesh
          key={`lava_${idx}`}
          position={lv.position}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[lv.radius, 20]} />
          <meshBasicMaterial color="#ff3d00" />
        </mesh>
      ))}

      {/* F2 Debug Mode Overlay: Spline Curve + Control Point Spheres */}
      {debugMode && (
        <group name="TrackDebugOverlay">
          <line geometry={trackData.debugLineGeo}>
            <lineBasicMaterial color="#00ffcc" linewidth={3} />
          </line>
          {track.controlPoints.map((cp, idx) => (
            <mesh key={`cp_${idx}`} position={[cp[0], cp[1] + 0.8, cp[2]]}>
              <sphereGeometry args={[0.9, 10, 10]} />
              <meshBasicMaterial color="#ff00ff" wireframe />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
