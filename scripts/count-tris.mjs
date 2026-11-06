import fs from 'fs';

function countTris(path) {
  const buf = fs.readFileSync(path);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  let totalIndices = 0;
  let totalPos = 0;
  if (gltf.accessors) {
    for (const a of gltf.accessors) {
      if (a.type === 'SCALAR' && a.count > 0) totalIndices += a.count;
      if (a.type === 'VEC3') totalPos += a.count;
    }
  }
  console.log(path, 'Total vertex count approx:', totalPos, 'Indices count approx:', totalIndices);
}

countTris('public/assets/environment/enviourment.glb');
countTris('public/assets/cars/car1.glb');
countTris('public/assets/cars/car2.glb');
countTris('public/assets/cars/car3.glb');

