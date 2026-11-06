/**
 * src/game/roadTextures.js
 * Generates custom procedural canvas textures for the cartoon town world:
 * - Yellow Brick / Cobblestone Road texture with bevel highlights & border curbs
 * - Vibrant stylized Cartoon Grass texture with soft tonal variation
 * - Checkered Start/Finish Line texture
 */
import * as THREE from 'three';

let cachedRoadTex = null;
let cachedGrassTex = null;
let cachedCheckerTex = null;

export function getYellowBrickRoadTexture() {
  if (cachedRoadTex) return cachedRoadTex;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. Mortar base background (warm deep amber)
  ctx.fillStyle = '#92400e';
  ctx.fillRect(0, 0, 512, 512);

  // 2. Cobblestone brick rows
  const rows = 16;
  const rowHeight = 512 / rows;
  const cols = 8;
  const colWidth = 512 / cols;

  const palette = ['#fde047', '#facc15', '#eab308', '#f59e0b', '#ca8a04', '#fed7aa'];

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    const isStaggered = r % 2 === 1;
    const xOffset = isStaggered ? colWidth * 0.5 : 0;

    for (let c = -1; c <= cols + 1; c++) {
      const x = c * colWidth + xOffset;
      const seed = Math.sin(r * 127.1 + c * 311.7) * 43758.5453;
      const colIdx = Math.floor(Math.abs(seed) % palette.length);
      const stoneColor = palette[colIdx];

      const padX = 3;
      const padY = 3.5;
      const stoneW = colWidth - padX * 2;
      const stoneH = rowHeight - padY * 2;
      const radius = 6;

      // Draw rounded cobblestone
      ctx.fillStyle = stoneColor;
      ctx.beginPath();
      ctx.roundRect(x + padX, y + padY, stoneW, stoneH, radius);
      ctx.fill();

      // Top-left soft highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + padX + radius, y + padY + 1);
      ctx.lineTo(x + padX + stoneW - radius, y + padY + 1);
      ctx.stroke();

      // Bottom-right soft shadow
      ctx.strokeStyle = 'rgba(113, 63, 18, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + padX + radius, y + padY + stoneH - 1);
      ctx.lineTo(x + padX + stoneW - radius, y + padY + stoneH - 1);
      ctx.stroke();
    }
  }

  // 3. Side Curb Edges (Left and Right borders of the road ribbon)
  const curbWidth = 32;
  // Left border
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, curbWidth, 512);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(curbWidth - 4, 0, 4, 512);
  // Right border
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(512 - curbWidth, 0, curbWidth, 512);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(512 - curbWidth, 0, 4, 512);

  // Curb stone lines
  ctx.strokeStyle = 'rgba(113, 63, 18, 0.7)';
  ctx.lineWidth = 3;
  for (let y = 0; y < 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(curbWidth, y);
    ctx.moveTo(512 - curbWidth, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 48);

  cachedRoadTex = tex;
  return tex;
}

export function getCartoonGrassTexture() {
  if (cachedGrassTex) return cachedGrassTex;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base grass green
  ctx.fillStyle = '#52b724';
  ctx.fillRect(0, 0, 512, 512);

  // Soft cartoon dappled grass patches
  const patches = [
    { x: 120, y: 140, r: 90, color: '#65c432' },
    { x: 380, y: 110, r: 110, color: '#449f1e' },
    { x: 260, y: 340, r: 125, color: '#60c02f' },
    { x: 420, y: 400, r: 85, color: '#419a1b' },
    { x: 80, y: 420, r: 95, color: '#68c735' }
  ];

  patches.forEach((p) => {
    const grad = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, p.r);
    grad.addColorStop(0, p.color);
    grad.addColorStop(1, 'rgba(82, 183, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Stylized cartoon flower specks (tiny daisies)
  for (let i = 0; i < 48; i++) {
    const fx = (i * 97) % 512;
    const fy = (i * 139) % 512;
    const isYellow = i % 2 === 0;

    // Petals
    ctx.fillStyle = isYellow ? '#fef08a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(fx, fy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Center
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);

  cachedGrassTex = tex;
  return tex;
}

export function getCartoonCheckerTexture() {
  if (cachedCheckerTex) return cachedCheckerTex;

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
      ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#1e293b';
      ctx.fillRect(c * cw, r * ch, cw, ch);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  cachedCheckerTex = tex;
  return tex;
}

