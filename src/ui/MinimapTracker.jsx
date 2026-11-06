/**
 * src/ui/MinimapTracker.jsx
 * Large, prominent 2D real-time circuit radar minimap.
 * Displays:
 * - Full circuit outline rendered dynamically from spline CatmullRomCurve3
 * - Checkered Start / Finish Line marker
 * - The 4 '?' Math Bubble Checkpoints with dynamic resolved/unresolved status
 * - Real-time animated blips for all 6 cars (Player = glowing golden star/beacon with direction pointer & "YOU" tag; AI rivals = color-coded dots)
 */
import React, { useRef, useEffect } from 'react';
import { raceRuntime, useGameStore } from '../store/gameStore';

export function MinimapTracker() {
  const canvasRef = useRef(null);
  const lap = useGameStore((s) => s.lap);
  const position = useGameStore((s) => s.position);

  useEffect(() => {
    let animId;

    const renderMinimap = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(renderMinimap);
        return;
      }

      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const curve = raceRuntime.curve;
      if (!curve || !raceRuntime.active) {
        animId = requestAnimationFrame(renderMinimap);
        return;
      }

      // Sample curve points for accurate 2D projection
      const sampleCount = 90;
      const points = [];
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

      for (let i = 0; i <= sampleCount; i++) {
        const pt = curve.getPointAt(i / sampleCount);
        points.push(pt);
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.z < minZ) minZ = pt.z;
        if (pt.z > maxZ) maxZ = pt.z;
      }

      const spanX = Math.max(1, maxX - minX);
      const spanZ = Math.max(1, maxZ - minZ);
      const pad = 24;
      const drawW = w - pad * 2;
      const drawH = h - pad * 2;
      const scale = Math.min(drawW / spanX, drawH / spanZ);
      const offsetX = pad + (drawW - spanX * scale) * 0.5;
      const offsetZ = pad + (drawH - spanZ * scale) * 0.5;

      const toCanvas = (x, z) => ({
        cx: offsetX + (x - minX) * scale,
        cy: offsetZ + (z - minZ) * scale
      });

      // 1. Draw Track Underlay / Curbs
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const { cx, cy } = toCanvas(points[i].x, points[i].z);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 2. Draw Track Surface
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const { cx, cy } = toCanvas(points[i].x, points[i].z);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.closePath();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 9;
      ctx.stroke();

      // 3. Draw Track Centerline (Neon Racing Groove)
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const { cx, cy } = toCanvas(points[i].x, points[i].z);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.closePath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // 4. Draw Start / Finish Line
      const startPt = curve.getPointAt(0);
      const startTan = curve.getTangentAt(0).normalize();
      const sPos = toCanvas(startPt.x, startPt.z);
      const normalX = -startTan.z;
      const normalZ = startTan.x;

      ctx.save();
      ctx.translate(sPos.cx, sPos.cy);
      ctx.beginPath();
      ctx.moveTo(-normalX * 7, -normalZ * 7);
      ctx.lineTo(normalX * 7, normalZ * 7);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Finish Flag Badge
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏁', normalX * 12, normalZ * 12);
      ctx.restore();

      // 5. Draw 4 '?' Math Bubble Checkpoints
      const zones = raceRuntime.zones || [];
      for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        const zPt = curve.getPointAt(zone.t % 1.0);
        const { cx, cy } = toCanvas(zPt.x, zPt.z);

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);

        if (zone.resolved) {
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.font = 'bold 9px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✓', cx, cy + 0.5);
        } else {
          // Pulsing glow for pending math bubbles
          const pulse = (Math.sin(performance.now() * 0.006 + i) + 1) * 0.5;
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2 + pulse * 1.5;
          ctx.stroke();
          ctx.font = '900 9px sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', cx, cy + 0.5);
        }
        ctx.restore();
      }

      // 6. Draw AI Rival Cars
      const cars = raceRuntime.cars || [];
      const aiColors = ['#ff4738', '#a855f7', '#3b82f6', '#10b981', '#f97316'];

      for (let i = 1; i < cars.length; i++) {
        const c = cars[i];
        if (!c.worldPos) continue;
        const { cx, cy } = toCanvas(c.worldPos.x, c.worldPos.z);
        const col = aiColors[(i - 1) % aiColors.length];

        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 7. Draw Player Car (Car 0) - Grand Glowing Marker
      const player = cars[0];
      if (player && player.worldPos) {
        const { cx, cy } = toCanvas(player.worldPos.x, player.worldPos.z);
        const time = performance.now() * 0.005;

        // Expanding radar beacon wave
        const beaconRadius = 7 + (time % 1) * 8;
        const beaconAlpha = Math.max(0, 1 - (time % 1));
        ctx.beginPath();
        ctx.arc(cx, cy, beaconRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(250, 204, 21, ${beaconAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Player Core Dot
        ctx.beginPath();
        ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#eab308';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Direction Pointer
        if (player.forward) {
          const dirX = player.forward.x;
          const dirZ = player.forward.z;
          const len = Math.hypot(dirX, dirZ) || 1;
          const nx = (dirX / len) * 8.5;
          const nz = (dirZ / len) * 8.5;

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + nx, cy + nz);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // "YOU" Label
        ctx.font = '900 10px "Baloo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText('YOU', cx, cy - 9);
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(renderMinimap);
    };

    animId = requestAnimationFrame(renderMinimap);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="minimap-tracker-card" title="Race Tracker & Circuit Radar">
      <div className="minimap-header">
        <span className="minimap-title">📡 TRACK RADAR</span>
        <span className="minimap-pos-badge">P{position}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={250}
        height={175}
        className="minimap-canvas"
      />
      <div className="minimap-footer">
        <span className="minimap-legend">
          <span className="legend-dot player-dot" /> YOU
        </span>
        <span className="minimap-legend">
          <span className="legend-dot rival-dot" /> RIVALS
        </span>
        <span className="minimap-legend">
          <span className="legend-dot bubble-dot" /> ? BUBBLE
        </span>
      </div>
    </div>
  );
}

