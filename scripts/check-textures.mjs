import fs from 'fs';

const buf = fs.readFileSync('public/assets/environment/enviourment.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

if (gltf.images) {
  gltf.images.forEach((img, i) => {
    const bv = gltf.bufferViews[img.bufferView];
    console.log(`Image ${i}: ${img.mimeType}, size: ${(bv.byteLength / (1024 * 1024)).toFixed(2)} MB`);
  });
}

