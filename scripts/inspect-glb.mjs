import fs from 'fs';

function inspectGlb(path) {
  const buf = fs.readFileSync(path);
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr);
  console.log(`=== ${path} ===`);
  console.log('Meshes:', gltf.meshes?.length || 0);
  console.log('Nodes:', gltf.nodes?.length || 0);
  console.log('Materials:', gltf.materials?.length || 0);
  console.log('Textures:', gltf.textures?.length || 0);
  console.log('Images:', gltf.images?.length || 0);
  if (gltf.meshes) {
    let totalPrimitives = 0;
    for (const m of gltf.meshes) {
      totalPrimitives += m.primitives?.length || 0;
    }
    console.log('Total Primitives:', totalPrimitives);
  }
}

inspectGlb('public/assets/environment/enviourment.glb');
inspectGlb('public/assets/cars/car1.glb');

