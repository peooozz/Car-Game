import fs from 'fs';

const manifest = JSON.parse(fs.readFileSync('public/assets/manifest.json', 'utf8'));
manifest.environment = [];
fs.writeFileSync('public/assets/manifest.json', JSON.stringify(manifest, null, 2));
console.log('Manifest updated. Environment entries count:', manifest.environment.length);

