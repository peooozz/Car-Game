#!/usr/bin/env node
/**
 * scripts/import-drive-zip.mjs
 * Automatically extracts a local 3d.zip archive (e.g. downloaded from Google Drive),
 * classifies every .glb / .gltf inside into /public/assets/cars/ or /public/assets/environment/,
 * and runs scripts/audit-assets.mjs to regenerate /public/assets/manifest.json & credits.json.
 *
 * Usage:
 *   npm run import-zip -- /path/to/3d.zip
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CARS_DIR = path.join(ROOT, 'public', 'assets', 'cars');
const ENV_DIR = path.join(ROOT, 'public', 'assets', 'environment');
const TMP_DIR = path.join(ROOT, '.tmp_3d_extract');

const CAR_NAME_REGEX = /car|buggy|kart|truck|van|suv|jeep|vehicle|racer|taxi|police|ambulance|tractor|bus|sedan|coupe|hatchback|pickup|monster|formula|hotrod|wheel_fl/i;

function walkFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, result);
    } else if (entry.name.toLowerCase().endsWith('.glb')) {
      result.push(full);
    }
  }
  return result;
}

function classifyGLB(filePath) {
  const rel = filePath.toLowerCase();
  if (rel.includes('/cars/') || rel.includes('\\cars\\') || rel.includes('vehicle')) {
    return 'car';
  }
  if (rel.includes('/environment/') || rel.includes('/env/') || rel.includes('/props/') || rel.includes('/track/')) {
    return 'environment';
  }
  const baseName = path.basename(filePath).toLowerCase();
  if (CAR_NAME_REGEX.test(baseName)) {
    return 'car';
  }
  // Inspect GLB JSON chunk for wheel node names
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length >= 20 && buf.readUInt32LE(0) === 0x46546C67) {
      const jsonLen = buf.readUInt32LE(12);
      const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
      if (/"name"\s*:\s*"[^"]*(wheel|tire|tyre|chassis|steering|suspension)[^"]*"/i.test(jsonStr)) {
        return 'car';
      }
    }
  } catch {
    // Fallback
  }
  return 'environment';
}

function main() {
  const argPath = process.argv[2] || path.join(ROOT, '3d.zip');
  const zipPath = path.resolve(argPath);

  if (!fs.existsSync(zipPath)) {
    console.error(`[import-zip] Could not find zip file at: ${zipPath}`);
    console.error('Usage: npm run import-zip -- /path/to/3d.zip');
    process.exit(1);
  }

  console.log(`[import-zip] Extracting "${zipPath}"...`);
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  try {
    if (process.platform === 'win32') {
      execFileSync('powershell', [
        '-NoProfile',
        '-Command',
        `Expand-Archive -LiteralPath "${zipPath}" -DestinationPath "${TMP_DIR}" -Force`
      ], { stdio: 'inherit' });
    } else {
      execFileSync('unzip', ['-q', '-o', zipPath, '-d', TMP_DIR], { stdio: 'inherit' });
    }
  } catch (err) {
    console.error('[import-zip] Failed to unzip archive:', err.message);
    process.exit(1);
  }

  const glbFiles = walkFiles(TMP_DIR);
  console.log(`[import-zip] Found ${glbFiles.length} .glb file(s) inside archive.`);

  fs.mkdirSync(CARS_DIR, { recursive: true });
  fs.mkdirSync(ENV_DIR, { recursive: true });

  let carCount = 0;
  let envCount = 0;

  for (const srcFile of glbFiles) {
    const kind = classifyGLB(srcFile);
    const fileName = path.basename(srcFile).replace(/\s+/g, '_');
    const destDir = kind === 'car' ? CARS_DIR : ENV_DIR;
    const destPath = path.join(destDir, fileName);
    fs.copyFileSync(srcFile, destPath);
    if (kind === 'car') {
      carCount++;
      console.log(`  -> [CAR]         public/assets/cars/${fileName}`);
    } else {
      envCount++;
      console.log(`  -> [ENVIRONMENT] public/assets/environment/${fileName}`);
    }
  }

  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log(`[import-zip] Imported ${carCount} car(s) and ${envCount} environment model(s). Running asset audit...\n`);

  const auditRes = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'audit-assets.mjs')], {
    stdio: 'inherit'
  });
  process.exit(auditRes.status || 0);
}

main();
