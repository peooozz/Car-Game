import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { normalizeModel } from '../src/assets/normalizeModel.js';
import { DEFAULT_MANIFEST } from '../src/assets/manifest.js';

globalThis.self = globalThis;
globalThis.window = globalThis;
if (!globalThis.createImageBitmap) {
  globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });
}

class MockSpecularGlossiness {
  constructor(parser) { this.parser = parser; this.name = 'KHR_materials_pbrSpecularGlossiness'; }
  loadMaterial() { return Promise.resolve(new THREE.MeshStandardMaterial({ color: 0xcccccc })); }
}

async function verifyAll() {
  console.log('Verifying all 6 cars against DEFAULT_MANIFEST...\n');
  const loader = new GLTFLoader();
  loader.register((parser) => new MockSpecularGlossiness(parser));

  for (const car of DEFAULT_MANIFEST.cars) {
    const fullPath = path.resolve('public' + car.file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Car file missing: ${fullPath}`);
    }
    const buf = fs.readFileSync(fullPath);
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    await new Promise((resolve, reject) => {
      loader.parse(arrayBuffer, '', (gltf) => {
        try {
          const norm = normalizeModel(gltf.scene, {
            targetLength: 4.4,
            manifestScale: car.scale,
            manifestRotationY: car.rotationY,
            wheelNodeNames: car.wheelNodeNames,
            isCar: true
          });

          console.log(`✅ [${car.id}] "${car.name}"`);
          console.log(`   Dimensions: width=${norm.size.x.toFixed(2)}m, height=${norm.size.y.toFixed(2)}m, length=${norm.size.z.toFixed(2)}m`);
          console.log(`   Ground elevation: Y min=${norm.bbox.min.y.toFixed(3)}m, max=${norm.bbox.max.y.toFixed(3)}m`);
          console.log(`   Wheel pivots: ${norm.wheelPivots.length} wheels detected`);
          norm.wheelPivots.forEach(w => {
            console.log(`     - ${w.name}: isFront=${w.isFront}, isLeft=${w.isLeft}`);
          });
          console.log('');
          resolve();
        } catch (e) {
          reject(e);
        }
      }, reject);
    });
  }
  console.log('All 6 cars successfully verified!');
}

verifyAll().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});

