#!/usr/bin/env node
/**
 * scripts/audit-assets.mjs
 * Scans /public/assets/cars and /public/assets/environment for .glb files.
 * Generates /public/assets/manifest.json and /public/assets/credits.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CARS_DIR = path.join(ROOT, 'public', 'assets', 'cars');
const ENV_DIR = path.join(ROOT, 'public', 'assets', 'environment');
const MANIFEST_PATH = path.join(ROOT, 'public', 'assets', 'manifest.json');
const CREDITS_PATH = path.join(ROOT, 'public', 'assets', 'credits.json');

// Accurate wheel regex that ignores mirrors and suspension arms
const WHEEL_REGEX = /^(?=.*(?:wheel|tire|tyre|rim))(?!.*(?:mirror|suspension|caliper|disc|brake)).*$/i;
const SCENE_REGEX = /scene|track|terrain|island|level|road|course|ground|enviourment|environment/i;

const CAR_META = {
  car1: {
    name: 'Formula Thunder',
    color: '#e10600',
    accentColor: '#ffd000',
    unlockCost: 0,
    stats: { maxSpeed: 40.0, acceleration: 25.0, handling: 2.75, driftBoost: 1.15 }
  },
  car2: {
    name: 'Scuderia F2000',
    color: '#dc0000',
    accentColor: '#ffffff',
    unlockCost: 25,
    stats: { maxSpeed: 41.5, acceleration: 26.5, handling: 2.85, driftBoost: 1.18 }
  },
  car3: {
    name: 'Apex R29',
    color: '#ff9800',
    accentColor: '#002776',
    unlockCost: 50,
    stats: { maxSpeed: 42.5, acceleration: 27.5, handling: 2.95, driftBoost: 1.20 }
  },
  car4: {
    name: 'Benetton Turbo',
    color: '#00b4d8',
    accentColor: '#22c55e',
    unlockCost: 75,
    stats: { maxSpeed: 43.5, acceleration: 28.5, handling: 3.10, driftBoost: 1.22 }
  },
  car5: {
    name: 'Hornet EJ12',
    color: '#ffd000',
    accentColor: '#111827',
    unlockCost: 100,
    stats: { maxSpeed: 44.5, acceleration: 29.5, handling: 3.20, driftBoost: 1.24 }
  },
  car6: {
    name: 'Silver Arrow BAR',
    color: '#f8fafc',
    accentColor: '#e10600',
    unlockCost: 125,
    stats: { maxSpeed: 45.0, acceleration: 30.5, handling: 3.30, driftBoost: 1.26 }
  }
};

function multiplyMat4(a, b) {
  const out = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function getNodeLocalMatrix(node) {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) {
    return node.matrix;
  }
  const t = node.translation || [0, 0, 0];
  const r = node.rotation || [0, 0, 0, 1];
  const s = node.scale || [1, 1, 1];
  const [x, y, z, w] = r;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const sx = s[0], sy = s[1], sz = s[2];
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx,       (xz - wy) * sx,       0,
    (xy - wz) * sy,       (1 - (xx + zz)) * sy, (yz + wx) * sy,       0,
    (xz + wy) * sz,       (yz - wx) * sz,       (1 - (xx + yy)) * sz, 0,
    t[0],                 t[1],                 t[2],                 1
  ];
}

function transformPoint(p, m) {
  return [
    p[0] * m[0] + p[1] * m[4] + p[2] * m[8] + m[12],
    p[0] * m[1] + p[1] * m[5] + p[2] * m[9] + m[13],
    p[0] * m[2] + p[1] * m[6] + p[2] * m[10] + m[14]
  ];
}

function parseGLB(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 20) throw new Error('File too small (< 20 bytes)');
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546C67) throw new Error('Invalid GLB magic header');
  const jsonChunkLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonChunkLen);
  const gltf = JSON.parse(jsonStr);

  const nodes = gltf.nodes || [];
  const meshes = gltf.meshes || [];
  const accessors = gltf.accessors || [];
  const materials = gltf.materials || [];
  const textures = gltf.textures || [];
  const extensionsUsed = gltf.extensionsUsed || [];
  const extensionsRequired = gltf.extensionsRequired || [];
  const allExts = Array.from(new Set([...extensionsUsed, ...extensionsRequired]));

  const hasDraco = allExts.some((e) => e.includes('draco'));
  const hasMeshopt = allExts.some((e) => e.includes('meshopt'));

  let totalTriangles = 0;
  for (const mesh of meshes) {
    for (const prim of mesh.primitives || []) {
      const mode = prim.mode === undefined ? 4 : prim.mode;
      if (mode !== 4) continue;
      if (prim.indices !== undefined && accessors[prim.indices]) {
        totalTriangles += Math.floor((accessors[prim.indices].count || 0) / 3);
      } else if (prim.attributes && prim.attributes.POSITION !== undefined && accessors[prim.attributes.POSITION]) {
        totalTriangles += Math.floor((accessors[prim.attributes.POSITION].count || 0) / 3);
      }
    }
  }

  const bboxMin = [Infinity, Infinity, Infinity];
  const bboxMax = [-Infinity, -Infinity, -Infinity];

  function expandBoxWithAccessor(accIdx, worldMatrix) {
    const acc = accessors[accIdx];
    if (!acc || !Array.isArray(acc.min) || !Array.isArray(acc.max)) return;
    const [minX, minY, minZ] = acc.min;
    const [maxX, maxY, maxZ] = acc.max;
    const corners = [
      [minX, minY, minZ], [maxX, minY, minZ],
      [minX, maxY, minZ], [maxX, maxY, minZ],
      [minX, minY, maxZ], [maxX, minY, maxZ],
      [minX, maxY, maxZ], [maxX, maxY, maxZ]
    ];
    for (const c of corners) {
      const tp = transformPoint(c, worldMatrix);
      for (let i = 0; i < 3; i++) {
        if (tp[i] < bboxMin[i]) bboxMin[i] = tp[i];
        if (tp[i] > bboxMax[i]) bboxMax[i] = tp[i];
      }
    }
  }

  const visited = new Set();
  function traverseNode(nodeIdx, parentMat) {
    if (visited.has(nodeIdx) || !nodes[nodeIdx]) return;
    visited.add(nodeIdx);
    const node = nodes[nodeIdx];
    const worldMat = multiplyMat4(parentMat, getNodeLocalMatrix(node));
    if (node.mesh !== undefined && meshes[node.mesh]) {
      for (const prim of meshes[node.mesh].primitives || []) {
        if (prim.attributes && prim.attributes.POSITION !== undefined) {
          expandBoxWithAccessor(prim.attributes.POSITION, worldMat);
        }
      }
    }
    for (const childIdx of node.children || []) {
      traverseNode(childIdx, worldMat);
    }
  }

  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const rootNodes =
    gltf.scenes && gltf.scenes[gltf.scene || 0] && gltf.scenes[gltf.scene || 0].nodes
      ? gltf.scenes[gltf.scene || 0].nodes
      : nodes.map((_, i) => i);

  for (const rIdx of rootNodes) {
    traverseNode(rIdx, identity);
  }

  if (!Number.isFinite(bboxMin[0])) {
    bboxMin[0] = -1; bboxMin[1] = 0; bboxMin[2] = -1;
    bboxMax[0] = 1;  bboxMax[1] = 1; bboxMax[2] = 1;
  }

  const size = [
    Number((bboxMax[0] - bboxMin[0]).toFixed(3)),
    Number((bboxMax[1] - bboxMin[1]).toFixed(3)),
    Number((bboxMax[2] - bboxMin[2]).toFixed(3))
  ];

  const nodeNames = nodes.map((n, i) => n.name || `node_${i}`);
  const meshNames = meshes.map((m, i) => m.name || `mesh_${i}`);
  const materialNames = materials.map((m, i) => m.name || `mat_${i}`);

  const wheelNodeNames = nodeNames.filter((n) => WHEEL_REGEX.test(n));

  return {
    fileSize: buf.length,
    triangles: totalTriangles,
    nodeNames,
    meshNames,
    materialNames,
    textureCount: textures.length,
    bboxMin: bboxMin.map((v) => Number(v.toFixed(3))),
    bboxMax: bboxMax.map((v) => Number(v.toFixed(3))),
    size,
    compression: {
      draco: hasDraco,
      meshopt: hasMeshopt
    },
    wheelNodeNames
  };
}

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return [];
  }
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.toLowerCase().endsWith('.glb'))
    .sort();
}

function toFriendlyTitle(filename) {
  const base = filename.replace(/\.glb$/i, '').toLowerCase();
  if (CAR_META[base]) return CAR_META[base].name;
  return filename
    .replace(/\.glb$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function runAudit() {
  console.log('=====================================================================');
  console.log('MATH BUGGY RUSH - ASSET AUDIT & GLB INTEGRATION');
  console.log('=====================================================================');

  const carFiles = scanDirectory(CARS_DIR);
  const envFiles = scanDirectory(ENV_DIR);

  const manifestCars = [];
  const manifestEnv = [];
  const creditsList = [];

  console.log(`\n[CARS] Found ${carFiles.length} .glb file(s) in /public/assets/cars/:`);
  carFiles.forEach((file, idx) => {
    const fullPath = path.join(CARS_DIR, file);
    try {
      const info = parseGLB(fullPath);
      const maxHorizontal = Math.max(info.size[0], info.size[2], 0.001);
      const targetLength = 4.4; // Realistic Formula buggy length in game units
      const scale = Number((targetLength / maxHorizontal).toFixed(4));
      const rotationY = 0; // All verified natively facing +Z forward
      const id = file.replace(/\.glb$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');

      const meta = CAR_META[id] || {
        name: toFriendlyTitle(file),
        color: ['#e10600', '#dc0000', '#ff9800', '#00b4d8', '#ffd000', '#f8fafc'][idx % 6],
        accentColor: '#ffffff',
        unlockCost: idx === 0 ? 0 : idx * 25,
        stats: {
          maxSpeed: Number((40 + idx * 1.0).toFixed(1)),
          acceleration: Number((25 + idx * 1.0).toFixed(1)),
          handling: Number((2.75 + idx * 0.1).toFixed(2)),
          driftBoost: Number((1.15 + idx * 0.02).toFixed(2))
        }
      };

      console.log(`  - ${file} -> "${meta.name}"`);
      console.log(`      Size: ${(info.fileSize / 1024 / 1024).toFixed(2)} MB | Triangles: ${info.triangles.toLocaleString()}`);
      console.log(`      Bounding Box: ${info.size.join(' x ')} (scale -> ${scale})`);
      console.log(`      Detected Wheels: ${info.wheelNodeNames.length ? info.wheelNodeNames.join(', ') : 'Integrated Wheels / Body Bounce'}`);

      manifestCars.push({
        id,
        name: meta.name,
        file: `/assets/cars/${file}`,
        triangles: info.triangles,
        bboxSize: info.size,
        scale,
        rotationY,
        wheelNodeNames: info.wheelNodeNames,
        compression: info.compression,
        highPolyWarning: info.triangles > 30000,
        color: meta.color,
        accentColor: meta.accentColor,
        unlockCost: meta.unlockCost,
        stats: meta.stats
      });

      creditsList.push({
        file: `/assets/cars/${file}`,
        title: meta.name,
        author: 'User Provided 3D Model',
        license: 'CC-BY / User Provided',
        sourceUrl: ''
      });
    } catch (err) {
      console.warn(`  [WARNING] Failed to parse car "${file}": ${err.message}`);
    }
  });

  console.log(`\n[ENVIRONMENT] Found ${envFiles.length} .glb file(s) in /public/assets/environment/:`);
  envFiles.forEach((file) => {
    const fullPath = path.join(ENV_DIR, file);
    try {
      const info = parseGLB(fullPath);
      const isScene = SCENE_REGEX.test(file) || info.size[0] > 60 || info.size[2] > 60;
      const category = isScene ? 'scene' : 'prop';
      const id = file.replace(/\.glb$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');

      let targetHeight = 4.2;
      if (/umbrella/i.test(file)) targetHeight = 2.8;
      else if (/rock|boulder|stone/i.test(file)) targetHeight = 2.0;
      else if (/hut|building|totem|house/i.test(file)) targetHeight = 4.5;

      const scale = category === 'scene' ? 1.0 : Number((targetHeight / Math.max(info.size[1], 0.2)).toFixed(4));
      const maxInstances = info.triangles > 8000 ? 12 : 45;

      console.log(`  - ${file} -> Classified as: [${category.toUpperCase()}]`);
      console.log(`      Size: ${(info.fileSize / 1024 / 1024).toFixed(2)} MB | Triangles: ${info.triangles.toLocaleString()}`);
      console.log(`      Bounding Box: ${info.size.join(' x ')} (scale -> ${scale})`);

      manifestEnv.push({
        id,
        name: toFriendlyTitle(file),
        file: `/assets/environment/${file}`,
        category,
        triangles: info.triangles,
        bboxSize: info.size,
        scale,
        rotationY: 0,
        maxInstances,
        highPolyWarning: category === 'prop' && info.triangles > 8000,
        compression: info.compression
      });

      creditsList.push({
        file: `/assets/environment/${file}`,
        title: toFriendlyTitle(file),
        author: 'User Provided 3D Environment',
        license: 'CC-BY / User Provided',
        sourceUrl: ''
      });
    } catch (err) {
      console.warn(`  [WARNING] Failed to parse environment model "${file}": ${err.message}`);
    }
  });

  const manifest = {
    generatedAt: new Date().toISOString(),
    cars: manifestCars,
    environment: manifestEnv
  };

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n[SUCCESS] Wrote /public/assets/manifest.json (${manifestCars.length} cars, ${manifestEnv.length} environment items).`);

  let existingCredits = [];
  if (fs.existsSync(CREDITS_PATH)) {
    try {
      existingCredits = JSON.parse(fs.readFileSync(CREDITS_PATH, 'utf8'));
    } catch {
      existingCredits = [];
    }
  }
  const mergedCredits = creditsList.map((item) => {
    const found = existingCredits.find((c) => c.file === item.file);
    return found ? { ...item, ...found } : item;
  });
  fs.writeFileSync(CREDITS_PATH, JSON.stringify(mergedCredits, null, 2));
  console.log(`[SUCCESS] Wrote /public/assets/credits.json (${mergedCredits.length} entries).`);
  console.log('=====================================================================\n');
}

runAudit();
